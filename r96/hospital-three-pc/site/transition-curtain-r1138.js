// R1138 — 지역 전환 직후 끊김을 로딩 화면 뒤로(사용자 2026-11-18 "응 버그없이 페이블로진행": 지형 만들기 등 무거운 준비를 로딩 화면 안으로).
//  R1137 측정: 스토리의 1.8~2.1초 긴 끊김은 전투가 아니라 지역 전환 직후 첫 장면들이다 — 로딩 창이 닫힌 뒤 첫 그리기에서
//  그림 투명 테두리 재기·바닥 가장자리 가림판(R188)·동굴 지형(R204) 만들기가 한꺼번에 돌아, 게임 화면이 멈춘 채로 보였다.
//  고친 방식: 계산 시점·순서·판정은 하나도 바꾸지 않는다. 엔진이 로딩 창을 닫는 그 순간(같은 동기 흐름, 화면에 그려지기 전)에
//  로딩 창과 똑같이 생긴 '가림막'(DOM 한 장, pointer-events:none)을 올려 두고, 무거운 첫 그리기들이 끝난 뒤에 걷는다.
//   - 걷는 조건: 그리기 3장면 이상 + (동굴 지형을 쓰는 지역이면) 지형이 붙고 2장면 더. 실제 시간 4초가 넘으면 무조건 걷는다(타이머로도 한 번 더).
//   - 창(modal)·다음 로딩·서사 장면·영상이 뜨면 바로 걷는다(그 화면을 가리지 않는다).
//   - tick·저장·blocked·시작 위치·몹 배치·길잡이에는 손대지 않는다(감싸는 것은 enterRegion·closePanel 두 함수뿐, 한 번만, 결과값 그대로).
//  끄기: localStorage storyworld.r1138.curtain = {"on":false} (또는 '0').
(()=>{'use strict';
if(window.__STORYWORLD_TRANSITION_CURTAIN_R1138__)return;
const REV='R1138-curtain-1',KEY='storyworld.r1138.curtain',ID='r1138Curtain',CAP_MS=4000,MIN_FRAMES=3,SETTLE=2,NO_CAVE_FRAMES=6,TEXT='지형을 준비하는 중입니다.';
let prefs={on:true};try{const v=localStorage.getItem(KEY);if(v==='0')prefs.on=false;else if(v&&v!=='1'){const p=JSON.parse(v);if(p&&typeof p.on==='boolean')prefs.on=p.on;}}catch(_){}
const stats={shown:0,lifted:0,skipped:0,errors:0};let lastError=null;const log=[];
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const now=()=>performance.now();
let depth=0,cur=null;
const G=name=>{try{switch(name){case'loading':return typeof loading!=='undefined'?loading:false;case'modal':return typeof modal!=='undefined'?modal:false;case'storyScene':return typeof storyScene!=='undefined'?storyScene:null;
 case'zone':return typeof zone!=='undefined'?zone:null;case'layer':return typeof layer!=='undefined'?layer:null;}}catch(_){}return null;};
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';}catch(_){return true;}};
function videoUp(){try{const W=window.innerWidth||0,H=window.innerHeight||0;for(const v of document.querySelectorAll('video')){if(v.paused||v.ended)continue;const r=v.getBoundingClientRect();if(r.width*r.height>=W*H*.3)return true;}}catch(_){}return false;}
// 가림막을 두면 안 되는 화면
function blocker(){if(G('loading'))return'loading';if(G('modal'))return'modal';if(G('storyScene'))return'story';
 try{const f=document.getElementById('fatal');if(f&&f.style.display==='block')return'fatal';}catch(_){}
 if(videoUp())return'video';return null;}
// 동굴 지형(R204): 'none' 기다릴 것 없음 · 'wait' 아직 · 'ready' 붙음
function caveState(frames){try{const C=window.__STORYWORLD_CAVE_R204__;if(!C||typeof C.inspect!=='function')return'none';const z=G('zone');
  if(!z||!Array.isArray(C.zones)||!C.zones.includes(z)||G('layer')!=='STORY'||!solo())return'none';if(C.inspect().prefs?.on===false)return'none';
  const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r)return'none';const st=r.__r204;
  if(!st||st.zone!==z||st.gen!==r.sceneGeneration)return frames>=NO_CAVE_FRAMES?'none':'wait';/* 여섯 장면이 지나도 시작을 안 했으면 이 지역은 만들지 않는 것 */
  if(st.failed)return'none';return st.pending?'wait':'ready';}catch(e){fail(e);return'none';}}
// 로딩 창이 보이는 동안(닫히기 직전) 모습 그대로 본뜬다 — 계산된 스타일을 그대로 옮겨 id·class 없이도 같은 모습
function snapshot(){const m=document.getElementById('modal');if(!m||m.classList.contains('hidden'))return null;const fill=m.querySelector('#loadFill');if(!fill)return null;const status=m.querySelector('#loadStatus');
 const c=m.cloneNode(true),src=[m,...m.querySelectorAll('*')],dst=[c,...c.querySelectorAll('*')];if(src.length!==dst.length||src.length>40)return null;let css='';
 for(let i=0;i<src.length;i++){const cs=getComputedStyle(src[i]);let t='';for(let j=0;j<cs.length;j++){const p=cs[j];t+=p+':'+cs.getPropertyValue(p)+';';}
  const d=dst[i];d.removeAttribute('id');d.removeAttribute('class');d.style.cssText=t;d.style.transition='none';d.style.animation='none';
  if(src[i]===fill)d.style.width='100%';if(src[i]===status)d.textContent=TEXT;
  /* ::before·::after 로 그린 장식(제목 옆 낙관 등)도 같은 모습으로 — 인라인으로는 못 옮기므로 가림막 안 <style> 한 장에 */
  for(const pe of ['::before','::after']){const ps=getComputedStyle(src[i],pe),ct=ps&&ps.getPropertyValue('content');if(!ct||ct==='none'||ct==='normal')continue;
   let r='';for(let j=0;j<ps.length;j++){const q=ps[j];r+=q+':'+ps.getPropertyValue(q)+';';}d.setAttribute('data-r1138k',String(i));css+='#'+ID+' [data-r1138k="'+i+'"]'+pe+'{'+r+'transition:none;animation:none;}';}}
 if(css){const st=document.createElement('style');st.textContent=css;c.appendChild(st);}
 const s=c.style;s.position='fixed';s.left=s.top=s.right=s.bottom='0';s.width='auto';s.height='auto';s.pointerEvents='none';s.display=s.display==='none'?'flex':s.display;
 c.id=ID;c.setAttribute('aria-hidden','true');c.dataset.r1138='1';return c;}
function lift(reason){const c=cur;if(!c)return;cur=null;try{clearTimeout(c.timer);}catch(_){}try{c.el.remove();}catch(e){fail(e);}
 stats.lifted++;log.push({zone:c.zone,reason,frames:c.frames,ms:Math.round(now()-c.at),cave:c.cave||null});if(log.length>12)log.shift();}
function step(){const c=cur;if(!c)return;try{c.frames++;const why=blocker();if(why){lift('blocked:'+why);return;}
  if(now()-c.at>=CAP_MS){lift('cap');return;}
  const cv=caveState(c.frames);c.cave=cv;if(cv==='wait')c.readyAt=null;else if(c.readyAt==null)c.readyAt=cv==='ready'?c.frames:0;
  if(c.frames>=MIN_FRAMES&&c.readyAt!=null&&c.frames-c.readyAt>=SETTLE){lift(cv==='ready'?'ready':'plain');return;}}catch(e){fail(e);lift('error');return;}
 requestAnimationFrame(step);}
function show(el){if(cur)lift('replaced');const host=document.getElementById('modal')?.parentNode||document.body;host.insertBefore(el,document.getElementById('modal')?.nextSibling||null);
 const c={el,at:now(),frames:0,readyAt:null,zone:G('zone'),cave:null,timer:0};cur=c;stats.shown++;
 c.timer=setTimeout(()=>{if(cur===c)lift('timer');},CAP_MS+1000);/* 그리기 루프가 멈춰 있어도 반드시 걷힌다 */
 requestAnimationFrame(step);}
// 감싸기 ①: 로딩 창 닫기 — enterRegion 안에서, 로딩이 막 끝난(loading=false) 닫기에만
if(typeof closePanel==='function'){const base=closePanel;closePanel=function(force){let snap=null;
  try{if(depth>0&&force===true&&prefs.on)snap=snapshot();}catch(e){fail(e);snap=null;}
  const out=base.apply(this,arguments);
  try{if(snap){if(!G('loading')&&!G('modal')&&document.getElementById('modal')?.classList.contains('hidden'))show(snap);else stats.skipped++;}}catch(e){fail(e);if(cur)lift('error');}
  return out;};closePanel.__r1138=true;}
// 감싸기 ②: 지역 진입 — 안쪽인지 세기만 하고, 끝난 뒤(화면에 그려지기 전) 서사·창이 떴으면 바로 걷는다. 돌려주는 값은 원래 것 그대로.
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(){depth++;let out;try{out=base.apply(this,arguments);}catch(e){depth=Math.max(0,depth-1);throw e;}
  const done=()=>{depth=Math.max(0,depth-1);try{if(cur){const why=blocker();if(why)lift('blocked:'+why);}}catch(e){fail(e);}};
  try{Promise.resolve(out).then(done,done);}catch(e){fail(e);done();}
  return out;};enterRegion.__r1138=true;}
function set(p){if(p&&typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on&&cur)lift('off');return{...prefs};}
window.__STORYWORLD_TRANSITION_CURTAIN_R1138__=Object.freeze({revision:REV,KEY,ID,CAP_MS,MIN_FRAMES,SETTLE,NO_CAVE_FRAMES,set,
 inspect:()=>({revision:REV,prefs:{...prefs},active:!!cur,frames:cur?cur.frames:0,depth,stats:{...stats},log:log.map(x=>({...x})),lastError})});
})();
