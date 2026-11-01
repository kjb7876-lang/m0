// R196 CPU check: 환도 피격·쓰러짐 시트를 걷기·공격 시트 색감에 맞춘 파생본 — 원본 보존, 색 차이 축소, 코드가 파생본을 읽음.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const A=path.join(R,'runtime-text','assets'),D=path.join(A,'r196','hwando'),ix=JSON.parse(fs.readFileSync(path.join(D,'index.json'),'utf8'));
ok('9 derivatives: hit s/se/e/n + death s/se/e/ne/n (no hit-ne)',ix.files.length===9&&!ix.files.some(f=>f.file==='hit-ne.webp'),ix.files.map(f=>f.file));
ok('every derivative hash/size matches index.json',ix.files.every(f=>{const b=fs.readFileSync(path.join(D,f.file));return b.length===f.bytes&&sha(b)===f.sha256;}));
ok('Drive-derived sources are kept unchanged (hash matches what the derivative was made from)',ix.files.every(f=>sha(fs.readFileSync(path.join(A,f.source)))===f.sourceSha256));
const gap=(x,r)=>Math.abs(x.a-r.a)+Math.abs(x.b-r.b)+Math.abs(x.chroma-r.chroma);
ok('tint gap to the same-direction walk+attack reference shrinks for every sheet and ends small (<1.5)',ix.files.every(f=>gap(f.after,f.referenceStats)<gap(f.before,f.referenceStats)&&gap(f.after,f.referenceStats)<1.5),ix.files.map(f=>[f.file,+gap(f.before,f.referenceStats).toFixed(2),+gap(f.after,f.referenceStats).toFixed(2)]));
ok('brightness moves toward the reference (never further away)',ix.files.every(f=>Math.abs(f.after.L-f.referenceStats.L)<=Math.abs(f.before.L-f.referenceStats.L)+.05));
ok('attack-anim-r143 reads hwando hit from r196, other heroes unchanged',/act==='hit'&&h==='hwando'\?'assets\/r196\/hwando\/hit-'/.test(C('attack-anim-r143.js'))&&/'assets\/r143\/'\+act\+'\/'\+h/.test(C('attack-anim-r143.js')));
ok('death-r151 reads hwando death from r196, other heroes r151',/h==='hwando'\?'assets\/r196\/hwando\/death-'/.test(C('death-r151.js'))&&/'assets\/r151\/death\/'\+h/.test(C('death-r151.js')));
for(const f of ['attack-anim-r143.js','death-r151.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
ok('runtime manifest lists the derivatives',fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('assets/r196/hwando/death-ne.webp'));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
