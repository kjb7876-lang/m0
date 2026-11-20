// R1249 — 설정창 같은 '정지 화면'(게임 시간이 멈춘 어두운 창)이 열려 있는 동안 월드를 매 프레임 다시 그리지 않는다.
// 리뷰(사용자 2026-11-20 첨부 "4. 코드 구조와 전반적인 렉 — 정지 화면의 낭비부터 줄이기"):
//  · 공개판에서 설정창을 열어 게임 시간이 멈춘 12.16초 동안 모바일 규격 Chromium 이 월드 장면을 42번 다시 그리고 GPU 그리기 호출 2,394번을 냈다.
//  · 창(#modal)은 88% 어두운 막+흐림이라 뒤 월드는 거의 안 보이고, tick 은 modal 동안 멈춰 있어 그림도 바뀌지 않는다.
// 하는 일:
//  · 정지 창이 열린 뒤 처음 몇 프레임(SETTLE_N)은 그대로 그려 마지막 장면을 남기고, 그 뒤로는 draw 를 건너뛴다(캔버스는 다음 그리기 전까지 그대로 보인다).
//  · 바로 다시 그리는 때: 창 안 입력·변경·클릭(밝기·화질·체크 상자 등, BUMP_MS 동안), 창 크기·회전·dpr 변화, 창 닫기, 게임 시간이 흐를 때(협동 손님 스냅샷 등).
//  · 늦게 붙는 텍스처·그림을 놓치지 않게 1초(KEEP_MS)마다 한 번은 다시 그린다. 새 지역이 막 들어왔으면(지역 서사 창) ROOM_MS 동안은 그대로 그려 장면을 미리 만든다(R1036 과 같은 까닭).
//  · 늘 그리는 때: 밝은 막(R255 기억 조각 r255·R667 타이틀 영상 r667on, 계산된 막 불투명도 < MIN_ALPHA), loading·!started·!booted, 끄기 설정, 확인 중 오류.
//  · tick·updateHUD·musicTick·게임 상태는 건드리지 않는다. 다른 스크립트가 나중에 draw 를 감싸도 가장 바깥에서 건너뛰도록 load 뒤에 한 번 더 감싼다(주기적 다시 감싸기 없음, R1196 핑퐁 방지).
//  · R619(영상이 덮는 동안 쉼)와 같은 방식(깊이 0 에서만 결정)이라 둘이 겹쳐도 서로 막지 않는다.
//  · 끄기: localStorage storyworld.r1249.staticpause {on:false}.
(()=>{'use strict';
if(window.__STORYWORLD_STATIC_PAUSE_R1249__)return;
const REV='R1249-static-pause-1',KEY='storyworld.r1249.staticpause',SETTLE_N=3,KEEP_MS=1000,BUMP_MS=400,ROOM_MS=5000,MIN_ALPHA=.8,LIGHT=Object.freeze(['r255','r667on']);
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={drawn:0,skipped:0,settle:0,keepalive:0,bumps:0,resized:0,timeMoved:0,roomWarm:0,installs:0,errors:0};
let lastError=null,drawFn=null,depth=0,settle=SETTLE_N,lastDrawAt=-1e9,bumpUntil=-1e9,lastTime=NaN,sizeKey='',roomSeen=null,roomUntil=-1e9;
const alphaCache=new Map();
const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
const g=(f,d)=>{try{return f();}catch(_){return d;}};
const curRoom=()=>g(()=>typeof room!=='undefined'&&room&&typeof room==='object'?room:null,null);
roomSeen=curRoom();
function note(e){stats.errors++;lastError=String(e?.message||e).slice(0,200);}
function alphaOf(css){const s=String(css||'').trim();if(!s||s==='transparent')return 0;const m=s.match(/^rgba?\(([^)]*)\)$/i);if(!m)return 1;
 const p=m[1].split(/[\s,\/]+/).filter(Boolean);if(p.length<4)return 1;const a=p[3];const v=a.endsWith('%')?parseFloat(a)/100:parseFloat(a);return Number.isFinite(v)?v:1;}
function veilOpaque(el){for(const c of LIGHT)if(el.classList.contains(c))return false;const k=String(el.className||'');
 if(alphaCache.has(k))return alphaCache.get(k);const a=alphaOf(getComputedStyle(el).backgroundColor),r=a>=MIN_ALPHA;alphaCache.set(k,r);return r;}
function frozenView(){
 if(typeof modal==='undefined'||!modal)return false;
 if(g(()=>loading,false)||!g(()=>started,true)||!g(()=>booted,true))return false;
 const el=document.getElementById('modal');if(!el||el.classList.contains('hidden'))return false;
 return veilOpaque(el);}
function skip(){
 if(!prefs.on)return false;
 try{const t=now();
  const r=curRoom();if(r!==roomSeen){roomSeen=r;roomUntil=t+ROOM_MS;}
  const gt=g(()=>time,0),moved=gt!==lastTime;lastTime=gt;
  const sk=g(()=>W,0)+'x'+g(()=>H,0)+'@'+g(()=>dpr,1)+'|'+g(()=>innerWidth,0)+'x'+g(()=>innerHeight,0),resized=sk!==sizeKey;sizeKey=sk;
  if(!frozenView()){settle=SETTLE_N;return false;}
  if(moved){settle=SETTLE_N;stats.timeMoved++;return false;}
  if(resized){stats.resized++;return false;}
  if(t<roomUntil){stats.roomWarm++;return false;}
  if(t<bumpUntil)return false;
  if(settle>0){settle--;stats.settle++;return false;}
  if(t-lastDrawAt>=KEEP_MS){stats.keepalive++;return false;}
  return true;}catch(e){note(e);return false;}}
function bump(){bumpUntil=now()+BUMP_MS;stats.bumps++;}
function install(){
 if(typeof draw==='function'&&draw!==drawFn){const base=draw;drawFn=function(...a){if(depth===0){if(skip()){stats.skipped++;return;}stats.drawn++;lastDrawAt=now();}
  depth++;try{return base.apply(this,a);}finally{depth--;}};draw=drawFn;stats.installs++;}}
install();
try{for(const t of ['input','change','click'])document.addEventListener(t,()=>{try{if(typeof modal!=='undefined'&&modal)bump();}catch(_){}},true);}catch(e){note(e);}
try{for(const t of ['resize','orientationchange'])addEventListener(t,bump);window.visualViewport?.addEventListener?.('resize',bump);}catch(e){note(e);}
if(typeof addEventListener==='function')addEventListener('load',()=>{try{install();}catch(e){note(e);}});
window.__STORYWORLD_STATIC_PAUSE_R1249__=Object.freeze({revision:REV,KEY,SETTLE_N,KEEP_MS,BUMP_MS,ROOM_MS,MIN_ALPHA,
 invalidate(){bump();},paused:()=>g(()=>prefs.on&&frozenView(),false),
 setPrefs(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
