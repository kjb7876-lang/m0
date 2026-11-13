/* R949 윤서하 확률 발동 특수 패시브 '겹친 시간' (사용자 2026-11-12 13:21Z "서하 영웅 확률발동 특수 패시브 스킬 1. 영웅들 7초간 소환 서하스텟에 비례해서 적당히 스킬사용
 *  2. 아르벨리아 7초간 소환 아르벨로아 보스몹그대로 대려와서 스킬사용하면됨 소환몹임 3. 7초간 서하에게 잔상이 생겨나며 곧곧에 시계들과 톱니바퀴가 돌아가고 적에게 시간폭발이 일어남").
 * 키는 늘리지 않는다. 서하 본인의 타격이 적에게 들어갈 때 0.35초에 한 번 굴려 5%(사몽 발현 중 배율, 최대 20%)로 발동하고, 한 번 발동하면 7초 이어진다. 발동한 순간부터 14초는 다시 굴리지 않는다.
 *  ③ 시간 붕괴(50%): 7초 동안 서하 뒤로 잔상이 남고, 둘레 곳곳에 시계와 톱니바퀴가 돌며, 0.48초마다(14번) 7.5칸 안 적 최대 3곳에 시계가 감겼다가 시간 폭발(1.3칸, 공격력 0.45배, 한 박자에 같은 적은 한 번).
 *  ① 평행세계 소집(30%): 다른 영웅 셋이 7초 동안 서하 곁에 나타난다. 영웅마다 조종 영웅과 같은 모양의 '몸'을 두고 그 몸을 엔진의 player 자리에 잠깐 끼운 채
 *     엔진 기본 공격·고유기(Q)·본편 W·E·R 과 영웅 그리기를 그대로 부른다(R720 배치 영웅과 같은 길, 몸에 r720Ally 표식 → 영웅별 그리기 상태가 몸마다 따로).
 *     레벨·패시브·스킬 단계는 서하 것을 함께 쓰고(서하 스탯 비례), 그 몸으로 계산한 공격력은 0.25배. 기본 공격 간격 1.3배, 스킬은 1.6초에 한 번. 적은 소환 영웅을 노리지 않는다.
 *  ② 수문장 아르벨리아(20%): 카이로 02 의 보스 '아르벨리아, 유예의 수문장'(kair-great-03)을 그 그림 그대로 아군 소환수로 7초 부른다. 보스전의 패턴 넷을 차례로 한 번씩 쓴다:
 *     단일 초침 예고(7.2칸 직선, 2.2배) → 되감긴 시간로(자기 둘레 2.45~6.15칸 고리, 0.9배 두 번) → 시간조형 염동역행(적 자리 2칸 원, 0.6배 네 번) → 유예의 열린 시간방(서하 둘레 2.4칸 밖 9칸까지 1.0배 + 0.7초 지연).
 *     그 지역에 진짜 아르벨리아가 살아 있으면(카이로 02 보스전) 부르지 않고 시간 붕괴로 바꾼다.
 * 안전: 소환수는 room.enemies 에 넣지 않는다 → 보스 수·처치 판정·승리 조건·저장(방의 적 목록)에 들어가지 않는다. 피해는 엔진 hitEnemy 한 길로만 준다(처치·경험치·보스 처치 판정은 엔진 규칙 그대로).
 *  지역 이동·서사 장면 시작·서하 쓰러짐·끄기 때 즉시 걷어 낸다. 협동 모드에서는 발동하지 않는다. 처치 경험치는 조종 영웅에게 간다.
 * 상태는 영웅 몸(player 객체)마다 따로 둔다(생존 모드 배치 영웅 R720 이 서하 몸으로 공격할 때도 그 몸의 대기를 쓴다).
 * 그림: 시계·깨짐·가속 시계·시공 틈은 기존 Dots 시트(R564, CX-0059S)를 다시 쓰고, 톱니바퀴·초침 줄·시간로 고리·시간방 물결은 코드로 그린 임시 연출이다(최종은 Dots 프레임 시트 요청 대상).
 * 끄기: localStorage['storyworld.r949.epoch']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SEOHA_EPOCH_R949__)return;
const REV='R949-epoch-1',KEY='storyworld.r949.epoch',HERO='seoha';
const CHANCE=.05,CHANCE_MAX=.2,ROLL_GAP=.35,DUR=7,ICD=14,MAX_ACTS=2;
const G971=(h,a)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.chances(h,a);return Array.isArray(v)&&v.length===a.length&&v.every(x=>Number.isFinite(x)&&x>=0)?v:a;}catch(_){return a;}},D971=(h,s)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.cooldown(h,s);return Number.isFinite(v)&&v>0?v:s;}catch(_){return s;}};/* R971 특수 패시브 강화(0단계=원래 값) */
const WEIGHTS=[['collapse',.5],['heroes',.3],['arbelia',.2]];
// ③ 시간 붕괴
const COL_PULSES=14,COL_PULSE0=.15,COL_GAP=.48,COL_WIND=.35,COL_R=7.5,COL_SPOTS=3,COL_BOOM_R=1.3,COL_K=.45,COL_STUN=.25,COL_BOOM_T=.45,GH_GAP=.14,GH_LIFE=.45,GH_MAX=6,SPOT_GAP=.4,SPOT_LIFE=2.4,SPOT_MAX=7;
// ① 평행세계 소집
const HERO_N=3,HERO_K=.25,HERO_PACE=1.3,HERO_BEAT=1.6,HERO_OFF=1.5,HERO_LEASH=3.2,HERO_FOLLOW=7,HERO_SPEED=3.6;
// ② 수문장 아르벨리아
const ARB_ID='kair-great-03',ARB_NAME='아르벨리아',ARB_SIZE=2.05,ARB_OFF=1.6,ARB_FOLLOW=3.2,ARB_SPEED=3.4,ARB_AT=[.6,2.2,3.8,5.4],ARB_WIND=.45,ARB_AIM_R=9,
 ARB_LINE={len:7.2,w:.86,k:2.2},ARB_DONUT={r0:2.45,r1:6.15,k:.9,reps:2,gap:.58},ARB_CIRCLE={r:2,k:.6,reps:4,gap:.29},ARB_ROOM={safe:2.4,r:9,k:1.0,delay:.7};
const ARB_ORDER=['line','donut','circle','room'];
const ARB_ART={idle:'assets/generated-v31224/actors-normalized/b9b65cd61430_arvelia_delay_archon.webp',windup:'assets/generated-v31224/actors-normalized/a5b3ff549ec2_arvelia_delay_archon_windup.webp',
 attack:'assets/generated-v31224/actors-normalized/822930c614eb_arvelia_delay_archon_attack.webp',leave:'assets/generated-v31224/actors-normalized/44fa887e7bcc_arvelia_delay_archon_transition.webp'};
