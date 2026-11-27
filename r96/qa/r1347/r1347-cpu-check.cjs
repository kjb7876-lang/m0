// R1347 3D 검사 영웅(슬레이어·환도·EGO) 검술 연속 동작 — 정적·순수 함수 검사(브라우저 없음).
//  사용자 11-26 14:31Z 두 번째 영상(무예도보통지 예도 총도)도 녹여 달라 → 정수리 내려치기·역횡베기·낮게 찌르기 셋을 더해 여덟 동작.
//  사용자 11-26: "슬레이어랑 환도 그리고 ego각성영웅 공격모션 특히 검술 여러모션으로 / 이 영상 모션 분석해서 이 검술 토대로 적용".
//  영상(조선 검법 시연 33초) 분석 → 다섯 동작: 내려베기(3.0~4.2초)·올려베기(4.2~5.4초)·찌르기(0~1.2초, 14.4~15초)·
//  횡베기(2.4~3.0초)·감아베기(머리 위로 감아 돌려 내려벰, 7.0~8.2초). 기본 공격마다 차례로 번갈아 나온다.
//  ① 연결: 원본 = runtime-text 사본, 스크립트 태그 한 번(R1309·R1320 자세 보정 뒤), 공개 검증 목록·매니페스트·CI 줄.
//  ② 동작 표: 다섯 동작·이름, 대상 영웅은 slayer·hwando·ego 셋뿐.
//  ③ 표본(sample): 0·1 끝은 대기 자세(섞기 0), 중간은 끊김 없이 이어짐, NaN·범위 밖 t 도 유한값.
//  ④ 동작이 서로 다름: 타격 순간 칼끝 자리·칼날 방향이 서로 멀다.
//  ⑤ 동작마다 영상 특징: 내려베기 위→아래, 올려베기 아래→위, 찌르기 팔을 앞으로 뻗고 칼날 수평 정면, 횡베기 오른쪽→왼쪽 수평, 감아베기 머리 뒤로 감았다 오른쪽 아래로.
//  ⑥ 팔이 닿는 거리 안, 칼끝이 땅을 뚫지 않음.
//  ⑦ 연속 순서(nextMove): 이어 치면 0→1→2→3→4→0, 쉬면(1.6초 넘게) 처음부터, 영웅이 바뀌면 처음부터. 경계: NaN 시각.
//  ⑧ 공격 시작 읽기(tracker): R1302 와 같은 규칙(.5초 클립, 70% 지나 다시 누르면 새 공격, 계속 누르면 .5초마다 새 공격).
//  ⑨ 손대지 않은 것: hwando-3d-r1302.js·R1320·R1309 전역을 쓰기만, 렌더 뒤 되돌림·끄기 키.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}};
const F='hero-sword-combo-3d-r1347.js',src=rd('client-source/'+F)||'';
ok(src.length>0&&src===rd('runtime-text/'+F),'① 오버레이 원본 = runtime-text 사본');
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
ok(at(F)>0&&['hwando-3d-r1302.js','slayer-blade-3d-r1309.js','hero-weapons-3d-r1313.js','hero-stance-3d-r1320.js','hwando-sword-07-3d-r1320.js'].every(n=>at(n)>0&&at(n)<at(F))&&html.split(F).length===2,'① 스크립트 태그 한 번, R1302·R1309·R1313·R1320 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'① 공개 검증 목록');
ok((rd('runtime-manifest.json')||'').includes(F)&&(rd('runtime-inputs.json')||'').includes(F),'① 매니페스트·입력 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1347/r1347-cpu-check.cjs'),'① CI 줄');
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console,isFinite};
vm.createContext(sb);let loadErr=null;try{vm.runInContext(src,sb,{filename:F});}catch(e){loadErr=e;}
const api=win.__STORYWORLD_SWORD_COMBO_R1347__,P=api?.pure;
ok(!loadErr&&api&&P&&api.on()===true,'순수 함수 불러옴, 기본 켜짐'+(loadErr?' '+loadErr:''));
if(!P){console.log('\nR1347 검술 CPU FAIL');process.exit(1);}
const len=a=>Math.hypot(...a),sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),fin=a=>Array.isArray(a)&&a.every(Number.isFinite),unit=a=>a.map(x=>x/len(a));
const ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(unit(a),unit(b)))))*180/Math.PI,r2=a=>Array.isArray(a)?a.map(x=>+x.toFixed(2)):+(+a).toFixed(2);
// ② 동작 표
const IDS=['down','rise','thrust','sweep','chop','backsweep','lunge','wrap'],HEROES=['slayer','hwando','ego'];
ok(JSON.stringify(P.MOVES.map(m=>m.id))===JSON.stringify(IDS),'② 여덟 동작 순서(영상1 다섯 + 영상2 셋, 번갈아): '+P.MOVES.map(m=>m.id+'('+m.name+')').join(' → '));
ok(P.MOVES.every(m=>typeof m.name==='string'&&m.name.length>=2&&typeof m.video==='string'),'② 동작마다 이름·영상 구간 기록');
ok(JSON.stringify(api.heroes().slice().sort())===JSON.stringify(HEROES.slice().sort()),'② 대상 영웅 = 슬레이어·환도·EGO ('+api.heroes()+')');
const BL={slayer:.95,hwando:.78,ego:.78};// 칼 길이(모델 단위, 실측 근사)
const tip=s=>s.at.map((x,i)=>x+s.dir[i]*1);// 칼끝 방향 점(칼 길이 1 기준)
// ③ 표본
for(const h of HEROES){
 const s0=P.sample(h,0,0),s1=P.sample(h,0,1);ok(s0.env===0&&s1.env===0&&P.sample(h,0,.5).env===1,`③ ${h}: 처음·끝은 섞기 0, 가운데는 1`);
 const rest=P.rest(h);for(let m=0;m<IDS.length;m++){const a=P.sample(h,m,0),b=P.sample(h,m,1);ok(len(sub(a.at,rest.at))<1e-6&&ang(a.dir,rest.dir)<.5&&len(sub(b.at,rest.at))<1e-6&&ang(b.dir,rest.dir)<.5,`③ ${h} ${IDS[m]}: 대기 자세에서 시작·끝`);}
 let worst=0,bad=0;for(let m=0;m<IDS.length;m++){let prev=null;for(let t=0;t<=1.0001;t+=.005){const s=P.sample(h,m,t);if(!fin(s.at)||!fin(s.dir)||!Number.isFinite(s.twist)||!Number.isFinite(s.lean))bad++;const q=s.at.map((x,i)=>x+unit(s.dir)[i]*BL[h]);if(prev)worst=Math.max(worst,len(sub(q,prev)));prev=q;}}
 ok(bad===0&&worst<=.12,`③ ${h}: 칼끝이 끊김 없이 이어짐 (.005 마다 가장 큰 이동 ${r2(worst)}, 기준 .12)`);
 const e=[P.sample(h,0,NaN),P.sample(h,0,-3),P.sample(h,0,9),P.sample(h,99,.5),P.sample(h,-1,.5)];ok(e.every(s=>fin(s.at)&&fin(s.dir)&&Number.isFinite(s.env)),'③ '+h+' 경계: NaN·범위 밖 t·동작 번호 → 유한값');
}
ok(P.sample('gunner',0,.5)===null&&P.sample('michaela',1,.5)===null,'③ 다른 영웅은 표본 없음(손대지 않음)');
// ④ 서로 다름(타격 순간)
// 칼끝이 지나는 길(t .15~.85) 평균 거리 — 동작 두 개가 같은 길을 그리면 '여러 모션'이 아니다.
for(const h of HEROES){const path=i=>{const a=[];for(let t=.15;t<=.851;t+=.025)a.push(tip(P.sample(h,i,t)));return a;};const ps=IDS.map((_,i)=>path(i));let dmin=9,pair='';
 for(let i=0;i<IDS.length;i++)for(let j=i+1;j<IDS.length;j++){const d=ps[i].reduce((s,q,k)=>s+len(sub(q,ps[j][k])),0)/ps[i].length;if(d<dmin){dmin=d;pair=IDS[i]+'·'+IDS[j];}}
 ok(dmin>=.35,`④ ${h}: 여덟 동작의 칼끝 길이 서로 다름 (가장 닮은 ${pair} 평균 거리 ${r2(dmin)}≥.35)`);}
