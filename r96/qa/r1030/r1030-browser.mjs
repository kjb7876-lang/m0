// R1030 헤드리스 브라우저 검사(Chromium 소프트웨어 렌더링 — GPU·실기기 아님): 같은 멈춘 장면을 R1030 끔/켬으로 두 번 그려
//  영웅 몸 상자(Three 카메라로 영웅 몸 메시를 화면에 투영) 안 밝기와 둘레 바탕 밝기를 잰다.
//  통과: 밝은 옷 영웅은 몸 상자 밝기가 내려가고(장면에 붙음) 둘레와의 밝기 차는 여전히 크다(가독성), 어두운 옷 영웅은 그대로, 오류·NaN 없음.
// 사용: SW_URL=http://127.0.0.1:4411/m0/ node r1030-browser.mjs   (VP=mobile 이면 844×390 터치)
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4411/m0/';const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const MOBILE=process.env.VP==='mobile';const OUT=process.env.OUT||path.join(HERE,'review');fs.mkdirSync(OUT,{recursive:true});
const JOBS=(process.argv.slice(2).length?process.argv.slice(2):['hwando:dist00','michaela:dist02','gunner:ep1b07','neon:ep1a08']).map(s=>s.split(':'));
const PALE=new Set(['hwando','michaela','gunner','seoha']);
const checks=[];const ok=(n,p,d)=>{checks.push({n,p:!!p,d});console.log((p?'PASS ':'FAIL ')+n+(p?'':' '+JSON.stringify(d)));};
const b=await chromium.launch();
// 몸 밝기 = 각 화면에서 그 화면의 영웅 몸 메시 투영 상자 안 가장 밝은 픽셀 600개 평균(밝은 옷 영웅의 몸·테가 차지).
//  두 그리기 사이 카메라·자세가 조금 움직여도(헤드리스는 완전히 안 멈춘다) 같은 기준으로 잴 수 있다.
//  어두운 옷 영웅은 상자 가운데 평균. 둘레 = 상자 밖 띠(상자 폭 .6·높이 .25 만큼).
async function lumStats(p,file,box,pale){return p.evaluate(async({b64,box,pale})=>{
 const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
 const d=g.getImageData(0,0,c.width,c.height).data,W=c.width,H=c.height,L=(x,y)=>{const i=(y*W+x)*4;return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2];};
 const {x0,y0,x1,y1}=box,w=x1-x0,h=y1-y0;let r=0,nr=0;const inside=[];let sc=0,nc=0;
 for(let y=Math.max(0,Math.floor(y0-h*.25));y<Math.min(H,Math.ceil(y1+h*.25));y++)for(let x=Math.max(0,Math.floor(x0-w*.6));x<Math.min(W,Math.ceil(x1+w*.6));x++){
  const l=L(x,y);if(x<x0||x>x1||y<y0||y>y1){r+=l;nr++;}else{inside.push(l);if(x>x0+w*.3&&x<x1-w*.3&&y>y0+h*.2&&y<y1-h*.2){sc+=l;nc++;}}}
 inside.sort((a,b)=>b-a);const N=Math.min(600,Math.floor(inside.length/3));let s=0;for(let i=0;i<N;i++)s+=inside[i];
 return{body:pale?(N?s/N:NaN):(nc?sc/nc:NaN),ring:nr?r/nr:NaN,n:pale?N:nc};},{b64:fs.readFileSync(file).toString('base64'),box,pale});}
