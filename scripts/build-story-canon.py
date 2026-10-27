#!/usr/bin/env python3
"""개선본 정본 텍스트의 ① 스토리모드(프롤로그~최종장)를 게임 장면 데이터로 바꾼다.

출력: r96/client-source/story-canon-r106-data.js (window.__STORYWORLD_STORY_CANON_R106__)
- 문단은 정본의 빈 줄 단위 문단을 그대로 쓴다(문단 안 줄바꿈 보존).
- 구역마다 [NN · zoneId] 제목과 화자(〈…의 기억〉) 블록을 그대로 나눈다.
- 전투 전/후(pre/post, cult04 는 pre/firstPost/awakenPre/post, 09 는 ep1a09·ep1a09b 네 묶음)는
  기존 게임이 같은 장면을 보여 주던 위치와 문장 유사도로 맞춘 경계에서 나눈다(정본 문장은 고치지 않는다).
사용: python3 scripts/build-story-canon.py <정본.txt> r96/runtime-text/index.html r96/client-source/story-canon-r106-data.js [--report 경계표.md]
"""
import sys, re, json, hashlib, argparse, difflib
from collections import OrderedDict

NARR=re.compile(r'^〈(.+)〉$')
ZONE=re.compile(r'^\[(\d\d) · ([A-Za-z0-9]+)\] (.+)$')
PART=re.compile(r'^제[1-8]부 — ')

def canon_story(text):
    lines=text.split('\n')
    # 차례 목록이 아니라 화자 줄이 바로 뒤따르는 실제 프롤로그 제목에서 시작한다
    i0=next(i for i,l in enumerate(lines) if l.strip()=='프롤로그 — 남아 있는 기억' and NARR.match(lines[i+1].strip() if i+1<len(lines) else ''))
    i1=next(i for i in range(i0,len(lines)) if lines[i].strip().startswith('② 사몽') and lines[i-1].strip().startswith('─'))-1
    seg=lines[i0:i1]
    # 빈 줄 기준 문단 만들기(문단 안 줄바꿈 보존)
    paras=[];buf=[];start=None
    for k,l in enumerate(seg):
        s=l.rstrip()
        if s.strip()=='' :
            if buf: paras.append((start,'\n'.join(buf)));buf=[]
            continue
        if not buf: start=i0+k+1
        buf.append(s.strip())
    if buf: paras.append((start,'\n'.join(buf)))
    # 제목 줄이 같은 문단 첫 줄에 붙어 있으면 떼어 낸다
    items=[]
    for ln,p in paras:
        ls=p.split('\n')
        # 소제목 바로 아래 화자 줄(예: 한이경의 진술서 / 〈한이경의 기억〉)은 화자를 먼저 열고 소제목을 그 블록 첫 문단으로 둔다
        j=next((k for k,x in enumerate(ls) if k>0 and NARR.match(x)),None)
        known=lambda x:ZONE.match(x) or PART.match(x) or x in('프롤로그 — 남아 있는 기억','최종장 — 남겨진 몽세') or re.match(r'^음성 [12] — ',x) or x.startswith('─')
        if j is not None and not any(known(x) for x in ls[:j]):
            items.append(('head',ln+j,ls[j]));items.append(('para',ln,'\n'.join(ls[:j])))
            ls=ls[j+1:];ln+=j+1
        while ls:
            h=ls[0]
            if ZONE.match(h) or PART.match(h) or NARR.match(h) or h in('프롤로그 — 남아 있는 기억','최종장 — 남겨진 몽세') or re.match(r'^음성 [12] — ',h) or h.startswith('─'):
                items.append(('head',ln,h));ls=ls[1:];ln+=1
            else:
                items.append(('para',ln,'\n'.join(ls)));break
    out=OrderedDict(); out['prologue']={'voice1':[],'voice2':[],'narrator':None}; out['zones']=OrderedDict(); out['finale']=[]
    chapter=None;narr=None;cur=None;mode=None
    for kind,ln,t in items:
        if kind=='head':
            if t.startswith('─'): continue
            if t=='프롤로그 — 남아 있는 기억': mode='prologue';continue
            m=re.match(r'^음성 ([12]) — ',t)
            if m: mode='voice'+m.group(1);continue
            if PART.match(t): chapter=t;mode=None;continue
            if t=='최종장 — 남겨진 몽세': mode='finale';cur=None;out['finaleNarrator']=narr;continue
            mz=ZONE.match(t)
            if mz:
                mode='zone';cur=out['zones'][mz.group(2)]={'no':mz.group(1),'title':mz.group(3),'chapter':chapter,'line':ln,'blocks':[]};continue
            mn=NARR.match(t)
            if mn:
                narr='〈'+mn.group(1)+'〉'
                if mode=='prologue' or (mode or '').startswith('voice'): out['prologue']['narrator']=narr
                if mode=='zone' and cur is not None: cur['blocks'].append({'narrator':narr,'paras':[]})
                continue
            raise SystemExit('모르는 제목: '+t)
        else:
            if mode in('voice1','voice2'): out['prologue'][mode].append(t);continue
            if mode=='finale': out['finale'].append(t);continue
            if mode=='zone':
                if not cur['blocks']: cur['blocks'].append({'narrator':narr,'paras':[]})
                cur['blocks'][-1]['paras'].append(t);continue
            raise SystemExit(f'분류 안 된 문단 {ln}: {t[:40]}')
    return out

