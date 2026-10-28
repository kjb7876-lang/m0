/* R113 전투 감각·조형물 접지·기본 물리 (사용자 요청 2026-10-28 03:47~03:51)
 * ① 원거리 영웅(서하·미카엘라·헌터·기억사수)이 적에게 순간이동하던 문제 — 재현해서 원인 두 가지를 찾았다.
 *    - S 회피(blink): 방향키를 누르지 않으면 가장 가까운 적 쪽으로 3.8칸 날아갔다 → 원거리 영웅은 적 반대쪽으로 물러난다.
 *    - 실검무(자동 전투가 쓰는 R63/R74 춤): 타격마다 영웅을 적 옆 빈칸으로 옮겼다가 끝에 제자리로 돌려놓는다.
 *      원거리 영웅은 판정·피해는 그대로 두고, 화면에서는 선 자리에 그대로 서서 실을 날리는 모습으로 그린다
 *      (그리는 동안만 영웅 좌표를 선 자리로 바꾸고, 카메라도 그 자리에 둔다. 춤이 끝나면 영웅을 선 자리로 되돌린다:
 *      원래 춤은 마지막 적 옆에 영웅을 남겨 두었다).
 * ② 전투 중 좌우로 번갈아 보던 문제 — 적이 영웅 둘레를 돌며 걷는 방향(e.direction)으로 그림 방향이 정해졌다.
 *    전투 거리 안의 적은 그릴 때 늘 영웅 쪽을 본다(가운데 무감대 0.45칸·0.22초 머뭇거림으로 떨림 없음).
 *    영웅도 전투 중에는 겨눈 적 쪽을 본다(같은 머뭇거림).
 * ③ 조형물이 떠 보이던 문제 — 조형물 체계(R74·R80·R102·R105 등)마다 그림 아래 투명 여백이 남아 그림자 위에 떠 있었다.
 *    three 기록기에서 조형물 묶음(kind 'prop')이 끝날 때, 몸통 그림의 실제 밑동(불투명 픽셀 맨 아랫줄)을
 *    조형물의 땅점(탁자 위 물건은 그 높이)에 맞춰 내리고, 그림자 타원은 그림의 실제 밑동 가운데·너비로 옮긴다
 *    (대포처럼 그림이 한쪽으로 치우친 조형물은 그림자가 옆에 떨어져 떠 보였다). 벽에 걸쳐 선 조형물은 그릴 때만
 *    가까운 빈 바닥으로 비켜 세운다(벽에 거는 깃발·부조·횃불과 문·벽·상자는 제외). 원본 위치·충돌·저장은 그대로다.
 * ④ 적이 던진 물체(R61 던지기·염동 투사체): 벽·조형물에 닿거나 땅에 떨어지거나 영웅에게 맞으면 작게 터지고 사라진다.
 * ⑤ 기본 물리: 몸이 겹친 생물은 서로 밀어내고, 맞은 적은 무게(보스·중간보스·몸 크기)에 따라 밀려났다가 멈추며,
 *    폭발·타격 가까이의 조형물은 흔들리고 부스러기가 튀어 바닥에서 튕긴다.
 * ⑥ 움직이는 모든 것(영웅·몹·보스·밀려난 몸·튕긴 부스러기)의 발밑에 옅은 먼지가 인다.
 * 피해량·체력·쿨타임·저장 형식은 바꾸지 않는다. 설정 키 r113.play로 항목별로 끌 수 있다. */
