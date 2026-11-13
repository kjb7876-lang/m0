// R953 기억사수 확률 발동 특수 패시브 — 사용자 2026-11-12 13:36Z (요약) 기억사수 확률 특수 패시브 셋:
//  ① 확률적 은신 — 은신 중 궁극기 재사용 77% 감소·궁극기 시전 지연 77% 감소 ② 주변 적 모두에게 표적 난사
//  ③ 통제자 이야기의 기계·로봇 보스 여럿을 7초 동안 불러 전투를 돕게 함(그림·모션·스킬은 그 보스 것 그대로 — 전쟁 트라우마가 낫고 있다는 암시).
//  다른 작품은 느낌만 참고했다. 이름·그림·연출은 StoryWorld 고유(기억사수 테마: 미래 기계공학·은신 저격수 — 코발트·은빛).
//  새 키·새 슬롯 없음. 기본 공격(A)이 나갈 때마다 주사위 한 번 → 셋 중 하나만 터진다(재발동 대기 중이면 그 굴림은 꽝).
//   ① 「잔영 위장」 10%, 대기 16초 : 6초 동안 몸이 옅어진다. 그 순간 R '기억 소거 폭격'의 남은 재사용 대기가 77% 줄고,
//      은신 중에 쏜 폭격은 재사용 16초 → 3.68초, 조준 고리 지연 1.6초 → 0.368초(둘 다 ×0.23). 피해는 그대로. (R561 이 ult() 를 물어 간다.)
//   ② 「표적 소거 난사」 7%, 대기 10초 : 둘레 6.5칸 안에 보이는 적(가까운 순서 12까지)에 조준 표식을 0.35초 건 뒤, 0.12초마다 6번 모든 표적을 한꺼번에 쏜다(한 발 공격력 ×0.28).
//   ③ 「귀환 전우」 3%, 대기 34초 : 통제자 이야기(u201~u206)의 기계 보스 일곱 가운데 셋이 영웅 곁에 7초 동안 나타나 함께 싸운다.
//      그림·자세는 엔진 적 그리기(drawEnemy — 보스 그림·자세 사슬) 그대로, 스킬은 그 보스의 원래 패턴 자료·원래 스킬 그림을 엔진 위험지대 그리기(drawHazard)로 그대로 그린다.
//      다만 과녁은 적이다: 위험지대 객체는 이 파일만 들고 있고(엔진 hazards 목록에 넣지 않음, 피해 0·상태이상 없음) 착탄 때 발자국 안의 적에게 hitEnemy(공격력 ×1.2).
//      아군 보스는 방 적 목록에 넣지 않는다 → 진짜 보스로 세지 않고(처치 수·교전·전투 종료·보스 막대·알림·저장·길잡이 표적 모두 무관) 적도 이들을 노리지 않는다.
//      치유 암시는 글 없이 그림으로만: 전쟁 기계들이 코발트 벗 고리를 두르고 곁에서 싸우다, 돌아갈 때 흰 빛 알갱이가 되어 위로 흩어진다(서사 글은 손대지 않음).
//  판정은 엔진 hitEnemy(난이도·노출·보스 규칙 그대로)·clearLine·blocked·moveActor·footprintContains154. 협동(R62 mode≠off)에서는 발동하지 않는다.
//  생존 배치 영웅(R720, player.r720Ally 몸): 은신·난사·대기 상태를 몸마다 따로 둔다(궁극기 단축 고리는 조종 영웅만).
//  그림: 난사 탄도·착탄·총구는 Dots 시트(R561b gunner-w-tracer·gunner-w-impact·gunner-e-rifle) 재사용. 은신 일렁임·조준 표식·벗 고리·호출/귀환 빛은
//   처음 한 번 오프스크린에 그려 둔 고정 그림(임시) — Dots CX 시트가 오면 바꾼다. 그리기 중 그라데이션을 만들지 않는다(3D 기록기 멈춤 함정). 필터 안 씀.
//  렉: 한 프레임 그림 70장 상한(저사양 30), 아군 보스 6 상한, 할 일이 없으면 그리기 표지를 effects 에서 뺀다.
//  끄기: localStorage['storyworld.r953.gunnerVeil']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_GUNNER_VEIL_R953__)return;
const REV='R953-gunner-veil-2',KEY='storyworld.r953.gunnerVeil',HERO='gunner';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const CFG=Object.freeze({
 cloak:Object.freeze({chance:.10,icd:16,duration:6,ultScale:.23,alpha:.5}),
 barrage:Object.freeze({chance:.07,icd:10,radius:6.5,maxTargets:12,lock:.35,rounds:6,gap:.12,mult:.28}),
 summon:Object.freeze({chance:.03,icd:34,count:3,duration:7,leave:.8,max:6,firstCast:.5,castEvery:2.1,windup:.55,rows:3,mult:1.2,seek:14,range:9,keep:3.2,speed:3.4,leash:2.6}),
 maxDraws:70,lowDraws:30,maxVis:64});
