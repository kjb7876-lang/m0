// R1043 성능 7단계 + 설정 정리(사용자 2026-11-15 "설정안 기능 전수조사해서 지금안쓰는거 삭제 및 같이 묶어도 되는거 묶고
//  간이설정에 성능최적화 7단계로 해서 지금최하보다 더렉개선된거랑 완전풀옵션추가 하면서 전반적인 렉개선 디버깅").
//  간이설정 맨 위 '성능 단계' 한 줄이 그동안 따로 있던 네 줄(R114 그래픽 품질·R150 렉 줄이기·R1023 그래픽 단계·간소화 VFX)을 대신한다.
//   1 초저   : 지금 최저(낮음)보다 가볍게 — R1023 낮음 + R150 가벼운 화면 켬 + 화면 배율 0.75 + 빛·안개(R300)·날씨(R450)·국지 조명(R451)·빛 맞춤(R453) 끔
//   2 낮음   : 지금 최저 = 휴대폰 공개본(R1023 낮음: lowFx·배율 1·50만 화소 이상 그림 절반)
//   3 보통   : R1023 보통(200만 화소 이상만 절반)
//   4 높음   : R1023 높음(lowFx 끔, 배율 ≤1.25)
//   5 PC급   : 지금 PC 기본(배율 ≤1.5, 절반 없음)
//   6 고화질 : PC급 + 배율 1.75(1배 화면에서도 더 촘촘히 그려 줄임), 가벼운 화면 자동 끔
//   7 풀옵션 : PC급 + 배율 2 + 빛·안개·날씨·국지 조명·빛 맞춤 모두 켬, 가벼운 화면 끔
//  휴대폰 기본은 '자동'(R1023 자동 그대로: 시작은 2단계와 같고 넉넉하면 5단계까지) — 꺼짐(#572) 위험 때문에 지금 수준을 최저 기본으로 둔다.
//   휴대폰 6·7단계 배율은 기기 배율을 넘지 않는다. PC 기본(한 번도 안 고름)은 아무것도 바꾸지 않는다(지금 그대로).
//  1·7단계에서 바꾼 빛·날씨 켜기는 그 단계를 떠나면 사람이 정해 둔 값으로 되돌린다. 저장 storyworld.r1043.perf7 {step,held}.
//  설정 정리(표시만, 기능·기본값은 그대로): 겹치던 성능 줄 4개를 숨기고, 전투 중 바라보기 5개·잡몹 움직임 3개를 한 칸씩으로 묶고,
//   빛·안개·날씨·조명·영웅 그림 맞춤 구역을 '그래픽 세부' 접기 하나로 모으고, 개발용 칸(판정 진단·음성 준비 비교·서사 미확정 보스)을 숨긴다.
//  판정·피해·저장·그림 원본·세 모드 공통 코드는 그대로다. 끄기: localStorage['storyworld.r1043.perf7']='{"off":true}'(설정 정리·단계 모두 끔).
(()=>{'use strict';
if(window.__STORYWORLD_PERF7_R1043__)return;
const REV='R1043-perf7-2-R1052',KEY='storyworld.r1043.perf7';
const NAMES=['','초저','낮음','보통','높음','PC급','고화질','풀옵션'];
const TIER=['','low','low','mid','high','pc','pc','pc'],LITE=['','on','auto','auto','auto','auto','off','off'];
const MODS={r300:'__STORYWORLD_LIGHT_ATMOS_R300__',r450:'__STORYWORLD_WEATHER_R450__',r451:'__STORYWORLD_LOCAL_LIGHT_R451__',r453:'__STORYWORLD_ACTOR_TONE_R453__'};
const stats={applies:0,resizes:0,settingsBuilt:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,240);};
function mobile(){try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}}
function norm(v){if(v==='auto')return 'auto';if(v==null||v==='')return null;const n=typeof v==='number'?v:typeof v==='string'&&/^\s*-?\d+(\.\d+)?\s*$/.test(v)?Number(v):NaN;
 if(!Number.isFinite(n))return null;return Math.max(1,Math.min(7,Math.round(n)));}
