/* R1267 미카엘라 스킬 깜빡임 구조 개선 + 제네시스(R563 하늘 빛기둥) 고급화
 * 사용자 2026-11-20 05:14Z "미카엘라 스킬 나올때 깜빡이면서 계속 이펙트 깜빡거려서 눈아픔 구조자체를 개선해줘",
 *   "미카엘라 제네시스 모방스킬 조금더 세련되고 이펙트가 고급지게".
 * 원인(헤드리스 측정 qa/r1267/flicker-probe.mjs, 가상 60fps): Q·W·E·R·Z·X·하트 패시브가 한 화면에 겹치면 영웅 둘레 화면이
 *  1초에 10번까지 번쩍였다(광과민 기준 3번). 이펙트마다 첫 칸이 가장 밝은 시트가 덧셈 합성으로 '툭' 켜지고(R563 기둥 8개 0.1초 간격,
 *  R948 오르골탑 하트, R106 D2S, R101 적중), 같은 자리에 시트 두 장(R563 기둥 + M7)이 겹쳐 밝기가 한 프레임에 크게 뛴다.
 * 구조: 3D 기록기 프레임(ThreeRenderer.render(frame) 직전)에서 미카엘라 이펙트 명령만 골라 '밝기 기울기 제한'을 건다.
 *  ① 화면 덮는 밝기(알파×넓이×칸 실제 밝기/화면)는 제 밝기까지 OWN_RAMP(.2초)에 걸쳐서만 오른다 → 첫 칸이 툭 켜지지 않고 짧게 차오름(작은 적중 불꽃은 바로).
 *  ② 미카엘라 이펙트 전체 밝기도 ALL_RAMP 기울기로만 오른다 → 여러 기술이 같은 프레임에 겹쳐도 번쩍이지 않음.
 *  ①b 이 제한은 화면 8×6 칸마다 건다(이펙트 하나 안에서 하트 여러 개가 따로 터져도 그 자리만 차오르고 나머지는 그대로).
 *  ③ 덧셈 합성 전체 밝기는 ALL_CAP 을 넘으면 눌러 담는다(화면이 하얗게 타지 않게).
 *  ④ 큰 이펙트가 통째로 사라지면 마지막 프레임 모습을 FALL(.18초) 동안 옅어지는 잔광으로 남긴다(툭 꺼짐도 섬광의 절반). 그리는 자리·크기·칸·피해·판정은 바꾸지 않고 알파만 낮춘다.
 *  미카엘라 기본탄(하트, R1232·R912)·후광(R101 aura)·몸 그림은 대상이 아니다.
 * 제네시스 고급화(같은 프레임 단계, 시트만 사용 — 도형 투사체·코드 선 없음):
 *  · 하늘 빛기둥: R563 굵은 기둥 시트는 옅은 몸통(×.35), M7 가는 빛기둥 시트가 심(×.75). M7 은 하늘 끝까지 늘어나 하얀 벽이 되던 것을
 *    영웅 키 4.2배 높이·시트 비율 폭으로 줄임(발 자리 그대로) → 굵은 막대·하얀 벽 대신 가늘고 반짝이는 빛줄기.
 *  · 하늘 후광은 ×.85, 큰 치유 기둥 ×.8 로 하얗게 타지 않게.
 *  · 시전 자리 바닥에 C4 금빛 가시 고리 시트(성역)가 천천히 차오르고(0.35초) 큰 기둥이 내린 뒤 스러진다(0.45초) — 한 번의 의식으로 묶임.
 * 몹 적중 번쩍임: 엔진이 몹이 맞을 때마다 몸을 하얗게 번쩍이는 것을 몹마다 0.4초에 한 번으로 묶음(모든 영웅, 피해·경직 그대로).
 * 끄기: localStorage['storyworld.r1267.flashGuard']='off', ['storyworld.r1267.genesis']='off', ['storyworld.r1267.hitFlash']='off'.
 * 검증: qa/r1267/r1267-cpu-check.cjs(CPU), qa/r1267/flicker-probe.mjs(헤드리스 소프트웨어 렌더). GPU·실기기·자연 플레이는 미검증.
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_FLASH_GUARD_R1267__)return;
const REV='R1267-flash-guard-4',KEY='storyworld.r1267.flashGuard',GKEY='storyworld.r1267.genesis',HERO='michaela',fin=Number.isFinite;
// 밝기 단위 = 화면 넓이 비(알파×덮는 넓이/화면 넓이). 덧셈 합성 아닌 명령은 절반으로 친다.
// 오름 한도: 이펙트 하나는 제 밝기까지 OWN_RAMP 초에 걸쳐(프레임당 알파 ≈ .08 — 휘도 한 걸음 .1 아래), 아주 작은 것(SMALL 이하)은 바로.
// 전체는 ALL_RAMP 초 + 프레임당 ALL_FLOOR. 덧셈 합성 합 상한 ALL_CAP.
const OWN_RAMP=.2,SMALL=.008,TILE_SMALL=.006,ALL_RAMP=.2,FALL=.18,GHOST_MAX=48,GHOST_CMDS=24,ALL_FLOOR=.004,ALL_CAP=.9,MAX_DT=.1;
const GUARD=/^(?:r563:|r948:|r106d2s:|r247|r1235|r102:|r101:(?!aura)|r160:(?!laser)|r1267:)/;
const SKIP=/^(?:r1232|r912|r911|r101:aura)/;
const stats={frames:0,guarded:0,scaled:0,minGain:1,genesisRings:0,tuned:0,errors:0,lastError:null};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);};
function flag(k){try{const v=localStorage.getItem(k);return !(v==='off'||v==='0'||v==='false');}catch(_){return true;}}
let prefAt=-1e9,guardOn=true,genOn=true;
const T=()=>{try{return typeof time==='number'&&fin(time)?time:0;}catch(_){return 0;}};
function prefs(){const n=Date.now();if(n-prefAt>1000){prefAt=n;guardOn=flag(KEY);genOn=flag(GKEY);hitOn=flag(HKEY);}}
function heroIs(){try{return typeof player==='object'&&!!player&&player.hero===HERO;}catch(_){return false;}}
// ---- 프레임 밝기 기울기 제한 ----------------------------------------------------------------
const own=new Map();let allPrev=0,lastT=null;const TNX=8,TNY=6,tileOut=new Float64Array(TNX*TNY);const done=new WeakSet();
// ①c 칸별 섬광 횟수 예산(WCAG 2.3.1 '1초 3번'): 칸 밝기가 FL_D 넘게 올랐다가 FL_D 넘게 내리면 그 칸 섬광 1번.
//   최근 1초에 FL_MAX 번 섬광한 칸은 그 1초가 지날 때까지 바닥값+FL_D·.8 위로 못 오르게 묶는다(새 섬광이 생길 수 없음). 칸 넓이 = 화면 1/48.
const FL_D=.0015,FL_MAX=2,NT=TNX*TNY,tSt=new Int8Array(NT),tRef=new Float64Array(NT),tLo=new Float64Array(NT),tHold=new Float64Array(NT),tFl=Array.from({length:NT},()=>[]);
function areaOf(c,VA){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const add=q=>{if(!q||!fin(q[0])||!fin(q[1]))return;if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1];};
 if(Array.isArray(c.points))for(const q of c.points)add(q);else if(Array.isArray(c.paths))for(const p of c.paths)for(const q of p?.points||[])add(q);
 if(!(x1>x0&&y1>y0))return 0;return Math.min(4,(x1-x0)*(y1-y0)/VA);}
// 시트 칸은 대부분 투명하다 → 칸의 실제 밝기 덮음(알파×밝기 평균)을 한 번 재서 기억한다(12×12 축소). 못 재면 1(보수적으로 꽉 찬 것으로).
const covCache=new Map();let covCv=null;
function coverage(c){if(c.kind!=='image'||!c.image)return c.kind==='image'?1:.5;const r=c.sourceRect||[0,0,0,0],key=String(c.sourcePath||'')+'|'+r.join(',');let v=covCache.get(key);if(v!=null)return v;v=1;
 try{if(typeof document!=='undefined'&&!c.mutable&&r[2]>0&&r[3]>0){if(!covCv){covCv=document.createElement('canvas');covCv.width=covCv.height=12;}const x=covCv.getContext('2d',{willReadFrequently:true});x.clearRect(0,0,12,12);x.drawImage(c.image,r[0],r[1],r[2],r[3],0,0,12,12);
  const d=x.getImageData(0,0,12,12).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i+3]/255*Math.max(d[i],d[i+1],d[i+2])/255;v=Math.max(.02,s/144);}}catch(_){v=1;}
 if(covCache.size>600)covCache.clear();covCache.set(key,v);return v;}
const additive=c=>/lighter|screen|plus|add/.test(String(c?.style?.globalCompositeOperation||''));
// 제네시스 층 조율(owner.id → 알파 배율)
function tune(id){if(!/^r563:/.test(id))return 1;if(/:sheet$/.test(id))return .35;if(/:beam$/.test(id))return .75;if(/^r563:sky:/.test(id))return .85;return 1;}
// 제네시스 빛기둥 M7(가는 빛줄기 시트)은 R1041 이 하늘 끝까지 늘려(키 9배·폭 = 높이/2) 화면을 하얀 벽처럼 덮었다 →
// 발 자리·가운데는 그대로, 높이를 영웅 키 PIL_H 배로 줄이고 폭은 시트 비율(1:2)로. (R563 굵은 몸통 시트는 자리 그대로 두고 옅게만)
const PIL_H=4.2;
// 그리기 명령 좌표는 논리(CSS) 픽셀이다(DPR 1·1.5 실측: 영웅 상자 같음) → 영웅 키도 논리 픽셀 그대로.
function actorPx(){let h=66;try{h=typeof actorHeight==='function'?actorHeight():h;}catch(_){}return fin(h)&&h>0?h:66;}
function reshapeBeam(c,id){if(!genOn||c.kind!=='image'||!/^r563:pillar:.*:beam$/.test(id)||!/fx-m7-michaela-sky-pillar/.test(String(c.sourcePath||'')))return;const P=c.points;if(!Array.isArray(P)||P.length!==4||!P.flat().every(fin))return;
 const H=Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1]),Hn=Math.min(H,actorPx()*PIL_H);if(!(Hn>0)||Hn>=H-.5)return;const fx=(P[2][0]+P[3][0])/2,fy=(P[2][1]+P[3][1])/2,w=Hn/2;
 c.points=[[fx-w/2,fy-Hn],[fx+w/2,fy-Hn],[fx+w/2,fy],[fx-w/2,fy]];stats.reshaped=(stats.reshaped||0)+1;}
function tileOf(c,VW,VH){let x=0,y=0,n=0;const P=Array.isArray(c.points)?c.points:Array.isArray(c.paths)?(c.paths[0]?.points||[]):[];for(const q of P){if(q&&fin(q[0])&&fin(q[1])){x+=q[0];y+=q[1];n++;}}if(!n)return -1;x/=n;y/=n;
 const i=Math.floor(x/VW*TNX),j=Math.floor(y/VH*TNY);if(i<0||j<0||i>=TNX||j>=TNY)return -1;return j*TNX+i;}
function resetTiles(){tSt.fill(0);tRef.fill(0);tLo.fill(0);tHold.fill(-1);for(const a of tFl)a.length=0;}resetTiles();
function guardFrame(frame,VA,VW,VH){if(!(VW>0&&VH>0)){VW=Math.sqrt(VA*16/9);VH=VA/VW;}const cmds=frame&&frame.commands;if(!Array.isArray(cmds)||!(VA>0))return;
 const t=T();let dt=lastT==null?1/60:t-lastT;if(!(dt>=0)||dt>1){/* 지역 이동·되감기: 기록 초기화 */own.clear();allPrev=0;tileOut.fill(0);resetTiles();dt=1/60;}dt=Math.min(MAX_DT,Math.max(1/240,dt));lastT=t;stats.frames++;
 const groups=new Map();
 for(const c of cmds){const id=String(c?.r1267Id||c?.owner?.id||'');if(!id||SKIP.test(id)||!GUARD.test(id)||!c.style||!fin(c.style.globalAlpha))continue;
  let g=groups.get(id);if(!g){g={list:[],raw:0,add:0};groups.set(id,g);}
  if(genOn){const k=tune(id);if(k!==1){c.style.globalAlpha*=k;stats.tuned++;}reshapeBeam(c,id);}
  /* 밝기 = 덮는 상자(알파×넓이) × 칸의 실제 밝기 덮음(coverage) — 시트 칸이 번쩍이는 칸으로 바뀌어도(상자는 그대로) 오름을 잡는다.
     '작아서 바로 그림' 판정은 상자로(투명 많은 큰 시트가 작은 것으로 빠지지 않게). */
  const box=areaOf(c,VA)*c.style.globalAlpha*(additive(c)?1:.5),e=box*coverage(c);g.list.push([c,e,tileOf(c,VW,VH)]);g.raw+=e;g.box=(g.box||0)+box;if(additive(c))g.add+=e;}
 // ① 이펙트마다
 let all=0,allAdd=0,rawAll=0,boxAll=0;const seen=new Set();
 for(const [id,g] of groups){seen.add(id);const prev=own.get(id);const p=prev?(prev.dec!=null?prev.dec:prev.out):0;const allowed=p+g.raw*dt/OWN_RAMP;
  /* 이펙트 통째 제한은 쓰지 않는다(한 부분이 터질 때 나머지까지 어두워짐) — 오름 제한은 화면 칸(①b)이 맡는다. 이 기록은 잔광·전체 제한용. */
  void allowed;const k=1;g.k=k;own.set(id,{out:g.raw*k,at:t});all+=g.raw*k;rawAll+=g.raw;boxAll+=g.box;allAdd+=g.add*k;}
 for(const [id,v] of own)if(!seen.has(id)&&t-v.at>.5)own.delete(id);
 // ①b 화면 칸(8×6)마다: 한 이펙트 안에서 하트 여러 개가 따로 터져도(이펙트 합계는 그대로) 그 자리 밝기가 툭 뛰지 않게
 const tRaw=new Float64Array(TNX*TNY),tFull=new Float64Array(TNX*TNY),tBox=new Float64Array(TNX*TNY);
 for(const g of groups.values())for(const [c,e,ti] of g.list){if(ti<0)continue;tRaw[ti]+=e*g.k;tFull[ti]+=e;tBox[ti]+=areaOf(c,VA)*c.style.globalAlpha;}
 const tK=new Float64Array(TNX*TNY);let tAll=0;
 for(let i=0;i<tK.length;i++){const allowed=tileOut[i]+tFull[i]*dt/OWN_RAMP;tK[i]=tBox[i]>TILE_SMALL&&tRaw[i]>allowed?allowed/tRaw[i]:1;}
 for(let i=0;i<NT;i++){if(t<tHold[i]){/* 묶을 때도 툭 끊지 않고 FALL 속도로 내려앉는다 */const cap=Math.max(tLo[i]+FL_D*.8,tileOut[i]*Math.max(0,1-dt/FALL)),r=tRaw[i]*tK[i];if(r>cap&&r>0){tK[i]*=cap/r;stats.tileHeld=(stats.tileHeld|0)+1;}}}
 all=0;allAdd=0;for(const g of groups.values()){let r=0,a=0;for(const [c,e,ti] of g.list){const f=g.k*(ti>=0?tK[ti]:1);r+=e*f;if(additive(c))a+=e*f;}g.rk=r;all+=r;allAdd+=a;}
 // ② 전체 오름 제한 ③ 덧셈 합성 상한
 const allowedAll=allPrev+ALL_FLOOR+rawAll*dt/ALL_RAMP;let K=boxAll>SMALL&&all>allowedAll?allowedAll/all:1;
 if(allAdd*K>ALL_CAP)K*=ALL_CAP/(allAdd*K);
 let out=0;const tNew=new Float64Array(TNX*TNY);
 for(const [id,g] of groups){let gk=1;for(const [c,e,ti] of g.list){const k=g.k*(ti>=0?tK[ti]:1)*K;if(k<1){c.style.globalAlpha*=k;stats.scaled++;}if(ti>=0)tNew[ti]+=e*k;if(k<gk)gk=k;}
  stats.guarded+=g.list.length;out+=g.rk*K;if(gk<stats.minGain)stats.minGain=gk;const o0=own.get(id);if(o0)o0.out=g.rk*K;
  /* 내림 쪽: 다음 프레임에 이 이펙트가 통째로 사라지면 마지막 모습을 FALL 초 동안 옅어지는 잔광으로 남긴다(툭 꺼짐 = 섬광의 절반) */
  if(g.box>SMALL){const o=own.get(id);if(o)o.last=g.list.slice(0,GHOST_CMDS).map(([c])=>c);}}
 // ④ 사라진 이펙트 잔광
 let gn=0;for(const [id,v] of own){if(seen.has(id)||!v.last)continue;if(++gn>GHOST_MAX){v.last=null;continue;}const age=t-v.at;if(age>=FALL||age<0){v.last=null;v.dec=0;continue;}const f=1-age/FALL;v.dec=v.out*f;
  v.last.forEach((c,i)=>{const a=c.style.globalAlpha*f;if(!(a>.004))return;cmds.push({...c,key:String(c.key)+':r1267g',order:cmds.length,style:{...c.style,globalAlpha:a}});stats.ghosts=(stats.ghosts||0)+1;});out+=v.out*f;}
 for(let i=0;i<tNew.length;i++)tileOut[i]=Math.max(tNew[i],tileOut[i]*Math.max(0,1-dt/FALL));
 for(let i=0;i<NT;i++){const v=tNew[i],F=tFl[i];while(F.length&&t-F[0]>=1)F.shift();
  if(t>=tHold[i]){tLo[i]=v;}else if(v<tLo[i])tLo[i]=v;
  if(tSt[i]!==1){if(v-tRef[i]>=FL_D){tSt[i]=1;tRef[i]=v;}else if(v<tRef[i])tRef[i]=v;}
  else if(v>tRef[i])tRef[i]=v;
  else if(tRef[i]-v>=FL_D){tSt[i]=-1;tRef[i]=v;F.push(t);stats.tileFlashes=(stats.tileFlashes|0)+1;if(F.length>=FL_MAX){tHold[i]=F[F.length-FL_MAX]+1;tLo[i]=v;}}}
 allPrev=out;stats.lastOut=+out.toFixed(4);}
