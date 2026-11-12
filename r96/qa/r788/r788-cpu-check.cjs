'use strict';
// R788 — 사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 (영웅, 보스, 불면귀몹, 일반몹 순서)".
//  보스 26종(맘몬·불면귀 제외)마다 ElevenLabs 로 만든 고유 피격·사망·공격 시작 소리(scripts/build-sfx-r788.py)를
//  엔진의 기존 소리(적중음·처치 'clear')는 그대로 두고 그 위에 한 겹 얹는다(WC3 처럼 무기 타격 + 그 유닛의 소리).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/combat-sfx-r788.js'));
ok(src.length>0,'combat-sfx-r788.js 존재');
ok(rd(path.join(R,'runtime-text/combat-sfx-r788.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html'));
ok(/combat-sfx-r788\.js/.test(html),'index.html 스크립트 태그');
ok(html.indexOf('combat-sfx-r788.js')>html.indexOf('combat-sfx-r787.js')&&html.indexOf('combat-sfx-r787.js')>0,'R788 태그는 R787 뒤');
ok(/combat-sfx-r788/.test(rd(path.join(ROOT,'scripts/verify-r96-public.py'))),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r788/r788-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const BOSSES={root:'뿌리의 문지기',balrog:'발록',lucifer:'루시퍼',sloth:'나태에 잠식된 남자',leviathan:'레비아탄',beelzebub:'베엘제붑',seoyun:'붉은 하이힐의 서윤',satan:'사탄',
 chairman:'백색 정장의 호텔 그룹 회장',bootloader:'생체 부트로더',controller:'컨트롤러 · 기억의 문',goblin:'고블린 추장',knight:'타락천사 기사',gate01:'대수문장 01',gate02:'대수문장 02',
 gate04:'대수문장 04',gravekeeper:'망각 묘지기',gate06:'대수문장 06',arbelia:'아르벨리아를 묶은 변조 명령',siren:'세이렌 모르',nightmare:'EGO 강탈 악몽왕',bluelight:'파란불',
 choir:'네트워크 합창체',hanrian:'이단의목사 한리안',baekion:'이단의목사 백이온',cultleader:'교만의 사이보그 교주'};
const SLUGS=Object.keys(BOSSES),D='assets/r788/sfx/';
const man=rd(path.join(R,'runtime-manifest.json'));let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.length>=26*7&&/ElevenLabs/.test(idx.origin||''),'index.json 182개 이상·출처 기록('+names.length+')');
const MAXLEN={BHit:.5,BDie:1.35,BAtk:.8},RISE={BHit:40,BDie:260,BAtk:160};let total=0;const byKind={},rms=[];
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 해시·크기·manifest');total+=f.bytes||0;(byKind[f.kind]=byKind[f.kind]||[]).push(k);
 const t=(f.kind.match(/^r788(BHit|BDie|BAtk)_/)||[])[1];
 ok(!!t&&f.duration<=MAXLEN[t]+.01&&f.duration>=.2,k+': 길이 .2초~'+(t&&MAXLEN[t])+'초('+f.duration+'s)');
 ok(f.lowShare150<=.10&&f.hfShare5k<=.02,k+': 150Hz 아래 10%·5kHz 위 2% 이하(스피커 터짐 방지)');
 ok(f.peakDb<=-6&&f.peakDb>=-16&&f.tailDb<=-30,k+': 피크 -6~-16dB·끝 닫힘('+f.peakDb+','+f.tailDb+')');
 ok(!!t&&f.riseMs<=RISE[t],k+': 올라오는 시간('+f.riseMs+'ms)');rms.push(f.rmsDb);}
