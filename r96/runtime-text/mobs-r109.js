/* R109 잡몹 교차 동작 (사용자 요청 2026-10-27 14:43)
 * "몹 생동감을 꿀렁임으로 대체하지 말고 보스몹처럼 여러 이미지 교차 액션으로"
 * 1) 꿀렁임 제거: 잡몹(보스·중간보스·페르소나 제외)의 몸 늘이기·찌그러뜨리기·기울이기·통통 튀기(R101 몸 자세)를 끈다.
 *    남는 것은 몸 전체를 그대로 옮기는 것뿐이다: 맞을 때 4px 이하로 밀림, 공격 그림이 없는 몹의 짧은 전진.
 *    날개·부유 몹은 R100 호버를 몸 높이 1.2% 이하의 느린 상하로 줄인다.
 * 2) 교차 동작: 여러 장 그림이 있는 몹은 그림을 갈아 끼워 움직인다.
 *    - R92 이동·공격 스트립(이야기 지역에서만 쓰이던 것)을 사몽 생존전·미로·상승(DREAM)에서도 쓴다.
 *    - Drive 2026-10-27 잡몹 4키 후보 5종(M002 거미·M003 주문사·M007 가고일·M008 늪 악마·M019 뇌 장치)을
 *      가공한 이동 스트립(assets/r109/mobs, scripts/r109-mob-frames.py)을 더한다.
 *    - 날개·부유 몹은 서 있을 때도 날갯짓·호버 그림을 천천히 돌린다.
 * R110: Drive 저녁 묶음 M137(사이보그 이동 4장)·M119(향로 사제 대기 4장, 서 있을 때·움직일 때 모두)·종이 인형 이동 4장(art-drive-r105의
 *   Drive 그림 한 장 경로에 artPatch로 끼움: 걸을 때만 갈아 끼우고 서 있을 때·공격 때는 원래 그림)을 더한다.
 * 공격 시간·판정·AI·저장 형식은 읽기만 하고 바꾸지 않는다(그림만 바뀜). 병원(ep1a08) 전용 자세와 R74 세계 괴물 그림은 건드리지 않는다. */
