// R1179 무한생존·사몽에 남은 R248 임시 픽셀 몹 → 드라이브 손그림 후보 — 사용자 2026-11-18 "사몽에피소드쪽에 픽셀몹 및 픽셀자산 남아있던데
//  디스토피아 미술관이런데 이런것도 닷츠랑협업해서 이미지잘적용해줘", 같은 날 "HOLD 보류 자산도 웬만하면 코드·이미지 처리로 직접 고쳐 적용".
//  · 헤드리스 전수(무한생존 72단계, drawEnemy 뒤 기록기 그리기 명령)로 아직 assets/r248/mobs/ 를 그리는 몹을 찾았다(qa/r1179/r1179-census.mjs).
//    R410 이 본편 227지역만 돌아서 무한생존에 붙은 사몽 장(R1006, 예: S-06 디스토피아 '외계 침공군')의 몹이 빠져 있었다.
//  · 방법은 R290·R410 과 같다: R248 시트 표의 그 줄에 path·body 만 얹는다(칸 256×320, 4×3, 걷기 0-7·공격 8-11, pivot 128,300, 이름이 같을 때만).
//    시트는 scripts/r1179-mob-sheets.py 가 후보 1024×960 시트를 픽셀 그대로 무손실 WebP 로 묶은 것(assets/r1179/mobs/index.json 에 출처·해시).
//  · 원래 임시 시트(assets/r248/mobs/)는 지우지 않는다. 판정·체력·피해·보상·저장은 그대로(그림만).
//  · 이 태그는 R248 시트 표(긴 줄 안 mob-unique-r248-data)보다 앞에 있다(r176 끝 순서 정규식 때문에 뒤에 못 둠) → 표가 아직 없으면
//    DOMContentLoaded(모든 스크립트 실행 뒤, 첫 몹 그리기 전)에 얹는다. R248 은 몹마다 처음 그릴 때 s.path 를 읽는다.
//  · 끄기: localStorage['storyworld.r1179.mobArt']='{"on":false}' 뒤 새로고침.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_ART_R1179__)return;
const REV='R1179-mob-art-1',KEY='storyworld.r1179.mobArt',DIR='assets/r1179/mobs/';
const ART=Object.freeze({
 m077:Object.freeze({file:'m077.webp',body:211,name:"외계 침공군"}),
 m081:Object.freeze({file:'m081.webp',body:221,name:"여섯 물건의 그림자"}),/* Dots CX-0157PX r2(11-18, r1 HOLD 손·밑단·팔 고친 판) */
});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const orig={},applied=[];let lastError=null,late=false;const data=()=>window.__STORYWORLD_MOB_UNIQUE_R248_DATA__||null;
function apply(on){applied.length=0;const D=data();if(!D||!D.sheets)return false;for(const [id,a] of Object.entries(ART)){const s=D.sheets[id];if(!s||s.name!==a.name)continue;/* 이름이 다르면 손대지 않는다 */
 try{if(!orig[id])orig[id]={path:s.path,body:s.body};if(on){s.path=DIR+a.file;s.body=a.body;applied.push(id);}else{if(orig[id].path===undefined)delete s.path;else s.path=orig[id].path;s.body=orig[id].body;}}catch(e){lastError=String(e?.message||e).slice(0,200);}}return true;}
if(!apply(prefs.on!==false)){late=true;const go=()=>{try{apply(prefs.on!==false);}catch(e){lastError=String(e?.message||e).slice(0,200);}};
 try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go,{once:true});else setTimeout(go,0);}catch(e){lastError=String(e?.message||e).slice(0,200);}}
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply(prefs.on!==false);return {...prefs};}
window.__STORYWORLD_MOB_ART_R1179__=Object.freeze({revision:REV,dir:DIR,art:ART,set,paths:()=>Object.values(ART).map(a=>DIR+a.file),inspect:()=>({revision:REV,prefs:{...prefs},applied:[...applied],late,lastError})});
})();
