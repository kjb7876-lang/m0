// R590 환도 검술 연계 — 사용자 2026-11-10 (요약) 동아시아 검술·발도·칼날 바람 베기·7연격·번개처럼 한 번에 베는 일섬 등 여러 칼잡이를 참고해 업그레이드
//  + "스킬키를 늘리지말고 기존 스킬키에서 자동으로 여러스킬이 연속으로 더나가게하는 느낌으로" + "자연스럽고 렉부분도 신경써서".
//  다른 작품은 느낌만 참고했다. 기술 이름·그림·연출은 StoryWorld 고유(실버+황금, 코드 이펙트, 새 그림 자산 없음).
//  새 키·새 슬롯 없음. 기존 키를 누르면 뒤에 한 동작이 자동으로 이어진다(박자를 두고 하나씩).
//   A 기본 공격 → 「납도 발검」 : 칼을 거둔 채(마지막 공격 뒤 2초) 처음 베는 한 번이 발도 — 공격력 ×1.4, 황금 섬광 한 줄.
//   Q 정화 연참 → 「은빛 검풍」 : 연참이 끝나는 0.5초 뒤 겨눈 쪽으로 칼바람 초승달 2개(0.12초 간격)가 날아가 꿰뚫는다. 각 공격력 ×0.4, 6칸, 벽에서 멈춤.
//   E 백은 유영보 → 「유영 일섬」 : 돌진해 지나간 0.32초 뒤 지나온 길이 한 줄로 늦게 갈라진다. 공격력 ×0.6(돌진 본 피해 ×1.25 는 그대로).
//   R 환수검(7파) → 「칠연 환수검 · 종섬」 : 일곱 파마다 방향이 바뀌는 베기 선이 보이고(7연격), 7파 뒤 0.3초 칼을 거뒀다가
//      가까운 적 쪽으로 일직선 발도 한 줄(5.5칸, 벽에서 끊김) — 공격력 ×1.6. 영웅은 옮기지 않는다(벽 통과·맵 이탈 없음).
//  판정은 엔진 hitEnemy(난이도·노출·보스 규칙 그대로)·blocked(벽·맵 끝)·clearLine 으로. 협동(R62 mode≠off)에서는 피해·발도 배율을 넣지 않는다.
//  시전 감지: 기본 공격·Q 는 전역 basicAttack·special 을 감싸 성공(재사용 대기가 새로 생김)일 때만, E·R 은 WER 이 내는
//   fx('storySourceSkill',{storyWER,sourceHero:'hwando',sourceSlot,stage,castId}) 신호(E 'flight' tx·ty = 실제 충돌 처리된 돌진 끝, R 'release' 파마다)로 받는다.
//  렉: 검풍 동시 6개, 그림 조각 한 프레임 24개 상한, 저사양(lowFx·모바일)이면 곁불(섬광·잔광)을 뺀다. 할 일이 없으면 그리기 표지를 effects 에서 뺀다.
//  R590b(같은 날, 7분야 심사 7.49 → 보강): 드라이브 core24 시트를 실버+황금으로 색만 바꾼 두 장(hero-fx-recolor, 원본 moving_tornado_v001·R438 enemy-shockwave)을
//   검풍 = 땅 위를 나아가는 은빛 회오리(코드 초승달은 앞날로 작게 남김), 발도·종섬 끝 = 발밑 황금 착지 고리로 쓴다. 시트가 아직 안 왔으면 코드 그림으로 대신한다.
//  R975(2026-11-13): E 늦은 일섬 피해는 hwando-ilseom-r975.js 가 있으면 넘겨받아 보스 우선·좌우 7연 다단히트로 나눈다(총합 ×0.6 그대로).
//  끄기: localStorage['storyworld.r590.hwandoChain']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_CHAIN_R590__)return;
const REV='R590-hwando-chain-5',KEY='storyworld.r590.hwandoChain';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const CFG=Object.freeze({sheathIdle:2,drawMult:1.4,
 windDelay:.5,windCount:2,windGap:.12,windSpread:.08,windSpeed:11,windRange:6,windRadius:.55,windMult:.4,maxBlades:6,
 flashDelay:.32,flashRadius:.6,flashMult:.6,
 waves:7,finaleDelay:.3,finaleRange:5.5,finaleRadius:.7,finaleMult:1.6,
 maxDraws:24,maxVis:24});
