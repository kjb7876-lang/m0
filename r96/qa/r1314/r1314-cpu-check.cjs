// R1314 CPU 검사: face-3d-r1314.js 가 3D 영웅 묶음의 몸 방향을 ①이동 중 = 이동 방향(공격 자세여도) ②서서 공격 = 대상 적 쪽
// ③대기 = 엔진 4방향 ④끄면 손대지 않음 으로 정하는지, 그리고 스크립트 태그·공개 검증 목록·CI 줄이 이어졌는지 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),SRC=path.join(ROOT,'r96/client-source/face-3d-r1314.js');
let fail=0;const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fail++;};
const code=fs.readFileSync(SRC,'utf8');
function world(opts={}){
 const g={name:'r1305-slayer-3d-shared',visible:true,position:{x:10,y:0,z:10},rotation:{y:0},updates:0,updateMatrixWorld(){this.updates++;}};
 const scene={children:[g],onBeforeRender:null};let raf=null;const store={};
 const sb={console,performance:{now:()=>0},Math,Number,String,Object,WeakMap,JSON,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},requestAnimationFrame:f=>{raf=f;},
  time:0,target:null,room:{enemies:[]},player:{x:10,y:10,moving:false,moveVX150:0,moveVY150:0,attackAnim:0,direction:'front'}};
 sb.window=sb;sb.__STORYWORLD_PHASE1__={controller:{state:{three:{scene,T:{}}}}};sb.__STORYWORLD_HWANDO3D_R1302__={on:()=>opts.off3d?false:true};
 vm.createContext(sb);vm.runInContext(code,sb,{filename:'face-3d-r1314.js'});raf&&raf();
 const frame=(dt=1/30,n=1)=>{for(let i=0;i<n;i++){sb.time+=dt;g.rotation.y=0.123;/* R1302 이 매 프레임 덮어쓰는 값 흉내 */scene.onBeforeRender?.();}};
 return {sb,g,scene,frame};}
const D=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return Math.abs(d)*180/Math.PI;};
// ① 이동 중 + 공격 자세 + 대상 적이 반대쪽: 이동 방향
{const W=world();const P=W.sb.player;W.sb.room.enemies=[{id:'e1',x:12,y:8,hp:5}];W.sb.target='e1';
 P.moving=true;P.moveVX150=-1;P.moveVY150=1;P.attackAnim=.2;P.direction='right';W.frame(1/30,40);
 ok(D(W.g.rotation.y,Math.atan2(-1,1))<1,'① 공격 자세로 걸어도 이동 방향',{yaw:W.g.rotation.y});ok(W.g.updates>0,'① 바꾼 뒤 행렬 갱신');
 // 맨 걷기 축 방향 +x: 월드 방향 그대로(예전 공식의 13° 어긋남 없음)
 P.attackAnim=0;P.moveVX150=1;P.moveVY150=0;W.frame(1/30,40);ok(D(W.g.rotation.y,Math.PI/2)<1,'① 맨 걷기 +x = 90°',{yaw:W.g.rotation.y});
 // 이동 벡터 0 이지만 실제로 옮겨짐 → 변위 방향
 P.moveVX150=0;P.moveVY150=0;for(let i=0;i<40;i++){W.g.position.z+=.1;W.frame();}ok(D(W.g.rotation.y,0)<1,'① 이동 벡터 0 이면 실제 변위(+y) 쪽',{yaw:W.g.rotation.y});}
// ⑥ 걷다 멈춤: 걷는 동안 엔진 4방향이 바뀌었어도 멈춘 뒤 이동 방향 유지
{const W=world();const P=W.sb.player;P.moving=true;P.moveVX150=1;P.moveVY150=0;P.direction='right';W.frame(1/30,40);
 P.moving=false;P.moveVX150=0;W.frame(1/30,40);ok(D(W.g.rotation.y,Math.PI/2)<1,'⑥ +x 로 걷다 멈추면 90° 유지(right 135° 로 안 꺾임)',{yaw:W.g.rotation.y});
 P.direction='left';W.frame(1/30,60);ok(D(W.g.rotation.y,-Math.PI/2+Math.PI/4)<1,'⑥ 멈춘 뒤 엔진 방향이 바뀌면 따라감(left)',{yaw:W.g.rotation.y});}
