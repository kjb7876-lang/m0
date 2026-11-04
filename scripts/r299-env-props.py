#!/usr/bin/env python3
"""R299: 드라이브 '14 환경 조형물·서사 자산' 1차 묶음(SW-env14_batch01_v1) -> assets/r299/<id>.webp (게임용 파생본).
원본 PNG 는 바꾸지 않는다. 묶음 manifest.json 의 SHA-256·크기를 확인하고, R257 과 같은 방식(알파 상자 alpha>=16·PAD 6·WebP q92 알파 100)으로
긴 변을 용도별(바닥 데칼 256·소품 192·큰 조형물 384)로 줄여 쓴다. 통과분만 파생본을 만들고, 보류분은 index.json 의 held 에 사유와 함께 남긴다.
usage: python3 -I scripts/r299-env-props.py <풀린 SW-env14 폴더> <zip 파일> <풀린 v2 SW-env14 폴더> <v2 zip 파일> [out-dir]
재작업 v2(SW-env14_batch01_v2, 보류 5종 수정본)도 같은 방식으로 검수해 통과분만 파생한다."""
import hashlib, json, sys
from pathlib import Path
from PIL import Image
src=Path(sys.argv[1]);zipf=Path(sys.argv[2]);src2=Path(sys.argv[3]);zip2=Path(sys.argv[4]);out=Path(sys.argv[5] if len(sys.argv)>5 else 'r96/runtime-text/assets/r299');out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest();A,PAD=16,6
ZIP_ID='1R4W6bzXd8HM_W16fktWet2PPTAm6Eox4';ZIP2_ID='1ijNTXW65iqq2GpKF_YKJSS0f6YN6nRme';MANIFEST2_ID='1jrSNpb_degAvG8l3Afh1jwljAnb7STfQ';MANIFEST_ID='1Rs446LCshoVylslSXYp1PIShQHuwsOS9'
# id: (원본 파일, 종류, 긴 변, 쓰는 곳)
PASS={
 'blood-dried':('dried_blood_decal_v1.png','decal',256,'바닥 데칼 — 병원·사몽 계열 바닥, 낮은 불투명도'),
 'blood-dragged':('dragged_blood_decal_v1.png','decal',256,'바닥 데칼 — 병원·숲 계열 바닥, 낮은 불투명도'),
 'stone-cracked':('cracked_stone_decal_v1.png','decal',256,'바닥 데칼 — 성당·숲 계열 바닥, 낮은 불투명도'),
 'hexagram':('faint_red_hexagram_decal_v1.png','decal',256,'바닥 데칼 — 사몽 계열 바닥에만, 아주 낮은 불투명도(원본 선이 또렷해 옅게)'),
 'papers':('scattered_papers_decal_v1.png','decal',256,'바닥 데칼 — 병원·성당 계열 바닥, 낮은 불투명도'),
 'bed':('overturned_hospital_bed_v1.png','prop',192,'서사 소품 — 병원 계열'),
 'cart':('rusted_surgical_cart_v1.png','prop',192,'서사 소품 — 병원 계열'),
 'mirror':('broken_mirror_v1.png','prop',192,'서사 소품 — 병원·사몽 계열(벽에 붙임)'),
 'candles':('extinguished_candles_v1.png','prop',192,'서사 소품 — 성당 계열'),
 'chained-pillar':('chained_pillar_v1.png','prop',192,'서사 소품 — 성당·사몽 계열'),
 'suitcase':('abandoned_suitcase_v1.png','prop',192,'서사 소품 — 병원·숲 계열'),
 'diary':('bloodstained_diary_v1.png','prop',192,'서사 소품 — 성당·사몽 계열'),
 'doll':('broken_doll_v1.png','prop',192,'서사 소품 — 병원·사몽 계열'),
 'arch':('ruined_cathedral_arch_v1.png','big',384,'큰 조형물 — 성당 계열, 벽에 붙임'),
 'obelisk':('black_obelisk_v1.png','big',384,'큰 조형물 — 사몽 계열'),
 'tree':('ancient_tree_v1.png','big',384,'큰 조형물 — 숲 계열 실외'),
 'statue':('collapsed_statue_v1.png','big',384,'큰 조형물 — 성당 계열'),
}
PASS2={
 'soot':('soot_circle_decal_v2.png','decal',256,'바닥 데칼(v2 재작업) — 성당·숲 계열 바닥, 낮은 불투명도'),
 'prayer-stand':('collapsed_prayer_stand_v2.png','prop',192,'서사 소품(v2 재작업, 쓰러진 기도대) — 성당 계열 바닥'),
 'seal-plank':('sealed_door_fragment_v2.png','prop',192,'서사 소품(v2 재작업, 바닥에 눕힌 부적 문짝 조각) — 성당·사몽 계열, 진행 문 6칸 안 금지'),
}
HELD2={
 'candle_wax_decal_v2.png':'v2 는 갈색으로 어두워졌지만 촛농이 아니라 진흙·마른 오물처럼 읽힌다 — 희끄무레한 상아색을 낮은 채도·납작한 흘러내림으로',
 'cold_water_puddle_decal_v2.png':'돌 테두리는 없어졌지만 연한 하늘색 수면이 밝아 어두운 바닥에서 빛나는 판처럼 뜬다(dots 도 밝은 가장자리 조건부) — 어두운 반사·가장자리 젖은 얼룩으로',
}
HELD={
 'soot_circle_decal_v1.png':'회색 재 고리가 밝아 어두운 바닥에서 연기·안개처럼 뜬다 — 더 어두운 그을음으로 재작업',
 'candle_wax_decal_v1.png':'크림색 촛농 더미가 밝고 높이감(부조)이 있어 바닥 데칼로 겹치면 물체처럼 보인다 — 납작하고 어둡게',
 'cold_water_puddle_decal_v1.png':'물웅덩이 테두리에 칠한 돌 바닥 질감이 함께 있어 다른 바닥 위에서 사각 얼룩처럼 남는다 — 물만 남기고 가장자리 투명 처리',
 'collapsed_prayer_stand_v1.png':'지시는 무너진 기도대인데 거의 서 있다(dots 도 조건부 표기) — 쓰러진 실루엣으로',
 'sealed_door_fragment_v1.png':'문짝 모양이라 R81 진행 문(보스 구역·앞방·다음 구역)과 헷갈릴 수 있다 — 문으로 안 읽히게 눕히거나 조각 형태로',
 'window_bars_cookie_v1.png':'빛 쿠키를 투사할 렌더 단계가 아직 없어 쓸 곳이 분명하지 않음 — 그림 자체는 이상 없음(보류만)',
 'leaves_cookie_v1.png':'빛 쿠키를 투사할 렌더 단계가 아직 없어 쓸 곳이 분명하지 않음 — 그림 자체는 이상 없음(보류만)',
 'stained_glass_cookie_v1.png':'선이 매끈한 벡터·도안풍이라 손칠 결과 다르고, 쓸 곳도 아직 없음 — 부드러운 손칠 명암으로',
}
man=json.loads((src/'manifest.json').read_text());by={a['file']:a for a in man['assets']}
for f,a in by.items():
  b=(src/f).read_bytes();assert sha(b)==a['sha256'] and len(b)==a['bytes'],(f,'sha/size mismatch')
