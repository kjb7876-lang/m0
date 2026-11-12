// R838 굽기 — 문간을 바꾸면 조형물·몹 자리가 달라지는 문간을 찾아 KEEP_OPEN 표(keep-open.json)를 만든다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r838-passages/passages-bake.mjs   (헤드리스 소프트웨어 렌더)
//  1단계(방 만들기만, 정확): 문간을 하나씩만 바꿔 makeRoom 결과(조형물·몹)를 끈 지도와 비교 → 달라지면 그 문간을 표에 넣는다.
//  2단계(실제 진입, 가구가 다 놓일 때까지 기다림): 표를 적용한 지도와 끈 지도로 각각 새로 들어가 비교 → 남은 차이는 가까운 문간을 표에 더하고 되풀이.
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const ALL='ep1a09,ep1a09b,ep1a10,ep1a11,ep1b02,ep1b03,ep1b04,ep1b05,ep1b07,ep1b09,u201,u202,u204,u205,u206,u203,murder01,murder02,murder04,murder03,cult01,cult02,cult05,cult06,cult03';
const ZONES=(process.env.Z||ALL).split(',');
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,200)));
// 1단계
const stage1=await p.evaluate(zones=>{const A=window.__STORYWORLD_PASSAGES_R838__,out={};
 const snap=r=>[...(r.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)).map(a=>'p:'+[a.id||a.type||a.name||a.path||'?',+a.x.toFixed(2),+a.y.toFixed(2)].join('@')),...(r.enemies||[]).map(e=>'m:'+[e.nativeId||e.id,+e.x.toFixed(1),+e.y.toFixed(1)].join('@')),...stuck(r)].sort().join('|');
 /* 바꾼 지도에서 벽 덩어리 칸에 서 있게 된 조형물·몹(원래 지도에서 놓인 것) */const stuck=r=>{const L=r.exploration,L0=A.source(r.id,L);if(!L0)return[];const f=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),f0=new Set(L0.floorCells.map(c=>c[0]+':'+c[1])),bad=(x,y)=>{for(const[dx,dy]of[[0,0],[.45,0],[-.45,0],[0,.45],[0,-.45]]){const k=Math.floor(x+dx)+':'+Math.floor(y+dy);if(f0.has(k)&&!f.has(k))return true;}return false;};return[...(r.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)&&bad(a.x,a.y)).map(a=>'stuck:p:'+(a.id||a.path)),...(r.enemies||[]).filter(e=>bad(e.x,e.y)).map(e=>'stuck:m:'+e.id)];};
 const mk=(id,o)=>{A.qa(o?{[id]:o}:{});let s=12345;const R=Math.random;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};try{return snap(makeRoom(id,'STORY'));}finally{Math.random=R;A.qa(null);}};
 for(const id of zones){const off=mk(id,null),src=window.__STORYWORLD_EXPLORATION__.layout(id,'STORY'),L=A.source(id,src)||src,keys=A.plan(id,L,{keepOpen:[]}).gaps.filter(g=>g.fill).map(g=>g.key),keep=[];
  for(const k of keys)if(mk(id,{keepOpen:keys.filter(q=>q!==k)})!==off)keep.push(k);
  // 합쳐서 확인: 아직 다르면 남은 문간을 하나씩 더 닫아 본다(둘이 함께일 때만 달라지는 경우)
  let guard=0;while(mk(id,{keepOpen:keep})!==off&&guard++<keys.length){const rest=keys.filter(k=>!keep.includes(k));let found=false;for(const k of rest){if(mk(id,{keepOpen:[...keep,k]})===off){keep.push(k);found=true;break;}}if(!found&&rest.length)keep.push(rest[0]);if(!rest.length)break;}
  out[id]={gaps:keys.length,keep,same:mk(id,{keepOpen:keep})===off};}
 return out;},ZONES);
