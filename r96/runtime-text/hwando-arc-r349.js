// R349 환도 기본 공격 호(弧) 방향 일관성 — 사용자 2026-11-05 "적위치에따라 저 원부분 즉 적이 왼쪽에 있으면 ( 이런이펙트 오른쪽이면 )이런이펙트가
//  나가겠지 위면각도틀어서 아래도 각도 틀어서 적용해줘 일관성맞추게".
//  원래 베기 그림(assets/vfx/heroes/hwando-a.webp)은 한쪽 끝만 굵은 갈고리 모양이다. 엔진이 겨눈 각도로 돌리기만 해서 방향마다 모양이 달랐고,
//  적 자리 섬광(e568HeroImpact)은 각도 0 으로 늘 같은 쪽을 향했다.
//  → 원의 한 조각처럼 좌우 대칭인 ')' 그림(assets/r349/hwando-arc.webp, scripts/r349-hwando-arc.py 가 원래 그림의 은빛 색으로 만든다)으로 바꾼다.
//    영웅 → 적 화면 방향으로 돌려 그린다: 오른쪽 ')', 왼쪽 '(', 위 '︵', 아래 '︶', 그 사이는 그만큼 기울인다. 베기(slash)·적 자리 섬광 모두 같은 규칙.
//  판정·피해·위치·수명은 그대로(그림과 각도만). 환도·EGO 아닐 때만. 끄기: localStorage['storyworld.r349.hwandoArc']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_ARC_R349__)return;
const REV='R349-hwando-arc-1',KEY='storyworld.r349.hwandoArc',ARC='assets/r349/hwando-arc.webp',SRC=/(^|\/)assets\/vfx\/heroes\/hwando-a\.webp$/;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={swaps:0,slash:0,impact:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let cur=null;
const egoOn=()=>{try{return !!window.__STORYWORLD_EGO151__?.inspect?.()?.state?.active;}catch(_){return false;}};
function screenAngle(e){const q=project(e.x,e.y);
 if(e.type==='slash'&&Number.isFinite(e.angle)){const d=project(e.x+Math.cos(e.angle),e.y+Math.sin(e.angle));return Math.atan2(d.y-q.y,d.x-q.x);}
 const h=Number.isFinite(e.r40WorldHeading)?e.r40WorldHeading:Number.isFinite(e.visualWorldAngle35)?e.visualWorldAngle35:null;
 if(h!=null){const d=project(e.x+Math.cos(h),e.y+Math.sin(h));return Math.atan2(d.y-q.y,d.x-q.x);}
 const p=project(player.x,player.y);if(Math.hypot(q.x-p.x,q.y-p.y)>2)return Math.atan2(q.y-p.y,q.x-p.x);return null;}
function mine(e){return on&&e&&typeof player==='object'&&player?.hero==='hwando'&&(e.type==='slash'||e.type==='e568HeroImpact')&&SRC.test(String(e.asset||''))&&!egoOn();}
const ready=()=>{try{return typeof readyImage!=='function'||!!readyImage(ARC);}catch(_){return false;}};
function load(){try{if(typeof ensureImages==='function')Promise.resolve(ensureImages([ARC])).catch(()=>{});else if(typeof addImage==='function')addImage(ARC);}catch(_){}}
/* 효과 그리기는 여러 겹(R102 돌리기·R302 물들이기·엔진 다시 쓰기)을 지나 그림 경로를 직접 읽으므로, 그리는 동안만 효과의 asset·각도를 바꿔 끼운다 */
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(!mine(e))return base.apply(this,[e,...a]);
 let ang=null;try{ang=screenAngle(e);}catch(err){fail(err);}if(ang==null||!ready()){load();return base.apply(this,[e,...a]);}
 const keep={asset:e.asset,angle:e.angle,impactAngleVfx:e.impactAngleVfx};stats.swaps++;stats[e.type==='slash'?'slash':'impact']++;
 e.asset=ARC;if(e.type!=='slash'){e.impactAngleVfx=ang;const q=project(e.x,e.y),d=project(e.x+1,e.y),d2=project(e.x,e.y+1);/* 화면 각 → 월드 각(등각 투영 역변환) */
  const ax=d.x-q.x,ay=d.y-q.y,bx=d2.x-q.x,by=d2.y-q.y,cx=Math.cos(ang),cy=Math.sin(ang),det=ax*by-bx*ay;if(Math.abs(det)>1e-9){const u=(cx*by-bx*cy)/det,v=(ax*cy-cx*ay)/det;e.angle=Math.atan2(v,u);}}
 const prev=cur;cur={a:ang,type:e.type};try{return base.apply(this,[e,...a]);}finally{cur=prev;e.asset=keep.asset;e.angle=keep.angle;e.impactAngleVfx=keep.impactAngleVfx;}};}
if(typeof texture==='function'){const base=texture;texture=function(path,x,y,w,h,opt={},...r){if(cur&&String(path||'')===ARC&&cur.type!=='slash'){try{return base.call(this,path,x,y,w,h,{...(opt||{}),angle:cur.a},...r);}catch(err){fail(err);}}
 return base.apply(this,[path,x,y,w,h,opt,...r]);};}
load();
window.__STORYWORLD_HWANDO_ARC_R349__=Object.freeze({revision:REV,asset:ARC,on:()=>on,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
