// R1328 3D 영웅 대각선 공격 방향 — CPU 검사(브라우저 없음).
//  사용자 11-26 07:25Z "근데 영웅 공격모션 대각선은 왜 안됨?"
//  원인: face-3d-r1314.js 는 서서 공격할 때 '찍어 둔 대상(target)' 이 있을 때만 그 적을 보고, 대상 없이 가까운 적을 치는
//        기본 공격(엔진 basicAttack: 근접 = 사거리 안·길이 트인 가장 가까운 적, 원거리 = 사거리 안 가장 가까운 적)에서는 엔진 4방향만 따랐다.
//  고침: 대상이 없거나 사거리 밖이면 기본 공격이 실제로 때리는 적(엔진과 같은 규칙) 쪽을 본다.
//  ① 대상 없이 서서 공격, 적이 16방향 어디에 있어도 몸이 그 적 쪽(1° 안). 근접(환도)·원거리(기억사수) 모두.
//  ② 고르는 규칙: 사거리 안 가장 가까운 적 / 찍은 대상이 사거리 안이면 더 먼 대상 / 대상이 사거리 밖이면 사거리 안 가까운 적 /
//     죽은 적·교전 전 보스·좌표 NaN 은 건너뜀 / 근접은 길이 막힌 적 건너뜀(원거리는 안 건너뜀).
//  ③ 경계: 사거리 딱 끝(포함)·바로 밖(제외), 적 없음·사거리 0·영웅 표 없음·같은 자리(거리 0) → 예전 동작(대상 쪽 또는 엔진 4방향), NaN 없음.
//  ④ 공격 한 번 동안 고른 적 유지(더 가까운 적이 끼어들어도 흔들리지 않음), 고른 적이 죽으면 다음 적, 다음 공격에서 다시 고름.
//  ⑤ 회귀: 걷는 중이면 이동 방향이 먼저, 끄기 키면 손대지 않음, 연결(원본 = runtime-text 사본, CI 줄).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),SRC=path.join(ROOT,'r96/client-source/face-3d-r1314.js');
let fail=0;const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fail++;};
const code=fs.readFileSync(SRC,'utf8');
function world(opts={}){
 const g={name:'r1305-hwando-3d-shared',visible:true,position:{x:10,y:0,z:10},rotation:{y:0},updates:0,updateMatrixWorld(){this.updates++;}};
 const scene={children:[g],onBeforeRender:null};let raf=null;const store={...(opts.store||{})};
 const sb={console,performance:{now:()=>0},Math,Number,String,Object,WeakMap,JSON,Array,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},requestAnimationFrame:f=>{raf=f;},
  time:0,target:null,room:{enemies:[],engaged:false},player:{x:10,y:10,hero:opts.hero||'hwando',moving:false,moveVX150:0,moveVY150:0,attackAnim:0,direction:'front'},
  HEROES:opts.noHeroes?undefined:{hwando:{type:'blade',range:2},gunner:{type:'gun',range:6},zero:{type:'gun',range:0}},
  clearLine:(a,b)=>!b.walled};
 if(opts.noHeroes)delete sb.HEROES;
 sb.window=sb;sb.__STORYWORLD_PHASE1__={controller:{state:{three:{scene,T:{}}}}};sb.__STORYWORLD_HWANDO3D_R1302__={on:()=>true};
 vm.createContext(sb);vm.runInContext(code,sb,{filename:'face-3d-r1314.js'});raf&&raf();
 const frame=(dt=1/30,n=1)=>{for(let i=0;i<n;i++){sb.time+=dt;g.rotation.y=0.123;scene.onBeforeRender?.();}};
 // 엔진처럼: 공격 = attackAnim .24 로 올리고 프레임마다 줄어듦
 const attack=(n=40)=>{sb.player.attackAnim=.24;for(let i=0;i<n;i++){frame();sb.player.attackAnim=Math.max(0,sb.player.attackAnim-1/30);if(sb.player.attackAnim<=0&&i<n-1&&i%8===7)sb.player.attackAnim=.24;}};
 return {sb,g,scene,frame,attack};}
