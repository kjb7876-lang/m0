// R190 — ep1a08 presentation pilot. No gameplay/save/quality changes.
// Before: 48 offscreen explosions still tinted 3,888,640 pixels and issued 48 draws;
// a 65th play removed a live core/portal. Preserve admitted lifetimes, skip only fully
// offscreen quads (including flipped pivots), fade finite loop deadlines over 120 ms.
(()=>{'use strict';
if(window.__STORYWORLD_FX_R190__)return;
let enabled=true;const stats={culled:0,overflowRefused:0,deadlineFades:0};
const active=()=>enabled&&typeof zone!=='undefined'&&zone==='ep1a08';
function outside(m,x,y,s,flip,width,height){
 if(!m?.frame||!m?.pivot||![x,y,s,width,height].every(Number.isFinite)||s<=0||width<=0||height<=0)return false;
 const [fw,fh]=m.frame,[px,py]=m.pivot;
 const left=x+(flip?px-fw:-px)*s,top=y-py*s;
 // Two logical pixels cover filtering at the border. Never cull intersecting quads.
 return left+fw*s < -2 || left > width+2 || top+fh*s < -2 || top > height+2;
}
function cull(m,x,y,s,flip,context){
 if(!active()||!context?.canvas||typeof context.getTransform!=='function'||(context.shadowBlur||0)>0||(context.filter&&context.filter!=='none'))return false;
 // Mask/copy blend operations can affect pixels outside the sprite rectangle.
 const blend=context.globalCompositeOperation;
 if(blend&&blend!=='source-over'&&blend!=='lighter'&&blend!=='screen')return false;
 const width=context.canvas.width,height=context.canvas.height;
 // A pivot inside the framebuffer may safely stay on the original path. This is
 // conservative under parent transforms: it can miss a cull, never hide a sprite.
 if(x>=0&&y>=0&&x<=width&&y<=height)return false;
 const M=context.getTransform();
 if(!m?.frame||!m?.pivot||![x,y,s,width,height,M.a,M.b,M.c,M.d,M.e,M.f].every(Number.isFinite)||s<=0||width<=0||height<=0)return false;
 const [fw,fh]=m.frame,[px,py]=m.pivot,cx=x+(flip?px-fw/2:fw/2-px)*s,cy=y+(fh/2-py)*s;
 const xx=M.a*cx+M.c*cy+M.e,yy=M.b*cx+M.d*cy+M.f;
 const rx=(Math.abs(M.a)*fw+Math.abs(M.c)*fh)*s/2,ry=(Math.abs(M.b)*fw+Math.abs(M.d)*fh)*s/2;
 const pad=2*Math.max(1,Math.abs(M.a)+Math.abs(M.c),Math.abs(M.b)+Math.abs(M.d));
 const skip=xx+rx < -pad || xx-rx > width+pad || yy+ry < -pad || yy-ry > height+pad;
 if(skip)stats.culled++;return skip;
}
function admit(list,max){if(!active()||list.length<max)return true;stats.overflowRefused++;return false;}
function alpha(e,t){if(!active()||!e.loop||!(e.until>0))return 1;const a=Math.max(0,Math.min(1,(e.until-t)/.12));if(a<1)stats.deadlineFades++;return a;}
window.__STORYWORLD_FX_R190__=Object.freeze({active,outside,cull,admit,alpha,setEnabled:v=>(enabled=!!v),inspect:()=>({revision:'R190-fx-1',enabled,active:active(),pilot:'ep1a08',stats:{...stats},presentationOnly:true})});
})();
