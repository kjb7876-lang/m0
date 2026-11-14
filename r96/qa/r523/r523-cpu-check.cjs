// R523 CPU check — 방 이름이 있는 본편 지역의 방 꾸미기(첫 묶음: 의원 ep1a09 · 나태의 집 ep1b02, 둘째 묶음 R524: 질투의 집 ep1b03 · 폭식의 주방 ep1b04)
//  방 모양에서 뒤쪽 벽 줄을 찾아 쓰임새별 가구 묶음을 벽에 붙여 놓는다. 그리기 전용(충돌·저장·room.props 불변), 결정적, 각도 맞는 그림만.
//  지도는 헤드리스 게임에서 뽑은 실제 자료(fixtures/*.json), 벽 판정은 실제 엔진 함수(runtime-text/dist/phase1.js explorationBlocked)를 그대로 쓴다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='rooms-r523.js',src=rd('client-source/'+F);
ok('client source exists',src.length>1000);
ok('runtime copy matches client source',!!src&&rd('runtime-text/'+F)===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=rd('runtime-text/index.html');
ok('script tag once, right after hospital-walls-r522 and before boss-r205',html.split('"./'+F+'"').length===2&&/<script src="\.\/hospital-walls-r522\.js"><\/script><script src="\.\/rooms-r523\.js"><\/script>\s*<script src="\.\/boss-r205\.js">/.test(html));
ok('loads after the overlays it leans on at load time (R80 art, R111 foot, R169 path, R521 draw wrapper); R303 flip and R329 shadow wrap drawProp later and act at draw time, as they do for R521',['world-assets-r80.js','play-r111.js','play-r169.js','hospital-rooms-r521.js'].every(f=>html.indexOf('"./'+f+'"')>0&&html.indexOf('"./'+f+'"')<html.indexOf('"./'+F+'"'))&&['props-fit-r303.js','prop-shadow-r329.js'].every(f=>html.indexOf('"./'+f+'"')>html.indexOf('"./'+F+'"')));
ok('listed in verify-r96-public.py',/'rooms-r523\.js'/.test(rd('../scripts/verify-r96-public.py')));
ok('CI runs this check',/node r96\/qa\/r523\/r523-cpu-check\.cjs/.test(rd('../.github/workflows/pages.yml')));
const inputs=rd('runtime-inputs.json'),manifest=rd('runtime-manifest.json');
ok('overlay registered in runtime-inputs.json and runtime-manifest.json',/"rooms-r523\.js"/.test(inputs)&&/rooms-r523\.js/.test(manifest));
const code=src.replace(/\/\/.*$/mg,'').replace(/\/\*[\s\S]*?\*\//g,'');
ok('presentation only: no hp/save/collision/solid writes',!/\.hp\s*=[^=]|saveGame|serializeSave|restoreSave|\.walls\s*=[^=]|floorCells\s*=[^=]|\.solid\s*=[^=]|\.enemies\s*=[^=]|\.exploration\s*=[^=]/.test(code));
ok('room.props is only swapped for the duration of draw() and restored in finally',/const original=r\.props/.test(code)&&/finally\{r\.props=original;\}/.test(code)&&(code.match(/r\.props=/g)||[]).length===2);
ok('no randomness, no clock in planning',!/Math\.random|crypto/.test(code)&&(code.match(/Date\.now\(\)/g)||[]).length===1/* 그림 다시 읽기 간격만 */);
ok('Mammon ep1b06 · hospital ep1a08 · samong are not handled',!/ep1b06|ep1a08/.test(code.slice(code.indexOf('const REGION='),code.indexOf('const SKIP=')))&&/samongR103/.test(code)&&/samongR115/.test(code)&&/r\.layer==='STORY'/.test(code));
ok('off switch key',/storyworld\.r523\.rooms/.test(code));
const r521=rd('client-source/hospital-rooms-r521.js');
ok('R521 draw wrapper contract still there (r521Ward → lift·flat shadow·contact from r521Flat/r521Foot/r521Up)',/if\(!p\|\|!p\.r521Ward\)return base\.apply/.test(r521)&&/p\.r521Flat/.test(r521)&&/p\.r521Foot/.test(r521)&&/p\.r521Up/.test(r521));

// ---- 실제 엔진 벽 판정 -------------------------------------------------------------------------------
let E=null;try{const c={window:{},console,performance:{now:()=>0}};vm.createContext(c);vm.runInContext(rd('runtime-text/dist/phase1.js'),c);E=c.window.StoryPhase1.explorationBlocked;}catch(e){}
ok('engine explorationBlocked loaded',typeof E==='function');
function layoutOf(fx){const cells=[];for(const[y,sp]of Object.entries(fx.floorSpans))for(let i=0;i<sp.length;i+=2)for(let x=sp[i];x<sp[i+1];x++)cells.push([x,+y]);
 return{bounds:[0,0,100,104],floorCells:cells,walls:fx.walls.map(w=>({...w})),r224Rooms:fx.r224Rooms.map(q=>({...q})),worldR74:{rooms:fx.rooms.map(q=>({...q})),doors:fx.doors.map(d=>({...d}))},
  worldWardR81:fx.worldWardR81?{...fx.worldWardR81}:{},entry:fx.entry,starts:fx.starts};}
// R449 가구 흉내: 방 사각형 북쪽 변을 따라 방마다 두 점(실제로는 벽과 떨어져 있던 것)
function world(fx,opt={}){const L=layoutOf(fx),props=fx.props.map(p=>({...p,solid:false,visible:true}));
 for(const q of L.r224Rooms){props.push({id:'r449:furn:'+fx.id+':'+q.id+':0',path:'assets/world-r80/r80-148.webp',x:q.x0+2.5,y:q.y0+.85,height:69,solid:false,r80Dressing:true,r449Furniture:true,r449:{room:q.id}});
  props.push({id:'r224:furn:'+fx.id+':'+q.id,path:'assets/world-r80/r80-144.webp',x:q.x0+5.5,y:q.y0+.85,height:69,solid:false,r80Dressing:true,r224Furniture:true,r303Hide:'r449'});}
 props.push({id:'r80:scene:'+fx.id+':x',path:'assets/world-r80/r80-148.webp',x:63.5,y:73.5,height:69,solid:false,r80Dressing:true});/* 방 가운데 서 있던 정면 시점 장 */
 props.push({id:'r80:scene:'+fx.id+':y',path:'assets/world-r80/r80-025.webp',x:83.5,y:69.5,height:73,solid:false,r80Dressing:true});/* 방향 없는 쓰레기 더미는 그대로 */
 props.push({id:'r74:'+fx.id+':scenery:x',x:90.5,y:49.5,solid:false,visible:true,r74Prop:'cabinet',r81NativeSkin:{path:'assets/world-r80/r80-024.webp',height:69}});/* 입구 한가운데 서 있던 정면 시점 소파(R74 장식, path 없이 r81NativeSkin 으로 그려짐) */
 props.push({id:'r74:'+fx.id+':scenery:y',x:70.5,y:65.5,solid:false,visible:true,r74Prop:'statue',r81NativeSkin:{path:'assets/props/v290/hotel_luggage_cart.webp',height:86}});
 return{id:opt.id||fx.id,layer:opt.layer||'STORY',exploration:L,props,enemies:[],objective:fx.objective||null};}
function boot(opt={}){const drawn=[],asked=[],ready=new Set(opt.ready||[]),frames=[];
 const ctx={localStorage:{getItem:()=>opt.stored||null,setItem:()=>{}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,
  StoryPhase1:{explorationBlocked:E},regionById:{ep1a09:{paths:[]},ep1b02:{paths:[]},ep1b03:{paths:[]},ep1b04:{paths:[]},ep1b07:{paths:[]},murder02:{paths:[]},murder04:{paths:[]},ep1b06:{paths:[]},ep1a08:{paths:[]}},
  readyImage:p=>ready.has(p)?{image:{naturalWidth:300,naturalHeight:400},path:p}:null,ensureImages:ps=>{asked.push(...ps);return Promise.resolve();},
  project:(x,y)=>({x:640+(x-y-(ctx.cam.x-ctx.cam.y))*27,y:340+(x+y-(ctx.cam.x+ctx.cam.y))*13.5}),cam:{x:40,y:70},W:1280,H:676,zoom:1,room:undefined,
  draw:function(){const r=ctx.room;frames.push(r.props.map(p=>p.id));for(const p of r.props)ctx.drawProp(p);},drawProp:function(p){drawn.push(p.id);}};
 Object.assign(ctx,opt.extra||{});ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);return{ctx,api:ctx.__STORYWORLD_ROOMS_R523__,drawn,asked,frames};}
const FX={};for(const id of['ep1a09','ep1b02','ep1b03','ep1b04','ep1b07','murder02','murder04','u205','u206','cult03']){try{FX[id]=JSON.parse(rd('qa/r523/fixtures/'+id+'.json'));}catch(_){}}
ok('fixtures present (real maps of ep1a09 · ep1b02 · ep1b03 · ep1b04 · ep1b07 · murder02 · murder04)',!!FX.ep1a09&&!!FX.ep1b02&&!!FX.ep1b03&&!!FX.ep1b04&&!!FX.ep1b07&&!!FX.murder02&&!!FX.murder04&&Object.keys(FX.ep1a09.floorSpans).length>50&&Object.keys(FX.ep1b03.floorSpans).length>50);
let B=null;try{B=boot();}catch(e){console.log(String(e.stack).slice(0,300));}
const api=B&&B.api;
ok('api exported',!!api&&typeof api.plan==='function'&&typeof api.list==='function'&&typeof api.runsOf==='function'&&typeof api.seat==='function');
if(!api||!E||!FX.ep1a09||!FX.ep1b02||!FX.ep1b03||!FX.ep1b04){console.log('\nR523 '+(n-bad)+'/'+n+' passed (stopped early: overlay·engine·fixtures needed)');process.exit(1);}

// ---- 그림 표 ---------------------------------------------------------------------------------------
const ART=api.ART,keys=Object.keys(ART),R2=Math.SQRT2;
ok('art table: every piece has a path, height, drawn rect and a 20×28 alpha mask',keys.length>=25&&keys.every(k=>{const a=ART[k];return typeof a.path==='string'&&a.h>20&&a.h<140&&Array.isArray(a.r)&&a.r.length===4&&a.r[1]>a.r[0]&&a.r[3]>0&&/^[0-9a-f]{140}$/.test(a.m);}));
ok('iso furniture carries a floor footprint with both sides > 0; pole pieces carry a wall distance',keys.every(k=>{const a=ART[k];if(a.ang==='iso'){const[sL,sR,sB]=a.ft||[];return(sB-sL)*R2>.1&&(sR-sB)*R2>.1&&(a.face==='n'||a.face==='w');}return a.ang==='pole'&&a.d>0;}));
ok('two-direction pieces point at each other and face different walls',keys.filter(k=>ART[k].pair).length>=8&&keys.filter(k=>ART[k].pair).every(k=>ART[ART[k].pair]&&ART[ART[k].pair].pair===k&&ART[ART[k].pair].face!==ART[k].face));
// 각도 규칙(사용자 2026-11-10 "각도가 안맞는 소품은 과감히 배치안하도록"): 정면 3/4 시점으로 판정된 그림은 표에 없다
const OFF=/r80-(?:024|027|051|144|148)\.webp|hospital-maze\/cabinet|r415\/props\/(?:care-table|grand-desk|record-cabinet|report-desk|low-table|waiting-bench|student-desk|lobby-counter)|mammon/;
ok('no off-angle (front 3/4 view) art and nothing from the Mammon sheet in the table',keys.every(k=>!OFF.test(ART[k].path)));
ok('every art file is a shipped runtime file',keys.every(k=>manifest.includes('"'+ART[k].path+'"')||manifest.includes(ART[k].path)));
for(const rd_ of['r523','r524','r527','r528','r529']){const dir=path.join(R,'runtime-text/assets/'+rd_);let idx=null;try{idx=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));}catch(_){}
 const files=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f!=='index.json'):[];
 ok(rd_+' asset record: every file listed with its real size and sha256, a source and a use; no Drive link or id',!!idx&&files.length>0&&files.every(f=>{const e=(idx.files||[]).find(x=>x.file==='assets/'+rd_+'/'+f),b=fs.readFileSync(path.join(dir,f));return!!e&&e.bytes===b.length&&e.sha256===crypto.createHash('sha256').update(b).digest('hex')&&!!e.source&&!!e.use;})&&(idx.files||[]).length===files.length&&!/drive\.google|docs\.google|[?&]id=/.test(JSON.stringify(idx)));}
