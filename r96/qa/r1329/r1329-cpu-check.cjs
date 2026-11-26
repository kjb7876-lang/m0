// R1329 거미동굴·늪지대 3D(사용자 2026-11-26 08:18Z·08:22Z) — 정적 회귀.
//  · 대상: dist01 보랏빛 알집지기(+우두머리·중간보스)·보라검천사, dist02 수렁 주문사·늪의 뿔악마 군주(Dots SW-3D-R1329 모델), 늪 뿌리 추적자(첫 맵 R1312 모델 재사용 + 초록 늪색).
//  · 2D 그대로: 거미줄에 묶인 수호병·늪에서 되살아난 혼령체(사용자 지시), 늪의 염소머리 악마(언급 없음 → 이 파일은 손대지 않음).
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1329.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
const table=(s.match(/const TABLE=\{[\s\S]*?\n\};/)||[''])[0];
// 종류 → [2D 경로 줄기, 게임 이름]
const WANT={eggkeeper:['purple-eggkeeper','보랏빛 알집지기'],violetAngel:['mb-dist01','보라검천사'],swampMage:['swamp-mage','수렁 주문사'],hornLord:['mb-dist02','늪의 뿔악마 군주'],swampStalker:['swamp-root-stalker','늪 뿌리 추적자'],bloodHound:['ember-hound','피냄새 추적자'],bloodPursuer:['mb-dist03','핏빛 수호로 추격자'],balrog:['dist06-','발록 · 지옥의 문지기']};
for(const [k,[stem,name]] of Object.entries(WANT)){const line=(table.match(new RegExp('\\n\\s*'+k+':\\{[^\\n]*'))||[''])[0];
 ok(!!line,'표에 '+k);ok(line.includes(stem),k+' 2D 경로 줄기 '+stem);ok(line.includes("'"+name+"'"),k+' 이름 '+name);}
