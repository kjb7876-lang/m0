// R384 — 영화 모드: 서사 시점과 전투 시간 맞추기(사용자 2026-11-07 "전투시에 나오게 꼭 보스맵진입했을때가아니라 보스가 나오기전 서사는 일반전투에서 음성나오고
//  보스몹서사는 보스몹잡을때 나오도록 해주고 음성속도에맞춰 전투가 이뤄지게 음성남은 시간계산해서 적 방어력올리고내려서 얼추 비슷하게 진행되게 해줘",
//  이어서 "일반전투 영화길잡이모드에서 음성끝나기전에 몹이다죽으면 뱀서류느낌으로리젠시켜서음성끝날때까지 전투가 이어지도록, 보스전은 방어율, 분신체력및 분신쿨타임조절해서
//  음성끝나고 2-3초뒤쯤 전투가 마무리되도록 조절").
//  영화 모드(R370)가 켜져 있고 R78 구역 전투(길·집결 → 보스 문 → 보스 → 출구)인 지역에서만 동작한다. 혼자 할 때만.
//  ① 서사 시점: 원래는 보스 문 앞(doorStory)에서 'pre' 서사, 보스를 잡고 출구 문(exitStory)에서 'post' 서사가 나왔다.
//     → 일반 전투(길·집결 단계)가 시작되면 'pre' 서사를 바로 자막·음성으로 흘리고, 보스가 나오면(보스 단계 + 보스가 깨어남) 'post' 서사를 흘린다.
//     엔진의 읽음 기록(readScenes)에 남으므로 보스 문·출구 문에서는 같은 글을 다시 읽지 않고 바로 넘어간다(진행 콜백은 그대로).
//  ② 일반 전투 방어 배율: 살아 있는 일반 몹 남은 체력 ÷ 최근 깎이는 속도 = 예상 전투 시간. R370 의 남은 서사 시간(remainingSecs)과 견주어
//     2초마다 '적이 받는 피해 배율'을 조금씩(한 번에 0.75~1.33배, 범위 0.35~2.5) 바꾼다. 서사가 끝났는데 적이 남았으면 1.6배 이상으로 마무리.
//  ③ 일반 전투 리젠(뱀서류): 음성이 3초 넘게 남았는데 일반 몹이 5마리 아래로 줄면, 이 지역에 나왔던 일반 몹을 본떠 영웅 둘레 6~9칸에
//     1.2초마다 최대 3마리씩 다시 불러낸다(체력 60%, 한 단계에 최대 60마리). 마지막 한 마리를 잡는 순간에도 음성이 남았으면 그 자리에서 2마리를 먼저
//     불러내 R78 이 '길 정리 끝'으로 넘기지 않게 한다. 음성이 3초 아래로 남으면 더 부르지 않아 서사와 함께 전투가 끝난다.
//  ④ 보스전: 목표 = 음성이 끝나고 2.5초 뒤 보스 쓰러짐.
//     · 방어율: 보스·중간보스 남은 체력 ÷ (남은 음성 + 2.5초) 에 맞춰 1초마다 피해 배율을 바꾼다(범위 0.12~5). 음성이 끝난 뒤에는 남은 2.5초 안에 끝나도록 더 세게.
//     · 분신·소환(R61) 체력: 분신·소환 몹도 같은 배율로 맞고, 음성이 6초 아래로 남거나 끝났으면 3배로 맞아 끝 장면을 가리지 않는다.
//     · 분신 쿨타임(R61 소환 nextAt): 전투가 서사보다 먼저 끝날 것 같으면 다음 소환을 최대 8초 뒤로 당기고, 음성이 10초 아래로 남으면 새 소환을 막는다.
//  ⑤ 끄기: localStorage storyworld.r384.sync {"story":false} / {"pace":false} / {"respawn":false}.
(()=>{'use strict';
if(window.__STORYWORLD_CINEMA_SYNC_R384__)return;
const REV='R384-sync-2',KEY='storyworld.r384.sync',MIN_M=.35,MAX_M=2.5,STEP_LO=.75,STEP_HI=1.33,DONE_M=1.6,TICK=500,ADJ=2;
const B_MIN=.12,B_MAX=5,B_ADJ=1,TAIL=2.5,ADD_END=3,ADD_END_AT=6,SUMMON_SOON=8,SUMMON_STOP=10;
const KEEP=5,BATCH=3,SPAWN_GAP=1.2,SPAWN_STOP=3,SPAWN_CAP=60,SPAWN_HP=.6,RING=[6,7.5,9];
let prefs={story:true,pace:true,respawn:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={pre:0,post:0,adjust:0,hits:0,respawned:0,saves:0,summonSooner:0,summonHeld:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const now=()=>performance.now()/1000;
const C=()=>window.__STORYWORLD_CINEMA_MODE_R370__,W=()=>window.__STORYWORLD_WORLD_COMBAT_R78__,S61=()=>window.__STORYWORLD_SUMMONS_R61__;
const solo=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;try{return !c?.mode||c.mode()==='off';}catch(_){return true;}};
const cinemaOn=()=>{try{return C()?.prefs?.().on===true;}catch(_){return false;}};
const voiceLeft=()=>{try{const v=Number(C()?.remainingSecs?.());return Number.isFinite(v)?v:0;}catch(_){return 0;}};
function phaseOf(r){try{const w=W();if(!w||!r||!w.controlled?.(r))return null;return w.state(r)?.phase||null;}catch(_){return null;}}
const alive=e=>!!e&&e.hp>0&&!e.deadRecorded&&!['hidden','inactive','disabled','despawned','dead'].includes(e.spawnState);
const major=e=>!!(e&&(e.boss||e.midboss));
const summoned=e=>!!(e&&(e.r61Summoned||e.r61Clone));
// R78 field() 와 같은 기준(살아 있는 일반 몹)
const plain=e=>!!e&&!major(e)&&!e.persona&&!e.trial&&!e.cosmic&&!summoned(e);
const field=e=>alive(e)&&plain(e);
const isRoute=ph=>ph==='route'||ph==='rally';
// 시간 계산에 쓰는 적(체력 합)
function targets(r,ph){const es=r?.enemies||[];if(isRoute(ph))return es.filter(e=>alive(e)&&!e.boss);if(ph==='boss')return es.filter(e=>alive(e)&&major(e));return [];}
// ── ① 서사 시점 ──
function unread(def,part){try{return nextScenes(def,part).filter(s=>!readScenes.has(s.key));}catch(_){return [];}}
function play(part,r){const def=G(()=>regionById[r.id],null);if(!def)return false;const sc=unread(def,part);const flag=part==='pre'?'r384Pre':'r384Post';r[flag]=true;if(!sc.length)return false;
 try{playScenes(sc,()=>{});stats[part]++;return true;}catch(e){fail(e);return false;}}
function storyTick(r,ph){if(!prefs.story||G(()=>storyScene,null)||G(()=>modal,false))return;
 if(isRoute(ph)&&!r.r384Pre)play('pre',r);
 else if(ph==='boss'&&!r.r384Post&&(r.enemies||[]).some(e=>e.boss&&alive(e)))play('post',r);}
// ── ②④ 방어 배율 ──
let m=1,addM=1,seg='',hpPrev=NaN,tPrev=0,rate=0,lastAdj=0,last=null,voiceEndAt=null;
function reset(){m=1;addM=1;hpPrev=NaN;rate=0;lastAdj=now();voiceEndAt=null;}
function paceTick(r,ph){if(!prefs.pace){m=1;addM=1;return;}const key=(r.id||'')+':'+ph;if(key!==seg){seg=key;reset();}
 const rows=targets(r,ph);if(!rows.length){m=1;addM=1;hpPrev=NaN;return;}
 const hp=rows.reduce((s,e)=>s+Math.max(0,e.hp),0),t=now();
 if(Number.isFinite(hpPrev)&&t>tPrev){const loss=Math.max(0,hpPrev-hp)/(t-tPrev);rate=rate?rate*.8+loss*.2:loss;}
 hpPrev=hp;tPrev=t;const voice=voiceLeft();
 if(ph==='boss'){
  if(voice>.5)voiceEndAt=null;else if(voiceEndAt==null)voiceEndAt=t;
  addM=(voice<ADD_END_AT||voiceEndAt!=null)?Math.max(m,ADD_END):m;
  summonTick(r,voice,hp);
  if(t-lastAdj<B_ADJ)return;lastAdj=t;if(!(rate>0))return;
  const left=voiceEndAt==null?voice+TAIL:TAIL-(t-voiceEndAt);
  if(left<=.5){m=clamp(m*1.5,B_MIN,B_MAX);stats.adjust++;last={fight:+(hp/rate).toFixed(1),voice:+voice.toFixed(1),left:+left.toFixed(1),m:+m.toFixed(2)};return;}
  m=clamp(m*clamp(hp/left/rate,STEP_LO,STEP_HI),B_MIN,B_MAX);stats.adjust++;last={fight:+(hp/rate).toFixed(1),voice:+voice.toFixed(1),left:+left.toFixed(1),m:+m.toFixed(2)};return;}
 addM=1;if(t-lastAdj<ADJ)return;lastAdj=t;
 if(!(rate>0))return;// 아직 붙지 않음
 if(!(voice>1)){m=clamp(Math.max(m,DONE_M),MIN_M,MAX_M);stats.adjust++;return;}
 m=clamp(m*clamp(hp/voice/rate,STEP_LO,STEP_HI),MIN_M,MAX_M);stats.adjust++;last={fight:+(hp/rate).toFixed(1),voice:+voice.toFixed(1),m:+m.toFixed(2)};}
// 분신·소환 쿨타임(R61 summons state(e).nextAt)
function summonTick(r,voice,hp){const api=S61();if(!api?.state)return;const T=G(()=>time,0);
 for(const e of r.enemies||[]){if(!major(e)||!alive(e))continue;let s=null;try{if(api.enabled&&!api.enabled(e))continue;s=api.state(e,r);}catch(_){continue;}if(!s||!Number.isFinite(s.nextAt))continue;
  if(voice<SUMMON_STOP){const hold=T+voice+TAIL+5;if(s.nextAt<hold){s.nextAt=hold;stats.summonHeld++;}}
  else if(rate>0&&hp/rate<voice&&s.nextAt>T+SUMMON_SOON){s.nextAt=T+SUMMON_SOON;stats.summonSooner++;}}}
// ── ③ 리젠 ──
let spawnSeg='',spawned=0,lastSpawn=-1e9,serial=0;
function templates(r){const es=(r.enemies||[]).filter(e=>plain(e)&&!e.wardChampionR81&&e.profile&&Number(e.maxHp)>0);const orig=es.filter(e=>!e.r384Respawn),plainOrig=orig.filter(e=>!e.squadLeaderR373);return plainOrig.length?plainOrig:orig.length?orig:es;}// R373 분대장(체력×1.6·이름) 말고 일반 몹을 본뜬다
function spot(r,i){const p=G(()=>player,null);if(!p)return null;const a0=Math.random()*Math.PI*2;let tries=0;
 for(const rad of RING)for(let k=0;k<12;k++){const a=a0+(k+i*.37)*Math.PI/6,q={x:p.x+Math.cos(a)*rad,y:p.y+Math.sin(a)*rad};
  try{if(blocked(q.x,q.y,.4,r))continue;if(++tries>10)return null;if(typeof findPath==='function'&&!(findPath(p,q,r)?.length>0))continue;
   if((r.enemies||[]).some(o=>alive(o)&&Math.hypot(o.x-q.x,o.y-q.y)<.9))continue;return q;}catch(_){return null;}}
 return null;}
function cloneOf(src,q){const c={...src};c.id=String(src.id).replace(/:r384r\d+$/,'')+':r384r'+(++serial);c.r384Respawn=true;try{c.r384SpawnD=+Math.hypot(q.x-player.x,q.y-player.y).toFixed(2);}catch(_){}
 try{if(src.combatProfile)c.combatProfile=typeof structuredClone==='function'?structuredClone(src.combatProfile):JSON.parse(JSON.stringify(src.combatProfile));}catch(_){c.combatProfile={...src.combatProfile};}
 for(const k of Object.keys(c))if(/^rc1\d\d|^r208|^r363Seen|Cache/.test(k))delete c[k];
 Object.assign(c,{x:q.x,y:q.y,homeX:q.x,homeY:q.y,hp:Math.max(1,c.maxHp*SPAWN_HP),deadRecorded:false,deadAt:null,spawnState:'active',nav:[],attack:null,aim:null,state:'idle',stuck:0,flash:0,tell:0,rangedWindup:0,
  storyPreparedCast150:null,personaPreparedCast150:null,personaPendingShots150:[],graceUntil:G(()=>time,0)+.6,cd:1,phaseStage:'active'});
 if(typeof c.facing==='number'&&G(()=>player,null))c.facing=Math.sign(player.x-q.x)||c.facing;return c;}
function spawn(r,n){const src=templates(r);if(!src.length)return 0;let made=0;
 for(let i=0;i<n&&spawned<SPAWN_CAP;i++){const q=spot(r,i);if(!q)break;const c=cloneOf(src[(serial+i)%src.length],q);r.enemies.push(c);spawned++;made++;stats.respawned++;
  try{if(typeof fx==='function')fx('burst',q.x,q.y,{asset:G(()=>VFX.burst,undefined),size:1.1,life:.5});}catch(_){}}
 return made;}
function canRespawn(r,ph){return prefs.respawn&&isRoute(ph)&&voiceLeft()>SPAWN_STOP&&spawned<SPAWN_CAP;}
function respawnTick(r,ph){const key=(r.id||'')+':'+(isRoute(ph)?'route':ph);if(key!==spawnSeg){spawnSeg=key;spawned=0;lastSpawn=-1e9;}
 if(!canRespawn(r,ph))return;const t=now();if(t-lastSpawn<SPAWN_GAP)return;
 const n=(r.enemies||[]).filter(field).length;if(n>=KEEP)return;if(spawn(r,Math.min(BATCH,KEEP-n)))lastSpawn=t;}
function active(){return cinemaOn()&&solo()&&G(()=>started,false)&&!G(()=>loading,false);}
let curPh=null;
setInterval(()=>{try{if(!active()){m=1;addM=1;curPh=null;return;}const r=G(()=>room,null),ph=phaseOf(r);curPh=ph;if(!ph){m=1;addM=1;return;}storyTick(r,ph);paceTick(r,ph);respawnTick(r,ph);}catch(e){fail(e);}},TICK);
// 마지막 일반 몹을 잡는 순간: 음성이 남았으면 먼저 2마리를 불러내 R78 이 길 정리 끝으로 넘기지 않게 한다.
try{if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){try{if(e&&!e.deadRecorded&&field(e)&&active()){const r=G(()=>room,null),ph=phaseOf(r);
   if(r&&(r.enemies||[]).includes(e)&&canRespawn(r,ph)&&!(r.enemies||[]).some(o=>o!==e&&field(o))){respawnTick(r,ph);if(spawn(r,2)){stats.saves++;lastSpawn=now();}}}}catch(err){fail(err);}
  return base.call(this,e,...a);};}}catch(e){fail(e);}
// 적이 받는 피해에 배율을 건다(영화 모드 + R78 구역 + 지금 단계의 적만).
function mulFor(r,e){if(!curPh||!(r.enemies||[]).includes(e)||!alive(e))return 1;
 if(isRoute(curPh))return e.boss?1:m;
 if(curPh==='boss'){if(major(e))return m;if(summoned(e))return addM;}return 1;}
try{if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,...a){try{if((m!==1||addM!==1)&&Number.isFinite(value)&&value>0&&curPh&&active()){const r=G(()=>room,null);const k=r?mulFor(r,e):1;if(k!==1){value=value*k;stats.hits++;}}}catch(err){fail(err);}return base.call(this,e,value,...a);};}}catch(e){fail(e);}
function set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.pace){m=1;addM=1;}return{...prefs};}
window.__STORYWORLD_CINEMA_SYNC_R384__=Object.freeze({revision:REV,MIN_M,MAX_M,DONE_M,B_MIN,B_MAX,TAIL,KEEP,SPAWN_CAP,set,factor:()=>m,addFactor:()=>addM,
 inspect:()=>({revision:REV,prefs:{...prefs},active:active(),phase:curPh,factor:+m.toFixed(3),addFactor:+addM.toFixed(3),rate:+rate.toFixed(2),last,spawned,stats:{...stats},lastError})});
})();
