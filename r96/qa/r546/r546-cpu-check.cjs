'use strict';
// R546 — 사용자 2026-11-10 14:10Z "효과음 필요할만한건 모두 다 만들어서 적용하고 품질좋게", 14:14Z "스피커터지는 소리 … 듣기좋은거 위주로".
//  영웅 8명의 공격·고유기가 엔진의 둔한 '악마 기운'·타격 소리를 돌려쓰던 것을 ElevenLabs 로 만든 영웅별 소리로 바꾸고,
//  블링크·회피·패링·EGO·각성·클리어·강화에 저마다의 소리를, 쓰러짐·창 열기·지역 이동·적 탄환에 새 소리를 넣는다. 엔진 프로필은 그대로 두고 sound() 한 번의 종류만 바꾼다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/sfx-r541.js'));
ok(rd(path.join(R,'runtime-text/sfx-r541.js'))===src&&src.length>0,'sfx-r541.js runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r546/r546-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'],D='assets/r546/sfx/';
const man=rd(path.join(R,'runtime-manifest.json'));let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.length===45&&/ElevenLabs/.test(idx.origin||''),'index.json 45개·출처 기록('+names.length+')');
let total=0;const kinds={};
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 파일 = index.json 해시·크기, manifest 등록');total+=f.bytes||0;(kinds[f.kind]=kinds[f.kind]||[]).push(k);
 ok(/^[0-9a-f]{64}$/.test(f.sourceSha256||'')&&!!f.prompt&&!!f.use&&f.rate>0,k+': 원본 해시·생성 문구·쓰임');
 const atk=/^atk-/.test(k);
 ok(f.lowShare150<=.08&&f.hfShare5k<=.01,k+': 150Hz 아래 8% 이하·5kHz 위 1% 이하('+f.lowShare150+', '+f.hfShare5k+')');
 ok(f.harshShare2to5k<=(atk?.35:.5),k+': 2~5kHz '+(atk?'35':'50')+'% 이하('+f.harshShare2to5k+')');
 ok(f.peakDb<=-7&&f.tailDb<=-30,k+': 피크 -7dB 이하·끝이 조용히 닫힘('+f.peakDb+', '+f.tailDb+')');
 if(atk)ok(f.duration<=.45&&f.riseMs<=200,k+': 공격음 0.45초 이하·0.2초 안에 올라옴('+f.duration+'s, '+f.riseMs+'ms)');
 ok(f.gain>=.35&&f.gain<=.75,k+': 배율 .35~.75('+f.gain+')');}
ok(total>0&&total<=320000,'음원 합계 320KB 이하('+total+')');
const WANT=[...HEROES.filter(h=>h!=='hunter').map(h=>'r546Atk_'+h),...HEROES.map(h=>'r546Sp_'+h),'r546Blink','r546Dodge','r546Parry','r546Ego','r546Awake','r546Clear','r546Upgrade','r546Fall','r546Open','r546EnemyShot','r546Portal'];
ok(WANT.every(k=>kinds[k]?.length)&&Object.keys(kinds).length===WANT.length,'소리 종류 '+WANT.length+'개가 모두 있음('+Object.keys(kinds).length+')');
ok(HEROES.filter(h=>h!=='hunter').every(h=>kinds['r546Atk_'+h]?.length===2)&&HEROES.every(h=>kinds['r546Sp_'+h]?.length===2),'영웅 공격·고유기는 변주 2개씩(같은 소리 되풀이 줄이기)');
// ── 동작(vm)
function mk(opt={}){const played=[];let now=100000;const listeners={};
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{}}},localStorage:{getItem:k=>k==='storyworld.r546.sfx'?(opt.pref6??null):null,setItem(){}},performance:{now:()=>now},setInterval:()=>0,console,Math,Promise,
  document:{addEventListener:(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);}},
  soundProfiles:{attack:[{path:'a.ogg'}],special:[{path:'s.ogg'}],blink:[{path:'b.ogg'}],dodge:[{path:'d.ogg'}],parry:[{path:'p.ogg'}],ego:[{path:'p.ogg'}],awake:[{path:'w.ogg'}],clear:[{path:'p.ogg'}],upgrade:[{path:'p.ogg'}],
   enemyHit:[{path:'engine-hit.ogg'}],hurt:[{path:'engine-hurt.ogg'}],swEnemyDark:[{path:'dark.ogg'}],swEnemyHeavy:[{path:'heavy.ogg'}],swEnemyEnergy:[{path:'energy.ogg'}],boss:[{path:'boss.ogg'}]},
  setupAudio:()=>'base',started:true,modal:null,loading:false,player:{hp:10,hero:opt.hero||'hwando',x:10,y:10,level:3},room:{id:'A',enemies:[]}};
 ctx.sound=function(kind,allowModal){const rows=ctx.soundProfiles[kind]||[];played.push({kind,path:rows[0]?.path||null,n:rows.length,allowModal:!!allowModal});return Promise.resolve();};
 ctx.hitEnemy=function(e,v){if(!e||e.hp<=0)return false;e.hp-=v;ctx.sound('enemyHit');return true;};ctx.killEnemy=function(e){e.hp=0;e.deadRecorded=true;};
 ctx.openPanel=function(){ctx.modal=true;};ctx.showDeath=function(){ctx.openPanel('x');};ctx.enterRegion=function(id){return Promise.resolve(id!=='blocked');};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,err,api:ctx.window.__STORYWORLD_SFX_R541__,adv:ms=>{now+=ms;},run:c=>vm.runInContext(c,ctx),click:()=>(listeners.click||[]).forEach(f=>f({target:{closest:()=>({})}})),last:()=>played[played.length-1]};}
