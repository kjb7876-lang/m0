'use strict';
// R955 — 사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 (영웅, 보스, 불면귀몹, 일반몹 순서)".
//  일반 몹 49 계열마다 ElevenLabs 로 만든 고유 피격·사망·공격 시작 소리(scripts/build-sfx-r955.py)를 엔진 소리 위에 얹는다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else if(!process.env.QUIET)console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/combat-sfx-r955.js'));
ok(src.length>0,'combat-sfx-r955.js 존재');
ok(rd(path.join(R,'runtime-text/combat-sfx-r955.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html'));
ok(html.indexOf('combat-sfx-r955.js')>html.indexOf('combat-sfx-r954.js')&&html.indexOf('combat-sfx-r954.js')>0,'R955 태그는 R954 뒤');
ok(/combat-sfx-r955/.test(rd(path.join(ROOT,'scripts/verify-r96-public.py'))),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r955/r955-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const D='assets/r955/sfx/';
const man=rd(path.join(R,'runtime-manifest.json'));let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const FAMS=Object.keys(idx.families||{}),F=idx.files||{},names=Object.keys(F);
ok(FAMS.length===49&&names.length===49*9-1&&/ElevenLabs/.test(idx.origin||''),'index.json 49 계열 × 9 − 1 = 440개·출처 기록('+FAMS.length+','+names.length+')');
const MAXLEN={Hit:.5,Die:1.35,Atk:.8},RISE={Hit:40,Die:260,Atk:160};let total=0;const byKind={},rms=[];
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 해시·크기·manifest');total+=f.bytes||0;(byKind[f.kind]=byKind[f.kind]||[]).push(k);
 const t=(f.kind.match(/^r955(Hit|Die|Atk)_/)||[])[1];
 ok(!!t&&f.duration<=MAXLEN[t]+.01&&f.duration>=.2,k+': 길이 .2초~'+(t&&MAXLEN[t])+'초('+f.duration+'s)');
 ok(f.lowShare150<=.10&&f.hfShare5k<=.02,k+': 150Hz 아래 10%·5kHz 위 2% 이하(스피커 터짐 방지)');
 ok(f.peakDb<=-6&&f.peakDb>=-16&&f.tailDb<=-30,k+': 피크 -6~-16dB·끝 닫힘('+f.peakDb+','+f.tailDb+')');
 ok(!!t&&f.riseMs<=RISE[t],k+': 올라오는 시간('+f.riseMs+'ms)');ok(f.gain<=.45,k+': 일반 몹 배율 .45 이하');rms.push(f.rmsDb);}
ok(rms.length>0&&Math.max(...rms)-Math.min(...rms)<=4,'RMS 정규화: 전체 편차 4dB 이하');
ok(total>0&&total<=4500000,'음원 합계 4.5MB 이하('+total+')');
for(const s of FAMS)for(const K of ['Hit','Die','Atk']){const w=(s==='bluewraith'&&K==='Hit')?2:3;ok((byKind['r955'+K+'_'+s]||[]).length===w,s+': '+K+' 변주 '+w+'개');}
ok(new Set(Object.values(F).map(f=>f.sourceSha256)).size>=250,'서로 다른 원본 250개 이상');
// 보스·중간보스·불면귀 구역 이름과 겹치지 않음
const fam=new Set(Object.values(idx.families||{}).flatMap(v=>v.names));
// R789 중간보스 이름 중 셋(의존 신호 포식자·코어 운반 집행자·환수검 모조체)은 다른 지역에선 일반 몹으로도 나온다 → 중간보스 표시(e.midboss)로 나눈다(아래 동작 검사).
for(const r of ['r788','r954']){const o=(rd(path.join(R,'client-source/combat-sfx-'+r+'.js')).match(/const BOSSES=\{[\s\S]*?\};/)||[''])[0];const bn=[...o.matchAll(/:'([^']+)'/g)].map(m=>m[1]);
 ok(bn.length>=6&&bn.every(x=>!fam.has(x)),r+' 이름은 R955 계열 표에 없음(중복 재생 없음)');}
// 동작: vm 으로 엔진 흉내
function mk(opt={}){const played=[],timers=[];let clock=opt.t0??1000;
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{},roles:{}}},localStorage:{getItem:k=>k==='storyworld.r955.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>clock},console,Math,Promise,
  setInterval:(f)=>{timers.push(f);return 1;},setTimeout:()=>1,soundProfiles:{enemyHit:[{path:'h.ogg'}],clear:[{path:'c.ogg'}]},setupAudio:()=>'base',audioUnlocked:true,audioBuffer:p=>{(ctx.__warm=ctx.__warm||[]).push(p);return Promise.resolve({});},
  started:true,modal:null,loading:false,player:{x:0,y:0,hp:10},room:{engaged:true,enemies:[]}};
 ctx.sound=function(kind,allow){played.push({kind,n:(ctx.soundProfiles[kind]||[]).length,allow});return Promise.resolve();};
 ctx.hitEnemy=function(e,v){if(!e||e.hp<=0||!(v>0))return false;e.hp-=v;ctx.sound('enemyHit');if(e.hp<=0)ctx.killEnemy(e);return true;};
 ctx.killEnemy=function(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;ctx.sound(e.boss?'clear':'r541Death');};
 ctx.bossVolley=function(e){return 'volley';};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,timers,err,api:ctx.window.__STORYWORLD_SFX_R955__,adv:ms=>{clock+=ms;},last:()=>played[played.length-1],kinds:()=>played.map(p=>p.kind)};}
