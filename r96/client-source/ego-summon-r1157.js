// R1157 EGO 각성 영웅(0번째 히든) R — 영웅 하나를 7초 소환(사용자 2026-11-18 09:12Z "히든에고영웅 r스킬사용시 랜덤으로 영웅하나 소환하여 7초간 전투를 도움
//  그영웅은 소환시간동안 모든 스킬쿨타임0.7초적용함", 09:13Z "그영웅들은 특수확률발동패시브도 사용함",
//  09:13Z "소환된영웅이 또 소환스킬을 사용하면 둘다 7초가연장되고 7초후 같이사라짐", 09:14Z "모든모드에 적용부탁").
//  · EGO 가 R(환수검)을 쓰는 순간(R 재사용 시각이 앞으로 뛰고 시전 자세가 켜짐 — R1094 와 같은 감지 + 오발동 막기) 기본 영웅 8명 가운데
//    EGO 자신(환도)·판에 이미 있는 영웅(협동 동료·배치 R720·서하 소집 R949·헌터 분대 R952·이 소환)을 뺀 하나를 무작위로 불러 7초 함께 싸운다.
//    R 의 원래 효과(협주 기술·은빛 거성·심연 왜성 R1145)는 건드리지 않는다.
//  · 소환 영웅 = 주인 player 의 사본 '몸'(R720·R949 와 같은 길: r720Ally 표식, 엔진 basicAttack·고유기·W·E·R·drawHero 를 몸을 player 자리에 끼워 부름).
//    EGO·페르소나 형상 표시는 지운다(기본 영웅). 레벨·강화는 주인 것, 공격력은 주인의 HERO_K 배.
//    소환된 동안 그 몸의 고유기(Q)·W·E·R·순간이동 재사용 대기는 0.7초를 넘지 않는다. 기본 공격 간격은 그대로.
//  · 몸 차례에 맞힌 타격은 player 가 그 영웅이라 그 영웅의 확률 발동 특수 패시브가 그대로 굴러간다(투사체 명중은 R962 가 쏜 몸으로 돌림).
//  · 소환 영웅이 자기 소환 패시브(헌터 사냥 분대·서하 아르벨리아)를 쓰면 chain(): 소환 영웅 +7초, 새 소환도 같은 때 끝 → 같이 사라짐. 연장은 최대 MAX_EXT 번.
//  · 모든 모드: 혼자·스토리·사몽·무한 생존·영화. 협동(R62/R1149)은 방장이 모든 사람의 EGO R 을 보고 소환·판정한다(손님 화면은 직접 소환하지 않음).
//  · 지역 이동·서사 장면·주인 쓰러짐·끄기 때 즉시 걷어 낸다. 소환은 room.enemies 에 넣지 않는다(처치·보스 수·저장 무관). 처치 경험치는 주인에게.
//  · 그림: 발밑 백적 불꽃 고리 = 기존 손그림 시트 r100 sig-aura-red, 등장·퇴장 소용돌이 = r100 sig-gather-red(12칸). 새 그림 없음.
//  끄기: localStorage['storyworld.r1157.egoSummon']='{"on":false}'. tick 은 __STORYWORLD_POST_HOOKS__.register 로. 새 키·저장 필드 없음.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_SUMMON_R1157__)return;
const REV='R1157-ego-summon-1',KEY='storyworld.r1157.egoSummon',BASE='hwando',F_EGO='egoSovereignR1046',F_PERSONA='personaHeroR1113';
const DUR=7,CD=.7,EXT=7,MAX_EXT=3,MAX_LIVE=2,HERO_K=.35,OFF=1.4,LEASH=3.2,FOLLOW=7,SPEED=3.6,SKILL_GAP=.18,FADE=.35;
const SH={ring:{path:'assets/r100/sig-aura-red.webp',w:160,h:160,n:12,fps:12},gate:{path:'assets/r100/sig-gather-red.webp',w:192,h:192,n:12,dur:.6}};
const SLOTS=['q','r','w','e'],TIMERS=['attackCD','attackAnim','skillAnim','blinkCD','specialCD','invincible','parry','ego','egoCD','samong','samongCD','grazeGuard','counter'],SHARED=['upgrades','progressionR62'];
const fin=Number.isFinite,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const stats={summons:0,ends:0,cancels:0,chains:0,chainCapped:0,casts:{basic:0,q:0,w:0,e:0,r:0},hits:0,draws:0,refused:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.stack||e).slice(0,300);};
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
let rng=null;const rnd=()=>{try{return rng?rng():Math.random();}catch(_){return Math.random();}};
const T=()=>G(()=>typeof time==='number'?time:0,0),P=()=>G(()=>player,null),room0=()=>G(()=>room,null);
const coop=()=>window.__STORYWORLD_COOP_SIM_R62__;
const cmode=()=>G(()=>coop().mode(),'off')||'off';
const scene=()=>!!G(()=>storyScene,null);
const kit=()=>window.__STORYWORLD_EGO_KIT_R1094__;
let live=[],serial=0;const seen=new WeakMap(),pre=new WeakMap(),cur=[];

