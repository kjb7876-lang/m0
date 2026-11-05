/* R356 카이로 오마주 — 사용자 2026-11-05 "https://kjb7872.itch.io/kairodf 카이로노미콘 예전 개발버전, 서사 말고 효과음·배경음·스킬구조 오마주 느낌으로 참고만, 명맥만"
 * + 방향 수정 "카이로 오마주는 윤서하 쪽에 특수 패시브를 만들어 그쪽으로 스킬 구조 오마주 — 시간 제어 능력으로".
 * 예전 시제품(카이로노미콘: 시간해방전, 사용자 본인 작품)에서 서사는 가져오지 않고 구조·소리 결만 옮긴다. 시제품의 소리 파일은 싣지 않고 Web Audio 로 새로 합성한다.
 *  1) 윤서하 특수 패시브 '시간 제어'(시제품 E '카이로스 순간' = 보스 예고를 아슬아슬하게 피하면 시간이 늦춰지고 모든 스킬 대기시간이 조금 돈다):
 *     적 예고(위험지대) 안에 있다가 발동 직전 0.7초 안에 빠져나가면 발동, 재사용 7초.
 *     · 반경 4칸 안 적 투사체를 0.7초 멈춤(사라지는 시각도 0.7초 미룸) · 반경 4칸 안 적의 다음 공격을 0.7초 늦춤 · 블링크·특수기 대기 0.7초 감소.
 *     · 연출: 프레임 띠 10장(scripts/r356-seoha-time-sheet.py 결정적 생성) — 초침이 시계 방향으로 도는 십자가, 되감기 잔상, 퍼지다 멈추는 서리. 윤서하 2색(아이스 블루+실버)만,
 *       마법진·육망성·원형 고리는 쓰지 않는다(SKILL.md 11절). 멈춘 적 투사체에는 같은 띠의 서리 프레임을 작게 얹는다.
 *  2) 스토리 카이로 구역(STORY kair01~kair10)에서만: 구역에 들어설 때 낮은 쇠종 한 번 + 초침 네 번(시제품 배경음 'The Last Movement of Iron' 의 E단조·느린 박을 닮게),
 *     가까운 적 예고가 쌓이는 동안 금속 초침 소리가 점점 빨라진다(시제품 time-acceleration-clock 결). 클래식 배경음(R195·R308·R353 표)은 건드리지 않는다.
 * 게임이 연 audioContext·masterGain 을 빌려 쓰고, 효과음 끔·음량 0·탭 숨김이면 소리를 내지 않는다. 협동 손님(guest)은 판정을 바꾸지 않는다.
 * 끄기: localStorage['storyworld.r356.kairo']='0'. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
const r62Major=e=>!!e&&!e.r61Summoned&&!!(e.boss||e.midboss||e.persona||e.cosmic||e.trial);
if(window.__STORYWORLD_KAIRO_HOMAGE_R356__)return;
const REV='R356-kairo-homage-1',KEY='storyworld.r356.kairo';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const T=Object.freeze({window:.7,cooldown:7,freeze:.7,delay:.7,refund:.7,radius:4,tickRange:6,stingGap:45});
const stats={triggers:0,frozen:0,delayed:0,refunds:0,escapes:0,sounds:{},stings:0,ticks:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const log=[];const note=(kind,extra)=>{log.push({kind,at:typeof time==='number'?+time.toFixed(2):0,...(extra||{})});if(log.length>48)log.shift();};
const now=()=>typeof time==='number'?time:0;
const R=()=>typeof room==='object'&&room?room:null;
const P=()=>typeof player==='object'&&player?player:null;
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off'||m==='host';}catch(_){return true;}};
const kairo=()=>{const r=R();return !!(r&&r.layer==='STORY'&&/^kair\d\d$/.test(String(r.id||''))&&!r.samongR103&&!r.samongR115);};
const seoha=()=>{const p=P();return !!(p&&p.hero==='seoha'&&p.hp>0);};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// ---------- 소리(합성, 시제품 파일 미사용) ----------
function A(){try{return typeof audioContext!=='undefined'&&audioContext&&audioContext.state==='running'?audioContext:null;}catch(_){return null;}}
function audible(){if(!on)return false;try{if(typeof settings!=='undefined'&&(settings.sound===false||!(+settings.volume>0)))return false;if(document.hidden)return false;}catch(_){}return true;}
function out(C){try{return typeof masterGain!=='undefined'&&masterGain&&masterGain.context===C?masterGain:C.destination;}catch(_){return C.destination;}}
function vol(){try{return Math.max(0,Math.min(1,typeof settings!=='undefined'?+settings.volume||0:.7));}catch(_){return .7;}}
let noise=null;function noiseBuf(C){if(noise&&noise.sampleRate===C.sampleRate)return noise;const n=C.sampleRate*.5|0,b=C.createBuffer(1,n,C.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return noise=b;}
function env(C,dest,t,a,d,peak){const g=C.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);g.connect(dest);return g;}
// 합성 소리 수명: 엔진 stopEffects(탭 숨김·효과음 끔·볼륨 0)에 같이 끊긴다. sfxLive 에 넣으면 엔진 동시 재생 상한을 잡아먹으므로 따로 들고 있다가 stopEffects 를 감싸 끊는다.
const live=new Set();let bucket=null;
function hush(){for(const v of live){for(const s of v.src){try{s.stop();}catch(_){}}try{v.g.disconnect();}catch(_){}}const n=live.size;live.clear();clearTimeout(stingTimer);stingTimer=null;return n;}
function tone(C,dest,t,fq,d,peak,type='sine'){const o=C.createOscillator();bucket?.push(o);o.type=type;o.frequency.setValueAtTime(fq,t);o.connect(env(C,dest,t,.004,d,peak));o.start(t);o.stop(t+d+.06);}
function click(C,dest,t,fq,d,peak){const s=C.createBufferSource(),f=C.createBiquadFilter();bucket?.push(s);s.buffer=noiseBuf(C);f.type='bandpass';f.frequency.value=fq;f.Q.value=6;s.connect(f);f.connect(env(C,dest,t,.002,d,peak));s.start(t);s.stop(t+d+.05);}
const SND={
 // 초침: 1.5kHz 금속 딸깍(시제품 시계 소리 결)
 tick(C,d,t,k=1){click(C,d,t,1500,.03,.05*k);tone(C,d,t,1508,.035,.012*k,'triangle');},
 // 시간 제어: 맑은 종 두 겹(E6·B6)과 거꾸로 감기는 초침 둘
 chime(C,d,t){for(const[fq,p,dd]of[[1318.5,.035,.9],[1975.5,.018,.7],[3290,.006,.35]])tone(C,d,t,fq,dd,p);SND.tick(C,d,t+.08,.7);SND.tick(C,d,t+.2,.5);},
 // 구역 입장: 낮은 쇠종(E2·B2·E3, 비조화 배음) + 1초 간격 초침 넷
 toll(C,d,t){for(const[fq,p,dd]of[[82.4,.06,3.2],[123.5,.03,2.6],[164.8,.025,2.2],[226.6,.012,1.4]])tone(C,d,t,fq,dd,p);click(C,d,t,420,.12,.03);for(let i=1;i<=4;i++)SND.tick(C,d,t+.6+i*1.0,.8-i*.12);}};
function play(kind,...a){stats.sounds[kind]=(stats.sounds[kind]||0)+1;const C=audible()?A():null;note('sound',{kind,played:!!C});if(!C)return false;
 const v={g:null,src:[]};bucket=v.src;try{const g=v.g=C.createGain();g.gain.value=vol();g.connect(out(C));live.add(v);SND[kind](C,g,C.currentTime+.01,...a);setTimeout(()=>{live.delete(v);try{g.disconnect();}catch(_){}},5000);return true;}catch(e){fail(e);return false;}finally{bucket=null;}}
if(typeof stopEffects==='function'){const base=stopEffects;stopEffects=function(...a){try{hush();}catch(e){fail(e);}return base.apply(this,a);};}

// ---------- 위험지대 판정: 종류마다 엔진이 실제로 피해를 줄 때 쓰는 판정·착탄 시각을 그대로 쓴다 ----------
// (index.html) 바탕 tickHazards(323): beam=capsule+.25, field=원+0, 그 밖(R241 운석·R251 손·R330 재해…)=distance<radius, 착탄 age>=warning
//  story-pattern(3060~3070): row150.impactAt 에 storyPatternTouches5 = footprintContains154(lockPatternFootprint154(h),x,y); row150 이 없거나 취소면 때리지 않는다
//  medical20(6638~6677): 반경 없이 footprint154 만, pulse() = clearLine(origin,target)·clearLine(target,발)·footprintContains154(g,x,y-.15,.25), 착탄 medical20.impactAt(도구는 발사 시각)
//  R61 던진 장판(10597·10647): damage 0·예산 remaining, footprintContains154(genericFootprint154(h),x,y-.15,.12)&&clearLine, 착탄 r61Field.impactAt
//  R62 공성 장판(10792·10801): damage 0, 엔진이 내보인 __STORYWORLD_BOSS_FIELDS_R62__.touches(h,p)(칸·안전지대·벽), 착탄 r62Field.impactAt
//  피해 없는 표식(R74 잔류·R330 상태 지대·페르소나 예고 등 damage 0)은 보지 않는다.
const fin=v=>Number.isFinite(v);
function landingAt(h){const r=h.row150;if(r&&fin(r.impactAt))return r.impactAt;const m=h.medical20||h.r61Field||h.r62Field;return m&&fin(m.impactAt)?m.impactAt:null;}
function hostile(h){if(!h||h.friendly||!fin(h.warning)||!fin(h.age)||h.age>=h.life)return false;
 if(h.medical20)return !h.medical20.cancelled&&h.medical20.budget>0;
 if(h.r61Field)return !h.r61Field.action?.cancelled&&h.r61Field.remaining>0;
 if(h.r62Field)return !h.r62Field.remote;
 if(h.storyPattern5&&(!h.row150||h.row150.stage==='cancel'))return false;
 return h.damage>0;}
// 착탄 순간에 실제로 터졌는가(발사되지 않고 취소된 캐스트는 탈출로 치지 않는다)
function fired(h){if(h.medical20)return h.medical20.released&&!h.medical20.cancelled;if(h.r61Field)return h.r61Field.released!==false&&!h.r61Field.action?.cancelled;if(h.r62Field)return h.r62Field.released!==false&&!(h.life<=0);if(h.row150)return h.row150.stage!=='cancel';return true;}
function inside(h,p){try{const x=p.x,y=p.y;
 if(h.medical20){const m=h.medical20,q={x,y:y-.15},line=typeof clearLine==='function'?clearLine:()=>true;
  if(m.kind==='tools'){if(!line(m.origin,q))return false;}else if(!line(m.origin,m.target)||!line(m.target,q))return false;
  return !!footprintContains154(h.footprint154,q.x,q.y,.25);}
 if(h.r62Field){const api=window.__STORYWORLD_BOSS_FIELDS_R62__;return typeof api?.touches==='function'?!!api.touches(h,p):Math.hypot(x-h.x,y-.15-h.y)<=(h.radius||0)+.12;}
 if(h.r61Field)return !!footprintContains154(genericFootprint154(h),x,y-.15,.12)&&(typeof clearLine!=='function'||!!clearLine({x:h.x,y:h.y},p));
 if(h.storyPattern5)return !!footprintContains154(lockPatternFootprint154(h),x,y);
 if(h.type==='beam'||h.type==='field')return !!footprintContains154(genericFootprint154(h),x,y,h.type==='beam'?.25:0);
 return Math.hypot(x-h.x,y-h.y)<h.radius;}catch(e){fail(e);return false;}}

// ---------- 윤서하 '시간 제어' ----------
// 재사용 기한은 플레이어 객체별로 둔다(newGame·restoreSave 는 새 player 를 만든다). 시간이 거꾸로 가면(새 게임 time=0·이른 세이브) 남은 대기가 7초를 넘으므로 무효로 본다.
const readyAt=new WeakMap(),frozen=new Map();// projectile -> {vx,vy,until}
function readyIn(p){const r=p?readyAt.get(p):undefined,t=now();if(r===undefined||r-t>T.cooldown){if(p)readyAt.delete(p);return 0;}return Math.max(0,r-t);}
// 협동 호스트: 살아 있는 참가자 각각을 따로 본다(손님 윤서하도 받는다). 손님 화면은 판정을 바꾸지 않는다.
const coop=()=>{try{return window.__STORYWORLD_COOP_SIM_R62__||null;}catch(_){return null;}};
function people(){const c=coop();try{if(c?.mode?.()==='host'){const l=c.livingPlayers?.();if(Array.isArray(l)&&l.length)return l.filter(Boolean);}}catch(_){}const p=P();return p?[p]:[];}
function mine(p){const c=coop();try{if(c?.mode?.()==='host'){const l=c.localPlayer?.();return !l||l===p;}}catch(_){}return true;}
const isSeoha=p=>!!(p&&p.hero==='seoha'&&p.hp>0);
// 적 '다음 공격' 0.7초 늦춤: 엔진은 근접 공격(e.attack)·원거리 예비동작(e.rangedWindup)·R61/R62 동작(e.r61Action)이 끝날 때 cd 를 새로 덮어쓴다(index.html 1125·1126·R52·R61).
// 그래서 공격 중이면 미뤄 두었다가(e.r356Delay) 동작이 끝난 뒤 첫 tickEnemies 앞에서 건다. 기다리던 적(cd<0)·쉬는 적(rest)도 실제 다음 공격 시각에서 0.7초 늦춘다.
// R62 공성 보스는 cd 가 아니라 자기 일정(ownerState.next), R61 던지기는 FIELDS_R61.state(e).next 로 시작하므로 둘 다 민다.
const busy=e=>!!(e.attack||e.rangedWindup>0||e.r61Action);
function settle(e){const d=e.r356Delay;if(!(d>0))return;delete e.r356Delay;if(e.hp<=0)return;const t=now();
 e.cd=Math.max(0,+e.cd||0,+e.rest||0)+d;
 try{const f=window.__STORYWORLD_BOSS_FIELDS_R62__;/* R62 은 major 를 내보내지 않는다 — index.html R62 의 major(e) 와 같은 조건을 그대로 쓴다 */if(f?.ownerState&&r62Major(e)){const s=f.ownerState(e);if(s&&fin(s.next))s.next=Math.max(s.next,t)+d;}}catch(err){fail(err);}
 /* R61 던지기(echo·prop·field)는 cd 가 아니라 FIELDS_R61.state(e).next 로 시작한다(index.html R61 tickEnemies) — 그 일정도 민다 */
 try{const g=window.__STORYWORLD_FIELDS_R61__;if(g?.state){const s=g.state(e);if(s&&fin(s.next))s.next=Math.max(s.next,t)+d;}}catch(err){fail(err);}}