// 화면 크기도 명령과 같은 논리 픽셀로: frame.viewport(논리) 우선, 없으면 캔버스 실제 픽셀 ÷ DPR. (R1267b: 실제 픽셀을 쓰면 DPR 1.5 에서 넓이 비가 1/2.25 로 줄어 '작은 것'으로 빠져 제한이 안 걸렸다)
function viewDims(r,frame){try{const v=frame&&frame.viewport;if(v&&v.width>0&&v.height>0&&fin(v.width)&&fin(v.height))return [v.width,v.height];}catch(_){}
 let d=1;try{const v=frame&&frame.viewport;d=v&&v.dpr>0&&fin(v.dpr)?v.dpr:(fin(window.devicePixelRatio)&&window.devicePixelRatio>0?window.devicePixelRatio:1);}catch(_){}
 try{const el=r?.renderer?.domElement;if(el?.width>0&&el?.height>0)return [el.width/d,el.height/d];}catch(_){}try{if(typeof canvas!=='undefined'&&canvas?.width>0)return [canvas.width/d,canvas.height/d];}catch(_){}return [960,540];}
function before(r,frame){try{prefs();if(!guardOn&&!genOn)return;if(!heroIs()){own.clear();allPrev=0;tileOut.fill(0);resetTiles();return;}
 /* 엔진은 frame 객체를 다시 쓰므로 명령 배열(프레임마다 새로 만듦)로 한 번만 처리 */const cm=frame&&frame.commands;if(!Array.isArray(cm)||done.has(cm))return;done.add(cm);
 if(guardOn){const d=viewDims(r,frame);guardFrame(frame,d[0]*d[1],d[0],d[1]);}else if(genOn&&Array.isArray(frame?.commands)){for(const c of frame.commands){const id=String(c?.r1267Id||c?.owner?.id||'');if(c?.style&&fin(c.style.globalAlpha)){const k=tune(id);if(k!==1){c.style.globalAlpha*=k;stats.tuned++;}reshapeBeam(c,id);}}}}catch(e){fail(e);}}
