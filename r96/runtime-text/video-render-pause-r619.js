// R619 — 전체 화면 서사 영상이 열려 있는 동안 게임 화면 그리기(draw)와 HUD 갱신을 쉰다.
// 사용자 2026-11-10: "결전의 날 시네마틱영상 나올때 렉이 너무심함"
//  · 원인(헤드리스 측정, 1280×720 ep1a09b): 영상 모듈들은 게임 tick 만 멈추고, frame() 은 영상 뒤에서 매 프레임 draw()(3D 장면·조형물·
//    이펙트 덧그림)와 updateHUD() 를 계속 돌렸다. R368 재생 중 3.5fps(p95 317ms) → draw 를 쉬면 57fps(p95 17ms).
//  · 영상 루트(r309v 오프닝·r368v 결전의 날·r369v 중독의 도시·r372v 뿌리의 문지기·r617v 환도의 기억)가 문서에 있으면 draw·updateHUD 를 건너뛴다.
//    영상이 화면을 덮고 있으니 보이는 것은 같다. 닫히면 바로 다시 그린다(닫힐 때의 검은 막 0.46초 동안도 쉼).
//  · tick·musicTick 은 건드리지 않는다(게임 멈춤은 각 영상 모듈이, BGM 줄임은 bgm-map-r308 이 맡는다).
//  · 다른 스크립트가 나중에 draw 를 감싸도 가장 바깥에서 건너뛰도록 load 뒤에 한 번 더 감싼다.
//  · 안전장치: 같은 영상 루트가 60초 넘게 남아 있으면 다시 그린다. 확인 중 오류가 나면 그린다.
//  · 끄기: localStorage storyworld.r619.videopause {on:false}.
(()=>{'use strict';
if(window.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__)return;
const REV='R619-video-render-pause-1',KEY='storyworld.r619.videopause',IDS=Object.freeze(['r309v','r368v','r369v','r372v','r617v']),MAX_MS=60000;
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={skipped:0,hudSkipped:0,installs:0,expired:0,errors:0};let cur=null,since=0,lastError=null,drawFn=null,hudFn=null;
const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
function covering(){for(const id of IDS){const el=document.getElementById(id);if(el&&el.isConnected!==false)return id;}return null;}
function paused(){if(!prefs.on)return false;try{const id=covering();if(!id){cur=null;return false;}const t=now();if(id!==cur){cur=id;since=t;}
 if(t-since>MAX_MS){stats.expired++;return false;}return true;}catch(e){stats.errors++;lastError=String(e?.message||e).slice(0,200);return false;}}
function install(){
 if(typeof draw==='function'&&draw!==drawFn){const base=draw;drawFn=function(...a){if(paused()){stats.skipped++;return;}return base.apply(this,a);};draw=drawFn;stats.installs++;}
 if(typeof updateHUD==='function'&&updateHUD!==hudFn){const base=updateHUD;hudFn=function(...a){if(paused()){stats.hudSkipped++;return;}return base.apply(this,a);};updateHUD=hudFn;}}
install();
if(typeof addEventListener==='function')addEventListener('load',()=>{try{install();}catch(e){stats.errors++;lastError=String(e?.message||e).slice(0,200);}});
window.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__=Object.freeze({revision:REV,KEY,IDS,MAX_MS,paused:()=>paused(),
 setPrefs(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}},
 inspect:()=>({revision:REV,prefs:{...prefs},covering:cur,stats:{...stats},lastError})});
})();
