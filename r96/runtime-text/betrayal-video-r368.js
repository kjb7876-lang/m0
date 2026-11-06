// 자막은 영상 아래 검은 띠 위쪽(영상 높이 = min(100vh, 100vw×548/1280))에 둔다. 띠가 좁으면 화면 아래 112px 위에서 멈춘다.
// R368 — 결전의 날(ep1a09b) 초천사 배신 장면을 사용자가 만든 영상으로 교체 + 결전의 날 보스로 발록(색만 조금 바꿈).
// 사용자 2026-11-06: "이거 초천사 배신장면인데 기존꺼 삭제하고 이걸로 대체 근데 자막같은거 라던가 게임ui라던가 우리쪽으로 개선해서 적용해줘
//                    그리고 결전의날보스에 발록을 색만조금 바꿔서 개선적용해줘"
//  · 영상(assets/r368/betrayal.mp4, 10초): 사용자 영상에서 아래쪽의 가짜 게임 UI(물약·스킬 아이콘·체력 막대), 깨진 자막, 워터마크를
//    잘라 낸 1280×548 시네마 비율. 자막은 우리 쪽 정본 문장(R317 CAPTIONS, 개선본 [09]/[10] 그대로)을 영상 장면에 맞춰 띄운다.
//  · 발록이 결전의 날에서 쓰러지는 순간(R317과 같은 조건) 영상이 나온다. R317 슬라이드 장면이 막 시작했으면 바로 닫고 영상으로 바꾼다.
//    영상을 못 틀면(파일·코덱 오류, 6초 진행 없음) R317 슬라이드 장면을 그대로 둔다(이미 열렸을 때). 원래 파일·R317 코드는 지우지 않았다.
//  · 결전의 날 보스: 이 지역에는 보스가 없었다(R317 주석 "No new boss is placed in ep1a09b"). 사용자 지시로 dist06 발록 보스 정의를
//    그대로 복사해(이름·그림·패턴 같음) ep1a09b 에 넣고, 그릴 때만 색을 조금 바꾼다(hue-rotate·saturate·brightness — Three.js 기록기 허용 필터).
//    원본 그림 파일은 바꾸지 않는다. dist06 의 발록은 그대로.
//  · 재생 중 게임은 멈추고(틱 건너뜀) BGM 은 bgmGain()=0(bgm-map-r308 이 곱함). 건너뛰기: 단추·화면 누르기·Esc/Enter/Space.
//  · 끄기: storyworld.r368.betrayal {on:false} → 기존 R317 장면, {tint:false} → 원래 색 발록.
(()=>{'use strict';
if(window.__STORYWORLD_BETRAYAL_VIDEO_R368__)return;
const REV='R368-betrayal-video-1',KEY='storyworld.r368.betrayal',SRC='assets/r368/betrayal.mp4',POSTER='assets/r368/betrayal-poster.jpg',ZONE='ep1a09b',
 STALL_MS=6000,HOLD_MS=900,TINT='hue-rotate(-45deg) saturate(1.35) brightness(1.08)';
// [시작초, 끝초, R317 CAPTIONS 번호] — 초천사가 웃는 얼굴(3.4초~) / 붉은 권능이 수호자들을 덮침(6.3초~) / 홀로 남아 무릎 꿇음(8.2초~)
const CUES=Object.freeze([[3.4,6.3,0],[6.3,8.2,1],[8.2,11,2]]);
const FALLBACK_CAPTIONS=Object.freeze(['초천사가 웃으며 권능을 펼쳤다.','그런데 사라진 것은 악마들이 아니었다.','수호자 가운데 남아 있는 것은 나 하나뿐이었다.']);
let prefs={on:true,tint:true,seen:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={plays:0,skips:0,ended:0,errors:0,muted:0,stalled:0,keptR317:0,replacedR317:0,restoredR317:0,injected:0,tinted:0,preloads:0};let lastError=null,open=null,pre=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const url=p=>{try{return typeof urlFor==='function'?urlFor(p):p;}catch(_){return p;}};
const R317=()=>window.__STORYWORLD_MAPS_PALACE_SLUM_R317__||null;
const captions=()=>{const c=R317()?.CAPTIONS;return Array.isArray(c)&&c.length===3?c:FALLBACK_CAPTIONS;};
const solo=()=>{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';};
const here=()=>typeof room!=='undefined'?room:null;
const eligible=r=>!!(r&&r.id===ZONE&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103&&solo());
const isBalrog=e=>!!(e?.boss&&!e.midboss&&/발록|balrog/i.test(String(e.name||'')+' '+String(e.nativeId||'')+' '+String(e.kind||'')));

// ── 결전의 날 보스: dist06 발록 정의를 복사해 넣는다(이 지역에 보스가 없을 때만, 한 번) ──
function inject(){try{const R=typeof regionById!=='undefined'?regionById:null,z=R?.[ZONE];if(!z||!Array.isArray(z.bosses)||z.bosses.length)return false;
 const src=(R.dist06?.bosses||[]).find(b=>/발록|balrog/i.test(String(b.name||'')+' '+String(b.sourceIdentity||'')));if(!src)return false;
 const b={...src,r368:true};z.bosses.push(b);
 if(Array.isArray(z.paths))for(const p of [b.path,b.beam,...Object.values(b.frames||{}).map(f=>f?.path)])if(typeof p==='string'&&p&&!z.paths.includes(p))z.paths.push(p);
 stats.injected++;return true;}catch(e){fail(e);return false;}}
inject();
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(id,...a){if(id===ZONE)inject();const out=await base.call(this,id,...a);try{if(eligible(here()))preload();}catch(e){fail(e);}return out;};}

// ── 색: 결전의 날 발록만, 그릴 때 필터를 덧붙인다(원본 그림 그대로) ──
const tinted=e=>prefs.tint&&isBalrog(e)&&here()?.id===ZONE;
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(!tinted(e))return base.call(this,e,...a);
 const c=typeof ctx!=='undefined'?ctx:null;if(!c||typeof c.save!=='function')return base.call(this,e,...a);
 c.save();try{const prev=c.filter;c.filter=(prev&&prev!=='none'?prev+' ':'')+TINT;stats.tinted++;return base.call(this,e,...a);}finally{c.restore();}};}

// ── 영상 ──
function preload(){if(pre||!prefs.on||typeof document==='undefined')return pre;try{const v=document.createElement('video');v.preload='auto';v.playsInline=true;v.setAttribute('playsinline','');v.src=url(SRC);v.load?.();pre=v;stats.preloads++;}catch(e){fail(e);}return pre;}
function css(){if(document.getElementById('r368Css'))return;const s=document.createElement('style');s.id='r368Css';
 s.textContent='#r368v{position:fixed;inset:0;z-index:2147482000;background:#050304;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}'
 +'#r368v video{width:100%;max-height:100%;aspect-ratio:1280/548;object-fit:contain;background:#000}'
 +'#r368v .chap{position:absolute;left:max(16px,3vw);top:max(14px,3vh);color:#c9b49a;font:600 13px/1.4 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.18em;opacity:.82;text-shadow:0 1px 4px #000;pointer-events:none}'
 +'#r368v .cap{position:absolute;left:0;right:0;margin:0 auto;width:fit-content;box-sizing:border-box;top:min(calc(50% + min(50vh,21.40625vw) + 6px),calc(100% - 112px));max-width:min(88vw,760px);padding:8px 18px;text-align:center;color:#f1e3cc;'
 +'font:500 clamp(16px,2.3vw,24px)/1.5 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.04em;text-shadow:0 0 10px #000,0 2px 6px #000;background:linear-gradient(90deg,transparent,rgba(8,4,6,.62) 18%,rgba(8,4,6,.62) 82%,transparent);'
 +'border-top:1px solid rgba(160,40,48,.45);border-bottom:1px solid rgba(160,40,48,.45);opacity:0;transition:opacity .4s;pointer-events:none;word-break:keep-all}#r368v .cap.on{opacity:1}'
 +'#r368v .skip{position:absolute;right:max(16px,3vw);bottom:max(16px,3vh);padding:8px 16px;font:14px "Malgun Gothic",sans-serif;color:#efe6da;background:rgba(20,12,12,.66);border:1px solid #7b5a55;border-radius:6px;cursor:pointer}'
 +'#r368v .fade{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .45s;pointer-events:none}#r368v .fade.on{opacity:1}';document.head.appendChild(s);}
const current=o=>open===o&&!o.closed;
function close(o,reason){if(!current(o))return;o.closed=true;clearTimeout(o.stall);clearTimeout(o.hold);
 for(const [type,fn]of o.events)o.video.removeEventListener(type,fn);o.events.length=0;try{o.video.pause();}catch(_){}
 if(reason==='skip')stats.skips++;else if(reason==='ended')stats.ended++;else if(reason==='stall')stats.stalled++;
 if((reason==='skip'||reason==='ended')&&!prefs.seen){prefs.seen=true;save();}
 const failed=reason==='error'||reason==='stall';
 // 영상이 실패하면 숨겨 둔 R317 장면을 다시 보여 준다(서사 유지). 끝까지 갔거나 건너뛰면 R317 을 닫는다.
 if(o.r317){try{if(failed&&o.r317.isConnected){o.r317.style.visibility='';stats.restoredR317++;}else R317()?.skip?.();}catch(e){fail(e);}}
 if(failed&&!o.r317&&o.lastTime<1){prefs.seen=false;save();}
 o.fade.classList.add('on');setTimeout(()=>{try{o.video.removeAttribute('src');o.video.load();}catch(_){}o.root.remove();if(open===o)open=null;
  try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();o.focus?.focus?.({preventScroll:true});}catch(_){}},reason==='error'?0:460);}
