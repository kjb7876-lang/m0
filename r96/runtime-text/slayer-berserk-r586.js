// R586 슬레이어 광전사 연계 — 사용자 2026-11-10 "슬레이어도 가렌과 다리우스 참고해서 재해석해서 업그레이드",
//  "슬레이어-베르세르크가츠 광전사갑옷 십자군광전사와 주의보혈 … 영웅들 스킬풍에도 참고" (다른 작품은 느낌만, 이름·모양은 이 게임 고유).
// 새 키 없음. 기존 키(평타·W·E)에 자동으로 이어진다:
//  1) 피의 낙인: 슬레이어가 때린 적에 낙인이 쌓인다(0.2초에 하나, 최대 5, 6초 유지). 5개가 차면 그 적은 슬레이어에게 12% 더 아프다.
//  2) 처형 일격: W(피의 희생) 뒤 0.25초, 3.4칸 안에서 낙인 5개 찬 적이나 체력 30% 아래 적에게 핏빛 검기가 수직으로 내리꽂힌다.
//     피해 = 공격력 × (2 + 0.3 × 낙인). 보스가 아닌 적이 15% 아래면 그대로 끝낸다. 이 일격으로 쓰러뜨리면 W 대기가 1초로 줄어든다.
//  3) 피사슬 끌기: E(피의 대시) 끝에 앞쪽 120° 2.4칸 안 적(보스 제외, 최대 4)을 슬레이어 앞 0.7칸까지(최대 1.3칸) 끌어오고 0.35초 묶는다.
// 사몽 발현 중 거리·대기는 R571 공용 API(range·cd)로 받는다(R571 이 자동으로 거는 경로와 겹치지 않게 이 파일 계산에만).
// 그림(R587): 사슬 = Dots SL13 피사슬 시트(R585 파일의 draw 입구로 그린다, 안 읽혔으면 코드 사슬).
//  처형 검기·낙인 방울은 코드 그림 유지 — SL12·SL14 시트가 헤드리스 비교에서 더 안 읽혀 보류(Dots 다시 요청). 십자가 모양은 쓰지 않는다.
// 끄기: localStorage storyworld.r586.slayer-berserk = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_BERSERK_R586__)return;
const REV='R586-slayer-berserk-2-r587',KEY='storyworld.r586.slayer-berserk',HERO='slayer';
const RULE=Object.freeze({stackGap:.2,stackMax:5,stackLife:6,fullBonus:1.12,execDelay:.25,execRange:3.4,execLowHp:.3,execFinish:.15,execBase:2,execPerStack:.3,resetCd:1,
 pullRange:2.4,pullHalfAngle:Math.PI/3,pullKeep:.7,pullMax:1.3,pullCount:4,pullBind:.35,pullDelay:.22,fxCap:12});
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const stats={stacks:0,full:0,execs:0,kills:0,resets:0,pulls:0,pulled:0,errors:0,marks:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const T=()=>{try{return Number(time)||0;}catch(_){return 0;}};
const P=()=>{try{return player;}catch(_){return null;}};
const isHero=()=>P()?.hero===HERO;
const lowFx=()=>{try{return !!settings?.lowFx;}catch(_){return false;}};
const S571=()=>window.__STORYWORLD_SAMONG_SURGE_R571__;
const range=r=>{try{const s=S571();return s&&typeof s.range==='function'?Number(s.range(r))||r:r;}catch(_){return r;}};
const cd=s=>{try{const v=S571();return v&&typeof v.cd==='function'?Number(v.cd(s))||s:s;}catch(_){return s;}};
const live=()=>{try{return (typeof liveEnemies==='function'?liveEnemies():room.enemies.filter(e=>e.hp>0)).filter(e=>e&&e.hp>0&&e.spawnState!=='dead');}catch(_){return [];}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const isBoss=e=>!!(e&&(e.boss||e.bossR104||e.sinBoss||e.kind==='boss'));
// ---- 낙인 ----
const marks=new WeakMap();
const markOf=e=>{const m=marks.get(e);if(!m)return 0;if(T()>m.until){marks.delete(e);return 0;}return m.n;};
function addMark(e){const t=T();let m=marks.get(e);if(!m||t>m.until)m={n:0,until:0,last:-1e9};if(t-m.last<RULE.stackGap){m.until=t+RULE.stackLife;marks.set(e,m);return m.n;}
 m.last=t;m.until=t+RULE.stackLife;if(m.n<RULE.stackMax){m.n++;stats.stacks++;if(m.n===RULE.stackMax){stats.full++;m.fullAt=t;}}marks.set(e,m);return m.n;}
// 슬레이어 본인 타격만(다른 영웅·협동 동료·적 투사체 제외).
const mine=s=>{if(!isHero())return false;if(s&&typeof s==='object'){if(s.sourceHero&&s.sourceHero!==HERO)return false;if(s.coopIdR62||s.ally||s.owner==='ally'||s.owner==='enemy'||s.hostile)return false;}return true;};
let inner=0;
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){
 if(!on||inner||!e||!(e.hp>0)||!mine(source))return base.call(this,e,value,source,...a);
 let v=value;try{if(markOf(e)>=RULE.stackMax&&Number.isFinite(v)&&v>0)v=v*RULE.fullBonus;}catch(err){fail(err);}
 const r=base.call(this,e,v,source,...a);try{if(r!==false&&e.hp>0)addMark(e);else if(e.hp<=0)marks.delete(e);}catch(err){fail(err);}return r;};}
