// R1229 탐침: dist06 발록·소환진 검은기둥 전투 — 보스 몸 키(장면마다)·검은기둥 위치·투사체/위험지대/효과 그리기(그림 vs 도형) 집계
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'/tmp/claude-0/r1229';const SECS=+(process.argv[3]||25);const ZONE=process.argv[4]||'dist06';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,ZONE);
await p.evaluate(()=>{for(const e of room.enemies)if(!e.boss&&!e.midboss)e.hp=0;else{e.hp=e.maxHp=1e8;}
 const B=room.enemies.find(e=>e.boss&&/발록/.test(e.name))||room.enemies.find(e=>e.boss),M=room.enemies.find(e=>e.midboss)||B;player.x=B.x+4;player.y=B.y+2;room.engaged=true;
 for(const e of [B,M]){e.spawnState='active';e.visible=true;e.disabled=false;}window.__B=B;window.__M=M;
 setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},300);auto=true;});
const R=await p.evaluate(async(SECS)=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const F=[];const shape={},imgs={};const t0=time;
 three.render=function(f){try{const cs=f.commands||[];const body=id=>{let best=null,h=0;for(const c of cs){if(c.kind!=='image'||c.owner?.kind!=='enemy'||!String(c.owner?.id).endsWith(':'+id.split(':').pop())||!String(c.owner?.id).startsWith('enemy:')||!c.points)continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>h){h=hh;best=c;}}return best?{h:+h.toFixed(1),src:String(best.sourcePath||'').split('/').slice(-2).join('/'),sr:best.sourceRect}:null;};
  F.push({t:+(time-t0).toFixed(2),B:body(__B.id),M:body(__M.id),bAnim:[__B.anim,__B.state,__B.attackAnim,__B.r104Phase,__B.phase].join('|'),bScale:__B.scale??__B.size,Mxy:[+__M.x.toFixed(2),+__M.y.toFixed(2)],Mhp:__M.hp>0,bVis:__B.hp>0&&__B.spawnState==='active'&&__B.visible!==false,bOn:(()=>{const q=project(__B.x,__B.y);return q.x>0&&q.x<W&&q.y>0&&q.y<H;})()});
  for(const c of cs){const k=c.owner?.kind;if(!['projectile','hazard','effect','enemyProjectile','bullet'].includes(k))continue;const id=String(c.owner?.id||'').replace(/[:#-]?\d+(\.\d+)?$/,'').replace(/\d{3,}/g,'#');const key=k+'|'+id;
   if(c.kind==='image'){const s=String(c.sourcePath||'').split('/').slice(-2).join('/');imgs[key+'|'+s]=(imgs[key+'|'+s]||0)+1;}else if(c.kind!=='text'){shape[key+'|'+c.kind]=(shape[key+'|'+c.kind]||0)+1;}}}catch(e){F.push(String(e));}return base.apply(this,arguments);};
 await new Promise(r=>{const g=()=>{if(time-t0>SECS)return r();setTimeout(g,200);};g();});three.render=base;
 return {F,shape,imgs,kinds:[...new Set(F.map(x=>x.bAnim))].slice(0,40)};},SECS);
fs.writeFileSync(out+'/census.json',JSON.stringify(R));
const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,40);
console.log('SHAPE',JSON.stringify(top(R.shape),null,0));console.log('IMG',JSON.stringify(top(R.imgs),null,0));
const hs=R.F.filter(x=>x.B).map(x=>x.B.h);console.log('B frames',R.F.length,'with body',hs.length,'h min/max',Math.min(...hs),Math.max(...hs));
const bySrc={};for(const x of R.F)if(x.B){(bySrc[x.B.src]??=[]).push(x.B.h);}for(const [s,a] of Object.entries(bySrc))console.log('  ',s,a.length,Math.min(...a),Math.max(...a));
const miss=R.F.filter(x=>x.bVis&&x.bOn&&!x.B).length,onF=R.F.filter(x=>x.bVis&&x.bOn).length;console.log('boss on-screen frames',onF,'body missing',miss);const ms=R.F.filter(x=>x.Mhp).map(x=>x.Mxy);console.log('M pos first/last',JSON.stringify(ms[0]),JSON.stringify(ms[ms.length-1]));
const mh={};for(const x of R.F)if(x.M){(mh[x.M.src]??=[]).push(x.M.h);}for(const [s,a] of Object.entries(mh))console.log('  M',s,a.length,Math.min(...a),Math.max(...a));
await p.screenshot({path:out+'/census.png'});await b.close();
