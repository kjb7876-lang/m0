// R284 미카엘라 북동(북서=반전) 달리기 v5 — 오른쪽 달리기 다리를 좁혀 두 다리가 갈라져 번갈기(v4 는 두 발이 한 줄에 겹쳐 꼬여 보임).
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const H=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const v=C('visual-r119.js'),idx=JSON.parse(RT('assets/r284/michaela/index.json'));
ok('runtime copy matches; NE walk uses v5 by default, {run284:false} falls back to v4',RT('visual-r119.js')===v&&/ne:prefs\.run284!==false\?'assets\/r284\/michaela\/run-ne-v5\.webp':prefs\.run229!==false\?'assets\/r229\/michaela\/run-ne-v4\.webp'/.test(v)&&/'run229','run284'\]\)if\(typeof s\?\.\[k\]==='boolean'\)prefs\[k\]=s\[k\]/.test(v));
const b=fs.readFileSync(path.join(R,'runtime-text',idx.path));
ok('v5 sheet exists with recorded size/sha256',b.length===idx.bytes&&H(b)===idx.sha256);
ok('sources recorded by hash and left untouched (NE v2 upper body, E run legs)',H(fs.readFileSync(path.join(R,'runtime-text',idx.source.upper.path)))===idx.source.upper.sha256&&H(fs.readFileSync(path.join(R,'runtime-text',idx.source.legs.path)))===idx.source.legs.sha256&&/run-e\.webp$/.test(idx.source.legs.path));
ok('same sheet layout (8 cells 192x256, foot pivot 96,226)',idx.cols===8&&idx.rows===1&&idx.cell[0]===192&&idx.cell[1]===256&&idx.pivot[0]===96&&idx.pivot[1]===226);
const L=idx.legSeparation,sum=a=>a.reduce((s,x)=>s+x[0],0),wide=a=>a.filter(x=>x[1]>=30).length;
ok('legs visibly apart: two-leg rows ≥3× v4, gap ≥30 px in ≥4 of 8 cells (v4: none)',L&&sum(L.v5)>=3*sum(L.v4)&&wide(L.v5)>=4&&wide(L.v4)===0,L);
ok('in the CI workflow; generator script exists',/qa\/r284\/r284-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8'))&&fs.existsSync(path.join(R,'..','scripts','r284-michaela-ne-legs.py')));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`R284 ${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