const G=api.G,USE=api.USE,REG=api.REGION;
ok('groups only use known art; uses only use known groups; regions only use known uses',Object.values(G).every(g=>g.w>0&&g.it.every(it=>ART[it[0]]))&&Object.values(USE).every(u=>[...u.main,...u.side].every(g=>G[g])&&(!u.corner||ART[u.corner]))&&Object.values(REG).every(l=>l.every(([re,u])=>[].concat(u).every(v=>USE[v])))&&Object.values(G).every(g=>!g.lim||Object.keys(g.lim).every(k=>api.LIMIT[k]>0)));
ok('handled regions: clinic ep1a09 · sloth home ep1b02 (first batch), envy house ep1b03 · gluttony kitchen ep1b04 (second batch), fire floor ep1b07 · tower floor murder02 · shared housing murder04 (third batch), admin rights u205 · core transfer u206 · threshold of Samong cult03 (fourth batch), Hando castle hando01~03 (R1020, 사용자 2026-11-14 부분 쿼터뷰) — nothing else',Object.keys(REG).sort().join()==='cult03,ep1a09,ep1b02,ep1b03,ep1b04,ep1b07,hando01,hando02,hando03,murder02,murder04,u205,u206');
ok('room names → uses; fight rooms·exit gates·junctions stay untouched, the entrance gets a light set',api.useOf('ep1a09','주사실')==='inject'&&api.useOf('ep1a09','처치 대기실')==='wait'&&api.useOf('ep1a09','관찰실')==='observe'&&api.useOf('ep1a09','약품 보관실')==='drug'&&api.useOf('ep1a09','길목')==='hall'&&
 api.useOf('ep1b02','거실')==='living'&&api.useOf('ep1b02','작은 방')==='bedroom'&&api.useOf('ep1b02','물품 보관실')==='store'&&api.useOf('ep1b02','현관')==='foyer'&&api.useOf('ep1a09','입구')==='lobby'&&api.useOf('ep1b02','입구')==='foyer'&&
 ['보스 전투실','중앙 전투실','다음 구역 문','갈림길','작은 마당',''].every(nm=>api.useOf('ep1a09',nm)===null&&api.useOf('ep1b02',nm)===null)&&api.useOf('last302','거실')===null&&api.useOf('last302','입구')===null);

