// R720 영웅 동작 전환 탐침: 영웅마다 정해진 전환 시나리오(걷기→공격→걷기, 공격 중 대시, 스킬→걷기, 좌우 표적 바꾸기, 공격 중 피격)를
// 게임 시간으로 몰고, 매 프레임 drawHero 가 남긴 몸 그림 명령(그림 경로·칸·좌우·키·발)을 적는다.
// 실행: SW_URL=… node probe.mjs <out.json> [heroes,comma] [initJson]
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const [,,out='probe.json',hs='hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner',initJson]=process.argv;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:initJson?JSON.parse(initJson):null});await go(p,process.env.ZONE||'dist01');await p.waitForTimeout(2000);
await p.evaluate(()=>{
 const FX=/r251\/atlas|pixelfx|\/fx\/|effect|vfx|ring|circle|sigil|shadow|aura|barrier/i;
 window.__rec=[];window.__on=false;
 // 칸 안 실제 그림(알파) 상자 → 화면 좌표(top·bottom·left·right). 칸마다 한 번만 잰다.
 const memo=new Map();
 window.vis=function(k){const im=k.image,sr=k.sourceRect||[0,0,im.naturalWidth||im.width,im.naturalHeight||im.height];const key=(k.sourcePath||im.src)+'|'+sr.join(',');let bb=memo.get(key);
  if(bb===undefined){bb=null;try{const c=document.createElement('canvas');c.width=sr[2];c.height=sr[3];const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sr[0],sr[1],sr[2],sr[3],0,0,sr[2],sr[3]);const d=g.getImageData(0,0,sr[2],sr[3]).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;
   for(let y=0;y<sr[3];y++)for(let x=0;x<sr[2];x++)if(d[(y*sr[2]+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}if(x1>=0)bb=[x0/sr[2],y0/sr[3],(x1+1)/sr[2],(y1+1)/sr[3]];}catch(_){bb=null;}memo.set(key,bb);}
  if(!bb)return null;const P=k.points,L=(u,v)=>[P[0][0]+(P[1][0]-P[0][0])*u+(P[3][0]-P[0][0])*v,P[0][1]+(P[1][1]-P[0][1])*u+(P[3][1]-P[0][1])*v];const a=L(bb[0],bb[1]),z=L(bb[2],bb[3]);
  return {t:+Math.min(a[1],z[1]).toFixed(1),b:+Math.max(a[1],z[1]).toFixed(1),l:+Math.min(a[0],z[0]).toFixed(1),r:+Math.max(a[0],z[0]).toFixed(1)};};
 const dh=drawHero;drawHero=function(...a){const c=ctx,st=Array.isArray(c?.commands)?c.commands.length:-1;const r=dh.apply(this,a);
  if(window.__on&&st>=0){let best=null,bh=0;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.owner?.kind!=='hero')continue;const s=String(k.sourcePath||k.image?.src||'');if(FX.test(s))continue;const hh=Math.abs(k.points[3][1]-k.points[0][1]);if(hh>bh){bh=hh;best=k;}}
   const q=project(player.x,player.y);let vb=null;try{vb=best?vis(best):null;}catch(_){}
   window.__rec.push({t:+time.toFixed(4),ph:window.__phase,mv:!!player.moving,dir:player.direction,at:+(+player.attackAnim||0).toFixed(3),sk:+(+player.skillAnim||0).toFixed(3),ul:+(+player.ultimateAnim||0).toFixed(3),da:+(+player.dashAnim||0).toFixed(3),hu:+(+player.hurtAnim||0).toFixed(3),
    px:+q.x.toFixed(1),py:+q.y.toFixed(1),wx:+player.x.toFixed(3),wy:+player.y.toFixed(3),
    b:best?{s:String(best.sourcePath||best.image?.src||'').replace(/^.*?(assets\/)/,'$1').replace(/^blob:.*/,'blob').split('?')[0],sx:best.sourceRect?best.sourceRect[0]:null,sw:best.sourceRect?best.sourceRect[2]:null,flip:(best.points[1][0]-best.points[0][0])<0,h:+bh.toFixed(1),foot:+Math.max(...best.points.map(v=>v[1])).toFixed(1),cx:+((best.points[0][0]+best.points[1][0])/2).toFixed(1),n:c.commands.length-st,vb,sr:best.sourceRect?best.sourceRect.map(v=>+(+v).toFixed(1)):null,pts:best.points.map(v=>[+v[0].toFixed(1),+v[1].toFixed(1)])}:null});}
  return r;};
 window.__SLOW=1;const tb=tick;tick=function(dt,...a){const d=dt*(window.__SLOW??1);const r=tb.call(this,d,...a);try{window.__ctl?.(d);}catch(err){window.__ctlErr=String(err).slice(0,200);}return r;};
});
const res={};
for(const hero of hs.split(',')){
 await p.evaluate(async h=>{loading=true;try{await ensureImages(heroPaths(h));}finally{loading=false;}player.hero=h;player.combo=0;player.direction='front';player.hp=99999;window.__rec=[];},hero);
 await p.waitForTimeout(4000);
 await p.evaluate(()=>{
  // 적 하나만 남겨 붙들어 둔다(움직임·공격 없음)
  const keep=room.enemies.filter(e=>e.hp>0);for(const e of keep.slice(1))e.hp=0;
  let e=keep[0];if(!e)throw new Error('no enemy');window.__E=e;e.hp=1e9;e.maxHp=1e9;e.speed=0;e.damage=0;e.spawnState='active';e.visible=true;
  const P={x:player.x,y:player.y};window.__P=P;
  const put=(dx,dy)=>{e.x=player.x+dx;e.y=player.y+dy;e.cd=99;e.attack=null;};
  const K=(k,on)=>{if(on)keys.add(k);else keys.delete(k);};
  // 시나리오(게임 시간 초). 화면 오른쪽 = 세계 (+x,-y)/2, 왼쪽 = (-x,+y)
  const T=[
   [0.00,'walkR',()=>{K('ArrowRight',1);}],
   [0.60,'stop+atkR',()=>{K('ArrowRight',0);put(1.2,-1.2);player.attackCD=0;basicAttack(true);}],
   [0.80,'walkL-cancel',()=>{K('ArrowLeft',1);}],
   [1.30,'atkWhileWalk',()=>{put(-1.2,1.2);player.attackCD=0;basicAttack(true);}],
   [1.60,'stop',()=>{K('ArrowLeft',0);}],
   [1.90,'atk+dash',()=>{put(1.2,-1.2);player.attackCD=0;basicAttack(true);}],
   [1.98,'dash',()=>{K('ArrowRight',1);player.blinkCD=0;blink();}],
   [2.10,'dash-release',()=>{K('ArrowRight',0);}],
   [2.60,'skill',()=>{put(1.2,-1.2);player.specialCD=0;special();}],
   [2.80,'skill->walkL',()=>{K('ArrowLeft',1);}],
   [3.30,'stop2',()=>{K('ArrowLeft',0);}],
   [3.36,'dashL',()=>{K('ArrowLeft',1);player.blinkCD=0;blink();}],
   [3.44,'dashL-release',()=>{K('ArrowLeft',0);}],
   [3.60,'atkL',()=>{put(-1.2,1.2);player.attackCD=0;basicAttack(true);}],
   [3.75,'atkR-switch',()=>{put(1.2,-1.2);player.attackCD=0;basicAttack(true);}],
   [3.90,'atkL-switch',()=>{put(-1.2,1.2);player.attackCD=0;basicAttack(true);}],
   [4.30,'atk+hurt',()=>{put(1.2,-1.2);player.attackCD=0;basicAttack(true);}],
   [4.38,'hurt',()=>{player.hurtAnim=.34;}],
   [4.90,'walkUp',()=>{K('ArrowUp',1);}],
   [5.30,'up->down',()=>{K('ArrowUp',0);K('ArrowDown',1);}],
   [5.70,'idle',()=>{K('ArrowDown',0);}],
   [6.20,'end',()=>{window.__on=false;}],
  ];
  let t0=null,i=0;window.__phase='start';window.__on=true;
  window.__ctl=()=>{for(const o of room.enemies)if(o!==e&&o.hp>0){o.visible=false;o.x=e.x+60;o.y=e.y+60;}if(t0==null)t0=time;const t=time-t0;while(i<T.length&&t>=T[i][0]){window.__phase=T[i][1];T[i][2]();i++;}if(i>=T.length)window.__ctl=null;e.speed=0;};
 });
 await p.waitForFunction(()=>!window.__on,null,{timeout:400000,polling:500});
 res[hero]=await p.evaluate(()=>({rec:window.__rec,err:window.__ctlErr||null}));
 console.log(hero,res[hero].rec.length,res[hero].err);
}
fs.writeFileSync(out,JSON.stringify(res));await b.close();
