import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const html=fs.readFileSync('_pages/docs/index.html','utf8');
const old=fs.readFileSync('scripts/r74-dances.cpu.test.mjs','utf8');
const helpers={fs,vm,assert,html,console};
vm.createContext(helpers);
vm.runInContext(old.slice(old.indexOf('function script('),old.indexOf("test('legacy")),helpers);
function fixture(){return helpers.fixture();}

test('R76 runtime scripts parse and expose separately bounded golden and silver storage',()=>{
 for(const id of ['golden-core-r72','thread-dances-r74','golden-thread-r72'])new vm.Script(helpers.script(id));
 const x=fixture(),api=x.window.__STORYWORLD_DANCES_R74__;
 assert.equal(api.stats('gold').slots,3);
 assert.equal(api.stats('silver').slots,7);
 assert.equal(api.stats('gold').equip,1);
});

test('golden slots grow from three to twelve at one point each and do not change simultaneous equip',()=>{
 const x=fixture(),api=x.window.__STORYWORLD_DANCES_R74__,p=x.player,stroke=[[{x:-1,y:0},{x:1,y:0}]];
 for(let i=0;i<3;i++)assert.equal(api.command('gold',p,{op:'save',name:'gold-'+i,strokes:stroke}).ok,true);
 assert.equal(api.command('gold',p,{op:'save',name:'overflow',strokes:stroke}).ok,false);
 assert.equal(api.command('gold',p,{op:'clone',id:api.state('gold').designs[0].id}).ok,false);
 assert.equal(api.command('gold',p,{op:'learn'}).ok,true);
 const afterLearn=p.points;
 for(let i=1;i<=9;i++){
  assert.equal(api.command('gold',p,{op:'upgrade',key:'slots'}).ok,true);
  assert.equal(api.stats('gold').slots,3+i);
  assert.equal(api.stats('gold').equip,1);
 }
 assert.equal(p.points,afterLearn-9);
 assert.equal(api.command('gold',p,{op:'upgrade',key:'slots'}).ok,false);
 assert.equal(p.points,afterLearn-9);
 const state=api.state('gold');
 while(state.designs.length<12)assert.equal(api.command('gold',p,{op:'clone',id:state.designs[0].id}).ok,true);
 assert.equal(state.designs.length,12);
 assert.equal(api.command('gold',p,{op:'save',id:state.designs[0].id,name:'edited',strokes:stroke}).ok,true);
 assert.equal(api.command('gold',p,{op:'save',name:'full',strokes:stroke}).ok,false);
 assert.equal(api.command('gold',p,{op:'clone',id:state.designs[0].id}).ok,false);
 assert.equal(api.command('gold',p,{op:'upgrade',key:'equip'}).ok,true);
 assert.equal(api.stats('gold').slots,12);
 assert.equal(api.stats('gold').equip,3);
});

test('silver retains seven fixed slots and cannot purchase the golden storage rank',()=>{
 const x=fixture(),api=x.window.__STORYWORLD_DANCES_R74__,p=x.player,stroke=[[{x:-1,y:0},{x:1,y:0}]];
 for(let i=0;i<7;i++)assert.equal(api.command('silver',p,{op:'save',name:'silver-'+i,strokes:stroke}).ok,true);
 assert.equal(api.command('silver',p,{op:'save',name:'overflow',strokes:stroke}).ok,false);
 api.state('silver').learned=true;
 const points=p.points;
 assert.equal(api.command('silver',p,{op:'upgrade',key:'slots'}).ok,false);
 assert.equal(api.stats('silver').slots,7);
 assert.equal(p.points,points);
});

test('an R74 seven-design save migrates once, retains every drawing and restores archived designs as new slots are bought',async()=>{
 const x=fixture(),api=x.window.__STORYWORLD_DANCES_R74__,C=x.StoryGoldenCoreR72;
 const old={version:2,learned:true,designs:Array.from({length:7},(_,i)=>({id:'saved-'+i,name:'saved '+i,strokes:C.normalize([[{x:-1,y:0},{x:1,y:0}]])})),archive:[],equipped:['saved-1'],ranks:{cooldown:0,damage:'0',size:0,speed:0,slots:0,equip:1},readyIn:5,readyByDesign:{'saved-1':3},autoUse:false};
 x.player.goldenR72=old;
 const state=api.state('gold');
 assert.equal(state.slotCapacityVersion,1);
 assert.equal(api.stats('gold').slots,3);
 assert.equal(state.designs.length,3);
 assert.equal(state.archive.length,4);
 assert.deepEqual(JSON.parse(JSON.stringify([...state.designs,...state.archive].map(d=>d.id))),old.designs.map(d=>d.id));
 assert.equal(api.command('gold',x.player,{op:'upgrade',key:'slots'}).ok,true);
 assert.equal(api.state('gold').designs.length,4);
 assert.equal(api.state('gold').archive.length,3);
 const saved=x.serializeSave();
 assert.equal(saved.goldenR72.slotCapacityVersion,1);
 assert.equal(saved.goldenR72.designs.length,4);
 assert.equal(saved.goldenR72.archive.length,3);
 await x.restoreSave(saved);
 assert.equal(api.stats('gold').slots,4);
 assert.equal(api.state('gold').designs.length,4);
 assert.equal(api.state('gold').archive.length,3);
 assert.equal(api.state('gold').readyByDesign['saved-1'],3);
});

test('old version-one slot ranks remain active without issuing duplicate slot-point refunds',()=>{
 const x=fixture(),C=x.StoryGoldenCoreR72;
 const old={version:1,learned:true,ranks:{slots:9,speed:10,equip:1,damage:10},designs:Array.from({length:12},(_,i)=>({id:'legacy-'+i,name:'legacy '+i,strokes:C.normalize([[{x:-1,y:0},{x:1,y:0}]])})),equipped:['legacy-10','legacy-11']};
 const state=C.sanitize(old);
 assert.equal(C.stats(state).slots,12);
 assert.equal(state.designs.length,12);
 assert.equal(state.archive.length,0);
 assert.equal(state.legacyCredit,3);
 assert.equal(state.ranks.slots,9);
});