const SHEETS=Object.freeze({wind:Object.freeze({path:'assets/r590/hwando-wind-tornado.webp',pivot:[92,160],hTiles:1.5}),ring:Object.freeze({path:'assets/r590/hwando-iai-ring.webp',pivot:[96,94],wTiles:1.9}),
 // R590d: Dots CX-0062HW 손질본(dots-r2, 칸 256, 오른쪽 향함). len=칼길 그림 길이(px), th=가장 두꺼운 칸 두께(px),
 // lift=밝기 올림 — 시트 몸통이 회색(평균 68~143)이라 밝은 안개 바닥에서 묻힘(헤드리스 실측) → brightness 로 은빛까지 올림
 cut:Object.freeze({path:'assets/r590/hwando-a-draw-cut.webp',cell:256,pivot:[20,188],len:205,hit:5,lift:2.4,crop:[0,140,256,222]}),
 blade:Object.freeze({path:'assets/r590/hwando-q-wind-blade.webp',cell:256,pivot:[205,122],th:150,loop:20}),
 flash:Object.freeze({path:'assets/r590/hwando-e-delayed-flash.webp',cell:256,pivot:[17,132],len:223,th:90,hit:7,lift:1.7,crop:[0,80,256,184]}),
 // CX-0064T 수묵 문양(dots-r3, 칸 192, 피벗=발): 사몽 발현 중 R572 몸 둘레 문양(코드 붓 획)을 이 시트로 바꿔 그림
 sigilB:Object.freeze({path:'assets/r590/hwando-sigil-back.webp',cell:192,pivot:[96,144]}),
 sigilF:Object.freeze({path:'assets/r590/hwando-sigil-front.webp',cell:192,pivot:[96,144]}),
 finale:Object.freeze({path:'assets/r590/hwando-r-finale-draw.webp',cell:256,pivot:[13,128],len:228,th:148,hit:5,lift:1.7,crop:[0,48,256,214]})}),CELL=192,COLS=6,FRAMES=24,FPS=12.5;
const asked=new Map();
function sheet(k){const p=SHEETS[k].path;try{const got=typeof readyImage==='function'?readyImage(p):null;if(got?.image)return got.image;
 const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
function preload(){patchTheme();try{if(typeof ensureImages==='function')Promise.resolve(ensureImages(Object.values(SHEETS).map(v=>v.path))).catch(()=>{});}catch(_){}}
// 시트 한 칸: (x,y)=기준점 화면 좌표, s=배율, a=투명도
function cell(im,fr,x,y,piv,s,a,flip=false){ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(a,0,1);ctx.translate(x,y);ctx.scale(flip?-s:s,s);
 ctx.drawImage(im,(fr%COLS)*CELL,Math.floor(fr/COLS)*CELL,CELL,CELL,-piv[0],-piv[1],CELL,CELL);}catch(e){fail(e);}finally{ctx.restore();}}
// 오른쪽을 향한 칼길 시트 한 칸을 화면 각도 ang 로 돌려 그림. 왼쪽을 향할 땐 위아래를 뒤집어 광원(왼쪽 위) 쪽 밝은 면이 위에 남게 한다.
// 먹 받침(ink): 같은 칸을 어둡게(brightness 만 — 기록기 허용 필터) 오른쪽 아래로 2~3px 비켜 먼저 깔아 밝은 바닥에서도 칼자국 윤곽이 읽히게 한다(수묵 테마·광원 왼쪽 위).
function strip(k,fr,x,y,ang,sx,sy,a,ink=0,crop=null){const im=sheet(k);if(!im)return false;const D=SHEETS[k],C=D.cell||CELL;fr=clamp(Math.floor(fr),0,FRAMES-1);const u0=(fr%COLS)*C,v0=Math.floor(fr/COLS)*C,K=crop||D.crop||[0,0,C,C],cw=K[2]-K[0],ch=K[3]-K[1];
 const one=(ox,oy,al,dark)=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(al,0,1);if(dark)ctx.filter='brightness(0.18)';else if(D.lift&&D.lift!==1)ctx.filter='brightness('+D.lift+')';ctx.translate(x+ox,y+oy);ctx.rotate(ang);ctx.scale(sx,Math.cos(ang)<0?-sy:sy);
  ctx.drawImage(im,u0+K[0],v0+K[1],cw,ch,K[0]-D.pivot[0],K[1]-D.pivot[1],cw,ch);stats.sheetDraws=(stats.sheetDraws||0)+1;}catch(e){fail(e);}finally{ctx.restore();}};
 if(ink>0&&!low()&&budget>0){budget--;one(2,3,a*ink,true);}one(0,0,a,false);return true;}// 먹 받침도 그리기 예산 1칸을 쓴다(상한 유지)