// R1344: render 감싸개끼리 서로 표식을 가려 번갈아 끝없이 감싸 오래 플레이하면 'Maximum call stack size exceeded'(사용자 11-26 탐식의 주방) → 안쪽 감싸개의 표식(/^_*(r\d|sinRoom)/)을 새 감싸개에 옮겨 담는다(R1290 방식).
const wrapFn=fn=>{if(typeof fn!=='function'||fn.__r1267)return fn;const w=function(frame){before(this,frame);return fn.apply(this,arguments);};try{for(const k of Object.keys(fn))if(/^_*(r\d|sinRoom)/i.test(k))w[k]=fn[k];}catch(_){}w.__r1267=true;return w;};
const wrapped=new WeakSet();
function install(){try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function'&&!C.render.__r1267)C.render=wrapFn(C.render);
 const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
// ---- 제네시스 성역 고리(C4 시트) ------------------------------------------------------------
const RING={path:'assets/r1041/fx-c4-ground-ring.webp',cw:256,ch:128,n:8,fps:8},RING_AT=.2,RING_END=2.05,RING_IN=.35,RING_OUT=.45;
let rings=[],lastCasts=null,lastRoom=null,asked=0;
function ringImg(){try{const g=typeof readyImage==='function'?readyImage(RING.path):null;if(g&&g.image)return g.image;const n=Date.now();if(n-asked>1500){asked=n;if(typeof addImage==='function')addImage(RING.path,'R1267 genesis ring');else if(typeof ensureImages==='function')Promise.resolve(ensureImages([RING.path])).catch(()=>{});}}catch(e){fail(e);}return null;}
function watchGenesis(){const G=window.__STORYWORLD_MICHAELA_GENESIS_R563__;let rm=null;try{rm=typeof room!=='undefined'?room:null;}catch(_){}
 if(rm!==lastRoom){rings=[];lastRoom=rm;}
 if(!G||typeof G.inspect!=='function'){lastCasts=null;return;}const n=G.inspect().stats?.rCasts|0;
 if(lastCasts!=null&&n>lastCasts&&genOn&&heroIs()&&player){rings.push({x:player.x,y:player.y,t0:T()});if(rings.length>2)rings.shift();stats.genesisRings++;ringImg();}
 lastCasts=n;const t=T();rings=rings.filter(g=>t-g.t0<RING_END+.05&&t>=g.t0-.01);}
const smooth=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
function drawRings(){if(!rings.length||typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const im=ringImg();if(!im)return;const t=T();
 let AH=66;try{AH=typeof actorHeight==='function'?actorHeight():AH;}catch(_){}if(!(AH>0))AH=66;
 for(const g of rings){const age=t-g.t0;if(age<RING_AT||age>RING_END)continue;const a=smooth((age-RING_AT)/RING_IN)*smooth((RING_END-age)/RING_OUT);if(!(a>0))continue;
  const q=project(g.x,g.y);if(!q||!fin(q.x)||!fin(q.y))continue;const W=AH*3.4*(.92+.08*smooth((age-RING_AT)/1.2)),H=W*RING.ch/RING.cw,fr=Math.floor(age*RING.fps)%RING.n;
  const go=()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.62*a;ctx.drawImage(im,fr*RING.cw,0,RING.cw,RING.ch,q.x-W/2,q.y-H/2,W,H);}finally{ctx.restore();}};
  const o={id:'r1267:genesis-ring:'+g.t0.toFixed(3),kind:'effect',x:g.x,y:g.y,groundAligned:true,pxfSide:'hero'};
  if(typeof ctx.scope==='function')ctx.scope(o,go);else go();}}
