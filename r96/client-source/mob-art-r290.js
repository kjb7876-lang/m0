// R290 몹 손그림 적용(m001·m003·m004·m005·m014) — 사용자 2026-11-04 승인("dots 생성 후보 → 사용자 승인"). R248 임시 픽셀 시트 대신 드라이브 Storyworld_Assets 의
//  손그림 후보(걷기 8 + 공격 4, 칸 256×320, 4×3 시트)를 쓴다. 원래 임시 시트(assets/r248/mobs/)는 지우지 않고 그대로 둔다.
//  · 시트는 scripts/r290-mob-sheets.py 가 후보 PNG 12장을 픽셀 그대로 무손실 WebP 로 묶은 것(assets/r290/mobs/, index.json 에 원본 해시·드라이브 id).
//  · R248 그리기(칸 고르기·좌우 뒤집기·공격 칸·pivot [128,300]·k=size/body)는 그대로. 이 파일은 R248 시트 표의 그 줄에 path·body 만 얹는다.
//    body 는 새 그림의 걷기 8칸 몸 높이 중앙값 → 화면 키 = R248 때와 같은 size(이웃 몹과 같은 크기 규칙). 새 그림은 발 그림자가 없고 발끝 y≈298 이라 pivot 에 붙는다.
//  · 앞으로 dots 결과가 오면 아래 ART 에 줄만 더한다(시트는 scripts/r290-mob-sheets.py 로 만든다).
//  · 끄기: localStorage['storyworld.r290.mobArt']='{"on":false}' 뒤 새로고침(원래 임시 시트로 돌아감).
(()=>{'use strict';
if(window.__STORYWORLD_MOB_ART_R290__)return;
const REV='R290-mob-art-1',KEY='storyworld.r290.mobArt',DIR='assets/r290/mobs/';
const ART=Object.freeze({
 m001:Object.freeze({file:'m001.webp',body:213,name:'뿌리에 묶인 근위의 기억'}),
 m003:Object.freeze({file:'m003.webp',body:152,name:'진흙등 거미'}),
 m004:Object.freeze({file:'m004.webp',body:211,name:'보라검 추격천사'}),
 m005:Object.freeze({file:'m005.webp',body:136,name:'기억 운반거미'}),
 m014:Object.freeze({file:'m014.webp',body:199,name:'격리실 감염 의료인'}),
});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__,orig={},applied=[];let lastError=null;
function apply(on){applied.length=0;if(!D||!D.sheets)return;for(const [id,a] of Object.entries(ART)){const s=D.sheets[id];if(!s||s.name!==a.name)continue;/* 이름이 다르면 손대지 않는다 */
 try{if(!orig[id])orig[id]={path:s.path,body:s.body};if(on){s.path=DIR+a.file;s.body=a.body;applied.push(id);}else{if(orig[id].path===undefined)delete s.path;else s.path=orig[id].path;s.body=orig[id].body;}}catch(e){lastError=String(e?.message||e).slice(0,200);}}}
apply(prefs.on!==false);
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply(prefs.on!==false);return {...prefs};}
window.__STORYWORLD_MOB_ART_R290__=Object.freeze({revision:REV,dir:DIR,art:ART,set,paths:()=>Object.values(ART).map(a=>DIR+a.file),inspect:()=>({revision:REV,prefs:{...prefs},applied:[...applied],lastError})});
})();