// ---- 실제 지도 두 곳 --------------------------------------------------------------------------------
const CLINIC=new Set(['bed','stretcher','overbed','medcab','trolley','wheelchair','monitor','iv','stool','lamp','crutches','curtain','chair145','table146','chair3','chair3W'/* R1020 휠체어 두 방향 */]);
const HOME=new Set(['sofa_sloth','bed_sloth','fridge_sloth','tv_sloth','wardrobe_n','wardrobe_w','table_n','table_w','suitcase_n','suitcase_w','chair_n','chair_w','chairb_n','chairb_w','trash']);
const hitOf=L=>(x,y)=>!!E(L,x,y,.02);/* 반지름 0 이면 엔진이 얇은 벽을 못 본다 */
function audit(id,palette,min,uses){const w=world(FX[id]),L=w.exploration,hit=hitOf(L),rows=api.list(w),I=api.inspect(),W=L.worldWardR81,names=new Map(L.worldR74.rooms.map(q=>[q.id,q.name]));
 ok(id+': '+rows.length+' pieces placed (was a handful per room) — at least '+min,rows.length>=min);
 ok(id+': ids unique and stable form',new Set(rows.map(p=>p.id)).size===rows.length&&rows.every(p=>/^r523:[a-z0-9]+:\d+:\d+$/.test(p.id)));
 ok(id+': every piece is presentation only (not solid, no targeting) and rides the R521 draw path',rows.every(p=>p.solid===false&&p.presentationOnly===true&&p.autoTargetEligible6===false&&p.r521Ward===true&&p.r523Room===true));
 ok(id+': only this family\'s art',rows.every(p=>palette.has(p.r523.art)));
 ok(id+': every foot stands on floor',rows.every(p=>!hit(p.x,p.y)));
 const S=p=>api.samplesOf(p.r523.art,!!p.r303Flip);
 const emb=rows.map(p=>api.embedOf(S(p),p.x,p.y,hit)),hid=rows.map(p=>api.hiddenOf(S(p),p.x,p.y,hit));
 ok(id+': no piece sunk into a wall (≤1% of its picture inside wall mass) — worst '+(Math.max(...emb)*100).toFixed(1)+'%',Math.max(...emb)<=.01);
 ok(id+': no piece hidden behind a front wall (≤20%) — worst '+(Math.max(...hid)*100).toFixed(0)+'%',Math.max(...hid)<=.2);
 // 벽에 붙음: 가구(바닥 자리 있는 것)의 등 뒤 바로(.1칸 더)에 벽이 있다. 벽과의 틈은 낮은 가구 .26칸, 키 큰 가구 .86칸 안(묶음에서 일부러 띄운 것은 그만큼 더)
 const iso=rows.filter(p=>p.r521Foot&&p.r523.tag!=='screen');let off=0,far=0;
 for(const p of iso){const f=p.r521Foot,d=p.r523.d,wall=p.r523.wall,mx=(f[0]+f[2])/2,my=(f[1]+f[3])/2;if(!(wall==='n'?hit(mx,f[1]-d-.1):hit(f[0]-d-.1,my)))off++;if(d>1.75)far++;}
 ok(id+': every piece of furniture has a wall right behind it ('+iso.length+' checked, '+off+' off, '+far+' too far)',iso.length>rows.length*.5&&off===0&&far===0);
 const lows=iso.filter(p=>p.height<=80&&!/chairb|table146|suitcase/.test(p.r523.art)&&p.r523.d>.27);
 ok(id+': low furniture pushed at most .2 off the wall',lows.length===0);
 ok(id+': nothing in the boss room or the gathering room',rows.every(p=>![W.bossBounds,W.gatherBounds].some(b=>p.x>b[0]-.5&&p.x<b[2]+.5&&p.y>b[1]-.5&&p.y<b[3]+.5)));
 ok(id+': doors, entry and the objective are kept clear',rows.every(p=>L.worldR74.doors.every(d=>Math.hypot(d.x-p.x,d.y-p.y)>=Math.max(2.6,d.width/2+.6))&&(!L.entry||Math.hypot(L.entry.x-p.x,L.entry.y-p.y)>=2.6)&&(!w.objective||Math.hypot(w.objective.x-p.x,w.objective.y-p.y)>=2.6)));
 ok(id+': existing scenery is not covered (≥1.1 from every other standing prop)',rows.every(p=>w.props.every(q=>q.r449Furniture||q.r224Furniture||/r80-(?:144|148|024)\.webp/.test(q.path||'')||Math.hypot(q.x-p.x,q.y-p.y)>=1.1)));
 let lap=0;for(let i=0;i<iso.length;i++)for(let j=i+1;j<iso.length;j++){const a=iso[i].r521Foot,b=iso[j].r521Foot;if(a[0]<b[2]-.01&&a[2]>b[0]+.01&&a[1]<b[3]-.01&&a[3]>b[1]+.01)lap++;}
 ok(id+': furniture footprints do not overlap',lap===0);
 const per={};for(const q of I.plan.rooms)(per[q.use]=per[q.use]||[]).push(q.count);
 ok(id+': every room use is furnished — '+uses.map(u=>u+' '+(per[u]||[]).join('/')).join(', '),uses.every(u=>(per[u]||[]).filter(c=>c>=3).length>=Math.ceil((per[u]||[]).length/2)));
 const inRoom=p=>L.r224Rooms.find(q=>q.id===p.r523.room);
 ok(id+': each piece lies inside its own room rectangle (±1)',rows.every(p=>{const q=inRoom(p);return q&&p.x>q.x0-1&&p.x<q.x1+1&&p.y>q.y0-1&&p.y<q.y1+1;}));
 ok(id+': fight rooms and exit-gate rooms get nothing',rows.every(p=>!/보스|전투실|다음 구역/.test(names.get(p.r523.room)||'')));
 const ent=rows.filter(p=>/^입구$/.test(names.get(p.r523.room)||''));
 ok(id+': the entrance gets a light set ('+ent.length+' pieces, 2~9) and the start spot stays open (≥3)',ent.length>=2&&ent.length<=9&&ent.every(p=>(L.starts||[]).every(s=>Math.hypot(s.x-p.x,s.y-p.y)>=3)));
 ok(id+': no thin wall runs under a piece of furniture',iso.every(p=>{const f=p.r521Foot;for(let i=0;i<=12;i++)for(let j=0;j<=12;j++)if(hit(f[0]+(f[2]-f[0])*i/12,f[1]+(f[3]-f[1])*j/12))return false;return true;}));
 const again=api.plan(w),sameIds=again.cand.map(c=>c.p.id+':'+c.p.x+':'+c.p.y+':'+c.p.r523.art).join('|');
 const w2=world(FX[id]);api.list(w2);const again2=api.plan(w2).cand.map(c=>c.p.id+':'+c.p.x+':'+c.p.y+':'+c.p.r523.art).join('|');
 ok(id+': deterministic — same plan on a second visit',sameIds===again2&&sameIds.length>1000);
 return{w,rows,L,hit,I};}
