'use strict';
// R541 — 빈 자리 효과음(사용자 2026-11-10 "직접 녹음 말고 너가 여러 효과음 참조해서 적절하게 생성" → "소리 거슬리지 않게 개선해서 적용").
//  기억 조각·쪽지 줍기 sound('pickup') 은 soundProfiles.pickup 이 없어 무음이었고, 몹 소멸·문 열림은 전용 소리가 없었다.
//  기존 소리(공격·피격·보스 등)는 바꾸지 않는다. 합성음은 느린 어택·5kHz 위 억제·낮은 피크라야 한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/sfx-r541.js')),html=rd(path.join(R,'runtime-text/index.html'));
ok(src.length>0,'client-source/sfx-r541.js 있음');
ok(src.length>0&&rd(path.join(R,'runtime-text/sfx-r541.js'))===src,'runtime-text 사본 = client-source');
// ── 연결 다섯 곳
ok(/<script src="\.\/swamp-hands-r474\.js"><\/script>\s*<script src="\.\/sfx-r541\.js"><\/script>/.test(html),'index.html: swamp-hands-r474 바로 뒤에 sfx-r541 태그');
ok(html.indexOf('sfx-r541.js')>0&&html.indexOf('sfx-r541.js')<html.indexOf('"./combat-r118.js"'),'combat-r118·world-tiles-r118 보다 앞');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'sfx-r541.js'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r541/r541-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=rd(path.join(R,'runtime-manifest.json'));
// ── 음원: 목록·해시·크기·거슬림 수치
const SFX=path.join(R,'runtime-text/assets/r541/sfx');let idx={files:{}};try{idx=JSON.parse(rd(path.join(SFX,'index.json')));}catch(_){}
const names=Object.keys(idx.files||{});
ok(names.join()==='pickup-1,pickup-2,death-1,death-2,door-1','index.json 에 5개(줍기 2·소멸 2·문 1): '+names.join());
let total=0;const ff=(()=>{try{cp.execFileSync('ffmpeg',['-version'],{stdio:'ignore'});return true;}catch(_){return false;}})();
for(const k of names){const f=idx.files[k],p=path.join(R,'runtime-text',f.path);let b=null;try{b=fs.readFileSync(p);}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256,k+': 파일 = index.json 해시·크기');
 ok(man.includes('"'+f.path+'"')||man.includes(f.path),k+': runtime-manifest 에 등록');total+=f.bytes;
 ok(f.bytes<=16000,k+': 16KB 이하('+f.bytes+')');
 ok(f.duration>=.3&&f.duration<=1.2,k+': 길이 0.3~1.2초(게임 조절기 special 상한 1.2초 안, '+f.duration+')');
 ok(f.peakDb<=-8.5,k+': 피크 -8.5dB 이하('+f.peakDb+')');
 ok(f.hfShare5k<=.01,k+': 5kHz 위 에너지 1% 이하('+f.hfShare5k+')');
 ok(f.attackMs>=10,k+': 어택 10ms 이상 — 딸깍 없음('+f.attackMs+')');
 ok(f.tailDb<=-40,k+': 끝이 -40dB 아래로 잦아듦('+f.tailDb+')');
 ok(f.gain>0&&f.gain<=.6,k+': 게임 내 배율 0.6 이하('+f.gain+')');
 if(ff&&b){// 실측: 적어 둔 수치가 아니라 파일을 풀어서 다시 잰다
  const raw=cp.execFileSync('ffmpeg',['-v','quiet','-i',p,'-f','f32le','-ac','1','-ar','44100','-'],{maxBuffer:1<<26}),x=new Float32Array(raw.buffer,raw.byteOffset,raw.length>>2);
  let pk=0;for(const v of x)pk=Math.max(pk,Math.abs(v));const head=Math.max(...Array.from(x.slice(0,88),Math.abs));// 첫 2ms
  ok(Math.abs(x.length/44100-f.duration)<.02&&20*Math.log10(pk)<=-8.5,k+': 실측 길이·피크 일치('+(x.length/44100).toFixed(3)+'s, '+(20*Math.log10(pk)).toFixed(1)+'dB)');
  ok(head<pk*.12,k+': 실측 첫 2ms 가 피크의 12% 미만(시작 딸깍 없음, '+(head/pk).toFixed(3)+')');
  let hi=0,all=0,prev=0,lp=0;const a=1-Math.exp(-2*Math.PI*5000/44100);for(const v of x){lp+=a*(v-lp);const h=v-lp;hi+=h*h;all+=v*v;prev=v;}
  ok(hi/all<.05,k+': 실측 5kHz 하이패스 뒤 에너지 5% 미만('+(hi/all).toFixed(4)+')');}}
