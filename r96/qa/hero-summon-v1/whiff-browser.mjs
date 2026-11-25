// 사용자 2026-11-25 "헛칠때 공격이펙트 안나가게": 3D 조작 환도가 빈 곳에서 실제 A 키로 헛치면 짧은 공격 이펙트가
// 하나도 남지 않고(어깨 빛 번쩍임 포함), 적을 맞히면 이펙트가 그대로 나와야 한다. 헤드리스 — 그래픽·실기기 아님.
// usage: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/hero-summon-v1/whiff-browser.mjs
import {chromium,skip,go} from '../r444/lib.mjs';
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
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
 await p.evaluate(()=>{window.__STORYWORLD_AUTO_A_R597__?.set?.(false);settings.autoSkill=false;for(const e of room.enemies)if(e.hp>0){e.maxHp=e.hp=1e7;e.speed=0;e.cd=1e9;e.attack=null;}});
 await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().ready===true,null,{timeout:120000});
 const trials=[];
 for(const mode of ['miss','hit','miss','hit']){
  await p.waitForFunction(()=>!(player.attackCD>0||player.skillAnim>0||player.attackAnim>0),null,{timeout:60000});
  const ok=await p.evaluate(mode=>{const es=room.enemies.filter(e=>e.hp>0);let best=null;
   if(mode==='miss'){for(let k=0;k<2000&&!best;k++){const x=player.x+(Math.random()-.5)*36,y=player.y+(Math.random()-.5)*36;if(blocked(x,y,.3))continue;if(Math.min(...es.map(e=>Math.hypot(e.x-x,e.y-y)))>7)best={x,y};}target=null;}
   else for(const e of es){for(const [dx,dy] of [[1.4,0],[-1.4,0],[0,1.4],[0,-1.4]]){const o={x:e.x+dx,y:e.y+dy};if(!blocked(o.x,o.y,.3)&&clearLine(o,e)){best=o;target=e;break;}}if(best)break;}
   if(!best)return false;player.x=best.x;player.y=best.y;player.moving=false;const H=window.__STORYWORLD_HWANDO3D_R1302__;
   const W=window.__wf={t:time,w0:H.inspect().whiffs,base:new Set(effects),transient:0,flame:0,combo:player.combo};
   W.iv=setInterval(()=>{const nw=effects.filter(e=>!W.base.has(e)&&Number(e?.life)<1e6);W.transient=Math.max(W.transient,nw.length);if(H.inspect().spirit?.flame)W.flame++;if(player.attackAnim>0||player.attackCD>0)W.anim=true;},10);return true;},mode);
  if(!ok){trials.push({mode,skipped:true});continue;}
  await p.keyboard.press('KeyA');
  await p.waitForFunction(()=>time-window.__wf.t>.7,null,{timeout:60000});
  trials.push({mode,...await p.evaluate(()=>{const W=window.__wf;clearInterval(W.iv);return {swung:player.combo!==W.combo||!!W.anim,whiffs:window.__STORYWORLD_HWANDO3D_R1302__.inspect().whiffs-W.w0,transientFx:W.transient,flame:W.flame};})});
 }
 const miss=trials.filter(t=>t.mode==='miss'&&!t.skipped),hit=trials.filter(t=>t.mode==='hit'&&!t.skipped);
 const pass=miss.length===2&&hit.length===2&&miss.every(t=>t.swung&&t.whiffs===1&&t.transientFx===0&&t.flame===0)&&hit.every(t=>t.whiffs===0&&t.transientFx>0)&&!errors.length;
 const row={profile:sc.label,trials,errors};if(!pass){failed++;row.fail=true;}report.push(row);await ctx.close();
}}finally{await b.close();}
console.log(JSON.stringify({url:URL,mode:'headless software GL; not physical device',passed:!failed,report},null,1));process.exit(failed?1:0);