for(const [hero,z] of JOBS){
 const ctx=await b.newContext(MOBILE?{viewport:{width:844,height:390},deviceScaleFactor:1,hasTouch:true,isMobile:true}:{viewport:{width:1280,height:720},deviceScaleFactor:1});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:240000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(600);await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip();
 await p.addScriptTag({content:HELPER});await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
 await p.evaluate(()=>{player.hp=maxHP();__HQ795.engage(false);});await p.evaluate(()=>__HQ795.step(.4,3));
 await p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)).slice(0,2);live.forEach((e,i)=>{e.x=player.x+(i?-1.8:1.9);e.y=player.y+(i?1:-.6);});player.hp=maxHP();});
 await p.evaluate(()=>__HQ795.step(.1,3));await p.evaluate(()=>{window.__SLOW=1e-5;});
 const has=await p.evaluate(()=>!!window.__STORYWORLD_HERO_HARMONY_R1030__);ok(`${hero}: R1030 loaded`,has);if(!has){await ctx.close();continue;}
 const shots={},boxes={};let box=null;
 for(const [k,on] of [['before',false],['after',true]]){
  box=await p.evaluate(on=>{const A=window.__STORYWORLD_HERO_HARMONY_R1030__;A.setEnabled(on);draw();draw();draw();
   const r=window.__STORYWORLD_PHASE1__.controller.state.three,T=r.T,cv=r.renderer.domElement.getBoundingClientRect();let best=null;
   for(const [key,row] of r.commands.rows.entries()){const ow=row.geometryState?.owner,m=row.mesh;if(ow?.kind!=='hero'||!m?.visible||!m.material?.map||ow.groundAligned)continue;
    const bb=new T.Box3().setFromObject(m);const xs=[],ys=[];for(const X of [bb.min.x,bb.max.x])for(const Y of [bb.min.y,bb.max.y])for(const Z of [bb.min.z,bb.max.z]){const v=new T.Vector3(X,Y,Z).project(r.camera);xs.push((v.x+1)/2*cv.width);ys.push((1-v.y)/2*cv.height);}
    const b={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};const a=(b.x1-b.x0)*(b.y1-b.y0);if(!best||a>best.a)best={...b,a};}
   return best;},on);
  boxes[k]=box;shots[k]=path.join(OUT,`${hero}-${z}-${MOBILE?'mobile':'pc'}-${k}.png`);/* 게임 캔버스만 찍는다 — 음악 쪽지 같은 DOM 알림이 사라지는 것을 바탕 변화로 잘못 재지 않게 */
  await p.evaluate(()=>{window.__R1030CV=window.__STORYWORLD_PHASE1__.controller.state.three.renderer.domElement;});
  await (await p.evaluateHandle(()=>window.__R1030CV)).asElement().screenshot({path:shots[k],timeout:120000});}
 const st=await p.evaluate(()=>window.__STORYWORLD_HERO_HARMONY_R1030__.inspect());
 ok(`${hero}: hero body box found on screen`,box&&Number.isFinite(box.x0+box.y0+box.x1+box.y1)&&box.x1-box.x0>8,box);
 if(box){box=boxes.before;const B=await lumStats(p,shots.before,boxes.before,PALE.has(hero)),A=await lumStats(p,shots.after,boxes.after,PALE.has(hero)),M={before:B,after:A,n:Math.min(B.n,A.n)},d=M;
  console.log('   ',hero,z,JSON.stringify({box:{x0:Math.round(box.x0),y0:Math.round(box.y0),x1:Math.round(box.x1),y1:Math.round(box.y1)},n:M.n,before:{body:+B.body.toFixed(1),ring:+B.ring.toFixed(1)},after:{body:+A.body.toFixed(1),ring:+A.ring.toFixed(1)}}));
  ok(`${hero}: measurements finite (body pixels ≥ 150)`,[B.body,B.ring,A.body,A.ring].every(Number.isFinite)&&M.n>=150,d);
  if(PALE.has(hero)){ok(`${hero}: pale body pixels come down toward the scene (≥6 luma)`,A.body<=B.body-6,d);
   ok(`${hero}: still clearly brighter than its surroundings (body−ring ≥ 25 luma)`,A.body-A.ring>=25,d);}
  else ok(`${hero}: dark-clothed hero body unchanged (<1.5 luma)`,Math.abs(A.body-B.body)<1.5,d);
  ok(`${hero}: surroundings not changed by R1030 (ring Δ < 2 luma)`,Math.abs(A.ring-B.ring)<2,d);}
 ok(`${hero}: no R1030 errors`,st.stats.errors===0&&!st.lastError,st);ok(`${hero}: no page errors`,errs.length===0,errs);
 await ctx.close();}
await b.close();const bad=checks.filter(c=>!c.p);console.log(`R1030 browser ${checks.length-bad.length}/${checks.length}`+(MOBILE?' (mobile)':''));if(bad.length)process.exit(1);
