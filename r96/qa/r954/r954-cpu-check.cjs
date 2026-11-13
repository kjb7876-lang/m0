'use strict';
// R954 — 사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 (영웅, 보스, 불면귀몹, 일반몹 순서)".
//  불면귀 구역(last302·last303) 6종마다 ElevenLabs 로 만든 고유 피격·사망·공격 시작 소리(scripts/build-sfx-r954.py)를 엔진 소리 위에 얹는다.
//  불면귀 스레드의 R762(보스 공격음)·R763(주민 신음·잠듦)과 겹치지 않는지도 본다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/combat-sfx-r954.js'));
ok(src.length>0,'combat-sfx-r954.js 존재');
ok(rd(path.join(R,'runtime-text/combat-sfx-r954.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html'));
ok(html.indexOf('combat-sfx-r954.js')>html.indexOf('combat-sfx-r789.js')&&html.indexOf('combat-sfx-r789.js')>0,'R954 태그는 R789 뒤');
ok(/combat-sfx-r954/.test(rd(path.join(ROOT,'scripts/verify-r96-public.py'))),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r954/r954-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(!/combat-sfx-r954|r954/.test(rd(path.join(R,'client-source/bulmyeongwi-r760.js'))),'불면귀 스레드 파일(bulmyeongwi-r760.js)은 건드리지 않음');
const BOSSES={bulmyeongwi:'불면귀',mistheart:'검은 안개 심장 · 불면의 기억',herbwoman:'잠식된 약방 아낙',fisherman:'잠식된 어부',maiden:'잠식된 소복 처녀',mistremnant:'불면귀의 안개 잔영'};
const SLUGS=Object.keys(BOSSES),D='assets/r954/sfx/';
const man=rd(path.join(R,'runtime-manifest.json'));let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.length===51&&/ElevenLabs/.test(idx.origin||''),'index.json 51개(6종 × 9 − 불면귀 공격 3)·출처 기록('+names.length+')');
const MAXLEN={Hit:.5,Die:1.35,Atk:.8},RISE={Hit:40,Die:260,Atk:160};let total=0;const byKind={},rms=[];
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 해시·크기·manifest');total+=f.bytes||0;(byKind[f.kind]=byKind[f.kind]||[]).push(k);
 const t=(f.kind.match(/^r954(Hit|Die|Atk)_/)||[])[1];
 ok(!!t&&f.duration<=MAXLEN[t]+.01&&f.duration>=.2,k+': 길이 .2초~'+(t&&MAXLEN[t])+'초('+f.duration+'s)');
 ok(f.lowShare150<=.10&&f.hfShare5k<=.02,k+': 150Hz 아래 10%·5kHz 위 2% 이하(스피커 터짐 방지)');
 ok(f.peakDb<=-6&&f.peakDb>=-16&&f.tailDb<=-30,k+': 피크 -6~-16dB·끝 닫힘('+f.peakDb+','+f.tailDb+')');
 ok(!!t&&f.riseMs<=RISE[t],k+': 올라오는 시간('+f.riseMs+'ms)');rms.push(f.rmsDb);}
ok(rms.length>0&&Math.max(...rms)-Math.min(...rms)<=4,'RMS 정규화: 전체 편차 4dB 이하');
ok(total>0&&total<=600000,'음원 합계 0.6MB 이하('+total+')');
for(const s of SLUGS){ok((byKind['r954Hit_'+s]||[]).length===3,BOSSES[s]+': 피격 변주 3개');ok((byKind['r954Die_'+s]||[]).length===3,BOSSES[s]+': 사망 변주 3개');
 ok(s==='bulmyeongwi'?!(byKind['r954Atk_'+s]||[]).length:(byKind['r954Atk_'+s]||[]).length===3,BOSSES[s]+(s==='bulmyeongwi'?': 공격음 없음(R762 몫)':': 공격 변주 3개'));}