// 영웅 몸에서 0.55칸 앞에서 시작(R350 가림 옅게가 영웅 상자와 겹친 만큼 이펙트를 최대 85% 지우므로 — 헤드리스 실측)
const AHEAD=.55,fwd=(o,a,d)=>({x:o.x+Math.cos(a)*d,y:o.y+Math.sin(a)*d});
const tail=v=>{const L=Math.hypot(v.b.x-v.a.x,v.b.y-v.a.y);return L>AHEAD*2?fwd(v.b,Math.atan2(v.a.y-v.b.y,v.a.x-v.b.x),AHEAD):v.b;};
const SAN=(p,q)=>Math.atan2(q.y-p.y,q.x-p.x),SD=(p,q)=>Math.hypot(q.x-p.x,q.y-p.y),ready=k=>!!sheet(k);
const PAL=Object.freeze({a:Object.freeze([214,222,234]),b:Object.freeze([244,248,255])}),GOLD=Object.freeze({a:Object.freeze([255,198,72]),b:Object.freeze([255,232,170])});
const stats={draws:0,winds:0,blades:0,flashes:0,waves:0,finales:0,hits:0,damage:0,wallStops:0,coopSkipped:0,budgetSkips:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
// 사몽 발현 배수(R571): 이 연계는 special()·story-wer 지연 밖 자체 틱에서 돌므로 사거리·반경만 직접 곱한다(쿨은 엔진 쪽이 이미 줄임 → 중복 금지). 상한(maxBlades·maxDraws)은 그대로.
const rng=v=>{try{const g=window.__STORYWORLD_SAMONG_SURGE_R571__;const r=g?.range?Number(g.range(v)):v;return fin(r)&&r>0?Math.min(r,v*2):v;}catch(_){return v;}};
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const SP=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s?.on?.()?s:null;};
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const unit=()=>(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1);
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
const egoOn=()=>{try{return !!window.__STORYWORLD_EGO151__?.inspect?.()?.state?.active;}catch(_){return false;}};
const isHw=()=>typeof player!=='undefined'&&!!player&&player.hero==='hwando'&&player.hp>0;
const open=(x,y,r=.2)=>typeof blocked!=='function'||!blocked(x,y,r,room);
const line=(a,b)=>typeof clearLine!=='function'||clearLine(a,b,room);
const foes=()=>{try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}};
const nearest=r=>{try{return typeof nearestEnemy==='function'?nearestEnemy(r):null;}catch(_){return null;}};
const aim=()=>{try{return typeof storyAim22==='function'?storyAim22():0;}catch(_){return 0;}};
/* R765: 쏘는 각 = 영웅 그림 8방향 칸 중심(적은 어느 칸인지만 정함) — 적에게 정확히 꺾지 않는다. 화면각 S → 월드: dx=(cosS+2sinS)/2, dy=(2sinS-cosS)/2 */
const wSEC={e:0,se:Math.PI/4,s:Math.PI/2,sw:Math.PI*.75,w:Math.PI,nw:-Math.PI*.75,n:-Math.PI/2,ne:-Math.PI/4};
function weaponAngle(a){const sc=Math.atan2((Math.cos(a)+Math.sin(a))*.5,Math.cos(a)-Math.sin(a));let S=0,b=9;for(const k in wSEC){const d=Math.abs(Math.atan2(Math.sin(sc-wSEC[k]),Math.cos(sc-wSEC[k])));if(d<b){b=d;S=wSEC[k];}}return Math.atan2(2*Math.sin(S)-Math.cos(S),Math.cos(S)+2*Math.sin(S));}

