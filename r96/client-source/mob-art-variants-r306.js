// R306: a new-run choice, never a global rendering preference or in-game toggle.
// Default runs pass directly through the original drawing/save functions.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_ART_VARIANTS_R306__)return;
const DATA=window.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__||{actors:{},rows:{}};
let mode='painted',pending=null;const asked=new Map(),shadows=new Map();
const stats={replaced:0,unknown:0,waiting:0,unmatched:0,shadowCalls:0,shadowBuilt:0,shadowHits:0,shadowOutside:0,shadowMobile:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,180);};
const normalize=n=>String(n||'').replace(/^(중간보스|준보스)\s*·\s*/,'').replace(/\s*·\s*짙은 형상$/,'').replace(/\s*(후속 증원|증원|추격대)$/,'').replace(/\s+\d+$/,'').trim();
const clean=p=>{const s=String(p||''),i=s.indexOf('/assets/');return i>=0?s.slice(i+1):s.replace(/^\.\//,'');};
function rowFor(e){if(!e||e.hero||(typeof player!=='undefined'&&e===player)||e.r170Tower||e.r251Circle)return null;
 const key=(typeof layer==='string'?layer:'STORY')+'|'+String(e.nativeId||'')+'|'+normalize(e.name);return DATA.rows[DATA.actors[key]]||null;}
function image(path){const im=typeof readyImage==='function'?readyImage(path)?.image:null;if((im?.naturalWidth||im?.width)>0)return im;
 const now=Date.now();if(typeof ensureImages==='function'&&now-(asked.get(path)||0)>2000){asked.set(path,now);Promise.resolve(ensureImages([path])).catch(fail);}return null;}
function cell(e){const t=typeof time==='number'?time:0;if(e.attack&&Number.isFinite(e.attack.elapsed)){const s=e.attack.shape154||e.combatProfile?.attackShape||{},w=e.attack.castWindup150??s.windup??.45,a=s.active??.15,r=s.recovery??.35,u=e.attack.elapsed;return u<w?8:u<w+a?9:u<w+a+r*.5?10:11;}
 return e.rangedWindup>0?8:e.moving?Math.floor(t*8)%8:Math.floor(t*2)%2;}
function shadowPlan(x,y,w,h){if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0||x<0||x>w||y<0||y>h)return null;
 const dx=x-w/2,dy=Math.min(-1,y-h),d=Math.hypot(dx,dy);return{dx:dx/d,dy:dy/d,alpha:.35+.2*(1-Math.min(1,d/Math.hypot(w,h))),distance:d};}
function cachedShadow(s,im,fr){const key=s.path+':'+fr;let row=shadows.get(key);if(row){stats.shadowHits++;shadows.delete(key);shadows.set(key,row);return row.ready?row.image:null;}
 if(typeof Image!=='function'||!document.createElement)return null;
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=80;const c=canvas.getContext?.('2d');if(!c)return null;
 c.imageSmoothingEnabled=false;c.drawImage(im,fr%4*s.cell[0],Math.floor(fr/4)*s.cell[1],...s.cell,0,0,64,80);c.globalCompositeOperation='source-in';c.fillStyle='#100e13';c.fillRect(0,0,64,80);
 c.globalCompositeOperation='destination-out';for(let y=0;y<80;y++)for(let x=y%2;x<64;x+=2)c.fillRect(x,y,1,1);
 // Immutable decoded image avoids a mutable-canvas snapshot on every draw.
 const bitmap=new Image();row={image:bitmap,ready:false};bitmap.onload=()=>{row.ready=true;};bitmap.onerror=()=>{shadows.delete(key);};shadows.set(key,row);bitmap.src=canvas.toDataURL('image/png');stats.shadowBuilt++;
 while(shadows.size>48)shadows.delete(shadows.keys().next().value);return null;}
function paintShadow(e,s,im,fr,c,outer){
 if(window.__STORYWORLD_ENEMY_FACE_R444__?.noShadows?.())return;/* R444 사용자 2026-11-09 몬스터 그림자 없애기 */
 if(!outer||typeof project!=='function'||typeof c.setTransform!=='function'||typeof c.save!=='function')return;
 const q=project(e.x,e.y),w=typeof W==='number'?W:0,h=typeof H==='number'?H:0,plan=shadowPlan(q.x,q.y,w,h);if(!plan){stats.shadowOutside++;return;}
 const small=w<960||(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches),height=(typeof actorHeight==='function'?actorHeight():60)*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1),size=Math.min(height,180),scale=size/Math.max(10,s.body/4),bitmap=small?null:cachedShadow(s,im,fr);
 const draw=()=>{const smooth=c.imageSmoothingEnabled;c.save();try{c.setTransform(outer.a,outer.b,outer.c,outer.d,outer.e,outer.f);c.imageSmoothingEnabled=false;c.globalAlpha=plan.alpha;
  if(bitmap){c.save();c.translate(q.x,q.y);c.transform(-plan.dy*scale*.7,plan.dx*scale*.7,-plan.dx*scale*.7,-plan.dy*scale*.7,0,0);c.drawImage(bitmap,-s.pivot[0]/4,-s.pivot[1]/4,64,80);c.restore();}
  // Quantized contact shadow; coarse-pointer/mobile uses only this cheap path.
  const step=2,width=Math.max(6,Math.round(size*.18/step));c.fillStyle='#100e13';c.globalAlpha=.55;
  const compound=typeof c.beginPath==='function'&&typeof c.rect==='function'&&typeof c.fill==='function';if(compound)c.beginPath();
  for(let y=-1;y<=1;y++)for(let x=-width;x<=width;x++)if((x+y)%2===0&&Math.abs(x)<width-Math.abs(y)*2)(compound?c.rect:c.fillRect).call(c,Math.round(q.x/step)*step+x*step,Math.round(q.y/step)*step+y*step,step,step);
  if(compound)c.fill();
  stats.shadowCalls++;if(small)stats.shadowMobile++;
 }finally{c.restore();c.imageSmoothingEnabled=smooth;}};
 if(typeof c.scope==='function')c.scope({id:'r306:contact:'+e.id,kind:'contact',groundAligned:true,x:e.x,y:e.y,alive:e.hp>0},draw);else draw();
}
function frameForPath(e,row,path,a){const frames=[...(row.frames||[])];const live=e.rc146BodyFrame;if(live?.path)frames.unshift({...live,...live.assetFrame});for(const f of Object.values(e.profile?.frames||{}))if(f?.path)frames.unshift({...f,...f.assetFrame});
 return frames.find(f=>clean(f.path)===path&&Array.isArray(f.pivot)&&Array.isArray(f.sourceRect)&&a.length===8&&f.sourceRect.every((v,i)=>Math.abs(v-a[i])<.01))||null;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...args){
 if(mode!=='pixel')return base.apply(this,[e,...args]);
 const coop=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();if(coop&&coop!=='off')return base.apply(this,[e,...args]);
 const row=rowFor(e);if(!row){stats.unknown++;return base.apply(this,[e,...args]);}const im=image(row.pixel.path);if(!im){stats.waiting++;return base.apply(this,[e,...args]);}
 const c=typeof ctx!=='undefined'?ctx:null;if(!c?.drawImage)return base.apply(this,[e,...args]);
 const original=c.drawImage,own=Object.prototype.hasOwnProperty.call(c,'drawImage'),outer=c.getTransform?.();let replaced=false;
 c.drawImage=function(source,...a){const path=clean(source?.__path||source?.src),paths=[...(row.paths||[]),e.path,e.rc146BodyFrame?.path,...Object.values(e.profile?.frames||{}).map(f=>f?.path)].filter(Boolean).map(clean);
  if(!path||!paths.includes(path))return original.call(this,source,...a);
  if(replaced)return;if(a.length!==8&&a.length!==4&&a.length!==2)return original.call(this,source,...a);
  const s=row.pixel,f=frameForPath(e,row,path,a),sw=a.length===8?a[2]:(source.naturalWidth||source.width),sh=a.length===8?a[3]:(source.naturalHeight||source.height);
  const d=a.length===8?a.slice(4):a.length===4?a:[...a,sw,sh];if(!(sw>0&&sh>0&&d[2]>0&&d[3]>0))return original.call(this,source,...a);
  const pivot=f?.pivot||[sw*.5,sh*.96],body=f?.visibleHeight||sh,k=d[3]*body/sh/Math.max(1,s.body),x=d[0]+d[2]*pivot[0]/sw,y=d[1]+d[3]*pivot[1]/sh;
  const fr=cell(e); // R286 has now applied its temporary attack/movement pose.
  replaced=true;try{paintShadow(e,s,im,fr,this,outer);}catch(err){fail(err);}
  const smooth=this.imageSmoothingEnabled;this.imageSmoothingEnabled=false;try{stats.replaced++;const q=[fr%s.cols*s.cell[0],Math.floor(fr/s.cols)*s.cell[1],...s.cell,x-s.pivot[0]*k,y-s.pivot[1]*k,s.cell[0]*k,s.cell[1]*k];const result=original.call(this,im,...q);window.__STORYWORLD_HIT_CENTER_R259__?.bodyDrawn?.(e,im,q,this.getTransform?.());return result;}finally{this.imageSmoothingEnabled=smooth;}
 };
 try{return base.apply(this,[e,...args]);}finally{if(own)c.drawImage=original;else delete c.drawImage;if(!replaced)stats.unmatched++;}
};}
if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const raw=base.apply(this,a);if(mode==='pixel')raw.mobArt='pixel';return raw;};}
if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const old=mode;mode=pending==='pixel'?'pixel':'painted';pending=null;try{const result=await base.apply(this,a);if(result===false)mode=old;return result;}catch(e){mode=old;throw e;}};}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const old=mode;if(!window.__STORYWORLD_SAVE_SLOTS_R73__?.confirmedNew?.())pending=null;mode=raw?.mobArt==='pixel'?'pixel':'painted';try{const result=await base.call(this,raw,...a);if(result===false)mode=old;return result;}catch(e){mode=old;throw e;}};}
function titleChoice(){const panel=document.getElementById('panel'),normal=document.getElementById('campaignNew54')||document.getElementById('newBtn');if(!panel||!normal||document.getElementById('pixelStartR306'))return;
 const action=normal.onclick;if(typeof action!=='function')return;normal.onclick=function(...a){pending=null;return action.apply(this,a);};
 const b=document.createElement('button');b.id='pixelStartR306';b.type='button';b.textContent='픽셀 모드로 시작';b.onclick=function(...a){pending='pixel';return action.apply(normal,a);};(normal.parentNode||panel).appendChild(b);
}
if(typeof showTitle==='function'){const base=showTitle;showTitle=function(...a){pending=null;const result=base.apply(this,a);titleChoice();return result;};}
if(typeof showMenu==='function'){const base=showMenu;showMenu=function(...a){pending=null;return base.apply(this,a);};}
document.addEventListener?.('click',event=>{if(['slotCancelR73','heroBack','campaignContinue54','continueBtn','campaignImport54','importBtn','slotsBackR73'].includes(event.target?.id))pending=null;},true);
titleChoice();
window.__STORYWORLD_MOB_ART_VARIANTS_R306__=Object.freeze({inspect:()=>({mode,pending,stats:{...stats},lastError,shadowCache:shadows.size}),shadowPlan});
})();
