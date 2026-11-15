// R1055 — 수묵화풍 테스트본(2안 중묵). 사용자 2026-11-15 "맵에 수묵화풍 필터를 코드로 넣어 동양 수묵화 느낌으로 특색", 시안 2안(중묵) 선택,
//  "수묵화풍은 테스트본으로 따로 빼놓고 맨처음메뉴에서 테스트해볼수 있게 별도로 만들어줘".
//  · 기본은 꺼짐. 첫 화면의 '수묵화풍 테스트' 단추를 누를 때마다 꺼짐 → 동양 지역만 → 모든 지역(테스트) → 꺼짐 으로 돈다(저장 storyworld.r1055.inkWash {mode}).
//  · 동양 지역 = 정본이 '동양 몽세'라고 적은 두 곳(잠들지 못하는 마을 last302 · 한약과 불면귀 last303). 다른 지역 이름·설정은 만들지 않는다.
//  · 맵(바닥·벽·지형 덩어리·풀)의 재질 셰이더에만 먹빛 계산을 끼운다 — 영웅·몹·탄·이펙트·소품 줄·체력바·UI 는 건드리지 않아 전투 가독성은 그대로다.
//    R451 국지 조명과 같은 길(재질 onBeforeCompile)이라 화면 전체를 한 번 더 그리는 패스가 없다(추가 렌더 타깃·흐림 패스 없음).
//  · 먹빛: 밝기 → 먹(푸른 검정)·중간 먹·한지 3점 농담, 부드러운 6단 농담, 그림 안 밝기 기울기로 먹선, 한지 결, 화면 가장자리 붓 자국.
//    등불처럼 따뜻하고 채도 높은 빛은 색을 남긴다(먹 위의 채색 한 점).
//  · 성능 5단계(PC급) 이상은 전체 효과, 그 아래(휴대폰 기본 포함)는 종이 결과 옅은 가장자리만.
//  판정·피해·AI·저장·서사·그림 원본은 바꾸지 않는다. ctx.filter 는 쓰지 않는다. 숫자는 모두 clamp(NaN·Infinity 가 그리기로 가지 않게).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_INK_WASH_R1055__)return;
const REV='R1055-ink-wash-1',KEY='storyworld.r1055.inkWash';
const MODES=Object.freeze(['off','east','all']),ZONES=Object.freeze(['last302','last303']);
const LABEL=Object.freeze({off:'꺼짐',east:'동양 지역만',all:'모든 지역'});
let prefs={mode:'off'};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&!Array.isArray(s)&&MODES.includes(s.mode))prefs.mode=s.mode;}catch(_){}
const stats={frames:0,patched:0,scans:0,onFrames:0,titleButtons:0,errors:0};let lastError=null,disposed=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=(v,d=0)=>Number.isFinite(v)?v:d,c01=v=>clamp(num(v),0,1);
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p){if(p&&typeof p==='object'&&MODES.includes(p.mode)&&p.mode!==prefs.mode){prefs.mode=p.mode;save();scanSig=NaN;}label();return {...prefs};}
function wants(zoneId,layer){if(disposed||prefs.mode==='off'||layer!=='STORY'||typeof zoneId!=='string'||!zoneId)return false;return prefs.mode==='all'||ZONES.includes(zoneId);}
// 성능 단계(R1043 1~7, 휴대폰 기본은 'auto'): 5 이상만 전체, 나머지는 종이 결만.
function level(step){const s=typeof step==='number'&&Number.isFinite(step)?step:0;return s>=5?'full':'paper';}

// ---- 색 계산(아래 GLSL 과 같은 식 — CPU 검사가 이 식을 본다) -------------------------------------------------------
const P=Object.freeze({ref:.45,gamma:.66,post:.6,mix:.8,night:.85,accent:.9,grain:.22,edge:.45,border:.65,steps:6,
 ink:[.04,.045,.06],mid:[.36,.36,.37],pap:[.90,.85,.72],paperLo:.92,paperHi:.16});
