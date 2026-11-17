// R1030 — 사용자 2026-11-14 "플레이어가 다른 몹과 맵배경과 이질감이 느껴지는 문제 그렇다고 플레이어가 너무 안보여도안됨".
//  헤드리스 촬영(1280×720, 환도·미카엘라·기억사수·네온, dist00·dist02·ep1a08·ep1b07)에서 본 원인:
//   ① 밝은 옷 영웅(환도·미카엘라·기억사수·윤서하)의 몸 그림이 장면에서 가장 밝다 — 불투명 픽셀 평균 밝기 98~132(0~255)인데
//      몹·바닥은 대개 45~80 이다. 몸 안 명암 폭도 좁아(빛 바랜 듯 납작) 어두운 장면 위에 '오려 붙인 하얀 종이'처럼 뜬다.
//      어두운 옷 영웅(네온·라우렌·헌터·슬레이어, 45~71)은 이미 몹과 같은 명도 띠라 이 문제가 없다.
//   ② 발밑 그림자가 옅어(엔진 알파 .075 겹 타원) 영웅이 바닥에 서 있지 않고 떠 보인다. 몹은 R206·R332 발 그림이 받쳐 준다.
//  고침(그림 원본·판정·피해·AI·저장은 그대로, 그릴 때만):
//   1) 노출 맞춤(grade) — 밝은 옷 영웅의 몸 그림만, 그 영웅 평균 밝기를 장면 기준(96)쪽으로 내리고(최대 −18%),
//      줄어든 명암 폭은 대비로 조금 되살린다(최대 ×1.10, 기준점 .42). 엔진 몸 재질의 색 필터 행렬(userData.filter: m·offset)에
//      그 프레임 동안만 곱하고 그린 뒤 되돌린다(R453 과 같은 자리 — 셰이더·텍스처·굽기 추가 없음, 모바일 비용 거의 0).
//      국지 조명(R451)이 밝은 곳에서는 덜 내린다(등불 밑 영웅은 밝아야 맞다).
//      가독성 하한: 몸 평균이 장면 기준 아래로는 절대 내려가지 않고(어두운 옷 영웅은 손대지 않음), R409·R434 테·R453 테 빛은 그대로다.
//   2) 발 닿음 그림자(contact) — drawHero 동안 엔진 shadow 를 한 번 더(좁고 짙게: 0.8배 폭, 알파 .9) 그려 발이 바닥에 닿게.
//      R821(찻잔 안의 집)이 이미 짙은 그림자를 더하는 방에서는 더하지 않는다.
//  끄기: localStorage storyworld.r1030.heroHarmony {"on":false} (grade·contact 따로: {"grade":false} / {"contact":false}).
(()=>{'use strict';
if(window.__STORYWORLD_HERO_HARMONY_R1030__)return;
const REV='R1030-hero-harmony-1',KEY='storyworld.r1030.heroHarmony';
const DEFAULTS=Object.freeze({on:true,grade:true,contact:true});
let prefs={...DEFAULTS};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');for(const k in DEFAULTS)if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
let enabled=true;/* 촬영·비교용 임시 스위치(저장 안 함) */
const stats={frames:0,graded:0,contact:0,skipped:0,errors:0};let lastError=null,disposed=false,depth=0;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fin=(v,d)=>Number.isFinite(v)?v:d;
// 남쪽 대기 그림(assets/r93/idle/idle-<영웅>-s.png) 불투명 픽셀 평균 밝기(0~255) — R821 실측값.
const MEAN=Object.freeze({hwando:132,michaela:122,gunner:110,seoha:98,neon:71,lauren:62,hunter:47,slayer:45});
const LIT0=1.3,TARGET=92,GMIN=.70,CMAX=1.16,PIVOT=.42;
// 영웅 id + 발밑 빛(채널 평균, 1 = 보통) → 선형 색 보정 x' = a·x + b (a·b 유한, 정체 = {a:1,b:0}).
function gradeOf(hero,light){const mean=MEAN[String(hero||'')];if(!Number.isFinite(mean)||mean<=TARGET)return{a:1,b:0};
 const lit=clamp((fin(light,1)-LIT0)/.5,0,1);/* 등불처럼 밝은 빛 밑은 덜 내린다(영웅 둘레 빛 ~1.2 는 빼고) */
 const g0=clamp(TARGET/mean,GMIN,1),g=1-(1-g0)*(1-.6*lit),c=clamp(1+(1-g)*.6,1,CMAX);
 const a=c*g,b=PIVOT*(1-c);return{a,b};}
// 밝기 평균 x(0~1)를 보정하면 → 결과(검사·심사용)
const apply=(gr,x)=>clamp(gr.a*x+gr.b,0,1);
const on=()=>!disposed&&enabled&&prefs.on;
const heroId=()=>{try{return typeof player!=='undefined'&&player?String(player.hero||''):'';}catch(_){return'';}};
const GHOST_KEYS=['r448:ghost:','r350:ghost:'];
function isHeroRow(key,ow){if(!ow)return false;if(ow.kind==='hero')return true;return ow.kind==='effect'&&typeof key==='string'&&GHOST_KEYS.some(p=>key.startsWith(p));}
const bodyBlend=m=>m.blending===undefined||m.blending===1;
function lightAt(x,y){try{const L=window.__STORYWORLD_LOCAL_LIGHT_R451__;if(!L?.owns?.())return 1;const v=L.lightAt(x,y);if(!v)return 1;const a=(v[0]+v[1]+v[2])/3;return Number.isFinite(a)?a:1;}catch(_){return 1;}}
// ---- 1) 노출 맞춤: 엔진 Three 그리기 직전 영웅 몸 재질 필터에 곱하고, 그린 뒤 되돌린다 --------------------------------
const GL_TOKEN={};
function wrapGL(r){const gl=r.renderer;if(!gl||gl.r1030Wrapped===GL_TOKEN)return;const base=gl.render;
 gl.render=function(scene,camera){const restore=[];
  try{const pass=camera?.layers?.mask;if(on()&&prefs.grade&&scene===r.scene&&camera===r.camera&&(pass===4||pass===8)){if(pass===8)stats.frames++;
    const hero=heroId();if(MEAN[hero]>TARGET){const seen=new Set();
     for(const [key,row] of r.commands?.rows?.entries?.()||[]){const ow=row?.geometryState?.owner,mesh=row?.mesh,m=mesh?.material;
      if(!isHeroRow(key,ow)||!m||!m.map||!bodyBlend(m)||ow.groundAligned===true||!mesh.visible||!(mesh.layers.mask&pass))continue;
      const f=m.userData?.filter;if(!f?.m?.elements||!f.offset||seen.has(f)){stats.skipped++;continue;}seen.add(f);
      const gr=gradeOf(hero,lightAt(fin(ow.x,0),fin(ow.y,0)));if(gr.a===1&&gr.b===0)continue;
      if(!Number.isFinite(gr.a)||!Number.isFinite(gr.b))continue;
      const me=f.m.elements.slice(),ox=f.offset.x,oy=f.offset.y,oz=f.offset.z;
      // 결과 = a·(M·x + o) + b  →  M' = a·M, o' = a·o + b
      for(let i=0;i<9;i++)f.m.elements[i]=me[i]*gr.a;f.offset.x=ox*gr.a+gr.b;f.offset.y=oy*gr.a+gr.b;f.offset.z=oz*gr.a+gr.b;
      restore.push(()=>{for(let i=0;i<9;i++)f.m.elements[i]=me[i];f.offset.x=ox;f.offset.y=oy;f.offset.z=oz;});stats.graded++;}}}}catch(e){fail(e);}
  try{return base.call(this,scene,camera);}finally{for(let i=restore.length-1;i>=0;i--){try{restore[i]();}catch(e){fail(e);}}}};
 gl.r1030Wrapped=GL_TOKEN;}
function wrapAll(){if(disposed)return;try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r?.renderer&&r.scene&&r.commands)wrapGL(r);}catch(e){fail(e);}}
const timer=typeof setInterval==='function'?setInterval(wrapAll,500):0;wrapAll();
// ---- 2) 발 닿음 그림자 ---------------------------------------------------------------------------------------------
const CONTACT=Object.freeze({scale:.8,alpha:.9});
function r821Active(){try{return !!window.__STORYWORLD_HERO_GROUND_R821__?.active?.();}catch(_){return false;}}
function wrapHero(){if(typeof drawHero!=='function'||drawHero.__r1030)return;const baseHero=drawHero;
 const w=function(...a){if(depth>0||!on()||!prefs.contact||typeof shadow!=='function'||r821Active())return baseHero.apply(this,a);
  depth++;const sBase=shadow;let done=false;
  shadow=function(x,y,radius,opt,...q){const out=sBase.call(this,x,y,radius,opt,...q);
   if(!done&&Number.isFinite(x)&&Number.isFinite(y)){done=true;try{const o=opt&&typeof opt==='object'?opt:{};sBase.call(this,x,y,radius,{...o,scale:fin(Number(o.scale),1)*CONTACT.scale,alpha:CONTACT.alpha});stats.contact++;}catch(e){fail(e);}}
   return out;};
  try{return baseHero.apply(this,a);}finally{shadow=sBase;depth--;}};
 w.__r1030=true;drawHero=w;}
