// R1044 서사 창 녹음 음성 + 안 쓰는 음성 단추 지우기 — 사용자 2026-11-15 "서사텍스트에 지금안쓰는기능들삭제 음성나오는것도테스트".
//  점검 결과: 스토리 모드 보스 입장·진행 서사 창(엔진 advanceScene)은 문장 녹음(R381, 정본 문장마다 mp3)이 있는데도 소리가 나지 않았다.
//   엔진 playVoice 는 비어 있는 voiceManifest 만 보고, 녹음은 영화 모드(R370)·무한생존(R600)만 틀었다.
//  ① 서사 창이 뜨면 설정 '서사 음성 자동 재생'(settings.narration)이 켜져 있고 '음성 음량'(settings.voice)>0 일 때
//     그 장면 글을 영화 모드와 같은 방법(R370 pure.sentences)으로 문장으로 나눠 녹음이 있는 문장을 차례로 튼다. 음량은 문장마다 설정값을 다시 읽는다.
//  ② 녹음 없는 문장은 건너뛴다(브라우저 음성으로 대신하지 않음 — 녹음 없는 곳은 보류 결정).
//  ③ 다음 장면·창 닫기·'텍스트 항상 끄기'(R1037, 창 없이 바로 넘김) 때 멈춘다. 늦게 온 끝 알림은 세대 번호로 버린다.
//  ④ 영화 모드·무한생존 중에는 그쪽이 음성을 맡으므로 손대지 않는다.
//  ⑤ 안 쓰는 UI: 서사 창의 '음성 재생'·'음성 정지'·상태 글(R1037 이 숨기던 것)과 '선택 음성 합성'(브라우저 음성) 단추를 DOM 에서 지운다.
//  서사 글은 바꾸지 않는다.
(()=>{'use strict';
if(window.__STORYWORLD_NARRATION_VOICE_R1044__)return;
const REV='R1044-narration-voice-1';
const stats={scenes:0,played:0,ended:0,errors:0,skippedNoRec:0,halted:0,removed:0,moduleErrors:0};let lastError=null;
const fail=e=>{stats.moduleErrors++;lastError=String(e?.message||e).slice(0,200);};
const DEAD=['storyAudio','storyAudioStop','voiceStatus','storyTTS'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const R381=()=>window.__STORYWORLD_VOICE_R381__||null;
const scene=()=>{try{return typeof storyScene!=='undefined'?storyScene:null;}catch(_){return null;}};
const sett=()=>{try{return typeof settings!=='undefined'&&settings?settings:{};}catch(_){return {};}};
function vol(){const v=+sett().voice;return Number.isFinite(v)?clamp(v,0,1):.8;}
function allowed(){try{const s=sett();if(s.narration===false)return false;if(vol()<=0)return false;
 if(window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on)return false;
 if(window.__STORYWORLD_SURVIVAL_R600__?.active?.())return false;return true;}catch(e){fail(e);return false;}}
function split(text){try{const P=window.__STORYWORLD_CINEMA_MODE_R370__?.pure;if(P&&typeof P.sentences==='function')return P.sentences(text).map(s=>s.text);}catch(e){fail(e);}
 return String(text||'').split(/\n\s*\n/).flatMap(p=>p.replace(/\s+/g,' ').trim().split(/(?<=[.!?…])\s+/)).map(x=>x.trim()).filter(Boolean);}
let gen=0,cur=null,curScene=null;
function halt(){gen++;curScene=null;if(cur){const h=cur;cur=null;stats.halted++;try{h.stop?.();}catch(_){}try{R381()?.stop?.();}catch(e){fail(e);}}}
function start(){try{const s=scene(),R=R381();if(!s||!R||typeof R.has!=='function'||typeof s.text!=='string'||!s.text.trim()||!allowed())return false;
 // '텍스트 항상 끄기'(R1037)면 엔진이 창을 그린 뒤 바로 넘기므로 소리를 내지 않는다(기억 책 journal: 은 직접 연 것이라 튼다).
 try{if(!/^journal:/.test(String(s.key||''))&&window.__STORYWORLD_NARRATION_R1037__?.storyOff?.())return false;}catch(e){fail(e);}
 const all=split(s.text),list=all.filter(t=>{try{return R.has(t);}catch(_){return false;}});stats.skippedNoRec+=all.length-list.length;if(!list.length)return false;
 stats.scenes++;const my=++gen;curScene=s;let i=0;
 const next=()=>{if(my!==gen)return;cur=null;if(scene()!==s||!allowed()||i>=list.length){curScene=null;return;}
  const t=list[i++];let h=null;
  try{h=R.play(t,{rate:1,volume:vol(),onend:()=>{if(my!==gen)return;stats.ended++;next();},onerror:()=>{if(my!==gen)return;stats.errors++;next();}});}catch(e){fail(e);h=null;}
  if(!h){next();return;}stats.played++;cur=h;try{if(list[i])R.preload?.(list[i]);}catch(_){}};
 next();return true;}catch(e){fail(e);return false;}}
function tidy(){try{for(const id of DEAD){const e=document.getElementById(id);if(e){e.remove();stats.removed++;}}}catch(e){fail(e);}}
if(typeof document!=='undefined'){
 try{if(document.head&&!document.getElementById('r1044Css')){const st=document.createElement('style');st.id='r1044Css';st.textContent=DEAD.map(id=>'#panel #'+id).join(',')+'{display:none!important}';document.head.appendChild(st);}}catch(e){fail(e);}
 try{if(typeof advanceScene==='function'){const base=advanceScene;advanceScene=function(...a){halt();const r=base.apply(this,a);try{tidy();setTimeout(tidy,0);start();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
 try{if(typeof closePanel==='function'){const base=closePanel;closePanel=function(...a){if(curScene||cur)halt();return base.apply(this,a);};}}catch(e){fail(e);}}
window.__STORYWORLD_NARRATION_VOICE_R1044__=Object.freeze({revision:REV,halt,start,tidy,split,
 inspect:()=>({revision:REV,playing:!!cur,scene:curScene?.key||null,allowed:allowed(),volume:vol(),stats:{...stats},lastError})});
})();