// ── 누가 주인이 될 수 있나: 혼자 = 조종 영웅, 협동 방장 = 모든 사람, 협동 손님 = 없음(방장이 판정) ──
function owners(){const m=cmode();if(m!=='off'){if(m!=='host'&&!G(()=>coop().isHost(),false))return [];return G(()=>coop().players(),[]).filter(p=>p&&!p.r720Ally);}const p=P();return p&&!p.r720Ally?[p]:[];}
function isEgo(p){if(!p||!(p.hp>0)||p.r720Ally)return false;if(p===P()&&typeof G(()=>kit().active,null)==='function')return !!G(()=>kit().active(),false);return p.hero===BASE&&p[F_EGO]===true;}
function ownerOk(s){const o=s.owner;if(!o||!(o.hp>0)||!on||scene())return false;if(s.room!==room0())return false;return owners().includes(o);}
// R 재사용 시각이 앞으로 뛰었나(R1094 castJump 와 같은 뜻: 0.5~60초 사이로 늘어난 것만)
function castJump(prev,rem){return fin(rem)&&rem>.5&&rem<60&&(!fin(prev)||rem>prev+.5);}

// ── 판에 이미 있는 영웅 ──
function heroIds(){return G(()=>Object.keys(HEROES),[]);}
function present(id){if(!id)return false;
 if(live.some(s=>s.hero===id&&s.body))return true;
 if(G(()=>coop().players(),[]).some(p=>p&&p.hero===id)&&cmode()!=='off')return true;
 if(G(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.has(id),false)===true)return true;
 if(G(()=>window.__STORYWORLD_SEOHA_EPOCH_R949__.has(id),false)===true)return true;
 if(G(()=>window.__STORYWORLD_HUNTER_SQUAD_R952__.present(id),false)===true)return true;
 return false;}
function pool(o){return heroIds().filter(id=>id!==o.hero&&id!==BASE&&!present(id));}
function ready(p){return !!G(()=>readyImage(p),null);}
const asked={};function ask(paths,key){const t=Date.now();if(t-(asked[key]||-1e9)<1500)return;asked[key]=t;try{if(typeof ensureImages==='function')Promise.resolve(ensureImages(paths)).catch(()=>{});}catch(e){fail(e);}}
function img(p){const g=G(()=>readyImage(p),null);if(g&&g.image)return g.image;ask([p],p);return null;}
function preload(o){for(const id of pool(o))if(!ready(G(()=>heroArt[id].idle.front,'')))ask(G(()=>heroPaths(id),[]),'hero:'+id);ask([SH.ring.path,SH.gate.path],'sheets');}