(()=>{'use strict';
if(window.__STORYWORLD_MOBS_R109__||typeof drawEnemy!=='function')return;
const REV='R110-mobs-2',R92='./assets/r92/mobs/index.json',R109='./assets/r109/mobs/index.json';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r109.mobs';
const FPS={walk:6.5,fly:8,hover:4},IDLE_FPS={fly:3.2,hover:2.6,idle:3.4},FOLLOW=.22,HOVER=.012;
let prefs={frames:true,calm:true,seeHero:true,tidyLabels:true},state='idle',r92=null,r109=null,lastError=null,failures=0,preloadAt=0,preloadZone=null;
const stats={draws:0,move:0,idle:0,windup:0,attack:0,follow:0,calmPoses:0,hover:0,missingImage:0,preloads:0,artMove:0,seeThrough:0,stripFlips:0,labelsHidden:0};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
const finite=Number.isFinite,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const now=()=>typeof time==='number'?time:0;
const reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
function set(patch={}){for(const k of Object.keys(prefs))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
const major=e=>!!(e&&(e.boss||e.midboss||e.persona));
const POL=()=>window.__STORYWORLD_POLISH_R100__;
const winged=e=>{try{return !!POL()?.artOf?.(e)?.fly;}catch(_){return false;}};

// ---- track table: nativeId -> {move,attack,kind} --------------------------------------------
const table=new Map(),artRows=new Map();
function build(){table.clear();artRows.clear();
 if(r92)for(const [gid,g] of Object.entries(r92.groups||{}))for(const id of g.ids||[])table.set(id,{gid,move:g.tracks.move||null,attack:g.tracks.attack||null,kind:'walk',src:'R92'});
 if(r109)for(const t of r109.tracks||[]){const tr=t.track||'move';if(tr!=='move'&&tr!=='idle')continue;
  // R110: Drive 그림 하나로 그려지던 몹(art 경로)은 그 그림 경로로 찾는다.
  if(t.art){artRows.set(String(t.art).replace(/^\.\//,''),{gid:t.group,move:tr==='move'?t:null,idle:tr==='idle'?t:null,attack:null,kind:t.kind||'walk',src:'R110-art'});continue;}
  for(const id of t.ids||[]){const row=table.get(id)||{gid:t.group,move:null,idle:null,attack:null,kind:'walk',src:'R109'};
  table.set(id,{...row,gid:t.group,...(tr==='move'?{move:t,kind:t.kind||'walk'}:{idle:t}),src:row.src==='R92'?'R92+R109':'R109'});}}}
function load(){if(state!=='idle')return;state='loading';
 const get=u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(u+' '+r.status);return r.json();});
 Promise.allSettled([get(R92),get(R109)]).then(([a,b])=>{if(a.status==='fulfilled')r92=a.value;else fail(a.reason);if(b.status==='fulfilled')r109=b.value;else fail(b.reason);
  build();state=table.size?'ready':'failed';}).catch(e=>{state='failed';fail(e);});}
const rowOf=e=>e?.nativeId?table.get(e.nativeId)||null:null;
const cell=t=>t.frames||t.pivots?.length||4;
const cache=new Map();
function frame(t,i,facing){const k=t.path+':'+i+':'+(facing||'');let f=cache.get(k);if(f)return f;const [cw,ch]=t.cell,[px,py]=t.pivot||t.pivots[i];
 f=Object.freeze({path:t.path,r92Mob:true,r109Mob:true,assetFrame:Object.freeze({sourceRect:[i*cw,0,cw,ch],pivot:[px,py],visibleHeight:t.visibleHeight||150,...(facing?{bakedFacing:facing}:{})})});cache.set(k,f);return f;}
const ready=t=>!!t&&typeof readyImage==='function'&&!!readyImage(t.path);
const art=e=>{try{return window.__STORYWORLD_DRIVE_ART_R105__?.artFor?.(e)||null;}catch(_){return null;}};
const eligible=e=>!!e&&!major(e)&&!e.r74Monster&&e.hp>0&&e.spawnState!=='dead'&&!(e.hitTimer>0)&&typeof zone!=='undefined'&&zone!=='ep1a08'&&!art(e);
const flies=(e,row)=>row.kind==='fly'||row.kind==='hover'||winged(e);

const artRowOf=e=>{const p=art(e);return p?artRows.get(String(p).replace(/^\.\//,''))||null:null;};
// R110: art-drive-r105가 Drive 그림 한 장으로 바꿔 그리는 몹도 같은 그림의 4장 이동 스트립이 있으면 걸을 때 갈아 끼운다.
// 서 있을 때·공격할 때는 원래 Drive 그림 한 장을 그대로 둔다.
function artPatch(e,path){if(state!=='ready'||!prefs.frames||!e||major(e)||!(e.hp>0)||e.spawnState==='dead'||e.hitTimer>0||!e.moving||e.attack||e.rangedWindup>0)return null;
 const row=artRows.get(String(path||'').replace(/^\.\//,''));const M=row?.move;if(!M)return null;
 if(!ready(M)){if(typeof addImage==='function'){addImage(M.path,'R110 drive art move strip');stats.preloads++;}stats.missingImage++;return null;}
 const n=cell(M),i=Math.floor(now()*FPS.walk+(hash(e.id)%n))%n,f=frame(M,i,null);stats.move++;stats.artMove++;return{move:f,idle:f};}

// 원래 drawEnemy의 상태 선택(이동·준비·공격)을 그대로 따라 그 순간의 칸을 빌려준다.
function patchFor(e){const row=rowOf(e);if(!row)return null;const F=e.profile?.frames||{},out={},face=F.idle?.assetFrame?.bakedFacing;
 const A=row.attack;
 if(e.attack&&A){if(!ready(A)){stats.missingImage++;return null;}
  const shape=e.attack.shape154||e.combatProfile?.attackShape||{},wind=Number(e.attack.castWindup150??shape.windup)||0,act=Number(shape.active)||0,t=Number(e.attack.elapsed)||0;
  const n=cell(A),half=Math.max(1,Math.floor(n/2)),i=t<wind?Math.min(half-1,Math.floor(t/Math.max(.01,wind)*half)):t<wind+act?Math.min(n-1,half):Math.min(n-1,half+1+Math.floor((t-wind-act)/FOLLOW*(n-half-1)));
  const f=frame(A,i,F.attack?.assetFrame?.bakedFacing||face);
  if(t<wind+act){out.attack=out.attackA=out.attackB=out.windup=f;stats[t<wind?'windup':'attack']++;return out;}
  if(t<wind+act+FOLLOW){out.idle=out.move=f;stats.follow++;return out;}}
 if(e.rangedWindup>0&&A){if(!ready(A)){stats.missingImage++;return null;}const f=frame(A,Math.floor(now()*5)%2,F.attack?.assetFrame?.bakedFacing||face);out.attack=out.windup=f;stats.windup++;return out;}
 // R110: 대기 4장만 있는 몹(M119 향로 사제)은 서 있을 때도 움직일 때도 대기 그림을 천천히 돌린다.
 if(!row.move&&row.idle){const I=row.idle;if(!ready(I)){stats.missingImage++;return null;}
  const n=cell(I),i=Math.floor(now()*IDLE_FPS.idle+(hash(e.id)%n))%n,f=frame(I,i,F.idle?.assetFrame?.bakedFacing||face);out.idle=out.move=f;stats.idle++;return out;}
 const M=row.move;if(!M)return null;
 const fly=flies(e,row),moving=!!e.moving;if(!moving&&!fly)return null;
 if(!ready(M)){stats.missingImage++;return null;}
 const n=cell(M),kind=fly?(row.kind==='hover'?'hover':'fly'):'walk',fps=moving?(FPS[kind]||FPS.walk):(IDLE_FPS[kind]||IDLE_FPS.fly);
 const i=Math.floor(now()*fps+(hash(e.id)%n))%n,f=frame(M,i,F.move?.assetFrame?.bakedFacing||face);
 out.move=f;if(!moving){out.idle=f;stats.idle++;}else stats.move++;return out;}

// 지역에 들어가면 원래 이미지 캐시가 비워지므로 필요한 스트립을 다시 요청한다.
function preload(){const t=performance.now();if(typeof addImage!=='function'||typeof readyImage!=='function')return;if(preloadZone===zone&&t-preloadAt<2000)return;preloadAt=t;preloadZone=zone;
 const want=new Set();for(const e of room?.enemies||[]){const r=rowOf(e)||artRowOf(e);if(r){for(const t of [r.move,r.attack,r.idle])if(t)want.add(t.path);}}
 for(const p of want)if(!readyImage(p)){addImage(p,'R109 mob cross-frame motion');stats.preloads++;}}

// ---- calm body pose (꿀렁임 제거) --------------------------------------------------------------
let scoped=null;const knock=new WeakMap();
function calm(c,e){const z=typeof Z==='function'?Z():(typeof zoom==='number'?zoom:1);let dx=0;
 // 맞음: 영웅 반대쪽으로 몸 전체가 4px 이하로 밀렸다가 0.2초 안에 돌아온다(늘이기·찌그러뜨리기 없음).
 if(e.hitTimer>0&&player){let k=knock.get(e);if(!k||now()-k.at>.25){k={at:now(),dir:Math.sign((e.x-e.y)-(player.x-player.y))||1};knock.set(e,k);}const u=clamp((now()-k.at)/.2,0,1);dx+=k.dir*4*Math.sin(Math.PI*u)*(1-u*.3);}
 // 공격 그림이 없는 몹: 준비에서 살짝 물러섰다가 공격 순간 짧게 내딛는다(회전·변형 없음).
 const a=e.attack,row=rowOf(e);if(a&&finite(a.elapsed)&&!(prefs.frames&&row?.attack)){const shape=a.shape154||e.combatProfile?.attackShape||{},w=Math.max(.05,a.castWindup150??shape.windup??.3),act=Math.max(.05,shape.active??.15);
  const ang=finite(a.angle)?a.angle:Math.atan2((player?.y??e.y)-e.y,(player?.x??e.x)-e.x),sign=Math.sign(Math.cos(ang)-Math.sin(ang))||1;
  dx+=a.elapsed<w?-sign*1.5*smooth(a.elapsed/w):sign*4*(1-smooth((a.elapsed-w)/(act+.18)));}
 dx*=z*(reduced()?.5:1);if(dx)c.translate(dx,0);stats.calmPoses++;return{shear:0,scaleY:1,phase:'r109-calm',angle:0};}
const chain=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;
if(chain&&typeof chain.applyBodyPose==='function')window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({...chain,
 applyBodyPose(c,hero=false){const e=scoped;if(hero||!prefs.calm||!e||major(e)||!c||!(e.hp>0)||e.spawnState==='dead'||(typeof zone!=='undefined'&&zone==='ep1a08'))return chain.applyBodyPose(c,hero);
  try{return calm(c,e);}catch(err){fail(err);return chain.applyBodyPose(c,hero);}},
 hasMotion(e){if(prefs.calm&&e&&!major(e)&&e.hp>0&&(typeof zone==='undefined'||zone!=='ep1a08'))return !!(e.hitTimer>0||e.attack);return chain.hasMotion(e);}});

// ---- R110 공격 그림 방향 (사용자 2026-10-27 22:38 "악마화 나무의 근위 몹 공격 시 방향도 플레이어 보게, 지금 반대임, 공격 시 좌우반전") ----
// R92/R109 스트립에는 원본이 바라보는 쪽 정보가 없어 공격 칸이 영웅 위치와 상관없이 늘 같은 쪽을 봤다.
// 눈으로 확인한 스트립만 원본 방향(L/R)을 적고, 그 칸을 그릴 때 영웅 쪽을 보도록 좌우를 정한다.
// (flip 값은 '그림을 뒤집어 그린다'가 아니라 '왼쪽을 보게 그린다'로 쓰인다: 2026-10-27 양쪽 스크린샷으로 확인)
// 이야기 지역(STORY)에서는 R54 공격 자세 칸(rc137 공격 묶음)이, 사몽(DREAM)에서는 R92 M004 공격 스트립이 쓰인다. 둘 다 칼을 왼쪽으로 휘두르는 그림.
const STRIP_FACE={'M004-attack':'L','assets/rc137/mob-attacks-01.png#940,0':'L'}; // 거짓천국 근위천사(a11-c1)·악마화 나무의 침식 근위(dist00 순찰) 등 M004 계열
const stripKey=f=>{const p=String(f?.path||'').replace(/^\.\//,''),m=/\/(M\d+|PAPER)-(attack|move|idle)\.png$/.exec(p);if(m)return m[1]+'-'+m[2];const r=f?.assetFrame?.sourceRect;return r?p+'#'+r[0]+','+r[1]:null;};
const motionR51=window.__STORYWORLD_ENEMY_MOTION_R51__;
if(motionR51&&typeof motionR51.flip==='function')window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...motionR51,flip(e,f,fallback){
 try{if(f&&e&&!major(e)&&(e.attack||e.rangedWindup>0)&&typeof player!=='undefined'&&player){const art=STRIP_FACE[stripKey(f)];if(art){const du=(player.x-player.y)-(e.x-e.y),left=du<0;stats.stripFlips++;return art==='L'?left:!left;}}}catch(err){fail(err);}
 return motionR51.flip(e,f,fallback);}});

// ---- R110 영웅 가림 방지: 영웅보다 앞(화면 아래쪽)에 선 적의 그림이 영웅 몸통을 덮으면 그 적만 반투명하게 그린다 ----
// (R106 "이펙트가 영웅을 가리지 않게"와 같은 원칙. 판정·순서는 그대로, 그림의 불투명도만 낮춘다.)
function seeAlpha(e){if(!prefs.seeHero||!e||!(e.hp>0)||e.spawnState==='dead'||typeof player==='undefined'||!player||!(player.hp>0)||player.visible===false||typeof project!=='function'||typeof actorHeight!=='function')return 1;
 if(!((e.x+e.y)>(player.x+player.y)))return 1;
 const H=actorHeight(),p=project(player.x,player.y),q=project(e.x,e.y),eh=H*(e.combatProfile?.spriteRect?.height||(e.boss?2.05:1))*(e.defScale||1),ew=eh*.62;
 const hx0=p.x-H*.28,hx1=p.x+H*.28,hy0=p.y-H*.95,hy1=p.y-H*.08,ix=Math.max(0,Math.min(q.x+ew/2,hx1)-Math.max(q.x-ew/2,hx0)),iy=Math.max(0,Math.min(q.y,hy1)-Math.max(q.y-eh,hy0));
 const f=ix*iy/((hx1-hx0)*(hy1-hy0));if(!(f>.12))return 1;stats.seeThrough++;return 1-Math.min(major(e)?.35:.55,f*(major(e)?.5:.8));}

// ---- R110 공격 예고 이름표 겹침 정리: 떼로 몰려 공격할 때 '근접 공격 준비/원거리 조준' 상자가 겹겹이 쌓였다 ----
// 같은 화면 프레임에서 이미 그린 이름표와 겹치는 자리면 상자·글자만 생략한다(방향 화살표·바닥 예고·공격 판정은 그대로).
const LABELS=new Set(['근접 공격 준비','원거리 조준']),BOX=new Set(['rgba(14,13,15,.92)','rgba(14, 13, 15, 0.92)']);
let labelFrame=-1,labelSpots=[];
function labelClash(e){if(!prefs.tidyLabels||!e||major(e)||!(e.attack||e.rangedWindup>0)||typeof project!=='function'||typeof actorHeight!=='function')return false;
 const t=now();if(t!==labelFrame){labelFrame=t;labelSpots=[];}const z=typeof zoom==='number'?zoom:1,q=project(e.x,e.y),h=actorHeight()*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1),y=q.y-h;
 if(!finite(q.x)||!finite(y))return false;const hit=labelSpots.some(s=>Math.abs(s.x-q.x)<92*z&&Math.abs(s.y-y)<20*z);if(!hit)labelSpots.push({x:q.x,y});return hit;}
let muting=false;
function muteLabel(c){const own=k=>Object.prototype.hasOwnProperty.call(c,k),had={fillRect:own('fillRect'),rect:own('rect'),fillText:own('fillText')},fr=c.fillRect,rc=c.rect,ft=c.fillText;let skipRect=false;muting=true;
 c.fillRect=function(...a){if(BOX.has(String(this.fillStyle).replace(/\s+/g,' '))||BOX.has(String(this.fillStyle))){skipRect=true;stats.labelsHidden++;return;}return fr.apply(this,a);};
 c.rect=function(...a){if(skipRect){skipRect=false;return;}return rc.apply(this,a);};
 c.fillText=function(txt,...a){if(LABELS.has(String(txt)))return;return ft.call(this,txt,...a);};
 return()=>{muting=false;for(const [k,v] of [['fillRect',fr],['rect',rc],['fillText',ft]]){if(had[k])c[k]=v;else delete c[k];}};}

// ---- draw wrapper ------------------------------------------------------------------------------
const base=drawEnemy;
drawEnemy=function(e,...args){const prevScope=scoped;scoped=e;let patch=null,prof=null,lift=null;
 try{load();if(state==='ready'&&prefs.frames&&eligible(e)){preload();patch=patchFor(e);}
  // 날개·부유 몹의 호버는 느리고 작게(몸 높이 1.2% 이하): R100은 이미 정해진 높이를 그대로 쓴다.
  if(prefs.calm&&e&&!major(e)&&e.hp>0&&e.spawnState!=='dead'&&typeof actorHeight==='function'){const row=rowOf(e);if((row&&flies(e,row))||winged(e)){
   const own=Object.prototype.hasOwnProperty.call(e,'visualLiftPx'),old=e.visualLiftPx;if(!(finite(old)&&old>0)){const h=actorHeight();lift={own,old};e.visualLiftPx=h*(.13+HOVER*Math.sin(now()*1.6+hash(e.id)%628/100));stats.hover++;}}}}
 catch(err){fail(err);patch=null;}
 let ga=null,unmute=null;try{if(!muting&&labelClash(e)&&typeof ctx!=='undefined'&&ctx)unmute=muteLabel(ctx);}catch(err){fail(err);}
 try{const a=seeAlpha(e);if(a<1&&typeof ctx!=='undefined'&&ctx&&finite(ctx.globalAlpha)){ga=ctx.globalAlpha;ctx.globalAlpha=ga*a;}}catch(err){fail(err);}
 try{if(patch){prof=e.profile;const sh=Object.create(prof);sh.frames={...(prof.frames||{}),...patch};e.profile=sh;stats.draws++;}
  return base.call(this,e,...args);}
 finally{if(unmute){try{unmute();}catch(_){}}if(ga!==null)ctx.globalAlpha=ga;if(prof)e.profile=prof;if(lift){if(lift.own)e.visualLiftPx=lift.old;else delete e.visualLiftPx;}scoped=prevScope;}};

window.__STORYWORLD_MOBS_R109__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,storageKey:KEY,
 trackFor:e=>{const r=rowOf(e)||artRowOf(e);return r?{group:r.gid,src:r.src,kind:r.kind,idle:r.idle?{path:r.idle.path,frames:cell(r.idle)}:null,move:r.move?{path:r.move.path,frames:cell(r.move)}:null,attack:r.attack?{path:r.attack.path,frames:cell(r.attack)}:null}:null;},
 artPatch:(e,path)=>{try{return artPatch(e,path);}catch(err){fail(err);return null;}},
 seeAlpha:e=>{try{return seeAlpha(e);}catch(err){fail(err);return 1;}},
 patchFor:e=>{try{return state==='ready'&&eligible(e)?patchFor(e):null;}catch(err){fail(err);return null;}},
 coverage:()=>{const es=(room?.enemies||[]).filter(e=>!major(e));return{zone,layer:typeof layer==='undefined'?null:layer,enemies:es.length,mapped:es.filter(e=>rowOf(e)).length,withMove:es.filter(e=>rowOf(e)?.move).length,withAttack:es.filter(e=>rowOf(e)?.attack).length,driveStatic:es.filter(e=>art(e)).length};},
 inspect:()=>({revision:REV,state,ids:table.size,artRows:artRows.size,r109Groups:(r109?.tracks||[]).map(t=>t.group),prefs:{...prefs},stats:{...stats},failures,lastError,presentationOnly:true,gameplayChanged:false,saveSlotsChanged:false})});
})();