function key(e){if(!open)return false;e.preventDefault();e.stopImmediatePropagation();if(e.type==='keydown'&&!e.repeat&&(e.key==='Escape'||e.key==='Enter'||e.key===' '||e.code==='Space'))close(open,'skip');return true;}
// 스킬 키(michaela-r247 등 capture)보다 먼저 막도록 먼저 실린 R309 의 capture 처리기에 맡긴다(Codex P2). R309 가 없을 때를 위해 자기 처리기도 둔다.
try{(window.__STORYWORLD_CINEMA_GUARDS__=window.__STORYWORLD_CINEMA_GUARDS__||[]).push(key);}catch(_){}
if(typeof addEventListener==='function'){addEventListener('keydown',key,true);addEventListener('keyup',key,true);}
function cue(o){const t=Number(o.video.currentTime)||0,c=CUES.find(([a,b])=>t>=a&&t<b),text=c?captions()[c[2]]:'';
 if(text!==o.text){o.text=text;if(text)o.cap.textContent=text;o.cap.classList.toggle('on',!!text);}}
function watch(o){clearTimeout(o.stall);o.stall=setTimeout(()=>{if(!current(o)||o.ending)return;const t=Number(o.video.currentTime)||0;if(t>o.lastTime+.01){o.lastTime=t;watch(o);return;}close(o,'stall');},STALL_MS);}
function atEnd(o){if(!current(o)||o.ending)return;o.ending=true;clearTimeout(o.stall);o.hold=setTimeout(()=>close(o,'ended'),HOLD_MS);}
function play(r,opt={}){if(open||typeof document==='undefined')return false;if(!opt.force&&(!prefs.on||!eligible(r)))return false;
 css();const v=pre||preload()||document.createElement('video');pre=null;if(!v.src)v.src=url(SRC);
 v.poster=url(POSTER);v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';if(opt.muted)v.muted=true;try{v.currentTime=Number(opt.at)||0;}catch(_){}
 const root=document.createElement('div');root.id='r368v';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','결전의 날 기억');root.tabIndex=-1;
 const title=(typeof regionById!=='undefined'&&regionById?.[ZONE]?.title)||'결전의 날';
 root.innerHTML='<div class="chap"></div><div class="cap" aria-live="polite"></div><button type="button" class="skip">건너뛰기 ▸</button><div class="fade"></div>';
 root.querySelector('.chap').textContent=title+' · 기억';root.insertBefore(v,root.firstChild);document.body.appendChild(root);requestAnimationFrame(()=>{root.style.opacity='1';});
 const o=open={root,video:v,cap:root.querySelector('.cap'),fade:root.querySelector('.fade'),stall:0,hold:0,events:[],closed:false,ending:false,lastTime:-1,text:'',focus:document.activeElement,room:r,r317:opt.r317||null};
 const skip=root.querySelector('.skip');stats.plays++;
 const on=(type,fn)=>{const own=e=>{if(current(o))fn(e);};o.events.push([type,own]);v.addEventListener(type,own);};
 try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}
 root.addEventListener('pointerdown',e=>{if(e.target===skip)return;e.preventDefault();close(o,'skip');});skip.addEventListener('click',e=>{e.stopPropagation();close(o,'skip');});
 watch(o);on('timeupdate',()=>{cue(o);const t=Number(v.currentTime)||0;if(t>o.lastTime+.01){o.lastTime=t;watch(o);}});on('playing',()=>{cue(o);if(!prefs.seen){prefs.seen=true;save();}});
 on('ended',()=>atEnd(o));on('error',()=>{fail('video error '+(v.error?.code||''));close(o,'error');});
 if(opt.paused){cue(o);return true;}
 const p=v.play?.();if(p&&typeof p.catch==='function')p.catch(()=>{if(!current(o))return;v.muted=true;stats.muted++;v.play().catch(e=>{if(!current(o))return;fail(e);close(o,'error');});});
 return true;}
