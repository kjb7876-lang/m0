// R1095 — 이펙트 수묵 색. 사용자 2026-11-16 "앞으로 계속 스킬추가될거니까 기본적인 이펙트들만 수묵화버전으로 연지색+묵,백색 섞어서 스킬 이펙트 기존에 있는거에 색변화 콜라보해서 적절하게 생성개선적용".
//  · 새 그림을 그리지 않는다. 이미 있는 스킬 이펙트(시트·절차 그림·선·채움)의 색만 세 가지 먹빛 팔레트로 옮긴다: 연지·주홍(붉은 주홍) + 먹 + 백.
//      색이 있는 부분 → 연지(어두운 쪽)~주홍(밝은 쪽), 흰 심지·옅은 빛 → 백, 어두운 연기·먼지(덮어 그리는 것) → 먹.
//  · 하는 법(R1090 캐릭터 담묵과 같은 길): 렌더러가 받는 프레임 명령 가운데 '이펙트' 명령만 골라
//      그림은 style.filter 뒤에 색 필터(hue-rotate·saturate·grayscale·brightness·contrast — Three 기록기가 색 행렬로 계산, 추가 패스 없음)를 덧붙이고,
//      선·채움·그라디언트는 색 문자열을 tone() 으로 바꾼다. 그림 원본·자산은 그대로다.
//  · 공통 함수라 새 스킬도 따로 손대지 않아도 같은 팔레트를 따른다. 예외는 register(정규식,'keep'|'white'|'ink'|'red',{hue,chroma,lum}) 로 등록한다.
//  · 건드리지 않는 것: 예고 표시(hazard)·탄·적 표식·보스 패턴·피해 숫자·그림자·영웅/몹 몸과 잔상·소품·UI·EGO 전용 이펙트. 전투 신호 색은 그대로다.
//  · 맵 수묵화풍(R1055)이 꺼져 있거나 쉬는 성능 단계(k=0)면 같이 쉬어 원래 색으로 돈다. 설정 창 '전투 화면' 구역의 '이펙트 수묵 색' 체크로 따로 끌 수 있다(저장 storyworld.r1095.inkFx = '0' 이면 끔).
//  판정·피해·AI·저장·서사는 바꾸지 않는다(색만).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_INK_FX_R1095__)return;
const REV='R1095-fx-ink-1',KEY='storyworld.r1095.inkFx';
const PALETTE=Object.freeze({yeonji:'#b3322e',juhong:'#de4a2c',ink:'#12161c',white:'#f3eee2'});
const hex3=h=>{const n=parseInt(h.slice(1),16);return [n>>16,(n>>8)&255,n&255];};
const YEONJI=hex3(PALETTE.yeonji),JUHONG=hex3(PALETTE.juhong),INK=hex3(PALETTE.ink),WHITE=hex3(PALETTE.white);
const stats={frames:0,tinted:0,errors:0,rows:0,sampled:0,deferred:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const clamp=(v,a,b)=>v<a?a:v>b?b:v,fin=Number.isFinite;
const num=(v,d)=>fin(v)?v:d;
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
// 맵 수묵화풍이 실제로 켜져 있는가(R1055 의 지금 세기 k). 0.5초에 한 번 본다.
let inkLive=false;
function refresh(){let live=false;try{const A=window.__STORYWORLD_INK_WASH_R1055__;if(A&&typeof A.inspect==='function'){const i=A.inspect();live=!!i&&i.prefs?.mode!=='off'&&fin(i.k)&&i.k>.5;}}catch(_){live=false;}inkLive=live;return live;}
const active=()=>on&&inkLive;
function set(v){if(typeof v!=='boolean')return on;on=v;try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'0');}catch(_){}label();return on;}
// ---- 색 계산 ----
const LUM=(r,g,b)=>(.213*r+.715*g+.072*b)/255;
function hsv(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d>1e-9){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}return {h,c:mx>0?d/mx:0};}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
// 밝기 → 먹 … 연지 … 주홍 … 백 (색이 있는 부분)
function redRamp(L){if(L<.30)return mix(INK,YEONJI,L/.30);if(L<.58)return mix(YEONJI,JUHONG,(L-.30)/.28);return mix(JUHONG,WHITE,(L-.58)/.57);}
// 공통 색 함수(숫자): 어떤 색이든 팔레트 안의 색으로. 값이 이상하면 null.
function toneRGB(r,g,b){if(!fin(r)||!fin(g)||!fin(b))return null;r=clamp(r,0,255);g=clamp(g,0,255);b=clamp(b,0,255);
 const L=LUM(r,g,b),c=hsv(r,g,b).c,grey=mix(INK,WHITE,L);
 const w=clamp((c-.45)/.08,0,1),o=w<=0?grey:mix(grey,redRamp(L),w);
 return [Math.round(clamp(o[0],0,255)),Math.round(clamp(o[1],0,255)),Math.round(clamp(o[2],0,255))];}
