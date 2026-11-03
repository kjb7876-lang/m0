// R267 실내 지붕 덮개·둘레 테두리를 벽 윗면 높이에 맞춤 / R268 몹(보스 포함)이 영웅을 화면 좌우에서 바라보도록 옆자리 블링크·돌진·(보스만) 영웅 소환.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const F=C('roof-height-r267.js'),G=C('mob-gaze-r268.js');
ok('runtime copies match',RT('roof-height-r267.js')===F&&RT('mob-gaze-r268.js')===G);
const idx=RT('index.html');ok('both overlays are loaded by index.html',idx.includes('<script src="./roof-height-r267.js"></script>')&&idx.includes('<script src="./mob-gaze-r268.js"></script>'));
const base=()=>{const c={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Array,Map,WeakMap,WeakSet,Set,Object,Number,String,setTimeout:()=>0,performance:{now:()=>0}};c.window=c;return c;};
// R267: 벽 2.85 지역 → 덮개·테두리 scale.y = 2.85/2.705, 병원(벽 2.705)과 R80 덮개가 아닌 것은 1
{const ctx=base();const mk=()=>({scale:{y:1},userData:{r80WorldRoof:true}});
 class TR{ensureHospitalRoofsR2(frame){this.calls=(this.calls||0)+1;}}ctx.StoryPhase1={ThreeRenderer:TR};
 vm.createContext(ctx);vm.runInContext(F,ctx);const r=new TR();r.hospitalRoofMeshR2=mk();r.perimeterMeshR83={scale:{y:1}};
 const walls=[...Array(20)].map(()=>({height:2.85,annex:true})).concat([{height:3.31},{height:2.45,decorative:true},{height:2.45,decorative:true},{height:2.45,decorative:true}]);
 r.ensureHospitalRoofsR2({zone:'ep1b02',exploration:{walls}});const s=2.85/2.705;
 ok('R219 indoor walls 2.85: roof caps and perimeter fascia are stretched so their top meets the wall top',r.calls===1&&Math.abs(r.hospitalRoofMeshR2.scale.y-s)<1e-6&&Math.abs(r.perimeterMeshR83.scale.y-s)<1e-6,{a:r.hospitalRoofMeshR2.scale.y,b:r.perimeterMeshR83.scale.y});
 ok('the most common wall height wins (one tall pillar and decorative backdrop rocks are ignored)',ctx.__STORYWORLD_ROOF_HEIGHT_R267__.wallTop({walls})===2.85);
 const h=new TR();h.hospitalRoofMeshR2={scale:{y:1},userData:{}};h.perimeterMeshR83={scale:{y:1}};h.ensureHospitalRoofsR2({zone:'ep1a08',exploration:{walls}});
 ok('the real hospital roof (not an R80 world roof) keeps its authored height',h.hospitalRoofMeshR2.scale.y===1&&h.perimeterMeshR83.scale.y===1);
 const w=new TR();w.hospitalRoofMeshR2=mk();w.perimeterMeshR83={scale:{y:1}};w.ensureHospitalRoofsR2({zone:'x',exploration:{walls:[...Array(9)].map(()=>({height:2.705}))}});
 ok('maps whose walls already are 2.705 stay unchanged',w.hospitalRoofMeshR2.scale.y===1);
 ctx.__STORYWORLD_ROOF_HEIGHT_R267__.set(false);r.ensureHospitalRoofsR2({zone:'ep1b02',exploration:{walls}});ok('switch off restores the original height',r.hospitalRoofMeshR2.scale.y===1);}
