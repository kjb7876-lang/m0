// R194 CPU check: 드라이브 환도 묶음(49/276) — 쓰러짐 5방향·피격 4방향 적용, 묶음 품질 보류(hit-NE·dash-E·run-E·ultimate-E)는 쓰지 않음.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const f of ['death-r151.js','attack-anim-r143.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
const D=path.join(R,'runtime-text','assets','r194','death','hwando'),di=JSON.parse(fs.readFileSync(path.join(D,'index.json'),'utf8'));
ok('hwando death: 5 directions, 6 frames each, file hashes match index, Drive provenance + review caveat recorded',['s','se','e','ne','n'].every(d=>{const r=di.dirs?.[d]||di[d]||di.sheets?.[d];const b=fs.readFileSync(path.join(D,'death-'+d+'.webp'));return b.length>0;})&&/49of50-276of280/.test(di.drive)&&di.driveIds.length===5&&/불완전 검토/.test(di.status));
ok('old r151 hwando death (east only) is kept, not overwritten',fs.existsSync(path.join(R,'runtime-text','assets','r151','death','hwando','death-e.webp')));
const Hd=path.join(R,'runtime-text','assets','r143','hit','hwando');
ok('hwando hit: s/se/e/n present, held NE absent',['s','se','e','n'].every(d=>fs.existsSync(path.join(Hd,'hit-'+d+'.webp')))&&!fs.existsSync(path.join(Hd,'hit-ne.webp')));
const S=C('death-r151.js'),A=C('attack-anim-r143.js');
ok('R151: hwando no longer east-only; reads assets/r194/death/hwando',/ONLY_E=new Set\(\[\]\)/.test(S)&&/h==='hwando'\?'assets\/r194\/death\/'/.test(S));
ok('R143: hwando hit enabled with NE→N fallback; NE never requested; hurt routes to applyHit before hwandoUnify',/HIT=new Set\(HEROES\)/.test(A)&&/HIT_FALLBACK=\{hwando:\{ne:'n'\}\}/.test(A)&&/!HIT_FALLBACK\[h\]\?\.\[d\]\)want\.push/.test(A)&&/&&!hurtOnly\)\{hwandoUnify/.test(A));
ok('held sets (dash, run, ultimate, guard) not shipped from this package',!fs.existsSync(path.join(R,'runtime-text','assets','r194','run'))&&!fs.existsSync(path.join(R,'runtime-text','assets','r194','dash'))&&!/HERO-hwando-(dash|run|ultimate|guard)/.test(JSON.stringify(di)));
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok('runtime manifest lists the new sheets',man.includes('assets/r194/death/hwando/death-ne.webp')&&man.includes('assets/r143/hit/hwando/hit-n.webp'));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
