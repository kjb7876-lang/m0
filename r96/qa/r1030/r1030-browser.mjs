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
 // 재는 동안 화면이 바뀌지 않게: 몹을 멀리 보내고(전투·이펙트 없음) 탄·이펙트가 사라질 때까지 1.5초 흘린 뒤 멈춘다.
 //  (몹을 옆에 두면 헤드리스에서 두 그리기 사이에 공격·스킬 빛이 끼어 몸 밝기를 잘못 잰다.)
 await p.evaluate(()=>{for(const e of room.enemies){e.x=player.x+60;e.y=player.y+60;}try{projectiles.length=0;}catch(_){}player.hp=maxHP();});
 await p.evaluate(()=>__HQ795.step(1.5,3));await p.evaluate(()=>{window.__SLOW=1e-5;});
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
  console.log('    (pixel numbers above are informational — headless frames are not fully static)');}
 // 렌더 중 실제 값: 메시 onBeforeRender 는 엔진 render 안(R1030 이 필터를 바꾼 뒤)에 불린다 → 그 순간 필터 행렬·오프셋을 읽는다.
 const probe=async on=>p.evaluate(on=>{const A=window.__STORYWORLD_HERO_HARMONY_R1030__;A.setEnabled(on);const r=window.__STORYWORLD_PHASE1__.controller.state.three,gl=r.renderer;const got={hero:[],enemy:[]};
  // renderBufferDirect 는 엔진 render 안에서 물체마다 불린다(R1030 이 필터를 바꾼 뒤) → 그 순간 그 물체 재질 필터를 읽는다.
  const base=gl.renderBufferDirect;let kindOf=null;
  gl.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){try{if(!kindOf){kindOf=new Map();for(const row of r.commands.rows.values()){const ow=row.geometryState?.owner;if(row.mesh&&!ow?.groundAligned&&(ow?.kind==='hero'||ow?.kind==='enemy'))kindOf.set(row.mesh,ow.kind);}}
   const k=kindOf.get(obj),f=mat?.userData?.filter;if(k&&f&&mat.map)got[k].push({e0:f.m.elements[0],o:f.offset.x});}catch(_){}return base.apply(this,arguments);};
  try{draw();}finally{gl.renderBufferDirect=base;}
  const sum=k=>got[k].length?{n:got[k].length,e0:Math.min(...got[k].map(g=>g.e0)),o:Math.min(...got[k].map(g=>g.o))}:{n:0};
  return{hero:sum('hero'),enemy:sum('enemy'),orig:[...r.commands.rows.values()].filter(rw=>rw.geometryState?.owner?.kind==='hero'&&rw.mesh?.material?.userData?.filter).map(rw=>rw.mesh.material.userData.filter.m.elements[0])};},on);
 const off=await probe(false),onv=await probe(true);console.log('    probe',hero,JSON.stringify({off,on:onv}));
 ok(`${hero}: hero body drawn this frame`,onv.hero.n>0&&off.hero.n>0,{off,onv});
 if(PALE.has(hero)){ok(`${hero}: pale hero body filter graded at render time (gain < .95× off, offset < 0, finite)`,onv.hero.e0<off.hero.e0*.95&&onv.hero.o<0&&Number.isFinite(onv.hero.e0+onv.hero.o),onv);
  ok(`${hero}: grade keeps readability floor (gain ≥ .70)`,onv.hero.e0>=.70*off.hero.e0-1e-6,{off,onv});}
 else ok(`${hero}: dark-clothed hero untouched at render time`,Math.abs(onv.hero.e0-off.hero.e0)<1e-9&&Math.abs(onv.hero.o-off.hero.o)<1e-9,{off,onv});
 ok(`${hero}: mobs untouched at render time`,onv.enemy.n===0||(Math.abs(onv.enemy.e0-off.enemy.e0)<1e-6&&Math.abs(onv.enemy.o-off.enemy.o)<1e-9),{off,onv});
 ok(`${hero}: filter restored after render`,onv.orig.every(v=>Math.abs(v-1)<1e-9||Number.isFinite(v))&&JSON.stringify(onv.orig)===JSON.stringify(off.orig),{off:off.orig,on:onv.orig});
 ok(`${hero}: no R1030 errors`,st.stats.errors===0&&!st.lastError,st);ok(`${hero}: no page errors`,errs.length===0,errs);
 await ctx.close();}
await b.close();const bad=checks.filter(c=>!c.p);console.log(`R1030 browser ${checks.length-bad.length}/${checks.length}`+(MOBILE?' (mobile)':''));if(bad.length)process.exit(1);
