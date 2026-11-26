// R1320c 환도 영웅·EGO 3D 칼을 Dots '조선 환도 07' 로 바꾸기.
//  · 사용자 11-26 07:06Z "조선 환도 07 … 환도영웅칼 이거 맞아?" → 07:09Z 카드 "07로 바꾸기".
//    07 = 사용자가 고른 06 모양(끝만 살짝 휜 외날·옥빛 코등이·붉은 술)에 칼날·손잡이 질감을 살린 판.
//  · 기존 칼(assets/r1313/joseon-hwando.glb, Armory R2)과 hero-weapons-3d-r1313.js 표는 그대로 둔다.
//    R1313 이 그 칼을 받으러 갈 때 주소만 새 파일(assets/r1313/joseon-hwando-07.glb)로 바꿔 준다.
//    07 도 손잡이(GripSocket) 원점·칼끝 +Y·BladeTip 노드 규칙이 같아 R1313 표·R1320 자세가 그대로 맞는다.
//  · 07 칼날은 기존보다 8% 짧고 가늘어 게임 배율에서 덜 읽힌다 → 칼 모델만 1.1배(칼날 길이를 기존과 같게).
//  · 칼집·호패는 붙이지 않는다(Dots 안내: 필수 아님). 끄기: localStorage storyworld.r1320.sword07=off 뒤 새로고침.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HWANDO_SWORD07_R1320__)return;
const REV='R1320c-hwando-sword-07',KEY='storyworld.r1320.sword07',OLD='assets/r1313/joseon-hwando.glb',NEW='assets/r1313/joseon-hwando-07.glb',SIZE=1.1;
const stats={revision:REV,routed:0,sized:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
const on=()=>{try{return localStorage.getItem(KEY)!=='off';}catch(_){return true;}};
// 순수: 주소가 기존 환도 칼이면 07 주소로(물음표·해시 꼬리 유지). 그 밖의 값(다른 파일·URL 아님·빈 값)은 그대로 돌려준다.
function route(u,enabled){
 if(!enabled||typeof u!=='string')return u;
 const m=/^((?:.*\/)?)assets\/r1313\/joseon-hwando\.glb([?#].*)?$/.exec(u);
 return m?m[1]+NEW+(m[2]||''):u;
}
let routedOnce=false;
function wrap(){
 const prev=window.fetch;if(typeof prev!=='function'||prev.__r1320Sword07)return;
 const f=function(u,...a){let v=u;try{v=route(u,on());if(v!==u){stats.routed++;routedOnce=true;}}catch(e){fail(e);v=u;}return prev.call(this,v,...a);};
 f.__r1320Sword07=true;window.fetch=f;
}
// 07 을 받은 뒤에만 칼 모델(R1313 mount → roll → 모델) 크기를 맞춘다. mount 의 크기·회전(R1313 표)은 건드리지 않는다.
function size(){
 if(!routedOnce)return;const scene=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.scene;if(!scene)return;
 for(const c of scene.children){const m=/^r1305-(hwando|ego)-3d-shared$/.exec(c.name||'');if(!m)continue;
  const w=c.getObjectByName('r1313-'+m[1]+'-weapon')?.children?.[0]?.children?.[0];
  if(w&&!w.userData.r1320Sword07){w.scale.multiplyScalar(SIZE);w.userData.r1320Sword07=true;w.updateMatrixWorld(true);stats.sized++;}}
}
try{wrap();}catch(e){fail(e);}
setInterval(()=>{try{size();}catch(e){fail(e);}},400);
window.__STORYWORLD_HWANDO_SWORD07_R1320__=Object.freeze({revision:REV,on,old:OLD,glb:NEW,size:SIZE,
 set:v=>{try{localStorage.setItem(KEY,v?'on':'off');}catch(_){}return on();},
 pure:Object.freeze({route}),inspect:()=>({...stats,lastError,on:on()})});
})();
