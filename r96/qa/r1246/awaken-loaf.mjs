// R1246 사몽 각성 렉 분해(헤드리스 소프트웨어 렌더링 — GPU·실기기 아님). 실행: node awaken-loaf.mjs  (SW_URL, HEROES, CINE=1|0, REPS)
//  영웅(형상)마다 그 세션 첫 각성 + 두 번째 각성 뒤 3초 동안 Long Animation Frame(LoAF) 항목을 모아
//  프레임 길이·스타일/레이아웃·스크립트 파일별 시간을 낸다. 같은 페이지에서 형상을 바꿔 가며 잰다.
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const HEROES=(process.env.HEROES||'hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner,ego,persona').split(',');
const CINE=process.env.CINE!=='0',REPS=+process.env.REPS||2,OUT=process.env.OUT||'';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await go(p,process.env.ZONE||'murder01');await p.waitForTimeout(1500);
await p.evaluate(c=>{player.maxHp=player.hp=1e9;window.__STORYWORLD_CINEMA_CUTIN_R1244__?.set(c);
 window.__L=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__L.push({t:e.startTime,d:e.duration,blk:e.blockingDuration,sl:e.styleAndLayoutStart?e.startTime+e.duration-e.styleAndLayoutStart:0,
  rs:e.renderStart?e.startTime+e.duration-e.renderStart:0,sc:(e.scripts||[]).map(s=>({u:String(s.sourceURL||'').split('/').pop().split('?')[0],f:s.sourceFunctionName||'',d:s.duration,i:s.invoker}))});}).observe({type:'long-animation-frame',buffered:false});},CINE);
const form=h=>p.evaluate(h=>{const P=player,E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__,R=window.__STORYWORLD_PERSONA_HERO_R1113__;
 try{E?.setForm?.(false);}catch(_){}try{R?.setForm?.(false);}catch(_){}P.egoSovereignR1046=false;P.personaHeroR1113=false;
 if(h==='ego'){P.hero='hwando';try{E.unlock('secret-777');E.setForm(true);}catch(_){}P.egoSovereignR1046=true;}
 else if(h==='persona'){P.hero='lauren';try{R.unlock('secret-777');R.setForm(true);}catch(_){}P.personaHeroR1113=true;}else P.hero=h;
 P.samong=0;P.samongCD=30;return window.__STORYWORLD_CINEMA_CUTIN_R1244__?.formOf(P);},h);
const waitG=s=>p.evaluate(s=>new Promise(res=>{const t0=time;const f=()=>{if(modal)closePanel(true);time>=t0+s?res():setTimeout(f,25);};f();}),s);
const res={};
for(const h of HEROES){const f=await form(h);await waitG(2);res[h]=[];
 for(let r=0;r<REPS;r++){await p.evaluate(()=>{window.__L.length=0;player.samongCD=0;});const t0=await p.evaluate(()=>{const t=performance.now();awaken('story');return t;});
  await p.waitForTimeout(3000);const L=await p.evaluate(t0=>window.__L.filter(e=>e.t+e.d>=t0),t0);await p.evaluate(()=>{player.samong=0;player.samongCD=30;});await waitG(1.5);
  const by={};let sum=0,sl=0;for(const e of L){sum+=e.d;sl+=e.sl;for(const s of e.sc)by[s.u]=(by[s.u]||0)+s.d;}
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>k+':'+v.toFixed(0));
  const row={form:f,rep:r,n:L.length,max:Math.max(0,...L.map(e=>e.d)),first:L[0]?.d||0,sum,sl,top};res[h].push(row);console.log(h,JSON.stringify(row));}}
if(OUT)fs.writeFileSync(OUT,JSON.stringify(res));console.log('errors',errs.length,errs.slice(0,3));await b.close();
