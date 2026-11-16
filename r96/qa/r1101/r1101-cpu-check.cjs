// R1101 기억사수 좌우 걷기·공격 그림 조사(사용자 11-16 06:11Z "잘리거나 시선방향이 총구와반대") — CPU 검사.
//  node r96/qa/r1101/r1101-cpu-check.cjs
//  ① 잘림: R1045d plainWalk 는 R143/R119 가 그린 걷기 칸의 '잘라낸 사각형'(r144 그림 기준 bbox, 예 [55,43,112,186])을 그대로 둔 채
//     그림만 walk-e3 로 바꿔, 새 그림의 외투 자락·뒷발(x 38~55)이 매 칸 잘렸다 → 칸 전체 사각형으로 넓히고 그리기 자리도 같은 비율로 넓힌다.
//  ② 시선: R128 idle-e(쏜 뒤·서 있을 때 옆모습)는 얼굴이 왼쪽(총 반대)을 본다 → 시선·총이 같은 쪽인 Dots r1 공격 겨눔(attack-e4)으로.
//  {"plainWalk":false}·{"sideIdle":false} 로 끔.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
ok(/node r96\/qa\/r1101\/r1101-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
function load(pref){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){},
  readyImage:q=>({image:{naturalWidth:q.includes('walk')?1536:1152,naturalHeight:256,src:q,tag:'NEW'}}),player:{hero:'gunner'}};win.addEventListener=()=>{};
 vm.createContext(sb);vm.runInContext(src,sb);return win.__STORYWORLD_GUNNER_AIM_R991__;}
const A=load(null);ok(/R1101/.test(A.revision)&&/R1045d/.test(A.revision)&&/R1003/.test(A.revision),'판 R1101(+R1045d·R1003 유지)',{rev:A.revision});
const near=(a,b)=>Math.abs(a-b)<1e-6;
// ① 잘린 사각형(r144 0번 칸 bbox) → 칸 전체, 그리기 자리도 같은 배율로
for(const mir of [false,true]){const k=.3,sr=[55,43,112,186],x0=500,y0=300,w=sr[2]*k*(mir?-1:1),h=sr[3]*k;
 const c={kind:'image',owner:{kind:'hero'},sourcePath:'assets/r144/walk/gunner/walk-e.webp',image:{},sourceRect:sr.slice(),points:[[x0,y0],[x0+w,y0],[x0+w,y0+h],[x0,y0+h]]};
 ok(A.plainWalk({commands:[c]},0)===1&&c.sourcePath==='assets/r1045d/gunner/walk-e3.webp','그냥 걷기 '+(mir?'(반전) ':'')+'walk-e3 로 바뀜');
 ok(JSON.stringify(c.sourceRect)==='[0,0,192,256]','잘린 사각형 → 0번 칸 전체 [0,0,192,256]',c.sourceRect);
 const f=mir?-1:1,X=v=>x0+f*(v-sr[0])*k,Y=v=>y0+(v-sr[1])*k,P=c.points;
 ok(near(P[0][0],X(0))&&near(P[1][0],X(192))&&near(P[0][1],Y(0))&&near(P[3][1],Y(256))&&near(P[2][0],X(192))&&near(P[2][1],Y(256)),'그리기 자리를 칸 전체로 같은 배율·같은 발 위치로 넓힘',{P});}
{const c={kind:'image',owner:{kind:'hero'},sourcePath:'assets/r144/walk/gunner/walk-e.webp',image:{},sourceRect:[1400,42,111,186],points:[[0,0],[33.3,0],[33.3,55.8],[0,55.8]]};A.plainWalk({commands:[c]},0);ok(JSON.stringify(c.sourceRect)==='[1344,0,192,256]','7번 칸 잘린 사각형 → 7번 칸 전체',c.sourceRect);}
// ② 옆 서 있기 R128 idle-e(얼굴이 총 반대) → attack-e4 겨눔 칸
ok(typeof A.sideIdle==='function','옆 서 있기 바꾸기 함수');
const A0=load({idle6:false}); // R1101b: 기본은 Dots 대기 6칸(r1101b-cpu-check) — R1101 attack-e4 경로는 idle6:false 로 확인
for(const mir of [false,true]){const k=.3,sr=[192,0,192,256],x0=400,y0=200,w=192*k*(mir?-1:1);
 const c={kind:'image',owner:{kind:'hero'},sourcePath:'assets/r128/gunner/idle-e.webp',image:{},sourceRect:sr.slice(),points:[[x0,y0],[x0+w,y0],[x0+w,y0+256*k],[x0,y0+256*k]]};
 ok(A0.sideIdle({commands:[c]},0)===1&&c.sourcePath==='assets/r1045c/gunner/attack-e4.webp'&&c.image.tag==='NEW','옆 서 있기'+(mir?'(반전)':'')+' → attack-e4',c.sourcePath);
 ok(c.sourceRect[0]%192===0&&c.sourceRect[2]===192&&c.sourceRect[3]===256&&near(c.points[0][0],x0)&&near(c.points[1][0],x0+w),'같은 자리·같은 좌우(반전 유지)',c);}
{const c={kind:'image',owner:{kind:'hero'},sourcePath:'assets/r128/gunner/idle-se.webp',image:{},sourceRect:[0,0,192,256],points:[[0,0],[1,0],[1,1],[0,1]]};ok(A0.sideIdle({commands:[c]},0)===0,'대각 서 있기는 그대로(새 그림 없음)');}
const B=load({sideIdle:false});{const c={kind:'image',owner:{kind:'hero'},sourcePath:'assets/r128/gunner/idle-e.webp',image:{},sourceRect:[0,0,192,256],points:[[0,0],[1,0],[1,1],[0,1]]};ok(B.sideIdle({commands:[c]},0)===0,'sideIdle 끄면 예전 그대로');}
console.log(JSON.stringify({passed:n}));
