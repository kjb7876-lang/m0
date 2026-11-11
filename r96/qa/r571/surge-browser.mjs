// R571 브라우저 검사(헤드리스, 소프트웨어 렌더링): 실제 빌드에서 사몽 발현 전·중·후 Q/W 재사용 대기, 확률, 스킬 거리 읽기,
// 오라 화면, 스킬 난사 때 프레임 시간을 잰다. GPU·실기기·자연 플레이는 아님.
import {chromium,boot,skip} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.env.SW_OUT||'/tmp/r571';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.evaluate(()=>enterRegion('dist01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);
const r=await p.evaluate(async()=>{const S=window.__STORYWORLD_SAMONG_SURGE_R571__,G=window.__STORYWORLD_GROWTH_R103__,W=window.__STORYWORLD_WER__;
 const wait=s=>new Promise(res=>{const t0=time;const f=()=>time>=t0+s?res():setTimeout(f,30);f();});
 player.hp=player.maxHp=99999;for(const e of room.enemies){e.damage=0;}room.engaged=true;
 const out={};const reset=()=>{player.specialCD=0;player.blinkCD=0;if(player.storyWER)player.storyWER.ready={};};
 const measure=async tag=>{reset();await wait(.05);special();await wait(.02);const q=player.specialCD;W.cast('w');await wait(.02);const w=(player.storyWER?.ready?.[player.hero+':w']??time)-time;
  const ch=[1,3,7].map(l=>G.procChance(l));let hy=null;delay(0,()=>{hy=Math.hypot(3,4);},'story-wer:probe');await wait(.05);return{tag,samong:player.samong,q:+q.toFixed(3),w:+w.toFixed(3),chance:ch.map(v=>+v.toFixed(4)),skillHypot:hy,plainHypot:Math.hypot(3,4)};};
 out.before=await measure('before');
 player.samong=0;player.samongCD=0;const ok=awaken('story');await wait(.1);out.awaken=ok;out.during=await measure('during');
 out.double=awaken('seven');
 // 자동 끝: 사몽 시간을 짧게 해 끝까지 기다린다
 player.samong=.3;await wait(.6);out.after=await measure('after');out.inspect=S.inspect();return out;});
console.log(JSON.stringify(r,null,1));
// 오라 화면(영웅별) — 시간을 거의 멈춰 한 순간을 찍는다
const shots=[];
for(const hero of ['hwando','slayer','neon','michaela','seoha','lauren','hunter','gunner']){
 const ok=await p.evaluate(async h=>{try{if(window.__STORYWORLD_HERO_SELECT_R263__?.pick)window.__STORYWORLD_HERO_SELECT_R263__.pick(h);else player.hero=h;}catch(_){player.hero=h;}
  player.samong=6;player.samongCD=50;const t0=time;await new Promise(res=>{const f=()=>time>=t0+.5?res():setTimeout(f,30);f();});return player.hero;},hero);
 const f=OUT+'/aura-'+hero+'.png';await p.screenshot({path:f,clip:{x:440,y:160,width:400,height:400}});shots.push({hero,got:ok,f});}
await p.evaluate(()=>{player.samong=0;});await p.waitForTimeout(400);await p.screenshot({path:OUT+'/aura-off.png',clip:{x:440,y:160,width:400,height:400}});
// 프레임 시간: 같은 방에서 Q·W·E·R 를 계속 누를 때(사몽 밖 vs 사몽 중)
const perf=await p.evaluate(async()=>{const W=window.__STORYWORLD_WER__;
 const run=async(on,ms)=>{player.samong=on?60:0;player.samongCD=90;const fr=[];let last=performance.now(),stop=false;const loop=t=>{fr.push(t-last);last=t;if(!stop)requestAnimationFrame(loop);};requestAnimationFrame(loop);
  const t0=performance.now(),g0=time;let casts=0;while(performance.now()-t0<ms){if(special()!==false)casts++;for(const s of ['w','e','r'])if(W.cast(s))casts++;await new Promise(r=>setTimeout(r,50));}
  stop=true;fr.sort((a,b)=>a-b);const avg=fr.reduce((a,b)=>a+b,0)/fr.length;return{on,frames:fr.length,avgMs:+avg.toFixed(1),p95Ms:+fr[Math.floor(fr.length*.95)].toFixed(1),gameSeconds:+(time-g0).toFixed(2),projectiles:projectiles.length,casts};};
 return[await run(false,8000),await run(true,8000)];});
console.log(JSON.stringify({perf,shots,errors:errs.slice(0,8)},null,1));
await b.close();
