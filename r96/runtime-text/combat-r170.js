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
const stats={muted:0,towers:0,casts:0,summons:0,towerDraws:0,treeShadowsSkipped:0,reskinned:0,errors:0};let lastError=null;
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
// R526(사용자 2026-11-10 "나오면 안되는 조형물"): 빈 기념비(기와지붕 게시판, blank_memorial)는 R272 에서 본편 어디에도 두지 않기로 한 그림인데, 조형물만 빼고 탑(적) 그림으로는 남아 있었다.
//  → 그 그림이 뽑히던 지역(8곳)의 탑은 피의 제단으로 선다(실내 지역에 무너진 돌기둥을 세우지 않으려고 목록의 다음 석상으로 넘기지 않는다). 다른 지역은 그대로.
//  탑 수·자리·체력·공격은 그대로이고, 이미 서 있던 탑은 다음 틱에 그림만 바뀐다.
const RETIRED=/(^|\/)blank_memorial\.webp$/,ALTAR='assets/props/v290/blood_altar.webp';
const canonArt=path=>{try{const P=window.__STORYWORLD_PROPS_R272__;return !P?.fitPath||typeof room==='undefined'||P.fitPath(path,room)===true;}catch(_){return true;}};// R830: 그 지역에 못 서는 그림(실내의 피분수 등)은 탑 그림으로도 안 쓴다
function artOf(objects){const list=(objects||[]).map(o=>typeof o==='string'?{path:o}:o).filter(o=>o&&STATUE.test(String(o.path||''))&&canonArt(o.path));if(!list.length)return null;
 const o=list[0];if(RETIRED.test(String(o.path||'')))return{path:ALTAR,name:null,h:150};
 return{path:o.path,name:String(o.name||o.label||o.title||'').trim()||null,h:Math.max(150,(Number(o.height)||100)*1.7)};}
function artFor(){if(samongRoom())return{path:SCULPT,name:'세뇌당한 기억의 조각',h:170};
 try{return artOf(regionById?.[room.id]?.regionObjects6);}catch(_){return null;}}
const SPECIAL=new Set(['ep1a08']);// 특수 병동(본편 미로 진행·집결 규칙)은 손대지 않는다
// R830(사용자 2026-11-12 "피의 육망성 조형물도 에피소드 1a 약물중독쪽에만"): 본편의 피의 육망성 조형물은 1부 지역에만 선다(규칙은 props-r272 towerOk, 사몽 구역의 기억 조각은 그대로).
const canonTower=()=>{try{const P=window.__STORYWORLD_PROPS_R272__;return !P?.towerOk||P.towerOk(room)!==false;}catch(_){return true;}};
// R1206(사용자 2026-11-19 "세뇌당한 기억의 조각은 각 맵당 1개체만 나오게, 빈자리는 그 맵 다른 몹으로 메꿔"): 사몽 구역의 조각은 많아야 1개.
//  예전 수(F 6·B/D/G 2·H/C 1) 중 빠진 자리는 그 맵 잡몹(조각을 본뜬 몹과 같은 몹)으로 채운다. F 구역 문 조건(r173Need)은 실제로 선 수(1)를 따른다.
function samongPlan(m){const old=m==='F'?6:m==='B'||m==='D'||m==='G'?2:m==='H'||m==='C'||m==='combat'?1:0;const towers=Math.min(1,old);return{old,towers,fill:old-towers};}
function wanted(){if(!live()||!solo()||SPECIAL.has(room.id))return 0;if(!canonTower())return 0;if(samongRoom())return samongPlan(zoneMode()).towers;// R173: F(조각 깨기)는 6개 → R1206: 1개
 try{if(typeof safeRegion==='function'&&safeRegion())return 0;}catch(_){}return (room.enemies||[]).filter(e=>e.hp>0&&!major(e)).length>=20?1:0;}
const okCell=(x,y)=>{try{return typeof blocked!=='function'||[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].every(([a,b])=>!blocked(x+a*.8,y+b*.8,.3,room));}catch(_){return true;}};
function spotFor(n,taken){const L=room.exploration;if(!L?.floorCells?.length)return null;const path=window.__STORYWORLD_PLAY_R169__?.pathCells?.(room)||null,entry=L.entry||room.r72Entry||player;
 const offPath=(x,y)=>{if(!path)return true;for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(path.has((Math.floor(x)+dx)+','+(Math.floor(y)+dy))&&Math.hypot(Math.floor(x)+dx+.5-x,Math.floor(y)+dy+.5-y)<1.6)return false;return true;};
 let h=(String(room.id).length*7919+n*104729)>>>0;for(let t=0;t<300;t++){h=Math.imul(h^(h>>>13),0x5bd1e995)>>>0;const c=L.floorCells[h%L.floorCells.length],x=c[0]+.5,y=c[1]+.5,d=Math.hypot(x-entry.x,y-entry.y);
  const gap=zoneMode()==='F'?3.5:6;if(d<(gap<6?4:7)||d>26||taken.some(q=>Math.hypot(q.x-x,q.y-y)<gap)||!okCell(x,y)||(gap>=6&&!offPath(x,y)))continue;return{x,y};}return null;}
function towers(){return (room?.enemies||[]).filter(e=>e.r170Tower);}
let placedKey='',storyAt=0,spotKey='',spot0=null;
function nearSpot(){const key=String(room.id);if(spotKey!==key){spotKey=key;spot0=wanted()?spotFor(0,[]):null;}return !!spot0&&Math.hypot(spot0.x-player.x,spot0.y-player.y)<10;}
// R795: 본뜰 잡몹을 글자로 떠 둘 때 방 객체·자기 자신을 가리키는 필드는 뺀다 — R390 이 싸움에 든 몹에 e.r390Engaged = 방 객체를 적어 두는데,
//  그대로 JSON.stringify 하면 순환 참조로 터져 조형물이 서지 않았고(방은 '이미 세움'으로 적혀 다시 시도도 안 함) 방 전체를 떠 넣을 뻔했다.
function snapOf(e){const stack=[],R=typeof room==='object'?room:null;return JSON.stringify(e,function(k,v){if(k==='r390Engaged')return undefined;if(v&&typeof v==='object'){while(stack.length&&stack[stack.length-1]!==this)stack.pop();if(v===R||stack.includes(v))return undefined;stack.push(v);}return v;});}
function place(){const want=prefs.towers?wanted():0,key=String(room.id)+':'+String(room.samongR103?.zone||''),x=room.samongR103;if(!want){placedKey=key;if(x&&x.r173PlacedKey!==key){x.r173PlacedKey=key;x.r173Need=0;}return;}if(placedKey===key)return;// 한 구역에 한 번만(깨진 탑이 다시 서지 않게)
 if(x&&x.r173PlacedKey===key){placedKey=key;return;}// 같은 방 객체로 다시 들어와도 깨진 탑은 다시 서지 않는다
 const art=artFor();if(!art)return;const donor=(room.enemies||[]).find(e=>e.hp>0&&!major(e)&&!e.r170Tower);if(!donor)return;placedKey=key;
 let atk=40;try{atk=Math.max(1,Number(attackPower())||40);if(player.samong>0)atk/=7;else if(player.ego>0)atk/=1.55*(1+.07*Math.max(0,(player.egoStackR169||1)-1));}catch(_){}/* 잠깐 버프(사몽·EGO) 뺀 값 */const snap=snapOf(donor),taken=[];
 for(let n=towers().length;n<want;n++){const at=spotFor(n,taken);if(!at)break;taken.push(at);let e;try{e=JSON.parse(snap);}catch(_){break;}
  Object.assign(e,{id:'r170:tower:'+room.id+':'+n,x:at.x,y:at.y,homeX:at.x,homeY:at.y,nav:[],navAt:0,attack:null,rangedWindup:0,deadRecorded:false,spawnState:'active',
   r170Tower:{art:art.path,h:art.h,next:T()+3,casts:0,summoned:0,snap},r75Tower:true,r61PreserveHealth:true,speed:0,ai:'melee',samongElite:false,samongSurvival:false,r162Lane:false,samongSubR170:false,
   name:art.name||'피의 육망성 조형물'});
  e.maxHp=e.hp=Math.round(samongRoom()?atk*25:Math.max(60,(Number(donor.maxHp)||60)*6));e.damage=(Number(donor.damage)||10)*1.3;e.defScale=1;e.cd=99;
  room.enemies.push(e);stats.towers++;if(x)x.r173Towers=(x.r173Towers||0)+1;try{if(typeof ensureImages==='function')ensureImages([art.path]);}catch(_){}}
 // R1206: 빠진 조각 자리는 그 맵 잡몹으로(조각 자리 후보에, 없으면 본뜬 몹 곁에). 한 구역에 한 번만(placedKey).
 if(samongRoom()){const fill=samongPlan(zoneMode()).fill;for(let n=0;n<fill;n++){const at=spotFor(want+n,taken)||{x:donor.x+Math.cos(n*2.4)*1.2,y:donor.y+Math.sin(n*2.4)*1.2};taken.push(at);let m;try{m=JSON.parse(snap);}catch(_){break;}
   Object.assign(m,{id:'r1206:fill:'+room.id+':'+n,x:at.x,y:at.y,homeX:at.x,homeY:at.y,nav:[],navAt:0,attack:null,rangedWindup:0,deadRecorded:false,spawnState:'active',r1206Fill:true});
   m.hp=m.maxHp;if(typeof blocked==='function'&&blocked(m.x,m.y,.25,room)){m.x=donor.x;m.y=donor.y;}room.enemies.push(m);stats.fills=(stats.fills||0)+1;}}
 if(x){x.r173PlacedKey=key;x.r173Need=x.r173Towers||0;}}// 실제로 선 수(자리가 모자라면 6보다 적다) — F 구역 문 조건은 이 수를 따른다
