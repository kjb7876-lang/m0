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
for(const f of ['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js','samong-r103.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
const SM=sb.__STORYWORLD_SAMONG_R103__,Z=sb.__STORYWORLD_SAMONG_ZONES_R115__,TX=sb.__STORYWORLD_SAMONG_TEXT_R103__;
check('modules load',SM&&Z&&TX);
check('text is the R122 서사 최종검수본',TX.sha256==='390e9e357529a66038d4ffdf77e9b7555183574bac2822ff4b2ba29dff0b296d');
const chapters=Object.entries(Z.chapters);
check('S-02 pilot has 8 zones',Z.chapter('S-02')?.length===8);
check('108 zones over 사몽·역행·엔딩 (설계안 표)',chapters.reduce((n,[,l])=>n+l.length,0)===108&&SM.episodes.every(e=>Z.chapter(e.key)?.length),chapters.map(([k,l])=>k+':'+l.length).join(' '));
const want={P:4,'S-01':5,'S-02':8,'S-03':7,'S-04':14,'S-05':6,'S-06':17,'S-07':3,RA:5,RB:6,RC:6,RD:7,RE:2,RF:3,RG:11,M:4};
check('map count per episode follows the plan (S-04 12~15, S-06 16~20, S-07 3~4 …)',Object.entries(want).every(([k,n])=>Z.chapter(k)?.length===n));
const ids=chapters.flatMap(([k,l])=>l.map(z=>z.id));
check('zone ids fixed and unique (sz115-<장>-<n>)',new Set(ids).size===ids.length&&chapters.every(([k,l])=>l.every((z,i)=>z.id==='sz115-'+k.replace('-','')+'-'+(i+1))),ids.join(','));
check('every chapter key is an R103 episode',chapters.every(([k])=>SM.episodes.some(e=>e.key===k)));
check('kinds known',chapters.every(([k,l])=>l.every(z=>['explore','maze','combat','confront'].includes(z.kind))));
const g666=chapters.flatMap(([,l])=>l.filter(z=>z.goal?.kills>=666).map(z=>z.id));check('666 kills appear once (문턱 · 뿌리가 무너진 뒤), not per map',g666.length===1&&g666[0]==='sz115-P-2'&&Z.zone('sz115-P-2').lead,g666.join(','));
check('a chapter mixes several play styles (not one map per stage)',chapters.every(([k,l])=>l.length<4||new Set(l.map(z=>z.kind)).size>=3));
check('no chapter repeats combat→maze→confront per map',chapters.every(([k,l])=>!l.every((z,i)=>z.kind===['combat','maze','confront'][i%3])));
// ---- 원문 앵커 ----
const paras=k=>(TX.sections[k]?.blocks||[]).flatMap(b=>b.paras);
const anchors=[];for(const[k,l]of chapters)for(const z of l){for(const c of z.clues||[])anchors.push([z.id,c]);for(const c of[...(z.cue||[]),...(z.after||[]),z.bossCue,z.patrol?.spotted,...(z.solve?[...z.solve.statements,z.solve.book,z.solve.cut]:[])].filter(Boolean))anchors.push([z.id,c]);}
const miss=anchors.filter(([id,c])=>!paras(c.key).some(p=>p.startsWith(c.sub))).map(([id,c])=>id+':'+c.sub);
check('every clue/cue/statement anchor starts a 총집본 paragraph ('+anchors.length+')',!miss.length&&anchors.length>20,miss.join(' | '));
const idx=c=>paras(c.key).findIndex(p=>p.startsWith(c.sub));
const SECS=['prelude','threshold','S-01','S-02','S-03','S-04','S-05','NS-01','NS-02','NS-03','NS-04','NS-05','NS-06','NS-07','NS-08','NS-09','NS-10','S-07','R-00','R-01','R-02','R-03','R-04','R-05','R-06','R-07','R-08','R-09','R-10','R-11','R-12','R-13','R-14','R-15','R-16','R-17','M1','M2','M3','epilogue'];
const zoneRefs=z=>[z.patrol?.spotted,...(z.cue||[]),...(z.clues||[]),z.bossCue,...(z.solve?z.solve.statements:[]),...(z.solve?[z.solve.book,z.solve.cut]:[]),...(z.after||[])].filter(Boolean);
const pos=c=>SECS.indexOf(c.key)*1000+idx(c);
const unordered=[];for(const[k,l]of chapters){let last=-1;for(const z of l){const first=Math.min(...zoneRefs(z).map(pos));if(Number.isFinite(first)){if(first<last)unordered.push(z.id);last=first;}}}
check('zones follow the text order in every chapter',!unordered.length,unordered.join(','));
const shown=new Map();for(const[,l]of chapters)for(const z of l)for(const c of zoneRefs(z)){const i=idx(c);for(let n=0;n<(c.n||1);n++){const key=c.key+'#'+(i+n);shown.set(key,(shown.get(key)||0)+1);}}
const holes=[],twice=[];for(const k of SECS)for(let i=0;i<paras(k).length;i++){const v=shown.get(k+'#'+i)||0;if(!v)holes.push(k+'#'+i);}
for(const[k,v]of shown)if(v>1&&!k.startsWith('S-02#'))twice.push(k);
check('every 사몽~종장 paragraph is shown in some zone ('+shown.size+')',!holes.length,holes.slice(0,12).join(' '));
check('generated zones show each paragraph once',!twice.length,twice.slice(0,12).join(' '));
const S02=new Set();for(const z of Z.chapter('S-02'))for(const c of zoneRefs(z)){const i=idx(c);for(let n=0;n<(c.n||1);n++)S02.add(i+n);}
check('S-02 zones show every S-02 paragraph ('+S02.size+'/'+paras('S-02').length+')',S02.size===paras('S-02').length);
// ---- 원문 인물·해법 ----
const conf=chapters.flatMap(([,l])=>l.filter(z=>z.kind==='confront'));
const bossName=z=>(z.boss||SM.episodes.find(e=>Z.chapter(e.key).includes(z)).boss).name;
const ALLOWED=['순찰자','봉합부인','검은 고리','강재헌','교주의 인장','만조','유예관','미명천사','페르소나','백색 손님','재판관','종이 왕','백색 사수','스토리텔러','미카엘라'];
check('confrontations only use figures named in the text (no new bosses)',conf.every(z=>ALLOWED.includes(bossName(z))),conf.map(bossName).join(','));
check('페르소나 and 미카엘라 are never solved by killing (statements + HP floor)',conf.filter(z=>['페르소나','미카엘라'].includes(bossName(z))).length===2&&conf.filter(z=>['페르소나','미카엘라'].includes(bossName(z))).every(z=>z.solve?.statements?.length>=3&&z.solve.floor>=.6));
check('knot/choice confrontations need their steps, not HP alone',conf.every(z=>z.solve&&((z.solve.statements||[]).length||z.solve.hold)));
const gate=Z.zone('sz115-RG-7');check('66 수문장 is a sleeping stealth corridor, not a boss rush',gate?.kind==='maze'&&gate.stealth&&gate.patrol?.sleep&&!gate.boss&&!gate.solve);
const jaein=Z.zone('sz115-S03-3');check('재인과의 대련 has no enemy actor (버티기 only)',jaein?.noMobs&&jaein.goal?.hold&&jaein.hazards&&!jaein.boss);
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
 check(z.id+' wall heights vary and indoor walls stand above the 2.2 door (R116 lower walls)',new Set(hs).size>=4&&L.walls.filter(w=>!w.r115Jamb&&w.r115?.base>2).every(w=>w.height>=2.5),[...new Set(hs)].join(','));
 check(z.id+' backdrop terrain fills the ring around the floor and never covers a floor cell',L.backdropRects?.length>0&&!L.backdropRects.some(b=>L.floorCells.some(([x,y])=>y===b.y&&x>=b.x&&x<b.x+b.width)),String(L.backdropRects?.length));
 if(L.samongR115.doors)check(z.id+' doors have two jambs taller than the door (outdoor: none)',(z.outdoor?jam.length===0:jam.length===2*L.samongR115.doors)&&jam.every(w=>w.height>2.7));
 check(z.id+' size stays mobile-friendly (≤ 66×66 with the backdrop ring, ≤ 1400 floor cells)',L.bounds[2]<=66&&L.bounds[3]<=66&&L.floorCells.length<=1400,L.bounds+' '+L.floorCells.length);}}
