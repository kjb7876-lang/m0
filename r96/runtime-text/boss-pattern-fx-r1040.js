// R1040 보스 패턴 바닥 그림 → 프레임 애니메이션 — 사용자 2026-11-14 "보스들이 빨간노랑섞인원 같은거 나오는스킬, 맵전체를 희미하게 뒤덮는 스킬을
//  다른 프레임애니메이션으로 대체해줘".
//  · 엔진 보스 패턴(hazard type 'story-pattern', drawCastStages150)은 터지는 순간(active·recovery 0.48초) 그 패턴의 정지 그림 한 장을
//    판정 모양대로 오려 바닥에 깐다(drawNativeGroundArt154) — 원·띠·부채꼴·십자·고리가 붉고 노란 소용돌이 원으로 보이고,
//    'safe'(작은 안전지대만 남기고 방 전체) 26종은 그 정지 그림을 방 전체(N×2)로 늘려 깔아 맵 전체가 희미하게 덮인다.
//  · 바꾼 것(그림만): 터짐 단계의 정지 그림 대신 저장소에 이미 있는 보스 쪽 Dots 24장 시트(R411·R438, R430 안개 루프)를 판정 모양 안에 놓아 한 번 재생한다.
//      원 = 가운데 1개(크면 둘레 4개 더) / 띠 = 길을 따라 1.5칸마다 / 부채꼴 = 축을 따라 커지며 / 십자 = 가운데 + 네 팔 / 고리 = 고리 가운데 줄을 따라.
//      그림 계열은 패턴 색(storyPattern5.color)으로: 붉은·주황 = 화염벽, 검붉은 = 시체 폭발, 금·갈색·무채 = 땅 갈라짐, 초록 = 독안개, 푸른 = 낙뢰, 보라 = 중력 우물.
//      safe = 방 전체 그림 대신 안전지대 바깥 두 겹 둘레에만 먹빛 암흑 안개 루프(알파 .5 이하, 허용 필터만) + 안전지대 테두리에 충격파 고리 루프
//      → 안전지대 안은 비어 있어 어디로 피해야 하는지 더 잘 보인다.
//  · 그대로: 판정·피해·시간·개수, 예고(warning·flight) 단계(R425 '예고 표시' 설정이 정함), 판정 테두리(strokeFootprint154), 근접·원거리 예고(패턴 아닌 호출).
//    시트가 아직 안 읽혔으면 그 순간만 원래 정지 그림. NaN 좌표는 그리지 않는다.
//  · R105 보스 장판(field) 예고: 하얀 예고 원 안에서 도는 붉은·노란 끊긴 고리·눈금·바닥 빛(코드 선)을 지우고 먹빛 암흑 안개 루프(R430 시트, 어둡게)로. 칠한 예고 그림·R411 터짐 시트는 그대로.
//  · 렉: 한 번 터짐당 놓는 그림 8개(모바일·저사양 4), 한 프레임 전체 그리기 12번(모바일·저사양 6) 상한.
//  끄기: localStorage['storyworld.r1040.patternFx']='{"on":false}' · 점검: window.__STORYWORLD_BOSS_PATTERN_FX_R1040__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_PATTERN_FX_R1040__)return;
const REV='R1040-pattern-fx-1',KEY='storyworld.r1040.patternFx';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={casts:0,suppressed:0,fallback:0,draws:0,capped:0,skippedNaN:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const fin=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const low=()=>{try{if(settings?.lowFx)return true;}catch(_){}try{return !!(matchMedia('(pointer:coarse)').matches||innerWidth<760);}catch(_){return false;}};
// 시트(모두 기존 자산, 보스·적 쪽): cell 칸, cols 열, n 장, fps, py 발 기준(칸 안 y), loop 루프 구간
const S=(path,py,o={})=>Object.freeze({path,cell:256,cols:6,n:24,fps:16,py,...o});
const SHEET={fire:S('assets/r411/fx/boss-fire-wall.webp',175),blood:S('assets/r411/fx/boss-corpse-explosion.webp',192),earth:S('assets/r411/fx/boss-ground-fissure.webp',160),
 poison:S('assets/r438/fx/enemy-poison-mist.webp',160),shock:S('assets/r411/fx/boss-lightning-strike.webp',208),void:S('assets/r411/fx/boss-gravity-well.webp',150),
 ring:S('assets/r438/fx/enemy-shockwave.webp',145,{fps:12.5,loop:[3,19]}),mist:S('assets/r430/mist-loop.webp',120,{cell:192,n:20,fps:12.5,loop:[0,20]})};
const DARK_FILTER='hue-rotate(215deg) saturate(.35) brightness(.5) contrast(1.2)',DARK_ALPHA=.85,MIST_FILTER=DARK_FILTER,MIST_ALPHA=.5;
const SHAPES=new Set(['circle','line','cone','cross','donut','safe']);
function hsl(hex){const m=/^#?([\da-f]{6})$/i.exec(String(hex||''));if(!m)return null;const v=parseInt(m[1],16),r=(v>>16&255)/255,g=(v>>8&255)/255,b=(v&255)/255,M=Math.max(r,g,b),n=Math.min(r,g,b),l=(M+n)/2,d=M-n;
 if(!d)return{h:0,s:0,l};const s=d/(1-Math.abs(2*l-1));let h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;return{h:(h*60+360)%360,s,l};}
function family(p){const c=hsl(p?.color);if(!c)return'fire';if(c.s<.18)return'earth';const h=c.h;
 if(h<=40||h>=335)return c.l<.3?'blood':'fire';if(h<70)return'earth';if(h<170)return'poison';if(h<255)return'shock';return'void';}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}try{if(typeof addImage==='function')addImage(p,'R1040 보스 패턴 시트');}catch(_){}return null;}
