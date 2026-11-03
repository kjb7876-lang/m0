// R273 (R276·R279 가 같은 줄에 학교 게시판 옆벽 사선을 덧붙임) — 드라이브 Batch66 데이터 기념석 측후면(CONDITIONAL, 조건부·최종 아님)을 R257 방식으로: NS 데이터 세계 방의 두 번째 비석(data deco monolith:1)만 측후면 그림, 나머지는 R129 원래 그림.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(R,'client-source','samong-mood-r123.js'),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f));
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('samong-mood-r123.js').toString('utf8')===src);
const idx=JSON.parse(RT('assets/r273/props/index.json'));const v=idx.items['monolith-side'];
ok('one derived image with provenance',Object.keys(idx.items).length===1&&v&&v.driveId==='1omEx9XdYChybHcSGftV6xLtAPkZky6HQ'&&/^[0-9a-f]{64}$/.test(v.zipSHA256)&&v.originalSHA256==='8fc9c802efb4a9a3fbff22c7cc9788c6079f3f02d3d99a0809e9152e6cc3e957'&&/^CONDITIONAL/.test(v.status)&&v.baseInGame==='r129 monolith'&&v.applied===true);
const b=RT(v.path);ok('derived file matches recorded SHA-256/bytes, long side 512',b.length===v.derivedBytes&&crypto.createHash('sha256').update(b).digest('hex')===v.derivedSHA256&&Math.max(...v.derivedSize)===512);
ok('R129 original monolith art untouched',/monolith:\{path:'assets\/r129\/props\/monolith\.webp',h:130\}/.test(src));
ok('ART entry for side-rear',/'monolith-side':\{path:'assets\/r273\/props\/monolith-side\.webp',h:130\}/.test(src));
ok('only second monolith in a room uses the side-rear view',src.includes("alt=d.kind==='monolith'&&/:1$/.test(d.id)?'monolith-side':d.kind==='noticeboard'&&d.face==='y'?'noticeboard-side':d.kind==='locker'&&d.face==='y'?'locker-left':d.kind==='teacup'&&/:1$/.test(d.id)?'teacup-handle':d.kind==='pylon'&&/:1$/.test(d.id)?'pylon-rear':null,a=(alt&&ART[alt])||ART[d.kind];"));
ok('data theme deco unchanged (3 monoliths)',src.includes("deco:[['monolith',3]]"));
ok('still non-colliding presentation prop',/solid:false,visible:true,enabled:true,autoTargetEligible6:false,r80PresentationOnly:true,r123Deco:d/.test(src));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R273 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
