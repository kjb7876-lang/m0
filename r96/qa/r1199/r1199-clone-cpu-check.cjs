'use strict';
// R1199 ② — 사몽 중 분신(칠묵영 수묵 분신 7체 등)이 영웅 그리기(drawHero)를 다시 부를 때 사몽 장식이 분신 수만큼 겹쳐 그려지던 렉.
//  측정(헤드리스 무한생존, 환도 사몽): 조종 영웅 그리기 장면당 1번 + 분신 그리기 14번 → R572 적중 문양(맵 전체 최대 24개)을 장면당 15번,
//   R571 불꽃 오라 앞·뒤를 15번씩 그려 이 셋만 장면당 JS 약 26ms(장면 명령 1,461개 중 R572 문양 345·R571 오라 541).
//  사몽은 확률 ×1.77 이라 칠묵영(6%→10.6%) 같은 분신 패시브가 더 자주 터져 각성 때 특히 심해진다.
//  규칙: ① 적중 문양은 맵에 한 벌이므로 바깥(조종 영웅) 그리기 한 번에만 그린다(분신 그리기 안에서는 안 그림). 화면 결과는 같은 자리 겹그리기만 빠진다.
//   ② 분신의 사몽 장식(R571 오라·R572 몸 문양)은 성능 7단계 5(기본·자동) 이하에서 생략, 6~7 은 그대로(사용자 2026-11-19 05:38Z 결정).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),SRC=path.join(R,'client-source'),RT=path.join(R,'runtime-text');
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
for(const f of ['samong-surge-r571.js','samong-theme-r572.js'])ok(fs.readFileSync(path.join(RT,f),'utf8')===fs.readFileSync(path.join(SRC,f),'utf8'),'runtime-text 사본 = client-source('+f+')');
function stage(opt={}){
 const ctx=new Proxy({filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'',strokeStyle:'',lineWidth:1},{get(t,k){if(k in t&&typeof t[k]!=='function')return t[k];if(k==='scope')return undefined;return ()=>{};},set(t,k,v){t[k]=v;return true;}});
 const sb={console,JSON,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Symbol,Error,TypeError,Proxy,Reflect,isFinite,performance:{now:()=>0},
  document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}},hidden:false},localStorage:{getItem:()=>null,setItem(){}}};
 sb.window=sb;if(opt.step!=null)sb.__STORYWORLD_PERF7_R1043__={step:()=>opt.step};vm.createContext(sb);
 vm.runInContext(`var started=true,modal=false,loading=false,layer='DREAM',time=100,zoom=1,settings={lowFx:false};var room={enemies:[]};var e568HeroActionContext=null;var ctx=null;var heroDraws=0,clones=0,inClone=false;
  var player={hero:'hwando',x:10,y:10,hp:100,samong:7,samongCD:0,specialCD:0,blinkCD:0,egoCD:0,attackCD:0,storyWER:{ready:{},buffs:{}}};
  function project(x,y){return{x:(x-y)*64+640,y:(x+y)*32+300};}function actorHeight(){return 66*zoom;}
  function hitEnemy(e,v,s){e.hp-=v;return true;}function tick(dt){time+=dt;}
  function drawHero(){heroDraws++;if(clones&&!inClone){inClone=true;try{for(let i=0;i<clones;i++)window.drawHero();}finally{inClone=false;}}}function delay(){}function special(){}`,sb);
 sb.ctx=ctx;vm.runInContext('ctx=window.ctx',sb);
 for(const f of ['samong-theme-r572.js','samong-surge-r571.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
 const T=sb.__STORYWORLD_SAMONG_THEME_R572__,S=sb.__STORYWORLD_SAMONG_SURGE_R571__;
 // 적중 문양 3개
 vm.runInContext(`for(let i=0;i<3;i++)hitEnemy({id:'m'+i,x:5+i,y:5,hp:9},1,{storyWER:true});`,sb);
 return{sb,T,S,run:c=>vm.runInContext(c,sb),frame(cl){sb.clones=cl;vm.runInContext('clones='+cl+';drawHero();',sb);}};}
let s=stage();
const marks0=s.T.inspect().marks;ok(marks0>=1,'적중 문양이 쌓임('+marks0+')');
const st=()=>({mp:s.T.inspect().stats.markPasses,mo:s.T.inspect().stats.motifs,au:s.S.inspect().stats.auraDraws});
let a=st();s.frame(0);let b=st();ok(b.mp-a.mp===1,'분신 없음: 적중 문양 장면당 1번('+(b.mp-a.mp)+')');
a=st();s.frame(14);b=st();ok(b.mp-a.mp===1,'분신 14번 그리기: 적중 문양은 여전히 장면당 1번('+(b.mp-a.mp)+')');
ok(b.au-a.au===2&&b.mo-a.mo===2,'성능 단계 없음(기본 5): 분신 오라·몸 문양 생략, 조종 영웅만(오라 '+(b.au-a.au)+'·문양 '+(b.mo-a.mo)+' = 1벌×앞뒤)');
for(const step of [6,7]){s=stage({step});a=st();s.frame(14);b=st();ok(b.au-a.au===30&&b.mo-a.mo===30&&b.mp-a.mp===1,'성능 '+step+'단계: 분신 장식 그대로, 문양 1번(오라 '+(b.au-a.au)+')');}
for(const step of [1,4,5]){s=stage({step});a=st();s.frame(14);b=st();ok(b.au-a.au===2&&b.mo-a.mo===2&&b.mp-a.mp===1,'성능 '+step+'단계: 분신의 사몽 오라·몸 문양 생략, 조종 영웅만(오라 '+(b.au-a.au)+'·문양 '+(b.mo-a.mo)+')');}
s=stage({step:5});a=st();s.frame(0);b=st();ok(b.au-a.au===2&&b.mo-a.mo===2,'성능 5단계라도 분신이 없으면 조종 영웅 장식은 그대로');
// 분신 그리기 도중 예외가 나도 깊이가 돌아온다
s=stage();s.run(`var boom=true;`);const dh=s.sb.drawHero;let threw=false;s.sb.clones=0;
try{s.run(`(function(){const b=drawHero;drawHero=function(){if(boom){boom=false;throw new Error('x');}return b.apply(this,arguments);};})();`);s.run('drawHero()');}catch(_){threw=true;}
a=st();s.run('drawHero()');b=st();ok(b.mp-a.mp===1,'예외 뒤에도 다음 장면 문양 정상('+(b.mp-a.mp)+')');
console.log(`\nR1199 clone CPU ${n-bad}/${n} ${bad?'FAIL':'PASS'}`);process.exit(bad?1:0);