// R268: 가짜 세계에서 몹을 영웅 바로 위(화면)로 두고 시간을 흘린다
function world(enemy,opts={}){const ctx=base();let t=0;ctx.time=0;ctx.started=true;ctx.loading=false;ctx.modal=null;ctx.storyScene=null;
 ctx.player={x:10,y:10,hp:100};ctx.room={enemies:[enemy]};ctx.blocked=opts.blocked||(()=>false);ctx.clearLine=()=>true;
 ctx.facing=(x,y)=>{const sx=x-y,sy=(x+y)*.5;return Math.abs(sx)>Math.abs(sy)*1.35?(sx>0?'right':'left'):sy>0?'front':'back';};
 const frames=[];ctx.requestAnimationFrame=f=>{frames.push(f);return frames.length;};
 vm.createContext(ctx);vm.runInContext(G,ctx);const api=ctx.__STORYWORLD_MOB_GAZE_R268__;
 const run=(sec)=>{for(let i=0;i<sec*30;i++){t+=1/30;ctx.time=t;const f=frames.shift();if(f)f(t*1000);}};return {ctx,api,run};}
const sv=(e,p)=>({sx:(p.x-p.y)-(e.x-e.y),sy:((p.x+p.y)-(e.x+e.y))/2});
{const e={id:'m1',x:8.5,y:8.5,hp:10};const W=world(e);W.run(.3);ok('no move before the hero has stayed above/below for 0.6 s',e.x===8.5&&e.y===8.5);
 W.run(.6);const v=sv(e,W.ctx.player);ok('ordinary mob blinks to a spot level with the hero on screen (hero to its left/right)',Math.abs(v.sx)>Math.abs(v.sy)*2&&W.api.inspect().stats.blinks===1,{e,v});
 ok('after the blink the mob faces the hero sideways',e.direction==='left'||e.direction==='right');
 const n=W.api.inspect().stats.blinks;e.x=8.5;e.y=8.5;W.run(1.5);ok('the same mob waits its 3 s cooldown',W.api.inspect().stats.blinks===n);}
{const e={id:'b1',x:8,y:8,hp:100,boss:true};const W=world(e);W.run(.75);const mid=[e.x,e.y];W.run(.4);const v=sv(e,W.ctx.player);
 ok('bosses dash (not teleport): an in-between position is seen, then they end level with the hero',W.api.inspect().stats.dashes===1&&Math.abs(v.sx)>Math.abs(v.sy)*2&&!e.r268Dash,{mid,e});}
{const e={id:'b2',x:8,y:8,hp:100,boss:true,stationary:true};const W=world(e);W.run(1);const p=W.ctx.player,v=sv(e,p);
 ok('a boss that cannot move summons the hero beside it at the same screen height',W.api.inspect().stats.summons===1&&Math.abs(v.sx)>Math.abs(v.sy)*2,{p});
 const n=W.api.inspect().stats.summons;p.x=10;p.y=10;W.run(3);ok('hero summon has an 8 s cooldown',W.api.inspect().stats.summons===n);}
{const e={id:'t1',x:8.5,y:8.5,hp:10,r170Tower:true};const W=world(e);W.run(2);ok('ordinary towers never drag the hero',W.api.inspect().stats.summons===0&&W.ctx.player.x===10);}
{const e={id:'m2',x:8.5,y:8.5,hp:10,attack:{t:0}};const W=world(e);W.run(2);ok('no repositioning during an attack wind-up/strike',e.x===8.5&&W.api.inspect().stats.blinks===0);}
{const e={id:'m3',x:8.5,y:8.5,hp:10};const W=world(e,{blocked:()=>true});W.run(2);ok('blocked side spots: the ordinary mob stays put',e.x===8.5&&W.api.inspect().stats.blocked>=1);}
{const e={id:'m4',x:8,y:12,hp:10};const W=world(e);W.run(2);ok('a mob already to the hero\'s left/right is left alone',e.x===8&&e.y===12&&W.api.inspect().stats.blinks===0);}
{const e={id:'m5',x:8.5,y:8.5,hp:10};const W=world(e);W.ctx.modal={};W.run(2);ok('paused while a panel is open',e.x===8.5);}
for(const [n,s] of [['roof',F],['gaze',G]])try{new vm.Script(s);ok('syntax '+n,true);}catch(e){ok('syntax '+n,false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R267 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
