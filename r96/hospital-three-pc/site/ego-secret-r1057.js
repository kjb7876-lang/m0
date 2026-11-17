/* R1057 영웅 선택창 비밀 입력 777 → 히든 영웅 EGO (사용자 2026-11-15 11:57Z "영웅창에서 777 누르면(입력창 없이) 모든 영웅창 없어지고 히든영웅 EGO 나오게").
 *  · 어디서: 영웅 선택창만 — 처음부터 시작(슬롯 확인 #heroRowR101) · 거점 영웅 변경(#chooseHero). 창이 닫혀 있으면(전투 중 7 = E 스킬) 세지 않는다.
 *  · 키: 숫자열 7·텐키 7(NumLock 꺼짐 포함). R291 이 key 를 바꾸므로 code 로 읽는다. Shift/Ctrl/Alt/Meta 낀 7·자동 반복·입력칸 안은 무시.
 *  · 순서: 7·7·7 을 1.5초 간격 안에 연속으로. 간격이 넘거나 다른 키가 끼면 처음부터(수정 키 단독은 그대로).
 *  · 발동: S-07 해금 여부와 상관없이 R1046 EGO 를 해금(unlock 'secret-777', 저장됨)하고 #panel 에 r1057secret class → 다른 영웅 칸을 모두 숨기고 EGO 칸만 남겨 자동 선택.
 *    창이 닫히면 원래대로(다음에 열면 평소 줄; 해금은 남으므로 EGO 칸은 환도 옆에 계속 보인다).
 *  · 모바일(R1057b): 영웅창 제목을 1.5초 간격 안에 7번 연속 탭해도 같다(다른 곳 탭이 끼면 처음부터).
 *  · EGO 칸 자리는 R1046 이 정한다(R1048 이 0번째로 옮겨도 [data-ego-r1046] 로 찾으므로 무관).
 */
(()=>{'use strict';
const REV='R1057-ego-secret-777',GAP_MS=1500,NEED=3,CLS='r1057secret';
const stats={keys:0,counted:0,resets:0,fires:0,picks:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let count=0,lastAt=NaN,active=false,picked=false;
const ego=()=>{try{return window.__STORYWORLD_EGO_SOVEREIGN_R1046__||null;}catch(_){return null;}};
const nowMs=()=>{try{return Number(performance.now());}catch(_){return Date.now();}};
const MODS=new Set(['Shift','Control','Alt','Meta','AltGraph','CapsLock','NumLock','OS','Fn']);
function isSeven(ev){if(!ev||typeof ev!=='object')return false;if(ev.shiftKey||ev.ctrlKey||ev.altKey||ev.metaKey)return false;
 const c=String(ev.code||'');if(c)return c==='Digit7'||c==='Numpad7';return String(ev.key)==='7';}
function editing(t){try{return !!t&&(['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||t.isContentEditable===true||!!t.closest?.('[contenteditable]'));}catch(_){return false;}}
function hasDoc(){return typeof document!=='undefined'&&!!document&&typeof document.getElementById==='function';}
function heroPanelOpen(){if(!hasDoc())return false;const m=document.getElementById('modal'),p=document.getElementById('panel');
 if(!m||!p||m.classList?.contains('hidden'))return false;return !!(p.querySelector('#heroRowR101 [data-hero]')||p.querySelector('#chooseHero'));}
function css(){if(!hasDoc()||document.getElementById('r1057Css'))return;const s=document.createElement('style');s.id='r1057Css';
 s.textContent='#panel.'+CLS+' button[data-hero]{display:none!important}\n#panel.'+CLS+' .heroRowR101,#panel.'+CLS+' .cards{justify-content:center}';document.head.appendChild(s);}
function fire(){stats.fires++;active=true;picked=false;try{ego()?.unlock?.('secret-777');}catch(e){fail(e);}poll();}
function onKey(ev){try{if(!ev||ev.type!=='keydown')return;stats.keys++;if(editing(ev.target))return;
 const k=String(ev.key||'');if(MODS.has(k))return;
 if(!heroPanelOpen()){count=0;return;}
 if(!isSeven(ev)){if(count){count=0;stats.resets++;}return;}
 if(ev.repeat)return;
 const t=nowMs();if(!(Number.isFinite(t)&&Number.isFinite(lastAt)&&t>=lastAt&&t-lastAt<=GAP_MS)){if(count)stats.resets++;count=0;}
 count++;lastAt=Number.isFinite(t)?t:NaN;stats.counted++;
 if(count>=NEED){count=0;lastAt=NaN;if(!active)fire();}}catch(e){fail(e);}}
// R1057b 모바일 대안(사용자 13:18Z 승인): 영웅창 제목(#panel h2)을 1.5초 간격 안에 7번 연속 탭. 다른 곳 탭이 끼면 처음부터.
const TAPS=7;let tapCount=0,tapAt=NaN;
function onTap(ev){try{if(!ev||ev.type!=='click')return;if(!heroPanelOpen()){tapCount=0;return;}
 const onTitle=!!ev.target?.closest?.('#panel h2');if(!onTitle){if(tapCount){tapCount=0;stats.resets++;}return;}
 const t=nowMs();if(!(Number.isFinite(t)&&Number.isFinite(tapAt)&&t>=tapAt&&t-tapAt<=GAP_MS))tapCount=0;
 tapCount++;tapAt=Number.isFinite(t)?t:NaN;stats.taps=(stats.taps||0)+1;
 if(tapCount>=TAPS){tapCount=0;tapAt=NaN;if(!active)fire();}}catch(e){fail(e);}}
function poll(){try{if(!hasDoc())return;const p=document.getElementById('panel');
 if(!heroPanelOpen()){if(active||p?.classList?.contains(CLS)){active=false;picked=false;p?.classList?.remove(CLS);}return;}
 if(!active)return;css();p.classList.add(CLS);try{ego()?.refresh?.();}catch(e){fail(e);}
 const c=p.querySelector('[data-ego-r1046]');if(c&&!picked){picked=true;if(!c.classList?.contains('selected')){stats.picks++;c.click();}}}catch(e){fail(e);}}
function wrapOpen(){try{if(typeof openPanel!=='function'||openPanel.__r1057)return;const base=openPanel;const w=function(...a){const r=base.apply(this,a);poll();return r;};w.__r1057=true;openPanel=w;}catch(e){fail(e);}}
try{window.addEventListener('keydown',onKey,true);}catch(e){fail(e);}
try{window.addEventListener('click',onTap,true);}catch(e){fail(e);}
wrapOpen();try{if(typeof setInterval==='function')setInterval(()=>{wrapOpen();poll();},120);}catch(e){fail(e);}
window.__STORYWORLD_EGO_SECRET_R1057__=Object.freeze({revision:REV,gapMs:GAP_MS,isSeven,heroPanelOpen,poll,
 inspect:()=>({revision:REV,count,tapCount,active,picked,stats:{...stats},lastError})});
})();
