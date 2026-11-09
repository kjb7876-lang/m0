// R443 CPU check: 초반 야외 지역 높낮이(카메라 쪽 낮은 대지 턱·R100 평판 덮개 숨김) · 바위 끝 둥글게 · 문 둘레 비우기 · 보스는 파란 C 표시(제단) 자리에서 바로.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const FILES=['cave-r204.js','boss-arena-r431.js'];
for(const f of FILES)ok(f+' runtime copy matches',fs.readFileSync(path.join(RT,f),'utf8')===C(f));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
const H=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
ok('runtime-manifest hashes match',FILES.every(f=>M.get(f)===H(f)));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r443/r443-cpu-check.cjs'));
const cave=C('cave-r204.js'),arena=C('boss-arena-r431.js');
ok('no forbidden CSS filters (drop-shadow / ctx.filter blur)',!/drop-shadow|filter\s*=\s*['"][^'"]*blur/.test(cave+arena));
// ---- ① 높낮이 ----
ok('R100 flat hedge lid hidden in organic zones (with edge on), restored by restoreNative',/prefs\.edge!==false&&o\.name==='r100-hedge-top'/.test(cave)&&/function restoreNative/.test(cave));
ok('ground bake: drop-shadow band on floor with rock just camera-side (+x+y)',/EDGE_GROUND=\(\)=>prefs\.edge===false\?'':/.test(cave)&&/fu\+vec2\(0\.55,0\.55\)\/r204Span/.test(cave)&&/\$\{EDGE_GROUND\(\)\}/.test(cave));
ok('plateau top: camera-side plateaus get bright lip + darker body (walkway behind = -x-y)',/EDGE_TOP=\(\)=>prefs\.edge===false\?'':/.test(cave)&&/fu-vec2\(0\.6,0\.6\)/.test(cave)&&/\$\{EDGE_TOP\(\)\}/.test(cave));
ok('shader cache keys change with the edge option',/'r204-ground-v1'\+\(prefs\.edge!==false\?'-r443':''\)/.test(cave)&&/'r204-top-v1'\+\(prefs\.edge!==false\?'-r443':''\)/.test(cave));
ok('no additive grey lift on plateau tops (multiplicative darkening only + lip)',!/vec3\(0\.06,0\.065,0\.075\)/.test(cave));
// ---- ② 둥글게 + ③ 문 둘레 ----
ok('pillars: rounded tip profile and none on low camera-side plateau or in the door band',/\[\[0,1\],\[\.45,\.76\],\[\.74,\.5\],\[\.9,\.3\],\[1,\.02\]\]/.test(cave)&&/nearDoorR443\(F,x,y,true\)\|\|topHeight\(F,cfg,x,y\)<\(cfg\.loTop\+cfg\.hiTop\)\/2/.test(cave));
ok('lone 1-cell pillar next to a door: walls and cell change together in the layout hook (no invisible wall left)',/nx=dePillar\(nx\|\|L,L\)\|\|nx/.test(cave)&&/floorCells:\[\.\.\.ex\.floorCells,\.\.\.addCells\],walls:ex\.walls\.filter/.test(cave));
ok('trees, uprights and boulders keep out of the door band',(cave.match(/nearDoorR443\(F,/g)||[]).length>=4);
(async()=>{
 const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Int32Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,localStorage:{_:{},getItem(k){return this._[k]??null;},setItem(k,v){this._[k]=v;}},
  window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};
 vm.createContext(sb);vm.runInContext(`var room=null,player={x:4.5,y:4.5};function blocked(){return false;}function makeRoom(id){return {id,layer:'STORY',props:[],enemies:[],exploration:null};}async function enterRegion(){return true;}`,sb);
 vm.runInContext(cave,sb);const API=sb.window.__STORYWORLD_CAVE_R204__;ok('cave API + revision',API&&/^R443-/.test(API.revision));
 // 가상 지도: 큰 방 + 가운데로 뾰족하게 파고드는 1칸 폭 바위 혀(양옆이 바닥)
 const cells=[];for(let y=2;y<=22;y++)for(let x=2;x<=26;x++){if(x===14&&y>=2&&y<=12)continue;if((x===13||x===15)&&y<=6)continue;cells.push([x,y]);}
 const ex={bounds:[0,0,30,26],floorCells:cells,walls:[],entrance:{x:4.5,y:20.5},worldR74:{doors:[]}};
 const cfg={seed:0x5d0124,bulge:1.1,loTop:.45,hiTop:1.6};
 API.set({round:false});const F0=API.field(ex,cfg,[[4.5,20.5,1.6]]);API.set({round:true});const F1=API.field(ex,cfg,[[4.5,20.5,1.6]]);
 let leak=0,more=0,less=0;for(let k=0;k<F1.f.length;k++){if(F1.f[k]>0&&F1.raw[k]<=0)leak++;if(F1.f[k]>F0.f[k]+1e-6)more++;if(F1.f[k]<F0.f[k]-1e-6)less++;}
 ok('rounding never shows floor past walkable cells (f>0 ⊆ raw>0)',leak===0,{leak});
 ok('rounding only removes rock (never adds), and does remove some',less===0&&more>0,{more,less});
 const rockOf=F=>{let n=0;for(let k=0;k<F.f.length;k++)if(F.f[k]<0)n++;return n;};
 ok('rounding trims rock by a small share (<4%)',(rockOf(F0)-rockOf(F1))/rockOf(F0)<.04,{r0:rockOf(F0),r1:rockOf(F1)});
 ok('deterministic',(()=>{const G=API.field(ex,cfg,[[4.5,20.5,1.6]]);for(let k=0;k<G.f.length;k+=53)if(G.f[k]!==F1.f[k])return false;return true;})());
 ok('set() accepts edge/round and stores them',(()=>{const p=API.set({edge:false});const q=API.set({edge:true});return p.edge===false&&q.edge===true;})());
 // ---- ④ 보스 등장 자리 ----
 let t=0;const objective={x:15,y:13};let phase='boss';const W={bossBounds:[6,6,26,20],bossAnchor:{x:16,y:13}};
 const mk=()=>({id:'b',boss:true,hp:100,spawnState:'hidden',x:16,y:12,homeX:16,homeY:12,combatProfile:{bodyBlock:{r:.6}}});
 const sb2={window:{__STORYWORLD_WORLD_COMBAT_R78__:{controlled:()=>true,state:()=>({phase})}},localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Date,Promise,layer:'STORY',
  room:{id:'dist00',objective,enemies:[],exploration:{worldWardR81:W},engaged:false,encounterStage:'bossReady'},player:{x:20,y:18.5},
  blocked:(x,y)=>Math.hypot(x-15,y-13)<.3&&false,fx(){},tick(){},drawEnemy(){},drawProjectile(){},drawEffect(){},enterRegion(){},moveAI3(){},
  summon3(list,stage){if(sb2.room.engaged||sb2.room.encounterStage==='summoning')return false;for(const e of list){e.x=e.homeX=sb2.player.x+3;e.y=e.homeY=sb2.player.y-2;e.spawnState='summoning';}/* RC150 처럼 영웅 오른쪽으로 옮김 */sb2.room.encounterStage='summoning';sb2.room.activeEncounter=stage;sb2.room.summonClock=.9;sb2.room.engaged=true;return true;}};
 Object.defineProperty(sb2,'time',{get:()=>t});vm.createContext(sb2);vm.runInContext(arena,sb2);const B=sb2.window.__STORYWORLD_BOSS_ARENA_R431__;
 ok('arena API keeps the R431 revision prefix',B&&B.revision.startsWith('R431'));
 let b=mk();sb2.room.enemies=[b];vm.runInContext(`summon3(room.enemies,'boss')`,sb2);
 ok('boss appears on the blue C marker (room.objective) even after the inner re-placement',b.x===15&&b.y===13&&b.homeX===15,[b.x,b.y]);
 ok('summon wait cut to 0.2 s',sb2.room.summonClock<=.2+1e-9,sb2.room.summonClock);
 // 우두머리가 중간보스뿐인 초반 지역
 Object.assign(sb2.room,{engaged:false,encounterStage:'bossReady'});const m1={...mk(),boss:false,midboss:true,id:'m1'},m2={...mk(),boss:false,midboss:true,id:'m2'};sb2.room.enemies=[m1,m2];vm.runInContext(`summon3(room.enemies,'boss')`,sb2);
 ok('no boss flag: first midboss (room leader) goes to the marker, the other stays where the game put it',m1.x===15&&m1.y===13&&m2.x!==15,[m1.x,m2.x]);
 // 막힌 표시 자리 → 가장 가까운 빈 자리
 Object.assign(sb2.room,{engaged:false,encounterStage:'bossReady'});sb2.blocked=(x,y)=>Math.hypot(x-15,y-13)<.4;b=mk();sb2.room.enemies=[b];vm.runInContext(`summon3(room.enemies,'boss')`,sb2);
 ok('blocked marker → nearest free spot within 3 cells',Math.hypot(b.x-15,b.y-13)>=.4&&Math.hypot(b.x-15,b.y-13)<=3.01,[b.x,b.y]);sb2.blocked=()=>false;
 // 다른 단계·맘몬·끄기·이미 소환 중이면 그대로
 Object.assign(sb2.room,{engaged:false,encounterStage:'bossReady'});b=mk();sb2.room.enemies=[b];vm.runInContext(`summon3(room.enemies,'midboss')`,sb2);ok('other stages untouched',b.x!==15,b.x);
 Object.assign(sb2.room,{engaged:false,encounterStage:'bossReady'});phase='rally';b=mk();sb2.room.enemies=[b];vm.runInContext(`summon3(room.enemies,'boss')`,sb2);ok('only in the R78 boss phase',b.x!==15&&sb2.room.summonClock===.9);phase='boss';
 Object.assign(sb2.room,{id:'ep1b06',engaged:false,encounterStage:'bossReady'});b=mk();sb2.room.enemies=[b];vm.runInContext(`summon3(room.enemies,'boss')`,sb2);ok('Mammon vault excluded',b.x!==15);sb2.room.id='dist00';
 Object.assign(sb2.room,{engaged:false,encounterStage:'bossReady'});B.set({spawn:false});b=mk();sb2.room.enemies=[b];vm.runInContext(`summon3(room.enemies,'boss')`,sb2);ok('off switch {spawn:false}',b.x!==15);B.set({spawn:true});
 Object.assign(sb2.room,{engaged:true,encounterStage:'active'});b=mk();sb2.room.enemies=[b];const r=vm.runInContext(`summon3(room.enemies,'boss')`,sb2);ok('busy room: no move, base refusal passes through',r===false&&b.x===16);
 ok('no runtime errors',B.inspect().stats.errors===0&&!B.inspect().lastError,B.inspect().lastError);
 const bad=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'ok   ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
 console.log('R443 CPU '+(checks.length-bad.length)+'/'+checks.length);if(bad.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
