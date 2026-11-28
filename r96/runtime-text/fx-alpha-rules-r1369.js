/* R1369 이펙트 투명도 공통 규칙 (사용자 2026-11-27 "이펙트 반투명도 더 올려서 몹과 영웅이 더 잘 보이게 — 룰 정비" → 추천 규칙 5개 승인 "응")
 *  모든 이펙트를 넷으로 나눠 '최대' 불투명도를 정한다(이미 더 옅으면 그대로 — 올리지 않음).
 *   1) 몸 위 겹침(오라·낙인·피격·버프·결계)            ≤ .30   몸 윤곽이 늘 보이게
 *   2) 적중 순간(베기 반월·타격·폭발·출혈)              첫 .1초 ≤ .60 → .16초까지 ≤ .25 로 빠르게 옅어짐
 *   3) 위험 범위(보스 고유 스킬·메테오 착탄·보스 장판)    범위 그림(테두리·예고 고리) ≤ .70 으로 또렷하게, 그 안에 선 영웅·몹 몸 자리만 ≤ .30
 *      (선 stroke ≤ .70, 면 fill ≤ .30. 그림 시트마다 고리 자리가 달라 — 메테오 시트는 아래쪽 — 고정 타원 대신 몸 상자 구멍 클립으로 나눈다. 헤드리스 실측 R1369)
 *   4) 배경(광폭화 불길·바닥 물결)                      ≤ .35, 첫 몸 그림보다 앞 순서의 배경 패스로 옮겨 캐릭터 뒤에 그림
 *   5) 공통: 이펙트가 영웅·몹 몸 상자를 화면 넓이로 40% 넘게 가리면 그 이펙트를 더 옅게(40% → ×.8 … 100% → ×.5)
 *   기타(분류 밖 시전·스킬 이펙트) ≤ .50.  그림자·영웅/몹 몸·조형물·바닥·투사체·글자·R448 실루엣·발 접촉은 건드리지 않는다.
 *  자리: Three 렌더러가 그리기 명령을 마지막으로 받는 CommandScene.render(인스턴스·프로토타입) — 다른 오버레이가 명령을 다 고친 뒤 한 번.
 *   엔진 drawEffect 로 그린 명령에는 효과 종류·나이(e.type·e.age)를 붙여 두고, 따로 그린 효과는 주인 id 를 처음 본 게임 시각으로 나이를 잰다.
 *  R1271 '적중·시전 이펙트 불투명도' 슬라이더는 배율로 이어 씀(기본 40% = ×1, 100% = 예전에 가깝게 ×2.5, 상한 .75). R1271 의 적중 .4 곱은 이 규칙으로 대체(겹쳐 곱하지 않음).
 *  판정·피해·효과 목록·위치는 그대로(그림 알파·그리는 순서만). 끄기: localStorage storyworld.r1369.fxAlpha {"on":false}.
 * Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_FX_ALPHA_R1369__)return;
const REV='R1369-fx-alpha-rules-1',KEY='storyworld.r1369.fxAlpha';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s==='object')prefs={...prefs,...s};}catch(_){}
const CAP={body:.3,hitPeak:.6,hitTail:.25,hitUnknown:.4,dangerEdge:.7,dangerInner:.3,background:.35,other:.5};
const PEAK=.1,FADE=.16,COVER=.4,SCALE_MAX=.75;
const stats={frames:0,body:0,hit:0,danger:0,edges:0,background:0,other:0,covered:0,tagged:0,ms:0,errors:0};const perfNow=()=>{try{return performance.now();}catch(_){return 0;}};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// ---- 분류 ----
const HIT_TYPES=new Set(['burst','slash','e568HeroImpact','r912hit','contactR61','regionalContactR58','hospitalBossContact14']);
const BODY_TYPES=new Set(['playerHitR43','heroHit']);
const SKIP_KINDS=new Set(['hero','enemy','prop','ground','exits','objective','projectile','contact']);
const SHADOW=/(?:^|[^a-z])shadows?(?=[^a-z]|$)/;
const EXCLUDE=/(?:^|[^a-z])(?:nav|portal|objective|label|weather|rain|snow|fog|mist|r113:layer)(?=[^a-z]|$)|(?:^|[^a-z0-9])r\d+:contact:/;
const FXPATH=/(?:^|\/)(?:fx|vfx|pixelfx|effects?|skills?|auras?[-\w]*)\/|r100\/sig-|(?:slash|burst|impact|aura|ring|cut|hit|spark|flame|blast|crescent)[-_.\w]*\.(?:webp|png)/;
const ENRAGE=/enrage|berserk|frenzy|광폭|r1357|(?:^|[^a-z0-9])d07(?:[^0-9]|$)/;
const BODY=/aura|(?:^|[^a-z])rank:|halo|guard|shield|barrier|buff|passive|brand|stigma|낙인|ego-(?:back|front)|silver-echo|orbit|heal|regen|hero-?hit|player-?hit|hurt|stun|poison|sig-(?:aura|gather)|resonance|veil|cloak/;
const DANGER=/boss|meteor|hazard|pattern|(?:^|[^a-z])field|quake|laser|storm|geyser|r1300|siren|sand:|hexa?(?:gram)?(?:[^a-z]|$)|seal|warning|telegraph|eclipse|lance|glass|stomach|위장|r105:|r1040|r1042|r1343|r1263|r1241|r1192|r241:|r1345|r1346|r1358|r1383/;
const BG=/ripple|puddle|floor-?(?:wave|fire|flame|ripple)|ground-?(?:fire|flame|wave)|wave-?floor|바닥/;
const HIT=/burst|slash|impact|(?:^|[^a-z])hit|strike|spark|crescent|half-?moon|반월|(?:^|[^a-z])cut|blood|explo|blast|smash|r912|r1340|pxfsprite|bleed/;
function textOf(c){const m=c.r1369fx;return ((m&&m.type)||'')+' '+String(c.owner&&c.owner.id||'')+' '+String(c.sourcePath||'');}
function classify(c){try{
 if(!c||c.kind==='text'||!c.owner)return null;const o=c.owner,k=o.kind;if(o.r1369edge||/^r448:(?:over|ghost):|^r350:ghost:/.test(String(o.id||'')))return null;/* R448 조형물 덮개·영웅 실루엣, R350 영웅 실루엣만 뺀다(r350·r448 표시는 여러 영웅 이펙트에도 붙으므로 표시로 거르지 않음 — 헤드리스 실측) */if(o.r1369bg)return 'background';
 const t=textOf(c).toLowerCase();if(SHADOW.test(t)||EXCLUDE.test(t))return null;
 const m=c.r1369fx;
 if(k==='hero'||k==='enemy'){if(c.spatialRole==='body'||c.kind!=='image'||!BODY.test(t))return null;return 'body';}
 if(SKIP_KINDS.has(k))return null;
 if(k==='scene'&&!m&&!(c.kind==='image'&&FXPATH.test(String(c.sourcePath||'').toLowerCase())))return null;
 if(k!=='scene'&&k!=='effect'&&k!=='hazard')return null;
 if(m&&HIT_TYPES.has(m.type))return 'hit';if(m&&BODY_TYPES.has(m.type))return 'body';
 if(ENRAGE.test(t))return 'background';if(BODY.test(t))return 'body';
 if(k==='hazard'||DANGER.test(t))return 'danger';if(BG.test(t))return 'background';if(HIT.test(t))return 'hit';return 'other';}catch(e){fail(e);return null;}}
