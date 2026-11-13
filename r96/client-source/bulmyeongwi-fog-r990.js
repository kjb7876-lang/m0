// R990 불면귀 안개 스킬 — 사용자 2026-11-13 "불면귀가 스킬로 불면귀맵 일반몹을 더 많이 자주 생성하도록", "불면귀가 안개스킬위주로 사용하도록",
//  "불면귀쪽 보스이미지 검수해봐 예전이미지 나오는거 같긴한데".
//  정본 35장: 주민 어깨의 검은 안개가 엉겨 불면귀 형상이 되고, 불면귀는 주민을 실처럼 끌어 쓴다 → 소환·패턴을 '검은 안개' 한 계열로 묶는다.
//  · B 안개 소환(본체 불면귀 l303-boss 만): 엔진 공용 소환(R61: 17초→체력 0에 12초, 분신 1 + 주민 2, 동시 6·평생 24)을 이 보스만 쉬게 하고
//    R990 '검은 안개 끌어내기'로 대신한다 — 첫 소환 4.5초, 주기 10.2초(체력 100%) → 6.5초(체력 25% 이하), 한 번에 주민 4명(체력 절반 이하 5명),
//    동시 생존 상한 8(모바일·저사양 6), 평생 48. 주민은 불면귀 맵 일반몹(l302-e1 · 잠식된 약방 아낙·어부·소복 처녀 차례)만, 능력치는 R61 소환과 같은 정규화.
//    준비 1.1초 동안 소환 자리마다 Dots 검은 안개 핵(CX-0070BM fx_core24)이 엉기고, 풀리면 주민이 끌려 나온 자리에서 핵이 흩어진다.
//    R61 표시(r61Summoned)를 그대로 달아 주인이 죽거나 전투가 끝나면 엔진이 함께 거둔다(보상·진행 집계 없음).
//  · C 안개 위주 패턴: 지금 차례 7칸 = 원래 4종(불면의 십자시선·검은 영혼 부채살·잠들 수 없는 안전지대·악몽 잔상 폭우) + 엔진 R58 늪 테마 3종('독수렁 · …', 안개 0칸).
//    R58 3종은 수치 그대로 '검은 안개 · …'로 이름·그림만 바꾸고, 새 안개 3종을 더해 차례 11칸 중 7칸이 안개(64%).
//    검은 안개 웅덩이(영웅 쪽 원 3개, 느려짐) · 안개 장막 확산(불면귀 둘레 원, 행동 지연) · 검은 안개 분사(부채꼴, 느려짐).
//    모두 엔진 예고(경고 테두리)가 먼저 뜨는 피할 수 있는 패턴이고, 피해는 원래 패턴 범위(22~32) 안. 보스 체력·원래 패턴 수치는 그대로.
//    안개 그림은 R430 안개 시트(기존 자산)를 먹빛 보라로 돌려(hue-rotate·brightness) 알파 .58 이하로 — 영웅·예고 테두리가 비친다. 동시 안개 6(저사양 3).
//  · A 그림 검수: 옛 회백 해골 그림(bulmyeongwi_idle/attack/rain/transition)이 보스 몸 말고 엔진 R61 '잔상 던지기(echo)'로 그려지고 있었다(실측, 아래 A 절)
//    → 동작·투사체 그림을 R760 최신 시트 칸으로. R61 소환 예고·등장 잔상도 같은 기준.
//  끄기: localStorage['storyworld.r990.bmgfog']='{"on":false}'(소환만 '{"summon":false}', 안개 패턴만 '{"patterns":false}', 그림 검수만 '{"art":false}').
//  점검: window.__STORYWORLD_BMG_FOG_R990__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BMG_FOG_R990__)return;
const REV='R990-bmg-fog-1',KEY='storyworld.r990.bmgfog',ZONE='last303',BOSS='l303-boss';
let prefs={on:true,summon:true,patterns:true,art:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={waves:0,units:0,refused:0,cancelled:0,r61Held:0,fogFx:0,fogSkipped:0,patternsSet:0,casts:{},artSwaps:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fin=(v,d=0)=>Number.isFinite(v)?v:d;
const roomId=()=>{try{return String(room?.id||'');}catch(_){return '';}};
const isBoss=e=>!!e&&e.nativeId===BOSS&&!e.r61Summoned&&roomId()===ZONE;
const live=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active';
const lowFx=()=>{try{return !!settings?.lowFx;}catch(_){return false;}};
const mobile=()=>{try{return matchMedia('(pointer:coarse)').matches||innerWidth<760;}catch(_){return false;}};
// ── 수치(보고서 전후 표와 같음) ──
const SUMMON=Object.freeze({first:4.5,periodHi:10.2,periodLo:6.5,loAt:.25,count:4,countLow:5,lowAt:.5,cap:8,capLow:6,lifetime:48,windup:1.1,recovery:.5,crowd:30});
const FOG=Object.freeze({max:6,maxLow:3,alpha:.58,filter:'hue-rotate(205deg) saturate(.55) brightness(.42) contrast(1.1)'});
const NAMES=['잠식된 약방 아낙','잠식된 어부','잠식된 소복 처녀'];
const CORE={path:'assets/r990/fog-core.webp',cell:256,n:24,fps:18},MIST={path:'assets/r430/mist-loop.webp',cell:192,cols:6,n:22,fps:12};
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}try{if(typeof addImage==='function')addImage(p,'R990 불면귀 안개');}catch(_){}return null;}
function tileLen(x,y){try{const a=project(x,y),b=project(x+1,y+1),d=Math.hypot(b.x-a.x,b.y-a.y);if(d>1e-3&&Number.isFinite(d))return d;}catch(_){}return 48;}

