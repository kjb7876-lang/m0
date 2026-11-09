// R420: 보기 편의(77분야 실플레이 점검 2026-11-08) — 기본 화면은 그대로 두고 고를 수 있는 것만 더한다.
//  ① 화면 밝기(감마 대용) 슬라이더 70~160%: 게임 화면(#stage)에만 CSS brightness. 100% 이면 filter 를 비워 비용 0.
//     공포 게임 관행(밝기 맞춤 화면) — 어두운 모니터·밝은 방에서도 몹과 바닥이 보이게. 기본값은 지금 그대로(100%).
//  ② 글자 크기: 기본 / 크게 / 아주 크게. 머리띠·아래 HUD·나침반의 9~11px 글자를 1.25 / 1.45배(최소 12 / 13px)로.
//     기본은 그대로. 캔버스에 그리는 글자(몹 이름 등)는 건드리지 않는다.
//  ③ 지역에 들어온 직후 영웅이 포탈 위에 서 있으면 포탈 이름표('이전 시작점 · …')가 영웅 몸을 가렸다 →
//     이름표가 영웅 몸 상자와 겹칠 때만 38% 로 옅게 그린다(글은 남김). 터치 기기에서는 'C · 이동' 대신 '버튼 · 이동'.
//  ④ 모바일 나침반 '길잡이 ON · 탭: 끄기' 가 '끄/기' 로 갈라지던 줄바꿈을 막는다.
//  ⑤ 전투 집중 HUD(PC, 사용자 2026-11-08 "전투에 집중, HUD 를 줄여 호러 분위기는 유지"): 기본 켬.
//     머리띠 64→44px(부제 줄 숨김, 보스 체력 띠는 안 옅게), 게임 화면을 아래 HUD 뒤까지 넓히고(720p 기준 504→676px),
//     아래 HUD·알림 띠는 위가 투명해지는 검은 그라데이션으로. 근처에 살아 있는 적이 있으면
//     머리띠와 HUD 의 부수 글(경험치·성장·EGO 문구)을 옅게 해 전투만 남긴다(마우스를 올리면 다시 또렷).
//     밝기·색은 그대로(어둠 유지). 모바일(터치)·좁은 화면은 원래 배치를 쓴다.
// 그림 자산·충돌·피해·저장·서사·맵 순서는 그대로. 게임 ctx.filter 를 쓰지 않는다(CSS filter 는 #stage 요소에만).
(()=>{'use strict';
if(window.__STORYWORLD_ACCESS_R420__)return;
const REV='R420-access-7',KEY='storyworld.r420.access';
const DEF=Object.freeze({bright:100,text:'base',focus:true});
const TEXT_SCALE=Object.freeze({base:null,large:{k:1.25,min:12},xl:{k:1.45,min:13}});
const TEXT_KO=Object.freeze({base:'기본',large:'크게',xl:'아주 크게'});
const stats={errors:0,lastError:null,labelsFaded:0,textScaled:0};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,160);};
let prefs={...DEF};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(Number.isFinite(+s.bright))prefs.bright=Math.max(70,Math.min(160,Math.round(+s.bright)));if(TEXT_SCALE.hasOwnProperty(s.text))prefs.text=s.text;if(typeof s.focus==='boolean')prefs.focus=s.focus;}}catch(_){}
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
// R421: 터치 기기 아래 안내 줄(#hint)·작은 지도 글(#miniLabel)의 'C를 눌러 이동'·'C · …' → '버튼을 눌러 이동'·'버튼 · …' (키보드 없는 폰에서 C 는 없는 키)
function touchText(t){const k=(typeof KR291==='object'&&KR291&&KR291.i)||'C';let n=String(t);n=n.split(k+'를 눌러').join('버튼을 눌러');if(n.startsWith(k+' · '))n='버튼 · '+n.slice(k.length+3);n=n.split('에서 '+k+' · ').join('에서 버튼 · ');return n;}
function fixHint(){if(!coarse()||typeof document==='undefined')return;for(const id of ['hint','miniLabel']){const el=document.getElementById(id);if(!el)continue;const t=el.textContent||'',n=touchText(t);if(n!==t){el.textContent=n;stats.hintsFixed=(stats.hintsFixed||0)+1;}}}
function wrapHud(){if(typeof updateHUD!=='function'||updateHUD.__r420)return;const base=updateHUD;const w=function(...a){const r=base.apply(this,a);try{fixHint();}catch(e){fail(e);}return r;};w.__r420=true;updateHUD=w;}

