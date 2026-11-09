// R449 CPU check — 공간 기능별 조형물 배치(R224 방 가구를 방 이름·기능에 맞춘 한 묶음으로, 교차로·마당·짧은 통로 비움, 같은 종류 방 돌려쓰기)
//  + 남긴 가구 그림 다시 읽기 + 키 큰 조형물이 몹·문·제단·상자를 가리면 옅게. 그리기 전용(충돌·저장·id 불변), 결정적(재입장·저장 불러오기 같은 결과).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='props-space-r449.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once, right after bossroom-tidy-r438 and before combat-read-r409',html.split('"./'+F+'"').length===2&&/<script src="\.\/bossroom-tidy-r438\.js"><\/script><script src="\.\/props-space-r449\.js"><\/script><script src="\.\/combat-read-r409\.js"><\/script>/.test(html));
ok('loads after the overlays it cooperates with (R140·R169·R224·R303·R406·R412)',['props-variety-r140.js','play-r169.js','cave-r204.js','props-fit-r303.js','props-place-r406.js','props-tidy-r412.js'].every(f=>html.indexOf('"./'+f+'"')>0&&html.indexOf('"./'+f+'"')<html.indexOf('"./'+F+'"')));
ok('listed in verify-r96-public.py',/'props-space-r449\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/node r96\/qa\/r449\/r449-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const code=src.replace(/\/\/.*$/mg,'');
ok('Mammon ep1b06·samong·dream layers excluded',/r\.id!=='ep1b06'/.test(code)&&/samongR103/.test(code)&&/r\.layer==='STORY'/.test(code));
ok('presentation only: no hp/save/collision/solid writes, no props array replacement',!/\.hp\s*=[^=]|saveGame|serializeSave|restoreSave|\.walls\s*=|floorCells\s*=|\.solid\s*=|\.props\s*=[^=]|\.enemies\s*=[^=]/.test(code));
ok('no per-frame re-plan: plan once per room+layout, re-apply only when the props count changes',/st\.L===r\.exploration&&!opt\.force\)\{(?:const sig=sigOf\(r\);)?if\(st\.sig!==sig\)/.test(code)&&/setTimeout\(poll,400\)/.test(code));
ok('no randomness (deterministic rules)',!/Math\.random|Date\.now\(\)\s*%|crypto/.test(code.replace(/const t=Date\.now\(\)/,'')));
ok('forge set has no indoor flame furnace r80-039',!/P\('039'/.test(code));

// ---- 가짜 세계 ---------------------------------------------------------------------------------
const ART={'024':[512,339,1.08],'025':[512,367,1.15],'026':[290,512,1.15],'027':[494,512,1.15],'141':[213,512,1.15],'142':[512,434,1.08],'143':[236,512,1.15],'144':[384,512,1.08],'145':[347,512,1.15],'146':[507,512,1.15],'148':[512,457,1.08],'149':[444,512,1.15],'045':[479,512,1.15],'018':[167,512,1.7],'039':[495,512,1.15]};
const assets={};for(const[k,[w,h,s]]of Object.entries(ART))assets['r80-'+k]={path:'assets/world-r80/r80-'+k+'.webp',width:w,height:h,scale:s,frame:{pivot:[w/2,h-8]}};
const CLINIC=['142','144','148','141','143','149','146','145'];
function world(id='ep1a09',kind=CLINIC){
 const rooms=[{id:0,name:'보스 전투실',x0:6,y0:6,x1:26,y1:20},{id:2,name:'중앙 전투실',x0:4,y0:27,x1:28,y1:39},{id:3,name:'주사실',x0:40,y0:4,x1:56,y1:16},{id:4,name:'갈림길',x0:40,y0:20,x1:52,y1:30},
  {id:5,name:'처치 대기실',x0:60,y0:4,x1:74,y1:14},{id:6,name:'길목',x0:60,y0:20,x1:64,y1:34},{id:7,name:'앞방',x0:80,y0:4,x1:90,y1:14},{id:8,name:'앞방',x0:80,y0:20,x1:90,y1:30},
  {id:9,name:'앞방',x0:80,y0:36,x1:90,y1:46},{id:10,name:'약품 보관실',x0:40,y0:40,x1:60,y1:62},{id:11,name:'작은 마당',x0:96,y0:4,x1:110,y1:16}];
 const cells=[];for(const q of rooms)for(let x=q.x0;x<q.x1;x++)for(let y=q.y0;y<q.y1;y++)cells.push([x,y]);
 cells.push([48,3]);/* 주사실 북쪽 벽 문 틈 */
 const L={floorCells:cells,r224Rooms:rooms.map(({id,x0,y0,x1,y1})=>({id,x0,y0,x1,y1})),worldR74:{rooms:rooms.map(q=>({id:q.id,name:q.name})),doors:[{x:89.5,y:9,width:1.2}]},
  worldWardR81:{bossBounds:[6,6,26,20],gatherBounds:[4,27,28,39]},entry:{x:44,y:14.5}};
 const props=[];let k=0;
 for(const r of L.r224Rooms){const w=r.x1-r.x0,d=r.y1-r.y0;if(w<5||d<5)continue;const want=Math.max(1,Math.min(4,Math.round(w*d/45)));let put=0;
  const spots=[];for(let x=r.x0+1.5;x<r.x1-1;x+=3.2)spots.push([x,r.y0+.85]);for(let y=r.y0+2.6;y<r.y1-1;y+=3.2)spots.push([r.x0+.85,y]);
  for(const[x,y]of spots){if(put>=want)break;const a=assets['r80-'+kind[k%kind.length]];props.push({id:'r224:furn:'+id+':'+(k++),path:a.path,x,y,height:64*a.scale,solid:false,visible:true,enabled:true,r80Dressing:true,r80Art:'r80-'+kind[(k-1)%kind.length],r80PresentationOnly:true,r224Furniture:true});put++;}}
 props.push({id:'r80:scene:'+id+':lamp',path:'assets/world-r80/r80-018.webp',x:70,y:30,height:90,solid:false});
 props.push({id:'r74:'+id+':door-1',x:89.5,y:9,r74Door:true,solid:true});
 const enemies=[{id:'m1',x:50,y:10,homeX:50,homeY:10,hp:10},{id:'m2',x:52,y:11,homeX:52,homeY:11,hp:10}];
 return{id,layer:'STORY',exploration:L,props,enemies,objective:{x:100,y:10}};}
const pathSet=new Set();for(let y=4;y<14;y++)pathSet.add('60,'+y);/* 대기실 서쪽 벽을 따라 가는 길 */
function boot(){const drawn=[],asked=[],ready=new Set(['x.webp']);
 const ctx={localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>0,console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,
  __STORYWORLD_ASSETS_R80_DATA__:{assets},__STORYWORLD_PLAY_R169__:{pathCells:()=>pathSet},
  StoryPhase1:{explorationBlocked:(L,x,y,r)=>{const S=new Set(L.floorCells.map(c=>c[0]+','+c[1]));for(const[dx,dy]of[[-r,-r],[r,-r],[-r,r],[r,r]])if(!S.has(Math.floor(x+dx)+','+Math.floor(y+dy)))return true;return false;}},
  readyImage:p=>ready.has(p)?{image:{naturalWidth:300,naturalHeight:400},path:p}:null,ensureImages:ps=>{asked.push(...ps);return Promise.resolve();},/* 그림은 처음엔 안 읽힘(엔진이 지운 상태) */
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),zoom:1,actorHeight:()=>60,loading:false,room:undefined,
  drawProp:function(p){drawn.push(p.id);},sprite:function(){}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);return{ctx,api:ctx.__STORYWORLD_PROPS_SPACE_R449__,drawn,asked};}
const {ctx,api,drawn,asked}=boot();
ok('api exported',!!api&&typeof api.curate==='function'&&typeof api.coverAlpha==='function'&&typeof api.plan==='function');
ok('space table: names → kinds',api.spaceOf('주사실')==='work'&&api.spaceOf('갈림길')==='junction'&&api.spaceOf('순환로')==='junction'&&api.spaceOf('계단참')==='junction'&&api.spaceOf('길목')==='corridor'&&api.spaceOf('그을린 복도')==='corridor'&&
 api.spaceOf('처치 대기실')==='rest'&&api.spaceOf('외곽 쉼길')==='rest'&&api.spaceOf('작은 마당')==='yard'&&api.spaceOf('약품 보관실')==='storage'&&api.spaceOf('앞방')==='ante'&&api.spaceOf('방화 전실')==='ante'&&
 api.spaceOf('빈 방')==='living'&&api.spaceOf('입구')==='entry'&&api.spaceOf('다음 구역 문')==='entry'&&api.spaceOf('보스 전투실')==='boss'&&api.spaceOf('중앙 전투실')==='boss'&&api.spaceOf('')==='room');
const w0=world();const before=JSON.parse(JSON.stringify(w0));ctx.room=w0;const rep=api.curate(w0);
ok('curated with a report',!!rep&&rep.kind==='clinic'&&rep.kept>0&&rep.placed>0);
const mine=w=>w.props.filter(p=>p&&p.r449Furniture);const shown=list=>list.filter(p=>!p.r303Hide);
const inR=(id,p,w=w0)=>{const q=w.exploration.r224Rooms.find(r=>r.id===id);return p.x>=q.x0&&p.x<=q.x1&&p.y>=q.y0&&p.y<=q.y1;};
const ofRoom=(id,w=w0)=>mine(w).filter(p=>p.r449.room===id);const arts=list=>shown(list).map(p=>String(p.r80Art).slice(4));
const r224In=(id,w=w0)=>w.props.filter(p=>p.r224Furniture&&inR(id,p,w));
ok('original props keep ids, order and count; new furniture only appended (r449:furn:region:room:n)',before.props.every((p,i)=>w0.props[i]&&w0.props[i].id===p.id)&&w0.props.slice(before.props.length).every(p=>p.r449Furniture&&/^r449:furn:ep1a09:\d+:\d+$/.test(p.id)));
ok('non-R224 props untouched',w0.props.slice(0,before.props.length).filter(p=>!p.r224Furniture).every(p=>JSON.stringify(p)===JSON.stringify(before.props.find(q=>q.id===p.id))));
ok('R224 objects only rested (r303Hide), never moved/re-skinned/removed',w0.props.slice(0,before.props.length).filter(p=>p.r224Furniture).every(p=>{const b=before.props.find(q=>q.id===p.id);const c={...p};delete c.r303Hide;return JSON.stringify(c)===JSON.stringify(b)&&(!p.r303Hide||p.r303Hide==='r449');}));
ok('new furniture is non-solid presentation; enemies untouched',mine(w0).every(p=>p.solid===false&&p.r80PresentationOnly===true)&&JSON.stringify(w0.enemies)===JSON.stringify(before.enemies));
ok('boss room and gather room keep their R224 furniture (boss-room work owns them); no new pieces there',[0,2].every(id=>r224In(id).length>0&&r224In(id).every(p=>!p.r303Hide)&&ofRoom(id).length===0));
ok('all R224 furniture outside boss/gather rooms rests',w0.props.filter(p=>p.r224Furniture&&!inR(0,p)&&!inR(2,p)).every(p=>p.r303Hide==='r449'));
ok('junction (갈림길) and yard (작은 마당) left empty',ofRoom(4).length===0&&ofRoom(11).length===0&&r224In(4).length>0);
ok('short corridor (4 tiles wide) left empty',ofRoom(6).length===0);
const plan3=rep.rooms.find(q=>q.id===3),work=arts(ofRoom(3));
ok('injection room = bed (core first) + IV/monitor cluster on one wall',/^142@/.test(plan3.pieces[0]||'')&&work.includes('142')&&work.length>=2&&work.every(a=>['142','141','143'].includes(a))&&new Set(ofRoom(3).map(p=>p.r449.wall)).size===1);
const rest=arts(ofRoom(5));ok('waiting room = row of chairs (+wheelchair); chairs are the only repeat',rest.filter(a=>a==='145').length>=2&&rest.every(a=>['145','149'].includes(a)));
ok('no other art repeats inside one room',[3,7,8,9,10].every(id=>{const a=arts(ofRoom(id));return a.length===new Set(a).size;}));
const ante=[7,8,9].map(id=>arts(ofRoom(id)));ok('repeated anterooms rotate: full set, lighter variant, then an empty room',ante[0].join()==='146,145'&&ante[1].join()==='149'&&ante[2].length===0);
const big=ofRoom(10);ok('big storage room: cabinet run + one different piece on the other wall',big.length>=2&&arts(big)[0]==='148'&&new Set(big.map(p=>p.r449.wall)).size===2);
ok('room size cap like R224 (1 per 45 tiles, 1–4)',w0.exploration.r224Rooms.every(q=>ofRoom(q.id).length<=Math.max(1,Math.min(4,Math.round((q.x1-q.x0)*(q.y1-q.y0)/45)))));
const all=shown(mine(w0));
ok('every placed piece sits inside its room rect, on free floor',all.every(p=>{const q=w0.exploration.r224Rooms.find(r=>r.id===p.r449.room);return p.x>q.x0&&p.x<q.x1&&p.y>q.y0&&p.y<q.y1&&!ctx.StoryPhase1.explorationBlocked(w0.exploration,p.x,p.y,.05);}));
ok('placed pieces keep clear of doors (1.6), entry (2.2), objective (2), door gaps in the back wall',all.every(p=>Math.hypot(p.x-89.5,p.y-9)>=1.6&&Math.hypot(p.x-44,p.y-14.5)>=2.2&&Math.hypot(p.x-100,p.y-10)>=2&&!(Math.abs(p.x-48.5)<1.4&&p.y<6)));
ok('placed pieces keep off the R169 entry→goal path (>1.3 from path cells)',all.every(p=>[...pathSet].every(k=>{const[x,y]=k.split(',').map(Number);return Math.hypot(x+.5-p.x,y+.5-p.y)>=1.3;})));
ok('placed pieces keep clear of other props (.95)',all.every(p=>w0.props.filter(q=>!q.r224Furniture&&!q.r449Furniture&&q.path).every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=.95)));
ok('back to the wall: body .4–2 tiles from the n/w wall it belongs to',all.every(p=>{const q=w0.exploration.r224Rooms.find(r=>r.id===p.r449.room);const d=p.r449.wall==='n'?p.y-q.y0:p.x-q.x0;return d>=.4&&d<=2.0;}));
ok('wall clearance measured by R412 (cabinet 148 ≥ .8, IV stand 141 ≥ .75 from its wall) — R412 need not move it, so the draw spot is the same after load',(()=>{const MIN={'148':.8,'141':.75};const xs=all.filter(p=>MIN[String(p.r80Art).slice(4)]);return xs.length>=2&&xs.every(p=>{const q=w0.exploration.r224Rooms.find(r=>r.id===p.r449.room);const a=String(p.r80Art).slice(4);const d=(p.r449.wall==='n'?p.y-q.y0:p.x-q.x0);return d>=MIN[a]-.01;/* 가짜 그림은 발이 가운데라 pivotShift 0 */});})());
ok('facing: +y art mirrored on the -x wall, sofa/bed (+x) mirrored on the -y wall, R412/R406 told',all.every(p=>{const a=String(p.r80Art).slice(4),side=p.r449.wall==='n'?'-y':'-x',want=a==='146'?false:/^(021|024|142)$/.test(a)?side==='-y':side==='-x';return !!p.r303Flip===want&&p.r412Face===side&&p.r406Seen===1;}));
ok('kept images (evicted by the engine) requested again; rested R224 images not requested',all.every(p=>asked.includes(p.path))&&asked.every(x=>all.some(p=>p.path===x)));
// 결정성: 같은 지도를 다시(소품 순서 섞고, 몹이 움직이거나 죽은 뒤, R224 가 다른 자리·개수로 놓아도) 만들어도 같은 결과
const sig=w=>mine(w).map(p=>p.id+'|'+p.path+'|'+(+p.x).toFixed(3)+','+(+p.y).toFixed(3)+'|'+(p.r303Hide||'')+'|'+(p.r303Flip?1:0)).sort().join(';');
const b2=boot(),w1=world();w1.props.reverse();w1.enemies.forEach(e=>{e.x+=3;e.y-=2;e.homeX+=3;e.hp=0;});
const r224s=w1.props.filter(p=>p.r224Furniture);for(const p of r224s.slice(0,6))w1.props.splice(w1.props.indexOf(p),1);r224s[8].x+=1.3;/* R224 가 몇 점 덜 놓고 한 점은 다른 자리 */
b2.ctx.room=w1;b2.api.curate(w1);
ok('deterministic: same map → same placement (props shuffled, mobs moved/dead as after a load, R224 count/spots differ)',sig(w1)===sig(w0)&&sig(w0).length>0);
b2.api.curate(w1);ok('idempotent: curating again adds nothing and moves nothing',sig(w1)===sig(w0)&&mine(w1).length===mine(w0).length);
ok('plan ignores mobs: same placement with a full mob crowd',(()=>{const b=boot(),w=world();for(let i=0;i<12;i++)w.enemies.push({id:'x'+i,x:45+i,y:5+i%3,homeX:45+i,homeY:5+i%3,hp:9});b.ctx.room=w;b.api.curate(w);return sig(w)===sig(w0);})());
// 소품 배열을 다른 모듈이 새로 만들어도 다시 들어간다
const b5=boot(),w5b=world();b5.ctx.room=w5b;b5.api.curate(w5b);const n5=mine(w5b).length;w5b.props=w5b.props.filter(p=>!p.r449Furniture);b5.api.curate(w5b);
ok('own pieces re-inserted if another module rebuilt the props array (same objects, no duplicates)',mine(w5b).length===n5&&new Set(mine(w5b).map(p=>p.id)).size===n5);
// 나중에 붙은 상자: 곁의 한 점만 쉬고, 계획은 그대로; 상자가 없어지면 돌아온다
const victim=all[0];const chest={id:'r103chest:STORY:ep1a09',x:victim.x+.4,y:victim.y+.2,chestR103:true};w0.props.push(chest);api.curate(w0);
ok('late chest: only the piece next to it rests (r449x), the rest keep their place',victim.r303Hide==='r449x'&&all.filter(p=>p!==victim).every(p=>!p.r303Hide||p.r303Hide==='r449x'&&Math.hypot(p.x-chest.x,p.y-chest.y)<1.5));
w0.props.splice(w0.props.indexOf(chest),1);api.curate(w0);ok('late chest gone: the piece comes back at the same spot',!victim.r303Hide);
// 칠죄(질투): 지역 그림(거울)만, 보스방 틀+3 칸 안에는 두지 않음
const b3=boot(),HOME=['024','026','027','025'],w3=world('ep1b03',HOME);w3.exploration.sinRoomArt='sin-room-art-v1';b3.ctx.room=w3;b3.api.curate(w3);
const placed3=shown(mine(w3));
ok('envy region: only the envy mirror r80-026 is placed',placed3.length>0&&placed3.every(p=>p.r80Art==='r80-026'));
ok('envy region: nothing placed inside boss frame+3',placed3.every(p=>!(p.x>=3&&p.x<=29&&p.y>=3&&p.y<=23)));
// 맘몬·꿈 층·사몽 은 손대지 않는다
// 격자 지역: 이름만 다른 10×10 방들(문 틈 없음, R169 길에서 먼 x 200~)
function grid(id,names,kind,rect){const rooms=names.map((nm,i)=>rect&&rect[i]?{id:i,name:nm,...rect[i]}:{id:i,name:nm,x0:200+(i%6)*14,y0:4+Math.floor(i/6)*14,x1:210+(i%6)*14,y1:14+Math.floor(i/6)*14});
 const cells=[];for(const q of rooms)for(let x=q.x0;x<q.x1;x++)for(let y=q.y0;y<q.y1;y++)cells.push([x,y]);
 const L={floorCells:cells,r224Rooms:rooms.map(({id,x0,y0,x1,y1})=>({id,x0,y0,x1,y1})),worldR74:{rooms:rooms.map(q=>({id:q.id,name:q.name})),doors:[]},worldWardR81:{bossBounds:[6,6,26,20],gatherBounds:[4,27,28,39]}};
 const props=kind.map((a,i)=>{const q=rooms[i%rooms.length];const s=assets['r80-'+a];return{id:'r224:furn:'+id+':'+i,path:s.path,x:q.x0+1.5+i*.01,y:q.y0+.85,height:64,solid:false,visible:true,r80Dressing:true,r224Furniture:true,r80Art:'r80-'+a};});
 return{id,layer:'STORY',exploration:L,props,enemies:[]};}
