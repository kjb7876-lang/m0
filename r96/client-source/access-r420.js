// R420: 보기 편의(77분야 실플레이 점검 2026-11-08) — 기본 화면은 그대로 두고 고를 수 있는 것만 더한다.
//  ① 화면 밝기(감마 대용) 슬라이더 70~160%: 게임 화면(#stage)에만 CSS brightness. 100% 이면 filter 를 비워 비용 0.
//     공포 게임 관행(밝기 맞춤 화면) — 어두운 모니터·밝은 방에서도 몹과 바닥이 보이게. 기본값은 지금 그대로(100%).
//  ② 글자 크기: 기본 / 크게 / 아주 크게. 머리띠·아래 HUD·나침반의 9~11px 글자를 1.25 / 1.45배(최소 12 / 13px)로.
//     기본은 그대로. 캔버스에 그리는 글자(몹 이름 등)는 건드리지 않는다.
//  ③ 지역에 들어온 직후 영웅이 포탈 위에 서 있으면 포탈 이름표('이전 시작점 · …')가 영웅 몸을 가렸다 →
//     이름표가 영웅 몸 상자와 겹칠 때만 38% 로 옅게 그린다(글은 남김). 터치 기기에서는 'C · 이동' 대신 '버튼 · 이동'.
//  ④ 모바일 나침반 '길잡이 ON · 탭: 끄기' 가 '끄/기' 로 갈라지던 줄바꿈을 막는다.
// 그림 자산·충돌·피해·저장·서사·맵 순서는 그대로. 게임 ctx.filter 를 쓰지 않는다(CSS filter 는 #stage 요소에만).
(()=>{'use strict';
if(window.__STORYWORLD_ACCESS_R420__)return;
const REV='R420-access-1',KEY='storyworld.r420.access';
const DEF=Object.freeze({bright:100,text:'base'});
const TEXT_SCALE=Object.freeze({base:null,large:{k:1.25,min:12},xl:{k:1.45,min:13}});
const TEXT_KO=Object.freeze({base:'기본',large:'크게',xl:'아주 크게'});
const stats={errors:0,lastError:null,labelsFaded:0,textScaled:0};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,160);};
let prefs={...DEF};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(Number.isFinite(+s.bright))prefs.bright=Math.max(70,Math.min(160,Math.round(+s.bright)));if(TEXT_SCALE.hasOwnProperty(s.text))prefs.text=s.text;}}catch(_){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const coarse=()=>{try{return matchMedia('(pointer:coarse)').matches;}catch(_){return false;}};

// ① 밝기 -------------------------------------------------------------------------------------
function applyBright(){try{const st=document.getElementById('stage');if(!st)return;const v=prefs.bright;st.style.filter=v===100?'':'brightness('+(v/100).toFixed(2)+')';}catch(e){fail(e);}}

// ② 글자 크기 --------------------------------------------------------------------------------
const ROOTS='header, footer, #navCompassR100, #minipanel, #quest';
const orig=new WeakMap();let scaled=new Set();
function applyText(){try{const cfg=TEXT_SCALE[prefs.text];
 if(!cfg){for(const el of scaled){const o=orig.get(el);if(o!==undefined&&o!==null)el.style.fontSize=o;delete el.dataset.r420Want;}scaled=new Set();return;}
 for(const root of document.querySelectorAll(ROOTS))for(const el of root.querySelectorAll('*')){
  if(!el.firstChild||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
  if(!orig.has(el)){const fs=parseFloat(getComputedStyle(el).fontSize);if(!(fs>0)||fs>=12){orig.set(el,null);continue;}orig.set(el,el.style.fontSize||'');el.dataset.r420Base=String(fs);}
  if(orig.get(el)===null)continue;const base=+el.dataset.r420Base,want=Math.max(cfg.min,Math.round(base*cfg.k*10)/10)+'px';
  if(el.dataset.r420Want!==want){el.dataset.r420Want=want;el.style.fontSize=want;scaled.add(el);stats.textScaled++;
   // 칸이 좁아 잘리면(…) 들어갈 때까지 0.5px 씩 줄인다(원래 크기 아래로는 안 내려감).
   for(let fs=parseFloat(want);fs>base&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+1;fs-=.5)el.style.fontSize=Math.max(base,fs-.5)+'px';}}
}catch(e){fail(e);}}

// ③ 포탈 이름표 ------------------------------------------------------------------------------
const LABEL=/^(이전 시작점|다음 기억) · /,MOVE=/ · 이동$/;
function wrapExits(){if(typeof drawExits!=='function'||drawExits.__r420)return;const base=drawExits;
 const wrapped=function(...a){let q,h;try{if(typeof player==='undefined'||!player||typeof project!=='function'||typeof ctx==='undefined'||!ctx)return base.apply(this,a);q=project(player.x,player.y);h=typeof actorHeight==='function'?actorHeight():66;}catch(e){fail(e);return base.apply(this,a);}
  const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'fillText'),ft=c.fillText,touch=coarse();
  const box={x0:q.x-h*.5,x1:q.x+h*.5,y0:q.y-h*1.08,y1:q.y+h*.22};
  c.fillText=function(t,x,y,...r){try{const s=String(t);if(LABEL.test(s)||MOVE.test(s)){let text=s;if(touch&&typeof KR291==='object'&&s===KR291.i+' · 이동')text='버튼 · 이동';
    const w=(typeof this.measureText==='function'?this.measureText(text).width:text.length*9)/2;
    if(x+w>box.x0&&x-w<box.x1&&y>box.y0&&y-11<box.y1){const ga=this.globalAlpha;this.globalAlpha=ga*.38;stats.labelsFaded++;try{return ft.call(this,text,x,y,...r);}finally{this.globalAlpha=ga;}}
    if(text!==s)return ft.call(this,text,x,y,...r);}}catch(e){fail(e);}return ft.call(this,t,x,y,...r);};
  try{return base.apply(this,a);}finally{if(own)c.fillText=ft;else delete c.fillText;}};
 wrapped.__r420=true;drawExits=wrapped;}

// ④ CSS + 설정 창 ----------------------------------------------------------------------------
function css(){if(document.getElementById('accessR420Css'))return;const s=document.createElement('style');s.id='accessR420Css';
 s.textContent='@media (pointer:coarse){#navCompassR100 .guideR101{white-space:nowrap;max-width:none}}'
 +'#accessR420 .r420-row{display:flex;align-items:center;gap:.5em;flex-wrap:wrap;margin:.25em 0}'
 +'#accessR420 input[type=range]{accent-color:#b08a4e;width:180px}#accessR420 .r420-val{min-width:3.2em;color:#e6d3a8}'
 +'#accessR420 .r420-hint{font-size:12px;color:#a99d86;margin:.1em 0 .4em}';
 document.head.appendChild(s);}
function sectionHTML(){return'<section id="accessR420"><div class="r420-row"><label for="r420Bright">화면 밝기</label><input type="range" id="r420Bright" min="70" max="160" step="5" value="'+prefs.bright+'" aria-label="화면 밝기"><span class="r420-val" id="r420BrightVal">'+prefs.bright+'%</span><button type="button" data-r420-bright-reset>100%</button></div>'
 +'<p class="r420-hint">어두운 장면에서 바닥 무늬가 겨우 보이고 검은색은 검게 남을 만큼 맞추세요. 기본 100%.</p>'
 +'<div class="r420-row" role="radiogroup" aria-label="글자 크기">글자 크기 '+Object.keys(TEXT_SCALE).map(k=>'<button type="button" data-r420-text="'+k+'" aria-pressed="'+(prefs.text===k)+'" class="'+(prefs.text===k?'active':'')+'">'+TEXT_KO[k]+'</button>').join(' ')+'</div></section>';}
function inject(){try{const panel=document.getElementById('panel');if(!panel||panel.querySelector('#accessR420'))return!!panel?.querySelector('#accessR420');
 const anchor=panel.querySelector('#quickSettingsR114 .r114-volumes')||panel.querySelector('#quickSettingsR114');if(!anchor)return false;
 const box=document.createElement('div');box.innerHTML=sectionHTML();const sec=box.firstElementChild;
 if(anchor.classList.contains('r114-volumes'))anchor.parentNode.insertBefore(sec,anchor);else anchor.appendChild(sec);
 const r=sec.querySelector('#r420Bright'),val=sec.querySelector('#r420BrightVal');
 const set=v=>{prefs.bright=Math.max(70,Math.min(160,Math.round(+v)||100));r.value=prefs.bright;val.textContent=prefs.bright+'%';applyBright();save();};
 r.addEventListener('input',()=>set(r.value));sec.querySelector('[data-r420-bright-reset]').onclick=ev=>{ev.preventDefault();set(100);};
 for(const b of sec.querySelectorAll('[data-r420-text]'))b.onclick=ev=>{ev.preventDefault();prefs.text=b.dataset.r420Text;save();for(const o of sec.querySelectorAll('[data-r420-text]')){const on=o===b;o.classList.toggle('active',on);o.setAttribute('aria-pressed',String(on));}applyText();};
 return true;}catch(e){fail(e);return true;}}
if(typeof openPanel==='function'){const opBase=openPanel;openPanel=function(html,...a){const res=opBase.call(this,html,...a);
 try{if(typeof html==='string'&&/설정/.test(html)){let n=0;const tryIt=()=>{if(!inject()&&++n<20)requestAnimationFrame(tryIt);};tryIt();}}catch(e){fail(e);}return res;};}

css();applyBright();wrapExits();
setInterval(()=>{wrapExits();if(prefs.text!=='base')applyText();},1000);
window.__STORYWORLD_ACCESS_R420__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set(p){if(p&&typeof p==='object'){if(Number.isFinite(+p.bright))prefs.bright=Math.max(70,Math.min(160,Math.round(+p.bright)));if(TEXT_SCALE.hasOwnProperty(p.text))prefs.text=p.text;save();applyBright();applyText();}return{...prefs};},stats:()=>({...stats,scaled:scaled.size})});
})();
