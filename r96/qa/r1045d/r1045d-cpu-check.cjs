// R1045d 기억사수 옆 걷기(Dots gunner-ew-r1) 후속 — CPU 검사.
//  node r96/qa/r1045d/r1045d-cpu-check.cjs
//  ① R1045c walk-e2 는 큰 보폭 칸이 두 칸씩 겹치고(3·4, 7·0) 3번 칸이 4.6px 떴다 → 순서 [1,1,2,3,5,5,6,7]·칸마다 발 y226 손질본(walk-e3).
//  ② R1045c 는 쏜 뒤 .45초 걷기 사격에만 새 그림을 썼다 → 그냥 옆으로 걸을 때(R143 이 그리는 r144/r128 walk-e)도 같은 그림으로 바꾼다.
//  {"walkE3":false} 면 R1045c walk-e2, {"plainWalk":false} 면 그냥 걸을 때 예전 그림.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;}
const man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
const p=path.join(R,'runtime-text','assets','r1045d','gunner','walk-e3.webp');ok(fs.existsSync(p),'walk-e3.webp 있음');
const s=webpSize(fs.readFileSync(p));ok(s&&s[0]===1536&&s[1]===256,'크기 1536×256',s);ok(man.includes('assets/r1045d/gunner/walk-e3.webp'),'runtime-manifest 에 있음');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'assets/r1045d/'"),'verify-r96-public.py 가 assets/r1045d/ 를 확인');
ok(/node r96\/qa\/r1045d\/r1045d-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
function load(pref){const win={};const img={naturalWidth:1536,naturalHeight:256,tag:'NEW'};
 const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){},
  readyImage:q=>({image:{...img,src:q}}),player:{hero:'gunner'}};win.addEventListener=()=>{};
 vm.createContext(sb);vm.runInContext(src,sb);return win.__STORYWORLD_GUNNER_AIM_R991__;}
const A=load(null);ok(/R1045d/.test(A.revision)&&/R1045c/.test(A.revision)&&/R1003/.test(A.revision),'판 R1045d(+R1045c·R1003 유지)',{rev:A.revision});
ok(A.walks().e.path==='assets/r1045d/gunner/walk-e3.webp','걷기 사격 동쪽은 손질본 walk-e3',A.walks().e);
for(const t of A.walks().e.tip)ok(t[0]>=155&&t[0]<=170&&t[1]>=72&&t[1]<=90,'walk-e3 총구 끝(잰 값 161~163·79~84)',t);
ok(typeof A.plainWalk==='function','그냥 걷기 바꾸기 함수');
for(const from of ['assets/r144/walk/gunner/walk-e.webp','assets/r128/gunner/walk-e.webp']){
 const c={kind:'image',owner:{kind:'hero'},r121Walk:true,sourcePath:from,image:{src:from},sourceRect:[384,0,192,256],points:[[0,0],[10,0],[10,13],[0,13]]};
 const rec={commands:[c]};const changed=A.plainWalk(rec,0);
 ok(changed===1&&c.sourcePath==='assets/r1045d/gunner/walk-e3.webp'&&c.image.tag==='NEW','그냥 옆 걷기('+from.split('/').slice(-3).join('/')+') → walk-e3',{p:c.sourcePath});
 ok(JSON.stringify(c.sourceRect)==='[384,0,192,256]'&&JSON.stringify(c.points)==='[[0,0],[10,0],[10,13],[0,13]]','같은 칸·같은 자리(발 y226 같은 배치)',c);}
{const c={kind:'image',owner:{kind:'hero'},r121Walk:true,sourcePath:'assets/r128/gunner/walk-se.webp',image:{},sourceRect:[0,0,192,256],points:[[0,0],[1,0],[1,1],[0,1]]};ok(A.plainWalk({commands:[c]},0)===0&&c.sourcePath.endsWith('walk-se.webp'),'다른 방향 걷기는 그대로');}
const B=load({plainWalk:false});{const c={kind:'image',owner:{kind:'hero'},r121Walk:true,sourcePath:'assets/r144/walk/gunner/walk-e.webp',image:{},sourceRect:[0,0,192,256],points:[[0,0],[1,0],[1,1],[0,1]]};ok(B.plainWalk({commands:[c]},0)===0,'plainWalk 끄면 그냥 걷기는 예전 그림');}
ok(load({walkE3:false}).walks().e.path==='assets/r1045c/gunner/walk-e2.webp','walkE3 끄면 R1045c walk-e2');
console.log(JSON.stringify({passed:n}));
