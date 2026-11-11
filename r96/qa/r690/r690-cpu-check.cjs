// R690 CPU 검사(사용자 2026-11-11 00:59Z "몹들죽을때 이미지여러개 겹치고왔다갔다혼란스럽게하면서 렉있는 문제", 01:00Z "무한생존모드에서도 체크",
//  01:01Z "광장렉원인과 유사함").
//  재현(헤드리스 960×540, 소프트웨어 렌더링 — GPU·실기기 아님):
//   · 본편 ep1b03 10마리 동시 처치 → R462 자기 그림 조각 사체 위에 R91 '가족' 공용 잔해 그림(다른 몹 시체)·R91 공용 죽음 파편 시트·R165 연기가 같은 자리에 겹쳐 뜸.
//   · 무한 생존(1.5 게임초마다 8마리 동시 처치, 16 게임초): 프레임 중앙값 259ms ↔ 사체 끔 181ms. 3D 지오메트리 재구성 게임 1초 4,864 ↔ 2,717.
//  원인: ① 같은 죽음을 R91(공용 잔해·파편)·R165(연기)·R462(자기 그림)가 따로 그린다. ② R462 사체는 몸 그림 한 장을 조각마다 clip 다각형으로
//   잘라(사체 하나 9~12번) 그리는데, 3D 기록기는 clip 이 걸린 그림을 매 프레임 삼각형으로 다시 잘라 지오메트리를 새로 만든다(카메라가 움직이면 빠른 길도 못 탐).
//  고침: ① R462 가 맡은 몹(owns)이면 R91 잔해·파편과 R165 연기를 건너뛴다(보스·R462 가 못 맡은 몹은 그대로).
//   ② 사체 조각은 멈춘 모습을 사체마다 캔버스 한 장에 한 번 구워(bake) 이후엔 clip 없는 그림 한 장으로 그린다.
//   ③ (같은 프레임 3D 촬영에서 발견) 3D 기록기에서 clip 다각형 조각이 그림을 덜 잘라 조각마다 몸이 거의 통째로 겹쳐 보였다(정확히 자른 2D 굽기와 비교).
//     → 죽음 하나마다 조각을 2D 캔버스(조각 모음 한 장)에 한 번 정확히 잘라 두고, 날아가는 조각은 그 칸을 clip 없이 그린다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c,extra)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,extra===undefined?'':JSON.stringify(extra).slice(0,600));}};
for(const f of ['mob-death-r462.js','visual-r91.js','effects-r165.js'])ok('runtime copy matches source '+f,C(f)===RT(f));
ok('R462 revision mentions R690',/REV='R690-/.test(C('mob-death-r462.js')));
// ---------------------------------------------------------------- R462 환경(r660 검사와 같은 틀 + 캔버스 공장)
function env(o={}){const calls=[];let made=0;const g={window:{},localStorage:{getItem:()=>o.prefs?JSON.stringify(o.prefs):null,setItem(){}},setTimeout(){},Date,console,calls,Math,JSON};g.window=g;
 const mkCtx=id=>({id,stack:[],save(){this.stack.push(this.filter);calls.push({k:'save',c:id});},restore(){this.filter=this.stack.pop();calls.push({k:'restore',c:id});},translate(){},scale(){},rotate(){},setTransform(){},clearRect(){},
  beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){calls.push({k:'clip',c:id});},stroke(){},fill(){},ellipse(){},arc(){},fillRect(){},
  drawImage(im,...a){calls.push({k:'drawImage',c:id,src:im.src||im.id,a,filter:this.filter,alpha:this.globalAlpha});},globalAlpha:1,filter:'none',owner:{id:'scene',kind:'scene'}});
 if(!o.noCanvas)g.document={createElement(t){if(t!=='canvas')return{};made++;const cv={id:'bake'+made,width:0,height:0,getContext(){return this._c||(this._c=mkCtx(this.id));}};return cv;}};
 g.made=()=>made;g.mkCtx=mkCtx;vm.createContext(g);g.ready=o.ready!==false;
 vm.runInContext(`var time=0,zoom=1,settings={lowFx:${!!o.low}},room={id:'plaza'},effects=[],VFX={burnFlame:'assets/vfx/burn.png'};var ctx=mkCtx('main');
 ${o.recorder?"ctx.scope=function(owner,fn){calls.push({k:'scope',id:owner.id,kind:owner.kind});return fn();};ctx.commands=[];":""}
 function project(x,y){return{x:x*10,y:y*10};}function actorHeight(){return 60;}
 function readyImage(p){if(/own-/.test(p)&&!ready)return null;return{image:{src:p,naturalWidth:1536,naturalHeight:1024},crop:{w:80,h:100}};}
 function sprite(p,x,y,h,opt){opt=opt||{};calls.push({k:'sprite',p,opt,c:ctx.id,ctxFilter:ctx.filter});return true;}
 function drawAssetFrame3(p,f,x,y,h,opt){return false;}
 function texture(){}
 function drawEnemy(e){sprite(e.drawn,0,0,60,{flip:false});}
 function drawBurnDeath3(fx){}
 function drawObjective(){}
 function enterRegion(){return 1;}`,g);
 vm.runInContext(C('mob-death-r462.js'),g);return g;}
