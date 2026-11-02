// R218 CPU check: 실내(디테일 전용) 지역 건물 골격 — 벽 모서리·교차·끝점과 긴 벽 4칸마다 기둥, 문 둘레 비움, 어두운 실내 바닥 밝힘.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('cave-r204.js');
ok('runtime copy matches · cave-r204.js',RT('cave-r204.js')===src);
ok('in the CI workflow',/qa\/r218\/r218-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('skeleton is built only in the decor-only (interior) branch and can be switched off',/if\(cfg\.decorOnly\)\{[\s\S]*?prefs\.skeleton!==false[\s\S]*?r218-skeleton[\s\S]*?return;\}/.test(src)&&/skeleton:true/.test(src));
ok('skeleton uses the hero cutaway (never hides the hero) and the sight mask',/sm\.onBeforeCompile=sh=>cutaway\(sh,U\)/.test(src)&&/attachSight24\(sm,/.test(src)&&/if\(deco\)\{heroUniform\(r,frame\);/.test(src));
ok('no ctx.filter drop-shadow/blur (Three recorder rule)',!/drop-shadow|filter\s*=\s*['"]blur/.test(src));
ok('every interior kind has a structure colour; dark home/urban floors are lifted more than clinic',['clinic','urban','home','forge','machine'].every(k=>new RegExp(k+':\\{bone:\\[').test(src))&&/home:\{bone:\[[^\]]+\],floorLift:1\.8/.test(src)&&/clinic:\{bone:\[[^\]]+\],floorLift:1,/.test(src));
// 기둥 자리
const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,setTimeout:()=>0,localStorage:{getItem:()=>null,setItem(){}},
 window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};
vm.createContext(sb);vm.runInContext('var room=null,player={x:0,y:0};function blocked(){return false;}function makeRoom(id){return {id,layer:"STORY",props:[],enemies:[]};}async function enterRegion(){return true;}',sb);vm.runInContext(src,sb);
const API=sb.window.__STORYWORLD_CAVE_R204__;
const ex={bounds:[0,0,30,20],floorCells:[],walls:[
 {id:'w0',endpoints:[[2,2],[14,2]],height:2.85},{id:'w1',endpoints:[[2,2],[2,10]],height:2.9},{id:'w2',endpoints:[[8,2],[8,6]],height:2.85},
 {id:'door-a',endpoints:[[20,2],[22,2]],height:2.85},{id:'w3',endpoints:[[20,10],[28,10]],height:2.85}],worldR74:{doors:[{id:'door-1',x:26,y:10,width:2}]}};
const pts=API.skeletonPoints(ex),has=(x,y)=>pts.some(p=>Math.abs(p.x-x)<.01&&Math.abs(p.y-y)<.01);
ok('corner, T-junction and free ends get a pillar',has(2,2)&&has(8,2)&&has(14,2)&&has(2,10)&&has(8,6),pts.map(p=>[p.x,p.y]));
ok('a 12-cell wall gets pillars every 4 cells (x=6, 10)',has(6,2)&&has(10,2));
ok('a corner pillar takes the taller wall height',Math.abs(pts.find(p=>p.x===2&&p.y===2).h-2.9)<1e-9);
ok('door walls and the space around a door stay clear',!has(20,2)&&!has(22,2)&&!has(28,10)&&has(20,10),pts.filter(p=>p.y===10).map(p=>[p.x,p.y]));
ok('short walls (<6) get no extra mid pillars',!pts.some(p=>p.x===8&&p.y>2&&p.y<6));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
