// R225 CPU check: 못 닿는 적 옮기기(진행 막힘) · 약한 스킬 연출 강화.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const reach=C('reach-r225.js'),boost=C('fx-boost-r225.js'),idx=RT('index.html');
ok('runtime copies match; both load after lag-r217 (before guide-unstick)',RT('reach-r225.js')===reach&&RT('fx-boost-r225.js')===boost&&idx.indexOf('<script src="./lag-r217.js"></script><script src="./reach-r225.js"></script><script src="./fx-boost-r225.js"></script><script src="./guide-unstick-r222.js"></script>')>0);
ok('in the public verify list and the CI workflow',/'reach-r225\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/'fx-boost-r225\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r225\/r225-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 가상 지도 30×20: 왼쪽 큰 방(1..15,1..18), 오른쪽 섬(20..25,5..10) — 벽으로 끊김
const walk=(x,y)=>(x>=1&&x<=15&&y>=1&&y<=18)||(x>=20&&x<=25&&y>=5&&y<=10);
function mk(enemies){const sb={console,Math,JSON,Set,Map,WeakMap,Number,String,Object,Array,localStorage:{getItem:()=>null,setItem(){}},window:{},setInterval:()=>0,
 started:true,loading:false,player:{x:5.5,y:5.5},room:{id:'z',exploration:{floorCells:[[1,1]],bounds:[0,0,30,20],entry:{x:5.5,y:5.5},worldR74:{doors:[]}},enemies},
 blocked:(x,y)=>!walk(Math.floor(x),Math.floor(y))};vm.createContext(sb);vm.runInContext(reach,sb);return sb;}
{const e={hp:5,x:22.5,y:7.5,spawnState:'active'},f={hp:5,x:8.5,y:8.5,spawnState:'active'};const sb=mk([e,f]);sb.window.__STORYWORLD_REACH_R225__.check();
 ok('an enemy on an unreachable island is moved to the nearest reachable cell when few remain',walk(Math.floor(e.x),Math.floor(e.y))&&e.x<16&&e.r225Moved===1,{e});
 ok('a reachable enemy is left where it is',f.x===8.5&&f.y===8.5&&!f.r225Moved);}
{const es=[0,1,2,3].map(i=>({hp:5,x:i?8.5+i:22.5,y:7.5,spawnState:'active'}));const sb=mk(es);sb.window.__STORYWORLD_REACH_R225__.check();
 ok('nothing moves while more than 3 active enemies remain (no cost during normal fights)',es[0].x===22.5&&!es[0].r225Moved);}
{const h={hp:5,x:22.5,y:7.5,spawnState:'hidden'};const sb=mk([h]);sb.window.__STORYWORLD_REACH_R225__.check();ok('hidden enemies are not moved (they appear later)',h.x===22.5);}
{const d={hp:0,x:22.5,y:7.5,spawnState:'active'},a={hp:5,x:8.5,y:8.5,spawnState:'active'};const sb=mk([d,a]);sb.window.__STORYWORLD_REACH_R225__.check();ok('dead enemies are not moved',d.x===22.5);}
ok('reach: can be switched off',/storyworld\.r225\.reach/.test(reach)&&/s\.on===false/.test(reach));
// 연출 강화: 약한 칸만
{const sb={console,Math,JSON,Number,String,Object,Array,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,time:1,player:{hero:'neon',x:0,y:0},room:{enemies:[]}};
 const plays=[];sb.window.__STORYWORLD_PIXELFX_R163__={has:()=>true,play:(n)=>plays.push(n)};sb.window.__STORYWORLD_HERO_FX_R102__={PALETTE:{neon:{a:[0,200,200],b:[200,255,255]},hwando:{a:[200,200,220],b:[255,255,255]}}};
 sb.window.__STORYWORLD_WER__={cast:()=>true};vm.createContext(sb);vm.runInContext('var ego=function(){player.ego=(player.ego||0)+3;return true;};',sb);vm.runInContext(boost,sb);
 vm.runInContext("window.__STORYWORLD_WER__.cast('w');",sb);const n1=plays.length;
 sb.time=2;vm.runInContext("window.__STORYWORLD_WER__.cast('w');",sb);const n2=plays.length;
 sb.time=3;sb.player.hero='hwando';vm.runInContext("window.__STORYWORLD_WER__.cast('w');window.__STORYWORLD_WER__.cast('r');ego();",sb);const n3=plays.length;
 sb.time=4;sb.player.hero='neon';sb.player.ego=0;vm.runInContext("ego();",sb);const n4=plays.length;
 ok('boost: a weak skill (neon Z) adds frame animations',n1>=2,plays);
 ok('boost: strong heroes (hwando Z/C/F) are left as they were',n3===n2,{n2,n3});
 ok('boost: EGO (F) for a weak hero adds its effect',n4>n3,{n3,n4});
 ok('boost: weak table matches the 8-hero comparison',JSON.stringify(vm.runInContext('window.__STORYWORLD_FX_BOOST_R225__.WEAK',sb))===JSON.stringify({neon:'zcf',michaela:'cf',gunner:'zf',lauren:'zf',seoha:'z',hunter:'f'}));}
ok('boost: never touches damage/cooldown (only pixelfx play calls)',!/\.hp\s*[-+]?=|damage|Cooldown\s*=/.test(boost.replace(/\/\/.*$/gm,'')));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
