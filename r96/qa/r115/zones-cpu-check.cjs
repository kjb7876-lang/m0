// R115 CPU checks: 사몽 구역(서브맵). 고정 id, 원문 단서 앵커, 구역 배치의 연결성(입구→출구·단서·저장 등불·
// 상자·순찰 경로·보스 단상), 문틀·벽 높이, 666 을 구역마다 다시 부과하지 않음, R103 흐름 연결(구역 순서·
// 마지막 구역만 다음 장·이전 구역 문·구버전 저장 이전·처치 수 상한). 브라우저 없이 실제 모듈을 돌린다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:()=>null,setItem(){}}};
sb.window=sb;vm.createContext(sb);
for(const f of ['samong-text-r103.js','samong-zones-r115.js','samong-r103.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
const SM=sb.__STORYWORLD_SAMONG_R103__,Z=sb.__STORYWORLD_SAMONG_ZONES_R115__,TX=sb.__STORYWORLD_SAMONG_TEXT_R103__;
check('modules load',SM&&Z&&TX);
check('text is the 총집본',TX.sha256==='4db94112c8b2e8852e5cb988ac79686e57021328eb9364635a2d96af8f15b623');
const chapters=Object.entries(Z.chapters);
check('S-02 pilot has 8 zones',Z.chapter('S-02')?.length===8);
const ids=chapters.flatMap(([k,l])=>l.map(z=>z.id));
check('zone ids fixed and unique (sz115-<장>-<n>)',new Set(ids).size===ids.length&&chapters.every(([k,l])=>l.every((z,i)=>z.id==='sz115-'+k.replace('-','')+'-'+(i+1))),ids.join(','));
check('every chapter key is an R103 episode',chapters.every(([k])=>SM.episodes.some(e=>e.key===k)));
check('kinds known, last zone of a chapter is a confrontation',chapters.every(([k,l])=>l.every(z=>['explore','maze','combat','confront'].includes(z.kind))&&l[l.length-1].kind==='confront'));
check('no zone repeats the 666 goal',chapters.every(([k,l])=>l.every(z=>!(z.goal?.kills>=666))));
check('a chapter mixes several play styles (not one map per stage)',chapters.every(([k,l])=>new Set(l.map(z=>z.kind)).size>=3));
// ---- 원문 앵커 ----
const paras=k=>(TX.sections[k]?.blocks||[]).flatMap(b=>b.paras);
const anchors=[];for(const[k,l]of chapters)for(const z of l){for(const c of z.clues||[])anchors.push([z.id,c]);for(const c of[...(z.cue||[]),...(z.after||[]),z.bossCue,z.patrol?.spotted,...(z.solve?[...z.solve.statements,z.solve.book,z.solve.cut]:[])].filter(Boolean))anchors.push([z.id,c]);}
const miss=anchors.filter(([id,c])=>!paras(c.key).some(p=>p.startsWith(c.sub))).map(([id,c])=>id+':'+c.sub);
check('every clue/cue/statement anchor starts a 총집본 paragraph ('+anchors.length+')',!miss.length&&anchors.length>20,miss.join(' | '));
const order=[];for(const[,c]of anchors.filter(([id])=>id.startsWith('sz115-S02')))order.push(paras(c.key).findIndex(p=>p.startsWith(c.sub)));
const zoneFirst=Z.chapter('S-02').map(z=>{const list=[...(z.cue||[]),...(z.clues||[]),z.bossCue,...(z.solve?z.solve.statements:[])].filter(Boolean);return Math.min(...list.map(c=>paras(c.key).findIndex(p=>p.startsWith(c.sub))));});
const zf=zoneFirst.filter(Number.isFinite);check('S-02 zones follow the text order',zf.length>=7&&zf.every((v,i)=>i===0||v>=zf[i-1]),zoneFirst.join(','));
const used=new Set();for(const[id,c]of anchors.filter(([id])=>id.startsWith('sz115-S02'))){const i=paras(c.key).findIndex(p=>p.startsWith(c.sub));for(let n=0;n<(c.n||1);n++)used.add(i+n);}
check('S-02 zones show every S-02 paragraph ('+used.size+'/'+paras('S-02').length+')',used.size===paras('S-02').length,[...Array(paras('S-02').length).keys()].filter(i=>!used.has(i)).join(','));
// ---- 배치 ----
const ep2=SM.episodes.findIndex(e=>e.key==='S-02');
for(const[k,l]of chapters){const ei=SM.episodes.findIndex(e=>e.key===k);for(const z of l){let L=null,err='';try{L=SM.layoutFor(ei,Z.stageOf(z),z.id);}catch(e){err=String(e);}
 if(!L){check(z.id+' layout builds',false,err);continue;}
 const cells=new Set(L.floorCells.map(([x,y])=>x+':'+y)),on=p=>p&&cells.has(Math.floor(p.x)+':'+Math.floor(p.y));
 const seen=new Set(),q=[[Math.floor(L.entry.x),Math.floor(L.entry.y)]];seen.add(q[0].join(':'));while(q.length){const[x,y]=q.shift();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k2=(x+dx)+':'+(y+dy);if(cells.has(k2)&&!seen.has(k2)){seen.add(k2);q.push([x+dx,y+dy]);}}}
 const reach=p=>on(p)&&seen.has(Math.floor(p.x)+':'+Math.floor(p.y)),x=L.samongR103;
 check(z.id+' layout: id, every floor cell reachable from the entry',L.id===z.id&&seen.size===cells.size,seen.size+'/'+cells.size);
 const goals=[x.exit,x.dais,x.save,...(x.chests||[]),...(x.landings||[]),...(z.clues||[]).map(c=>({x:z.rooms[c.room].x+c.at[0],y:z.rooms[c.room].y+c.at[1]}))].filter(Boolean);
 check(z.id+' exit/dais/lamp/chests/clues on reachable floor ('+goals.length+')',goals.length&&goals.every(reach)&&(x.exit||x.dais),goals.filter(p=>!reach(p)).map(p=>p.x+','+p.y).join(' '));
 if(x.patrol){const bad=[];for(const r of x.patrol)for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.5);for(let t=0;t<=n;t++){const p={x:a.x+(b.x-a.x)*t/n,y:a.y+(b.y-a.y)*t/n};if(!on(p)){bad.push(p.x+','+p.y);break;}}}check(z.id+' patrol routes stay on the floor',!bad.length,bad.join(' '));}
 if(z.kind==='confront')check(z.id+' dais inside the native 30-grid (boss volleys clamp to 3..27)',x.dais&&x.dais.x>6&&x.dais.x<24&&x.dais.y>6&&x.dais.y<24);
 const hs=L.walls.filter(w=>!w.r115Jamb).map(w=>w.height),jam=L.walls.filter(w=>w.r115Jamb);
 check(z.id+' wall heights vary and indoor walls stand above the 2.7 door',new Set(hs).size>=4&&L.walls.filter(w=>!w.r115Jamb&&w.r115?.base>2).every(w=>w.height>=3),[...new Set(hs)].join(','));
 if(L.samongR115.doors)check(z.id+' doors have two jambs taller than the door',jam.length===2*L.samongR115.doors&&jam.every(w=>w.height>2.7));
 check(z.id+' size stays mobile-friendly (≤ 60×60, ≤ 1200 floor cells)',L.bounds[2]<=60&&L.bounds[3]<=60&&L.floorCells.length<=1200,L.bounds+' '+L.floorCells.length);}}
