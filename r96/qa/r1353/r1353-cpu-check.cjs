// R1353 환도 기본 공격 하얀 반월을 3D 칼 궤적에 맞춤 — 정적·순수 함수 검사(브라우저 없음).
//  사용자 11-27 01:28Z "환도 기본공격시 나오는 하얀반월이펙트 환도 휘두르는각도와궤적에 맞게 적용".
//  ① 연결: 원본 = runtime-text 사본, 스크립트 태그 한 번(R1347 검술 뒤), 공개 검증 목록·매니페스트·CI 줄.
//  ② 칼자국 실측값: basic.webp 의 칼자국 시작·끝·가운데가 그림과 맞음(PIL 없이 표 값의 범위만 — 그림은 브라우저 검사가 본다).
//  ③ fit/apply: 칼자국 시작 → 칼끝 길 시작, 끝 → 끝 방향, 크기 .6~1.8배 제한, 휘는 쪽이 다르면 뒤집음, 짧은 길은 나아가는 방향·원래 크기.
//  ④ frameAt: 시작 전엔 -1, 그 뒤 0→7 로 늘어남, 경계(NaN·끝).
//  ⑤ 손대지 않은 것: R292·R349·R1347·R302 파일은 이 라운드에서 바뀌지 않음(브랜치 기준 커밋과 같은 내용).
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}};
const F='hwando-arc-follow-3d-r1353.js',src=rd('client-source/'+F)||'';
ok(src.length>0&&src===rd('runtime-text/'+F),'① 오버레이 원본 = runtime-text 사본');
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
ok(at(F)>0&&at('hero-sword-combo-3d-r1347.js')>0&&at('hero-sword-combo-3d-r1347.js')<at(F)&&html.split(F).length===2,'① 스크립트 태그 한 번, R1347 검술 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'① 공개 검증 목록');
ok((rd('runtime-manifest.json')||'').includes(F)&&(rd('runtime-inputs.json')||'').includes(F),'① 매니페스트·입력 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1353/r1353-cpu-check.cjs'),'① CI 줄');
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console,isFinite,Map};
vm.createContext(sb);let loadErr=null;try{vm.runInContext(src,sb,{filename:F});}catch(e){loadErr=e;}
const api=win.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__,P=api?.pure;
ok(!loadErr&&api&&P&&api.on()===true,'순수 함수 불러옴, 기본 켜짐'+(loadErr?' '+loadErr:''));
if(!P){console.log('\nR1353 CPU FAIL');process.exit(1);}
const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),deg=r=>r*180/Math.PI,dir=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]),adiff=(x,y)=>{let t=Math.abs(x-y)%(2*Math.PI);return deg(Math.min(t,2*Math.PI-t));};
const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
// ② 칼자국 표
{const S=P.STROKE;ok(S.S[0]<80&&S.E[0]>330&&S.M[0]>180&&S.M[0]<240&&cr(S.S,S.E,S.M)>0,`② 칼자국: 시작 ${S.S} → 끝 ${S.E}, 가운데 ${S.M} 가 줄 아래로 휨`);}
// ③ fit/apply
const base=.3;
const cases=[{n:'오른쪽 위→왼쪽 아래(내려베기 꼴)',A:[520,180],B:[430,300],P:[500,270]},{n:'왼쪽 아래→오른쪽 위(올려베기 꼴)',A:[430,300],B:[540,190],P:[470,200]},
 {n:'수평 오른쪽→왼쪽(횡베기 꼴)',A:[540,250],B:[420,245],P:[480,270]},{n:'수평 왼쪽→오른쪽(역횡베기 꼴)',A:[420,250],B:[540,250],P:[480,230]},{n:'위→아래 곧게(정수리)',A:[480,150],B:[482,300],P:[470,225]}];