ok(rms.length>0&&Math.max(...rms)-Math.min(...rms)<=4,'RMS 정규화: 전체 편차 4dB 이하('+(rms.length?(Math.max(...rms)-Math.min(...rms)).toFixed(1):'-')+')');
ok(total>0&&total<=1600000,'음원 합계 1.6MB 이하('+total+')');
for(const s of SLUGS){ok((byKind['r788BHit_'+s]||[]).length>=3,BOSSES[s]+': 피격 변주 3개 이상');ok((byKind['r788BDie_'+s]||[]).length>=2,BOSSES[s]+': 사망 변주 2개 이상');ok((byKind['r788BAtk_'+s]||[]).length>=2,BOSSES[s]+': 공격 변주 2개 이상');}
ok(new Set(Object.values(F).map(f=>f.sourceSha256)).size>=100,'서로 다른 원본 100개 이상');
ok(!/맘몬|불면귀/.test(JSON.stringify(idx.bosses||{})),'맘몬(Codex)·불면귀(다음 묶음)는 이번 표에 없음');
// 동작: vm 으로 엔진 흉내
function mk(opt={}){const played=[],timers=[];let clock=opt.t0??1000;
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{},roles:{}}},localStorage:{getItem:k=>k==='storyworld.r788.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>clock},console,Math,Promise,
  setInterval:(f)=>{timers.push(f);return 1;},setTimeout:()=>1,soundProfiles:{enemyHit:[{path:'h.ogg'}],clear:[{path:'c.ogg'}]},setupAudio:()=>'base',audioUnlocked:true,audioBuffer:p=>{(ctx.__warm=ctx.__warm||[]).push(p);return Promise.resolve({});},
  started:true,modal:null,loading:false,player:{x:0,y:0,hp:10,hero:'hwando'},room:{engaged:true,enemies:[]}};
 ctx.sound=function(kind,allow){played.push({kind,n:(ctx.soundProfiles[kind]||[]).length,allow});return Promise.resolve();};
 ctx.hitEnemy=function(e,v){if(!e||e.hp<=0||!(v>0))return false;e.hp-=v;ctx.sound('enemyHit');if(e.hp<=0)ctx.killEnemy(e);return true;};
 ctx.killEnemy=function(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;if(e.boss)ctx.sound('clear');else ctx.sound('enemyHit');};
 ctx.bossVolley=function(e){e.beat=(e.beat||0)+1;return 'volley';};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,timers,err,api:ctx.window.__STORYWORLD_SFX_R788__,adv:ms=>{clock+=ms;},last:()=>played[played.length-1],kinds:()=>played.map(p=>p.kind)};}
