'use strict';

const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');

const facingSource=readFileSync(process.env.STORYWORLD_SUMMON_FACING_SOURCE||path.resolve(__dirname,'../../client-source/enemy-face-r444.js'),'utf8');
const source=readFileSync(process.env.STORYWORLD_SUMMON_SOURCE||path.resolve(__dirname,'../../client-source/gunner-veil-r953.js'),'utf8');
const hero=(fields={})=>({hero:'gunner',hp:100,x:15,y:15,attackCD:0,...fields});

function fixture(side=1,placed=false,proc='summon'){
 const owner=hero(placed?{r720Ally:true}:{});
 const main=placed?hero({hero:'hwando'}):owner;
 const foe={id:'target',x:15+4*side,y:15-3*side,hp:10000,radius:.3};
 const id='u201-mid';
 const definition={id,name:'전쟁관리자',path:'assets/robot.webp'};
 const pattern={shape:'line',radius:10,width:1,repeats:2,gap:.3,name:'직선 공격'};
 const casts=[],hits=[],visibleDirections=[];
 let deployed=placed?[owner]:[];
 const noOp=()=>{};
 const canvas=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:String(k).startsWith('create')?()=>({addColorStop(){}}):noOp});
 const window={__STORYWORLD_HERO_DEFENSE_R720__:{bodies:()=>deployed,asOwner(actor,run){
  if(!deployed.includes(actor))return undefined;
  const previous=engine.player;engine.player=actor;try{return run();}finally{engine.player=previous;}
 }}};
 const engine={window,player:owner,time:0,room:{enemies:[foe]},effects:[],hazards:[],projectiles:[],ctx:canvas,
  document:{createElement:()=>({getContext:()=>canvas})},
  regionById:{u201:{midboss:definition}},portable:{assetMap:{zones:[{id:'u201',actors:[{id,patterns:[pattern]}]}]}},
  actor3:(d,id,x,y)=>({id,nativeId:d.id,name:d.name,path:d.path,profile:d,x,y,maxHp:10,radius:.5,direction:'front'}),
  drawHero:noOp,drawEnemy(body){visibleDirections.push(body.direction);},
  attackPower:()=>engine.player.hero==='gunner'?30:3,basicAttack:()=>{engine.player.attackCD=.5;},tick:noOp,drawEffect:noOp,
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),liveEnemies:()=>engine.room.enemies,
  moveActor:(body,dx,dy)=>{body.x+=dx;body.y+=dy;},blocked:()=>false,clearLine:()=>true,
  hitEnemy:(target,value,reason)=>{hits.push({target,value,reason});target.hp-=value;return true;},
  footprintContains154:()=>true,lockPatternFootprint154:h=>h,
  drawHazard(h){casts.push({row:{...h.row150},sourceId:h.owner});},
 };
 vm.createContext(engine);
 vm.runInContext(facingSource,engine);
 vm.runInContext(source,engine);
 const api=window.__STORYWORLD_GUNNER_VEIL_R953__;
 api.force(proc,owner);
 engine.basicAttack();
 engine.player=main;
 const [body]=api.allies();
 function advance(time){
  engine.time=time;
  engine.tick(.05);
  casts.length=0;
  for(const effect of engine.effects)engine.drawEffect(effect);
  visibleDirections.length=0;
  engine.drawHero();
 }
 return {engine,body,owner,casts,foe,hits,api,advance,visibleDirections,facing:window.__STORYWORLD_ENEMY_FACE_R444__,remove:()=>{deployed=[];}};
}

for(const [side,heading] of [[1,'right'],[-1,'left']]){
 test(`summon faces ${heading} through its committed warning, launch and impact`,()=>{
  const {engine,body,casts,foe,hits,advance,visibleDirections,facing}=fixture(side);
  assert.equal(body.direction,heading);
  advance(.6);
  assert.equal(casts.length,2);
  const [first,second]=casts.map(x=>x.row);
  assert.equal(body.storyAttackStart5,first.releaseAt);
  assert.equal(first.stage,'warning');
  assert.equal(facing.owns(body),true);
  assert.deepEqual(visibleDirections,[heading]);
  assert.equal(body.direction,heading);
  assert.equal(Math.sign((first.targetX-first.originX)-(first.targetY-first.originY)),side);
  foe.x=15-4*side;
  foe.y=15+3*side;
  engine.player.x=body.x-2*side;
  engine.player.y=body.y+2*side;
  advance(.75);
  advance(1);
  assert.deepEqual(visibleDirections,[heading]);
  advance(first.releaseAt+.01);
  assert.equal(body.direction,heading);
  assert.equal(casts[0].row.stage,'flight');
  assert.deepEqual(visibleDirections,[heading]);
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
 assert.ok(Math.abs(body.moveDX-(body.x-x))<1e-9);
 assert.ok(Math.abs(body.moveDY-(body.y-y))<1e-9);
 assert.equal(body.moving,true);
 engine.moveActor=()=>{};
 advance(.15);
 assert.equal(body.moveDX,0);
 assert.equal(body.moveDY,0);
 assert.equal(body.moving,false);
});

test('returning summons cancel attacks whose release is still pending',()=>{
 const {api,body,casts,hits,advance}=fixture();
 for(let t=.05;t<6.97;t+=.05)advance(+t.toFixed(2));
 const pending=casts.filter(({row})=>row.releaseAt>7);
 assert.ok(pending.length>0);
 assert.equal(body.state,'attack');
 const before=hits.length;
 advance(7.05);
 assert.equal(body.state,'idle');
 assert.equal(body.storyAttackState5,null);
 assert.equal(casts.filter(({row})=>row.releaseAt>7).length,0);
 advance(8);
 assert.equal(hits.length,before);
 assert.equal(api.allies().length,0);
});


test('a deployed Gunner supplies its own attack power for every summon impact',()=>{
 const {engine,casts,hits,advance}=fixture(1,true);
 advance(.6);
 const [first,second]=casts.map(({row})=>row);
 advance(first.impactAt+.01);
 advance(second.impactAt+.01);
 assert.deepEqual(hits.map(({value})=>value),[36,36]);
 assert.equal(engine.player.hero,'hwando');
});

test('a placed Gunner barrage is cancelled when its owner is removed or dies',()=>{
 for(const removeOwner of [f=>f.remove(),f=>{f.owner.hp=0;}]){
  const f=fixture(1,true,'barrage');
  assert.ok(f.api.inspect(f.owner).barrage);
  removeOwner(f);
  f.advance(.5);
  assert.equal(f.api.inspect(f.owner).barrage,null);
  assert.equal(f.hits.length,0);
 }
});


test('summon render ownership stays with its authored direction on rooms excluded for hostile actors',()=>{
 const {engine,body,facing,visibleDirections,advance}=fixture();
 engine.room.id='ep1b06';
 facing.set({on:false});
 assert.equal(facing.owns(body),true);
 assert.equal(facing.owns({nativeId:'regular-enemy'}),false);
 advance(.6);
 assert.deepEqual(visibleDirections,['right']);
});
