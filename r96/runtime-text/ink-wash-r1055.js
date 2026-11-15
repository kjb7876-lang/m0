// R1055 — 수묵화풍 테스트본(2안 중묵). 사용자 2026-11-15 "맵에 수묵화풍 필터를 코드로 넣어 동양 수묵화 느낌으로 특색", 시안 2안(중묵) 선택,
//  "수묵화풍은 테스트본으로 따로 빼놓고 맨처음메뉴에서 테스트해볼수 있게 별도로 만들어줘".
//  · 기본은 꺼짐. 첫 화면의 '수묵화풍 테스트' 단추를 누를 때마다 꺼짐 → 동양 지역만 → 모든 지역(테스트) → 꺼짐 으로 돈다(저장 storyworld.r1055.inkWash {mode}).
//  · 동양 지역 = 정본이 '동양 몽세'라고 적은 두 곳(잠들지 못하는 마을 last302 · 한약과 불면귀 last303). 다른 지역 이름·설정은 만들지 않는다.
//  · 맵(바닥·벽·지형 덩어리·풀)의 재질 셰이더에만 먹빛 계산을 끼운다 — 영웅·몹·탄·이펙트·소품 줄·체력바·UI 는 건드리지 않아 전투 가독성은 그대로다.
//    R451 국지 조명과 같은 길(재질 onBeforeCompile)이라 화면 전체를 한 번 더 그리는 패스가 없다(추가 렌더 타깃·흐림 패스 없음).
//  · 먹빛: 밝기 → 먹·중간 먹·한지 3점 농담(끊기는 단계 없음), 그림 안 밝기 기울기로 옅은 먹선, 큰 얼룩의 종이 결, 화면 가장자리 바림. 화풍 다섯 가지를 단추로 고른다.
//    등불처럼 따뜻하고 채도 높은 빛은 색을 남긴다(먹 위의 채색 한 점).
//  · 성능 5단계(PC급) 이상은 전체 효과, 그 아래(휴대폰 기본 포함)는 종이 결과 옅은 가장자리만.
//  판정·피해·AI·저장·서사·그림 원본은 바꾸지 않는다. ctx.filter 는 쓰지 않는다. 숫자는 모두 clamp(NaN·Infinity 가 그리기로 가지 않게).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_INK_WASH_R1055__)return;
const REV='R1055-ink-wash-2',KEY='storyworld.r1055.inkWash';
const MODES=Object.freeze(['off','east','all']),ZONES=Object.freeze(['last302','last303']);
const LABEL=Object.freeze({off:'꺼짐',east:'동양 지역만',all:'모든 지역'});
// 화풍(사용자 2026-11-15 12:36Z "눈조금덜아프고 퀄리티높아보이게 여러 유명화풍참고"): 낱알 그레인·끊기는 농담 단계·거친 먹선을 없애고 대비를 눌렀다.
//  값은 '먹·중간·종이 3점 농담 + 원래 색 조금' 으로만 다르다(이름은 참고한 화풍의 느낌일 뿐, 특정 그림을 베끼지 않는다).
//  어두운 곳을 많이 띄우면 바닥 잔무늬가 같이 커져 오히려 눈이 피로하다(헤드리스 실측) → 밝기 곡선은 완만하게(gamma .68~.76), 가장 밝은 값은 .74 아래로 눌렀다. 잔입자는 끔·켬을 번갈아 재서 끈 화면 수준임을 확인한다(qa/r1055 브라우저).
//  gamma 밝기 곡선 · keep 원래 색 남기는 비율 · floor/ceil 가장 어두운·밝은 값(대비 누르기) · line 먹선 · grain 큰 얼룩 세기 · haze 안개 · border 가장자리 · accent 등불 색 · ref 밝기 기준
const STYLES=Object.freeze({
 jg:Object.freeze({label:'진경산수풍',ink:[.07,.085,.11],mid:[.35,.37,.395],pap:[.80,.78,.70],tint:[.92,.98,1.06],gamma:.72,keep:.06,floor:.06,ceil:.72,line:.40,grain:.035,haze:.05,border:.45,accent:.85,ref:.62}),
 dw:Object.freeze({label:'담채풍',ink:[.13,.12,.11],mid:[.44,.42,.37],pap:[.86,.81,.68],tint:[1.04,1,.92],gamma:.70,keep:.38,floor:.10,ceil:.74,line:.30,grain:.03,haze:.08,border:.30,accent:.95,ref:.62}),
 song:Object.freeze({label:'송대 산수풍',ink:[.15,.13,.10],mid:[.40,.36,.29],pap:[.74,.68,.54],tint:[1.05,1,.9],gamma:.72,keep:.10,floor:.13,ceil:.66,line:.22,grain:.025,haze:.22,border:.35,accent:.75,ref:.62}),
 sumi:Object.freeze({label:'스미에풍',ink:[.09,.09,.10],mid:[.46,.46,.46],pap:[.88,.87,.83],tint:[1,1,1],gamma:.72,keep:.04,floor:.08,ceil:.60,line:.28,grain:.02,haze:.10,border:.25,accent:.70,ref:.62}),
 wc:Object.freeze({label:'수채 애니풍',ink:[.08,.10,.17],mid:[.30,.38,.50],pap:[.86,.86,.80],tint:[.96,1,1.06],gamma:.76,keep:.62,floor:.08,ceil:.74,line:.14,grain:.02,haze:.06,border:.15,accent:1,ref:.62})});
