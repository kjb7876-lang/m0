// R105 CPU checks: narrative blueprints cover every episode and stage, every generated layout keeps
// the R103 contracts (entry→goal reachable for any seed, dais inside the boss grid, climb goes up),
// record markers point at real paragraphs and stand on reachable floor, the 777 section table covers
// every text section, and the static prop art files exist. Runs the shipped modules in a stub
// environment (no browser).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source'),ASSET=path.join(__dirname,'..','..','runtime-text');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail:String(detail).slice(0,300)});};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
const scenes=[];
const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:()=>null,setItem(){}},
 playScenes:(list)=>{scenes.push(...list);},escapeHTML:s=>String(s)};
sb.window=sb;vm.createContext(sb);
for(const f of ['samong-text-r103.js','samong-r103.js','growth-r103.js','samong-maps-r105.js','props-static-r105.js','art-drive-r105.js','fx-boss-r105.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
const SM=sb.__STORYWORLD_SAMONG_R103__,M=sb.__STORYWORLD_SAMONG_MAPS_R105__,TX=sb.__STORYWORLD_SAMONG_TEXT_R103__,SP=sb.__STORYWORLD_STATIC_PROPS_R105__;
check('modules load',SM&&M&&TX&&SP&&M.revision==='R105-samong-maps-1'&&M.inspect().failures===0,M&&M.inspect().lastError);
const EP=SM.episodes,BP=M.blueprints,STAGES=i=>i===0?['ascent']:['survival','maze','ascent'];
check('blueprint for every episode and stage',EP.every((e,i)=>STAGES(i).every(s=>BP[e.key]?.[s])),EP.filter((e,i)=>!STAGES(i).every(s=>BP[e.key]?.[s])).map(e=>e.key).join(','));
check('episode 0 has only the boss stage',Object.keys(BP.P).join()==='ascent');
// ---- sections ----
const keys=Object.keys(TX.sections),sec=M.sections();
check('777 section table covers every text section ('+keys.length+')',keys.every(k=>sec.some(s=>s.key===k))&&sec.length===keys.length,keys.filter(k=>!sec.some(s=>s.key===k)).join(','));
check('section targets are valid episode/stage pairs',sec.every(s=>EP[s.ep]&&STAGES(s.ep).includes(s.stage)));
const fallbacks=sec.filter(s=>s.fallback);
check('only paragraph-less sections fall back to the episode start',fallbacks.every(s=>!TX.sections[s.key].blocks.some(b=>b.paras.length)),fallbacks.map(s=>s.key).join(','));
// ---- records point at real paragraphs ----
let badRec=[],subMiss=[];
for(const [k,eps] of Object.entries(BP))for(const [stage,bp] of Object.entries(eps))for(const rec of bp.records||[]){
 const s=TX.sections[rec.key];if(!s){badRec.push(k+'/'+stage+'/'+rec.key);continue;}
 const all=s.blocks.flatMap(b=>b.paras);if(rec.sub&&!all.some(t=>t.startsWith(rec.sub)||t.includes(rec.sub)))subMiss.push(k+'/'+stage+'/'+rec.key+':'+rec.sub);
 const rows=M.rows(rec);if(!rows.length||rows.length>(rec.n||3))badRec.push(k+'/'+stage+'/'+rec.key+' rows '+rows.length);}
check('every record key exists and yields paragraphs',!badRec.length,badRec.slice(0,4).join(' | '));
check('every record substring is found in its section',!subMiss.length,subMiss.slice(0,4).join(' | '));
// ---- layouts ----
function bfs(L,from,to){const key=(x,y)=>x+':'+y,cells=new Set(L.floorCells.map(([x,y])=>key(x,y)));const s=key(Math.floor(from.x),Math.floor(from.y)),t=key(Math.floor(to.x),Math.floor(to.y));if(!cells.has(s)||!cells.has(t))return -1;
 const seen=new Map([[s,0]]),q=[s];while(q.length){const c=q.shift();if(c===t)return seen.get(c);const[x,y]=c.split(':').map(Number);for(const[a,b]of[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=key(a,b);if(cells.has(k)&&!seen.has(k)){seen.set(k,seen.get(c)+1);q.push(k);}}}return -1;}
const onFloor=(L,p)=>L.floorCells.some(([x,y])=>x===Math.floor(p.x)&&y===Math.floor(p.y));
const CELLS=new Set(['oak-closed','oak-open','bronze-closed','bronze-open','ash-tree','pine','stump','ferns','cabinet','empty-bed','workbench','crate','well','statue','obelisk','brazier']);
const LOOKS=new Set(['garden','swamp','cave','ash','coast','stone','forge']);
let lay=[],layFail=[],dressFail=[],outdoorFail=[],markers=0,props=0,outdoorStages=0,art=0;
const S=SM.state();
for(let i=0;i<EP.length;i++)for(const stage of STAGES(i)){
 const seeds=stage==='maze'?[1,7,99,12345,0xdeadbeef,(i*2654435761)>>>0,3,4]:[0];
 for(const seed of seeds){if(stage==='maze'){S.ep=i;S.seed=seed;S.stage='maze';}
  const L=SM.layoutFor(i,stage),x=L.samongR103;lay.push(L.id+':'+seed);const tag=EP[i].key+'/'+stage+'/'+seed;
  if(!L.samongR105){layFail.push(tag+' not R105');continue;}
  if(!(Array.isArray(L.floorRects)&&L.floorRects.length&&L.walls.length&&L.worldR74?.style&&L.surface?.art?.path&&onFloor(L,L.entry)))layFail.push(tag+' contract');
  if(stage==='survival'&&!(bfs(L,L.entry,x.centre)>0))layFail.push(tag+' centre unreachable');
  if(stage==='maze'){const dExit=bfs(L,L.entry,x.exit),dSave=bfs(L,L.entry,x.save),chest=x.chests.map(c=>bfs(L,L.entry,c));if(!(dExit>0&&dSave>=0&&chest.every(d=>d>0)&&x.chests.length===3&&Math.hypot(x.exit.x-L.entry.x,x.exit.y-L.entry.y)>8&&x.pathLength>=8&&x.path.length===x.pathLength))layFail.push(tag+' maze '+JSON.stringify({dExit,dSave,chest,path:x.pathLength}));
   const junctions=L.nodes.filter(n=>n.degree>=3).length;if(junctions<2)layFail.push(tag+' junctions '+junctions);}
  if(stage==='ascent'){if(!(bfs(L,L.entry,x.dais)>0))layFail.push(tag+' dais unreachable');if(!((x.dais.x+x.dais.y)<(L.entry.x+L.entry.y)-30))layFail.push(tag+' not upward');if(!(x.dais.x>=3&&x.dais.x<=27&&x.dais.y>=3&&x.dais.y<=27))layFail.push(tag+' dais outside grid');if(!x.landings.length||!x.landings.every(q=>onFloor(L,q)))layFail.push(tag+' landings');}
  // outdoor stages
  const o=L.samongR105.outdoor;if(o){outdoorStages++;const sc=L.r98Scene;if(!(sc&&sc.applied&&sc.mode==='outdoor'&&LOOKS.has(sc.r105?.family)&&L.worldR74.mode==='outdoor'))outdoorFail.push(tag+' scene');if(o.wall!=null&&!L.walls.every(w=>w.height===o.wall))outdoorFail.push(tag+' walls');}
  // dress a stub room once per stage (first seed)
  if(seed===seeds[0]){const r={id:EP[i].host,layer:'DREAM',exploration:L,props:[],objective:{x:x.exit?.x||x.centre?.x||x.dais?.x,y:x.exit?.y||x.centre?.y||x.dais?.y},samongR103:{ep:i,stage},r99Trees:true};
   M.dress(r,i,stage,EP[i],{});const recs=r.props.filter(p=>p.r105Record),deco=r.props.filter(p=>p.r105Prop);markers+=recs.length;props+=deco.length;
   const want=(BP[EP[i].key][stage].records||[]).reduce((n,rec)=>n+(rec.objects?rec.objects.length:1),0);if(recs.length!==want)dressFail.push(tag+' markers '+recs.length+'/'+want);
   for(const p of r.props){if(p.r105Art){if(!p.path||!fs.existsSync(path.join(ASSET,p.path)))dressFail.push(tag+' art '+p.path);art++;}else if(!CELLS.has(p.r74Prop))dressFail.push(tag+' cell '+p.r74Prop);if(!onFloor(L,p))dressFail.push(tag+' off-floor '+p.id);}
   for(const p of recs){if(bfs(L,L.entry,p)<0)dressFail.push(tag+' marker unreachable '+p.id);for(const g of [x.exit,x.save])if(g&&Math.hypot(g.x-p.x,g.y-p.y)<2)dressFail.push(tag+' marker on goal '+p.id);}
   if(o&&r.r99Trees!==undefined)dressFail.push(tag+' trees not released');
   if(!r.samongR105?.title)dressFail.push(tag+' title');}
 }}
S.ep=0;S.seed=0;S.stage='ascent';
check('all layouts come from R105 blueprints and keep the R103 contracts ('+lay.length+' layouts)',!layFail.length,layFail.slice(0,4).join(' | '));
check('outdoor stages carry a scene, lowered walls and a known family ('+outdoorStages+' stages)',outdoorStages>=8&&!outdoorFail.length,outdoorFail.slice(0,4).join(' | '));
check('markers and props stand on reachable floor with known art ('+markers+' markers, '+props+' props)',!dressFail.length&&markers>=90&&art>=30,dressFail.slice(0,4).join(' | ')+(art<30?' art='+art:''));
// ---- reading a marker shows only the section's paragraphs ----
{const L=SM.layoutFor(2,'maze');const r={id:'ep1a09',layer:'DREAM',exploration:L,props:[],objective:{x:0,y:0},samongR103:{ep:2,stage:'maze'}};M.dress(r,2,'maze',EP[2],{});
 const p=r.props.find(q=>q.r105Record);sb.room=r;const ok=M.use(p);const all=TX.sections[p.r105Record.key].blocks.flatMap(b=>b.paras);
 check('marker read plays its paragraphs verbatim',ok&&scenes.length===1&&scenes[0].text.split('\n\n').every(t=>all.includes(t))&&M.state().read.length===1,JSON.stringify(scenes[0]?.title));
 check('marker read adds no explanation',scenes.length===1&&!/해설|정답/.test(scenes[0].text));}
// ---- 777 panel ----
{const html=M.panelHTML();const eps=(html.match(/<option value="\d+">/g)||[]).length,secs=(html.match(/id="r105Sec"/g)||[]).length;
 check('777 panel lists 16 episodes, 3 stages and every section',eps===16&&secs===1&&html.includes('value="survival"')&&html.includes('value="maze"')&&html.includes('value="ascent"')&&keys.every(k=>html.includes('value="'+k+'"')));
 check('777 object gained samong jumps',sb.__STORYWORLD_CHEAT777__===undefined||typeof sb.__STORYWORLD_CHEAT777__.goSamong==='function');}
// ---- static props ----
const webpSize=b=>{const t=b.toString('ascii',12,16);if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8L'){const v=b.readUInt32LE(21);return[1+(v&0x3fff),1+((v>>14)&0x3fff)];}return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];};
let artMissing=[];for(const [k,a] of Object.entries(SP.art)){const p=path.join(ASSET,a.path);if(!fs.existsSync(p)){artMissing.push(a.path);continue;}const [w,h]=webpSize(fs.readFileSync(p));if(!(w>=256&&h>=256||k==='chain'&&w>=256))artMissing.push(a.path+' '+w+'x'+h);}
check('static prop art files exist',!artMissing.length,artMissing.join(','));
check('static plan: 7 pillars for dist03, weeds and hands for dist02',SP.plan.dist03.some(([k,n])=>k==='pillar'&&n===7)&&SP.plan.dist02.some(([k])=>k==='waterweed')&&SP.plan.dist02.some(([k])=>k==='hands'));
// ---- R103 untouched ----
check('R103 still exposes go/test/inspect',typeof SM.go==='function'&&typeof SM.test.go==='function'&&SM.GOAL===666&&SM.episodes.length===16);
// ---- R105 drive art + boss FX (2026-10-27 batches) ----
{const DA=sb.__STORYWORLD_DRIVE_ART_R105__,FX=sb.__STORYWORLD_BOSS_FX_R105__;
 check('drive art + boss fx modules load',DA?.revision==='R105-drive-art-1'&&FX?.revision==='R105-boss-fx-1'&&DA.inspect().stats.failures===0&&FX.inspect().stats.failures===0,(DA&&DA.inspect().lastError)||(FX&&FX.inspect().lastError));
 const files=new Set();for(const a of Object.values(DA.art))files.add(DA.dir+a.path);for(const A of Object.values(DA.actors))for(const f of Object.values(A))files.add(DA.dir+f);for(const f of DA.teapot)files.add(DA.dir+f);
 for(const f of ['fx-thread.webp','fx-ink-hook.webp','fx-keys-flight.webp','fx-dali-1.webp','fx-dali-2.webp','fx-dali-3.webp','fx-monet-1.webp','fx-monet-2.webp','fx-monet-3.webp'])files.add(DA.dir+f);
 const missing=[...files].filter(f=>!fs.existsSync(path.join(ASSET,f)));check('drive art files exist ('+files.size+')',!missing.length,missing.join(','));
 const badPlan=Object.keys(DA.plan).filter(k=>{const[i,st]=k.split(':');return !(SM.episodes[+i])||!['survival','maze','ascent'].includes(st);});check('drive art plan keys valid',!badPlan.length,badPlan.join(','));
 const donors=SM.episodes.map(e=>e.boss.donor[1]),noPal=donors.filter(id=>!FX.palette[id]);check('boss palette covers all 16 samong bosses',!noPal.length,noPal.join(','));
 const bad=Object.entries(FX.palette).filter(([,p])=>!['fire','frost','corruption','shock'].includes(p.elem)||!['fireball','meteor','comet','thread'].includes(p.style)||p.a.length!==3||p.b.length!==3);check('palette entries well formed',!bad.length,bad.map(b=>b[0]).join(','));
 // place() on a fake room: props land on the handed-over spots, teapot picks a spot 3.5+ tiles from the dais
 const fake={id:'fake',props:[]},deco=Array.from({length:12},(_,k)=>({x:10+k*2,y:20})),n=DA.place(fake,1,'ascent',SM.episodes[1],{deco,dais:{x:10,y:20}});
 const tea=fake.props.find(p=>p.r105Teapot);check('place() dresses S-01 ascent (teapot + gardener)',n===2&&fake.props.length===2&&tea&&Math.hypot(tea.x-10,tea.y-20)>3.5&&fake.props.every(p=>p.solid===false&&p.path.startsWith(DA.dir)),JSON.stringify(fake.props.map(p=>[p.r105Art,p.x,p.y])));
 const stages=[];for(const k of Object.keys(DA.plan)){const[i,st]=k.split(':');const f={id:'f'+k,props:[]};const got=DA.place(f,+i,st,SM.episodes[+i],{deco:Array.from({length:20},(_,q)=>({x:5+q,y:5+(q%3)})),dais:{x:5,y:5}});stages.push([k,got,f.props.length]);}
 check('place() fills every planned stage',stages.every(([k,got,len])=>got>0&&got===len&&got===DA.plan[k].reduce((a,[,c])=>a+c,0)),JSON.stringify(stages));}
// ---- summary ----
const failed=results.filter(r=>!r.ok);
for(const r of results)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.ok||!r.detail?'':' :: '+r.detail));
console.log(JSON.stringify({checks:results.length,failed:failed.length}));
fs.writeFileSync(path.join(__dirname,'samong-maps-cpu-results.json'),JSON.stringify({revision:'r105-samong-maps-cpu',results,passed:!failed.length},null,1));
process.exit(failed.length?1:0);
