// R114 CPU check (user 2026-10-28 05:25~06:05): mob/boss own colours (most-used colour 1, second colour 2, colour in the name
// first), echo (phantom) attack charge + dash + damage + long cooldowns for every mob, props thrown by boss-class only at their
// real size and removed from their spot (restored on region entry), boss weapon throws from 8 reviewed boss images, FINAL42
// painted effects (the white Y burst F117 etc.) tinted by the owner's colours, samong lines kill normal mobs at once and grow with
// the samong passive level (capped), light-direction shadows with a foot anchor that R113 grounding keeps.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const read=f=>fs.readFileSync(path.join(SRC,f),'utf8');

function canvasStub(){const g=new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}),set:(t,k,v)=>{t[k]=v;return true;}});
 return{width:0,height:0,getContext:()=>g,toDataURL:()=>'data:'};}
function world(){
 const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,RegExp,Promise,setTimeout:()=>0,performance:{now:()=>0},requestAnimationFrame:()=>0};
 sb.localStorage={getItem:()=>null,setItem(){}};
 sb.document={createElement:()=>canvasStub(),getElementById:()=>null,querySelector:()=>null,head:{appendChild(){}}};
 sb.getComputedStyle=()=>({position:'relative'});
 sb.started=true;sb.time=10;sb.zoom=1;sb.TILE=34;sb.modal=null;sb.loading=false;sb.settings={lowFx:false};sb.layer='STORY';
 sb.effects=[];sb.projectiles=[];
 sb.player={hero:'slayer',x:10,y:10,hp:100,maxHp:100,direction:'right'};
 sb.blocked=(x,y,r)=>false;sb.segmentDistance=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/((dx*dx+dy*dy)||1)));return Math.hypot(px-ax-t*dx,py-ay-t*dy);};
 sb.room={enemies:[],props:[],exploration:{bounds:[1,1,29,29],scenery59:{props:[]}}};
 sb.project=(x,y)=>({x:(x-y)*17+500,y:(x+y)*8.5+100});
 sb.actorHeight=()=>60;sb.attackPower=()=>100;
 sb.moveActor=(a,dx,dy)=>{a.x+=dx;a.y+=dy;};
 sb.readyImage=p=>({image:{naturalWidth:512,naturalHeight:512},ready:true});
 sb.hits=[];sb.hitEnemy=(e,v,meta)=>{sb.hits.push({id:e.id,v,kind:meta?.kind});e.hp-=v;return true;};
 sb.tick=function(dt){sb.time+=dt;};
 sb.drawEnemy=()=>{};sb.drawProjectile=()=>{sb.nativeProjectiles=(sb.nativeProjectiles||0)+1;};sb.enterRegion=function(){};
 sb.shadowCalls=0;sb.shadow=function(){sb.shadowCalls++;};
 sb.showSettings=()=>{};
 // fake R61 fields API
 const states=new WeakMap();sb.__STORYWORLD_FIELDS_R61__={state:e=>{if(!states.has(e))states.set(e,{step:0,next:0});return states.get(e);}};
 sb.__STORYWORLD_BOSS_FX_R105__={palette:{},palOf:()=>({elem:'fire',style:'meteor'})};
 sb.__STORYWORLD_POLISH_R100_DATA__={sigColours:{red:[230,40,40],orange:[240,140,30],gold:[240,200,60],violet:[150,90,230],pale:[230,230,230],dark:[40,30,50]}};
 sb.__STORYWORLD_POLISH_R100__={colourOf:()=>'pale'};
 sb.__STORYWORLD_GROWTH_R103__={state:()=>({procs:sb.procs||{}})};
 sb.__STORYWORLD_SAMONG_R75__={active:()=>!!sb.samongOn};
 class DrawCommands{constructor(){this.commands=[];this.dpr=1;this.owner=null;}point(x,y){return[x,y];}scope(owner,fn){const p=this.owner;this.owner=owner;try{return fn();}finally{this.owner=p;}}
  drawImage(image,...a){this.commands.push({kind:'image',owner:this.owner,image,sourcePath:'assets/final42-r88/effects/117/atlas.png',immutableTint:null,sourceRect:[0,0,256,256],imageSize:[1536,1536],points:[[0,0],[100,0],[100,100],[0,100]]});}
  save(){}restore(){}beginPath(){}ellipse(){}fill(){this.commands.push({kind:'fill',owner:this.owner,paths:[{points:[[0,0],[10,0],[10,4]]}]});}}
 sb.StoryPhase1={DrawCommands};
 sb.window=sb;
 vm.createContext(sb);
 for(const f of ['palette-r114-data.js','weapons-r114-data.js','combat-r114.js'])vm.runInContext(read(f),sb,{filename:f});
 return sb;
}
const foe=(id,x,y,o={})=>Object.assign({id,x,y,hp:500,maxHp:500,damage:10,spawnState:'active',direction:'left',radius:.3},o);

