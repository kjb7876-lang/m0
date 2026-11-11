// R561 기억사수 총기 스킬 4종 — 사용자 2026-11-10 "기억사수 스킬 1. 레이저총(굵은 레이저) 2. 저격총 3. 라이플 소총 4. (지정 지점) 대형 폭격 느낌으로 스킬 변경".
//  다른 게임은 '느낌' 참고만 — 이름·그림·소리·대사는 StoryWorld 세계관(기억·망각·잔향)으로 새로 짓는다.
//  Q '회상 광선포'  : 0.18초 충전 뒤 0.72초 동안 굵은 광선이 곧게 뻗는다(길이 9칸, 벽에서 멈춤). 줄 위 모든 적을 6번 태운다.
//                     재사용·피해는 엔진 Q(기억 재현)와 같은 틀 — 재사용 10초×(1-.05×Q강화), 대상당 총 2.16×고유기 위력(엔진 2.2×).
//  W '망각 저격'    : 0.35초 조준선(겨눈 적 발밑 조준 고리) 뒤 한 발. 사거리 16칸, 첫 적 2.2×공격력·뒤 한 명 관통 절반, 첫 적 살짝 밀림. 재사용 8초.
//                     보스·정예가 사거리 안에 보이면 그쪽을 먼저 겨눈다.
//  E '잔향 연사'    : 0.1초마다 8발(가장 가까운 적을 다시 겨눔). 한 발 0.15×공격력, 첫 적에서 멈춤. 재사용 6초. 쏘는 동안 움직일 수 있다.
//  R '기억 소거 폭격': 가장 많이 모인 적 무리(11칸 안) 바닥에 조준 고리를 1.6초 보여 준 뒤 하늘에서 큰 폭격.
//                     반지름 3.8칸, 중심 1.2칸 안 3.6×공격력, 가장자리 55%까지 줄어듦. 화면 흔들림. 재사용 16초.
//  W·E·R 은 R103 스킬강화 단계(0~7) 마다 피해 +10%. 재사용은 전투 박자(R26) 곱.
//  바꾼 칸: 엔진 Q(기억 재현)·W(상태 정화=공명방어 D 와 중복)·E(팬텀 블링크=블링크 S 와 중복)·R(시간 지연포).
//   원래 W·E 는 R209 가, R 은 이 파일이 먼 재사용 대기로 막아 두고(같은 키에 두 기술이 나가지 않게) 키·단추·창구 입구만 이 파일이 받는다.
//  영웅 식별자(gunner)·저장 형식은 그대로(막아 둔 먼 대기는 저장하지 않는다). 영화 모드 화자 매핑과 무관.
//  그림: 임시 코드 이펙트 — R106 칠한 스프라이트(slashline·bolt·flare·ring·line·spark·pixel·glow·pillar·smoke·flame·crack)를
//   기억사수 고유색(코발트 [70,124,255])·보조색(실버)으로 물들여 그린다. 최종본은 Dots 24프레임 시트로 바꿀 예정(CX-0058 요청서).
//  연계(사용자 2026-11-10 03:23Z "스킬키를 늘리지 말고 기존 키에서 여러 스킬이 자동으로 연속으로 더 나가게 — 자연스럽고 렉 신경"):
//   키를 한 번 누르면 그 스킬이 끝나는 박자에 맞춰 준비된 다른 총기 스킬이 이어서 나간다(최대 2개 더). 새 키·새 칸 없음.
//   Q→저격→연사 · W→연사→광선 · E→저격→광선 · R(조준 고리 동안)→연사→저격. 이어지는 스킬도 자기 재사용 대기를 쓰므로 분당 화력은 그대로.
//   재사용 중이거나 사거리 안 적이 없으면 그 고리는 건너뛴다. 연계 중 다른 키를 누르면 앞 연계를 끊고 새로 시작(조작 우선).
//   한 번에 한 고리만(겹침 없음), 살아 있는 이펙트 묶음 8개 상한(넘으면 새 시전을 미룸). 반자동·길잡이 자동 시전은 연계하지 않는다.
// 끄기(엔진 원래 스킬로 되돌림): localStorage['storyworld.r561.gunner']='{"on":false}' · 연계만 끄기 '{"chain":false}'
(()=>{'use strict';
if(window.__STORYWORLD_GUNNER_ARMS_R561__)return;
const REV='R561-gunner-arms-1',KEY='storyworld.r561.gunner',HERO='gunner';
let on=true,chainOn=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;if(s&&s.chain===false)chainOn=false;}catch(_){}
const stats={q:0,w:0,e:0,r:0,hits:0,drawn:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,SPR=()=>window.__STORYWORLD_FX_SPRITES_R106__;
const COB={a:[70,124,255],b:[214,226,246]},CORE={a:[150,196,255],b:[255,255,255]},SIL={a:[150,164,190],b:[245,248,255]},EMBER={a:[210,120,60],b:[255,232,190]},SMOKE={a:[34,38,52],b:[150,156,176]};
const CD={w:8,e:6,r:16},NAME={q:'회상 광선포',w:'망각 저격',e:'잔향 연사',r:'기억 소거 폭격'},SHORT={w:'저격',e:'연사',r:'폭격'},RANGE={w:16,e:10,r:11};
const BEAM={len:9,half:.75,charge:.18,every:.12,ticks:6,per:.36},SNIPE={aim:.35,dmg:2.2,pierce:.5,half:.35,push:.45},RIFLE={n:8,every:.1,dmg:.15,half:.3},STRIKE={delay:1.6,R:3.8,inner:1.2,edge:.55,dmg:3.6};
const FAR=1e6,SLOTS=['w','e','r'],CAP=8;
// R561-2: R 폭격 낙하 시트 — 드라이브 core24 'meteor' 시트(미사용분)를 코발트로 물들인 것(hero-fx-recolor, 192칸 6×4, 24장 12.5fps, 착탄 10번째 장).
const METEOR={path:'assets/r561/gunner-bombard-meteor.webp',cell:192,cols:6,frames:24,fps:12.5,impact:10,piv:[.52,.78],span:120};
const asked={};
function sheet(p){try{const got=typeof readyImage==='function'?readyImage(p):null;if(got?.image)return got.image;const t=Date.now();if(t-(asked[p]||0)>1500){asked[p]=t;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
// R: Dots r2 폭발 시트가 있으면 그것(타격 4번째 칸을 1.6초 폭발에), 없으면 R411 재색 낙하 시트
function drawR(f,c,Wd,el){if(gsOn('blast')){const fr=Math.floor((el-(STRIKE.delay-GS.blast.hit/12.5))*12.5);if(fr>=0&&fr<GS.blast.frames)gsDraw('blast',fr,c.x,c.y,Wd*.95/GS.blast.vis,0,1,.4,f.t0.toFixed(3));return true;}return drawMeteor(f,c,Wd,el);}
function drawMeteor(f,c,Wd,el){const im=sheet(METEOR.path);if(!im||typeof ctx==='undefined'||!ctx)return false;const fr=Math.floor((el-(STRIKE.delay-METEOR.impact/METEOR.fps))*METEOR.fps);if(fr<0)return true;if(fr>=METEOR.frames)return true;
 const C=METEOR.cell,sc=Wd*.95/METEOR.span,w=C*sc,sx=(fr%METEOR.cols)*C,sy=Math.floor(fr/METEOR.cols)*C;ctx.save();try{const run=()=>{ctx.globalCompositeOperation='source-over';ctx.drawImage(im,sx,sy,C,C,c.x-METEOR.piv[0]*w,c.y-METEOR.piv[1]*w,w,w);
   /* 어두운 화면 보정에 코발트 빛이 묻혀 회색 안개처럼 보여(헤드리스 실측) 같은 장을 한 번 더 덧셈으로 — 연기(회색)는 그대로, 빛만 산다 */ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.9;ctx.drawImage(im,sx,sy,C,C,c.x-METEOR.piv[0]*w,c.y-METEOR.piv[1]*w,w,w);};
  /* R411 과 같이 기록기 묶음(scope)으로 넘긴다 — 효과층 깊이·투명도를 기록기가 바로 알게 */const meta={id:'r561:meteor:'+f.t0.toFixed(3),kind:'effect',x:f.c.x,y:f.c.y,r561:true};if(typeof ctx.scope==='function')ctx.scope(meta,run);else run();}catch(e){fail(e);}finally{ctx.restore();}stats.sheet=(stats.sheet||0)+1;return true;}
// R561b: Dots CX-0059G r1 시트(이펙트 스레드 손질본) — Q 몸통(가로 반복)·총구·끝점, R 조준 고리는 헤드리스 전후에서 코드 고리보다 흐려(위험 표시가 약함) 쓰지 않음. 시트가 없거나 덜 읽혔으면 코드 그림 그대로.
const GS={beam:{path:'assets/r561/gunner-q-beam.webp',cw:512,ch:128,cols:6,frames:24,piv:[0,64],vis:106},
 muzzle:{path:'assets/r561/gunner-q-muzzle.webp',cw:256,ch:256,cols:6,frames:24,piv:[41,131],fire:6,vis:170},
 impact:{path:'assets/r561/gunner-q-impact.webp',cw:224,ch:224,cols:6,frames:20,piv:[158,139],vis:180},
 blast:{path:'assets/r561/gunner-r-blast.webp',cw:256,ch:256,cols:6,frames:24,piv:[128,247],hit:4,vis:200},
 tracer:{path:'assets/r561/gunner-w-tracer.webp',cw:512,ch:128,cols:6,frames:24,piv:[0,64],vis:14},
 wimpact:{path:'assets/r561/gunner-w-impact.webp',cw:256,ch:256,cols:6,frames:24,piv:[146,136],vis:200},
 rifle:{path:'assets/r561/gunner-e-rifle.webp',cw:256,ch:256,cols:6,frames:24,piv:[35,139],vis:165},
 wmuzzle:{path:'assets/r561/gunner-w-muzzle.webp',cw:256,ch:256,cols:6,frames:24,piv:[65,136],hit:1,vis:130},
 casing:{path:'assets/r561/gunner-e-casings.webp',cw:256,ch:256,cols:6,frames:16,piv:[128,200],vis:24}};
function gsOn(k){return !!sheet(GS[k].path);}
// 한 칸 그리기(오른쪽을 보고 그린 그림 → 겨눈 각으로 돌리고, 왼쪽을 볼 땐 위아래를 뒤집어 거꾸로 서지 않게). glow>0 이면 같은 칸을 덧셈으로 한 번 더(어두운 화면 보정에 코발트가 묻히지 않게, R 낙하 시트와 같은 방식).
function gsDraw(k,fr,x,y,sc,ang,alpha,glow,id,len,stretch){const g=GS[k],im=sheet(g.path);if(!im||typeof ctx==='undefined'||!ctx||!(alpha>0)||!(sc>0))return false;fr=((fr%g.frames)+g.frames)%g.frames;
 const sx=(fr%g.cols)*g.cw,sy=Math.floor(fr/g.cols)*g.ch;ctx.save();try{const run=()=>{ctx.translate(x,y);if(ang)ctx.rotate(ang);ctx.scale(sc,Math.cos(ang||0)<0?-sc:sc);
   const one=()=>{if(stretch&&len!=null){ctx.drawImage(im,sx,sy,g.cw,g.ch,-g.piv[0],-g.piv[1],len/sc,g.ch);return;}if(len==null){ctx.drawImage(im,sx,sy,g.cw,g.ch,-g.piv[0],-g.piv[1],g.cw,g.ch);return;}const L=len/sc;for(let o=0;o<L;o+=g.cw){const w=Math.min(g.cw,L-o);ctx.drawImage(im,sx,sy,w,g.ch,o-g.piv[0],-g.piv[1],w,g.ch);}};
   ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='source-over';one();if(glow>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=glow;one();}};
  const meta={id:'r561:'+k+':'+id,kind:'effect',r561:true};if(typeof ctx.scope==='function')ctx.scope(meta,run);else run();}catch(e){fail(e);}finally{ctx.restore();}stats.sheet=(stats.sheet||0)+1;return true;}
const CHAIN={q:['w','e'],w:['e','q'],e:['w','q'],r:['e','w']};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const mine=()=>on&&typeof player==='object'&&!!player&&player.hero===HERO&&solo();
function level(slot){try{const st=window.__STORYWORLD_GROWTH_R103__?.state?.();return Math.max(0,Math.min(7,Number(st?.procs?.[HERO+':'+slot])||0));}catch(_){return 0;}}
const grow=slot=>1+.1*level(slot);
// R571 사몽 발현 사거리·범위 +77%(공용 API range(), 환도 R590 과 같이 최대 2배로 막음)
function rg(v){try{const r=Number(window.__STORYWORLD_SAMONG_SURGE_R571__?.range?.(v));return Number.isFinite(r)&&r>0?Math.min(r,v*2):v;}catch(_){return v;}}
// 산 성장 '시간의 결'(R62 factors().cooldown) + R169 세모 보정 — 엔진 special·WER 경로를 안 타므로 여기서 같은 배율을 곱한다
function auraCd(){let f=1;try{const c=Number(window.__STORYWORLD_PROGRESSION_R62__?.factors?.()?.cooldown);if(Number.isFinite(c)&&c>0)f=c;const U=window.__STORYWORLD_UPGRADES_R169__,pf=U?.inspect?.()?.prefs;if(pf?.square&&pf.boost!==false&&solo()){const k=Number(U.ratios?.()?.cool);if(Number.isFinite(k)&&k>0)f*=k;}}catch(_){}return Math.min(1.5,Math.max(.1,f));}
// R571 사몽 발현: 다른 영웅처럼 재사용 대기 -77%(공용 API cd(), 없으면 그대로)
function surgeCd(s){try{const v=window.__STORYWORLD_SAMONG_SURGE_R571__?.cd?.(s);return Number.isFinite(v)&&v>=0?v:s;}catch(_){return s;}}
function rhythm(){return typeof COMBAT_RHYTHM_R26==='number'?COMBAT_RHYTHM_R26:1;}
function power(){try{return typeof attackPower==='function'?attackPower():20;}catch(_){return 20;}}
function live(){let rows=[];try{rows=typeof liveEnemies==='function'?liveEnemies():(room?.enemies||[]);}catch(_){rows=room?.enemies||[];}
 return rows.filter(e=>e&&e.hp>0&&!e.deadRecorded&&(!e.spawnState||e.spawnState==='active')&&e.visible!==false&&(typeof damageable3!=='function'||damageable3(e)));}
function los(a,b){try{return typeof clearLine!=='function'||clearLine(a,b);}catch(_){return true;}}
function wall(x,y){try{return typeof blocked==='function'&&!!blocked(x,y,.1,room);}catch(_){return false;}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function nearest(r,from=player){let b=null,bd=r;for(const e of live()){const d=dist(e,from);if(d<bd&&los(from,e)){bd=d;b=e;}}return b;}
function forward(){const v={front:[1,1],back:[-1,-1],left:[-1,1],right:[1,-1]}[player.direction]||[1,1];return Math.atan2(v[1],v[0]);}
function aimAt(e){if(e)return Math.atan2(e.y-player.y,e.x-player.x);try{if(typeof storyAim22==='function'){const a=storyAim22();if(Number.isFinite(a))return a;}}catch(_){}return forward();}
// 벽까지 길이(0.2칸 걸음)
function reach(o,a,max){const c=Math.cos(a),s=Math.sin(a);for(let d=.2;d<=max;d+=.2)if(wall(o.x+c*d,o.y+s*d))return Math.max(.3,d-.2);return max;}
// 줄 위 적(가까운 순)
function onLine(o,a,L,half){const c=Math.cos(a),s=Math.sin(a),out=[];for(const e of live()){const dx=e.x-o.x,dy=e.y-o.y,t=dx*c+dy*s;if(t<0||t>L+(e.radius||.3))continue;if(Math.abs(-dx*s+dy*c)>half+(e.radius||.3))continue;if(!los(o,e))continue;out.push([t,e]);}return out.sort((p,q)=>p[0]-q[0]).map(p=>p[1]);}
function hit(e,amount,tag){try{if(typeof hitEnemy==='function'&&amount>0){const r=hitEnemy(e,amount,{kind:'hero-skill-r561',attackKind9:'skill',ability:tag,hero:HERO,sourceHero:HERO,friendly:true,owner:'hero'});if(r)stats.hits++;return r;}}catch(err){fail(err);}return false;}
function face(a){try{player.attackAngle=a;if(typeof facing==='function')player.direction=facing(Math.cos(a),Math.sin(a));}catch(_){}}
function quake(v){try{if(typeof shake!=='undefined')shake=Math.max(shake,v);}catch(_){}}
function snd(k){try{if(typeof sound==='function')sound(k);}catch(_){}}
const fx=[];let peakFx=0;const SENT={type:'r561-fx',x:0,y:0,age:0,life:Infinity};
function armSent(){peakFx=Math.max(peakFx,fx.length);try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
// ---- Q 회상 광선포 ----
function castQ(){let rk=0;try{rk=typeof rank==='function'?Number(rank('special'))||0:0;}catch(_){}
 player.specialCD=10*(1-.05*rk)*rhythm()*auraCd();player.skillAnim=.6;const SP=power()*(2.4+.36*rk),e=nearest(rg(12)),a=aimAt(e),o={x:player.x,y:player.y},L=reach(o,a,rg(BEAM.len));face(a);snd('special');
 fx.push({k:'q',t0:T(),life:BEAM.charge+BEAM.every*(BEAM.ticks-1)+.32,o,a,L,dmg:SP*BEAM.per,done:0,seed:Math.random()*6});armSent();stats.q++;return true;}
// ---- W 망각 저격 ----
function snipeTarget(){const rows=live().filter(e=>dist(e,player)<=rg(RANGE.w)&&los(player,e));const big=rows.filter(e=>e.boss||e.elite).sort((a,b)=>dist(a,player)-dist(b,player))[0];return big||rows.sort((a,b)=>dist(a,player)-dist(b,player))[0]||null;}
function castW(){const tg=snipeTarget(),a=aimAt(tg);face(a);fx.push({k:'w',t0:T(),life:SNIPE.aim+1.3,tg,a,o:{x:player.x,y:player.y},fired:false,end:null,dmg:power()*SNIPE.dmg*grow('w'),seed:Math.random()*6});armSent();stats.w++;return true;}
function fireW(f){f.fired=true;const o={x:player.x,y:player.y};if(f.tg&&f.tg.hp>0)f.a=Math.atan2(f.tg.y-o.y,f.tg.x-o.x);f.o=o;const L=reach(o,f.a,rg(RANGE.w)),rows=onLine(o,f.a,L,SNIPE.half);
 let endL=L;if(rows[0]){hit(rows[0],f.dmg,'gunnerSnipeR561');try{if(typeof moveActor==='function')moveActor(rows[0],Math.cos(f.a)*SNIPE.push,Math.sin(f.a)*SNIPE.push,rows[0].radius||.3);}catch(_){}endL=dist(rows[0],o);}
 if(rows[1]){hit(rows[1],f.dmg*SNIPE.pierce,'gunnerSnipeR561');endL=dist(rows[1],o);}
 f.L=Math.max(L*.999,endL);f.hitL=endL;f.tf=T();quake(.45);snd('special');face(f.a);player.skillAnim=Math.max(player.skillAnim||0,.35);}
// ---- E 잔향 연사 ----
function castE(){const e=nearest(rg(RANGE.e)),a=aimAt(e);face(a);fx.push({k:'e',t0:T(),life:RIFLE.every*(RIFLE.n-1)+(gsOn('casing')?1.1:.5),a,done:0,rounds:[],dmg:power()*RIFLE.dmg*grow('e')});armSent();stats.e++;return true;}
function shotE(f,i){const o={x:player.x,y:player.y},e=nearest(rg(RANGE.e),o);let a=e?Math.atan2(e.y-o.y,e.x-o.x):f.a;a+=(i%2?1:-1)*.035*((i%3)/2);f.a=a;const L=reach(o,a,rg(RANGE.e)),first=onLine(o,a,L,RIFLE.half)[0];let endL=L;
 if(first){hit(first,f.dmg,'gunnerRifleR561');endL=dist(first,o);}f.rounds.push({t:T(),o,a,L:endL,hit:!!first});face(a);player.skillAnim=Math.max(player.skillAnim||0,.2);if(i%3===0)snd('attack');}
// ---- R 기억 소거 폭격 ----
function strikePoint(minCount=1){const rows=live().filter(e=>dist(e,player)<=rg(RANGE.r));let best=null,bn=0;for(const e of rows){const n=rows.filter(v=>dist(v,e)<=rg(STRIKE.R)*.75).length+(e.boss?2:0);if(n>bn||(n===bn&&best&&dist(e,player)<dist(best,player))){bn=n;best=e;}}
 if(!best||bn<minCount)return null;const grp=rows.filter(v=>dist(v,best)<=rg(STRIKE.R)*.75);return {x:grp.reduce((s,v)=>s+v.x,0)/grp.length,y:grp.reduce((s,v)=>s+v.y,0)/grp.length,n:bn};}
function castR(pt){const c=pt||strikePoint()||(()=>{const a=aimAt(null);return {x:player.x+Math.cos(a)*4,y:player.y+Math.sin(a)*4};})();face(Math.atan2(c.y-player.y,c.x-player.x));snd('special');
 fx.push({k:'r',t0:T(),life:STRIKE.delay+2.3,c:{x:c.x,y:c.y},boom:false,dmg:power()*STRIKE.dmg*grow('r'),seed:Math.random()*6});armSent();stats.r++;return true;}
function boomR(f){f.boom=true;for(const e of live()){const d=dist(e,f.c);if(d>rg(STRIKE.R)+(e.radius||.3))continue;if(!los(f.c,e))continue;const k=d<=rg(STRIKE.inner)?1:1-(1-STRIKE.edge)*Math.min(1,(d-rg(STRIKE.inner))/(rg(STRIKE.R)-rg(STRIKE.inner)));hit(e,f.dmg*k,'gunnerStrikeR561');}quake(1.4);snd('special');}
// ---- 연계 ----
const LINK=sl=>sl==='q'?BEAM.charge+BEAM.every*(BEAM.ticks-1)+.25:sl==='w'?SNIPE.aim+.25:sl==='e'?RIFLE.every*(RIFLE.n-1)+.3:.35;
const chain={queue:[],at:0,lastAt:0,prev:null,links:0,minGap:Infinity,overlap:0,cancelled:0};
function startChain(sl){if(!chainOn)return;if(chain.queue.length)chain.cancelled++;chain.queue=(CHAIN[sl]||[]).slice();chain.prev=sl;chain.lastAt=T();chain.at=T()+LINK(sl);}
function tryLink(sl){if(fx.length>=CAP)return false;if(sl==='q'){if(player.specialCD>0||!nearest(rg(12)))return false;castQ();return true;}return fire(sl,true);}
function stepChain(){if(!chain.queue.length)return;if(!mine()||busy()){chain.queue.length=0;return;}const t=T();if(t<chain.at)return;
 while(chain.queue.length){const sl=chain.queue.shift();if(tryLink(sl)){const gap=t-chain.lastAt;if(gap<LINK(chain.prev)-1e-6)chain.overlap++;chain.minGap=Math.min(chain.minGap,gap);chain.links++;chain.prev=sl;chain.lastAt=t;chain.at=t+LINK(sl);break;}}}
// ---- 시간 진행 ----
function step(){const t=T();for(const f of fx){const el=t-f.t0;
  if(f.k==='q'){while(f.done<BEAM.ticks&&el>=BEAM.charge+f.done*BEAM.every-1e-9){f.done++;for(const e of onLine(f.o,f.a,f.L,BEAM.half))hit(e,f.dmg,'gunnerBeamR561');}}
  else if(f.k==='w'){if(!f.fired&&el>=SNIPE.aim-1e-9)fireW(f);}
  else if(f.k==='e'){while(f.done<RIFLE.n&&el>=f.done*RIFLE.every-1e-9){shotE(f,f.done);f.done++;}}
  else if(f.k==='r'){if(!f.boom&&el>=STRIKE.delay-1e-9)boomR(f);}}
 for(let i=fx.length-1;i>=0;i--)if(t-fx[i].t0>fx[i].life||t<fx[i].t0-1)fx.splice(i,1);}
// ---- 그림(임시 코드 이펙트) ----
function ellW(c,R){try{const k=R/Math.SQRT2,p1=project(c.x+k,c.y-k),p2=project(c.x-k,c.y+k),w=Math.abs(p1.x-p2.x);if(w>4)return w;const p3=project(c.x+R,c.y),p0=project(c.x,c.y);return Math.max(8,Math.abs(p3.x-p0.x)*2);}catch(_){return 80;}}
function draw(){const S0=SPR();if(!S0||typeof project!=='function')return;const S={draw:(n,F,x,y,w,h,o={})=>S0.draw(n,F,x,y,w,h,{overHero:true,...o}),along:(n,F,x0,y0,x1,y1,w,o={})=>S0.along?.(n,F,x0,y0,x1,y1,w,{overHero:true,...o})};
 const H=typeof actorHeight==='function'?actorHeight():60,t=T(),M=H*.45;
 for(const f of fx){const el=t-f.t0;if(el<0||el>f.life)continue;stats.drawn++;
  if(f.k==='q'){const q=project(f.o.x,f.o.y),e=project(f.o.x+Math.cos(f.a)*f.L,f.o.y+Math.sin(f.a)*f.L),x0=q.x,y0=q.y-M,x1=e.x,y1=e.y-M,ang=Math.atan2(y1-y0,x1-x0);
   if(gsOn('beam')&&gsOn('muzzle')&&gsOn('impact')){const id=f.t0.toFixed(3),mS=H*1.5/GS.muzzle.vis;
    // 총구: 0~7칸(충전)을 0.18초 충전에 맞춰 빨리 돌리고, 8번째 칸(발사)이 첫 타격 순간에 오게 — 그 뒤는 12.5fps
    if(el<BEAM.charge){gsDraw('muzzle',Math.min(GS.muzzle.fire-1,Math.floor(el/BEAM.charge*GS.muzzle.fire)),x0,y0,mS,ang,1,.6,id);continue;}
    const b=el-BEAM.charge,dur=f.life-BEAM.charge,fade=b>dur-.18?Math.max(0,(dur-b)/.18):1,open=Math.min(1,b/.06),xe=x0+(x1-x0)*open,ye=y0+(y1-y0)*open,len=Math.hypot(xe-x0,ye-y0);
    gsDraw('beam',Math.floor(t*12.5),x0,y0,H*1.05/GS.beam.vis,ang,fade,.8,id,len);
    /* 시트 몸통만으론 어두운 화면 보정에 회색 안개처럼 묽어 보여(헤드리스 전후) 가는 흰 심 한 줄을 겹친다 */S.along('line',CORE,x0,y0,xe,ye,H*.2*fade,{alpha:.9,blend:'screen'});
    gsDraw('impact',Math.floor(b*12.5),xe,ye,H*1.7/GS.impact.vis,ang,fade,.5,id);
    gsDraw('muzzle',Math.min(GS.muzzle.frames-1,GS.muzzle.fire+Math.floor(b*12.5)),x0,y0,mS,ang,fade,.6,id);continue;}
   if(el<BEAM.charge){const k=el/BEAM.charge;S.draw('flare',COB,x0,y0,H*(.5+k*.9),H*(.5+k*.9),{alpha:.6+.4*k,angle:t*9});S.draw('ring',CORE,x0,y0,H*(1.4-k),H*(1.4-k),{alpha:.7*k});continue;}
   const b=el-BEAM.charge,dur=f.life-BEAM.charge,fade=b>dur-.18?Math.max(0,(dur-b)/.18):1,open=Math.min(1,b/.06),fl=.86+.14*Math.sin(t*61+f.seed),xe=x0+(x1-x0)*open,ye=y0+(y1-y0)*open;
   // 굵은 광선 = R106 'line'(둥근 끝 빛 막대)을 굵기 셋으로 겹친 관 + 흐르는 빛 덩이 몇 개(기록기는 그라데이션을 못 써서 그림을 겹친다).
   S.along('line',COB,x0,y0,xe,ye,H*1.05*fl*fade,{alpha:.8,blend:'screen'});S.along('line',COB,x0,y0,xe,ye,H*.6*fl*fade,{alpha:.9,blend:'screen'});S.along('line',CORE,x0,y0,xe,ye,H*.26*fl*fade,{alpha:1,blend:'screen'});
   {const n=6;for(let i=0;i<n;i++){const k=((t*2.2+i/n+f.seed)%1),x=x0+(xe-x0)*k,y=y0+(ye-y0)*k;S.draw('glow',CORE,x,y,H*.7*fade,H*.7*fade,{alpha:.45*Math.sin(Math.PI*k),blend:'screen'});}}
   S.along('slashline',CORE,x0,y0,xe,ye,H*.3*fl*fade,{alpha:.9,blend:'screen'});
   S.along('bolt',SIL,x0,y0,xe,ye,H*.7*fade,{alpha:.45*fade,frame:Math.floor(t*24)});
   S.draw('flare',CORE,x0,y0,H*1.1*fl,H*1.1*fl,{alpha:.9*fade,angle:ang});S.draw('glow',COB,xe,ye,H*1.6*fl,H*1.6*fl,{alpha:.85*fade});S.draw('flare',CORE,xe,ye,H*.9,H*.9,{alpha:.8*fade,angle:t*7});
   for(let i=0;i<5;i++){const s=(t*3+i*.21+f.seed)%1,ra=ang+Math.PI+(i-2)*.45;S.draw('spark',SIL,xe+Math.cos(ra)*H*.5*s,ye+Math.sin(ra)*H*.5*s,H*.5,H*.12,{alpha:.8*fade*(1-s),angle:ra});}}
  else if(f.k==='w'){const q=project(player.x,player.y);
   if(!f.fired){const k=Math.min(1,el/SNIPE.aim),tg=f.tg&&f.tg.hp>0?f.tg:null,tp=tg?project(tg.x,tg.y):project(player.x+Math.cos(f.a)*8,player.y+Math.sin(f.a)*8);
    S.along('line',COB,q.x,q.y-M,tp.x,tp.y-M,H*.035,{alpha:.55+.4*k});S.draw('ring',COB,tp.x,tp.y,H*(1.7-1.0*k),H*(1.7-1.0*k),{alpha:.5+.5*k,squash:.5,angle:t*2,blend:'screen'});S.draw('ring',CORE,tp.x,tp.y-M,H*(.9-.5*k),H*(.9-.5*k),{alpha:.35+.5*k});
    S.draw('glow',COB,q.x+Math.cos(f.a)*H*.3,q.y-M,H*.5*k,H*.5*k,{alpha:.7});continue;}
   const v=Math.min(1,(t-f.tf)/.45),u=1-v,o=project(f.o.x,f.o.y),e=project(f.o.x+Math.cos(f.a)*f.hitL,f.o.y+Math.sin(f.a)*f.hitL),ang=Math.atan2(e.y-o.y,e.x-o.x);
   if(gsOn('tracer')&&gsOn('wimpact')){const d=t-f.tf,fr=Math.floor(d*12.5),id=f.t0.toFixed(3);if(fr>=GS.tracer.frames)continue;
    gsDraw('tracer',fr,o.x,o.y-M,H*.2/GS.tracer.vis,ang,1,.6,id,Math.hypot(e.x-o.x,e.y-o.y),true);if(d<.12)S.along('line',CORE,o.x,o.y-M,e.x,e.y-M,H*.08,{alpha:1-d/.12,blend:'screen'});
    gsDraw('wimpact',fr,e.x,e.y-M,H*1.6/GS.wimpact.vis,ang,1,.5,id);if(gsOn('wmuzzle'))gsDraw('wmuzzle',GS.wmuzzle.hit+fr,o.x+Math.cos(ang)*H*.3,o.y-M+Math.sin(ang)*H*.3,H*2.2/GS.wmuzzle.vis,ang,1,.9,id);continue;}
   S.along('slashline',SIL,o.x,o.y-M,e.x,e.y-M,H*.36*u,{alpha:.8*u,blend:'screen'});S.along('line',CORE,o.x,o.y-M,e.x,e.y-M,H*.12*(.4+u),{alpha:.95*u});
   S.draw('flare',CORE,o.x+Math.cos(ang)*H*.25,o.y-M+Math.sin(ang)*H*.25,H*1.2*u+H*.2,H*.7*u+H*.1,{alpha:u,angle:ang});S.draw('ring',SIL,o.x,o.y-M,H*(.4+1.4*v),H*(.4+1.4*v),{alpha:.6*u,squash:.6});
   S.draw('flare',COB,e.x,e.y-M,H*1.3*u+H*.2,H*1.3*u+H*.2,{alpha:.9*u,angle:t*5});for(let i=0;i<6;i++){const ra=ang+Math.PI+(i-2.5)*.4;S.draw('spark',CORE,e.x+Math.cos(ra)*H*.6*v,e.y-M+Math.sin(ra)*H*.6*v,H*.55,H*.12,{alpha:u,angle:ra});}}
  else if(f.k==='e'){const cOn=gsOn('casing');for(const r of f.rounds){const d=t-r.t;if(d<0||d>(cOn?.8:.32))continue;const o=project(r.o.x,r.o.y),e=project(r.o.x+Math.cos(r.a)*r.L,r.o.y+Math.sin(r.a)*r.L),ang=Math.atan2(e.y-o.y,e.x-o.x);
    // 탄피(Dots GN-08 r3, 16칸): 총 반대쪽으로 튀어 떨어짐. 금속이라 덧셈 빛 없이. 왼쪽을 볼 땐 좌우만 뒤집음(π 회전 + gsDraw 위아래 뒤집기).
    if(cOn){gsDraw('casing',Math.min(GS.casing.frames-1,Math.floor(d*20)),o.x,o.y-M,H*.3/GS.casing.vis,Math.cos(ang)>=0?Math.PI:0,d>.65?(.8-d)/.15:1,0,f.t0.toFixed(3)+':c'+r.t.toFixed(3));if(d>.32)continue;}
    const rOn=gsOn('rifle');if(rOn)gsDraw('rifle',Math.min(3,Math.floor(d*12.5)),o.x,o.y-M,H*1.5/GS.rifle.vis,ang,1,.5,f.t0.toFixed(3)+':'+r.t.toFixed(3));
    if(!rOn&&d<.09){const k=d/.09,hx=o.x+(e.x-o.x)*k,hy=o.y-M+(e.y-o.y)*k,tx=o.x+(e.x-o.x)*Math.max(0,k-.35),ty=o.y-M+(e.y-o.y)*Math.max(0,k-.35);S.along('spark',CORE,tx,ty,hx,hy,H*.16,{alpha:.95});}
    if(!rOn&&d<.06)S.draw('flare',COB,o.x+Math.cos(ang)*H*.28,o.y-M+Math.sin(ang)*H*.28,H*.55,H*.35,{alpha:1-d/.06,angle:ang});
    if(r.hit&&d>=.06&&d<.22){const k=(d-.06)/.16;S.draw('flare',CORE,e.x,e.y-M,H*.5*(1-k)+H*.1,H*.5*(1-k)+H*.1,{alpha:1-k,angle:ang});for(let i=0;i<3;i++)S.draw('pixel',SIL,e.x+Math.cos(ang+Math.PI+(i-1)*.7)*H*.4*k,e.y-M+Math.sin(ang+Math.PI+(i-1)*.7)*H*.4*k,H*.1,H*.1,{alpha:1-k});}
    if(!cOn){const k=d/.32,side=Math.cos(ang)>=0?-1:1;S.draw('pixel',SIL,o.x+side*H*(.15+.35*k),o.y-M-H*.25*Math.sin(Math.PI*k)+H*.35*k*k,H*.07,H*.04,{alpha:.9*(1-k),angle:t*20,blend:'source-over'});}}}
  else if(f.k==='r'){const c=project(f.c.x,f.c.y),Wd=ellW(f.c,rg(STRIKE.R)),sheetOn=gsOn('blast')||!!sheet(METEOR.path);
   if(!f.boom){const k=el/STRIKE.delay,blink=.55+.45*Math.max(0,Math.sin(t*(8+22*k)));
    S.draw('ring',COB,c.x,c.y,Wd,Wd,{alpha:.95*blink,squash:.5,angle:t*.8,blend:'screen'});S.draw('ring',CORE,c.x,c.y,Wd*1.02,Wd*1.02,{alpha:.5*blink,squash:.5,blend:'screen'});S.draw('ring',CORE,c.x,c.y,Wd*(1-k)*.9+H*.3,Wd*(1-k)*.9+H*.3,{alpha:.8*blink,squash:.5,blend:'screen'});
    for(let i=0;i<4;i++){const ra=i*Math.PI/2+t*.8,rx=Math.cos(ra)*Wd*.5,ry=Math.sin(ra)*Wd*.25;S.along('line',CORE,c.x+rx*.82,c.y+ry*.82,c.x+rx*1.08,c.y+ry*1.08,H*.06,{alpha:.9*blink});}
    S.draw('glow',COB,c.x,c.y,H*(.6+.6*k),H*(.3+.3*k),{alpha:.8*blink});
    if(sheetOn)drawR(f,c,Wd,el);else if(k>.55){const s=(k-.55)/.45;S.draw('pillar',CORE,c.x,c.y,H*(.9-.7*s),H*9,{alpha:.7*s,blend:'screen'});}continue;}
   const b=el-STRIKE.delay,v=Math.min(1,b/2.2),u=1-v;
   if(sheetOn){S.draw('crack',SIL,c.x,c.y,Wd*.9,Wd*.9,{alpha:.7*u,squash:.5,blend:'source-over'});drawR(f,c,Wd,el);
    S.draw('ring',CORE,c.x,c.y,Wd*(.3+1.1*Math.min(1,b/.5)),Wd*(.3+1.1*Math.min(1,b/.5)),{alpha:Math.max(0,1-b/.5),squash:.5,blend:'screen'});if(b<.3)S.draw('glow',CORE,c.x,c.y-H*.4,Wd*1.1,Wd*.8,{alpha:.7*(1-b/.3),blend:'screen'});continue;}
   if(b<.4){const k=b/.4;S.draw('glow',CORE,c.x,c.y-H*.6,Wd*(1.2+k),Wd*(1.2+k),{alpha:1-k*.5,blend:'screen'});S.draw('pillar',CORE,c.x,c.y,H*2.2,H*10,{alpha:1-k,blend:'screen'});}
   S.draw('crack',SIL,c.x,c.y,Wd*.9,Wd*.9,{alpha:.7*u,squash:.5,blend:'source-over'});
   S.draw('ring',CORE,c.x,c.y,Wd*(.3+1.1*Math.min(1,b/.5)),Wd*(.3+1.1*Math.min(1,b/.5)),{alpha:Math.max(0,1-b/.5),squash:.5,blend:'screen'});
   S.draw('ring',COB,c.x,c.y,Wd*(.2+1.4*Math.min(1,b/.8)),Wd*(.2+1.4*Math.min(1,b/.8)),{alpha:.9*Math.max(0,1-b/.8),squash:.5,blend:'screen'});
   S.draw('flame',EMBER,c.x,c.y,Wd*.7,H*(1.2+1.2*Math.min(1,b*3))*u,{alpha:.95*u,frame:Math.floor(b*12),blend:'screen'});
   const rise=Math.min(1,b/.9),sa=Math.min(1,u*1.6);for(let i=0;i<4;i++){const y=c.y-H*(.4+i*.75)*rise;S.draw('smoke',SMOKE,c.x+Math.sin(f.seed+i)*H*.12,y,H*(1.0+.25*i)*(.6+.4*rise),H*(1.0+.25*i)*(.6+.4*rise),{alpha:.8*sa,blend:'source-over',angle:f.seed+i+b*.4});}
   for(let i=-1;i<=1;i++)S.draw('smoke',SMOKE,c.x+i*H*.9*rise,c.y-H*3.4*rise,H*1.6*(.5+.5*rise),H*1.1*(.5+.5*rise),{alpha:.75*sa,blend:'source-over',angle:f.seed-i+b*.3});
   if(b<1.2)S.draw('glow',EMBER,c.x,c.y-H*3.2*rise,H*2.2,H*1.2,{alpha:.45*(1-b/1.2),blend:'screen'});
   S.draw('glow',EMBER,c.x,c.y-H*.3,Wd*.8,Wd*.4,{alpha:.8*u});}}}
// 물들인 그림 미리 만들기(R106 은 준비 안 된 그림을 그리지 않는다 — 첫 시전이 비어 보이던 것)
let warmed=false;const WARM=[[COB,['slashline','flare','ring','glow','line','spark','pixel']],[CORE,['slashline','flare','ring','line','spark','pillar','glow']],[SIL,['bolt','spark','pixel','slashline','ring','crack']],[EMBER,['flame','glow']],[SMOKE,['smoke']]];
function warm(){if(warmed||!mine())return;const S=SPR();if(!S?.warm)return;warmed=true;sheet(METEOR.path);for(const k in GS)sheet(GS[k].path);for(const [F,n] of WARM)S.warm(F,n);}
// ---- 입구 ----
const readyAt={w:0,e:0,r:0};
function remain(sl){return Math.max(0,(readyAt[sl]||0)-T());}
function egoOn(){try{return !!window.__STORYWORLD_EGO151__?.inspect?.().state?.active;}catch(_){return false;}}
// 방·영웅이 바뀌거나 쓰러지면 기다리던 사격·연계를 버린다(엔진 WER valid/cancel 과 같은 뜻) — 옛 좌표로 새 방 적을 때리지 않게
let ownRoom=null,ownPlayer=null,ownSeen=false;function own(){let rm=null;try{rm=typeof room!=='undefined'?room:null;}catch(_){}const p=typeof player==='object'?player:null;if(!ownSeen){ownSeen=true;ownRoom=rm;ownPlayer=p;}if(p!==ownPlayer){for(const sl of SLOTS)readyAt[sl]=0;nextAuto=0;}
 const t=T();for(const sl of SLOTS)readyAt[sl]=Math.min(readyAt[sl],t+CD[sl]*rhythm());nextAuto=Math.min(nextAuto,t+.35);
 if(rm!==ownRoom||p!==ownPlayer||!(p?.hp>0)){if(fx.length||chain.queue.length){fx.length=0;if(chain.queue.length){chain.queue.length=0;chain.cancelled++;}}ownRoom=rm;ownPlayer=p;}}
function busy(){try{return (typeof started!=='undefined'&&!started)||(typeof modal!=='undefined'&&!!modal)||(typeof loading!=='undefined'&&loading)||(typeof storyScene!=='undefined'&&!!storyScene)||!(player?.hp>0)||!!window.__STORYWORLD_EGO151__?.inspect?.().state?.active;}catch(_){return true;}}
function fire(sl,automatic){if(!mine()||!SLOTS.includes(sl)||busy())return false;if(readyAt[sl]>T())return false;if(fx.length>=CAP)return false;
 let pt=null;if(automatic){if(sl==='r'){pt=strikePoint(2);if(!pt)return false;}else if(!(sl==='w'?snipeTarget():nearest(rg(RANGE[sl]))))return false;}
 const ok=sl==='w'?castW():sl==='e'?castE():castR(pt);if(ok){readyAt[sl]=T()+surgeCd(CD[sl]*rhythm()*auraCd());player.skillAnim=Math.max(player.skillAnim||0,.5);try{if(typeof updateHUD==='function')updateHUD();}catch(_){}}return ok;}
// 엔진 원래 R(시간 지연포) 막기 — W·E 는 R209 owned 가 막는다(여기서도 함께, R209 가 없을 때 대비)
function gate(){try{if(typeof player!=='object'||!player||player.hero!==HERO)return;const s=player.storyWER||(player.storyWER={ready:{},buffs:{}});if(!s.ready)s.ready={};const t=T();
  if(mine()){for(const sl of SLOTS){const k=HERO+':'+sl;if(!(s.ready[k]>t+FAR/2)){const v=Number(s.ready[k]);if(v>t)readyAt[sl]=Math.max(readyAt[sl],Math.min(v,t+CD[sl]*rhythm()));s.ready[k]=t+FAR;}}}else{const k=HERO+':r';if(s.ready[k]>t+FAR/2)s.ready[k]=0;}}catch(e){fail(e);}}
let ORIG_Q=null;function names(){try{if(typeof HEROES==='object'&&HEROES?.[HERO]){if(ORIG_Q==null)ORIG_Q=HEROES[HERO].special;HEROES[HERO].special=on?NAME.q:ORIG_Q;}}catch(e){fail(e);}}
names();
if(typeof special==='function'){const base=special;special=function(...a){if(mine()&&!egoOn()){try{if(busy()||player.specialCD>0||fx.length>=CAP)return;castQ();if(!autoOn())startChain('q');try{if(typeof updateHUD==='function')updateHUD();}catch(_){}}catch(e){fail(e);}return;}return base.apply(this,a);};}
let wrapped=false;
function install(){const W=window.__STORYWORLD_WER__;if(!W||wrapped||W.__r561)return !!W;wrapped=true;const base=W.cast;
 window.__STORYWORLD_WER__=Object.freeze({...W,__r561:true,cast(slot,automatic,...a){const sl=String(slot).toLowerCase();if(mine()&&SLOTS.includes(sl)){try{return fire(sl,!!automatic);}catch(e){fail(e);return false;}}return base.call(this,slot,automatic,...a);}});return true;}
let nextAuto=0;
function autoOn(){try{const mob=window.__STORYWORLD_MOBILE_R63__?.isMobile?.();return (mob?settings.autoSkill===true:(typeof auto!=='undefined'&&auto))||(typeof guide!=='undefined'&&guide);}catch(_){return false;}}
function tickAuto(){if(!mine()||busy()||!autoOn())return;const t=T();if(t<nextAuto)return;nextAuto=t+.35;fire('r',true)||fire('w',true)||fire('e',true);}
if(typeof tick==='function'){const b=tick;tick=function(...a){try{own();}catch(e){fail(e);}gate();const r=b.apply(this,a);try{warm();if(fx.length)step();stepChain();tickAuto();}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const b=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r561-fx'){try{draw();}catch(err){fail(err);}return;}return b.apply(this,[e,...a]);};}
if(typeof serializeSave==='function'){const b=serializeSave;serializeSave=function(...a){const d=b.apply(this,a);try{const r=d?.storyWER?.remaining;if(r&&mine())for(const sl of SLOTS){const m=remain(sl);if(m>0)r[HERO+':'+sl]=+m.toFixed(2);else delete r[HERO+':'+sl];}}catch(e){fail(e);}return d;};}
// 불러오기: 엔진 restoreSave 는 남은 대기를 옛 기억사수 스킬 한도(6/3.8/13×박자)로 자른다 → 저장 원본에서 새 스킬 한도로 되살린다(저장 형식은 그대로)
if(typeof restoreSave==='function'){const b=restoreSave;restoreSave=function(raw,...a){let keep=null;try{const r=(typeof raw==='string'?JSON.parse(raw):raw)?.storyWER?.remaining;if(r)keep=Object.fromEntries(SLOTS.map(sl=>[sl,Number(r[HERO+':'+sl])||0]));}catch(_){}
 const out=b.apply(this,[raw,...a]);const after=()=>{try{if(!keep||!mine())return;ownSeen=true;ownPlayer=player;try{ownRoom=typeof room!=='undefined'?room:null;}catch(_){}const t=T();for(const sl of SLOTS)readyAt[sl]=keep[sl]>0?t+Math.min(keep[sl],CD[sl]*rhythm()):0;}catch(e){fail(e);}};
 if(out&&typeof out.then==='function')return out.then(v=>{after();return v;});after();return out;};}
if(typeof updateHUD==='function'){const b=updateHUD;updateHUD=function(...a){const r=b.apply(this,a);try{if(mine()&&typeof document!=='undefined')for(const sl of SLOTS){const el=document.getElementById('story-wer-'+sl);if(!el)continue;const cd=el.querySelector('.cd'),m=remain(sl);if(cd)cd.textContent=m>0?String(Math.ceil(m)):'';el.title=NAME[sl];el.setAttribute('aria-label',NAME[sl]+' · '+(typeof KR291!=='undefined'&&KR291?KR291[sl]:sl.toUpperCase()));const lb=el.querySelector('.label');if(lb&&lb.textContent!==SHORT[sl])lb.textContent=SHORT[sl];}}catch(e){fail(e);}return r;};}
const KEYS={z:'w',x:'e',c:'r'};
if(typeof addEventListener==='function'){addEventListener('keydown',ev=>{try{if(!mine()||ev.repeat||ev.ctrlKey||ev.metaKey||ev.altKey)return;try{window.__STORYWORLD_KEYS_R291__?.translate?.(ev);}catch(_){}const sl=KEYS[String(ev.key).toLowerCase()];if(!sl)return;const tg=ev.target;if(tg&&(/INPUT|TEXTAREA|SELECT/.test(tg.tagName||'')||tg.isContentEditable))return;if(busy())return;gate();if(fire(sl,false))startChain(sl);}catch(e){fail(e);}},true);
 const btn=ev=>{try{if(!mine())return;const b=ev.target?.closest?.('#story-wer-w,#story-wer-e,#story-wer-r');if(!b)return;if(ev.type==='click'&&ev.detail!==0)return;ev.preventDefault();ev.stopPropagation();if(!busy()){gate();const sl=b.id.slice(-1);if(fire(sl,false))startChain(sl);}}catch(e){fail(e);}};
 addEventListener('pointerdown',btn,true);addEventListener('click',btn,true);}
let tries=0;(function arm(){try{install();}catch(e){fail(e);}if(++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_GUNNER_ARMS_R561__=Object.freeze({revision:REV,on:()=>on&&solo(),names:NAME,cooldowns:CD,fire,remain,level,
 inspect:()=>({revision:REV,on,chainOn,stats:{...stats},fx:fx.length,peakFx,cap:CAP,chain:{queue:chain.queue.slice(),links:chain.links,minGap:chain.minGap,overlap:chain.overlap,cancelled:chain.cancelled},remain:{w:remain('w'),e:remain('e'),r:remain('r')},lastError}),
 set:v=>{if(v&&typeof v==='object'){if('on' in v)on=v.on!==false;if('chain' in v)chainOn=v.chain!==false;}else on=v!==false;if(!chainOn)chain.queue.length=0;try{localStorage.setItem(KEY,JSON.stringify({on,chain:chainOn}));}catch(_){}names();gate();return on;}});
})();