function hitCap(age){if(!fin(age))return CAP.hitUnknown;if(age<=PEAK)return CAP.hitPeak;if(age>=FADE)return CAP.hitTail;return CAP.hitPeak+(CAP.hitTail-CAP.hitPeak)*(age-PEAK)/(FADE-PEAK);}
function coverFactor(f){if(!fin(f)||f<=COVER)return 1;return .8-(Math.min(1,f)-COVER)/(1-COVER)*.3;}
// 몸 상자 하나를 이펙트 상자 목록이 덮는 넓이 비율(8×8 표본)
function coverOf(b,boxes){if(!b||!boxes||!boxes.length)return 0;const w=b.x1-b.x0,h=b.y1-b.y0;if(!(w>0&&h>0))return 0;let hit=0;const N=8;
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=b.x0+(i+.5)*w/N,y=b.y0+(j+.5)*h/N;for(const q of boxes)if(x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1){hit++;break;}}return hit/(N*N);}
// ---- 슬라이더 배율(R1271) ----
function userScale(){try{const A=window.__STORYWORLD_HIT_TRANSLUCENT_R1271__;const v=A&&typeof A.level==='function'?+A.level():NaN;return fin(v)?clamp(v/.4,.4,2.5):1;}catch(e){fail(e);return 1;}}
// ---- 나이: 엔진 효과는 e.age, 따로 그린 효과는 주인 id 를 처음 본 게임 시각 ----
const born=new Map();let lastPrune=-Infinity;
function now(){try{if(typeof time==='number'&&Number.isFinite(time))return time;}catch(_){}try{return performance.now()/1000;}catch(_){return 0;}}
function ageOf(c,t){const m=c.r1369fx;if(m&&fin(m.age))return m.age;const id=c.owner&&c.owner.id;if(id==null||c.owner.kind==='scene')return NaN;const key=String(id);let r=born.get(key);if(!r||t<r.t0){r={t0:t,seen:t};born.set(key,r);}r.seen=t;return t-r.t0;}
function prune(t){if(Math.abs(t-lastPrune)<2)return;lastPrune=t;for(const [k,r] of born)if(!(t-r.seen<3)&&!(t<r.seen))born.delete(k);}
// ---- 기하 ----
function boxOf(c){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const visit=P=>{if(!Array.isArray(P))return;for(const p of P){if(!p||!fin(p[0])||!fin(p[1]))continue;if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1];}};
 if(Array.isArray(c.points))visit(c.points);else if(Array.isArray(c.paths))for(const p of c.paths)visit(p&&p.points);return x1>x0&&y1>y0?{x0,y0,x1,y1}:null;}
