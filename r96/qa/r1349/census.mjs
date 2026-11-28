// R1349 2D 몹·보스 전수조사: 지역마다 nativeId 하나씩 대표를 영웅 둘레에 세우고 대기·걷기·공격·피격 상태로 몰아,
//  렌더러로 넘어가는 마지막 명령에서 몹마다 가장 큰 몸 그림(owner enemy:id)을 칸 단위로 모은다(R1337 census 를 여러 몹으로).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1349/census.mjs <out폴더> zone ...
// 결과: <out>/<zone>/census.json + <zone>/<id>/<state>-NN.png (그려진 칸 원본)
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];const ZONES=process.argv.slice(3);
const b=await chromium.launch();
// SPOOF=1: 사람이 할 때처럼(navigator.webdriver=false) 3D 설정 기본값으로 — 실제 플레이에서 3D 로 그려지는 몹(no2d)을 가린다
{const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);c.setDefaultNavigationTimeout(240000);if(process.env.SPOOF)await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};}
const STATES=(process.env.STATES||'idle,walk,attack,hit').split(',');
async function waitGame(p,sec){const t0=await p.evaluate(()=>time);for(let i=0;i<500;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,sec]))return;await p.waitForTimeout(150);}}
const {ctx,p}=await boot(b,{vp:{width:960,height:540}});
for(const z of ZONES){try{
 fs.mkdirSync(OUT+'/'+z,{recursive:true});
 await go(p,z);await skip(p);await waitGame(p,1);
 const reps=await p.evaluate(()=>{
  const seen=new Map();for(const e of room.enemies){if(!(e.hp>0))continue;const id=String(e.nativeId||e.name);if(!seen.has(id))seen.set(id,e);}
  const R=[...seen.values()];for(const e of room.enemies)if(!R.includes(e)){e.hp=0;}
  const n=R.length;player.hp=player.maxHp=1e9;player.invincible=1e9;
  window.__C={reps:R,S:'idle',R:{},home:new Map()};
  R.forEach((e,i)=>{e.__sp=e.speed||e.baseSpeed||1;const a=i/n*Math.PI*2,rr=e.boss||e.midboss?3.6:2.6;e.spawnState='active';e.hidden=false;e.hp=e.maxHp=1e8;e.engaged=true;window.__C.home.set(e,{x:player.x+Math.cos(a)*rr,y:player.y+Math.sin(a)*rr});});
  try{room.engaged=true;}catch(_){}
  const ctl=()=>{const C=window.__C;for(const e of C.reps){if(!(e.hp>0))continue;const h=C.home.get(e),S=C.S;
    if(S==='idle'){e.attack=null;e.speed=0;e.attackCooldown=99;e.cooldown=99;e.x=h.x;e.y=h.y;}
    else if(S==='walk'){e.attack=null;e.attackCooldown=99;e.cooldown=99;e.speed=e.__sp;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<1.4||d>6){e.x=h.x;e.y=h.y;}}
    else if(S==='attack'){e.speed=0;const k=e.boss||e.midboss?.45:.38;e.x=player.x+(h.x-player.x)*k;e.y=player.y+(h.y-player.y)*k;if(e.attackCooldown>1)e.attackCooldown=0;if(e.cooldown>1)e.cooldown=0;}
    else if(S==='hit'){e.attack=null;e.speed=0;e.attackCooldown=99;e.cooldown=99;e.x=h.x;e.y=h.y;if(!(e.hitTimer>0)&&Math.random()<.3)try{hitEnemy(e,1,{kind:'qa'});}catch(_){e.hitTimer=.14;e.flash=.14;}}}
   player.hp=player.maxHp;requestAnimationFrame(ctl);};requestAnimationFrame(ctl);
  const byOwner=new Map(R.map(e=>['enemy:'+e.id,e]));
  const grab=cm=>{const C=window.__C;if(!Array.isArray(cm))return;const best=new Map();
   for(const k of cm){if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const oid=String(k.owner?.id||'');const e=byOwner.get(oid)||(oid.startsWith('r248:mob:')?byOwner.get('enemy:'+oid.slice(9)):null);if(!e)continue;/* R248 고유 몹은 owner 'r248:mob:<id>' */const s=String(k.sourcePath||'');if(/shadow|aura|ring|fx|effect|sword/i.test(s))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);const o=best.get(e);if(!o||h>o.h)best.set(e,{k,h});}
   for(const [e,{k:best0}] of best){const id=String(e.nativeId||e.name),S=C.S;const RR=C.R[id]||(C.R[id]={name:e.name,boss:!!e.boss,midboss:!!e.midboss,st:{}});const R=RR.st[S]||(RR.st[S]={});
    const sp=String(best0.sourcePath||best0.image?.src||'').replace(/^.*?assets\//,'assets/');const sr=Array.isArray(best0.sourceRect)?best0.sourceRect.map(Math.round):null;
    const key=sp+'|'+(sr?sr.join(','):'whole');let o=R[key];
    if(!o){o=R[key]={n:0,hs:[],pts:best0.points.map(q=>q.map(v=>Math.round(v*10)/10))};
     try{const im=best0.image,[sx,sy,sw,sh]=sr||[0,0,im.width,im.height];const c=document.createElement('canvas');c.width=Math.max(1,Math.round(sw));c.height=Math.max(1,Math.round(sh));c.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);o.png=c.toDataURL('image/png');}catch(err){o.err=String(err).slice(0,80);}}
    o.n++;if(o.hs.length<40)o.hs.push(Math.round(Math.abs(best0.points[3][1]-best0.points[0][1])*10)/10);
    try{const L=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);const mir=best0.points[1][0]<best0.points[0][0];const kk=(L?'L':'R')+(mir?'m':'n');o.face=o.face||{};o.face[kk]=(o.face[kk]||0)+1;}catch(_){}}
   for(const e of C.reps){const id=String(e.nativeId||e.name);const RR=C.R[id]||(C.R[id]={name:e.name,boss:!!e.boss,midboss:!!e.midboss,st:{}});RR.frames=(RR.frames||0)+1;if(!best.has(e))RR.no2d=(RR.no2d||0)+1;}};
  window.__r1349grab=grab;// 지역마다 새 grab(앞 지역 몹 표를 붙든 감싸개가 남지 않게)
  if(window.__r1349hook)return R.map(e=>String(e.nativeId||e.name)+'/'+e.name+(e.boss?'[B]':'')+(e.midboss?'[M]':''));window.__r1349hook=true;
  const hook=()=>{try{const h=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(h?.commands?.render&&!h.commands.render.__r1349c){const base=h.commands.render;const w=function(cmds){const r=base.apply(this,arguments);try{window.__r1349grab?.(cmds);}catch(_){}return r;};w.__r1349c=true;h.commands.render=w;}}catch(_){}requestAnimationFrame(hook);};hook();
  return R.map(e=>String(e.nativeId||e.name)+'/'+e.name+(e.boss?'[B]':'')+(e.midboss?'[M]':''));});
 console.log(z,reps.length,reps.join(' '));
 for(const S of STATES){await p.evaluate(S=>{window.__C.S=S;},S);await waitGame(p,S==='attack'?5:2.5);}
 const R=await p.evaluate(()=>window.__C.R);const meta={zone:z,mobs:{}};
 for(const [id,M] of Object.entries(R)){const d=id.replace(/[^\w.-]+/g,'_');fs.mkdirSync(OUT+'/'+z+'/'+d,{recursive:true});const mm={name:M.name,boss:M.boss,midboss:M.midboss,frames:M.frames,no2d:M.no2d||0,dir:d,states:{}};
  for(const [S,ks] of Object.entries(M.st)){mm.states[S]=[];let i=0;for(const [k,o] of Object.entries(ks)){const f=`${S}-${String(i++).padStart(2,'0')}.png`;if(o.png)fs.writeFileSync(OUT+'/'+z+'/'+d+'/'+f,Buffer.from(o.png.split(',')[1],'base64'));delete o.png;mm.states[S].push({key:k,file:f,...o});}}
  meta.mobs[id]=mm;}
 fs.writeFileSync(OUT+'/'+z+'/census.json',JSON.stringify(meta,null,1));
 await p.evaluate(()=>{window.__C.reps=[];});
}catch(err){console.log('ERR',z,String(err).slice(0,200));}}
await b.close();