// ⑤ 영상 특징(환도 기준 표, 슬레이어·EGO 도 같은 틀)
for(const h of HEROES){const S=(m,t)=>P.sample(h,IDS.indexOf(m),t),mv=m=>P.MOVES[IDS.indexOf(m)];
 {const w=S('down',mv('down').windup),k=S('down',mv('down').strike+.12);ok(tip(w)[1]>=.3&&tip(k)[1]<=-.5&&w.twist<0&&k.twist>0,`⑤ ${h} 내려베기: 칼끝 어깨 위(${r2(tip(w)[1])}) → 허리 아래(${r2(tip(k)[1])}), 몸을 오른쪽으로 틀었다 왼쪽으로`);}
 {const w=S('rise',mv('rise').windup),k=S('rise',mv('rise').strike+.12);ok(tip(w)[1]<=-.5&&tip(k)[1]>=.3,`⑤ ${h} 올려베기: 칼끝 허리 아래(${r2(tip(w)[1])}) → 어깨 위(${r2(tip(k)[1])})`);}
 {const w=S('thrust',mv('thrust').windup),k=S('thrust',mv('thrust').strike);ok(k.at[2]-w.at[2]>=.3&&k.at[2]>=.4&&unit(k.dir)[2]>=.9&&k.lean>=8,`⑤ ${h} 찌르기: 손을 앞으로 뻗음(${r2(w.at[2])}→${r2(k.at[2])}), 칼날 정면 수평(${r2(unit(k.dir))}), 앞으로 숙임 ${r2(k.lean)}°`);}
 {const w=S('sweep',mv('sweep').windup),k=S('sweep',mv('sweep').strike+.12);ok(tip(w)[0]<=-.4&&tip(k)[0]>=.4&&Math.abs(unit(k.dir)[1])<=.4&&Math.abs(unit(w.dir)[1])<=.4,`⑤ ${h} 횡베기: 칼끝 오른쪽(x ${r2(tip(w)[0])}) → 왼쪽(x ${r2(tip(k)[0])}), 수평`);}
 {const mv5=mv('wrap'),a=S('wrap',mv5.windup),k=S('wrap',mv5.strike+.12);ok(a.at[1]>=.2&&unit(a.dir)[2]<=-.3&&tip(k)[1]<=-.4&&tip(k)[0]<=-.2,`⑤ ${h} 감아베기: 손 머리 위·칼끝 뒤로(${r2(a.at)}, ${r2(unit(a.dir))}) → 오른쪽 아래로(${r2(tip(k))})`);}
}
for(const h of HEROES){const S=(m,t)=>P.sample(h,IDS.indexOf(m),t),mv=m=>P.MOVES[IDS.indexOf(m)];
 {const w=S('chop',mv('chop').windup),k=S('chop',mv('chop').strike+.12);ok(tip(w)[1]>=.5&&unit(w.dir)[2]<=-.3&&tip(k)[1]<=-.3&&Math.abs(tip(k)[0])<=.35&&Math.abs(w.twist)<=10,`⑤ ${h} 정수리 내려치기(영상2): 칼을 머리 위 뒤로 곧게(${r2(tip(w))}) → 몸 앞 가운데 아래로(${r2(tip(k))}), 몸 틀기 없이`);}
 {const w=S('backsweep',mv('backsweep').windup),k=S('backsweep',mv('backsweep').strike+.12);ok(tip(w)[0]>=.4&&tip(k)[0]<=-.4&&Math.abs(unit(k.dir)[1])<=.3&&w.twist>0&&k.twist<0,`⑤ ${h} 역횡베기(영상2): 칼끝 왼쪽(x ${r2(tip(w)[0])}) → 오른쪽(x ${r2(tip(k)[0])}), 횡베기와 반대로`);}
 {const k=S('lunge',mv('lunge').strike),t=S('thrust',mv('thrust').strike);ok(k.at[1]<=t.at[1]-.1&&k.lean>=t.lean+8&&unit(k.dir)[2]>=.9&&k.at[2]>=.4,`⑤ ${h} 낮게 찌르기(영상2): 찌르기보다 손이 낮고(${r2(k.at[1])} < ${r2(t.at[1])}) 더 숙여(${r2(k.lean)}°) 길게 뻗음`);}
}
// ⑥ 닿는 거리·땅
for(const h of HEROES){let far=0,low=9;for(let m=0;m<IDS.length;m++)for(let t=0;t<=1;t+=.01){const s=P.sample(h,m,t);far=Math.max(far,len(s.at));low=Math.min(low,s.at[1]+unit(s.dir)[1]*BL[h]);}
 ok(far<=.58,`⑥ ${h}: 손 자리가 팔 길이 안 (어깨에서 가장 먼 ${r2(far)}≤.58)`);ok(low>=-1.25,`⑥ ${h}: 칼끝이 땅 위 (어깨 기준 가장 낮은 ${r2(low)}≥-1.25, 어깨 높이 약 1.42)`);}
