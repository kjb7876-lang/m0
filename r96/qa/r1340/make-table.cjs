// R1340: census.json(헤드리스 전수) → 몹 이름별 공격 유형 표(melee-hitfx-r1340.js TABLE)와 사람이 읽는 표(mob-attack-kinds.md).
//  기본 = 이름 낱말 → 그 이름의 다수 무기. 아래 FIX 는 사람이 이름·모습으로 맞춘 것(근거 열에 남김).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const d=JSON.parse(require('zlib').gunzipSync(fs.readFileSync(path.join(__dirname,'census.json.gz'))).toString('utf8'));
const g={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,isFinite,setTimeout:()=>0};g.window=g;vm.createContext(g);
const SRC=path.join(R,'client-source','melee-hitfx-r1340.js');let code=fs.readFileSync(SRC,'utf8');
vm.runInContext(code.replace(/\/\*@@TABLE@@\*\/[\s\S]*?\n\}\);/,'/*@@TABLE@@*/\n});'),g);const A=g.__STORYWORLD_MELEE_HITFX_R1340__;
const FIX={'흑마법사의 저주창':['bleed','저주 창 — 찌르기'],'개와 늑대의 시간':['bleed','늑대·개 — 물기'],'분노의 사냥개':['bleed','사냥개 — 물기(무기값이 개체마다 다름)'],'강철 턱의 사이보그 개':['bleed','강철 턱 — 물기'],'전쟁기계사냥개':['bleed','사냥개 — 물기'],'관리자 추적견':['bleed','추적견 — 물기'],
 '고슴도치 가시 사탕':['bleed','가시 — 찌르기'],'중독을 부르는 주사기 환영체':['bleed','주사기 — 찌르기'],'병원 심부의 집도의':['bleed','집도의 메스 — 베기'],'무명 검흔':['bleed','검흔 — 베기'],'환수검 모조체':['bleed','검 — 베기'],
 '뿌리의 문지기':['ground','뿌리를 땅에 내려침'],'살아 움직이는 쓰레기들':['ground','쓰레기 더미가 덮침(다수 무기 heavy)'],
 '오만의 폐허핵':['impact','핵 — 애매함'],'약을 갈망하는 자':['impact','사람 — 주먹·몸 부딪힘'],'초자아 잠식체':['impact','잠식체 — 애매함'],'모든 면이 뒷면인 동전':['impact','동전 — 부딪힘'],'곰팡이와 오물 봉투':['impact','봉투 — 부딪힘'],
 '끓어오르는 검은 소화액':['impact','액체 — 튐'],'버려진 최고급 식재료':['impact','식재료 — 애매함'],'기계화 복종 봉인구':['impact','봉인구 — 애매함'],'기계화 제8단계 자비 교정관':['impact','교정관 — 애매함'],
 '진술 봉쇄 인과핵':['impact','핵 — 애매함'],'칩 제단 방화벽':['impact','방화벽 — 애매함'],'기계재판 집행핵':['impact','핵 — 애매함'],'ID 생체조 관리자':['impact','관리자 — 애매함'],'적그리스도 배양좌':['impact','배양좌 — 애매함'],
 '태엽 수집자':['impact','무기값 섞임 — 애매함'],'잠식된 어부':['impact','무기값 섞임 — 애매함'],'잠식된 소복 처녀':['impact','무기값 섞임 — 애매함'],'기계화 공명술사':['impact','술사 — 애매함'],'대수문장':['ground','큰 수문장 — 내려침'],'최종문 공명기사':['ground','공명기사(같은 계열 heavy)']};
const SIN3D=new Set(['ep1b02','ep1b03','ep1b04','ep1b05','ep1b06','ep1b07','ep1b08']),Z3D={'보랏빛 알집지기':1,'보라검천사':1,'늪 뿌리 추적자':1,'수렁 주문사':1,'피냄새 추적자':1};
const base=n=>String(n||'').replace(/^중간보스 · /,'').replace(/\s+(우두머리|후속|증원|추격대|분신|\d+)$/,'').trim();
const m=new Map();for(const [z,r] of Object.entries(d))for(const e of r.mobs){if(e.ai==='ranged'&&!e.b&&!e.m)continue;const b=base(e.n);if(!b)continue;
 if(!m.has(b))m.set(b,{w:{},z:new Set(),title:new Set(),boss:false,mid:false});const o=m.get(b);o.w[e.w]=(o.w[e.w]||0)+1;o.z.add(z);o.title.add(r.title||z);o.boss=o.boss||e.b;o.mid=o.mid||e.m;}
