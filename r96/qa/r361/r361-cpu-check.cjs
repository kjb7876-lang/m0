// R361 CPU 검사: R302 remapF 의 호출 파일 찾기 렉 줄이기(짧은 스택 먼저).
//  ① 예전 코드(이 검사가 R361 블록을 원래 한 줄로 되돌려 만듦)와 새 코드를 같은 호출 모양에 돌려 그린 팔레트가 하나하나 같다
//     (영웅 8명 × 영웅 파일·실 파일·적 파일·R111 threadSlash/보스·깊은 도우미 사슬·r 파일 없음·제외 파일·메서드 호출)
//  ② 성능 성질: 보통 호출(호출 파일이 위 4칸 안)에서 잡는 스택 칸 수 = 예전 10칸 → 새 4칸 이하(예전 코드는 이 검사에서 실패)
//  ③ 끄기·영웅 없음은 스택을 아예 안 잡음(예전과 같음) ④ CI 등록
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const NEW=fs.readFileSync(path.join(R,'client-source/hero-palette-r302.js'),'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text/hero-palette-r302.js'),'utf8')===NEW,'runtime copy matches client-source');
// 예전 코드 되살리기: R361 블록을 원래 줄로(origin/main 4a258ab 의 R302 와 바이트까지 같아야 함 — 만들 때 확인)
const swap=(s,a,b)=>{ok(s.split(a).length===2,'R361 piece present once: '+a.slice(0,40));return s.replace(a,()=>b);};
let OLD=NEW;{const a=OLD.indexOf(' // R361 렉:'),b=OLD.indexOf(' // R111 also renders bosses');ok(a>0&&b>a,'R361 block present');
 OLD=OLD.slice(0,a)+' const stack=new Error().stack,file=callerFile(stack);\n'+OLD.slice(b);}
OLD=swap(OLD,"const decided=new Map(),SHORT=4,T111=/at threadSlash \\(.*\\/play-r111\\.js:/,needFull=new Set();\nconst shortOk=(file,stack)=>!!file&&!(file==='play-r111'&&!T111.test(String(stack)));",'const decided=new Map();');
OLD=swap(OLD,"(file==='play-r111'&&T111.test(String(stack)))","(file==='play-r111'&&/at threadSlash \\(.*\\/play-r111\\.js:/.test(String(stack)))");
OLD=swap(OLD," const k=k0+'|'+h+'|'+kind;"," let k;try{const P=SP0.pal(F);k=P.a.join()+'|'+P.b.join()+'|'+h+'|'+kind;}catch(_){return F;}");
ok(!/SHORT|spFull|T111|needFull|k0/.test(OLD),'old code reconstructed');
// 스택 칸 세기: prepareStackTrace 로 V8 기본 모양과 같은 글을 만들면서 칸 수를 센다(②에서만 씀)
let frames=0,caps=0;const COUNT=(e,cs)=>{frames+=cs.length;caps++;return String(e.name||'Error')+(e.message?': '+e.message:'')+cs.map(c=>'\n    at '+c).join('');};
function engine(SRC){const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Number,Error,RegExp,Promise,performance:{now:()=>0}};g.window=g;g.globalThis=g;
 g.localStorage={s:{},getItem(k){return this.s[k]??null;},setItem(k,v){this.s[k]=v;}};g.document={createElement:()=>({getContext:()=>null})};
 g.player={hero:'neon',x:0,y:0};const calls=[];
 const pal=(a,b)=>{if(a&&a.a&&a.b)return a;return{a:a.slice(),b:(b||a).slice()};};
 g.__STORYWORLD_FX_SPRITES_R106__=Object.freeze({pal,draw:(nm,F)=>{calls.push(pal(F));return true;},along:(nm,F)=>{calls.push(pal(F));return true;},poly:F=>{calls.push(pal(F));return true;},warm:F=>{calls.push(pal(F));},ready:(nm,F)=>{calls.push(pal(F));return true;},on:()=>true,parseColour:()=>[255,255,255]});
 g.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:()=>({}),frameAt:()=>true,has:()=>true});
 vm.createContext(g);vm.runInContext(SRC,g,{filename:'http://h/m0/hero-palette-r302.js'});
 const run=(file,code)=>vm.runInContext(code,g,{filename:'http://h/m0/'+file});
 // 깊은 엔진 사슬(게임처럼 스택이 10칸보다 깊다)
 run('index.html','var eng0=function(f){return f();};'+Array.from({length:14},(_,i)=>`var eng${i+1}=function(f){return eng${i}(f);};`).join(''));
 g.ENG=g.eng14;
 // 도우미(이름에 -rNNN 없음): 영웅 파일 → 도우미 k칸 → S.draw
 run('phase1.js?r88=1',"var helper=function(k,F){if(k<=0)return __STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);return helper(k-1,F);};");
 // 제외 파일(fx-sprites-r106 이 대신 부르는 경우)
 run('fx-sprites-r106.js',"var viaSprites=function(F){return __STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);};");
 return{g,calls,run};}