let id=1;const E=(name,o={})=>({name,hp:100,x:1,y:0,id:id++,...o});
(async()=>{
 if(!src){console.log('FAIL 모듈 없음');console.log(`\nR955 CPU: ${n-bad}/${n}`);process.exit(1);}
 let m=mk();ok(!m.err&&!!m.api,'모듈 로드('+(m.err&&m.err.message)+')');
 ok(m.api.all.length===49&&FAMS.every(s=>m.api.all.includes(s)),'오버레이 계열 49개 = index.json 계열');
 for(const [s,v] of Object.entries(idx.families||{}))for(const nm of v.names)ok(m.api.slugOf(nm)===s,'이름 → '+s+': '+nm);
 const NAMES={'망각의 거미 3':'spider','중간보스 · 망각의 거미':'spider','백의 구속자 우두머리':'orderly','보라검 추격천사 증원':'fallenangel','숲 고블린 후속 증원':'goblin','피냄새 추적자 추격대':'ghoul',
  '시간수문장 01':'timegate1','시간수문장 02':'timegate3','시간수문장 03':'timegate2','시간수문장 48':'timegate2','상위수문장 49':'highgate','상위수문장 50':'highgate',
  '발록':null,'불면귀':null,'잠식된 어부 3':null,'귀비탕 공명 안개핵':null,'나태에 잠식된 남자':null,'':null};
 for(const [k,v] of Object.entries(NAMES))ok(m.api.slugOf(k)===v,'이름 → '+v+': '+k);
 ok(m.api.slugFor(E('망각의 거미',{boss:true}))===null&&m.api.slugFor(E('망각의 거미',{midboss:true}))===null&&m.api.slugFor(E('망각의 거미',{hero:true}))===null&&m.api.slugFor(E('망각의 거미'))==='spider','보스·중간보스·영웅 표시가 있으면 R955 소리 없음(R788·R789 몫)');
 ok(m.ctx.soundProfiles.r955Hit_spider.length===3&&m.ctx.soundProfiles.r955Atk_timegate3.length===3&&m.ctx.soundProfiles.r955Die_highgate.length===3,'소리 프로필 등록');
 ok(m.ctx.soundProfiles.r955Hit_spider[0].path==='assets/r955/sfx/hit-spider-1.ogg'&&m.ctx.soundProfiles.r955Hit_spider[0].gain<=.45,'경로·배율');
 let miss=0;for(const k of Object.keys(m.ctx.soundProfiles).filter(k=>/^r955/.test(k)))for(const r of m.ctx.soundProfiles[k])if(!fs.existsSync(path.join(R,'runtime-text',r.path)))miss++;ok(miss===0,'프로필 파일 모두 있음('+miss+' 없음)');
 ok(m.ctx.soundProfiles.r955Hit_bluewraith.length===2,'청람잔영 피격은 기준을 지킨 2개만');
 // 피격
 m=mk();let e=E('망각의 거미 1');m.ctx.room.enemies=[e];m.ctx.hitEnemy(e,5);ok(m.kinds().join()==='enemyHit,r955Hit_spider','피격: 엔진 적중음 + r955Hit_spider');
 m.adv(200);m.ctx.hitEnemy(e,5);ok(m.kinds().filter(k=>k==='r955Hit_spider').length===1,'계열마다 0.45초 간격');
 m.adv(300);m.ctx.hitEnemy(e,5);ok(m.kinds().filter(k=>k==='r955Hit_spider').length===2,'간격이 지나면 다시');
 m=mk();m.ctx.hitEnemy(E('망각의 거미'),5);m.ctx.hitEnemy(E('진흙등 거미'),5);ok(m.kinds().filter(k=>k==='r955Hit_spider').length===1,'같은 계열 여럿을 한꺼번에 때려도 한 번');
 m=mk();m.ctx.hitEnemy(E('망각의 거미'),5);m.ctx.hitEnemy(E('숲 고블린'),5);ok(m.kinds().filter(k=>/^r955Hit/.test(k)).length===1,'다른 계열도 0.12초 안엔 하나만(전체 간격)');
 m.adv(130);m.ctx.hitEnemy(E('숲 고블린'),5);ok(m.kinds().includes('r955Hit_goblin'),'전체 간격이 지나면 다른 계열 소리');
 // 사망
 m=mk();const xs=[1,2,3].map(i=>E('백의 구속자 '+i,{hp:1}));xs.forEach(x=>m.ctx.killEnemy(x));ok(m.kinds().filter(k=>k==='r955Die_orderly').length===1&&m.kinds().filter(k=>k==='r541Death').length===3,'한꺼번에 셋이 쓰러지면 R955 사망음 한 번(엔진 소리는 그대로)');
 ok(m.played.find(p=>p.kind==='r955Die_orderly').allow===true,'사망음은 보상 창이 떠도 울림(allowModal)');
 m.adv(350);const y=E('백의 구속자 4',{hp:1});m.ctx.killEnemy(y);ok(m.kinds().filter(k=>k==='r955Die_orderly').length===2,'간격이 지나면 다시 사망음');
 m.ctx.killEnemy(y);ok(m.kinds().filter(k=>k==='r955Die_orderly').length===2,'이미 죽은 몹 다시 처치 처리 → 소리 없음');
 m=mk();m.ctx.killEnemy(E('망각의 거미',{hp:1}));m.ctx.killEnemy(E('숲 고블린',{hp:1}));ok(m.kinds().includes('r955Die_spider')&&m.kinds().includes('r955Die_goblin'),'다른 계열 사망음은 각자');
 // 공격 시작
 m=mk();e=E('숲 고블린 1');m.ctx.room.enemies=[e];m.timers.forEach(f=>f());e.attack={id:9};m.timers.forEach(f=>f());ok(m.last()&&m.last().kind==='r955Atk_goblin','근접 공격 시작 → 공격음');
 const e2=E('피리 고블린');m.ctx.room.enemies.push(e2);m.timers.forEach(f=>f());e2.attack={id:1};m.timers.forEach(f=>f());ok(m.kinds().filter(k=>k==='r955Atk_goblin').length===1,'같은 계열 공격음 0.9초 간격');
 const e3=E('중립초원 늑대');m.ctx.room.enemies.push(e3);m.timers.forEach(f=>f());e3.attack={id:3};m.timers.forEach(f=>f());ok(!m.kinds().includes('r955Atk_wolf'),'다른 계열도 0.25초 안엔 하나만');
 m.adv(300);e3.attack={id:4};m.timers.forEach(f=>f());ok(m.kinds().includes('r955Atk_wolf'),'전체 간격이 지나면 다른 계열 공격음');
 m=mk();e=E('숲 고블린',{attack:{id:4}});m.ctx.room.enemies=[e];m.timers.forEach(f=>f());ok(!m.played.length,'방에 들어온 순간 이미 있던 공격은 기억만');
 m=mk();e=E('시간수문장 07');m.ctx.room.enemies=[e];m.timers.forEach(f=>f());e.storyAttackStart5=5000;m.timers.forEach(f=>f());ok(m.last()&&m.last().kind==='r955Atk_timegate1','서사 패턴 공격 시작(storyAttackStart5)에도 공격음');
 m=mk();e=E('수렁 주문사');m.ctx.room.enemies=[e];m.ctx.bossVolley(e);ok(m.last()&&m.last().kind==='r955Atk_cultmage','bossVolley(원거리 사격) → 공격음');
 m=mk();e=E('숲 고블린');m.ctx.room.enemies=[e];m.ctx.room.engaged=false;m.timers.forEach(f=>f());e.attack={id:1};m.timers.forEach(f=>f());ok(!m.played.length,'전투 전엔 공격음 없음');
 m=mk();e=E('숲 고블린');m.ctx.room.enemies=[e];m.ctx.modal={};m.timers.forEach(f=>f());e.attack={id:1};m.timers.forEach(f=>f());ok(!m.played.length,'창이 떠 있으면 공격음 없음');
 // 보스·중간보스·불면귀 구역은 그대로
 m=mk();m.ctx.hitEnemy(E('발록',{boss:true}),5);m.ctx.hitEnemy(E('망각의 거미',{midboss:true}),5);m.ctx.hitEnemy(E('잠식된 어부 3'),5);m.ctx.killEnemy(E('불면귀',{boss:true,hp:1}));ok(!m.kinds().some(k=>/^r955/.test(k)),'보스·중간보스·불면귀 구역 몹은 그대로');
 for(const nm of ['의존 신호 포식자','코어 운반 집행자','환수검 모조체']){m=mk();m.ctx.hitEnemy(E(nm,{midboss:true}),5);const a=m.kinds().some(k=>/^r955/.test(k));m.adv(1000);m.ctx.hitEnemy(E(nm),5);ok(!a&&m.kinds().some(k=>/^r955Hit_/.test(k)),nm+': 중간보스일 땐 R789 몫, 일반 몹일 땐 R955');}
 // 미리 해독
 m=mk();m.ctx.room.enemies=[E('망각의 거미 1'),E('숲 고블린')];m.timers.forEach(f=>f());const w=m.ctx.__warm||[];ok(w.some(p=>/hit-spider-1\.ogg$/.test(p))&&w.some(p=>/atk-goblin-3\.ogg$/.test(p))&&!w.some(p=>/wolf/.test(p)),'방에 있는 계열 파일만 미리 해독');
 const w0=w.length;m.timers.forEach(f=>f());ok((m.ctx.__warm||[]).length===w0,'같은 방에선 다시 해독 안 함');
 // 끄기
 m=mk({pref:'0'});m.ctx.hitEnemy(E('숲 고블린'),5);ok(m.kinds().join()==='enemyHit'&&m.api.enabled()===false,'storyworld.r955.sfx=0 이면 원래대로');
 m=mk();ok(Object.keys(m.ctx.window.__STORYWORLD_SFX_COMFORT__.aliases).every(k=>!/^r955/.test(k)),'새 종류는 별칭 없이 종류마다 자체 쿨다운');
 m=mk();m.ctx.hitEnemy(null,5);m.ctx.killEnemy({name:'숲 고블린',hp:1});m.timers.forEach(f=>f());ok(m.api.inspect().stats.errors===0,'이상한 입력에도 오류 0');
 console.log(`\nR955 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
})();
