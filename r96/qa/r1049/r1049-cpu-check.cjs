'use strict';
// R1049 효과음 대규칙·전수 대조·크게 엇나간 소리 고침·빈칸 3종 — CPU 검사(브라우저 없이, 귀로 듣는 검증 아님).
// 사용자 2026-11-15 09:00Z "진행" · 09:01Z "대규칙 너가 게임에 맞게 세우고 효과음 조사해서 크게 엇나가는것들은 재생성하던가 무료효과음개선적용해줘".
//  ① 대규칙: docs/sound-rules.md 가 있고 sound-rules.json 의 큰 위반 규칙(M1~M8)과 목표 수치를 모두 적는다
//  ② 전수 대조: scripts/audit-sfx-r1049.py 결과(재생 사슬 흉내 뒤 측정) — 1,200줄 이상, 오류 0, 고치기 전 큰 위반이 있었고 고친 뒤 쓰이는 소리의 큰 위반 0
//  ③ 파생본: 고친 파일은 원본을 덮지 않고 assets/r1049/sfx 에 새로 두며, 원본 경로·근거·sha256 이 index.json 에 있고 파일이 실제와 같다
//  ④ 빈칸 3종: 발걸음·저체력 심장·레벨업 음원이 있고 대규칙(150Hz 아래·2~5kHz·피크) 안이며 출처(plinkfx CC0)가 적혀 있다
//  ⑤ 연결: R993 범주표에 새 종류 3개(발걸음 low·경고 mid·UI high), 쾌적 계층 별칭, 빌드 연결(사본·태그·verify·pages.yml·manifest)
//  ⑥ 동작(vm): 경로 바꿔 끼우기(R1026 파생 경로 포함), 발걸음은 움직일 때·가까운 적 없을 때만·보폭마다, 심장은 체력 30% 아래만·죽으면 멈춤,
//     레벨업은 레벨이 1~3 오를 때만 늦춰서 한 번, 창(modal)·로딩 중 무음, 끄기 storyworld.r1049.sfx=0, NaN 입력에도 던지지 않음
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const js=f=>{try{return JSON.parse(rd(f));}catch(_){return null;}};
const NAME='sfx-rules-r1049.js',src=rd(path.join(R,'client-source',NAME));
// ① 대규칙
const rules=js(path.join(R,'qa/r1049/sound-rules.json'))||{major:{},target:{}},doc=rd(path.join(ROOT,'docs/sound-rules.md'));
ok(doc.length>2000,'docs/sound-rules.md 있음');
for(const id of Object.keys(rules.major))ok(doc.includes(id),'규칙 문서에 '+id);
ok(Object.keys(rules.major).length>=8,'큰 위반 규칙 8개 이상');
for(const w of ['영웅','보스','EGO','발걸음','심장','150Hz','2~5kHz','plinkfx','CC0'])ok(doc.includes(w),'규칙 문서에 "'+w+'"');
// ② 전수 대조
const before=js(path.join(R,'qa/r1049/sfx-audit-before.json')),after=js(path.join(R,'qa/r1049/sfx-audit.json'));
ok(before&&before.rows>=1200&&before.errors===0,'고치기 전 전수 1,200줄 이상·오류 0');
ok(before&&before.majorRows>0,'고치기 전 큰 위반이 있었다(검사가 무언가를 잡는다)');
ok(after&&after.rows===(before&&before.rows)&&after.errors===0,'고친 뒤 같은 줄 수·오류 0');
ok(after&&after.mode==='after'&&after.majorRows===0,'고친 뒤 쓰이는 소리의 큰 위반 0 (지금 '+(after&&after.majorRows)+')');
// ③ 파생본
const idx=js(path.join(R,'runtime-text/assets/r1049/sfx/index.json'))||{remap:{},gaps:{}};const rm=idx.remap||{};
const bmaj=before?before.table.filter(r=>r.reach==='쓰임'&&r.violations.length):[];
const fixed=new Set(Object.keys(rm));
ok(bmaj.length>0&&bmaj.every(r=>fixed.has(r.played)||fixed.has(r.path)),'고치기 전 큰 위반 파일마다 파생본이 있다');
let shaOk=true,origOk=true,why=true;for(const [from,v] of Object.entries(rm)){const f=path.join(R,'runtime-text',v.path);
 if(!fs.existsSync(f)||crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')!==v.sha256)shaOk=false;
 if(!v.path.startsWith('assets/r1049/sfx/')||v.path===from)origOk=false;if(!Array.isArray(v.fixed)||!v.fixed.length)why=false;}
ok(Object.keys(rm).length>0&&shaOk,'파생본 파일·sha256 일치');ok(origOk,'파생본은 새 경로(원본 덮지 않음)');ok(why,'파생본마다 고친 규칙이 적혀 있다');
// ④ 빈칸 3종
const gaps=idx.gaps||{};const GK=['r1049Step','r1049Heart','r1049LevelUp'];
for(const k of GK){const g=gaps[k];ok(g&&Array.isArray(g.files)&&g.files.length>=2,k+' 변주 2개 이상');
 const allIn=g&&g.files.every(f=>fs.existsSync(path.join(R,'runtime-text',f.path))&&f.low150<=.08+1e-9&&f.harsh<=.35+1e-9&&f.peakDb<=-9+1e-9&&f.peakDb>=-14-1e-9);
 ok(!!allIn,k+' 대규칙 안(150Hz 아래 8%·2~5kHz 35%·피크 −9~−14dB)');ok(g&&/plinkfx/.test(g.source||'')&&/CC0/.test(g.license||''),k+' 출처·라이선스');}
// ⑤ 연결
const r993=rd(path.join(R,'client-source/sfx-mix-r993.js'));
ok(/\['발걸음','step',\/\^r1049Step\$\/,[^\]]*'low'\]/.test(r993),'R993 범주: 발걸음 low');
ok(/\['경고','heart',\/\^r1049Heart\$\/,[^\]]*'mid'\]/.test(r993),'R993 범주: 저체력 경고 mid');
ok(/\['UI·보상','ui',\/[^\n]*r1049LevelUp\$/.test(r993),'R993 범주: 레벨업 = UI·보상');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(rd(path.join(R,'runtime-text/sfx-mix-r993.js'))===r993,'R993 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html')),tag='<script src="./'+NAME+'"></script>';
ok(html.includes(tag)&&html.indexOf(tag)>html.indexOf('<script src="./sfx-punch-r1026.js">')&&html.indexOf(tag)<html.indexOf('<script src="./combat-r118.js">'),'index.html 태그(R1026 뒤·combat-r118 앞)');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1049/r1049-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=rd(path.join(R,'runtime-manifest.json'))+rd(path.join(R,'runtime-inputs.json'));
ok(man.includes(NAME)&&Object.values(rm).every(v=>man.includes(v.path))&&GK.every(k=>(gaps[k]?.files||[]).every(f=>man.includes(f.path))),'manifest·inputs 에 새 js·음원');
// ⑥ 동작
function world(opt={}){const calls=[],store=Object.assign({},opt.store||{});const timers=[];
 const sb={console,Math,JSON,Object,Array,Number,String,Map,Set,WeakMap,Date,Error,isFinite,
  performance:{now:()=>sb.__now*1000},__now:0,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  document:{readyState:'complete',hidden:false,addEventListener(){}},
  setInterval:(f,ms)=>{timers.push(f);return timers.length;},setTimeout:(f,ms)=>{timers.push(f);return timers.length;},clearInterval(){},
  soundProfiles:{r955Hit_x:[{path:'assets/r955/sfx/hit-a.ogg',gain:.5}],r955Die_y:[{path:'assets/r1026/sfx/r955-die-b.ogg',gain:.5}],keep:[{path:'assets/keep.ogg',gain:.5}]},
  register(){},started:true,modal:null,loading:false,time:0,
  player:{x:0,y:0,hp:100,level:3,moving:false,hero:'hwando'},
  maxHP:()=>100,liveEnemies:()=>sb.__enemies,__enemies:[],
  sound:(k)=>{calls.push(k);}};
 sb.window=sb;sb.window.addEventListener=()=>{};sb.window.__STORYWORLD_SFX_COMFORT__={aliases:{}};
 vm.createContext(sb);
 // 파생본 표는 index.json 이 아니라 js 안 표를 쓴다 — 검사용으로 가짜 표를 넣을 수 있게 한다
 sb.__R1049_TEST_REMAP__=opt.remap||{'assets/r955/sfx/hit-a.ogg':'assets/r1049/sfx/r955-hit-a.ogg','assets/r955/sfx/die-b.ogg':'assets/r1049/sfx/r955-die-b.ogg','assets/r1026/sfx/r955-die-b.ogg':'assets/r1049/sfx/r955-die-b.ogg'};
 try{vm.runInContext(src,sb,{filename:NAME});}catch(e){console.log('load error',e.message);}
 const A=sb.__STORYWORLD_SFX_RULES_R1049__;
 const step=(sec,f)=>{for(let t=0;t<sec;t+=.05){sb.__now+=.05;sb.time+=.05;if(f)f(sb);A&&A.observe(sb.__now);}};
 return {sb,A,calls,step};}
{const {sb,A}=world();ok(!!A&&typeof A.observe==='function','API __STORYWORLD_SFX_RULES_R1049__.observe');
 ok(sb.soundProfiles.r955Hit_x[0].path==='assets/r1049/sfx/r955-hit-a.ogg','경로 바꿔 끼우기(원본 경로)');
 ok(sb.soundProfiles.r955Die_y[0].path==='assets/r1049/sfx/r955-die-b.ogg','경로 바꿔 끼우기(R1026 파생 경로)');
 ok(sb.soundProfiles.keep[0].path==='assets/keep.ogg','상관없는 경로는 그대로');
 ok(GK.every(k=>Array.isArray(sb.soundProfiles[k])&&sb.soundProfiles[k].length>=2),'빈칸 3종 프로필 등록');
 ok(sb.window.__STORYWORLD_SFX_COMFORT__.aliases.r1049Step==='dodge','쾌적 계층 별칭: 발걸음 → dodge(짧은 길이)');}
