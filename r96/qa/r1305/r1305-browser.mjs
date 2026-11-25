// R1305 3D 영웅 10명 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 기본 꺼짐: GLB 요청 0. ② 영웅마다 켜면 그 영웅 GLB 만 1번 읽고 3D 가 보이며 2D 몸이 빠진다(오류 0).
//  ③ 무기 재질 metalness .65 · roughness .25, opacity 1 이면 transparent=false, 반투명이면 true.
//  ④ 벽 뒤에 세웠을 때 R350/R448 2D 유령(본체 복사)이 3D 위에 남지 않는다.
//  ⑤ 영웅별 자르기(browser-crops.png, 참고용 — 심사 캡처는 r1305-capture.mjs 의 heroes-3d.png).
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1305/r1305-browser.mjs` (playwright 필요)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,boot,go} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner','persona','ego'];
const WEAPON={hwando:1,lauren:1,michaela:1,slayer:1,hunter:1,gunner:1};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
const glbReq=[];p.on('request',r=>{const u=r.url();if(/\.glb(?:$|\?)/.test(u)&&!/\/assets\/r13(09|13)\//.test(u))glbReq.push(u.replace(/^.*\/assets\//,'assets/'));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const I=()=>p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect());
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
const rev=(await I()).revision;ok(/^R1305/.test(rev),'R1305 판 ('+rev+')');
await p.waitForTimeout(1500);ok(glbReq.length===0,'① 기본 꺼짐: GLB 요청 0 ('+glbReq.length+')');
ok(JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.heroes()))===JSON.stringify(['hwando','seoha','neon','lauren','michaela','slayer','hunter','gunner','persona','ego']),'API heroes() 10명');
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
const shots=[];
for(const h of HEROES){
 // 페르소나·EGO 는 형상: 페르소나 = lauren + personaHeroR1113, EGO = hwando + egoSovereignR1046.
 await p.evaluate(async h=>{const base=h==='persona'?'lauren':h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.personaHeroR1113=h==='persona';player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;},h);
 const t0=Date.now();await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===h&&i.ready&&i.shown&&i.bodyFrames>0;},h,{timeout:240000}).catch(()=>null);
 await p.waitForTimeout(600);const s=await I(),m=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.measure());
 const mine=glbReq.filter(u=>u===s.glbPath).length;
 ok(s.hero===h&&s.ready&&s.shown,`② ${h}: 3D 보임 (${s.glbPath}, ${((Date.now()-t0)/1000).toFixed(1)}s)`);
 ok(mine===1,`② ${h}: 자기 GLB 1번만 요청 (${mine})`);
 ok(s.lastBodies>=1&&s.hidden>0,`② ${h}: 2D 몸 행 제거 (bodies ${s.lastBodies})`);
 ok(m&&m.ink>100&&m.bottom-m.top>20,`② ${h}: 화면 정점 ${m?.ink} 키 ${m?(m.bottom-m.top).toFixed(1):'-'}px`);
 if(WEAPON[h])ok(s.weaponMaterial&&Math.abs(s.weaponMaterial.metalness-.65)<1e-6&&Math.abs(s.weaponMaterial.roughness-.25)<1e-6,`③ ${h}: 무기 재질 ${JSON.stringify(s.weaponMaterial)}`);
 ok(s.opacity>=.98?s.transparent===false&&s.depthWrite===true:s.transparent===true,`③ ${h}: opacity ${s.opacity} → transparent ${s.transparent}, depthWrite ${s.depthWrite}`);
 const box=m&&m.ink?m:null;const pad=14;
 if(box){const clip={x:Math.max(0,box.left-pad),y:Math.max(0,box.top-pad),width:Math.min(960,box.right-box.left+pad*2),height:Math.min(540,box.bottom-box.top+pad*2)};shots.push({h,buf:await p.screenshot({clip:{...clip,x:Math.max(0,Math.min(960-clip.width,clip.x)),y:Math.max(0,Math.min(540-clip.height,clip.y))}})});}
}
const all=await I();ok(all.errors===0,'오류 0 ('+all.errors+(all.lastError?' '+all.lastError:'')+')');
ok(new Set(glbReq).size===10&&glbReq.length===10,'GLB 요청 합계 10 (영웅마다 1, 중복 없음) '+glbReq.length);
// 영웅을 되돌려도 다시 읽지 않는다
await p.evaluate(()=>{player.personaHeroR1113=false;player.egoSovereignR1046=false;player.hero='hwando';});await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero==='hwando'&&i.shown;},null,{timeout:60000}).catch(()=>null);
ok(glbReq.length===10&&(await I()).shown,'환도로 돌아와도 추가 요청 없음 ('+glbReq.length+')');
// A natural full-opacity command must reach the actual renderer before any test mutation.
const priorBaseline=await I();
let baseline=null,baselineError=null;
try{
 const handle=await p.waitForFunction(prior=>{
  const now=window.__STORYWORLD_HWANDO3D_R1302__.inspect();
  return now.hero==='hwando'&&now.ready&&now.shown&&now.lastBodies>0&&
    now.drawn>prior.drawn&&now.bodyFrames>prior.bodyFrames&&now.lastBodyAlpha>=.98?now:null;
 },{drawn:priorBaseline.drawn,bodyFrames:priorBaseline.bodyFrames},{timeout:60000});
 try{baseline=await handle.jsonValue();}finally{await handle.dispose();}
}catch(e){baselineError=String(e?.message||e).split(String.fromCharCode(10))[0];}
const baselineState=baseline||await I();
const baselineOkay=!!baseline&&baseline.opacity>=.98&&baseline.transparent===false&&baseline.depthWrite===true&&
 Math.abs(baseline.opacity-baseline.lastBodyAlpha)<1e-6;
ok(baselineOkay,'③ 테스트 전 자연 불투명 본체 '+JSON.stringify({fresh:!!baseline,
 drawn:baselineState.drawn,bodyFrames:baselineState.bodyFrames,sourceAlpha:baselineState.lastBodyAlpha,
 opacity:baselineState.opacity,transparent:baselineState.transparent,depthWrite:baselineState.depthWrite,
 waitError:baselineError}));

// 반투명 몸: opacity <.98 이면 transparent=true
// frame 명령의 영웅 몸 알파를 렌더 바깥에서 .5 로 바꿔(가림 옅게와 같은 상황) 20프레임 본다.
const half=baselineOkay?await p.evaluate(()=>new Promise(res=>{
 const r=window.__STORYWORLD_PHASE1__.controller.state.three, I=()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect();
 const originalRender=r.render, priorOwn=Object.getOwnPropertyDescriptor(r,"render"); let priorDrawn=I().drawn,bodySamples=0,outerRenders=0,finished=false;
 const finish=(timeout,snapshot)=>{
  if(finished)return;
  finished=true;clearTimeout(timer);
  if(r.render===injectHalf){if(priorOwn)Object.defineProperty(r,"render",priorOwn);else delete r.render;}
  res({...snapshot,timeout,bodySamples,outerRenders});
 };
 const timer=setTimeout(()=>finish(true,I()),60000);
 function injectHalf(f){
  // A native wrapper may retain this function; after completion it is strictly pass-through.
  if(finished)return originalRender.apply(this,arguments);
  const savedStyles=new Map();
  let result;
  try{
   if(f&&Array.isArray(f.commands))for(const c of f.commands){
    if(c?.kind!=='image'||c.owner?.kind!=='hero'||!c.style||savedStyles.has(c))continue;
    savedStyles.set(c,c.style);
    c.style={...c.style,globalAlpha:.5};
   }
   result=originalRender.apply(this,arguments);
  }finally{
   // Command records can outlive the frame; restore the exact style object even on errors.
   for(const [command,style] of savedStyles)command.style=style;
  }
  outerRenders++;
  const native=I();
  if(native.hero==='hwando'&&native.ready&&native.shown&&native.lastBodies>0&&
    native.drawn>priorDrawn&&native.lastBodyAlpha===.5)bodySamples++;
  priorDrawn=Math.max(priorDrawn,native.drawn);
  if(bodySamples>=21)finish(false,native);
  return result;
 }
 r.render=injectHalf;
})):({...baselineState,timeout:false,bodySamples:0,outerRenders:0,skipped:true});
ok(half.timeout===false&&half.bodySamples>=21&&half.opacity===.5&&half.transparent===true&&half.depthWrite===false,
 '③ 반투명 몸 '+JSON.stringify({samples:half.bodySamples,outerRenders:half.outerRenders,timeout:half.timeout,
 sourceAlpha:half.lastBodyAlpha,opacity:half.opacity,transparent:half.transparent,depthWrite:half.depthWrite}));
const halfOkay=baselineOkay&&half.timeout===false&&half.bodySamples>=21&&half.lastBodyAlpha===.5&&half.opacity===.5&&half.transparent===true&&half.depthWrite===false;
const restoreInput={drawn:half.drawn,bodyFrames:half.bodyFrames};
let freshOpaque=null,restoreWaitError=null;
if(halfOkay)try{
 const handle=await p.waitForFunction(prior=>{
  const current=window.__STORYWORLD_HWANDO3D_R1302__.inspect();
  // Synchronize to a consumed body command and its input only, not material outputs.
  return current.hero==='hwando'&&current.ready&&current.shown&&current.lastBodies>0&&
    current.drawn>prior.drawn&&current.bodyFrames>prior.bodyFrames&&current.lastBodyAlpha>=.98?current:null;
 },restoreInput,{timeout:60000});
 try{freshOpaque=await handle.jsonValue();}finally{await handle.dispose();}
}catch(e){restoreWaitError=String(e?.message||e).split(String.fromCharCode(10))[0];}
const back=freshOpaque||await I();
ok(!!freshOpaque&&back.opacity>=.98&&back.transparent===false&&back.depthWrite===true&&
 Math.abs(back.opacity-back.lastBodyAlpha)<1e-6,
 '③ 새 불투명 프레임에서 복귀 '+JSON.stringify({fresh:!!freshOpaque,prior:restoreInput,
  drawn:back.drawn,bodyFrames:back.bodyFrames,lastBodies:back.lastBodies,shown:back.shown,
  sourceAlpha:back.lastBodyAlpha,opacity:back.opacity,transparent:back.transparent,depthWrite:back.depthWrite,
  waitError:restoreWaitError,lastError:back.lastError}));

// ④ 벽 뒤: 2D 유령 숨김
const placed=await p.evaluate(()=>{const me={x:player.x,y:player.y},ws=(room.exploration?.walls||[]).filter(w=>w.height>.8&&(w.width>1||w.depth>1)).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y)),w=ws[0];if(!w)return null;const horizontal=w.width>=w.depth,x=w.x-(horizontal?0:w.width/2+.18),y=w.y-(horizontal?w.depth/2+.18:0),hold=()=>{player.x=x;player.y=y;player.moving=false;player.moveVX150=player.moveVY150=0;if(Array.isArray(player.path))player.path.length=0;if(typeof cam==='object'&&cam){cam.x=x;cam.y=y;}};clearInterval(window.__r1305Hold);hold();window.__r1305Hold=setInterval(hold,8);return{x,y};});
ok(!!placed,'④ 벽 뒤 위치 '+JSON.stringify(placed));await p.waitForTimeout(2500);
const ghost=await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();const rows=[...r.commands.rows.values()].map(x=>String(x.mesh?.userData?.key||x.key||''));return{ghostsHidden:i.ghostsHidden,shown:i.shown,heroGhostRows:rows.filter(k=>/^r(350|448):(ghost|over):/.test(k)&&/hero/.test(k)).length};});
ok(ghost.shown&&ghost.heroGhostRows===0,'④ 3D 본체의 2D 유령·앞그림 행 0 '+JSON.stringify(ghost));
await p.evaluate(()=>clearInterval(window.__r1305Hold));
console.log('④ (참고) 유령 숨김 누적 '+ghost.ghostsHidden+' — 0 이면 이 자리에서 R350/R448 이 유령을 만들지 않은 것(미검증 항목으로 보고)');
// ⑤ 캡처 묶음
if(shots.length){const sz=await p.evaluate(async list=>{const ims=await Promise.all(list.map(s=>new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.src='data:image/png;base64,'+s;})));const H=160,W=ims.reduce((a,im)=>a+Math.round(im.width*H/im.height)+6,0);const c=document.createElement('canvas');c.width=W;c.height=H+18;const g=c.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,W,H+18);let x=0;ims.forEach((im,i)=>{const w=Math.round(im.width*H/im.height);g.drawImage(im,x,0,w,H);x+=w+6;});return c.toDataURL('image/png').split(',')[1];},shots.map(s=>s.buf.toString('base64')));
 fs.writeFileSync(path.join(HERE,'browser-crops.png'),Buffer.from(sz,'base64'));console.log('saved browser-crops.png ('+shots.map(s=>s.h).join(',')+')');}
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');await b.close();process.exit(fail?1:0);
