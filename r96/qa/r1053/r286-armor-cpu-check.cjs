// R1053b CPU 검사: R286 돌진(charge·dash)도 공격이다 — 슈퍼아머(규칙 ③)가 걸려야 한다.
// 헤드리스 측정(2026-11-15): kair04·05 시간수문장 근접 몹은 R286 이 그리는 순간에만 e.attack(r286Fake)을 만들어,
//  규칙 오버레이가 공격으로 못 보고 hitTimer 를 남겨 돌진 그림 순간 15~26%가 피격 자세였다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
function env(){const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,setTimeout:()=>0};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,frameDT=1/60,player={x:20,y:16,hp:1000,maxHp:1000},room={id:"kair04",enemies:[]},settings={};
 function tickEnemies(dt){for(const e of room.enemies){e.hitTimer=Math.max(0,e.hitTimer-(dt||frameDT));}}
 function hitEnemy(e,v){e.hp-=v;e.flash=.14;e.hitTimer=.14;return true;}
 function drawEnemy(e){}`,g);vm.runInContext(C('enemy-rules-r1053.js'),g);return g;}
const mk=o=>({id:'g'+Math.random().toString(36).slice(2,7),name:'시간수문장 01',hp:1e6,maxHp:1e6,x:16,y:12,speed:1,ai:'melee',cd:.5,hitTimer:0,flash:0,attack:null,rangedWindup:0,spawnState:'active',direction:'right',combatProfile:{aggro:9},...o});
const g=env();const RU=g.__STORYWORLD_ENEMY_RULES_R1053__;
for(const mode of ['charge','dash']){
 const e=mk({r286:{mode,t0:0}});g.room.enemies=[e];
 ok(mode+': counted as attacking',!!RU.attacking(e));
 g.hitEnemy(e,1);ok(mode+': hit keeps no hit pose (armor)',e.hitTimer===0);ok(mode+': flash kept',e.flash>0);
 e.hitTimer=.1;g.tickEnemies(1/60);ok(mode+': tick leaves no hit pose',e.hitTimer===0);
}
{const e=mk({r286:{mode:'aim',t0:0}});ok('aim (sidestep, not a strike): not attacking',!RU.attacking(e));
 const n=mk({r286:{mode:null,t0:0}});ok('no R286 action: not attacking',!RU.attacking(n));
 g.room.enemies=[n];g.hitEnemy(n,1);ok('single hit outside attack still shows hit pose',n.hitTimer>0);}
{const e=mk({r286:{mode:'charge',t0:NaN}});ok('NaN R286 time: no throw',(()=>{try{RU.attacking(e);RU.settle(e,null);return true;}catch(_){return false;}})());}
{const e=mk({r286:{mode:'dash',t0:0}});RU.set({armor:false});g.room.enemies=[e];g.hitEnemy(e,1);ok('armor off switch respected',e.hitTimer>0);RU.set({armor:true});}
console.log(`R1053b r286 armor cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
