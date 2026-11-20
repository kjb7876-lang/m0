/* R1248 저장 보호(사용자 2026-11-20 리뷰 1번 "실패한 불러오기가 슬롯을 바꾸는 문제부터").
 *  ① 슬롯 불러오기 중 복원 함수가 명시적 false 를 돌려주면 실패로 본다 — R73 거래가 예외로 받아 이전 진행을 되돌리고,
 *     활성 슬롯·포인터·'불러오기 완료' 기록을 바꾸지 않는다. undefined 를 돌려주는 엔진 정상 복원은 그대로 성공이다.
 *     (EGO·페르소나 형상 훅은 ego-sovereign-r1046 공용 훅이 넘기는 복원 결과로 false 일 때 형상을 건드리지 않는다.)
 *  ② 두 창(탭)이 같은 슬롯을 열었을 때 오래된 창이 최신 진행을 덮어쓰지 않는다. 창마다 '마지막으로 불러오거나 쓴 슬롯 내용'을
 *     기억해, 저장 직전 슬롯 내용이 그것과 다르면(다른 창이 더 새로 저장) 슬롯은 그대로 두고 이 창 진행을
 *     '<슬롯>.conflict-r1248' 충돌 사본으로 보존한다. 저장 슬롯 메뉴의 '충돌 사본 적용'은 슬롯과 사본을 맞바꿔(둘 다 보존) 불러온다.
 *  저장 형식·원본 저장·777 저장은 바꾸지 않는다. */
