// R279 — 드라이브 각도 변형 3점(CONDITIONAL, 조건부·최종 아님)을 R273/R276 방식으로: 장미 집 찻잔·기계 철탑은 방의 두 번째(:1)만, 학교 사물함은 옆벽(face y)만 새 그림. 원래 그림·배치(deco 목록) 그대로, 새 배치 없음.
// 적용하지 않은 묶음(깨진 캡슐·열린 승강기·승강장 안쪽 꺾임)은 원본이 게임에 없어 건너뜀 — index.json 에 없어야 한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(R,'client-source','samong-mood-r123.js'),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f));
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});const H=b=>crypto.createHash('sha256').update(b).digest('hex');
ok('runtime copy matches',RT('samong-mood-r123.js').toString('utf8')===src);
const idx=JSON.parse(RT('assets/r279/props/index.json'));
const WANT={'teacup-handle':['1eGMfVoW0GhNNCyMdf1ud0NuZRqGZnESu','r126 teacup','r126/props/index.json','teacup',110],'locker-left':['1WZGwM9WShbg_HOz5zEL7_bxAevueiXpU','r126 locker','r126/props/index.json','locker',150],'pylon-rear':['1fSbPdpVYSqDcTpOLcfj-HDXTM2oX8NnK','r129 pylon','r129/props/index.json','pylon',210]};
ok('exactly three derived images (skipped bundles absent)',JSON.stringify(Object.keys(idx.items).sort())===JSON.stringify(Object.keys(WANT).sort()));
for(const[k,[did,base,bidx,bk,h]]of Object.entries(WANT)){const v=idx.items[k];if(!v){ok(k+' present',false);continue;}
 ok(k+': provenance + CONDITIONAL',v.driveId===did&&/^[0-9a-f]{64}$/.test(v.zipSHA256)&&/^CONDITIONAL/.test(v.status)&&v.baseInGame===base&&v.applied===true&&v.path==='assets/r279/props/'+k+'.webp');
 const b=RT(v.path);ok(k+': file matches recorded SHA-256/bytes, long side 512, < 150 kB',b.length===v.derivedBytes&&b.length<150000&&H(b)===v.derivedSHA256&&Math.max(...v.derivedSize)===512);
 
 ok(k+': ART entry (same height as original)',src.includes(`'${k}':{path:'assets/r279/props/${k}.webp',h:${h}}`));}
// 원본 해시는 README 가 밝힌 게임 원본(r126/r129 index 의 source.sha256)과 같아야 한다
const r126=JSON.parse(RT('assets/r126/props/index.json')).props,r129=JSON.parse(RT('assets/r129/props/index.json')).props;
ok('bundles name the in-game originals',r126.teacup.source.sha256==='0ca57a02c46d31b821ecefca1aee2c6e3b3bd1295558338e83b96a2604458729'&&r126.locker.source.sha256==='efcba861b98ab9b5f99a2ae41da7424222c7299362f766856e1704731365b1e8'&&r129.pylon.source.sha256==='a6174bc1010f1af2407fe27f3b0083dfdabe49ac8798c62f7305d477d27968ee');
ok('originals untouched',src.includes("teacup:{path:'assets/r126/props/teacup.webp',h:110},")&&src.includes("locker:{path:'assets/r126/props/locker.webp',h:150},")&&src.includes("pylon:{path:'assets/r129/props/pylon.webp',h:210},"));
const m=src.match(/alt=(d\.kind==='monolith'[^,]*?:null),a=\(alt&&ART\[alt\]\)\|\|ART\[d\.kind\];/);ok('alt selector present',!!m);
if(m){const f=new Function('d','return '+m[1]);const t=(kind,i,face)=>f({kind,id:'r123:z:'+kind+':'+i,face});
 ok('selector: teacup/pylon :1 -> variant, :0 original; locker face y -> left, face x original; R273/R276 rules kept',t('teacup',1)==='teacup-handle'&&t('teacup',0)===null&&t('pylon',1)==='pylon-rear'&&t('pylon',0)===null&&t('locker',0,'y')==='locker-left'&&t('locker',1,'x')===null&&t('monolith',1)==='monolith-side'&&t('noticeboard',0,'y')==='noticeboard-side'&&t('needle',1)===null);}
ok('deco lists unchanged (no new placements)',src.includes("deco:[['teacup',2],['needle',2],['spool',2],['doll',2],['frame',2,'wall']]")&&src.includes("deco:[['pylon',2],['gear',2],['beacon',2]]")&&src.includes("deco:[['locker',2,'wall'],['noticeboard',2,'wall'],['badge',1]]"));
ok('still non-colliding presentation prop',/solid:false,visible:true,enabled:true,autoTargetEligible6:false,r80PresentationOnly:true,r123Deco:d/.test(src));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R279 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
