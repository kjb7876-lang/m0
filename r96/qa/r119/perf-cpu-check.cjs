// R119 CPU check: effect merging (fx() filter only, no gameplay), off-screen mob culling with
// generous margins (bosses / attacking mobs always drawn), and the dimmed EGO flash / aura.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../../..'),R=p=>path.join(root,p);
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const src=fs.readFileSync(R('r96/client-source/perf-r119.js'),'utf8'),html=fs.readFileSync(R('r96/runtime-text/index.html'),'utf8');
check('runtime copy identical',fs.readFileSync(R('r96/runtime-text/perf-r119.js'),'utf8')===src);
check('loaded before audio-r98.js',/perf-r119\.js"><\/script>[\s\S]*audio-r98\.js"><\/script>/.test(html));
check('no gameplay writes',!/\.(hp|maxHp|damage|x|y|cd|attack)\s*[+\-*]?=[^=]/.test(src)&&!/player\.[a-zA-Z]+\s*=[^=]/.test(src));
const effects=[];let time=0,W=800,H=600;const pushed=[];
const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},effects,get time(){return time;},W,H,VFX:{heal:'heal.webp'},
 fx(type,x,y,opt={}){const e={type,x,y,age:0,life:.45,...opt};effects.push(e);pushed.push(e);},
 drawEnemy(e){sb.drawn.push(e.id);},draw(){for(const e of sb.window.__frameMobs||[])sb.drawEnemy(e);},drawn:[],project:(x,y)=>({x:(x-y)*34,y:(x+y)*17}),actorHeight:()=>60,innerWidth:800,innerHeight:600,
 Object,Math,Number,String,JSON,Map,Array};
