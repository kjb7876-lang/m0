// R163 CPU check: pixelfx(MIT) 시트 — 출처·라이선스·해시·칸 수, 재생기, 사몽 패턴·단서조각·5연타·코어에 연결.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),A=path.join(R,'runtime-text','assets','r163','pixelfx');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('pixelfx-r163.js runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','pixelfx-r163.js'),'utf8')===C('pixelfx-r163.js'));
const idx=JSON.parse(fs.readFileSync(path.join(A,'index.json'),'utf8'));
ok('index names the source repo, commit and MIT license (with the Sprite Fusion notice)',idx.source==='https://github.com/patch-gg/pixelfx'&&/^[0-9a-f]{40}$/.test(idx.commit)&&/^MIT/.test(idx.license)&&/Sprite Fusion/.test(idx.notice));
const need=['tendrils-blood','hands-blood','meteor','dark-explosion-blood','collect-burst','crit-hit','hit-flash','core-orb-teal','level-up','heal-aoe','portal-teal'];
ok('all 11 game effects are present (R165 +3; R166 dropped poof-ash for painted smoke)',need.every(n=>idx.effects[n]),Object.keys(idx.effects).join(','));
const bad=[];for(const[n,e]of Object.entries(idx.effects)){const p=path.join(A,e.file);if(!fs.existsSync(p)){bad.push(n+':missing');continue;}const b=fs.readFileSync(p);if(crypto.createHash('sha256').update(b).digest('hex')!==e.sha256||b.length!==e.bytes)bad.push(n+':hash');
 const w=b.readUInt32LE(4);if(!(e.frames>0&&e.columns>0&&e.frame[0]>0&&e.pivot.length===2&&e.fps===15))bad.push(n+':meta');}
ok('every sheet matches its recorded sha256/bytes and frame table',!bad.length,bad.join(' '));
ok('sheets are softened toward the painted game style (R166) and each stays under 800 KB',idx.soften&&idx.soften.blur>0&&idx.soften.bloom>0&&idx.soften.sat<1);
ok('each sheet stays under 800 KB',Object.values(idx.effects).every(e=>e.bytes<800000));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok('pixelfx-r163.js is loaded',html.includes('<script src="./pixelfx-r163.js"></script>'));
const play=C('samong-play-r162.js');
ok('samong boss tentacles / meteor / clone dash end use the sheets (with the old drawing as fallback)',/X\.play\('tendrils-blood'/.test(play)&&/X\.play\('meteor'/.test(play)&&/X\.play\('dark-explosion-blood'/.test(play)&&/if\(e\.pfx&&t>=w\)return;/.test(play));
ok('fragment pickup bursts, purification core glows and flashes',/play\('collect-burst'/.test(play)&&/play\('core-orb-teal'/.test(play)&&/play\('hit-flash'/.test(play));
ok('B midboss rises from blood hands',/play\?\.\('hands-blood'/.test(C('samong-r103.js')));
ok('5-hit combo burst plays crit-hit',/play\?\.\('crit-hit'/.test(C('combat-r160.js')));
ok('generator script is in the repo',fs.existsSync(path.join(R,'..','scripts','r163-pixelfx-sheets.py')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
