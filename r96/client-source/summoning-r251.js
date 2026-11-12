// R251 발록의 소환진 — 사용자 2026-11-03 "스토리모드에서 발록처치후 소환진파괴가능하도록 이것도 자산생성해서 만들어줘
//  원거리타워형유닛으로 공격은 육망성을 영웅쪽에생성후 기괴한빨간손들나오는이펙트".
//  정본(개선본) 서사 "발록이 소멸하자 소환진이 깨지면서 발밑이 갈라…"에 맞춰, 본편 dist06(지옥의 문)에서 발록이 쓰러진 자리에
//  '발록의 소환진'이 남는다. 움직이지 않는 원거리 탑형 적이며, 부수면 서사대로 깨진다(깨짐 연출 + 저장).
//  · 공격: 영웅이 11칸 안에 있으면 5.5초마다 영웅 발밑에 핏빛 육망성(1.2초 예고) → 그 자리에서 기괴한 빨간 손들이 솟아 움켜쥔다(반지름 1.6칸).
//    피해는 엔진 위험지대 판정(예고가 끝난 뒤 반지름 안), 양은 발록 기본 피해의 60%.
//  · 체력: 발록 최대 체력의 12%(발록보다 훨씬 약한 마무리 상대). 진행 조건은 바꾸지 않는다(부수지 않아도 문은 원래대로 열린다).
//  · 그림: scripts/r251-summoning-art.py 가 우리 코드로 그린 임시 픽셀 자산(assets/r251/circle.webp 4프레임, hands.webp 8프레임) — 좋은 자산이 오면 ART 만 바꾼다.
//  · 혼자 플레이일 때만. 끄기: localStorage['storyworld.r251.summoning']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_SUMMONING_R251__)return;
const REV='R251-summoning-1',KEY='storyworld.r251.summoning',ZONE='dist06';
const ART={circle:'assets/r251/circle.webp',hands:'assets/r251/hands.webp'};
const CC={w:384,h:256,px:192,py:176,n:4},HC={w:256,h:320,px:128,py:288,n:8,cols:4};
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={spawned:0,casts:0,hits:0,broken:0,draws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const isBalrog=e=>!!(e&&e.boss&&/발록/.test(String(e.name||'')));
function here(){try{return on&&solo()&&typeof room==='object'&&room&&room.id===ZONE&&(typeof layer==='undefined'||layer==='STORY');}catch(_){return false;}}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r?.image)return r.image;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}catch(e){fail(e);}return null;}
const circles=()=>(typeof room==='object'&&room?.enemies||[]).filter(e=>e&&e.r251Circle);
function freeNear(x,y){try{if(typeof blocked!=='function'||!blocked(x,y,.6,room))return{x,y};for(let r=.6;r<4;r+=.4)for(let k=0;k<12;k++){const a=k/12*Math.PI*2,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(!blocked(px,py,.6,room))return{x:px,y:py};}}catch(e){fail(e);}return{x,y};}
// 발록이 쓰러지면 그 자리에 소환진
function spawn(b){room.r251Spawned=true;let e;try{e=JSON.parse(JSON.stringify(b,(k,v)=>k==='nav'||k==='attack'||k==='aim'?undefined:v));}catch(err){fail(err);return;}
 const at=freeNear(b.x,b.y);
 Object.assign(e,{id:'r251:circle:'+room.id,name:'발록의 소환진',x:at.x,y:at.y,homeX:at.x,homeY:at.y,nav:[],navAt:0,attack:null,rangedWindup:0,aim:null,tell:0,deadRecorded:false,deadAt:undefined,spawnState:'active',
  boss:false,midboss:false,persona:false,phase:undefined,speed:0,ai:'melee',cd:99,r61PreserveHealth:true,r75Tower:true,defScale:1,flash:0,
  r251Circle:{next:T()+2.5,casts:0,seed:Math.random()*6}});
 e.maxHp=e.hp=Math.max(200,Math.round((Number(b.maxHp)||2000)*.12));e.damage=Math.max(6,(Number(b.damage)||30)*.6);
 room.enemies.push(e);stats.spawned++;img(ART.circle);img(ART.hands);
 try{window.__STORYWORLD_PIXELFX_R163__?.play?.('dark-explosion-blood',at.x,at.y,{k:1.1,rate:1.4});}catch(_){}
 try{if(typeof toast==='function')toast('발록이 쓰러진 자리에 소환진이 남았다 · 부술 수 있다',3);}catch(_){}}
