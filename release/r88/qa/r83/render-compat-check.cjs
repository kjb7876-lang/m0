'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createHarness}=require('../harness.cjs'),{patchRenderer}=require('./render-compat-patch.cjs');
const root=path.resolve(__dirname,'../..'),checks=[];
const check=(name,pass,detail)=>{checks.push({name,passed:!!pass,detail});if(!pass)throw Error(name);};
const load=source=>{const w={};vm.runInNewContext(source,{window:w,performance:{now:()=>0},URL,URLSearchParams,console});return w.StoryPhase1;};
const near=(a,b)=>Math.abs(a-b)<1e-10;
(async()=>{
  const T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js');
  const current=fs.readFileSync(path.join(root,'hospital-three-pc/site/dist/phase1.js'),'utf8');
  const preserved=fs.readFileSync(path.join(root,'../hospital-refinement-v6/hospital-three-pc/site/dist/phase1.js'),'utf8');
  check('Shipped renderer already contains the exact R83 compatibility integration',current.includes('/* R83_RENDER_COMPAT_BEGIN */')&&current.includes('return applyOriginalBlendR83(T,material,s.globalCompositeOperation);')&&patchRenderer(current)===current);
  // Exercise the shipped bytes directly. Never apply a missing fix inside the
  // check, as that would conceal a broken integration in the final archive.
  const A=load(current),old=load(preserved);
  const projection=new A.Projection();projection.configure({width:1280,height:800,zoom:1,camX:15,camY:15,tile:34});
  const make=(api=A)=>new api.CommandScene(T,{projection,makeCanvas:()=>({getContext:()=>null}),spatial:false});
  check('R83 renderer patch is byte-idempotent',patchRenderer(patchRenderer(current))===patchRenderer(current));
  const h=createHarness({timeoutMs:60000});await h.boot();await h.start();
  h.run('for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal)closePanel(true);W=1280;H=800;');
  const rec=new A.DrawCommands({canvas:{},makeCanvas:()=>({}),measureText:()=>({width:0})});h.context.recR83=rec;
  const burn=h.run(`(()=>{const saved=ctx;ctx=recR83;recR83.reset(1);try{drawLivingBurn3({id:'r83-burn',hp:10,maxHp:100,spawnState:'active'},{x:400,y:350},66);return recR83.finish();}finally{ctx=saved;}})()`);
  let oldError='';const original=make(old);try{original.render(burn);}catch(e){oldError=e.message;}finally{original.dispose();}
  check('Preserved V6 reproduces screenshot failure from actual native living-burn draw',oldError==='Unsupported original blend lighter'&&burn.some(c=>c.style.globalCompositeOperation==='lighter'),{error:oldError,commands:burn.map(c=>({kind:c.kind,blend:c.style.globalCompositeOperation}))});
  const burnScene=make();burnScene.render(burn);
  check('Actual native living-burn commands replay through real Three CPU materials',burnScene.rows.size===burn.length&&[...burnScene.rows.values()].filter(r=>r.mesh.material.userData.originalBlendR83==='lighter').length===5,burnScene.inspect());
  burnScene.dispose();
  h.context.testReducedR83=false;
  const nativePXF=()=>h.run(`(()=>{settings.reducedMotion=testReducedR83;const data=STORY_PXF_DATA.find(r=>r.blend==='add'&&readyImage(r.path));if(!data)throw Error('No loaded original additive PXF');const saved=ctx;ctx=recR83;recR83.reset(1);try{drawEffect({id:'r83-native-pxf',type:'pxfSprite',asset:data.path,pxfKey:data.key,pxfEpoch:__STORYWORLD_PXF__.inspect().epoch,pxfEvent:'r83-native-pxf',pxfLayer:'front',pxfSide:'player',pxfHero:'neon',pxfSize:120,pxfAngleIsScreen:true,x:player.x,y:player.y,angle:0,age:.02,life:2});return recR83.finish();}finally{ctx=saved;}})()`);
  const pxf=nativePXF(),pxfScene=make();pxfScene.render(pxf);
  check('Actual native additive PXF image records lighter and replays',pxf.length>0&&pxf.every(c=>c.kind==='image'&&c.style.globalCompositeOperation==='lighter')&&pxfScene.rows.size===pxf.length,{count:pxf.length,owner:pxf[0]?.owner});
  h.context.testReducedR83=true;const reduced=nativePXF();pxfScene.render(reduced);
  check('Reduced-motion PXF retains native source-over behavior',reduced.length>0&&reduced.every(c=>c.style.globalCompositeOperation==='source-over')&&[...pxfScene.rows.values()].every(r=>r.mesh.material.blending===T.NormalBlending));
  pxfScene.dispose();
  const solid=burn.find(c=>c.kind==='fill'&&c.style.globalCompositeOperation==='lighter');
  const gradient={...solid,key:'gradient-r83',style:{...solid.style,fillStyle:{kind:'linear',matrix:[1,0,0,1,0,0],args:[0,0,128,0],stops:[{offset:0,color:'rgba(255,0,0,.25)'},{offset:1,color:'rgba(0,0,255,.75)'}]}}};
  const materials=[make().material(solid),make().material(pxf[0]),make().material(gradient)];
  check('Images, solid paths and gradients use additive RGB and separate alpha factors',materials.every(m=>m.blending===T.CustomBlending&&!m.premultipliedAlpha&&m.blendSrc===T.SrcAlphaFactor&&m.blendDst===T.OneFactor&&m.blendSrcAlpha===T.OneFactor&&m.blendDstAlpha===T.OneFactor&&m.blendEquationAlpha===T.AddEquation));
  // Numerical reference for Canvas premultiplied "lighter"; this verifies the
  // actual material factors, not a rendered GPU pixel or a browser screenshot.
  const referenceCases=[{s:[.8,.4,.2],sa:.25,d:[.1,.2,.3],da:.5},{s:[1,1,1],sa:0,d:[.2,.1,.1],da:.3},{s:[.4,.9,.7],sa:.8,d:[.3,.2,.1],da:.7}];
  const pixels=referenceCases.map(q=>({rgb:q.s.map((v,i)=>Math.min(1,v*q.sa+q.d[i])),alpha:Math.min(1,q.sa+q.da),incorrectAlpha:Math.min(1,q.sa*q.sa+q.da)}));
  check('Lighter alpha is added once and translucent RGB matches Canvas reference',pixels.every((p,i)=>p.rgb.every((v,j)=>near(v,Math.min(1,referenceCases[i].s[j]*referenceCases[i].sa+referenceCases[i].d[j])))&&near(p.alpha,Math.min(1,referenceCases[i].sa+referenceCases[i].da)))&&near(pixels[0].alpha,.75)&&!near(pixels[0].alpha,pixels[0].incorrectAlpha),pixels);
  materials.forEach(m=>m.dispose());
  const screenCommand={...gradient,style:{...gradient.style,globalCompositeOperation:'screen'}},screenScene=make(),screen=screenScene.material(screenCommand);
  check('Existing screen blend keeps premultiplied RGB and gradient premultiplies exactly once',screen.premultipliedAlpha&&screen.blendSrc===T.OneFactor&&screen.blendDst===T.OneMinusSrcColorFactor&&screen.blendSrcAlpha===T.OneFactor&&screen.blendDstAlpha===T.OneMinusSrcAlphaFactor&&screen.fragmentShader.split('#include <premultiplied_alpha_fragment>').length===2);
  screen.dispose();screenScene.dispose();
  const reuse=make();reuse.render([solid]);const first=reuse.rows.get(solid.key).mesh.material;
  for(let i=0;i<120;i++)reuse.render([{...solid,style:{...solid.style,globalAlpha:.3+i/300,fillStyle:i%2?'rgba(255,140,90,.7)':'rgba(250,170,100,.5)'}}]);
  check('Changing additive paint reuses material without per-frame replacement',reuse.rows.get(solid.key).mesh.material===first&&reuse.stats.styleReplacements===0&&reuse.stats.solidPaintReuseR70===120,reuse.inspect());
  let disposed=0;first.addEventListener('dispose',()=>disposed++);
  reuse.render([{...solid,style:{...solid.style,globalCompositeOperation:'source-over'}}]);const middle=reuse.rows.get(solid.key).mesh.material;
  reuse.render([{...solid,style:{...solid.style,globalCompositeOperation:'screen'}}]);
  check('Blend transitions replace materials rather than reusing incompatible shader state',disposed===1&&middle!==first&&reuse.rows.get(solid.key).mesh.material!==middle&&reuse.stats.styleReplacements===2,reuse.inspect());reuse.dispose();
  const lease=make();lease.render(pxf);for(let i=0;i<80;i++)lease.render(pxf.map(c=>({...c,style:{...c.style,globalAlpha:i/80}})));lease.render([]);
  check('Repeated additive image frames release retained textures and geometry',lease.textures.size===0&&lease.rows.size===0&&lease.stats.texturesCreated===lease.stats.texturesDisposed&&lease.stats.created===lease.stats.removed,lease.inspect());lease.dispose();
  const invalid=make();let unknown='';try{invalid.render([{...pxf[0],style:{...pxf[0].style,globalCompositeOperation:'destination-in'}}]);}catch(e){unknown=e.message;}
  check('Unknown captured masking still fails explicitly and releases its image texture',unknown==='Unsupported original blend destination-in'&&invalid.textures.size===0&&invalid.rows.size===0,{unknown,stats:invalid.inspect()});invalid.dispose();
})().catch(e=>{checks.push({name:'Exception',passed:false,detail:e.stack});process.exitCode=1;}).finally(()=>{
  const report={method:'Native original burn/PXF DrawCommands capture + pinned real Three r186 CPU scene/material/shader-source checks; numerical Canvas blend reference. No GPU rendering.',checks,passed:checks.every(c=>c.passed),browserVerified:false,GPUVerified:false};
  fs.writeFileSync(path.join(__dirname,'render-compat-results.json'),JSON.stringify(report,null,2));console.log(checks.filter(c=>c.passed).length+'/'+checks.length);
});