// ── C 안개 패턴 ──
const BASE={innerRadius:1.35,gap:.42,statusValue:0,telekinetic:false,telekineticRain:false,rainWaves:3,rainPerWave:4,rainWaveGap:.78,rainSlotGap:.04,rainDamageScale:.74,r990Fog:true};
const F1={...BASE,name:'검은 안개 웅덩이',shape:'circle',anchor:'target',windup:1.25,cooldown:4.4,damage:22,radius:1.9,width:.72,repeats:3,gap:.5,color:'#3a2450',accent:'#c9a6ff',status:'slow',statusValue:.8};
const F2={...BASE,name:'안개 장막 확산',shape:'circle',anchor:'boss',windup:1.35,cooldown:4.8,damage:24,radius:3.1,width:.72,repeats:1,color:'#2a1d3b',accent:'#d8c2ff',status:'delay',statusValue:.35};
const F3={...BASE,name:'검은 안개 분사',shape:'cone',anchor:'boss',windup:1.15,cooldown:4.3,damage:22,radius:6.2,width:.95,repeats:1,color:'#33224a',accent:'#e6d6ff',status:'slow',statusValue:.7};
const ORIG=['불면의 십자시선','검은 영혼 부채살','잠들 수 없는 안전지대','악몽 잔상 폭우'];
// 엔진 R58(boss 변형)은 불러올 때 지역 테마 이름으로 3종을 끼워 넣는다 — 이 지역 테마가 늪(swamp)이라 '독수렁 · 조준 연격/교차 파열/잔류 맥동'(독·쇠약·속박).
//  불면귀(검은 안개 결투)에는 늪이 아니라 검은 안개 → 수치·모양·상태는 그대로 두고 이름만 '검은 안개 · …'로, 안개 그림을 얹는다(사본, 끄면 원래 객체).
// 차례(엔진은 boss.beat % 칸 수 로 고른다): 원래 4종(O)·R58 3종(X)은 각자 순서 그대로 사이사이에, 새 안개 3종(F) — 11칸 중 안개 7칸(64%).
const ORDER=['O0','F1','X0','O1','F2','X1','O2','F3','X2','O3','F1'];
const ORDER_NO_R58=['O0','F1','F2','O1','F3','F1','O2','F2','F3','O3','F1'];
let patternState={actor:null,original:null,mixed:null};
function bossActor(){try{const z=(portable?.assetMap?.zones||[]).find(r=>r.id===ZONE);return (z?.actors||[]).find(a=>a.id===BOSS)||null;}catch(_){return null;}}
function applyPatterns(){const a=bossActor();if(!a||!Array.isArray(a.patterns))return false;
 if(patternState.actor!==a||!patternState.original){const p=a.patterns;if(patternState.mixed&&p.length===patternState.mixed.length&&p.every((x,i)=>x===patternState.mixed[i])){patternState.actor=a;}else{
  const O=ORIG.map(n=>p.find(x=>x?.name===n&&!x.r58Variant&&!x.r990Fog));if(O.some(x=>!x))return false;const X=p.filter(x=>x?.r58Variant&&!x.r990Fog);
  if(p.some(x=>!O.includes(x)&&!X.includes(x)))return false; // 모르는 패턴이 섞였으면 손대지 않는다
  patternState.actor=a;patternState.original=p.slice();const fogX=X.map(x=>({...x,name:String(x.name||'').replace(/^[^·]+·\s*/,'검은 안개 · '),r990Fog:true,r990From:x.name}));
  const F={F1,F2,F3},order=X.length===3?ORDER:ORDER_NO_R58;patternState.mixed=order.map(k=>k[0]==='O'?O[+k[1]]:k[0]==='X'?fogX[+k[1]]:F[k]);}}
 const want=prefs.on&&prefs.patterns?patternState.mixed:patternState.original;
 if(a.patterns.length!==want.length||a.patterns.some((p,i)=>p!==want[i])){a.patterns.length=0;a.patterns.push(...want);stats.patternsSet++;}return true;}
