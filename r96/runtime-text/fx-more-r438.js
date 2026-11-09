// R438 드라이브 core24 남은 이펙트 8종 — 사용자 2026-11-09 "구글드라이브에 이펙트 및 이펙트 적중효과 많으니까 알아서 잘적용해주고".
//  R411(전투 14종)·R430(배경 9종)이 쓰지 않은 Dots 24장 시트(256×256, 6×4, 12.5fps, QA_HOLD) 가운데 결함 없는 8종을, 지금까지 그림이 없던 순간에 붙인다.
//  같은 그림을 두 자리에 쓰지 않는다(적 쪽 5종 · 영웅 쪽 3종). 판정·피해·시간·쿨다운·저장은 바꾸지 않는다(그림만).
//  · 적 → 영웅
//    - 보스·중간보스 근접(몸·휘두르기)이 영웅을 맞힘: 발밑 충격파(enemy-shockwave). R105 보스 색이 서리면 냉기파(enemy-cold-wave).
//    - 보스 광폭화(R205)가 켜지는 순간: 보스 발밑 큰 충격파.
//    - R430/R431 상태이상이 새로 걸린 순간: 타락 → 머리 위 저주 낙인, 중독·질병 → 발밑 독안개, 빙결·시간 왜곡 → 냉기파.
//    - R230 몹 옆자리 블링크: 사라진 자리에서 나타난 자리로 망령 돌진(옆모습 시트라 좌우만 뒤집고 기울기는 ±35°까지).
//  · 영웅 쪽
//    - 체력이 한 번에 최대치의 6% 이상 차오름(물약·지역 정리 회복 등): 발밑 회복. 미카엘라는 자기 회복 그림이 있어 뺀다.
//    - 성흔 보호막(player.shield)이 새로 생기거나 1.5초 넘는 부활 보호가 걸림: 보호 결계.
//    - 방의 적을 모두 쓰러뜨린 순간: 영웅 발밑 정화 파동(그 뒤 2초는 회복 그림을 겹치지 않음).
//  · 맘몬의 금고(ep1b06)는 다른 작업 몫이라 보스 쪽(충격파·광폭화)을 뺀다. 환도·미카엘라 공격·네온·라우렌 공격 그림은 건드리지 않는다.
//  · 그리기는 R411 과 같은 effects 표지 항목(Three 기록기에 잡힘). ctx.filter 안 씀. 동시 8개(저사양 4개, 저사양은 독안개·회복·블링크 생략).
//  · 끄기: localStorage['storyworld.r438.fx']='{"on":false}' 뒤 새로고침.
(()=>{'use strict';
if(window.__STORYWORLD_FX_MORE_R438__)return;
const REV='R438-fx-more-1',KEY='storyworld.r438.fx',DIR='assets/r438/fx/',CELL=256,COLS=6,FRAMES=24,FPS=12.5,DUR=FRAMES/FPS;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={plays:{},drawn:0,skipped:0,throttled:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,fin=v=>typeof v==='number'&&Number.isFinite(v);
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const roomId=()=>{try{return typeof room!=='undefined'&&room?room.id:'';}catch(_){return'';}};
// 이름 → [파일, pivot, 화면 크기 배율, 재생 속도, 쪽, 머리 위로 올림(칸), 영웅 앞에 그림]
const SHEET={
 'enemy-shockwave':['enemy-shockwave.webp',[128,145],2,1.7,'enemy',0,false],
 'enemy-cold-wave':['enemy-cold-wave.webp',[128,175],1.6,1.5,'enemy',0,true],
 'enemy-curse-brand':['enemy-curse-brand.webp',[128,128],1.1,1.4,'enemy',2.6,true],
 'enemy-poison-mist':['enemy-poison-mist.webp',[128,160],1.5,1.5,'enemy',0,false],
 'enemy-wraith-dash':['enemy-wraith-dash.webp',[128,140],1.5,2.4,'enemy',.55,true],
 'hero-healing':['hero-healing.webp',[128,192],1.35,1.3,'hero',0,true],
 'hero-barrier':['hero-barrier.webp',[128,208],1.45,1,'hero',0,true],
 'hero-cleanse':['hero-cleanse.webp',[128,160],2.6,1,'hero',0,false],
};
const LOW_SKIP=new Set(['enemy-poison-mist','hero-healing','enemy-wraith-dash']);
const asked=new Map();
function image(name){const p=DIR+SHEET[name][0];try{const got=typeof readyImage==='function'?readyImage(p):null;if(got?.image)return got.image;
 const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const list=[],SENT={type:'r438-sheet-fx',x:0,y:0,age:0,life:Infinity,r438Sentinel:true};
// 방에 들어올 때 8장을 미리 불러 첫 재생이 앞 칸을 건너뛰지 않게
let preloaded='';function preload(){const id=roomId();if(!id||preloaded===id||typeof ensureImages!=='function')return;preloaded=id;try{Promise.resolve(ensureImages(Object.values(SHEET).map(v=>DIR+v[0]))).catch(()=>{});}catch(_){}}
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
const lastAt=new Map();
function play(name,x,y,o={}){if(!prefs.on||!SHEET[name]||!fin(x)||!fin(y))return null;if(low()&&LOW_SKIP.has(name))return null;
 const t=T(),gap=o.gap??.5,k=name+(o.key||'');if(t-(lastAt.get(k)??-99)<gap){stats.throttled++;return null;}lastAt.set(k,t);
 const cap=low()?4:8;if(list.length>=cap){stats.throttled++;list.shift();}
 image(name);const S=SHEET[name],e={name,x,y,size:fin(o.size)?o.size:1,flip:!!o.flip,angle:fin(o.angle)?o.angle:0,t0:t,speed:S[3]*(o.speed||1),follow:o.follow||null};
 list.push(e);stats.plays[name]=(stats.plays[name]||0)+1;arm();return e;}
function drawOne(e){const S=SHEET[e.name],age=(T()-e.t0)*e.speed;if(age<0||age>=DUR)return;const im=image(e.name);if(!im){stats.skipped++;return;}
 const fr=Math.min(FRAMES-1,Math.floor(age*FPS)),unit=(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1);
 const fx=e.follow&&fin(e.follow.x)?e.follow.x:e.x,fy=e.follow&&fin(e.follow.y)?e.follow.y:e.y,q=project(fx,fy);
 const s=S[2]*e.size*unit/224*2,fade=age>DUR-.25?Math.max(0,(DUR-age)/.25):1,lift=S[5]*unit;
 ctx.save();try{const run=()=>{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=fade;ctx.translate(q.x,q.y-lift);if(e.angle)ctx.rotate(e.angle);ctx.scale(e.flip?-s:s,s);
   ctx.drawImage(im,(fr%COLS)*CELL,Math.floor(fr/COLS)*CELL,CELL,CELL,-S[1][0],-S[1][1],CELL,CELL);};
  const my=S[6]?fy+.35:fy;/* 몸에 붙는 것은 영웅보다 앞(깊이 +.35칸), 바닥 고리는 발밑 */
  /* 영웅에게 걸린 표시(회복·결계·낙인·발밑 정화 고리)는 R350 가림 옅게에서 빼되(그대로면 85%까지 지워져 안 보임), 회복 잎은 .8 로 옅게 그려 몸을 덜 가린다 */
  const mark=e.name==='hero-healing'||e.name==='hero-barrier'||e.name==='hero-cleanse'||e.name==='enemy-curse-brand';if(e.name==='hero-healing')ctx.globalAlpha*=.8;
  const meta=S[4]==='enemy'?{id:'r438:enemy:'+e.name+':'+e.t0.toFixed(3),kind:'effect',x:fx,y:my,enemy:true,r438:true,r350:mark}:{id:'r438:hero:'+e.name+':'+e.t0.toFixed(3),kind:'effect',x:fx,y:my,r409:true,r438:true,r350:mark};
  if(typeof ctx.scope==='function')ctx.scope(meta,run);else run();stats.drawn++;e.frame=fr;}catch(err){fail(err);}finally{ctx.restore();}}
function drawAll(){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;for(const e of list)drawOne(e);}
// ---- 적 → 영웅 ----------------------------------------------------------------------------------------
function enemyOf(src){if(!src||typeof room==='undefined'||!room?.enemies)return null;if(src.boss||src.midboss)return room.enemies.includes(src)?src:null;
 const id=src.ownerId||(typeof src.owner==='string'?src.owner:src.owner?.id);if(!id)return null;return room.enemies.find(v=>v&&v.id===id)||null;}
function frosty(e){try{return window.__STORYWORLD_BOSS_FX_R105__?.palOf?.(e)?.elem==='frost';}catch(_){return false;}}
function onHurt(src,res){if(res!=='hit'||!prefs.on||typeof player!=='object'||!player||roomId()==='ep1b06')return;
 if(!src||src.friendly||fin(src.vx)||src.type==='field'||src.periodic||src.dot||src.r431)return;/* 탄·장판·도트는 R411·R431 몫 */
 if(!(src.boss||src.midboss)&&!src.attack)return;/* 몸 접촉·휘두르기만 */const e=enemyOf(src);if(!e||!(e.boss||e.midboss))return;
 if(frosty(e))play('enemy-cold-wave',player.x,player.y,{size:e.boss?1:.85,flip:e.x>player.x,gap:.9,key:':hit'});
 else play('enemy-shockwave',player.x,player.y,{size:e.boss?1:.82,gap:.9,key:':hit'});}
const seenEnrage=new WeakSet();
function scanEnrage(){if(typeof room==='undefined'||!room?.enemies||roomId()==='ep1b06')return;for(const e of room.enemies){if(!e||!e.r205Enraged||seenEnrage.has(e))continue;seenEnrage.add(e);
 if(e.hp>0&&T()-(e.r205Enraged.at||0)<1)play('enemy-shockwave',e.x,e.y,{size:1.8,speed:.6,gap:0,key:':'+e.id});}}
const STATUS_FX={curse:'enemy-curse-brand',poison:'enemy-poison-mist',disease:'enemy-poison-mist',chill:'enemy-cold-wave',warp:'enemy-cold-wave'};
let prevStatus=new Set();
function scanStatus(){let rows=[];try{rows=window.__STORYWORLD_THEME_FX_R430__?.statusRows?.()||[];}catch(_){}const now=new Set();
 for(const r of rows){const k=String(r.key||'').replace(/^r431-/,'');now.add(k);if(prevStatus.has(k))continue;const n=STATUS_FX[k];if(!n||typeof player!=='object')continue;
  play(n,player.x,player.y,{size:n==='enemy-cold-wave'?.9:1,follow:n==='enemy-curse-brand'?player:null,gap:1.2,key:':st'});}
 prevStatus=now;}
let flankSeen=-1;
function scanFlank(){const F=window.__STORYWORLD_MOB_FLANK_R230__;if(!F?.inspect)return;let i;try{i=F.inspect();}catch(_){return;}const n=i?.stats?.flanks|0,last=i?.stats?.last;
 if(flankSeen<0){flankSeen=n;return;}if(n===flankSeen)return;flankSeen=n;if(!last?.from||!last?.to||typeof project!=='function')return;
 const [ax,ay]=last.from,[bx,by]=last.to,A=project(ax,ay),B=project(bx,by),dx=B.x-A.x,dy=B.y-A.y;if(!fin(dx+dy)||Math.hypot(dx,dy)<4)return;
 const left=dx<0,ang=Math.max(-.61,Math.min(.61,Math.atan2(dy,Math.abs(dx))));play('enemy-wraith-dash',(ax+bx)/2,(ay+by)/2,{flip:left,angle:left?-ang:ang,gap:.15,key:':'+last.id});}
// ---- 영웅 쪽 ------------------------------------------------------------------------------------------
let hp0=null,sh0=0,inv0=0,rid='',ridAt=0,alive0=-1,cleanAt=-9;
function scanHero(){if(typeof player!=='object'||!player)return;const t=T(),id=roomId();
 if(id!==rid){rid=id;ridAt=t;hp0=player.hp;sh0=player.shield||0;inv0=player.invincible||0;alive0=-1;return;}
 let mh=100;try{mh=Math.max(1,Number(maxHP())||100);}catch(_){}
 const hp=Number(player.hp)||0,settled=t-ridAt>1&&!(typeof loading!=='undefined'&&loading);
 if(settled&&hp0>0&&hp-hp0>=Math.max(4,mh*.06)&&player.hero!=='michaela'&&t-cleanAt>2)play('hero-healing',player.x,player.y,{follow:player,gap:1.5});
 hp0=hp;
 const sh=Number(player.shield)||0;if(settled&&sh>0&&sh0<=0)play('hero-barrier',player.x,player.y,{follow:player,gap:2,key:':b'});sh0=sh;
 const inv=Number(player.invincible)||0,why=String(player.invReason||'');if(settled&&inv>=1.5&&inv0<1.5&&inv<60&&/부활/.test(why))play('hero-barrier',player.x,player.y,{follow:player,gap:2,key:':b'});inv0=inv;
 if(typeof room!=='undefined'&&room?.enemies){const a=room.enemies.reduce((n,e)=>n+(e&&e.hp>0&&!e.deadRecorded?1:0),0);
  if(settled&&alive0>0&&a===0){cleanAt=t;play('hero-cleanse',player.x,player.y,{gap:3});}alive0=a;}}
// ---- 연결 ---------------------------------------------------------------------------------------------
try{
 if(typeof hurt==='function'){const base=hurt;hurt=function(v,src,...a){const r=base.call(this,v,src,...a);try{onHurt(src,r);}catch(err){fail(err);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r438-sheet-fx'){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(prefs.on){preload();scanEnrage();scanStatus();scanFlank();scanHero();const t=T();
   for(let i=list.length-1;i>=0;i--){const e=list[i];if((t-e.t0)*e.speed>=DUR||t<e.t0-2)list.splice(i,1);}}
   if(list.length)arm();else if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);list.length=0;prevStatus=new Set();rid='';return r;};}
}catch(e){fail(e);}
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};if(!prefs.on)list.length=0;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_FX_MORE_R438__=Object.freeze({revision:REV,dir:DIR,sheets:SHEET,statusFx:STATUS_FX,play,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:JSON.parse(JSON.stringify(stats)),active:list.map(e=>({name:e.name,frame:e.frame??null,x:+e.x.toFixed(2),y:+e.y.toFixed(2)})),lastError})});
})();
