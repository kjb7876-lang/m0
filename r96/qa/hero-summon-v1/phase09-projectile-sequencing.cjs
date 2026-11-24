'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const [source,engine,bundle,r895file]=process.argv.slice(2);
const js=fs.readFileSync(source,'utf8'),html=fs.readFileSync(engine,'utf8'),dist=fs.readFileSync(bundle,'utf8'),r895=fs.readFileSync(r895file,'utf8');
const digest=crypto.createHash('sha256').update(js).digest('hex');
assert.equal(digest,'9ed28a626b1783b13e97eb37db856738bf3c9aec18e633bc053a479e39951b48');
const slice=(s,a,b)=>{const u=s.indexOf(a),v=s.indexOf(b,u+1);assert(u>=0&&v>u,[a,b]);return s.slice(u,v);};
const code=slice(js,'const echoState=','const DIR={front:');
const bridge=html.split('\n').filter(line=>line.includes("controller.bridge.events.emit('projectile-spawn'")||line.includes("controller.bridge.events.emit('confirmed-hit'")).join('\n');
const event=slice(dist,'class EventStream {','const EMPTY_RENDER_EVENTS=')+'const EMPTY_RENDER_EVENTS=Object.freeze([]);';
const renderer=slice(dist,'class RenderBridge {','class AssetCache {');
const nativeAuthorship=slice(html,'let e568HeroActionContext=null;','function e568MeleeDisplayContact7(');
const nativeAdapter=html.split('\n').filter(line=>line.includes('function muzzle(args,row)')||line.includes('const shotBase=makeShot;makeShot=function(...args){const ego=')).join('\n');
const motion=slice(r895,'const REV=','const on=()=>prefs.on&&solo();');
const natives=slice(html,'function makeShot(','function blast(')+slice(html,'function basicAttack(force=false)','function special(){')+slice(html,'function tickShots(dt)','function tickHazards(');
const tickClock=html.match(/time\+=dt;transitionCD=Math\.max\(0,transitionCD-dt\);for\(const key of \['attackCD'[^\n]+?player\[key\]=Math\.max\(0,player\[key\]-dt\);/)[0];
const profile=(id)=>{
 const line=html.match(new RegExp('^ '+id+':\\{[^\\n]+','m'))[0];
 return Object.fromEntries(Object.entries({type:/type:'([^']+)'/,range:/range:([0-9.]+)/,interval:/interval:([0-9.]+)/}).map(([k,re])=>[k,k==='type'?line.match(re)[1]:+line.match(re)[1]]));
};
function fixture(hero,{overlap,admitSecond}){
 const player={hero,hp:270,x:8,y:6,attackCD:0,attackAnim:0,combo:0,direction:'right',moving:false};
 const h=profile(hero);let allow=true;
 const all=[];
 const g={player,room:{id:'arena1',layer:'STORY'},target:null,HEROES:{[hero]:h},time:10,uid:0,transitionCD:0,started:true,modal:false,loading:false,N:32,settings:{lowFx:false},projectiles:[],
 getAllowed:()=>allow,capacity28:{admission:()=>({allowed:allow}),created(){}},localStorage:{getItem:()=>null},window:{},e568HeroVfxAudit:{serial:0},
 liveEnemies:()=>[],nearestEnemy:()=>null,clearLine:()=>true,blocked:()=>false,nestedCommands:new WeakSet(),
 distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rank:()=>0,storyAim22:()=>0,facing:()=> 'right',attackPower:()=>17,sound(){},fx(){},delay(){},blast(){},
 special(){},VFX:{cross:'cross',core:'core',slash:'slash',glitch:'glitch',bolt:'bolt'},objectId:(o,p)=>p+':'+o.id,hitEnemy:()=>{throw Error('unexpected damage in this empty open-flight fixture');},
 commandArea:()=>1,actorHeight:()=>60,cachedSpiritImage:()=>({naturalWidth:768,naturalHeight:512}),project:(x,y)=>({x:x*32,y:y*16})};
g.ENGINE_HEROES=g.HEROES;
 vm.runInNewContext(event+renderer+natives+motion+nativeAuthorship+
   `const dispatches=[];const stockAttack=basicAttack;
    basicAttack=function(...args){const before=player.combo;const row={hero:player.hero,state:'attack',at:time,origin:{x:player.x,y:player.y}};
      try{return stockAttack.apply(this,args);}finally{if(player.combo>before)dispatches.push(row);}};
    window.__STORYWORLD_CURRENT_HERO__={actions:()=>dispatches};
    globalThis.camera=new RenderBridge(()=>({ready:true,time,settings,zone:room.id,layer:room.layer,hero:player.hero,
     projectiles:projectiles.filter(p=>!p.dead).map(p=>({id:objectId(p,'shot'),age:p.age,x:p.x,y:p.y,friendly:p.friendly}))}));
    const controller={bridge:camera};window.__STORYWORLD_PHASE1__={controller};window.__STORYWORLD_HERO_MOTION_R895__={sample};`+
   bridge+code+`function advance(dt){${tickClock}tickShots(dt);}
    Object.assign(globalThis,{planSummon,echoCommand,advance,basicAttack});`,g);
 const holder={},proj={projection:{tile:32,zoom:1,worldToScreen:g.project}},fp={width:800,height:540};
 const draw=(capture=true)=>{
  const frame=capture?g.camera.capture():null;
  if(!frame)return g.window.__STORYWORLD_HERO_MOTION_R895__.sample();
  const owner={x:player.x,y:player.y,kind:'hero',alive:true};
  const body={kind:'image', image:{src:'fixture'}, sourcePath:'assets/r143/attack/'+hero+'/attack-e.webp',r143Attack:true,sourceRect:[0,0,192,256],points:[[228,51],[286,51],[286,106],[228,106]],owner,key:'hero',style:{globalAlpha:1}};
  const s=g.planSummon(holder,frame,body,hero,player,g.time);
  const row=g.echoCommand(proj,s,[body],hero,g.time,{...frame,viewport:fp},owner);
  const data={t:g.time,cursor:g.camera.eventCursor,events:frame.events.map(e=>[e.type,e.serial,e.id,e.at]),live:frame.projectiles.map(p=>p.id),visible:row?1:0,sourceSerial:row?s.event:null,renderKey:row?.key??null};
  all.push(data);return data;
 };
 draw();g.advance(.001);g.basicAttack(true);
 const first=overlap==='consumed'?draw():draw(false);
 const {id:firstId,life}=g.projectiles[0];assert.equal(g.projectiles.length,1);
 const firstSerial=g.camera.events.serial;assert.equal(firstSerial,1);
 if(overlap==='consumed'){assert.equal(first.visible,1);assert.equal(first.sourceSerial,firstSerial);}
 const a0=g.time;
 // Native authored attack cooldown, true core projectile movement/lifetime, and R895
 // sampler. No force-decrement or fixed fake launch stamps. The only alternate is
 // admission returning denied for the one second makeShot (second attack still starts).
 while(g.time<a0+h.interval+.001-1e-9){
  const step=Math.min(.01,a0+h.interval+.001-g.time);
  g.advance(step);draw(overlap==='consumed');
 }
 assert.equal(player.attackCD,0);assert(g.projectiles.some(p=>p.id===firstId),'first native shot must still be in flight at second attempt');
 allow=admitSecond;g.basicAttack(true);assert.equal(player.combo,2);assert.equal(player.attackAnim,.24);
 // Render after the next native tick so R895 samples the changed pose at the new game time.
 g.advance(.001);const second=draw();
 const wanted=admitSecond?1:0;
 assert.equal(second.visible,wanted);
 assert.equal(second.sourceSerial,admitSecond?firstSerial+1:null);
 assert(second.live.includes('shot:'+firstId));
 assert.equal(second.live.length,admitSecond?2:1);
 assert.deepEqual([...second.events.map(x=>x[1])],overlap==='consumed'?(admitSecond?[2]:[]):(admitSecond?[1,2]:[1]));
 g.advance(.001);const follow=draw();
 assert.equal(follow.events.length,0,'cursor rereading a live projectile is not a fresh launch');
 assert.equal(follow.visible,wanted);
 assert.equal(follow.renderKey,second.renderKey);assert.equal(follow.sourceSerial,second.sourceSerial);
 return {hero,overlap,admitSecond,nativeCooldown:h.interval,oldLife:life,second,follow};
}
function authoredMuzzleFixture({allow,foreign,alterReceipt,reuseOld,roomChange,allyOwned,threeShots}={}){
 const px=67.62161313222727,py=91.75244468897648,rx=65.37241959809853,ry=90.07496731251995,at=1.6999999999999988;
 const player={hero:'hunter',hp:270,x:px,y:py,attackCD:0,attackAnim:0,combo:threeShots?4:0,direction:'right',moving:false};
 const h=profile('hunter'),tile=34,offX=(rx-px-ry+py)*tile,offY=(rx-px+ry-py)*tile/2;
 const room={id:'dist00',layer:'STORY'},nativeTarget={id:'real-native-enemy',x:65.11274356031996,y:91.75244468897648,hp:100,radius:.45};
 const g={player,room,target:nativeTarget.id,HEROES:{hunter:h},time:at,uid:1,transitionCD:0,started:true,modal:false,loading:false,N:128,
 settings:{lowFx:false},projectiles:[],TILE:tile,zoom:64/66,e568HeroVfxAudit:{serial:0},
 allyOwned:!!allyOwned,window:{__STORYWORLD_PHASE1_ART__:{heroFrame(){return {path:'native-authoring.png',assetFrame:{sourceRect:[0,0,512,512],pivot:[200,250],visibleHeight:66,muzzle:[200+offX,250+offY]}};}}},
 localStorage:{getItem:()=>null},capacity28:{admission:()=>({allowed:allow!==false}),created(){}},liveEnemies:()=>[nativeTarget],
 nearestEnemy:()=>nativeTarget,clearLine:()=>true,blocked:()=>false,nestedCommands:new WeakSet(),
 distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rank:()=>0,storyAim22:()=>0,facing:()=> 'right',attackPower:()=>17,sound(){},fx(){},delay(){},blast(){},
 special(){},VFX:{cross:'cross',core:'core',slash:'slash',glitch:'glitch',bolt:'bolt'},objectId:(o,p)=>p+':'+o.id,
 hitEnemy(e,value){e.hp-=value;return true;},commandArea:()=>1,actorHeight:()=>64,cachedSpiritImage:()=>({naturalWidth:768,naturalHeight:512}),project:(x,y)=>({x:x*32,y:y*16})};
 g.ENGINE_HEROES=g.HEROES;
 vm.runInNewContext(event+renderer+natives+motion+
   "if(allyOwned){const stock=makeShot;makeShot=function(...args){return stock.apply(this,[...args.slice(0,5),{...args[5],owner:'fixture-ally'}]);};}"+nativeAuthorship+
   `const dispatches=[],actions={hunter:{a:'assets/vfx/heroes/hunter-a.webp'}},actionsByPlayer=new WeakMap();let pendingAction=null;
    function attack(){const before=player.combo,row={hero:player.hero,state:'attack',at:time,origin:{x:player.x,y:player.y},target:nearestEnemy()};pendingAction=row;try{return basicAttack(true);}finally{pendingAction=null;if(player.combo>before)dispatches.push(row);}}
    window.__STORYWORLD_CURRENT_HERO__={actions:p=>p===player?dispatches:[]};
    const controller={bridge:new RenderBridge(()=>({ready:true,time,settings,zone:room.id,layer:room.layer,hero:player.hero,projectiles:[]}))};
    window.__STORYWORLD_PHASE1__={controller};window.__STORYWORLD_HERO_MOTION_R895__={sample};
    `+'{'+nativeAdapter+'} {'+bridge+'} '+code+`
    function step(dt){${tickClock}}
    Object.assign(globalThis,{planSummon,echoCommand,attack,step,controller,dispatches});
    `,g);
 const holder={},projection={projection:{tile:32,zoom:1,worldToScreen:g.project}},viewport={width:800,height:540};
 const draw=(capture=null)=>{
   const frame=capture??g.controller.bridge.capture();
   const owner={x:player.x,y:player.y,kind:'hero',alive:true};
   const body={kind:'image',image:{src:'fixture'},sourcePath:'assets/r143/attack/hunter/attack-e.webp',r143Attack:true,sourceRect:[0,0,192,256],points:[[228,51],[286,51],[286,106],[228,106]],owner,key:'hero',style:{globalAlpha:1}};
   const s=g.planSummon(holder,frame,body,'hunter',player,g.time);
   const row=g.echoCommand(projection,s,[body],'hunter',g.time,{...frame,viewport},owner);
   return {row,serial:s.event,events:frame.events};
 };
 draw();g.attack();
 const shot=g.projectiles[0],stream=g.controller.bridge.events,launch=stream.since(0)[0];
 assert.equal(g.dispatches[0].at,at);
 if(allow===false){assert.equal(shot,undefined);assert.equal(launch,undefined);}
 else{
   assert.equal(shot.currentPublicMuzzle.applied,true);assert(Math.hypot(shot.x-px,shot.y-py)>2.8);
   assert(Math.abs(shot.x-rx)<1e-12&&Math.abs(shot.y-ry)<1e-12,'exact observed distant authored position');
   assert(launch.x===shot.x&&launch.y===shot.y&&launch.id==='shot:2');
   assert.equal(stream.since(0).filter(e=>e.type==='projectile-spawn').length,threeShots?3:1);
   // Exact Bridge event remains after the native shot retires, not an active projectile guess.
   shot.dead=true;
 }
 g.step(1/60);
 if(roomChange)g.room={...room};
 const f=g.controller.bridge.capture();
 if(launch&&(foreign||alterReceipt)){f.events=[{...launch,hero:foreign?'seoha':launch.hero,serial:alterReceipt?launch.serial+1:launch.serial}];}
 const result=draw(f),expected=allow!==false&&!foreign&&!alterReceipt&&!roomChange&&!allyOwned;
 assert.equal(!!result.row,expected);assert.equal(result.serial,expected?launch.serial:null);
 if(threeShots){
   assert(result.row?.key==='summoner-echo:hunter');
   const following=draw(g.controller.bridge.capture());
   assert.equal(following.serial,launch.serial);assert.equal(following.row?.key,result.row.key);
 }
 if(reuseOld){g.step(.53);g.capacity28.admission=()=>({allowed:false});g.attack();g.step(1/60);
  assert.equal(draw({...g.controller.bridge.capture(),events:[launch]}).row,null,'previous attested launch never matches a new cast');}
 return {allow:allow!==false,foreign:!!foreign,alterReceipt:!!alterReceipt,reuseOld:!!reuseOld,roomChange:!!roomChange,allyOwned:!!allyOwned,threeShots:!!threeShots,visible:!!result.row,launch:launch?.serial??null};
}
function inheritedAuraScope(){
 const r101=fs.readFileSync(require('node:path').join(require('node:path').dirname(source),'polish-r101.js'),'utf8');
 const actualTag=slice(r101,'const orbPaintActor=','function blades(x,');
 const actualFilter=slice(js,'const legacyOrbPaintActor=','function consume(');
 const recorderScope=dist.match(/  scope\(owner,fn\)\{const prior=this.owner;this.owner=owner;try\{return fn\(\);\}finally\{this.owner=prior;\}\}/)[0];
 const p={hero:'seoha'},ally={hero:'seoha'},other={hero:'hunter'},baseOwner={id:'r101:aura-back:hero',kind:'effect',x:1,y:2,r101:true};
 const g={p,ally,other,baseOwner,assert};
 vm.runInNewContext(`class QARecorder {${recorderScope}}
 const ctx=new QARecorder();ctx.owner=baseOwner;
 function scope(owner,fn){return ctx.scope(owner,fn);}
 const stock=[];
 function orbs(...args){stock.push({owner:{...ctx.owner},args});return 'native application';}
 `+actualTag+actualFilter+`
 const opts=[0,0,64,{form:'orbs'},.24,4.09,'back',1],s={mesh:{visible:true}};
 const ordinary=()=>actorOrbs(p,...opts);
 assert.equal(ordinary(),'native application');assert.equal(ctx.owner,baseOwner);
 actorOrbs(ally,...opts);actorOrbs(other,...opts);
 ctx.owner={...baseOwner,id:'r101:aura-front:hero'};
 ordinary();
 const glyph=stock[0],foreign=stock[1],anotherHero=stock[2],front=stock[3];
 const rest=[baseOwner,{...baseOwner,id:'r101:hit'}].map(owner=>({owner}));
 assert.deepEqual(glyph.args,[p,...opts]);
 assert.equal(JSON.stringify(glyph.owner),JSON.stringify(baseOwner),'ordinary 2D paint preserves enumerable string paint data and order');
 assert.equal(replaceLegacyShoulderOrb(glyph,p,'seoha',s,'off'),true);
 assert.equal(replaceLegacyShoulderOrb(front,p,'seoha',s,'off'),true);
 assert.equal(replaceLegacyShoulderOrb(foreign,p,'seoha',s,'off'),false);
 assert.equal(replaceLegacyShoulderOrb(anotherHero,p,'seoha',s,'off'),false);
 assert.equal(replaceLegacyShoulderOrb(glyph,p,'seoha',{mesh:{visible:false}},'off'),false);
 assert.equal(replaceLegacyShoulderOrb(glyph,p,'seoha',null,'off'),false);
 assert.equal(replaceLegacyShoulderOrb(glyph,p,'seoha',s,'host'),false);
 assert.equal(replaceLegacyShoulderOrb(glyph,p,'hwando',s,'off'),false);
 for(const c of rest)assert.equal(replaceLegacyShoulderOrb(c,p,'seoha',s,'off'),false);
 globalThis.verified=true;
 `,g);
 assert.equal(g.verified,true);
 return {ownBackAndFrontOnly:true,fallbackPaintUnchanged:true,otherAuraUnchanged:true,coOpUnaffected:true};
}
const results=[];
for(const hero of ['hunter'])for(const overlap of ['consumed','late-capture'])for(const admitSecond of [false,true])results.push(fixture(hero,{overlap,admitSecond}));
const authored=[{},{allow:false},{foreign:true},{alterReceipt:true},{reuseOld:true},{roomChange:true},{allyOwned:true},{threeShots:true}].map(authoredMuzzleFixture);
console.log(JSON.stringify({exactR1302SHA256:digest,checks:results.length+authored.length,authored,auraScope:inheritedAuraScope(),fixture:'pinned makeShot/tickShots and basicAttack, native cooldown decrement and R895 sample, exact bridge emission and cursor, real echo command; empty arena and controlled admission, not WebGL/browser',results},null,2));
