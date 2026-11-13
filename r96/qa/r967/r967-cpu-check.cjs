'use strict';
// R967 — 실제 이름 전수에서 소리가 없던 보스 '병원 심부의 집도의'·중간보스 '중독을 부르는 주사기 환영체'(새 ElevenLabs 소리),
//  보스 '불을 지른 청소부 · 분노의 귀'(R788 사탄 소리를 이어 씀)의 피격·사망·공격 소리.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/combat-sfx-r967.js')),src788=rd(path.join(R,'client-source/combat-sfx-r788.js'));
ok(src.length>0,'combat-sfx-r967.js 존재');
ok(rd(path.join(R,'runtime-text/combat-sfx-r967.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html'));
ok(html.indexOf('combat-sfx-r967.js')>html.indexOf('combat-sfx-r788.js')&&html.indexOf('combat-sfx-r788.js')>0,'index.html 태그(R788 뒤)');
ok(/combat-sfx-r967/.test(rd(path.join(ROOT,'scripts/verify-r96-public.py'))),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r967/r967-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const D='assets/r967/sfx/',man=rd(path.join(R,'runtime-manifest.json'));let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.length===14&&/ElevenLabs/.test(idx.origin||''),'index.json 14개·출처 기록('+names.length+')');
const MAXLEN={Hit:.5,Die:1.35,Atk:.8},RISE={Hit:40,Die:260,Atk:160};let total=0;const byKind={};
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 해시·크기·manifest');total+=f.bytes||0;(byKind[f.kind]=byKind[f.kind]||[]).push(k);
 const t=(f.kind.match(/^r967(Hit|Die|Atk)_/)||[])[1];
 ok(!!t&&f.duration<=MAXLEN[t]+.01&&f.duration>=.2,k+': 길이('+f.duration+'s)');
 ok(f.lowShare150<=.10&&f.hfShare5k<=.02,k+': 150Hz 아래 10%·5kHz 위 2% 이하');
 ok(f.peakDb<=-6&&f.peakDb>=-16&&f.tailDb<=-30,k+': 피크 -6~-16dB·끝 닫힘('+f.peakDb+','+f.tailDb+')');
 ok(!!t&&f.riseMs<=RISE[t],k+': 올라오는 시간('+f.riseMs+'ms)');}
ok(total>0&&total<=200000,'음원 합계 200KB 이하('+total+')');
for(const s of ['surgeon','syringe'])ok((byKind['r967Hit_'+s]||[]).length===3&&(byKind['r967Die_'+s]||[]).length===2&&(byKind['r967Atk_'+s]||[]).length===2,s+': 피격 3·사망 2·공격 2');
// 동작: R788 과 함께 vm 에 올린다
function mk(opt={}){const played=[],timers=[];let clock=opt.t0??1000;
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{},roles:{}}},localStorage:{getItem:k=>k==='storyworld.r967.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>clock},console,Math,Promise,
  setInterval:(f)=>{timers.push(f);return 1;},setTimeout:()=>1,soundProfiles:{enemyHit:[{path:'h.ogg'}],clear:[{path:'c.ogg'}]},setupAudio:()=>'base',audioUnlocked:true,audioBuffer:p=>{(ctx.__warm=ctx.__warm||[]).push(p);return Promise.resolve({});},
  started:true,modal:null,loading:false,player:{x:0,y:0,hp:10},room:{engaged:true,enemies:[]}};
 ctx.sound=function(kind,allow){played.push({kind,allow});return Promise.resolve();};
 ctx.hitEnemy=function(e,v){if(!e||e.hp<=0||!(v>0))return false;e.hp-=v;ctx.sound('enemyHit');if(e.hp<=0)ctx.killEnemy(e);return true;};
 ctx.killEnemy=function(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;ctx.sound(e.boss?'clear':'enemyHit');};
 ctx.bossVolley=function(e){return 'volley';};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src788,ctx);vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,timers,err,api:ctx.window.__STORYWORLD_SFX_R967__,adv:ms=>{clock+=ms;},kinds:()=>played.map(p=>p.kind)};}
