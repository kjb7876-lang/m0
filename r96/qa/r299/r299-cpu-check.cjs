// R299: env props/decals — placement determinism, per-map caps, no collision data change, door/altar/entry clearance,
// theme gating, asset index. CPU evidence only (no browser/GPU claim).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(R,p),'utf8');
const src=read('client-source/env-props-r299.js');let checks=0;
const check=(n,f)=>{f();checks++;console.log('PASS '+n);};
function world(withR266=false){const store={};const c={console,Math,JSON,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:()=>0,setTimeout:()=>0,performance:{now:()=>0}};
 c.window=c;c.images=[];c.addImage=p=>c.images.push(p);c.readyImage=()=>null;c.drawProp=p=>{c.base=(c.base||0)+1;};c.groundImage=()=>true;
 vm.createContext(c);if(withR266){c.drawObjective=()=>{};vm.runInContext(read('client-source/perf-groups-r266.js'),c);}vm.runInContext(src,c,{filename:'env-props-r299.js'});return c;}
// 40×40 바닥(넓은 방 2개 + 좁은 통로)
function layout(style,mode='indoor'){const cells=[];for(let y=2;y<16;y++)for(let x=2;x<18;x++)cells.push([x,y]);for(let y=8;y<10;y++)for(let x=18;x<26;x++)cells.push([x,y]);for(let y=2;y<16;y++)for(let x=26;x<40;x++)cells.push([x,y]);
 return{floorCells:cells,walls:[{x:0,y:0,w:1,h:1}],worldR74:{style,mode,doors:[{x:18.5,y:9,width:2}]},entry:{x:4.5,y:4.5}};}
const room=(id,style,mode,extra={})=>({id,layer:'STORY',props:[{id:'orig',x:10.5,y:10.5,path:'a.webp',solid:true}],enemies:[],objective:{x:33,y:9},altar:{x:30,y:5},exploration:layout(style,mode),...extra});
const c=world(),A=c.__STORYWORLD_ENV_PROPS_R299__;
check('api exposed, browser/GPU not claimed',()=>{assert.ok(A&&A.plan&&A.themeOf);const i=A.inspect();assert.equal(i.browserVerified,false);assert.equal(i.GPUVerified,false);});
check('theme gating: only hospital/cathedral/forest(outdoor)/samong; unknown style gets nothing',()=>{
 assert.equal(A.themeOf(room('a','clinic')),'hospital');assert.equal(A.themeOf(room('b','cathedral')),'cathedral');
 assert.equal(A.themeOf(room('c','goblin-flute-forest','outdoor')),'forest');assert.equal(A.themeOf(room('c2','goblin-flute-forest','indoor')),null);
 assert.equal(A.themeOf(room('d','x',undefined,{layer:'DREAM'})),'samong');assert.equal(A.themeOf(room('e','machine-core')),null);
 assert.equal(A.plan(room('e','machine-core')).items.length,0);
 assert.equal(A.themeOf(room('f','patient-addiction-city','outdoor')),null);assert.equal(A.themeOf(room('g','clinic-memory','mixed')),'hospital');assert.equal(A.themeOf(room('h','guardian-time-forest','outdoor')),'forest');});
check('deterministic: same room → identical plan; different id → may differ but same caps',()=>{
 for(const s of['clinic','cathedral']){const a=JSON.stringify(A.plan(room('z1',s)).items),b=JSON.stringify(A.plan(room('z1',s)).items);assert.equal(a,b);assert.ok(JSON.parse(a).length>0);}});
check('caps: decal ≤3, prop ≤2, big ≤1, total ≤6 over many seeds/themes',()=>{let n=0;
 for(const[s,m]of[['clinic'],['cathedral'],['goblin-flute-forest','outdoor'],['x',undefined]])for(let i=0;i<60;i++){const r=room('seed'+i,s,m,s==='x'?{layer:'DREAM'}:{}),it=A.plan(r).items,k=t=>it.filter(v=>v.kind===t).length;
  assert.ok(k('decal')<=3&&k('prop')<=2&&k('big')<=1&&it.length<=6,JSON.stringify(it));n+=it.length;
  // theme fit
  const T=A.THEME[A.themeOf(r)];for(const v of it)assert.ok(T[v.kind].includes(v.name),v.name);}
 assert.ok(n>100);});
