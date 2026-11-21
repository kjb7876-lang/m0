// R1290 조사: 스킬 이펙트를 더 반투명하게 하면 렉이 줄어드는가 — 같은 장면에서 이펙트 명령 알파 ×1 / ×0.55 / 이펙트 빼기 를 번갈아 그려 렌더 시간 비교.
//  헤드리스 SwiftShader(소프트웨어 GL)라 '픽셀 칠하기 비용' 경향만 본다. 실제 GPU·모바일 수치는 미검증.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.URL||'http://127.0.0.1:4396/m0/',ROUNDS=+(process.env.ROUNDS||3),GS=+(process.env.GS||2.5);
const b=await chromium.launch({headless:true});const p=await (await b.newContext({viewport:{width:+(process.env.W||960),height:+(process.env.H||540)}})).newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist02','STORY');}).catch(()=>{});
await p.evaluate(async()=>{const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>!loading,null,{timeout:180000});await skip();
await p.evaluate(()=>{player.invincible=1e9;try{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('secret-777')}catch(_){}
 if(player.hero!=='hwando'){} window.__STORYWORLD_EGO_FORM_R1176__.set('3d');window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true);auto=true;guide=true;
 // 측정 장치: 이펙트 명령 알파 바꾸기(가장 바깥 push 감싸기) + renderer.render 시간
 const M=window.__M={mode:'normal',kinds:{},rt:[],fx:0,fxArea:0};const P=window.StoryPhase1.DrawCommands.prototype,base=P.push;
 const isFx=o=>{const k=o?.kind;return k==='effect'||k==='projectile'||k==='hazard';};/* 스킬·투사체·장판 이펙트만(바닥·몸·조형물 제외) */
 const w=function(kind,data){const o=this.owner||{};M.kinds[o.kind||'?']=(M.kinds[o.kind||'?']||0)+1;
  if(M.mode!=='normal'&&isFx(o)){M.fx++;if(M.mode==='cull')return;const ga=this.globalAlpha;this.globalAlpha=(Number.isFinite(ga)?ga:1)*0.55;try{return base.call(this,kind,data);}finally{this.globalAlpha=ga;}}
  return base.call(this,kind,data);};for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}P.push=w;try{if(Object.prototype.hasOwnProperty.call(ctx,'push'))ctx.push=w;}catch(_){}
 const T=window.__STORYWORLD_PHASE1__?.controller?.state?.three,R=T?.renderer;const gl=R?.getContext?.();/* gl.finish 로 실제 칠하기(래스터)까지 기다려 잰다 */const wrap=f=>function(...a){const t=performance.now();try{return f.apply(this,a);}finally{try{gl?.finish?.();}catch(_){}M.rt.push(performance.now()-t);}};
 if(R){const pr=Object.getPrototypeOf(R);if(Object.prototype.hasOwnProperty.call(R,'render'))R.render=wrap(R.render);else R.render=wrap(pr.render.bind(R));}
 M.has=!!R;});
await p.waitForFunction(()=>(window.__g0??=time)&&time-window.__g0>=3,null,{timeout:600000,polling:500});
const res={normal:[],alpha55:[],cull:[]};
for(let r=0;r<ROUNDS;r++)for(const mode of ['normal','alpha55','cull']){
 const x=await p.evaluate(m=>{const M=window.__M;M.mode=m==='alpha55'?'alpha':m;M.rt=[];M.fx=0;window.__gt0=time;return 1;},mode);
 await p.waitForFunction(g=>time-window.__gt0>=g,GS,{timeout:600000,polling:300});
 const v=await p.evaluate(()=>{const a=window.__M.rt.slice().sort((x,y)=>x-y);return{n:a.length,avg:a.reduce((s,y)=>s+y,0)/a.length,p50:a[a.length>>1],fxCmds:window.__M.fx,enemies:(room?.enemies||[]).filter(e=>e.hp>0).length};});
 res[mode].push(v);console.log(r,mode,JSON.stringify(v));}
const sum=Object.fromEntries(Object.entries(res).map(([k,v])=>[k,{renderAvgMs:+(v.reduce((s,y)=>s+y.avg,0)/v.length).toFixed(2),renderP50Ms:+(v.reduce((s,y)=>s+y.p50,0)/v.length).toFixed(2)}]));
console.log('summary',JSON.stringify(sum));console.log('kinds',JSON.stringify(await p.evaluate(()=>window.__M.kinds)),'renderer',await p.evaluate(()=>window.__M.has));await b.close();
