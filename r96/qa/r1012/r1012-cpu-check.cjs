// R1012 CPU 검사: R302 remapF 호출 자리 기억 — 사용자 2026-11-13 "사몽모드에서 환도로 광장처치666 에서 777코드로 플레이 하는데 렉이 심함".
//  헤드리스 실측(학교 광장 sz162-S-02-B, 환도 777): 장면당 remapF 300~650번, 그때마다 스택 → 장면당 51ms(그리기 143ms 의 36%).
//  이 게임은 그리기가 감싸기 수백 겹 안에서 돌아 Error 하나 만드는 데 약 50마이크로초(스택 깊이에 비례)다.
//  열쇠 = 지금 그리는 엔진 효과 종류 | 그림 이름 | 팔레트 값 | 영웅.
//  ① 성능 성질: 같은 열쇠를 같은 파일이 계속 그리면 스택 잡기가 호출 수의 1/8 아래로 준다(예전 코드는 호출마다 1번 — 이 검사에서 실패)
//  ② 그리는 색: 열쇠마다 그리는 파일이 하나일 때 기억을 끈 것(memo(false) = 예전 길)과 하나하나 같다(영웅 8명 × 파일 × 호출 모양 × 팔레트, 반복·섞은 순서)
//  ③ play-r111 은 기억하지 않는다(threadSlash 만 실 규칙) ④ 같은 열쇠를 판정이 다른 파일이 이어서 쓰면 무작위 재확인(4번에 1번, 256번 뒤 16번에 1번)이 알아채고 그 뒤 영영 예전 길
//     (알려진 한계: 그 사이 평균 3번, 늦게 끼어들면 평균 15번은 앞 파일의 판정으로 그려질 수 있다. 처음부터 섞어 쓰는 열쇠는 한 번도 안 틀린다. 엔진 효과 종류가 다르면 열쇠가 다르다)
//  ⑤ 팔레트 값·영웅이 바뀌면 열쇠가 달라 다시 센다 ⑥ 끄기·영웅 없음은 스택 0 ⑦ 그림자 검사(shadow) ⑧ 연결(런타임 사본·CI)
//  SRC=<파일> 로 다른 소스(예: 고치기 전)를 넣어 돌릴 수 있다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(m,c,x)=>{if(c)pass++;else{fail++;console.log('FAIL '+m+(x!==undefined?' '+JSON.stringify(x).slice(0,300):''));}};
const SRCP=process.env.SRC||path.join(R,'client-source/hero-palette-r302.js'),SRC=fs.readFileSync(SRCP,'utf8');
let caps=0;const COUNT=(e,cs)=>{caps++;return String(e.name||'Error')+(e.message?': '+e.message:'')+cs.map(c=>'\n    at '+c).join('');};
function engine(){const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Number,Error,RegExp,Promise,performance:{now:()=>0}};g.window=g;g.globalThis=g;
 g.localStorage={s:{},getItem(k){return this.s[k]??null;},setItem(k,v){this.s[k]=v;}};g.document={createElement:()=>({getContext:()=>null})};
 g.player={hero:'hwando',x:0,y:0};g.ctx=null;g.drawEffect=function(e,f){return f();};const calls=[];
 const pal=(a,b)=>{if(a&&a.a&&a.b)return a;return{a:a.slice(),b:(b||a).slice()};};
 g.__STORYWORLD_FX_SPRITES_R106__=Object.freeze({pal,draw:(nm,F)=>{calls.push(pal(F));return true;},along:(nm,F)=>{calls.push(pal(F));return true;},poly:F=>{calls.push(pal(F));return true;},warm:F=>{calls.push(pal(F));},ready:(nm,F)=>{calls.push(pal(F));return true;},on:()=>true,parseColour:()=>[255,255,255]});
 g.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:()=>({}),frameAt:()=>true,has:()=>true});
 vm.createContext(g);vm.runInContext(SRC,g,{filename:'http://h/m0/hero-palette-r302.js'});
 const run=(file,code)=>vm.runInContext(code,g,{filename:'http://h/m0/'+file});
 run('index.html','var eng0=function(f){return f();};'+Array.from({length:14},(_,i)=>`var eng${i+1}=function(f){return eng${i}(f);};`).join(''));g.ENG=g.eng14;
 run('phase1.js?r88=1',"var helper=function(k,F){if(k<=0)return __STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);return helper(k-1,F);};");
 const API=g.__STORYWORLD_HERO_PALETTE_R302__;
 const call=(go,F)=>{calls.length=0;caps=0;Error.prepareStackTrace=COUNT;try{g.ENG(()=>go(F));}finally{Error.prepareStackTrace=undefined;}return{got:JSON.stringify(calls),caps,draws:calls.length};};
 return{g,calls,run,API,call,mk:(file,code)=>run(file,'(function(){'+code+';return go;})()')};}
