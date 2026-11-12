// R425 슬레이어 새 R '적혈 십자가' · Q '적혈 회오리' — 사용자 2026-11-08 09:40(손그림 첨부)
//  "슬레이어 쪽에 큰 적혈 십자가가 생기고 주변에 좌우 각각 2개의 작은 적혈 십자가가 생긴 다음 각 십자가 있는 범위에 십자가 크기에 비례한 큰 피 폭발이
//   일어난 뒤 슬레이어에게 초사이어인 적혈 오라 같은 게 생긴 다음에 7초간 자동으로 적을 추적하여 공격 시 적혈 폭발이 추가 연쇄적으로 일어나도록 스플래쉬,
//   기존 허리케인 R 스킬은 큰 적혈 회오리가 검기처럼 나가는 걸로 해서 적을 관통하면서 출혈 생기게 하는 효과를 일으키면서 Q 스킬로 변경".
//  09:33 "궁극 사용 시 그냥 좌우 반전으로 회전하는 거 표현, 이미지를 종이처럼 뒤집지 말고" → 회전은 몸 그림을 좌·우로만 번갈아 뒤집는다(가로 폭 줄이기 없음).
//  09:47 상시 규칙: 십자가는 위가 짧고 아래가 긴 정십자, 절대 거꾸로 되지 않게 → 십자가는 회전 없이 똑바로만 그린다.
//
//  R(엔진 73a '피의 난도질' 슬롯 r, 재사용 대기 12.5초 그대로): 엔진 시전을 그대로 받아(쿨다운·자세·기록) 그 7번의 둘레 베기 피해만 이 연출로 바꾼다.
//   0.00초 큰 십자가(영웅 키 2.6배, 영웅 몸 위) + 좌·우 각 2개 작은 십자가(키 1.3배, 화면 좌상·좌하·우상·우하 약 2.3칸)가 0.35초에 솟는다.
//   0.55초 십자가 크기에 비례한 피 폭발: 큰 것 반경 3.2칸 ×2.6, 작은 것 반경 1.7칸 ×1.1(엔진 R 위력 attackPower 기준, 옛 7회 ×1.0 과 비슷한 규모).
//   0.75초부터 7초 적혈 오라(EGO 오라와 같은 방식, 피 색): 방향키·스틱 입력이 없으면 9칸 안 가장 가까운 적을 쫓아가 기본 공격하고,
//   그동안 영웅 공격이 피해를 줄 때마다 그 적 자리에 작은 적혈 폭발(반경 1.5칸 ×0.45) → 0.12초 뒤 2.6칸 안 다른 적 하나로 한 번 더 이어진다(×0.3).
//  Q(엔진 special '종결 강타'를 슬레이어만 대신, 재사용 대기·위력 식은 엔진과 같다): 0.32초 제자리 회전(좌·우 반전) 뒤
//   R366 피의 회오리 그림이 겨눈 쪽으로 0.95초 동안 8.5칸 날아간다(관통, 적마다 한 번 ×0.9) + 출혈 4초(0.8초마다 ×0.07, 5회, 피 방울).
//  그림: 십자가 = fx-sprites-r106 'cross'(Dots 협업 프레임 시트가 아닌 물들인 단일 그림 — 시트가 오기 전 임시), 폭발 = R190 피 터짐 시트(CC0 프레임),
//   회오리 = R366 시트. 판정은 엔진 hitEnemy 로만 준다. 끄기: localStorage['storyworld.r425.slayer']='{"on":false}' (옛 R·Q 로 돌아감)
//  12:53 "슬레이어 토네이도 디아블로 핏빛 휠윈드 느낌" → 분위기만 참고한다(다른 게임의 그림·코드·소리는 쓰지 않는다). Q 를 도는 피 소용돌이로:
//   시전 0.32초: 영웅이 0.05초마다 좌·우 반전으로 빠르게 돌고, 허리·가슴 높이 피 베기 고리 2겹이 돈다(뒤쪽 반은 몸 뒤, 앞쪽 반은 몸 앞) + 발밑 피 웅덩이.
//   날아가는 회오리: R366 붓 그림을 키 2.05배로 키우고 반 박자 어긋난 그림 한 겹을 덧셈으로 겹쳐(젖은 광택·밀도) 진하게, 높이 5단 나선으로 도는
//   피 베기 자국(어두운 몸 + 밝은 날), 피 안개, 원심력으로 튀어 나가 떨어져 번지는 피 방울, 발밑 피 웅덩이·바닥 베기 고리, 지나간 자리 핏자국.
//   피해·시간·경로·재사용 대기는 그대로(그림만). 코드로 조립한 임시 그림이다 — Dots 프레임 시트가 오면 바꾼다. 저사양(lowFx)은 고리·방울·자국 수를 줄인다.
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_BLOOD_R425__)return;
const REV='R425-slayer-blood-2',KEY='storyworld.r425.slayer',HERO='slayer';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={rCasts:0,rBlocked:0,bursts:0,chains:0,auraFrames:0,chaseSteps:0,autoSwings:0,qCasts:0,qHits:0,bleedTicks:0,flips:0,spinFrames:0,vortexFrames:0,sheetPasses:0,drops:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const AH=()=>typeof actorHeight==='function'?actorHeight():54;
const isHero=()=>typeof player==='object'&&player?.hero===HERO&&player.hp>0;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const SP=()=>window.__STORYWORLD_FX_SPRITES_R106__;
const BLOOD={a:[120,6,14],b:[236,60,48]},DEEP={a:[70,0,8],b:[200,20,30]};
const TAU=Math.PI*2;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
let warmed=false;function warm(){const S=SP();if(!S?.warm)return;warmed=true;try{S.warm(BLOOD,['spark','slashwide','glow','slashline','cross','flare','flame','spike']);S.warm(DEEP,['petal','slashwide','glow','smoke','orb','cross']);}catch(e){fail(e);}}
const live=()=>{try{return typeof liveEnemies==='function'?liveEnemies():(room?.enemies||[]).filter(e=>e.hp>0);}catch(_){return [];}};
const coolK=()=>{let f=1;try{f*=+window.__STORYWORLD_PROGRESSION_R62__?.factors?.()?.cooldown||1;}catch(_){}try{const U=window.__STORYWORLD_UPGRADES_R169__,pr=U?.inspect?.()?.prefs;if(pr&&pr.square&&pr.boost!==false&&solo())f*=+U.ratios?.()?.cool||1;}catch(_){}return f>0&&f<=1.5?f:1;};
const seeLine=(a,b)=>{try{return typeof clearLine!=='function'||clearLine(a,b);}catch(_){return true;}};
const ego=()=>{try{return !!window.__STORYWORLD_EGO151__?.inspect?.()?.state?.active;}catch(_){return false;}};
const dmgOK=e=>{try{return typeof damageable3==='function'?damageable3(e):e.hp>0;}catch(_){return e?.hp>0;}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const blood=(name,x,y,o)=>{try{return window.__STORYWORLD_BLOOD_R190__?.play?.(name,x,y,o);}catch(_){return null;}};
let fxSelf=false;
function deal(e,amount,tag){if(!e||!dmgOK(e)||!(amount>0))return false;const src={kind:'r425',friendly:true,owner:'hero',r425:tag,sourceHero:HERO,r118Splash:true};try{return hitEnemy(e,amount,src);}catch(err){fail(err);return false;}}
function shakeIt(v){try{if(typeof shake==='number'&&!(typeof settings==='object'&&settings?.reducedMotion))shake=Math.max(shake,v);}catch(_){}}
// ---------------------------------------------------------------- R
let R=null;// {t0,x,y,power,crosses:[{x,y,k}],burst:false,auraEnd}
const chainSeen=new Map();
/* R952: 소환된 슬레이어 몸(player.r952Summon)이 건 R·Q 는 그 몸을 기억해, 조종 영웅이 다른 영웅이어도 그 몸 기준으로 이어 간다(다른 경우는 예전과 같다) */
const summonR952=()=>typeof player==='object'&&player&&player.r952Summon===true?player:null;
function startR(x,y,castId){const p=player;R={t0:T(),x,y,castId,p:summonR952(),room:typeof room==='object'?room:null,power:typeof attackPower==='function'?attackPower():48,burst:false,auraStart:T()+.75,auraEnd:T()+.75+7,crosses:[]};
 // 화면 좌상·좌하·우상·우하 ≈ 2.3칸: 화면 가로 +1 = 월드 (+.5,-.5) 방향, 화면 세로 +1 = (+1,+1)/√2
 const scr=(sx,sy)=>({x:x+sx*.5*2.3+sy*.5*1.1,y:y-sx*.5*2.3+sy*.5*1.1});
 R.crosses=[{...scr(0,0),k:2.6,r:3.2,m:2.6,big:true},{...scr(-2,-1),k:1.3,r:1.7,m:1.1},{...scr(-2,1),k:1.3,r:1.7,m:1.1},{...scr(2,-1),k:1.3,r:1.7,m:1.1},{...scr(2,1),k:1.3,r:1.7,m:1.1}];
 stats.rCasts++;}
function rTick(){if(!R)return;const t=T(),age=t-R.t0;let rm=null;try{rm=room;}catch(_){}
 if(rm!==R.room||!(R.p?R.p.hp>0:isHero())){R=null;return;}
 if(!R.burst&&age>=.55){R.burst=true;const hit=new Set();
  for(const c of R.crosses){blood(c.big?'blood-death':'blood-burst',c.x,c.y,{k:c.k*1.15,z:0});for(const e of live())if(!hit.has(e)&&dist(e,c)<=c.r+(e.radius||.3)&&seeLine(c,e)){hit.add(e);deal(e,R.power*c.m,'r-burst');}stats.bursts++;}
  shakeIt(7);}
 if(t>=R.auraStart&&t<R.auraEnd&&solo()&&!R.p)chase();
 if(t>=R.auraEnd&&age>1)R=null;}
const auraOn=()=>!!(R&&T()>=R.auraStart&&T()<R.auraEnd&&(R.p?player===R.p&&R.p.hp>0:isHero()));
function manualInput(){try{const k=typeof keys==='object'&&keys?keys:null,j=typeof joystickVector==='object'?joystickVector:{x:0,y:0};return !!((k&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].some(x=>k.has(x)))||Math.hypot(j.x||0,j.y||0)>.15||(typeof route!=='undefined'&&Array.isArray(route)&&route.length>0)||(typeof command!=='undefined'&&!!command));}catch(_){return false;}}
let lastChase=0;
function cloneStrike(p,e,d){const v={x:(e.x-p.x)/d,y:(e.y-p.y)/d},gx=e.x-v.x*.7,gy=e.y-v.y*.7;let dir='front';try{if(typeof facing==='function')dir=facing(v.x,v.y);}catch(_){}
 let asset=null;try{const A=typeof heroArt!=='undefined'?heroArt[HERO]:null;asset=A&&A.attack&&(A.attack[dir]||A.attack.front)||null;}catch(_){}
 /* 분신: R767 공용 그리기(진짜 영웅 그림을 반투명으로 한 번 더) — 영웅에서 적 쪽 잔상 둘(.15초) + 적 앞 본체(.3초). 없으면 엔진 ghost */
 try{const CL=window.__STORYWORLD_CLONE_R767__;if(CL?.spawn){for(const k of [.4,.7])CL.spawn(p.x+(gx-p.x)*k,p.y+(gy-p.y)*k,{life:.15,alpha:.3,dir});CL.spawn(gx,gy,{life:.3,alpha:.65,dir});}else if(asset&&typeof fx==='function')fx('ghost',gx,gy,{asset,life:.3,size:1,r767:true});}catch(err){fail(err);}
 try{if(typeof hitEnemy==='function')hitEnemy(e,(typeof attackPower==='function'?attackPower():48),{kind:'r425-clone',friendly:true,owner:'hero',r425:'clone',sourceHero:HERO,attackKind9:'basic'});}catch(err){fail(err);}
 blood('blood-burst',e.x,e.y,{k:.8,z:0});p.attackCD=Math.max(p.attackCD||0,.48);try{p.direction=dir;}catch(_){}stats.cloneStrikes=(stats.cloneStrikes||0)+1;}
function chase(){const p=player,t=T();const dt=Math.min(.05,Math.max(0,t-lastChase));lastChase=t;if(manualInput()||(typeof modal!=='undefined'&&modal))return;
 let best=null,bd=9;for(const e of live()){const d=dist(e,p);if(d<bd&&dmgOK(e)&&seeLine(p,e)){bd=d;best=e;}}if(!best)return;
 const h=typeof HEROES==='object'?HEROES[p.hero]:null,range=(h?.range||3.3)*.8;
 try{if(typeof target!=='undefined')target=best.id;}catch(_){}
 /* R767(사용자 2026-11-11 "영웅을 적에게 옮기는 스킬은 순간적으로 분신이 적에게 간 다음 스킬 적중시키고 분신은 사라지게"): 영웅은 걸어가지 않고,
    기본 공격 박자마다 분신(엔진 ghost 잔상, 슬레이어 공격 자세)이 적 바로 앞에 나타나 한 번 베고 0.3초 뒤 사라진다. 피해 = 공격력 ×1(기본 공격과 같은 규모). */
 if(bd>range){if(!(p.attackCD>0))cloneStrike(p,best,bd);}
 else if(!(p.attackCD>0)&&typeof basicAttack==='function'){try{basicAttack(true);stats.autoSwings++;}catch(e){fail(e);}}}
function chainBurst(e,depth){const k=e.boss||e.midboss?1.6:1.3;blood('blood-burst',e.x,e.y,{k,z:0});const hit=[];for(const v of live())if(dist(v,e)<=1.5+(v.radius||.3)&&seeLine(e,v)){hit.push(v);deal(v,R.power*(depth?.3:.45),'r-chain');}stats.chains++;
 if(depth<1){const next=live().filter(v=>v!==e&&dmgOK(v)&&dist(v,e)<=2.6&&seeLine(e,v)).sort((a,b)=>dist(a,e)-dist(b,e))[0];if(next&&typeof delay==='function')delay(.12,()=>{if(auraOn()&&dmgOK(next))chainBurst(next,depth+1);},'hero');}}
// ---------------------------------------------------------------- Q
/* R765: 쏘는 각 = 영웅 그림 8방향 칸 중심(적은 어느 칸인지만 정함) — 적에게 정확히 꺾지 않는다. 화면각 S → 월드: dx=(cosS+2sinS)/2, dy=(2sinS-cosS)/2 */
const wSEC={e:0,se:Math.PI/4,s:Math.PI/2,sw:Math.PI*.75,w:Math.PI,nw:-Math.PI*.75,n:-Math.PI/2,ne:-Math.PI/4};
function weaponAngle(a){const sc=Math.atan2((Math.cos(a)+Math.sin(a))*.5,Math.cos(a)-Math.sin(a));let S=0,b=9;for(const k in wSEC){const d=Math.abs(Math.atan2(Math.sin(sc-wSEC[k]),Math.cos(sc-wSEC[k])));if(d<b){b=d;S=wSEC[k];}}return Math.atan2(2*Math.sin(S)-Math.cos(S),Math.cos(S)+2*Math.sin(S));}
let Q=null;// {t0,x,y,angle,power,launched,hit:Set,fx}
const bleeds=new Map();// e -> {next,left,amt}
function qReady(){return on&&isHero()&&solo()&&typeof started!=='undefined'&&started&&!(typeof modal!=='undefined'&&modal)&&!(typeof loading!=='undefined'&&loading)&&!(player.specialCD>0);}
function castQ(){const p=player,rk=typeof rank==='function'?rank('special'):0;p.specialCD=10*(1-.05*rk)*(typeof COMBAT_RHYTHM_R26==='number'?COMBAT_RHYTHM_R26:1);p.specialCD=Math.max(.22,p.specialCD*coolK());p.skillAnim=.6;
 const power=(typeof attackPower==='function'?attackPower():48)*(2.4+.36*rk),e=typeof nearestEnemy==='function'?nearestEnemy(12):null,a=weaponAngle(e?Math.atan2(e.y-p.y,e.x-p.x):(typeof storyAim22==='function'?storyAim22():0));
 try{if(typeof facing==='function')p.direction=facing(Math.cos(a),Math.sin(a));}catch(_){}try{if(typeof sound==='function')sound('special');}catch(_){}
 Q={t0:T(),x:p.x,y:p.y,p:summonR952(),angle:a,power,launched:false,hit:new Set(),room:typeof room==='object'?room:null,fx:null};stats.qCasts++;if(!warmed)warm();return true;}
function qTick(dtGuess){if(!Q)return;const t=T(),age=t-Q.t0;let rm=null;try{rm=room;}catch(_){}const who=Q.p||player;if(rm!==Q.room||!(who?.hp>0)){Q=null;return;}
 if(!Q.launched&&age>=.32){Q.launched=true;Q.x=who.x;Q.y=who.y;Q.ft=t;shakeIt(3.5);
  const f={type:'r425-tornado',x:Q.x,y:Q.y,age:0,life:1.05,q:Q};try{if(Array.isArray(effects))effects.push(f);}catch(_){}Q.fx=f;}
 if(Q.launched){const u=Math.min(1,(t-Q.ft)/.95),nx=Q.x+Math.cos(Q.angle)*8.5*u,ny=Q.y+Math.sin(Q.angle)*8.5*u;
  if(typeof blocked==='function'&&blocked(nx,ny,.2)&&u>.05){Q.stopU??=u;}
  const uu=Q.stopU??u,cx=Q.x+Math.cos(Q.angle)*8.5*uu,cy=Q.y+Math.sin(Q.angle)*8.5*uu;if(Q.fx){Q.fx.x=cx;Q.fx.y=cy;}
  for(const e of live())if(!Q.hit.has(e)&&dist(e,{x:cx,y:cy})<=1.0+(e.radius||.3)){Q.hit.add(e);if(deal(e,Q.power*.9,'q-tornado')){stats.qHits++;bleeds.set(e,{next:t+.8,left:5,amt:Q.power*.07,room:Q.room});blood('blood-splash',e.x,e.y,{k:.9,z:AH()*.5});}}
  if(u>=1||Q.stopU!=null&&t-Q.ft>.95)Q=null;}}
function bleedTick(){if(!bleeds.size)return;const t=T();let rmB=null;try{rmB=room;}catch(_){}for(const [e,b] of bleeds){if(!(e.hp>0)||(b.room&&b.room!==rmB)){bleeds.delete(e);continue;}if(t>=b.next){b.next=t+.8;b.left--;deal(e,b.amt,'q-bleed');blood('blood-splash',e.x,e.y,{k:.55,z:AH()*.35});stats.bleedTicks++;if(b.left<=0)bleeds.delete(e);}}}
// ---------------------------------------------------------------- 그림
function drawCrosses(){const S=SP();if(!R||!S?.draw||typeof project!=='function')return;const age=T()-R.t0;if(age>1.0)return;const H=AH();
 const grow=Math.min(1,age/.35),fade=age<.55?1:Math.max(0,1-(age-.55)/.45);
 for(const c of R.crosses){const q=project(c.x,c.y),h=H*c.k*(.6+.4*grow),w=h*256/384,y0=q.y-(c.big?H*.55:H*.15);
  S.draw('glow',BLOOD,q.x,y0,h*1.1,h*1.1,{alpha:.45*grow*fade,blend:'lighter'});
  S.draw('cross',DEEP,q.x,y0,w*1.08,h*1.08,{alpha:.75*grow*fade,blend:'source-over',angle:0,overHero:!c.big});
  S.draw('cross',BLOOD,q.x,y0,w,h,{alpha:.9*grow*fade,angle:0,overHero:!c.big});
  if(age>.4&&age<.6)S.draw('flare',BLOOD,q.x,y0,h*1.4,h*1.4,{alpha:(1-Math.abs(age-.5)/.1)*.7});}}
function auraBack(){const S=SP();if(!S?.draw)return;const q=project(player.x,player.y),h=AH(),x=q.x,y=q.y-Math.min(Math.max(+player.visualLiftPx||0,0),h*.65),t=T(),fr=Math.floor(t*14),since=t-R.auraStart,swell=1+.35*Math.max(0,1-since/.6),I=S.pal?S.pal(BLOOD.b):BLOOD;
 S.draw('glow',BLOOD,x,y,h*2.6*swell,h*1.1*swell,{alpha:.4,squash:.5});
 S.draw('flame',BLOOD,x,y+h*.06,h*1.6*swell,h*2.4*swell,{frame:fr,alpha:.6,blend:'source-over'});
 S.draw('flame',I,x,y+h*.04,h*1.0*swell,h*1.8*swell,{frame:fr+2,alpha:.4});
 for(let i=0;i<10;i++){const a=i*TAU/10+t*.8,dep=Math.sin(a);if(dep>0)continue;S.draw('spike',i%3?BLOOD:I,x+Math.cos(a)*h*.34,y+dep*h*.1-h*.04,h*.16,h*(1+.6*((i*37)%10)/10)*swell*(.7+.3*Math.sin(t*(11+i))),{angle:Math.cos(a)*.38,alpha:.85});}}
function auraFront(){const S=SP();if(!S?.draw)return;const q=project(player.x,player.y),h=AH(),x=q.x,y=q.y-Math.min(Math.max(+player.visualLiftPx||0,0),h*.65),t=T();
 for(let i=0;i<10;i++){const a=i*TAU/10+t*.8,dep=Math.sin(a);if(dep<=0)continue;S.draw('spike',BLOOD,x+Math.cos(a)*h*.36,y+dep*h*.1,h*.14,h*(.75+.4*((i*53)%10)/10)*(.7+.3*Math.sin(t*(11+i))),{angle:Math.cos(a)*.38,alpha:.42,overHero:true});}
 for(let i=0;i<8;i++){const ph=(t*(.9+.07*i)+i*.13)%1;S.draw('spark',BLOOD,x+(((i*29)%10)/10-.5)*h*.9,y-h*(.1+1.6*ph),h*.3,h*.07,{angle:-Math.PI/2,alpha:Math.sin(Math.PI*ph)*.9,overHero:true});}}
const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx?.scope==='function')return ctx.scope(o,fn);return fn();};
// 도는 고리: 화면 타원(가로 R, 세로 R·sq) 위 n개 베기 자국을 진행 방향(위상이 늘어나는 쪽)으로 눕힌다.
//  자국 하나 = 어두운 피 몸통('petal' 물방울을 길게 — 둥근 머리가 앞, 뾰족한 꼬리가 뒤, 덮어 그리기) + 밝은 날('spark' 머리+꼬리, 덧셈).
//  빛이 아니라 피로 보이게 몸통이 굵고 어둡다. side -1 = 뒤쪽 반(화면 위, 몸 뒤)만, 1 = 앞쪽 반만. 뒤쪽은 옅게.
function ring(S,cx,cy,R,sq,ph,n,len,th,side,o){let d=0;for(let j=0;j<n;j++){const a=ph+j*TAU/n,sn=Math.sin(a),cs=Math.cos(a);if(side&&(sn<0?-1:1)!==side)continue;
  const ang=Math.atan2(cs*sq,-sn),x=cx+cs*R,y=cy+sn*R*sq,near=.5+.5*(sn+1)/2,al=(o.alpha??1)*near;
  S.draw('petal',DEEP,x-Math.cos(ang)*len*.45,y-Math.sin(ang)*len*.45,len*.95,th*1.3,{angle:ang+Math.PI,alpha:.72*al,blend:'source-over',overHero:o.overHero});
  S.draw('spark',BLOOD,x,y,len,th*1.6,{angle:ang,alpha:al,overHero:o.overHero});d+=2;}return d;}