// 겹치는 몸 상자를 하나로 합쳐 서로 떨어진 구멍 목록으로(evenodd 클립에서 겹친 구멍이 다시 칠해지지 않게)
function mergeBoxes(list){const b=list.map(q=>({...q}));let changed=true;while(changed){changed=false;for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){const p=b[i],q=b[j];if(p.x0<=q.x1&&p.x1>=q.x0&&p.y0<=q.y1&&p.y1>=q.y0){b[i]={x0:Math.min(p.x0,q.x0),y0:Math.min(p.y0,q.y0),x1:Math.max(p.x1,q.x1),y1:Math.max(p.y1,q.y1)};b.splice(j,1);changed=true;break;}}if(changed)continue;}return b;}
// 몸 구멍은 네모 대신 몸 상자에 맞춘 타원(20각) — 네모 경계가 화면에 각지게 보이지 않게
const oval=(q,ccw)=>{const cx=(q.x0+q.x1)/2,cy=(q.y0+q.y1)/2,rx=(q.x1-q.x0)/2,ry=(q.y1-q.y0)/2,o=[];for(let i=0;i<20;i++){const t=(ccw?-1:1)*i/20*Math.PI*2;o.push([cx+rx*Math.cos(t),cy+ry*Math.sin(t)]);}return o;};
const rect=(q,ccw)=>ccw?[[q.x0,q.y0],[q.x0,q.y1],[q.x1,q.y1],[q.x1,q.y0]]:[[q.x0,q.y0],[q.x1,q.y0],[q.x1,q.y1],[q.x0,q.y1]];
function actorBoxes(scale){const out=[];try{if(typeof project!=='function')return out;const ah=typeof actorHeight==='function'?+actorHeight():NaN;if(!fin(ah)||ah<=0)return out;
 const add=(x,y,r)=>{if(!fin(x)||!fin(y))return;const q=project(x,y);if(!q||!fin(q.x)||!fin(q.y))return;const h=ah*clamp(fin(r)?r/.42:1,1,3)*scale,w=h*.5;
  out.push({x0:q.x*scale-w/2,x1:q.x*scale+w/2,y0:q.y*scale-h*.95,y1:q.y*scale-h*.05});};
 if(typeof player==='object'&&player&&player.visible!==false&&!(player.hp<=0))add(player.x,player.y,player.radius);
 const E=typeof room==='object'&&room&&Array.isArray(room.enemies)?room.enemies:[];let n=0;for(const e of E){if(!e||!(e.hp>0)||e.visible===false)continue;add(e.x,e.y,e.radius);if(++n>=80)break;}}catch(e){fail(e);}return out;}