const S='__STORYWORLD_FX_SPRITES_R106__';
const SHAPES={draw:`function go(F){${S}.draw('smoke',F,0,0);}`,along:`function go(F){${S}.along('slashline',F,0,0,1,1,1);}`,method:`const O={special(F){${S}.draw('glow',F,0,0);}};function go(F){O.special(F);}`,
 threadSlash:`function threadSlash(F){${S}.draw('glow',F,0,0);} function go(F){threadSlash(F);}`,bossFn:`function bossNova(F){${S}.draw('glow',F,0,0);} function go(F){bossNova(F);}`,
 helper3:"function go(F){helper(3,F);}",helper9:"function go(F){helper(9,F);}",arrow:`const go=F=>[0].forEach(()=>${S}.draw('glow',F,0,0));`};
const FILES=['hero-fx-r102.js','play-r113.js','fx-d2s-r106.js','polish-r101.js','combat-r160.js','hero-threads-r174.js','threads-r243.js','mob-motion-r286.js','samong-r161.js','play-r111.js','index.html'];
const mkPals=()=>[{a:[40,170,176],b:[170,250,240]},{a:[120,80,18],b:[255,236,170]},{a:[150,160,180],b:[240,244,250]},[255,96,0],{a:[150,22,34],b:[236,190,120]}];
const HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const hasMemo=typeof engine().API.memo==='function';
// ① 성능 성질 — 광장 모양: 영웅 파일들이 저마다 제 팔레트 객체로 계속 그림
{const E=engine(),N=3200,rows=[];let capsAll=0,drawsAll=0;
 for(const [file,sh] of [['play-r113.js','draw'],['hero-fx-r102.js','along'],['fx-d2s-r106.js','draw'],['polish-r101.js','method'],['combat-r160.js','arrow'],['mob-motion-r286.js','draw']]){
  const go=E.mk(file,SHAPES[sh]),F={a:[40+rows.length,170,176],b:[170,250,240]};let c=0,d=0;for(let i=0;i<N;i++){const r=E.call(go,F);c+=r.caps;d+=r.draws;}rows.push([file,c,d]);capsAll+=c;drawsAll+=d;}
 console.log('stack captures per draw (same palette object, same file, '+N+' draws each): '+(capsAll/drawsAll).toFixed(3)+' '+JSON.stringify(rows));
 ok('steady drawing captures a stack for fewer than 1 in 8 draws',capsAll/drawsAll<1/8,{capsAll,drawsAll});
 ok('each caller still verified now and then (32 to earn trust, then about 1 in 4 for 256 draws, then about 1 in 16)',rows.every(([f,c,d])=>c>=32+40+100&&c<=32+90+270),rows);
 const st=E.API.inspect().stats;ok('stats: sp counts every call, fast path used, nothing mixed',st.sp===drawsAll&&st.spFast>0&&!st.memoMixed&&!st.fastWrong,st);}
