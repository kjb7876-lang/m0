// R1243 보스 키 튐 재현: 걷기·전투 동안 프레임마다 몸 그림(경로·칸)·화면 키·발 줄 기록, 그림마다 장면 1장. node hprobe.mjs <출력폴더> 지역:id [VW]
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const [out,it]=[process.argv[2],process.argv[3]];const VW=+(process.argv[4]||1280),VH=Math.round(VW*9/16);fs.mkdirSync(out,{recursive:true});const [z,id]=it.split(':');
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:VW,height:VH},init:{'storyworld.r790.npc':'{"on":false}'}});await go(p,z);
await p.evaluate(id=>{const e=room.enemies.find(x=>x.nativeId===id);room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
 for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.x=player.x+3;e.y=player.y-2;window.__W={e,t:null,vx:0,walk:false};
 const FX=/r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|blood|flame|r572|r571|dissol|burn|smoke|ink-bleed|r106fx/i;
 const de=drawEnemy;drawEnemy=function(x,...a){const W=window.__W;if(W&&x===W.e&&W.walk){const t=time,dt=Math.max(0,Math.min(.1,t-(W.t??t)));W.t=t;x.x+=W.vx*dt;x.attack=null;x.cd=99;}
  const c=ctx,s0=c.commands.length;const r=de.call(this,x,...a);if(W&&x===W.e)W.L=c.commands.slice(s0).filter(k=>k?.kind==='image'&&Array.isArray(k.points)&&!FX.test(String(k.sourcePath||'')));return r;};
 window.__rd=()=>{const W=window.__W,L=W.L||[];W.L=null;if(!L.length)return null;let best=null,ba=0;for(const k of L){const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1]));if(ar>ba){ba=ar;best=k;}}
  const P=best.points,ys=P.map(q=>q[1]),xs=P.map(q=>q[0]);return {src:String(best.sourcePath||'').replace(/^.*\/m0\//,''),sr:(best.sourceRect||[]).map(Math.round).join(','),top:Math.min(...ys),bot:Math.max(...ys),l:Math.min(...xs),r:Math.max(...xs),h:Math.max(...ys)-Math.min(...ys),st:W.e.state,att:!!W.e.attack,tag:best.r974||best.r1029||null,n:L.length};};},id);
const rows=[];const seen=new Set();
async function run(walk,vx,n){await p.evaluate(([w,v])=>{const W=window.__W;W.walk=w;W.vx=v;W.t=null;if(!w){W.e.cd=0;}},[walk,vx]);
 for(let i=0;i<n;i++){const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.07,t0,{timeout:15000}).catch(()=>{});const r=await p.evaluate(()=>window.__rd());if(!r)continue;r.mode=walk?'walk':'fight';rows.push(r);
  const key=r.src.replace(/:\d+:enemy$/,'')+'#'+r.sr;if(!seen.has(key)&&seen.size<12){seen.add(key);const pad=40;await p.screenshot({path:`${out}/${id}-${seen.size}.png`,clip:{x:Math.max(0,r.l-pad),y:Math.max(0,r.top-pad),width:Math.min(VW-Math.max(0,r.l-pad),r.r-r.l+pad*2),height:Math.min(VH-Math.max(0,r.top-pad),r.h+pad*2)}}).catch(()=>{});r.shot=seen.size;}}}
await run(true,-1.2,25);await run(true,1.2,25);await run(false,0,40);
fs.writeFileSync(`${out}/${id}.json`,JSON.stringify(rows));
const g={};for(const r of rows){const k=r.src.replace(/:\d+:enemy$/,'').split('/').pop()+'#'+r.sr;(g[k]??=[]).push(r);}
for(const [k,v] of Object.entries(g))console.log(k.slice(0,90),'n='+v.length,'h='+Math.round(Math.min(...v.map(x=>x.h)))+'~'+Math.round(Math.max(...v.map(x=>x.h))),'bot='+Math.round(v[0].bot),v.map(x=>x.mode[0]+(x.att?'A':'')).join('').slice(0,30),'shot',v.find(x=>x.shot)?.shot);
await b.close();
