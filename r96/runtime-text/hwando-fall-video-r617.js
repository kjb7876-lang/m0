// R617 — 환도의 기억(제4부) 서사 영상 3편: 타락천사 기사 강림 → 성벽에서 바다로 추락 → 낯선 해변에서 깨어남.
// 사용자 2026-11-10: "이것들은 환도 스토리에서 성위에서 타락천사기사강림, 당한후 성에서 떨어져 낯선 해변가 깨어나 불면귀마을로 진입전 시네마틱 각각 적절히배치 개선해서"
//  · 자리(정본 개선본 last301 '타락천사 기사' · last302 '잠들지 못하는 마을' 순서 그대로, 새 문장·설정 없음):
//    ① knight — last301 에서 보스전이 열리고(room.engaged) 타락천사 기사(l301-boss)가 깨어나는 순간. 끝에 보스 이름 카드.
//    ② fall   — last301 필수 패배(R75 fall: 12초 겨룸 또는 기사 체력 66% 아래 → room.r75Falling)가 일어나면 0.35초 뒤, 뒤 서사창 위에 먼저.
//               영상이 끝나면 같은 장면의 정본 문단(여섯 검격 → 추락 → 검은 바다)이 이어진다.
//    ③ beach  — last302 에 처음 들어와 입장 서사창이 닫힌 뒤 0.7초. 불면귀 마을로 들어가기 전, 젖은 모래 해안에서 깨어남.
//  · 영상(assets/r617/*.mp4, 960×540 24fps): 사용자 원본(세로 720×1280 두 편, 4:3 한 편)을 자르지 않고 가운데 통째로 두고
//    양옆은 같은 영상을 흐리고 어둡게 채움(세로 화면에서는 원본 그림 폭이 화면 너비에 맞게 커지고 흐린 채움만 밖으로 나감). 오른쪽 아래·왼쪽 위 생성 도구 표시는 delogo 로 지움. 들어갈 때·나갈 때 검게 이어짐.
//    추락 편은 4초라 0.8배로 늦춰 5초. 세 편 합계 약 1.5MB(사이트 1GB 한도 근처라 작게). 원본 영상은 저장소에 넣지 않는다.
//  · 자막은 정본 개선본 문장 그대로(…로 줄인 것 포함).
//  · 재생 중 게임 멈춤(엔진 tick + 재생할 때 가장 바깥 tick 감싸개도), BGM 0(bgm-map-r308 배수), 게임 키 막기(R309 가드 등록).
//    건너뛰기: 단추·화면 누르기·Esc/Enter/Space. 6초 진행이 없으면 닫는다. 다른 지역으로 가면 닫는다. 진행·판정·세이브는 바꾸지 않는다.
//  · 자동 검사(navigator.webdriver)에서는 ?vid617=1 일 때만. 협동 플레이에서는 안 나옴.
//  · 끄기: localStorage storyworld.r617.hwandofall {on:false}. 다시 보기: API play('knight'|'fall'|'beach').
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__)return;
const REV='R617-hwando-fall-video-2',KEY='storyworld.r617.hwandofall',STALL_MS=6000,HOLD_MS=700,ENTER_DELAY_MS=700,DOWN_DELAY_MS=350,MAX_TRIES=2,BOSS='l301-boss';
// [시작초, 끝초, 문장] — 정본 개선본 last301·last302 문장 그대로.
const CLIPS=Object.freeze([
 Object.freeze({id:'knight',zone:'last301',when:'engaged',src:'assets/r617/knight.mp4',poster:'assets/r617/knight-poster.jpg',seconds:8,core:.3164,nameAt:5.4,label:'타락천사 기사 강림',
  cues:Object.freeze([[0.5,3.9,'거센 폭풍이 몸을 밀어내어 발 디딜 곳부터 찾아야 했다.'],[4.1,8.6,'성벽 위에서 내려온 기사가 다가오자…']])}),
 Object.freeze({id:'fall',zone:'last301',when:'down',src:'assets/r617/fall.mp4',poster:'assets/r617/fall-poster.jpg',seconds:5,core:.75,nameAt:null,label:'성벽에서 검은 바다로',
  cues:Object.freeze([[0.3,2.5,'성벽이 머리 위로 멀어지고 아래의 검은 바다가 입을 벌린 채 가까워지고 있었다.'],[2.6,5.6,'차가운 바닷물이 내 몸을 덮친 뒤의 일은 기억나지 않는다.']])}),
 Object.freeze({id:'beach',zone:'last302',when:'enter',src:'assets/r617/beach.mp4',poster:'assets/r617/beach-poster.jpg',seconds:8,core:.3164,nameAt:null,label:'낯선 해안',
  cues:Object.freeze([[0.5,3.8,'몸 위로 밀려왔던 파도가 스르르 빠져나갔다.'],[4.0,8.6,'눈을 뜨니 젖은 모래 해안에 누워 있었다.']])})]);
