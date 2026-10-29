// R103 CPU checks: maze connectivity and safety, layout contracts, 666 counting rules,
// save cleaning, growth costs and the 777 prescriptions. Runs the shipped modules in a
// stub environment (no browser).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail});};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:()=>null,setItem(){}}};
sb.window=sb;vm.createContext(sb);
for(const f of ['samong-text-r103.js','samong-r103.js','growth-r103.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
const SM=sb.__STORYWORLD_SAMONG_R103__,GR=sb.__STORYWORLD_GROWTH_R103__,TX=sb.__STORYWORLD_SAMONG_TEXT_R103__;
check('modules load',SM&&GR&&TX);
check('16 episodes, last is final',SM.episodes.length===16&&SM.episodes[15].boss.final===true);
check('goal is 666',SM.GOAL===666);
// ---- text ----
const need=['prelude','threshold','S-01','S-02','S-03','S-04','S-05','NS-01','NS-10','S-07','M1','M2','M3','epilogue','record'];
check('narrative sections present',need.every(k=>TX.sections[k]?.blocks?.length),need.filter(k=>!TX.sections[k]).join(','));
const rec=TX.sections.record?.blocks?.[0]?.paras||[];
// R122: 진료기록은 최종검수본의 경과기록 원문 그대로이고, 그 뒤에 새 에필로그(심연의 검사와 닫히는 눈)가 이어진다.
check('record is the final clinical note followed by the epilogue',rec.length>=40&&rec[0].startsWith('정신건강의학과 경과기록')&&rec.includes('에필로그 — 심연의 검사(檢査)와 닫히는 눈')&&rec[rec.length-1].endsWith('연결된 순간이었다.'));
for(const ep of SM.episodes)check('episode text keys exist · '+ep.key,ep.text.every(k=>TX.sections[k]),ep.text.filter(k=>!TX.sections[k]).join(','));
// ---- maze ----
function bfs(L,from,to){const key=(x,y)=>x+':'+y,cells=new Set(L.floorCells.map(([x,y])=>key(x,y)));const s=key(Math.floor(from.x),Math.floor(from.y)),t=key(Math.floor(to.x),Math.floor(to.y));if(!cells.has(s)||!cells.has(t))return -1;
 const seen=new Map([[s,0]]),q=[s];while(q.length){const c=q.shift();if(c===t)return seen.get(c);const[x,y]=c.split(':').map(Number);for(const[a,b]of[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=key(a,b);if(cells.has(k)&&!seen.has(k)){seen.set(k,seen.get(c)+1);q.push(k);}}}return -1;}
let mazes=0,mazeFail=[];
for(let i=1;i<16;i++)for(const seed of [1,7,99,12345,0xdeadbeef,(i*2654435761)>>>0]){const L=SM.mazeLayout(i,SM.episodes[i],seed),x=L.samongR103;mazes++;
 const dExit=bfs(L,L.entry,x.exit),dSave=bfs(L,L.entry,x.save),chest=x.chests.map(c=>bfs(L,L.entry,c));
 const ok=dExit>0&&dSave>=0&&chest.every(d=>d>0)&&x.chests.length===3&&Math.hypot(x.exit.x-L.entry.x,x.exit.y-L.entry.y)>8&&x.pathLength>=8;
 // braided: at least one loop (edges > nodes-1)
 if(!ok)mazeFail.push({i,seed,dExit,dSave,chest,path:x.pathLength});}
check('mazes: start→exit, save and chests reachable ('+mazes+' mazes)',!mazeFail.length,JSON.stringify(mazeFail.slice(0,3)));
{const L=SM.mazeLayout(3,SM.episodes[3],42);let loops=0;const cells=new Set(L.floorCells.map(([x,y])=>x+':'+y));for(const n of L.nodes)if(n.degree>=3)loops++;check('maze has junctions (branches, ways back)',loops>=4,'junctions '+loops);
 const fc=L.floorCells.length,walls=L.walls.length;check('maze layout contract',Array.isArray(L.floorRects)&&L.floorRects.length>0&&walls>0&&L.worldR74&&L.worldR74.style&&L.surface?.art?.path,'floor '+fc+' walls '+walls);}
// survival + ascent
for(const i of [1,8,15]){const L=SM.layoutFor(i,'survival'),x=L.samongR103;check('survival arena reachable from entry · ep'+i,bfs(L,L.entry,x.centre)>0);}
for(const i of [0,4,15]){const L=SM.layoutFor(i,'ascent'),x=L.samongR103;check('ascent: entry→dais path · ep'+i,bfs(L,L.entry,x.dais)>0);
 check('ascent climbs upward (dais above entry on screen) · ep'+i,(x.dais.x+x.dais.y)<(L.entry.x+L.entry.y)-30);
 check('ascent dais inside the native 30-grid · ep'+i,x.dais.x>=3&&x.dais.x<=27&&x.dais.y>=3&&x.dais.y<=27);}
// ---- growth ----
check('skill level cost is k²',[1,2,3,4,5,6,7].every(k=>GR.procCost(k)===k*k));
check('proc chance rises with level and is 0 at level 0',GR.procChance(0)===0&&GR.procChance(1)<GR.procChance(7));
const names=new Set(),ids=new Set();let bad=0;for(let n=0;n<777;n++){const r=GR.rx(n);if(!r||!r.effects.length||!r.text)bad++;names.add(r.name);ids.add(r.id);}
check('777 distinct prescriptions',names.size===777&&ids.size===777&&!bad,'names '+names.size);
check('7 lines × 111 variants',GR.LINES.length===7&&new Set(Array.from({length:777},(_,n)=>GR.rx(n).line)).size===7);
check('out-of-range prescription is null',GR.rx(-1)===null&&GR.rx(777)===null);
check('Michaela every 777 points',GR.MICHAELA_EVERY===777);
// ---- summary ----
const failed=results.filter(r=>!r.ok);
for(const r of results)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.ok||!r.detail?'':' :: '+r.detail));
console.log(JSON.stringify({checks:results.length,failed:failed.length}));
process.exit(failed.length?1:0);
