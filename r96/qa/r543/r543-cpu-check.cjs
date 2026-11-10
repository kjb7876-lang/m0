'use strict';
// R543 — 사용자 2026-11-10 "적절하게 개선해서 써 늑대고블린은 변형개선해서 적이 쓰게 하던지".
//  늑대 으르렁을 음높이 변형해 짐승형 적(이름에 짐승·추적견·사냥개 / 곰 / 여우)이 공격을 시작할 때, 고블린 목소리는 '피리 고블린'이 공격할 때 낸다.
//  천둥은 R450 날씨가 비(rain)인 구역에서만 드물게(먼 천둥). 영웅·몹 파일은 건드리지 않고 효과음 모듈(sfx-r541.js)에서 관찰만 한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/sfx-r541.js'));
ok(rd(path.join(R,'runtime-text/sfx-r541.js'))===src&&src.length>0,'sfx-r541.js runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r543/r543-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=rd(path.join(R,'runtime-manifest.json')),SFX=path.join(R,'runtime-text/assets/r543/sfx');let idx={files:{}};try{idx=JSON.parse(rd(path.join(SFX,'index.json')));}catch(_){}
const names=Object.keys(idx.files||{}),F=idx.files;ok(names.join()==='growl-1,growl-2,growl-3,goblin-1,goblin-2,thunder-1,thunder-2','index.json 에 7개: '+names.join());
const ff=(()=>{try{cp.execFileSync('ffmpeg',['-version'],{stdio:'ignore'});return true;}catch(_){return false;}})();let total=0;
for(const k of names){const f=F[k],p=path.join(R,'runtime-text',f.path);let b=null;try{b=fs.readFileSync(p);}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256,k+': 파일 = index.json 해시·크기');ok(man.includes(f.path),k+': runtime-manifest 에 등록');total+=f.bytes;
 ok(/^[0-9a-f]{64}$/.test(f.sourceSha256||'')&&!!f.source&&Array.isArray(f.trim)&&f.pitch>0&&!!f.use,k+': 원본·해시·구간·음높이·쓰임 기록');
 ok(f.bytes<=16000&&f.duration>=.2&&f.duration<=1.2,k+': 16KB·1.2초 이하('+f.bytes+', '+f.duration+')');ok(f.peakDb<=-9,k+': 피크 -9dB 이하('+f.peakDb+')');
 ok(f.hfShare5k<=.02,k+': 5kHz 위 2% 이하('+f.hfShare5k+')');ok(f.tailDb<=-30,k+': 끝이 잦아듦');ok(f.gain>0&&f.gain<=.5,k+': 게임 내 배율 0.5 이하('+f.gain+')');
 if(ff&&b){const raw=cp.execFileSync('ffmpeg',['-v','quiet','-i',p,'-f','f32le','-ac','1','-ar','44100','-'],{maxBuffer:1<<26}),x=new Float32Array(raw.buffer,raw.byteOffset,raw.length>>2);
  let pk=0,clip=0;for(const v of x){pk=Math.max(pk,Math.abs(v));if(Math.abs(v)>.98)clip++;}const head=Math.max(...Array.from(x.slice(0,44),Math.abs));
  ok(Math.abs(x.length/44100-f.duration)<.02&&20*Math.log10(pk)<=-9&&clip===0&&head<pk*.15,k+': 실측 길이·피크·깨짐 0·시작 딸깍 없음');}}
