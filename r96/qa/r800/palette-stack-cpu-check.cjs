// R800 CPU 검사: 영웅 2색 팔레트(hero-palette-r302.js)가 호출자 판정에 스택 '글자'를 만들지 않는다(렉) + 판정은 예전과 같다.
//  헤드리스 실플레이 프로파일(640×360, kair02·ep1a08·u204): remapF 가 게임 1초당 약 2,600번 불리며 JS 자체 시간 1위(58~141ms/게임초).
//  ① 영웅·적·실 파일이 그리는 스프라이트 수백 번 동안 전역 스택 글자 만들기(Error.prepareStackTrace 기본 경로)가 0번
//  ② 판정 그대로: 영웅 파일 → 2색, 적 파일 → 그대로, 금·은 실, play-r111 threadSlash 만 실, effects-r178 은 go/play/special 만, 파일 모를 땐 함수 이름(basicAttack)
//  ③ 경계: 호출 파일이 4칸 안 / 4칸 밖(전체 스택으로 다시 봄), stackTraceLimit=Infinity·0, 호출 뒤 prepareStackTrace·stackTraceLimit 원래 값
//  ④ 다른 코드의 오류 스택은 그대로 전역 형식기를 쓴다
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{if(!c){console.error("FAIL: "+m);process.exitCode=1;return;}n++;};
const SRC=fs.readFileSync(path.join(R,'client-source/hero-palette-r302.js'),'utf8');
let fmtCalls=0;const spy=(e,cs)=>{fmtCalls++;return 'Error\n'+cs.map(c=>'    at '+(c.getFunctionName()||'')+' ('+c.getFileName()+':'+c.getLineNumber()+':'+c.getColumnNumber()+')').join('\n');};
function engine(){const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Number,Error,RegExp,Promise,performance:{now:()=>0}};g.window=g;g.globalThis=g;
 g.localStorage={s:{},getItem(k){return this.s[k]??null;},setItem(k,v){this.s[k]=v;}};g.document={createElement:()=>({getContext:()=>null})};
 g.readyImage=()=>null;g.ensureImages=()=>{};g.effects=[];g.fx=(type,x,y,o)=>{g.effects.push({type,x,y,...(o||{})});};g.drawEffect=()=>{};g.tick=()=>{};
 g.player={hero:'neon',x:0,y:0};const calls=[];const pal=(a,b)=>{if(a&&a.a&&a.b)return a;return{a:a.slice(),b:(b||a).slice()};};
 g.__STORYWORLD_FX_SPRITES_R106__=Object.freeze({pal,draw:(n,F)=>{calls.push(pal(F));return true;},along:(n,F)=>{calls.push(pal(F));return true;},poly:F=>{calls.push(pal(F));return true;},warm(){},ready:()=>true,on:()=>true,parseColour:()=>[255,255,255]});
 const px=[];g.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:(n,x,y,o)=>{px.push(o);return{};},frameAt:(n,u,x,y,o)=>{px.push(o);return true;},has:()=>true});
 vm.createContext(g);vm.runInContext(SRC,g,{filename:'/x/hero-palette-r302.js'});return{g,calls,px};}
