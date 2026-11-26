// R1338 발록 3D v4 선택 적용(사용자 2026-11-26 12:23Z "기본2d 3d키면3d로") — 정적 회귀.
//  · 기본은 2D 발록 그대로, 설정 '3D 발록' 을 켜면(또는 ?balrog3d38=1) 지옥문(dist06) 진짜 보스 발록만 PC 블렌더로 다시 만든 v4 모델.
//  · 다른 몹·다른 지역·R1329(아직 병합 전) 설정과 섞이지 않게 이름·키·전역을 모두 따로 둔다.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1338.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(!!(src&&rt&&src.equals(rt)),'runtime-text 사본이 원본과 같음');
const table=(s.match(/const TABLE=\{[\s\S]*?\n\};/)||[''])[0];
const keys=[...table.matchAll(/\n\s*([A-Za-z0-9_]+):\{/g)].map(m=>m[1]);
ok(keys.length===1&&keys[0]==='balrog','표에는 발록 하나만(다른 몹은 손대지 않음) — '+JSON.stringify(keys));
const line=(table.match(/\n\s*balrog:\{[^\n]*/)||[''])[0];
const GLB='assets/r1338/SW-R1338_balrog_v4.glb';
ok(line.includes("glb:'"+GLB+"'"),'발록 모델 = v4 ('+GLB+')');
ok(line.includes("'발록 · 지옥의 문지기'"),'게임 이름 발록 · 지옥의 문지기');
ok(/boss:true/.test(line),'진짜 보스 표시');
// 2D 발록 몸 그림(assets/r1147/bosses/dist06-idle6.webp 등)만 잡고, 중간보스 mb-dist06 시트는 잡지 않음.
const tm=/test:(\/[^\n]*?\/[a-z]*),name/.exec(line);let re=null;try{re=tm&&eval(tm[1]);}catch(_){}
ok(!!re&&re.test('assets/r1147/bosses/dist06-idle6.webp')&&re.test('assets/r1147/bosses/dist06-hit4.webp'),'2D 발록 몸 그림 경로를 잡음');
ok(!!re&&!re.test('assets/rc135/midboss-motions/sheets/mb-dist06.png')&&!re.test('assets/r1147/bosses/dist05-idle6.webp'),'중간보스 mb-dist06·다른 지역 보스는 안 잡음');
ok(/tint:0\b/.test(line),'v4 는 이미 2D 색에 맞춰 칠했으므로 채널 배율 없음(tint:0)');
ok(/const ZONES=new Set\(\['dist06'\]\)/.test(s),'범위는 지옥문(dist06)만');
// 기본 꺼짐(2D) — 사람이 하든 자동 검사든 같다. 켜는 길: 설정 체크·localStorage·주소.
ok(/\nlet on=false;/.test(s)&&!/\nlet on=true;/.test(s),'기본 꺼짐 = 2D 발록');
ok(/const KEY='storyworld\.r1338\.balrog3d'/.test(s)&&/localStorage\.getItem\(KEY\);if\(v==='on'\)on=true;else if\(v==='off'\)on=false;/.test(s),'설정 키 storyworld.r1338.balrog3d 로 켜고 끔');
ok(/\[\?&\]balrog3d38=\(\[01\]\)/.test(s),'주소 강제 ?balrog3d38=1/0');
ok(/id='balrog3dR1338Row'/.test(s)&&/id="balrog3dR1338Toggle"/.test(s)&&/3D 발록/.test(s),'설정 화면에 3D 발록 체크');
ok(/__STORYWORLD_BALROG3D_R1338__/.test(s),'공개 API 이름 따로');
ok(!/r1329|R1329|mob3d29|MOB3D_R1329/.test(s),'R1329 이름·키·전역과 섞이지 않음');
ok(/__r1338/.test(s)&&/Object\.assign\(w,/.test(s),'감싸기 표식 따로(서로 덧감싸지 않음)');
ok(/room\.layer==='STORY'/.test(s),'이야기 층만');
ok(/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s),'게임 렌더러 장면 공유');
ok(/getImageData/.test(s),'크기는 2D 몸 그림의 보이는 키에 맞춤(66% 키움이 그대로 따라옴)');
ok(/telegraph/.test((s.match(/const NOT_BODY=[^\n]*/)||[''])[0])&&/sigil/.test((s.match(/const NOT_BODY=[^\n]*/)||[''])[0]),'운석 바닥 예고 원·소환진 같은 이펙트는 몸으로 보지 않아 그대로');
ok(/userData\.r1055Skip=true/.test(s)&&/userData\.r451=true/.test(s),'3D 메시는 수묵·국지 조명에서 뺌');
// 모델 파일
const b=rd('runtime-text/'+GLB);ok(!!b&&b.length>100000,'v4 모델 파일 있음');
if(b){const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name.toLowerCase());
 for(const n of ['idle','walk','attack','hit','death','cast'])ok(names.includes(n),'클립 '+n);
 ok((j.skins||[]).length>=1&&(j.skins[0].joints||[]).length===35,'스킨·뼈 35개');
 ok(b.length<=2600000,'2.6MB 이하('+b.length+')');
 const used=j.extensionsUsed||[];ok(used.every(e=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_materials_emissive_strength','KHR_texture_transform'].includes(e)),'게임 로더가 읽는 확장만 '+JSON.stringify(used));
 const mat=(j.materials||[])[0]||{};ok(!!mat.emissiveTexture&&!!mat.normalTexture&&!!mat.pbrMetallicRoughness?.baseColorTexture,'색·노멀·발광 맵');}
// 배선
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');
ok(html.indexOf('"./mob-3d-r1315.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: mob-3d-r1315 뒤, combat-guide-r1249 앞');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const row=p=>man.files.find(v=>v.path===p);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
ok(!!row(F)&&!!rt&&row(F).sha256===sha(rt),'runtime-manifest 에 스크립트(해시 맞음)');
ok(!!row(GLB)&&!!b&&row(GLB).sha256===sha(b),'runtime-manifest 에 모델(해시 맞음)');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'"+GLB+"'"),'공개 확인 목록');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1338/r1338-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1338 FAIL '+fail:'R1338 ALL OK');process.exit(fail?1:0);
