'use strict';
// Same geometry and native A*: toggle only the candidate-list optimization in
// an isolated VM, compare routes, and report CPU timings without an FPS claim.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'client-source/world-scale-r375.js'),'utf8');
const switches=['if(area===1)return','if(queryCache.has(key))return','if(area<=16){if'];
let uncached=source;for(const text of switches){assert.equal(source.split(text).length,2);uncached=uncached.replace(text,text.replace('if(','if(false&&'));}
function boot(code){const s={console,Map,Set,WeakMap,WeakSet,Number,Object,Array,Math};s.window=s;vm.createContext(s);vm.runInContext(fs.readFileSync(path.join(root,'runtime-text/dist/phase1.js'),'utf8'),s);vm.runInContext(code,s);return s;}
const original=boot(uncached),optimized=boot(source),results=[];
for(const mask of [0,7]){
 const opened=[0,1,2].filter(i=>mask&(1<<i)).map(i=>'door-'+i),runs=[];
 for(const [name,s]of [['uncached',original],['cached',optimized]]){
  const A=s.StoryPhase1,M=s.__STORYWORLD_WORLD_SCALE_R375__,L=M.scaleLayout(A.explorationLayout('ep1a08','hospital',false,{layerR81:'STORY',hospitalDoorsB3:opened})),P=M.hospitalPhysics(L),goal=L.hospitalCoreB2.combatAnchors[0];let blockedCalls=0,clearCalls=0;
  const start=performance.now(),route=A.explorationPath(L,L.entry,goal,.29,(...a)=>{blockedCalls++;return P.blocked(...a);},(...a)=>{clearCalls++;return P.clear(...a);});
  runs.push({name,ms:+(performance.now()-start).toFixed(2),blockedCalls,clearCalls,route:JSON.parse(JSON.stringify(route))});
 }
 assert.deepEqual(runs[0].route,runs[1].route);assert.equal(runs[0].blockedCalls,runs[1].blockedCalls);assert.equal(runs[0].clearCalls,runs[1].clearCalls);results.push({mask,runs});
}
const report={mode:'single Node VM CPU sample; same final geometry; not browser/mobile/FPS validation',sourceSha256:require('crypto').createHash('sha256').update(source).digest('hex'),results};
if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(path.join(process.env.OUT,'hospital-profile.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