const api=g=>g.window.__STORYWORLD_MOB_DEATH_R462__;
function see(g,e){vm.runInContext('drawEnemy',g)(e);}
// 한 몹을 보이게 그린 뒤 죽음 1.8초 + 사체 frames 프레임(60fps)
function play(g,name,{frames=120,between}={}){const e={id:'m-'+name,name,hp:10,drawn:'assets/r380/mobs/own-'+name+'.webp'};see(g,e);
 const fx={type:'enemyBurnDeath',sourceId:e.id,x:3,y:4,age:0,life:.72};const draw=vm.runInContext('drawBurnDeath3',g),obj=vm.runInContext('drawObjective',g);
 for(let f=0;f<=108;f++){fx.age=f/60;vm.runInContext('time='+(f/60),g);if(fx.age<=fx.life)draw(fx);obj();}
 const per=[];for(let f=0;f<frames;f++){if(between)between(f);vm.runInContext('time='+(2+f/60),g);g.calls.length=0;obj();per.push(g.calls.slice());}return{e,per};}
// ① owns(e): R462 이 맡는 몹만 true
{const g=env({});const A=api(g);ok('R462 exports owns()',typeof A.owns==='function');
 const e={id:'a',name:'유리 망령',hp:5,drawn:'assets/r380/mobs/own-a.webp'};ok('owns: never-drawn mob → false',A.owns?.(e)===false);
 see(g,e);ok('owns: drawn normal mob → true',A.owns?.(e)===true);
 ok('owns: boss / midboss / persona → false',A.owns?.({...e,boss:true})===false&&A.owns?.({...e,midboss:true})===false&&A.owns?.({...e,persona:true})===false);
 ok('owns: null / junk → false',A.owns?.(null)===false&&A.owns?.(7)===false);
 const g2=env({prefs:{on:false}});see(g2,e);ok('owns: R462 off → false (R91·R165 keep drawing)',api(g2).owns?.(e)===false);}
