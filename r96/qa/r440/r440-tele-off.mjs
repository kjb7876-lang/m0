// R440 헤드리스: 적 공격 바닥 예고 띠(drawNativeGroundArt154 warning·flight)와 R52 돌진 길(하얀 실선 직사각형)이 예고 표시 꺼짐(기본)에서 화면 명령에 남지 않는지.
// 같은 판에서 앞 절반은 기본(꺼짐), 뒤 절반은 R425 tele 를 켠 대조. U=http://127.0.0.1:4396/ ZS=ep1b07,ep1a10 node r96/qa/r440/r440-tele-off.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.U||'http://127.0.0.1:4396/',ZS=(process.env.ZS||'ep1b07,ep1a10').split(','),OUT=process.env.OUT||'.';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
await p.evaluate(()=>{const b=tick;tick=function(...a){if(player)player.hp=777;return b.apply(this,a);};// 시험 전용: 죽지 않게
 window.__r440={};const bump=k=>__r440[k]=(__r440[k]||0)+1;
 window.__wrapR=()=>{const R=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!R||R.__r440)return;R.__r440=1;const rb=R.render;R.render=function(frame){try{for(const c of frame?.commands||[]){const y=c?.style||{};if(c?.kind==='stroke'&&y.strokeStyle==='rgba(211,193,151,.72)')bump((window.__tele?'on':'off')+':laneStroke');if(c?.kind==='fill'&&y.fillStyle==='rgba(186,165,119,.075)')bump((window.__tele?'on':'off')+':laneFill');}}catch(_){}return rb.call(this,frame);};};
 const g=drawNativeGroundArt154;drawNativeGroundArt154=function(path,rect,gg,alpha,stage,...a){if(stage==='warning'||stage==='flight'){const r=g.apply(this,[path,rect,gg,alpha,stage,...a]);bump((window.__tele?'on':'off')+':groundWarn:'+(r?'drawn':'none'));return r;}return g.apply(this,[path,rect,gg,alpha,stage,...a]);};});
const near=()=>p.evaluate(()=>{window.__wrapR();auto=true;if(!room.enemies.some(e=>e.hp>0&&e.spawnState==='active'&&Math.hypot(e.x-player.x,e.y-player.y)<6)){const e=room.enemies.filter(e=>e.hp>0&&e.spawnState==='active').sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(e){player.x=e.x+2.4;player.y=e.y+.3;}}});
const run=async(n)=>{for(let i=0;i<n;i++){await near();await p.evaluate(()=>{for(let k=0;k<240;k++){tick(1/60);if(k%3===0)draw();}});await skip();}};
for(const Z of ZS){for(const tele of [false,true]){await p.evaluate(t=>{window.__tele=t;window.__STORYWORLD_COMBAT_FLOW_R425__?.set?.('tele',t);},tele);
 await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),Z);await p.waitForFunction(z=>!loading&&zone===z,Z,{timeout:180000});await p.waitForTimeout(1500);await skip();await run(8);
 await p.screenshot({path:`${OUT}/r440-tele-${Z}-${tele?'on':'off'}.jpg`,quality:60});}}
const out=await p.evaluate(()=>({counts:window.__r440,r425:window.__STORYWORLD_COMBAT_FLOW_R425__?.inspect?.()?.stats}));
console.log(JSON.stringify(out.counts));console.log('r425',JSON.stringify({teleHidden:out.r425?.teleHidden,groundTeleHidden:out.r425?.groundTeleHidden}));console.log('errors',errs);
const c=out.counts||{};const bad=(c['off:laneStroke']||0)+(c['off:groundWarn:drawn']||0);console.log('RESULT',JSON.stringify({offVisible:bad,onLane:c['on:laneStroke']||0,onGround:c['on:groundWarn:drawn']||0}));
await b.close();process.exit(bad===0&&!errs.length?0:1);
