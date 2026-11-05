// R314: recorded native pictures, R205 sizing, R241 admission/damage and guide integration.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(R,f),'utf8');
const file='client-source/boss-prop-control-r314.js';
assert.ok(fs.existsSync(path.join(R,file)),'CX-0014 missing: no boss prop control overlay');
const src=read(file);let checks=0;
function check(n,f){f();checks++;console.log('PASS '+n);}
function fixture({mobile=false,props=6}={}){
 const phase=read('runtime-text/dist/phase1.js');
 const start=phase.indexOf('function affineMultiply'),end=phase.indexOf('\nclass ',phase.indexOf('class DrawCommands')+10);
 // Use the real recorder class; its affine helpers are injected below.
 const a=phase.indexOf('class DrawCommands'),b=phase.indexOf('\nclass ',a+10);
 const c={console,localStorage:{getItem:()=>null,setItem(){}},time:10,uid:0,started:true,loading:false,modal:false,layer:'STORY',zone:'dist06',W:1280,H:800,zoom:1,TILE:32,
  player:{x:10,y:10,hp:777,hero:'hwando'},room:{id:'dist06',engaged:true,enemies:[],props:[],exploration:{floorCells:[[1,1]],walls:[]}},hazards:[],effects:[],
  auto:false,guide:false,keys:new Set(),settings:{reducedMotion:true},route:[],command:null,guideTimer:0,rank:()=>0,defenceCue(){},gainResonance(){},floatText(){},fx(){},VFX:{burst:'burst'},shake:0,
  setTimeout(){},setInterval(){},maxHP:()=>777,actorHeight:()=>66,project:(x,y)=>({x:640+(x-y)*32,y:400+(x+y-20)*16}),
  blocked:()=>false,clearLine:()=>true,sound(){},tickHazards(dt){for(const h of c.hazards){h.age+=dt;if(h.damage>0&&h.age>=h.warning&&h.age<h.life&&Math.hypot(c.player.x-h.x,c.player.y-h.y)<h.radius&&c.time-h.lastHit>=.35){h.lastHit=c.time;c.hurt(h.damage,h);}}c.hazards=c.hazards.filter(h=>h.age<h.life);},
  hurt(d){if(c.player.invincible>0)return'invulnerable';c.player.hp-=d*(c.player.guard?.4:1);return'hit';},
  tick(dt){c.tickHazards(dt);},drawHazard(){},drawEffect(){},
  document:{createElement:()=>({width:64,height:64,getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8Array(64*64*4).fill(255)})})})}};
 Object.assign(c.player,{invincible:0,invReason:'',parry:0,shield:0,grazeGuard:0,samong:0});c.distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 c.window=c;c.__STORYWORLD_MOBILE_R63__={isMobile:()=>mobile};
 c.__STORYWORLD_BOSS_FIELDS_R62__={ownerState:()=>({next:Infinity}),prepare(){}};
 c.__STORYWORLD_FX_SPRITES_R106__={draw(){}};
 c.readyImage=()=>({image:{width:1536,height:256}});
 vm.createContext(c);
 vm.runInContext('function affineMultiply(a,b){return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}function affinePoint(m,x,y){return[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];}'+phase.slice(a,b)+';this.DrawCommands=DrawCommands;',c);
 const index=read('runtime-text/index.html');vm.runInContext(index.match(/function tickHazards\(dt\)\{[^\n]+/)[0]+'\n'+index.match(/function hurt\(damage,source\)\{[^\n]+/)[0],c);
 c.ctx=new c.DrawCommands({canvas:{width:1280,height:800}});
 const image={width:96,height:128};
 c.drawProp=p=>{const q=c.project(p.x,p.y);c.ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y},()=>c.ctx.drawImage(image,0,0,96,128,q.x-16,q.y-40,32,40));};
 c.drawEnemy=e=>{const q=c.project(e.x,e.y),h=66*(e.defScale||1);c.ctx.scope({id:'enemy:'+e.id,kind:'enemy',x:e.x,y:e.y},()=>c.ctx.drawImage(image,0,0,96,128,q.x-h/4,q.y-h,h/2,h));};
 vm.runInContext(read('client-source/boss-r205.js'),c);
 vm.runInContext(read('client-source/boss-meteor-r241.js'),c);
 c.preR314Enemy=c.drawEnemy;vm.runInContext(src,c);
 c.boss={id:'boss',boss:true,name:'fixture',x:8,y:10,hp:100,maxHp:100,damage:30,defScale:1,radius:.4,combatProfile:{bodyBlock:{r:.4},hurtbox:{r:.4}},spawnState:'active'};c.room.enemies.push(c.boss);
 for(let i=0;i<props;i++)c.room.props.push({id:'prop'+i,x:9+i*.5,y:11,path:'furniture.webp',height:40,solid:i===0});
 c.frame=()=>{c.ctx.reset();for(const p of c.room.props)c.drawProp(p);c.drawEnemy(c.boss);for(const e of c.effects)c.drawEffect(e);};
 c.advance=dt=>{c.time+=dt;c.tick(dt);};
 c.cast=()=>{c.__STORYWORLD_BOSS_FIELDS_R62__.prepare(c.boss);return c.hazards.filter(h=>h.r314Prop);};
 c.api=c.__STORYWORLD_BOSS_PROP_CONTROL_R314__;return c;
}
check('major bosses reach two hero bodies; midboss stays R205 size; enrage doubles then caps at 70% viewport',()=>{
 const c=fixture();for(const key of ['boss','persona','cosmic','trial']){const e={...c.boss,boss:false,[key]:true};c.ctx.reset();c.drawEnemy(e);const row=c.ctx.commands.filter(x=>x.kind==='image').at(-1);assert.ok(Math.abs(row.points[3][1]-row.points[0][1])>=66*.98*2-.01);}
 c.frame();const normal=c.api.inspect().lastSize;c.boss.r205Enraged={};c.frame();const rage=c.api.inspect().lastSize;assert.ok(rage.body>=normal.body*2-.01);c.H=180;c.frame();assert.ok(c.api.inspect().lastSize.body<=180*.7+.01);
 const e={...c.boss,boss:false,midboss:true,r205Enraged:undefined};c.ctx.reset();c.drawEnemy(e);const row=c.ctx.commands.filter(x=>x.kind==='image').at(-1);c.ctx.reset();c.preR314Enemy(e);assert.deepEqual(row.points,c.ctx.commands.filter(x=>x.kind==='image').at(-1).points,'midboss retains original R205 drawing');
});
check('collision radius scales once with the rendered body, never compounds on repeated draws',()=>{const c=fixture();c.frame();c.advance(.01);const r=c.boss.radius;assert.ok(r>.4);for(let i=0;i<100;i++){c.frame();c.advance(.01);}assert.equal(c.boss.radius,r);assert.equal(c.boss.combatProfile.hurtbox.r,r);c.boss.r205Enraged={};c.frame();assert.ok(Math.abs(c.boss.radius/r-2)<1e-9);c.H=180;c.frame();assert.ok(c.boss.radius<r*2);});
check('R241 supplies unchanged per-shot budget/radius and cadence; A/B alternate after actual visible prop capture',()=>{const c=fixture();c.frame();const hs=c.cast();assert.equal(hs.length,6);assert.ok(hs.every(h=>h.damage===Math.max(27,777*.06)&&h.radius===1.25));assert.equal(hs[0].r314Prop.mode,'rain');assert.equal(c.cast().length,6);c.advance(5);c.time+=2;c.frame();const next=c.cast();assert.equal(next.length,6);assert.equal(next[0].r314Prop.mode,'eruption');assert.ok(Math.abs(next[0].warning-2.5)<1e-9);c.room={id:'other',props:[],enemies:[]};c.advance(.01);assert.equal(c.api.inspect().active,0);});
check('charge 1.2s, hand-to-gate throw .4s, overhead opening .6s and rain warning 1s precede impact',()=>{const c=fixture();c.frame();const [h]=c.cast();assert.equal(c.api.phase(h).stage,'charge');h.age=1.3;assert.equal(c.api.phase(h).stage,'throw');h.age=1.7;assert.equal(c.api.phase(h).stage,'open');assert.ok(h.warning>=2.8-.001);h.age=h.warning-.01;assert.equal(h.damage,Math.max(27,777*.06));assert.notEqual(c.api.phase(h).stage,'impact');h.age=h.warning+.01;assert.equal(c.api.phase(h).stage,'impact');});
check('native hazard tick gives no warning/outside damage, one impact hit, guard and dodge remain native',()=>{
 for(const mode of ['outside','inside','guard','dodge']){const c=fixture();c.frame();const [h]=c.cast();c.hazards=[h];c.player.x=h.x+(mode==='outside'?h.radius+.001:0);c.player.y=h.y;if(mode==='guard')c.player.guard=true;if(mode==='dodge')c.player.invincible=1;const hp=c.player.hp;c.advance(h.warning-.01);assert.equal(c.player.hp,hp);c.advance(.02);const damage=hp-c.player.hp;assert.ok(Math.abs(damage-(mode==='outside'||mode==='dodge'?0:Math.max(27,777*.06)*.65*(mode==='guard'?.4:1)))<1e-9);const after=c.player.hp;c.advance(.36);assert.equal(c.player.hp,after);}
});
check('original prop/layout/collision unchanged, ghost lasts only through the cast; source picture copies bounded',()=>{const c=fixture();c.frame();const before=JSON.stringify(c.room.props)+JSON.stringify(c.room.exploration);c.cast();c.frame();assert.ok(c.ctx.commands.some(x=>x.owner.kind==='prop'&&x.style.globalAlpha<.5));assert.equal(JSON.stringify(c.room.props)+JSON.stringify(c.room.exploration),before);c.advance(5);c.frame();assert.ok(c.ctx.commands.filter(x=>x.owner.kind==='prop').every(x=>x.style.globalAlpha===1));assert.equal(c.api.inspect().active,0);});
check('mobile takes exactly half, global cap six, death and room changes cancel',()=>{const m=fixture({mobile:true});m.frame();assert.equal(m.cast().length,3);assert.equal(m.hazards.length,3,'discarded native meteors cannot draw or hit');m.advance(.01);assert.equal(m.api.inspect().active,1);assert.ok(m.hazards.every(h=>h.r314Prop?.mode==='rain'),'normal casts never become an A+B mixture');const c=fixture();c.frame();c.cast();const other={...c.boss,id:'other'};c.room.enemies.push(other);c.__STORYWORLD_BOSS_FIELDS_R62__.prepare(other);assert.ok(c.hazards.filter(x=>x.r314Prop).length<=6);c.boss.hp=0;c.advance(.01);assert.equal(c.hazards.filter(x=>x.r314Prop).length,0);});
check('mobile with a single visible prop still converts one meteor instead of dropping the whole attack',()=>{const m=fixture({mobile:true,props:1});m.frame();assert.equal(m.cast().length,1);assert.equal(m.hazards.length,1);});
check('one installation per lifetime, including >60 retries/frames and duplicate script evaluation',()=>{const c=fixture();const fns=[c.tick,c.drawProp,c.drawEnemy,c.drawEffect,c.drawHazard,c.tickHazards];for(let i=0;i<5000;i++)c.api.install();vm.runInContext(src,c);assert.deepEqual([c.tick,c.drawProp,c.drawEnemy,c.drawEffect,c.drawHazard,c.tickHazards],fns);assert.equal(c.api.inspect().stats.installs,1);});
check('existing guide threat scan accepts circular prop hazards without retargeting or field art',()=>{assert.ok(/h\.type!=='field'&&!h\.r314Prop/.test(read('client-source/play-r115.js')));});
check('guide and semi-auto choose a safe route for a prop circle; manual steering keeps control',()=>{for(const mode of ['auto','guide','manual']){const c=fixture();c.frame();const [h]=c.cast();c.hazards=[h];vm.runInContext(read('client-source/play-r115.js'),c);c.__STORYWORLD_PLAY_R115__.set({centre:false,aim:false,spacing:false,sink:false,frontLight:false,samongCluster:false,skillBook:false,walls:false});c[mode==='guide'?'guide':'auto']=true;if(mode==='manual')c.keys.add('ArrowRight');c.advance(.05);assert.equal(c.__STORYWORLD_PLAY_R115__.inspect().failures,0,c.__STORYWORLD_PLAY_R115__.inspect().lastError);if(mode==='manual')assert.equal(c.route.length,0);else{assert.ok(c.route.length>0);assert.ok(Math.hypot(c.route[0].x-h.x,c.route[0].y-h.y)>h.radius+.25);}}});
check('recorded effects draw charge, opening, fall/rise and explosion using existing pictures without recorder errors',()=>{const c=fixture();c.frame();const hs=c.cast();for(const age of [.6,1.4,1.7,2.2,2.7,2.9]){for(const h of hs)h.age=age;c.frame();assert.equal(c.api.inspect().stats.errors,0,c.api.inspect().lastError);assert.ok(c.ctx.commands.some(r=>r.owner.id.startsWith('r314:')));} });
check('pipeline includes R314 immediately before R308 and preserves R308→R298 adjacency and R313',()=>{const idx=read('runtime-text/index.html');assert.ok(idx.includes('<script src="./boss-prop-control-r314.js"></script><script src="./bgm-map-r308.js"></script><script src="./mobile-perf-r298.js"></script>'));assert.ok(idx.indexOf('./hud-bgm-hwando-w-r313.js')<idx.indexOf('./boss-prop-control-r314.js'));});
console.log('R314 '+checks+'/'+checks+' CPU checks; fixtures, no GPU acceptance');
