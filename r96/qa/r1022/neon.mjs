import {chromium,boot,skip,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});await go(p,'murder01');
await p.evaluate(()=>{const base=hitEnemy;window.__hits=[];hitEnemy=function(e,v,s){const h0=e?.hp;const r=base.apply(this,arguments);if(e&&e.__probe)window.__hits.push({t:+time.toFixed(2),d:+(h0-e.hp).toFixed(1),src:s?(s.storyWER?'WER:'+s.sourceSlot:(s.owner||s.type||s.kind||s.id||Object.keys(s).slice(0,5).join('|'))):'none',stack:(new Error().stack||'').split('\n').slice(2,6).map(x=>(x.match(/([^/]+\.(?:js|html)):(\d+)/)||[])[0]).join('<')});return r;};});
for(const mode of ['on','off','on','off','on','off']){
 const r=await p.evaluate(async mode=>{await ensureImages(heroPaths('neon'));player.hero='neon';window.__STORYWORLD_AUTO_MOVE_R1022__.set(mode==='on');auto=false;
  player.hp=Math.max(player.hp,200);player.invincible=3;const L=liveEnemies();const e=L[0];for(const f of L.slice(1)){f.x=player.x+30;f.y=player.y+30;f.speed=0;}
  e.x=player.x+2.4;e.y=player.y;e.speed=0;e.hp=e.maxHp=4000;e.__probe=true;window.__hits=[];if(player.storyWER)player.storyWER.ready={};const x0=player.x,y0=player.y;
  window.__STORYWORLD_WER__.cast('e',true);await new Promise(res=>{const t0=time;const f=()=>{if(time-t0>=2)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
  e.__probe=false;player.x=x0;player.y=y0;const hpLoss=4000-e.hp;const by={};for(const h of window.__hits){const k=h.src+' '+h.stack;by[k]=(by[k]||0)+h.d;}return {mode,hpLoss,total:window.__hits.reduce((a,h)=>a+h.d,0),by};},mode);
 console.log(JSON.stringify(r));}
await b.close();