check('clearance: never within doors/entry/objective/altar radius, never on corridor, spacing ≥4',()=>{
 for(let i=0;i<80;i++){const r=room('c'+i,i%2?'clinic':'cathedral'),it=A.plan(r).items,L=r.exploration;
  for(const v of it){assert.ok(Math.hypot(v.x-18.5,v.y-9)>=4,'door');assert.ok(Math.hypot(v.x-4.5,v.y-4.5)>=3.5,'entry');assert.ok(Math.hypot(v.x-33,v.y-9)>=3.5,'objective');assert.ok(Math.hypot(v.x-30,v.y-5)>=3.5,'altar');
   assert.ok(!(v.x>18&&v.x<26),'corridor');assert.ok(Math.hypot(v.x-10.5,v.y-10.5)>=1.4,'orig prop');}
  for(let a=0;a<it.length;a++)for(let b=a+1;b<it.length;b++)assert.ok(Math.hypot(it[a].x-it[b].x,it[a].y-it[b].y)>=4);}});
check('apply: collision data untouched, added props non-solid/non-interactive, original props kept, idempotent',()=>{
 const r=room('ap','clinic'),L=r.exploration,before=JSON.stringify({f:L.floorCells,w:L.walls,d:L.worldR74.doors});A.apply(r);
 assert.equal(JSON.stringify({f:r.exploration.floorCells,w:r.exploration.walls,d:r.exploration.worldR74.doors}),before);assert.equal(r.exploration,L);
 const own=r.props.filter(p=>p.r299);assert.ok(r.props.some(p=>p.id==='orig'));for(const p of own){assert.equal(p.solid,false);assert.equal(p.interactive,false);assert.equal(p.autoTargetEligible6,false);}
 const n=r.props.length,d=r.r299Decals.length;A.apply(r);assert.equal(r.props.length,n);assert.equal(r.r299Decals.length,d);assert.ok(own.length+d>0);});
check('wall-mounted items sit next to missing floor on -x/-y and flip only on -y walls',()=>{let seen=0;
 for(let i=0;i<200;i++){const r=room('w'+i,'clinic'),F=new Set(r.exploration.floorCells.map(c=>c[0]+','+c[1]));for(const v of A.plan(r).items){if(!A.PROP[v.name]?.wall)continue;seen++;
  const cx=Math.floor(v.x),cy=Math.floor(v.y);assert.ok(!F.has((cx-1)+','+cy)||!F.has(cx+','+(cy-1)));if(v.flip)assert.ok(!F.has(cx+','+(cy-1)));}}assert.ok(seen>0);});