(()=>{'use strict';
 if(window.__STORYWORLD_SAVE_GUARD_R1248__)return;
 const G=(f,d)=>{try{return f();}catch(_){return d;}};
 const S=window.__STORYWORLD_SAVE_SLOTS_R73__,B1=window.__STORYWORLD_TEST_STORAGE_B1__,SP=G(()=>window.Storage.prototype,null);
 const save=G(()=>typeof SAVE==='string'?SAVE:null,null);
 if(!S||!B1||!SP||!save||typeof restoreSave!=='function')return;
 const BASE=B1.prefix+save+'.slot-r73.',POINTER=BASE+'active',slots=[1,2,3];
 const conflictKey=n=>BASE+n+'.conflict-r1248';
 const slotOf=k=>{if(typeof k!=='string'||!k.startsWith(BASE))return 0;const n=Number(k.slice(BASE.length));return slots.includes(n)&&k===BASE+n?n:0;};
 const get=SP.getItem,set=SP.setItem,ls=()=>G(()=>window.localStorage,null);
 const seen=new Map();          // 슬롯 → 이 창이 마지막으로 불러오거나 쓴 저장 문자열
 const noticed=new Map();       // 슬롯 → 안내를 띄운 충돌 상태(같은 충돌에 안내를 거듭 띄우지 않음)
 let candidate=null;            // 불러오기 거래 중 읽은 슬롯 문자열(성공해 포인터를 쓸 때 seen 으로 확정)
 const stats={conflicts:0,blockedRestores:0,adopted:0,lastError:null};
 const state=()=>G(()=>S.inspect(),{});
 const say=m=>{try{if(typeof toast==='function')toast(m,5);}catch(_){}};

 // ② 같은 슬롯 쓰기 감시(엔진 saveGame·R73 입장 체크포인트·이관·새 여정 모두 이 길로 쓴다)
 SP.setItem=function(k,v){
  if(this!==ls())return set.apply(this,arguments);
  const key=String(k);
  if(key===POINTER){
   const out=set.apply(this,arguments),n=Number(v);
   if(slots.includes(n))seen.set(n,candidate&&candidate.n===n?candidate.text:get.call(this,BASE+n));
   candidate=null;return out;
  }
  const n=slotOf(key);if(!n)return set.apply(this,arguments);
  const text=String(v),stored=get.call(this,key),mine=seen.get(n);
  if(stored!==null&&mine!==undefined&&stored!==mine&&stored!==text){
   stats.conflicts++;
   try{set.call(this,conflictKey(n),text);}
   catch(e){stats.lastError=String(e?.message||e).slice(0,160);const err=Error(`슬롯 ${n}: 다른 창에서 더 최근 진행이 저장돼 덮어쓰지 않았습니다. 저장 공간이 부족해 이 창 진행을 충돌 사본으로도 남기지 못했습니다 — 저장 파일 내보내기를 쓰세요.`);say(err.message);throw err;}
   const msg=`슬롯 ${n}: 다른 창에서 더 최근 진행이 저장돼 덮어쓰지 않았습니다. 이 창의 진행은 충돌 사본으로 보존했습니다(저장 슬롯 메뉴에서 적용).`;
   if(noticed.get(n)!==stored){noticed.set(n,stored);say(msg);}
   throw Error(msg);
  }
  const out=set.apply(this,arguments);seen.set(n,text);return out;
 };

 // ① 슬롯 불러오기 중 명시적 false = 실패
 const restoreBase=restoreSave;
 restoreSave=async function(raw,...a){
  const s=state(),slotLoad=s.busy===true&&s.operation==='load'&&slots.includes(s.pending);
  if(slotLoad){try{const text=get.call(ls(),BASE+s.pending),at=raw?.saveSlotR73?.savedAt;
   // 슬롯에서 읽은 그 저장일 때만(되돌리기용 이전 진행 복원은 새 savedAt 을 가져 제외된다)
   if(text&&(typeof at==='string'?text.includes('"savedAt":"'+at+'"'):!raw?.saveSlotR73))candidate={n:s.pending,text};}catch(_){}}
  const r=await restoreBase.call(this,raw,...a);
  if(r===false&&slotLoad){stats.blockedRestores++;throw Error('슬롯 복원이 실패했습니다. 지금 진행과 활성 슬롯·저장은 그대로 둡니다.');}
  return r;
 };
 for(const k of Object.keys(restoreBase))if(/^_*r\d/i.test(k))G(()=>{restoreSave[k]=restoreBase[k];});

 function conflicts(){const st=ls();return slots.filter(n=>G(()=>get.call(st,conflictKey(n))!==null,false));}
 async function adoptConflict(n){
  const st=ls(),copy=G(()=>get.call(st,conflictKey(n)),null);if(!slots.includes(n)||!copy)return false;
  try{JSON.parse(copy);}catch(e){say('충돌 사본을 읽지 못했습니다: '+e.message);return false;}
  const cur=get.call(st,BASE+n);
  try{set.call(st,BASE+n,copy);if(cur!==null)set.call(st,conflictKey(n),cur);}catch(e){say('충돌 사본 적용 실패: '+e.message);try{if(cur!==null)set.call(st,BASE+n,cur);}catch(_){}return false;}
  seen.set(n,copy);noticed.delete(n);stats.adopted++;
  return (await S.confirm('load',n))===true;
 }

 // 저장 슬롯 메뉴: 충돌 사본이 있는 슬롯에 안내·적용 단추
 if(typeof openPanel==='function'){const panelBase=openPanel;openPanel=function(...a){const out=panelBase.apply(this,a);try{
  if(typeof document==='undefined'||!document.getElementById('slotsMessageR73'))return out;
  const cards=document.querySelectorAll('#panel .cards .card');
  for(const n of conflicts()){const card=cards[n-1];if(!card||card.querySelector('[data-slot-conflict-r1248]'))continue;
   let info='';try{info=S.summary(JSON.parse(get.call(ls(),conflictKey(n))));}catch(_){info='읽기 오류';}
   const p=document.createElement('p');p.className='small';p.textContent='충돌 사본(다른 창과 겹친 진행) · '+info;
   const b=document.createElement('button');b.dataset.slotConflictR1248=String(n);b.textContent='충돌 사본 적용(지금 슬롯과 맞바꿔 불러오기)';
   b.onclick=()=>{b.disabled=true;adoptConflict(n);};card.append(p,b);}
 }catch(e){stats.lastError=String(e?.message||e).slice(0,160);}return out;};}

 // 다른 창이 이 창의 활성 슬롯을 저장하면 바로 알린다
 G(()=>window.addEventListener('storage',e=>{const n=slotOf(e.key);if(!n||n!==state().active||!seen.has(n)||e.newValue===seen.get(n)||noticed.get(n)===e.newValue)return;
  noticed.set(n,e.newValue);say(`다른 창에서 슬롯 ${n} 진행이 저장됐습니다. 이 창에서 계속 저장하면 덮어쓰지 않고 충돌 사본으로 보존합니다.`);}));

 window.__STORYWORLD_SAVE_GUARD_R1248__=Object.freeze({revision:'R1248',conflicts,adoptConflict,conflictKey,
  inspect:()=>({...stats,seen:[...seen.keys()],conflicts:conflicts()})});
})();
