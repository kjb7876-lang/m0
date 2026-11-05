// R330 보스급 재해 스킬 — 사용자 2026-11-05
//  "적들 스킬에 이펙트 생성해서 볼케이노·토네이도·블리자드 같은 재해 스킬, 재해 스킬은 보스급만. 육망성이 그려지고 위협적인 무언가가
//   날아가거나 소환되어 플레이어에게 위협이 되어야 해" + "생화학 독안개·폭탄 폭발·핵폭탄 폭발+방사능 오염·침수 홍수 등 다양한 재해,
//   보스 특성에 맞게 각각 고유 재해. 동양 요괴·요괴/귀신 작품들 참고".
//  · 보스·중간보스(보스급)만. 영웅이 12칸 안에 있으면 보스 13초·중간보스 18초마다 그 보스의 고유 재해를 한 번 쓴다.
//  · 순서는 늘 같다: 보스 머리 위 허공에 핏빛 육망성(1초, 부적 조각이 돈다) → 재해가 날아오거나 소환된다 → 엔진 위험지대(hazards)로 실제 피해.
//    떨어질 자리에는 바닥에 핏빛 육망성(CX-0043: 바닥 예고는 육망성만 기본으로 보인다)이 먼저 그려져 피할 틈을 준다.
//  · 고유 재해는 보스 이름 → 지역 성격(R81 family) 순으로 고른다. 지역·보스 설정은 지어내지 않고 이미 있는 이름·성격만 읽는다.
//      화산(불·지옥·대장간·잿더미·석조·동굴) / 회오리(바람·하늘·천사·기본) / 눈보라(눈·얼음) / 생화학 독안개(병원·정원·역병·약)
//      폭탄(도시·기계·신경) / 홍수(해안·늪·물) / 도깨비불 행렬(기억·꿈·집·인형·귀신 — 동양 요괴의 귀화(鬼火)·부적 모티프, 원리만)
//      핵폭발+방사능(우주적·최종 보스만, 가장 긴 예고).
//  · 색: SKILL.md 10절 — 적 = 호러 배색(위협 #0B0D0E·#641B25·국소 #D12835 / 부패 #52402D·#929B30 / 불쾌한 골짜기 #568B84·#BCA99F).
//  · 그림은 R106 칠한 스프라이트만(외부 게임 자산 없음). 동시 효과 상한, 이지 난이도 피해 ×0.6.
//  · 끄기: localStorage['storyworld.r330.disaster']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_DISASTER_R330__)return;
const REV='R330-disaster-4',KEY='storyworld.r330.disaster';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={casts:0,byKind:{},hazards:0,draws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,TAU=Math.PI*2;
// 협동(R62): 손님은 판정·시전을 하지 않고(호스트 스냅숏의 위험지대만 받는다) 그림만 그린다. 상태이상은 영웅마다 따로.
const COOP=()=>window.__STORYWORLD_COOP_SIM_R62__;
const guest=()=>{try{return COOP()?.mode?.()==='guest';}catch(_){return false;}};
const heroes=()=>{try{const c=COOP(),m=c?.mode?.();if(m==='host'||m==='guest'){const l=c.livingPlayers?.();if(Array.isArray(l)&&l.length)return l;}}catch(_){}return typeof player==='object'&&player?[player]:[];};
const actorNow=()=>{try{const c=COOP();if(c?.mode?.()==='host'){const a=c.currentPlayer?.();if(a)return a;}}catch(_){}return player;};
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const rnd=()=>Math.random();
const C=(a,b)=>({a,b});
// 호러 팔레트(SKILL.md 10절)
const P={blood:C([100,27,37],[209,40,53]),ink:C([11,13,14],[100,27,37]),ember:C([100,27,37],[255,120,60]),ash:C([40,40,42],[104,108,108]),
 rot:C([82,64,45],[146,155,48]),mustard:C([82,64,45],[166,154,66]),frost:C([40,60,70],[188,200,205]),sick:C([30,60,58],[86,139,132]),
 rad:C([40,70,30],[160,210,70]),ashL:C([74,72,74],[176,172,170]),rotL:C([96,88,40],[206,198,92]),waterL:C([24,56,62],[150,206,196]),water:C([10,24,30],[86,139,132]),wisp:C([67,52,71],[188,169,159]),bruise:C([40,30,50],[84,64,94])};
const KINDS=['volcano','tornado','blizzard','poison','bomb','flood','wisp','nuke'];
const NAME={volcano:'화산',tornado:'회오리',blizzard:'눈보라',poison:'생화학 독안개',bomb:'폭탄 폭발',flood:'홍수',wisp:'도깨비불 행렬',nuke:'핵폭발 · 방사능 오염'};
const BYNAME=[[/화염|불꽃|불의|용암|지옥|발록|화로|재의|잿|태양/,'volcano'],[/바람|폭풍|하늘|천사|날개|깃털|까마귀/,'tornado'],[/얼음|눈의|서리|겨울|빙/,'blizzard'],
 [/독|역병|병동|약|부패|시체|환자|중독|수술|의사|간호/,'poison'],[/폭탄|화약|기계|군|무기|공장|전기|코어|관리자/,'bomb'],[/물|바다|익사|비의|홍수|늪|파도|해/,'flood'],
 [/기억|꿈|인형|귀신|유령|무당|그림자|거울|아이|어머니|사몽/,'wisp']];
const BYFAM={clinical:'poison',garden:'poison',swamp:'flood',coast:'flood',cave:'volcano',stone:'volcano',ash:'volcano',forge:'volcano',snow:'blizzard',domestic:'wisp',memory:'wisp',neural:'bomb',regional:'tornado'};
/* samongR103 은 사몽 몹 전체에 붙는 표식이라 쓰지 않는다(보스급만 — Codex 리뷰). 사몽 보스는 boss, 중간보스는 samongMidR162 */
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongMidR162));
const isBoss=e=>!!(e&&(e.boss||e.persona||e.cosmic));
function fam(){try{const L=room?.exploration;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[room?.id]?.family||'regional';}catch(_){return'regional';}}
function kindOf(e){if(e.r330Kind)return e.r330Kind;let k=null;const n=String(e.name||'');
 if(e.cosmic||/최종|종말|신의|우주/.test(n))k='nuke';
 if(!k)for(const[re,v]of BYNAME)if(re.test(n)){k=v;break;}
 if(!k)k=BYFAM[fam()]||'tornado';
 e.r330Kind=k;return k;}
