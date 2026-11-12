// R801 — 사몽·사몽역행: 길잡이가 목표(단서·열린 문)보다 계속 생기는 몹을 먼저 쫓아 구역을 못 넘던 문제(헤드리스 실플레이 순회에서 발견).
//  처치 수를 채운 일반 전투 구역(단서만 남음)·탐색·미로 구역·문이 열린 구역에서는 R426 이 붙어 싸우는 2.5칸 안의 적만 먼저 처리하고, 그 밖의 적은 길잡이 이동에 맡긴다.
//  처치 수를 아직 못 채운 구역·광장(B)·코어(D)·호위(G)·물결(H)·탑(F)·버티기·이끄는 적이 남은 구역·사몽 밖 지역은 예전 그대로(10칸 시야·16칸 추격).
// CPU 에서 가짜 엔진에 붙여 본다. GPU·실기기·사람 손 플레이는 미검증.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const GC=C('guide-clear-r426.js');
ok('runtime copy matches client-source',RT('guide-clear-r426.js')===GC);
const ZONES={
 kill:{id:'zk',kind:'combat',goal:{kills:66,clues:true}},
 explore:{id:'ze',kind:'explore',goal:{clues:true}},
 maze:{id:'zm',kind:'maze',goal:{reach:true}},
 B:{id:'zb',kind:'combat',mode:'B',goal:{kills:666}},
 F:{id:'zf',kind:'combat',mode:'F',goal:{kills:66,clues:true}},
 hold:{id:'zh',kind:'combat',goal:{kills:10,hold:30}},
 lead:{id:'zl',kind:'combat',lead:true,goal:{kills:10}}};
function gc({zone=null,kills=0,portal=false,lead=null}={}){const sb={localStorage:{getItem:()=>null,setItem(){}},Math,JSON,String,Array,Set,Map,Object,Number};sb.window=sb;
 const byId=Object.fromEntries(Object.values(ZONES).map(z=>[z.id,z]));
 sb.__STORYWORLD_SAMONG_ZONES_R115__={zone:id=>byId[id]||null};sb.__STORYWORLD_SAMONG_R103__={state:()=>({kills})};vm.createContext(sb);
 vm.runInContext(`var guide=true,modal=false,loading=false,time=0,command=null,target=null,route=[],player={x:0,y:0,hp:100},layer='DREAM',
  room={id:'z',engaged:false,enemies:[]},__base=0;
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function clearLine(){return true;}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function guideStep(dt){__base++;}`,sb);
 if(zone)vm.runInContext(`room.samongR103=${JSON.stringify({zone:zone.id,portal:portal?{x:9,y:9}:null,leadId:lead?'L':null,leadAlive:!!lead})};`,sb);
 vm.runInContext(GC,sb);
 return{api:sb.__STORYWORLD_GUIDE_CLEAR_R426__,ev:s=>vm.runInContext(s,sb),step:(n=1,dt=.3)=>{for(let i=0;i<n;i++)vm.runInContext(`time+=${dt};guideStep(${dt})`,sb);}};}
const far="room.enemies.push({id:'m',x:9,y:0,hp:20})",near="room.enemies.push({id:'n',x:2,y:0,hp:20})";
const attacks=(o,add)=>{const F=gc(o);F.ev(add);F.step();return F.ev('command')!==null&&F.ev('__base')===0;};
// 처치 목표를 채운 일반 전투 구역(단서만 남음): 9칸 적은 길잡이 이동에 맡기고, 4칸 적은 처리
ok('kill quota met, clues left: enemy 9 tiles away does not stop the guide',!attacks({zone:ZONES.kill,kills:66},far));
ok('kill quota met: enemy 2 tiles away (in contact) is still fought',attacks({zone:ZONES.kill,kills:66},near));
ok('kill quota not met yet: enemy 9 tiles away is fought as before',attacks({zone:ZONES.kill,kills:20},far));
ok('explore zone: enemy 9 tiles away does not stop the guide',!attacks({zone:ZONES.explore},far)&&attacks({zone:ZONES.explore},near));
ok('maze zone: enemy 9 tiles away does not stop the guide',!attacks({zone:ZONES.maze},far)&&attacks({zone:ZONES.maze},near));
ok('door open (any zone, even B): enemy 9 tiles away does not stop the guide',!attacks({zone:ZONES.B,kills:100,portal:true},far)&&attacks({zone:ZONES.B,portal:true},near));
// R803 이후 처치 수를 채운 탑(F)·이끄는 적 구역도 CALM(남은 조각 탑·이끄는 적은 거리 상관없이 고름) → r96/qa/r803/samong-guide-goal-cpu-check.cjs 가 본다.
ok('plaza B / hold: unchanged (fight what is in sight); F and living lead before the kill quota: unchanged',attacks({zone:ZONES.B,kills:700},far)&&attacks({zone:ZONES.hold,kills:66},far)&&attacks({zone:ZONES.F,kills:20},far)&&attacks({zone:ZONES.lead,kills:5,lead:true},far));
ok('outside samong: unchanged',attacks({},far));
{const F=gc({zone:ZONES.kill,kills:20});F.ev(far);F.step();const before=F.ev('command');
 F.ev("__base=0");vm.runInContext;F.ev("void 0");
 // 처치 목표를 채우는 순간: 멀리 잡고 있던 적도 놓고 길잡이로
 const G=gc({zone:ZONES.kill,kills:66});G.ev(far);G.ev("room.enemies[0].x=9");G.step(3);
 ok('focus on a far enemy is dropped once calm (guide moves on)',before==='m'&&G.ev('__base')>=1&&G.api.inspect().focus===null);}
ok('inspect reports the calm radius',gc().api.CALM===2.5);
ok('samong portal walk (R141) yields only to enemies inside the same R426 calm radius',/spawnState==='active'&&Math\.hypot\(e\.x-player\.x,e\.y-player\.y\)<\(window\.__STORYWORLD_GUIDE_CLEAR_R426__\?\.CALM\?\?6\)/.test(C('samong-r103.js'))&&RT('samong-r103.js')===C('samong-r103.js'));
let failed=0;for(const c of checks){if(!c.pass)failed++;console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'').slice(0,400)));}
console.log(JSON.stringify({total:checks.length,failed}));if(failed)process.exitCode=1;