for(const c of cases){const f=P.fit(c.A,c.B,c.P,base,0),s=P.apply(f,...P.STROKE.S),e=P.apply(f,...P.STROKE.E),m=P.apply(f,...P.STROKE.M);
 const L=d(c.A,c.B),k=L/d(P.STROKE.S,P.STROKE.E);const want=Math.max(base*P.K_MIN,Math.min(base*P.K_MAX,k));
 ok(d(s,c.A)<.01&&adiff(dir(s,e),dir(c.A,c.B))<.5,`③ ${c.n}: 칼자국 시작이 칼끝 길 시작에, 방향 차 ${adiff(dir(s,e),dir(c.A,c.B)).toFixed(2)}°`);
 ok(Math.abs(f.k-want)<1e-9,`③ ${c.n}: 크기 ${(f.k/base).toFixed(2)}배(길 ${L.toFixed(0)}px, .6~1.8배 제한)`);
 ok(Math.sign(cr(s,e,m))===Math.sign(cr(c.A,c.B,c.P)),`③ ${c.n}: 휘는 쪽이 칼끝 길과 같음(뒤집기 ${f.mirror})`);}
{const f=P.fit([480,250],[485,252],[482,251],base,Math.PI/2),s=P.apply(f,...P.STROKE.S),e=P.apply(f,...P.STROKE.E);ok(f.short&&f.k===base&&adiff(dir(s,e),Math.PI/2)<.5,'③ 짧은 길(5px, 찌르기가 카메라 쪽): 나아가는 방향·원래 크기');ok(d([(s[0]+e[0])/2,(s[1]+e[1])/2],[482.5,251])<.01,'③ 짧은 길: 칼자국 가운데가 칼끝 길 가운데에');}
{const f=P.fit([1,2],[NaN,3],[0,0],base,NaN);const s=P.apply(f,10,10);ok(f.short&&Number.isFinite(s[0])&&Number.isFinite(s[1]),'③ 경계: NaN 길이어도 유한값');}
{const f1=P.fit([400,200],[700,200],[550,260],base,0),f2=P.fit([400,200],[440,200],[420,210],base,0);ok(Math.abs(f1.k-base*P.K_MAX)<1e-9&&Math.abs(f2.k-base*P.K_MIN)<1e-9,'③ 크기 제한: 아주 긴 길 1.8배, 짧은 길 .6배');}
// ④ frameAt
{const lead=.1,fr=[0,.05,.099,.1,.13,.2,.29,.3,.5].map(a=>P.frameAt(a,.3,8,lead));ok(fr.slice(0,3).every(x=>x===-1)&&fr[3]===0&&fr.slice(3).every((x,i,a)=>i===0||x>=a[i-1])&&fr[7]===7&&fr[8]===7,'④ 띠 칸: 칼 휘두르기 전 안 그림, 그 뒤 0→7 '+JSON.stringify(fr));
 ok(P.frameAt(NaN,.3,8,.1)===-1&&P.frameAt(.2,.3,8,.4)===-1&&P.frameAt(.35,.3,8,.3)===7,'④ 경계: NaN·lead>dur·끝');}
// ⑤ 손대지 않은 파일
{let base='';try{base=cp.execSync('git merge-base HEAD origin/main',{cwd:ROOT,stdio:['ignore','pipe','ignore']}).toString().trim();}catch(_){}
 const keep=['skill-fx-r292.js','hwando-arc-r349.js','hero-sword-combo-3d-r1347.js','hero-palette-r302.js','hwando-3d-r1302.js'];
 if(base){let changed=[];for(const f of keep){try{const a=cp.execSync(`git show ${base}:r96/client-source/${f}`,{cwd:ROOT,stdio:['ignore','pipe','ignore']}).toString();if(a!==rd('client-source/'+f))changed.push(f);}catch(_){}}
  // R1347 은 같은 브랜치 줄(#1046)에서 들어오므로 main 기준으로는 바뀐 것이 맞다 — 나머지만 본다.
  changed=changed.filter(f=>f!=='hero-sword-combo-3d-r1347.js');ok(changed.length===0,'⑤ R292·R349·R302·R1302 파일 그대로 '+(changed.join(',')||''));}
 else console.log('info  ⑤ git 기준 없음(얕은 복제) — 건너뜀');
 ok(/HEROES=\['hwando'\]/.test(src),'⑤ EGO 는 손대지 않음(R1265 가 흰 환도 베기를 지움, 사용자 11-20)');
 ok(/ctx\.scope/.test(src)&&!/skill-fx-r292\.js|hwando-arc-r349\.js/.test(src.replace(/^\/\/.*$/mg,'')),'⑤ 그리기는 R292 가 여는 한 번(ctx.scope)만 바꿔 끼움');
 ok(/storyworld\.r1353\.arcFollow/.test(src)&&/RE\.test\(meta\.id\)&&replacing\(\)/.test(src)&&/function replacing\(\)\{return on&&!!shownHero\(\)&&!!comboApi\(\)\?\.on\?\.\(\)/.test(src),'⑤ 끄기 키, 원래 R292 띠는 3D 환도 + 검술 켬일 때만 숨김');
 ok(/onAfterRender=function\(\.\.\.a\)\{try\{record\(\);\}catch\(e\)\{fail\(e\);\}return prev/.test(src),'⑤ 칼끝은 R1347 이 뼈를 되돌리기 전에 기록(실제로 그린 칼)');}
console.log(fail?`\nR1353 CPU FAIL ${fail}`:'\nR1353 CPU PASS');process.exit(fail?1:0);
