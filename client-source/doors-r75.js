/* Upright world planes, using unchanged original front-view atlas pixels.
 * A double leaf retracts into its wall pocket when open, leaving the exact
 * admitted doorway clear. Frame posts sit outside the collision aperture. */
(()=>{'use strict';
 const art=window.__STORYWORLD_ART_R75__,path=art.path,world=()=>window.__STORYWORLD_WORLD_R74__;
 function registerArt(){imageInventory.add(path);register(path,'image','R75 original door modules');portable.assetExists[path]=true;portable.runtimeAssetHashes[path]=art.sha256;for(const r of regions)if(r.id!=='ep1a08'&&!r.paths.includes(path))r.paths.push(path);}
 const compileBase=compileWorld;compileWorld=function(...a){const result=compileBase.apply(this,a);registerArt();return result;};
 function plane(d,rect,u0,u1,z0,z1){const image=readyImage(path)?.image;if(!image||u0===u1||z0===z1)return;const point=(u,z)=>{const p=project(d.x+(d.axis==='y'?u:0),d.y+(d.axis==='x'?u:0));return{x:p.x,y:p.y-z*TILE*Math.sqrt(1.5)*zoom};},a=point(u0,z1),b=point(u1,z1),c=point(u0,z0),[sx,sy,sw,sh]=rect;
  ctx.save();try{ctx.transform((b.x-a.x)/sw,(b.y-a.y)/sw,(c.x-a.x)/sh,(c.y-a.y)/sh,a.x,a.y);ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);}finally{ctx.restore();}
 }
 const drawBase=drawProp;drawProp=function(p,...args){const d=p?.r74Door;if(!d)return drawBase.apply(this,[p,...args]);const style=room?.exploration?.worldR74?.style||'',index=/forge|machine|industrial/.test(style)?3:/clock|vault/.test(style)?2:/chapel|cathedral|castle/.test(style)?1:0,descriptor=art.frames[index],outer=art.sourceRectangles[descriptor.frame],leaf=art.sourceRectangles[descriptor.leaf],left=descriptor.opening[0],right=descriptor.opening[2],top=descriptor.opening[1],gap=d.axis==='x'?d.depth:d.width,jamb=.32,height=1.85,lintel=(top-outer[1])/outer[3]*height,opening=height-lintel,open=world()?.isOpen?.(room,d)===true;
  const paint=()=>{plane(d,[outer[0],outer[1],left-outer[0],outer[3]],-gap/2-jamb,-gap/2,0,height);plane(d,[right,outer[1],outer[0]+outer[2]-right,outer[3]],gap/2,gap/2+jamb,0,height);plane(d,[left,outer[1],right-left,top-outer[1]],-gap/2,gap/2,opening,height);if(!open){plane(d,leaf,-gap/2,0,0,opening);plane(d,leaf,gap/2,0,0,opening);}};
  if(ctx.scope)return ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:path,alive:true},paint);return paint();
 };
 window.__STORYWORLD_DOORS_R75__=Object.freeze({plane,inspect:()=>({asset:path,sourceSha256:art.sha256,worldFacing:true,closedLeafUsesCollisionAperture:true,openedLeafRetracted:true,decodedRGBABytes:art.decodedRGBABytes})});
 if(booted)registerArt();
})();