// ---- R103 흐름 ----
const r103=fs.readFileSync(path.join(SRC,'samong-r103.js'),'utf8');
check('save keeps zone fields and migrates old stages into the chapter zones',/s\.zone=typeof v\.zone==='string'/.test(r103)&&/ZN\(\)\.migrate\(EP\[s\.ep\]\.key,s\.stage\)/.test(r103)&&/zone:null,zoneDone:\[\],zoneRead:\[\],zoneSolve:\{\}/.test(r103));
check('VERSION stays 1 (old saves are not reset)',/VERSION=1,GOAL=666/.test(r103));
check('migrate: survival→first zone, maze→first maze zone, ascent→last zone',Z.migrate('S-02','survival')==='sz115-S02-1'&&Z.migrate('S-02','maze')==='sz115-S02-2'&&Z.migrate('S-02','ascent')==='sz115-S02-8'&&Z.migrate('S-03','maze')==='sz115-S03-6'&&Z.migrate('P','ascent')==='sz115-P-1');
check('zone portals go to the next zone; only the last zone enters the next chapter',/if\(n<list\.length-1\)\{go\(x\.ep,null,\{zone:list\[n\+1\]\.id\}\);return;\}/.test(r103)&&/enterEp\(x\.ep\+1\)/.test(r103));
check('previous-zone door exists from the second zone on',/if\(n>0\)\{.*prop\('back'/.test(r103)&&/p\.samongR103==='back'\)\{restoreFlash\(\);return back\(\);\}/.test(r103));
check('kill counter caps at the zone goal, 666 only outside zones',/S\.kills<\(zoneOf\(room\.samongR103\.zone\)\?\(zoneOf\(room\.samongR103\.zone\)\.goal\?\.kills\|\|0\):GOAL\)/.test(r103));
check('resume and retry carry the zone id',/want=\{ep:S\.ep,stage:S\.stage,zone:S\.zone\}/.test(r103)&&/go\(x\.ep,x\.stage,\{zone:x\.zone\}\)/.test(r103));
check('a confrontation solved by statements does not end on HP alone',/!x\.portal&&!z\?\.solve\)\{r\.engaged=false;stageCleared\(r\);\}/.test(r103)&&/b\.hp<f\)\{b\.hp=f;/.test(fs.readFileSync(path.join(SRC,'samong-zones-r115.js'),'utf8')));
check('patrol (순찰자) cannot be killed in the stealth corridor',/e\.hp=e\.maxHp;e\.cd=Math\.max/.test(fs.readFileSync(path.join(SRC,'samong-zones-r115.js'),'utf8')));
check('layout cache stays small',/while\(layouts\.size>6\)/.test(r103));
const failed=results.filter(r=>!r.ok);console.log(JSON.stringify({checks:results.length,failed:failed.length}));process.exitCode=failed.length?1:0;