// 공격: 영웅 발밑 육망성 → 빨간 손
const fx=[];const SENT={type:'r251-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function cast(e){const t=e.r251Circle;t.casts++;stats.casts++;const x=player.x,y=player.y,warn=1.2,R=1.6;
 try{if(typeof hazards!=='undefined')hazards.push({id:typeof uid!=='undefined'?++uid:Date.now(),type:'r251-hands',owner:e.id,x,y,radius:R,age:0,warning:warn,life:warn+.8,asset:null,damage:e.damage,lastHit:-99,r251:true});}catch(err){fail(err);}
 fx.push({x,y,t0:T(),warn,R,seed:Math.random()*6,owner:e.id});if(fx.length>8)fx.shift();arm();}
function tickCircles(){if(!here())return;
 if(!room.r251Spawned&&!player.r251Broken){const b=(room.enemies||[]).find(isBalrog);if(b&&!(b.hp>0))spawn(b);}
 for(const e of circles()){const t=e.r251Circle;if(!(e.hp>0)){if(!t.broken){t.broken=true;player.r251Broken=true;stats.broken++;
    try{const X=window.__STORYWORLD_PIXELFX_R163__;X?.play?.('dark-explosion-blood',e.x,e.y,{k:1.4,rate:1.2});}catch(_){}
    fx.push({x:e.x,y:e.y,t0:T(),warn:0,R:2.4,seed:t.seed,crack:true});arm();
    try{if(typeof toast==='function')toast('소환진이 깨지며 발밑이 갈라진다',3);}catch(_){}try{if(typeof saveGame==='function')saveGame(false);}catch(_){}}continue;}
  e.cd=Math.max(e.cd||0,9);e.attack=null;e.rangedWindup=0;
  if(Math.hypot(player.x-e.x,player.y-e.y)>11){t.next=Math.max(t.next,T()+1.5);continue;}
  if(T()>=t.next){t.next=T()+5.5;cast(e);}}
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];if(T()-f.t0>f.warn+1.4)fx.splice(i,1);}}
// 그림
const BLOOD={a:[120,8,16],b:[255,90,90]},DARK={a:[40,4,10],b:[120,20,30]};
const H=()=>typeof actorHeight==='function'?actorHeight():60;
function hexPath(c,r,rot){c.beginPath();for(let k=0;k<2;k++)for(let i=0;i<=3;i++){const a=rot+k*Math.PI/3+i*2*Math.PI/3,x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}}
function drawFx(){const S=SPR(),hands=img(ART.hands),h=H();
 for(const f of fx){const el=T()-f.t0,q=project(f.x,f.y),w=f.R*Math.SQRT2*Math.abs(project(f.x+1,f.y).x-q.x);stats.draws++;
  if(f.crack){const u=Math.min(1,el/1.4);if(S){S.draw('crack',DARK,q.x,q.y,w*2.2,w*1.1,{alpha:.9*(1-u*.6),squash:.5,overHero:true});S.draw('glow',BLOOD,q.x,q.y-h*.3,w*2,w*1.2,{alpha:.7*(1-u),overHero:true});}continue;}
  const warn=el<f.warn,u=warn?el/Math.max(.01,f.warn):1,out=warn?1:Math.max(0,1-(el-f.warn-.9)/.5);
  ctx.save();try{ctx.translate(q.x,q.y);ctx.save();ctx.scale(1,.5);ctx.globalAlpha*=(warn?.6+.4*u:1)*out;
   ctx.fillStyle='rgba(50,2,8,.55)';ctx.beginPath();ctx.arc(0,0,w*(warn?.35+.65*u:1),0,Math.PI*2);ctx.fill();
   ctx.lineWidth=Math.max(2.5,3.4*(typeof zoom==='number'?zoom:1));ctx.strokeStyle='rgba(205,18,32,1)';
   ctx.beginPath();ctx.arc(0,0,w,0,Math.PI*2*Math.min(1,u*1.15));ctx.stroke();hexPath(ctx,w*.86,-Math.PI/2+f.seed*.1+el*.4);ctx.globalAlpha*=Math.min(1,.4+u);ctx.stroke();ctx.restore();
   if(warn&&S)S.draw('glow',BLOOD,0,-h*.05,w*1.3*u,w*.65*u,{alpha:.5*u,overHero:true});}finally{ctx.restore();}
  if(!warn&&hands){const v=el-f.warn,fr=Math.min(HC.n-1,Math.floor(v/1.1*HC.n)),sx=(fr%HC.cols)*HC.w,sy=Math.floor(fr/HC.cols)*HC.h,k=h*1.55/HC.h*(1+.12*f.R);
   ctx.save();try{ctx.globalAlpha*=out;ctx.filter='saturate(.95) contrast(1.05)';ctx.translate(q.x,q.y);ctx.scale(k,k);ctx.drawImage(hands,sx,sy,HC.w,HC.h,-HC.px,-HC.py,HC.w,HC.h);}finally{ctx.restore();}
   if(S&&v<.35)S.draw('glow',BLOOD,q.x,q.y-h*.35,w*1.6,w,{alpha:.8*(1-v/.35),overHero:true});}}}
