'use strict';
// R789 — 사용자 2026-11-12 "모든 몹+중간보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 (영웅, 중간보스, 불면귀몹, 일반몹 순서)".
//  중간보스 38종(맘몬 맵·불면귀 제외)마다 ElevenLabs 로 만든 고유 피격·사망·공격 시작 소리(scripts/build-sfx-r789.py)를
//  엔진의 기존 소리(적중음·처치 'clear')는 그대로 두고 그 위에 한 겹 얹는다(WC3 처럼 무기 타격 + 그 유닛의 소리).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/combat-sfx-r789.js'));
ok(src.length>0,'combat-sfx-r789.js 존재');
ok(rd(path.join(R,'runtime-text/combat-sfx-r789.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html'));
ok(/combat-sfx-r789\.js/.test(html),'index.html 스크립트 태그');
ok(html.indexOf('combat-sfx-r789.js')>html.indexOf('combat-sfx-r788.js')&&html.indexOf('combat-sfx-r788.js')>0,'R789 태그는 R788 뒤');
ok(/combat-sfx-r789/.test(rd(path.join(ROOT,'scripts/verify-r96-public.py'))),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r789/r789-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const BOSSES={spiderangel:'보라검천사',swamphorn:'늪의 뿔악마 군주',bloodpursuer:'핏빛 수호로 추격자',comradeecho:'첫 동료의 악마잔영',messenger:'숨이 끊긴 전령의 그림자',blackpillar:'소환진 검은기둥',stabilizer:'백의 안정화 감독',
 prideruin:'오만의 폐허핵',smilemask:'초천사의 웃는 가면',gate72echo:'교만의 잔향 · 제72문',slothshell:'나태의 껍데기 파수',crackmirror:'금이 간 비교잔영',kitchenboss:'폐기주방 감독',stagedirector:'심장빛 무대감독',thornwarden:'겨울숲 가시파수',
 flameknight:'호텔 화염기사',corpseguard:'역십자가 시체경호체',bootcore:'생체부트로더 연산핵',warmanager:'제4단계 전쟁관리자',mercypriest:'제8단계 자비 교정관',censor:'제12단계 기억 검열기',reverser:'제14단계 역전 관리자',
 voidcore:'제17단계 중앙이주 코어',memoryframe:'기억의 문 수호 프레임',firstcommand:'최초명령 코어 오염체',restharvest:'휴식 수확관 · 과로의 수문장',gate05:'대수문장 05',signaleater:'의존 신호 포식자',coreenforcer:'코어 운반 집행자',
 phantomblade:'환수검 모조체',rainwitness:'파란불 역주행 목격자',hotelclerk:'공실장부 당직감사',silentalarm:'진술 봉쇄 인과핵',rooftopecho:'옥상 인과보관인',chipfirewall:'칩 제단 방화벽',idmanager:'ID 생체조 관리자',judgecore:'기계재판 집행핵',
 antichristcradle:'적그리스도 배양좌'};
const SLUGS=Object.keys(BOSSES),D='assets/r789/sfx/';
const man=rd(path.join(R,'runtime-manifest.json'));let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.length>=38*7&&/ElevenLabs/.test(idx.origin||''),'index.json 266개 이상·출처 기록('+names.length+')');
const MAXLEN={MHit:.5,MDie:1.35,MAtk:.8},RISE={MHit:40,MDie:260,MAtk:160};let total=0;const byKind={},rms=[];
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 해시·크기·manifest');total+=f.bytes||0;(byKind[f.kind]=byKind[f.kind]||[]).push(k);
 const t=(f.kind.match(/^r789(MHit|MDie|MAtk)_/)||[])[1];
 ok(!!t&&f.duration<=MAXLEN[t]+.01&&f.duration>=.2,k+': 길이 .2초~'+(t&&MAXLEN[t])+'초('+f.duration+'s)');
 ok(f.lowShare150<=.10&&f.hfShare5k<=.02,k+': 150Hz 아래 10%·5kHz 위 2% 이하(스피커 터짐 방지)');
 ok(f.peakDb<=-6&&f.peakDb>=-16&&f.tailDb<=-30,k+': 피크 -6~-16dB·끝 닫힘('+f.peakDb+','+f.tailDb+')');
 ok(!!t&&f.riseMs<=RISE[t],k+': 올라오는 시간('+f.riseMs+'ms)');rms.push(f.rmsDb);}
