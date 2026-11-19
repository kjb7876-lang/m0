// R1234 CPU 검사 — 감시환각 우두머리 떨림·검은안개 크기·죽을 때 커짐·막힐 때 흔들림(모든 몹)
//  ① R1195 먹 안개 몸 고르기: 공격 예고 고리(final42 effects/251 atlas, 화면 너비)를 몸으로 고르지 않는다.
//  ② R205 보스 최소 크기 fitMin 몸 고르기: 같은 효과 그림을 몸으로 보지 않는다.
//  ③ R462 죽음 몸 높이: 살아 있을 때 실제로 그려진 몸 높이(R425 크기 맞춤 등 반영)를 쓴다.
//  ④ R1234 그리는 위치 떨림 보정: 막혀 앞뒤로 밀리는 몹은 화면에서 덜 흔들리고, 걷기·순간이동은 그대로 따라간다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let pass=0;const ok=(c,m)=>{assert.ok(c,m);pass++;};
const src=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const box=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
const mkSb=()=>{const sb={localStorage:{v:{},getItem(k){return this.v[k]??null;},setItem(k,v){this.v[k]=String(v);}},innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),performance:{now:()=>0},
 requestAnimationFrame:null,setInterval:()=>0,setTimeout:()=>0,document:{createElement:()=>null},Math,Date,Map,Set,WeakMap,Array,Uint8Array,Int32Array,Number,String,Object,Promise,JSON,console};sb.window=sb;vm.createContext(sb);return sb;};
const BODY={kind:'image',sourcePath:'assets/r275/mobs/thread-nurse.webp',sourceRect:[0,0,113,195],points:box(346,40,407,145),owner:{kind:'enemy'}};
const RING={kind:'image',sourcePath:'assets/final42-r88/effects/251/atlas.png',sourceRect:[0,0,320,320],points:box(-38,-79,800,340),owner:{kind:'enemy'}};
const RING2={kind:'image',image:{__storyworldStaticSource:{path:'r1195:ink:assets/r430/mist-loop.webp'}},sourceRect:[0,0,96,96],points:box(0,0,900,500)};
// ① R1195
{const sb=mkSb();vm.runInContext(src('mob-feet-ink-r1195.js'),sb);const A=sb.__STORYWORLD_FEET_INK_R1195__;
 ok(A&&typeof A.bodyOf==='function','① R1195 bodyOf 공개');
 if(A&&A.bodyOf){
  ok(A.bodyOf([BODY,RING],0)===BODY,'① 공격 예고 고리가 같이 그려져도 몸 = 몹 그림');
  ok(A.bodyOf([RING,BODY],0)===BODY,'① 순서 바뀌어도 몸 = 몹 그림');
  ok(A.bodyOf([RING],0)===null,'① 효과 그림만 있으면 몸 없음(안개 안 그림)');
  ok(A.bodyOf([BODY,RING2],0)===BODY,'① 자기 먹 안개(r1195:)는 몸이 아님');
  const BLOODMOB={...BODY,sourcePath:'assets/r380/mobs/blood-hound-v1.webp'};ok(A.bodyOf([BLOODMOB],0)===BLOODMOB,'① 경계: 이름에 blood 가 든 몹 그림은 몸으로 인정');
  const SMALL={...BODY,points:box(0,0,10,10)};ok(A.bodyOf([SMALL,BODY],0)===BODY,'① 회귀: 몸 둘 중 큰 것');}}
