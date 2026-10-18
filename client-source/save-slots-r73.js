/* Three independent normal saves. The original single save and 777 slot are
 * retained. Each complete save is one atomic localStorage value. */
(()=>{'use strict';
 const LEGACY=SAVE,PREFIX=SAVE+'.slot-r73.',POINTER=PREFIX+'active',slots=[1,2,3];
 let active=1,pending=null,busy=false,operation=null,transitionDepth=0,message='';const audit=[];
 try{const n=Number(localStorage.getItem(POINTER));if(slots.includes(n))active=n;}catch(e){message='슬롯 선택을 읽지 못했습니다: '+e.message;}
 const number=n=>{if(!slots.includes(n))throw Error('슬롯 번호가 올바르지 않습니다.');return n;};
 const key=(kind='save')=>PREFIX+(pending||active)+(kind==='backup'?'.previous':'');
 const slotKey=n=>PREFIX+number(n),mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode()||'off';
 const note=(kind,data={})=>{audit.push({kind,active,operation,...data});if(audit.length>60)audit.shift();};
 function envelope(raw){if(!raw||raw.version!==6||raw.scope!=='hapil.storyworld.depth-full.20261008'||!['STORY','DREAM'].includes(raw.layer)||typeof raw.zone!=='string'||!raw.player||!raw.progress||!raw.rooms||raw.cheat777?.active===true)throw Error('일반 진행의 완전한 저장 파일이 아닙니다. 원본은 보존합니다.');return raw;}
 function read(n){const text=localStorage.getItem(slotKey(n));if(!text)return null;if(text.length>12*1024*1024)throw Error('저장 파일이 허용 크기를 넘었습니다.');return envelope(JSON.parse(text));}
 function migrate(){try{if(localStorage.getItem(slotKey(1))!==null)return;const text=localStorage.getItem(LEGACY);if(!text)return;envelope(JSON.parse(text));localStorage.setItem(slotKey(1),text);if(localStorage.getItem(slotKey(1))!==text)throw Error('이관 후 저장 확인 실패');note('legacy-copied',{sourcePreserved:true});}catch(e){message='기존 저장 이관 실패 · 원본 보존: '+e.message;}}
 const cheat=()=>window.__STORYWORLD_CHEAT777__?.active()===true;
 const ready=()=>started&&booted&&player?.hp>0&&!loading&&!storyScene&&!room?.finalizing&&room?.id===zone&&room?.layer===layer&&transitionDepth===0;
 function summary(raw){if(!raw)return'비어 있음';const done=Object.values(raw.progress?.STORY||{}).filter(v=>v===true).length,dream=Object.values(raw.progress?.DREAM||{}).filter(v=>v===true).length,at=raw.saveSlotR73?.savedAt;return`${raw.layer} · ${regionById[raw.zone]?.title||raw.zone} · Lv.${raw.player.level||1} · 기억 ${done} / 사몽 ${dream}${at?' · '+new Date(at).toLocaleString(): ' · 이전 버전 저장'}`;}
 function error(e){message=e?.message||String(e);note('failure',{message});const status=$('slotsMessageR73');if(status)status.textContent=message;toast(message,5);}
 function safePosition(){if(!room||!player)throw Error('복원된 지역이 없습니다.');if(!blocked(player.x,player.y,.34,room))return;const cells=room.exploration?.floorCells||[];let best=null,distance=Infinity;for(const[x,y]of cells){const q={x:x+.5,y:y+.5},d=Math.hypot(q.x-player.x,q.y-player.y);if(d<distance&&!blocked(q.x,q.y,.4,room)){best=q;distance=d;}}if(!best)throw Error('해당 지도에서 안전한 복원 위치를 찾지 못했습니다.');player.x=best.x;player.y=best.y;cam={...best};route=[];command=null;note('safe-position',{distance});}
 const serializeBase=serializeSave;serializeSave=function(...args){const raw=serializeBase.apply(this,args);if(mode()==='off'&&raw.version===6&&raw.scope==='hapil.storyworld.depth-full.20261008'&&!raw.cheat777?.active)raw.saveSlotR73={version:1,slot:pending||active,savedAt:new Date().toISOString(),transitionComplete:room?.id===zone&&room?.layer===layer&&!loading};return raw;};
 const saveBase=saveGame;saveGame=function(notice=true){
  if(cheat()||mode()!=='off')return saveBase.apply(this,arguments);
  if(notice&&mode()==='off'){confirm('save',active);return false;}
  if(!ready()||busy&&operation!=='new')return false;
  try{const ok=saveBase.call(this,false);if(ok!==true)return false;const raw=read(pending||active);if(!raw||raw.zone!==zone||raw.layer!==layer||raw.saveSlotR73?.transitionComplete!==true)throw Error('저장 후 상태 확인에 실패했습니다.');message=`슬롯 ${pending||active} 저장 완료 · ${summary(raw)}`;note('saved',{slot:pending||active,zone,layer});return true;}catch(e){error(e);return false;}
 };
 function enteredCheckpoint(){
  // Native entry used to save before opening the pre-scene, before later
  // wrappers finished positioning. Preserve that checkpoint after completion.
  if(busy||mode()!=='off'||cheat()||transitionDepth||!started||!booted||loading||player?.hp<=0||room?.id!==zone||room?.layer!==layer||room.finalizing||storyScene?.part!=='pre'||blocked(player.x,player.y,.34,room))return false;
  try{const raw=envelope(serializeSave());raw.saveSlotR73.checkpoint='entered-pre-scene';const text=JSON.stringify(raw);localStorage.setItem(key(),text);if(localStorage.getItem(key())!==text)throw Error('입장 체크포인트 저장 확인 실패');message=`슬롯 ${active} 저장 완료 · ${summary(raw)}`;note('entered-checkpoint',{zone,layer});return true;}catch(e){error(e);return false;}
 }
 const enterBase=enterRegion;enterRegion=async function(...args){transitionDepth++;let result;try{result=await enterBase.apply(this,args);return result;}finally{transitionDepth--;if(transitionDepth===0&&result===true&&!busy){if(ready())saveGame(false);else enteredCheckpoint();}}};
 const migratedZone=id=>id==='ep1a07'?'ep1a08':id;
 const restoreBase=restoreSave;restoreSave=async function(raw,...args){transitionDepth++;try{const r=await restoreBase.call(this,raw,...args);if(raw?.version===6&&raw.scope==='hapil.storyworld.depth-full.20261008'&&mode()==='off'&&r!==false&&started&&!loading){safePosition();if(room.id!==migratedZone(raw.zone)||layer!==raw.layer)throw Error('복원 목적지와 실제 지역이 다릅니다.');}return r;}finally{transitionDepth--;}};
 function locked(){return busy||loading||!booted||transitionDepth>0||mode()!=='off';}
 async function transact(kind,n){
  number(n);if(locked()){error(Error('로딩과 협동 세션을 마친 뒤 슬롯을 변경하세요.'));return false;}
  if(kind==='save'){
   if(n!==active||cheat()||!ready()){error(Error('현재 일반 진행의 활성 슬롯에서만 저장할 수 있습니다.'));return false;}
   const ok=saveGame(false);if(!ok)error(Error('저장하지 못했습니다. 장면·로딩·저장 공간을 확인하세요.'));panel();return ok;
  }
  let raw=null,old=null,prior=active,targetBefore=null;busy=true;operation=kind;
  try{
   targetBefore=localStorage.getItem(slotKey(n));old=started&&player?serializeSave():null;
   if(kind==='load'){raw=read(n);if(!raw)throw Error('비어 있는 슬롯입니다.');normalizeSave3({...raw,zone:migratedZone(raw.zone)});}
   if(cheat()){const left=await window.__STORYWORLD_CHEAT777__.leave();if(left!==true)throw Error('777 일반 진행 복귀를 완료하지 못했습니다.');}
   pending=n;
   if(kind==='load'){await restoreSave(raw);if(!started||loading||room?.id!==migratedZone(raw.zone)||layer!==raw.layer)throw Error('슬롯 복원이 완료되지 않았습니다.');}
   else{const ok=await window.__STORYWORLD_STORY_PROFILE_R54__.begin();if(ok!==true||zone!=='hub'||layer!=='STORY'||!started||loading)throw Error(window.__STORYWORLD_STORY_PROFILE_R54__.inspect().error||'새 여정을 시작하지 못했습니다.');}
   // Persist the active pointer only after the complete new/restore transaction.
   localStorage.setItem(POINTER,String(n));active=n;message=`슬롯 ${n} ${kind==='new'?'새 여정 시작':'불러오기 완료'}`;note(kind,{slot:n,zone,layer});if(!storyScene)closePanel(true);return true;
  }catch(e){if(kind==='new'){try{if(targetBefore===null)localStorage.removeItem(slotKey(n));else localStorage.setItem(slotKey(n),targetBefore);}catch(recovery){note('target-recovery-failed',{message:recovery.message});}}pending=prior;if(old){try{await restoreSave(old);}catch(recovery){message='이전 진행 복원 실패: '+recovery.message;}}active=prior;error(e);return false;
  }finally{pending=null;busy=false;operation=null;}
 }
 function confirm(kind,n){if(locked()){error(Error('로딩이 끝난 뒤 다시 선택하세요.'));return;}if(kind==='load')return transact(kind,n);
  let raw;try{raw=read(n);}catch(e){message='기존 데이터 오류 · 원본 보존: '+e.message;raw={zone:'손상된 저장',layer:'STORY',player:{},progress:{}};}
  openPanel(`<h2>슬롯 ${n} · ${kind==='new'?'처음부터 시작':'진행 저장'}</h2><p>${escapeHTML(summary(raw))}</p><p>${kind==='new'?'이 슬롯에서 새로운 여정을 시작합니다. 기존 진행은 이 슬롯의 이전 진행으로 백업합니다.':'현재 진행으로 이 슬롯을 덮어씁니다.'} 다른 슬롯은 유지됩니다.</p><div class="actions"><button id="slotConfirmR73">슬롯 ${n}에 ${kind==='new'?'새 게임 시작':'저장'}</button><button id="slotCancelR73">취소</button></div>`);
  button('slotConfirmR73',()=>{const b=$('slotConfirmR73');if(b)b.disabled=true;return transact(kind,n);});button('slotCancelR73',panel);
 }
 function panel(){if(loading||storyScene)return;migrate();const cards=slots.map(n=>{let raw,status;try{raw=read(n);status=summary(raw);}catch(e){status='읽기 오류 · '+e.message;}return`<div class="card"><strong>슬롯 ${n}${n===active?' · 현재 진행':''}</strong><p>${escapeHTML(status)}</p><div class="actions"><button data-slot-load="${n}" ${!raw||busy?'disabled':''}>불러오기</button><button data-slot-new="${n}" ${busy?'disabled':''}>처음부터 시작</button><button data-slot-save="${n}" ${n!==active||!ready()||cheat()||busy?'disabled':''}>저장</button></div></div>`;}).join('');openPanel(`<h2>게임 저장 · 3슬롯</h2><p id="slotsMessageR73" role="status">${escapeHTML(message||'일반 진행 3개 · 777은 별도 시험 저장')}</p><div class="cards">${cards}</div><button id="slotsBackR73">${started?'게임으로 돌아가기':'시작 메뉴'}</button>`);for(const kind of ['load','new','save'])for(const b of $('panel').querySelectorAll(`[data-slot-${kind}]`))b.onclick=()=>confirm(kind,Number(b.dataset['slot'+kind[0].toUpperCase()+kind.slice(1)]));button('slotsBackR73',()=>started?closePanel(true):showTitle());}
 const titleBase=showTitle;showTitle=function(...a){migrate();const result=titleBase.apply(this,a),p=$('panel');if($('campaignNew54')){button('campaignNew54',()=>confirm('new',active));button('campaignContinue54',()=>transact('load',active));const b=document.createElement('button');b.id='slotsOpenTitleR73';b.textContent='게임 저장 슬롯 · 현재 '+active;b.onclick=panel;p.appendChild(b);const status=document.createElement('p');status.className='small';status.textContent=message||'저장 슬롯 '+active+' · 다른 슬롯은 저장 슬롯 메뉴에서 선택';p.appendChild(status);}return result;};
 const menuBase=showMenu;showMenu=function(...a){const result=menuBase.apply(this,a);if(!loading&&!storyScene){const b=document.createElement('button');b.id='slotsOpenR73';b.textContent='게임 저장·불러오기 · 3슬롯';b.onclick=panel;($('panel').querySelector('.actions')||$('panel')).appendChild(b);button('campaignNewMenu54',()=>confirm('new',active));}return result;};
 // The canonical title continue button must honor the current slot, including
 // errors, instead of treating a failed restore as a successful UI transition.
 loadLocal=()=>cheat()?window.__STORYWORLD_CHEAT777__.load():transact('load',active);
 window.__STORYWORLD_SAVE_SLOTS_R73__=Object.freeze({key,panel,confirm,read,summary,transitioning:()=>transitionDepth>0,confirmedNew:()=>busy&&operation==='new',inspect:()=>({active,pending,busy,operation,transitionDepth,message,legacyPreserved:true,audit:[...audit]})});
 migrate();if(booted&&!started)showTitle();
})();
