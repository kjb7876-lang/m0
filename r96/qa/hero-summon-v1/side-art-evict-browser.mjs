// 실플레이 검수(2026-11-25) 회귀: 처음 화면(hub)에서 3D 환도를 켠 채 지역을 옮긴 뒤(releaseImageMemory)
// 실제 A 키 적중마다 2D 소환(attack-e.webp 옆모습)이 보여야 한다. 고치기 전 공개판은 0/N.
// usage: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/hero-summon-v1/side-art-evict-browser.mjs
import assert from 'node:assert/strict';
import {chromium,skip,go} from '../r444/lib.mjs';
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',ART='assets/r283/hwando/r271/attack-e.webp';
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
 // 3D 환도가 hub 에서 먼저 그려져 소환 그림을 한 번 요청한 뒤 지역을 옮긴다(자연 플레이 순서).
 await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.().ready===true,null,{timeout:120000});
 await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().frames>3,null,{timeout:60000});
 await go(p,'dist01');
 const afterTravel=await p.evaluate(a=>({cached:imageCache.has(a),size:imageCache.size}),ART);
 await p.evaluate(()=>{window.__STORYWORLD_AUTO_A_R597__?.set?.(false);settings.autoSkill=false;for(const e of room.enemies)if(e.hp>0){e.maxHp=e.hp=1e7;e.speed=0;e.cd=1e9;e.attack=null;}});
 const trials=[];
 for(let i=0;i<3;i++){
  await p.waitForFunction(()=>!(player.attackCD>0||player.attackAnim>0||player.skillAnim>0),null,{timeout:60000});
  const placed=await p.evaluate(()=>{const es=room.enemies.filter(e=>e.hp>0&&damageable3(e));for(const e of es)for(const [dx,dy] of [[1.4,0],[-1.4,0],[0,1.4],[0,-1.4]]){const o={x:e.x+dx,y:e.y+dy};if(blocked(o.x,o.y,.3)||!clearLine(o,e))continue;if(es.some(v=>v!==e&&Math.hypot(v.x-o.x,v.y-o.y)<2.2))continue;player.x=o.x;player.y=o.y;player.moving=false;target=e;return e.id;}return null;});
  assert(placed,'no isolated enemy to hit');
  await p.evaluate(()=>{const Q=window.__evict={seen:false,src:null};Q.hurt=0;Q.skill=0;Q.iv=setInterval(()=>{const s=window.__STORYWORLD_HWANDO3D_R1302__.inspect().summon;if(player.hurtAnim>0)Q.hurt++;if(player.skillAnim>0)Q.skill++;if(s?.visible){Q.seen=true;Q.src=s.source;}},15);});
  // 앞선 판의 이미 받은 그림이 늦게 오는 것과 구분: 첫 A 전에 그림 요청이 다시 되어도 받을 시간을 준다.
  if(i===0)await p.waitForTimeout(3000);
  const t0=await p.evaluate(()=>time);
  await p.keyboard.press('KeyA');
  await p.waitForFunction(t=>time-t>.6,t0,{timeout:60000});
  const r=await p.evaluate(({id,t})=>{clearInterval(window.__evict.iv);const ev=window.__STORYWORLD_PHASE1__.controller.bridge.events;
   const hits=ev.since(0).filter(e=>e.hero==='hwando'&&e.type==='confirmed-hit'&&e.kind==='attack'&&e.at>=t&&e.damage>0).length;
   return {target:id,hits,seen:window.__evict.seen,src:window.__evict.src,hurtSamples:window.__evict.hurt,skillSamples:window.__evict.skill};},{id:placed,t:t0});
  trials.push(r);
 }
 const hitTrials=trials.filter(t=>t.hits>0),seen=hitTrials.filter(t=>t.seen&&t.src===ART);
 const row={profile:sc.label,afterTravel,trials,cachedAtEnd:await p.evaluate(a=>!!readyImage(a)?.image,ART),errors};
 report.push(row);
 // 고치기 전에는 지역 이동 뒤 0/N(그림 자체가 없음). 자연 타이밍 겹침(자동 공격·스킬)으로 한 번쯤 빠질 수 있어 2/3 이상을 요구하고,
 // 소환 그림이 실제로 다시 준비됐는지도 함께 본다.
 if(hitTrials.length<2||seen.length<2||!row.cachedAtEnd||errors.length){failed++;row.fail=`echo ${seen.length}/${hitTrials.length} real A hits`;}
 await ctx.close();
}}finally{await b.close();}
console.log(JSON.stringify({url:URL,mode:'headless software GL; not physical device',passed:!failed,report},null,1));
process.exit(failed?1:0);