function tileLen(x,y){try{const a=project(x,y),b=project(x+1,y+1),d=Math.hypot(b.x-a.x,b.y-a.y);if(d>1e-3&&Number.isFinite(d))return d;}catch(_){}return 48;}
// ── 놓을 자리(판정 모양 안, 칸 단위) ──
function places(g,lo){const cap=lo?4:8,out=[],add=(x,y,size,d=0)=>{if(out.length<cap&&[x,y,size].every(Number.isFinite))out.push({x,y,size,delay:d});};
 const {x,y,radius:r,width:w}=g,ox=fin(g.originX,x),oy=fin(g.originY,y),ca=Math.cos(fin(g.angle)),sa=Math.sin(fin(g.angle));
 if(g.shape==='circle'){add(x,y,clamp(r*2,1.2,7));if(r>2.6&&!lo)for(let i=0;i<4;i++){const a=i*TAU/4+.4;add(x+Math.cos(a)*r*.62,y+Math.sin(a)*r*.62,clamp(r*.9,1.2,4),.06*(i+1));}}
 else if(g.shape==='line'){const n=clamp(Math.round(r/1.5),2,cap);for(let i=0;i<n;i++){const u=(i+.5)/n*r;add(ox+ca*u,oy+sa*u,clamp(Math.max(w*2.6,1.6),1.2,3.2),.05*i);}}
 else if(g.shape==='cone'){const rows=lo?[.45,.8]:[.3,.55,.8];for(const [k,t] of rows.entries()){const u=t*r,half=Math.min(w,1.2),side=u*Math.sin(half)*.55,size=clamp(u*Math.sin(half)*1.4,1.2,4);
   add(ox+ca*u,oy+sa*u,size,.08*k);if(t>.5)for(const s of [-1,1])add(ox+ca*u-sa*side*s,oy+sa*u+ca*side*s,size*.8,.08*k+.04);}}
 else if(g.shape==='cross'){const size=clamp(Math.max(w*2.4,1.6),1.2,3.2);add(x,y,size);const step=Math.max(1.6,r/(lo?1:2));for(let d=step;d<=r-.2;d+=step)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])add(x+dx*d,y+dy*d,size,.05*d);}
 else if(g.shape==='donut'){const ri=Math.min(fin(g.innerRadius),r),mid=(ri+r)/2,n=clamp(Math.round(TAU*mid/1.8),4,cap);for(let i=0;i<n;i++){const a=i*TAU/n+.3;add(x+Math.cos(a)*mid,y+Math.sin(a)*mid,clamp((r-ri)*1.1,1.2,4),.04*i);}}
 return out;}
function safePlaces(g,lo){const per=lo?2:4,out=[];for(const [k,d] of [[0,g.radius+1.6],[1,g.radius+3.6]])for(let i=0;i<per;i++){const a=i*TAU/per+k*TAU/(per*2)+.2;out.push({kind:'fog',x:g.x+Math.cos(a)*d,y:g.y+Math.sin(a)*d,size:3.2,delay:.05*i});}
 out.push({kind:'ring',x:g.x,y:g.y,size:g.radius,delay:0});return out;}
