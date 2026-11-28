// R1385 몹별 2D·3D 비교 측정: 지역마다 nativeId 대표 하나씩 영웅 둘레에 세우고
//  A) 3D 모두 끔(2D): 대기·걷기·공격·피격 상태로 몰아 몸 그림(owner enemy:id)의 칸 종류·키·방향을 모으고 대기 장면을 찍는다.
//  B) 3D 모두 켬: 같은 자리 대기 장면을 찍고, 어느 3D 모듈이 그 몹을 맡았는지(kindOf·2D 몸 빠짐)를 적는다.
// 사용: SW_URL='http://127.0.0.1:4410/m0/?orb3d=0' node r96/qa/r1385/measure.mjs <out> zone ...
// 결과: <out>/<zone>.json, <out>/<zone>-2d.png, <out>/<zone>-3d.png
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];globalThis.__bx=null;const ZONES=process.argv.slice(3);fs.mkdirSync(OUT,{recursive:true});
const NOVID={'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}','storyworld.r1326.zone3d':'off'};
const VP=[640,360],SHOT={width:960,height:540};
async function waitGame(p,sec){const t0=await p.evaluate(()=>time);for(let i=0;i<400;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,sec]))return true;await p.waitForTimeout(150);}return false;}
const MODS=['__STORYWORLD_MOB3D_R1312__','__STORYWORLD_MOB3D_R1315__','__STORYWORLD_MOB3D_R1316__','__STORYWORLD_MOB3D_R1317__','__STORYWORLD_MOB3D_R1322__','__STORYWORLD_BOSS3D_R1322C__','__STORYWORLD_MOB3D_R1329__','__STORYWORLD_MOB3D_R1330__','__STORYWORLD_BALROG3D_R1338__','__STORYWORLD_MOB3D_R1343__','__STORYWORLD_MOB3D_R1382__'];
let b=null,p=null,n=0;
async function fresh(){if(b)try{await b.close();}catch(_){}b=await chromium.launch();({p}=await boot(b,{vp:{width:VP[0],height:VP[1]},init:NOVID}));await p.evaluate(M=>{for(const k of M)try{window[k]?.set?.(false);}catch(_){}},MODS);}
for(const z of ZONES){globalThis.__bx={};try{
 if(!b||n%2===0)await fresh();n++;
 await go(p,z);await skip(p);await waitGame(p,1);
 const reps=await p.evaluate(()=>{
  const seen=new Map();for(const e of room.enemies){if(!(e.hp>0))continue;const id=String(e.nativeId||e.name);if(!seen.has(id))seen.set(id,e);}
  const R=[...seen.values()].slice(0,8);for(const e of room.enemies)if(!R.includes(e))e.hp=0;
  const n=R.length;player.hp=player.maxHp=1e9;player.invincible=1e9;
  window.__C={reps:R,S:'idle',R:{},home:new Map(),spin:true,boxes:{}};
  R.forEach((e,i)=>{e.__sp=e.speed||e.baseSpeed||1;e.__a0=i/n*Math.PI*2;e.__rr=e.boss||e.midboss?3.4:2.6;e.spawnState='active';e.hidden=false;e.hp=e.maxHp=1e8;e.engaged=true;});
  try{room.engaged=true;}catch(_){}
  const ctl=()=>{const C=window.__C;for(const e of C.reps){if(!(e.hp>0))continue;const aa=e.__a0+(C.spin?Math.floor(time/1.2)*Math.PI/3:0);const h={x:player.x+Math.cos(aa)*e.__rr,y:player.y+Math.sin(aa)*e.__rr};const S=C.S;
    if(S==='solo'){e.attack=null;e.speed=0;e.attackCooldown=99;e.cooldown=99;e.state='idle';const me=C.reps[C.solo]===e;e.x=player.x+(me?2.4:40+C.reps.indexOf(e)*3);e.y=player.y+(me?.8:40);continue;}
    if(S==='idle'){e.attack=null;e.speed=0;e.attackCooldown=99;e.cooldown=99;e.x=h.x;e.y=h.y;e.state='idle';}
    else if(S==='walk'){e.attack=null;e.attackCooldown=99;e.cooldown=99;e.speed=e.__sp;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<1.4||d>6){e.x=h.x;e.y=h.y;}}
    else if(S==='attack'){e.speed=0;const k=e.boss||e.midboss?.45:.38;e.x=player.x+(h.x-player.x)*k;e.y=player.y+(h.y-player.y)*k;if(e.attackCooldown>1)e.attackCooldown=0;if(e.cooldown>1)e.cooldown=0;}
    else if(S==='hit'){e.attack=null;e.speed=0;e.attackCooldown=99;e.cooldown=99;e.x=h.x;e.y=h.y;if(!(e.hitTimer>0)&&Math.random()<.3)try{hitEnemy(e,1,{kind:'qa'});}catch(_){e.hitTimer=.14;e.flash=.14;}}}
   player.hp=player.maxHp;requestAnimationFrame(ctl);};requestAnimationFrame(ctl);
  const byOwner=new Map(R.map(e=>['enemy:'+e.id,e]));
  window.__grab=cm=>{const C=window.__C;if(!Array.isArray(cm))return;const best=new Map();
   for(const k of cm){if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const oid=String(k.owner?.id||'');const e=byOwner.get(oid)||(oid.startsWith('r248:mob:')?byOwner.get('enemy:'+oid.slice(9)):null);if(!e)continue;const s=String(k.sourcePath||'');if(/shadow|aura|ring|fx|effect|sword|ghost/i.test(s))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);const o=best.get(e);if(!o||h>o.h)best.set(e,{k,h});}
   for(const e of C.reps){const id=String(e.nativeId||e.name);const RR=C.R[id]||(C.R[id]={eid:e.id,name:e.name,boss:!!e.boss,midboss:!!e.midboss,st:{},no2d:{},frames:{}});RR.frames[C.S]=(RR.frames[C.S]||0)+1;if(!best.has(e))RR.no2d[C.S]=(RR.no2d[C.S]||0)+1;}
   for(const [e,{k:b0,h}] of best){const id=String(e.nativeId||e.name),S=C.S,RR=C.R[id];const R=RR.st[S]||(RR.st[S]={});
    const sp=String(b0.sourcePath||b0.image?.src||'').replace(/^.*?assets\//,'assets/');const sr=Array.isArray(b0.sourceRect)?b0.sourceRect.map(Math.round):null;
    const key=sp+'|'+(sr?sr.join(','):'whole');const o=R[key]||(R[key]={n:0,hs:[],dir:{}});o.n++;if(o.hs.length<30)o.hs.push(Math.round(h*10)/10);
    if(S==='solo'&&C.reps[C.solo]===e){const xs=b0.points.map(q=>q[0]),ys=b0.points.map(q=>q[1]);C.boxes[id]=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}
    try{const g=project(e.x,e.y),q=project(player.x,player.y);let dx,dy;if(S==='walk'){const L=e.__lg;e.__lg={x:g.x,y:g.y};dx=L?g.x-L.x:0;dy=L?g.y-L.y:0;}else{dx=q.x-g.x;dy=q.y-g.y;}const m=Math.hypot(dx,dy);const dk=m<.3?'still':Math.abs(dy)>Math.abs(dx)*1.2?(dy<0?'up':'down'):'side';o.dir[dk]=(o.dir[dk]||0)+1;}catch(_){}}};
  if(!window.__hooked){window.__hooked=1;const seen=new WeakSet();
   const wrapEV=o=>{if(!o||typeof o.ensureHospitalVisual!=='function'||o.ensureHospitalVisual.__r1385)return;const base=o.ensureHospitalVisual;const w=function(frame){try{const c=frame?.commands;if(Array.isArray(c)&&!seen.has(c)){seen.add(c);window.__grab?.(c);}}catch(_){}return base.apply(this,arguments);};w.__r1385=1;o.ensureHospitalVisual=w;};
   const hook=()=>{try{const h=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(h){wrapEV(Object.getPrototypeOf(h));if(Object.prototype.hasOwnProperty.call(h,'ensureHospitalVisual'))wrapEV(h);}}catch(_){}requestAnimationFrame(hook);};hook();}
  return R.map(e=>String(e.nativeId||e.name)+'/'+e.name+(e.boss?'[B]':'')+(e.midboss?'[M]':''));});
 console.log(z,reps.length,reps.join(' '));
 // A) 2D
 await p.setViewportSize({width:VP[0],height:VP[1]});
 for(const S of ['idle','walk','attack','hit']){await p.evaluate(S=>{window.__C.S=S;},S);await waitGame(p,S==='attack'?4:S==='walk'?2.5:1.5);}
 await p.setViewportSize(SHOT);
 const nR=reps.length;
 async function shots(tag){for(let i=0;i<nR;i++){await p.evaluate(i=>{window.__C.S='solo';window.__C.solo=i;},i);for(let k=0;k<3;k++){await p.waitForTimeout(900);await skip(p);}
  const bx=await p.evaluate(i=>{const C=window.__C,e=C.reps[i],id=String(e.nativeId||e.name);const g=project(e.x,e.y);return {id,b:C.boxes[id]||null,g:[g.x,g.y]};},i);
  if(tag==='2d')(globalThis.__bx||(globalThis.__bx={}))[bx.id]=bx;const B=globalThis.__bx?.[bx.id]||bx;let [x0,y0,x1,y1]=B.b||[B.g[0]-60,B.g[1]-140,B.g[0]+60,B.g[1]+10];const w=x1-x0,h=y1-y0,m=Math.max(w,h)*.35+20;
  const clip={x:Math.max(0,x0-m),y:Math.max(0,y0-m),width:0,height:0};clip.width=Math.min(SHOT.width-clip.x,w+2*m);clip.height=Math.min(SHOT.height-clip.y,h+2*m);
  await p.screenshot({path:`${OUT}/${z}__${bx.id.replace(/[^\w.-]+/g,'_')}-${tag}.png`,clip});}}
 if(process.env.SHOTS)await shots('2d');
 const boxes=await p.evaluate(()=>window.__C.boxes);
 // B) 3D 모두 켬
 await p.evaluate(()=>{window.__C.S='b3d';},null);
 await p.evaluate(M=>{for(const k of M)try{window[k]?.set?.(true);}catch(_){}},MODS);
 await p.evaluate(()=>{window.__C.S='idle';});
 for(let i=0;i<30;i++){await p.waitForTimeout(1500);await skip(p);const ok=await p.evaluate(M=>{const want=new Set();for(const e of window.__C.reps)for(const k of M){try{if(window[k]?.kindOf?.(String(e.id)))want.add(String(e.id));}catch(_){}}let have=0;for(const k of M){try{for(const it of (window[k]?.inspect?.().instances||[]))if(it.visible&&[...want].some(id=>String(it.id).endsWith(':'+id)||it.id===id))have++;}catch(_){}}return have>=want.size;},MODS).catch(()=>false);if(ok&&i>3)break;}
 if(process.env.SHOTS)await shots('3d');
 const res=await p.evaluate(M=>{const C=window.__C;const own={};for(const e of C.reps){const id=String(e.nativeId||e.name);own[id]=[];for(const k of M){const m=window[k];try{const kk=m?.kindOf?.(String(e.id));if(kk)own[id].push(k.replace(/__STORYWORLD_|__/g,'')+':'+kk);}catch(_){}}}
  const ins={};for(const k of M){try{const s=window[k]?.inspect?.();if(s)ins[k]={loaded:s.loaded,failed:s.failed,active:s.active,inst:(s.instances||[]).map(i=>[i.id,i.kind,i.visible,i.pose])};}catch(_){}}
  return {R:C.R,own,ins};},MODS);
 fs.writeFileSync(`${OUT}/${z}.json`,JSON.stringify({zone:z,boxes,...res},null,1));
 await p.evaluate(M=>{for(const k of M)try{window[k]?.set?.(false);}catch(_){}window.__C.reps=[];},MODS);
}catch(err){console.log('ERR',z,String(err).slice(0,200));try{await b.close();}catch(_){}b=null;n=0;}}
if(b)await b.close();
