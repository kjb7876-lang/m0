window.__topscan=function(cx,cy,half){const R=window.__STORYWORLD_PHASE1__.controller.state.three,T=R.T,L=room.exploration,PX=8,N=half*2*PX;
 const S=new Set(L.floorCells.map(c=>c[0]+':'+c[1]));const cam=new T.OrthographicCamera(-half,half,half,-half,40,55);cam.position.set(cx,50,cy);cam.up.set(0,0,-1);cam.lookAt(cx,0,cy);cam.layers.mask=R.camera.layers.mask;cam.updateMatrixWorld(true);
 const rt=new T.WebGLRenderTarget(N,N);const r=R.renderer,sc=R.scene;const prevT=r.getRenderTarget(),prevO=sc.overrideMaterial,prevBg=sc.background,prevFog=sc.fog;
 const hid=[];sc.traverse(o=>{const m=o.material,mm=Array.isArray(m)?m[0]:m;const nm=(o.name||'')+'|'+(o.parent?.name||'');if((o.isMesh||o.isSprite||o.isPoints||o.isLine)&&o.visible&&(/fog|haze|glow|halo|shadow|light|beam|mote|dust|ember|spark|rain|mist|smoke|aura|ring/i.test(nm)||o.isSprite||o.isPoints||o.isLine||(mm&&mm.transparent&&mm.opacity<.95)||(mm&&mm.blending&&mm.blending!==1))){hid.push(o);o.visible=false;}});const dm=new T.MeshDepthMaterial();dm.side=T.DoubleSide;sc.overrideMaterial=dm;sc.background=new T.Color(0);sc.fog=null;r.setRenderTarget(rt);r.clear();r.render(sc,cam);
 const H=new Uint8Array(N*N*4);r.readRenderTargetPixels(rt,0,0,N,N,H);
 // id pass
 sc.overrideMaterial=null;const objs=[],saved=[];sc.traverse(o=>{if(o.isMesh||o.isInstancedMesh||o.isSprite||o.isPoints||o.isLine){const id=objs.length+1;objs.push(o);saved.push(o.material);const m=new T.MeshBasicMaterial({color:new T.Color(((id&255))/255,((id>>8)&255)/255,((id>>16)&255)/255),side:T.DoubleSide});m.toneMapped=false;o.material=m;}});
 const oldCS=r.outputColorSpace;r.outputColorSpace=T.LinearSRGBColorSpace;r.clear();r.render(sc,cam);const I=new Uint8Array(N*N*4);r.readRenderTargetPixels(rt,0,0,N,N,I);r.outputColorSpace=oldCS;
 objs.forEach((o,i)=>{o.material.dispose();o.material=saved[i];});hid.forEach(o=>o.visible=true);sc.overrideMaterial=prevO;sc.background=prevBg;sc.fog=prevFog;r.setRenderTarget(prevT);rt.dispose();dm.dispose();
 const cells=[];const x0=cx-half,y0=cy-half;
 for(let j=0;j<half*2;j++)for(let i=0;i<half*2;i++){const wx=Math.floor(x0+i),wy=Math.floor(y0+j);const px=Math.floor((wx+.5-x0)*PX),py=Math.floor((wy+.5-y0)*PX);if(px<0||py<0||px>=N||py>=N)continue;const row=N-1-py,k=(row*N+px)*4;
  const c=H[k];const h=c===0?null:10-(1-c/255)*15;const id=I[k]+(I[k+1]<<8)+(I[k+2]<<16);const o=id?objs[id-1]:null;
  cells.push([wx,wy,S.has(wx+':'+wy)?1:0,h==null?null:+h.toFixed(2),o?((o.name||'')+'<'+(o.parent?.name||'')+'<'+(o.parent?.parent?.name||'')):null]);}
 return cells;};
