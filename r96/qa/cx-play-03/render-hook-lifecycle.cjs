'use strict';
// Production overlays and their real periodic installers, CPU-only render sink.
// Advancing installer callbacks is a lifetime regression, not a gameplay pass.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const harness=path.resolve(__dirname,'../harness.cjs');
let source=fs.readFileSync(harness,'utf8');
assert.ok(source.includes('setInterval:()=>tid++'));
source=source.replace('function createHarness(options={}){','function createHarness(options={}){const lifecycleTimers=[];');
source=source.replace('setInterval:()=>tid++','setInterval:(f,ms)=>{lifecycleTimers.push({f,ms});return tid++;}');
source=source.replace('try{run(code,file);}',"try{run(code,file);if(file==='dist/phase1.js')run('window.cxBaseRenders=0;StoryPhase1.ThreeRenderer.prototype.render=function(){cxBaseRenders++;};StoryPhase1.ThreeRenderer.prototype.clearScene=function(){};StoryPhase1.ThreeRenderer.prototype.dispose=function(){};');}");
source=source.replace('return {context,run,boot,start,elements,logs,storage,timerTasks,site};','return {context,run,boot,start,elements,logs,storage,timerTasks,site,lifecycleTimers};');
const mod=new Module(harness,module);mod.filename=harness;mod.paths=module.paths;mod._compile(source,harness);
let checks=0,failed=0;const check=(name,pass)=>{checks++;if(!pass)failed++;console.log((pass?'PASS ':'FAIL ')+name);};
for(const own of [false,true]){
 const h=mod.exports.createHarness({timeoutMs:30000});
 h.run(`window.cxRenderer=Object.create(StoryPhase1.ThreeRenderer.prototype);${own?'cxRenderer.render=StoryPhase1.ThreeRenderer.prototype.render;':''}__STORYWORLD_PHASE1__.controller.state.three=cxRenderer;`);
 const timers=h.lifecycleTimers.filter(t=>t.ms===500&&['wrapAll','wrapInst'].includes(t.f.name));
 check('all six production installers present '+own,timers.length>=6);
 const sweep=()=>{for(const t of timers)t.f();};sweep();
 const frame="cxRenderer.render({layer:'STORY',zone:'cx-hook-lifetime',viewport:{width:640,height:480,dpr:1},entities:[],props:[]});";
 h.run(frame);const first=h.run('cxBaseRenders');check('initial native sink once '+own,first===1);
 let changes=0,previous=h.run('cxRenderer.render');
 for(let i=0;i<4000;i++){sweep();const next=h.run('cxRenderer.render');if(next!==previous)changes++;previous=next;}
 let error=null;try{h.run(frame);}catch(e){error=e;}
 if(error)console.log(error.stack);check('4000 installer sweeps render without stack overflow '+own,!error);
 check('installer chain stabilizes after initial registration '+own,changes===0);
 check('native sink remains exactly once per frame '+own,h.run('cxBaseRenders')===2);
 const replacement=h.run('Object.create(StoryPhase1.ThreeRenderer.prototype)');h.context.cxReplacement=replacement;h.run('__STORYWORLD_PHASE1__.controller.state.three=cxReplacement;');sweep();
 try{h.run("cxReplacement.render({layer:'STORY',zone:'cx-hook-lifetime',viewport:{width:640,height:480,dpr:1},entities:[],props:[]});");}catch(e){console.log(e.stack);}
 check('new renderer still receives hooks and reaches native sink '+own,h.run('cxBaseRenders')===3);
}
console.log(JSON.stringify({checks,failed,passed:failed===0,method:'CPU production installer lifetime; no browser/GPU/gameplay claim'}));

if(failed)process.exitCode=1;
