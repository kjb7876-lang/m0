// R1022 밸런스 측정: 자동(오토) 플레이 GT 초 동안 켬/끔 총 피해와 영웅이 받은 피해(헤드리스).
import {chromium,boot,skip,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});await go(p,'murder01');
const HER=(process.env.HEROES||'neon,seoha,hunter,hwando').split(','),GT=+(process.env.GT||10),REP=+(process.env.REP||2);
await p.evaluate(()=>{const hb=hurt;window.__taken=0;window.__hurtCalls=0;hurt=function(...a){const h0=player.hp,s0=player.shield||0;window.__hurtCalls++;const r=hb.apply(this,a);window.__taken+=Math.max(0,h0-player.hp)+Math.max(0,s0-(player.shield||0));return r;};});
const out={};
for(const h of HER)for(let k=0;k<REP;k++)for(const mode of ['on','off']){
 const r=await p.evaluate(async([h,mode,GT])=>{await ensureImages(heroPaths(h));player.hero=h;window.__STORYWORLD_AUTO_MOVE_R1022__.set(mode==='on');
  const L=liveEnemies();const ring=L.slice(0,4);for(const f of L.slice(4)){f.x=player.x+40;f.y=player.y+40;f.speed=0;}
  const x0=player.x,y0=player.y;ring.forEach((e,i)=>{const a=i*1.57;e.x=x0+Math.cos(a)*3;e.y=y0+Math.sin(a)*3;e.hp=e.maxHp=60000;});
  if(player.storyWER)player.storyWER.ready={};player.hp=777;player.invincible=0;player.shield=0;window.__taken=0;window.__hurtCalls=0;auto=true;
  await new Promise(res=>{const t0=time,st=performance.now();const f=()=>{for(let i=0;i<30&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hp=777;if(time-t0>=GT||performance.now()-st>200000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
  auto=false;const dmg=ring.reduce((a,e)=>a+(60000-Math.max(0,e.hp)),0);const r={dmg:Math.round(dmg),taken:Math.round(window.__taken),hurtCalls:window.__hurtCalls,casts:window.__STORYWORLD_WER__.inspect().casts.filter(c=>c.at>time-GT).map(c=>c.slot).join('')};
  player.x=x0;player.y=y0;player.hp=player.maxHp||777;return r;},[h,mode,GT]);
 (out[h]=out[h]||{on:[],off:[]})[mode].push(r);console.log(h,mode,JSON.stringify(r));}
for(const [h,v] of Object.entries(out)){const s=(a,k)=>a.reduce((x,y)=>x+y[k],0);console.log('SUM',h,'dmg off/on',(s(v.off,'dmg')/s(v.on,'dmg')).toFixed(3),'taken off/on',(s(v.off,'taken')/Math.max(1,s(v.on,'taken'))).toFixed(3));}
await b.close();
