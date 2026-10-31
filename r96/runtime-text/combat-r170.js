// R170 — 사용자 2026-10-31 요청 묶음(이토 준지·다크에덴·디아블로풍, 기존 그림체 유지).
//  ① 근접 공격 준비 화살표·이름표 없애기: '근접 공격 준비/원거리 조준' 상자·글자, 몸에서 뻗는 방향 화살표, 원거리 조준 점선·과녁(R41)을
//     일반 몹에서 그리지 않는다. 공격은 몸짓(R92/R109 공격 그림·R161 찌르기)과 이펙트(R98·R169)만으로 읽힌다. 판정·시간은 그대로.
//  ② 피의 육망성 조형물(고정형 원거리 몹, R176 서사 검수로 지어낸 '피의 탑' 이름을 사용자 표현대로 바꿈): 맵마다 그 서사의 조형물 그림으로 된 움직이지 않는 적을 둔다(본편 = 그 지역 조형물, 사몽 = 세뇌당한 기억의 조각).
//     가까이 오면 6초마다 영웅 발밑에 피로 그린 육망성을 띄우고(1.3초 예고), 그 자리에서 탑의 고유색·보조색 촉수가 솟아 친다.
//     두 번에 한 번은 그 맵의 잡몹 둘을 육망성에서 불러낸다(탑 하나당 12마리까지). 본편 전투 맵 1, 사몽 전투 구역 1, B·D 구역 2.
//  ③ 나무 조형물은 그림자를 그리지 않는다(뿌리 묻기는 play-r115 의 9%).
//  ④ 본편 몹을 맵 곳곳에 무리째 흩어 둔다(한쪽 길목에 몰리지 않게).
//  storyworld.r170.combat {quietTells:false,towers:false,treeShadow:true,spread:false} 로 각각 되돌린다.
(()=>{'use strict';
if(window.__STORYWORLD_COMBAT_R170__)return;
const REV='R170-combat-1',KEY='storyworld.r170.combat';
let prefs={quietTells:true,towers:true,treeShadow:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={muted:0,towers:0,casts:0,summons:0,towerDraws:0,treeShadowsSkipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const live=()=>typeof started!=='undefined'&&started&&typeof player==='object'&&player&&typeof room==='object'&&room;
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const major=e=>!!(e?.boss||e?.midboss||e?.persona||e?.trial||e?.cosmic);

const SENT={type:'r170-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i<0){SENT.age=0;effects.push(SENT);}else if(i!==effects.length-1){effects.splice(i,1);effects.push(SENT);}}}catch(_){}}// 맨 뒤에 — 코어 빛구슬(pixelfx) 위에 인장이 보이게
function disarm(){try{if(typeof effects!=='undefined'){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}

// ---- ① 공격 예고 이름표·화살표 ----------------------------------------------------------------------
const LABELS=new Set(['근접 공격 준비','원거리 조준']);
const norm=c=>String(c).replace(/\s+/g,'').toLowerCase();
const BOX=new Set(['rgba(14,13,15,.92)','rgba(14,13,15,0.92)'].map(norm));
const TELL=new Set(['#b89a71','#bd8065','#e2c18b','#d79b70','rgba(12,10,12,.95)','rgba(12,10,12,0.95)'].map(norm));
function muted(c,fn){const own=k=>Object.prototype.hasOwnProperty.call(c,k),keys=['fillRect','rect','fillText','stroke','strokeRect','setLineDash'],had={},old={};for(const k of keys){had[k]=own(k);old[k]=c[k];}let skipRect=false;
 c.fillRect=function(...a){if(BOX.has(norm(this.fillStyle))){skipRect=true;stats.muted++;return;}return old.fillRect.apply(this,a);};
 c.rect=function(...a){if(skipRect){skipRect=false;return;}return old.rect.apply(this,a);};
 c.strokeRect=function(...a){if(TELL.has(norm(this.strokeStyle)))return;return old.strokeRect.apply(this,a);};
 c.fillText=function(t,...a){if(LABELS.has(String(t)))return;return old.fillText.call(this,t,...a);};
 c.stroke=function(...a){if(TELL.has(norm(this.strokeStyle)))return;return old.stroke.apply(this,a);};
 try{return fn();}finally{for(const k of keys){if(had[k])c[k]=old[k];else delete c[k];}}}
const telling=e=>!!e&&!major(e)&&e.hp>0&&(e.attack&&!e.attack.committed||e.rangedWindup>0);

// ---- ② 피의 탑 -------------------------------------------------------------------------------
const SCULPT='assets/r161/sculpture/memory-fragment.webp';
const STATUE=/statue|effigy|shrine|obelisk|pillar|idol|monument|altar|grave|anchor|vat|pylon|reliquary|memorial|seal/i;
const samongRoom=()=>!!room?.samongR103;
function zoneMode(){try{const z=window.__STORYWORLD_SAMONG_ZONES_R115__?.zone?.(room.samongR103?.zone);return z?.mode||(z?.kind==='combat'?'C':z?.kind||'');}catch(_){return'';}}
function artFor(){if(samongRoom())return{path:SCULPT,name:'세뇌당한 기억의 조각',h:170};
 try{const reg=regionById?.[room.id];const list=(reg?.regionObjects6||[]).map(o=>typeof o==='string'?{path:o}:o).filter(o=>o&&STATUE.test(String(o.path||'')));if(!list.length)return null;
  const o=list[0];return{path:o.path,name:String(o.name||o.label||o.title||'').trim()||null,h:Math.max(150,(Number(o.height)||100)*1.7)};}catch(_){return null;}}
const SPECIAL=new Set(['ep1a08']);// 특수 병동(본편 미로 진행·집결 규칙)은 손대지 않는다
function wanted(){if(!live()||!solo()||SPECIAL.has(room.id))return 0;if(samongRoom()){const m=zoneMode();return m==='F'?6:m==='B'||m==='D'||m==='G'?2:m==='H'||m==='C'||m==='combat'?1:0;}// R173: F(조각 깨기)는 6개
 try{if(typeof safeRegion==='function'&&safeRegion())return 0;}catch(_){}return (room.enemies||[]).filter(e=>e.hp>0&&!major(e)).length>=20?1:0;}
const okCell=(x,y)=>{try{return typeof blocked!=='function'||[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].every(([a,b])=>!blocked(x+a*.8,y+b*.8,.3,room));}catch(_){return true;}};
function spotFor(n,taken){const L=room.exploration;if(!L?.floorCells?.length)return null;const path=window.__STORYWORLD_PLAY_R169__?.pathCells?.(room)||null,entry=L.entry||room.r72Entry||player;
 const offPath=(x,y)=>{if(!path)return true;for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(path.has((Math.floor(x)+dx)+','+(Math.floor(y)+dy))&&Math.hypot(Math.floor(x)+dx+.5-x,Math.floor(y)+dy+.5-y)<1.6)return false;return true;};
 let h=(String(room.id).length*7919+n*104729)>>>0;for(let t=0;t<300;t++){h=Math.imul(h^(h>>>13),0x5bd1e995)>>>0;const c=L.floorCells[h%L.floorCells.length],x=c[0]+.5,y=c[1]+.5,d=Math.hypot(x-entry.x,y-entry.y);
  const gap=zoneMode()==='F'?3.5:6;if(d<(gap<6?4:7)||d>26||taken.some(q=>Math.hypot(q.x-x,q.y-y)<gap)||!okCell(x,y)||(gap>=6&&!offPath(x,y)))continue;return{x,y};}return null;}
function towers(){return (room?.enemies||[]).filter(e=>e.r170Tower);}
let placedKey='',storyAt=0,spotKey='',spot0=null;
function nearSpot(){const key=String(room.id);if(spotKey!==key){spotKey=key;spot0=wanted()?spotFor(0,[]):null;}return !!spot0&&Math.hypot(spot0.x-player.x,spot0.y-player.y)<10;}
function place(){const want=prefs.towers?wanted():0,key=String(room.id)+':'+String(room.samongR103?.zone||''),x=room.samongR103;if(!want){placedKey=key;if(x&&x.r173PlacedKey!==key){x.r173PlacedKey=key;x.r173Need=0;}return;}if(placedKey===key)return;// 한 구역에 한 번만(깨진 탑이 다시 서지 않게)
 if(x&&x.r173PlacedKey===key){placedKey=key;return;}// 같은 방 객체로 다시 들어와도 깨진 탑은 다시 서지 않는다
 const art=artFor();if(!art)return;const donor=(room.enemies||[]).find(e=>e.hp>0&&!major(e)&&!e.r170Tower);if(!donor)return;placedKey=key;
 let atk=40;try{atk=Math.max(1,Number(attackPower())||40);if(player.samong>0)atk/=7;else if(player.ego>0)atk/=1.55*(1+.07*Math.max(0,(player.egoStackR169||1)-1));}catch(_){}/* 잠깐 버프(사몽·EGO) 뺀 값 */const snap=JSON.stringify(donor),taken=[];
 for(let n=towers().length;n<want;n++){const at=spotFor(n,taken);if(!at)break;taken.push(at);let e;try{e=JSON.parse(snap);}catch(_){break;}
  Object.assign(e,{id:'r170:tower:'+room.id+':'+n,x:at.x,y:at.y,homeX:at.x,homeY:at.y,nav:[],navAt:0,attack:null,rangedWindup:0,deadRecorded:false,spawnState:'active',
   r170Tower:{art:art.path,h:art.h,next:T()+3,casts:0,summoned:0,snap},r75Tower:true,r61PreserveHealth:true,speed:0,ai:'melee',samongElite:false,samongSurvival:false,r162Lane:false,samongSubR170:false,
   name:art.name||'피의 육망성 조형물'});
  e.maxHp=e.hp=Math.round(samongRoom()?atk*25:Math.max(60,(Number(donor.maxHp)||60)*6));e.damage=(Number(donor.damage)||10)*1.3;e.defScale=1;e.cd=99;
  room.enemies.push(e);stats.towers++;if(x)x.r173Towers=(x.r173Towers||0)+1;try{if(typeof ensureImages==='function')ensureImages([art.path]);}catch(_){}}
 if(x){x.r173PlacedKey=key;x.r173Need=x.r173Towers||0;}}// 실제로 선 수(자리가 모자라면 6보다 적다) — F 구역 문 조건은 이 수를 따른다
function palOf(e){if(e.r170Tower.pal)return e.r170Tower.pal;const P=window.__STORYWORLD_COMBAT_R114__?.palette;let pl=null;try{pl=P?P(JSON.parse(e.r170Tower.snap)):null;}catch(_){}
 return e.r170Tower.pal=pl?{main:{a:pl.p,b:pl.gp},sub:{a:pl.s,b:pl.gs}}:{main:{a:[90,12,20],b:[255,120,110]},sub:{a:[40,6,10],b:[200,60,60]}};}
function cast(e){const t=e.r170Tower;t.casts++;stats.casts++;const px=player.x,py=player.y,warn=1.3,dmg=e.damage;
 hazards.push({id:++uid,type:'field',owner:e.id,x:px,y:py,radius:1.7,age:0,warning:warn,life:warn+.9,asset:typeof VFX!=='undefined'?VFX.mark:null,damage:dmg,lastHit:-99,samongPattern:'r170-hex',r170:{tower:e.id,pal:palOf(e),seed:Math.random()*6,burst:false}});
 if(t.casts%2===0&&t.summoned<12){const live=(room.enemies||[]).filter(x=>x.hp>0).length;if(live<70)for(let k=0;k<2;k++){let m;try{m=JSON.parse(t.snap);}catch(_){break;}const a=Math.random()*6.28;
   Object.assign(m,{id:'r170:sum:'+e.id+':'+(t.summoned++),x:px+Math.cos(a)*1.1,y:py+Math.sin(a)*1.1,homeX:px,homeY:py,nav:[],navAt:0,attack:null,rangedWindup:0,deadRecorded:false,spawnState:'active',cd:1.6+k*.4,r170Summoned:true});
   m.hp=m.maxHp;if(typeof blocked==='function'&&blocked(m.x,m.y,.25,room)){m.x=px;m.y=py;}room.enemies.push(m);stats.summons++;}}}
function towerTick(){for(const e of towers()){if(e.hp<=0)continue;e.cd=Math.max(e.cd||0,9);e.attack=null;e.rangedWindup=0;const t=e.r170Tower;
  if(Math.hypot(player.x-e.x,player.y-e.y)>11){t.next=Math.max(t.next,T()+1.5);continue;}if(T()>=t.next){t.next=T()+6;cast(e);}}}
// 피의 육망성 → 촉수
function hexPath(c,r,rot){c.beginPath();for(let k=0;k<2;k++){for(let i=0;i<=3;i++){const a=rot+k*Math.PI/3+i*2*Math.PI/3,x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}}}
function drawHex(h){const q=project(h.x,h.y),w=h.radius*Math.SQRT2*Math.abs(project(h.x+1,h.y).x-q.x),// 마름모 격자: 반지름 r칸 = 화면 가로 반폭 r·√2·(한 칸 가로)
 warn=h.age<h.warning,u=warn?h.age/Math.max(.01,h.warning):1,P=h.r170.pal,S=SPR(),hh=H();
 ctx.save();try{ctx.translate(q.x,q.y);ctx.save();ctx.scale(1,.5);ctx.globalAlpha*=warn?.75+.25*u:Math.max(0,Math.min(1,(h.life-h.age)*3));
  ctx.fillStyle='rgba(60,2,10,.62)';ctx.beginPath();ctx.arc(0,0,w*(warn?.4+.6*u:1),0,Math.PI*2);ctx.fill();
  ctx.lineWidth=Math.max(2.5,3.6*(typeof zoom==='number'?zoom:1));ctx.strokeStyle='rgba(200,16,30,1)';ctx.shadowColor='rgba(255,50,60,.95)';ctx.shadowBlur=14;
  ctx.beginPath();ctx.arc(0,0,w,0,Math.PI*2*Math.min(1,u*1.2));ctx.stroke();ctx.beginPath();ctx.arc(0,0,w*.93,0,Math.PI*2);ctx.lineWidth*=.45;ctx.stroke();ctx.lineWidth/=.45;hexPath(ctx,w*.86,-Math.PI/2+h.r170.seed*.1);ctx.globalAlpha*=Math.min(1,.4+u*1.2);ctx.stroke();ctx.restore();
  if(warn&&S){S.draw('ring',P.main,0,0,w*2.2,w*1.2,{alpha:.55+.35*u,overHero:true});S.draw('glow',{a:[120,8,16],b:[255,90,90]},0,-hh*.05,w*1.4*u,w*.7*u,{alpha:.45*u,overHero:true});}
  if(!warn&&S){const v=Math.min(1,(h.age-h.warning)/.25),n=7;for(let i=0;i<n;i++){const a=h.r170.seed+i*2*Math.PI/n,rr=w*(.25+.55*((i*37)%7)/7),x=Math.cos(a)*rr,y=Math.sin(a)*rr*.55,len=hh*(1.1+.5*((i*13)%5)/5)*v;
    S.draw('spike',P.main,x,y,hh*.3,len,{pivot:[.5,1],angle:Math.sin(T()*3+i)*.18,alpha:.95,blend:'source-over',overHero:true});S.draw('spike',P.sub,x+hh*.05,y,hh*.16,len*.8,{pivot:[.5,1],angle:Math.sin(T()*3+i+1)*.22,alpha:.8,overHero:true});}
   S.draw('glow',P.main,0,-hh*.2,w*1.6,w*.9,{alpha:.5*(1-v*.5),overHero:true});}}finally{ctx.restore();}
 if(!warn&&!h.r170.burst){h.r170.burst=true;try{window.__STORYWORLD_PIXELFX_R163__?.play('tendrils-blood',h.x,h.y,{k:1.1});}catch(_){}}}
// R173 G: 위로 오르는 정화의 코어(청록 빛구슬 + 체력 막대).
function drawLight(c){const q=project(c.x,c.y),hh=H(),S=SPR(),T0=T(),hit=c.hp<c.max&&(c.lastHp??c.hp)>c.hp;c.lastHp=c.hp;const HOLY={a:[20,90,90],b:[200,255,240]},pulse=1+.06*Math.sin(T0*4);
 try{window.__STORYWORLD_PIXELFX_R163__?.play('core-orb-teal',c.x,c.y,{loop:true,key:'r173-light',k:.9,z:hh*.35,until:T0+.4});}catch(_){}
 ctx.save();try{if(S){S.draw('ring',HOLY,q.x,q.y,hh*1.8*pulse,hh*.9*pulse,{alpha:.7,overHero:true});S.draw('glow',hit?{a:[120,10,20],b:[255,90,90]}:HOLY,q.x,q.y-hh*.6,hh*1.8,hh*1.8,{alpha:.7,overHero:true});}
  const W=hh*1.5,y=q.y-hh*1.45,r=Math.max(0,Math.min(1,c.hp/c.max));ctx.fillStyle='rgba(4,6,8,.85)';ctx.fillRect(q.x-W/2-1,y-1,W+2,7);ctx.fillStyle=r<.3?'#d0605a':'#7fd8cc';ctx.fillRect(q.x-W/2,y,W*r,5);}finally{ctx.restore();}}
// R173(사용자 "정화의 코어에 J의 인장이 박혀 있고(작은 십자가 문양)"): 코어 빛구슬 한가운데에 작은 금빛 십자가(R106 칠한 cross). 빛구슬(pixelfx) 앞에 그려지도록 조금 앞자리 scope 로.
const SEAL_J={a:[60,36,8],b:[236,196,96]};// 흰 빛구슬 위에서도 보이게 짙은 금
function sealAt(x,y,lift){const S=SPR();if(!S)return;const q=project(x,y),hh=H(),f=()=>{const p=1+.05*Math.sin(T()*2.4);S.draw('cross',SEAL_J,q.x,q.y-hh*lift,hh*.5*p,hh*.64*p,{alpha:1,overHero:true,blend:'source-over'});S.draw('cross',{a:[200,160,70],b:[255,246,210]},q.x,q.y-hh*lift,hh*.3*p,hh*.4*p,{alpha:.8,overHero:true});};
 if(typeof ctx.scope==='function')ctx.scope({id:'r173:seal:'+x.toFixed(1),kind:'effect',x:x+.8,y:y+.8},f);else f();}
function seals(){const x=room?.samongR103;if(!x)return;const lc=x.r173Light;if(lc)sealAt(lc.x,lc.y,1.05);const core=room.exploration?.samongR103?.core,z=(()=>{try{return window.__STORYWORLD_SAMONG_ZONES_R115__?.zone?.(x.zone);}catch(_){return null;}})();if(core&&z?.mode==='D')sealAt(core.x,core.y,1.2);}
function drawTower(e){const t=e.r170Tower,row=typeof readyImage==='function'?readyImage(t.art):null,q=project(e.x,e.y),hh=t.h*(typeof zoom==='number'?zoom:1),dead=e.hp<=0,age=dead?T()-(e.deadAt||T()):0;if(dead&&age>1)return;
 const P=palOf(e),S=SPR(),charge=Math.max(0,1-(t.next-T())/1.3);
 ctx.save();try{ctx.globalAlpha*=dead?Math.max(0,1-age):1;if(S)S.draw('glow',P.main,q.x,q.y-hh*.1,hh*1.1,hh*.45,{alpha:.25+.45*charge});
  if(row){if(typeof shadow==='function')shadow(q.x,q.y,hh*.32);if(typeof sprite==='function')sprite(t.art,q.x,q.y,hh,{filter:e.flash>0?'brightness(1.7)':'saturate(.9) contrast(1.05)'});}
  if(S&&charge>0)S.draw('flare',P.main,q.x,q.y-hh*.75,hh*.5*charge,hh*.5*charge,{angle:T(),alpha:charge*.8,overHero:true});
  const W=hh*.55,y=q.y-hh-8,r=Math.max(0,Math.min(1,e.hp/Math.max(1,e.maxHp)));ctx.fillStyle='rgba(4,4,6,.85)';ctx.fillRect(q.x-W/2-1,y-1,W+2,6);ctx.fillStyle='#b8323a';ctx.fillRect(q.x-W/2,y,W*r,4);}finally{ctx.restore();}stats.towerDraws++;}

// ---- ④ 본편 몹을 맵 곳곳에(사용자 "스토리모드 몹 분포 맵 곳곳에, 한쪽 길목에 몰지 말고") ----------------------------------
//  맵에 들어설 때 아직 싸우지 않은 일반 몹을 셋까지의 무리(첫 몹에서 2.5칸 안)로 묶고, 바닥 칸에서 '가장 먼 점 고르기'로 고른 자리들(입구에서 8칸 넘게,
//  무리끼리 7칸 넘게, 사방이 트인 곳)에 무리째 옮긴다. 보스·중간보스·나중에 오는 물결·탑은 그대로. storyworld.r170.combat {spread:false}.
function spreadStory(){if(prefs.spread===false||!live()||!solo()||samongRoom()||SPECIAL.has(room.id))return;try{if(typeof safeRegion==='function'&&safeRegion())return;}catch(_){}
 const L=room.exploration;if(!L?.floorCells?.length||room.engaged||room.r170Spread===room.id)return;const mobs=(room.enemies||[]).filter(e=>e.hp>0&&!major(e)&&!e.r170Tower&&e.spawnState==='active'&&!e.attack);if(mobs.length<6)return;
 room.r170Spread=room.id;const entry=L.entry||room.r72Entry||player,packs=[];for(const e of mobs){let p=packs.find(k=>k.length<3&&Math.hypot(k[0].x-e.x,k[0].y-e.y)<2.5);if(p)p.push(e);else packs.push([e]);}// 무리는 셋까지 — 길목에 줄지어 있던 몹이 하나로 뭉쳐 그대로 남지 않게
 const cand=[];let h=(String(room.id).length*2654435761)>>>0;for(let t=0;t<900&&cand.length<420;t++){h=Math.imul(h^(h>>>15),0x2c1b3c6d)>>>0;const c=L.floorCells[h%L.floorCells.length],x=c[0]+.5,y=c[1]+.5;if(Math.hypot(x-entry.x,y-entry.y)<8||!okCell(x,y))continue;cand.push({x,y});}
 if(cand.length<packs.length)return;const chosen=[],far=q=>Math.min(Math.hypot(q.x-entry.x,q.y-entry.y)*.6,...chosen.map(c=>Math.hypot(c.x-q.x,c.y-q.y)));
 for(let i=0;i<packs.length;i++){let best=null,bd=-1;for(const q of cand){const d=chosen.length?far(q):Math.hypot(q.x-entry.x,q.y-entry.y)*((i*7919)%5+1);if(d>bd){bd=d;best=q;}}if(!best)break;chosen.push(best);}
 packs.forEach((pk,i)=>{const at=chosen[i];if(!at)return;const cx=pk.reduce((s,e)=>s+e.x,0)/pk.length,cy=pk.reduce((s,e)=>s+e.y,0)/pk.length;
  for(const e of pk){let x=at.x+Math.max(-1.6,Math.min(1.6,e.x-cx)),y=at.y+Math.max(-1.6,Math.min(1.6,e.y-cy));if(typeof blocked==='function'&&blocked(x,y,.3,room)){x=at.x;y=at.y;}e.x=e.homeX=x;e.y=e.homeY=y;e.nav=[];e.navAt=0;stats.spread=(stats.spread||0)+1;}});
 stats.packs=packs.length;}

// ---- 설치 -------------------------------------------------------------------------------------
try{
 if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){
   // 탑은 본편 몹 그림 대신 조형물 그림만 그린다(전역 readyImage 를 가리면 영웅 그림 고르기까지 흔들려 직접 그린다).
   if(e?.r170Tower){try{const f=()=>drawTower(e);if(typeof ctx.scope==='function')ctx.scope({id:'r170:tower:'+e.id,kind:'enemy',x:e.x,y:e.y},f);else f();}catch(err){fail(err);}return;}
   if(prefs.quietTells&&telling(e)&&typeof ctx!=='undefined'&&ctx)return muted(ctx,()=>base.apply(this,[e,...a]));
   return base.apply(this,[e,...a]);};}
 // 바닥 예고 칸(drawHazard)에 그린 선은 Three 렌더러에서 거의 보이지 않아(R167 육망성처럼) 이펙트 칸에서 그린다. 본편 금빛 예고는 끈다.
 if(typeof drawHazard==='function'){const base=drawHazard;drawHazard=function(h,...a){if(h?.samongPattern==='r170-hex'&&h.r170)return;return base.apply(this,[h,...a]);};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(ef,...a){if(ef&&ef.type==='r170-fx'){try{seals();}catch(err){fail(err);}try{const lc=room?.samongR103?.r173Light;if(lc){const f=()=>drawLight(lc);if(typeof ctx.scope==='function')ctx.scope({id:'r173:light',kind:'effect',x:lc.x,y:lc.y},f);else f();}}catch(err){fail(err);}try{for(const h of hazards)if(h?.r170&&h.age<h.life){const f=()=>drawHex(h);if(typeof ctx.scope==='function')ctx.scope({id:'r170:hex:'+h.id,kind:'effect',x:h.x,y:h.y},f);else f();stats.hexDraws=(stats.hexDraws||0)+1;}}catch(err){fail(err);}return;}return base.apply(this,[ef,...a]);};}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(!prefs.treeShadow&&p&&(p.r99Tree||/tree/i.test(String(p.path||'')))&&typeof shadow==='function'){const sh=shadow;shadow=function(){stats.treeShadowsSkipped++;};try{return base.apply(this,[p,...a]);}finally{shadow=sh;}}return base.apply(this,[p,...a]);};}
// 탑: 사몽은 적이 나온 뒤, 본편은 들어선 지 6초 뒤 영웅이 탑 자리 10칸 안에 왔을 때 처음 선다(저장에는 들어가지 않아 다시 오면 새로 선다).
 if(typeof tick==='function'){const base=tick;let at=0;tick=function(...a){const r=base.apply(this,a);try{if(live()&&prefs.towers){if(T()>=at||T()<at-5){at=T()+.7;if(samongRoom())place();else if(T()>=storyAt&&nearSpot())place();}towerTick();}if(live()){if(typeof hazards!=='undefined'&&hazards.some(h=>h?.r170)||room?.samongR103?.r173Light||zoneMode()==='D')arm();else disarm();}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);placedKey='';storyAt=T()+6;const restore=a.some(x=>x&&typeof x==='object'&&x.restore===true);// 저장 불러오기는 자리·적 목록을 그대로
   if(r!==false&&!restore)try{spreadStory();}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_COMBAT_R170__=Object.freeze({revision:REV,set,nextSpot:()=>{try{nearSpot();}catch(_){}return spot0?{...spot0}:null;},towers:()=>towers().map(e=>({id:e.id,name:e.name,x:e.x,y:e.y,hp:e.hp,art:e.r170Tower.art})),cast:e=>cast(e),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},towers:live()?towers().length:0,lastError})});
})();
