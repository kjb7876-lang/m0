// R1238 조사: 천사의 가면과 의목사 후보생(ep1a11) 보스 문 앞에서 네온 우측 걷기·서기 그림을 drawHero 마다 기록
import fs from 'node:fs';import {boot,startStory,goZone,gameWait} from '../r1016/lib.mjs';
const ZONE=process.env.ZONE||'ep1a11',HERO=process.env.HERO||'neon',OUT=process.env.OUT||'/tmp/r1238-probe.json',SHOTS=process.env.SHOTS||'';
const {b,p}=await boot({viewport:{width:640,height:360},init:process.env.S3D?()=>{try{localStorage.removeItem('storyworld.r183.scene3d');}catch(_){}}:null});
await startStory(p);await goZone(p,ZONE);
await p.evaluate(async h=>{loading=true;try{await ensureImages(heroPaths(h));player.hero=h;player.combo=0;player.ego=0;}finally{loading=false;}updateHUD();},HERO);
const spot=await p.evaluate(()=>{const L=window.__STORYWORLD_EXPLORATION__.layout(room.id);const d=(L.worldR74?.doors||[]).find(d=>d.id==='door-0');const W=L.worldWardR81||{},bb=W.bossBounds;
 const cells=L.floorCells||[];const inBoss=c=>bb&&c.x>=bb[0]-1&&c.x<=bb[2]&&c.y>=bb[1]-1&&c.y<=bb[3];let best=null;
 for(const q of cells){const c=Array.isArray(q)?{x:q[0],y:q[1]}:q;const x=c.x+.5,y=c.y+.5,dd=Math.hypot(x-d.x,y-d.y);if(dd<2.5||dd>5||inBoss(c))continue;let room3=true;for(let k=-2;k<=1;k++)if(!cells.some(r=>(r[0]??r.x)===c.x+k&&(r[1]??r.y)===c.y))room3=false;if(!room3)continue;if(!best||dd<best.dd)best={x,y,dd};}
 for(const e of room.enemies||[])if(e.hp>0){Object.defineProperty(e,'hp',{get:()=>1e9,set:()=>{},configurable:true});e.speed=0;e.x+=200;e.homeX=(e.homeX||0)+200;}
 return {door:{x:d.x,y:d.y},boss:bb,best,ncell:cells.length};});
console.log(JSON.stringify(spot));
await p.evaluate(s=>{player.x=s.best.x-1.5;player.y=s.best.y;guide=false;auto=false;},spot);
await p.evaluate(()=>{window.__R1238=[];const base=drawHero;drawHero=function(...a){const P=player;if(!P||P.r720Ally||!Array.isArray(ctx.commands))return base.apply(this,a);const st=ctx.commands.length;const r=base.apply(this,a);
 const cs=[];for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero')continue;const ys=(c.points||[]).map(q=>q[1]),xs=(c.points||[]).map(q=>q[0]);
  cs.push({src:String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,'').split('?')[0],sr:(c.sourceRect||[]).map(Math.round),h:Math.round(Math.max(...ys)-Math.min(...ys)),flip:xs.length?(c.points[1][0]<c.points[0][0]):null,a:+(c.style?.globalAlpha??c.alpha??1).toFixed(2),f:c.style?.filter||'',ready:!!(c.image&&(c.image.complete!==false)&&(c.image.naturalWidth||c.image.width))});}
 window.__R1238.push({t:+time.toFixed(3),mv:!!P.moving,face:P.facing??P.dir??P.direction,x:+P.x.toFixed(2),y:+P.y.toFixed(2),aa:+(P.attackAnim||0).toFixed(2),cs});return r;};});
const steps=process.env.STEPS?JSON.parse(process.env.STEPS):[['idle0',null,1.5],['right','ArrowRight',2.5],['idleR',null,2.5],['left','ArrowLeft',1.5],['right2','ArrowRight',1.5],['idleR2',null,2]];const NS=+process.env.NSHOT||4;
let n=0;for(const [name,k,s] of steps){await p.evaluate(nm=>window.__R1238.push({mark:nm}),name);if(k)await p.keyboard.down(k);
 if(SHOTS){const t0=await p.evaluate(()=>time);for(let i=0;i<NS;i++){await gameWait(p,s/NS,300000);await p.screenshot({path:`${SHOTS}/${String(n++).padStart(3,'0')}-${name}.png`,clip:{x:200,y:60,width:240,height:180}});}}else await gameWait(p,s,300000);
 if(k)await p.keyboard.up(k);}
const rows=await p.evaluate(()=>window.__R1238);fs.writeFileSync(OUT,JSON.stringify({spot,rows,errors:p.errors}));
console.log('rows',rows.length,'errors',p.errors.length);await b.close();
