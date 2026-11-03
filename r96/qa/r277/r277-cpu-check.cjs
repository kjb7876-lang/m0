// R277 CPU check: 환도 대기 = 걷기 마지막 칸 고정, 이동 4방향, 공격 좌·우·아래(위 → 좌·우).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('hwando-r277.js'),r271=C('hwando-r271.js'),idx=RT('index.html');
ok('runtime copies match; loads right after hwando-r271 and before combat-r118',RT('hwando-r277.js')===src&&RT('hwando-r271.js')===r271&&idx.includes('<script src="./hwando-r271.js"></script><script src="./hwando-r277.js"></script>')&&idx.indexOf('hwando-r277.js')<idx.indexOf('combat-r118.js'));
ok('registered in verify list, CI and manifest',/'hwando-r277\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/r277-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8'))&&fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('hwando-r277.js'));
ok('off switch storyworld.r277.hwando',/storyworld\.r277\.hwando/.test(src));
// 정책 동작
const store={};const win={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}}};win.window=win;vm.runInNewContext(src,win);
const P=win.__STORYWORLD_HWANDO_R277__;
ok('idle = walk clip, last frame (frame -1 → n-1), every direction',['n','s','e','w'].every(d=>{const r=P.idle(d);return r.anim==='walk'&&r.dir===d&&r.frame===-1;}));
const out=[P.attackDir('e',10),P.attackDir('n',-30),P.attackDir('n',40),P.attackDir('w',-5),P.attackDir('n',0),P.attackDir('s',0)];
ok('attack dirs only e/w/s; up → horizontal component, else last horizontal',out.join()==='e,w,e,w,w,s',out);
ok('R271 consults R277: idle draws a walk frame (n-1, or the R283 side stance) (no idle clip), attack via aimDir, no idle preload',/P\.idle\(dd?\);return draw\(rec,st,best,'walk',dd?,(I\?Math\.min\(I\.frame,w\.n-1\):)?w\.n-1\)/.test(r271)&&/const d=aimDir\(\),a=atkOf\(d\)/.test(r271)&&/P277\(\)\?\['walk'\]:\['walk','idle'\]/.test(r271)&&/P\.attackDir\(d,v\?v\[0\]:0\)/.test(r271));
ok('R242 still yields to R271 (no old idle/ready drawn)',(C('hwando-r242.js').match(/__STORYWORLD_HWANDO_R271__\?\.active\?\.\(\)/g)||[]).length===2);
ok('judgement untouched',!/hitEnemy|basicAttack=|attackCD=/.test(src+r271));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R277 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