// ---- R103 흐름 ----
const r103=fs.readFileSync(path.join(SRC,'samong-r103.js'),'utf8');
check('save keeps zone fields and migrates old stages into the chapter zones',/s\.zone=typeof v\.zone==='string'/.test(r103)&&/ZN\(\)\.migrate\(EP\[s\.ep\]\.key,s\.stage\)/.test(r103)&&/zone:null,zoneDone:\[\],zoneRead:\[\],zoneSolve:\{\}/.test(r103));
check('VERSION stays 1 (old saves are not reset)',/VERSION=1,GOAL=666/.test(r103));
check('migrate: survival→first zone, maze→first maze zone, ascent→last zone',Z.migrate('S-02','survival')==='sz115-S02-1'&&Z.migrate('S-02','maze')==='sz115-S02-2'&&Z.migrate('S-02','ascent')==='sz115-S02-8'&&Z.migrate('S-03','maze')===null);
check('zone portals go to the next zone; only the last zone enters the next chapter',/if\(n<list\.length-1\)\{go\(x\.ep,null,\{zone:list\[n\+1\]\.id\}\);return;\}/.test(r103)&&/enterEp\(x\.ep\+1\)/.test(r103));
check('previous-zone door exists from the second zone on',/if\(n>0\)\{.*prop\('back'/.test(r103)&&/p\.samongR103==='back'\)\{restoreFlash\(\);return back\(\);\}/.test(r103));
check('kill counter caps at the zone goal, 666 only outside zones',/S\.kills<\(zoneOf\(room\.samongR103\.zone\)\?\(zoneOf\(room\.samongR103\.zone\)\.goal\?\.kills\|\|0\):GOAL\)/.test(r103));
check('resume and retry carry the zone id',/want=\{ep:S\.ep,stage:S\.stage,zone:S\.zone\}/.test(r103)&&/go\(x\.ep,x\.stage,\{zone:x\.zone\}\)/.test(r103));
check('a confrontation solved by statements does not end on HP alone',/!x\.portal&&!z\?\.solve\)\{r\.engaged=false;stageCleared\(r\);\}/.test(r103)&&/b\.hp<f\)\{b\.hp=f;/.test(fs.readFileSync(path.join(SRC,'samong-zones-r115.js'),'utf8')));
check('patrol (순찰자) cannot be killed in the stealth corridor',/e\.hp=e\.maxHp;e\.cd=Math\.max/.test(fs.readFileSync(path.join(SRC,'samong-zones-r115.js'),'utf8')));
check('layout cache stays small',/while\(layouts\.size>6\)/.test(r103));
const failed=results.filter(r=>!r.ok);console.log(JSON.stringify({checks:results.length,failed:failed.length}));process.exitCode=failed.length?1:0;