const ARB_ORB='assets/vfx/v31323/boss/kair-great-03/projectile-stasis.webp';
const NAMES=Object.freeze({passive:'겹친 시간',heroes:'평행세계 소집',arbelia:'수문장 아르벨리아',collapse:'시간 붕괴',line:'단일 초침 예고',donut:'되감긴 시간로',circle:'시간조형 염동역행',room:'유예의 열린 시간방'});
const stats={rolls:0,procTotal:0,procs:{heroes:0,arbelia:0,collapse:0},fallbacks:0,hits:0,pulses:0,explosions:0,ghosts:0,ghostPeak:0,heroCasts:{basic:0,q:0,w:0,e:0,r:0},heroHits:0,arbOrder:[],arbReps:{line:0,donut:0,circle:0,room:0},cancels:0,draws:0,bodyDraws:0,errors:0,lastError:null};
const owners=new WeakMap();let ownerCount=0;
let acts=[],blinks=[],lastRoom=null,lastT=null,prefAt=-1e9,prefOn=true,inner=0,forced=null,rng=null,trio=null,asked={};
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.stack||e).slice(0,300);};
const rnd=()=>{try{return rng?rng():Math.random();}catch(_){return Math.random();}};
const fin=Number.isFinite,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const t=T();if(t<prefAt||t-prefAt>=1){prefAt=t;prefOn=readOn();}return prefOn;}
function P(){try{return typeof player==='object'&&player?player:null;}catch(_){return null;}}
function curRoom(){try{return typeof room!=='undefined'?room:null;}catch(_){return null;}}
function sceneNow(){try{return typeof storyScene!=='undefined'&&!!storyScene;}catch(_){return false;}}
function blockedNow(){try{if(sceneNow())return true;if(typeof modal!=='undefined'&&modal)return true;if(typeof loading!=='undefined'&&loading)return true;}catch(_){}return false;}
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
function major(e){try{if(typeof majorActor3==='function')return !!majorActor3(e);}catch(_){}return !!(e&&(e.boss||e.midboss));}
function hiddenActor(e){return !e||e.hp<=0||e.dead||e.visible===false||e.disabled===true||['hidden','inactive','disabled','despawned'].includes(e.spawnState);}
function enemiesNow(){try{return typeof liveEnemies==='function'?liveEnemies().filter(e=>!hiddenActor(e)):[];}catch(_){return [];}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function canHit(e){try{return typeof damageable3==='function'?damageable3(e):true;}catch(_){return true;}}
function wallAt(x,y,r){try{return typeof blocked==='function'?!!blocked(x,y,r||.27):false;}catch(_){return false;}}
function aim(){try{return typeof storyAim22==='function'?storyAim22():0;}catch(_){return 0;}}
function surge(kind,v){try{const g=window.__STORYWORLD_SAMONG_SURGE_R571__;if(g&&typeof g[kind]==='function'&&(!g.active||g.active())){const r=Number(g[kind](v));if(fin(r)&&r>0)return r;}}catch(_){}return v;}
function play(k){try{if(typeof sound==='function')sound(k);}catch(_){}}
function say(s){try{if(typeof toast==='function')toast(s,1.8);}catch(_){}}
function shakeBy(v){try{if(typeof shake==='number')shake=Math.max(shake,v);}catch(_){}}
function walk(a,dx,dy){try{if(typeof moveActor==='function')moveActor(a,dx,dy,.27);else{a.x+=dx;a.y+=dy;}}catch(err){fail(err);}}
function ready(p){try{return typeof readyImage==='function'&&!!readyImage(p);}catch(_){return false;}}
function ask(paths,key){const n=Date.now();if(n-(asked[key]||-1e9)<1500)return;asked[key]=n;try{if(typeof ensureImages==='function')Promise.resolve(ensureImages(paths)).catch(()=>{});}catch(err){fail(err);}}
function img(p){try{const g=typeof readyImage==='function'?readyImage(p):null;if(g&&g.image)return g.image;ask([p],p);}catch(err){fail(err);}return null;}
// 이 패시브가 직접 주는 피해(시간 폭발·아르벨리아): 엔진 hitEnemy 한 길. 다시 굴리지 않게 inner 로 표시한다.
function deal(e,v,kind){if(!e||hiddenActor(e)||!canHit(e)||!(v>0))return false;inner++;try{const r=hitEnemy(e,v,{kind:'r949-'+kind,friendly:true,owner:'hero',sourceHero:HERO,r949:true});if(r!==false)stats.hits++;return r;}catch(err){fail(err);return false;}finally{inner--;}}
function stateOf(o){let s=owners.get(o);if(!s){s={lastRoll:-1e9,readyAt:-1e9};owners.set(o,s);ownerCount++;}return s;}
function ownerOk(o){return !!o&&!(o.hp<=0);}

// ── 소환 영웅의 몸(R720 과 같은 길): 조종 영웅 player 의 사본. 엔진 함수를 부르는 동안만 player 자리에 끼운다 ──
const SHARED=['upgrades','progressionR62'],TIMERS=['attackCD','attackAnim','skillAnim','blinkCD','specialCD','invincible','parry','ego','egoCD','samong','samongCD','grazeGuard','counter'];
const cur=[];let realP=null;
const curS=()=>cur.length?cur[cur.length-1]:null;
function heroIds(){try{return Object.keys(HEROES);}catch(_){return [];}}
function heroReady(id){try{return ready(heroArt[id].idle.front);}catch(_){return false;}}
function heroLoad(id){try{ask(heroPaths(id),'hero:'+id);}catch(err){fail(err);}}
function mkBody(id,s){const p=P();if(!p||p.r720Ally)return null;const b={};
 for(const k of Object.keys(p)){const v=p[k];if(v&&typeof v==='object'&&!SHARED.includes(k)){try{b[k]=structuredClone(v);}catch(_){b[k]=Array.isArray(v)?[]:{};}}else b[k]=v;}
 Object.defineProperty(b,'r720Ally',{value:true,enumerable:false});Object.defineProperty(b,'r949Summon',{value:true,enumerable:false});
 b.hero=id;b.x=s.x;b.y=s.y;b.direction='front';b.combo=0;for(const k of TIMERS)b[k]=0;b.attackCD=.35;b.specialCD=0;b.resonance=0;b.shield=0;b.guard=false;b.pending=false;b.moving=false;b.visible=true;b.disabled=false;b.visualLiftPx=0;b.storyWER={ready:{},buffs:{}};
 return b;}
function refresh(b,p){for(const k of SHARED)b[k]=p[k];b.level=p.level;b.hp=Math.max(1,+b.hp||0,100);b.ego=0;b.samong=0;b.resonance=0;b.pending=false;}
const validS=s=>!!s&&!!s.body&&acts.some(x=>x.kind==='heroes'&&x.summons.includes(s));
// 몸 s.body 를 player 로 끼우고 fn 을 돈다. 끝나면(오류여도) 반드시 조종 영웅으로 되돌린다. 엔진의 겨눔·이동 명령(target·command·route)도 몸마다 바꿔 끼운다.
function as(s,fn){const b=s&&s.body;if(!b)return undefined;if(cur.length){cur.push(s);const prev=player;player=b;try{return fn();}finally{player=prev;cur.pop();}}
 const real=player;if(!real||real.r720Ally)return undefined;realP=real;refresh(b,real);
 let sT,sC,sR,sw=false;try{sT=target;sC=command;sR=route;target=b.targetR949||null;command=null;route=[];sw=true;}catch(_){}
 cur.push(s);player=b;try{return fn();}finally{player=real;cur.pop();if(sw){try{b.targetR949=target||null;target=sT;command=sC;route=sR;}catch(_){}}}}
const big=e=>!!(e&&(e.boss||e.elite||e.major));
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
function tryQ(){const b=player,R=window.__STORYWORLD_HANDO_FINAL_R49__;if(b.specialCD>0||!R?.autoSpecial)return false;const cd=b.specialCD;R.autoSpecial();return b.specialCD>cd;}
function trySlot(slot){const b=player,R=window.__STORYWORLD_HANDO_FINAL_R49__,W=window.__STORYWORLD_WER__;if(!R||!W)return false;const t=G(()=>R.autoTarget(slot),null);if(!t)return false;
 if(slot==='e'){const base=G(()=>HEROES[b.hero].range,0);if(Math.hypot(t.x-b.x,t.y-b.y)<base*.7)return false;}
 if(slot==='r'&&!big(t)){const range=G(()=>R.rangeFor('r'),0);if(!(range>0)||G(()=>room.enemies.filter(e=>R.eligible(e,range)).length,0)<2)return false;}
 if(G(()=>W.cast(slot,true),false)===true)return true;
 const M=window.__STORYWORLD_MICHAELA_R247__;if((slot==='w'||slot==='e')&&b.hero==='michaela'&&G(()=>M.on(),false))return G(()=>M.fire(slot,true),false)===true;
 return false;}
function heroAct(s,t){const b=player,cd=b.attackCD;if(!(cd>0)){basicAttack();if(b.attackCD>cd){b.attackCD*=HERO_PACE;stats.heroCasts.basic++;}}
 if(t>=s.beat){s.beat=t+HERO_BEAT;if(tryQ())stats.heroCasts.q++;else for(const k of ['r','w','e'])if(trySlot(k)){stats.heroCasts[k]++;break;}}}

// ── 방 소품(깊이 정렬에 끼워 그리기 — R720 과 같은 길). 그림 경로가 없어 엔진·다른 덧씌우기의 조형물 처리에는 걸리지 않는다 ──
function mkProp(kind,ref,i){return {id:'r949:'+kind+':'+i+':'+T().toFixed(2),r949Prop:true,r949Kind:kind,r949Ref:ref,x:ref.x,y:ref.y,solid:false,visible:true,autoTargetEligible6:false,label:kind==='arbelia'?ARB_NAME:'소환 영웅',height:66};}
function addProp(x,p){const r=x.room;try{if(r&&Array.isArray(r.props)&&!r.props.includes(p))r.props.push(p);}catch(err){fail(err);}}
function dropProps(x){const r=x.room;try{if(r&&Array.isArray(r.props)){for(let i=r.props.length-1;i>=0;i--){const p=r.props[i];if(p&&p.r949Prop&&x.props.includes(p))r.props.splice(i,1);}}}catch(err){fail(err);}x.props=[];}
function syncProps(x){const r=curRoom();if(!r||r!==x.room||!Array.isArray(r.props))return;for(const p of x.props){p.x=p.r949Ref.x;p.y=p.r949Ref.y;if(!r.props.includes(p))r.props.push(p);}}
function blinkAt(x,y,k){blinks.push({x,y,t0:T(),k:k||1});if(blinks.length>10)blinks.shift();}
function freeSpot(o,ang,r){for(const d of [0,.6,-.6,1.2,-1.2,2.2,-2.2,Math.PI]){for(const rr of [r,r*.6]){const x=o.x+Math.cos(ang+d)*rr,y=o.y+Math.sin(ang+d)*rr;if(!wallAt(x,y,.3))return {x,y};}}return {x:o.x,y:o.y};}

// ── 발동 ──
function others(){const real=P(),skip=new Set([HERO,real&&!real.r720Ally?real.hero:null]);return heroIds().filter(k=>!skip.has(k));}
function pickTrio(){const ids=others();for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return ids.slice(0,HERO_N);}
function preload(){try{ask([...Object.values(ARB_ART),ARB_ORB],'arb');if(!trio||!trio.length)trio=pickTrio();for(const id of trio)if(!heroReady(id))heroLoad(id);}catch(err){fail(err);}}
function realArbelia(){try{const r=curRoom();return !!(r&&Array.isArray(r.enemies)&&r.enemies.some(e=>e&&e.hp>0&&(e.nativeId===ARB_ID||String(e.id||'').endsWith(ARB_ID))));}catch(_){return false;}}
function dirTo(o,tg){let ux=0,uy=0;if(tg){ux=tg.x-o.x;uy=tg.y-o.y;}const L=Math.hypot(ux,uy);if(!(L>1e-6)){const a=aim();return {ux:Math.cos(a),uy:Math.sin(a),a};}return {ux:ux/L,uy:uy/L,a:Math.atan2(uy,ux)};}
function ap(){try{return typeof attackPower==='function'?Number(attackPower())||0:0;}catch(_){return 0;}}
function startCollapse(base){return {...base,kind:'collapse',pulses:0,marks:[],spots:[],ghostAt:[],lastGhost:-1e9,lastSpot:-1e9,gx:base.owner.x,gy:base.owner.y,flip:1};}
function startArbelia(base,d){const o=base.owner;if(realArbelia())return null;if(!Object.values(ARB_ART).every(ready)){ask([...Object.values(ARB_ART),ARB_ORB],'arb');return null;}
 const p=freeSpot(o,d.a-Math.PI/2,ARB_OFF),ent={id:'r949:arbelia',name:ARB_NAME,x:p.x,y:p.y,flip:false,pose:'idle',poseUntil:-1e9};
 const x={...base,kind:'arbelia',ent,casts:[],next:0};x.props=[mkProp('arbelia',ent,0)];addProp(x,x.props[0]);blinkAt(ent.x,ent.y,1.7);return x;}
function startHeroes(base,d){if(typeof basicAttack!=='function'||typeof drawHero!=='function')return null;const real=P();if(!real||real.r720Ally)return null;/* 조종 중인 서하만 영웅을 부른다(배치된 서하 몸은 시간 붕괴로) */
 if(!trio||!trio.length)trio=pickTrio();const pool=[...trio,...others().filter(k=>!trio.includes(k))],pickd=[];for(const id of pool){if(pickd.length>=HERO_N)break;if(heroReady(id))pickd.push(id);else heroLoad(id);}
 if(!pickd.length)return null;const o=base.owner,x={...base,kind:'heroes',summons:[]};x.props=[];
 pickd.forEach((id,i)=>{const ang=d.a+Math.PI+(i-(pickd.length-1)/2)*2.0,ox=Math.cos(ang)*HERO_OFF,oy=Math.sin(ang)*HERO_OFF,p=freeSpot(o,ang,HERO_OFF),s={hero:id,x:p.x,y:p.y,ox,oy,beat:base.t0+.8+i*.35,body:null,idx:i};
  s.body=mkBody(id,s);if(!s.body)return;x.summons.push(s);const pr=mkProp('hero',s,i);x.props.push(pr);addProp(x,pr);blinkAt(s.x,s.y,1);});
 if(!x.summons.length){dropProps(x);return null;}trio=null;return x;}
function fire(kind,o,tg){const t=T(),d=dirTo(o,tg),base={owner:o,t0:t,until:t+DUR,power:ap(),room:curRoom(),props:[],seed:(stats.procTotal*7919)%360};let x=null;
 try{if(kind==='arbelia')x=startArbelia(base,d);else if(kind==='heroes')x=startHeroes(base,d);}catch(err){fail(err);x=null;}
 if(!x){if(kind!=='collapse')stats.fallbacks++;kind='collapse';x=startCollapse(base);}
 stats.procTotal++;stats.procs[kind]++;acts.push(x);play('r546Sp_'+HERO);say(NAMES.passive+' · '+NAMES[kind]);return x;}
function pick(){if(forced){const f=forced;forced=null;return f;}let r=rnd()*WEIGHTS.reduce((n,w)=>n+w[1],0);for(const [k,w] of WEIGHTS){if(r<w)return k;r-=w;}return 'collapse';}
function roll(e){const o=P();if(!o||o.hero!==HERO||o.hp<=0||blockedNow()||!solo())return;const s=stateOf(o),t=T();if(t<s.readyAt||t-s.lastRoll<ROLL_GAP)return;s.lastRoll=t;stats.rolls++;preload();
 if(acts.length>=MAX_ACTS||acts.some(x=>x.owner===o))return;
 if(!forced&&!(rnd()<Math.min(CHANCE_MAX,surge('chance',G971(HERO,[CHANCE])[0]))))return;const kind=pick();s.readyAt=t+D971(HERO,ICD);lastRoom=curRoom();fire(kind,o,e&&fin(e.x)?{x:e.x,y:e.y}:null);}
// 서하 본인 타격만(다른 영웅·협동 동료·적·이 패시브 자신의 피해·소환 영웅이 쏜 탄 제외).
function mine(src){const o=P();if(!o||o.hero!==HERO||o.r949Summon)return false;if(src&&typeof src==='object'){if(src.r949||src.r949Summon||src.sourceHero&&src.sourceHero!==HERO)return false;if(src.coopIdR62||src.ally||src.owner==='ally'||src.owner==='enemy'||src.hostile)return false;}return true;}

// ── 엔진 연결 ──
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){const r=base.call(this,e,value,source,...a);
 try{if(cur.length){if(r!==false)stats.heroHits++;}else if(!inner&&r!==false&&e&&on()&&mine(source))roll(e);}catch(err){fail(err);}return r;};}
