// R1132d 길잡이가 닫힌 문 너머 몹에 붙어 멈춤 — R426 적 고르기 CPU 검사(가짜 엔진, 그래픽·자연 플레이 미검증).
//  증거(2026-11-18 이어 하기 재검증 cult04 3/4판, 멈춘 판 붙잡아 실측): 보스 준비(bossReady)에서 영웅이 닫힌 door-2 앞(8.5,7.4)에 서서
//   command 가 문 너머 몹 셋(c104-e1·r75-pack:24·c104-e1:r373c0) 사이를 몇 초마다 바꿔 가며 게임 150초 넘게 멈췄다(길 0칸·시야 없음).
//   R426 은 시야 없는 몹도 R390 이 '영웅을 봤다(engaged)'면 16칸 안에서 고르고, 8초 못 다가가면 15초 쉬게 한다 → 셋이면 8×3>15 라 끝없이 돈다.
//  고침: 시야 없는 engaged 몹은 길(findPath)이 닿을 때만 고른다.
// 검사: ① 길 없는 engaged 몹 셋(벽 너머) → 게임 60초 안에 원래 길잡이(base guideStep)가 다시 돈다 ② 길이 닿는 engaged 몹(벽 너머)은 예전처럼 고른다
//       ③ findPath 가 없는 환경(옛 가짜 엔진)은 예전 그대로 ④ 시야가 트인 몹은 길 검사 없이 고른다 ⑤ runtime 사본 일치
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const GC=C('guide-clear-r426.js');let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d):''));};
function gc(o={}){const sb={localStorage:{getItem:()=>null,setItem(){}},Math,JSON,String,Array,Set,Map,Object,Number};sb.window=sb;
 sb.__STORYWORLD_AGGRO_CHASE_R390__={engaged:e=>!!e.spotted};vm.createContext(sb);
 vm.runInContext(`var guide=true,modal=false,loading=false,time=0,command=null,target=null,route=[],player={x:8.5,y:7.4,hp:100},
  room={id:'cult04',engaged:false,enemies:[]},__base=0,__wall=new Set(),__noPath=new Set(),__paths=0;
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function clearLine(a,b){return !__wall.has(b.id);}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  ${o.noFindPath?'':'function findPath(a,b){__paths++;return __noPath.has(b.id)?[]:[{x:b.x,y:b.y}];}'}
  function guideStep(dt){__base++;}`,sb);vm.runInContext(GC,sb);
 return{api:sb.__STORYWORLD_GUIDE_CLEAR_R426__,ev:s=>vm.runInContext(s,sb),step:(k=1,dt=.25)=>{for(let i=0;i<k;i++)vm.runInContext(`time+=${dt};guideStep(${dt})`,sb);}};}
const door="for(const [id,x,y] of [['c104-e1',8.46,4.92],['r75-pack:24',7.3,5.5],['c104-e1:r373c0',8.5,5.5]]){room.enemies.push({id,x,y,hp:1564,spotted:true});__wall.add(id);__noPath.add(id);}";
{const F=gc();F.ev(door);let firstBase=null;for(let i=0;i<240&&firstBase==null;i++){F.step();if(F.ev('__base')>0)firstBase=F.ev('time');}
 ok('① 길 없는 engaged 몹 셋(닫힌 문 너머) → 게임 60초 안에 원래 길잡이가 다시 돈다',firstBase!=null,{firstBase,cmd:F.ev('command'),stats:F.api.inspect().stats});
 ok('① 길 검사는 몹마다 2초에 한 번 이하',F.ev('__paths')<=3*Math.ceil(60/2)+3,{paths:F.ev('__paths')});}
{const F=gc();F.ev("room.enemies.push({id:'c',x:12,y:0,hp:20,spotted:true});__wall.add('c');");F.ev("player.x=0;player.y=0");F.step();ok('② 길이 닿는 engaged 몹(벽 너머)은 예전처럼 고른다',F.ev('command')==='c');}
{const F=gc({noFindPath:true});F.ev("player.x=0;player.y=0;room.enemies.push({id:'c',x:12,y:0,hp:20,spotted:true});__wall.add('c');");F.step();ok('③ findPath 없는 환경은 예전 그대로',F.ev('command')==='c');}
{const F=gc();F.ev("player.x=0;player.y=0;room.enemies.push({id:'m',x:6,y:0,hp:20});__noPath.add('m');");F.step();ok('④ 시야가 트인 몹은 길 검사 없이 고른다',F.ev('command')==='m'&&F.ev('__paths')===0);}
ok('⑤ runtime-text 사본 일치',RT('guide-clear-r426.js')===GC);
console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