(async()=>{
 const A=mk(),P=A.ctx.soundProfiles;ok(!A.err&&!!A.api,'오버레이가 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''));
 ok(A.api?.revision==='R546'&&A.api?.enabledR546?.()===true,'revision R546·켜짐');
 ok(WANT.every(k=>P[k]?.length===kinds[k].length&&P[k].every(r=>F[r.path.slice(D.length,-4)]?.kind===k&&F[r.path.slice(D.length,-4)].gain===r.gain)),'프로필 = index.json(경로·배율·종류)');
 ok(P.attack[0].path==='a.ogg'&&P.special[0].path==='s.ogg'&&P.blink[0].path==='b.ogg'&&P.awake[0].path==='w.ogg'&&P.swEnemyDark[0].path==='dark.ogg','엔진 기본 프로필은 그대로');
 const AL=A.ctx.window.__STORYWORLD_SFX_COMFORT__.aliases;
 ok(AL.r546Atk_hwando==='attack'&&AL.r546Sp_gunner==='special'&&AL.r546Blink==='blink'&&AL.r546Dodge==='dodge'&&AL.r546Parry==='parry'&&AL.r546Ego==='ego'&&AL.r546Awake==='awake'&&AL.r546Clear==='clear'&&AL.r546Upgrade==='upgrade','역할 별칭(간격·음량·우선순위는 엔진 역할 그대로)');
 ok(!AL.r546EnemyShot&&!AL.r546Fall&&!AL.r546Open&&!AL.r546Portal,'새로 덧붙는 소리는 별칭 없음(보스 역할로 다른 소리를 밀어내지 않음)');
 for(const h of HEROES){const M=mk({hero:h});M.run("sound('attack')");const a=M.last();M.run("sound('special')");const s=M.last();
  ok(h==='hunter'?a.kind==='r542Bow':a.kind==='r546Atk_'+h&&a.path===D+'atk-'+h+'-1.ogg',h+' 공격 → '+a.kind);ok(s.kind==='r546Sp_'+h&&s.path===D+'sp-'+h+'-1.ogg',h+' 고유기 → '+s.kind);}
 for(const [k,w] of [['blink','r546Blink'],['dodge','r546Dodge'],['parry','r546Parry'],['ego','r546Ego'],['clear','r546Clear'],['upgrade','r546Upgrade'],['awake','r546Awake']]){A.run("sound('"+k+"')");ok(A.last().kind===w,k+' → '+w);}
 const S=mk({hero:'seoha'});S.run("sound('awake')");ok(S.last().kind==='awake','윤서하 각성은 엔진의 전용 소리 그대로');
 A.run("sound('hurt')");ok(/r544Hurt|hurt/.test(A.last().kind)&&A.last().kind!=='r546Fall','피격은 R544 그대로');A.run("sound('boss')");ok(A.last().kind==='boss','보스 포효는 그대로');
 const c0=A.played.length;A.run("sound('swEnemyDark')");ok(A.last().kind==='r546EnemyShot','적 탄환 → r546EnemyShot');A.run("sound('swEnemyHeavy');sound('swEnemyEnergy')");ok(A.played.length===c0+1,'0.8초 안의 다음 적 탄환은 소리 없음');
 A.adv(900);A.run("sound('swEnemyEnergy')");ok(A.played.length===c0+2&&A.last().kind==='r546EnemyShot','0.8초 뒤에는 다시 울림');
 const E=mk();E.adv(5000);E.run('showDeath()');const f=E.played.filter(x=>x.kind==='r546Fall'),o=E.played.filter(x=>x.kind==='r546Open');ok(f.length===1&&f[0].allowModal&&o.length===0,'쓰러짐: r546Fall 한 번(창 위에서도 울림), 창 열기 소리는 겹치지 않음');
 const O=mk();O.adv(5000);O.run("openPanel('x')");ok(O.last()?.kind==='r546Open'&&O.last().allowModal,'창 열기 → r546Open');O.adv(200);O.run("openPanel('y')");ok(O.played.filter(x=>x.kind==='r546Open').length===1,'0.6초 안에 다시 열면 소리 없음');
 O.adv(2000);O.click();O.adv(50);O.run("openPanel('z')");ok(O.played.filter(x=>x.kind==='r546Open').length===1,'버튼 누름 직후 열린 창은 버튼 소리만');
 const T=mk();T.adv(5000);await T.run("enterRegion('next')");await new Promise(r=>setTimeout(r,5));ok(T.played.filter(x=>x.kind==='r546Portal').length===1,'지역 이동이 끝나면 r546Portal');
 await T.run("enterRegion('blocked')");await new Promise(r=>setTimeout(r,5));ok(T.played.filter(x=>x.kind==='r546Portal').length===1,'이동이 거절되면 소리 없음');
 const st=A.api.inspect().r546;ok(st&&st.on===true&&st.mapped>=8&&st.directListeningVerified===false&&st.generated==='ElevenLabs text-to-sound v2','inspect.r546(바꾼 횟수·출처·직접 청취 미검증)');
 const X=mk({pref6:'0'});X.run("sound('attack')");const xa=X.last();X.run("sound('special');sound('blink')");ok(X.api?.enabledR546?.()===false&&xa.kind==='attack'&&X.last().kind==='blink'&&!X.ctx.soundProfiles.r546Blink,"storyworld.r546.sfx='0' 이면 엔진 소리 그대로");
 console.log('\nR546 CPU checks: '+(n-bad)+'/'+n);process.exit(bad?1:0);
})();
