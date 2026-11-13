// R952 — 헌터 확률 발동 특수 패시브 '사냥 분대'
//  사용자 2026-11-12 13:30Z: "헌터영웅 확률발동 특수패시브 1. 슬레이어영웅소환 2. 슬레이어영웅소환+ 확률적으로 슬레이어분신소환
//   3. 1-2둘다발동+ 헌터분신소환해서 분대를 이루어 진법갖추고 적을 섬멸함 /(특수하게 1,2,3 중하나가 발동하는것임)확률은 1이높고 3이 낮고 지속은 7초"
//
//  · 발동: 헌터의 기본 공격이 나간 순간 주사위 한 번(9%, 0.35초에 한 번만 굴림). 나오면 아래 셋 가운데 정확히 하나가 7초 동안 이어진다.
//      ① 혈맹 호출(60%)  — 슬레이어 영웅이 헌터 곁에 나타나 7초 동안 같이 싸운다.
//      ② 혈영 강습(28%)  — ① + 슬레이어가 벨 때마다 50% 확률로 슬레이어 분신이 곁의 다른 적 앞에 나타나 한 번 베고 사라진다.
//      ③ 기러기진 섬멸(12%) — ①·② + 헌터 분신 넷이 헌터를 꼭짓점으로 한 기러기 대형(좌우 두 날개)을 이뤄 함께 쏜다. 진은 헌터가 겨눈 쪽을 따라 돈다.
//    발동한 순간부터 21초 동안은 다시 굴리지 않는다(지속 7초 + 쉬는 14초). 지속 중에는 겹쳐 발동하지 않는다. 스킬 키는 늘리지 않는다.
//  · 소환된 영웅은 원래 영웅 그대로다(R720 생존 배치 영웅과 같은 방식): 조종 영웅 사본인 '몸'을 잠깐 엔진의 player 자리에 끼우고
//    엔진 기본 공격(basicAttack)·고유기(R49 autoSpecial → special)·본편 W·E·R(__STORYWORLD_WER__.cast)·영웅 그리기(drawHero)를 그대로 부른다.
//    몸에는 r720Ally 표식이 있어 영웅 그리기 덧씌우기들의 영웅별 상태(perHeroR720)를 그대로 탄다. R720 공개 객체의 has() 에 "이 영웅이 판에 있다"를 이어 붙인다.
//  · 밸런스(헌터 능력치 비례): 몸은 헌터의 레벨·강화를 함께 쓰고, 엔진 attackPower 에 배수를 곱한다 — 슬레이어 ×0.1, 슬레이어 분신 베기 ×0.15, 헌터 분신 ×0.22(넷 합 0.88).
//    슬레이어는 기본 위력이 헌터의 두 배쯤이고 한 번에 여럿을 베며 고유기·W·E·R 도 쓰므로 배수가 낮다(헤드리스 실측: 몹 7마리 밀집에서 4.5초 동안 헌터 평타 피해의 약 1.1배).
//    소환 영웅은 맞지 않는다(적은 조종 영웅만 노린다). 피해는 엔진 hitEnemy·makeShot 으로만 준다 → 처치·경험치·보스·승리 조건은 엔진 규칙 그대로.
//    아직 교전이 시작되지 않은 보스·등장 중인 적은 건드리지 않는다. 방이 바뀌거나, 헌터가 쓰러지거나, 영웅을 바꾸면 바로 해산한다. 저장하지 않는다.
//  · 헌터 분신은 기본 공격과 고유기 일제 사격 한 번만 쓴다(돌진 E 처럼 자리를 벗어나는 스킬은 쓰지 않는다). 분신 넷의 발사 소리는 하나만 낸다.
//  · 그림: 몸은 엔진 영웅 그림 그대로(방 조형물 줄에 끼워 깊이 정렬). 발밑 소환 문은 Dots 헌터 문 시트(R535 hunter-gate, 24칸: 열림 0-4·반복 5-19·닫힘 20-23)를 다시 쓴다.
//    슬레이어가 나타나는 순간은 R190 피 터짐 시트. 진법 줄(헌터에서 두 날개로 뻗는 점선)만 코드로 그린 임시 그림이다 — Dots 시트(요청 CX-0096HS)가 오면 바꾼다.
//    R952-2(2026-11-13): CX-0096HS 가운데 HS-02 해산(r2)·HS-03 분신 베기(r1) 시트를 적용. 진법 줄(HS-04)은 Dots 수정 대기라 아직 임시 점선.
//  · 협동 모드에서는 발동하지 않는다. 생존 배치(R720)된 헌터도 몸마다 따로 발동한다.
//  끄기: localStorage['storyworld.r952.hunterSquad']='{"on":false}'
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HUNTER_SQUAD_R952__)return;
const REV='R952-hunter-squad-2',KEY='storyworld.r952.hunterSquad',HERO='hunter',ALLY='slayer';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const CFG=Object.freeze({chance:.09,gap:.35,icd:21,life:7,fade:.45,
 tiers:Object.freeze({call:.6,shade:.28,squad:.12}),
 slayer:Object.freeze({mul:.1,seek:9,leash:10,speed:4.8}),
 shade:Object.freeze({chance:.5,mul:.15,reach:5.5,life:.34,max:4}),
 squad:Object.freeze({count:4,mul:.22,gap:1.15,back:.62,speed:7,stagger:.09}),
 // R952-2: Dots CX-0096HS 시트. HS-02 혈맹 해산(r2, 몸 위 덧그림, 깃털이 위로 흩어짐)·HS-03 혈영 강습 베기(r1, 오른쪽 기준·왼쪽은 좌우 반전)
 sheets:Object.freeze({leave:Object.freeze({path:'assets/r952/hs02-blood-pact-leave.webp',cell:Object.freeze([256,256]),cols:6,frames:12,piv:Object.freeze([128,244]),dur:.8}),
  slash:Object.freeze({path:'assets/r952/hs03-shade-slash.webp',cell:Object.freeze([384,256]),cols:6,frames:12,piv:Object.freeze([192,128]),hit:4})})});
