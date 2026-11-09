// R440 헤드리스 재현: 피의 육망성 조형물(R170 탑)이 잡몹을 부를 때 띄우는 균열 문(pvfx-rift-portal, 핏빛 빨간 원 둘)이 사라지는지.
// U=http://127.0.0.1:4396/ node r96/qa/r440/r440-rift-linger.mjs   (Z=지역 id, 기본 ep1b07)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.U||'http://127.0.0.1:4396/',Z=process.env.Z||'ep1b07',OUT=process.env.OUT||'.';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),Z);await p.waitForFunction(z=>!loading&&zone===z,Z,{timeout:180000});await p.waitForTimeout(2000);await skip();
await p.waitForFunction(()=>window.__STORYWORLD_PIXELFX_R163__?.ready(),null,{timeout:30000});
// 탑은 들어선 지 6초 뒤 영웅이 탑 자리 10칸 안에 있을 때 선다 — 자동 진행을 끄고 그 자리 옆에 붙잡아 둔다.
await p.evaluate(()=>{const b=tick;tick=function(...a){if(player)player.hp=777;const r=b.apply(this,a);if(player)player.hp=777;return r;};});// 시험 전용: 영웅이 몹 무리에 죽지 않게(매 틱 체력 채움)
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{auto=false;const s=window.__STORYWORLD_COMBAT_R170__.nextSpot();if(s){player.x=s.x+2;player.y=s.y;}return (room.enemies||[]).some(e=>e.r170Tower&&e.hp>0);});if(ok)break;await p.waitForTimeout(1000);}
const setup=await p.evaluate(()=>{const t=(room.enemies||[]).find(e=>e.r170Tower&&e.hp>0);if(!t)return null;
 player.x=t.x+2.2;player.y=t.y+.4;player.hp=player.maxHp;t.r170Tower.casts=1;t.r170Tower.next=time;// 다음 시전이 짝수 번째 → 소환
 return {tower:t.id,x:t.x,y:t.y};});
console.log('setup',JSON.stringify(setup));if(!setup){await b.close();process.exit(2);}
const probe=()=>p.evaluate(()=>{const X=window.__STORYWORLD_PIXELFX_R163__.inspect();return {modal,story:!!storyScene,loading,hp:Math.round(player.hp),time:+time.toFixed(2),rift:X.active.filter(n=>n==='pvfx-rift-portal').length,active:X.active.length,summons:window.__STORYWORLD_COMBAT_R170__?.inspect?.().stats?.summons};});
const rows=[];for(const s of [0.3,1.0,2.5,6,12]){await p.waitForTimeout(s*1000-(rows.at(-1)?.waited||0));await skip();const r=await probe();r.waited=s*1000;rows.push(r);console.log('t+'+s+'s',JSON.stringify(r));if(s===1.0)await p.screenshot({path:OUT+'/r440-rift-1s.jpg',quality:70});}
await p.screenshot({path:OUT+'/r440-rift-12s.jpg',quality:70});
// 대조: 고치기 전 부르기(until 없음)를 같은 자리에서 한 번 — 반복 시트라 12초 뒤에도 남아야 기제가 맞다.
const ctl=await p.evaluate(async()=>{const X=window.__STORYWORLD_PIXELFX_R163__,e=X.play('pvfx-rift-portal',player.x+1,player.y,{k:.75,key:'r440-control',tint:{a:[110,8,18],b:[255,96,96]}});const t0=time;await new Promise(r=>setTimeout(r,12000));const n=X.inspect().active.filter(n=>n==='pvfx-rift-portal').length;X.stop('r440-control');return {oldCallStillThere:n,after:+(time-t0).toFixed(1)};});
console.log('CONTROL(old call, no until)',JSON.stringify(ctl));
const first=rows.find(r=>r.rift>0),last=rows.at(-1);console.log('RESULT',JSON.stringify({sawRift:!!first,riftAtEnd:last.rift,errors:errs}));
await b.close();process.exit(first&&last.rift===0?0:1);
