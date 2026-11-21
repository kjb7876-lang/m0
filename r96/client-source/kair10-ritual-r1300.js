// R1300 붕괴 의식장(kair10) 보스방 연출 — 사용자 2026-11-21 "붕괴의식장 보스문에 여섯고리 적용시켜주고 보스방안에 기둥에서 검은모래가 하늘로 솟구치게 연출"
//  + "이거 나가는 보스문에 적용하면될듯".
//  정본(제5부 카이로노미콘 · 붕괴 의식장): "검은 모래가 거대한 기둥처럼 하늘로 솟구치고" · "봉인 회랑으로 통하는 문 앞에는 여섯 개의 명령 고리가 쇠사슬처럼 걸려 있었다"
//   · "여섯 고리를 하나씩 차례로 끊어 냈다. 마지막 고리가 끊어지며 바닥에 떨어지자 무거운 문이 열렸고". 지역·보스·문 이름은 새로 짓지 않는다.
//  ① 검은 모래 솟구침: 보스방(bossRoomNodeId 방) 안의 1×1 돌기둥(벽판 넷으로 둘러싼 칸) 머리에서 검은 모래가 하늘로 솟는 12프레임 루프.
//     그림 = 드라이브 'kair10-black-sand-column-v1'(검은 모래 기둥 정지 참고 그림)을 scripts/r1300-sand-geyser.py 가 결만 위로 흘려 묶은 시트(assets/r1300/sand-geyser.webp).
//  ② 여섯 고리: 보스방에서 나가는 문(보스방과 다음 방을 잇는 R81 문 가운데 보스 구역 입구 문이 아닌 것 = '다음 구역 문') 앞에 쇠고리 여섯을 쇠사슬처럼 겹쳐 세운다.
//     그림 = 이미 게임에 있는 쇠고리 4단계(금 없음→금→갈라짐→끊김) 그림 assets/r117/scene/s03-ring-k1~k4.png. 보스가 살아 있는 동안 온전,
//     보스가 쓰러지면 하나씩 차례로 금 가고 끊어져 떨어진다(정본 순서). 이미 보스를 쓰러뜨린 뒤 다시 들어오면 고리는 없다.
//  그리기 전용: 충돌·길찾기·문 열림·피해·저장·서사는 그대로. 코드로 그린 선·원 없음, ctx.filter 안 씀(R1055 등 Three 기록기 규칙). 숫자는 clamp.
//  끄기: localStorage['storyworld.r1300.kair10']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_KAIR10_RITUAL_R1300__)return;
const REV='R1300-kair10-ritual-1',KEY='storyworld.r1300.kair10',ZONE='kair10';
const GEYSER='assets/r1300/sand-geyser.webp',G={n:12,cols:6,w:192,h:384,fps:10,pivot:[96,372]};
const RING=[1,2,3,4].map(k=>'assets/r117/scene/s03-ring-k'+k+'.png'),RW=96,RH=104,RPIV=[48,100];
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={draws:0,geysers:0,rings:0,breaks:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=v=>Number.isFinite(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,fin(v)?v:a)),T=()=>typeof time==='number'&&fin(time)?time:0;
const asked=new Map();
function image(p){try{const got=typeof readyImage==='function'?readyImage(p):null;if(got?.image)return got.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);
 if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p,'R1300 kair10 ritual');}}catch(e){fail(e);}return null;}
const isBoss=e=>!!(e&&(e.boss||e.isBoss||e.rank==='boss'));
// ---- 자리 찾기(순수: 레이아웃만 본다 — QA 가 그대로 부른다) ----
function bossRect(L){const n=(L?.nodes||[]).find(q=>q&&q.id===L.bossRoomNodeId);if(!n||!fin(n.x+n.y+n.width+n.depth))return null;return[n.x-n.width/2,n.y-n.depth/2,n.x+n.width/2,n.y+n.depth/2];}
// 1×1 돌기둥: 칸 (cx,cy) 둘레 네 변에 길이 1 벽판이 모두 있는 칸(바닥 칸이 아님)
function pillars(L){const R=bossRect(L);if(!R)return[];const F=new Set((L.floorCells||[]).map(c=>c[0]+':'+c[1])),hz=new Set(),vt=new Set();
 for(const w of L.walls||[]){if(!w||w.decorative||w.presentationOnly||w.angle)continue;const ww=+w.width,dd=+w.depth;if(!fin(ww+dd+w.x+w.y))continue;
  if(Math.abs(ww-1)<.05&&dd<.5)hz.add(Math.round(w.x-.5)+':'+Math.round(w.y));else if(Math.abs(dd-1)<.05&&ww<.5)vt.add(Math.round(w.x)+':'+Math.round(w.y-.5));}
 const out=[];for(let cy=Math.floor(R[1]);cy<Math.ceil(R[3]);cy++)for(let cx=Math.floor(R[0]);cx<Math.ceil(R[2]);cx++){if(F.has(cx+':'+cy))continue;
  if(hz.has(cx+':'+cy)&&hz.has(cx+':'+(cy+1))&&vt.has(cx+':'+cy)&&vt.has((cx+1)+':'+cy))out.push({x:cx+.5,y:cy+.5});}
 return out;}
