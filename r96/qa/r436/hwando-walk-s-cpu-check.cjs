// R436 환도 아래 걷기 v2 — 자산 무결성·다른 방향과의 일관성(몸 키·발 기준점·칸 수·색 목표)·연결 정적 검사(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const I=JSON.parse(RT('assets/r436/hwando/index.json')),A=I.walk.s,B=fs.readFileSync(path.join(R,'runtime-text','assets/r436/hwando',A.file));
const O=JSON.parse(RT('assets/r271/hwando/index.json')).anims.walk,T=JSON.parse(RT('assets/r283/hwando/index.json')).target;
ok('atlas exists, sha256/bytes match, 6 cells in one row',B.length===A.bytes&&crypto.createHash('sha256').update(B).digest('hex')===A.sha256&&A.n===6&&A.cols===6&&A.atlas[0]===6*A.cell[0]&&A.atlas[1]===A.cell[1]);
ok('body height ~180 like R271 N/E/W (±3 px)',['n','e','w'].every(d=>Math.abs(A.body-O[d].body)<=3)&&Math.abs(A.body-180)<=3,{s:A.body});
ok('cell height within R271 walk range, anchor on foot line near cell bottom',A.cell[1]>=185&&A.cell[1]<=196&&A.anchor[1]>=A.cell[1]-10&&A.anchor[1]<=A.cell[1]&&A.anchor[0]>0&&A.anchor[0]<A.cell[0],A);
ok('foot jitter small (≤8 px, R271 N/S were 8)',A.measured.foot_jitter_px<=8,A.measured);
ok('colour matched to R283 target (p10/p50/p90 ±.02, sat ±.02)',['p10','p50','p90','sat'].every(k=>Math.abs(A.color.after[k]-T[k])<=.02),A.color.after);
ok('6 keys = two steps (frames_per_stride 6) so stride length equals other directions',A.frames_per_stride===6&&/frames_per_stride/.test(C('hwando-r271.js')));
ok('source recorded (zip sha256, 6 frame hashes), original R271 walk-s kept untouched',/^[0-9a-f]{64}$/.test(I.source.zip_sha256)&&I.source.frames_rgba_sha256.length===6&&O.s.n===8&&fs.existsSync(path.join(R,'runtime-text','assets/r271/hwando/walk-s.webp')));
ok('wired: R277 walkDir returns s with off switch, R271 uses clip only for walking',/storyworld\.r436\.hwandoWalkS/.test(C('hwando-r277.js'))&&/return walkS\?'s':h/.test(C('hwando-r277.js'))&&/\{s:!!ws\}/.test(C('hwando-r271.js')));
ok('runtime manifest lists the clip and index',(()=>{const m=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');return m.includes('assets/r436/hwando/walk-s.webp')&&m.includes('assets/r436/hwando/index.json');})());
ok('no gameplay writes',!/attackCD\s*=|\.damage\s*=|saveGame/.test(C('hwando-r277.js')));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R436 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
