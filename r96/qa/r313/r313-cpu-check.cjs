// Independent R313 checks: no generated site, manifest edits, or network required.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(root,'client-source/hud-bgm-hwando-w-r313.js'),'utf8');
const stripSrc=fs.readFileSync(path.join(root,'client-source/skill-fx-r292.js'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'runtime-text/assets/audio/bgm/classical/catalog.json')));
const table=JSON.parse(fs.readFileSync(path.join(root,'runtime-text/assets/r292/fx/index.json')));
const mapIndex=JSON.parse(fs.readFileSync(path.join(root,'runtime-text/assets/r308/bgm/index.json')));
let checks=0;function check(name,f){f();checks++;console.log('PASS '+name);}
async function harness(overlay=true,early=false){
 let decoded=true,mobile=false,spriteOn=true;const calls=[],paint=[];
 const state={prefs:{on:true},active:{id:'moonlight',paused:false,volume:.5,readyState:4,muted:false,ended:false},blocked:false,failed:[]};
 const c={console,Promise,Map,Set,WeakSet,Object,Math,JSON,Number,Date,performance:{now:()=>1000},
  localStorage:{getItem:()=>null,setItem(){}},document:{hidden:false,getElementById:()=>null,addEventListener(){}},
  fetch:async p=>({ok:true,json:async()=>p.includes('catalog')?catalog:p.includes('/r308/')?mapIndex:table}),
  settings:{music:true,bgm:.8,lowFx:false},player:{hero:'hwando',x:2,y:3},effects:[],time:0,TILE:32,zoom:1,
  readyImage:p=>({image:{src:'https://local/'+p.replace('/r292/','/r302/')}}),ensureImages:()=>Promise.resolve(),
  project:(x,y)=>({x:x*32,y:y*16}),actorHeight:()=>60,drawEffect:e=>calls.push(['effect',e]),tick(){},updateHUD(){},musicTick(){},
  ctx:{save(){},restore(){},translate(){},rotate(){},scale(){},drawImage:(im,...a)=>calls.push([im.src,...a]),scope:(o,f)=>f()},
  __STORYWORLD_BGM_CLASSICAL_R195__:{inspect:()=>state},
  __STORYWORLD_MOBILE_PERF_R298__:{inspect:()=>({mobile})},
  __STORYWORLD_FX_SPRITES_R106__:{on:()=>spriteOn,warm(){},ready:()=>decoded,draw:(...a)=>paint.push(a)}
 };
 c.window=c;vm.createContext(c);if(early)vm.runInContext(src,c);vm.runInContext(stripSrc,c,{filename:'skill-fx-r292.js'});
 if(overlay&&!early)vm.runInContext(src,c,{filename:'hud-bgm-hwando-w-r313.js'});
 await new Promise(resolve=>setImmediate(resolve));c.tick(.01);
 const api=c.__STORYWORLD_SKILL_FX_R292__,hud=c.__STORYWORLD_HUD_BGM_HWANDO_R313__;
 function play(h='hwando',action='w'){return api.play(h,action,{x:2,y:3,angle:.7});}
 function draw(t){c.time=t;calls.length=paint.length=0;c.drawEffect({type:'r292-skill-fx'});return {calls,paint};}
 return {c,api,hud,state,calls,paint,play,draw,setDecoded:v=>decoded=v,setMobile:v=>mobile=v,setOn:v=>spriteOn=v};
}
async function cpu(){
 const b=await harness(false),h=await harness();b.play();h.play();
 const early=await harness(true,true);early.play();early.draw(.55);check('registered R313-before-R292 order installs late render hook',()=>assert.equal(early.paint.filter(p=>p[0]==='blade').length,3));
 check('catalog metadata localization, no performer or filename',()=>assert.equal(h.hud.currentText(),'♪ 베토벤 · 월광 소나타 · 1악장'));
 check('actual active track wins over pending selection',()=>{h.state.selected={id:'winter'};assert.match(h.hud.currentText(),/베토벤/);h.state.active.id='winter';assert.equal(h.hud.currentText(),'♪ 비발디 · 사계 겨울 · 1악장');});
 for(const [name,off,on] of [
  ['music switch',()=>h.c.settings.music=false,()=>h.c.settings.music=true],
  ['zero volume',()=>h.c.settings.bgm=0,()=>h.c.settings.bgm=.8],
  ['paused deck',()=>h.state.active.paused=true,()=>h.state.active.paused=false],
  ['silent deck',()=>h.state.active.volume=0,()=>h.state.active.volume=.5],
  ['autoplay blocked',()=>h.state.blocked=true,()=>h.state.blocked=false],
  ['hidden tab',()=>h.c.document.hidden=true,()=>h.c.document.hidden=false],
  ['classical disabled',()=>h.state.prefs.on=false,()=>h.state.prefs.on=true],
  ['missing metadata',()=>h.state.active.id='missing.mp3',()=>h.state.active.id='winter'],
  ['failed track',()=>h.state.failed=['winter'],()=>h.state.failed=[]]
 ])check('hide: '+name,()=>{off();assert.equal(h.hud.currentText(),'');on();assert.ok(h.hud.currentText());});
 check('every current catalog track has a Korean credit label',()=>{for(const id of Object.keys(catalog.tracks)){h.state.active.id=id;assert.match(h.hud.currentText(),/^♪ [가-힣]/);}});
 check('all initial ring frames preserve original draw arguments',()=>{for(let fr=0;fr<8;fr++){b.draw(fr*.06+.001);h.draw(fr*.06+.001);assert.deepEqual(h.calls,b.calls);assert.equal(h.paint.length,0);}});
 check('only split frames replaced; three blades with finite tapered trails',()=>{for(const age of [.481,.54,.599]){h.draw(age);assert.equal(h.calls.length,0);assert.equal(h.paint.filter(p=>p[0]==='blade').length,3);assert.equal(h.paint.filter(p=>p[0]==='slashline').length,15);for(const p of h.paint){assert.ok(p.slice(2,6).every(Number.isFinite));assert.deepEqual(Array.from(p[1].a),[214,222,234]);assert.deepEqual(Array.from(p[1].b),[255,198,72]);assert.ok(p[6].alpha>0&&p[6].alpha<=1);}}});
 check('mobile halves trails while retaining all three blades',()=>{h.setMobile(true);h.draw(.55);assert.equal(h.paint.length,12);assert.equal(h.paint.filter(p=>p[0]==='blade').length,3);h.setMobile(false);h.c.settings.lowFx=true;h.draw(.55);assert.equal(h.paint.length,12);h.c.settings.lowFx=false;});
 check('undecoded or disabled sprite fallback preserves original tail',()=>{b.draw(.55);h.setDecoded(false);h.draw(.55);assert.deepEqual(h.calls,b.calls);assert.equal(h.paint.length,0);h.setDecoded(true);h.setOn(false);h.draw(.55);assert.deepEqual(h.calls,b.calls);h.setOn(true);});
 check('rendering never mutates gameplay or the R292 live effect',()=>{const before=JSON.stringify({player:h.c.player,effects:h.c.effects});h.draw(.55);assert.equal(JSON.stringify({player:h.c.player,effects:h.c.effects}),before);assert.equal(h.api.inspect().active.length,1);});
 check('unrelated image and effects are forwarded unchanged',()=>{h.calls.length=0;h.c.ctx.drawImage({src:'https://local/assets/r302/fx/hwando/e.webp'},3072,0,384,384,-192,-192,384,384);assert.equal(h.calls.length,1);h.c.drawEffect({type:'unrelated'});assert.equal(h.calls[1][0],'effect');});
 check('R292 two-per-action cap and expiry unchanged',()=>{h.c.time=0;h.play();h.play();assert.equal(h.api.inspect().active.length,2);h.draw(.55);assert.equal(h.paint.filter(p=>p[0]==='blade').length,6);h.draw(.601);assert.equal(h.paint.length,0);h.c.tick(.1);assert.equal(h.api.inspect().active.length,0);});
 check('idempotent installation',()=>{const d=h.c.drawEffect;vm.runInContext(src,h.c);assert.equal(h.c.drawEffect,d);assert.equal(h.hud.inspect().stats.errors,0);});
 console.log(`R313 CPU: ${checks} checks passed`);
}
async function mapEngine(){
 const h=await harness(),c=h.c,decks=[];let now=2000,delayed=false;
 class Audio{
  constructor(){this.currentTime=0;this.duration=200;this.paused=true;this.muted=false;this.ended=false;this.events={};decks.push(this);}
  set src(v){this.url=v;this.currentTime=0;this.readyState=delayed?0:4;}
  play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}
  addEventListener(k,f){(this.events[k]||=[]).push(f);}
 }
 Object.assign(c,{Audio,started:true,zone:'dist00',room:{},addEventListener(){}});c.performance.now=()=>now;
 vm.runInContext(fs.readFileSync(path.join(root,'client-source/bgm-map-r308.js'),'utf8'),c);
 await new Promise(r=>setImmediate(r));const tick=ms=>{now+=ms;c.musicTick();};tick(100);
 const first=h.hud.currentText();check('real R308 starts audible metadata',()=>assert.ok(first));
 delayed=true;c.zone='dist06';tick(100);
 check('real R308 buffering retains outgoing audible title',()=>{assert.equal(h.hud.currentText(),first);assert.equal(c.__STORYWORLD_BGM_MAP_R308__.inspect().decks.filter(d=>d.readyState===0).length,1);});
 c.document.hidden=true;tick(100);check('R308 hidden tab hides title',()=>assert.equal(h.hud.currentText(),''));
 c.document.hidden=false;tick(100);check('R308 buffering return labels audible outgoing deck',()=>assert.equal(h.hud.currentText(),first));
 c.settings.music=false;tick(100);check('R308 mute hides title',()=>assert.equal(h.hud.currentText(),''));
 c.settings.music=true;tick(100);check('R308 unmute during buffering restores outgoing title',()=>assert.equal(h.hud.currentText(),first));
 for(const d of decks)d.readyState=4;tick(100);tick(1500);
 check('R308 crossfade switches label to louder incoming deck',()=>{assert.ok(h.hud.currentText());assert.notEqual(h.hud.currentText(),first);});
 tick(3000);for(const d of decks)d.muted=true;check('R308 media element mute hides title',()=>assert.equal(h.hud.currentText(),''));
 for(const d of decks)d.muted=false;
 const snapshot=c.__STORYWORLD_BGM_MAP_R308__.inspect();
 c.__STORYWORLD_BGM_MAP_R308__={inspect:()=>snapshot};
 check('all R308 credit titles localized (R340: 28 with Tchaikovsky)',()=>{for(const id of Object.keys(mapIndex.tracks)){snapshot.decks=[{id,readyState:4,paused:false,muted:false,ended:false,volume:.5}];assert.match(h.hud.currentText(),/^♪ [가-힣]/);}});
}
async function browser(){
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const index=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');
 const css=index.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1],header=index.match(/<header>[\s\S]*?<\/header>/)[0];
 await page.setContent('<style>'+css+'</style>'+header);
 await page.evaluate(()=>{const nav=document.querySelector('.topnav');for(const text of ['코드','황금실 제작','황금실 연속']){const b=document.createElement('button');b.textContent=text;nav.prepend(b);}});
 await page.evaluate(({catalog})=>{
  window.testCatalog=catalog;window.fetch=async()=>({ok:true,json:async()=>window.testCatalog});window.settings={music:true,bgm:.8};
  window.state={prefs:{on:true},active:{id:'moonlight',paused:false,volume:.5,readyState:4,muted:false,ended:false},failed:[]};
  window.__STORYWORLD_BGM_CLASSICAL_R195__={inspect:()=>window.state};
  window.updateHUD=()=>{};window.musicTick=()=>{};
 },{catalog});
 await page.addScriptTag({content:src});
 const refresh=()=>page.evaluate(()=>window.__STORYWORLD_HUD_BGM_HWANDO_R313__.update());
 await refresh();await page.waitForTimeout(220);await refresh();
 assert.match(await page.locator('#r313Bgm').textContent(),/베토벤/);
 await page.evaluate(()=>{window.state.active.id='winter';window.musicTick();});
 assert.match(await page.locator('#r313Bgm').textContent(),/베토벤/);
 await page.waitForTimeout(220);await refresh();assert.match(await page.locator('#r313Bgm').textContent(),/비발디/);
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:800});
  await page.evaluate(()=>{document.getElementById('regionName').textContent='마수궁 피난 거점';window.testCatalog.tracks.long={composer:'아주 긴 작곡가 이름',title:'아주 긴 곡 이름 '.repeat(30)};window.state.active.id='long';});
  await refresh();await page.waitForTimeout(220);await refresh();
  const box=await page.evaluate(()=>{const n=document.getElementById('regionName'),l=document.getElementById('r313Bgm'),r=document.getElementById('r313RegionLine'),tag=document.getElementById('layerTag');const rect=e=>{const x=e.getBoundingClientRect();return {left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width};};return {n:rect(n),l:rect(l),r:rect(r),tag:rect(tag),scroll:l.scrollWidth,client:l.clientWidth,overflow:getComputedStyle(l).textOverflow};});
  assert.ok(box.n.right<=box.l.left,JSON.stringify({width,box}));if(width>780)assert.ok(box.l.right<=box.tag.left,JSON.stringify({width,box}));else assert.ok(box.n.bottom<=box.tag.top+.1);
  assert.ok(box.l.right<=box.r.right+.1);assert.equal(box.overflow,'ellipsis');assert.ok(box.scroll>box.client);assert.ok(box.n.width>40);assert.ok(box.l.width>8,JSON.stringify({width,box}));
  console.log('PASS real Chromium HUD coordinates / ellipsis at '+width+'px');
 }
 await page.evaluate(()=>{window.settings.music=false;window.musicTick();});assert.equal(await page.locator('#r313Bgm').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('R313 browser fixture: switch fade, hide, four viewport coordinates passed (not gameplay/device validation)');
 }finally{await browser.close();}
}
(async()=>{await cpu();await mapEngine();if(process.argv.includes('--browser'))await browser();})().catch(e=>{console.error(e);process.exitCode=1;});
