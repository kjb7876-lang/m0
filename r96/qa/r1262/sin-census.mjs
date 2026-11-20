// R1262 7대죄 보스 그림 전수: 대기·걷기(좌우)·전투·맞음·광폭화·사망 동안 프레임마다 몸 그림(경로·칸·화면 키·발 줄·좌우·NaN) 기록 + 그림마다 장면.
//  node sin-census.mjs <출력폴더> 지역:id [VW]   (보스마다 따로 프로세스로 돌린다)
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const [out,it]=[process.argv[2],process.argv[3]];const VW=+(process.argv[4]||960),VH=Math.round(VW*9/16);fs.mkdirSync(out,{recursive:true});const [z,id]=it.split(':');
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:VW,height:VH},init:{'storyworld.r790.npc':'{"on":false}'}});await go(p,z);
const before=await p.evaluate(()=>room.enemies.map(e=>({id:e.nativeId,name:e.name,path:String(e.path||'').split('/').pop(),boss:!!e.boss,hp:e.hp})));
const ok=await p.evaluate(id=>{const e=room.enemies.find(x=>x.nativeId===id);if(!e)return false;room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
 for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.x=player.x+3;e.y=player.y-1.5;window.__W={e,t:null,vx:0,mode:'idle',L:null};
 const FX=/r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|blood|flame|r572|r571|dissol|burn|smoke|ink-bleed|r106fx|ember|ash|spark|glow/i;
 const de=drawEnemy;drawEnemy=function(x,...a){const W=window.__W;if(W&&x===W.e){if(W.mode==='walk'){const t=time,dt=Math.max(0,Math.min(.1,t-(W.t??t)));W.t=t;x.x+=W.vx*dt;x.attack=null;x.cd=99;}else if(W.mode==='idle'||W.mode==='hit'){x.attack=null;x.cd=99;}}
  const c=ctx,s0=c.commands.length;const r=de.call(this,x,...a);if(W&&x===W.e){const all=c.commands.slice(s0);W.all=all.filter(k=>k?.kind==='image').map(k=>String(k.sourcePath||'').split('/').pop().slice(0,60));W.L=all.filter(k=>k?.kind==='image'&&Array.isArray(k.points)&&!FX.test(String(k.sourcePath||'')));
   W.nan=all.some(k=>Array.isArray(k?.points)&&k.points.some(q=>!Number.isFinite(q[0])||!Number.isFinite(q[1])));}return r;};
 window.__rd=()=>{const W=window.__W,L=W.L||[];W.L=null;if(!L.length)return null;let best=null,ba=0;for(const k of L){const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1]));if(ar>ba){ba=ar;best=k;}}
  const P=best.points,ys=P.map(q=>q[1]),xs=P.map(q=>q[0]);return {src:String(best.sourcePath||'').replace(/^.*\/m0\//,''),sr:(best.sourceRect||[]).map(Math.round).join(','),top:Math.min(...ys),bot:Math.max(...ys),l:Math.min(...xs),r:Math.max(...xs),h:Math.max(...ys)-Math.min(...ys),
   flip:P[1][0]<P[0][0],alpha:best.alpha,att:!!W.e.attack,atk:W.e.attack?.type||W.e.attack?.kind||null,phase:W.e.phase,enr:!!(W.e.enragedR205||W.e.r205Enraged||W.e.berserk),hp:+(W.e.hp/W.e.maxHp).toFixed(2),n:L.length,nan:!!W.nan,others:W.all.length,px:+W.e.x.toFixed(2),pl:+player.x.toFixed(2)};};
 return true;},id);
if(!ok){console.log(id,'보스 없음',JSON.stringify(before));await b.close();process.exit(0);}
const rows=[];const seen=new Set();
async function run(mode,vx,n,step=.07){await p.evaluate(([m,v])=>{const W=window.__W;W.mode=m;W.vx=v;W.t=null;if(m==='fight'){W.e.cd=0;}},[mode,vx]);
 for(let i=0;i<n;i++){const t0=await p.evaluate(()=>time);
  if(mode==='hit')await p.evaluate(()=>{const e=window.__W.e;if(e.hp>e.maxHp*.05)hitEnemy(e,Math.max(1,e.maxHp*.002));});
  await p.waitForFunction(([t,s])=>time>t+s,[t0,step],{timeout:20000}).catch(()=>{});const r=await p.evaluate(()=>window.__rd());if(!r)continue;r.mode=mode;rows.push(r);
  const key=r.src.replace(/:\d+:enemy$/,'')+'#'+r.sr+'#'+mode;const k2=r.src.replace(/:\d+:enemy$/,'').split(':')[0];if(!seen.has(k2)&&seen.size<16){seen.add(k2);const pad=50;const x=Math.max(0,Math.min(VW-20,r.l-pad)),y=Math.max(0,Math.min(VH-20,r.top-pad));
   await p.screenshot({path:`${out}/${id}-${seen.size}-${mode}.png`,clip:{x,y,width:Math.max(20,Math.min(VW-x,r.r-r.l+pad*2)),height:Math.max(20,Math.min(VH-y,r.h+pad*2))}}).catch(()=>{});r.shot=seen.size;}}}
await run('idle',0,15);await run('walk',-1.2,20);await run('walk',1.2,20);await run('fight',0,45,.1);await run('hit',0,12);
await p.evaluate(()=>{const e=window.__W.e;e.hp=e.maxHp*.31;hitEnemy(e,e.maxHp*.02);});
await run('idle',0,8);await run('walk',1.2,12);await run('fight',0,30,.1);
const after=await p.evaluate(()=>room.enemies.filter(e=>e.hp>0).map(e=>({id:e.nativeId,name:e.name,path:String(e.path||'').split('/').pop(),boss:!!e.boss,summoned:!!(e.summoned||e.summonedBy||e.r61Summon)})));
fs.writeFileSync(`${out}/${id}.json`,JSON.stringify({zone:z,id,before,after,rows}));
const g={};for(const r of rows){const k=r.src.replace(/:\d+:enemy$/,'').split('/').pop()+'#'+r.sr;(g[k]??=[]).push(r);}
console.log('==',id,z,'samples',rows.length,'NaN',rows.filter(r=>r.nan).length);
for(const [k,v] of Object.entries(g))console.log(k.slice(0,100),'n='+v.length,'h='+Math.round(Math.min(...v.map(x=>x.h)))+'~'+Math.round(Math.max(...v.map(x=>x.h))),'bot='+Math.round(Math.min(...v.map(x=>x.bot)))+'~'+Math.round(Math.max(...v.map(x=>x.bot))),[...new Set(v.map(x=>x.mode))].join('/'),'flip',[...new Set(v.map(x=>x.flip))].join(),'enr',[...new Set(v.map(x=>x.enr))].join(),'shot',v.find(x=>x.shot)?.shot);
console.log('after',JSON.stringify(after).slice(0,1500));
await b.close();