ok(new Set(Object.values(F).map(f=>f.sourceSha256)).size>=45,'서로 다른 원본 45개 이상');
// 다른 R788·R789 표와 겹치지 않음
for(const r of ['r788','r789']){const o=(rd(path.join(R,'client-source/combat-sfx-'+r+'.js')).match(/const BOSSES=\{[\s\S]*?\};/)||[''])[0];ok(o.length>20&&!/'불면귀'|검은 안개 심장|잠식된 (약방|어부|소복)|안개 잔영/.test(o),r+' 표엔 불면귀 구역 이름 없음(중복 재생 없음)');}
// 동작: vm 으로 엔진 흉내 (+ R763 흉내: 피격 중 1.5초에 한 번 groans 증가)
function mk(opt={}){const played=[],timers=[];let clock=opt.t0??1000;const r763={groans:0,last:-1e9};
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{},roles:{}}},localStorage:{getItem:k=>k==='storyworld.r954.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>clock},console,Math,Promise,
  setInterval:(f)=>{timers.push(f);return 1;},setTimeout:()=>1,soundProfiles:{enemyHit:[{path:'h.ogg'}],clear:[{path:'c.ogg'}]},setupAudio:()=>'base',audioUnlocked:true,audioBuffer:p=>{(ctx.__warm=ctx.__warm||[]).push(p);return Promise.resolve({});},
  started:true,modal:null,loading:false,player:{x:0,y:0,hp:10},room:{engaged:true,enemies:[]}};
 if(opt.r763)ctx.window.__STORYWORLD_VILLAGERS_R763__={inspect:()=>({stats:{groans:r763.groans}})};
 ctx.sound=function(kind,allow){played.push({kind,n:(ctx.soundProfiles[kind]||[]).length,allow});return Promise.resolve();};
 ctx.hitEnemy=function(e,v){if(!e||e.hp<=0||!(v>0))return false;e.hp-=v;if(opt.r763&&/잠식된/.test(e.name)&&clock-r763.last>=1500){r763.last=clock;r763.groans++;ctx.sound('r761VillagerGroan');}else ctx.sound('enemyHit');if(e.hp<=0)ctx.killEnemy(e);return true;};
 ctx.killEnemy=function(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;ctx.sound(e.boss?'clear':'r541Death');};
 ctx.bossVolley=function(e){return 'volley';};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,timers,err,api:ctx.window.__STORYWORLD_SFX_R954__,adv:ms=>{clock+=ms;},last:()=>played[played.length-1],kinds:()=>played.map(p=>p.kind)};}