// ── 살아 있는 그림 ──
const live=[],recent=[],seen=new WeakSet(),SENT={type:'r1040-fx',x:0,y:0,age:0,life:Infinity};let lastRoom=null,serial=0;
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function register(h,g){const lo=low(),t0=fin(h.row150?.impactAt,T()),P=h.storyPattern5||{};let rows;
 if(g.shape==='safe')rows=safePlaces(g,lo).map(p=>({...p,sheet:p.kind==='fog'?SHEET.mist:SHEET.ring,life:p.kind==='fog'?1.7:1.3}));
 else{const sh=SHEET[family(P)];rows=places(g,lo).map(p=>({...p,kind:'burst',sheet:sh,life:sh.n/sh.fps}));}
 recent.length=0;for(const p of rows){const row={...p,id:++serial,t0:t0+p.delay};live.push(row);recent.push({kind:p.kind,x:p.x,y:p.y,size:p.size,path:p.sheet.path});}
 while(live.length>48)live.shift();stats.casts++;if(live.length)arm();}
function ready(g,P){if(g.shape==='safe')return !!(img(SHEET.mist.path)&&img(SHEET.ring.path));return !!img(SHEET[family(P)].path);}
function frameOf(sh,i){const col=i%sh.cols,row=Math.floor(i/sh.cols);return {path:sh.path,assetFrame:{sourceRect:[col*sh.cell,row*sh.cell,sh.cell,sh.cell],pivot:[sh.cell/2,sh.py],visibleHeight:sh.cell}};}
function drawOne(p,t){const el=t-p.t0;if(el<0)return false;const sh=p.sheet;let i,alpha;
 if(sh.loop){const [a,b]=sh.loop,span=b-a;i=a+Math.floor(el*sh.fps)%span;alpha=Math.min(1,el/.2,(p.life-el)/.5);}
 else{i=Math.floor(el*sh.fps);if(i>=sh.n)return false;alpha=Math.min(1,(sh.n-i)/(sh.n*.25));}
 if(p.kind==='fog')alpha*=MIST_ALPHA;else if(p.kind==='ring')alpha*=.75;alpha=clamp(alpha,0,1);if(!(alpha>.01))return false;
 const q=project(p.x,p.y);if(!Number.isFinite(q?.x)||!Number.isFinite(q?.y)){stats.skippedNaN++;return false;}
 // 링: 충격파 고리가 칸 너비의 약 0.8 → 안전지대 지름(화면) 에 맞춘다 / 그 밖: 놓는 크기(칸) × 바닥 한 칸 길이
 const tl=tileLen(p.x,p.y),h=clamp(p.kind==='ring'?p.size*2*tl/.8:p.size*tl,8,1200);if(!Number.isFinite(h))return false;
 const opt=p.kind==='fog'?{alpha,filter:MIST_FILTER}:{alpha};
 const paint=()=>{ctx.save();try{drawAssetFrame3(sh.path,frameOf(sh,i),q.x,q.y,h,opt);}finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'r1040:boss:pattern:'+p.id,kind:'effect',sourcePath:sh.path,x:p.x,y:p.y,groundAligned:false,lightShadowApproved:true},paint);else paint();
 stats.draws++;return true;}
function drawAll(){const t=T(),cap=low()?6:12;let n=0;for(let k=live.length-1;k>=0;k--){const p=live[k];if(t-p.t0>p.life)continue;if(n>=cap){stats.capped++;continue;}try{if(drawOne(p,t))n++;}catch(e){fail(e);}}}
function prune(){const t=T();try{if(typeof room!=='undefined'&&room!==lastRoom){lastRoom=room;live.length=0;}}catch(_){}
 for(let k=live.length-1;k>=0;k--)if(t-live[k].t0>live[k].life+.1||t<live[k].t0-5)live.splice(k,1);if(!live.length)disarm();else arm();}