if(!ff)console.log('note ffmpeg 없음 — 실측 3항목은 index.json 수치·해시 대조로 대신함');
ok(total>0&&total<=60000,'음원 합계 60KB 이하('+total+') — Pages 용량 영향 없음');
// ── 동작(vm)
function mk(opt={}){const played=[],killed=[];let now=1000;
 const ctx={window:{},localStorage:{getItem:k=>k==='storyworld.r541.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>now},setInterval:()=>0,console,
  soundProfiles:Object.assign({attack:[{path:'a.ogg'}],enemyHit:[{path:'h.ogg'}],boss:[{path:'b.ogg'}],upgrade:[{path:'u.ogg'}]},opt.profiles||{}),
  sound:k=>{played.push(k);},killEnemy:e=>{if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;killed.push(e.id);},setupAudio:function(){delete ctx.soundProfiles.pickup;delete ctx.soundProfiles.r541Death;delete ctx.soundProfiles.r541Door;return 'base';},
  started:true,modal:null,loading:false,player:{hp:10},room:{id:'A',exploration:{worldR74:{doors:[{id:'door-0'},{id:'door-1'}]}}}};
 const open=new Set(opt.open||[]);if(!opt.noR74)ctx.window.__STORYWORLD_WORLD_R74__={isOpen:(r,d)=>open.has(r.id+':'+d.id)};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,killed,open,err,api:ctx.window.__STORYWORLD_SFX_R541__,adv:ms=>{now+=ms;}};}