(()=>{'use strict';
if(window.__STORYWORLD_PLAY_R113__||typeof tick!=='function'||typeof draw!=='function')return;
const REV='R113-play-1';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r113.play';
const prefs={ranged:true,facing:true,ground:true,thrown:true,physics:true,dust:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
function set(patch={}){for(const k of Object.keys(prefs))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
const stats={blinkAway:0,danceFrames:0,danceAnchors:0,enemyFaced:0,heroFaced:0,grounded:0,groundScans:0,wallMoves:0,shadowsMoved:0,groundPx:0,thrownPops:0,wallStops:0,separations:0,knocks:0,wobbles:0,debris:0,dust:0,particles:0};
let lastError=null,failures=0;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
const finite=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const now=()=>typeof time==='number'?time:0;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on()?s:null;};
const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx?.scope==='function')return ctx.scope(o,fn);return fn();};
const Z=()=>typeof zoom==='number'?zoom:1;
const liveFoe=e=>!!e&&e.hp>0&&e.spawnState==='active'&&!e.deadRecorded&&e.visible!==false;
const major=e=>!!(e&&(e.boss||e.midboss||e.persona));
const blockedAt=(x,y,r)=>{try{return typeof blocked==='function'?!!blocked(x,y,r):false;}catch(_){return false;}};
const busyMenu=()=>(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading);

// ---- ① 원거리 영웅 ------------------------------------------------------------------------------
const RANGED=new Set(['seoha','michaela','hunter','gunner']);
const isRanged=p=>!!p&&RANGED.has(p.hero);
function nearestFoe(max=15){let best=null,bd=max;for(const e of room?.enemies||[]){if(!liveFoe(e))continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}return best;}
function steering(){const k=typeof keys!=='undefined'?keys:null,j=typeof joystickVector!=='undefined'?joystickVector:null;
 const sx=(k?.has('ArrowRight')?1:0)-(k?.has('ArrowLeft')?1:0)+finite(j?.x),sy=(k?.has('ArrowDown')?1:0)-(k?.has('ArrowUp')?1:0)+finite(j?.y);return Math.hypot(sx,sy)>.01;}
// native blink: v=norm(sx+2sy, 2sy-sx) — 원하는 세계 방향 (dx,dy)가 되도록 sx=(dx-dy)/2, sy=(dx+dy)/4 를 잠시 넣는다.
function blinkAway(base,args){const j=typeof joystickVector!=='undefined'?joystickVector:null;const foe=nearestFoe(15);
 if(!j||!foe)return base.apply(this,args);let dx=player.x-foe.x,dy=player.y-foe.y;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
 const ox=j.x,oy=j.y;j.x=(dx-dy)/2;j.y=(dx+dy)/4;stats.blinkAway++;try{return base.apply(this,args);}finally{j.x=ox;j.y=oy;}}
const dance={anchor:null,cam:null};
const DANCES=()=>window.__STORYWORLD_DANCES_R74__;
const dancing=()=>{try{return !!DANCES()?.nativeActive?.(player);}catch(_){return false;}};

// ---- ② 전투 방향 ---------------------------------------------------------------------------------
const enemySide=new WeakMap();
function enemyFace(e){const du=(player.x-player.y)-(e.x-e.y);let s=enemySide.get(e);const want=du<0?'left':'right',t=now();
 if(!s){s={dir:want,pend:null,since:t};enemySide.set(e,s);return s.dir;}
 if(Math.abs(du)<.45)return s.dir;
 if(want!==s.dir){if(s.pend!==want){s.pend=want;s.since=t;}if(t-s.since>=.22||e.attack&&!s.attackSeen){s.dir=want;s.pend=null;}}else s.pend=null;
 s.attackSeen=!!e.attack;return s.dir;}
const inFight=e=>liveFoe(e)&&Math.hypot(e.x-player.x,e.y-player.y)<10;
const hero={dir:null,pend:null,since:0,fightAt:-99};
function heroFace(){const t=now();const swinging=finite(player.attackAnim)>0||finite(player.skillAnim)>0||(typeof keys!=='undefined'&&keys.has?.('attack'));
 const foe=nearestFoe(9);if(!foe)return null;if(swinging||(typeof auto!=='undefined'&&auto)||dancing())hero.fightAt=t;if(t-hero.fightAt>1.4)return null;
 if(typeof facing!=='function')return null;const want=facing(foe.x-player.x,foe.y-player.y);
 if(!hero.dir||t-hero.since>3){hero.dir=want;hero.pend=null;hero.since=t;return want;}
 if(want!==hero.dir){if(hero.pend!==want){hero.pend=want;hero.since=t;}if(t-hero.since>=.22){hero.dir=want;hero.pend=null;hero.since=t;}}else{hero.pend=null;hero.since=t;}
 return hero.dir;}

// ---- ⑤⑥ 입자(먼지·부스러기·폭발) --------------------------------------------------------------------
const parts=[];const MAXP=()=>lowFx()?70:180;
function add(p){if(parts.length>=MAXP())parts.shift();parts.push(p);stats.particles++;}
const DUST=[[118,100,82],[176,158,128]],STONE=[[96,90,84],[170,160,148]];
function dustAt(x,y,k=1){add({kind:'dust',x:x+(Math.random()-.5)*.18,y:y+(Math.random()-.5)*.18,z:0,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,vz:.25,age:0,life:.55+Math.random()*.25,size:.32*k,col:DUST});stats.dust++;}
function debrisAt(x,y,n,col=STONE){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=.8+Math.random()*1.4;add({kind:'chip',x,y,z:.25+Math.random()*.3,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:2+Math.random()*2.2,age:0,life:1.1+Math.random()*.5,size:.07+Math.random()*.06,col,spin:Math.random()*TAU,bounces:0});stats.debris++;}}
function popAt(x,y,big=false,col=[255,184,96]){add({kind:'pop',x,y,z:.35,vx:0,vy:0,vz:0,age:0,life:big?.5:.36,size:big?1.05:.7,col:[col,[255,240,200]]});
 for(let i=0;i<(big?5:3);i++)add({kind:'smoke',x:x+(Math.random()-.5)*.3,y:y+(Math.random()-.5)*.3,z:.2,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,vz:.5,age:0,life:.7+Math.random()*.3,size:big?.7:.5,col:DUST});
 debrisAt(x,y,big?7:4);wobbleNear(x,y,big?1.6:1.1,big?1:.6);}
