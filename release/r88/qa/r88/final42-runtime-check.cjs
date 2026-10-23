'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{createHash}=require('crypto');
const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'client-source/final42-runtime-r88.js'),'utf8'),dataSource=fs.readFileSync(path.join(root,'client-source/final42-data-r88.js'),'utf8');
const report={schema:'storyworld.final42-runtime-cpu/v1',checks:[],browserVerified:false,GPUVerified:false,naturalPlayVerified:false,method:'Original normalized42 metadata; independent Image/decode/clock/DrawCommands fixtures; native footprint clipping and pinned Three CPU geometry. No browser pixels or hardware performance claim.'};
report.canonicalRuntimeSHA256=createHash('sha256').update(source).digest('hex');report.canonicalDataSHA256=createHash('sha256').update(dataSource).digest('hex');
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);if(!passed)throw Error(name);};
function fixture(){
 const draws=[],images=[],clipRules=[],geometryCalls=[],timers=new Map(),stack=[];let nextTimer=0;
 const context={globalAlpha:1,globalCompositeOperation:'source-over',imageSmoothingEnabled:false,owner:null,translateValue:[0,0],angle:0,
  save(){stack.push({alpha:this.globalAlpha,blend:this.globalCompositeOperation,translate:this.translateValue,angle:this.angle});},
  restore(){const p=stack.pop();this.globalAlpha=p.alpha;this.globalCompositeOperation=p.blend;this.translateValue=p.translate;this.angle=p.angle;},
  translate(x,y){this.translateValue=[x,y];},rotate(a){this.angle=a;},clip(rule){clipRules.push(rule);},
  scope(owner,fn){const prior=this.owner;this.owner=owner;try{return fn();}finally{this.owner=prior;}},
  drawImage(image,...args){draws.push({src:image.src,args,alpha:this.globalAlpha,blend:this.globalCompositeOperation,translate:this.translateValue,angle:this.angle,owner:this.owner});}};
 const c={console,Math,Map,Set,WeakMap,WeakSet,Promise,Number,Object,Array,String,Image:null,URL,
  time:0,room:{id:'fixture-room'},player:{id:'fixture-player',x:10,y:10,hp:100},started:true,layer:'STORY',settings:{lowFx:false},W:1280,H:800,
  document:{baseURI:'http://127.0.0.1:4391/m0/'},matchMedia:()=>({matches:false}),ctx:context,
  project:(x,y)=>({x:640+(x-y)*30,y:200+(x+y)*15}),actorHeight:()=>64,urlFor:p=>'http://127.0.0.1:4391/m0/'+p,
  setTimeout(fn){const id=++nextTimer;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),
  traceFootprint154(g){geometryCalls.push(g);},autoImage:true};
 c.window=c;c.globalThis=c;
 vm.createContext(c);vm.runInContext(dataSource,c);
 const dims=new Map(Object.values(c.__STORYWORLD_FINAL42_DATA_R88__.effects).flatMap(s=>s.atlases.map(a=>[a.path,[a.width,a.height]])));
 c.Image=class{constructor(){images.push(this);this.naturalWidth=this.naturalHeight=0;}set src(value){this._src=value;if(!value)return;const item=[...dims].find(([p])=>value.endsWith('/'+p));if(item){this.naturalWidth=item[1][0];this.naturalHeight=item[1][1];}if(c.autoImage)queueMicrotask(()=>this.onload?.());}get src(){return this._src;}decode(){return Promise.resolve();}};
 vm.runInContext(source,c);
 return{c,api:c.__STORYWORLD_FINAL42_R88__,data:c.__STORYWORLD_FINAL42_DATA_R88__,draws,images,clipRules,geometryCalls,timers};
}
(async()=>{
 const f=fixture(),{api,data,c}=f,ids=Object.keys(data.effects);
 check('Runtime installs exactly42 source-backed effects and no separate animation loop',ids.length===42&&api.inspect().noIndependentAnimationLoop&&!/requestAnimationFrame\s*\(/.test(source)&&!c.StoryVFX);
 check('Unknown IDs and nonfinite or negative times cannot create frames',api.sample('not-an-effect',0)===null&&api.sample(81,NaN)===null&&api.sample(81,-1)===null);
 const samples=[];
 for(const id of ids){const spec=data.effects[id];for(const [clipName,clip]of Object.entries(spec.clips)){let age=0;for(const index of clip.frameIndices){const frame=spec.frames.find(f=>f.index===index),sample=api.sample(id,age+frame.seconds*.5,{clip:clipName});samples.push({id,clip:clipName,index,actual:sample?.index,finite:sample?.rect.every(Number.isFinite),pivot:sample?.pivot});age+=frame.seconds;}}}
 check('Every authored clip step samples its exact original frame rect and fixed pivot',samples.length>900&&samples.every(s=>s.index===s.actual&&s.finite&&s.pivot.length===2),{steps:samples.length});
 const a=api.sample(81,.2),b=api.sample('F081',.2),d=api.sample(data.effects.F081.effectId,.2);
 check('Numeric canonical and original effect IDs resolve to the same frame',a.id===b.id&&a.id===d.id&&a.index===b.index&&a.index===d.index);
 const ping=[];
 for(const id of [243,244,247,248,249,250]){const spec=data.effects['F'+id],step=spec.frames[0].seconds,indices=Array.from({length:30},(_,i)=>api.sample(id,(i+.5)*step).index);ping.push({id,indices,wrapped:api.sample(id,30*step+step*.5).index,atBoundary:api.sample(id,spec.clips.main.duration).index});}
 check('F6 auras retain the30-step forward reverse sequence and exact wrap',ping.every(row=>JSON.stringify(row.indices)===JSON.stringify([...Array(16).keys(),...Array.from({length:14},(_,i)=>14-i)])&&row.wrapped===0&&row.atBoundary===0)&&api.sample(243,.06).index===1,ping);
 check('Thorn automatically chains emerge bind hold and bounded release',api.sample(99,.04).index===0&&api.sample(99,.68).index===8&&api.sample(99,1).index===12&&api.sample(99,100).clip==='hold'&&api.sample(99,.60,{clip:'release'}).index===23&&api.sample(99,.65,{clip:'release'})===null);
 check('Original endpoint opacity interpolates without altering PNG pixels',Math.abs(api.sample(81,.02).alpha-.25)<1e-8&&Math.abs(api.sample(81,1.26).alpha-.25)<1e-8&&Math.abs(api.sample(99,.02).alpha-.25)<1e-8);
 check('Held warnings require explicit signal while projectiles hold only by request',api.sample(260,30).index===15&&api.sample(260,30,{signal:true})===null&&api.sample(262,30)===null&&api.sample(262,30,{holdLast:true}).index===15);
 const decoded=[];
 for(const id of ids){api.clear();const ok=await api.ensure(id);decoded.push({id,ok,resident:api.inspect().residentBytes});}
 check('Each of42 atlases decodes individually while staying inside the64MiB bound',decoded.every(r=>r.ok&&r.resident<=64*1024*1024),decoded);
 api.clear();c.time=1;const requests=await Promise.all(ids.map(id=>api.ensure(id))),budget=api.inspect();
 check('Concurrent42-effect requests never decode all42 or exceed atlas and byte budgets',requests.some(Boolean)&&requests.some(v=>!v)&&budget.residentBytes<=budget.budgetBytes&&budget.resident.filter(r=>r.state!=='failed').length<=8&&budget.metrics.highWaterBytes<=budget.budgetBytes,{loaded:requests.filter(Boolean).length,budget});
 api.clear();await api.ensure(81);const count=f.images.length;await Promise.all([api.ensure('F081'),api.ensure(81),api.ensure(data.effects.F081.effectId)]);
 check('Repeated aliases and ensures reuse one decoded Image',f.images.length===count&&api.inspect().resident.length===1);
 const pixels=[];
 for(const id of ids){api.clear();await api.ensure(id);const spec=data.effects[id];for(const frame of spec.frames){const clip=Object.entries(spec.clips).find(([,clip])=>clip.frameIndices.includes(frame.index));let age=0;for(const index of clip[1].frameIndices){const step=spec.frames.find(row=>row.index===index);if(index===frame.index){age+=step.seconds*.5;break;}age+=step.seconds;}
   c.time+=.02;const before=f.draws.length,ok=api.render(id,{x:10,y:10,age,clip:clip[0],sourceKey:id+':'+frame.index,angle:.2});const draw=f.draws.at(-1);pixels.push({id,index:frame.index,ok,pivot:draw?.owner?.r88Pivot,rect:draw?.args.slice(0,4),blend:draw?.blend,finite:draw?.args.every(Number.isFinite),groundAligned:draw?.owner?.groundAligned,layer:draw?.owner?.r88Layer,count:f.draws.length-before,expected:frame.rect});}}
 check('All authored stored frames draw unchanged atlas rects with source alpha and finite quads',pixels.length===680&&pixels.every(p=>p.ok&&p.count===1&&p.blend==='source-over'&&p.finite&&(p.layer!=='ground'||p.groundAligned)&&JSON.stringify(p.rect)===JSON.stringify(p.expected)),{frames:pixels.length});
 check('Drawing restores caller alpha transform blend and owner state',f.c.ctx.globalAlpha===1&&f.c.ctx.globalCompositeOperation==='source-over'&&f.c.ctx.owner===null&&f.c.ctx.translateValue[0]===0);
 api.clear();await api.ensure(99);const actor={id:'enemy-fixture',hp:10,x:10,y:10},start=c.time;
 const handle=api.attach(99,{entity:actor,key:'native-status',layer:'afterActor',until:start+2.2});
 const duplicate=api.attach(99,{entity:actor,key:'native-status',layer:'afterActor',until:start+9});
 check('Native status keys deduplicate attachment without restarting its clock',!!handle&&duplicate===handle&&api.inspect().active.length===1&&api.inspect().active[0].age===0);
 c.time+=.68;actor.x+=.5;const wrong=api.draw({layer:'beforeActor',entity:actor}),right=api.draw({layer:'afterActor',entity:actor}),position=api.inspect().active[0];
 check('Attachment follows its live actor and draws only in its assigned actor layer',wrong===0&&right===1&&position.x===actor.x&&position.age>.67);
 api.update(handle,{until:c.time+.2});const age=api.inspect().active[0].age;c.time+=.21;api.tick(.21);const releasing=api.inspect().active[0];
 check('Status extensions preserve age and expiry switches thorn to its release clip',age>.67&&releasing.clip==='release'&&releasing.layer==='overlay'&&releasing.entityId===null);
 const rebound=api.attach(99,{entity:actor,key:'native-status',layer:'afterActor',until:c.time+2});
 check('A new admitted status may bind again while the previous release tail finishes',!!rebound&&rebound!==handle&&api.inspect().active.length===2);
 api.remove(rebound);c.time+=.65;api.tick(.65);
 check('Release clip completes and removes both status and tail handles',api.inspect().active.length===0);
 const dying=api.attach(99,{entity:actor,until:c.time+2});actor.hp=0;api.tick(.01);
 check('Actor death removes its attachment without retaining a release cage',!!dying&&api.inspect().active.length===0);
 api.clear();await api.ensure(243);actor.hp=10;actor.x=actor.y=10;const far=api.attach(243,{entity:actor});actor.x=actor.y=10000;api.tick(.01);c.time+=1.6;api.tick(.1);
 check('Offscreen status instances expire after the bounded grace interval',!!far&&api.inspect().active.length===0);
 c.time+=6;api.tick(.1);check('Unused decoded atlas textures expire after idle TTL',api.inspect().residentBytes===0);
 api.clear();await api.ensure(243);const handles=Array.from({length:40},(_,i)=>api.play(243,{x:10,y:10,key:'stress-'+i,layer:'beforeActor'}));
 check('Managed multi-spawn is capped at16 live instances',handles.filter(Boolean).length===16&&api.inspect().active.length===16&&api.inspect().metrics.highWaterInstances<=16);
 c.room={id:'next-scene'};api.tick(.01);check('Room identity changes clear all instances Images and pending timers',api.inspect().active.length===0&&api.inspect().resident.length===0&&f.timers.size===0);
 await api.ensure(81);c.player.hp=0;api.tick(.01);const deadEnsure=await api.ensure(81);
 check('Player death releases textures and cannot immediately reload them',api.inspect().residentBytes===0&&!deadEnsure);c.player.hp=100;
 api.clear();await api.ensure(81);c.matchMedia=()=>({matches:true});api.tick(.01);
 check('Pointer coarse scope preserves mobile by declining and releasing FINAL42',api.inspect().residentBytes===0&&api.render(81,{x:10,y:10,age:.2})===false);c.matchMedia=()=>({matches:false});
 const pending=fixture();pending.c.autoImage=false;const loading=pending.api.ensure(81);pending.api.clear();const cancelled=await loading;
 check('Scene cancellation resolves pending decodes and cannot resurrect a late Image',cancelled===false&&pending.api.inspect().resident.length===0&&pending.timers.size===0);
 const failed=fixture();failed.c.autoImage=false;const failure=failed.api.ensure(81),image=failed.images[0];image.onerror();await failure;const failedLoads=failed.images.length;await failed.api.ensure(81);
 check('An image failure is cached for the scene and not retried on every frame',!failed.api.isReady(81)&&failed.images.length===failedLoads&&failed.api.inspect().metrics.failed===1);
 const initialLoad=fixture(),initialScene=initialLoad.c.room,initialActor={id:'initial-status',x:10,y:10,hp:10};
 const firstAttempt=initialLoad.api.attach(243,{entity:initialActor,key:'initial-status',scene:initialScene,age:.3,until:2});
 await initialLoad.api.ensure(243);const retried=initialLoad.api.attach(243,{entity:initialActor,key:'initial-status',scene:initialScene,age:.3,until:2});
 check('First-load admission keeps native fallback then a live ready retry preserves original age',firstAttempt===null&&!!retried&&Math.abs(initialLoad.api.inspect().active[0].age-.3)<1e-8);
 initialLoad.c.room={id:'after-async-scene'};await initialLoad.api.ensure(243);
 check('A ready texture cannot resurrect an async event captured in a previous scene',initialLoad.api.attach(243,{entity:initialActor,key:'late-event',scene:initialScene})===null&&initialLoad.api.render(243,{entity:initialActor,age:.3,scene:initialScene})===false&&initialLoad.api.inspect().active.length===0);
 api.clear();await api.ensure(251);const geometries=[{shape:'donut',x:10,y:10,radius:2,innerRadius:.8},{shape:'capsule',x:10,y:10,originX:10,originY:10,radius:2,width:.6,angle:.3},{shape:'cone',x:10,y:10,radius:2,width:.8,angle:.3}];const original=JSON.stringify(geometries),rules=f.clipRules.length;
 const admitted=geometries.map((geometry,i)=>api.render(251,{x:10,y:10,age:.2,geometry,sourceKey:'geometry-'+i}));
 check('Ground textures use the exact native footprint with donut hole and capsule union rules',admitted.every(Boolean)&&JSON.stringify(geometries)===original&&JSON.stringify(f.clipRules.slice(rules))===JSON.stringify(['evenodd','nonzero','nonzero'])&&f.geometryCalls.slice(-3).every((g,i)=>g===geometries[i]));
 check('Malformed footprint angles never emit nonfinite geometry',!api.render(251,{x:10,y:10,age:.2,geometry:{shape:'cone',x:10,y:10,radius:2,width:1,angle:NaN}}));
 // Replay the actual native footprint recorder, rather than accepting the
 // minimal context fixture's clip-call assertions as geometry evidence.
 check('Native replay uses byte-identical canonical runtime and catalog delivery',fs.readFileSync(path.join(root,'hospital-three-pc/site/final42-runtime-r88.js'),'utf8')===source&&fs.readFileSync(path.join(root,'hospital-three-pc/site/final42-data-r88.js'),'utf8')===dataSource);
 const {createHarness}=require('../harness.cjs'),h=createHarness({timeoutMs:120000});
 await h.boot();await h.start();h.run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=guide=false;');
 h.run(dataSource);h.run(source);h.context.final42Dimensions=Object.fromEntries(Object.values(data.effects).flatMap(spec=>spec.atlases.map(atlas=>[atlas.path,[atlas.width,atlas.height]])));
 h.run(`(()=>{const Base=Image;window.Image=class extends Base{set src(v){super.src=v;const p=new URL(v,document.baseURI).pathname.slice(1),d=final42Dimensions[p];if(d){this.width=this.naturalWidth=d[0];this.height=this.naturalHeight=d[1];}}get src(){return super.src;}};__STORYWORLD_FINAL42_R88__.clear();})()`);
 await h.run('__STORYWORLD_FINAL42_R88__.ensure(251)');
 const capture=h.run(`(()=>{const old=ctx,rec=new StoryPhase1.DrawCommands(),hp=player.hp,x=player.x,y=player.y,g=[{shape:'donut',x,y,radius:2,innerRadius:.8},{shape:'capsule',x,y,originX:x,originY:y,radius:2,width:.6,angle:.3},{shape:'cone',x,y,radius:2,width:.8,angle:.3}],before=JSON.stringify(g),counts=[];ctx=rec;try{for(let i=0;i<g.length;i++){const ok=__STORYWORLD_FINAL42_R88__.render(251,{x,y,age:.2,geometry:g[i],sourceKey:'native-geometry-'+i});counts.push(ok);}return{commands:rec.finish(),counts,geometries:g,unchanged:before===JSON.stringify(g),hpUnchanged:hp===player.hp,projection:__STORYWORLD_PHASE1__.capture().projection};}finally{ctx=old;}})()`);
 check('Actual native footprint recording emits one clipped original-atlas command per shape',capture.counts.every(Boolean)&&capture.commands.length===3&&capture.commands.every(command=>command.kind==='image'&&command.owner.r88EffectID==='F251'&&command.clips.length===1)&&capture.unchanged&&capture.hpUnchanged,{counts:capture.counts,commands:capture.commands.map(command=>({owner:command.owner,clips:command.clips.length}))});
 const T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js'),A=h.context.StoryPhase1,projection=new A.Projection();projection.configure(capture.projection);
 const scene3=new A.CommandScene(T,{projection,spatial:true});scene3.render(capture.commands);
 check('Native FINAL42 clipped image commands produce finite real Three geometry',scene3.rows.size===3&&[...scene3.rows.values()].every(row=>Object.values(row.mesh.geometry.attributes).every(attribute=>attribute.array.every(Number.isFinite))));
 function contains(point,a,b,c){const sign=(p,a,b)=>(p[0]-b[0])*(a[1]-b[1])-(a[0]-b[0])*(p[1]-b[1]);const d=[sign(point,a,b),sign(point,b,c),sign(point,c,a)];return !(d.some(v=>v< -1e-6)&&d.some(v=>v>1e-6));}
 const coverage=[];
 for(let i=0;i<capture.commands.length;i++){const row=scene3.rows.get(capture.commands[i].key),g=capture.geometries[i],positions=row.mesh.geometry.attributes.position.array;let covered=false;const p=g.shape==='capsule'?[g.x+Math.cos(g.angle)*g.radius*.5,g.y+Math.sin(g.angle)*g.radius*.5]:[g.x,g.y];for(let j=0;j<positions.length;j+=9){const triangle=[[positions[j],positions[j+2]],[positions[j+3],positions[j+5]],[positions[j+6],positions[j+8]]];if(contains(p,...triangle))covered=true;}coverage.push({shape:g.shape,covered});}
 check('Three clipping preserves the donut hole and capsule union without XOR holes',coverage[0].covered===false&&coverage[1].covered===true,coverage);
 check('FINAL42 textures retain straight alpha linear clamp filtering without mipmaps',[...scene3.textures.values()].every(row=>!row.texture.generateMipmaps&&row.texture.minFilter===T.LinearFilter&&row.texture.magFilter===T.LinearFilter&&row.texture.wrapS===T.ClampToEdgeWrapping&&row.texture.wrapT===T.ClampToEdgeWrapping&&!row.texture.premultiplyAlpha));
 const rearCommand={...capture.commands[0],key:'rear-r88-policy',spatialRole:null,owner:{...capture.commands[0].owner,groundAligned:false,r88Layer:'beforeActor'}},frontCommand={...rearCommand,key:'front-r88-policy',owner:{...rearCommand.owner,r88Layer:'afterActor'}};
 scene3.render([rearCommand,frontCommand]);const rear=scene3.rows.get(rearCommand.key).mesh,front=scene3.rows.get(frontCommand.key).mesh;
 check('Supplied single rear and front overlays retain pass ordering and world-depth occlusion',rear.layers.mask===4&&rear.renderOrder===-1&&rear.material.depthTest&&!rear.material.depthWrite&&!rear.material.polygonOffset&&front.layers.mask===8&&front.material.depthTest&&!front.material.depthWrite&&front.material.polygonOffset&&front.material.polygonOffsetFactor===0&&front.material.polygonOffsetUnits===-1&&!Object.prototype.hasOwnProperty.call(rearCommand.owner,'bodyPath'),{rear:{mask:rear.layers.mask,order:rear.renderOrder,depthTest:rear.material.depthTest,depthWrite:rear.material.depthWrite},front:{mask:front.layers.mask,order:front.renderOrder,depthTest:front.material.depthTest,depthWrite:front.material.depthWrite},hasBodyPath:Object.prototype.hasOwnProperty.call(rearCommand.owner,'bodyPath')});
 scene3.render([]);check('Removing actual FINAL42 commands releases all Three geometry and textures',scene3.rows.size===0&&scene3.textures.size===0);scene3.dispose();
 check('Native game error ledger remains clear after FINAL42 CPU replay',h.run('errors.length')===0,h.run('errors'));
 report.sampledSteps=samples.length;report.renderedFrames=pixels.length;report.metrics=api.inspect();
})().catch(error=>{report.failure=error.stack;console.error(error.stack);process.exitCode=1;}).finally(()=>{report.passed=!report.failure&&report.checks.every(c=>c.passed);fs.writeFileSync(path.join(__dirname,'final42-runtime-results.json'),JSON.stringify(report,null,2)+'\n');console.log('FINAL',report.passed,report.checks.length);});
