/* R104 boss key poses. The Drive HAPIL batches deliver four authored attack key
 * poses per boss (anticipation, strike toward the screen bottom, follow-through,
 * recovery). The boss's existing frame objects (major pose table and its own
 * profile frames, including the copies an attack action keeps) answer with the
 * new art only while that boss is being drawn, so combat logic, clocks and hit
 * geometry keep reading the original frames. Main bosses that change form use
 * the new body only in the phase the art depicts. */
(()=>{'use strict';
 if(window.__STORYWORLD_BOSS_KEYPOSES_R104__)return;
 const DATA=window.__STORYWORLD_BOSS_KEYPOSES_R104_DATA__||{},REV='boss-keyposes-r104';
 // Phase indices (phaseSprites5 / phasePresentation order) each form depicts.
 const PHASES={'b02-boss':[0,1],'b04-boss':[2],'b06-boss':[0,1],'b06b-boss':[0],'b07-boss':[0],'b08-boss':[0,1],'b09-boss':[1,2],'a11-boss':[0],'c104-boss':[0,1,2,3],'l301-boss':[0,1,2,3,4],'dist06-boss':[0,1,2,3,4],'h103-boss':[0,1]};// R860: 열쇠 자세가 있는데 표에 빠져 옛 그림만 그리던 본보스 — 타락천사 기사·발록은 모든 단계가 같은 몸, EGO 강탈 악몽왕은 2단계(날개 고치 변신)만 원래 그림// R119: 교만의 사이보그 교주(Drive v17) — 그림 객체가 잠겨 있어 경로 단위 교체로 그린다
 // Native frame keys -> key pose (0 anticipation, 1 strike, 2 follow-through, 3 recovery).
 const POSE={anticipation:0,windup:0,prepare:0,charge:0,attack:1,attackA:1,strike:1,contact:1,attackB:2,hit:2,recover:2,follow:2,idle:3,move:3,recovery:3,death:3};
 const FIT=new Set(['l301-boss','dist06-boss','h103-boss','c104-boss']),fitIm=new WeakMap();
 const KEY='storyworld.r104.keyposes',stats={draws:0,swapped:0,patchedFrames:0,skippedPhase:0,loading:0,failures:0};let lastError=null,cur=null,on=true;
 try{on=localStorage.getItem(KEY)!=='off';}catch{}
 const fail=e=>{stats.failures++;lastError=String(e?.message||e).slice(0,160);};
 const NEW={};for(const [id,d] of Object.entries(DATA))NEW[id]=d.frames.map(f=>Object.freeze({path:f.path,assetFrame:Object.freeze({sourceRect:Object.freeze([0,0,f.w,f.h]),pivot:Object.freeze([...d.pivot]),visibleHeight:d.visibleHeight})}));
 const defs=new Map();
 function defOf(id){if(!defs.has(id)){let hit=null;try{for(const reg of Object.values(regionById||{})){for(const d of [...(reg.bosses||[]),...(reg.midboss?[reg.midboss]:[])])if(d?.id===id){hit=d;break;}if(hit)break;}}catch{}defs.set(id,hit);}return defs.get(id);}
 function phaseOf(e){if(Number.isFinite(e.phase))return e.phase;const ps=e.profile?.phaseSprites5||defOf(e.nativeId)?.phaseSprites5;if(Array.isArray(ps)){const i=ps.indexOf(e.path);if(i>=0)return i;}return 0;}
 const requested=new Set();
 function ready(id){let ok=true;for(const f of NEW[id]){if(readyImage(f.path))continue;ok=false;if(!requested.has(f.path)){requested.add(f.path);try{addImage(f.path);}catch(e){fail(e);}}}if(!ok)stats.loading++;return ok;}
 // Decided once per draw call; the getters below only read it.
 let curOk=false;
 function allowed(e){if(!on||!e||!NEW[e.nativeId])return false;const want=PHASES[e.nativeId];if(want&&!want.includes(phaseOf(e))){stats.skippedPhase++;return false;}return ready(e.nativeId);}
 const patched=new WeakSet();
 function patchFrame(f,id,i){
  if(!f||typeof f!=='object'||patched.has(f)||Object.isFrozen(f))return;
  const own={path:f.path,assetFrame:f.assetFrame,extraLayers150:f.extraLayers150,bodyNormalization5:f.bodyNormalization5},pick=()=>curOk&&cur?.nativeId===id?NEW[id][i]:null;
  try{
   for(const k of ['path','assetFrame'])Object.defineProperty(f,k,{configurable:true,enumerable:true,get(){const n=pick();if(n){stats.swapped++;return n[k];}return own[k];},set(v){own[k]=v;}});
   for(const k of ['extraLayers150','bodyNormalization5'])Object.defineProperty(f,k,{configurable:true,enumerable:own[k]!==undefined,get(){return pick()?undefined:own[k];},set(v){own[k]=v;}});
   patched.add(f);stats.patchedFrames++;
  }catch(e){fail(e);}
 }
 function patchSet(set,id){if(!set||typeof set!=='object'||patched.has(set))return;patched.add(set);for(const [k,f] of Object.entries(set))patchFrame(f,id,POSE[k]??3);}
 function install(){
  const M=typeof portable==='object'&&portable?.majorNativePresentation150||{};
  for(const id of Object.keys(NEW)){patchSet(M[id]?.poses,id);patchSet(defOf(id)?.frames,id);}
  // Main bosses also draw plain sprites by path (their phase body and some action
  // stills). While such a boss is drawn in its depicted phase, those actor images
  // resolve to the key poses: attack stills to the strike, the rest to recovery.
  const imageBase=readyImage;readyImage=function(p,...a){
   if(curOk&&cur&&PHASES[cur.nativeId]&&typeof p==='string'&&!p.startsWith('assets/r104/')&&(p===cur.path||/actors-normalized|actors\/v3|cult-v3123\/pride_cyborg_cult_leader/.test(p))){const n=NEW[cur.nativeId][/attack|strike|cast/i.test(p)?1:3];const row=imageBase.call(this,n.path,...a);if(row){stats.swapped++;if(FIT.has(cur.nativeId)&&row.image&&typeof row.image==='object')fitIm.set(row.image,n.assetFrame.sourceRect);return row;}}
   return imageBase.call(this,p,...a);};
  // R860: 엔진·보스 전용 모듈(발록 bodyRect 등)은 옛 그림 기준 잘라 그리기 칸을 준다 → 바꾼 R104 그림은 칸 전체를 그리고,
  // 옛 칸이 차지하던 화면 상자의 키·발(아래 끝)·가운데에 맞춘다. 새로 연결한 본보스만(맘몬 등 기존 표는 그대로).
  const fitDraw=(c,od)=>function(im,...a){try{const fr=a.length===8&&fitIm.get(im);if(fr){const [sx,sy,sw,sh,dx,dy,dw,dh]=a,w=fr[2],h=fr[3];
    if(Math.abs(sx)+Math.abs(sy)>.5||Math.abs(sw-w)>.5||Math.abs(sh-h)>.5){const k=Math.abs(dh)/Math.max(1,h),nw=w*k*(dw<0?-1:1),cx=dx+dw/2;stats.fitted=(stats.fitted||0)+1;return od.call(c,im,0,0,w,h,cx-nw/2,dy+dh-h*k,nw,h*k);}}}catch(err){fail(err);}return od.apply(c,[im,...a]);};
  const base=drawEnemy;drawEnemy=function(e,...a){const prev=cur,prevOk=curOk;cur=e;stats.draws++;try{curOk=allowed(e);if(curOk&&e.profile)patchSet(e.profile.frames,e.nativeId);}catch(err){curOk=false;fail(err);}
   const c=curOk&&FIT.has(e?.nativeId)&&typeof ctx!=='undefined'?ctx:null,od=c&&typeof c.drawImage==='function'?c.drawImage:null;if(od)c.drawImage=fitDraw(c,od);
   try{return base.call(this,e,...a);}finally{if(od)c.drawImage=od;cur=prev;curOk=prevOk;}};
  return true;
 }
 let installed=false;try{installed=install();}catch(e){fail(e);}
 function setEnabled(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch{}return on;}
 window.__STORYWORLD_BOSS_KEYPOSES_R104__=Object.freeze({revision:REV,ids:Object.keys(NEW),phases:PHASES,setEnabled,get enabled(){return on;},framesFor:id=>NEW[id]||null,inspect:()=>({revision:REV,installed,enabled:on,sets:Object.keys(NEW).length,stats:{...stats},lastError})});
})();