function plan(step,o={}){const s=norm(step),mob=!!o.mobile,dev=Number.isFinite(o.dev)&&o.dev>0?o.dev:1;
 if(s==null||s==='auto')return {step:s==null?null:'auto',r1023:'auto',lite:'auto',dpr:null,lowFx:null,force:null};
 const cap=v=>mob?Math.min(Math.max(1,dev),v):v;
 const want=s===1?.75:s===6?cap(1.75):s===7?cap(2):null;const dpr=s>=6?fit(want,o.W,o.H,mob,dev):want;
 const force=s===1?{r300:false,r450:false,r451:false,r453:false}:s===7?{r300:true,r450:true,r451:true,r453:true}:null;
 return {step:s,r1023:TIER[s],lite:LITE[s],dpr,want,lowFx:s>=6?false:null,force};}
// R1052(사용자 11-15 10:02Z "최고사양 버그없는지 확인… 7품질설정 디버깅개선 최적화"): 6·7단계 화소 예산.
//  창이 크면(2560×1440 → 7단계 5120×2880, 1,470만 화소) 그리기·메모리만 늘고 보이는 이득이 없다 → 캔버스가 4K(829만 화소)를 넘지 않게 배율을 줄인다.
//  다만 5단계(엔진 기본 배율 min(기기 배율, 1.5)·휴대폰 1.25)보다 낮아지면 null(= 엔진 배율 그대로)로 둔다. 창 크기를 모르면 원래 값.
const PX_BUDGET=3840*2160;
function fit(d,w,h,mob,dev){if(d==null)return d;w=+w;h=+h;if(!(Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0))return d;
 const lim=Math.sqrt(PX_BUDGET/(w*h));if(d<=lim)return d;const v=Math.floor(lim*100)/100,floor=Math.min(dev,mob?1.25:1.5);return v>floor?v:null;}
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_){saved={};}
if(typeof saved!=='object')saved={};
const off=saved.off===true;
let chosen=norm(saved.step);/* null = 한 번도 안 고름(기본) */
let held=saved.held&&typeof saved.held==='object'?saved.held:null;
const defaultStep=()=>mobile()?'auto':5;
const step=()=>chosen==null?defaultStep():chosen;
function save(){try{localStorage.setItem(KEY,JSON.stringify({step:chosen,held}));}catch(_){}}
function devRatio(){try{return Number.isFinite(devicePixelRatio)&&devicePixelRatio>0?devicePixelRatio:1;}catch(_){return 1;}}
let cur=plan(null);
// ---- 화면 배율: 엔진·R1023 resize 뒤에 단계 배율을 얹는다 ----
function applyDpr(){try{if(!cur.want)return;if(typeof dpr==='undefined'||typeof canvas==='undefined'||!canvas)return;
 const f=cur.step>=6?fit(cur.want,W,H,mobile(),devRatio()):cur.want;cur.dpr=f;if(!f)return;/* R1052: 창 크기가 바뀔 때마다 화소 예산을 다시 본다 */
 const d=Math.max(.5,Math.min(3,f));const w=Math.round(W*d),h=Math.round(H*d);if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1)return;
 if(dpr!==d||canvas.width!==w||canvas.height!==h){dpr=d;canvas.width=w;canvas.height=h;stats.resizes++;}}catch(e){fail(e);}}
let resizeWrapped=false;
function wrapResize(){if(resizeWrapped||typeof resize!=='function')return;const base=resize;
 const w=function(){const r=base.apply(this,arguments);applyDpr();return r;};try{resize=w;resizeWrapped=resize===w;}catch(e){fail(e);}}
function api(k){try{return window[MODS[k]]||null;}catch(_){return null;}}
function applyForce(){try{const f=cur.force;
 if(f){if(!held){held={};for(const k in MODS){const A=api(k);if(A?.prefs)held[k]=A.prefs().on!==false;}}for(const k in f){const A=api(k);if(A?.set)A.set({on:f[k]});}}
 else if(held){for(const k in held){const A=api(k);if(A?.set&&typeof held[k]==='boolean')A.set({on:held[k]});}held=null;}}catch(e){fail(e);}}
function apply(){if(off)return;stats.applies++;cur=plan(step(),{mobile:mobile(),dev:devRatio(),W:typeof W!=='undefined'?W:null,H:typeof H!=='undefined'?H:null});
 try{const T=window.__STORYWORLD_MOBILE_TIER_R1023__;if(T?.setPref)T.setPref(cur.r1023);}catch(e){fail(e);}
 try{const P=window.__STORYWORLD_PERF_R150__;if(P?.set)P.set({lite:cur.lite});}catch(e){fail(e);}
 applyForce();
 try{if(cur.lowFx===false&&typeof settings!=='undefined'&&settings)settings.lowFx=false;}catch(e){fail(e);}
 try{if(typeof resize==='function')resize();else applyDpr();}catch(e){fail(e);}
 save();rowRefresh();}
