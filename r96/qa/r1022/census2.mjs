// R1022 전수 조사 2: 자동 발동(오토·A키 오토·길잡이) 중 영웅 본체가 한 번에 0.8칸 넘게 옮겨지는 곳을 호출 위치와 함께 모은다.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});await go(p,process.env.Z||'murder01');
const heroes=(process.env.HEROES||'').split(',').filter(Boolean);const all=heroes.length?heroes:await p.evaluate(()=>Object.keys(HEROES));
const GT=+(process.env.GT||10);const out={};
await p.evaluate(()=>{const P=player;let x=P.x,y=P.y;window.__jumps=[];const rec=(nx,ny)=>{const d=Math.hypot(nx-x,ny-y);if(d>.8){const st=(new Error().stack||'').split('\n').slice(2,9).map(s=>{const m=s.match(/(?:at )?(\S*) \(?.*\/([^/]+\.(?:js|html)):(\d+):(\d+)/);return m?(m[1]+'@'+m[2]+':'+m[3]):s.trim().slice(0,60)}).join(' < ');(window.__pend=window.__pend||[]).push({hero:P.hero,d:+d.toFixed(2),t:+time.toFixed(2),st});}};
 const tb=tick;tick=function(...a){const sx=x,sy=y;window.__pend=[];const r=tb.apply(this,a);const d=Math.hypot(x-sx,y-sy);if(d>.8)for(const k of window.__pend)window.__jumps.push({...k,net:+d.toFixed(2)});window.__pend=[];return r;};
 Object.defineProperty(P,'x',{get(){return x},set(v){if(Number.isFinite(v)&&Number.isFinite(y))rec(v,y);x=v},configurable:true,enumerable:true});
 Object.defineProperty(P,'y',{get(){return y},set(v){if(Number.isFinite(v)&&Number.isFinite(x))rec(x,v);y=v},configurable:true,enumerable:true});});
for(const h of all){
  const r=await p.evaluate(async([h,GT])=>{if(typeof ensureImages==='function'&&typeof heroPaths==='function')await ensureImages(heroPaths(h));player.hero=h;window.__jumps=[];const W=window.__STORYWORLD_WER__,n0=W.inspect().casts.length;
    const fx=player.x,fy=player.y;auto=true;try{guide=false}catch(_){}
    const t0=time;await new Promise(res=>{const st=performance.now();const f=()=>{for(let i=0;i<30&&storyScene;i++)advanceScene();if(modal)closePanel(true);
      player.hp=Math.max(player.hp,(player.maxHp||200)*.3);
      const foes=liveEnemies();foes.forEach((e,i)=>{e.hp=Math.max(e.hp,3000);if(Math.hypot(e.x-player.x,e.y-player.y)>9){const a=i*2.4;e.x=player.x+Math.cos(a)*(3+i%4);e.y=player.y+Math.sin(a)*(3+i%4);}});
      if(time-t0>GT||performance.now()-st>240000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
    auto=false;const j=window.__jumps;const by={};for(const k of j){const key=k.st;(by[key]=by[key]||{n:0,max:0,ex:k.st});by[key].n++;by[key].max=Math.max(by[key].max,k.d);}
    return {casts:W.inspect().casts.slice(n0).map(c=>c.slot).join(''),dances:(()=>{try{return JSON.stringify(window.__STORYWORLD_DANCE_FREE_R706__.stats())}catch(_){return ''}})(),gt:+(time-t0).toFixed(1),n:j.length,by:Object.values(by).sort((a,b)=>b.n-a.n).slice(0,8)};},[h,GT]);
  out[h]=r;console.log('##',h,'gt',r.gt,'jumps',r.n,'casts',r.casts,r.dances);for(const x of r.by)console.log('   ',x.n,'max',x.max,x.ex.slice(0,330));
}
await b.close();
