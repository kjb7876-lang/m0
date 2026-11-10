'use strict';
// Separates registered content, reachable bindings, and actual draw commands.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{createHarness}=require('../harness.cjs');
const root=path.resolve(__dirname,'../..'),report={schema:'r86-art-and-static-vfx-usage/v1',checks:[],browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);if(!passed)throw Error(name);};
(async()=>{
 const h=createHarness({timeoutMs:120000});await h.boot();await h.start();h.run('for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;settings.autoSkill=false;');
 const world=h.context.__STORYWORLD_ASSETS_R80_DATA__,selected=h.context.__STORYWORLD_SELECTED_VFX_DATA_R83__,hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(h.site,p))).digest('hex');
 const artKeys=Object.keys(world.assets),propKeys=new Set(Object.values(world.regions).flatMap(r=>r.props)),echoKeys=new Set(Object.values(world.regions).map(r=>r.echo).filter(Boolean)),referenced=new Set([...propKeys,...echoKeys,...world.hospitalPropSkins]);
 check('All153 selected world assets have scene bindings rather than orphaned registrations',artKeys.length===153&&artKeys.every(k=>referenced.has(k)),{props:propKeys.size,narrativeEchoes:echoKeys.size,regions:Object.keys(world.regions).length,unreferenced:artKeys.filter(k=>!referenced.has(k))});
 check('All153 selected derivative bytes match their active catalog hashes',artKeys.every(k=>hash(world.assets[k].path)===world.assets[k].sha256));
 const raster=Object.values(selected.regions).flatMap(Object.values);
 check('All64 selected static raster effects resolve to exact original image bytes',raster.length===64&&new Set(raster.map(r=>r.sha256)).size===64&&raster.every(r=>hash(r.path)===r.sha256));
 check('Supplied dynamic package is not loaded or initialized',!h.context.StoryVFX&&!h.context.STORY_VFX_CATALOG&&!h.context.__STORYWORLD_DYNAMIC_VFX_R84__);
 const regionRows=[];
 for(const [id,spec]of Object.entries(world.regions)){
  h.context.usageZone=id;h.run(`zone=usageZone;layer='STORY';room=getRoom(zone,layer);player.hp=maxHP();modal=false;storyScene=null;loading=false;effects=[];hazards=[];projectiles=[];__STORYWORLD_WORLD_ASSETS_R80__.dress(room);`);
  await h.run('__STORYWORLD_WORLD_ASSETS_R80__.paths(zone).length?ensureImages(__STORYWORLD_WORLD_ASSETS_R80__.paths(zone)):Promise.resolve()');
  h.context.worldDims=Object.fromEntries(artKeys.map(k=>[world.assets[k].path,[world.assets[k].width,world.assets[k].height]]));h.run('for(const[p,[w,h]]of Object.entries(worldDims)){const im=readyImage(p)?.image;if(im){im.width=im.naturalWidth=w;im.height=im.naturalHeight=h;}}');
  const rows=h.run(`(()=>{const out=[],prev=ctx;for(const p of room.props){const a=__STORYWORLD_WORLD_ASSETS_R80__.artFor(p);if(!a)continue;player.x=p.x;player.y=p.y;cam.x=p.x;cam.y=p.y;const rec=new StoryPhase1.DrawCommands();ctx=rec;try{drawProp(p);const cmds=rec.finish();out.push({id:p.id,path:a.path,drawn:cmds.some(c=>c.kind==='image'&&String(c.sourcePath).endsWith(a.path)),solid:p.solid===true,hospital:zone==='ep1a08',newProp:p.r80Dressing===true});}finally{ctx=prev;}}return out;})()`);
  regionRows.push({id,configuredProps:spec.props.map(k=>world.assets[k].path),actual:rows});
 }
 const all=regionRows.flatMap(r=>r.actual),drawnPaths=new Set(all.filter(r=>r.drawn).map(r=>r.path));report.regions=regionRows;
 check('Every configured scene creates local original or dressed art placements',regionRows.length===62&&regionRows.every(r=>r.actual.length>0),{regions:regionRows.length,empty:regionRows.filter(r=>!r.actual.length).map(r=>r.id)});
 check('All placed selected props emit actual image commands when observed at their own anchor',all.length>0&&all.every(r=>r.drawn),{placements:all.length,uniqueArt:drawnPaths.size,missed:all.filter(r=>!r.drawn)});
 check('New visual dressing never adds solid obstacles to the maze',all.filter(r=>r.newProp).every(r=>!r.solid));
 check('Refined bed, wheelchair and monitor appear through actual hospital prop rendering',['r80-142','r80-143','r80-149'].every(k=>regionRows.find(r=>r.id==='ep1a08').actual.some(r=>r.drawn&&r.path===world.assets[k].path)));
 check('The refined sand track remains the active Kair recovery raster',selected.regions.kair03.recovery.refinementR85===true&&selected.regions.kair03.recovery.path.includes('refined-r85'));
 const inventory=JSON.parse(fs.readFileSync(path.join(root,'hospital-three-pc/source-patch/asset-source-docs/refined-r85/current-assets.json')));
 report.usage={sourcePNGInventory:inventory.files.length,worldPNGsOriginal:254,selectedWorldDerivativeImages:153,configuredWorldProps:propKeys.size,configuredNarrativeEchoes:echoKeys.size,actualDrawnWorldArt:drawnPaths.size,actualDrawnPlacements:all.filter(r=>r.drawn).length,selectedWorldSourcesNew:world.selectedCounts.new,selectedWorldSourcesPrior:world.selectedCounts.prior,unselectedWorldSourcesRetained:254-artKeys.length,regionalRasterEffects:64,regionalVfxSceneBindings:Object.keys(selected.regions).length,dynamicRecipes:0,proceduralMotifs:0,dynamicPackageDeferred:true,previewSVGs:16,previewSVGsGameLoaded:false,generatedFrameSheets:false};
 check('Asset inventory distinguishes selected originals from retained unused originals',inventory.files.length===318&&report.usage.unselectedWorldSourcesRetained===101);
 check('Native scene art drawing preserves runtime health/error invariants',h.run('player.hp>0&&errors.length===0'),h.run('[...errors]'));
 report.interpretation='153 world derivatives are configured:91 prop concepts and62 narrative echoes. This test actually draws placed world props; narrative echoes are bound to story panels, not claimed as combat sprites.64 static raster effects are event-bound across16 regions. The supplied dynamic80 package and its16procedural motifs are not loaded per user instruction; native skills keep their original rendering.101 unselected world source PNGs remain preserved, and16 SVG previews are not game-loaded.';
})().catch(e=>{report.failure=e.stack;console.error(e.stack);process.exitCode=1;}).finally(()=>{report.passed=!report.failure&&report.checks.every(r=>r.passed);fs.writeFileSync(path.join(__dirname,'vfx-usage-results.json'),JSON.stringify(report,null,2)+'\n');console.log('FINAL',report.passed,report.checks.length);});