// 시전 0.32초(+ 날린 뒤 0.16초 잦아듦): 영웅 둘레 피 베기 고리 — side -1 은 몸 그리기 전, 1 은 몸 그린 뒤
function spinHero(side){const S=SP();if(!S?.draw||!Q||typeof project!=='function')return;const t=T(),age=t-Q.t0,post=Q.launched?t-Q.ft:0;if(post>.16)return;
 const q=project(player.x,player.y),H=AH(),y=q.y-Math.min(Math.max(+player.visualLiftPx||0,0),H*.65),k=Math.min(1,age/.12),fade=Q.launched?Math.max(0,1-post/.16):1,ph=t*24;
 if(side<0){S.draw('glow',DEEP,q.x,y,H*2*k,H*2*k,{squash:.42,alpha:.5*fade,blend:'source-over'});
  S.draw('slashwide',BLOOD,q.x,y,H*1.55*k,H*1.55*k*288/512,{squash:.42,angle:ph*1.15,alpha:.55*fade});}
 for(const [hh,rr,n] of lowFx()?[[.45,.62,3]]:[[.3,.7,4],[.62,.56,3]])ring(S,q.x,y-H*hh,H*rr*(.7+.3*k),.42,ph+hh*3,n,H*rr,H*.13,side,{alpha:.95*fade,overHero:side>0});
 if(side>0)stats.spinFrames++;}