const SURG='병원 심부의 집도의',SYR='중독을 부르는 주사기 환영체',WRATH='불을 지른 청소부 · 분노의 귀';
(async()=>{
 if(!src){console.log(`\nR967 CPU: ${n-bad}/${n}`);process.exit(1);}
 let m=mk();ok(!m.err&&!!m.api,'모듈 로드('+(m.err&&m.err.message)+')');
 ok((m.ctx.soundProfiles.r967Hit_surgeon||[]).length===3&&(m.ctx.soundProfiles.r967Atk_syringe||[]).length===2&&(m.ctx.soundProfiles.r788BHit_satan||[]).length>=3,'소리 프로필(집도의·주사기 새 소리, 사탄은 R788 것)');
 // 피격
 let e={name:SURG,boss:true,hp:100,id:1};let r=m.ctx.hitEnemy(e,10);ok(r===true&&m.kinds().join()==='enemyHit,r967Hit_surgeon','집도의 피격: 엔진 적중음 + 집도의 피격음');
 m.ctx.hitEnemy(e,10);ok(m.kinds().filter(k=>k==='r967Hit_surgeon').length===1,'0.9초 안의 두 번째 피격은 생략');m.adv(950);m.ctx.hitEnemy(e,10);ok(m.kinds().filter(k=>k==='r967Hit_surgeon').length===2,'간격 뒤 다시 피격음');
 m=mk();e={name:WRATH,boss:true,hp:100,id:2};m.ctx.hitEnemy(e,10);ok(m.kinds().join()==='enemyHit,r788BHit_satan','분노의 귀 피격 → R788 사탄(불붙은 청소부) 피격음');
 m=mk();e={name:'중간보스 · '+SYR,midboss:true,hp:100,id:3};m.ctx.hitEnemy(e,10);ok(m.kinds().join()==='enemyHit,r967Hit_syringe','주사기 환영체(중간보스) 피격음');
 m=mk();m.ctx.hitEnemy({name:SURG,hp:100},10);m.ctx.hitEnemy({name:SYR,boss:true,hp:100},10);m.ctx.hitEnemy({name:WRATH+' 증원',hp:100},10);ok(m.kinds().every(k=>k==='enemyHit'),'보스·중간보스 표시가 안 맞으면 소리 없음');
 m=mk();m.ctx.hitEnemy({name:'발록',boss:true,hp:100},10);ok(!m.kinds().some(k=>/^r967/.test(k)),'다른 보스엔 R967 없음');
 // 사망
 m=mk();e={name:SURG,boss:true,hp:5,id:4};m.ctx.hitEnemy(e,10);ok(m.played.some(p=>p.kind==='r967Die_surgeon'&&p.allow===true)&&!m.kinds().includes('r967Hit_surgeon'),'처치 → 사망음(창 무시), 피격음 없음');
 m.ctx.killEnemy(e);ok(m.kinds().filter(k=>k==='r967Die_surgeon').length===1,'다시 처치 처리해도 한 번');
 m=mk();e={name:WRATH,boss:true,hp:5};m.ctx.hitEnemy(e,10);ok(m.kinds().includes('r788BDie_satan'),'분노의 귀 처치 → 사탄 사망음');
 // 공격 시작
 m=mk();e={name:SYR,midboss:true,hp:100,spawnState:'active'};m.ctx.room.enemies=[e];m.timers.forEach(f=>f());e.attack={id:'a'};m.timers.forEach(f=>f());ok(m.kinds().join()==='r967Atk_syringe','근접 공격 시작(attack.id) → 공격음');
 m.adv(300);e.storyAttackStart5=5;m.timers.forEach(f=>f());ok(m.kinds().length===1,'1.2초 안 공격은 한 번');m.adv(1300);e.storyAttackStart5=9;m.timers.forEach(f=>f());ok(m.kinds().length===2,'서사 패턴 공격(storyAttackStart5) → 공격음');
 m=mk();e={name:SURG,boss:true,hp:100};m.ctx.bossVolley(e);ok(m.kinds().join()==='r967Atk_surgeon','bossVolley → 집도의 공격음');
 m=mk();e={name:WRATH,boss:true,hp:100};m.ctx.bossVolley(e);ok(m.kinds().join()==='r788BAtk_satan','분노의 귀 bossVolley → 사탄 공격음');
 // 길 구간(R966 과 같은 기준)
 m=mk();m.ctx.room.engaged=false;m.ctx.window.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>({phase:'route'})};e={name:SYR,midboss:true,hp:100,spawnState:'active'};m.ctx.bossVolley(e);ok(m.kinds().join()==='r967Atk_syringe','길 구간(engaged=false, phase route, 나와 있음) → 공격음');
 m=mk();m.ctx.room.engaged=false;e={name:SURG,boss:true,hp:100,spawnState:'active'};m.ctx.bossVolley(e);ok(m.kinds().join()==='r967Atk_surgeon','R78 구간 없는 방(ep1a08)이라도 드러난 보스 → 공격음');
 m=mk();m.ctx.room.engaged=false;e={name:SURG,boss:true,hp:100,spawnState:'hidden'};m.ctx.bossVolley(e);m.ctx.room.enemies=[e];m.timers.forEach(f=>f());e.attack={id:1};m.timers.forEach(f=>f());ok(!m.played.length,'숨은 보스(hidden)·engaged=false → 공격음 없음');
 m=mk();m.ctx.modal={};m.ctx.bossVolley({name:SURG,boss:true,hp:100});ok(!m.played.length,'창이 떠 있으면 공격음 없음');
 // 미리 해독
 m=mk();m.ctx.room.enemies=[{name:SURG,boss:true,hp:100}];m.timers.forEach(f=>f());ok((m.ctx.__warm||[]).some(p=>/r967\/sfx\/hit-surgeon-1\.ogg$/.test(p)),'방에 들어오면 미리 해독');
 // 끄기·오류
 m=mk({pref:'0'});m.ctx.hitEnemy({name:SURG,boss:true,hp:100},5);ok(m.kinds().join()==='enemyHit'&&m.api.enabled()===false,'storyworld.r967.sfx=0 이면 원래대로');
 m=mk();m.ctx.hitEnemy(null,5);m.ctx.killEnemy({name:SURG,hp:1});m.timers.forEach(f=>f());ok(m.api.inspect().stats.errors===0,'이상한 입력에도 오류 0');
 ok(!/맘몬/.test(src.replace(/\/\*[\s\S]*?\*\//,'')),'맘몬은 다루지 않음');
 console.log(`\nR967 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
})();
