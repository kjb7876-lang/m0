// R1389 3D 범위(사용자 2026-11-28 06:02Z "발록·루시퍼 같은 챕터별 중요보스, 7대죄 모든 보스, 나머지 중요보스 … 둥근 구체나 네모가 많은 몹들만 3d화,
//  3d퀄 8점이상만 3d, 나머지는 2d로 해서 품질 높이기", "기계나 유령쪽 일부러 기괴하게 만든 건 특색 있어 괜찮다").
//  · R1385 몹별 2D·3D 규칙(__STORYWORLD_MOB_DIM_R1385__) 위에 덧붙인다. 이 표에 있는 종류는 이 표가, 없는 종류는 R1385 가 정한다.
//    표 = scripts/r1389-scope.py --write (근거 r96/qa/r1389/scope-decision.json: 대상 분류 scope.json, 동작 폭 amp.json).
//  · 3D 대상이 아닌 사람·동물형 몹은 2D. 대상도 3D 품질(동작 폭 반영)이 보스 9·일반 몹 7.77(사용자 11-28 09:01Z)을 넘어야 3D.
//  · 맘몬 맵(ep1b06·ep1b06b)과 설정으로 켜고 끄는 보스(발록·루시퍼·베엘제붑·분노의 귀·나태 남자)는 표 밖(R1385·설정 그대로).
//  · 켜고 끄기: storyworld.r1389.scope('on'|'off'), 주소 ?scope89=1·0. 기본 켜짐, 자동 검사(navigator.webdriver)는 기본 꺼짐(기존 CI 장면 불변).
//    R1385 규칙을 끄면(storyworld.r1385.dimrule=off) 이 표도 쓰지 않는다.
//  · 미검증: GPU 실기기·모바일 프레임·실제 플레이 손맛(헤드리스 소프트웨어 렌더만).
(()=>{'use strict';
if(typeof window==='undefined')return;
const base=window.__STORYWORLD_MOB_DIM_R1385__;if(!base||base.revision89)return;
const REV='R1389-scope-1',KEY='storyworld.r1389.scope';
// ==TABLE== (scripts/r1389-scope.py --write 가 다시 쓴다 — 손으로 고치지 말 것)
const TABLE={'r1312:guard':'3d','r1312:stalker':'3d','r1315:knight':'3d','r1316:cable':'3d','r1316:carrier':'3d','r1316:envy':'3d','r1316:glass':'3d','r1316:goat':'3d','r1316:heel':'3d','r1316:mannequin':'3d','r1316:mask':'2d','r1316:mason':'3d','r1316:moth':'3d','r1316:nurse':'3d','r1316:refuse':'3d','r1316:robot':'3d','r1316:scar':'3d','r1316:slime':'3d','r1316:snow':'3d','r1316:trash':'3d','r1316:vial':'3d','r1316:void':'3d','r1317:crystal':'2d','r1317:delicacy':'3d','r1317:extSignal':'3d','r1317:guard':'2d','r1317:herbwife':'2d','r1317:nameless':'3d','r1317:orb':'3d','r1317:rose':'3d','r1317:seal':'3d','r1317:signal':'3d','r1317:twinned':'3d','r1317:warhound':'3d','r1322:armageddon':'2d','r1322:censor':'2d','r1322:clockwork':'2d','r1322:clockworkLeader':'2d','r1322:connector':'3d','r1322:core':'3d','r1322:dogWolf':'3d','r1322:gateFrame':'3d','r1322:manuscript':'3d','r1322:remnantAdoption':'3d','r1322:remnantCctv':'3d','r1322:remnantRooftop':'3d','r1322:reversal':'2d','r1322:slimeCulture':'3d','r1322:slimeMeadow':'3d','r1322:slimeSynapse':'3d','r1322:superEgo':'2d','r1322c:controller':'2d','r1322c:cultivationManager':'3d','r1322c:cyborgChairman':'2d','r1322c:greatGatekeeper05':'2d','r1322c:hotelChairman':'3d','r1322c:judicialCore':'3d','r1322c:seoyun':'3d','r1322c:sirenMor':'2d','r1322c:surgeon':'2d','r1329:addictionCore':'3d','r1329:bloodHound':'3d','r1329:eggkeeper':'3d','r1329:swampMage':'3d','r1329:swampStalker':'3d','r1329:violetAngel':'3d','r1330:backCoin':'3d','r1330:bladeBanknote':'3d','r1330:corpseBodyguard':'3d','r1330:crackedEcho':'3d','r1330:cursedSpear':'3d','r1330:digestiveFluid':'3d','r1330:fireDragon':'3d','r1330:fireWolf':'3d','r1330:flameKnight':'3d','r1330:foxDemon':'3d','r1330:giantStomach':'3d','r1330:kitchenOverseer':'3d','r1330:lamentingWoman':'3d','r1330:ledgerWatcher':'3d','r1330:lipstickBullet':'3d','r1330:mammon':'3d','r1330:occultExperiment':'3d','r1330:serpentShadow':'3d','r1330:slothSentinel':'3d','r1330:stageDirector':'3d','r1343:glassWraith':'3d','r1343:jealousyWraith':'3d','r1343:leviathan':'3d','r1382:lucifer':'3d'};
// ==/TABLE==
const LOCK2D_ZONES=new Set(['last302','last303']);
let on=true;
try{if(navigator.webdriver)on=false;}catch(_){}
try{const v=localStorage.getItem(KEY);if(v==='off')on=false;else if(v==='on')on=true;}catch(_){}
try{const m=/[?&]scope89=([01])\b/.exec(location.search);if(m)on=m[1]==='1';}catch(_){}
const HAS3D=new Set(Object.keys(TABLE).filter(k=>TABLE[k]==='3d').map(k=>k.split(':')[0]));
const zone=()=>{try{return typeof room==='object'&&room?String(room.id||''):'';}catch(_){return '';}};
const story=()=>{try{return typeof room==='object'&&!!room&&(room.layer==='STORY'||room.layer==null)&&!room.samongR103&&!room.survivalR600;}catch(_){return false;}};
function decide(tag,kid){if(!on||!base.on()||!story())return base.decide(tag,kid);if(LOCK2D_ZONES.has(zone()))return '2d';return TABLE[tag+':'+kid]||base.decide(tag,kid);}
function use(tag,kid,b){if(!on||!base.on()||!story())return base.use(tag,kid,b);const d=decide(tag,kid);return d==='3d'?true:d==='2d'?false:!!b;}
function active(tag,b){if(base.active(tag,b))return true;if(!on||!base.on()||!story()||LOCK2D_ZONES.has(zone()))return !!b;return HAS3D.has(tag);}
function set(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;}
window.__STORYWORLD_MOB_DIM_R1385__=Object.freeze(Object.assign({},base,{revision89:REV,use,active,decide,base,set89:set,on89:()=>on,
 table89:()=>({...TABLE}),inspect89:()=>({revision:REV,on,zone:zone(),story:story(),kinds:Object.keys(TABLE).length,three:Object.values(TABLE).filter(v=>v==='3d').length})}));
})();
