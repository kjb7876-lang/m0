// R362 몹 이름 바꾸기 — 사용자 2026-11-06 "쓰고 이름을바꿔 개와늑대의시간으로".
//  m030(본편 ep1b07 'b07-f2', 그림은 개·늑대 모양 네발 몹)의 게임 안 이름을 '불길 속의 곰' → '개와 늑대의 시간' 으로 바꾼다. 다른 몹·보스는 건드리지 않는다.
//  · 원본 데이터(index.html portable·원작 로스터, 생성 표 mob-unique-r248-data.js·mob-art-variants-r306-data.js·palette-r114-data.js)는 고치지 않고 불러올 때 바꾼다.
//  · 이 파일은 mob-unique-r248-data.js 바로 뒤, mob-unique-r248.js 앞에서 돈다:
//    R248 표 — sheets.m030.name 을 새 이름으로, byName·storyNames 에 새 이름을 더한다(옛 이름 줄도 남김 → 옛 이름이 든 저장도 같은 그림).
//    R248 은 불러올 때 storyNames 로 Set 을 만들고, R290 은 불러올 때 sheets[id].name === ART 이름 으로 맞추므로 둘 다 이 파일 뒤여야 한다.
//  · R306 픽셀 모드 표(이 파일 뒤에 불러옴)는 'STORY|b07-f2|불길 속의 곰' 같은 배우 키에 새 이름 키를 더한다(DOMContentLoaded 때, 옛 키도 남김).
//  · 몹 객체: 엔진 actor3(몹 만들기)를 감싸 만들자마자 이름을 바꾸고, 매 프레임 지금 방 몹(저장에서 되살린 몹 포함)을 한 번 더 본다.
//    '불길 속의 곰 추격대' 같은 뒷말·'중간보스 · ' 앞말은 그대로 두고 그 부분만 바꾼다. 부팅 뒤 지역 로스터(regions[].roster)·actorById 이름도 바꾼다.
//  · 판정·체력·보상·저장 구조는 그대로. 끄기: localStorage['storyworld.r362.rename']='{"on":false}' 뒤 새로고침.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_RENAME_R362__)return;
const REV='R362-rename-1',KEY='storyworld.r362.rename',ID='m030',NATIVE='b07-f2',OLD='불길 속의 곰',NEW='개와 늑대의 시간';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={enemies:0,rows:0,r248:0,r306:0,r114:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const on=()=>prefs.on!==false;
const fix=n=>typeof n==='string'&&n.includes(OLD)?n.split(OLD).join(NEW):n;
function renameObj(o,kind){try{if(!o||typeof o!=='object'||typeof o.name!=='string'||!o.name.includes(OLD))return false;if(o.r362From===undefined)o.r362From=o.name;o.name=fix(o.name);stats[kind]++;
 if(o.profile&&o.profile!==o)renameObj(o.profile,'rows');return true;}catch(e){fail(e);return false;}}
// ---- 표(불러올 때) ----
function patchR248(){const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;if(!D||D.r362)return;try{
 const s=D.sheets?.[ID];if(s&&s.name===OLD){s.nameBefore=OLD;s.name=NEW;stats.r248++;}
 if(D.byName)for(const [k,v] of Object.entries(D.byName))if(k.includes(OLD)&&D.byName[fix(k)]===undefined){D.byName[fix(k)]=v;stats.r248++;}
 if(Array.isArray(D.storyNames)&&D.storyNames.includes(OLD)&&!D.storyNames.includes(NEW)){D.storyNames.push(NEW);stats.r248++;}
 try{Object.defineProperty(D,'r362',{value:true});}catch(_){}}catch(e){fail(e);}}
function patchR306(){const D=window.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__;if(!D||!D.actors||D.r362)return;try{
 for(const [k,v] of Object.entries(D.actors)){const [l,nid,name]=k.split('|');if(nid!==NATIVE||!String(name).includes(OLD))continue;const nk=l+'|'+nid+'|'+fix(name);if(D.actors[nk]===undefined){D.actors[nk]=v;stats.r306++;}}
 try{Object.defineProperty(D,'r362',{value:true});}catch(_){}}catch(e){fail(e);}}
function patchR114(){const D=window.__STORYWORLD_PALETTE_R114_DATA__;if(!D||Object.isFrozen(D))return;try{for(const v of Object.values(D))if(v&&!Object.isFrozen(v)&&v.name===OLD){v.name=NEW;stats.r114++;}}catch(e){fail(e);}}
// ---- 몹·로스터(실행 중) ----
function sweepRoom(){try{if(typeof room==='undefined'||!room)return;for(const e of room.enemies||[])renameObj(e,'enemies');}catch(e){fail(e);}}
let swept=false;
function sweepWorld(){if(swept)return;try{if(typeof booted==='undefined'||!booted)return;swept=true;
 if(typeof regions!=='undefined')for(const r of regions||[])for(const d of r?.roster||[])renameObj(d,'rows');
 if(typeof actorById!=='undefined'&&actorById?.values)for(const d of actorById.values())renameObj(d,'rows');
 if(typeof world==='object'&&world)for(const r of Object.values(world))for(const e of r?.enemies||[])renameObj(e,'enemies');}catch(e){fail(e);}}
function wrapActor(){try{if(typeof actor3!=='function'||actor3.r362)return;const base=actor3;const w=function(...a){const e=base.apply(this,a);if(on())renameObj(e,'enemies');return e;};w.r362=true;actor3=w;}catch(e){fail(e);}}
if(on()){
 patchR248();wrapActor();
 const late=()=>{patchR306();patchR114();};
 if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',late,{once:true});else late();
 const loop=()=>{sweepRoom();sweepWorld();if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);};
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);
}
window.__STORYWORLD_MOB_RENAME_R362__=Object.freeze({revision:REV,id:ID,nativeId:NATIVE,from:OLD,to:NEW,fix,renameObj,sweep(){sweepRoom();swept=false;sweepWorld();},patch(){patchR248();patchR306();patchR114();},
 inspect:()=>({revision:REV,on:on(),stats:{...stats},lastError})});
})();
