// R201 CPU check: 영웅 기본팩 추가 동작(미카엘라 스킬·궁극기 S/E, 로렌 스킬 S/E·궁극기 S/SE/E·방어 S/E·대시 S)만 실제 동작으로,
// 없는 방향은 기존 그림, 원본 sha 기록, 동작별 발 기준점, 방어는 들어올린 뒤 유지, 대시는 이동 방향.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const WANT={michaela:{skill:[['s','e'],6],ultimate:[['s','e'],8]},lauren:{skill:[['s','e'],6],ultimate:[['s','se','e'],8],guard:[['s','e'],4],dash:[['s'],4]}};
const S=C('attack-anim-r143.js');
for(const [h,acts] of Object.entries(WANT))for(const [act,[dirs,n]] of Object.entries(acts)){const ix=JSON.parse(RT('assets/r143/'+act+'/'+h+'/index.json'));
 ok(h+' '+act+': directions '+dirs.join('/')+', '+n+' real frames, hashes match, Drive source sha recorded',Object.keys(ix.directions).sort().join()===[...dirs].sort().join()&&Object.values(ix.directions).every(r=>{const b=fs.readFileSync(path.join(R,'runtime-text',r.path));return r.frames===n&&b.length===r.bytes&&sha(b)===r.sha256&&r.source.files.every(f=>/^[0-9a-f]{64}$/.test(f.sha256));}),Object.keys(ix.directions));
 ok(h+' '+act+': engine foot line equals measured footY per direction',dirs.every(d=>new RegExp("'"+h+':'+act+"':\\{[^}]*\\b"+d+':'+ix.directions[d].footY+'\\b').test(S)));}
ok('lauren dash S came from four separate PNGs (rect order kept)',JSON.parse(RT('assets/r143/dash/lauren/index.json')).directions.s.source.files.length===4);
ok('engine table lists exactly the delivered sets',/SKILLSET=\{michaela:\{skill:\['s','e'\],ultimate:\['s','e'\]\},lauren:\{skill:\['s','e'\],ultimate:\['s','se','e'\],guard:\['s','e'\],dash:\['s'\]\}\}/.test(S));
ok('missing directions fall back to the existing art',/if\(!SKILLSET\[h\]\[act\]\.includes\(sd\)\)return false;/.test(S));
ok('guard raises over 4 cells then holds the last; dash follows movement direction',S.includes("act==='guard'?Math.min(3,Math.floor((now-cast.t0)/.08))")&&S.includes("cast.dir=act==='dash'?(r119Stats().walkDir||FOUR[player.direction]||'s'):dirNow()"));
ok('hook runs after hit handling',S.indexOf('applyAct(rec,st))return r;')>S.indexOf('applyHit(rec,st);return r;'));
ok('preloads the new sheets',/for\(const \[act,ds\] of Object\.entries\(SKILLSET\[h\]\|\|\{\}\)\)for\(const d of ds\)want\.push\(pathOf\(h,d,act\)\)/.test(S));
ok('runtime copy matches',RT('attack-anim-r143.js')===S);
ok('runtime manifest lists the sheets',['assets/r143/ultimate/michaela/ultimate-e.webp','assets/r143/dash/lauren/dash-s.webp','assets/r143/guard/lauren/guard-e.webp'].every(p=>fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes(p)));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