function easy(){try{const d=String(room?.difficultyR63||'');return/easy|이지|쉬움/i.test(d);}catch(_){return false;}}
function dmgBase(e){const d=Number(e.damage)||20;return Math.max(4,d)*(easy()?.6:1)*(isBoss(e)?1:.7);}
let uidN=0;
function hz(e,x,y,radius,warning,life,damage,extra){try{if(typeof hazards==='undefined'||!Array.isArray(hazards))return null;
 const h={id:typeof uid!=='undefined'?++uid:'r330:'+(++uidN),type:'r330-'+(extra?.kind||'hit'),owner:e.id,x,y,radius,age:0,warning,life,asset:null,damage,lastHit:-99,r330:true,...(extra||{})};
 hazards.push(h);stats.hazards++;return h;}catch(err){fail(err);return null;}}
const fx=[];const SENT={type:'r330-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
let CUR=null,TGT=null;/* TGT: 이 시전이 노리는 영웅(보스와 가장 가까운 살아 있는 영웅) */
const aimFor=e=>{let best=null,bd=1e9;for(const a of heroes()){if(!(a&&a.hp>0))continue;const d=Math.hypot(a.x-e.x,a.y-e.y);if(d<bd){bd=d;best=a;}}return best||player;};/* 시전 중인 보스·방: 이 시전이 만든 예고·대기열·남는 재해에 붙여, 보스가 죽거나 방을 옮기면 아직 안 온 것을 버린다(Codex 리뷰) */
function push(f){if(CUR&&!f.src)f.src=CUR;if(fx.length>40)fx.shift();fx.push(f);arm();return f;}
function near(x,y,r){const a=rnd()*TAU,d=Math.sqrt(rnd())*r;let px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;try{if(typeof blocked==='function'&&blocked(px,py,.3,room)){px=x;py=y;}}catch(_){}return{x:px,y:py};}
// ---- 재해별 시전(육망성 1초 뒤 phase 'go') --------------------------------------------------------------------
const SIGIL=1.0;
// ---- 지역에 남는 재해(불길·서리·독안개·물웅덩이·방사능)와 상태이상 ---------------------------------------------------
//  사용자 2026-11-05 "불길 등 상호작용이 지역에 몇 초간 지속되도록, 거기 맞는 상태이상도". 영웅이 그 자리에 들어가면 상태이상이 붙고(나와도 남은 시간 동안 지속),
//  화상·중독·피폭은 시간당 피해, 빙결·젖음은 이동 감속. 공명 방어(guard)·무적은 R51 규칙대로 피해를 막는다(hurt 를 거침).
const ST={burn:{name:'화상',dur:3,tickEvery:.5,dmg:.06,pal:P.ember},poison:{name:'중독',dur:4,tickEvery:.6,dmg:.05,pal:P.rotL||P.rot},rad:{name:'방사능 피폭',dur:5,tickEvery:.7,dmg:.045,pal:P.rad},
 chill:{name:'빙결',dur:2.5,slow:.62,pal:P.frost},wet:{name:'젖음',dur:3,slow:.8,pal:P.water}};
const zones=[],statusOf=new WeakMap(),zoneFx=new WeakMap();
function stOf(a){let s=statusOf.get(a);if(!s){s={};statusOf.set(a,s);}return s;}
function zone(fxKind,x,y,R,start,life,D,st){const zr={x,y,R,start,end:start+life,D,st,src:CUR};zones.push(zr);if(!fxKind){for(let i=fx.length-1;i>=0;i--){const f=fx[i];if(Math.abs(f.x-x)<.01&&Math.abs(f.y-y)<.01){zr.f=f;break;}}}
 /* 협동 손님도 남는 불길·독안개를 보도록, 피해 0 짜리 엔진 위험지대로 모양·수명을 함께 실어 보낸다(스냅숏으로 복제됨 — Codex 리뷰) *//* (영역이 실제로 시작될 때 tickStatus 가 만든다) */if(zones.length>30)zones.shift();if(fxKind)zr.f=push({k:fxKind,x,y,t0:start,life,R,seed:rnd()*6});}
function giveStatus(a,st,D,owner){const s=ST[st];if(!s)return;const status=stOf(a),t=T(),cur=status[st];if(!cur){status[st]={until:t+s.dur,D,next:t+(s.tickEvery||0),owner};stats.status=(stats.status||0)+1;
   try{/* 엔진 fx(전역 함수)는 이 파일 안의 fx 배열에 가려지므로 window 로 부른다 */if(typeof window.fx==='function')window.fx('text',a.x,a.y,{text:s.name,color:'#e8b0a0',life:.9});}catch(_){}}else{cur.until=Math.max(cur.until,t+s.dur);cur.D=Math.max(cur.D,D);if(owner)cur.owner=owner;}}
function hurtAs(a,dmg,src){const c=COOP();if(c?.mode?.()==='host'&&typeof c.withPlayer==='function')return c.withPlayer(a,()=>hurt(dmg,src));return hurt(dmg,src);}
function tickStatus(){const t=T(),hs=heroes();for(const z of zones){if(t<z.start||t>z.end)continue;if(!z.h){try{z.h=hz(z.src?.e||{id:null},z.x,z.y,z.R,0,Math.max(.1,z.end-t),0,{kind:'zone-'+z.st,r330Zone:true,st:z.st})||1;if(z.h!==1&&z.f)zoneFx.set(z.h,z.f);}catch(err){fail(err);z.h=1;}}for(const a of hs)if(a.hp>0&&Math.hypot(a.x-z.x,a.y-z.y)<z.R)giveStatus(a,z.st,z.D,z.src?.e);}
 for(let i=zones.length-1;i>=0;i--)if(t>zones[i].end)zones.splice(i,1);
 for(const a of hs){const status=stOf(a);for(const k of Object.keys(status)){const s=status[k],d=ST[k];if(t>s.until||!(a.hp>0)){delete status[k];continue;}
  if(d.dmg&&t>=s.next){s.next=t+d.tickEvery;try{if(typeof hurt==='function')hurtAs(a,s.D*d.dmg,{type:'r330-status',status:k,r330:true,owner:s.owner||undefined});/* 시전한 적을 붙여 난이도 배율(enemySource)이 적용되게 — Codex 리뷰 */}catch(err){fail(err);}}}}}
function slowMul(a){const status=statusOf.get(a);if(!status)return 1;let m=1;for(const k of Object.keys(status))if(ST[k].slow)m=Math.min(m,ST[k].slow);return m;}
const GO={
 volcano(e,t,D){for(let i=0;i<6;i++){const p=i===0?{x:TGT.x,y:TGT.y}:near(TGT.x,TGT.y,3.2),d=t+i*.38,w=.95;
   const f=push({k:'meteor',x:p.x,y:p.y,t0:d,warn:w,R:.95,pal:P.ember,seed:rnd()*6});
   later(d,()=>{f.h=hz(e,p.x,p.y,.95,w,w+.3,D*.55,{kind:'magma'});});zone('blaze',p.x,p.y,.9,d+w,4.2,D,'burn');}},
 tornado(e,t,D){const f=push({k:'tornado',x:e.x,y:e.y,t0:t,warn:.6,life:5,R:1.15,pal:P.ash,seed:rnd()*6,owner:e});
   later(t,()=>{f.h=hz(e,f.x,f.y,1.15,.6,5,D*.22,{kind:'tornado'});});},
 blizzard(e,t,D){const cx=TGT.x,cy=TGT.y;push({k:'snowcloud',x:cx,y:cy,t0:t,life:3.6,R:3,pal:P.frost});
   for(let i=0;i<11;i++){const p=near(cx,cy,3),d=t+.25+i*.28;const f=push({k:'icicle',x:p.x,y:p.y,t0:d,warn:.75,R:.7,pal:P.frost,seed:rnd()*6});later(d,()=>{f.h=hz(e,p.x,p.y,.7,.75,1.05,D*.35,{kind:'ice'});});if(i%3===0)zone('frost',p.x,p.y,.9,d+.75,3.5,D,'chill');}},
 poison(e,t,D){const x=TGT.x,y=TGT.y;const f=push({k:'fog',x,y,t0:t,warn:.8,life:6.5,R:2.3,pal:P.rot,seed:rnd()*6});later(t,()=>{f.h=hz(e,x,y,2.3,.8,6.5,D*.16,{kind:'poison'});});zone(null,x,y,2.3,t+.8,5.7,D,'poison');
   for(let i=0;i<3;i++){const p=near(e.x,e.y,1.4);push({k:'canister',x:p.x,y:p.y,tx:x,ty:y,t0:t,life:.8,pal:P.mustard});}},
 bomb(e,t,D){for(let i=0;i<3;i++){const p=i===0?{x:TGT.x,y:TGT.y}:near(TGT.x,TGT.y,2.6),d=t+i*.3,fuse=1.35;
   const f=push({k:'bomb',x:p.x,y:p.y,sx:e.x,sy:e.y,t0:d,warn:fuse,R:1.45,pal:P.blood,seed:rnd()*6});later(d,()=>{f.h=hz(e,p.x,p.y,1.45,fuse,fuse+.3,D*.8,{kind:'bomb'});});zone('blaze',p.x,p.y,1,d+fuse,3,D,'burn');}},
 flood(e,t,D){const dx=TGT.x-e.x,dy=TGT.y-e.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
   for(let i=0;i<7;i++){const s=1.2+i*1.15,x=e.x+ux*s,y=e.y+uy*s,d=t+i*.22;const f=push({k:'wave',x,y,ux,uy,t0:d,warn:.55,R:1.35,pal:P.water,seed:rnd()*6});
    later(d,()=>{f.h=hz(e,x,y,1.35,.55,.95,D*.42,{kind:'flood',push:{x:ux,y:uy}});});}
   push({k:'puddle',x:TGT.x,y:TGT.y,t0:t+1.4,life:4,R:2.4,pal:P.water});zone(null,TGT.x,TGT.y,2.4,t+1.4,4,D,'wet');},
 wisp(e,t,D){const n=7,tg=TGT;/* 이 시전의 목표를 붙잡아 둔다(다른 보스 시전이 TGT 를 바꿔도) — Codex 리뷰 */for(let i=0;i<n;i++){const d=t+.5+i*.32;push({k:'wisp',e,i,n,t0:t,launch:d,life:d-t+1.4,pal:P.wisp,seed:rnd()*6});
   later(d,()=>{const x=tg.x,y=tg.y;const f=fx.find(q=>q.k==='wisp'&&q.e===e&&q.i===i&&q.launch===d);if(f){f.tx=x;f.ty=y;}const h2=hz(e,x,y,.85,.7,1,D*.3,{kind:'wisp'});push({k:'mark',x,y,t0:T(),warn:.7,R:.85,pal:P.blood,h:h2});});}},
 nuke(e,t,D){const x=TGT.x,y=TGT.y,w=2.6;const f=push({k:'nuke',x,y,t0:t,warn:w,R:4,pal:P.blood,seed:rnd()*6});
   later(t,()=>{f.h=hz(e,x,y,4,w,w+.35,D*1.6,{kind:'nuke'});rf.h=hz(e,x,y,3.4,w+.4,w+7.4,D*.12,{kind:'radiation'});});
   const rf=push({k:'rad',x,y,t0:t+w+.3,life:7,R:3.4,pal:P.rad,seed:rnd()*6});zone(null,x,y,3.4,t+w+.3,7,D,'rad');}
};
const queue=[];function later(at,fn){queue.push({at,fn,src:CUR});}
function cast(e){const k=kindOf(e),t=T(),D=dmgBase(e);stats.casts++;stats.byKind[k]=(stats.byKind[k]||0)+1;
 CUR={e,room};TGT=aimFor(e);try{push({k:'sigil',e,t0:t,life:SIGIL+.35,kind:k,sc:isBoss(e)?1.3:1});
 try{GO[k](e,t+SIGIL,D);}catch(err){fail(err);}}finally{CUR=null;}
 try{if(typeof toast==='function'&&(stats.byKind[k]<=2))toast('재해 · '+NAME[k]+' — '+(e.name||'보스'),2.2);}catch(_){}}
const stale=src=>!!src&&(src.room!==room||!(src.e&&src.e.hp>0));
function purge(all){const t=T();if(all){queue.length=0;fx.length=0;zones.length=0;disarm();return;}
 for(let i=queue.length-1;i>=0;i--)if(stale(queue[i].src)){queue.splice(i,1);stats.cancelled=(stats.cancelled||0)+1;}
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];if(f.src&&f.src.room!==room||stale(f.src)&&(f.launch??f.t0)>t)fx.splice(i,1);}
 for(let i=zones.length-1;i>=0;i--){const z=zones[i];if(z.src&&z.src.room!==room||stale(z.src)&&z.start>t){zones.splice(i,1);try{if(z.h&&typeof hazards!=='undefined'){const k=hazards.indexOf(z.h);if(k>=0)hazards.splice(k,1);}}catch(_){}}}}