const D=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return Math.abs(d)*180/Math.PI;};
const to=(P,e)=>Math.atan2(e.x-P.x,e.y-P.y),E=(id,x,y,o={})=>({id,x,y,hp:5,...o});
// ① 16방향
for(const hero of ['hwando','gunner']){let worst=0;for(let k=0;k<16;k++){const W=world({hero}),P=W.sb.player,a=k*Math.PI/8,e=E('e',10+Math.cos(a)*1.5,10+Math.sin(a)*1.5);
  W.sb.room.enemies=[e];P.direction='front';W.attack();worst=Math.max(worst,D(W.g.rotation.y,to(P,e)));}
 ok(worst<1,`① ${hero}: 대상 없이 16방향 공격, 몸이 적 쪽(가장 큰 차이 ${worst.toFixed(2)}°)`);}
// ② 고르는 규칙
{const W=world(),P=W.sb.player,near=E('n',11,10),far=E('f',10,11.8);W.sb.room.enemies=[far,near];W.attack();ok(D(W.g.rotation.y,to(P,near))<1,'② 사거리 안 가장 가까운 적');}
{const W=world(),P=W.sb.player,near=E('n',11,10),far=E('f',10,11.8);W.sb.room.enemies=[near,far];W.sb.target='f';W.attack();ok(D(W.g.rotation.y,to(P,far))<1,'② 찍은 대상이 사거리 안이면 더 멀어도 대상');}
{const W=world(),P=W.sb.player,near=E('n',11,10),far=E('f',10,15);W.sb.room.enemies=[near,far];W.sb.target='f';W.attack();ok(D(W.g.rotation.y,to(P,near))<1,'② 대상이 사거리 밖이면 사거리 안 가까운 적(엔진이 때리는 적)');}
{const W=world(),P=W.sb.player,live=E('l',10,11.5);W.sb.room.enemies=[E('d',10.5,10,{hp:0}),E('b',10,10.6,{boss:true}),E('x',NaN,10),null,live];W.attack();ok(D(W.g.rotation.y,to(P,live))<1,'② 죽은 적·교전 전 보스·NaN·빈 칸 건너뜀');
 const W2=world(),b=E('b',10,10.6,{boss:true});W2.sb.room.engaged=true;W2.sb.room.enemies=[b,live];W2.attack();ok(D(W2.g.rotation.y,to(W2.sb.player,b))<1,'② 교전 중 보스는 고름');}
{const W=world(),P=W.sb.player,wall=E('w',10.5,10,{walled:true}),open=E('o',10,11.5);W.sb.room.enemies=[wall,open];W.attack();ok(D(W.g.rotation.y,to(P,open))<1,'② 근접: 길이 막힌 적 건너뜀');
 const W2=world({hero:'gunner'});W2.sb.room.enemies=[wall,open];W2.attack();ok(D(W2.g.rotation.y,to(W2.sb.player,wall))<1,'② 원거리: 막힌 적도 가장 가까우면 고름(엔진 nearestEnemy 와 같음)');}