function trigger(reason='escape',who=null){const p=who||P();if(!on||!p||!isSeoha(p))return false;if(readyIn(p)>0)return false;readyAt.set(p,now()+T.cooldown);stats.triggers++;
 if(solo()){
  for(const b of(typeof projectiles!=='undefined'&&Array.isArray(projectiles)?projectiles:[])){if(!b||b.dead||b.friendly||frozen.has(b)||!Number.isFinite(b.vx))continue;if(dist(b,p)>T.radius)continue;
   frozen.set(b,{vx:b.vx,vy:b.vy,until:now()+T.freeze});b.vx=0;b.vy=0;if(Number.isFinite(b.life))b.life+=T.freeze;stats.frozen++;}
  const r=R();for(const e of(r?.enemies||[])){if(!e||e.hp<=0||dist(e,p)>T.radius||!Number.isFinite(e.cd))continue;e.r356Delay=T.delay;stats.delayed++;if(!busy(e))settle(e);}
  for(const k of['blinkCD','specialCD'])if(Number.isFinite(p[k])&&p[k]>0){p[k]=Math.max(0,p[k]-T.refund);stats.refunds++;}}
 note('time-control',{reason,frozen:frozen.size,hero:p.coopIdR62||'local'});
 // 글자·연출은 그 참가자 자리에(손님은 자기 판정이 없어 호스트 스냅숏으로 받는다), 종소리는 이 화면의 주인공일 때만
 try{if(typeof floatText==='function')floatText('시간 제어',p.x,p.y,'#bfe6ff');}catch(e){fail(e);}
 try{if(typeof effects!=='undefined'&&Array.isArray(effects))effects.push({type:'r356-time',r356:true,x:p.x,y:p.y,age:0,life:T.freeze,...(p.coopIdR62?{coopPlayerR62:p.coopIdR62}:{})});}catch(e){fail(e);}
 if(mine(p))play('chime');return true;}