/* 협동: 호스트가 쓰러져도 살아 있는 동료가 있으면 계속 돈다(R62 는 살아남은 동료로 세계를 진행 — Codex 리뷰) */
function live(){return typeof started!=='undefined'&&started&&typeof player==='object'&&player&&heroes().some(a=>a&&a.hp>0)&&typeof room==='object'&&room&&Array.isArray(room.enemies);}
function tickAll(dt){if(!live()){for(const a of heroes())statusOf.delete(a);return;}const t=T();purge(false);
 if(guest()){for(let i=fx.length-1;i>=0;i--){const f=fx[i];if(t>(f.launch??f.t0)+(f.life??((f.warn||0)+1.2))+.2)fx.splice(i,1);}if(!fx.length)disarm();return;}/* 손님: 시전·판정 없음 */
 tickStatus();
 for(let i=queue.length-1;i>=0;i--)if(t>=queue[i].at){const q=queue.splice(i,1)[0];try{q.fn();}catch(err){fail(err);}}
 if(on)for(const e of room.enemies){if(!major(e)||!(e.hp>0)||e.r251Circle||e.spawnState&&e.spawnState!=='active')continue;
  const tg=aimFor(e),d=Math.hypot(tg.x-e.x,tg.y-e.y);if(d>12){if(e.r330Next)e.r330Next=Math.max(e.r330Next,t+2);continue;}
  if(!e.r330Next){e.r330Next=t+5+rnd()*2;continue;}
  if(t>=e.r330Next&&!(e.attack&&e.attack.committed)){e.r330Next=t+(isBoss(e)?13:18)+rnd()*2;cast(e);}}
 // 회오리: 영웅을 쫓아가며 빨아들인다 / 홍수: 밀어낸다
 for(const f of fx){if(f.k==='tornado'&&t>=f.t0&&t-f.t0<f.life){const e=f.owner,tg=aimFor(f),dx=tg.x-f.x,dy=tg.y-f.y,L=Math.hypot(dx,dy)||1,sp=1.9*dt;
   let nx=f.x+dx/L*Math.min(sp,L),ny=f.y+dy/L*Math.min(sp,L);try{if(typeof blocked==='function'&&blocked(nx,ny,.3,room)){nx=f.x;ny=f.y;}}catch(_){}f.x=nx;f.y=ny;if(f.h){f.h.x=nx;f.h.y=ny;}
   if(typeof moveActor==='function')for(const a of heroes()){if(!(a&&a.hp>0)||a.invincible>0)continue;const ax=a.x-f.x,ay=a.y-f.y,la=Math.hypot(ax,ay);if(la<2.4&&la>.25)try{moveActor(a,-ax/la*dt*1.1,-ay/la*dt*1.1);}catch(_){}}}}
 if(typeof hazards!=='undefined'&&Array.isArray(hazards)&&typeof moveActor==='function')for(const h of hazards){if(!(h.r330&&h.push&&h.age>=h.warning&&h.age<h.life))continue;for(const a of heroes())if(a&&a.hp>0&&Math.hypot(a.x-h.x,a.y-h.y)<h.radius&&!(a.invincible>0))try{moveActor(a,h.push.x*dt*2.2,h.push.y*dt*2.2);}catch(_){}}
 for(let i=fx.length-1;i>=0;i--){const f=fx[i],end=(f.launch??f.t0)+(f.life??((f.warn||0)+1.2));if(t>end+.2||f.k==='sigil'&&!(f.e.hp>0))fx.splice(i,1);}
 if(!fx.length)disarm();}
