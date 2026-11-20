'use strict';
// R1265 히든 영웅 EGO 공격·스킬에 환도(흰·은·금) 이펙트가 섞이는 문제 CPU 검사
//  (사용자 2026-11-20 05:08Z "히든영웅 에고 기본공격시 왜 흰색 환도영웅 공격이펙트도 나가는지 전수조사 개선").
//  실패 먼저: ego-fx-split-r1265.js 가 없으면 실패한다.
//  완료 조건: EGO 형상(R1046 formActive, RC151 아님)일 때 렌더러가 받는 명령 가운데
//   ① 환도 기본·발도 베기 그림(R1041 발도·R302 환도 띠·R349 호·엔진 hwando-a·R590 납도 발검)과 환도 고유색 R100 시트(gold 항상, pale 은 소환 영웅이 없을 때) = 안 보이게(알파 0)
//   ② 환도 계보 수묵·검풍 그림(R945 확률 패시브·R590 연계·R1034) = EGO 언주·먹·흰 사본으로 바꿔 그림(새 그림 파일 없음)
//   ③ EGO 자기 그림(r1048·r1139·r1176·sig-*-red·페르소나 탄)·몸 그림·컷인·적 그림은 그대로 ④ 환도 본인·RC151 변신·꺼짐 때는 아무것도 안 바꿈
//   ⑤ 판정·피해·저장 안 건드림, 같은 명령을 두 번 거쳐도 한 번만 바뀜
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-fx-split-r1265.js',SRC=rd(path.join(R,'client-source',N));
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html'));ok(html.split('"./'+N+'"').length===2&&html.includes('<script src="./ego-form-r1176.js"></script>\n<script src="./'+N+'"></script>\n<script src="./persona-ink-r1097.js"></script>'),'태그 한 번: ego-form-r1176 바로 뒤, persona-ink-r1097 앞');}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1265/r1265-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(new RegExp("'"+N.replace(/\./g,'\\.')+"'").test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
ok(new RegExp(N.replace(/\./g,'\\.')).test(rd(path.join(R,'runtime-inputs.json')))&&new RegExp(N.replace(/\./g,'\\.')).test(rd(path.join(R,'runtime-manifest.json'))),'runtime-inputs·manifest 목록');
ok(SRC.length>0&&!/attackPower\s*=|\.hp\s*[-+*]?=|CD\s*=[^=]|saveGame\s*=|hitEnemy\(|\btick\s*=\s*function/.test(SRC),'판정·피해·대기·저장에 손대지 않음');
// 가짜 창: R1046 형상·R1157 소환 상태를 바꿔 가며 확인
function load(){const st={form:true,rc151:false,summon:0};const ls={m:new Map(),getItem(k){return this.m.has(k)?this.m.get(k):null;},setItem(k,v){this.m.set(k,String(v));}};
 const w={localStorage:ls,setInterval(){return 0;},addEventListener(){},__STORYWORLD_EGO_SOVEREIGN_R1046__:{formActive:()=>st.form,inspect:()=>({rc151:st.rc151})},
  __STORYWORLD_EGO_SUMMON_R1157__:{bodies:()=>Array.from({length:st.summon},()=>({}))}};w.window=w;const cx=vm.createContext(w);
 try{vm.runInContext(SRC,cx,{filename:N});}catch(e){return{err:String(e),st};}return{A:w.__STORYWORLD_EGO_FX_SPLIT_R1265__,st,w};}
const L=SRC?load():{err:'없음'};const A=L.A;ok(!!A&&!L.err,'문서·게임 없이도 실림(API 열림)',L.err);
if(!A){console.log(`\nR1265 cpu: ${n-bad}/${n} 통과`);process.exit(1);}
// ① 분류(순수)
const HIDE=['assets/r1041/fx-h6-hwando-iai.webp','assets/r302/fx/hwando/basic.webp','assets/r302/fx/hwando/special.webp','assets/r349/hwando-arc-r49.webp','assets/r349/hwando-arc.webp','assets/r349/hwando-a-r49.webp',
 'assets/vfx/heroes/hwando-a.webp','assets/r590/hwando-a-draw-cut.webp','assets/r100/sig-hit-gold.webp','assets/r100/sig-slash-gold.webp','assets/r100/sig-aura-gold.webp','assets/r100/sig-gather-gold.webp','./assets/r302/fx/hwando/basic.webp?v=3'];
const PALE=['assets/r100/sig-slash-pale.webp','assets/r100/sig-hit-pale.webp','assets/r100/sig-aura-pale.webp','assets/r100/sig-gather-pale.webp'];
const TINT=['assets/r945/hwando-ink-sweep.webp','assets/r945/hwando-orchid-slash.webp','assets/r945/hwando-ink-vapor.webp','assets/r945/hwando-ink-burst.webp','assets/r590/hwando-q-wind-blade.webp',
 'assets/r590/hwando-iai-ring.webp','assets/r590/hwando-e-delayed-flash.webp','assets/r590/hwando-r-finale-draw.webp','assets/r590/hwando-wind-tornado.webp','assets/r590/hwando-sigil-front.webp','r945:white','r945:blotw','r945:cloud'];
const KEEP=['assets/r1139/ego/trail-horizontal.webp','assets/r1139/ego/impact.webp','assets/r1048/fx/ego_slash.webp','assets/r1048/fx/ego_halo.webp','assets/r1048/ego/idle-e.webp','assets/r1176/ego2d/idle-front.webp',
 'assets/r100/sig-hit-red.webp','assets/r100/sig-aura-red.webp','assets/r100/sig-gather-red.webp','assets/r100/sig-hit-pink.webp','r1119:fx:lance-flight:4','r1139:ego:r106fx:slashline:255.198.72:214.222.234',
 'assets/r945/hwando-cutin-dosa.webp'/* 컷인은 R1100 몫 */,'assets/r143/attack/hwando/attack-e.webp'/* 몸 그림은 R1100·R1176 몫 */,'assets/r196/hwando/hit-e.webp','assets/hero_direction/hwando/walk-e.webp',
 'assets/final42-r88/effects/246/atlas.png'/* 모든 영웅 공통 타격 */,'assets/r190/blood/blood-splash.webp','assets/r912/pj09b-fly.webp','','r1265:ego:assets/r945/hwando-ink-sweep.webp','assets/r1041/fx-m1-michaela-halo.webp','assets/r302/fx/neon/basic.webp','assets/hwando-outdoor.webp'];
for(const p of HIDE)ok(A.classify(p)==='hide','가림: '+p,A.classify(p));
for(const p of PALE)ok(A.classify(p)==='pale','은빛(pale, 다른 영웅 보조색과 같은 시트): '+p,A.classify(p));
for(const p of TINT)ok(A.classify(p)==='tint','EGO 색 사본: '+p,A.classify(p));
for(const p of KEEP)ok(A.classify(p)===null,'그대로: '+JSON.stringify(p),A.classify(p));
for(const v of [null,undefined,3,{},[]])ok(A.classify(v)===null,'잘못된 값 → null: '+JSON.stringify(v));
// ② 색(순수): 흰 → 옅은 언주(흰 속은 아주 밝은 곳만), 중간 회색 → 언주, 짙은 먹 → 먹. 알파 바꾸지 않음.
const [wr,wg,wb]=A.tint(246,243,234),[mr,mg,mb]=A.tint(128,128,128),[dr,dg,db]=A.tint(14,14,18),[pr,pg,pb]=A.tint(255,255,255);
ok(wr-wb>=40&&wr>=200,'흰(246,243,234) → 옅은 언주(붉은 쪽이 파랑보다 40 이상 큼)',[wr,wg,wb]);
ok(mr>mg+50&&mr>mb+50&&mr>=110,'회색(128) → 언주(붉음)',[mr,mg,mb]);
ok(Math.max(dr,dg,db)<=40,'먹(14,14,18) → 먹 그대로 어둡게',[dr,dg,db]);
ok(pr>=240&&pg>=200,'아주 밝은 흰 속(255) → 흰 기운 남김',[pr,pg,pb]);
{let mono=true;let prev=-1;for(let v=0;v<=255;v+=5){const c=A.tint(v,v,v),L=c[0]*.3+c[1]*.59+c[2]*.11;if(L+1<prev)mono=false;prev=L;}ok(mono,'명도 차례 유지(밝을수록 밝음)');}
ok(A.tint(NaN,undefined,'x').every(v=>Number.isFinite(v)&&v>=0&&v<=255),'NaN·이상한 값도 0~255');
// ③ 명령 처리
const mk=(sp,o={})=>({kind:'image',sourcePath:sp,owner:{kind:o.owner||'effect'},style:{globalAlpha:o.a??1,filter:o.filter||'none'},image:o.image||null});
const fakeImg=()=>({width:4,height:2,naturalWidth:4,naturalHeight:2});
A.__setBake?.(im=>({width:im.width,height:im.height,naturalWidth:im.width,naturalHeight:im.height,baked:true}));
function run(state){Object.assign(L.st,{form:true,rc151:false,summon:0},state||{});const cmds=[...HIDE,...PALE,...TINT,...KEEP].map(p=>mk(p,{image:fakeImg()}));cmds.push({kind:'rect',style:{fillStyle:'#fff'}},null,mk('assets/r302/fx/hwando/basic.webp',{a:0}));const r=A.process(cmds);return{cmds,r};}
{const {cmds,r}=run();const by=p=>cmds.find(c=>c&&c.sourcePath===p||c&&c.r1265From===p);
 ok(HIDE.every(p=>by(p).style.globalAlpha===0),'EGO: 환도 베기·금빛 시트 전부 알파 0',HIDE.filter(p=>by(p).style.globalAlpha!==0));
 ok(PALE.every(p=>by(p).style.globalAlpha===0),'EGO(소환 없음): 환도 은빛 R100 시트 알파 0');
 const tinted=TINT.map(p=>by(p));ok(tinted.every(c=>c&&/^r1265:ego:/.test(c.sourcePath)&&c.image?.baked&&c.style.globalAlpha===1),'EGO: 수묵·검풍 그림은 EGO 색 사본(주소 r1265:ego:, 알파 그대로)',tinted.map(c=>c&&c.sourcePath));
 ok(KEEP.every(p=>{const c=cmds.find(c=>c&&c.sourcePath===p&&!c.r1265From);return c&&c.style.globalAlpha===1&&!c.image?.baked;}),'EGO 자기 그림·몸·컷인·공통 그림은 그대로');
 ok(r.hidden===HIDE.length+PALE.length&&r.tinted===TINT.length,'센 개수(가림·사본)',r);
 const again=A.process(cmds);ok(again.hidden===0&&again.tinted===0,'같은 명령을 두 번 거쳐도 다시 안 바꿈',again);}
{const {cmds,r}=run({summon:1});ok(PALE.every(p=>cmds.find(c=>c&&c.sourcePath===p).style.globalAlpha===1)&&HIDE.every(p=>cmds.find(c=>c&&c.sourcePath===p).style.globalAlpha===0),'소환 영웅이 있으면 은빛(pale, 소환 영웅 보조색) 시트는 남기고 환도 전용만 가림',r);}
for(const [st,m] of [[{form:false},'환도 본인(형상 꺼짐)'],[{rc151:true},'RC151 변신 중']]){const {cmds,r}=run(st);ok(r.hidden===0&&r.tinted===0&&cmds.every(c=>!c||c.kind!=='image'||((c.style.globalAlpha===1||c.sourcePath==='assets/r302/fx/hwando/basic.webp')&&!c.r1265From)),m+': 아무것도 안 바꿈',r);}
{A.set(false);const {r}=run();ok(r.hidden===0&&r.tinted===0,'끄기(set false) → 안 바꿈');A.set(true);ok(L.w.localStorage.getItem('storyworld.r1265.egoFxSplit')==='{"on":true}','끄기 저장 열쇠 하나');}
{const {r}=run();ok(r.hidden>0,'다시 켜면 동작');}
ok(A.process(null).hidden===0&&A.process([{kind:'image'}]).hidden===0,'빈·이상한 입력에도 안전');
// 원본 이미지 없으면 사본 대신 그대로(투명 이펙트 없음)
{Object.assign(L.st,{form:true});const c=mk('assets/r945/hwando-ink-sweep.webp',{image:null});A.process([c]);ok(c.style.globalAlpha===1&&c.sourcePath==='assets/r945/hwando-ink-sweep.webp','그림이 아직 없으면 원래 명령 그대로(사라지지 않음)');}
console.log(`\nR1265 cpu: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
