"""R1233: Dots 가 올린 R290 규격 몹 시트(1024x960, 칸 256x320 4x3, 걷기 0-7·공격 8-11, 발 128,300, 오른쪽)를 게임에 넣기 전 손질한다.
 usage: python3 -I scripts/r1233-dots-clean.py <원본 png> <출력 webp> [최소 조각 픽셀=60]
 · 알파 16 이하 → 0(흐린 번짐 테두리 제거, Dots 검증 메모의 저알파 조건)
 · 칸마다 알파>16 연결 조각 중 가장 큰 몸과 떨어진 작은 조각(최소 조각 픽셀 미만)을 지운다(떨어진 발톱 등).
 · 원본은 고치지 않는다. 결과 몸 높이(걷기 칸 중앙값)·칸별 발 줄·지운 픽셀을 JSON 한 줄로 찍는다. PIL 만 쓴다."""
import sys,json,hashlib
from PIL import Image
src,out=sys.argv[1],sys.argv[2];MIN=int(sys.argv[3]) if len(sys.argv)>3 else 60
im=Image.open(src).convert('RGBA');W,H=im.size;assert (W,H)==(1024,960),(W,H)
px=im.load();low=0
for y in range(H):
  for x in range(W):
    r,g,b,a=px[x,y]
    if 0<a<=16:px[x,y]=(0,0,0,0);low+=1
cells=[];removed=0
for k in range(12):
  ox,oy=(k%4)*256,(k//4)*320;seen=set();comps=[]
  for y in range(320):
    for x in range(256):
      if (x,y) in seen or px[ox+x,oy+y][3]==0:continue
      st=[(x,y)];seen.add((x,y));c=[]
      while st:
        cx,cy=st.pop();c.append((cx,cy))
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
          nx,ny=cx+dx,cy+dy
          if 0<=nx<256 and 0<=ny<320 and (nx,ny) not in seen and px[ox+nx,oy+ny][3]>0:seen.add((nx,ny));st.append((nx,ny))
      comps.append(c)
  comps.sort(key=len,reverse=True);rm=0
  for c in comps[1:]:
    if len(c)<MIN:
      for (x,y) in c:px[ox+x,oy+y]=(0,0,0,0)
      rm+=len(c)
  removed+=rm
  bb=im.crop((ox,oy,ox+256,oy+320)).getchannel('A').getbbox()
  cells.append({'cell':k,'bbox':bb,'body':bb[3]-bb[1] if bb else 0,'foot':bb[3] if bb else None,'removed':rm,'pieces':len(comps)})
im.save(out,'WEBP',lossless=True,method=6)
walk=sorted(c['body'] for c in cells[:8])
print(json.dumps({'src':src,'srcSha256':hashlib.sha256(open(src,'rb').read()).hexdigest(),'out':out,'outSha256':hashlib.sha256(open(out,'rb').read()).hexdigest(),
 'bytes':len(open(out,'rb').read()),'lowAlphaCleared':low,'detachedRemoved':removed,'bodyWalkMedian':walk[4],'cells':cells},ensure_ascii=False))