// 튀어 나가는 피 방울: 회오리 둘레에서 접선·바깥으로 날다가 떨어져 바닥에 번진다(뿌린 때·방향은 번호로 정해져 프레임마다 같다)
function drops(S,f,q,H,age,al,lo){const Q0=f.q,dx=Math.cos(Q0.angle),dy=Math.sin(Q0.angle),N=lo?6:14,u=Math.hypot(f.x-Q0.x,f.y-Q0.y),VT=2.6,VR=1.4,END=.5;
 for(let i=0;i<N;i++){const b=i/N*.9,a=age-b;if(a<0||a>END)continue;
  const d=age>0?u*Math.min(1,b/age):0,th=i*2.399+b*21,ct=Math.cos(th),st=Math.sin(th),r0=.45+.25*((i*37)%10)/10,
   vx=-st*VT+ct*VR,vy=ct*VT+st*VR,bx=Q0.x+dx*d+ct*r0,by=Q0.y+dy*d+st*r0,h0=.35+1.1*((i*53)%10)/10,land=(1.6+Math.sqrt(2.56+36*h0))/18,
   Z=s=>H*(h0+1.6*s-9*s*s),P=s=>project(bx+vx*s,by+vy*s),fe=al*Math.min(1,(END-a)/.1);
  if(a<land){const v=P(a),w=P(a-.04),z=Z(a),sx=v.x-w.x,sy=(v.y-z)-(w.y-Z(a-.04));
   S.draw('spark',BLOOD,v.x,v.y-z,Math.max(H*.12,Math.hypot(sx,sy)*2.2),H*.07,{angle:Math.atan2(sy,sx),alpha:.85*fe});
   S.draw('orb',DEEP,v.x,v.y-z,H*.09,H*.09,{alpha:.9*fe,blend:'source-over'});}
  else{const v=P(land);S.draw('orb',DEEP,v.x,v.y,H*.24,H*.24,{squash:.45,alpha:.6*fe*Math.max(0,1-(a-land)/.25),blend:'source-over'});}
  stats.drops++;}}
