// R1344 three.render 감싸기 깊이를 시간에 따라 잰다(renderer.render 안에서 스택 줄 수).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',Z=process.env.ZONE||'ep1b04',N=+(process.env.N||6);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(()=>{player.hero='gunner';});
await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),Z);await p.waitForFunction(z=>!loading&&room?.id===z,Z,{timeout:150000});await skip();
if(!process.env.NOEGO)await p.evaluate(()=>{player.invincible=1e9;try{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('secret-777')}catch(_){}try{window.__STORYWORLD_EGO_FORM_R1176__.set('3d');window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true);}catch(e){}auto=true;guide=true;});
const depth=()=>p.evaluate(()=>new Promise(res=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three,R=h.renderer;const own=Object.prototype.hasOwnProperty.call(R,'render'),base=R.render;
 R.render=function(){const L=Error.stackTraceLimit;Error.stackTraceLimit=Infinity;const s=new Error().stack.split('\n');Error.stackTraceLimit=L;if(own)R.render=base;else delete R.render;
  const fr={};for(const l of s.slice(1)){const k=l.trim().replace(/:\d+:\d+\)?$/,'');fr[k]=(fr[k]||0)+1;}res({lines:s.length,top:Object.entries(fr).sort((a,b)=>b[1]-a[1]).slice(0,4)});return base.apply(this,arguments);};}));
const pdepth=()=>p.evaluate(()=>{const L=Error.stackTraceLimit;Error.stackTraceLimit=Infinity;let st='';const fake=new Proxy({},{get(){throw new Error('stop');}});
 try{window.StoryPhase1.ThreeRenderer.prototype.render.call(fake,{commands:[]});}catch(e){st=String(e.stack);}Error.stackTraceLimit=L;const fr={};for(const l of st.split('\n').slice(1)){const m=/\/([\w.-]+\.js)/.exec(l);const k=m?m[1]:'?';fr[k]=(fr[k]||0)+1;}return Object.entries(fr).sort((a,b)=>b[1]-a[1]).slice(0,4);});
for(let i=0;i<N;i++){const d=await depth();d.proto=await pdepth();console.log(JSON.stringify({i,t:await p.evaluate(()=>time),...d}).slice(0,900));await p.waitForTimeout(10000);}
await b.close();
