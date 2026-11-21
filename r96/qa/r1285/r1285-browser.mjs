// R1285 헤드리스 검사 — 작은 폰 가로 화면에서 사몽 페르소나 결전의 페르소나 몸(보이는 화소)이
// 불투명한 체력 패널(위 보스 체력 #bossbar · 아래 영웅 체력 #heroCard)에 가려지지 않는지 잰다.
// 외부 점검(아스트라 QA, #938 SW-0014): "페르소나 812×375 에서 HUD 체력 패널과 상반신 겹침".
// 쓰는 법: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1285/r1285-browser.mjs [OUT]
// 소프트웨어 렌더 헤드리스 — 그래픽(GPU)·실기기 검증 아님.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
import fs from 'node:fs';
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const OUT=process.argv[2]||'r96/qa/r1285/out';fs.mkdirSync(OUT,{recursive:true});
const SECS=+(process.env.R1285_SECS||9);
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const results=[];let failN=0;
const check=(name,ok,detail)=>{results.push({name,ok:!!ok,detail});if(!ok)failN++;console.log((ok?'PASS ':'FAIL ')+name+(detail!==undefined?' — '+JSON.stringify(detail):''));};

async function open(b,W,H,mobile){const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 return {ctx,p};}
async function personaFight(p){
 await p.evaluate(()=>enterRegion('cult04',null,{layer:'DREAM',restore:true}));
 await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip(p);
 await p.evaluate(()=>{room.enemies=[];preparePersona3();});await p.waitForTimeout(500);await skip(p);
 await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);summon3([e],'persona');});
 await p.waitForFunction(()=>room.encounterStage==='active',null,{timeout:120000});await skip(p);}
// 측정기: 그린 뒤 최종 명령에서 페르소나 몸 그림의 '보이는 화소' 상자(알파 32 넘는 칸)를 화면 좌표로 구하고, 패널 상자·실제 불투명도와 견준다.
async function meter(p){await p.evaluate(()=>{
 const prof=new WeakMap();const B=8;
 function profile(img){let pr=prof.get(img);if(pr!==undefined)return pr;pr=null;try{const w=img.naturalWidth||img.videoWidth||img.width,h=img.naturalHeight||img.videoHeight||img.height;if(w>0&&h>0&&w*h<=40e6){
   const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);const d=g.getImageData(0,0,w,h).data;const nb=Math.ceil(w/B);const m=new Uint8Array(nb*h);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>32)m[y*nb+(x/B|0)]=1;pr={w,h,nb,m};}}catch(_){pr=null;}prof.set(img,pr);return pr;}
 function vis(c){const pr=c.image&&profile(c.image);const P=c.points;const sr=c.sourceRect||[0,0,pr?pr.w:1,pr?pr.h:1];if(!pr)return null;
  const[sx,sy,sw,sh]=sr;const b0=Math.max(0,sx/B|0),b1=Math.min(pr.nb-1,((sx+sw-1)/B)|0);let t=-1,bo=-1,l=1e9,r=-1;
  for(let y=Math.max(0,sy|0);y<Math.min(pr.h,sy+sh);y++){for(let k=b0;k<=b1;k++)if(pr.m[y*pr.nb+k]){if(t<0)t=y;bo=y;if(k<l)l=k;if(k>r)r=k;}}
  if(t<0)return null;const u0=(Math.max(sx,l*B)-sx)/sw,u1=(Math.min(sx+sw,(r+1)*B)-sx)/sw,v0=(t-sy)/sh,v1=(bo+1-sy)/sh;
  const L=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k],Q=(u,v)=>L(L(P[0],P[1],u),L(P[3],P[2],u),v);const q=[Q(u0,v0),Q(u1,v0),Q(u1,v1),Q(u0,v1)];
  return [Math.min(...q.map(a=>a[0])),Math.min(...q.map(a=>a[1])),Math.max(...q.map(a=>a[0])),Math.max(...q.map(a=>a[1]))];}
 const eff=el=>{if(!el)return 0;let o=1;for(let x=el;x&&x.nodeType===1;x=x.parentElement){const cs=getComputedStyle(x);if(cs.display==='none'||cs.visibility==='hidden')return 0;o*=+cs.opacity;}return o;};
 const R=__STORYWORLD_PHASE1__.controller.state.three,O=R.render;window.__m={frames:0,body:0,bad:[],minGap:{},op:{bossbar:[],heroCard:[]},title:''};
 R.render=function(f){const res=O.apply(this,arguments);try{const e=room.enemies.find(e=>e.persona&&e.hp>0);if(!e)return res;const M=window.__m;M.frames++;let box=null;
  for(const c of f.commands||[]){if(!c||c.kind!=='image'||!Array.isArray(c.points)||c.points.length!==4)continue;const sp=String(c.sourcePath||'');
   if(/glow/.test(sp))continue;if(!(c.r1104b||c.r1104Cast||/rc133\/art|r1097:ink|r1104b:|r1119:hit|r1119:death/.test(sp)))continue;if(c.owner&&c.owner.kind&&c.owner.kind!=='enemy')continue;
   const v=vis(c);if(!v)continue;box=box?[Math.min(box[0],v[0]),Math.min(box[1],v[1]),Math.max(box[2],v[2]),Math.max(box[3],v[3])]:v;}
  if(!box)return res;M.body++;const cv=document.getElementById('game').getBoundingClientRect(),k=cv.width/W;const sb=[cv.left+box[0]*k,cv.top+box[1]*k,cv.left+box[2]*k,cv.top+box[3]*k];
  for(const id of ['bossbar','heroCard']){const el=document.getElementById(id);const op=eff(el);M.op[id].push(+op.toFixed(2));if(op<=0)continue;const r=el.getBoundingClientRect();
   const ov=!(sb[2]<=r.left||sb[0]>=r.right||sb[3]<=r.top||sb[1]>=r.bottom);if(ov&&op>0.6&&M.bad.length<40)M.bad.push({t:+time.toFixed(2),id,op:+op.toFixed(2),body:sb.map(Math.round),panel:[r.left,r.top,r.right,r.bottom].map(Math.round)});}
  M.title=(document.getElementById('bossTitle')?.textContent||'').trim().slice(0,40);M.cls=document.documentElement.className.match(/r1285[\w-]*/g)||[];}catch(err){window.__m.err=String(err);}return res;};
 const T=window.tick;window.tick=function(...a){const r=T.apply(this,a);try{player.hp=maxHP();}catch(_){}return r;};});}
