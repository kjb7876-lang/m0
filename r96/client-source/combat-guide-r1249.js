// R1249 — 외부 제안 검토 ①(사용자 2026-11-19 23:56Z "/검토": "큰 이펙트가 겹쳐도 위험 경계가 보이게. 첫 전투에서는 키보드 안내를
//  `바닥을 눌러 이동`과 `회피 버튼으로 피하기`로").
//  헤드리스 확인(같은 빌드, 스토리 첫 전투 dist00): PC 는 아래 기술 칸에 A/J/1·S/2 같은 키가 적혀 있어 맞다. 휴대폰은 R421 이 'C' 를 '버튼'으로
//   이미 바꿔 키 글자는 없지만, 어떻게 움직이고 피하는지 알려 주는 말이 설정 창 안('탭: 목적지 이동 · 두 손가락: 회피')에만 있었다.
//  ① 위험 경계: 적의 바닥 예고(먹 번짐 시트·육망성·시전 인장·위험 지대 — R409 와 같은 적 쪽 규칙) 위를 영웅 쪽 큰 이펙트가 덮으면
//     그 이펙트만 덮는 비율만큼 최대 50% 옅게 한다. 새 도형은 그리지 않는다(#712 주황 예고 도형 삭제, 도형 투사체 금지와 충돌하지 않게).
//     예고 자체·적 쪽 그림·타격 불꽃(hit·slash 등)은 건드리지 않는다. R409 의 '몹 몸 위 옅게'를 예고 자리에도 넓힌 것.
//  ② 첫 전투 안내: 터치 기기에서 처음으로 살아 있는 적이 9칸 안에 오면 '바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기'를 한 번(5초) 띄운다.
//     PC 는 키보드 안내가 맞으므로 아무것도 바꾸지 않는다. 본 기록 storyworld.r1249.guide {touch:true}.
//  판정·피해·AI·저장·자산 원본은 그대로(그림 알파·안내 글만). 끄기: localStorage['storyworld.r1249.guide']='{"edge":false,"hint":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_COMBAT_GUIDE_R1249__)return;
const REV='R1249-combat-guide-4',KEY='storyworld.r1249.guide',HINT='바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기';
let prefs={edge:true,hint:true,touch:false};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s==='object')prefs={...prefs,...s};}catch(_){}
const stats={frames:0,dangers:0,veiled:0,hints:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
// 적 쪽 그림 규칙(R409·R350 과 같음)
const ENEMY_ID=/^(r98|r241|r114:(windup|charge|thrown)|r160|r170:hex|r105|r169|r240|r328|r111:boss|r162|r167|r248|r286|r330|r341|story-vfx|enemy|boss|mob|hazard|final\d*-r)/i;
const ENEMY_WORD=/(^|[:_-])(enemy|mob|mobs|boss|hazard|hex|sigil)([:_-]|$)/i;
function enemySide(o){if(!o)return false;const id=String(o.id||'');return o.pxfSide==='enemy'||o.storyVfx===true||o.enemy===true||o.r98===true||ENEMY_ID.test(id)||ENEMY_WORD.test(id);}
// 예고(위험 경계): 적 쪽이면서 예고·바닥 표지인 것
const DANGER=/(warn|tele|hex|sigil|hazard|ink-bloom)/i;
// 헤드리스 실측(dist00 원형 예고): 엔진 예고는 R98 이 주인 'r98:<n>:a'(r98:true) + sig-gather 시트로 그린다 → 모으기·차징 시트만 예고로(터진 뒤 impact 는 아님)
const R98_TELL=/(gather|charge|warn|tele)/i;
function isDanger(c){const o=c.owner;if(!o||c.r1103Drop)return false;if(o.r98Telegraph===true)return true;if(o.r98===true&&R98_TELL.test(String(c.sourcePath||'')))return true;if(!enemySide(o))return false;
 return DANGER.test(String(o.id||''))||DANGER.test(String(c.sourcePath||''))||(o.groundAligned===true&&o.kind==='effect');}
const KEEP=/(hit|slash|impact|spark|blood|crit)/i;
function bbox(c){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity,bad=false;const add=p=>{if(!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1])){bad=true;return;}if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1];};
 if(c.kind==='image'&&Array.isArray(c.points))for(const p of c.points)add(p);else if(Array.isArray(c.paths))for(const path of c.paths)for(const p of path?.points||[])add(p);
 return !bad&&x1>x0&&y1>y0?{x0,y0,x1,y1}:null;}
