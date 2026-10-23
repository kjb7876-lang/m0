'use strict';
// Frozen delivered-site check. Reports are deleted before each run so an
// interrupted test cannot borrow an older successful result.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),site=path.join(root,'hospital-three-pc/site');
const rows=[
 ['hospital-maze','qa/maze-integration.cjs','qa/maze-results.json',29],
 ['world-runtime','qa/r81/runtime-contracts.cjs','qa/r81/runtime-results.json',22],
 ['hospital-layout','qa/layout-validation.cjs','qa/layout-results.json',14],
 ['hospital-cold','qa/cold-check.cjs','qa/cold-results.json',7],
 ['ego-health','qa/ego-regression.cjs','qa/ego-regression-results.json',6],
 ['hospital-champions','qa/champion-check.cjs','qa/champion-results.json',10],
 ['hospital-migration','qa/migration-check.cjs','qa/migration-results.json',9],
 ['manual-input','qa/r81/manual-input.cjs','qa/r81/manual-input-results.json',6],
 ['world-geometry','qa/r81/geometry-contracts.cjs','qa/r81/geometry-results.json',9],
 ['camera-motion','qa/r82/camera-check.cjs','qa/r82/camera-results.json',10],
 ['brain-and-roofs','qa/r82/material-check.cjs','qa/r82/material-results.json',12],
 ['opening-refuge','qa/r82/hub-check.cjs','qa/r82/hub-results.json',11],
 ['environment','qa/r81/environment-check.cjs','qa/r81/environment-results.json',17],
 ['projectile','qa/r81/projectile-contracts.cjs','qa/r81/projectile-results.json',13],
 ['world-cold','qa/r81/cold-restore-contracts.cjs','qa/r81/cold-restore-results.json',6],
 ['hospital-start-777','qa/r81/hospital-start-777.cjs','qa/r81/hospital-start-777-results.json',9],
 ['legacy-save','qa/r81/legacy-save-contracts.cjs','qa/r81/legacy-save-results.json',9],
 ['legacy-castle-save','qa/r81/legacy-castle-save-contracts.cjs','qa/r81/legacy-castle-save-results.json',10],
 ['legacy-scope','qa/r81/legacy-scope-check.cjs','qa/r81/legacy-scope-results.json',3],
 ['native-progression','qa/r81/progression-contracts.cjs','qa/r81/progression-results.json',12],
 ['native-finale','qa/r81/finale-contracts.cjs','qa/r81/finale-results.json',6],
 ['world-combat','qa/r81/world-combat-check.cjs','qa/r81/world-combat-results.json',9],
 ['preservation','qa/r81/preservation.py','qa/r81/preservation-results.json',4],
 ['package','qa/package-check.cjs','qa/package-results.json',5],
 ['renderer-compositing','qa/r83/render-compat-check.cjs','qa/r83/render-compat-results.json',13],
 ['hero-presentation','qa/r83/hero-check.cjs','qa/r83/hero-results.json',18],
 ['portal-interaction','qa/r83/portal-check.cjs','qa/r83/portal-results.json',17],
 ['map-perimeter','qa/r83/map-check.cjs','qa/r83/map-results.json',14],
 ['world-door-visuals','qa/r83/door-check.cjs','qa/r83/door-results.json',18],
 ['existing-effects','qa/r83/effect-check.cjs','qa/r83/effect-results.json',14],
 ['full-frame-render-replay','qa/r83/audit-frame-replay.cjs','qa/r83/audit-frame-results.json',16],
 ['new-vfx-assets','qa/r83/vfx-asset-audit.py','qa/r83/vfx-asset-results.json',13],
 ['new-vfx-runtime','qa/r83/vfx-runtime-check.cjs','qa/r83/vfx-runtime-results.json',18],
 ['hospital-settings','qa/r84/settings-check.cjs','qa/r84/settings-results.json',20],
 ['refined-static-integration','qa/r86/refined-static-check.cjs','qa/r86/refined-static-results.json',15],
 ['dynamic-package-deferred','qa/r86/dynamic-deferred-check.cjs','qa/r86/dynamic-deferred-results.json',8],
 ['camera-default','qa/r86/camera-check.cjs','qa/r86/camera-results.json',6],
 ['enemy-colors-and-champions','qa/r86/enemy-check.cjs','qa/r86/enemy-results.json',18,600000],
 ['door-front-surface','qa/r86/door-check.cjs','qa/r86/door-results.json',12],
 ['enemy-facing','qa/r86/enemy-facing-check.cjs','qa/r86/enemy-facing-results.json',6],
 ['hero-all-poses','qa/r86/hero-integration-check.cjs','qa/r86/hero-integration-results.json',12],
 ['retained-vector-buffers','qa/r86/performance-check.cjs','qa/r86/performance-results.json',16],
 ['campaign-map-admission','qa/r86/map-campaign-check.cjs','qa/r86/map-campaign-results.json',13,1200000],
 ['samong-through-ending','qa/r86/progression-777-finale.cjs','qa/r86/progression-777-finale-results.json',22,600000],
 ['active-asset-usage','qa/r86/vfx-usage-check.cjs','qa/r86/vfx-usage-results.json',11],

];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function snapshot(){const m=JSON.parse(fs.readFileSync(path.join(site,'web-manifest-r62.json')));return Object.fromEntries([...m.files.map(r=>r.path),'web-manifest-r62.json'].sort().map(p=>[p,hash(fs.readFileSync(path.join(site,p)))]));}
const before=snapshot(),startedAt=new Date().toISOString(),runs=[];
async function run([name,script,report,min,timeoutMs=240000]){
 const p=path.join(root,report);fs.rmSync(p,{force:true});
 const logPath=path.join(__dirname,name+'-final.log'),fd=fs.openSync(logPath,'w'),start=Date.now();
 const outcome=await new Promise(resolve=>{let done=false;const child=spawn(script.endsWith('.py')?'python':process.execPath,[path.join(root,script)],{cwd:root,stdio:['ignore',fd,fd]});const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);const finish=value=>{if(done)return;done=true;clearTimeout(timer);fs.closeSync(fd);resolve(value);};child.on('error',e=>finish({error:String(e)}));child.on('exit',(code,signal)=>finish({exitCode:code,signal}));});
 let result,error;try{result=JSON.parse(fs.readFileSync(p));}catch(e){error=String(e);}
 const checks=result?.checks||[],passed=outcome.exitCode===0&&!error&&!result?.failure&&checks.length>=min&&checks.every(c=>c.passed===true)&&result?.integrationFixture!==true;
 const row={name,script,report,scriptSHA256:hash(fs.readFileSync(path.join(root,script))),log:path.relative(root,logPath),...outcome,elapsedMs:Date.now()-start,checks:checks.length,passedChecks:checks.filter(c=>c.passed===true).length,minimumChecks:min,passed,error};runs.push(row);console.log(name,passed?'PASS':'FAIL',row.passedChecks+'/'+row.checks);return passed;
}
async function pool(items,limit=3){let cursor=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(cursor<items.length){const row=items[cursor++];await run(row);}}));}
(async()=>{
 let retryHistory=[];
 if(process.argv.includes('--retry-failed')){
  const previous=JSON.parse(fs.readFileSync(path.join(__dirname,'final-suite.json')));
  if(previous.groups!==rows.length||!previous.sourceUnchangedDuringRun||JSON.stringify(previous.sourceHashes)!==JSON.stringify(before))throw Error('Retry requires the exact unchanged, complete frozen runtime');
  retryHistory=[...(previous.retryHistory||[]),{completedAt:previous.completedAt,passedChecks:previous.passedChecks,totalChecks:previous.totalChecks,failedRuns:previous.runs.filter(r=>!r.passed)}];
  fs.writeFileSync(path.join(__dirname,'before-targeted-retry.json'),JSON.stringify(previous,null,2)+'\n');
  for(const old of previous.runs.filter(r=>r.passed)){
   const result=JSON.parse(fs.readFileSync(path.join(root,old.report))),checks=result.checks||[];
   if(result.failure||checks.length!==old.checks||checks.some(c=>c.passed!==true))throw Error('Prior passed report changed: '+old.name);
   runs.push(old);
  }
  await pool(rows.filter(row=>previous.runs.some(r=>r.name===row[0]&&!r.passed)),2);
 }else{
 // These two create fresh checkpoints needed by subsequent cold-process tests.
 await pool(rows.slice(0,2),2);
 if(runs.every(r=>r.passed))await pool(rows.slice(2));
 }
 const after=snapshot(),changed=Object.keys(before).filter(p=>before[p]!==after[p]),same=JSON.stringify(before)===JSON.stringify(after);
 const report={schema:'r86-final-frozen-suite/v1',startedAt,completedAt:new Date().toISOString(),method:'Independent Node VM gameplay, Three CPU geometry/projection, complete SHA256 manifests and loopback HTTP. Failed checks may be retried only against the byte-identical complete frozen runtime; successful prior reports are revalidated and retry history is retained. Combat and travel tests use scripted positioning/damage/invulnerability; no browser, GPU, Windows execution, audio playback or natural-play validation.',passed:runs.length===rows.length&&runs.every(r=>r.passed)&&same,passedChecks:runs.reduce((n,r)=>n+r.passedChecks,0),totalChecks:runs.reduce((n,r)=>n+r.checks,0),groups:runs.length,sourceUnchangedDuringRun:same,changedFiles:changed,sourceHashes:before,runs,retryHistory,browserVerified:false,GPUVerified:false,naturalPlayVerified:false,publicDeploymentChanged:false};
 fs.writeFileSync(path.join(__dirname,'final-suite.json'),JSON.stringify(report,null,2)+'\n');console.log('FINAL',report.passed?'PASS':'FAIL',report.passedChecks+'/'+report.totalChecks);if(!report.passed)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
