// R298: exercise the real draw recorder. CPU evidence only; no GPU/fps claim.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(R,p),'utf8');
const phase=read('runtime-text/dist/phase1.js'),src=read('client-source/mobile-perf-r298.js');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
function world({coarse=true,engineMobile,enabled=true,viewport=true,load=true}={}){
 const store={'storyworld.r298.mobilePerf':JSON.stringify({on:enabled})},timers=[];
 const c={console,matchMedia:()=>({matches:c.coarse}),coarse,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
  setTimeout:fn=>{timers.push(fn);return timers.length;},setInterval:fn=>{timers.push(fn);return timers.length;},requestAnimationFrame:fn=>{timers.push(fn);return timers.length;}};
 c.window=c;if(viewport){c.W=400;c.H=300;}
 if(engineMobile!==undefined)c.__STORYWORLD_MOBILE_R63__={isMobile:()=>c.engineMobile};
 c.engineMobile=engineMobile;vm.createContext(c);vm.runInContext(phase,c,{filename:'phase1.js'});
 if(load)vm.runInContext(src,c,{filename:'mobile-perf-r298.js'});
 c.api=()=>c.__STORYWORLD_MOBILE_PERF_R298__;
 c.flush=()=>{for(const f of timers.splice(0))f();};
 c.rec=(dpr=1,extra={})=>{
  let copies=0,canvases=0;
  const canvas={width:400*dpr,height:300*dpr};
  const rec=new c.StoryPhase1.DrawCommands({canvas,makeCanvas:()=>{canvases++;return{width:0,height:0,getContext:()=>({setTransform(){},drawImage(){copies++;}})};},...extra});
  rec.reset(dpr);rec.setTransform(dpr,0,0,dpr,0,0);
  return{rec,canvas,copies:()=>copies,canvases:()=>canvases};
 };
 return c;
}
const img={width:20,height:10,src:'fixture.png'},mutable={width:64,height:32,getContext(){}};
const draw=(rec,kind,args,image=img,id='owner')=>rec.scope({id,kind,x:-99999,y:-99999},()=>rec.drawImage(image,...args));
const plain=v=>JSON.parse(JSON.stringify(v));

