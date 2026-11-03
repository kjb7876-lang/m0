// R271 CPU check: 환도 통합 v2 정리판(걷기 4방향·대기 4방향·공격 E) 오버레이 연결·자산 목록·몸 키·안전장치.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('hwando-r271.js'),idx=RT('index.html');
ok('runtime copy matches; loads after hwando-r242 and before combat-r118; in verify list and CI',RT('hwando-r271.js')===src&&idx.indexOf('hwando-r242.js')<idx.indexOf('hwando-r271.js')&&idx.indexOf('hwando-r271.js')<idx.indexOf('combat-r118.js')&&/'hwando-r271\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/r271-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const A=path.join(R,'runtime-text','assets','r271','hwando'),I=JSON.parse(fs.readFileSync(path.join(A,'index.json'),'utf8'));
const recs=[];for(const [k,v] of Object.entries(I.anims))for(const [d,r] of Object.entries(v))if(r&&r.file)recs.push([k,d,r]);
ok('index lists walk N/E/W 12 + S 8, idle N/S/E/W 13, attack E 12',['n','e','w'].every(d=>I.anims.walk[d]?.n===12)&&I.anims.walk.s?.n===8&&['n','s','e','w'].every(d=>I.anims.idle[d]?.n===13)&&I.anims.attack.e?.n===12&&recs.length===9);
ok('every atlas exists, matches sha256/bytes, ≤4096 px wide, ms per cell',recs.every(([k,d,r])=>{const b=fs.readFileSync(path.join(A,r.file));return b.length===r.bytes&&crypto.createHash('sha256').update(b).digest('hex')===r.sha256&&r.atlas[0]<=4096&&r.ms.length===r.n;}));
ok('body height normalised to ~180 px in every clip (source 212–242)',recs.every(([k,d,r])=>Math.abs(r.body-180)<=6),recs.map(([k,d,r])=>k+d+':'+r.body));
ok('every source records drive id, zip sha256, applied flag',I.source.length===9&&I.source.every(s=>/^[\w-]{20,}$/.test(s.drive_id)&&/^[0-9a-f]{64}$/.test(s.zip_sha256)&&s.applied===true));
ok('missing anims (N/S attack, hit) fall back to R242 art; W attack mirrors E',/__STORYWORLD_HWANDO_R242__\?\.index\?\.\(\)/.test(src)&&/dir==='w'&&N\?\.e\?\.file/.test(src));
ok('R242 yields while R271 is active (no double draw / preload)',(C('hwando-r242.js').match(/__STORYWORLD_HWANDO_R271__\?\.active\?\.\(\)/g)||[]).length===2);
ok('attack visual skips windup and fits attack interval (judgement unchanged)',/contactStart/.test(src)&&/attackCD/.test(src)&&!/hitEnemy|basicAttack=/.test(src));
ok('off switch storyworld.r271.hwando; only solo live hwando',/storyworld\.r271\.hwando/.test(src)&&/solo\(\)&&player\?\.hero==='hwando'&&player\.hp>0/.test(src));
ok('runtime manifest lists the overlay and all atlases',(()=>{const m=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');return m.includes('hwando-r271.js')&&recs.every(([k,d,r])=>m.includes('assets/r271/hwando/'+r.file))&&m.includes('assets/r271/hwando/index.json');})());
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R271 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
