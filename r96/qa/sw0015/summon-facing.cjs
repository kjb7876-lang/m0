'use strict';

const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');

const source=readFileSync(process.env.STORYWORLD_SUMMON_SOURCE||path.resolve(__dirname,'../../client-source/gunner-veil-r953.js'),'utf8');
const hero=(fields={})=>({hero:'gunner',hp:100,x:15,y:15,attackCD:0,...fields});

function fixture(side=1,placed=false){
 const owner=hero(placed?{r720Ally:true}:{});
 const main=placed?hero({hero:'hwando'}):owner;
 const foe={id:'target',x:15+4*side,y:15-3*side,hp:10000,radius:.3};
 const id='u201-mid';
 const definition={id,name:'전쟁관리자',path:'assets/robot.webp'};
 const pattern={shape:'line',radius:10,width:1,repeats:2,gap:.3,name:'직선 공격'};
 const casts=[],hits=[];
 let deployed=placed?[owner]:[];
 const noOp=()=>{};
 const canvas=new Proxy({},{get:(o,k)=>k in o?o[k]:String(k).startsWith('create')?()=>({addColorStop(){}}):noOp});
 const window={__STORYWORLD_HERO_DEFENSE_R720__:{bodies:()=>deployed}};
 const engine={window,player:owner,time:0,room:{enemies:[foe]},effects:[],hazards:[],projectiles:[],ctx:canvas,
  document:{createElement:()=>({getContext:()=>canvas})},
  regionById:{u201:{midboss:definition}},portable:{assetMap:{zones:[{id:'u201',actors:[{id,patterns:[pattern]}]}]}},
  actor3:(d,id,x,y)=>({id,nativeId:d.id,name:d.name,path:d.path,profile:d,x,y,maxHp:10,radius:.5,direction:'front'}),
  attackPower:()=>30,basicAttack:()=>{engine.player.attackCD=.5;},tick:noOp,drawEffect:noOp,
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),liveEnemies:()=>engine.room.enemies,
  moveActor:(body,dx,dy)=>{body.x+=dx;body.y+=dy;},blocked:()=>false,clearLine:()=>true,
  hitEnemy:(target,value,reason)=>{hits.push({target,value,reason});target.hp-=value;return true;},
  footprintContains154:()=>true,lockPatternFootprint154:h=>h,
  drawHazard(h){casts.push({row:{...h.row150},sourceId:h.owner});},
 };
 vm.runInNewContext(source,engine);
 const api=window.__STORYWORLD_GUNNER_VEIL_R953__;
 api.force('summon',owner);
 engine.basicAttack();
 engine.player=main;
 const [body]=api.allies();
 function advance(time){
  engine.time=time;
  engine.tick(.05);
  casts.length=0;
  for(const effect of engine.effects)engine.drawEffect(effect);
 }
 return {engine,body,casts,foe,hits,api,advance,remove:()=>{deployed=[];}};
}

for(const [side,heading] of [[1,'right'],[-1,'left']]){
 test(`summon faces ${heading} through its committed warning, launch and impact`,()=>{
  const {engine,body,casts,foe,hits,advance}=fixture(side);
  assert.equal(body.direction,heading);
  advance(.6);
  assert.equal(casts.length,2);
  const [first,second]=casts.map(x=>x.row);
  assert.equal(body.storyAttackStart5,first.releaseAt);
  assert.equal(first.stage,'warning');
  assert.equal(body.direction,heading);
  assert.equal(Math.sign((first.targetX-first.originX)-(first.targetY-first.originY)),side);
  foe.x=15-4*side;
  foe.y=15+3*side;
  advance(first.releaseAt+.01);
  assert.equal(body.direction,heading);
  assert.equal(casts[0].row.stage,'flight');
  assert.equal(hits.length,0);
  assert.equal(body.moving,false);
  advance(first.impactAt+.01);
  assert.equal(body.direction,heading);
  assert.equal(casts[0].row.stage,'impact');
  assert.equal(hits.length,1);
  advance(second.impactAt+.01);
  assert.equal(hits.length,2);
  assert.equal(engine.hazards.length,0);
  assert.equal(engine.projectiles.length,0);
  assert.equal(engine.room.enemies.length,1);
 });
}

test('removing a 777 deployed owner cancels queued attacks for that exact body',()=>{
 const {api,body,casts,hits,advance,remove}=fixture(-1,true);
 advance(.6);
 const impact=casts[0].row.impactAt;
 assert.equal(body.direction,'left');
 remove();
 advance(impact+.02);
 assert.equal(hits.length,0);
 assert.equal(casts.length,0);
 assert.equal(api.allies().length,0);
});

test('the summon reports actual displacement, including a blocked stride',()=>{
 const {engine,body,foe,advance}=fixture();
 foe.x=27;
 foe.y=13;
 advance(.05);
 const x=body.x,y=body.y;
 engine.moveActor=(actor,dx)=>{actor.x+=dx;};
 advance(.1);
 assert.equal(body.moveDX,body.x-x);
 assert.equal(body.moveDY,body.y-y);
 assert.equal(body.moving,true);
 engine.moveActor=()=>{};
 advance(.15);
 assert.equal(body.moveDX,0);
 assert.equal(body.moveDY,0);
 assert.equal(body.moving,false);
});
