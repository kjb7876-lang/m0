// R1022 전수 조사: 영웅마다 스킬 키를 하나씩 눌러, 방향키 없이 영웅 본체가 얼마나 옮겨지는지(게임 시간 기준) 잰다.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
await go(p,'murder01');const heroes=await p.evaluate(()=>Object.keys(HEROES));console.log('heroes',heroes.join(','));
const KEYS=(process.env.KEYS||'a,s,d,f,q,w,e,r,t').split(',');const out=[];
for(const h of heroes){
  await p.evaluate(async h=>{if(typeof ensureImages==='function'&&typeof heroPaths==='function')await ensureImages(heroPaths(h));player.hero=h;},h);
  for(const k of KEYS){
    const r=await p.evaluate(async([k])=>{for(let i=0;i<50&&storyScene;i++)advanceScene();if(modal)closePanel(true);
      const R=room;player.hp=player.maxHp||player.hp||100;player.invincible=2;
      for(const c of ['blinkCD','specialCD','egoCD','guardCD','attackCD'])if(c in player)player[c]=0;
      try{for(const s of Object.values(window.__STORYWORLD_SKILLS_CD__||{}))s.cd=0}catch(_){}
      const foes=liveEnemies();if(!foes.length)return {k,skip:'no foe'};
      const e=foes[0];e.x=player.x+2.6;e.y=player.y;e.speed=0;e.hp=Math.max(e.hp,5000);
      for(const f of foes.slice(1)){f.x=player.x+40;f.y=player.y+40;}
      const x0=player.x,y0=player.y;let max=0,t0=time;
      document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
      await new Promise(res=>{const st=performance.now();const f=()=>{max=Math.max(max,Math.hypot(player.x-x0,player.y-y0));if(time-t0>1.6||performance.now()-st>25000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
      document.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));
      const res={k,max:+max.toFixed(2),end:+Math.hypot(player.x-x0,player.y-y0).toFixed(2),gt:+(time-t0).toFixed(2)};player.x=x0;player.y=y0;return res;},[k]);
    out.push({h,...r});console.log(h,JSON.stringify(r));
  }
}
console.log('JSON',JSON.stringify(out));await b.close();
