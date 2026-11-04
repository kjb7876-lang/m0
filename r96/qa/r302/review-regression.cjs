'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../../client-source/hero-palette-r302.js'),'utf8');
function engine(setup=()=>{}){
 const calls=[],g={console,performance:{now:()=>1000},localStorage:{getItem:()=>null,setItem(){}},document:{},player:{hero:'neon',x:0,y:0},effects:[],time:1};
 g.window=g;g.tick=()=>{};g.basicAttack=()=>{};g.special=()=>{g.player.specialCD=1;};
 g.fx=(type,x,y,o)=>g.effects.push({type,x,y,...o});
 g.__STORYWORLD_PIXELFX_R163__={has:()=>true,play:(name,x,y,o)=>{calls.push({name,...o});return{};},frameAt:(name,u,x,y,o)=>{calls.push({name,...o});}};
 g.__STORYWORLD_SKILL_FX_R292__={inspect:()=>({active:[{key:'neon:special'}]})};
 g.__STORYWORLD_HERO_FX_R102__={PALETTE:{neon:{a:[22,100,40],b:[170,255,190]}}};
 const spriteCalls=[];const pal=(a,b)=>a?.a?a:{a:Array.from(a),b:Array.from(b||a)};
 g.__STORYWORLD_FX_SPRITES_R106__={parseColour:()=>[255,255,255],pal,on:()=>true,draw:(n,F)=>{spriteCalls.push(pal(F));return true;},along:(n,F)=>{spriteCalls.push(pal(F));return true;}};
 g.room={enemies:[1,2,3].map(x=>({x,y:0,hp:10}))};
 vm.createContext(g);setup(g);vm.runInContext(src,g,{filename:'/x/hero-palette-r302.js'});
 return {g,calls,spriteCalls,run:(code,file='mobs-tune-r116')=>vm.runInContext(code,g,{filename:'/x/'+file+'.js'})};
}
let failed=0,passed=0;
function check(name,fn){try{fn();console.log('PASS '+name);passed++;}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}}
check('real R178 neon special replaces existing tint and limits flash alpha/frequency',()=>{
 const E=engine();E.run(fs.readFileSync(require('path').join(__dirname,'../../client-source/effects-r178.js'),'utf8'),'effects-r178');E.g.special();
 assert.equal(E.calls[0].name,'pvfx-electric-impact');assert.deepEqual(Array.from(E.calls[0].tint.a),[62,230,193]);assert.equal(E.calls[0].alpha,.45);assert.equal(E.calls[0].k,.7);assert.equal(E.calls.length,2);
});
check('chargeStart sigil and enemy effects stay identical immediately after hero attack',()=>{
 const E=engine();E.g.basicAttack();
 E.run("function chargeStart(){fx('sigil',1,2,{asset:'assets/vfx/mark.png',color:'#f00',alpha:.8,life:1.3});} chargeStart();");
 E.g.effects.push({type:'burst',enemy:true,sourceHero:'neon',color:'#f00',alpha:.8,life:1.3});
 const before=JSON.stringify(E.g.effects);E.g.tick();assert.equal(JSON.stringify(E.g.effects),before);
});
check('explicit enemy overrides hero fields, asset and hero caller for fx and pixelfx',()=>{
 const E=engine();E.run("fx('burst',0,0,{enemy:true,sourceHero:'neon',alpha:.8,life:1.3}); __STORYWORLD_PIXELFX_R163__.play('hit',0,0,{enemy:true,sourceHero:'neon',alpha:.8,life:1.3});",'fx-boost-r225');
 E.g.effects.push({type:'e568HeroImpact',enemy:true,asset:'assets/vfx/heroes/test.png',alpha:.8,life:1.3});const before=JSON.stringify(E.g.effects);E.g.tick();
 assert.ok(E.g.effects.every(e=>!e.r302));assert.equal(JSON.stringify(E.g.effects),before);assert.equal(E.calls[0].alpha,.8);assert.ok(!E.calls[0].tint);
});
check('explicit hero ownership works without action timing; anonymous effects stay untouched',()=>{
 const E=engine();for(const own of [{sourceHero:'neon'},{owner:'hero'},{source:E.g.player},{hero:'neon'}])E.g.effects.push({type:'sigil',...own});
 E.g.effects.push({type:'burst',alpha:.8,life:1.3});E.g.tick();assert.ok(E.g.effects.slice(0,4).every(e=>e.r302==='neon'));assert.ok(!E.g.effects[4].r302);
});
check('R225 pre-tinted frameAt is recoloured and enemy R178 tower keeps its tint',()=>{
 const E=engine();E.run("__STORYWORLD_PIXELFX_R163__.frameAt('impact',.3,0,0,{tint:{a:[1,2,3],b:[4,5,6]},alpha:.8,k:2});",'fx-boost-r225');
 assert.deepEqual(Array.from(E.calls[0].tint.a),[62,230,193]);assert.ok(Math.abs(E.calls[0].alpha-.36)<1e-9);assert.equal(E.calls[0].k,1.4);
 E.g.killEnemy=e=>{e.hp=0;};E.run(fs.readFileSync(require('path').join(__dirname,'../../client-source/effects-r178.js'),'utf8'),'effects-r178');
 E.run("function special(){killEnemy({r170Tower:true,hp:10,x:0,y:0});} special();",'combat-r160');assert.deepEqual(Array.from(E.calls[1].tint.a),[100,6,16]);assert.ok(!E.calls[1].r302Flash);
});
check('real R111 neon silver thread uses mint/silver; other R111 calls stay unchanged',()=>{
 const E=engine(g=>{
  g.setTimeout=()=>0;g.drawHero=()=>{};g.drawEffect=()=>{};g.project=(x,y)=>({x,y});g.actorHeight=()=>60;g.ctx={save(){},restore(){}};
  vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../../client-source/play-r111.js'),'utf8'),g,{filename:'/x/play-r111.js'});
 });
 assert.ok(E.g.__STORYWORLD_PLAY_R111__);
 for(const motif of ['cross','flower','fractal','claw','tsubamegaeshi','decisive']){
  E.spriteCalls.length=0;
  E.g.drawEffect({type:'threadSlashR63',x:1,y:1,age:.1,life:.42,threadR63:{from:{x:0,y:0},to:{x:1,y:1},seed:1,motif,r174Mark:true}});
  assert.ok(E.spriteCalls.length>0);
  for(const F of E.spriteCalls)assert.deepEqual([Array.from(F.a),Array.from(F.b)],[[62,230,193],[226,232,242]]);
 }
 E.spriteCalls.length=0;
 E.run("__STORYWORLD_FX_SPRITES_R106__.draw('boss',{a:[214,222,234],b:[255,255,255]},0,0);",'play-r111');
 assert.deepEqual(Array.from(E.spriteCalls[0].a),[214,222,234]);
 assert.equal(E.g.__STORYWORLD_PLAY_R111__.inspect().stats.errors,0,E.g.__STORYWORLD_PLAY_R111__.inspect().lastError);
});
check('caller cache separates unclassified, hero, gold-thread and enemy in either order',()=>{
 for(const order of [['play-r111','fx-d2s-r106'],['fx-d2s-r106','play-r111']]){
  const E=engine();
  for(const file of order){E.run("__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[52,236,176],b:[210,255,230]},0,0);",file);
   assert.deepEqual(Array.from(E.spriteCalls.at(-1).a),file==='fx-d2s-r106'?[62,230,193]:[52,236,176]);}
  for(const file of ['fx-d2s-r106','hero-threads-r174','mobs-tune-r116']){
   E.run("__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[120,80,18],b:[255,236,170]},0,0);",file);
   const F=E.spriteCalls.at(-1);
   assert.deepEqual(Array.from(F.b),file==='fx-d2s-r106'?[226,232,242]:file==='hero-threads-r174'?[255,198,72]:[255,236,170]);
  }
 }
});
if(failed)throw Error(`R302 review regressions: ${failed} failed, ${passed} passed`);
console.log(`R302 review regressions: ${passed} passed`);
