// R1245 — 스토리 사몽 세계·사몽 에피소드(꿈 층 DREAM)의 카메라 기본 시야를 스토리 기준으로(사용자 2026-11-19
//  "스토리쪽이랑 사몽쪽 사몽에피소드까지 카메라 기본시야 맞춰줘 스토리기준으로").
//  원인(헤드리스 실측 1280×720 PC): 스토리 층은 R81 안정 추적이 카메라를 잡아 zoom = R63 목표(.6667) × 1.22 = .8133,
//  영웅을 늘 화면 가운데에 둔다. 꿈 층은 R81 대상(병원·worldWardR81·refuge 지도)이 아니라 R63 카메라만 돌아 zoom .6667 —
//  가로·세로 22% 더 넓게 보이고(영웅·몹이 18% 작게), 맵 가장자리에서는 R63 경계 clamp 로 영웅이 가운데를 벗어났다.
//  고침: PC·혼자·꿈 층(무한생존 제외)에서 R81 과 같은 방식(목표 zoom × 1.22, gain 1-exp(-9dt), dt 상한 .1, 화면 34% 넘게 튀면 바로 맞춤,
//  방 바뀌면 바로 맞춤)으로 카메라를 한 주인이 잡는다. 모바일은 스토리도 R63 카메라라 원래 같으므로 건드리지 않는다.
//  R217 시야 배율·R114·R1236·R1124 는 이 바깥에서 그대로 감싼다(태그를 world-presentation-r81 바로 뒤에 둠). 컷신·보스 연출 그림은 카메라 zoom 을 쓰지 않아 영향 없음.
//  끄기: localStorage storyworld.r1245.dreamCamera {"on":false}.
(()=>{'use strict';
if(window.__STORYWORLD_DREAM_CAMERA_R1245__||typeof cameraTick!=='function')return;
const REV='R1245-dream-camera-1',KEY='storyworld.r1245.dreamCamera';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={updates:0,snaps:0,delegated:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const fin=Number.isFinite;
function factor(){try{const f=window.__STORYWORLD_WORLD_PRESENTATION_R81__?.inspect?.().pcZoomFactor;if(fin(f)&&f>0)return f;}catch(_){}return 1.22;}
let F=null;const BATTLE=()=>F??(F=factor());
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode;return !m||m()==='off';}catch(_){return true;}};
const pc=()=>!(typeof mobile==='function'&&mobile())&&!(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches);
function eligible(){try{return on&&layer==='DREAM'&&!modal&&!loading&&!!room&&!room.survivalR600&&!!player&&fin(player.x+player.y)&&solo()&&pc()&&!window.__STORYWORLD_WORLD_PRESENTATION_R81__?.ownsCamera?.()&&typeof window.__STORYWORLD_CAMERA_R63__?.plan==='function';}catch(_){return false;}}
let cur=null;
function apply(dt){const p=window.__STORYWORLD_CAMERA_R63__.plan(),t=(fin(p?.targetZoom)&&p.targetZoom>0?p.targetZoom:1)*BATTLE();
 const changed=!cur||cur.room!==room,step=Math.max(0,Math.min(.1,Number(dt)||0)),gain=changed?1:1-Math.exp(-9*step);
 const z=changed?t:cur.zoom+(t-cur.zoom)*gain;let x=changed?player.x:cur.x+(player.x-cur.x)*gain,y=changed?player.y:cur.y+(player.y-cur.y)*gain;
 const du=(player.x-player.y-x+y)*TILE*z,dv=(player.x+player.y-x-y)*TILE*.5*z;
 if(Math.abs(du)>W*.34||Math.abs(dv)>H*.34){x=player.x;y=player.y;stats.snaps++;}
 if(!fin(z+x+y))throw Error('non-finite camera');
 zoom=Math.abs(z-t)<1e-8?t:z;cam.x=x;cam.y=y;cur={room,x,y,zoom,target:t};stats.updates++;}
const base=cameraTick;cameraTick=function(dt){if(eligible()){try{apply(dt);return;}catch(e){fail(e);cur=null;}}cur=null;stats.delegated++;return base.apply(this,arguments);};
function set(v){on=v!==false;cur=null;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_DREAM_CAMERA_R1245__=Object.freeze({revision:REV,set,factor:BATTLE,owns:eligible,inspect:()=>({revision:REV,on,factor:BATTLE(),camera:cur?{x:cur.x,y:cur.y,zoom:cur.zoom,target:cur.target}:null,stats:{...stats},lastError})});
})();
