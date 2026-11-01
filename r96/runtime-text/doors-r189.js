// R189 — 문·계단 조형물을 벽에 붙이고 계단은 오르내리는 길처럼(사용자 2026-11-01 "문 조형물들은 모두 벽이랑 일정 부분 붙어 있도록, 계단도 마찬가지,
//  계단은 올라가거나 내려가는 맵 포털 느낌으로").
//  · 지역 장식 문(broken_gate)·무너진 계단(collapsed_stairs)·R123 사몽 계단이 방 가운데 1~5칸 떠 있던 것을, 구역이 만들어질 때 한 번
//    가장 가까운 벽(8칸 안)의 바닥 쪽 면에 붙인다(벽 길이 방향으로는 원래 자리에 가깝게). 붙일 자리가 막혀 있으면 그대로 둔다.
//    장식(visualOnly·충돌 없음)만 옮긴다 — 진행용 R81 문(door-0~2)은 이미 통로 양 벽에 걸쳐 있어 건드리지 않는다.
//  · 계단 발치에는 아래로 꺼지는 어둠(검붉은 숨쉬는 웅덩이)과 위로 새는 희미한 빛을 깔아 다른 층으로 이어지는 길처럼 보이게 한다(그림만).
//  storyworld.r189.doors {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_DOORS_R189__)return;
const REV='R189-doors-1',KEY='storyworld.r189.doors';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={snapped:0,kept:0,stairs:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const done=new WeakSet();
const kindOf=p=>{if(!p||p.r74Door||p.r81WardDoor)return null;const s=String(p.key||'')+' '+String(p.path||'')+' '+String(p.r123Deco?.kind||'');
 if(/stair/i.test(s))return'stairs';if(/(^|[\W_])(gate|door)s?([\W_]|$)/i.test(s))return'gate';/* 'outdoor' 같은 낱말 속 door 는 빼고 */return null;};
const isDeco=p=>p.solid!==true&&(p.visualOnly6||p.decorative||p.r80PresentationOnly||p.r123Deco||p.solid===false);
/* 가장 가까운 벽의 바닥 쪽 면 위 점 */
function snapPoint(p,walls,off,where){let best=null,bd=8;for(const w of walls){if(!w||!(w.width>0)||!(w.depth>0))continue;const dx=Math.max(0,Math.abs(p.x-w.x)-w.width/2),dy=Math.max(0,Math.abs(p.y-w.y)-w.depth/2),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=w;}}
 if(!best)return null;const w=best,horiz=w.width>=w.depth;const cands=[];
 if(horiz){const x=Math.max(w.x-w.width/2+.7,Math.min(w.x+w.width/2-.7,p.x));const s=Math.sign(p.y-w.y)||1;cands.push({x,y:w.y+s*(w.depth/2+off)},{x,y:w.y-s*(w.depth/2+off)});}
 else{const y=Math.max(w.y-w.depth/2+.7,Math.min(w.y+w.depth/2-.7,p.y));const s=Math.sign(p.x-w.x)||1;cands.push({x:w.x+s*(w.width/2+off),y},{x:w.x-s*(w.width/2+off),y});}
 /* R81 환경 검사와 같은 기준: 조형물 중심은 벽에서 max(.55,반지름)+.12 이상 떨어져야 한다 */const need=Math.max(.55,Number(p.radius)||0)+.14,L=where?.exploration;
 for(const c of cands){try{if(L&&window.StoryPhase1?.explorationBlocked?.(L,c.x,c.y,need))continue;if(typeof blocked==='function'&&blocked(c.x,c.y,.3,where))continue;}catch(_){continue;}return{...c,dist:bd,horiz};}return null;}
function arrange(r){if(!prefs.on||!r||done.has(r))return;const L=r.exploration;if(!L?.walls?.length||!Array.isArray(r.props))return;done.add(r);
 for(const p of r.props){const k=kindOf(p);if(!k||!isDeco(p)||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  try{const q=snapPoint(p,L.walls,k==='stairs'?.8:.74,r);/* 벽 면에서 .74~.8 — 그림 폭이 벽에 닿아 보이고 R81 통과 여유는 지킨다 */if(!q||q.dist<.25){stats.kept++;continue;}if(!p.r189From)p.r189From={x:p.x,y:p.y};p.x=q.x;p.y=q.y;p.r189Wall=q.horiz?'h':'v';stats.snapped++;if(k==='stairs'){p.r189Stairs=true;stats.stairs++;}}catch(e){fail(e);}}}
try{if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(...a){const r=base.apply(this,a);try{arrange(r);}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
/* 이미 만들어진 방(불러오기·첫 방)도 */
(function poll(){try{if(typeof room!=='undefined'&&room)arrange(room);}catch(e){fail(e);}setTimeout(poll,700);})();
/* 계단 발치 어둠·빛 */
try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(prefs.on&&p?.r189Stairs&&typeof ctx!=='undefined'&&ctx&&typeof project==='function'){try{const S=window.__STORYWORLD_FX_SPRITES_R106__,q=project(p.x,p.y),u=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1),t=performance.now()/1000,k=.8+.2*Math.sin(t*1.3+p.x);
   ctx.save();ctx.globalAlpha*=.55*k;const g=ctx.createRadialGradient(q.x,q.y+u*.1,2,q.x,q.y+u*.1,u*1.5);g.addColorStop(0,'rgba(6,0,4,.95)');g.addColorStop(.55,'rgba(40,4,10,.55)');g.addColorStop(1,'rgba(40,4,10,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(q.x,q.y+u*.1,u*1.5,u*.75,0,0,Math.PI*2);ctx.fill();ctx.restore();
   if(S?.draw)S.draw('glow',[150,20,30],q.x,q.y-u*.9,u*1.6,u*1.6,{alpha:.18*k});}catch(e){fail(e);}}
  return base.apply(this,[p,...a]);};}}catch(e){fail(e);}
function set(o){prefs={...prefs,...o};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_DOORS_R189__=Object.freeze({revision:REV,set,kindOf,snapPoint,arrange,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