function stepParts(dt){const land=[];for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.age+=dt;if(p.age>=p.life){parts.splice(i,1);continue;}
 p.x+=p.vx*dt;p.y+=p.vy*dt;
 if(p.kind==='chip'){p.vz-=9.8*dt;p.z+=p.vz*dt;if(blockedAt(p.x,p.y,.02)){p.x-=p.vx*dt;p.y-=p.vy*dt;p.vx*=-.35;p.vy*=-.35;}
  if(p.z<=0){p.z=0;if(p.vz<-.6&&p.bounces<3){if(!p.bounces&&land.length<4)land.push(p);p.vz=-p.vz*.38;p.vx*=.55;p.vy*=.55;p.bounces++;}else{p.vz=0;p.vx*=.8;p.vy*=.8;}}p.spin+=dt*6*Math.hypot(p.vx,p.vy);}
 else{p.z+=p.vz*dt;p.vx*=.9;p.vy*=.9;}}
 // 떨어진 부스러기도 처음 바닥에 닿을 때 작은 먼지를 일으킨다.
 for(const p of land)dustAt(p.x,p.y,.45);}
function drawParts(ground){const S=SPR();if(!S||!parts.length||typeof project!=='function')return;const z=Z(),T=typeof TILE==='number'?TILE:34;
 for(const p of parts){const isGround=p.kind==='dust';if(isGround!==ground)continue;const q=project(p.x,p.y),k=p.age/p.life,lift=p.z*T*z;
  if(p.kind==='dust'){const s=p.size*T*z*(1+k*1.4);S.draw('smoke',S.pal(p.col[0],p.col[1]),q.x,q.y-lift,s*1.6,s,{alpha:.22*(1-k),blend:'source-over',angle:p.x});}
  else if(p.kind==='smoke'){const s=p.size*T*z*(1+k*1.2);S.draw('smoke',S.pal(p.col[0],p.col[1]),q.x,q.y-lift,s*1.4,s,{alpha:.4*(1-k),blend:'source-over',angle:p.y});}
  else if(p.kind==='pop'){const s=p.size*T*z*(.6+k*.9);S.draw('glow',S.pal(p.col[0],p.col[1]),q.x,q.y-lift,s*2,s*1.4,{alpha:.75*(1-k)});S.draw('flare',S.pal(p.col[0],p.col[1]),q.x,q.y-lift,s*1.1,s*1.1,{alpha:.9*(1-k),angle:k*2});S.draw('ring',S.pal(p.col[0],p.col[1]),q.x,q.y,s*1.8,s*.8,{alpha:.5*(1-k)});}
  else if(p.kind==='chip'){const s=p.size*T*z;S.draw('shard',S.pal(p.col[0],p.col[1]),q.x,q.y-lift,s,s*1.6,{alpha:k>.75?(1-k)*4:1,blend:'source-over',angle:p.spin});}}}