const NUM='([-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?)';
const RGBA=new RegExp('^rgba?\\(\\s*'+NUM+'\\s*,\\s*'+NUM+'\\s*,\\s*'+NUM+'\\s*(?:,\\s*'+NUM+'\\s*)?\\)$','i');
function parseCss(s){let m=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
 if(m){let h=m[1];if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];const n=parseInt(h,16);return [n>>16,(n>>8)&255,n&255,1];}
 m=RGBA.exec(s);if(!m)return null;const a=m[4]===undefined?1:+m[4],v=[+m[1],+m[2],+m[3],a];return v.every(fin)?v:null;}
const toneCache=new Map();
// 공통 색 함수(CSS 문자열): #rgb·#rrggbb·rgb()·rgba() 를 팔레트 색으로, 알파는 그대로. 모르는 값은 손대지 않고 돌려준다.
function tone(css){if(typeof css!=='string')return css;const hit=toneCache.get(css);if(hit!==undefined)return hit;
 let out=css;try{const p=parseCss(css.trim());if(p){const o=toneRGB(p[0],p[1],p[2]);if(o)out='rgba('+o[0]+','+o[1]+','+o[2]+','+(+clamp(p[3],0,1).toFixed(4))+')';}}catch(e){fail(e);out=css;}
 if(toneCache.size>600)toneCache.clear();toneCache.set(css,out);return out;}
// phase1 filterMatrix 의 hue-rotate 와 같은 식(색상 돌리기 결과를 미리 계산해 알맞은 각을 고른다)
function rot(deg,v){const t=deg*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
 return [(.213+.787*c-.213*s)*v[0]+(.715-.715*c-.715*s)*v[1]+(.072-.072*c+.928*s)*v[2],(.213-.213*c+.143*s)*v[0]+(.715+.285*c+.140*s)*v[1]+(.072-.072*c-.283*s)*v[2],(.213-.213*c-.787*s)*v[0]+(.715-.715*c+.715*s)*v[1]+(.072+.928*c+.072*s)*v[2]];}
