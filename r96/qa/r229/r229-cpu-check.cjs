// R229 CPU check: 미카엘라 북동(북서=좌우 반전) 달리기 v4 — 북쪽 달리기 다리(번갈아 나가는 한 바퀴)를 북동 윗몸 밑에.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const v=C('visual-r119.js'),idx=JSON.parse(RT('assets/r229/michaela/index.json')),H=b=>crypto.createHash('sha256').update(b).digest('hex');
ok('runtime copy matches; NE walk uses v4 by default, {run229:false} falls back to v3',RT('visual-r119.js')===v&&/ne:prefs\.run229!==false\?'assets\/r229\/michaela\/run-ne-v4\.webp':'assets\/r226\/michaela\/run-ne-v3\.webp'/.test(v));
ok('walk switches are read from the saved settings (run164/run164v2/run226/run229)',/'run164','run164v2','run226','run229'\]\)if\(typeof s\?\.\[k\]==='boolean'\)prefs\[k\]=s\[k\]/.test(v));
const b=fs.readFileSync(path.join(R,'runtime-text',idx.path));
ok('v4 sheet exists with recorded size/sha256',b.length===idx.bytes&&H(b)===idx.sha256);
ok('sources recorded by hash and left untouched (NE v2 upper body, N run legs)',H(fs.readFileSync(path.join(R,'runtime-text',idx.source.upper.path)))===idx.source.upper.sha256&&H(fs.readFileSync(path.join(R,'runtime-text',idx.source.legs.path)))===idx.source.legs.sha256);
ok('same sheet layout as before (8 cells 192x256, foot pivot 96,226)',idx.cols===8&&idx.rows===1&&idx.cell[0]===192&&idx.cell[1]===256&&idx.pivot[0]===96&&idx.pivot[1]===226);
ok('in the CI workflow; generator script exists',/qa\/r229\/r229-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8'))&&fs.existsSync(path.join(R,'..','scripts','r229-michaela-ne-legs.py')));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
