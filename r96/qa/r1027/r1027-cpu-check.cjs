'use strict';
// R1027 영웅 '도트'(픽셀 아틀라스) 스킬 이펙트 → 칠한 프레임 시트, 주기적으로 뜨는 정지 버프 그림(보호막·회복 문장) → 프레임 애니메이션 — CPU 검사.
// 사용자 2026-11-14 "영웅들 스킬이펙트 아직 도트로 나오는것들 프레임애니메이션으로 개선 … 영웅들 버프? 같은 주기적으로 나오는 이미지 전수조사해서 어색한 부분 개선".
//  ① 빌드 연결(사본·태그 위치·verify 목록·pages.yml·manifest·시트 파일·index.json 해시)
//  ② 판정 classify(e): 영웅 쪽 PXF 사건(단계별) → 칠한 시트/숨김/그대로, 적 쪽·모르는 단계는 그대로, 정지 문장(보호막·회복)은 영웅 자리일 때만
//  ③ 경계: NaN 좌표·없는 영웅·끔 설정·나이<0·나이≥수명·수명 0 에서 던지지 않고 칸 번호가 범위 안
//  ④ 시트: 칸 수·크기가 index.json 과 같고, 실제 그림의 칸마다 알파가 있어 '정지 그림'이 아님(칸끼리 서로 다름)
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='hero-paint-r1027.js',src=rd(path.join(R,'client-source',NAME));
// ① 빌드 연결
ok(src.length>0,NAME+' 존재');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html')),tag='<script src="./'+NAME+'"></script>';
ok(html.includes(tag)&&html.indexOf(tag)>html.indexOf('<script src="./auto-move-r1022.js">')&&html.indexOf(tag)<html.indexOf('<script src="./combat-r118.js">'),'index.html 태그(auto-move-r1022 뒤·combat-r118 앞)');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'")&&rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'assets/r1027/'"),'verify-r96-public.py 기대 목록(파일·assets/r1027/)');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1027/r1027-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=rd(path.join(R,'runtime-manifest.json')),inp=rd(path.join(R,'runtime-inputs.json'));
ok(man.includes(NAME)&&inp.includes(NAME),'runtime-manifest·runtime-inputs 에 모듈');
const IDX=path.join(R,'runtime-text/assets/r1027/index.json');let idx=null;try{idx=JSON.parse(rd(IDX));}catch(_){}
ok(!!idx&&idx.sheets&&Object.keys(idx.sheets).length>=6,'assets/r1027/index.json 시트 6종 이상');
const sheets=idx?.sheets||{};
for(const [k,s] of Object.entries(sheets)){const f=path.join(R,'runtime-text',s.path||'');const buf=fs.existsSync(f)?fs.readFileSync(f):null;
 ok(!!buf&&crypto.createHash('sha256').update(buf).digest('hex')===s.sha256,`시트 ${k} 파일·해시 일치`);
 ok(!!s.path&&man.includes(s.path)&&inp.includes(s.path),`시트 ${k} manifest·inputs 등록`);
 ok(s.frames>=6&&s.cols*s.rows>=s.frames&&s.cellW>0&&s.cellH>0,`시트 ${k} 칸 정보(프레임 ${s.frames}≥6)`);
 ok(Array.isArray(s.cellStd)&&s.cellStd.length===s.frames&&s.cellAlpha.every(a=>a>0)&&s.distinctPairs>=Math.floor(s.frames*.6),`시트 ${k} 칸마다 그림 있고 서로 다름(정지 그림 아님: 다른 칸 쌍 ${s.distinctPairs}/${s.frames-1})`);}
