// R1022 CPU check: 자동 순간이동 켜고 끄기(사용자 2026-11-14 "모바일에서는 걷기이동+ 플레이어지시할때만 순간이동 나머지는 자동패시브화",
//  "자동대시및 블링크등 자동으로 순간이동하는걸 키고 끌 수있도록 / 끄는 경우 그곳에 분신보내 스킬이펙트만 나가게").
//  실제 모듈(client-source/auto-move-r1022.js)을 vm 에서 가짜 엔진(tick·moveActor·blink)과 돌린다. 브라우저·GPU·실기기 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='auto-move-r1022.js';let src='';try{src=C(F);}catch(_){}
ok('module exists',src.length>0);
{let rt='',idx='',ver='',ci='',inp='';try{rt=RT(F);idx=RT('index.html');ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');inp=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');}catch(_){}
 ok('runtime copy matches; one tag right after ui-clean-r1015; in verify list, runtime inputs and CI',src&&rt===src&&idx.split('"./'+F+'"').length===2&&idx.includes('<script src="./ui-clean-r1015.js"></script>\n<script src="./'+F+'"></script>')&&ver.includes("'"+F+"'")&&inp.includes('"'+F+'"')&&ci.includes('node r96/qa/r1022/r1022-cpu-check.cjs'));}
if(!src){for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name);console.log(JSON.stringify({status:'R1022_FAILED',passed:0,total:checks.length}));process.exit(1);}
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
// 가짜 엔진. dash 는 엔진 본편 E 처럼 moveActor 로 3.8칸 옮긴 뒤 끝점을 읽어 그 선분 위 적에게 피해를 준다.
function mk(o={}){
 const ls=Object.assign({},o.ls||{}),clones=[],rebased=[],listeners=[],micro=[];
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Error,isFinite,
  localStorage:{getItem:k=>k in ls?ls[k]:null,setItem:(k,v)=>{ls[k]=String(v);}},queueMicrotask:f=>micro.push(f),
  player:{hp:100,x:10,y:10,hero:'neon',direction:'front',blinkCD:0},time:5,room:{id:'murder01'},started:true,loading:false,modal:false,
  enemies:[{x:12,y:10,hp:100}],hits:[]};
 sb.blocked=(x,y)=>!!(o.wallX!=null&&x>=o.wallX);
 sb.moveActor=function(a,dx,dy){const nx=a.x+dx,ny=a.y+dy;if(!sb.blocked(nx,ny)){a.x=nx;a.y=ny;}return true;};
 sb.blink=function(){if(sb.player.blinkCD>0)return;sb.moveActor(sb.player,3.8,0);sb.player.blinkCD=4;};
 sb.dash=function(){const p=sb.player,o0={x:p.x,y:p.y};sb.moveActor(p,3.8,0);const end={x:p.x,y:p.y};for(const e of sb.enemies)if(e.x>=o0.x&&e.x<=end.x+.01){e.hp-=30;sb.hits.push({x:e.x,end});}return end;};
 sb.steps=[];sb.tick=function(dt){for(const s of sb.steps.splice(0))s();sb.time+=dt;};
 sb.window={addEventListener:(t,f)=>listeners.push({t,f}),__STORYWORLD_CLONE_R767__:{spawn:(x,y,opt)=>{clones.push({x,y,opt});return true;}},
  __STORYWORLD_MOBILE_R63__:{isMobile:()=>!!o.mobile}};
 if(o.r706)sb.window.__STORYWORLD_DANCE_FREE_R706__={state:()=>({body:o.r706.body}),rebase:(x,y)=>{rebased.push({x,y});if(o.r706.body){o.r706.body.x=x;o.r706.body.y=y;}}};
 if(o.orbit)sb.window.__STORYWORLD_THREADS_R174__={active:()=>o.orbit.on?{target:1}:null};
 if(o.coop)sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};
 const els={};sb.document={readyState:o.ready||'loading',getElementById:id=>els[id]||null,createElement:()=>{const e={children:[],appendChild(c){this.children.push(c);return c;},querySelector(){return null;},set innerHTML(v){this._h=v;},get innerHTML(){return this._h||'';}};return e;}};
 sb.window.window=sb.window;vm.createContext(sb);for(const k of ['localStorage','document','queueMicrotask'])sb.window[k]=sb[k];
 vm.runInContext(src,sb);for(const l of listeners)if(l.t==='load')l.f();
 const flush=()=>{while(micro.length)micro.shift()();};
 return{sb,ls,clones,rebased,flush,API:sb.window.__STORYWORLD_AUTO_MOVE_R1022__};}
