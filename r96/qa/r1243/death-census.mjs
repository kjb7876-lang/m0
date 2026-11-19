// R1243 보스·중간보스 사망 그림 전수: 살아 있을 때 마지막 몸 그림과, 죽은 뒤 1.3초(게임 시간) 동안 사망 연출이 그린 몸 그림을 비교한다.
//  node death-census.mjs <출력폴더> 지역:id …   (맘몬 ep1b06·ep1b06b 는 넣지 않는다)
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2];fs.mkdirSync(out,{recursive:true});const items=process.argv.slice(3);
const FX=String.raw`r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|blood|flame|fire|ember|r572|r571|smoke|ink-bleed|r106fx|burn|ash|spark|r411|core24|glow|light`;
const b=await chromium.launch();let pg=null;const rows=[];
async function fresh(){if(pg)await pg.context().close().catch(()=>{});const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}'}});pg=p;}
await fresh();
for(const it of items){const [z,id]=it.split(':');const row={zone:z,id};rows.push(row);
 try{await go(pg,z);
  const ok=await pg.evaluate(([id,FXS])=>{const FX=new RegExp(FXS,'i');const e=room.enemies.find(x=>x.nativeId===id);if(!e)return false;room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
   for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.x=player.x+2.5;e.y=player.y-1.5;e.speed=0;
   const W=window.__D={e,id:e.id,live:null,death:{},deathDraws:0,box:null};
   const body=(s0)=>{let best=null,bh=0;for(const k of ctx.commands.slice(s0)){if(k?.kind!=='image'||!Array.isArray(k.points))continue;const sp=String(k.sourcePath||'');if(FX.test(sp))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}return best;};
   if(!window.__Dwrapped){window.__Dwrapped=true;const de=drawEnemy;drawEnemy=function(x,...a){const s0=ctx.commands.length;const r=de.call(this,x,...a);const D=window.__D;if(D&&x===D.e){const k=body(s0);if(k){if(x.hp>0)D.live=String(k.sourcePath||'');else D.death[String(k.sourcePath||'')]=(D.death[String(k.sourcePath||'')]||0)+1;const P=k.points;D.box=[Math.min(...P.map(q=>q[0])),Math.min(...P.map(q=>q[1])),Math.max(...P.map(q=>q[0])),Math.max(...P.map(q=>q[1]))];}}return r;};
    if(typeof drawBurnDeath3==='function'){const bd=drawBurnDeath3;drawBurnDeath3=function(a,...r){const s0=ctx.commands.length;const out=bd.call(this,a,...r);const D=window.__D;if(D&&(a?.actorId===D.id||a?.sourceId===D.id)){D.deathDraws++;for(const k of ctx.commands.slice(s0))if(k?.kind==='image'){const sp=String(k.sourcePath||'');D.death[sp]=(D.death[sp]||0)+1;}}return out;};}}
   return true;},[id,FX]);
  if(!ok){row.note='보스 없음';continue;}
  const t0=await pg.evaluate(()=>time);await pg.waitForFunction(t=>time>t+.5,t0,{timeout:30000}).catch(()=>{});
  row.live=await pg.evaluate(()=>window.__D.live);
  await pg.evaluate(()=>{const D=window.__D;D.death={};for(let i=0;i<6&&D.e.hp>0;i++){room.engaged=true;D.e.spawnState='active';D.e.hidden=false;try{D.e.invulnerable=0;D.e.shield=0;}catch(_){}hitEnemy(D.e,D.e.hp+1);}D.deadAt=time;D.fx=(effects||[]).filter(f=>f.actorId===D.id||f.sourceId===D.id).map(f=>f.type+':'+String(f.bodyPath||f.bodyFrame?.path||'').split('/').pop()).slice(0,6);});
  row.dead=await pg.evaluate(()=>!(window.__D.e.hp>0));
  const t1=await pg.evaluate(()=>time);await pg.waitForFunction(t=>time>t+.06,t1,{timeout:30000}).catch(()=>{});
  const bx=await pg.evaluate(()=>window.__D.box);if(bx){const pad=30;const x=Math.max(0,bx[0]-pad),y=Math.max(0,bx[1]-pad);await pg.screenshot({path:`${out}/${id}.png`,clip:{x,y,width:Math.min(640-x,bx[2]-bx[0]+pad*2),height:Math.min(360-y,bx[3]-bx[1]+pad*2)}}).catch(()=>{});row.shot=`${id}.png`;}
  await pg.waitForFunction(t=>time>t+1.3,t1,{timeout:60000}).catch(()=>{});
  Object.assign(row,await pg.evaluate(()=>({fx:window.__D.fx,death:window.__D.death,deathDraws:window.__D.deathDraws,still:room.enemies.includes(window.__D.e)})));
 }catch(err){row.err=String(err.message||err).slice(0,160);try{await fresh();}catch(_){}}
 const short=s=>String(s||'').split('/').pop().slice(0,70);console.log(id,z,'dead='+row.dead,'live='+short(row.live),'deathDraws='+row.deathDraws,'fx=',(row.fx||[]).join(','),'death=',Object.keys(row.death||{}).map(short).join(' | '),row.err||row.note||'');
 fs.writeFileSync(`${out}/death.json`,JSON.stringify(rows,null,1));}
await b.close();
