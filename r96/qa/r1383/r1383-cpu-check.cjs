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
// ---- ② 시트: Dots 정식 SW-R1383_root-bind24.png(1536×1024, 256칸 6열×4행 = 24칸, PNG SHA-256 75d42fb2…)의 무손실 webp ----
const sp=path.join(R,'runtime-text',SHEET);ok(fs.existsSync(sp),'뿌리 시트 파일 있음');
{const b=fs.readFileSync(sp);ok(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','webp 형식');
 const vp8x=b.indexOf('VP8X'),vp8l=b.indexOf('VP8L');let w=0,h=0;if(vp8x>0){w=1+b.readUIntLE(vp8x+12,3);h=1+b.readUIntLE(vp8x+15,3);}else if(vp8l>0&&b[vp8l+8]===0x2f){const v=b.readUInt32LE(vp8l+9);w=(v&0x3fff)+1;h=((v>>>14)&0x3fff)+1;}ok(w===1536&&h===1024,'시트 1536×1024(256칸 6열×4행 = 24칸)',[w,h]);
 ok(b.length<1200000,'시트 1.2MB 아래',b.length);}
ok(fs.existsSync(path.join(R,'runtime-text/assets/final42-r88/effects/099/README.md')),'원본 099 자료 보존');
// Dots 원본 그대로(무손실): 디코딩한 RGBA 픽셀 SHA-256 이 Dots PNG 와 같음(PIL)
{const cp=require('child_process');const r=cp.spawnSync('python3',['-c',"from PIL import Image;import hashlib,sys;print(hashlib.sha256(Image.open(sys.argv[1]).convert('RGBA').tobytes()).hexdigest())",sp],{encoding:'utf8'});
 ok(String(r.stdout).trim()==='5e63b9e4cf6957764d3499f13f8b77066f0454200ed356ef8db33cf826a8b3cb','시트 픽셀 = Dots SW-R1383 PNG(75d42fb2…) 그대로',[r.stdout,r.stderr&&r.stderr.slice(0,200)]);}
ok(/sha256:'75d42fb234fc8bb4046820c019792e897739bca9b3c7baccc4678b924b440c08'/.test(src),'오버레이에 Dots 원본 SHA 기록');
// ---- 샌드박스(R1346 → R1358 → R1383 순서, 게임과 같게) ----
function sandbox(o={}){
 const calls={imgs:[],scopes:[],daf:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','filter','globalCompositeOperation'].includes(k)?((...a)=>{if(k==='drawImage')calls.imgs.push([a[0]&&a[0].src,...a.slice(1,5)]);}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 ctx.scope=(q,fn)=>{calls.scopes.push(q);fn();};
 const player={x:10,y:10,hp:100,maxHp:100,invincible:0};
 const sb={window:{},localStorage:{store:{...(o.store||{})},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:'dist00',enemies:[]},blocked:(x,y,r)=>x-r<11.5,effects:[],TILE:34,zoom:1,
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),readyImage:p=>({image:{src:p,width:1024,height:1536}}),ensureImages:()=>Promise.resolve(),hurt:()=>'hit',drawAssetFrame3(path,frame,x,y,h,opt){calls.daf.push([path,x,y,h,opt&&opt.alpha,opt&&opt.filter]);return true;},drawEffect(){},tick(){},settings:{},maxHP:()=>100,
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
ok(burst.cell===256&&burst.cols===6&&burst.n===24&&burst.py===220&&burst.fps===16,'시트 규격(Dots 인계 메모): 256칸 6열 24장, 접점 y 220, 16fps(1.5초)',burst);
// 인계 메모의 함정: 4열로 읽으면 4번째 칸부터 엉뚱한 칸, 16번째부터 없는 행 → 24칸 모두 시트 안 자리여야 함
for(let i=0;i<24;i++){const c=i%burst.cols,r=Math.floor(i/burst.cols);ok(c*256+256<=1536&&r*256+256<=1024,'칸 '+i+' 자리 시트 안(열 '+c+'·행 '+r+')');}
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
{S.sb.time=0;const ok1=A.drawBlast(boss,0.5,100,100,60);const im=S.calls.imgs.filter(c=>c[0]===SHEET);ok(ok1===true&&im.length>=1&&im.every(c=>c[3]===256&&c[4]===256&&c[1]%256===0&&c[2]%256===0&&c[1]<1536&&c[2]<1024),'그릴 때 256칸 안 자리만(6열 4행)',im);}
{S.sb.time=0;S.calls.imgs.length=0;A.drawBlast(boss,17/16+.01,100,100,60);const c=S.calls.imgs.find(c=>c[0]===SHEET);ok(c&&c[1]===5*256&&c[2]===2*256,'경계: 17번째 칸 = 6열 기준 (5,2) 자리',c);}
// ---- QA 손질: R1040 그리기(전역 drawAssetFrame3) — 크기 ×1.2, 벽 칸이면 건너뜀, 다른 그림은 그대로 ----
{const W=sandbox(),pr=W.sb.project,daf=W.sb.drawAssetFrame3;ok(W.X.inspect().wrapped===true&&daf.__r1383===true,'drawAssetFrame3 감쌈');
 const g=W.X.ground(pr(13.4,9.2).x,pr(13.4,9.2).y);ok(Math.abs(g.x-13.4)<1e-6&&Math.abs(g.y-9.2)<1e-6,'화면→땅 역변환 정확',g);
 const q1=pr(13,10),q0=pr(11,10),qb=pr(11.81,10);W.calls.daf.length=0;
 daf(SHEET,{},q1.x,q1.y,100);daf(SHEET,{},q0.x,q0.y,100);daf(SHEET,{},qb.x,qb.y,100);daf('assets/r411/fx/boss-fire-wall.webp',{},q0.x,q0.y,100);
 ok(W.calls.daf.length===3&&W.calls.daf[0][3]===135,'바닥 묶음은 1.35배로 그림',W.calls.daf);
 ok(!W.calls.daf.some(c=>c[0]===SHEET&&Math.abs(c[1]-q0.x)<1e-6),'벽 칸 묶음은 건너뜀',W.calls.daf);
 ok(W.calls.daf.some(c=>c[0]===SHEET&&Math.abs(c[1]-qb.x)<1e-6),'경계: 벽 칸 경계(11.5)에서 .31칸 떨어진 자리는 그림(반지름 .3 기준 바깥)',W.calls.daf);
 ok(W.calls.daf.some(c=>c[0]==='assets/r411/fx/boss-fire-wall.webp'&&c[3]===100),'다른 시트는 크기·벽 상관없이 그대로',W.calls.daf);
 daf(SHEET,{},q1.x,q1.y,100,{alpha:.4});const L=W.calls.daf.slice(-1)[0];ok(W.calls.daf[0][4]===.7&&L[4]===.4,'R1369 없을 때 위험 그림 상한 .7(더 옅은 값은 그대로)',W.calls.daf);
 {const V=sandbox();V.sb.window.__STORYWORLD_BOSS_FX_VIS_R1192__={inverse:a=>1-Math.pow(1-a,1/1.7)};const q=V.sb.project(13,10);V.sb.drawAssetFrame3(SHEET,{},q.x,q.y,100,{alpha:1});const a=V.calls.daf[0][4],fin=1-Math.pow(1-a,1.7);ok(Math.abs(fin-.7)<1e-9,'R1192 가 뒤에서 올려도 최종 .7(역함수로 걸음)',[a,fin]);}
 {const Z=sandbox();Z.sb.window.__STORYWORLD_FX_ALPHA_R1369__={};const q=Z.sb.project(13,10);Z.sb.drawAssetFrame3(SHEET,{},q.x,q.y,100,{alpha:.9});ok(Z.calls.daf[0][4]===.9,'R1369 있으면 직접 깎지 않음(이중 감쇠 없음)',Z.calls.daf);}
 ok(W.calls.daf[0][5]==='brightness(1.45)'&&!/drop-shadow|blur/.test(W.calls.daf[0][5])&&W.calls.daf.find(c=>/fire-wall/.test(c[0]))[5]===undefined,'뿌리 시트만 밝기 필터(brightness 만)',W.calls.daf);
 ok(W.X.inspect().walls===1,'건너뛴 수 셈',W.X.inspect());
 const O=sandbox({store:{'storyworld.r1383.rootbind':'{"on":false}'}});ok(!O.sb.drawAssetFrame3.__r1383,'끄면 감싸지 않음');}
// ---- ⑤ 속박 연결(뿌리 보스에게 맞으면 묶임) ----
const r87=read('client-source/painted-vfx-r87.js'),r96=read('client-source/status-r96.js'),a96=read('client-source/assets-r96.js');
ok(/ROOT='dist00-boss'/.test(r87)&&/moveActor=function\(e,dx,dy[^}]*valid\(\)&&!escaping\)return false/.test(r87),'R87: 뿌리 보스에게 맞으면 가시 속박(걸어서 못 움직임)');
ok(/painted_VFX_R87|PAINTED_VFX_R87__\?\.inspect\(\)\.binding/.test(r96)&&/"root":\{"id":"R96-root"/.test(a96),'R96: 속박 중 영웅 발밑에 갈색 뿌리 감기(앞·뒤 나눈 그림)');
console.log('R1383 CPU check: '+n+' passed');