const NAME=Object.freeze({cloak:'잔영 위장',barrage:'표적 소거 난사',summon:'귀환 전우'});
// 통제자 이야기의 기계·로봇 보스(지역, 보스 id)
const BOSSES=Object.freeze([['u201','u201-mid'],['u202','u202-mid'],['u203','u203-mid'],['u203','u203-boss'],['u204','u204-mid'],['u205','u205-mid'],['u206','u206-mid']]);
const SHEET=Object.freeze({
 tracer:Object.freeze({path:'assets/r561/gunner-w-tracer.webp',cw:512,ch:128,cols:6,frames:24,vis:14}),
 impact:Object.freeze({path:'assets/r561/gunner-w-impact.webp',cw:256,ch:256,cols:6,frames:24,px:146/256,py:136/256,vis:200,fps:40}),
 muzzle:Object.freeze({path:'assets/r561/gunner-e-rifle.webp',cw:256,ch:256,cols:6,frames:24,px:35/256,py:139/256,vis:165,fps:40}),
 // R953-2: Dots CX-0095GV 시트(알파 16 이하 잔티를 걷어낸 사본). 그림이 아직 안 읽혔으면 코드 그림이 대신 나온다.
 lock:Object.freeze({path:'assets/r953/gv-lock.webp',cw:256,ch:256,cols:6,frames:24,px:.5,py:.52,close:6,hold:18}),      // GV-04 조준 표식: 0~5 조임 · 6~17 잠금 고동 · 18~23 흩어짐
 friend:Object.freeze({path:'assets/r953/gv-friend.webp',cw:256,ch:128,cols:6,frames:24,px:.5,py:.547,fps:12.5,fill:.84}), // GV-08 벗 고리(반복)
 call:Object.freeze({path:'assets/r953/gv-call.webp',cw:128,ch:384,cols:6,frames:24,px:.5,py:.911})});                      // GV-06 전우 호출 빛기둥(한 번)
