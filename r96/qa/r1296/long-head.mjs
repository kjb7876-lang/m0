// R1296 긴 시간 추적: 윤서하·검은 공방(kair07)·자동 전투·소환 영웅 열림 상태로 오래 돌리며 3D 장면 캡처의 '남은 호출 스택 여유'와
//  그리기 기록기·3D 렌더러 인스턴스 함수가 다시 감싸지는지(시간이 갈수록 깊어지는 감싸기) 본다.  URL=… SECS=900 node r96/qa/r1296/long-head.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.URL||'http://127.0.0.1:4410/m0/',SECS=+(process.env.SECS||900),HERO=process.env.HERO||'seoha',ZONE=process.env.ZONE||'kair07';
const b=await chromium.launch({headless:true});const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,600)));
await p.addInitScript(()=>{let v;Object.defineProperty(window,'StoryPhase1',{configurable:true,get(){return v;},set(x){
 if(x&&!x.__probe&&typeof x.createController==='function'){const cc=x.createController;x={...x,__probe:1,createController(h,o){const hh=Object.assign({},h,{captureVisual(){try{return h.captureVisual();}catch(e){(window.__r1296probe=window.__r1296probe||[]).push(String(e&&e.stack||e).slice(0,3000));throw e;}}});const c=cc.call(this,hh,o);window.__r1296ctl=c;
  window.__r1296head=()=>{const f=(n)=>n<=0?h.captureVisual().length:1+f(n-1);const okAt=k=>{try{f(k);return true;}catch(e){if(e instanceof RangeError)return false;throw e;}};let lo=0,hi=16000;if(!okAt(0))return 0;while(hi-lo>50){const m=(lo+hi)>>1;if(okAt(m))lo=m;else hi=m;}return lo;};return c;}};}
 v=x;}});});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async(z)=>{await window.__STORYWORLD_CHEAT777__.go(z,'STORY');},ZONE).catch(()=>{});
await p.evaluate(async()=>{const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>!loading,null,{timeout:180000});await skip();
await p.evaluate(async(h)=>{for(const z of ['dreamRest','restEp1b','u201','restU2','kair01','hando01'])visited.add('STORY:'+z);loading=true;try{await ensureImages(heroPaths(h));player.hero=h;}finally{loading=false;}player.level=88;player.invincible=1e9;auto=true;guide=true;
 // 기록기(DrawCommands 인스턴스)와 3D 렌더러 인스턴스의 자기 함수도 감시
 const P=window.StoryPhase1.DrawCommands.prototype,o=P.push;let rec=null;P.push=function(){if(!rec)rec=this;return o.apply(this,arguments);};
 const own=x=>{const m=new Map();if(!x)return m;for(const k of Object.getOwnPropertyNames(x))try{if(typeof x[k]==='function')m.set(k,x[k]);}catch(_){}return m;};
 const snap=()=>{const m=new Map();for(const [k,v] of own(rec))m.set('rec.'+k,v);const T=window.__r1296ctl?.state?.three;for(const [k,v] of own(T))m.set('three.'+k,v);for(const [k,v] of own(T?.renderer))m.set('three.renderer.'+k,v);for(const [k,v] of own(T?.commands))m.set('three.commands.'+k,v);
  for(const k of Object.getOwnPropertyNames(window)){try{const v=window[k];if(typeof v==='function')m.set('w.'+k,v);else if(v&&typeof v==='object'&&/^__STORYWORLD_/.test(k))for(const j of Object.keys(v))if(typeof v[j]==='function')m.set(k+'.'+j,v[j]);}catch(_){}}
  for(const k of Object.getOwnPropertyNames(P))try{if(typeof P[k]==='function')m.set('DC.'+k,P[k]);}catch(_){}return m;};
 let prev=snap();window.__r1296chg={};setInterval(()=>{const cur=snap();for(const [k,v] of cur)if(prev.has(k)&&prev.get(k)!==v)window.__r1296chg[k]=(window.__r1296chg[k]||0)+1;prev=cur;},2000);
},HERO);
const t0=Date.now();let lastZone=null;
while(Date.now()-t0<SECS*1000){await p.waitForTimeout(30000);await skip().catch(()=>{});
 const s=await p.evaluate(()=>{let head=null;try{head=window.__r1296head?.();}catch(e){head='ERR '+String(e).slice(0,100);}const c=window.__r1296ctl;
  return {head,t:Math.round(time),zone:room?.id,hero:player.hero,failed:c?.state?.failed,r1228:window.__STORYWORLD_THREE_RECOVER_R1228__?.inspect?.().failures,probe:(window.__r1296probe||[]).length,epoch:window.__STORYWORLD_SEOHA_EPOCH_R949__?.inspect?.().stats?.procs,enemies:(room?.enemies||[]).filter(e=>e.hp>0).length};});
 console.log(JSON.stringify({sec:Math.round((Date.now()-t0)/1000),...s}));
 // 적이 다 잡히면 같은 지역 다시 불러 전투를 이어 간다
 if(s.enemies<3){await p.evaluate(async(z)=>{await window.__STORYWORLD_CHEAT777__.go(z,'STORY');},s.zone==='kair07'?'kair06':'kair07').catch(()=>{});await p.waitForFunction(()=>!loading,null,{timeout:180000}).catch(()=>{});await skip().catch(()=>{});await p.evaluate(()=>{player.invincible=1e9;auto=true;guide=true;});}
 if(s.probe)break;}
console.log('CHANGED',JSON.stringify(await p.evaluate(()=>Object.entries(window.__r1296chg).filter(([k,v])=>v>2).sort((a,b)=>b[1]-a[1]))));
const probe=await p.evaluate(()=>window.__r1296probe||[]);console.log('PROBE',probe.length,probe[0]||'');console.log('PAGEERR',errs.length,errs.slice(0,3).join('\n---\n'));
await b.close();