function thaw(){const t=now();for(const[b,s]of frozen){if(b.dead||t>=s.until||t<s.until-T.freeze-1){if(!b.dead){b.vx=s.vx;b.vy=s.vy;}frozen.delete(b);}else{b.vx=0;b.vy=0;}}}

// ---------- 매 틱: 위험지대 감시 ----------
// 엔진 저작 캐스트(row150)는 예고가 releaseAt 에 끝나도 피해는 impactAt(비행 0.9~1.8초 뒤)에 들어간다 → 판정 시각을 impactAt 으로 본다.
// 착탄 시각: 엔진 저작 캐스트(row150)·medical20·R61/R62 장판은 예고가 끝나도(warning) 피해는 각자의 impactAt 에 들어간다 → 그 시각을 본다.
// 엔진 tick() 은 time 을 먼저 올리고 tickHazards 를 부르므로 감싼 안에서 time 은 그대로다. before() 는 이번 틱 구간의 시작(time-dt) 기준으로 보아
// impactAt 을 넘는 틱에도 그 위험지대를 계속 붙잡고, after() 가 지금 time 으로 착탄을 확인한다. 일반 예고는 base 가 h.age 를 올리므로 그대로 둔다.
const pending=(h,t)=>{const L=landingAt(h);return L!==null?t<L:h.age<h.warning;};
const startedAt=h=>h.row150?.warningAt??h.medical20?.start??h.r61Field?.action?.start??h.r62Field?.start;
const ripe=(h,t)=>{const L=landingAt(h);if(L===null)return Math.max(0,Math.min(1,h.age/Math.max(.05,h.warning)));const s=startedAt(h)??t-h.age;return Math.max(0,Math.min(1,(t-s)/Math.max(.05,L-s)));};
const lastIn=new WeakMap();// hazard -> Map(participant -> 마지막으로 안에 있던 time)
let tickAt=0,nextTick=0,lastZone=null,stingAt=-1e9,stingTimer=null;
function before(dt){const list=[];if(typeof hazards==='undefined'||!Array.isArray(hazards))return list;const t=now(),t0=t-(Number.isFinite(dt)&&dt>0?dt:0),ps=people();
 for(const h of hazards){if(!hostile(h)||!pending(h,t0))continue;list.push(h);for(const p of ps){if(!isSeoha(p)||!inside(h,p))continue;let m=lastIn.get(h);if(!m)lastIn.set(h,m=new Map());m.set(p,t);}}return list;}