let layerOn=false;
function ensureLayer(){if(typeof effects==='undefined'||!Array.isArray(effects))return;if(!layerOn||!effects.some(e=>e?.type==='r113Layer')){effects.push({type:'r113Layer',x:player.x,y:player.y,age:0,life:1e9,size:1});layerOn=true;}const L=effects.find(e=>e?.type==='r113Layer');if(L){L.x=player.x;L.y=player.y;L.age=0;}}

// ---- ⑤ 물리: 겹침·넉백·흔들림 -----------------------------------------------------------------------
const radiusOf=e=>Math.max(.14,finite(e?.combatProfile?.bodyBlock?.r,finite(e?.radius,.3)));
const massOf=e=>e.boss?7:e.midboss?3.5:e.persona?5:clamp((radiusOf(e)/.3)**2,.6,2.4);
const vel=new WeakMap();
function separate(dt){const list=[];for(const e of room.enemies){if(liveFoe(e)&&Math.abs(e.x-player.x)<16&&Math.abs(e.y-player.y)<16)list.push(e);if(list.length>=60)break;}
 const n=list.length;for(let i=0;i<n;i++){const a=list[i],ra=radiusOf(a);
  {const dx=a.x-player.x,dy=a.y-player.y,d=Math.hypot(dx,dy),m=ra+.24;if(d>1e-4&&d<m&&!a.attack){const push=Math.min(.06,(m-d)*.5);moveActor(a,dx/d*push,dy/d*push,ra);stats.separations++;}}
  for(let j=i+1;j<n;j++){const b=list[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=(ra+radiusOf(b))*.92;if(d>=m)continue;
   const ux=d>1e-4?dx/d:Math.cos(i+j),uy=d>1e-4?dy/d:Math.sin(i+j),over=Math.min(.05,(m-d)*.5),ma=massOf(a),mb=massOf(b),wa=mb/(ma+mb),wb=ma/(ma+mb);
   if(!a.attack)moveActor(a,-ux*over*wa*2,-uy*over*wa*2,ra);if(!b.attack)moveActor(b,ux*over*wb*2,uy*over*wb*2,radiusOf(b));stats.separations++;}}}
function knock(e,src){if(!liveFoe(e)||e.persona)return;const fromX=finite(src?.x,player.x),fromY=finite(src?.y,player.y);let dx=e.x-fromX,dy=e.y-fromY;const d=Math.hypot(dx,dy);if(d<1e-3){dx=e.x-player.x;dy=e.y-player.y;}
 const L=Math.hypot(dx,dy)||1,imp=1.15/massOf(e),v=vel.get(e)||{x:0,y:0};v.x=clamp(v.x+dx/L*imp,-2.2,2.2);v.y=clamp(v.y+dy/L*imp,-2.2,2.2);vel.set(e,v);knocked.add(e);stats.knocks++;}
const knocked=new Set();
function stepKnock(dt){for(const e of [...knocked]){const v=vel.get(e);if(!v||!liveFoe(e)||e.room===null){knocked.delete(e);continue;}
 if(!e.attack){const ox=e.x,oy=e.y;moveActor(e,v.x*dt,v.y*dt,radiusOf(e));if(Math.hypot(e.x-ox,e.y-oy)<Math.hypot(v.x,v.y)*dt*.3){if(Math.hypot(v.x,v.y)>1.1)dustAt(e.x,e.y,1.2);v.x*=.3;v.y*=.3;}}
 const k=Math.exp(-9*dt);v.x*=k;v.y*=k;if(Math.hypot(v.x,v.y)<.03){vel.delete(e);knocked.delete(e);}}}
const wob=new Map();
function wobbleNear(x,y,r,amp){for(const p of room?.props||[]){if(!p||!Number.isFinite(p.x+p.y))continue;const d=Math.hypot(p.x-x,p.y-y);if(d>r)continue;const k=amp*(1-d/r);wob.set('prop:'+p.id,{t:now(),amp:Math.max(k,wob.get('prop:'+p.id)?.amp||0),seed:hash(p.id)%7});stats.wobbles++;if(k>.35)debrisAt(p.x,p.y,2);}}

// ---- ④ 던진 물체 ---------------------------------------------------------------------------------
const objectShot=b=>!!b&&!b.friendly&&!!(b.r61Shot||b.telekinetic||b.r61Tag&&b.r61Shot!==undefined);
const lastShot=new Map();
function watchShots(){if(typeof projectiles==='undefined')return;const seen=new Set();
 for(const b of projectiles){if(!objectShot(b))continue;seen.add(b);
  if(!b.dead&&prefs.thrown&&b.age>.08&&blockedAt(b.x,b.y,.06)){b.dead=true;stats.wallStops++;}
  if(b.dead&&!b.r113Popped){b.r113Popped=true;const big=b.r61Shot?.kind==='prop';popAt(b.x,b.y,big);stats.thrownPops++;}
  else if(!b.dead)lastShot.set(b,{x:b.x,y:b.y,big:b.r61Shot?.kind==='prop'});}
 for(const [b,s] of lastShot)if(!seen.has(b)){lastShot.delete(b);if(!b.r113Popped&&prefs.thrown){b.r113Popped=true;popAt(s.x,s.y,s.big);stats.thrownPops++;}}}

// ---- ③ 조형물 접지(three 기록기) -------------------------------------------------------------------
const bottoms=new Map();let scanBudget=0,scanCanvas=null;
// 그림 발자국: 아래에서부터 불투명 픽셀이 충분한 첫 줄(f, 0~1)과 그 근처 줄들의 가로 범위(가운데 cx·너비 w, 0~1).
function footprintOf(image,sr){const key=(image.src||image.__r113id||(image.__r113id='c'+Math.random()))+'#'+sr.join(',');if(bottoms.has(key))return bottoms.get(key);if(scanBudget<=0)return null;scanBudget--;let out=null;
 try{const[sx,sy,sw,sh]=sr;if(sw>3&&sh>3){const W=64,H=Math.max(8,Math.min(192,Math.round(64*sh/sw)));scanCanvas??=document.createElement('canvas');scanCanvas.width=W;scanCanvas.height=H;
  const c=scanCanvas.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,W,H);c.drawImage(image,sx,sy,sw,sh,0,0,W,H);const d=c.getImageData(0,0,W,H).data,need=Math.max(2,Math.round(W*.05));let fy=-1;
  for(let y=H-1;y>=Math.floor(H*.35);y--){let n=0;for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>90)n++;if(n>=need){fy=y;break;}}
  if(fy>=0){let lo=W,hi=-1;const y0=Math.max(0,fy-Math.max(3,Math.round(H*.2)));for(let y=y0;y<=fy;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>90){if(x<lo)lo=x;if(x>hi)hi=x;}
   out={f:(fy+1)/H,cx:hi>=lo?(lo+hi+1)/2/W:.5,w:hi>=lo?(hi-lo+1)/W:.5};}else out={f:1,cx:.5,w:.5};stats.groundScans++;}}catch(e){fail(e);out={f:1,cx:.5,w:.5};}
 bottoms.set(key,out);if(bottoms.size>800)bottoms.delete(bottoms.keys().next().value);return out;}
