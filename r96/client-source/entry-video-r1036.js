// R1036 — 입장 영상이 나오는 동안 맵을 같이 준비한다.
// 사용자 2026-11-14 13:43Z: "시네마틱영상나오는시간에도 맵을 렌더링해서 첫입장시 렉적게 맵을 렌더링하고 영상나오는게 아니라 영상나올때도 같이 하는식으로해서 시간을 버는 거지"
//  · 예전: 지역에 처음 들어가면 그림 읽기(로딩 화면) → 입장 서사창 → 닫힌 뒤 0.7초 → 입장 영상(R617 해안 last302 · R369 중독의 도시 ep1a10).
//    영상이 덮는 동안 R619 가 draw 를 모두 쉬어 새 맵은 영상이 닫힌 뒤 첫 draw 에서 한꺼번에 만들어졌다(헤드리스 실측 첫 draw 429ms).
//  · 지금: 그 지역 입장 영상이 아직 남아 있으면, 로딩을 시작하는 그 순간 영상을 먼저 튼다. 그림 읽기는 영상 뒤에서 같이 하고,
//    다 실리면 R619 가 영상 뒤에서 맵을 몇 번(최대 3번, 0.3초 간격) 미리 그려 둔다. 영상이 로딩보다 먼저 끝나면 로딩 화면이 그대로 기다린다.
//    입장 서사창은 영상이 닫히고 로딩이 끝난 뒤 연다(영상 뒤에서 글·낭독이 흘러가지 않게). 서사 문장·영상·자막은 그대로, 순서만 영상 → 입장 글.
//  · 세 모드 공통 진입(enterRegion) 한 곳에서만. 판정·세이브·진행은 그대로(엔진 enterRegion 이 그대로 읽고 저장한다).
//  · 하지 않는 때: 이미 봄·영상 모듈 꺼짐·사몽(DREAM)·협동·자동 검사(webdriver, ?vid617=1 은 R617 과 같게 허용)·영화 모드 낭독(R370)·이미 로딩 중·다른 영상이 열림.
//    그때는 예전 흐름 그대로(영상 모듈이 서사창 뒤에 튼다).
//  · 끄기: localStorage['storyworld.r1036.entryvideo']='{"on":false}'. 점검: window.__STORYWORLD_ENTRY_VIDEO_R1036__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_ENTRY_VIDEO_R1036__)return;
const REV='R1036-entry-video-1',KEY='storyworld.r1036.entryvideo',ROOTS=Object.freeze(['r309v','r317Cinema','r368v','r369v','r372v','r617v','r568']);
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={early:0,stories:0,closedOnFail:0,dropped:0,errors:0};let lastError=null,wait=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
// [지역, 영상 모듈, 아직 볼 차례인가, 열려 있나, early 로 틀기, 건너뛰기, webdriver 에서 허용하는 주소 표시]
const TABLE=Object.freeze([
 {zone:'last302',mod:()=>window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__,due:i=>i.prefs?.on!==false&&!(i.prefs?.seen||[]).includes('beach'),open:i=>!!i.open,
  start:m=>m.play('beach',{early:true}),webdriverOk:/[?&]vid617=1\b/},
 {zone:'ep1a10',mod:()=>window.__STORYWORLD_POISON_CITY_VIDEO_R369__,due:i=>i.prefs?.on!==false&&!i.prefs?.seen,open:i=>!!i.open,
  start:m=>m.play({early:true}),webdriverOk:null}]);
const here=()=>typeof room!=='undefined'?room:null;
const solo=()=>{try{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';}catch(_){return true;}};
const cinemaVoice=()=>{try{return !!window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on;}catch(_){return false;}};
const anyVideo=()=>{try{return ROOTS.some(id=>!!document.getElementById(id))||!!window.__STORYWORLD_BOSS_CINEMATIC_R568__?.inspect?.()?.active;}catch(_){return false;}};
const automated=row=>{try{if(!navigator.webdriver)return false;return !(row.webdriverOk&&row.webdriverOk.test(location.search||''));}catch(_){return false;}};
const busyLoading=()=>{try{return typeof loading!=='undefined'&&!!loading;}catch(_){return false;}};
const insp=row=>{try{return row.mod()?.inspect?.()||null;}catch(_){return null;}};
function want(id,opt){if(!prefs.on)return null;const row=TABLE.find(r=>r.zone===id);if(!row)return null;
 const L=(opt&&opt.layer)||(typeof layer!=='undefined'?layer:'STORY');if(L!=='STORY')return null;
 try{if(typeof regionById==='undefined'||!regionById?.[id])return null;if(typeof chapterOpen==='function'&&!(opt&&opt.restore)&&!chapterOpen(regionById[id],L))return null;}catch(_){return null;}
 if(busyLoading()||!solo()||cinemaVoice()||automated(row)||anyVideo())return null;const i=insp(row);if(!i||!row.due(i)||row.open(i))return null;return row;}
// 영상이 닫히고 로딩이 끝나면 입장 서사창을 연다(엔진이 noStory 로 건너뛴 그 한 번)
function poll(){if(!wait)return;try{const r=here(),i=insp(wait.row);if(busyLoading())return;
 if(!wait.loaded)return;if(!r||r.id!==wait.zone){wait=null;stats.dropped++;return;}if(i&&wait.row.open(i))return;
 const def=regionById?.[wait.zone];wait=null;if(def&&typeof enterNarrative==='function'){stats.stories++;enterNarrative(def);}}catch(e){wait=null;fail(e);}}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(id,from,options,...rest){let row=null,opt=options;
 try{row=want(id,options);if(row){const m=row.mod();if(m&&row.start(m)){stats.early++;wait=options&&options.noStory?null:{row,zone:id,loaded:false};opt={...(options||{}),noStory:true};}else row=null;}}catch(e){fail(e);row=null;opt=options;}
 const out=base.call(this,id,from,opt,...rest);
 if(row){Promise.resolve(out).then(ok=>{if(ok){if(wait&&wait.zone===id)wait.loaded=true;poll();return;}
   // 진입 실패(그림 못 읽음 등): 영상을 닫고 서사는 열지 않는다(엔진 오류 창이 그대로 보이게)
   stats.closedOnFail++;if(wait&&wait.zone===id)wait=null;try{const m=row.mod(),i=insp(row);if(i&&row.open(i))m.skip?.();}catch(e){fail(e);}},e=>{fail(e);wait=null;});}
 return out;};}
if(typeof setInterval==='function')setInterval(()=>{try{poll();}catch(e){fail(e);}},150);
function set(p){if(p&&typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_ENTRY_VIDEO_R1036__=Object.freeze({revision:REV,KEY,TABLE,set,poll,
 inspect:()=>({revision:REV,prefs:{...prefs},waiting:wait?{zone:wait.zone,loaded:wait.loaded}:null,stats:{...stats},lastError})});
})();
