'use strict';
// R544 — 사용자 2026-11-10 "적 죽음과 피격시 효과음(적종-테마를 정해서) 아군 피격시 효과음(영웅별 다르게)" + "기본적으로 있으면 좋을 효과음 생성 적용".
//  ElevenLabs 로 만든 소리를 다듬어(scripts/build-sfx-r544.py) 적 테마 6개의 피격·죽음, 영웅 8명의 피격, 버튼에 쓴다.
//  엔진의 피격음 간격(7번에 1번·1.15초)·역할 음량, R541 소멸음의 0.6초 간격·보스 제외는 그대로 두고, 그 한 번의 sound() 동안만 프로필을 바꿔 끼운다.
// R546 에서 요구가 바뀜(사용자 2026-11-10 14:10Z "효과음 필요할만한건 모두 다 만들어서 적용"): 영웅 평타·강화 소리를 새 소리로 바꾼다. 이 검사는 그 이전 층만 보도록 R546 을 끈 상태(storyworld.r546.sfx='0')로 돌리고, 바뀐 동작은 qa/r546 이 검사한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/sfx-r541.js'));
ok(rd(path.join(R,'runtime-text/sfx-r541.js'))===src&&src.length>0,'sfx-r541.js runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r544/r544-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const THEMES=['body','machine','beast','slime','glass','spirit'],HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const WANT=[...THEMES.map(t=>'hit-'+t),...THEMES.map(t=>'death-'+t),...HEROES.map(h=>'hurt-'+h),'click-1'];
const man=rd(path.join(R,'runtime-manifest.json')),SFX=path.join(R,'runtime-text/assets/r544/sfx');let idx={files:{}};try{idx=JSON.parse(rd(path.join(SFX,'index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.join()===WANT.join(),'index.json 에 21개(피격 6·죽음 6·영웅 8·버튼): '+names.length);
ok(/ElevenLabs/.test(idx.origin||''),'출처(ElevenLabs 생성) 기록');
const ff=(()=>{try{cp.execFileSync('ffmpeg',['-version'],{stdio:'ignore'});return true;}catch(_){return false;}})();let total=0;
for(const k of names){const f=F[k],p=path.join(R,'runtime-text',f.path);let b=null;try{b=fs.readFileSync(p);}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256,k+': 파일 = index.json 해시·크기');ok(man.includes(f.path),k+': runtime-manifest 에 등록');total+=f.bytes;
 ok(/^[0-9a-f]{64}$/.test(f.sourceSha256||'')&&!!f.source&&!!f.prompt&&Array.isArray(f.trim)&&f.rate>0&&!!f.use,k+': 원본·해시·생성 문구·구간·재생 속도·쓰임 기록');
 const maxDur=/^hit-/.test(k)?.5:/^hurt-/.test(k)?.5:/^click/.test(k)?.15:1.0;
 ok(f.bytes<=12000&&f.duration>=.08&&f.duration<=maxDur,k+': 12KB·'+maxDur+'초 이하('+f.bytes+', '+f.duration+')');ok(f.peakDb<=-8,k+': 피크 -8dB 이하('+f.peakDb+')');
 ok(f.hfShare5k<=.02,k+': 5kHz 위 2% 이하('+f.hfShare5k+')');ok(f.lowShare120<=.25&&f.midShare>=.5,k+': 작은 스피커로도 들리는 대역(120Hz 아래 '+f.lowShare120+', 가운데 '+f.midShare+')');
 ok(f.tailDb<=-30,k+': 끝이 잦아듦('+f.tailDb+')');
 // R545 에서 요구가 바뀌어 이 검사를 고침(사용자 2026-11-10 14:14Z "스피커터지는 소리가 반복적으로 들려서 거슬려"): 전에는 피격·아군 피격 배율을 .7~.8 로 요구했으나, 이제 피격 .55·아군 피격 .6·죽음 .45 이하로 낮춘다(하한 .35 — 들리긴 해야 함).
 const maxGain=/^hit-/.test(k)?.55:/^hurt-/.test(k)?.6:.5;ok(f.gain>=.35&&f.gain<=maxGain,k+': 게임 내 배율 '+maxGain+' 이하('+f.gain+')');
 if(ff&&b){const raw=cp.execFileSync('ffmpeg',['-v','quiet','-i',p,'-f','f32le','-ac','1','-ar','44100','-'],{maxBuffer:1<<26}),x=new Float32Array(raw.buffer,raw.byteOffset,raw.length>>2);
  let pk=0,clip=0;for(const v of x){pk=Math.max(pk,Math.abs(v));if(Math.abs(v)>.98)clip++;}const head=Math.max(...Array.from(x.slice(0,22),Math.abs));
  ok(Math.abs(x.length/44100-f.duration)<.02&&20*Math.log10(pk)<=-8&&clip===0&&head<pk*.3,k+': 실측 길이·피크·깨짐 0·시작 딸깍 없음');}}
if(!ff)console.log('note ffmpeg 없음 — 실측 항목은 index.json 수치·해시 대조로 대신함');
ok(total>0&&total<=180000,'음원 합계 180KB 이하('+total+')');
ok(new Set(names.map(k=>F[k].sha256)).size===names.length&&new Set(HEROES.map(h=>F['hurt-'+h]?.source)).size===8&&new Set(THEMES.map(t=>F['death-'+t]?.source)).size===6&&new Set(THEMES.map(t=>F['hit-'+t]?.source)).size===6,'영웅 8명·테마 6개가 저마다 다른 생성본');
// ── 동작(vm): 엔진 sound 를 흉내 — 호출 첫머리에 soundProfiles[kind] 를 읽는다.
function mk(opt={}){const played=[];let now=100000;const listeners={};
 const ctx={window:{},localStorage:{getItem:k=>k==='storyworld.r541.sfx'?(opt.pref??null):k==='storyworld.r544.sfx'?(opt.pref4??null):k==='storyworld.r546.sfx'?'0':null,setItem(){}},performance:{now:()=>now},setInterval:()=>0,console,Math,
  document:{addEventListener:(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);}},
  soundProfiles:{attack:[{path:'a.ogg'}],boss:[{path:'b.ogg'}],enemyHit:[{path:'engine-hit.ogg'}],hurt:[{path:'engine-hurt.ogg'}],upgrade:[{path:'engine-upgrade.ogg'}]},
  setupAudio:()=>'base',started:true,modal:null,loading:false,player:{hp:10,hero:opt.hero||'hwando',x:10,y:10,level:3},room:{id:'A',enemies:[]}};
 ctx.sound=function(kind,allowModal){const rows=ctx.soundProfiles[kind]||[];played.push({kind,path:rows[0]?.path||null,n:rows.length,allowModal:!!allowModal});return Promise.resolve();};
 ctx.hitEnemy=function(e,v){if(!e||e.hp<=0)return false;e.hp-=v;ctx.sound('enemyHit');if(e.hp<=0)ctx.killEnemy(e);return true;};
 ctx.killEnemy=function(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;};
 ctx.hurtPlayer=function(){ctx.sound('hurt');};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 const run=code=>vm.runInContext(code,ctx);
 return{ctx,played,err,api:ctx.window.__STORYWORLD_SFX_R541__,adv:ms=>{now+=ms;},run,click:target=>(listeners.click||[]).forEach(f=>f({target})),listeners,
  mob:(name,extra={})=>Object.assign({name,hp:10,x:12,y:10},extra)};}
const A=mk(),P=A.ctx.soundProfiles,D='assets/r544/sfx/';ok(!A.err&&!!A.api,'오버레이가 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''));
ok(/^R54[456]$/.test(A.api?.revision||'')&&A.api?.enabledR544?.()===true,'revision R544 이후·켜짐');
ok(THEMES.every(t=>P['r544Hit_'+t]?.[0]?.path===F['hit-'+t]?.path&&P['r544Death_'+t]?.[0]?.path===F['death-'+t]?.path),'테마 6개 피격·죽음 프로필 = index.json 경로');
ok(HEROES.every(h=>P['r544Hurt_'+h]?.[0]?.path===F['hurt-'+h]?.path),'영웅 8명 피격 프로필 = index.json 경로');
ok(!P.r544BossDeath&&!P.r544LevelUp&&P.r544Click?.[0]?.path===D+'click-1.ogg','버튼 프로필(보스 쓰러짐·레벨 업 소리는 넣지 않음)');
ok(Object.entries(P).filter(([k])=>/^r544/.test(k)).every(([,v])=>v.every(r=>r.gain>0&&r.gain<=.6&&F[r.path.slice(D.length,-4)]?.gain===r.gain)),'프로필 배율 = index.json 배율(기존 소리의 배율 1 아래)');
ok(P.enemyHit[0].path==='engine-hit.ogg'&&P.hurt[0].path==='engine-hurt.ogg'&&P.upgrade[0].path==='engine-upgrade.ogg','엔진 기본 프로필(enemyHit·hurt·upgrade)은 그대로');
// 테마 분류
const T=A.api?.themeOf||(()=>null),CASES={'걸어다니는 소형 로봇':'machine','강철 턱의 사이보그 개':'machine','기계화 망각거미':'machine','전쟁기계사냥개':'machine','칩 제단 방화벽':'machine',
 '불길 속의 늑대':'beast','관리자 추적견 후속':'beast','피리 고블린':'beast','재 나방 1':'beast','진흙등 거미':'beast','불길 속의 용':'beast','검은기둥 가고일 수호자':'beast','불길 속의 곰':'beast',
 '곰팡이와 오물 봉투':'slime','살아 있는 거대한 위장':'slime','중립초원 슬라임':'slime','보랏빛 알집지기 증원':'slime',
 '합일 주파수 결정':'glass','붉은 하이힐 칼날':'glass','모든 면이 뒷면인 동전':'glass','갈망의 약병핵':'glass','검은 소환 기둥':'glass','오만의 흰 가면':'glass',
 '질투로 얼룩진 망령':'spirit','복도 비명잔영':'spirit','포구 검은 안개':'spirit','늪에서 되살아난 혼령체':'spirit','뿌리에 묶인 근위의 기억 1':'spirit',
 '되살아난 방패동료':'body','백의 구속자':'body','호텔 화염기사':'body','악마화 나무의 침식 근위 3':'body',
 // 낱말 속 낱말 함정
 '회장에게 고용된 총지배인 · 맘몬':'body','거미줄에 묶인 수호병':'body','검은기둥 주문사':'body','태엽 수집자':'body','붉은 하이힐의 서윤':'body','루시퍼 · 가면 벗은 초천사':'body','늪의 염소머리 악마':'body'};
for(const[name,want]of Object.entries(CASES))ok(T(name)===want,'테마: '+name+' → '+want+' (실제 '+T(name)+')');
ok(T(undefined)==='body'&&T('')==='body'&&T(42)==='body','이름이 없거나 문자열이 아니면 body');
// 정상 경로: 피격음이 테마별
const last=()=>A.played[A.played.length-1];
for(const[name,t]of[['걸어다니는 소형 로봇','machine'],['불길 속의 늑대','beast'],['중립초원 슬라임','slime'],['합일 주파수 결정','glass'],['복도 비명잔영','spirit'],['백의 구속자','body']]){
 const e=A.mob(name);A.ctx.room.enemies=[e];A.run('hitEnemy(room.enemies[0],1)');ok(last().kind==='enemyHit'&&last().path===D+'hit-'+t+'.ogg',name+' 피격 → enemyHit 한 번이 '+t+' 소리로');}
ok(P.enemyHit[0].path==='engine-hit.ogg','피격 뒤 enemyHit 프로필이 되돌아옴');
A.run("sound('enemyHit')");ok(last().path==='engine-hit.ogg','hitEnemy 밖에서 부른 enemyHit 은 엔진 소리 그대로');
// 죽음
A.adv(5000);let e=A.mob('걸어다니는 소형 로봇',{hp:1});A.ctx.room.enemies=[e];const before=A.played.length;A.run('hitEnemy(room.enemies[0],5)');
ok(A.played.slice(before).map(p=>p.kind).join()==='enemyHit,r541Death'&&last().path===D+'death-machine.ogg','기계형 처치 → 피격음 뒤 소멸음이 기계 죽음 소리로');
A.adv(100);e=A.mob('복도 비명잔영');A.ctx.room.enemies=[e];let c=A.played.length;A.run('killEnemy(room.enemies[0])');ok(A.played.length===c,'0.6초 안의 다음 죽음은 소리 없음(겹침 방지)');
A.adv(700);e=A.mob('복도 비명잔영');A.ctx.room.enemies=[e];A.run('killEnemy(room.enemies[0])');ok(last().kind==='r541Death'&&last().path===D+'death-spirit.ogg','망령 죽음 소리');ok(P.r541Death[0].path==='assets/r541/sfx/death-1.ogg','죽음 뒤 r541Death 프로필이 되돌아옴');
c=A.played.length;A.run('killEnemy(room.enemies[0])');ok(A.played.length===c,'이미 죽은 적을 다시 처리해도 소리 없음');
A.adv(700);e=A.mob('늪의 뿔악마 군주',{boss:true});A.ctx.room.enemies=[e];c=A.played.length;A.run('killEnemy(room.enemies[0])');ok(A.played.length===c,'보스 처치 → 소멸음 없음(R541 규칙 그대로)');
A.run("sound('r541Death')");ok(last().path==='assets/r541/sfx/death-1.ogg','killEnemy 밖에서 부른 r541Death 는 R541 소리 그대로');
// 영웅 피격
for(const h of HEROES){A.ctx.player.hero=h;A.run('hurtPlayer()');ok(last().kind==='hurt'&&last().path===D+'hurt-'+h+'.ogg',h+' 피격 → hurt 가 '+h+' 소리로');}
ok(P.hurt[0].path==='engine-hurt.ogg','피격 뒤 hurt 프로필이 되돌아옴');
A.ctx.player.hero='unknownHero';A.run('hurtPlayer()');ok(last().path==='engine-hurt.ogg','모르는 영웅은 엔진 피격음 그대로');A.ctx.player.hero='hwando';
// 헌터 활시위(R542)와 함께
A.ctx.player.hero='hunter';A.run("sound('attack')");ok(last().kind==='r542Bow','R542 헌터 활시위 유지');A.ctx.player.hero='hwando';
// 레벨: 지금 판은 지역을 끝낼 때 레벨이 오르고 그때 clear 소리가 난다 → 레벨 업 소리를 따로 내지 않는다
let c0=A.played.length;A.api.tick();A.ctx.player.level++;A.api.tick();A.api.tick();ok(A.played.length===c0,'레벨이 올라도 따로 소리 없음(clear 소리와 겹치지 않게)');
A.run("sound('upgrade',true)");ok(last().path==='engine-upgrade.ogg','강화 구매 upgrade 는 엔진 소리 그대로');
// 버튼
c=A.played.length;A.click({closest:s=>s==='button'?{}:null});ok(A.played.length===c+1&&last().kind==='r544Click'&&last().allowModal,'button 누름 → 버튼 소리(창 위에서도)');
c=A.played.length;A.click({closest:()=>null});A.click(null);A.click({});ok(A.played.length===c,'button 이 아닌 곳·대상 없음은 소리 없음');
const st=A.api.inspect().stats;ok(st.themeHit===7&&st.heroHurt===8&&st.themeDeath===2&&st.click===1&&st.errors===0,'집계: '+JSON.stringify(st));
// 오류·끄기
const B=mk();B.ctx.sound=()=>{throw new Error('x');};let threw=false;try{B.run("killEnemy({name:'백의 구속자',hp:1})");}catch(_){threw=true;}ok(!threw,'sound 가 던져도 killEnemy 는 끝까지 감');
const B2=mk();let r2;B2.ctx.room.enemies=[B2.mob('백의 구속자')];B2.ctx.room.enemies[0].name=null;try{r2=B2.run('hitEnemy(room.enemies[0],1)');}catch(_){r2='threw';}ok(r2===true&&B2.played[0].path===D+'hit-body.ogg','이름 없는 적도 body 소리로 정상 처리');
let r3;try{r3=B2.run('hitEnemy(null,1)');}catch(_){r3='threw';}ok(r3===false,'hitEnemy(null) 은 원래 결과 그대로');
const C=mk({pref4:'0'}),PC=C.ctx.soundProfiles;C.ctx.room.enemies=[C.mob('걸어다니는 소형 로봇',{hp:1})];C.run('hitEnemy(room.enemies[0],5);hurtPlayer()');C.api.tick();C.ctx.player.level++;C.api.tick();C.click({closest:()=>({})});
ok(!Object.keys(PC).some(k=>/^r544/.test(k))&&C.played.map(p=>p.kind+':'+p.path).join()==='enemyHit:engine-hit.ogg,r541Death:assets/r541/sfx/death-1.ogg,hurt:engine-hurt.ogg'&&C.api.enabledR544()===false,'storyworld.r544.sfx=0 → R544 만 꺼지고 R541 죽음음으로 돌아감');
const Z=mk({pref:'0'});Z.ctx.room.enemies=[Z.mob('걸어다니는 소형 로봇',{hp:1})];Z.run('hitEnemy(room.enemies[0],5);hurtPlayer()');ok(Z.played.map(p=>p.path).join()==='engine-hit.ogg,engine-hurt.ogg'&&!Z.ctx.soundProfiles.r544Click,'storyworld.r541.sfx=0 → 전부 꺼짐');
// 엔진 전제: sound() 가 await 전에 프로필 행을 고른다(바꿔 끼우기가 통하는 근거), 피격 간격 규칙이 그대로다.
const core=rd(path.join(R,'runtime-text/index.html')),sf=core.slice(core.indexOf('async function sound('),core.indexOf('async function sound(')+1200);
ok(/const profiles=soundProfiles\[kind\]\|\|\[\]/.test(sf)&&sf.indexOf('profiles[(serial-1)%profiles.length]')>0&&sf.indexOf('profiles[(serial-1)%profiles.length]')<sf.indexOf('await '),'엔진 sound(): 프로필 행을 await 전에 고름');
ok(/kind==='enemyHit'&&serial%7!==1/.test(sf)&&/kind==='enemyHit'\?1\.15/.test(sf)&&/kind==='hurt'\?\.30/.test(sf),'엔진 간격 규칙(피격 7번에 1번·1.15초, 아군 피격 0.3초) 그대로');
ok(/function hitEnemy\(e,value\)\{[^}]*?/.test(core)&&core.slice(core.indexOf('function hitEnemy(e,value){'),core.indexOf('function hitEnemy(e,value){')+500).includes("sound('enemyHit')"),'엔진 hitEnemy 가 enemyHit 을 부름');
ok(/p\.level=Math\.min\(MAX,Math\.max\(1,integer\(p\.level,1\)\)\+1\)/.test(core)&&/gainXP\(def\.safe\?24:65\+def\.index\*2\);[^;]*;[^;]*;sound\('clear'\)/.test(core),'엔진: 레벨은 지역을 끝낼 때 오르고 같은 자리에서 clear 소리가 남');
console.log(bad?`\nR544 CPU: ${bad}/${n} 실패`:`\nR544 CPU: ${n}/${n} 통과`);process.exit(bad?1:0);
