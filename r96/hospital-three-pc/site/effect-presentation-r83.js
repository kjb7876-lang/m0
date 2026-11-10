/* R83 PXF presentation sizing. Original images, event anchors and combat stay
 * authoritative. This policy changes only the decorative atlas quad size. */
(()=>{'use strict';
 const MAX_FRACTION=.23,metrics={calls:0,viewportClamps:0,zoomCorrections:0};
 function size(effect,authoredPixels){
  if(!effect||effect.type!=='pxfSprite'||!Number.isFinite(authoredPixels)||authoredPixels<=0)return authoredPixels;
  let result=authoredPixels;
  // Explicit PXF sizes are sampled in screen pixels when emitted. Default
  // actorHeight-based sizes are already evaluated at the current zoom.
  const emitted=effect.pxfEmissionZoomR83,current=typeof zoom==='number'?zoom:1;
  if(effect.pxfSize!=null&&Number.isFinite(emitted)&&emitted>0&&Number.isFinite(current)&&current>0){
   result*=current/emitted;if(Math.abs(current-emitted)>1e-8)metrics.zoomCorrections++;
  }
  const width=typeof W==='number'?W:0,height=typeof H==='number'?H:0;
  if(width>0&&height>0){const cap=Math.min(width,height)*MAX_FRACTION;if(result>cap){result=cap;metrics.viewportClamps++;}}
  metrics.calls++;return result;
 }
 window.__STORYWORLD_EFFECT_PRESENTATION_R83__=Object.freeze({size,inspect:()=>({revision:'r83',...metrics,maxDecorativeQuadFraction:MAX_FRACTION,originalAssetsUnchanged:true,combatChanged:false,groundFootprintChanged:false,static64ZIPApplied:!!window.__STORYWORLD_SELECTED_VFX_R83__})});
})();
