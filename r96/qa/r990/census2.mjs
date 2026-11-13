// A 검수 2: 프레임마다(draw 감싸기) 녹화 명령 전체에서 옛 불면귀 그림을 잡고, 보스 몸이 옛 그림인 순간의 시각·상태를 남긴다. + B·C 측정(소환·시전·프레임 비용).
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'out2';const DUR=+(process.argv[3]||60);fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{init:{'storyworld.r790.npc':'{"on":false}'}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const wait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:900000,polling:250}).catch(()=>{});};
await go(p,'last303');
await p.evaluate(()=>{
 const OLD=/bulmyeongwi_(idle|attack|rain|transition)|r760\/boss\/bulmyeongwi-(p[1-4]|rain|transition)|mb-last302-v31231-p[1-4]\.|bulmyeongwi_b\./i;
 const B=room.enemies.find(e=>e.boss&&!e.midboss);window.__B=B;
 // 순찰은 살려 두되 멀리(보스전엔 주민이 있어야 R61 이 주민을 고른다) — 영웅 근처 일반몹만 치운다
 B.spawnState='active';room.engaged=true;player.hp=player.maxHp=1e9;player.invincible=1e9;player.x=B.x+3;player.y=B.y+2;
 for(const e of room.enemies)if(e!==B&&Math.hypot(e.x-B.x,e.y-B.y)<9){e.hp=0;e.deadRecorded=true;e.spawnState='dead';}
 room.enemies=room.enemies.filter(e=>e===B||e.hp>0);
 const L=window.__L={old:{},oldT:[],body:{},frames:0,t0:time,drawMs:[],tickMs:[],live:[],summoned:[]};
 const scan=()=>{const cm=ctx?.commands;if(!Array.isArray(cm))return;L.frames++;for(const c of cm){if(c?.kind!=='image')continue;const s=String(c.sourcePath||c.image?.currentSrc||c.image?.src||'');
   if(OLD.test(s)){const k=(c.owner?.kind||'?')+':'+String(c.owner?.id||c.key||'').slice(0,48)+'|'+s.split('/').slice(-2).join('/');L.old[k]=(L.old[k]||0)+1;if(L.oldT.length<80)L.oldT.push([+(time-L.t0).toFixed(2),k]);}}};
 const dr=draw;draw=function(...a){const t=performance.now();const r=dr.apply(this,a);L.drawMs.push(performance.now()-t);return r;};
 const grab=(name,tag)=>{const f=globalThis[name]??eval(name);const w=function(x,...a){const cm=ctx?.commands,s0=Array.isArray(cm)?cm.length:-1;const r=f.call(this,x,...a);if(s0>=0){L.frames++;for(const c of cm.slice(s0)){if(c?.kind!=='image')continue;const s=String(c.sourcePath||c.image?.currentSrc||c.image?.src||'');if(OLD.test(s)){const k=tag+':'+String(x?.type||x?.r61Shot?.kind||x?.id||'').slice(0,30)+'|'+s.split('/').slice(-2).join('/');L.old[k]=(L.old[k]||0)+1;if(L.oldT.length<80)L.oldT.push([+(time-L.t0).toFixed(2),k]);}}}return r;};eval(name+'=w');};
 grab('drawEffect','effect');grab('drawProjectile','projectile');grab('drawHazard','hazard');
 const P2=CanvasRenderingContext2D.prototype,di=P2.drawImage;L.c2d={};P2.drawImage=function(im,...a){try{const s=String(im?.currentSrc||im?.src||'');if(OLD.test(s)){const st=(new Error().stack||'').split('\n').slice(2,5).map(x=>x.trim().slice(0,90)).join(' < ');L.c2d[st]=(L.c2d[st]||0)+1;}}catch(_){}return di.call(this,im,...a);};
 const te=tickEnemies;tickEnemies=function(...a){const t=performance.now();const r=te.apply(this,a);L.tickMs.push(performance.now()-t);return r;};
 const de=drawEnemy;drawEnemy=function(e,...a){if(e!==B&&!e.r61Clone)return de.call(this,e,...a);const s0=ctx.commands.length;try{return de.call(this,e,...a);}finally{
   const k=ctx.commands.slice(s0).filter(k=>k.kind==='image'&&k.owner?.kind==='enemy'&&!k.r760Ghost&&Array.isArray(k.points)).sort((a,b)=>Math.abs(b.points[3][1]-b.points[0][1])-Math.abs(a.points[3][1]-a.points[0][1]))[0];
   if(k){const src=String(k.sourcePath);const st=(e.r61Clone?'clone:':'')+(e.hitTimer>0?'hit':e.attack||e.state==='attack'?'atk':e.state)+'|'+src.split('/').slice(-2).join('/');L.body[st]=(L.body[st]||0)+1;
    if(OLD.test(src)&&L.oldT.length<80)L.oldT.push([+(time-L.t0).toFixed(2),'BODY '+st,JSON.stringify(window.__STORYWORLD_BULMYEONGWI_R760__?.inspect?.().last)]);}}};
 setInterval(()=>{L.live.push(room.enemies.filter(e=>e.hp>0&&e.spawnState==='active').length);L.summoned.push(room.enemies.filter(e=>e.r61Summoned&&e.hp>0).length);},1000);
});
await wait(1.5);await p.screenshot({path:`${OUT}/start.png`});
const steps=Math.ceil(DUR/3);
for(let i=0;i<steps;i++){
 await p.evaluate(()=>{const B=__B;if(B.hp>0)hitEnemy(B,Math.max(1,B.maxHp*.01),{kind:'hero'});for(const e of room.enemies)if(e.r61Summoned&&e.hp>0&&Math.random()<.35){e.hp=0;killEnemy(e);}});
 if(i===Math.floor(steps/2))await p.evaluate(()=>{__B.hp=__B.maxHp*.42;});
 if(i%4===2)await p.screenshot({path:`${OUT}/fight-${String(i).padStart(2,'0')}.png`});
 await wait(3);}
const res=await p.evaluate(()=>{const L=window.__L,avg=a=>a.length?+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):0,p95=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?+s[Math.floor(s.length*.95)].toFixed(2):0;};
 return {c2d:L.c2d,gameSec:+(time-L.t0).toFixed(1),frames:L.frames,old:L.old,oldT:L.oldT,body:L.body,drawMs:{avg:avg(L.drawMs),p95:p95(L.drawMs),n:L.drawMs.length},tickMs:{avg:avg(L.tickMs),p95:p95(L.tickMs)},
  liveMax:Math.max(...L.live),summonedMax:Math.max(...L.summoned),summonedSeries:L.summoned.join(','),r61:window.__STORYWORLD_SUMMONS_R61__?.inspect?.().metrics,r990:window.__STORYWORLD_BMG_FOG_R990__?.inspect?.(),
  casts:(window.__STORYWORLD_CAST5__?.inspect?.().casts||[]).filter(c=>/l303-boss/.test(c.owner)).map(c=>c.name),r760:window.__STORYWORLD_BULMYEONGWI_R760__?.inspect?.().stats};});
res.errs=errs;fs.writeFileSync(`${OUT}/census2.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res).slice(0,3000));await b.close();
