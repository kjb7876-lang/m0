// R1017 디아블로풍 조형물 — 사용자 2026-11-13 "patch.gg 툴박스에서 … 디아블로 느낌나는 것만 개선 적용", 2026-11-14 추천 6개 고름.
//  그림: patch.gg 툴박스에서 License 줄 "CC0 · no credit needed" 를 확인한 Poly Haven 모델 6점(AI 생성 아님)을
//   쿼터뷰(30°, 정사영) 어두운 횃불빛·푸른 테두리광으로 한 장씩 렌더한 투명 webp(긴 변 384px, 장당 22~34KB). 3D 파일은 싣지 않는다.
//   출처·해시는 CREDITS.md, 렌더 설정은 r96/qa/r1017/README.md.
//  놓는 곳: 새 배치 규칙을 만들지 않고 R449 공간 기능별 배치표(TEMPLATES)에 묶음 하나씩 끼운다 → 벽 거리·문 틈·길·제단·보스방·칠죄 규칙·
//   같은 그림 상한·결정성·그림 다시 읽기·가림 완화를 R449 그대로 따른다(충돌·저장·문·서사·몹 불변, solid:false).
//   실제 64개 지역 헤드리스 전수(main 962ed20)로 그 공간이 있는 계열에만 둔다: 예배 계열(cult, 사이비 교단) 긴 회랑 = 벽의 철문(지역당 1점만).
//   석상·촛대·녹슨 침대는 R449 가 아니라 R523 방 묶음에 넣었다(rooms-r523.js 의 veiledking·candles·rustbed, shrine·candle1·rustIv):
//   브라우저 그리기 명령 실측에서 cult03 수확실·ep1a09 처치실은 R523 이 맡아 그 방의 R449 가구를 그리는 동안 쉬게 해 화면에 0점이었다.
//   → cult03 코어 전실 = 석상 + 촛대, 앞방·입구 = 촛대, ep1a09 관찰실 = 녹슨 쇠침대 + 수액대.
//   철문은 렌더 그대로(평균 밝기 13/255)는 어두운 벽 앞에서 안 보여 감마 .5 로 올렸다(평균 50).
//   보물상자는 R449 가 가구를 놓는 지역 중 시대가 맞는 보관실이 없어(home 계열 = 현대 호텔·빌라·가정집, R830 시대 점검표) 이번엔 싣지 않는다.
//   돌 화덕은 사용자 상시 규칙 "실내 화로 금지"(2026-11-10)에 걸리고 R449 가 놓는 방은 모두 실내라 뺐다(그림도 싣지 않음).
//   석상 그림 이름에 statue 를 쓰지 않는다 — R303 이 실내의 statue 이름 그림을 바깥 물건으로 보고 숨긴다(전수에서 cult03 석상 2점이 숨겨졌음).
//  끄기: localStorage['storyworld.r1017.props']='{"on":false}' 뒤 새로고침(배치표는 처음 읽을 때 한 번 끼운다).
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_DIABLO_R1017__)return;
const REV='R1017-props-diablo-3',KEY='storyworld.r1017.props';
const prefs={on:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={registered:0,inserted:0,capped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
// [가로, 세로, 크기(영웅 키 배수, R102 병원 침대 .9 기준 실물 비례), 발 x, 발 y] — 렌더 때 모델 바닥 가운데를 화면에 투영한 점이 발
const ART=Object.freeze({gate:[249,384,1.47,123.531,324.774]});
const id=a=>'x1017-'+a;
function register(){const A=window.__STORYWORLD_ASSETS_R80_DATA__?.assets;if(!A)return false;
 for(const[a,[w,h,s,px,py]]of Object.entries(ART)){const k='r80-'+id(a);if(A[k])continue;
  A[k]={path:'assets/r1017/'+id(a)+'.webp',source:'patch.gg polyhaven (CC0) render R1017',width:w,height:h,rgbaBytes:w*h*4,kind:'prop',scale:s,
   frame:{sourceRect:[0,0,w,h],pivot:[px,py],visibleHeight:h,visibleBounds:[0,0,w,h]},r1017:true};stats.registered++;}
 return true;}
// R449 묶음: P(그림, 벽을 따라 칸, 벽에서 칸) — 첫 줄이 핵심 가구. at = 그 공간 종류 돌려쓰기 목록에서 들어갈 자리(0 = 그 종류 첫 방).
const P=(art,a,d)=>({art,a,d});
const ADD=Object.freeze([{kind:'cult',space:'corridor',at:0,set:[P(id('gate'),0,.5)]}]);
// 지역당 상한(같은 물건이 줄지어 서지 않게, 특히 문처럼 보이는 철문): 넘는 점은 R303 숨김 표시로 쉬게 한다(자리·id·배열 그대로, 번호 순으로 앞 것만 남김)
const CAP=Object.freeze({gate:1});
const has=(list,set)=>list.some(g=>Array.isArray(g)&&g.length===set.length&&g.every((q,i)=>q&&q.art===set[i].art));
function insert(api=window.__STORYWORLD_PROPS_SPACE_R449__){const T=api?.TEMPLATES;if(!T)return false;
 for(const q of ADD){const list=T[q.kind]?.[q.space];if(!Array.isArray(list)||has(list,q.set))continue;
  list.splice(Math.min(q.at,list.length),0,Object.freeze(q.set.map(o=>Object.freeze({...o}))));stats.inserted++;}
 return true;}
// 이 태그는 R449 보다 앞줄에 있다(R449 는 긴 스크립트 줄 안, 그 뒤 자리는 다른 검사가 고정). R449 가 API 를 내놓는 그 순간(첫 배치 전) 끼운다.
let ready=false;
function hook(){const K='__STORYWORLD_PROPS_SPACE_R449__';if(window[K]){ready=insert(window[K]);return;}
 const d=Object.getOwnPropertyDescriptor(window,K);if(d&&!d.configurable)return;let v;
 Object.defineProperty(window,K,{configurable:true,enumerable:true,get:()=>v,set:x=>{v=x;try{ready=insert(x)||ready;}catch(e){fail(e);}
  try{Object.defineProperty(window,K,{value:x,writable:true,configurable:true,enumerable:true});}catch(_){}}});}
if(prefs.on){try{if(register())hook();}catch(e){fail(e);}}
const artName=p=>{const m=/^r80-x1017-(.+)$/.exec(String(p?.r80Art||''));return m?m[1]:null;};
function cap(r){if(!r||!Array.isArray(r.props))return 0;const by={};let hid=0;
 for(const p of r.props){const a=p&&p.r449Furniture?artName(p):null;if(!a)continue;const L=by[a]||(by[a]=[]);L[L.length]=p;}
 for(const[a,list]of Object.entries(by)){const keep=CAP[a]??1;let n=0;
  for(const p of list.slice().sort((x,y)=>String(x.id).localeCompare(String(y.id)))){
   if(p.r303Hide&&p.r303Hide!=='r1017cap')continue;/* 다른 규칙이 쉬게 한 점은 세지 않음 */
   if(n<keep){if(p.r303Hide==='r1017cap')delete p.r303Hide;n++;}else if(p.r303Hide!=='r1017cap'){p.r303Hide='r1017cap';hid++;}}}
 stats.capped+=hid;return hid;}
(function poll(){try{if(prefs.on&&typeof room!=='undefined'&&room&&!(typeof loading!=='undefined'&&loading))cap(room);}catch(e){fail(e);}setTimeout(poll,450);})();
function set(o={}){if(typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs,needsReload:true};}
window.__STORYWORLD_PROPS_DIABLO_R1017__=Object.freeze({revision:REV,ART,ADD,CAP,cap,set,
 inspect:()=>({revision:REV,prefs:{...prefs},ready,stats:{...stats},lastError,collisionChanged:false,savesTouched:false,license:'CC0-1.0 (Poly Haven via patch.gg)'})});
})();
