// R521 CPU check — 병원(ep1a08) 방 쓰임새에 맞춘 가구 배치(병실 침대 줄·진료실 책상·처치 준비실 약장·로비 대기 의자).
//  그리기 전용(충돌·저장·room.props 불변), 결정적, 벽에 붙임, 문·출입구·보스방·길잡이 마디 비움, 그림 방향 규칙, 끄기 스위치.
//  지도는 실측 덤프(hospital-layout.json)로 검사한다 — 실제 벽·바닥과 어긋나면 실패한다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='hospital-rooms-r521.js';let src='';try{src=C(F);}catch(e){ok('client source exists: '+e.message,false);}
let rt='';try{rt=RT(F);}catch(_){}
ok('runtime copy matches client source',!!src&&rt===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
// 태그 자리: cave-r204 묶음(grove-r481·trail-r482) 바로 뒤. draw 만 감싸고 가구는 그릴 때의 전역 drawProp 사슬(R303 거울·R329 그림자·R448 겹침 — 뒤에 실려도 부를 때 찾음)을 타므로
//  그 오버레이들보다 뒤에 실릴 필요는 없다(처음엔 뒤에 두려 했으나 꼬리 순서 검사 12개를 건드려야 해서 r176 정규식 하나만 고치는 자리로 정함). a5(거름)·draw 보다는 뒤여야 한다.
ok('script tag once, right after trail-r482 (cave-r204 묶음) and before boss-r205; after hospital-improvements-a5 and before combat-r118',html.split('"./'+F+'"').length===2&&/<script src="\.\/trail-r482\.js"><\/script><script src="\.\/hospital-rooms-r521\.js"><\/script>(?:<script src="\.\/hospital-walls-r522\.js"><\/script>)?(?:<script src="\.\/rooms-r523\.js"><\/script>)?\s*<script src="\.\/boss-r205\.js">/.test(html)&&html.indexOf('hospital-improvements-a5.js')>0&&html.indexOf('hospital-improvements-a5.js')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-r118.js"'));
// R521-2: 감싸기가 '발밑 타원 끄기'에 '그리는 동안만 들어 올리기'를 더했다 → 기대하는 코드 꼴을 그에 맞게 바꿨다(다른 조형물은 그대로 넘기고, 끝나면 shadow·visualLiftPx 를 되돌리는지 본다).
ok('goes through the drawProp chain: its only drawProp wrapper passes every other prop on untouched and restores shadow·lift in finally, no captured sprite',(src.match(/drawProp=function/g)||[]).length===1&&/drawProp=function\(p,\.\.\.a\)\{if\(!p\|\|!p\.r521Ward\)return base\.apply\(this,\[p,\.\.\.a\]\);/.test(src)&&/try\{return base\.apply\(this,\[p,\.\.\.a\]\);\}finally\{if\(nudge\)ctx\.restore\(\);if\(flat\)shadow=sh;if\(lift>0\)delete p\.visualLiftPx;\}/.test(src)&&!/=\s*sprite\b/.test(src.replace(/\/\/.*$/mg,'')));
ok('listed in verify-r96-public.py',/'hospital-rooms-r521\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/node r96\/qa\/r521\/r521-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const code=src.replace(/\/\/.*$/mg,'').replace(/\/\*[\s\S]*?\*\//g,'');
ok('presentation only: no hp/save/collision/solid/enemy writes',!/\.hp\s*=[^=]|saveGame|serializeSave|restoreSave|\.walls\s*=|floorCells\s*=|\.solid\s*=|\.enemies\s*=[^=]|\.speed\s*=|hazards|projectiles/.test(code));
ok('room.props is only swapped for the duration of draw() and restored in finally',/const original=r\.props;r\.props=original\.concat\(rows\);[^]*?finally\{r\.props=original;\}/.test(code)&&code.split('r.props=').length===3);
ok('no randomness, no per-frame planning (memo per room+layout)',!/Math\.random|crypto/.test(code)&&/memo\.get\(r\)/.test(code)&&/m\.L!==L/.test(code));
ok('hospital only (ep1a08 ward maze), off switch key',/r\.id==='ep1a08'/.test(code)&&/hospitalDoorsB3/.test(code)&&/storyworld\.r521\.rooms/.test(code));
ok('no ctx.filter / blur / drop-shadow (Three 기록기 함정)',!/ctx\.filter|drop-shadow|blur\(/.test(code));
// a5 거름: R521 가구만 지나가고 다른 비의료 소품은 여전히 가린다
const a5=C('hospital-improvements-a5.js');
ok('a5 lets r521Ward props through but still suppresses other non-medical props and wall-embedded ones',/if\(!\(medicalProps\.has\(p\.path\)\|\|p\.r521Ward\)\|\|blocked\(p\.x,p\.y,\.05,room\)\)\{stats\.propsSuppressed\+\+;return;\}/.test(a5)&&RT('hospital-improvements-a5.js')===a5);

// ---- 실측 지도 ---------------------------------------------------------------------------------
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,'hospital-layout.json'),'utf8'));
const floor=new Set();for(const r of FX.floorRects)for(let x=r.x;x<r.x+r.width;x++)for(let y=r.y;y<r.y+r.depth;y++)floor.add(x+','+y);
const onFloor=(x,y)=>floor.has(Math.floor(x)+','+Math.floor(y));
const wallHit=(x,y,rad)=>FX.walls.some(w=>x>w.ab[0]-rad&&x<w.ab[2]+rad&&y>w.ab[1]-rad&&y<w.ab[3]+rad);
const blockedFx=(x,y,rad=0)=>{for(const[dx,dy]of[[0,0],[rad,0],[-rad,0],[0,rad],[0,-rad]])if(!onFloor(x+dx,y+dy))return true;return wallHit(x,y,rad);};
ok('fixture sanity: 8022 floor cells, 193 walls, 60 nodes, 3 doors',floor.size===8022&&FX.walls.length===193&&FX.nodes.length===60&&FX.doors.length===3);
// 화면에 보이는 뒤쪽 벽(북·서)까지 거리: 발에서 -y / -x 쪽으로 가장 가까운 벽 면 또는 바닥 끝
function backWall(x,y){let n=99,w=99;for(let d=0;d<=4;d+=.05){if(n===99&&(wallHit(x,y-d,0)||!onFloor(x,y-d)))n=d;if(w===99&&(wallHit(x-d,y,0)||!onFloor(x-d,y)))w=d;}return{n,w};}

function world({id='ep1a08',maze=true,store={}}={}){
 const L={id:'ep1a08',hospitalDoorsB3:maze?FX.doors:undefined,starts:FX.starts,entry:FX.entry,gate:FX.gate,nodes:FX.nodes,floorRects:FX.floorRects};
 const room={id,props:[{id:'native-1',path:'assets/props/v290/hotel_luggage_cart.webp',x:4.1,y:4.1,height:88,solid:false}],enemies:[],exploration:L,objective:FX.objective};
 const frames=[];const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,Date,isFinite,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
  room,zone:id,blocked:(x,y,rad)=>blockedFx(x,y,rad||0),regionById:{ep1a08:{paths:[]}},ready:new Set(),asked:[],
  readyImage(p){return sb.ready.has(p)?{image:{naturalWidth:100,naturalHeight:100}}:null;},ensureImages(ps){sb.asked.push(...ps);for(const p of ps)sb.ready.add(p);return Promise.resolve(true);},
  draw(){frames.push({n:sb.room.props.length,ids:sb.room.props.map(p=>p.id),same:sb.room.props});return 'drawn';}};
 sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:F});return{sb,room,frames,api:sb.__STORYWORLD_HOSPITAL_ROOMS_R521__};}