let propIndex=null,propRoom=null;
function propById(id){if(propRoom!==room){propRoom=room;propIndex=new Map();spots.clear();for(const p of room?.props||[])if(p?.id!=null)propIndex.set('prop:'+p.id,p);}return propIndex.get(id);}
// 벽 간격: 벽에 걸린 장식(깃발·부조·액자·횃불 등)과 문·벽·상자·조명은 그대로, 그 밖에 벽에 걸쳐 선 조형물은 그릴 때만
// 가까운 빈 바닥 쪽으로 옮긴다(충돌·저장 자료는 그대로). R111이 이미 옮긴 방 조형물(r111To)과 막는 조형물은 건드리지 않는다.
const WALL_DECOR=/banner|flag|relief|plaque|sign|tapestr|torch|sconce|window|frame|poster|mural|curtain|mirror|clock|shelf|wall|깃발|부조|액자|횃불|창문|벽/i;
const FIXED_ID=/^(ward-|r83|door|gate|portal|exit|r92:light|r103|chest)/;
const spots=new Map();
function wallClose(x,y,c,tall){if(blockedAt(x,y,c))return true;if(tall)for(const[dx,dy]of[[.8,.8],[.8,0],[0,.8]])if(blockedAt(x+dx,y+dy,.18))return true;return false;}
function wallSpot(owner,bh,dpr){const id=String(owner.id||'');if(spots.has(id))return spots.get(id);let out=null;
 try{const raw=id.replace(/^prop:/,''),p=propById(id),path=String(owner.bodyPath||owner.sourcePath||p?.path||p?.art||'');
  if(!FIXED_ID.test(raw)&&!WALL_DECOR.test(path)&&!(p&&(p.r111To||p.solid!==false&&!p.r80PresentationOnly&&!p.r81PresentationOnly))&&Number.isFinite(owner.x+owner.y)){
   const tall=bh/dpr>90,c=tall?.72:.55;
   if(wallClose(owner.x,owner.y,c,tall)){for(let d=.3;d<=1.8&&!out;d+=.3)for(let k=0;k<12;k++){const a=k*Math.PI/6+(hash(id)%12)*.05,x=owner.x+Math.cos(a)*d,y=owner.y+Math.sin(a)*d;if(!wallClose(x,y,c,tall)){out={x,y};break;}}if(out)stats.wallMoves++;}}}catch(e){fail(e);}
 spots.set(id,out);return out;}
