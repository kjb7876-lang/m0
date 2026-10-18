import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const source=fs.readFileSync('client-source/save-slots-r73.js','utf8'),LEGACY='native-save';
const clone=o=>JSON.parse(JSON.stringify(o));
const raw=(zone='hub',n=1)=>({version:6,scope:'hapil.storyworld.depth-full.20261008',zone,layer:'STORY',player:{x:2,y:2,hp:777,level:n,points:n},progress:{STORY:{},DREAM:{}},rooms:{['STORY:'+zone]:{cleared:false,enemies:[]}},goldenR72:{designs:[{id:'gold-'+n}],equipped:['gold-'+n]}});
function harness(initial={}){
 const data=new Map(Object.entries(initial)),handlers=new Map(),panel={innerHTML:'',innerText:'',querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}};
 let failKey=null,cheat=false,coop='off';
 const c={window:{},SAVE:LEGACY,console,Date,Number,Object,JSON,Map,Set,started:true,booted:false,loading:false,storyScene:null,zone:'hub',layer:'STORY',player:{x:2,y:2,hp:777,level:1},room:{id:'hub',layer:'STORY',finalizing:false,exploration:{floorCells:[[2,2]]}},progress:{STORY:{},DREAM:{}},gold:raw().goldenR72,route:[],command:null,cam:{},regionById:{hub:{title:'거점'},dist00:{title:'나무'}},escapeHTML:s=>String(s),toast(){},openPanel(html){panel.innerHTML=html;},closePanel(){},$:id=>id==='panel'?panel:{disabled:false},button:(id,fn)=>handlers.set(id,fn),blocked:()=>false,document:{createElement:()=>({})},showTitle(){},showMenu(){},localStorage:{getItem:k=>data.get(k)??null,setItem(k,v){if(k===failKey)throw Error('QUOTA');data.set(k,String(v));},removeItem:k=>data.delete(k)}};
 c.unlockTag='original';c.serializeSave=()=>({...raw(c.zone,c.player.level),player:clone(c.player),progress:clone(c.progress),goldenR72:clone(c.gold),unlockedRegions:{tag:c.unlockTag},...(cheat?{cheat777:{active:true}}:{})});
 c.nativeSaveCalls=0;c.saveGame=()=>{c.nativeSaveCalls++;try{const value=JSON.stringify(c.serializeSave());c.localStorage.setItem(coop!=='off'?LEGACY+'.coop':cheat?LEGACY+'.cheat777':c.window.__STORYWORLD_SAVE_SLOTS_R73__.key(),value);return true;}catch{return false;}};
 c.validateSave=v=>{if(!c.regionById[v.zone]||v.version!==2||v.bad)throw Error('INVALID');return v;};
 c.normalizeSave3=v=>{if(v.version!==6)throw Error('ENVELOPE');const valid=c.validateSave({...v,version:2});c.unlockTag=v.unlockedRegions?.tag||'original';return{valid,raw:v};};
 c.restoreSave=async v=>{c.normalizeSave3(v);if(v.lateBad)throw Error('EXTENSION_VALIDATION');c.zone=v.zone;c.layer=v.layer;c.player=clone(v.player);c.progress=clone(v.progress);c.gold=clone(v.goldenR72);c.room={...c.room,id:v.zone,layer:v.layer};cheat=v.cheat777?.active===true;};
 c.enterRegion=async id=>{c.zone=id;c.room={...c.room,id};c.saveGame(false);return true;};
 c.loadLocal=()=>{};
 c.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 c.window.__STORYWORLD_CHEAT777__={active:()=>cheat,leave:async()=>{cheat=false;return true;}};
 c.window.__STORYWORLD_STORY_PROFILE_R54__={inspect:()=>({}),begin:async()=>{c.player={...raw().player,level:1};c.progress={STORY:{},DREAM:{}};c.gold={designs:[],equipped:[]};await c.enterRegion('hub');if(!c.saveGame(false))return false;return true;}};
 vm.createContext(c);vm.runInContext(source,c);c.booted=true;
 return{c,data,handlers,api:c.window.__STORYWORLD_SAVE_SLOTS_R73__,fail:k=>failKey=k,cheat:v=>cheat=v,mode:v=>coop=v,new:async n=>{c.window.__STORYWORLD_SAVE_SLOTS_R73__.confirm('new',n);return handlers.get('slotConfirmR73')();}};
}
test('legacy save copies once into slot 1, original survives new games and three slots stay independent',async()=>{
 const legacy=JSON.stringify(raw('dist00',9)),h=harness({[LEGACY]:legacy});assert.equal(h.data.get(LEGACY+'.slot-r73.1'),legacy);assert.equal(h.data.get(LEGACY),legacy);
 h.c.player.level=17;h.c.gold=clone(raw('hub',17).goldenR72);assert.equal(h.c.saveGame(false),true);const one=h.data.get(LEGACY+'.slot-r73.1');
 assert.equal(await h.new(2),true);assert.equal(h.api.inspect().active,2);h.c.player.level=22;assert.equal(h.c.saveGame(false),true);const two=h.data.get(LEGACY+'.slot-r73.2');
 assert.equal(await h.new(3),true);h.c.player.level=33;assert.equal(h.c.saveGame(false),true);
 assert.equal(h.data.get(LEGACY+'.slot-r73.1'),one);assert.equal(h.data.get(LEGACY+'.slot-r73.2'),two);assert.equal(h.data.get(LEGACY),legacy);
 assert.equal(await h.api.confirm('load',1),true);assert.equal(h.c.player.level,17);assert.deepEqual(clone(h.c.gold),raw('hub',17).goldenR72);assert.equal(h.api.inspect().active,1);
});
test('transition or stale map cannot overwrite a slot and 777 remains separate',async()=>{
 const h=harness();assert.equal(h.c.saveGame(false),true);const one=h.data.get(LEGACY+'.slot-r73.1');h.c.loading=true;assert.equal(h.c.saveGame(false),false);h.c.loading=false;h.c.room.id='dist00';assert.equal(h.c.saveGame(false),false);assert.equal(h.data.get(LEGACY+'.slot-r73.1'),one);h.cheat(true);assert.equal(h.c.saveGame(false),true);assert.equal(h.data.get(LEGACY+'.slot-r73.1'),one);assert.equal(JSON.parse(h.data.get(LEGACY+'.cheat777')).cheat777.active,true);
});
test('cooperative saves retain their native key and normal-slot entry hooks do not add a second partial cooperative save',async()=>{
 const h=harness();assert.equal(h.c.saveGame(false),true);const normal=h.data.get(LEGACY+'.slot-r73.1');h.mode('host');const before=h.c.nativeSaveCalls;await h.c.enterRegion('dist00');assert.equal(h.c.nativeSaveCalls,before+1);assert.ok(h.data.has(LEGACY+'.coop'));assert.equal(h.data.get(LEGACY+'.slot-r73.1'),normal);h.api.confirm('new',2);assert.equal(h.handlers.has('slotConfirmR73'),false);assert.equal(h.api.inspect().active,1);
});
test('completed map entry checkpoints its destination during pre-scene while manual mid-scene saves remain blocked',async()=>{
 const h=harness();assert.equal(h.c.saveGame(false),true);h.c.storyScene={part:'pre'};assert.equal(await h.c.enterRegion('dist00'),true);const saved=JSON.parse(h.data.get(LEGACY+'.slot-r73.1'));assert.equal(saved.zone,'dist00');assert.equal(saved.saveSlotR73.transitionComplete,true);assert.equal(saved.saveSlotR73.checkpoint,'entered-pre-scene');assert.equal(h.c.saveGame(false),false);
});
test('a stored position on a visible portal restores to a safe approach without travelling or changing the destination',async()=>{
 const h=harness({[LEGACY]:JSON.stringify(raw('dist00',4))});h.c.window.__STORYWORLD_ROUTES_R72__={inspect:()=>({portals:[{role:'previous',visible:true,point:{x:2,y:2}}]})};h.c.window.__STORYWORLD_PORTAL_ARRIVAL_R73__={point:()=>({x:4.5,y:2})};assert.equal(await h.api.confirm('load',1),true);assert.equal(h.c.zone,'dist00');assert.equal(h.c.player.x,4.5);assert.equal(h.c.player.y,2);assert.equal(h.api.inspect().audit.some(e=>e.kind==='portal-safe-position'),true);assert.equal(JSON.parse(h.data.get(LEGACY)).player.x,2,'legacy original remains intact');
});
test('quota, malformed or rejected slot data cannot claim success or change the active slot',async()=>{
 const h=harness({[LEGACY]:JSON.stringify(raw())});assert.equal(h.c.saveGame(false),true);const one=h.data.get(LEGACY+'.slot-r73.1');h.fail(LEGACY+'.slot-r73.2');assert.equal(await h.new(2),false);assert.equal(h.api.inspect().active,1);assert.equal(h.data.get(LEGACY+'.slot-r73.1'),one);
 h.data.set(LEGACY+'.slot-r73.3','{incomplete');assert.equal(await h.api.confirm('load',3),false);assert.equal(h.api.inspect().active,1);assert.equal(h.data.get(LEGACY+'.slot-r73.3'),'{incomplete');
 h.data.set(LEGACY+'.slot-r73.3',JSON.stringify({...raw(),bad:true}));assert.equal(await h.api.confirm('load',3),false);assert.equal(h.api.inspect().active,1);
 h.data.set(LEGACY+'.slot-r73.3',JSON.stringify({...raw(),lateBad:true,unlockedRegions:{tag:'foreign-slot'}}));assert.equal(await h.api.confirm('load',3),false);assert.equal(h.c.unlockTag,'original','later restore rejection must roll back stateful native unlock normalization');
 h.fail(LEGACY+'.slot-r73.1');assert.equal(h.c.saveGame(false),false);assert.equal(h.data.get(LEGACY+'.slot-r73.1'),one);
});