function palOf(e){if(e.r170Tower.pal)return e.r170Tower.pal;const P=window.__STORYWORLD_COMBAT_R114__?.palette;let pl=null;try{pl=P?P(JSON.parse(e.r170Tower.snap)):null;}catch(_){}
 return e.r170Tower.pal=pl?{main:{a:pl.p,b:pl.gp},sub:{a:pl.s,b:pl.gs}}:{main:{a:[90,12,20],b:[255,120,110]},sub:{a:[40,6,10],b:[200,60,60]}};}
function cast(e){const t=e.r170Tower;t.casts++;stats.casts++;const px=player.x,py=player.y,warn=1.3,dmg=e.damage;
 hazards.push({id:++uid,type:'field',owner:e.id,x:px,y:py,radius:1.7,age:0,warning:warn,life:warn+.9,asset:typeof VFX!=='undefined'?VFX.mark:null,damage:dmg,lastHit:-99,samongPattern:'r170-hex',r170:{tower:e.id,pal:palOf(e),seed:Math.random()*6,burst:false}});
 if(t.casts%2===0&&t.summoned<12){const live=(room.enemies||[]).filter(x=>x.hp>0).length;if(live<70)for(let k=0;k<2;k++){let m;try{m=JSON.parse(t.snap);}catch(_){break;}const a=Math.random()*6.28;
   Object.assign(m,{id:'r170:sum:'+e.id+':'+(t.summoned++),x:px+Math.cos(a)*1.1,y:py+Math.sin(a)*1.1,homeX:px,homeY:py,nav:[],navAt:0,attack:null,rangedWindup:0,deadRecorded:false,spawnState:'active',cd:1.6+k*.4,r170Summoned:true});
   m.hp=m.maxHp;if(typeof blocked==='function'&&blocked(m.x,m.y,.25,room)){m.x=px;m.y=py;}room.enemies.push(m);stats.summons++;try{const X=window.__STORYWORLD_PIXELFX_R163__;if(X?.has?.('pvfx-rift-portal'))X.play('pvfx-rift-portal',m.x,m.y,{k:.75,until:T()+1.6,fade:.5,tint:{a:[110,8,18],b:[255,96,96]}});}catch(_){}/* R178: 육망성에서 나오는 자리에 균열 문(CC0 PVFX, 핏빛). R440: 이 시트는 반복(loop)이라 until 없이 부르면 지역을 나갈 때까지 빨간 원 둘이 남았다 → 1.6초(두 바퀴) 뒤, 끝 0.5초 옅어지며 지운다 */}}}
function towerTick(){for(const e of towers()){if(RETIRED.test(String(e.r170Tower.art||''))){const a=artFor();if(a&&!RETIRED.test(String(a.path))){e.r170Tower.art=a.path;e.r170Tower.h=a.h;stats.reskinned++;try{if(typeof ensureImages==='function')ensureImages([a.path]);}catch(_){}}}/* R526 */if(e.hp<=0)continue;e.cd=Math.max(e.cd||0,9);e.attack=null;e.rangedWindup=0;const t=e.r170Tower;
  if(Math.hypot(player.x-e.x,player.y-e.y)>11){t.next=Math.max(t.next,T()+1.5);continue;}if(T()>=t.next){t.next=T()+6;cast(e);}}}
// 피의 육망성 → 촉수
function hexPath(c,r,rot){c.beginPath();for(let k=0;k<2;k++){for(let i=0;i<=3;i++){const a=rot+k*Math.PI/3+i*2*Math.PI/3,x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}}}
// R1206(사용자 2026-11-19 "육망성 원 … 실체화 자산으로"): 사몽의 기억의 조각이 거는 바닥 공격은 핏빛 육망성 대신 먹 번짐으로 그린다.
//  Dots 먹 번짐 시트(CX-0166SM C)가 오기 전 임시 코드 그림이다(최종 아트 아님). 본편 1부의 피의 육망성 조형물은 그대로. 끄기 storyworld.r170.combat {inkHex:false}.
const inkHex=()=>prefs.inkHex!==false&&samongRoom();
// R1206c: Dots CX-0166SM-C 먹 번짐 예고 8프레임(칸 256, 타원 216×90, 중심 128,128). 예고 진행도 u(0~1)로 프레임을 고르고 마지막 장에서 멈춘다. 시트가 아직 없으면 요청만 하고 false(코드 먹 번짐으로 버팀).
const INK_SHEET='assets/r1206/fx/ink-bloom-warn8.webp';
function inkSheet(g,w,u){if(prefs.inkSheet===false)return false;let row=null;try{row=typeof readyImage==='function'?readyImage(INK_SHEET):null;if(!row&&typeof addImage==='function')addImage(INK_SHEET);}catch(_){row=null;}
 if(!row?.image)return false;const n=8,cell=row.image.naturalWidth/n,f=Math.max(0,Math.min(n-1,Math.floor((Number(u)||0)*n))),s=2*w/216*(cell/256);
 g.drawImage(row.image,f*cell,0,cell,row.image.naturalHeight,-128*s,-128*s,cell*s,row.image.naturalHeight*s);stats.inkSheets=(stats.inkSheets||0)+1;return true;}
function inkBlot(g,w,grow,seed){if(!g)return;const r=w*Math.max(.05,Math.min(1,grow)),n=11;let k=(Math.abs(Math.floor(seed*1e4))%9973)+1;const rnd=()=>{k=(k*16807)%2147483647;return k/2147483647;};
 g.fillStyle='rgba(14,11,13,.55)';g.beginPath();for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,rr=r*(.78+.3*rnd());if(i===0)g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);else g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}g.closePath();g.fill();
 g.fillStyle='rgba(6,5,7,.62)';for(let i=0;i<6;i++){const a=rnd()*Math.PI*2,d=r*(.15+.45*rnd()),b=r*(.22+.2*rnd());g.beginPath();g.ellipse(Math.cos(a)*d,Math.sin(a)*d,b,b*(.7+.3*rnd()),a,0,Math.PI*2);g.fill();}
 /* 번진 가장자리: 어두운 바닥에서도 읽히게 한지빛 옅은 테(얼룩진 점들) */g.fillStyle='rgba(206,196,176,.16)';for(let i=0;i<16;i++){const a=i/16*Math.PI*2+rnd()*.3,d=r*(.86+.12*rnd()),b=r*(.05+.05*rnd());g.beginPath();g.ellipse(Math.cos(a)*d,Math.sin(a)*d,b*1.6,b,a,0,Math.PI*2);g.fill();}
 g.fillStyle='rgba(40,8,12,.38)';for(let i=0;i<9;i++){const a=rnd()*Math.PI*2,d=r*(.95+.25*rnd()),b=r*(.04+.06*rnd());g.beginPath();g.ellipse(Math.cos(a)*d,Math.sin(a)*d,b,b,0,0,Math.PI*2);g.fill();}}
