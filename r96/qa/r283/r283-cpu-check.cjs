// R283 환도 대기 = 좌·우 걷기의 선 자세 칸(E3·W4), 환도 그림 색감을 R271 걷기 4방향 평균에 맞춘 파생본.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const src=C('hwando-r283.js'),r271=C('hwando-r271.js'),idx=RT('index.html');
ok('runtime copies match',RT('hwando-r283.js')===src&&RT('hwando-r271.js')===r271);
ok('loaded once before combat-r118; in verify list and CI',idx.split('"./hwando-r283.js"').length===2&&idx.indexOf('"./hwando-r283.js"')<idx.indexOf('"./combat-r118.js"')&&fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'hwando-r283.js'")&&fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r283/r283-cpu-check.cjs'));
const sb={localStorage:{getItem:()=>null,setItem(){}},console};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);const H=sb.__STORYWORLD_HWANDO_R283__;
const P=h=>({inspect:()=>({lastH:h})});
ok('idle: right → walk-E frame 3, left → walk-W frame 4 (feet together), default right',JSON.stringify(H.idle(P('e')))==='{"dir":"e","frame":3}'&&JSON.stringify(H.idle(P('w')))==='{"dir":"w","frame":4}'&&H.idle(null).dir==='e');
ok('recoloured clips map to assets/r283; others untouched',H.path('assets/r271/hwando/','walk-e.webp')==='assets/r283/hwando/r271/walk-e.webp'&&H.path('assets/r242/hwando/','hit-e.webp')==='assets/r283/hwando/r242/hit-e.webp'&&H.path('assets/r271/hwando/','idle-e.webp')==='assets/r271/hwando/idle-e.webp');
ok('R271 draws/preloads through R283 path and idles on the R283 side frame',/__STORYWORLD_HWANDO_R283__\?\.path\?\.\(R\.base,A\.file\)/.test(r271)&&/__STORYWORLD_HWANDO_R283__\?\.path\?\.\(BASE,A\.file\)/.test(r271)&&/__STORYWORLD_HWANDO_R283__\?\.idle\?\.\(P\)/.test(r271));
// 파생본: 존재·해시·원본과 같은 크기(칸·발 기준점 그대로)·색 지표가 목표에 맞음
const I=JSON.parse(RT('assets/r283/hwando/index.json'));let files=0,same=true,hash=true,close=true;const sz=b=>[b.readUInt32LE(0x18)&0xffffff,0];
for(const [k,c] of Object.entries(I.clips)){files++;const d=fs.readFileSync(path.join(R,'runtime-text',c.derived)),s=fs.readFileSync(path.join(R,'runtime-text',c.source));
 if(crypto.createHash('sha256').update(d).digest('hex')!==c.sha256||crypto.createHash('sha256').update(s).digest('hex')!==c.source_sha256)hash=false;
 if(!c.size||JSON.stringify(c.size)!==JSON.stringify(c.source_size))same=false;
 for(const m of ['p10','p50','p90','sat'])if(Math.abs(c.after[m]-I.target[m])>.012)close=false;}
ok('10 derived atlases: hashes match index, same pixel size as the source',files===10&&hash&&same,{files,hash,same});
ok('every derived clip matches the R271-walk target (brightness p10/p50/p90, saturation ±0.012)',close);
ok('sources untouched (derived files live only under assets/r283)',Object.values(I.clips).every(c=>c.derived.startsWith('assets/r283/hwando/')&&c.source!==c.derived));
ok('off switch',/storyworld\.r283\.hwando/.test(src)&&(H.set(false),H.idle(P('w'))===null&&H.path('assets/r271/hwando/','walk-e.webp')==='assets/r271/hwando/walk-e.webp'));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R283 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
