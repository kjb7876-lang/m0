// R1396 3D 몹·보스 설정 하나로 합치기(사용자 2026-11-28 12:42Z "3d키면 내가 지정한 3d몹들만 3d로 적용되고 기본은 다 2d로 나오게,
//  즉 3d키고 끄는거 설정에서 하나의 키로만 조절하게 합치고 병합하고 삭제할거 삭제해").
//  · 키 하나: storyworld.r1396.mob3d('on'|'off'), 주소 ?mob3d96=1·0(주소가 키보다 우선). 기본 꺼짐 → 모든 몹·보스 2D.
//  · 켜면: 사용자가 지정한 3D 몹(R1389 표 = 사용자 목록 1~7부 + 문턱 규칙, scripts/r1389-scope.py)만 3D, 표 밖은 2D.
//    설정 보스: 베엘제붑(탐식)·분노의 귀·나태 남자는 7대죄 사용자 목록이라 3D, 발록 v4 는 예전 설정(기본 2D·켜면 v4 3D)을 이어받아 3D(R1396b).
//    2D 지역 4곳(시스템의 거부권 u204·관리자의 권한 u205·잠들지 못하는 마을 last302·한약과 불면귀 last303)과 이야기 층 밖(사몽·무한생존)은 늘 2D.
//  · 합친 설정(설정 화면에서 숨김, 이 키가 대신 정함): 3D 첫 맵 몹·새 보스·일반 몹 21/9종·몹 29종·보스 10종·늪 몹·7대죄 20종·발록 v4·
//    금이 간 안경·HF 보스·고품질 3D 몹(R1339, 늘 켬)·2D 풍 손질(R1325 기본값)·3D 얼굴 이목구비(R1331 기본값). R1326 지역 강제·R1385/R1389 개별 끄기도 이 키를 따른다.
//  · 영웅 3D(R1327·R1374d·R1302)는 건드리지 않는다.
//  · 구현: 3D 몹 오버레이 11개가 묻는 __STORYWORLD_MOB_DIM_R1385__ use/active 와 R1326 pick 을 감싼다(오버레이는 부를 때마다 전역을 다시 읽음 → 바로 전환).
//  · 자동 검사(navigator.webdriver)에서 키·주소를 정하지 않으면 예전 동작 그대로(기존 CI 장면 불변).
//  · 미검증: GPU 실기기·모바일 프레임·실제 플레이.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_MASTER_R1396__)return;
const base=window.__STORYWORLD_MOB_DIM_R1385__,zoneApi=window.__STORYWORLD_MOB3D_ZONE_R1326__;
if(!base)return;
const REV='R1396-mob3d-master-2',KEY='storyworld.r1396.mob3d';
const LOCK2D=new Set(['u204','u205','last302','last303']);
const EXTRA={'r1315:glutton':'3d','r1382:wrathEar':'3d','r1382:slothMan':'3d','r1338:balrog':'3d'};
let mode='off',explicit=false;
try{if(navigator.webdriver)mode='legacy';}catch(_){}
try{const v=localStorage.getItem(KEY);if(v==='on'||v==='off'){mode=v;explicit=true;}}catch(_){}
try{const m=/[?&]mob3d96=([01])\b/.exec(location.search);if(m){mode=m[1]==='1'?'on':'off';explicit=true;}}catch(_){}
const TABLE=Object.assign({},EXTRA,typeof base.table89==='function'?base.table89():{});
const HAS3D=new Set(Object.keys(TABLE).filter(k=>TABLE[k]==='3d').map(k=>k.split(':')[0]));
const zone=()=>{try{return typeof room==='object'&&room?String(room.id||''):'';}catch(_){return '';}};
const story=()=>{try{return typeof room==='object'&&!!room&&(room.layer==='STORY'||room.layer==null)&&!room.samongR103&&!room.survivalR600;}catch(_){return false;}};
const allowed=()=>mode==='on'&&story()&&!LOCK2D.has(zone());
function decide(tag,kid){if(mode==='legacy')return base.decide(tag,kid);return allowed()&&TABLE[tag+':'+kid]==='3d'?'3d':'2d';}
function use(tag,kid,b){if(mode==='legacy')return base.use(tag,kid,b);return decide(tag,kid)==='3d';}
function active(tag,b){if(mode==='legacy')return base.active(tag,b);return allowed()&&HAS3D.has(tag);}
window.__STORYWORLD_MOB_DIM_R1385__=Object.freeze(Object.assign({},base,{revision96:REV,use,active,decide,base96:base}));
if(zoneApi){const pick0=zoneApi.pick;window.__STORYWORLD_MOB3D_ZONE_R1326__=Object.freeze(Object.assign({},zoneApi,{pick:on=>mode==='legacy'?pick0(on):false}));}
function set(v){mode=v?'on':'off';explicit=true;try{localStorage.setItem(KEY,mode);}catch(_){}try{const el=document.getElementById('mob3dMasterR1396Toggle');if(el)el.checked=mode==='on';}catch(_){}return mode==='on';}
// 설정 화면: 체크 하나, 예전 3D 몹 줄은 숨김(검사가 id 로 찾을 수 있게 지우지는 않음)
const HIDE='#mob3dHqR1339Row,#mob3dR1312Row,#mob3dR1315Row,#mob3dR1316Row,#mob3dR1317Row,#mob3dR1322Row,#boss3dR1322cRow,#mob3dR1329Row,#boss3dR1330Row,#balrog3dR1338Row,#envy3dR1343Row,#boss3dR1382Row,#mobStyleR1325Row';
function css(){try{if(document.getElementById('r1396Css'))return;const s=document.createElement('style');s.id='r1396Css';s.textContent=HIDE+'{display:none!important}';(document.head||document.documentElement).appendChild(s);}catch(_){}}
function row(){const doc=document;if(doc.getElementById('mob3dMasterR1396Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;
 const d=doc.createElement('div');d.id='mob3dMasterR1396Row';d.className='r1021-row';
 d.innerHTML='<label style="white-space:nowrap"><input type="checkbox" id="mob3dMasterR1396Toggle"> 3D 몹·보스</label><p class="small muted">끄면(기본) 모든 몹·보스를 2D 원화로 그립니다. 켜면 지정한 3D 몹·보스(2~7부·7대죄·주사실 등)만 입체 모델로 그리고, 시스템의 거부권·관리자의 권한·잠들지 못하는 마을·한약과 불면귀는 2D 그대로입니다. 영웅 3D 는 따로입니다.</p>';
 host.appendChild(d);const el=d.querySelector('#mob3dMasterR1396Toggle');if(el){el.checked=mode==='on';el.onchange=()=>set(!!el.checked);}}
try{css();}catch(_){}
try{if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{css();row();}catch(_){}return r;};}}catch(_){}
window.__STORYWORLD_MOB3D_MASTER_R1396__=Object.freeze({revision:REV,on:()=>mode==='on',mode:()=>mode,explicit:()=>explicit,set,decide,table:()=>({...TABLE}),
 inspect:()=>({revision:REV,mode,zone:zone(),story:story(),three:Object.values(TABLE).filter(v=>v==='3d').length})});
})();