ok(!/web-bound-guardian|거미줄에 묶인 수호병/.test(table),'거미줄에 묶인 수호병은 2D 그대로(사용자 "이질감 없네")');
ok(!/swamp-spirit|늪에서 되살아난 혼령체/.test(table),'늪에서 되살아난 혼령체는 2D 그대로(사용자)');
ok(!/swamp-goat|염소머리/.test(table),'늪의 염소머리 악마는 이 파일에서 손대지 않음');
ok(/const ZONES=new Set\(\['dist01','dist02','dist03','dist06'\]\)/.test(s),'범위는 거미동굴(dist01)·늪지대(dist02)·무너진 성(dist03)·지옥문(dist06 발록)만');
// 피냄새 추적자(사용자 08:46Z): R1316 분노의 사냥개 재사용은 등 불꽃 볏 때문에 실루엣이 달라 임시였고, Dots 전용 모델(SW-R1329-06)이 오면 교체.
// 분노의 사냥개(ep1b07) 쪽 모델·경로는 건드리지 않는다(Dots 지시: 거기에는 연결 금지).
const hound=(table.match(/\n\s*bloodHound:\{[^\n]*/)||[''])[0];
ok(hound.includes("'assets/r1329/SW-R1329-06_blood-scent-hound.glb'")&&!/r1316/.test(hound)&&/tint:1\b/.test(hound),'피냄새 추적자는 Dots 전용 3D(SW-R1329-06)·2D 색에 완전히 맞춤');
ok(!/ep1b07/.test([...s.matchAll(/ZONES=new Set\(\[[^\]]*\]\)/g)].join('')),'분노의 사냥개 지역(ep1b07)은 이 오버레이 밖');
ok(/balrog:\{[^\n]*boss:true/.test(table),'발록은 보스 표시(상한 안에서 먼저)');
ok(!/보라검 추격천사|m004/.test(table),'보라검 추격천사(dist03, 요청 밖)는 손대지 않음');
// 늪 뿌리 추적자 = 첫 맵 뿌리 추적자 3D(R1312 Dots MobGLB-02 R2) 그대로 + 2D 늪 그림 색에 완전히 맞춤(초록 늪색).
const stalk=(table.match(/\n\s*swampStalker:\{[^\n]*/)||[''])[0];
ok(stalk.includes("'assets/r1312/mob-root-stalker-3d.glb'"),'늪 뿌리 추적자는 첫 맵 3D 모델 재사용');
ok(/tint:1\b/.test(stalk),'늪 뿌리 추적자는 2D 늪 그림 색에 완전히 맞춤(tint:1)');
const g=rd('runtime-text/assets/r1312/mob-root-stalker-3d.glb');ok(g&&g.length>1000,'첫 맵 모델 파일 있음(덮어쓰지 않음)');
// 색 맞춤만(사용자 11-26 08:03Z "색맞춤만이 좋은듯") — 끊기·명암 단·먹 껍질 없이, 2D 몸 그림 평균색에 채널 배율.
ok(/avgRGB/.test(s)&&/r1329Tint/.test(s),'2D 색 맞춤(평균색 배율)');
ok(!/ink-shell/.test(s)&&!/BackSide/.test(s),'먹 껍질 없음(색 맞춤만)');
ok(/userData\.r1055Skip=true/.test(s)&&/userData\.r451=true/.test(s),'3D 메시는 R1055 수묵·R451 국지 조명에서 뺌');
// Dots 모델(SW-3D-R1329)이 아직 없으면 그 종류는 2D 그대로(경로 null), 오면 바이트 그대로 assets/r1329/ 에 두고 표에 경로.
// 핏빛 수호로 추격자는 사용자 10:20Z "기존처럼 2d" → 늘 2D(모델 경로 없음).
ok(/\n\s*bloodPursuer:\{glb:null,/.test(table),'핏빛 수호로 추격자는 2D 그대로(사용자 10:20Z)');
// 늪지대 보스(사용자 10:33Z)·발록(10:34Z)도 2D.
ok(/\n\s*hornLord:\{glb:null,/.test(table)&&/\n\s*balrog:\{glb:null,/.test(table),'늪의 뿔악마 군주·발록은 2D 그대로(사용자 10:33Z·10:34Z)');
for(const k of ['eggkeeper','violetAngel','swampMage','hornLord','bloodPursuer','balrog']){const line=(table.match(new RegExp('\\n\\s*'+k+':\\{[^\\n]*'))||[''])[0];const m=/glb:'([^']+)'/.exec(line);
 if(!m){ok(/glb:null/.test(line),k+' 모델 대기(Dots SW-3D-R1329 v1·v2) → 2D 그대로');continue;}
 const b=rd('runtime-text/'+m[1]);ok(!!b&&m[1].startsWith('assets/r1329/'),k+' 모델 '+m[1]+' 있음');if(!b)continue;
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name.toLowerCase());
 ok(['idle','hit','death'].every(n=>names.includes(n))&&names.some(n=>/^attack/.test(n))&&names.some(n=>/^(walk|float)$/.test(n)),k+' 클립 idle·walk·attack·hit·death');
 ok((j.skins||[]).length>=1,k+' 스킨 있음');ok(b.length<=2500000,k+' 2.5MB 이하');}
ok(/pick=re=>gltf\.animations\.find\(a=>re\.test\(a\.name\)\)/.test(s)&&/\/\^idle\$\/i/.test(s),'클립 이름은 대소문자 무관(Dots 소문자·R1312 대문자)');
ok(/room\.layer==='STORY'/.test(s),'이야기 층만(사몽 흑백 꿈 층은 2D 그대로)');
ok(/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s),'게임 렌더러 장면(층 2) 공유');
ok(/SkeletonUtils/.test(s),'몹마다 뼈째 복제');
ok(/getImageData/.test(s),'크기는 2D 몸 그림의 실제 보이는 키(알파 상자)에 맞춤');
ok(/__r1329/.test(s)&&/Object\.assign\(w,/.test(s),'감싸기 표식을 옮겨 서로 덧감싸지 않음(R1312 함정)');
ok(/\nlet on=true;/.test(s)&&/navigator\.webdriver\)on=false/.test(s),'사람이 할 때 기본 켜짐(사용자 "적용해줘"), 자동 검사는 기존 2D 기준선 보존');
ok(/storyworld\.r1329\.mob3d/.test(s)&&/mob3d29=/.test(s),'설정 키·주소 강제(?mob3d29=1/0)');
ok(/__STORYWORLD_MOB3D_R1329__/.test(s),'공개 API');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');
ok(html.indexOf('"./mob-3d-r1315.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: mob-3d-r1315 뒤, combat-guide-r1249 앞');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F),'runtime-manifest 에 스크립트');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'"),'공개 확인 목록');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1329/r1329-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1329 FAIL '+fail:'R1329 ALL OK');process.exit(fail?1:0);