function groundScope(rec,owner,start){const cmds=rec.commands;if(!cmds||cmds.length<=start)return;let body=null,bh=0;
 for(let i=start;i<cmds.length;i++){const c=cmds[i];if(c.kind!=='image'||c.owner?.id!==owner.id||!c.points)continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;body=c;}}
 if(!body||bh<6||Math.abs(body.points[1][1]-body.points[0][1])>1||FIXED_ID.test(String(owner.id||'')))return;
 const p=propById(owner.id),dpr=rec.dpr||1;let shift=0,mx=0,my=0;
 if(prefs.ground){const sp=wallSpot(owner,bh,dpr);if(sp){const a=project(owner.x,owner.y),b=project(sp.x,sp.y),pa=rec.point(a.x,a.y),pb=rec.point(b.x,b.y);mx=pb[0]-pa[0];my=pb[1]-pa[1];}}
 const fp=prefs.ground?footprintOf(body.image,body.sourceRect):null;let foot=null;
 if(fp){const q=project(owner.x,owner.y),lift=p?clamp(finite(p.visualLiftPx),0,bh/dpr*.7):0,gy=rec.point(q.x,q.y-lift)[1],P=body.points,vis=P[0][1]+(P[3][1]-P[0][1])*fp.f,d=gy-vis;
  if(d>.5&&d<bh*.4){shift=d;stats.grounded++;stats.groundPx+=d/dpr;}
  foot={x:P[0][0]+(P[1][0]-P[0][0])*fp.cx+mx,y:vis+shift+my,w:Math.abs(P[1][0]-P[0][0])*fp.w};}
 const w=wob.get(owner.id);let dx=0;if(w){const age=now()-w.t;if(age>.9)wob.delete(owner.id);else dx=Math.sin(age*34+w.seed)*w.amp*3.2*dpr*Math.exp(-age*4.5);}
 for(let i=start;i<cmds.length;i++){const c=cmds[i];if(c.owner?.id!==owner.id)continue;
  if(c.kind==='image'&&c.points){const isBody=c.image===body.image;if(!isBody&&!mx&&!my)continue;for(let k=0;k<c.points.length;k++){const top=k<2,wx=isBody?(top?dx:dx*.15):0;c.points[k]=[c.points[k][0]+wx+mx,c.points[k][1]+(isBody?shift:0)+my];}}
  else if(c.kind==='fill'&&Array.isArray(c.paths)&&foot)shadowTo(c,foot);}}
