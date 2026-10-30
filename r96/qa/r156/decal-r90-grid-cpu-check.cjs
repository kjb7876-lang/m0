// R156 CPU check: R90 바닥 표시 자리의 '가장 가까운 벽 거리'를 격자로 — 2칸 안 값은 모든 벽을 잰 값과 같아야 한다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('visual-r90.js');ok('runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','visual-r90.js'),'utf8')===src);
ok('build uses nearWall (grid) with the old path behind the flag',/const wall=nearWall\(p\);/.test(src)&&/__STORYWORLD_R155_NOGRID__/.test(src));
const fns=src.match(/function segment\(p,a,b\)\{[^\n]*\}\n function wallDistance\(p,w\)\{[\s\S]*?\n \}/)[0];
const gridSrc=src.match(/const NEAR=2,grid=new Map\(\);[\s\S]*?return m;\};/)[0];
const sb={window:{},Math,Number,Array,Map,Infinity};vm.createContext(sb);
vm.runInContext(`const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);${fns};this.mk=(L)=>{${gridSrc};return nearWall;};this.wd=wallDistance;`,sb);
let seed=11;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;let bad=0,n=0;
for(let t=0;t<40;t++){const walls=[];for(let i=0;i<60;i++){if(rnd()<.6){const x=rnd()*60,y=rnd()*60;walls.push({endpoints:[[x,y],[x+(rnd()-.5)*12,y+(rnd()-.5)*12]],depth:rnd()<.5?.24:.5});}else walls.push({x:rnd()*60,y:rnd()*60,width:.5+rnd()*6,depth:.5+rnd()*6});}
 const near=sb.mk({walls});for(let k=0;k<300;k++){const p={x:Math.floor(rnd()*60)+.5,y:Math.floor(rnd()*60)+.5,radius:.32};const all=Math.min(...walls.map(w=>sb.wd(p,w))),g=near(p);n++;
  if(all<=2?g!==all:!(g>1.65))bad++;}}
ok(`grid wall distance equals the all-walls minimum within 2 tiles and stays beyond 1.65 otherwise (${n} random points)`,bad===0,bad);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
