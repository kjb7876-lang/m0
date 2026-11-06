// R260 몹 그림이 갑자기 커지는 문제 — 사용자 2026-11-03 "몹들이미지가 갑자기 커지는등의 버그".
//  재현(헤드리스, 맵 들어온 뒤 몹마다 그려진 몸 높이를 매 프레임 비교): dist02·03·05 에서 맵 입장 3~9초 뒤
//  중간보스·잡몹이 116→200px, 92→133px, 84→147px 로 한 번에 커졌다. 원인: R208(스토리 몹 새 그림)·R248(몹 고유 시트)은
//  그 몹을 처음 그릴 때 그림을 읽기 시작하고, 다 읽기 전에는 엔진 원래 그림(크기가 다름)을 그린다 → 읽히는 순간 크기가 바뀐다.
//  · 맵에 몹이 생기면(입장 로딩 중 포함, 증원 포함) 그 몹들이 쓸 R208·R248 그림을 한꺼번에 미리 읽는다. 멀리 있는 몹이 화면에 들어오기 전에 읽혀 있다.
//  · 그래도 아직 안 읽힌 몹은 몸을 그리지 않고 그림자·바닥 고리·체력바만 둔다 — 다른 크기의 원래 그림(엔진·R92·R109 무엇이든)이 보였다가 커지지 않게.
//    영웅 9칸 밖(멀리·어둠 속)에서는 읽힐 때까지, 9칸 안에 들어온 뒤로는 1.2초까지만 기다리고 그 뒤엔 원래처럼 그린다(몸이 사라지지 않게).
//    (dist05 측정: 입장 직후 다른 지역 그림을 함께 읽느라 몹 그림이 6초 넘게 걸리기도 했다)
//  끄기: localStorage['storyworld.r260.preload']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_MOB_PRELOAD_R260__)return;
const REV='R260-preload-2',KEY='storyworld.r260.preload',HOLD=1.2,NEAR=9;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={batches:0,paths:0,held:0,released:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const seen=new WeakSet(),asked=new Set();
function wanted(e){const out=[];try{const m=window.__STORYWORLD_STORY_MOBS_R208__?.assign?.(e);if(m?.path)out.push(m.path);}catch(err){fail(err);}
 try{const d=window.__STORYWORLD_MOB_DOTS_R374__?.assign?.(e);if(d?.path){out.push(d.path);return out;}}catch(err){fail(err);}/* R374: Dots 승인 그림을 받은 액터는 그 시트만 기다린다(R248 시트는 안 씀) */
 try{const s=window.__STORYWORLD_MOB_UNIQUE_R248__?.sheetFor?.(e);if(s?.path)out.push(s.path);}catch(err){fail(err);}return out;}
const ready=p=>{try{return !!(typeof readyImage==='function'&&readyImage(p)?.image?.naturalWidth>0);}catch(_){return false;}};
function scan(){if(!on||typeof room!=='object'||!room||typeof ensureImages!=='function')return;const list=[];
 for(const e of room.enemies||[]){if(!e||seen.has(e))continue;seen.add(e);for(const p of wanted(e))if(!asked.has(p)&&!ready(p)){asked.add(p);list.push(p);}}
 if(list.length){stats.batches++;stats.paths+=list.length;Promise.resolve(ensureImages(list)).catch(err=>{fail(err);for(const p of list)asked.delete(p);});}}
// 아직 안 읽힌 몹은 잠깐 몸을 그리지 않는다(엔진 그리기는 그대로 돌려 체력바·그림자·검사용 기록은 남긴다)
const srcPath=im=>{try{const s=String(im?.__path||im?.src||'');const i=s.indexOf('/assets/');return i>=0?s.slice(i+1):s;}catch(_){return '';}};
function bodyPaths(e){const out=new Set();try{const fs=window.__STORYWORLD_STORY_COMBAT_R54__?.frameSet?.(e);if(fs)for(const v of Object.values(fs))if(v?.path)out.add(v.path);}catch(_){}
 try{for(const v of Object.values(e.profile?.frames||{}))if(v?.path)out.add(v.path);}catch(_){}if(e.path)out.add(e.path);if(e.rc146BodyFrame?.path)out.add(e.rc146BodyFrame.path);return out;}
const KEEP=/shadow|ring|glow|hp|bar|effects\/|vfx|fx/i;// 몸이 아닌 것(그림자·고리·체력바·이펙트)만 남긴다
const T=()=>typeof time==='number'?time:performance.now()/1000;
function holding(e){if(!on||!(e?.hp>0))return false;const w=wanted(e);if(!w.length||w.every(ready))return false;
 const far=typeof player==='object'&&player&&Math.hypot(e.x-player.x,e.y-player.y)>NEAR;if(far&&!e.r260Released)return true;
 if(!Number.isFinite(e.r260First))e.r260First=T();if(T()-e.r260First>HOLD){if(!e.r260Released){e.r260Released=true;stats.released++;}return false;}return true;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){let hold=false;try{scan();hold=holding(e);}catch(err){fail(err);}
 if(!hold)return base.apply(this,[e,...a]);const c=typeof ctx!=='undefined'?ctx:null;if(!c)return base.apply(this,[e,...a]);
 const paths=bodyPaths(e),od=c.drawImage;stats.held++;
 c.drawImage=function(im,...b){try{const p=srcPath(im);if(!KEEP.test(p)||(p&&[...paths].some(x=>p===x||p.endsWith(x))))return;}catch(_){}return od.apply(this,[im,...b]);};
 try{return base.apply(this,[e,...a]);}finally{c.drawImage=od;}};}
if(typeof setInterval==='function')setInterval(()=>{try{scan();}catch(err){fail(err);}},250);// 입장 로딩 중(그리기 전)에도
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_MOB_PRELOAD_R260__=Object.freeze({revision:REV,set,wanted:e=>wanted(e),inspect:()=>({revision:REV,on,stats:{...stats},asked:asked.size,lastError})});
})();
