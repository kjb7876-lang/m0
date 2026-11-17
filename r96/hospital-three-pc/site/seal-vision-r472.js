/* R472 회장 광폭화 시야 봉인 (2026-11-09 야간, 서사 디테일 전투 연출 R450 개선안 4번).
 * 정본: "회장은 내 인장을 지우고 눈과 몸을 봉인했다. 수천 명의 비명 속에서 …"
 * 회장(ep1b08 b08-boss)이 R205 광폭화에 들어가는 순간 시야를 봉인한다: 영웅 둘레 약 2.6칸만 남기고 나머지를 검붉은 어둠으로 덮는다.
 * 닫힘 0.45초 → 봉인 2.6초 → 열림 0.5초. 이후 보스가 살아 있는 동안 22초마다 0.9초 예고(옅은 맥박) 뒤 다시 봉인한다.
 * - 화면 위 DOM 한 장(radial-gradient)만 쓴다. 게임 ctx.filter 를 건드리지 않는다(Three.js 기록기 Legacy 함정 피함).
 * - 판정·피해·AI·영웅 이동은 바꾸지 않는다(가까운 위협은 남은 원 안에서 보인다).
 * - 서사 장면·창·영화 모드(R370)·협동 중에는 띄우지 않고, 보스가 쓰러지거나 방을 떠나면 바로 걷는다.
 * 끄기: localStorage['storyworld.r472.seal']='{"on":false}'
 */
(()=>{'use strict';
const REV='R472',KEY='storyworld.r472.seal',ZONE='ep1b08',BOSS='b08-boss';
const WARN=.9,CLOSE=.45,HOLD=2.6,OPEN=.5,GAP=22,PEAK=.92,CLEAR_TILES=2.6;
const stats={seals:0,warnings:0,cleared:0,errors:0,lastError:null,lastSealAt:null};
let on=true,prefReadAt=-1e9;function readPref(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');on=!(v&&v.on===false);}catch(_){}}readPref();
// 설정 창 등이 키를 바꿔도 따르게 1초에 한 번만 다시 읽는다(매 프레임 localStorage 읽기 피함).
function prefLive(){const t=T();if(t<prefReadAt||t-prefReadAt>=1){prefReadAt=t;readPref();}return on;}
let el=null,boss=null,sealAt=null,nextAt=null,phase='idle',alpha=0,clearPx=0,lastRoom=null,warned=null;
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
function fail(e){stats.errors++;stats.lastError=String(e&&e.message||e);}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;
 if(window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on)return true;const co=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();if(co&&co!=='off')return true;}catch(_){}return false;}
function box(){if(el&&el.isConnected!==false)return el;el=document.createElement('div');el.id='r472Seal';el.setAttribute('aria-hidden','true');
 el.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:38;opacity:1;transition:none;';
 (document.body||document.documentElement).appendChild(el);return el;}
function heroScreen(){const q=project(player.x,player.y);let left=0,top=0,sx=1,sy=1;
 try{const c=document.getElementById('game'),r=c&&c.getBoundingClientRect();if(r&&r.width>0&&typeof W==='number'&&W>0&&typeof H==='number'&&H>0){left=r.left;top=r.top;sx=r.width/W;sy=r.height/H;}}catch(_){}
 const z=typeof zoom==='number'?zoom:1,t=typeof TILE==='number'?TILE:34;return{x:left+q.x*sx,y:top+(q.y-t*z*.9)*sy,r:CLEAR_TILES*t*z*sx};} // 발 아닌 몸통 높이를 가운데로
function paint(a){alpha=a;if(a<=0){if(el)el.style.background='transparent';return;}
 let h;try{h=heroScreen();}catch(e){fail(e);return;}clearPx=h.r;const r0=h.r,r1=h.r*1.35,r2=h.r*2.1,k=x=>x.toFixed(3);
 box().style.background=`radial-gradient(circle at ${h.x.toFixed(1)}px ${h.y.toFixed(1)}px, rgba(0,0,0,0) ${r0.toFixed(1)}px, rgba(46,0,8,${k(a*.72)}) ${r1.toFixed(1)}px, rgba(5,0,2,${k(a)}) ${r2.toFixed(1)}px, rgba(2,0,1,${k(a)}) 100%)`;}
function clear(){if(phase!=='idle'||alpha>0)stats.cleared++;phase='idle';paint(0);}
function reset(){boss=null;sealAt=null;nextAt=null;warned=null;clear();}
function liveBoss(){const list=(typeof room!=='undefined'&&room&&room.id===ZONE&&room.enemies)||[];
 return list.find(e=>e&&e.nativeId===BOSS&&!e.r61Clone&&e.hp>0&&!e.dead&&(e.spawnState==null||e.spawnState==='active'))||null;}
function step(){
 if(typeof room!=='undefined'&&room!==lastRoom){lastRoom=room;reset();}
 if(!prefLive()||typeof player==='undefined'||!player){clear();return;}
 const e=liveBoss();if(e!==boss){reset();boss=e;}
 if(!e||!e.r205Enraged||blockedNow()){clear();return;}
 const t=T();
 if(sealAt==null&&nextAt==null)nextAt=t; // 광폭화를 처음 보는 순간 첫 봉인(예고 없이 — 광폭화 알림·R450 박자가 예고 몫)
 if(sealAt!=null&&t-sealAt>=CLOSE+HOLD+OPEN){sealAt=null;}
 if(sealAt==null&&t>=nextAt){sealAt=t;nextAt=t+GAP;stats.seals++;stats.lastSealAt=t;}
 if(sealAt!=null){const u=t-sealAt;phase=u<CLOSE?'close':u<CLOSE+HOLD?'hold':'open';
  paint(PEAK*(u<CLOSE?u/CLOSE:u<CLOSE+HOLD?1:Math.max(0,1-(u-CLOSE-HOLD)/OPEN)));return;}
 if(t>=nextAt-WARN){if(warned!==nextAt){warned=nextAt;stats.warnings++;}phase='warn';paint(.12+.18*(.5+.5*Math.sin(t*9)));return;}
 phase='idle';paint(0);}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading))step();else clear();}catch(e){fail(e);try{clear();}catch(_){}}return r;};}
function set(o){if(o&&typeof o.on==='boolean'){on=o.on;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on)clear();}return{on};}
window.__STORYWORLD_SEAL_VISION_R472__=Object.freeze({revision:REV,set,
 inspect:()=>({revision:REV,on,phase,alpha,nextAt,sealAt,clearRadiusPx:clearPx||CLEAR_TILES*(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1),
  timing:{WARN,CLOSE,HOLD,OPEN,GAP,PEAK,CLEAR_TILES},stats:{...stats}})});
})();