const byId=Object.fromEntries(CLIPS.map(c=>[c.id,c]));
let prefs={on:true,seen:[]};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');prefs={...prefs,...s,seen:Array.isArray(s?.seen)?s.seen.filter(x=>byId[x]):[]};}catch(_){}
const stats={plays:0,skips:0,ended:0,errors:0,muted:0,stalled:0,room:0,preloads:0,waited:0};let lastError=null,open=null,pending=null,gateFn=null;const pre={};
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const seen=id=>prefs.seen.includes(id);
const mark=(id,v)=>{const has=seen(id);if(v&&!has)prefs.seen.push(id);else if(!v&&has)prefs.seen=prefs.seen.filter(x=>x!==id);else return;save();};
const url=p=>{try{return typeof urlFor==='function'?urlFor(p):p;}catch(_){return p;}};
const solo=()=>{try{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';}catch(_){return true;}};
const forced=()=>{try{return /[?&]vid617=1\b/.test(location.search);}catch(_){return false;}};
const automated=()=>{try{return !!navigator.webdriver&&!forced();}catch(_){return false;}};
const here=()=>typeof room!=='undefined'?room:null;
const now=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
const storyLayer=r=>{try{return !!r&&r.layer==='STORY'&&(typeof layer==='undefined'||layer==='STORY')&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103;}catch(_){return false;}};
const eligible=(r,c)=>!!(c&&r&&r.id===c.zone&&storyLayer(r)&&solo()&&!automated());
// 다른 장면(서사창·창·로딩·다른 영상·컷신)이 열려 있으면 기다린다
// story=false: 서사창(그리고 서사창이 함께 켜는 modal)은 기다리지 않는다 — 필수 패배 뒤 서사창 위에 추락 영상을 먼저 튼다
const busy=(story=true)=>{try{const sc=typeof storyScene!=='undefined'&&!!storyScene;return (story&&sc)||(typeof loading!=='undefined'&&!!loading)||((story||!sc)&&typeof modal!=='undefined'&&!!modal)
 ||(typeof started!=='undefined'&&!started)||typeof player==='undefined'||!player||!(player.hp>0)
 ||(typeof document!=='undefined'&&(!!document.hidden||!!document.getElementById('r317Cinema')||!!document.getElementById('r368v')||!!document.getElementById('r369v')||!!document.getElementById('r372v')))
 ||!!window.__STORYWORLD_BOSS_CINEMATIC_R568__?.inspect?.()?.active;}catch(_){return false;}};
const bossOf=r=>(r?.enemies||[]).find(e=>e&&e.nativeId===BOSS&&!e.r61Clone&&!e.r61Summoned)||null;
const awake=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active';
// 필수 패배(index.html R75 fall): 기사와 12초 겨루거나 기사 체력이 66% 아래가 되면 room.r75Falling 이 켜지고 기사는 숨고 뒤 서사가 열린다.
// 보스가 실제로 죽는 경로(다른 층·옛 저장)도 함께 본다.
const fell=(r,e)=>!!r?.r75Falling||(!!e&&(e.hp<=0||!!e.deadRecorded));
const failed={},tries={};
const bossName=r=>{try{const e=bossOf(r);if(e?.name)return String(e.name).replace(/\s*\(.*\)\s*$/,'');}catch(_){}return '타락천사 기사';};

const audioLevel=()=>{try{const s=typeof settings!=='undefined'?settings:null;if(!s)return 1;const c=x=>Math.max(0,Math.min(1,Number(x)||0));
 return Math.max(s.sound?c(s.volume):0,s.music?c(s.bgm??s.volume):0,s.narration?c(s.voice??s.volume):0);}catch(_){return 1;}};
function preload(id){const c=byId[id];if(!c||pre[id]||!prefs.on||seen(id)||typeof document==='undefined')return pre[id]||null;
 try{const v=document.createElement('video');v.preload='auto';v.playsInline=true;v.setAttribute('playsinline','');v.src=url(c.src);v.load?.();pre[id]=v;stats.preloads++;}catch(e){fail(e);}return pre[id]||null;}

function css(){if(document.getElementById('r617Css'))return;const s=document.createElement('style');s.id='r617Css';
 s.textContent='#r617v{--h2:min(50vh,28.125vw);position:fixed;inset:0;z-index:2147482000;background:#030305;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}'
 +'#r617v video{width:100%;max-height:100%;aspect-ratio:16/9;object-fit:contain;background:#000}'
 +'#r617v .chap{position:absolute;left:max(16px,3vw);top:max(14px,3vh);z-index:2;color:#cfd3dc;font:600 13px/1.4 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.18em;opacity:.85;text-shadow:0 1px 4px #000;pointer-events:none}'
 +'#r617v .cap{position:absolute;z-index:2;left:0;right:0;margin:0 auto;width:fit-content;box-sizing:border-box;top:min(calc(50% + var(--h2) - 64px),calc(100% - 120px));max-width:min(88vw,780px);padding:8px 18px;text-align:center;color:#eef0f4;'
 +'font:500 clamp(15px,2.2vw,23px)/1.5 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.03em;text-shadow:0 0 10px #000,0 2px 6px #000;background:linear-gradient(90deg,transparent,rgba(6,8,14,.68) 16%,rgba(6,8,14,.68) 84%,transparent);'
 +'border-top:1px solid rgba(160,176,200,.38);border-bottom:1px solid rgba(160,176,200,.38);opacity:0;transition:opacity .4s;pointer-events:none;word-break:keep-all}#r617v .cap.on{opacity:1}'
 +'#r617v .name{position:absolute;z-index:2;left:0;right:0;top:max(12vh,calc(50% - var(--h2) + 28px));margin:0 auto;width:fit-content;max-width:88vw;text-align:center;pointer-events:none;opacity:0;transform:translateY(-8px);transition:opacity .6s,transform .6s}'
 +'#r617v .name.on{opacity:1;transform:none}#r617v .name small{display:block;color:#c9a46a;font:600 clamp(11px,1.4vw,14px)/1.6 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.5em;text-shadow:0 1px 4px #000}'
 +'#r617v .name b{display:block;padding:4px 22px 6px;color:#f3e7da;font:700 clamp(22px,3.6vw,40px)/1.3 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.14em;text-shadow:0 0 14px #000,0 2px 6px #000;'
 +'border-top:1px solid rgba(190,40,30,.7);border-bottom:1px solid rgba(190,40,30,.7);background:linear-gradient(90deg,transparent,rgba(20,4,4,.62) 16%,rgba(20,4,4,.62) 84%,transparent);word-break:keep-all}'
 // 세로 화면: 원본 그림(가운데 core 폭)이 화면 너비에 꽉 차게 키우고 흐린 옆 채움만 화면 밖으로(원본 그림은 자르지 않음)
 +'@media (orientation:portrait){#r617v{--h2:min(50vh,calc(28.125vw / var(--core,1)))}#r617v video{flex:none;width:min(calc(100vw / var(--core,1)),177.78vh);max-width:none;max-height:none}}'
 +'#r617v .skip{position:absolute;z-index:3;right:max(16px,3vw);bottom:max(16px,3vh);padding:8px 16px;font:14px "Malgun Gothic",sans-serif;color:#eef0f4;background:rgba(12,14,20,.66);border:1px solid #5d6a7b;border-radius:6px;cursor:pointer}'
 +'#r617v .fade{position:absolute;inset:0;z-index:4;background:#000;opacity:0;transition:opacity .45s;pointer-events:none}#r617v .fade.on{opacity:1}';document.head.appendChild(s);}
const current=o=>open===o&&!o.closed;
function close(o,reason){if(!current(o))return;o.closed=true;clearTimeout(o.stall);clearTimeout(o.hold);
 for(const [type,fn]of o.events)o.video.removeEventListener(type,fn);o.events.length=0;try{o.video.pause();}catch(_){}
 if(reason==='skip')stats.skips++;else if(reason==='ended')stats.ended++;else if(reason==='stall')stats.stalled++;else if(reason==='room')stats.room++;
 if(reason==='skip'||reason==='ended')mark(o.clip.id,true);
 if((reason==='error'||reason==='stall')&&o.lastTime<1)mark(o.clip.id,false); // 거의 못 봤으면 다음에 다시(다음 방문 때)
 if(reason==='error'||reason==='stall')failed[o.clip.id]=o.room; // 같은 방문에서는 다시 열지 않는다(Codex P2: 재생 실패 반복으로 게임이 막히지 않게)
 open=null; // 게임은 바로 다시 흐른다(검은 막만 0.46초 남아 사라짐)
 o.fade.classList.add('on');setTimeout(()=>{try{o.video.removeAttribute('src');o.video.load?.();}catch(_){}o.root.remove();
  try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();o.focus?.focus?.({preventScroll:true});}catch(_){}},reason==='error'?0:460);}
function key(e){if(!open)return false;e.preventDefault?.();e.stopImmediatePropagation?.();if(e.type==='keydown'&&!e.repeat&&(e.key==='Escape'||e.key==='Enter'||e.key===' '||e.code==='Space'))close(open,'skip');return true;}
try{(window.__STORYWORLD_CINEMA_GUARDS__=window.__STORYWORLD_CINEMA_GUARDS__||[]).push(key);}catch(_){}
if(typeof addEventListener==='function'){addEventListener('keydown',key,true);addEventListener('keyup',key,true);}
function cue(o){const t=Number(o.video.currentTime)||0,c=o.clip.cues.find(([a,b])=>t>=a&&t<b),text=c?c[2]:'';
 if(text!==o.text){o.text=text;if(text)o.cap.textContent=text;o.cap.classList.toggle('on',!!text);}
 if(o.nm&&o.clip.nameAt!=null&&t>=o.clip.nameAt)o.nm.classList.add('on');}
function watch(o){clearTimeout(o.stall);o.stall=setTimeout(()=>{if(!current(o)||o.ending)return;const t=Number(o.video.currentTime)||0;if(t>o.lastTime+.01){o.lastTime=t;watch(o);return;}close(o,'stall');},STALL_MS);}
function atEnd(o){if(!current(o)||o.ending)return;o.ending=true;clearTimeout(o.stall);if(o.nm)o.nm.classList.add('on');o.hold=setTimeout(()=>close(o,'ended'),HOLD_MS);}
// 이 파일보다 뒤에 실린 tick 감싸개(mobile-bonus-r286 의 재사용 대기 회복 등)도 영상 동안 멈추게, 재생할 때 가장 바깥 tick 에 문을 단다(R568 과 같은 방식)
function gateOuter(){try{if(typeof tick!=='function'||tick===gateFn)return;const outer=tick;const gf=function(...a){if(open){if(here()!==open.room)close(open,'room');else return;}return outer.apply(this,a);};gateFn=gf;tick=gf;}catch(e){fail(e);}}
function play(id,r,opt={}){const c=byId[id];if(!c||open||typeof document==='undefined')return false;
 if(!opt.force&&(!prefs.on||seen(id)||!eligible(r,c)))return false;if(pending&&pending.id===id)pending=null;
 css();const v=pre[id]||preload(id)||document.createElement('video');delete pre[id];if(!v.src)v.src=url(c.src);
 v.poster=url(c.poster);v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';{const lv=audioLevel();v.volume=Math.max(0,Math.min(1,lv));v.muted=!!opt.muted||lv<=0;}try{v.currentTime=Number(opt.at)||0;}catch(_){}
 const root=document.createElement('div');root.id='r617v';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',c.label);root.tabIndex=-1;root.style.setProperty?.('--core',String(c.core||1));
 const title=(typeof regionById!=='undefined'&&regionById?.[c.zone]?.title)||'';
 root.innerHTML='<div class="chap"></div>'+(c.nameAt!=null?'<div class="name"><small>BOSS</small><b></b></div>':'')+'<div class="cap" aria-live="polite"></div><button type="button" class="skip">건너뛰기 ▸</button><div class="fade"></div>';
 root.querySelector('.chap').textContent=(title?title+' · ':'')+'환도의 기억';const nm=c.nameAt!=null?root.querySelector('.name'):null;if(nm)nm.querySelector('b').textContent=bossName(r);
 root.insertBefore(v,root.firstChild);document.body.appendChild(root);requestAnimationFrame(()=>{root.style.opacity='1';});
 const o=open={clip:c,root,video:v,cap:root.querySelector('.cap'),nm,fade:root.querySelector('.fade'),stall:0,hold:0,events:[],closed:false,ending:false,lastTime:0,text:'',focus:document.activeElement,room:r};
 const skip=root.querySelector('.skip');stats.plays++;tries[id]=(tries[id]||0)+1;gateOuter();
 const on=(type,fn)=>{const own=e=>{if(current(o))fn(e);};o.events.push([type,own]);v.addEventListener(type,own);};
 try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}
 root.addEventListener('pointerdown',e=>{if(e.target===skip)return;e.preventDefault?.();close(o,'skip');});skip.addEventListener('click',e=>{e.stopPropagation?.();close(o,'skip');});
 watch(o);on('timeupdate',()=>{cue(o);const t=Number(v.currentTime)||0;if(t>o.lastTime+.01){o.lastTime=t;watch(o);}});on('playing',()=>{cue(o);mark(id,true);});
 on('ended',()=>atEnd(o));on('error',()=>{fail('video error '+(v.error?.code||''));close(o,'error');});
 if(opt.paused){cue(o);return true;}
 const p=v.play?.();if(p&&typeof p.catch==='function')p.catch(()=>{if(!current(o))return;v.muted=true;stats.muted++;const q=v.play?.();if(q&&typeof q.catch==='function')q.catch(e=>{if(!current(o))return;fail(e);close(o,'error');});});
 return true;}
