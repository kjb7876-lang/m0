// R413 CPU check: 문 위 상인방(문틀 윗선 2.7 → 양쪽 문설주 벽 중 낮은 윗선까지 벽 그림 띠) + R267 지붕 덮개를 늦게 올라간 벽 높이에 다시 맞춤.
//  사용자 2026-11-08 "벽문 벽지붕등 높이랑위치도 잘맞춰줘".
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='doors-fit-r413.js',src=C(F);
for(const f of[F,'roof-height-r267.js'])ok(f+' runtime copy matches',RT(f)===C(f));
const html=RT('index.html');
ok('loaded once, right before access-r420.js (after world-doors-r83.js and the props overlays) and before combat-r118.js',html.split('"./'+F+'"').length===2&&/<script src="\.\/doors-fit-r413\.js"><\/script><script src="\.\/access-r420\.js"><\/script>/.test(html)&&html.indexOf('props-place-r406.js')<html.indexOf(F)&&html.indexOf('world-doors-r83.js')<html.indexOf(F)&&html.indexOf(F)<html.indexOf('combat-r118.js'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r413/r413-cpu-check.cjs'));
const code=src.replace(/\/\/.*$/gm,'');
ok('game ctx: no blur/drop-shadow filter',!/filter\s*=\s*['"][^'"]*(blur|drop-shadow)/.test(code));
ok('presentation only: never touches walls, doors, collision or door state',!/\.(height|width|depth|x|y|open)\s*=(?!=)/.test(code.replace(/ctx\.fillStyle=/g,''))&&!/explorationBlocked|\.walls\.(push|splice)/.test(code));
// ---- 샌드박스 ----
function world(o={}){const calls=[],scopes=[],transforms=[];let base=0;const TILE=32;
 const ctx={save(){},restore(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),setTransform(){},transform(...a){transforms.push(a);},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},fillStyle:'',scope(owner,paint){scopes.push(owner);paint();}};
 const sb={localStorage:{getItem:()=>null,setItem(){}},Math,JSON,Object,Number,String,Array,Map,WeakMap,Set,Error,RegExp,performance:{now:()=>0},ctx,W:1280,H:720,TILE,zoom:1,
  project:(x,y)=>({x:(x-y)*TILE+640,y:(x+y)*TILE/2}),readyImage:p=>p?{image:{src:p}}:null,drawProp:function(p){base++;calls.push(p?.id);return true;}};
 sb.window=sb;sb.room=o.room;
 sb.__STORYWORLD_WORLD_DOORS_R83__={enabled:(r,p)=>r?.layer==='STORY'&&!!r.exploration?.worldWardR81&&!!p?.r74Door,hospital:r=>r?.id==='ep1a08',
  geometry:d=>({width:d.axis==='x'?d.depth:d.width,faceOffset:(d.axis==='x'?d.width:d.depth)/2+.015}),point:(p,z)=>{const q=sb.project(p.x,p.y);return{x:q.x,y:q.y-z*TILE*Math.sqrt(1.5)*sb.zoom};},cropRect:r=>r};
 sb.__STORYWORLD_WORLD_R74__={isOpen:()=>false};if(o.r204)sb.__STORYWORLD_PHASE1__={controller:{state:{three:{__r204:o.r204}}}};
 vm.createContext(sb);vm.runInContext(src,sb);return{sb,X:sb.__STORYWORLD_DOORS_FIT_R413__,scopes,transforms,base:()=>base};}
// 6칸 문(x 17~23, y 20, 가로 벽) — 왼쪽 문설주 벽 2.85, 오른쪽 3.31
const door=()=>({id:'door-0',x:20,y:20,width:6,depth:.24,axis:'y'});
const wallsOf=(l,r)=>[l!=null&&{id:'wl',x:13.38,y:20,width:6.76,depth:.24,height:l},r!=null&&{id:'wr',x:26.62,y:20,width:6.76,depth:.24,height:r}].filter(Boolean);
const roomOf=(walls,o={})=>({id:o.id||'kair02',layer:o.layer||'STORY',exploration:{worldWardR81:true,walls,worldR74:{style:'ward',doors:[]},surface:{art:{path:'assets/x/wall.webp',wallRect:[0,0,100,50],r81Palette:{wall:0x444444}}}}});
{const d=door(),r=roomOf(wallsOf(2.85,3.31)),w=world({room:r}),p={id:'r74:kair02:door-0',r74Door:d};w.sb.drawProp(p);const o=w.scopes[0],t=w.transforms[0];
 const px=(2.85-2.7)*32*Math.sqrt(1.5);
 ok('a door between taller jamb walls gets a wall-art lintel from the frame top (2.7) up to the lower jamb wall top (2.85, not 3.31)',w.scopes.length===1&&o.r83WardDoor===true&&o.r83DoorPart==='r413-lintel'&&o.r413Lintel===true&&!!t&&Math.abs(t[3]*50-px)<1e-6&&w.X.jambTop(r.exploration,d)===2.85,{o,t});
 ok('...on the same front face as the R83 door planes, spanning the opening plus both jamb strips',Math.abs(o.r83DoorPlane.ax-16.76)<1e-9&&Math.abs(o.r83DoorPlane.bx-23.24)<1e-9&&Math.abs(o.r83DoorPlane.ay-20.135)<1e-9&&o.r83DoorPlane.by===o.r83DoorPlane.ay&&o.r83WallTint===0x444444,o.r83DoorPlane);
 ok('the door itself is still drawn by the chain underneath (once)',w.base()===1);
 w.sb.drawProp({id:'r74:kair02:scenery:1',path:'assets/x/crate.webp'});ok('non-door props get no lintel',w.scopes.length===1&&w.base()===2);}
{const d=door(),r=roomOf(wallsOf(null,3.31)),w=world({room:r});w.sb.drawProp({id:'d',r74Door:d});ok('one jamb wall only: the lintel meets that wall',w.scopes.length===1&&w.X.jambTop(r.exploration,d)===3.31);}
{const d=door(),r=roomOf(wallsOf(2.7,2.72)),w=world({room:r});w.sb.drawProp({id:'d',r74Door:d});ok('jamb walls level with the frame (gap under 0.04): no lintel',w.scopes.length===0&&w.X.inspect().stats.skipped===1);}
{const d=door(),r=roomOf(wallsOf(2.85,2.85),{id:'ep1a08'}),w=world({room:r});w.sb.drawProp({id:'d',r74Door:d});ok('the real hospital clinical doors are left alone',w.scopes.length===0);}
{const d=door(),r=roomOf(wallsOf(2.85,2.85)),w=world({room:r,r204:{zone:'kair02',decorOnly:false}});w.sb.drawProp({id:'d',r74Door:d});ok('R204 organic rock-wall regions (rock drawn at its own height) are left alone',w.scopes.length===0);
 const w2=world({room:r,r204:{zone:'kair02',decorOnly:true}});w2.sb.drawProp({id:'d',r74Door:d});ok('...but detail-only R204 regions (original walls) still get lintels',w2.scopes.length===1);}
{const d=door(),r=roomOf(wallsOf(2.85,2.85));r.exploration.r204Widened={added:3};const w=world({room:r,r204:{zone:'kair01',decorOnly:false}});w.sb.drawProp({id:'d',r74Door:d});
 ok('R204-widened (organic) layouts are skipped from the first frame, before R204 has built its 3D state for this region',w.scopes.length===0&&w.X.inspect().stats.skipped===1);}
{const d=door(),r=roomOf(wallsOf(2.85,3.31));delete r.exploration.surface.art.path;const w=world({room:r});w.sb.drawProp({id:'d',r74Door:d});
 ok('wall art not ready yet: no band at all (never a flat grey stand-in that would float over the door)',w.scopes.length===0&&w.X.inspect().stats.skipped===1&&!/#687874|fillStyle/.test(code));}
{const d=door(),r=roomOf(wallsOf(2.85,2.85),{layer:'DREAM'}),w=world({room:r});w.sb.drawProp({id:'d',r74Door:d});ok('samong (DREAM) doors, where R83 is off, are left alone',w.scopes.length===0);}
{const d=door(),walls=[{id:'f',x:16.6,y:20,width:.3,depth:.3,height:.01},{id:'deco',x:23.4,y:20,width:.3,depth:.3,height:3.5,decorative:true},...wallsOf(2.85,3.15)],r=roomOf(walls),w=world({room:r});
 ok('furniture collision boxes and decorative walls are not jamb walls',w.X.jambTop(r.exploration,d)===2.85);}
{const d=door(),walls=wallsOf(1.3,1.3),r=roomOf(walls),w=world({room:r});const before=w.X.jambTop(r.exploration,d);w.sb.drawProp({id:'d',r74Door:d});const none=w.scopes.length===0;
 walls[0].height=2.85;walls[1].height=3.23;w.sb.drawProp({id:'d',r74Door:d});
 ok('jamb heights follow walls raised in place after entry (R115 1.3 → 2.85), no stale per-layout value',before===1.3&&none&&w.X.jambTop(r.exploration,d)===2.85&&w.scopes.length===1);}
{const d=door(),r=roomOf(wallsOf(2.85,2.85)),w=world({room:r});w.X.set(false);w.sb.drawProp({id:'d',r74Door:d});const off=w.scopes.length===0;w.X.set(true);w.sb.drawProp({id:'d',r74Door:d});
 ok('switch off/on (storyworld.r413.doors)',off&&w.scopes.length===1);}
{const d={id:'door-1',x:30,y:12,width:.24,depth:5,axis:'x'},walls=[{id:'a',x:30,y:7.38,width:.24,depth:4.76,height:3.15},{id:'b',x:30,y:16.62,width:.24,depth:4.76,height:3.23}],r=roomOf(walls),w=world({room:r});
 w.sb.drawProp({id:'d1',r74Door:d});const o=w.scopes[0];
 ok('x-axis doors: lintel plane runs along y at the front face, top = lower jamb (3.15)',!!o&&Math.abs(o.r83DoorPlane.ax-30.135)<1e-9&&Math.abs(o.r83DoorPlane.ay-(12-2.74))<1e-9&&Math.abs(o.r83DoorPlane.by-(12+2.74))<1e-9&&w.X.jambTop(r.exploration,d)===3.15,o&&o.r83DoorPlane);}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('R413 CPU '+checks.length+'/'+checks.length);
