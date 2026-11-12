// R839 굽기 — 바위턱 후보(plan) 가운데 조형물·몹 자리를 바꾸거나 덮는 턱을 빼고 남은 사각형을 TABLE 로 적는다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [Z=dist00,…] [OUT=table.json] node r96/qa/r839-outcrops/outcrops-bake.mjs   (헤드리스 소프트웨어 렌더)
//  지역마다: 끈 지도로 두 번 들어가 들어갈 때마다 달라지는 것(흔들림)을 가려낸 뒤, 후보를 입힌 지도로 들어가 끈 지도와 비교한다.
//  자리가 달라진 조형물·몹 가까이(6칸)의 턱과, 조형물·몹을 덮거나 바짝 붙은(1칸) 턱을 빼고 되풀이한다. 끝내 차이가 남으면 그 지역은 턱을 두지 않는다.
//  야외 흩뿌림 장식(REROLL: R81 장면 소품·R299 유품·R74 풍경·R99 나무·R103 상자)은 바닥 칸 목록으로 자리를 뽑기 때문에 턱이 어디에 있든 지도 전체에서 다시 뽑힌다(실측: kair04·last304 턱 하나에 13~21점).
//  이들은 같은 배치 규칙으로 다시 놓인 것이므로 '달라짐'으로 세지 않고, 대신 바닥 위에 있고 턱에 닿지 않는지만 본다(STRICT=1 이면 이들도 같은 자리여야 한다).
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const ALL='dist00,dist02,dist03,dist04,dist05,dist06,ep1b06b,last304,last305,kair04,kair05,kair06,kair08,kair09,kair10';
const ZONES=(process.env.Z||ALL).split(','),OUT=process.env.OUT||'table.json',NEAR=6,TOUCH=1;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,200)));
const enter=async(z,o)=>{await go(p,'hub');await p.evaluate(([z,o])=>{window.__STORYWORLD_OUTCROPS_R839__.qa(o?{[z]:o}:{});delete world[layerKey(z,'STORY')];let s=12345;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};},[z,o]);await go(p,z);
 let last=-1,since=await p.evaluate(()=>time);for(let i=0;i<200;i++){await p.waitForTimeout(250);const[n,t]=await p.evaluate(()=>[(room.props||[]).length,time]);if(n!==last){last=n;since=t;}else if(t-since>1.2)break;}
 return p.evaluate(()=>({blocks:(room.exploration.outcropsR839?.blocks||[]).map(b=>({key:b.key,rects:b.rects})),skipped:room.exploration.outcropsR839?.skipped||0,
  props:(room.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)).map(a=>[a.id||a.type||a.name||a.path||'?',+a.x.toFixed(2),+a.y.toFixed(2)].join('@')).filter(k=>!/^r103chest[:@]/.test(k)).sort(),
  mobs:(room.enemies||[]).map(e=>[e.nativeId||e.id,+(e.homeX??e.x).toFixed(1),+(e.homeY??e.y).toFixed(1)].join('@')).sort()}));};
const diff=(a,q)=>[...a.filter(k=>!q.includes(k)),...q.filter(k=>!a.includes(k))],xy=k=>k.split('@').slice(-2).map(Number);
const dist=(bl,m)=>Math.min(...bl.rects.map(([x,y,w,d])=>Math.hypot(Math.max(x-m[0],0,m[0]-x-w),Math.max(y-m[1],0,m[1]-y-d))));
const REROLL=process.env.STRICT==='1'?/^$/:/^(r81:scene:|r299:|r74:[^@]*:scenery|r99:tree:|r103chest:)/,fix=l=>l.filter(k=>!REROLL.test(k));
const table={},report={};
for(const z of ZONES){const off=await enter(z,null),off2=await enter(z,null),nz=[...diff(off.props,off2.props),...diff(off.mobs,off2.mobs)],noisy=new Set(nz.map(k=>k.split('@')[0])),quiet=l=>fix(l).filter(k=>!noisy.has(k.split('@')[0]));
 const drop=[];let rounds=0,left=-1,on=null,first=0;
 for(;rounds<10;rounds++){on=await enter(z,{plan:true,drop});if(!rounds)first=on.blocks.length;if(!on.blocks.length){left=0;break;}
  const moved=[...diff(quiet(on.props),quiet(off.props)),...diff(quiet(on.mobs),quiet(off.mobs))].map(xy),things=[...on.props,...on.mobs,...off.props,...off.mobs].map(xy),add=new Set();left=moved.length;
  for(const bl of on.blocks)if(things.some(m=>dist(bl,m)<TOUCH)||moved.some(m=>dist(bl,m)<NEAR))add.add(bl.key);
  if(moved.length&&!add.size)add.add(on.blocks.slice().sort((q,r)=>Math.min(...moved.map(m=>dist(q,m)))-Math.min(...moved.map(m=>dist(r,m))))[0].key);
  if(!add.size)break;for(const k of add)drop.push(k);}
 // 확인: 고른 사각형 그대로(표 방식) 다시 들어가 같은지
 let keep=left===0?on.blocks.map(bl=>bl.rects):[],ok=true;
 if(keep.length){const chk=await enter(z,{blocks:keep.map(r=>r.length===1?r[0]:r)});const m2=[...diff(quiet(chk.props),quiet(off.props)),...diff(quiet(chk.mobs),quiet(off.mobs))];ok=!m2.length&&chk.blocks.length===keep.length&&!chk.skipped;if(!ok)keep=[];}
 if(keep.length)table[z]=keep.map(r=>r.length===1?r[0]:r);
 report[z]={rerolled:on?diff(on.props.filter(k=>REROLL.test(k)),off.props.filter(k=>REROLL.test(k))).length/2:0,noise:nz.length,candidates:first,rounds,dropped:drop.length,left,kept:keep.length,ok};console.log('bake',z,JSON.stringify(report[z]));}
await p.evaluate(()=>window.__STORYWORLD_OUTCROPS_R839__.qa(null));
fs.writeFileSync(new URL('./'+OUT,import.meta.url),JSON.stringify(table)+'\n');console.log('TABLE',JSON.stringify(table));await b.close();