// ② 사체 굽기: 사체가 생긴 뒤엔 화면 ctx 에 clip 0, 사체마다 구운 그림 drawImage 1번, 굽기는 사체당 1번
for(const [kind,name] of [['blood','거미'],['fire','망령']])for(const rec of [false,true]){const tag=`${kind} ${rec?'recorder':'2D'}`;
 const g=env({recorder:rec});const {per}=play(g,name);const late=per.slice(10);
 const clips=late.reduce((n,cs)=>n+cs.filter(c=>c.k==='clip'&&c.c==='main').length,0);
 ok(`${tag}: settled corpse draws no clip() on the screen ctx`,clips===0,{clips});
 const bakeDraws=late.map(cs=>cs.filter(c=>c.k==='drawImage'&&c.c==='main'&&/^bake/.test(c.src)&&c.a.length===4).length);
 ok(`${tag}: one baked image per corpse per frame`,bakeDraws.every(n=>n===1),bakeDraws.slice(0,8));
 ok(`${tag}: one piece sheet + one corpse bake (2 canvases)`,g.made()===2,g.made());
 const ownMain=late.reduce((n,cs)=>n+cs.filter(c=>c.k==='sprite'&&/own-/.test(c.p)&&c.c==='main').length,0);
 ok(`${tag}: no per-piece own-art draws on screen after bake`,ownMain===0,ownMain);
 if(rec){const sc=late[0].filter(c=>c.k==='scope');ok(`${tag}: corpse keeps its floor owner scope (R451 light)`,sc.length===1&&/^r462:corpse:/.test(sc[0].id)&&sc[0].kind==='scene',sc);}
}
// ②-b 죽는 동안(날아가는 조각): 화면 ctx 에 clip 0 — 조각 모음(한 장)을 죽음마다 한 번만 만들고, 칸 그림을 필터는 ctx.filter 로
for(const [kind,name] of [['blood','거미'],['fire','망령']])for(const rec of [false,true]){const tag=`${kind} dying ${rec?'recorder':'2D'}`;
 const g=env({recorder:rec});const e={id:'d-'+name,name,hp:10,drawn:'assets/r380/mobs/own-'+name+'.webp'};see(g,e);
 const fx={type:'enemyBurnDeath',sourceId:e.id,x:3,y:4,age:0,life:.72},draw=vm.runInContext('drawBurnDeath3',g);const frames=[];
 for(let f=0;f<=66;f++){fx.age=f/60;vm.runInContext('time='+(f/60),g);g.calls.length=0;if(fx.age<=fx.life)draw(fx);frames.push(g.calls.slice());}
 const flying=frames.slice(kind==='fire'?25:6,60);
 const mainClips=flying.reduce((n,cs)=>n+cs.filter(c=>c.k==='clip'&&c.c==='main').length,0);
 ok(`${tag}: no clip() on the screen ctx while pieces fly`,mainClips===0,{mainClips});
 const atlasDraws=flying.map(cs=>cs.filter(c=>c.k==='drawImage'&&c.c==='main'&&/^bake/.test(c.src)&&c.a.length===8));
 ok(`${tag}: every shard drawn from the cut-piece sheet each frame (9~12)`,atlasDraws.every(d=>d.length>=9&&d.length<=12),atlasDraws.slice(0,3).map(d=>d.length));
 ok(`${tag}: piece sheet made once for the whole death`,g.made()===1,g.made());
 ok(`${tag}: no own-art sprite on screen for pieces (only via sheet)`,flying.every(cs=>!cs.some(c=>c.k==='sprite'&&/own-/.test(c.p)&&c.c==='main'&&!String(c.ctxFilter||'').includes('2.6')&&!String(c.opt.filter||'').includes('2.6'))),flying[5].filter(c=>c.k==='sprite').map(c=>c.ctxFilter||c.opt.filter));
 const fl=atlasDraws.flat();ok(`${tag}: piece colour filter carried by ctx.filter (no tint-cache)`,fl.length>0&&fl.every(c=>/brightness\(/.test(c.filter||'')),fl.slice(0,2).map(c=>c.filter));
 // 칸 만들기: 조각마다 clip + 자기 그림(필터 없이) 정확히 한 번
 const g2=env({recorder:rec});see(g2,e);const d2=vm.runInContext('drawBurnDeath3',g2);g2.calls.length=0;const fx2={...fx,age:.2,r462:undefined};d2(fx2);
 const cut=g2.calls.filter(c=>c.c&&/^bake/.test(c.c));const cp=cut.filter(c=>c.k==='sprite'&&/own-/.test(c.p));
 ok(`${tag}: sheet cut = one clip + one unfiltered own-art draw per shard`,cp.length>=9&&cp.length<=12&&cut.filter(c=>c.k==='clip').length===cp.length&&cp.every(c=>!c.opt.filter&&(c.ctxFilter==='none'||!c.ctxFilter)),{n:cp.length,f:cp.slice(0,2).map(c=>[c.opt.filter,c.ctxFilter])});
}
// ③ 구운 그림 내용: 조각마다 clip+자기 그림(사체 필터 그대로, 색 보정 캐시 안 탐)
{const g=env({recorder:true});const e={id:'m-b',name:'거미',hp:10,drawn:'assets/r380/mobs/own-b.webp'};see(g,e);
 const fx={type:'enemyBurnDeath',sourceId:e.id,x:3,y:4,age:0,life:.72},draw=vm.runInContext('drawBurnDeath3',g),obj=vm.runInContext('drawObjective',g);
 for(let f=0;f<=108;f++){fx.age=f/60;vm.runInContext('time='+(f/60),g);if(fx.age<=fx.life)draw(fx);obj();}
 g.calls.length=0;vm.runInContext('time=2.5',g);obj();
 const bakeId=g.calls.find(c=>c.k==='drawImage'&&c.c==='main'&&/^bake/.test(c.src))?.src;
 // 굽기는 사체가 처음 그려질 때 일어났다 → 다시 만들어 내용을 본다
 const g2=env({recorder:true});see(g2,e);const d2=vm.runInContext('drawBurnDeath3',g2),o2=vm.runInContext('drawObjective',g2),fx2={type:'enemyBurnDeath',sourceId:e.id,x:3,y:4,age:0,life:.72};
 for(let f=0;f<=60;f++){fx2.age=f/60;vm.runInContext('time='+(f/60),g2);if(fx2.age<=fx2.life)d2(fx2);}
 g2.calls.length=0;vm.runInContext('time=1.3',g2);o2();
 const inBake=g2.calls.filter(c=>c.c&&/^bake/.test(c.c)&&c.c!=='bake1');/* bake1 = 죽는 동안 만든 조각 모음 */const pieces=inBake.filter(c=>c.k==='drawImage'&&c.src==='bake1'&&c.a.length===8);
 ok('corpse bake holds every shard (9~12 cut pieces from the death sheet, no clip)',pieces.length>=9&&pieces.length<=12&&!inBake.some(c=>c.k==='clip'),{p:pieces.length,bakeId,ks:inBake.map(c=>c.k+':'+c.c).slice(0,12)});
 ok('bake pieces carry the blood corpse filter via ctx.filter (no tint-cache sprite filter)',pieces.length>0&&pieces.every(c=>c.filter==='brightness(.82) saturate(.95) contrast(1.05)'),pieces.slice(0,2));
 ok('ctx restored to screen ctx after bake',inBake.length>0&&vm.runInContext('ctx.id',g2)==='main');}
// ④ 경계: 그림이 아직 안 읽혔으면 굽지 않고 예전처럼 조각으로 그린다(사체가 사라지지 않음) → 읽히면 그때 한 번 굽는다
{const g=env({});vm.runInContext('ready=false',g);let made19=-1;const {per}=play(g,'거미',{frames:40,between:f=>{if(f===19)made19=g.made();if(f===20)vm.runInContext('ready=true',g);}});
 const early=per.slice(0,20),later=per.slice(21);
 ok('image not ready: no bake, corpse still drawn piece by piece',made19===0&&early.every(cs=>cs.some(c=>c.k==='sprite'&&/own-/.test(c.p)&&c.c==='main')),{made19});
 ok('image ready later: baked then, one image per frame',later.every(cs=>cs.filter(c=>c.k==='drawImage'&&c.c==='main'&&/^bake/.test(c.src)&&c.a.length===4).length===1),later.slice(0,2).map(cs=>cs.map(c=>c.k)));}
// ⑤ 경계: 캔버스를 못 만드는 곳(document 없음)은 예전 그리기 그대로
{const g=env({noCanvas:true});const {per}=play(g,'망령',{frames:20});ok('no canvas factory → old per-piece corpse draws',per.every(cs=>cs.filter(c=>c.k==='clip').length>=9));}
// ⑥ 경계: 확대(zoom)가 바뀌어도 다시 굽지 않고 크기만 비례
{const g=env({});const {per}=play(g,'거미',{frames:30,between:f=>{if(f===15)vm.runInContext('zoom=1.5',g);}});
 const w=cs=>{const d=cs.find(c=>c.k==='drawImage'&&/^bake/.test(c.src)&&c.a.length===4);return d?d.a[2]:null;};
 const w1=w(per[10]),w2=w(per[20]);ok('zoom change rescales the baked image, no rebake',g.made()===2&&w1>0&&Math.abs(w2/w1-1.5)<.02,{made:g.made(),w1,w2});}
// ⑦ 회귀: 눕히기(lay) 사체는 그대로(조각 없음, 굽지 않음)
{const g=env({prefs:{style:'lay'}});const {per}=play(g,'거미',{frames:10});ok('lay style corpse unchanged (no bake, no clip)',g.made()===0&&per.every(cs=>!cs.some(c=>c.k==='clip')&&cs.some(c=>c.k==='sprite'&&/own-/.test(c.p))));}
// ⑧ 회귀: 사체가 사라질 때(45초+4초) 굽은 그림도 놓는다
{const g=env({});const {per}=play(g,'거미',{frames:2});vm.runInContext('time=60',g);g.calls.length=0;vm.runInContext('drawObjective',g)();
 ok('expired corpse no longer drawn',!g.calls.some(c=>c.k==='drawImage'&&/^bake/.test(c.src))&&api(g).inspect().corpses===0);}
// ---------------------------------------------------------------- R91 · R165: R462 가 맡은 죽음은 건너뜀
async function r91(owns){const idx=JSON.parse(fs.readFileSync(path.join(R,'hospital-three-pc','site','assets','r91','floor','index.json'),'utf8'));
 const didx=JSON.parse(fs.readFileSync(path.join(R,'hospital-three-pc','site','assets','r91','death','index.json'),'utf8'));
 function Renderer(){}Renderer.prototype.render=function(){};
 const c={console,performance:{now:()=>1000},localStorage:{getItem:()=>null,setItem(){}},layer:'STORY',zone:'z',time:1,ctx:{save(){},restore(){},drawImage(){}},project:(x,y)=>({x,y}),
  fetch:async u=>({ok:true,json:async()=>/death/.test(u)?didx:idx}),StoryPhase1:{ThreeRenderer:Renderer},
  killEnemy:e=>{e.deadRecorded=true;e.hp=0;},groundImage(){},drawHero(){},player:{hero:'hwando',moveVX150:0,moveVY150:0},readyImage:()=>null,addImage(){}};
 c.window=c;if(owns!==undefined)c.__STORYWORLD_MOB_DEATH_R462__={owns:e=>owns(e)};vm.createContext(c);vm.runInContext(C('visual-r91.js'),c);
 vm.runInContext('groundImage()',c);for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));
 const I=()=>c.__STORYWORLD_VISUAL_R91__.inspect();vm.runInContext('drawHero()',c);
 for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));
 vm.runInContext('killEnemy({id:"m1",name:"유리 망령",x:2,y:3,hp:1});killEnemy({id:"b1",name:"보스",boss:true,x:2,y:3,hp:1})',c);return I();}
