// R211 CPU check: R204 바위 언덕이 길을 끊지 않는다(이지 모드 자연 진행 dist00 도착 포털 앞 막힘) + 길안내 격자를 거리장 뒤에 다시 잰다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('runtime copies match',RT('cave-r204.js')===C('cave-r204.js')&&RT('polish-r100.js')===C('polish-r100.js'));
ok('R100 exposes resetNav and R204 calls it when a field is built',/resetNav:\(\)=>\{grid=null;\}/.test(C('polish-r100.js'))&&/cache\.set\(ex,F\);try\{window\.__STORYWORLD_POLISH_R100__\?\.resetNav\?\.\(\)/.test(C('cave-r204.js')));
ok('in the CI workflow',/qa\/r211\/r211-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 가상 지형: 방 A — 2칸 목(길이 6) — 방 B — 1.5칸 굽은 목 — 방 C. 바위 언덕·잔물결이 목을 닫기 쉬운 모양.
const cells=[];const rect=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells.push([x,y]);};
rect(3,3,12,12);rect(13,7,18,8);rect(19,3,28,12);rect(23,13,24,16);rect(24,17,25,19);rect(18,20,30,28);
const uniq=[...new Map(cells.map(c=>[c+'',c])).values()];
const layout=()=>({bounds:[0,0,34,32],floorCells:uniq.map(c=>c.slice()),walls:[],entry:{x:6.5,y:6.5},starts:[{x:6.5,y:6.5}]});
const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Int32Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,localStorage:{getItem:()=>null,setItem(){}},
 window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};
vm.createContext(sb);
vm.runInContext(`var room=null,player={x:6.5,y:6.5};function blocked(){return false;}function makeRoom(id){return {id,layer:'STORY',props:[],enemies:[],exploration:__layout()};}async function enterRegion(){return true;}`,sb);
sb.__layout=layout;vm.runInContext(C('cave-r204.js'),sb);
const API=sb.window.__STORYWORLD_CAVE_R204__;
let worst=null;
for(const seed of [0x5d0077,0x5d0124,0x5d0202,0x5d0404,0x123457,0x777]){for(const bulge of [1.1,1.35]){
 const F=API.field(layout(),{seed,bulge,widen:false},[[6.5,6.5,1.6]]),{GW,GH,f,raw}=F,M=8,RR=4,N=GW*GH;
 const idx=(x,y)=>Math.floor((y+M)*RR)*GW+Math.floor((x+M)*RR);
 const bfs=a=>{const seen=new Uint8Array(N),q=[idx(6.5,6.5)];seen[q[0]]=1;while(q.length){const k=q.pop(),i=k%GW,j=(k-i)/GW;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=GW||jj>=GH)continue;const kk=jj*GW+ii;if(!seen[kk]&&a[kk]>=.27){seen[kk]=1;q.push(kk);}}}return seen;};
 const nat=bfs(raw),got=bfs(f);let cut=0;for(let k=0;k<N;k++)if(nat[k]&&!got[k]&&f[k]>=.27)cut++;
 const far=[[24,24],[27,9],[15.5,7.5],[24,15]].filter(([x,y])=>!got[idx(x,y)]);
 if(cut||far.length)worst={seed,bulge,cut,far};}}
ok('no walkable pocket is cut off from the entrance by rock bulges (6 seeds × 2 bulges)',!worst,worst);
// 길찾기(칸 중심 .29+.32)와 실제 이동(.27)이 맞는다: 길로 보이는 이웃 칸 중심 사이 직선에 막힌 점이 없다
{const F=API.field(layout(),{seed:0x5d0077,bulge:1.35,widen:false},[[6.5,6.5,1.6]]),M=8,RR=4,set=new Set(uniq.map(c=>c+''));
 const at=(a,x,y)=>a[Math.floor((y+M)*RR)*F.GW+Math.floor((x+M)*RR)],stop=(x,y,need)=>at(F.f,x,y)<need&&at(F.raw,x,y)-at(F.f,x,y)>.02;let bad=[];
 for(const [cx,cy] of uniq){const ax=cx+.5,ay=cy+.5;if(stop(ax,ay,.61)||at(F.raw,ax,ay)<.29)continue;for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){if(!set.has([cx+dx,cy+dy]+''))continue;const bx=ax+dx,by=ay+dy;if(stop(bx,by,.61)||at(F.raw,bx,by)<.29)continue;
  for(let t=.1;t<.95;t+=.1){const x=ax+dx*t,y=ay+dy*t;if(stop(x,y,.27)&&at(F.raw,x,y)>=.3){bad.push([cx,cy,dx,dy]);break;}}}}
 ok('no hidden rock sliver between two path-free neighbouring cell centres',bad.length===0,bad.slice(0,5));}
// 설정 창 라벨(이지 모드 설정 점검에서 찾은 것)
{const cin=C('cinema-r114.js'),c137=C('combat-r137.js'),mood=C('samong-mood-r123.js'),p111=C('play-r111.js');
 const keys=['facing','resonance777','egoAura','threadArt','props','ranged','guard','samong','shots','bossRoot'];
 ok('R111 setting labels are Korean for every R111 boolean pref',keys.every(k=>new RegExp(k+":'[^']*[가-힣]").test(cin))&&keys.every(k=>new RegExp('\\b'+k+':').test(p111)),keys.filter(k=>!new RegExp(k+":'[^']*[가-힣]").test(cin)));
 ok('R137 labels follow R205 (midboss 50%, echo boss-only)',/중간보스 크기 줄이기\(R205: 50%\)/.test(c137)&&/환영 공격 제한\(R205: 보스만·가끔\)/.test(c137)&&!/중간보스 크기 70%/.test(c137));
 ok('samong mood quick toggle and detailed toggle stay in sync both ways',/r123QuickMood input'\);if\(qm\)qm\.checked=el\.checked/.test(mood));}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