// ---- 한 프레임 처리 ----
const done=new WeakSet();
function process(cmds,scene){if(prefs.on===false||!Array.isArray(cmds)||done.has(cmds))return;done.add(cmds);stats.frames++;
 const t=now();prune(t);const us=userScale(),cap=v=>us>=1?Math.min(v*us,Math.max(v,SCALE_MAX)):v*us;
 let firstBody=Infinity;for(const c of cmds)if(c&&c.spatialRole==='body'){firstBody=fin(c.order)?c.order:firstBody;break;}
 const rows=[];let bgI=0;const extra=[],dangerRows=new Set();
 const W0=fin(typeof W==='number'?W:NaN)?W:NaN,pw=scene&&scene.projection&&scene.projection.width;const bodies=actorBoxes(fin(pw)&&fin(W0)&&W0>0?pw/W0:1);
 for(let i=0;i<cmds.length;i++){const c=cmds[i];const cat=classify(c);if(!cat)continue;
  const st=c.style&&typeof c.style==='object'?c.style:{};let a=fin(st.globalAlpha)?clamp(st.globalAlpha,0,1):1;
  if(cat==='body'){a=Math.min(a,cap(CAP.body));stats.body++;}
  else if(cat==='hit'){a=Math.min(a,cap(hitCap(ageOf(c,t))));stats.hit++;}
  else if(cat==='background'){a=Math.min(a,cap(CAP.background));stats.background++;
   if(!(c.owner.groundAligned===true)){c.owner={...c.owner,kind:'scene',r1369bg:true};if(fin(firstBody))c.order=firstBody-1+(bgI++)*1e-4;}}
  else if(cat==='danger'){stats.danger++;dangerRows.add(c);
   if(c.kind==='fill')a=Math.min(a,cap(CAP.dangerInner));
   else{const a0=a;a=Math.min(a,cap(CAP.dangerEdge));
    const q=c.kind==='image'?boxOf(c):null;const holes=q?mergeBoxes(bodies.filter(b=>b.x0<q.x1&&b.x1>q.x0&&b.y0<q.y1&&b.y1>q.y0).map(b=>({x0:Math.max(b.x0,q.x0),y0:Math.max(b.y0,q.y0),x1:Math.min(b.x1,q.x1),y1:Math.min(b.y1,q.y1)}))).filter(h=>h.x1-h.x0>1&&h.y1-h.y0>1):[];
    if(holes.length){const clips=Array.isArray(c.clips)?c.clips:[],P=4,outer={x0:q.x0-P,y0:q.y0-P,x1:q.x1+P,y1:q.y1+P};
     c.clips=[...clips,{paths:[{points:rect(outer,false),closed:true},...holes.map(h=>({points:oval(h,true),closed:true}))],rule:'evenodd'}];
     extra.push({at:i,c:{...c,key:c.key+':r1369in',owner:{...c.owner,r1369edge:true},clips:[...clips,{paths:holes.map(h=>({points:oval(h,false),closed:true})),rule:'nonzero'}],order:(fin(c.order)?c.order:0)+1e-4,style:{...st,globalAlpha:Math.min(a0,cap(CAP.dangerInner))}}});stats.edges++;}}}
  else{a=Math.min(a,cap(CAP.other));stats.other++;}
  c.style={...st,globalAlpha:a};rows.push(c);}
 // 5) 몸 가림
 // 위험 범위는 몸 자리를 이미 ≤.3 으로 나눠 그리므로(범위는 읽혀야 함) 가림 배율에서 뺀다
 if(rows.length){
  if(bodies.length){const all=rows.filter(c=>!dangerRows.has(c)&&c.style.globalAlpha>.04);const boxes=all.map(boxOf);
   const k=new Map();for(const b of bodies){const ov=[],who=[];for(let j=0;j<all.length;j++){const q=boxes[j];if(q&&q.x0<b.x1&&q.x1>b.x0&&q.y0<b.y1&&q.y1>b.y0){ov.push(q);who.push(all[j]);}}
    if(!ov.length)continue;const f=coverFactor(coverOf(b,ov));if(f>=1)continue;
    // 그 몸을 덮는 이펙트 중 몸 상자의 10% 넘게 덮는 것만 옅게(귀퉁이만 스친 것은 그대로)
    for(let j=0;j<ov.length;j++){if(coverOf(b,[ov[j]])>.1){const c=who[j];k.set(c,Math.min(k.get(c)??1,f));}}}
   for(const [c,f] of k){c.style={...c.style,globalAlpha:c.style.globalAlpha*f};stats.covered++;}}}
 for(let j=extra.length-1;j>=0;j--)cmds.splice(extra[j].at+1,0,extra[j].c);}
