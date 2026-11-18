'use strict';
// R1121 히든 영웅 EGO 스킬 탄 — CPU 검사(사용자 2026-11-17 09:17Z "에고각성 … 스킬이펙트랑 아직 이미지 짤리는버그", 09:18Z "그냥 상태에서도").
//  헤드리스 재현(qa/r1121/r1121-browser.mjs)으로 찾은 원인 두 가지를 실제 엔진과 같은 모양의 샌드박스로 검사한다.
//  ① 엔진 makeShot 감싸기(index.html, sourceProjectile5 없는 아군 탄 → 영웅 'A' 그림 hwando-a.webp 로 덮어씀) 때문에
//     EGO 협주 기술(R1094)의 페르소나 탄 9종이 환도 은빛 초승달 조각으로 그려졌다 → 탄 그림이 페르소나 원본(rc134)으로 남아야 한다.
//  ② 거점(safeRegion)에선 엔진이 tickShots 를 돌리지 않아 탄이 영웅 발밑에 영원히 멈춰 몸을 가렸다 → 거점에선 페르소나 탄을 쏘지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,300):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-kit-r1094.js',SRC=rd(path.join(R,'client-source',N));
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1121/r1121-cpu-check.cjs'),'pages.yml CPU 검사 줄');
// 엔진 index.html 의 makeShot 감싸기가 아직 있는지(이 검사의 전제)
{const html=rd(path.join(R,'hospital-three-pc/site/index.html'))||rd(path.join(R,'runtime-text/index.html'));
 ok(!html||/if\(shot\?\.friendly&&!ego\)\{[^]*?!shot\.sourceProjectile5&&!shot\.storyWER[^]*?shot\.asset=path/.test(html),'엔진 아군 탄 그림 덮어쓰기(전제) 확인 또는 빌드 없음');}
function kit(opt={}){const iv=[];const sb={console,JSON,Object,Array,Number,String,Math,Set,Map,Date,isFinite,setInterval:f=>{iv.push(f);return iv.length;},localStorage:{getItem:()=>null,setItem(){}}};sb.window=sb;vm.createContext(sb);
 vm.runInContext(`var time=10,shots=[],delays=[],floats=[],SAFE=${opt.safe===true};var player={hero:'hwando',x:0,y:0,hp:100,combo:0,specialCD:0,ego:0,shield:0};
  var actions={hwando:{a:'assets/vfx/heroes/hwando-a.webp',q:'assets/vfx/heroes/hwando-q.webp'}};
  function makeShot0(x,y,a,sp,dmg,o){const s={x,y,a,sp,dmg,age:0,...o};shots.push(s);return s;}
  /* index.html 5420줄과 같은 감싸기: sourceProjectile5 가 없는 아군 탄은 영웅 'A' 그림으로 */
  function makeShot(...args){const shot=makeShot0(...args);if(shot?.friendly){if(!shot.sourceProjectile5&&!shot.storyWER){const path=actions[player.hero].a;shot.asset=path;shot.sourceProjectile5={path,sourceRect:null,owner:'hero:'+player.hero,name:'current-main-native-a'};shot.storyWorldKey5='hero:'+player.hero+':a:current-main';}}return shot;}
  function delay(s,fn){delays.push({at:time+s,fn});}
  function flush(){const d=delays.splice(0);for(const q of d)q.fn();if(delays.length)flush();}
  function attackPower(){return 10;} function rank(){return 0;} function nearestEnemy(){return {x:5,y:0};} function floatText(s){floats.push(s);}
  ${opt.noSafeFn?'':'function safeRegion(){return SAFE;}'}
  function basicAttack(){player.combo++;} function special(){if(player.specialCD>0)return;player.specialCD=10;} function ego(){if(player.ego>0)return;player.ego=3;}
  window.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>true,inspect:()=>({rc151:false})};`,sb);
 vm.runInContext(rd(path.join(R,'client-source/ego-sovereign-r1046.js')),sb);
 vm.runInContext(SRC,sb,{filename:N});return{sb,iv,run:c=>vm.runInContext(c,sb)};}
const persona=s=>/assets\/rc134\/persona-skills\/[a-z-]+\.png$/.test(s.asset)&&s.sourceProjectile5?.path===s.asset&&!/hwando/.test(String(s.storyWorldKey5||'')+s.sourceProjectile5?.owner);
// ① 전투 지역: 탄은 나가고 그림은 페르소나 원본
{const{sb,run}=kit();run('basicAttack();basicAttack();basicAttack();flush()');
 ok(sb.shots.length===3,'전투: 3타 악의의 관통 3발',sb.shots.length);
 ok(sb.shots.length>0&&sb.shots.every(persona),'전투: 3타 탄 그림 = 페르소나 lance 원본(환도 hwando-a 아님)',sb.shots.map(s=>[s.asset,s.storyWorldKey5]));
 ok(sb.shots.every(s=>/lance\.png$/.test(s.asset)),'3타 탄 = lance');
 run('shots.length=0;special();flush()');ok(sb.shots.length===6&&sb.shots.every(persona)&&sb.shots.every(s=>/star\.png$/.test(s.asset)),'전투: Q 순수악의의 분기 6발 = star 원본',sb.shots.map(s=>s.asset));
 run('shots.length=0;ego();flush()');ok(sb.shots.length===2&&sb.shots.every(persona)&&sb.shots.every(s=>/eclipse\.png$/.test(s.asset)),'전투: F EGO 각성 욕망의 일식 2발 = eclipse 원본',sb.shots.map(s=>s.asset));
 ok(sb.shots.every(s=>s.friendly===true&&s.owner==='hero'&&Number.isFinite(s.dmg)&&s.dmg>0),'아군 탄·피해 유한(회귀)');}
// ② 거점: 탄을 쏘지 않는다(엔진이 거점에선 탄을 움직이지 않음)
{const{sb,run}=kit({safe:true});run('basicAttack();basicAttack();basicAttack();basicAttack();basicAttack();flush();special();flush();ego();flush()');
 ok(sb.shots.length===0,'거점: 기본 3·5타·Q·F 모두 페르소나 탄 0(발밑에 멈춘 탄 없음)',sb.shots.length);
 ok(sb.player.combo===5&&sb.player.specialCD===10&&sb.player.ego===3,'거점: 환도 기술 자체는 그대로(회귀)');
 ok(!(sb.player.shield>0),'거점: 되비친 집착 보호막도 안 생김');}
// ③ 늦게 나가는 탄(시차)이 거점에 들어간 뒤 풀려도 쏘지 않는다
{const{sb,run}=kit();run('player.combo=0;basicAttack();basicAttack();basicAttack();SAFE=true;flush()');ok(sb.shots.length===0,'지연 중 거점 진입: 탄 0',sb.shots.length);}
// ④ safeRegion 함수가 없는 판(옛 빌드)에서도 그대로 쏜다(경계)
{const{sb,run}=kit({noSafeFn:true});run('basicAttack();basicAttack();basicAttack();flush()');ok(sb.shots.length===3&&sb.shots.every(persona),'safeRegion 없음: 그대로 3발·원본 그림');}
// ⑤ 다른 영웅의 아군 탄(엔진 감싸기)은 건드리지 않는다(회귀)
{const{sb,run}=kit();run('makeShot(0,0,0,10,5,{friendly:true,owner:"hero"})');ok(/hwando-a\.webp$/.test(sb.shots[0].asset),'일반 아군 탄은 엔진 그림 그대로');}
console.log(`\nR1121 cpu: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