const count=(w,a)=>shown(mine(w)).filter(p=>p.r80Art==='r80-'+a).length;
{const names=[...Array(20)].map(()=> '앞방').concat(['예배실']);const b7=boot(),w7=grid('ep1a99',names,CLINIC);b7.ctx.room=w7;const rp=b7.api.curate(w7);
 const arts=Object.fromEntries(['146','145','149','148','142'].map(a=>[a,count(w7,a)]));const rep7=rp.rooms;
 ok('same art at most 6 per region (cluster core capped → that room left empty, why=repeat)',Object.values(arts).every(n=>n<=6)&&arts['146']===6&&rep7.some(q=>q.why==='repeat'&&!q.pieces.length));
 ok('story-named rooms take the art budget before generic connectors (예배실, last id, still furnished)',rep7.find(q=>q.name==='예배실').pieces.length>0&&/^146@/.test(rep7.find(q=>q.name==='예배실').pieces[0]));}
{const names=['서재','서재','거울 회랑','정돈된 거실'],rect=[{x0:40,y0:40,x1:50,y1:50},{x0:54,y0:40,x1:64,y1:50},{x0:40,y0:54,x1:56,y1:60},{x0:60,y0:54,x1:70,y1:64}];
 const b8=boot(),w8=grid('ep1b03',names,['024','026','027','025'],rect);w8.exploration.sinRoomArt='sin-room-art-v1';b8.ctx.room=w8;const rp=b8.api.curate(w8);const by=nm=>rp.rooms.filter(q=>q.name===nm);
 ok('envy house: studies (서재) stay empty instead of a mirror each; mirror gallery and living room get the mirror',by('서재').every(q=>!q.pieces.length)&&by('거울 회랑')[0].pieces.length===1&&/^026@/.test(by('거울 회랑')[0].pieces[0])&&/^026@/.test(by('정돈된 거실')[0].pieces[0]||''));}
