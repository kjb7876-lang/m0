// R1295 CPU 검사: 윤서하 전투 중 '도리도리' — 표적 유지(target-hold-r1295.js) + R143 공격 시트 방향이 지금 쏘는 적을 따름.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');const F='target-hold-r1295.js';const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
let fail=0,n=0;const check=(name,c)=>{n++;if(c)console.log('ok  ',name);else{fail++;console.log('FAIL',name);}};
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
check('① index.html 한 번, ego-auto-r1292 바로 뒤',html.split('"./'+F+'"').length===2&&/<script src="\.\/ego-auto-r1292\.js"><\/script>\n<script src="\.\/target-hold-r1295\.js"><\/script>\n/.test(html));
const vp=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');check('② 공개 검사 기대 목록',vp.includes("'"+F+"'"));
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');check('③ runtime-inputs 등록',inputs.includes(F));
const a143=fs.readFileSync(path.join(R,'client-source','attack-anim-r143.js'),'utf8');check('④ R143 dirNow 가 R1295 foe() 를 먼저 묻는다',/function dirNow\(\)\{[^\n]*__STORYWORLD_TARGET_HOLD_R1295__\?\.foe\?\.\(\)/.test(a143));
// 가짜 세계에서 돌려 보기
function world(){const enemies=[{id:'L',x:-1.41,y:1.41,hp:10},{id:'R',x:1.49,y:-1.49,hp:10}];const W={time:0,target:null,room:{id:'z',enemies},player:{hero:'seoha',x:0,y:0,hp:10,attackCD:0,direction:'front',moving:false},HEROES:{seoha:{range:8.1},hunter:{range:8}},shots:[]};
 const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'complete'},Math,JSON,Number,String,Set,Map,WeakMap,Object,Array,Error};sb.window=sb;
 vm.createContext(sb);vm.runInContext(`var time=0,target=null,room=null,player=null,HEROES=null;
  function facing(x,y){const sx=x-y,sy=(x+y)*.5;return Math.abs(sx)>Math.abs(sy)*1.35?(sx>0?'right':'left'):sy>0?'front':'back'}
  function clearLine(){return true}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0)}
  function nearestEnemy(r=Infinity){const c=liveEnemies().find(e=>e.id===target);if(c&&Math.hypot(c.x-player.x,c.y-player.y)<=r)return c;let b=null,d=r;for(const e of liveEnemies()){const q=Math.hypot(e.x-player.x,e.y-player.y);if(q<d){d=q;b=e}}return b}
  var SHOTS=[];function basicAttack(){if(player.attackCD>0)return;const e=nearestEnemy(HEROES[player.hero].range);if(!e)return;player.direction=facing(e.x-player.x,e.y-player.y);player.attackCD=.5;SHOTS.push(e.id)}
  function tick(dt){time+=dt;player.attackCD=Math.max(0,player.attackCD-dt);/* R98 흉내: 쉬는 동안 가장 가까운 적을 봄 */if(!(player.attackCD>.26)){const e=nearestEnemy(3.6);if(e)player.direction=facing(e.x-player.x,e.y-player.y)}}
  function drawHero(){}`,sb);
 sb.room=W.room;sb.player=W.player;sb.HEROES=W.HEROES;vm.runInContext(src,sb,{filename:F});return sb;}
{const sb=world();const A=sb.window.__STORYWORLD_TARGET_HOLD_R1295__;check('⑤ API·세 곳 감쌈',!!A&&A.inspect().wrappedA&&A.inspect().wrappedT&&A.inspect().wrappedD);
 // 거리 번갈아: L 2.0 / R 2.1 ↔ L 2.1 / R 2.0
 const k=Math.SQRT1_2,place=ph=>{const [L,Rr]=sb.room.enemies;const a=ph%2?2.1:2.0,c=ph%2?2.0:2.1;L.x=-a*k;L.y=a*k;Rr.x=c*k;Rr.y=-c*k;};const dirs=[];
 for(let i=0;i<120;i++){place(Math.floor(sb.time/.2));sb.basicAttack();sb.tick(.05);dirs.push(sb.player.direction);}
 const sh=sb.SHOTS;check('⑥ 양옆 적 거리 번갈아도 같은 적만 쏨 (발 '+sh.length+', 종류 '+[...new Set(sh)].join('')+')',sh.length>=10&&new Set(sh).size===1);
 let flips=0;for(let i=1;i<dirs.length;i++)if(dirs[i]!==dirs[i-1])flips++;check('⑦ 쉬는 사이(R98 흉내)에도 방향 안 바뀜 (바뀜 '+flips+')',flips===0);
 check('⑧ foe() = 지금 쏘는 적',A.foe()?.id===sh[0]);
 // 표적이 죽으면 놓고 다른 적
 const held=sb.room.enemies.find(e=>e.id===sh[0]);held.hp=0;sb.SHOTS.length=0;for(let i=0;i<40;i++){place(Math.floor(sb.time/.2));sb.basicAttack();sb.tick(.05);}
 check('⑨ 표적이 죽으면 남은 적을 쏨',sb.SHOTS.length>0&&sb.SHOTS.every(x=>x!==held.id));
 // 사거리 밖으로 나가면 놓음
 const other=sb.room.enemies.find(e=>e.hp>0);other.x=50;other.y=-50;check('⑩ 사거리 밖 표적은 놓음',A.foe()===null);
}
{const sb=world();sb.target='R';const A=sb.window.__STORYWORLD_TARGET_HOLD_R1295__;for(let i=0;i<60;i++){sb.basicAttack();sb.tick(.05);}check('⑪ 직접 고른 표적이 먼저',sb.SHOTS.length>0&&sb.SHOTS.every(x=>x==='R')&&A.foe()?.id==='R'&&sb.target==='R');}
{const sb=world();sb.player.hero='hunter';const A=sb.window.__STORYWORLD_TARGET_HOLD_R1295__;for(let i=0;i<40;i++){sb.basicAttack();sb.tick(.05);}check('⑫ 서하 아닌 영웅(헌터)은 손대지 않음',A.inspect().hold===null&&A.foe()===null);}
{const sb=world();const A=sb.window.__STORYWORLD_TARGET_HOLD_R1295__;A.setPrefs({on:false});for(let i=0;i<40;i++){sb.basicAttack();sb.tick(.05);}check('⑬ 끄면 유지 안 함',A.inspect().hold===null&&A.foe()===null);}
{const sb=world();const A=sb.window.__STORYWORLD_TARGET_HOLD_R1295__;sb.basicAttack();sb.tick(.05);const before=A.inspect().hold;sb.player.moving=true;sb.player.direction='back';sb.tick(.05);check('⑭ 걷는 중엔 방향에 손대지 않음',!!before&&sb.player.direction==='back');}
{const sb=world();const A=sb.window.__STORYWORLD_TARGET_HOLD_R1295__;sb.basicAttack();sb.tick(.05);for(let i=0;i<40;i++)sb.tick(.05);check('⑮ 1.6초 넘게 공격 없으면 놓음',A.foe()===null);}
check('⑯ 피해·쿨타임 줄을 건드리지 않음',!/attackCD\s*=|power\s*=|hitEnemy\s*\(/.test(src));
console.log(fail?`RESULT FAIL ${fail}/${n}`:`RESULT PASS ${n}`);process.exit(fail?1:0);
