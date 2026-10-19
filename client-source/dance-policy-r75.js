/* Per-player options are separate from design slots/cooldowns and spend no points. */
(()=>{'use strict';
 const keys=['gold','native','silver'],labels={gold:'황금실',native:'기본 실검무',silver:'은색실'};
 const current=()=>window.__STORYWORLD_COOP_SIM_R62__?.currentPlayer?.()||player;
 function clean(v){if(v===undefined)return{gold:false,native:false,silver:false};if(!v||v.version!==1||keys.some(k=>typeof v[k]!=='boolean'))throw Error('검무 보스 전용 설정이 올바르지 않습니다.');return Object.fromEntries(keys.map(k=>[k,v[k]]));}
 function state(p=current()){if(!p)return{gold:false,native:false,silver:false};return p.dancePolicyR75??=(clean());}
 function boss(e){return!!(e&&(e.boss||e.midboss||e.cosmic||e.trial||e.persona)&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&room?.enemies?.includes(e));}
 function target(k,e,p=current()){return!state(p)[k]||boss(e);}
 function can(k,p=current()){return!state(p)[k]||!!(p?.hp>0&&!safeRegion()&&room?.enemies?.some(e=>boss(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=12));}
 function set(k,value,p=current()){if(!keys.includes(k)||typeof value!=='boolean'||!p)return false;state(p)[k]=value;saveGame(false);return true;}
 function controls(){const root=$('panel');if(!root||$('dancePolicyR75'))return;const section=document.createElement('section');section.id='dancePolicyR75';const title=document.createElement('h3');title.textContent='검무 · 보스가 있을 때만 사용';section.appendChild(title);for(const k of keys){const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=state()[k];box.setAttribute('aria-label',labels[k]+' 보스 전용');box.onchange=()=>set(k,box.checked);label.appendChild(box);label.appendChild(document.createTextNode(labels[k]));section.appendChild(label);}root.appendChild(section);}
 const menuBase=showMenu;showMenu=function(...a){const result=menuBase.apply(this,a);if(started&&!storyScene)controls();return result;};
 const dances=window.__STORYWORLD_DANCES_R74__;if(dances)window.__STORYWORLD_DANCES_R74__=Object.freeze({...dances,decorateManager(...a){const r=dances.decorateManager(...a);controls();return r;}});
 const saveBase=serializeSave;serializeSave=function(...a){const raw=saveBase.apply(this,a);raw.dancePolicyR75={version:1,...state()};return raw;};
 const restoreBase=restoreSave;restoreSave=async function(raw,...a){const value=clean(raw?.dancePolicyR75),result=await restoreBase.call(this,raw,...a);if(result!==false)current().dancePolicyR75=value;return result;};
 const freshBase=freshPlayer;freshPlayer=function(...a){const p=freshBase.apply(this,a);p.dancePolicyR75=clean();return p;};
 window.__STORYWORLD_DANCE_POLICY_R75__=Object.freeze({state,clean,boss,target,can,set,controls});
})();