const LR=.2126,LG=.7152,LB=.0722;
function tone(rgb,lv,k=1,pp=.5){const c=[c01(rgb?.[0]),c01(rgb?.[1]),c01(rgb?.[2])];k=c01(k);pp=c01(pp);if(k<=.001)return c;
 const paper=c.map(v=>c01(v*(P.paperLo+pp*P.paperHi)));let out=paper;
 if(lv==='full'){const L=c[0]*LR+c[1]*LG+c[2]*LB,Ln=clamp(L/P.ref,0,1),Lt=Math.pow(Ln,P.gamma),q=Lt*P.steps,f=clamp((q-Math.floor(q)-.5)*2.5+.5,0,1),Lp=(Math.floor(q)+f)/P.steps;
  let Ls=Lt+(Lp-Lt)*P.post;Ls=clamp(Ls+(pp-.5)*P.grain*(.5+clamp(1-Math.abs(Ls-.45)*2.2,0,1)),0,1);
  const mx=Math.max(c[0],c[1],c[2]),mn=Math.min(c[0],c[1],c[2]),s=(mx-mn)/(mx+1e-4);
  const warm=clamp((c[0]-c[2])*5,0,1)*clamp((s-.4)*4,0,1)*clamp((Ln-.3)*3,0,1)*P.accent;
  out=[0,1,2].map(i=>{const ramp=(Ls<.5?P.ink[i]+(P.mid[i]-P.ink[i])*(Ls/.5):P.mid[i]+(P.pap[i]-P.mid[i])*((Ls-.5)/.5))*P.night;const o=c[i]+(ramp-c[i])*P.mix;return c01(o+(c[i]-o)*warm);});}
 return [0,1,2].map(i=>c01(c[i]+(out[i]-c[i])*k));}

const v3=a=>`vec3(${a.map(v=>v.toFixed(4)).join(',')})`,fl=v=>v.toFixed(4);
const GLSL=`uniform float r1055K;uniform float r1055Lv;uniform vec2 r1055Res;
float r1055H(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float r1055N(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(r1055H(i),r1055H(i+vec2(1.,0.)),f.x),mix(r1055H(i+vec2(0.,1.)),r1055H(i+vec2(1.,1.)),f.x),f.y);}
vec3 r1055Wash(vec3 r1055c){
 float k=clamp(r1055K,0.,1.);if(k<=.001)return r1055c;
 vec3 c=clamp(r1055c,0.,1.);vec2 res=max(r1055Res,vec2(1.));vec2 fc=gl_FragCoord.xy*(720./res.y);
 float pp=clamp(r1055N(fc*.5)*.25+r1055N(fc*.021)*.4+r1055N(fc*.006)*.35,0.,1.);
 vec2 uv=gl_FragCoord.xy/res;float d=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y))*2.;
 float bm=1.-clamp((d+(r1055N(vec2(fc.x*.012,fc.y*.22))-.5)*.22+(r1055N(fc*.011)-.5)*.30-.02)/.30,0.,1.);bm=pow(clamp(bm,0.,1.),1.4)*${fl(P.border)};
 vec3 ink=${v3(P.ink)};
 vec3 paper=mix(clamp(c*(${fl(P.paperLo)}+pp*${fl(P.paperHi)}),0.,1.),ink,bm*.5);
 vec3 o=paper;
 if(r1055Lv>.5){
  float L=dot(c,vec3(${LR},${LG},${LB}));float Ln=clamp(L/${fl(P.ref)},0.,1.);float Lt=pow(Ln,${fl(P.gamma)});
  float q=Lt*${fl(P.steps)};float f=clamp((fract(q)-.5)*2.5+.5,0.,1.);float Lp=(floor(q)+f)/${fl(P.steps)};
  float Ls=mix(Lt,Lp,${fl(P.post)});Ls=clamp(Ls+(pp-.5)*${fl(P.grain)}*(.5+clamp(1.-abs(Ls-.45)*2.2,0.,1.)),0.,1.);
  vec3 ramp=(Ls<.5?mix(ink,${v3(P.mid)},Ls/.5):mix(${v3(P.mid)},${v3(P.pap)},(Ls-.5)/.5))*${fl(P.night)};
  float mx=max(c.r,max(c.g,c.b));float mn=min(c.r,min(c.g,c.b));float s=(mx-mn)/(mx+1e-4);
  float warm=clamp((c.r-c.b)*5.,0.,1.)*clamp((s-.4)*4.,0.,1.)*clamp((Ln-.3)*3.,0.,1.)*${fl(P.accent)};
  o=mix(c,ramp,${fl(P.mix)});o=mix(o,c,warm);
  float lg=log(L+.02);float e=length(vec2(dFdx(lg),dFdy(lg)));e=clamp((e-.14)/.45,0.,1.)*(.5+r1055N(fc*.04));
  o=mix(o,ink,clamp(e*${fl(P.edge)},0.,.92)*(1.-warm));
  o=mix(o,ink,bm);}
 return clamp(mix(c,o,k),0.,1.);}
`;
const CALL='\n#define r1055Ink(c) r1055Wash(c)\ngl_FragColor.rgb=r1055Ink(gl_FragColor.rgb);\n',A_LIGHT='gl_FragColor.rgb*=r451Light();',A_CS='#include <colorspace_fragment>';
let U=null;
function uniforms(T){if(U)return U;const V2=T?.Vector2;U={r1055K:{value:0},r1055Lv:{value:1},r1055Res:{value:V2?new V2(1280,720):{x:1280,y:720,set(x,y){this.x=x;this.y=y;}}}};return U;}
// 셰이더에 먹빛 계산을 한 번만 끼운다. R451 빛 곱이 있으면 그 뒤, 없으면 색공간 변환 뒤. 자리가 없으면 그대로 둔다.
function inject(shader){try{if(!shader||typeof shader.fragmentShader!=='string')return false;const f=shader.fragmentShader;
  if(f.includes('r1055Ink('))return true;const a=f.includes(A_LIGHT)?A_LIGHT:f.includes(A_CS)?A_CS:null;if(!a)return false;
  const i=f.lastIndexOf(a)+a.length;shader.fragmentShader=GLSL+f.slice(0,i)+CALL+f.slice(i);
  if(!shader.uniforms||typeof shader.uniforms!=='object')shader.uniforms={};Object.assign(shader.uniforms,uniforms(shader.__T));return true;}catch(e){fail(e);return false;}}

