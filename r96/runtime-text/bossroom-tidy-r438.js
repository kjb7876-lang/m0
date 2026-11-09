// R438 칠죄 보스방 조형물 정리 — 사용자 2026-11-09 02:46Z "질투의 보스방 들어가니까 조형물이 중구난방 배치되있던데 이유와 개선할점 보고" → 02:59Z "개선"
//  원인(헤드리스 재현, ep1b03): sin-room-art.js 의 질투 전용 가구 4점 위에, 그 세트를 모르는 장치들이 물건을 더 얹었다.
//   ① R224 방 가구(cave-r204 furnish)가 '주택 계열' 공용 4종(나태 소파·나태 쓰레기 더미·질투 깨진 거울·탐식 가스레인지)을 벽마다 3.2칸 간격으로 뿌림
//      → 질투 콘솔 옆 탐식 레인지 조각, 장식장 아래 쓰레기 더미. 겹침 검사는 중심 1.6칸뿐이라 폭 넓은 전용 가구를 못 거른다.
//   ② 보스방 경계 너머 어둠 속에 장면 소품 거울(R81)·공용 거울이 반쯤 묻힘.
//   (③ 바닥 가운데 등불 기둥은 visual-r92.js 의 R438 규칙이 천장 빛으로 바꾼다 — 빛 웅덩이는 그대로.)
//  고침(그림·충돌·저장·문·목표는 그대로, room.props 에서 장식만 뺀다):
//   · 전용 가구가 있는 보스방(sin-room-art 가 맡은 STORY 지역, 맘몬 ep1b06 제외)의 보스방 틀(worldWardR81.bossBounds)+3칸 안 R224 공용 가구를 뺀다.
//   · 같은 범위에서 보스방 틀 바깥(어둠 띠)에 선 장면 장식(r80Dressing·r8[01]:scene:)을 뺀다. 틀 안 장면 소품은 그대로.
//   · 나태·질투·탐식 지역(ep1b02·03·04)의 나머지 방에서는 R224 공용 가구 중 그 지역 그림만 남긴다(질투=깨진 거울, 나태=소파·쓰레기, 탐식=레인지·쓰레기).
//  끄기: localStorage['storyworld.r438.bossroom']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_BOSSROOM_TIDY_R438__)return;
const REV='R438-bossroom-tidy-1',KEY='storyworld.r438.bossroom',MARGIN=3;
const SIN=new Set(['ep1b02','ep1b03','ep1b04','ep1b05','ep1b07']);
const THEME={ep1b02:/r80-02[45]\.webp$/,ep1b03:/r80-026\.webp$/,ep1b04:/r80-02[57]\.webp$/};
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)prefs.on=false;}catch(_){}
const stats={rooms:0,furniture:0,offTheme:0,outside:0,errors:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const done=new WeakMap();
const bounds=r=>{const b=r?.exploration?.worldWardR81?.bossBounds;return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)?b:null;};
const keep=q=>!q||q.name||q.chest||q.altar||q.interactive||q.solid||q.r74Door||q.r81WardDoor||q.sinArt||/chest|altar|portal|door|note|memory/i.test(String(q.kind||'')+String(q.id||''));
const scene=q=>!!(q.r80Dressing||/^r8[01]:scene:/.test(String(q.id||'')));
function eligible(r){return prefs.on&&r&&SIN.has(r.id)&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&r.exploration?.sinRoomArt&&Array.isArray(r.props);}
function tidy(r){
 if(!eligible(r))return 0;
 const sig=r.props.length+':'+r.props.filter(q=>q?.r224Furniture).length,prev=done.get(r);if(prev&&prev.sig===sig&&prev.layout===r.exploration)return 0;
 const b=bounds(r),inBox=(q,m)=>b&&q.x>=b[0]-m&&q.x<=b[2]+m&&q.y>=b[1]-m&&q.y<=b[3]+m,theme=THEME[r.id];
 const out=[],rep={room:r.id,bounds:b,furniture:[],offTheme:[],outside:[]};
 for(const q of r.props){
  if(keep(q)||!Number.isFinite(q.x+q.y)){out.push(q);continue;}
  if(q.r224Furniture&&inBox(q,MARGIN)){rep.furniture.push(q.id);continue;}
  if(q.r224Furniture&&theme&&!theme.test(String(q.path||''))){rep.offTheme.push(q.id);continue;}
  if(scene(q)&&!q.r224Furniture&&inBox(q,MARGIN)&&!inBox(q,0)){rep.outside.push(q.id);continue;}
  out.push(q);}
 const n=rep.furniture.length+rep.offTheme.length+rep.outside.length;
 if(n){r.props=out;stats.furniture+=rep.furniture.length;stats.offTheme+=rep.offTheme.length;stats.outside+=rep.outside.length;stats.rooms++;last=rep;}
 done.set(r,{sig:r.props.length+':'+r.props.filter(q=>q?.r224Furniture).length,layout:r.exploration});return n;}
function tick(){try{if(typeof room!=='undefined'&&room&&!(typeof loading!=='undefined'&&loading))tidy(room);}catch(e){fail(e);}}
if(typeof setInterval==='function')setInterval(tick,250);
window.__STORYWORLD_BOSSROOM_TIDY_R438__=Object.freeze({revision:REV,SIN:[...SIN],tidy,
 set:v=>{prefs.on=!!v?.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},last,lastError,collisionChanged:false,savesTouched:false})});
})();
