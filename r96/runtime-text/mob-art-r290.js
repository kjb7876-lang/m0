// R290 몹 손그림 적용(m001·m003·m004·m005·m014) — 사용자 2026-11-04 승인("dots 생성 후보 → 사용자 승인"). R248 임시 픽셀 시트 대신 드라이브 Storyworld_Assets 의
//  손그림 후보(걷기 8 + 공격 4, 칸 256×320, 4×3 시트)를 쓴다. 원래 임시 시트(assets/r248/mobs/)는 지우지 않고 그대로 둔다.
//  · 시트는 scripts/r290-mob-sheets.py 가 후보 PNG 12장을 픽셀 그대로 무손실 WebP 로 묶은 것(assets/r290/mobs/, index.json 에 원본 해시·드라이브 id).
//  · R248 그리기(칸 고르기·좌우 뒤집기·공격 칸·pivot [128,300]·k=size/body)는 그대로. 이 파일은 R248 시트 표의 그 줄에 path·body 만 얹는다.
//    body 는 새 그림의 걷기 8칸 몸 높이 중앙값 → 화면 키 = R248 때와 같은 size(이웃 몹과 같은 크기 규칙). 새 그림은 발 그림자가 없고 발끝 y≈298 이라 pivot 에 붙는다.
//  · 앞으로 dots 결과가 오면 아래 ART 에 줄만 더한다(시트는 scripts/r290-mob-sheets.py 로 만든다).
//  · R359: 같은 방식으로 20종을 더했다(m025·m026·m051·m053·m055·m057~m059·m061·m064·m066·m073·m074·m076·m082·m085·m087·m088·m090·m095).
//    발 없는 부유형은 후보가 칸 가운데에 그려져 있어 scripts/r359-mob-sheets.py 가 12칸을 같은 값만큼 아래로 옮겨 걷기 발끝을 y≈296(그림자 바로 위)에 둔다(index.json shiftY).
//  · 끄기: localStorage['storyworld.r290.mobArt']='{"on":false}' 뒤 새로고침(원래 임시 시트로 돌아감).
(()=>{'use strict';
if(window.__STORYWORLD_MOB_ART_R290__)return;
const REV='R290-mob-art-2',KEY='storyworld.r290.mobArt',DIR='assets/r290/mobs/';
const ART=Object.freeze({
 m001:Object.freeze({file:'m001.webp',body:213,name:'뿌리에 묶인 근위의 기억'}),
 m003:Object.freeze({file:'m003.webp',body:152,name:'진흙등 거미'}),
 m004:Object.freeze({file:'m004.webp',body:211,name:'보라검 추격천사'}),
 m005:Object.freeze({file:'m005.webp',body:136,name:'기억 운반거미'}),
 m014:Object.freeze({file:'m014.webp',body:199,name:'격리실 감염 의료인'}),
 // R359(사용자 2026-11-05 적용 지시, Dots 'Claude 검토용' 인계 후보 20종 — 조건부·최종 아님, 시트는 scripts/r359-mob-sheets.py):
 m025:Object.freeze({file:'m025.webp',body:141,name:'끓어오르는 검은 소화액'}),
 m026:Object.freeze({file:'m026.webp',body:113,name:'모든 면이 뒷면인 동전'}),
 m051:Object.freeze({file:'m051.webp',body:211,name:'새빛호텔 화재 기록의 잔향'}),
 m053:Object.freeze({file:'m053.webp',body:104,name:'제출되지 못한 문장'}),
 m055:Object.freeze({file:'m055.webp',body:190,name:'반복된 추락의 인과 잔향'}),
 m057:Object.freeze({file:'m057.webp',body:159,name:'본능 추출 결정'}),
 m058:Object.freeze({file:'m058.webp',body:131,name:'죄책감 압축결정'}),
 m059:Object.freeze({file:'m059.webp',body:129,name:'SUPER EGO 절개결정'}),
 m061:Object.freeze({file:'m061.webp',body:142,name:'아마겟돈 계산결정'}),
 m064:Object.freeze({file:'m064.webp',body:201,name:'코어 아래의 검은 뿌리'}),
 m066:Object.freeze({file:'m066.webp',body:197,name:'부정의 잔영'}),
 m073:Object.freeze({file:'m073.webp',body:257,name:'강재헌'}),
 m074:Object.freeze({file:'m074.webp',body:219,name:'호외 신문의 밀고자 잔영'}),
 m076:Object.freeze({file:'m076.webp',body:122,name:'교주의 인장'}),
 m082:Object.freeze({file:'m082.webp',body:206,name:'백은 없는 그림자'}),
 m085:Object.freeze({file:'m085.webp',body:239,name:'정해진 시각에 도착하지 못한 발자국'}),
 m087:Object.freeze({file:'m087.webp',body:207,name:'관람석의 시선'}),
 m088:Object.freeze({file:'m088.webp',body:191,name:'찢어진 사진의 망령'}),
 m090:Object.freeze({file:'m090.webp',body:94,name:'종이 왕'}),
 m095:Object.freeze({file:'m095.webp',body:198,name:'일곱 나팔의 빈 소매 잔영'}),
});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__,orig={},applied=[];let lastError=null;
function apply(on){applied.length=0;if(!D||!D.sheets)return;for(const [id,a] of Object.entries(ART)){const s=D.sheets[id];if(!s||s.name!==a.name)continue;/* 이름이 다르면 손대지 않는다 */
 try{if(!orig[id])orig[id]={path:s.path,body:s.body};if(on){s.path=DIR+a.file;s.body=a.body;applied.push(id);}else{if(orig[id].path===undefined)delete s.path;else s.path=orig[id].path;s.body=orig[id].body;}}catch(e){lastError=String(e?.message||e).slice(0,200);}}}
apply(prefs.on!==false);
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply(prefs.on!==false);return {...prefs};}
window.__STORYWORLD_MOB_ART_R290__=Object.freeze({revision:REV,dir:DIR,art:ART,set,paths:()=>Object.values(ART).map(a=>DIR+a.file),inspect:()=>({revision:REV,prefs:{...prefs},applied:[...applied],lastError})});
})();
