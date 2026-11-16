// R1091 CPU 검사: 게임 진입 때 눈을 뜨고, 쓰러질 때 눈을 감는 화면 연출(위·아래 눈꺼풀이 가로 한 줄 '一'로 합쳐짐).
//  사용자 2026-11-15 23:03Z "게임진입시 눈을뜨는연출 / 사망시 눈을감는연출 가로합일참고".
//  완료 조건: 새 게임·불러오기 → 감은 채 로딩 → 화면이 보이면 눈뜨기(깜빡임 한 번) → 다 뜨면 캔버스 숨김(그리기 0) /
//   체력 0 → 눈감기 → 감은 채 유지 → 다시 살아나 화면이 보이면 눈뜨기 / 지역 이동·제목 화면에서는 안 함 /
//   끄기 설정·자동 검사(webdriver, ?eye1091=1 은 허용)·협동은 안 함 / 움직임 줄이기는 짧게 / NaN·Infinity 가 그리기로 가지 않음.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,400):''));};
const NAME='eyelid-r1091.js';let src='';try{src=fs.readFileSync(path.join(R,'client-source',NAME),'utf8');}catch(_){}
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
ok('client-source/eyelid-r1091.js exists',src.length>0);
ok('runtime copy identical to client-source',src.length>0&&RT(NAME)===src);
const html=RT('index.html');
ok('index.html loads it once, right after age15-r1054',(html.match(/<script src="\.\/eyelid-r1091\.js"><\/script>/g)||[]).length===1&&/age15-r1054\.js"><\/script>\s*<script src="\.\/eyelid-r1091\.js"><\/script>/.test(html));
ok('listed in scripts/verify-r96-public.py',/'eyelid-r1091\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')));
ok('pages.yml runs this check',/r96\/qa\/r1091\/r1091-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('runtime-manifest lists it',fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes(NAME));
ok('no blur/drop-shadow filters (Three recorder falls back to Legacy)',src.length>0&&!/drop-shadow|blur\(/.test(src));
ok('does not touch the game ctx/renderer (own overlay canvas only)',src.length>0&&!/\bctx\.(?:filter|globalCompositeOperation)|drawHero\s*=|renderer\.render\s*=/.test(src));

function el(tag){const e={tagName:tag,id:'',children:[],style:{},dataset:{},width:0,height:0,parentNode:null,
 appendChild(c){c.parentNode=e;e.children.push(c);return c;},setAttribute(k,v){e[k]=v;},remove(){e.removed=true;},
 getContext(){return e.g||(e.g=fakeCtx());}};return e;}
function fakeCtx(){const calls=[];const bad=[];const chk=(name,args)=>{calls.push(name);for(const a of args)if(typeof a==='number'&&!Number.isFinite(a))bad.push(name);};
 const g={calls,bad,fillStyle:'',strokeStyle:'',globalAlpha:1,lineWidth:1,set filter(v){g._filter=v;},get filter(){return g._filter||'none';}};
 for(const k of ['clearRect','fillRect','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','fill','stroke','save','restore','arc','ellipse','setTransform','translate','scale','drawImage'])g[k]=(...a)=>chk(k,a);
 const grad=()=>({addColorStop:(o,c)=>chk('stop',[o])});g.createLinearGradient=(...a)=>{chk('lg',a);return grad();};g.createRadialGradient=(...a)=>{chk('rg',a);return grad();};
 g.createPattern=()=>({});g.createImageData=(w,h)=>({data:new Uint8ClampedArray(Math.max(1,w*h*4))});g.putImageData=()=>{};return g;}
function boot(o={}){const store=new Map(o.stored?[['storyworld.r1091.eyelid',o.stored]]:[]);
 const body=el('body');let now=0;
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,Error,isFinite,parseFloat,Uint8ClampedArray,Promise,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  performance:{now:()=>now},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},addEventListener(){},
  navigator:{webdriver:!!o.webdriver},location:{search:o.search||''},innerWidth:o.w??1280,innerHeight:o.h??720,devicePixelRatio:o.dpr??2,
  document:{readyState:'complete',body,createElement:t=>el(t),getElementById:()=>null,addEventListener(){}},
  started:false,loading:false,modal:true,player:null,storyScene:null,settings:{reducedMotion:!!o.reduced,lowFx:!!o.lowFx},
  newGame:async function(){sb.started=true;sb.loading=true;sb.player={hp:100};return true;},
  restoreSave:async function(){sb.started=true;sb.loading=true;sb.player={hp:100};return true;},
  hurt:function(d){if(sb.player)sb.player.hp=Math.max(0,sb.player.hp-d);return 'hit';}};
 if(o.coop)sb.__STORYWORLD_COOP_SIM_R62__={mode:()=>'local'};
 sb.window=sb;vm.createContext(sb);let err=null;if(src){try{vm.runInContext(src,sb);}catch(e){err=String(e);}}
 return {sb,store,body,err,I:sb.__STORYWORLD_EYELID_R1091__,at:ms=>{now=ms;},get now(){return now;}};}