const SENT={type:'r1267-genesis',x:0,y:0,age:0,life:Infinity,r1267Sentinel:true};
function sentinel(){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const want=rings.length>0;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;if(rings[0]){SENT.x=rings[0].x;SENT.y=rings[0].y;}}catch(_){}}
// 늦게 실리는 모듈(R247 등)이 drawEffect 를 다시 감싸면 그 바깥에 한 번 더 감싼다(R247 은 제 효과를 받으면 안쪽을 부르지 않으므로 맨 바깥이어야 함). 최대 4겹.
let effWrapped=0;function wrapEffect(){if(typeof drawEffect!=='function'||drawEffect.__r1267||effWrapped>=4)return effWrapped>0;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r1267Sentinel){try{drawRings();}catch(err){fail(err);}return;}
  // R247 Z(성흔 광시)·X(성광주)는 ctx.scope 없이 그려 기록기 owner 가 'scene' 이 된다 → 같은 종류(kind)의 owner 에 id 만 r247:fx 로 씌워 가드가 알아보게(그리는 순서·자리는 그대로).
  if(e&&e.type==='r247-fx'){let c0=null;try{c0=typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function'?ctx:null;}catch(_){}const cur=c0&&c0.owner;
   if(c0&&(!cur||!cur.id||cur.id==='scene')){stats.r247Scoped=(stats.r247Scoped|0)+1;return c0.scope({...(cur||{kind:'scene'}),id:'r247:fx'},()=>base.apply(this,[e,...a]));}}
  return base.apply(this,[e,...a]);};drawEffect.__r1267=true;effWrapped++;return true;}
