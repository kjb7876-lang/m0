/* R474 늪의 손이 발목을 붙잡는다 (2026-11-09 야간, 서사 디테일 전투 R450 차이표 dist02 줄).
 * 정본: "포털 너머에는 검은 늪이 펼쳐져 있었다. … 물속에서 올라온 손들이 발목을 붙잡았다."
 * 늪의 뿔악마 군주(dist02 mb-dist02)와 싸우는 동안 13초마다 영웅 발밑에서 물속 손(R105 승인 그림 dist02-hands)이 올라온다.
 * 0.95초 예고(손이 천천히 솟음) 뒤 그 자리 0.95칸 안에 있으면 R61 '속박'(이동 0.48배, 2.2초)이 걸린다. 비켜서면 안 걸린다.
 * - 피해는 주지 않는다(속박 상태만, R61 이 이미 쓰는 상태이상·아이콘). 보스가 깨어 있고 12칸 안일 때만.
 * - 서사 장면·창·영화 모드(R370)·협동 중엔 없고, 예고 중 장면이 열리면 걷는다. 그림은 효과 단계(표지 효과 r474-hands)에서 그린다.
 * - 영웅이 발밑을 가리므로 잡히는 범위만큼 검녹색 물웅덩이 고리를 깔고, 손 무리 둘을 발 양옆에서 솟게 그린다.
 * - 손 그림은 정지 그림을 솟고 가라앉게 움직인 임시 연출이다(최종은 Dots 시트 — CX-0058 추가 요청 대상).
 * 끄기: localStorage['storyworld.r474.hands']='{"on":false}'
 */
