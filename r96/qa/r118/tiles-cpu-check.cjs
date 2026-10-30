// R118 CPU check: Drive 2026-10-29 지도 표면(타일) 적용 — 자산 출처·해시, 지역 연결, 사몽 구역 키, 병원 제외, 도색 순서, 설정.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function webpSize(b){if(b.toString('latin1',0,4)!=='RIFF'||b.toString('latin1',8,12)!=='WEBP')return null;const t=b.toString('latin1',12,16);
 if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
 if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}
 if(t==='VP8X')return[(b.readUIntLE(24,3))+1,(b.readUIntLE(27,3))+1];return null;}

// ---- 자산 ---------------------------------------------------------------------------------------------
const dir=path.join(RT,'assets/r118/tiles'),idx=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
const looks=Object.entries(idx.looks);
check('17 looks (R120: +asphalt, sandblack, sandgold; R129: +cement14 wall for S-04 14F), one 2048x1024 WebP each, recorded sha/bytes, no hospital look',looks.length===17&&!idx.looks.hospital&&looks.every(([k,v])=>{const b=fs.readFileSync(path.join(dir,v.file));const sz=webpSize(b);return v.file===k+'.webp'&&sha(b)===v.sha256&&b.length===v.bytes&&sz&&sz[0]===2048&&sz[1]===1024;}));
check('every painted half has a decoded-RGB hash from a 1254² original and a Drive family',looks.every(([k,v])=>v.family&&(v.floor||v.wall)&&[v.floor,v.wall].filter(Boolean).every(h=>/^[0-9a-f]{64}$/.test(h.decodedRgbSha256)&&h.size.join('x')==='1254x1254')));
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.webp')).sort();
check('no stray image in the tiles folder',files.join()===looks.map(([k])=>k+'.webp').sort().join());

// ---- 모래상자 -------------------------------------------------------------------------------------------
const code=fs.readFileSync(path.join(SRC,'world-tiles-r118.js'),'utf8');
function sandbox(){
 const imgs=[],raf=[],sb={console,Math,JSON,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Error,Promise,Date,isFinite,calls:{spatial:0}};
 class Image{set src(v){this._src=v;imgs.push(this);}}
 const canvas=()=>({width:0,height:0,getContext:()=>({drawImage(){},imageSmoothingEnabled:false})});
 const T={CanvasTexture:class{constructor(c){this.image=c;this.userData={};}},SRGBColorSpace:'srgb',LinearMipmapLinearFilter:1,LinearFilter:2,RepeatWrapping:3};
 const mat=()=>({map:null,color:{hex:null,setHex(h){this.hex=h;}},needsUpdate:false});
 class Renderer{constructor(){this.T=T;this.stoneMaterial=mat();this.wallMaterial=mat();this.backgroundMaterial=mat();this.renderer={capabilities:{getMaxAnisotropy:()=>4}};this.spatialResources=new Set();}
  createSpatial(asset,art){sb.calls.spatial++;return{ok:true};}clearScene(){return 1;}}
 sb.window=sb;sb.Image=Image;sb.document={createElement:canvas,getElementById:()=>null};sb.localStorage={getItem:()=>null,setItem(){}};sb.requestAnimationFrame=f=>raf.push(f);
 sb.StoryPhase1={ThreeRenderer:Renderer};sb.imgs=imgs;sb.raf=raf;sb.Renderer=Renderer;
 const mk=(id,extra={})=>({id,layer:'STORY',exploration:{surface:{art:{path:'a-'+id+'.png',r55PhysicalUV:true}}},...extra});
 sb.mk=mk;sb.makeRoom=(id,o)=>mk(id,o);sb.enterRegion=async()=>true;sb.restoreSave=async()=>true;sb.showSettings=()=>{};sb.world={};sb.room=mk('dist00');
 vm.createContext(sb);vm.runInContext(code,sb,{filename:'world-tiles-r118.js'});return sb;}
const sb=sandbox(),X=sb.__STORYWORLD_TILES_R118__;
check('module loaded, regions table is the Drive canon mapping',!!X&&X.revision==='R118-tiles-1'&&['dist00','dist01','dist03','ep1b04','ep1b06','ep1b06b','ep1b09','kair07','last304'].every(k=>X.regions[k]),JSON.stringify(Object.keys(X?.regions||{})));
check('hospital core ep1a08 is not listed (its floor is the existing atlas)',!X.regions.ep1a08);
check('every table row names an existing look file',Object.values(X.regions).every(r=>idx.looks[r.file]));
check('table rows agree with the regions recorded in the asset index',Object.entries(idx.looks).every(([k,v])=>v.regions.every(id=>X.regions[id]?.file===k))&&Object.values(X.regions).length===Object.values(idx.looks).reduce((s,v)=>s+v.regions.length,0));
check('looks without a wall row paint no wall (garden, cave, castle, snow, meadow, school); vault paints wall only',['dist00','dist01','dist03','ep1b09','last304','sz115-S02-1'].every(k=>X.regions[k].floor!=null&&X.regions[k].wall==null)&&X.regions.ep1b06.floor==null&&X.regions.ep1b06.wall!=null);