const fogRatio=()=>{const m=patternState.mixed;return m?m.filter(p=>p.r990Fog).length/m.length:0;};

// ── 안개 그림(효과) ──
const fogLive=()=>{try{return effects.filter(f=>f?.type==='r990Fog'&&f.age<f.life).length;}catch(_){return 0;}};
const seenHz=new WeakSet();
function watchHazards(){if(typeof hazards==='undefined'||!Array.isArray(hazards))return;
 for(const h of hazards){if(!h||seenHz.has(h)||h.type!=='story-pattern'||!h.storyPattern5)continue;seenHz.add(h);const P=h.storyPattern5,name=P.name||P.shape;
  if(!h.cast150||h.cast150.r990Seen!==true){if(h.cast150)h.cast150.r990Seen=true;if(roomId()===ZONE&&String(h.owner||'').endsWith(BOSS))stats.casts[name]=(stats.casts[name]||0)+1;}
  if(!P.r990Fog)continue;const cap=lowFx()?FOG.maxLow:FOG.max;
  const spots=P.shape==='cone'?[.32,.62].map(t=>({x:fin(h.originX,h.x)+Math.cos(h.angle)*P.radius*t,y:fin(h.originY,h.y)+Math.sin(h.angle)*P.radius*t,r:P.radius*(.18+.16*t)})):[{x:h.x,y:h.y,r:P.radius}];
  for(const s of spots){if(fogLive()>=cap){stats.fogSkipped++;continue;}if(![s.x,s.y,s.r].every(Number.isFinite))continue;
   fx('r990Fog',s.x,s.y,{life:clamp(fin(h.life,1.5)+.5,.6,6),warn:clamp(fin(h.warning,1),.1,4),r:clamp(s.r,.4,7),seed:(h.id||0)%97});stats.fogFx++;}}}
function frameOf(path,cell,col,row,pivotY){return {path,assetFrame:{sourceRect:[col*cell,row*cell,cell,cell],pivot:[cell/2,pivotY],visibleHeight:cell},sourceAlphaCore:[col*cell,row*cell,cell,cell],metricThreshold:16,sourcePixelsEdited:false};}
function drawFog(f){if(!img(MIST.path))return true;const q=project(f.x,f.y),a=clamp(f.age/Math.max(.01,f.life),0,1),w=f.warn/Math.max(.01,f.life);
 // 예고 동안 짙어지고(.32→.58) 터진 뒤 남았다 흩어짐
 const alpha=FOG.alpha*(a<w?.55+.45*(a/Math.max(.01,w)):1-Math.max(0,(a-.7)/.3));if(!(alpha>0.01)||!Number.isFinite(q?.x)||!Number.isFinite(q?.y)||!Number.isFinite(f.r)||!Number.isFinite(f.age))return true;
 const i=Math.floor(fin(f.age)*MIST.fps+f.seed)%MIST.n,h=clamp(f.r*2.6*tileLen(f.x,f.y)*.72,8,1200),fr=frameOf(MIST.path,MIST.cell,i%MIST.cols,Math.floor(i/MIST.cols),118);
 const paint=()=>{ctx.save();try{drawAssetFrame3(MIST.path,fr,q.x,q.y,h,{alpha:clamp(alpha,0,1),filter:FOG.filter});}finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'r990-fog-'+(f.id??f.seed),kind:'effect',sourcePath:MIST.path,x:f.x,y:f.y,groundAligned:false,lightShadowApproved:true},paint);else paint();return true;}