const G971=(h,a)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.chances(h,a);return Array.isArray(v)&&v.length===a.length&&v.every(x=>Number.isFinite(x)&&x>=0)?v:a;}catch(_){return a;}},D971=(h,s)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.cooldown(h,s);return Number.isFinite(v)&&v>0?v:s;}catch(_){return s;}};/* R971 특수 패시브 강화(0단계=원래 값) */
const NAMES={call:'혈맹 호출',shade:'혈영 강습',squad:'기러기진 섬멸'},BEAT=.42;
let errors=0,lastError=null;const fail=e=>{errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const fin=Number.isFinite,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const T=()=>G(()=>time,0),P=()=>G(()=>player,null);
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const open=(x,y)=>fin(x)&&fin(y)&&!G(()=>blocked(x,y,.23),false);
const dmgOK=e=>G(()=>typeof damageable3==='function'?damageable3(e):e.hp>0,e?.hp>0);
const foesNow=()=>G(()=>liveEnemies(),[]).filter(e=>e&&e.hp>0&&fin(e.x)&&fin(e.y)&&dmgOK(e));
const paused=()=>!!(G(()=>modal,false)||G(()=>loading,false)||G(()=>storyScene,null)||!G(()=>started,true));
const isSummon=p=>!!p&&p.r952Summon===true;
const isOwner=p=>!!p&&p.hero===HERO&&p.hp>0&&!isSummon(p);

// ── 순수 규칙(QA 가 CPU 에서 부른다) ──
function pickTier(r){const t=CFG.tiers;return r<t.call?'call':r<t.call+t.shade?'shade':'squad';}
// 기러기 대형: 헌터(px,py)가 꼭짓점, 겨눈 쪽(aim)이 앞. i 짝수 = 왼 날개, 홀수 = 오른 날개, 바깥 줄일수록 더 벌어지고 더 뒤.
function slotsFor(px,py,aim,count,gap,back,k=1){const fx=Math.cos(aim),fy=Math.sin(aim),lx=-fy,ly=fx,out=[];
 for(let i=0;i<count;i++){const side=i%2?1:-1,rank=1+(i>>1);out.push({x:px+(lx*side*gap*rank-fx*back*rank)*k,y:py+(ly*side*gap*rank-fy*back*rank)*k});}return out;}

// ── 상태(영웅 몸마다 따로: 조종 영웅 하나 + R720 배치 몸은 WeakMap) ──
const fresh=()=>({squad:null,readyAt:-1e9,rollAt:-1e9,force:null,stats:{swings:0,rolls:0,procs:{call:0,shade:0,squad:0},ends:0,casts:{basic:0,q:0,w:0,e:0,r:0},shades:0,shadeHits:0,volleys:0,cloneShots:0,coopSkipped:0,draws:0,slashDraws:0,leaveDraws:0}});
const main=fresh(),allyState=new WeakMap(),shadeAt=new WeakMap(),live=[];let serial=0,warmed=false;
function st(p,make=true){if(p&&p.r720Ally===true){let s=allyState.get(p);if(!s&&make){s=fresh();allyState.set(p,s);}return s||null;}return main;}
const alive=u=>!!u&&live.includes(u.sq);
const GATE=Object.freeze({path:'assets/r535/dots/hunter-gate.webp',cell:256,cols:6,piv:[128,145],oval:90,open:5,loop:15,close:4});
function warm(){if(warmed)return;warmed=true;try{const p=ensureImages([...heroPaths(ALLY),GATE.path,CFG.sheets.leave.path,CFG.sheets.slash.path]);if(p&&p.catch)p.catch(()=>{});}catch(_){}}

// ── 몸: 주인(헌터)과 같은 모양의 사본. 엔진 함수를 부르는 동안만 player 자리에 끼운다(R720 과 같은 방식) ──
const SHARED=['upgrades','progressionR62'],TIMERS=['attackCD','attackAnim','skillAnim','blinkCD','specialCD','invincible','parry','ego','egoCD','samong','samongCD','grazeGuard','counter'];
const stack=[];const top=()=>stack.length?stack[stack.length-1]:null;
function mkBody(owner,u){if(!owner)return null;const b={};
 for(const k in owner){if(!Object.prototype.hasOwnProperty.call(owner,k))continue;const v=owner[k];if(v&&typeof v==='object'&&!SHARED.includes(k)){try{b[k]=structuredClone(v);}catch(_){b[k]=Array.isArray(v)?[]:{};}}else b[k]=v;}
 Object.defineProperty(b,'r720Ally',{value:true,enumerable:false});Object.defineProperty(b,'r952Summon',{value:true,enumerable:false});
 b.r952Mul=u.mul;b.hero=u.kind===ALLY?ALLY:HERO;b.x=u.x;b.y=u.y;b.direction=owner.direction||'front';b.combo=0;for(const k of TIMERS)b[k]=0;
 b.attackCD=u.kind===ALLY?.25:.3+u.i*CFG.squad.stagger;b.resonance=0;b.shield=0;b.guard=false;b.pending=false;b.moving=false;b.visible=true;b.disabled=false;b.visualLiftPx=0;b.storyWER={ready:{},buffs:{}};
 return b;}
function refresh(b,p){for(const k of SHARED)b[k]=p[k];b.level=p.level;b.hp=Math.max(1,+p.maxHp||0,+b.hp||0,100);b.ego=0;b.samong=0;b.resonance=0;b.pending=false;}
// 몸을 player 로 끼우고 fn 을 돈다. 끝나면(오류여도) 반드시 되돌린다. 엔진의 겨눔·이동 명령(target·command·route)도 몸마다 바꿔 끼운다.
function as(u,fn){const b=u&&u.body;if(!b)return undefined;const prev=player;if(prev===b)return fn();
 refresh(b,u.sq.owner);let sT,sC,sR,sw=false;try{sT=target;sC=command;sR=route;target=b.targetR952||null;command=null;route=[];sw=true;}catch(_){}
 stack.push(u);player=b;try{return fn();}finally{player=prev;stack.pop();if(sw){try{b.targetR952=target||null;target=sT;command=sC;route=sR;}catch(_){}}}}

// ── 스킬 고르기: A키 오토공격(R597)·R720 과 같은 규칙. player 는 지금 몸이다 ──
const big=e=>!!(e&&(e.boss||e.elite||e.major));
function tryQ(){const b=player,R=window.__STORYWORLD_HANDO_FINAL_R49__;if(b.specialCD>0||!R?.autoSpecial)return false;const cd=b.specialCD;R.autoSpecial();return b.specialCD>cd;}
function trySlot(slot){const b=player,R=window.__STORYWORLD_HANDO_FINAL_R49__,t=G(()=>R.autoTarget(slot),null);if(!t)return false;
 if(slot==='e'){const base=G(()=>HEROES[b.hero].range,0);if(Math.hypot(t.x-b.x,t.y-b.y)<base*.7)return false;}
 if(slot==='r'&&!big(t)){const range=G(()=>R.rangeFor('r'),0);if(!(range>0)||G(()=>room.enemies.filter(e=>R.eligible(e,range)).length,0)<2)return false;}
 return G(()=>window.__STORYWORLD_WER__.cast(slot,true),false)===true;}

// ── 발동 ──
function spotNear(p,e){const a0=e?Math.atan2(e.y-p.y,e.x-p.x):G(()=>storyAim22(),0);
 for(const r of [1.1,.8,1.5,.5])for(const da of [.6,-.6,1.4,-1.4,0,2.4,-2.4,Math.PI]){const x=p.x+Math.cos(a0+da)*r,y=p.y+Math.sin(a0+da)*r;if(open(x,y))return {x,y};}return {x:p.x,y:p.y};}
function nearestTo(q,range,foes){let b=null,bd=range;for(const e of foes||foesNow()){const d=dist(e,q);if(d<bd){bd=d;b=e;}}return b;}
function mkUnit(sq,kind,i,x,y,mul){const u={sq,kind,i,x,y,mul,body:null,prop:null,beat:sq.t0+.5,born:sq.t0,qDone:false,loadAt:-9};
 u.prop={id:'r952:'+kind+':'+i+':'+(++serial),r952Prop:true,x,y,solid:false,visible:true,autoTargetEligible6:false,label:'소환 영웅',height:66};
 Object.defineProperty(u.prop,'r952Unit',{value:u,enumerable:false});return u;}
function start(s,p,tier){const t=T(),rm=G(()=>room,null);if(!rm||!NAMES[tier])return false;const foes=foesNow();
 const sq={tier,t0:t,end:t+CFG.life,room:rm,owner:p,state:s,units:[],shades:[],aim:null,slots:[],form:null};
 const sp=spotNear(p,nearestTo(p,CFG.slayer.seek,foes));sq.units.push(mkUnit(sq,ALLY,0,sp.x,sp.y,CFG.slayer.mul));
 if(tier==='squad'){for(let i=0;i<CFG.squad.count;i++)sq.units.push(mkUnit(sq,HERO,i,p.x,p.y,CFG.squad.mul));
  sq.form={id:'r952:form:'+(++serial),r952Prop:true,r952Form:true,x:p.x,y:p.y,solid:false,visible:true,autoTargetEligible6:false,label:'',height:1};Object.defineProperty(sq.form,'r952Squad',{value:sq,enumerable:false});}
 formation(sq,foes);for(const u of sq.units)u.body=mkBody(p,u);
 s.squad=sq;s.readyAt=t+D971(HERO,CFG.icd);s.stats.procs[tier]++;live.push(sq);syncProps(sq);
 try{floatText(NAMES[tier],p.x,p.y,tier==='squad'?'#f1d9a0':'#e08a92');}catch(_){}
 try{window.__STORYWORLD_BLOOD_R190__?.play?.('blood-burst',sp.x,sp.y,{k:1.1,z:0});}catch(_){}
 return true;}
function end(sq){const i=live.indexOf(sq);if(i>=0)live.splice(i,1);if(sq.state.squad===sq)sq.state.squad=null;sq.state.stats.ends++;
 for(const r of new Set([sq.room,G(()=>room,null)]))try{if(r&&Array.isArray(r.props)&&r.props.some(p=>p&&p.r952Prop&&(p.r952Unit?.sq===sq||p.r952Squad===sq)))r.props=r.props.filter(p=>!(p&&p.r952Prop&&(p.r952Unit?.sq===sq||p.r952Squad===sq)));}catch(e){fail(e);}
 for(const u of sq.units){if(u.body){u.body.hp=0;u.body=null;}}sq.shades.length=0;}
function endAll(){for(const sq of live.slice())end(sq);}
function onSwing(p){const s=st(p),t=T();s.stats.swings++;warm();if(!solo()){s.stats.coopSkipped++;return;}if(s.squad)return;let tier=null;
 if(s.force){tier=s.force;s.force=null;}
 else{if(t<s.rollAt||t<s.readyAt)return;s.rollAt=t+CFG.gap;s.stats.rolls++;if(!(Math.random()<G971(HERO,[CFG.chance])[0]))return;tier=pickTier(Math.random());}
 start(s,p,tier);}
function valid(sq){const p=sq.owner;if(!on||!solo()||!p||!(p.hp>0)||p.hero!==HERO||sq.room!==G(()=>room,null))return false;
 if(p.r720Ally===true){const bs=G(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.bodies(),null);return !Array.isArray(bs)||bs.length===0||bs.includes(p);}
 return p===P();}
function syncProps(sq){const r=sq.room;if(!r||!Array.isArray(r.props))return;for(const u of sq.units)if(!r.props.includes(u.prop))r.props.push(u.prop);
 if(sq.form){let m=sq.owner.x+sq.owner.y;for(const u of sq.units)m=Math.min(m,u.x+u.y);for(const s of sq.slots)m=Math.min(m,s.x+s.y);sq.form.x=sq.form.y=(m-.8)/2;/* 모든 분대원보다 먼저(바닥에) 그려지게 */if(!r.props.includes(sq.form))r.props.push(sq.form);}
 /* R952-2: 분신 베기 궤적은 따로 한 항목으로, 베이는 적들보다 앞(화면 아래)에서 그린다 — 슬레이어 몸 순서로 그리면 적 그림에 가려 안 보였다 */
 if(sq.shades.length){let m=-Infinity;for(const c of sq.shades){m=Math.max(m,c.x+c.y);if(c.e&&isFinite(c.e.x))m=Math.max(m,c.e.x+c.e.y);}
  if(!sq.fx){sq.fx={id:'r952:fx:'+(++serial),r952Prop:true,r952Fx:true,x:0,y:0,solid:false,visible:true,autoTargetEligible6:false,label:'',height:1};Object.defineProperty(sq.fx,'r952Squad',{value:sq,enumerable:false});}
  sq.fx.x=sq.fx.y=(m+.9)/2;if(!r.props.includes(sq.fx))r.props.push(sq.fx);}
 else if(sq.fx&&r.props.includes(sq.fx))r.props=r.props.filter(p=>p!==sq.fx);}

// ── 한 걸음 ──
const angDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function formation(sq,foes){const p=sq.owner,C=CFG.squad,e=nearestTo(p,12,foes);
 if(e){const a=Math.atan2(e.y-p.y,e.x-p.x);if(sq.aim==null||Math.abs(angDiff(a,sq.aim))>.35)sq.aim=a;}else if(sq.aim==null)sq.aim=G(()=>storyAim22(),0);
 if(sq.tier!=='squad'){sq.slots.length=0;return;}
 const full=slotsFor(p.x,p.y,sq.aim,C.count,C.gap,C.back,1);sq.slots.length=0;
 for(let i=0;i<C.count;i++){let s={x:p.x,y:p.y};for(const k of [1,.75,.5,.3]){const q=k===1?full[i]:slotsFor(p.x,p.y,sq.aim,C.count,C.gap,C.back,k)[i];if(open(q.x,q.y)){s=q;break;}}sq.slots.push(s);}}
function walk(u,gx,gy,stop,len){const dx=gx-u.x,dy=gy-u.y,d=Math.hypot(dx,dy);if(!(d>stop+1e-6))return false;const k=Math.min(len,d-stop)/d,nx=u.x+dx*k,ny=u.y+dy*k;
 if(open(nx,ny)){u.x=nx;u.y=ny;}else if(open(nx,u.y))u.x=nx;else if(open(u.x,ny))u.y=ny;else return false;return true;}
function face(b,dx,dy){if(!(b.attackAnim>0)&&!(b.skillAnim>0)&&(dx||dy)&&typeof facing==='function')b.direction=G(()=>facing(dx,dy),b.direction);}
function carry(u,px,py,moved){const b=u.body,mx=u.x-px,my=u.y-py,ml=Math.hypot(mx,my);b.x=u.x;b.y=u.y;b.moving=moved;b.moveVX150=moved&&ml>1e-6?mx/ml:0;b.moveVY150=moved&&ml>1e-6?my/ml:0;}
function rollShade(sq,u,tg,foes,t){const C=CFG.shade,S=sq.state.stats;if(sq.shades.length>=C.max||!(Math.random()<C.chance))return;
 /* 곁의 다른 적 가운데 분신이 가장 오래 안 간 적부터(같으면 가까운 적) — 분신이 한 적에만 몰리지 않고 돌아가며 벤다 */let e=null,bl=Infinity,bd=Infinity;for(const v of foes){if(v===tg)continue;const d=dist(v,u);if(d>C.reach)continue;const l=shadeAt.get(v)??-1e9;if(l<bl||(l===bl&&d<bd)){bl=l;bd=d;e=v;}}if(!e)e=tg;if(!e||!(e.hp>0))return;shadeAt.set(e,t);
 let vx=e.x-u.x,vy=e.y-u.y;const d=Math.hypot(vx,vy);if(d>1e-6){vx/=d;vy/=d;}else{vx=1;vy=0;}let x=e.x-vx*.7,y=e.y-vy*.7;if(!open(x,y)){x=e.x;y=e.y;}
 sq.shades.push({x,y,e,dir:G(()=>facing(vx,vy),'front'),t0:t,hitAt:t+.1,life:C.life,done:false,power:G(()=>rawPower(),0)});S.shades++;}
function actSlayer(sq,u,tg,foes,t){const b=player,S=sq.state.stats;try{target=tg.id;}catch(_){}
 const cd=+b.attackCD||0;if(!(cd>0)){basicAttack();if(b.attackCD>cd){S.casts.basic++;if(sq.tier!=='call')rollShade(sq,u,tg,foes,t);}}
 if(t>=u.beat){u.beat=t+BEAT;if(tryQ())S.casts.q++;else for(const k of ['r','w','e'])if(trySlot(k)){S.casts[k]++;break;}}}
function stepSlayer(sq,u,foes,dt,t){const C=CFG.slayer,p=sq.owner,b=u.body,px=u.x,py=u.y;let tg=null,bd=Infinity;
 /* 교전 중인 보스가 닿는 곳에 있으면 보스부터, 아니면 가장 가까운 적 */let boss=false;for(const e of foes){if(dist(e,p)>C.seek)continue;const d=dist(e,u),k=!!(e.boss||e.midboss);if((k&&!boss)||(k===boss&&d<bd)){boss=k;bd=d;tg=e;}}
 const range=G(()=>HEROES[ALLY].range,3.3),moved=tg?walk(u,tg.x,tg.y,Math.min(range*.8,1.4),C.speed*dt):walk(u,p.x,p.y,1.3,C.speed*dt);
 if(dist(u,p)>C.leash){const s=spotNear(p,tg);u.x=s.x;u.y=s.y;}
 carry(u,px,py,moved);if(moved&&!tg)face(b,u.x-px,u.y-py);
 if(tg){as(u,()=>actSlayer(sq,u,tg,foes,t));/* 돌진 스킬로 몸이 움직였으면(벽 속이 아니면) 따라간다 */if(fin(b.x)&&fin(b.y)&&Math.hypot(b.x-u.x,b.y-u.y)<6&&open(b.x,b.y)){u.x=b.x;u.y=b.y;}else{b.x=u.x;b.y=u.y;}}}
function actHunter(sq,u,tg,t){const b=player,S=sq.state.stats;try{target=tg.id;}catch(_){}
 if(!u.qDone&&t>=u.born+.45+u.i*CFG.squad.stagger){u.qDone=true;if(tryQ()){S.volleys++;return;}}
 const cd=+b.attackCD||0;if(!(cd>0)){basicAttack();if(b.attackCD>cd)S.cloneShots++;}}
function stepHunter(sq,u,foes,dt,t){const C=CFG.squad,b=u.body,s=sq.slots[u.i]||sq.owner,px=u.x,py=u.y,dx=s.x-u.x,dy=s.y-u.y,d=Math.hypot(dx,dy);let moved=false;
 if(d>1e-4){const k=Math.min(C.speed*dt,d)/d,nx=u.x+dx*k,ny=u.y+dy*k;if(open(nx,ny)){u.x=nx;u.y=ny;moved=d>.05;}}
 carry(u,px,py,moved);if(moved)face(b,u.x-px,u.y-py);else face(b,Math.cos(sq.aim),Math.sin(sq.aim));
 const tg=nearestTo(u,G(()=>HEROES[HERO].range,8),foes);
 if(tg&&t>=u.born+.3){as(u,()=>actHunter(sq,u,tg,t));b.x=u.x;b.y=u.y;/* 분신은 자리를 지킨다 */}}
function stepShades(sq,t){const S=sq.state.stats;for(let i=sq.shades.length-1;i>=0;i--){const c=sq.shades[i];
 if(!c.done&&t>=c.hitAt){c.done=true;const e=c.e;if(e&&e.hp>0&&dmgOK(e)&&c.power>0){try{if(hitEnemy(e,c.power*CFG.shade.mul,{kind:'r952-shade',friendly:true,owner:'hero',r952:'shade',sourceHero:ALLY,attackKind9:'basic'}))S.shadeHits++;}catch(err){fail(err);}
   try{window.__STORYWORLD_BLOOD_R190__?.play?.('blood-burst',e.x,e.y,{k:.8,z:0});}catch(_){}}}
 if(t-c.t0>=c.life)sq.shades.splice(i,1);}}
function step(sq,dt){const t=T(),p=sq.owner,foes=foesNow();formation(sq,foes);
 for(const u of sq.units){if(!u.body){u.body=mkBody(p,u);if(!u.body)continue;}const b=u.body;for(const k of TIMERS)b[k]=Math.max(0,(+b[k]||0)-dt);
  try{if(u.kind===ALLY)stepSlayer(sq,u,foes,dt,t);else stepHunter(sq,u,foes,dt,t);}catch(e){fail(e);b.x=u.x;b.y=u.y;}
  u.prop.x=u.x;u.prop.y=u.y;}
 stepShades(sq,t);}

// ── 그리기(엔진 조형물 그리기 순서 안 — R720 배치 영웅과 같은 길) ──
const SLAYER_RGB='196,52,64',HUNTER_RGB='216,194,145';
function ringAt(q,rgb,k,pulse){const ui=G(()=>zoom,1),tile=G(()=>TILE,64);/* 시트가 아직 안 읽혔을 때만 쓰는 대신 그림 */
 ctx.globalAlpha=(.16+.05*pulse)*k;ctx.fillStyle='rgb('+rgb+')';ctx.beginPath();ctx.ellipse?.(q.x,q.y,tile*ui*.8,tile*ui*.4,0,0,TAU);ctx.fill();
 ctx.globalAlpha=.7*k;ctx.strokeStyle='rgb('+rgb+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse?.(q.x,q.y,tile*ui*.5,tile*ui*.25,0,0,TAU);ctx.stroke();}
// 발밑 소환 문(Dots 헌터 문 시트): 나타날 때 열리고(0-4), 머무는 동안 돌고(5-19), 사라질 때 닫힌다(20-23). 어두운 바닥에 묻히지 않게 보통 합성 + 더하기 합성 한 겹.
let asked=-9;
function gateAt(q,age,left,wide,al){const row=G(()=>readyImage(GATE.path),null),im=row&&row.image;if(!im){const n=Date.now();if(n-asked>1500){asked=n;try{const pr=ensureImages([GATE.path]);if(pr&&pr.catch)pr.catch(()=>{});}catch(_){}}return false;}
 const ui=G(()=>zoom,1),tile=G(()=>TILE,64),sc=tile*ui*wide/GATE.oval,C=GATE.cell;let f;
 if(left<.32)f=GATE.open+GATE.loop+Math.min(GATE.close-1,Math.floor((1-left/.32)*GATE.close));else if(age<.4)f=Math.min(GATE.open-1,Math.floor(age/.4*GATE.open));else f=GATE.open+Math.floor((age-.4)*12)%GATE.loop;
 const sx=(f%GATE.cols)*C,sy=Math.floor(f/GATE.cols)*C,dx=q.x-GATE.piv[0]*sc,dy=q.y-GATE.piv[1]*sc,op=ctx.globalCompositeOperation;
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=al;ctx.drawImage(im,sx,sy,C,C,dx,dy,C*sc,C*sc);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=al*.45;ctx.drawImage(im,sx,sy,C,C,dx,dy,C*sc,C*sc);ctx.globalCompositeOperation=op;ctx.globalAlpha=1;return true;}
function drawForm(sq){const t=T(),k=clamp((t-sq.t0)/.35,0,1)*clamp((sq.end-t)/CFG.fade,0,1),p=sq.owner,ui=G(()=>zoom,1);if(!(k>0)||sq.slots.length<CFG.squad.count)return;
 const Q=s=>project(s.x,s.y),o=Q(p),q=sq.slots.map(Q),beat=.5+.5*Math.sin(t*5);
 ctx.save();try{ctx.lineCap='round';
  for(const [w,a,dash] of [[7*ui,.2,null],[2*ui,.8,[8*ui,6*ui]]]){ctx.globalAlpha=a*k*(.8+.2*beat);ctx.strokeStyle='rgb('+HUNTER_RGB+')';ctx.lineWidth=w;if(dash)ctx.setLineDash?.(dash);
   for(const wing of [[0,2],[1,3]]){ctx.beginPath();ctx.moveTo(o.x,o.y);for(const i of wing)ctx.lineTo(q[i].x,q[i].y);ctx.stroke();}ctx.setLineDash?.([]);}
  /* 겨눈 쪽 화살촉(진의 앞) */const tip=project(p.x+Math.cos(sq.aim)*1.1,p.y+Math.sin(sq.aim)*1.1);ctx.globalAlpha=.5*k;ctx.lineWidth=1.6*ui;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(tip.x,tip.y);ctx.stroke();
 }finally{ctx.restore();}}
// R952-2 시트 칸 고르기(순수 함수). 베기: 분신 수명(kk 0→1) 동안 12칸, 분신이 베는 순간(0.1초)에 가장 진한 칸. 해산: 끝나기 전 dur 초 동안 12칸(마지막 칸은 빈칸).
function slashFrame(kk){if(!(kk>=0&&kk<1))return -1;const S=CFG.sheets.slash,h=clamp(.1/CFG.shade.life,.05,.9);return kk<h?Math.min(S.hit-1,Math.floor(kk/h*S.hit)):Math.min(S.frames-1,S.hit+Math.floor((kk-h)/(1-h)*(S.frames-S.hit)));}
function leaveFrame(left){const S=CFG.sheets.leave;if(!(left>0&&left<=S.dur))return -1;return Math.min(S.frames-1,Math.floor((1-left/S.dur)*S.frames));}
let askedSheet=-9;
function sheetAt(S,f,x,y,h,flip,al){if(f<0||!(al>0))return false;const row=G(()=>readyImage(S.path),null),im=row&&row.image;
 if(!im){const n=Date.now();if(n-askedSheet>1500){askedSheet=n;try{const pr=ensureImages([CFG.sheets.leave.path,CFG.sheets.slash.path]);if(pr&&pr.catch)pr.catch(()=>{});}catch(_){}}return false;}
 const cw=S.cell[0],ch=S.cell[1],sc=h/ch,sx=(f%S.cols)*cw,sy=Math.floor(f/S.cols)*ch;
 ctx.save();try{ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=al;ctx.drawImage(im,sx,sy,cw,ch,-S.piv[0]*sc,-S.piv[1]*sc,cw*sc,ch*sc);
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=al*.35;ctx.drawImage(im,sx,sy,cw,ch,-S.piv[0]*sc,-S.piv[1]*sc,cw*sc,ch*sc);}finally{ctx.restore();}return true;}
function bodyH(){return G(()=>actorHeight(),0)||G(()=>TILE,64)*G(()=>zoom,1)*1.5;}
function drawBody(u,alpha){const b=u.body;if(!(alpha>0))return;ctx.save();try{if(alpha<.999)ctx.globalAlpha=(ctx.globalAlpha??1)*alpha;as(u,()=>drawHero());u.sq.state.stats.draws++;}finally{ctx.restore();}}
function drawSlashes(sq){const t=T(),k=clamp((sq.end-t)/CFG.fade,0,1),H=bodyH();/* 분신 베기 궤적(HS-03): 분신과 적 사이 몸 가운데 높이, 적이 화면 왼쪽이면 좌우 반전 */
 for(const c of sq.shades){const kk=(t-c.t0)/c.life,f=slashFrame(kk);if(f<0)continue;const a=project(c.x,c.y),e=c.e&&isFinite(c.e.x)?project(c.e.x,c.e.y):a,left=e.x<a.x-.5;
  if(sheetAt(CFG.sheets.slash,f,(a.x+e.x)/2,(a.y+e.y)/2-H*.48,H*1.5,left,.95*k))sq.state.stats.slashDraws++;}}
function drawUnit(p){if(p.r952Form){const sq=p.r952Squad;if(live.includes(sq))drawForm(sq);return;}
 if(p.r952Fx){const sq=p.r952Squad;if(live.includes(sq))drawSlashes(sq);return;}
 const u=p.r952Unit;if(!alive(u)||!u.body)return;const sq=u.sq,b=u.body,t=T(),k=clamp((t-u.born)/.3,0,1)*clamp((sq.end-t)/CFG.fade,0,1),q=project(u.x,u.y),own=u.kind===ALLY;
 ctx.save();try{if(!gateAt(q,t-u.born,sq.end-t,own?1.5:1.05,own?.95:.8))ringAt(q,own?SLAYER_RGB:HUNTER_RGB,k,Math.sin(t*3+u.i));ctx.globalAlpha=1;}catch(e){fail(e);}finally{ctx.restore();}
 const pose=G(()=>heroArt[b.hero].idle.front,null);if(!pose||!G(()=>readyImage(pose),null)){if(!(u.loadAt>t-3)){u.loadAt=t;try{const pr=ensureImages(heroPaths(b.hero));if(pr&&pr.catch)pr.catch(()=>{});}catch(_){}}return;}
 b.x=u.x;b.y=u.y;drawBody(u,(own?1:.8)*k);
 if(own&&sq.shades.length){const keep={x:b.x,y:b.y,direction:b.direction,attackAnim:b.attackAnim,moving:b.moving,invincible:b.invincible};
  try{for(const c of sq.shades){const kk=(t-c.t0)/c.life;if(kk<0||kk>=1)continue;b.x=c.x;b.y=c.y;b.direction=c.dir;b.attackAnim=Math.max(.05,.24*(1-kk));b.moving=false;b.invincible=0;drawBody(u,.66*(1-kk*kk)*k);}}finally{Object.assign(b,keep);}
}
 /* 해산 덧그림(HS-02): 끝나기 전 0.8초 동안 몸 위에서 깃털이 위로 흩어진다(몸은 그 사이 흐려진다) */
 try{const f=leaveFrame(sq.end-t);if(f>=0){const H=bodyH()*(own?2:1.7);if(sheetAt(CFG.sheets.leave,f,q.x,q.y,H,u.i%2===1,own?1:.85))sq.state.stats.leaveDraws++;}}catch(e){fail(e);}}

// ── 엔진 연결(이 파일이 가장 바깥에서 감싼다) ──
let baseAP=null,lastT=null;const rawPower=()=>baseAP?baseAP():G(()=>attackPower(),0);
function install(){
 if(typeof attackPower==='function'){baseAP=attackPower;attackPower=function(...a){const v=baseAP.apply(this,a),p=P();return isSummon(p)&&fin(v)?v*(+p.r952Mul||1):v;};}
 if(typeof basicAttack==='function'){const base=basicAttack;basicAttack=function(...a){const p=P();if(!on||!isOwner(p))return base.apply(this,a);const cd0=+p.attackCD||0,r=base.apply(this,a);
   try{if(P()===p&&p.attackCD>cd0)onSwing(p);}catch(e){fail(e);}return r;};}
 if(typeof delay==='function'){const base=delay;delay=function(sec,fn,...r){const u=top();if(u&&typeof fn==='function'){const b=u.body,f=fn;fn=function(...x){if(!alive(u)||u.body!==b)return;return as(u,()=>f.apply(this,x));};}return base.call(this,sec,fn,...r);};}
 if(typeof sound==='function'){const base=sound;sound=function(...a){const u=top();if(u&&u.kind===HERO&&u.i>0)return;return base.apply(this,a);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
   try{const t=T(),adv=lastT==null?0:clamp(t-lastT,0,.1);lastT=t;if(live.length){for(const sq of live.slice()){if(!valid(sq)||T()>=sq.end){end(sq);continue;}syncProps(sq);if(adv>0&&!paused())step(sq,Math.min(adv,.1));}}}catch(e){fail(e);}return r;};}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p&&p.r952Prop){try{drawUnit(p);}catch(e){fail(e);}return;}return base.apply(this,[p,...a]);};}
 // R720 has(id): "그 영웅이 지금 이 판에 있는가" — 영웅별 그리기 덧씌우기(슬레이어 시트·헌터 휘두르기)가 다른 몸을 그리는 차례를 가릴 때 묻는다. 소환된 영웅도 같게 답한다.
 try{const R7=window.__STORYWORLD_HERO_DEFENSE_R720__;if(R7&&typeof R7.has==='function'){const has0=R7.has;window.__STORYWORLD_HERO_DEFENSE_R720__=Object.freeze({...R7,has:id=>has0(id)===true||present(id)});}}catch(e){fail(e);}}
