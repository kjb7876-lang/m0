// R1224 모든 지역 보스·중간보스 전수 실측: 이동 중 그림 변화(이동 모션 유무)·전투 중 그림·키 튐·겹침(몸 명령 수)
// 사용: node census.mjs <출력폴더> [지역,…]   (서버 SW_URL, 기본 127.0.0.1:4410/m0/)
import {chromium,boot,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const out=process.argv[2]||'cen';fs.mkdirSync(out,{recursive:true});
const only=process.argv[3]?process.argv[3].split(','):null;
const VW=+(process.env.VW||640),VH=Math.round(VW*9/16);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:VW,height:VH},init:{'storyworld.r790.npc':'{"on":false}'}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const zones=only||await p.evaluate(()=>Object.values(regions).map(r=>r.id).filter(id=>!/^sz(115|162|173)/.test(id)));
const res=fs.existsSync(out+'/census.json')?JSON.parse(fs.readFileSync(out+'/census.json')):{};
await p.evaluate(()=>{const FX=/r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|dissol|burn|smoke|\bash\b|ink-bleed|r106fx/i;
 window.__FX=FX;const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,st0=Array.isArray(c?.commands)?c.commands.length:-1;const r=de.call(this,e,...a);
  if(e===window.__E&&st0>=0){window.__refs=c.commands.slice(st0).filter(k=>k?.kind==='image'&&Array.isArray(k.points)&&k.points.length>=4);const q=project(e.x,e.y);
   window.__meta={gy:q.y,gx:q.x,x:e.x,y:e.y,state:e.state||'',att:!!e.attack,busy:!!(e.attack||e.state==='attack'||e.state==='cast'||e.state==='windup'),hp:e.hp,dead:!(e.hp>0)};}
  return r;};
 window.__read=()=>{const R=window.__refs,M=window.__meta;window.__refs=null;if(!R)return null;const bodies=[],all=[];
  for(const k of R){const s=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');all.push(s);if(FX.test(s)&&!/assets\/r974\/|assets\/r1029\/|\/move\//.test(s))continue;
   const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));const ys=P.map(q=>q[1]),xs=P.map(q=>q[0]);
   bodies.push({ar:Math.round(ar),src:s,sr:k.sourceRect?k.sourceRect.map(v=>Math.round(v)):null,h:+(Math.max(...ys)-Math.min(...ys)).toFixed(1),w:+(Math.max(...xs)-Math.min(...xs)).toFixed(1),top:+Math.min(...ys).toFixed(1),bot:+Math.max(...ys).toFixed(1),l:+Math.min(...xs).toFixed(1),r:+Math.max(...xs).toFixed(1),flip:P[1][0]<P[0][0],alpha:k.alpha??k.globalAlpha??null,tag:k.r974||k.r1029||null});}
  bodies.sort((a,b)=>b.ar-a.ar);return {...M,bodies:bodies.slice(0,4),nb:bodies.length,all};};});
const SHOTS=process.env.SHOTS!=='0';
async function sample(n,dt){const S=[];let stall=0;for(let k=0;k<n;k++){const t0=await p.evaluate(()=>{try{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);}catch(_){}return time;});const ok=await p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:15000}).then(()=>1).catch(()=>0);if(!ok&&++stall>=2){S.push({stalled:true});break;}
  const L=await p.evaluate(()=>{const L=window.__read();const e=window.__E;if(e&&e.hp>0)e.hp=Math.max(e.hp,e.maxHp*.7);return L&&{...L,ex:e?.x,ey:e?.y};});S.push(L);
  if(SHOTS&&L&&L.bodies[0]&&shot){const B=L.bodies[0],key=B.src+'#'+(B.sr||[]).join(',');if(!shot.seen.has(key)&&shot.seen.size<8){shot.seen.add(key);const pad=30,x=Math.max(0,B.l-pad),y=Math.max(0,B.top-pad);
   L.shot=`${shot.base}-${shot.seen.size}.png`;await p.screenshot({path:out+'/'+L.shot,clip:{x,y,width:Math.max(8,Math.min(VW-x,B.r-B.l+pad*2)),height:Math.max(8,Math.min(VH-y,B.bot-B.top+pad*2))}}).catch(()=>{});}}}
  return S;}
let shot=null;
for(const z of zones){ if(res[z]&&!only)continue; errs.length=0;
 try{await go(p,z);}catch(err){res[z]={err:String(err).slice(0,100)};fs.writeFileSync(out+'/census.json',JSON.stringify(res));continue;}
 await p.waitForTimeout(500);
 const list=await p.evaluate(()=>(window.__BL=room.enemies.filter(e=>e.boss||e.midboss)).map((e,i)=>({i,name:e.name,id:e.nativeId,boss:!!e.boss,mid:!!e.midboss,speed:e.speed})));
 const zr={list,bosses:[]};
 for(const it of list){
  try{await p.evaluate(ix=>{const e=window.__BL[ix];if(!e)throw new Error('gone');
   try{room.activeEncounter='trial';summon3([e],e.midboss&&!e.boss?'midboss':'boss');}catch(err){}
   room.engaged=true;e.spawnState='active';e.hidden=false;player.hp=9e8;player.maxHp=9e8;player.invincible=1e9;
   for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}
   window.__E=e;window.__spd=e.speed;
   // 이동 구간: 공격 쿨을 길게 두고 영웅에게서 5칸 떨어진 곳에서 다가오게
   e.x=player.x+7;e.y=player.y;e.attackCooldown=99;e.cooldown=99;e.skillCooldown=99;},it.i);}catch(err){zr.bosses.push({...it,err:String(err).slice(0,120)});continue;}
  shot={base:`${z}-${String(it.id).replace(/[^a-z0-9-]/gi,'_')}`,seen:new Set()};
  const mv=await sample(12,0.12);
  await p.evaluate(()=>{const e=window.__E;e.attackCooldown=0;e.cooldown=0;e.skillCooldown=0;e.x=player.x+2.2;e.y=player.y-1.2;});
  const cb=await sample(18,0.35);
  // 사망 구간
  await p.evaluate(()=>{const e=window.__E;try{room.engaged=true;for(let k=0;k<4&&e.hp>0;k++)hitEnemy(e,e.hp+1);}catch(err){}window.__deadHp=e.hp;});
  const dd=await sample(6,0.2);
  zr.bosses.push({...it,mv,cb,dd});
  await p.evaluate(()=>{const e=window.__E;if(e){e.x=-999;e.y=-999;e.speed=0;e.hp=0;}window.__E=null;});
 }
 zr.errs=[...new Set(errs)].slice(0,8);res[z]=zr;fs.writeFileSync(out+'/census.json',JSON.stringify(res));
 console.log(z,list.map(x=>x.id+':'+x.name).join(' | '));
}
await b.close();
