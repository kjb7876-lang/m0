// R155 CPU check: 바닥 얼룩·등불 자리(R92)의 '가까운 벽' 찾기를 격자로 — 2칸 안 결과는 옛 방식과 같아야 한다.
// 같은 격자·거리 규칙을 R92 코드에서 그대로 떼어 와, 무작위 벽·점으로 옛 방식(모든 벽)과 비교한다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('visual-r92.js');ok('runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','visual-r92.js'),'utf8')===src);
ok('grid path with the old path kept behind a flag',/__STORYWORLD_R155_NOGRID__/.test(src)&&/const NEAR=2,grid=new Map\(\)/.test(src));
const closestSrc=src.match(/function closest\(p,w\)\{[\s\S]*?return\{d:Math\.hypot\(p\.x-cx,p\.y-cy\),x:cx,y:cy\};\}/)[0];
const gridSrc=src.match(/const NEAR=2,grid=new Map\(\);[\s\S]*?nearCache\.set\(k,n\);return n;\};/)[0];
const sb={window:{},Math,Number,Array,Set,Map};vm.createContext(sb);
vm.runInContext(`const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);${closestSrc};this.mk=(L)=>{${gridSrc};return near;};this.closest=closest;`,sb);
let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;let worst=0,mismatch=0,checked=0;
for(let t=0;t<40;t++){const walls=[];for(let i=0;i<60;i++){if(rnd()<.6){const x=rnd()*60,y=rnd()*60,dx=(rnd()-.5)*12,dy=(rnd()-.5)*12;walls.push({endpoints:[[x,y],[x+dx,y+dy]],depth:rnd()<.5?.24:.5});}else walls.push({x:rnd()*60,y:rnd()*60,width:.5+rnd()*6,depth:.5+rnd()*6});}
 const near=sb.mk({walls});for(let k=0;k<300;k++){const p={x:Math.floor(rnd()*60)+.5,y:Math.floor(rnd()*60)+.5};let n={d:Infinity,x:p.x,y:p.y};for(const w of walls){const c=sb.closest(p,w);if(c&&c.d<n.d)n=c;}
  const g=near(p);checked++;if(n.d<=2){if(g.d!==n.d||g.x!==n.x||g.y!==n.y)mismatch++;}else if(!(g.d>1.8)){mismatch++;}}}
ok(`grid nearest wall equals the all-walls answer within 2 tiles and stays "far" beyond (${checked} random points)`,mismatch===0,mismatch);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