const A=boot(),I=A.I;
ok('module boots and exposes API',!!I&&!A.err,A.err);
if(!I){console.log(`\nR1091 eyelid: ${n-bad}/${n} pass`);process.exit(1);}
const canvas=()=>A.body.children.find(c=>c.tagName==='canvas');
// ---- 곡선 ----
const D=I.durations();
// 사용자 2026-11-16 00:10Z '가로합일 참고' 확인 → 가로판 합일(hapil1 RC181·RC182, 눈꺼풀 0.7초)과 세로 리부트(뜨기 1.05초·감기 1.15초) 박자에 맞춤.
ok('durations follow the 합일 reference pace: open and close each 1.0–1.4s (normal)',D.open>=1&&D.open<=1.4&&D.close>=1&&D.close<=1.4,D);
ok('open curve: starts shut (0) and ends fully open (1)',I.openness('open',0)===0&&I.openness('open',D.open)===1);
ok('close curve: starts open (1) and ends shut (0)',I.openness('close',0)===1&&I.openness('close',D.close)===0);
const samples=k=>Array.from({length:201},(_,i)=>I.openness(k,D[k]*i/200));
const os=samples('open'),cs=samples('close');
ok('all curve samples finite and inside [0,1]',[...os,...cs].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
let dip=false;for(let i=0;i<os.length;i++)for(let j=i+1;j<os.length;j++)if(os[i]-os[j]>.1){dip=true;break;}
ok('opening has one natural blink (opens a little, dips by >0.1, then opens fully)',dip);
ok('opening: first light line before lids part (openness still ~0 at 10%)',I.openness('open',D.open*.1)<.03);
ok('closing: heavy lids — below half before 60% of the time',I.openness('close',D.close*.6)<.5);
ok('NaN / -Infinity / Infinity time clamp to the curve ends',I.openness('open',NaN)===0&&I.openness('open',-Infinity)===0&&I.openness('open',Infinity)===1&&I.openness('close',NaN)===1&&I.openness('close',1e9)===0);
ok('unknown kind → fully open (never leaves the screen covered)',I.openness('weird',.5)===1);
// ---- 모양 ----
const G=(w,h,o)=>I.geometry(w,h,o);
const g1=G(1280,720,1),g0=G(1280,720,0),gh=G(1280,720,.5);
const fin=g=>g&&g.top.length>8&&g.top.length===g.bottom.length&&[...g.top,...g.bottom].every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
ok('geometry finite with sample points',fin(g1)&&fin(g0)&&fin(gh));
ok('fully open: both lids entirely off-screen',Math.max(...g1.top.map(p=>p[1]))<0&&Math.min(...g1.bottom.map(p=>p[1]))>720);
ok('fully shut: lids meet on one horizontal line at the centre (가로 한 줄)',g0.top.every(p=>p[1]>=359)&&g0.bottom.every(p=>p[1]<=361));
ok('half open: almond eye — gap widest at the centre, narrower toward the sides',(()=>{const gap=i=>gh.bottom[i][1]-gh.top[i][1],m=gh.top.length>>1;return gap(m)>gap(1)+20&&gap(m)>gap(gh.top.length-2)+20&&gap(m)>0;})());
ok('geometry with NaN/Infinity/zero inputs stays finite',fin(G(NaN,720,.5))&&fin(G(1280,Infinity,.3))&&fin(G(0,0,NaN))&&fin(G(1280,720,-5)));
// ---- 상태 ----
A.at(0);I.step();
ok('title screen (not started): idle, canvas hidden',I.state().phase==='idle'&&canvas()?.style.display==='none');
A.sb.newGame();A.at(100);I.step();
ok('new game arms the lids shut while loading',I.state().phase==='shut'&&I.state().openness===0&&canvas().style.display!=='none');
A.sb.modal=false;A.at(400);I.step();ok('still loading → stays shut',I.state().phase==='shut');
A.sb.loading=false;A.sb.modal=true;A.at(500);I.step();ok('story panel open (modal) → stays shut until the world is visible',I.state().phase==='shut');
A.sb.modal=false;A.at(600);I.step();ok('world visible → opening starts',I.state().phase==='opening');
A.at(600+D.open*500);I.step();const mid=I.state().openness;ok('mid-opening openness between 0 and 1',mid>0&&mid<1,mid);
A.at(600+D.open*1000+20);I.step();ok('after the open duration: idle, fully open, canvas hidden (no drawing)',I.state().phase==='idle'&&I.state().openness===1&&canvas().style.display==='none');
ok('stats.opens counts one',I.inspect().stats.opens===1);
// 지역 이동
A.sb.loading=true;A.at(4000);I.step();A.sb.loading=false;A.at(4300);I.step();ok('region travel (loading while open) does not close/reopen',I.state().phase==='idle'&&I.inspect().stats.opens===1&&I.inspect().stats.closes===0);
// 사망 — 무거운 화면에서 감시 타이머가 늦어도 쓰러지는 그 순간 감기 시작(헤드리스 실측 0.25초 넘게 늦던 것)
{const H=boot();H.sb.newGame();H.at(10);H.I.step();H.sb.loading=false;H.sb.modal=false;H.at(20);H.I.step();H.at(20+H.I.durations().open*1000+50);H.I.step();
 const r=H.sb.hurt(5);ok('hurt wrapper returns the original result',r==='hit');ok('non-lethal hit: still idle',H.I.state().phase==='idle');
 H.sb.hurt(1e6);ok('lethal hurt starts closing immediately (no watcher tick needed)',H.I.state().phase==='closing',H.I.state());}
A.sb.player.hp=0;A.at(5000);I.step();ok('hp 0 → closing starts',I.state().phase==='closing'&&canvas().style.display!=='none');
A.sb.modal=true;A.at(5000+D.close*1000+20);I.step();ok('after close duration: shut and held',I.state().phase==='shut'&&I.state().openness===0&&I.inspect().stats.closes===1);
A.at(9000);I.step();ok('stays shut while dead and the death panel is up',I.state().phase==='shut');
A.sb.player.hp=100;A.at(9500);I.step();ok('revived but panel still up → shut',I.state().phase==='shut');
A.sb.modal=false;A.at(9600);I.step();ok('back in the world → eyes open again',I.state().phase==='opening');
A.at(9600+D.open*1000+20);I.step();ok('open again and hidden',I.state().phase==='idle'&&I.inspect().stats.opens===2);
// 불러오기
A.sb.restoreSave();A.at(12000);I.step();ok('load save arms shut too',I.state().phase==='shut');A.sb.loading=false;A.sb.modal=false;A.at(12100);I.step();ok('and opens when visible',I.state().phase==='opening');
// 그리기
A.at(12100+D.open*400);I.step();I.drawNow();const g=canvas().g;
ok('drawing issued fills, no NaN/Infinity args',g&&g.calls.includes('fill')&&g.bad.length===0,g&&g.bad.slice(0,5));
ok('reference lid look: ink gradient body (lighter outside → dark edge) and a lash stroke along each lid edge',g&&g.calls.filter(c=>c==='lg').length>=2&&g.calls.filter(c=>c==='stroke').length>=2);
ok('ink-wash off: deep navy lids like the 가로판 (#03060d)',/#03060d/.test(src));
ok('canvas is pointer-events none and below the panel (z-index < 30)',canvas().style.pointerEvents==='none'&&Number(canvas().style.zIndex)<30&&Number(canvas().style.zIndex)>0);
ok('canvas resolution capped (≤ 0.75 × screen, dpr ignored)',canvas().width<=1280*.75+1&&canvas().width>=200);
// 해상도·움직임 줄이기
const L=boot({lowFx:true});L.sb.newGame();L.at(10);L.I.step();L.sb.loading=false;L.sb.modal=false;L.at(20);L.I.step();L.at(300);L.I.step();L.I.drawNow();
ok('low effects: canvas at ≤ 0.5 × screen',L.body.children.find(c=>c.tagName==='canvas').width<=641);
const M=boot({reduced:true});ok('reduced motion: short open/close (≤ 0.6s)',M.I.durations().open<=.6&&M.I.durations().close<=.6);
ok('reduced motion: no blink dip (monotone open)',(()=>{let p=0;for(let i=0;i<=100;i++){const v=M.I.openness('open',M.I.durations().open*i/100);if(v<p-1e-9)return false;p=v;}return true;})());
// 끄기·자동 검사·협동
const run=b=>{b.sb.newGame();b.at(10);b.I.step();const armed=b.I.state().phase;b.sb.loading=false;b.sb.modal=false;b.at(20);b.I.step();b.sb.player.hp=0;b.at(30);b.I.step();return {armed,dead:b.I.state().phase};};
const off=boot({stored:'{"on":false}'});const ro=run(off);ok('pref off: never arms or closes',ro.armed==='idle'&&ro.dead==='idle',ro);
const wd=boot({webdriver:true});const rw=run(wd);ok('automation (webdriver): skipped',rw.armed==='idle'&&rw.dead==='idle'&&wd.I.inspect().stats.skipped>0,rw);
const wf=boot({webdriver:true,search:'?eye1091=1'});const rf=run(wf);ok('automation with ?eye1091=1: runs',rf.armed==='shut'&&rf.dead==='closing',rf);
const co=boot({coop:true});const rc=run(co);ok('co-op: skipped',rc.armed==='idle'&&rc.dead==='idle',rc);
const s2=boot();s2.I.set({on:false});ok('set({on:false}) saves the pref',/"on":false/.test(s2.store.get('storyworld.r1091.eyelid')||''));
// 이상한 상태
const W=boot();W.sb.started=true;W.sb.loading=false;W.sb.modal=false;W.sb.player=null;W.at(5);let threw=false;try{W.I.step();}catch(_){threw=true;}
ok('started with no player: no throw, stays idle',!threw&&W.I.state().phase==='idle');
const S=boot();S.sb.newGame();S.at(1);S.I.step();S.sb.started=false;S.sb.loading=false;S.at(2);S.I.step();ok('back to title while shut → idle, canvas hidden (never stuck covering the title)',S.I.state().phase==='idle'&&S.body.children.find(c=>c.tagName==='canvas').style.display==='none');
console.log(`\nR1091 eyelid: ${n-bad}/${n} pass`);process.exit(bad?1:0);