const STYLE_IDS=Object.freeze(Object.keys(STYLES)),DEF_STYLE='jg';
let prefs={mode:'off',style:DEF_STYLE};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&!Array.isArray(s)){if(MODES.includes(s.mode))prefs.mode=s.mode;if(typeof s.style==='string'&&STYLE_IDS.includes(s.style))prefs.style=s.style;}}catch(_){}
const stats={frames:0,patched:0,scans:0,onFrames:0,titleButtons:0,errors:0};let lastError=null,disposed=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=(v,d=0)=>Number.isFinite(v)?v:d,c01=v=>clamp(num(v),0,1);
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p){if(p&&typeof p==='object'){let ch=false;if(MODES.includes(p.mode)&&p.mode!==prefs.mode){prefs.mode=p.mode;ch=true;}if(typeof p.style==='string'&&STYLE_IDS.includes(p.style)&&p.style!==prefs.style){prefs.style=p.style;ch=true;}if(ch){save();scanSig=NaN;applyStyle();}}label();return {...prefs};}
function wants(zoneId,layer){if(disposed||prefs.mode==='off'||layer!=='STORY'||typeof zoneId!=='string'||!zoneId)return false;return prefs.mode==='all'||ZONES.includes(zoneId);}
// 성능 단계(R1043 1~7, 휴대폰 기본은 'auto'): 5 이상만 전체, 나머지는 종이 결만.
function level(step){const s=typeof step==='number'&&Number.isFinite(step)?step:0;return s>=5?'full':'paper';}

// ---- 색 계산(아래 GLSL 과 같은 식 — CPU 검사가 이 식을 본다) -------------------------------------------------------
const LR=.2126,LG=.7152,LB=.0722,PAPER_LO=.96,PAPER_HI=.08;
const styleOf=k=>STYLES[typeof k==='string'&&STYLE_IDS.includes(k)?k:DEF_STYLE];
// pp = 큰 얼룩(0~1, 가운데 .5). 낱알 잡음은 없다.
function tone(rgb,lv,k=1,pp=.5,style){const S=styleOf(style===undefined?prefs.style:style),c=[c01(rgb?.[0]),c01(rgb?.[1]),c01(rgb?.[2])];k=c01(k);pp=c01(num(pp,.5));if(k<=.001)return c;
 let out=c.map(v=>c01(v*(PAPER_LO+pp*PAPER_HI)));
 if(lv==='full'){const L=c[0]*LR+c[1]*LG+c[2]*LB,Ln=clamp(L/S.ref,0,1);const e0=Math.pow(.03,S.gamma);let Lt=clamp((Math.pow(Ln+.03,S.gamma)-e0)/(Math.pow(1.03,S.gamma)-e0),0,1);/* 검정 근처 기울기를 눌러 어두운 곳이 툭 튀지 않게 */
  Lt=clamp(Lt+(pp-.5)*S.grain*2*(1-Math.abs(Lt-.5)*1.2),0,1);Lt=Lt+(.62-Lt)*S.haze;Lt=S.floor+(S.ceil-S.floor)*Lt;
  const ramp=[0,1,2].map(i=>Lt<.5?S.ink[i]+(S.mid[i]-S.ink[i])*(Lt/.5):S.mid[i]+(S.pap[i]-S.mid[i])*((Lt-.5)/.5)),Lr=ramp[0]*LR+ramp[1]*LG+ramp[2]*LB;
  const mx=Math.max(c[0],c[1],c[2]),mn=Math.min(c[0],c[1],c[2]),s=(mx-mn)/(mx+1e-4);
  const warm=clamp((c[0]-c[2])*5,0,1)*clamp((s-.4)*4,0,1)*clamp((Ln-.3)*3,0,1)*S.accent;
  out=[0,1,2].map(i=>{const col=c01(c[i]/(L+.12)*Lr)*S.tint[i],o=ramp[i]+(col-ramp[i])*S.keep,glow=c01(c[i]*1.2)*.85+ramp[i]*.15;return c01(o+(glow-o)*warm);});}
 return [0,1,2].map(i=>c01(c[i]+(out[i]-c[i])*k));}
