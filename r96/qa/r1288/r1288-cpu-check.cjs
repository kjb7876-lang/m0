// R1288 CPU 검사: 시스템 오류 기록 보존(error-log-r1288.js) — 연결 5곳 + vm 에서 기록·합치기·상한·자르기·종류·저장.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let pass=0,fail=0;
const ok=(n,c,d)=>{if(c)pass++;else fail++;console.log((c?'ok   ':'FAIL ')+n+(c||d===undefined?'':' '+JSON.stringify(d).slice(0,300)));};
const F='error-log-r1288.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok('runtime-text copy identical',fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src);
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok('index.html: once, right after pos-steady-r1234',html.split('"./'+F+'"').length===2&&/<script src="\.\/pos-steady-r1234\.js"><\/script>\n<script src="\.\/error-log-r1288\.js"><\/script>\n/.test(html));
ok('loads after R63R2 diagnostics (inline settings wrap)',html.indexOf('statusDiagnosticsR63R2')<html.indexOf('"./'+F+'"'));
ok('verify-r96-public.py lists it',fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1288/r1288-cpu-check.cjs'));
ok('manifest + inputs list it',['runtime-manifest.json','runtime-inputs.json'].every(f=>fs.readFileSync(path.join(R,f),'utf8').includes('"'+F+'"')));
// vm
function make(stored){
 const store=new Map(stored?[['storyworld.r1288.errors',stored]]:[]);const listeners={};const logged=[];
 const sb={console,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{},dataset:{},appendChild(){}})},
  innerWidth:1476,innerHeight:841,devicePixelRatio:1.25,
  addEventListener:(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);}};
 sb.window=sb;sb.globalThis=sb;
 sb.logError=function(e){logged.push(e);return String(e?.stack||e);};
 sb.showSettings=function(){return 'base';};
 vm.createContext(sb);
 vm.runInContext('var room={id:"u204",layer:"STORY",enemies:[{name:"기억 검열기",hp:26738,maxHp:92406,midboss:true,x:3,y:0},{name:"잡몹",hp:5,maxHp:5,x:1,y:0}]};var player={hero:"gunner",level:58,hp:777,ego:2.2,x:0,y:0};',sb);
 vm.runInContext(src,sb,{filename:F});
 return {sb,store,listeners,logged,api:sb.__STORYWORLD_ERROR_LOG_R1288__,fire:(t,ev)=>(listeners[t]||[]).forEach(f=>f(ev))};
}
let t=make();
ok('API frozen with list/text/clear/inspect',Object.isFrozen(t.api)&&['list','text','clear','inspect','record'].every(k=>typeof t.api[k]==='function'));
const e1=new Error('boom-1');t.fire('error',{message:'Uncaught Error: boom-1',error:e1});
let rows=t.api.list();
ok('async row has context: zone, hero, level, ego, nearest boss with hp, view',rows.length===1&&rows[0].kind==='async'&&rows[0].zone==='u204'&&rows[0].hero==='gunner'&&rows[0].level===58&&rows[0].ego===2.2&&rows[0].boss==='기억 검열기'&&rows[0].bossHp==='26738/92406'&&rows[0].view==='1476x841@1.25',rows[0]);
// engine path then window listener with the same object → one row, kind upgraded, count 1
const e2=new Error('boom-2');t.sb.logError(e2);t.fire('error',{message:'x',error:e2});
rows=t.api.list();const r2=rows.find(r=>r.message==='boom-2');
ok('same error object via engine then window → one row, kind async, count 1',rows.filter(r=>r.message==='boom-2').length===1&&r2.kind==='async'&&r2.count===1,r2);
ok('engine logError still called (wrapper passes through)',t.logged.includes(e2));
// different objects, same message+stack first line → merged count
for(let i=0;i<3;i++){const e=new Error('same');e.stack='Error: same\n    at foo (a.js:1:2)';t.fire('error',{message:'same',error:e});}
const s=t.api.list().find(r=>r.message==='same');ok('different objects with same signature merged, count 3',s&&s.count===3,s);
// promise
t.fire('unhandledrejection',{reason:new Error('rej')});ok('unhandled rejection kind promise',t.api.list().some(r=>r.message==='rej'&&r.kind==='promise'));
t.fire('unhandledrejection',{reason:'plain string'});ok('non-Error rejection kept as text',t.api.list().some(r=>r.message==='plain string'));
// window error without error object (cross-origin script)
t.fire('error',{message:'Script error.',filename:'https://x/y.js',lineno:3,colno:4,error:null});ok('no error object → message + file:line:col',t.api.list().some(r=>r.message==='Script error. @ y.js:3:4'));
t.fire('error',{message:''});ok('empty message ignored',!t.api.list().some(r=>r.message===''));
// caps
const big='x'.repeat(5000);const eb=new Error(big);t.fire('error',{message:big,error:eb});const rb=t.api.list().find(r=>r.message.startsWith('xxx'));
ok('message and stack cut to 2000',rb&&rb.message.length===2000&&rb.stack.length<=2000,rb&&[rb.message.length,rb.stack.length]);
for(let i=0;i<40;i++)t.fire('error',{message:'m'+i,error:new Error('m'+i)});rows=t.api.list();
ok('max 20 rows, newest kept, oldest dropped',rows.length===20&&rows[19].message==='m39'&&!rows.some(r=>r.message==='boom-1'),rows.length);
// persistence + reload
const saved=t.store.get('storyworld.r1288.errors');const t2=make(saved);ok('reload restores rows',t2.api.list().length===20&&t2.api.list()[19].message==='m39');
ok('text() newest first with header',/^#1 \[async\] .*\n.*u204/.test(t2.api.text())&&t2.api.text().indexOf('m39')<t2.api.text().indexOf('m38'));
t2.api.clear();ok('clear empties storage',t2.api.list().length===0&&t2.store.get('storyworld.r1288.errors')==='[]'&&t2.api.text()==='저장된 오류 없음');
const t3=make('{not json');ok('broken storage → empty, no throw',t3.api.list().length===0);
const t4=make(JSON.stringify([{message:5},null,{message:'ok',kind:'async'}]));ok('bad stored rows filtered',t4.api.list().length===1);
// off switch
{const store=new Map([['storyworld.r1288.log','0']]);const sb={localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},addEventListener:(t,f)=>{if(t==='error')sb._e=f;},document:{getElementById:()=>null,querySelector:()=>null},console};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);sb._e({message:'q',error:new Error('q')});ok('off switch records nothing',sb.__STORYWORLD_ERROR_LOG_R1288__.list().length===0&&!store.has('storyworld.r1288.errors'));}
ok('showSettings wrapper returns base result',t.sb.showSettings()==='base');
ok('no game state written (only storyworld.r1288.* keys)',[...t.store.keys()].every(k=>k.startsWith('storyworld.r1288.')));
console.log(fail?`R1288 CPU ${fail} failed`:`R1288 CPU PASSED ${pass}/${pass}`);process.exit(fail?1:0);