// ---- 그림 ------------------------------------------------------------------------------------------------
function ground(S,pal,q,w,a,ang){S.draw('rune',P.ink,q.x,q.y,w*2.05,w*2.05,{squash:.5,angle:ang,alpha:.55*a,blend:'source-over'});S.draw('rune',pal,q.x,q.y,w*2,w*2,{squash:.5,angle:ang,alpha:a});}
function px(x,y){const a=project(x,y),b=project(x+1,y),c=project(x,y+1);return Math.max(Math.hypot(b.x-a.x,b.y-a.y),Math.hypot(c.x-a.x,c.y-a.y))*1.25;}/* 바닥 1칸의 화면 길이 */
function drawAll(){const S0=SPR();if(!S0||typeof project!=='function')return;/* 재해는 영웅 자리에 떨어지므로 R106 의 '영웅 근처 흐리게'를 끈다 */const S={draw:(n,F,x,y,w,hh,o={})=>S0.draw(n,F,x,y,w,hh,{overHero:true,...o})};const t=T(),h=H();stats.draws++;
 for(const f of fx){const el=t-f.t0;if(el<0)continue;const q=project(f.x??f.e?.x??0,f.y??f.e?.y??0);
  const Rv=f.h&&Number.isFinite(f.h.radius)&&f.h.radius>0?f.h.radius:f.R;/* R205 광폭화가 위험지대 반지름을 키우면 그림도 따라간다(Codex 리뷰) */
  const sc=(fn)=>{if(typeof ctx.scope==='function')ctx.scope({id:'r330:'+f.k+':'+f.t0,kind:'effect',x:f.x??0,y:f.y??0},fn);else fn();};
  sc(()=>{switch(f.k){
  case'sigil':{const e=f.e,g=project(e.x,e.y),v=Math.min(1,el/SIGIL),out=el>SIGIL?Math.max(0,1-(el-SIGIL)/.35):1,R=h*(.38+.26*(1-(1-v)**3))*f.sc,y=g.y-h*1.75*f.sc;
   S.draw('glow',P.blood,g.x,y,R*1.6,R*1.6,{alpha:.4*out,overHero:true});S.draw('rune',P.ink,g.x,y,R*2.12,R*2.12,{angle:t*1.3,alpha:out,blend:'source-over',overHero:true});
   S.draw('rune',P.blood,g.x,y,R*2,R*2,{angle:t*1.3,alpha:.85*out,overHero:true});
   for(let i=0;i<6;i++){const a=t*2.2+i*TAU/6;S.draw('shard',C([120,96,70],[214,198,172]),g.x+Math.cos(a)*R*1.15,y+Math.sin(a)*R*.55,h*.16,h*.3,{angle:a+Math.PI/2,alpha:.8*out,blend:'source-over',overHero:true});}/* 부적 조각 */
   if(v>.75)S.draw('flare',P.blood,g.x,y,R*1.2,R*1.2,{alpha:.7*out*(v-.75)*4,overHero:true});break;}
  case'meteor':{const w=Rv*px(f.x,f.y),warn=el<f.warn;if(warn){const u=el/f.warn;ground(S,P.blood,q,w,.5+.5*u,f.seed+el);
    const sy=q.y-h*7,sx=q.x-h*2.2,mx=sx+(q.x-sx)*u*u,my=sy+(q.y-sy)*u*u;S.draw('smoke',P.ash,mx-(q.x-sx)*.08,my-(q.y-sy)*.08,h*.9,h*.9,{alpha:.55,overHero:true,blend:'source-over'});
    S.draw('flame',P.ember,mx,my,h*.75,h*.95,{alpha:.95,angle:Math.atan2(q.y-sy,q.x-sx)-Math.PI/2,overHero:true});S.draw('glow',P.ember,mx,my,h*.9,h*.9,{alpha:.6,overHero:true});}
   else{const v=el-f.warn,u=Math.min(1,v/.5);if(v<1.9){S.draw('crack',P.ink,q.x,q.y,w*2.3,w*1.15,{squash:.5,alpha:.9*(1-v/1.9),blend:'source-over',angle:f.seed});
     S.draw('flame',P.ember,q.x,q.y-h*.1,w*1.1,h*(.9-.4*u),{alpha:.85*(1-v/1.9),overHero:true});if(v<.5)S.draw('flare',P.ember,q.x,q.y-h*.3,w*2.4*u,w*2.4*u,{alpha:1-u,overHero:true});
     S.draw('smoke',P.ash,q.x+w*.2,q.y-h*(.5+.6*u),w*1.6,w*1.6,{alpha:.55*(1-v/1.9),blend:'source-over'});}}break;}
  case'tornado':{if(el>f.life)break;const w=Rv*px(f.x,f.y),a=el<f.warn?el/f.warn:Math.min(1,(f.life-el)/.6);S.draw('pillar',P.ashL,q.x,q.y,w*1.3,h*2.6,{alpha:.55*a,overHero:true});for(let i=0;i<7;i++){const k=i/6,r=w*(.5+1.1*k),yy=q.y-h*(.1+2.3*k);S.draw('ring',i%2?P.ashL:P.blood,q.x+Math.sin(t*5+i)*w*.12,yy,r*2,r*.7,{angle:t*(6-i*.5),alpha:(.85-.4*k)*a,overHero:true});}
   for(let i=0;i<6;i++){const k=i/5,r=w*(.45+.75*k),y=q.y-h*(.15+1.9*k),sp=t*(5-i*.4)+i;S.draw('smoke',i%2?P.ashL:P.ash,q.x+Math.cos(sp)*r*.25,y,r*1.5,r*.75,{angle:sp,alpha:.8*a,blend:'source-over',overHero:true});}S.draw('glow',P.blood,q.x,q.y-h*.9,w*1.6,h*1.6,{alpha:.35*a,overHero:true});
   S.draw('ring',P.blood,q.x,q.y,w*2.2,w*1.1,{angle:t*4,alpha:.5*a});for(let i=0;i<4;i++){const sp=t*6+i*1.6;S.draw('spark',P.blood,q.x+Math.cos(sp)*w*.9,q.y-h*(.3+i*.35),h*.18,h*.06,{angle:sp,alpha:.8*a,overHero:true});}break;}
  case'snowcloud':{if(el>f.life)break;const w=Rv*px(f.x,f.y),a=Math.min(1,el/.4,(f.life-el)/.6);S.draw('glow',P.frost,q.x,q.y-h*2.6,w*2.6,w*1,{alpha:.55*a,overHero:true});S.draw('glow',P.frost,q.x,q.y,w*2.2,w*1.1,{alpha:.3*a});S.draw('smoke',P.frost,q.x,q.y-h*2.6,w*2.4,w*.9,{alpha:.55*a,blend:'source-over',overHero:true});
   S.draw('smoke',P.ash,q.x+w*.4,q.y-h*2.75,w*1.8,w*.7,{alpha:.45*a,blend:'source-over',overHero:true});for(let i=0;i<10;i++){const sx=q.x+(((i*97+Math.floor(el*7))%20)/20-.5)*w*2.2,sy=q.y-h*2.4+((el*h*2.4+i*h*.31)%(h*2.6));S.draw('shard',P.frost,sx,sy,h*.08,h*.18,{angle:.3,alpha:.7*a});}break;}
  case'icicle':{const w=Rv*px(f.x,f.y);if(el<f.warn){const u=el/f.warn;ground(S,P.blood,q,w,.45+.55*u,f.seed);S.draw('shard',P.frost,q.x,q.y-h*(2.6-2.6*u*u),h*.28,h*.75,{alpha:.95,overHero:true});}
   else{const v=el-f.warn;if(v<.6){S.draw('shard',P.frost,q.x,q.y-h*.3,h*.3,h*.7*(1-v),{alpha:1-v/.6,overHero:true});S.draw('spark',P.frost,q.x,q.y-h*.2,w*1.6,w*.6,{alpha:1-v/.6});}}break;}
  case'fog':{if(el>f.life)break;const w=Rv*px(f.x,f.y),grow=Math.min(1,el/f.warn),a=Math.min(1,(f.life-el)/.8);for(let i=0;i<5;i++){const a2=f.seed+i*1.3+el*.3,r=w*.55*grow;S.draw('glow',i%2?P.rotL:P.rad,q.x+Math.cos(a2)*r,q.y+Math.sin(a2)*r*.5-h*.3,w*1.3*grow,w*.8*grow,{alpha:.45*a});}for(let i=0;i<6;i++){const a2=f.seed*3+i*1.7,r=w*.7*((i*29)%6)/6,yy=q.y+Math.sin(a2)*r*.5-((el*h*.5+i*h*.25)%(h*1.2));S.draw('orb',P.mustard,q.x+Math.cos(a2)*r,yy,h*.09,h*.09,{alpha:.8*a*grow});}if(el<f.warn)ground(S,P.blood,q,w*.8,.4+.6*grow,f.seed);
   for(let i=0;i<7;i++){const a2=f.seed+i*TAU/7+el*.25,r=w*(.35+.45*((i*37)%7)/7)*grow;S.draw('smoke',i%3?P.rotL:P.mustard,q.x+Math.cos(a2)*r,q.y+Math.sin(a2)*r*.5-h*.25,w*1.1,w*.7,{alpha:.7*a*grow,blend:'source-over',angle:a2});}
   S.draw('glow',P.rad,q.x,q.y-h*.2,w*2.2,w*1.1,{alpha:.4*a*grow});break;}
  case'canister':{const v=Math.min(1,el/f.life),a=project(f.x,f.y),b=project(f.tx,f.ty),x=a.x+(b.x-a.x)*v,y=a.y+(b.y-a.y)*v-Math.sin(v*Math.PI)*h*1.6;if(el<f.life){S.draw('orb',P.mustard,x,y,h*.22,h*.22,{alpha:.95,overHero:true});S.draw('smoke',P.rot,x-(b.x-a.x)*.05,y,h*.3,h*.3,{alpha:.5,blend:'source-over'});}break;}
  case'bomb':{const w=Rv*px(f.x,f.y);if(el<f.warn){const u=el/f.warn,fl=Math.min(1,el/.45),a=project(f.sx,f.sy),x=a.x+(q.x-a.x)*fl,y=a.y+(q.y-a.y)*fl-Math.sin(fl*Math.PI)*h*1.8;
    ground(S,P.blood,q,w,.35+.65*u,f.seed);S.draw('orb',P.ink,x,y-h*.12,h*.32,h*.32,{alpha:1,blend:'source-over',overHero:true});if(Math.sin(el*(8+16*u))>0)S.draw('glow',P.blood,x,y-h*.2,h*.35,h*.35,{alpha:.9,overHero:true});}
   else{const v=el-f.warn,u=Math.min(1,v/.45);if(v<1.3){S.draw('flare',P.ember,q.x,q.y-h*.35,w*3*u,w*3*u,{alpha:1-u,overHero:true});S.draw('crack',P.ink,q.x,q.y,w*2.2,w*1.1,{squash:.5,alpha:.85*(1-v/1.3),blend:'source-over'});
     S.draw('smoke',P.ashL,q.x,q.y-h*(.4+.8*u),w*2*u,w*1.6*u,{alpha:.7*(1-v/1.3),blend:'source-over'});for(let i=0;i<6;i++){const a2=f.seed+i;S.draw('spark',P.ember,q.x+Math.cos(a2)*w*u*1.4,q.y-h*.3+Math.sin(a2)*w*u*.7,h*.25,h*.07,{angle:a2,alpha:1-u});}}}break;}
  case'wave':{const w=Rv*px(f.x,f.y);if(el<f.warn){ground(S,P.blood,q,w*.7,.35+.65*el/f.warn,f.seed);}else{const v=el-f.warn;if(v<.8){const u=v/.8;S.draw('pillar',P.waterL,q.x,q.y,w*2.2,h*(1.4-.9*u),{alpha:.7*(1-u),overHero:true});S.draw('ring',C([120,170,165],[230,240,235]),q.x,q.y-h*(1-.6*u),w*2,w*.5,{alpha:.8*(1-u),overHero:true});
    S.draw('smoke',P.waterL,q.x,q.y-h*.35,w*2.2,h*(1.3-.8*u),{alpha:.85*(1-u),blend:'source-over',overHero:true});S.draw('glow',P.waterL,q.x,q.y-h*.3,w*2,h,{alpha:.45*(1-u),overHero:true});S.draw('ring',P.water,q.x,q.y,w*2.2*(.6+.6*u),w*1.1*(.6+.6*u),{alpha:.7*(1-u)});
    S.draw('spark',C([60,80,80],[214,220,215]),q.x,q.y-h*(.9-.5*u),w*1.4,h*.12,{alpha:.7*(1-u),overHero:true});}}break;}
  case'blaze':{if(el>f.life)break;const w=Rv*px(f.x,f.y),a=Math.min(1,el/.25,(f.life-el)/.6);/* 남아 타는 불길(키 큰 불꽃 여러 갈래) */
   S.draw('glow',P.ember,q.x,q.y-h*.2,w*2.4,w*1.3,{alpha:.55*a});S.draw('crack',P.ink,q.x,q.y,w*2,w,{squash:.5,alpha:.7*a,blend:'source-over',angle:f.seed});
   for(let i=0;i<5;i++){const a2=f.seed+i*1.26,r=w*.55*((i*37)%5)/5,fl=.75+.35*Math.sin(t*9+i*2.1);S.draw('flame',P.ember,q.x+Math.cos(a2)*r,q.y+Math.sin(a2)*r*.5,w*.75,h*(.85+.5*((i*13)%3)/3)*fl,{alpha:.9*a});}
   S.draw('spark',P.ember,q.x,q.y-h*(.6+((el*1.4)%1)*.8),h*.2,h*.06,{angle:-Math.PI/2,alpha:.8*a});break;}
  case'frost':{if(el>f.life)break;const w=Rv*px(f.x,f.y),a=Math.min(1,el/.25,(f.life-el)/.6);S.draw('glow',P.frost,q.x,q.y,w*2.2,w*1.1,{alpha:.45*a});
   for(let i=0;i<5;i++){const a2=f.seed+i*1.26,r=w*.6*((i*29)%5)/5;S.draw('shard',P.frost,q.x+Math.cos(a2)*r,q.y+Math.sin(a2)*r*.5-h*.12,h*.12,h*.3,{angle:a2*.3,alpha:.85*a});}break;}
  case'puddle':{if(el>f.life)break;const w=Rv*px(f.x,f.y),a=Math.min(1,el/.3,(f.life-el)/.8);S.draw('ring',P.waterL,q.x,q.y,w*2,w,{alpha:.55*a});S.draw('glow',P.waterL,q.x,q.y,w*2,w,{alpha:.3*a});break;}
  case'wisp':{const e=f.e,g=project(e.x,e.y),sl=t-f.launch;let x,y;if(sl<0||f.tx==null){const a2=t*2.4+f.i*TAU/f.n,R=h*1.1;x=g.x+Math.cos(a2)*R;y=g.y-h*1.4+Math.sin(a2)*R*.45;}
    else{const v=Math.min(1,sl/.7),b=project(f.tx,f.ty),s0x=g.x+Math.cos(f.i*TAU/f.n)*h*1.1,s0y=g.y-h*1.4;x=s0x+(b.x-s0x)*v;y=s0y+(b.y-h*.3-s0y)*v-Math.sin(v*Math.PI)*h*.8;if(sl>.9)break;}
    S.draw('glow',P.sick,x,y,h*.5,h*.5,{alpha:.55,overHero:true});S.draw('flame',P.wisp,x,y,h*.32,h*.5,{alpha:.95,overHero:true});S.draw('orb',P.blood,x,y+h*.06,h*.1,h*.1,{alpha:.9,overHero:true});break;}
  case'mark':{const w=Rv*px(f.x,f.y);if(el<f.warn)ground(S,P.blood,q,w,.4+.6*el/f.warn,el);else if(el<f.warn+.5){const u=(el-f.warn)/.5;S.draw('flame',P.wisp,q.x,q.y-h*.3,w*1.2,h*(.9-.6*u),{alpha:1-u,overHero:true});S.draw('glow',P.sick,q.x,q.y-h*.2,w*1.8,w,{alpha:.6*(1-u)});}break;}
  case'nuke':{const w=Rv*px(f.x,f.y);if(el<f.warn){const u=el/f.warn,pulse=.5+.5*Math.sin(el*(6+10*u));ground(S,P.blood,q,w,.45+.55*u,el*.3);ground(S,P.blood,q,w*.45,.5+.5*pulse,-el*.6);
    S.draw('glow',P.blood,q.x,q.y,w*2.2,w*1.1,{alpha:.18+.25*pulse*u});const sy=q.y-h*9,my=sy+(q.y-h*.4-sy)*u*u;S.draw('orb',P.ink,q.x+h*.6*(1-u),my,h*.5,h*.5,{alpha:1,blend:'source-over',overHero:true});S.draw('glow',P.blood,q.x+h*.6*(1-u),my,h*.7,h*.7,{alpha:.7,overHero:true});}
   else{const v=el-f.warn;if(v<3.2){const u=Math.min(1,v/.6),o=Math.max(0,1-v/3.2);S.draw('pillar',P.ember,q.x,q.y,w*.7*u,h*3.4*u,{alpha:.8*o,overHero:true});S.draw('glow',P.ember,q.x,q.y-h*3.4*u,w*1.8*u,w*1.1*u,{alpha:.85*o,overHero:true});S.draw('orb',P.ember,q.x,q.y-h*3.4*u,w*1.1*u,w*.6*u,{alpha:.7*o,overHero:true});S.draw('ring',P.ember,q.x,q.y,w*2*(.3+1.7*Math.min(1,v/1.2)),w*(.3+1.7*Math.min(1,v/1.2)),{alpha:.9*Math.max(0,1-v/1.2)});S.draw('flare',C([255,220,180],[255,255,240]),q.x,q.y-h*.5,w*3*u,w*3*u,{alpha:o*(v<.4?1:.6),overHero:true});
     S.draw('smoke',P.ember,q.x,q.y-h*(1+2.2*u),w*1.4*u,h*2.4*u,{alpha:.75*o,blend:'source-over',overHero:true});S.draw('smoke',P.ashL,q.x,q.y-h*(2.8+1.6*u),w*2.4*u,w*1.2*u,{alpha:.85*o,blend:'source-over',overHero:true});S.draw('glow',P.ember,q.x,q.y-h*(2.4+1.4*u),w*2*u,w*1.2*u,{alpha:.5*o,overHero:true});/* 버섯구름 */
     S.draw('ring',P.ember,q.x,q.y,w*2.6*u,w*1.3*u,{alpha:.8*o});S.draw('crack',P.ink,q.x,q.y,w*2,w,{squash:.5,alpha:.9*o,blend:'source-over'});}}break;}
  case'rad':{if(el>f.life)break;const w=Rv*px(f.x,f.y),a=Math.min(1,el/.6,(f.life-el)/1);S.draw('glow',P.rad,q.x,q.y,w*2,w,{alpha:.5*a});S.draw('ring',P.sick,q.x,q.y,w*2,w,{angle:t*.4,alpha:.55*a});
   for(let i=0;i<8;i++){const a2=f.seed+i*.8,r=w*(.2+.7*((i*53)%8)/8),yy=q.y+Math.sin(a2)*r*.5-((el*h*.6+i*h*.2)%(h*1.2));S.draw('spark',P.rad,q.x+Math.cos(a2)*r,yy,h*.12,h*.05,{angle:-Math.PI/2,alpha:.75*a});}break;}
  }});}
 // 영웅에게 붙은 상태이상 모습
 for(const hero of heroes()){const status=statusOf.get(hero);const ks=status?Object.keys(status):[];if(!ks.length)continue;{const q=project(hero.x,hero.y);for(const k of ks){const u=Math.max(0,status[k].until-t);const a=Math.min(1,u/.4);
  if(k==='burn')for(let i=0;i<3;i++)S.draw('flame',P.ember,q.x+(i-1)*h*.18,q.y-h*(.25+.12*i),h*.22,h*(.35+.1*Math.sin(t*12+i)),{alpha:.85*a});
  else if(k==='poison')for(let i=0;i<3;i++)S.draw('orb',P.mustard,q.x+(i-1)*h*.2,q.y-h*(.4+((t*.8+i*.33)%1)*.9),h*.08,h*.08,{alpha:.85*a});
  else if(k==='rad')for(let i=0;i<4;i++)S.draw('spark',P.rad,q.x+(i-1.5)*h*.16,q.y-h*(.3+((t*1.1+i*.25)%1)*1),h*.12,h*.04,{angle:-Math.PI/2,alpha:.85*a});
  else if(k==='chill'){S.draw('glow',P.frost,q.x,q.y-h*.5,h*.8,h*1.1,{alpha:.4*a});S.draw('shard',P.frost,q.x+h*.18,q.y-h*.35,h*.12,h*.3,{alpha:.8*a});}
  else if(k==='wet')S.draw('orb',P.waterL,q.x+Math.sin(t*3)*h*.15,q.y-h*(.9-((t*1.5)%1)*.8),h*.06,h*.09,{alpha:.8*a});}}}}
