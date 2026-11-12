// R911 투사체 전수 측정(헤드리스). 영웅이 공격·스킬을 쓰고 몹·보스가 쏘게 둔 채, 그려지는 투사체마다
//  R911 measure()(맨 바깥 확대를 뺀 실제 그림 몸통)로 화면 크기를 재고, 처음 보는 종류는 확대 전/후를 잘라 찍는다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r911/census.mjs <영웅> <지역,지역…> [초=8] [--inject]
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const MOD=fs.readFileSync(path.join(HERE,'../../client-source/projectile-size-r911.js'),'utf8');
const [hero='gunner',zl='dist00',secs='8']=process.argv.slice(2).filter(a=>!a.startsWith('--'));const inject=process.argv.includes('--inject');
const zones=zl.split(',');const OUT=path.join(HERE,'census');fs.mkdirSync(path.join(OUT,'shots'),{recursive:true});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(600);await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.addScriptTag({content:HELPER});if(inject||!(await p.evaluate(()=>!!window.__STORYWORLD_PROJ_SIZE_R911__)))await p.addScriptTag({content:MOD});
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
await p.evaluate(()=>{const R=window.__STORYWORLD_PROJ_SIZE_R911__;R.ensure();const seen={};window.__c911={seen,fresh:[]};
 const label=b=>{const marks=Object.keys(b).filter(k=>/^(r\d|R\d|e\d)|Weapon|Kind|kind|style|skill|storyWER|sourceSlot|sourceHero|bossSkill|thread|throw/i.test(k)&&!/^(e568|currentPublic|storyWorldKey|sourceProjectile|attackId|impactPoint|castOrigin|quality)/.test(k)).sort().slice(0,6).join('+');
  const asset=b.asset?String(b.asset).split('/').pop():(b.r118Weapon?.path?String(b.r118Weapon.path).split('/').pop():'-');
  if(b.friendly)return {side:'hero',who:player.hero,asset,marks,key:'hero|'+player.hero+'|'+asset+'|'+marks};
  const e=room.enemies.find(e=>e.id===b.owner);const who=e?(e.boss?'보스:':'')+(e.name||e.id):String(b.owner||'?');
  return {side:e?.boss?'boss':'mob',who,asset,marks,key:(e?.boss?'boss|':'mob|')+who+'|'+asset+'|'+marks};};
 const outer=drawProjectile;drawProjectile=function(b,...a){if(window.__c911.gallery||ctx?.__r911probe||window.__c911.busy)return outer.call(this,b,...a);window.__c911.busy=1;try{return hook(b,a);}finally{window.__c911.busy=0;}};const hook=(b,a)=>{try{if(b&&typeof b==='object'&&!b.__c911){const L=label(b);b.__c911=L.key;let s=seen[L.key];if(!s){s=seen[L.key]={...L,zone,n:0,sizes:[],hero:R.heroPx()};window.__c911.fresh.push(b);}if(!s.clone){s.clone=1;window.__c911.clones=window.__c911.clones||[];window.__c911.clones.push({key:L.key,b:{...b,hit:new Set()}});}s.n++;}if(b?.__c911&&seen[b.__c911].sizes.length<6&&(b.age||0)>.04){const m=R.measure(b);if(m)seen[b.__c911].sizes.push(+m.size.toFixed(1));}}catch(e){}return outer.call(this,b,...a);};outer.__c911=true;});
let shotN=0;
async function crops(){const fr=await p.evaluate(()=>{window.__SLOW=1e-4;const f=window.__c911.fresh.splice(0).filter(b=>!b.dead&&projectiles.includes(b));const r=document.getElementById('game').getBoundingClientRect();return f.slice(0,3).map(b=>{const q=project(b.x,b.y);return{key:b.__c911,x:q.x+r.left,y:q.y+r.top-18*zoom,top:r.top,bottom:r.top+r.height,w:r.width};});});
 for(const f of fr){const S=170;const clip={x:Math.round(f.x-S/2),y:Math.round(f.y-S/2),width:S,height:S};if(clip.x<0||clip.y<f.top||clip.x+S>f.w||clip.y+S>f.bottom)continue;const n=++shotN;const tag=`${hero}-${String(n).padStart(3,'0')}`;
  await p.evaluate(()=>{window.__STORYWORLD_PROJ_SIZE_R911__.setEnabled(false);draw();});await p.screenshot({path:path.join(OUT,'shots',tag+'-a.png'),clip});
  await p.evaluate(()=>{window.__STORYWORLD_PROJ_SIZE_R911__.setEnabled(true);draw();draw();});await p.screenshot({path:path.join(OUT,'shots',tag+'-b.png'),clip});
  await p.evaluate(([k,t])=>{const s=window.__c911.seen[k];if(!s.shot)s.shot=t;},[f.key,tag]);}
 await p.evaluate(()=>{window.__SLOW=1;});}
const KEYS=['a','a','s','a','d','a','f','q','a','w','e','r'];
for(const z of zones){try{await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip();}catch(e){console.log('zone fail',z,String(e).slice(0,120));continue;}
 const n=Math.round(+secs/0.4);for(let i=0;i<n;i++){await p.evaluate(boss=>{player.hp=maxHP();const live=room.enemies.filter(e=>e.hp>0&&e.visible!==false);const bs=live.find(e=>e.boss);if(bs&&boss){room.engaged=true;const q=__HQ795.placeNear(bs,4)||__HQ795.placeNear(bs,5.5);if(q){__HQ795.tp(q);target=bs.id;}}else __HQ795.engage(false);},i%3===0);
  const k=KEYS[i%KEYS.length];await p.keyboard.down(k);await p.evaluate(()=>__HQ795.step(.4,4));await p.keyboard.up(k);await skip();await crops();}}
const res=await p.evaluate(()=>({seen:window.__c911.seen,stats:window.__STORYWORLD_PROJ_SIZE_R911__.stats,errors:window.__STORYWORLD_PROJ_SIZE_R911__.errors(),zoom}));console.log(JSON.stringify(res.errors,null,1));
fs.writeFileSync(path.join(OUT,`census-${hero}-${zones[0]}.json`),JSON.stringify(res,null,1));
for(const s of Object.values(res.seen)){const mx=s.sizes.length?Math.max(...s.sizes):null;console.log(`${s.side}\t${s.who}\t${s.asset}\t${s.marks}\tn=${s.n}\tsize=${mx}\thalf=${(s.hero/2).toFixed(1)}\t${mx==null?'?':mx>=s.hero/2-.5?'OK':'SMALL'}\t${s.shot||''}`);}
await b.close();
