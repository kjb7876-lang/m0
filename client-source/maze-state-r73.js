/* Additive save schema and host-owned seed ledger; never accepts geometry. */
(()=>{'use strict';
 let runSeed=0,entries=Object.create(null),generation=0;const limit=126;
 const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
 const random=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]||1;};
 const validKey=k=>{const parts=String(k).split(':');return parts.length===2&&['STORY','DREAM'].includes(parts[0])&&Object.hasOwn(regionById,parts[1]);};
 function hash(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;}
 function seed(id,l=layer){const k=l+':'+id;if(!validKey(k))throw Error('미로 지역·세계가 올바르지 않습니다.');if(regionById[id].safe||id==='ep1a08')return 0;if(Object.hasOwn(entries,k))return entries[k];const value=runSeed?hash(runSeed+':'+k):0;if(Object.keys(entries).length>=limit)throw Error('미로 저장 지역 상한을 넘었습니다.');entries[k]=value;return value;}
 function read(raw){
  const saved=raw?.mazeR73,next=Object.create(null);
  if(saved!==undefined){if(!saved||saved.version!==1||!uint(saved.runSeed)||!saved.entries||typeof saved.entries!=='object'||Array.isArray(saved.entries)||Object.keys(saved.entries).length>limit)throw Error('미로 저장 형식이 올바르지 않습니다.');for(const[k,v]of Object.entries(saved.entries)){if(!validKey(k)||!uint(v))throw Error('미로 저장 지역·시드를 확인하세요.');next[k]=v;}return{runSeed:saved.runSeed,entries:next};}
  // Previously generated/visited/progressed maps keep their exact legacy map.
  for(const k of Object.keys(raw?.rooms||{}).slice(0,limit))if(validKey(k))next[k]=0;
  for(const k of (Array.isArray(raw?.visited)?raw.visited:[]).slice(0,limit))if(validKey(k))next[k]=0;
  for(const l of ['STORY','DREAM'])for(const[id,done]of Object.entries(raw?.progress?.[l]||{}))if(done===true&&validKey(l+':'+id))next[l+':'+id]=0;
  if(validKey(raw?.layer+':'+raw?.zone))next[raw.layer+':'+raw.zone]=0;
  return{runSeed:random(),entries:next};
 }
 const saveBase=serializeSave;serializeSave=function(...args){const raw=saveBase.apply(this,args);const coopMode=window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';if(coopMode!=='off'){delete raw.mazeR73;return raw;}raw.mazeR73={version:1,runSeed,entries:{...entries}};return raw;};
 const restoreBase=restoreSave;restoreSave=async function(raw,...args){const next=read(raw),prior={runSeed,entries};runSeed=next.runSeed;entries=next.entries;try{const result=await restoreBase.call(this,raw,...args);if(result===false){runSeed=prior.runSeed;entries=prior.entries;}else generation++;return result;}catch(e){runSeed=prior.runSeed;entries=prior.entries;generation++;throw e;}};
 const newBase=newGame;newGame=async function(...args){const prior={runSeed,entries},before=player;runSeed=random();entries=Object.create(null);try{const result=await newBase.apply(this,args);if(result===false||player===before||!started){runSeed=prior.runSeed;entries=prior.entries;}else generation++;return result;}catch(e){runSeed=prior.runSeed;entries=prior.entries;generation++;throw e;}};
 function adopt(id,l,value){if(!validKey(l+':'+id)||!value||value.version!==1||!uint(value.seed)||Object.keys(value).some(k=>!['version','seed'].includes(k))||((regionById[id].safe||id==='ep1a08')&&value.seed!==0))throw Error('방장 미로 시드가 올바르지 않습니다.');const k=l+':'+id,previous=seed(id,l);if(previous===value.seed)return false;if(window.__STORYWORLD_COOP_SIM_R62__?.mode()!=='guest')throw Error('방장 미로 시드가 현재 지도와 일치하지 않습니다.');entries[k]=value.seed;generation++;if(world?.[k])delete world[k];return true;}
 const packet=(id=zone,l=layer)=>({version:1,seed:seed(id,l)});
 window.__STORYWORLD_MAZE_R73__=Object.freeze({seed,packet,adopt,run:()=>runSeed,generation:()=>generation,inspect:()=>({version:1,runSeed,entries:{...entries},generation,limit})});
})();
