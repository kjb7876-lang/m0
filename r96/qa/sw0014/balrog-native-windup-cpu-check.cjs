'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=path.join(__dirname,'../../client-source/motion-fx-r1229.js');
const bodyPath='assets/actors/v31511/balrog-raised-body.png';
const swordPath='assets/actors/v31511/balrog-raised-sword.png';
const idlePath='assets/r104/bosses/dist06-boss-p4.webp';
const boss={id:'dist06:dist06-boss',name:'발록 · 지옥의 문지기',x:5,y:5,hp:100,radius:.55,spawnState:'active'};
const view={render:frame=>frame.commands};
const world={
  actorHeight:()=>60,
  project:(x,y)=>({x:x*30,y:y*30}),
  room:{enemies:[boss]},
  time:4,
  tick(){},
  releaseImageMemory(){},
  setTimeout(fn){fn();},
  __STORYWORLD_PHASE1__:{controller:{state:{three:view}}},
  document:{createElement:()=>({getContext:()=>({
    drawImage(){},
    getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4).fill(255)};},
  })})},
};
world.window=world;
vm.createContext(world);
vm.runInContext(fs.readFileSync(source,'utf8'),world,{filename:source});

function draw(path,{left,top,width,height}){
  return {
    kind:'image',owner:{id:'enemy:'+boss.id,kind:'enemy'},image:{src:path},sourcePath:path,sourceRect:[0,0,120,120],
    points:[[left,top],[left+width,top],[left+width,top+height],[left,top+height]],
  };
}
const idleBounds={left:80,top:52,width:120,height:110};
view.render({commands:[draw(idlePath,idleBounds)]});
boss.attack={elapsed:.08,angle:0};
const body=draw(bodyPath,idleBounds);
const sword=draw(swordPath,{left:132,top:-18,width:20,height:150});
const commands=view.render({commands:[body,sword]});
assert.deepEqual(Array.from(commands,c=>c.sourcePath),[bodyPath,swordPath]);
assert.equal(body.points[2][1],162,'the native foot does not move as the pair is scaled');
assert.equal(body.points[0][0]+body.points[1][0],280,'the native body center stays anchored');
const scale=(162-body.points[0][1])/110;
assert.ok(scale>1,'the canonical boss size still applies');
assert.ok(Math.abs((sword.points[1][0]-sword.points[0][0])/20-scale)<1e-6,'the blade follows the exact same scale');
assert.equal(boss.radius,.55*1.66,'the existing radius adjustment is applied once');
boss.attack=null;
const idleAgain=view.render({commands:[draw(bodyPath,idleBounds)]});
assert.equal(idleAgain[0].sourcePath,idlePath,'normal idle fallback still uses the last canonical sprite');
console.log('Balrog native windup, sword alignment and normal fallback passed');