// 회오리 — 겨눈 쪽으로 나가는 검기. 바닥(핏자국·꼬리·웅덩이) → 뒤쪽 나선 → R366(뒤) → 피 안개 → R366(앞) → 앞쪽 나선 → 피 방울
function drawTornado(f){if(typeof project!=='function')return;const R366=window.__STORYWORLD_SLAYER_R_TORNADO_R366__,IDX=R366?.index?.(),S=SP(),q=project(f.x,f.y),H=AH(),age=f.age||0,t=T(),lo=lowFx(),Q0=f.q;
 const grow=Math.min(1,.5+age*4),al=Math.max(0,Math.min(1,(f.life-age)*4)),ph=t*21;stats.vortexFrames++;
 if(S?.draw){if(Q0){const dx=Math.cos(Q0.angle),dy=Math.sin(Q0.angle),u=Math.hypot(f.x-Q0.x,f.y-Q0.y),n=lo?3:6;
   for(let i=1;i<=n;i++){const d=u-i*.75;if(d<.2)break;const v=project(Q0.x+dx*d,Q0.y+dy*d),sz=H*(1.05-.06*i);S.draw('smoke',DEEP,v.x,v.y,sz,sz,{squash:.36,angle:i*1.7,alpha:.42*(1-i/(n+1))*al,blend:'source-over'});}
   const back=project(f.x-dx*1.6,f.y-dy*1.6);S.along?.('slashline',BLOOD,back.x,back.y-H*.35,q.x,q.y-H*.35,H*.55,{alpha:.5*al});}
  S.draw('glow',DEEP,q.x,q.y,H*2.3*grow,H*2.3*grow,{squash:.42,alpha:.55*al,blend:'source-over'});
  S.draw('slashwide',DEEP,q.x,q.y,H*1.6*grow,H*1.6*grow*288/512,{squash:.42,angle:ph*1.1+Math.PI,alpha:.5*al,blend:'source-over'});
  S.draw('slashwide',BLOOD,q.x,q.y,H*1.9*grow,H*1.9*grow*288/512,{squash:.42,angle:ph*1.1,alpha:.55*al});}
 const LV=lo?[[.25,.45,3],[1.05,.75,3]]:[[.15,.4,3],[.5,.55,3],[.9,.7,3],[1.3,.85,3],[1.7,.98,2]];
 const spin=side=>{if(S?.draw)for(const [hh,rr,n] of LV)ring(S,q.x,q.y-H*hh*grow,H*rr*grow,.4,ph+hh*2.2,n,H*rr*grow*1.1,H*.14*grow,side,{alpha:.9*al});};
 const sheet=kind=>{if(!IDX)return;const L=IDX.layers[kind];const row=typeof readyImage==='function'?readyImage('assets/r366/'+L.file):null;if(!row?.image){try{if(typeof ensureImages==='function')ensureImages(['assets/r366/'+L.file]);}catch(_){}return;}
  const n=IDX.frames,[cw,ch]=IDX.cell,[ox,oy]=IDX.origin,fr=Math.floor(age/(IDX.loop_s||.5)*n*1.6)%n,f2=(fr+(n>>1))%n,s=H*2.05/(IDX.height_px||250)*grow;
  ctx.save();try{ctx.globalAlpha*=al;ctx.drawImage(row.image,fr*cw,0,cw,ch,q.x-ox*s,q.y-oy*s,cw*s,ch*s);
   /* 반 박자 어긋난 그림 한 겹을 덧셈으로: 붓 자국 밀도 + 젖은 광택 */ctx.globalAlpha*=.38;ctx.globalCompositeOperation='lighter';ctx.drawImage(row.image,f2*cw,0,cw,ch,q.x-ox*s*1.06,q.y-oy*s*1.02,cw*s*1.06,ch*s*1.02);}finally{ctx.restore();}stats.sheetPasses+=2;};
 spin(-1);sheet('back');
 if(S?.draw){S.draw('smoke',DEEP,q.x,q.y-H*.75*grow,H*1.5*grow,H*1.9*grow,{angle:-ph*.35,alpha:.32*al,blend:'source-over'});S.draw('glow',BLOOD,q.x,q.y-H*.7*grow,H*1.2*grow,H*1.9*grow,{alpha:.3*al});}
 sheet('front');spin(1);
 if(S?.draw&&Q0)drops(S,f,q,H,age,al,lo);}