def sim(a,b):
    return difflib.SequenceMatcher(None,a,b,autojunk=False).ratio()

def split_buckets(cparas,buckets):
    """cparas: 정본 문단 목록, buckets: [(이름,[예전 문단…])…] 순서대로.
    모든 묶음이 한 문단 이상을 갖는 단조 경계를 DP로 고른다(유사도 합 최대)."""
    n=len(cparas);B=len(buckets)
    if n<B: raise SystemExit(f'문단 수({n})가 묶음 수({B})보다 적습니다')
    score=[[max([sim(c,o) for o in bk[1]] or [0]) for bk in buckets] for c in cparas]
    NEG=-1e9;dp=[[NEG]*B for _ in range(n+1)];bt=[[None]*B for _ in range(n+1)]
    dp[1][0]=score[0][0]
    for i in range(2,n+1):
        for b in range(B):
            best=NEG;arg=None
            for pb in (b,b-1):
                if pb<0: continue
                if dp[i-1][pb]>NEG/2 and dp[i-1][pb]+score[i-1][b]>best: best=dp[i-1][pb]+score[i-1][b];arg=pb
            dp[i][b]=best;bt[i][b]=arg
    assign=[0]*n;b=B-1
    for i in range(n,0,-1):
        assign[i-1]=b;b=bt[i][b] if i>1 else 0
    return assign,score