// 발록이 결전의 날에서 쓰러지는 순간(R317 과 같은 조건). R317 장면이 열렸으면 영상이 준비됐을 때만 바꾼다.
function takeOver(r){if(!prefs.on||prefs.seen||!eligible(r))return false;const old=typeof document!=='undefined'&&document.getElementById('r317Cinema'),v=pre;
 if(old){if(!v||v.error||v.readyState<2){stats.keptR317++;return false;}
  // R317 은 닫지 않고 숨겨 둔다(영상 실패 시 다시 보임, 성공하면 close 에서 닫음).
  if(!play(r,{r317:old}))return false;old.style.visibility='hidden';stats.replacedR317++;return true;}
 return play(r);}
if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){const r=here(),want=isBalrog(e)&&!e.deadRecorded&&eligible(r)&&typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading);
 const out=base.call(this,e,...a);if(want&&e.hp<=0&&e.deadRecorded&&r===here())try{takeOver(r);}catch(err){fail(err);}return out;};}
// 재생 중 게임 멈춤(R317 과 같은 방식)
if(typeof tick==='function'){const base=tick;tick=function(...a){if(open){if(here()&&open.room&&here()!==open.room)close(open,'skip');return;}return base.apply(this,a);};}
window.__STORYWORLD_BETRAYAL_VIDEO_R368__=Object.freeze({revision:REV,KEY,SRC,POSTER,ZONE,TINT,CUES,
 bgmGain:()=>open?0:1,play:(o={})=>play(here(),{force:true,...o}),skip:()=>{if(open)close(open,'skip');},inject,preload,isBalrog,
 setPrefs(p){prefs={...prefs,...p};save();},
 inspect:()=>({revision:REV,prefs:{...prefs},open:!!open,caption:open?.text||'',time:open?Number(open.video.currentTime)||0:null,preloaded:pre?{ready:pre.readyState,error:!!pre.error}:null,stats:{...stats},lastError})});
})();
