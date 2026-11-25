// R1306 2D 영웅 공격·대기 그림 일관성(사용자 2026-11-25 04:53Z "라우렌 네온 공격모션 일관성있는지 대기모션과 검수 … 모든2d영웅 검수")
//  검수 결과 실제로 눈에 띈 차이 두 가지를 파생본 그림으로 맞춘 것을 확인한다(원본 그림은 그대로).
//  ① 라우렌 좌우 공격(R437 attack-e): 머리칼·외투가 자홍빛(색상 중앙값 216/255) → 대기(R130 idle-e, 191)와 같은 남보라로(윤곽·크기 그대로).
//  ② 헌터 좌우 공격(R425 attack-l/r): 대기보다 밝고 덜 짙음(V 75 · S 130 대 V 57 · S 154) → 대기 쪽으로.
//  node r96/qa/r1306/r1306-cpu-check.cjs   (CPU·정적 검사, 그래픽·실기기 미검증)
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'../../..'),RT=path.join(ROOT,'r96/runtime-text'),CS=path.join(ROOT,'r96/client-source');
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,600)));};
const FILE='hero-attack-tone-r1306.js',BASE='assets/r1306-2d/';
const PAIRS=[['assets/r437/attack/lauren/attack-e.webp',BASE+'r437/attack/lauren/attack-e.webp'],['assets/r425/hunter/attack-l.webp',BASE+'r425/hunter/attack-l.webp'],['assets/r425/hunter/attack-r.webp',BASE+'r425/hunter/attack-r.webp']];
// 그림 수치: python(PIL)로 잰다
function stats(p){const py=`
import sys,json
from PIL import Image,ImageStat,ImageChops
im=Image.open(sys.argv[1]).convert('RGBA');w,h=im.size
A=im.getchannel('A');hsv=im.convert('RGB').convert('HSV');Hc,Sc,Vc=hsv.split()
m=A.point(lambda v:255 if v>200 else 0)
st=ImageStat.Stat(hsv,m)
ms=ImageChops.multiply(m,Sc.point(lambda v:255 if v>40 else 0))
hist=Hc.histogram(ms);tot=sum(hist);acc=0;med=None
for k,c in enumerate(hist):
  acc+=c
  if acc*2>=tot:med=k;break
print(json.dumps({'w':w,'h':h,'S':st.mean[1],'V':st.mean[2],'hue':med,'alpha':A.point(lambda v:255 if v>40 else 0).histogram()[255]}))`;
 return JSON.parse(cp.execFileSync('python3',['-c',py,p]).toString());}
