// R1262 맞을 때 몸 키 튐 재현: 서 있는 보스를 0.12초(게임 시간)마다 조금씩 때리며 몸 그림 화면 키·경로 기록. node hitprobe.mjs 지역:id [횟수]
import {chromium,boot,go} from '../r444/lib.mjs';
const [z,id]=process.argv[2].split(':');const N=+(process.argv[3]||40);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}'}});await go(p,z);
await p.evaluate(id=>{const e=room.enemies.find(x=>x.nativeId===id);room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
 for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.speed=0;e.x=player.x+3;e.y=player.y-1.5;window.__H={e,rows:[]};
 const FX=/r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|blood|flame|r572|r571|dissol|burn|smoke|ink-bleed|r106fx|ember|ash|spark|glow|wreath/i;
 const de=drawEnemy;drawEnemy=function(x,...a){const H=window.__H;if(x===H.e){x.attack=null;x.cd=99;}const s0=ctx.commands.length;const r=de.call(this,x,...a);
  if(x===H.e){let best=null,ba=0;for(const k of ctx.commands.slice(s0)){if(k?.kind!=='image'||!Array.isArray(k.points)||FX.test(String(k.sourcePath||'')))continue;const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1]));if(ar>ba){ba=ar;best=k;}}
   if(best){const P=best.points;H.rows.push({t:+time.toFixed(3),h:Math.round(Math.abs(P[3][1]-P[0][1])),w:Math.round(Math.abs(P[1][0]-P[0][0])),src:String(best.sourcePath||'').split('/').pop().slice(0,48),sr:(best.sourceRect||[]).map(Math.round).join(','),ht:+(x.hitTimer||0).toFixed(2),cmds:ctx.commands.length-s0});}}return r;};},id);
for(let i=0;i<N;i++){const t0=await p.evaluate(()=>{const e=window.__H.e;hitEnemy(e,Math.max(1,e.maxHp*.001));return time;});await p.waitForFunction(t=>time>t+.12,t0,{timeout:20000}).catch(()=>{});}
const rows=await p.evaluate(()=>window.__H.rows);const hs=rows.map(r=>r.h).sort((a,b)=>a-b);const med=hs[hs.length>>1];
const big=rows.filter(r=>r.h>med*1.15||r.h<med*.85);console.log(id,'frames',rows.length,'median h',med,'outliers',big.length,JSON.stringify(big.slice(0,8)));
const g={};for(const r of rows){const k=r.src+'#'+r.sr;(g[k]??=[]).push(r.h);}for(const [k,v] of Object.entries(g))console.log(' ',k,'n='+v.length,Math.min(...v)+'~'+Math.max(...v));
await b.close();