// ---- 맵 재질 고르기(R451 과 같은 기준: 세계 층의 지형·벽·풀, 그리기 명령 줄(영웅·몹·소품·이펙트)은 뺀다) ------------------------
const SKIP_NAME=/^r(89-retro|300|450)|halo|fog|pool|-dim$|mote|haze|sky|decor-lit|glow|surgeon|marker|guidance|warn|telegraph|target|select|cursor|shadow-blob/i;
const patched=new WeakMap();
function eligible(o,rowMeshes){const name=String(o?.name||o?.parent?.name||'');if(!o||o.userData?.r450||o.userData?.r1055Skip||SKIP_NAME.test(name))return null;
 if(o.isSprite){const m=o.material;return m?.isSpriteMaterial&&m.map&&(m.blending===undefined||m.blending===1)?[m]:null;}
 if(!o.isMesh||rowMeshes.has(o))return null;const ok=[];
 for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m||!(m.isMeshBasicMaterial||m.isMeshStandardMaterial||m.isMeshLambertMaterial))continue;
  if(m.transparent&&!m.map&&!m.vertexColors)continue;if(m.blending!==undefined&&m.blending!==1)continue;ok.push(m);}
 return ok.length?ok:null;}
function patch(m,T){if(patched.has(m))return;uniforms(T);const before=m.onBeforeCompile,key=m.customProgramCacheKey;
 const w=function(shader,...a){if(typeof before==='function')before.call(this,shader,...a);inject(shader);};
 if(typeof before==='function')for(const k of Object.keys(before))w[k]=before[k];
 m.onBeforeCompile=w;m.customProgramCacheKey=function(){return(typeof key==='function'?key.call(this):'')+'|r1055';};m.needsUpdate=true;patched.set(m,true);stats.patched++;}
function patchScene(r){const rows=new WeakSet();for(const row of r.commands?.rows?.values?.()||[])if(row?.mesh)rows.add(row.mesh);
 r.scene.traverse(o=>{if(!(o.layers?.mask&4))return;const ms=eligible(o,rows);if(ms)for(const m of ms)patch(m,r.T);});}
