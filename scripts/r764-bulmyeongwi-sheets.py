#!/usr/bin/env python3
"""R764: Dots CX-0070BM 불면귀 보스 2페이즈 대기·피격·죽음 + 중간보스(검은 안개 심장) 대기·공격·피격·죽음 시트 → 게임용 512칸 webp.
입력: 그림 스레드 손질본 폴더 셋(r2·r3·r4 _c1.png, 알파 16 이하 0 — 그림은 Dots 원본 그대로). 원본은 지우거나 덮어쓰지 않는다.
보스는 768칸(발 (384,704)) → 512칸(발 (256,469.33)), 중간보스는 원래 512칸(발 줄 471) 그대로 webp.
출력: r96/runtime-text/assets/r760/{boss,mid}/sheet-<key>.webp, 목록·해시는 r96/r760-bulmyeongwi.json 의 sheets764.
usage: python3 scripts/r764-bulmyeongwi-sheets.py <cx0070bm-r2-cleaned> <cx0070bm-r3-cleaned> <cx0070bm-r4-cleaned>
넷째 묶음(r4): 눈빛 공격 atkB8_r2(예비 동작 1~3칸 움츠림·4칸 쏠림·5칸 시선 = 타격 칸 4번) → sheet-atkB2(r1 sheet-atkB 는 그대로 둠), 2단계 피격 hit2nd4 → sheet-hit2."""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r760';SPEC=R/'r760-bulmyeongwi.json'
# (출력 폴더, 키, 입력 폴더 번호, 파일, 칸 수, 원래 칸)
SRC=[('boss','idle2',0,'CX-0070BM_boss_idle2_6_r2_c1.png',6,768),('boss','hit',1,'CX-0070BM_boss_hit4_r1_c1.png',4,768),
 ('boss','death',0,'CX-0070BM_boss_death10_r2_c1.png',10,768),('boss','atkB2',2,'CX-0070BM_boss_atkB8_r2_c1.png',8,768),('boss','hit2',2,'CX-0070BM_boss_hit2nd4_r1_c1.png',4,768),('mid','idle',0,'CX-0070BM_mid_idle6_r1_c1.png',6,512),
 ('mid','atk',0,'CX-0070BM_mid_atk8_r1_c1.png',8,512),('mid','hit',1,'CX-0070BM_mid_hit4_r1_c1.png',4,512),('mid','death',1,'CX-0070BM_mid_death8_r2_c1.png',8,512)]
NEW=512
def main(dirs):
  dirs=[Path(d) for d in dirs];rows=[]
  for sub,k,di,f,n,cell in SRC:
    src=dirs[di]/f;im=Image.open(src).convert('RGBA');assert im.size==(cell*n,cell),(f,im.size)
    o=im if cell==NEW else im.resize((NEW*n,NEW),Image.LANCZOS);buf=io.BytesIO();o.save(buf,'WEBP',quality=90,method=6,exact=False);b=buf.getvalue()
    (OUT/sub).mkdir(parents=True,exist_ok=True);(OUT/sub/('sheet-'+k+'.webp')).write_bytes(b)
    rows.append({'who':sub,'key':k,'source':'Dots CX-0070BM '+f,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'frames':n,'cell':NEW,
      'path':'assets/r760/'+sub+'/sheet-'+k+'.webp','size':list(o.size),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  spec=json.loads(SPEC.read_text(encoding='utf8'));spec['sheets764']=rows;SPEC.write_text(json.dumps(spec,ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  for r in rows:print(r['path'],r['size'],r['bytes'])
if __name__=='__main__':main(sys.argv[1:4])
