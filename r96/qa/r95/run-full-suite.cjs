'use strict';
// Audit the complete inherited gate without replacing historical QA evidence.
// The first two groups create checkpoint fixtures needed by cold-process tests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),site=path.join(root,'hospital-three-pc/site');
const base=fs.readFileSync(path.join(root,'qa/r88/run-suite.cjs'),'utf8');
const rows=[...base.matchAll(/\['([^']+)','([^']+)','([^']+)',(\d+)(?:,(\d+))?\]/g)].map(m=>[m[1],m[2],m[3],Number(m[4]),m[5]?Number(m[5]):240000]);
rows.push(['r90-presentation','qa/r90/presentation-check.cjs','qa/r90/presentation-results.json',22],['r90-decals','qa/r90/decals-check.cjs','qa/r90/decals-results.json',10],['r90-spatial-native','qa/r90/spatial-native-check.cjs','qa/r90/spatial-native-results.json',5]);
const mapRow=rows.find(r=>r[0]==='map-perimeter');mapRow[1]='qa/r95/map-current-check.cjs';mapRow[2]='qa/r95/map-current-results.json';mapRow[3]=17;
rows.push(['r95-render-regressions','qa/r95/render-regressions.cjs','qa/r95/render-regressions-results.json',5,240000],['r95-ui-audio','qa/r95/ui-audio-regression.cjs','qa/r95/ui-audio-results.json',18,240000],['r95-ui-dock','qa/r95/ui-dock-regression.cjs','qa/r95/ui-dock-results.json',9,240000],['r95-save-integrity','qa/r95/gameplay-save-integrity.cjs','qa/r95/gameplay-save-integrity.json',18,240000],['r95-assets','qa/r95/assets-audit.py','qa/r95/assets-results.json',7,600000],['r95-syntax','qa/r95/assets-syntax.cjs','qa/r95/assets-syntax-results.json',2,240000]);
const only=process.argv.slice(2).filter(a=>!a.startsWith('--')),label=process.env.STORYWORLD_QA_LABEL||'final';
if(!/^[a-zA-Z0-9_-]+$/.test(label))throw Error('Invalid audit label');
const folder=path.join(__dirname,label);fs.mkdirSync(path.join(folder,'results'),{recursive:true});fs.mkdirSync(path.join(folder,'logs'),{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function snapshot(){const out={};for(const top of ['hospital-three-pc/site','client-source']){function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(p,e.name);if(e.isDirectory())walk(f);else if(e.isFile())out[path.relative(root,f)]=hash(fs.readFileSync(f));}}walk(path.join(root,top));}return out;}
const before=snapshot(),startedAt=new Date().toISOString(),runs=[];
async function run([name,script,report,min,timeoutMs=240000]){
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw Error('Invalid group timeout: '+name);
 const reportPath=path.join(root,report),prior=fs.existsSync(reportPath)?fs.readFileSync(reportPath):null;
 fs.rmSync(reportPath,{force:true});
 const logPath=path.join(folder,'logs',name+'.log'),fd=fs.openSync(logPath,'w'),start=Date.now();
 let outcome;
 try{outcome=await new Promise(resolve=>{let done=false;const child=spawn(script.endsWith('.py')?'python':process.execPath,[path.join(root,script)],{cwd:root,stdio:['ignore',fd,fd]});const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);const finish=v=>{if(done)return;done=true;clearTimeout(timer);resolve(v);};child.on('error',e=>finish({error:String(e)}));child.on('exit',(code,signal)=>finish({exitCode:code,signal}));});}
 finally{fs.closeSync(fd);}
 let result,error;try{const bytes=fs.readFileSync(reportPath);result=JSON.parse(bytes);fs.writeFileSync(path.join(folder,'results',name+'.json'),bytes);}catch(e){error=String(e);}
 if(prior!==null)fs.writeFileSync(reportPath,prior);else fs.rmSync(reportPath,{force:true});
 const checks=result?.checks||[],failed=checks.filter(c=>c.passed!==true);
 const passed=outcome.exitCode===0&&!error&&!result?.failure&&!result?.error&&result?.passed!==false&&checks.length>=min&&failed.length===0&&result?.integrationFixture!==true;
 const row={name,script,scriptSHA256:hash(fs.readFileSync(path.join(root,script))),report:path.relative(root,path.join(folder,'results',name+'.json')),reportSHA256:fs.existsSync(path.join(folder,'results',name+'.json'))?hash(fs.readFileSync(path.join(folder,'results',name+'.json'))):null,log:path.relative(root,logPath),...outcome,elapsedMs:Date.now()-start,effectiveTimeoutMs:timeoutMs,checks:checks.length,passedChecks:checks.length-failed.length,minimumChecks:min,passed,failedChecks:failed.map(c=>c.name||c.id),failure:result?.failure||result?.error||null,error:error||null};
 runs.push(row);console.log(name,passed?'PASS':'FAIL',row.passedChecks+'/'+row.checks);return row;
}
async function pool(items,limit=3){let cursor=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(cursor<items.length)await run(items[cursor++]);}));}
(async()=>{
 const selected=only.length?rows.filter(r=>only.includes(r[0])):rows;
 if(only.some(n=>!rows.some(r=>r[0]===n)))throw Error('Unknown test group');
 let retryHistory=[];
 if(process.argv.includes('--retry-failed')){
  if(only.length)throw Error('Targeted retry requires the full suite and cannot select individual groups');
  const suitePath=path.join(folder,'suite.json'),previousBytes=fs.readFileSync(suitePath),previous=JSON.parse(previousBytes);
  const sameSnapshot=(a,b)=>a&&b&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&a[k]===b[k]);
  if(previous.schema!=='storyworld.r95-full-audit/v1'||previous.fullSuite!==true||previous.groups!==rows.length||previous.expectedGroups!==rows.length||!Array.isArray(previous.runs)||previous.runs.length!==rows.length||previous.sourceUnchangedDuringRun!==true||previous.changedFiles?.length!==0||!sameSnapshot(previous.sourceHashes,before))throw Error('Retry requires a complete previous audit and the exact unchanged runtime/client-source snapshot');
  const byName=new Map(previous.runs.map(r=>[r.name,r]));
  if(byName.size!==rows.length||rows.some(r=>!byName.has(r[0]))||!Array.isArray(previous.selectedGroups)||previous.selectedGroups.length!==rows.length||new Set(previous.selectedGroups).size!==rows.length||rows.some(r=>!previous.selectedGroups.includes(r[0])))throw Error('Previous suite group identities differ');
  const reused=[],failed=[];
  for(const spec of rows){
   const [name,script,,min]=spec,old=byName.get(name),expectedReport=path.relative(root,path.join(folder,'results',name+'.json')),expectedLog=path.relative(root,path.join(folder,'logs',name+'.log'));
   if(old.script!==script||old.minimumChecks!==min||old.report!==expectedReport||old.log!==expectedLog||old.scriptSHA256!==hash(fs.readFileSync(path.join(root,script))))throw Error('Prior test contract/script changed: '+name);
   if(old.passed===true){
    const bytes=fs.readFileSync(path.join(root,old.report)),result=JSON.parse(bytes),checks=result.checks;
    if(old.exitCode!==0||old.signal||old.error||old.failure||!Array.isArray(checks)||checks.length!==old.checks||old.passedChecks!==checks.length||checks.length<min||checks.some(c=>c.passed!==true)||result.failure||result.error||result.passed===false||result.integrationFixture===true||(old.reportSHA256&&old.reportSHA256!==hash(bytes)))throw Error('Prior successful result no longer verifies: '+name);
    reused.push({...old,reportSHA256:hash(bytes),reusedFromPrevious:true,revalidatedAt:startedAt});
   }else if(old.passed===false)failed.push(spec);
   else throw Error('Previous group lacks an explicit pass/fail result: '+name);
  }
  if(previous.passedGroups!==reused.length||!Array.isArray(previous.failedGroups)||previous.failedGroups.length!==failed.length||failed.some(r=>!previous.failedGroups.includes(r[0]))||previous.passedChecks!==previous.runs.reduce((n,r)=>n+r.passedChecks,0)||previous.totalChecks!==previous.runs.reduce((n,r)=>n+r.checks,0))throw Error('Previous suite totals do not match its group evidence');
  if(!failed.length)throw Error('No failed groups to retry');
  // Preserve the original suite and failed artifacts before any rerun overwrites
  // a path. A later successful report cannot erase the initial kill/failure.
  retryHistory=[...(previous.retryHistory||[])];
  const historyDir=path.join(folder,'retry-history',String(retryHistory.length+1).padStart(3,'0'));
  fs.mkdirSync(historyDir,{recursive:true});
  if(fs.existsSync(path.join(historyDir,'suite.json')))throw Error('Retry history already exists');
  fs.writeFileSync(path.join(historyDir,'suite.json'),previousBytes);
  const artifacts=[];
  for(const spec of failed){const old=byName.get(spec[0]);for(const key of ['log','report']){const source=path.join(root,old[key]);if(fs.existsSync(source)){const bytes=fs.readFileSync(source),target=path.join(historyDir,old.name+(key==='log'?'.log':'.json'));fs.writeFileSync(target,bytes);artifacts.push({group:old.name,kind:key,path:path.relative(root,target),sha256:hash(bytes),bytes:bytes.length});}}}
  retryHistory.push({startedAt,previousCompletedAt:previous.completedAt,previousSuite:path.relative(root,path.join(historyDir,'suite.json')),previousSuiteSHA256:hash(previousBytes),previousPassedChecks:previous.passedChecks,previousTotalChecks:previous.totalChecks,failedRuns:previous.runs.filter(r=>!r.passed),revalidatedSuccessfulGroups:reused.map(r=>r.name),artifacts,scope:'Only prior failed groups; exact original runtime/client hashes and all test script hashes revalidated; every successful report checked again'});
  runs.push(...reused);
  console.log('RETRY revalidated',reused.length,'successful groups; rerunning',failed.map(r=>r[0]).join(','));
  await pool(failed,3);
 }else{
  await pool(selected.filter(r=>['hospital-maze','world-runtime'].includes(r[0])),2);
  // Retain failures and continue collecting independent results. Never infer pass from an older report.
  await pool(selected.filter(r=>!['hospital-maze','world-runtime'].includes(r[0])),3);
 }
 const after=snapshot(),changed=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(p=>before[p]!==after[p]);
 const report={schema:'storyworld.r95-full-audit/v1',startedAt,completedAt:new Date().toISOString(),environment:{node:process.version,platform:process.platform},method:'Inherited 49-group gate (the stale pre-R89 map-focus assertion is replaced by four current cutaway invariants; original baseline failure retained), 3 R90 presentation groups and 6 R95 regression groups. Node VM gameplay, Python image/hash verification, Three CPU geometry and loopback HTTP; synthetic positioning/damage/invulnerability as recorded by each script. Historical report files restored after each group. All groups attempted, including after a failure. A targeted retry requires identical runtime/client hashes, unchanged test scripts and revalidated successful report contents; failed-run artifacts are retained. No browser/GPU/natural-play claim.',groups:runs.length,expectedGroups:selected.length,fullSuite:selected.length===rows.length,selectedGroups:selected.map(r=>r[0]),passedGroups:runs.filter(r=>r.passed).length,failedGroups:runs.filter(r=>!r.passed).map(r=>r.name),passed:runs.length===selected.length&&runs.every(r=>r.passed)&&changed.length===0,passedChecks:runs.reduce((n,r)=>n+r.passedChecks,0),totalChecks:runs.reduce((n,r)=>n+r.checks,0),sourceUnchangedDuringRun:changed.length===0,changedFiles:changed,sourceHashes:before,runs,retryHistory,browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
 fs.writeFileSync(path.join(folder,'suite.json'),JSON.stringify(report,null,2)+'\n');
 console.log('FINAL',report.passed?'PASS':'FAIL',report.passedChecks+'/'+report.totalChecks,report.failedGroups.join(','));if(!report.passed)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