// 나가는 보스 문: 보스방과 이어진 R81 문 가운데 보스 구역 입구(r78BossDoor)가 아닌 것
function exitDoor(L){const b=L?.bossRoomNodeId;if(b==null)return null;return(L.worldR74?.doors||[]).find(d=>d&&!d.r78BossDoor&&Array.isArray(d.edge)&&d.edge.includes(b)&&fin(d.x+d.y))||null;}
// 고리 여섯: 문 앞(보스방 쪽 0.55칸) 바닥 줄에서 문 폭과 겹치는 구간에 고르게 — 구간이 좁으면 서로 겹쳐 쇠사슬처럼
function ringSpots(L){const d=exitDoor(L),R=bossRect(L);if(!d||!R)return[];const F=new Set((L.floorCells||[]).map(c=>c[0]+':'+c[1]));
 const alongX=d.axis!=='x'?(+d.width>=+d.depth):false,cy=(R[1]+R[3])/2,cx=(R[0]+R[2])/2;
 const side=alongX?Math.sign(cy-d.y)||1:Math.sign(cx-d.x)||1,half=Math.max(+d.width,+d.depth)/2,off=.55*side;
 const cells=[];for(let s=Math.floor((alongX?d.x:d.y)-half);s<Math.ceil((alongX?d.x:d.y)+half);s++){const x=alongX?s:Math.floor(d.x+off),y=alongX?Math.floor(d.y+off):s;if(F.has(x+':'+y))cells.push(s);}
 if(!cells.length)return[];const a=Math.min(...cells)+.3,b=Math.max(...cells)+.7,n=6,out=[];
 for(let i=0;i<n;i++){const s=a+(b-a)*(i+.5)/n;out.push(alongX?{x:s,y:d.y+off,i}:{x:d.x+off,y:s,i});}return out;}
// ---- 상태 ----
let cur=null;/* {room,geysers,rings,seenAlive,deadAt} */
function state(){if(typeof room==='undefined'||!room||room.id!==ZONE||(typeof layer!=='undefined'&&layer!=='STORY'))return null;
 if(!cur||cur.room!==room){const L=room.exploration;cur={room,geysers:L?pillars(L):[],rings:L?ringSpots(L):[],seenAlive:false,deadAt:-1};}
 const boss=(room.enemies||[]).filter(isBoss),alive=boss.some(e=>e.hp>0);
 if(alive)cur.seenAlive=true;else if(cur.seenAlive&&cur.deadAt<0)cur.deadAt=T();
 return cur;}
// 고리 i 의 모습: {frame 0..3, drop 0..1, alpha} 또는 null(이미 끊겨 사라짐)
function ringLook(st,i,t){if(!st.seenAlive)return null;if(st.deadAt<0)return{frame:0,drop:0,alpha:1};
 const s=st.deadAt+.6+i*.5,u=t-s;if(u<0)return{frame:0,drop:0,alpha:1};if(u<.36)return{frame:1+Math.min(2,Math.floor(u/.12)),drop:0,alpha:1};
 const v=(u-.36)/.5;if(v>=1)return null;return{frame:3,drop:v,alpha:1-v};}
