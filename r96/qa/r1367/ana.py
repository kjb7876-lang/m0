"""R1367 walkprobe 결과 분석: 몹마다 걷는 동안 그린 칸 수(이동 칸이 바뀌는지), 보이는 키 퍼짐, 발끝-발밑 거리(키 비율),
 걷는 화면 방향과 R444 바라보는 쪽 일치, 뒤집힘 일치.  사용: python3 ana.py <walk.json> <사이트 루트>"""
import json,sys,statistics as st,re
from functools import lru_cache
from PIL import Image
D=json.load(open(sys.argv[1]));ROOT=sys.argv[2].rstrip('/')+'/'
@lru_cache(None)
def img(p):
    return Image.open(ROOT+p).convert('RGBA')
@lru_cache(None)
def opaque(src,sr):
    """칸(src,sr) 안 불투명(알파>40) 상자를 sr 비율로 [l,t,r,b]"""
    m=re.match(r'(assets/[^:|]+\.(?:webp|png))(?::([\d.,]+):(\d+))?',src)
    if not m: return None
    path=m.group(1)
    try: im=img(path)
    except Exception: return None
    srr=[float(v) for v in sr.split(',')] if sr else [0,0,im.width,im.height]
    if m.group(2):  # 처리된 캔버스: 원본 칸 rect, 캔버스 = 칸 + 가장자리
        R=[float(v) for v in m.group(2).split(',')];cw,ch=srr[2],srr[3];px=(cw-R[2])/2;py=(ch-R[3])/2
        cell=im.crop((int(R[0]),int(R[1]),int(R[0]+R[2]),int(R[1]+R[3])))
        bb=cell.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
        if not bb: return None
        return ((bb[0]+px)/cw,(bb[1]+py)/ch,(bb[2]+px)/cw,(bb[3]+py)/ch)
    cell=im.crop((int(srr[0]),int(srr[1]),int(srr[0]+srr[2]),int(srr[1]+srr[3])))
    bb=cell.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
    if not bb: return None
    return (bb[0]/srr[2],bb[1]/srr[3],bb[2]/srr[2],bb[3]/srr[3])
out={}
for z,L in D.items():
    for id,o in L.items():
        S=[s for s in o['samples'] if abs(s['vx'])+abs(s['vy'])>5]
        if not S: print(z,id,'no moving samples');continue
        keys={};gaps=[];hs=[];agree=0;tot=0;flipOK=0
        for s in S:
            k=s['src']+'|'+(','.join(str(v) for v in s['sr']) if s['sr'] else 'whole');keys[k]=keys.get(k,0)+1
            ob=opaque(s['src'],','.join(str(v) for v in s['sr']) if s['sr'] else '')
            P=s['P'];top=P[0][1];H=P[3][1]-P[0][1]
            if ob and H:
                vb=top+ob[3]*H;vt=top+ob[1]*H;h=vb-vt;hs.append(h);gaps.append((s['gy']-vb)/h)
            if abs(s['vx'])>abs(s['vy'])*1.2 and s['faceLeft'] is not None:
                tot+=1;agree+=(s['vx']<0)==s['faceLeft']
        n=len(S);distinct=len(keys)
        r={'zone':z,'name':o['name'],'moving':n,'distinctFrames':distinct,'r1029':sum(1 for s in S if s['r1029']),
           'hMed':round(st.median(hs),1) if hs else None,'hSpread':round((max(hs)-min(hs))/st.median(hs),3) if hs else None,
           'footGapMed':round(st.median(gaps),3) if gaps else None,'footGapMax':round(max(gaps,key=abs),3) if gaps else None,
           'faceAgree':f'{agree}/{tot}','top':sorted(keys.items(),key=lambda x:-x[1])[:4]}
        out[z+'/'+id]=r
        print(json.dumps(r,ensure_ascii=False))
json.dump(out,open(sys.argv[1].replace('.json','-ana.json'),'w'),ensure_ascii=False,indent=1)