// ---- data -------------------------------------------------------------------------------------------
{const sb=world(),D=sb.__STORYWORLD_PALETTE_R114_DATA__,W=sb.__STORYWORLD_WEAPONS_R114_DATA__;
 const rows=Object.values(D);check('palette data covers the mob/boss census (≥400 keys)',rows.length>=400,rows.length);
 check('every palette row has primary and secondary RGB',rows.every(r=>Array.isArray(r.p)&&r.p.length===3&&Array.isArray(r.s)&&r.s.length===3));
 const named=rows.filter(r=>/^name/.test(String(r.src)));check('colour words in names win (보라·핏빛·붉은·검은·백색… rows use the name colour)',named.length>=10,named.length);
 const blizzard=rows.filter(r=>/눈보라/.test(r.name||''));check('눈보라 is not read as 보라',blizzard.every(r=>!/보라/.test(String(r.src))),JSON.stringify(blizzard.slice(0,2)));
 check('weapon table has the 8 reviewed bosses',Object.keys(W).length===8,Object.keys(W));
 check('weapon rects are positive and carry a Korean name',Object.values(W).every(w=>w.rect.length===4&&w.rect.every(v=>v>=0)&&w.rect[2]>8&&w.rect[3]>8&&/[가-힣]/.test(w.name)));
 const C=sb.__STORYWORLD_COMBAT_R114__;const g=C.glow([82,37,23]);check('glow keeps the hue but lifts value for visible effects',Math.max(...g)>=229&&g[0]>g[2],g);
 check('glow of black stays a dark violet smoke, not grey',JSON.stringify(C.glow([10,10,12]))==='[150,96,190]');}

// ---- echo -------------------------------------------------------------------------------------------
{const sb=world(),F=sb.__STORYWORLD_FIELDS_R61__,C=sb.__STORYWORLD_COMBAT_R114__;const m=foe('m1',12,10);sb.room.enemies.push(m);
 F.state(m).step=1;sb.tick(.016);check('mob prop turn is skipped (mobs never throw props)',F.state(m).step===2,F.state(m).step);
 m.r61Action={kind:'echo',room:sb.room,start:10,releaseAt:10.9,endAt:11.4,angle:0,damage:6.4,token:1};sb.tick(.016);
 const a=m.r61Action;check('echo charge adds .8 s before release',Math.abs(a.releaseAt-11.7)<1e-9&&Math.abs(a.endAt-12.2)<1e-9,[a.releaseAt,a.endAt]);
 check('echo damage ×1.9 for mobs',Math.abs(a.damage-6.4*1.9)<1e-9,a.damage);
 check('first echo → next echo waits 45 s after it ends',Math.abs(C.echo(m).readyAt-(12.2+45))<1e-9,C.echo(m));
 check('the mob rests 4 s after the echo before any R61 throw',F.state(m).next>=12.2+4-1e-9,F.state(m).next);
 sb.time=11.75;sb.tick(.05);sb.tick(.05);check('mob dashes toward the hero when the echo is released',m.x>12.05&&C.stats().dashes===1,[m.x,C.stats().dashes]);
 F.state(m).next=0;F.state(m).step=0;sb.time=20;sb.tick(.016);check('while the echo rests the mob does not start R61 throws',F.state(m).next>=57.2-1e-9,F.state(m).next);
 sb.time=70;m.r61Action={kind:'echo',room:sb.room,start:70,releaseAt:70.9,endAt:71.4,angle:0,damage:5,token:2};sb.tick(.016);check('second echo → next one 30 s later',Math.abs(C.echo(m).readyAt-(72.2+30))<1e-9,C.echo(m));
 const b=foe('b1',14,10,{boss:true,nativeId:'dist06-boss'});sb.room.enemies.push(b);b.r61Action={kind:'echo',room:sb.room,start:70,releaseAt:71.08,endAt:71.5,angle:0,damage:10,token:3};sb.tick(.016);
 check('boss echo: +.6 s charge, ×1.5 damage, 30 s first rest',Math.abs(b.r61Action.releaseAt-71.68)<1e-9&&Math.abs(b.r61Action.damage-15)<1e-9&&Math.abs(C.echo(b).readyAt-(72.1+30))<1e-9,[b.r61Action.releaseAt,b.r61Action.damage,C.echo(b)]);}