ok(names.filter(k=>/growl/.test(k)).map(k=>F[k].pitch).join()==='1,0.8,1.14'&&F['goblin-1']?.pitch<1&&F['thunder-2']?.pitch<1,'변형: 으르렁 음높이 3가지, 고블린·천둥 변주는 내림');
if(!ff)console.log('note ffmpeg 없음 — 실측 항목은 index.json 수치·해시 대조로 대신함');
ok(total>0&&total<=70000,'음원 합계 70KB 이하('+total+')');
// ── 동작(vm)
function mk(opt={}){const played=[];let now=100000,rnd=opt.rnd??.5,uid=0;
 const ctx={window:{},localStorage:{getItem:k=>k==='storyworld.r541.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>now},setInterval:()=>0,console,Math:Object.assign(Object.create(Math),{random:()=>rnd}),
  soundProfiles:{attack:[{path:'a.ogg'}],boss:[{path:'b.ogg'}]},sound:k=>{played.push(k);},killEnemy:()=>{},setupAudio:()=>'base',started:true,modal:null,loading:false,player:{hp:10,hero:'hwando',x:10,y:10},room:{id:'A',enemies:[]}};
 ctx.window.__STORYWORLD_WEATHER_R450__=opt.noWeather?undefined:{pick:r=>({kind:r&&r.weather||'none'})};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 const mob=(name,x=12,y=10,extra={})=>Object.assign({name,hp:10,x,y,attack:null},extra),atk=e=>{e.attack={id:++uid,elapsed:0};};
 return{ctx,played,err,api:ctx.window.__STORYWORLD_SFX_R541__,adv:ms=>{now+=ms;},mob,atk,setRnd:v=>{rnd=v;}};}
const A=mk(),P=A.ctx.soundProfiles,T=()=>A.api.tick();ok(!A.err&&!!A.api,'오버레이가 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''));
ok(P.r543Growl?.[0]?.path===F['growl-1']?.path&&P.r543GrowlLow?.[0]?.path===F['growl-2']?.path&&P.r543GrowlHigh?.[0]?.path===F['growl-3']?.path&&P.r543Goblin?.length===2&&P.r543Thunder?.length===2,'프로필 5종(으르렁 3·고블린 2변주·천둥 2변주)');
ok(Object.entries(P).filter(([k])=>/^r543/.test(k)).every(([,v])=>v.every(r=>r.gain<=.5)),'프로필 배율 0.5 이하');
// 정상 경로: 짐승형 적이 공격을 시작하면 으르렁
const dog=A.mob('관리자 추적견'),bear=A.mob('불길 속의 곰'),fox=A.mob('눈보라 속 여우 악마'),gob=A.mob('피리 고블린'),guard=A.mob('되살아난 방패동료');
A.ctx.room.enemies=[dog,bear,fox,gob,guard];T();ok(A.played.length===0,'공격하지 않으면 소리 없음');
A.atk(dog);T();ok(A.played.join()==='r543Growl','추적견 공격 시작 → 으르렁');T();T();ok(A.played.length===1,'같은 공격이 이어지는 동안 다시 안 남');
A.adv(3000);A.atk(bear);T();ok(A.played[1]==='r543GrowlLow','곰 → 낮은 으르렁');
A.adv(3000);A.atk(fox);T();ok(A.played[2]==='r543GrowlHigh','여우 악마 → 높은 으르렁');
A.atk(gob);T();ok(A.played[3]==='r543Goblin','피리 고블린 → 고블린 목소리(짐승 간격과 따로)');
A.adv(3000);A.atk(guard);T();ok(A.played.length===4,'짐승·고블린이 아닌 적(방패동료)은 소리 없음');
for(const nm of['갈망의 도시짐승','분노의 사냥개']){A.adv(3000);const e=A.mob(nm);A.ctx.room.enemies.push(e);A.atk(e);T();ok(A.played.at(-1)==='r543Growl'&&A.played.length>4,nm+' → 으르렁');}
// 경계
let c=A.played.length;A.adv(1000);A.atk(dog);T();ok(A.played.length===c,'으르렁 뒤 1초 안의 다른 공격 → 간격 제한(2.5초)');
A.adv(3000);const d2=A.mob('관리자 추적견',40,40);A.ctx.room.enemies.push(d2);A.atk(d2);T();ok(A.played.length===c,'화면 밖 먼 적(거리 9 초과)은 소리 없음');
A.adv(3000);const dead=A.mob('관리자 추적견',12,10,{hp:0});A.ctx.room.enemies.push(dead);A.atk(dead);T();ok(A.played.length===c,'죽은 적은 소리 없음');
A.adv(3000);A.atk(dog);A.atk(bear);A.atk(fox);T();ok(A.played.length===c+1,'세 마리가 같은 순간 공격해도 1회');c=A.played.length;
A.adv(3000);A.ctx.modal={};A.atk(dog);T();A.ctx.modal=null;T();ok(A.played.length===c,'창이 떠 있을 때 시작한 공격은 소리 없음(닫은 뒤에도 뒤늦게 안 남)');
A.adv(3000);A.ctx.room={id:'B',enemies:[A.mob('이름 없음',12,10,{name:undefined}),null,{hp:5}]};let t=false;try{T();A.ctx.room={id:'C'};T();A.ctx.room=null;T();}catch(_){t=true;}ok(!t&&A.played.length===c,'이름 없는 적·null·enemies 없는 방·room 없음에도 오류 없음');
A.ctx.room={id:'M',enemies:[]};for(const nm of['곰팡이와 오물 봉투','곰팡이 포자 덩어리']){A.adv(3000);const e=A.mob(nm);A.ctx.room.enemies.push(e);const k=A.played.length;A.atk(e);T();ok(A.played.length===k,nm+' → 소리 없음(곰팡이는 곰이 아님)');}
// 천둥
const B=mk({rnd:0}),TB=()=>B.api.tick();B.ctx.room={id:'R',weather:'rain',enemies:[]};TB();ok(B.played.length===0,'비 구역에 막 들어왔을 때는 천둥 없음');
B.adv(11000);TB();ok(B.played.length===0,'11초 뒤에도 아직 없음(첫 천둥 최소 12초)');B.adv(2000);TB();ok(B.played.join()==='r543Thunder','13초 뒤 첫 먼 천둥');
B.adv(30000);TB();ok(B.played.length===1,'30초 뒤 — 아직 간격 안(최소 40초)');B.adv(11000);TB();ok(B.played.length===2,'41초 뒤 다음 천둥');
B.setRnd(.999);B.adv(60000);TB();ok(B.played.length===3,'(다음 간격을 길게 뽑음)');B.adv(85000);TB();ok(B.played.length===3,'85초 뒤 — 간격이 최대 90초에 가까우면 아직 없음');B.adv(6000);TB();ok(B.played.length===4,'91초 뒤에는 남(최대 90초)');
B.ctx.room={id:'ST',weather:'storm',enemies:[]};TB();B.adv(200000);TB();ok(B.played.length===5,'폭풍 구역(균열 너머 폭풍)도 먼 천둥');
B.ctx.room={id:'S',weather:'snow',enemies:[]};B.adv(200000);TB();ok(B.played.length===5,'눈 구역은 천둥 없음');
B.ctx.room={id:'D',weather:'drizzle',enemies:[]};B.adv(200000);TB();ok(B.played.length===5,'이슬비 구역은 천둥 없음');
B.ctx.room={id:'N',enemies:[]};B.adv(200000);TB();ok(B.played.length===5,'날씨 없는 구역은 천둥 없음');
B.ctx.room={id:'R2',weather:'rain',enemies:[]};TB();B.adv(200000);B.ctx.modal={};TB();ok(B.played.length===5,'창이 떠 있으면 천둥 미룸');B.ctx.modal=null;TB();ok(B.played.length===6,'창을 닫으면 남');
const W=mk({noWeather:true});W.ctx.room={id:'R',weather:'rain',enemies:[]};let t2=false;try{W.api.tick();W.adv(200000);W.api.tick();}catch(_){t2=true;}ok(!t2&&W.played.length===0,'R450 날씨가 없으면 천둥 없음·오류 없음');
// 회귀
const C=mk({pref:'0'});C.ctx.room={id:'R',weather:'rain',enemies:[C.mob('관리자 추적견')]};C.atk(C.ctx.room.enemies[0]);C.api?.tick();C.adv(200000);C.api?.tick();
ok(!C.err&&C.played.length===0&&!Object.keys(C.ctx.soundProfiles).some(k=>/^r543/.test(k)),'끄기 storyworld.r541.sfx=0 → 프로필·소리 없음');
ok(P.attack[0].path==='a.ogg'&&P.pickup?.length===2&&P.r542Bow?.length===1&&P.boss.length===2,'R541·R542 프로필과 기존 프로필 유지');
ok(!/createOscillator|AudioContext|\.play\(/.test(src),'자체 재생기 없음');
console.log(`\nR543 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
