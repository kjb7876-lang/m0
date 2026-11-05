// R363 레거시 몹 다시 그림 적용 — 사용자 2026-11-06 "레거시도써봐". Dots 가 옛 r92 몹 그림(구형 105~137 묶음)을 다시 그린 후보 가운데
//  지금 게임 몹과 확정 대응된 줄만 쓴다(대응표·근거: r96/qa/r363/legacy-mapping.json). 후보는 조건부·최종 아님.
//  · R248 임시 시트 몹(공실 표기 잔재 m052)은 R290 ART 표 줄로 바꾼다(mob-art-r290.js). 이 파일은 R248 시트가 없던 '원래 그림' 몹을
//    R248 시트 그리기(칸 고르기·좌우 뒤집기·공격 칸·pivot [128,300]·k=size/body)에 새로 붙인다.
//  · 열쇠는 nativeId + 이름(본편만). 같은 이름이라도 다른 원본 그림을 쓰는 몹(예: 시간수문장 37·38·40…)은 그대로 둔다.
//    R248 sheetOf 가 e.r248Key 를 먼저 보므로, 맞는 몹에만 e.r248Key='r363|nativeId|이름' 을 달고 그 열쇠·시트를 R248 표에 더한다.
//  · 시트: scripts/r363-legacy-mob-sheets.py → assets/r363/mobs/(index.json 에 묶음 이름·sha256·걷기 출처). 원래 그림은 지우지 않는다.
//  · 끄기: localStorage['storyworld.r363.legacyMobs']='{"on":false}' 뒤 새로고침(원래 그림으로 돌아감).
(()=>{'use strict';
if(window.__STORYWORLD_MOB_LEGACY_R363__)return;
const REV='R363-legacy-1',KEY='storyworld.r363.legacyMobs',DIR='assets/r363/mobs/';
const ROWS=Object.freeze({
 L128:Object.freeze({file:'L128.webp',body:261,name:'흑장미 눈가린 신도',nativeId:'c101-e1',kind:'human',weapon:'claws',legacy:'M128'}),
 L102:Object.freeze({file:'L102.webp',body:164,name:'시간수문장',nativeId:'kair-guardian-39',kind:'golem',weapon:'none',legacy:'M102'}),
});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__,U=()=>window.__STORYWORLD_MOB_UNIQUE_R248__;
const stats={tagged:0,errors:0};let lastError=null;const applied=[];
const keyOf=r=>'r363|'+r.nativeId+'|'+r.name;
const BY=new Map(Object.entries(ROWS).map(([id,r])=>[r.nativeId+'|'+r.name,id]));
function apply(on){applied.length=0;if(!D||!D.sheets||!D.byName)return;for(const [id,r] of Object.entries(ROWS)){try{
 if(on){D.sheets[id]={file:r.file,path:DIR+r.file,body:r.body,kind:r.kind,weapon:r.weapon,name:r.name,legacy:r.legacy};D.byName[keyOf(r)]=id;applied.push(id);}
 else{delete D.byName[keyOf(r)];delete D.sheets[id];}}catch(e){stats.errors++;lastError=String(e?.message||e).slice(0,200);}}}
apply(prefs.on!==false);
const base=n=>{try{const f=U()?.baseName;if(f)return f(n);}catch(_){}return String(n||'').trim();};
const dream=e=>!!(e?.samongR103||(typeof layer!=='undefined'&&layer==='DREAM'));
function tag(e){if(!e||e.r363Seen===e.name||!prefs.on)return;e.r363Seen=e.name;if(dream(e)||e.r248Key)return;
 const id=BY.get(String(e.nativeId||'')+'|'+base(e.name));if(!id)return;e.r248Key=keyOf(ROWS[id]);stats.tagged++;}
function tagAll(){try{if(typeof room==='object'&&room)for(const e of room.enemies||[])tag(e);}catch(e){stats.errors++;lastError=String(e?.message||e).slice(0,200);}}
if(typeof drawEnemy==='function'){const b=drawEnemy;drawEnemy=function(e,...a){try{tag(e);}catch(_){}return b.apply(this,[e,...a]);};}
if(typeof tick==='function'){const b=tick;tick=function(...a){tagAll();return b.apply(this,a);};}
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply(prefs.on!==false);return {...prefs};}
window.__STORYWORLD_MOB_LEGACY_R363__=Object.freeze({revision:REV,dir:DIR,rows:ROWS,set,keyOf,paths:()=>Object.values(ROWS).map(r=>DIR+r.file),inspect:()=>({revision:REV,prefs:{...prefs},applied:[...applied],stats:{...stats},lastError})});
})();
