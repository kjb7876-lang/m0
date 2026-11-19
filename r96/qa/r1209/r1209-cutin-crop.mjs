// R1209 페르소나 스킬 컷인(R1174 (진) 유성 궤도·(진) 쌍성 소멸) 그림 잘림 검사 — 헤드리스 소프트웨어 렌더링(그래픽·GPU·실기기 검증 아님).
// 실행: node r96/qa/r1209/r1209-cutin-crop.mjs [스크린샷 폴더]
// 모듈 하나만 빈 페이지에 올려 여러 화면비(PC·울트라와이드·4:3·폰 가로·폰 세로)에서 컷인을 띄우고 애니메이션을 다 들어온 순간(500ms)에 멈춘 뒤,
//  상반신 그림의 '보여야 하는 부분'(그림 위쪽 1.6%~마스크가 0이 되는 82%, 가운데 세로줄 + 마스크 완전 불투명 가로띠)이
//  실제로 잘리는 상자(화면 · contain:paint/overflow 로 자르는 조상) 밖으로 나가지 않는지 본다.
import {createRequire} from 'node:module';const {chromium}=createRequire(import.meta.url)('playwright');
import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const ROOT=path.resolve(HERE,'../../');
const MOD=path.join(ROOT,'client-source/persona-cutin-r1174.js');const BASE=process.env.SW_URL||'http://127.0.0.1:4396/site/'; // 빌드된 site 를 정적 서버로(python3 -m http.server 4396, r96/hospital-three-pc 에서)
const OUT=process.argv[2]||'';let fails=0,passes=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);c?passes++:fails++;};
const VPS=[[1920,1080],[1280,720],[960,540],[2560,1080],[1024,768],[844,390],[667,375],[390,844],[360,640]];
const b=await chromium.launch();
for(const [w,h] of VPS){
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'favicon-r1209-none');await p.setContent(`<!doctype html><html><head><base href="${BASE}"><meta name="viewport" content="width=device-width"><style>html,body{margin:0;height:100%;overflow:hidden;background:#333}</style></head><body><div id="stage" style="position:relative;width:100vw;height:100vh"></div><script>var player={hero:'lauren',personaHeroR1113:true};var time=0;</script></body></html>`);
 await p.addScriptTag({path:MOD});
 for(const kind of ['violet','meteor']){
  const r=await p.evaluate(async kind=>{const A=window.__STORYWORLD_PERSONA_CUTIN_R1174__;const shown=A.show(kind);const el=document.getElementById('r1174Cutin');
   const img=el&&el.querySelector('img.r1174main');if(img&&!img.complete)await new Promise(r=>{img.addEventListener('load',r);setTimeout(r,3000);});await new Promise(r=>setTimeout(r,400));
   for(const a of document.getAnimations()){a.pause();const t=a.effect&&a.effect.target;const d=t?parseFloat(getComputedStyle(t).animationDelay)||0:0;a.currentTime=Math.max(0,500-d*1000);}
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   // 잘리는 상자 = 화면 ∩ (contain paint 또는 overflow≠visible 인 조상들)
   let clip={l:0,t:0,r:innerWidth,b:innerHeight};const clippers=[];
   for(let n=img&&img.parentElement;n&&n!==document.documentElement;n=n.parentElement){const cs=getComputedStyle(n);
    if(/paint|strict|content/.test(cs.contain)||cs.overflow!=='visible'&&n!==document.body){const q=n.getBoundingClientRect();clippers.push(n.id||n.tagName);clip={l:Math.max(clip.l,q.left),t:Math.max(clip.t,q.top),r:Math.min(clip.r,q.right),b:Math.min(clip.b,q.bottom)};}}
   const q=img?img.getBoundingClientRect():null;const nm=el.querySelector('.r1174name').getBoundingClientRect();
   const orbs=[...el.querySelectorAll('.r1174orb')].map(o=>{const z=o.getBoundingClientRect();return {l:z.left,t:z.top,r:z.right,b:z.bottom};});
   return {shown,src:img&&img.getAttribute('src'),nat:img&&[img.naturalWidth,img.naturalHeight],img:q&&{l:q.left,t:q.top,r:q.right,b:q.bottom,w:q.width,h:q.height},clip,clippers,
    name:{l:nm.left,t:nm.top,r:nm.right,b:nm.bottom},orbs,inspect:A.inspect()};},kind);
  const tag=`${w}x${h} ${kind}`;
  ok(r.shown&&r.img&&r.nat&&r.nat[0]>0,`${tag}: 컷인 뜸·상반신 그림 읽힘 (${r.src}, ${r.nat})`);
  if(!r.img)continue;const I=r.img,C=r.clip,E=1;
  // 꼭 보여야 하는 영역: 가운데 세로줄 y 1.6%~82%, 마스크 완전 불투명 띠 x 15.7%~84.3% (y 36% 줄)
  const need={l:I.l+I.w*.157,r:I.l+I.w*.843,t:I.t+I.h*.016,b:I.t+I.h*.82};
  const cut={top:Math.max(0,C.t-need.t),bottom:Math.max(0,need.b-C.b),left:Math.max(0,C.l-need.l),right:Math.max(0,need.r-C.r)};
  ok(cut.top<=E,`${tag}: 머리(그림 위쪽) 안 잘림 — 잘린 높이 ${cut.top.toFixed(1)}px (그림 위 ${I.t.toFixed(0)}, 자르는 상자 위 ${C.t.toFixed(0)} [${r.clippers.join(',')||'화면'}])`);
  ok(cut.bottom<=E,`${tag}: 몸·손(마스크가 0 되기 전)에서 딱 끊기지 않음 — 잘린 높이 ${cut.bottom.toFixed(1)}px (마스크 끝 ${need.b.toFixed(0)}, 상자 아래 ${C.b.toFixed(0)})`);
  ok(cut.left<=E&&cut.right<=E,`${tag}: 좌우 안 잘림 (${cut.left.toFixed(1)}/${cut.right.toFixed(1)})`);
  const nameIn=r.name.l>=-E&&r.name.r<=w+E&&r.name.t>=-E&&r.name.b<=h+E;ok(nameIn,`${tag}: 기술 이름 줄 화면 안`);
  const orbIn=r.orbs.every(o=>o.t>=C.t-E&&o.b<=C.b+E&&o.t>=-E&&o.b<=h+E);ok(orbIn,`${tag}: 별·구 그림 세로로 안 잘림`);
  if(OUT)await p.screenshot({path:`${OUT}/cutin-${kind}-${w}x${h}.png`});
 }
 ok(errs.length===0,`${w}x${h}: 페이지 오류 0 ${errs.join(' | ')}`);
 await p.close();
}
await b.close();
console.log(`\nR1209 결과: 통과 ${passes} · 실패 ${fails}`);process.exit(fails?1:0);