const run=(m,fn)=>{m.sb.steps.push(fn);m.sb.tick(.016);};
// ① 기본값: PC 켬(예전과 같음), 모바일 끔. 저장한 값이 우선.
{const pc=mk(),mob=mk({mobile:true}),ovr=mk({mobile:true,ls:{'storyworld.r1022.autoMove':'1'}}),ovr2=mk({ls:{'storyworld.r1022.autoMove':'0'}});
 ok('defaults: PC on, mobile off; stored choice wins',pc.API&&pc.API.on()===true&&mob.API.on()===false&&ovr.API.on()===true&&ovr2.API.on()===false,{pc:pc.API?.on(),mob:mob.API?.on()});}
// ② 켬: 자동 돌진은 예전처럼 본체가 끝점으로 간다(PC 동작 그대로).
{const m=mk();let end;run(m,()=>{end=m.sb.dash();});
 ok('on: dash moves the hero to the end point as before, no clone',near(m.sb.player.x,13.8)&&m.clones.length===0&&m.sb.enemies[0].hp===70,{x:m.sb.player.x});}
// ③ 끔: 돌진 피해는 같은 선분(같은 양)에서 나가고, 본체는 제자리, 분신이 끝점에.
{const m=mk({mobile:true});let end;run(m,()=>{end=m.sb.dash();});
 ok('off: dash damage identical (same segment/amount) but the hero stays home',m.sb.enemies[0].hp===70&&near(end.x,13.8)&&near(m.sb.player.x,10)&&near(m.sb.player.y,10),{x:m.sb.player.x,hp:m.sb.enemies[0].hp});
 ok('off: a clone appears at the dash end point',m.clones.length>=1&&near(m.clones[m.clones.length-1].x,13.8)&&near(m.clones[m.clones.length-1].y,10),m.clones);}
// ④ 끔: 같은 tick 안의 걷기는 그대로 쌓인다.
{const m=mk({mobile:true});run(m,()=>{m.sb.moveActor(m.sb.player,.1,.05);m.sb.dash();m.sb.moveActor(m.sb.player,.1,0);});
 ok('off: walking in the same tick is kept (home + walk), the leap is not',near(m.sb.player.x,10.2)&&near(m.sb.player.y,10.05),{x:m.sb.player.x,y:m.sb.player.y});}
// ⑤ 끔: tick 안 블링크(길잡이 자동 블링크)는 막고, 손으로 누른 블링크(tick 밖)는 그대로 옮긴다.
{const m=mk({mobile:true});run(m,()=>m.sb.blink());
 ok('off: blink inside tick (auto guide blink) does nothing and keeps the cooldown',near(m.sb.player.x,10)&&m.sb.player.blinkCD===0&&m.API.stats().autoBlinksBlocked===1,m.API.stats());
 m.sb.blink();m.flush();
 ok('off: manual blink (outside tick) still teleports the hero',near(m.sb.player.x,13.8)&&m.sb.player.blinkCD===4,{x:m.sb.player.x});}
