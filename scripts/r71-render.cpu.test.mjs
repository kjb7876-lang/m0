import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const root=path.resolve('_r70/docs');
const renderer=fs.readFileSync(path.join(root,'dist/phase1.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const transformSource=`import importlib.util,sys\nspec=importlib.util.spec_from_file_location('render_r71','scripts/render-r71.py')\nm=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\nsys.stdout.write(m.transform(sys.stdin.read()))`;
const transformHtml=`import importlib.util,sys\nspec=importlib.util.spec_from_file_location('render_r71','scripts/render-r71.py')\nm=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\nsys.stdout.write(m.transform_html(sys.stdin.read()))`;
const transformed=execFileSync('python3',['-c',transformSource],{input:renderer,encoding:'utf8',maxBuffer:16*1024*1024});
const transformedHtml=execFileSync('python3',['-c',transformHtml],{input:html,encoding:'utf8',maxBuffer:16*1024*1024});

function load(source){
 const context={window:{},console,URL,URLSearchParams,performance,structuredClone,Float32Array};
 vm.createContext(context);vm.runInContext(source,context);
 return context.window.StoryPhase1;
}
const API=load(transformed);
const plain=value=>JSON.parse(JSON.stringify(value));
function rgb(hex){return[0,2,4].map(i=>parseInt(hex.slice(1+i,3+i),16));}
function luminance(value){
 const c=rgb(value).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function extractFunction(source,signature){
 const start=source.indexOf(signature);assert.ok(start>=0,`missing ${signature}`);
 const nextFunction=source.indexOf('\nfunction ',start+signature.length),nextClass=source.indexOf('\nclass ',start+signature.length);
 const end=[nextFunction,nextClass].filter(x=>x>=0).sort((a,b)=>a-b)[0]??source.length;
 return source.slice(start,end);
}
class FakeColor{
 constructor(hex){this.hex=hex;}
 setHex(hex){this.hex=hex;return this;}
 getHexString(){return this.hex.toString(16).padStart(6,'0');}
}
function material(hex,emissive=false){return{color:new FakeColor(hex),...(emissive?{emissive:new FakeColor(hex)}:{}),geometry:{untouched:true}};}

test('regional palette material roles create visible floor, wall, cap, edge and background separation',()=>{
 const terrains=plain(API.REGIONAL_TERRAIN_ART),themes=[...new Set(Object.values(terrains).map(v=>v.theme))].sort();
 assert.deepEqual(themes,['cathedral','cave','city','forest','hospital','hotel','machine','ruin','swamp','time']);
 const floors=new Set(),backgrounds=new Set();
 for(const theme of themes){
  const p=API.mapPaletteR71(theme),color=k=>'#'+p[k].toString(16).padStart(6,'0');
  floors.add(color('floor'));backgrounds.add(color('background'));
  assert.ok(luminance(color('floor'))>luminance(color('wall'))+.15,`${theme}: floor must read lighter than wall`);
  assert.ok(contrast(color('floor'),color('wall'))>=1.6,`${theme}: floor/wall contrast`);
  assert.ok(contrast(color('floor'),color('background'))>=1.8,`${theme}: floor/background contrast`);
  assert.ok(luminance(color('cap'))>luminance(color('wall'))+.08,`${theme}: wall cap must read lighter than face`);
  assert.ok(luminance(color('edge'))<luminance(color('wall'))-.025,`${theme}: wall edge must read darker than face`);
  assert.ok(luminance(color('background'))<luminance(color('wall'))-.01,`${theme}: background must remain darker than wall`);
  const channels=rgb(color('background')),spread=Math.max(...channels)-Math.min(...channels);
  assert.ok(spread<75,`${theme}: background tint remains desaturated`);
  assert.equal(new Set(['floor','wall','cap','edge','background'].map(color)).size,5,`${theme}: role tints stay distinct`);
 }
 const fallback=API.mapPaletteR71('unknown'),fallbackColor=k=>'#'+fallback[k].toString(16).padStart(6,'0');
 assert.ok(luminance(fallbackColor('background'))<luminance(fallbackColor('wall'))-.01,'fallback background remains darker than the wall');
 assert.ok(contrast(fallbackColor('floor'),fallbackColor('background'))>=1.8,'fallback floor/background contrast');
 assert.ok(floors.size>=8,'themes retain distinct floor palettes');
 assert.ok(backgrounds.size>=8,'themes retain distinct background palettes');
});

test('material application preserves mesh/material/geometry identity and keeps flashlight diagnostics',()=>{
 const refs={stone:material(0xffffff),wall:material(0xffffff),background:material(0xffffff),cap:material(0xffffff),edge:material(0xffffff),hospitalFloor:material(0xffffff,true),hospitalFloorBlood:material(0xffffff,true),hospitalWall:material(0xffffff),ward:material(0xffffff)};
 const scene={stoneMaterial:refs.stone,wallMaterial:refs.wall,backgroundMaterial:refs.background,wallCapMaterial61:refs.cap,regionalTrimMaterial55:refs.edge,visualFloorMaterial:refs.hospitalFloor,visualFloorMaterials:[refs.hospitalFloor,refs.hospitalFloorBlood],hospitalWallMaterial:refs.hospitalWall,visualWardMaterial:refs.ward};
 const geometryRefs=Object.fromEntries(Object.entries(refs).map(([k,v])=>[k,v.geometry]));
 const palette=API.mapPaletteR71('hospital'),diagnostic=API.applyMapReadabilityR71(scene,{theme:'hospital',path:'assets/maps/ep1a09.webp'});
 assert.equal(scene.stoneMaterial,refs.stone);assert.equal(scene.wallMaterial,refs.wall);assert.equal(scene.backgroundMaterial,refs.background);
 assert.deepEqual(Object.fromEntries(Object.entries(refs).map(([k,v])=>[k,v.geometry])),geometryRefs);
 assert.equal(refs.stone.color.hex,palette.floor);assert.equal(refs.wall.color.hex,palette.wall);assert.equal(refs.background.color.hex,palette.background);
 assert.equal(refs.cap.color.hex,palette.cap);assert.equal(refs.edge.color.hex,palette.edge);
 assert.equal(refs.hospitalFloor.color.hex,palette.floor);assert.equal(refs.hospitalFloor.emissive.hex,palette.floor);
 assert.equal(refs.hospitalFloorBlood.emissive.hex,palette.floor);assert.equal(refs.hospitalWall.color.hex,palette.wall);assert.equal(refs.ward.color.hex,palette.background);
 assert.equal(diagnostic.theme,'hospital');assert.equal(diagnostic.materialsOnly,true);assert.equal(diagnostic.threeOnly,true);assert.equal(diagnostic.legacyFallbackPaletteApplied,false);assert.equal(diagnostic.geometryChanged,false);assert.equal(diagnostic.assetsChanged,false);assert.equal(diagnostic.flashlightMaskPreserved,true);assert.equal(diagnostic.pixelVerified,false);assert.equal(diagnostic.GPUVerified,false);
 assert.ok(diagnostic.contrast.floorToWall>=1.6);assert.ok(diagnostic.contrast.floorToBackground>=1.8);
});

test('regional wall/floor, hospital doors and wall geometry builders remain byte-identical',()=>{
 for(const signature of ['function terrainTiles(regions,art){','function terrainWallMeshData(w,art){','function hospitalFloorGeometry(T,regions){','function hospitalWallGeometry(T,w,visualHeight=w.height){','function hospitalDoorDetailsGeometry42(']){
  assert.equal(extractFunction(transformed,signature),extractFunction(renderer,signature),signature);
 }
 const hospitalSource='HOSPITAL_DOOR_SOURCE31';
 assert.equal(transformed.includes(hospitalSource),renderer.includes(hospitalSource));
 assert.equal(transformed.includes('projection33'),renderer.includes('projection33'));
 assert.ok(transformed.includes("geometryChanged:false,assetsChanged:false,flashlightMaskPreserved:true"));
});

test('HTML transformation only changes the renderer cache key',()=>{
 assert.equal(transformedHtml,html.replace('dist/phase1.js?r70=1','dist/phase1.js?r71=1'));
 assert.equal((transformedHtml.match(/dist\/phase1\.js\?r71=1/g)||[]).length,1);
});
