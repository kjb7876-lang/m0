// R1285 — 작은 폰 가로 화면에서 사몽 페르소나 결전의 페르소나 몸이 체력 패널에 가리지 않게 한다.
// 외부 점검(아스트라 QA, #938 SW-0014): 812×375 에서 페르소나 상반신(머리·후드)이 위 보스 체력 패널(#bossbar) 밑으로 들어감.
//  · 대상: 가로 화면이고 높이 430px 이하 + 지금 방에 살아 있는 페르소나(e.persona) 결전일 때만. PC·세로·다른 결전은 그대로.
//  · 1) 여백: 보스 체력 패널을 한 줄 짜리로 줄인다(#bossSpell 둘째 줄 숨김, 위 여백·안쪽 여백 축소). 이름·체력 막대·숫자는 그대로.
//    엔진(모바일 HUD R63)은 지역 이름 띠(#mobileMapR74)를 보스 패널 아래 끝+6px 에 두므로, 줄이기 전 아래 끝으로 띠 자리를 고정한다
//    (안 그러면 띠가 나침반 위로 올라와 덮음). 금화 칸(R72)은 띠를 따라가므로 함께 그대로.
//  · 2) 그래도 겹치면: 페르소나 몸의 '보이는 화소' 상자가 패널(#bossbar·#heroCard)과 겹치는 동안만 그 패널을 반투명(.38)으로.
//    버튼·판정·카메라·몸 그림은 손대지 않는다(점검 권고: 버튼/판정 조정 없이 구도나 HUD 여백 먼저).
//  · 몸 상자: 최종 그림 명령(R1104·R1097·R1119 처리 뒤)에서 페르소나 몸 명령을 골라, 그림 알파(32 초과)를 8px 칸 단위로 한 번 읽어 둔 표로 잰다.
//    그림을 읽을 수 없으면(교차 출처 등) 명령 사각형 위·아래 18%·좌우 22% 를 덜어 낸 근사 상자를 쓴다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_HUD_R1285__)return;
const REV='R1285-persona-hud-clear-2',KEY='storyworld.r1285.personaHudClear';
const MAX_H=430,FADE=.38,EVERY=60,B=8;
const stats={frames:0,checks:0,tightOn:0,fades:0,profiles:0,fallbacks:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}if(!on)clear();return on;}
const CSS='html.r1285-tight #bossbar{top:max(3px,env(safe-area-inset-top,0px))!important;padding:2px 7px 3px!important}'+
 'html.r1285-tight #bossbar #bossSpell{display:none!important}'+
 'html.r1285-tight #bossbar #bossTitle{margin:0 0 1px!important;line-height:1.1!important}'+
 'html.r1285-tight.r1285-badge body.mobile-boss-r63 #mobileMapR74{top:var(--r1285-badge)!important}'+
 'html.r1285-tight #bossbar,html.r1285-tight #heroCard{transition:opacity .12s linear}'+
 'html.r1285-tight #bossbar.r1285-see,html.r1285-tight #heroCard.r1285-see{opacity:'+FADE+'!important}';
function style(){try{if(document.getElementById('r1285Style'))return;const s=document.createElement('style');s.id='r1285Style';s.textContent=CSS;(document.head||document.documentElement).appendChild(s);}catch(e){fail(e);}}
function small(){const w=window.innerWidth,h=window.innerHeight;return w>h&&h<=MAX_H;}
function persona(){try{const rm=typeof room!=='undefined'?room:null;const list=rm&&Array.isArray(rm.enemies)?rm.enemies:[];
 for(const e of list)if(e&&e.persona&&e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y))return e;}catch(_){}return null;}
// 그림 알파 표(8px 칸 × 행)
const prof=new WeakMap();
function profile(img){let pr=prof.get(img);if(pr!==undefined)return pr;pr=null;
 try{const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(w>0&&h>0&&w*h<=24e6){const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);const d=g.getImageData(0,0,w,h).data,nb=Math.ceil(w/B),m=new Uint8Array(nb*h);
  for(let y=0;y<h;y++){const row=y*w;for(let x=0;x<w;x++)if(d[(row+x)*4+3]>32)m[y*nb+(x/B|0)]=1;}pr={w,h,nb,m};stats.profiles++;}}catch(_){pr=null;}
 prof.set(img,pr);return pr;}
const L=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
function quadBox(P,u0,v0,u1,v1){const Q=(u,v)=>L(L(P[0],P[1],u),L(P[3],P[2],u),v),q=[Q(u0,v0),Q(u1,v0),Q(u1,v1),Q(u0,v1)];
 return [Math.min(...q.map(a=>a[0])),Math.min(...q.map(a=>a[1])),Math.max(...q.map(a=>a[0])),Math.max(...q.map(a=>a[1]))];}
function visible(c){const P=c.points;const pr=c.image&&typeof c.image==='object'?profile(c.image):null;
 if(!pr){stats.fallbacks++;return quadBox(P,.22,.18,.78,.82);}
 const sr=Array.isArray(c.sourceRect)&&c.sourceRect.length>=4&&c.sourceRect.every(Number.isFinite)?c.sourceRect:[0,0,pr.w,pr.h];const [sx,sy,sw,sh]=sr;if(!(sw>0&&sh>0))return null;
 const b0=Math.max(0,sx/B|0),b1=Math.min(pr.nb-1,(sx+sw-1)/B|0);let t=-1,bo=-1,l=1e9,r=-1;
 for(let y=Math.max(0,sy|0),ye=Math.min(pr.h,sy+sh);y<ye;y++){const base=y*pr.nb;for(let k=b0;k<=b1;k++)if(pr.m[base+k]){if(t<0)t=y;bo=y;if(k<l)l=k;if(k>r)r=k;}}
 if(t<0)return null;return quadBox(P,(Math.max(sx,l*B)-sx)/sw,(t-sy)/sh,(Math.min(sx+sw,(r+1)*B)-sx)/sw,(bo+1-sy)/sh);}