const areaOf=b=>(b.x1-b.x0)*(b.y1-b.y0);
const overlap=(a,b)=>Math.max(0,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0))*Math.max(0,Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0));
const lastVeiled=[];
function process(commands){if(!prefs.edge||!Array.isArray(commands)||!commands.length)return;stats.frames++;
 const zones=[];for(const c of commands){try{if(!c||!isDanger(c))continue;const q=bbox(c);if(q&&areaOf(q)>=64){zones.push({...q,area:areaOf(q)});}}catch(e){fail(e);}}
 if(!zones.length)return;stats.dangers+=zones.length;lastVeiled.length=0;
 for(const c of commands){try{if(!c||c.kind!=='image'||c.mutable||c.spatialRole==='body'||c.r409Outlined||KEEP.test(String(c.sourcePath||'')))continue;
  const o=c.owner;if(!o||o.r350||o.groundAligned===true||(o.kind!=='effect'&&o.kind!=='scene')||enemySide(o)||isDanger(c)||KEEP.test(String(o.id||'')))continue;
  const q=bbox(c);if(!q)continue;const A=areaOf(q);let cover=0;
  for(const z of zones){if(A<z.area*.35)continue;/* 예고보다 훨씬 작은 그림은 경계를 못 가린다 */const ov=overlap(q,z);if(ov>0)cover=Math.max(cover,ov/z.area);}
  if(cover<.15)continue;const k=1-.5*clamp((cover-.15)/.6);
  if(c.style){c.style={...c.style,globalAlpha:(Number.isFinite(c.style.globalAlpha)?c.style.globalAlpha:1)*k};stats.veiled++;if(lastVeiled.length<24)lastVeiled.push([String(o.id||'').slice(0,40),+k.toFixed(2)]);}}catch(e){fail(e);}}}
// render 감싸기(R409 와 같은 방식: 프로토타입 + 인스턴스, 깊이로 안쪽 감싸기 건너뜀)
let depth=0;const wrapped=new WeakSet();
const wrapFn=fn=>{if(fn.__r1249)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1249=true;
 for(const k of Object.keys(fn))try{w[k]=fn[k];}catch(_){}return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!r.render.__r1249&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
// ② 첫 전투 안내(터치)
function touch(){try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}}
// ③ 2차 리뷰(사용자 11-20 00:34Z 첨부): 공개판 터치 첫 화면 아래 줄(#hint)이 9px '방향키 이동 · A/J/1 공격 · S/2 블링크…'.
//    헤드리스(812×375 터치)로 같은 글을 확인 → 터치 기기에서만 키보드 안내 줄을 터치 안내로 바꾸고, 도움말(조작과 진행) 맨 위에 터치 줄 하나를 더한다(키 표는 그대로).
const KB_HINT=/^(WASD\/)?방향키 이동/;
function fixHint(){try{if(!prefs.hint||!touch())return false;const el=document.getElementById('hint');if(!el)return false;const t=String(el.textContent||'');
 if(KB_HINT.test(t)){el.textContent=HINT;stats.hintFixes=(stats.hintFixes||0)+1;return true;}}catch(e){fail(e);}return false;}
function helpRow(){try{if(!touch())return false;const g=document.querySelector('#panel .keygrid');if(!g||g.firstChild?.className==='r1249Touch')return false;
 const b=document.createElement('b');b.className='r1249Touch';b.textContent='터치';const sp=document.createElement('span');sp.textContent=HINT;g.insertBefore(sp,g.firstChild);g.insertBefore(b,sp);return true;}catch(e){fail(e);return false;}}
function wrapHud(){try{if(typeof setHudTextR63R2!=='function'||setHudTextR63R2.__r1249)return;const hb=setHudTextR63R2;
 const w=function(id,text,...rest){if(id==='hint'&&typeof text==='string'&&prefs.hint&&KB_HINT.test(text)&&touch()){text=HINT;stats.hintFixes=(stats.hintFixes||0)+1;}return hb.call(this,id,text,...rest);};w.__r1249=true;setHudTextR63R2=w;}catch(e){fail(e);}}
wrapHud();
if(typeof showHelp==='function'){const hb=showHelp;showHelp=function(...a){const r=hb.apply(this,a);helpRow();return r;};}
function tick(){fixHint();try{if(!prefs.hint||prefs.touch||!touch())return false;
 if(typeof started==='undefined'||!started||(typeof loading!=='undefined'&&loading)||(typeof modal!=='undefined'&&modal)||(typeof storyScene!=='undefined'&&storyScene))return false;
 if(typeof player==='undefined'||!player||!(player.hp>0)||typeof room==='undefined'||!Array.isArray(room?.enemies))return false;
 let near=false;for(const e of room.enemies){if(!e||!(e.hp>0)||e.hero||e.ally)continue;if(Math.hypot(e.x-player.x,e.y-player.y)<9){near=true;break;}}
 if(!near||typeof toast!=='function')return false;toast(HINT,5);prefs.touch=true;save();stats.hints++;return true;}catch(e){fail(e);return false;}}
setInterval(()=>{wrapInst();wrapHud();tick();},500);wrapInst();
function set(p){for(const k of ['edge','hint'])if(typeof p?.[k]==='boolean')prefs[k]=p[k];save();return {...prefs};}
window.__STORYWORLD_COMBAT_GUIDE_R1249__=Object.freeze({revision:REV,HINT,process,tick,fixHint,helpRow,isDanger,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastVeiled:lastVeiled.slice(),lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
