// R174 CPU check: 원거리 영웅 황금실(과녁 둘레를 무늬대로 돌며 8번 황금실 발사) · 은색실(원거리 기본 공격 적중 시 은색실 그림).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('hero-threads-r174.js runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','hero-threads-r174.js'),'utf8')===C('hero-threads-r174.js'));
ok('loads after play-r169 (after combat-r160 tags basic shots)',/play-r169\.js"><\/script><script src="\.\/hero-threads-r174\.js"><\/script>/.test(fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8')));
let t=0;const hits=[],fxs=[],baseCasts=[];
const target={id:'e1',x:10,y:10,hp:500};const player={hero:'gunner',x:7,y:10,hp:100};
const gold={learned:true,designs:[{id:'d1',strokes:[[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}]]}],equipped:['d1']};
const sb={window:{__STORYWORLD_DANCES_R74__:Object.freeze({state:()=>gold,stats:()=>({equip:1,cooldown:12,damage:1.2,size:3,speed:1}),cast:(...a)=>{baseCasts.push(a);return 'base';}}),
  __STORYWORLD_PROGRESSION_R62__:{ranks:()=>3,factors:()=>({cooldown:1})}},
 localStorage:{getItem(){return null;},setItem(){}},player,started:true,loading:false,modal:false,effects:[],
 liveEnemies:()=>[target].filter(e=>e.hp>0),attackPower:()=>100,hitEnemy(e,v,src){hits.push([e.id,v,src&&src.kind,src&&src.r174Orbit]);return true;},fx(type,x,y,o){fxs.push([type,o&&o.threadR63&&o.threadR63.r174Mark]);},
 clearLine:()=>true,blocked:()=>false,facing:()=>'right',sound(){},drawEffect(){},tick(){},async enterRegion(){return true;},Math,JSON,Object,Number,Array,Set,WeakMap,String};
Object.defineProperty(sb,'time',{get:()=>t});vm.createContext(sb);vm.runInContext(C('hero-threads-r174.js'),sb);const D=sb.window.__STORYWORLD_DANCES_R74__,X=sb.window.__STORYWORLD_THREADS_R174__;
const r=D.cast('gold',0,null,true);ok('a ranged hero\'s G cast becomes the orbit (R74 cast not called)',r===true&&baseCasts.length===0&&!!X.active());
ok('the cooldown of the design is spent like R74 (time + cooldown)',player.goldenCooldownsR74.d1===12&&player.goldenReadyAtR72===12);
const pos=[];for(let i=0;i<60;i++){t+=.05;vm.runInContext('tick()',sb);pos.push([player.x,player.y]);}
const ds=pos.map(([x,y])=>Math.hypot(x-target.x,y-target.y));
ok('the hero circles the target at a distance (3.5–6 tiles) following the drawn pattern',Math.min(...ds)>=3.5*.74&&Math.max(...ds)<=6.01&&new Set(pos.map(p=>p.map(v=>v.toFixed(1)).join())).size>4,{min:Math.min(...ds),max:Math.max(...ds)});
ok('8 golden-thread shots hit the centred target with the R74 budget split in 8',hits.length===8&&hits.every(h=>h[0]==='e1'&&h[2]==='hero-golden-r72'&&h[3]===true)&&Math.abs(hits[0][1]-100*2*(.22+.018)*5*1.2/8)<1e-9,hits.slice(0,2));
ok('the orbit ends after its duration',!X.active());
player.hero='hwando';t=100;baseCasts.length=0;D.cast('gold',0,null,true);ok('melee heroes keep the R74 dash-through dance',baseCasts.length===1);
player.hero='seoha';sb.hitEnemy(target,5,{r160Basic:true});ok('ranged basic hit draws the silver thread mark on the enemy (threadSlashR63)',fxs.some(f=>f[0]==='threadSlashR63'&&f[1]===true));
const n=fxs.length;sb.hitEnemy(target,5,{r160Basic:true});ok('one mark per enemy per 0.3 s',fxs.length===n);
player.hero='hwando';t+=1;sb.hitEnemy(target,5,{r160Basic:true});ok('melee heroes do not get the ranged silver mark',fxs.length===n);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
