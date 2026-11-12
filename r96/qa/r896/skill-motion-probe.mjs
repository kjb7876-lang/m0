// R896 스킬 시전 몸 동작 탐침: 영웅마다 Q(special)·W·E·R 을 서 있는 상태에서 하나씩 쓰고,
// 시전 뒤 0.45초(게임 시간) 동안 drawHero 가 그린 몸 그림(경로·칸)을 적는다. 시전 직전 0.3초 대기 그림과 비교한다.
// 실행: SW_URL=… node skill-motion-probe.mjs <out.json> [heroes,comma]
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const [,,out='skill-motion.json',hs='hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner']=process.argv;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});await go(p,process.env.ZONE||'dist01');await p.waitForTimeout(2000);
await p.evaluate(()=>{
 const FX=/r251\/atlas|pixelfx|\/fx\/|vfx|effect|ring|circle|sigil|shadow|aura|barrier/i;
 window.__rec=[];window.__on=false;
 const dh=drawHero;drawHero=function(...a){const c=ctx,st=Array.isArray(c?.commands)?c.commands.length:-1;const r=dh.apply(this,a);
  if(window.__on&&st>=0){let best=null,bh=0;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.owner?.kind!=='hero')continue;const s=String(k.sourcePath||k.image?.src||'');if(FX.test(s))continue;const hh=Math.abs(k.points[3][1]-k.points[0][1]);if(hh>bh){bh=hh;best=k;}}
   window.__rec.push({t:+time.toFixed(4),ph:window.__phase,at:+(+player.attackAnim||0).toFixed(3),sk:+(+player.skillAnim||0).toFixed(3),ul:+(+player.ultimateAnim||0).toFixed(3),
    b:best?{s:String(best.sourcePath||best.image?.src||'').replace(/^.*?(assets\/)/,'$1').replace(/^blob:.*/,'blob').split('?')[0],sx:best.sourceRect?Math.round(best.sourceRect[0]):null,sy:best.sourceRect?Math.round(best.sourceRect[1]):null}:null});}
  return r;};
 const tb=tick;tick=function(dt,...a){const r=tb.call(this,dt,...a);try{window.__ctl?.(dt);}catch(err){window.__ctlErr=String(err).slice(0,200);}return r;};
});
const res={};
for(const hero of hs.split(',')){
 await p.evaluate(async h=>{loading=true;try{await ensureImages(heroPaths(h));}finally{loading=false;}player.hero=h;player.combo=0;player.direction='front';player.hp=99999;window.__rec=[];},hero);
 await p.waitForTimeout(4000);
 await p.evaluate(GAP=>{
  const keep=room.enemies.filter(e=>e.hp>0);for(const e of keep.slice(1))e.hp=0;
  const e=keep[0];if(!e)throw new Error('no enemy');e.hp=1e9;e.maxHp=1e9;e.speed=0;e.damage=0;e.spawnState='active';e.visible=true;
  const put=()=>{e.x=player.x+2.2;e.y=player.y-2.2;e.cd=99;e.attack=null;};
  window.__STORYWORLD_GUNNER_ARMS_R561__?.set?.({chain:false});// 거너 Q→W→E 자동 연계는 슬롯마다 따로 재려고 끈다
  const ready=()=>{put();player.specialCD=0;player.attackCD=0;player.attackAnim=0;player.skillAnim=0;player.ultimateAnim=0;{const R=player.storyWER?.ready;if(R)for(const k in R)if(!(R[k]>time+1e5))R[k]=0;}};
  const W=s=>()=>{ready();window.__castOk=window.__STORYWORLD_WER__?.cast(s,false);if(!window.__castOk){const G=window.__STORYWORLD_GUNNER_ARMS_R561__;window.__why=(window.__why||[]).concat([{s,ego:!!window.__STORYWORLD_EGO151__?.inspect?.().state?.active,g:G?.inspect?.(),dir:G?.fire?.(s,false),ready:JSON.stringify(player.storyWER?.ready)}]);}};
  const T=[];let t=0;
  for(const [slot,fn] of [['q',()=>{ready();const cd=player.specialCD;special();window.__castOk=player.specialCD>cd;}],['w',W('w')],['e',W('e')],['r',W('r')]]){
   T.push([t,'idle-'+slot,ready]);T.push([t+.3,'cast-'+slot,fn]);T.push([t+1.3,'after-'+slot,()=>{window.__casts.push([slot,window.__castOk]);}]);t+=GAP;}
  T.push([t,'end',()=>{window.__on=false;}]);
  window.__casts=[];let t0=null,i=0;window.__phase='start';window.__on=true;
  window.__ctl=()=>{for(const o of room.enemies)if(o!==e&&o.hp>0){o.visible=false;o.x=e.x+60;o.y=e.y+60;}e.speed=0;if(t0==null)t0=time;const tt=time-t0;while(i<T.length&&tt>=T[i][0]){window.__phase=T[i][1];T[i][2]();i++;}if(i>=T.length)window.__ctl=null;};
 },+(process.env.GAP||1.6));
 await p.waitForFunction(()=>!window.__on,null,{timeout:400000,polling:500});
 res[hero]=await p.evaluate(()=>(window.__STORYWORLD_GUNNER_ARMS_R561__?.set?.({chain:true}),{rec:window.__rec,casts:window.__casts,err:window.__ctlErr||null,why:window.__why||null}));
 console.log(hero,JSON.stringify(res[hero].why)?.slice(0,1500),res[hero].rec.length,JSON.stringify(res[hero].casts),res[hero].err);
}
fs.writeFileSync(out,JSON.stringify(res));await b.close();
