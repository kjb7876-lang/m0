// R720 — 무한 생존 '영웅 배치'(사용자 2026-11-11 08:43Z "생존모드에서 i 키누르면 영웅배치 창이 열리고 영웅을 어떠한 재화로 사면 영웅을 정화코어 사정거리 내에 배치하고
//  그영웅은 반자동모드로 사거리내에서 공격하는데 그영웅의 사거리와 이동반경등을 늘릴 수 있고 그 영웅도 키우면서 할 수 있는 시스템을 만들어봐 지금시스템이랑 충돌안하게
//  뒤에 서사영웅일수록 비싸도록 그리고 영웅변경시 그영웅으로 변경하면 기존영웅이 그영웅자리에 들어가는 거임 검토해봐 디펜스요소도 조금 섞는느낌으로").
//
//  · 열기: 무한 생존(R600) 안에서만 I 키(위쪽 단추 줄의 '배치' 단추도 같음). 창이 열린 동안 전투는 멈춘다(엔진 창과 같은 멈춤). 스토리·사몽·영화 모드에서는 아무 일도 하지 않는다.
//  · 재화 '정화 결정': 적 처치 1, 짙은 형상 3, 중간보스 12, 보스 25, 지역 정화 완료 보너스(20+지역 순서×2, 최대 80). 생존 경험치 조각·77초 강화 카드와는 따로 센다.
//  · 가격: 엔진 영웅 목록 순서(환도 → 윤서하 → 네온 → 미카엘라 → 라우렌 → 헌터 → 슬레이어 → 기억사수)로 뒤일수록 비싸다(50·65·80·105·135·170·220·280). 비싼 영웅은 기본 위력 배수도 조금 높다.
//  · 배치: 사면 지금 조종 영웅이 선 자리에 놓인다. 정화 코어 사거리(R600 바닥 고리, 코어 '넓은 빛' 강화로 넓어짐) 안이어야 하고, 코어 바로 위·다른 자리와 겹치는 곳은 안 된다.
//    자리는 코어 기준 위치로 기억해 다음 지역에서도 같은 자리에 선다. 자리 옮기기는 무료, 동시 배치는 최대 4.
//  · 행동(반자동): 자기 자리의 이동 반경 안에서만 움직이며 사거리 안 적을 스스로 친다(근거리는 다가가고, 원거리는 사거리 안이면 자리를 지킨다). 적은 배치 영웅을 노리지 않는다(포탑처럼 맞지 않음).
//    피해는 엔진 hitEnemy 를 그대로 부른다 → 처치 경험치 조각·코어 회복·처치 수는 R600 규칙 그대로.
//  · 키우기(정화 결정): 사거리 +0.6칸(5단계)·이동 반경 +0.8칸(5단계)·레벨(10까지: 위력 +14%/레벨·간격 −3.5%/레벨, 3·6레벨에 한 번에 맞히는 적 +1). 강화는 '자리'에 쌓인다.
//  · 교대: 배치된 영웅으로 조종 영웅을 바꾸면(이 창의 '교대' 단추든, 엔진 영웅 변경 창이든) 조종하던 영웅이 그 자리에 들어가 자리 강화를 이어받는다. 조종 영웅 위치는 그대로.
//  · 저장하지 않는다(생존 모드와 같음). 새 판(다시 도전)이면 결정·보유·자리를 비운다. 엔진 auto·guide·저장·R600 공개 객체는 건드리지 않는다.
//  · 그림: 배치 영웅은 엔진 영웅 그림(heroArt) 그대로. 공격 이펙트(베기 섬광·탄환)는 기존 VFX 를 빌린 임시본 — 영웅별 전용 시트는 Dots 요청 대상.
//  끄기: localStorage 'storyworld.r720.heroDefense'='0' (창·보상·배치가 모두 꺼진다).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO_DEFENSE_R720__)return;
const REV='R720-hero-defense-1',KEY='storyworld.r720.heroDefense';
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const stats={opens:0,buys:0,places:0,moves:0,upgrades:0,swaps:0,hits:0,rewards:0,clears:0,resets:0,draws:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fin=Number.isFinite;

// ── 순수 규칙(QA 가 CPU 에서 부른다) ──
const PRICES=Object.freeze([50,65,80,105,135,170,220,280]);
const MAX=Object.freeze({slots:4,range:5,radius:5,level:10});
const RANGE_STEP=.6,RADIUS0=1.6,RADIUS_STEP=.8,CORE_GAP=1.2,SLOT_GAP=.9,SPEED=3.4,EDGE=.8;
const heroes=H=>H||G(()=>HEROES,{});
function order(H){return Object.keys(heroes(H));}
function indexOf(id,H){return order(H).indexOf(id);}
function price(id,H){const i=indexOf(id,H);if(i<0)return Infinity;return i<PRICES.length?PRICES[i]:Math.round(PRICES[PRICES.length-1]*Math.pow(1.28,i-PRICES.length+1)/5)*5;}
function tier(id,H){const i=indexOf(id,H);return i<0?0:1+.04*i;}
function cost(kind,lv){const l=Math.floor(+lv);if(!(l>=0))return Infinity;
 if(kind==='range')return l<MAX.range?Math.round(25*Math.pow(1.5,l)):Infinity;
 if(kind==='radius')return l<MAX.radius?Math.round(20*Math.pow(1.5,l)):Infinity;
 if(kind==='level')return l>=1&&l<MAX.level?Math.round(30*Math.pow(1.35,l-1)):Infinity;
 return Infinity;}
function slotStats(s,H){const h=s&&heroes(H)[s.hero];if(!h)return null;const lv=clamp(Math.floor(+s.lv||1),1,MAX.level),rl=clamp(Math.floor(+s.rangeLv||0),0,MAX.range),ml=clamp(Math.floor(+s.radiusLv||0),0,MAX.radius);
 const melee=!!(h.melee||h.type==='blade'||h.type==='heavy');
 return {range:(+h.range||3)+RANGE_STEP*rl,radius:RADIUS0+RADIUS_STEP*ml,interval:(+h.interval||.5)*1.5*(1-.035*(lv-1)),dmgMul:.5*tier(s.hero,H)*(1+.14*(lv-1)),targets:1+(lv>=3?1:0)+(lv>=6?1:0),melee,lv};}
function reward(e){if(!e)return 0;if(e.r600Boss)return e.boss?25:12;if(e.r600Elite)return 3;return 1;}
function clearBonus(i){return Math.min(80,20+2*Math.max(0,Math.floor(+i||0)));}
function fresh(main){const owned={};if(main)owned[main]=true;return {crystals:0,main:main||null,owned,slots:[]};}
function doBuy(st,id,H){const p=price(id,H);if(!st||!fin(p))return {ok:false,why:'unknown'};if(st.owned[id]||st.main===id)return {ok:false,why:'owned'};
 if(!(st.crystals>=p))return {ok:false,why:'poor',need:p};st.crystals-=p;st.owned[id]=true;return {ok:true,paid:p};}
function spot(st,pos,env,skip){if(!pos||!fin(pos.x)||!fin(pos.y)||!env||!env.centre||!fin(env.range))return {ok:false,why:'bad'};
 const ox=pos.x-env.centre.x,oy=pos.y-env.centre.y,d=Math.hypot(ox,oy);if(d>env.range+1e-9)return {ok:false,why:'far'};if(d<CORE_GAP)return {ok:false,why:'core'};
 for(let i=0;i<st.slots.length;i++){if(i===skip)continue;const s=st.slots[i];if(Math.hypot(s.ox-ox,s.oy-oy)<SLOT_GAP)return {ok:false,why:'crowded'};}
 return {ok:true,ox,oy};}
function doPlace(st,id,pos,env){if(!st||!st.owned[id])return {ok:false,why:'unowned'};if(st.main===id)return {ok:false,why:'main'};if(st.slots.some(s=>s.hero===id))return {ok:false,why:'placed'};
 if(st.slots.length>=MAX.slots)return {ok:false,why:'full'};const r=spot(st,pos,env,-1);if(!r.ok)return r;
 st.slots.push({hero:id,ox:r.ox,oy:r.oy,lv:1,rangeLv:0,radiusLv:0});return {ok:true,slot:st.slots.length-1};}
function doMove(st,i,pos,env){const s=st&&st.slots[i];if(!s)return {ok:false,why:'none'};const r=spot(st,pos,env,i);if(!r.ok)return r;s.ox=r.ox;s.oy=r.oy;return {ok:true,slot:i};}
function doUpgrade(st,i,kind){const s=st&&st.slots[i];if(!s)return {ok:false,why:'none'};const f=kind==='range'?'rangeLv':kind==='radius'?'radiusLv':kind==='level'?'lv':null;if(!f)return {ok:false,why:'unknown'};
 const c=cost(kind,s[f]);if(!fin(c))return {ok:false,why:'max'};if(!(st.crystals>=c))return {ok:false,why:'poor',need:c};st.crystals-=c;s[f]++;return {ok:true,paid:c,level:s[f]};}
// 조종 영웅이 바뀌었다: 새 영웅이 자리에 있었으면 예전 조종 영웅이 그 자리에 들어간다(자리 강화·위치는 그대로).
function onHeroChange(st,next){if(!st||!next||next===st.main||indexOf(next)<0)return {swapped:false};const prev=st.main,i=st.slots.findIndex(s=>s.hero===next);
 st.main=next;st.owned[next]=true;if(prev)st.owned[prev]=true;if(i<0||!prev)return {swapped:false};st.slots[i].hero=prev;return {swapped:true,slot:i,prev};}
function anchorOf(s,c,A){let x=c.x+s.ox,y=c.y+s.oy;if(A){x=clamp(x,A.x0+EDGE,A.x1-EDGE);y=clamp(y,A.y0+EDGE,A.y1-EDGE);}return {x,y};}
const alive=(e,engaged)=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead'&&(!e.boss||engaged!==false);
// 한 걸음: 자리(anchor)의 이동 반경 안에서 표적에 맞춰 서고, 쉴 틈이 끝났고 사거리 안이면 맞힐 적을 돌려준다.
function think(a,enemies,dt,st,anchor,env){const out={hits:[],target:null,moved:false};if(!a||!st||!anchor)return out;
 if(!fin(a.x)||!fin(a.y)){a.x=anchor.x;a.y=anchor.y;}a.cd=Math.max(0,(+a.cd||0)-dt);
 const eng=env?env.engaged:true,reach=st.radius+st.range;let tg=null,best=Infinity;const near=[];
 for(const e of enemies||[]){if(!alive(e,eng)||!fin(e.x)||!fin(e.y))continue;if(Math.hypot(e.x-anchor.x,e.y-anchor.y)>reach)continue;const d=Math.hypot(e.x-a.x,e.y-a.y);near.push([d,e]);if(d<best){best=d;tg=e;}}
 const step=SPEED*dt;let gx=anchor.x,gy=anchor.y,stop=0;
 if(tg){gx=tg.x;gy=tg.y;stop=st.melee?Math.min(st.range*.8,1.4):st.range*.95;}
 const dx=gx-a.x,dy=gy-a.y,d=Math.hypot(dx,dy);
 if(d>stop+1e-6){const k=Math.min(step,d-stop)/d;a.x+=dx*k;a.y+=dy*k;out.moved=k*d>1e-4;}
 const lx=a.x-anchor.x,ly=a.y-anchor.y,l=Math.hypot(lx,ly);if(l>st.radius){a.x=anchor.x+lx/l*st.radius;a.y=anchor.y+ly/l*st.radius;}
 if(tg){out.target=tg;if(a.cd<=0){const inr=[];for(const[,e]of near){const dd=Math.hypot(e.x-a.x,e.y-a.y);if(dd<=st.range+1e-9)inr.push([dd,e]);}
   if(inr.length){inr.sort((p,q)=>p[0]-q[0]);out.hits=inr.slice(0,st.targets).map(p=>p[1]);a.cd=st.interval;}}}
 return out;}

// ── 상태 ──
let st=fresh(null),allies=[],runKey=null,lastRoom=null,clearKey=null,mine=false,inAllyHit=0;
const SV=()=>window.__STORYWORLD_SURVIVAL_R600__;
const here=()=>on&&G(()=>SV().here()===true,false);
const sv=()=>G(()=>SV().state(),null);
const now=()=>G(()=>time,0);
const P=()=>G(()=>player,null);
const stage=()=>G(()=>room.survivalR600,null);
const env=()=>{const x=stage(),s=sv();return x&&s?{centre:x.centre,range:+s.core?.stats?.range||5.5}:null;};
const hname=id=>G(()=>HEROES[id].name,id);
function ensure(){const k=G(()=>SV().inspect().stats.starts,0),h=G(()=>player.hero,null);
 if(runKey!==k||!st.main){if(runKey!==null&&runKey!==k)stats.resets++;runKey=k;dropProps();st=fresh(h);allies=[];clearKey=null;lastRoom=null;}
 return st;}
function load(id){try{const p=ensureImages(heroPaths(id));if(p&&p.catch)p.catch(fail);return p;}catch(e){fail(e);return null;}}
function baseFor(id){let v=40;try{v=Number(attackPower())||40;const p=player;if(p.samong>0)v/=7+.4*(typeof rank==='function'?rank('samongPower'):0);else if(p.ego>0)v/=1.55;
  const a=+HEROES[id].power,b=+HEROES[p.hero].power;if(a>0&&b>0)v*=a/b;}catch(_){}return Math.max(4,v);}

// ── 방 소품(깊이 정렬에 끼워 그리기 위해) ──
function dropProps(r=G(()=>room,null)){try{if(r&&Array.isArray(r.props)&&r.props.some(p=>p&&p.r720AllyProp))r.props=r.props.filter(p=>!(p&&p.r720AllyProp));}catch(e){fail(e);}}
function syncProps(){const r=G(()=>room,null),x=stage();if(!r||!x||!Array.isArray(r.props))return;const fresh0=r!==lastRoom;lastRoom=r;
 while(allies.length<st.slots.length)allies.push({x:NaN,y:NaN,cd:.4,dir:'front',anim:0,moving:false,bolts:[],ringAt:now(),prop:null});
 if(allies.length>st.slots.length)allies.length=st.slots.length;
 for(let i=0;i<st.slots.length;i++){const a=allies[i],an=anchorOf(st.slots[i],x.centre,x.arena);if(fresh0||!fin(a.x)||!fin(a.y)){a.x=an.x;a.y=an.y;a.bolts.length=0;}
  if(!a.prop)a.prop={id:'r720:ally:'+i,r720AllyProp:true,r720Slot:i,x:a.x,y:a.y,solid:false,visible:true,autoTargetEligible6:false,label:'배치 영웅',height:66};
  a.prop.x=a.x;a.prop.y=a.y;a.prop.r720Slot=i;}
 const want=new Set(allies.map(a=>a.prop));let have=0,stale=false;for(const p of r.props){if(p&&p.r720AllyProp){if(want.has(p))have++;else stale=true;}}
 if(stale||have!==want.size){r.props=r.props.filter(p=>!(p&&p.r720AllyProp));for(const a of allies)r.props.push(a.prop);}}

// ── 한 프레임 ──
function sync(){ensure();const p=P();if(!p)return;
 if(p.hero!==st.main){const prev=st.main,r=onHeroChange(st,p.hero);if(r.swapped){stats.swaps++;load(prev);const a=allies[r.slot];if(a){a.cd=.5;a.anim=0;a.ringAt=now();}try{toast(hname(p.hero)+' 교대 · '+hname(prev)+'이(가) 그 자리를 지킵니다',2.6);}catch(_){}}}
 const s=sv();if(s&&s.phase==='clear'){const k=(s.loop||0)+':'+s.i;if(clearKey!==k){clearKey=k;st.crystals+=clearBonus(s.i);stats.clears++;}}
 syncProps();}
function step(dt){const x=stage(),r=G(()=>room,null);if(!x||!r||!st.slots.length)return;const t=now(),eng=!!r.engaged;
 for(let i=0;i<st.slots.length;i++){const s=st.slots[i],a=allies[i],ss=slotStats(s);if(!a||!ss)continue;const an=anchorOf(s,x.centre,x.arena),px=a.x,py=a.y;
  const o=think(a,r.enemies,dt,ss,an,{engaged:eng});a.anim=Math.max(0,a.anim-dt);a.moving=o.moved;
  if(o.target){const dx=o.target.x-a.x,dy=o.target.y-a.y;if(typeof facing==='function')a.dir=G(()=>facing(dx,dy),a.dir);}
  else if(o.moved&&typeof facing==='function')a.dir=G(()=>facing(a.x-px,a.y-py),a.dir);
  if(o.hits.length){a.anim=.24;const dmg=baseFor(s.hero)*ss.dmgMul;
   for(const e of o.hits){const ex=e.x,ey=e.y;inAllyHit++;try{if(hitEnemy(e,dmg))stats.hits++;}catch(err){fail(err);}finally{inAllyHit--;}
    try{if(ss.melee)fx('burst',ex,ey,{asset:VFX.slash,size:.8,life:.2,angle:Math.atan2(ey-a.y,ex-a.x)});else{a.bolts.push({x:ex,y:ey,at:t});if(a.bolts.length>6)a.bolts.shift();}}catch(err){fail(err);}}}
  a.prop.x=a.x;a.prop.y=a.y;}}

// ── 그리기(엔진 조형물 그리기 순서 안 — R600 코어와 같은 길) ──
const BOLT_LIFE=.16,RING_SECS=4;
function drawAlly(p){const i=p.r720Slot,s=st.slots[i],a=allies[i];if(!s||!a||a.prop!==p)return;const ss=slotStats(s);if(!ss)return;
 const x=stage();if(!x)return;const t=now(),ui=G(()=>zoom,1),tile=G(()=>TILE,64),h=actorHeight(),q=project(a.x,a.y),an=anchorOf(s,x.centre,x.arena),qa=project(an.x,an.y),col=G(()=>HEROES[s.hero].color,'#c9b88c');
 ctx.save();try{
  // 발밑 빛 웅덩이(영웅 색 — 조종 영웅에서 멀어 어두운 곳에서도 보이게)·자리 표식 테두리 + 놓거나 고친 직후 잠깐 보이는 이동 반경 고리 — 임시 코드 그림
  ctx.globalAlpha=.2+.05*Math.sin(t*2.4+i);ctx.fillStyle=col;ctx.beginPath();ctx.ellipse?.(q.x,q.y,tile*ui*.95,tile*ui*.46,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.78;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse?.(q.x,q.y,tile*ui*.56,tile*ui*.28,0,0,Math.PI*2);ctx.stroke();/* 발밑 고리: 배치 영웅 표시(적의 붉은 테두리·조종 영웅의 흰 테두리와 구분) */
  if(Math.hypot(a.x-an.x,a.y-an.y)>.35){ctx.globalAlpha=.4;ctx.lineWidth=1.2;ctx.setLineDash?.([3,4]);ctx.beginPath();ctx.ellipse?.(qa.x,qa.y,tile*ui*.4,tile*ui*.2,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash?.([]);}/* 자리를 비웠을 때만 자리 표식 */
  const ra=RING_SECS-(t-a.ringAt);if(ra>0){ctx.globalAlpha=.34*clamp(ra,0,1);ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.setLineDash?.([4,6]);ctx.beginPath();ctx.ellipse?.(qa.x,qa.y,ss.radius*tile*ui,ss.radius*tile*ui*.5,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash?.([]);}
  ctx.globalAlpha=1;
 }catch(e){fail(e);}finally{ctx.restore();}
 try{const pack=G(()=>heroArt[s.hero],null);if(!pack)return;const want=a.anim>0?pack.attack?.[a.dir]:null,side=pack.idle?.[a.dir],idle=side&&readyImage(side)?side:pack.idle?.front,pose=want&&readyImage(want)?want:idle;
  if(!pose||!readyImage(pose)){if(!(a.loadAt>t-3)){a.loadAt=t;load(s.hero);}return;}
  const row=readyImage(pose),crop=row?.crop||{w:row?.image?.naturalWidth||.65,h:row?.image?.naturalHeight||1},bob=a.moving?Math.sin(t*15)*ui:Math.sin(t*2+i)*.35;
  if(typeof shadow==='function')shadow(q.x,q.y,Math.max(12*ui,Math.min(h*.62,h*crop.w/crop.h*.38)));
  const ang=a.anim>0?Math.sin((.24-a.anim)/.24*Math.PI)*.045*(a.dir==='left'?-1:1):0;
  sprite(pose,q.x,q.y+bob,h,{alpha:1,angle:ang,filter:'brightness(1.28)'});stats.draws++;
  // 레벨 눈금(머리 위 작은 점, 영웅 색)
  ctx.save();try{const n=ss.lv,w=3*ui,g=1.5*ui,tw=n*w+(n-1)*g;ctx.globalAlpha=.9;for(let k=0;k<n;k++){ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(q.x-tw/2+k*(w+g)-.5,q.y-h*1.06-.5,w+1,w+1);ctx.fillStyle=col;ctx.fillRect(q.x-tw/2+k*(w+g),q.y-h*1.06,w,w);}}finally{ctx.restore();}
  // 원거리 탄환(기존 VFX 탄환 그림이 영웅에서 적으로 날아감)
  if(a.bolts.length){a.bolts=a.bolts.filter(b=>t-b.at<BOLT_LIFE);for(const b of a.bolts){const u=clamp((t-b.at)/BOLT_LIFE,0,1),e=project(b.x,b.y),sx=q.x,sy=q.y-h*.45,ex=e.x,ey=e.y-h*.35,sz=h*.42;
    texture(VFX.bolt,sx+(ex-sx)*u,sy+(ey-sy)*u,sz,sz,{alpha:.9,angle:Math.atan2(ey-sy,ex-sx)});}}
 }catch(e){fail(e);}}

// ── 행동(창·검사 공용) ──
function give(n){if(!here())return false;ensure();st.crystals=Math.max(0,st.crystals+(+n||0));return true;}
function placeHere(id){if(!here())return {ok:false,why:'off'};ensure();const p=P(),e=env();if(!p||!e)return {ok:false,why:'off'};const r=doPlace(st,id,{x:p.x,y:p.y},e);if(r.ok){stats.places++;load(id);syncProps();}return r;}
function buy(id){if(!here())return {ok:false,why:'off'};ensure();const r=doBuy(st,id);if(!r.ok)return r;stats.buys++;const pl=placeHere(id);if(!pl.ok)load(id);return {...r,placed:pl.ok,placeWhy:pl.ok?undefined:pl.why};}
function moveHere(i){if(!here())return {ok:false,why:'off'};ensure();const p=P(),e=env();if(!p||!e)return {ok:false,why:'off'};const r=doMove(st,i,{x:p.x,y:p.y},e);
 if(r.ok){stats.moves++;const a=allies[i],x=stage();if(a&&x){const an=anchorOf(st.slots[i],x.centre,x.arena);a.x=an.x;a.y=an.y;a.ringAt=now();a.bolts.length=0;if(a.prop){a.prop.x=a.x;a.prop.y=a.y;}}}return r;}
function upgrade(i,kind){if(!here())return {ok:false,why:'off'};ensure();const r=doUpgrade(st,i,kind);if(r.ok){stats.upgrades++;if(allies[i])allies[i].ringAt=now();}return r;}
// 교대: 엔진 영웅 변경(showHeroes '이 영웅으로 변경')과 같은 일을 한다 — 그림 읽기 → 영웅 교체 → 아이콘. 저장은 하지 않는다.
async function swapTo(i){if(!here())return {ok:false,why:'off'};ensure();const s=st.slots[i],p=P();if(!s||!p||!(p.hp>0))return {ok:false,why:'none'};const id=s.hero,prev=p.hero;
 try{await ensureImages(heroPaths(id));}catch(e){fail(e);return {ok:false,why:'load'};}
 if(!here()||st.slots[i]!==s||s.hero!==id||P()!==p)return {ok:false,why:'changed'};
 p.hero=id;p.combo=0;p.ego=0;p.samong=0;p.shield=0;p.direction='front';const r=onHeroChange(st,id);if(r.swapped){stats.swaps++;load(prev);if(allies[i]){allies[i].cd=.5;allies[i].anim=0;allies[i].ringAt=now();}}
 try{refreshIcons?.();}catch(_){}return {ok:true,slot:i,hero:id,prev};}

// ── 창 ──
const WHY={far:'정화 코어 사거리 밖입니다. 바닥 고리 안으로 들어가세요.',core:'정화 코어 바로 곁에는 놓을 수 없습니다.',crowded:'다른 배치 영웅과 너무 가깝습니다.',full:'자리가 가득 찼습니다(최대 '+MAX.slots+').',poor:'정화 결정이 모자랍니다.',max:'이미 최대 단계입니다.',placed:'이미 배치된 영웅입니다.',main:'지금 조종 중인 영웅입니다.',unowned:'아직 영입하지 않은 영웅입니다.'};
const CSS='#r720Panel .r720Top{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:6px 0 10px;font-size:13px}#r720Panel .r720Cry{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:14px;border:1px solid rgba(143,212,200,.5);background:rgba(18,34,34,.8);color:#bff3ea;font-weight:700;font-size:15px}'+
 '#r720Panel .r720Cry i{display:inline-block;width:9px;height:9px;transform:rotate(45deg);background:linear-gradient(135deg,#d8fff7,#4fb8aa);box-shadow:0 0 6px #7fe6d6}#r720Panel .r720Spot{color:#c9b88c}#r720Panel .r720Spot.bad{color:#f0a48c}'+
 '#r720Panel h3{margin:14px 0 6px;font-size:13px;letter-spacing:.1em;color:#c9b88c}#r720Panel .r720Slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}@media (max-width:720px){#r720Panel .r720Slots{grid-template-columns:1fr}}'+
 '#r720Panel .r720Slot{--c:#c9b88c;display:grid;grid-template-columns:56px minmax(0,1fr);gap:10px;padding:9px 10px;border-radius:8px;border:1px solid color-mix(in srgb,var(--c) 45%,#3a3229);background:linear-gradient(180deg,rgba(32,26,30,.92),rgba(16,13,16,.95));text-align:left}'+
 '#r720Panel .r720Slot.empty{display:flex;align-items:center;justify-content:center;min-height:40px;grid-column:1/-1;border-style:dashed;border-color:rgba(201,184,140,.28);color:#9c917c;font-size:12px}'+
 '#r720Panel .pf{display:block;position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--c) 55%,#3a3229);background:#07090c;border-radius:4px;box-shadow:inset 0 0 14px #000}#r720Panel .pf.s{width:56px;height:72px}#r720Panel .pf.h{width:64px;height:80px}#r720Panel .pf img{width:100%;height:100%;object-fit:cover;object-position:50% 14%;display:block}#r720Panel .pf img.sp{object-fit:contain;object-position:50% 50%}#r720Panel .r720Slot b{font-size:14px;color:#f1e6d2}#r720Panel .r720Slot b em{font-style:normal;font-size:12px;color:var(--c);margin-left:6px}#r720Panel .r720Slot p{margin:2px 0 6px;font-size:11.5px;line-height:1.45;color:#d8ccb8}'+
 '#r720Panel .r720Btns{display:flex;flex-wrap:wrap;gap:5px}#r720Panel .r720Btns button,#r720Panel .r720Hero button{min-height:30px;padding:4px 9px;font-size:12px;border-radius:6px;border:1px solid rgba(201,184,140,.45);background:#141a20;color:#efe6d6;cursor:pointer}'+
 '#r720Panel .r720Btns button:hover:not(:disabled),#r720Panel .r720Hero button:hover:not(:disabled),#r720Panel .r720Btns button:focus-visible,#r720Panel .r720Hero button:focus-visible{border-color:#c9b88c;outline:none;box-shadow:0 0 0 2px rgba(201,184,140,.3)}'+
 '#r720Panel button:disabled{opacity:.45;cursor:default}#r720Panel .r720Btns button.sw{border-color:rgba(143,212,200,.55);color:#bff3ea}'+
 '#r720Panel .r720Heroes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}@media (max-width:720px){#r720Panel .r720Heroes{grid-template-columns:repeat(2,minmax(0,1fr))}}'+
 '#r720Panel .r720Hero{--c:#c9b88c;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 6px 9px;border-radius:8px;border:1px solid rgba(201,184,140,.3);background:linear-gradient(180deg,rgba(32,26,30,.92),rgba(16,13,16,.95));text-align:center}'+
 '#r720Panel .r720Hero.main,#r720Panel .r720Hero.placed{border-color:color-mix(in srgb,var(--c) 60%,#3a3229)}#r720Panel .r720Hero b{font-size:13px;color:#f1e6d2}#r720Panel .r720Hero span{font-size:11px;color:#b9ad97;min-height:15px}#r720Panel .r720Hero .st{color:var(--c)}'+
 '@media (pointer:coarse){#r720Panel .r720Btns button,#r720Panel .r720Hero button{min-height:40px;padding:6px 12px}}body:has(#modal:not(.hidden) #r720Panel) #r600Hud{visibility:hidden}#r720Msg{min-height:18px;margin-top:8px;font-size:12px;color:#f0c48c}#r720NavBtn{border-color:#5fb8aa}';
function css(){try{if(!document.getElementById('r720Style')){const s=document.createElement('style');s.id='r720Style';s.textContent=CSS;document.head.appendChild(s);}}catch(e){fail(e);}}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const face=id=>G(()=>urlFor(heroArt[id].idle.front),''),art=id=>G(()=>urlFor(window.__STORYWORLD_HEROES_R108__.portraitPath(id)),'')||face(id);
const pic=(id,cls)=>'<span class="pf '+cls+'"><img alt="" src="'+esc(art(id))+'" onerror="this.onerror=null;this.className=\'sp\';this.src=\''+esc(face(id))+'\'"></span>';
const f1=v=>(Math.round(v*10)/10).toFixed(1);
function render(msg){const p=P(),e=env(),ids=order(),H=heroes();const sp=p&&e?spot(st,{x:p.x,y:p.y},e,-1):{ok:false,why:'far'};
 const free=st.slots.length<MAX.slots,slotOf=id=>st.slots.findIndex(s=>s.hero===id);
 const slotCard=(s,i)=>{const ss=slotStats(s),h=H[s.hero]||{},mv=p&&e?spot(st,{x:p.x,y:p.y},e,i):{ok:false},up=(k,lv,label)=>{const c=cost(k,lv),mx=!fin(c);return '<button type="button" data-r720up="'+i+':'+k+'"'+(mx||st.crystals<c?' disabled':'')+'>'+label+(mx?' 최대':' ↑ '+c)+'</button>';};
  return '<div class="r720Slot" style="--c:'+esc(h.color||'#c9b88c')+'">'+pic(s.hero,'s')+'<div><b>'+esc(h.name||s.hero)+'<em>자리 '+(i+1)+' · 레벨 '+ss.lv+'</em></b><p>사거리 '+f1(ss.range)+'칸 · 이동 반경 '+f1(ss.radius)+'칸 · 한 번에 '+ss.targets+'마리 · '+(ss.melee?'근거리':'원거리')+'</p><div class="r720Btns">'+
   up('level',s.lv,'레벨')+up('range',s.rangeLv,'사거리')+up('radius',s.radiusLv,'이동 반경')+'<button type="button" data-r720move="'+i+'"'+(mv.ok?'':' disabled')+'>여기로 옮기기</button><button type="button" class="sw" data-r720swap="'+i+'">이 영웅으로 교대</button></div></div></div>';};
 const heroCard=id=>{const h=H[id]||{},pr=price(id),si=slotOf(id),isMain=st.main===id,own=!!st.owned[id];let state,btn='';
  if(isMain)state='<span class="st">조종 중</span>';else if(si>=0)state='<span class="st">자리 '+(si+1)+' 배치됨</span>';
  else if(own){state='<span>보유</span>';btn='<button type="button" data-r720place="'+esc(id)+'"'+(free&&sp.ok?'':' disabled')+'>지금 자리에 배치</button>';}
  else{state='<span>'+(slotStats({hero:id,lv:1,rangeLv:0,radiusLv:0}).melee?'근거리':'원거리')+' · 사거리 '+f1(+h.range||0)+'칸</span>';btn='<button type="button" data-r720buy="'+esc(id)+'"'+(st.crystals>=pr?'':' disabled')+'>영입 '+pr+'</button>';}
  return '<div class="r720Hero'+(isMain?' main':si>=0?' placed':'')+'" style="--c:'+esc(h.color||'#c9b88c')+'">'+pic(id,'h')+'<b>'+esc(h.name||id)+'</b>'+state+btn+'</div>';};
 const left=MAX.slots-st.slots.length,empties=left>0?['<div class="r720Slot empty">빈 자리 '+left+'개 — 영웅을 영입하면 지금 선 곳에 놓입니다</div>']:[];
 const soft=!free||sp.ok||sp.why==='crowded',spotText=!free?'자리가 가득 찼습니다(자리 옮기기·교대는 할 수 있습니다)':sp.ok?'지금 선 곳에 배치할 수 있습니다':sp.why==='crowded'?'지금 선 곳에는 이미 배치 영웅이 있습니다':(WHY[sp.why]||'지금 선 곳에는 배치할 수 없습니다');
 css();mine=false;
 openPanel('<div id="r720Panel"><div class="eyebrow">무한 생존 · 영웅 배치</div><h2>영웅 배치</h2><p class="small">정화 결정으로 영웅을 영입해 정화 코어 곁에 세웁니다. 배치 영웅은 자기 자리의 이동 반경 안에서 사거리에 든 적을 스스로 공격합니다. 창이 열린 동안 전투는 멈춥니다.</p>'+
  '<div class="r720Top"><span class="r720Cry"><i></i>정화 결정 '+Math.floor(st.crystals)+'</span><span class="r720Spot'+(soft?'':' bad')+'">'+esc(spotText)+'</span></div>'+
  '<h3>배치 자리 '+st.slots.length+' / '+MAX.slots+'</h3><div class="r720Slots">'+st.slots.map(slotCard).join('')+empties.join('')+'</div>'+
  '<h3>영웅 — 뒤의 영웅일수록 값이 비싸고 기본 위력이 높습니다</h3><div class="r720Heroes">'+ids.map(heroCard).join('')+'</div>'+
  '<div id="r720Msg">'+esc(msg||'')+'</div><div class="actions"><button id="r720Close" class="primary">닫기 (I)</button></div></div>');
 mine=true;
 try{const q=s=>document.querySelectorAll(s),say=r=>r.ok?'':(WHY[r.why]||'지금은 할 수 없습니다.');
  for(const b of q('[data-r720buy]'))b.onclick=()=>{const id=b.getAttribute('data-r720buy'),r=buy(id);render(r.ok?(r.placed?hname(id)+' 영입 · 지금 자리에 배치했습니다.':hname(id)+' 영입 · '+(WHY[r.placeWhy]||'')+' 자리를 잡은 뒤 배치하세요.'):say(r));};
  for(const b of q('[data-r720place]'))b.onclick=()=>{const id=b.getAttribute('data-r720place'),r=placeHere(id);render(r.ok?hname(id)+' 배치.':say(r));};
  for(const b of q('[data-r720up]'))b.onclick=()=>{const[i,k]=b.getAttribute('data-r720up').split(':'),r=upgrade(+i,k);render(say(r));};
  for(const b of q('[data-r720move]'))b.onclick=()=>{const r=moveHere(+b.getAttribute('data-r720move'));render(r.ok?'자리를 옮겼습니다.':say(r));};
  for(const b of q('[data-r720swap]'))b.onclick=async()=>{for(const x of q('#r720Panel button'))x.disabled=true;const r=await swapTo(+b.getAttribute('data-r720swap'));if(mine&&G(()=>modal,false)){if(r.ok)close();else render('지금은 교대할 수 없습니다.');}};
  const c=document.getElementById('r720Close');if(c)c.onclick=()=>close();}catch(e){fail(e);}}
function canOpen(){const p=P();return here()&&!!p&&p.hp>0&&!G(()=>loading,false)&&!G(()=>storyScene,null)&&G(()=>started,true)&&!G(()=>sv().over,false);}
function open(){if(!canOpen()||G(()=>modal,false))return false;ensure();stats.opens++;render('');return true;}
function close(){if(!mine)return false;mine=false;try{closePanel(true);}catch(e){fail(e);}return true;}
function toggle(){if(mine&&G(()=>modal,false))return close();return open();}

// ── 엔진 연결 ──
function install(){
 if(typeof tick==='function'){const base=tick;tick=function(...a){const t0=now(),r=base.apply(this,a);try{if(here()){sync();const adv=now()-t0;if(adv>0&&!G(()=>modal,false)&&!G(()=>loading,false)&&G(()=>player.hp>0,false)&&!G(()=>sv().over,false))step(adv);}else if(lastRoom){dropProps();lastRoom=null;}}catch(e){fail(e);}return r;};}
 if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded,r=base.apply(this,[e,...a]);
   try{if(first&&e.deadRecorded&&here()){ensure();/* R600 이 마지막 결투 처치 한 번 동안 e.boss 를 내려 두므로 보스 여부는 그 지역 명단으로도 본다 */const big=!!e.boss||!!(e.r600Boss&&G(()=>room.survivalR600.roster.boss,null));st.crystals+=reward({r600Boss:e.r600Boss,r600Elite:e.r600Elite,boss:big});stats.rewards++;}}catch(err){fail(err);}return r;};}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p&&p.r720AllyProp){try{if(here())drawAlly(p);}catch(e){fail(e);}return;}return base.apply(this,[p,...a]);};}
 if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){mine=false;return base.apply(this,a);};}
 if(typeof closePanel==='function'){const base=closePanel;closePanel=function(...a){mine=false;return base.apply(this,a);};}
 window.addEventListener('keydown',ev=>{try{if(!on||ev.repeat||ev.ctrlKey||ev.metaKey||ev.altKey)return;if(ev.code!=='KeyI'&&String(ev.key||'').toLowerCase()!=='i')return;
   const tg=ev.target;if(tg&&(['INPUT','TEXTAREA','SELECT'].includes(tg.tagName)||tg.isContentEditable||tg.closest?.('[contenteditable]')))return;
   if(!here())return;if(G(()=>modal,false)?!mine:!canOpen())return;ev.preventDefault();toggle();}catch(e){fail(e);}});
 // 위쪽 단추 줄 '배치' 단추(모바일·마우스) — 생존 안에서만 보이고, 정화 결정 수를 함께 보여 준다
 const nav=()=>{try{const n=document.querySelector('nav.topnav');if(!n)return;let b=document.getElementById('r720NavBtn');
   if(!b){css();b=document.createElement('button');b.id='r720NavBtn';b.type='button';b.title='영웅 배치 창 열기 (I)';b.onclick=()=>{try{if(mine&&G(()=>modal,false))close();else if(!open())toast?.('지금은 영웅 배치 창을 열 수 없습니다.',2);}catch(e){fail(e);}};n.insertBefore(b,n.firstChild);}
   const show=here();b.style.display=show?'':'none';if(show){const tx='배치 ◆'+Math.floor(st.crystals);if(b.textContent!==tx)b.textContent=tx;}}catch(e){fail(e);}};
 if(typeof setInterval==='function'){const iv=setInterval(nav,400);iv?.unref?.();}}
try{install();}catch(e){fail(e);}
const copy=()=>({crystals:st.crystals,main:st.main||G(()=>player.hero,null),owned:{...(st.main?st.owned:{[G(()=>player.hero,'')]:true})},slots:st.slots.map(s=>({...s}))});
window.__STORYWORLD_HERO_DEFENSE_R720__=Object.freeze({revision:REV,enabled:()=>on,open,close,toggle,buy,placeHere,moveHere,upgrade,swapTo,qaGive:give,
 state:()=>{if(here())ensure();return copy();},allies:()=>allies.map((a,i)=>({slot:i,x:a.x,y:a.y,cd:a.cd,dir:a.dir,anim:a.anim,moving:a.moving})),
 pure:Object.freeze({PRICES,MAX,order,price,tier,cost,slotStats,reward,clearBonus,fresh,doBuy,doPlace,doMove,doUpgrade,onHeroChange,anchorOf,think}),
 inspect:()=>({revision:REV,on,mine,stats:{...stats},lastError})});
})();