function drawAll(){if(!on||typeof ctx==='undefined'||!ctx||typeof project!=='function')return;const st=state();if(!st)return;
 const t=T(),unit=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'&&fin(zoom)?zoom:1),vw=typeof W==='number'?W:innerWidth,vh=typeof H==='number'?H:innerHeight;
 const sight=window.__STORYWORLD_SIGHT24__;
 // ① 기둥 머리에서 솟는 검은 모래(기둥 높이 2.85칸 → 화면 약 .9배)
 const gi=st.geysers.length?image(GEYSER):null;
 if(gi)for(const [k,g]of st.geysers.entries()){const q=project(g.x,g.y);if(!fin(q.x+q.y)||q.x<-200||q.x>vw+200||q.y<-100||q.y>vh+1400)continue;if(sight?.enabled&&!sight.pointVisible?.(g.x,g.y))continue;
  const f=Math.floor((t*G.fps+k*5))%G.n,sx=(f%G.cols)*G.w,sy=Math.floor(f/G.cols)*G.h,lift=2.85*.9*unit,scx=clamp(2.4*unit/G.w,.05,4),scy=clamp(scx*2.2,.05,9);
  /* 영웅이 모래 기둥 뒤에 서면 옅게(전투 가독성) */let ga=.96;try{const hq=project(player.x,player.y),gw=G.w*scx*.35;if(Math.abs(hq.x-q.x)<gw&&hq.y<q.y-lift+8&&hq.y>q.y-lift-G.h*scy*.95)ga=.42;}catch(_){}
  ctx.save();try{const run=()=>{ctx.globalAlpha*=ga;ctx.translate(q.x,q.y-lift);ctx.scale(k%2?-scx:scx,scy);ctx.drawImage(gi,sx,sy,G.w,G.h,-G.pivot[0],-G.pivot[1],G.w,G.h);};
   if(typeof ctx.scope==='function')ctx.scope({id:'r1300:geyser:'+k,kind:'effect',x:g.x,y:g.y,presentationOnly:true,r1300:true},run);else run();stats.geysers++;}finally{ctx.restore();}}
 // ② 나가는 문 앞 여섯 고리
 for(const r of st.rings){const look=ringLook(st,r.i,t);if(!look)continue;const im=image(RING[look.frame]);if(!im)continue;const q=project(r.x,r.y);if(!fin(q.x+q.y)||q.x<-120||q.x>vw+120||q.y<-160||q.y>vh+160)continue;
  const sc=clamp(1.6*unit/RW,.05,4),sway=look.drop>0?0:Math.sin(t*1.3+r.i*1.7)*.035,dy=look.drop*.7*unit;
  ctx.save();try{const run=()=>{ctx.globalAlpha*=clamp(look.alpha,0,1);ctx.translate(q.x,q.y+dy);ctx.rotate(sway+look.drop*(r.i%2?.5:-.5));ctx.scale(sc,sc);ctx.drawImage(im,0,0,RW,RH,-RPIV[0],-RPIV[1],RW,RH);};
   if(typeof ctx.scope==='function')ctx.scope({id:'r1300:ring:'+r.i,kind:'effect',x:r.x,y:r.y,presentationOnly:true,r1300:true},run);else run();stats.rings++;}finally{ctx.restore();}}
 stats.draws++;}
// 엔진 effects 에 표지 하나(R430·R411 과 같은 길): 지역을 옮기면 effects 가 비워지므로 tick 마다 다시 건다.
const SENT={type:'r1300-kair10-ritual',x:0,y:0,age:0,life:Infinity,r1300Sentinel:true};
function arm(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0){SENT.age=0;effects.push(SENT);}else if(!want&&i>=0)effects.splice(i,1);}catch(_){}}
try{
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r1300-kair10-ritual'){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const want=on&&typeof room!=='undefined'&&!!room&&room.id===ZONE&&(typeof layer==='undefined'||layer==='STORY');if(want){const st=state();if(st&&st.deadAt>=0&&st.rings.every(q=>!ringLook(st,q.i,T()))&&!st.done){st.done=true;stats.breaks++;}}arm(want);}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(o){if(o&&typeof o.on==='boolean')on=o.on;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on)arm(false);return{on};}
window.__STORYWORLD_KAIR10_RITUAL_R1300__=Object.freeze({revision:REV,ZONE,GEYSER,RING,pillars,exitDoor,ringSpots,ringLook,bossRect,set,
 state:()=>{const s=state();return s?{geysers:s.geysers.map(g=>({...g})),rings:s.rings.map(r=>({...r})),seenAlive:s.seenAlive,deadAt:s.deadAt,done:!!s.done}:null;},
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,collisionChanged:false,browserVerified:false,GPUVerified:false})});
})();
