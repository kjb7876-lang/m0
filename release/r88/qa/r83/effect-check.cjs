'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {createHarness}=require('../harness.cjs');
const checks=[],out={schema:'r83-existing-effect-command-replay/v1',method:'Actual shipped atlas metadata and native drawEffect chain in Node VM, PNG header dimensions, source SHA256, replay through real pinned Three CPU CommandScene. Scripted effect fixtures and a native basic attack; no browser/GPU or natural play.',checks,new64:{source:'Nine user-supplied quality-selected part ZIPs',applied:false},browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
const check=(name,passed,detail)=>{checks.push({name,passed:!!passed,detail});console.log(name,passed?'PASS':'FAIL');if(!passed)throw Error(name);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function pngDimensions(b){if(b.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error('Not PNG');return[b.readUInt32BE(16),b.readUInt32BE(20)];}
(async()=>{
 const h=createHarness({timeoutMs:60000}),T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js');
 await h.boot();await h.start();h.run(`for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);auto=false;settings.autoSkill=false;player.hero='neon';cam.x=player.x;cam.y=player.y;W=1280;H=800;zoom=1;`);
 const data=h.run('STORY_PXF_DATA'),images=new Map();
 for(const row of data)for(const p of [row.path,...Object.values(row.teamPaths||{})]){const b=fs.readFileSync(path.join(h.site,p)),[width,height]=pngDimensions(b);images.set(p,{bytes:b.length,width,height,sha256:sha(b)});}
 check('Existing 44 atlas records and all 106 base/team PNGs are present',data.length===44&&images.size===106,{records:data.length,PNGs:images.size});
 const badHashes=data.filter(r=>images.get(r.path).sha256!==r.sha256||images.get(r.path).bytes!==r.bytes||sha(fs.readFileSync(path.join(h.site,r.sourcePath)))!==r.sourceSHA256).map(r=>r.key);
 check('Every original PXF source and baked primary PNG retains its declared hash',badHashes.length===0,badHashes);
 const badFrames=[];for(const r of data)for(const p of [r.path,...Object.values(r.teamPaths||{})]){const im=images.get(p);if(r.frameCount!==r.frames.length||r.fps<=0||r.duration<=0||r.pivot.length!==2||!r.pivot.every(Number.isFinite))badFrames.push(r.key);for(const f of r.frames){const [x,y,w,hh]=f.rect;if(![x,y,w,hh].every(Number.isFinite)||x<0||y<0||w<=0||hh<=0||x+w>im.width||y+hh>im.height)badFrames.push(r.key+':'+p);}}
 check('Every authored frame/pivot/timeline fits the actual atlas dimensions',badFrames.length===0,badFrames);
 await h.run('ensureImages(STORY_PXF_DATA.flatMap(r=>[r.path,...Object.values(r.teamPaths||{})]))');
 for(const [p,im]of images){const actual=h.run(`readyImage(${JSON.stringify(p)}).image`);actual.naturalWidth=actual.width=im.width;actual.naturalHeight=actual.height=im.height;}
 const api=h.context.__STORYWORLD_EFFECT_PRESENTATION_R83__;
 check('R83 presentation module is loaded by the delivered index',!!api);
 const policy=h.run(`(()=>{const api=__STORYWORLD_EFFECT_PRESENTATION_R83__,e={type:'pxfSprite',pxfSize:60,pxfEmissionZoomR83:1};zoom=2;const doubled=api.size(e,60),capped=api.size({...e,pxfSize:1000},1000),native=api.size({type:'pxfSprite'},90),other=api.size({type:'medicalHit20'},9000);zoom=1;return{doubled,capped,native,other};})()`);
 check('Explicit atlas size tracks current zoom and decorative quads stay below 23% viewport',policy.doubled===120&&policy.capped===184&&policy.native===90&&policy.other===9000,policy);
 const A=h.context.StoryPhase1,projection=new A.Projection();projection.configure({width:1280,height:800,zoom:1,camX:h.run('cam.x'),camY:h.run('cam.y'),tile:h.run('TILE')});
 const scene=new A.CommandScene(T,{projection,spatial:true}),renders=[],modes=new Set(),materials=new Set();let totalCommands=0;
 // The fixture enters the final native drawEffect chain; only the event record
 // is synthetic, allowing every catalog asset/frame/blend to be exercised.
 for(const reduced of [false,true])for(const side of ['player','enemy'])for(const r of data)for(const frameIndex of [...new Set([0,Math.floor(r.frames.length/2),r.frames.length-1])]){
  h.context.effectFixture={row:r,reduced,side,frameIndex};
  const commands=h.run(`(()=>{const {row:r,reduced,side,frameIndex}=effectFixture,old=ctx,rec=new StoryPhase1.DrawCommands();settings.reducedMotion=reduced;ctx=rec;try{const e={type:'pxfSprite',x:player.x,y:player.y,angle:.37,age:(frameIndex+.01)/r.fps,life:r.duration,asset:r.teamPaths?.[side]||r.path,pxfKey:r.key,pxfEvent:'r83:'+r.key+':'+side,pxfEpoch:__STORYWORLD_PXF__.inspect().epoch,pxfHero:'neon',pxfGround:false,pxfSide:side,pxfLayer:'front',pxfStage:'quality-fixture'};drawEffect(e);return rec.finish();}finally{ctx=old;}})()`);
  const sprite=commands.find(c=>c.kind==='image'&&c.owner.pxfKey===r.key);
  if(!sprite)throw Error('No atlas command: '+r.key+':'+side+':'+reduced+':'+frameIndex);
  if(JSON.stringify(sprite.sourceRect)!==JSON.stringify(r.frames[frameIndex].rect))throw Error('Wrong atlas frame: '+r.key);
  if(!sprite.points.flat().every(Number.isFinite)||sprite.style.globalAlpha<0||sprite.style.globalAlpha>1)throw Error('Invalid points/alpha: '+r.key);
  scene.render(commands);const live=[...scene.rows.values()];if(!live.length)throw Error('Actual Three replay produced no mesh: '+r.key);
  for(const row of live){if(!row.mesh.geometry.attributes.position.array.every(Number.isFinite))throw Error('Invalid actual geometry: '+r.key);materials.add(row.mesh.material.type);}
  modes.add(sprite.style.globalCompositeOperation);totalCommands+=commands.length;renders.push({key:r.key,reducedMotion:reduced,side,frame:frameIndex,commands:commands.length,blend:sprite.style.globalCompositeOperation});
 }
 out.catalogReplay={renders:renders.length,commands:totalCommands,blendModes:[...modes],materialTypes:[...materials],rows:renders};
 check('All 44 atlas types replay first/middle/last frames in both teams and motion modes',renders.length===44*3*2*2,out.catalogReplay.renders);
 check('Actual atlas commands exercise both source-over and lighter without renderer rejection',modes.has('lighter')&&modes.has('source-over'),[...modes]);
 const ground=h.run(`(()=>{const r=STORY_PXF_DATA.find(r=>r.key==='pxf-22'),old=ctx,rec=new StoryPhase1.DrawCommands();ctx=rec;try{drawEffect({type:'pxfSprite',x:player.x,y:player.y,angle:0,age:r.duration*.4,life:r.duration,asset:r.path,pxfKey:r.key,pxfEvent:'r83-ground',pxfEpoch:__STORYWORLD_PXF__.inspect().epoch,pxfHero:'neon',pxfGround:true,pxfSide:'enemy',pxfLayer:'front',pxfStage:'prepare'});return rec.finish();}finally{ctx=old;}})()`);scene.render(ground);const grounds=[...scene.rows.values()];
 check('Ground warning atlas remains on its authored world plane',ground.length>0&&ground.every(c=>c.owner.groundAligned===true)&&grounds.every(r=>{const p=r.mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)-.012)>1e-6)return false;return true;}));
 const invalid=h.run(`(()=>{const r=STORY_PXF_DATA[0],old=ctx,rec=new StoryPhase1.DrawCommands();ctx=rec;try{const e={type:'pxfSprite',x:player.x,y:player.y,angle:0,age:.2,life:r.duration,asset:r.path,pxfKey:r.key,pxfEvent:'r83-dead',pxfEpoch:__STORYWORLD_PXF__.inspect().epoch,pxfHero:'neon',pxfSide:'enemy',pxfLayer:'front',pxfOwner:{hp:0,spawnState:'active'}};drawEffect(e);drawEffect({...e,pxfOwner:null,pxfEpoch:e.pxfEpoch-1});return rec.finish();}finally{ctx=old;}})()`);
 check('Dead owners and obsolete region epochs cannot leave decorative sprites',invalid.length===0);
 scene.render([]);check('Replay cleanup returns all effect meshes and texture leases to zero',scene.rows.size===0&&scene.textures.size===0,scene.inspect());scene.dispose();
 h.run(`settings.reducedMotion=false;effects=[];projectiles=[];player.attackCD=0;player.combo=0;player.storyWER={ready:{},buffs:{}};room.enemies=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,1);const foe=room.enemies[0];foe.hp=foe.maxHp=999999;foe.spawnState='active';foe.deadRecorded=false;foe.x=player.x+.8;foe.y=player.y;foe.graceUntil=-1;target=foe.id;`);
 const native=h.run(`(()=>{const before=__STORYWORLD_PXF__.inspect().stats.emitted,combo=player.combo;basicAttack();return{comboBefore:combo,comboAfter:player.combo,before,after:__STORYWORLD_PXF__.inspect().stats.emitted,effects:effects.map(e=>({type:e.type,key:e.pxfKey,zoom:e.pxfEmissionZoomR83,explicit:e.pxfSize}))};})()`);
 check('Native basic attack emits real supplemental effects from admitted combat',native.comboAfter>native.comboBefore&&native.after>native.before,native);
 const actual=h.run(`(()=>{const saved=ctx,rec=new StoryPhase1.DrawCommands();ctx=rec;try{for(const e of effects)drawEffect(e);return rec.finish();}finally{ctx=saved;}})()`),realScene=new A.CommandScene(T,{projection,spatial:true});realScene.render(actual);
 check('Actual native combat effect commands replay through pinned Three',actual.length>0&&realScene.rows.size>0,{commands:actual.length,meshes:realScene.rows.size});realScene.dispose();
 const retained=h.run(`({medical:__STORYWORLD_MEDICAL20__.inspect(),pxf:__STORYWORLD_PXF__.inspect(),policy:__STORYWORLD_EFFECT_PRESENTATION_R83__.inspect(),errors:[...errors]})`);
 check('Medical source effects and original combat ownership remain available',retained.medical.sourceHPGrowthUnchanged&&retained.pxf.sourceJSONPreserved&&retained.pxf.damageAndCooldownChanged===false&&retained.policy.combatChanged===false,retained.policy);
 check('Effect command replay leaves the native error ledger empty',retained.errors.length===0,retained.errors);
 out.atlasManifest=data.map(r=>({key:r.key,path:r.path,sha256:r.sha256,frameCount:r.frameCount,blend:r.blend}));out.metrics=retained.policy;out.new64.applied=!!h.context.__STORYWORLD_SELECTED_VFX_R83__;
})().catch(e=>{out.failure=e.stack;checks.push({name:'Exception',passed:false,detail:e.stack});console.error(e.stack);process.exitCode=1;}).finally(()=>{out.passed=checks.every(c=>c.passed);fs.writeFileSync(path.join(__dirname,'effect-results.json'),JSON.stringify(out,null,2)+'\n');console.log(checks.filter(c=>c.passed).length+'/'+checks.length);});
