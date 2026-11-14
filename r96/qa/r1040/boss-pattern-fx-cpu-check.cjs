// R1040 보스 패턴 바닥 그림 → 프레임 애니메이션 CPU 검사 (사용자 2026-11-14 "보스들이 빨간노랑섞인원 같은거 나오는스킬, 맵전체를 희미하게 뒤덮는 스킬을 다른 프레임애니메이션으로 대체")
//  vm 안에서 엔진 전역(drawHazard·drawNativeGroundArt154·drawEffect·tick·project·drawAssetFrame3)을 흉내 내고 R1040 을 실제로 돌린다.
//  ① 보스 패턴(story-pattern) 터짐(active·recovery) 그림: 원·띠·부채꼴·십자·고리 → 정지 그림 대신 24장 시트, 놓인 자리는 모두 판정 모양 안
//  ② safe(작은 안전지대만 남기고 방 전체) → 방 전체로 늘린 정지 그림 대신 안전지대 바깥에만 안개 루프 + 안전지대 테두리 충격파 고리(안전지대 안에는 안개 없음)
//  ③ 그대로 두는 것: 예고(warning) 단계(R425 예고 끄기 규칙), 근접·원거리 예고(패턴 아닌 호출), 판정 테두리(strokeFootprint154)
//  ④ 안전: 시트가 아직 안 읽혔거나 끄면 원래 정지 그림, NaN 좌표는 그리지 않음, 한 번 터짐은 한 번만 등록·마지막 칸 뒤로 안 그림, 한 프레임 그리기 수 상한(모바일·저사양 절반)
//  ⑤ 연결: index.html 태그, verify 목록, runtime-inputs·manifest, pages.yml, 기존 자산 파일
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const P=path.join(R,'client-source','boss-pattern-fx-r1040.js'),SRC=fs.existsSync(P)?fs.readFileSync(P,'utf8'):null;
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,500));};
const SHEETS=['assets/r411/fx/boss-fire-wall.webp','assets/r411/fx/boss-corpse-explosion.webp','assets/r411/fx/boss-gravity-well.webp','assets/r411/fx/boss-lightning-strike.webp','assets/r411/fx/boss-ground-fissure.webp','assets/r438/fx/enemy-poison-mist.webp','assets/r438/fx/enemy-shockwave.webp','assets/r430/mist-loop.webp'];
function world(opt={}){const store={...(opt.store||{})};
 const g={console,Math,Number,Object,JSON,Map,WeakMap,WeakSet,Set,String,Array,Error,isFinite,parseInt,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},matchMedia:()=>({matches:!!opt.mobile}),innerWidth:opt.mobile?390:1280};
 g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,TILE=34,zoom=1,N=32,settings={lowFx:${!!opt.lowFx}},effects=[],hazards=[],statics=[],strokes=[],draws=[],asks=[],effectDraws=0,owners=[];
  var loaded=new Set(${JSON.stringify(opt.loaded===false?[]:SHEETS)});
  var fills=0,strokesC=0,fieldImgs=0,room={id:'ep1b07',enemies:[{id:'b1',boss:true,x:16,y:12,hp:10}]};window.__STORYWORLD_BOSS_FX_R105__={revision:'stub'};
  var CtxProto={stroke(){strokesC++;},fill(){fills++;}};var ctx=Object.assign(Object.create(CtxProto),{globalAlpha:1,save(){},restore(){},scope(o,fn){owners.push(o);return fn();}});
  function project(x,y){return {x:480+(x-y)*TILE*.7071*zoom,y:120+(x+y)*TILE*.3536*zoom};}
  function actorHeight(){return 96;}
  function readyImage(p){return loaded.has(p)?{image:{naturalWidth:1536,naturalHeight:1024},ready:true}:null;}
  function addImage(p){asks.push(p);}
  function drawAssetFrame3(path,frame,x,y,h,o){draws.push({path,frame,x,y,h,o:o||{}});return true;}
  const finite=(v,d=0)=>Number.isFinite(v)?v:d;
  function lockPatternFootprint154(h){if(h.footprint154)return h.footprint154;const p=h.storyPattern5||{},g={shape:p.shape,x:h.x,y:h.y,originX:h.originX??h.x,originY:h.originY??h.y,angle:finite(h.angle),radius:Math.max(.1,finite(h.radius)),width:Math.max(.05,finite(h.width)),innerRadius:Math.max(0,finite(p.innerRadius))};h.footprint154=Object.freeze(g);return h.footprint154;}
  function strokeFootprint154(g,stage,color){strokes.push({g,stage});}
  function drawNativeGroundArt154(path,rect,g,alpha,stage,castId){statics.push({path,g,stage,castId});return true;}
  function stageOf(h){const r=h.row150;return time<r.releaseAt?'warning':time<r.impactAt?'flight':time<r.impactAt+1/60?'active':'recovery';}
  function drawHazard(h){if(h.type==='field'){ctx.fill();ctx.stroke();ctx.stroke();fieldImgs++;return;}if(h.type==='story-pattern'&&h.row150){const g=lockPatternFootprint154(h),st=stageOf(h);strokeFootprint154(g,st);if(time<h.row150.impactAt+.48)drawNativeGroundArt154(time<h.row150.impactAt?h.row150.warningArtPath:h.row150.impactArtPath,null,g,.5,st,h.cast150.id);}}
  function drawEffect(e){effectDraws++;}
  function tick(dt){time+=dt;for(const h of hazards)h.age+=dt;hazards=hazards.filter(h=>h.age<h.life);}
  function frame(){for(const h of hazards)drawHazard(h);for(const e of effects)drawEffect(e);}`,g);
 if(SRC)vm.runInContext(SRC,g);
 return g;}
let serial=0;
function pattern(g,shape,o={}){const id=++serial,t=g.time,h={id,type:'story-pattern',owner:'b07-boss#1',x:o.x??16,y:o.y??12,originX:o.ox??14,originY:o.oy??12,angle:o.angle??0,age:0,warning:1,life:1+.1+.48,radius:o.radius??2.2,width:o.width??.7,
  storyPattern5:{shape,innerRadius:o.inner??1.35,color:o.color||'#c8402a',accent:'#ffd185',name:'qa'},row150:{releaseAt:t+1,impactAt:t+1.1,warningArtPath:'assets/vfx/bosses/qa-warn.webp',impactArtPath:'assets/vfx/bosses/qa-impact.webp'},cast150:{id:'cast-'+id}};g.hazards.push(h);return h;}
function run(g,sec,step=1/30){const out=[];for(let t=0;t<sec;t+=step){g.tick(step);g.draws.length=0;g.frame();out.push({t:g.time,draws:g.draws.slice()});}return out;}
const API=g=>g.__STORYWORLD_BOSS_PATTERN_FX_R1040__;
function inside(g,fp,x,y){const d=Math.hypot(x-fp.x,y-fp.y),e=1e-6;
 if(fp.shape==='circle')return d<=fp.radius+e;if(fp.shape==='donut')return d>=fp.innerRadius-e&&d<=fp.radius+e;if(fp.shape==='safe')return d>fp.radius-e;
 if(fp.shape==='cross')return Math.abs(x-fp.x)<=fp.width+e&&Math.abs(y-fp.y)<=fp.radius+e||Math.abs(y-fp.y)<=fp.width+e&&Math.abs(x-fp.x)<=fp.radius+e;
 const dx=x-fp.originX,dy=y-fp.originY,ca=Math.cos(fp.angle),sa=Math.sin(fp.angle),u=dx*ca+dy*sa,v=-dx*sa+dy*ca;
 if(fp.shape==='line')return u>=-e&&u<=fp.radius+e&&Math.abs(v)<=fp.width+e;
 if(fp.shape==='cone')return Math.hypot(dx,dy)<=fp.radius+e&&Math.abs(Math.atan2(v,u))<=fp.width+e;return false;}
const allFinite=ds=>ds.every(d=>[d.x,d.y,d.h,d.o.alpha??1].every(Number.isFinite)&&d.frame?.assetFrame?.sourceRect?.every(Number.isFinite));

// ⓪ 설치
{const g=world();ok('module file exists',!!SRC);ok('installed',!!API(g)?.inspect?.().installed,API(g)?.inspect?.());
 ok('does not replace strokeFootprint154 (판정 테두리 유지)',SRC&&!/strokeFootprint154\s*=/.test(SRC));}
// ① 모양별 터짐
for(const [shape,o] of [['circle',{radius:2.2}],['line',{radius:7.4,width:.7,ox:12,oy:12,angle:.3}],['cone',{radius:6.2,width:.6,ox:12,oy:12,angle:-.4}],['cross',{radius:6.9,width:.8}],['donut',{radius:5.8,inner:2.2}]]){
 const g=world(),h=pattern(g,shape,o);const fr=run(g,2.6);const fp=g.lockPatternFootprint154(h);
 const impactStatics=g.statics.filter(s=>s.stage==='active'||s.stage==='recovery');
 ok(shape+': no static impact art',impactStatics.length===0,impactStatics.length);
 const sheetDraws=fr.flatMap(f=>f.draws).filter(d=>SHEETS.includes(d.path));
 ok(shape+': sheet frames drawn',sheetDraws.length>=10,sheetDraws.length);
 const frames=new Set(sheetDraws.map(d=>d.frame.assetFrame.sourceRect.join(',')));ok(shape+': animates (>=8 different cells)',frames.size>=8,frames.size);
 const inst=API(g)?.inspect?.().placed||[];ok(shape+': placed list',inst.length>=1,inst.length);
 ok(shape+': every placement inside hit footprint',inst.length&&inst.every(p=>inside(g,fp,p.x,p.y)),inst.filter(p=>!inside(g,fp,p.x,p.y)).slice(0,3));
 ok(shape+': drawn at projected placement',inst.length&&inst.every(p=>{const q=g.project(p.x,p.y);return sheetDraws.some(d=>Math.abs(d.x-q.x)<1e-6&&Math.abs(d.y-q.y)<1e-6);}));
 ok(shape+': finite draw args',allFinite(sheetDraws));
 const last=fr.filter(f=>f.draws.some(d=>SHEETS.includes(d.path))).pop();ok(shape+': one-shot ends (<=2.2s after impact)',last&&last.t<=1.1+2.2,last&&last.t);
 ok(shape+': registered once',API(g).inspect().stats.casts===1,API(g).inspect().stats);
 ok(shape+': strokes kept',g.strokes.length>0);
 const perFrame=Math.max(...fr.map(f=>f.draws.length));ok(shape+': per-frame cap 12',perFrame<=12,perFrame);}
// ② safe
{const g=world(),h=pattern(g,'safe',{radius:2.1,x:15,y:13});const fr=run(g,2.6),fp=g.lockPatternFootprint154(h);
 ok('safe: no stretched static impact',g.statics.filter(s=>s.stage!=='warning'&&s.stage!=='flight').length===0);
 const inst=API(g).inspect().placed;const fog=inst.filter(p=>p.kind==='fog'),ring=inst.filter(p=>p.kind==='ring');
 ok('safe: fog placed',fog.length>=4,fog.length);ok('safe: fog only outside safe zone (+0.6 margin)',fog.every(p=>Math.hypot(p.x-fp.x,p.y-fp.y)>=fp.radius+.6),fog.map(p=>Math.hypot(p.x-fp.x,p.y-fp.y).toFixed(2)));
 ok('safe: one ring at safe centre',ring.length===1&&Math.hypot(ring[0].x-fp.x,ring[0].y-fp.y)<1e-6,ring);
 const ds=fr.flatMap(f=>f.draws);ok('safe: uses mist loop + shockwave',ds.some(d=>d.path==='assets/r430/mist-loop.webp')&&ds.some(d=>d.path==='assets/r438/fx/enemy-shockwave.webp'));
 ok('safe: mist alpha faint (<=.5)',ds.filter(d=>d.path==='assets/r430/mist-loop.webp').every(d=>d.o.alpha<=.5+1e-9));
 ok('safe: mist filter only allowed functions',ds.filter(d=>d.o.filter).every(d=>!/blur|drop-shadow/.test(d.o.filter)));
 ok('safe: finite',allFinite(ds));}
// ③ 그대로 두는 것
{const g=world(),h=pattern(g,'circle');run(g,.9);ok('warning stage passes through to engine (R425 rule)',g.statics.some(s=>s.stage==='warning')&&API(g).inspect().placed.length===0);
 g.statics.length=0;g.drawNativeGroundArt154('assets/vfx/melee.webp',null,{shape:'cone',x:1,y:1,originX:1,originY:1,angle:0,radius:2,width:.5,innerRadius:0},.2,'active','melee-1');ok('non-pattern call passes through',g.statics.length===1);}
// ④ 안전
{const g=world({loaded:false});pattern(g,'circle');run(g,2);ok('sheets not ready → static fallback',g.statics.some(s=>s.stage==='active'||s.stage==='recovery'));ok('requests sheets',g.asks.some(p=>SHEETS.includes(p)));}
{const g=world({store:{'storyworld.r1040.patternFx':'{"on":false}'}});pattern(g,'circle');run(g,2);ok('off switch → static',g.statics.some(s=>s.stage==='active'||s.stage==='recovery')&&g.draws.length===0);}
{const g=world();pattern(g,'circle',{x:NaN});const fr=run(g,2);ok('NaN pattern: no NaN draws',allFinite(fr.flatMap(f=>f.draws)));ok('NaN pattern: no throw',API(g).inspect().stats.errors===0,API(g).inspect());}
{const g=world({lowFx:true});pattern(g,'cross',{radius:6.9,width:.8});pattern(g,'safe',{radius:2.1});const fr=run(g,2.6);const m=Math.max(...fr.map(f=>f.draws.length));ok('lowFx: per-frame cap 6',m<=6,m);}
{const g=world({mobile:true});pattern(g,'safe',{radius:2.1});const fr=run(g,2.6);const m=Math.max(...fr.map(f=>f.draws.length));ok('mobile: per-frame cap 6',m<=6,m);}
{const g=world();for(let i=0;i<6;i++)pattern(g,'donut',{radius:6,inner:2.3,x:10+i,y:10});const fr=run(g,2.6);const m=Math.max(...fr.map(f=>f.draws.length));ok('many casts: global per-frame cap 12',m<=12,m);}
// ⑥ R105 보스 장판(field): 하얀 예고 원 안 붉은 끊긴 고리(코드 선·채움) → 지우고 먹빛 암흑 안개 루프(사용자 '삭제하고 암흑범벅 같은 프레임애니메이션'), 칠한 그림(drawImage)은 그대로
function field(g,o={}){const h={id:'f'+(++serial),type:'field',owner:o.owner||'b1',x:o.x??15,y:o.y??13,radius:o.radius??1.4,warning:1.2,age:o.age??.5,life:2.5,damage:1};g.hazards.push(h);return h;}
{const g=world();const h=field(g);g.draws.length=0;g.frame();
 ok('field warning: no code stroke/fill',g.strokesC===0&&g.fills===0,{s:g.strokesC,f:g.fills});ok('field: painted layer kept',g.fieldImgs===1);
 const ring=g.draws.filter(d=>d.path==='assets/r430/mist-loop.webp');const q=g.project(h.x,h.y);
 ok('field warning: dark mist sheet at field centre',ring.length===1&&Math.abs(ring[0].x-q.x)<1e-6&&Math.abs(ring[0].y-q.y)<1e-6,ring);ok('field: finite',allFinite(ring));ok('field: dark filter, allowed functions only',ring.every(d=>/brightness\(\.5\)/.test(d.o.filter||'')&&!/blur|drop-shadow/.test(d.o.filter)));
 ok('field: ctx.stroke restored to prototype',!Object.prototype.hasOwnProperty.call(g.ctx,'stroke')&&!Object.prototype.hasOwnProperty.call(g.ctx,'fill'));
 const f1=ring[0]?.frame.assetFrame.sourceRect.join();g.tick(.3);g.draws.length=0;g.frame();const f2=g.draws.find(d=>d.path==='assets/r430/mist-loop.webp')?.frame.assetFrame.sourceRect.join();ok('field ring animates',f1&&f2&&f1!==f2,[f1,f2]);
 g.hazards.length=0;const hi=field(g,{age:1.5});g.strokesC=0;g.fills=0;g.draws.length=0;g.frame();ok('field impact: no code stroke/fill',g.strokesC===0&&g.fills===0);
 ok('field impact: no warning mist',!g.draws.some(d=>d.path==='assets/r430/mist-loop.webp'));}
{const g=world({store:{'storyworld.r1040.patternFx':'{"on":false}'}});field(g);g.frame();ok('field off → original strokes',g.strokesC>0&&g.fills>0);}
{const g=world();field(g,{radius:NaN});g.frame();ok('field NaN radius → passthrough',g.strokesC>0&&g.draws.length===0);}
{const g=world();field(g,{owner:'nobody'});g.frame();ok('field without enemy owner → passthrough',g.strokesC>0);}
{const g=world({loaded:false});field(g);g.frame();ok('field sheet not ready → original',g.strokesC>0);}
// ⑤ 연결
{const rd=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';const html=rd(path.join(R,'runtime-text','index.html'));
 ok('index.html tag',/<script src="\.\/boss-pattern-fx-r1040\.js"><\/script>/.test(html));
 const i118=html.indexOf('<script src="./combat-r118.js">'),i1040=html.indexOf('boss-pattern-fx-r1040.js');ok('before combat-r118·world-tiles-r118 (끝 두 태그 규칙)',i1040>0&&i118>i1040);
 ok('verify list',/boss-pattern-fx-r1040\.js/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))));
 ok('runtime-inputs',/boss-pattern-fx-r1040\.js/.test(rd(path.join(R,'runtime-text','runtime-inputs.json'))+rd(path.join(R,'runtime-inputs.json'))));
 ok('pages.yml check line',/qa\/r1040\/boss-pattern-fx-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))));
 for(const s of SHEETS)ok('asset exists '+s,fs.existsSync(path.join(R,'runtime-text',s)));}
console.log(`R1040 boss pattern fx: ${pass}/${total}`);process.exit(pass===total?0:1);