// ---- props / weapons ------------------------------------------------------------------------------
{const sb=world(),C=sb.__STORYWORLD_COMBAT_R114__;const b=foe('b1',14,10,{boss:true,nativeId:'dist06-boss'});sb.room.enemies.push(b);
 const tree={id:'p1',path:'assets/x/tree.webp',x:13,y:9,height:180};const wall={id:'p2',path:'assets/x/pillar.webp',x:15,y:9,height:200,solid:true,radius:.5};sb.room.props.push(tree,wall);
 b.r61Action={kind:'prop',room:sb.room,start:10,releaseAt:11,endAt:11.5,angle:0,damage:8,token:11,path:tree.path,prop:{path:tree.path,x:tree.x,y:tree.y,id:'p1'},origin:{x:14,y:10}};sb.tick(.016);
 check('boss throws the nearby prop and it disappears from its spot',tree.visible===false&&C.stats().propThrows===1,[tree.visible,C.stats()]);
 sb.projectiles.push({id:5,x:14,y:10,vx:-4,vy:0,age:.1,radius:.24,damage:8,r61Shot:{kind:'prop',token:11,owner:b,flight:.6}});sb.tick(.016);
 const shot=sb.projectiles[0];check('thrown prop keeps its real size (180 px tall, hitbox grows)',shot.r114Throw?.height===180&&shot.radius>.5,[shot.r114Throw?.height,shot.radius]);
 check('thrown object carries the owner colour for its explosion',Array.isArray(shot.r114Col)&&typeof shot.r114OnPop==='function');
 b.r61Action={kind:'prop',room:sb.room,start:12,releaseAt:13,endAt:13.5,angle:0,damage:8,token:12,path:wall.path,prop:{path:wall.path,x:wall.x,y:wall.y,id:'p2'},origin:{x:14,y:10}};sb.tick(.016);
 check('blocking props are never hidden (no invisible walls); the boss throws its own weapon instead',wall.visible!==false&&C.stats().weaponThrows===1,[wall.visible,C.stats()]);
 sb.enterRegion();check('thrown props come back on region entry',tree.visible===undefined&&C.stats().hidden===0,[tree.visible,C.stats().hidden]);
 const mob=foe('m1',12,10);sb.room.enemies.push(mob);const t2={id:'p3',path:'assets/x/crate.webp',x:12,y:9,height:60};sb.room.props.push(t2);
 mob.r61Action={kind:'prop',room:sb.room,start:20,releaseAt:21,endAt:21.5,angle:0,damage:8,token:13,path:t2.path,prop:{path:t2.path,x:t2.x,y:t2.y,id:'p3'}};sb.tick(.016);
 check('a mob prop action (if one slips through) does not take the prop away',t2.visible===undefined&&mob.r61Action.r114?.throw==='mob');}

