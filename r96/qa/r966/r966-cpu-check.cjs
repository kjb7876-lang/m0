'use strict';
// R966 — 일반 몹(R955)·불면귀 구역 몹(R954) 공격음이 실제 진행에서 한 번도 나지 않던 것.
//  11-12 실전투 점검(헤드리스, main b5f4534, 40지역 × 12 게임초): 피격음·사망음은 지역마다 났지만 공격음은 40지역 모두 0번.
//  몹을 살려 두고 재 보면(dist02·u204·last302) 근접 공격 시작 2·1·14번, 패턴 공격 1·18·8번인데 공격음 0, 간격 제한에 걸린 것도 0.
//  원인: 길을 따라 싸우는 구간(R78 phase 'route')에서는 room.engaged 가 내내 false 인데(집결·보스 구간에서만 true),
//  공격음이 room.engaged===false 면 '전투 전'으로 보고 막았다. 몹이 실제로 나와(spawnState 'active') 공격을 시작했다면 전투 중이다.
//  고침: room.engaged 가 false 여도, R78 이 맡은 방이고(phase route·rally·door·boss) 그 몹이 active 면 공격음을 낸다.
//  R78 이 없는 곳·끝난 방(done·exit)·숨은 몹은 그대로 막는다. 간격 제한·창 없음 조건은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
for(const [rev,mob,slug] of [['r955','수렁 주문사','cultmage'],['r954','잠식된 어부',null]]){
 const src=fs.readFileSync(path.join(R,'client-source/combat-sfx-'+rev+'.js'),'utf8');
 ok(fs.readFileSync(path.join(R,'runtime-text/combat-sfx-'+rev+'.js'),'utf8')===src,rev+': runtime-text 사본 = client-source');
 const mk=(phase)=>{const played=[],timers=[];let clock=1000;
  const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{},roles:{}}},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>clock},console,Math,Promise,
   setInterval:f=>{timers.push(f);return 1;},setTimeout:()=>1,soundProfiles:{enemyHit:[{path:'h.ogg'}],clear:[{path:'c.ogg'}]},setupAudio:()=>'base',audioUnlocked:true,audioBuffer:()=>Promise.resolve({}),
   started:true,modal:null,loading:false,player:{x:0,y:0,hp:10},room:{engaged:false,enemies:[]}};
  if(phase!==undefined)ctx.window.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>phase===null?null:{phase}};
  ctx.sound=function(kind){played.push(kind);return Promise.resolve();};ctx.hitEnemy=()=>true;ctx.killEnemy=()=>{};ctx.bossVolley=()=>'volley';
  ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext('var window=this.window;'+src,ctx);
  return{ctx,tick:()=>timers.forEach(f=>f()),adv:ms=>{clock+=ms;},atk:()=>played.filter(k=>new RegExp('^'+rev+'Atk_').test(k)).length};};
 const E=(o={})=>({name:mob,hp:100,x:1,y:0,spawnState:'active',...o});
 const run=(phase,eo,how)=>{const m=mk(phase),e=E(eo);m.ctx.room.enemies=[e];m.tick();if(how==='pose')e.storyAttackStart5=12.3;else if(how==='volley')m.ctx.bossVolley(e);else e.attack={id:7};m.tick();return m.atk();};
 ok(run('route',{})===1,rev+': 길 구간(phase route, engaged=false)에서 나온 몹의 근접 공격 시작 → 공격음');
 ok(run('route',{},'pose')===1,rev+': 길 구간 패턴 공격 시작 → 공격음');
 ok(run('route',{},'volley')===1,rev+': 길 구간 원거리 사격 → 공격음');
 ok(run('rally',{})===1,rev+': 집결 구간도 공격음');
 ok(run('route',{spawnState:'hidden'})===0,rev+': 아직 숨은 몹은 공격음 없음');
 ok(run('done',{})===0,rev+': 끝난 방(done)은 공격음 없음');
 ok(run('exit',{})===0,rev+': 나가는 중(exit)은 공격음 없음');
 ok(run(null,{})===0,rev+': R78 이 맡지 않은 방은 engaged=false 면 그대로 없음');
 ok(run(undefined,{})===0,rev+': R78 이 없으면 engaged=false 는 그대로 전투 전');
 {const m=mk('route'),e=E();m.ctx.room.enemies=[e];m.tick();m.ctx.modal={};e.attack={id:7};m.tick();ok(m.atk()===0,rev+': 창이 떠 있으면 길 구간이어도 없음');}
 {const m=mk('route'),e=E();m.ctx.room.enemies=[e];m.tick();e.attack={id:7};m.tick();e.attack={id:8};m.adv(100);m.tick();ok(m.atk()===1,rev+': 간격 제한은 그대로(0.1초 뒤 두 번째는 없음)');}
 {const m=mk('route'),e=E();m.ctx.window.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>{throw new Error('x');}};m.ctx.room.enemies=[e];m.tick();e.attack={id:7};m.tick();ok(m.atk()===0,rev+': R78 상태를 못 읽으면 조용히 없음(오류 없이)');}
}
console.log(`\nR966 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
