// R1224 보스 몹 소환 전수: 보스마다 R61 소환을 걸고 전투를 돌려 새로 생긴 적의 이름·그린 그림을, 그 지역 일반 몹(지금 그림)과 비교한다.
// 사용: node summon-census.mjs <출력폴더> [지역,…]
import {chromium,boot,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const out=process.argv[2]||'sum';fs.mkdirSync(out,{recursive:true});
const only=process.argv[3]?process.argv[3].split(','):null;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}'}});
const zones=only||await p.evaluate(()=>Object.values(regions).map(r=>r.id).filter(id=>!/^sz(115|162|173)/.test(id)&&id!=='ep1b06'));
const res=fs.existsSync(out+'/summon.json')?JSON.parse(fs.readFileSync(out+'/summon.json')):{};
const FN=()=>{if(window.__fnDone)return;window.__fnDone=1;const AM=window.__AM=new WeakMap();
 const FX=/r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|blood|flame|r572|r571|dissol|burn|smoke|\bash\b|ink-bleed|r106fx/i;
 const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,st0=Array.isArray(c?.commands)?c.commands.length:-1;const r=de.call(this,e,...a);
  if(st0>=0&&e)AM.set(e,c.commands.slice(st0).filter(k=>k?.kind==='image'&&Array.isArray(k.points)&&k.points.length>=4));return r;};
 window.__drawOf=e=>{const R=AM.get(e);if(!R)return null;let best=null,ba=0;for(const k of R){const s=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(FX.test(s))continue;const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1]));if(ar>ba){ba=ar;best=s;}}return best;};
 window.__unit=e=>({id:e.id,nid:e.nativeId||'',name:e.name||'',pid:e.profile?.id||'',path:e.path||'',art:window.__drawOf(e),r61:e.r61Summoned?.kind||null,boss:!!(e.boss||e.midboss)});};
for(const z of zones){if(res[z]&&!only)continue;
 try{await go(p,z);}catch(err){res[z]={err:String(err).slice(0,100)};continue;}
 await p.waitForTimeout(400);await p.evaluate(FN);
 const base=await p.evaluate(()=>{window.__base=new Set(room.enemies);for(const e of room.enemies)if(!(e.boss||e.midboss)){e.__ox=e.x;e.__oy=e.y;}
   return {bosses:room.enemies.filter(e=>e.boss||e.midboss).map(e=>({id:e.nativeId,name:e.name}))};});
 const nm=await p.evaluate(()=>room.enemies.filter(e=>!(e.boss||e.midboss)).length);const mobs=[];
 for(let i0=0;i0<nm;i0+=8){await p.evaluate(i0=>{const L=room.enemies.filter(e=>!(e.boss||e.midboss));L.forEach((e,i)=>{if(i>=i0&&i<i0+8){e.__sv=[e.x,e.y,e.speed,e.hidden];e.x=player.x-3+(i-i0)%4*2;e.y=player.y-1.5+Math.floor((i-i0)/4)*3;e.speed=0;e.hidden=false;e.spawnState=e.spawnState==='dead'?'dead':'active';}});},i0);
  const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.25,t0,{timeout:30000}).catch(()=>{});
  mobs.push(...await p.evaluate(i0=>{const L=room.enemies.filter(e=>!(e.boss||e.midboss));const o=[];L.forEach((e,i)=>{if(i>=i0&&i<i0+8){o.push(window.__unit(e));[e.x,e.y,e.speed,e.hidden]=e.__sv;}});return o;},i0));}
 base.mobs=mobs;
 if(!base.bosses.length){continue;}
 const zr={mobs:base.mobs,bosses:[]};
 for(const bo of base.bosses){
  await p.evaluate(id=>{const e=room.enemies.find(x=>(x.boss||x.midboss)&&x.nativeId===id&&x.hp>0);if(!e)return;window.__E=e;
   try{summon3([e],e.midboss&&!e.boss?'midboss':'boss');}catch(_){}room.engaged=true;e.spawnState='active';e.hidden=false;player.hp=9e8;player.maxHp=9e8;player.invincible=1e9;
   e.x=player.x+3;e.y=player.y;for(const o of room.enemies)if(o!==e&&!(o.boss||o.midboss)&&window.__base.has(o)){o.x=-999;o.y=-999;o.speed=0;}
   try{const S=window.__STORYWORLD_SUMMONS_R61__;S.state(e).nextAt=0;}catch(_){}},bo.id);
  const seen=new Map();
  for(let k=0;k<10;k++){const t0=await p.evaluate(()=>{try{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);}catch(_){}return time;});const ok=await p.waitForFunction(t=>time>t+1.5,t0,{timeout:20000}).then(()=>1).catch(()=>0);if(!ok&&k>2)break;
   const u=await p.evaluate(k=>{const e=window.__E;if(e&&e.hp>0){e.hp=e.maxHp*(k<5?.75:.3);try{const S=window.__STORYWORLD_SUMMONS_R61__;if(S.state(e).nextAt>time+2)S.state(e).nextAt=time;S.request(e);}catch(_){}}
     room.enemies.filter(x=>!window.__base.has(x)&&x.hp>0).forEach((x,i)=>{x.hidden=false;});return room.enemies.filter(x=>!window.__base.has(x)&&x.hp>0).map(x=>window.__unit(x));},k);
   for(const x of u)if(!seen.has(x.id)||!seen.get(x.id).art)seen.set(x.id,x);
  }
  zr.bosses.push({...bo,summons:[...seen.values()]});
  await p.evaluate(()=>{for(const x of room.enemies)if(!window.__base.has(x)){x.hp=0;x.spawnState='dead';x.deadRecorded=true;}room.enemies=room.enemies.filter(x=>window.__base.has(x));const e=window.__E;if(e){e.x=-999;e.y=-999;e.speed=0;}});
 }
 res[z]=zr;fs.writeFileSync(out+'/summon.json',JSON.stringify(res));
 console.log(z,zr.bosses.map(x=>x.id+':'+x.summons.length).join(' '));
}
await b.close();