// 몸 회전: 0.32초 동안 0.05초마다 좌·우 반전(가로 폭은 그대로 — 종이처럼 접지 않는다)
function flip(rec,st){const age=T()-Q.t0;if(age>.32)return;if(Math.floor(age/.05)%2===0)return;const q=project(player.x,player.y);
 let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const s=String(c.sourcePath||c.image?.src||'');if(/fx|effect|r366|r425/.test(s))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(best){best.points=best.points.map(([x,y])=>[2*q.x-x,y]);stats.flips++;}}
// ---------------------------------------------------------------- 연결
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){
 try{const o=opt||{};if(on&&solo()&&!ego()&&type==='storySourceSkill'&&o.storyWER&&o.sourceHero===HERO&&o.sourceSlot==='r'&&!o.r139SamongUlt&&isHero()){
   if(o.castId!=null&&(!R||R.castId!==o.castId)&&o.stage!=='hit'){startR(player.x,player.y,o.castId);/* 'warning' 신호를 삼키므로 R62·R169 재사용 대기 단축을 여기서 같은 식으로 */try{const k=HERO+':r',rd=player.storyWER?.ready,at=Number(rd?.[k]),now=typeof time==='number'?time:T(),f=coolK();if(rd&&Number.isFinite(at)&&at>now&&f!==1)rd[k]=now+Math.max(.35,(at-now)*f);}catch(e){fail(e);}}return null;/* 옛 R 그림(73a 원천·R366 회오리·R209 칼자국)은 띄우지 않는다 */}}catch(e){fail(e);}
 return base.apply(this,arguments);};}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,amount,source,...a){
 if(on&&solo()&&!ego()&&source&&source.storyWER&&source.sourceHero===HERO&&source.sourceSlot==='r'&&!source.r425&&typeof player==='object'&&player?.hero===HERO){stats.rBlocked++;return false;}/* 옛 R 7회 둘레 베기 피해 → 십자가 폭발로 대신 */
 const old=e?.hp;const r=base.apply(this,[e,amount,source,...a]);
 try{if(auraOn()&&e&&old>e.hp&&!(source&&((source.r425&&source.r425!=='clone')||source.r118Splash||source.kind==='narrative-companion-r75'||source.kind==='awakening-shock'||/samong|사몽/i.test(String(source.kind||''))))&&!(source&&source.friendly===false)){const t=T(),last=chainSeen.get(e)||-9;if(t-last>.25){chainSeen.set(e,t);if(chainSeen.size>64)chainSeen.delete(chainSeen.keys().next().value);chainBurst(e,0);}}}catch(err){fail(err);}
 return r;};}