function drawHex(h){const q=project(h.x,h.y),w=h.radius*Math.SQRT2*Math.abs(project(h.x+1,h.y).x-q.x),// 마름모 격자: 반지름 r칸 = 화면 가로 반폭 r·√2·(한 칸 가로)
 warn=h.age<h.warning,u=warn?h.age/Math.max(.01,h.warning):1,P=h.r170.pal,S=SPR(),hh=H();
 ctx.save();try{ctx.translate(q.x,q.y);/* R1260(사용자 2026-11-20 "시트그림으로 바꾸셈"): 터진 뒤에도 먹 번짐 시트 마지막 칸을 옅어지며 둔다 — 코드 얼룩은 시트가 아직 없을 때만 */let sheet=false;if(inkHex()){const a0=ctx.globalAlpha;ctx.globalAlpha=a0*(warn?1:Math.max(0,Math.min(1,(h.life-h.age)*3)));try{sheet=inkSheet(ctx,w,warn?u:1);}finally{ctx.globalAlpha=a0;}}ctx.save();ctx.scale(1,.5);ctx.globalAlpha*=warn?.75+.25*u:Math.max(0,Math.min(1,(h.life-h.age)*3));
  if(inkHex()){inkBlot(sheet?null:ctx,w,warn?.35+.65*u:1,h.r170.seed||0);ctx.restore();}else{
  ctx.fillStyle='rgba(60,2,10,.62)';ctx.beginPath();ctx.arc(0,0,w*(warn?.4+.6*u:1),0,Math.PI*2);ctx.fill();
  ctx.lineWidth=Math.max(2.5,3.6*(typeof zoom==='number'?zoom:1));ctx.strokeStyle='rgba(200,16,30,1)';ctx.shadowColor='rgba(255,50,60,.95)';ctx.shadowBlur=14;
  ctx.beginPath();ctx.arc(0,0,w,0,Math.PI*2*Math.min(1,u*1.2));ctx.stroke();ctx.beginPath();ctx.arc(0,0,w*.93,0,Math.PI*2);ctx.lineWidth*=.45;ctx.stroke();ctx.lineWidth/=.45;hexPath(ctx,w*.86,-Math.PI/2+h.r170.seed*.1);ctx.globalAlpha*=Math.min(1,.4+u*1.2);ctx.stroke();ctx.restore();}
  if(warn&&S){S.draw('ring',P.main,0,0,w*2.2,w*1.2,{alpha:.55+.35*u,overHero:true});S.draw('glow',{a:[120,8,16],b:[255,90,90]},0,-hh*.05,w*1.4*u,w*.7*u,{alpha:.45*u,overHero:true});}
  const PX=window.__STORYWORLD_PIXELFX_R163__,pxOn=!!PX?.has?.('tendrils-blood');// R176: 터진 뒤는 프레임 애니메이션(핏빛 촉수)만 — 한 장짜리 가시 늘이기는 시트가 없을 때만
  if(!warn&&S&&!pxOn){const v=Math.min(1,(h.age-h.warning)/.25),n=7;for(let i=0;i<n;i++){const a=h.r170.seed+i*2*Math.PI/n,rr=w*(.25+.55*((i*37)%7)/7),x=Math.cos(a)*rr,y=Math.sin(a)*rr*.55,len=hh*(1.1+.5*((i*13)%5)/5)*v;
    S.draw('spike',P.main,x,y,hh*.3,len,{pivot:[.5,1],angle:Math.sin(T()*3+i)*.18,alpha:.95,blend:'source-over',overHero:true});S.draw('spike',P.sub,x+hh*.05,y,hh*.16,len*.8,{pivot:[.5,1],angle:Math.sin(T()*3+i+1)*.22,alpha:.8,overHero:true});}
   S.draw('glow',P.main,0,-hh*.2,w*1.6,w*.9,{alpha:.5*(1-v*.5),overHero:true});}}finally{ctx.restore();}
 if(!warn&&!h.r170.burst){h.r170.burst=true;try{const X=window.__STORYWORLD_PIXELFX_R163__,sd=h.r170.seed||0;X?.play('tendrils-blood',h.x,h.y,{k:1.7});/* R250: 영웅 발밑 촉수를 더 크게(작아서 안 보였음) */for(let i=0;i<2;i++){const a=sd+i*Math.PI+.6;X?.play('tendrils-blood',h.x+Math.cos(a)*h.radius*.45,h.y+Math.sin(a)*h.radius*.45,{k:1.2,delay:.08+.1*i,flip:i===1});}}catch(_){}}}
// R173 G: 위로 오르는 정화의 코어(청록 빛구슬 + 체력 막대).
function drawLight(c){const q=project(c.x,c.y),hh=H(),S=SPR(),T0=T(),hit=c.hp<c.max&&(c.lastHp??c.hp)>c.hp;c.lastHp=c.hp;const HOLY={a:[20,90,90],b:[200,255,240]},pulse=1+.06*Math.sin(T0*4);
 try{window.__STORYWORLD_PIXELFX_R163__?.play('core-orb-teal',c.x,c.y,{loop:true,key:'r173-light',k:.9,z:hh*.35,until:T0+.4});}catch(_){}
 ctx.save();try{if(S){S.draw('ring',HOLY,q.x,q.y,hh*1.8*pulse,hh*.9*pulse,{alpha:.7,overHero:true});S.draw('glow',hit?{a:[120,10,20],b:[255,90,90]}:HOLY,q.x,q.y-hh*.6,hh*1.8,hh*1.8,{alpha:.7,overHero:true});}
  const W=hh*1.5,y=q.y+Math.max(8,hh*.14),r=Math.max(0,Math.min(1,c.hp/c.max));ctx.fillStyle='rgba(4,6,8,.85)';ctx.fillRect(q.x-W/2-1,y-1,W+2,7);ctx.fillStyle=r<.3?'#d0605a':'#7fd8cc';ctx.fillRect(q.x-W/2,y,W*r,5);}finally{ctx.restore();}}
// R173(사용자 "정화의 코어에 J의 인장이 박혀 있고(작은 십자가 문양)"): 코어 빛구슬 한가운데에 작은 금빛 십자가(R106 칠한 cross). 빛구슬(pixelfx) 앞에 그려지도록 조금 앞자리 scope 로.
const SEAL_J={a:[60,36,8],b:[236,196,96]};// 흰 빛구슬 위에서도 보이게 짙은 금
function sealAt(x,y,lift){const S=SPR();if(!S)return;const q=project(x,y),hh=H(),f=()=>{const p=1+.05*Math.sin(T()*2.4);S.draw('cross',SEAL_J,q.x,q.y-hh*lift,hh*.5*p,hh*.64*p,{alpha:1,overHero:true,blend:'source-over'});S.draw('cross',{a:[200,160,70],b:[255,246,210]},q.x,q.y-hh*lift,hh*.3*p,hh*.4*p,{alpha:.8,overHero:true});};
 if(typeof ctx.scope==='function')ctx.scope({id:'r173:seal:'+x.toFixed(1),kind:'effect',x:x+.8,y:y+.8},f);else f();}
function seals(){const x=room?.samongR103;if(!x)return;const lc=x.r173Light;if(lc)sealAt(lc.x,lc.y,1.05);const core=room.exploration?.samongR103?.core,z=(()=>{try{return window.__STORYWORLD_SAMONG_ZONES_R115__?.zone?.(x.zone);}catch(_){return null;}})();if(core&&z?.mode==='D')sealAt(core.x,core.y,1.2);}
// R596(사용자 2026-11-10 "분수대 아래 단순한 원형 그림자가 남은 문제(그림자가 사실적이지 않음)"): 탑(corrupted_shrine 등 조형물 그림)은 적이라 R329 조형물 그림자를 타지 않고
//  엔진 둥근 발밑 그림자(shadow 타원)만 받았다 → 타원 대신 R329/R448 과 같은 한 방향(광원 왼쪽 위) 실루엣 그림자: 같은 그림을 brightness(0) 로 납작하게 눌러 오른쪽 바닥으로 세 장 계단처럼 눕힌다.
//  밑동은 겹쳐 진하고(접지) 끝은 옅다. 앞(화면 아래)으로는 눕지 않는다. Three 기록기에서 되는 translate·scale·brightness 만 쓴다(shear·blur 금지).
const TS_LEN=.5,TS_LEAN=.8,TS_RISE=.03,TS_ALPHA=.21,TS_STEPS=[1/3,2/3,1],TS_MAXPX=150;
function towerShadow(e,path,x,footY,h){const z=typeof zoom==='number'&&zoom>0?zoom:1,lean=Math.min(h*TS_LEAN*TS_LEN,TS_MAXPX*z);
 const paint=()=>{for(const t of TS_STEPS){ctx.save();try{ctx.translate(x+lean*t,footY-h*TS_RISE*t);ctx.scale(1,TS_LEN*t);ctx.translate(-x,-footY);sprite(path,x,footY,h,{alpha:TS_ALPHA,filter:'brightness(0)'});}finally{ctx.restore();}}stats.towerShadows=(stats.towerShadows||0)+1;};
 if(typeof ctx.scope==='function')ctx.scope({id:'r596:tower-shadow:'+e.id,/* 월드 좌표 열쇠(카메라가 움직여도 같은 명령) */kind:'effect',x:e.x,y:e.y,groundAligned:true,r329Shadow:true},paint);else paint();}
function drawTower(e){const t=e.r170Tower,row=typeof readyImage==='function'?readyImage(t.art):null,q=project(e.x,e.y),hh=t.h*(typeof zoom==='number'?zoom:1),dead=e.hp<=0,age=dead?T()-(e.deadAt||T()):0;if(dead&&age>1)return;
 const P=palOf(e),S=SPR(),charge=Math.max(0,1-(t.next-T())/1.3);
 ctx.save();try{ctx.globalAlpha*=dead?Math.max(0,1-age):1;if(S&&charge>0)S.draw('glow',P.main,q.x,q.y-hh*.1,hh*1.1,hh*.45,{alpha:.7*charge});/* R596: 늘 깔던 발밑 타원 빛무리(.25)는 어두운 탑 색이라 화면에서 '둥근 그림자 얼룩'으로 읽혔다 → 시전 직전(1.3초)에만 차오르는 예고 빛으로 */
  if(row){if(typeof sprite==='function'){towerShadow(e,t.art,q.x,q.y,hh);sprite(t.art,q.x,q.y,hh,{filter:e.flash>0?'brightness(1.7)':'saturate(.9) contrast(1.05)'});}}
  if(S&&charge>0)S.draw('flare',P.main,q.x,q.y-hh*.75,hh*.5*charge,hh*.5*charge,{angle:T(),alpha:charge*.8,overHero:true});
  const W=hh*.55,y=q.y+Math.max(6,hh*.05),r=Math.max(0,Math.min(1,e.hp/Math.max(1,e.maxHp)));ctx.fillStyle='rgba(4,4,6,.85)';ctx.fillRect(q.x-W/2-1,y-1,W+2,6);ctx.fillStyle='#b8323a';ctx.fillRect(q.x-W/2,y,W*r,4);}finally{ctx.restore();}stats.towerDraws++;}