function setStep(v){const s=norm(v);if(s==null)return step();if(s==='auto'&&!mobile())chosen=5;else chosen=s;apply();return step();}

// ---- 설정 창 ----
const HIDE='r1043Hidden';
function css(){if(document.getElementById('perf7R1043Css'))return;const s=document.createElement('style');s.id='perf7R1043Css';
 s.textContent='.'+HIDE+'{display:none!important}#perf7RowR1043{display:flex;flex-wrap:wrap;gap:.3em;align-items:center;margin:.35em 0}'
 +'#perf7RowR1043 button{min-width:2.6em}#perf7RowR1043 .r1043-now{opacity:.8;font-size:.88em;flex-basis:100%}'
 +'#gfxDetailR1043{margin:.3em 0;border:1px solid #3b3128;border-radius:8px;padding:.2em .5em}#gfxDetailR1043>summary{cursor:pointer}';document.head.appendChild(s);}
const DESC=['','가장 가볍게(화면 0.75배·빛·날씨 끔)','지금 휴대폰 기본','큰 그림만 줄임','효과 켬·배율 1.25','지금 PC 기본','배율 1.75·촘촘히','배율 2·모든 빛·날씨 켬(고사양)'];
function rowRefresh(){try{const row=document.getElementById('perf7RowR1043');if(!row)return;const s=step();
 row.querySelectorAll('[data-r1043-step]').forEach(b=>{const on=String(s)===b.dataset.r1043Step;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 const n=row.querySelector('.r1043-now');if(n){let t=s==='auto'?'자동: 기기 상태에 맞춰 2~5단계':s+'단계 '+NAMES[s]+' — '+DESC[s];
  try{const T=window.__STORYWORLD_MOBILE_TIER_R1023__;if(s==='auto'&&T?.inspect){const i=T.inspect();t+=' (지금 '+(i.tier+2)+'단계)';}}catch(_){}n.textContent=t;}}catch(e){fail(e);}}
const byKey=(q,s)=>[...q.querySelectorAll(s)];
function labelOf(el){return el?.closest?.('label')||el;}
function hide(el){if(el&&el.classList)el.classList.add(HIDE);}
// 같은 일을 하는 칸 여럿 → 한 칸. 묶음 칸을 바꾸면 숨긴 칸을 하나씩 같은 값으로 누른다(각 모듈의 원래 저장·적용 그대로).
const GROUPS=[{id:'faceAllR1043',label:'전투 중 서로 바라보기(영웅·몹 마주봄, 공격 뒤 겨눈 적 바라보기)',sel:['#r98c-facing','#r100-facing','[data-r114-api="p113"][data-r114-key="facing"]','[data-r114-api="p111"][data-r114-key="facing"]','#r111-facing','[data-r137="faceAlways"]']},
 {id:'mobMotionR1043',label:'잡몹 움직임(이동·공격·돌기·비행·피격 동작)',sel:['#r92-mobMotion','#r98c-mobMotion','#r101-motion']}];
// R1043b(사용자 11-15 04:02Z 허락): 병원 테스트(병원 바로 시작·검사 기록) 구역도 숨긴다 — 기능·저장은 그대로, 설정 창에서만 안 보임.
const DEV_HIDE=['#hitboxToggle','#voicePreroll','#r92-narrativeUnconfirmed','#hospitalTestSettingsR84'];
// R1124: R111 구역(#r111-키)과 R114 '전투·연출' 묶음이 같은 설정(play-r111 prefs)을 두 번 보여 줬다 → R111 구역이 있을 때만 R114 사본을 숨긴다(저장·기본값 그대로).
const dupR111=panel=>{for(const el of panel.querySelectorAll('[data-r114-api="p111"][data-r114-key]'))if(panel.querySelector('#r111-'+el.dataset.r114Key))hide(labelOf(el));};
const GFX_SECTIONS=['#lightAtmosR300','#weatherR450','#localLightR451','#actorToneR453','#heroHarmonyR1030'];
function build(){try{if(off)return;const panel=document.getElementById('panel');const quick=document.getElementById('quickSettingsR114');if(!panel||!quick)return;css();
 // ① 성능 7단계 줄
 if(!document.getElementById('perf7RowR1043')){const row=document.createElement('div');row.id='perf7RowR1043';row.className='r114-row';row.setAttribute('role','radiogroup');row.setAttribute('aria-label','성능 단계');
  const keys=(mobile()?['auto']:[]).concat([1,2,3,4,5,6,7]);
  row.innerHTML='<span>성능 단계</span> '+keys.map(k=>'<button type="button" data-r1043-step="'+k+'" aria-pressed="false" title="'+(k==='auto'?'자동':k+'단계 '+NAMES[k]+' — '+DESC[k])+'">'+(k==='auto'?'자동':k+' '+NAMES[k])+'</button>').join('')+'<span class="r1043-now"></span>';
  const h=quick.querySelector(':scope>h3');if(h)h.after(row);else quick.prepend(row);
  row.querySelectorAll('[data-r1043-step]').forEach(b=>b.onclick=()=>setStep(b.dataset.r1043Step));stats.settingsBuilt++;}
 // ② 겹치던 성능 줄 숨기기(기능은 이 줄이 대신 몬다)
 const pre=panel.querySelector('[data-r114-preset]');if(pre)hide(pre.closest('.r114-row'));
 hide(document.getElementById('mobileTierRowR1023'));
 byKey(panel,'[data-r150-lite]').forEach(hide);const pr=document.getElementById('perfRowR150');if(pr)for(const t of pr.childNodes)if(t.nodeType===3&&/렉 줄이기/.test(t.textContent))t.textContent='';
 hide(labelOf(panel.querySelector('[data-setting="lowFx"]')));hide(labelOf(panel.querySelector('[data-r118="perf"]')));
 // ③ 그래픽 세부 모으기
 let det=document.getElementById('gfxDetailR1043');if(!det){det=document.createElement('details');det.id='gfxDetailR1043';det.innerHTML='<summary>그래픽 세부 (빛·안개·날씨·조명·영웅 그림 맞춤)</summary>';const anchor=document.getElementById('perfRowR150')||document.getElementById('perf7RowR1043');anchor.after(det);}
 for(const s of GFX_SECTIONS){const el=panel.querySelector(s);if(el&&el.parentNode!==det)det.appendChild(el);}
 // ④ 묶기
 for(const g of GROUPS){const els=g.sel.map(s=>panel.querySelector(s)).filter(Boolean);if(els.length<2||document.getElementById(g.id))continue;
  const first=labelOf(els[0]);const lab=document.createElement('label');lab.innerHTML='<input type="checkbox" id="'+g.id+'"> '+g.label;first.before(lab);
  const box=lab.querySelector('input');box.checked=els.every(e=>e.checked);box.indeterminate=!box.checked&&els.some(e=>e.checked);
  box.onchange=()=>{for(const e of g.sel.map(s=>panel.querySelector(s)).filter(Boolean))if(e.checked!==box.checked)e.click();};els.forEach(e=>hide(labelOf(e)));}
 dupR111(panel);
 // ⑤ 개발용 칸 숨기기
 for(const s of DEV_HIDE)hide(labelOf(panel.querySelector(s)));
 // 숨긴 칸만 남은 세부설정 묶음(예: 협동·테스트)은 묶음째 숨긴다.
 for(const g of panel.querySelectorAll('details.r114-group')){const live=[...g.querySelectorAll('input,select,button')].some(e=>!e.closest('.'+HIDE));if(!live)hide(g);}
 rowRefresh();}catch(e){fail(e);}}
function later(){build();try{queueMicrotask(build);}catch(_){}try{requestAnimationFrame(()=>{build();requestAnimationFrame(build);});}catch(_){}}
// 설정 창 감싸기는 스크립트를 읽을 때 바로 한다(휴대폰에서는 load 뒤에 감싼 것이 사라져 R1023 줄도 안 보였다 — 정리는 다음 틱에 하므로 순서는 상관없다).
try{if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{later();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function start(){try{wrapResize();if(!off&&chosen!=null)apply();}catch(e){fail(e);}}
// R1023 은 load 때 시작하므로 그 뒤에 적용한다(같은 load 이벤트, 나중에 등록).
if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
window.__STORYWORLD_PERF7_R1043__=Object.freeze({revision:REV,storageKey:KEY,names:NAMES.slice(1),norm,plan,step,setStep,build,
 inspect:()=>({revision:REV,off,step:step(),chosen,held:held?{...held}:null,plan:{...cur},mobile:mobile(),stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false})});
})();