ok(rms.length>0&&Math.max(...rms)-Math.min(...rms)<=4,'RMS 정규화: 전체 편차 4dB 이하('+(rms.length?(Math.max(...rms)-Math.min(...rms)).toFixed(1):'-')+')');
ok(total>0&&total<=2400000,'음원 합계 2.4MB 이하('+total+')');
for(const s of SLUGS){ok((byKind['r789MHit_'+s]||[]).length>=3,BOSSES[s]+': 피격 변주 3개 이상');ok((byKind['r789MDie_'+s]||[]).length>=2,BOSSES[s]+': 사망 변주 2개 이상');ok((byKind['r789MAtk_'+s]||[]).length>=2,BOSSES[s]+': 공격 변주 2개 이상');}
ok(new Set(Object.values(F).map(f=>f.sourceSha256)).size>=150,'서로 다른 원본 150개 이상');
ok(!/맘몬|불면귀|금고 장부감시자|검은 안개 심장/.test(JSON.stringify(idx.bosses||{})),'맘몬 맵(Codex)·불면귀(다음 묶음) 중간보스는 이번 표에 없음');
// 동작: vm 으로 엔진 흉내
function mk(opt={}){const played=[],timers=[];let clock=opt.t0??1000;
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{},roles:{}}},localStorage:{getItem:k=>k==='storyworld.r789.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>clock},console,Math,Promise,
  setInterval:(f)=>{timers.push(f);return 1;},setTimeout:()=>1,soundProfiles:{enemyHit:[{path:'h.ogg'}],clear:[{path:'c.ogg'}]},setupAudio:()=>'base',audioUnlocked:true,audioBuffer:p=>{(ctx.__warm=ctx.__warm||[]).push(p);return Promise.resolve({});},
  started:true,modal:null,loading:false,player:{x:0,y:0,hp:10,hero:'hwando'},room:{engaged:true,enemies:[]}};
 ctx.sound=function(kind,allow){played.push({kind,n:(ctx.soundProfiles[kind]||[]).length,allow});return Promise.resolve();};
 ctx.hitEnemy=function(e,v){if(!e||e.hp<=0||!(v>0))return false;e.hp-=v;ctx.sound('enemyHit');if(e.hp<=0)ctx.killEnemy(e);return true;};
 ctx.killEnemy=function(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;if(e.boss)ctx.sound('clear');else ctx.sound('enemyHit');};
 ctx.bossVolley=function(e){e.beat=(e.beat||0)+1;return 'volley';};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,timers,err,api:ctx.window.__STORYWORLD_SFX_R789__,adv:ms=>{clock+=ms;},last:()=>played[played.length-1],kinds:()=>played.map(p=>p.kind)};}