// ② 그리는 색이 예전 길과 같다
function drive(memoOn,{rep=1,shuffle=0}={}){const E=engine();if(hasMemo)E.API.memo(memoOn);const PALS=mkPals(),jobs=[],out=[];
 for(const h of HEROES)for(const file of FILES)for(const sh of Object.keys(SHAPES))for(let pi=0;pi<PALS.length;pi++)for(let r=0;r<rep;r++)jobs.push({h,file,sh,pi});
 if(shuffle){let x=shuffle;const rnd=()=>(x=(x*1103515245+12345)>>>0)/2**32;for(let i=jobs.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[jobs[i],jobs[j]]=[jobs[j],jobs[i]];}}
 // 호출 자리마다 제 팔레트 값(게임 모양: 열쇠 하나를 한 자리만 씀) — 파일·모양·팔레트 번호마다 하나.
 //  (같은 열쇠를 판정이 다른 길이 나눠 쓰는 경우 — 다른 파일, 또는 파일이 10칸 밖으로 밀리는 깊은 도우미 사슬 — 는 ④의 알려진 한계)
 const gos=new Map(),objs=new Map();
 for(const{h,file,sh,pi}of jobs){E.g.player.hero=h;const key=file+'|'+sh;let go=gos.get(key);if(!go)gos.set(key,go=E.mk(file,SHAPES[sh]));const ko=key+'|'+pi;let F=objs.get(ko);if(!F){F=mkPals()[pi];const fi=FILES.indexOf(file),si=Object.keys(SHAPES).indexOf(sh);if(Array.isArray(F))F=[F[0]-fi,F[1]+si,F[2]];else F={a:[F.a[0]+fi,F.a[1]+si,F.a[2]],b:F.b};objs.set(ko,F);}
  out.push(E.call(go,F).got);}
 return{out,E};}
{const A=drive(false,{rep:50}),B=drive(true,{rep:50});let diff=0;for(let i=0;i<A.out.length;i++)if(A.out[i]!==B.out[i])diff++;
 ok('every drawn palette identical with memo on vs off, 50 repeats ('+A.out.length+' draws)',A.out.length===B.out.length&&A.out.length>100000&&diff===0,{diff});
 const ia=A.E.API.inspect(),ib=B.E.API.inspect();
 ok('decision table identical',JSON.stringify(ia.decided)===JSON.stringify(ib.decided));
 ok('stats sp·spMapped·files identical',ia.stats.sp===ib.stats.sp&&ia.stats.spMapped===ib.stats.spMapped&&JSON.stringify(ia.stats.files)===JSON.stringify(ib.stats.files),[ia.stats.sp,ib.stats.sp,ia.stats.spMapped,ib.stats.spMapped]);
 ok('memo actually used in that run',(ib.stats.spFast||0)>ib.stats.sp*.15&&!(ia.stats.spFast>0),[ib.stats.spFast,ib.stats.sp]);
 for(const seed of [7,2024]){const a=drive(false,{rep:40,shuffle:seed}).out,b=drive(true,{rep:40,shuffle:seed}).out;ok('shuffled order '+seed+': identical',a.length===b.length&&a.every((r,i)=>r===b[i]));}}
// ③ play-r111: 기억 안 함 — 같은 객체를 threadSlash 와 보스 함수가 번갈아·몰아서 써도 늘 맞고 늘 스택
{const E=engine(),F=mkPals()[1],thr=E.mk('play-r111.js',SHAPES.threadSlash),boss=E.mk('play-r111.js',SHAPES.bossFn);let bad=0,c=0,d=0;
 const want={thr:E.call(thr,F).got,boss:E.call(boss,F).got};ok('R111 threadSlash themed, boss fn untouched',want.thr!==want.boss&&want.boss.includes('120,80,18'));
 for(let i=0;i<120;i++){const r=E.call(boss,F);c+=r.caps;d+=r.draws;if(r.got!==want.boss)bad++;}for(let i=0;i<120;i++){const r=E.call(thr,F);c+=r.caps;d+=r.draws;if(r.got!==want.thr)bad++;}
 for(let i=0;i<120;i++){const r=E.call(i%2?thr:boss,F);c+=r.caps;d+=r.draws;if(r.got!==(i%2?want.thr:want.boss))bad++;}
 ok('play-r111 always decided by stack (no memo), never wrong',bad===0&&c===d,{bad,c,d});}