// ── 몸 ──
function mkBody(o,id,x,y){const b={};
 for(const k of Object.keys(o)){const v=o[k];if(v&&typeof v==='object'&&!SHARED.includes(k)){try{b[k]=structuredClone(v);}catch(_){b[k]=Array.isArray(v)?[]:{};}}else b[k]=v;}
 delete b[F_EGO];delete b[F_PERSONA];
 Object.defineProperty(b,'r720Ally',{value:true,enumerable:false});Object.defineProperty(b,'r1157Summon',{value:true,enumerable:false});
 b.id='r1157:'+id+':'+(++serial);b.hero=id;b.x=x;b.y=y;b.direction='front';b.combo=0;for(const k of TIMERS)b[k]=0;b.attackCD=.3;
 b.resonance=0;b.shield=0;b.guard=false;b.pending=false;b.pendingInputR62=null;b.moving=false;b.visible=true;b.disabled=false;b.visualLiftPx=0;b.storyWER={ready:{},buffs:{}};
 b.hp=Math.max(1,+o.maxHp||+o.hp||100);return b;}
function refresh(b,o){for(const k of SHARED)b[k]=o[k];b.level=o.level;b.hp=Math.max(1,+b.hp||1);b.ego=0;b.samong=0;b.pending=false;}
const validS=s=>!!s&&!!s.body&&live.includes(s);
// 몸을 player 자리에 끼우고 fn 을 돈다. 끝나면(오류여도) 앞의 player 로 되돌린다. 겨눔·이동 명령도 몸마다 따로.
function as(s,fn){const b=s&&s.body;if(!b)return undefined;const prev=P();
 if(cur.length){cur.push(s);player=b;try{return fn();}finally{player=prev;cur.pop();}}
 refresh(b,s.owner);let sT,sC,sR,sw=false;try{sT=target;sC=command;sR=route;target=b.targetR1157||null;command=null;route=[];sw=true;}catch(_){}
 cur.push(s);player=b;try{return fn();}finally{player=prev;cur.pop();if(sw){try{b.targetR1157=target||null;target=sT;command=sC;route=sR;}catch(_){}}}}
const top=()=>cur.length?cur[cur.length-1]:null;
// 소환 동안 스킬 재사용 대기 0.7초 상한(고유기·순간이동·W·E·R)
function clampCD(b,t){if(!b)return;for(const k of ['specialCD','blinkCD'])if(fin(+b[k])&&b[k]>CD)b[k]=CD;
 const R=b.storyWER&&b.storyWER.ready;if(R)for(const k of ['w','e','r']){const key=b.hero+':'+k,v=+R[key];if(fin(v)&&v>t+CD&&v-t<60)R[key]=t+CD;}}

// ── 부르기·끝내기 ──
function spot(o,ang){for(const d of [0,.7,-.7,1.4,-1.4,Math.PI]){for(const r of [OFF,OFF*.6]){const x=o.x+Math.cos(ang+d)*r,y=o.y+Math.sin(ang+d)*r;if(!G(()=>wallAt(x,y,.3),false))return {x,y};}}return {x:o.x,y:o.y};}
function summon(o){const t=T();if(live.length>=MAX_LIVE){stats.refused++;return null;}const ids=pool(o);if(!ids.length){stats.refused++;return null;}
 const id=ids[Math.floor(rnd()*ids.length)%ids.length],ang=Math.PI*.75+live.length*1.4+(rnd()-.5)*.8,p=spot(o,ang);
 const s={owner:o,hero:id,x:p.x,y:p.y,ox:p.x-o.x,oy:p.y-o.y,t0:t,until:t+DUR,ext:0,links:[],room:room0(),body:null,prop:null,next:t+.25,idx:serial};
 s.body=mkBody(o,id,p.x,p.y);s.prop={id:'r1157:'+s.body.id,r1157Prop:true,x:p.x,y:p.y,solid:false,visible:true,autoTargetEligible6:false,label:'소환 영웅',height:66};
 Object.defineProperty(s.prop,'r1157Ref',{value:s,enumerable:false});
 try{const r=s.room;if(r&&Array.isArray(r.props))r.props.push(s.prop);}catch(e){fail(e);}
 live.push(s);stats.summons++;ask(G(()=>heroPaths(id),[]),'hero:'+id);
 try{if(typeof sound==='function')sound('special');}catch(_){}
 try{if(o===P()&&typeof toast==='function')toast('환수 소환 · '+G(()=>HEROES[id].name,id),1.6);}catch(_){}
 return s;}
