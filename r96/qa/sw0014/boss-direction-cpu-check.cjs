'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=path.resolve(__dirname,'../../client-source');
const story={path:'assets/r380/mobs/u204-mech-04-v1.webp',size:[2048,256],rect:[0,0,256,256]};
const dream={path:'assets/r104/bosses/u204-mid-p4.webp',size:[386,438],rect:[0,0,386,438]};
const feet=[[32,6],[-38,6]];
function sample(layer,art,delta,{id='u204-mid',casting=false,fixed=false,cold=false,blocked=[]}={}){
  const e={id,nativeId:id,hp:60,x:0,y:0,midboss:true,stationary:fixed,rangedWindup:casting?.5:0};
  const world={
    layer,time:0,ctx:{commands:[]},
    project:(x,y)=>({x:(x-y)*24,y:(x+y)*12}),
    localStorage:{getItem:()=>null},
    readyImage(p){return cold||blocked.includes(p)?null:{image:{src:p},ready:true};},
    addImage(){},
    setTimeout(fn){fn();},
    drawEnemy(){
      world.ctx.commands.push({kind:'image',owner:{kind:'enemy'},sourcePath:art.path,
        image:{src:art.path},imageSize:art.size,sourceRect:art.rect,points:[[-38,-80],[32,-80],...feet]});
    },
  };
  world.window=world;
  vm.createContext(world);
  for(const name of ['move-dir-r974-data.js','move-dir-r1190-data.js','move-float-r1029-data.js','move-float-r1224-data.js','move-dir-r974.js']){
    vm.runInContext(fs.readFileSync(path.join(source,name),'utf8'),world,{filename:name});
  }
  const rows=[];
  for(let i=0;i<14;i++){
    e.x+=delta[0];e.y+=delta[1];world.time+=.1;world.ctx.commands.length=0;
    world.drawEnemy(e);
    if(i>=5)rows.push(world.ctx.commands[0]);
  }
  return rows;
}
const dirs={side:[.12,-.12],down:[.12,.12],up:[-.12,-.12]};
for(const [direction,delta] of Object.entries(dirs)){
  const commands=sample('DREAM',dream,delta);
  assert.ok(commands.every(c=>c.sourcePath===`assets/sw0014/u204-mid-${direction}.webp`&&c.r974===direction));
  assert.equal(new Set(commands.map(c=>c.sourceRect[0])).size,4);
}
assert.ok(sample('STORY',story,dirs.down).every(c=>c.sourcePath==='assets/r1190/move/u204-mid-down.webp'));
assert.ok(sample('DREAM',dream,dirs.down,{casting:true}).every(c=>c.sourcePath===dream.path));
assert.ok(sample('DREAM',dream,dirs.down,{fixed:true}).every(c=>c.sourcePath===dream.path));
const cold=sample('DREAM',dream,dirs.down,{cold:true});
assert.ok(cold.every(c=>c.sourcePath===dream.path&&c.r974Gait&&c.points[2]===feet[0]&&c.points[3]===feet[1]));
const firewall={path:'assets/rc140/story-cycle-motions/c101-mid.png',rect:[0,0,661,724],size:[2200,724]};
const newGait='assets/sw0014/c101-mid-gait.webp',legacyFloat='assets/r1224/float/c101-mid.webp';
assert.ok(sample('STORY',firewall,dirs.down,{id:'c101-mid'}).every(c=>c.sourcePath===newGait));
assert.ok(sample('STORY',firewall,dirs.down,{id:'c101-mid',blocked:[newGait]}).every(c=>c.sourcePath===legacyFloat));
console.log('DREAM inspector directions, STORY route, gait priority, pale legacy bridge and anchored fallback passed');
