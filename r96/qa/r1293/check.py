# R1293 헤드리스 판정: probe.mjs 결과(OUT/census.json, OUT/<SC>-<t>.png)를 읽어 실제 플레이 이펙트를 판정한다.
#  python3 r96/qa/r1293/check.py OUT   (헤드리스 소프트웨어 렌더 기준 — GPU·실기기·자연 플레이 미검증)
import json,sys,re
from PIL import Image
OUT=sys.argv[1];D=json.load(open(f'{OUT}/census.json'));R=D['RES'];fails=0
def ok(c,m,d=''):
    global fails
    if not c: fails+=1
    print(('PASS ' if c else 'FAIL ')+m+(' '+json.dumps(d,ensure_ascii=False)[:600] if d!='' else ''))
CODE=re.compile(r'^(r247:|r102:|r160:)\S* :: r106fx:(spark|slashline|line|ring|flare|glow|halo|pillar|cross|feather|shard)$')
bad={sc:{k:v['n'] for k,v in r['img'].items() if CODE.match(k)} for sc,r in R.items()}
ok(all(not b for b in bad.values()),'(1) 실제 평타·Q·W·E·R·확률 패시브·EGO: R247·R102·R160 코드 한 장 그림 0',{k:v for k,v in bad.items() if v})
old={sc:sum(v['n'] for k,v in r['img'].items() if 'effects/246/' in k or ('sig-slash-' in k and k.startswith('r101:'))) for sc,r in R.items()}
ok(all(v==0 for v in old.values()),'(2) 옛 푸른 베기 F246·옛 R100 sig-slash 덧겹 0',old)
has=lambda sc,p:sum(v['n'] for k,v in R[sc]['img'].items() if p in k)
ok(has('W','fx-mk03-michaela-ribbon')>0 and has('E','fx-m7-michaela-sky-pillar')>0 and has('E','fx-m1-michaela-halo')>0 and has('E','r1048/fx/ego_feathers')>0,'(3) W 리본·E 빛기둥·후광·깃털 흩날림 시트가 그려짐',{'W.mk03':has('W','fx-mk03'),'E.m7':has('E','fx-m7'),'E.m1':has('E','fx-m1'),'E.f1':has('E','ego_feathers')})
def lum(f):
    im=Image.open(f).convert('L');w,h=im.size;im=im.crop((0,int(h*.12),w,int(h*.88)));px=im.tobytes();return sum(px)/len(px)/255
base=min(lum(f'{OUT}/A-{t}.png') for t in ['0.20','0.45','0.80','1.20'])
peak={sc:max(lum(f'{OUT}/{sc}-{t}.png') for t in ['0.20','0.45','0.80','1.20']) for sc in R}
ok(all(v-base<=.07 for v in peak.values()),'(4) 어느 기술도 화면 평균 밝기가 평타 장면보다 .07 넘게 오르지 않음',{k:round(v-base,3) for k,v in peak.items()})
ok(not D['errors'],'(5) 페이지 오류 없음',D['errors'])
print(json.dumps({'fails':fails}));sys.exit(1 if fails else 0)
