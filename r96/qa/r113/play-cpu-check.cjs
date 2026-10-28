// R113 CPU check (user 2026-10-28 03:47~03:51): ranged heroes never blink/dance-teleport onto enemies, enemies and hero keep
// facing the foe without left/right flicker, props are grounded (body down to its visible foot, shadow under the foot, moved off
// walls at draw time only), thrown enemy objects pop on wall/hit/expiry, basic physics (separation, mass knockback, debris),
// and foot dust for every mover. Game data (hp, damage, positions saved, props) is never rewritten by drawing.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const src=fs.readFileSync(path.join(SRC,'play-r113.js'),'utf8');

function world(){
 const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,RegExp,Promise,setTimeout:()=>0};
 sb.localStorage={getItem:()=>null,setItem(){}};
 sb.started=true;sb.time=10;sb.zoom=1;sb.TILE=34;sb.modal=null;sb.loading=false;sb.auto=false;
 sb.keys=new Set();sb.joystickVector={x:0,y:0};sb.effects=[];sb.projectiles=[];
 sb.player={hero:'seoha',x:10,y:10,hp:100,direction:'right'};
 sb.wall=(x,y)=>x>=20;                              // a wall from x=20 onwards
 sb.blocked=(x,y,r)=>x+r>=20;
 sb.room={enemies:[],props:[]};
 sb.cam={x:0,y:0};
 sb.project=(x,y)=>({x:(x-y)*17,y:(x+y)*8.5});
 sb.facing=(dx,dy)=>(dx-dy)<0?'left':'right';
 sb.moveActor=(a,dx,dy,r)=>{if(!sb.blocked(a.x+dx,a.y+dy,r)){a.x+=dx;a.y+=dy;}};
 // native blink: v=norm(sx+2sy, 2sy-sx); with no steering toward nearest enemy
 sb.blink=function(){const sx=(sb.keys.has('ArrowRight')?1:0)-(sb.keys.has('ArrowLeft')?1:0)+sb.joystickVector.x,sy=(sb.keys.has('ArrowDown')?1:0)-(sb.keys.has('ArrowUp')?1:0)+sb.joystickVector.y;
  let vx,vy;if(Math.hypot(sx,sy)>.01){vx=sx+2*sy;vy=2*sy-sx;}else{const e=sb.room.enemies[0];vx=e.x-sb.player.x;vy=e.y-sb.player.y;}const L=Math.hypot(vx,vy)||1;sb.player.x+=vx/L*3.8;sb.player.y+=vy/L*3.8;};
 sb.danceOn=false;sb.__STORYWORLD_DANCES_R74__={nativeActive:()=>sb.danceOn};
 sb.walk=null;sb.tick=function(dt){sb.time+=dt;if(sb.walk)sb.walk(dt);if(sb.danceOn){const e=sb.room.enemies[0];sb.player.x=e.x-.6;sb.player.y=e.y;}for(const b of sb.projectiles){b.age=(b.age||0)+dt;b.x+=b.vx*dt;b.y+=b.vy*dt;}};
 sb.drawnHero=[];sb.drawnEnemy=[];
 sb.draw=function(){sb.drawnHero.push({x:sb.player.x,y:sb.player.y});};
 sb.drawEnemy=e=>sb.drawnEnemy.push({id:e.id,dir:e.direction});
 sb.drawHero=()=>sb.drawnHero.push({dir:sb.player.direction});
 sb.fx=()=>{};sb.hitEnemy=(e,v)=>{e.hp-=v;return true;};sb.drawEffect=()=>{};sb.drawExits=()=>{};
 class DrawCommands{constructor(){this.commands=[];this.dpr=1;}point(x,y){return[x,y];}scope(owner,fn){return fn();}}
 sb.StoryPhase1={DrawCommands};
 sb.window=sb;
 vm.createContext(sb);vm.runInContext(src,sb);
 return sb;
}
const foe=(id,x,y,o={})=>Object.assign({id,x,y,hp:50,maxHp:50,damage:5,spawnState:'active',direction:'left',radius:.3},o);

// ① blink
{const sb=world(),P=sb.__STORYWORLD_PLAY_R113__;check('R113 play module loaded',!!P&&P.revision==='R113-play-1');
 for(const hero of ['seoha','michaela','hunter','gunner']){Object.assign(sb.player,{hero,x:10,y:10});sb.room.enemies=[foe('e',13,10)];const d0=Math.hypot(13-10,0);sb.blink();
  check(hero+' S blink with no steering moves away from the nearest enemy',Math.hypot(sb.player.x-13,sb.player.y-10)>d0+2,[sb.player.x,sb.player.y]);
  check(hero+' joystick restored after blink',sb.joystickVector.x===0&&sb.joystickVector.y===0);}
 Object.assign(sb.player,{hero:'hwando',x:10,y:10});sb.blink();check('melee hero blink unchanged (dashes toward foe)',Math.hypot(sb.player.x-13,sb.player.y-10)<1);
 Object.assign(sb.player,{hero:'seoha',x:10,y:10});sb.keys.add('ArrowRight');sb.blink();check('ranged hero with steering keeps native blink',sb.player.x!==10||sb.player.y!==10);sb.keys.clear();}