// ⑦ 연속 순서
{let s=null;const seq=[];for(const t of [0,.5,1,1.5,2,2.5,3,3.5,4])seq.push((s=P.nextMove(s,t,'hwando')).idx);ok(JSON.stringify(seq)==='[0,1,2,3,4,5,6,7,0]','⑦ 이어 치면 0→1→…→7→0 ('+seq+')');
 s=P.nextMove(s,4+2.0,'hwando');ok(s.idx===0,'⑦ 1.6초 넘게 쉬면 처음부터 ('+s.idx+')');
 s=P.nextMove(s,6.4,'hwando');s=P.nextMove(s,6.7,'slayer');ok(s.idx===0,'⑦ 영웅이 바뀌면 처음부터');
 s=P.nextMove(s,7.1,'slayer');ok(s.idx===1,'⑦ 바뀐 영웅도 이어 치면 다음 동작');
 const n=P.nextMove(s,NaN,'slayer');ok(n&&Number.isInteger(n.idx)&&n.idx>=0&&n.idx<8,'⑦ 경계: NaN 시각 → 유효한 동작 번호');
 const z=P.nextMove(null,0,'hwando');ok(z.idx===0,'⑦ 처음 공격 = 내려베기');}
// ⑧ 공격 시작 읽기
{const tr=P.tracker();let starts=0,t=0;for(let i=0;i<200;i++){t+=1/60;const r=tr.feed(t,.2,false);if(r.start)starts++;}
 ok(starts>=6&&starts<=7,'⑧ 계속 누르면 .5초마다 새 공격 (3.3초에 '+starts+'번)');
 const tr2=P.tracker();let st2=0,a=0,t2=0,prog=[];for(let i=0;i<120;i++){t2+=1/60;if(i===0||i===30)a=.24;else a=Math.max(0,a-1/60);const r=tr2.feed(t2,a,false);if(r.start){st2++;}prog.push(r.t);}
 ok(st2===2,'⑧ .5초 간격 두 번 누름 → 새 공격 두 번 ('+st2+')');
 const tr3=P.tracker();let st3=0;for(let i=0;i<60;i++){const a2=i===0||i===10?.24:0;const r=tr3.feed(i/60,a2,false);if(r.start)st3++;}
 ok(st3===1,'⑧ 70% 전에 다시 누르면 새 공격 아님(R1302 와 같게) ('+st3+')');
 const tr4=P.tracker();const r4=tr4.feed(1,0,true);ok(!r4.active,'⑧ 걷기만 하면 공격 아님');
 const tr5=P.tracker();const r5=tr5.feed(NaN,.2,false);ok(r5&&Number.isFinite(r5.t),'⑧ 경계: NaN 시각 → 유한값');}
// ⑨ 손대지 않은 것
ok(!/__STORYWORLD_HWANDO3D_R1302__\s*\.\s*(set|setBasicEcho)\s*\(/.test(src)&&!/__STORYWORLD_HERO_STANCE_R1320__\s*\.\s*(set|tune)\s*\(/.test(src),'⑨ R1302·R1320 설정을 바꾸지 않음(읽기만)');
ok(/onAfterRender/.test(src)&&/storyworld\.r1347\.combo/.test(src),'⑨ 렌더 뒤 되돌림·끄기 키(storyworld.r1347.combo)');
console.log(fail?`\nR1347 검술 CPU FAIL ${fail}`:'\nR1347 검술 CPU PASS');process.exit(fail?1:0);