// 소환 영웅 몸으로 도는 동안: 공격력은 0.25배(서하 레벨·패시브로 계산된 값 기준), 지연 작업은 같은 몸으로 다시 끼워 돌리고, 쏜 탄에는 표식을 붙이고, 처치 경험치는 조종 영웅에게 준다.
if(typeof attackPower==='function'){const base=attackPower;attackPower=function(...a){const v=base.apply(this,a);return cur.length&&fin(v)?v*HERO_K:v;};}
if(typeof delay==='function'){const base=delay;delay=function(sec,fn,...r){const s=curS();if(s&&typeof fn==='function'){const b=s.body,f=fn;fn=function(...x){if(!validS(s)||s.body!==b)return;return as(s,()=>f.apply(this,x));};}return base.call(this,sec,fn,...r);};}
if(typeof makeShot==='function'){const base=makeShot;makeShot=function(x,y,ang,spd,dmg,opt,...r){if(cur.length)opt={...(opt||{}),r949Summon:true};return base.call(this,x,y,ang,spd,dmg,opt,...r);};}
if(typeof gainXP==='function'){const base=gainXP;gainXP=function(...a){if(cur.length&&realP&&player!==realP){const b=player;player=realP;try{return base.apply(this,a);}finally{player=b;}}return base.apply(this,a);};}

