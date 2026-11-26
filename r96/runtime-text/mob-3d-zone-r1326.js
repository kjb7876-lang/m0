// R1326 지역별 3D 통일(사용자 2026-11-26 "일단 7대죄는 다 3d로해줘 불면귀쪽은 다 2d로 하고").
//  · 7대죄 지역(ep1b02 나태의 집·03 금이 간 안경(질투)·04 탐식의 주방·05 붉은 하이힐(색욕)·06 맘몬의 금고(탐욕)·07 불을 지른 남자(분노)·08 하늘에 서려는 자(교만)):
//    3D 몹 설정(R1315·R1316·R1317·R1322·R1322c)이 꺼져 있어도 3D 로 그린다. 3D 모델이 없는 몹·보스는 2D 그대로(Dots 재요청 목록).
//  · 불면귀 마을(last302 잠들지 못하는 마을·last303 불면귀): 설정이 켜져 있어도 늘 2D(앞서 "이미 만든 3D 는 나와도 됨"을 이 지시가 대체).
//  · 그 밖 지역은 각 3D 설정 그대로(기본 꺼짐). 첫 맵 R1312 는 이 두 묶음 밖이라 건드리지 않는다.
//  · 각 3D 오버레이의 active() 가 pick(on) 을 묻는다: true/false 로 덮어쓰거나 그대로 on.
//  · 이 규칙 끄기: storyworld.r1326.zone3d='off', 주소 ?zone3d26=0(1 로 다시 켬). 기본 켜짐.
//  · 미검증: GPU 실기기·모바일 프레임(7대죄 지역 3D 동시 표시 부하)·실제 플레이.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_ZONE_R1326__)return;
const REV='R1326-zone3d-1',KEY='storyworld.r1326.zone3d';
const SIN3D=new Set(['ep1b02','ep1b03','ep1b04','ep1b05','ep1b06','ep1b07','ep1b08']);
const NO3D=new Set(['last302','last303']);
// R1341(사용자 2026-11-26 "이맵에 나오는 검을든천사몹은 2d로 다시 일관성있게"): ep1a11 천사의 가면과 의목사 후보생도 늘 2D(근위천사·보스 모두, R1337 2D 일관성 표가 손질).
const NO3D_R1341=new Set(['ep1a11']);
let rule=true;
try{if(localStorage.getItem(KEY)==='off')rule=false;}catch(_){}
try{const m=/[?&]zone3d26=([01])\b/.exec(location.search);if(m)rule=m[1]==='1';}catch(_){}
const zone=()=>{try{return typeof room==='object'&&room?String(room.id||''):'';}catch(_){return '';}};
const story=()=>{try{return typeof room==='object'&&!!room&&(room.layer==='STORY'||room.layer==null)&&!room.samongR103&&!room.survivalR600;}catch(_){return false;}};
function pick(on){if(!rule)return on;const z=zone();if(NO3D.has(z)||NO3D_R1341.has(z))return false;if(SIN3D.has(z)&&story())return true;return on;}
function set(v){rule=!!v;try{localStorage.setItem(KEY,rule?'on':'off');}catch(_){}return rule;}
window.__STORYWORLD_MOB3D_ZONE_R1326__=Object.freeze({revision:REV,pick,set,rule:()=>rule,sin:z=>SIN3D.has(z),no3d:z=>NO3D.has(z)||NO3D_R1341.has(z),inspect:()=>({revision:REV,rule,zone:zone(),forced:rule?(NO3D.has(zone())||NO3D_R1341.has(zone())?'2d':SIN3D.has(zone())&&story()?'3d':null):null})});
})();