// ② R205
{const code=src('boss-r205.js');const m=/function fitMin\(st\)\{[^\n]*/.exec(code);ok(m,'② fitMin 있음');
 ok(/fitBody|FX205|isFx/.test(m?m[0]:''),'② fitMin 이 효과 그림을 몸 후보에서 뺀다');
 const sb=mkSb();sb.ctx={commands:[]};sb.actorHeight=()=>60;vm.runInContext(code,sb);const A=sb.__STORYWORLD_BOSS_R205__;
 ok(A&&typeof A.fitBody==='function','② fitBody 공개');
 if(A&&A.fitBody){ok(A.fitBody([BODY,RING],0)===BODY,'② 예고 고리 대신 몸');ok(A.fitBody([RING],0)===null,'② 효과만이면 없음');}}
// ③ R462
{const sb=mkSb();vm.runInContext(src('mob-death-r462.js'),sb);const A=sb.__STORYWORLD_MOB_DEATH_R462__||sb.__STORYWORLD_MOB_DEATH__;
 const fn=A&&A.drawnLookH;ok(typeof fn==='function','③ drawnLookH 공개');
 if(fn){const look={path:'assets/r275/mobs/thread-nurse.webp',frame:{assetFrame:{sourceRect:[0,0,113,195],visibleHeight:150}},h:139.2};
  // 명목 높이 139.2(z=1) → 그리면 상자 195*139.2/150=181px. 실제로 그려진 상자는 111px(R425 크기 맞춤) → 85.3 이어야.
  const cmd={kind:'image',sourcePath:'assets/r275/mobs/thread-nurse.webp',sourceRect:[0,0,113,195],points:box(10,10,70,121)};
  const h=fn([RING,cmd],0,look,1);ok(Math.abs(h-111*150/195)<.6,'③ 죽음 몸 높이 = 실제 그려진 높이 '+h);
  const h2=fn([RING,cmd],0,look,2);ok(Math.abs(h2-111*150/195/2)<.6,'③ 줌 2 에서도 같은 화면 크기 '+h2);
  ok(fn([RING],0,look,1)===look.h,'③ 몸 명령 못 찾으면 원래 값');
  const other={...cmd,sourceRect:[113,0,113,195]};ok(fn([other],0,look,1)===look.h,'③ 다른 칸 그림이면 원래 값');
  // ③-2 Dots 죽음 시트(R1065)로 바꿔 그릴 때: 살아 있을 때 그림 속 몸 높이와 같게(재 나방 1.22~1.46배 커지던 것)
  const mh=A.matchDeathH;ok(typeof mh==='function','③-2 matchDeathH 공개');
  if(mh){const h3=mh(100,{sh:200,vh:200,frac:.6},{sh:256,vh:180,frac:.75});// 살아 있을 때 몸 100*1*.6=60px → 죽음 시트 h*256/180*.75=60 → h=56.25
   ok(Math.abs(h3-56.25)<.01,'③-2 죽음 시트 몸 높이 = 살아 있을 때 몸 높이 '+h3);
   ok(mh(100,null,{sh:256,vh:180,frac:.9})===100,'③-2 재기 전이면 원래 값');ok(mh(100,{sh:200,vh:200,frac:.6},{sh:256,vh:180,frac:0})===100,'③-2 빈 칸이면 원래 값');
   ok(mh(100,{sh:200,vh:200,frac:.1},{sh:200,vh:200,frac:.9})===50,'③-2 경계: 줄임은 0.5배까지');ok(mh(100,{sh:200,vh:200,frac:.9},{sh:200,vh:200,frac:.1})===150,'③-2 경계: 키움은 1.5배까지');}
  const L2={...look};fn([cmd],0,L2,1);ok(L2.drawnR1234===true,'③ 실제로 그려진 칸이면 표시');const L3={...look,drawnR1234:undefined};fn([RING],0,L3,1);ok(!L3.drawnR1234,'③ 못 찾으면 표시 없음(Dots 죽음 시트 맞춤도 안 함)');
  const crazy={...cmd,points:box(0,0,60,1900)};ok(fn([crazy],0,look,1)===look.h,'③ 경계: 10배 넘게 다르면 믿지 않음');}}
// ④ R1234
{const f=path.join(R,'client-source/pos-steady-r1234.js');ok(fs.existsSync(f),'④ pos-steady-r1234.js 있음');
 if(fs.existsSync(f)){const sb=mkSb();let seen=[];sb.time=0;sb.room={id:'ep1a09'};sb.player={x:0,y:0};sb.ctx={commands:[]};
  sb.drawEnemy=function(e){seen.push([e.x,e.y]);};vm.runInContext(fs.readFileSync(f,'utf8'),sb);const A=sb.__STORYWORLD_POS_STEADY_R1234__;ok(A&&A.install&&A.install(),'④ 설치');
  const run=(path)=>{seen=[];const e={id:'m'+Math.random(),hp:10,x:0,y:0,speed:2};const out=[];for(let i=0;i<path.length;i++){sb.time=i/20;e.x=path[i][0];e.y=path[i][1];sb.drawEnemy(e);out.push(seen[seen.length-1]);ok(e.x===path[i][0]&&e.y===path[i][1],'④ 그린 뒤 실제 위치 되돌림');}return out;};
  // 막혀서 앞뒤로 밀림: y 가 0.2초마다 ±0.25 오감
  const osc=[];for(let i=0;i<80;i++)osc.push([5,10+.25*Math.sign(Math.sin(i/20*2*Math.PI*2.5))]);const o=run(osc);
  const amp=a=>{const v=a.slice(30).map(p=>p[1]);return Math.max(...v)-Math.min(...v);};
  ok(amp(o)<amp(osc)*.4,'④ 막혀 밀림 떨림 60% 이상 줄임 '+amp(o).toFixed(3)+'/'+amp(osc).toFixed(3));
  // 똑바로 걷기: 2칸/초
  const walk=[];for(let i=0;i<60;i++)walk.push([i/20*2,3]);const w=run(walk);ok(w.every((p,i)=>Math.hypot(p[0]-walk[i][0],p[1]-walk[i][1])<.02),'④ 걷기는 그대로(지연 0.02칸 미만)');
  // 순간이동: 떨다가 4칸 이동 → 바로 따라감
  const tp=osc.slice(0,40).concat(Array.from({length:10},()=>[9,10]));const t=run(tp);ok(Math.hypot(t[45][0]-9,t[45][1]-10)<.05,'④ 순간이동은 바로 따라감');
  // 경계: 멈춘 몹은 그대로
  const still=Array.from({length:30},()=>[2,2]);const s=run(still);ok(s.every(p=>p[0]===2&&p[1]===2),'④ 멈춘 몹 그대로');
  // 회귀: 보정 폭 상한 0.3칸
  const big=[];for(let i=0;i<80;i++)big.push([5,10+.7*Math.sign(Math.sin(i/20*2*Math.PI*2.5))]);const b=run(big);ok(b.every((p,i)=>Math.hypot(p[0]-big[i][0],p[1]-big[i][1])<=.3001),'④ 보정은 0.3칸 이내');
  // 맞아서 밀리는 중(hitTimer)은 타격감 그대로 — 실제 자리를 따라간다
  {seen=[];const e={id:'h',hp:10,x:5,y:10,hitTimer:.3};const o2=[];for(let i=0;i<80;i++){sb.time=10+i/20;e.y=osc[i][1];sb.drawEnemy(e);o2.push(seen[seen.length-1]);}
   ok(o2.every((p,i)=>p[1]===osc[i][1]),'④ 맞는 동안 밀림은 그대로');}
  // 죽은 몹·구조물은 손대지 않음
  seen=[];const d={id:'d',hp:0,x:1,y:1};sb.drawEnemy(d);ok(seen[0][0]===1,'④ 죽은 몹 그대로');
  // 감싸기 표시 복사(핑퐁 방지)
  ok(sb.drawEnemy.__r1234===true,'④ 감싼 표시');}}
console.log('R1234 jitter-fog cpu check: '+pass+' passed');