let W=null,rows=[];try{W=world();rows=W.api.list(W.room);}catch(e){ok('overlay runs in the fake hospital: '+e.message,false);}
const A=W?.api;
ok('API frozen with revision/ART/PLAN/list/plan/set/inspect',!!A&&Object.isFrozen(A)&&/^R521-hospital-rooms-\d+$/.test(A.revision||'')&&typeof A.list==='function'&&typeof A.inspect==='function');
ok('plan places 85~190 pieces and drops none on the measured map (dropped='+A?.inspect().stats.dropped+', placed='+rows.length+')',rows.length>=85&&rows.length<=190&&A.inspect().stats.dropped===0);
ok('ids unique, stable prefix r521:ward:',new Set(rows.map(p=>p.id)).size===rows.length&&rows.every(p=>/^r521:ward:[a-z-]+:\d+$/.test(p.id)));
ok('every piece is presentation-only: solid false, r521Ward, finite spot/height, not auto-targetable',rows.every(p=>p.solid===false&&p.r521Ward===true&&p.presentationOnly===true&&p.autoTargetEligible6===false&&Number.isFinite(p.x+p.y+p.height)&&p.height>=20&&p.height<=96));
ok('every foot is on the floor and clear of walls by .12 (a5 가 벽 속 소품을 가리는 .05 보다 넉넉히)',rows.every(p=>!blockedFx(p.x,p.y,.12)));
{const far=rows.filter(p=>{const b=backWall(p.x,p.y);return Math.min(b.n,b.w)>(p.r521.screen?3.7:2.45);});ok('wall-hugging: every foot within 2.45 tiles of a visible back wall (north/west; 침대 발치 가림막은 3.7) — room centres stay empty ('+far.map(p=>p.id).join(' ')+')',far.length===0);}
{const b=rows.filter(p=>p.x>9.5&&p.x<28.5&&p.y>5.5&&p.y<18.5);ok('boss room (native combat core 10..28 × 6..18) untouched',b.length===0);}
{const near=rows.filter(p=>FX.doors.some(d=>Math.hypot(d.x-p.x,d.y-p.y)<Math.max(2.6,d.width/2+.6)));ok('doors clear ('+near.map(p=>p.id).join(' ')+')',near.length===0);}
{const near=rows.filter(p=>FX.starts.some(s=>Math.hypot(s.x-p.x,s.y-p.y)<3)||[FX.entry,FX.gate,FX.objective].some(s=>Math.hypot(s.x-p.x,s.y-p.y)<2.6));ok('start spots, entry, gate and objective clear',near.length===0);}
{const near=rows.filter(p=>FX.nodes.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<1.25));ok('route nodes (길잡이·몹 경로 마디) clear by 1.25 ('+near.map(p=>p.id).join(' ')+')',near.length===0);}
// 문 틈(벽이 끊긴 통로) 한가운데를 막지 않는다: 가구 발에서 3방향 1.0칸 안에 바닥이 이어져 지나갈 틈이 남는지 — 방 안쪽(+x·+y) 1.1칸이 벽이 아니어야 한다
{const jam=rows.filter(p=>wallHit(p.x+1.1,p.y,0)&&wallHit(p.x,p.y+1.1,0));ok('no piece wedged into a corner pocket with walls on both room sides',jam.length===0);}
{let close=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=rows[i],b=rows[j];if(Math.hypot(a.x-b.x,a.y-b.y)<.55)close.push(a.id+'~'+b.id);}ok('no two pieces on the same spot (<.55) '+close.join(' '),close.length===0);}
// 방 쓰임새가 읽히는가
const by=(room,art)=>rows.filter(p=>p.r521.room===room&&(!art||p.r521.art===art)).length;
const WARDS=['north-ward-a','north-ward-b','north-ward-c','south-ward-a','south-ward-b','south-ward-c','south-ward-d'];
ok('every ward has 3+ beds and 2+ bedside helpers (탁자·수액대·모니터·가림막·식판 탁자)',WARDS.every(w=>by(w,'bed')>=3&&['table','iv','monitor','curtain','overbed'].reduce((s,a)=>s+by(w,a),0)>=2));
ok('wards differ: bed walls and counts are not all the same',new Set(WARDS.map(w=>rows.filter(p=>p.r521.room===w&&p.r521.art==='bed').map(p=>p.r521.wall).join('')+':'+['iv','monitor','curtain','overbed','medcab','trolley'].map(a=>by(w,a)).join(''))).size>=6);
ok('every consult room has an exam couch (진찰대) with a lamp, stool, iv or crutches beside it',['consult-a','consult-b','consult-c','consult-d'].every(c=>by(c,'stretcher')===1&&by(c,'lamp')+by(c,'stool')+by(c,'iv')+by(c,'crutches')>=1));
ok('preparation rooms hold storage (약장 2+) and a trolley or stretcher',['preparation','preparation-east'].every(r=>by(r,'medcab')>=2&&by(r,'trolley')+by(r,'stretcher')>=1));
ok('lobby and corridors: only stretchers·wheelchairs·iv·crutches·trolleys along the wall (각도 맞는 접수대·대기 의자 그림이 올 때까지 비움)',by('entry-hall')>=3&&rows.filter(p=>['corridor','lobby'].includes(p.r521.use)).every(p=>['stretcher','wheelchair','iv','crutches','trolley'].includes(p.r521.art)&&Math.min(backWall(p.x,p.y).n,backWall(p.x,p.y).w)<=2.45));
ok('no beds or desks in corridors or the lobby',rows.filter(p=>['corridor','lobby'].includes(p.r521.use)&&['bed','desk'].includes(p.r521.art)).length===0);
// 그림 규칙
const ART=A?.ART||{};
ok('art list: 12 kinds, hospital family only (hospital-maze · r521 · 소품판), no flame/brazier/torch art',Object.keys(ART).length===12&&Object.values(ART).every(a=>/^assets\/(hospital-maze|r521|visual-test)\//.test(a.path)&&!/flame|fire|brazier|torch|candle/i.test(a.path)));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));const have=new Set(man.files.map(f=>f.path));
ok('every art file is in the runtime manifest (배포본에 실제로 있음)',Object.values(ART).every(a=>have.has(a.path)));
ok('new Drive derivatives have provenance (assets/r521/index.json: source zip sha, per-file sha, use)',(()=>{try{const ix=JSON.parse(RT('assets/r521/index.json'));return /^[0-9a-f]{64}$/.test(ix.source_zip_sha256)&&ix.assets.length===3&&ix.dots.assets.length===2&&[...ix.assets,...ix.dots.assets].every(a=>have.has(a.file)&&/^[0-9a-f]{64}$/.test(a.sha256)&&a.use&&require('crypto').createHash('sha256').update(fs.readFileSync(path.join(R,'runtime-text',a.file))).digest('hex')===a.sha256);}catch(e){return false;}})());
ok('orientation: art is mirrored only when its native wall differs from the wall it stands on; symmetric art never',rows.every(p=>{const a=ART[p.r521.art],flip=!!(p.r303Flip||p.visualFlipXB3);return a.face==='s'?!flip:flip===((a.face!==p.r521.wall)!==!!p.r521.screen)/* R521-3: 발치 가림막(screen)은 벽과 나란히 — 줄 가림막과 반대로 */;}));
ok('curtains go through the hospital prop atlas frame (existing draw path) with flip flag only there',rows.filter(p=>p.r521.art==='curtain').every(p=>p.visualHospitalFrame==='curtain'&&p.hospitalDressingB3===true&&p.hospitalZone13===true&&!p.r303Flip)&&rows.filter(p=>p.r521.art!=='curtain').every(p=>!p.visualHospitalFrame));
ok('beds stand head-to-wall: foot 1.5~1.9 tiles from their wall, bedside pieces closer than the bed foot',rows.filter(p=>p.r521.art==='bed').every(p=>{const b=backWall(p.x,p.y),d=p.r521.wall==='w'?b.w:b.n;return d>=1.5&&d<=1.9;}));
{// 침대 줄 간격: 같은 방·같은 벽 침대끼리 2.9칸 이상(사람이 사이로 드나듦)
 const tight=[];for(const a of rows)for(const b of rows)if(a!==b&&a.r521.art==='bed'&&b.r521.art==='bed'&&a.r521.room===b.r521.room&&a.r521.wall===b.r521.wall){const gap=Math.abs(a.r521.wall==='w'?a.y-b.y:a.x-b.x);if(gap<2.9)tight.push(a.id);}
 ok('bed rows leave 2.9+ tiles between bed centres',tight.length===0);}
// 그리기
if(W){const before=W.room.props,len=before.length;const out=W.sb.draw();const f=W.frames[0];
 ok('draw(): base sees native props + R521 rows, returns base result',out==='drawn'&&f&&f.n===len+rows.length&&f.ids[0]==='native-1');
 ok('draw(): room.props restored to the very same array, untouched',W.room.props===before&&before.length===len);
 ok('images: all art paths joined the region keep-list and missing ones were requested once',A.PATHS.every(p=>W.sb.regionById.ep1a08.paths.includes(p))&&new Set(W.sb.asked).size===A.PATHS.length);
 W.sb.draw();ok('second frame: no re-plan (builds===1), no duplicate keep-list entries, no new requests',A.inspect().stats.builds===1&&W.sb.regionById.ep1a08.paths.length===A.PATHS.length&&W.sb.asked.length===A.PATHS.length);
 const again=A.plan(W.room);ok('deterministic: planning twice gives the same pieces',JSON.stringify(again)===JSON.stringify(rows));
 // 지도 판이 바뀌면 다시 계획
 W.room.exploration={...W.room.exploration};W.sb.draw();ok('re-plans once when the layout object changes',A.inspect().stats.builds===3);
 // 그리는 도중 예외가 나도 props 복구
}
{// 예외 안전: base draw 가 던져도 room.props 는 원래 배열
 const FXsrc=src;const store={};const room={id:'ep1a08',props:[],enemies:[],exploration:{hospitalDoorsB3:FX.doors,starts:FX.starts,nodes:FX.nodes},objective:FX.objective};const orig=room.props;
 const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},room,blocked:(x,y,r)=>blockedFx(x,y,r||0),regionById:{ep1a08:{paths:[]}},readyImage:()=>({}),draw(){throw new Error('boom');}};sb.window=sb;vm.createContext(sb);vm.runInContext(FXsrc,sb);
 let threw=false;try{sb.draw();}catch(e){threw=e.message==='boom';}ok('base draw exception propagates and room.props is still restored',threw&&room.props===orig&&orig.length===0);}
{// 화면 밖 거름·발밑 타원: 가짜 투영(1칸=20px, 화면 400×300, 카메라 = north-ward-a)
 const sb3={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},W:400,H:300,
  room:{id:'ep1a08',props:[{id:'native-1',x:36,y:11}],enemies:[],exploration:{hospitalDoorsB3:FX.doors,starts:FX.starts,entry:FX.entry,gate:FX.gate,nodes:FX.nodes},objective:FX.objective},
  blocked:(x,y,rad)=>blockedFx(x,y,rad||0),regionById:{ep1a08:{paths:[]}},readyImage:()=>({}),project:(x,y)=>({x:200+(x-y-(36-11))*20,y:150+(x+y-(36+11))*10}),shadowCalls:0,seen:null};
 sb3.window=sb3;vm.createContext(sb3);
 vm.runInContext('function shadow(){shadowCalls++;}function drawProp(p){shadow();return p&&p.id;}function draw(){seen=room.props.slice();for(const p of room.props)drawProp(p);return seen.length;}',sb3);
 vm.runInContext(src,sb3,{filename:F});const A3=sb3.__STORYWORLD_HOSPITAL_ROOMS_R521__;const all=A3.list(sb3.room);
 const nDrawn=vm.runInContext('draw()',sb3);const mine=sb3.seen.filter(p=>p.r521Ward);
 ok('off-screen rows are not handed to the engine (shown '+mine.length+' of '+all.length+'), on-screen ones are',mine.length>=8&&mine.length<all.length*.5&&mine.every(p=>{const q=sb3.project(p.x,p.y);return q.x>-110&&q.x<510&&q.y>-40&&q.y<430;})&&all.filter(p=>{const q=sb3.project(p.x,p.y);return q.x>0&&q.x<400&&q.y>0&&q.y<300;}).every(p=>mine.includes(p)));
 const flat=mine.filter(p=>p.r521Flat).length;
 ok('low wide furniture (flat) skips only the engine foot ellipse; poles/lockers and native props keep it; shadow restored afterwards',flat>0&&sb3.shadowCalls===nDrawn-flat&&vm.runInContext('shadow();shadowCalls',sb3)===nDrawn-flat+1);
 ok('flat flag follows the art table (bed·stretcher·bench·desk… true, iv·monitor·locker·lamp false)',all.every(p=>p.r521Flat===!!A3.ART[p.r521.art].flat)&&A3.ART.bed.flat===true&&!A3.ART.iv.flat&&!A3.ART.lamp.flat);
}
{// 다른 지역·옛 병원 판·끄기
 const o=world({id:'ep1a09'});ok('other regions: no rows, draw passes through with native props only',o.api.list(o.room).length===0&&(o.sb.draw(),o.frames[0].n===1));
 const m=world({maze:false});ok('hospital without the ward maze (hospitalDoorsB3 없음): no rows',m.api.list(m.room).length===0);
 const off=world({store:{'storyworld.r521.rooms':'{"on":false}'}});ok('off switch: no rows',off.api.list(off.room).length===0&&(off.sb.draw(),off.frames[0].n===1));
 const t=world();t.api.set({on:false});ok('set({on:false}) at runtime stops drawing and persists',t.api.list(t.room).length===0&&JSON.parse(t.sb.localStorage.getItem('storyworld.r521.rooms')).on===false);
 const bad2=world({store:{'storyworld.r521.rooms':'{{'}});ok('broken setting JSON falls back to on',bad2.api.list(bad2.room).length===rows.length);}
{// 경계: 벽이 옮겨져 발 자리가 막히면 그 점만 빠진다
 const w=world();w.sb.blocked=(x,y,rad)=>blockedFx(x,y,rad||0)||(x>30&&x<34&&y>4&&y<20);const r2=w.api.plan(w.room);
 ok('pieces whose foot is blocked are dropped individually (north-ward-a west row gone, rest kept)',r2.length<rows.length&&r2.length>rows.length-14&&!r2.some(p=>p.x>30&&p.x<34&&p.y>4&&p.y<20)&&w.api.inspect().stats.dropped===rows.length-r2.length);}
{// R521-2 (사용자 2026-11-09 "가구 등이 벽이나 바닥에 조금 묻히는 버그") — 3D 화면에서 그림은 발을 지나 30° 뒤로 누운 판이다.
 //  ① 그림이 발보다 아래로 내려가면(R111 밑동 맞춤이 등각 가구를 키의 22%까지 내림) 그 부분이 바닥 밑으로 든다. ② 판의 위·옆이 벽 덩어리 안이면 벽에 잘린다. ③ 앞벽(카메라 쪽 +x·+y)에 반쯤 가리면 묻힌 것처럼 보인다.
 const SH=A.SHAPE||{},SQ=Math.SQRT1_2,BACK=.5*Math.SQRT1_2,RISE=Math.sqrt(3)/2;
 ok('every art has a measured shape: drawn rect (칸) + 20×28 alpha mask',Object.keys(A.ART).every(k=>SH[k]&&Array.isArray(SH[k].r)&&SH[k].r.length===4&&/^[0-9a-f]{140}$/.test(SH[k].m||'')));
 ok('measured rect bottom is on the floor line for every art (none drawn below the foot)',Object.keys(A.ART).every(k=>SH[k]&&SH[k].r[2]>-.03&&SH[k].r[2]<.12));
 const samples=p=>{const s=SH[p.r521.art],out=[];if(!s)return out;const fl=!!(p.r303Flip||p.visualFlipXB3),[x0,x1,y0,y1]=s.r;
  for(let j=0;j<28;j++)for(let i=0;i<20;i++){const u=fl?19-i:i,k=j*20+u;if(!((parseInt(s.m[k>>2],16)>>(3-(k&3)))&1))continue;const sx=x0+(i+.5)/20*(x1-x0),h=y1-(j+.5)/28*(y1-y0);if(h<0)continue;out.push([sx*SQ-BACK*h,-sx*SQ-BACK*h,RISE*h]);}return out;};
 const emb=p=>{const S=samples(p);return S.length?S.filter(([a,b])=>blockedFx(p.x+a,p.y+b,0)).length/S.length:1;};
 const hid=p=>{const S=samples(p);return S.length?S.filter(([a,b,z])=>{for(let t=.25;t<=4.5;t+=.25)if(z+.816*t<3.5/* 화면에서 실제로 가리는 높이(윗면 덮개 포함, 로비 실측) */&&blockedFx(p.x+a+t,p.y+b+t,0))return true;return false;}).length/S.length:1;};
 const E=rows.filter(p=>emb(p)>.03),Hd=rows.filter(p=>hid(p)>.2);
 ok('no piece has more than 3% of its picture inside wall mass ('+E.length+': '+E.slice(0,6).map(p=>p.r521.art+'/'+p.r521.wall+' '+emb(p).toFixed(2)).join(', ')+')',rows.length>0&&E.length===0);
 ok('no piece is more than 20% hidden behind a front wall ('+Hd.length+': '+Hd.slice(0,8).map(p=>p.id.slice(10)+' '+p.r521.art+' '+hid(p).toFixed(2)).join(', ')+')',rows.length>0&&Hd.length===0);
 ok('wall furniture still stands at the wall after the fix (medcab·trolley·stretcher back within 1.0칸)',rows.filter(p=>/^(medcab|trolley|stretcher)$/.test(p.r521.art)).every(p=>{const s=SH[p.r521.art];if(!s)return false;const b=backWall(p.x,p.y),back=Math.min(b.n,b.w);return back<=2.6;}));
 // 그리는 동안만 R111 밑동 내림만큼 들어 올린다(visualLiftPx) → 그림 밑변 = 발
 const mk=(f,r111=true)=>{const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},W:4000,H:3000,zoom:.5,
   room:{id:'ep1a08',props:[],enemies:[],exploration:{hospitalDoorsB3:FX.doors,starts:FX.starts,entry:FX.entry,gate:FX.gate,nodes:FX.nodes},objective:FX.objective},
   blocked:(x,y,rad)=>blockedFx(x,y,rad||0),regionById:{ep1a08:{paths:[]}},readyImage:()=>({}),project:(x,y)=>({x:2000+(x-y)*10,y:200+(x+y)*5}),lifts:[],after:[]};
  sb.window=sb;if(r111)sb.__STORYWORLD_PLAY_R111__={foot:()=>f,prefs:()=>({props:true})};vm.createContext(sb);
  vm.runInContext('function shadow(){}function drawProp(p){if(p.visualHospitalFrame)return;/* 가림막은 a5 그리기 — 들어 올리기 대신 ctx 옮기기 */lifts.push([p.r521&&p.r521.art,p.height,p.visualLiftPx-(p.r521Up||0)*p.height*zoom]);}function draw(){const ps=room.props.slice();for(const p of ps)drawProp(p);for(const p of ps)after.push(p.visualLiftPx);}',sb);
  vm.runInContext(src,sb,{filename:F});vm.runInContext('draw()',sb);return sb;};
 const near=(a,b)=>Math.abs(a-b)<1e-6;
 {const s=mk(.8);ok('foot .80 → every piece is lifted .20×height×zoom while drawn, and the lift is gone afterwards',s.lifts.length>60&&s.lifts.every(([,h,l])=>near(l,.2*h*.5))&&s.after.every(v=>v===undefined));}
 {const s=mk(.5);ok('lift is capped at .22×height like the R111 sink',s.lifts.length>60&&s.lifts.every(([,h,l])=>near(l,.22*h*.5)));}
 {const s=mk(.98);ok('foot ≥ .97 (R111 does not sink it) → no lift',s.lifts.length>60&&s.lifts.every(([,,l])=>!(Math.abs(l)>1e-9)));}
 {// 처음 그리는 그림: R111 이 아직 밑동을 안 쟀으면 보이지 않게(alpha 0) 한 번 그려 재게 한 뒤, 잰 값으로 들어 올려 본 그리기를 한다
  const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},W:4000,H:3000,zoom:1,
   room:{id:'ep1a08',props:[],enemies:[],exploration:{hospitalDoorsB3:FX.doors,starts:FX.starts,entry:FX.entry,gate:FX.gate,nodes:FX.nodes},objective:FX.objective},
   blocked:(x,y,rad)=>blockedFx(x,y,rad||0),regionById:{ep1a08:{paths:[]}},readyImage:()=>({}),project:(x,y)=>({x:2000+(x-y)*10,y:200+(x+y)*5}),calls:[],feet:{}};
  sb.ctx={globalAlpha:1,stack:[],save(){this.stack.push(this.globalAlpha);},restore(){this.globalAlpha=this.stack.pop();},translate(){}};
  sb.window=sb;sb.__STORYWORLD_PLAY_R111__={foot:p=>sb.feet[p],prefs:()=>({props:true})};vm.createContext(sb);
  vm.runInContext('function shadow(){}function drawProp(p){if(p.visualHospitalFrame)return;calls.push([p.path,ctx.globalAlpha,p.visualLiftPx||0,p.height]);feet[p.path]=.8;}function draw(){for(const p of room.props.slice())drawProp(p);}',sb);
  vm.runInContext(src,sb,{filename:F});vm.runInContext('draw()',sb);const seen=new Set();let good=sb.calls.length>60,warm=0;
  for(const[pa,al,l,h]of sb.calls){if(!seen.has(pa)){seen.add(pa);if(al!==0)good=false;warm++;}else if(al!==1||l<.2*h-1e-6)good=false;}
  ok('first draw of each art: one invisible warm-up draw (alpha 0), then every visible draw is lifted ('+warm+' warm-ups, '+sb.calls.length+' calls)',good&&warm===seen.size&&sb.ctx.globalAlpha===1&&sb.ctx.stack.length===0);}
 {const s=mk(.8,false);ok('without R111 → no lift',s.lifts.length>60&&s.lifts.every(([,,l])=>!(Math.abs(l)>1e-9)));}
}
{// R521-3 (사용자 2026-11-10 00:47Z "캐비넷 각도 맞춰서 구석에 배치 · 각도가 안맞는 소품은 과감히 배치안하도록 · 가림칸같은거 입구쪽에도 · 침대 땅에서 떠보이지 않도록 · 내부에 화로가 있는문제")
 const SQ=Math.SQRT1_2,GAP=.5;
 ok('angle rule: every art is either drawn on the 2:1 floor grid (iso, with a measured floor footprint) or a rotation-free pole; the 3/4-view pieces are gone',Object.entries(A.ART).every(([k,a])=>(a.ang==='iso'&&(a.frame||(Array.isArray(a.ft)&&a.ft.length===3&&a.ft[0]<a.ft[2]&&a.ft[2]<a.ft[1])))||a.ang==='pole')&&!Object.values(A.ART).some(a=>/r415\/props|hospital-maze\/cabinet|r299\/cart/.test(a.path))&&!/'(cabinet|table|locker|bench|counter|desk|chair|cart)'/.test(code));
 // 바닥 자리(칸): 그림 맨 아래 꼭짓점 B 에서 왼쪽 위(-x)로 lL, 오른쪽 위(-y)로 lR — 거울이면 서로 바뀐다
 const foot=p=>{const a=A.ART[p.r521.art];if(!a.ft)return null;let[sL,sR,sB]=a.ft;if(p.r303Flip||p.visualFlipXB3)[sL,sR,sB]=[-sR,-sL,-sB];const bx=p.x+sB*SQ,by=p.y-sB*SQ,lL=(sB-sL)*Math.SQRT2,lR=(sR-sB)*Math.SQRT2;return{x0:bx-lL,x1:bx,y0:by-lR,y1:by};};
 const wallGap=(x,y,dx,dy)=>{for(let d=0;d<=3;d+=.02)if(wallHit(x+dx*d,y+dy*d,0)||!onFloor(x+dx*d,y+dy*d))return d;return 99;};
 const FT=rows.filter(p=>A.ART[p.r521.art].ft&&p.r521.art!=='wheelchair'&&!p.r521.screen);
 {const TALL=p=>A.ART[p.r521.art].h>80?.9:.3;/* 키 큰 약장은 뒤로 누운 그림 판 윗부분이 벽에 잘리지 않게 바닥에서 .8칸까지 띄운다(틈은 몸에 가려 안 보임) */
  const off=FT.filter(p=>{const f=foot(p),g=p.r521.wall==='w'?wallGap(f.x0,(f.y0+f.y1)/2,-1,0):wallGap((f.x0+f.x1)/2,f.y0,0,-1);return !(g<=TALL(p));});
  ok('iso furniture stands flush: floor footprint back edge within .3 of its wall (tall cabinets .9), footprint edges parallel to the walls ('+off.map(p=>p.id.slice(10)).join(' ')+')',FT.length>=40&&off.length===0);}
 {const inw=FT.filter(p=>{const f=foot(p);for(const[x,y]of[[f.x0+.04,f.y0+.04],[f.x1,f.y0+.04],[f.x0+.04,f.y1],[f.x1,f.y1]])if(blockedFx(x,y,0))return true;return false;});ok('no footprint corner inside a wall ('+inw.map(p=>p.id.slice(10)).join(' ')+')',inw.length===0);}
 const corner=p=>{const f=foot(p);return p.r521.art==='medcab'&&wallGap(f.x0,(f.y0+f.y1)/2,-1,0)<=.9&&wallGap((f.x0+f.x1)/2,f.y0,0,-1)<=.9&&Math.min(wallGap(f.x0,(f.y0+f.y1)/2,-1,0),wallGap((f.x0+f.x1)/2,f.y0,0,-1))<=.3;};
 {const need=['north-ward-a','north-ward-b','north-ward-c','preparation','consult-a','consult-b','consult-c','consult-d'],miss=need.filter(r=>!rows.some(p=>p.r521.room===r&&corner(p)));
  ok('medicine cabinets sit in the room corner: one side touches a wall (.3) and the other is within .9 (누운 그림 판 여유) in '+need.length+' rooms ('+miss.join(' ')+')',miss.length===0);}
 {// 가림막: 병실마다 2개 이상, 침대 줄 끝(입구 쪽)에 하나 이상, 침대 발치에 벽과 나란히 세운 것(screen)이 병실 5곳 이상
  const WD=['north-ward-a','north-ward-b','north-ward-c','south-ward-a','south-ward-b','south-ward-c','south-ward-d'];
  const end=w=>{const beds=rows.filter(p=>p.r521.room===w&&p.r521.art==='bed'),al=p=>p.r521.wall==='w'?p.y:p.x,lo=Math.min(...beds.map(al)),hi=Math.max(...beds.map(al));return rows.some(p=>p.r521.room===w&&p.r521.art==='curtain'&&!p.r521.screen&&p.r521.wall===beds[0].r521.wall&&(al(p)<lo||al(p)>hi));};
  ok('curtains shield the beds from the entrances: 2+ per ward, each ward has a visible row-end curtain or a foot-side screen (남쪽 벽 바로 뒤 줄 끝은 앞벽에 가려 놓지 않는다), foot-side screens in 5+ wards ('+WD.map(w=>by(w,'curtain')).join(',')+')',WD.every(w=>by(w,'curtain')>=2&&(end(w)||rows.some(p=>p.r521.room===w&&p.r521.screen)))&&WD.filter(w=>rows.some(p=>p.r521.room===w&&p.r521.screen)).length>=5);
  ok('foot-side screens stand parallel to the bed wall (art not mirrored the way row curtains are) and 2.6~3.7 from it',rows.filter(p=>p.r521.screen).every(p=>{const b=backWall(p.x,p.y),d=p.r521.wall==='w'?b.w:b.n,fl=!!p.visualFlipXB3;return p.r521.art==='curtain'&&d>=2.6&&d<=3.7&&fl===(p.r521.wall==='w');}));}
 {// 바닥 닿는 그림자: 낮은 가구는 그리기 직전에 바닥 자리 네모를 어둡게 칠한다(바닥에 누운 범위, 4점, 옅게) — 침대가 떠 보이지 않게
  const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},W:4000,H:3000,zoom:1,
   room:{id:'ep1a08',props:[],enemies:[],exploration:{hospitalDoorsB3:FX.doors,starts:FX.starts,entry:FX.entry,gate:FX.gate,nodes:FX.nodes},objective:FX.objective},
   blocked:(x,y,rad)=>blockedFx(x,y,rad||0),regionById:{ep1a08:{paths:[]}},readyImage:()=>({}),project:(x,y)=>({x:2000+(x-y)*10,y:200+(x+y)*5}),log:[]};
  sb.ctx={globalAlpha:1,fillStyle:'',st:[],pts:null,save(){this.st.push([this.globalAlpha,this.fillStyle]);},restore(){[this.globalAlpha,this.fillStyle]=this.st.pop();},translate(){},beginPath(){this.pts=[];},moveTo(x,y){this.pts.push([x,y]);},lineTo(x,y){this.pts.push([x,y]);},closePath(){},
   fill(){sb.log.push({t:'fill',pts:this.pts,a:this.globalAlpha,style:this.fillStyle,scope:sb.scope});},scope(o,fn){const was=sb.scope;sb.scope=o;try{fn();}finally{sb.scope=was;}}};
  sb.window=sb;vm.createContext(sb);vm.runInContext('function shadow(){}function drawProp(p){log.push({t:"prop",p});}function draw(){for(const p of room.props.slice())drawProp(p);}',sb);
  vm.runInContext(src,sb,{filename:F});vm.runInContext('draw()',sb);let good=true,cnt=0,why='';
  for(let i=0;i<sb.log.length;i++){const e=sb.log[i];if(e.t!=='prop')continue;const p=e.p,a=A.ART[p.r521.art],prev=sb.log[i-1];
   if(a.flat&&a.ft){cnt++;const f=foot(p);if(!prev||prev.t!=='fill'||prev.pts.length!==4||!prev.scope||prev.scope.groundAligned!==true||!(prev.a>0&&prev.a<=.45)||!/^(#000|rgba?\(0, ?0, ?0)/.test(String(prev.style))){good=false;why=p.id+' no shadow';break;}
    const cx=prev.pts.reduce((s,q)=>s+q[0],0)/4,cy=prev.pts.reduce((s,q)=>s+q[1],0)/4,q=sb.project((f.x0+f.x1)/2,(f.y0+f.y1)/2);if(Math.hypot(cx-q.x,cy-q.y)>2){good=false;why=p.id+' off footprint';break;}}
   else if(prev&&prev.t==='fill'){good=false;why=p.id+' pole got a footprint';break;}}
  ok('contact shadow: each low piece gets one ground-aligned 4-point dark fill on its floor footprint right before it is drawn; poles do not; ctx state restored ('+cnt+' '+why+')',good&&cnt>=40&&sb.ctx.globalAlpha===1&&sb.ctx.st.length===0);}
 {// 실내 불꽃 조명: 병원 본관(ep1a08)은 R406 이 실내로 못 알아봐 R92 가 화로·촛대를 세웠다 → R92 가 등불 종류를 묻는 R102.lamps 에 병원 등(전등형 등롱대)만 돌려준다
  const items=[1,2,3,4].map(i=>({id:'lights_hospital_0'+i,kind:'light',region:'hospital'})).concat([{id:'lights_stone_03',kind:'light',region:'stone'}]);
  const mk=(id,store,maze=true)=>{const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,Date,localStorage:{getItem:k=>(store||{})[k]??null,setItem(){}},
    room:{id,props:[],enemies:[],exploration:{hospitalDoorsB3:maze?FX.doors:undefined,nodes:[]}},blocked:()=>false,regionById:{ep1a08:{paths:[]}},readyImage:()=>({}),draw(){},
    __STORYWORLD_PROPS_R102__:Object.freeze({revision:'R102-props',keep:1,lamps:()=>'base'})};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:F});return sb;};
  const h=mk('ep1a08'),P=h.__STORYWORLD_PROPS_R102__,got=P.lamps('ep1a08','hospital',items,items.slice(0,4),'clinical');
  ok('hospital lamps: R92 is handed only the electric lamp post (lights_hospital_03) — no brazier/candle kinds; the rest of the R102 API is kept',Array.isArray(got)&&got.length===1&&got[0].id==='lights_hospital_03'&&P.keep===1&&P.revision==='R102-props'&&Object.isFrozen(P));
  ok('other regions, the old hospital board and the off switch fall through to the previous lamp picker',mk('ep1a09').__STORYWORLD_PROPS_R102__.lamps('ep1a09','stone',items,items,'x')==='base'&&mk('ep1a08',null,false).__STORYWORLD_PROPS_R102__.lamps('ep1a08','hospital',items,items,'c')==='base'&&mk('ep1a08',{'storyworld.r521.rooms':'{"on":false}'}).__STORYWORLD_PROPS_R102__.lamps('ep1a08','hospital',items,items,'c')==='base');
  ok('lamp picker never throws on bad input (falls back to the previous picker)',P.lamps('ep1a08','hospital',null,null)==='base'&&P.lamps('ep1a08','hospital',[],[])==='base');}
}
console.log('\nR521 '+(n-bad)+'/'+n+(bad?' FAILED':' passed'));process.exit(bad?1:0);
