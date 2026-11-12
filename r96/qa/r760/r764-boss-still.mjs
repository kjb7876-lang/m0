// R764 헤드리스: 보스는 늘 쫓고 때려서 서 있는 순간이 드물다 → 그리는 동안만 공격·걸음을 멈춘 채(자리 고정) 2페이즈 대기(idle2)·2단계 피격(hit2)이 실제 렌더러로 그려지는지 찍는다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r760/r764-boss-still.mjs <outdir>
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const wait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:120000}).catch(()=>{});};
await go(p,'last303');
await p.evaluate(()=>{const B=room.enemies.find(e=>e.boss&&!e.midboss);for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';player.x+=3;player.y+=1;const X=player.x-2.6,Y=player.y-2.6;
 player.hp=player.maxHp=1e9;player.invincible=1e9;window.__B=B;window.__S=[];B.hp=B.maxHp*.45;
 const de=drawEnemy;drawEnemy=function(e,...a){if(e!==B)return de.call(this,e,...a);e.x=X;e.y=Y;const A=e.attack,st=e.state;e.attack=null;if(e.state==='attack')e.state='idle';const s0=ctx.commands.length;
  try{return de.call(this,e,...a);}finally{e.attack=A;e.state=st;const k=ctx.commands.slice(s0).filter(k=>k.kind==='image'&&k.owner?.kind==='enemy'&&!k.r760Ghost).sort((a,b)=>Math.abs(b.points[3][1]-b.points[0][1])-Math.abs(a.points[3][1]-a.points[0][1]))[0];
   if(k)__S.push({t:+time.toFixed(2),hit:e.hitTimer>0,s:String(k.sourcePath).split('/').pop(),f:Math.round(k.sourceRect[0]/512)});}};});
const shot=async n=>{const q=await p.evaluate(()=>{const q=project(__B.x,__B.y);return [q.x,q.y];});const f=`${OUT}/${n}.png`;await p.screenshot({path:f,clip:{x:Math.max(0,q[0]-300),y:Math.max(0,q[1]-420),width:600,height:520}});return f;};
await wait(1.2);const a=await shot('r764-boss-idle2');
await p.evaluate(()=>{hitEnemy(__B,50,{kind:'hero'});});await wait(.1);const h=await shot('r764-boss-hit2');await wait(.6);
const S=await p.evaluate(()=>__S);const cnt={};for(const x of S)cnt[x.s]=(cnt[x.s]||0)+1;
const res={hitFrames:S.filter(x=>x.hit).map(x=>x.s+":"+x.f),counts:cnt,hitSeq:S.filter(x=>/sheet-hit/.test(x.s)).map(x=>x.f).join(''),shots:[a,h],pageErrors:errs};fs.writeFileSync(`${OUT}/r764-boss-still.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res));await b.close();
