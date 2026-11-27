// R1344 탐식의 주방(ep1b04) 기억사수 3D EGO 플레이 중 함수 감싸기 핑퐁 전수 감시(전역·DrawCommands·ctx·Three 렌더러·장면 객체·재질).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SECS=+(process.env.SECS||60),Z=process.env.ZONE||'ep1b04';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,400)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(()=>{player.hero=window.HERO||'gunner';});
await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),Z);await p.waitForFunction(z=>!loading&&room?.id===z,Z,{timeout:150000});await skip();
if(!process.env.NOEGO)await p.evaluate(()=>{player.invincible=1e9;try{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('secret-777')}catch(_){}try{window.__STORYWORLD_EGO_FORM_R1176__.set(window.EGOFORM||'3d');window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true);}catch(e){console.log(e)}auto=true;guide=true;});
await p.waitForTimeout(8000);
const r=await p.evaluate(async(secs)=>{const T3=()=>window.__STORYWORLD_PHASE1__?.controller?.state?.three;
 const snap=()=>{const m=new Map();const add=(k,v)=>{if(typeof v==='function')m.set(k,v);};
  for(const k of Object.getOwnPropertyNames(window)){try{const v=window[k];if(typeof v==='function')m.set('w.'+k,v);else if(v&&typeof v==='object'&&/^__STORYWORLD_/.test(k))for(const j of Object.keys(v))add(k+'.'+j,v[j]);}catch(_){}}
  const P=window.StoryPhase1?.DrawCommands?.prototype;if(P)for(const k of Object.getOwnPropertyNames(P))try{add('DC.'+k,P[k]);}catch(_){}
  try{for(const k of Object.getOwnPropertyNames(ctx))add('ctx.'+k,ctx[k]);}catch(_){}
  const h=T3();if(h){for(const k of Object.keys(h))add('three.'+k,h[k]);if(h.commands)for(const k of Object.keys(h.commands))add('three.commands.'+k,h.commands[k]);
   const R=h.renderer;if(R)for(const k of Object.keys(R))add('renderer.'+k,R[k]);
   if(h.scene)h.scene.traverse(o=>{const id=(o.name||o.type)+'#'+o.id;add('obj.'+id+'.onBeforeRender',o.onBeforeRender);add('obj.'+id+'.onAfterRender',o.onAfterRender);
    for(const mt of [].concat(o.material||[]))if(mt){add('mat.'+mt.uuid.slice(0,8)+'('+id+').onBeforeCompile',mt.onBeforeCompile);add('mat.'+mt.uuid.slice(0,8)+'('+id+').key',mt.customProgramCacheKey);}});}
  return m;};
 let prev=snap();const n={};for(let i=0;i<secs/2;i++){await new Promise(r=>setTimeout(r,2000));const cur=snap();for(const [k,v] of cur)if(prev.has(k)&&prev.get(k)!==v)n[k]=(n[k]||0)+1;prev=cur;}
 return Object.entries(n).filter(([k,v])=>v>2).sort((a,b)=>b[1]-a[1]).slice(0,40);},SECS);
console.log(JSON.stringify(r,null,0));console.log('rec',JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_THREE_RECOVER_R1228__.inspect())));console.log('ERRS',errs.length,errs.slice(0,3).join('\n'));await b.close();
