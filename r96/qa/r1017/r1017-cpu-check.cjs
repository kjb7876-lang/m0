// R1017 CPU check — patch.gg(Poly Haven CC0) 디아블로풍 조형물 4점(철문·너울 쓴 왕 석상·촛대·녹슨 침대).
//  (사용자가 고른 6점 중 돌 화덕은 상시 규칙 '실내 화로 금지', 보물상자는 시대 맞는 보관실 없음(현대 호텔·빌라)으로 뺌 — 첫 판 검사에서 바꾼 기대값, 보고서에 적음)
//  철문은 R449 공간 기능별 배치표(예배 계열 긴 회랑)에, 석상·촛대·녹슨 침대는 R523 방 묶음(cult03 코어 전실·앞방·입구, ep1a09 관찰실)에 넣는다
//  (브라우저 그리기 명령 실측: R523 이 맡은 방에서는 R449 가구가 그리는 동안 빠져 화면에 0점 — 두 번째 판에서 바꾼 기대값, 보고서에 적음).
//  그리기 전용(충돌·저장·문·서사 불변), 결정적, 그림은 쿼터뷰 렌더 webp 384px.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='props-diablo-r1017.js';let src='';try{src=C(F);}catch(_){}
ok('client source exists',src.length>0);
let rt='';try{rt=RT(F);}catch(_){}ok('runtime copy matches client source',src.length>0&&rt===src);
try{new vm.Script(src);ok('syntax',src.length>0);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
const at=f=>html.indexOf('"./'+f+'"');
// 자리: R449 는 긴 스크립트 줄 안에 있고 그 뒤 자리(hero-motion-r895→combat-r118, refuge-walls-r713 끝)는 다른 검사가 고정 → R1017 은 그 줄 앞 자기 줄에 두고 R449 가 API 를 내놓는 순간 끼운다.
ok('script tag once, own line before the story-reader line (so before R449), after ui-clean-r1015',html.split('"./'+F+'"').length===2&&at(F)<at('props-space-r449.js')&&at(F)<at('story-reader-r122.js')&&at(F)>at('ui-clean-r1015.js')&&new RegExp('\\n<script src="\\./'+F.replace(/\./g,'\\.')+'"><\\/script>\\n').test(html));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('CI runs this check',/node r96\/qa\/r1017\/r1017-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
// ---- 그림 6점 -------------------------------------------------------------------------------------
const ARTS=['gate','veiled-king','candles','bed'];
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));const rows=new Map(man.files.map(r=>[r.path,r]));
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
for(const a of ARTS){const p='assets/r1017/x1017-'+a+'.webp',fp=path.join(R,'runtime-text',p);let b=null;try{b=fs.readFileSync(fp);}catch(_){}
 ok('art '+a+': file present, ≤64KB, webp',!!b&&b.length<=65536&&b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP');
 ok('art '+a+': in runtime manifest with matching sha256 and in runtime inputs',!!b&&rows.get(p)?.sha256===crypto.createHash('sha256').update(b).digest('hex')&&inputs.textPaths.includes(p));
 ok('art '+a+': listed for the public check',/'assets\/r1017\/'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')));}
let credits='';try{credits=fs.readFileSync(path.join(ROOT,'CREDITS.md'),'utf8');}catch(_){}
ok('CREDITS.md names all four with source Poly Haven and CC0 (checked via patch.gg)',['Large Iron Gate','Gothic Statue','Brass Candleholders','Old Bed Frame'].every(t=>credits.includes(t))&&/Poly Haven/.test(credits)&&/CC0/.test(credits)&&/patch\.gg/.test(credits));
const code=src.replace(/\/\/.*$/mg,'');
ok('no treasure chest shipped (no era-fit storage room)',!fs.existsSync(path.join(R,'runtime-text','assets','r1017','x1017-chest.webp'))&&!/x1017-chest/.test(code));
ok('no fire/brazier art shipped or placed (user rule: no indoor fire)',!/firepit|brazier|화로/.test(code)&&!fs.existsSync(path.join(R,'runtime-text','assets','r1017','x1017-firepit.webp')));
{const m=/const OUTDOOR=(\/.*\/);/.exec(C('props-fit-r303.js'));const OUT=m?eval(m[1]):null;
 ok('art paths are not read as outdoor things by R303 (statue/gate/well names hide indoor art)',!!OUT&&ARTS.every(a=>!OUT.test('assets/r1017/x1017-'+a+'.webp')));}
ok('presentation only: no hp/save/collision/solid writes, no props array replacement',src.length>0&&!/\.hp\s*=[^=]|saveGame|serializeSave|restoreSave|\.walls\s*=|floorCells\s*=|\.solid\s*=|\.props\s*=[^=]|\.enemies\s*=[^=]|\.push\(/.test(code.replace(/list\.splice|\.splice\(/g,'')));
ok('no randomness',src.length>0&&!/Math\.random|crypto/.test(code));
ok('Mammon / samong untouched (works only through R449 eligibility, no region ids of its own)',src.length>0&&!/ep1b06|samong/.test(code));

// ---- 가짜 세계: R449 를 실제로 돌리고 그 뒤에 R1017 ----------------------------------------------------
const R449=C('props-space-r449.js');
const ART={'024':[512,339,1.08],'025':[512,367,1.15],'026':[290,512,1.15],'027':[494,512,1.15],'141':[213,512,1.15],'142':[512,434,1.08],'143':[236,512,1.15],'144':[384,512,1.08],'145':[347,512,1.15],'146':[507,512,1.15],'148':[512,457,1.08],'149':[444,512,1.15],
 '045':[479,512,1.15],'018':[167,512,1.7],'061':[512,468,.52],'062':[488,512,.52],'064':[477,512,1.15],'069':[487,512,1.15],'075':[400,512,1.1]};
function freshAssets(){const A={};for(const[k,[w,h,s]]of Object.entries(ART))A['r80-'+k]={path:'assets/world-r80/r80-'+k+'.webp',width:w,height:h,scale:s,frame:{pivot:[w/2,h-8]}};return A;}
const KIND={clinic:['142','144','148','141','143','149','146','145'],home:['024','025','026','027'],cult:['061','062','064','069']};
function world(id,kind,names){const rooms=names.map((nm,i)=>({id:i,name:nm,x0:4+(i%4)*20,y0:4+Math.floor(i/4)*20,x1:20+(i%4)*20,y1:18+Math.floor(i/4)*20}));
 const cells=[];for(const q of rooms)for(let x=q.x0;x<q.x1;x++)for(let y=q.y0;y<q.y1;y++)cells.push([x,y]);
 const L={floorCells:cells,r224Rooms:rooms.map(({id,x0,y0,x1,y1})=>({id,x0,y0,x1,y1})),worldR74:{rooms:rooms.map(q=>({id:q.id,name:q.name})),doors:[]},worldWardR81:{bossBounds:[200,200,210,210],gatherBounds:[220,220,230,230]}};
 const props=[];let k=0;for(const q of rooms){for(let j=0;j<2;j++){const a=KIND[kind][k%KIND[kind].length];props.push({id:'r224:furn:'+id+':'+(k++),path:'assets/world-r80/r80-'+a+'.webp',x:q.x0+2+j*4,y:q.y0+.85,height:64,solid:false,visible:true,enabled:true,r80Dressing:true,r80Art:'r80-'+a,r80PresentationOnly:true,r224Furniture:true});}}
 return{id,layer:'STORY',exploration:L,props,enemies:[]};}
function boot(opt={}){const store=opt.store||{};const assets=freshAssets();
 const ctx={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},setTimeout:()=>0,console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,
  __STORYWORLD_ASSETS_R80_DATA__:{assets},__STORYWORLD_PLAY_R169__:{pathCells:()=>new Set()},
  StoryPhase1:{explorationBlocked:(L,x,y,r)=>{const S=new Set(L.floorCells.map(c=>c[0]+','+c[1]));for(const[dx,dy]of[[-r,-r],[r,-r],[-r,r],[r,r]])if(!S.has(Math.floor(x+dx)+','+Math.floor(y+dy)))return true;return false;}},
  readyImage:()=>null,ensureImages:()=>Promise.resolve(),project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),zoom:1,actorHeight:()=>60,loading:false,room:undefined,drawProp:function(){},sprite:function(){}};
 ctx.window=ctx;vm.createContext(ctx);const mine=()=>{if(src&&!opt.noR1017){vm.runInContext(src,ctx);if(opt.twice)vm.runInContext(src,ctx);}};
 if(opt.after){vm.runInContext(R449,ctx);mine();}else{mine();vm.runInContext(R449,ctx);}/* 실제 순서: R1017 태그가 R449 보다 앞 */
 return{ctx,assets,api:ctx.__STORYWORLD_PROPS_SPACE_R449__,me:ctx.__STORYWORLD_PROPS_DIABLO_R1017__};}
const b=boot();
ok('api exported',!!b.me&&typeof b.me.inspect==='function');
if(b.me){
const nk=a=>'r80-x1017-'+a;
ok('R449 path: only the gate is an R80 entry (the other three ride R523)',Object.keys(b.me.ART).join()==='gate'&&!b.assets[nk('veiled-king')]&&!b.assets[nk('bed')]);
ok('gate R80 entry registered with finite size, scale and a pivot inside the image',['gate'].every(a=>{const e=b.assets[nk(a)];return e&&e.path==='assets/r1017/x1017-'+a+'.webp'&&e.width>0&&e.width<=384&&e.height>0&&e.height<=384&&Number.isFinite(e.scale)&&e.scale>0&&e.scale<2&&
 Array.isArray(e.frame?.pivot)&&e.frame.pivot.every(Number.isFinite)&&e.frame.pivot[0]>=0&&e.frame.pivot[0]<=e.width&&e.frame.pivot[1]>0&&e.frame.pivot[1]<=e.height&&e.frame.sourceRect?.[2]===e.width&&e.frame.sourceRect?.[3]===e.height;}));
ok('gate is taller than the hero (1.3–1.7 hero heights)',b.assets[nk('gate')].scale>1.3&&b.assets[nk('gate')].scale<1.7);
{const g=fs.readFileSync(path.join(R,'runtime-text','assets','r1017','x1017-gate.webp'));ok('gate lifted from the near-black render (file changed from the first cut 188cf890…)',crypto.createHash('sha256').update(g).digest('hex').slice(0,8)!=='188cf890');}
ok('gate stays out of the R83 selected catalog enumeration (non-enumerable key; qa/r86 active-asset-usage counts 153 there) but is reachable by key',!Object.keys(b.assets).includes(nk('gate'))&&!!b.assets[nk('gate')]&&Object.keys(b.assets).length===Object.keys(freshAssets()).length);
ok('existing R80 entries untouched',Object.entries(freshAssets()).every(([k,v])=>JSON.stringify(b.assets[k])===JSON.stringify(v)));
const mine=w=>w.props.filter(p=>p&&p.r449Furniture&&!p.r303Hide);const arts=(w,room)=>mine(w).filter(p=>room==null||p.r449.room===room).map(p=>String(p.r80Art).replace(/^r80-/,''));
// 계열별 배치 (실제 전수에서 그 공간이 있는 계열만: cult 예배실·긴 회랑, home 보관실, clinic 처치실)
const wc=world('cult01','cult',['예배당','긴 회랑','긴 회랑','긴 회랑','긴 회랑','작은 방']);b.ctx.room=wc;b.api.curate(wc);b.me.cap(wc);
ok('cult worship room (R523 rooms rest R449 furniture there): no R449 statue/candles any more',!arts(wc).some(a=>/veiled|candles/.test(a)));
ok('cult long corridors: iron gate placed by R449, but only one stays visible per region (cap 1)',wc.props.filter(p=>p.r80Art===nk('gate')).length>=2&&mine(wc).filter(p=>p.r80Art===nk('gate')).length===1&&wc.props.filter(p=>p.r303Hide==='r1017cap').every(p=>p.r80Art===nk('gate')));
ok('cap keeps the lowest id (deterministic)',(()=>{const g=wc.props.filter(p=>p.r80Art===nk('gate')).sort((x,y)=>String(x.id).localeCompare(String(y.id)));return !g[0].r303Hide&&g.slice(1).every(p=>p.r303Hide==='r1017cap');})());
ok('cap is stable: running again changes nothing',(()=>{const before=JSON.stringify(wc.props.map(p=>p.r303Hide||''));b.me.cap(wc);return JSON.stringify(wc.props.map(p=>p.r303Hide||''))===before;})());
const wm=world('murder02','home',['물품 보관실','거실','작업실']);b.ctx.room=wm;b.api.curate(wm);b.me.cap(wm);
ok('home family (modern hotel/villa/house, R830 era table) gets no gothic art in any room',arts(wm).length>0&&arts(wm).every(a=>!/x1017/.test(a)));
const wh=world('clinic01','clinic',['주사실','처치실','검사실']);b.ctx.room=wh;b.api.curate(wh);b.me.cap(wh);
ok('clinic work rooms keep R449 as it was (rusty bed moved to R523 observation rooms)',arts(wh,0)[0]==='142'&&!arts(wh).some(a=>/x1017/.test(a)));
const all=[wc,wm,wh].flatMap(mine).filter(p=>/x1017/.test(p.r80Art));
ok('new pieces are non-solid presentation props with finite coordinates and R449 ids',all.length>=1&&all.every(p=>p.solid===false&&p.r80PresentationOnly===true&&Number.isFinite(p.x+p.y+p.height)&&p.height>0&&/^r449:furn:/.test(p.id)&&p.path===b.assets[p.r80Art].path));
// 결정성·멱등
const sig=w=>mine(w).map(p=>p.id+'|'+p.r80Art+'|'+(+p.x).toFixed(3)+','+(+p.y).toFixed(3)).sort().join(';');
{const b2=boot({twice:true}),w2=world('cult01','cult',['예배당','긴 회랑','긴 회랑','긴 회랑','긴 회랑','작은 방']);b2.ctx.room=w2;b2.api.curate(w2);b2.me.cap(w2);
 ok('loading twice adds nothing twice (same plan)',sig(w2)===sig(wc));
 ok('templates not duplicated on a second load',JSON.stringify(b2.api.TEMPLATES)===JSON.stringify(b.api.TEMPLATES));}
{const b6=boot({after:true}),w6=world('cult01','cult',['예배당','긴 회랑','긴 회랑','긴 회랑','긴 회랑','작은 방']);b6.ctx.room=w6;b6.api.curate(w6);b6.me.cap(w6);
 ok('also works when R449 is already loaded (same plan)',sig(w6)===sig(wc));}
ok('R449 api still reachable and frozen after the hook',!!b.api&&Object.isFrozen(b.api)&&b.ctx.__STORYWORLD_PROPS_SPACE_R449__===b.api);
// 끄기
{const b3=boot({store:{'storyworld.r1017.props':'{"on":false}'}}),w3=world('cult01','cult',['예배당','긴 회랑','긴 회랑','긴 회랑','긴 회랑','작은 방']);b3.ctx.room=w3;b3.api.curate(w3);
 const b4=boot({noR1017:true}),w4=world('cult01','cult',['예배당','긴 회랑','긴 회랑','긴 회랑','긴 회랑','작은 방']);b4.ctx.room=w4;b4.api.curate(w4);
 ok('switch off: placement identical to R449 alone',sig(w3)===sig(w4)&&!sig(w3).includes('x1017'));}
// 칠죄 지역 규칙(R438 THEME): 지역 그림만 → 새 그림은 끼지 않는다
{const b5=boot(),w5=world('ep1b03','home',['물품 보관실','거실']);w5.exploration.sinRoomArt='sin-room-art-v1';b5.ctx.room=w5;b5.api.curate(w5);
 ok('sin region with its own art rule: no new art',!arts(w5).some(a=>/x1017/.test(a)));}
}
// ---- R523 방 묶음: 석상·촛대·녹슨 침대 (실제 지도 고정본 + 실제 엔진 벽 판정) -----------------------------------
{const S523=C('rooms-r523.js');let rt523='';try{rt523=RT('rooms-r523.js');}catch(_){}
 ok('R523 runtime copy matches client source',S523.length>0&&rt523===S523);
 ok('R523 art table: veiledking·candles·rustbed point at the R1017 renders (table written by qa/r523/tools/apply-art.py from art8.json)',/ veiledking:\{path:'assets\/r1017\/x1017-veiled-king\.webp',[^\n]*face:'n',ang:'iso'/.test(S523)&&/ candles:\{path:'assets\/r1017\/x1017-candles\.webp',[^\n]*ang:'pole'/.test(S523)&&/ rustbed:\{path:'assets\/r1017\/x1017-bed\.webp',[^\n]*face:'n',ang:'iso'/.test(S523)&&fs.existsSync(path.join(R,'qa','r523','tools','art8.json')));
 const rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
 let E=null;try{const c={window:{},console,performance:{now:()=>0}};vm.createContext(c);vm.runInContext(rd('runtime-text/dist/phase1.js'),c);E=c.window.StoryPhase1.explorationBlocked;}catch(e){}
 ok('engine explorationBlocked loaded',typeof E==='function');
 const lay=fx=>{const cells=[];for(const[y,sp]of Object.entries(fx.floorSpans))for(let i=0;i<sp.length;i+=2)for(let x=sp[i];x<sp[i+1];x++)cells.push([x,+y]);
  return{bounds:[0,0,100,104],floorCells:cells,walls:fx.walls.map(w=>({...w})),r224Rooms:fx.r224Rooms.map(q=>({...q})),worldR74:{rooms:fx.rooms.map(q=>({...q})),doors:fx.doors.map(d=>({...d}))},worldWardR81:fx.worldWardR81?{...fx.worldWardR81}:{},entry:fx.entry,starts:fx.starts};};
 const W5=fx=>({id:fx.id,layer:'STORY',exploration:lay(fx),props:fx.props.map(p=>({...p,solid:false,visible:true})),enemies:[],objective:fx.objective||null});
 const boot5=stored=>{const ctx={localStorage:{getItem:()=>stored||null,setItem:()=>{}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,StoryPhase1:{explorationBlocked:E},
   regionById:{ep1a09:{paths:[]}},readyImage:()=>null,ensureImages:()=>Promise.resolve(),project:(x,y)=>({x:640+(x-y)*27,y:340+(x+y)*13.5}),W:1280,H:676,zoom:1,room:undefined,draw:function(){},drawProp:function(){}};
  ctx.window=ctx;vm.createContext(ctx);vm.runInContext(S523,ctx);return ctx.__STORYWORLD_ROOMS_R523__;};
 const FX={};for(const id of['ep1a09','cult03']){try{FX[id]=JSON.parse(rd('qa/r523/fixtures/'+id+'.json'));}catch(_){}}
 let A=null;try{A=boot5();}catch(e){console.log(String(e.stack).slice(0,300));}
 ok('R523 boots with the real fixtures',!!A&&!!FX.ep1a09&&!!FX.cult03);
 if(A&&E&&FX.ep1a09&&FX.cult03){const NEW=/^(veiledking|candles|rustbed)$/;
  const look=id=>{const w=W5(FX[id]),L=w.exploration,rows=A.list(w),nm=new Map(L.worldR74.rooms.map(q=>[q.id,q.name])),hit=(x,y)=>!!E(L,x,y,.02);return{w,L,rows,nm,hit,mine:rows.filter(p=>NEW.test(p.r523.art))};};
  const cu=look('cult03'),cl=look('ep1a09');
  const kings=cu.mine.filter(p=>p.r523.art==='veiledking');
  ok('cult03 core antechamber (코어 전실): the veiled-king figure stands with a candelabra in the same room ('+kings.length+')',kings.length>=1&&kings.every(k=>cu.nm.get(k.r523.room)==='코어 전실'&&cu.mine.some(c=>c.r523.art==='candles'&&c.r523.room===k.r523.room)));
  ok('cult03 entrance rooms (앞방·입구) light a candelabra',cu.mine.some(p=>p.r523.art==='candles'&&cu.nm.get(p.r523.room)==='앞방')&&cu.mine.some(p=>p.r523.art==='candles'&&cu.nm.get(p.r523.room)==='입구'));
  ok('statue and candles nowhere else in cult03 (not in harvest rooms, barrier sections or corridors), at most one statue per room',cu.mine.every(p=>/^(corehall|narthex)$/.test(p.r523.use))&&new Set(kings.map(k=>k.r523.room)).size===kings.length);
  const rust=cl.mine.filter(p=>p.r523.art==='rustbed');
  ok('ep1a09 observation rooms (관찰실): a rusty iron bed with an IV stand in each, hospital beds still there ('+rust.length+')',rust.length>=2&&rust.every(p=>p.r523.use==='observe'&&cl.rows.some(q=>q.r523.art==='iv'&&q.r523.room===p.r523.room))&&cl.rows.some(p=>p.r523.use==='observe'&&p.r523.art==='bed')&&cl.mine.every(p=>p.r523.art==='rustbed'));
  const all5=[...cu.mine.map(p=>[p,cu]),...cl.mine.map(p=>[p,cl])];
  ok('new pieces: feet on floor, not sunk into a wall (≤1%), not hidden behind a front wall (≤20%)',all5.length>=5&&all5.every(([p,X])=>{const S=A.samplesOf(p.r523.art,!!p.r303Flip);return !X.hit(p.x,p.y)&&A.embedOf(S,p.x,p.y,X.hit)<=.01&&A.hiddenOf(S,p.x,p.y,X.hit)<=.2;}));
  ok('one-direction art (statue, bed) mirrored only on the opposite wall; candles never mirrored',all5.every(([p])=>p.r523.art==='candles'?!p.r303Flip:!!p.r303Flip===(p.r523.wall!=='n')));
  ok('presentation only: not solid, no targeting, rides the R521 draw path',all5.every(([p])=>p.solid===false&&p.presentationOnly===true&&p.autoTargetEligible6===false&&p.r521Ward===true));
  ok('deterministic: same plan twice',(()=>{const A2=boot5(),s=a=>a.list(W5(FX.cult03)).map(p=>p.id+p.r523.art+p.x.toFixed(3)+p.y.toFixed(3)).join();return s(A)===s(A2);})());
  ok('R523 switch off: no new pieces drawn by it',(()=>{const A3=boot5('{"on":false}');try{return !A3.enabled(W5(FX.cult03));}catch(_){return false;}})());}}
console.log(`\nR1017 cpu check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