function drawCircle(e){const im=img(ART.circle),q=project(e.x,e.y),dead=e.hp<=0,age=dead?T()-(e.deadAt||T()):0;if(dead&&age>1)return;const h=H(),k=h*2.3/CC.w;
 ctx.save();try{ctx.globalAlpha*=dead?Math.max(0,1-age):1;const S=SPR();if(S)S.draw('glow',BLOOD,q.x,q.y-h*.15,h*2.2,h*.9,{alpha:.35+.2*Math.sin(T()*3)});
  if(im){const fr=Math.floor(T()*6+e.r251Circle.seed)%CC.n;ctx.filter=e.flash>0?'brightness(1.7)':'saturate(.95) contrast(1.05)';ctx.save();ctx.translate(q.x,q.y);ctx.scale(k,k);ctx.drawImage(im,fr*CC.w,0,CC.w,CC.h,-CC.px,-CC.py,CC.w,CC.h);ctx.restore();ctx.filter='none';}
  const W=h*1.1,y=q.y+Math.max(8,h*.12),r=Math.max(0,Math.min(1,e.hp/Math.max(1,e.maxHp)));ctx.fillStyle='rgba(4,4,6,.85)';ctx.fillRect(q.x-W/2-1,y-1,W+2,6);ctx.fillStyle='#b8323a';ctx.fillRect(q.x-W/2,y,W*r,4);
  ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(240,200,190,.95)';ctx.fillText(e.name,q.x,y+17);}finally{ctx.restore();}}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(e&&e.r251Circle){try{const f=()=>drawCircle(e);if(typeof ctx.scope==='function')ctx.scope({id:'r251:circle:'+e.id,kind:'enemy',x:e.x,y:e.y},f);else f();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r251-fx'){try{drawFx();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
// 엔진 위험지대 그림은 이 손 공격을 그리지 않는다(위에서 직접 그림)
if(typeof drawHazard==='function'){const base=drawHazard;drawHazard=function(h,...a){if(h&&h.r251)return;return base.apply(this,[h,...a]);};}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{tickCircles();}catch(e){fail(e);}return r;};}
// 저장: 깨뜨린 소환진은 다시 서지 않는다
if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const d=base.apply(this,a);try{if(d&&typeof player==='object'&&player?.r251Broken)d.r251Broken=true;}catch(e){fail(e);}return d;};}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const r=await base.apply(this,[raw,...a]);try{if(typeof player==='object'&&player)player.r251Broken=!!raw?.r251Broken;}catch(e){fail(e);}return r;};}
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_SUMMONING_R251__=Object.freeze({revision:REV,ART,set,spawn:b=>spawn(b),cast:e=>cast(e),circles:()=>circles().map(e=>({id:e.id,name:e.name,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp})),inspect:()=>({revision:REV,on,stats:{...stats},fx:fx.length,lastError})});
})();