(async()=>{
 {const s=await r91(e=>e.id==='m1');ok('R91: R462-owned death adds no generic remains (other mob corpse art)',s.floorStats.spawned===0,s.floorStats);
  ok('R91: R462-owned death adds no generic death sheet',s.deathStats.started===0,s.deathStats);}
 {const s=await r91(()=>false);ok('R91: deaths R462 does not own keep remains + death sheet',s.floorStats.spawned===1&&s.deathStats.started===1,{f:s.floorStats,d:s.deathStats});}
 {const s=await r91(undefined);ok('R91: without R462 loaded, unchanged',s.floorStats.spawned===1&&s.deathStats.started===1,{f:s.floorStats,d:s.deathStats});}
 // R165
 for(const [label,owns,want] of [['R462-owned → no smoke puff',e=>!e.boss,0],['not owned → smoke puff as before',()=>false,1]]){let t=0;
  const sb={window:{__STORYWORLD_PIXELFX_R163__:{ready:()=>true,play:()=>({}),warm(){}},__STORYWORLD_MOB_DEATH_R462__:{owns}},localStorage:{getItem(){return null;},setItem(){}},setTimeout(){},Math,JSON,String,Object,Number,VFX:{},
   player:{x:1,y:1,level:1},room:{samongR103:null},fx:()=>{},drawEffect:()=>{},effects:[],killEnemy:e=>{e.deadRecorded=true;},tick:()=>{},enterRegion:async()=>true};
  Object.defineProperty(sb,'time',{get:()=>t});vm.createContext(sb);vm.runInContext(C('effects-r165.js'),sb);vm.runInContext('killEnemy({x:1,y:1,hp:0})',sb);
  const st=sb.window.__STORYWORLD_EFFECTS_R165__.inspect().stats;ok('R165: '+label,st.deaths===want,st);}
 console.log(`\nR690 mob-death overlap/lag CPU check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);})();