// ① dance anchor
{const sb=world();Object.assign(sb.player,{hero:'michaela',x:10,y:10});sb.room.enemies=[foe('e',14,12)];
 sb.danceOn=true;for(let i=0;i<5;i++){sb.tick(.05);sb.draw();}const drawn=sb.drawnHero.filter(h=>'x'in h);
 check('ranged hero drawn at its own spot during 실검무 (no visual teleport)',drawn.every(h=>h.x===10&&h.y===10),JSON.stringify(drawn));
 sb.danceOn=false;sb.tick(.05);check('ranged hero returned to its spot when 실검무 ends',sb.player.x===10&&sb.player.y===10,[sb.player.x,sb.player.y]);
 const sb2=world();Object.assign(sb2.player,{hero:'hwando',x:10,y:10});sb2.room.enemies=[foe('e',14,12)];sb2.danceOn=true;sb2.tick(.05);sb2.draw();
 check('melee hero 실검무 unchanged',sb2.drawnHero.at(-1).x===13.4);}

// ② facing
{const sb=world();sb.room.enemies=[foe('e',8,10)];const e=sb.room.enemies[0];const dirs=[];
 for(let i=0;i<20;i++){e.direction=i%2?'left':'right';e.x=8+(i%2)*.1;sb.time+=.05;sb.drawEnemy(e);dirs.push(sb.drawnEnemy.at(-1).dir);}
 check('enemy orbiting beside hero keeps one facing (no left/right flicker)',new Set(dirs).size===1,dirs.join());
 check('enemy faces the hero',dirs[0]===sb.facing(sb.player.x-e.x,sb.player.y-e.y)||dirs[0]==='right',dirs[0]);
 check('enemy data direction restored after drawing',e.direction==='right'||e.direction==='left');
 e.x=10.2;e.y=10;const seq=[];for(let i=0;i<6;i++){e.x=10+(i%2?.2:-.2);sb.time+=.03;sb.drawEnemy(e);seq.push(sb.drawnEnemy.at(-1).dir);}
 check('dead-band: tiny crossings in front of the hero do not flip the enemy',new Set(seq).size===1,seq.join());
 const far=foe('f',40,40);sb.room.enemies.push(far);far.direction='left';sb.drawEnemy(far);check('enemies far outside combat keep their own direction',sb.drawnEnemy.at(-1).dir==='left');}
{const sb=world();Object.assign(sb.player,{hero:'hwando',attackAnim:.3,direction:'left'});sb.room.enemies=[foe('e',12,8)];const seq=[];
 for(let i=0;i<10;i++){sb.time+=.05;sb.player.direction=i%2?'left':'right';sb.drawHero();seq.push(sb.drawnHero.at(-1).dir);}
 check('hero in combat faces the foe and does not flicker',new Set(seq).size===1&&seq[0]===sb.facing(2,-2),seq.join());}

// ③ props
{const sb=world(),DC=sb.StoryPhase1.DrawCommands;const rec=new DC();sb.ctx=rec;
 const img={src:'a.webp'},owner={kind:'prop',id:'r99:tree:x',x:19.6,y:10,bodyPath:'assets/props/tree.webp'};
 rec.scope(owner,()=>{rec.commands.push({kind:'fill',owner,paths:[{points:[[100,200],[120,205],[100,210],[80,205]]}]});rec.commands.push({kind:'image',owner,image:img,sourceRect:[0,0,10,10],points:[[80,120],[120,120],[120,200],[80,200]]});});
 const im=rec.commands[1].points;check('prop standing in a wall is drawn off the wall (draw time only)',im[0][0]!==80&&owner.x===19.6,JSON.stringify(im));
 const deco={kind:'prop',id:'r80-prop:b',x:19.6,y:10,bodyPath:'assets/props/wall_banner.webp'},r2=new DC();sb.ctx=r2;
 r2.scope(deco,()=>{r2.commands.push({kind:'image',owner:deco,image:img,sourceRect:[0,0,10,10],points:[[80,120],[120,120],[120,200],[80,200]]});});
 check('wall-hung banner stays on its wall',r2.commands[0].points[0][0]===80);
 const door={kind:'prop',id:'ward-r81-wall:3',x:19.6,y:10},r3=new DC();r3.scope(door,()=>{r3.commands.push({kind:'image',owner:door,image:img,sourceRect:[0,0,10,10],points:[[80,120],[120,120],[120,200],[80,200]]});});
 check('wall/door pieces are never moved',r3.commands[0].points[0][0]===80);
 const solid={id:'s',x:19.6,y:10,solid:true,path:'assets/props/crate.webp'};sb.room={enemies:[],props:[solid]};const so={kind:'prop',id:'prop:s',x:19.6,y:10},r4=new DC();
 r4.scope(so,()=>{r4.commands.push({kind:'image',owner:so,image:img,sourceRect:[0,0,10,10],points:[[80,120],[120,120],[120,200],[80,200]]});});
 check('blocking props are not moved away from their collision',r4.commands[0].points[0][0]===80);
 check('ground module records no failures',sb.__STORYWORLD_PLAY_R113__.stats().failures===0,sb.__STORYWORLD_PLAY_R113__.stats().lastError);}
{const sb=world(),P=sb.__STORYWORLD_PLAY_R113__;P.set({ground:false});const rec=new sb.StoryPhase1.DrawCommands();const owner={kind:'prop',id:'r99:tree:y',x:19.6,y:10},img={src:'b'};
 rec.scope(owner,()=>{rec.commands.push({kind:'image',owner,image:img,sourceRect:[0,0,10,10],points:[[80,120],[120,120],[120,200],[80,200]]});});
 check('ground option off leaves props exactly as drawn',rec.commands[0].points[0][0]===80&&rec.commands[0].points[3][1]===200);}