const PALS=[{a:[40,170,176],b:[170,250,240]},{a:[120,80,18],b:[255,236,170]},{a:[150,160,180],b:[240,244,250]},{a:[70,6,10],b:[220,70,52]},[255,96,0],{a:[150,22,34],b:[236,190,120]}];
const FILES=['skills-r209.js','hero-fx-r102.js','effects-r178.js','hero-threads-r174.js','threads-r243.js','mob-motion-r286.js','samong-r161.js','fx-boss-r105.js','play-r111.js','play-r113.js','index.html'];
// 호출 모양들: 파일마다 같은 코드를 돌린다(이름: 함수)
const SHAPES={
 direct:"function go(F){__STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);__STORYWORLD_FX_SPRITES_R106__.along('line',F,0,0,1,1,1);__STORYWORLD_FX_SPRITES_R106__.poly(F,[[0,0]],1);__STORYWORLD_FX_SPRITES_R106__.warm(F);__STORYWORLD_FX_SPRITES_R106__.ready('glow',F);}",
 threadSlash:"function threadSlash(F){__STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);} function go(F){threadSlash(F);}",
 threadSlashDeep:"function threadSlash(F){helper(6,F);} function go(F){threadSlash(F);}",
 bossFn:"function bossNova(F){__STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);} function go(F){bossNova(F);}",
 helper1:"function go(F){helper(1,F);}",helper3:"function go(F){helper(3,F);}",helper9:"function go(F){helper(9,F);}",helper20:"function go(F){helper(20,F);}",
 method:"const O={special(F){__STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);}};function go(F){O.special(F);}",
 ctor:"function Burst(F){__STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);} function go(F){new Burst(F);}",
 viaSprites:"function go(F){viaSprites(F);}",
 arrow:"const go=F=>[0].forEach(()=>__STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0));"};
function drive(SRC,count,{files=FILES,shapes=Object.keys(SHAPES),shuffle=0}={}){const E=engine(SRC),out=[],jobs=[];
 for(const h of ['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'])for(const file of files)for(const sh of shapes)for(const F of PALS)jobs.push({h,file,sh,F});
 if(shuffle){let x=shuffle;const rnd=()=>(x=(x*1103515245+12345)>>>0)/2**32;for(let i=jobs.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[jobs[i],jobs[j]]=[jobs[j],jobs[i]];}}
 const gos=new Map();for(const{h,file,sh,F}of jobs){E.g.player.hero=h;const key=file+'|'+sh;let go=gos.get(key);if(!go)gos.set(key,go=E.run(file,'(function(){'+SHAPES[sh]+';return go;})()'));
  E.calls.length=0;frames=0;caps=0;if(count)Error.prepareStackTrace=COUNT;try{E.g.ENG(()=>go(F));}finally{Error.prepareStackTrace=undefined;}
  out.push({h,file,sh,F:JSON.stringify(F),got:JSON.stringify(E.calls),frames,caps,draws:E.calls.length});}
 return{out,E};}
// ① 같은 결정
const A=drive(OLD,false),B=drive(NEW,false);
ok(A.out.length===B.out.length&&A.out.length>4000,'same call count '+A.out.length);
let diff=0,mapped=0,kept=0;for(let i=0;i<A.out.length;i++){if(A.out[i].got!==B.out[i].got){diff++;if(diff<5)console.error('DIFF',A.out[i],B.out[i]);}
 const F=JSON.parse(A.out[i].F),a0=(Array.isArray(F)?F:F.a).join();if(JSON.parse(A.out[i].got)[0].a.join()===a0)kept++;else mapped++;}
ok(diff===0,'every drawn palette identical old vs new ('+A.out.length+' calls, diff '+diff+')');
ok(mapped>500&&kept>500,'cases cover both remapped and untouched palettes ('+mapped+'/'+kept+')');
const ia=A.E.g.__STORYWORLD_HERO_PALETTE_R302__.inspect(),ib=B.E.g.__STORYWORLD_HERO_PALETTE_R302__.inspect();
ok(JSON.stringify(ia.decided)===JSON.stringify(ib.decided),'decision cache identical');
ok(JSON.stringify(ia.stats.files)===JSON.stringify(ib.stats.files)&&ia.stats.sp===ib.stats.sp&&ia.stats.spMapped===ib.stats.spMapped,'caller-file stats identical');
ok(ib.stats.spFull>0&&ib.stats.spFull<ib.stats.sp,'fallback full stack used only sometimes ('+ib.stats.spFull+'/'+ib.stats.sp+')');
// 순서를 섞어도(전체 스택 기억 상태가 달라져도) 판정은 같다
for(const seed of [7,99,2024]){const a=drive(OLD,false,{shuffle:seed}).out,b=drive(NEW,false,{shuffle:seed}).out;
 ok(a.length===b.length&&a.every((r,i)=>r.got===b[i].got),'shuffled order '+seed+': every drawn palette identical');}