const clip=v=>[clamp(v[0],0,1),clamp(v[1],0,1),clamp(v[2],0,1)];
const hueDist=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d;};
function rep(h,c){const x=1-Math.abs((h/60)%2-1),t=[[1,x,0],[x,1,0],[0,1,x],[0,x,1],[x,0,1],[1,0,x]][Math.floor(h/60)%6];return [1-c+c*t[0],1-c+c*t[1],1-c+c*t[2]];}
const F_UNKNOWN='saturate(.45)',F_WHITE='saturate(.3)',F_WHITE_FORCED='saturate(.12) brightness(1.06)',F_INK='grayscale(1) brightness(.62) contrast(1.1)';
const filterCache=new Map();
// 그림용 필터: 시트의 대표 색상(hue 0~360)·채도(chroma 0~1)·밝기(lum 0~1)·혼합 방식 → 필터 문자열. role 로 강제할 수 있다.
function filterFor(info){const i=info&&typeof info==='object'?info:{};const role=i.role;
 if(role==='white')return F_WHITE_FORCED;if(role==='ink')return F_INK;
 if(!fin(i.hue)||!fin(i.chroma))return F_UNKNOWN;
 const hue=((i.hue%360)+360)%360,chroma=clamp(i.chroma,0,1),lum=clamp(num(i.lum,.6),0,1),over=!i.blend||i.blend==='source-over';
 // 맑은 색만 붉게 옮긴다. 탁한 색(채도 .48 아래 — 적의 부패·병색 계열)은 채도를 빼 먹빛·백으로 둔다(art-style 10절: 적과 영웅을 색으로 가른다)
 if(role!=='red'){if(over&&lum<.5&&chroma<.45)return F_INK;if(chroma<.48)return F_WHITE;}
 const key=Math.round(hue/5)+'|'+Math.round(chroma*5)+'|'+Math.round(lum*4);const hit=filterCache.get(key);if(hit)return hit;
 // 가는 곳: 밝고 맑은 색(영웅의 빛) → 따뜻한 주홍(약 16도), 어두운 핏빛(적의 위협) → 차가운 연지(약 354도)
 // 밝은 색(금빛 등)은 그대로 돌리면 분홍이 된다 → 주홍의 밝기(약 .4)까지 먼저 낮춘 뒤 색상을 돌리고 채도를 올린다(빛을 더하는 그림이 회색 바닥 위에서도 붉게 읽히게)
 const dim=lum>.42?clamp(.42/lum,.4,1):1,target=(354+22*clamp((lum-.25)/.3,0,1))%360,r0=rep(hue,clamp(chroma,.5,.9)),l0=Math.max(.02,.213*r0[0]+.715*r0[1]+.072*r0[2]),k=Math.min(1,lum*dim/l0),src=[r0[0]*k,r0[1]*k,r0[2]*k];let best=0,bestScore=Infinity,bestC=0;
 for(let d=-180;d<180;d+=4){const o=clip(rot(d,src)),q=hsv(o[0],o[1],o[2]);const score=(q.c<.08?90:hueDist(q.h,target))+Math.abs(d)*.01;if(score<bestScore){bestScore=score;best=d;bestC=q.c;}}
 const sat=bestC<.85?clamp(.95/Math.max(bestC,.2),1,1.9):1;
 // 채도를 올린 뒤 가장 밝은 채널이 원래 그림의 가장 밝은 채널만큼 되게 다시 밝힌다(빛의 세기는 지키고 색만 주홍으로)
 const sv=v=>{const l=.213*v[0]+.715*v[1]+.072*v[2];return [l+(v[0]-l)*sat,l+(v[1]-l)*sat,l+(v[2]-l)*sat];},o2=clip(sv(rot(best,src))),peak=Math.max(o2[0],o2[1],o2[2],.05),orig=Math.min(1,Math.max(src[0],src[1],src[2])/Math.max(dim,.01));
 const lift=clamp(orig/peak,1,1.8);
 const out=(dim<.995?'brightness('+(+dim.toFixed(2))+') ':'')+(best!==0?'hue-rotate('+best+'deg) ':'')+'saturate('+(+sat.toFixed(2))+')'+(lift>1.02?' brightness('+(+lift.toFixed(2))+')':'');
 if(filterCache.size>400)filterCache.clear();filterCache.set(key,out);return out;}
