// R350 — 사용자 2026-11-05 "플레이어 스킬이미지에 거의 안가리게 해주고 플레이어 피격효과(피흘리는효과)까지도 잘보이게 해줘".
//  원인: Three 기록기는 몸(영웅·몹·소품) 그림을 2번 패스(깊이 있음)로, 바닥에 붙지 않은 이펙트를 3번 패스(깊이 없음)로 그린다
//   (dist/phase1.js applySpatialPolicy·render 의 camera.layers 1→2→3). 그래서 영웅 몸 위의 모든 스킬 그림은 순서와 상관없이 영웅을 덮는다.
//   R106 heroVeil 은 R106 스프라이트만(최대 62%), overHero 로 그린 것(미카엘라 R247 전부·R111 날개·후광 등)과
//   texture()/pixelfx/R190/스토리 스킬 그림은 옅게 하지 않았다.
//  1) 가림 옅게(veil): 매 프레임 기록된 명령에서 영웅 몸 명령(spatialRole 'body', owner.kind 'hero')의 화면 상자를 구하고,
//     그 상자를 덮는 영웅 쪽 이펙트(owner.kind 'effect'·'scene', 바닥 붙음 아님, 적 예고·탄환·위험지대 아님, R106 스프라이트 아님 — R106 은 자체 가림 옅게)
//     를 덮는 비율만큼 옅게 한다(최대 85%, 화면 대부분을 덮는 아주 큰 그림은 최대 55%).
//  2) 영웅 다시 보이기(ghost): 옅게 한 뒤에도(R106 overHero·적 그림 포함) 영웅을 덮는 양이 많으면, 영웅 몸 명령을 이펙트 패스 맨 뒤에
//     반투명(최대 60%)으로 한 번 더 그린다. 기록기 순서(renderOrder=order)가 3번 패스 안의 칠하는 순서다.
//  3) 피격 피 튐: 플레이어 체력이 실제로 깎이면(hurt 결과 'hit' 또는 체력 감소) 가슴 높이에 피 튐(R190 CC0 시트 재사용)을
//     맞은 반대쪽으로 뿌리고, 큰 피해면 짧게 흐르는 피·발밑 핏자국을 더한다. 처음엔 선혈 적색(밝게), 갈수록 핏빛 암적색으로 어두워진다.
//     이펙트 패스 맨 뒤(유령보다도 뒤)에 그리고 옅게 하지 않는다. 동시에 최대 6장, 0.08초에 한 번. 무적 깜빡임·밝기 번쩍임은 그대로.
//  판정·피해·무적 시간·저장은 바꾸지 않는다(그림만). 끄기: localStorage['storyworld.r350.heroVisibility']='{"veil":false,"ghost":false,"blood":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_HERO_VISIBILITY_R350__)return;
const REV='R350-hero-visibility-1',KEY='storyworld.r350.heroVisibility';
let prefs={veil:true,ghost:true,blood:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={frames:0,heroFound:0,veiled:0,ghosts:0,bloodSpawned:0,bloodDraws:0,bloodSkipped:0,hits:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
// 적 쪽(위협 신호) 이펙트 — 옅게 하지 않는다. 몸 높이 예고·시전·탄환은 게임 정보다(vfx-r98 은 적 스킬 연출, r163:mob-*·pxf-enemy-* 는 몹 공격).
const ENEMY_ID=/^(r98|r241|r114:(windup|charge|thrown)|r160|r170:hex|r105|r169|r240|r328|r111:boss|r162|r167|r248|r286|r330|r341|story-vfx|enemy|boss|mob|hazard)/i;
const VEIL_KINDS=new Set(['effect','scene']);
const ENEMY_WORD=/(^|[:_-])(enemy|mob|mobs|boss|hazard|hex|sigil)([:_-]|$)/i;
function enemySide(o){if(!o)return false;const id=String(o.id||'');return o.pxfSide==='enemy'||o.storyVfx===true||o.enemy===true||o.r98===true||ENEMY_ID.test(id)||ENEMY_WORD.test(id);}
function bbox(c){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const add=p=>{if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1];};
 if(c.kind==='image'&&Array.isArray(c.points))for(const p of c.points)add(p);else if(Array.isArray(c.paths))for(const path of c.paths)for(const p of path.points||[])add(p);
 return x1>x0&&y1>y0?{x0,y0,x1,y1}:null;}
const overlap=(a,b)=>Math.max(0,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0))*Math.max(0,Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0));
const blendWeight=c=>{const g=c.style?.globalCompositeOperation||'source-over';return g==='lighter'||g==='screen'||g==='add'?.6:1;};
// 영웅 몸 상자: 실제 그린 몸 명령(투명 여백 때문에 가로 70%·위 8% 잘라 몸통만).
function heroCommands(commands){const all=[];for(const c of commands)if(c&&c.kind==='image'&&c.spatialRole==='body'&&c.owner?.kind==='hero')all.push(c);if(all.length<2)return all;
 let best=null,bd=Infinity;try{for(const c of all){const d=Math.hypot((c.owner.x??0)-player.x,(c.owner.y??0)-player.y);if(d<bd){bd=d;best=c.owner.id;}}}catch(_){return all;}return all.filter(c=>c.owner.id===best);}
