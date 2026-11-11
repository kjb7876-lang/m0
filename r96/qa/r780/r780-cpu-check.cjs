'use strict';
// R780 — 사용자 2026-11-11 "워크래프트3 효과음 참고해서 … 기본공격·스킬·피격, 적 피격과 죽음 효과음 타격감 있도록 퀄 좋게".
//  영웅 무기 재질별 적중음(환도 칼날·슬레이어 대검·헌터 화살·기억사수 탄환·네온 전격·미카엘라 빛·라우렌 결정·윤서하 태엽)과 처치 마무리음을
//  ElevenLabs 로 만들어(scripts/build-sfx-r780.py) 적 피격 sound('enemyHit') 한 번의 종류만 바꿔 얹는다. 피치 변주는 파일로 구워 넣고, 겹침은 모듈이 한 번 더 제한한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/combat-sfx-r780.js'));
ok(src.length>0,'combat-sfx-r780.js 존재');
ok(rd(path.join(R,'runtime-text/combat-sfx-r780.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
ok(/combat-sfx-r780\.js/.test(rd(path.join(R,'runtime-text/index.html'))),'index.html 스크립트 태그');
ok(/combat-sfx-r780/.test(rd(path.join(ROOT,'scripts/verify-r96-public.py'))),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r780/r780-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'],D='assets/r780/sfx/';
const man=rd(path.join(R,'runtime-manifest.json'));let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.length>=40&&/ElevenLabs/.test(idx.origin||''),'index.json 40개 이상·출처 기록('+names.length+')');
let total=0;const byKind={},rms=[];
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 해시·크기·manifest');total+=f.bytes||0;(byKind[f.kind]=byKind[f.kind]||[]).push(k);
 ok(f.duration<=.45&&f.riseMs<=20,k+': 0.45초 이하·20ms 안에 올라오는 타격 어택('+f.duration+'s, '+f.riseMs+'ms)');
 ok(f.lowShare150<=.10&&f.hfShare5k<=.02,k+': 150Hz 아래 10%·5kHz 위 2% 이하(스피커 터짐 방지)');
 ok(f.peakDb<=-6&&f.peakDb>=-14&&f.tailDb<=-30,k+': 피크 -6~-14dB·끝 닫힘('+f.peakDb+','+f.tailDb+')');rms.push(f.rmsDb);}
ok(rms.length>0&&Math.max(...rms)-Math.min(...rms)<=3,'RMS 정규화: 전체 편차 3dB 이하('+(rms.length?(Math.max(...rms)-Math.min(...rms)).toFixed(1):'-')+')');
ok(total>0&&total<=400000,'음원 합계 400KB 이하('+total+')');
ok(HEROES.every(h=>(byKind['r780Hit_'+h]||[]).length>=4),'영웅 8명 모두 적중음 변주 4개 이상(피치 변주 포함)');
ok(HEROES.every(h=>(byKind['r780HitBig_'+h]||[]).length>=2),'영웅 8명 모두 스킬 적중(낮은 피치) 2개 이상');
ok((byKind.r780Kill||[]).length>=3,'처치 마무리음 3개 이상');
function mk(opt={}){const played=[];let now=100000;
 const aliases={};const roles={enemyHit:{gain:.17,cutoff:3000,duration:.45}};
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases,roles}},localStorage:{getItem:k=>k==='storyworld.r780.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>now},console,Math,Promise,setInterval:()=>0,
  soundProfiles:{enemyHit:[{path:'engine-hit.ogg'}],r541Death:[{path:'death.ogg'}]},setupAudio:()=>'base',started:true,modal:null,loading:false,
  player:{hp:10,hero:opt.hero||'hwando'},room:{id:'A',enemies:[]}};
 ctx.sound=function(kind){const rows=ctx.soundProfiles[kind]||[];played.push({kind,path:rows[0]?.path||null,n:rows.length});return Promise.resolve();};
 ctx.hitEnemy=function(e,v,s){if(!e||e.hp<=0)return false;e.hp-=v;ctx.sound('enemyHit');return true;};ctx.killEnemy=function(e){e.hp=0;e.deadRecorded=true;};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,err,api:ctx.window.__STORYWORLD_SFX_R780__,aliases,roles,adv:ms=>{now+=ms;},hit:(e,v,s)=>ctx.hitEnemy(e,v,s),last:()=>played[played.length-1]};}
(async()=>{
 if(!src){console.log('FAIL 모듈 없음 — 동작 검사 생략');process.exit(1);}
 let m=mk();ok(!m.err&&!!m.api,'모듈 로드('+(m.err&&m.err.message)+')');
 ok(m.roles.enemyHit.gain>=.22&&m.roles.enemyHit.gain<=.34,'적중 역할 배율 상향 .22~.34('+m.roles.enemyHit.gain+')');
 ok(m.roles.enemyHit.cutoff>=3400&&m.roles.enemyHit.cutoff<=4400,'적중 역할 저역통과 3.4~4.4kHz('+m.roles.enemyHit.cutoff+')');
 for(const h of HEROES){m=mk({hero:h});m.hit({hp:100,name:'몹'},5);const l=m.last();ok(l&&l.kind==='r780Hit_'+h&&l.n>=4,h+': 적 피격이 r780Hit_'+h+' 로 바뀜('+(l&&l.kind)+', rows '+(l&&l.n)+')');ok(m.aliases['r780Hit_'+h]==='enemyHit','r780Hit_'+h+' 별칭 enemyHit');}
 m=mk();m.hit({hp:100},5,{attackKind9:'skill'});ok(m.last().kind==='r780HitBig_hwando','스킬 적중은 낮은 피치 큰 타격음');
 m=mk();m.hit({hp:100},5,{attackKind9:'basic'});ok(m.last().kind==='r780Hit_hwando','기본공격 적중은 일반 타격음');
 m=mk();m.hit({hp:3},5);ok(m.last().kind==='r780Kill','체력이 0 이 되는 타격은 처치 마무리음');
 m=mk();let k=0;for(let i=0;i<10;i++){m.hit({hp:100},1);}ok(m.played.filter(p=>p.kind.startsWith('r780')).length===1,'같은 순간 10번 적중해도 한 번만(겹침 제한: '+m.played.length+')');
 m.adv(40);m.hit({hp:100},1);ok(m.played.length===1,'40ms 뒤에도 막힘');m.adv(60);m.hit({hp:100},1);ok(m.played.length===2,'100ms 뒤에는 통과');
 m=mk();for(let i=0;i<6;i++){m.adv(90);m.hit({hp:100},1);}const paths=m.played.length;ok(paths>=5&&paths<=6,'90ms 간격 연타는 대부분 통과('+paths+')');
 m=mk({hero:'lauren'});m.ctx.sound('enemyHit');ok(m.last().kind==='r780Hit_lauren','hitEnemy 밖(연쇄·패시브)에서 나는 enemyHit 도 무기 적중음');
 m=mk({pref:'0'});m.hit({hp:100},5);ok(m.last().kind==='enemyHit','storyworld.r780.sfx=0 이면 원래 소리');
 m=mk({hero:'unknown'});m.hit({hp:100},5);ok(m.last().kind==='enemyHit','모르는 영웅은 원래 소리');
 m=mk();ok(m.hit(null,5)===false&&m.played.length===0,'null 적은 소리 없음·오류 없음');
 m=mk();m.hit({hp:100,boss:true},5);ok(m.last().kind.startsWith('r780'),'보스 적중도 타격음');
 console.log('\n'+(n-bad)+'/'+n+' 통과, 실패 '+bad);process.exit(bad?1:0);})();
