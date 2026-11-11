'use strict';
// Runs the requested, unmodified R89 runner, then preserves new evidence here
// and restores historical qa bytes. Run only after applying/fixing R90 source.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os'),{spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),qa=path.join(root,'qa'),out=__dirname,site=path.join(root,'hospital-three-pc/site');
const backup=fs.mkdtempSync(path.join(path.dirname(root),'r90-cpu-history-'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(dir,rel=''){const rows=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=rel?rel+'/'+e.name:e.name;if(p==='r90')continue;if(e.isSymbolicLink())throw Error('No symlink backup: '+p);if(e.isDirectory())rows.push(...walk(path.join(dir,e.name),p));else if(e.isFile())rows.push(p);}return rows;}
const historical=new Map(walk(qa).map(p=>[p,hash(fs.readFileSync(path.join(qa,p)))]));
for(const p of historical.keys()){fs.mkdirSync(path.dirname(path.join(backup,p)),{recursive:true});fs.copyFileSync(path.join(qa,p),path.join(backup,p));}
function snapshot(){const m=JSON.parse(fs.readFileSync(path.join(site,'web-manifest-r62.json')));return Object.fromEntries([...m.files.map(r=>r.path),'web-manifest-r62.json'].sort().map(p=>[p,hash(fs.readFileSync(path.join(site,p)))]));}
function execute(command,args,log,timeoutMs){return new Promise(resolve=>{const fd=fs.openSync(path.join(out,log),'w'),start=Date.now(),child=spawn(command,args,{cwd:root,stdio:['ignore','pipe','pipe']});let done=false;const timer=timeoutMs?setTimeout(()=>child.kill('SIGKILL'),timeoutMs):null;for(const stream of[child.stdout,child.stderr])stream.on('data',b=>{fs.writeSync(fd,b);process.stdout.write(b);});const finish=result=>{if(done)return;done=true;if(timer)clearTimeout(timer);fs.closeSync(fd);resolve({...result,elapsedMs:Date.now()-start,command:[command,...args],log});};child.on('error',e=>finish({error:String(e)}));child.on('exit',(exitCode,signal)=>finish({exitCode,signal}));});}
function copyReport(relative,target){if(!fs.existsSync(path.join(root,relative)))return false;fs.mkdirSync(path.dirname(path.join(out,target)),{recursive:true});fs.copyFileSync(path.join(root,relative),path.join(out,target));return true;}
const report={schema:'r90-full-fivepart-cpu/v1',startedAt:new Date().toISOString(),environment:{platform:process.platform,node:process.version,cpus:os.cpus().length,python:execFileSync('python',['--version'],{encoding:'utf8'}).trim(),pillow:execFileSync('python',['-c','import PIL;print(PIL.__version__)'],{encoding:'utf8'}).trim()},method:'Exact unmodified qa/r89/run-cpu-suite.cjs followed by three read-only asset/preservation Python audits. Node VM gameplay/Three CPU geometry and loopback HTTP; no browser/GPU/natural play.',assistance:'Existing suite uses renderer/image/audio stubs, synthetic saves, scripted positions, HP manipulation/invulnerability, 777 and native event injection; individual reports retain details.',before:snapshot(),browserVerified:false,headlessVerified:false,GPUVerified:false,naturalPlayVerified:false};
(async()=>{try{
 report.runner=await execute(process.execPath,['qa/r89/run-cpu-suite.cjs'],'cpu-run.log');
 copyReport('qa/r89/cpu-suite.json','cpu-suite-original-runner.json');
 const result=JSON.parse(fs.readFileSync(path.join(out,'cpu-suite-original-runner.json')));report.nodeSummary={ran:result.ran,passedGroups:result.passedGroups,failedGroups:result.failedGroups,passedChecks:result.passedChecks,totalChecks:result.totalChecks,sourceUnchangedDuringRun:result.sourceUnchangedDuringRun,notRun:result.notRun};
 report.runnerMetadataCorrection='Original runner is intentionally unmodified. Its environment.python=false and skip reason “Python is not installed on this Windows test PC” are hardcoded historical text; actual platform/Python/Pillow are recorded above.';
 for(const row of result.runs){if(row.notRun)continue;copyReport(row.report,'cpu-results/'+row.name+'.json');copyReport(row.log,'cpu-logs/'+row.name+'.log');}
 const legacy=result.runs.find(row=>row.name==='legacy-scope');
 if(legacy?.signal==='SIGKILL'){
  report.legacyScopeRetry=await execute(process.execPath,['qa/r89/run-cpu-suite.cjs','legacy-scope'],'cpu-legacy-scope-retry.log');
  copyReport('qa/r89/cpu-suite-partial.json','cpu-legacy-scope-retry.json');
  copyReport('qa/r81/legacy-scope-results.json','cpu-results/legacy-scope-retry.json');
  copyReport('qa/r89/cpu-logs/legacy-scope.log','cpu-logs/legacy-scope-retry.log');
 }
 report.pythonAudits=[];
 for(const [name,script,json,min]of[['preservation','qa/r81/preservation.py','qa/r81/preservation-results.json',4],['new-vfx-assets','qa/r83/vfx-asset-audit.py','qa/r83/vfx-asset-results.json',13],['painted-frame-pixels','qa/r87/atlas-audit.py','qa/r87/atlas-results.json',8]]){
  fs.rmSync(path.join(root,json),{force:true});const execution=await execute('python',[script],'cpu-logs/'+name+'.log',240000);let parsed=null;try{parsed=JSON.parse(fs.readFileSync(path.join(root,json)));}catch(_){}
  copyReport(json,'cpu-results/'+name+'.json');const checks=parsed?.checks||[];report.pythonAudits.push({name,script,...execution,checks:checks.length,passedChecks:checks.filter(c=>c.passed===true).length,minimumChecks:min,passed:execution.exitCode===0&&!parsed?.failure&&checks.length>=min&&checks.every(c=>c.passed===true)});
 }
 report.normalizationNotRun='scripts/normalize-final42-r88.py rewrites source asset metadata. Not run in the frozen work tree; no asset regeneration was requested.';
 report.pythonVisualReviewCaveat='R83 vfx-asset-audit.py emits a historical hardcoded visual_review block. This run verifies only the actual decode/hash/alpha checks; it does not establish a new human inspection of contact sheets or game screenshots.';
 }catch(e){report.failure=e.stack;process.exitCode=1;}
 finally{
  const after=snapshot();report.sourceChanged=Object.keys(report.before).filter(p=>report.before[p]!==after[p]);report.sourceUnchangedDuringRun=!report.sourceChanged.length;
  report.historicalFilesModified=walk(qa).filter(p=>!historical.has(p)||hash(fs.readFileSync(path.join(qa,p)))!==historical.get(p));
  for(const p of walk(qa))if(!historical.has(p))fs.rmSync(path.join(qa,p));
  for(const p of historical.keys()){const dest=path.join(qa,p);if(!fs.existsSync(dest)||hash(fs.readFileSync(dest))!==historical.get(p)){fs.mkdirSync(path.dirname(dest),{recursive:true});const bytes=fs.readFileSync(path.join(backup,p));const fd=fs.openSync(dest,'w');try{if(bytes.length)fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}}
  report.historicalQaRestored=[...historical].every(([p,h])=>fs.existsSync(path.join(qa,p))&&hash(fs.readFileSync(path.join(qa,p)))===h)&&walk(qa).length===historical.size;
  report.completedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'cpu-summary.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({finished:true,...report.nodeSummary,pythonAudits:report.pythonAudits,sourceUnchangedDuringRun:report.sourceUnchangedDuringRun,historicalQaRestored:report.historicalQaRestored,failure:report.failure||null}));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
