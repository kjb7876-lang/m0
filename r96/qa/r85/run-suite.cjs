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
 ['dynamic-source','qa/r84/dynamic-source-audit.py','qa/r84/dynamic-source-results.json',25],
 ['hospital-settings','qa/r84/settings-check.cjs','qa/r84/settings-results.json',20],
 ['dynamic-runtime','qa/r84/runtime-check.cjs','qa/r84/runtime-results.json',29],
 ['dynamic-full-frame','qa/r84/full-frame-check.cjs','qa/r84/full-frame-results.json',27],
 ['refined-source-runtime','qa/r85/dynamic-source-runtime-check.cjs','qa/r85/dynamic-source-runtime-results.json',10],
 ['refined-native-integration','qa/r85/refined-check.cjs','qa/r85/refined-results.json',21],
];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function snapshot(){const m=JSON.parse(fs.readFileSync(path.join(site,'web-manifest-r62.json')));return Object.fromEntries([...m.files.map(r=>r.path),'web-manifest-r62.json'].sort().map(p=>[p,hash(fs.readFileSync(path.join(site,p)))]));}
const before=snapshot(),startedAt=new Date().toISOString(),runs=[];
async function run([name,script,report,min]){
 const p=path.join(root,report);fs.rmSync(p,{force:true});
 const logPath=path.join(__dirname,name+'-final.log'),fd=fs.openSync(logPath,'w'),start=Date.now();
 const outcome=await new Promise(resolve=>{let done=false;const child=spawn(script.endsWith('.py')?'python':process.execPath,[path.join(root,script)],{cwd:root,stdio:['ignore',fd,fd]});const timer=setTimeout(()=>child.kill('SIGKILL'),240000);const finish=value=>{if(done)return;done=true;clearTimeout(timer);fs.closeSync(fd);resolve(value);};child.on('error',e=>finish({error:String(e)}));child.on('exit',(code,signal)=>finish({exitCode:code,signal}));});
 let result,error;try{result=JSON.parse(fs.readFileSync(p));}catch(e){error=String(e);}
 const checks=result?.checks||[],passed=outcome.exitCode===0&&!error&&!result?.failure&&checks.length>=min&&checks.every(c=>c.passed===true)&&result?.integrationFixture!==true;
 const row={name,script,report,log:path.relative(root,logPath),...outcome,elapsedMs:Date.now()-start,checks:checks.length,passedChecks:checks.filter(c=>c.passed===true).length,minimumChecks:min,passed,error};runs.push(row);console.log(name,passed?'PASS':'FAIL',row.passedChecks+'/'+row.checks);return passed;
}
async function pool(items,limit=3){let cursor=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(cursor<items.length){const row=items[cursor++];await run(row);}}));}
(async()=>{
 // These two create fresh checkpoints needed by subsequent cold-process tests.
 await pool(rows.slice(0,2),2);
 if(runs.every(r=>r.passed))await pool(rows.slice(2));
 const after=snapshot(),changed=Object.keys(before).filter(p=>before[p]!==after[p]),same=JSON.stringify(before)===JSON.stringify(after);
 const report={schema:'r85-final-frozen-suite/v1',startedAt,completedAt:new Date().toISOString(),method:'Independent Node VM gameplay, Three CPU geometry/projection, complete SHA256 manifests and loopback HTTP. Combat and travel tests use scripted positioning/damage/invulnerability; no browser, GPU, Windows execution, audio playback or natural-play validation.',passed:runs.length===rows.length&&runs.every(r=>r.passed)&&same,passedChecks:runs.reduce((n,r)=>n+r.passedChecks,0),totalChecks:runs.reduce((n,r)=>n+r.checks,0),groups:runs.length,sourceUnchangedDuringRun:same,changedFiles:changed,sourceHashes:before,runs,browserVerified:false,GPUVerified:false,naturalPlayVerified:false,publicDeploymentChanged:false};
 fs.writeFileSync(path.join(__dirname,'final-suite.json'),JSON.stringify(report,null,2)+'\n');console.log('FINAL',report.passed?'PASS':'FAIL',report.passedChecks+'/'+report.totalChecks);if(!report.passed)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
