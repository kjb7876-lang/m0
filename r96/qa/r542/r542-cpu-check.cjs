'use strict';
// R542 — 사용자가 준 효과음(2026-11-10 "검토후 개선하여 쓸만한것들 적절히 사용") 가운데 4개를 다듬어 연결.
//  활(헌터 평타) · 회복 · 상자 부수기 · 보스 포효 변주. 영웅 파일은 건드리지 않고 효과음 모듈(sfx-r541.js)에서 연결한다.
// R546 에서 요구가 바뀜(사용자 2026-11-10 14:10Z "효과음 필요할만한건 모두 다 만들어서 적용"): 영웅 평타·강화 소리를 새 소리로 바꾼다. 이 검사는 그 이전 층만 보도록 R546 을 끈 상태(storyworld.r546.sfx='0')로 돌리고, 바뀐 동작은 qa/r546 이 검사한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/sfx-r541.js')),crates=rd(path.join(R,'client-source/crates-r108.js'));
ok(rd(path.join(R,'runtime-text/sfx-r541.js'))===src&&src.length>0,'sfx-r541.js runtime-text 사본 = client-source');
ok(rd(path.join(R,'runtime-text/crates-r108.js'))===crates&&crates.length>0,'crates-r108.js runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r542/r542-cpu-check.cjs'),'pages.yml CPU 검사 줄');
// ── 음원
const man=rd(path.join(R,'runtime-manifest.json')),SFX=path.join(R,'runtime-text/assets/r542/sfx');let idx={files:{}};try{idx=JSON.parse(rd(path.join(SFX,'index.json')));}catch(_){}
const names=Object.keys(idx.files||{});ok(names.join()==='bow-1,heal-1,crush-1,roar-1','index.json 에 4개(활·회복·부수기·포효): '+names.join());
const ff=(()=>{try{cp.execFileSync('ffmpeg',['-version'],{stdio:'ignore'});return true;}catch(_){return false;}})();let total=0;
for(const k of names){const f=idx.files[k],p=path.join(R,'runtime-text',f.path);let b=null;try{b=fs.readFileSync(p);}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256,k+': 파일 = index.json 해시·크기');
 ok(man.includes(f.path),k+': runtime-manifest 에 등록');total+=f.bytes;
 ok(/^[0-9a-f]{64}$/.test(f.sourceSha256||'')&&!!f.source&&Array.isArray(f.trim)&&!!f.use,k+': 원본 이름·해시·자른 구간·쓰임 기록');
 ok(f.bytes<=16000,k+': 16KB 이하('+f.bytes+')');ok(f.duration>=.2&&f.duration<=1.2,k+': 길이 0.2~1.2초('+f.duration+')');
 ok(f.peakDb<=-8,k+': 피크 -8dB 이하('+f.peakDb+')');ok(f.hfShare5k<=.08,k+': 5kHz 위 에너지 8% 이하('+f.hfShare5k+')');
 ok(f.tailDb<=-24,k+': 끝이 잦아듦('+f.tailDb+'dB)');ok(f.gain>0&&f.gain<=.6,k+': 게임 내 배율 0.6 이하('+f.gain+')');
 if(ff&&b){const raw=cp.execFileSync('ffmpeg',['-v','quiet','-i',p,'-f','f32le','-ac','1','-ar','44100','-'],{maxBuffer:1<<26}),x=new Float32Array(raw.buffer,raw.byteOffset,raw.length>>2);
  let pk=0,clip=0;for(const v of x){pk=Math.max(pk,Math.abs(v));if(Math.abs(v)>.98)clip++;}const head=Math.max(...Array.from(x.slice(0,44),Math.abs));
  ok(Math.abs(x.length/44100-f.duration)<.02&&20*Math.log10(pk)<=-8&&clip===0,k+': 실측 길이·피크 일치, 깨진 표본 0('+(20*Math.log10(pk)).toFixed(1)+'dB)');
  ok(head<pk*.15,k+': 실측 첫 1ms 가 피크의 15% 미만(시작 딸깍 없음, '+(head/pk).toFixed(3)+')');}}
if(!ff)console.log('note ffmpeg 없음 — 실측 항목은 index.json 수치·해시 대조로 대신함');
ok(total>0&&total<=40000,'음원 합계 40KB 이하('+total+')');
// ── 동작(vm)
function mk(opt={}){const played=[];let setups=0;
 const base=()=>({attack:[{path:'a.ogg'}],enemyHit:[{path:'h.ogg'}],boss:[{path:'b1.ogg'},{path:'b2.ogg'}],upgrade:[{path:'u.ogg'}],swHeal:[{path:'u.ogg'}],swRanged:[{path:'e.ogg'}]});
 const ctx={window:{},localStorage:{getItem:k=>k==='storyworld.r541.sfx'?(opt.pref??null):k==='storyworld.r546.sfx'?'0':null,setItem(){}},performance:{now:()=>1000},setInterval:()=>0,console,
  soundProfiles:base(),sound:(k,...a)=>{played.push([k,...a]);return 'ret';},killEnemy:()=>{},setupAudio:function(){setups++;Object.assign(ctx.soundProfiles,base());delete ctx.soundProfiles.r542Bow;delete ctx.soundProfiles.r542Crush;return 'base';},
  started:true,modal:null,loading:false,player:{hp:10,hero:opt.hero||'hunter'},room:{id:'A'}};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}return{ctx,played,err};}
