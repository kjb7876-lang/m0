#!/usr/bin/env python3
"""정본 텍스트(제9부 사몽 ~ 윤서하의 진료기록)를 게임 데이터(samong-text-r103.js)로 변환한다.
문단은 원문 줄 그대로 넣고, 구간(서문/문턱/S-xx/[NS-xx]/R-xx/1.~3./종장/진료기록)과 화자(〈…의 기억〉)로만 나눈다.
사용: python3 scripts/build-samong-text.py <정본.txt> <출력.js> [--source-name 이름] [--check-json 기존.json]
"""
import sys, re, json, hashlib, argparse
from collections import OrderedDict

def load(path):
    raw=open(path,'rb').read()
    text=raw.decode('utf-8-sig').replace('\r\n','\n').replace('\r','\n')
    return raw, text

HEAD=[('prelude',re.compile(r'^서문 — ')),('threshold',re.compile(r'^문턱 — ')),
      ('S',re.compile(r'^S-(\d\d)\. ')),('NS',re.compile(r'^\[NS-(\d\d)\] ')),('DYS',re.compile(r'^\[DYS-(\d\d)\] ')),('R',re.compile(r'^R-(\d\d)\. ')),
      ('M',re.compile(r'^([123])\. ')),('epilogue',re.compile(r'^종장 — ')),('record',re.compile(r'^〈윤서하의 진료기록〉$'))]
SKIP=re.compile(r'^(제(9|1[0-2])부 — |[─━═]{3,}|[①②③④⑤⑥⑦⑧⑨] )')
NARR=re.compile(r'^〈(.+)〉$')

def parse(text):
    lines=text.split('\n')
    # 본문 시작: '서문 — 잠드는 사람' 다음에 화자 줄이 오는 곳(차례 목록은 제외)
    start=None
    for i,l in enumerate(lines):
        if l.strip().startswith('서문 — '):
            nxt=[x.strip() for x in lines[i+1:i+3] if x.strip()]
            if nxt and NARR.match(nxt[0]): start=i; break
    if start is None: raise SystemExit('본문 시작(서문)을 찾지 못했습니다')
    sections=OrderedDict(); cur=None; block=None; unclassified=[]; part_sub=False
    def new_section(key,title):
        nonlocal cur,block
        cur=sections[key]={'title':title,'blocks':[]}; block=None
    def new_block(narr):
        nonlocal block
        block={'narrator':narr,'paras':[]}; cur['blocks'].append(block)
    for n,l in enumerate(lines[start:],start+1):
        s=l.strip()
        if not s: continue
        if SKIP.match(s):
            part_sub=s.startswith('제'); continue
        was_part=part_sub; part_sub=False
        hit=None
        for kind,rx in HEAD:
            m=rx.match(s)
            if m: hit=(kind,m); break
        if hit:
            kind,m=hit
            if kind in('prelude','threshold','epilogue'): new_section(kind,s)
            elif kind=='S': new_section('S-'+m.group(1),s)
            elif kind=='NS': new_section('NS-'+m.group(1),s)
            elif kind=='DYS': new_section('DYS-'+m.group(1),s)
            elif kind=='R': new_section('R-'+m.group(1),s)
            elif kind=='M': new_section('M'+m.group(1),s)
            elif kind=='record': new_section('record','윤서하의 진료기록'); new_block('윤서하의 진료기록')
            continue
        mn=NARR.match(s)
        # 부 제목 바로 아래의 부제(예: 제11부 — 사몽역행 / 여섯 빛깔의 묵시록)는 본문 문단이 아니다.
        if was_part and not mn: continue
        if mn:
            if cur is None: unclassified.append((n,s)); continue
            new_block(mn.group(1)); continue
        if cur is None: unclassified.append((n,s)); continue
        if block is None: new_block('')
        block['paras'].append(s)
    return sections,unclassified

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--source-name'); ap.add_argument('--check-json'); ap.add_argument('--revision',default='R106')
    a=ap.parse_args()
    raw,text=load(a.src); sha=hashlib.sha256(raw).hexdigest()
    sections,unc=parse(text)
    for n,s in unc: print('분류 안 된 줄',n,s[:60],file=sys.stderr)
    total=sum(len(b['paras']) for v in sections.values() for b in v['blocks'])
    print(f'구간 {len(sections)} 문단 {total} sha256 {sha}',file=sys.stderr)
    data=OrderedDict([('source',a.source_name or a.src.split('/')[-1]),('sha256',sha),('sections',sections)])
    if a.check_json:
        ref=json.load(open(a.check_json))
        ok=ref['sections']==json.loads(json.dumps(sections))
        print('기존 데이터와 sections 일치:',ok,file=sys.stderr)
        if not ok:
            for k in set(ref['sections'])|set(sections):
                if ref['sections'].get(k)!=sections.get(k): print('  다름:',k,file=sys.stderr)
    body=json.dumps(data,ensure_ascii=False,separators=(',',':'))
    header=(f"/* {a.revision}: 사몽·사몽역행·미카엘라 엔딩 원문 ({data['source']}, 제9부~진료기록).\n"
            " * 문단은 원문 그대로이며 게임은 이 데이터를 고치지 않고 나누어 보여 줍니다. scripts/build-samong-text.py 가 만든 파일입니다. */\n")
    open(a.out,'w',encoding='utf-8').write(header+'window.__STORYWORLD_SAMONG_TEXT_R103__=Object.freeze('+body+');\n')
if __name__=='__main__': main()