function heroBox(cmds){let b=null;for(const c of cmds){const q=bbox(c);if(!q)continue;b=b?{x0:Math.min(b.x0,q.x0),y0:Math.min(b.y0,q.y0),x1:Math.max(b.x1,q.x1),y1:Math.max(b.y1,q.y1)}:q;}
 if(!b)return null;const w=b.x1-b.x0,h=b.y1-b.y0;b={x0:b.x0+w*.15,x1:b.x1-w*.15,y0:b.y0+h*.08,y1:b.y1};b.area=(b.x1-b.x0)*(b.y1-b.y0);return b.area>4?b:null;}
// 측정용(헤드리스·inspect): 최근 프레임의 가림 양(옅게 전/후)과 가리는 그림 출처별 합
const recent=[],contrib=new Map();
function prefixOf(c){const id=String(c.owner?.id||c.owner?.kind||'?'),src=String(c.sourcePath||'');if(src.startsWith('r106fx:'))return 'r106:'+src.split(':')[1];return id.split(':').slice(0,2).join(':').replace(/[0-9.]+$/,'#').slice(0,48);}
function process(commands){
 if(!Array.isArray(commands)||!commands.length)return;stats.frames++;
 let maxOrder=0;for(const c of commands)if(c&&c.order>maxOrder)maxOrder=c.order;
 const blood=[];for(const c of commands)if(c?.owner?.r350blood)blood.push(c);
 /* 꺼져 있어도 가림 양은 잰다(측정·비교용, 명령은 안 바꿈) */const heroes=heroCommands(commands);const box=heroes.length?heroBox(heroes):null;
 if(box){stats.heroFound++;let before=0,after=0,veiled=0;
  for(const c of commands){if(!c||c.spatialRole==='body'||c.kind==='text'||c.owner?.r350||c.owner?.groundAligned===true)continue;const kind=c.owner?.kind;
   if(!VEIL_KINDS.has(kind)&&kind!=='projectile'&&kind!=='hazard')continue;if(kind==='scene'&&c.order<heroes[0].order)continue;
   const q=bbox(c);if(!q)continue;const ov=overlap(q,box);if(!(ov>0))continue;const f=ov/box.area,a0=clamp(c.style?.globalAlpha??1),w=blendWeight(c);before+=a0*f*w;
   let a=a0;if(prefs.veil&&VEIL_KINDS.has(kind)&&f>.04&&!enemySide(c.owner)&&!String(c.sourcePath||'').startsWith('r106fx:')){
    const big=(q.x1-q.x0)*(q.y1-q.y0)/box.area>14,cap=big?.55:.85;a=a0*(1-Math.min(cap,f*(w<1?.95:1.1)));c.style={...c.style,globalAlpha:a};veiled++;}
   after+=a*f*w;const k=prefixOf(c);contrib.set(k,(contrib.get(k)||0)+a0*f*w);}
  stats.veiled+=veiled;
  // 영웅 다시 보이기: 남은 가림이 크면 몸 명령을 이펙트 패스 맨 뒤에 반투명으로 한 번 더
  let g=0;if(prefs.ghost&&after>.3&&!(typeof player!=='undefined'&&player?.visible===false)){g=clamp((after-.3)*.9,0,.6);let i=0;
   for(const c of heroes){const o={...c.owner,kind:'effect',id:'r350:ghost:'+c.owner.id,r350:true,groundAligned:false,bodyPath:null};
    commands.push({...c,key:'r350:ghost:'+c.key,owner:o,spatialRole:null,order:maxOrder+1+(i++),style:{...c.style,globalAlpha:clamp((c.style?.globalAlpha??1)*g)}});stats.ghosts++;}}
  recent.push({t:typeof time==='number'?+time.toFixed(3):0,before:+before.toFixed(3),after:+after.toFixed(3),veiled,ghost:+g.toFixed(3)});if(recent.length>240)recent.shift();
  if(contrib.size>64){const top=[...contrib.entries()].sort((a,b)=>b[1]-a[1]).slice(0,32);contrib.clear();for(const[k,v]of top)contrib.set(k,v);}}
 // 피 튐은 이펙트 패스 맨 뒤(유령보다 뒤)
 let j=0;for(const c of blood)c.order=maxOrder+50+(j++);
}
// ---- 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다) ----
const wrapFn=fn=>{if(fn.__r350)return fn;const w=function(frame){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}return fn.apply(this,arguments);};w.__r350=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
setInterval(wrapInst,500);wrapInst();

