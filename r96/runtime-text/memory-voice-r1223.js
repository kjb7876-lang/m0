// R1223 기억 조각 음성 기본 재생 + 바로 보이는 '음성 앞으로 끄기' — 사용자 2026-11-19 "스토리모드에서 기억조각 뜨면 음성도 기본적으로 나오게
//  다만 음성앞으로 끄기 기능도같이 바로보이게" + "사몽쪽도 같이 사몽에피소드랑".
//  점검: 주운 쪽지·기억 조각·진료기록·보고서 종이(R177 #r177Doc — 스토리, 스토리 사몽 세계, 사몽 에피소드가 모두 이 종이로 펼친다)는
//   문장 녹음(R381)이 있어도 소리가 없었다. 진행이 걸린 서사 창(R255 종이 모양)은 R1044 가 이미 녹음을 튼다.
//  ① 종이가 펼쳐지면(쪽마다) 그 쪽 글을 R370 과 같은 방법으로 문장으로 나눠, 녹음이 있는 문장을 차례로 튼다(기본 켜짐).
//     녹음이 없는 문장·조각은 조용히 넘어간다(브라우저 음성·새 녹음 없음). 음량은 문장마다 설정 '음성 음량'을 다시 읽는다.
//  ② 음성이 나오는 동안 종이가 저절로 넘어가지 않게 붙잡고(R177 의 마우스 올림과 같은 길), 다 읽으면 놓는다.
//     쪽을 넘기거나 닫으면 멈춘다. 다른 음성(서사 창·영화 모드)이 끼어들면 붙잡기를 놓는다. 늦게 온 끝 알림은 세대 번호로 버린다.
//  ③ 종이 머리와 서사 창 '계속' 옆에 '음성 앞으로 끄기' 단추. 누르면 바로 멈추고 이후 계속 꺼진 채 저장(storyworld.r1223.memvoice).
//     꺼진 동안은 같은 자리에 '음성 켜기'. 설정 창에도 같은 칸('기억 조각·서사 음성 자동 재생'). 끄면 R1044 서사 창 음성도 멈춘다.
//  ④ 설정 '서사 음성 자동 재생' 끔·음량 0·영화 모드·무한생존 중에는 틀지 않는다(그쪽이 음성을 맡음).
//  ⑤ 입장 영상(R617 해안 last302·R369 중독의 도시 ep1a10, 같은 꼴의 R368·R617 다른 편 포함): 영상 자막(.cap.on)이 뜨면 그 정본 문장 녹음을 튼다.
//     녹음이 자막보다 길어서 말하는 동안 영상을 0.8배, 밀린 말이 있으면 0.5배로 늦추고, 끝 1초 안에서 말이 남았으면 5초까지 멈춰 기다린다
//     (영상 모듈의 멈춤 감시 6초보다 짧게). 같은 끄기 단추를 건너뛰기 옆에 둔다. 선화 컷신(R880)은 제 음성(R888)이 있어 단추만 단다.
//  ⑥ 끈 동안에는 종이·서사 창·영상·선화 컷신이 떠 있을 때만 녹음 재생 길(R381 play)이 null 을 돌려준다(그쪽 모듈은 녹음 없음으로 보고 제 속도로 간다).
//     무한생존 자막·영화 모드 낭독은 막지 않는다.
//  서사 글은 바꾸지 않는다(종이 글을 읽기만 한다).
(()=>{'use strict';
if(window.__STORYWORLD_MEMORY_VOICE_R1223__)return;
const REV='R1223-memory-voice-1-R1284',KEY='storyworld.r1223.memvoice';
const stats={docs:0,played:0,ended:0,errors:0,skippedNoRec:0,silentDocs:0,halted:0,preempted:0,toggles:0,btn:0,sceneMuted:0,moduleErrors:0};let lastError=null;
const fail=e=>{stats.moduleErrors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const doc=()=>typeof document!=='undefined'?document:null;
let RAW=null;const R381=()=>RAW||window.__STORYWORLD_VOICE_R381__||null;
const VROOTS=Object.freeze(['r617v','r369v','r368v','r372v']),BROOTS=Object.freeze([...VROOTS,'r880']);
const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
const sett=()=>{try{return typeof settings!=='undefined'&&settings?settings:{};}catch(_){return {};}};
function vol(){const v=+sett().voice;return Number.isFinite(v)?clamp(v,0,1):.8;}
function allowed(){try{if(!on)return false;const s=sett();if(s.narration===false)return false;if(vol()<=0)return false;
 if(window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on)return false;
 if(window.__STORYWORLD_SURVIVAL_R600__?.active?.())return false;return true;}catch(e){fail(e);return false;}}
function split(text){try{const P=window.__STORYWORLD_CINEMA_MODE_R370__?.pure;if(P&&typeof P.sentences==='function')return P.sentences(text).map(s=>s.text);}catch(e){fail(e);}
 return String(text||'').split(/\n\s*\n/).flatMap(p=>p.replace(/\s+/g,' ').trim().split(/(?<=[.!?…])\s+/)).map(x=>x.trim()).filter(Boolean);}
// 종이에 지금 보이는 쪽 글(문단 <p>)과 머리(.h)
function pageOf(el){try{const ps=[...(el.querySelectorAll?.('p')||[])].map(p=>String(p.textContent||'').trim()).filter(Boolean);
 return {head:String(el.querySelector?.('.h')?.textContent||''),text:ps.join('\n\n')};}catch(e){fail(e);return {head:'',text:''};}}
// ---- 재생 ----
let gen=0,cur=null,sig=null,heldEl=null;
function hold(el,v){try{if(v){if(heldEl!==el){heldEl=el;el.dispatchEvent(new Event('mouseenter'));}}
 else if(heldEl){const h=heldEl;heldEl=null;if(!(h.matches&&h.matches(':hover')))h.dispatchEvent(new Event('mouseleave'));}}catch(e){fail(e);}}
function halt(){gen++;const h=cur;cur=null;if(h){stats.halted++;try{h.stop?.();}catch(_){}}hold(null,false);}
function start(el,text){const R=R381();if(!R||typeof R.has!=='function'||typeof R.play!=='function')return false;
 const all=split(text),list=all.filter(t=>{try{return R.has(t);}catch(_){return false;}});stats.skippedNoRec+=all.length-list.length;
 if(!list.length){stats.silentDocs++;return false;}
 stats.docs++;const my=++gen;let i=0;
 const next=()=>{if(my!==gen)return;cur=null;if(!allowed()||i>=list.length){hold(null,false);return;}
  const t=list[i++];let h=null;
  try{h=R.play(t,{rate:1,volume:vol(),onend:()=>{if(my!==gen)return;stats.ended++;next();},onerror:()=>{if(my!==gen)return;stats.errors++;next();}});}catch(e){fail(e);h=null;}
  if(!h){next();return;}stats.played++;cur=h;try{if(list[i])R.preload?.(list[i]);}catch(_){}};
 hold(el,true);next();return true;}
// ---- 단추 ----
const label=()=>on?'🔇 음성 앞으로 끄기':'🔊 음성 켜기';
function sync(){try{const d=doc();if(!d)return;for(const b of d.querySelectorAll('.r1223btn')){b.textContent=label();b.setAttribute('aria-pressed',on?'false':'true');}
 const c=d.getElementById('r1223Chk');if(c)c.checked=on;}catch(e){fail(e);}}
function set(v){on=!!v;stats.toggles++;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}
 if(!on){halt();vStop(true);try{window.__STORYWORLD_NARRATION_VOICE_R1044__?.halt?.();}catch(e){fail(e);}try{if(scene())R381()?.stop?.();}catch(e){fail(e);}}
 else{sig=null;try{const s=sett();if(s.narration===false)s.narration=true;}catch(_){}
  // R1284(사용자 2026-11-21 "그 단추를 눌러도 안풀림"): 켜면 지금 떠 있는 장면부터 바로 읽는다. 예전에는 저장만 바뀌고 서사 창은 다음 장면까지, 영상은 다음 자막까지 무음이었다.
  try{const N=window.__STORYWORLD_NARRATION_VOICE_R1044__;if(typeof storyScene!=='undefined'&&storyScene&&N&&!N.inspect?.().playing){N.start?.();stats.resumed=(stats.resumed||0)+1;}}catch(e){fail(e);}
  try{if(V){V.last='';}}catch(e){fail(e);}}
 sync();return on;}
function button(){const d=doc(),b=d.createElement('button');b.type='button';b.className='r1223btn';b.title='기억 조각·서사 음성 — 이후에도 이 설정이 유지됩니다(설정 창에도 있음)';
 b.textContent=label();b.setAttribute('aria-pressed',on?'false':'true');
 const stop=ev=>{try{ev?.stopPropagation?.();}catch(_){}};
 b.onclick=ev=>{stop(ev);try{ev?.preventDefault?.();}catch(_){}set(!on);try{step();}catch(e){fail(e);}};
 b.onpointerdown=stop;b.onmousedown=stop;b.ontouchstart=stop;stats.btn++;return b;}
function css(){try{const d=doc();if(!d?.head||d.getElementById('r1223Css'))return;const s=d.createElement('style');s.id='r1223Css';
 s.textContent='.r1223btn{font:600 11px/1.2 "Malgun Gothic","Noto Sans KR",sans-serif;cursor:pointer;border-radius:3px;padding:3px 7px;border:1px solid currentColor;background:#0003;color:inherit;opacity:.92;pointer-events:auto}'
  +'.r1223btn:hover,.r1223btn:focus-visible{opacity:1;outline:1px solid currentColor}'
  +'#r177Doc .r1223btn{float:right;margin:-4px -6px 4px 8px;position:relative;z-index:1}'
  +'#panel .r1223btn{margin:0 8px;align-self:center}'
  +BROOTS.map(id=>'#'+id+' .r1223btn').join(',')+'{position:absolute;z-index:6;right:max(16px,3vw);top:max(14px,3vh);color:#eef0f4;background:#0008;font-size:12px;padding:5px 10px}';d.head.appendChild(s);}catch(e){fail(e);}}
// ---- R1256: 영상 장면에서 '건너뛰기'와 겹치면 비켜 서기(사용자 11-20 "음성끄기랑 건너뛰기 같은곳에 있어서 겹침") ----
// r880 선화 컷신은 건너뛰기가 오른쪽 위라 이 단추(오른쪽 위)가 그대로 덮었다. 겹칠 때만 같은 줄 왼쪽 → 아래 → 위 순으로 옮긴다.
// 입장 영상 4종은 건너뛰기가 오른쪽 아래라 겹치지 않으므로 원래 자리 그대로. 화면 크기가 바뀌면 매번 원래 자리에서 다시 잰다.
const fin=v=>typeof v==='number'&&Number.isFinite(v);
function place(sk,bw,bh,vw,vh,gap=8,m=6){if(!sk||![sk.left,sk.top,sk.right,sk.bottom,bw,bh,vw,vh].every(fin)||bw<=0||bh<=0||vw<=0||vh<=0)return null;
 const fits=(x,y)=>x>=m&&y>=m&&x+bw<=vw-m&&y+bh<=vh-m,cy=(sk.top+sk.bottom)/2;
 const c=[[sk.left-gap-bw,cy-bh/2],[sk.right-bw,sk.bottom+gap],[sk.right-bw,sk.top-gap-bh],[sk.left-bw,sk.bottom+gap]];
 for(const [x,y] of c)if(fits(x,y))return {left:Math.round(x),top:Math.round(y)};
 return {left:Math.round(clamp(c[1][0],0,Math.max(0,vw-bw))),top:Math.round(clamp(c[1][1],0,Math.max(0,vh-bh)))};}
function unclash(r){try{const b=r.querySelector('.r1223btn'),sk=r.querySelector('.skip');if(!b||!sk||!b.getBoundingClientRect)return;
 const st=b.style;if(st.left||st.top){st.left='';st.top='';st.right='';st.bottom='';}
 const q=b.getBoundingClientRect(),k=sk.getBoundingClientRect();if(!(k.width>0&&k.height>0&&q.width>0))return;
 if(!(q.left<k.right+4&&k.left<q.right+4&&q.top<k.bottom+4&&k.top<q.bottom+4))return;
 const w=(typeof innerWidth==='number'?innerWidth:0)||r.clientWidth,h=(typeof innerHeight==='number'?innerHeight:0)||r.clientHeight;
 const pos=place(k,q.width,q.height,w,h);if(!pos)return;const R=r.getBoundingClientRect();
 st.right='auto';st.bottom='auto';st.left=Math.round(pos.left-R.left)+'px';st.top=Math.round(pos.top-R.top)+'px';stats.unclash=(stats.unclash||0)+1;}catch(e){fail(e);}}
// ---- 종이 감시(쪽마다) ----
function step(){try{gate();const d=doc();if(!d)return;
 for(const id of BROOTS){const r=d.getElementById(id);if(r&&!r.querySelector('.r1223btn')){css();const sk=r.querySelector('.skip');r.insertBefore(button(),sk||null);}if(r)unclash(r);}
 try{vStep(d);}catch(e){fail(e);}
 const el=d.getElementById('r177Doc');
 if(!el||el.hidden){if(sig!==null){sig=null;halt();}return;}
 if(!el.querySelector('.r1223btn')){css();el.insertBefore(button(),el.children?.[0]||el.firstChild||null);}
 const pg=pageOf(el),k=pg.head+'\u0001'+pg.text;
 if(k===sig){// 다른 음성이 끼어들어 내 문장이 끊겼으면 붙잡기를 놓는다
  if(cur){const p=R381()?.inspect?.()?.playing;if(p!==undefined&&p!==cur.id){stats.preempted++;gen++;cur=null;hold(null,false);}}return;}
 sig=k;halt();if(allowed())start(el,pg.text);}catch(e){fail(e);}}
// ---- 입장 영상 자막 ----
let V=null;// {root,last,queue,cur,gen,holdAt}
// R1272(사용자 2026-11-20 "맵씬영상에서 오디오 서사음성 안들리는문제개선"): 실측 — 영상 자체 소리(평균 -17.5dB)가 낭독 녹음(-24.3dB)보다 약 7dB 커서 말을 덮었다.
//  ⑦ 낭독이 나오는 동안만 영상 소리를 원래 음량의 DUCK 배로 낮추고(약 -16dB, 음소거는 아님. 낭독이 영상 소리보다 약 8dB 위), 말이 끝나거나 끄기·영상 닫힘 때 원래 음량으로 되돌린다.
//  ⑧ 영상 자막이 정본 문장을 말줄임(…)으로 줄인 것이면 녹음이 없다 → 정본에서 그 앞부분으로 시작하는 원문 문장을 찾아 그 녹음을 튼다(6자 미만은 추측하지 않음).
const DUCK=.15;
function vBase(v){if(!Number.isFinite(v.__r1272base)){const x=+v.volume;v.__r1272base=Number.isFinite(x)?clamp(x,0,1):1;}return v.__r1272base;}
function vVol(v,busy){try{const b=vBase(v),want=busy&&b>0?b*DUCK:b;if(Math.abs((+v.volume||0)-want)>1e-6){v.volume=want;if(busy)stats.ducked=(stats.ducked||0)+1;}}catch(e){fail(e);}}
let canonTexts=null;const fullCache=new Map();
function canon(){if(canonTexts)return canonTexts;const out=[];const walk=(x,d)=>{if(d>6||!x)return;if(typeof x==='string'){if(x.length>20)out.push(x);return;}if(typeof x==='object')for(const k of Object.keys(x))walk(x[k],d+1);};
 try{walk(window.__STORYWORLD_STORY_CANON_R106__,0);}catch(e){fail(e);}if(out.length)canonTexts=out;return out;}
function fullOf(t){const pre=String(t||'').replace(/(…|\.{3})+\s*$/,'').trim();if(pre===String(t||'').trim()||pre.length<6)return null;if(fullCache.has(pre))return fullCache.get(pre);
 let hit=null;for(const x of canon()){const i=x.indexOf(pre);if(i<0)continue;const par=x.slice(i).split(/\n\s*\n/)[0];const f=split(par)[0];if(f&&f.startsWith(pre)){hit=f;break;}}
 fullCache.set(pre,hit);return hit;}
function vStop(resume){if(!V)return;V.gen++;const h=V.cur;V.cur=null;V.queue.length=0;if(h){stats.halted++;try{h.stop?.();}catch(_){}}
 const v=V.root?.querySelector?.('video');if(v){try{v.playbackRate=1;}catch(_){}vVol(v,false);if(V.holdAt&&resume!==false){V.holdAt=0;try{v.play?.()?.catch?.(()=>{});}catch(_){}}}V.holdAt=0;}
function vNext(){if(!V||V.cur||!V.queue.length||!allowed())return;const R=R381();const t=V.queue.shift(),my=V.gen,o=V;let h=null;
 try{h=R.play(t,{rate:1,volume:vol(),onend:()=>{if(my!==o.gen)return;stats.ended++;o.cur=null;vNext();},onerror:()=>{if(my!==o.gen)return;stats.errors++;o.cur=null;vNext();}});}catch(e){fail(e);}
 if(!h){vNext();return;}stats.played++;V.cur=h;stats.videoLines=(stats.videoLines||0)+1;}
function vStep(d){let root=null;for(const id of VROOTS){const e=d.getElementById(id);if(e){root=e;break;}}
 if(!root){if(V){vStop(false);V=null;}return;}
 if(!V||V.root!==root){if(V)vStop(false);V={root,last:'',queue:[],cur:null,gen:0,holdAt:0};}
 const cap=root.querySelector('.cap'),on1=cap&&String(cap.className||'').split(/\s+/).includes('on'),text=on1?String(cap.textContent||'').trim():'';
 if(text&&text!==V.last){V.last=text;if(allowed()){const R=R381();for(const t of split(text)){let ok=false,u=t;try{ok=!!R?.has?.(t);if(!ok){const f=fullOf(t);if(f&&R?.has?.(f)){ok=true;u=f;stats.fullLines=(stats.fullLines||0)+1;}}}catch(e){fail(e);}if(ok)V.queue.push(u);else stats.skippedNoRec++;}}}
 if(!text)V.last='';
 vNext();
 const v=root.querySelector('video');if(!v)return;const busy=!!V.cur||V.queue.length>0;
 try{const want=!busy?1:V.queue.length?.5:.8;if(v.playbackRate!==want)v.playbackRate=want;}catch(e){fail(e);}
 vVol(v,busy);
 const left=(+v.duration||0)-(+v.currentTime||0);
 if(busy&&!V.holdAt&&+v.duration>0&&left<1&&!v.paused){V.holdAt=now();try{v.pause();stats.endHolds=(stats.endHolds||0)+1;}catch(e){fail(e);}}
 else if(V.holdAt&&(!busy||now()-V.holdAt>5000)){V.holdAt=0;try{v.play?.()?.catch?.(()=>{});}catch(e){fail(e);}}}
// ---- 끈 동안 장면 음성 막기(녹음 재생 길) ----
function scene(){try{const d=doc();if(!d)return false;if(typeof storyScene!=='undefined'&&storyScene)return true;const p=d.getElementById('r177Doc');if(p&&!p.hidden)return true;
 for(const id of VROOTS)if(d.getElementById(id))return true;return !!window.__STORYWORLD_LINEART_R880__?.inspect?.()?.active;}catch(e){fail(e);return false;}}
// 녹음 모듈(voice-r381)은 이 파일보다 뒤에 실리므로 처음 볼 때(실릴 때·감시 때마다) 한 번 감싼다.
function gate(){try{const raw=window.__STORYWORLD_VOICE_R381__;if(raw&&typeof raw.play==='function'&&!raw.r1223){RAW=raw;
 window.__STORYWORLD_VOICE_R381__=Object.freeze({...raw,r1223:true,play:(t,o)=>{if(!on&&scene()){stats.gated=(stats.gated||0)+1;return null;}return raw.play(t,o);}});}}catch(e){fail(e);}}
gate();
// ---- 서사 창(R255 종이 모양, R1044 음성) ----
if(doc()){
 try{if(typeof advanceScene==='function'){const base=advanceScene;advanceScene=function(...a){const r=base.apply(this,a);
   try{if(!on&&typeof storyScene!=='undefined'&&storyScene){stats.sceneMuted++;window.__STORYWORLD_NARRATION_VOICE_R1044__?.halt?.();}
    const d=doc(),nx=d.getElementById('storyNext'),pn=d.getElementById('panel');
    if(nx&&nx.parentNode&&pn&&!pn.querySelector('.r1223btn')&&typeof storyScene!=='undefined'&&storyScene){css();nx.parentNode.insertBefore(button(),nx);}}catch(e){fail(e);}
   return r;};}}catch(e){fail(e);}
 try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);
   try{const d=doc(),grid=d.querySelector('#panel .settings');if(grid&&!d.getElementById('r1223Chk')){const l=d.createElement('label'),c=d.createElement('input'),s=d.createElement('span');
    l.id='r1223Row';c.type='checkbox';c.id='r1223Chk';c.checked=on;c.onchange=()=>set(!!c.checked);s.textContent=' 기억 조각·서사 음성 자동 재생 (끄면 이후 계속 꺼짐)';
    l.appendChild(c);l.appendChild(s);grid.appendChild(l);}}catch(e){fail(e);}
   // R1277(사용자 11-20 "777 페르소나 7대죄 맵 … 서사음성 다켰는데 안들림"): 엔진 칸 '서사 음성 자동 재생'을 켜면(체크) 이 모듈의 저장된 꺼짐도 같이 켠다.
   //  두 칸이 따로 저장돼, 예전에 눌린 '음성 앞으로 끄기'가 남아 있으면 설정을 다 켜도 모든 장면 음성이 막혔다. 끄기(체크 해제)는 그 칸 자체로 무음이라 건드리지 않는다.
   try{const n=doc()?.querySelector?.('#panel input[data-setting="narration"]');if(n&&!n.__r1277){n.__r1277=true;n.addEventListener('change',()=>{try{if(n.checked&&!on){set(true);stats.unified=(stats.unified||0)+1;}}catch(e){fail(e);}});}}catch(e){fail(e);}
   return r;};}}catch(e){fail(e);}
 try{setInterval(step,250);}catch(e){fail(e);}}
window.__STORYWORLD_MEMORY_VOICE_R1223__=Object.freeze({revision:REV,step,set,halt,split,place,
 prefs:()=>({on}),inspect:()=>({revision:REV,on,playing:!!cur,held:!!heldEl,allowed:allowed(),volume:vol(),stats:{...stats},lastError})});
})();