// ---- 감싸기 ----
function wrapRender(fn){if(typeof fn!=='function'||fn.r1369)return fn;const w=function(cmds,...a){const t1=perfNow();try{process(cmds,this);}catch(e){fail(e);}stats.ms+=perfNow()-t1;return fn.apply(this,[cmds,...a]);};try{for(const k of Object.keys(fn))if(/^_*(r\d|sinRoom)/i.test(k))w[k]=fn[k];}catch(_){}w.r1369=true;return w;}
const wrappedScenes=new WeakSet();
function wrapScene(){try{const S=window.__STORYWORLD_PHASE1__&&window.__STORYWORLD_PHASE1__.controller&&window.__STORYWORLD_PHASE1__.controller.state&&window.__STORYWORLD_PHASE1__.controller.state.three;const cs=S&&S.commands;if(!cs||typeof cs.render!=='function')return;
 const P=Object.getPrototypeOf(cs);if(P&&typeof P.render==='function'&&!P.render.r1369)P.render=wrapRender(P.render);
 if(Object.prototype.hasOwnProperty.call(cs,'render')&&!cs.render.r1369)cs.render=wrapRender(cs.render);wrappedScenes.add(cs);}catch(e){fail(e);}}
let fxWrapped=false;
function wrapDrawEffect(){try{if(typeof drawEffect!=='function'||drawEffect.r1369)return;const base=drawEffect;
 const w=function(e,...rest){let arr=null,n0=0;try{const c=typeof ctx==='object'&&ctx;if(c&&Array.isArray(c.commands)){arr=c.commands;n0=arr.length;}}catch(_){}
  try{return base.apply(this,[e,...rest]);}finally{if(arr&&e&&arr.length>n0){const m={type:String(e.type||''),age:fin(+e.age)?+e.age:NaN};for(let i=n0;i<arr.length;i++){const c=arr[i];if(c&&typeof c==='object'&&!c.r1369fx){c.r1369fx=m;stats.tagged++;}}}}};
 try{for(const k of Object.keys(base))w[k]=base[k];}catch(_){}w.r1369=true;drawEffect=w;fxWrapped=true;}catch(e){fail(e);}}
function install(){wrapDrawEffect();wrapScene();}
function set(v){const o=typeof v==='boolean'?{on:v}:{...(v||{})};prefs={...prefs,...o};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_FX_ALPHA_R1369__=Object.freeze({revision:REV,CAP:Object.freeze({...CAP}),classify,hitCap,coverOf,coverFactor,install,set,
 active:()=>prefs.on!==false,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},fxWrapped,ages:born.size,lastError,browser:false,GPU:false})});
try{install();}catch(e){fail(e);}
try{if(typeof document!=='undefined'&&document.readyState!=='complete'&&typeof window.addEventListener==='function')window.addEventListener('load',install);}catch(e){fail(e);}
try{setInterval(install,500);}catch(_){}
})();