function drawCore(f){if(!img(CORE.path))return true;const q=project(f.x,f.y),a=clamp(f.age/Math.max(.01,f.life),0,1);if(!Number.isFinite(q?.x)||!Number.isFinite(q?.y))return true;
 let s,alpha;if(f.phase==='gate'){s=.45+.55*a;alpha=.35+.55*a;}else{s=1+.45*a;alpha=.9*(1-a);}if(!(alpha>0.01))return true;
 let ah=110;try{ah=fin(actorHeight(),110);}catch(_){}const i=Math.floor(fin(f.age)*CORE.fps+f.seed)%CORE.n,h=clamp(ah*.95*s,8,900),fr=frameOf(CORE.path,CORE.cell,i,0,212);
 const paint=()=>{ctx.save();try{drawAssetFrame3(CORE.path,fr,q.x,q.y,h,{alpha:clamp(alpha,0,1)});}finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'r990-core-'+(f.id??f.seed),kind:'effect',sourcePath:CORE.path,x:f.x,y:f.y,groundAligned:false,lightShadowApproved:true},paint);else paint();return true;}

// ── B 안개 소환 ──
const SM=new WeakMap();const smOf=e=>{let s=SM.get(e);if(!s)SM.set(e,s={next:NaN,used:0,serial:0,action:null,rows:null,lastWave:-1,profile:null});return s;};
const fields=()=>window.__STORYWORLD_FIELDS_R61__,R61=()=>window.__STORYWORLD_SUMMONS_R61__;
const mine=e=>!!e?.r990Fog&&live(e);
function cap(){return mobile()||lowFx()?SUMMON.capLow:SUMMON.cap;}
function period(B){const hp=clamp(fin(B.hp)/Math.max(1,fin(B.maxHp,1)),0,1),t=clamp((1-hp)/(1-SUMMON.loAt),0,1);return SUMMON.periodHi+(SUMMON.periodLo-SUMMON.periodHi)*t;}
function busy(B){try{return !!(B.attack||B.rangedWindup>0||(B.storyPreparedCast150&&!B.storyPreparedCast150.consumed)||T()<fin(B.storyAttackUntil5)||T()<fin(B.r61BusyUntil)||fields()?.activeAction?.(B));}catch(_){return true;}}
function profileFor(s){if(s.profile)return s.profile;try{const e=room.enemies.find(o=>o?.nativeId==='l302-e1'&&o.profile&&!o.boss&&!o.midboss);if(e)s.profile=e.profile;}catch(_){}
 if(!s.profile)try{const def=regionById?.[ZONE];const p=(def?.roster||[]).find(r=>r?.id==='l302-e1');if(p)s.profile=p;}catch(_){}return s.profile;}
function makeUnit(B,s,i){const prof=profileFor(s);if(!prof||typeof actor3!=='function')return null;const def=typeof regionById!=='undefined'?regionById[ZONE]:null;if(!def)return null;
 const id=ZONE+':r990-fog:'+(++s.serial),e=actor3(prof,id,B.x,B.y,false,room.layer,def,false);if(!e)return null;
 Object.assign(e,{boss:false,midboss:false,persona:false,cosmic:false,trial:false,r61Summoned:{version:1,owner:B.id,kind:'minion'},r990Fog:true,spawnState:'active',deadRecorded:false,graceUntil:T()+.8,cd:1.2,rest:0,
  explorationGroup:null,fieldWaveIndex6:undefined,fieldWave:undefined,sourcePlan6:false,sourcePlanId6:undefined,state:'idle',phaseStage:'active',attack:null,rangedWindup:0,r61OriginZone:ZONE});
 e.name=NAMES[(s.used+i)%NAMES.length];try{window.__STORYWORLD_SCALE_MELEE_R61__?.normalize?.(e,room,{});}catch(err){fail(err);}return e;}
function plan(B,s){const alive=room.enemies.filter(mine).length,liveAll=room.enemies.filter(live).length,hp=fin(B.hp)/Math.max(1,fin(B.maxHp,1));
 const want=hp<=SUMMON.lowAt?SUMMON.countLow:SUMMON.count,n=Math.max(0,Math.min(want,cap()-alive,SUMMON.lifetime-s.used,SUMMON.crowd-liveAll));const rows=[];
 for(let i=0;i<n;i++){const u=makeUnit(B,s,i);if(!u)continue;let p=null;try{p=R61()?.position?.(u,B,i+1,rows.map(r=>r.point));}catch(err){fail(err);}if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))rows.push({unit:u,point:{x:p.x,y:p.y}});}
 return rows;}
