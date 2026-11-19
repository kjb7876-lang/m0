'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../client-source/mobile-memory-r980.js'),'utf8');
const hwando='assets/r1063/r283/hwando/r242/attack-n.webp';
const persona='assets/r1104b/persona-walk-front.webp';
const boss='assets/r760/boss/sheet-atkA.webp';
const storyBoss='assets/rc135/midboss-motions/sheets/mb-dist02.png';
const tell='assets/r1107/persona-red-star.webp';
function boot({step=2,controller=true,cap=8192,mobile=true}={}){
 let tick=0;
 class Image {
  constructor(src,w,h){this.src='https://game.test/m0/'+src;this.naturalWidth=w;this.naturalHeight=h;this.complete=true;}
 }
 class Context { drawImage(...args){this.last=args;} }
 class Scene {
  constructor(){this.textures=new Map();}
  texture(image){if(this.fail)throw Error('upload failed');const r=this.textures.get(image)||{refs:0,image};r.refs++;this.textures.set(image,r);return r;}
  release(image){const r=this.textures.get(image);assert.ok(r,'released backing must be live');if(--r.refs===0)this.textures.delete(image);}
 }
 const callbacks={},canvas={addEventListener:(k,fn)=>{callbacks[k]=fn;},removeEventListener:k=>delete callbacks[k]};
 const scene=new Scene(),gl={isContextLost:()=>false},three={commands:scene,metrics:{samples:[]},renderer:{capabilities:{maxTextureSize:cap},getContext:()=>gl,domElement:canvas}};
 const state={active:'three',three};
 const tier={crashGuard:false,cooldownLeft:0,slowFor:0,heap:null};
 const en={window:null,HTMLImageElement:Image,CanvasRenderingContext2D:Context,StoryPhase1:{CommandScene:Scene},
  __STORYWORLD_PHASE1__:controller?{controller:{state}}:undefined,
  __STORYWORLD_MOBILE_R63__:{isMobile:()=>mobile},__STORYWORLD_MOBILE_TIER_R1023__:{inspect:()=>tier},
  __STORYWORLD_PERF7_R1043__:{step:()=>step},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>tick},
  document:{readyState:'complete',createElement:()=>({getContext:()=>new Context()})},setInterval:()=>1,addEventListener(){},
  player:{hero:'hwando'},room:{id:'dist02'}};
 en.window=en;vm.runInNewContext(source,en);const api=en.__STORYWORLD_MOBILE_MEMORY_R980__,ctx=new Context();
 function draw(im){ctx.drawImage(im,0,0,256,128,1,2,50,60);return ctx.last;}
 return {en,api,scene,tier,three,callbacks,im:(...args)=>new Image(...args),draw,advance(ms){tick+=ms;api.check();}};
}
{
 const g=boot(),hero=g.im(hwando,4095,480),foe=g.im('assets/r281/bosses/mb-dist02-walk6.webp',2112,356),signal=g.im(tell,1152,768);
 for(const img of [hero,foe,signal]){
  assert.deepEqual(g.draw(img),[img,0,0,256,128,1,2,50,60]);
  assert.equal(g.scene.texture(img,false).image,img);assert.equal(g.api.usesHalfSource(img),false);
 }
 const ordinary=g.im('assets/maps/generated-v31217/a.webp',1280,720);
 assert.equal(g.api.usesHalfSource(ordinary),true);
 const draw=g.draw(ordinary);
 assert.deepEqual(draw.slice(1),[0,0,128,64,1,2,50,60]);
 assert.equal(g.scene.texture(ordinary,false).image,draw[0]);
 g.scene.release(ordinary);
 for(const img of [hero,foe,signal])g.scene.release(img);
 assert.equal(g.scene.textures.size,0);
}
{
 const g=boot(),img=g.im(storyBoss+'?v=150',2172,724);
 const other=g.im(storyBoss.replace('dist02','dist03'),2172,724);
 assert.notEqual(g.draw(other)[0],other,'preloaded off-zone boss stays half');
 g.three.metrics.samples=Array.from({length:12},()=>({milliseconds:40}));g.api.check();
 const half=g.scene.texture(img,false).image;
 assert.deepEqual([half.width,half.height],[1086,362],'active story midboss under pressure');
 g.three.metrics.samples=[];g.api.check();
 assert.equal(g.draw(img)[0],half,'an existing boss mesh keeps its source as headroom returns');
 g.scene.release(img);g.advance(16000);
 assert.equal(g.scene.texture(img,false).image,img,'select the full 2172×724 story midboss at headroom');
 assert.equal(g.draw(img)[0],img);assert.equal(g.api.inspect().priority.used.boss,2172*724);
 g.scene.release(img);g.en.room.id='dist03';g.api.check();
 assert.equal(g.draw(other)[0],other,'zone switch admits the newly active boss');
}
{
 const g=boot({step:3}),img=g.im(persona,4096,512),other=g.im('assets/r1104b/persona-walk-side.webp',4096,512);
 g.en.player={hero:'lauren',personaHeroR1113:true};g.en.room={id:'last303'};
 g.api.setHalfMin(2000000);g.api.check();
 assert.equal(g.draw(img)[0],img);g.scene.texture(img,false);
 assert.notEqual(g.draw(other)[0],other,'current hero reservation is bounded');
 const replacement=g.im(persona,4096,512);
 assert.notEqual(g.draw(replacement)[0],replacement,'same URL on another live image cannot duplicate its full allocation');
 const nativeBoss=g.im(boss,4096,512),smallTell=g.im(tell,1152,768);
 assert.equal(g.draw(nativeBoss)[0],nativeBoss);
 assert.equal(g.draw(smallTell)[0],smallTell,'already-native small image consumes no reservation');
 assert.deepEqual({...g.api.inspect().priority.used},{hero:2097152,boss:2097152,tell:0});
 g.advance(20000);
 assert.equal(g.api.inspect().priority.used.hero,2097152,'a retained original stays charged past the idle deadline');
 g.scene.release(img);g.advance(20000);
 assert.equal(g.draw(replacement)[0],replacement);
}
for(const args of [{step:1},{controller:false},{cap:2048},{mobile:false}]){
 const g=boot(args),img=g.im(hwando,4095,480);
 if(args.mobile===false){assert.equal(g.draw(img)[0],img);g.api.setTierHalf(true,true);}
 assert.notEqual(g.draw(img)[0],img);assert.equal(g.api.inspect().priority.pixels,0);
}
{
 const g=boot(),img=g.im(hwando,4095,480);
 g.three.metrics.samples=Array.from({length:12},()=>({milliseconds:40}));g.api.check();
 assert.notEqual(g.draw(img)[0],img,'manual preset also sheds quality under sustained renderer load');
 g.three.metrics.samples=[];g.api.check();
 assert.equal(g.draw(img)[0],img);
 g.callbacks.webglcontextlost();g.advance(10);
 assert.notEqual(g.draw(img)[0],img);
 g.callbacks.webglcontextrestored();
 assert.equal(g.draw(img)[0],img);
 g.tier.heap=.85;g.api.check();
 assert.notEqual(g.draw(img)[0],img);
 g.en.__STORYWORLD_PERF7_R1043__=undefined;g.tier.heap=null;g.api.check();
 assert.notEqual(g.draw(img)[0],img,'missing tier selector during load keeps baseline');
}
{
 const g=boot();
 for(const [src,w,h] of [[hwando,12288,512],[hwando,4096,1024],['assets/r1107/persona-dust.webp',1152,768],
  ['assets/r760/boss/sheet-atkA.webp',4096,512],['assets/r1104b/persona-walk-front.webp',4096,512]]){
  const i=g.im(src,w,h);assert.notEqual(g.draw(i)[0],i);assert.equal(g.api.inspect().priority.pixels,0);
 }
 const original=g.im('assets/map.webp',1280,720);g.scene.fail=true;assert.throws(()=>g.scene.texture(original,false));
 assert.equal(g.api.inspect().stats.halfRefOut,0);
}
console.log('PASS bounded original hero/boss/tell, crop and source identity, release/failed upload, renderer and tier fallbacks');
