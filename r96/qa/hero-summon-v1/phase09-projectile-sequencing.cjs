'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const [source,engine,bundle,r895file]=process.argv.slice(2);
const js=fs.readFileSync(source,'utf8'),html=fs.readFileSync(engine,'utf8'),dist=fs.readFileSync(bundle,'utf8'),r895=fs.readFileSync(r895file,'utf8');
const digest=crypto.createHash('sha256').update(js).digest('hex');
assert.equal(digest,'070f05550bb13d148c5906427ec6a9c1a3d7f7a1b939ca158542da53a2339180');
const slice=(s,a,b)=>{const u=s.indexOf(a),v=s.indexOf(b,u+1);assert(u>=0&&v>u,[a,b]);return s.slice(u,v);};
const code=slice(js,'const echoState=','const DIR={front:');
const bridge=html.split('\n').filter(line=>line.includes("controller.bridge.events.emit('projectile-spawn'")||line.includes("controller.bridge.events.emit('confirmed-hit'")).join('\n');
const event=slice(dist,'class EventStream {','const EMPTY_RENDER_EVENTS=')+'const EMPTY_RENDER_EVENTS=Object.freeze([]);';
const renderer=slice(dist,'class RenderBridge {','class AssetCache {');
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
 getAllowed:()=>allow,capacity28:{admission:()=>({allowed:allow}),created(){}},localStorage:{getItem:()=>null},window:{},e568HeroActionContext:{kind:'attack'},
 liveEnemies:()=>[],nearestEnemy:()=>null,clearLine:()=>true,blocked:()=>false,nestedCommands:new WeakSet(),
 distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rank:()=>0,storyAim22:()=>0,facing:()=> 'right',attackPower:()=>17,sound(){},fx(){},delay(){},blast(){},
 VFX:{cross:'cross',core:'core',slash:'slash',glitch:'glitch',bolt:'bolt'},objectId:(o,p)=>p+':'+o.id,hitEnemy:()=>{throw Error('unexpected damage in this empty open-flight fixture');},
 commandArea:()=>1,actorHeight:()=>60,project:(x,y)=>({x:x*32,y:y*16})};
g.ENGINE_HEROES=g.HEROES;
 vm.runInNewContext(event+renderer+natives+motion+
   `globalThis.camera=new RenderBridge(()=>({ready:true,time,settings,zone:room.id,layer:room.layer,hero:player.hero,
     projectiles:projectiles.filter(p=>!p.dead).map(p=>({id:objectId(p,'shot'),age:p.age,x:p.x,y:p.y,friendly:p.friendly}))}));
    const controller={bridge:camera};window.__STORYWORLD_HERO_MOTION_R895__={sample};`+
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
const results=[];
for(const hero of ['seoha','michaela','hunter','gunner'])for(const overlap of ['consumed','late-capture'])for(const admitSecond of [false,true])results.push(fixture(hero,{overlap,admitSecond}));
console.log(JSON.stringify({exactR1302SHA256:digest,checks:results.length,fixture:'pinned makeShot/tickShots and basicAttack, native cooldown decrement and R895 sample, exact bridge emission and cursor, real echo command; empty arena and controlled admission, not WebGL/browser',results},null,2));