(()=>{'use strict';
const REV='R474',KEY='storyworld.r474.hands',ZONE='dist02',BOSS='mb-dist02',ART='assets/r105/props/dist02-hands.webp';
const FIRST=.3,GAP=13,WARN=.95,HOLD=.35,SINK=.6,REACH=.95,RANGE=12,H_ACTOR=.9,SIDE=.42;
const stats={rises:0,binds:0,dodged:0,cancelled:0,draws:0,errors:0,lastError:null};
let active=null,nextAt=null,lastRoom=null,boss=null;
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
function on(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function fail(e){stats.errors++;stats.lastError=String(e&&e.message||e);}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;
 if(window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on)return true;const co=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();if(co&&co!=='off')return true;}catch(_){}return false;}
function liveBoss(){const list=(typeof room!=='undefined'&&room&&room.id===ZONE&&room.enemies)||[];
 return list.find(e=>e&&e.nativeId===BOSS&&!e.r61Clone&&e.hp>0&&!e.dead&&e.spawnState==='active')||null;}
function cancel(){if(active&&!active.grabbed)stats.cancelled++;active=null;}
let prefAt=-1e9,prefOn=true;
function step(){
 if(typeof room!=='undefined'&&room!==lastRoom){lastRoom=room;active=null;nextAt=null;boss=null;}
 const t=T();if(t<prefAt||t-prefAt>=1){prefAt=t;prefOn=on();}
 if(!prefOn||typeof player==='undefined'||!player||player.hp<=0||blockedNow()){cancel();return;}
 const e=liveBoss();if(e!==boss){boss=e;nextAt=e?t+FIRST:null;}
 if(!e||Math.hypot(player.x-e.x,player.y-e.y)>RANGE){cancel();if(e&&nextAt!=null&&nextAt<t+FIRST)nextAt=t+FIRST;return;}
 if(active){const u=t-active.t0;
  if(!active.grabbed&&u>=WARN){active.grabbed=true;const hit=Math.hypot(player.x-active.x,player.y-active.y)<=REACH;active.hit=hit;
   if(hit){try{if(window.__STORYWORLD_FIELDS_R61__?.applyStatus?.('bind',e))stats.binds++;}catch(err){fail(err);}}else stats.dodged++;}
  if(u>=WARN+HOLD+SINK)active=null;return;}
 if(nextAt!=null&&t>=nextAt){active={x:player.x,y:player.y,t0:t,grabbed:false,hit:false,seed:(stats.rises*7919)%360};nextAt=t+GAP;stats.rises++;}
}
function draw(){if(!active||typeof project!=='function'||typeof drawImage!=='function')return;
 const row=typeof readyImage==='function'?readyImage(ART):null;if(!row||!row.image)return;
 const t=T(),u=t-active.t0,z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34,q=project(active.x,active.y);
 const iw=row.crop?.w||row.image.naturalWidth||512,ih=row.crop?.h||row.image.naturalHeight||441;
 // 예고: 25%→70% 높이로 솟음(옅게) · 잡음: 100%(조금 오므림) · 가라앉음: 다시 낮아지며 흐려짐
 let k,a;if(u<WARN){const v=u/WARN;k=.25+.45*v;a=.55+.3*v;}else if(u<WARN+HOLD){k=1;a=.95;}else{const v=Math.min(1,(u-WARN-HOLD)/SINK);k=1-.75*v;a=.95*(1-v);}
 if(a<=0)return;const T1=TL*z,AH=typeof actorHeight==='function'?actorHeight():66*z,h=H_ACTOR*AH*k,w=h*iw/ih,sway=Math.sin(t*7+active.seed)*.04*(u<WARN?1:.3);
 const id='r474:hands:'+active.t0.toFixed(2),sc=(o,f)=>{if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();};
 // 물웅덩이 고리 = 잡히는 범위(REACH). 영웅이 발밑 그림을 가려도 위험 범위가 읽히게 한다(검녹색 물 + 가장자리 물결). 바닥에 붙는 그림.
 sc({id:id+':pool',kind:'effect',pxfSide:'enemy',x:active.x,y:active.y,groundAligned:true},()=>{if(typeof ctx==='undefined'||!ctx)return;
  const rx=REACH*T1*Math.SQRT2,ry=rx*.5,pulse=.5+.5*Math.sin(t*9+active.seed);
  ctx.save();ctx.globalAlpha*=Math.min(1,a*1.05);ctx.beginPath();ctx.ellipse(q.x,q.y,rx,ry,0,0,Math.PI*2);ctx.fillStyle='rgba(6,18,12,.6)';ctx.fill();
  ctx.lineWidth=Math.max(1.5,2.4*z);ctx.strokeStyle=`rgba(${150+60*pulse|0},${190+40*pulse|0},120,.9)`;ctx.stroke();
  ctx.beginPath();ctx.ellipse(q.x,q.y,rx*(.55+.25*pulse),ry*(.55+.25*pulse),0,0,Math.PI*2);ctx.strokeStyle='rgba(120,150,110,.35)';ctx.stroke();ctx.restore();});
 // 손 무리 두 덩이를 발 양옆에서 솟게(가운데 하나면 영웅 몸에 가려 안 보임). 오른쪽은 좌우 뒤집기.
 // 원본 그림 요소를 그대로 그리면 3D 화면이 같은 경로의 지역 조형물 그림으로 여겨 싣지 않는다(헤드리스 화소 비교) → R106 처럼 캔버스 사본으로 그린다.
 const cv=copyOf(row);if(!cv)return;
 sc({id:id+':hands',kind:'effect',pxfSide:'enemy',x:active.x,y:active.y,lightShadowApproved:true},()=>{for(const sd of [-1,1]){ctx.save();try{ctx.globalAlpha*=a;ctx.translate(q.x+sd*SIDE*AH,q.y+AH*.06);ctx.rotate(sway*sd);if(sd>0)ctx.scale(-1,1);ctx.drawImage(cv,-w/2,-h,w,h);}finally{ctx.restore();}}});stats.draws++;}
let copy=null;function copyOf(row){if(copy&&copy.src===row.image)return copy.cv;try{const im=row.image,c=row.crop||{x:0,y:0,w:im.naturalWidth,h:im.naturalHeight};if(!(c.w>0&&c.h>0))return null;
 const cv=document.createElement('canvas');cv.width=c.w;cv.height=c.h;cv.getContext('2d').drawImage(im,c.x,c.y,c.w,c.h,0,0,c.w,c.h);copy={src:im,cv};return cv;}catch(err){fail(err);return null;}}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading))step();else cancel();}catch(err){fail(err);active=null;}sentinel(!!active);return r;};}
// 바닥 층(drawObjective 뒤)에 그리면 지형·영웅 층에 덮여 화면에 안 남는다(헤드리스 화소 비교로 확인) → R241 운석처럼 효과 단계에서
// 표지 효과 한 개로 그린다. 손은 발 양옆으로 비켜 그려 영웅 몸을 덮지 않고, 물웅덩이는 옅게 깔아 발이 비친다.
// 3D 화면(기록기 ctx)에는 다른 오버레이(R292·R329)처럼 ctx.scope 로 주인(자리·id)을 붙여 넘긴다.
// pxfSide 'enemy' = 적 쪽 위협 → R350 영웅 가림 옅게 하기에서 빠져(적 예고처럼) 영웅 발치에서도 흐려지지 않는다.
const SENT={type:'r474-hands',x:0,y:0,age:0,life:Infinity,r474Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);
 if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r474Sentinel){try{draw();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
window.__STORYWORLD_SWAMP_HANDS_R474__=Object.freeze({revision:REV,
 inspect:()=>({revision:REV,on:prefOn,active:active?{...active}:null,nextAt,timing:{FIRST,GAP,WARN,HOLD,SINK,REACH,RANGE,H_ACTOR,SIDE},stats:{...stats}})});
})();