const SHAPES=['line','circle','cone','cross','donut'];
const fin=v=>typeof v==='number'&&Number.isFinite(v),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
let lastError=null,errors=0;const fail=e=>{errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const unit=()=>(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1);
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
const isG=p=>!!p&&p.hero===HERO&&p.hp>0;
const P=()=>{try{return typeof player!=='undefined'?player:null;}catch(_){return null;}};
const RM=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
const open=(x,y,r=.3)=>typeof blocked!=='function'||!blocked(x,y,r,RM());
const line=(a,b)=>typeof clearLine!=='function'||clearLine(a,b,RM());
const foes=()=>{try{const rows=typeof liveEnemies==='function'?liveEnemies():[];return rows.filter(e=>e&&e.hp>0&&!e.r953Ally&&fin(e.x)&&fin(e.y)&&(typeof damageable3!=='function'||damageable3(e)));}catch(_){return [];}};
const power=()=>{try{return typeof attackPower==='function'?attackPower():0;}catch(_){return 0;}};
const say=(t,x,y)=>{try{if(typeof floatText==='function')floatText(t,x,y,'#8fb8ff');}catch(_){}};
const sfx=k=>{try{if(typeof sound==='function')sound(k);}catch(_){}};
const arms=()=>{try{return window.__STORYWORLD_GUNNER_ARMS_R561__||null;}catch(_){return null;}};
const norm=v=>String(v||'').replace(/^\.\//,'');
// ---- 상태: 조종 영웅 하나 + 생존 배치 영웅(r720Ally 몸)마다 하나 ------------------------------------------------
const fresh=body=>({body,ready:{cloak:-1e9,barrage:-1e9,summon:-1e9},force:null,cloakT0:-1e9,cloakUntil:-1e9,barrage:null,
 stats:{rolls:0,cloaks:0,barrages:0,summons:0,shots:0,hits:0,damage:0,allyCasts:0,allyHits:0,coopSkipped:0}});
const main=fresh(null),allyState=new WeakMap(),bodies=[];
function st(p,make=true){if(p&&p.r720Ally===true){let s=allyState.get(p);if(!s&&make){s=fresh(p);allyState.set(p,s);bodies.push(s);if(bodies.length>8)bodies.shift();}return s||null;}return main;}
const states=()=>[main,...bodies];
const bodyOf=s=>s.body||P();
const cloakOn=s=>!!s&&on&&T()<s.cloakUntil&&T()>=s.cloakT0;
// 아군 보스 기록: {a(엔진 actor 사본),zone,bid,s(주인 상태),t0,until,leaveAt,castAt,k,pats,room}
const allies=[],hz=[],vis=[];let serial=0,ownRoom=null;
const busy=()=>allies.length||hz.length||vis.length||states().some(s=>s.barrage||cloakOn(s));
function wipeState(s){s.barrage=null;s.cloakUntil=-1e9;for(let i=allies.length-1;i>=0;i--)if(allies[i].s===s)allies.splice(i,1);for(let i=hz.length-1;i>=0;i--)if(hz[i].s===s)hz.splice(i,1);}
function clearAll(){for(const s of states())wipeState(s);allies.length=0;hz.length=0;vis.length=0;disarm();}
// ---- 피해 ----------------------------------------------------------------------------------------------------
function strike(s,e,mult,base,tag,id){if(!solo()){s.stats.coopSkipped++;return false;}if(typeof hitEnemy!=='function'||!e||!(e.hp>0)||e.r953Ally)return false;const dmg=base*mult;if(!(dmg>0))return false;
 const old=e.hp,ok=hitEnemy(e,dmg,{kind:'story-gunner-veil-r953',attackKind9:'skill',friendly:true,owner:'hero',sourceHero:HERO,sourceSlot:'a',attackId9:'r953:'+id,r953:tag});
 if(ok!==false&&old>e.hp){s.stats.hits++;s.stats.damage+=old-e.hp;try{if(typeof floatText==='function')floatText(Math.round(old-e.hp),e.x,e.y);}catch(_){}}return ok!==false;}
// ---- 그림 목록·표지 ------------------------------------------------------------------------------------------
const addVis=v=>{if(low()&&vis.length>=20)return;vis.push({t0:T(),...v});while(vis.length>CFG.maxVis)vis.shift();arm();};
const SENT={type:'r953-gunner-veil',x:0,y:0,age:0,life:Infinity,r953Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
// ---- 발동 ----------------------------------------------------------------------------------------------------
function pick(s){if(s.force){const k=s.force;s.force=null;return k;}
 const r=Math.random(),a=CFG.cloak.chance,b=CFG.barrage.chance,c=CFG.summon.chance,k=r<a?'cloak':r<a+b?'barrage':r<a+b+c?'summon':null;
 return k&&T()>=s.ready[k]?k:null;}
function onSwing(p){const s=st(p);s.stats.rolls++;if(!solo()){s.stats.coopSkipped++;s.force=null;return;}
 const k=pick(s);if(!k)return;s.ready[k]=T()+CFG[k].icd;ownRoom=RM();
 if(k==='cloak')castCloak(s,p);else if(k==='barrage')castBarrage(s,p);else castSummon(s,p);}
// ① 잔영 위장
function castCloak(s,p){s.stats.cloaks++;s.cloakT0=T();s.cloakUntil=T()+CFG.cloak.duration;
 if(!p.r720Ally){try{arms()?.scaleRemain?.('r',CFG.cloak.ultScale);if(typeof updateHUD==='function')updateHUD();}catch(e){fail(e);}}
 addVis({k:'veil',x:p.x,y:p.y,life:.45});say(NAME.cloak,p.x,p.y);sfx('skill');arm();}
function ult(body){const p=body||P(),s=p?st(p,false):null;return cloakOn(s)&&isG(p)?{cd:CFG.cloak.ultScale,delay:CFG.cloak.ultScale}:{cd:1,delay:1};}
// ② 표적 소거 난사
function castBarrage(s,p){const B=CFG.barrage,rows=foes().map(e=>({e,d:Math.hypot(e.x-p.x,e.y-p.y)})).filter(v=>v.d<=B.radius&&line(p,v.e)).sort((a,b)=>a.d-b.d).slice(0,B.maxTargets);
 s.stats.barrages++;if(!rows.length)return;s.barrage={t0:T(),round:0,targets:rows.map(v=>v.e),pw:power(),room:RM(),id:'b'+(++serial)};
 say(NAME.barrage,p.x,p.y);try{p.skillAnim=Math.max(p.skillAnim||0,B.lock+B.gap*B.rounds);}catch(_){}arm();}
function stepBarrage(s){const b=s.barrage;if(!b)return;const B=CFG.barrage,p=bodyOf(s),t=T();if(!p||b.room!==RM()){s.barrage=null;return;}
 while(b.round<B.rounds&&t>=b.t0+B.lock+b.round*B.gap-1e-9){const i=b.round++;let shown=0;
  for(const e of b.targets){if(!(e.hp>0))continue;s.stats.shots++;const hit=strike(s,e,B.mult,b.pw,'barrage',b.id+':'+i);
   if(shown<(low()?3:6)&&(b.targets.length<=6||(b.targets.indexOf(e)+i)%2===0)){shown++;addVis({k:'tracer',a:{x:p.x,y:p.y},b:{x:e.x,y:e.y},life:.13});if(hit)addVis({k:'impact',x:e.x,y:e.y,life:.32});}}
  addVis({k:'muzzle',x:p.x,y:p.y,ang:i*1.05,life:.14});sfx('shot');}
 if(b.round>=B.rounds)s.barrage=null;}
// ③ 귀환 전우
function bossDef(zid,bid){try{const def=regionById[zid];if(!def)return null;const d=def.midboss&&def.midboss.id===bid?def.midboss:(def.bosses||[]).find(v=>v.id===bid);return d?{def,d}:null;}catch(_){return null;}}
function patternsOf(zid,bid,name){let rows=[];try{rows=(portable.assetMap.zones.find(z=>z.id===zid)?.actors.find(a=>a.id===bid)?.patterns||[]).filter(p=>p&&SHAPES.includes(p.shape)&&!p.telekinetic);}catch(_){}
 return rows.length?rows:[{anchor:'target',shape:'circle',radius:1.8,innerRadius:.5,width:.6,repeats:1,gap:.3,color:'#35d7ff',accent:'#8ff6ff',name:name||'일격'}];}
function artOf(bid,p){let route=null,owned=null;try{const fam=['line','cone'].includes(p.shape)?'snipe-sword-wave':p.shape==='cross'?'rotating-laser':'rolling-ordnance';route=portable.bossNativeBitmapRoutes150?.[bid]?.[fam]||null;owned=portable.bossNativeArt137150?.[bid]||null;}catch(_){}
 const path=norm(p.projectileArt?.source||route?.projectile||owned?.sprite||p.impactSprite||p.impactFallbackSprite||'');
 return {path,warn:norm(p.projectileArt?.source||route?.telegraph||path),impact:norm(p.impactSprite||route?.impact||path)};}
function spot(p,i,n){const base=i/n*Math.PI*2+.6;for(const r of [2.2,2.8,1.6,3.4,3.9])for(let k=0;k<8;k++){const a=base+k*Math.PI/4*(k%2?1:-1),x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;if(open(x,y,.6)&&line(p,{x,y})&&!allies.some(v=>Math.hypot(v.a.x-x,v.a.y-y)<1.1))return {x,y};}return null;}
function castSummon(s,p){const S=CFG.summon,room0=RM(),n=Math.min(S.count,S.max-allies.length);s.stats.summons++;if(n<=0||typeof actor3!=='function')return;
 const here=new Set(allies.map(v=>v.bid)),pool=BOSSES.filter(b=>!here.has(b[1])&&bossDef(b[0],b[1]));for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const paths=[];let made=0;
 for(const [zid,bid] of pool){if(made>=n)break;const q=spot(p,made,n);if(!q)continue;const src=bossDef(zid,bid);let a=null;
  try{a=actor3(src.d,'r953:'+(++serial)+':'+bid,q.x,q.y,false,'STORY',src.def,true);}catch(e){fail(e);}if(!a)continue;
  a.boss=false;a.midboss=true;a.r953Ally=true;a.spawnState='active';a.visible=true;a.hp=a.maxHp;a.phase=0;a.tell=0;a.state='idle';a.homeX=q.x;a.homeY=q.y;
  const pats=patternsOf(zid,bid,src.d.name);allies.push({a,zone:zid,bid,s,t0:T(),until:T()+S.duration,leaveAt:null,castAt:T()+S.firstCast+made*.22,k:made,pats,room:room0});made++;
  paths.push(a.path);for(const pt of pats){const art=artOf(bid,pt);paths.push(art.path,art.warn,art.impact);}
  addVis({k:'call',x:q.x,y:q.y,life:1.2});}
 if(made){say(NAME.summon,p.x,p.y);sfx('special');try{if(typeof ensureImages==='function')Promise.resolve(ensureImages([...new Set(paths.filter(Boolean))])).catch(()=>{});}catch(e){fail(e);}arm();}}
function nearestTo(o,r){let b=null,bd=r;for(const e of foes()){const d=Math.hypot(e.x-o.x,e.y-o.y);if(d<=bd){bd=d;b=e;}}return b;}
function allyCast(A,foe){const S=CFG.summon,a=A.a,t=T(),idx=A.k%A.pats.length,p=A.pats[idx];A.k++;A.s.stats.allyCasts++;
 const art=artOf(A.bid,p),lineLike=['line','cone'].includes(p.shape),cnt=Math.min(S.rows,Math.max(1,Math.floor(fin(p.repeats)?p.repeats:1)));
 const near=foes().map(e=>({e,d:Math.hypot(e.x-foe.x,e.y-foe.y)})).filter(v=>v.d<=6).sort((x,y)=>x.d-y.d).map(v=>v.e);
 const cast={id:190000000+(++serial),owner:a.id,zone:A.zone,actor:A.bid,index:idx,phase:0,kind:'r953',name:p.name||p.shape,rows:[],consumed:true};
 for(let i=0;i<cnt;i++){const tg=near[i%Math.max(1,near.length)]||foe,releaseAt=t+S.windup+i*Math.min(.3,fin(p.gap)?p.gap:.3);
  const target=!lineLike&&p.anchor==='boss'?{x:a.x,y:a.y}:{x:tg.x,y:tg.y},dist=Math.hypot(target.x-a.x,target.y-a.y),flight=clamp(dist/9,.9,1.8)*.4,o=lineLike?{x:a.x,y:a.y}:target;
  const row={id:290000000+(++serial),castId:cast.id,owner:a.id,stage:'warning',warningAt:t,releaseAt,impactAt:releaseAt+flight,originX:a.x,originY:a.y,targetX:target.x,targetY:target.y,artPath:art.path,warningArtPath:art.warn||art.path,impactArtPath:art.impact||art.path,fallbackPath:'',sourceRect:null,flight,telekinetic:false,rain:false,wave:0,slot:0,size:120,airborneCenterPivot:false,damage:0,status:'none',statusValue:0,hit:false};
  const h={id:row.id,type:'story-pattern',owner:a.id,x:target.x,y:target.y,originX:o.x,originY:o.y,angle:Math.atan2(target.y-o.y,target.x-o.x),age:0,warning:releaseAt-t,life:row.impactAt-t+.48,radius:Math.max(.1,fin(p.radius)?p.radius:2),width:Math.max(.05,fin(p.width)?p.width:.65),damage:0,lastHit:-99,hitCount5:0,
   storyPattern5:{...p,status:'none',statusValue:0,innerRadius:Math.max(0,fin(p.innerRadius)?p.innerRadius:.5),repeats:1,repeatGap:0},storyRoute5:{zone:A.zone,actor:A.bid,index:idx,eligibleIndex:idx,name:cast.name,phase:0},cast150:cast,row150:row,r953:true};
  try{if(typeof lockPatternFootprint154==='function')lockPatternFootprint154(h);}catch(e){fail(e);}cast.rows.push(row);hz.push({h,row,s:A.s,done:false,pw:power(),room:A.room,id:'a'+row.id});}
 // 보스 공격 자세(엔진 자세 필드 — R54·R104 자세 사슬이 읽는다)
 a.storyAttackState5=A.k%2?'attackA':'attackB';a.storyAttackStart5=t+S.windup*.5;a.storyAttackUntil5=t+S.windup+.75;a.state='attack';a.stateAge=0;a.r953PoseUntil=a.storyAttackUntil5;
 a.r953Face=Math.atan2(foe.y-a.y,foe.x-a.x);arm();}
function inFoot(h,e){try{if(typeof footprintContains154==='function'&&typeof lockPatternFootprint154==='function')return !!footprintContains154(lockPatternFootprint154(h),e.x,e.y,e.radius||.3);}catch(err){fail(err);}return Math.hypot(e.x-h.x,e.y-h.y)<=h.radius+(e.radius||.3);}
function stepHazards(){const t=T(),rm=RM();for(let i=hz.length-1;i>=0;i--){const z=hz[i];if(z.room!==rm){hz.splice(i,1);continue;}z.h.age=t-z.row.warningAt;
  if(!z.done&&t>=z.row.impactAt-1e-9){z.done=true;z.row.hit=true;z.row.stage='impact';for(const e of foes())if(inFoot(z.h,e)&&strike(z.s,e,CFG.summon.mult,z.pw,'ally',z.id))z.s.stats.allyHits++;}
  else if(!z.done&&t>=z.row.releaseAt)z.row.stage='flight';
  if(t>z.row.impactAt+.48)hz.splice(i,1);}}
function stepAllies(dt){const S=CFG.summon,t=T(),rm=RM();for(let i=allies.length-1;i>=0;i--){const A=allies[i],a=A.a,p=bodyOf(A.s);
  if(A.room!==rm||!isG(p)){allies.splice(i,1);continue;}
  if(A.leaveAt!=null){if(t>=A.leaveAt+S.leave)allies.splice(i,1);continue;}
  if(t>=A.until){A.leaveAt=t;a.state='idle';a.moving=false;addVis({k:'mend',x:a.x,y:a.y,life:S.leave+.5});continue;}
  a.flash=0;a.hp=a.maxHp;const posing=t<(a.r953PoseUntil||0);if(!posing&&a.state==='attack')a.state='idle';
  const foe=nearestTo(a,S.seek),goal=foe||p,d=Math.hypot(goal.x-a.x,goal.y-a.y),want=foe?S.keep:S.leash;let moved=false;
  if(!posing&&d>want&&dt>0){const k=Math.min(S.speed*dt,d-want)/d,dx=(goal.x-a.x)*k,dy=(goal.y-a.y)*k,x0=a.x,y0=a.y;
   try{if(typeof moveActor==='function')moveActor(a,dx,dy,a.radius||.5);else if(open(a.x+dx,a.y+dy,a.radius||.5)){a.x+=dx;a.y+=dy;}}catch(e){fail(e);}
   moved=Math.hypot(a.x-x0,a.y-y0)>1e-6;a.moveDX=dx;a.moveDY=dy;}
  a.moving=moved;if(!posing)a.state=moved?'move':'idle';if(foe)a.r953Face=Math.atan2(foe.y-a.y,foe.x-a.x);
  if(foe&&t>=A.castAt&&Math.hypot(foe.x-a.x,foe.y-a.y)<=S.range){A.castAt=t+S.castEvery;allyCast(A,foe);}}}
// ---- 그림(오프스크린 고정 그림 — 임시, Dots 시트가 오면 바꾼다) ---------------------------------------------------
const TEX={};
function make(key,w,h,fn){if(TEX[key])return TEX[key];try{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);c.__storyworldStaticSource={path:'r953:'+key};TEX[key]=c;return c;}catch(e){fail(e);return null;}}
// 은신 일렁임: 사람 키의 세로 캡슐 윤곽 + 가로 주사선(코발트·은빛)
function veilTex(){return make('veil',128,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(170,205,255,0)');gr.addColorStop(.2,'rgba(150,196,255,.5)');gr.addColorStop(.8,'rgba(70,124,255,.42)');gr.addColorStop(1,'rgba(70,124,255,0)');
  g.strokeStyle=gr;g.lineWidth=3;g.beginPath();g.ellipse(w/2,h/2,w/2-10,h/2-8,0,0,7);g.stroke();
  g.fillStyle='rgba(180,214,255,.16)';for(let y=14;y<h-12;y+=9){const k=1-Math.abs(y-h/2)/(h/2),hw=(w/2-12)*Math.sqrt(Math.max(0,1-(1-k)*(1-k)));g.fillRect(w/2-hw,y,hw*2,2);}
  g.fillStyle='rgba(235,244,255,.55)';for(let i=0;i<9;i++){const a=i*2.4,x=w/2+Math.cos(a)*(w/2-14),y=h/2+Math.sin(a)*(h/2-14);g.fillRect(x-1,y-4,2,8);}});}
// 조준 표식: 네 귀 꺾쇠 + 가운데 점(은빛 테, 코발트 심)
function lockTex(){return make('lock',128,128,(g,w,h)=>{const d=(col,lw)=>{g.strokeStyle=col;g.lineWidth=lw;for(const [sx,sy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){const cx=w/2+sx*40,cy=h/2+sy*40;g.beginPath();g.moveTo(cx-sx*18,cy);g.lineTo(cx,cy);g.lineTo(cx,cy-sy*18);g.stroke();}g.beginPath();g.arc(w/2,h/2,26,0,7);g.stroke();};
  d('rgba(20,40,110,.85)',7);d('rgba(140,190,255,1)',3.5);d('rgba(245,250,255,.95)',1.2);g.fillStyle='rgba(245,250,255,1)';g.beginPath();g.arc(w/2,h/2,3.5,0,7);g.fill();
  g.strokeStyle='rgba(245,250,255,.9)';g.lineWidth=1.5;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){g.beginPath();g.moveTo(w/2+dx*12,h/2+dy*12);g.lineTo(w/2+dx*22,h/2+dy*22);g.stroke();}});}
// 벗 고리(아군 보스 발밑): 코발트 타원 두 겹 + 은빛 눈금
function friendTex(){return make('friend',256,128,(g,w,h)=>{g.strokeStyle='rgba(40,84,210,.45)';g.lineWidth=12;g.beginPath();g.ellipse(w/2,h/2,w/2-12,h/2-10,0,0,7);g.stroke();
  g.strokeStyle='rgba(140,190,255,.95)';g.lineWidth=3;g.beginPath();g.ellipse(w/2,h/2,w/2-12,h/2-10,0,0,7);g.stroke();
  g.strokeStyle='rgba(240,247,255,.9)';g.lineWidth=2;for(let i=0;i<12;i++){const a=i*Math.PI/6,c=Math.cos(a),s=Math.sin(a);g.beginPath();g.moveTo(w/2+c*(w/2-22),h/2+s*(h/2-18));g.lineTo(w/2+c*(w/2-12),h/2+s*(h/2-10));g.stroke();}});}
// 빛기둥(호출·귀환): 아래가 밝고 위로 옅어지는 흰빛·코발트 기둥
function pillarTex(){return make('pillar',96,384,(g,w,h)=>{const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,'rgba(245,250,255,.95)');gr.addColorStop(.35,'rgba(150,196,255,.6)');gr.addColorStop(1,'rgba(70,124,255,0)');
  g.fillStyle=gr;g.beginPath();g.moveTo(w*.18,h);g.lineTo(w*.82,h);g.lineTo(w*.62,0);g.lineTo(w*.38,0);g.closePath();g.fill();
  const g2=g.createLinearGradient(0,h,0,h*.2);g2.addColorStop(0,'rgba(255,255,255,.95)');g2.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=g2;g.fillRect(w/2-5,h*.2,10,h*.8);});}
