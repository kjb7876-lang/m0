'use strict';
// R312: R114 camera holds belong to one player/room/hero timeline.
// Whole production overlay, mocked camera sink; no browser/GPU claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../../client-source/combat-r114.js'),'utf8');
let checks=0,failed=0;
function check(name,pass){checks++;if(!pass)failed++;console.log((pass?'PASS ':'FAIL ')+name);}
function world(hero){
 const c={console,Math,JSON,Set,Map,WeakMap,WeakSet,Promise,performance:{now:()=>0},setTimeout:()=>0,
  localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,createElement:()=>({getContext:()=>({})})},
  started:true,time:10,layer:'STORY',settings:{lowFx:false},effects:[],projectiles:[],
  player:{hero,x:10,y:10,hp:100},room:{enemies:[],props:[],exploration:{}},cam:{x:0,y:0},
  tick(){},cameraTick(){this.cam.x=this.player.x;this.cam.y=this.player.y;}};
 // The native camera reads the global player; do not rely on wrapper `this`.
 c.cameraTick=()=>{c.cam.x=c.player.x;c.cam.y=c.player.y;};c.window=c;
 vm.createContext(c);vm.runInContext(src,c,{filename:'combat-r114.js'});
 if(!c.__STORYWORLD_COMBAT_R114__)throw Error('Overlay did not install');
 return c;
}
for(const hero of ['lauren','hunter','gunner','michaela']){
 const c=world(hero);c.cameraTick(.016);c.room={enemies:[],props:[],exploration:{}};c.player.x=55;c.player.y=57;c.time+=.05;c.cameraTick(.016);
 check(hero+': region change follows the new position immediately',c.cam.x===55&&c.cam.y===57);
 check(hero+': camera wrapper restores actual player position',c.player.x===55&&c.player.y===57);
}
{
 const c=world('hunter');c.cameraTick(.016);c.player={hero:'hunter',x:15,y:19,hp:100};c.time=.05;c.cameraTick(.016);
 check('new player / rewound game time clears prior camera hold',c.cam.x===15&&c.cam.y===19);
}
{
 const c=world('lauren');c.cameraTick(.016);c.player.hero='gunner';c.player.x=30;c.time+=.05;c.cameraTick(.016);
 check('hero replacement does not inherit another hero camera history',c.cam.x===30);
}
{
 const c=world('hunter');c.cameraTick(.016);c.player.x=30;c.time=1;c.cameraTick(.016);
 check('clock rewind in the same room does not trigger a teleport hold',c.cam.x===30);
}
{
 const c=world('hunter');c.cameraTick(.016);c.player.x=30;c.time+=.05;c.cameraTick(.016);
 check('same room temporary teleport retains original camera hold',c.cam.x===10&&c.player.x===30);
 c.time+=.7;c.cameraTick(.016);check('same room hold still expires after 0.6 game seconds',c.cam.x===30);
}
{
 const c=world('hunter');c.cameraTick(.016);c.player.x=30;c.time+=.05;c.cameraTick(.016);
 c.player.x=10.5;c.time+=.05;c.cameraTick(.016);check('return near anchor releases camera hold',c.cam.x===10.5);
}
{
 const c=world('hwando');c.cameraTick(.016);c.player.x=30;c.time+=.05;c.cameraTick(.016);check('melee camera behavior unchanged',c.cam.x===30);
}
{
 const c=world('hunter');c.cameraTick(.016);c.player={hero:'hunter',x:30,y:30,hp:100};c.time+=.05;c.cameraTick(.016);
 check('player identity change alone clears camera history',c.cam.x===30&&c.cam.y===30);
}
{
 const c=world('lauren');c.cameraTick(.016);c.player.x=30;c.time+=.05;c.cameraTick(.016);
 check('fixture has an active camera hold before region change',c.cam.x===10);
 c.room={enemies:[],props:[],exploration:{}};c.player.x=55;c.time+=.05;c.cameraTick(.016);
 check('region change releases an already active hold',c.cam.x===55);
}
{
 const c=world('hunter');c.cameraTick(.016);c.player.x=30;c.time+=.05;c.cameraTick(.016);
 c.started=false;c.cameraTick(.016);c.started=true;c.player.x=50;c.time+=.05;c.cameraTick(.016);
 check('inactive lifecycle clears an already active hold',c.cam.x===50);
}
{
 const c=world('hunter');c.cameraTick(.016);c.player.hero='hwando';c.player.x=30;c.time+=.05;c.cameraTick(.016);
 c.player.hero='hunter';c.player.x=50;c.time+=.05;c.cameraTick(.016);
 check('ranged/melee/ranged transition cannot reuse old hold',c.cam.x===50);
}
{
 const c=world('hunter');c.__STORYWORLD_PLAY_R113__={dance:()=>({anchor:{x:8,y:9}})};c.cameraTick(.016);
 check('explicit R113 dance anchor retains precedence and restores player',c.cam.x===8&&c.cam.y===9&&c.player.x===10&&c.player.y===10);
}
console.log(JSON.stringify({checks,failed,passed:failed===0,method:'Production R114 overlay in CPU VM; camera sink only'}));
if(failed)process.exitCode=1;