// ---- SW-0017 시스템의 거부권 보스 문 경비 터렛 -----------------------------------------------------------
const SENTRY={base:'assets/world-r80/r80-000.webp',head:'assets/sw0017/u204-sentry-head.webp',height:90,
 range:6.4,warn:.58,gap:.16,recover:2.6,speed:16,muzzle:.55,rounds:3,mount:.86,headPivot:.12};
const SENTRY_HEAD=Array.from({length:2},(_,i)=>({path:SENTRY.head,assetFrame:{sourceRect:[i*155,0,155,54],pivot:[155*SENTRY.headPivot,27],visibleHeight:54}}));
const SENTRY_PAL={a:[118,43,21],b:[255,177,83]};
const sentries=new WeakMap();
const sentryRoom=()=>room?.id==='u204'&&room.layer==='STORY'&&!room.samongR103;
const sentryDoor=()=>room.exploration?.worldR74?.doors?.find(d=>d.id===room.exploration.bossDoorId&&d.r78BossDoor);
function placeSentry(){
 const gate=sentryDoor();
 if(!gate||gate.axis!=='y')return null;
 // The boss chamber is on the low-y side. Leave the centre two tiles open.
 const side=gate.width/2-.95,y=gate.y+4.8;
 const x=[gate.x-side,gate.x+side].find(x=>!blocked(x,y,.55,room));
 if(x===undefined)return null;
 const sentry={id:'sw0017:u204-sentry',kind:'doorSentry',name:'경비 터렛',path:SENTRY.base,height:SENTRY.height,x,y,solid:false,
  r170Sentry:true,angle:Math.PI/4,next:0,rounds:0,warnUntil:0,lastShot:-99,seen:T()};
 room.props.push(sentry);
 SPR()?.warm?.(SENTRY_PAL,['bolt','flare','glow']);
 const art=ensureImages([SENTRY.base,SENTRY.head]);
 Promise.resolve(art).catch(fail);
 return sentry;
}
function sentryMuzzle(s){
 return {x:s.x+Math.cos(s.angle)*SENTRY.muzzle,y:s.y+Math.sin(s.angle)*SENTRY.muzzle};
}
function fireSentry(s){
 const from=sentryMuzzle(s);
 if(!clearLine(s,from,room))return;
 const dx=Math.cos(s.angle),dy=Math.sin(s.angle),d=Math.hypot(player.x-s.x,player.y-s.y);
 let reach=SENTRY.range-SENTRY.muzzle;
 for(let at=.15;at<=reach;at+=.15){
  if(blocked(from.x+at*dx,from.y+at*dy,.09,room)){reach=at-.15;break;}
 }
 if(reach<=0)return;
 const ref=room.enemies.find(e=>e.nativeId==='u204-e3');
 const damage=Math.max(1,(ref?.damage||11)*.72);
 const shot=makeShot(from.x,from.y,s.angle,SENTRY.speed,damage,{owner:s.id,ownerId:s.id,
  friendly:false,radius:.09,life:reach/SENTRY.speed,
  r170SentryShot:{lift:SENTRY.height*SENTRY.mount,travel:Math.max(.1,(d-SENTRY.muzzle)/SENTRY.speed)}});
 if(shot){s.lastShot=T();if(typeof sound==='function')sound('swMetal');}
}
function cancelBurst(s,t){
 s.rounds=0;s.warnUntil=0;s.next=t+.8;
}
function stepSentry(){
 if(!solo())return;
 if(!sentries.has(room))sentries.set(room,placeSentry());
 const s=sentries.get(room),t=T();
 if(!s)return;
 if(s.rounds&&t-s.seen>.4)cancelBurst(s,t);
 s.seen=t;
 const gate=sentryDoor();
 const eligible=gate?.closed===true&&!room.cleared&&player.hp>0&&Math.hypot(player.x-s.x,player.y-s.y)<=SENTRY.range;
 if(!eligible){if(s.rounds)cancelBurst(s,t);return;}
 if(t<s.next||!readyImage(SENTRY.base)||!readyImage(SENTRY.head))return;
 if(!clearLine(s,player,room)){
  if(s.rounds)cancelBurst(s,t);else s.next=t+.2;
  return;
 }
 if(!s.rounds){
  s.angle=Math.atan2(player.y-s.y,player.x-s.x);
  s.rounds=SENTRY.rounds;s.warnUntil=s.next=t+SENTRY.warn;
  return;
 }
 fireSentry(s);
 s.rounds--;
 s.next=t+(s.rounds?SENTRY.gap:SENTRY.recover);
}
function drawSentry(s){
 const at=project(s.x,s.y),h=s.height*zoom;
 if(at.x<-h||at.x>W+h||at.y<-h||at.y>H+h)return;
 const from=sentryMuzzle(s),muzzle=project(from.x,from.y);
 const dx=muzzle.x-at.x,dy=muzzle.y-at.y,angle=Math.atan2(dy,dx),barrel=Math.hypot(dx,dy);
 const y=at.y-h*SENTRY.mount,w=barrel/(1-SENTRY.headPivot);
 const near=project(player.x,player.y),alpha=at.y>near.y&&at.y-h<near.y-15&&Math.abs(at.x-near.x)<h*.21?.42:1;
 const now=T(),fire=now-s.lastShot<.085,warn=s.rounds>0&&now<s.warnUntil;
 ctx.save();try{
  ctx.globalAlpha*=alpha;shadow(at.x,at.y,h*.28);sprite(s.path,at.x,at.y,h);
  const paint=()=>drawAssetFrame3(SENTRY.head,SENTRY_HEAD[fire?1:0],at.x,y,w*54/155,{angle});
  if(typeof ctx.scope==='function')ctx.scope({id:s.id+':head',kind:'prop',x:s.x+.01,y:s.y+.01,alive:true,bodyPath:SENTRY.head},paint);
  else paint();
  const fx=SPR();
  if(fire)fx?.draw('flare',SENTRY_PAL,muzzle.x,muzzle.y-h*SENTRY.mount,h*.34,h*.22,{angle,alpha:.9,overHero:true});
  else if(warn)fx?.draw('glow',SENTRY_PAL,at.x,y,h*.5,h*.5,{alpha:.18+.47*Math.min(1,1-(s.warnUntil-now)/SENTRY.warn),overHero:true});
 }finally{ctx.restore();}
}
function drawSentryShot(p){
 const fx=SPR();if(!fx)return false;
 const at=project(p.x,p.y),prior=project(p.x-p.vx*.01,p.y-p.vy*.01),m=p.r170SentryShot;
 const u=Math.min(1,p.age/m.travel),rise=(m.lift+(26-m.lift)*u)*zoom;
 if(at.x<-48||at.x>W+48||at.y<-48||at.y>H+rise+48)return true;
 const angle=Math.atan2(at.y-prior.y,at.x-prior.x),h=actorHeight();
 const paint=()=>fx.draw('bolt',SENTRY_PAL,at.x,at.y-rise,h*.25,h*.075,{angle,alpha:.96,overHero:true});
 return typeof ctx.scope==='function'
  ?ctx.scope({id:'sw0017:sentry-bolt:'+p.id,kind:'projectile',x:p.x,y:p.y},paint)===true
  :paint()===true;
}

// ---- ④ 본편 몹을 맵 곳곳에(사용자 "스토리모드 몹 분포 맵 곳곳에, 한쪽 길목에 몰지 말고") ----------------------------------
//  맵에 들어설 때 아직 싸우지 않은 일반 몹을 셋까지의 무리(첫 몹에서 2.5칸 안)로 묶고, 바닥 칸에서 '가장 먼 점 고르기'로 고른 자리들(입구에서 8칸 넘게,
//  무리끼리 7칸 넘게, 사방이 트인 곳)에 무리째 옮긴다. 보스·중간보스·나중에 오는 물결·탑은 그대로. storyworld.r170.combat {spread:false}.
// R179: 무리째 옮길 때 몸 크기를 본다. 예전엔 반지름 .3 으로만 재고, 막히면 무리 중심(at)에 검사 없이 놓아서
//  몸이 큰 중간보스(R81 챔피언, 반지름 .5~.9)가 벽에 박힌 채 놓였다(R171 작은 지도 dist02 에서 드러남). 몸+.12 여유로 재고,
//  그 자리·무리 중심·둘레(최대 2.4칸)에서 비는 곳을 찾고, 끝내 없으면 원래(이미 안전하게 놓인) 자리에 둔다.
//  지도가 spawnExclude(R171 앞방처럼 닫힌 문 뒤 막다른 방)를 주면 그 안으로는 옮기지 않는다.
function bodySpot(e,x,y,at){if(typeof blocked!=='function')return{x,y};const r=Math.max(.3,Number(e?.combatProfile?.bodyBlock?.r)||Number(e?.radius)||.3)+.12,list=[{x,y},{x:at.x,y:at.y}];
 for(let ring=1;ring<=8;ring++)for(let k=0;k<12;k++){const a=k*Math.PI/6+ring*.4;list.push({x:at.x+Math.cos(a)*ring*.3,y:at.y+Math.sin(a)*ring*.3});}
 try{return list.find(p=>Number.isFinite(p.x+p.y)&&!blocked(p.x,p.y,r,room))||null;}catch(_){return null;}}
