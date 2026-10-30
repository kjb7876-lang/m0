// R106 CPU check: effect textures (assets/r106/fx) match the table in fx-sprites-r106.js, the hero overlays
// route their old shape primitives through the textures with the shapes kept as fallback, and every hero
// has a D2 Survivors-style cast.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),R=p=>path.join(root,p);
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const dir=R('r96/runtime-text/assets/r106/fx'),meta=JSON.parse(fs.readFileSync(path.join(dir,'meta.json'),'utf8')).sprites;
const webpSize=b=>{// RIFF WEBP: VP8L lossless header
 if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}
 if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;};
const bad=[];for(const[name,m]of Object.entries(meta)){const b=fs.readFileSync(path.join(dir,name+'.webp')),sz=webpSize(b);if(!sz||sz[0]!==m.w||sz[1]!==m.h)bad.push(name+' '+sz);if(crypto.createHash('sha256').update(b).digest('hex')!==m.sha256)bad.push(name+' sha');}
check('26 R106 textures (+R139 runecross) exist with the recorded size and hash',Object.keys(meta).length===27&&!bad.length,bad.join(' | '));
const lib=fs.readFileSync(R('r96/client-source/fx-sprites-r106.js'),'utf8'),table=JSON.parse(lib.match(/const META=Object\.freeze\((\{.*?\})\);/)[1]);
const diff=Object.entries(meta).filter(([k,m])=>!table[k]||table[k][0]!==m.w||table[k][1]!==m.h||Math.abs(table[k][2][0]-m.pivot[0])>1e-3||Math.abs(table[k][2][1]-m.pivot[1])>1e-3||table[k][3]!==m.frames).map(([k])=>k);
// R107: the table also carries the painted wing views and iai slash shapes from assets/r107/fx (their own meta.json).
const meta7=JSON.parse(fs.readFileSync(R('r96/runtime-text/assets/r107/fx/meta.json'),'utf8')).sprites;
for(const[name,m]of Object.entries(meta7)){const b=fs.readFileSync(R('r96/runtime-text/assets/r107/fx/'+name+'.webp'));if(crypto.createHash('sha256').update(b).digest('hex')!==m.sha256)diff.push(name+' sha');const t=table[name];if(!t||t[0]!==m.w||t[1]!==m.h||Math.abs(t[2][0]-m.pivot[0])>1e-3||Math.abs(t[2][1]-m.pivot[1])>1e-3)diff.push(name);}
check('runtime table matches texture metadata',!diff.length&&Object.keys(table).length===Object.keys(meta).length+Object.keys(meta7).length,diff.join(','));
// library: tinting through a lookup, immutable static-tint canvases, graceful miss
const calls=[];const ctx2d={save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(...a){calls.push(a);},set globalAlpha(v){},get globalAlpha(){return 1;},globalCompositeOperation:'source-over'};
const img={naturalWidth:4,naturalHeight:4,width:4,height:4};let canvases=0;
const doc={createElement(){canvases++;const px=new Uint8ClampedArray(64).fill(128);return{width:0,height:0,getContext(){return{drawImage(){},getImageData(){return{data:px};},putImageData(){}};}};}};
const w={};const sb=vm.createContext({window:w,document:doc,localStorage:{getItem(){return null;},setItem(){}},ctx:ctx2d,time:0,settings:{},readyImage:p=>p.endsWith('glow.webp')?{image:img}:null,imageCache:new Map(),addImage(){},Math,Number,Object,Map,Set,Uint8ClampedArray,String,Array});
vm.runInContext(lib,sb);const S=w.__STORYWORLD_FX_SPRITES_R106__;
const F={a:[255,0,0],b:[0,0,255]};
check('missing texture → false (caller keeps the old shape)',S.draw('wing',F,0,0,10,10)===false);
check('ready texture → tinted static canvas drawn',S.draw('glow',F,0,0,10,10)===true&&calls.length===1&&calls[0][0].__storyworldStaticTint?.immutable===true&&/^r106fx:glow:/.test(calls[0][0].__storyworldStaticTint.path));
check('non-finite coordinates are skipped without drawing',S.draw('glow',F,NaN,0,10,10)===true&&calls.length===1);
check('colour strings parse for the primitive wrappers',JSON.stringify(S.parseColour('rgba(1,2,3,.5)'))==='{"c":[1,2,3],"a":0.5}'&&S.parseColour('#fff')===null);
// overlays: every renamed primitive has a texture-first wrapper and keeps its shape fallback
const r102=fs.readFileSync(R('r96/client-source/hero-fx-r102.js'),'utf8'),r101=fs.readFileSync(R('r96/client-source/polish-r101.js'),'utf8');
const wrapped=(src,names)=>names.filter(k=>!(src.includes('function '+k+'0(')&&new RegExp('function '+k+'\\(').test(src)&&src.includes(k+'0(')));
const m102=wrapped(r102,['disc','glow','ring','streak','polyline','crescent','sparks','pillar','diamond','lightning','circuit','clockRing','crossGlyph','rays','wingFlash','runeCircle','triBeam','petal','smoke','cracks','trailSquares','squaresBurst','squareRing']);
check('R102 skill primitives draw textures first, shapes as fallback',!m102.length,m102.join(','));
const m101=wrapped(r101,['groundGlow','flames','wings','halo','orbs','blades','arcs','runeRing','pillar','field']);
check('R101 wings, halo and aura draw textures first, shapes as fallback',!m101.length,m101.join(','));
// D2S casts: one per hero, every archetype has a drawer
const d2s=fs.readFileSync(R('r96/client-source/fx-d2s-r106.js'),'utf8'),arch=JSON.parse(d2s.match(/const ARCH=Object\.freeze\((\{.*?\})\);/)[1].replace(/(\w+):/g,'"$1":').replace(/'/g,'"'));
const heroes=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
check('each of the 8 heroes has its own D2S cast',heroes.every(h=>arch[h])&&new Set(Object.values(arch)).size===8,JSON.stringify(arch));
check('every archetype has a drawer',Object.values(arch).every(k=>new RegExp('\\n '+k+'\\(e,u,h').test(d2s)));
check('D2S overlay is presentation only (no damage or hazards)',!/hitEnemy\(|hazards\.push|\.hp\s*-=|damage\s*:/.test(d2s));
const html=fs.readFileSync(R('r96/runtime-text/index.html'),'utf8'),i1=html.indexOf('hero-fx-r102.js'),i2=html.indexOf('fx-d2s-r106.js'),i3=html.indexOf('fx-sprites-r106.js');
check('scripts are loaded (D2S after R102)',i1>0&&i2>i1&&i3>0);
console.log(JSON.stringify({checks:n,failed}));process.exitCode=failed?1:0;
