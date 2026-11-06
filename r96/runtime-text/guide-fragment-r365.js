// R365 — 사용자 2026-11-06 "기억조각창을 길잡이에서도 키고 끌수있도록 설정에추가" + 같은 날 "직접조작시에도 서사넘기기,기억조각및쪽지생략기능추가".
//  · 설정 '길잡이 중 기억 조각·쪽지 창 표시' / '직접 조작 중 기억 조각·쪽지 창 표시'(둘 다 기본 켜짐 = 예전 그대로).
//    끄면 그 상황에서 주운 쪽지·기억 조각 창(R177 오른쪽 종이, R169 기억 쪽지·R162 단서조각도 같은 창)을 펼치지 않는다.
//    조각은 R177 이 펼치기 전에 이미 쪽지 모음에 넣으므로(keep → show) 그대로 기록되고 짧은 알림만 띄운다. E 로 직접 연 기록(force)은 그대로.
//  · 설정 '서사 창 자동 넘기기(쪽지 모음에 기록)'(기본 꺼짐): '계속'을 눌러야 넘어가는 서사 창(R255 보스 문·출구·최종장 등)을 바로 넘긴다.
//    엔진 advanceScene 을 그대로 거듭 불러 넘기므로 읽음 기록(readScenes)과 끝난 뒤 하던 일(보스 전투·문·지역 완료·저장)이 그대로 돈다.
//    넘긴 서사는 쪽지 모음(R169)에 'story:열쇠'로 넣는다(기억의 기록 원문도 그대로). 기억 책에서 직접 여는 읽기(journal:)는 넘기지 않는다.
//  · 서사 창에 '건너뛰기' 단추(남은 장면을 같은 방식으로 한 번에 넘김)를 단다.
//  · localStorage storyworld.r365.guideFragment {show, manual, skipStory} — 예전 {show} 그대로 읽힌다.
(()=>{'use strict';
if(window.__STORYWORLD_GUIDE_FRAGMENT_R365__)return;
const REV='R365-guide-fragment-2',KEY='storyworld.r365.guideFragment';
let prefs={show:true,manual:true,skipStory:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={held:0,heldManual:0,skipped:0,recorded:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const guiding=()=>{try{return typeof guide!=='undefined'&&!!guide;}catch(_){return false;}};
const FORMS={chart:'진료기록',shard:'기억 조각',report:'누군가의 보고서',note:'쪽지'};
const bool=(p,k)=>p&&k in p?p[k]!==false:prefs[k]!==false;
function set(p){prefs={...prefs,...p,show:bool(p,'show'),manual:bool(p,'manual'),skipStory:p&&'skipStory' in p?!!p.skipStory:!!prefs.skipStory};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
// R177 show() 가 묻는다: true 면 창을 펼치지 않는다(조각은 이미 쪽지 모음에 있음).
function hold(doc){const g=guiding();if(g?prefs.show!==false:prefs.manual!==false)return false;if(g)stats.held++;else stats.heldManual++;
 try{if(typeof toast==='function')toast((FORMS[doc?.form]||'쪽지')+'을(를) 쪽지 모음에 넣었습니다 · '+(g?'길잡이':'직접 조작')+' 중 창 끔(설정)',1.8);}catch(_){}return true;}
// ── 서사 넘기기 ──
const cur=()=>{try{return typeof storyScene!=='undefined'?storyScene:null;}catch(_){return null;}};
const journal=s=>/^journal:/.test(String(s?.key||''));
function record(s){try{if(!s||!s.key||typeof s.text!=='string'||!s.text.trim())return;let place='';try{place=regionById?.[s.id]?.title||'';}catch(_){}
 if(window.__STORYWORLD_PLAY_R169__?.collect?.({key:'story:'+s.key,title:'서사 · '+(s.title||'기억'),narr:s.narrator||'',text:s.text,place}))stats.recorded++;}catch(e){fail(e);}}
let skipping=false;
// 지금 장면부터 기록하고 엔진 advanceScene 을 거듭 불러 넘긴다 — 마지막에 엔진이 창을 닫고 done(진행)을 한 번 부른다.
function skipAll(base,self,args){let r,n=0;skipping=true;try{while(cur()&&!journal(cur())&&n<200){record(cur());stats.skipped++;n++;r=base.apply(self,args);}}finally{skipping=false;}
 if(n)try{if(typeof toast==='function')toast('서사 '+n+'장을 넘겼습니다 · 쪽지 모음에 기록',1.8);}catch(_){}return r;}
function button(base){try{const s=cur();if(!s||journal(s))return;const foot=document.getElementById('panel')?.querySelector?.('.storyFoot');if(!foot||document.getElementById('r365Skip'))return;
 const b=document.createElement('button');b.id='r365Skip';b.textContent='건너뛰기';b.title='남은 서사를 넘깁니다(쪽지 모음에 기록, 진행은 그대로)';b.onclick=()=>{try{skipAll(base,null,[]);}catch(e){fail(e);}};
 const nx=document.getElementById('storyNext');if(nx&&nx.parentNode===foot)foot.insertBefore(b,nx.nextSibling);else foot.appendChild(b);}catch(e){fail(e);}}
try{if(typeof advanceScene==='function'){const base=advanceScene;advanceScene=function(...a){let r=base.apply(this,a);if(skipping)return r;
 try{if(prefs.skipStory&&cur()&&!journal(cur()))r=skipAll(base,this,a);else button(base);}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings');if(grid&&!document.getElementById('r365GuideFrag')){
 let after=document.getElementById('r253SecsRow');if(!(after&&after.parentNode===grid))after=null;
 for(const [rid,id,k,label,tip] of [
  ['r365GuideFragRow','r365GuideFrag','show','길잡이 중 기억 조각·쪽지 창 표시','끄면 길잡이로 가는 동안 주운 쪽지·기억 조각을 창으로 펼치지 않고 쪽지 모음에만 넣습니다'],
  ['r365ManualFragRow','r365ManualFrag','manual','직접 조작 중 기억 조각·쪽지 창 표시','끄면 손으로 움직일 때 주운 쪽지·기억 조각을 창으로 펼치지 않고 쪽지 모음에만 넣습니다'],
  ['r365SkipStoryRow','r365SkipStory','skipStory','서사 창 자동 넘기기(쪽지 모음에 기록)','켜면 \'계속\'을 눌러야 하는 서사 창을 바로 넘깁니다. 글은 쪽지 모음·기억의 기록에 남고 진행은 그대로입니다']]){
  const l=document.createElement('label'),c=document.createElement('input');l.id=rid;c.type='checkbox';c.id=id;c.checked=k==='skipStory'?!!prefs.skipStory:prefs[k]!==false;l.title=tip;
  c.onchange=()=>set({[k]:c.checked});l.appendChild(c);l.appendChild(document.createTextNode(' '+label));
  if(after&&after.nextSibling)grid.insertBefore(l,after.nextSibling);else grid.appendChild(l);after=l;}}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_GUIDE_FRAGMENT_R365__=Object.freeze({revision:REV,set,hold,prefs:()=>({...prefs}),inspect:()=>({revision:REV,prefs:{...prefs},guiding:guiding(),stats:{...stats},lastError})});
})();