const B=(slug,o={})=>({name:BOSSES[slug],midboss:true,hp:100,x:1,y:0,id:1,...o});
(async()=>{
 if(!src){console.log('FAIL 모듈 없음 — 동작 검사 생략');console.log(`\nR789 CPU: ${n-bad}/${n}`);process.exit(1);}
 let m=mk();ok(!m.err&&!!m.api,'모듈 로드('+(m.err&&m.err.message)+')');
 for(const s of SLUGS){ok(m.api.slugOf(BOSSES[s])===s,'이름→슬러그: '+BOSSES[s]);
  ok((m.ctx.soundProfiles['r789MHit_'+s]||[]).length>=3&&(m.ctx.soundProfiles['r789MDie_'+s]||[]).length>=2&&(m.ctx.soundProfiles['r789MAtk_'+s]||[]).length>=2,s+': 소리 프로필 등록');}
 ok(m.api.slugOf('금고 장부감시자')===null&&m.api.slugOf('검은 안개 심장 · 불면의 기억')===null&&m.api.slugOf('해골 병사')===null&&m.api.slugOf('발록')===null,'표에 없는 이름(맘몬 맵·불면귀·일반 몹·중간보스)은 null');
 ok(m.api.slugOf('  늪의 뿔악마 군주 ')==='swamphorn','앞뒤 공백 무시');
 // 피격: 엔진 적중음은 그대로 + 중간보스 소리 한 겹
 m=mk();let e=B('swamphorn');m.ctx.room.enemies=[e];let r=m.ctx.hitEnemy(e,10);
 ok(r===true&&m.kinds().join()==='enemyHit,r789MHit_swamphorn','중간보스 피격: 엔진 적중음 다음에 r789MHit_swamphorn('+m.kinds().join()+')');
 m.ctx.hitEnemy(e,10);ok(m.kinds().filter(k=>k==='r789MHit_swamphorn').length===1,'0.9초 안의 두 번째 피격은 중간보스 소리 생략(적중음만)');
 m.adv(950);m.ctx.hitEnemy(e,10);ok(m.kinds().filter(k=>k==='r789MHit_swamphorn').length===2,'간격이 지나면 다시 중간보스 피격음');
 m=mk();e={name:'해골 병사',hp:20,x:0,y:0};m.ctx.hitEnemy(e,5);ok(m.kinds().join()==='enemyHit','일반 몹 피격은 그대로');
 m=mk();e=B('flameknight',{midboss:false});m.ctx.hitEnemy(e,5);ok(m.kinds().join()==='enemyHit','midboss 표시가 없으면(같은 이름의 소환물 등) 그대로');
 m=mk();e=B('flameknight');m.ctx.hitEnemy(e,0);ok(m.played.length===0,'엔진이 거절한 타격(false)엔 소리 없음');
 // 사망: 'clear' 그대로 + 중간보스 사망음, 마지막 타격의 피격음은 내지 않음
 m=mk();e=B('corpseguard',{hp:5});m.ctx.hitEnemy(e,10);
 ok(m.kinds().includes('enemyHit')&&m.kinds().includes('r789MDie_corpseguard')&&!m.kinds().includes('r789MHit_corpseguard'),'중간보스 처치: 엔진 처치음과 r789MDie_knight, 마지막 타격의 피격음은 없음('+m.kinds().join()+')');
 ok(m.played.find(p=>p.kind==='r789MDie_corpseguard').allow===true,'사망음은 보상 창이 곧 떠도 울리게 allowModal');
 m.ctx.killEnemy(e);ok(m.kinds().filter(k=>k==='r789MDie_corpseguard').length===1,'이미 죽은 중간보스를 다시 처치 처리해도 한 번만');
 m=mk();e={name:'해골 병사',hp:1};m.ctx.killEnemy(e);ok(!m.kinds().some(k=>/^r789/.test(k)),'일반 몹 처치는 그대로');
 // 공격: bossVolley·근접 공격 시작(e.attack.id 변화)
 m=mk();e=B('rainwitness');m.ctx.room.enemies=[e];m.ctx.bossVolley(e);ok(m.last()&&m.last().kind==='r789MAtk_rainwitness','bossVolley 에서 중간보스 공격음');
 m.ctx.bossVolley(e);ok(m.kinds().filter(k=>k==='r789MAtk_rainwitness').length===1,'1.2초 안의 연속 패턴은 공격음 한 번');
 m=mk();e=B('kitchenboss');m.ctx.room.enemies=[e];m.timers.forEach(f=>f());e.attack={id:7};m.timers.forEach(f=>f());ok(m.last()&&m.last().kind==='r789MAtk_kitchenboss','근접 공격 시작(attack.id 바뀜)에서 공격음');
 m.adv(2000);m.timers.forEach(f=>f());ok(m.kinds().filter(k=>k==='r789MAtk_kitchenboss').length===1,'같은 공격 id 는 다시 내지 않음');
 m=mk();e=B('kitchenboss',{attack:{id:3}});m.ctx.room.enemies=[e];m.timers.forEach(f=>f());ok(!m.kinds().includes('r789MAtk_kitchenboss'),'방에 들어온 순간 이미 있던 공격은 본 것으로만 기억');
 m=mk();e=B('kitchenboss');m.ctx.room.enemies=[e];m.ctx.room.engaged=false;m.ctx.bossVolley(e);ok(!m.kinds().includes('r789MAtk_kitchenboss'),'전투 시작 전(engaged=false)엔 공격음 없음');
 m=mk();e=B('kitchenboss');m.ctx.room.enemies=[e];m.ctx.modal={};m.ctx.bossVolley(e);ok(!m.kinds().includes('r789MAtk_kitchenboss'),'창이 떠 있으면 공격음 없음');
 m=mk();e=B('kitchenboss',{hp:0});m.ctx.room.enemies=[e];m.ctx.bossVolley(e);ok(!m.kinds().includes('r789MAtk_kitchenboss'),'죽은 중간보스는 공격음 없음');
 // 미리 해독
 m=mk();m.ctx.room.enemies=[B('censor')];m.timers.forEach(f=>f());ok((m.ctx.__warm||[]).some(p=>/hit-censor-1\.ogg$/.test(p))&&(m.ctx.__warm||[]).some(p=>/die-censor-1\.ogg$/.test(p)),'방에 중간보스가 있으면 그 중간보스 파일을 미리 해독');
 // 끄기
 m=mk({pref:'0'});e=B('swamphorn');m.ctx.hitEnemy(e,10);m.ctx.bossVolley(e);ok(m.kinds().join()==='enemyHit','storyworld.r789.sfx=0 이면 원래대로');
 ok(m.api&&m.api.enabled()===false,'끄기 상태가 API 에 보임');
 m=mk();e=B('swamphorn',{boss:true});m.ctx.hitEnemy(e,10);m.ctx.bossVolley(e);ok(!m.kinds().some(k=>/^r789/.test(k)),'보스(e.boss) 표시가 같이 있으면 R788 몫이라 R789 는 소리 없음');
 m=mk();ok(Object.keys(m.ctx.window.__STORYWORLD_SFX_COMFORT__.aliases).every(k=>!/^r789/.test(k)),'새 종류는 별칭 없이 종류마다 자체 쿨다운(엔진 적중음·처치음을 막지 않음)');
 console.log(`\nR789 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
})();
