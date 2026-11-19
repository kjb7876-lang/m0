// R1197 CPU 검사: R302 remapF — 판정이 '값이 같은 팔레트'인데 파일만 다른 열쇠를 '섞인 열쇠'로 영영 스택 길에 두지 않기
//  (사용자 2026-11-19 "싹다확인해서 그리기 위주로 전수조사해서 렉파격적개선").
//  헤드리스 실측(사몽 4장 3구역 ep1b08, 환도 777, 640×360, 몹 31·효과 76): 게임 JS 1위가 hero-palette-r302 remapF(12초에 837ms, 프레임당 약 7ms).
//   스택을 잡은 까닭의 절반이 '섞인 열쇠' 3개(|glow|·|flame| 환도 기본색) — polish-r101(영웅 파일)은 환도 팔레트로 바꾼 값을,
//   play-r111(그 밖)은 원래 팔레트를 돌려주는데 환도 기본색에서는 두 값이 똑같다. 객체만 달라 '섞임'으로 판정돼 매번 스택(약 50µs)을 잡았다.
//  고침: 바꾼 팔레트가 원래 팔레트와 값이 같으면 '안 바꿈'으로 적는다(그리는 색은 값으로만 정해지므로 화면은 같다).
//  ① 값이 같은 두 파일이 같은 열쇠를 번갈아 써도 오래 지나면 스택 잡기 < 1/30 (예전 = 매번 → 실패)
//  ② 그 출력은 기억 끈 예전 길과 값이 같다 ③ 판정이 진짜 다른 두 파일은 예전처럼 섞인 열쇠(스택 길) + 늘 정확
//  ④ R1178 검사 그대로 통과(따로 실행) ⑤ 연결(런타임 사본·CI)
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(m,c,x)=>{if(c)pass++;else{fail++;console.log('FAIL '+m+(x!==undefined?' '+JSON.stringify(x).slice(0,300):''));}};
const SRC=fs.readFileSync(process.env.SRC||path.join(R,'client-source/hero-palette-r302.js'),'utf8');
let caps=0;const COUNT=(e,cs)=>{caps++;return String(e.name||'Error')+(e.message?': '+e.message:'')+cs.map(c=>'\n    at '+c).join('');};
function engine(hero){const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Number,Error,RegExp,Promise,performance:{now:()=>0}};g.window=g;g.globalThis=g;
 g.localStorage={s:{},getItem(k){return this.s[k]??null;},setItem(k,v){this.s[k]=v;},removeItem(k){delete this.s[k];}};g.document={createElement:()=>({getContext:()=>null})};
 g.player={hero,x:0,y:0};g.ctx=null;g.drawEffect=function(e,f){return f();};const calls=[];
 const pal=(a,b)=>{if(a&&a.a&&a.b)return a;return{a:a.slice(),b:(b||a).slice()};};
 g.__STORYWORLD_FX_SPRITES_R106__=Object.freeze({pal,draw:(nm,F)=>{const P=pal(F);calls.push({a:[...P.a],b:[...P.b]});return true;},along:(nm,F)=>{calls.push(pal(F));return true;},poly:F=>{calls.push(pal(F));return true;},warm:F=>{calls.push(pal(F));},ready:(nm,F)=>{calls.push(pal(F));return true;},on:()=>true,parseColour:()=>[255,255,255]});
 g.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:()=>({}),frameAt:()=>true,has:()=>true});
 vm.createContext(g);vm.runInContext(SRC,g,{filename:'http://h/m0/hero-palette-r302.js'});
 const run=(file,code)=>vm.runInContext(code,g,{filename:'http://h/m0/'+file});
 run('index.html','var eng0=function(f){return f();};'+Array.from({length:14},(_,i)=>`var eng${i+1}=function(f){return eng${i}(f);};`).join(''));g.ENG=g.eng14;
 const API=g.__STORYWORLD_HERO_PALETTE_R302__;
 const call=(go,F)=>{calls.length=0;caps=0;Error.prepareStackTrace=COUNT;try{g.ENG(()=>go(F));}finally{Error.prepareStackTrace=undefined;}return{got:JSON.stringify(calls),caps};};
 return{g,API,call,mk:(file,code)=>run(file,'(function(){'+code+';return go;})()')};}
const S='__STORYWORLD_FX_SPRITES_R106__',DRAW=`function go(F){${S}.draw('glow',F,0,0);}`;
const HEROES=['hwando','slayer','neon','hunter','gunner','michaela','seoha','lauren'];
let fixedCases=0,diffCases=0;
for(const hero of HEROES){
 // 영웅 파일(polish-r101)이 '바꿔도 값이 같은' 팔레트 = 한 번 바꾼 결과(같은 규칙을 다시 적용하면 그대로)
 const ref=engine(hero);ref.API.memo(false);if(!ref.API.on()||!ref.API.palette[hero])continue;
 const seed={a:[120,80,18],b:[255,236,170]};const m1=JSON.parse(ref.call(ref.mk('polish-r101.js',DRAW),seed).got)[0];if(!m1)continue;
 const F=()=>({a:m1.a.slice(),b:m1.b.slice()});
 const want={hero:ref.call(ref.mk('polish-r101.js',DRAW),F()).got,other:ref.call(ref.mk('play-r111.js',DRAW),F()).got};
 if(want.hero!==want.other)continue;fixedCases++;
 const E=engine(hero),H=E.mk('polish-r101.js',DRAW),O=E.mk('play-r111.js',DRAW);let late=0,bad=0;
 for(let i=0;i<12000;i++){const r=E.call(i%3?H:O,F());if(i>=6000)late+=r.caps;if(r.got!==want.hero)bad++;}
 ok(hero+': value-identical decision from two files — stack captures after warm-up < 1/30',late/6000<1/30,{late,mixed:E.API.inspect().stats.memoMixed});
 ok(hero+': output equals memo-off reference every draw',bad===0,{bad});}
ok('at least one hero exercises the value-identical case',fixedCases>=1,{fixedCases});
// ③ 판정이 진짜 다른 경우
{const ref=engine('neon');ref.API.memo(false);const P=()=>({a:[120,80,18],b:[255,236,170]});
 const want={hero:ref.call(ref.mk('polish-r101.js',DRAW),P()).got,other:ref.call(ref.mk('play-r111.js',DRAW),P()).got};
 ok('reference: hero file and other file decide differently for a foreign palette',want.hero!==want.other,want);
 const E=engine('neon'),H=E.mk('polish-r101.js',DRAW),O=E.mk('play-r111.js',DRAW);let bad=0,c=0;
 for(let i=0;i<3000;i++){const r=E.call(i%2?H:O,P());if(i>=1000){c+=r.caps;if(r.got!==(i%2?want.hero:want.other))bad++;}}
 ok('really different decisions: still mixed (stack every draw) and always right',bad===0&&c===2000&&E.API.inspect().stats.memoMixed>=1,{bad,c});}
// ⑤ 연결
ok('runtime copy matches client-source',fs.readFileSync(path.join(R,'runtime-text/hero-palette-r302.js'),'utf8')===fs.readFileSync(path.join(R,'client-source/hero-palette-r302.js'),'utf8'));
ok('CI step',fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1197/r1197-cpu-check.cjs'));
console.log('R1197 CPU check: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