def main():
    ap=argparse.ArgumentParser();ap.add_argument('src');ap.add_argument('r75');ap.add_argument('out');ap.add_argument('--report');ap.add_argument('--source-name',default=None)
    a=ap.parse_args()
    raw=open(a.src,'rb').read();sha=hashlib.sha256(raw).hexdigest()
    text=raw.decode('utf-8-sig').replace('\r\n','\n').replace('\r','\n')
    st=canon_story(text)
    if a.r75.endswith('.html'):
        # index.html 안의 R75 장면 묶음에서 전투 전/후 경계 기준을 읽는다(읽기 전용)
        h=open(a.r75,encoding='utf-8').read();key='window.__STORYWORLD_STORY_DATA_R75__='
        r75,_=json.JSONDecoder().raw_decode(h,h.index(key)+len(key))
    else: r75=json.load(open(a.r75))
    rows={r['zoneId']:r for r in r75['records']}
    P=lambda s:[x for x in (s or '').split('\n\n') if x.strip()]
    zones=OrderedDict();report=[]
    for zid,z in st['zones'].items():
        flat=[(bi,p) for bi,b in enumerate(z['blocks']) for p in b['paras']]
        cp=[p for _,p in flat]
        if zid=='ep1a09':
            targets=[('ep1a09','pre'),('ep1a09','post'),('ep1a09b','pre'),('ep1a09b','post')]
        else:
            row=rows[zid];keys=[k for k in ['pre','firstPost','awakenPre','post'] if k in row['parts'] and row['parts'][k]] if not row['rest'] else ['body']
            if not keys: keys=['pre']
            targets=[(zid,k) for k in keys]
        buckets=[(f'{t[0]}.{t[1]}',P(rows[t[0]]['parts'].get(t[1]) or (rows[t[0]]['body'] if t[1]=='body' else ''))) for t in targets]
        assign,score=split_buckets(cp,buckets) if len(buckets)>1 else ([0]*len(cp),None)
        # 정리: 묶음별 세그먼트(화자 블록 유지)
        for ti,(tz,tk) in enumerate(targets):
            segs=[]
            for (bi,p),asg in zip(flat,assign):
                if asg!=ti: continue
                narr=z['blocks'][bi]['narrator']
                if segs and segs[-1]['narrator']==narr and segs[-1]['_b']==bi: segs[-1]['paras'].append(p)
                else: segs.append({'narrator':narr,'paras':[p],'_b':bi})
            for s in segs: s.pop('_b')
            Z=zones.setdefault(tz,{'id':tz,'title':None,'chapter':z['chapter'],'rest':bool(rows[tz]['rest']),'parts':OrderedDict(),'blocks':[],'line':z['line']})
            Z['parts'][tk]=segs
        if zid=='ep1a09':
            t1,t2=z['title'].split('과 ',1)
            zones['ep1a09']['title']=t1;zones['ep1a09b']['title']=t2
            for tz in('ep1a09','ep1a09b'):
                zones[tz]['canonTitle']=z['title']
                bl=[]
                for k in zones[tz]['parts']:
                    for sg in zones[tz]['parts'][k]:
                        if bl and bl[-1]['narrator']==sg['narrator']: bl[-1]['paras']+=sg['paras']
                        else: bl.append({'narrator':sg['narrator'],'paras':list(sg['paras'])})
                zones[tz]['blocks']=bl
        else:
            zones[zid]['title']=z['title'];zones[zid]['blocks']=z['blocks']
        # 경계 보고
        rep=[f"### [{z['no']}] {zid} {z['title']} — 문단 {len(cp)}"]
        for ti,(tz,tk) in enumerate(targets):
            idx=[i for i,x in enumerate(assign) if x==ti]
            if not idx: rep.append(f"- {tz}.{tk}: (비어 있음)");continue
            rep.append(f"- {tz}.{tk}: 문단 {idx[0]+1}–{idx[-1]+1} · 첫 「{cp[idx[0]][:38]}」 · 끝 「{cp[idx[-1]][-38:]}」")
        report.append('\n'.join(rep))
    missing=[k for k in rows if k not in zones]
    if missing: raise SystemExit('정본에 없는 구역: '+','.join(missing))
    # 저장 형태: 화자 블록 + 묶음별 문단 범위(평탄화한 문단 번호 [시작, 끝)) — 문자열은 실행 중에 만든다
    for zid,Z in zones.items():
        flat=[p for b in Z['blocks'] for p in b['paras']]
        cuts=OrderedDict();pos=0
        for k,segs in Z['parts'].items():
            n=sum(len(s['paras']) for s in segs)
            if segs:
                first=segs[0]['paras'][0]
                # ep1a09/ep1a09b 는 블록을 나눠 가지므로 묶음 시작 위치를 문단으로 찾는다
                pos=next(i for i in range(pos,len(flat)) if flat[i]==first)
            cuts[k]=[pos,pos+n];pos+=n
        body='\n\n'.join(flat)
        Z['cuts']=cuts;Z['bodySHA256']=hashlib.sha256(body.encode('utf-8')).hexdigest()
        for k in ('parts',): Z.pop(k,None)
    data=OrderedDict(source=a.source_name or a.src.split('/')[-1],sha256=sha,revision='R106',
        prologue={'narrator':st['prologue']['narrator'],'pre':'\n\n'.join(st['prologue']['voice1']),'post':'\n\n'.join(st['prologue']['voice2'])},
        finale={'title':'최종장 — 남겨진 몽세','narrator':st.get('finaleNarrator'),'text':'\n\n'.join(st['finale'])},
        zones=zones)
    body=json.dumps(data,ensure_ascii=False,separators=(',',':'))
    head=("/* R106: 스토리모드 정본 장면 데이터 ("+data['source']+", ① 스토리모드 프롤로그~최종장).\n"
          " * scripts/build-story-canon.py 가 만든 파일입니다. 문단은 정본 그대로이며 전투 전/후 경계만 나눕니다. */\n")
    open(a.out,'w',encoding='utf-8').write(head+'window.__STORYWORLD_STORY_CANON_R106__=Object.freeze('+body+');\n')
    total=sum(len(b['paras']) for k,Z in zones.items() for b in Z['blocks'])
    print(f'구역 {len(zones)} · 문단 {total} · 프롤로그 {len(st["prologue"]["voice1"])}+{len(st["prologue"]["voice2"])} · 최종장 {len(st["finale"])} · sha {sha}',file=sys.stderr)
    if a.report: open(a.report,'w').write('# R106 스토리모드 전투 전/후 경계표\n\n'+'\n\n'.join(report)+'\n')
if __name__=='__main__': main()
