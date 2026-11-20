// R1262 실패 테스트: 보스가 조형물 던지기 차례에 방의 보물상자(R103·R712)·미카엘라를 집어 던지면 안 되고, 던지기 뒤에도 보물상자는 보여야 한다.
//  방 꾸밈 조형물이 아직 안 실린 상태에서 보스 바로 곁에 보물상자를 두고(가장 가까운 조형물) 조형물 던지기를 여러 번 시킨다. node throw-reward.mjs 지역:id [횟수]
import {chromium,boot,go} from '../r444/lib.mjs';
const [z,id]=process.argv[2].split(':');const N=+(process.argv[3]||3);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}'}});await go(p,z);
const setup=await p.evaluate(id=>{const e=room.enemies.find(x=>x.nativeId===id);if(!e)return 'no boss';room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
 for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.x=player.x+3;e.y=player.y-1.5;e.speed=0;
 let c=room.props.find(q=>q.growthR103==='chest');if(!c){c={id:'r1262-test-chest',x:0,y:0,solid:false,visible:true,path:'assets/r712/chest-closed.png',height:54,label:'보물상자',growthR103:'chest'};room.props.push(c);}
 c.x=e.x+.3;c.y=e.y+.3;
 // 방 꾸밈 조형물(R59 scenery59) 그림이 아직 안 실린 순간(느린 기기·입장 직후)을 만든다 — 그때 R61 은 room.props(보물상자 포함)에서 고른다.
 if(room.exploration?.scenery59)room.exploration.scenery59.props=[];window.__C={e,c,list:[],seen:new WeakSet()};
 setInterval(()=>{const T=window.__C;if(typeof projectiles==='undefined')return;for(const q of projectiles){if(!q||T.seen.has(q))continue;T.seen.add(q);const i=q.r114Throw;if(i)T.list.push({kind:i.kind,path:String(i.path||i.prop?.path||''),r471:i.r471||null});}},20);
 return 'ok';},id);
if(setup!=='ok'){console.log('FAIL',setup);process.exit(1);}
const R61=()=>p.evaluate(()=>{const F=window.__STORYWORLD_FIELDS_R61__;const e=window.__C.e;e.r61BusyUntil=0;e.attack=null;try{return !!F?.prepare?.(e,'prop');}catch(err){return String(err).slice(0,80);}});
let started=0;
for(let i=0;i<N;i++){const ok=await R61();if(ok===true)started++;const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+2.2,t0,{timeout:240000}).catch(()=>{});}
const r=await p.evaluate(()=>({list:window.__C.list,chestVisible:window.__C.c.visible!==false,chestHidden:!!window.__C.c.r114Hidden,api:Object.keys(window.__STORYWORLD_FIELDS_R61__||{}).join(',')}));
const bad=r.list.filter(x=>/r712\/chest|r103\/|michaela\/s\.webp/.test(x.path));
const checks=[['조형물 던지기가 일어남(시작 '+started+'/'+N+')',r.list.length>0],['보물상자·미카엘라를 던지지 않음('+bad.length+'/'+r.list.length+')',bad.length===0],['던진 뒤 보물상자가 보임',r.chestVisible&&!r.chestHidden]];
let fail=0;for(const [n,v] of checks){console.log((v?'PASS ':'FAIL ')+n);if(!v)fail++;}console.log(id,JSON.stringify(r.list.map(x=>x.path.split('/').slice(-2).join('/')+(x.r471?'('+x.r471+')':''))),'R61 API',r.api.slice(0,200));
await b.close();process.exit(fail?1:0);
