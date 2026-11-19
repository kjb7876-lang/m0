// R1229 탐침: dist06 에서 헌터 이동 몸 그림, 몹 목록, 투사체·위험지대 그리기 명령(그림/도형) 집계
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'/tmp/r1229';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,'dist06');
const info=await p.evaluate(()=>(room.enemies||[]).map(e=>({n:e.name,id:e.id,boss:!!e.boss,mid:!!e.midboss,sp:e.speed,ai:e.ai,x:+e.x.toFixed(1),y:+e.y.toFixed(1),act:e.spawnState,tower:!!(e.r75Tower||e.r170Tower),art:e.art||e.asset||e.sprite})));
fs.writeFileSync(out+'/enemies.json',JSON.stringify(info,null,1));
await p.evaluate(async()=>{loading=true;try{await ensureImages(heroPaths('hunter'));}finally{loading=false;}player.hero='hunter';});
// 몸 그림 경로 기록: 영웅 이동 중
const rec=await p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const R=[];
 three.render=function(f){try{const c=(f.commands||[]).filter(c=>c.owner?.kind==='player'||c.owner?.kind==='hero'||String(c.owner?.id||'').startsWith('player'));R.push({t:time,m:player.moving??null,vx:+(player.vx||0).toFixed(2),ks:c.map(c=>c.kind+':'+String(c.image?.src||c.path||c.key||'').split('/').slice(-3).join('/')).slice(0,4),own:[...new Set((f.commands||[]).map(c=>c.owner?.kind))].slice(0,12)});}catch(e){R.push(String(e));}return base.apply(this,arguments);};
 const k=new KeyboardEvent('keydown',{key:'d',code:'KeyD'});
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',code:'KeyD',bubbles:true}));
 await new Promise(r=>setTimeout(r,5000));window.dispatchEvent(new KeyboardEvent('keyup',{key:'d',code:'KeyD',bubbles:true}));three.render=base;return R;});
fs.writeFileSync(out+'/hero.json',JSON.stringify(rec.slice(0,80),null,0));
console.log(JSON.stringify(info).slice(0,3000));console.log(JSON.stringify(rec.slice(0,6)));
await p.screenshot({path:out+'/a.png'});await b.close();
