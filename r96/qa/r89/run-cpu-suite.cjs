'use strict';
// R89 CPU regression run on the Windows test PC. Same groups, scripts, report
// paths and pass rule as qa/r88/run-suite.cjs; Python groups are recorded as
// NOT RUN because this PC has no Python. Writes qa/r89/cpu-suite.json and
// never touches the frozen R88 evidence (qa/r88/final-suite.json).
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),site=path.join(root,'hospital-three-pc/site'),logs=path.join(__dirname,'cpu-logs');
fs.mkdirSync(logs,{recursive:true});
// Group list parsed from the R88 runner so both stay identical.
const r88=fs.readFileSync(path.join(root,'qa/r88/run-suite.cjs'),'utf8');
const rows=[...r88.matchAll(/\['([^']+)','([^']+)','([^']+)',(\d+)(?:,(\d+))?\]/g)].map(m=>[m[1],m[2],m[3],Number(m[4]),m[5]?Number(m[5]):240000]);
const only=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function snapshot(){const m=JSON.parse(fs.readFileSync(path.join(site,'web-manifest-r62.json')));return Object.fromEntries([...m.files.map(r=>r.path),'web-manifest-r62.json'].sort().map(p=>[p,hash(fs.readFileSync(path.join(site,p)))]));}
const before=snapshot(),startedAt=new Date().toISOString(),runs=[];
async function run([name,script,report,min,timeoutMs]){
 if(script.endsWith('.py')){const row={name,script,report,notRun:true,reason:'Python is not installed on this Windows test PC',passed:null};runs.push(row);console.log(name,'NOT RUN (python)');return null;}
 const p=path.join(root,report);fs.rmSync(p,{force:true});
 const logPath=path.join(logs,name+'.log'),fd=fs.openSync(logPath,'w'),start=Date.now();
 const outcome=await new Promise(resolve=>{let done=false;const child=spawn(process.execPath,[path.join(root,script)],{cwd:root,stdio:['ignore',fd,fd]});const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);const finish=v=>{if(done)return;done=true;clearTimeout(timer);fs.closeSync(fd);resolve(v);};child.on('error',e=>finish({error:String(e)}));child.on('exit',(code,signal)=>finish({exitCode:code,signal}));});
 let result,error;try{result=JSON.parse(fs.readFileSync(p));}catch(e){error=String(e);}
 const checks=result?.checks||[],failed=checks.filter(c=>c.passed!==true).map(c=>c.name||c.id||JSON.stringify(c).slice(0,160));
 const passed=outcome.exitCode===0&&!error&&!result?.failure&&checks.length>=min&&checks.every(c=>c.passed===true)&&result?.integrationFixture!==true;
 const row={name,script,report,...outcome,elapsedMs:Date.now()-start,checks:checks.length,passedChecks:checks.length-failed.length,minimumChecks:min,passed,failedChecks:failed.slice(0,20),failure:result?.failure||null,error:error||null,log:path.relative(root,logPath)};
 runs.push(row);console.log(name,passed?'PASS':'FAIL',row.passedChecks+'/'+row.checks,failed.length?('failed: '+failed.slice(0,3).join(' | ')):'');return passed;
}
async function pool(items,limit=3){let cursor=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(cursor<items.length)await run(items[cursor++]);}));}
(async()=>{
 const list=only.length?rows.filter(r=>only.includes(r[0])):rows;
 // The R88 runner seeds checkpoints with the first two groups before the rest.
 await pool(list.slice(0,2),2);await pool(list.slice(2),3);
 const after=snapshot(),changed=Object.keys(before).filter(p=>before[p]!==after[p]);
 const ran=runs.filter(r=>!r.notRun);
 const report={schema:'r89-windows-cpu-suite/v1',startedAt,completedAt:new Date().toISOString(),environment:{os:process.platform,node:process.version,python:false},
  method:'R88 frozen-suite groups (Node VM gameplay, Three CPU geometry, manifests, loopback HTTP). Assisted positioning/damage/invulnerability inside the scripts as in R88. Python groups not run here.',
  groups:runs.length,ran:ran.length,notRun:runs.filter(r=>r.notRun).map(r=>r.name),passedGroups:ran.filter(r=>r.passed).length,failedGroups:ran.filter(r=>!r.passed).map(r=>r.name),
  passedChecks:ran.reduce((n,r)=>n+r.passedChecks,0),totalChecks:ran.reduce((n,r)=>n+r.checks,0),sourceUnchangedDuringRun:changed.length===0,changedFiles:changed,runs,
  browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
 fs.writeFileSync(path.join(__dirname,only.length?'cpu-suite-partial.json':'cpu-suite.json'),JSON.stringify(report,null,2)+'\n');
 console.log('DONE ran',report.ran,'passedGroups',report.passedGroups,'failedGroups',report.failedGroups.join(',')||'-','checks',report.passedChecks+'/'+report.totalChecks);
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