// ⑥ 끔: tick 밖 돌진(키를 눌러 바로 옮기는 기술)도 다음 그리기 전에 제자리로.
{const m=mk({mobile:true});const end=m.sb.dash();const midX=m.sb.player.x;m.flush();
 ok('off: leap outside tick reads the end point synchronously, then the hero is restored before render',near(midX,13.8)&&near(end.x,13.8)&&near(m.sb.player.x,10)&&m.clones.length>=1,{midX,x:m.sb.player.x});}
// ⑦ 끔: 문양 실검무 궤도(R174, 영웅 자리를 바로 바꿈)도 본체 제자리.
{const orbit={on:true};const m=mk({mobile:true,orbit});run(m,()=>{m.sb.player.x=14;m.sb.player.y=12;});
 ok('off: golden-thread orbit (direct position set) keeps the body home with a clone at the orbit spot',near(m.sb.player.x,10)&&near(m.sb.player.y,10)&&m.clones.some(c=>near(c.x,14)&&near(c.y,12)),{x:m.sb.player.x});
 orbit.on=false;run(m,()=>{m.sb.player.x=10.4;});
 ok('off: without orbit or leap, direct position changes (doors, unstick) are left alone',near(m.sb.player.x,10.4));}
// ⑧ 끔 + R706 실검무 본체 기억: 돌진 뒤 R706 기억도 본체 자리로 맞춘다.
{const r706={body:{x:10,y:10}};const m=mk({mobile:true,r706});run(m,()=>{m.sb.player.x=11.5;m.sb.dash();});
 ok('off with R706 body: restore to the R706 body and rebase it',near(m.sb.player.x,10)&&m.rebased.length>=1&&near(r706.body.x,10),{x:m.sb.player.x,rebased:m.rebased});}
// ⑨ 경계: 지역이 바뀌면·쓰러지면·함께하기면 손대지 않는다. 옮긴 자리가 숫자가 아니면 되돌리지 않는다.
{const m=mk({mobile:true});run(m,()=>{m.sb.dash();m.sb.room={id:'murder02'};});ok('off: region change mid-tick is not undone',near(m.sb.player.x,13.8));}
{const m=mk({mobile:true});run(m,()=>{m.sb.dash();m.sb.player.hp=0;});ok('off: dead hero is not moved back',near(m.sb.player.x,13.8));}
{const m=mk({mobile:true,coop:true});run(m,()=>m.sb.dash());ok('off: co-op left alone (host owns positions)',near(m.sb.player.x,13.8));}
{const m=mk({mobile:true});run(m,()=>{m.sb.dash();});m.sb.player.x=NaN;run(m,()=>{});ok('NaN never written; clone coords finite',m.clones.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.y))&&m.API.stats().errors===0);}
// ⑩ 벽: 돌진이 벽에 막혀 짧게 끝나면 분신도 그 자리(엔진 판정 그대로).
{const m=mk({mobile:true,wallX:12.5});let end;run(m,()=>{end=m.sb.dash();});ok('off: wall-blocked dash keeps engine end point (no clone through walls)',near(m.sb.player.x,10)&&m.clones.every(c=>c.x<12.5),{end,clones:m.clones});}
// ⑪ 켜고 끄기 API·설정 저장.
{const m=mk({mobile:true});m.API.set(true);const a=m.API.on(),s1=m.ls['storyworld.r1022.autoMove'];m.API.set(false);ok('set() stores 1/0 and switches live',a===true&&s1==='1'&&m.API.on()===false&&m.ls['storyworld.r1022.autoMove']==='0');}
// ⑫ 설정 창 줄: R1021 '전투 화면' 구역이 있으면 그 안, 없으면 #quickSettingsR114 끝.
ok('settings row targets section#combatScreenR1021 (div.r1021-row) with #quickSettingsR114 fallback',/combatScreenR1021/.test(src)&&/r1021-row/.test(src)&&/quickSettingsR114/.test(src));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'')));
console.log(JSON.stringify({status:fail.length?'R1022_FAILED':'R1022_PASSED',passed:checks.length-fail.length,total:checks.length}));process.exit(fail.length?1:0);
