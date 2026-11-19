'use strict';
// R1217 ③④ — 사몽 각성 연출 나눠 켜기·성능 1~4단계 줄이기(사용자 2026-11-19 "1-4 개선적용").
//  ③ 엔진 showAwakening 은 컷인·번쩍임·소리와 함께 큰 문양 이펙트 둘(왕관 크기 5·시계 3.4)을 같은 장면에 띄운다 → 컷인·번쩍임·소리는 그대로 두고
//     그 안의 fx 는 0.1초 간격(0.1·0.2초)으로 나눠 띄운다(0.3초 안). 각성 판정·무적·시간은 그대로.
//  ④ 성능 7단계 1~4: 각성 문양은 첫 것(왕관)만, 1~2 는 문양 없음. R571 사몽 불꽃 오라는 혀 6개·불티 4개, 바깥 큰 혀(lighter) 생략.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
const F='samong-stagger-r1217.js';const has=fs.existsSync(path.join(SRC,F));ok(has,'새 오버레이 '+F+' 있음');
const src=has?fs.readFileSync(path.join(SRC,F),'utf8'):'';ok(has&&fs.existsSync(path.join(RT,F))&&fs.readFileSync(path.join(RT,F),'utf8')===src,'runtime-text 사본 = client-source');
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');ok(html.includes('<script src="./'+F+'"></script>'),'index.html 에 실림');
ok(fs.readFileSync(path.join(ROOT,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'공개 확인 목록에 있음');
ok(fs.readFileSync(path.join(ROOT,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1217/r1217-stagger-cpu-check.cjs'),'pages.yml 이 이 검사를 돌림');
function mk(step){const log=[];let timers=[];
 const sb={console,Math,JSON,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Error,time:10,player:{hero:'hwando',samong:0},
  localStorage:{getItem:()=>null,setItem(){}},setInterval:(f)=>{timers.push(f);return 1;},clearInterval(){},
  fx:(kind,x,y,o)=>{log.push({kind,size:o?.size,at:sb.time});},
  showAwakening(reason){sb.shown=(sb.shown||0)+1;sb.flash=.15;sb.fx('sigil',0,0,{size:5,life:1.1});sb.fx('sigil',0,0,{size:3.4,life:1.6});sb.sound='awake';}};
 if(step!=null)sb.__STORYWORLD_PERF7_R1043__={step:()=>step};sb.window=sb;vm.createContext(sb);if(src)vm.runInContext(src,sb,{filename:F});
 const run=()=>{for(const f of timers)f();};return{sb,log,run,adv:s=>{sb.time+=s;run();}};}
if(src){
 let m=mk();m.run();m.sb.showAwakening('story');
 ok(m.sb.shown===1&&m.sb.flash===.15&&m.sb.sound==='awake','컷인·번쩍임·소리는 그 장면에 그대로');
 ok(m.log.length===0,'큰 문양 이펙트는 각성 장면에 바로 띄우지 않음('+m.log.length+')');
 m.adv(.05);ok(m.log.length===0,'0.05초: 아직');m.adv(.06);ok(m.log.length===1&&m.log[0].size===5,'0.1초 뒤 왕관 문양');
 m.adv(.1);ok(m.log.length===2&&m.log[1].size===3.4,'0.2초 뒤 시계 문양(0.3초 안에 다 켜짐)');
 ok(typeof m.sb.fx==='function'&&m.sb.fx.name!=='collect','fx 는 원래 함수로 돌아옴');
 m.sb.fx('hit',0,0,{size:1});ok(m.log.length===3,'각성 밖의 fx 는 바로');
 m=mk(4);m.run();m.sb.showAwakening('story');m.adv(.5);ok(m.log.length===1&&m.log[0].size===5,'성능 4단계: 문양은 왕관 하나만('+m.log.length+')');
 m=mk(2);m.run();m.sb.showAwakening('story');m.adv(.5);ok(m.log.length===0&&m.sb.flash===.15,'성능 2단계: 문양 없음, 컷인·번쩍임은 그대로');
 m=mk(7);m.run();m.sb.showAwakening('story');m.adv(.5);ok(m.log.length===2,'성능 7단계: 문양 둘 다(나눠서)');
 m=mk();m.run();m.sb.showAwakening('story');m.sb.time+=100;m.run();ok(m.log.length===2,'시간이 많이 지나도 남은 것을 한 번에 띄움(빠뜨리지 않음)');
 m=mk();m.run();m.sb.showAwakening=function(){throw new Error('x');};let threw=false;try{m.sb.showAwakening();}catch(_){threw=true;}ok(threw,'(점검) 원래 함수 예외는 그대로');
 m=mk();m.run();const api=m.sb.__STORYWORLD_SAMONG_STAGGER_R1217__;ok(api&&typeof api.inspect==='function','API');
 m.sb.showAwakening('story');ok(api.inspect().stats.queued===2,'inspect: 미룬 문양 2');
}
// ④ R571 오라
const r571=fs.readFileSync(path.join(SRC,'samong-surge-r571.js'),'utf8');ok(fs.readFileSync(path.join(RT,'samong-surge-r571.js'),'utf8')===r571,'runtime-text 사본 = client-source(R571)');
{const calls={};const mkCtx=()=>{const c={save(){},restore(){},translate(){},scale(){},beginPath(){},arc(){},moveTo(){},lineTo(){},closePath(){},bezierCurveTo(){},quadraticCurveTo(){},
  fill(){calls.fill=(calls.fill||0)+1;},stroke(){calls.stroke=(calls.stroke||0)+1;},set globalCompositeOperation(v){if(v==='lighter')calls.lighter=(calls.lighter||0)+1;},get globalCompositeOperation(){return 'source-over';}};return c;};
 const run=(step)=>{for(const k of Object.keys(calls))delete calls[k];
  const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,performance:{now:()=>1000},time:10,zoom:1,ctx:mkCtx(),settings:{lowFx:false},layer:'DREAM',
   localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>1,project:(x,y)=>({x:100,y:100}),actorHeight:()=>66,
   player:{hero:'hwando',samong:5,x:0,y:0,hp:10},drawHero(){},room:{enemies:[]}};
  if(step!=null)sb.__STORYWORLD_PERF7_R1043__={step:()=>step};sb.window=sb;vm.createContext(sb);vm.runInContext(r571,sb,{filename:'samong-surge-r571.js'});
  sb.drawHero();sb.time+=.5;sb.drawHero();return {...calls};};
 const c5=run(5),c4=run(4),c7=run(7);console.log('  R571 그리기 수',JSON.stringify({c7,c5,c4}));
 ok(c5.fill>0&&c5.fill===c7.fill,'성능 5·7단계 오라는 그대로('+c5.fill+')');
 ok(c4.fill>0&&c4.fill<=c5.fill*.55,'성능 4단계 오라 칠하기 절반 이하('+c4.fill+' / '+c5.fill+')');
 ok((c4.lighter||0)<(c5.lighter||0),'성능 4단계: 바깥 큰 혀(lighter) 줄임');}
console.log(`\nR1217 stagger CPU ${n-bad}/${n} ${bad?'FAIL':'PASS'}`);process.exit(bad?1:0);