// ── 끝내기·걷어 내기 ──
function end(x,why){if(x.ended)return;x.ended=true;if(why!=='time')stats.cancels++;
 try{if(x.kind==='heroes')for(const s of x.summons){if(why==='time')blinkAt(s.x,s.y,1);s.body=null;}if(x.kind==='arbelia'&&why==='time')blinkAt(x.ent.x,x.ent.y,1.7);}catch(err){fail(err);}
 dropProps(x);}
function cancelAll(){for(const x of acts)end(x,'cancel');acts=[];blinks=[];}

// ── ③ 시간 붕괴 ──
function ghost(o,gx,gy){try{const a=typeof heroArt!=='undefined'?heroArt[HERO]:null,kind=o.attackAnim>0?'attack':o.skillAnim>0?'skill':'dash',dir=o.direction||'front',asset=a&&a[kind]&&(a[kind][dir]||a[kind].front);if(!asset||!fxBase)return false;
 fxBase('ghost',gx,gy,{asset,life:GH_LIFE,size:1,r949:true});return true;}catch(err){fail(err);return false;}}
function stepCollapse(x,t,dt){const o=x.owner;
 // 잔상: 걷는 중이면 지나온 자리에, 서 있으면 좌우로 번갈아 반 칸 어긋난 자리에(겹친 시간의 서하)
 x.ghostAt=x.ghostAt.filter(g=>t-g<GH_LIFE);
 if(t-x.lastGhost>=GH_GAP&&x.ghostAt.length<GH_MAX){const moved=Math.hypot(o.x-x.gx,o.y-x.gy)>.12;x.flip=-x.flip;const a=aim()+Math.PI/2;
  const okG=ghost(o,moved?x.gx:o.x+Math.cos(a)*.45*x.flip,moved?x.gy:o.y+Math.sin(a)*.45*x.flip);
  x.lastGhost=t;x.gx=o.x;x.gy=o.y;if(okG||!fxBase){x.ghostAt.push(t);stats.ghosts++;stats.ghostPeak=Math.max(stats.ghostPeak,x.ghostAt.length);}}
 // 곳곳의 시계·톱니바퀴(장식): 서하 둘레 2~5칸에 0.4초마다 하나, 2.4초 머문다
 x.spots=x.spots.filter(s=>t-s.t0<SPOT_LIFE);
 if(t-x.lastSpot>=SPOT_GAP&&x.spots.length<SPOT_MAX){x.lastSpot=t;const n=x.spotN=(x.spotN||0)+1,an=x.seed*.0174+n*2.399,r=2+((n*37)%30)/10;x.spots.push({x:o.x+Math.cos(an)*r,y:o.y+Math.sin(an)*r,t0:t,gear:n%2===0,size:.85+((n*13)%5)*.12,dir:n%4<2?1:-1});}
 // 박자: 가까운 적부터 돌아가며 최대 3곳에 시계가 감기고, 0.35초 뒤 그 자리에서 시간 폭발
 while(x.pulses<COL_PULSES&&t-x.t0>=COL_PULSE0+x.pulses*COL_GAP-1e-9){const id=x.pulses++;stats.pulses++;
  const foes=enemiesNow().filter(e=>dist(e,o)<=COL_R).sort((p,q)=>dist(p,o)-dist(q,o)),n=Math.min(COL_SPOTS,foes.length);
  for(let i=0;i<n;i++){const e=foes[(id+i)%foes.length];x.marks.push({x:e.x,y:e.y,t0:t,pulse:id,boom:null,decor:false});}
  if(!n){const an=id*2.399+x.seed;x.marks.push({x:o.x+Math.cos(an)*2.4,y:o.y+Math.sin(an)*2.4,t0:t,pulse:id,boom:null,decor:true});}}
 x.hitBy=x.hitBy||new Map();
 for(const m of x.marks){if(m.boom!=null||t-m.t0<COL_WIND-1e-9)continue;m.boom=t;stats.explosions++;if(m.decor)continue;
  for(const e of enemiesNow()){if(dist(e,m)>COL_BOOM_R+(e.radius||0)||x.hitBy.get(e)===m.pulse)continue;x.hitBy.set(e,m.pulse);deal(e,x.power*COL_K,'collapse');
   if(!major(e)&&e.hp>0&&fin(e.cd))e.cd=Math.max(e.cd,COL_STUN);}}
 x.marks=x.marks.filter(m=>m.boom==null||t-m.boom<COL_BOOM_T);}