// 빛 알갱이(귀환): 작은 마름모 빛
function moteTex(){return make('mote',32,32,(g,w,h)=>{for(const [r,c] of [[15,'rgba(120,170,255,.10)'],[12,'rgba(150,196,255,.18)'],[9,'rgba(190,220,255,.30)'],[6,'rgba(225,238,255,.55)'],[3.5,'rgba(255,255,255,.9)']]){g.fillStyle=c;g.beginPath();g.arc(w/2,h/2,r,0,7);g.fill();}
  g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.moveTo(w/2,5);g.lineTo(w/2+4,h/2);g.lineTo(w/2,h-5);g.lineTo(w/2-4,h/2);g.closePath();g.fill();});}
const asked={t:0};
function allPaths(){return Object.values(SHEET).map(S=>S.path);}
function bossPaths(){const out=[];for(const [zid,bid] of BOSSES){const src=bossDef(zid,bid);if(!src)continue;out.push(src.d.path);for(const p of patternsOf(zid,bid,src.d.name)){const a=artOf(bid,p);out.push(a.path,a.warn,a.impact);}}return [...new Set(out.filter(Boolean))];}
let warmedBoss=false;
function warm(){try{veilTex();lockTex();friendTex();pillarTex();moteTex();if(typeof ensureImages!=='function')return;Promise.resolve(ensureImages(allPaths())).catch(()=>{});
  if(!warmedBoss&&isG(P())){warmedBoss=true;Promise.resolve(ensureImages(bossPaths())).catch(()=>{});}}catch(e){fail(e);}}
