'use strict';
// R968 — 보스(R788)·중간보스(R789) 공격음이 길 구간(R78 phase route)·R78 구간이 없는 방(phase null)에서 room.engaged=false 라 막히던 것.
//  R966(#522, 일반몹·불면귀몹)과 같은 기준: R78 이 맡은 방이고 그 적이 나와 있으면(active) 전투 중. 숨은 적·끝난 방(done·exit)·R78 없음은 그대로 막음.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r968/r968-cpu-check.cjs'),'pages.yml CPU 검사 줄');
for(const [rev,file,api,boss] of [['R788','combat-sfx-r788.js','__STORYWORLD_SFX_R788__',{name:'발록',boss:true}],['R789','combat-sfx-r789.js','__STORYWORLD_SFX_R789__',{name:'늪의 뿔악마 군주',midboss:true}]]){
 const src=rd(path.join(R,'client-source',file));ok(src.length>0&&rd(path.join(R,'runtime-text',file))===src,rev+': runtime-text 사본 = client-source');
 function mk(phase,engaged){const played=[];const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{},roles:{}}},localStorage:{getItem:()=>null},performance:{now:()=>5000},console,Math,Promise,setInterval:()=>1,setTimeout:()=>1,
   soundProfiles:{},setupAudio:()=>0,audioUnlocked:true,audioBuffer:()=>Promise.resolve({}),started:true,modal:null,loading:false,room:{engaged,enemies:[]}};
  if(phase!=='none')ctx.window.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>({phase})};
  ctx.sound=k=>{played.push(k);};ctx.bossVolley=()=>0;ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext('var window=this.window;'+src,ctx);return {ctx,played};}
 const fire=(phase,engaged,spawn)=>{const m=mk(phase,engaged);m.ctx.bossVolley({...boss,hp:100,spawnState:spawn});return m.played.some(k=>/Atk_/.test(k));};
 ok(fire('route',false,'active'),rev+': 길 구간(engaged=false)·나와 있음 → 공격음');
 ok(fire(null,false,'active'),rev+': R78 구간 없는 방(phase null, ep1a08 등)·나와 있음 → 공격음');
 ok(fire('boss',false,'active')&&fire('rally',false,'active'),rev+': 보스·집결 구간 → 공격음');
 ok(fire('boss',true,undefined),rev+': engaged=true 는 예전처럼 → 공격음');
 ok(!fire('route',false,'hidden'),rev+': 숨은 적(hidden) → 공격음 없음');
 ok(!fire('done',false,'active')&&!fire('exit',false,'active'),rev+': 끝난 방(done·exit) → 공격음 없음');
 ok(!fire('none',false,'active'),rev+': R78 없이 engaged=false → 공격음 없음(예전 그대로)');
 ok(!fire('route',false,undefined),rev+': spawnState 없음·engaged=false → 공격음 없음');}
console.log(`\nR968 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
