// R1196 장시간 가상 실행: 사용자 2026-11-19 "새 몹 색조 기능과 기존 걷기 연출이 서로를 반복 호출해, 1시간을 가상으로 돌린 테스트에서 보스 렌더링이 멈췄어요".
// R613(걷기, 1초마다 맨 바깥이 아니면 다시 감쌈)과 R1183(색조, 1.5초마다 맨 바깥이 아니면 다시 감쌈)을 같은 vm 에 올리고 가상 시계로 setInterval 을 돌린다.
// 검사: ① 1시간·3시간 뒤 drawEnemy 가 스택 넘침 없이 몹·보스를 그림 ② 감싸기 겹 수가 시간에 따라 늘지 않음(상한)
//       ③ 색조는 여전히 한 번만, 짝 몹은 그대로 ④ 늦게 감싼 덧씌우기 뒤에도 색조 유지 ⑤ 0초(짧은 판)도 그대로 ⑥ 그리기 한 번 비용이 시간에 따라 늘지 않음
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..');let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}};
const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const GAIT=rd('client-source/mob-gait-r613.js'),TINT=rd('client-source/mob-dup-tint-r1183.js');
function world(){const store={},log=[];let calls=0;
 const proto={drawImage(img){log.push({src:img.src,filter:this.filter});},fillRect(){},save(){},restore(){},translate(){},rotate(){},scale(){}};
 const ctx=Object.create(proto);ctx.filter='none';
 const ivs=[];const C={Math,String,Number,Array,Object,JSON,RegExp,Map,WeakMap,Set,Error,console,
  setInterval:(f,ms)=>{ivs.push({f,ms:ms||16,next:ms||16});return ivs.length;},clearInterval(){},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},ctx,room:{id:'ep1b08'},time:0};
 C.drawEnemy=function(e){calls++;ctx.filter='none';ctx.drawImage({src:'https://x/'+e.path});ctx.filter='none';ctx.fillRect();};
 C.window=C;vm.createContext(C);vm.runInContext(GAIT,C);vm.runInContext(TINT,C);
 // 가상 시계: ms 단위로 interval 을 순서대로 돌린다(실시간 대기 없음).
 let now=0;const run=sec=>{const end=now+sec*1000;for(;;){let nx=null;for(const it of ivs)if(it.next<=end&&(!nx||it.next<nx.next))nx=it;if(!nx)break;now=nx.next;C.time=now/1000;try{nx.f();}catch(_){}nx.next+=nx.ms;}now=end;C.time=now/1000;};
 return {C,log,ctx,run,calls:()=>calls};}
const MOB={name:'전극을 두른 좀비 수호기사',path:'x/zombie_guardian_knight_bloodied.webp',hp:5,maxHp:5,x:3,y:3};
const PAIR={name:'전극기계수호기사',path:'x/zombie_guardian_knight_bloodied.webp',hp:5,maxHp:5,x:4,y:3};
const BOSS={name:'불면귀',path:'x/boss.webp',hp:900,maxHp:900,boss:true,x:5,y:5};
function draw(w,e){w.log.length=0;let err=null;try{w.C.drawEnemy({...e});}catch(x){err=x;}return {err,body:w.log[0]};}
function wraps(w){const g=w.C.__STORYWORLD_MOB_GAIT_R613__.inspect().stats.wraps||0,t=w.C.__STORYWORLD_DUP_TINT_R1183__.inspect().stats.wraps||0;return {g,t,all:g+t};}
function depthOf(w){let d=0;const C=w.C,base=C.drawEnemy;// 사슬 깊이: 스택 길이 차이로 잰다
 const probe=[];const prev=w.ctx.drawImage;w.ctx.drawImage=function(img){probe.push(new Error().stack.split('\n').length);return Object.getPrototypeOf(w.ctx).drawImage.call(this,img);};
 Error.stackTraceLimit=Infinity;try{base({...BOSS});}catch(_){}Error.stackTraceLimit=10;delete w.ctx.drawImage;return probe[0]||-1;}
// ⑤ 0초
{const w=world();const r=draw(w,MOB),p=draw(w,PAIR),b=draw(w,BOSS);
 ok(!r.err&&/hue-rotate/.test(r.body&&r.body.filter||''),'⑤ 0초 대상 몹 색조 ('+(r.err||r.body&&r.body.filter)+')');
 ok(!p.err&&p.body&&p.body.filter==='none','⑤ 0초 짝 몹 그대로');ok(!b.err&&b.body&&b.body.filter==='none','⑤ 0초 보스 그대로');}
// ① ② ③ ⑥ 1시간·3시간
const w=world();w.run(60);const w60=wraps(w),d60=depthOf(w);
w.run(3600-60);const w1h=wraps(w),d1h=depthOf(w);
{const r=draw(w,MOB),p=draw(w,PAIR),b=draw(w,BOSS);
 ok(!b.err&&!!b.body,'① 1시간 뒤 보스 그려짐 ('+(b.err&&b.err.message)+')');
 ok(!r.err&&!!r.body,'① 1시간 뒤 대상 몹 그려짐 ('+(r.err&&r.err.message)+')');
 ok(!r.err&&r.body&&(r.body.filter.match(/hue-rotate/g)||[]).length===1,'③ 1시간 뒤 색조 한 번만 ('+(r.body&&r.body.filter)+')');
 ok(!p.err&&p.body&&p.body.filter==='none','③ 1시간 뒤 짝 몹 그대로');}
ok(w1h.all<=w60.all+4,'② 1시간 감싸기 겹 수 상한 (1분 '+JSON.stringify(w60)+' → 1시간 '+JSON.stringify(w1h)+')');
ok(d1h>0&&d1h<=d60+40,'⑥ 1시간 뒤 사슬 깊이(스택 줄) 그대로 (1분 '+d60+' → 1시간 '+d1h+')');
w.run(7200);const w3h=wraps(w);{const b=draw(w,BOSS),r=draw(w,MOB);
 ok(!b.err&&!!b.body&&!r.err&&/hue-rotate/.test(r.body&&r.body.filter||''),'① 3시간 뒤 보스·대상 몹 그려짐 ('+((b.err||r.err)&&(b.err||r.err).message)+')');}
ok(w3h.all===w1h.all,'② 3시간 감싸기 겹 수 그대로 ('+JSON.stringify(w1h)+' → '+JSON.stringify(w3h)+')');
// ④ 늦게 감싼 덧씌우기(맨 바깥)가 들어온 뒤에도 색조·걷기 판정 유지, 사슬 안 늘어남
{const outer=w.C.drawEnemy;w.C.drawEnemy=function(e){return outer.call(this,e);};w.run(600);const r=draw(w,MOB);
 ok(!r.err&&r.body&&(r.body.filter.match(/hue-rotate/g)||[]).length===1,'④ 늦은 덧씌우기 뒤 색조 한 번 ('+(r.body&&r.body.filter)+')');
 ok(wraps(w).all<=w3h.all+2,'④ 늦은 덧씌우기 뒤 감싸기 겹 수 상한 ('+JSON.stringify(wraps(w))+')');}
console.log(fails?'FAILED '+fails+'/'+n:'ALL PASS '+n);process.exit(fails?1:0);