async function runFor(p,secs){const t0=await p.evaluate(()=>time);while((await p.evaluate(()=>time))-t0<secs)await p.waitForTimeout(400);return p.evaluate(()=>window.__m);}

const b=await chromium.launch();
// ① 작은 가로 화면 3종: 불투명 패널에 가린 몸 프레임 0
for(const [W,H] of [[812,375],[667,375],[640,360]]){const {ctx,p}=await open(b,W,H,true);await personaFight(p);await meter(p);
 const m=await runFor(p,SECS);await p.screenshot({path:`${OUT}/small-${W}x${H}.png`});
 check(`①${W}x${H} 페르소나 몸이 실제로 측정됨(프레임≥40)`,m.body>=40,{frames:m.frames,body:m.body,err:m.err||null});
 check(`②${W}x${H} 불투명(>0.6) 체력 패널이 페르소나 몸을 가린 프레임 0`,m.bad.length===0,{bad:m.bad.length,first:m.bad.slice(0,3)});
 const bo=m.op.bossbar.filter(v=>v>0);check(`③${W}x${H} 보스 체력 패널은 계속 보임(불투명도≥0.3, 이름 있음)`,bo.length>=m.body*.9&&Math.min(...bo)>=.3&&/페르소나/.test(m.title),{n:bo.length,min:Math.min(...bo),title:m.title});
 const hc=m.op.heroCard.filter(v=>v>0);check(`④${W}x${H} 영웅 체력 패널도 계속 보임(불투명도≥0.3)`,hc.length>=m.body*.9&&Math.min(...hc)>=.3,{n:hc.length,min:Math.min(...hc)});
 // ⑧ 위 왼쪽 지역 이름 띠(#mobileMapR74)·금화 칸은 R1285 를 꺼도 켜도 같은 자리(보스 패널을 줄여도 나침반을 덮지 않게)
 const rect=()=>p.evaluate(()=>{const o={};for(const id of ['mobileMapR74','goldHudR72','bossbar']){const e=document.getElementById(id);if(e&&getComputedStyle(e).display!=='none'){const r=e.getBoundingClientRect();o[id]=[r.left,r.top,r.right,r.bottom].map(Math.round);}}return o;});
 const onR=await rect();await p.evaluate(()=>window.__STORYWORLD_PERSONA_HUD_R1285__?.set(false));await p.waitForTimeout(1500);const offR=await rect();await p.evaluate(()=>window.__STORYWORLD_PERSONA_HUD_R1285__?.set(true));
 check(`⑧${W}x${H} 지역 이름 띠·금화 칸 자리는 그대로(켬/끔 같은 위치)`,!!onR.mobileMapR74&&JSON.stringify(onR.mobileMapR74)===JSON.stringify(offR.mobileMapR74)&&JSON.stringify(onR.goldHudR72||null)===JSON.stringify(offR.goldHudR72||null),{on:onR,off:offR});
 check(`⑨${W}x${H} 보스 체력 패널 아래 끝이 줄어듦(여백 확보)`,!!(onR.bossbar&&offR.bossbar)&&onR.bossbar[3]<=offR.bossbar[3]-15,{on:onR.bossbar,off:offR.bossbar});
 fs.writeFileSync(`${OUT}/small-${W}x${H}.json`,JSON.stringify({W,H,frames:m.frames,body:m.body,bad:m.bad,cls:m.cls},null,1));await ctx.close();}
// ⑤ PC 1280×720: 손대지 않음(보스 패널 늘 불투명 1, R1285 표시 없음)
{const {ctx,p}=await open(b,1280,720,false);await personaFight(p);await meter(p);const m=await runFor(p,5);
 const bo=m.op.bossbar.filter(v=>v>0);check('⑤PC 1280x720 보스 체력 패널 불투명도 그대로 1·R1285 표시 없음',bo.length>0&&Math.min(...bo)>=.99&&!(m.cls||[]).length,{min:Math.min(...bo),cls:m.cls});
 const bb=await p.evaluate(()=>{const r=document.getElementById('bossbar').getBoundingClientRect();return [r.left,r.top,r.width,r.height].map(Math.round);});
 check('⑥PC 1280x720 보스 체력 패널 자리·크기 기존값 그대로(고치기 전 헤드리스 실측 908,2,282,38)',JSON.stringify(bb)===JSON.stringify([908,2,282,38]),bb);await ctx.close();}
// ⑦ 작은 가로 화면이라도 페르소나 결전이 아니면 R1285 표시 없음
{const {ctx,p}=await open(b,812,375,true);await p.waitForTimeout(800);const cls=await p.evaluate(()=>document.documentElement.className.match(/r1285[\w-]*/g)||[]);
 check('⑦812x375 본편(페르소나 결전 아님)에서는 R1285 표시 없음',!cls.length,cls);await ctx.close();}
await b.close();
fs.writeFileSync(`${OUT}/result.json`,JSON.stringify({failN,results},null,1));
console.log(`\nR1285 browser: ${results.length-failN}/${results.length} 통과`);process.exit(failN?1:0);