const B=(slug,o={})=>({name:BOSSES[slug],boss:true,hp:100,x:1,y:0,id:1,...o});
(async()=>{
 if(!src){console.log('FAIL 모듈 없음 — 동작 검사 생략');console.log(`\nR788 CPU: ${n-bad}/${n}`);process.exit(1);}
 let m=mk();ok(!m.err&&!!m.api,'모듈 로드('+(m.err&&m.err.message)+')');
 for(const s of SLUGS){ok(m.api.slugOf(BOSSES[s])===s,'이름→슬러그: '+BOSSES[s]);
  ok((m.ctx.soundProfiles['r788BHit_'+s]||[]).length>=3&&(m.ctx.soundProfiles['r788BDie_'+s]||[]).length>=2&&(m.ctx.soundProfiles['r788BAtk_'+s]||[]).length>=2,s+': 소리 프로필 등록');}
 ok(m.api.slugOf('맘몬')===null&&m.api.slugOf('불면귀')===null&&m.api.slugOf('해골 병사')===null,'표에 없는 이름(맘몬·불면귀·일반 몹)은 null');
 ok(m.api.slugOf('  발록 ')==='balrog','앞뒤 공백 무시');
 // 피격: 엔진 적중음은 그대로 + 보스 소리 한 겹
 m=mk();let e=B('balrog');m.ctx.room.enemies=[e];let r=m.ctx.hitEnemy(e,10);
 ok(r===true&&m.kinds().join()==='enemyHit,r788BHit_balrog','보스 피격: 엔진 적중음 다음에 r788BHit_balrog('+m.kinds().join()+')');
 m.ctx.hitEnemy(e,10);ok(m.kinds().filter(k=>k==='r788BHit_balrog').length===1,'0.9초 안의 두 번째 피격은 보스 소리 생략(적중음만)');
 m.adv(950);m.ctx.hitEnemy(e,10);ok(m.kinds().filter(k=>k==='r788BHit_balrog').length===2,'간격이 지나면 다시 보스 피격음');
 m=mk();e={name:'해골 병사',hp:20,x:0,y:0};m.ctx.hitEnemy(e,5);ok(m.kinds().join()==='enemyHit','일반 몹 피격은 그대로');
 m=mk();e=B('lucifer',{boss:false});m.ctx.hitEnemy(e,5);ok(m.kinds().join()==='enemyHit','boss 표시가 없으면(같은 이름의 소환물 등) 그대로');
 m=mk();e=B('lucifer');m.ctx.hitEnemy(e,0);ok(m.played.length===0,'엔진이 거절한 타격(false)엔 소리 없음');
 // 사망: 'clear' 그대로 + 보스 사망음, 마지막 타격의 피격음은 내지 않음
 m=mk();e=B('knight',{hp:5});m.ctx.hitEnemy(e,10);
 ok(m.kinds().includes('clear')&&m.kinds().includes('r788BDie_knight')&&!m.kinds().includes('r788BHit_knight'),'보스 처치: clear 와 r788BDie_knight, 마지막 타격의 피격음은 없음('+m.kinds().join()+')');
 ok(m.played.find(p=>p.kind==='r788BDie_knight').allow===true,'사망음은 보상 창이 곧 떠도 울리게 allowModal');
 m.ctx.killEnemy(e);ok(m.kinds().filter(k=>k==='r788BDie_knight').length===1,'이미 죽은 보스를 다시 처치 처리해도 한 번만');
 m=mk();e={name:'해골 병사',hp:1};m.ctx.killEnemy(e);ok(!m.kinds().some(k=>/^r788/.test(k)),'일반 몹 처치는 그대로');
 // 공격: bossVolley·근접 공격 시작(e.attack.id 변화)
 m=mk();e=B('siren');m.ctx.room.enemies=[e];m.ctx.bossVolley(e);ok(m.last()&&m.last().kind==='r788BAtk_siren','bossVolley 에서 보스 공격음');
 m.ctx.bossVolley(e);ok(m.kinds().filter(k=>k==='r788BAtk_siren').length===1,'1.2초 안의 연속 패턴은 공격음 한 번');
 m=mk();e=B('goblin');m.ctx.room.enemies=[e];m.timers.forEach(f=>f());e.attack={id:7};m.timers.forEach(f=>f());ok(m.last()&&m.last().kind==='r788BAtk_goblin','근접 공격 시작(attack.id 바뀜)에서 공격음');
 m.adv(2000);m.timers.forEach(f=>f());ok(m.kinds().filter(k=>k==='r788BAtk_goblin').length===1,'같은 공격 id 는 다시 내지 않음');
 m=mk();e=B('goblin',{attack:{id:3}});m.ctx.room.enemies=[e];m.timers.forEach(f=>f());ok(!m.kinds().includes('r788BAtk_goblin'),'방에 들어온 순간 이미 있던 공격은 본 것으로만 기억');
 m=mk();e=B('goblin');m.ctx.room.enemies=[e];m.ctx.room.engaged=false;m.ctx.bossVolley(e);ok(!m.kinds().includes('r788BAtk_goblin'),'전투 시작 전(engaged=false)엔 공격음 없음');
 m=mk();e=B('goblin');m.ctx.room.enemies=[e];m.ctx.modal={};m.ctx.bossVolley(e);ok(!m.kinds().includes('r788BAtk_goblin'),'창이 떠 있으면 공격음 없음');
 m=mk();e=B('goblin',{hp:0});m.ctx.room.enemies=[e];m.ctx.bossVolley(e);ok(!m.kinds().includes('r788BAtk_goblin'),'죽은 보스는 공격음 없음');
 // 미리 해독
 m=mk();m.ctx.room.enemies=[B('choir')];m.timers.forEach(f=>f());ok((m.ctx.__warm||[]).some(p=>/hit-choir-1\.ogg$/.test(p))&&(m.ctx.__warm||[]).some(p=>/die-choir-1\.ogg$/.test(p)),'방에 보스가 있으면 그 보스 파일을 미리 해독');
 // 끄기
 m=mk({pref:'0'});e=B('balrog');m.ctx.hitEnemy(e,10);m.ctx.bossVolley(e);ok(m.kinds().join()==='enemyHit','storyworld.r788.sfx=0 이면 원래대로');
 ok(m.api&&m.api.enabled()===false,'끄기 상태가 API 에 보임');
 m=mk();ok(Object.keys(m.ctx.window.__STORYWORLD_SFX_COMFORT__.aliases).every(k=>!/^r788/.test(k)),'새 종류는 별칭 없이 종류마다 자체 쿨다운(엔진 적중음·처치음을 막지 않음)');
 console.log(`\nR788 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
})();