function present(id){if(!id||!live.length)return false;for(const sq of live){if(id===HERO)return true;for(const u of sq.units)if((u.kind===ALLY?ALLY:HERO)===id)return true;}return false;}
try{install();}catch(e){fail(e);}

function set(v){on=v!==false;if(!on)endAll();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
function force(tier,body){if(!NAMES[tier])return false;const s=st(body||P());if(!s)return false;s.force=tier;return true;}
function inspect(body){const s=st(body||P(),false)||fresh(),t=T(),sq=s.squad;
 return {revision:REV,on,active:!!sq,tier:sq?sq.tier:null,name:sq?NAMES[sq.tier]:null,left:sq?Math.max(0,+(sq.end-t).toFixed(3)):0,cooldown:Math.max(0,+(s.readyAt-t).toFixed(3)),aim:sq?sq.aim:null,
  units:sq?sq.units.map(u=>({kind:u.kind,i:u.i,x:u.x,y:u.y,hero:u.kind===ALLY?ALLY:HERO,dir:u.body?.direction||null,anim:+u.body?.attackAnim||0})):[],slots:sq?sq.slots.map(q=>({x:q.x,y:q.y})):[],shades:sq?sq.shades.length:0,
  stats:{...s.stats,procs:{...s.stats.procs},casts:{...s.stats.casts}},squads:live.length,errors,lastError};}
window.__STORYWORLD_HUNTER_SQUAD_R952__=Object.freeze({revision:REV,config:CFG,names:Object.freeze({...NAMES}),on:()=>on,set,force,inspect,present,
 bodies:()=>live.flatMap(sq=>sq.units.map(u=>u.body).filter(Boolean)),pure:Object.freeze({pickTier,slotsFor,slashFrame,leaveFrame})});
})();