const rows=[];for(const [b,o] of m){const w=Object.entries(o.w).sort((a,b)=>b[1]-a[1])[0][0];let kind=A.classify({name:b,weapon:w}),why='';
 if(FIX[b]){kind=FIX[b][0];why=FIX[b][1];}else{why=/망치|해머|철퇴|곤봉|몽둥이|도끼|모루|골렘|석상|바위|거인/.test(b)?'이름(무거운 둔기)':/칼날|칼|단검|장검|대검|보라검|검객|낫|창병|창날|장창|송곳|바늘|메스|가위|발톱|송곳니|이빨|비수|손톱/.test(b)?'이름(날붙이)':/혼령|유령|망령|잔영|그림자|점액|슬라임|안개|연기|나방|파동|주파수|결정|구체|눈알|환영|메아리|잔향/.test(b)?'이름(몸 없음)':'무기 '+w;}
 const zs=[...o.z];const r3=zs.some(z=>SIN3D.has(z))?'3D(7대죄 지역)':zs.some(z=>/^last30[23]$/.test(z))?'2D(불면귀 마을 고정)':Z3D[b]?'3D(R1329)':'2D(3D 설정 따라)';
 rows.push({b,kind,w:Object.entries(o.w).map(([k,v])=>k+'×'+v).join(' '),zones:[...o.title].slice(0,3).join(', '),boss:o.boss?'보스':o.mid?'중간보스':'',r3,why});}
const K={ground:'땅 치기 → 돌',bleed:'찌르기·베기 → 작은 출혈',impact:'그 밖 → 작은 타격'};
const order={ground:0,bleed:1,impact:2};rows.sort((a,b)=>order[a.kind]-order[b.kind]||a.b.localeCompare(b.b,'ko'));
const cnt=rows.reduce((c,r)=>(c[r.kind]=(c[r.kind]||0)+1,c),{});
let md=`# R1340 근접 몹 공격 유형 분류 표\n\n헤드리스 전수(r96/qa/r1340/census.mjs, 63지역, 근접·근원거리 혼합·보스 포함) → make-table.cjs. 몹 ${rows.length}종(이름 기준).\n\n`+
`- 땅 치기 → 돌(칠 때 그 자리에 솟는 돌 시트, 맞으면 영웅 옆 검은 균열 그대로): ${cnt.ground||0}종\n- 찌르기·베기 → 작은 출혈(맞았을 때만 영웅 몸에 작은 검붉은 핏방울 한 장): ${cnt.bleed||0}종\n- 그 밖·애매함 → 작은 타격(맞았을 때만 그 몹 색의 작은 타격 시트, 투명 .4): ${cnt.impact||0}종\n\n`+
`분류 순서: 이 표(이름) → 이름 낱말 → 엔진 무기값(heavy=땅, blade·cleave·claw=출혈, 그 밖=타격). 2D·3D 그림과 무관하게 같은 몹은 같은 유형. 표에 없는 새 몹은 낱말·무기로 자동 분류되고 애매하면 작은 타격.\n\n`+
`| 이름 | 유형 | 엔진 무기값(개체 수) | 지역 | 구분 | 그림 | 근거 |\n|---|---|---|---|---|---|---|\n`+rows.map(r=>`| ${r.b} | ${K[r.kind]} | ${r.w} | ${r.zones} | ${r.boss} | ${r.r3} | ${r.why} |`).join('\n')+'\n';
fs.writeFileSync(path.join(__dirname,'mob-attack-kinds.md'),md);
const tbl=rows.map(r=>` ${JSON.stringify(r.b)}:'${r.kind}',`).join('\n');
code=code.replace(/\/\*@@TABLE@@\*\/[\s\S]*?\n\}\);/,'/*@@TABLE@@*/\n'+tbl+'\n});');fs.writeFileSync(SRC,code);console.log(cnt,rows.length);
