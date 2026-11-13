// R1016 황금실·은색실 커스텀(직접 그린 도안) 오류·충돌 정리 — 사용자 2026-11-13 "실검무 황금실검무 커스텀도 오류없게 모두충돌없게".
//  헤드리스 재현(스토리 777 PC·모바일 터치·무한생존·길잡이 자동)에서 찾은 것과 고친 것:
//  ① G(황금실)를 손으로 눌렀는데 습득 전·장착 없음·재사용 중·12m 안에 적 없음·쉼터면 R74 가 아무 안내 없이 false 만 돌려
//     '눌러도 안 나간다'로 보였다(R72 에는 안내가 있었는데 R74 로 넘어가며 빠짐). → 손으로 누른 실패에만 이유를 한 줄 띄운다(0.8초에 한 번).
//     자동·반자동(manual=false)은 조용히 둔다. 은색실(T)은 R243 이 기본 실검무로 넘기거나 안내하므로 손대지 않는다.
//     엔진이 이미 안내한 실패(안전한 검무 공간 없음)는 겹쳐 띄우지 않는다.
//  ② 관리 창에서 습득·장착·해제·강화·자동 켜기를 눌러도 모두 '저장했습니다.'로만 나왔다 → 방금 한 일을 적는다(실패 문구·도안 저장 문구는 그대로).
//  ③ 무한생존은 저장을 쓰지 않고 실검무 강화 줄도 없는데 Alt+G·메뉴로 도안 창이 열려, 거기서 그린 도안·쓴 점수가 판이 끝나면 사라졌다.
//     → 무한생존 중에는 도안 창·G 를 막고 안내한다(사용자 결정 전 기본안: 지금처럼 무한생존은 3택 강화만).
//  피해·판정·쿨타임·저장 형식은 바꾸지 않는다. 협동 모드는 손대지 않는다.
//  끄기: localStorage 'storyworld.r1016.threadCustom'='0'
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_THREAD_CUSTOM_R1016__)return;
const REV='R1016-thread-custom-1',KEY='storyworld.r1016.threadCustom',GAP=800,RANGE=12;
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const stats={hints:0,quiet:0,relabels:0,survivalBlocks:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const g=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const now=()=>g(()=>performance.now(),Date.now());
const solo=()=>{const m=g(()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.(),null);return !m||m==='off';};
const survival=()=>g(()=>window.__STORYWORLD_SURVIVAL_R600__?.active?.()===true,false);
const me=()=>g(()=>typeof player==='object'?player:null,null);
function say(t){try{if(typeof toast==='function')toast(t,2.4);}catch(e){fail(e);}}
let lastHint=-1e9,engineSaid=false;
function hint(t){const n=now();if(n-lastHint<GAP){stats.quiet++;return;}lastHint=n;stats.hints++;say(t);}
const SURVIVAL_MSG='무한생존에서는 황금실·은색실 도안을 쓰지 않습니다 · 스토리 모드에서 제작·사용하세요';
// ① 손으로 누른 황금실이 왜 안 나갔는지
function reason(D,aim){const p=me();if(!p)return null;
 if(g(()=>!started||loading||modal,true))return null;/* 창·로딩 중: 엔진이 원래 무시 */
 const s=g(()=>D.state('gold',p),null);if(!s)return null;
 if(!s.learned)return '황금실 필살검무를 먼저 습득하세요 · Alt+G 또는 메뉴 → 황금실 제작·관리';
 if(!Array.isArray(s.equipped)||!s.equipped.length)return '장착한 황금실 도안이 없습니다 · Alt+G 로 도안을 장착하세요';
 if(g(()=>safeRegion(),false))return '쉼터에서는 황금실 필살검무를 쓸 수 없습니다';
 const cd=Number(g(()=>D.cooldown('gold',p),0));if(Number.isFinite(cd)&&cd>0)return '황금실 재사용 대기 · '+Math.max(1,Math.ceil(cd))+'초';
 const hasAim=aim&&Number.isFinite(aim.x)&&Number.isFinite(aim.y);
 if(!hasAim){const inRange=g(()=>liveEnemies().some(e=>e&&e.hp>0&&Number.isFinite(e.x+e.y)&&distance(p,e)<=RANGE),false);if(!inRange)return '12m 안에 적이 없습니다 · 가까이 가거나 우클릭으로 조준점을 지정하세요';}
 return null;}
// ② 관리 창 결과 문구
const LABEL={cooldown:'쿨타임',damage:'피해',size:'크기',speed:'속도',slots:'도안 저장칸',equip:'동시장착'};
let lastOp=null;
function describe(k,op){const p=me(),D=window.__STORYWORLD_DANCES_R74__,s=g(()=>D.state(k,p),null),cmd=op.cmd;
 switch(cmd.op){
  case 'learn':return (k==='gold'?'황금실':'은색실')+' 필살검무를 습득했습니다 · 도안을 장착하세요';
  case 'equip':return s&&Array.isArray(s.equipped)&&s.equipped.includes(cmd.id)?'도안을 장착했습니다':'도안 장착을 해제했습니다';
  case 'upgrade':{const v=s?.ranks?.[cmd.key];const lv=typeof v==='string'?(v.length>9?v.slice(0,9)+'…':v):Number.isFinite(v)?String(v):'';return (LABEL[cmd.key]||'강화')+(lv?' '+lv+'단계로':'')+' 강화했습니다';}
  case 'auto':return '반자동·자동 사용을 '+(cmd.enabled===true?'켰습니다':'껐습니다');
  case 'delete':return '도안을 삭제했습니다';
  case 'clone':return '도안을 복제했습니다';
  case 'rename':return '이름을 바꿨습니다';
  case 'archive-swap':return '보관 도안과 맞바꿨습니다';
  default:return null;}}
function relabel(k){const op=lastOp;lastOp=null;if(!op||op.k!==k||now()-op.at>1500||!op.ok)return;const m=g(()=>document.getElementById('goldMessage'),null);if(!m||m.textContent!=='저장했습니다.')return;const t=describe(k,op);if(t){m.textContent=t;stats.relabels++;}}
let wrapped=false;
function install(){const D=window.__STORYWORLD_DANCES_R74__;if(!D||wrapped||D.__r1016)return !!D;wrapped=true;
 const baseCast=D.cast,baseCommand=D.command,baseDecorate=D.decorateManager;
 window.__STORYWORLD_DANCES_R74__=Object.freeze({...D,__r1016:true,
  cast(k,index=0,aim=null,manual=true,...a){
   if(!on||k!=='gold'||!solo())return baseCast.call(this,k,index,aim,manual,...a);
   if(survival()){stats.survivalBlocks++;if(manual!==false)hint(SURVIVAL_MSG);return false;}
   engineSaid=false;const r=baseCast.call(this,k,index,aim,manual,...a),said=engineSaid;
   try{if(r!==true&&manual!==false&&!said){const t=reason(D,aim);if(t)hint(t);}}catch(e){fail(e);}
   return r;},
  command(k,p,cmd,...a){const r=baseCommand.call(this,k,p,cmd,...a);try{if(on&&cmd&&typeof cmd==='object')lastOp={k,cmd:{...cmd},ok:!!(r&&r.ok!==false),at:now()};}catch(e){fail(e);}return r;},
  decorateManager(k,refresh,...a){
   if(on&&solo()&&survival()){stats.survivalBlocks++;try{closePanel(true);}catch(e){fail(e);}say(SURVIVAL_MSG);return undefined;}
   const r=baseDecorate.call(this,k,refresh,...a);try{if(on)relabel(k);}catch(e){fail(e);}return r;}});
 return true;}
// 엔진 toast 감시: 시전 안에서 엔진이 직접 안내하면 겹쳐 띄우지 않는다.
function watchToast(){if(typeof toast!=='function'||toast.__r1016)return;const base=toast;const w=function(...a){engineSaid=true;return base.apply(this,a);};w.__r1016=true;try{toast=w;}catch(e){fail(e);}}
// ③ 무한생존: Alt+G(도안 창)를 R72 의 document 캡처보다 먼저 막는다. 그냥 G 는 위 cast 에서 안내.
try{window.addEventListener('keydown',e=>{if(!on||e.code!=='KeyG'||!e.altKey||e.repeat||!solo()||!survival())return;if(g(()=>e.target?.matches?.('input,textarea,select,[contenteditable="true"]'),false))return;e.preventDefault();e.stopImmediatePropagation();stats.survivalBlocks++;hint(SURVIVAL_MSG);},true);}catch(e){fail(e);}
try{watchToast();}catch(e){fail(e);}
let tries=0;(function arm(){try{install();}catch(e){fail(e);}if(!wrapped&&++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_THREAD_CUSTOM_R1016__=Object.freeze({revision:REV,on:()=>on,set:v=>{on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;},
 inspect:()=>({revision:REV,on,installed:wrapped,stats:{...stats},lastError})});
})();