const A=mk();ok(!A.err&&!!A.api,'오버레이가 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''));
const api=A.api||{tick(){},inspect:()=>({})},P=A.ctx.soundProfiles;
// 정상 경로
ok(P.pickup?.length===2&&P.pickup.every(r=>/^assets\/r541\/sfx\/pickup-[12]\.ogg$/.test(r.path)&&r.gain<=.6),'pickup 프로필 2개(전에는 없어 무음)');
ok(P.r541Death?.length===2&&P.r541Door?.length===1,'소멸 2·문 1 프로필');
ok(names.every(k=>Object.values(P).flat().some(r=>r.path===idx.files[k].path&&r.gain===idx.files[k].gain)),'프로필 경로·배율 = index.json');
ok(P.attack[0].path==='a.ogg'&&P.enemyHit[0].path==='h.ogg'&&P.boss[0].path==='b.ogg'&&P.upgrade[0].path==='u.ogg','기존 프로필(공격·피격·보스·강화) 그대로');
const K=A.ctx.killEnemy;K({id:1,hp:5});ok(A.killed.join()==='1'&&A.played.join()==='r541Death','몹 처치 → 원래 killEnemy 실행 + 소멸음 1회');
// 경계
const dead={id:2,hp:0,deadRecorded:true};K(dead);ok(A.played.length===1,'이미 죽은 몹 다시 처치 → 소리 없음');
for(let i=3;i<13;i++)K({id:i,hp:1});ok(A.killed.length===11&&A.played.length===1,'같은 순간 10마리 처치 → 소리 추가 없음(간격 제한), 처치는 모두 됨');
A.adv(400);K({id:20,hp:1});ok(A.played.length===1,'0.4초 뒤 처치 → 아직 간격 안');A.adv(400);K({id:21,hp:1});ok(A.played.length===2,'0.8초 뒤 처치 → 다시 1회');
A.adv(2000);K({id:22,hp:1,boss:true});ok(A.played.length===2&&A.killed.includes(22),'보스 처치 → 소멸음 없음(보스 연출 소리와 겹치지 않게)');
A.played.length=0;api.tick();ok(A.played.length===0,'문: 방 첫 관찰은 소리 없음');
A.open.add('A:door-1');api.tick();ok(A.played.join()==='r541Door','문: 닫힘→열림 1회');api.tick();ok(A.played.length===1,'문: 열린 채로는 다시 안 남');
A.open.delete('A:door-1');api.tick();A.adv(3000);A.open.add('A:door-1');api.tick();ok(A.played.length===2,'문: 닫혔다 다시 열리면 또 1회');
A.open.add('B:door-0');A.ctx.room={id:'B',exploration:{worldR74:{doors:[{id:'door-0'}]}}};api.tick();ok(A.played.length===2,'문: 이미 열린 문이 있는 새 방에 들어가도 소리 없음');
A.adv(3000);A.open.add('A:door-0');A.open.add('C:door-0');A.open.add('C:door-1');A.ctx.room={id:'C',exploration:{worldR74:{doors:[{id:'door-0'},{id:'door-1'}]}}};A.open.delete('C:door-0');A.open.delete('C:door-1');api.tick();A.open.add('C:door-0');A.open.add('C:door-1');api.tick();ok(A.played.length===3,'문: 두 문이 같은 순간 열려도 1회');
A.ctx.modal={};A.adv(3000);A.open.delete('C:door-0');api.tick();A.open.add('C:door-0');api.tick();ok(A.played.length===3,'문: 창이 떠 있는 동안 열린 것은 소리 없음');A.ctx.modal=null;
A.ctx.room={id:'D'};let threw=false;try{api.tick();A.ctx.room=null;api.tick();}catch(_){threw=true;}ok(!threw,'문 정보가 없는 방·room 없음에도 오류 없음');
ok(A.ctx.setupAudio()==='base'&&P.pickup?.length===2&&P.r541Death?.length===2&&P.r541Door?.length===1,'setupAudio 가 다시 돌아도 프로필 유지(원래 반환값 그대로)');
// 회귀
const B=mk({profiles:{pickup:[{path:'own.ogg',gain:1}]}});ok(B.ctx.soundProfiles.pickup.length===1&&B.ctx.soundProfiles.pickup[0].path==='own.ogg','pickup 프로필이 이미 있으면 덮어쓰지 않음');
const C=mk({pref:'0'});C.ctx.killEnemy({id:1,hp:1});C.api?.tick();ok(!C.err&&!C.ctx.soundProfiles.pickup&&!C.ctx.soundProfiles.r541Death&&C.played.length===0&&C.killed.length===1,'끄기 storyworld.r541.sfx=0 → 프로필·소리 없음, 처치는 그대로');
const D=mk({noR74:true});let t2=false;try{D.api?.tick();}catch(_){t2=true;}ok(!D.err&&!t2&&D.ctx.soundProfiles.pickup?.length===2,'R74 문 API 가 없어도 줍기·소멸은 동작');
const E=mk();E.ctx.sound=()=>{throw Error('x');};let t3=false;try{E.ctx.killEnemy({id:1,hp:1});}catch(_){t3=true;}ok(!t3&&E.killed.length===1,'sound 가 오류를 내도 처치는 진행');
ok(!/createOscillator|AudioContext|\.play\(/.test(src),'오버레이는 자체 재생기를 만들지 않고 게임 sound()·조절기를 탄다');
console.log(`\nR541 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
