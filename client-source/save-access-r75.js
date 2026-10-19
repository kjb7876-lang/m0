/* A saved 777 session must be reachable after reconnecting without activating
 * a fresh session that would overwrite its isolated slot. Native restore owns
 * all validation and preserves the currently open normal journey as return. */
(()=>{'use strict';
 const native=window.__STORYWORLD_CHEAT777__,slot=SAVE+'.cheat777';
 async function resumeSaved(){if(!started||!player||player.hp<=0||loading||storyScene||!canTravel()||(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')!=='off'||native.active()){toast('일반 단독 진행을 연 뒤, 전투와 장면이 끝난 상태에서 이어갈 수 있습니다.');return false;}const text=localStorage.getItem(slot);if(!text){toast('저장된 777 시험 진행이 없습니다.');return false;}try{const raw=JSON.parse(text);if(raw?.cheat777?.active!==true||raw.cheat777.version!==1)throw Error('777 시험 저장 형식이 아닙니다.');closePanel(true);const result=await restoreSave(raw);return result!==false;}catch(e){toast('777 이어가기 실패: '+e.message,4);return false;}}
 function append(){if(native.active()||!$('codeApply')||!localStorage.getItem(slot)||$('codeResumeR75'))return;const b=document.createElement('button');b.id='codeResumeR75';b.textContent='저장된 777 시험 이어가기';b.onclick=resumeSaved;$('panel').appendChild(b);}
 $('story-code-button')?.addEventListener('click',append);
 window.__STORYWORLD_CHEAT777__=Object.freeze({...native,panel(...a){const result=native.panel(...a);append();return result;},resumeSaved});
})();
