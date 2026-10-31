// R123 CPU check: 사몽 구역 분위기(samong-mood-r123.js). 브라우저 없이 실제 구역 배치(R115/R103)를 만들어
// 감정의 탑 층 번호(공터·1F~16F), 네오 서울 연도·시대 교차, 장미의 집·밤의 학교·화가 화풍 배정, 조형물이 바닥 위·입구/출구에서 떨어진 자리에
// 표현 전용으로 놓이는지, 바닥 무늬를 색별로 묶어 그리는지(그리기 명령 수 상한), 렌더러가 지원하는 그리기 함수만 쓰는지,
// 설정으로 끄면 그리지 않는지, 새 파일이 빌드·공개 확인·CI 에 등록됐는지 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text'),REPO=path.join(ROOT,'..');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,400)));};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
const store=new Map();
const sb={console,Math,JSON,Date,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,TypeError,Promise,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},
 localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))}};
sb.window=sb;vm.createContext(sb);
for(const f of ['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js','samong-r103.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
// 그리기 환경: 렌더러(phase1 DrawCommands)에 실제로 있는 함수만 둔다 — 없는 함수(strokeRect 등)를 부르면 실패한다.
const ALLOWED=['save','restore','setTransform','resetTransform','transform','translate','rotate','scale','getTransform','point','beginPath','moveTo','lineTo','closePath','rect','ellipse','arc','quadraticCurveTo','bezierCurveTo','roundRect','clip','fill','stroke','fillRect','clearRect','drawImage','fillText','measureText','createRadialGradient','createLinearGradient','scope'];
const phase1=fs.readFileSync(path.join(RT,'dist','phase1.js'),'utf8');
const missing=ALLOWED.filter(m=>!['scope'].includes(m)&&!new RegExp('\\n\\s*'+m+'\\(').test(phase1));
check('mock drawing API mirrors the renderer DrawCommands methods',missing.length===0,missing.join(','));
const cmds=[];const grad=()=>({addColorStop(){}});
const ctx={commands:cmds};for(const m of ALLOWED)ctx[m]=function(...a){if(['fill','stroke','fillRect','fillText','drawImage'].includes(m))cmds.push(m);if(m==='createRadialGradient'||m==='createLinearGradient')return grad();if(m==='measureText')return{width:10};if(m==='scope')return a[1]();if(m==='point')return[0,0];};
const ctxProxy=new Proxy(ctx,{get(t,k){if(k in t)return t[k];if(typeof k==='string'&&/^[a-z][A-Za-z]+$/.test(k)&&!['fillStyle','strokeStyle','lineWidth','lineCap','lineJoin','globalAlpha','font','textAlign','textBaseline','globalCompositeOperation','then'].includes(k))throw new TypeError('ctx.'+k+' is not a function (not in the renderer)');return undefined;},set(t,k,v){t[k]=v;return true;}});
Object.assign(sb,{ctx:ctxProxy,TILE:34,zoom:1,W:1280,H:800,time:10,started:true,layer:'DREAM',modal:false,storyScene:null,loading:false,settings:{lowFx:false},
 project:(x,y)=>({x:(x-y-sb.cam.x+sb.cam.y)*34+640,y:(x+y-sb.cam.x-sb.cam.y)*17+416}),cam:{x:0,y:0},player:{x:0,y:0},room:null,
 shadow(){cmds.push('shadow');}});
const baseProps=[];sb.drawProp=function(p){baseProps.push(p.id);};sb.drawExits=function(){};sb.showSettings=function(){};
vm.runInContext(fs.readFileSync(path.join(SRC,'samong-mood-r123.js'),'utf8'),sb,{filename:'samong-mood-r123.js'});
const M=sb.__STORYWORLD_MOOD_R123__,Z=sb.__STORYWORLD_SAMONG_ZONES_R115__,SM=sb.__STORYWORLD_SAMONG_R103__;
check('module loads',M&&M.revision==='R123-mood-1'&&Z&&SM);
const ids=Object.values(Z.chapters).flatMap(l=>l.map(z=>z.id));
const T=Object.fromEntries(ids.map(id=>[id,M.themeOf(id)]));
// ---- 감정의 탑 ----
const tower=ids.filter(id=>id.startsWith('sz115-S04-'));
check('S-04: all 14 zones are tower zones',tower.length===14&&tower.every(id=>T[id]?.key==='tower'));
check('S-04: 공터 is outside (G), 로비 is 1F, last zone is 16F',T['sz115-S04-1'].floors.list[0]==='G'&&T['sz115-S04-2'].floors.list[0]===1&&T['sz115-S04-14'].floors.list.join()==='16');
const allFloors=new Set(tower.flatMap(id=>T[id].floors.list).filter(f=>f!=='G'));
check('S-04: floors 1F~16F each shown somewhere in the tower',[...Array(16)].every((_,i)=>allFloors.has(i+1)),[...allFloors].join(','));
check('S-04: multi-floor tower rooms read 8·9F and 10·11·12F from the title',T['sz115-S04-9'].floors.list.join()==='8,9'&&T['sz115-S04-10'].floors.list.join()==='10,11,12');
check('higher floor → darker/narrower (height grows with floor)',M.heightOf('G')===0&&M.heightOf(1)<M.heightOf(8)&&M.heightOf(8)<M.heightOf(16)&&M.heightOf(16)===1);
// ---- R180: S-06 디스토피아(DYS-01~13) — 네오 서울(NS-xx)은 정본에서 삭제됨 ----
const ns=ids.filter(id=>id.startsWith('sz115-S06-'));
check('S-06: every zone is tied to its DYS section (DYS-01~DYS-13)',ns.length===23&&ns.every(id=>/^DYS-(0[1-9]|1[0-3])$/.test(T[id]?.sec||'')),ns.map(id=>T[id]?.sec).join(','));
const yr=sec=>T[ns.find(id=>T[id].sec===sec)].ns;
check('DYS banners show the canon section title (no invented years)',yr('DYS-01').year===null&&yr('DYS-01').label==='침공'&&yr('DYS-13').label==='기록이 끝난 자리',JSON.stringify([yr('DYS-01'),yr('DYS-13')]));
const eras=ns.map(id=>T[id].key);let switches=0;for(let i=1;i<eras.length;i++)if(eras[i]!==eras[i-1])switches++;
check('eras (기계 폐허 · 데이터 · 원룸의 빛) alternate across the 23 zones',['machine','data','forest'].every(e=>eras.includes(e))&&switches>=6,eras.join(' '));
// ---- 장미의 집 · 학교 · 호러 만화 · 화가 ----
check('S-01 → rose (뒤틀린 동화), S-02 8 zones → school, S-03 → ink(흑과 백), S-05 → gyeong(경성의 밤), M → manga',ids.filter(i=>i.startsWith('sz115-S01-')).every(i=>T[i].key==='rose')&&ids.filter(i=>i.startsWith('sz115-S02-')).length===8&&ids.filter(i=>i.startsWith('sz115-S02-')).every(i=>T[i].key==='school')&&ids.filter(i=>/^sz115-S03-/.test(i)).every(i=>T[i].key==='ink')&&ids.filter(i=>/^sz115-S05-/.test(i)).every(i=>T[i].key==='gyeong')&&ids.filter(i=>/^sz115-M-/.test(i)).every(i=>T[i].key==='manga'));
const painterOf=sec=>T[ids.find(id=>T[id]?.sec===sec&&T[id].painter)]?.key;
check('six painters by canon chapter: R-02 고흐 · R-03 달리 · R-04 마네 · R-05 피카소 · R-06 클림트 · R-07 모네',painterOf('R-02')==='gogh'&&painterOf('R-03')==='dali'&&painterOf('R-04')==='manet'&&painterOf('R-05')==='picasso'&&painterOf('R-06')==='klimt'&&painterOf('R-07')==='monet');
const P6=['gogh','dali','manet','picasso','klimt','monet'];
check('the six painter looks differ in colour, floor brushwork and props',new Set(P6.map(k=>M.themes[k].tint[0])).size===6&&new Set(P6.map(k=>M.themes[k].floor.join())).size===6&&new Set(P6.map(k=>M.themes[k].deco.map(d=>d[0]).join())).size===6);
check('surreal motifs present (녹는 시계 · 떠 있는 돌 · 끝없는 회랑)',['clock','stone','endless'].every(k=>Object.values(M.themes).some(t=>t.deco.some(d=>d[0]===k)))&&['clock','stone','endless'].every(k=>typeof M.draw[k]==='function'));
const rg=ids.filter(id=>/^sz115-R[A-G]-/.test(id));
check('every 화가 zone (RA~RG, 42 — R180 R-10 4구역) gets a painter or surreal look',rg.length===42&&rg.every(id=>T[id]?.painter&&M.themes[T[id].key]),rg.filter(id=>!T[id]).join(','));
check('R124: 문턱(P) → root (코어 아래 검은 뿌리), 페르소나(S-07) → persona (가면·손님 의자 하나)',ids.filter(i=>/^sz115-P-/.test(i)).every(i=>T[i]?.key==='root')&&ids.filter(i=>/^sz115-S07-/.test(i)).every(i=>T[i]?.key==='persona'));
check('R124: 흑과 백은 R114 필터 사슬에 흑백을 붙이고(투명한 바깥은 물들지 않게), 경성은 함박눈, 페르소나는 벽 가면·거울·의자',/grayscale/.test(M.themes.ink.filter)&&!M.themes.ink.tint&&M.themes.gyeong.parts.some(p=>p[0]==='snow')&&['mask','mirror','chair'].every(k=>M.themes.persona.deco.some(d=>d[0]===k))&&['tendril','lantern','inkpost'].every(k=>typeof M.draw[k]==='function'));
// R162: 전투 위주 재구성으로 장마다 B·D 구역이 더해져 108 → 140 구역 — 모든 구역에 분위기가 있어야 한다는 뜻은 그대로.
check('every one of the zones (108 + R162 B·D '+(ids.length-108)+') now has a mood',ids.length>=108&&ids.every(i=>T[i]),ids.filter(i=>!T[i]).join(','));
// ---- 실제 배치 위에 짓기 ----
const epOf=id=>SM.episodes.findIndex(e=>Z.chapter(e.key)?.some(z=>z.id===id));
const rooms={};let badDeco=[],noDecal=[],noDeco=[],faceless=[];
for(const id of ids){if(!T[id])continue;const L=SM.layoutFor(epOf(id),null,id);const r={id:'host',props:[],enemies:[],exploration:L};L.samongR115=L.samongR115||{zone:id};
 const st=M.stateFor(r);rooms[id]={r,st,L};if(!st){badDeco.push(id+':nostate');continue;}
 const cells=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),X=L.samongR103||{};
 if(M.themes[st.theme.key].floor.length&&!st.decals.length&&!st.lamps.length&&!st.glyph)noDecal.push(id);
 if(M.themes[st.theme.key].deco.length&&!st.deco.length)noDeco.push(id);
 for(const d of st.deco){if(!cells.has(Math.floor(d.x)+':'+Math.floor(d.y)))badDeco.push(id+':'+d.kind+':offfloor');
  if(Math.hypot(d.x-L.entry.x,d.y-L.entry.y)<3)badDeco.push(id+':'+d.kind+':entry');if(X.exit&&Math.hypot(d.x-X.exit.x,d.y-X.exit.y)<3)badDeco.push(id+':'+d.kind+':exit');
  if(['window','endless'].includes(d.kind)&&!d.face)faceless.push(id+':'+d.kind);}
 for(let i=0;i<st.deco.length;i++)for(let j=i+1;j<st.deco.length;j++)if(Math.hypot(st.deco[i].x-st.deco[j].x,st.deco[i].y-st.deco[j].y)<2.9)badDeco.push(id+':overlap');}
const built=Object.keys(rooms).length;
check('builds on every themed zone layout ('+built+')',built===ids.length&&badDeco.filter(x=>x.endsWith('nostate')).length===0);
check('props stand on floor cells, ≥3 tiles from entry/exit and apart from each other',badDeco.length===0,badDeco.slice(0,8).join(' '));
check('every themed zone gets floor marks',noDecal.length===0,noDecal.join(','));
check('zones with a prop list get at least one prop',noDeco.length<=2,noDeco.join(','));
check('windows and endless-corridor frames hang on a back wall (sheared to the wall face)',faceless.length<=3,faceless.join(','));
const t3=rooms['sz115-S04-3'].st;check('tower: floor number painted on the floor (seven-segment 4F) + floor sign + lift at the exit',t3.decals.some(d=>d.g==='stencil')&&t3.deco.some(d=>d.kind==='sign'&&d.floor===4)&&!!t3.lift);
check('tower: stairs up against a back wall near the entry (most tower zones)',tower.filter(id=>rooms[id].st.deco.some(d=>d.kind==='stairs'&&d.dir)).length>=10,tower.filter(id=>!rooms[id].st.deco.some(d=>d.kind==='stairs')).join(','));
const t10=rooms['sz115-S04-10'];const R10=Z.zone('sz115-S04-10').rooms;
check('tower: each storey of a multi-floor zone reads its own floor',R10.length===3&&[0,1,2].every(i=>M.floorAt(t10.st.theme,R10[i].x+R10[i].w/2,R10[i].y+R10[i].h/2)===10+i));
check('school zones: dead/dim/flickering corridor lamps and door shadows',['sz115-S02-1','sz115-S02-3'].every(id=>rooms[id].st.lamps.length>0&&rooms[id].st.lamps.some(l=>l.mode==='dead'))&&ids.filter(i=>i.startsWith('sz115-S02-')).some(id=>rooms[id].st.ghosts.length>0));
check('S-01 indoor floor becomes a chessboard (tile zone and garden excluded)',rooms['sz115-S01-3'].st.decals.filter(d=>d.g==='checker').length>20&&!rooms['sz115-S01-2'].st.decals.some(d=>d.g==='checker'));
check('data world: green grid and flashing glyph cells',rooms['sz115-S06-6'].st.decals.some(d=>d.g==='grid')&&rooms['sz115-S06-6'].st.glyph.length>0);
// ---- 표현 전용 소품 ----
const rr=rooms['sz115-S01-3'];sb.room=rr.r;sb.player={x:rr.L.entry.x,y:rr.L.entry.y};M.enter(rr.st);const deco=rr.r.props.filter(p=>p.r123Deco);
check('props are presentation-only (no collision, no auto-target)',deco.length===rr.st.deco.length&&deco.every(p=>p.solid===false&&p.r80PresentationOnly===true&&p.autoTargetEligible6===false));
const before=rr.r.props.length;M.enter(rr.st);check('entering again adds nothing',rr.r.props.length===before);
// ---- 그리기 ----
let errs=[],maxGround=0,maxDeco=0;
for(const[id,{r,st,L}]of Object.entries(rooms)){if(!st)continue;sb.room=r;sb.player={x:L.entry.x,y:L.entry.y};sb.cam={x:L.entry.x,y:L.entry.y};
 try{cmds.length=0;M.drawDecals(st);maxGround=Math.max(maxGround,cmds.length);}catch(e){errs.push(id+':'+e.message);}
 for(const d of st.deco){try{cmds.length=0;sb.cam={x:d.x,y:d.y};M.drawDeco({x:d.x,y:d.y,r123Deco:d});maxDeco=Math.max(maxDeco,cmds.length);}catch(e){errs.push(id+':'+d.kind+':'+e.message);}}}
check('floor marks and props draw with renderer-supported calls only',errs.length===0,errs.slice(0,5).join(' | '));
check('floor marks are batched by colour (≤ 160 draw calls a frame)',maxGround>0&&maxGround<=160,maxGround);
check('a prop draws in ≤ 70 calls',maxDeco>0&&maxDeco<=70,maxDeco);
const kinds=new Set(Object.values(M.themes).flatMap(t=>t.deco.map(d=>d[0])).concat('lift'));check('every prop kind has a drawing',[...kinds].every(k=>typeof M.draw[k]==='function'),[...kinds].filter(k=>!M.draw[k]).join(','));
// drawProp: R123 소품만 가로채고 나머지는 원래대로
sb.room=rr.r;sb.player={x:rr.L.entry.x,y:rr.L.entry.y};baseProps.length=0;cmds.length=0;sb.drawProp(deco[0]);const drew=cmds.length;sb.drawProp({id:'native',x:1,y:1});
check('drawProp draws R123 props itself and passes other props through',drew>0&&baseProps.length===1&&baseProps[0]==='native');
M.set({deco:false});cmds.length=0;sb.drawProp(deco[0]);check('설정: 조형물 끄기 → 그리지 않음',cmds.length===0&&baseProps.length===1);M.set({deco:true});
check('설정 저장(r123.mood)',[...store.keys()].some(k=>k.endsWith('r123.mood'))&&JSON.parse([...store.entries()].find(([k])=>k.endsWith('r123.mood'))[1]).deco===true);
check('no failures recorded',M.inspect().failures===0,M.inspect().lastError);
// ---- 등록 ----
const src=fs.readFileSync(path.join(SRC,'samong-mood-r123.js'),'utf8');
const artRefs=[...src.matchAll(/'(assets\/[^']+\.webp)'/g)].map(m=>m[1]).concat([1,2,3,4].map(i=>'assets/r129/props/clock-k'+i+'.webp'));const pidx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r126/props/index.json'),'utf8')),qidx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r129/props/index.json'),'utf8'));
const artRows=[...Object.values(pidx.props),...Object.values(qidx.props),...qidx.clock.frames.map(f=>({...f,source:{sha256:f.sourceSha256,driveId:'x',drive:'x.zip'}}))];
check('R126/R129: only Drive props from assets/r126|r129/props are referenced; files match the index hash, Drive provenance kept, each < 150 kB',artRefs.every(a=>/^assets\/r12[69]\/props\//.test(a))&&artRows.every(p=>{const b=fs.readFileSync(path.join(RT,p.path));return require('crypto').createHash('sha256').update(b).digest('hex')===p.sha256&&b.length<150000&&/^[0-9a-f]{64}$/.test(p.source.sha256)&&p.source.driveId&&String(p.source.drive).endsWith('.zip');})&&artRefs.every(a=>artRows.some(p=>p.path===a)),artRefs.join(','));
{const r=rooms['sz115-S01-3'].r;const art=r.props.filter(p=>p.r123Deco&&p.path);check('R126: rose-house teacups/needles and school lockers/noticeboards carry the Drive art path (vector drawing until the image is ready)',art.some(p=>p.r123Deco.kind==='teacup'&&/teacup\.webp$/.test(p.path))&&art.some(p=>p.r123Deco.kind==='needle')&&M.themes.school.deco.some(d=>d[0]==='noticeboard')&&typeof M.draw.noticeboard==='function');}
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
check('runtime copy matches source; index.html loads it before audio-r98.js',fs.readFileSync(path.join(RT,'samong-mood-r123.js'),'utf8')===src&&html.indexOf('samong-mood-r123.js')>0&&html.indexOf('samong-mood-r123.js')<html.indexOf('src="./audio-r98.js"'));
const pub=fs.readFileSync(path.join(REPO,'scripts','verify-r96-public.py'),'utf8'),ci=fs.readFileSync(path.join(REPO,'.github','workflows','pages.yml'),'utf8'),inputs=JSON.parse(fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8'));
check('registered in runtime inputs, public verify list and CI',inputs.textPaths.includes('samong-mood-r123.js')&&pub.includes("'samong-mood-r123.js'")&&ci.includes('r96/qa/r123/mood-cpu-check.cjs'));
console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);