// 셰이더 유니폼 값(모두 유한한 수)
function uniformsFor(style){const S=styleOf(style),f=v=>num(+v,0);return {ink:S.ink.map(f),mid:S.mid.map(f),pap:S.pap.map(f),tint:S.tint.map(f),a:[S.gamma,S.keep,S.floor,S.ceil].map(f),b:[S.line,S.grain,S.haze,S.border].map(f),c:[S.accent,S.ref].map(f)};}

const GLSL=`uniform float r1055K;uniform float r1055Lv;uniform vec2 r1055Res;
uniform vec3 r1055SI;uniform vec3 r1055SM;uniform vec3 r1055SP;uniform vec3 r1055ST;uniform vec4 r1055SA;uniform vec4 r1055SB;uniform vec2 r1055SC;
float r1055H(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float r1055N(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(r1055H(i),r1055H(i+vec2(1.,0.)),f.x),mix(r1055H(i+vec2(0.,1.)),r1055H(i+vec2(1.,1.)),f.x),f.y);}
vec3 r1055Wash(vec3 r1055c){
 float k=clamp(r1055K,0.,1.);if(k<=.001)return r1055c;
 vec3 c=clamp(r1055c,0.,1.);vec2 res=max(r1055Res,vec2(1.));vec2 fc=gl_FragCoord.xy*(720./res.y);
 float pp=clamp(r1055N(fc*.006)*.6+r1055N(fc*.017)*.4,0.,1.);
 vec2 uv=gl_FragCoord.xy/res;float d=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y))*2.;
 float bm=1.-clamp((d+(r1055N(vec2(fc.x*.006,fc.y*.05))-.5)*.16+(r1055N(fc*.008)-.5)*.22-.02)/.34,0.,1.);bm=bm*bm*(3.-2.*bm)*clamp(r1055SB.w,0.,1.)*.8;
 vec3 ink=clamp(r1055SI,0.,1.);
 vec3 o=mix(clamp(c*(${PAPER_LO}+pp*${PAPER_HI}),0.,1.),ink,bm*.4);
 if(r1055Lv>.5){
  float L=dot(c,vec3(${LR},${LG},${LB}));float Lq=clamp(L+dFdx(L)*(.5-mod(floor(gl_FragCoord.x),2.))+dFdy(L)*(.5-mod(floor(gl_FragCoord.y),2.)),0.,1.);/* 이웃 2×2 평균 밝기: 어두운 곳을 띄울 때 잔무늬가 같이 커지지 않게 */float Ln=clamp(Lq/max(r1055SC.y,.05),0.,1.);float g=clamp(r1055SA.x,.2,2.);float e0=pow(.03,g);float Lt=clamp((pow(Ln+.03,g)-e0)/(pow(1.03,g)-e0),0.,1.);
  Lt=clamp(Lt+(pp-.5)*clamp(r1055SB.y,0.,.04)*2.*(1.-abs(Lt-.5)*1.2),0.,1.);Lt=mix(Lt,.62,clamp(r1055SB.z,0.,1.));
  Lt=mix(clamp(r1055SA.z,0.,1.),clamp(r1055SA.w,0.,1.),Lt);
  vec3 mid=clamp(r1055SM,0.,1.);vec3 ramp=Lt<.5?mix(ink,mid,Lt/.5):mix(mid,clamp(r1055SP,0.,1.),(Lt-.5)/.5);
  vec3 col=clamp(c/(L+.12)*dot(ramp,vec3(${LR},${LG},${LB})),0.,1.)*r1055ST;
  o=mix(ramp,col,clamp(r1055SA.y,0.,1.));
  float mx=max(c.r,max(c.g,c.b));float mn=min(c.r,min(c.g,c.b));float s=(mx-mn)/(mx+1e-4);
  float warm=clamp((c.r-c.b)*5.,0.,1.)*clamp((s-.4)*4.,0.,1.)*clamp((Ln-.3)*3.,0.,1.)*clamp(r1055SC.x,0.,1.);
  o=mix(o,clamp(c*1.2,0.,1.)*.85+ramp*.15,warm);
  float lg=log(L+.02);float e=length(vec2(dFdx(lg),dFdy(lg)));e=smoothstep(.3,1.1,e);
  o=mix(o,ink,clamp(e*r1055SB.x,0.,.6)*(1.-warm));
  o=mix(o,ink,bm);}
 return clamp(mix(c,o,k),0.,1.);}
`;
const CALL='\n#define r1055Ink(c) r1055Wash(c)\ngl_FragColor.rgb=r1055Ink(gl_FragColor.rgb);\n',A_LIGHT='gl_FragColor.rgb*=r451Light();',A_CS='#include <colorspace_fragment>';
let U=null;
const vec=(T,n,a)=>{const C=n===2?T?.Vector2:n===3?T?.Vector3:T?.Vector4;if(C)return new C(...a);const o={x:a[0],y:a[1],z:a[2],w:a[3],set(...v){this.x=v[0];this.y=v[1];this.z=v[2];this.w=v[3];return this;}};return o;};
function uniforms(T){if(U)return U;const u=uniformsFor(prefs.style);
 U={r1055K:{value:0},r1055Lv:{value:1},r1055Res:{value:vec(T,2,[1280,720])},r1055SI:{value:vec(T,3,u.ink)},r1055SM:{value:vec(T,3,u.mid)},r1055SP:{value:vec(T,3,u.pap)},r1055ST:{value:vec(T,3,u.tint)},
  r1055SA:{value:vec(T,4,u.a)},r1055SB:{value:vec(T,4,u.b)},r1055SC:{value:vec(T,2,u.c)}};return U;}
