// R1383 뿌리의 문지기(dist00-boss) — 보라 문어 촉수 대신 갈색 뿌리가 땅에서 솟아 영웅을 옭아매는 프레임 애니메이션.
//  사용자 2026-11-27 23:46Z "뿌리보스는 촉수사용하는거 갈색뿌리가 올라와서 적을 속박하도록 프레임애니매이션스킬 문어다리가아니라".
//  원인: R1346 보스별 표에서 뿌리 보스의 터짐 계열이 'tentacle' 이라 R1040 패턴 터짐·R431 던지기 폭발·R411 장판이
//   보라 빨판 촉수 시트(assets/r411/fx/boss-tentacle-bind.webp)를 그렸다(헤드리스 보스전 실측: R1040 placed 전부 그 시트).
//  고친 것(판정·피해·시간·쿨다운·서사 그대로, 그림만):
//   ① 터짐 그림 = 갈색 가시뿌리 속박 24칸 시트(final42 099 '가시나무 속박' 협업 아틀라스를 256칸으로 줄인 사본 assets/r1383/root-bind24.webp,
//      원본 2048×3072 PNG 는 그대로 보존). 칸 0~7 땅에서 솟음 → 8~11 감아 조임 → 12~15 버팀 → 16~23 풀려 흙으로 무너짐. 12.5fps(원본 타이밍 약 1.9초).
//   ② R411 장판 두 그림 = 땅 갈라짐 두 번(촉수 빠짐; 표에 없는 이름이면 R411 이 해시로 촉수를 다시 뽑으므로 R411 표에 있는 이름).
//   ③ 속박: 뿌리 보스에게 맞으면 이미 R87 가시 속박(2.2초, 걸어서 못 움직임, 블링크로 탈출)·R96 영웅 발밑 갈색 뿌리 감기(앞·뒤 나눈 같은 그림)가 걸린다 — 그대로 이어 쓴다.
//   Dots 시그니처(SW-R1358-01 검은 뿌리 한 갈래, 줄 모양)·재해 꺼짐·운석은 그대로. 다른 보스 표는 손대지 않는다.
//  투명도는 R1369 규칙(보스 위험 그림 ≤.7, 안에 선 몸 자리 ≤.3)이 R1040·R1346 그리기 이름으로 그대로 적용된다.
//  끄기: localStorage['storyworld.r1383.rootbind']='{"on":false}' (예전 촉수 그림으로).
(()=>{'use strict';
if(window.__STORYWORLD_ROOT_BIND_R1383__)return;
const REV='R1383-root-bind-1',KEY='storyworld.r1383.rootbind',BOSS='dist00-boss',SKEY='r1383-root-bind';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const SHEET=Object.freeze({path:'assets/r1383/root-bind24.webp',cell:256,cols:4,n:24,fps:12.5,py:220,scale:1,source:'assets/final42-r88/effects/099/thorn_atlas.png'});
const R411=Object.freeze(['boss-ground-fissure','boss-ground-fissure']);
const st={installed:false,installs:0,error:null};
function install(){const ID=window.__STORYWORLD_BOSS_IDENTITY_R1346__;if(!prefs.on||!ID?.addSheet||!ID.register||!ID.table||st.installed)return false;
 try{const cur=ID.table().find(s=>s&&s.id===BOSS);if(!cur)return false;
  const sh=ID.addSheet(SKEY,SHEET)||ID.sheetOf?.(SKEY);if(!sh||sh.path!==SHEET.path)return false;
  ID.register(BOSS,{burst:SKEY,r411:R411.slice(),disaster:cur.disaster,...(cur.own?{own:true}:{sig:cur.sig?{...cur.sig}:undefined})});
  st.installed=true;st.installs++;return true;}catch(e){st.error=String(e?.message||e).slice(0,200);return false;}}
install();
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs,note:'다시 불러오면 적용'};}
window.__STORYWORLD_ROOT_BIND_R1383__=Object.freeze({revision:REV,sheet:SHEET,r411:R411,set,
 inspect:()=>({revision:REV,prefs:{...prefs},installed:st.installed,installs:st.installs,error:st.error,boss:BOSS,browser:false,GPU:false})});
})();
