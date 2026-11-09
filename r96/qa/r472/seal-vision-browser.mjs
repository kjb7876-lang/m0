// R472 브라우저 검사(헤드리스): 회장 방(ep1b08)에서 보스를 깨워 체력 25%로 → R205 광폭화 → 시야 봉인 DOM 이 영웅 둘레만 남기고 덮는지, 보스가 쓰러지면 걷히는지.
// SHOT=경로 이면 봉인 중 화면을 찍는다. SW_OFF=1 이면 끈 상태.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF,shot=process.env.SHOT||'';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:off?{'storyworld.r472.seal':'{"on":false}'}:null});
await go(p,'ep1b08');
const info=await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='b08-boss');if(!e)return null;e.spawnState='active';player.x=e.x+3;player.y=e.y+2.5;player.hp=player.maxHp=99999;window.__r472boss=e;e.hp=Math.floor(e.maxHp*.25);return{name:e.name,x:e.x,y:e.y};});
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
ok('chairman boss present in ep1b08 '+JSON.stringify(info),!!info);
await p.waitForFunction(()=>!!window.__r472boss.r205Enraged,null,{timeout:120000}).catch(()=>{});
ok('R205 enraged',await p.evaluate(()=>!!window.__r472boss.r205Enraged));
if(!off){await p.waitForFunction(()=>window.__STORYWORLD_SEAL_VISION_R472__.inspect().phase==='hold',null,{timeout:120000}).catch(()=>{});}
else await p.waitForTimeout(4000);
const s=await p.evaluate(()=>{const i=window.__STORYWORLD_SEAL_VISION_R472__.inspect(),el=document.getElementById('r472Seal'),cs=el&&getComputedStyle(el);return{phase:i.phase,alpha:i.alpha,stats:i.stats,bg:cs?cs.backgroundImage.slice(0,160):null,z:cs?.zIndex,pe:cs?.pointerEvents};});
console.log(JSON.stringify(s));
if(shot){await p.evaluate(()=>{player.hp=player.maxHp;});await p.screenshot({path:shot});}
if(off)ok('off → no seal',s.stats.seals===0&&!(s.alpha>0));
else{ok('sealing at hold, dark ≥ .85',s.phase==='hold'&&s.alpha>=.85);ok('overlay is a radial gradient, no pointer capture',/radial-gradient/.test(s.bg||'')&&s.pe==='none');
 await p.evaluate(()=>{const e=window.__r472boss;e.hp=0;});await p.waitForFunction(()=>window.__STORYWORLD_SEAL_VISION_R472__.inspect().alpha===0,null,{timeout:60000}).catch(()=>{});
 ok('boss down → lifted',await p.evaluate(()=>window.__STORYWORLD_SEAL_VISION_R472__.inspect().alpha===0));}
ok('no R472 errors',s.stats.errors===0);
await b.close();process.exit(fail?1:0);
