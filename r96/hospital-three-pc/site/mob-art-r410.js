// R410 남은 R248 임시 픽셀 몹 40종 → 드라이브 손그림 후보 — 사용자 2026-11-08 "3-5일내구글드라이브자산및 명령보면 픽셀몹다없앴는데 검토적용 꼼꼼히",
//  2026-11-07 "비승인도개선해서 적용 버그없이"(검토·HOLD 후보도 다듬어 넣음). 227개 지역을 헤드리스로 돌며 기본 모드에서 아직 assets/r248/mobs/ 를 그리는 몹을
//  모두 찾았고(42종), 그중 드라이브 후보가 있는 40종을 바꾼다. m010 마지막 길의 호위병은 11/6 지시로 출현을 빼고(R385 표), m012 검은기둥 화염술사는
//  '검은기둥 주문사'로 이름·그림을 바꾼다(R385 표) → 두 시트는 쓰이지 않아 여기 없음.
//  · 방법은 R290 과 같다: R248 시트 표의 그 줄에 path·body 만 얹는다(칸 256×320, 4×3, 걷기 0-7·공격 8-11, pivot 128,300, 이름이 같을 때만).
//  · 시트는 scripts/r410-mob-sheets.py 가 후보 PNG 를 픽셀 그대로 무손실 WebP 로 묶은 것(assets/r410/mobs/index.json 에 원본 파일·해시).
//    이동 4장 후보(m007·m009·m011·m048)는 걷기 칸에 두 번, 512px 후보(m011 가고일 다크줄무늬·m013 다크레드 타락천사)는 ½, m062 384×480 은 ⅔ 로 줄였다.
//    m018 유리 망령은 R386 이 주사실에만 붙였던 채택본(assets/r380/mobs/glass-wraith-v1.webp)을 다른 병원·꿈 지역에도 쓴다.
//  · 원래 임시 시트(assets/r248/mobs/)는 지우지 않는다. 픽셀 모드(R306)는 건드리지 않는다.
//  · 끄기: localStorage['storyworld.r410.mobArt']='{"on":false}' 뒤 새로고침.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_ART_R410__)return;
const REV='R410-mob-art-1',KEY='storyworld.r410.mobArt',DIR='assets/r410/mobs/';
const ART=Object.freeze({
 m007:Object.freeze({file:'m007.webp',body:223,name:"이름 잃은 전우"}),
 m009:Object.freeze({file:'m009.webp',body:232,name:"검은기둥 주문사"}),
 m011:Object.freeze({file:'m011.webp',body:129,name:"지옥문 파수악마"}),
 m013:Object.freeze({file:'m013.webp',body:169,name:"소환진 타락천사"}),
 m015:Object.freeze({file:'m015.webp',body:208,name:"안정화 집행체"}),
 m016:Object.freeze({file:'m016.webp',body:207,name:"소독등 타락천사"}),
 m018:Object.freeze({file:'m018.webp',body:202,name:"유리 망령"}),
 m027:Object.freeze({file:'m027.webp',body:139,name:"고슴도치 가시 사탕"}),
 m028:Object.freeze({file:'m028.webp',body:157,name:"눈보라 속 여우 악마"}),
 m029:Object.freeze({file:'m029.webp',body:102,name:"낡은 장난감 요요"}),
 m033:Object.freeze({file:'m033.webp',body:217,name:"태엽 수집자"}),
 m039:Object.freeze({file:'m039.webp',body:218,name:"입양기억 청람잔영"}),
 m040:Object.freeze({file:'m040.webp',body:208,name:"이동문 청람잔영"}),
 m043:Object.freeze({file:'m043.webp',body:96,name:"장미이슬 슬라임"}),
 m044:Object.freeze({file:'m044.webp',body:216,name:"피리 고블린"}),
 m045:Object.freeze({file:'m045.webp',body:157,name:"귀비탕 공명 안개핵"}),
 m046:Object.freeze({file:'m046.webp',body:159,name:"주민에게서 떨어진 검은 안개"}),
 m047:Object.freeze({file:'m047.webp',body:224,name:"불면귀의 안개 잔영"}),
 m048:Object.freeze({file:'m048.webp',body:256,name:"아르벨리아를 묶은 변조 명령"}),
 m050:Object.freeze({file:'m050.webp',body:225,name:"지워진 CCTV 기록의 잔향"}),
 m054:Object.freeze({file:'m054.webp',body:217,name:"옥상으로 돌아온 기억 잔향"}),
 m056:Object.freeze({file:'m056.webp',body:122,name:"ID 배양 점액체"}),
 m060:Object.freeze({file:'m060.webp',body:154,name:"ID 잔류 점액체"}),
 m062:Object.freeze({file:'m062.webp',body:197,name:"교만의 사이보그 교주"}),
 m063:Object.freeze({file:'m063.webp',body:215,name:"뿌리에서 쏟아진 잔영"}),
 m069:Object.freeze({file:'m069.webp',body:223,name:"다시 일으켜 세워진 도전자"}),
 m070:Object.freeze({file:'m070.webp',body:197,name:"검은 고리"}),
 m071:Object.freeze({file:'m071.webp',body:181,name:"불면병동 무안 환자"}),
 m072:Object.freeze({file:'m072.webp',body:267,name:"규칙을 어기지 않는 마네킹"}),
 m075:Object.freeze({file:'m075.webp',body:216,name:"찢긴 호외의 잔향"}),
 m078:Object.freeze({file:'m078.webp',body:153,name:"폭격기억 사이보그 사냥개"}),
 m080:Object.freeze({file:'m080.webp',body:169,name:"검은 명령선"}),
 m084:Object.freeze({file:'m084.webp',body:99,name:"붉은 교정 표시"}),
 m091:Object.freeze({file:'m091.webp',body:190,name:"서로의 결말을 먹는 도시"}),
 m092:Object.freeze({file:'m092.webp',body:191,name:"다음 자리를 노리는 사격"}),
 m094:Object.freeze({file:'m094.webp',body:203,name:"스토리텔러"}),
 m096:Object.freeze({file:'m096.webp',body:204,name:"막힌 이름들"}),
 m098:Object.freeze({file:'m098.webp',body:212,name:"성벽과 시곗바늘의 잔해"}),
 m099:Object.freeze({file:'m099.webp',body:218,name:"거짓천국 근위천사"}),
 m100:Object.freeze({file:'m100.webp',body:241,name:"미카엘라"}),
});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__,orig={},applied=[];let lastError=null;
function apply(on){applied.length=0;if(!D||!D.sheets)return;for(const [id,a] of Object.entries(ART)){const s=D.sheets[id];if(!s||s.name!==a.name)continue;/* 이름이 다르면 손대지 않는다 */
 try{if(!orig[id])orig[id]={path:s.path,body:s.body};if(on){s.path=DIR+a.file;s.body=a.body;applied.push(id);}else{if(orig[id].path===undefined)delete s.path;else s.path=orig[id].path;s.body=orig[id].body;}}catch(e){lastError=String(e?.message||e).slice(0,200);}}}
apply(prefs.on!==false);
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply(prefs.on!==false);return {...prefs};}
window.__STORYWORLD_MOB_ART_R410__=Object.freeze({revision:REV,dir:DIR,art:ART,set,paths:()=>Object.values(ART).map(a=>DIR+a.file),inspect:()=>({revision:REV,prefs:{...prefs},applied:[...applied],lastError})});
})();
