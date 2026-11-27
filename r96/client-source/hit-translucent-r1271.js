/* R1271 적중 이펙트 반투명 (사용자 2026-11-20 "공격 적중시 이펙트 반투명하게 해서 유닛들 잘 보이게")
 *  영웅·몹의 공격 적중(피격) 이펙트 — 엔진 burst·slash, 영웅 고유 적중 e568HeroImpact, R912 적중 시트 r912hit, 접촉(R58·R61·hospital 14),
 *  영웅 피격(R43·heroHit) — 는 모두 엔진 drawEffect 로 그려진다. 그 한 길을 감싸 그리는 동안만 ctx.globalAlpha 를 곱해 낮춘다.
 *  기본 불투명도 .4(R1297, 예전 .6)(설정창 '적중·시전 이펙트 불투명도' 슬라이더 20~100%, 저장). 유닛을 크게 덮는 이펙트(size ≥ 1.6)는 그 값의 .75배. 이미 낮은 알파에는 곱하므로 더 밝아지지 않는다.
 *  시전 소용돌이(R100 sig-aura·sig-gather 전 색)도 같은 값으로 Three 명령 알파를 낮춘다(R409 와 같은 자리).
 *  피해·판정·효과 목록·텍스트·스킬 이펙트(sigil·link·threadSlash 등)는 그대로. 그린 뒤 알파는 finally 로 되돌린다.
 *  설정 storyworld.r1271.hitAlpha {"on":false} 로 끄면 예전 그대로, {"level":.5} 로 조절(설정창 슬라이더와 같은 값, 20~100%).
 * Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_HIT_TRANSLUCENT_R1271__)return;
const REV='R1271-hit-translucent-1',KEY='storyworld.r1271.hitAlpha';
const HIT=new Set(['burst','slash','e568HeroImpact','r912hit','contactR61','regionalContactR58','hospitalBossContact14','playerHitR43','heroHit']);
// R1297 (사용자 2026-11-21 12:35Z "스킬적중이펙트 더 투명하게"): 기본 .6 → .4. 이미 저장된 슬라이더 값도 한 번만 같은 비율(2/3)로 낮춘다(하한 LO, 표식 cut1297).
let prefs={on:true,level:.4,bigSize:1.6,bigRatio:.75};try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};
 if(saved&&typeof saved==='object'&&!saved.cut1297&&'level'in saved){const v=+saved.level;if(Number.isFinite(v)){saved.level=Math.max(.2,Math.min(1,v)*2/3);saved.cut1297=true;try{localStorage.setItem(KEY,JSON.stringify({...saved}));}catch(_){}}}
 prefs={...prefs,...saved};}catch(_){}
const stats={drawn:0,swirl:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const LO=.2,lv=()=>{const v=+prefs.level;return fin(v)?Math.max(LO,Math.min(1,v)):.4;};
const k=e=>{const s=fin(+e.size)?+e.size:1,v=lv();return s>=prefs.bigSize?Math.max(LO,v*prefs.bigRatio):v;};
// ---- 시전 소용돌이(R100 sig-aura 불꽃 고리·sig-gather 바닥 소용돌이, 빨강·금·청 등 14색 전부) ----
//  그림이 여러 길(R102 영웅 서명 효과·R1039·R1041·R1157·R1042 등)에서 ctx.drawImage 로 직접 그려져 drawEffect 길을 안 타므로,
//  R409 와 같이 Three 기록기 명령(frame.commands)을 render 직전에 고친다. 같은 그림의 sig-hit·sig-slash(적중 불꽃)는 그대로.
const SWIRL=/(?:^|\/)r100\/sig-(?:aura|gather)-[a-z]+\.webp(?:[?#]|$)/,done=new WeakSet();
function veil(frame){try{const C=frame&&frame.commands;if(prefs.on===false||!Array.isArray(C)||done.has(C))return;done.add(C);const m=lv();if(m>=1)return;
 for(let i=0;i<C.length;i++){const c=C[i];if(!c||c.kind!=='image'||!SWIRL.test(String(c.sourcePath||'')))continue;const st=c.style||{};c.style={...st,globalAlpha:(fin(st.globalAlpha)?st.globalAlpha:1)*m};stats.swirl++;}}catch(e){fail(e);}}
const wrappedR=new WeakSet();
// R1344: render 감싸개끼리 서로 표식을 가려 번갈아 끝없이 감싸 오래 플레이하면 'Maximum call stack size exceeded'(사용자 11-26 탐식의 주방) → 안쪽 감싸개의 표식(/^_*(r\d|sinRoom)/)을 새 감싸개에 옮겨 담는다(R1290 방식).
function wrapRender(fn){if(typeof fn!=='function'||fn.r1271)return fn;const w=function(frame,...a){veil(frame);return fn.apply(this,[frame,...a]);};try{for(const k of Object.keys(fn))if(/^_*(r\d|sinRoom)/i.test(k))w[k]=fn[k];}catch(_){}w.r1271=true;return w;}
function wrapThree(){try{const C=window.StoryPhase1&&window.StoryPhase1.ThreeRenderer&&window.StoryPhase1.ThreeRenderer.prototype;if(C&&typeof C.render==='function'&&!C.render.r1271)C.render=wrapRender(C.render);}catch(e){fail(e);}
 try{const r=window.__STORYWORLD_PHASE1__&&window.__STORYWORLD_PHASE1__.controller&&window.__STORYWORLD_PHASE1__.controller.state&&window.__STORYWORLD_PHASE1__.controller.state.three;
  if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!r.render.r1271&&!wrappedR.has(r)){wrappedR.add(r);r.render=wrapRender(r.render);}}catch(e){fail(e);}}
let installed=false;
function install(){wrapSettings();wrapThree();if(typeof drawEffect!=='function'||installed)return;installed=true;const base=drawEffect;
 const w=function(e,...rest){
  let c=null,prev=1,on=false;
  try{if(prefs.on!==false&&e&&HIT.has(e.type)&&typeof ctx==='object'&&ctx){c=ctx;prev=c.globalAlpha;c.globalAlpha=(fin(prev)?prev:1)*k(e);on=true;stats.drawn++;}}catch(err){fail(err);on=false;}
  try{return base.apply(this,[e,...rest]);}finally{if(on){try{c.globalAlpha=prev;}catch(err){fail(err);}}}};
 w.r1271=true;drawEffect=w;}
// ---- 설정 창: 적중 이펙트 불투명도 슬라이더(20~100%, 값 저장) ----
function wrapSettings(){try{if(typeof showSettings==='function'&&!showSettings.r1271){const sb=showSettings;const w=function(...a){const r=sb.apply(this,a);try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings');
 if(grid&&!document.getElementById('hitAlphaR1271')){const label=document.createElement('label');label.textContent='적중·시전 이펙트 불투명도 ';const inp=document.createElement('input');inp.type='range';inp.id='hitAlphaR1271';inp.min='20';inp.max='100';inp.step='5';inp.value=String(Math.round(lv()*100));
  const out=document.createElement('output');out.textContent=inp.value+'%';inp.oninput=()=>{set({level:(+inp.value)/100});out.textContent=Math.round(lv()*100)+'%';};inp.onchange=inp.oninput;
  const hint=document.createElement('span');hint.className='small muted';hint.textContent=' (낮을수록 이펙트 아래 유닛이 잘 보임 · 100% = 예전)';label.append(inp,out,hint);grid.appendChild(label);}}catch(e){fail(e);}return r;};w.r1271=true;showSettings=w;}}catch(e){fail(e);}}
function set(v){const o=typeof v==='boolean'?{on:v}:{...(v||{})};if('level'in o){const n=+o.level;if(fin(n))o.level=Math.max(LO,Math.min(1,n));else delete o.level;}prefs={...prefs,...o,cut1297:true};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
try{install();}catch(e){fail(e);}
try{if(typeof document!=='undefined'&&document.readyState!=='complete'&&typeof window.addEventListener==='function')window.addEventListener('load',install);}catch(e){fail(e);}
try{setInterval(wrapThree,500);}catch(_){}
window.__STORYWORLD_HIT_TRANSLUCENT_R1271__=Object.freeze({revision:REV,HIT:[...HIT],set,level:lv,install,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browser:false,GPU:false})});
})();