const power=()=>{try{return typeof attackPower==='function'?attackPower():0;}catch(_){return 0;}};
function snapshot(){return {room,player,zone:typeof zone!=='undefined'?zone:null};}
function valid(j){return on&&isHw()&&j.room===room&&j.player===player&&(typeof zone==='undefined'||zone===j.zone);}
// ---- 피해 ----------------------------------------------------------------------------------------------------
function strike(e,mult,base,tag,slot,id){if(!solo()){stats.coopSkipped++;return false;}if(typeof hitEnemy!=='function')return false;const dmg=base*mult;if(!(dmg>0))return false;
 if(typeof damageable3==='function'&&!damageable3(e))return false;const old=e.hp,ok=hitEnemy(e,dmg,{kind:'story-hwando-chain-r590',attackKind9:'skill',friendly:true,owner:'hero',sourceHero:'hwando',sourceSlot:slot,attackId9:'r590:'+id,r590:tag});
 if(ok&&old>e.hp){stats.hits++;stats.damage+=old-e.hp;try{if(typeof floatText==='function')floatText(Math.round(old-e.hp),e.x,e.y);}catch(_){}}return ok;}
function segHits(a,b,radius,mult,base,tag,slot,id){const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy;if(!(L2>.0025))return 0;let k=0;
 for(const e of foes()){if(!(e.hp>0)||!fin(e.x)||!fin(e.y))continue;const t=clamp(((e.x-a.x)*dx+(e.y-a.y)*dy)/L2,0,1),c={x:a.x+dx*t,y:a.y+dy*t};
  if(Math.hypot(e.x-c.x,e.y-c.y)>=radius+(e.radius||0))continue;if(!line(c,e))continue;if(strike(e,mult,base,tag,slot,id))k++;}return k;}