for(const z of ZONES)console.log('stage1',z,'문간',stage1[z].gaps,'→ 그대로 둘 곳',stage1[z].keep.length,stage1[z].same?'':'(아직 다름)');
const keep=Object.fromEntries(ZONES.map(z=>[z,[...stage1[z].keep]]));
// 2단계
const enter=async(z,o)=>{await go(p,'hub');await p.evaluate(([z,o])=>{window.__STORYWORLD_PASSAGES_R838__.qa(o?{[z]:o}:{});delete world[layerKey(z,'STORY')];let s=12345;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};},[z,o]);await go(p,z);
 // 가구(R224·R449·R523)는 그리는 동안 놓인다 → 조형물 수가 게임 시간 1.2초 동안 그대로일 때까지
 let last=-1,since=await p.evaluate(()=>time);for(let i=0;i<200;i++){await p.waitForTimeout(250);const[n,t]=await p.evaluate(()=>[(room.props||[]).length,time]);if(n!==last){last=n;since=t;}else if(t-since>1.2)break;}
 return p.evaluate(()=>({shaped:!!room.exploration.passagesR838,gaps:(room.exploration.passagesR838?.gaps||[]).filter(g=>g.fill).map(g=>({key:g.key,n:g.n})),props:(room.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)).map(a=>[a.id||a.type||a.name||a.path||'?',+a.x.toFixed(2),+a.y.toFixed(2)].join('@')).filter(k=>!/^r103chest[:@]/.test(k)).sort(),mobs:(room.enemies||[]).map(e=>[e.nativeId||e.id,+(e.homeX??e.x).toFixed(1),+(e.homeY??e.y).toFixed(1)].join('@')).sort()}));};
const diff=(a,bq)=>[...a.filter(k=>!bq.includes(k)),...bq.filter(k=>!a.includes(k))];
const report={};
for(const z of ZONES){const off=await enter(z,null),off2=await enter(z,null),nz=[...diff(off.props,off2.props),...diff(off.mobs,off2.mobs)],noise=nz.length,noisy=new Set(nz.map(k=>k.split('@')[0])),quiet=l=>l.filter(k=>!noisy.has(k.split('@')[0]));/* 들어갈 때마다 자리가 달라지는 것(끈 지도끼리도 다름)은 비교에서 뺀다 */let rounds=0,left=-1,shaped=0;
 for(;rounds<8;rounds++){const on=await enter(z,{keepOpen:keep[z]});shaped=on.gaps.length;const moved=[...diff(quiet(on.props),quiet(off.props)),...diff(quiet(on.mobs),quiet(off.mobs))].map(k=>k.split('@').slice(-2).map(Number));left=moved.length;if(!moved.length||!on.gaps.length)break;
  const gs=on.gaps.map(g=>{const[ax,a,bq]=g.key.split(':'),hz=ax==='h';return{key:g.key,x:hz?+bq+g.n/2:+a+.5,y:hz?+a+.5:+bq+g.n/2,hz,n:g.n};}),dist=(g,m)=>Math.hypot(Math.max(0,Math.abs(m[0]-g.x)-(g.hz?g.n/2:.5)),Math.max(0,Math.abs(m[1]-g.y)-(g.hz?.5:g.n/2)));
  const add=new Set();for(const m of moved){const near=gs.filter(g=>dist(g,m)<4.5);if(near.length)for(const g of near)add.add(g.key);else add.add(gs.slice().sort((q,r)=>dist(q,m)-dist(r,m))[0].key);}for(const k of add)keep[z].push(k);}
 if(left>0){/* 끝내 차이가 남는 지역: 문간을 모두 그대로 둔다 */keep[z]=await p.evaluate(z=>{const A=window.__STORYWORLD_PASSAGES_R838__,L=window.__STORYWORLD_EXPLORATION__.layout(z,'STORY'),src=A.source(z,L)||L;return A.plan(z,src,{keepOpen:[]}).gaps.map(g=>g.key);},z);const on=await enter(z,{keepOpen:keep[z]});left=[...diff(quiet(on.props),quiet(off.props)),...diff(quiet(on.mobs),quiet(off.mobs))].length;shaped=on.gaps.length;}
 report[z]={noise,rounds,left,shaped,keep:keep[z].length};console.log('stage2',z,JSON.stringify(report[z]));}
await p.evaluate(()=>window.__STORYWORLD_PASSAGES_R838__.qa(null));
const table=Object.fromEntries(Object.entries(keep).filter(([,v])=>v.length).map(([z,v])=>[z,[...new Set(v)].sort()]));
fs.writeFileSync(new URL('./keep-open.json',import.meta.url),JSON.stringify(table)+'\n');console.log('KEEP_OPEN',JSON.stringify(table));await b.close();