function sceneSig(r){let s=0;for(const L of [r?.spatialRoot?.children,r?.scene?.children,r?.__r204?.group?.children]){if(!L)continue;for(let i=0;i<L.length;i++)s=Math.imul(s,31)+L[i].id|0;s^=L.length<<8;}return s;}
let scanSig=NaN,nextScan=0,K=0,lastT=0;
function update(r,frame){const zone=typeof room!=='undefined'&&room?room.id:null,want=wants(zone,frame?.layer),u=uniforms(r.T),t=performance.now();
 const dt=clamp(num((t-lastT)/1000,0),0,.25);lastT=t;K=clamp(num(K+((want?1:0)-K)*clamp(dt*4,0,1)),0,1);if(!want&&K<.004)K=0;
 u.r1055K.value=K;if(K<=0)return;stats.onFrames++;
 let step=null;try{step=window.__STORYWORLD_PERF7_R1043__?.step?.();}catch(_){}
 u.r1055Lv.value=level(step)==='full'?1:0;
 const cv=r.renderer?.domElement,w=num(cv?.width,1280),h=num(cv?.height,720);u.r1055Res.value.set(clamp(w,1,16384),clamp(h,1,16384));
 const ss=sceneSig(r);if(ss!==scanSig||t>=nextScan){scanSig=ss;nextScan=t+500;stats.scans++;patchScene(r);}}

// ---- 렌더러 감싸기(프로토타입 + 인스턴스 — perf-r97 이 인스턴스에 render 를 복사해 둔다) ------------------------------
const C=window.StoryPhase1?.ThreeRenderer?.prototype,wrapped=new WeakSet();
function wrapFn(fn){const w=function(frame){try{if(!disposed&&this?.T&&this.scene&&this.__r1055Frame!==frame){this.__r1055Frame=frame;stats.frames++;if(prefs.mode!=='off'||K>0)update(this,frame);}}catch(e){fail(e);try{uniforms(this.T).r1055K.value=0;K=0;}catch(_){}}
  try{return fn.apply(this,arguments);}finally{if(this)this.__r1055Frame=undefined;}};w.__r1055=true;return w;}
function wrapOnce(t){if(!t||wrapped.has(t)||typeof t.render!=='function')return;wrapped.add(t);t.render=wrapFn(t.render);}
function wrapAll(){if(disposed)return;try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,proto=r?Object.getPrototypeOf(r):C;wrapOnce(proto);if(r&&Object.prototype.hasOwnProperty.call(r,'render'))wrapOnce(r);}catch(e){fail(e);}}
const timer=typeof setInterval==='function'?setInterval(wrapAll,500):0;wrapAll();

// ---- 첫 화면 단추 -----------------------------------------------------------------------------------------------
const text=()=>'수묵화풍 테스트 · '+LABEL[prefs.mode];
function label(){try{const b=document.getElementById('inkTestR1055');if(b){b.textContent=text();b.dataset.mode=prefs.mode;}}catch(e){fail(e);}}
function titleButton(){try{const panel=document.getElementById('panel'),normal=document.getElementById('campaignNew54')||document.getElementById('newBtn');
  if(!panel||!normal||document.getElementById('inkTestR1055'))return;
  const b=document.createElement('button');b.id='inkTestR1055';b.type='button';b.textContent=text();b.dataset.mode=prefs.mode;
  b.title='테스트본: 맵을 수묵화풍(중묵)으로 그립니다. 누를 때마다 꺼짐 → 동양 지역만(잠들지 못하는 마을·한약과 불면귀) → 모든 지역 → 꺼짐. 캐릭터·UI 는 그대로입니다.';
  b.onclick=()=>{set({mode:MODES[(MODES.indexOf(prefs.mode)+1)%MODES.length]});b.textContent=text();b.dataset.mode=prefs.mode;};
  (normal.parentNode||panel).appendChild(b);stats.titleButtons++;}catch(e){fail(e);}}
try{if(typeof showTitle==='function'){const base=showTitle;showTitle=function(...a){const r=base.apply(this,a);titleButton();return r;};}}catch(e){fail(e);}
titleButton();

function dispose(){disposed=true;try{clearInterval(timer);}catch(_){}try{if(U)U.r1055K.value=0;}catch(_){}K=0;}
window.__STORYWORLD_INK_WASH_R1055__=Object.freeze({revision:REV,storageKey:KEY,modes:MODES,zones:ZONES,params:P,GLSL,prefs:()=>({...prefs}),set,wants,level,tone,inject,titleButton,
 inspect:()=>({revision:REV,prefs:{...prefs},k:K,level:U?(U.r1055Lv.value>.5?'full':'paper'):null,stats:{...stats},lastError}),dispose});
})();