function release(B,s,rows,a){if(roomId()!==ZONE||!live(B)||a?.cancelled){stats.cancelled++;return;}let made=0;
 for(const r of rows){if(room.enemies.filter(mine).length>=cap()||s.used>=SUMMON.lifetime)break;let p=r.point;try{if(R61()?.safePoint&&!R61().safePoint(r.unit,p))p=R61().position(r.unit,B,made+1,[]);}catch(_){}if(!p)continue;
  Object.assign(r.unit,{x:p.x,y:p.y,homeX:p.x,homeY:p.y,graceUntil:T()+.72,cd:1.05,nav:[],navAt:-Infinity,stuck:0});room.enemies.push(r.unit);made++;s.used++;stats.units++;
  fx('r990Core',p.x,p.y,{life:.7,phase:'emerge',seed:s.serial%24});}
 if(made){stats.waves++;s.lastWave=T();try{if(typeof sound==='function')sound('r990FogSummon');}catch(_){}}}
function sfxProfile(){try{if(typeof soundProfiles!=='undefined'&&soundProfiles&&!soundProfiles.r990FogSummon?.length)soundProfiles.r990FogSummon=[1,2].map(i=>({key:'r990-fog-'+i,path:'assets/r761/sfx/bmg-reveal-'+i+'.ogg',gain:.55,r541:true}));}catch(err){fail(err);}}
function tickBoss(B){const s=smOf(B),t=T();
 // 엔진 공용 소환(R61)은 이 보스만 쉬게 한다(분신·주민 2 대신 R990 안개 소환)
 try{const r=R61();if(r?.state){const o=r.state(B);if(o&&o.nextAt<t+20){o.nextAt=t+60;stats.r61Held++;}}}catch(err){fail(err);}
 if(!Number.isFinite(s.next))s.next=t+SUMMON.first;if(t<s.next||s.action)return;
 if(s.used>=SUMMON.lifetime){s.next=t+999;return;}if(busy(B)){s.next=t+.4;return;}
 const rows=plan(B,s);if(!rows.length){stats.refused++;s.next=t+2;return;}
 let a=null;try{a=fields()?.beginMotion?.(B,'summon',{windup:SUMMON.windup,recovery:SUMMON.recovery,cooldown:2.4,onRelease:()=>{s.action=null;release(B,s,rows,a);}});}catch(err){fail(err);}
 if(!a){stats.refused++;s.next=t+.5;return;}s.action=a;s.next=t+period(B);
 for(const r of rows)fx('r990Core',r.point.x,r.point.y,{life:SUMMON.windup,phase:'gate',seed:s.serial%24,r990Action:a});
 // 동작이 끊기면(취소·엔진 정리) 다음 주기에 다시
 setTimeout(()=>{if(s.action===a&&(a.cancelled||T()>a.releaseAt+1.5)){s.action=null;}},4000);}