// ---- 몹 적중 번쩍임 횟수 제한 ----------------------------------------------------------------
// 엔진은 몹이 맞을 때마다 e.flash=.12~.14 초 동안 몸을 brightness(1.7~1.8)로 그린다. 미카엘라처럼 작은 탄이 여러 번 맞히면
// 몹 무리 전체가 1초에 5~8번 하얗게 켜졌다 꺼졌다 한다(헤드리스 측정: 미카엘라 이펙트를 모두 숨겨도 픽셀 26%가 1초 3회 초과).
// 꺼진 뒤 새로 켜지는 번쩍임은 같은 몹에서 HIT_GAP 초에 한 번만 허락한다(켜져 있는 동안 또 맞으면 그대로 이어짐) → 몹마다 1초 2.5회 이하.
// 피해·경직(hitTimer)·소리·숫자는 그대로, 몸 밝기 번쩍임만. 모든 영웅에 같게 건다(광과민 안전). 끄기 storyworld.r1267.hitFlash=off.
const HKEY='storyworld.r1267.hitFlash',HIT_GAP=.4,hitSt=new WeakMap();let hitOn=true;stats.hitFlashCut=0;
function limitHitFlash(){if(!hitOn)return;let list=null;try{list=typeof room!=='undefined'&&room&&Array.isArray(room.enemies)?room.enemies:null;}catch(_){}if(!list)return;const t=T();
 for(const e of list){if(!e||typeof e!=='object')continue;let f=+e.flash;if(!fin(f))f=0;let s=hitSt.get(e);if(!s){s={prev:0,start:-1e9};hitSt.set(e,s);}
  if(t<s.start)s.start=-1e9;
  if(f>0&&s.prev<=0){if(t-s.start<HIT_GAP){e.flash=0;f=0;stats.hitFlashCut++;}else s.start=t;}s.prev=f;}}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{prefs();install();wrapEffect();watchGenesis();sentinel();limitHitFlash();}catch(e){fail(e);}return r;};}
install();wrapEffect();if(typeof setInterval==='function')setInterval(install,500);
window.__STORYWORLD_FLASH_GUARD_R1267__=Object.freeze({revision:REV,
 tuning:Object.freeze({OWN_RAMP,SMALL,ALL_RAMP,ALL_FLOOR,ALL_CAP}),guardFrame:(frame,VA,VW,VH)=>{prefs();guardFrame(frame,VA,VW,VH);},tune,
 set(v){try{localStorage.setItem(KEY,v===false||v==='off'?'off':'on');}catch(_){}prefAt=-1e9;prefs();return guardOn;},
 setGenesis(v){try{localStorage.setItem(GKEY,v===false||v==='off'?'off':'on');}catch(_){}prefAt=-1e9;prefs();return genOn;},
 limitHitFlash:()=>{prefs();limitHitFlash();},
 inspect:()=>({revision:REV,guardOn,genOn,hitOn,owners:own.size,rings:rings.length,stats:{...stats}})});
})();
