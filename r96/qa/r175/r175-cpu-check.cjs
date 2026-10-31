// R175 CPU check: pixelfx(MIT) 잡몹 타격 모양 10종(지역 서사별) — 회색 시트 + 게임에서 그 몹의 고유색·보조색으로 물들이기.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['pixelfx-r163.js','play-r169.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
const dir=path.join(R,'runtime-text','assets','r163','pixelfx'),idx=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
const names=['domestic','forge','memory','neural','clinical','garden','stone','snow','coast','regional'].map(n=>'mob-'+n),bad=[];
for(const n of names){const e=idx.effects[n];if(!e){bad.push(n+':missing');continue;}const b=fs.readFileSync(path.join(dir,e.file));if(crypto.createHash('sha256').update(b).digest('hex')!==e.sha256)bad.push(n+':sha');if(b.length>400000)bad.push(n+':size');if(!/GRAY|#050505/.test(JSON.stringify(e.options)))bad.push(n+':palette');}
ok('10 grey mob-hit sheets with source, options and sha256 recorded (each < 400 KB)',!bad.length,bad);
ok('pixelfx player tints a sheet by the mob palette (dark → unique → secondary → white), cached as static canvas',/function tintedSheet\(name,im,t\)/.test(C('pixelfx-r163.js'))&&/__storyworldStaticTint=true/.test(C('pixelfx-r163.js'))&&/tint:o\.tint\|\|null/.test(C('pixelfx-r163.js')));
ok('a sheet that cannot be tinted is cached as the original (no retry every frame)',/catch\(e\)\{fail\(e\);c=im;\}/.test(C('pixelfx-r163.js')));
ok('mob hits play the region\'s pixelfx shape tinted with that mob\'s own palette, preloaded per map',/nm='mob-'\+\(PXFAM\[fam\]\|\|fam\)/.test(C('play-r169.js'))&&/tint:P\}/.test(C('play-r169.js'))&&/warm\?\.\(\['mob-'/.test(C('play-r169.js')));
ok('generator keeps existing sheets when only new names are rendered (R163_ONLY)',/R163_ONLY/.test(fs.readFileSync(path.join(R,'..','scripts','r163-pixelfx-sheets.py'),'utf8')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
