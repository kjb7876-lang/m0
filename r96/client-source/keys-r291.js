// R291 — 스킬·공격 키를 QWER + ASDF 로(사용자 2026-11-04 "스킬및 공격 공명등키를 qwer,asdf 로 변경해주고 나머지 상호작용키는 다른키로 해줘").
//  Q 고유기 · W 본편 W · E 본편 E · R 본편 R  /  A 기본 공격(누르기) · S 블링크 · D 공명방어(누르기) · F EGO.
//  상호작용은 E → C. 숫자 1~5 는 그대로, 6·7·8 = W·E·R. 예전 Z·X(본편 W·E) 는 새 배치에서 아무 일도 하지 않는다.
//  Space 반자동 · M 지도 · P 강화 · G/T 황금실·은실 · L 조명 · J 공격 별칭 · Esc 메뉴 · 방향키 이동은 그대로.
//
//  방법: 엔진·오버레이 키 처리기는 손대지 않고, window capture 단계(가장 먼저)에서 "실제로 누른 키"를 엔진이 알던
//  "논리 키"로 바꿔 적는다(이벤트의 key 속성만 덮어씀 — 새 이벤트를 만들지 않으므로 isTrusted·preventDefault·
//  stopPropagation·repeat·keyup 짝이 그대로이고 두 번 불릴 일이 없다).
//     W→'z' · E→'x' · R→'c' · C→'e' · 6→'z' · 7→'x' · 8→'c' · Z·X→'Unidentified'(아무 처리기도 받지 않음)
//  엔진(index keydown) 은 'e' 를 상호작용으로, 본편 W/E/R 처리기(bindings z/x/c) 와 R247 미카엘라(z/x) 는 그대로 받는다.
//  R247 은 이 파일보다 먼저 capture 로 듣기 때문에 그 처리기 안에서 translate(ev) 를 먼저 부른다(같은 이벤트는 한 번만 바뀐다).
//  한글 입력 상태(키 값이 'ㅁ'·'Process' 등)에서도 ev.code(KeyA…)로 글자를 찾아 같은 배치로 받는다.
//  입력칸(INPUT·TEXTAREA·SELECT·contentEditable)과 Ctrl/Alt/Meta 조합은 건드리지 않는다(777 코드 입력·복사·새로고침 그대로).
//  화면 글자는 index 의 KR291 표 하나에서 읽는다. localStorage 'storyworld.r291.keys'='legacy' → 예전 배치·예전 글자.
//  저장 파일·판정·재사용 대기·모바일 단추는 바뀌지 않는다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_KEYS_R291__)return;
const REV='R291-keys-1',STORE='storyworld.r291.keys';
let legacy=false;
try{legacy=(typeof KR291!=='undefined'&&KR291)?!!KR291.legacy:window.localStorage?.getItem(STORE)==='legacy';}catch(_){legacy=false;}
const NONE='Unidentified';
// 실제 키(소문자) → 엔진이 아는 논리 키. 여기 없는 키는 그대로 지나간다.
const MAP=Object.freeze({w:'z',e:'x',r:'c',c:'e','6':'z','7':'x','8':'c',z:NONE,x:NONE});
// 화면·검사용 배치 표(동작 → 실제 키). 'native' 는 엔진이 원래 받던 논리 키.
const TABLE=Object.freeze(legacy?{
 attack:['a','1','j'],blink:['s','2'],guard:['d','3'],special:['q','4'],ego:['f','5'],
 skillW:['z'],skillE:['x'],skillR:['c'],interact:['e'],auto:[' '],map:['m'],upgrades:['p'],menu:['Escape']
}:{
 attack:['a','1','j'],blink:['s','2'],guard:['d','3'],special:['q','4'],ego:['f','5'],
 skillW:['w','6'],skillE:['e','7'],skillR:['r','8'],interact:['c'],auto:[' '],map:['m'],upgrades:['p'],menu:['Escape']
});
const stats={down:0,up:0,translated:0,swallowed:0,ime:0,skippedEditing:0,skippedModifier:0,errors:0};let lastError=null;
const recent=[];const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const done=new WeakSet();
function editing(t){try{return !!t&&(['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||t.isContentEditable===true||!!t.closest?.('[contenteditable]:not([contenteditable="false"])'));}catch(_){return false;}}
// 누른 글자: 키 값이 영문·숫자 한 글자면 그것, 한글 입력(자모 한 글자·'Process')이면 ev.code 에서.
function physical(ev){const k=String(ev.key??'');
 if(k.length===1&&/[A-Za-z0-9]/.test(k))return{p:k.toLowerCase(),ime:false};
 if((k.length===1&&k.charCodeAt(0)>127)||k==='Process'||k===NONE){const c=String(ev.code||''),m=/^Key([A-Z])$/.exec(c)||/^Digit([0-9])$/.exec(c)||/^Numpad([0-9])$/.exec(c);if(m)return{p:m[1].toLowerCase(),ime:true};}
 return null;}
function setKey(ev,v){Object.defineProperty(ev,'key',{configurable:true,enumerable:true,get:()=>v});}
function translate(ev){try{
 if(!ev||typeof ev!=='object'||done.has(ev))return ev;done.add(ev);
 if(legacy)return ev;
 if(ev.ctrlKey||ev.metaKey||ev.altKey){stats.skippedModifier++;return ev;}
 if(editing(ev.target)){stats.skippedEditing++;return ev;}
 const ph=physical(ev);if(!ph)return ev;const from=String(ev.key);
 let to=Object.prototype.hasOwnProperty.call(MAP,ph.p)?MAP[ph.p]:(ph.ime?ph.p:null);
 if(to==null)return ev;
 if(to!==NONE&&ev.shiftKey&&/^[a-z]$/.test(to))to=to.toUpperCase();
 setKey(ev,to);if(ph.ime)stats.ime++;if(to===NONE)stats.swallowed++;else stats.translated++;
 if(recent.length>=24)recent.shift();recent.push({type:ev.type,code:ev.code||'',from,to});
 return ev;}catch(e){fail(e);return ev;}}
function onKey(ev){if(ev.type==='keydown')stats.down++;else stats.up++;translate(ev);}
window.addEventListener('keydown',onKey,true);window.addEventListener('keyup',onKey,true);
// 이 키(엔진 논리 키)로 바뀌는가 — 검사·도구용.
function logical(key,opts={}){const ev={key,code:opts.code||'',shiftKey:!!opts.shift,ctrlKey:!!opts.ctrl,metaKey:false,altKey:!!opts.alt,target:opts.target||null,type:'keydown'};translate(ev);return ev.key;}
// 지금 쓸 수 있는 본편 칸의 키 글자만(R209 중복 정리로 꺼진 칸은 빼서 죽은 키를 안내하지 않는다).
//  R209: 모든 영웅 E 칸(돌진 = 블링크 S), 미카엘라·기억사수 W 칸(= 공명방어 D) — storyworld.r209.skills {dedupe:false} 면 다시 켜짐.
//  R247: 미카엘라 W·E 는 새 스킬이 맡으므로 살아 있다. hero 를 안 주면 지금 영웅(없으면 어느 영웅이든 쓸 수 있는 칸).
const HEROES8=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
function slotLive(hero,slot){try{const R=window.__STORYWORLD_SKILLS_R209__;if(!R?.removed?.(hero,slot))return true;return hero==='michaela'&&(slot==='w'||slot==='e')&&!!window.__STORYWORLD_MICHAELA_R247__?.on?.();}catch(_){return true;}}
function liveSlots(hero){if(hero===undefined){try{hero=(typeof player==='object'&&player&&typeof started!=='undefined'&&started)?player.hero:null;}catch(_){hero=null;}}
 return ['w','e','r'].filter(sl=>hero?slotLive(hero,sl):HEROES8.some(h=>slotLive(h,sl)));}
function letters(){return (typeof KR291!=='undefined'&&KR291)?KR291:{w:legacy?'Z':'W',e:legacy?'X':'E',r:legacy?'C':'R'};}
function werLabel(sep=' / ',hero){const L=letters(),s=liveSlots(hero);return s.length?s.map(sl=>L[sl]).join(sep):'-';}
// legacy: 정적 HTML 두 곳(첫 화면 안내·미니맵 포탈 글자)만 예전 글자로 되돌린다. 나머지 글자는 KR291 을 읽는다.
function staticText(){try{for(const el of document.querySelectorAll('.r291-wer'))el.textContent=werLabel(' / ',null);if(!legacy)return;for(const el of document.querySelectorAll('.r291-i'))el.textContent='E';const m=document.getElementById('miniLabel');if(m&&m.textContent==='포탈 앞에서 C · 이동')m.textContent='포탈 앞에서 E · 이동';}catch(e){fail(e);}}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',staticText);else staticText();}
window.__STORYWORLD_KEYS_R291__=Object.freeze({rev:REV,storageKey:STORE,legacy,map:legacy?{}:MAP,table:TABLE,translate,logical,liveSlots,werLabel,
 inspect:()=>({rev:REV,legacy,stats:{...stats},recent:recent.slice(),lastError})});
})();