// ② 판정 — 게임 전역을 흉내 낸 상자에서 모듈을 띄운다
function sandbox(prefs){const store=new Map();if(prefs)store.set('storyworld.r1027.paint',prefs);
 const ctx={};const w={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Date,Promise,Error,isFinite,setTimeout:()=>0,clearTimeout:()=>0,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  player:{hero:'neon',x:10,y:10,hp:50},time:5,effects:[],VFX:{barrier:'assets/vfx/generated/v300/barrier-sigil.webp',heal:'assets/vfx/generated/v300/healing-sigil.webp',blink:'assets/vfx/blink-afterimage.webp'},
  ctx,TILE:32,zoom:1,settings:{},project:(x,y)=>({x:x*32,y:y*32}),actorHeight:()=>60,readyImage:()=>null,ensureImages:()=>Promise.resolve(),
  drawEffect:function(){},fx:function(){},tick:function(){},enterRegion:async function(){}};
 w.window=w;w.globalThis=w;vm.createContext(w);try{vm.runInContext(src,w,{filename:NAME});}catch(e){console.log('load error',e.message);}return w;}
const W=sandbox(),A=W.__STORYWORLD_HERO_PAINT_R1027__;
ok(!!A&&typeof A.classify==='function'&&typeof A.frameAt==='function','전역 __STORYWORLD_HERO_PAINT_R1027__ (classify·frameAt·inspect)');
const C=(e,hero='neon')=>{if(!A)return'ERR';W.player.hero=hero;try{const r=A.classify(e);return r?(r.act==='hide'?'hide':r.sheet):null;}catch(err){return'THROW '+err.message;}};
const px=(key,stage,side='player',o={})=>({type:'pxfSprite',pxfKey:key,pxfStage:stage,pxfSide:side,x:10,y:10,age:.05,life:.5,...o});
// 적중: R411 영웅 적중 시트가 이미 있는 영웅은 도트만 숨김, 없는 헌터·미카엘라는 자기 칠한 적중
ok(C(px('melee-spark','hit'),'neon')==='hide','네온 기본 적중 도트 → 숨김(R437/R411 칠한 적중이 이미 나옴)');
ok(C(px('extra-01','hit'),'gunner')==='hide','덧붙임 적중(extra-01) → 숨김');
ok(C(px('pxf-08','hit'),'gunner')==='hide','기억사수 투사체 접촉(pxf-08) → 숨김(R912 칠한 적중)');
ok(C(px('melee-spark','hit'),'hunter')==='hit-hunter','헌터 기본 적중 → 칠한 헌터 적중');
ok(C(px('melee-spark','hit'),'michaela')==='hit-michaela','미카엘라 기본 적중 → 칠한 하트 적중');
ok(C(px('pxf-29','hit'),'slayer')==='hide','슬레이어 적중(pxf-29) → 숨김(R411 불꽃 적중)');
// 근접 휘두르기: 칠한 초승달 베기(영웅 색)
ok(C(px('claw-magic','attack'),'neon')==='slash-neon','네온 발톱 휘두르기 → 칠한 민트 베기');
ok(C(px('pxf-28','attack'),'slayer')==='slash-slayer','슬레이어 휘두르기(pxf-28) → 칠한 진홍 베기');
ok(C(px('pxf-05','attack'),'lauren')==='slash-lauren','라우렌 3타(pxf-05) → 칠한 바이올렛 베기');
ok(C(px('silver-slash','attack'),'lauren')==='slash-lauren','라우렌 은빛 베기 → 칠한 바이올렛 베기');
ok(C(px('extra-02','attack'),'lauren')==='hide','덧붙임 베기(extra-02) → 숨김(한 겹만)');
// 날아가는 탄 장식: R912 칠한 탄 시트가 이미 있음
ok(C(px('pxf-18','flight'),'seoha')==='hide','서하 기본탄 비행 도트 → 숨김');
ok(C(px('pxf-05','flight'),'gunner')==='hide','기억사수 기본탄 비행 도트 → 숨김');
// 방어·보호막·회복
ok(C(px('pxf-17','shield'),'michaela')==='barrier','보호막(pxf-17) → 칠한 보호막');
ok(C(px('pxf-17','blocked'),'michaela')==='barrier','보호막 소모 → 칠한 보호막');
ok(C(px('pxf-06','parry'),'hwando')==='barrier','패링 → 칠한 보호막');
ok(C(px('pxf-19','guard'),'slayer')==='barrier','슬레이어 막기(pxf-19) → 칠한 보호막');
ok(C(px('pxf-09','heal'),'seoha')==='mend','회복 틱(pxf-09) → 칠한 회복 고리');
// 그대로 두기(회귀)
ok(C(px('melee-spark','hit','enemy'),'neon')===null,'적 쪽 PXF → 그대로');
ok(C(px('pxf-23','revival','player'),'neon')===null,'모르는 단계(revival) → 그대로');
ok(C({type:'burst',x:10,y:10,age:0,life:.4},'neon')===null,'다른 효과(burst) → 그대로');
// 정지 문장: 영웅 자리일 때만
ok(C({type:'sigil',asset:W.VFX.barrier,x:10.1,y:10,age:0,life:.3,size:1.5},'neon')==='barrier','막기 보호막 문장(영웅 자리) → 칠한 보호막');
ok(C({type:'sigil',asset:'assets/r911/clean/assets/vfx/generated/v300/barrier-sigil.webp',x:10,y:10,age:0,life:.3},'neon')==='barrier','R911 정리본 경로 보호막 문장도 같은 판정');
ok(C({type:'sigil',asset:W.VFX.heal,x:10,y:10.2,age:0,life:.24,size:.55},'neon')==='mend','흡혈 회복 문장(작은 것) → 칠한 회복 고리');
ok(C({type:'sigil',asset:W.VFX.heal,x:10,y:10,age:0,life:.8,size:2},'neon')==='heal','레벨업 회복 문장(큰 것) → 칠한 회복');
ok(C({type:'sigil',asset:W.VFX.barrier,x:16,y:10,age:0,life:.3},'neon')===null,'영웅에서 먼 보호막 문장 → 그대로');
ok(C({type:'sigil',asset:W.VFX.barrier,x:13,y:10,age:.1,life:.55,r1027Hero:true},'neon')==='barrier','생길 때 영웅 자리였던 보호막 문장(영웅이 블링크로 떠남) → 칠한 보호막');
ok(C({type:'sigil',asset:W.VFX.blink,x:10,y:10,age:0,life:.4},'neon')===null,'블링크 잔상 → 그대로(이번 범위 밖)');
// ③ 경계
ok(C(px('melee-spark','hit','player',{x:NaN}),'hunter')===null,'NaN 좌표 → 그대로(던지지 않음)');
ok(C(px('melee-spark','hit'),'nobody')==='hide'||C(px('melee-spark','hit'),'nobody')===null,'모르는 영웅 → 던지지 않음');
ok(C(null)===null&&C(undefined)===null,'null 효과 → null');
const fa=(s,a,l)=>{try{return A.frameAt(s,a,l);}catch(e){return 'THROW';}};
ok(fa('barrier',0,.5)===0,'frameAt 시작=0');
ok(fa('barrier',.4999,.5)===sheets.barrier?.frames-1||fa('barrier',.4999,.5)===(sheets.barrier?.frames||24)-1,'frameAt 끝 직전=마지막 칸');
ok(fa('barrier',9,.5)===(sheets.barrier?.frames||24)-1,'frameAt 수명 넘음 → 마지막 칸');
ok(fa('barrier',-1,.5)===0&&fa('barrier',NaN,.5)===0&&fa('barrier',.2,0)===0&&fa('barrier',.2,NaN)===0,'frameAt 음수·NaN·수명 0 → 0');
ok(fa('nope',.1,.5)===0,'frameAt 모르는 시트 → 0');
const Woff=sandbox(JSON.stringify({on:false})),Aoff=Woff.__STORYWORLD_HERO_PAINT_R1027__;
ok(!!Aoff&&Aoff.classify(px('melee-spark','hit'))===null&&Aoff.classify({type:'sigil',asset:Woff.VFX.barrier,x:10,y:10,age:0,life:.3})===null,'끔(storyworld.r1027.paint {"on":false}) → 모두 그대로');
ok(!/ctx\.filter\s*=\s*['"][^'"]*(blur|drop-shadow)/.test(src),'게임 ctx.filter 에 blur·drop-shadow 안 씀(Three 기록기 규칙)');
ok(!/scale\([^)]*-1\s*\)|flipY/.test(src),'상하 반전 없음(십자가 규칙)');
console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