// ---- 이펙트(엔진 effects 에 넣어 나이·수명은 엔진이 돌린다) ----
const fxLive=()=>{try{return Array.isArray(effects)?effects.filter(f=>f&&typeof f.type==='string'&&f.type.startsWith('r586-')):[];}catch(_){return [];}};
function spawn(type,o){try{if(fxLive().length>=(lowFx()?6:RULE.fxCap))return null;const f={type,age:0,...o};effects.push(f);return f;}catch(_){return null;}}
// ---- 처형 일격(W 뒤) ----
const queue=[];
function pickExec(){const p=P();if(!p)return null;const R=range(RULE.execRange);let best=null,score=-1;
 for(const e of live()){if(dist(e,p)>R)continue;const n=markOf(e),ratio=e.maxHp>0?e.hp/e.maxHp:1;if(n<RULE.stackMax&&ratio>=RULE.execLowHp)continue;const s=(!isBoss(e)&&ratio<RULE.execFinish?3:0)+(n>=RULE.stackMax?2:0)+(1-ratio);if(s>score){score=s;best=e;}}return best;}
function execute(e){const p=P();if(!e||!(e.hp>0)||!p)return;const n=markOf(e),ratio=e.maxHp>0?e.hp/e.maxHp:1;
 let dmg=(typeof attackPower==='function'?attackPower():50)*(RULE.execBase+RULE.execPerStack*n);if(!isBoss(e)&&ratio<RULE.execFinish)dmg=Math.max(dmg,e.hp);
 spawn('r586-exec',{x:e.x,y:e.y,life:EXEC_LIFE});stats.execs++;marks.delete(e);
 inner++;try{hitEnemy(e,dmg,{kind:'r586-execute',sourceHero:HERO,sourceSlot:'w',storyWER:true});}finally{inner--;}
 if(!(e.hp>0)){stats.kills++;try{const s=p.storyWER;if(s&&s.ready){const k=HERO+':w',want=T()+cd(RULE.resetCd);if(!(Number(s.ready[k])<=want)){s.ready[k]=want;stats.resets++;}}}catch(err){fail(err);}}}
// ---- 피사슬 끌기(E 뒤) ----
function pull(dir){const p=P();if(!p)return;let ux=dir.x,uy=dir.y;const L=Math.hypot(ux,uy);if(!(L>1e-6))return;ux/=L;uy/=L;const R=range(RULE.pullRange),cos=Math.cos(RULE.pullHalfAngle);
 const hit=live().filter(e=>!isBoss(e)).map(e=>({e,d:dist(e,p)})).filter(o=>o.d>RULE.pullKeep&&o.d<=R&&((o.e.x-p.x)*ux+(o.e.y-p.y)*uy)/o.d>=cos).sort((a,b)=>a.d-b.d).slice(0,RULE.pullCount);
 if(!hit.length)return;const ends=[];stats.pulls++;
 for(const {e,d} of hit){const k=Math.min(RULE.pullMax,d-RULE.pullKeep),vx=(p.x-e.x)/d,vy=(p.y-e.y)/d,from={x:e.x,y:e.y};
  try{if(typeof moveActor==='function')moveActor(e,vx*k,vy*k,e.combatProfile?.bodyBlock?.r||e.radius||.27);else{e.x+=vx*k;e.y+=vy*k;}}catch(err){fail(err);}
  e.cd=Math.max(Number(e.cd)||0,RULE.pullBind);stats.pulled++;ends.push({fx:from.x,fy:from.y,e});}
 spawn('r586-chain',{x:p.x,y:p.y,life:CHAIN_LIFE,ends:ends.map(o=>({x:o.fx,y:o.fy})),hold:ends.map(o=>o.e)});}