const C=audit('ep1a09',CLINIC,95,['inject','wait','observe','drug']);
const Hm=audit('ep1b02',HOME,120,['living','bedroom','store','den','den2','den3']);
// 쓰임새가 읽히는지: 관찰실엔 침대, 주사실엔 처치대(들것)+수액대, 대기실엔 의자, 약품 보관실엔 약장 / 거실엔 소파, 작은 방엔 침대, 보관실엔 냉장고·옷장
const has=(A,use,art)=>A.rows.some(p=>p.r523.use===use&&p.r523.art===art);
ok('clinic rooms read by function: beds+screens in observation, treatment couch+IV in injection, chairs in waiting, cabinets in the drug store',has(C,'observe','bed')&&has(C,'observe','curtain')&&has(C,'inject','stretcher')&&has(C,'inject','iv')&&has(C,'wait','chair145')&&C.rows.filter(p=>p.r523.use==='drug'&&p.r523.art==='medcab').length>=8&&!has(C,'wait','bed'));
ok('home rooms read by function: sofa+TV in living rooms, bed+wardrobe in small rooms, fridge+wardrobe in storage',has(Hm,'living','sofa_sloth')&&has(Hm,'living','tv_sloth')&&has(Hm,'bedroom','bed_sloth')&&Hm.rows.some(p=>p.r523.use==='bedroom'&&/^wardrobe/.test(p.r523.art))&&has(Hm,'store','fridge_sloth')&&!has(Hm,'living','bed_sloth')&&!has(Hm,'bedroom','fridge_sloth'));
// 같은 물건 되풀이 줄이기(사용자 2026-11-09 "같은 물건이 같은 간격으로 반복되는 현상은 줄이고"): 이름이 같은 앞방 아홉 곳을 세 가지 쓰임(앉는 방·짐 방·남는 침실)으로 돌려 쓴다
ok('same-named rooms rotate through three characters (sitting room / luggage room / spare bedroom)',api.useOf('ep1b02','앞방',1)==='den'&&api.useOf('ep1b02','앞방',2)==='den2'&&api.useOf('ep1b02','앞방',3)==='den3'&&api.useOf('ep1b02','앞방',4)==='den'&&api.useOf('ep1b02','거실',3)==='living');
{const per={};for(const p of Hm.rows){const q=per[p.r523.room]=per[p.r523.room]||{use:p.r523.use,tv:0,sofa:0,bed:0};if(p.r523.art==='tv_sloth')q.tv++;if(p.r523.art==='sofa_sloth')q.sofa++;if(p.r523.art==='bed_sloth')q.bed++;}
 const V=Object.values(per),tv=V.reduce((s,q)=>s+q.tv,0),sofa=V.reduce((s,q)=>s+q.sofa,0);
 ok('home: at most one TV and two sofas per room; TVs only in living rooms and sitting rooms ('+tv+' TVs, '+sofa+' sofas in the house)',V.every(q=>q.tv<=1&&q.sofa<=2)&&V.every(q=>!q.tv||/^(living|den)$/.test(q.use))&&tv<=9&&tv>=3&&sofa<=14);
 ok('home: luggage rooms and spare bedrooms have no sofa or TV; spare bedrooms have a bed',V.filter(q=>/^den[23]$/.test(q.use)).length>=4&&V.filter(q=>/^den[23]$/.test(q.use)).every(q=>!q.tv&&!q.sofa)&&V.filter(q=>q.use==='den3').some(q=>q.bed>0));}
// ---- 둘째 묶음(R524): 질투의 집 ep1b03 · 폭식의 주방 ep1b04 ---------------------------------------------------
//  질투 = 정돈되고 서로를 비춰 보는 집(거울·가죽 소파·옷장, 쓰레기 없음) / 폭식 = 주방(화구 줄·준비대·식재료 냉장고와 찬장)
const ENVY=new Set(['sofa_n','sofa_w','shelf_n','shelf_w','flamp','mirror','wardrobe_n','wardrobe_w','table_n','table_w','chair_n','chair_w','chairb_n','chairb_w']);
const GLUT=new Set(['range_n','range_w','fridge_sloth','table_n','table_w','wardrobe_n','wardrobe_w','chair_n','chair_w','chairb_n','chairb_w','trash']);
ok('second batch room names → uses (same-named studies and pantries rotate through two characters; corridors are left alone)',api.useOf('ep1b03','정돈된 거실')==='parlor'&&api.useOf('ep1b03','서재',1)==='study'&&api.useOf('ep1b03','서재',2)==='study2'&&api.useOf('ep1b03','서재',3)==='study'&&api.useOf('ep1b03','거울 회랑')==='mirrors'&&api.useOf('ep1b03','앞방')==='parlor'&&api.useOf('ep1b03','입구')==='vestibule'&&api.useOf('ep1b03','복도')===null&&
 api.useOf('ep1b04','준비대')==='prep'&&api.useOf('ep1b04','식재료 보관실',1)==='pantry'&&api.useOf('ep1b04','식재료 보관실',2)==='pantry2'&&api.useOf('ep1b04','화구 구획')==='ranges'&&api.useOf('ep1b04','앞방')==='mess'&&api.useOf('ep1b04','입구')==='mess'&&api.useOf('ep1b04','복도')===null);
const Ev=audit('ep1b03',ENVY,55,['parlor','study','study2','mirrors']);
const Gl=audit('ep1b04',GLUT,55,['prep','pantry','pantry2','ranges']);
const perRoom=(A,re)=>{const per={};for(const p of A.rows){const q=per[p.r523.room]=per[p.r523.room]||{use:p.r523.use,n:0};if(re.test(p.r523.art))q.n++;}return Object.values(per);};
{const mir=perRoom(Ev,/^mirror$/),sofa=perRoom(Ev,/^sofa_[nw]$/);
 ok('envy: the mirror gallery is a row of mirrors (≥4); every other room has at most one mirror',mir.filter(q=>q.use==='mirrors').length===1&&mir.filter(q=>q.use==='mirrors').every(q=>q.n>=4)&&mir.filter(q=>q.use!=='mirrors').every(q=>q.n<=1));
 ok('envy: a tidy house — no trash, beds, TVs or fridges anywhere; at most two sofas per room',Ev.rows.every(p=>!/trash|bed|tv|fridge|range/.test(p.r523.art))&&sofa.every(q=>q.n<=2));
 ok('envy rooms read by function: sofa + table in the parlours, writing desk (table at the wall with one chair drawn up to it) + cabinet or bookshelf in the studies',(has(Ev,'parlor','sofa_n')||has(Ev,'parlor','sofa_w'))&&(has(Ev,'parlor','table_n')||has(Ev,'parlor','table_w'))&&['study','study2'].every(u=>Ev.rows.some(p=>p.r523.use===u&&/^table_/.test(p.r523.art))&&Ev.rows.some(p=>p.r523.use===u&&/^chairb_/.test(p.r523.art))&&Ev.rows.some(p=>p.r523.use===u&&/^(wardrobe|shelf)_/.test(p.r523.art))));}/* R528: 책장도 장으로 센다 */
{const rng=perRoom(Gl,/^range_[nw]$/);
 ok('gluttony: the range section is a line of ranges (≥3); other rooms have at most two',rng.filter(q=>q.use==='ranges').length===1&&rng.filter(q=>q.use==='ranges').every(q=>q.n>=3)&&rng.filter(q=>q.use!=='ranges').every(q=>q.n<=2));
 ok('gluttony rooms read by function: tables in the prep rooms, fridges and cupboards in the pantries; no sofas, beds, TVs, mirrors or suitcases in a kitchen',Gl.rows.some(p=>p.r523.use==='prep'&&/^table_/.test(p.r523.art))&&has(Gl,'pantry','fridge_sloth')&&Gl.rows.some(p=>/^pantry/.test(p.r523.use)&&/^wardrobe_/.test(p.r523.art))&&Gl.rows.every(p=>!/sofa|bed|tv|mirror|suitcase/.test(p.r523.art)));}
