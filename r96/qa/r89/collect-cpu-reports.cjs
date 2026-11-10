'use strict';
// Re-reads the per-group reports written by run-cpu-suite.cjs (same pass rule
// except exit code, which is not recorded in the report). Used when the runner
// itself was interrupted; groups without a fresh report are listed as missing.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),since=Date.parse(process.argv[2]||'2026-10-23T12:00:00Z');
const r88=fs.readFileSync(path.join(root,'qa/r88/run-suite.cjs'),'utf8');
const rows=[...r88.matchAll(/\['([^']+)','([^']+)','([^']+)',(\d+)(?:,(\d+))?\]/g)].map(m=>({name:m[1],script:m[2],report:m[3],min:Number(m[4])}));
const out=rows.map(r=>{if(r.script.endsWith('.py'))return{...r,status:'NOT RUN (python)'};const p=path.join(root,r.report);let st;try{st=fs.statSync(p);}catch{return{...r,status:'MISSING'};}
 if(st.mtimeMs<since)return{...r,status:'STALE'};let j;try{j=JSON.parse(fs.readFileSync(p,'utf8'));}catch(e){return{...r,status:'UNREADABLE'};}
 const checks=j.checks||[],failed=checks.filter(c=>c.passed!==true);const pass=!j.failure&&checks.length>=r.min&&!failed.length&&j.integrationFixture!==true;
 return{...r,status:pass?'PASS':'FAIL',checks:checks.length,passed:checks.length-failed.length,failed:failed.slice(0,8).map(c=>c.name||c.id||JSON.stringify(c).slice(0,200)),failure:j.failure||null};});
for(const r of out)console.log(r.status.padEnd(16),r.name.padEnd(30),r.checks!=null?r.passed+'/'+r.checks:'',r.failed?.length?' -> '+r.failed.join(' | ').slice(0,400):'',r.failure?' FAILURE '+String(r.failure).slice(0,200):'');
fs.writeFileSync(path.join(__dirname,'cpu-collected.json'),JSON.stringify({collectedAt:new Date().toISOString(),rows:out},null,2)+'\n');
