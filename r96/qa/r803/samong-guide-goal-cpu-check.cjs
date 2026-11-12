// R803 — 사몽 S-03~S-07 헤드리스 실플레이 순회: 처치 수를 채운 뒤에도
//  · 탑(F) 구역은 '조각 n/6 깨기'에서, 이끄는 적 구역(S06-18 '적 지휘 기체' 40칸 밖)은 단서 1/2 에서 몇 분씩 멈췄다.
//  원인: R801 CALM 이 F·이끄는 적 구역을 제외해, 길잡이(R426)가 영웅 둘레에 계속 생기는 몹만 쫓았고
//  남은 목표인 조각(탑)·이끄는 적은 10칸 시야 밖이라 아무도 그쪽으로 가지 않았다.
//  고침: 처치 수를 채운 F·이끄는 적 구역도 CALM(2.5칸 안만 처리)으로 두고, 그 대신 남은 목표 적(조각 탑·이끄는 적)은 거리와 상관없이 고른다.
// CPU 에서 가짜 엔진에 붙여 본다. GPU·실기기·사람 손 플레이는 미검증.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const GC=C('guide-clear-r426.js');ok('runtime copy matches client-source',RT('guide-clear-r426.js')===GC);
const ZONES={F:{id:'zf',kind:'combat',mode:'F',goal:{kills:66,clues:true}},lead:{id:'zl',kind:'combat',lead:{name:'L'},goal:{kills:66,clues:true}},
 B:{id:'zb',kind:'combat',mode:'B',goal:{kills:666}},kill:{id:'zk',kind:'combat',goal:{kills:66,clues:true}}};
function gc({zone=null,kills=0,lead=false}={}){const sb={localStorage:{getItem:()=>null,setItem(){}},Math,JSON,String,Array,Set,Map,Object,Number};sb.window=sb;
 const byId=Object.fromEntries(Object.values(ZONES).map(z=>[z.id,z]));
 sb.__STORYWORLD_SAMONG_ZONES_R115__={zone:id=>byId[id]||null};sb.__STORYWORLD_SAMONG_R103__={state:()=>({kills})};vm.createContext(sb);
 vm.runInContext(`var guide=true,modal=false,loading=false,time=0,command=null,target=null,route=[],player={x:0,y:0,hp:100},layer='DREAM',
  room={id:'z',engaged:false,enemies:[]},__base=0;
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function clearLine(){return true;}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}
  function guideStep(dt){__base++;}`,sb);
 if(zone)vm.runInContext(`room.samongR103=${JSON.stringify({zone:zone.id,portal:null,leadId:lead?'L':null,leadAlive:lead==='dead'?0:lead?1:0})};`,sb);
 vm.runInContext(GC,sb);
 return{ev:s=>vm.runInContext(s,sb),step:(n=1,dt=.3)=>{for(let i=0;i<n;i++)vm.runInContext(`time+=${dt};guideStep(${dt})`,sb);}};}
const add={far:"room.enemies.push({id:'m',x:9,y:0,hp:20})",near:"room.enemies.push({id:'n',x:2,y:0,hp:20})",
 tower:"room.enemies.push({id:'t',x:30,y:0,hp:900,r170Tower:{}})",lead:"room.enemies.push({id:'L',x:0,y:40,hp:9e4,boss:true})"};
const tgt=(o,...adds)=>{const F=gc(o);for(const a of adds)F.ev(add[a]);F.step();const c=F.ev('command');return c===null?null:(c.id??c);};
ok('F, kills met: spawn 9 tiles away no longer pulls the guide',tgt({zone:ZONES.F,kills:66},'far')===null);
ok('F, kills met: shard tower 30 tiles away is the target',tgt({zone:ZONES.F,kills:66},'far','tower')==='t');
ok('F, kills met: enemy in contact (2 tiles) first, then the tower',tgt({zone:ZONES.F,kills:66},'near','tower')==='n');
ok('F, kills not met: unchanged (fights the spawn 9 tiles away)',tgt({zone:ZONES.F,kills:20},'far','tower')==='m');
ok('lead alive, kills met: lead 40 tiles away is the target',tgt({zone:ZONES.lead,kills:66,lead:true},'far','lead')==='L');
ok('lead alive, kills met: spawn 9 tiles away alone does not pull the guide',tgt({zone:ZONES.lead,kills:66,lead:true},'far')===null);
ok('lead alive, kills not met: unchanged (spawn 9 tiles away)',tgt({zone:ZONES.lead,kills:20,lead:true},'far','lead')==='m');
ok('lead dead, kills met: calm as R801',tgt({zone:ZONES.lead,kills:66,lead:'dead'},'far')===null);
ok('plaza B: unchanged (far tower not chased, spawn in sight fought)',tgt({zone:ZONES.B,kills:700},'tower')===null&&tgt({zone:ZONES.B,kills:700},'far')==='m');
ok('plain combat, kills met: a stray tower far away is not a goal there',tgt({zone:ZONES.kill,kills:66},'tower')===null);
ok('outside samong: unchanged',tgt({},'far')==='m'&&tgt({},'tower')===null);
let failed=0;for(const c of checks){if(!c.pass)failed++;console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'').slice(0,400)));}
console.log(JSON.stringify({total:checks.length,failed}));if(failed)process.exitCode=1;
