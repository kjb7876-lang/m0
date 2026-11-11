#!/usr/bin/env python3
"""R769: 불면귀 주민 몹 추가 자산 → 게임용 webp. 원본은 지우거나 덮어쓰지 않는다.
 · 소복 처녀(vil3) 걷기 8칸 임시본(ElevenLabs seedream 생성·그림 스레드 손질 eld_c1, 384칸·발 (192,352)·오른쪽 봄) → 256칸.
   보폭이 모든 칸 같아 '실에 끌려 미끄러지듯' 연출(약 6fps)로만 쓰는 임시본(그림 스레드 심사 7.79). 정식 걷기·대기·공격·피격·죽음은 대기.
 · 약방 아낙(vil2) 투사체 proj6 r4 Claude 보정본(128칸 6, 공은 오른쪽·꼬리는 왼쪽 = 오른쪽으로 날아감, 심사 7.86, 불씨는 코드 입자라 임시).
출력: r96/runtime-text/assets/r763/villagers/sobok-walk.webp, r96/runtime-text/assets/r769/herbwife-proj6.webp, 목록·해시 r96/r769-villager-extra.json.
usage: python3 scripts/r769-villager-extra.py <vil3_walk8_eld_c1.png> <vil2_proj6_r4cl_c1.png>"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';RT=R/'runtime-text';SPEC=R/'r769-villager-extra.json'
def save(o,rel,q):
  buf=io.BytesIO();o.save(buf,'WEBP',quality=q,method=6);b=buf.getvalue();p=RT/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);return b
def vis(o,n,cell,foot):
  hs=[]
  for i in range(n):
    a=o.crop((i*cell,0,(i+1)*cell,cell)).getchannel('A');w,h=a.size;px=a.load()
    top=next((y for y in range(h) if any(px[x,y]>16 for x in range(w))),None)
    if top is not None:hs.append(foot-top)
  hs.sort();return round(hs[len(hs)//2],1)
def main(walk,proj):
  rows=[]
  src=Path(walk);im=Image.open(src).convert('RGBA');assert im.size==(384*8,384),im.size
  o=im.resize((256*8,256),Image.LANCZOS);b=save(o,'assets/r763/villagers/sobok-walk.webp',90)
  rows.append({'villager':'sobok','anim':'walk','frames':8,'temporary':True,'source':'ElevenLabs seedream-5.5 '+src.name+' (그림 스레드 손질)','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),
   'path':'assets/r763/villagers/sobok-walk.webp','cell':256,'pivot':[128,234.67],'visibleHeight':vis(o,8,256,234.67),'size':list(o.size),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  src=Path(proj);im=Image.open(src).convert('RGBA');assert im.size==(768,128),im.size
  b=save(im,'assets/r769/herbwife-proj6.webp',92)
  rows.append({'villager':'herbwife','anim':'proj6','frames':6,'temporary':'불씨 꼬리는 코드 입자','source':'Dots CX-0070BM vil2_proj6_r3 → Claude 보정 '+src.name,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),
   'path':'assets/r769/herbwife-proj6.webp','cell':128,'facing':'right','size':list(im.size),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  SPEC.write_text(json.dumps({'round':'R769','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  for x in rows:print(x['path'],x['size'],x['bytes'],x.get('visibleHeight',''))
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