// ── ② 수문장 아르벨리아 ──
function nearestTo(p,r){let b=null,bd=r;for(const e of enemiesNow()){const d=dist(e,p);if(d<bd){bd=d;b=e;}}return b;}
function faceTo(ent,p){if(p)ent.flip=(p.x-p.y)<(ent.x-ent.y);}
function arbCast(x,kind,t){const o=x.owner,ent=x.ent,tg=nearestTo(o,ARB_AIM_R),c={kind,t0:t,rep:0,done:false};stats.arbOrder.push(kind);
 if(kind==='line'){const d=tg?dirTo(ent,tg):dirTo(ent,{x:ent.x+Math.cos(aim()),y:ent.y+Math.sin(aim())});c.x=ent.x;c.y=ent.y;c.ux=d.ux;c.uy=d.uy;c.reps=1;c.gap=0;faceTo(ent,{x:ent.x+d.ux,y:ent.y+d.uy});}
 else if(kind==='donut'){c.x=ent.x;c.y=ent.y;c.reps=ARB_DONUT.reps;c.gap=ARB_DONUT.gap;}
 else if(kind==='circle'){const p=tg||{x:o.x+Math.cos(aim())*3,y:o.y+Math.sin(aim())*3};c.x=p.x;c.y=p.y;c.reps=ARB_CIRCLE.reps;c.gap=ARB_CIRCLE.gap;faceTo(ent,p);}
 else{c.x=o.x;c.y=o.y;c.reps=1;c.gap=0;}
 ent.pose='windup';ent.poseUntil=t+ARB_WIND;x.casts.push(c);}
function arbStrike(x,c,t){const ent=x.ent,p=x.power;stats.arbReps[c.kind]++;c.hitAt=t;ent.pose='attack';ent.poseUntil=t+.35;shakeBy(c.kind==='circle'?1.5:3);play('r546Atk_'+HERO);
 if(c.kind==='line'){for(const e of enemiesNow()){const px=e.x-c.x,py=e.y-c.y,along=px*c.ux+py*c.uy,off=Math.abs(px*c.uy-py*c.ux),r=e.radius||0;if(along<-r||along>ARB_LINE.len+r||off>ARB_LINE.w/2+r)continue;deal(e,p*ARB_LINE.k,'arb-line');}}
 else if(c.kind==='donut'){for(const e of enemiesNow()){const d=dist(e,c),r=e.radius||0;if(d<ARB_DONUT.r0-r||d>ARB_DONUT.r1+r)continue;deal(e,p*ARB_DONUT.k,'arb-donut');}}
 else if(c.kind==='circle'){for(const e of enemiesNow()){if(dist(e,c)>ARB_CIRCLE.r+(e.radius||0))continue;deal(e,p*ARB_CIRCLE.k,'arb-circle');}
  c.px=c.x;c.py=c.y;const tg=nearestTo(x.owner,ARB_AIM_R);if(tg&&c.rep+1<c.reps){c.x=tg.x;c.y=tg.y;faceTo(ent,tg);}}
 else{for(const e of enemiesNow()){const d=dist(e,c);if(d<=ARB_ROOM.safe||d>ARB_ROOM.r+(e.radius||0))continue;deal(e,p*ARB_ROOM.k,'arb-room');if(!major(e)&&e.hp>0&&fin(e.cd))e.cd=Math.max(e.cd,ARB_ROOM.delay);}}}
function stepArbelia(x,t,dt){const o=x.owner,ent=x.ent;
 if(x.next<ARB_AT.length&&t-x.t0>=ARB_AT[x.next]-1e-9){arbCast(x,ARB_ORDER[x.next%ARB_ORDER.length],t);x.next++;}
 for(const c of x.casts){while(!c.done&&t-c.t0>=ARB_WIND+c.rep*c.gap-1e-9){arbStrike(x,c,t);c.rep++;if(c.rep>=c.reps)c.done=true;}}
 x.casts=x.casts.filter(c=>!c.done||t-c.hitAt<.5);
 if(t>=ent.poseUntil)ent.pose=x.until-t<.45?'leave':'idle';
 const d=dist(ent,o);if(d>HERO_FOLLOW){const p=freeSpot(o,aim()-Math.PI/2,ARB_OFF);blinkAt(ent.x,ent.y,1.7);ent.x=p.x;ent.y=p.y;blinkAt(ent.x,ent.y,1.7);}
 else if(d>ARB_FOLLOW&&ent.pose==='idle'){const s=Math.min(ARB_SPEED*dt,d-ARB_FOLLOW*.6);walk(ent,(o.x-ent.x)/d*s,(o.y-ent.y)/d*s);faceTo(ent,o);}}

// ── ① 평행세계 소집 ──
function stepHeroes(x,t,dt){const o=x.owner;
 for(const s of x.summons){const b=s.body;if(!b)continue;try{const h=HEROES[s.hero]||{},range=+h.range||3,melee=!!(h.melee||h.type==='blade'||h.type==='heavy'),an={x:o.x+s.ox,y:o.y+s.oy},px=s.x,py=s.y;
   if(fin(b.x)&&fin(b.y)&&Math.hypot(b.x-s.x,b.y-s.y)<6){s.x=b.x;s.y=b.y;}/* 돌진 스킬로 몸이 움직였으면 따라간다 */
   if(dist(s,o)>HERO_FOLLOW){const p=freeSpot(o,Math.atan2(s.oy,s.ox),HERO_OFF);blinkAt(s.x,s.y,1);s.x=p.x;s.y=p.y;blinkAt(s.x,s.y,1);}
   let tg=null,best=Infinity;for(const e of enemiesNow()){if(dist(e,an)>HERO_LEASH+range)continue;const d=dist(e,s);if(d<best){best=d;tg=e;}}
   let gx=an.x,gy=an.y,stop=.12;if(tg){gx=tg.x;gy=tg.y;stop=melee?Math.min(range*.8,1.4):range*.9;}
   const dx=gx-s.x,dy=gy-s.y,d=Math.hypot(dx,dy);let moved=false;if(d>stop+1e-6){const k=Math.min(HERO_SPEED*dt,d-stop)/d;walk(s,dx*k,dy*k);}
   const lx=s.x-an.x,ly=s.y-an.y,l=Math.hypot(lx,ly);if(l>HERO_LEASH){const k=Math.min(HERO_SPEED*dt*1.5,l-HERO_LEASH)/l;walk(s,-lx*k,-ly*k);}
   const mx=s.x-px,my=s.y-py,ml=Math.hypot(mx,my);moved=ml>1e-4;b.x=s.x;b.y=s.y;b.moving=moved;b.moveVX150=moved?mx/ml:0;b.moveVY150=moved?my/ml:0;for(const k of TIMERS)b[k]=Math.max(0,(+b[k]||0)-dt);
   if(moved&&!tg&&!(b.attackAnim>0)&&!(b.skillAnim>0)&&typeof facing==='function')b.direction=G(()=>facing(mx,my),b.direction);
   if(tg)as(s,()=>heroAct(s,t));
   if(fin(b.x)&&fin(b.y)){s.x=b.x;s.y=b.y;}else{b.x=s.x;b.y=s.y;}
  }catch(err){fail(err);}}}

// ── 매 틱 ──
function step(){const t=T(),rm=curRoom();if(rm!==lastRoom){if(lastRoom!==null)cancelAll();lastRoom=rm;}
 const dt=lastT==null||t<lastT?0:Math.min(.1,t-lastT);lastT=t;
 if(!acts.length){blinks=blinks.filter(b=>t-b.t0<.8);return;}
 if(!on()||sceneNow()||!solo()){cancelAll();return;}
 acts=acts.filter(x=>{try{if(!ownerOk(x.owner)||x.room!==rm){end(x,'cancel');return false;}if(t>=x.until){end(x,'time');return false;}
   if(dt>0){if(x.kind==='collapse')stepCollapse(x,t,dt);else if(x.kind==='arbelia')stepArbelia(x,t,dt);else stepHeroes(x,t,dt);}syncProps(x);return true;}catch(err){fail(err);end(x,'cancel');return false;}});
 blinks=blinks.filter(b=>t-b.t0<.8);}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started==='undefined'||started)step();}catch(err){fail(err);try{cancelAll();}catch(_){}}sentinel(acts.length>0||blinks.length>0);return r;};}