// ---- 피격 피 튐 ----
// 자산: R190 CC0 피 튐 시트(assets/r190/blood, OpenGameArt 'para' CC0) 재사용 — 새 자산 없음. 128px 칸, 4열.
const DIR='assets/r190/blood/',SHEET={splash:{file:'blood-splash.webp',frames:15},burst:{file:'blood-burst.webp',frames:14},stain:{file:'blood-death.webp',frames:15}},FW=128,COLS=4,MAX=6;
const asked=new Map();
function image(f){const p=DIR+f;try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
/* 게임 시간(time)으로 재생 — 느린 프레임·창이 열린 동안에도 다른 이펙트와 같은 박자 */const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000,H=()=>typeof actorHeight==='function'?actorHeight():60;
const list=[],SENT={type:'r350-hero-blood',x:0,y:0,age:0,life:Infinity,r350Sentinel:true};let serial=0,lastSpawn=-1,pendingDamage=0,lastSource=null,lastSourceAt=-1,prevHp=null,prevHero=null;
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(e){fail(e);}}
function maxHp(){try{if(typeof maxHP==='function'){const v=maxHP();if(v>0)return v;}}catch(_){}return 100;}
// 맞은 반대쪽(화면 각도). 근원 좌표가 없으면 가장 가까운 살아 있는 몹, 그것도 없으면 무작위.
function sprayAngle(src){try{let s=src&&Number.isFinite(src.x)&&Number.isFinite(src.y)?src:null;
 if(!s&&typeof room!=='undefined'&&room?.enemies){let bd=6;for(const e of room.enemies){if(!(e?.hp>0))continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;s=e;}}}
 if(s&&typeof project==='function'&&Math.hypot(s.x-player.x,s.y-player.y)>.05){const a=project(s.x,s.y),b=project(player.x,player.y);return Math.atan2(b.y-a.y,b.x-a.x);}}catch(e){fail(e);}
 return Math.random()*Math.PI*2;}
function spawn(damage,src){if(!prefs.blood||typeof player==='undefined'||!player)return 0;const now=T();if(now<lastSpawn)lastSpawn=-1;if(now-lastSpawn<.08){stats.bloodSkipped++;return 0;}lastSpawn=now;
 const share=clamp(damage/(maxHp()*.12)),k=.7+.6*share,a=sprayAngle(src),big=damage>=maxHp()*.05,x=player.x,y=player.y,id=++serial;
 const add=row=>{while(list.length>=MAX)list.shift();list.push({id,x,y,...row});};
 // 피 튐 시트는 오른쪽 아래(+45°)로 뿌려지게 그려져 있다 → 회전 = 뿌릴 각 − 45°
 add({sheet:'splash',t0:now,k:k*1.25,z:.55,rot:a-Math.PI/4,fps:30,alpha:1});
 add({sheet:'burst',t0:now,k:k*.8,z:.5,rot:Math.random()*Math.PI*2,fps:32,alpha:.95});
 if(big){add({sheet:'splash',t0:now+.16,k:k*.7,z:.42,rot:Math.PI/2-Math.PI/4+(Math.random()-.5)*.5,fps:22,alpha:.85});add({sheet:'stain',t0:now+.05,k:k*.75,z:0,rot:0,fps:20,alpha:.7,squash:.5});}
 stats.bloodSpawned++;arm();return 1;}
