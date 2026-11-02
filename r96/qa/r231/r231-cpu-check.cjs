// R231 CPU check: 길잡이가 얇은 벽(칸 경계 .24)으로 막힌 주머니에 들어가거나 갇히지 않게 + 닿음 계산이 얇은 벽을 건너뛰지 않게.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const g=C('guide-unstick-r222.js'),rc=C('reach-r225.js');
ok('runtime copies match; in the CI workflow',RT('guide-unstick-r222.js')===g&&RT('reach-r225.js')===rc&&/qa\/r231\/r231-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 지도 20×20: 바닥 전부, 가로 얇은 벽 y=10 (x 0..20) — 단 x 2..3 에 틈. 주머니: x 14..19, y 11..14 를 얇은 벽으로 둘러쌈(틈 없음).
const thin=(x,y,r)=>{if(Math.abs(y-10)<.12+r&&!(x>2-r&&x<3+r))return true;
 const inP=(x>14-r&&x<19+r&&y>11-r&&y<14+r),inside=(x>14+r&&x<19-r&&y>11+r&&y<14-r);if(inP&&!inside&&(Math.abs(x-14)<.12+r||Math.abs(x-19)<.12+r||Math.abs(y-11)<.12+r||Math.abs(y-14)<.12+r))return true;return x<0||y<0||x>20||y>20;};
function guideSb(px,py,enemies){const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,localStorage:{getItem:()=>null,setItem(){}},window:{},guide:true,modal:false,loading:false,time:0,route:[],
 player:{x:px,y:py,hp:5},room:{id:'z',enemies,exploration:{bounds:[0,0,20,20],entry:{x:5.5,y:5.5},worldR74:{doors:[],rooms:[]}}},blocked:(x,y,r)=>thin(x,y,r||.27),interact(){},tick(){}};
 vm.createContext(sb);vm.runInContext(g,sb);return sb;}
{const sb=guideSb(16.5,12.5,[{hp:5,x:5.5,y:5.5,spawnState:'active'}]);
 for(let i=0;i<300;i++){sb.time+=1/30;vm.runInContext('tick()',sb);}
 const st=sb.window.__STORYWORLD_GUIDE_UNSTICK_R222__.inspect().stats;const p=sb.player;
 ok('sealed pocket (thin walls, no gap): the guide is taken out to the nearest cell reachable from the entrance',st.unsealed===1&&!(p.x>14&&p.x<19&&p.y>11&&p.y<14),{st,p});
 ok('…landing on the nearest entrance-connected cell just outside the pocket wall (within 1.5 cells of it)',p.y>14&&p.y<15.6&&p.x>14&&p.x<19,p);}
{const sb=guideSb(16.5,16.5,[{hp:5,x:2.5,y:5.5,spawnState:'active'}]);
 for(let i=0;i<300;i++){sb.time+=1/30;vm.runInContext('tick()',sb);}
 const st=sb.window.__STORYWORLD_GUIDE_UNSTICK_R222__.inspect().stats,p=sb.player;
 ok('open side with no route: it steps along a walkable cell path (through the gap), never across the thin wall',st.escapes>=1&&!st.unsealed&&(p.y>10||(p.x>1.5&&p.x<3.6)),{st,p});}
{const sb=guideSb(16.5,16.5,[]);sb.room.objective={x:5.5,y:5.5};
 for(let i=0;i<300;i++){sb.time+=1/30;vm.runInContext('tick()',sb);}
 const st=sb.window.__STORYWORLD_GUIDE_UNSTICK_R222__.inspect().stats,p=sb.player;
 ok('R232: no live enemies (guide heading to doors/exit) → never pulled toward the room objective',!st.escapes&&!st.unsealed&&p.x===16.5&&p.y===16.5,{st,p});}
ok('the 2-cell hop checks the straight line, not just the end point',/lineFree\(player,q\)/.test(g));
// R225 닿음: 얇은 벽 너머는 닿지 않음
{const sb={console,Math,JSON,Set,Map,WeakMap,Number,String,Object,Array,localStorage:{getItem:()=>null,setItem(){}},window:{},setInterval:()=>0,started:true,loading:false,
 player:{x:5.5,y:5.5},room:{id:'z',exploration:{floorCells:[[1,1]],bounds:[0,0,20,20],entry:{x:5.5,y:5.5},worldR74:{doors:[]}},enemies:[]},blocked:(x,y,r)=>thin(x,y,r||.27)};
 vm.createContext(sb);vm.runInContext(rc,sb);const Rr=sb.window.__STORYWORLD_REACH_R225__.reachOf(sb.room.exploration,true);
 ok('reach: cells behind a thin wall are not counted as reachable (pocket interior unreachable)',!Rr.seen.has('16,12')&&Rr.seen.has('16,16')&&Rr.seen.has('5,5'),{size:Rr.size});}
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
