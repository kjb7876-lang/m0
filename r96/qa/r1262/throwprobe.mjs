// R1262 보스 던지기 물건 기록: 보스만 남기고 전투시켜(게임 시간 N초) 새 투사체의 R114 던지기 정보(무기/조형물·그림 경로·R471 정본 물건)를 모은다. node throwprobe.mjs 지역:id [초]
import {chromium,boot,go} from '../r444/lib.mjs';
const [z,id]=process.argv[2].split(':');const SEC=+(process.argv[3]||20);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}'}});await go(p,z);
await p.evaluate(id=>{const e=room.enemies.find(x=>x.nativeId===id);room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
 for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.x=player.x+3;e.y=player.y-1.5;window.__T={e,seen:new WeakSet(),list:[]};
 setInterval(()=>{const T=window.__T;if(typeof projectiles==='undefined')return;for(const q of projectiles){if(!q||T.seen.has(q))continue;T.seen.add(q);const i=q.r114Throw;const m=q.r61Shot;
  if(i||m)T.list.push({t:+time.toFixed(1),kind:i?.kind||m?.kind||null,prop:String(i?.prop?.path||i?.prop?.asset||i?.prop?.sprite||i?.path||m?.path||'').split('/').slice(-2).join('/'),r471:i?.r471||null,weapon:i?.weapon?.label||i?.weapon?.key||(i?.weapon?'yes':null),own:(i?.owner||m?.owner)?.nativeId||null});}},30);},id);
const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,SEC],{timeout:900000}).catch(()=>{});
const r=await p.evaluate(()=>({list:window.__T.list,r471:window.__STORYWORLD_CANON_THROW_R471__?.inspect?.()||null,r114:window.__STORYWORLD_COMBAT_R114__?.inspect?.()?.stats||null}));
const c={};for(const x of r.list){const k=[x.kind,x.prop,x.r471,x.weapon,x.own].join(' | ');c[k]=(c[k]||0)+1;}console.log('==',id,JSON.stringify(c),'r471',JSON.stringify(r.r471)?.slice(0,300));await b.close();