// 이 재해 그림(fx)과 이어지지 않은 위험지대(협동 손님이 스냅숏으로 받은 것 등): 예고는 바닥 핏빛 육망성, 터지는 동안은 종류별 빛.
const ZPAL={burn:P.ember,chill:P.frost,wet:P.waterL,poison:P.rot,rad:P.rad};const BARE={magma:P.ember,ice:P.frost,poison:P.rot,bomb:P.ember,flood:P.waterL,wisp:P.wisp,nuke:P.ember,radiation:P.rad,tornado:P.ashL};
function drawBare(h){const S0=SPR();if(!S0||typeof project!=='function')return;const q=project(h.x,h.y),w=(h.radius||1)*px(h.x,h.y),kind=String(h.kind||h.type||'').replace(/^r330-/,''),pal=BARE[kind]||P.blood;stats.bare=(stats.bare||0)+1;
 if(h.r330Zone){if(h.age<h.warning)return;const zp=ZPAL[h.st]||P.blood,v=Math.max(0,Math.min(1,(h.age-h.warning)/Math.max(.2,h.life-h.warning))),fl=.85+.15*Math.sin((h.age||0)*7);S0.draw('glow',zp,q.x,q.y,w*2.3,w*1.15,{alpha:.5*(1-v*.7)*fl,overHero:false});S0.draw('smoke',zp,q.x,q.y-w*.2,w*1.6,w*1.1,{alpha:.35*(1-v),overHero:false});return;}
 if(h.age<h.warning){const u=Math.max(0,Math.min(1,h.age/Math.max(.01,h.warning)));ground({draw:(n,F,x,y,ww,hh,o={})=>S0.draw(n,F,x,y,ww,hh,{overHero:true,...o})},P.blood,q,w,.45+.55*u,(h.age||0)*.6);}
 else{const v=Math.max(0,Math.min(1,(h.age-h.warning)/Math.max(.2,h.life-h.warning)));S0.draw('glow',pal,q.x,q.y,w*2.2,w*1.1,{alpha:.55*(1-v),overHero:true});S0.draw('ring',pal,q.x,q.y,w*2,w,{alpha:.6*(1-v),overHero:true});}}
