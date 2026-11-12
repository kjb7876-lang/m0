// R247 미카엘라 Z·X 새 스킬 — 사용자 2026-11-03 "미카엘라 z,x스킬 없어짐 이거 이펙트및 스킬구조 미카엘라 특색있게 메이플비숍참고해서 스킬개선및생성적용".
// 원인: R209(중복 정리)가 미카엘라 본편 W '천상 방패'(=공명방어와 같은 보호막)·E '응급 위상전이'(=블링크)를 지우고 단추를 숨겼다.
// 지운 두 칸을 그대로 되살리지 않고(중복이 다시 생김) 미카엘라 결 — 핏빛 성흔·금빛 성광, 사제(비숍) 같은 '빛으로 치고 빛으로 돌보는' 스킬로 새로 만든다.
//  Z '성흔 광시'(엔젤레이 결): 가까운 적 쪽으로 성광 창을 곧게 쏜다 — 줄 위의 모든 적을 꿰뚫고(벽 너머는 안 맞음), 맞힌 적마다 미카엘라 체력 2% 회복(최대 5명).
//     날개 한 쌍이 등 뒤에서 펼쳐지고, 빛줄기 끝에 성흔 십자가, 깃털이 흩날린다.
//  X '제네시스 성광주'(제네시스 결): 적 무리 위 하늘에 후광이 서고(0.45초), 둘레에 빛기둥 여러 개가 차례로 내리꽂힌다 — 기둥마다 반경 1.3칸 피해.
//  7단계 성장: R103 Z·X 스킬강화 단계(0~7)에 따라 Z 길이·폭·피해·회복, X 기둥 수(5→12)·범위·피해가 커지고 그림도 커진다.
//  재사용: Z 5초·X 9초(전투 박자 R26 곱). 피해는 엔진 hitEnemy, 기본 공격력(attackPower) 비례. 판정은 이 오버레이가 직접(R209 중복 정리와 무관하게 미카엘라 Z·X 만).
//  그림: R106 칠한 스프라이트(wing·feather·pillar·halo·cross·glow·slashline) — 미카엘라 고유색(핏빛 [150,22,34])·보조색(금빛 [236,190,120]).
// 끄기(R209 처럼 Z·X 숨김): localStorage['storyworld.r247.michaela']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_MICHAELA_R247__)return;
const REV='R247-michaela-1',KEY='storyworld.r247.michaela';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={z:0,x:0,hits:0,heal:0,drawn:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,SPR=()=>window.__STORYWORLD_FX_SPRITES_R106__;
const BLOOD={a:[150,22,34],b:[236,120,110]},GOLD={a:[236,190,120],b:[255,246,222]},PALE={a:[200,150,120],b:[255,236,210]};
const CD={w:5,e:9};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const mine=()=>on&&typeof player==='object'&&player?.hero==='michaela'&&solo();
function level(slot){try{const st=window.__STORYWORLD_GROWTH_R103__?.state?.();return Math.max(0,Math.min(7,Number(st?.procs?.['michaela:'+slot])||0));}catch(_){return 0;}}
const GS=sl=>{try{return window.__STORYWORLD_SKILL_GROWTH_R663__?.scale?.(sl)||{locked:false,range:1,power:1,cool:1};}catch(_){return {locked:false,range:1,power:1,cool:1};}};
function rhythm(){return typeof COMBAT_RHYTHM_R26==='number'?COMBAT_RHYTHM_R26:1;}
function power(){try{return typeof attackPower==='function'?attackPower():20;}catch(_){return 20;}}
function live(){return (room?.enemies||[]).filter(e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&e.visible!==false);}
function nearest(r){let b=null,bd=r;for(const e of live()){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;b=e;}}return b;}
function aimAngle(){const e=nearest(12);if(e)return Math.atan2(e.y-player.y,e.x-player.x);const d=player.direction;const v={front:[1,1],back:[-1,-1],left:[-1,1],right:[1,-1]}[d]||[1,1];return Math.atan2(v[1],v[0]);}
function hit(e,amount,tag){try{if(typeof hitEnemy==='function'){hitEnemy(e,amount,{kind:'hero-skill-r247',ability:tag,hero:'michaela'});stats.hits++;}}catch(err){fail(err);}}
const fx=[];const SENT={type:'r247-fx',x:0,y:0,age:0,life:Infinity};
function armSent(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
// Z 성흔 광시
function castZ(){const g=GS('w'),lv=level('w'),a=aimAngle(),L=(7+.5*lv)*g.range,W=(.8+.08*lv)*g.range,dmg=power()*(1.5+.15*lv)*g.power,o={x:player.x,y:player.y};let healed=0;
 for(const e of live()){const dx=e.x-o.x,dy=e.y-o.y,t=dx*Math.cos(a)+dy*Math.sin(a);if(t<0||t>L)continue;const perp=Math.abs(-dx*Math.sin(a)+dy*Math.cos(a));if(perp>W+(e.radius||.3))continue;
  try{if(typeof clearLine==='function'&&!clearLine(o,e))continue;}catch(_){}hit(e,dmg,'michaelaAngelRayR247');if(healed<5&&typeof maxHP==='function'){player.hp=Math.min(maxHP(),player.hp+maxHP()*.02);healed++;stats.heal++;}}
 fx.push({k:'z',t0:T(),life:.62,o,a,L,W,lv,seed:Math.random()*6});armSent();stats.z++;return true;}
// X 제네시스 성광주
function castX(){const g=GS('e'),lv=level('e'),tgt=nearest(10*g.range),a=aimAngle(),c=tgt?{x:tgt.x,y:tgt.y}:{x:player.x+Math.cos(a)*3,y:player.y+Math.sin(a)*3},n=5+lv,R=(2.6+.3*lv)*g.range,dmg=power()*(1.2+.12*lv)*g.power,pts=[{...c,d:.45}];
 for(let i=1;i<n;i++){const ang=i/(n-1)*Math.PI*2+Math.random()*.4,r=R*(.45+.55*Math.random()),p={x:c.x+Math.cos(ang)*r,y:c.y+Math.sin(ang)*r,d:.45+i*.08};try{if(typeof blocked==='function'&&blocked(p.x,p.y,.2,room))continue;}catch(_){}pts.push(p);}
 const f={k:'x',t0:T(),life:.45+pts.length*.08+.7,c,R,lv,pts,hitDone:new Set(),dmg,seed:Math.random()*6};fx.push(f);armSent();stats.x++;return true;}
function tickX(){const t=T();for(const f of fx){if(f.k!=='x')continue;for(let i=0;i<f.pts.length;i++){if(f.hitDone.has(i))continue;const p=f.pts[i];if(t-f.t0<p.d)continue;f.hitDone.add(i);for(const e of live())if(Math.hypot(e.x-p.x,e.y-p.y)<1.3+(e.radius||.3))hit(e,f.dmg,'michaelaGenesisR247');}}
 for(let i=fx.length-1;i>=0;i--)if(t-fx[i].t0>fx[i].life)fx.splice(i,1);}
// 그림
function draw(){const S0=SPR();if(!S0||typeof project!=='function')return;const S={draw:(n,F,x,y,w,h,o={})=>S0.draw(n,F,x,y,w,h,{overHero:true,...o}),along:(n,F,x0,y0,x1,y1,w,o={})=>S0.along?.(n,F,x0,y0,x1,y1,w,{overHero:true,...o})};const H=typeof actorHeight==='function'?actorHeight():60,t=T();
 for(const f of fx){const v=(t-f.t0)/f.life;if(v<0||v>1)continue;stats.drawn++;const u=1-v,g=1+.07*f.lv;
  if(f.k==='z'){const q=project(f.o.x,f.o.y),e=project(f.o.x+Math.cos(f.a)*f.L,f.o.y+Math.sin(f.a)*f.L),ang=Math.atan2(e.y-q.y,e.x-q.x);
   // 등 뒤 날개 한 쌍
   S.draw('wing',GOLD,q.x+H*.25,q.y-H*.75,H*1.3*g,H*1.3*g,{alpha:.75*u});S.draw('wing',GOLD,q.x-H*.25,q.y-H*.75,H*1.3*g,H*1.3*g,{alpha:.75*u,flip:true});
   // 성광 창: 빛 띠 + 빛무리 구슬
   const grow=Math.min(1,v*4);S.along('slashline',GOLD,q.x,q.y-H*.45,q.x+(e.x-q.x)*grow,q.y-H*.45+(e.y-q.y)*grow,H*.55*f.W*g,{alpha:.9*u});S.along('slashline',BLOOD,q.x,q.y-H*.45,q.x+(e.x-q.x)*grow,q.y-H*.45+(e.y-q.y)*grow,H*.95*f.W*g,{alpha:.45*u});
   for(let i=1;i<=5;i++){const k=i/5*grow;S.draw('glow',GOLD,q.x+(e.x-q.x)*k,q.y-H*.45+(e.y-q.y)*k,H*.7*g,H*.7*g,{alpha:.5*u});}
   if(grow>=1){S.draw('cross',BLOOD,e.x,e.y-H*.6,H*.9*g,H*1.35*g,{alpha:.85*u});S.draw('glow',GOLD,e.x,e.y-H*.5,H*1.4*g,H*1.4*g,{alpha:.7*u});}
   for(let i=0;i<4+f.lv;i++){const k=(i+.5)/(4+f.lv),x=q.x+(e.x-q.x)*k+Math.sin(f.seed+i*1.7)*H*.4,y=q.y-H*.45+(e.y-q.y)*k+v*H*.9;S.draw('feather',PALE,x,y,H*.18*g,H*.5*g,{alpha:.8*u,angle:Math.sin(t*3+i)*.6});}}
  else{const c=project(f.c.x,f.c.y);const el=t-f.t0;
   // 하늘의 후광 + 바닥 성흔 십자가(예고)
   S.draw('halo',GOLD,c.x,c.y-H*3.2,H*2.2*g,H*.8*g,{alpha:Math.min(1,el*3)*u});if(el<.6)S.draw('cross',BLOOD,c.x,c.y,H*1.6*g,H*.8*g,{alpha:.55*Math.min(1,el*3),squash:.5});
   for(const p of f.pts){const d=el-p.d;if(d<0)continue;const w=Math.min(1,d/.12),fade=Math.max(0,1-(d-.15)/.55),q=project(p.x,p.y);
    S.draw('pillar',GOLD,q.x,q.y,H*.9*g,H*4.2*g*w,{alpha:.95*fade,pivot:[.5,1]});S.draw('pillar',BLOOD,q.x,q.y,H*1.4*g,H*3.4*g*w,{alpha:.4*fade,pivot:[.5,1]});
    S.draw('glow',GOLD,q.x,q.y-H*.1,H*1.6*g,H*.8*g,{alpha:.8*fade});
    for(let i=0;i<3;i++)S.draw('feather',PALE,q.x+Math.sin(f.seed+i*2.1+p.x)*H*.6,q.y-H*(1.6-d*1.4)-i*H*.3,H*.16*g,H*.45*g,{alpha:.75*fade,angle:Math.sin(t*2.6+i)*.7});}}}}
// 시전 입구: 미카엘라 Z(w)·X(e) 만 이 오버레이가 맡는다
let wrapped=false;
const readyAt={w:0,e:0};
function remain(sl){return Math.max(0,readyAt[sl]-T());}
function fire(sl,automatic){if(!mine()||(sl!=='w'&&sl!=='e'))return false;if(readyAt[sl]>T())return false;if(GS(sl).locked)return false;if(automatic&&!nearest(9))return false;
 const ok=sl==='w'?castZ():castX();if(ok){readyAt[sl]=T()+CD[sl]*rhythm()*GS(sl).cool;player.skillAnim=.5;player.attackAngle=aimAngle();try{if(typeof sound==='function')sound('special');}catch(_){}try{if(typeof updateHUD==='function')updateHUD();}catch(_){}}return ok;}
function install(){const W=window.__STORYWORLD_WER__;if(!W||wrapped||W.__r247)return !!W;wrapped=true;const base=W.cast;
 window.__STORYWORLD_WER__=Object.freeze({...W,__r247:true,cast(slot,automatic,...a){const sl=String(slot).toLowerCase();if(mine()&&(sl==='w'||sl==='e')){try{return fire(sl,!!automatic);}catch(e){fail(e);return false;}}
   return base.call(this,slot,automatic,...a);}});return true;}
// 자동 시전(반자동·길잡이): 엔진과 같은 조건 — 0.35초마다, 가까운 적이 있을 때
let nextAuto=0;
function autoOn(){try{const mob=window.__STORYWORLD_MOBILE_R63__?.isMobile?.();return (mob?settings.autoSkill===true:(typeof auto!=='undefined'&&auto))||(typeof guide!=='undefined'&&guide);}catch(_){return false;}}
function tickAuto(){if(!mine()||busy()||!autoOn())return;const t=T();if(t<nextAuto)return;nextAuto=t+.35;if(!fire('e',true))fire('w',true);}
if(typeof updateHUD==='function'){const b=updateHUD;updateHUD=function(...a){const r=b.apply(this,a);try{if(mine())for(const sl of ['w','e']){const el=document.getElementById('story-wer-'+sl);if(!el)continue;const cd=el.querySelector('.cd'),m=remain(sl);if(cd)cd.textContent=m>0?String(Math.ceil(m)):'';el.title=sl==='w'?'성흔 광시':'제네시스 성광주';el.setAttribute('aria-label',el.title+' · '+(typeof KR291!=='undefined'&&KR291?KR291[sl]:(sl==='w'?'W':'E')));const lb=el.querySelector('.label');if(lb&&lb.textContent!==(sl==='w'?'성흔 광시':'성광주'))lb.textContent=sl==='w'?'성흔 광시':'성광주';}}catch(e){fail(e);}return r;};}
if(typeof tick==='function'){const b=tick;tick=function(...a){const r=b.apply(this,a);try{if(fx.length)tickX();tickAuto();}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const b=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r247-fx'){try{draw();}catch(err){fail(err);}return;}return b.apply(this,[e,...a]);};}
// 입구: 엔진 Z·X 키·단추·자동 시전은 엔진 안쪽 cast 를 바로 부른다(창구 감싸기를 안 탄다). R209 가 미카엘라 원래 W·E 를 먼 재사용 대기로 막아 두므로
// 키(Z·X)·단추(본편 W·E)는 먼저(capture) 받아 이 스킬을 쓰고, 자동 시전·길잡이는 아래 tick 에서 따로 쓴다. 재사용 대기는 이 오버레이가 따로 센다.
const KEYS={z:'w',x:'e'};
function busy(){try{return (typeof started!=='undefined'&&!started)||(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading)||(typeof storyScene!=='undefined'&&storyScene)||!(player?.hp>0);}catch(_){return true;}}
if(typeof addEventListener==='function'){addEventListener('keydown',ev=>{try{if(!mine()||ev.repeat||ev.ctrlKey||ev.metaKey||ev.altKey)return;try{window.__STORYWORLD_KEYS_R291__?.translate?.(ev);}catch(_){}const sl=KEYS[String(ev.key).toLowerCase()];if(!sl)return;const tg=ev.target;if(tg&&(/INPUT|TEXTAREA|SELECT/.test(tg.tagName||'')||tg.isContentEditable))return;if(busy())return;fire(sl,false);}catch(e){fail(e);}},true);
 const btn=ev=>{try{if(!mine())return;const b=ev.target?.closest?.('#story-wer-w,#story-wer-e');if(!b)return;if(ev.type==='click'&&ev.detail!==0)return;ev.preventDefault();ev.stopPropagation();if(!busy())fire(b.id.slice(-1),false);}catch(e){fail(e);}};
 addEventListener('pointerdown',btn,true);addEventListener('click',btn,true);}
let tries=0;(function arm(){try{install();}catch(e){fail(e);}if(++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_MICHAELA_R247__=Object.freeze({revision:REV,on:()=>on,castZ:()=>mine()&&castZ(),castX:()=>mine()&&castX(),fire,remain,level,inspect:()=>({revision:REV,on,stats:{...stats},fx:fx.length,lastError}),set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