const r1=sb.makeRoom('dist01');check('dist01 room is dressed with the cave look',r1.exploration.surface.art.r118Tiles?.file==='cave'&&r1.exploration.surface.art.path==='a-dist01.png');
const r2=sb.makeRoom('dist05');check('an unlisted region is untouched',!r2.exploration.surface.art.r118Tiles);
const r3=sb.makeRoom('ep1b04',{exploration:{surface:{art:{path:'x.png'}}}});check('a room without physical UVs is left alone',!r3.exploration.surface.art.r118Tiles);
const r4=sb.makeRoom('dist04',{samongR103:{ep:3},exploration:{type:'r103-samong',surface:{art:{path:'s.png',r55PhysicalUV:true}}}});
check('a samong room still on its host id (zone unknown) is not dressed',!r4.exploration.surface.art.r118Tiles);
r4.samongR115={zone:'sz115-S03-2'};sb.room=r4;const rn=new sb.Renderer();rn.createSpatial({}, r4.exploration.surface.art);
check('once the zone id is known the room gets the sparring look at spatial creation',r4.exploration.surface.art.r118Tiles?.file==='sparring'&&sb.imgs.some(i=>i._src==='assets/r118/tiles/sparring.webp'));
const r5=sb.makeRoom('ep1b06b',{samongR115:{zone:'sz115-S06-3'},samongR103:{ep:6},exploration:{type:'r103-samong',surface:{art:{path:'q.png',r55PhysicalUV:true}}}});
check('a samong zone that is not in the table does not inherit its host region look',!r5.exploration.surface.art.r118Tiles);
sb.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};const r6=sb.makeRoom('dist03');check('co-op: no tiles',!r6.exploration.surface.art.r118Tiles);delete sb.__STORYWORLD_COOP_SIM_R62__;

// 도색: 이미지가 도착하면 바닥·벽·배경에 맵을 얹고 색 곱을 정한다
function paintCase(id,opts={}){const s=sandbox(),room=s.makeRoom(id);s.room=room;const rn=new s.Renderer();if(opts.r99){room.exploration.surface.art.r99Ground={kind:'paving'};}
 const art=room.exploration.surface.art;if(opts.prefsOff)s.__STORYWORLD_TILES_R118__.set({tiles:false});
 rn.createSpatial({},art);const im=s.imgs.find(i=>/tiles\//.test(i._src));return{s,rn,im,art};}
let c=paintCase('ep1b04');check('kitchen: image requested once, nothing painted before it arrives',!!c.im&&c.rn.stoneMaterial.map==null);
c.im.onload();check('kitchen: floor on stone+background, wall on wall, colours set',!!c.rn.stoneMaterial.map&&c.rn.stoneMaterial.map===c.rn.backgroundMaterial.map&&!!c.rn.wallMaterial.map&&c.rn.stoneMaterial.color.hex===0xffffff&&c.rn.wallMaterial.color.hex===0xe8e8e8&&c.rn.r118TileLook==='kitchen');
c=paintCase('dist01');c.im.onload();check('cave: floor only, wall map untouched',!!c.rn.stoneMaterial.map&&c.rn.wallMaterial.map==null);
c=paintCase('ep1b06');c.im.onload();check('vault: wall only, floor untouched',c.rn.stoneMaterial.map==null&&!!c.rn.wallMaterial.map);
c=paintCase('ep1b04',{prefsOff:true});check('setting off: no image, no paint',!c.im&&c.rn.stoneMaterial.map==null);
c=paintCase('dist00',{r99:true});c.im.onload();check('R99 ground still painting: waits a frame, then applies after R99 finishes',c.rn.stoneMaterial.map==null&&c.s.raf.length===1);
c.rn.r99GroundKind='paving';c.s.raf.shift()();check('after R99 is done the tile look is the last word',!!c.rn.stoneMaterial.map&&c.rn.r118TileLook==='garden');
c=paintCase('dist00',{r99:true});c.im.onload();for(let i=0;i<260&&c.s.raf.length;i++)c.s.raf.shift()();check('R99 never finishes: gives up waiting after 240 frames and still paints',!!c.rn.stoneMaterial.map);
c=paintCase('dist01');c.rn.clearScene();check('clearScene forgets the painted look',c.rn.r118TileLook==null);
check('no runtime errors',X.inspect().stats.errors===0,X.inspect().lastError);

// ---- 연결 -----------------------------------------------------------------------------------------------
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8'),ver=fs.readFileSync(path.join(ROOT,'..','scripts','verify-r96-public.py'),'utf8'),yml=fs.readFileSync(path.join(ROOT,'..','.github/workflows/pages.yml'),'utf8');
const inputs=JSON.parse(fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8'));
check('runtime copy matches source and the script is the last tag in index.html',fs.readFileSync(path.join(RT,'world-tiles-r118.js'),'utf8')===code&&/world-tiles-r118\.js"><\/script>\s*$/.test(html));
check('public verify lists the script; all tile files are in runtime inputs',ver.includes("'world-tiles-r118.js'")&&files.concat(['index.json']).every(f=>inputs.textPaths.includes('assets/r118/tiles/'+f))&&inputs.textPaths.includes('world-tiles-r118.js'));
check('CI runs this check',yml.includes('node r96/qa/r118/tiles-cpu-check.cjs'));
console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);