function spreadStory(){if(prefs.spread===false||!live()||!solo()||samongRoom()||SPECIAL.has(room.id))return;try{if(typeof safeRegion==='function'&&safeRegion())return;}catch(_){}
 const L=room.exploration;if(!L?.floorCells?.length||room.engaged||room.r170Spread===room.id)return;const mobs=(room.enemies||[]).filter(e=>e.hp>0&&!major(e)&&!e.r170Tower&&e.spawnState==='active'&&!e.attack);if(mobs.length<6)return;
 room.r170Spread=room.id;const entry=L.entry||room.r72Entry||player,packs=[];for(const e of mobs){let p=packs.find(k=>k.length<3&&Math.hypot(k[0].x-e.x,k[0].y-e.y)<2.5);if(p)p.push(e);else packs.push([e]);}// 무리는 셋까지 — 길목에 줄지어 있던 몹이 하나로 뭉쳐 그대로 남지 않게
 const cand=[];let h=(String(room.id).length*2654435761)>>>0;for(let t=0;t<900&&cand.length<420;t++){h=Math.imul(h^(h>>>15),0x2c1b3c6d)>>>0;const c=L.floorCells[h%L.floorCells.length],x=c[0]+.5,y=c[1]+.5;if(Math.hypot(x-entry.x,y-entry.y)<8||(L.spawnExclude||[]).some(b=>x>=b[0]&&x<b[2]&&y>=b[1]&&y<b[3])||!okCell(x,y))continue;cand.push({x,y});}
 if(cand.length<packs.length)return;const chosen=[],far=q=>Math.min(Math.hypot(q.x-entry.x,q.y-entry.y)*.6,...chosen.map(c=>Math.hypot(c.x-q.x,c.y-q.y)));
 for(let i=0;i<packs.length;i++){let best=null,bd=-1;for(const q of cand){const d=chosen.length?far(q):Math.hypot(q.x-entry.x,q.y-entry.y)*((i*7919)%5+1);if(d>bd){bd=d;best=q;}}if(!best)break;chosen.push(best);}
 packs.forEach((pk,i)=>{const at=chosen[i];if(!at)return;const cx=pk.reduce((s,e)=>s+e.x,0)/pk.length,cy=pk.reduce((s,e)=>s+e.y,0)/pk.length;
  for(const e of pk){const p=bodySpot(e,at.x+Math.max(-1.6,Math.min(1.6,e.x-cx)),at.y+Math.max(-1.6,Math.min(1.6,e.y-cy)),at);if(!p){stats.spreadKept=(stats.spreadKept||0)+1;continue;}e.x=e.homeX=p.x;e.y=e.homeY=p.y;e.nav=[];e.navAt=0;stats.spread=(stats.spread||0)+1;}});
 stats.packs=packs.length;}