wrapHero();
if(typeof addEventListener==='function')addEventListener('load',()=>{try{wrapHero();}catch(e){fail(e);}},{once:true});
// ---- 설정 ----------------------------------------------------------------------------------------------------------
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p={}){for(const k in DEFAULTS)if(typeof p[k]==='boolean')prefs[k]=p[k];save();return{...prefs};}
function setEnabled(v){enabled=v!==false;return enabled;}
function settingsSection(){const panel=typeof document!=='undefined'&&document.getElementById('panel');if(!panel?.querySelector('#settingsClose')||document.getElementById('heroHarmonyR1030'))return;
 const s=document.createElement('section');s.id='heroHarmonyR1030';
 s.innerHTML='<h3>영웅 그림 장면 맞춤 (R1030)</h3><p class="small muted">밝은 옷 영웅이 어두운 장면에서 혼자 떠 보이지 않게 몸 밝기를 장면 쪽으로 조금 맞추고, 발밑 그림자를 더합니다. 테두리·그림 원본은 그대로입니다.</p>'+
  [['on','켜기'],['grade','몸 밝기 맞춤'],['contact','발밑 그림자']].map(([k,l])=>'<label><input type="checkbox" data-r1030="'+k+'"> '+l+'</label>').join(' ');
 panel.appendChild(s);s.querySelectorAll('[data-r1030]').forEach(el=>{el.checked=!!prefs[el.dataset.r1030];el.onchange=()=>set({[el.dataset.r1030]:el.checked});});}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{if(!disposed)settingsSection();}catch(e){fail(e);}return r;};}
function dispose(){disposed=true;if(timer)clearInterval(timer);}
window.__STORYWORLD_HERO_HARMONY_R1030__=Object.freeze({revision:REV,storageKey:KEY,prefs:()=>({...prefs}),set,setEnabled,dispose,rewrap:wrapHero,
 stats:()=>({...stats}),pure:Object.freeze({gradeOf,apply,isHeroRow,MEAN,TARGET,GMIN,CMAX,PIVOT,CONTACT}),
 inspect:()=>({revision:REV,prefs:{...prefs},enabled,stats:{...stats},lastError,assetsChanged:false,gameplayChanged:false,GPUVerified:false})});
})();
