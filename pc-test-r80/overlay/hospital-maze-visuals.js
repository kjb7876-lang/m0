/* Seven selected 2D source assets, rendered as camera-facing props.
 * The original eleven dressing records and all collision/door state stay intact.
 * Sources and mechanical crop/resize transforms: assets/hospital-maze/provenance.json.
 */
(()=>{'use strict';
 const art={"bed":{"key":"bed","file":"assets/hospital-maze/bed.png","source":"assets/hospital_core/hospital-bed-isometric.png","source_sha256":"5c2a302f4700570b0ae14b0155e9a35c68b58f702bd73f1737ef67b49995a395","source_size":[1536,1024],"crop_xyxy":[212,16,1350,983],"output_size":[384,326],"pivot_pixels":[187.6133567662566,229.35296794208895],"pivot_basis":"catalog provisional; crop and resize translated, engine visual alignment pending","sha256":"f9888c775f165ff767aee301800740cb2e81a15c96e70711f938c90bf37b0516","base_rgba8_bytes":500736},"monitor":{"key":"monitor","file":"assets/hospital-maze/monitor.png","source":"assets/hospital_core/patient-monitor-isometric.png","source_sha256":"9b22ba36d22173eae523590d46d9f8c4511ffd48a64e30fc33f1de8fd7e0e42f","source_size":[1774,887],"crop_xyxy":[681,0,1094,885],"output_size":[179,384],"pivot_pixels":[89.28329297820824,330.98630508474577],"pivot_basis":"catalog provisional; crop and resize translated, engine visual alignment pending","sha256":"f1bbd25cb206b497da68c49b6bac983787c57cc8cef0f44582f4d43c42b3b749","base_rgba8_bytes":274944},"iv":{"key":"iv","file":"assets/hospital-maze/iv.png","source":"assets/hospital_additions/hospital_iv_pole.png","source_sha256":"780a9ec769b7ee24a3aaec649894c2f834ddbe7f724240366917dedada41e5b3","source_size":[1774,887],"crop_xyxy":[713,17,1072,871],"output_size":[161,384],"pivot_pixels":[80.49973091922007,378.5910857142857],"pivot_basis":"catalog provisional; crop and resize translated, engine visual alignment pending","sha256":"6a483898b3b6b7b8358f6d057c1f2e96135e35198b28df0e5e56cce51e645152","base_rgba8_bytes":247296},"cabinet":{"key":"cabinet","file":"assets/hospital-maze/cabinet.png","source":"assets/hospital_props/hospital_medicine_cabinet.png","source_sha256":"073b2ac2fa6161b31efeca39c4f16eda2be62d7ab524a62acbd13d43412182f2","source_size":[1536,1024],"crop_xyxy":[249,35,1291,966],"output_size":[384,343],"pivot_pixels":[191.99882072936657,339.3181473684211],"pivot_basis":"catalog provisional; crop and resize translated, engine visual alignment pending","sha256":"fd40e3ded005cec2bf08777d7dddbc26edd595f5bedebae7c610101fc49e655f","base_rgba8_bytes":526848},"chair":{"key":"chair","file":"assets/hospital-maze/chair.png","source":"assets/hospital_props/hospital_wheelchair.png","source_sha256":"ed0eba9c7f686352e2307230d90bfe85ef02aced1c20962e86b11e9fc473fcee","source_size":[1536,1024],"crop_xyxy":[378,0,1231,981],"output_size":[334,384],"pivot_pixels":[167.20267104337634,379.70796819571865],"pivot_basis":"catalog provisional; crop and resize translated, engine visual alignment pending","sha256":"ff7d711f6294ecab95e9732178a1de801c725fb4f8d759e4c5e3f1f7f27d49e4","base_rgba8_bytes":513024},"stretcher":{"key":"stretcher","file":"assets/hospital-maze/stretcher.png","source":"assets/hospital_details/hospital_stretcher.png","source_sha256":"e6b16ec38d9b1389ae1fa54bf08ff20e3e3224d37ea98164e325a6300e555368","source_size":[1774,887],"crop_xyxy":[280,6,1537,878],"output_size":[384,266],"pivot_pixels":[191.98943007159906,262.65745986238534],"pivot_basis":"catalog provisional; crop and resize translated, engine visual alignment pending","sha256":"903602c766408635e3113e71f1b4b1e1590f33c725dce39ade427150ba139b25","base_rgba8_bytes":408576},"stool":{"key":"stool","file":"assets/hospital-maze/stool.png","source":"assets/hospital_additions/hospital_examination_stool.png","source_sha256":"590ad7b2517d44de71f20aaed320b3990ac95a18b6368ae70d4d8a85034622ec","source_size":[1774,887],"crop_xyxy":[601,94,1172,807],"output_size":[308,384],"pivot_pixels":[153.98263117338004,378.07239719495084],"pivot_basis":"catalog provisional; crop and resize translated, engine visual alignment pending","sha256":"edf11e6ff6aa539b8bd8c41102543bd0abfcfa505f9c90cdd835c4dc071fe7d2","base_rgba8_bytes":473088}};
 const mapping=Object.freeze({
  'observation-gurney':['bed',54],
  'north-ward-a-screen':['monitor',64],
  'north-ward-b-chair':['chair',49],
  'preparation-chair':['stool',30],
  'consult-c-gurney':['stretcher',52],
  'south-ward-b-gurney':['cabinet',61],
  'south-ward-c-chair':['iv',76]
 });
 const enabled=()=>room?.id==='ep1a08'&&!!room.exploration?.hospitalDoorsB3;
 const stats={drawn:0,fallback:0,culled:0,occluded:0,marks:0,loadErrors:[]};
 let loadPromise=null;
 function prepare(){if(loadPromise)return loadPromise;
  const paths=Object.values(art).map(a=>a.file);
  for(const path of paths){register(path,'image','hospital maze selected original PNG derivative');const r=regionById.ep1a08;if(r?.paths&&!r.paths.includes(path))r.paths.push(path);}
  loadPromise=ensureImages(paths).catch(e=>{stats.loadErrors.push(String(e));return false;});return loadPromise;
 }
 const enterBase=enterRegion;enterRegion=async function(id,...args){if(id==='ep1a08')await prepare();return enterBase.call(this,id,...args);};
 const propBase=drawProp;drawProp=function(p,...args){
  const selected=enabled()&&p?.hospitalDressingB3&&mapping[String(p.id).replace('hospital-dressing-b3:','')];
  if(!selected)return propBase.call(this,p,...args);
  if(p.visible===false||p.enabled===false||p.disabled===true||p.destroyed===true)return;
  const a=art[selected[0]],row=readyImage(a.file);if(!row){prepare();stats.fallback++;return propBase.call(this,p,...args);}
  const sight=window.__STORYWORLD_SIGHT24__;
  if(blocked(p.x,p.y,.05,room)||sight?.enabled&&!sight.pointVisible(p.x,p.y)){stats.culled++;return;}
  const q=project(p.x,p.y),scale=selected[1]*zoom/a.output_size[1],w=a.output_size[0]*scale,h=a.output_size[1]*scale,px=a.pivot_pixels[0]*scale,py=a.pivot_pixels[1]*scale;
  if(q.x+w-px<-20||q.x-px>W+20||q.y+h-py<-20||q.y-py>H+20){stats.culled++;return;}
  const hero=project(player.x,player.y),behind=q.y>hero.y-2&&hero.y>q.y-py&&Math.abs(q.x-hero.x)<w*.43;
  const paint=()=>{ctx.save();try{
   ctx.globalAlpha*=behind?.32:1;if(behind)stats.occluded++;
   ctx.filter=layer==='DREAM'?'saturate(.55) hue-rotate(10deg) brightness(.88)':'saturate(.82) brightness(.92)';
   if(player?.samong>0)ctx.filter+=' grayscale(.8)';
   ctx.translate(q.x,q.y);if(p.visualFlipXB3)ctx.scale(-1,1);
   ctx.drawImage(row.image,0,0,a.output_size[0],a.output_size[1],-px,-py,w,h);stats.drawn++;
  }finally{ctx.restore();}};
  return typeof ctx.scope==='function'?ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:a.file,alive:true,presentationOnly:true},paint):paint();
 };
 const marks=[{x:35,y:109,dx:-1,dy:0,label:'1번 경로',color:'#8ba8a0'},{x:51,y:109,dx:1,dy:0,label:'2번 경로',color:'#c0b69c'},{x:22.5,y:80,dx:0,dy:-1,color:'#8ba8a0'},{x:62.5,y:80,dx:0,dy:-1,color:'#c0b69c'},{x:20,y:42.5,dx:0,dy:-1,label:'준비실',color:'#a4b6ac'},{x:20,y:22,dx:0,dy:-1,label:'보스실',color:'#b9b5a3'},{x:5,y:8.5,dx:0,dy:-1,label:'주사실',color:'#a4b6ac'}];
 function groundMark(m){if(blocked(m.x,m.y,.05,room))return;const sight=window.__STORYWORLD_SIGHT24__;if(sight?.enabled&&!sight.pointVisible(m.x,m.y))return;
  const q=project(m.x,m.y);if(q.x<-60||q.x>W+60||q.y<-60||q.y>H+60)return;
  const dx=m.dx,dy=m.dy,head=[m.x+dx*.6,m.y+dy*.6],tail=[m.x-dx*.5,m.y-dy*.5];
  const segments=[[tail,head],[[head[0]-dx*.45-dy*.32,head[1]-dy*.45+dx*.32],head,[head[0]-dx*.45+dy*.32,head[1]-dy*.45-dx*.32]]];
  const paint=()=>{ctx.save();try{ctx.strokeStyle=m.color;ctx.globalAlpha*=.65;ctx.lineWidth=Math.max(.8,1.5*zoom);ctx.lineCap='round';for(const seg of segments){ctx.beginPath();seg.forEach(([x,y],i)=>{const p=project(x,y);ctx[i?'lineTo':'moveTo'](p.x,p.y);});ctx.stroke();}stats.marks++;}finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope({id:'maze-arrow:'+m.x+':'+m.y,kind:'hospital-guidance',groundAligned:true,presentationOnly:true},paint);else paint();
  if(m.label&&Math.hypot(player.x-m.x,player.y-m.y)<11){const label=()=>{ctx.save();try{ctx.font=Math.max(10,11*zoom)+'px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillStyle=m.color;ctx.globalAlpha*=.85;ctx.shadowColor='#162024';ctx.shadowBlur=3;ctx.fillText(m.label,q.x,q.y+16*zoom);}finally{ctx.restore();}};if(typeof ctx.scope==='function')ctx.scope({id:'maze-label:'+m.x+':'+m.y,kind:'hospital-guidance-label',x:m.x,y:m.y,presentationOnly:true},label);else label();}
 }
 const groundBase=groundImage;groundImage=function(...args){const result=groundBase.apply(this,args);if(enabled()){prepare();for(const m of marks)groundMark(m);}return result;};
 window.__STORYWORLD_HOSPITAL_MAZE_VISUALS__=Object.freeze({revision:'hospital-maze-selected-assets-r1',selectedCount:7,art,mapping,prepare,inspect:()=>({revision:'hospital-maze-selected-assets-r1',enabled:enabled(),selectedCount:7,readyCount:Object.values(art).filter(a=>!!readyImage(a.file)).length,originalDressingRecordsPreserved:11,newVisualVariants:7,legacyVisualVariants:4,sourceOriginalsUnchanged:true,sourceMetadata:'assets/hospital-maze/provenance.json',baseRGBA8Bytes:2944512,actualGPUBytes:null,nativeWallDoorGeometryPreserved:true,bakedIsometricFloorApplied:false,collisionChanged:false,stats:{...stats},actualBrowser:false,GPU:false})});
})();
