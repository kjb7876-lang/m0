'use strict';
// R1148c — 시간이 멈춘 동안(배치 창 같은 modal) 춤 기억 중인 영웅을 스크립트·UI 가 옮기면, 그 자리를 새 본체 자리로 삼는다.
//  원인(r1124 'mobile fixture neon' 간헐 실패 조사, 2026-11-18): 모바일 자동 스킬이 실검무를 막 시작한 뒤 배치 창을 열고 영웅을 옮기면,
//  R706 이 시간이 멈춘 tick 에서도 영웅을 춤 시작 때 기억한 본체 자리로 되돌려 '지금 자리' 배치가 엉뚱한 곳(앞서 둔 영웅 자리)으로 간다.
//  고침: 시간이 흐르지 않은 tick 에서 영웅이 마지막으로 되돌린 자리와 다르면 그 자리를 본체 자리로 삼는다(시간이 흐를 땐 예전 그대로).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const NAME='dance-free-r706.js',src=fs.readFileSync(path.join(R,'client-source',NAME),'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text',NAME),'utf8')===src,'runtime-text 사본 = client-source');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1148c/dance-modal-move-cpu-check.cjs'),'pages.yml CPU 검사 줄');
function mk(o={}){
 const sb={console,Math,Number,Object,Array,Set,Map,JSON,String,localStorage:{getItem:()=>null,setItem(){}},
  time:0,modal:null,loading:false,room:{id:'z'},player:{hero:'hwando',x:10,y:10,hp:100,direction:'front'},heroArt:{},
  moveActor(a,dx,dy){a.x+=dx;a.y+=dy;},fx(){},dance:null,
  // 엔진 흉내: 시간이 흐를 때만 춤 타격이 영웅을 적 곁으로 옮긴다(modal 이면 엔진 시간이 멈춤).
  tick(dt){const p=sb.player;if(sb.modal)dt=0;sb.time+=dt;const d=sb.dance;if(d&&dt>0){if(sb.time<d.until){p.x=d.foe.x-.8;p.y=d.foe.y;}else{p.x=d.home.x;p.y=d.home.y;sb.dance=null;}}
   // 안쪽 오버레이(play-r115)가 엔진 tick 안에서 settle 을 부르는 길(실제 게임은 이 길로 먼저 되돌린다)
   if(sb.settleInside)sb.__STORYWORLD_DANCE_FREE_R706__?.settle?.();},
  __STORYWORLD_DANCES_R74__:{moving:()=>!!sb.dance,nativeActive:()=>!!sb.dance}};
 sb.startDance=(fx,fy,dur)=>{sb.dance={home:{x:sb.player.x,y:sb.player.y},foe:{x:fx,y:fy},until:sb.time+dur};};
 sb.settleInside=!!o.settle;sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:NAME});
 sb.run=(k,dt=.05)=>{for(let i=0;i<k;i++)sb.tick(dt);};return sb;}
const near=(a,b)=>Math.abs(a-b)<1e-6,D=s=>s.__STORYWORLD_DANCE_FREE_R706__.state();
// 1. 춤 중 modal 을 열고 영웅을 옮기면 그 자리에 머문다(되돌아가지 않음) — r1124 배치 fixture 와 같은 순서.
{const s=mk();s.startDance(18,10,5);s.run(4);
 ok(D(s).dancing&&near(s.player.x,10),'춤 중 본체는 제자리(10)');
 s.modal={id:'r720'};s.tick(.05);s.player.x=7;s.player.y=12;s.run(3);
 ok(near(s.player.x,7)&&near(s.player.y,12),'시간이 멈춘 동안 옮긴 자리(7,12)에 머문다 (지금 '+s.player.x.toFixed(2)+','+s.player.y.toFixed(2)+')');
 ok(D(s).body&&near(D(s).body.x,7)&&near(D(s).body.y,12),'R706 본체 기억도 새 자리(7,12)');
 s.modal=null;s.run(3);
 ok(near(s.player.x,7)&&near(s.player.y,12),'modal 을 닫고 춤이 이어져도 새 자리로 돌아온다(10 으로 끌려가지 않음)');
 s.run(120);ok(!D(s).body&&near(s.player.x,7),'춤이 끝나도 새 자리(7) 그대로');
 ok(s.__STORYWORLD_DANCE_FREE_R706__.stats().errors===0,'오류 0');}
// 1b. 같은 순서인데 tick 안에서 play-r115 가 settle 을 부르는 길(실제 게임 경로).
{const s=mk({settle:true});s.startDance(18,10,5);s.run(4);
 ok(D(s).dancing&&near(s.player.x,10),'settle 길: 춤 중 본체는 제자리(10)');
 s.modal={id:'r720'};s.tick(.05);s.player.x=7;s.player.y=12;s.run(3);
 ok(near(s.player.x,7)&&near(s.player.y,12),'settle 길: 멈춘 동안 옮긴 자리(7,12)에 머문다 (지금 '+s.player.x.toFixed(2)+','+s.player.y.toFixed(2)+')');
 s.modal=null;s.run(3);ok(near(s.player.x,7),'settle 길: 시간이 다시 흘러도 새 자리(7)');}
{const s=mk({settle:true});s.startDance(18,10,1);s.run(10);ok(near(s.player.x,10),'settle 길: 시간이 흐를 땐 예전처럼 본체(10)로 되돌린다');}
// 2. 시간이 흐르는 tick 의 동작은 예전 그대로: 춤이 영웅을 적 곁으로 옮겨도 본체 자리로 되돌린다.
{const s=mk();s.startDance(18,10,1);s.run(10);ok(near(s.player.x,10)&&near(s.player.y,10),'시간이 흐를 땐 타격 뒤 본체(10)로 되돌린다(예전 그대로)');}
// 3. 시간이 멈춘 tick 인데 아무도 옮기지 않았으면 본체 자리 그대로.
{const s=mk();s.startDance(18,10,5);s.run(4);s.modal={id:'x'};s.run(5);ok(near(s.player.x,10)&&D(s).body&&near(D(s).body.x,10),'멈춘 동안 옮기지 않으면 본체 자리 그대로');}
console.log(bad?`${n-bad}/${n} — ${bad}개 실패`:`${n}/${n} — 모두 통과`);process.exitCode=bad?1:0;