check('draw hook: non-r299 props go to base drawProp; ctx.filter has no blur/drop-shadow',()=>{c.drawProp({id:'x'});assert.equal(c.base,1);assert.ok(!/filter\s*=\s*'[^']*(blur|drop-shadow)/.test(src));assert.ok(!/(blur|drop-shadow)\(/.test(src));});
check('R266 actorsOnTop: actual overlay order draws R299 once before actors, each frame',()=>{
 const w=world(true),events=[];w.room={props:[{id:'r299:test',r299:'prop',path:'assets/r299/bed.webp',x:4,y:5,height:46},{id:'ordinary',x:6,y:7}]};
 w.readyImage=()=>({image:{naturalWidth:64,naturalHeight:64}});w.project=(x,y)=>({x,y});w.player={x:0,y:0};w.ctx={};w.sprite=()=>events.push('prop');
 for(let frame=0;frame<2;frame++){events.length=0;const before=w.base||0;w.drawObjective();events.push('actor');for(const p of w.room.props)w.drawProp(p);assert.deepEqual(events,['prop','actor']);assert.equal(w.base-before,1);}
 w.__STORYWORLD_PERF_GROUPS_R266__.actorsOnTop(false);events.length=0;w.drawObjective();events.push('actor');w.drawProp(w.room.props[0]);assert.deepEqual(events,['actor','prop']);
 w.__STORYWORLD_ENV_PROPS_R299__.set({on:false});events.length=0;w.drawObjective();w.drawProp(w.room.props[0]);assert.deepEqual(events,[]);
 assert.equal(w.__STORYWORLD_ENV_PROPS_R299__.inspect().stats.errors,0);
});
check('flashlight sight culls R299 props on Canvas, with and without R266',()=>{
 for(const withR266 of [false,true]){
  const w=world(withR266),p={id:'r299:sight',r299:'prop',path:'assets/r299/bed.webp',x:4,y:5,height:46};let sprites=0,queries=0,visible=false;
  w.room={props:[p]};w.readyImage=()=>({image:{naturalWidth:64,naturalHeight:64}});w.project=(x,y)=>({x,y});w.player={x:0,y:0};w.ctx={};w.sprite=()=>sprites++;
  w.__STORYWORLD_SIGHT24__={enabled:true,pointVisible:(x,y)=>{queries++;assert.equal(x,p.x);assert.equal(y,p.y);return visible;}};
  const frame=()=>{sprites=0;if(withR266)w.drawObjective();w.drawProp(p);return sprites;};
  assert.equal(frame(),0,'outside flashlight sight must not draw');assert.ok(queries>0);
  visible=true;assert.equal(frame(),1,'inside flashlight sight draws once');
  visible=false;w.__STORYWORLD_SIGHT24__.enabled=false;const before=queries;assert.equal(frame(),1,'disabled sight does not cull');assert.equal(queries,before);
  if(withR266){w.__STORYWORLD_PERF_GROUPS_R266__.actorsOnTop(false);w.__STORYWORLD_SIGHT24__.enabled=true;assert.equal(frame(),0);}
  assert.equal(w.__STORYWORLD_ENV_PROPS_R299__.inspect().stats.errors,0);
 }
});
check('script order: env-props-r299 right before mobile-perf-r298',()=>{assert.ok(/<script src="\.\/env-props-r299\.js"><\/script><script src="\.\/mobile-perf-r298\.js">/.test(read('runtime-text/index.html')));});
check('public asset index contains zero drive-related keys at any depth',()=>{
 const walk=o=>{if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){assert.ok(!/drive|드라이브/i.test(k),'private key: '+k);walk(v);}};
 walk(JSON.parse(read('runtime-text/assets/r299/index.json')));
 const generator=read('../scripts/r299-env-props.py');assert.ok(!/['"][A-Za-z0-9_-]{25,44}['"]/.test(generator),'hardcoded opaque ID in generator');
});
check('asset index: every applied item exists with matching sha256, held list has reasons, no applied cookie',()=>{const ix=JSON.parse(read('runtime-text/assets/r299/index.json'));
 const used=new Set([...Object.keys(A.DECAL),...Object.keys(A.PROP)]);for(const k of used){const it=ix.items[k];assert.ok(it&&it.applied,k);const b=fs.readFileSync(path.join(R,'runtime-text',it.path));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),it.derivedSHA256);assert.ok(b.length<80000);}
 assert.equal(Object.keys(ix.items).length,used.size);assert.equal(Object.keys(ix.items).length+Object.keys(ix.held).length-3,25+2);// v1 25 + v2 5, v2 통과 3종은 v1 보류 기록과 짝for(const[f,h]of Object.entries(ix.held))assert.ok(h.reason&&h.applied===false,f);
 assert.ok(Object.keys(ix.held).filter(f=>/cookie/.test(f)).length===3);});
check('seal-plank (door fragment) never within 6 tiles of a progression door',()=>{let seen=0;for(let i=0;i<300;i++){const r=room('df'+i,'cathedral');for(const v of A.plan(r).items)if(v.name==='seal-plank'){seen++;assert.ok(Math.hypot(v.x-18.5,v.y-9)>=6);}}assert.ok(seen>0);});
check('no asset path is mistaken for a gate/door/stairs by R189 doors',()=>{for(const k of[...Object.keys(A.DECAL),...Object.keys(A.PROP)]){const s='assets/r299/'+k+'.webp';assert.ok(!/(^|[\W_])(gate|door)s?([\W_]|$)/i.test(s)&&!/stair/i.test(s),s);}});
check('big sculptures stand only on fully open 5x5 floor (not against walls — roof/wall tops clip them)',()=>{let seen=0;for(let i=0;i<150;i++){const r=room('b'+i,i%2?'cathedral':'goblin-flute-forest',i%2?undefined:'outdoor'),F=new Set(r.exploration.floorCells.map(c=>c[0]+','+c[1]));for(const v of A.plan(r).items)if(v.kind==='big'){seen++;const cx=Math.floor(v.x),cy=Math.floor(v.y);for(let j=-2;j<=2;j++)for(let k=-2;k<=2;k++)assert.ok(F.has((cx+k)+','+(cy+j)));assert.equal(v.flip,false);}}assert.ok(seen>0);});
console.log('R299 CPU checks passed: '+checks);
