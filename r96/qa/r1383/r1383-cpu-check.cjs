// R1383 CPU 검사 — 뿌리의 문지기(dist00-boss) 스킬의 보라 문어 촉수 → 갈색 뿌리가 솟아 영웅을 속박하는 프레임 애니메이션(boss-root-bind-r1383.js)
//  사용자 2026-11-27 23:46Z "뿌리보스는 촉수사용하는거 갈색뿌리가 올라와서 적을 속박하도록 프레임애니매이션스킬 문어다리가아니라".
//  확인: ① 빌드 연결 ② 시트(24칸 4×6, 갈색, 칸마다 다름) ③ 뿌리 보스의 모든 터짐·장판·던지기 폭발 그림에서 촉수 시트가 빠지고 갈색 뿌리 시트로
//        ④ 경계·회귀: Dots 시그니처(검은 뿌리 한 갈래)·재해 설정 유지, 다른 보스(촉수 쓰는 다른 보스)는 그대로, 끄면 예전 그대로, 두 번 불러도 한 번
//        ⑤ 속박: 뿌리 보스에게 맞으면 R87 가시 속박(걸어서 못 움직임)·R96 뿌리 감기 그림이 그대로 이어짐(연결 지점 확인)
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm'),zlib=require('zlib');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='boss-root-bind-r1383.js',F0='boss-identity-r1346.js',F1='boss-unique-r1358.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,500));assert(c,m);n++;console.log('PASS '+m);};
const read=p=>fs.readFileSync(path.join(R,p),'utf8');
const srcPath=path.join(R,'client-source',F);ok(fs.existsSync(srcPath),'오버레이 파일 있음');
const src=fs.readFileSync(srcPath,'utf8');ok(src===read('runtime-text/'+F),'runtime-text 사본 같음');
// ---- ① 빌드 연결 ----
const html=read('runtime-text/index.html'),tag=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(tag(F)>tag(F1)&&tag(F1)>tag(F0)&&tag(F0)>0&&new RegExp('\\n<script src="\\./'+F.replace(/\./g,'\\.')+'"></script>\\n').test(html),'index.html: 자기 줄, R1346·R1358 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1383/r1383-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=read('runtime-manifest.json');ok(man.includes('"'+F+'"'),'runtime-manifest 에 오버레이');
const SHEET='assets/r1383/root-bind24.webp';ok(man.includes('"'+SHEET+'"'),'runtime-manifest 에 뿌리 시트');
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 에 drop-shadow·blur 안 씀');
ok(!/\.(arc|ellipse|fillRect|lineTo|bezierCurveTo|quadraticCurveTo)\(/.test(src),'코드로 그린 선·원 없음(프레임 시트만)');
// ---- ② 시트: webp 크기 1024×1536(256칸 4열×6행 = 24칸), 원본 final42 099 가시뿌리 속박 아틀라스에서 줄인 사본 ----
const sp=path.join(R,'runtime-text',SHEET);ok(fs.existsSync(sp),'뿌리 시트 파일 있음');
{const b=fs.readFileSync(sp);ok(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','webp 형식');
 const vp8x=b.indexOf('VP8X');const w=1+b.readUIntLE(vp8x+12,3),h=1+b.readUIntLE(vp8x+15,3);ok(vp8x>0&&w===1024&&h===1536,'시트 1024×1536(256칸 4×6 = 24칸)',[w,h]);
 ok(b.length<1200000,'시트 1.2MB 아래(원본 5.9MB PNG 대신)',b.length);}
ok(fs.existsSync(path.join(R,'runtime-text/assets/final42-r88/effects/099/README.md')),'원본 099 자료 보존');
// ---- 샌드박스(R1346 → R1358 → R1383 순서, 게임과 같게) ----
function sandbox(o={}){
 const calls={imgs:[],scopes:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','filter','globalCompositeOperation'].includes(k)?((...a)=>{if(k==='drawImage')calls.imgs.push([a[0]&&a[0].src,...a.slice(1,5)]);}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 ctx.scope=(q,fn)=>{calls.scopes.push(q);fn();};
 const player={x:10,y:10,hp:100,maxHp:100,invincible:0};
 const sb={window:{},localStorage:{store:{...(o.store||{})},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:'dist00',enemies:[]},effects:[],TILE:34,zoom:1,
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),readyImage:p=>({image:{src:p,width:1024,height:1536}}),ensureImages:()=>Promise.resolve(),blocked:()=>false,hurt:()=>'hit',drawEffect(){},tick(){},settings:{},maxHP:()=>100,
  Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,WeakSet,Promise,console};
 sb.window.window=sb.window;vm.createContext(sb);
 for(const f of (o.files||[F0,F1,F]))vm.runInContext(read('client-source/'+f),sb);
 return {sb,calls,A:sb.window.__STORYWORLD_BOSS_IDENTITY_R1346__,U:sb.window.__STORYWORLD_BOSS_UNIQUE_R1358__,X:sb.window.__STORYWORLD_ROOT_BIND_R1383__};}
const E=(id,o={})=>({id:'e-'+id,nativeId:id,name:o.name||id,boss:true,hp:1000,maxHp:1000,damage:20,x:13,y:10,spawnState:'active',...o});
const S=sandbox(),A=S.A,X=S.X,boss=E('dist00-boss',{name:'뿌리의 문지기'});S.sb.room.enemies.push(boss);
ok(!!X&&typeof X.inspect==='function'&&X.inspect().installed===true,'API window.__STORYWORLD_ROOT_BIND_R1383__ 설치됨',X&&X.inspect());
// ---- ③ 촉수 → 갈색 뿌리 ----
const TENT=/tentacle/i;
const burst=A.burstSheet({owner:boss.id});ok(burst&&burst.path===SHEET&&!TENT.test(burst.path),'R1040 패턴 터짐: 뿌리 시트(촉수 아님)',burst);
ok(burst.cell===256&&burst.cols===4&&burst.n===24&&burst.py>200&&burst.py<230&&burst.fps>=10&&burst.fps<=16,'시트 규격: 256칸 4열 24장, 발 기준 y≈220, 10~16fps',burst);
const blast=A.blastSheet(boss);ok(blast&&blast.path===SHEET,'R431 던지기 폭발: 뿌리 시트',blast);
const pair=A.r411Pair(boss);ok(pair&&!TENT.test(pair.a)&&!TENT.test(pair.b),'R411 장판 두 그림에 촉수 없음',pair);
{const r411=read('client-source/skill-sheets-r411.js');ok(pair&&r411.includes("'"+pair.a+"':[")&&r411.includes("'"+pair.b+"':["),'R411 장판 그림은 R411 표에 있는 이름(없으면 해시로 촉수가 다시 뽑힘)',pair);}
const spec=A.spec(boss);ok(!Object.values(spec).some(v=>typeof v==='string'&&TENT.test(v))&&!TENT.test(String(spec.burst)),'표에서 촉수 이름이 모두 빠짐',spec);
// ---- ④ 경계·회귀 ----
ok(spec.sig&&spec.sig.dots===true&&/dist00-boss-black-root-thrust/.test(A.sheetOf(spec.sig.sheet).path)&&spec.sig.shape==='line','Dots 시그니처(검은 뿌리 한 갈래·줄 모양) 그대로',spec.sig);
ok(spec.disaster===false,'재해는 예전처럼 꺼짐',spec.disaster);
{const B0=sandbox({files:[F0,F1]});const s0=B0.A.spec(E('dist00-boss'));ok(TENT.test(B0.A.sheetOf(s0.burst).path),'고치기 전(R1383 없을 때)은 촉수 시트였음 — 검사 의미 확인');}
for(const id of ['u206-mid','c104-mid','b05-boss','l303-boss']){const B0=sandbox({files:[F0,F1]}),e0=E(id),e1=E(id);const s0=B0.A.spec(e0),s1=A.spec(e1);
 ok(JSON.stringify([s0.burst,s0.r411,s0.sig&&s0.sig.sheet])===JSON.stringify([s1.burst,s1.r411,s1.sig&&s1.sig.sheet]),'다른 보스 '+id+' 표 그대로',[s0,s1]);}
{const Off=sandbox({store:{'storyworld.r1383.rootbind':'{"on":false}'}});const s=Off.A.spec(E('dist00-boss'));ok(TENT.test(Off.A.sheetOf(s.burst).path)&&Off.X.inspect().installed===false,'끄기: 예전 그대로');}
{const S2=sandbox({files:[F0,F1,F,F]});ok(S2.X.inspect().installs===1,'두 번 불러도 한 번만 설치');}
{const N=sandbox({files:[F]});ok(N.X&&N.X.inspect().installed===false,'R1346 없으면 아무것도 안 함(오류 없음)');}
// 별명(nativeId 다른 표기) 없음: 이름표가 dist00-boss 인 보스만
{const e=E('dist00-boss-copy');ok(A.spec(e)===null,'다른 이름표는 표에 없음');}
// 실제 그리기: R1346 cellDraw 경로로 그려 보면 뿌리 시트의 칸 자리를 씀
{S.sb.time=0;const ok1=A.drawBlast(boss,0.5,100,100,60);const im=S.calls.imgs.filter(c=>c[0]===SHEET);ok(ok1===true&&im.length>=1&&im.every(c=>c[3]===256&&c[4]===256&&c[1]%256===0&&c[2]%256===0&&c[1]<1024&&c[2]<1536),'그릴 때 256칸 안 자리만(4열 6행)',im);}
// ---- ⑤ 속박 연결(뿌리 보스에게 맞으면 묶임) ----
const r87=read('client-source/painted-vfx-r87.js'),r96=read('client-source/status-r96.js'),a96=read('client-source/assets-r96.js');
ok(/ROOT='dist00-boss'/.test(r87)&&/moveActor=function\(e,dx,dy[^}]*valid\(\)&&!escaping\)return false/.test(r87),'R87: 뿌리 보스에게 맞으면 가시 속박(걸어서 못 움직임)');
ok(/painted_VFX_R87|PAINTED_VFX_R87__\?\.inspect\(\)\.binding/.test(r96)&&/"root":\{"id":"R96-root"/.test(a96),'R96: 속박 중 영웅 발밑에 갈색 뿌리 감기(앞·뒤 나눈 그림)');
console.log('R1383 CPU check: '+n+' passed');