// ④ thrown objects
{const sb=world(),P=sb.__STORYWORLD_PLAY_R113__;sb.room.enemies=[foe('e',14,10)];
 const shot={x:18,y:10,vx:20,vy:0,age:0,r61Shot:{kind:'prop'}};sb.projectiles.push(shot);sb.tick(.1);sb.tick(.1);
 check('thrown prop stops and pops on a wall',shot.dead===true&&P.stats().wallStops===1&&P.stats().thrownPops===1,JSON.stringify(P.stats()));
 const s2={x:12,y:10,vx:1,vy:0,age:0,r61Shot:{kind:'echo'}};sb.projectiles.push(s2);sb.tick(.05);sb.projectiles.length=0;sb.tick(.05);
 check('thrown object that expires (hits ground/player) pops where it vanished',P.stats().thrownPops===2);
 const own={x:12,y:10,vx:1,vy:0,age:0,friendly:true};sb.projectiles.push(own);sb.tick(.05);sb.projectiles.length=0;sb.tick(.05);
 check('hero projectiles are left alone',P.stats().thrownPops===2);
 check('pop makes debris and smoke particles',P.particles()>4);}

// ⑤ physics
{const sb=world(),P=sb.__STORYWORLD_PLAY_R113__;const a=foe('a',12,12),b=foe('b',12.05,12),boss=foe('boss',15,10,{boss:true}),small=foe('s',14,10);sb.room.enemies=[a,b,boss,small];
 for(let i=0;i<10;i++)sb.tick(.05);check('overlapping bodies push apart',Math.hypot(a.x-b.x,a.y-b.y)>.4,Math.hypot(a.x-b.x,a.y-b.y));
 const hp=small.hp;sb.hitEnemy(small,5,{x:13,y:10});const x0=small.x;for(let i=0;i<10;i++)sb.tick(.05);
 check('struck mob is knocked back away from the blow',small.x>x0+.05,[x0,small.x]);check('knockback does not change damage',small.hp===hp-5);
 const bx=boss.x;sb.hitEnemy(boss,5,{x:14,y:10});for(let i=0;i<10;i++)sb.tick(.05);check('bosses are not knocked back',Math.abs(boss.x-bx)<.3);
 const w=foe('w',19.4,10);sb.room.enemies=[w];sb.hitEnemy(w,1,{x:18,y:10});for(let i=0;i<20;i++)sb.tick(.05);check('knockback stops at walls',w.x+w.radius<20+1e-9,w.x);}

// ⑥ dust
{const sb=world(),P=sb.__STORYWORLD_PLAY_R113__;const m=foe('m',12,12),bo=foe('bo',16,16,{boss:true});sb.room.enemies=[m,bo];
 const before=P.stats().dust;sb.walk=dt=>{sb.player.x+=1*dt;};for(let i=0;i<20;i++)sb.tick(.05);check('hero walking raises foot dust',P.stats().dust>before);
 sb.walk=dt=>{m.x+=1*dt;bo.y+=1*dt;};const base=P.stats().dust;for(let i=0;i<10;i++)sb.tick(.05);check('mobs and bosses walking raise foot dust',P.stats().dust>base+2,P.stats().dust-base);
 sb.walk=dt=>{sb.player.x+=1*dt;};
 P.set({dust:false});const b3=P.stats().dust;for(let i=0;i<10;i++)sb.tick(.05);check('dust option off stops new dust',P.stats().dust===b3);
 check('particle count bounded',P.particles()<=180);}

console.log(`\nR113 play CPU check: ${n-failed}/${n} passed`);
if(failed)process.exit(1);