// SW-0019: the six native Academy actors defend the entrance core. The native
// boss keeps the exit-door progression and becomes the chained gate tower.
const KAIR='kair01',KAIR_BOSS='mb-kair01-v31231',KAIR_BOSS_ID=KAIR+':'+KAIR_BOSS;
const ARCHIVE='assets/sw0019/academy-archive.webp',ACADEMY_CORE='assets/props/v31238/memory-time-anchor.webp';
const SAND_CHAIN='assets/r138/props/chain.webp',POINT_ORB='assets/vfx/v31315/spirit-orb.webp';
const ACADEMY_WAVES=Array.from({length:6},(_,i)=>KAIR+':kair-academy-wave-'+(i+1));
const KAIR_DROPS=Array.from({length:3},(_,i)=>'r64:sw0019:kair01:gate:'+i);
const academyRooms=new WeakMap();
let academyRestoreRows=null;
function academyRoom(r){
 return r?.id===KAIR&&r.layer==='STORY'&&!r.samongR103&&!r.egoVisitId151&&solo()
   &&!window.__STORYWORLD_SURVIVAL_R600__?.active?.()&&!window.__STORYWORLD_CINEMA_RUN_R461__?.active?.()
   &&!!r.exploration?.worldWardR81;
}
const kairDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function kairPoint(r,origin,offsets,radius){
 for(const [dx,dy] of offsets){
  const p={x:origin.x+dx,y:origin.y+dy};
  if(!blocked(p.x,p.y,radius,r))return p;
 }
 return null;
}
function academyProp(r,key,p,path,height){
 const id='sw0019:'+key;
 if(p&&!r.props.some(q=>q.id===id))r.props.push({id,...p,path,height,solid:false,visible:true,autoTargetEligible6:false});
}
function academyState(r){
 const old=academyRooms.get(r);
 if(old)return old;
 const entrance=r.exploration.entry,door=r.exploration.worldR74?.doors?.find(d=>d.id==='door-2');
 if(!entrance||!door)return null;
 const core=kairPoint(r,entrance,[[-2.5,-4],[-1.5,-4],[-3,-3]],.6);
 if(core){
  const archive=kairPoint(r,entrance,[[-6.7,-3.5],[-6.5,-4.5],[-6,-2]],1.15);
  academyProp(r,'archive',archive,ARCHIVE,176);
  academyProp(r,'core',core,ACADEMY_CORE,89);
  if(typeof ensureImages==='function')void Promise.resolve(ensureImages([ARCHIVE,ACADEMY_CORE])).catch(fail);
 }
 const originals=new Map(r.enemies.filter(e=>ACADEMY_WAVES.includes(e.id)).map(e=>[e.id,e]));
 const history=academyRestoreRows;
 const waveActors=ACADEMY_WAVES.map(id=>{
  const e=originals.get(id),saved=history?.get(id);
  if(saved?.hp===0||r.defeatedActorIds?.has(id)){
   return Object.assign(e||{id,x:saved?.x??core?.x??0,y:saved?.y??core?.y??0},{hp:0,deadRecorded:true,spawnState:'dead'});
  }
  return e;
 }).filter(Boolean);
 const cleared=completed(KAIR,'STORY');
 const waves=core&&waveActors.length===ACADEMY_WAVES.length&&!cleared?waveActors:[];
 if(waves.length){
  const awaiting=new Set(waves);
  r.enemies=r.enemies.filter(e=>!awaiting.has(e));
 }
 const boss=r.enemies.find(e=>e.nativeId===KAIR_BOSS&&(e.boss||e.midboss));
 const radius=Math.max(.35,Number(boss?.combatProfile?.bodyBlock?.r)||Number(boss?.radius)||.35);
 const savedBoss=history?.get(KAIR_BOSS_ID);
 const gate=boss||savedBoss?.hp===0?kairPoint(r,door,[[3.6,3.4],[4.2,3],[3.6,4.2],[4.5,4.5]],radius+.1):null;
 if(boss&&gate){
  boss.r75Tower=true;
  Object.assign(boss,{x:gate.x,y:gate.y,homeX:gate.x,homeY:gate.y});
 }
 if(gate&&typeof ensureImages==='function')void Promise.resolve(ensureImages([SAND_CHAIN,POINT_ORB])).catch(fail);
 const next=waves.find(e=>e.hp>0&&!e.deadRecorded);
 const row=next&&history?.get(next.id);
 const suspended=row?.spawnState==='active'&&Number.isFinite(row.x+row.y)&&kairDistance(row,core)<=10;
 if(suspended){
  next.hp=Math.max(1,Math.min(next.maxHp,row.hp));
  next.x=row.x;next.y=row.y;
 }
 const won=!!(gate&&savedBoss?.hp===0&&kairDistance(savedBoss,gate)<.12);
 const s={core,waves,boss,door,gate,active:null,suspended:!!suspended,nextAt:null,won,freedAt:null,dropsPlaced:false,wavesDone:!next};
 academyRooms.set(r,s);
 return s;
}
function placeAcademyDrops(r,s){
 if(s.dropsPlaced||!s.won)return;
 const crates=window.__STORYWORLD_CRATES_R108__,P=window.__STORYWORLD_PROGRESSION_R62__;
 if(!crates?.scatterSpots||!P?.state)return;
 const owned=P.state(player)?.pointDropClaimsR64||{},box='sw0019:kair01:gate',at=T();
 const spots=crates.scatterSpots({id:box,...s.gate},KAIR_DROPS.length);
 KAIR_DROPS.forEach((id,i)=>{
  if(owned[id]||r.props.some(p=>p.r108Orb?.id===id))return;
  const p=spots[i],to=p&&!blocked(p.x,p.y,.32,r)&&clearLine(s.gate,p,r)?p:s.gate;
  r.props.push({id:'r108orb:'+id,...s.gate,path:POINT_ORB,height:30,solid:false,visible:true,autoTargetEligible6:false,
   r108Orb:{id,amount:1,at:at+i*.08,from:s.gate,to,box,count:3}});
 });
 s.dropsPlaced=true;
}
function academyStep(r,s){
 if(!s)return;
 const now=T(),boss=s.boss;
 if(s.gate&&boss&&boss.hp>0){
  boss.x=boss.homeX=s.gate.x;boss.y=boss.homeY=s.gate.y;
 }
 placeAcademyDrops(r,s);
 if(s.wavesDone)return;
 const near=kairDistance(s.core,player);
 if(s.active){
  if(s.active.hp<=0||s.active.deadRecorded){s.active=null;s.nextAt=now+.65;}
  else if(near>10){
   const active=s.active;
   r.enemies=r.enemies.filter(e=>e!==active);
   active.spawnState='hidden';s.active=null;s.suspended=true;
  }
  return;
 }
 if(near>5.2||!clearLine(s.core,player,r))return;
 if(s.nextAt===null){s.nextAt=now+.55;return;}
 if(now<s.nextAt)return;
 const index=s.waves.findIndex(e=>e.hp>0&&!e.deadRecorded);
 if(index<0){s.wavesDone=true;return;}
 const e=s.waves[index],radius=Math.max(.25,Number(e.combatProfile?.bodyBlock?.r)||e.radius||.25);
 const offsets=[[-1.5,-1.35],[1.45,-1.45],[-1.9,.8],[.9,-2.15],[-2.25,-.35],[1.35,.9]];
 const spots=offsets.slice(index).concat(offsets.slice(0,index)).filter(([x,y])=>Math.hypot(s.core.x+x-player.x,s.core.y+y-player.y)>1.25);
 const resume=s.suspended&&kairDistance(e,s.core)<=5&&!blocked(e.x,e.y,radius+.12,r)&&kairDistance(e,player)>1.25;
 const p=resume?{x:e.x,y:e.y}:kairPoint(r,s.core,spots,radius+.12);
 if(!p)return;
 Object.assign(e,{x:p.x,y:p.y,homeX:p.x,homeY:p.y,spawnState:'active',state:'idle',attack:null,rangedWindup:0,
  nav:[],navAt:0,cd:1.05,graceUntil:now+.8,explorationLeash:6,explorationGroup:'kair01:academy'});
 if(!r.enemies.includes(e))r.enemies.push(e);
 s.active=e;
 if(!s.suspended){
  fx('sigil',p.x,p.y,{asset:VFX.core,size:1.5,life:.66});
  toast('최초명령 코어 방어 · '+(index+1)+' / '+s.waves.length,1.9);
  saveGame(false);
 }
 s.suspended=false;
}
function academyAfterKill(r,e){
 const s=academyRooms.get(r);
 if(s?.waves.includes(e)&&e.deadRecorded){saveGame(false);return;}
 if(!s||e!==s.boss||!s.gate||s.won||!e.deadRecorded)return;
 s.won=true;s.freedAt=T();
 placeAcademyDrops(r,s);
 saveGame(false);
}
function academySavedRows(raw){
 if(typeof raw==='string')try{raw=JSON.parse(raw);}catch(_){return null;}
 return new Map((Array.isArray(raw?.rooms?.['STORY:'+KAIR]?.enemies)?raw.rooms['STORY:'+KAIR].enemies:[])
  .filter(row=>row&&typeof row.id==='string').map(row=>[row.id,row]));
}
function saveAcademyRows(raw){
 const r=world?.['STORY:'+KAIR],s=academyRooms.get(r),data=raw?.rooms?.['STORY:'+KAIR];
 if(!s||!Array.isArray(data?.enemies))return raw;
 const next=s.waves.find(v=>v.hp>0&&!v.deadRecorded),native=new Map(data.enemies.map(e=>[e.id,e]));
 const rows=s.waves.map(e=>{
  const started=e===s.active||s.suspended&&e===next;
  const p=started&&kairDistance(e,s.core)>9?{x:e.homeX,y:e.homeY}:e;
  const row=native.get(e.id)||{id:e.id,nativeId:e.nativeId,hp:e.hp,maxHp:e.maxHp};
  native.delete(e.id);
  return {...row,x:p.x,y:p.y,spawnState:e.hp<=0?'dead':started?'active':'hidden'};
 });
 if(s.won)native.set(KAIR_BOSS_ID,{id:KAIR_BOSS_ID,nativeId:KAIR_BOSS,hp:0,...s.gate,spawnState:'dead'});
 data.enemies=[...rows,...native.values()];
 return raw;
}
function paintAcademyGate(s){
 if(!s?.gate||!s.boss)return;
 const corpse=s.freedAt===null?Infinity:T()-s.freedAt,linked=!s.won&&s.boss.hp>0
  &&(s.boss.spawnState==='active'||s.boss.spawnState==='summoning');
 if(!linked&&corpse>=3.2)return;
 const from=project(s.door.x-Math.min(1.55,s.door.width*.24),s.door.y+.21),to=project(s.gate.x,s.gate.y);
 if(Math.max(from.x,to.x)<-90||Math.min(from.x,to.x)>W+90||Math.max(from.y,to.y)<-90||Math.min(from.y,to.y)>H+120)return;
 const z=zoom,h=actorHeight(),ay=from.y-h*.48,by=to.y-h*.51;
 if(linked||corpse<.9){
  const chain=readyImage(SAND_CHAIN)?.image,release=linked?0:Math.min(1,corpse/.9);
  const endX=to.x+(from.x-to.x)*release,endY=by+(ay-by)*release+Math.sin(release*Math.PI)*24*z;
  const len=Math.hypot(endX-from.x,endY-ay),angle=Math.atan2(endY-ay,endX-from.x);
  if(chain&&len>3){
   ctx.save();
   try{
    ctx.globalAlpha*=1-release;
    ctx.translate(from.x,ay);ctx.rotate(angle);
    ctx.filter='brightness(.93) saturate(.40)';
    ctx.drawImage(chain,0,-11*z,len,22*z);
    ctx.filter='none';
    for(let i=0;i<7;i++){
     const u=(T()*.34+i/7)%1;
     ctx.fillStyle=i%3===0?'#a08fa1':'#211a27';
     ctx.fillRect(len*u,Math.sin(u*16+i)*6*z,Math.max(1,3*z),Math.max(1,2*z));
    }
   }finally{ctx.restore();}
  }
 }
 if(!linked&&corpse<3.2){
  const y=to.y-h*1.65,fade=Math.min(1,(3.2-corpse)*2.5);
  ctx.save();
  try{
   ctx.globalAlpha*=fade;ctx.font='600 14px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle='#a0896f';ctx.fillRect(to.x-51,y-14,102,28);
   ctx.fillStyle='rgba(20,17,23,.98)';ctx.fillRect(to.x-50,y-13,100,26);
   ctx.fillStyle='#f4e6d2';ctx.fillText('고맙습니다.',to.x,y);
  }finally{ctx.restore();}
 }
}

// SW-0020: last canonical combat in each story chapter. Only the main native
// boss is promoted; earlier bosses and extra phases with other IDs keep their HP.
const CHAPTER_BOSSES=Object.freeze({
 ep1a11:'a11-boss',ep1b09:'b09-boss',u203:'u203-boss',last303:'l303-boss',
 kair03:'k103-boss',hando03:'h103-boss',murder03:'blue-executor',cult04:'c104-boss'
});
const chapterHealth=new WeakMap(),chapterAnnounced=new WeakSet();
function chapterBoss(r){
 const id=CHAPTER_BOSSES[r?.id];
 if(!id||r.layer!=='STORY'||r.samongR103||r.egoVisitId151||!solo()
   ||window.__STORYWORLD_SURVIVAL_R600__?.active?.()||window.__STORYWORLD_CINEMA_RUN_R461__?.active?.())return null;
 const actorId=r.id==='cult04'&&r.activeEncounter==='finalBoss'&&r.enemies.some(e=>e.id==='cult04:final-boss'&&e.hp>0)
  ?'cult04:final-boss':r.id+':'+id;
 return r.enemies.find(e=>e.boss&&e.nativeId===id&&e.id===actorId&&!e.persona&&!e.trial&&!e.cosmic)||null;
}
function boostChapterBoss(e){
 if(!e||!Number.isFinite(e.maxHp)||e.maxHp<=0||e.hp<=0)return false;
 const old=chapterHealth.get(e);
 if(old&&e.maxHp===old.max*2&&e.difficultyFactorR63===old.factor)return false;
 const row={max:e.maxHp,factor:e.difficultyFactorR63,suffixed:e.healthR71Adjusted&&e.healthR71VisibleMaxHp===e.maxHp};
 chapterHealth.set(e,row);
 e.maxHp*=2;e.hp*=2;e.specialBossSW20=true;
 if(row.suffixed)e.healthR71VisibleMaxHp=e.maxHp;
 return true;
}
function naturalSpecialHealth(e){
 const row=chapterHealth.get(e);
 if(!row||e.maxHp!==row.max*2||e.difficultyFactorR63!==row.factor)return null;
 const health={maxHp:row.max};
 if(row.suffixed&&e.healthR71Adjusted)health.healthR71VisibleMaxHp=row.max;
 return health;
}
function unboostChapterBoss(e){
 const health=naturalSpecialHealth(e);
 if(!health)return false;
 Object.assign(e,health);e.hp*=.5;
 return true;
}
function stepChapterBoss(r){
 const e=chapterBoss(r);
 if(!e)return;
 boostChapterBoss(e);
 if(e.hp>0&&e.spawnState==='active'&&!chapterAnnounced.has(e)){
  chapterAnnounced.add(e);
  toast('특수 보스 · '+e.name,3.2);
 }
}
function serializeChapterHealth(save,receiver,args){
 const rooms=new Set([...Object.values(world||{}),room]),actors=[];
 for(const r of rooms){const e=chapterBoss(r);if(e&&unboostChapterBoss(e))actors.push(e);}
 try{return saveAcademyRows(save.apply(receiver,args));}
 finally{for(const e of actors)boostChapterBoss(e);}
}