// ⑤ 전투 집중 HUD --------------------------------------------------------------------------
const FOCUS_MQ='(min-width:781px) and (pointer:fine)';
const focusOn=()=>{try{return prefs.focus&&matchMedia(FOCUS_MQ).matches;}catch(_){return false;}};
let focusWas=null,combatWas=false;
function applyFocus(){try{const on=focusOn();const b=document.body;if(!b)return;
 if(on!==focusWas){focusWas=on;b.classList.toggle('r420-focus',on);if(!on)b.classList.remove('r420-combat');
  try{if(typeof resize==='function')resize();}catch(e){fail(e);}try{dispatchEvent(new Event('resize'));}catch(_){}}
 if(!on)return;let fight=false;
 try{if(typeof room!=='undefined'&&room&&Array.isArray(room.enemies)&&typeof player!=='undefined'&&player&&!(typeof modal!=='undefined'&&modal)){for(const e of room.enemies){if(!(e&&e.hp>0)||e.hero||e.ally)continue;if(Math.hypot(e.x-player.x,e.y-player.y)<8.5){fight=true;break;}}}}catch(e){fail(e);}
 if(fight!==combatWas){combatWas=fight;b.classList.toggle('r420-combat',fight);stats.combatToggles=(stats.combatToggles||0)+1;}}catch(e){fail(e);}}
const FOCUS_CSS='@media '+FOCUS_MQ+'{'
 +'body.r420-focus{--notice-space-r63r2:30px}'
 +'@media (min-height:681px){body.r420-focus{--top:44px}body.r420-focus header{height:44px!important}}'+'body.r420-focus header #bossbar{padding-top:2px!important;padding-bottom:3px!important}body.r420-focus header #bossbar #bossTitle{margin-bottom:1px!important;line-height:1.1!important}'
 +'body.r420-focus #stage{bottom:0!important}'
 +'body.r420-focus header .brand small,body.r420-focus #regionSub{display:none!important}'
 +'html body.r420-focus header{background:linear-gradient(#06090df2,#06090dd9)!important;border-bottom:1px solid #3a332a!important;box-shadow:0 6px 14px #0008!important}'
 +'html body.r420-focus footer{background:linear-gradient(#06090d00,#06090db8 30%,#06090df0 70%)!important;border-top:0!important;box-shadow:none!important}'
 +'body.r420-focus #noticeShelfR63R2{background:none!important;border-top:0!important;box-shadow:none!important;text-shadow:0 1px 3px #000,0 0 6px #000}'
 +'body.r420-focus header>*,body.r420-focus #xpText,body.r420-focus #buildText,body.r420-focus #awakeText,body.r420-focus #noticeShelfR63R2{transition:opacity .45s ease}'
 +'body.r420-focus.r420-combat header:not(:hover)>*:not(#bossbar):not(nav){opacity:.32}'
 +'body.r420-focus.r420-combat #xpText,body.r420-focus.r420-combat #buildText,body.r420-focus.r420-combat #awakeText,body.r420-focus.r420-combat #noticeShelfR63R2{opacity:.35}'
 /* R441: 스킬 칸 글자(키·이름)도 싸울 때 옅게 하지 않음 — 쿨타임만 표시 */
 +'body.r420-focus #r177Doc{transition:opacity .45s ease}body.r420-focus.r420-combat #r177Doc:not(:hover){opacity:.4}'/* R421: 싸우는 동안 오른쪽 쪽지·기억 조각 종이(R177)가 화면 1/4 을 가리지 않게 옅게 — 마우스를 올리면 다시 또렷 */
 +'}';

// ④ CSS + 설정 창 ----------------------------------------------------------------------------
function css(){if(document.getElementById('accessR420Css'))return;const s=document.createElement('style');s.id='accessR420Css';
 s.textContent='@media (pointer:coarse){#navCompassR100 .guideR101{white-space:nowrap;max-width:none}}'
  +'@media (min-width:1100px){html body #r177Doc{top:118px;right:118px;max-height:min(52vh,calc(100vh - 236px))}html body #r177Doc.r182pages{max-height:calc(100vh - 236px)}html body #r177Doc.r182pages .pg{max-height:calc(100vh - 302px)}}'/* R432: PC 에서 오른쪽 쪽지·기억 조각 종이(R177, 오른쪽 14px·위 110px)가 나침반·길잡이 글(오른쪽 끝에서 14~106px)과 작은 지도 칸을 덮던 것 → 나침반 왼쪽으로 비킴(곡 소개 쪽지 아래 118px부터). 아래 HUD(높이 114) 위에서 끝나게 쪽 나눔 종이(R182) 높이도 맞춤 — 정본·사몽 서사 1,309쪽 높이 최대 386px, 1280×720 에서 쪽 칸 418px 라 다 들어감. 나침반 아래로 내리는 안은 같은 화면에서 쪽 칸이 300px 라 10% 쪽이 잘려 버림 */
  +'@media (max-width:780px){html body #r331BgmNote{top:calc(132px + env(safe-area-inset-top,0px))!important;max-width:min(60vw,250px)!important;font-size:11px!important;line-height:1.45!important;padding:4px 10px!important}}'/* R432: 폰에서 곡 소개 쪽지(R313)가 7초 동안 위 '황금실' 단추를 덮던 것 → 단추 줄 아래로 */
  +'html body #r183 .cap{word-break:keep-all;text-wrap:balance;padding:8px 26px 10px;background:radial-gradient(closest-side,#000000b0,#00000070 60%,#0000);border-radius:40px}'/* R421: 3D 체험 자막 — 낱말 단위로 고르게 줄바꿈('다.' 한 글자 줄 없애기)·글 뒤에 옅은 어둠(장면 밝기는 그대로) */
 +'#accessR420 .r420-row{display:flex;align-items:center;gap:.5em;flex-wrap:wrap;margin:.25em 0}'
 +'#accessR420 input[type=range]{accent-color:#b08a4e;width:180px}#accessR420 .r420-val{min-width:3.2em;color:#e6d3a8}'
 +'#accessR420 .r420-hint{font-size:12px;color:#a99d86;margin:.1em 0 .4em}'+FOCUS_CSS;
 document.head.appendChild(s);}
