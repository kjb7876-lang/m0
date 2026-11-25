// 실플레이 검수(2026-11-25, 사용자 결정 "Q 중에도 A 적중이면 소환"): Q 를 실제로 배운 3D 환도가
// 실제 Q 키 → 짧은 뒤 실제 A 키를 눌러 Q 동작 중 A 가 맞으면 2D 소환이 보여야 한다. 고치기 전 공개판 0/4.
// usage: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/hero-summon-v1/q-overlap-browser.mjs
import {chromium,skip,go} from '../r444/lib.mjs';
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',ART='assets/r283/hwando/r271/attack-e.webp',N=+process.env.TRIALS||3;
const VPS=[{label:'desktop',vp:{width:960,height:540}},{label:'compact',vp:{width:390,height:844}}];
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[];let failed=0;
try{for(const sc of VPS){
 const ctx=await b.newContext({viewport:sc.vp,deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r1302.hwando3d','on');});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 await go(p,'dist01');
 const learned=await p.evaluate(()=>{const P=window.__STORYWORLD_PROGRESSION_R62__,G=window.__STORYWORLD_SKILL_GROWTH_R663__;if(player.points<1)player.points+=1;P.purchase('skillQR663',player);return !G.locked('q');});
 await p.evaluate(()=>{window.__STORYWORLD_AUTO_A_R597__?.set?.(false);settings.autoSkill=false;for(const e of room.enemies)if(e.hp>0){e.maxHp=e.hp=1e7;e.speed=0;e.cd=1e9;e.attack=null;}});
 await p.waitForFunction(a=>!!readyImage(a)?.image||(addImage(a),false),ART,{timeout:60000,polling:500});
 const trials=[];
 for(let i=0;i<N;i++){
  await p.waitForFunction(()=>!(player.specialCD>0||player.skillAnim>0||player.attackCD>0||player.attackAnim>0),null,{timeout:300000});
  const placed=await p.evaluate(()=>{const es=room.enemies.filter(e=>e.hp>0&&damageable3(e));for(const e of es)for(const [dx,dy] of [[1.4,0],[-1.4,0],[0,1.4],[0,-1.4]]){const o={x:e.x+dx,y:e.y+dy};if(blocked(o.x,o.y,.3)||!clearLine(o,e))continue;player.x=o.x;player.y=o.y;player.moving=false;target=e;return e.id;}return null;});
  await p.evaluate(()=>{const Q=window.__qov={seen:false,skillAtSeen:false,skill:0,ser:window.__STORYWORLD_PHASE1__.controller.bridge.events.serial,t:time};Q.iv=setInterval(()=>{const s=window.__STORYWORLD_HWANDO3D_R1302__.inspect().summon;if(player.skillAnim>0)Q.skill++;if(s?.visible){Q.seen=true;Q.src=s.source;if(player.skillAnim>0)Q.skillAtSeen=true;}},15);});
  await p.keyboard.press('KeyQ');await p.waitForTimeout(150);await p.keyboard.press('KeyA');
  await p.waitForFunction(()=>time-window.__qov.t>1.2,null,{timeout:120000});
  const r=await p.evaluate(()=>{const Q=window.__qov;clearInterval(Q.iv);const ev=window.__STORYWORLD_PHASE1__.controller.bridge.events.since(Q.ser).filter(e=>e.hero==='hwando'&&e.type==='confirmed-hit');
   const qHit=ev.some(e=>e.kind==='skill'),aHit=ev.some(e=>e.kind==='attack'&&e.damage>0);return {qCast:Q.skill>0&&qHit,aHit,seen:Q.seen,duringQ:Q.skillAtSeen,src:Q.src||null};});
  trials.push({placed,...r});
 }
 const valid=trials.filter(t=>t.qCast&&t.aHit),ok=valid.filter(t=>t.seen&&t.src===ART);
 const row={profile:sc.label,learned,trials,errors};report.push(row);
 if(!learned||valid.length<2||ok.length<valid.length-0||errors.length){failed++;row.fail=`echo ${ok.length}/${valid.length} Q+A trials`;}
 await ctx.close();
}}finally{await b.close();}
console.log(JSON.stringify({url:URL,mode:'headless software GL; not physical device',passed:!failed,report},null,1));
process.exit(failed?1:0);