// ---- FINAL42 tint -------------------------------------------------------------------------------------
{const sb=world(),C=sb.__STORYWORLD_COMBAT_R114__;const b=foe('b1',14,10,{boss:true,nativeId:'dist06-boss'});sb.room.enemies.push(b);
 const rec=new sb.StoryPhase1.DrawCommands();rec.scope({id:'final42-r88:x',kind:'effect',x:14,y:10.4,r88Final42:true,r88AtlasPath:'assets/final42-r88/effects/117/atlas.png',nativeOwner:null},()=>rec.drawImage({naturalWidth:1536,naturalHeight:1536},0,0));
 const c=rec.commands[0];check('white Y burst (F117) is redrawn with the boss colours',c.immutableTint?.r114Tint===true&&/#r114-tint-/.test(c.sourcePath),c.sourcePath);
 check('tinted atlas is half size with matching UV rect',c.imageSize[0]===768&&c.sourceRect[2]===128,[c.imageSize,c.sourceRect]);
 check('the burst varies in size/tilt per cast (not the identical stamp)',JSON.stringify(c.points)!==JSON.stringify([[0,0],[100,0],[100,100],[0,100]]));
 const rec2=new sb.StoryPhase1.DrawCommands();rec2.scope({id:'final42-r88:h',kind:'effect',x:10,y:10,r88Final42:true,r88AtlasPath:'assets/final42-r88/effects/246/atlas.png'},()=>rec2.drawImage({naturalWidth:512,naturalHeight:512},0,0));
 check('hero hit art (F246) is never tinted by enemies',rec2.commands[0].immutableTint===null);}

// ---- samong lines -------------------------------------------------------------------------------------
{const sb=world(),C=sb.__STORYWORLD_COMBAT_R114__;const m=foe('m1',12,10),b=foe('b1',14,10,{boss:true});sb.room.enemies.push(m,b);
 sb.hitEnemy(m,5,{kind:'hero-samong-storm-r75'});check('a samong line kills a normal mob at once',m.hp<=0,m.hp);
 sb.hitEnemy(b,5,{kind:'hero-samong-storm-r75'});check('bosses still take normal samong damage',b.hp===495,b.hp);
 sb.procs={};check('no samong passive → no extra lines',C.samong().extraPerWave===0);
 sb.procs={'slayer:w':3,'slayer:e':3,'slayer:r':3};check('passive level 9 → +3 lines per wave',C.samong().extraPerWave===3,C.samong());
 sb.procs={'slayer:w':7,'slayer:e':7,'slayer:r':7};check('line count is capped (+4, 6 per wave)',C.samong().extraPerWave===4,C.samong());
 sb.samongOn=true;const m2=foe('m2',15,15);sb.room.enemies.push(m2);for(let i=0;i<40;i++)sb.tick(.03);
 check('extra lines are drawn with the R75 samong look and stay under the cap',C.samong().extra>0&&C.samong().extra<=24&&sb.effects.some(e=>e.type==='samongStormR75'),C.samong());
 sb.samongOn=false;sb.tick(.03);check('extra lines vanish when the awakening ends',C.samong().extra===0);}

// ---- ranged camera, hero art consistency ----------------------------------------------------------------
{const src=read('combat-r114.js');// a sandbox with a cameraTick (world() has none)
 const s2=(()=>{const box={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,RegExp,Promise,setTimeout:()=>0};box.localStorage={getItem:()=>null,setItem(){}};box.document={createElement:()=>canvasStub()};
  box.started=true;box.time=1;box.player={hero:'gunner',x:10,y:10,hp:100};box.room={enemies:[],props:[]};box.tick=function(dt){box.time+=dt;};box.camSeen=[];box.cameraTick=function(){box.camSeen.push([box.player.x,box.player.y]);};
  box.__STORYWORLD_PLAY_R113__={dance:()=>({anchor:box.anchor||null})};box.window=box;vm.createContext(box);vm.runInContext(read('palette-r114-data.js'),box);vm.runInContext(src,box);return box;})();
 s2.anchor={x:10,y:10};s2.player.x=14;s2.player.y=12;s2.cameraTick(.016);
 check('ranged hero camera follows the dance anchor, not the hero standing beside the enemy',JSON.stringify(s2.camSeen.pop())==='[10,10]'&&s2.player.x===14);
 s2.anchor=null;s2.player.x=10;s2.player.y=10;s2.cameraTick(.016);s2.time+=.05;s2.player.x=15;s2.cameraTick(.016);
 check('a short teleport onto an enemy keeps the camera on the hero spot',JSON.stringify(s2.camSeen.pop())==='[10,10]',s2.camSeen);
 s2.player.hero='hwando';s2.time+=1;s2.player.x=20;s2.cameraTick(.016);check('melee heroes keep the normal camera',JSON.stringify(s2.camSeen.pop())==='[20,10]');}
{const s=read('hero-fx-r102.js');check('nightmare hunter·swordsman crescent (slayer-a) is turned 180° so its bulge leads',/'assets\/vfx\/heroes\/slayer-a\.webp':180/.test(s));}
{const s=read('play-r113.js');check('hero faces the enemy it is shooting (target), not just the nearest one',/const aimed=typeof target!=='undefined'/.test(s)&&/const foe=aimed\|\|nearestFoe\(9\)/.test(s));}
{const s=read('combat-r114.js');check('stray old-set hero frames are swapped for the current set in the same direction',/OLD_ART=\/heroes\\\/normalized\\\/directions/.test(s)&&/function unifyHero\(/.test(s));
 check('hero body height is fitted to the hwando body (0.85–1.15×, from the foot)',/const BODY=\.98/.test(s)&&/:clamp\(k,\.85,1\.15\)/.test(s));
 check('swapped/static hero art and gunner art get the wide fit (0.6–1.7×), walk/idle strips are fitted too',/WIDE_FIT=\/hero_direction33\[478\]/.test(s)&&/clamp\(k,\.6,1\.7\)/.test(s)&&/r114Swap:true/.test(s)&&/HERO_ART=.*r91\\\/walk/.test(s)&&/gunner\\\/\(\?:player_idle\|run_\)/.test(s));
 check('heroes without a walk atlas get a step bob/tilt while moving',/function walkHero\(/.test(s));}

// ---- cinema shadows ---------------------------------------------------------------------------------
{const sb=world();const rec=new sb.StoryPhase1.DrawCommands();sb.ctx=rec;vm.runInContext(read('cinema-r114.js'),sb,{filename:'cinema-r114.js'});const K=sb.__STORYWORLD_CINEMA_R114__;
 rec.scope({id:'prop:p',kind:'prop'},()=>sb.shadow(300,300,20,{}));
 const fills=rec.commands.filter(c=>c.kind==='fill');check('shadow = 3 fills (long cast ×2 + contact)',fills.length===3,fills.length);
 check('every shadow fill carries its foot anchor for R113 grounding',fills.every(c=>Array.isArray(c.r114Anchor)&&c.r114Anchor[0]===300));
 const far=K.castDir(2000,2000);check('far from the hero light the shadow falls away from the moon (right-down)',far.x>.8&&far.y>0&&far.k===0,far);
 const h=sb.project(sb.player.x,sb.player.y),left=K.castDir(h.x-120,h.y);check('near the hero light shadows fall away from the hero',left.x<0&&left.k>0,left);
 check('native round shadow is no longer called',sb.shadowCalls===0,sb.shadowCalls);
 K.set({shadows:false});sb.shadow(1,1,10,{});check('turning the option off restores the native shadow',sb.shadowCalls===1);}

// ---- R113 keeps the anchor -------------------------------------------------------------------------------
{const s=fs.readFileSync(path.join(SRC,'play-r113.js'),'utf8');check('R113 grounding moves anchored shadows by their foot instead of re-centring',/function shadowAnchored\(/.test(s)&&/if\(Array\.isArray\(c\.r114Anchor\)\)\{shadowAnchored/.test(s));
 check('R113 pops thrown objects in the owner colour and lets R114 add its explosion',/popAt\(b\.x,b\.y,big,b\.r114Col\|\|undefined\);onPop/.test(s));
 check('hero faces a foe within 6 tiles even while moving',/Math\.hypot\(foe\.x-player\.x,foe\.y-player\.y\)>6/.test(s));}
{const s=fs.readFileSync(path.join(SRC,'play-r111.js'),'utf8');check('swaying trees share one measured foot (no 2–3 px bob)',/footOf\(p\.r99Tree\?'r99tree:'\+p\.r99Tree\.kind:p\.path,row\)/.test(s));}
{const html=fs.readFileSync(path.join(ROOT,'runtime-text','index.html'),'utf8');const order=['play-r113.js','palette-r114-data.js','weapons-r114-data.js','combat-r114.js','cinema-r114.js'].map(f=>html.indexOf('<script src="./'+f+'"></script>'));
 check('R114 scripts load after R113 in order',order.every(i=>i>0)&&order.every((v,i)=>!i||v>order[i-1]),order);}

console.log(`\n${n-failed}/${n} R114 checks passed`);if(failed)process.exit(1);
