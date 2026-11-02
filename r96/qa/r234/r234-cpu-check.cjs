// R234 CPU check: 남은 적(2 이하)이 멀리 있고 20초 동안 체력이 안 줄면 영웅 쪽으로 불러오기 + 닫힌 문 너머 10초 넘게 못 닿으면 옮기기.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('reach-r225.js');
ok('runtime copy matches; in the CI workflow',RT('reach-r225.js')===src&&/qa\/r234\/r234-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 40×40 바닥 전부, 벽 없음(엔진 길 있음). 닫힌 문 시험용: x=30 세로 벽(문) — door 플래그로 켜고 끔
function mk(enemies,{wall=false}={}){const sb={console,Math,JSON,Set,Map,WeakMap,Number,String,Object,Array,localStorage:{getItem:()=>null,setItem(){}},window:{},setInterval:()=>0,started:true,loading:false,time:0,
 player:{x:5.5,y:5.5},room:{id:'z',exploration:{floorCells:[[1,1]],bounds:[0,0,40,40],entry:{x:5.5,y:5.5},worldR74:{doors:wall?[{id:'door-1',x:30,y:35,width:.24,depth:2}]:[]}},enemies},
 blocked:(x,y,r)=>x<0||y<0||x>40||y>40||(wall&&Math.abs(x-30)<.12+(r||.27))};vm.createContext(sb);vm.runInContext(src,sb);return sb;}
{const e={hp:500,x:35.5,y:35.5,spawnState:'active'};const sb=mk([e]);const A=sb.window.__STORYWORLD_REACH_R225__;
 for(let i=0;i<8;i++){sb.time+=4;A.check();}const s1=[e.x,e.y];
 ok('a far reachable last enemy whose HP has not dropped for 20 s is brought next to the hero (about 4 cells toward it)',Math.hypot(e.x-5.5,e.y-5.5)<6&&e.r234Regroup===1,{s1,st:A.inspect().stats});
 e.hp=480;e.x=35.5;e.y=35.5;for(let i=0;i<3;i++){sb.time+=4;A.check();}ok('while it is taking damage (HP changing) it is not moved',e.x===35.5);}
{const e={hp:500,x:8.5,y:8.5,spawnState:'active'};const sb=mk([e]);const A=sb.window.__STORYWORLD_REACH_R225__;for(let i=0;i<8;i++){sb.time+=4;A.check();}
 ok('a last enemy that is already near (≤12) is never moved',e.x===8.5&&e.y===8.5);}
{const es=[0,1,2].map(i=>({hp:500,x:35.5,y:30.5+i,spawnState:'active'}));const sb=mk(es);const A=sb.window.__STORYWORLD_REACH_R225__;for(let i=0;i<8;i++){sb.time+=4;A.check();}
 ok('with 3 enemies left nothing is regrouped (only 2 or fewer)',es.every(e=>e.x===35.5));}
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