// SW-0019: native chapter bosses share three authored sand animation rows.
// A single owned field can be active per room. Moving away or defeating the
// owner cancels its damage and speed penalty immediately.
const SAND_SKILLS='assets/sw0019/black-sand-skills.webp',SIREN_SKILLS='assets/sw0020/siren-mor-skills.webp',SAND_CELL=256;
const SAND_MOVE=.64;
const SAND_ACTIONS=Object.freeze([
 {warn:1.05,life:3.25,radius:1.62,rate:.047},
 {warn:1.2,life:2.35,radius:2.15,rate:.049},
 {warn:1.4,life:4.2,radius:2.35,rate:.048},
 {warn:1.35,life:1.12,reach:9.1,width:.72,hit:.16},
 {warn:1.15,life:2.48,reach:9.8,width:.56,rate:.082},
 {warn:1.55,life:4.3,radius:3.35,rate:.079}
]);
const sandRooms=new WeakMap();
let sandSlow=null;
const sandArt=r=>r.id==='kair03'?SIREN_SKILLS:SAND_SKILLS;
function sandRoom(r){
 return !!(r?.layer==='STORY'&&/^kair(?:0[1-9]|10)$/.test(r.id)&&!r.samongR103&&!r.egoVisitId151&&solo()
  &&!window.__STORYWORLD_SURVIVAL_R600__?.active?.()&&!window.__STORYWORLD_CINEMA_RUN_R461__?.active?.());
}
function sandPlan(r){
 if(r.id==='kair01')return [1,2];
 if(r.id==='kair05')return [2,0,1];
 if(r.id==='kair03')return [3,4,5];
 return Number(r.id.slice(-1))%2?[0,1,2]:[1,0,2];
}
function sandBoss(e){return (e.boss||e.midboss)&&!e.wardChampionR81&&!e.r61Summoned&&e.hp>0&&e.spawnState==='active';}
function sandFieldAt(p,field,r=room){
 if(field.spec.width){
  const dx=p.x-field.x,dy=p.y-field.y;
  const along=dx*field.ux+dy*field.uy,across=dy*field.ux-dx*field.uy;
  return along>=0&&along<=field.length&&Math.abs(across)<=field.spec.width&&clearLine(field,p,r);
 }
 return kairDistance(p,field)<=field.spec.radius&&clearLine(field,p,r);
}
function sandSkillPoint(r,boss,index,spec){
 if(spec.width)return sirenSpan(r,boss,spec);
 const dx=player.x-boss.x,dy=player.y-boss.y,d=Math.hypot(dx,dy)||1;
 const target={x:player.x,y:player.y};
 if(index!==0)return !blocked(target.x,target.y,.27,r)&&clearLine(boss,target,r)?target:null;
 const ux=dx/d,uy=dy/d;
 for(const advance of [Math.min(1.35,d*.45),Math.min(2.3,d*.8),d]){
  const p={x:boss.x+ux*advance,y:boss.y+uy*advance};
  if(!blocked(p.x,p.y,.35,r)&&!blocked(p.x+ux*.35,p.y+uy*.35,.35,r)&&clearLine(boss,p,r))return p;
 }
 return null;
}
function stepBlackSand(r,dt){
 let s=sandRooms.get(r);
 if(!s){s={next:T()+2.8,index:0,sequence:0,field:null,artNext:0};sandRooms.set(r,s);}
 const now=T(),field=s.field;
 if(field){
  if(!sandBoss(field.owner)||now>=field.end||kairDistance(player,field)>18){
   s.field=null;s.next=now+4.5;
   if(sandSlow===field)sandSlow=null;
   return;
  }
  if(now<field.go)return;
  if(field.row===0&&!field.stopped){
   const q={x:field.x+field.vx*dt,y:field.y+field.vy*dt};
   if(blocked(q.x,q.y,.33,r))field.stopped=true;
   else{field.x=q.x;field.y=q.y;}
  }
  const touches=sandFieldAt(player,field,r);
  if(field.row===2)sandSlow=touches?field:null;
  if(now>=field.hit){
   field.hit=field.spec.hit?Infinity:now+.25;
   if(touches)hurt(maxHP()*(field.spec.hit||field.spec.rate*.25),field.owner);
  }
  return;
 }
 const art=sandArt(r);
 if(!readyImage(art)?.image){
  if(now>=s.artNext&&typeof ensureImages==='function'){
   s.artNext=now+2.4;void Promise.resolve(ensureImages([art])).catch(fail);
  }
  return;
 }
 if(now<s.next||!r.engaged)return;
 const boss=r.enemies.find(e=>sandBoss(e)&&kairDistance(e,player)<=11&&clearLine(e,player,r));
 if(!boss)return;
 const busy=boss.attack||boss.rangedWindup>0||boss.storyPreparedCast150&&!boss.storyPreparedCast150.consumed;
 if(busy&&(r.id!=='kair03'||now<s.next+.8))return;
 const plan=sandPlan(r),row=plan[s.index%plan.length],spec=SAND_ACTIONS[row],p=sandSkillPoint(r,boss,row,spec);
 if(!p){s.next=now+.3;return;}
 const dx=player.x-boss.x,dy=player.y-boss.y,distance=Math.hypot(dx,dy)||1;
 s.index++;
 s.field={...p,spec,row,owner:boss,r,id:++s.sequence,begin:now,go:now+spec.warn,end:now+spec.warn+spec.life,hit:now+spec.warn+.18,
  vx:dx/distance*2.6,vy:dy/distance*2.6,stopped:false};
}
function sirenSpan(r,boss,spec){
 const dx=player.x-boss.x,dy=player.y-boss.y,distance=Math.hypot(dx,dy);
 if(distance<.15||!clearLine(boss,player,r))return null;
 const ux=dx/distance,uy=dy/distance,limit=Math.min(spec.reach,Math.max(3.5,distance+.8));
 let length=0;
 for(let d=.35;d<=limit;d+=.35){
  if(blocked(boss.x+ux*d,boss.y+uy*d,.22,r))break;
  length=d;
 }
 return length>=1.4?{x:boss.x,y:boss.y,ux,uy,length}:null;
}
function paintSirenLine(f,image,now){
 const q=project(f.x,f.y),end=project(f.x+f.ux*f.length,f.y+f.uy*f.length),z=zoom;
 const dx=end.x-q.x,dy=end.y-q.y,pixels=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
 if(pixels<3||Math.max(q.x,end.x)<-80||Math.min(q.x,end.x)>W+80||Math.max(q.y,end.y)<-80||Math.min(q.y,end.y)>H+80)return;
 const xy=project(f.x-f.uy*f.spec.width,f.y+f.ux*f.spec.width);
 const wide=Math.abs((xy.x-q.x)*Math.sin(angle)-(xy.y-q.y)*Math.cos(angle)),elapsed=now-f.go;
 const active=elapsed>=0,frame=active?(f.row===3?(elapsed<.48?1:2):Math.floor(elapsed*7)%3):0;
 const h=f.row===3?Math.max(wide*2,Math.min(95*z,Math.max(74*z,pixels*.34))):Math.max(wide*2.3,32*z);
 const draw=()=>{
  ctx.save();
  try{
   ctx.translate(q.x,q.y);ctx.rotate(angle);
   if(!active){
    const flash=.2+.4*Math.max(0,1+elapsed/f.spec.warn);
    ctx.fillStyle='rgba(155,126,181,'+flash.toFixed(3)+')';
    ctx.fillRect(0,-wide,pixels,wide*2);
   }
   ctx.globalAlpha*=active?Math.min(1,(f.end-now)*3.2):.66;
   ctx.drawImage(image,frame*SAND_CELL,(f.row-3)*SAND_CELL,SAND_CELL,SAND_CELL,-5*z,-h*.5,pixels+10*z,h);
  }finally{ctx.restore();}
 };
 const x=f.x+f.ux*f.length*.5,y=f.y+f.uy*f.length*.5;
 if(typeof ctx.scope==='function')ctx.scope({id:'sw0020:boss:siren-line:'+f.id,kind:'effect',x,y,groundAligned:false,renderHeight:.16},draw);
 else draw();
}

