// R1028 CPU check — 보스 그림 좌우 '갈팡질팡'(사용자 2026-11-14 "보스들 이미지 좌우바뀌면서 갈팡질팡하는거 보라검천사같이 하는거 개선").
//  헤드리스 실측(거미 동굴 보라검천사, 자동 전투 30초): 그림 좌우가 11번 바뀌었고 6번은 0.5초 안에 되돌아왔다(R444 결정은 5번).
//  원인: 엔진 drawEnemy(index.html renderSourceAttack)가 보스·이야기 공격 자세 창(storyAttackUntil5)에서 그리는 동안만
//   e.attack={angle:0, storyWorldPose5:true} 가짜를 꽂는다. R444 atkAngle 이 이 각 0(화면 오른쪽)을 '공격 판정 각'으로 믿어
//   그 그리기 안에서만 좌우를 오른쪽으로 잠갔다가 다음 프레임 원거리 조준 각(왼쪽)으로 되돌렸다 → 0.05~0.15초 깜빡임.
//  기대: 그리기용 가짜 공격(storyWorldPose5)은 판정 각이 아니므로 좌우를 바꾸지 않는다. 진짜 공격(각 0 포함)은 그대로 바로 따른다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x):'');}else console.log('ok  ',m);};
const F='enemy-face-r444.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
ok('pages.yml runs this check',/r96\/qa\/r1028\/r1028-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 엔진 그리기 흉내: storyAttackUntil5 창이면 그리는 동안만 가짜 e.attack(angle 0)을 꽂고, 그 안에서 R444 에 좌우를 묻는다(R54 자세 프레임·R51 flip 사슬과 같은 자리)
function env(){const E={console,Math,JSON,Number,String,Object,WeakMap,Map,Set,Array,localStorage:{getItem:()=>null,setItem:()=>{}},time:0,player:{x:10,y:12,hp:100},settings:{},inner:[],outer:[]};
 E.window=E;E.drawEnemy=function(e){const orig=e.attack;const fake=E.time<(e.storyAttackUntil5||0)&&!e.attack;if(fake)e.attack={elapsed:0,angle:0,committed:true,storyWorldPose5:true};
  try{E.inner.push(E.__STORYWORLD_ENEMY_FACE_R444__.left(e)?'left':'right');}finally{e.attack=orig;}};E.shadow=function(){};vm.createContext(E);vm.runInContext(src,E);return E;}
const boss=o=>({id:'b1',name:'보라검천사',x:16,y:12,hp:1e4,maxHp:1e4,speed:1.6,spawnState:'active',direction:'left',midboss:true,ai:'hybrid',combatProfile:{aggro:7,attackShape:{range:1.6}},...o});
const flips=a=>{let f=0;for(let i=1;i<a.length;i++)if(a[i]!==a[i-1])f++;return f;};
function run(E,e,frames,step,dt=1/20){for(let i=0;i<frames;i++){E.time+=dt;if(step)step(e,i);E.drawEnemy(e);E.outer.push(E.__STORYWORLD_ENEMY_FACE_R444__.side(e));}}
// 1) 실측 꼴: 원거리 조준(왼쪽, π) 동안 이야기 공격 자세 창이 겹쳐 그리기 안에 가짜 각 0 이 들어온다
{const E=env(),e=boss({});run(E,e,2);e.rangedWindup=1.2;e.rangedAim=Math.PI;e.storyAttackUntil5=E.time+1.2;E.inner.length=0;E.outer.length=0;
 run(E,e,20,(e)=>{e.rangedWindup-=1/20;});
 const all=E.inner.concat(E.outer);ok(`ranged aim left + draw-only fake attack(angle 0): body stays left every frame (inner flips ${flips(E.inner)}, any right ${all.includes('right')})`,!all.includes('right')&&flips(E.inner)===0,E.inner.join(''));}
// 2) 공격이 끝난 뒤 자세 창(가짜만 남음): 마지막 진짜 공격 쪽(왼쪽)을 그대로 둔다
{const E=env(),e=boss({});run(E,e,2);e.attack={elapsed:0,angle:Math.PI,committed:false};run(E,e,6);e.attack=null;e.storyAttackUntil5=E.time+.6;E.inner.length=0;E.outer.length=0;run(E,e,10);
 ok(`after a real left attack, the pose window's fake angle 0 keeps left (inner ${E.inner.join(',')})`,E.inner.every(s=>s==='left')&&E.outer.every(s=>s==='left'));}
// 3) 경계: 가짜는 오른쪽(0)·진짜 조준도 오른쪽(0.02) — 오른쪽, 깜빡임 없음
{const E=env(),e=boss({direction:'right'});run(E,e,2);e.rangedWindup=1;e.rangedAim=.02;e.storyAttackUntil5=E.time+1;E.inner.length=0;run(E,e,15,(e)=>{e.rangedWindup-=1/20;});
 ok('ranged aim right + fake angle 0: right, no flicker',E.inner.every(s=>s==='right'));}
// 4) 회귀: 진짜 근접 공격 각 0(오른쪽)은 왼쪽을 보던 보스도 그 순간 바로 오른쪽(엔진 enemy-facing 전수 검사와 같은 요구)
{const E=env(),e=boss({});run(E,e,3);e.attack={elapsed:0,angle:0,committed:false};run(E,e,1);ok('regression: a real attack at angle 0 turns right at once',E.inner[E.inner.length-1]==='right'&&E.outer[E.outer.length-1]==='right');}
// 5) 회귀: 같은 순간(게임 시간 멈춤)에 진짜 공격 각이 바뀌면 바로 따른다
{const E=env(),e=boss({});run(E,e,2);e.attack={elapsed:0,angle:Math.PI,committed:false};E.drawEnemy(e);const a=E.__STORYWORLD_ENEMY_FACE_R444__.side(e);e.attack.angle=0;const b=E.__STORYWORLD_ENEMY_FACE_R444__.side(e);
 ok(`regression: frozen-time real angle change follows immediately (${a}→${b})`,a==='left'&&b==='right');}
// 6) 보스 자동 전투 꼴 모의: 2.2초마다 원거리 조준 1초(왼쪽) + 그 앞뒤 이야기 공격 자세 창 0.9초 — 10초 동안 좌우 바뀜 0
{const E=env(),e=boss({});run(E,e,2);E.inner.length=0;let k=0;run(E,e,200,(e,i)=>{const t=E.time;if(i%44===0){e.rangedWindup=1;e.rangedAim=Math.PI-.03;e.storyAttackUntil5=t+.9;}if(e.rangedWindup>0)e.rangedWindup-=1/20;});
 ok(`10s boss loop (ranged windups overlapping pose windows): body side changes 0 (got ${flips(E.inner)})`,flips(E.inner)===0);}
console.log(`\nR1028 CPU check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
