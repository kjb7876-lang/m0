// R241 CPU check: R62 보스 공성(바닥을 상태이상 그림으로 덮는 기술)을 막고, 같은 자리에서 운석 6개를 한 번에 광역으로 떨어뜨린다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('boss-meteor-r241.js'),idx=RT('index.html');
ok('runtime copy matches; loads after auto-levelup-r237 (before combat-r118); in verify list and CI',RT('boss-meteor-r241.js')===src&&/auto-levelup-r237\.js"><\/script>(<script src="\.\/[a-z0-9-]+\.js"><\/script>)*<script src="\.\/boss-meteor-r241\.js"><\/script>/.test(idx)&&idx.indexOf('boss-meteor-r241.js')<idx.indexOf('combat-r118.js')&&/'boss-meteor-r241\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r241\/r241-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
function mk(o={}){const plays=[],draws=[];let natives=0;const owners=new Map();
 const sb={console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Date,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,time:10,uid:100,hazards:[],
  player:{x:20,y:20},room:{engaged:true,enemies:[]},modal:null,loading:false,blocked:o.blocked||(()=>false),clearLine:()=>true,maxHP:()=>777,project:(x,y)=>({x:x*10,y:y*10}),actorHeight:()=>60,sound(){},
  tick(){},effects:[],drawEffect(){sb.__baseEff=(sb.__baseEff||0)+1;},drawHazard(){sb.__baseDraw=(sb.__baseDraw||0)+1;}};
 sb.window.__STORYWORLD_BOSS_FIELDS_R62__=Object.freeze({prepare:()=>{natives++;return {native:true};},ownerState:e=>{let s=owners.get(e);if(!s){s={next:11};owners.set(e,s);}return s;}});
 sb.window.__STORYWORLD_PIXELFX_R163__={has:()=>true,play:(n,x,y,opt)=>plays.push({n,opt})};
 sb.window.__STORYWORLD_FX_SPRITES_R106__={draw:(n,F)=>draws.push(n)};
 sb.window.__STORYWORLD_COMBAT_R114__={palette:()=>({p:[40,90,200],gp:[150,200,255],s:[20,30,80],gs:[90,120,220]})};
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,plays,draws,owners,natives:()=>natives};}
{const {sb,plays}=mk();const boss={id:'b1',boss:true,hp:100,maxHp:100,spawnState:'active',damage:30,x:23,y:20,name:'푸른 왕'};sb.room.enemies.push(boss);
 const r=sb.window.__STORYWORLD_BOSS_FIELDS_R62__.prepare(boss);const hz=sb.hazards.filter(h=>h.r241Meteor);
 ok('the R62 siege slot (R118 boss cycle) now drops exactly 6 meteors instead of covering the floor',r&&r.count===6&&hz.length===6&&!r.native,{r,n:hz.length});
 ok('one meteor lands on the hero, the others spread 1.8–5.6 tiles away and ≥1.6 apart',Math.hypot(hz[0].x-20,hz[0].y-20)<.5&&hz.slice(1).every(h=>{const d=Math.hypot(h.x-20,h.y-20);return d>=1.7&&d<=5.7;})&&hz.every((a,i)=>hz.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>=1.59)),hz.map(h=>[+h.x.toFixed(2),+h.y.toFixed(2)]));
 ok('own hazard type (not \'field\', so R98 rings / R105 field art do not draw over it); warning 1.25–1.95 s, radius 1.25, damage = max(boss×0.9, 6% max HP)',hz.every(h=>h.type==='meteor-r241'&&h.warning>=1.25&&h.warning<=1.95&&h.radius===1.25&&Math.abs(h.damage-Math.max(27,777*.06))<1e-9));
 ok('the pixelfx meteor sheet (thin ellipse ring + its own falling rock) is not used',plays.length===0);}
{const {sb,owners,natives}=mk();const boss={id:'b2',boss:true,hp:100,maxHp:100,spawnState:'active',x:22,y:20};sb.room.enemies.push(boss);
 sb.tick(1/30);ok('R62 internal siege loop is blocked (ownerState.next pushed far away) while the room is engaged',owners.get(boss).next>1e5,owners.get(boss));
 sb.time=20;sb.tick(1/30);ok('the meteor loop casts on its own cadence when the hero is in sight',sb.hazards.filter(h=>h.r241Meteor).length===6&&natives()===0);}
{const {sb,draws}=mk();const flameCols=[];sb.window.__STORYWORLD_FX_SPRITES_R106__.draw=(n,F)=>{draws.push(n);if(n==='flame'||n==='glow')flameCols.push(F.a.join());};const boss={id:'b3',boss:true,hp:100,maxHp:100,spawnState:'active',x:22,y:20};sb.room.enemies.push(boss);sb.window.__STORYWORLD_BOSS_FIELDS_R62__.prepare(boss);
 const h=sb.hazards[0];const sent=sb.effects.find(x=>x.type==='r241-fx');sb.drawHazard(h);h.age=.6;sb.drawEffect(sent);h.age=h.warning+.1;sb.drawEffect(sent);
 ok('a sentinel effect is armed so the 3D recorder draws it in the effect pass; hazard pass draws nothing',!!sent&&!sb.__baseDraw);
 ok('drawn only with painted sprites (smoke/glow/flame/crack) — no ring, rune or circle shapes; base hazard circle not drawn',draws.length>0&&draws.every(n=>['smoke','glow','flame','crack'].includes(n))&&!sb.__baseDraw,draws);
 ok('falling and impact fire use the boss palette colours (name colour), not a fixed orange (glow tones of the boss palette)',flameCols.length>0&&flameCols.every(c=>c==='150,200,255'||c==='90,120,220'),flameCols);}
{const {sb,natives}=mk();sb.window.__STORYWORLD_BOSS_METEOR_R241__.set(false);const boss={id:'b4',boss:true,hp:100,maxHp:100,spawnState:'active',x:22,y:20};const r=sb.window.__STORYWORLD_BOSS_FIELDS_R62__.prepare(boss);
 ok('turning it off restores the original R62 siege',r&&r.native&&natives()===1);}
{const {sb}=mk();const boss={id:'b5',boss:true,hp:100,maxHp:100,spawnState:'active',x:22,y:20};const B=sb.window.__STORYWORLD_BOSS_FIELDS_R62__;const a=B.prepare(boss);sb.time=13;const b2=B.prepare(boss);sb.time=16.1;const c=B.prepare(boss);
 ok('one boss casts at most once every 6 s even when the R118 cycle and the own loop overlap',a&&!b2&&c&&sb.hazards.length===12,{a,b2,c,n:sb.hazards.length});}
ok('Codex #154: damage floor in legacy HP units, one hit per meteor, visuals scale with the effective radius',/__STORYWORLD_HEALTH_R71__\?\.legacyMaxHP\?\.\(player\)/.test(src)&&/h\.r241Meteor&&h\.damage>0&&Number\(h\.lastHit\)>-99\)\{h\.damage=0;/.test(src)&&/Number\(h\.radius\)\|\|RAD\)\/RAD/.test(src));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R241 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