// 무엇을 틀 차례인가: knight(보스가 깨어남) → fall(보스가 쓰러짐) → beach(last302 입장)
const blocked=(id,r)=>failed[id]===r||(tries[id]||0)>=MAX_TRIES;
function want(r=here()){if(!prefs.on||open||!r)return null;
 if(r.id==='last301'&&eligible(r,byId.knight)){const e=bossOf(r);
  if(!seen('fall')&&!blocked('fall',r)&&fell(r,e))return 'fall';
  if(!seen('knight')&&!blocked('knight',r)&&r.engaged&&awake(e))return 'knight';}
 if(pending&&pending.room===r&&!seen(pending.id)&&!blocked(pending.id,r)&&eligible(r,byId[pending.id]))return pending.id;
 return null;}
let downAt=null;
function poll(){const r=here();if(open)return;if(pending&&(pending.room!==r||seen(pending.id)||!prefs.on))pending=null;
 const id=want(r);if(!id){downAt=null;return;}
 if(id==='knight'){preload('fall');if(!busy())play('knight',r);else stats.waited++;return;}
 // 추락은 필수 패배 뒤 서사창이 열려도 그 위에 바로 튼다(영상 → 같은 문단의 글). 다른 창·로딩·장면이면 기다린다.
 if(id==='fall'){if(busy(false)){stats.waited++;downAt=null;return;}if(downAt===null){downAt=now();preload('fall');}if(now()-downAt>=DOWN_DELAY_MS){downAt=null;play('fall',r);}return;}
 if(busy()){stats.waited++;pending.at=now();return;}
 if(now()-pending.at>=ENTER_DELAY_MS)play(id,r);}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(id,...a){const out=await base.call(this,id,...a);
 try{const r=here();if(prefs.on&&!seen('beach')&&eligible(r,byId.beach)){preload('beach');pending={id:'beach',room:r,at:now()};}
  else if(pending&&pending.room!==r)pending=null;
  if(prefs.on&&!seen('knight')&&eligible(r,byId.knight))preload('knight');}catch(e){fail(e);}return out;};}
if(typeof tick==='function'){const base=tick;tick=function(...a){if(open){if(here()!==open.room)close(open,'room');else return;}
 const out=base.apply(this,a);try{poll();}catch(e){fail(e);}return out;};}
window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__=Object.freeze({revision:REV,KEY,BOSS,CLIPS,
 bgmGain:()=>open?0:1,play:(id='knight',o={})=>play(id,here(),{force:true,...o}),skip:()=>{if(open)close(open,'skip');},preload,poll,want:()=>want(),
 setPrefs(p){prefs={...prefs,...p,seen:Array.isArray(p?.seen)?p.seen.filter(x=>byId[x]):prefs.seen};save();},
 inspect:()=>({revision:REV,prefs:{...prefs,seen:[...prefs.seen]},open:open?open.clip.id:null,pending:pending?pending.id:null,caption:open?.text||'',name:open?.nm?.querySelector?.('b')?.textContent||'',
  time:open?Number(open.video.currentTime)||0:null,preloaded:Object.keys(pre),stats:{...stats},lastError})});
})();