// ── A 옛 그림 길 막기 ──
//  헤드리스 실측(수정 전 main, last303 보스전 64초): 보스 몸은 R760 시트로 그려지지만, 엔진 R61 '잔상 던지기(echo)'가 준비 1.08초 동안
//  보스 자리에 옛 회백 해골 공격 그림(bulmyeongwi_attack)을 키우며 겹쳐 그리고(키 161→300px, 14프레임), 놓으면 같은 그림이 영웅 쪽으로 날아간다.
//  R61 은 그 그림을 엔진 원본 자세 표(sourceFrame)에서 고르므로 R760 이 몸을 바꿔도 이 길은 옛 그림이 남았다.
//  → 동작·투사체가 들고 있는 그림을 R760 '실 팔 휘감기' 타격 칸(atkA 3칸)으로 바꾼다(판정·속도·피해는 그대로). 소환 예고·등장 잔상(R61 summonGate/Emerge)도 같은 기준.
const OLD=/bulmyeongwi_(idle|attack|rain|transition)\.webp|r760\/boss\/bulmyeongwi-(p[1-4]|rain|transition)\.webp/i;
const SHEET_ATK={path:'assets/r760/boss/sheet-atkA.webp',frame:3},SHEET_IDLE={path:'assets/r760/boss/sheet-idle.webp',frame:0};
function sheetFrame(S=SHEET_IDLE){if(!img(S.path))return null;const x=S.frame*512;return {path:S.path,assetFrame:{sourceRect:[x,0,512,512],pivot:[256,469.33],visibleHeight:383},sourceAlphaCore:[x,0,512,512],metricThreshold:16,sourcePixelsEdited:false};}
function fixFrame(fr,S){if(!prefs.art||!fr)return fr;const p=String(fr.path||'');if(!OLD.test(p))return fr;const n=sheetFrame(S);if(!n)return fr;stats.artSwaps++;return {...fr,...n,flip:fr.flip};}
function fixEcho(){if(!prefs.on||!prefs.art||roomId()!==ZONE)return;
 try{for(const e of room.enemies){if(e?.nativeId!==BOSS)continue;const a=e.r61Action;if(a&&a.kind==='echo'&&OLD.test(String(a.path||''))){const f=fixFrame({...(a.frame||{}),path:a.path,flip:a.frame?.flip},SHEET_ATK);if(f&&f.path!==a.path){a.path=f.path;a.frame=f;stats.echoFixed=(stats.echoFixed||0)+1;}}}}catch(err){fail(err);}
 try{if(typeof projectiles!=='undefined'&&Array.isArray(projectiles))for(const p of projectiles){const m=p?.r61Shot;if(!m||m.kind!=='echo'||!OLD.test(String(m.path||'')))continue;const f=fixFrame({...(m.frame||{}),path:m.path,flip:m.frame?.flip},SHEET_ATK);if(f&&f.path!==m.path){m.path=f.path;m.frame=f;if(OLD.test(String(p.asset||'')))p.asset=f.path;stats.echoShotFixed=(stats.echoShotFixed||0)+1;}}}catch(err){fail(err);}}

// ── 설치 ──
let installed={tick:false,effect:false};
function install(){
 if(!installed.tick&&typeof tickEnemies==='function'){const base=tickEnemies;tickEnemies=function(dt){try{if(prefs.on){applyPatterns();watchHazards();sfxProfile();fixEcho();
   if(prefs.summon&&roomId()===ZONE&&room?.engaged&&!room.cleared&&!room.finalizing&&player?.hp>0&&!modal&&!loading){const B=room.enemies.find(e=>isBoss(e)&&live(e));if(B)tickBoss(B);}}}catch(err){fail(err);}
   const r=base.apply(this,arguments);try{fixEcho();watchHazards();}catch(err){fail(err);}return r;};installed.tick=true;}
 if(!installed.effect&&typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(f,...a){
   try{if(f?.type==='r990Fog')return prefs.on?drawFog(f):undefined;if(f?.type==='r990Core'){if(!prefs.on)return;if(f.phase==='gate'&&f.r990Action&&(f.r990Action.cancelled||f.r990Action.released&&f.age>f.life))return;return drawCore(f);}
    if(prefs.on&&roomId()===ZONE&&(f?.type==='summonGateR61'||f?.type==='summonEmergeR61')&&f.r61Frame)f.r61Frame=fixFrame(f.r61Frame);}catch(err){fail(err);return;}
   return base.apply(this,[f,...a]);};installed.effect=true;}
 return installed.tick&&installed.effect;}
let tries=0;(function arm(){let ok=false;try{ok=install();applyPatterns();}catch(e){fail(e);}if(!ok&&++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
img(CORE.path);
window.__STORYWORLD_BMG_FOG_R990__=Object.freeze({rev:REV,SUMMON,FOG,ORDER,fogRatio,
 inspect:()=>({rev:REV,prefs:{...prefs},installed:{...installed},stats:{...stats,casts:{...stats.casts}},lastError,fogRatio:+fogRatio().toFixed(3),patterns:(bossActor()?.patterns||[]).map(p=>p.name),
  summon:(()=>{try{const B=room?.enemies?.find(e=>isBoss(e));const s=B&&SM.get(B);return s?{used:s.used,next:+(s.next-T()).toFixed(2),alive:room.enemies.filter(mine).length,cap:cap(),period:+period(B).toFixed(2)}:null;}catch(_){return null;}})()}),
 set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}try{applyPatterns();}catch(_){}return {...prefs};},
 fixFrame});
})();