// ---- 시전 알아채기: W·E 대기 마감(player.storyWER.ready)이 새로 늘어난 순간 = 시전 ----
// 엔진 대시는 적을 못 맞히면 신호(cue)를 내지 않으므로 신호 대신 마감 값을 본다. 키 입력(틱 사이)·자동 시전(틱 안) 둘 다 잡는다.
const lastReady={w:null,e:null};let prev=null,pre=null;
function scan(from){const p=P(),s=p?.storyWER?.ready;if(!s)return;const t=T();
 for(const slot of ['w','e']){const v=Number(s[HERO+':'+slot]);const was=lastReady[slot];lastReady[slot]=Number.isFinite(v)?v:null;
  if(!Number.isFinite(v)||v<=t||(was!=null&&v<=was+.05))continue;
  if(!on||!isHero()||!(Number(p.skillAnim)>0))continue;
  if(slot==='w')queue.push({at:t+RULE.execDelay,kind:'exec'});
  // 대시는 다른 층이 몇 틱에 걸쳐 미끄러지게 할 수 있다 → 출발점만 기억하고 0.22초 뒤 실제 이동 방향으로 끈다.
  else{const o=from||prev;if(o)queue.push({at:t+RULE.pullDelay,kind:'pull',from:{x:o.x,y:o.y}});}}}
if(typeof tick==='function'){const base=tick;tick=function(...a){const p=P();
 try{scan(null);}catch(err){fail(err);}pre=p?{x:p.x,y:p.y}:null;const r=base.apply(this,a);
 try{scan(pre);const q=P();prev=q?{x:q.x,y:q.y}:null;if(queue.length){const t=T();for(let i=queue.length-1;i>=0;i--){const j=queue[i];if(t<j.at)continue;queue.splice(i,1);
   if(!on||!isHero())continue;if(j.kind==='exec')execute(pickExec());else if(j.kind==='pull'){const q2=P(),d=q2?{x:q2.x-j.from.x,y:q2.y-j.from.y}:null;if(d&&Math.hypot(d.x,d.y)>.5)pull(d);}}}}catch(err){fail(err);}return r;};}