function end(s,why){if(s.ended)return;s.ended=true;const t=T();if(why==='time')stats.ends++;else stats.cancels++;
 for(const l of s.links){try{if(l.obj&&fin(+l.obj[l.key]))l.obj[l.key]=Math.min(+l.obj[l.key],t);}catch(_){}}
 if(s.body)s.body.hp=0;s.body=null;
 for(const r of new Set([s.room,room0()]))try{if(r&&Array.isArray(r.props)){const i=r.props.indexOf(s.prop);if(i>=0)r.props.splice(i,1);}}catch(e){fail(e);}}
function cancelAll(){for(const s of live)end(s,'cancel');live=[];}
// 소환 영웅이 또 소환: 소환 영웅 +7초(상한 MAX_EXT 번), 새 소환(obj[key])은 소환 영웅과 같은 때 끝난다.
function chain(body,obj,key){const s=live.find(x=>x.body&&x.body===body);if(!s||!obj||typeof key!=='string')return false;
 if(s.ext<MAX_EXT){s.ext++;s.until+=EXT;stats.chains++;}else stats.chainCapped++;
 if(!s.links.some(l=>l.obj===obj&&l.key===key))s.links.push({obj,key});
 for(const l of s.links)try{l.obj[l.key]=s.until;}catch(_){}return s.until;}

// ── 싸움(몸 차례) ──
const R49=()=>window.__STORYWORLD_HANDO_FINAL_R49__,WER=()=>window.__STORYWORLD_WER__;
function foes(){return G(()=>liveEnemies(),G(()=>room.enemies,[])).filter(e=>e&&e.hp>0&&fin(e.x)&&fin(e.y));}
function tryQ(b){if(b.specialCD>0||!R49()?.autoSpecial)return false;const cd=b.specialCD;R49().autoSpecial();return b.specialCD>cd;}
function trySlot(b,k){if(!WER())return false;if(G(()=>WER().cast(k,true),false)===true)return true;
 const M=window.__STORYWORLD_MICHAELA_R247__;if((k==='w'||k==='e')&&b.hero==='michaela'&&G(()=>M.on(),false))return G(()=>M.fire(k,true),false)===true;return false;}
function act(s,t){const b=player;const cd=b.attackCD;if(!(cd>0)&&typeof basicAttack==='function'){basicAttack();if(b.attackCD>cd)stats.casts.basic++;}
 if(t>=s.next){for(const k of SLOTS){const ok=k==='q'?tryQ(b):trySlot(b,k);if(ok){stats.casts[k]++;s.next=t+SKILL_GAP;break;}}}
 clampCD(b,t);}
