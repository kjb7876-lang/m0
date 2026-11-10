'use strict';
// Independent CPU audit of the supplied unchanged sampler and drawing API.
// Native game event integration is checked by the separate R84 runtime suite.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),source=process.argv[2]||path.join(root,'hospital-three-pc/source-patch/asset-source-docs/refined-r85/dynamic');
const report={checks:[],samples:0,replays:0,maxPrimitives:0,method:'Supplied unchanged runtime.js in restricted Node VM; pinned real Three CPU CommandScene replay. No browser/GPU or pixel rasterization.',browserVerified:false,GPUVerified:false};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,...detail===undefined?{}:{detail}});if(!passed)throw Error(name);};
const serial=value=>JSON.stringify(value);
const numbers=(value,bad=[])=>{if(typeof value==='number'&&!Number.isFinite(value))bad.push(value);else if(Array.isArray(value))value.forEach(v=>numbers(v,bad));else if(value&&typeof value==='object')Object.values(value).forEach(v=>numbers(v,bad));return bad;};
(async()=>{
 const state={},context=vm.createContext(state);state.globalThis=state;state.window=state;
 const runtime=fs.readFileSync(path.join(source,'runtime.js'),'utf8'),catalogJS=fs.readFileSync(path.join(source,'catalog.js'),'utf8');
 vm.runInContext(runtime,context,{timeout:2000,filename:'supplied-runtime.js'});vm.runInContext(catalogJS,context,{timeout:2000,filename:'supplied-catalog.js'});
 const api=state.StoryVFX,catalog=JSON.parse(fs.readFileSync(path.join(source,'catalog.json'),'utf8'));
 check('Supplied global catalog and JSON are byte-semantic equivalents',serial(state.STORY_VFX_CATALOG)===serial(catalog)&&catalog.length===80);
 const before=serial(catalog),keys=new Set(),roles=new Set(),layers=new Set(),types=new Set(),seedDifferences=[];let bad=0,ended=0;
 for(const e of catalog){keys.add(e.id);roles.add(e.role);for(let i=0;i<=60;i++){
  const t=i===60?e.duration:e.duration*i/60,a=api.sample(e,t,e.seed),b=api.sample(e,t,e.seed);report.samples++;
  if(serial(a)!==serial(b)||numbers(a).length||a.primitives.length>api.maxPrimitives)bad++;
  if(i===60){if(!a.active&&!a.primitives.length)ended++;continue;}
  report.maxPrimitives=Math.max(report.maxPrimitives,a.primitives.length);
  for(const q of a.primitives){layers.add(q.layer);types.add(q.type);if(q.alpha<0||q.alpha>1||q.width!=null&&!(q.width>0)||q.radius!=null&&q.radius<0)bad++;}
 }
 seedDifferences.push(serial(api.sample(e,e.duration*.4,1))!==serial(api.sample(e,e.duration*.4,2)));
 }
 check('All80 supplied recipes produce finite deterministic budgeted timeline samples',keys.size===80&&bad===0&&report.samples===4880,{samples:report.samples,maxObserved:report.maxPrimitives,limit:api.maxPrimitives});
 check('Every supplied recipe terminates with zero primitives at its duration',ended===80);
 check('Supplied sampling preserves catalog inputs and responds to seeds',serial(catalog)===before&&seedDifferences.every(Boolean));
 check('Negative and nonfinite elapsed times never produce a live effect',catalog.every(e=>[-1,NaN,Infinity,-Infinity].every(t=>{const f=api.sample(e,t,e.seed);return!f.active&&f.primitives.length===0;})));
 check('Supplied primitives use only local bounded supported drawing roles',api.maxPrimitives===96&&['sprite','line','ring','arc','particle'].every(k=>types.has(k))&&[...types].every(k=>['sprite','line','ring','arc','particle'].includes(k))&&[...roles].every(k=>['projectile','warning','impact','residue'].includes(k))&&layers.size===4,{types:[...types],roles:[...roles],layers:[...layers]});
 const panel=catalog.find(e=>e.motion==='panel-rise-hold'),stitch=catalog.find(e=>e.motion==='stitch-inward'),counter=catalog.find(e=>e.id==='10_knight_parry_counter');
 check('Supplied role exceptions retain impact counter and stationary deployed panel',counter?.role==='impact'&&panel&&[.35,.55,.75].every(p=>{const f=api.sample(panel,p*panel.duration,panel.seed),s=f.primitives.find(q=>q.type==='sprite');return s&&s.x===0&&s.y===0;}),{counter:counter?.id,counterRole:counter?.role,panel:panel?.id});
 const st1=api.sample(stitch,stitch.duration*.12,stitch.seed),st2=api.sample(stitch,stitch.duration*.55,stitch.seed),distance=f=>{const p=f.primitives.filter(q=>q.type==='particle'&&q.layer==='travel');return p.reduce((s,q)=>s+Math.hypot(q.x,q.y),0)/Math.max(1,p.length);};
 check('Supplied resurrection recipe closes inward rather than inventing outgoing damage',!!stitch&&stitch.role==='residue'&&distance(st2)<distance(st1),{stitch:stitch?.id,earlyMean:distance(st1),laterMean:distance(st2)});
 const Awindow={},actx=vm.createContext({window:Awindow,performance:{now:()=>0},URL,URLSearchParams,console});vm.runInContext(fs.readFileSync(path.join(root,'hospital-three-pc/site/dist/phase1.js'),'utf8'),actx,{timeout:10000});
 const A=Awindow.StoryPhase1,T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js'),projection=new A.Projection();projection.configure({width:640,height:360,zoom:1,tile:34,camX:0,camY:0});const scene=new A.CommandScene(T,{projection,spatial:false});
 let invalid=0,totalCommands=0;for(const e of catalog)for(const fraction of [.16,.45,.8]){
  const rec=new A.DrawCommands({canvas:{width:640,height:360}}),image=e.source?{naturalWidth:e.sourceSize[0],naturalHeight:e.sourceSize[1],width:e.sourceSize[0],height:e.sourceSize[1],complete:true,src:e.source}:null;
  rec.scope({id:'supplied:'+e.id,kind:'effect',x:0,y:0},()=>api.render(rec,api.sample(e,e.duration*fraction,e.seed),image));const commands=rec.finish();scene.render(commands);report.replays++;
  if(!commands.length||commands.length>api.maxPrimitives)invalid++;
  for(const c of commands){if(c.style.globalCompositeOperation!=='source-over'||numbers(c.points||c.paths).length)invalid++;if(c.kind==='image'){const[sx,sy,sw,sh]=c.sourceRect,[iw,ih]=c.imageSize;if(sx!==0||sy!==0||sw!==iw||sh!==ih)invalid++;}}
  for(const r of scene.rows.values())for(const a of Object.values(r.mesh.geometry.attributes))if(!a.array.every(Number.isFinite))invalid++;
  totalCommands+=commands.length;
 }
 check('All80 original render recipes replay through actual Three CPU geometry',invalid===0&&report.replays===240&&totalCommands>1000,{replays:report.replays,commands:totalCommands});
 scene.clear();check('Supplied rendering leaves no retained Three meshes or image textures after clear',scene.rows.size===0&&scene.textures.size===0);scene.dispose();
})().catch(e=>{report.failure=e.stack;report.checks.push({name:'Exception',passed:false,detail:e.stack});process.exitCode=1;}).finally(()=>{report.passed=report.checks.every(c=>c.passed)&&!report.failure;fs.writeFileSync(path.join(__dirname,'dynamic-source-runtime-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,samples:report.samples,replays:report.replays}));});
