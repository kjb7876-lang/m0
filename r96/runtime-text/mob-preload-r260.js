// R260 몹 본체 그림 미리 읽기 — 입장과 증원 때 전용 시트를 먼저 요청한다.
// 살아 있는 일반 몹이 화면에 들어오면 읽혀 있는 본체를 첫 프레임부터 그린다.
// 전용 그림이 읽히기 전 공용 공격판을 골랐다면 같은 몹의 원래 몸 그림으로만 바꾼다.
// 장면 밖의 몹과 다른 연출이 있는 보스는 기존 대기 규칙을 따른다.
// 끄기: localStorage['storyworld.r260.preload']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_MOB_PRELOAD_R260__)return;
const REV='R260-preload-3',KEY='storyworld.r260.preload',HOLD=1.2,NEAR=9;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={batches:0,paths:0,held:0,released:0,ownStill:0,nearFallback:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let seen=new WeakSet();
const asked=new Set();
let scannedRoom=null,scannedEnemies=null,scannedLength=-1,scannedTime=null;
let retryRoom=null,retryAt=0;
const stableClock=()=>typeof time==='number'?time:Math.floor(performance.now()/16);
function wanted(e,includeAttacks=false){const out=[];try{const m=window.__STORYWORLD_STORY_MOBS_R208__?.assign?.(e);if(m?.path)out.push(m.path);}catch(err){fail(err);}
 try{const d=window.__STORYWORLD_MOB_DOTS_R374__?.assign?.(e)||window.__STORYWORLD_MOB_DOTS_R375__?.assign?.(e)||window.__STORYWORLD_APPROVED_MOBS_R380__?.assign?.(e);if(d?.path){
  out.push(d.path);
  if(includeAttacks&&d.attackSheet)out.push(d.attackSheet);
  return out;
 }}catch(err){fail(err);}/* R374: Dots 승인 그림을 받은 액터는 그 시트만 기다린다(R248 시트는 안 씀) */
 try{const s=window.__STORYWORLD_MOB_UNIQUE_R248__?.sheetFor?.(e);if(s?.path)out.push(s.path);}catch(err){fail(err);}return out;}
const ready=p=>{try{return !!(typeof readyImage==='function'&&readyImage(p)?.image?.naturalWidth>0);}catch(_){return false;}};
function scan(){
 if(!on||typeof room!=='object'||!room||typeof ensureImages!=='function')return;
 const here=room,enemies=here.enemies,t=stableClock();
 if(!enemies)return;
 if(retryRoom===here&&Date.now()>=retryAt){
  seen=new WeakSet();
  retryRoom=null;
  scannedRoom=null;
 }
 // The first draw in a simulation frame scans the population. A new room or spawn still scans immediately.
 if(here===scannedRoom&&enemies===scannedEnemies&&enemies.length===scannedLength&&t===scannedTime)return;
 scannedRoom=here;scannedEnemies=enemies;scannedLength=enemies.length;scannedTime=t;
 const list=[];
 for(const e of enemies){
  if(!e||seen.has(e))continue;
  seen.add(e);
  for(const p of wanted(e,true)){
   if(asked.has(p)||ready(p))continue;
   // A terminal Image error is already retried by addImage; avoid stalling another batch on that same cached rejection.
   const key=typeof cleanPath==='function'?cleanPath(p):p;
   if(typeof imageCache!=='undefined'&&imageCache?.get(key)?.error)continue;
   asked.add(p);list.push(p);
  }
 }
 if(!list.length)return;
 stats.batches++;stats.paths+=list.length;
 const retry=err=>{
  fail(err);
  for(const p of list)asked.delete(p);
  if(room===here){retryRoom=here;retryAt=Date.now()+1500;}
 };
 try{Promise.resolve(ensureImages(list)).catch(retry);}catch(err){retry(err);}
}
const srcPath=im=>{try{const s=String(im?.__path||im?.currentSrc||im?.src||'');const i=s.indexOf('/assets/');return (i>=0?s.slice(i+1):s).split('?')[0].replace(/^\.\//,'');}catch(_){return '';}};
function bodyPaths(e){const out=new Set();try{const fs=window.__STORYWORLD_STORY_COMBAT_R54__?.frameSet?.(e);if(fs)for(const v of Object.values(fs))if(v?.path)out.add(v.path);}catch(_){}
 try{for(const v of Object.values(e.profile?.frames||{}))if(v?.path)out.add(v.path);}catch(_){}if(e.path)out.add(e.path);if(e.rc146BodyFrame?.path)out.add(e.rc146BodyFrame.path);return out;}
const KEEP=/shadow|ring|glow|hp|bar|effects\/|vfx|fx/i;// 몸이 아닌 것(그림자·고리·체력바·이펙트)만 남긴다
const T=()=>typeof time==='number'?time:performance.now()/1000;
const SHARED_ATTACK=/(?:^|\/)rc137\/mob-attacks-[^/]+\.png$/i;
function nearOrOnScreen(e){
 if(typeof player!=='object'||!player||Math.hypot(e.x-player.x,e.y-player.y)<=NEAR)return true;
 if(typeof project!=='function'||typeof W!=='number'||typeof H!=='number')return false;
 const point=project(e.x,e.y);
 const height=(typeof actorHeight==='function'?actorHeight():60)*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1);
 return point.x>=-height*.5&&point.x<=W+height*.5&&point.y>=0&&point.y-height<=H;
}
function modeFor(e){
 if(!on||!(e?.hp>0))return null;
 const paths=wanted(e);
 if(!paths.length||paths.every(ready))return null;
 const close=nearOrOnScreen(e);
 if(close&&e.spawnState==='active'&&e.visible!==false&&!e.disabled&&!e.boss&&!e.midboss&&!e.persona&&!e.trial&&!e.cosmic&&!e.samongBoss&&!e.combatProfile?.major){
  return 'native';
 }
 if(!close&&!e.r260Released)return 'hold';
 if(!Number.isFinite(e.r260First))e.r260First=T();
 if(T()-e.r260First<=HOLD)return 'hold';
 if(!e.r260Released){e.r260Released=true;stats.released++;}
 return null;
}
function nativeStill(e){
 // This actor's idle cell can use an atlas. Keep its source rectangle and never draw the whole sheet.
 if(typeof readyImage!=='function')return null;
 const idle=e.profile?.frames?.idle;
 for(const path of [e.path,idle?.path]){
  if(!path||SHARED_ATTACK.test(path))continue;
  const row=readyImage(path),image=row?.image;
  if(!(image?.naturalWidth>0&&image.naturalHeight>0))continue;
  const rect=idle?.path===path&&idle.assetFrame?.sourceRect;
  const crop=rect?.length===4?{x:rect[0],y:rect[1],w:rect[2],h:rect[3]}:
   row.crop||{x:0,y:0,w:image.naturalWidth,h:image.naturalHeight};
  const w=Math.min(crop.w,image.naturalWidth-crop.x),h=Math.min(crop.h,image.naturalHeight-crop.y);
  if(crop.x>=0&&crop.y>=0&&w>0&&h>0)return {image,x:crop.x,y:crop.y,w,h};
 }
 return null;
}
if(typeof drawEnemy==='function'){
 const base=drawEnemy;
 drawEnemy=function(e,...args){
  let mode=null;try{scan();mode=modeFor(e);}catch(err){fail(err);}
  const c=typeof ctx!=='undefined'?ctx:null;
  if(!mode||typeof c?.drawImage!=='function')return base.apply(this,[e,...args]);
  const drawImage=c.drawImage,own=Object.prototype.hasOwnProperty.call(c,'drawImage');
  if(mode==='native'){
   stats.nearFallback++;
   let still;
   c.drawImage=function(image,...a){
    if(a.length===8&&SHARED_ATTACK.test(srcPath(image))){
     if(still===undefined){try{still=nativeStill(e);}catch(err){fail(err);still=null;}}
     const [,,,,x,y,w,h]=a;
     if(still&&[x,y,w,h].every(Number.isFinite)&&w&&h){
      const width=Math.sign(w)*Math.abs(h)*still.w/still.h;
      stats.ownStill++;
      return drawImage.call(this,still.image,still.x,still.y,still.w,still.h,x+(w-width)*.5,y,width,h);
     }
    }
    return drawImage.call(this,image,...a);
   };
  }else{
   const paths=bodyPaths(e);stats.held++;
   c.drawImage=function(image,...a){
    const p=srcPath(image);
    if(!KEEP.test(p)||(p&&[...paths].some(x=>p===x||p.endsWith(x))))return;
    return drawImage.call(this,image,...a);
   };
  }
  try{return base.apply(this,[e,...args]);}
  finally{if(own)c.drawImage=drawImage;else delete c.drawImage;}
 };
}
if(typeof setInterval==='function')setInterval(()=>{try{scan();}catch(err){fail(err);}},250);// 입장 로딩 중(그리기 전)에도
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_MOB_PRELOAD_R260__=Object.freeze({revision:REV,set,wanted:e=>wanted(e,true),inspect:()=>({revision:REV,on,stats:{...stats},asked:asked.size,lastError})});
})();
