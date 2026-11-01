// R201 CPU check: 미카엘라 기본팩 스킬 6칸·궁극기 8칸 S/E 만 실제 동작으로, 없는 방향은 기존 그림, 원본 해시 기록, 발 기준점 동작별.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [act,n] of [['skill',6],['ultimate',8]]){const ix=JSON.parse(RT('assets/r143/'+act+'/michaela/index.json'));
 ok(act+': S/E only, '+n+' real frames each, hashes match, Drive source sha recorded',Object.keys(ix.directions).join()==='s,e'&&Object.values(ix.directions).every(r=>{const b=fs.readFileSync(path.join(R,'runtime-text',r.path));return r.frames===n&&b.length===r.bytes&&sha(b)===r.sha256&&b.readUInt32LE(0)===0x46464952&&/^[0-9a-f]{64}$/.test(r.source.sha256);})&&ix.missing.join()==='se,ne,n');}
const S=C('attack-anim-r143.js');
ok('R143 knows the michaela skill/ultimate set and only those directions',/SKILLSET=\{michaela:\{skill:\['s','e'\],ultimate:\['s','e'\]\}\}/.test(S));
ok('missing directions fall back to the existing art (no forced frame)',/if\(!SKILLSET\[h\]\[act\]\.includes\(sd\)\)return false;/.test(S));
ok('per-action foot line (E cells sit 6px lower than walk)',/ACT_FOOT=\{'michaela:skill':\{s:227,e:232\},'michaela:ultimate':\{s:226,e:231\}\}/.test(S)&&/ACT_FOOT\[h\+':'\+act\]\?\.\[sd\]\?\?/.test(S));
ok('skill/ultimate hook runs after hit and never during dash/guard',S.indexOf('applySkill(rec,st))return r;')>S.indexOf('applyHit(rec,st);return r;')&&/\(player\.skillAnim>0\|\|player\.ultimateAnim>0\)&&!\(player\.dashAnim>0\|\|player\.guard\)/.test(S));
ok('preloads the new sheets',/for\(const \[act,ds\] of Object\.entries\(SKILLSET\[h\]\|\|\{\}\)\)for\(const d of ds\)want\.push\(pathOf\(h,d,act\)\)/.test(S));
ok('runtime copy matches',RT('attack-anim-r143.js')===S);
ok('runtime manifest lists the sheets',fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('assets/r143/ultimate/michaela/ultimate-e.webp'));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
