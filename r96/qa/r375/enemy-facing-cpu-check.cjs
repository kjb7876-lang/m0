'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const SRC=path.resolve(__dirname,'../../client-source'),results=[];
function check(name,f){try{f();results.push({name,ok:true});console.log('PASS '+name);}catch(e){results.push({name,ok:false,error:String(e)});console.error('FAIL '+name+' '+e);}}
const load=(s,f)=>vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),s,{filename:f});
function rig(){const s={console,Math,Number,Object,WeakMap,Map,Set,Promise,performance:{now:()=>0},time:1,
 player:{x:3,y:0},localStorage:{getItem:()=>null},document:{addEventListener(){}},setTimeout(){},
 __STORYWORLD_ENEMY_MOTION_R51__:{__r208:true,flip:(e,f,fallback)=>f?.flip??fallback},
 __STORYWORLD_STORY_COMBAT_R54__:{clock:e=>e.clock||null},
 __STORYWORLD_STORY_MOBS_R208__:{assign:e=>({facing:e.authored||'right'})}};
 s.window=s;vm.createContext(s);load(s,'enemy-facing-r375.js');return s;}
const enemy=extra=>({id:'test',x:0,y:0,hp:10,...extra});
check('committed melee beats player crossing in all eight sectors',()=>{const s=rig(),F=s.__STORYWORLD_ENEMY_MOTION_R51__;for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)-Math.sin(a);if(Math.abs(x)<.05)continue;const e=enemy({attack:{angle:a,elapsed:.2}});s.player={x:-Math.cos(a)*4,y:-Math.sin(a)*4};assert.equal(F.flip(e,{r208Mob:'m',flip:x>0}),x<0);}});
check('R200 right-authored shade honours melee/recovery angle',()=>{const s=rig(),e=enemy({attack:{angle:Math.PI,elapsed:.9}});assert.equal(s.__STORYWORLD_ENEMY_MOTION_R51__.flip(e,{r200Shade:'s',flip:false}),true);});
check('left-authored R223 frame mirrors exactly once',()=>{const s=rig(),e=enemy({authored:'left',attack:{angle:0,elapsed:.2}});assert.equal(s.__STORYWORLD_ENEMY_MOTION_R51__.flip(e,{r208Mob:'m',flip:false}),true);});
check('R54 ranged contact/recovery keeps its angle after windup ends',()=>{const s=rig(),e=enemy({rangedWindup:0,clock:{kind:'ranged',angle:Math.PI,phase:'recovery'}});assert.equal(s.__STORYWORLD_ENEMY_FACING_R375__.uniqueFace(e,1),-1);});
check('native rangedAim fallback only while windup is active',()=>{const s=rig(),e=enemy({rangedWindup:.3,rangedAim:Math.PI});assert.equal(s.__STORYWORLD_ENEMY_FACING_R375__.uniqueFace(e,1),-1);e.rangedWindup=0;assert.equal(s.__STORYWORLD_ENEMY_FACING_R375__.uniqueFace(e,1),1);});
check('vertical deadband retains last displayed side',()=>{const s=rig(),M=s.__STORYWORLD_ENEMY_FACING_R375__,e=enemy();s.player={x:-4,y:0};assert.equal(M.uniqueFace(e,1),-1);s.player={x:4,y:4.01};assert.equal(M.uniqueFace(e,1),-1);});
check('first observation in deadband retains initial fallback',()=>{const s=rig(),M=s.__STORYWORLD_ENEMY_FACING_R375__,e=enemy({attack:{angle:Math.PI/4,elapsed:.2}});assert.equal(M.uniqueFace(e,-1),-1);assert.equal(M.uniqueFace(e,1),-1);});
check('temporary drawing attack cannot override committed R54 ranged clock',()=>{const s=rig(),e=enemy({attack:{angle:0,elapsed:0,storyWorldPose5:true},clock:{angle:Math.PI}});assert.equal(s.__STORYWORLD_ENEMY_FACING_R375__.angleFor(e),Math.PI);});
check('audited R109 left-authored strip follows committed ray',()=>{const s=rig();s.__STORYWORLD_MOBS_R109__={authoredFacing:()=> 'left'};const e=enemy({attack:{angle:0,elapsed:.2}});assert.equal(s.__STORYWORLD_ENEMY_MOTION_R51__.flip(e,{flip:false}),true);});
check('idle long-distance R248 actor faces player, not prior movement',()=>{const s=rig();s.player={x:-40,y:0};assert.equal(s.__STORYWORLD_ENEMY_FACING_R375__.uniqueFace(enemy(),1),-1);});
check('R53, R54, Balrog and Persona effective frames delegated unchanged',()=>{const s=rig(),F=s.__STORYWORLD_ENEMY_MOTION_R51__,e=enemy({boss:true});for(const f of [{r53HospitalPose:true,flip:true},{r54StoryPose:true,flip:false},{assetFrame:{bakedFacing:'eight-way'},flip:true},{assetFrame:{bakedFacing:'left'},flip:false}])assert.equal(F.flip(e,f),f.flip);});
check('death and stationary bodies keep original facing',()=>{const s=rig(),M=s.__STORYWORLD_ENEMY_FACING_R375__;for(const e of [enemy({hp:0}),enemy({r170Tower:true}),enemy({r251Circle:true})])assert.equal(M.uniqueFace(e,-1),-1);});
check('installer preserves R208 markers and is idempotent',()=>{const s=rig(),old=s.__STORYWORLD_ENEMY_MOTION_R51__;assert.equal(old.__r208,true);s.__STORYWORLD_ENEMY_FACING_R375__.install();assert.equal(s.__STORYWORLD_ENEMY_MOTION_R51__,old);});
check('resolver does not mutate attacks, patterns, enemy or saved fields',()=>{const s=rig(),e=enemy({attack:{angle:Math.PI,elapsed:.2,origin154:{x:0,y:0}},shots:[-.3,0,.3]});const before=JSON.stringify(e);s.__STORYWORLD_ENEMY_FACING_R375__.uniqueFace(e,1);assert.equal(JSON.stringify(e),before);});
check('disabled overlay exactly delegates previous flip',()=>{const s=rig(),e=enemy({attack:{angle:Math.PI,elapsed:.2}});s.__STORYWORLD_ENEMY_FACING_R375__.set(false);assert.equal(s.__STORYWORLD_ENEMY_MOTION_R51__.flip(e,{r208Mob:'m',flip:false}),false);});
// Exercise the actual R248 direct draw route and verify that canvas scope/scale
// and source pixels are preserved. This route never calls R51.flip.
check('actual R248 direct draw uses locked ranged side and restores context',()=>{
 const s=rig(),draws=[],stack=[];
 const c={globalAlpha:1,filter:'none',sx:1,save(){stack.push({globalAlpha:this.globalAlpha,filter:this.filter,sx:this.sx});},restore(){Object.assign(this,stack.pop());},translate(){},scale(x){this.sx*=x;},drawImage(im,...args){draws.push({sx:this.sx,args});}};
 Object.assign(s,{ctx:c,layer:'STORY',drawEnemy(){},project:()=>({x:0,y:0}),actorHeight:()=>60,readyImage:()=>({image:{src:'sprite.png'}}),
 __STORYWORLD_MOB_UNIQUE_R248_DATA__:{byName:{test:'s'},sheets:{s:{file:'sprite.png',kind:'human',body:200}},dir:''}});
 load(s,'mob-unique-r248.js');const e=enemy({name:'test',clock:{angle:Math.PI,phase:'recovery'}});s.drawEnemy(e);
 assert.equal(draws.length,1);assert(draws[0].sx<0);assert.equal(c.sx,1);assert.equal(c.filter,'none');assert.equal(c.globalAlpha,1);assert.equal(stack.length,0);
});
console.log(JSON.stringify({passed:results.filter(r=>r.ok).length,total:results.length}));if(results.some(r=>!r.ok))process.exitCode=1;
