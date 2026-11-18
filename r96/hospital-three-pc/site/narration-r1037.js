// R1037 서사 텍스트 항상 끄기 — 사용자 2026-11-14 "보스입장할때 나오는 서사텍스트+ 기억조각에 나오는 서사텍스트 거기에 지금안쓰는 ui들 없애고
//  거기에 텍스트항상끄기 만들어서 항상끄기 누르면 보스방 입장시 바로입장및 앞으로 서사텍스트 안뜨도록 설정가서 키면 다시뜨고 기억조각도 마찬가지,
//  영화서사텍스트도 키고끄는거 잘되도록, 모든 모드 서사텍스트 점검 및 개선 키고 끄는거".
//  ① 서사 창(보스 문 '전투 전'·출구 '전투 후'·조형물·최종장 — R255 쪽지 모양 창) 아래 단추 줄에 '텍스트 항상 끄기'.
//     누르면 R365 '서사 창 자동 넘기기'를 켜고 남은 장면을 엔진 advanceScene 으로 넘긴다(읽음 기록·쪽지 모음 기록·끝난 뒤 진행은 그대로).
//     다음 서사 창부터는 뜨지 않고 바로 진행되며, 보스 구역 이름 카드(R255, 약 3.4초)도 띄우지 않는다(바로 입장).
//  ② 안 쓰는 UI: 연결된 녹음이 없는 장면(지금 정본 180장면 모두 — 녹음은 #320 으로 보류)의 '음성 재생'·'음성 정지'·상태 글·'선택 음성 합성'을 숨긴다.
//     녹음이 연결된 장면이 생기면 저절로 다시 보인다.
//  ③ 기억 조각·쪽지 창(R177 오른쪽 종이, R169·R162 도 같은 창)에 '항상 끄기'. 누르면 창을 닫고 다음부터는 쪽지 모음에만 넣는다(R177 autoShow).
//     1쪽짜리 창에서 쓸모없는 ◀·'1 / 1'·'닫기'와 겹치는 ✕ 는 숨긴다.
//  ④ 설정 맨 위 '전투 화면' 묶음(R1021)에 '서사 창(보스 입장·진행)'·'기억 조각·쪽지 창' 켜고 끄기 줄. 켜면 다시 뜬다.
//     설정값은 원래 주인(R365 skipStory·R177 autoShow·R365 show/manual)에 그대로 저장되고, 아래쪽 옛 줄과 서로 맞춰진다.
//  ⑤ 서사 자막 끄기(R1021 subs)가 영화 모드 선화 컷신 글(R880 .cap)·보스 컷신 자막(R568)까지 숨긴다.
//  서사 글 자체는 바꾸지 않는다(보이느냐만). 기억 책에서 직접 여는 읽기(journal:)는 그대로 뜬다.
(()=>{'use strict';
if(window.__STORYWORLD_NARRATION_R1037__)return;
const REV='R1037-narration-1';
const stats={decorated:0,offClicks:0,skipped:0,fragDecorated:0,fragOff:0,rows:0,syncs:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const $=id=>document.getElementById(id);
const R365=()=>window.__STORYWORLD_GUIDE_FRAGMENT_R365__||null,R177=()=>window.__STORYWORLD_STORY_COLLECT_R177__||null,R1021=()=>window.__STORYWORLD_UI_COMBAT_R1021__||null;
let localStory=true,localFragment=true;// 둘레 모듈이 없을 때만 쓰는 값
const cur=()=>{try{return typeof storyScene!=='undefined'?storyScene:null;}catch(_){return null;}};
const journal=s=>/^journal:/.test(String(s?.key||''));
function story(){try{const r=R365();if(r?.prefs)return !r.prefs().skipStory;}catch(e){fail(e);}return localStory;}
function fragment(){try{const a=R177(),b=R365();if(!a?.prefs)return localFragment;const p=a.prefs(),q=b?.prefs?b.prefs():{};return p.autoShow!==false&&q.show!==false&&q.manual!==false;}catch(e){fail(e);return localFragment;}}
function subs(){try{const c=R1021();if(c?.prefs)return !(c.on?.()!==false&&c.prefs().subs===false);}catch(e){fail(e);}return true;}
const get=k=>k==='story'?story():k==='fragment'?fragment():k==='subs'?subs():null;
function set(k,v){v=!!v;try{
 if(k==='story'){const r=R365();if(r?.set)r.set({skipStory:!v});else localStory=v;}
 else if(k==='fragment'){const a=R177(),b=R365();if(a?.set)a.set({autoShow:v});else localFragment=v;if(v&&b?.set)b.set({show:true,manual:true});}
 else if(k==='subs'){const c=R1021();if(c?.set)c.set('subs',v);}
 else return null;}catch(e){fail(e);}
 sync();return get(k);}
const say=(m,s)=>{try{if(typeof toast==='function')toast(m,s);}catch(_){}};
// ---- CSS ----
const CSS=[
 // ② 녹음이 없는 장면의 음성 단추·상태 글·브라우저 합성 단추
 '#panel.r1037NoVoice #storyAudio,#panel.r1037NoVoice #storyAudioStop,#panel.r1037NoVoice #voiceStatus,#panel.r1037NoVoice #storyTTS{display:none!important}',
 '#r1037Off{opacity:.82}#r1037Off:hover{opacity:1}',
 '#r177Doc .foot [data-r1037="off"]{margin-left:8px!important;font-size:11px;letter-spacing:.02em}',
 // ⑤ 서사 자막 끄기 → 영화 선화 컷신 글도
 'body.r1021On.r1021SubsOff #r880 .cap{display:none!important}'
].join('\n');
function style(){try{if(!$('r1037Css')&&document.head){const s=document.createElement('style');s.id='r1037Css';s.textContent=CSS;document.head.appendChild(s);}}catch(e){fail(e);}}
// ---- ① ② 서사 창 ----
function hasVoice(s){try{const m=typeof voiceManifest!=='undefined'?voiceManifest:null;if(!m||!s)return false;
 const row=m.originals?.[s.id+'.'+s.part]||m.scenes?.[s.id+':'+s.part]||(s.part==='body'?m.scenes?.['journal:'+s.id+':body']:null);return !!row?.audio;}catch(_){return false;}}
function advance(){let n=0;while(cur()&&!journal(cur())&&n<200){n++;advanceScene();}stats.skipped+=n;return n;}
function off(){try{stats.offClicks++;set('story',false);say('서사 텍스트를 껐습니다 · 다음부터 보스 입장·진행 서사 없이 바로 진행(쪽지 모음에 기록) · 설정 → 전투 화면에서 다시 켤 수 있습니다',3.2);advance();}catch(e){fail(e);}}
function decorateStory(){try{const s=cur(),pn=$('panel');if(!s||!pn)return false;const foot=pn.querySelector('.storyFoot');if(!foot)return false;
 pn.classList.toggle('r1037NoVoice',!hasVoice(s));
 if(journal(s)){$('r1037Off')?.remove();return false;}
 if(!$('r1037Off')){const b=document.createElement('button');b.id='r1037Off';b.type='button';b.textContent='텍스트 항상 끄기';
  b.title='앞으로 보스 입장·진행 서사 창을 띄우지 않고 바로 넘깁니다(글은 쪽지 모음에 기록, 진행은 그대로). 설정 → 전투 화면에서 다시 켭니다';
  b.onclick=ev=>{try{ev?.preventDefault?.();ev?.stopPropagation?.();}catch(_){}off();};foot.appendChild(b);}
 stats.decorated++;return true;}catch(e){fail(e);return false;}}
// ---- ③ 기억 조각·쪽지 창 ----
function decorateFragment(){try{const el=$('r177Doc');if(!el||el.hidden)return false;const foot=el.querySelector('.foot');if(!foot)return false;
 const prev=el.querySelector('[data-r182="prev"]'),next=el.querySelector('[data-r182="next"]'),x=el.querySelector('[data-r182="close"]');
 if(prev&&next&&prev.disabled&&/닫기/.test(next.textContent||'')){prev.hidden=true;if(x)x.hidden=true;
  for(const n of [...(foot.childNodes||foot.children||[])])if((n.nodeType===3||n.classList?.contains?.('r1037Count'))&&/^\s*1\s*\/\s*1\s*$/.test(n.textContent||''))n.textContent='';}
 if(!foot.querySelector('[data-r1037="off"]')){const b=document.createElement('button');b.type='button';b.id='r1037FragOff';b.setAttribute('data-r1037','off');b.textContent='항상 끄기';
  b.title='앞으로 주운 기억 조각·쪽지를 창으로 펼치지 않고 쪽지 모음에만 넣습니다. 설정 → 전투 화면에서 다시 켭니다';
  b.onclick=ev=>{try{ev?.stopPropagation?.();ev?.preventDefault?.();}catch(_){}try{stats.fragOff++;set('fragment',false);say('기억 조각·쪽지 창을 껐습니다 · 쪽지 모음(메뉴)에만 넣습니다 · 설정 → 전투 화면에서 다시 켤 수 있습니다',3);
   const c=el.querySelector('[data-r182="close"]');if(c)c.click();else el.click();}catch(e){fail(e);}};
  foot.appendChild(b);stats.fragDecorated++;}
 return true;}catch(e){fail(e);return false;}}
// ---- ④ 설정 줄 ----
const ROWS=[['story','서사 창(보스 입장·진행)','끄면 바로 진행 · 쪽지 모음에 기록'],['fragment','기억 조각·쪽지 창','끄면 쪽지 모음에만']];
function sync(){try{stats.syncs++;for(const i of document.querySelectorAll('input[data-r1037]')){const v=get(i.dataset.r1037);if(v!==null)i.checked=v;}
 const r=R365()?.prefs?.(),a=R177()?.prefs?.(),pairs=[['r365SkipStory',r&&!!r.skipStory],['r182Auto',a&&a.autoShow!==false],['r365GuideFrag',r&&r.show!==false],['r365ManualFrag',r&&r.manual!==false]];
 for(const [id,v] of pairs){const e=$(id);if(e&&v!=null&&e.checked!==v)e.checked=v;}
 const sb=document.querySelector('input[data-r1021="subs"]');if(sb&&R1021())sb.checked=subs();}catch(e){fail(e);}}
function rows(){try{const sec=$('combatScreenR1021');if(!sec)return false;
 for(const [k,label,note] of ROWS){if(sec.querySelector('input[data-r1037="'+k+'"]'))continue;const row=document.createElement('label');row.className='r1021-row r1037Own';
  const i=document.createElement('input');i.type='checkbox';i.setAttribute('data-r1037',k);i.checked=!!get(k);i.onchange=()=>{set(k,!!i.checked);};
  const t=document.createElement('span');t.textContent=label;const sm=document.createElement('small');sm.textContent=note;row.appendChild(i);row.appendChild(t);row.appendChild(sm);sec.appendChild(row);stats.rows++;}
 const pn=$('panel');if(pn&&!pn.__r1037){pn.__r1037=true;pn.addEventListener('change',ev=>{try{if(!ev?.target?.dataset?.r1037)sync();}catch(e){fail(e);}});}
 sync();return true;}catch(e){fail(e);return false;}}
const later=(f,ms)=>{try{setTimeout(()=>{try{f();}catch(e){fail(e);}},ms);}catch(e){fail(e);}};
if(typeof document!=='undefined'){style();
 try{if(typeof advanceScene==='function'){const base=advanceScene;advanceScene=function(...a){let r=base.apply(this,a);
  // R365 가 없을 때만 직접 넘긴다(있으면 R365 가 넘김)
  try{if(!R365()&&!story()&&cur()&&!journal(cur())){let n=0;while(cur()&&!journal(cur())&&n++<200)r=base.apply(this,a);stats.skipped+=n;}else decorateStory();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
 try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{rows();later(rows,0);later(rows,150);later(rows,500);}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
 try{setInterval(decorateFragment,300);}catch(e){fail(e);}}
window.__STORYWORLD_NARRATION_R1037__=Object.freeze({revision:REV,CSS,story,fragment,subs,set,storyOff:()=>!story(),decorateStory,decorateFragment,rows,sync,off,
 inspect:()=>({revision:REV,story:story(),fragment:fragment(),subs:subs(),stats:{...stats},lastError})});
})();
