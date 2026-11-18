// R1173 헤드리스 실측: 페르소나 형상으로 옆·위·아래 걷기 → 칸 넘김 박자(게임 시간 기준)·실제 이동 속도·쓰인 시트, 옆 걷기 장면 찍기
import {chromium,boot} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].unlock('silent');window[A].setForm(true);},A);
await p.evaluate(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;window.__log=[];T.render=function(f){const R=O.apply(this,arguments);try{const h=f.commands.find(c=>c&&c.r1113&&c.owner?.kind==='hero'&&/persona-walk|persona-idle/.test(String(c.sourcePath)));if(h)window.__log.push([time,String(h.sourcePath).replace(/^.*assets\//,''),player.x,player.y]);}catch(_){}return R;};});
await p.waitForTimeout(1500);
const out={};
for(const [name,key] of [['down','ArrowDown'],['up','ArrowUp'],['right','ArrowRight'],['left','ArrowLeft']]){
 await p.evaluate(()=>{window.__log=[];});const t0=await p.evaluate(()=>time);
 await p.keyboard.down(key);await p.waitForFunction(t0=>time>t0+3,t0,{timeout:120000,polling:200});
 if(name==='right'){await p.evaluate(()=>{window.__shotT=time;});await p.screenshot({path:OUT+'/walk-right.png'});}
 await p.keyboard.up(key);await p.waitForTimeout(400);
 const L=await p.evaluate(()=>window.__log);let ch=0,prev=null,ta=null,tb=null,d=0,pp=null;const sheets=new Set();
 for(const [t,k,x,y] of L){if(/persona-walk/.test(k)){sheets.add(k.replace(/:\d.*$/,''));if(ta==null)ta=t;tb=t;const f=+(/:(\d)/.exec(k)||[])[1];if(prev!=null&&f!==prev)ch+=(f-prev+8)%8;prev=f;if(pp)d+=Math.hypot(x-pp[0],y-pp[1]);pp=[x,y];}else{prev=null;pp=null;}}
 const sec=(tb-ta)||1e-9;out[name]={gameSec:+sec.toFixed(2),frames:ch,fps:+(ch/sec).toFixed(2),cycleSec:+(8*sec/ch).toFixed(2),speed:+(d/sec).toFixed(2),perUnit:+(ch/(d||1e-9)).toFixed(2),sheets:[...sheets]};}
out.inspect=await p.evaluate(A=>{const i=window[A].inspect();return {walkRate:window[A].walkRate,stats:i.stats,lastError:i.lastError};},A);
console.log(JSON.stringify(out,null,1));await b.close();
