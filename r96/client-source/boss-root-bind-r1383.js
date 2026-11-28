// R1383 뿌리의 문지기(dist00-boss) — 보라 문어 촉수 대신 갈색 뿌리가 땅에서 솟아 영웅을 옭아매는 프레임 애니메이션.
//  사용자 2026-11-27 23:46Z "뿌리보스는 촉수사용하는거 갈색뿌리가 올라와서 적을 속박하도록 프레임애니매이션스킬 문어다리가아니라".
//  원인: R1346 보스별 표에서 뿌리 보스의 터짐 계열이 'tentacle' 이라 R1040 패턴 터짐·R431 던지기 폭발·R411 장판이
//   보라 빨판 촉수 시트(assets/r411/fx/boss-tentacle-bind.webp)를 그렸다(헤드리스 보스전 실측: R1040 placed 전부 그 시트).
//  고친 것(판정·피해·시간·쿨다운·서사 그대로, 그림만):
//   ① 터짐 그림 = 갈색 뿌리가 솟아 조이는 24칸 시트 assets/r1383/root-bind24.webp(아래 R1383c Dots 정식본).
//   ② R411 장판 두 그림 = 땅 갈라짐 두 번(촉수 빠짐; 표에 없는 이름이면 R411 이 해시로 촉수를 다시 뽑으므로 R411 표에 있는 이름).
//   ③ 속박: 뿌리 보스에게 맞으면 이미 R87 가시 속박(2.2초, 걸어서 못 움직임, 블링크로 탈출)·R96 영웅 발밑 갈색 뿌리 감기(앞·뒤 나눈 같은 그림)가 걸린다 — 그대로 이어 쓴다.
//   Dots 시그니처(SW-R1358-01 검은 뿌리 한 갈래, 줄 모양)·재해 꺼짐·운석은 그대로. 다른 보스 표는 손대지 않는다.
//  R1383c(11-28): Dots 정식 시트 SW-R1383_root-bind24.png(1536×1024, 256칸 6열×4행, 24장, 16fps 1.5초, 접점 y 220, PNG SHA-256 75d42fb2…)로 교체.
//   무손실 webp(픽셀 같음). 칸 0~5 흙 갈라지며 솟음 → 6~11 두 갈래가 휘어 오름 → 12~17 맞물려 조임·버팀 → 18~23 부서져 흙으로. 속박 시간(2.2초)은 따로 그대로.
//   (그 전 임시본: final42 099 가시뿌리 축소본 4열·12.5fps — 원본 099 자료는 그대로 보존.)
//  R1383b(QA 11-28 7.77 손질): ⑤ R1040 이 그릴 때(전역 drawAssetFrame3 에서 이 시트일 때만) 크기 ×1.35(Dots 그림이 칸의 약 60%), 땅 자리가 벽·문 칸(blocked)이면 그 묶음은 건너뜀(벽 위에 뜨지 않게).
//  투명도: R1369 규칙이 있으면 그것이(헤드리스 실측 그림 ≤.7·몸 자리 클립 ≤.3), 없으면 이 파일이 그림 상한 .7 만 건다.
//  끄기: localStorage['storyworld.r1383.rootbind']='{"on":false}' (예전 촉수 그림으로).
(()=>{'use strict';
if(window.__STORYWORLD_ROOT_BIND_R1383__)return;
const REV='R1383-root-bind-3',KEY='storyworld.r1383.rootbind',BOSS='dist00-boss',SKEY='r1383-root-bind';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const SIZE=1.35,WALL_R=.3,CAP=.7,LIFT='brightness(1.45)';// LIFT: Dots 시트가 짙은 고동색이라 어두운 흙바닥·알파 .7 에서 묻혀 그릴 때만 밝힘(brightness 만 — 기록기 안전)// CAP: R1369(투명도 규칙)가 아직 없을 때만 위험 그림 상한 .7 을 직접 건다(있으면 R1369 가 .7·몸 자리 .3 — 이중으로 깎지 않음). R1192 보스 이펙트 진하게(a'=1-(1-a)^1.7)가 뒤에서 올리므로 그 역함수 값으로 걸어 최종 .7
const SHEET=Object.freeze({path:'assets/r1383/root-bind24.webp',cell:256,cols:6,n:24,fps:16,py:220,scale:SIZE,dots:'SW-R1383_root-bind24.png',sha256:'75d42fb234fc8bb4046820c019792e897739bca9b3c7baccc4678b924b440c08'});
const R411=Object.freeze(['boss-ground-fissure','boss-ground-fissure']);
const st={installed:false,installs:0,error:null,draws:0,walls:0,capped:0,wrapped:false};
const G=k=>{try{return Function('return typeof '+k+'!=="undefined"?'+k+':undefined')();}catch(_){return undefined;}};
// 화면 → 땅 좌표(project 는 칸 좌표에 대해 아핀): 세 점으로 역변환
function ground(sx,sy){const pr=G('project');if(typeof pr!=='function')return null;const o=pr(0,0),a=pr(1,0),b=pr(0,1);const ax=a.x-o.x,ay=a.y-o.y,bx=b.x-o.x,by=b.y-o.y,det=ax*by-ay*bx;
 if(!(Math.abs(det)>1e-9))return null;const dx=sx-o.x,dy=sy-o.y;const x=(dx*by-dy*bx)/det,y=(ax*dy-ay*dx)/det;return Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null;}
function onWall(sx,sy){try{const bl=G('blocked'),g=ground(sx,sy);return !!(g&&typeof bl==='function'&&bl(g.x,g.y,WALL_R,G('room')));}catch(_){return false;}}
function wrapDraw(){const base=G('drawAssetFrame3');if(typeof base!=='function'||base.__r1383)return false;
 const f=function(path,frame,x,y,height,...rest){if(prefs.on&&path===SHEET.path){if(onWall(x,y)){st.walls++;return false;}st.draws++;let [opt,...more]=rest;opt={...(opt&&typeof opt==='object'?opt:{})};if(!opt.filter)opt.filter=LIFT;if(!window.__STORYWORLD_FX_ALPHA_R1369__){opt={...(opt&&typeof opt==='object'?opt:{})};const V=window.__STORYWORLD_BOSS_FX_VIS_R1192__,cap=typeof V?.inverse==='function'?V.inverse(CAP):CAP;opt.alpha=Math.min(cap,Number.isFinite(opt.alpha)?opt.alpha:1);st.capped++;}return base.call(this,path,frame,x,y,(Number(height)||0)*SIZE,opt,...more);}return base.call(this,path,frame,x,y,height,...rest);};
 f.__r1383=true;try{Function('f','drawAssetFrame3=f')(f);st.wrapped=G('drawAssetFrame3')===f;}catch(e){st.error=String(e?.message||e).slice(0,200);}return st.wrapped;}
function install(){const ID=window.__STORYWORLD_BOSS_IDENTITY_R1346__;if(!prefs.on||!ID?.addSheet||!ID.register||!ID.table||st.installed)return false;
 try{const cur=ID.table().find(s=>s&&s.id===BOSS);if(!cur)return false;
  const sh=ID.addSheet(SKEY,SHEET)||ID.sheetOf?.(SKEY);if(!sh||sh.path!==SHEET.path)return false;
  ID.register(BOSS,{burst:SKEY,r411:R411.slice(),disaster:cur.disaster,...(cur.own?{own:true}:{sig:cur.sig?{...cur.sig}:undefined})});
  st.installed=true;st.installs++;return true;}catch(e){st.error=String(e?.message||e).slice(0,200);return false;}}
install();
if(st.installed)wrapDraw();
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs,note:'다시 불러오면 적용'};}
window.__STORYWORLD_ROOT_BIND_R1383__=Object.freeze({revision:REV,sheet:SHEET,r411:R411,set,ground,onWall,
 inspect:()=>({revision:REV,prefs:{...prefs},installed:st.installed,installs:st.installs,error:st.error,draws:st.draws,walls:st.walls,capped:st.capped,wrapped:st.wrapped,boss:BOSS,browser:false,GPU:false})});
})();