function sectionHTML(){return'<section id="accessR420"><div class="r420-row"><label for="r420Bright">화면 밝기</label><input type="range" id="r420Bright" min="70" max="160" step="5" value="'+prefs.bright+'" aria-label="화면 밝기"><span class="r420-val" id="r420BrightVal">'+prefs.bright+'%</span><button type="button" data-r420-bright-reset>100%</button></div>'
 +'<p class="r420-hint">어두운 장면에서 바닥 무늬가 겨우 보이고 검은색은 검게 남을 만큼 맞추세요. 기본 100%.</p>'
 +'<div class="r420-row" role="radiogroup" aria-label="글자 크기">글자 크기 '+Object.keys(TEXT_SCALE).map(k=>'<button type="button" data-r420-text="'+k+'" aria-pressed="'+(prefs.text===k)+'" class="'+(prefs.text===k?'active':'')+'">'+TEXT_KO[k]+'</button>').join(' ')+'</div>'
 +'<label class="r420-row"><input type="checkbox" id="r420Focus" '+(prefs.focus?'checked':'')+'> 전투 집중 HUD(PC: 머리띠 얇게·게임 화면 넓게·전투 중 부수 글 옅게)</label></section>';}
function inject(){try{const panel=document.getElementById('panel');if(!panel||panel.querySelector('#accessR420'))return!!panel?.querySelector('#accessR420');
 const anchor=panel.querySelector('#quickSettingsR114 .r114-volumes')||panel.querySelector('#quickSettingsR114');if(!anchor)return false;
 const box=document.createElement('div');box.innerHTML=sectionHTML();const sec=box.firstElementChild;
 if(anchor.classList.contains('r114-volumes'))anchor.parentNode.insertBefore(sec,anchor);else anchor.appendChild(sec);
 const r=sec.querySelector('#r420Bright'),val=sec.querySelector('#r420BrightVal');
 const set=v=>{prefs.bright=Math.max(70,Math.min(160,Math.round(+v)||100));r.value=prefs.bright;val.textContent=prefs.bright+'%';applyBright();save();};
 r.addEventListener('input',()=>set(r.value));sec.querySelector('[data-r420-bright-reset]').onclick=ev=>{ev.preventDefault();set(100);};
 for(const b of sec.querySelectorAll('[data-r420-text]'))b.onclick=ev=>{ev.preventDefault();prefs.text=b.dataset.r420Text;save();for(const o of sec.querySelectorAll('[data-r420-text]')){const on=o===b;o.classList.toggle('active',on);o.setAttribute('aria-pressed',String(on));}applyText();};
 const f=sec.querySelector('#r420Focus');if(f)f.onchange=()=>{prefs.focus=!!f.checked;save();applyFocus();};
 return true;}catch(e){fail(e);return true;}}
if(typeof openPanel==='function'){const opBase=openPanel;openPanel=function(html,...a){const res=opBase.call(this,html,...a);
 try{if(typeof html==='string'&&/설정/.test(html)){let n=0;const tryIt=()=>{if(!inject()&&++n<20)requestAnimationFrame(tryIt);};tryIt();}}catch(e){fail(e);}return res;};}

css();applyBright();wrapExits();wrapHud();fixHint();applyFocus();setInterval(applyFocus,250);
setInterval(()=>{wrapExits();wrapHud();if(prefs.text!=='base')applyText();},1000);
window.__STORYWORLD_ACCESS_R420__=Object.freeze({revision:REV,touchText,prefs:()=>({...prefs}),set(p){if(p&&typeof p==='object'){if(Number.isFinite(+p.bright))prefs.bright=Math.max(70,Math.min(160,Math.round(+p.bright)));if(TEXT_SCALE.hasOwnProperty(p.text))prefs.text=p.text;if(typeof p.focus==='boolean')prefs.focus=p.focus;save();applyBright();applyText();applyFocus();}return{...prefs};},stats:()=>({...stats,scaled:scaled.size})});
})();
