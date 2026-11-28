// R1377 지역마다 실제 플레이(webdriver 숨김)에서 3D 로 그려지는 몹 nativeId 를 모은다(MOB3D_R* inspect().instances).
// 사용: VP=640x360 node r96/qa/r1377/probe3d.mjs <out.jsonl> zone ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2],ZONES=process.argv.slice(3);
const NOVID={'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'};
const b=await chromium.launch();const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);c.setDefaultNavigationTimeout(240000);await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};
const {p}=await boot(b,{vp:{width:640,height:360},init:NOVID});
for(const z of ZONES){try{
 if(/^sz\d/.test(z)){await p.evaluate(async id=>{await window.__STORYWORLD_SAMONG_R103__.goZone(id);},z);await p.waitForFunction(()=>!loading,null,{timeout:150000});}else await go(p,z);await skip(p);
 await p.evaluate(()=>{const seen=new Map();for(const e of room.enemies){const id=String(e.nativeId||e.name);if(!seen.has(id))seen.set(id,e);}const R=[...seen.values()];player.invincible=1e9;
  R.forEach((e,i)=>{const a=i/R.length*6.283;e.spawnState='active';e.hidden=false;e.engaged=true;e.hp=e.maxHp=1e8;e.x=player.x+Math.cos(a)*2.6;e.y=player.y+Math.sin(a)*2.6;});window.__P3=R;});
 const ids=new Map();
 for(let k=0;k<10;k++){await p.waitForTimeout(2500);await skip(p);
  const r=await p.evaluate(()=>{const s=[];for(const k of Object.keys(window).filter(k=>/^__STORYWORLD_MOB3D_R\d+__$/.test(k))){try{for(const i of (window[k].inspect().instances||[]))if(i.visible!==false)s.push(String(i.id));}catch(_){}}
   const by=new Map(window.__P3.map(e=>[e.id,String(e.nativeId||e.name)]));return {s:[...new Set(s)].map(id=>by.get(id)).filter(Boolean),all:window.__P3.map(e=>String(e.nativeId||e.name))};});
  for(const id of r.s)ids.set(id,(ids.get(id)||0)+1);ids.__all=r.all;}
 fs.appendFileSync(OUT,JSON.stringify({zone:z,all:ids.__all,threeD:Object.fromEntries(ids)})+'\n');console.log(z,JSON.stringify(Object.fromEntries(ids)));
}catch(err){console.log('ERR',z,String(err).slice(0,200));}}
await b.close();
