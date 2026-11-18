// R1178 CPU 검사: R302 remapF 무작위 재확인 — 오래 맞은 열쇠는 더 드물게(사용자 2026-11-18 "렉개선 … 사몽에피소드쪽 실플레이 돌면서 개선").
//  헤드리스 실측(사몽 에피소드 P-2 '가장 굵은 뿌리', 환도 777, 몹 45~56마리, 들어오고 60초 뒤 20초 CPU 표본):
//   게임 JS 중 1위가 hero-palette-r302 remapF(전체 표본의 3.3%, 대부분 스택 잡기). 장면당 remapF 약 990번.
//   스택을 잡은 까닭: 무작위 재확인 48% · 아직 32번을 못 채운 열쇠 30% · 파일이 섞인 열쇠 21%.
//   재확인은 열쇠마다 처음 256번 4번에 1번, 그 뒤 영영 16번에 1번이라 오래 맞은 열쇠도 계속 같은 비율로 스택을 잡았다.
//  고침: 4,096번 넘게 한 파일에서 같은 판정이 이어진 열쇠는 64번에 1번만 다시 확인한다(그 전 규칙·판정·색 규칙은 그대로).
//  ① 성질: 같은 열쇠 20,000번 — 4,096번 뒤 구간의 스택 잡기 < 1/40 (예전 1/16 = 이 검사 실패)
//  ② 4,096번 전 구간은 예전과 같은 비율(R1012 검사 ①과 같은 범위)
//  ③ 오래 맞은 열쇠를 다른 판정 파일이 이어 쓰면 늦어도 곧 알아챈다(틀린 그리기 < 256, 그 뒤 영영 스택 길·정확)
//  ④ 기억 끔·영웅 없음은 예전 그대로 ⑤ 연결(런타임 사본·CI)
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(m,c,x)=>{if(c)pass++;else{fail++;console.log('FAIL '+m+(x!==undefined?' '+JSON.stringify(x).slice(0,300):''));}};
const SRC=fs.readFileSync(process.env.SRC||path.join(R,'client-source/hero-palette-r302.js'),'utf8');
let caps=0;const COUNT=(e,cs)=>{caps++;return String(e.name||'Error')+(e.message?': '+e.message:'')+cs.map(c=>'\n    at '+c).join('');};
function engine(){const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Number,Error,RegExp,Promise,performance:{now:()=>0}};g.window=g;g.globalThis=g;
 g.localStorage={s:{},getItem(k){return this.s[k]??null;},setItem(k,v){this.s[k]=v;},removeItem(k){delete this.s[k];}};g.document={createElement:()=>({getContext:()=>null})};
 g.player={hero:'neon',x:0,y:0};g.ctx=null;g.drawEffect=function(e,f){return f();};const calls=[];
 const pal=(a,b)=>{if(a&&a.a&&a.b)return a;return{a:a.slice(),b:(b||a).slice()};};
 g.__STORYWORLD_FX_SPRITES_R106__=Object.freeze({pal,draw:(nm,F)=>{calls.push(pal(F));return true;},along:(nm,F)=>{calls.push(pal(F));return true;},poly:F=>{calls.push(pal(F));return true;},warm:F=>{calls.push(pal(F));},ready:(nm,F)=>{calls.push(pal(F));return true;},on:()=>true,parseColour:()=>[255,255,255]});
 g.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:()=>({}),frameAt:()=>true,has:()=>true});
 vm.createContext(g);vm.runInContext(SRC,g,{filename:'http://h/m0/hero-palette-r302.js'});
 const run=(file,code)=>vm.runInContext(code,g,{filename:'http://h/m0/'+file});
 run('index.html','var eng0=function(f){return f();};'+Array.from({length:14},(_,i)=>`var eng${i+1}=function(f){return eng${i}(f);};`).join(''));g.ENG=g.eng14;
 const API=g.__STORYWORLD_HERO_PALETTE_R302__;
 const call=(go,F)=>{calls.length=0;caps=0;Error.prepareStackTrace=COUNT;try{g.ENG(()=>go(F));}finally{Error.prepareStackTrace=undefined;}return{got:JSON.stringify(calls),caps};};
 return{g,API,call,mk:(file,code)=>run(file,'(function(){'+code+';return go;})()')};}
const S='__STORYWORLD_FX_SPRITES_R106__',DRAW=`function go(F){${S}.draw('glow',F,0,0);}`;
const PAL=()=>({a:[120,80,18],b:[255,236,170]});
// ①② 같은 열쇠를 한 파일이 20,000번
for(const file of ['hero-fx-r102.js','polish-r101.js','mob-motion-r286.js']){const E=engine(),go=E.mk(file,DRAW),F=PAL();let early=0,late=0;
 for(let i=0;i<20000;i++){const c=E.call(go,F).caps;if(i<4096)early+=c;else late+=c;}
 const lateRate=late/(20000-4096);
 ok(file+': after 4,096 trusted draws a stack is captured for fewer than 1 in 40 draws',lateRate<1/40,{late,lateRate:+lateRate.toFixed(4)});
 ok(file+': but still re-checked now and then (at least 1 in 200)',lateRate>1/200,{late});
 ok(file+': first 4,096 draws keep the R1012 rate (32 + ~1/4 for 256 + ~1/16)',early>=32+40+180&&early<=32+90+330,{early});}
// ③ 오래 맞은 열쇠를 판정이 다른 파일이 이어서 씀
{const E=engine(),ref=engine();ref.API.memo(false);const F=PAL(),heroF=E.mk('hero-fx-r102.js',DRAW),mobF=E.mk('mob-motion-r286.js',DRAW);
 const want={hero:ref.call(ref.mk('hero-fx-r102.js',DRAW),PAL()).got,mob:ref.call(ref.mk('mob-motion-r286.js',DRAW),PAL()).got};
 ok('reference: hero file and mob file decide differently',want.hero!==want.mob,want);
 for(let i=0;i<9000;i++)E.call(heroF,F);let wrong=0,last=-1;for(let i=0;i<600;i++)if(E.call(mobF,F).got!==want.mob){wrong++;last=i;}
 ok('mature key taken over by another file: wrong draws bounded (< 256), caught',wrong<256&&last<256&&E.API.inspect().stats.memoMixed>=1,{wrong,last});
 let bad=0,c=0;for(let i=0;i<300;i++){const g=i%2?heroF:mobF,r=E.call(g,F);c+=r.caps;if(r.got!==(i%2?want.hero:want.mob))bad++;}
 ok('after that the key is always decided by the stack and always right',bad===0&&c===300,{bad,c});}
// ④ 끄기·영웅 없음
{const E=engine(),go=E.mk('hero-fx-r102.js',DRAW),F=PAL();E.API.memo(false);let c=0;for(let i=0;i<300;i++)c+=E.call(go,F).caps;ok('memo off: one capture per draw',c===300,{c});
 const E2=engine(),g2=E2.mk('hero-fx-r102.js',DRAW);E2.g.player.hero='nobody';let c2=0;for(let i=0;i<100;i++)c2+=E2.call(g2,PAL()).caps;ok('no hero: no capture',c2===0);}
// ⑤ 연결
ok('runtime copy matches client-source',fs.readFileSync(path.join(R,'runtime-text/hero-palette-r302.js'),'utf8')===fs.readFileSync(path.join(R,'client-source/hero-palette-r302.js'),'utf8'));
ok('CI step',fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1178/r1178-cpu-check.cjs'));
console.log('R1178 CPU check: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
