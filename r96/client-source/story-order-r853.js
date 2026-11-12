/* R853(사용자 2026-11-12 "서사상 자연스럽게 바꿔"): 잠들지 못하는 마을(last302) 정본 기억 글 자리 바로잡기.
   정본 개선본 문단을 그대로 쓰고 새 문장·설정은 없다. 자리만 옮긴다.
   원래: 보스 문 앞(전투 전) = ① 젖은 모래 해안에서 깨어남 ② 잠들지 못하는 주민들 / 보스 처치 뒤 = ③ 주민들이 실에 끌리듯 달려듦.
   ①은 입장 해안 영상(R617)과 같은 순간이고 ③은 마을을 다 뚫은 뒤에야 나와 순서가 거꾸로였다.
   바꾼 자리: 입장(해안 영상이 끝나고 0.8초 뒤, 영상이 꺼져 있으면 들어온 뒤 0.8초) ①② → 보스 문 앞 ③(주민을 조종하는 힘을 찾아 나섬 → 보스)
   → 처치 뒤 글 없음(다음 지역 '한약과 불면귀' 첫 문단이 "나를 덮치려던 주민들도 걸음을 멈추고"로 이어 받는다).
   스토리 층·R78 진행(route/rally 단계)에서만, 한 번만. 다른 지역·층은 손대지 않는다. */
(()=>{'use strict';
const REV='R853',ZONE='last302',WAIT=0.8;
const stats={arrive:0,door:0,post:0,waits:0,errors:0};let lastError=null,since=null,sinceRoom=null,prevTime=0;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
function paras(){const z=window.__STORYWORLD_STORY_CANON_R106__?.zones?.[ZONE];return z&&!z.rest?z.blocks.flatMap(b=>b.paras.map(p=>({p,n:b.narrator}))):null;}
const story=()=>typeof layer==='undefined'||layer==='STORY';
function make(tmpl,part,rows){if(!tmpl||!rows?.length)return [];const out=[];
 for(const r of rows){const last=out[out.length-1];if(last&&last.narrator===r.n)last.paras.push(r.p);else out.push({narrator:r.n,paras:[r.p]});}
 return out.map((g,i)=>({...tmpl,part,narrator:g.narrator||tmpl.narrator,text:g.paras.join('\n\n'),key:(typeof layer==='string'?layer:'STORY')+':'+ZONE+':r853-'+part+':'+i}));}
let base=null;
function arriveScenes(){const f=paras();if(!base||!f||f.length!==3)return [];const tmpl=base({id:ZONE,...(typeof regionById!=='undefined'?regionById[ZONE]:{})},'pre')?.[0];return make(tmpl,'arrive',f.slice(0,2));}
if(typeof nextScenes==='function'){base=nextScenes;nextScenes=function(def,part,...rest){const list=base.call(this,def,part,...rest);
 try{if(def?.id!==ZONE||!story()||!['pre','post'].includes(part))return list;const f=paras();if(!f||f.length!==3)return list;
  if(part==='post'){stats.post++;return [];}
  stats.door++;const out=make(list?.[0],'door',f.slice(2));return out.length?out:list;}catch(e){fail(e);return list;}};}
function ready(){
 if(typeof started==='undefined'||!started||loading||modal||storyScene||(Array.isArray(storyQueue)&&storyQueue.length))return false;
 if(zone!==ZONE||!story()||(typeof completed==='function'&&completed(ZONE)))return false;
 const ph=window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.()?.phase;if(!['route','rally'].includes(ph))return false;
 const V=window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__;if(V){if(V.want?.())return false;if(V.inspect?.().open)return false;}
 return true;}
function poll(){
const before=prevTime;prevTime=time;
 const here=typeof room!=='undefined'?room:zone;if(here!==sinceRoom){sinceRoom=here;since=null;}
 if(zone!==ZONE)return;
 const list=arriveScenes().filter(s=>!readScenes.has(s.key));if(!list.length)return;
 if(!ready()){since=null;stats.waits++;return;}
 if(since===null)since=before;if(time-since<WAIT)return;
 since=null;stats.arrive++;playScenes(list,()=>{try{if(typeof saveGame==='function')saveGame(false);}catch(e){fail(e);}});}
if(typeof tick==='function'){const tb=tick;tick=function(...a){const out=tb.apply(this,a);try{poll();}catch(e){fail(e);}return out;};}
window.__STORYWORLD_STORY_ORDER_R853__=Object.freeze({revision:REV,zone:ZONE,poll,arrive:()=>arriveScenes().map(s=>({key:s.key,text:s.text})),inspect:()=>({revision:REV,stats:{...stats},lastError,since})});
})();