// 그림자 타원을 그림의 실제 밑동 가운데로 옮기고, 너비를 밑동 너비에 맞춘다(원래 너비의 0.55~1.25배).
function shadowTo(c,foot){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const path of c.paths)for(const q of path.points||[]){if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1];}
 if(!(x1>x0)||y1-y0>(x1-x0)*.9)return;const cx=(x0+x1)/2,cy=(y0+y1)/2,sx=clamp(foot.w*1.1/(x1-x0),.55,1.25),ty=foot.y-(y1-y0)*.12;
 for(const path of c.paths)if(path.points)path.points=path.points.map(q=>[foot.x+(q[0]-cx)*sx,ty+(q[1]-cy)*Math.min(1,.4+sx*.6)]);stats.shadowsMoved++;}
function installGround(){const DC=window.StoryPhase1?.DrawCommands;if(!DC?.prototype||DC.prototype.__r113)return false;const base=DC.prototype.scope;
 DC.prototype.scope=function(owner,fn){if(owner?.kind!=='prop'||!live()||!(prefs.ground||wob.size))return base.call(this,owner,fn);const start=this.commands?.length||0;try{return base.call(this,owner,fn);}finally{try{groundScope(this,owner,start);}catch(e){fail(e);}}};
 Object.defineProperty(DC.prototype,'__r113',{value:true});return true;}

