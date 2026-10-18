import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const c={window:{},console,URL,performance,Float32Array};vm.createContext(c);vm.runInContext(fs.readFileSync('_pages/docs/dist/phase1.js','utf8'),c);const A=c.window.StoryPhase1;
test('seeded ward additions preserve every old floor centre, native structure and story anchor with bounded generation',()=>{
 let added=0;
 const rendererBounds=128;assert.equal(A.WORLD_COORD_LIMIT_R73,rendererBounds);
 for(const[id,art]of Object.entries(A.REGIONAL_TERRAIN_ART)){
  const old=A.explorationLayout(id,art.theme,false,{}),fresh=A.explorationLayout(id,art.theme,false,{seedR73:123456});
  assert.ok(fresh.bounds.every(v=>Number.isFinite(v)&&Math.abs(v)<=rendererBounds),id+' canonical collision bounds must fit the bounded renderer');
  if(id==='ep1a08'){assert.deepEqual(fresh,old);assert.equal(A.explorationBlocked(fresh,-11,34,.31),false,'the hospital floor point remains walkable');continue;}
  const keys=new Set(fresh.floorCells.map(p=>p.join(':')));for(const[x,y]of old.floorCells){assert.ok(keys.has(x+':'+y),id+' original floor');if(!A.explorationBlocked(old,x+.5,y+.5,.29))assert.equal(A.explorationBlocked(fresh,x+.5,y+.5,.29),false,id+' original walkable centre');}
  for(const key of ['entry','nodes','sourceExits','originalEncounterBounds','bounds'])assert.deepEqual(fresh[key],old[key],id+' '+key);
  assert.deepEqual(fresh.walls.filter(w=>!w.annex),old.walls.filter(w=>!w.annex));
  assert.ok(fresh.mazeR73.attempts<=24);assert.ok(fresh.mazeR73.addedCells<=96);assert.ok(fresh.mazeR73.newWalls<=18);if(fresh.mazeR73.addedCells)added++;
 }
 assert.ok(added>=50,'new ward rooms must be admitted across the campaign, not silently fall back everywhere');
});
test('same seeds are deterministic, different seeds vary rooms, and legacy/safe/hospital layouts retain their original geometry',()=>{
 for(const id of ['dist00','ep1b09','cult04']){const art=A.REGIONAL_TERRAIN_ART[id],one=A.explorationLayout(id,art.theme,false,{seedR73:1}),same=A.explorationLayout(id,art.theme,false,{seedR73:1}),two=A.explorationLayout(id,art.theme,false,{seedR73:2});assert.deepEqual(one,same);assert.notDeepEqual(one.floorCells,two.floorCells);const old=A.explorationLayout(id,art.theme,false,{});assert.equal(A.mazeRoomsR73(old,0,id),old);}
 assert.deepEqual(A.explorationLayout('hub','forest',true,{seedR73:123}),A.explorationLayout('hub','forest',true,{}));
});
function state(){let nonce=11,role='off';const x={window:{},crypto:{getRandomValues:a=>{a[0]=nonce++;return a;}},Uint32Array,regionById:{hub:{safe:true},dist00:{},dist01:{},ep1b09:{},ep1a08:{}},layer:'STORY',zone:'hub',started:true,player:{hp:777},world:{},serializeSave:()=>({zone:'hub',layer:'STORY',rooms:{'STORY:dist00':{}},visited:['STORY:dist01'],progress:{STORY:{dist01:true},DREAM:{}}}),restoreSave:async raw=>{if(raw.bad)throw Error('native validation');},newGame:async()=>{x.player={hp:777};x.world={};return true;}};x.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>role};vm.createContext(x);vm.runInContext(fs.readFileSync('client-source/maze-state-r73.js','utf8'),x);return{x,api:x.window.__STORYWORLD_MAZE_R73__,role:v=>role=v};}
test('old generated maps migrate as legacy while future seeds, new runs and restored slots remain independent',async()=>{
 const h=state(),old=h.x.serializeSave();delete old.mazeR73;await h.x.restoreSave(old);assert.equal(h.api.seed('dist00'),0);assert.equal(h.api.seed('dist01'),0);const future=h.api.seed('ep1b09');assert.ok(future>0);const one=JSON.parse(JSON.stringify(h.x.serializeSave()));await h.x.newGame();assert.notEqual(h.api.seed('ep1b09'),future);await h.x.restoreSave(one);assert.equal(h.api.seed('ep1b09'),future);assert.equal(h.api.seed('dist00'),0);
 const before=JSON.stringify(h.api.inspect().entries);await assert.rejects(()=>h.x.restoreSave({...one,mazeR73:{version:1,runSeed:-1,entries:{}}}));assert.equal(JSON.stringify(h.api.inspect().entries),before);await assert.rejects(()=>h.x.restoreSave({...one,bad:true}));assert.equal(JSON.stringify(h.api.inspect().entries),before);
});
test('maze extension and its save metadata stay out of the existing R63R1 co-op session',()=>{
 const h=state(),art=A.REGIONAL_TERRAIN_ART.dist00,seeded=A.explorationLayout('dist00',art.theme,false,{seedR73:123456}),legacy=A.explorationLayout('dist00',art.theme,false,{});assert.ok(seeded.mazeR73.addedCells>0);c.window.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'host'};assert.equal(A.mazeRoomsR73(legacy,123456,'dist00'),legacy);delete c.window.__STORYWORLD_COOP_SIM_R62__;
 const solo=h.x.serializeSave();assert.ok(solo.mazeR73);h.role('host');assert.equal(h.x.serializeSave().mazeR73,undefined);h.role('guest');assert.equal(h.x.serializeSave().mazeR73,undefined);
});