function paintSandSkill(r){
 const f=sandRooms.get(r)?.field,image=readyImage(sandArt(r))?.image;
 if(!f||!image||!sandBoss(f.owner))return;
 if(f.spec.width){paintSirenLine(f,image,T());return;}
 const q=project(f.x,f.y),u=project(f.x+1,f.y),width=Math.abs(u.x-q.x)*Math.SQRT2*f.spec.radius*2;
 if(q.x<-width||q.x>W+width||q.y<-width||q.y>H+width||width<3)return;
 const elapsed=T()-f.go,active=elapsed>=0,phase=Math.min(2,Math.floor(Math.max(0,elapsed)*6)%3);
 const row=f.row===5?2:active?f.row:1,col=active?phase:0;
 const h=width*(active&&row===0?1.32:.92),y=active&&row===0?q.y-h*.82:q.y-h*.53;
 const draw=()=>{
  ctx.save();
  try{
   ctx.globalAlpha*=active?Math.min(1,(f.end-T())*2.8):.44+.29*Math.max(0,1+elapsed/f.spec.warn);
   ctx.drawImage(image,col*SAND_CELL,row*SAND_CELL,SAND_CELL,SAND_CELL,q.x-width*.59,y,width*1.18,h);
   if(!active){
    ctx.lineWidth=Math.max(1,zoom*1.35);ctx.strokeStyle='rgba(196,168,220,.72)';
    ctx.beginPath();ctx.ellipse(q.x,q.y,width*.5,width*.25,0,0,Math.PI*2);ctx.stroke();
   }
  }finally{ctx.restore();}
 };
 if(typeof ctx.scope==='function')ctx.scope({id:(f.row===5?'sw0020:boss:siren-storm:':'sw0019:sand:')+f.id,kind:'effect',x:f.x,y:f.y,groundAligned:true},draw);
 else draw();
}

// ---- 설치 -------------------------------------------------------------------------------------
try{
 if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){
   // 탑은 본편 몹 그림 대신 조형물 그림만 그린다(전역 readyImage 를 가리면 영웅 그림 고르기까지 흔들려 직접 그린다).
   if(e?.r170Tower){try{const f=()=>drawTower(e);if(typeof ctx.scope==='function')ctx.scope({id:'r170:tower:'+e.id,kind:'enemy',x:e.x,y:e.y},f);else f();}catch(err){fail(err);}return;}
   if(prefs.quietTells&&telling(e)&&typeof ctx!=='undefined'&&ctx)return muted(ctx,()=>base.apply(this,[e,...a]));
   return base.apply(this,[e,...a]);};}
 // 바닥 예고 칸(drawHazard)에 그린 선은 Three 렌더러에서 거의 보이지 않아(R167 육망성처럼) 이펙트 칸에서 그린다. 본편 금빛 예고는 끈다.
 if(typeof drawHazard==='function'){const base=drawHazard;drawHazard=function(h,...a){if(h?.samongPattern==='r170-hex'&&h.r170)return;return base.apply(this,[h,...a]);};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(ef,...a){if(ef&&ef.type==='r170-fx'){try{if(academyRoom(room))paintAcademyGate(academyRooms.get(room));if(sandRoom(room))paintSandSkill(room);seals();}catch(err){fail(err);}try{const lc=room?.samongR103?.r173Light;if(lc){const f=()=>drawLight(lc);if(typeof ctx.scope==='function')ctx.scope({id:'r173:light',kind:'effect',x:lc.x,y:lc.y},f);else f();}}catch(err){fail(err);}try{for(const h of hazards)if(h?.r170&&h.age<h.life){const f=()=>drawHex(h);if(typeof ctx.scope==='function')ctx.scope({id:'r170:hex:'+h.id,kind:'effect',x:h.x,y:h.y},f);else f();stats.hexDraws=(stats.hexDraws||0)+1;}}catch(err){fail(err);}return;}return base.apply(this,[ef,...a]);};}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p?.r170Sentry){if(p.visible===false)return;const paint=()=>drawSentry(p);
  if(typeof ctx.scope==='function')ctx.scope({id:p.id,kind:'prop',x:p.x,y:p.y,alive:true,bodyPath:p.path},paint);else paint();return;}if(!prefs.treeShadow&&p&&(p.r99Tree||/tree/i.test(String(p.path||'')))&&typeof shadow==='function'){const sh=shadow;shadow=function(){stats.treeShadowsSkipped++;};try{return base.apply(this,[p,...a]);}finally{shadow=sh;}}return base.apply(this,[p,...a]);};}
 if(typeof drawProjectile==='function'){const base=drawProjectile;drawProjectile=function(p,...a){
   if(p?.r170SentryShot&&drawSentryShot(p))return;return base.call(this,p,...a);};}
// 탑: 사몽은 적이 나온 뒤, 본편은 들어선 지 6초 뒤 영웅이 탑 자리 10칸 안에 왔을 때 처음 선다(저장에는 들어가지 않아 다시 오면 새로 선다).
 if(typeof tick==='function'){const base=tick;let at=0;tick=function(...a){const before=T();
  if(live()&&academyRoom(room)&&!loading&&!modal&&!storyScene&&player.hp>0){try{academyStep(room,academyState(room));}catch(e){fail(e);}}
  const r=base.apply(this,a);try{if(T()>before&&live()&&CHAPTER_BOSSES[room.id])stepChapterBoss(room);
  if(T()>before&&live()&&sandRoom(room)&&!loading&&!modal&&!storyScene&&player.hp>0)stepBlackSand(room,T()-before);
  if(T()>before&&live()&&sentryRoom()&&!loading&&!modal&&!storyScene)stepSentry();if(live()&&prefs.towers){if(T()>=at||T()<at-5){at=T()+.7;if(samongRoom())place();else if(T()>=storyAt&&nearSpot())place();}towerTick();}if(live()){if(academyRoom(room)||sandRooms.get(room)?.field||typeof hazards!=='undefined'&&hazards.some(h=>h?.r170)||room?.samongR103?.r173Light||zoneMode()==='D')arm();else disarm();}}catch(e){fail(e);}return r;};}
 if(typeof moveActor==='function'){const base=moveActor;moveActor=function(e,dx,dy,...a){
  const f=sandSlow;
  if(e===player&&f?.r===room&&T()<f.end&&sandBoss(f.owner)&&sandFieldAt(e,f,room)){
   dx*=SAND_MOVE;dy*=SAND_MOVE;
  }
  return base.call(this,e,dx,dy,...a);
 };}
 if(typeof summon3==='function'){const base=summon3;summon3=function(...a){
  const e=chapterBoss(room),reapply=e&&unboostChapterBoss(e);
  try{return base.apply(this,a);}
  finally{if(reapply||e)boostChapterBoss(e);}
 };}
 if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){
  const r=room,result=base.apply(this,[e,...a]);
  if(academyRoom(r))try{academyAfterKill(r,e);}catch(err){fail(err);}
  return result;
 };}
 if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){return serializeChapterHealth(base,this,a);};}
 if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){
  const prior=academyRestoreRows;academyRestoreRows=academySavedRows(raw);
  try{
   const result=await base.call(this,raw,...a);
   if(result!==false)for(const r of new Set([...Object.values(world),room])){
    if(academyRoom(r))academyState(r);
    boostChapterBoss(chapterBoss(r));
   }
   return result;
  }finally{academyRestoreRows=prior;}
 };}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);placedKey='';storyAt=T()+6;const restore=a.some(x=>x&&typeof x==='object'&&x.restore===true);// 저장 불러오기는 자리·적 목록을 그대로
   if(r!==false&&!restore)try{boostChapterBoss(chapterBoss(room));spreadStory();}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_COMBAT_R170__=Object.freeze({revision:REV,set,artOf,samongPlan,inkBlot,inkSheet,inkMode:()=>inkHex(),nextSpot:()=>{try{nearSpot();}catch(_){}return spot0?{...spot0}:null;},towers:()=>towers().map(e=>({id:e.id,name:e.name,x:e.x,y:e.y,hp:e.hp,art:e.r170Tower.art})),cast:e=>cast(e),
 academy:()=>{const s=academyRooms.get(room);return s?{core:s.core,gate:s.gate,wave:s.waves.indexOf(s.active)+1,won:s.won,freedAt:s.freedAt}:null;},
 sand:()=>{if(!sandRoom(room))return null;const s=sandRooms.get(room),f=s?.field;return {plan:sandPlan(room),casts:s?.sequence||0,field:f?{row:f.row,x:f.x,y:f.y,radius:f.spec.radius,go:f.go,end:f.end,owner:f.owner.id,moving:f.row===0&&!f.stopped,length:f.length,ux:f.ux,uy:f.uy,width:f.spec.width}:null,slowed:!!(f&&sandSlow===f&&sandBoss(f.owner)&&sandFieldAt(player,f,room))};},
 naturalSpecialHealth,
 specialBoss:()=>{const e=chapterBoss(room),s=e&&chapterHealth.get(e);return s?{id:e.id,maxHp:e.maxHp,baseline:s.max,hp:e.hp}:null;},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},towers:live()?towers().length:0,lastError})});
})();