function walk(a,dx,dy){try{if(typeof moveActor==='function')moveActor(a,dx,dy,.27);else{a.x+=dx;a.y+=dy;}}catch(e){fail(e);}}
function stepOne(s,t,dt){const o=s.owner,b=s.body;if(!b)return;
 if(fin(b.x)&&fin(b.y)&&Math.hypot(b.x-s.x,b.y-s.y)<6){s.x=b.x;s.y=b.y;}
 if(Math.hypot(s.x-o.x,s.y-o.y)>FOLLOW){const p=spot(o,Math.atan2(s.oy,s.ox));s.x=p.x;s.y=p.y;s.born=t;}
 const h=G(()=>HEROES[s.hero],{})||{},range=+h.range||3,melee=!!(h.melee||h.type==='blade'||h.type==='heavy'),an={x:o.x+s.ox,y:o.y+s.oy};
 let tg=null,best=Infinity;for(const e of foes()){if(Math.hypot(e.x-an.x,e.y-an.y)>LEASH+range)continue;const d=Math.hypot(e.x-s.x,e.y-s.y);if(d<best){best=d;tg=e;}}
 let gx=an.x,gy=an.y,stop=.12;if(tg){gx=tg.x;gy=tg.y;stop=melee?Math.min(range*.8,1.4):range*.9;}
 const px=s.x,py=s.y,dx=gx-s.x,dy=gy-s.y,d=Math.hypot(dx,dy);if(d>stop+1e-6&&dt>0){const k=Math.min(SPEED*dt,d-stop)/d;walk(s,dx*k,dy*k);}
 const lx=s.x-an.x,ly=s.y-an.y,l=Math.hypot(lx,ly);if(l>LEASH&&dt>0){const k=Math.min(SPEED*dt*1.5,l-LEASH)/l;walk(s,-lx*k,-ly*k);}
 const mx=s.x-px,my=s.y-py,ml=Math.hypot(mx,my),moved=ml>1e-4;b.x=s.x;b.y=s.y;b.moving=moved;b.moveVX150=moved?mx/ml:0;b.moveVY150=moved?my/ml:0;
 for(const k of TIMERS)b[k]=Math.max(0,(+b[k]||0)-dt);clampCD(b,t);
 if(moved&&!tg&&!(b.attackAnim>0)&&!(b.skillAnim>0)&&typeof facing==='function')b.direction=G(()=>facing(mx,my),b.direction);
 if(tg)as(s,()=>act(s,t));
 if(fin(b.x)&&fin(b.y)){s.x=b.x;s.y=b.y;}else{b.x=s.x;b.y=s.y;}
 for(const l of s.links)try{if(l.obj[l.key]!==s.until)l.obj[l.key]=s.until;}catch(_){}
 if(s.prop){s.prop.x=s.x;s.prop.y=s.y;const r=room0();if(r===s.room&&Array.isArray(r.props)&&!r.props.includes(s.prop))r.props.push(s.prop);}}

// ── 매 틱(POST_HOOKS) ──
let lastT=null;
function tick(){try{const t=T(),dt=lastT==null||t<lastT?0:Math.min(.1,t-lastT);lastT=t;
 if(!on){if(live.length)cancelAll();return;}
 // R 감지
 for(const o of owners()){const v=+G(()=>o.storyWER.ready[o.hero+':r'],NaN),rem=fin(v)?v-t:NaN,had=seen.has(o),prev=seen.get(o);seen.set(o,rem);
  if(!isEgo(o))continue;if(t-(pre.get(o)??-1e9)>1.5){pre.set(o,t);preload(o);}
  if(had&&castJump(prev,rem)&&+o.skillAnim>0&&!scene())summon(o);}
 // 소환 영웅
 live=live.filter(s=>{try{if(!validS(s))return false;if(!ownerOk(s)){end(s,'cancel');return false;}if(t>=s.until){end(s,'time');return false;}stepOne(s,t,dt);return true;}catch(e){fail(e);end(s,'cancel');return false;}});
}catch(e){fail(e);}}
try{window.__STORYWORLD_POST_HOOKS__.register('__r1157',{tick},fail);}catch(e){fail(e);}

// ── 엔진 연결(몸 차례에만 바뀜) ──
if(typeof attackPower==='function'){const base=attackPower;attackPower=function(...a){const v=base.apply(this,a);return top()&&fin(v)?v*HERO_K:v;};}
if(typeof delay==='function'){const base=delay;delay=function(sec,fn,...r){const s=top();if(s&&typeof fn==='function'){const b=s.body,f=fn;fn=function(...x){if(!validS(s)||s.body!==b)return;return as(s,()=>f.apply(this,x));};}return base.call(this,sec,fn,...r);};}
if(typeof makeShot==='function'){const base=makeShot;makeShot=function(x,y,a,spd,dmg,opt,...r){const s=top();if(s)opt={...(opt||{}),r1157Summon:true,sourceHero:(opt&&opt.sourceHero)||s.hero};return base.call(this,x,y,a,spd,dmg,opt,...r);};}
if(typeof gainXP==='function'){const base=gainXP;gainXP=function(...a){const s=top();if(s&&s.owner&&player===s.body){const b=player;player=s.owner;try{return base.apply(this,a);}finally{player=b;}}return base.apply(this,a);};}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,v,src,...a){const r=base.call(this,e,v,src,...a);if(top()&&r!==false)stats.hits++;return r;};}