// ② 서서 공격: 대상 적 쪽(4방향이 아니라 정확히)
{const W=world();const P=W.sb.player;W.sb.room.enemies=[{id:'e1',x:13,y:11,hp:5}];W.sb.target='e1';P.direction='right';
 for(let i=0;i<40;i++){P.attackAnim=.2;W.frame();}ok(D(W.g.rotation.y,Math.atan2(3,1))<1,'② 서서 공격 = 대상 쪽',{yaw:W.g.rotation.y});
 // 죽은 대상은 쓰지 않음 → 엔진 4방향
 W.sb.room.enemies[0].hp=0;for(let i=0;i<40;i++){P.attackAnim=.2;W.frame();}ok(D(W.g.rotation.y,Math.PI/2+Math.PI/4)<1,'② 죽은 대상이면 엔진 방향(right)',{yaw:W.g.rotation.y});}
// ③ 대기: 엔진 4방향 바뀔 때 따라감, 경계값 — 돌기는 부드럽게(한 프레임에 다 돌지 않음)
{const W=world();const P=W.sb.player;P.direction='back';W.frame(1/30,1);const one=W.g.rotation.y;W.frame(1/30,60);
 ok(D(W.g.rotation.y,Math.PI+Math.PI/4)<1,'③ 대기 back',{yaw:W.g.rotation.y});ok(D(one,Math.PI+Math.PI/4)>20,'③ 한 프레임에 확 돌지 않음',{one});
 // 큰 dt(멈춤 뒤) 에도 유한
 W.sb.time+=1e6;W.scene.onBeforeRender();ok(Number.isFinite(W.g.rotation.y),'③ 긴 멈춤 뒤에도 유한');}
// ④ 꺼짐·3D 꺼짐: 손대지 않음
{const W=world({off3d:true});W.sb.player.direction='back';W.frame(1/30,10);ok(W.g.rotation.y===0.123,'④ 3D 꺼짐이면 손대지 않음');}
{const W=world();W.sb.__STORYWORLD_FACE3D_R1314__.set(false);W.sb.player.direction='back';W.frame(1/30,10);ok(W.g.rotation.y===0.123,'④ R1314 끄면 손대지 않음');}
// ⑤ 다른 이름 묶음(소환·다른 3D)은 건드리지 않음
{const W=world();W.g.name='r1157-summon';W.sb.player.direction='back';W.frame(1/30,10);ok(W.g.rotation.y===0.123,'⑤ 3D 영웅 묶음이 아니면 손대지 않음');}
// 연결
const html=fs.readFileSync(path.join(ROOT,'r96/runtime-text/index.html'),'utf8');
ok(/<script src="\.\/mob-3d-r1312\.js"><\/script>\n<script src="\.\/face-3d-r1314\.js"><\/script>/.test(html),'스크립트 태그: 3D 덧씌우기 묶음 맨 뒤(R1312 바로 뒤, onBeforeRender 가장 바깥이라 R1309·R1313 보다 먼저 방향을 정함)');
ok(html.indexOf('hwando-3d-r1302.js')<html.indexOf('face-3d-r1314.js'),'R1302 뒤에 로드');
ok(fs.readFileSync(path.join(ROOT,'r96/runtime-text/face-3d-r1314.js'),'utf8')===code,'runtime-text 사본 같음');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'face-3d-r1314.js'"),'공개 검증 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1314/r1314-cpu-check.cjs'),'CI 줄');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(ROOT,'r96/runtime-manifest.json'),'utf8'))).includes('face-3d-r1314.js'),'매니페스트');
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