// R111: threadSlash 만 실 규칙, 같은 파일 보스 함수는 아님(새 코드에서도)
{const pick=(o,sh)=>o.out.find(r=>r.h==='neon'&&r.file==='play-r111.js'&&r.sh===sh&&r.F===JSON.stringify(PALS[1]));
 ok(pick(B,'threadSlash').got!==pick(B,'bossFn').got&&pick(B,'bossFn').got.includes('120,80,18'),'R111 threadSlash themed, boss fn untouched');
 ok(pick(B,'threadSlashDeep').got===pick(A,'threadSlashDeep').got,'deep threadSlash same as before');}
// ② 성능 성질: 칸 수
{const typ={files:FILES.filter(f=>f!=='play-r111.js'&&f!=='index.html'),shapes:['direct','method','ctor','bossFn','threadSlash','arrow']};
 const C0=drive(OLD,true,typ).out,C1=drive(NEW,true,typ).out;
 const per=o=>o.reduce((a,r)=>a+r.frames,0)/Math.max(1,o.reduce((a,r)=>a+r.draws,0));
 const A0=drive(OLD,true).out,A1=drive(NEW,true).out;
 console.log('stack frames per draw: typical old '+per(C0).toFixed(2)+' new '+per(C1).toFixed(2)+'; all test shapes old '+per(A0).toFixed(2)+' new '+per(A1).toFixed(2));
 ok(per(C0)>=10,'old code captures the full 10 frames per typical draw');
 ok(per(C1)<=4,'new code captures at most 4 frames per typical draw');
 ok(C1.every(r=>r.caps===r.draws),'one capture per typical draw');
 ok(per(A1)<per(A0),'fewer frames overall');
 // R111: threadSlash 는 4칸 안에서 찾음, 보스 함수는 처음 한 번만 두 번 잡고 그 뒤 바로 전체, 같은 팔레트를 다른 파일이 쓰면 기억을 지움
 const E=engine(NEW),X=PALS[3],Y=PALS[2];const mk=(file,sh)=>E.run(file,'(function(){'+SHAPES[sh]+';return go;})()');
 const one=(go,F)=>{frames=0;caps=0;Error.prepareStackTrace=COUNT;try{E.g.ENG(()=>go(F));}finally{Error.prepareStackTrace=undefined;}return[caps,frames];};
 const boss=mk('play-r111.js','bossFn'),thr=mk('play-r111.js','threadSlash'),heroF=mk('skills-r209.js','bossFn');
 ok(JSON.stringify([one(boss,X),one(boss,X),one(boss,X)])==='[[2,14],[1,10],[1,10]]','R111 non-thread: short+full once, then full only');
 ok(JSON.stringify([one(thr,Y),one(thr,Y)])==='[[1,4],[1,4]]','R111 threadSlash found in the short stack');
 ok(JSON.stringify([one(heroF,X),one(heroF,X)])==='[[1,10],[1,4]]','remembered palette from another file: full once, then short again');}
// ③ 끄기·영웅 없음: 스택 안 잡음
{const E=engine(NEW);const go=E.run('skills-r209.js',"(function(){return F=>__STORYWORLD_FX_SPRITES_R106__.draw('glow',F,0,0);})()");
 E.g.player.hero='nobody';caps=0;Error.prepareStackTrace=COUNT;try{go(PALS[0]);}finally{Error.prepareStackTrace=undefined;}ok(caps===0,'no hero: no capture');
 E.g.player.hero='neon';E.g.__STORYWORLD_HERO_PALETTE_R302__.set(false);caps=0;Error.prepareStackTrace=COUNT;try{go(PALS[0]);}finally{Error.prepareStackTrace=undefined;}ok(caps===0&&E.calls.at(-1).a.join()==='40,170,176','off: no capture, original');
 ok(Error.stackTraceLimit===10,'stackTraceLimit restored');}
// ④ CI
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r361/r361-cpu-check.cjs'),'CI step');
console.log('R361 CPU check: '+n+' checks passed');