ok('second batch: corridors (복도) get nothing',[Ev,Gl].every(A=>{const nm=new Map(A.L.worldR74.rooms.map(q=>[q.id,q.name]));return A.rows.every(p=>nm.get(p.r523.room)!=='복도');}));
ok('second batch: two-direction art is used unmirrored on its own wall',[Ev,Gl].every(A=>A.rows.filter(p=>ART[p.r523.art].pair).length>20&&A.rows.filter(p=>ART[p.r523.art].pair).every(p=>!p.r303Flip&&ART[p.r523.art].face===p.r523.wall)));
ok('new art for the second batch is in the table: lounge sofas and Dots ranges as two-direction pairs, the standing mirror as a direction-less piece',['sofa_n','sofa_w','range_n','range_w'].every(k=>ART[k]&&ART[k].ang==='iso'&&ART[k].pair&&/^assets\/r524\//.test(ART[k].path))&&!!ART.mirror&&ART.mirror.ang==='pole'&&/r80-026\.webp$/.test(ART.mirror.path));
// ---- R528: Dots 책장(CX-0066RM r1, 바닥 각도를 2:1 로 바로잡은 것)을 질투의 집 서재에 ------------------------------------
{const sh=perRoom(Ev,/^shelf_[nw]$/),studies=sh.filter(q=>/^study/.test(q.use));
 ok('R528 envy studies have bookshelves: every study room that gets furniture has at least one, at least six in all, and none outside the studies',studies.length>=6&&studies.every(q=>q.n>=1)&&sh.filter(q=>!/^study/.test(q.use)).every(q=>q.n===0)&&[Ev,Gl].every(A=>A.rows.every(p=>!/^shelf_/.test(p.r523.art)||(A===Ev&&/^study/.test(p.r523.use)))));
 ok('R528 bookshelf art: a two-direction pair from assets/r528 on the 2:1 floor, both views drawn the same height',['shelf_n','shelf_w'].every(k=>ART[k]&&ART[k].ang==='iso'&&ART[k].pair&&/^assets\/r528\/bookshelf-[nw]\.webp$/.test(ART[k].path))&&ART.shelf_n.pair==='shelf_w'&&Math.abs(ART.shelf_n.r[3]-ART.shelf_w.r[3])<.05&&ART.shelf_n.r[3]>2&&ART.shelf_n.r[3]<2.6);}
// ---- R529: 서 있는 전등(Dots CX-0066RM r1)을 질투의 집 응접실·읽는 서재의 소파 곁에 하나씩 ------------------------------------
{const fl=perRoom(Ev,/^flamp$/),sf=perRoom(Ev,/^sofa_[nw]$/),lit=fl.filter(q=>q.n>0);
 ok('R529 floor lamps: one at most per room, only in parlours and reading studies, only in a room that has a sofa ('+lit.length+' rooms, at least 4); none in other regions',lit.length>=4&&fl.every(q=>q.n<=1)&&lit.every(q=>q.use==='parlor'||q.use==='study2')&&fl.every((q,i)=>q.n===0||sf[i].n>=1)&&[C,Hm,Gl].every(A=>A.rows.every(p=>p.r523.art!=='flamp')));
 ok('R529 floor lamp art: a direction-less standing piece from assets/r529, a little shorter than the bookshelf',!!ART.flamp&&ART.flamp.ang==='pole'&&!ART.flamp.pair&&ART.flamp.path==='assets/r529/floor-lamp.webp'&&ART.flamp.h>=80&&ART.flamp.h<ART.shelf_n.h);}
// ---- 셋째 묶음(R525): 불을 지른 남자 ep1b07 · 새빛호텔 murder02 · 청록빌라 murder04 -------------------------------
//  불난 층 = 피난 계단·방화 전실·설비실(기계)·그을린 복도(버리고 간 짐) / 호텔 7층 = 보안실(단말기·책상)·설비실·계단참·전실(의자와 투숙객 짐) / 빌라 = 세 가지 앞방·빈 방(성기게)·공동 계단
const FIRE=new Set(['steps','alarm','machine','cooler','vent','wardrobe_n','wardrobe_w','chair_n','chair_w','suitcase_n','suitcase_w','trash']);
const TOWER=new Set(['steps','alarm','machine','cooler','vent','kiosk','wardrobe_n','wardrobe_w','table_n','table_w','chair_n','chair_w','chairb_n','chairb_w','trash','suitcase_n','suitcase_w']);
const FLAT=new Set([...HOME,'steps','alarm']);
ok('third batch room names → uses (stairs, fire lobbies, plant rooms, security rooms, vacant rooms; connectors and shared corridors are left alone)',api.useOf('ep1b07','피난 계단')==='stairs'&&api.useOf('ep1b07','방화 전실')==='firelobby'&&api.useOf('ep1b07','설비실')==='plant'&&api.useOf('ep1b07','그을린 복도')==='evac'&&api.useOf('ep1b07','앞방')==='firelobby'&&api.useOf('ep1b07','입구')==='evac'&&api.useOf('ep1b07','길목')===null&&
 api.useOf('murder02','계단참')==='stairs'&&api.useOf('murder02','보안실')==='security'&&api.useOf('murder02','설비실')==='plant'&&api.useOf('murder02','7층 전실')==='lobby7'&&api.useOf('murder02','앞방')==='lobby7'&&api.useOf('murder02','입구')==='lobby7'&&api.useOf('murder02','길목')===null&&
 api.useOf('murder04','공동 계단')==='stairs'&&api.useOf('murder04','계단참')==='landing'&&api.useOf('murder04','빈 방')==='vacant'&&api.useOf('murder04','앞방',1)==='den'&&api.useOf('murder04','앞방',2)==='den2'&&api.useOf('murder04','앞방',3)==='den3'&&api.useOf('murder04','입구')==='foyer'&&api.useOf('murder04','공동 복도')===null&&api.useOf('murder04','길목')===null);
const Fi=audit('ep1b07',FIRE,35,['firelobby','plant']);
const Tw=audit('murder02',TOWER,35,['security','plant']);
const Fl=audit('murder04',FLAT,50,['den','den2','den3']);
{const st=[Fi,Tw,Fl].flatMap(A=>perRoom(A,/^steps$/)),al=[Fi,Tw,Fl].flatMap(A=>perRoom(A,/^alarm$/));
 ok('stair rooms: one flight of steps at most, steps only in stair rooms ('+st.filter(q=>q.n>0).length+' flights in three regions, at least 6); at most one alarm box per room',st.every(q=>q.n<=1)&&st.filter(q=>q.n>0).every(q=>q.use==='stairs')&&st.filter(q=>q.n>0).length>=6&&al.every(q=>q.n<=1));
 const mach=A=>A.rows.filter(p=>p.r523.use==='plant');
 ok('plant rooms read as machine rooms: machines and coolers in both regions, no household furniture there',[Fi,Tw].every(A=>mach(A).some(p=>p.r523.art==='machine')&&mach(A).some(p=>p.r523.art==='cooler')&&mach(A).every(p=>/^(machine|cooler|vent|alarm|wardrobe_[nw])$/.test(p.r523.art))));
 ok('security rooms: terminals, and a desk with a chair drawn up to it somewhere; at most two terminals per room',has(Tw,'security','kiosk')&&Tw.rows.some(p=>p.r523.use==='security'&&/^table_/.test(p.r523.art))&&Tw.rows.some(p=>p.r523.use==='security'&&/^chairb_/.test(p.r523.art))&&perRoom(Tw,/^kiosk$/).every(q=>q.n<=2)&&Tw.rows.filter(p=>p.r523.art==='kiosk').every(p=>p.r523.use==='security'));
 ok('hotel floor: guest luggage stands by the wall in the lobbies and entrance (at least three suitcases), never in security or plant rooms',Tw.rows.filter(p=>/^suitcase_/.test(p.r523.art)&&p.r523.use==='lobby7').length>=3&&Tw.rows.every(p=>!/^suitcase_/.test(p.r523.art)||p.r523.use==='lobby7')&&Tw.rows.some(p=>p.r523.use==='lobby7'&&/^chair_/.test(p.r523.art)));
 ok('fire floor: luggage dropped on the way out (scorched corridors or fire lobbies); no beds, sofas, TVs, fridges or tables anywhere',Fi.rows.some(p=>/^suitcase_/.test(p.r523.art)&&/^(evac|firelobby)$/.test(p.r523.use))&&Fi.rows.every(p=>!/bed|sofa|tv|fridge|table|range|mirror/.test(p.r523.art)));
 const vac={};for(const p of Fl.rows)if(p.r523.use==='vacant')vac[p.r523.room]=(vac[p.r523.room]||0)+1;
 ok('shared housing: vacant rooms stay sparse (≤3 pieces each, no bed/sofa/TV), the nine front rooms rotate through the three home characters',Object.values(vac).every(c=>c<=3)&&Fl.rows.filter(p=>p.r523.use==='vacant').every(p=>!/bed|sofa|tv|fridge/.test(p.r523.art))&&['den','den2','den3'].every(u=>Fl.rows.some(p=>p.r523.use===u)));
 ok('third batch: connectors (길목) and shared corridors (공동 복도) get nothing',[Fi,Tw,Fl].every(A=>{const nm=new Map(A.L.worldR74.rooms.map(q=>[q.id,q.name]));return A.rows.every(p=>!/^(길목|공동 복도)$/.test(nm.get(p.r523.room)||''));}));
 ok('new art for the third batch is existing game art used as one-direction pieces (no new files): steps·alarm box·pipe machine·roof vent·terminal from world-r80, cooler from r406',['steps','alarm','machine','vent','kiosk'].every(k=>ART[k]&&ART[k].ang==='iso'&&!ART[k].pair&&/^assets\/world-r80\/r80-\d+\.webp$/.test(ART[k].path))&&!!ART.cooler&&ART.cooler.ang==='iso'&&!ART.cooler.pair&&/^assets\/r406\/props\/server-cooler\.webp$/.test(ART.cooler.path));
 {let near=1e9;for(const A of[Fi,Tw,Fl])for(const p of A.rows)if(p.r523.art==='steps')for(const q of A.w.props)if(!q.r523Room&&!q.r449Furniture&&!q.r224Furniture)near=Math.min(near,Math.hypot(q.x-p.x,q.y-p.y));
  ok('a flight of steps is a big piece: it keeps 2.4 clear of every other standing prop (nearest '+near.toFixed(2)+')',ART.steps.clear>=1.3&&near>=2.4);}
 ok('third batch: one-direction art is mirrored only on the opposite wall',[...Fi.rows,...Tw.rows,...Fl.rows].filter(p=>!ART[p.r523.art].pair&&ART[p.r523.art].ang==='iso'&&p.r523.tag!=='screen').every(p=>!!p.r303Flip===(ART[p.r523.art].face!==p.r523.wall)));}
// ---- 넷째 묶음(R527): 관리자 권한 u205 · 중앙 코어 이주실 u206 · 사몽의 문턱 cult03 -------------------------------
//  기억의 방·중앙 이주실·보호 구획 = 캡슐 + 심박 모니터 / 기계 육체실 = 거치대 줄 / 닫힌 구획·연결실 = 기계·냉각기 / 수확실 = 연꽃 코어 받침 + 수조 / 방벽 구획 = 돌 방벽 줄 / 코어 전실 = 받침 + 성물함 + 등불
const ADMIN=new Set(['pod','vitals','tank','kiosk','machine','cooler','vent','rig']);
const CULT=new Set(['lotus','tank','barrier','lanterns','reliq','candles'/* R1017 촛대(석상·녹슨 침대는 11-14 재심사로 뺌) */]);
ok('fourth batch room names → uses (memory rooms, sealed sections, body rooms, transfer rooms, harvest rooms, barrier sections; empty corridors, connecting galleries and connectors are left alone)',api.useOf('u205','기억의 방')==='memory'&&api.useOf('u205','기억 전실')==='memhall'&&api.useOf('u205','닫힌 구획')==='sealed'&&api.useOf('u205','앞방')==='annex'&&api.useOf('u205','입구')==='gate'&&api.useOf('u205','빈 복도')===null&&api.useOf('u205','길목')===null&&
 api.useOf('u206','연결실')==='link'&&api.useOf('u206','보호 구획')==='ward'&&api.useOf('u206','기계 육체실')==='bodies'&&api.useOf('u206','중앙 이주실')==='transfer'&&api.useOf('u206','앞방')==='annex'&&api.useOf('u206','입구')==='gate'&&api.useOf('u206','길목')===null&&
 api.useOf('cult03','수확실')==='harvest'&&api.useOf('cult03','방벽 구획')==='bulwark'&&api.useOf('cult03','코어 전실')==='corehall'&&api.useOf('cult03','앞방')==='narthex'&&api.useOf('cult03','입구')==='narthex'&&api.useOf('cult03','연결 회랑')===null&&api.useOf('cult03','길목')===null);
const Ad=audit('u205',ADMIN,30,['memory','memhall','sealed']);
const Co=audit('u206',ADMIN,25,['link','ward','bodies','transfer']);
const Cu=audit('cult03',CULT,18,['harvest','bulwark','corehall']);
{const pods=[Ad,Co].flatMap(A=>perRoom(A,/^pod$/)),vit=[Ad,Co].flatMap(A=>perRoom(A,/^vitals$/)),rigs=[Ad,Co].flatMap(A=>perRoom(A,/^rig$/));
 ok('capsule rooms: capsules only in memory rooms, transfer rooms and protected sections, at most three per room, and every room with a capsule has a vitals monitor ('+pods.filter(q=>q.n>0).length+' rooms, at least 8)',pods.filter(q=>q.n>0).length>=8&&pods.every(q=>q.n<=3)&&pods.filter(q=>q.n>0).every(q=>/^(memory|transfer|ward)$/.test(q.use))&&pods.every((q,i)=>q.n===0||vit[i].n>=1));
 ok('machine-body rooms hold body rigs: every body room has one, at least two of them are rows (two or more); rigs stand nowhere but body rooms and sealed sections',rigs.filter(q=>q.use==='bodies').length>=3&&rigs.filter(q=>q.use==='bodies').every(q=>q.n>=1)&&rigs.filter(q=>q.use==='bodies'&&q.n>=2).length>=2&&rigs.filter(q=>q.n>0).every(q=>/^(bodies|sealed)$/.test(q.use)));
 ok('sealed sections and link rooms read as plant: machines or coolers in each region, no capsules there',Ad.rows.some(p=>p.r523.use==='sealed'&&/^(machine|cooler)$/.test(p.r523.art))&&Co.rows.some(p=>p.r523.use==='link'&&/^(machine|cooler)$/.test(p.r523.art))&&[...Ad.rows,...Co.rows].every(p=>!/^(sealed|link)$/.test(p.r523.use)||p.r523.art!=='pod'));
 const bar=perRoom(Cu,/^barrier$/),lot=perRoom(Cu,/^lotus$/);
 ok('threshold of Samong: at least two barrier sections are rows of stone barriers (three or more), lotus core stands in every harvest room, barriers only in barrier sections',bar.filter(q=>q.use==='bulwark'&&q.n>=3).length>=2&&bar.filter(q=>q.n>0).every(q=>q.use==='bulwark')&&lot.filter(q=>q.use==='harvest').length>=3&&lot.filter(q=>q.use==='harvest').every(q=>q.n>=1));
 ok('fourth batch: no household furniture, no stairs or alarm boxes in any of the three regions',[...Ad.rows,...Co.rows,...Cu.rows].every(p=>!/sofa|bed|tv|fridge|table|chair|wardrobe|suitcase|trash|mirror|shelf|flamp|range|steps|alarm/.test(p.r523.art)));
 ok('fourth batch: connectors (길목), empty corridors (빈 복도) and connecting galleries (연결 회랑) get nothing',[Ad,Co,Cu].every(A=>{const nm=new Map(A.L.worldR74.rooms.map(q=>[q.id,q.name]));return A.rows.every(p=>!/^(길목|빈 복도|연결 회랑)$/.test(nm.get(p.r523.room)||''));}));
 ok('new art for the fourth batch: five existing game pieces put on the 2:1 floor as one-direction art in assets/r527, three direction-less pieces straight from world-r80',['rig','pod','tank','lanterns','barrier'].every(k=>ART[k]&&ART[k].ang==='iso'&&!ART[k].pair&&/^assets\/r527\/[a-z-]+\.webp$/.test(ART[k].path))&&['vitals','lotus','reliq'].every(k=>ART[k]&&ART[k].ang==='pole'&&/^assets\/world-r80\/r80-\d+\.webp$/.test(ART[k].path)));
 ok('fourth batch: one-direction art is mirrored only on the opposite wall',[...Ad.rows,...Co.rows,...Cu.rows].filter(p=>!ART[p.r523.art].pair&&ART[p.r523.art].ang==='iso'&&p.r523.tag!=='screen').every(p=>!!p.r303Flip===(ART[p.r523.art].face!==p.r523.wall)));}
ok('corridors stay passable: a connector gets at most 3 pieces',[C,Hm].every(A=>{const c={};for(const p of A.rows)if(/hall|passage/.test(p.r523.use))c[p.r523.room]=(c[p.r523.room]||0)+1;return Object.values(c).every(v=>v<=3);}));
// 그림 방향: 두 방향 그림은 벽에 맞는 쪽을 쓰고(거울 아님), 한 방향 그림만 반대 벽에서 좌우 거울
ok('two-direction art is used unmirrored on its own wall',Hm.rows.filter(p=>ART[p.r523.art].pair).length>20&&Hm.rows.filter(p=>ART[p.r523.art].pair).every(p=>!p.r303Flip&&ART[p.r523.art].face===p.r523.wall));
ok('one-direction art is mirrored only on the opposite wall',[...C.rows,...Hm.rows,...Ev.rows,...Gl.rows].filter(p=>!ART[p.r523.art].pair&&ART[p.r523.art].ang==='iso'&&p.r523.tag!=='screen').every(p=>!!p.r303Flip===(ART[p.r523.art].face!==p.r523.wall)));
// 침대 가림막(R521 과 같은 규칙): 관찰실 침대 줄 발치에도 가림막
ok('observation beds get a screen at the foot (entrance side)',C.rows.some(p=>p.r523.use==='observe'&&p.r523.art==='curtain'&&p.r523.d>3));

// ---- 묶음 규칙: 주인이 빠지면 딸린 것도 빠진다 · 조형물이 생기면 그 곁만 다시 가린다 ---------------------------
{const w=world(FX.ep1a09),before=api.list(w).slice(),builds=api.inspect().stats.builds,bed=before.find(p=>p.r523.use==='observe'&&p.r523.art==='bed');
 const mates=before.filter(p=>p.r523.room===bed.r523.room&&Math.hypot(p.x-bed.x,p.y-bed.y)<2.2&&p!==bed&&/monitor|iv|overbed/.test(p.r523.art));
 w.props.push({id:'r103chest:test',x:bed.x,y:bed.y,height:50,solid:false,visible:true,chestR103:true});const after=api.list(w);
 ok('a chest appearing on a bed removes that bed and what belonged to it, nothing else far away',!after.includes(bed)&&mates.length>0&&mates.every(m=>!after.includes(m))&&after.length>=before.length-6&&after.every(p=>before.includes(p)));
 ok('that only re-filters — the wall search is not repeated',api.inspect().stats.builds===builds);
 w.props.pop();const back=api.list(w);ok('removing it brings the same pieces back (same objects, same ids)',back.length===before.length&&back.every((p,i)=>p===before[i]));}

// ---- 그리기: 덧붙였다 되돌린다 · 예전 가구는 그리는 동안만 쉰다 ------------------------------------------------
{const b=boot({ready:['assets/hospital-maze/bed.png']}),w=world(FX.ep1a09),orig=w.props,len=orig.length,ids=orig.map(p=>p.id).join();b.ctx.room=w;b.ctx.cam={x:46,y:92};b.ctx.draw();
 const fr=b.frames[0]||[],mine=fr.filter(i=>/^r523:/.test(i));
 ok('draw: every piece is appended for that frame only (room.props itself untouched)',mine.length>3&&mine.length===b.api.list(w).length&&w.props===orig&&orig.length===len&&orig.map(p=>p.id).join()===ids);
 // 벽 장식(R91)은 그리기 목록의 조형물 수가 바뀌면 벽 장식을 다시 짠다 → 카메라가 움직여도 덧붙이는 수가 같아야 한다(화면 밖이라고 빼지 않는다)
 b.ctx.cam={x:12,y:20};b.ctx.draw();const fr2=b.frames[b.frames.length-1]||[];
 ok('draw: the appended count does not change with the camera (stable prop count for the wall-decor planner)',fr2.length===fr.length&&fr2.filter(i=>/^r523:/.test(i)).length===mine.length);
 // 화면 밖 가구는 목록에는 남기고 visible=false 로만 둔다(엔진 drawProp 이 첫 줄에서 돌아간다) — 그리는 일은 화면 근처 것만
 {const rows=b.api.list(w),P=b.ctx.project,on=p=>{const q=P(p.x,p.y);return q.x>-130&&q.x<b.ctx.W+130&&q.y>-40&&q.y<b.ctx.H+150;};
  ok('draw: off-screen pieces stay in the list but are switched invisible; on-screen ones are visible',rows.some(p=>p.visible===false)&&rows.some(p=>p.visible===true)&&rows.every(p=>p.visible===on(p)));
  b.ctx.cam={x:46,y:92};b.ctx.draw();ok('draw: visibility follows the camera',rows.every(p=>p.visible===on(p))&&rows.filter(p=>p.visible).length>3);}
 ok('draw: old R449/R224 furniture outside the fight rooms is rested for that frame (entrance too); fight-room pieces stay',!fr.includes('r449:furn:ep1a09:6:0')&&!fr.includes('r224:furn:ep1a09:6')&&!fr.includes('r449:furn:ep1a09:3:0')&&fr.includes('r449:furn:ep1a09:0:0')&&fr.includes('r224:furn:ep1a09:0')&&fr.includes('r449:furn:ep1a09:2:0')&&fr.includes('r224:furn:ep1a09:2'));
 ok('draw: off-angle region dressing (r80-148 in the middle of a room) is rested, direction-less piles stay',!fr.includes('r80:scene:ep1a09:x')&&fr.includes('r80:scene:ep1a09:y'));
 {const b2=boot({ready:[]}),w2=world(FX.ep1a09);b2.ctx.room=w2;b2.ctx.cam={x:86,y:54};b2.ctx.draw();const f2=b2.frames[0]||[];
  ok('draw: off-angle R74 scenery (front-view sofa skin, no path of its own) is rested too; other R74 scenery stays',f2.some(i=>/^r523:/.test(i))&&!f2.includes('r74:ep1a09:scenery:x')&&f2.includes('r74:ep1a09:scenery:y'));}
 ok('draw: missing images are requested and kept in the region list',b.asked.length>0&&!b.asked.includes('assets/hospital-maze/bed.png')&&b.ctx.regionById.ep1a09.paths.length>=8);
 b.api.set({on:false});const before=b.frames.length;b.ctx.draw();const off=b.frames[before];
 ok('off switch: nothing appended, old furniture drawn again',off.every(i=>!/^r523:/.test(i))&&off.includes('r449:furn:ep1a09:6:0')&&off.includes('r80:scene:ep1a09:x')&&b.api.list(w).length===0);
 b.api.set({on:true});
 const stored=boot({stored:'{"on":false}'});stored.ctx.room=world(FX.ep1a09);ok('off switch is read from storage',stored.api.list(stored.ctx.room).length===0);}
// 손대지 않는 방(복도 등)의 각도 맞는 예전 가구는 그대로 둔다 — 꾸미는 방 안의 것만 쉬게 한다
{const b=boot({ready:[]}),w=world(FX.ep1b03),L=w.exploration,nm=new Map(L.worldR74.rooms.map(q=>[q.id,q.name])),cor=L.r224Rooms.find(q=>nm.get(q.id)==='복도'&&q.x1-q.x0>=9&&q.y1-q.y0>=9),std=L.r224Rooms.find(q=>nm.get(q.id)==='서재');
 const mk=(id,q)=>({id,path:'assets/world-r80/r80-026.webp',x:(q.x0+q.x1)/2,y:(q.y0+q.y1)/2,height:70,solid:false,visible:true,r80Dressing:true,r449Furniture:true});
 w.props.push(mk('r449:old:corridor',cor),mk('r449:old:study',std));b.ctx.room=w;b.ctx.cam={x:50,y:50};b.ctx.draw();const fr=b.frames[0]||[];
 ok('old angle-matched furniture is rested only inside rooms this overlay furnishes; in rooms it leaves alone (corridors) it stays',fr.some(i=>/^r523:/.test(i))&&fr.includes('r449:old:corridor')&&!fr.includes('r449:old:study'));}
{const b=boot();for(const[id,layer,extra]of[['ep1b06','STORY',{}],['ep1a08','STORY',{}],['ep1a09','SAMONG',{}],['last302','STORY',{}]]){const w=world(FX.ep1a09,{id,layer});Object.assign(w.exploration,extra);ok('not handled: '+id+' / '+layer,b.api.enabled(w)===false&&b.api.list(w).length===0);}
 const w=world(FX.ep1a09);w.exploration.samongR103={};ok('not handled: samong maps',b.api.enabled(w)===false);}

// ---- 작은 가짜 방: 벽 줄·문 틈·구석·거울 대칭 ------------------------------------------------------------
function tiny(opt={}){const cells=[],x0=10,y0=10,x1=opt.t?22:30,y1=opt.t?30:22;for(let x=x0;x<x1;x++)for(let y=y0;y<y1;y++)cells.push([x,y]);
 const T=(a,b)=>opt.t?[b,a]:[a,b];if(opt.door)for(const a of[18,19]){const[x,y]=T(a,9);cells.push([x,y]);const[x2,y2]=T(a,8);cells.push([x2,y2]);}
 const walls=[];if(opt.thin){const[cx,cy]=T(20,16);walls.push(opt.t?{x:cx,y:cy,width:.24,depth:8,height:2.85,angle:0}:{x:cx,y:cy,width:8,depth:.24,height:2.85,angle:0});}
 const L={bounds:[0,0,60,60],floorCells:cells,walls,r224Rooms:[{id:7,x0,y0,x1,y1}],worldR74:{rooms:[{id:7,name:opt.name||'관찰실'}],doors:[]},worldWardR81:{}};
 return{id:'ep1a09',layer:'STORY',exploration:L,props:[],enemies:[]};}
{const w=tiny(),runs=api.runsOf(w.exploration.r224Rooms[0],hitOf(w.exploration));
 ok('plain room: one north run and one west run, both ending in the inner corner',runs.length===2&&runs[0].wall==='n'&&runs[0].len===20&&Math.abs(runs[0].at-10)<.03&&runs[0].c0!=null&&Math.abs(runs[0].c0-10)<.03&&runs[1].wall==='w'&&runs[1].len===12&&Math.abs(runs[1].at-10)<.03&&runs[1].c0!=null);
 const rows=api.list(w),cab=rows.find(p=>p.r523.tag==='corner');
 ok('corner cabinet sits in the corner: side and back both within .9 of the two walls',!!cab&&cab.r523.art==='medcab'&&cab.r521Foot[0]-10<.9&&cab.r521Foot[1]-10<.9);
 ok('beds stand head-to-wall on the long wall',rows.filter(p=>p.r523.art==='bed').length>=3&&rows.filter(p=>p.r523.art==='bed').every(p=>p.r523.wall==='n'&&p.r521Foot[1]-10<.9&&p.r521Foot[3]-p.r521Foot[1]>1.7));
 const t=tiny({t:true}),rt=api.list(t),key=(p,sw)=>p.r523.art+'@'+(sw?p.y:p.x).toFixed(2)+','+(sw?p.x:p.y).toFixed(2)+(p.r303Flip?'~':'');
 const A=rows.map(p=>key(p,false)).sort(),Bm=rt.map(p=>key({...p,r303Flip:ART[p.r523.art].pair||ART[p.r523.art].face==='s'||!ART[p.r523.art].face?p.r303Flip:!p.r303Flip},true)).sort();
 ok('mirror symmetry: the same room turned onto the west wall gives the mirrored plan',rows.length>6&&A.join('|')===Bm.join('|'));}
{const w=tiny({door:true}),L=w.exploration,runs=api.runsOf(L.r224Rooms[0],hitOf(L)).filter(r=>r.wall==='n'),rows=api.list(w);
 ok('door gap splits the wall run in two and both ends at the gap are open',runs.length===2&&runs.every(r=>r.len===8||r.len===10)&&runs.some(r=>r.a1===18&&r.c1==null)&&runs.some(r=>r.a0===20&&r.c0==null));
 ok('nothing stands within 1 tile of the door gap',rows.length>3&&rows.filter(p=>p.r523.wall==='n'&&p.r523.d<2).every(p=>{const f=p.r521Foot||[p.x-.2,0,p.x+.2,0];return f[2]<=17.05||f[0]>=20.95;}));}
{const w=tiny({thin:true}),L=w.exploration,q={id:7,x0:10,y0:16,x1:30,y1:22},runs=api.runsOf(q,hitOf(L)).filter(r=>r.wall==='n');
 ok('thin wall: the run follows the wall face (.12 past the line), only where the wall is',runs.length===1&&Math.abs(runs[0].at-16.12)<.03&&runs[0].a0===16&&runs[0].a1===24);}
{const w=tiny(),L=w.exploration;L.walls.push({x:20,y:13,width:.24,depth:6,height:2.85,angle:0});/* 북쪽 벽에서 방 안으로 뻗은 얇은 칸막이(x=20, y 10~16) */
 const runs=api.runsOf(L.r224Rooms[0],hitOf(L)).filter(r=>r.wall==='n'),rows=api.list(w);
 ok('a thin partition crossing the wall run splits it in two, both ends closed by the partition faces',runs.length===2&&runs.some(r=>r.a1===20&&r.c1!=null&&Math.abs(r.c1-19.88)<.04)&&runs.some(r=>r.a0===20&&r.c0!=null&&Math.abs(r.c0-20.12)<.04));
 ok('nothing straddles the partition',rows.length>4&&rows.filter(p=>p.r521Foot&&p.r523.wall==='n').every(p=>p.r521Foot[2]<=19.9||p.r521Foot[0]>=20.1));}
{const w=tiny({name:'보스 전투실'});ok('fight room: no plan',api.list(w).length===0);
 const g=tiny();g.exploration.worldWardR81={bossBounds:[8,8,32,24],gatherBounds:[0,0,1,1]};ok('room overlapping the boss bounds: no plan',api.list(g).length===0);}
// 진단 값(inspect)은 지금 지역 것이어야 한다 — 지역을 오가면 계획은 캐시에서 나오므로, 고치기 전에는 마지막으로 짠 지역의 방 수·탈락 수가 남아 있었다(R525 에서 찾음)
{const b=boot(),a=world(FX.ep1b07),c=world(FX.murder04);b.ctx.room=a;const na=b.api.list(a).length,Ia=b.api.inspect();b.ctx.room=c;const nc=b.api.list(c).length;b.ctx.room=a;b.api.list(a);const I=b.api.inspect();
 ok('diagnostics follow the region on screen: after visiting another region and coming back, inspect() describes this one again',na>0&&nc>0&&!!I.plan&&I.plan.region==='ep1b07'&&I.stats.placed===na&&I.stats.rooms===Ia.stats.rooms&&I.stats.dropped===Ia.stats.dropped&&I.stats.pushed===Ia.stats.pushed&&I.dropLog.length===Ia.dropLog.length&&I.stats.builds===Ia.stats.builds+1);}
console.log('\nR523 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