vm.createContext(sb);vm.runInContext(src,sb);const P=sb.window.__STORYWORLD_PERF_R119__;
check('installs',!!P&&P.prefs().mergeFx===true&&P.prefs().cull===true);
for(let i=0;i<20;i++)sb.fx('burst',5+i*.01,5,{});check('20 bursts on one spot in one instant -> 1 kept',pushed.filter(e=>e.type==='burst').length===1,pushed.length);
for(let i=0;i<20;i++)sb.fx('burst',i*2,0,{});check('bursts on separate spots are capped at 10 alive',pushed.filter(e=>e.type==='burst').length===10);
time=1;for(let i=0;i<5;i++)sb.fx('sigil',0,0,{asset:'heal.webp'});check('heal sigil at most one per .35 s',pushed.filter(e=>e.type==='sigil').length===1);
sb.fx('text',3,3,{text:'12',color:'#fff'});sb.fx('text',3.1,3,{text:'30',color:'#fff'});const tx=pushed.filter(e=>e.type==='text');check('damage numbers on one spot merge and add up',tx.length===1&&tx[0].text==='42');
sb.fx('text',3,3,{text:'처치',color:'#fff'});check('non-number texts are never merged',pushed.filter(e=>e.type==='text').length===2);
sb.fx('enemyBurnDeath',1,1,{});check('other effect types pass untouched',pushed.some(e=>e.type==='enemyBurnDeath'));
P.set({mergeFx:false});const k=pushed.length;for(let i=0;i<5;i++)sb.fx('burst',9,9,{});check('switch off -> everything passes',pushed.length===k+5);
// culling
sb.drawEnemy({id:'direct',x:200,y:-200,hp:5});check('direct drawEnemy outside a frame is never culled',sb.drawn[0]==='direct');sb.drawn.length=0;
sb.draw=sb.draw;sb.window.__frameMobs=[{id:'far',x:200,y:-200,hp:5},{id:'near',x:5,y:5,hp:5},{id:'boss',x:200,y:-200,hp:5,boss:true},{id:'atk',x:200,y:-200,hp:5,attack:{}}];sb.draw();
check('off-screen ordinary mob skipped; on-screen, boss and attacking mob drawn',JSON.stringify(sb.drawn)==='["near","boss","atk"]',JSON.stringify(sb.drawn));
const eden=fs.readFileSync(R('r96/client-source/fx-eden-r108.js'),'utf8'),r111=fs.readFileSync(R('r96/client-source/play-r111.js'),'utf8');
check('EGO awakening ring/flash dimmed (no full-body whiteout)',eden.includes('sz=h*(4.2+1.6*smooth(u)),al=.75*')&&eden.includes("h*(1.7+.7*v),{alpha:.42*"));
check('EGO aura layers dimmed',r111.includes("{frame:fr+2,alpha:.36});// 안쪽 밝은 불꽃")&&r111.includes("{frame:fr,alpha:.55});// 바깥 불꽃"));
const vis=fs.readFileSync(R('r96/client-source/visual-r119.js'),'utf8');
check('visual-r119 runtime copy identical and loaded',fs.readFileSync(R('r96/runtime-text/visual-r119.js'),'utf8')===vis&&/visual-r119\.js"><\/script>[\s\S]*audio-r98\.js"><\/script>/.test(html));
{const w={},P={updateGlows(){return 'base';},wallRows:null};const sb2={window:{StoryPhase1:{ThreeRenderer:{prototype:P}}},localStorage:{getItem(){return null;},setItem(){}},Math,JSON,String,Object};vm.createContext(sb2);vm.runInContext(vis,sb2);const V=sb2.window.__STORYWORLD_VISUAL_R119__;
 const m={opacity:1};const self={wallRows:new Map([['a',{mesh:{userData:{occlusion54:{alpha:.42,materials:[m],baseOpacity:[1]}}}}],['b',{mesh:{userData:{occlusion54:{alpha:1,materials:[{opacity:1}],baseOpacity:[1]}}}}]])};const r=P.updateGlows.call(self);
 check('walls the native pass faded to 42% end at 22%, unfaded walls untouched, base call kept',r==='base'&&Math.abs(m.opacity-.22)<1e-6&&self.wallRows.get('b').mesh.userData.occlusion54.materials[0].opacity===1&&V.remap(1)===1);}
{const crypto=require('crypto'),b=fs.readFileSync(R('r96/runtime-text/assets/r119/heroes/gunner-n.webp'));const w=b.readUInt32LE?1:0;
 check('gunner north art: new 512 webp present, original kept, swapped only through urlFor',b.toString('ascii',0,4)==='RIFF'&&fs.existsSync(R('r96/hospital-three-pc/site/assets/hero_direction337/gunner/n.webp'))&&vis.includes("'assets/hero_direction337/gunner/n.webp':'assets/r119/heroes/gunner-n.webp'"));
 const cache=new Map([['assets/hero_direction337/gunner/n.webp',{ready:true,image:{id:'orig'}}],['assets/x.webp',{ready:true,image:{id:'x'}}]]);let made=null;
 const sb3={window:{StoryPhase1:{ThreeRenderer:{prototype:{updateGlows(){}}}}},localStorage:{getItem(){return null;},setItem(){}},imageCache:cache,readyImage:p=>cache.get(String(p).replace(/^\.\//,''))||null,urlFor:p=>'BASE/'+p,cleanPath:p=>String(p).replace(/^\.\//,''),Image:function(){made=this;},Map,Math,JSON,String,Object};vm.createContext(sb3);vm.runInContext(vis,sb3);
 const r1=sb3.readyImage('./assets/hero_direction337/gunner/n.webp');check('first read returns the original row and starts loading the new art',r1.image.id==='orig'&&made&&made.src==='BASE/assets/r119/heroes/gunner-n.webp');
 made.onload();check('after the new art loads the same cache row shows it; other images untouched',cache.get('assets/hero_direction337/gunner/n.webp').image===made&&sb3.readyImage('assets/x.webp').image.id==='x');}
console.log((failed?'FAIL ':'PASS ')+(n-failed)+'/'+n+' r119 perf checks');process.exit(failed?1:0);
