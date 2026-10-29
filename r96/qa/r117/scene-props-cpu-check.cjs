// R117 CPU check: Drive 2026-10-28 장면 소품(한 번 재생 4키 10종 + 정적 1) — 파일·출처·구역 배치 계획·재생(가까이 오면 K1→K4, K4에서 정지)·표현 전용.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const idx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r117/scene/index.json'),'utf8'));
const png=b=>[b.readUInt32BE(16),b.readUInt32BE(20)];
check('11 tracks (10 one-shot 4-key + 1 static)',idx.tracks.length===11&&idx.tracks.filter(t=>t.oneShot).length===10&&idx.tracks.filter(t=>t.frames===1).length===1);
const bad=[];for(const t of idx.tracks){if(t.files.length!==t.frames)bad.push(t.id+':count');const sizes=new Set();
 for(const f of t.files){const p=path.join(RT,f.path),b=fs.existsSync(p)?fs.readFileSync(p):null;if(!b||crypto.createHash('sha256').update(b).digest('hex')!==f.sha256){bad.push(t.id+':sha');continue;}
  sizes.add(png(b).join('x'));if(!/^[0-9a-f]{64}$/.test(f.source.sha256)||!f.source.zip)bad.push(t.id+':provenance');}
 if(sizes.size!==1||sizes.values().next().value!==t.cell.join('x'))bad.push(t.id+':canvas');
 if(!t.zips.length||!t.zips.every(z=>/^[0-9a-f]{64}$/.test(z.sha256)))bad.push(t.id+':zips');}
check('every frame: recorded sha, one shared canvas per track, Drive provenance',bad.length===0,bad);
check('frames stay small (< 150 kB each, < 1 MB total)',idx.tracks.every(t=>t.files.every(f=>f.bytes<150000))&&idx.tracks.reduce((a,t)=>a+t.files.reduce((b,f)=>b+f.bytes,0),0)<1e6);
const zdata=fs.readFileSync(path.join(SRC,'samong-zones-r115-data.js'),'utf8')+fs.readFileSync(path.join(SRC,'samong-zones-r115.js'),'utf8');
const ids=new Set(idx.tracks.map(t=>t.id));
const sb={console,Math,JSON,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Error,Promise,performance:{now:()=>0},imgs:new Set(),
 player:{x:0,y:0},room:null,addImage:p=>sb.imgs.add(p),readyImage:p=>sb.imgs.has(p)?{image:{}}:null,
 fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(idx)})};
sb.window=sb;const drawn=[];sb.drawProp=function(p){drawn.push(p.path);};sb.enterRegion=async()=>true;sb.restoreSave=async()=>true;
sb.StoryPhase1={explorationBlocked:(L,x,y)=>!L.open(Math.floor(x),Math.floor(y))};
vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(SRC,'scene-props-r117.js'),'utf8'),sb,{filename:'scene-props-r117.js'});
const S=sb.__STORYWORLD_SCENE_PROPS_R117__;
check('plan zones all exist in the zone data and only use known tracks',Object.keys(S.plan).every(z=>zdata.includes("'"+z+"'")||zdata.includes('"'+z+'"'))&&Object.values(S.plan).flat().every(([t])=>ids.has(t)),Object.keys(S.plan).filter(z=>!zdata.includes('"'+z+'"')&&!zdata.includes("'"+z+"'")));
check('every track is used by a zone',[...ids].every(t=>Object.values(S.plan).flat().some(([x])=>x===t)));
const mkRoom=(zone)=>{const cells=[];for(let x=0;x<30;x++)for(let y=0;y<30;y++)cells.push([x,y]);return{id:'r',props:[{id:'a',x:5,y:5}],objective:null,exploration:{entry:{x:2,y:2},floorCells:cells,open:(x,y)=>x>=0&&y>=0&&x<30&&y<30,samongR115:{zone}}};};
(async()=>{await new Promise(r=>setTimeout(r,20));
 check('index loads',S.inspect().state==='ready'&&S.inspect().tracks===11,JSON.stringify(S.inspect()));
 const r=mkRoom('sz115-RD-3');S.dress(r);const sc=r.props.filter(p=>p.r117Scene);
 check('zone gets its planned props (lamp + cloth), presentation-only, off the entry and apart',sc.length===2&&sc.every(p=>p.solid===false&&p.r80PresentationOnly===true&&Math.hypot(p.x-2,p.y-2)>3.4)&&Math.hypot(sc[0].x-sc[1].x,sc[0].y-sc[1].y)>=3,JSON.stringify(sc.map(p=>[p.id,p.x,p.y])));
 check('a zone without a plan is untouched',(()=>{const q=mkRoom('sz115-P-1');S.dress(q);return q.props.length===1&&!q.r117Scene;})());
 const again=r.props.length;S.dress(r);check('dressing twice adds nothing',r.props.length===again);
 const p=sc.find(x=>x.r117Scene.track==='r07-lamp');
 sb.player={x:p.x+10,y:p.y};drawn.length=0;sb.drawProp(p);check('far away: K1 shown',drawn[0]===p.r117Scene.frames[0]);
 sb.player={x:p.x+1,y:p.y};const seq=[];for(let t=0;t<2600;t+=215){sb.performance.now=()=>1000+t;drawn.length=0;sb.drawProp(p);seq.push(p.r117Scene.frames.indexOf(drawn[0]));}
 check('near: plays K1→K4 once and holds K4',seq[0]===0&&seq.slice(-3).every(i=>i===3)&&seq.every((v,i)=>i===0||v>=seq[i-1])&&new Set(seq).size===4,seq);
 sb.player={x:p.x+30,y:p.y};drawn.length=0;sb.drawProp(p);check('walking away keeps K4 (no rewind or loop)',drawn[0]===p.r117Scene.frames[3]);
 const br=mkRoom('sz115-RD-4');S.dress(br);const bp=br.props.find(x=>x.r117Scene);sb.player={x:bp.x,y:bp.y};drawn.length=0;sb.drawProp(bp);check('static brush stays one image',bp.r117Scene.frames.length===1&&drawn[0]===bp.path);
 check('frames are requested for loading',[...sb.imgs].some(x=>x.includes('r07-lamp-k4')));
 check('no failures',S.inspect().failures===0,S.inspect().lastError);
 const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');check('runtime copy matches source and script is in index.html',fs.readFileSync(path.join(RT,'scene-props-r117.js'),'utf8')===fs.readFileSync(path.join(SRC,'scene-props-r117.js'),'utf8')&&html.includes('scene-props-r117.js'));
 console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);})().catch(e=>{console.log('FAIL crashed',e);process.exit(1);});