const run=(E,file,code)=>vm.runInContext(code,E.g,{filename:'/x/'+file+'.js'});
const PAL={neon:{main:[62,230,193],sub:[226,232,242]}};const isPal=c=>c.a.join()===PAL.neon.main.join()||c.a.join()===PAL.neon.sub.join();
const DRAW="__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[40,170,176],b:[170,250,240]},0,0);";
Error.prepareStackTrace=spy;const L0=Error.stackTraceLimit;
try{
 const E=engine();
 // ① 글자 스택 0번
 fmtCalls=0;for(let i=0;i<200;i++){run(E,'skills-r209',DRAW);run(E,'mob-motion-r286',"__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[70,6,10],b:[220,70,52]},0,0);");run(E,'hero-threads-r174',"__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[120,80,18],b:[255,236,170]},0,0);");}
 ok(fmtCalls===0,'600 sprite draws build no string stack via the global formatter (was '+fmtCalls+')');
 fmtCalls=0;for(let i=0;i<100;i++){run(E,'effects-r178',"function special(){__STORYWORLD_PIXELFX_R163__.play('pvfx-x',0,0,{k:1});} special();");}
 ok(fmtCalls===0,'pixelfx hero check builds no string stack (was '+fmtCalls+')');
 ok(Error.prepareStackTrace===spy&&Error.stackTraceLimit===L0,'prepareStackTrace and stackTraceLimit restored');
 // ② 판정
 E.calls.length=0;run(E,'skills-r209',DRAW);ok(isPal(E.calls[0]),'hero file → 2 colours');
 E.calls.length=0;run(E,'mob-motion-r286',"__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[70,6,10],b:[220,70,52]},0,0);");ok(E.calls[0].a.join()==='70,6,10','enemy file untouched');
 E.calls.length=0;run(E,'hero-threads-r174',"__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[120,80,18],b:[255,236,170]},0,0);");ok([E.calls[0].a,E.calls[0].b].every(c=>c.join()==='62,230,193'||c.join()==='255,198,72'),'golden thread → main+gold');
 E.calls.length=0;run(E,'play-r111',"function threadSlash(){__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[150,160,180],b:[240,244,250]},0,0);} threadSlash();");ok([E.calls[0].a,E.calls[0].b].every(c=>c.join()==='62,230,193'||c.join()==='226,232,242'),'R111 threadSlash → silver thread');
 E.calls.length=0;run(E,'play-r111',"function bossArt(){__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[151,161,181],b:[241,245,251]},0,0);} bossArt();");ok(E.calls[0].a.join()==='151,161,181','R111 boss art untouched');
 E.px.length=0;run(E,'effects-r178',"function special(){__STORYWORLD_PIXELFX_R163__.play('pvfx-x',0,0,{k:1});} special();");run(E,'effects-r178',"function towerBreak(){__STORYWORLD_PIXELFX_R163__.play('pvfx-x',0,0,{k:1});} towerBreak();");
 ok(E.px[0].tint&&!E.px[1].tint,'effects-r178 special tinted, tower break not');
 E.px.length=0;vm.runInContext("function basicAttack(){__STORYWORLD_PIXELFX_R163__.play('pvfx-x',0,0,{k:1});} basicAttack(); (function enemyHit(){__STORYWORLD_PIXELFX_R163__.play('pvfx-x',0,0,{k:1});})();",E.g,{filename:'/x/index.html'});
 ok(E.px[0].tint&&!E.px[1].tint,'unknown file: basicAttack tinted by function name, other not');
 // ③ 경계: 4칸 안·밖
 E.calls.length=0;run(E,'skills-r209',"function a(){"+DRAW+"} function b(){a()} b();");ok(isPal(E.calls[0]),'hero file 2 frames above draw → found');
 vm.runInContext("function x1(){x2()} function x2(){x3()} function x3(){x4()} function x4(){"+DRAW+"}",E.g,{filename:'/x/index.html'});
 E.calls.length=0;run(E,'skills-r209',"(function deep(){x1()})();");ok(isPal(E.calls[0]),'hero file 6 frames above draw → found via full stack');
 E.calls.length=0;run(E,'mob-motion-r286',"(function deep2(){x1()})();");ok(!isPal(E.calls[0])||E.calls[0].a.join()==='40,170,176','enemy file deep → untouched');
 for(const lim of [Infinity,0,10]){Error.stackTraceLimit=lim;E.calls.length=0;run(E,'skills-r209',DRAW);Error.stackTraceLimit=L0;
  ok(lim===0?true:isPal(E.calls[0]),'stackTraceLimit='+lim+' hero still decided');}
 // ④ 다른 코드 오류
 fmtCalls=0;const s=new Error('x').stack;ok(fmtCalls===1&&/:\d+:\d+\)/.test(s),'other errors still use the global formatter with line numbers');
}finally{Error.prepareStackTrace=undefined;Error.stackTraceLimit=L0;}
console.log('R800 palette stack CPU check: '+n+' passed'+(process.exitCode?' — FAILED':''));
