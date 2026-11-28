// R1377: 공격 그림을 그리는 순간 몹 상태값(어느 신호로 공격 자세가 나오는지) 찾기. 사용: node probe-atk.mjs zone nativeId
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [z,id]=process.argv.slice(2);const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}','storyworld.r1377.dirArt':'{"on":false}'}});
await go(p,z);await skip(p);
await p.evaluate(id=>{const e=room.enemies.find(q=>q.nativeId===id);for(const q of room.enemies)if(q!==e)q.hp=0;player.hp=player.maxHp=1e9;e.hp=e.maxHp=1e8;e.engaged=true;e.spawnState='active';
 window.__P={e,log:[]};const seen=new WeakSet();
 const wr=o=>{if(!o||typeof o.ensureHospitalVisual!=='function'||o.ensureHospitalVisual.__pp)return;const base=o.ensureHospitalVisual;const w=function(frame){try{const c=frame?.commands;if(Array.isArray(c)&&!seen.has(c)){seen.add(c);
  let best=null;for(const k of c){if(k?.kind==='image'&&String(k.owner?.id||'')==='enemy:'+e.id){const h=Math.abs(k.points?.[2]?.[1]-k.points?.[0]?.[1])||0;if(!best||h>best.h)best={h,src:String(k.sourcePath||'').split('/').pop()+':'+(k.sourceRect||[]).map(Math.round).join(',')};}}
  const f={};for(const [k,v] of Object.entries(e)){if(!/^(x|y|hp|stateAge|vx|vy|z)$/.test(k)&&(typeof v==='number'||typeof v==='string'||typeof v==='boolean'))f[k]=typeof v==='number'?Math.round(v*100)/100:v;if(k==='attack'&&v)f.attack=JSON.stringify(v).slice(0,120);}
  window.__P.log.push({t:Math.round(time*100)/100,src:best?.src,f});}}catch(_){}return base.apply(this,arguments);};w.__pp=1;o.ensureHospitalVisual=w;};
 const hook=()=>{try{const h=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(h){wr(Object.getPrototypeOf(h));if(Object.prototype.hasOwnProperty.call(h,'ensureHospitalVisual'))wr(h);}}catch(_){}requestAnimationFrame(hook);};hook();
 const ctl=()=>{e.x=player.x+1.6;e.y=player.y;if(e.attackCooldown>1)e.attackCooldown=0;if(e.cooldown>1)e.cooldown=0;requestAnimationFrame(ctl);};ctl();},id);
const t0=await p.evaluate(()=>time);for(let i=0;i<400;i++){await skip(p);if(await p.evaluate(t=>time>t+10,t0))break;await p.waitForTimeout(150);}
const L=await p.evaluate(()=>window.__P.log);const by={};for(const r of L){const k=r.src||'none';(by[k]=by[k]||[]).push(r);}
const isA=r=>/attack/.test(r.src||'');const A=L.filter(isA),N=L.filter(r=>!isA(r));console.log('attack frames',A.length,'other',N.length);
const keys=new Set(L.flatMap(r=>Object.keys(r.f)));for(const k of keys){const va=new Set(A.map(r=>String(r.f[k]))),vn=new Set(N.map(r=>String(r.f[k])));const fa=A.filter(r=>r.f[k]&&r.f[k]!=='0').length/Math.max(1,A.length),fn=N.filter(r=>r.f[k]&&r.f[k]!=='0').length/Math.max(1,N.length);if(Math.abs(fa-fn)>.4)console.log(k,'attackTruthy',fa.toFixed(2),'otherTruthy',fn.toFixed(2),[...va].slice(0,5).join(','));}
for(const r of A.slice(0,3))console.log(JSON.stringify(r).slice(0,1500));
await b.close();
