// R474 브라우저 검사(헤드리스): 늪(dist02)에서 군주를 깨우고 영웅을 6칸 앞에 세움 → 손이 발밑에서 솟고, 가만히 있으면 속박, 비키면 회피. SHOT=경로면 손이 다 솟은 순간을 찍는다.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF,shot=process.env.SHOT||'';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:off?{'storyworld.r474.hands':'{"on":false}'}:null});
await go(p,'dist02');
await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='mb-dist02');e.spawnState='active';e.speed=0;e.moveSpeed=0;e.damage=0;window.__bz=e;
 player.x=e.x+4.2;player.y=e.y+3.2;player.hp=99999;for(const x of room.enemies)if(x!==e){x.hp=0;x.dead=true;}
 window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
const I=()=>p.evaluate(()=>window.__STORYWORLD_SWAMP_HANDS_R474__.inspect());
if(off){await p.waitForTimeout(20000);const i=await I();ok('off → no hands',i.stats.rises===0);}
else{
 await p.waitForFunction(()=>window.__STORYWORLD_SWAMP_HANDS_R474__.inspect().stats.rises>=1,null,{timeout:120000}).catch(()=>{});
 let i=await I();ok('hands rise under the hero',i.stats.rises>=1&&i.active&&Math.hypot(i.active.x-(await p.evaluate(()=>player.x)),0)<1.5);
 if(shot){await p.waitForFunction(()=>{const a=window.__STORYWORLD_SWAMP_HANDS_R474__.inspect().active;return a&&time-a.t0>.9;},null,{timeout:60000}).catch(()=>{});await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(600);await p.screenshot({path:shot});await p.evaluate(()=>{window.__SLOW=1;});}
 await p.waitForFunction(()=>window.__STORYWORLD_SWAMP_HANDS_R474__.inspect().stats.binds+window.__STORYWORLD_SWAMP_HANDS_R474__.inspect().stats.dodged>=1,null,{timeout:60000}).catch(()=>{});
 i=await I();const st=await p.evaluate(()=>window.__STORYWORLD_FIELDS_R61__.statusRows().map(s=>s.key));
 ok('standing still → bind (R61 status '+JSON.stringify(st)+')',i.stats.binds===1&&st.includes('bind'));
 await p.waitForFunction(()=>window.__STORYWORLD_SWAMP_HANDS_R474__.inspect().stats.rises>=2,null,{timeout:200000}).catch(()=>{});
 await p.evaluate(()=>{player.x+=1.8;});
 await p.waitForFunction(()=>{const s=window.__STORYWORLD_SWAMP_HANDS_R474__.inspect().stats;return s.binds+s.dodged>=2;},null,{timeout:60000}).catch(()=>{});
 i=await I();ok('stepping away → dodged',i.stats.dodged===1);ok('drawn on screen',i.stats.draws>0);ok('no errors',i.stats.errors===0);console.log(JSON.stringify(i.stats));}
await b.close();process.exit(fail?1:0);