assert set(by)=={v[0] for v in PASS.values()}|set(HELD),'manifest/pass/held mismatch'
idx={'revision':'R299','batch':'SW-env14_batch01_v1','driveZip':'SW-env14_batch01_v1.zip','driveId':ZIP_ID,'manifestDriveId':MANIFEST_ID,'zipSHA256':sha(zipf.read_bytes()),
 'manifestStatus':man.get('status'),'note':'dots 표기: 검토 후보·자동 적용 금지·최종 아트 아님. 아래 applied 는 R299 검수 통과분만.',
 'method':'alpha bbox (alpha>=16) + pad 6, long side decal 256 / prop 192 / big 384, WebP q92 alpha 100','items':{},'held':{}}
for k,(f,kind,mx,use) in PASS.items():
  a=by[f];im=Image.open(src/f).convert('RGBA');m=im.split()[3].point(lambda v:255 if v>=A else 0);bb=m.getbbox()
  bb=(max(0,bb[0]-PAD),max(0,bb[1]-PAD),min(im.width,bb[2]+PAD),min(im.height,bb[3]+PAD));im=im.crop(bb)
  if max(im.size)>mx:s=mx/max(im.size);im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
  p=out/(k+'.webp');im.save(p,'WEBP',quality=92,alpha_quality=100,method=6);db=p.read_bytes()
  idx['items'][k]={'path':'assets/r299/'+k+'.webp','original':f,'originalSHA256':a['sha256'],'originalBytes':a['bytes'],'originalSize':[a['width'],a['height']],
   'derivedSHA256':sha(db),'derivedBytes':len(db),'derivedSize':list(im.size),'kind':kind,'dotsStatus':a.get('status'),'dotsOpenIssues':a.get('open_issues',[]),'use':use,'applied':True}
  print(k,im.size,len(db))
for f,why in HELD.items():
  a=by[f];idx['held'][f]={'originalSHA256':a['sha256'],'originalBytes':a['bytes'],'originalSize':list(Image.open(src/f).size),'dotsStatus':a.get('status'),'reason':why,'applied':False}
man2=json.loads((src2/'manifest.json').read_text());by2={a['file']:a for a in man2['assets']}
for f,a in by2.items():
  b=(src2/f).read_bytes();assert sha(b)==a['sha256'] and len(b)==a['bytes'],(f,'v2 sha/size mismatch')
assert set(by2)=={v[0] for v in PASS2.values()}|set(HELD2)
idx['v2']={'batch':'SW-env14_batch01_v2','driveZip':'SW-env14_batch01_v2.zip','driveId':ZIP2_ID,'manifestDriveId':MANIFEST2_ID,'zipSHA256':sha(zip2.read_bytes()),'manifestStatus':man2.get('status')}
for k,(f,kind,mx,use) in PASS2.items():
  a=by2[f];im=Image.open(src2/f).convert('RGBA');m=im.split()[3].point(lambda v:255 if v>=A else 0);bb=m.getbbox()
  bb=(max(0,bb[0]-PAD),max(0,bb[1]-PAD),min(im.width,bb[2]+PAD),min(im.height,bb[3]+PAD));im=im.crop(bb)
  if max(im.size)>mx:s_=mx/max(im.size);im=im.resize((max(1,round(im.width*s_)),max(1,round(im.height*s_))),Image.LANCZOS)
  p=out/(k+'.webp');im.save(p,'WEBP',quality=92,alpha_quality=100,method=6);db=p.read_bytes()
  idx['items'][k]={'path':'assets/r299/'+k+'.webp','original':f,'batch':'v2','originalSHA256':a['sha256'],'originalBytes':a['bytes'],'originalSize':list(Image.open(src2/f).size),
   'derivedSHA256':sha(db),'derivedBytes':len(db),'derivedSize':list(im.size),'kind':kind,'dotsStatus':a.get('status'),'use':use,'applied':True}
  print(k,im.size,len(db))
for f,why in HELD2.items():
  a=by2[f];idx['held'][f]={'batch':'v2','originalSHA256':a['sha256'],'originalBytes':a['bytes'],'originalSize':list(Image.open(src2/f).size),'dotsStatus':a.get('status'),'reason':why,'applied':False}
(out/'index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=1)+'\n')
