// R1385 몹별 2D·3D 선택 규칙(사용자 2026-11-27 23:49Z "규칙만들어서 3d가 나은건 3d 2d가나은건 2d로 일관성과 모션 미관에 중점을두서 몹분리").
//  · 규칙: docs/mob-2d3d-rule-r1385.md — 몹마다 2D·3D 를 일관성 .40·모션 .35·미관 .25 로 매기고 차 ±0.8 로 고른다(비슷하면 지역 다수, 사용자 몹 단위 결정은 잠금).
//    원화와 다른 몹처럼 보이는 3D(원화 닮음 6 미만)는 점수와 상관없이 2D. 판정 근거 = r96/qa/r1385/decision.json(scripts/r1385-decide.py 가 이 표를 쓴다).
//  · 쓰는 곳: 3D 몹 오버레이 11개(R1312·R1315·R1316·R1317·R1322·R1322c·R1329·R1330·R1338·R1343·R1382)가
//    active() 에서 active(tag,원래값), 몹마다 그릴 종류를 고를 때 use(tag,종류,원래값) 을 묻는다. 표에 없는 종류는 원래값(설정·R1326 지역 규칙) 그대로.
//  · 잠금: 불면귀 마을(last302·last303)은 늘 2D(사용자 11-26). 이야기 층 밖(사몽·무한생존)은 원래값.
//    발록 v4·루시퍼·탐식 악마처럼 사용자가 '설정으로 켜고 끄기'로 정한 것은 표에 넣지 않는다.
//  · 켜고 끄기: storyworld.r1385.dimrule('on'|'off'), 주소 ?dim85=1·0. 기본 켜짐, 자동 검사(navigator.webdriver)는 기본 꺼짐(기존 CI 장면 불변).
//  · 미검증: GPU 실기기·모바일 프레임·실제 플레이 손맛(헤드리스 소프트웨어 렌더만).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB_DIM_R1385__)return;
const REV='R1385-dimrule-1',KEY='storyworld.r1385.dimrule';
// ==TABLE== (scripts/r1385-decide.py 가 decision.json 으로 다시 쓴다 — 손으로 고치지 말 것)
const TABLE={'r1317:rose':'3d','r1316:slime':'3d','r1316:cable':'3d','r1322:slimeSynapse':'2d','r1322:superEgo':'2d','r1322:armageddon':'2d','r1322:slimeCulture':'2d','r1317:crystal':'2d','r1322c:cultivationManager':'3d','r1322c:judicialCore':'2d','r1312:guard':'2d','r1312:stalker':'3d','r1316:moth':'3d','r1329:eggkeeper':'3d','r1329:violetAngel':'3d','r1316:goat':'3d','r1329:swampMage':'3d','r1329:bloodHound':'3d','r1317:twinned':'3d','r1316:nurse':'3d','r1316:vial':'3d','r1316:carrier':'2d','r1329:addictionCore':'3d','r1317:guard':'2d','r1316:mask':'2d','r1317:seal':'3d','r1317:extSignal':'3d','r1317:nameless':'3d','r1316:refuse':'3d','r1316:trash':'3d','r1330:slothSentinel':'3d','r1343:jealousyWraith':'3d','r1316:envy':'3d','r1330:serpentShadow':'2d','r1330:lamentingWoman':'2d','r1330:crackedEcho':'2d','r1343:leviathan':'3d','r1317:delicacy':'3d','r1330:giantStomach':'2d','r1330:digestiveFluid':'2d','r1330:kitchenOverseer':'2d','r1316:mannequin':'3d','r1316:heel':'3d','r1330:lipstickBullet':'2d','r1330:stageDirector':'3d','r1322c:seoyun':'3d','r1330:bladeBanknote':'2d','r1330:foxDemon':'2d','r1330:backCoin':'2d','r1330:ledgerWatcher':'3d','r1330:mammon':'3d','r1330:fireWolf':'2d','r1330:fireDragon':'3d','r1322:dogWolf':'3d','r1330:flameKnight':'3d','r1315:knight':'2d','r1330:cursedSpear':'2d','r1330:occultExperiment':'2d','r1330:corpseBodyguard':'2d','r1322c:hotelChairman':'3d','r1316:robot':'3d','r1316:snow':'3d','r1322c:cyborgChairman':'3d','r1316:mason':'2d','r1316:scar':'3d','r1322c:sirenMor':'3d','r1322c:greatGatekeeper05':'3d','r1317:herbwife':'2d','r1322:slimeMeadow':'2d','r1317:signal':'2d','r1322:remnantCctv':'2d','r1322:remnantRooftop':'2d','r1322:manuscript':'2d','r1317:warhound':'2d','r1316:void':'3d','r1322:gateFrame':'3d','r1322c:controller':'3d','r1322:connector':'3d','r1322:remnantAdoption':'2d','r1322:core':'3d','r1329:swampStalker':'3d','r1322:clockwork':'2d','r1322:clockworkLeader':'2d','r1322:reversal':'2d','r1322:censor':'2d','r1322c:surgeon':'2d','r1317:orb':'3d','r1343:glassWraith':'3d','r1316:glass':'3d'};
// ==/TABLE==
const LOCK2D_ZONES=new Set(['last302','last303']);
let rule=true;
try{if(navigator.webdriver)rule=false;}catch(_){}
try{const v=localStorage.getItem(KEY);if(v==='off')rule=false;else if(v==='on')rule=true;}catch(_){}
try{const m=/[?&]dim85=([01])\b/.exec(location.search);if(m)rule=m[1]==='1';}catch(_){}
const HAS3D=new Set(Object.keys(TABLE).filter(k=>TABLE[k]==='3d').map(k=>k.split(':')[0]));
const zone=()=>{try{return typeof room==='object'&&room?String(room.id||''):'';}catch(_){return '';}};
const story=()=>{try{return typeof room==='object'&&!!room&&(room.layer==='STORY'||room.layer==null)&&!room.samongR103&&!room.survivalR600;}catch(_){return false;}};
function decide(tag,kid){if(!rule||!story())return null;if(LOCK2D_ZONES.has(zone()))return '2d';return TABLE[tag+':'+kid]||null;}
function use(tag,kid,base){const d=decide(tag,kid);return d==='3d'?true:d==='2d'?false:!!base;}
function active(tag,base){if(base)return true;if(!rule||!story()||LOCK2D_ZONES.has(zone()))return !!base;return HAS3D.has(tag);}
function set(v){rule=!!v;try{localStorage.setItem(KEY,rule?'on':'off');}catch(_){}return rule;}
window.__STORYWORLD_MOB_DIM_R1385__=Object.freeze({revision:REV,use,active,decide,set,on:()=>rule,table:()=>({...TABLE}),
 inspect:()=>({revision:REV,rule,zone:zone(),story:story(),kinds:Object.keys(TABLE).length,three:Object.values(TABLE).filter(v=>v==='3d').length})});
})();