function sheetImg(k){const S=SHEET[k];try{const got=typeof readyImage==='function'?readyImage(S.path):null;if(got?.image)return got.image;const t=Date.now();if(t-asked.t>1500){asked.t=t;if(typeof ensureImages==='function')Promise.resolve(ensureImages(allPaths())).catch(()=>{});}}catch(e){fail(e);}return null;}
// ---- 그리기 --------------------------------------------------------------------------------------------------
let budget=0,drawCalls=0;
const GROUND=new Set(['friend','call','mend-ring']);
function refill(){budget=low()?CFG.lowDraws:CFG.maxDraws;}
function scoped(id,fn){const own={id:'r953:'+id,kind:'effect',r953:true,groundAligned:GROUND.has(id)};try{if(typeof ctx.scope==='function')return ctx.scope(own,fn);return fn();}catch(e){fail(e);}}
// 조각 한 장: (x,y)=기준점, w·h=화면 크기, px·py=기준점 비율
// o.free: 영웅 차례에 그리는 몇 장(벗 고리·은신 일렁임)은 상한을 쓰지 않는다(효과 차례와 순서가 엇갈려도 빠지지 않게)
function img(id,im,x,y,w,h,o={}){if(!im||!(w>0)||!(h>0))return false;if(!o.free){if(budget<=0)return false;budget--;}drawCalls++;
 scoped(id,()=>{ctx.save();try{ctx.globalCompositeOperation=o.add?'lighter':'source-over';ctx.globalAlpha*=clamp(o.alpha??1,0,1);ctx.translate(x,y);if(o.ang)ctx.rotate(o.ang);
  if(o.src)ctx.drawImage(im,o.src[0],o.src[1],o.src[2],o.src[3],-w*(o.px??.5),-h*(o.py??.5),w,h);else ctx.drawImage(im,-w*(o.px??.5),-h*(o.py??.5),w,h);}catch(e){fail(e);}finally{ctx.restore();}});return true;}
