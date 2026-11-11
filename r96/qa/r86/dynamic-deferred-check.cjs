'use strict';
const fs=require('fs'),{createHarness}=require('../harness.cjs');
const checks=[],check=(name,passed,detail)=>{checks.push({name,passed:!!passed,detail});if(!passed)throw Error(name);};
(async()=>{const h=createHarness({timeoutMs:90000}),html=fs.readFileSync(h.site+'/index.html','utf8'),scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/g)].map(m=>m[1]);
check('Delivered page loads no supplied dynamic sampler catalog adapter or SVG',!scripts.some(s=>/dynamic-vfx-r84|refined-r85\/dynamic|\.svg(?:\?|$)/.test(s)),scripts.filter(s=>/dynamic|refined/.test(s)));
check('Supplied runtime is not initialized before gameplay',!h.context.StoryVFX&&!h.context.STORY_VFX_CATALOG&&!h.context.__STORYWORLD_DYNAMIC_VFX_R84__);
await h.boot();await h.start();h.run('for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;');
check('Native boot and hospital start work with the supplied dynamic module absent',h.run("booted&&started&&zone==='ep1a08'&&room.exploration.hospitalDoorsB3.length===3"));
const rows=[];for(const id of ['ep1a08','dist02','cult04']){h.context.deferredZone=id;h.run("zone=deferredZone;layer='STORY';room=getRoom(zone,layer);modal=false;loading=false;storyScene=null;player.hp=maxHP();player.x=room.exploration.entry.x;player.y=room.exploration.entry.y;cameraTick(0);effects=[];hazards=[];projectiles=[];");
rows.push(h.run(`(()=>{const data=__STORYWORLD_PHASE1__.captureVisual();return{zone,count:data.length,newDynamic:data.some(c=>c.owner?.r84Id||c.owner?.r84Role||String(c.owner?.id).startsWith('vfx-r84:')),finite:data.every(c=>(c.points||[]).flat().every(Number.isFinite))};})()`));}
check('Hospital spider cave and finale frames contain no new procedural package commands',rows.every(r=>r.count>0&&!r.newDynamic&&r.finite),rows);
check('Static64 PNG component adapter remains available without dynamic timelines',!!h.context.__STORYWORLD_SELECTED_VFX_R83__&&h.context.__STORYWORLD_SELECTED_VFX_R83__.inspect().dynamic64Driven===false);
check('Existing native combat skills and medical effects remain installed',h.run("typeof drawEffect==='function'&&typeof basicAttack==='function'&&!!__STORYWORLD_HOSPITAL_WOUNDS_R53__"));
const m=JSON.parse(fs.readFileSync(h.site+'/web-manifest-r62.json'));check('Current manifest records the user-requested dynamic deferral',m.r86.suppliedDynamicPackageEnabled===false&&m.r86.dynamic80RecipesGameLoaded===false&&m.r86.selectedStaticPNGsEnabled===true);
check('Disabling the package creates no native game errors',h.run('errors.length')===0,h.run('errors'));
})().catch(e=>{checks.push({name:'Exception',passed:false,detail:e.stack});process.exitCode=1;}).finally(()=>{fs.writeFileSync(__dirname+'/dynamic-deferred-results.json',JSON.stringify({checks,passed:checks.every(c=>c.passed),browserVerified:false,GPUVerified:false},null,2));console.log(checks.filter(c=>c.passed).length+'/'+checks.length);});