// 계열을 모르는 지역(R224 가 공용 소파 r80-024 만 놓음): 계획 없음 → 소품 수가 바뀌어도 R224 가구는 그대로
{const b6=boot(),w6=world('dist99',['024']);const s6=JSON.stringify(w6.props);b6.ctx.room=w6;b6.api.curate(w6);w6.props.push({id:'r103chest:STORY:dist99',x:70,y:8,chestR103:true});b6.api.curate(w6);b6.api.curate(w6);
 ok('unknown furniture family: no plan, R224 furniture left as is even after props change',JSON.stringify(w6.props.slice(0,-1))===s6&&!w6.props.some(p=>p.r449Furniture||p.r303Hide));}
for(const[label,mut]of[['Mammon ep1b06',w=>{w.id='ep1b06';}],['dream layer',w=>{w.layer='DREAM';}],['samong',w=>{w.exploration.samongR103={key:'x'};}]]){const b4=boot(),w4=world();mut(w4);const s4=JSON.stringify(w4.props);b4.ctx.room=w4;b4.api.curate(w4);ok(label+' untouched',JSON.stringify(w4.props)===s4);}
// 그리기: 쉬는 가구는 안 그리고, 놓은 가구는 그린다
drawn.length=0;const hid=w0.props.find(p=>p.r303Hide==='r449');ctx.drawProp(hid);ctx.drawProp(all[1]);
ok('draw wrapper: rested pieces skipped, placed pieces drawn',!drawn.includes(hid.id)&&drawn.includes(all[1].id));
// 가림 완화
const tall={id:'t',path:'x.webp',x:10,y:10,height:80},w5={id:'z',layer:'STORY',exploration:{worldR74:{doors:[]}},props:[tall],enemies:[{x:9.2,y:9.2,hp:5}],objective:null};ctx.room=w5;
ok('cover fade: live mob behind a tall prop → .4',Math.abs(api.coverAlpha(tall)-.4)<1e-9);
w5.enemies[0].hp=0;ok('cover fade: dead mob → no fade',api.coverAlpha(tall)===1);
w5.enemies=[{x:10.6,y:10.6,hp:5}];ok('cover fade: mob in front → no fade',api.coverAlpha(tall)===1);
const w6={id:'z2',layer:'STORY',exploration:{worldR74:{doors:[{x:9.3,y:9.3}]}},props:[tall],enemies:[],objective:null};ctx.room=w6;ok('cover fade: door behind → .5',Math.abs(api.coverAlpha(tall)-.5)<1e-9);
ok('cover fade: short props never fade',api.coverAlpha({...tall,height:40})===1);
const I=api.inspect();ok('inspect: no errors, collision/saves untouched flags',I.stats.errors===0&&!I.lastError&&I.collisionChanged===false&&I.savesTouched===false);
console.log(n-bad+'/'+n+' ok');process.exit(bad?1:0);