let id=1;const E=(name,o={})=>({name,hp:100,x:1,y:0,id:id++,...o});
(async()=>{
 if(!src){console.log('FAIL 모듈 없음');console.log(`\nR954 CPU: ${n-bad}/${n}`);process.exit(1);}
 let m=mk();ok(!m.err&&!!m.api,'모듈 로드('+(m.err&&m.err.message)+')');
 const NAMES={'불면귀':'bulmyeongwi','검은 안개 심장 · 불면의 기억':'mistheart','잠식된 약방 아낙':'herbwoman','잠식된 약방 아낙 1':'herbwoman','잠식된 약방 아낙 우두머리':'herbwoman','잠식된 약방 아낙 증원':'herbwoman',
  '잠식된 약방 아낙 후속 증원':'herbwoman','중간보스 · 잠식된 약방 아낙':'herbwoman','잠식된 어부 3':'fisherman','잠식된 어부 추격대':'fisherman','중간보스 · 잠식된 어부 3':'fisherman','잠식된 소복 처녀 우두머리':'maiden',
  '잠식된 소복 처녀 1':'maiden','불면귀의 안개 잔영 1':'mistremnant','해골 병사':null,'발록':null,'보라검천사':null};
 for(const [k,v] of Object.entries(NAMES))ok(m.api.slugOf(k)===v,'이름 → '+v+': '+k);
 ok(m.api.slugFor(E('불면귀',{boss:true}))==='bulmyeongwi'&&m.api.slugFor(E('불면귀'))===null,'불면귀 소리는 보스 표시가 있는 불면귀에게만');
 ok(m.ctx.soundProfiles.r954Hit_herbwoman.length===3&&!m.ctx.soundProfiles.r954Atk_bulmyeongwi&&m.ctx.soundProfiles.r954Atk_mistheart.length===3,'소리 프로필 등록(불면귀 공격은 없음)');
 ok(m.ctx.soundProfiles.r954Hit_herbwoman[0].gain<m.ctx.soundProfiles.r954Hit_mistheart[0].gain,'일반 몹 소리는 보스급보다 작게');
 // 보스: 피격·사망, 공격은 R762 몫
 m=mk();let e=E('불면귀',{boss:true});m.ctx.room.enemies=[e];m.ctx.hitEnemy(e,5);ok(m.kinds().join()==='enemyHit,r954Hit_bulmyeongwi','불면귀 피격: 엔진 적중음 + r954Hit_bulmyeongwi');
 m.ctx.bossVolley(e);m.timers.forEach(f=>f());e.attack={id:2};m.timers.forEach(f=>f());ok(!m.kinds().some(k=>/^r954Atk/.test(k)),'불면귀 공격엔 R954 소리 없음(R762 가 냄)');
 e.hp=1;m.ctx.hitEnemy(e,5);ok(m.kinds().includes('r954Die_bulmyeongwi')&&m.played.find(p=>p.kind==='r954Die_bulmyeongwi').allow===true,'불면귀 처치 → r954Die_bulmyeongwi(allowModal)');
 // 중간보스
 m=mk();e=E('검은 안개 심장 · 불면의 기억',{midboss:true});m.ctx.room.enemies=[e];m.ctx.bossVolley(e);ok(m.last().kind==='r954Atk_mistheart','안개 심장 bossVolley → 공격음');
 m.ctx.hitEnemy(e,5);m.ctx.hitEnemy(e,5);ok(m.kinds().filter(k=>k==='r954Hit_mistheart').length===1,'보스급 피격 0.9초 간격');
 // 주민: R763 신음이 난 타격엔 양보
 m=mk({r763:true});e=E('잠식된 어부 3');m.ctx.room.enemies=[e];m.ctx.hitEnemy(e,5);ok(m.kinds().join()==='r761VillagerGroan'&&m.api.inspect().stats.hitYield===1,'R763 신음이 난 타격엔 R954 피격음 없음('+m.kinds().join()+')');
 m.adv(500);m.ctx.hitEnemy(e,5);ok(m.kinds().includes('r954Hit_fisherman'),'신음 사이 타격엔 어부 피격음');
 m.adv(100);m.ctx.hitEnemy(e,5);ok(m.kinds().filter(k=>k==='r954Hit_fisherman').length===1,'몹 종류마다 0.45초 간격');
 m=mk();const a=E('잠식된 약방 아낙 1'),b=E('잠식된 약방 아낙 우두머리');m.ctx.hitEnemy(a,5);m.ctx.hitEnemy(b,5);ok(m.kinds().filter(k=>k==='r954Hit_herbwoman').length===1,'같은 종류 여럿을 한꺼번에 때려도 피격음은 한 번');
 m=mk();m.ctx.hitEnemy(E('잠식된 약방 아낙'),5);m.ctx.hitEnemy(E('잠식된 소복 처녀'),5);ok(m.kinds().includes('r954Hit_herbwoman')&&m.kinds().includes('r954Hit_maiden'),'다른 종류는 각자 소리');
 // 사망: 몹 종류마다 0.3초
 m=mk({r763:true});const xs=[1,2,3].map(i=>E('잠식된 소복 처녀 '+i,{hp:1}));xs.forEach(x=>m.ctx.killEnemy(x));ok(m.kinds().filter(k=>k==='r954Die_maiden').length===1&&m.kinds().filter(k=>k==='r541Death').length===3,'한꺼번에 셋이 쓰러지면 R954 사망음 한 번(엔진·R763 소리는 그대로)');
 m.adv(350);const y=E('잠식된 소복 처녀 4',{hp:1});m.ctx.killEnemy(y);ok(m.kinds().filter(k=>k==='r954Die_maiden').length===2,'간격이 지나면 다시 사망음');
 m.ctx.killEnemy(y);ok(m.kinds().filter(k=>k==='r954Die_maiden').length===2,'이미 죽은 몹 다시 처치 처리 → 소리 없음');
 // 공격 시작
 m=mk();e=E('불면귀의 안개 잔영 1');m.ctx.room.enemies=[e];m.timers.forEach(f=>f());e.attack={id:9};m.timers.forEach(f=>f());ok(m.last()&&m.last().kind==='r954Atk_mistremnant','몹 근접 공격 시작 → 공격음');
 const e2=E('불면귀의 안개 잔영 2');m.ctx.room.enemies.push(e2);m.timers.forEach(f=>f());e2.attack={id:1};m.timers.forEach(f=>f());ok(m.kinds().filter(k=>k==='r954Atk_mistremnant').length===1,'같은 종류 공격음 0.9초 간격');
 m=mk();e=E('잠식된 어부',{attack:{id:4}});m.ctx.room.enemies=[e];m.timers.forEach(f=>f());ok(!m.played.length,'방에 들어온 순간 이미 있던 공격은 기억만');
 // 서사 패턴 공격(setAttackPose5: attack.id 없음·bossVolley 없음)도 공격 시작으로 본다(R964 와 같게)
 m=mk();e=E('검은 안개 심장 · 불면의 기억',{midboss:true});m.ctx.room.enemies=[e];m.timers.forEach(f=>f());e.attack={kind:'story'};e.storyAttackStart5=5000;m.timers.forEach(f=>f());ok(m.last()&&m.last().kind==='r954Atk_mistheart','서사 패턴 공격 시작(storyAttackStart5)에 중간보스 공격음');
 m.adv(1300);m.timers.forEach(f=>f());ok(m.kinds().filter(k=>k==='r954Atk_mistheart').length===1,'같은 패턴이 이어지는 동안엔 다시 안 남');
 m.adv(10);e.storyAttackStart5=6300;m.timers.forEach(f=>f());ok(m.kinds().filter(k=>k==='r954Atk_mistheart').length===2,'다음 패턴 시작에 다시 남');
 m=mk();e=E('잠식된 어부');m.ctx.room.enemies=[e];m.ctx.room.engaged=false;m.timers.forEach(f=>f());e.attack={id:1};m.timers.forEach(f=>f());ok(!m.played.length,'전투 전엔 공격음 없음');
 m=mk();e=E('잠식된 어부');m.ctx.room.enemies=[e];m.ctx.modal={};m.timers.forEach(f=>f());e.attack={id:1};m.timers.forEach(f=>f());ok(!m.played.length,'창이 떠 있으면 공격음 없음');
 // 일반 몹·다른 보스는 그대로
 m=mk();m.ctx.hitEnemy(E('해골 병사'),5);m.ctx.killEnemy(E('해골 병사',{hp:1}));ok(!m.kinds().some(k=>/^r954/.test(k)),'다른 지역 몹은 그대로');
 // 미리 해독
 m=mk();m.ctx.room.enemies=[E('잠식된 약방 아낙 1')];m.timers.forEach(f=>f());ok((m.ctx.__warm||[]).some(p=>/hit-herbwoman-1\.ogg$/.test(p)),'방에 있는 종류의 파일을 미리 해독');
 // 끄기
 m=mk({pref:'0'});m.ctx.hitEnemy(E('잠식된 어부'),5);ok(m.kinds().join()==='enemyHit'&&m.api.enabled()===false,'storyworld.r954.sfx=0 이면 원래대로');
 m=mk();ok(Object.keys(m.ctx.window.__STORYWORLD_SFX_COMFORT__.aliases).every(k=>!/^r954/.test(k)),'새 종류는 별칭 없이 종류마다 자체 쿨다운');
 console.log(`\nR954 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
})();