const okPt=p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
function isBody(c){if(!c||c.kind!=='image'||!Array.isArray(c.points)||c.points.length!==4||!c.points.every(okPt))return false;const sp=String(c.sourcePath||'');
 if(/glow/.test(sp))return false;if(c.owner&&c.owner.kind&&c.owner.kind!=='enemy')return false;
 return !!(c.r1104b||c.r1104Cast||/rc133\/art|r1097:ink|r1104b:|r1119:hit|r1119:death/.test(sp));}
function bodyBox(cmds){let box=null;for(const c of cmds){if(!isBody(c))continue;const v=visible(c);if(!v)continue;
 box=box?[Math.min(box[0],v[0]),Math.min(box[1],v[1]),Math.max(box[2],v[2]),Math.max(box[3],v[3])]:v;}return box;}
// 화면 좌표로(캔버스 좌표 W 기준)
function toScreen(b){try{const c=document.getElementById('game'),r=c&&c.getBoundingClientRect();const w=typeof W==='number'&&W>0?W:(c&&c.width)||1;if(!r||!(r.width>0))return null;
 const k=r.width/w;return [r.left+b[0]*k,r.top+b[1]*k,r.left+b[2]*k,r.top+b[3]*k];}catch(e){fail(e);return null;}}
const PANELS=['bossbar','heroCard'];
function fade(id,v){const el=document.getElementById(id);if(!el)return;if(el.classList.contains('r1285-see')!==v){el.classList.toggle('r1285-see',v);if(v)stats.fades++;}}
let tight=false;
let shrink=null; // 줄이기 전·후 보스 패널 아래 끝 차이(px). 패널이 보일 때 한 번 잰다.
function badgeHold(){try{const root=document.documentElement,bb=document.getElementById('bossbar'),st=document.getElementById('stage');
 if(!bb||!st||bb.classList.contains('hidden')){root.classList.remove('r1285-badge');return;}
 if(shrink==null){root.classList.remove('r1285-tight');const a=bb.getBoundingClientRect();root.classList.add('r1285-tight');const b=bb.getBoundingClientRect();
  if(!(a.height>0&&b.height>0))return;shrink=Math.max(0,a.bottom-b.bottom);stats.measured=shrink;}
 const r=bb.getBoundingClientRect();if(!(r.height>0))return;const top=Math.max(8,r.bottom+shrink-st.getBoundingClientRect().top+6);
 const v=Math.round(top)+'px';if(root.style.getPropertyValue('--r1285-badge')!==v)root.style.setProperty('--r1285-badge',v);root.classList.add('r1285-badge');}catch(e){fail(e);}}
function setTight(v){if(tight===v)return;tight=v;try{document.documentElement.classList.toggle('r1285-tight',v);if(v)stats.tightOn++;else{document.documentElement.classList.remove('r1285-badge');document.documentElement.style.removeProperty('--r1285-badge');}}catch(e){fail(e);}if(!v)for(const id of PANELS)fade(id,false);}
function clear(){setTight(false);}
let lastAt=0,lastBox=null;
function process(cmds){stats.frames++;if(!on){if(tight)clear();return;}
 const now=performance.now();if(now-lastAt<EVERY)return;lastAt=now;stats.checks++;
 const e=persona();if(!e||!small()){if(tight)clear();return;}
 style();setTight(true);badgeHold();
 const b=Array.isArray(cmds)?bodyBox(cmds):null,s=b&&toScreen(b);lastBox=s;
 for(const id of PANELS){const el=document.getElementById(id);if(!el||!s){fade(id,false);continue;}const r=el.getBoundingClientRect();
  // 몸이 패널에 닿기 전(14px 앞)부터 반투명 — 반투명으로 바뀌는 0.12초 동안에도 몸이 불투명 패널 밑에 들어가지 않게
  const pad=14;fade(id,r.width>0&&!(s[2]<=r.left-pad||s[0]>=r.right+pad||s[3]<=r.top-pad||s[1]>=r.bottom+pad));}}
// 렌더러 감싸기: 안쪽(R1104 등)이 명령을 다 바꾼 뒤 읽는다(perf-r97 인스턴스 복사 대비 프로토타입·인스턴스 둘 다, 한 render 에 한 번).
let depth=0;
const wrapFn=fn=>{if(fn.__r1285)return fn;const w=function(frame){depth++;let out;try{out=fn.apply(this,arguments);}finally{depth--;}
 if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(err){fail(err);}}return out;};w.__r1285=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
try{setInterval(wrapInst,500);}catch(e){fail(e);}wrapInst();
// 결전이 끝나거나 화면을 돌리면 렌더가 멈춰도 풀리게
try{setInterval(()=>{if(tight&&(!on||!persona()||!small()))clear();},500);window.addEventListener('resize',()=>{if(tight&&!small())clear();});}catch(e){fail(e);}
window.__STORYWORLD_PERSONA_HUD_R1285__=Object.freeze({revision:REV,storageKey:KEY,set,enabled:()=>on,process,small,visible,bodyBox,
 inspect:()=>({revision:REV,on,tight,lastBox,stats:{...stats},lastError})});
})();