// ── 그리기: 방 소품 자리(깊이 정렬)에서 발밑 고리 → 몸(엔진 drawHero) → 등장·퇴장 소용돌이 ──
function cell(sh,fr,cx,cy,W,comp,alpha){const im=img(sh.path);if(!im||!(W>0)||!fin(cx)||!fin(cy))return false;fr=((fr%sh.n)+sh.n)%sh.n;
 ctx.save();try{ctx.globalCompositeOperation=comp;ctx.globalAlpha=clamp(alpha,0,1);ctx.drawImage(im,fr*sh.w,0,sh.w,sh.h,cx-W/2,cy-W/2,W,W);}finally{ctx.restore();}return true;}
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function drawSummon(p){const s=p.r1157Ref;if(!s||!s.body||typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;
 const t=T(),z=G(()=>zoom>0?zoom:1,1),AH=G(()=>actorHeight(),66*z)||66,q=project(s.x,s.y);if(!q||!fin(q.x)||!fin(q.y))return;
 const age=t-s.t0,left=s.until-t,fade=clamp(Math.min(age/FADE,left/FADE),0,1);
 sc({id:'r1157:ring:'+s.body.id,kind:'effect',pxfSide:'hero',x:s.x,y:s.y-.01},()=>cell(SH.ring,Math.floor(t*SH.ring.fps+s.idx*3),q.x,q.y-AH*.12,AH*1.25,'lighter',.62*fade));
 const pose=G(()=>heroArt[s.hero].idle.front,null);
 if(pose&&ready(pose)){s.body.x=s.x;s.body.y=s.y;ctx.save();try{ctx.globalAlpha*=clamp(.25+.75*fade,0,1);as(s,()=>drawHero());}finally{ctx.restore();}}
 else ask(G(()=>heroPaths(s.hero),[]),'hero:'+s.hero);
 const gk=age<SH.gate.dur?age/SH.gate.dur:left<SH.gate.dur?1-left/SH.gate.dur:-1;
 if(gk>=0)sc({id:'r1157:gate:'+s.body.id,kind:'effect',pxfSide:'hero',x:s.x,y:s.y+.01},()=>cell(SH.gate,Math.min(SH.gate.n-1,Math.floor(gk*SH.gate.n)),q.x,q.y-AH*.45,AH*1.5,'lighter',.85));
 stats.draws++;}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p&&p.r1157Prop){try{drawSummon(p);}catch(e){fail(e);}return;}return base.apply(this,[p,...a]);};}
// R720 has(id): 영웅별 그리기 덧씌우기가 '그 영웅 몸이 판에 있다'를 알게 한다(R952 와 같은 방법)
try{const R7=window.__STORYWORLD_HERO_DEFENSE_R720__;if(R7&&typeof R7.has==='function'){const has0=R7.has;window.__STORYWORLD_HERO_DEFENSE_R720__=Object.freeze({...R7,has:id=>has0(id)===true||live.some(s=>s.hero===id&&!!s.body)});}}catch(e){fail(e);}

window.__STORYWORLD_EGO_SUMMON_R1157__=Object.freeze({revision:REV,tuning:Object.freeze({DUR,CD,EXT,MAX_EXT,MAX_LIVE,HERO_K,SKILL_GAP}),castJump,chain,
 bodies:()=>live.filter(s=>s.body).map(s=>s.body),has:id=>live.some(s=>s.hero===id&&!!s.body),
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on)cancelAll();return on;},
 qaRandom:f=>{rng=typeof f==='function'?f:null;return !!rng;},qaSummon:()=>{const o=P();return o&&isEgo(o)?!!summon(o):false;},
 qaAs:(body,fn)=>{const s=live.find(x=>x.body===body);return s?as(s,fn):undefined;},
 inspect:()=>({revision:REV,on,live:live.length,summons:live.map(s=>({hero:s.hero,owner:G(()=>s.owner.id||s.owner.hero,null),t0:s.t0,until:s.until,ext:s.ext,links:s.links.length,x:s.x,y:s.y})),stats:{...stats,casts:{...stats.casts}},lastError})});
})();