// 발걸음
{const {sb,calls,step}=world();sb.player.moving=true;step(3,s=>{s.player.x+=4.75*.05;});const k=calls.filter(c=>c==='r1049Step').length;
 ok(k>=5&&k<=9,'발걸음: 3초 걷기(보폭 1.9)에 5~9번 (지금 '+k+')');}
{const {sb,calls,step}=world();sb.player.moving=false;step(3);ok(!calls.includes('r1049Step'),'발걸음: 서 있으면 없음');}
{const {sb,calls,step}=world();sb.player.moving=true;sb.__enemies=[{x:3,y:0,hp:10}];step(3,s=>{s.player.x+=4.75*.05;s.__enemies[0].x=s.player.x+3;});ok(!calls.includes('r1049Step'),'발걸음: 가까운 적(7칸 안) 있으면 없음');}
{const {sb,calls,step}=world();sb.player.moving=true;sb.__enemies=[{x:30,y:0,hp:10}];step(3,s=>{s.player.x+=4.75*.05;});ok(calls.includes('r1049Step'),'발걸음: 먼 적은 상관없음');}
{const {sb,calls,step}=world();sb.player.moving=true;step(1,s=>{s.player.x+=40;});ok(calls.filter(c=>c==='r1049Step').length<=3,'발걸음: 순간이동(큰 점프)은 발걸음으로 안 셈');}
// 심장
{const {sb,calls,step}=world();sb.player.hp=25;step(5);const k=calls.filter(c=>c==='r1049Heart').length;ok(k>=4&&k<=6,'심장: 체력 25% 에서 5초에 4~6번 (지금 '+k+')');}
{const {sb,calls,step}=world();sb.player.hp=10;step(5);const k=calls.filter(c=>c==='r1049Heart').length;ok(k>=6&&k<=8,'심장: 체력 10% 는 더 빠르게 6~8번 (지금 '+k+')');}
{const {sb,calls,step}=world();sb.player.hp=31;step(5);ok(!calls.includes('r1049Heart'),'심장: 체력 31% 는 없음');}
{const {sb,calls,step}=world();sb.player.hp=0;step(5);ok(!calls.includes('r1049Heart'),'심장: 쓰러지면 없음');}
{const {sb,calls,step}=world();sb.player.hp=20;sb.modal={};step(5);ok(!calls.includes('r1049Heart'),'심장: 창 열림 중 없음');}
// 레벨업
{const {sb,calls,step}=world();step(.5);sb.player.level=4;step(.5);const early=calls.includes('r1049LevelUp');step(1.5);
 ok(!early&&calls.filter(c=>c==='r1049LevelUp').length===1,'레벨업: 늦춰서(지역 완료음 뒤) 한 번');}
{const {sb,calls,step}=world();step(.5);sb.player.level=777;step(2);ok(!calls.includes('r1049LevelUp'),'레벨업: 큰 점프(치트·불러오기)는 없음');}
{const {sb,calls,step}=world();step(.5);sb.player={...sb.player,level:9,hero:'neon'};step(2);ok(!calls.includes('r1049LevelUp'),'레벨업: 영웅 바뀜(새 player)은 없음');}
// 끄기·이상 입력
{const {sb,calls,step}=world({store:{'storyworld.r1049.sfx':'0'}});sb.player.moving=true;sb.player.hp=10;step(3,s=>{s.player.x+=.24;});
 ok(calls.length===0&&sb.soundProfiles.r955Hit_x[0].path==='assets/r955/sfx/hit-a.ogg','끄기 storyworld.r1049.sfx=0: 소리·바꿔 끼우기 없음');}
{const {sb,A}=world();let threw=false;try{sb.player.x=NaN;sb.player.hp=NaN;sb.player.level=NaN;A.observe(NaN);A.observe(1);sb.player=null;A.observe(2);}catch(e){threw=true;}ok(!threw,'NaN·null 입력에도 던지지 않음');}
console.log(`\nR1049 CPU: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