// ④ 같은 열쇠를 판정이 다른 파일이 이어서 씀: 무작위 재확인이 곧 알아채고 그 뒤 영영 예전 길
{const E=engine();E.g.player.hero='neon';const F=mkPals()[1],heroF=E.mk('hero-fx-r102.js',SHAPES.draw),thrF=E.mk('hero-threads-r174.js',SHAPES.draw),mobF=E.mk('mob-motion-r286.js',SHAPES.draw);
 const ref=engine();ref.g.player.hero='neon';if(hasMemo)ref.API.memo(false);const want={hero:ref.call(ref.mk('hero-fx-r102.js',SHAPES.draw),mkPals()[1]).got,thr:ref.call(ref.mk('hero-threads-r174.js',SHAPES.draw),mkPals()[1]).got,mob:ref.call(ref.mk('mob-motion-r286.js',SHAPES.draw),mkPals()[1]).got};
 ok('reference: three different decisions for this palette',new Set(Object.values(want)).size===3,want);
 for(let i=0;i<100;i++)E.call(heroF,F);let wrong=0,lastWrong=-1;for(let i=0;i<100;i++){if(E.call(thrF,F).got!==want.thr){wrong++;lastWrong=i;}}
 ok('shared key switching file: wrong draws bounded (< 24) then correct',wrong<24&&lastWrong<24,{wrong,lastWrong});
 let c=0,d=0,bad=0;for(let i=0;i<60;i++){for(const [go,w] of [[heroF,want.hero],[thrF,want.thr],[mobF,want.mob]]){const r=E.call(go,F);c+=r.caps;d+=r.draws;if(r.got!==w)bad++;}}
 ok('after a mismatch that key is always decided by stack and always right',bad===0&&c===d,{bad,c,d});
 ok('mismatch recorded',E.API.inspect().stats.memoMixed>=1,E.API.inspect().stats);
 // 처음부터 섞어 쓰는 객체(잇달아 32번을 못 채움)는 한 번도 틀리지 않는다
 const E2=engine();E2.g.player.hero='neon';const G=mkPals()[1],h2=E2.mk('hero-fx-r102.js',SHAPES.draw),t2=E2.mk('hero-threads-r174.js',SHAPES.draw);let bad2=0;for(let i=0;i<300;i++){const th=i%5===4;if(E2.call(th?t2:h2,G).got!==(th?want.thr:want.hero))bad2++;}
 ok('key shared from the start (interleaved) is never wrong',bad2===0,{bad2});
 // 한 장면에 영웅 파일 15번 + 다른 파일 1번을 늘 같은 순서로(주기 16) 그려도 곧 알아챈다(정해진 간격 확인이면 영영 못 봄 — 실측에서 나온 모양)
 {const E4=engine();E4.g.player.hero='neon';const P4=mkPals()[1],h4=E4.mk('hero-fx-r102.js',SHAPES.draw),m4=E4.mk('mob-motion-r286.js',SHAPES.draw);let w4=0;
  for(let i=0;i<64;i++)E4.call(h4,P4);for(let fr=0;fr<200;fr++){for(let i=0;i<15;i++)if(E4.call(h4,P4).got!==want.hero)w4++;if(E4.call(m4,P4).got!==want.mob)w4++;}
  ok('period-16 pattern with one foreign draw per frame: caught early (wrong < 24), then exact',w4<24&&E4.API.inspect().stats.memoMixed===1,{w4});}
 // 엔진 효과 종류가 다르면 열쇠가 달라, 같은 그림·같은 팔레트를 영웅 파일과 몹 파일이 길게 번갈아 그려도 안 틀리고 둘 다 빠른 길
 const E3=engine();E3.g.player.hero='neon';const H3=mkPals()[1],h3=E3.mk('hero-fx-r102.js',`function go(F){drawEffect({type:'heroCast'},()=>${S}.draw('glow',F,0,0));}`),m3=E3.mk('mob-motion-r286.js',`function go(F){drawEffect({type:'mobSlam'},()=>${S}.draw('glow',F,0,0));}`);let bad3=0,c3=0,d3=0;
 for(let r=0;r<4;r++){for(let i=0;i<200;i++){const x=E3.call(h3,H3);c3+=x.caps;d3+=x.draws;if(x.got!==want.hero)bad3++;}for(let i=0;i<200;i++){const x=E3.call(m3,H3);c3+=x.caps;d3+=x.draws;if(x.got!==want.mob)bad3++;}}
 ok('different engine effect types keep separate keys: never wrong and mostly stack-free',bad3===0&&c3<d3/4&&!E3.API.inspect().stats.memoMixed,{bad3,c3,d3});}
