// R1008 CPU 검사: 영화 모드 마무리(cinema-finish-r1008.js) — 브라우저 없이 실제 모듈을 돌린다.
//  ① 영화 모드에서 영웅이 쓰러지면 쉼터로 돌아가는 창 대신 그 자리에서 다시 일어선다(살인 장에서 쓰러짐 → 쉼터 → 같은 지역 반복 → 영화가 끝까지 못 감).
//  ② 영화 모드에서 마지막 엔딩 창(최종장 '몽세에 남기', 사몽 '윤서하의 진료기록')은 자막이 끝나고 20초 뒤 스스로 넘어간다(사용자 2026-11-13 결정 '자동으로 넘김').
//  ③ 일반 기록(스토리·무한생존)은 하나도 바뀌지 않는다. 끄기 storyworld.r1008.cinema {"on":false}.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const FILE=path.join(__dirname,'..','..','client-source','cinema-finish-r1008.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
function make({cinema=true,ls=null}={}){
 let clock=0;const timers=[];const clicks=[];const toasts=[];
 const btn=id=>({id,click(){clicks.push(id);sb.__onClick?.(id);}});
 const els={};
 const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,
  performance:{now:()=>clock*1000},setTimeout:(f,ms)=>{timers.push({at:clock+ms/1000,f,iv:0});return timers.length;},clearTimeout:i=>{if(timers[i-1])timers[i-1].f=null;},
  setInterval:(f,ms)=>{timers.push({at:clock+ms/1000,f,iv:ms/1000});return timers.length;},clearInterval:i=>{if(timers[i-1])timers[i-1].f=null;},
  addEventListener(){},document:{getElementById:id=>els[id]||null,addEventListener(){},querySelector:()=>null},
  localStorage:{getItem:k=>ls&&k in ls?ls[k]:null,setItem(){}},
  player:{hp:0,hero:'michaela',invincible:0,invReason:''},maxHP:()=>777,modal:false,loading:false,started:true,storyScene:null,time:100,
  toast:(t)=>toasts.push(t),
  __STORYWORLD_CINEMA_RUN_R461__:{active:()=>cinema},
  __STORYWORLD_CINEMA_MODE_R370__:{prefs:()=>({on:cinema}),remainingSecs:()=>sb.__remain||0,inspect:()=>({queue:sb.__queue||0,current:sb.__cur||null})},
 };
 sb.window=sb;sb.showDeath=function(){sb.deathPanel=(sb.deathPanel||0)+1;sb.modal=true;};
 vm.createContext(sb);vm.runInContext(fs.readFileSync(FILE,'utf8'),sb,{filename:'cinema-finish-r1008.js'});
 const run=sec=>{const end=clock+sec;for(;;){const due=timers.filter(t=>t.f&&t.at<=end).sort((a,b)=>a.at-b.at)[0];if(!due)break;clock=due.at;const f=due.f;if(due.iv)due.at+=due.iv;else due.f=null;try{f();}catch(e){console.log('timer error',e);}}clock=end;};
 return{sb,run,clicks,toasts,els,btn,setEl:(id)=>{els[id]=btn(id);},clearEl:id=>{delete els[id];}};}
// 모듈이 있어야 한다
check('cinema-finish-r1008.js exists',fs.existsSync(FILE));
if(!fs.existsSync(FILE)){console.log(JSON.stringify({total:results.length,failed:results.filter(r=>!r.ok).length}));process.exit(1);}
// ① 쓰러짐
{const t=make();t.sb.player.hp=0;t.sb.showDeath();
 check('cinema: no death panel (no trip back to the sanctuary)',!t.sb.deathPanel&&!t.sb.modal,JSON.stringify({p:t.sb.deathPanel,m:t.sb.modal}));
 check('cinema: hero stands up with half HP, finite',t.sb.player.hp>=777*.45&&t.sb.player.hp<=777&&Number.isFinite(t.sb.player.hp),t.sb.player.hp);
 check('cinema: short invincibility after standing up (2~4 s)',t.sb.player.invincible>=2&&t.sb.player.invincible<=4,t.sb.player.invincible);
 check('cinema: tells the viewer once',t.toasts.length===1&&/영화 모드/.test(t.toasts[0]),t.toasts.join('|'));
 const st=t.sb.__STORYWORLD_CINEMA_FINISH_R1008__.inspect().stats;check('cinema: counted',st.standUps===1,JSON.stringify(st));}
{const t=make({cinema:false});t.sb.player.hp=0;t.sb.showDeath();
 check('normal record: original death panel unchanged',t.sb.deathPanel===1&&t.sb.player.hp===0,JSON.stringify({p:t.sb.deathPanel,hp:t.sb.player.hp}));}
{const t=make({ls:{'storyworld.r1008.cinema':'{"on":false}'}});t.sb.player.hp=0;t.sb.showDeath();
 check('switch off: original death panel',t.sb.deathPanel===1);}
{const t=make();t.sb.player.hp=0;t.sb.maxHP=()=>NaN;t.sb.showDeath();
 check('cinema: broken maxHP never writes NaN (falls back to the death panel)',Number.isFinite(t.sb.player.hp)&&(t.sb.deathPanel===1||t.sb.player.hp>0),t.sb.player.hp);}
// ② 엔딩 창 자동 넘김
for(const id of ['endingExplore','r103End']){
 const t=make();t.sb.modal=true;t.setEl(id);t.sb.__queue=3;t.sb.__remain=12;
 t.run(30);check(id+': waits while subtitles are still running',!t.clicks.length,t.clicks.join(','));
 t.sb.__queue=0;t.sb.__remain=0;t.run(15);check(id+': not before 20 s after subtitles end',!t.clicks.length,t.clicks.join(','));
 t.run(7);check(id+': clicks its own button about 20 s after subtitles end',t.clicks.length===1&&t.clicks[0]===id,t.clicks.join(','));
 t.run(60);check(id+': only once',t.clicks.length===1,t.clicks.join(','));}
{const t=make({cinema:false});t.sb.modal=true;t.setEl('endingExplore');t.run(120);check('normal record: ending window waits for the player',!t.clicks.length);}
{const t=make();t.sb.modal=true;t.setEl('reviveHome');t.setEl('storyNext');t.run(120);check('cinema: other windows are not touched',!t.clicks.length,t.clicks.join(','));}
{const t=make();t.sb.modal=true;t.setEl('endingExplore');t.run(10);t.sb.__STORYWORLD_CINEMA_FINISH_R1008__.userInput();t.run(15);check('viewer input restarts the 20 s wait',!t.clicks.length);t.run(10);check('…then it moves on',t.clicks.length===1);}
{const t=make();t.sb.modal=true;t.setEl('endingExplore');t.sb.storyScene={};t.run(60);check('cinema: a scene on screen holds the ending',!t.clicks.length);}
const bad=results.filter(r=>!r.ok);console.log(JSON.stringify({total:results.length,failed:bad.length}));process.exit(bad.length?1:0);