if(typeof special==='function'){const base=special;special=function(...a){if(on&&!ego()&&typeof player==='object'&&player?.hero===HERO&&solo()){if(qReady())castQ();return;}return base.apply(this,a);};}
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const r=base.apply(this,[dt,...a]);try{if(on){if(!warmed&&isHero())warm();rTick();qTick(dt);bleedTick();}}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(f,...a){if(f&&f.type==='r425-tornado'){try{scope({id:'r425:tornado',kind:'effect',x:f.x,y:f.y,groundAligned:false},()=>drawTornado(f));}catch(e){fail(e);}return;}return base.apply(this,[f,...a]);};}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const aura=on&&auraOn(),spin=on&&!!Q&&isHero()&&(!Q.p||Q.p===player)&&(!Q.launched||T()-Q.ft<.16);
 if(aura)try{scope({id:'r425:aura-back',kind:'effect',x:player.x,y:player.y,groundAligned:false},()=>{ctx.save();try{auraBack();}finally{ctx.restore();}});stats.auraFrames++;}catch(e){fail(e);}
 if(spin)try{scope({id:'r425:spin-back',kind:'effect',x:player.x,y:player.y,groundAligned:false},()=>{ctx.save();try{spinHero(-1);}finally{ctx.restore();}});}catch(e){fail(e);}
 const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(on&&Q&&!Q.launched&&st>=0&&isHero())flip(rec,st);}catch(e){fail(e);}
 if(spin)try{scope({id:'r425:spin-front',kind:'effect',x:player.x,y:player.y,groundAligned:false},()=>{ctx.save();try{spinHero(1);}finally{ctx.restore();}});}catch(e){fail(e);}
 if(aura)try{scope({id:'r425:aura-front',kind:'effect',x:player.x,y:player.y,groundAligned:false},()=>{ctx.save();try{auraFront();}finally{ctx.restore();}});}catch(e){fail(e);}
 if(on&&R)try{scope({id:'r425:crosses',kind:'effect',x:R.x,y:R.y,groundAligned:false},()=>{ctx.save();try{drawCrosses();}finally{ctx.restore();}});}catch(e){fail(e);}
 return r;};}
window.__STORYWORLD_SLAYER_BLOOD_R425__=Object.freeze({revision:REV,on:()=>on,auraOn:()=>auraOn(),
 state:()=>({R:R&&{age:+(T()-R.t0).toFixed(2),burst:R.burst,aura:auraOn(),auraLeft:+(R.auraEnd-T()).toFixed(2)},Q:Q&&{age:+(T()-Q.t0).toFixed(2),angle:Q.angle,launched:Q.launched,hits:Q.hit.size},bleeding:bleeds.size}),
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,browser:false,GPU:false}),
 set:v=>{on=v!==false;if(!on){R=null;Q=null;bleeds.clear();}try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