function after(warn){const t=now();
 for(const p of people()){if(!isSeoha(p))continue;for(const h of warn){if(pending(h,t)||!fired(h))continue;const was=lastIn.get(h)?.get(p);if(was===undefined||t-was>T.window)continue;if(inside(h,p))continue;stats.escapes++;trigger('escape',p);break;}}
 // 카이로 구역: 가까운 예고가 무르익을수록 초침이 빨라진다
 const p=P();if(p&&kairo()&&on){let best=null,bd=1e9;for(const h of warn){if(!pending(h,t))continue;const d=dist(h,p);if(d<T.tickRange&&d<bd){bd=d;best=h;}}
  if(best){const u=ripe(best,t),gap=.34-.22*u;if(t>=nextTick&&t-tickAt>=.1){tickAt=t;nextTick=t+gap;stats.ticks++;play('tick',.55+.45*u);}}}}
function zoneWatch(){const r=R(),id=r?String(r.id||'')+':'+r.layer:null;if(id===lastZone)return;lastZone=id;if(!kairo())return;
 const wall=performance.now()/1000;if(wall-stingAt<T.stingGap)return;stingAt=wall;clearTimeout(stingTimer);stingTimer=setTimeout(()=>{if(kairo()){stats.stings++;play('toll');}},800);}