// ⑤ 팔레트 값·영웅이 바뀌면 다시 센다
{const E=engine(),ref=engine();if(hasMemo)ref.API.memo(false);const F={a:[40,170,176],b:[170,250,240]},G={a:[40,170,176],b:[170,250,240]},go=E.mk('hero-fx-r102.js',SHAPES.draw),rg=ref.mk('hero-fx-r102.js',SHAPES.draw);let bad=0;
 const step=()=>{if(E.call(go,F).got!==ref.call(rg,G).got)bad++;};
 for(let i=0;i<80;i++)step();F.a=[200,10,10];G.a=[200,10,10];for(let i=0;i<80;i++)step();F.b=[1,2,3];G.b=[1,2,3];for(let i=0;i<80;i++)step();
 for(const h of ['neon','slayer','hwando','gunner']){E.g.player.hero=h;ref.g.player.hero=h;for(let i=0;i<80;i++)step();}
 ok('palette mutated in place / hero switched: every draw equals the no-memo engine',bad===0,{bad});
 // 켜고 끄기(set)도 기억을 비운다
 E.API.set(false);const off=E.call(go,F);ok('off: original palette, no capture',off.caps===0&&off.got===JSON.stringify([F]),off);E.API.set(true);let bad3=0;for(let i=0;i<60;i++)if(E.call(go,F).got!==ref.call(rg,G).got)bad3++;ok('back on: same as no-memo engine',bad3===0);}
// ⑥ 영웅 없음: 스택 0, 원본
{const E=engine(),F=mkPals()[0],go=E.mk('hero-fx-r102.js',SHAPES.draw);E.g.player.hero='nobody';let c=0;for(let i=0;i<50;i++)c+=E.call(go,F).caps;ok('no hero: no capture',c===0);ok('stackTraceLimit restored',Error.stackTraceLimit===10);}
// ⑦ 그림자 검사(shadow): 빠른 길 결과를 스택으로 다시 확인해 어긋남을 센다 — 실플레이 검증용
{const E=engine();ok('shadow API present',typeof E.API.shadow==='function');if(typeof E.API.shadow==='function'){E.API.shadow(true);E.g.player.hero='neon';const F=mkPals()[1],go=E.mk('hero-fx-r102.js',SHAPES.draw),mob=E.mk('mob-motion-r286.js',SHAPES.draw);
  const ref=engine();ref.g.player.hero='neon';ref.API.memo(false);const wh=ref.call(ref.mk('hero-fx-r102.js',SHAPES.draw),mkPals()[1]).got,wm=ref.call(ref.mk('mob-motion-r286.js',SHAPES.draw),mkPals()[1]).got;
  let bad=0;for(let i=0;i<200;i++)if(E.call(go,F).got!==wh)bad++;let st=E.API.inspect().stats;ok('shadow, one file: fast path checked against the stack path, 0 wrong',bad===0&&st.spFast>100&&!st.fastWrong,st);
  for(let i=0;i<10;i++)if(E.call(mob,F).got!==wm)bad++;st=E.API.inspect().stats;ok('shadow, other file takes over the key: draws stay right (shadow draws the stack result) and the mismatches are counted',bad===0&&st.fastWrong>=1&&st.wrong&&Object.keys(st.wrong).length===1,st);}}
// ⑧ 연결
ok('runtime copy matches client-source',fs.readFileSync(path.join(R,'runtime-text/hero-palette-r302.js'),'utf8')===fs.readFileSync(path.join(R,'client-source/hero-palette-r302.js'),'utf8'));
ok('CI step',fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1012/r1012-cpu-check.cjs'));
console.log('R1012 CPU check: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
