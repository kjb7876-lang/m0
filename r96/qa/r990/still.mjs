// 전후 장면: ① R61 잔상 던지기(echo) 준비·비행 ② (후) 안개 패턴·안개 핵 소환
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];const AFTER=process.argv[3]==='after';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{init:{'storyworld.r790.npc':'{"on":false}'}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const wait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:300000,polling:100}).catch(()=>{});};
await go(p,'last303');
await p.evaluate(()=>{const B=room.enemies.find(e=>e.boss&&!e.midboss);window.__B=B;B.spawnState='active';room.engaged=true;player.hp=player.maxHp=1e9;player.invincible=1e9;
 for(const e of room.enemies)if(e!==B&&Math.hypot(e.x-B.x,e.y-B.y)<14){e.hp=0;e.deadRecorded=true;e.spawnState='dead';}room.enemies=room.enemies.filter(e=>e===B||e.hp>0);
 player.x=B.x+2.6;player.y=B.y+.4;B.speed=0;window.__STORYWORLD_BMG_FOG_R990__?.set?.({summon:false});});
const clip=async(n)=>{await p.screenshot({path:`${OUT}/${n}.png`,clip:{x:290,y:110,width:700,height:440}});};
// ① echo
let ok=false;for(let i=0;i<40&&!ok;i++){ok=await p.evaluate(()=>{const F=window.__STORYWORLD_FIELDS_R61__;if(__B.attack||F.activeAction(__B))return false;return !!F.prepare(__B,'echo');});if(!ok)await wait(.3);}
await wait(.85);await clip('echo-windup');await wait(.5);await clip('echo-flight');
const echo=await p.evaluate(()=>({action:__B.r61Action?.path||null,shots:projectiles.filter(q=>q.r61Shot).map(q=>q.r61Shot.path)}));
let fog=null;
if(AFTER){await wait(1.5);
 await p.evaluate(()=>{window.__STORYWORLD_BMG_FOG_R990__.set({summon:true});});
 // 안개 웅덩이(엔진 패턴 그대로) — beat 를 웅덩이 칸으로
 await p.evaluate(()=>{__B.beat=1;__B.storyPreparedCast150=null;window.__STORYWORLD_CAST5__.prepare(__B,'ranged');});await wait(.9);await clip('fog-pool-warning');await wait(.9);await clip('fog-pool-burst');
 await p.evaluate(()=>{__B.beat=7;__B.storyPreparedCast150=null;window.__STORYWORLD_CAST5__.prepare(__B,'ranged');});await wait(1.0);await clip('fog-spray');
 await wait(4);await clip('summon-gate');await wait(.9);await clip('summon-emerge');await wait(1.2);await clip('summon-after');
 fog=await p.evaluate(()=>window.__STORYWORLD_BMG_FOG_R990__.inspect());}
fs.writeFileSync(`${OUT}/still.json`,JSON.stringify({echo,fog,errs},null,1));console.log(JSON.stringify({echo,errs,fogStats:fog?.stats}));await b.close();
