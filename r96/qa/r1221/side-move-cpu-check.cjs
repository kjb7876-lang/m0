// R1221 CPU 검사: 옆 이동 그림이 없던 몹에 '옆' 시트(좌측=원본 방향, 우측=엔진 좌우반전)를 더한다.
// 헤드리스 전수(r96/qa/r1221/side-census.mjs): 늪의 뿔악마 군주(mb-dist02)는 옆으로 걸을 때 p4 = R1029 떠서 이동(안개)뿐, p1·p2 = 한 장.
//  부정의 잔영(a10-s1) 일부 개체(그림 denial_specter)는 옆으로 걸을 때 한 장(위·아래만 R1001 시트).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='move-side-r1221-data.js',SRC=path.join(R,'client-source',F);ok(F+' exists',fs.existsSync(SRC));
if(fs.existsSync(SRC)){const code=fs.readFileSync(SRC,'utf8');
 ok('runtime copy matches',fs.existsSync(path.join(R,'runtime-text',F))&&fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===code);
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');const i=html.indexOf('src="./'+F+'"'),k=html.indexOf('src="./move-dir-r1001-data.js"');
 ok('script tag once',html.split('src="./'+F+'"').length===2);ok('tag after R1001 data (a10-s1 entry exists first; R974 engine reads the same object later)',k>=0&&i>k);
 ok('verify-r96-public lists it',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes(F));
 ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1221/side-move-cpu-check.cjs'));
 const run=pre=>{const g={console,Object,JSON,Array};g.window=g;vm.createContext(g);vm.runInContext(pre,g);vm.runInContext(code,g);return g;};
 // 이미 있는 적(a10-s1, 위·아래만)에는 옆만 더하고 있는 값은 그대로
 const g=run(`window.__STORYWORLD_MOVE_DIR_R974_DATA__={enemies:{"a10-s1":{idle:[{path:"x"}],cell:384,n:4,fps:8,dirs:{down:{path:"D"},up:{path:"U"}}},"keep":{idle:[],dirs:{side:{path:"S0"}}}}};`);
 const E=g.window.__STORYWORLD_MOVE_DIR_R974_DATA__.enemies;
 ok('a10-s1 keeps down/up',E['a10-s1'].dirs.down.path==='D'&&E['a10-s1'].dirs.up.path==='U'&&E['a10-s1'].idle[0].path==='x');
 ok('a10-s1 gains side',!!E['a10-s1'].dirs.side&&/r1221\/side\//.test(E['a10-s1'].dirs.side.path));
 ok('existing side never overwritten',E.keep.dirs.side.path==='S0');
 const B=E['mb-dist02'];ok('mb-dist02 added with side',!!B&&!!B.dirs.side);
 if(B){const paths=B.idle.map(x=>x.path);ok('mb-dist02 idle covers p4·p1·p2',['p4','p1','p2'].every(p=>paths.some(q=>q.endsWith('mb-dist02-'+p+'.webp'))));
  const S=B.dirs.side;ok('side pivot/vis finite and sane',[S.px,S.py,S.vis].every(Number.isFinite)&&S.vis>150&&S.vis<384&&S.py>300&&S.py<=384);
  ok('no up/down invented for boss',!B.dirs.up&&!B.dirs.down);}
 ok('no data object → no throw',(()=>{try{run('');return true;}catch(e){return false;}})());
 const man=JSON.parse(fs.readFileSync(path.join(R,'r1221-side-move.json'),'utf8'));
 for(const f of man.files){const p=path.join(R,'runtime-text',f.path);ok(f.path+' exists, size '+f.size,fs.existsSync(p)&&f.size[1]===384&&f.size[0]%384===0&&f.size[0]>=384*4&&f.size[0]<=384*8);
  ok(f.path+' sha matches manifest',fs.existsSync(p)&&require('crypto').createHash('sha256').update(fs.readFileSync(p)).digest('hex')===f.sha256);
  ok(f.key+' marked temporary (not final art)',f.final===false);}
 // Dots CX-0169SW 시간수문장 지상 걷기 11종(24 추가)(사용자 승인분만): 번호가 같은 일반몹에만, 왼쪽 원본을 뒤집어 넣고 프레임 수 = 표 n
 {const G=['34','40','05','07','08','10','13','16','15','20','24'];for(const n of G){const f=man.files.find(x=>x.key==='kair-guardian-'+n);
  ok('guardian '+n+' applied to kair-guardian-'+n+' only',!!f&&f.enemies.length===1&&f.enemies[0]==='kair-guardian-'+n&&f.source.includes('CX-0169SW_guardian_'+n+'_walkL')&&f.flippedIntoSheet===true);
  const t=E['kair-guardian-'+n];ok('guardian '+n+' table n matches sheet ('+(t&&t.n)+')',!!t&&!!f&&t.n*384===f.size[0]&&t.idle.some(q=>q.path.endsWith('kair-guardians/guardian_'+n+'.webp')));}
  ok('hover/missing guardians (02·04·09·21 hover, 39·46·47) not applied',!['02','04','09','21','39','46','47'].some(n=>man.files.some(x=>x.key==='kair-guardian-'+n)));}
 ok('mb-dist02 side made from 일곱 기둥 소환진 순례악마 walk (M008), flipped into right-facing sheet',man.files.some(f=>f.enemies.includes('mb-dist02')&&/M008-move/.test(f.source)&&f.flippedIntoSheet===true));
}
console.log(`R1221 side-move: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
