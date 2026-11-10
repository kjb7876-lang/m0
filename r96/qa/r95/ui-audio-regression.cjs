'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),source=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'client-source/visual-r93-ui.js');
const report={schema:'r95-ui-audio-regression/v1',source:path.relative(root,source),method:'Actual overlay executed in isolated Node VM with controlled delayed audio decoding and WebAudio lifecycle spies. No browser pixels or listening.',checks:[]};
function check(name,passed,detail){report.checks.push({name,passed:!!passed,...detail?{detail}: {}});console.log(passed?'PASS':'FAIL',name);}
function harness(){
 const intervals=[],listeners={},pending=[],sources=[],gains=[],stored=new Map();
 const classes=()=>({toggle(){},contains(){return false;},add(){},remove(){}});
 const document={hidden:false,querySelector:s=>s==='footer'?{}:null,getElementById:()=>null,querySelectorAll:()=>[],head:{appendChild(){}},body:{classList:classes()},createElement:tag=>({tagName:tag.toUpperCase(),style:{},classList:classes(),remove(){}}),addEventListener:(k,f)=>(listeners[k]??=[]).push(f)};
 const context=()=>({currentTime:1,createGain(){const g={gain:{value:0,setTargetAtTime(v){this.value=v;}},connect(){},disconnect(){this.disconnected=true;}};gains.push(g);return g;},createBufferSource(){const s={playbackRate:{value:1},connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(s);return s;}});
 const h={document,window:{},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},setInterval:(f,ms)=>intervals.push({f,ms}),tickEnemies(){},player:{x:0,y:0,hp:10},room:{exploration:{surface:{art:{r81Environment:'swamp'}}}},zone:'dist02',time:1,settings:{sound:true,volume:.7},audioUnlocked:true,audioContext:context(),masterGain:{},modal:false,audioBuffer:p=>new Promise(resolve=>pending.push({p,resolve})),console};
 h.window.__STORYWORLD_VISUAL_R92__={lightPoints:()=>[{x:h.player.x,y:h.player.y}]};
 vm.createContext(h);vm.runInContext(fs.readFileSync(source,'utf8'),h,{filename:source});
 return {h,intervals,listeners,pending,sources,gains,context,api:h.window.__STORYWORLD_VISUAL_R93_UI__,pulse:()=>intervals.find(i=>i.ms===250).f(),async flush(){await Promise.resolve();await Promise.resolve();await Promise.resolve();},resolveAll(){for(const x of pending.splice(0))x.resolve({});}};
}
(async()=>{
 {
  const t=harness();t.pulse();check('One pending decode per ambient track',t.pending.length===2);t.api.set({ambience:false});t.resolveAll();await t.flush();check('Disabling ambience cancels pending audio and cannot start a delayed loop',t.sources.length===0&&t.api.inspect().loops.length===0,t.api.inspect());
 }
 {
  const t=harness();t.pulse();t.h.document.hidden=true;for(const f of t.listeners.visibilitychange||[])f();t.resolveAll();await t.flush();check('Hiding page during decode cannot start ambient audio',t.sources.length===0&&t.api.inspect().loops.length===0);
 }
 {
  const t=harness();t.pulse();t.resolveAll();await t.flush();check('Enabled nearby fire and wet environment start two loops',t.sources.length===2&&t.sources.every(s=>s.started)&&t.gains.every(g=>g.gain.value>0));t.api.set({ambience:false});check('Disabled ambience releases running sources and gain nodes',t.sources.every(s=>s.stopped&&s.disconnected)&&t.gains.every(g=>g.disconnected)&&t.api.inspect().loops.length===0);
 }
 {
  const t=harness();t.pulse();t.resolveAll();await t.flush();const old=t.sources.slice();t.h.audioContext=t.context();t.pulse();t.resolveAll();await t.flush();check('Native AudioContext replacement disposes old loops and reconnects new ones',old.every(s=>s.stopped&&s.disconnected)&&t.sources.length===4&&t.api.inspect().stats.ambientStarts===4);
 }
 {
  const t=harness();t.pulse();t.h.settings.sound=false;t.resolveAll();await t.flush();check('Native sound switch cancels pending ambience before decode completes',t.sources.length===0);
 }
 {
  const t=harness();t.h.window.__STORYWORLD_VISUAL_R92__.lightPoints=()=>[];t.h.room={exploration:{surface:{art:{r81Environment:'swamp'}}}};t.pulse();t.h.room={exploration:{surface:{art:{r81Environment:'stone'}}}};t.resolveAll();await t.flush();check('Leaving wet region while decoding cannot play obsolete water ambience',t.sources.length===0);
 }
 for(const [name,mutate]of [['footsteps disabled',t=>t.api.set({footsteps:false})],['scene changed',t=>t.h.room={}],['old decode expired',t=>t.h.time+=1],['audio context replaced',t=>t.h.audioContext=t.context()]]){
  const t=harness();t.h.tickEnemies();t.h.player.x=.8;t.h.tickEnemies();check('Walking schedules one footstep ('+name+')',t.pending.length===1);mutate(t);t.resolveAll();await t.flush();check('Pending footstep is cancelled when '+name,t.sources.length===0);
 }
 {
  const t=harness();t.h.tickEnemies();t.h.player.x=.8;t.h.tickEnemies();t.resolveAll();await t.flush();check('Valid walk still plays one native-routed footstep',t.sources.length===1&&t.sources[0].started&&t.api.inspect().stats.steps===1);t.sources[0].onended();check('Finished footsteps disconnect their source and gain',t.sources[0].disconnected&&t.gains[0].disconnected);
 }
 report.passed=report.checks.every(c=>c.passed);fs.writeFileSync(path.join(__dirname,'ui-audio-results.json'),JSON.stringify(report,null,2)+'\n');if(!report.passed)process.exitCode=1;
})().catch(e=>{report.failure=e.stack;report.passed=false;fs.writeFileSync(path.join(__dirname,'ui-audio-results.json'),JSON.stringify(report,null,2)+'\n');console.error(e);process.exitCode=1;});
