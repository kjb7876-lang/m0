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
 * 공격 시간·판정·AI·저장 형식은 읽기만 하고 바꾸지 않는다(그림만 바뀜). 병원(ep1a08) 전용 자세와 R74 세계 괴물 그림은 건드리지 않는다. */
(()=>{'use strict';
if(window.__STORYWORLD_MOBS_R109__||typeof drawEnemy!=='function')return;
const REV='R109-mobs-1',R92='./assets/r92/mobs/index.json',R109='./assets/r109/mobs/index.json';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r109.mobs';
const FPS={walk:6.5,fly:8,hover:4},IDLE_FPS={fly:3.2,hover:2.6},FOLLOW=.22,HOVER=.012;
let prefs={frames:true,calm:true},state='idle',r92=null,r109=null,lastError=null,failures=0,preloadAt=0,preloadZone=null;
const stats={draws:0,move:0,idle:0,windup:0,attack:0,follow:0,calmPoses:0,hover:0,missingImage:0,preloads:0};
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
const table=new Map();
function build(){table.clear();
 if(r92)for(const [gid,g] of Object.entries(r92.groups||{}))for(const id of g.ids||[])table.set(id,{gid,move:g.tracks.move||null,attack:g.tracks.attack||null,kind:'walk',src:'R92'});
 if(r109)for(const t of r109.tracks||[]){if(t.track!=='move')continue;for(const id of t.ids||[]){const row=table.get(id)||{gid:t.group,move:null,attack:null,kind:'walk',src:'R109'};
  table.set(id,{...row,gid:t.group,move:t,kind:t.kind||'walk',src:row.src==='R92'?'R92+R109':'R109'});}}}
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
 const M=row.move;if(!M)return null;
 const fly=flies(e,row),moving=!!e.moving;if(!moving&&!fly)return null;
 if(!ready(M)){stats.missingImage++;return null;}
 const n=cell(M),kind=fly?(row.kind==='hover'?'hover':'fly'):'walk',fps=moving?(FPS[kind]||FPS.walk):(IDLE_FPS[kind]||IDLE_FPS.fly);
 const i=Math.floor(now()*fps+(hash(e.id)%n))%n,f=frame(M,i,F.move?.assetFrame?.bakedFacing||face);
 out.move=f;if(!moving){out.idle=f;stats.idle++;}else stats.move++;return out;}

// 지역에 들어가면 원래 이미지 캐시가 비워지므로 필요한 스트립을 다시 요청한다.
function preload(){const t=performance.now();if(typeof addImage!=='function'||typeof readyImage!=='function')return;if(preloadZone===zone&&t-preloadAt<2000)return;preloadAt=t;preloadZone=zone;
 const want=new Set();for(const e of room?.enemies||[]){const r=rowOf(e);if(r){if(r.move)want.add(r.move.path);if(r.attack)want.add(r.attack.path);}}
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

// ---- draw wrapper ------------------------------------------------------------------------------
const base=drawEnemy;
drawEnemy=function(e,...args){const prevScope=scoped;scoped=e;let patch=null,prof=null,lift=null;
 try{load();if(state==='ready'&&prefs.frames&&eligible(e)){preload();patch=patchFor(e);}
  // 날개·부유 몹의 호버는 느리고 작게(몸 높이 1.2% 이하): R100은 이미 정해진 높이를 그대로 쓴다.
  if(prefs.calm&&e&&!major(e)&&e.hp>0&&e.spawnState!=='dead'&&typeof actorHeight==='function'){const row=rowOf(e);if((row&&flies(e,row))||winged(e)){
   const own=Object.prototype.hasOwnProperty.call(e,'visualLiftPx'),old=e.visualLiftPx;if(!(finite(old)&&old>0)){const h=actorHeight();lift={own,old};e.visualLiftPx=h*(.13+HOVER*Math.sin(now()*1.6+hash(e.id)%628/100));stats.hover++;}}}}
 catch(err){fail(err);patch=null;}
 try{if(patch){prof=e.profile;const sh=Object.create(prof);sh.frames={...(prof.frames||{}),...patch};e.profile=sh;stats.draws++;}
  return base.call(this,e,...args);}
 finally{if(prof)e.profile=prof;if(lift){if(lift.own)e.visualLiftPx=lift.old;else delete e.visualLiftPx;}scoped=prevScope;}};

window.__STORYWORLD_MOBS_R109__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,storageKey:KEY,
 trackFor:e=>{const r=rowOf(e);return r?{group:r.gid,src:r.src,kind:r.kind,move:r.move?{path:r.move.path,frames:cell(r.move)}:null,attack:r.attack?{path:r.attack.path,frames:cell(r.attack)}:null}:null;},
 patchFor:e=>{try{return state==='ready'&&eligible(e)?patchFor(e):null;}catch(err){fail(err);return null;}},
 coverage:()=>{const es=(room?.enemies||[]).filter(e=>!major(e));return{zone,layer:typeof layer==='undefined'?null:layer,enemies:es.length,mapped:es.filter(e=>rowOf(e)).length,withMove:es.filter(e=>rowOf(e)?.move).length,withAttack:es.filter(e=>rowOf(e)?.attack).length,driveStatic:es.filter(e=>art(e)).length};},
 inspect:()=>({revision:REV,state,ids:table.size,r109Groups:(r109?.tracks||[]).map(t=>t.group),prefs:{...prefs},stats:{...stats},failures,lastError,presentationOnly:true,gameplayChanged:false,saveSlotsChanged:false})});
})();