function applyStyle(){try{if(!U)return;const u=uniformsFor(prefs.style);U.r1055SI.value.set(...u.ink);U.r1055SM.value.set(...u.mid);U.r1055SP.value.set(...u.pap);U.r1055ST.value.set(...u.tint);U.r1055SA.value.set(...u.a);U.r1055SB.value.set(...u.b);U.r1055SC.value.set(...u.c);}catch(e){fail(e);}}
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
const text=()=>'수묵화풍 테스트 · '+LABEL[prefs.mode],styleText=()=>'화풍 · '+STYLES[prefs.style].label;
function label(){try{const b=document.getElementById('inkTestR1055');if(b){b.textContent=text();b.dataset.mode=prefs.mode;}const s=document.getElementById('inkStyleR1055');if(s){s.textContent=styleText();s.dataset.style=prefs.style;}}catch(e){fail(e);}}
function titleButton(){try{const panel=document.getElementById('panel'),normal=document.getElementById('campaignNew54')||document.getElementById('newBtn');
  if(!panel||!normal||document.getElementById('inkTestR1055'))return;const host=normal.parentNode||panel;
  const b=document.createElement('button');b.id='inkTestR1055';b.type='button';b.textContent=text();b.dataset.mode=prefs.mode;
  b.title='테스트본: 맵을 수묵화풍으로 그립니다. 누를 때마다 꺼짐 → 동양 지역만(잠들지 못하는 마을·한약과 불면귀) → 모든 지역 → 꺼짐. 캐릭터·UI 는 그대로입니다.';
  b.onclick=()=>{set({mode:MODES[(MODES.indexOf(prefs.mode)+1)%MODES.length]});b.textContent=text();b.dataset.mode=prefs.mode;};
  const s=document.createElement('button');s.id='inkStyleR1055';s.type='button';s.textContent=styleText();s.dataset.style=prefs.style;
  s.title='수묵화풍 테스트의 화풍을 바꿉니다: 진경산수풍 → 담채풍 → 송대 산수풍 → 스미에풍 → 수채 애니풍.';
  s.onclick=()=>{set({style:STYLE_IDS[(STYLE_IDS.indexOf(prefs.style)+1)%STYLE_IDS.length]});s.textContent=styleText();s.dataset.style=prefs.style;};
  host.appendChild(b);host.appendChild(s);stats.titleButtons++;}catch(e){fail(e);}}
try{if(typeof showTitle==='function'){const base=showTitle;showTitle=function(...a){const r=base.apply(this,a);titleButton();return r;};}}catch(e){fail(e);}
titleButton();

function dispose(){disposed=true;try{clearInterval(timer);}catch(_){}try{if(U)U.r1055K.value=0;}catch(_){}K=0;}
window.__STORYWORLD_INK_WASH_R1055__=Object.freeze({revision:REV,storageKey:KEY,modes:MODES,zones:ZONES,styles:STYLES,GLSL,uniformsFor,prefs:()=>({...prefs}),set,wants,level,tone,inject,titleButton,
 inspect:()=>({revision:REV,prefs:{...prefs},k:K,level:U?(U.r1055Lv.value>.5?'full':'paper'):null,stats:{...stats},lastError}),dispose});
})();
