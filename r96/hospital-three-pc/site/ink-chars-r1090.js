// R1090 — 캐릭터 담묵 필터. 사용자 2026-11-15 "몹과보스 영웅까지 수묵화풍으로 개선하면어떤지 시안까지제시" → 시안 세 가지 가운데 '1안 담묵 필터만' 선택(11-15 22:33Z).
//  · 영웅·몹·보스 몸 그림의 채도를 반쯤 낮추고 대비를 살짝 올려, 수묵화풍 맵(R1055) 위에서 캐릭터 색이 따로 놀지 않게 한다. 그림 원본·자산은 그대로다.
//  · 하는 법: 렌더러가 받는 프레임 명령 가운데 영웅·몹 '그림' 명령의 style.filter 뒤에 FILTER 를 덧붙인다(Three 기록기가 색 행렬로 계산 — 추가 패스·캔버스 필터 없음).
//    피격 번쩍임(brightness)·사몽 색 같은 기존 필터는 앞에 그대로 남는다.
//  · 건드리지 않는 것: 이펙트·탄·예고 표시·소품·바닥·체력바·이름표·UI, 더하기 혼합(빛) 그림, 바닥에 붙는 그림, 이펙트 시트(vfx·fx·pixelfx 경로). 전투 신호 색은 그대로다.
//  · 맵 수묵화풍이 꺼져 있거나 쉬는 성능 단계(R1055 k=0)면 같이 쉰다. 설정 창 '전투 화면' 구역의 '캐릭터 담묵' 체크로 따로 끌 수 있다(저장 storyworld.r1090.inkChars = '0' 이면 끔).
//  판정·피해·AI·저장·서사는 바꾸지 않는다(색만).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_INK_CHARS_R1090__)return;
const REV='R1090-ink-chars-1',KEY='storyworld.r1090.inkChars',FILTER='saturate(.5) contrast(1.08)';
const stats={frames:0,tinted:0,errors:0,rows:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
// 맵 수묵화풍이 실제로 켜져 있는가(R1055 의 지금 세기 k). 프레임마다 묻지 않고 0.5초에 한 번 본다.
let inkLive=false;
function refresh(){let live=false;try{const A=window.__STORYWORLD_INK_WASH_R1055__;if(A&&typeof A.inspect==='function'){const i=A.inspect();live=!!i&&i.prefs?.mode!=='off'&&Number.isFinite(i.k)&&i.k>.5;}}catch(_){live=false;}inkLive=live;return live;}
const active=()=>on&&inkLive;
function set(v){if(typeof v!=='boolean')return on;on=v;try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'0');}catch(_){}label();return on;}
// 이펙트 시트 경로(낱말 경계 — 'effects' 같은 낱말 안의 fx 는 아님)
const FX=/(?:^|[^a-z])(?:vfx|fx|pixelfx)(?:[^a-z]|$)/i;
const GHOST=/^r(?:350|448):ghost:/;
function process(commands){if(!active()||!Array.isArray(commands))return 0;let n=0;
 for(let i=0;i<commands.length;i++){const c=commands[i];if(!c||typeof c!=='object'||c.kind!=='image'||c.r1090)continue;
  const o=c.owner;if(!o)continue;
  /* R350·R448 '영웅 다시 보이기' 사본은 그 모듈들이 먼저 돌아 이미 명령에 들어 있다(owner.kind 'effect') → 몸과 같은 색이 되게 같이 물들인다 */
  const ghost=typeof c.key==='string'&&GHOST.test(c.key);
  if(!ghost&&((o.kind!=='hero'&&o.kind!=='enemy')||o.groundAligned===true||o.r350))continue;
  const s=c.style;if(!s||typeof s!=='object')continue;
  const op=s.globalCompositeOperation;if(op&&op!=='source-over')continue;
  if(typeof c.sourcePath==='string'&&FX.test(c.sourcePath))continue;
  const prev=typeof s.filter==='string'&&s.filter&&s.filter!=='none'?s.filter+' ':'';
  c.style={...s,filter:prev+FILTER};c.r1090=true;n++;}
 stats.tinted+=n;return n;}
// ---- 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번만) ----
let depth=0;
const wrapFn=fn=>{if(fn.__r1090)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands)){stats.frames++;process(frame.commands);}}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1090=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
function tick(){wrapInst();refresh();}
try{setInterval(tick,500);}catch(e){fail(e);}tick();
// ---- 설정 창 줄: '전투 화면' 구역, 맵 수묵화풍 줄 바로 뒤 ----
function label(){try{const b=document.getElementById('inkCharsOnR1090');if(b)b.checked=on;}catch(e){fail(e);}}
function settingsRow(){try{const host=document.getElementById('combatScreenR1021')||document.getElementById('quickSettingsR114');if(!host)return;
  let row=document.getElementById('inkCharsRowR1090');
  if(!row){row=document.createElement('div');row.id='inkCharsRowR1090';row.className='r1021-row';
   const lab=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.id='inkCharsOnR1090';
   const txt=document.createElement('span');txt.textContent=' 캐릭터 담묵 ';
   const note=document.createElement('p');note.className='small muted';note.textContent='영웅·몹·보스의 색을 먹빛으로 옅게 합니다. 맵 수묵화풍이 켜져 있을 때만 작동하고, 이펙트·예고 표시·UI 색은 그대로입니다.';
   box.onchange=()=>{set(!!box.checked);};
   lab.appendChild(box);lab.appendChild(txt);row.appendChild(lab);row.appendChild(note);stats.rows++;}
  // 자리: 맵 수묵화풍 줄 바로 뒤(없으면 구역 끝)
  const kids=host.children,ink=document.getElementById('inkRowR1055');
  const want=ink&&ink.parentNode===host?Array.prototype.indexOf.call(kids,ink)+1:-1;
  if(row.parentNode!==host||(want>=0&&Array.prototype.indexOf.call(kids,row)!==want)){
   const next=want>=0?Array.prototype.filter.call(kids,k=>k!==row)[want]:null;
   if(next&&typeof host.insertBefore==='function')host.insertBefore(row,next);
   else{host.appendChild(row);if(want>=0&&Array.isArray(host.children)){const a=host.children,i=a.indexOf(row);if(i>=0&&i!==want){a.splice(i,1);a.splice(Math.min(want,a.length),0,row);}}}}
  label();}catch(e){fail(e);}}
function settingsLater(){settingsRow();try{queueMicrotask(settingsRow);}catch(_){}try{requestAnimationFrame(()=>{settingsRow();requestAnimationFrame(settingsRow);});}catch(_){}}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsLater();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_INK_CHARS_R1090__=Object.freeze({revision:REV,storageKey:KEY,FILTER,process,active,refresh,enabled:()=>on,set,settingsRow,
 inspect:()=>({revision:REV,on,inkLive,active:active(),frames:stats.frames,tinted:stats.tinted,errors:stats.errors,rows:stats.rows,lastError})});
})();