// ---- 설치 -------------------------------------------------------------------------------------
function install(){
 if(typeof blink==='function'){const base=blink;blink=function(...a){if(prefs.ranged&&live()&&solo()&&isRanged(player)&&!steering()&&!busyMenu())return blinkAway.call(this,base,a);return base.apply(this,a);};}
 const tickBase=tick;tick=function(dt,...a){const ok=live()&&solo(),pre=ok?{x:player.x,y:player.y,cx:typeof cam!=='undefined'?cam.x:0,cy:typeof cam!=='undefined'?cam.y:0}:null;
  const before=new Map();if(ok&&prefs.dust)for(const e of room.enemies)if(liveFoe(e))before.set(e,e.x+e.y*1e-3);
  const r=tickBase.call(this,dt,...a);if(!ok||!Number.isFinite(dt)||dt<=0)return r;
  try{ // ① 실검무 고정점
   if(prefs.ranged&&isRanged(player)&&dancing()){if(!dance.anchor){dance.anchor={x:pre.x,y:pre.y};dance.cam={x:pre.cx,y:pre.cy};stats.danceAnchors++;}if(typeof cam!=='undefined'){cam.x=dance.cam.x;cam.y=dance.cam.y;}stats.danceFrames++;}
   else if(dance.anchor){const A=dance.anchor;dance.anchor=null;if(isRanged(player)&&!blockedAt(A.x,A.y,.23)&&Math.hypot(player.x-A.x,player.y-A.y)<14){player.x=A.x;player.y=A.y;player.moving=false;stats.danceReturns=(stats.danceReturns||0)+1;}}
   if(prefs.physics&&!busyMenu()){separate(dt);stepKnock(dt);}
   watchShots();
   if(prefs.dust&&!busyMenu()){const t=now(),moved=Math.hypot(player.x-pre.x,player.y-pre.y);if(moved>.02&&!dance.anchor&&moved<.6&&t-(hero.dustAt||0)>.16){hero.dustAt=t;dustAt(player.x,player.y);}
    let budget=lowFx()?3:8;for(const e of room.enemies){if(budget<=0)break;if(!before.has(e)||!liveFoe(e))continue;const was=before.get(e),nowv=e.x+e.y*1e-3;if(Math.abs(nowv-was)<.012)continue;const s=enemyDust.get(e)||0;if(t-s<(major(e)?.12:.2))continue;enemyDust.set(e,t);dustAt(e.x,e.y,major(e)?1.8:clamp(radiusOf(e)/.3,.7,1.4));budget--;}}
   stepParts(dt);if(parts.length)ensureLayer();
  }catch(e){fail(e);}return r;};
 const enemyDust=new WeakMap();
 const drawBase=draw;draw=function(...a){scanBudget=lowFx()?2:6;const anc=prefs.ranged&&dance.anchor&&live()?dance.anchor:null;if(!anc)return drawBase.apply(this,a);
  const ox=player.x,oy=player.y;player.x=anc.x;player.y=anc.y;try{return drawBase.apply(this,a);}finally{player.x=ox;player.y=oy;}};
 if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(!prefs.facing||!live()||!inFight(e))return base.call(this,e,...a);
  const keep=e.direction;try{e.direction=enemyFace(e);stats.enemyFaced++;}catch(err){fail(err);return base.call(this,e,...a);}try{return base.call(this,e,...a);}finally{e.direction=keep;}};}
 if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){if(!prefs.facing||!live()||player.hp<=0)return base.apply(this,a);let want=null;try{want=heroFace();}catch(err){fail(err);}
  if(!want)return base.apply(this,a);const keep=player.direction;player.direction=want;stats.heroFaced++;try{return base.apply(this,a);}finally{player.direction=keep;}};}
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,o,...a){if(type==='threadSlashR63'&&dance.anchor&&o?.threadR63&&prefs.ranged)try{o={...o,threadR63:{...o.threadR63,from:{x:dance.anchor.x,y:dance.anchor.y}}};}catch(e){fail(e);}return base.call(this,type,x,y,o,...a);};}
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){const r=base.call(this,e,value,source,...a);try{if(r&&prefs.physics&&live()&&solo()&&e&&e.hp>0&&!e.boss){knock(e,source&&Number.isFinite(source.x)?source:null);if(Math.random()<.35)wobbleNear(e.x,e.y,1,.4);}}catch(err){fail(err);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e?.type!=='r113Layer')return base.call(this,e,...a);try{scope({id:'r113:layer',kind:'effect',x:e.x,y:e.y},()=>{ctx.save();try{drawParts(false);}finally{ctx.restore();}});}catch(err){fail(err);}};}
 if(typeof drawExits==='function'){const base=drawExits;drawExits=function(...a){const r=base.apply(this,a);try{if(prefs.dust&&parts.length&&live())scope({id:'r113:dust',kind:'effect',x:player.x,y:player.y},()=>{ctx.save();try{drawParts(true);}finally{ctx.restore();}});}catch(err){fail(err);}return r;};}
 if(!installGround())setTimeout(()=>{try{installGround();}catch(e){fail(e);}},0);
}
try{install();}catch(e){fail(e);}
window.__STORYWORLD_PLAY_R113__=Object.freeze({revision:REV,set,prefs:()=>({...prefs}),stats:()=>({...stats,parts:parts.length,failures,lastError}),dance:()=>({...dance}),particles:()=>parts.length,popAt,knock});
})();