// ③ 경계
{const W=world(),P=W.sb.player,e=E('e',12,10);W.sb.room.enemies=[e];P.direction='back';W.attack();ok(D(W.g.rotation.y,to(P,e))<1,'③ 사거리 딱 끝(2.0) 포함');
 const W2=world(),e2=E('e',12.01,10);W2.sb.room.enemies=[e2];W2.sb.player.direction='back';W2.attack();ok(D(W2.g.rotation.y,Math.PI+Math.PI/4)<1,'③ 사거리 바로 밖(2.01) → 엔진 4방향(back)',{yaw:W2.g.rotation.y});}
{const W=world();W.sb.player.direction='left';W.attack();ok(D(W.g.rotation.y,-Math.PI/2+Math.PI/4)<1,'③ 적 없음 → 엔진 4방향(left)');}
{const W=world({hero:'zero'}),e=E('e',10.5,10);W.sb.room.enemies=[e];W.sb.player.direction='right';W.attack();ok(D(W.g.rotation.y,Math.PI/2+Math.PI/4)<1,'③ 사거리 0 → 엔진 4방향');
 const W2=world({noHeroes:true});W2.sb.room.enemies=[e];W2.sb.player.direction='right';W2.attack();ok(D(W2.g.rotation.y,Math.PI/2+Math.PI/4)<1&&W2.sb.__STORYWORLD_FACE3D_R1314__.inspect().errors===0,'③ 영웅 표 없음 → 엔진 4방향, 오류 0');
 const W3=world({noHeroes:true});W3.sb.room.enemies=[E('t',13,11)];W3.sb.target='t';W3.attack();ok(D(W3.g.rotation.y,Math.atan2(3,1))<1,'③ 영웅 표 없어도 찍은 대상 쪽(예전 동작)');
 const W4=world(),far=E('t',13,11);W4.sb.room.enemies=[far];W4.sb.target='t';W4.attack();ok(D(W4.g.rotation.y,to(W4.sb.player,far))<1,'③ 사거리 안 적이 없고 대상만 멀리 있으면 대상 쪽(예전 동작)');}
{const W=world(),e=E('e',10,10);W.sb.room.enemies=[e];W.sb.player.direction='right';W.attack();ok(Number.isFinite(W.g.rotation.y)&&D(W.g.rotation.y,Math.PI/2+Math.PI/4)<1,'③ 적이 같은 자리(거리 0) → NaN 없이 엔진 4방향',{yaw:W.g.rotation.y});}
// ④ 유지·바꿈
{const W=world(),P=W.sb.player,a=E('a',11.5,10),b=E('b',10,10.5);W.sb.room.enemies=[a];P.attackAnim=.24;W.frame(1/30,3);W.sb.room.enemies=[a,b];for(let i=0;i<4;i++){W.frame();}
 ok(W.sb.__STORYWORLD_FACE3D_R1314__.inspect().last.aim==='a','④ 공격 한 번 동안 고른 적 유지(더 가까운 적이 끼어들어도)',W.sb.__STORYWORLD_FACE3D_R1314__.inspect().last);
 a.hp=0;W.frame(1/30,2);ok(W.sb.__STORYWORLD_FACE3D_R1314__.inspect().last.aim==='b','④ 고른 적이 죽으면 다음 적');
 a.hp=5;P.attackAnim=0;W.frame(1/30,20);W.sb.room.enemies=[a,b];b.x=10;b.y=11.9;a.x=10.5;a.y=10;P.attackAnim=.24;W.frame(1/30,30);ok(D(W.g.rotation.y,to(P,a))<1&&W.sb.__STORYWORLD_FACE3D_R1314__.inspect().last.aim==='a','④ 다음 공격에서 다시 고름(가까워진 a)');}
// ⑤ 회귀
{const W=world(),P=W.sb.player;W.sb.room.enemies=[E('e',11,10)];P.moving=true;P.moveVX150=-1;P.moveVY150=1;P.attackAnim=.2;W.frame(1/30,40);ok(D(W.g.rotation.y,Math.atan2(-1,1))<1,'⑤ 걷는 중이면 이동 방향이 먼저');}
{const W=world({store:{'storyworld.r1314.face3d':'off'}});W.sb.room.enemies=[E('e',11,10)];W.attack();ok(W.g.rotation.y===0.123&&W.g.updates===0,'⑤ 끄기 키면 손대지 않음');}
ok(code===fs.readFileSync(path.join(ROOT,'r96/runtime-text/face-3d-r1314.js'),'utf8'),'⑤ 원본 = runtime-text 사본');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1328/r1328-cpu-check.cjs'),'⑤ CI 줄');
console.log(fail?'\nR1328 CPU FAIL '+fail:'\nR1328 CPU PASS');process.exit(fail?1:0);
