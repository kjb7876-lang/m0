// R1042 브라우저 검사(헤드리스): 색욕(ep1b05) 보스 서윤을 깨우고 영웅을 4칸 앞에 세움 → 키스 예고가 영웅 자리에 뜨고,
// 가만히 있으면 현재 체력의 66% 피해(34% 남음), 비키면 회피. SHOT=경로면 예고 중간을 찍는다. (게임 시간 기준으로 기다림)
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,'ep1b05');
await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='b05-boss');e.spawnState='active';e.speed=0;e.moveSpeed=0;e.damage=0;window.__bz=e;
 player.x=e.x+3;player.y=e.y+2.5;player.hp=1000;for(const x of room.enemies)if(x!==e){x.hp=0;x.dead=true;}});
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
const I=()=>p.evaluate(()=>window.__STORYWORLD_KISS_LIPS_R1042__.inspect());
await p.waitForFunction(()=>window.__STORYWORLD_KISS_LIPS_R1042__.inspect().stats.casts>=1,null,{timeout:240000}).catch(()=>{});
let i=await I();const pp=await p.evaluate(()=>({x:player.x,y:player.y}));
ok('kiss cast at the hero spot',i.stats.casts>=1&&i.active&&Math.hypot(i.active.x-pp.x,i.active.y-pp.y)<.6);
const freeze=async(at,path)=>{await p.waitForFunction(at=>{const a=window.__STORYWORLD_KISS_LIPS_R1042__.inspect().active;return a&&time-a.t0>at;},at,{timeout:60000}).catch(()=>{});
 await p.evaluate(()=>{const tb=tick;window.__tb=tb;tick=function(dt,...a){return tb.call(this,dt*1e-4,...a);};});await p.waitForTimeout(800);await p.screenshot({path});await p.evaluate(()=>{tick=window.__tb;});};
if(shot){await freeze(.3,shot+'-a.png');await freeze(.95,shot+'-b.png');}
await p.waitForFunction(()=>{const s=window.__STORYWORLD_KISS_LIPS_R1042__.inspect().stats;return s.hits+s.dodged+s.blocked>=1;},null,{timeout:120000}).catch(()=>{});
i=await I();const L=i.stats.last;
ok('standing still → hit: HP after = 34% of HP before ('+JSON.stringify(L)+')',i.stats.hits===1&&L&&Math.abs(L.after-L.before*.34)<1e-6);
ok('drew frame sheets',i.stats.draws>0&&i.stats.errors===0);
await p.waitForFunction(()=>window.__STORYWORLD_KISS_LIPS_R1042__.inspect().stats.casts>=2,null,{timeout:300000}).catch(()=>{});
await p.evaluate(()=>{player.x+=2.4;});
await p.waitForFunction(()=>{const s=window.__STORYWORLD_KISS_LIPS_R1042__.inspect().stats;return s.hits+s.dodged+s.blocked>=2;},null,{timeout:120000}).catch(()=>{});
i=await I();ok('stepping away → dodged',i.stats.dodged===1&&i.stats.hits===1);
console.log('stats',JSON.stringify(i.stats));await b.close();process.exit(fail?1:0);
