// R338 — 사용자 2026-11-05 "사이비 합일몽세 쉼터에서 사몽 세계로 왔는데 사몽 에피소드로 진입하는 게 없는 버그, 이어지도록 연결".
//  원인: 사몽 에피소드(R103)는 메뉴·사몽 창(R62)의 버튼으로만 들어갈 수 있고, 사몽(DREAM) 세계 쉼터 지도 위에는 입구가 없었다
//  (제8부 쉼터 village 포함, 정본 순서상 제8부 다음이 제9부 사몽).
//  수정: DREAM 층의 쉼터(regionById[id].safe)마다 입장 지점 근처에 '사몽 에피소드 입구'(십자 마법진·빛기둥)를 그리고,
//  가까이에서 상호작용(C)하면 R103 start()(이어가기·시작)로 들어간다. 열림 조건(STORY 마지막 기억 완료)이 아직이면 그 안내를 띄운다.
//  · 방 소품(room.props)에 넣지 않는다(저장·길찾기·충돌에 영향 없음) — 그림은 효과 칸, 판정은 interact 감싸기.
//  · 끄기: localStorage['storyworld.r338.gate']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_GATE_R338__)return;
const REV='R338-samong-gate-1',KEY='storyworld.r338.gate',REACH=2.6;
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={placed:0,enters:0,locked:0,draws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const SM=()=>window.__STORYWORLD_SAMONG_R103__;
const T=()=>typeof time==='number'?time:0;
let gate=null;// {zone, x, y}
function active(){try{return on&&typeof started!=='undefined'&&started&&typeof layer!=='undefined'&&layer==='DREAM'&&typeof room==='object'&&room&&regionById?.[room.id]?.safe&&!room.samongR103&&!SM()?.inspect?.()?.here;}catch(_){return false;}}
const free=(x,y)=>{try{return typeof blocked!=='function'||!blocked(x,y,.45,room);}catch(_){return true;}};
function place(){const L=room.exploration||{},e=L.entry||L.entrance||{x:player.x,y:player.y},o=room.objective;
 // 입장 지점에서 2.5~4칸, 쉼터 목표(제단)와는 떨어진 빈 바닥
 for(const r of[3,2.5,4,5])for(let k=0;k<16;k++){const a=k/16*Math.PI*2+.4,x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r;if(!free(x,y))continue;if(o&&Math.hypot(o.x-x,o.y-y)<3)continue;gate={zone:room.id,x,y};stats.placed++;return gate;}
 gate={zone:room.id,x:e.x+1.5,y:e.y-1.5};stats.placed++;return gate;}
function current(){if(!active())return null;if(!gate||gate.zone!==room.id)place();return gate;}
const SENT={type:'r338-gate',x:0,y:0,age:0,life:Infinity};
function tickGate(){try{const g=current();const has=typeof effects!=='undefined'&&Array.isArray(effects)&&effects.includes(SENT);
 if(g&&!has){SENT.x=g.x;SENT.y=g.y;SENT.age=0;effects.push(SENT);}else if(!g&&has)effects.splice(effects.indexOf(SENT),1);}catch(e){fail(e);}}
const PAL={a:[150,120,60],b:[255,236,190]},VIO={a:[60,40,90],b:[200,180,255]};
function draw(){const g=current();if(!g||typeof project!=='function')return;const S=window.__STORYWORLD_FX_SPRITES_R106__;const q=project(g.x,g.y),z=typeof zoom==='number'?zoom:1,h=typeof actorHeight==='function'?actorHeight():60,t=T();stats.draws++;
 if(S&&S.on&&S.on()){S.draw('glow',VIO,q.x,q.y,h*2.2,h*1.1,{alpha:.45});S.draw('runecross',PAL,q.x,q.y,h*2,h*2,{squash:.5,angle:t*.35,alpha:.9});S.draw('ring',VIO,q.x,q.y,h*2.4,h*1.2,{alpha:.4+.15*Math.sin(t*2)});S.draw('pillar',VIO,q.x,q.y,h*.9,h*2.6,{alpha:.45});}
 const near=Math.hypot(player.x-g.x,player.y-g.y)<REACH,key=typeof KR291!=='undefined'&&KR291?KR291.i:'C';
 ctx.save();try{ctx.font=Math.round(12*Math.max(.8,Math.min(1.3,z)))+'px sans-serif';ctx.textAlign='center';ctx.fillStyle=near?'rgba(255,236,190,.98)':'rgba(220,206,240,.85)';
  const label=(near?key+' · ':'')+'사몽 에피소드 입구',col=ctx.fillStyle;/* 기록기는 strokeText 가 없어 어두운 글자를 비켜 겹쳐 외곽처럼 */ctx.fillStyle='rgba(8,6,12,.85)';for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])ctx.fillText(label,q.x+dx,q.y-h*1.7+dy);ctx.fillStyle=col;ctx.fillText(label,q.x,q.y-h*1.7);}finally{ctx.restore();}}
async function enter(){const S=SM();if(!S?.start){toast?.('사몽 에피소드를 불러오는 중입니다.',2);return true;}stats.enters++;try{const ok=await S.start();if(ok===false)stats.locked++;}catch(e){fail(e);}return true;}
if(typeof interact==='function'){const base=interact;interact=function(...a){try{const g=current();if(g&&Math.hypot(player.x-g.x,player.y-g.y)<REACH&&!(typeof modal!=='undefined'&&modal)){enter();return;}}catch(e){fail(e);}return base.apply(this,a);};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r338-gate'){try{if(typeof ctx.scope==='function')ctx.scope({id:'r338:gate',kind:'effect',x:e.x,y:e.y},draw);else draw();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);tickGate();return r;};}
window.__STORYWORLD_SAMONG_GATE_R338__=Object.freeze({revision:REV,current:()=>{const g=current();return g?{...g}:null;},enter,
 inspect:()=>({revision:REV,on,gate:gate?{...gate}:null,active:active(),stats:{...stats},lastError}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}});
})();
