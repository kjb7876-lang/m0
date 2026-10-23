'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm'),{spawnSync}=require('child_process'),{createHarness}=require('../harness.cjs');
const root=path.resolve(__dirname,'../..'),site=path.join(root,'hospital-three-pc/site'),source=path.join(root,'hospital-three-pc/source-patch/asset-source-docs/refined-r85');
const report={schema:'r86-refined-static-integration/v1',checks:[],browserVerified:false,GPUVerified:false,naturalPlayVerified:false,method:'Exact supplied source hashes, decoded source/derivative alpha geometry, supplied semantic tests, actual shipped native hospital draw commands and real pinned Three CPU geometry. Scripted positions and renderer readiness are used.'};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);if(!passed)throw Error(name);};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const coverage=JSON.parse(fs.readFileSync(path.join(source,'old-to-new-coverage.json'))),inventory=JSON.parse(fs.readFileSync(path.join(source,'current-assets.json'))),changed=coverage.filter(r=>r.status!=='retained-byte-identical'),integration=JSON.parse(fs.readFileSync(path.join(root,'qa/r85/integration.json')));
 check('Current supplied inventory contains318 PNGs with exactly4 replacements and314 retained',inventory.files.length===318&&changed.length===4&&coverage.length===318&&coverage.filter(r=>r.status==='retained-byte-identical').length===314);
 check('Each retained source has the exact previous hash and each replacement is a real change',coverage.every(r=>(r.oldSha256===r.replacementSha256)===(r.status==='retained-byte-identical')));
 check('Four supplied changed PNGs match current authoritative hashes',changed.every(r=>sha(path.join(source,r.replacementFile))===r.replacementSha256&&inventory.files.find(v=>v.file===r.replacementFile)?.sha256===r.replacementSha256));
 const h=createHarness({timeoutMs:90000});await h.boot();await h.start();h.run('for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;modal=false;loading=false;W=1280;H=800;zoom=1;');
 const world=h.run('__STORYWORLD_ASSETS_R80_DATA__'),selected=h.run('__STORYWORLD_SELECTED_VFX_DATA_R83__'),specs=Object.values(selected.regions).flatMap(Object.values),catalog=JSON.parse(fs.readFileSync(path.join(source,'dynamic/catalog.json')));
 check('All254 old story-source hashes and64 old effect PNGs remain preserved',coverage.every(r=>r.oldFamily==='art'?world.allOriginalSHA256[r.oldFile]===r.oldSha256:sha(path.join(site,'assets/vfx-r83/selected',r.oldFile))===r.oldSha256));
 check('Deferred dynamic source is preserved byte-exact without being initialized',!h.context.StoryVFX&&['catalog.js','catalog.json','runtime.js'].every(n=>sha(path.join(site,'assets/refined-r85/dynamic',n))===sha(path.join(source,'dynamic',n))));
 const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
 check('No supplied dynamic runtime, adapter or preview loop is loaded',!html.includes('src="./assets/refined-r85/dynamic/runtime.js"')&&!html.includes('src="./assets/dynamic-vfx-r84/runtime.js"')&&!html.includes('src="./dynamic-vfx-r84.js"')&&!html.includes('preview.js'));
 check('Every active static raster hash matches the64 supplied current PNGs',specs.length===64&&new Set(specs.map(r=>r.path)).size===64&&specs.every(r=>sha(path.join(site,r.path))===r.sha256&&catalog.some(e=>e.sourceSha256===r.sha256)));
 const unsafe=fs.readFileSync(path.join(source,'dynamic/runtime.js'),'utf8').match(/\b(?:eval|Function|fetch|XMLHttpRequest|WebSocket|localStorage|requestAnimationFrame|setInterval|setTimeout)\s*\(/g);
 check('Refined pure sampler adds no network storage timers or dynamic execution',!unsafe,unsafe);
 const imageInfo=spawnSync('python3',['-c',`from PIL import Image
import json,sys
from pathlib import Path
s=Path(sys.argv[1]);paths=json.loads(sys.argv[2]);o={}
for p in paths:
 with Image.open(s/p) as im:
  im.load();a=im.convert('RGBA').getchannel('A');o[p]={'size':list(im.size),'bbox':list(a.point(lambda a:255 if a>64 else 0).getbbox())}
print(json.dumps(o))`,site,JSON.stringify([...integration.hospitalProps.map(r=>r.path),integration.sand.path])],{encoding:'utf8'});
 if(imageInfo.status!==0)throw Error(imageInfo.stderr);const images=JSON.parse(imageInfo.stdout);
 check('All3 new hospital runtime images decode and preserve native height settings',integration.hospitalProps.length===3&&integration.hospitalProps.every(r=>{const a=world.assets[r.key];return a.scale===r.worldScale&&sha(path.join(site,a.path))===a.sha256&&JSON.stringify(images[a.path].size)===JSON.stringify([a.width,a.height])&&Math.abs(a.frame.pivot[1]/a.height-r.groundAnchorFraction[1])<.00001;}));
 const sand=selected.regions.kair03.recovery,old=JSON.parse(fs.readFileSync(path.join(root,'qa/r85/presentation-baseline.json'))).sand;
 check('Refined sand preserves prior visible footprint without cropping or growing accents',JSON.stringify(images[sand.path].bbox)===JSON.stringify(sand.alpha64BBox)&&Math.abs((sand.alpha64BBox[2]-sand.alpha64BBox[0])*sand.presentationScaleR85-(old.alpha64BBox[2]-old.alpha64BBox[0]))<.001&&sand.presentationScaleR85<=1.5);
 const native=JSON.parse(fs.readFileSync(path.join(root,'qa/r85/hospital-native-baseline.json')));
 check('All11 hospital native prop IDs positions source paths and collision data remain exact',JSON.stringify(h.run('room.props'))===JSON.stringify(native)&&native.length===11);
 const props=integration.hospitalProps.map(r=>world.assets[r.key]);h.context.r85Props=props;h.context.r85Dimensions=Object.fromEntries(props.map(a=>[a.path,[a.width,a.height]]));
 h.run(`(()=>{const Base=Image;window.Image=class extends Base{set src(value){super.src=value;const p=new URL(value,document.baseURI).pathname.slice(1);const d=r85Dimensions[p];if(d){this.width=this.naturalWidth=d[0];this.height=this.naturalHeight=d[1];}}get src(){return super.src;}};for(const [p,row] of imageCache){const d=r85Dimensions[p];if(d&&row.image){row.image.width=row.image.naturalWidth=d[0];row.image.height=row.image.naturalHeight=d[1];}}})()`);
 await h.run('ensureImages(r85Props.map(a=>a.path))');
 const captured=h.run(`(()=>{const saved=ctx,rec=new StoryPhase1.DrawCommands(),before=JSON.stringify({props:room.props,hp:player.hp,enemies:room.enemies.map(e=>[e.id,e.hp]),x:player.x,y:player.y});ctx=rec;try{for(const a of r85Props){const p=room.props.find(p=>__STORYWORLD_WORLD_ASSETS_R80__.artFor(p)?.path===a.path);if(!p)throw Error('New hospital art is not assigned');drawProp({...p,x:player.x+1,y:player.y+.4});}return{commands:rec.finish(),same:before===JSON.stringify({props:room.props,hp:player.hp,enemies:room.enemies.map(e=>[e.id,e.hp]),x:player.x,y:player.y})};}finally{ctx=saved;}})()`);
 check('Actual native drawProp emits all3 refined art bodies and changes no simulation data',captured.same&&props.every(a=>captured.commands.some(c=>c.kind==='image'&&c.owner?.bodyPath===a.path)),{commands:captured.commands.length});
 const T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js'),A=h.context.StoryPhase1,p=new A.Projection(),scene=new A.CommandScene(T,{projection:p,spatial:true});p.configure(h.run('__STORYWORLD_PHASE1__.capture().projection'));scene.render(captured.commands);let finite=true;for(const row of scene.rows.values())for(const a of Object.values(row.mesh.geometry.attributes))if(!a.array.every(Number.isFinite))finite=false;
 check('Refined native hospital bodies convert to finite real Three geometry',scene.rows.size>0&&finite,{rows:scene.rows.size});scene.dispose();
 check('Hospital start remains Settings-only and the V11 save namespace is isolated',h.context.__STORYWORLD_HOSPITAL_SETTINGS_R84__.inspect().attachedToSettings===false&&h.run('__STORYWORLD_TEST_STORAGE_B1__.prefix')==='storyworld.hospital-three-pc.maze.v11:');
 check('No native runtime errors were recorded in refined hospital replay',h.run('errors.length')===0,h.run('[...errors]'));
})().catch(e=>{report.failure=e.stack;report.checks.push({name:'Exception',passed:false,detail:e.stack});process.exitCode=1;}).finally(()=>{report.passed=report.checks.every(c=>c.passed)&&!report.failure;fs.writeFileSync(path.join(__dirname,'refined-static-results.json'),JSON.stringify(report,null,2)+'\n');console.log(report.checks.filter(c=>c.passed).length+'/'+report.checks.length);});
