// R251 발록의 소환진 — 발록이 쓰러지면 dist06 에 부술 수 있는 원거리 탑형 소환진이 남고, 영웅 발밑 육망성 → 빨간 손으로 친다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('summoning-r251.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
function mk(zone='dist06'){const sb={console,Math,JSON,Object,Array,Number,String,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},window:{},time:10,uid:1,layer:'STORY',
  player:{x:20,y:20,hp:500},room:{id:zone,enemies:[{id:'balrog',name:'발록 · 지옥의 문지기',boss:true,x:24,y:20,hp:0,maxHp:10000,damage:50,nav:[1],attack:{a:1}},{id:'m',name:'지옥문 파수악마',x:30,y:30,hp:10,maxHp:10}]},
  hazards:[],effects:[],blocked:()=>false,toasts:[],toast(m){sb.toasts.push(m);},saveGame(){},tick(){},drawEnemy(){return 'base';},drawEffect(){},drawHazard(){return 'base';},
  serializeSave:()=>({v:1}),restoreSave:async raw=>true};
 vm.createContext(sb);vm.runInContext(src,sb);return sb;}
{const sb=mk();sb.tick();const c=sb.room.enemies.find(e=>e.r251Circle);
 ok('Balrog dead in dist06 (STORY) → one "발록의 소환진" spawns where Balrog fell, not a boss, does not move, 12% of Balrog HP',c&&c.name==='발록의 소환진'&&!c.boss&&c.speed===0&&c.maxHp===1200&&Math.hypot(c.x-24,c.y-20)<.01&&sb.room.enemies.filter(e=>e.r251Circle).length===1,c&&{hp:c.maxHp,boss:c.boss});
 sb.tick();ok('spawns only once',sb.room.enemies.filter(e=>e.r251Circle).length===1);
 sb.time=12.6;sb.tick();const h=sb.hazards.find(h=>h.r251);
 ok('casts at the hero: hazard centred on the hero with a 1.2 s warning, radius 1.6, 60% of Balrog damage',h&&h.x===20&&h.y===20&&h.warning===1.2&&h.radius===1.6&&h.damage===30&&h.type==='r251-hands',h);
 ok('engine hazard drawing is skipped for the hands attack (drawn by R251 itself)',sb.drawHazard(h)===undefined&&sb.drawHazard({type:'field'})==='base');
 sb.time=13;sb.tick();ok('next cast waits 5.5 s',sb.hazards.filter(h=>h.r251).length===1);
 sb.player.x=60;sb.time=19;sb.tick();ok('no cast when the hero is farther than 11 tiles',sb.hazards.filter(h=>h.r251).length===1);
 c.hp=0;sb.tick();ok('breaking it marks the save (r251Broken) and shows the canon line',sb.player.r251Broken===true&&sb.toasts.some(t=>/소환진이 깨지며/.test(t))&&sb.serializeSave().r251Broken===true);
 const sb2=mk();sb2.player.r251Broken=true;sb2.tick();ok('a broken circle never comes back',!sb2.room.enemies.some(e=>e.r251Circle));}
{const sb=mk('dist05');sb.tick();ok('only in dist06',!sb.room.enemies.some(e=>e.r251Circle));}
{const sb=mk();sb.layer='DREAM';sb.tick();ok('only in story mode (not DREAM)',!sb.room.enemies.some(e=>e.r251Circle));}
{const sb=mk();sb.room.enemies[0].hp=5;sb.tick();ok('not while Balrog is alive',!sb.room.enemies.some(e=>e.r251Circle));}
{const sb=mk();sb.tick();const c=sb.room.enemies.find(e=>e.r251Circle);ok('drawn by its own sprite, not the Balrog art',sb.drawEnemy(c)===undefined&&sb.drawEnemy({id:'x'})==='base');}
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r251','index.json'),'utf8'));
ok('temporary pixel assets exist with sha256 index (circle 4 frames, hands 8 frames), referenced by the overlay',idx.temporary===true&&['circle.webp','hands.webp'].every(n=>fs.existsSync(path.join(R,'runtime-text','assets','r251',n)))&&/assets\/r251\/circle\.webp/.test(src)&&/assets\/r251\/hands\.webp/.test(src));
ok('runtime copy matches; loads after auto-levelup-r237',RT('summoning-r251.js')===src&&/auto-levelup-r237\.js"><\/script>(<script src="\.\/[a-z0-9-]+\.js"><\/script>)*<script src="\.\/summoning-r251\.js"><\/script>/.test(RT('index.html')));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R251 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