const A=mk(),P=A.ctx.soundProfiles,F=idx.files;ok(!A.err,'오버레이가 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''));
// 정상 경로
ok(P.r542Bow?.length===1&&P.r542Bow[0].path===F['bow-1']?.path&&P.r542Bow[0].gain===F['bow-1']?.gain,'활 프로필 = index.json');
ok(P.r542Crush?.length===1&&P.r542Crush[0].path===F['crush-1']?.path,'부수기 프로필');
ok(P.swHeal?.length===1&&P.swHeal[0].path===F['heal-1']?.path&&P.swHeal[0].gain<=.6,'회복(swHeal) = 받은 치유음(전에는 강화음 돌려쓰기)');
ok(P.boss?.length===3&&P.boss[0].path==='b1.ogg'&&P.boss[1].path==='b2.ogg'&&P.boss[2].path===F['roar-1']?.path,'보스 포효: 기존 2개 뒤에 변주 1개 추가');
ok(A.ctx.sound('attack')==='ret'&&A.played.pop()[0]==='r542Bow','헌터 평타 sound(attack) → 활 소리, 반환값 그대로');
// 경계
A.ctx.sound('special');ok(A.played.pop()[0]==='special','헌터 스킬(special)은 그대로');
A.ctx.sound('upgrade',true);const u=A.played.pop();ok(u[0]==='upgrade'&&u[1]===true,'다른 소리·인자는 그대로 전달');
for(const h of['hwando','slayer','gunner','neon','michaela','seoha','lauren']){A.ctx.player.hero=h;A.ctx.sound('attack');ok(A.played.pop()[0]==='attack',h+' 평타는 그대로(attack)');}
A.ctx.player=null;let t=false;try{A.ctx.sound('attack');}catch(_){t=true;}ok(!t&&A.played.pop()[0]==='attack','player 없음에도 오류 없이 attack');
A.ctx.player={hp:1,hero:'hunter'};delete P.r542Bow;A.ctx.sound('attack');ok(A.played.pop()[0]==='attack','활 프로필이 비면 원래 attack 으로');
A.ctx.setupAudio();A.ctx.setupAudio();ok(P.boss.length===3&&P.boss.filter(r=>r.path===F['roar-1']?.path).length===1,'setupAudio 가 두 번 더 돌아도 포효 변주는 1개(중복 없음)');
ok(P.swHeal.length===1&&P.swHeal[0].path===F['heal-1']?.path&&P.r542Bow?.length===1&&P.r542Crush?.length===1,'setupAudio 뒤에도 회복·활·부수기 유지');
ok(P.attack[0].path==='a.ogg'&&P.enemyHit[0].path==='h.ogg'&&P.upgrade[0].path==='u.ogg'&&P.swRanged[0].path==='e.ogg','공격·피격·강화·원거리 프로필 그대로');
// 회귀
const C=mk({pref:'0'}),Q=C.ctx.soundProfiles;C.ctx.sound('attack');
ok(!C.err&&!Q.r542Bow&&!Q.r542Crush&&Q.swHeal[0].path==='u.ogg'&&Q.boss.length===2&&C.played.pop()[0]==='attack','끄기 storyworld.r541.sfx=0 → 모두 옛 동작');
ok(Q.pickup===undefined&&P.pickup?.length===2&&P.r541Death?.length===2&&P.r541Door?.length===1,'R541(줍기·소멸·문)은 그대로');
// 상자: 부수기 소리, 프로필이 없으면 원래 attack
const m=/sound\(([^;]*r542Crush[^;]*)\);/.exec(crates);ok(!!m,'crates-r108: 부술 때 r542Crush 를 씀');
if(m){const pick=sp=>vm.runInNewContext(m[1],sp===undefined?{}:{soundProfiles:sp});
 ok(pick({r542Crush:[{}]})==='r542Crush','상자: 프로필 있으면 r542Crush');ok(pick({})==='attack'&&pick({r542Crush:[]})==='attack','상자: 프로필 없거나 비면 attack');
 let t4=false,v=null;try{v=pick(undefined);}catch(_){t4=true;}ok(!t4&&v==='attack','상자: soundProfiles 가 없어도 오류 없이 attack');}
ok((crates.match(/sound\('upgrade'\)/g)||[]).length===1,'상자 구슬 줍기 소리(upgrade)는 그대로');
ok(!/createOscillator|AudioContext|\.play\(/.test(src),'자체 재생기 없음');
console.log(`\nR542 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
