'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../../client-source/hero-palette-r302.js'),'utf8');
function engine(){
 const calls=[],g={console,performance:{now:()=>1000},localStorage:{getItem:()=>null,setItem(){}},document:{},player:{hero:'neon',x:0,y:0},effects:[],time:1};
 g.window=g;g.tick=()=>{};g.basicAttack=()=>{};g.special=()=>{g.player.specialCD=1;};
 g.fx=(type,x,y,o)=>g.effects.push({type,x,y,...o});
 g.__STORYWORLD_PIXELFX_R163__={has:()=>true,play:(name,x,y,o)=>{calls.push({name,...o});return{};},frameAt:(name,u,x,y,o)=>{calls.push({name,...o});}};
 g.__STORYWORLD_SKILL_FX_R292__={inspect:()=>({active:[{key:'neon:special'}]})};
 g.__STORYWORLD_HERO_FX_R102__={PALETTE:{neon:{a:[22,100,40],b:[170,255,190]}}};
 g.__STORYWORLD_FX_SPRITES_R106__={parseColour:()=>[255,255,255]};
 g.room={enemies:[1,2,3].map(x=>({x,y:0,hp:10}))};
 vm.createContext(g);vm.runInContext(src,g,{filename:'/x/hero-palette-r302.js'});
 return {g,calls,run:(code,file='mobs-tune-r116')=>vm.runInContext(code,g,{filename:'/x/'+file+'.js'})};
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
if(failed)throw Error(`R302 review regressions: ${failed} failed, ${passed} passed`);
console.log(`R302 review regressions: ${passed} passed`);