const exists=p=>fs.existsSync(path.join(RT,p));
check('(1) 파생본 그림 3장이 있고 원본도 그대로 있다',PAIRS.every(([o,d])=>exists(o)&&exists(d)),PAIRS.map(([o,d])=>[d,exists(d)]));
let L=null,LI=null,LO=null,HU=[],HI=null;
if(PAIRS.every(([,d])=>exists(d))){
 LO=stats(path.join(RT,PAIRS[0][0]));L=stats(path.join(RT,PAIRS[0][1]));LI=stats(path.join(RT,'assets/r130/lauren/idle-e.webp'));
 HI=stats(path.join(RT,'assets/r130/hunter/idle-e.webp'));HU=PAIRS.slice(1).map(([o,d])=>({o:stats(path.join(RT,o)),d:stats(path.join(RT,d))}));
 check('(2) 크기(칸·발 기준점)가 원본과 같다 — 3장 모두 가로·세로 동일',L.w===LO.w&&L.h===LO.h&&HU.every(x=>x.o.w===x.d.w&&x.o.h===x.d.h),{L:[L.w,L.h,LO.w,LO.h]});
 check('(3) 라우렌 공격 색상 중앙값이 대기와 ±6 안(원본은 +25 자홍빛)',Math.abs(L.hue-LI.hue)<=6&&Math.abs(LO.hue-LI.hue)>15,{idle:LI.hue,orig:LO.hue,new:L.hue});
 check('(4) 라우렌 공격 채도·명도는 원본 ±12% 안(색만 돌리고 밝기는 그대로)',Math.abs(L.V/LO.V-1)<=.12&&Math.abs(L.S/LI.S-1)<=.15,{V:[LO.V,L.V],S:[LI.S,LO.S,L.S]});
 check('(5) 라우렌 윤곽(불투명 넓이)은 원본 그대로 ±0.5% — 색만 돌림(머리 크기는 창이 머리 곁을 지나 잘라 줄이면 창이 깨져 손대지 않음)',Math.abs(L.alpha/LO.alpha-1)<=.005,{r:+(L.alpha/LO.alpha).toFixed(3)});
 check('(6) 헌터 공격 명도·채도가 대기와 ±10% 안(원본은 V +32%, S −16%)',HU.every(x=>Math.abs(x.d.V/HI.V-1)<=.10&&Math.abs(x.d.S/HI.S-1)<=.10)&&HU.every(x=>Math.abs(x.o.V/HI.V-1)>.2),HU.map(x=>({V:[HI.V,x.o.V,x.d.V].map(v=>+v.toFixed(1)),S:[HI.S,x.o.S,x.d.S].map(v=>+v.toFixed(1))})));
 check('(7) 헌터 윤곽(불투명 넓이)은 원본 그대로 ±0.5%',HU.every(x=>Math.abs(x.d.alpha/x.o.alpha-1)<=.005),HU.map(x=>x.d.alpha/x.o.alpha));
}else{for(let i=2;i<=7;i++)check(`(${i}) 파생본 없음`,false);}
// 오버레이 동작(순수 함수)
const src=fs.existsSync(path.join(CS,FILE))?fs.readFileSync(path.join(CS,FILE),'utf8'):'';
check('(8) 오버레이 파일이 있다',!!src);
let api=null;
if(src){const ready=new Set();const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'loading'},setInterval:()=>0,
  readyImage:p=>ready.has(p)?{image:{src:p,naturalWidth:10,naturalHeight:10}}:null,ensureImages:()=>Promise.resolve(),player:{hero:'lauren'}};
 sb.window.addEventListener=()=>{};vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){console.log('load err',e.message);}api=sb.window.__STORYWORLD_HERO_ATTACK_TONE_R1306__;
 const T=api?.test;
 check('(9) API·test 노출',!!(api&&T&&typeof T.swap==='function'));
 if(T){
  const mk=(p,h)=>({kind:'image',owner:{kind:'hero'},sourcePath:p,image:{src:p},sourceRect:[1,2,3,4],points:[[0,0],[1,0],[1,1],[0,1]]});
  const c0=mk(PAIRS[0][0]);check('(10) 새 그림이 아직 안 받아졌으면 원본 그대로(옛 그림으로 튀지 않게)',T.swap(c0,{hero:'lauren'})===false&&c0.sourcePath===PAIRS[0][0]);
  PAIRS.forEach(([,d])=>ready.add(d));
  const c1=mk(PAIRS[0][0]),pts=JSON.stringify(c1.points),sr=JSON.stringify(c1.sourceRect);const ok1=T.swap(c1,{hero:'lauren'});
  check('(11) 라우렌 공격 → 파생본, 칸·꼭짓점은 그대로',ok1===true&&c1.sourcePath===PAIRS[0][1]&&c1.image.src===PAIRS[0][1]&&JSON.stringify(c1.points)===pts&&JSON.stringify(c1.sourceRect)===sr,c1.sourcePath);
  const c2=mk(PAIRS[1][0]);const c3=mk(PAIRS[2][0]);T.swap(c2,{hero:'hunter'});T.swap(c3,{hero:'hunter'});
  check('(12) 헌터 좌·우 공격 → 각자 파생본',c2.sourcePath===PAIRS[1][1]&&c3.sourcePath===PAIRS[2][1]);
  const c4=mk(PAIRS[0][0]);check('(13) 페르소나 형상일 때는 손대지 않음',T.swap(c4,{hero:'lauren',personaHeroR1113:true})===false&&c4.sourcePath===PAIRS[0][0]);
  const c5=mk('assets/r130/lauren/idle-e.webp');const c6=mk('assets/r1238/neon/attack-e.webp');
  check('(14) 다른 그림(대기·네온)은 그대로',T.swap(c5,{hero:'lauren'})===false&&T.swap(c6,{hero:'neon'})===false&&c5.sourcePath.endsWith('idle-e.webp'));
  const c7=mk(PAIRS[0][0]);c7.owner={kind:'enemy'};check('(15) 영웅 몫이 아닌 명령은 그대로',T.swap(c7,{hero:'lauren'})===false);
  const c8=mk(PAIRS[1][1]);check('(16) 이미 바꾼 명령을 다시 바꾸지 않음(경로 꼬리 유지 — 몸 그림 정규식 r425/hunter·r437 통과)',T.swap(c8,{hero:'hunter'})===false&&/r425\/hunter\//.test(PAIRS[1][1])&&/r437\//.test(PAIRS[0][1]));
  api.setPrefs({on:false});const c9=mk(PAIRS[0][0]);check('(17) 끄기 설정이면 그대로',T.swap(c9,{hero:'lauren'})===false);api.setPrefs({on:true});
 }else for(let i=10;i<=17;i++)check(`(${i}) test 없음`,false);
 check('(18) 판정·피해에 손대지 않음(hitEnemy·damage·attackCD 쓰지 않음)',!/hitEnemy\s*\(|\.damage\s*=|attackCD\s*=/.test(src));
}else for(let i=9;i<=18;i++)check(`(${i}) 오버레이 없음`,false);
// 빌드 연결
const idx=fs.readFileSync(path.join(ROOT,'r96/runtime-text/index.html'),'utf8');
check('(19) index.html 스크립트 태그 한 번(cheat-points-r1126 바로 뒤 — 다른 인접 검사와 안 겹침, drawHero 는 load 다음 틱에 맨 바깥에서 감싸 순서 무관)',idx.includes(`<script src="./cheat-points-r1126.js"></script>\n<script src="./${FILE}"></script>`)&&idx.split(`src="./${FILE}"`).length===2);
const ver=fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8');check('(20) 공개 확인 기대 목록',ver.includes(`'${FILE}'`)&&ver.includes(`'${BASE}'`));
const inp=fs.readFileSync(path.join(ROOT,'r96/runtime-inputs.json'),'utf8');check('(21) runtime-inputs 에 오버레이·파생본',inp.includes(FILE)&&PAIRS.every(([,d])=>inp.includes(d)));
const yml=fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8');check('(22) pages.yml CPU 검사 줄',yml.includes('r96/qa/r1306/r1306-cpu-check.cjs'));
console.log(JSON.stringify({fails}));process.exit(fails?1:0);