function drawAll(){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;const t=T(),h=H();
 for(let i=list.length-1;i>=0;i--){const e=list[i],S=SHEET[e.sheet],f=Math.floor((t-e.t0)*e.fps);if(f<0)continue;if(f>=S.frames){list.splice(i,1);continue;}
  const im=image(S.file);if(!im)continue;const q=project(e.x,e.y),s=h*e.k/FW,sx=(f%COLS)*FW,sy=Math.floor(f/COLS)*FW,u=f/S.frames,
   fade=u>.65?1-(u-.65)/.35:1,bright=(1.85-1.0*u).toFixed(2);/* 선혈(밝은 빨강) → 핏빛 암적(어둡게) */
  const run=()=>{ctx.save();try{ctx.globalAlpha*=e.alpha*fade;ctx.globalCompositeOperation='source-over';ctx.filter='brightness('+bright+') saturate(1.3)';
   ctx.translate(q.x,q.y-h*e.z);if(e.squash)ctx.scale(1,e.squash);if(e.rot)ctx.rotate(e.rot);ctx.scale(s,s);ctx.drawImage(im,sx,sy,FW,FW,-FW/2,-FW/2,FW,FW);}finally{ctx.restore();}};
  try{if(typeof ctx.scope==='function')ctx.scope({id:'r350:blood:'+e.id+':'+e.sheet+':'+i,kind:'effect',x:e.x,y:e.y,r350:true,r350blood:true,groundAligned:false,lightShadowApproved:true},run);else run();stats.bloodDraws++;}catch(err){fail(err);}}
 if(!list.length){try{const k=effects.indexOf(SENT);if(k>=0)effects.splice(k,1);}catch(_){}}}
try{if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}}catch(e){fail(e);}
// 근원(맞힌 몹·탄)만 기억한다 — 실제 피 튐은 체력이 깎인 것을 보고 낸다(무적·막기·패리·보호막은 피 안 남).
try{if(typeof hurt==='function'){const base=hurt;hurt=function(damage,source,...a){const p0=typeof player!=='undefined'?player:null,h0=p0?.hp;const r=base.call(this,damage,source,...a);try{if(r==='hit'||r==='revived'){lastSource=source||null;lastSourceAt=T();stats.hits++;
  /* 이 hurt 로 깎인 만큼 바로 넘긴다(다음 tick 의 체력 비교와 겹치지 않게 기준 체력도 맞춤) */if(p0&&p0===player&&Number.isFinite(h0)&&Number.isFinite(p0.hp)&&p0.hp<h0){pendingDamage+=r==='revived'?Math.max(.5,h0):h0-p0.hp;prevHp=p0.hp;prevHero=p0;}}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function watchHp(){try{if(typeof player==='undefined'||!player){prevHp=null;return;}if(player!==prevHero){prevHero=player;prevHp=player.hp;return;}
 const hp=player.hp,busy=(typeof loading!=='undefined'&&loading)||(typeof modal!=='undefined'&&modal);if(!Number.isFinite(hp)||busy){prevHp=hp;return;}
 if(Number.isFinite(prevHp)&&hp<prevHp-.01){pendingDamage+=prevHp-hp;}prevHp=hp;
 const now=T(),need=Math.max(.5,maxHp()*.01);if(now<lastSourceAt)lastSourceAt=-1;if(pendingDamage>=need||(pendingDamage>0&&now-lastSourceAt<.05)){const src=now-lastSourceAt<.5?lastSource:null;if(spawn(pendingDamage,src))pendingDamage=0;}
 if(list.length)arm();}catch(e){fail(e);}}
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);watchHp();return r;};}}catch(e){fail(e);}
try{if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);list.length=0;pendingDamage=0;prevHp=typeof player!=='undefined'&&player?player.hp:null;return r;};}}catch(e){fail(e);}
(function warm(n){try{if(typeof started!=='undefined'&&started&&prefs.blood){for(const s of Object.values(SHEET))image(s.file);return;}}catch(_){}if(n<120)setTimeout(()=>warm(n+1),1000);})(0);

function set(p){for(const k of ['veil','ghost','blood'])if(typeof p?.[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_HERO_VISIBILITY_R350__=Object.freeze({revision:REV,set,spawn,process,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},active:list.length,recent:recent.slice(-120),contributors:[...contrib.entries()].sort((a,b)=>b[1]-a[1]).slice(0,16).map(([k,v])=>[k,+v.toFixed(2)]),lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false}),
 resetStats:()=>{recent.length=0;contrib.clear();for(const k in stats)stats[k]=0;}});
})();