function cell(id,k,fr,x,y,size,o={}){const S=SHEET[k],im=sheetImg(k);if(!im)return false;fr=o.once?clamp(Math.floor(fr),0,S.frames-1):((Math.floor(fr)%S.frames)+S.frames)%S.frames;
 return img(id,im,x,y,size,o.h??size*S.ch/S.cw,{...o,src:[(fr%S.cols)*S.cw,Math.floor(fr/S.cols)*S.ch,S.cw,S.ch],px:o.px??S.px??.5,py:o.py??S.py??.5});}
const scr=(x,y,lift=.45)=>{const q=project(x,y);return {x:q.x,y:q.y-H()*lift};};
function drawCloak(s,p){const t=T(),h=H(),q=project(p.x,p.y),age=t-s.cloakT0,left=s.cloakUntil-t,k=Math.min(smooth(age/.3),smooth(left/.4)),wob=.5+.5*Math.sin(t*7);
 img('cloak',veilTex(),q.x,q.y-h*.52,h*.62*(1+.04*wob),h*1.18,{alpha:(.75+.25*wob)*k,add:true,free:true});
 if(!low())img('cloak',veilTex(),q.x,q.y-h*.52+((t*38)%(h*.3))-h*.15,h*.5,h*.9,{alpha:.28*k,add:true,free:true});}
