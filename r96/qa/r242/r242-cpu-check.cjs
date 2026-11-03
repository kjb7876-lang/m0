// R242 CPU check: 환도 최신 선택 자산(걷기8·대기·피격·전투 준비·공격) 오버레이 연결·자산 목록·안전장치.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('hwando-r242.js'),idx=RT('index.html');
ok('runtime copy matches; loads after auto-levelup-r237; in verify list and CI',RT('hwando-r242.js')===src&&idx.includes('<script src="./auto-levelup-r237.js"></script><script src="./hwando-r242.js"></script>')&&/'hwando-r242\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r242\/r242-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const A=path.join(R,'runtime-text','assets','r242','hwando'),I=JSON.parse(fs.readFileSync(path.join(A,'index.json'),'utf8'));
const recs=[];for(const [k,v] of Object.entries(I.anims))for(const [d,r] of Object.entries(v))if(r&&r.file)recs.push([k,d,r]);
ok('index lists walk(N/S/E 8), idle·hit(N/S/E), ready(N/E), attack(S/E 13, N 25 slots), toReady(N/E 3) — W mirrors E',
 ['n','s','e'].every(d=>I.anims.walk[d]?.n===8&&I.anims.idle[d]&&I.anims.hit[d])&&I.anims.ready.n&&I.anims.ready.e&&!I.anims.ready.s&&I.anims.attack.n.n===25&&I.anims.attack.s.n===13&&I.anims.attack.e.n===13&&I.anims.toReady.n.n===3&&I.anims.toReady.e.n===3&&I.mirrorW==='E');
ok('every atlas file exists, matches its recorded sha256/bytes, stays ≤4096 px wide and has ms per cell',recs.every(([k,d,r])=>{const b=fs.readFileSync(path.join(A,r.file));return b.length===r.bytes&&crypto.createHash('sha256').update(b).digest('hex')===r.sha256&&r.atlas[0]<=4096&&r.ms.length===r.n&&r.cols*Math.ceil(r.n/r.cols)>=r.n;}),recs.filter(([k,d,r])=>r.atlas[0]>4096).map(x=>x[2].file));
const px=recs.reduce((s,[k,d,r])=>s+r.atlas[0]*r.atlas[1],0)*4/2**20;
ok('decoded RGBA total stays well under the 82 MiB of the raw packs (union crop)',px<40,px.toFixed(1)+' MiB');
ok('walk stride recorded from the art (one step ≈ 43.5 px, 8 frames = two steps) and used for distance-based frame advance',Math.abs(I.anims.walk.stride.step_px-43.5)<3&&/S\.dist\+=Math\.hypot\(px,py\)/.test(src)&&/px_per_frame/.test(src));
ok('attack visual skips the windup to just before contact and fits the attack interval (judgement unchanged)',/contactStart/.test(src)&&/attackCD/.test(src)&&!/hitEnemy|basicAttack=/.test(src));
ok('old R143/R119 hwando sheets are not drawn or preloaded while R242 is active (no duplicate textures)',/hero==='hwando'&&window\.__STORYWORLD_HWANDO_R242__\?\.active\?\.\(\)\)return r;/.test(C('attack-anim-r143.js'))&&/hero==='hwando'&&window\.__STORYWORLD_HWANDO_R242__\?\.active\?\.\(\)\)return r;/.test(C('visual-r119.js')));
ok('can be turned off (storyworld.r242.hwando {on:false}) and only touches the solo hero hwando alive',/storyworld\.r242\.hwando/.test(src)&&/solo\(\)&&player\?\.hero==='hwando'&&player\.hp>0/.test(src));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R242 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