if(typeof tickEnemies==='function'){const base=tickEnemies;tickEnemies=function(...a){try{if(on){const r=R();for(const e of(r?.enemies||[]))if(e&&e.r356Delay>0&&!busy(e))settle(e);}}catch(e){fail(e);}return base.apply(this,a);};}
if(typeof tickHazards==='function'){const base=tickHazards;tickHazards=function(...a){let warn=[];try{if(live.size&&!audible())hush();if(on){thaw();warn=before(a[0]);zoneWatch();}}catch(e){fail(e);}const res=base.apply(this,a);try{if(on)after(warn);}catch(e){fail(e);}return res;};}

// ---------- 연출: 프레임 띠(scripts/r356-seoha-time-sheet.py, 384×384 10장) — 초침이 도는 십자가·되감기 잔상·멈추는 서리 ----------
const SHEET={path:'assets/r356/seoha-time-control.webp',cell:384,frames:10,img:null,ok:false,err:false};
function sheet(){if(SHEET.img||typeof Image!=='function')return SHEET;try{const im=new Image();im.decoding='async';im.onload=()=>{SHEET.ok=true;};im.onerror=()=>{SHEET.err=true;};
 im.src=typeof urlFor==='function'?urlFor(SHEET.path):'./'+SHEET.path;SHEET.img=im;}catch(e){fail(e);}return SHEET;}
