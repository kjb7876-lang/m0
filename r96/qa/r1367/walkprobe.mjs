// R1367 이동 측정(헤드리스): 지역마다 보스·중간보스·우두머리를 영웅 옆에 세우고 AI 걸음을 멈춘 뒤(speed 0)
//  게임 시간으로 화면 가로 왕복(PATH=x) 또는 세로 왕복(PATH=y)으로 걷게 한다. 렌더러로 가는 몸 그림 명령(owner enemy:id)의
//  경로·칸·네 점·좌우 뒤집힘과 그 순간 몹 발밑 화면 좌표(project(e.x,e.y))·움직인 화면 방향을 모은다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1367/walkprobe.mjs <out.json> zone ...   (SEC=게임초, 기본 8)
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];const ZONES=process.argv.slice(3);const SEC=+process.env.SEC||8;const PATH=process.env.PATH_DIR||'x';
const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:960,height:540},init:process.env.OFF?{'storyworld.r1368.m052':'{"on":false}','storyworld.r1367.murderWalk':'{"on":false}'}:null});
async function waitGame(sec){const t0=await p.evaluate(()=>time);for(let i=0;i<900;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,sec]))return;await p.waitForTimeout(150);}}
const all={};
for(const z of ZONES){try{
 await go(p,z);await skip(p);await waitGame(1);
 const reps=await p.evaluate(([PATH])=>{
  const pick=room.enemies.filter(e=>e.hp>0&&(e.boss||e.midboss||/우두머리/.test(e.name||'')));
  const seen=new Map();for(const e of pick){const id=String(e.nativeId||e.name)+(e.boss?'B':e.midboss?'M':'C');if(!seen.has(id))seen.set(id,e);}
  const R=[...seen.values()];for(const e of room.enemies)if(!R.includes(e))e.hp=0;
  player.hp=player.maxHp=1e9;player.invincible=1e9;
  const W={reps:R,log:{},t0:time};window.__W=W;
  R.forEach((e,i)=>{e.__sp=e.speed||e.baseSpeed||1;e.hp=e.maxHp=1e8;e.spawnState='active';e.hidden=false;e.engaged=true;if(PATH!=='chase'){e.speed=0;e.baseSpeed=0;}const k=i-(R.length-1)/2,ang=i/R.length*Math.PI*2;e.__home=PATH==='chase'?{x:player.x+Math.cos(ang)*6,y:player.y+Math.sin(ang)*6}:{x:player.x+3+k*1.2,y:player.y-3+k*1.2};e.x=e.__home.x;e.y=e.__home.y;e.__ph=i*.7;});
  try{room.engaged=true;}catch(_){}
  // 화면 가로 = 세계 (x,-y) 방향, 세로 = (x,y) 방향. 1.1칸/초로 3.3칸 왕복.
  // PATH=chase: AI 걸음 그대로(공격만 막음) — 영웅에서 6칸 떨어진 자리에서 다가오다 1.8칸 안이면 다시 제자리로.
  const ctl=()=>{for(const e of W.reps){if(!(e.hp>0))continue;e.hitTimer=0;if(!/^atk/.test(PATH)){e.attack=null;e.attackCooldown=99;e.cooldown=99;}
     if(PATH==='atkL'||PATH==='atkR'){/* 영웅 왼쪽(atkL: 몹은 영웅 오른쪽에 서서 왼쪽을 때림) / 오른쪽 */const sg=PATH==='atkL'?1:-1;e.speed=0;e.x=player.x+sg*.85;e.y=player.y-sg*.85;e.__home={x:e.x,y:e.y};if(!e.attack&&e.attackCooldown>.3)e.attackCooldown=0;if(e.cooldown>.3)e.cooldown=0;continue;}
     if(PATH==='chase'){e.speed=e.__sp;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<1.8){e.x=e.__home.x;e.y=e.__home.y;}continue;}
     e.speed=0;const s=1.65*Math.sin((time-W.t0)*1.1/1.65*1+e.__ph);const ux=PATH==='x'?1:1,uy=PATH==='x'?-1:1;e.x=e.__home.x+ux*s*.7071;e.y=e.__home.y+uy*s*.7071;}
   player.hp=player.maxHp;requestAnimationFrame(ctl);};requestAnimationFrame(ctl);
  const by=new Map(R.map(e=>['enemy:'+e.id,e]));
  window.__r1367grab=cm=>{if(!Array.isArray(cm))return;const per=new Map();
   for(const k of cm){if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4||k.r620Ghost||k.r760Ghost)continue;const oid=String(k.owner?.id||'');const e=by.get(oid)||(oid.startsWith('r248:mob:')?by.get('enemy:'+oid.slice(9)):null);if(!e)continue;
    const s=String(k.sourcePath||k.image?.src||'').replace(/^.*?assets\//,'assets/');if(/shadow|aura|ring|fx|effect|sword|hpbar/i.test(s))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);
    const o=per.get(e);if(!o||h>o.h)per.set(e,{k,h,s});}
   for(const [e,o] of per){const id=String(e.nativeId||e.name)+(e.boss?'B':e.midboss?'M':'C');const L=W.log[id]||(W.log[id]={name:e.name,boss:!!e.boss,midboss:!!e.midboss,samples:[],last:null});
    const g=project(e.x,e.y);const prev=L.last;L.last={x:g.x,y:g.y,t:time};if(!prev||time-prev.t<=0)continue;
    const P=o.k.points;const sr=Array.isArray(o.k.sourceRect)?o.k.sourceRect.map(v=>Math.round(v*10)/10):null;
    let face=null;try{face=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);}catch(_){}
    if(L.samples.length<1500)L.samples.push({t:+time.toFixed(3),vx:+((g.x-prev.x)/(time-prev.t)).toFixed(2),vy:+((g.y-prev.y)/(time-prev.t)).toFixed(2),gx:+g.x.toFixed(1),gy:+g.y.toFixed(1),
     src:o.s,sr,isz:o.k.imageSize||null,P:P.map(q=>q.map(v=>Math.round(v*10)/10)),faceLeft:face==null?null:!!face,r1029:o.k.r1029||null});}};
  if(!window.__r1367hook){window.__r1367hook=1;const hook=()=>{try{const h=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(h?.commands?.render&&!h.commands.render.__r1367){const base=h.commands.render;const w=function(c){const r=base.apply(this,arguments);try{window.__r1367grab?.(c);}catch(_){}return r;};w.__r1367=1;h.commands.render=w;}}catch(_){}requestAnimationFrame(hook);};hook();}
  return R.map(e=>`${e.nativeId}/${e.name}${e.boss?'[B]':''}${e.midboss?'[M]':''} sp=${e.__sp} flags=${['stationary','r75Tower','immobile','rooted','turret','prop','kind','role'].map(k=>e[k]?k+':'+e[k]:'').filter(Boolean).join(',')}`);},[PATH]);
 console.log(z,reps.join(' | '));
 await waitGame(SEC);
 all[z]=await p.evaluate(()=>{const o=window.__W.log;for(const v of Object.values(o))delete v.last;return o;});await p.evaluate(()=>{window.__W.reps=[];});
}catch(err){console.log('ERR',z,String(err).slice(0,300));}}
fs.writeFileSync(OUT,JSON.stringify(all));await b.close();