// ── R105 보스 장판(field): 하얀 예고 원 안에서 도는 붉은 끊긴 고리·눈금·바닥 빛(코드 선·채움) → 그리지 않고 먹빛 암흑 안개 루프 ──
//  R105 는 drawHazard 를 감싸 field 를 통째로 그린다(칠한 R74 예고 그림 drawImage + 코드 고리 stroke·fill). 그 한 번 동안만 ctx.stroke·fill 을 비워
//  칠한 그림은 남기고 코드 도형만 뺀다. 예고 동안 그 자리에 먹빛 암흑 안개(R430 안개 시트를 어둡게, 허용 필터만)를 루프로(사용자 2026-11-14 '삭제하고 암흑범벅 같은 프레임애니메이션으로') — 터짐은 R411 시트가 따로 재생한다.
function fieldOwner(h){try{return (room?.enemies||[]).find(e=>e&&e.id===h.owner)||null;}catch(_){return null;}}
function fieldOn(h){return on&&!!window.__STORYWORLD_BOSS_FX_R105__&&[h.x,h.y,h.radius,h.age,h.warning].every(Number.isFinite)&&!!fieldOwner(h)&&!!img(SHEET.mist.path)&&typeof ctx==='object'&&!!ctx;}
function fieldDraw(h,base){const c=ctx,own={stroke:Object.prototype.hasOwnProperty.call(c,'stroke'),fill:Object.prototype.hasOwnProperty.call(c,'fill')},old={stroke:c.stroke,fill:c.fill};
 let r;try{c.stroke=function(){stats.fieldCode=(stats.fieldCode||0)+1;};c.fill=function(){stats.fieldCode=(stats.fieldCode||0)+1;};r=base();}
 finally{for(const k of ['stroke','fill']){if(own[k])c[k]=old[k];else delete c[k];}}
 try{if(h.age<h.warning){const sh=SHEET.mist,u=clamp(h.age/Math.max(.01,h.warning),0,1),[a,b]=sh.loop,i=a+Math.floor(h.age*sh.fps+(Number.isFinite(+h.id)?+h.id:0))%(b-a),q=project(h.x,h.y),tl=tileLen(h.x,h.y),hh=clamp(h.radius*2.3*tl,8,1200);
  if([q?.x,q?.y,hh].every(Number.isFinite)){const paint=()=>{ctx.save();try{drawAssetFrame3(sh.path,frameOf(sh,i),q.x,q.y,hh,{alpha:clamp(.45+.4*u,0,DARK_ALPHA),filter:DARK_FILTER});}finally{ctx.restore();}};
   if(typeof ctx.scope==='function')ctx.scope({id:'r1040:boss:field:'+h.id,kind:'effect',sourcePath:sh.path,x:h.x,y:h.y,groundAligned:false,lightShadowApproved:true},paint);else paint();stats.fields=(stats.fields||0)+1;}}}catch(e){fail(e);}
 return r;}
// ── 끼우기 ──
let cur=null;
function install(){if(typeof drawHazard!=='function'||typeof drawNativeGroundArt154!=='function'||typeof drawAssetFrame3!=='function'||typeof project!=='function')return false;
 const dh=drawHazard;drawHazard=function(h,...a){if(h&&h.type==='field'){let F=false;try{F=fieldOn(h);}catch(e){fail(e);}if(F)return fieldDraw(h,()=>dh.apply(this,[h,...a]));}
  const was=cur;cur=h&&h.type==='story-pattern'&&h.storyPattern5?h:null;try{return dh.apply(this,[h,...a]);}finally{cur=was;}};
 const ga=drawNativeGroundArt154;drawNativeGroundArt154=function(path,rect,g,alpha,stage,...a){
  try{const h=cur;if(on&&h&&g&&(stage==='active'||stage==='recovery')&&SHAPES.has(g.shape)&&typeof lockPatternFootprint154==='function'&&lockPatternFootprint154(h)===g){
    if(![g.x,g.y,g.radius].every(Number.isFinite)){stats.skippedNaN++;return ga.apply(this,[path,rect,g,alpha,stage,...a]);}
    if(seen.has(h)){stats.suppressed++;return true;}
    if(ready(g,h.storyPattern5)){seen.add(h);register(h,g);stats.suppressed++;return true;}
    stats.fallback++;}}catch(e){fail(e);}
  return ga.apply(this,[path,rect,g,alpha,stage,...a]);};
 if(typeof drawEffect==='function'){const de=drawEffect;drawEffect=function(e,...a){if(e===SENT||e&&e.type==='r1040-fx'){try{drawAll();}catch(err){fail(err);}return;}return de.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const tk=tick;tick=function(...a){const r=tk.apply(this,a);try{prune();}catch(e){fail(e);}return r;};}
 return true;}
const installed=(()=>{try{return install();}catch(e){fail(e);return false;}})();
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on){live.length=0;disarm();}return on;}
window.__STORYWORLD_BOSS_PATTERN_FX_R1040__=Object.freeze({revision:REV,installed,set,family:p=>family(p),sheets:Object.fromEntries(Object.entries(SHEET).map(([k,v])=>[k,v.path])),
 inspect:()=>({revision:REV,installed,on,live:live.length,placed:recent.map(p=>({...p})),stats:{...stats},lastError})});
})();