// ---- 시트의 대표 색 알아내기 ----
// ① 절차 그림 키에 색이 적혀 있다(r106fx:glow:255.198.72:214.222.234, r108eden:smoke#214,222,234|255,198,72)
const TRIPLE=/(?:^|[^\d.])(\d{1,3})[.,](\d{1,3})[.,](\d{1,3})(?![\d])/;
const FILEPATH=/\/|\.(?:webp|png|jpe?g|gif|avif)(?:[?#]|$)/i;
function infoFromRGB(r,g,b){const q=hsv(r,g,b);return {hue:q.h,chroma:q.c,lum:LUM(r,g,b)};}
function infoFromKey(path){if(FILEPATH.test(path))return null;const m=TRIPLE.exec(path);if(!m)return null;const r=+m[1],g=+m[2],b=+m[3];if(r>255||g>255||b>255)return null;return infoFromRGB(r,g,b);}
// ② 그림을 16×16 으로 줄여 색 있는 화소의 평균 색상을 잰다(시트마다 한 번, 한 프레임에 몇 장까지만)
let probe=null,probeCtx=null,budget=0;const SAMPLE=16,PER_FRAME=6;
function sample(img){try{if(typeof document==='undefined')return null;
  if(!probe){const c=document.createElement('canvas');if(!c||typeof c.getContext!=='function')return null;c.width=SAMPLE;c.height=SAMPLE;probe=c;probeCtx=c.getContext('2d',{willReadFrequently:true});}
  if(!probeCtx)return null;probeCtx.clearRect(0,0,SAMPLE,SAMPLE);probeCtx.drawImage(img,0,0,SAMPLE,SAMPLE);const d=probeCtx.getImageData(0,0,SAMPLE,SAMPLE).data;
  let sx=0,sy=0,sw=0,sc=0,sl=0,sa=0;
  for(let i=0;i<d.length;i+=4){const a=d[i+3]/255;if(a<.04)continue;const r=d[i],g=d[i+1],b=d[i+2],v=Math.max(r,g,b)/255;if(v<.06)continue;const q=hsv(r,g,b),w=a*v,wc=w*q.c,t=q.h*Math.PI/180;
   sx+=Math.cos(t)*wc;sy+=Math.sin(t)*wc;sw+=wc;sc+=q.c*w;sl+=LUM(r,g,b)*w;sa+=w;}
  stats.sampled++;if(sa<.02)return null;let h=Math.atan2(sy,sx)*180/Math.PI;if(h<0)h+=360;
  const out={hue:sw>1e-6?h:0,chroma:sc/sa,lum:sl/sa};return fin(out.hue)&&fin(out.chroma)&&fin(out.lum)?out:null;}catch(e){return null;}}
const infoByPath=new Map(),infoByImage=new WeakMap();
// 돌려주는 값: 정보 객체, null(색을 모름), undefined(이번 프레임은 재기 예산이 없어 다음에)
function infoOf(c,path){if(path){const hit=infoByPath.get(path);if(hit!==undefined)return hit;}
 let info=path?infoFromKey(path):null;
 if(!info){const img=c.image;if(img&&typeof img==='object'){const h=infoByImage.get(img);if(h!==undefined)info=h;else{if(budget<=0){stats.deferred++;return undefined;}budget--;info=sample(img);infoByImage.set(img,info);}}}
 if(path){if(infoByPath.size>900)infoByPath.clear();infoByPath.set(path,info);}return info;}
// ---- 예외 등록 ----
const ROLES=['keep','white','ink','red'],rules=[];
function register(test,role,info){if(!(test instanceof RegExp)&&!(test&&typeof test.test==='function'&&typeof test.source==='string'))return rules.length;if(!ROLES.includes(role))return rules.length;
 const i=info&&typeof info==='object'?{hue:num(info.hue,NaN),chroma:num(info.chroma,NaN),lum:num(info.lum,NaN)}:null;rules.push({test,role,info:i});infoByPath.clear();return rules.length;}
function ruleFor(path,id){for(let i=rules.length-1;i>=0;i--){const r=rules[i];r.test.lastIndex=0;if(path&&r.test.test(path))return r;r.test.lastIndex=0;if(id&&r.test.test(id))return r;}return null;}
// ---- 고르기 ----
// 적·보스 쪽 신호와 전투 표식(낱말 경계 — 'outdoor' 안의 'door' 같은 일을 피한다)
const SIGNAL_ID=/(?:^|[^a-z])(?:boss|pat|pattern|field|meteor|hex|nav|rank|warn|warning|telegraph|danger|hazard|aim|shadow|enemy|mob)(?:[^a-z]|$)/i;
const SIGNAL_PREFIX=/^r(?:105|241|431|434|1040|1042)[:\-]/;
const EGO=/(?:^|[^a-z])ego(?:[^a-z]|$)/i,EGO_PREFIX=/^r(?:1039|1046|1048|1057|1094)[:\-]/;
const BODY_PATH=/hero-authored|hero-actions|actions-v\d|[-\/](?:walk|action|idle|body|attack)-atlas|-(?:move|walk|idle|run)-(?:left|right|up|down|front|back)\b|\/props?\/|portrait/i;
// 이펙트 시트 폴더(vfx/·fx/·effects/·pixelfx/) 아래 그림은 이름에 heroes 같은 낱말이 있어도 이펙트다
const FX_DIR=/(?:^|\/)(?:vfx|fx|effects?|pixelfx)\//i;
// 몸으로 그려진 적 있는 그림 경로(프레임을 넘어 기억 — 잔상은 지난 동작의 시트를 쓴다)
const bodySeen=new Set();
const GHOST=/^r(?:350|448):ghost:/;
const assetKey=p=>{const i=p.indexOf('assets/');return i>=0?p.slice(i):p;};
function wanted(c){const o=c.owner;if(!o||o.kind!=='effect')return false;
 if(o.enemy===true||o.r434||o.r329Shadow||o.r350||o.ownerType==='enemy'||o.pxfSide==='enemy'||o.r105Pattern||o.r105Meteor||o.r105Field||o.r431)return false;
 if(typeof c.key==='string'&&GHOST.test(c.key))return false;
 const id=typeof o.id==='string'?o.id:'';if(id&&(SIGNAL_ID.test(id)||SIGNAL_PREFIX.test(id)||EGO.test(id)||EGO_PREFIX.test(id)))return false;
 const path=typeof c.sourcePath==='string'?c.sourcePath:'',op=typeof o.sourcePath==='string'?o.sourcePath:'';
 if(EGO.test(path)||EGO.test(op))return false;
 if(path&&!FX_DIR.test(path)&&(BODY_PATH.test(path)||bodySeen.has(assetKey(path))))return false;
 return true;}
function toneGradient(g){if(!g||typeof g!=='object'||!Array.isArray(g.stops))return g;let changed=false;
 const stops=g.stops.map(s=>{if(!s||typeof s!=='object'||typeof s.color!=='string')return s;const t=tone(s.color);if(t===s.color)return s;changed=true;return {...s,color:t};});
 return changed?{...g,stops}:g;}
function process(commands){if(!active()||!Array.isArray(commands))return 0;let n=0;budget=PER_FRAME;
 // 영웅·몹 몸 그림 경로(잔상은 이펙트 명령이지만 몸과 같은 그림을 쓴다 → 색을 바꾸지 않는다)
 for(let i=0;i<commands.length;i++){const c=commands[i],o=c&&c.owner;if(!o||(o.kind!=='hero'&&o.kind!=='enemy'))continue;
  if(bodySeen.size>800)bodySeen.clear();if(typeof o.bodyPath==='string'&&o.bodyPath)bodySeen.add(assetKey(o.bodyPath));if(c.kind==='image'&&typeof c.sourcePath==='string'&&c.sourcePath)bodySeen.add(assetKey(c.sourcePath));}
 for(let i=0;i<commands.length;i++){const c=commands[i];if(!c||typeof c!=='object'||c.r1095)continue;
  const kind=c.kind;if(kind!=='image'&&kind!=='fill'&&kind!=='stroke')continue;
  const s=c.style;if(!s||typeof s!=='object')continue;
  if(!wanted(c))continue;
  const path=typeof c.sourcePath==='string'?c.sourcePath:'',rule=rules.length?ruleFor(path,typeof c.owner.id==='string'?c.owner.id:''):null;
  if(rule&&rule.role==='keep')continue;
  if(kind==='image'){const blend=s.globalCompositeOperation||'source-over';let f;
   if(rule&&(rule.role==='white'||rule.role==='ink'))f=filterFor({role:rule.role});
   else{const info=rule&&rule.info&&fin(rule.info.hue)?rule.info:infoOf(c,path);if(info===undefined)continue;
    f=filterFor(info?{hue:info.hue,chroma:num(info.chroma,.8),lum:num(info.lum,.6),blend,role:rule?rule.role:undefined}:null);}
   const prev=typeof s.filter==='string'&&s.filter&&s.filter!=='none'?s.filter+' ':'';
   c.style={...s,filter:prev+f};c.r1095=true;n++;continue;}
  const prop=kind==='stroke'?'strokeStyle':'fillStyle',v=s[prop];let nv=v;
  if(rule&&(rule.role==='white'||rule.role==='ink')){if(typeof v==='string'){const p=parseCss(v.trim());if(p){const L=LUM(clamp(p[0],0,255),clamp(p[1],0,255),clamp(p[2],0,255)),o=rule.role==='white'?mix(JUHONG,WHITE,clamp(.6+L*.4,0,1)):mix(INK,WHITE,L*.35);nv='rgba('+Math.round(o[0])+','+Math.round(o[1])+','+Math.round(o[2])+','+(+clamp(p[3],0,1).toFixed(4))+')';}}}
  else if(typeof v==='string')nv=tone(v);else nv=toneGradient(v);
  if(nv===v)continue;
  c.style={...s,[prop]:nv};c.r1095=true;n++;}
 stats.tinted+=n;return n;}
// ---- 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번만) ----
let depth=0;
const wrapFn=fn=>{if(fn.__r1095)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands)){stats.frames++;process(frame.commands);}}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1095=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
function tick(){wrapInst();refresh();}
try{setInterval(tick,500);}catch(e){fail(e);}tick();
// ---- 설정 창 줄: '전투 화면' 구역, 캐릭터 담묵 줄 바로 뒤(없으면 맵 수묵화풍 줄 뒤) ----
function label(){try{const b=document.getElementById('inkFxOnR1095');if(b)b.checked=on;}catch(e){fail(e);}}
function settingsRow(){try{const host=document.getElementById('combatScreenR1021')||document.getElementById('quickSettingsR114');if(!host)return;
  let row=document.getElementById('inkFxRowR1095');
  if(!row){row=document.createElement('div');row.id='inkFxRowR1095';row.className='r1021-row';
   const lab=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.id='inkFxOnR1095';
   const txt=document.createElement('span');txt.textContent=' 이펙트 수묵 색 ';
   const note=document.createElement('p');note.className='small muted';note.textContent='스킬 이펙트를 연지·주홍과 먹, 백색으로 그립니다. 맵 수묵화풍이 켜져 있을 때만 작동하고, 예고 표시·탄·적 표식 색은 그대로입니다.';
   box.onchange=()=>{set(!!box.checked);};
   lab.appendChild(box);lab.appendChild(txt);row.appendChild(lab);row.appendChild(note);stats.rows++;}
  const kids=host.children,chars=document.getElementById('inkCharsRowR1090'),ink=document.getElementById('inkRowR1055');
  const anchor=chars&&chars.parentNode===host?chars:ink&&ink.parentNode===host?ink:null;
  const others=Array.prototype.filter.call(kids,k=>k!==row),want=anchor?others.indexOf(anchor)+1:-1;
  if(row.parentNode!==host||(want>=0&&Array.prototype.indexOf.call(kids,row)!==want)){
   const next=want>=0?others[want]:null;
   if(next&&typeof host.insertBefore==='function')host.insertBefore(row,next);
   else{host.appendChild(row);if(want>=0&&Array.isArray(host.children)){const a=host.children,i=a.indexOf(row);if(i>=0&&i!==want){a.splice(i,1);a.splice(Math.min(want,a.length),0,row);}}}}
  label();}catch(e){fail(e);}}
function settingsLater(){settingsRow();try{queueMicrotask(settingsRow);}catch(_){}try{requestAnimationFrame(()=>{settingsRow();requestAnimationFrame(settingsRow);});}catch(_){}}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsLater();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_INK_FX_R1095__=Object.freeze({revision:REV,storageKey:KEY,palette:PALETTE,tone,toneRGB,filterFor,register,process,active,refresh,enabled:()=>on,set,settingsRow,
 inspect:()=>({revision:REV,on,inkLive,active:active(),frames:stats.frames,tinted:stats.tinted,errors:stats.errors,rows:stats.rows,sampled:stats.sampled,deferred:stats.deferred,rules:rules.length,sheets:infoByPath.size,lastError})});
})();
