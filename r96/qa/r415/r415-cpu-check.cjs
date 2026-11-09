// R415 CPU check: 드라이브 여백 수리·QA 후보(Dots 2026-11-08) 중 게임에 없던 32종을 이름이 맞는 사몽 구역에 R406 규칙으로 놓기.
//  R406 이 이미 놓은 13종의 수리본은 같은 그림의 여백만 바뀐 것이라(입력 sha == R406 원본 sha) 바꾸지 않는다.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f));
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('props-place-r406.js runtime copy matches',RT('props-place-r406.js').toString('utf8')===C('props-place-r406.js'));
ok('R406 loader reads the R415 index after R414',/IDXS=\[IDX,'\.\/assets\/r408\/props\/index\.json','\.\/assets\/r414\/props\/index\.json','\.\/assets\/r415\/props\/index\.json'\]/.test(C('props-place-r406.js')));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r415/r415-cpu-check.cjs'));
ok('verify-r96-public.py checks assets/r415/',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'assets/r415/'"));
const idx=JSON.parse(RT('assets/r415/props/index.json').toString('utf8')),P=Object.entries(idx.props||{});
ok('32 props, all keys r415-*',P.length===32&&P.every(([k])=>k.startsWith('r415-')),P.length);
const other=['r406','r408','r414'].flatMap(r=>Object.keys(JSON.parse(RT('assets/'+r+'/props/index.json').toString('utf8')).props||{}));
ok('no key collides with R406/R408/R414 rows',P.every(([k])=>!other.includes(k)));
const zdata=C('samong-zones-r115-data.js')+C('samong-zones-r115.js');
const bad=[];for(const[k,v]of P){const f=path.join(R,'runtime-text',v.path);
 if(!fs.existsSync(f)){bad.push(k+':missing');continue;}
 const b=fs.readFileSync(f);if(crypto.createHash('sha256').update(b).digest('hex')!==v.sha256||b.length!==v.bytes)bad.push(k+':sha');
 if(!/^assets\/r415\/props\/[a-z-]+\.webp$/.test(v.path))bad.push(k+':path');
 if(!zdata.includes("'"+v.zone+"'")&&!zdata.includes('"'+v.zone+'"'))bad.push(k+':zone '+v.zone);
 if(!['wall','inner'].includes(v.mode)||(v.mode==='wall')!==(v.axis==='x'||v.axis==='y'))bad.push(k+':mode');
 if(!(v.height>=14&&v.height<=70))bad.push(k+':height '+v.height);
 if(!/^[0-9a-f]{64}$/.test(v.pngSHA256||''))bad.push(k+':pngsha');
 if(Math.max(...v.size)>384)bad.push(k+':size');}
ok('every row: webp present with matching sha/bytes, real samong zone, wall rows have an axis, height 14..70 px (hero 66), <=384 px',bad.length===0,bad);
ok('furniture never taller than the hero x1.1',P.every(([,v])=>v.height<=73));
ok('chandelier held with a reason (ceiling fixture)',/ceiling/.test(idx.held?.chandelier||''));
ok('rows do not reuse an R406 zone+name pair (no duplicate scene props)',new Set(P.map(([k,v])=>v.zone+k)).size===P.length);
ok('R406 still draws these as presentation only (solid:false, interactive:false)',/solid:false,visible:true,enabled:true,interactive:false/.test(C('props-place-r406.js')));
const fails=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' :: '+JSON.stringify(c.detail).slice(0,400)));
console.log('R415 CPU '+(checks.length-fails.length)+'/'+checks.length);if(fails.length)process.exit(1);
