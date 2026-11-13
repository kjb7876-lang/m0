// R1010 무한생존 미카엘라 결전·엔딩 — CPU 검사(정적 + 가짜 엔진).  node r96/qa/r1010/r1010-cpu-check.cjs
//  사용자 2026-11-13 06:58Z "무한생존 사몽역행 미카엘라 엔딩까지 구현", 08:23Z 결정 카드 "원문대로 매듭 4개 끊기"·"엔딩 뒤 결과 창",
//  08:24Z "음성없는곳은 향후 생성할 예정 보류", 08:25Z "영화모드,스토리모드,무한생존모드 기본적인건 모두 공유".
//  ① 미카엘라는 처치되지 않는다(체력 하한 · 0 으로 가는 길 없음) ② 매듭 4개를 차례대로 다 끊어야 끝난다(3개로는 안 끝남)
//  ③ 대면·매듭·엔딩 서사는 스토리 모드 원문(sz115 M-1~M-4 · R105 기록 표식 · R103 진료기록)을 그대로 재사용 — 원문 문단을 빠짐없이 순서대로
//  ④ 음성·브라우저 음성 합성 없음(녹음 보류) ⑤ 빌드 연결 다섯 곳.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS',m);};
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const F='survival-michaela-ending-r1010.js',src=rd('client-source',F);
// ---- 정적 ----
ok(src.length>0&&src===rd('runtime-text',F),'R1010 모듈이 있고 runtime-text 사본과 같음');
const html=rd('runtime-text','index.html');
ok(html.split('"./'+F+'"').length===2,'index.html 스크립트 태그 한 번');
ok(html.indexOf('"./'+F+'"')<html.indexOf('"./combat-r118.js"'),'combat-r118 앞(맨 끝 고정 줄을 건드리지 않음)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r1010\/r1010-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(strip(src)),'브라우저 음성 합성을 쓰지 않음(녹음 보류 — 대체 음성 없음)');
ok(!/addEventListener\(\s*['"]key/.test(strip(src)),'새 키 없음(상호작용 C 그대로, 스킬 키 늘리지 않음)');
ok(!/drop-shadow|blur\(/.test(strip(src)),'게임 ctx 에 drop-shadow·blur 필터 없음');
ok(!/(paras|text)\s*:\s*['"][가-힣]{12,}/.test(strip(src)),'서사 문장을 새로 쓰지 않음(원문은 공유 자료에서 읽음)');
// 공유 코드 재사용: 진료기록·에필로그는 R103 record 를 그대로 부르고, 끝난 뒤 갈 곳만 넘긴다(스토리는 지금처럼 leave).
const sm=rd('client-source','samong-r103.js');
ok(/function record\(after\)/.test(sm)&&/\(after\|\|leave\)/.test(sm),'R103 record(after) — 기본은 스토리 leave 그대로');
ok(/record:\s*\(?after\)?\s*=>\s*record\(/.test(sm)||/,record,/.test(sm),'R103 record 공개');
ok(sm===rd('runtime-text','samong-r103.js'),'samong-r103 runtime-text 사본 일치');
const sv=rd('client-source','survival-r600.js');ok(sv===rd('runtime-text','survival-r600.js'),'survival-r600 runtime-text 사본 일치');
ok(/finaleWave:/.test(sv)&&/function tickSpawn\(force\)/.test(sv),'R600 몹 물결을 결전에서 그대로 빌려 씀(finaleWave → tickSpawn(force))');

// ---- 가짜 엔진에서 원문·규칙 ----
const ctx={console,Math,JSON,Object,Array,String,Number,Set,Map,WeakMap,Promise,Date,isFinite,parseInt,setTimeout:()=>0,clearTimeout:()=>0,setInterval:()=>0,performance:{now:()=>0}};
ctx.window=ctx;ctx.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{},classList:{toggle(){},add(){},remove(){}}}),head:{appendChild(){}},body:{appendChild(){},classList:{toggle(){}}}};
ctx.room={id:'kair05'};
vm.createContext(ctx);
for(const f of ['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js',F])vm.runInContext(rd('client-source',f),ctx,{filename:f});
const Z=ctx.__STORYWORLD_SURVIVAL_FINALE_R1010__;ok(!!Z&&typeof Z.begin==='function'&&Z.pure,'R1010 API(begin·pure)');
const P=Z.pure,T=ctx.__STORYWORLD_SAMONG_TEXT_R103__.sections,paras=k=>T[k].blocks.flatMap(b=>b.paras);
// ① 체력: 하한(70%) 아래로, 0 으로 내려가지 않는다. 풀린 뒤에는 깎이지 않는다. NaN·Infinity 는 무시.
{let rel=false;const e={hp:1000,maxHp:1000};P.guardHp(e,.7,()=>rel);
 e.hp=500;ok(e.hp===700,'피해가 하한(최대 70%) 아래로 못 내림',e.hp);e.hp=0;ok(e.hp===700,'hp=0 도 하한으로',e.hp);e.hp=-1e9;ok(e.hp===700,'음수도 하한',e.hp);
 e.hp=NaN;ok(e.hp===700,'NaN 무시');e.hp=-Infinity;ok(e.hp===700,'-Infinity 무시');e.hp=900;ok(e.hp===900,'회복은 그대로');e.hp=850;ok(e.hp===850,'하한 위 피해는 그대로');
 rel=true;e.hp=0;ok(e.hp===850,'풀린 뒤에는 깎이지 않음(쓰러지지 않음)',e.hp);
 const e2={hp:0,maxHp:0};P.guardHp(e2,.7,()=>false);e2.hp=-5;ok(e2.hp>=1,'최대 체력 0 이어도 하한 1 이상(0 으로 가는 길 없음)',e2.hp);}
// ② 매듭 규칙: 차례대로, 4개 다 끊어야 끝.
{const N=4;let c=0;const r0=P.knotUse(c,2,N);ok(!r0.ok&&r0.why==='order'&&r0.want===0,'차례가 아닌 매듭은 안 끊김(스토리 "차례대로")',r0);
 for(let i=0;i<3;i++){const r=P.knotUse(c,i,N);ok(r.ok&&!r.done,'매듭 '+(i+1)+' 끊김, 아직 안 끝남',r);c=r.cut;}
 ok(c===3,'3개 끊은 상태');const r3=P.knotUse(c,3,N);ok(r3.ok&&r3.done&&r3.cut===4,'4번째에서야 끝남',r3);
 ok(!P.knotUse(1,0,N).ok&&P.knotUse(1,0,N).why==='cut','이미 끊은 매듭 다시 눌러도 그대로');ok(!P.knotUse(4,3,N).ok,'끝난 뒤 더 안 셈');
 ok(!P.knotUse(0,0,0).ok,'매듭이 없으면 끝나지 않음(경계)');ok(!P.knotUse(NaN,0,N).ok||P.knotUse(NaN,0,N).cut===1,'NaN 상태도 안전');}
// 매듭 자리: 4개, 서로 겹치지 않고(스토리 2.094 간격은 1·4번이 겹침) 무대 안, 숫자.
{const A={x0:10,y0:10,x1:90,y1:90};const pts=P.knotPoints({x:50,y:43},4,5,A);ok(pts.length===4&&pts.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)),'매듭 자리 4개 숫자',pts);
 let min=1e9;for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)min=Math.min(min,Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y));ok(min>3,'매듭끼리 3칸 넘게 떨어짐',min);
 const edge=P.knotPoints({x:11,y:11},4,5,A);ok(edge.every(q=>q.x>=A.x0+.8&&q.y>=A.y0+.8&&q.x<=A.x1-.8&&q.y<=A.y1-.8),'무대 가장자리에서도 안쪽',edge);}
// ③ 원문 재사용: 대면(M1 0~3) + 매듭 4개(M1 4~14) = M1 전부, 엔딩 = M2 + M3 + 종장 전부(순서대로), 매듭은 스토리 M-1 진술과 같은 4개.
{const join=l=>l.map(s=>s.text).join('\n\n');const m1=paras('M1');
 const cf=P.confrontScenes();ok(join(cf)===m1.slice(0,4).join('\n\n'),'대면 서사 = M1 문단 0~3 원문',cf.map(s=>s.text.slice(0,20)));
 const ks=P.knotRecords();ok(ks.length===4,'매듭 4개(스토리 M-1 진술 수)',ks.length);
 const kt=ks.map(k=>{const all=paras(k.key);const at=all.findIndex(t=>t.startsWith(k.sub));return all.slice(at,at+k.n).join('\n\n');});
 ok(kt.join('\n\n')===m1.slice(4).join('\n\n'),'매듭 4개 원문 = M1 문단 4~14 빠짐없이');
 ok(ks.every(k=>/^매듭 · /.test(k.label)),'매듭 이름표는 스토리 그대로(매듭 · …)',ks.map(k=>k.label));
 const en=P.endingScenes();const want=[...paras('M2'),...paras('M3'),...paras('epilogue')].join('\n\n');
 ok(join(en)===want,'엔딩 서사 = M2 + M3 + 종장 원문 전부, 순서대로',{got:en.length});
 ok(en.every(s=>s.id==='kair05'&&typeof s.key==='string'&&/^DREAM:sz115:sz115-M-[234]:/.test(s.key)),'엔딩 장면 키는 스토리 sz115 구역 키 그대로(나중에 녹음이 붙는 자리)',en.map(s=>s.key).slice(0,3));
 ok(P.ENDING_ZONES.join()==='sz115-M-2,sz115-M-3,sz115-M-4'&&P.ZONE==='sz115-M-1','스토리 구역 id 를 그대로 가리킴');}
console.log('ALL PASS',n);
