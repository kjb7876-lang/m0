// R276 — 드라이브 학교 게시판 얕은 사선(CONDITIONAL, 조건부·최종 아님)을 R273 방식으로: 학교 벽 게시판 중 옆벽(face y)에 붙은 것만 사선 그림, 뒷벽(face x)은 R126 원래 그림. 새 배치 없음.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(R,'client-source','samong-mood-r123.js'),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f));
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('samong-mood-r123.js').toString('utf8')===src);
const idx=JSON.parse(RT('assets/r276/props/index.json'));const v=idx.items['noticeboard-side'];
ok('one derived image with provenance',Object.keys(idx.items).length===1&&v&&v.driveId==='1cBwKxx6hqaIK5p-1I_eIxbdQ1MYq_TFu'&&v.zipSHA256==='1733423cfbf76e41b56abc99c2a021714311c1d4d0661dc08a1a408063d607a2'&&v.originalSHA256==='a96d445c6cc28dc0ba3d259ecdb15d779b35ffc5b3ea396256ad3c40dc1ebf90'&&/^CONDITIONAL/.test(v.status)&&v.baseInGame==='r126 noticeboard'&&v.applied===true);
const b=RT(v.path);ok('derived file matches recorded SHA-256/bytes, long side 512, < 150 kB',b.length===v.derivedBytes&&b.length<150000&&crypto.createHash('sha256').update(b).digest('hex')===v.derivedSHA256&&Math.max(...v.derivedSize)===512);
ok('base noticeboard (R126 index) is the Drive original this bundle observes',JSON.parse(RT('assets/r126/props/index.json')).props.noticeboard.source.sha256==='2a829d3b674050307d2936d6444829d26fab5039a1fd8d4029a1c06d06547438');
ok('R126 original noticeboard art untouched',src.includes("noticeboard:{path:'assets/r126/props/noticeboard.webp',h:80,lift:56},"));
ok('ART entry for side-oblique (same height/lift)',src.includes("'noticeboard-side':{path:'assets/r276/props/noticeboard-side.webp',h:80,lift:56}"));
const m=src.match(/alt=(d\.kind==='monolith'[^,]*?:null),a=\(alt&&ART\[alt\]\)\|\|ART\[d\.kind\];/);ok('alt selector present',!!m);
if(m){const f=new Function('d','return '+m[1]);ok('side wall -> side-oblique; back wall / floor -> original; monolith rule kept',f({kind:'noticeboard',id:'r123:z:noticeboard:0',face:'y'})==='noticeboard-side'&&f({kind:'noticeboard',id:'r123:z:noticeboard:1',face:'x'})===null&&f({kind:'noticeboard',id:'r123:z:noticeboard:0'})===null&&f({kind:'monolith',id:'r123:z:monolith:1'})==='monolith-side'&&f({kind:'locker',id:'r123:z:locker:0',face:'y'})===null);}
ok('school deco unchanged (no new placements)',src.includes("deco:[['locker',2,'wall'],['noticeboard',2,'wall'],['badge',1]]"));
ok('still non-colliding presentation prop',/solid:false,visible:true,enabled:true,autoTargetEligible6:false,r80PresentationOnly:true,r123Deco:d/.test(src));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R276 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