// ---- 그리기: Dots 시트 먼저, 없으면 임시 코드 그림 ----
// 사슬 시트는 무는 칸(6)부터 감겨 오는 모습만 튼다.
const S585=()=>window.__STORYWORLD_SLAYER_SHEETS_R585__;
const EXEC_LIFE=.9,CHAIN_FROM=6/30,CHAIN_LIFE=(24-6)/30;
const sheetDraw=(n,age,x,y,w,h,o)=>{try{const s=S585();return !!(s&&typeof s.draw==='function'&&s.has?.(n)&&s.draw(n,age,x,y,w,h,o));}catch(err){fail(err);return false;}};
const H=()=>{try{return typeof actorHeight==='function'?actorHeight():54;}catch(_){return 54;}};
const scoped=(id,fn)=>{try{if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')return ctx.scope({id:'r586:'+id,kind:'effect',r586:true},fn);return fn();}catch(err){fail(err);}};
function drawExec(f){const q=project(f.x,f.y),h=H(),k=Math.min(1,(f.age||0)/.22),fade=Math.max(0,Math.min(1,(f.life-(f.age||0))*3));
 /* R587 보류: SL12 피 가시 시트는 헤드리스 11-10 비교에서 옛 검기보다 안 읽혔다(적이 영웅 가까이면 R350 가림 옅게로 15% 까지 흐려지고, 칼날도 가늘다) → 옛 코드 검기 유지 */
 scoped('exec',()=>{ctx.save();try{ctx.globalAlpha*=fade;const top=q.y-h*2.3,tip=top+(q.y-top)*k;
  // 발밑 2:1 피 고리가 조여 든다
  const rx=h*.9*(1-.5*k);ctx.beginPath();ctx.ellipse(q.x,q.y,rx,rx/2,0,0,Math.PI*2);ctx.lineWidth=3;ctx.strokeStyle='#8a0618';ctx.stroke();
  // 검기: 위 가늘고 아래 넓은 날, 수직(회전 없음)
  ctx.beginPath();ctx.moveTo(q.x-2,top);ctx.lineTo(q.x+2,top);ctx.lineTo(q.x+8,tip);ctx.lineTo(q.x,tip+6);ctx.lineTo(q.x-8,tip);ctx.closePath();ctx.fillStyle='#5a0010';ctx.fill();
  ctx.beginPath();ctx.moveTo(q.x-2,top);ctx.lineTo(q.x-8,tip);ctx.lineWidth=2;ctx.strokeStyle='#ec3c30';ctx.stroke();
  if(k>=1&&!lowFx()){ctx.beginPath();ctx.moveTo(q.x-h*.7,q.y+1);ctx.lineTo(q.x+h*.7,q.y+1);ctx.lineWidth=1.5;ctx.strokeStyle='#e2e8f2';ctx.stroke();}
 }finally{ctx.restore();}});}
function drawChain(f){const p=project(f.x,f.y),fade=Math.max(0,Math.min(1,(f.life-(f.age||0))*4)),k=Math.min(1,(f.age||0)/.12);
 {let any=false;(f.ends||[]).forEach(o=>{const b=project(o.x,o.y),sy=p.y-H()*.25,dx=b.x-p.x,dy=b.y-H()*.25-sy,L=Math.max(H()*.5,Math.hypot(dx,dy)),flip=dx<0,ang=Math.atan2(dy,flip?-dx:dx),w=L*256/200;
   if(sheetDraw('slayer-chain',(f.age||0)+CHAIN_FROM,p.x,sy,w,w,{alpha:fade,angle:ang,flipX:flip,wx:f.x,wy:f.y}))any=true;});if(any)return;}
 scoped('chain',()=>{ctx.save();try{ctx.globalAlpha*=fade;ctx.lineWidth=4.5;
  (f.hold||[]).forEach((e,i)=>{const end=e&&e.hp>0?project(e.x,e.y):project(f.ends[i].x,f.ends[i].y),ex=p.x+(end.x-p.x)*k,ey=p.y+(end.y-p.y)*k-H()*.35*k,sx=p.x,sy=p.y-H()*.4;
   ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+ex)/2,(sy+ey)/2+10,ex,ey);ctx.strokeStyle='#6a0412';ctx.stroke();
   ctx.beginPath();ctx.moveTo(sx,sy-1);ctx.quadraticCurveTo((sx+ex)/2,(sy+ey)/2+9,ex,ey-1);ctx.lineWidth=1.6;ctx.strokeStyle='#ec3c30';ctx.stroke();ctx.lineWidth=4.5;});
 }finally{ctx.restore();}});}
function drawMark(e){const n=markOf(e);if(!n)return;const q=project(e.x,e.y),h=H(),cy=q.y-h*1.25,t=T();stats.marks++;
 /* R587 보류: SL14 낙인 시트도 같은 이유(방울이 작고 흐려 5개 다 찬 표시가 옛 방울보다 안 보임) → 옛 방울 유지 */
 scoped('mark',()=>{ctx.save();try{for(let i=0;i<n;i++){const a=-Math.PI+Math.PI*(i+.5)/RULE.stackMax+(n>=RULE.stackMax?t*.8:0),x=q.x+Math.cos(a)*14,y=cy+Math.sin(a)*7;
   ctx.beginPath();ctx.arc(x,y,3.6,0,Math.PI*2);ctx.fillStyle='#8a0618';ctx.fill();ctx.beginPath();ctx.arc(x-1.1,y-1.1,1.4,0,Math.PI*2);ctx.fillStyle='#ec3c30';ctx.fill();}
  if(n>=RULE.stackMax&&!lowFx()){ctx.globalAlpha*=.5+.5*Math.abs(Math.sin(t*5));ctx.beginPath();ctx.arc(q.x,cy-1,2,0,Math.PI*2);ctx.fillStyle='#e2e8f2';ctx.fill();}
 }finally{ctx.restore();}});}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(f,...a){
 if(f&&f.type==='r586-exec'){try{if(on)drawExec(f);}catch(err){fail(err);}return;}
 if(f&&f.type==='r586-chain'){try{if(on)drawChain(f);}catch(err){fail(err);}return;}
 return base.call(this,f,...a);};}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){const r=base.call(this,e,...a);try{if(on&&isHero()&&e&&e.hp>0)drawMark(e);}catch(err){fail(err);}return r;};}
window.__STORYWORLD_SLAYER_BERSERK_R586__=Object.freeze({revision:REV,rule:RULE,marks:e=>markOf(e),
 inspect:()=>({revision:REV,on,stats:{...stats},queue:queue.length,lastError,GPU:false,browser:false}),
 set(v){on=!!v;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
