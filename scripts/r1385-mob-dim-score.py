#!/usr/bin/env python3
"""R1385 몹별 2D·3D 점수표.
입력: measure.mjs 결과 폴더(<zone>.json), 3D 모델 표(rows.json: mod·k·name·glb·clips), 3D 촬영 meta.json
출력: score.json (몹마다 2D·3D 일관성·모션·미관 기계 점수와 근거).  미관 중 '원화 닮음'(fid)은 사람이 대조표를 보고 넣는 값(fidelity.json)이다.
규칙은 docs/mob-2d3d-rule-r1385.md 에 있다.
"""
import json,re,sys,os,glob,statistics as st
M,ROWS,META,FID,OUT=sys.argv[1:6]
rows=json.load(open(ROWS));meta=json.load(open(META));fid=json.load(open(FID)) if os.path.exists(FID) else {}
PAT=re.compile(r'(assets/[^|:]+?\.(?:webp|png))(?::(\d+),(\d+),(\d+),(\d+))?')
def norm(key):
    m=PAT.search(key)
    if not m:return None,None
    path=m.group(1)
    if m.group(2):rect=tuple(int(m.group(i)) for i in range(2,6))
    else:
        r=key.split('|')[-1];rect=tuple(int(v) for v in r.split(',')) if re.match(r'^\d+,\d+,\d+,\d+$',r) else None
    return path,rect
CORE=['idle','walk','attack','hit'];TARGET={'idle':4,'walk':6,'attack':6,'hit':3}
def score2d(R,block):
    st_={}
    for S in CORE:
        ks=R['st'].get(S,{});fr={};hs=[]
        for k,o in ks.items():
            p,r=norm(k)
            if not p:continue
            fr[(p,r)]=fr.get((p,r),0)+o['n'];hs+=o['hs']
        st_[S]=dict(frames=fr,h=st.median(hs) if hs else None)
    # 모션: 대기·걷기 칸 수, 공격·피격 전용 칸(경로 이름이 attack/atk/cast·hit 이거나 그 상태에만 나온 칸) 수 / 목표
    own={S:{f for f,n in st_[S]['frames'].items() if n>=max(2,.05*sum(st_[S]['frames'].values()))} for S in CORE}
    base=own['idle']|own['walk'];det={}
    det['idle']=len(own['idle']);det['walk']=len(own['walk'])
    det['attack']=len({f for f in own['attack']|own['idle']|own['walk'] if re.search(r'attack|atk|cast|skill',f[0],re.I)}|(own['attack']-base-own['hit']))
    det['hit']=len({f for S in CORE for f in own[S] if re.search(r'hit|hurt',f[0],re.I)}|(own['hit']-base-own['attack']))
    mot=sum(min(2.5,det[S]/TARGET[S]*2.5) for S in CORE)
    # 일관성: 상태별 키 중앙값 퍼짐, 다른 인물 그림(block), 위·아래 전용 그림 없음, 시트 계열 수
    H=[st_[S]['h'] for S in CORE if st_[S]['h']]
    spread=(max(H)/min(H)-1)*100 if len(H)>=2 else 0
    fam={re.sub(r'[-_](idle|walk|move|attack|atk|hit|side|up|down|cast|float|p\d)\w*','',os.path.basename(p)) for S in CORE for (p,r) in own[S]}
    allp={p for S in CORE for (p,r) in own[S]}
    updown=any(re.search(r'(^|[-_/])(up|down)([-_.]|$)',p) for p in allp)
    blocked=sorted(p for p in allp if any(p.startswith(b) or b in p for b in block))
    con=10-min(4,spread/5)-(2 if blocked else 0)-(0 if updown else 1)-(1 if len(fam)>2 else 0)
    # 미관(기계분): 원본 칸 키 대비 화면 키(1280×720 기준, 측정은 640×360 → ×2) — 1.15배 넘게 늘리면 흐림
    up=[]
    for S in CORE:
        for (p,r),n in st_[S]['frames'].items():
            if r and st_[S]['h']:up.append(st_[S]['h']*2/max(1,r[3]))
    upx=st.median(up) if up else 1
    sharp=10-min(4,max(0,upx-1.15)*6)
    return dict(con=round(con,2),mot=round(mot,2),sharp=round(sharp,2),spread=round(spread,1),updown=updown,blocked=blocked,fam=len(fam),frames=det,upscale=round(upx,2),h={S:st_[S]['h'] for S in CORE},
                idle=[list(f)+[n] for f,n in sorted(st_['idle']['frames'].items(),key=lambda x:-x[1])[:1]] if st_['idle']['frames'] else None)
def score3d(row):
    key=row['mod'].replace('mob-3d-','').replace('.js','')+'_'+row['k'];m=meta.get(key,{})
    clips=[c.split(':')[0].lower() for c in m.get('clips',[])]
    has=lambda *a:any(any(x==c or c.startswith(x) for x in a) for c in clips)
    mot=sum(2 for s in [('idle',),('walk','float'),('attack',),('hit',)] if has(*s))+(1 if has('death') else 0)+(1 if has('attack_special','special','cast','attack2') else 0)
    con=9.5 if all(has(*s) for s in [('idle',),('walk','float'),('attack',),('hit',)]) else 7
    tris=m.get('tris',0)
    return dict(key=key,con=con,mot=mot,clips=clips,tris=tris)
def main():
    block=set()
    try:
        for x in json.load(open(os.path.join(os.path.dirname(OUT),'dir-art.json')))['mobs']:block|=set(x.get('block',[]))
    except Exception:pass
    zones={}
    for f in glob.glob(M+'/*.json'):
        d=json.load(open(f));zones[d['zone']]=d
    out=[]
    for z,d in sorted(zones.items()):
        for id_,R in d['R'].items():
            own=d['own'].get(id_,[])
            if not own:
                for mk,v in d.get('ins',{}).items():
                    for it in v.get('inst') or []:
                        if str(it[0])==str(R.get('eid')) and it[2]:own=[mk.replace('__STORYWORLD_','').strip('_')+':'+it[1]];break
            s2=score2d(R,block)
            ent=dict(zone=z,id=id_,name=R['name'],boss=R['boss'],mid=R['midboss'],own=own,d2=s2)
            if own:
                mod,k=own[0].split(':');modf={'MOB3D_R1312':'r1312','MOB3D_R1315':'r1315','BOSS3D_R1322C':'r1322c','BALROG3D_R1338':'r1338'}.get(mod,mod.replace('MOB3D_R','r').lower())
                row=next((r for r in rows if r['mod']=='mob-3d-'+modf+'.js' and r['k']==k),None)
                if row:ent['d3']=score3d(row);ent['d3']['fid']=fid.get(ent['d3']['key'])
            out.append(ent)
    json.dump(out,open(OUT,'w'),ensure_ascii=False,indent=1);print(len(out),'mobs,',sum('d3' in e for e in out),'with 3D')
main()
