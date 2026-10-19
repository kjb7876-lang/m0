import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
const html=fs.readFileSync('_pages/docs/index.html','utf8'),context={};vm.createContext(context);vm.runInContext(fs.readFileSync('client-source/interaction-core-r74.js','utf8'),context);const C=context.StoryInteractionCoreR74;
test('touch coordinates agree with logical projection in portrait, landscape, and CSS-scaled canvases',()=>{
 for(const [width,height,scale]of [[390,844,1],[844,390,1],[1365,850,.5],[390,844,2]]){const rect={left:13,top:17,width:width*scale,height:height*scale},p=C.screenPoint(rect.left+rect.width*.4,rect.top+rect.height*.7,rect,width,height);assert.equal(p.x,width*.4);assert.equal(p.y,height*.7);const target={point:{x:12,y:15}};assert.equal(C.hit(target,p,()=>({x:p.x,y:p.y+15}),.5),true);assert.equal(C.hit(target,{x:p.x+100,y:p.y},()=>p,.5),false);}
 assert.equal(C.screenPoint(0,0,{width:0,height:1},1,1),null);
});
test('native portal priority, reach, and wall admission remain authoritative',()=>{
 const rows=C.targets({x:1,y:0},[{visible:true,direction:'e',role:'next',open:true,point:{x:1.5,y:0}}]);
 assert.equal(C.nearest(rows,{x:0,y:0},()=>true).kind,'portal');assert.equal(C.nearest(rows,{x:0,y:0},(_p,t)=>t.kind!=='portal').kind,'objective');assert.equal(C.nearest(rows,{x:20,y:0},()=>true),null);assert.equal(C.nearest(rows,{x:0,y:0},()=>false),null);
 const invalid=C.targets({x:Infinity,y:0},[{visible:true,point:{x:1000,y:0}}],[{kind:'unknown',point:{x:0,y:0}}]);assert.equal(invalid.length,0);
});
test('touch approach walks a bounded safe route and refuses walls instead of moving the actor',()=>{
 const actor={x:0,y:0},target={kind:'objective',point:{x:8,y:0},reach:2.6};let checks=0;
 const denied=C.approach(actor,target,()=>false,()=>{checks++;return[{x:4,y:0},{x:7,y:0}];},(p,t)=>!(p.x<4&&t.point.x>=4));assert.equal(denied,null);assert.ok(checks<=12);assert.deepEqual(actor,{x:0,y:0});
 const accepted=C.approach(actor,target,()=>false,(_p,q)=>[{x:3,y:0},q],()=>true);assert.equal(accepted.arrived,false);assert.ok(accepted.path.length===2);assert.ok(Math.hypot(accepted.goal.x-target.point.x,accepted.goal.y-target.point.y)<target.reach);assert.deepEqual(actor,{x:0,y:0});
 const bad=C.approach(actor,target,p=>p.x===3,()=>[{x:3,y:0}],()=>true);assert.equal(bad,null);
});
test('coarse mobile desktop UA receives mobile light defaults while Windows touch retains desktop intent',()=>{
 const script=html.match(/<script id="presentation-settings-r58">([\s\S]*?)<\/script>/)[1],line=script.split('\n').find(l=>l.includes('const ua=navigator.userAgent'));
 for(const [ua,touch,coarse,mobile]of [['Android Mobile',1,true,true],['X11; Linux x86_64',1,true,true],['X11; Linux x86_64',0,false,false],['Windows NT',5,true,false],['Macintosh',5,true,true]]){const ctx={navigator:{userAgent:ua,maxTouchPoints:touch},matchMedia:()=>({matches:coarse})};vm.createContext(ctx);const data=vm.runInContext(line+';({mobileDevice,desktopTouch})',ctx);assert.equal(data.mobileDevice,mobile,ua);}
});
test('compiled R74 parses, follows the full R73 lifecycle, and preserves original media and admits only checked imagegen atlases',()=>{
 assert.ok(html.includes('R74-MOBILE-WORLD'));assert.ok(html.includes('src="./dist/phase1.js?r74=1"'));assert.ok(!html.includes('src="./dist/phase1.js?r73=1"'));let parsed=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/type=["']application\/json/.test(m[1]))continue;new vm.Script(m[2]);parsed++;}assert.ok(parsed>75);assert.ok(html.indexOf('<script id="mobile-r74">')>html.indexOf('<script id="save-slots-r73">'));assert.ok(html.includes('await ensureImages([...def.paths,...(window.__STORYWORLD_WORLD_R74__?.assetPaths(id,options.layer||layer)||[])'));assert.ok(html.includes('const keep=new Set([...regionById[zone].paths,...(window.__STORYWORLD_WORLD_R74__?.assetPaths(zone,layer)||[])'));
 const sha=b=>createHash('sha256').update(b).digest('hex'),renderer=fs.readFileSync('_pages/docs/dist/phase1.js','utf8');new vm.Script(renderer);assert.ok(renderer.includes('baseExplorationLayoutR74'));assert.ok(renderer.includes('worldLayoutR74'));
 const baseline=JSON.parse(fs.readFileSync('docs/web-manifest-r62.json')),candidate=JSON.parse(fs.readFileSync('_pages/docs/web-manifest-r62.json')),art=JSON.parse(fs.readFileSync('client-source/art-r74.json'));assert.equal(candidate.files.length,baseline.files.length+Object.keys(art.atlases).length);const old=new Map(baseline.files.map(r=>[r.path,r.sha256])),added=new Map(Object.values(art.atlases).map(r=>[r.path,r]));for(const row of candidate.files)if(!['index.html','dist/phase1.js'].includes(row.path)){if(old.has(row.path))assert.equal(row.sha256,old.get(row.path),row.path);else{assert.ok(added.has(row.path));assert.equal(row.sha256,added.get(row.path).sha256);assert.equal(sha(fs.readFileSync('_pages/docs/'+row.path)),row.sha256);}}
});