// 원점에서 각도 쪽으로 벽·맵 끝 앞까지(0.1칸 걸음)
function rayEnd(o,ang,range){const ux=Math.cos(ang),uy=Math.sin(ang);let x=o.x,y=o.y;for(let d=.1;d<=range+1e-9;d+=.1){const nx=o.x+ux*d,ny=o.y+uy*d;if(!open(nx,ny)){stats.wallStops++;break;}x=nx;y=ny;}return {x,y};}
// ---- 일정·그림 목록 ------------------------------------------------------------------------------------------
const jobs=[],blades=[],vis=[];let lastSwing=-Infinity,boost=1,lastT=null,lastFinale=null;const seenE=new Set(),waves=new Map();
const later=(sec,j,fn)=>{jobs.push({at:T()+sec,j,fn});arm();};
const addVis=v=>{vis.push({t0:T(),...v});while(vis.length>CFG.maxVis)vis.shift();arm();};
const SENT={type:'r590-hwando-chain',x:0,y:0,age:0,life:Infinity,r590Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function clearAll(){jobs.length=0;blades.length=0;vis.length=0;waves.clear();disarm();}
// ---- A 납도 발검 ---------------------------------------------------------------------------------------------
function onBasic(base,self,args){
 const can=on&&isHw()&&!egoOn()&&solo(),cd0=player?.attackCD,sheathed=can&&T()-lastSwing>=CFG.sheathIdle&&!(cd0>0);
 const prior=boost;if(sheathed)boost=CFG.drawMult;let r;
 try{r=base.apply(self,args);}finally{boost=prior;}
 try{if(isHw()&&!(cd0>0)&&player.attackCD>0){if(sheathed){stats.draws++;const e=nearest(4),a=e?Math.atan2(e.y-player.y,e.x-player.x):aim();addVis({k:'draw',x:player.x,y:player.y,a,life:ready('cut')?19/18.75:.32});addVis({k:'ring',x:player.x,y:player.y,life:FRAMES/FPS*.55,size:1});}lastSwing=T();}}catch(e){fail(e);}
 return r;}
// ---- Q → 은빛 검풍 -------------------------------------------------------------------------------------------
function onSpecial(base,self,args){const cd0=player?.specialCD,r=base.apply(self,args);
 try{if(on&&isHw()&&!egoOn()&&!(cd0>0)&&player.specialCD>0){lastSwing=T();const j=snapshot(),e=nearest(12),a=weaponAngle(e?Math.atan2(e.y-player.y,e.x-player.x):aim()),pw=power(),id='q'+(++stats.winds);
  for(let i=0;i<CFG.windCount;i++){const off=CFG.windCount>1?(i/(CFG.windCount-1)-.5)*2*CFG.windSpread:0;
   later(CFG.windDelay+i*CFG.windGap,j,()=>launch(player.x,player.y,a+off,pw,id+':'+i,j));}}}catch(e){fail(e);}
 return r;}
function launch(x,y,a,pw,id,j){const ux=Math.cos(a),uy=Math.sin(a),sx=x+ux*.8,sy=y+uy*.8;if(!open(sx,sy)){stats.wallStops++;return;}
 blades.push({id,x:sx,y:sy,ux,uy,a,pw,range:rng(CFG.windRange),radius:rng(CFG.windRadius),travel:0,hit:new Set(),j,t0:T()});stats.blades++;while(blades.length>CFG.maxBlades)blades.shift();arm();}
function stepBlades(dt){for(let i=blades.length-1;i>=0;i--){const b=blades[i];if(!valid(b.j)){blades.splice(i,1);continue;}
 let move=CFG.windSpeed*dt,dead=false;while(move>1e-9&&!dead){const s=Math.min(.2,move);move-=s;const nx=b.x+b.ux*s,ny=b.y+b.uy*s;
  if(!open(nx,ny)){stats.wallStops++;dead=true;break;}b.x=nx;b.y=ny;b.travel+=s;
  for(const e of foes()){if(!(e.hp>0)||b.hit.has(e.id))continue;if(Math.hypot(e.x-b.x,e.y-b.y)<b.radius+(e.radius||0)&&line(b,e)){b.hit.add(e.id);strike(e,CFG.windMult,b.pw,'wind','q',b.id);}}
  if(b.travel>=b.range)dead=true;}
 if(dead)blades.splice(i,1);}}
// ---- E → 유영 일섬 -------------------------------------------------------------------------------------------
function onFlight(x,y,o){if(seenE.has(o.castId))return;seenE.add(o.castId);if(seenE.size>64)seenE.delete(seenE.values().next().value);
 if(!fin(x)||!fin(y)||!fin(o.tx)||!fin(o.ty))return;const a={x,y},b={x:o.tx,y:o.ty};if(Math.hypot(b.x-a.x,b.y-a.y)<.05)return;
 lastSwing=T();const j=snapshot(),pw=power(),id='e:'+o.castId;addVis({k:'trail',a,b,life:CFG.flashDelay});if(ready('flash'))stats.sheetE=(stats.sheetE||0)+1;
 later(CFG.flashDelay,j,()=>{stats.flashes++;addVis({k:'flash',a,b,life:ready('flash')?17/16:.34});
  // R975: 보스 우선·좌우 7연 다단히트가 켜져 있으면 이 한 방 피해(×0.6)를 넘겨받아 7타로 나눈다(돌진 자체는 그대로). 없거나 꺼져 있으면 원래대로.
  let took=false;try{const M=window.__STORYWORLD_HWANDO_ILSEOM_R975__;took=!!(M&&typeof M.take==='function'&&M.take({a,b,pw,id,mult:CFG.flashMult,radius:rng(CFG.flashRadius)}));}catch(e){fail(e);}
  if(!took)segHits(a,b,rng(CFG.flashRadius),CFG.flashMult,pw,'flash','e',id);});}
// ---- R 칠연 환수검 → 종섬 ------------------------------------------------------------------------------------
function onWave(x,y,o){let w=waves.get(o.castId);if(!w){w={n:0,done:false,a:fin(o.visualWorldAngle35)?o.visualWorldAngle35:aim()};waves.set(o.castId,w);if(waves.size>16)waves.delete(waves.keys().next().value);}
 if(w.done)return;w.n++;stats.waves++;lastSwing=T();
 // 파마다 방향이 바뀌는 베기 한 줄(황금비 각도로 돌아 겹치지 않게) — 7연격이 눈으로 셀 수 있게
 addVis({k:'wave',x,y,a:w.a+w.n*2.39996,r:fin(o.size)?o.size:3.3,n:w.n,life:.24});
 if(w.n>=CFG.waves){w.done=true;const j=snapshot(),pw=power(),id='r:'+o.castId,fa=w.a;
  addVis({k:'charge',x:player.x,y:player.y,a:fa,life:CFG.finaleDelay});later(CFG.finaleDelay,j,()=>finale(pw,id,fa));}}
function finale(pw,id,fallback){const o={x:player.x,y:player.y},e=nearest(7),a=weaponAngle(e?Math.atan2(e.y-o.y,e.x-o.x):fin(fallback)?fallback:aim()),end=rayEnd(o,a,rng(CFG.finaleRange));
 stats.finales++;lastFinale={x0:o.x,y0:o.y,x1:end.x,y1:end.y,at:T()};addVis({k:'finale',a:o,b:end,life:ready('finale')?19/14:.46});addVis({k:'ring',x:end.x,y:end.y,life:FRAMES/FPS*.55,size:1.25});segHits(o,end,rng(CFG.finaleRadius),CFG.finaleMult,pw,'finale','r',id);}
// ---- 그리기(R106 조각만, 실버+황금) --------------------------------------------------------------------------
let budget=0;
function put(S,fn){if(budget<=0){stats.budgetSkips++;return;}budget--;fn();}
function scr(p,lift=.45){const q=project(p.x,p.y);return {x:q.x,y:q.y-H()*lift};}
function drawAll(){const S=SP();if(!S)return;const t=T(),lo=low(),u=unit(),h=H();budget=lo?Math.round(CFG.maxDraws*.5):CFG.maxDraws;
 for(const v of vis){const age=t-v.t0,k=age/v.life;if(k<0||k>=1)continue;const fade=k<.35?1:1-smooth((k-.35)/.65);
  // 시트가 있으면 시트 한 칸(한 번 put), 없으면 아래 R106 코드 그림
  if(v.k==='draw'&&ready('cut')){const p=scr(fwd(v,v.a,AHEAD),.45),q0=project(v.x+Math.cos(v.a)*3,v.y+Math.sin(v.a)*3),q={x:q0.x,y:q0.y-h*.45},sc=Math.max(SD(p,q)/SHEETS.cut.len,h*1.6/SHEETS.cut.len);
   put(S,()=>strip('cut',SHEETS.cut.hit+age*18.75,p.x,p.y,SAN(p,q),sc,Math.max(sc,h*1.2/49),1,.6));}
  else if(v.k==='trail'&&ready('flash')){const p=scr(v.a,.4),q=scr(tail(v),.4),F=SHEETS.flash;put(S,()=>strip('flash',k*F.hit,p.x,p.y,SAN(p,q),SD(p,q)/F.len,h*1.1/F.th,1,.5));}
  else if(v.k==='flash'&&ready('flash')){const p=scr(v.a,.4),q=scr(tail(v),.4),F=SHEETS.flash;put(S,()=>strip('flash',F.hit+age*16,p.x,p.y,SAN(p,q),SD(p,q)/F.len,h*1.1/F.th,1,.6));}
  else if(v.k==='wave'&&ready('cut')){const c=project(v.x,v.y),R=Math.min(v.r,3.3)*u*.55,dx=Math.cos(v.a)*R,dy=Math.sin(v.a)*R*.5,cy=c.y-h*.3,p={x:c.x-dx,y:cy-dy},q={x:c.x+dx,y:cy+dy},sc=SD(p,q)/SHEETS.cut.len;
   put(S,()=>strip('cut',4+k*8,p.x,p.y,SAN(p,q),sc,Math.max(sc,h*1.1/49),1,.5));}
  else if(v.k==='charge'){if(!ready('finale'))continue;const p=scr(v,.42),q0=project(v.x+Math.cos(v.a),v.y+Math.sin(v.a)),sc=h*1.7/SHEETS.finale.th;put(S,()=>strip('finale',k*4,p.x,p.y,SAN(p,{x:q0.x,y:q0.y-h*.42}),sc,sc,1,.5));}
  else if(v.k==='finale'&&ready('finale')){const fa=Math.atan2(v.b.y-v.a.y,v.b.x-v.a.x),p=scr(Math.hypot(v.b.x-v.a.x,v.b.y-v.a.y)>AHEAD*2?fwd(v.a,fa,AHEAD):v.a,.42),q=scr(v.b,.42),F=SHEETS.finale;put(S,()=>strip('finale',F.hit+age*14,p.x,p.y,SAN(p,q),SD(p,q)/F.len,h*1.7/F.th,1,.6));}
  else if(v.k==='draw'){const p=scr(v),q=project(v.x+Math.cos(v.a)*2.2,v.y+Math.sin(v.a)*2.2),ex=q.x,ey=q.y-h*.45,g=smooth(age/.08),mx=p.x+(ex-p.x)*g,my=p.y+(ey-p.y)*g;
   put(S,()=>S.along('slashline',GOLD,p.x,p.y,mx,my,h*.3,{alpha:.95*fade,blend:'screen',overHero:true}));
   if(!lo&&age<.12)put(S,()=>S.draw('flare',GOLD,p.x,p.y,h*.7,h*.7,{alpha:.6*(1-age/.12),blend:'screen'}));}
  else if(v.k==='ring'){const im=sheet('ring');if(!im)continue;const q=project(v.x,v.y),R=SHEETS.ring,s=R.wTiles*v.size*u/150,fr=Math.min(FRAMES-1,Math.floor(age/v.life*FRAMES));
   put(S,()=>cell(im,fr,q.x,q.y,R.pivot,s,.9));}
  else if(v.k==='trail'){if(lo)continue;const p=scr(v.a,.4),q=scr(v.b,.4);put(S,()=>S.along('slashline',PAL,p.x,p.y,q.x,q.y,h*.1,{alpha:.28,blend:'screen'}));}
  else if(v.k==='flash'){const p=scr(v.a,.4),q=scr(v.b,.4),th=h*.42*(1-.4*k);
   put(S,()=>S.along('iai-cut',PAL,p.x,p.y,q.x,q.y,th,{alpha:.9*fade,blend:'screen'}));
   put(S,()=>S.along('slashline',GOLD,p.x,p.y,q.x,q.y,th*.35,{alpha:fade,blend:'screen',overHero:true}));}
  else if(v.k==='wave'){const c=project(v.x,v.y),R=Math.min(v.r,3.3)*u*.55,dx=Math.cos(v.a)*R,dy=Math.sin(v.a)*R*.5,cy=c.y-h*.3;
   put(S,()=>S.along('iai-cut',PAL,c.x-dx,cy-dy,c.x+dx,cy+dy,h*.36,{alpha:.9*fade,blend:'screen'}));
   if(!lo&&v.n===CFG.waves)put(S,()=>S.draw('flare',GOLD,c.x,cy,h*.8,h*.8,{alpha:.55*fade,blend:'screen'}));}
  else if(v.k==='finale'){const p=scr(v.a,.42),q=scr(v.b,.42),g=smooth(age/.07),qx=p.x+(q.x-p.x)*g,qy=p.y+(q.y-p.y)*g,th=h*.55*(1-.45*k);
   put(S,()=>S.along('iai-cut',GOLD,p.x,p.y,qx,qy,th,{alpha:.9*fade,blend:'screen'}));
   put(S,()=>S.along('slashline',PAL,p.x,p.y,qx,qy,th*.32,{alpha:fade,blend:'screen',overHero:true}));
   if(!lo&&age<.2)put(S,()=>S.draw('flare',GOLD,q.x,q.y,h*.9,h*.9,{alpha:.65*(1-age/.2),blend:'screen'}));}}
 const tb=sheet('blade'),tw=tb?null:sheet('wind');
 for(const b of blades){const p=scr(b,.4),q=project(b.x+b.ux,b.y+b.uy),sa=Math.atan2(q.y-h*.4-p.y,q.x-p.x),w=u*(tw?.8:1.35),hh=w*.56;
  if(tb){const kk=b.travel/(b.range||CFG.windRange),sc=h*1.1/SHEETS.blade.th;put(S,()=>strip('blade',Math.floor((t-b.t0)*FPS)%SHEETS.blade.loop,p.x,p.y,sa,sc,sc,kk>.8?1-(kk-.8)/.2:1,.35));continue;}
  if(tw){const g=project(b.x,b.y),W=SHEETS.wind,s=W.hTiles*h/126,k=b.travel/(b.range||CFG.windRange),age=t-b.t0,fr=k>.8?Math.min(FRAMES-1,18+Math.floor((k-.8)/.2*5)):6+Math.floor(age*FPS*1.6)%12;
   put(S,()=>cell(tw,fr,g.x,g.y,W.pivot,s,1,b.ux<0));}
  put(S,()=>S.draw('slash',PAL,p.x,p.y,w,hh,{angle:sa+Math.PI/2,pivot:[.5,.82],alpha:tw?.7:.92,blend:'screen'}));
  if(!lo)put(S,()=>S.along('slashline',GOLD,p.x-Math.cos(sa)*w*.9,p.y-Math.sin(sa)*w*.9,p.x,p.y,h*.12,{alpha:.5,blend:'screen'}));}
 stats.drawCalls=(stats.drawCalls||0)+(lo?Math.round(CFG.maxDraws*.5):CFG.maxDraws)-budget;}
// ---- R572 사몽 테마 문양(환도) → Dots 수묵 문양 시트 -------------------------------------------------------------
// R572 는 이 파일보다 늦게 실린다 → 처음 쓸 때 그 환도 문양의 draw 만 감싼다(시트가 아직 없거나 연계를 끄면 원래 코드 그림).
let themePatched=false;
function patchTheme(){if(themePatched)return;try{const T=window.__STORYWORLD_SAMONG_THEME_R572__?.theme?.('hwando');if(!T||typeof T.draw!=='function'||Object.isFrozen(T))return;
 const base=T.draw;T.draw=function(L,x,fy,h,F,t,a,lo){const k=L==='front'?'sigilF':'sigilB';if(on&&(L==='back'||L==='front')&&fin(x)&&fin(fy)&&sheet(k)){const sc=Math.max(40,h)/105,fr=Math.floor((fin(t)?t:T())*FPS)%20,al=clamp(fin(a)?a:1,0,1);
  // 뒤층: 영웅보다 먼저(뒤에) 그려 몸을 가리지 않으므로 R350 가림 옅게에서 뺀다(owner.r350). 앞층: 몸 자리(가운데)는 비우고 좌우 획만, R350 그대로.
  const sc0=(id,ex,fn)=>typeof ctx.scope==='function'?ctx.scope({id,kind:'effect',x:player?.x||0,y:player?.y||0,groundAligned:false,r572:true,...ex},fn):fn();
  if(L==='back')sc0('r590:sigil-back',{r350:true},()=>strip(k,fr,x,fy,0,sc,sc,.95*al));
  else sc0('r590:sigil-front',{},()=>{strip(k,fr,x,fy,0,sc,sc,.8*al,0,[0,0,82,192]);strip(k,fr,x,fy,0,sc,sc,.8*al,0,[110,0,192,192]);});
  stats.sigils=(stats.sigils||0)+1;return;}return base.apply(this,arguments);};themePatched=true;}catch(e){fail(e);}}
// ---- 설치 ----------------------------------------------------------------------------------------------------
try{
 if(typeof attackPower==='function'){const base=attackPower;attackPower=function(){const v=base.apply(this,arguments);return boost!==1&&fin(v)?v*boost:v;};}
 if(typeof basicAttack==='function'){const base=basicAttack;basicAttack=function(...a){if(!on||!isHw())return base.apply(this,a);return onBasic(base,this,a);};}
 if(typeof special==='function'){const base=special;special=function(...a){if(!on||!isHw())return base.apply(this,a);return onSpecial(base,this,a);};}
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
  try{const o=opt||{};if(on&&type==='storySourceSkill'&&o.storyWER&&o.sourceHero==='hwando'&&isHw()&&!egoOn()&&o.castId!=null){
   if(o.sourceSlot==='e'&&o.stage==='flight')onFlight(x,y,o);else if(o.sourceSlot==='r'&&o.stage==='release'&&fin(x)&&fin(y))onWave(x,y,o);}}catch(e){fail(e);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{if(on)drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 const asHeroR720=(id,fn)=>{const D=window.__STORYWORLD_HERO_DEFENSE_R720__;return D&&typeof D.asHero==='function'?D.asHero(id,fn):fn();};/* R720-4: 다음 틱에 이어지는 기술을 그 영웅 몸(생존 배치 영웅이면 그 몸)으로 돌린다 */
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(!themePatched)patchTheme();const t=T(),dt=lastT==null?0:clamp(t-lastT,0,.1);lastT=t;
   asHeroR720('hwando',()=>{for(let i=0;i<jobs.length;){const q=jobs[i];if(t>=q.at){jobs.splice(i,1);if(valid(q.j))q.fn();}else if(!valid(q.j))jobs.splice(i,1);else i++;}
   if(dt>0)stepBlades(dt);});
   for(let i=vis.length-1;i>=0;i--)if(t-vis[i].t0>=vis[i].life||t<vis[i].t0-1)vis.splice(i,1);
   if(jobs.length||blades.length||vis.length)arm();else disarm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){clearAll();const r=await base.apply(this,a);preload();return r;};}
 preload();
 try{SP()?.warm?.(PAL,['iai-cut','slashline','slash']);SP()?.warm?.(GOLD,['iai-cut','slashline','flare']);}catch(_){}
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)clearAll();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_HWANDO_CHAIN_R590__=Object.freeze({revision:REV,config:CFG,on:()=>on,set,
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,jobs:jobs.length,vis:vis.length,lastFinale:lastFinale&&{...lastFinale},
  blades:blades.map(b=>({id:b.id,x:+b.x.toFixed(2),y:+b.y.toFixed(2),travel:+b.travel.toFixed(2),hit:[...b.hit]})),sheathed:T()-lastSwing>=CFG.sheathIdle})});
})();