function drawTime(e){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;const p=e.coopPlayerR62?null:P(),q=project(p?p.x:e.x,p?p.y:e.y),k=Math.max(0,Math.min(.999,e.age/e.life)),h=typeof actorHeight==='function'?actorHeight():60;
 const sh=sheet();if(!sh.ok)return;const reduced=typeof settings!=='undefined'&&settings.reducedMotion;const f=reduced?4:Math.min(sh.frames-1,Math.floor(k*sh.frames)),size=h*1.8;
 ctx.save();try{ctx.globalCompositeOperation='screen';/* 영웅 몸을 가리지 않게 머리 위(발에서 1.3×키)에 둔다 */ctx.globalAlpha=.9;ctx.drawImage(sh.img,f*sh.cell,0,sh.cell,sh.cell,q.x-size/2,q.y-h*1.3-size/2,size,size);
  // 멈춘 적 투사체: 같은 띠의 서리 프레임(5)을 작게
  for(const[b]of frozen){if(b.dead)continue;const bq=project(b.x,b.y),s2=h*.8;ctx.globalAlpha=.55;ctx.drawImage(sh.img,5*sh.cell,0,sh.cell,sh.cell,bq.x-s2/2,bq.y-h*.3-s2/2,s2,s2);}}
 catch(err){fail(err);}finally{ctx.restore();}}
sheet();
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.r356){try{if(on)drawTime(e);}catch(err){fail(err);}return;}return base.call(this,e,...a);};}

function set(v){on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}if(!on){for(const[b,s]of frozen)if(!b.dead){b.vx=s.vx;b.vy=s.vy;}frozen.clear();}return on;}
window.__STORYWORLD_KAIRO_HOMAGE_R356__=Object.freeze({revision:REV,tuning:T,on:()=>on,set,trigger,play,hush,isKairo:kairo,isSeoha:seoha,
 inspect:()=>({revision:REV,on,liveSounds:live.size,kairo:kairo(),seoha:seoha(),readyIn:+readyIn(P()).toFixed(2),frozen:frozen.size,audio:!!A(),stats:JSON.parse(JSON.stringify(stats)),log:log.slice(),lastError})});
})();
