// R1224 보스·중간보스 걷기 그림 전수: AI 걸음을 멈추고(speed 0, 공격 쿨 길게) 게임 시간으로 옆(화면 왼쪽→오른쪽 양쪽)으로 직접 걸려,
// 걷는 동안 그려진 몸 그림 열쇠(경로+칸) 수를 센다. 1개면 '한 장 미끄러짐'. 사용: node walk-census.mjs <출력json> [지역,…]
import {chromium,boot,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const out=process.argv[2]||'walk.json';const only=process.argv[3]?process.argv[3].split(','):null;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}'}});
const zones=only||await p.evaluate(()=>Object.values(regions).map(r=>r.id).filter(id=>!/^sz(115|162|173)/.test(id)));
const res=fs.existsSync(out)&&!only?JSON.parse(fs.readFileSync(out)):{};
await p.evaluate(()=>{const FX=/r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|blood|flame|r572|r571|dissol|burn|smoke|ink-bleed|r106fx/i;
 const de=drawEnemy;drawEnemy=function(e,...a){const W=window.__W;if(W&&e===W.e){const t=time,dt=Math.max(0,Math.min(.1,t-(W.t??t)));W.t=t;e.x+=W.vx*dt;e.attack=null;e.state=e.state==='attack'?'idle':e.state;}
  const c=ctx,st0=Array.isArray(c?.commands)?c.commands.length:-1;const r=de.call(this,e,...a);if(W&&e===W.e&&st0>=0)W.refs=c.commands.slice(st0).filter(k=>k?.kind==='image'&&Array.isArray(k.points)&&k.points.length>=4);return r;};
 window.__readW=()=>{const W=window.__W;const R=W?.refs;if(!R)return null;W.refs=null;let best=null,ba=0;for(const k of R){const s=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(FX.test(s))continue;const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1]));if(ar>ba){ba=ar;best={src:s,sr:(k.sourceRect||[]).map(Math.round).join(','),flip:P[1][0]<P[0][0],tag:k.r974||k.r1029||null,h:Math.round(Math.abs(P[3][1]-P[0][1]))};}}return best;};});
for(const z of zones){if(res[z])continue;
 try{await go(p,z);}catch(err){res[z]={err:String(err).slice(0,100)};continue;}
 const list=await p.evaluate(()=>(window.__BL=room.enemies.filter(e=>e.boss||e.midboss)).map((e,i)=>({i,id:e.nativeId,name:e.name,boss:!!e.boss})));
 const zr=[];
 for(const it of list){
  const ok=await p.evaluate(ix=>{const e=window.__BL[ix];if(!e||!(e.hp>0))return false;room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
   for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}
   window.__sv={speed:e.speed};e.speed=0;e.cd=99;e.attackCooldown=99;e.cooldown=99;e.skillCooldown=99;e.x=player.x+2.5;e.y=player.y-2.5;window.__W={e,vx:-1.6,t:null,refs:null};return true;},it.i);
  if(!ok){zr.push({...it,err:'no'});continue;}
  const S=[];
  for(const vx of [-1.6,1.6]){await p.evaluate(vx=>{window.__W.vx=vx;window.__W.t=null;},vx);
   for(let k=0;k<10;k++){const t0=await p.evaluate(()=>{try{if(modal)closePanel(true);}catch(_){}return time;});await p.waitForFunction(t=>time>t+.11,t0,{timeout:15000}).catch(()=>{});
    const r=await p.evaluate(()=>{const e=window.__W.e;e.cd=99;return {b:window.__readW(),busy:!!e.attack||['attack','cast','windup'].includes(e.state),st:e.state};});if(r.b)S.push({...r.b,vx,busy:r.busy,st:r.st});}}
  await p.evaluate(()=>{const e=window.__W.e;window.__W=null;e.x=-999;e.y=-999;e.speed=0;});
  const keys=[...new Set(S.filter(s=>!s.busy).map(s=>s.src+'#'+s.sr))];
  zr.push({...it,n:S.length,keys,tags:[...new Set(S.map(s=>s.tag))],flips:[...new Set(S.map(s=>s.vx+':'+s.flip))],hs:S.map(s=>s.h)});
 }
 res[z]=zr;fs.writeFileSync(out,JSON.stringify(res));console.log(z,zr.map(x=>x.id+':'+(x.keys?x.keys.length:'-')).join(' '));
}
await b.close();
