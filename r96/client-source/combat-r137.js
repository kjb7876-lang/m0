/* R137 (사용자 2026-10-30): 몹·보스 규칙과 공명 방어 다듬기. 보이는 것과 규칙만 바꾸며 저장 형식은 그대로다.
 * ① 환영(R61 echo) 공격은 중간보스급 이상(보스·중간보스·페르소나·우주·시련, 이름이 '중간보스'로 보이는 결계 챔피언)만 쓴다.
 *    잡몹은 R61 차례(s.next)를 멈춰 환영·던지기를 시작하지 않는다(R114 가 이미 잡몹 던지기를 막아 둠).
 * ② 중간보스(결계 챔피언 포함, 보스 제외)는 그릴 때 70% 크기.
 * ③ 전투 중(전투 방이 열렸거나 가까이 있거나 공격 중)인 몹은 걸을 때도 공격할 때도 그릴 때 영웅 쪽(화면 좌우)을 본다.
 * ④ 속박은 뿌리 보스(이름·원본 id 에 '뿌리'/root 가 든 보스·중간보스)만 건다. 다른 몹이 건 속박은 지역의 다른 상태이상으로 바꾼다.
 *    속박에 걸리면 걸어서는 움직일 수 없다(블링크로는 빠져나간다).
 * ⑤ 공명 방어를 쓰면 모든 상태이상(R53 상처·R58 지역·R61 원소·R150 이야기 상태·R87 가시 속박)이 풀린다.
 *    공명 방어로 차는 체력과 보호막을 왼쪽 아래 체력 구슬에 실시간으로 보여 준다.
 * ⑥ 길잡이·반자동(자동 기본 공격)에서는 전투 중 7초마다 공명 방어를 0.7초 쓴다(사람이 누르고 있으면 손대지 않는다).
 * ⑦ 블링크가 얇은 벽(두께 1.3칸 이하)에 막히면 벽 너머 빈 바닥으로 넘어간다(같은 길로 이어진 곳만, 허공·막힌 방 제외).
 * 협동 중에는 판정 부분(①④⑤⑥⑦)을 쓰지 않는다. 설정 키 r137.combat. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_COMBAT_R137__)return;
 const REV='R137-combat-1',KEY='storyworld.r137.combat';
 const DEFAULTS={echoMajorOnly:true,midbossScale:true,faceAlways:true,bindRootOnly:true,bindRoot:true,guardCleanse:true,guardOrb:true,autoGuard:true,blinkWalls:true};
 const prefs={...DEFAULTS};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
 function set(p={}){for(const k of Object.keys(DEFAULTS))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const stats={echoStopped:0,echoCancelled:0,midbossDraws:0,faced:0,bindSwapped:0,bindHeld:0,cleanses:0,autoGuards:0,blinkWalls:0,errors:0};let lastError=null;
 const fail=e=>{stats.errors++;lastError=String(e?.message||e);};
 const solo=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;return !c?.mode||c.mode()==='off';};
 const live=()=>typeof started!=='undefined'&&started&&!loading&&!modal&&typeof player==='object'&&player&&player.hp>0&&room;
 const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial));
 const champion=e=>!!e&&e.wardChampionR81===true&&!major(e);
 const midClass=e=>!!e&&!e.boss&&(e.midboss||champion(e));
 const echoAllowed=e=>major(e)||champion(e);
 const rootBoss=e=>!!e&&(e.boss||e.midboss)&&/뿌리|root/i.test(String(e.nativeId||'')+' '+String(e.name||'')+' '+String(e.profile?.name||''));
 const F=()=>window.__STORYWORLD_FIELDS_R61__,R58=()=>window.__STORYWORLD_REGIONAL_COMBAT_R58__,R53=()=>window.__STORYWORLD_HOSPITAL_WOUNDS_R53__;
 const T=()=>typeof time==='number'?time:0;

 // ---- ① 환영은 중간보스급 이상만 ----------------------------------------------------------------
 function gateEcho(){const api=F();if(!api?.state||!room?.enemies)return;const t=T();
  for(const e of room.enemies){if(!e||e.hp<=0||echoAllowed(e))continue;let s;try{s=api.state(e);}catch(_){continue;}
   if(s&&s.next!==Infinity){s.next=Infinity;stats.echoStopped++;}
   const a=e.r61Action;if(a&&!a.cancelled&&(a.kind==='echo'||a.kind==='prop')&&t<(a.releaseAt??0)){a.cancelled=true;e.r61BusyUntil=0;stats.echoCancelled++;}}}

 // ---- ③ 전투 중에는 영웅 쪽을 본다 -----------------------------------------------------------------
 const faceMemo=new WeakMap();
 function inFight(e){if(!e||e.hp<=0||typeof player!=='object'||!player)return false;const d=Math.hypot(e.x-player.x,e.y-player.y);return !!(e.attack||e.rangedWindup>0||d<(major(e)?24:14)||(room?.engaged&&d<20));}
 function toward(e){const du=(player.x-player.y)-(e.x-e.y),m=faceMemo.get(e)||{dir:du<0?'left':'right',at:0};
  if(Math.abs(du)>.35){const want=du<0?'left':'right';if(want!==m.dir&&T()-m.at>.18){m.dir=want;m.at=T();}}faceMemo.set(e,m);return m.dir;}

 // ---- ④ 속박: 뿌리 보스만, 걸리면 걸어서 못 움직임 -------------------------------------------
 function ownerOf(source){if(!source||!room?.enemies)return null;if(room.enemies.includes(source))return source;const id=source.owner??source.ownerId??source.r61Owner;return id!=null?room.enemies.find(e=>e.id===id)||null:source.medical20?.owner||null;}
 function altKey(defs,avoid){if(!defs)return null;for(const k of ['poison','bleed','shock','weakness','curse','burn','dark','charm','harvest'])if(defs[k]&&!avoid.includes(k))return k;return Object.keys(defs).find(k=>!avoid.includes(k))||null;}
 function swapBind(source){try{if(!prefs.bindRootOnly||!source||typeof source!=='object')return;const owner=ownerOf(source);if(!owner||rootBoss(owner))return;
   const r58=R58(),f=F();
   if(source.r58Affliction&&(source.r58Affliction.wound==='bind'||source.r58Affliction.key==='bind')){const k=altKey(r58?.defs,['bind','chill']);if(k){source.r58Affliction={...r58.defs[k],key:k};stats.bindSwapped++;}}
   if(source.r61Tag==='bind'){const k=altKey(f?.defs,['bind','frost']);if(k){source.r61Tag=k;stats.bindSwapped++;}}
   else if(!source.r61Tag&&(source.r61Shot||source.r61Field||Number.isFinite(source.vx))&&f?.themeFor?.(owner)==='bind'){const k=altKey(f.defs,['bind','frost']);if(k){source.r61Tag=k;stats.bindSwapped++;}}}catch(e){fail(e);}}
 function bound(){try{if(!prefs.bindRoot||!solo())return false;const rows=[...(F()?.statusRows?.()||[]),...(R58()?.statusRows?.()||[])];return rows.some(r=>/bind/.test(String(r.key||r.kind||''))||/속박/.test(String(r.label||'')));}catch(_){return false;}}
 let escaping=false;

 // ---- ⑤ 공명 방어로 모든 상태이상 해제 -----------------------------------------------------------
 // R61 원소 상태는 상태만 지우는 함수가 없어(clear 는 적 행동·장판까지 지움) 상태 Map 을 처음 쓸 때 알아 둔다.
 let r61Map=null;const mapSet=Map.prototype.set;
 Map.prototype.set=function(k,v){if(!r61Map&&v&&typeof v==='object'&&typeof k==='string'&&v.key===k&&Object.keys(v).join()==='key,owner,start,until'){try{if(F()?.defs?.[k]&&solo())r61Map=this;}catch(_){}if(r61Map)Map.prototype.set=mapSet;}return mapSet.call(this,k,v);};
 let releaseR87=false;
 function cleanse(){try{let n=0;try{R53()?.clear?.('r137-guard');n++;}catch(e){fail(e);}try{R58()?.clear?.('r137-guard');n++;}catch(e){fail(e);}
   if(r61Map&&r61Map.size){r61Map.clear();n++;}
   if(player.storyStatus150||player.heroSlowUntil150>T()){player.storyStatus150=null;player.heroSlowUntil150=0;n++;}
   if(window.__STORYWORLD_PAINTED_VFX_R87__?.inspect?.()?.binding)releaseR87=true;stats.cleanses++;return n;}catch(e){fail(e);return 0;}}

 // ---- ⑥ 길잡이·반자동 자동 공명 방어 ------------------------------------------------------------
 const auto7={next:0,until:0,ours:false};
 // 싸움 중일 때만: 공격·조준 중인 적, 자기 어그로 거리(최대 7칸) 안의 적, 또는 방금(2.5초) 맞았을 때. 멀리 서 있는 적만 있으면 쓰지 않는다.
 let hurtAt=-99;
 function fighting(){if(T()-hurtAt<2.5)return true;return (room?.enemies||[]).some(e=>{if(!(e.hp>0)||e.visible===false||['hidden','dead','inactive','disabled','despawned'].includes(e.spawnState))return false;const d=Math.hypot(e.x-player.x,e.y-player.y);return d<10&&(!!e.attack||e.rangedWindup>0||d<Math.min(7,Number(e.combatProfile?.aggro)||6));});}
 function autoGuardTick(){if(!prefs.autoGuard||!solo()||!live())return;const t=T(),on=(typeof guide!=='undefined'&&guide)||(typeof auto!=='undefined'&&auto);
  if(auto7.ours&&(t>=auto7.until||!on)){auto7.ours=false;if(player.guard&&typeof guardEnd==='function')guardEnd();return;}
  if(!on||auto7.ours||player.guard||typeof guardStart!=='function')return;
  if(!auto7.next)auto7.next=t+7;if(t<auto7.next)return;auto7.next=t+7;
  if(regionById?.[zone]?.safe||!fighting())return;auto7.ours=true;auto7.until=t+.7;guardStart();stats.autoGuards++;}

 // ---- ⑦ 블링크로 얇은 벽 넘기 -------------------------------------------------------------------
 // 원래 블링크와 같은 방향 규칙: 방향키 → 경로 다음 점·가까운 적(15칸) → 바라보는 쪽
 function blinkDir(p0){const nm=(x,y)=>{const m=Math.hypot(x,y);return m?{x:x/m,y:y/m}:null;};
  try{const sx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0)+(joystickVector?.x||0),sy=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0)+(joystickVector?.y||0);const v=nm(sx+2*sy,2*sy-sx);if(v)return v;}catch(_){}
  try{const q=(typeof route!=='undefined'&&route?.[0])||(typeof nearestEnemy==='function'?nearestEnemy(15):null);if(q)return nm(q.x-p0.x,q.y-p0.y);}catch(_){}
  return player.direction==='back'?nm(-1,-1):player.direction==='left'?nm(-1,1):player.direction==='right'?nm(1,-1):nm(1,1);}
 function overWall(p0,d,moved){if(typeof blocked!=='function')return null;let wallAt=null;
  for(let s=.15;s<=4.6;s+=.1){const x=p0.x+d.x*s,y=p0.y+d.y*s,b=blocked(x,y,.2,room);if(b&&wallAt==null)wallAt=s;
   if(!b&&wallAt!=null){if(s-wallAt>1.3)return null;const q={x:p0.x+d.x*(s+.35),y:p0.y+d.y*(s+.35)};if(blocked(q.x,q.y,.31,room))continue;
    if(typeof findPath==='function'&&!(findPath(q,p0,room,.31)||[]).length)return null;return q;}}return null;}

 // ---- 설치 ----------------------------------------------------------------------------------
 function install(){
  if(typeof tick==='function'){const base=tick;tick=function(dt,...a){
   try{if(prefs.echoMajorOnly&&solo()&&live())gateEcho();}catch(e){fail(e);}
   let mm=null;if(releaseR87){releaseR87=false;try{const orig=window.matchMedia;mm=orig;window.matchMedia=function(q){return /pointer\s*:\s*coarse/.test(String(q))?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:orig.call(window,q);};}catch(e){fail(e);mm=null;}}
   let r;try{r=base.call(this,dt,...a);}finally{if(mm)window.matchMedia=mm;}
   try{autoGuardTick();}catch(e){fail(e);}return r;};}
  if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(!e)return base.apply(this,arguments);
   const ds=e.defScale,dir=e.direction;let scaled=false,turned=false;
   try{if(prefs.midbossScale&&midClass(e)&&Number.isFinite(ds)){e.defScale=ds*.7;scaled=true;stats.midbossDraws++;}
    if(prefs.faceAlways&&typeof player==='object'&&player&&inFight(e)){const want=toward(e);if(['left','right'].includes(want)&&e.direction!==want){e.direction=want;turned=true;stats.faced++;}}}catch(err){fail(err);}
   try{return base.apply(this,arguments);}finally{if(scaled)e.defScale=ds;if(turned)e.direction=dir;}};}
  if(typeof hurt==='function'){const base=hurt;hurt=function(value,source,...a){let added=false;if(value>0)hurtAt=T();
   if(solo()){swapBind(source);
    // R58 은 맞힌 물체에 상태가 없으면 적의 공격·차례(affliction(owner,step))에서 골라 속박이 섞였다 — 그 값을 미리 보고 속박이면 바꿔 넣는다.
    try{const r58=R58(),owner=ownerOf(source);if(prefs.bindRootOnly&&r58&&owner&&!rootBoss(owner)&&source&&typeof source==='object'&&!source.r58Affliction){
     const tag=owner.attack?.r58Action?.affliction||r58.affliction?.(owner,r58.state?.(owner)?.step??0);
     if(tag&&(tag.key==='bind'||tag.wound==='bind')){const k=altKey(r58.defs,['bind','chill']);if(k){source.r58Affliction={...r58.defs[k],key:k};added=true;stats.bindSwapped++;}}}}catch(e){fail(e);}}
   try{return base.call(this,value,source,...a);}finally{if(added)try{delete source.r58Affliction;}catch(_){}}};}
  if(typeof moveActor==='function'){const base=moveActor;moveActor=function(e,dx,dy,...a){if(e===player&&!escaping&&bound()){stats.bindHeld++;return false;}return base.call(this,e,dx,dy,...a);};}
  if(typeof guardStart==='function'){const base=guardStart;guardStart=function(...a){const was=player?.guard,r=base.apply(this,a);try{if(prefs.guardCleanse&&solo()&&player&&player.guard&&!was)cleanse();}catch(e){fail(e);}return r;};}
  if(typeof guardEnd==='function'){const base=guardEnd;guardEnd=function(...a){if(auto7.ours&&T()<auto7.until)auto7.ours=false;return base.apply(this,a);};}
  if(typeof blink==='function'){const base=blink;blink=function(...a){const p0=player?{x:player.x,y:player.y}:null,cd=player?.blinkCD,d=p0&&prefs.blinkWalls&&solo()&&live()?blinkDir(p0):null;escaping=true;let r;try{r=base.apply(this,a);}finally{escaping=false;}
   try{if(d&&player&&player.blinkCD>cd){const moved=Math.hypot(player.x-p0.x,player.y-p0.y),miss=Math.hypot(p0.x+d.x*3.8-player.x,p0.y+d.y*3.8-player.y);/* 벽에 막혀 미끄러지면 끝점에 못 닿는다 */if(miss>.6){const q=overWall(p0,d,moved);if(q){player.x=q.x;player.y=q.y;if(typeof route!=='undefined')route=[];if(typeof cam!=='undefined'&&cam){cam.x=q.x;cam.y=q.y;}stats.blinkWalls++;}}}}catch(e){fail(e);}return r;};}
 }
 try{install();}catch(e){fail(e);}

 // ---- ⑤ 체력 구슬: 공명 방어 회복·보호막 실시간 ---------------------------------------------------
 let orbBox=null,guardHeal=0,lastHp=null,wasGuard=false;
 function orb(){if(orbBox&&document.body.contains(orbBox))return orbBox;const host=document.querySelector('.r93-orb.r93-hp')||document.getElementById('heroCard');if(!host)return null;
  orbBox=document.createElement('div');orbBox.id='r137GuardOrb';orbBox.style.cssText='position:absolute;inset:0;pointer-events:none;border-radius:50%;z-index:3';
  orbBox.innerHTML='<div class="g" style="position:absolute;inset:6%;border-radius:50%;box-shadow:0 0 0 0 rgba(120,220,255,0);transition:box-shadow .12s"></div><svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%"><circle cx="50" cy="50" r="46" fill="none" stroke="rgba(130,210,255,.9)" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 999" transform="rotate(-90 50 50)"/></svg><span style="position:absolute;left:0;right:0;top:-1.15em;text-align:center;font:700 12px/1 sans-serif;color:#9fe6ff;text-shadow:0 1px 2px #000"></span>';
  if(getComputedStyle(host).position==='static')host.style.position='relative';host.appendChild(orbBox);return orbBox;}
 function orbTick(){try{if(!prefs.guardOrb||typeof player!=='object'||!player){if(orbBox)orbBox.style.display='none';return;}const o=orb();if(!o)return;o.style.display='';
   const g=!!player.guard,hp=player.hp;if(g&&!wasGuard){guardHeal=0;lastHp=hp;}if(g&&lastHp!=null&&hp>lastHp)guardHeal+=hp-lastHp;lastHp=hp;wasGuard=g;
   o.querySelector('.g').style.boxShadow=g?'inset 0 0 14px 4px rgba(120,220,255,.75)':'0 0 0 0 rgba(0,0,0,0)';
   const sh=Math.max(0,+player.shield||0),c=o.querySelector('circle');c.setAttribute('stroke-dasharray',(Math.min(1,sh/50)*289).toFixed(1)+' 999');
   o.querySelector('span').textContent=g?('공명 +'+Math.round(guardHeal)+(sh>0?' · 보호막 '+Math.round(sh):'')):(sh>0?'보호막 '+Math.round(sh):'');
   if(g&&typeof updateHUD==='function')updateHUD();}catch(e){fail(e);}}
 (function loop(){orbTick();requestAnimationFrame(loop);})();

 // ---- 설정 ----------------------------------------------------------------------------------
 const LABELS=[['echoMajorOnly','환영 공격은 중간보스급 이상만'],['midbossScale','중간보스 크기 70%'],['faceAlways','전투 중 몹이 늘 영웅을 봄'],['bindRootOnly','속박은 뿌리 보스만'],['bindRoot','속박 중 걸어서 이동 불가'],['guardCleanse','공명 방어로 상태이상 해제'],['guardOrb','체력 구슬에 공명 방어 회복·보호막'],['autoGuard','길잡이·반자동 7초마다 공명 방어'],['blinkWalls','블링크로 얇은 벽 넘기']];
 function settingsBox(){const q=document.getElementById('settingsR118')?.parentElement||document.getElementById('detailSettingsR114')||document.getElementById('panel');/* R142: '#modal .settings,#modal' 은 #modal 자체가 먼저 맞아 상자가 설정 창 밖(오른쪽)에 붙었다(모바일에서 창이 좁아짐) */if(!q||document.getElementById('settingsR137'))return;
  const box=document.createElement('div');box.id='settingsR137';box.innerHTML='<h4 style="margin:.6em 0 .2em">몹·공명 방어 (R137)</h4>'+LABELS.map(([k,l])=>'<label style="display:flex;gap:.4em;align-items:center;margin:.15em 0"><input type="checkbox" data-r137="'+k+'"'+(prefs[k]?' checked':'')+'> '+l+'</label>').join('');
  q.appendChild(box);box.querySelectorAll('[data-r137]').forEach(el=>el.onchange=()=>set({[el.dataset.r137]:el.checked}));}
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsBox();}catch(e){fail(e);}return r;};}

 window.__STORYWORLD_COMBAT_R137__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,major,midClass,echoAllowed,rootBoss,bound,cleanse,overWall,
  inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},r61Map:!!r61Map,autoGuard:{...auto7},lastError})});
})();