function install(){
 if(typeof moveActor==='function'){const base=moveActor;moveActor=function(a,dx,dy,...r){if(on&&a){const m=slowMul(a===player?actorNow():a);if(m<1){dx*=m;dy*=m;}}return base.apply(this,[a,dx,dy,...r]);};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r330-fx'){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof drawHazard==='function'){const base=drawHazard;drawHazard=function(h,...a){if(h&&h.r330&&SPR()){if(h.r330Zone&&!guest()){const zf=zoneFx.get(h);if(zf&&fx.includes(zf))return;/* 호스트는 자기 fx 로 이미 그린다 — 그 그림이 개수 제한으로 밀려났으면 아래 drawBare 로 대신(Codex 리뷰) */try{drawBare(h);}catch(err){fail(err);}return;}/* 칠한 스프라이트를 끈 설정(r106.fxsprites)이면 원래 위험지대 그림으로 — 보이지 않는 피해 방지(Codex 리뷰) */if(fx.some(f=>f.h===h))return;try{drawBare(h);}catch(err){fail(err);}return;}return base.apply(this,[h,...a]);};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){purge(true);const r=await base.apply(this,a);try{purge(true);}catch(e){fail(e);}return r;};}
 if(typeof tick==='function'){const base=tick;let last=null;tick=function(...a){const r=base.apply(this,a);try{const t=T(),dt=last==null?0:Math.max(0,Math.min(.1,t-last));last=t;tickAll(dt);}catch(e){fail(e);}return r;};}
 return true;}
const installed=(()=>{try{return install();}catch(e){fail(e);return false;}})();
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}
/* 공명방어 정화(R137 guardCleanse)가 재해 상태이상도 지우게 — Codex 리뷰 */
function clearStatus(a){const st=a&&statusOf.get(a);if(!st)return 0;const n=Object.keys(st).length;statusOf.delete(a);stats.cleansed=(stats.cleansed||0)+n;return n;}
if(typeof guardStart==='function'){const gBase=guardStart;guardStart=function(...a){const was=typeof player!=='undefined'&&!!player?.guard,r=gBase.apply(this,a);try{const pr=window.__STORYWORLD_COMBAT_R137__?.prefs?.();if((!pr||pr.guardCleanse!==false)&&typeof player!=='undefined'&&player&&player.guard&&!was)clearStatus(player);}catch(err){fail(err);}return r;};}
window.__STORYWORLD_DISASTER_R330__=Object.freeze({clearStatus,revision:REV,installed,KINDS:KINDS.slice(),NAME:{...NAME},set,kindOf:e=>kindOf(e),
 cast:(e,k)=>{if(k&&GO[k])e.r330Kind=k;cast(e);},
 status:()=>Object.fromEntries(Object.entries(statusOf.get(player)||{}).map(([k,v])=>[k,{name:ST[k].name,left:+Math.max(0,v.until-T()).toFixed(2)}])),
 lights:()=>{const t=T();return fx.filter(f=>f.k==='blaze'&&t>=f.t0&&t-f.t0<f.life||f.k==='meteor'&&t-f.t0>f.warn&&t-f.t0<f.warn+1.5||f.k==='bomb'&&t-f.t0>f.warn&&t-f.t0<f.warn+.8).map(f=>({x:f.x,y:f.y,r:3,fire:true}));},
 inspect:()=>({revision:REV,on,installed,stats:{...stats,byKind:{...stats.byKind}},fx:fx.length,queued:queue.length,zones:zones.length,status:Object.keys(statusOf.get(player)||{}),guest:guest(),lastError})});
})();