function drawFriend(A){const a=A.a,t=T(),h=H(),u=unit(),g=project(a.x,a.y),k=A.leaveAt!=null?1-smooth((t-A.leaveAt)/CFG.summon.leave):smooth((t-A.t0)/.35),w=u*2.9*(1+.04*Math.sin(t*4+A.t0));
 if(cell('friend','friend',(t-A.t0)*SHEET.friend.fps,g.x,g.y,w/SHEET.friend.fill,{alpha:k,free:true})){if(!low())cell('friend','friend',(t-A.t0)*SHEET.friend.fps,g.x,g.y,w/SHEET.friend.fill,{alpha:.35*k,add:true,free:true});return k;}
 img('friend',friendTex(),g.x,g.y,w,w*.5,{alpha:k,free:true});img('friend',friendTex(),g.x,g.y,w,w*.5,{alpha:.5*k,add:true,free:true});return k;}
// 아군 보스 몸: 엔진 적 그리기 그대로(보스 그림·자세 사슬). 나타날 때·돌아갈 때만 옅게.
function drawAlly(A){const k=drawFriend(A);if(typeof drawEnemy!=='function')return;ctx.save();try{ctx.globalAlpha*=clamp(.15+.85*k,0,1);drawEnemy(A.a);}catch(e){fail(e);}finally{ctx.restore();}
 // 벗 표지: 보스 이름(원래 이름 그대로)을 코발트로 — 적 이름표(상아색)와 구분
 if(k>.5&&!low()&&typeof ctx.fillText==='function')scoped('label',()=>{ctx.save();try{const g=project(A.a.x,A.a.y);ctx.globalAlpha*=k;ctx.font='11px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillStyle='#9cc4ff';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(String(A.a.name||''),g.x,g.y-H()*1.72);ctx.shadowBlur=0;}catch(e){fail(e);}finally{ctx.restore();}});}
function drawAll(){const t=T(),lo=low(),h=H(),u=unit();refill();
 // 보스 스킬: 엔진 위험지대 그리기(원래 스킬 그림·경고·비행·착탄 단계) 그대로
 if(typeof drawHazard==='function')for(const z of hz){try{z.h.age=t-z.row.warningAt;drawHazard(z.h);}catch(e){fail(e);}}
 // 조준 표식
 const lock=lockTex(),LS=SHEET.lock;for(const s of states()){const b=s.barrage;if(!b)continue;const B=CFG.barrage,age=t-b.t0,k=smooth(age/B.lock),fireT=Math.max(.05,B.rounds*B.gap),
   fr=age<B.lock?clamp(age/B.lock,0,1)*LS.close:LS.close+clamp((age-B.lock)/fireT,0,1)*(LS.frames-1-LS.close); // 조이는 동안 0~6, 쏘는 동안 잠금 고동, 끝 발에 흩어짐
  for(const e of b.targets){if(!(e.hp>0))continue;const g=scr(e.x,e.y,.5),sz=h*(1.25-.5*k);
   if(!cell('lock','lock',fr,g.x,g.y,h*1.9,{once:true,alpha:.7+.3*k}))img('lock',lock,g.x,g.y,sz,sz*.72,{alpha:.55+.45*k,ang:(1-k)*.9});}}
 for(const v of vis){const age=t-v.t0,k=age/v.life;if(k<0||k>=1)continue;
  if(v.k==='tracer'){const A=scr(v.a.x,v.a.y,.55),B=scr(v.b.x,v.b.y,.5),L=Math.hypot(B.x-A.x,B.y-A.y);if(L>2)cell('tracer','tracer',age*60+v.t0*97,A.x,A.y,L,{h:h*1.1,ang:Math.atan2(B.y-A.y,B.x-A.x),px:0,py:.5,alpha:1-k*.6,add:true});}
  else if(v.k==='impact'){const g=scr(v.x,v.y,.5);cell('impact','impact',age*SHEET.impact.fps,g.x,g.y,h*1.25,{alpha:1-smooth((k-.6)/.4)});}
  else if(v.k==='muzzle'){const g=scr(v.x,v.y,.6);cell('muzzle','muzzle',age*SHEET.muzzle.fps+6,g.x,g.y,h*1.1,{ang:v.ang,alpha:1-k,add:true});}
  else if(v.k==='veil'){const g=project(v.x,v.y);img('cloak',friendTex(),g.x,g.y,u*(1+2.6*smooth(k)),u*(.5+1.3*smooth(k)),{alpha:.9*(1-k),add:true});}
  else if(v.k==='call'){const g=project(v.x,v.y);if(cell('call','call',k*SHEET.call.frames,g.x,g.y,h*1.5,{once:true,alpha:1-smooth((k-.85)/.15)}))continue;img('call',pillarTex(),g.x,g.y,h*(.9-.5*k),h*3.6,{py:1,alpha:.95*(1-k*k),add:true});img('call',friendTex(),g.x,g.y,u*2.6*smooth(k/.6),u*1.3*smooth(k/.6),{alpha:.9*(1-k)});}
  else if(v.k==='mend'){const g=project(v.x,v.y),mote=moteTex();img('mend',pillarTex(),g.x,g.y,h*(.5+.5*k),h*(2.6+2*k),{py:1,alpha:.75*(1-k)*smooth(k/.15),add:true});
   img('mend-ring',friendTex(),g.x,g.y,u*(2.2+1.6*k),u*(1.1+.8*k),{alpha:.7*(1-k)});
   const n=lo?5:11;for(let i=0;i<n;i++){const ph=(i*.37+v.t0)%1,kk=clamp(k*1.25-ph*.25,0,1),ax=Math.sin(i*2.4+v.t0*3)*h*(.45+.2*kk),sz=h*(.2-.08*kk);
    if(kk>0&&kk<1)img('mend',mote,g.x+ax,g.y-h*(.2+2.4*kk*kk+ (i%3)*.25),sz,sz,{alpha:(1-kk)*smooth(kk/.12),add:true});}}}}
// ---- 설치 ----------------------------------------------------------------------------------------------------
let lastT=null,heroDepth=0;
try{
 if(typeof basicAttack==='function'){const base=basicAttack;basicAttack=function(...a){const p=P();if(!on||!isG(p))return base.apply(this,a);const cd0=p.attackCD,r=base.apply(this,a);
   try{if(!(cd0>0)&&p.attackCD>0&&P()===p)onSwing(p);}catch(e){fail(e);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{if(on)drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 // 영웅 그리기: 은신 중이면 몸을 옅게 + 일렁임. 조종 영웅 차례에 아군 보스를 깊이 순서대로(뒤는 먼저, 앞은 나중) 그린다.
 if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){if(!on||heroDepth>0)return base.apply(this,a);const p=P();if(!p)return base.apply(this,a);
   const s=st(p,false),mainTurn=!p.r720Ally,ck=cloakOn(s)&&isG(p),d0=p.x+p.y;let r;heroDepth++;
   try{if(mainTurn)for(const A of allies)if(A.a.x+A.a.y<d0)drawAlly(A);
    if(ck){const t=T(),k=Math.min(smooth((t-s.cloakT0)/.3),smooth((s.cloakUntil-t)/.4));ctx.save();try{ctx.globalAlpha*=1-(1-CFG.cloak.alpha)*k;r=base.apply(this,a);}finally{ctx.restore();}try{drawCloak(s,p);}catch(e){fail(e);}}
    else r=base.apply(this,a);
    if(mainTurn)for(const A of allies)if(!(A.a.x+A.a.y<d0))drawAlly(A);}
   finally{heroDepth--;}return r;};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const t=T(),dt=lastT==null?0:clamp(t-lastT,0,.1);lastT=t;
   if(on&&busy()){const rm=RM();if(ownRoom!==rm){clearAll();ownRoom=rm;}
    else{if(!isG(P()))wipeState(main);for(const s of states())stepBarrage(s);stepAllies(dt);stepHazards();}}
   for(let i=vis.length-1;i>=0;i--)if(t-vis[i].t0>=vis[i].life||t<vis[i].t0-1)vis.splice(i,1);
   if(on&&(allies.length||hz.length||vis.length||states().some(s=>s.barrage)))arm();else disarm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){clearAll();ownRoom=null;const r=await base.apply(this,a);warm();return r;};}
 warm();
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)clearAll();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
function force(kind,body){if(!['cloak','barrage','summon'].includes(kind))return false;const s=st(body||P());if(!s)return false;s.force=kind;return true;}
function inspect(body){const s=st(body||P(),false)||fresh(null),t=T(),left=k=>Math.max(0,+(s.ready[k]-t).toFixed(3));
 return {revision:REV,on,errors,lastError,stats:{...s.stats},cd:{cloak:left('cloak'),barrage:left('barrage'),summon:left('summon')},vis:vis.length,drawCalls,hazards:hz.length,
  cloak:{active:cloakOn(s),left:cloakOn(s)?+(s.cloakUntil-t).toFixed(3):0},
  barrage:s.barrage?{round:s.barrage.round,targets:s.barrage.targets.map(e=>e.id)}:null,
  allies:allies.map(A=>({id:A.a.id,nativeId:A.a.nativeId,name:A.a.name,x:+A.a.x.toFixed(2),y:+A.a.y.toFixed(2),state:A.a.state,left:+Math.max(0,A.until-t).toFixed(2),leaving:A.leaveAt!=null}))};}
window.__STORYWORLD_GUNNER_VEIL_R953__=Object.freeze({revision:REV,config:CFG,names:NAME,on:()=>on,set,force,inspect,ult,
 cloaked:body=>{const p=body||P();return cloakOn(p?st(p,false):null)&&isG(p);},allies:()=>allies.map(A=>A.a)});
})();