check('desktop keeps offscreen image commands and snapshots',()=>{
 const c=world({coarse:false}),f=c.rec();draw(f.rec,'effect',[2000,2000],mutable);
 assert.equal(f.rec.commands.length,1);assert.equal(f.copies(),1);assert.equal(f.rec.snapshotPixels,64*32);
});
check('all drawImage overloads drop wholly offscreen mobile images',()=>{
 const c=world(),f=c.rec();for(const a of [[2000,2000],[2000,2000,80,40],[0,0,20,10,2000,2000,80,40]])draw(f.rec,'effect',a);
 assert.equal(f.rec.commands.length,0);assert.equal(c.api().inspect().stats.culled,3);
});
check('visible commands are byte-equivalent to the original recorder',()=>{
 const a=world(),b=world({load:false}),fa=a.rec(1.25),fb=b.rec(1.25);
 for(const f of [fa,fb]){f.rec.rotate(.31);f.rec.translate(50,70);draw(f.rec,'effect',[0,0,20,10,10,15,40,25]);}
 assert.deepEqual(plain(fa.rec.finish()),plain(fb.rec.finish()));
});
check('enemy image quads cull without inspecting or changing enemy state',()=>{
 const c=world(),f=c.rec(),owner={id:'enemy:1',kind:'enemy',hp:123,x:5,y:7};const before=JSON.stringify(owner);
 f.rec.scope(owner,()=>f.rec.drawImage(img,2000,2000));assert.equal(f.rec.commands.length,0);assert.equal(JSON.stringify(owner),before);
});
check('unknown owners and scene/prop/hero images retain the original path',()=>{
 const c=world(),f=c.rec();for(const k of ['scene','prop','hero','hazard','projectile','unknown'])draw(f.rec,k,[2000,2000]);
 assert.equal(f.rec.commands.length,6);
});
check('large images crossing the viewport and generous border remain visible',()=>{
 const c=world(),f=c.rec();for(const a of [[-300,20,350,30],[395,10,40,30],[-125,10,10,10],[10,-100,20,110]])draw(f.rec,'effect',a);
 assert.equal(f.rec.commands.length,4);
});
check('transforms, rotation, mirroring and DPR are measured in CSS coordinates',()=>{
 const c=world(),f=c.rec(2),r=f.rec;
 r.translate(100,100);r.rotate(Math.PI/2);draw(r,'effect',[0,0,20,10]);assert.equal(r.commands.length,1);
 r.reset(2);r.setTransform(-2,0,0,2,400,0);draw(r,'effect',[180,20,20,10]);assert.equal(r.commands.length,1);
 r.reset(2);r.setTransform(2,0,0,2,0,0);draw(r,'effect',[300,20,20,10]);assert.equal(r.commands.length,1);
 draw(r,'effect',[2000,2000,-20,-10]);assert.equal(r.commands.length,1);
});
check('translated hit centres and sentinel owners use actual quads',()=>{
 const c=world(),f=c.rec();f.rec.translate(-2000,-2000);draw(f.rec,'effect',[2000,2000]);
 assert.equal(f.rec.commands.length,1);assert.equal(f.rec.commands[0].owner.x,-99999);
});
check('offscreen mutable canvases consume no snapshot budget or scratch canvases',()=>{
 const c=world(),f=c.rec(1,{maxSnapshotPixels:64*32});
 for(let i=0;i<100;i++)draw(f.rec,'effect',[2000+i,2000],mutable);
 assert.equal(f.rec.snapshotPixels,0);assert.equal(f.canvases(),0);assert.equal(f.copies(),0);
 assert.equal(c.api().inspect().stats.snapshotPixelsSaved,100*64*32);
 draw(f.rec,'effect',[20,20],mutable);assert.equal(f.rec.snapshotPixels,64*32);assert.equal(f.canvases(),1);
});
check('culled images retain owner keys and visible snapshot reuse across frames',()=>{
 const c=world(),f=c.rec();
 for(let frame=0;frame<3;frame++){f.rec.reset();draw(f.rec,'effect',[2000,2000],mutable);draw(f.rec,'effect',[20,20],mutable);assert.equal(f.rec.commands[0].key,'owner:1');f.rec.finish();}
 assert.equal(f.canvases(),1);assert.equal(f.copies(),3);
});
check('transparent culled images do not advance the original owner count',()=>{
 const c=world(),f=c.rec();f.rec.globalAlpha=0;draw(f.rec,'effect',[2000,2000]);f.rec.globalAlpha=1;draw(f.rec,'effect',[0,0]);
 assert.equal(f.rec.commands[0].key,'owner:0');
});
check('shadow and spatial filters preserve rendering and original safeguards',()=>{
 const c=world(),f=c.rec();
 for(const filter of ['blur(200px)','drop-shadow(0 0 200px #fff)','unrecognized(2)']){f.rec.filter=filter;draw(f.rec,'effect',[2000,2000]);}
 f.rec.filter='none';f.rec.shadowBlur=2;draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,4);
});
check('color-only filters and lighter compositing can safely cull',()=>{
 const c=world(),f=c.rec();f.rec.filter='saturate(.4) brightness(1.4)';f.rec.globalCompositeOperation='lighter';draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,0);
});
check('destructive compositing is never culled',()=>{
 const c=world(),f=c.rec();for(const mode of ['copy','destination-in','source-in','destination-atop']){f.rec.globalCompositeOperation=mode;draw(f.rec,'effect',[2000,2000]);}
 assert.equal(f.rec.commands.length,4);
});
check('invalid input and forbidden framebuffer behavior stays with native recorder',()=>{
 const c=world(),f=c.rec();draw(f.rec,'effect',[NaN,2000]);draw(f.rec,'effect',[0,0,0,10,2000,2000,30,30]);draw(f.rec,'effect',[2000,2000],{width:0,height:0});
 assert.equal(f.rec.commands.length,0);assert.equal(f.rec.counts.size,0);
 assert.throws(()=>draw(f.rec,'effect',[1,2,3]),/Unsupported drawImage/);
 assert.throws(()=>draw(f.rec,'effect',[2000,2000],f.canvas),/World framebuffer/);
});
check('nonfinite transforms and nonpositive DPR do not hide malformed commands',()=>{
 const c=world(),f=c.rec();f.rec.matrix[0]=NaN;draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,1);
 f.rec.reset(0);draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,1);
});
check('set(false) persists and restores the original rendering path',()=>{
 const c=world(),f=c.rec();c.api().set(false);f.rec.reset();draw(f.rec,'effect',[2000,2000],mutable);
 assert.equal(f.rec.commands.length,1);assert.equal(f.copies(),1);
 c.api().set(true);f.rec.reset();draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,0);
});
check('stored off preference disables optimization on mobile',()=>{
 const c=world({enabled:false}),f=c.rec();draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,1);
});
check('pointer changes take effect on the next frame',()=>{
 const c=world({coarse:false}),f=c.rec();draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,1);
 c.coarse=true;f.rec.reset();draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,0);
});
check('engine mobile detector takes priority over coarse-pointer fallback',()=>{
 for(const [engineMobile,coarse,expected] of [[false,true,1],[true,false,0]]){const c=world({engineMobile,coarse}),f=c.rec();draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,expected);}
});
check('canvas dimensions and recorder DPR supply a CSS viewport fallback',()=>{
 const c=world({viewport:false}),f=c.rec(2);draw(f.rec,'effect',[300,20]);draw(f.rec,'effect',[2000,2000]);assert.equal(f.rec.commands.length,1);
});
check('duplicate overlay load leaves wrappers and API unchanged',()=>{
 const c=world(),before=c.api(),drawFn=c.StoryPhase1.DrawCommands.prototype.drawImage;
 vm.runInContext(src,c);assert.equal(c.api(),before);assert.equal(c.StoryPhase1.DrawCommands.prototype.drawImage,drawFn);
});
check('runtime copy and all build registrations include the overlay once',()=>{
 const file='mobile-perf-r298.js',idx=read('runtime-text/index.html');assert.equal(read('runtime-text/'+file),src);
 assert.equal(idx.split('"./'+file+'"').length,2);assert.ok(idx.indexOf('"./'+file+'"')<idx.indexOf('"./combat-r118.js"'));
 assert.ok(read('../scripts/verify-r96-public.py').includes("'"+file+"'"));assert.ok(read('../.github/workflows/pages.yml').includes('r96/qa/r298/mobile-perf-cpu-check.cjs'));
 const inputs=JSON.parse(read('runtime-inputs.json')),manifest=JSON.parse(read('runtime-manifest.json'));
 assert.ok(inputs.textPaths.includes(file));const row=manifest.files.find(r=>r.path===file);assert.ok(row);assert.equal(row.bytes,Buffer.byteLength(src));assert.equal(row.sha256,crypto.createHash('sha256').update(src).digest('hex'));
});
console.log(JSON.stringify({ok:true,checks,method:'Real DrawCommands in CPU VM; no GPU or physical mobile acceptance'}));
