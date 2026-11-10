'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),defaultBundle=path.resolve(root,'../assets-dynamic-vfx-20261023/extracted/StoryWorld-Dynamic-VFX');
function once(source,before,after,label){if(source.includes(after))return source;if(source.split(before).length!==2)throw Error('R84 dynamic anchor missing/duplicate: '+label);return source.replace(before,after);}
function patchSelected(source){
 source=once(source,"const beginFrame=()=>{frameDraws=0;frameKeys.clear();for(const role of Object.keys(roleDraws))roleDraws[role]=0;};","const beginFrame=()=>{frameDraws=0;frameKeys.clear();for(const role of Object.keys(roleDraws))roleDraws[role]=0;window.__STORYWORLD_DYNAMIC_VFX_R84__?.beginFrame();};",'shared native frame reset');
 if(!source.includes("scale=1,progress=.25,anchor=''}={})"))source=once(source,"key='',scale=1}={})","key='',scale=1,progress=.25}={})",'native phase argument');
 source=once(source,"ctx.imageSmoothingEnabled=true;ctx.drawImage(row.image,0,0,iw,ih,-cx*k,-cy*k,iw*k,ih*k);","ctx.imageSmoothingEnabled=true;const r84=window.__STORYWORLD_DYNAMIC_VFX_R84__,handled=r84?.paint64(a,row.image,{maximum,progress,seed:key||ownerId||a.key,eventOwner:'vfx-r83:'+role+':'+(key||ownerId),nativeOwner:ownerId,role,x,y});if(!handled)ctx.drawImage(row.image,0,0,iw,ih,-cx*k,-cy*k,iw*k,ih*k);",'single original PNG draw owner');
 source=once(source,"key:p.id||String(p.age)});","key:p.id||String(p.age),progress:clamp(p.age/Math.max(.001,p.life),0,.999999)});",'native shot age');
 source=once(source,"ownerId:e.id,key:h.id});}\n  else if(time<r.impactAt)","ownerId:e.id,key:h.id,progress:Number.isFinite(r.warningAt)?clamp((time-r.warningAt)/Math.max(.001,r.releaseAt-r.warningAt),0,.999999):.25});}\n  else if(time<r.impactAt)",'native cast windup');
 source=once(source,"ownerId:e.id,key:h.id});}\n  else if(time<r.impactAt+.32","ownerId:e.id,key:h.id,progress:t});}\n  else if(time<r.impactAt+.32",'native cast flight');
 source=once(source,"scale:.8,ownerId:e.id,key:h.id});}","scale:.8,ownerId:e.id,key:h.id,progress:(time-r.impactAt)/.32});}",'native cast recovery');
 if(!source.includes("ownerId:e.r83Owner,key:e.r83Serial,progress:t,anchor:e.r83Anchor});"))source=once(source,"ownerId:e.r83Owner,key:e.r83Serial});","ownerId:e.r83Owner,key:e.r83Serial,progress:t});",'native admitted effect age');
 source=once(source,"sourceBytesUnchanged:true,staticSingleComponents:true,","sourceBytesUnchanged:true,staticSingleComponents:true,staticSingleComponentsMeaning:'each supplied PNG is one unchanged static source component',staticSourcePNGsPreserved:true,dynamic64Driven:!!window.__STORYWORLD_DYNAMIC_VFX_R84__,",'truthful source versus runtime inspect');
 source=once(source,"scale=1,progress=.25}={})","scale=1,progress=.25,anchor=''}={})",'native source admission anchor');
 source=once(source,"const row=ready(role);if(!row||!row.image)return false;","const row=ready(role);if(!row||!row.image||window.__STORYWORLD_DYNAMIC_VFX_R84__?.allows64(row.spec,anchor)===false)return false;",'compact parry source semantic admission');
 source=once(source,"ownerId:e.r83Owner,key:e.r83Serial,progress:t});","ownerId:e.r83Owner,key:e.r83Serial,progress:t,anchor:e.r83Anchor});",'confirmed native transient anchor');
 source=once(source,"const hp=player?.hp,shield=player?.shield,result=hurtBase.apply(this,arguments);","const hp=player?.hp,shield=player?.shield,result=hurtBase.apply(this,arguments);\n  if(eligible()&&result==='parried'&&specFor('projectile')?.key==='10_knight_parry_counter'){const e=actor(source?.owner||source?.ownerId);if(major(e))emit('projectile',player.x,player.y-.15,{owner:e,life:.3,lift:.3,anchor:'actual native player parry'});}",'native parry-only point component');
 return source;
}
function patchHTML(source){
 const marker='<!-- R84 supplied deterministic VFX: no preview loop -->';if(source.includes(marker))return source;
 return source.trimEnd()+'\n'+marker+'\n<script src="./assets/dynamic-vfx-r84/catalog.js"></script>\n<script src="./assets/dynamic-vfx-r84/runtime.js"></script>\n<script src="./dynamic-vfx-r84.js"></script>\n';
}
function installAssets(site,bundle=process.env.STORYWORLD_R84_BUNDLE||(fs.existsSync(defaultBundle)?defaultBundle:path.join(root,'hospital-three-pc/source-patch/asset-source-docs/dynamic-vfx-r84'))){
 const dest=path.join(site,'assets/dynamic-vfx-r84');fs.mkdirSync(dest,{recursive:true});
 for(const name of ['runtime.js','catalog.js','catalog.json','README-KO.txt','provenance.json','review.txt','cpu-integrity-report.json','runtime-test-report.json']){const p=path.join(bundle,name);if(!fs.existsSync(p))throw Error('Required supplied source missing: '+p);fs.copyFileSync(p,path.join(dest,name));}
 fs.cpSync(path.join(bundle,'vectors'),path.join(dest,'vectors'),{recursive:true});return dest;
}
function apply(target){
 const site=target&&path.basename(target)==='index.html'?path.dirname(target):target||path.join(root,'hospital-three-pc/site'),selected=path.join(site,'vfx-selected-r83.js'),index=path.join(site,'index.html');
 fs.writeFileSync(selected,patchSelected(fs.readFileSync(selected,'utf8')));fs.writeFileSync(index,patchHTML(fs.readFileSync(index,'utf8')));fs.copyFileSync(path.join(root,'client-source/dynamic-vfx-r84.js'),path.join(site,'dynamic-vfx-r84.js'));installAssets(site);
 return{revision:'R84',sourceTimelines:64,proceduralMotifs:16,sourcePNGBytesReused:true,previewLoopLoaded:false};
}
module.exports={patchSelected,patchHTML,installAssets,apply};
if(require.main===module){if(process.argv[2]==='--canonical'){const p=path.join(root,'client-source/vfx-selected-r83.js');fs.writeFileSync(p,patchSelected(fs.readFileSync(p,'utf8')));console.log('R84 canonical R83 adapter patched');}else console.log(JSON.stringify(apply(process.argv[2])));}