let fxBase=null;if(typeof fx==='function'){const base=fx;fxBase=(...a)=>base.apply(null,a);}

// ── 그리기 ──
const D3P='assets/r564/dots/',SH={clock:{f:'seoha-clock',py:136,span:224/256,n:20},shatter:{f:'seoha-timestop-shatter',py:157,span:222/256,n:24},haste:{f:'seoha-haste-dial',py:182,span:224/256,n:24},riftB:{f:'seoha-rift-back',py:214,n:24},riftF:{f:'seoha-rift-front',py:214,n:24}};
const sheet=k=>img(D3P+SH[k].f+'.webp');
function cell(im,k,fr,cx,cy,W,comp,a){ctx.save();try{ctx.globalCompositeOperation=comp||'source-over';ctx.globalAlpha*=a==null?1:a;fr=((fr%SH[k].n)+SH[k].n)%SH[k].n;ctx.drawImage(im,(fr%6)*256,Math.floor(fr/6)*256,256,256,cx-W/2,cy-SH[k].py*W/256,W,W);}finally{ctx.restore();}}
const ICE='180,235,250',PALE='230,248,255',GOLD='244,214,150',BRONZE='128,98,58',DEEP='26,34,52',VIO='180,96,255';
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?actorHeight():66*z};}
// 바닥에 누운 톱니바퀴(광원 왼쪽 위: 왼쪽 위 이는 밝게, 오른쪽 아래는 어둡게)
function gear(cx,cy,R,rot,teeth,alpha,z){ctx.save();try{ctx.globalAlpha*=alpha;const n=teeth*4;ctx.beginPath();for(let i=0;i<n;i++){const a=rot+i*Math.PI*2/n,r=R*((i&3)<2?1:.8),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.5;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();
 ctx.fillStyle=`rgba(${BRONZE},.62)`;ctx.fill();ctx.strokeStyle=`rgba(${GOLD},.95)`;ctx.lineWidth=Math.max(1.2,1.6*z);ctx.stroke();
 ctx.fillStyle=`rgba(${DEEP},.7)`;ctx.beginPath();ctx.ellipse(cx,cy,R*.5,R*.25,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(${GOLD},.8)`;ctx.lineWidth=Math.max(1,1.2*z);ctx.stroke();
 ctx.strokeStyle=`rgba(${GOLD},.75)`;ctx.lineWidth=Math.max(1,1.6*z);for(let i=0;i<4;i++){const a=rot+i*Math.PI/2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*R*.5,cy+Math.sin(a)*R*.25);ctx.lineTo(cx+Math.cos(a)*R*.78,cy+Math.sin(a)*R*.39);ctx.stroke();}
 ctx.strokeStyle=`rgba(${PALE},.7)`;ctx.lineWidth=Math.max(1,1.2*z);ctx.beginPath();ctx.ellipse(cx,cy,R*.9,R*.45,0,Math.PI*1.02,Math.PI*1.5);ctx.stroke();
 ctx.fillStyle=`rgba(${PALE},.9)`;ctx.beginPath();ctx.ellipse(cx,cy,R*.1,R*.05,0,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}}
function dial(cx,cy,R,t,alpha,z,hands){ctx.save();try{ctx.globalAlpha*=alpha;ctx.lineWidth=Math.max(1.5,2*z);ctx.strokeStyle=`rgba(${ICE},.85)`;ctx.beginPath();ctx.ellipse(cx,cy,R,R*.5,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle=`rgba(${PALE},.75)`;ctx.lineWidth=Math.max(1,1.4*z);for(let i=0;i<12;i++){const a=i*Math.PI/6,k=i%3===0?.8:.88;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*R*k,cy+Math.sin(a)*R*.5*k);ctx.lineTo(cx+Math.cos(a)*R*.97,cy+Math.sin(a)*R*.5*.97);ctx.stroke();}
 if(hands){ctx.strokeStyle=`rgba(${GOLD},.95)`;ctx.lineWidth=Math.max(1.5,2.4*z);for(const [sp,L] of hands){const a=t*sp;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*R*L,cy+Math.sin(a)*R*.5*L);ctx.stroke();}}}finally{ctx.restore();}}
function ring(q,R,col,w,alpha,fillA){ctx.save();try{ctx.globalAlpha*=alpha;const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';if(fillA){ctx.fillStyle=`rgba(${col},${fillA})`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.fill();}
 ctx.lineWidth=w;ctx.strokeStyle=`rgba(${col},.9)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.stroke();ctx.globalCompositeOperation=prev;}finally{ctx.restore();}}
function glow(x,y,r,col,alpha){ctx.save();try{ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient?ctx.createRadialGradient(x,y,0,x,y,r):null;if(g){g.addColorStop(0,`rgba(${col},.9)`);g.addColorStop(.4,`rgba(${col},.4)`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;}else ctx.fillStyle=`rgba(${col},.3)`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}}
function drawCollapse(x,t){const {z,T1,AH}=scale(),o=x.owner,u=t-x.t0,fade=Math.min(1,u/.25)*Math.min(1,Math.max(0,x.until-t)/.3),id='r949:col:'+x.t0.toFixed(2);
 // 서하 발밑: 빠르게 도는 가속 시계 판 + 맞물린 톱니 둘
 const q=project(o.x,o.y),hd=sheet('haste');
 sc({id:id+':base',kind:'effect',pxfSide:'hero',x:o.x,y:o.y,groundAligned:true},()=>{if(hd)cell(hd,'haste',Math.floor(t*25),q.x,q.y,AH*2.6/SH.haste.span,'source-over',.9*fade);else dial(q.x,q.y,AH*.9,t,.7*fade,z,[[7,.6],[1.4,.85]]);
  gear(q.x-AH*1.5,q.y+AH*.16,AH*.5,t*2.6,10,.9*fade,z);gear(q.x+AH*1.45,q.y-AH*.26,AH*.4,-t*3.4,8,.9*fade,z);});
 // 곳곳의 시계·톱니바퀴
 const ck=sheet('clock');x.spots.forEach((s,i)=>{const v=(t-s.t0)/SPOT_LIFE,a=Math.min(1,v/.12)*Math.min(1,(1-v)/.25)*fade,p=project(s.x,s.y),R=s.size*T1*.5;if(!(a>0))return;
  sc({id:id+':spot:'+s.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:s.x,y:s.y,groundAligned:true},()=>{if(s.gear){gear(p.x,p.y,R,t*3*s.dir,10,.85*a,z);gear(p.x+R*1.45,p.y+R*.2,R*.55,-t*5.4*s.dir+.3,6,.8*a,z);}
   else if(ck)cell(ck,'clock',Math.floor((t-s.t0)*30)*s.dir,p.x,p.y,R*2/SH.clock.span,'source-over',.9*a);else dial(p.x,p.y,R,t*s.dir,.85*a,z,[[6,.55],[1,.8]]);});});
 // 적 자리: 감기는 시계 → 시간 폭발(깨지는 시계 판 + 시공 틈 섬광)
 const sh=sheet('shatter'),rf=sheet('riftF');for(const m of x.marks){const p=project(m.x,m.y),R=COL_BOOM_R*T1*.5,mid=id+':mark:'+m.t0.toFixed(2)+':'+m.x.toFixed(1)+':'+m.y.toFixed(1);
  if(m.boom==null){const w=Math.min(1,(t-m.t0)/COL_WIND),e=w*w;
   sc({id:mid,kind:'effect',pxfSide:'hero',x:m.x,y:m.y,groundAligned:true},()=>{gear(p.x,p.y,R*(1.7-.6*e),t*(4+10*e),12,.35+.55*w,z);if(ck)cell(ck,'clock',Math.floor((t-m.t0)*50),p.x,p.y,R*(1.5-.4*e)*2/SH.clock.span,'source-over',.4+.6*w);else dial(p.x,p.y,R*(1.4-.4*e),t,.9*w,z,[[16,.6],[3,.85]]);
    ring(p,R*(1.9-.9*e),GOLD,Math.max(1.2,2*z),.5*w,0);});}
  else{const v=Math.min(1,Math.max(0,(t-m.boom)/COL_BOOM_T)),a=1-v;
   sc({id:mid+':boom',kind:'effect',pxfSide:'hero',x:m.x,y:m.y,groundAligned:true},()=>{if(sh)cell(sh,'shatter',Math.min(23,2+Math.floor(v*21)),p.x,p.y,R*3.1/SH.shatter.span,'source-over',Math.min(1,a*1.8));
    ring(p,R*(.5+.9*Math.sqrt(v)),PALE,Math.max(2,7*z*a),a,.14*a);ring(p,R*(.3+.6*Math.sqrt(v)),GOLD,Math.max(1,2.5*z),a*.9,0);});
   if(v<.6)sc({id:mid+':flash',kind:'effect',pxfSide:'hero',x:m.x,y:m.y+.01},()=>{const f=1-v/.6;if(rf)cell(rf,'riftF',8+Math.floor(v/.6*12),p.x,p.y,256*AH/150*1.15,'lighter',f);glow(p.x,p.y-AH*.42,AH*(.55+.6*v),PALE,.9*f);glow(p.x,p.y-AH*.42,AH*(.25+.3*v),'255,255,255',f);
    ctx.save();try{ctx.globalAlpha*=f;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${GOLD},.9)`;ctx.lineWidth=Math.max(1.2,2*z);for(let i=0;i<8;i++){const an=i*Math.PI/4+m.pulse,r0=AH*(.2+.6*v),r1=AH*(.45+1.1*v);ctx.beginPath();ctx.moveTo(p.x+Math.cos(an)*r0,p.y-AH*.42+Math.sin(an)*r0*.7);ctx.lineTo(p.x+Math.cos(an)*r1,p.y-AH*.42+Math.sin(an)*r1*.7);ctx.stroke();}}finally{ctx.restore();}});}}}
function drawArbFx(x,t){const {z,T1,AH}=scale(),id='r949:arb:'+x.t0.toFixed(2);
 for(const c of x.casts){const cid=id+':'+c.kind+':'+c.t0.toFixed(2),w=Math.min(1,(t-c.t0)/ARB_WIND),hv=c.hitAt!=null?Math.min(1,Math.max(0,(t-c.hitAt)/.4)):null;
  if(c.kind==='line'){const a=project(c.x,c.y),b=project(c.x+c.ux*ARB_LINE.len,c.y+c.uy*ARB_LINE.len),lift=AH*.55;
   sc({id:cid,kind:'effect',pxfSide:'hero',x:c.x+c.ux*ARB_LINE.len*.5,y:c.y+c.uy*ARB_LINE.len*.5,groundAligned:true},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';
    if(hv==null){ctx.globalAlpha*=.35+.5*w;ctx.strokeStyle=`rgba(${GOLD},.8)`;ctx.lineWidth=Math.max(1.5,2*z);ctx.setLineDash&&ctx.setLineDash([10*z,7*z]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+(b.x-a.x)*w,a.y+(b.y-a.y)*w);ctx.stroke();ctx.setLineDash&&ctx.setLineDash([]);}
    else{const f=1-hv;ctx.globalAlpha*=f;ctx.strokeStyle=`rgba(${GOLD},.4)`;ctx.lineWidth=Math.max(2,ARB_LINE.w*T1*.28*(.5+.5*f));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}finally{ctx.restore();}});
   if(hv!=null)sc({id:cid+':hand',kind:'effect',pxfSide:'hero',x:c.x+c.ux*ARB_LINE.len*.5,y:c.y+c.uy*ARB_LINE.len*.5+.01},()=>{ctx.save();try{const f=1-hv;ctx.globalAlpha*=f;ctx.globalCompositeOperation='lighter';
    /* 초침 모양: 뿌리는 굵고 끝은 뾰족한 바늘(금빛 겉 → 흰 속) + 뿌리 뒤로 짧은 꼬리 */
    const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;for(const [col,hw,al] of [[GOLD,AH*.16,.75],[PALE,AH*.085,.9],['255,255,255',AH*.035,1]]){const h=hw*(.45+.55*f);ctx.fillStyle=`rgba(${col},${al})`;ctx.beginPath();
     ctx.moveTo(a.x-dx/L*AH*.5,a.y-lift-dy/L*AH*.5);ctx.lineTo(a.x+nx*h,a.y-lift+ny*h);ctx.lineTo(b.x,b.y-lift);ctx.lineTo(a.x-nx*h,a.y-lift-ny*h);ctx.closePath();ctx.fill();}
    }finally{ctx.restore();}glow(b.x,b.y-lift,AH*.5,GOLD,.8*(1-hv));glow(a.x,a.y-lift,AH*.4,PALE,.8*(1-hv));});}
  else if(c.kind==='donut'){const p=project(c.x,c.y),R0=ARB_DONUT.r0*T1*.5,R1=ARB_DONUT.r1*T1*.5,since=c.hitAt!=null?t-c.hitAt:null,f=since!=null?Math.max(0,1-since/.4):0;
   sc({id:cid,kind:'effect',pxfSide:'hero',x:c.x,y:c.y,groundAligned:true},()=>{ring(p,R0,VIO,Math.max(1.5,2.5*z),.45+.4*w,0);ring(p,R1,VIO,Math.max(1.5,2.5*z),.45+.4*w,0);
    ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.lineWidth=Math.max(1.5,2.2*z);for(let i=0;i<12;i++){const an=-t*2.2+i*Math.PI/6,k0=i%3===0?0:.35;ctx.strokeStyle=`rgba(${PALE},${.25+.5*f})`;ctx.beginPath();ctx.moveTo(p.x+Math.cos(an)*(R0+(R1-R0)*k0),p.y+Math.sin(an)*(R0+(R1-R0)*k0)*.5);ctx.lineTo(p.x+Math.cos(an)*R1,p.y+Math.sin(an)*R1*.5);ctx.stroke();}
     if(f>0){ctx.globalAlpha*=f;for(let i=1;i<=4;i++){const R=R0+(R1-R0)*i/5;ctx.strokeStyle=`rgba(${VIO},.55)`;ctx.lineWidth=Math.max(3,(R1-R0)*.1);ctx.beginPath();ctx.ellipse(p.x,p.y,R,R*.5,0,0,Math.PI*2);ctx.stroke();}}}finally{ctx.restore();}});}
  else if(c.kind==='circle'){const ck=sheet('clock'),orb=img(ARB_ORB),p=project(c.x,c.y),R=ARB_CIRCLE.r*T1*.5;
   sc({id:cid,kind:'effect',pxfSide:'hero',x:c.x,y:c.y,groundAligned:true},()=>{if(ck)cell(ck,'clock',-Math.floor((t-c.t0)*30),p.x,p.y,R*2/SH.clock.span,'source-over',.55+.35*w);else dial(p.x,p.y,R,-t,.8,z,[[9,.6],[2,.85]]);ring(p,R,ICE,Math.max(1.5,2.5*z),.6,0);});
   if(c.hitAt!=null&&t-c.hitAt<.26&&c.px!=null){const v=(t-c.hitAt)/.26,hp=project(c.px,c.py);sc({id:cid+':orb',kind:'effect',pxfSide:'hero',x:c.px,y:c.py+.01},()=>{const S=AH*(1.5+.6*v);
    if(orb){ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=1-v;ctx.drawImage(orb,hp.x-S/2,hp.y-AH*.45-S/2,S,S);}finally{ctx.restore();}}else glow(hp.x,hp.y-AH*.45,S*.5,ICE,1-v);ring(hp,R*(.4+.6*v),PALE,Math.max(2,6*z*(1-v)),1-v,.12*(1-v));});}}
  else{const p=project(c.x,c.y),Rs=ARB_ROOM.safe*T1*.5,hd=sheet('haste');
   sc({id:cid,kind:'effect',pxfSide:'hero',x:c.x,y:c.y,groundAligned:true},()=>{if(hd)cell(hd,'haste',Math.floor(t*12.5),p.x,p.y,Rs*2/SH.haste.span,'source-over',.5+.4*w);ring(p,Rs,PALE,Math.max(2,3*z),.6+.4*w,.06);
    if(hv!=null){const R=Rs+(ARB_ROOM.r*T1*.5-Rs)*Math.sqrt(hv),f=1-hv;ring(p,R,VIO,Math.max(2,9*z*f),f,0);ring(p,R*.86,PALE,Math.max(1,3*z),f*.8,0);}});}}}
function drawBlinks(t){if(!blinks.length)return;const {AH}=scale(),rb=sheet('riftB'),rf=sheet('riftF');for(const b of blinks){const fr=Math.max(0,Math.min(23,Math.floor((t-b.t0)*30))),q=project(b.x,b.y),W=256*AH/150*b.k,id='r949:rift:'+b.t0.toFixed(2)+':'+b.x.toFixed(1)+':'+b.y.toFixed(1);
  if(rb&&rf){sc({id:id+':b',kind:'effect',pxfSide:'hero',x:b.x,y:b.y-.02},()=>cell(rb,'riftB',fr,q.x,q.y,W,'lighter',1));sc({id:id+':f',kind:'effect',pxfSide:'hero',x:b.x,y:b.y+.02},()=>cell(rf,'riftF',fr,q.x,q.y,W,'lighter',1));}
  else sc({id,kind:'effect',pxfSide:'hero',x:b.x,y:b.y},()=>glow(q.x,q.y-AH*.5*b.k,AH*.6*b.k,ICE,Math.max(0,1-(t-b.t0)/.8)));}}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();
 for(const x of acts){try{if(x.kind==='collapse')drawCollapse(x,t);else if(x.kind==='arbelia')drawArbFx(x,t);}catch(err){fail(err);}}
 try{drawBlinks(t);}catch(err){fail(err);}stats.draws++;}
// 소환수 몸(방 소품 자리에서 깊이 순서대로): 발밑 고리 + 영웅은 엔진 영웅 그리기, 아르벨리아는 보스 그림
function footRing(x,y,t,z,k,alpha){const q=project(x,y),AH=typeof actorHeight==='function'?actorHeight():66*z,R=AH*.42*k;ctx.save();try{ctx.globalAlpha*=alpha;ctx.fillStyle=`rgba(${ICE},.16)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R*1.25,R*.62,0,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}
 dial(q.x,q.y,R,t,alpha*.9,z,[[5,.55],[.9,.8]]);return q;}
function drawSummon(p){const x=acts.find(a=>a.props.includes(p));if(!x||typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T(),{z,AH}=scale(),fade=Math.min(1,(t-x.t0)/.3)*Math.min(1,Math.max(0,x.until-t)/.3);
 if(x.kind==='arbelia'){const e=x.ent,q=footRing(e.x,e.y,t,z,1.7,fade),path=ARB_ART[e.pose]||ARB_ART.idle,size=AH*ARB_SIZE,bob=Math.sin(t*2.2)*2.5*z;
  try{if(typeof shadow==='function')shadow(q.x,q.y,size*.2,{alpha:fade});}catch(_){}
  if(typeof sprite==='function')sprite(ready(path)?path:ARB_ART.idle,q.x,q.y-AH*.06+bob,size,{alpha:.96*fade,flip:!!e.flip});stats.bodyDraws++;return;}
 const s=p.r949Ref;if(!s||!s.body)return;footRing(s.x,s.y,t+s.idx,z,1,fade);
 const pose=G(()=>heroArt[s.hero].idle.front,null);if(!pose||!ready(pose))return;s.body.x=s.x;s.body.y=s.y;
 ctx.save();try{ctx.globalAlpha*=fade;as(s,()=>drawHero());}finally{ctx.restore();}stats.bodyDraws++;}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p&&p.r949Prop){try{drawSummon(p);}catch(e){fail(e);}return;}return base.apply(this,[p,...a]);};}
const SENT={type:'r949-epoch',x:0,y:0,age:0,life:Infinity,r949Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 const a=acts[0];if(want&&a&&a.owner){SENT.x=a.owner.x;SENT.y=a.owner.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r949Sentinel){try{ctx.save();try{ctx.globalCompositeOperation='source-over';draw();}finally{ctx.restore();}}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
const KINDS=['heroes','arbelia','collapse'];
window.__STORYWORLD_SEOHA_EPOCH_R949__=Object.freeze({revision:REV,set,on:()=>on(),names:NAMES,
 /* 그 영웅이 지금 소환돼 있는가 — 영웅별 덧씌우기가 '다른 몸을 그리는 차례'를 가릴 때 쓴다(R720 has 와 같은 뜻) */
 has:id=>!!id&&acts.some(x=>x.kind==='heroes'&&x.summons.some(s=>s.hero===id&&s.body)),
 qaForce:k=>{forced=KINDS.includes(k)?k:null;return forced;},qaRandom:f=>{rng=typeof f==='function'?f:null;return !!rng;},qaTrio:l=>{trio=Array.isArray(l)?l.slice(0,HERO_N):null;return trio;},
 qaReset:()=>{const o=P();if(o){const s=stateOf(o);s.readyAt=-1e9;s.lastRoll=-1e9;}cancelAll();return true;},
 inspect:()=>{const a=acts[0]||null,hs=acts.find(x=>x.kind==='heroes'),ar=acts.find(x=>x.kind==='arbelia');return {revision:REV,on:prefOn,owners:ownerCount,
  active:a?{kind:a.kind,t0:a.t0,until:a.until,marks:a.marks?a.marks.length:0,spots:a.spots?a.spots.length:0}:null,acts:acts.length,
  summons:hs?hs.summons.map(s=>({hero:s.hero,x:s.x,y:s.y,dir:s.body?s.body.direction:null,anim:s.body?s.body.attackAnim:0})):[],
  arbelia:ar?{name:ARB_NAME,x:ar.ent.x,y:ar.ent.y,pose:ar.ent.pose,flip:ar.ent.flip,casts:ar.casts.map(c=>({kind:c.kind,rep:c.rep,x:c.x,y:c.y}))}:null,
  props:acts.reduce((n,x)=>n+x.props.length,0),swapped:cur.length,
  tuning:{CHANCE,CHANCE_MAX,ROLL_GAP,DUR,ICD,WEIGHTS,COL_PULSES,COL_GAP,COL_R,COL_SPOTS,COL_BOOM_R,COL_K,HERO_N,HERO_K,HERO_PACE,HERO_BEAT,ARB_AT,ARB_LINE,ARB_DONUT,ARB_CIRCLE,ARB_ROOM},
  stats:{...stats,procs:{...stats.procs},heroCasts:{...stats.heroCasts},arbOrder:stats.arbOrder.slice(),arbReps:{...stats.arbReps}}};}});
})();
