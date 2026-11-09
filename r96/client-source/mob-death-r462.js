// R462 — 사망 모션 없는 몹의 죽음 연출(사용자 2026-11-09 "사망모션 없는 몹들은 다른걸로 대체해서 적용하지말고 불타면서 소멸하거나
//  피터지면서 소멸하고 시체나 사체남기도록").
//  · 일반 몹(보스·중간보스·페르소나 제외)은 자기 사망 모션 그림이 없다. 엔진 죽음 불꽃(spawnBurnDeath3)은 몸 그림으로 profile.frames.death 를 쓰는데,
//    이 그림이 다른 몹 그림일 때가 있다(R188·R375·R380 이 일부만 고침). → 몸은 '살아 있을 때 마지막으로 화면에 그려진 그 몹의 그림'만 쓴다.
//  · 몹 성격으로 두 갈래:
//    불(악마·망령·해골·기계·마법·가면·천사 등 살이 없는 것): 몸이 빨갛게 달아오르며 검게 타 들어가고 그 자리에 쓰러진 뒤
//      드라이브 core24 '화염벽' 시트(R411, 적 쪽 그림)가 몸 위로 타오른다 → 숯이 된 사체가 남는다(불씨 몇 초).
//    피(짐승·벌레·좀비·사람 등 살이 있는 것): 몸이 하얗게 번쩍·떨리다 쓰러지며 '시체 폭발' 시트(R411, 적 쪽)로 피와 뼛조각이 터진다
//      → 피 웅덩이(R190 CC0 피 시트 한 칸) 위에 핏빛 시체가 남는다.
//  · 쓰러짐은 그 몹 자기 그림을 발밑 기준으로 눕히는 것(코드 회전·납작)이라 다른 몹 그림을 빌리지 않는다.
//  · 시체는 바닥 층(제단 그리기 바로 뒤, 몸·영웅보다 아래)에 그린다. 한 방 최대 24구(저사양 10), 45초(저사양 15초) 뒤 4초에 걸쳐 사라진다. 지역을 옮기면 비운다.
//  · 판정·보상·처치 수·저장·AI 는 그대로(그림만). 보스·중간보스는 원래 연출 그대로.
//  · 끄기: localStorage['storyworld.r462.mobDeath']='{"on":false}' 뒤 새로고침. 시체만 끄기 {"corpses":false}.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_DEATH_R462__)return;
const REV='R462-mobdeath-1',KEY='storyworld.r462.mobDeath';
let prefs={on:true,corpses:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={looks:0,fire:0,blood:0,noLook:0,corpses:0,corpseDraws:0,sheetDraws:0,cleared:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0,low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx),fin=v=>typeof v==='number'&&Number.isFinite(v);
const clamp01=v=>v<0?0:v>1?1:v,ease=v=>{v=clamp01(v);return v*v*(3-2*v);};
const hash=s=>{let h=2166136261;for(const c of String(s||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const major=e=>!!(e&&(e.boss||e.midboss||e.miniBoss||e.r104Boss||e.persona||e.elite==='boss'));
// ---- 불 / 피 고르기 ---------------------------------------------------------------------------------------
// 살이 있는 것(짐승·벌레·좀비·점액·사람)은 피, 영혼·악마·뼈·기계·마법·물건(살이 없는 것)은 불. 162종 이름(본편·사몽 전 지역)을 보고 정한 낱말표.
//  ① 피 우선(불 낱말이 섞여도 피) → ② 불 → ③ 피 → ④ 나머지는 불(대부분 잔영·결정 같은 추상체).
const BLOOD_FIRST=/좀비|점액체|슬라임|개와 늑대|위장|소화액|식재료|피로 꿰맨|피냄새/;
const FIRE=/망령|혼령|잔영|잔향|잔재|잔류|환각|그림자|안개|파동|신호|공허|악마|천사|가고일|주문사|화염술사|흑마|마법|저주|십자가|가면|인장|봉인|공명|수문장|기계|로봇|드론|사이보그|보행기|태엽|연산|결정|핵|칩|수호기사|수호병|근위|전우|방패동료|호위병|파수|부활자|유리|칼날|지폐|동전|탄환|립스틱|요요|사탕|사진|문장|기록|연결|집행|검흔|모조체|구속자|불길|불면귀|재 나방|박수|하이힐|공포|관측|수집|형상|감시|안정화|쓰레기|오물|한탄|인과|그을|해골|뼈|유령|귀신|기억/;
const BLOOD=/거미|알집|짐승|늑대|사냥개|추적견|여우|뱀|고블린|의료인|환자|신도|수상한 자|갈망하는 자|추적자|전령|염소|포식|실험체|생체|용|쥐|박쥐|벌레|곰|개$|개 /;
function kindOf(look){const n=String(look?.name||'').replace(/^중간보스 · /,'');if(BLOOD_FIRST.test(n))return'blood';if(FIRE.test(n))return'fire';if(BLOOD.test(n))return'blood';return'fire';}
// ---- 살아 있을 때 마지막 그림 기억 -------------------------------------------------------------------------
// drawEnemy 가 실제로 그린 몸(sprite·drawAssetFrame3 중 가장 큰 그림)을 그대로 적어 둔다 → R385 빌리기·R380·R375 덧씌우기를 모두 탄 '화면에 보이던 그 몹'.
const looks=new Map();let capturing=null;
function remember(e,c){if(!e||!c)return;const prev=looks.get(e.id);if(!prev)stats.looks++;looks.delete(e.id);looks.set(e.id,c);
 if(looks.size>260){const it=looks.keys();for(let i=0;i<60;i++)looks.delete(it.next().value);}}
function wrapDraws(){
 if(typeof sprite==='function'&&!sprite.__r462){const base=sprite;const w=function(path,x,y,height,opt){const c=capturing;if(c&&fin(height)&&height>=c.h&&path&&!/assets\/(?:vfx|r190|r411|r438|rc144)\//.test(String(path)))
   {c.h=height;c.path=path;c.frame=null;c.flip=!!opt?.flip;c.x=x;c.y=y;}return base.apply(this,arguments);};w.__r462=true;try{sprite=w;}catch(_){}}
 if(typeof drawAssetFrame3==='function'&&!drawAssetFrame3.__r462){const base=drawAssetFrame3;const w=function(path,frame,x,y,height,opt){const c=capturing;if(c&&fin(height)&&height>=c.h&&path&&frame?.assetFrame)
   {c.h=height;c.path=path;c.frame=frame;c.flip=!!opt?.flip;c.x=x;c.y=y;}return base.apply(this,arguments);};w.__r462=true;try{drawAssetFrame3=w;}catch(_){}}
 if(typeof drawEnemy==='function'&&!drawEnemy.__r462){const base=drawEnemy;const w=function(e,...a){
   if(!prefs.on||!e||major(e)||!(e.hp>0)||e.spawnState==='dead')return base.apply(this,[e,...a]);
   // 엔진 drawEnemy 는 그림을 window.__STORYWORLD_STORY_COMBAT_R54__.frameFor / __STORYWORLD_PHASE1_ART__.enemy 로 고른다(R380 등은 ctx.drawImage 로 바로 그림).
   //  그리는 동안만 둘을 엿보는 껍데기로 바꿔 '이번에 고른 그림'을 받아 적는다(값은 그대로 돌려줌).
   const prior=capturing,c={h:0,path:null,frame:null,flip:false,picked:null};capturing=c;
   const S=window.__STORYWORLD_STORY_COMBAT_R54__,A=window.__STORYWORLD_PHASE1_ART__;
   try{if(S&&typeof S.frameFor==='function')window.__STORYWORLD_STORY_COMBAT_R54__={...S,frameFor(x,f){const r=S.frameFor(x,f);if(x===e&&r&&(r.path||r.assetFrame))c.picked=r;return r;}};}catch(_){}
   try{if(A&&typeof A.enemy==='function')window.__STORYWORLD_PHASE1_ART__={...A,enemy(x){const r=A.enemy(x);if(x===e&&r?.frame&&!c.picked)c.picked=r.frame.path?r.frame:{...r.frame,path:r.path};return r;}};}catch(_){}
   try{return base.apply(this,[e,...a]);}finally{capturing=prior;
    try{if(window.__STORYWORLD_STORY_COMBAT_R54__!==S)window.__STORYWORLD_STORY_COMBAT_R54__=S;}catch(_){}try{if(window.__STORYWORLD_PHASE1_ART__!==A)window.__STORYWORLD_PHASE1_ART__=A;}catch(_){}
    try{const z=typeof zoom==='number'&&zoom>0?zoom:1;let look=null;
     if(c.path&&c.h>4)look={path:c.path,frame:c.frame,flip:c.flip,h:c.h/z};
     else if(c.picked&&(c.picked.path||e.path)&&c.picked.assetFrame){const f=c.picked,b=f.assetFrame.bakedFacing,
       flip=typeof f.flip==='boolean'?f.flip:b==='left'?e.direction==='right':b==='right'?e.direction==='left':b==='front'||b==='back'||b==='eight-way'?false:e.direction==='left',
       hh=(typeof actorHeight==='function'?actorHeight():60)*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1);
       look={path:f.path||e.path,frame:f,flip,h:hh/z};}
     if(look)remember(e,{id:e.id,name:e.name,nativeId:e.nativeId,dir:e.direction,...look});}catch(err){fail(err);}}};
  w.__r462=true;try{drawEnemy=w;}catch(_){}}
 return typeof drawEnemy==='function'&&!!drawEnemy.__r462;}
// ---- 시트 ----------------------------------------------------------------------------------------------
const SHEETS={fire:{p:'assets/r411/fx/boss-fire-wall.webp',cell:256,cols:6,frames:24,pivot:[128,175],vis:110},
 blood:{p:'assets/r411/fx/boss-corpse-explosion.webp',cell:256,cols:6,frames:24,pivot:[128,192],vis:150},
 pool:{p:'assets/r190/blood/blood-death.webp',cell:128,cols:4,frames:16,pivot:[64,64],vis:96}};
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();
 if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
function sheet(name,fr,x,y,heightPx,alpha,o={}){const S=SHEETS[name],im=image(S.p);if(!im||alpha<=.01)return false;fr=Math.max(0,Math.min(S.frames-1,fr|0));
 const s=heightPx/S.vis;ctx.save();try{ctx.globalAlpha*=clamp01(alpha);if(o.filter)ctx.filter=o.filter;ctx.translate(x,y);if(o.squash)ctx.scale(1,o.squash);ctx.scale(o.flip?-s:s,s);
  ctx.drawImage(im,(fr%S.cols)*S.cell,Math.floor(fr/S.cols)*S.cell,S.cell,S.cell,-S.pivot[0],-S.pivot[1],S.cell,S.cell);stats.sheetDraws++;}finally{ctx.restore();}return true;}
// 그 몹 자기 그림을 발밑(x,y) 기준으로 그린다. fall 0→1 이면 한쪽으로 기울며 주저앉아(회전+납작) 무너진 사체 꼴이 된다.
//  (옆모습 한 장이라 90도로 눕히면 거미·나방 같은 몸은 알아볼 수 없어서, 30도쯤 기울고 키를 반으로 줄인 '무너진 더미'로 둔다.)
function body(look,x,y,hPx,o){const side=o.side||1,fall=ease(o.fall||0),ang=side*fall*.52,squash=1-fall*.5;
 ctx.save();try{ctx.translate(x-side*fall*hPx*.1,y);if(squash<1)ctx.scale(1,squash);
  const opt={alpha:o.alpha,flip:look.flip,angle:ang,filter:o.filter};
  if(!(look.frame&&drawAssetFrame3(look.path,look.frame,0,0,hPx,opt)))sprite(look.path,0,0,hPx,opt);}finally{ctx.restore();}}
// ---- 죽는 순간(엔진 enemyBurnDeath 효과를 그대로 쓰되, 그리기만 바꿈) -----------------------------------------
const LIFE={fire:1.7,blood:1.15},FALL={fire:[.3,.78],blood:[0,.24]};
function adopt(fx){if(fx.r462!==undefined)return fx.r462;fx.r462=null;if(!prefs.on||fx.boss||fx.midboss)return null;
 const look=looks.get(fx.sourceId);if(!look){stats.noLook++;return null;}
 const kind=kindOf(look),h=hash(fx.sourceId);fx.r462={kind,look,side:(look.flip?-1:1)*((h>>>3)&1?1:-1),seed:h};fx.life=Math.max(fx.life||0,LIFE[kind]);stats[kind]++;
 if(prefs.corpses)addCorpse(fx);return fx.r462;}
function drawDying(fx,base){const R=fx.r462,look=R.look,q=project(fx.x,fx.y),z=typeof zoom==='number'&&zoom>0?zoom:1,hPx=Math.max(14,look.h*z),age=fx.age,[f0,f1]=FALL[R.kind],fall=clamp01((age-f0)/(f1-f0));
 if(R.kind==='fire'){
  // 엔진 불꽃·불티는 살리되 엔진 몸 그림(다른 몹일 수 있음)은 빼고 그린다
  const keep=fx.bodyPath;fx.bodyPath=null;try{base(fx);}finally{fx.bodyPath=keep;}
  if(age<f1){const heat=clamp01(age/.3),char=clamp01((age-.12)/.6),b=(1.45-heat*.25)*(1-char)+.3*char;
   body(look,q.x,q.y,hPx,{side:R.side,fall,alpha:1,filter:`brightness(${b.toFixed(3)}) saturate(${(1.5-char*1.1).toFixed(3)}) contrast(${(1+char*.2).toFixed(3)})`});}
  const t=clamp01((age-.08)/(fx.life-.08));sheet('fire',Math.floor(t*24),q.x-R.side*hPx*.05,q.y+hPx*.04,hPx*(.34+.14*fall),(age<.2?age/.2:1)*(t>.8?(1-t)/.2:1),{flip:R.side<0});
 }else{
  if(age<f1){const flash=age<.1?1.55:1.2,shake=Math.sin(age*95)*hPx*.03*(1-fall);
   body(look,q.x+shake,q.y,hPx,{side:R.side,fall,alpha:1,filter:`brightness(${flash}) saturate(.7)`});}
  const t=clamp01((age-.05)/(fx.life-.05));sheet('blood',Math.floor(t*24),q.x-R.side*hPx*.08,q.y+hPx*.02,hPx*.9,1,{flip:R.side<0});
 }}
function wrapBurn(){if(typeof drawBurnDeath3!=='function'||drawBurnDeath3.__r462)return typeof drawBurnDeath3==='function';const base=drawBurnDeath3;
 const w=function(fx,...a){try{if(fx&&adopt(fx)){drawDying(fx,base);return;}}catch(err){fail(err);}return base.apply(this,[fx,...a]);};w.__r462=true;try{drawBurnDeath3=w;}catch(_){}return true;}
// ---- 시체 ----------------------------------------------------------------------------------------------
let corpses=[],corpseRoom=null;
function addCorpse(fx){if(typeof room==='undefined'||!room)return;if(corpseRoom!==room){corpses=[];corpseRoom=room;}const R=fx.r462,max=low()?10:24;
 corpses.push({x:fx.x,y:fx.y,kind:R.kind,look:R.look,side:R.side,seed:R.seed,t0:T()+(R.kind==='fire'?FALL.fire[1]:FALL.blood[1])});stats.corpses++;
 while(corpses.length>max)corpses.shift();}
function drawCorpses(){if(!prefs.on||!prefs.corpses||!corpses.length)return;if(typeof room==='undefined'||room!==corpseRoom){corpses=[];stats.cleared++;return;}
 const now=T(),stay=low()?15:45,z=typeof zoom==='number'&&zoom>0?zoom:1;
 corpses=corpses.filter(c=>now-c.t0<stay+4);
 for(const c of corpses){const age=now-c.t0;if(age<0)continue;const q=project(c.x,c.y),hPx=Math.max(14,c.look.h*z),fade=age>stay?1-(age-stay)/4:1;if(fade<=0)continue;
  ctx.save();try{
   if(c.kind==='blood'){const grow=clamp01(age/.9);sheet('pool',Math.round(3+grow*4),q.x-c.side*hPx*.1,q.y,hPx*(.55+.35*grow),.78*fade,{squash:.42,flip:(c.seed&1)===1});
    body(c.look,q.x,q.y,hPx,{side:c.side,fall:1,alpha:.95*fade,filter:'brightness(.68) saturate(1.2) contrast(1.06)'});}
   else{/* 그을린 바닥 자국: 피 웅덩이 칸을 검게(몬스터 그림자는 R444 가 없앴으므로 shadow() 는 쓰지 않음) */
    sheet('pool',7,q.x-c.side*hPx*.1,q.y,hPx*.75,.6*fade,{squash:.4,flip:(c.seed&1)===1,filter:'brightness(.12) saturate(0)'});
    body(c.look,q.x,q.y,hPx,{side:c.side,fall:1,alpha:.96*fade,filter:'brightness(.42) saturate(.35) contrast(1.12)'});
    const glow=clamp01(1-age/4.5);if(glow>0&&typeof texture==='function'&&typeof VFX!=='undefined'&&VFX.burnFlame){const fl=.75+.25*Math.sin(now*9+c.seed%7);
     texture(VFX.burnFlame,q.x-c.side*hPx*.12,q.y-hPx*.12,hPx*.5,hPx*.22,{alpha:.22*glow*fl*fade});}}
   stats.corpseDraws++;}catch(err){fail(err);}finally{ctx.restore();}}}
function wrapObjective(){if(typeof drawObjective!=='function'||drawObjective.__r462)return typeof drawObjective==='function';const base=drawObjective;
 const w=function(...a){const r=base.apply(this,a);try{drawCorpses();}catch(err){fail(err);}return r;};w.__r462=true;try{drawObjective=w;}catch(_){}return true;}
// ---- 설치 ----------------------------------------------------------------------------------------------
let tries=0,ok=false;
function install(){try{const a=wrapDraws(),b=wrapBurn(),c=wrapObjective();ok=a&&b&&c;}catch(e){fail(e);}return ok;}
install();(function arm(){if(!ok&&++tries<80&&typeof setTimeout==='function')setTimeout(()=>{install();arm();},250);})();
try{if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(...a){corpses=[];corpseRoom=null;return base.apply(this,a);};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_MOB_DEATH_R462__=Object.freeze({revision:REV,set,kindOf,
 inspect:()=>({revision:REV,installed:ok,prefs:{...prefs},corpses:corpses.length,stats:{...stats},lastError})});
})();
