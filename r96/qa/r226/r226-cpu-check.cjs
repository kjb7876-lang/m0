// R226 CPU check: 미카엘라 북동(북서=좌우 반전) 달리기 v3 — 5~8칸 다리가 1~4칸 다리의 좌우 반전이라 두 다리가 번갈아 나간다.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const v=C('visual-r119.js'),idx=JSON.parse(RT('assets/r226/michaela/index.json'));
ok('runtime copy matches; NE walk uses the v3 sheet, switchable back to v2 ({run226:false})',RT('visual-r119.js')===v&&/RUN226=\{michaela:\{ne:'assets\/r226\/michaela\/run-ne-v3\.webp'\}\}/.test(v)&&/prefs\.run226!==false&&RUN226\[hero\]\?\.\[v\]/.test(v));
const b=fs.readFileSync(path.join(R,'runtime-text',idx.path)),src=fs.readFileSync(path.join(R,'runtime-text',idx.source.path));
ok('v3 sheet exists with recorded size/sha256, made from the v2 sheet (hash recorded), original untouched',b.length===idx.bytes&&crypto.createHash('sha256').update(b).digest('hex')===idx.sha256&&crypto.createHash('sha256').update(src).digest('hex')===idx.source.sha256);
ok('same sheet layout as before (8 cells 192x256, foot pivot 96,226)',idx.cols===8&&idx.rows===1&&idx.cell[0]===192&&idx.cell[1]===256&&idx.pivot[0]===96&&idx.pivot[1]===226);
ok('frames 5-8 take mirrored legs from frames 1-4',JSON.stringify(idx.mirroredLegsFrames)==='[5,6,7,8]'&&JSON.stringify(idx.legsFrom)==='[1,2,3,4]');
ok('in the CI workflow; generator script exists',/qa\/r226\/r226-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8'))&&fs.existsSync(path.join(R,'..','scripts','r226-michaela-ne-legs.py')));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
