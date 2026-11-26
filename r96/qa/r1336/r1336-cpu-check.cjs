// R1336 플레이 영상(사용자 2026-11-26 10:16) 오류 묶음 — 정적·순수 함수 검사(브라우저 없음). 브라우저 검사는 같은 폴더 *-browser.mjs.
//  ① 연결: 새 오버레이 3개(hunter-draw-3d-r1336·hero-fx-3d-r1336·mob-3d-death-r1336) 원본 = runtime-text 사본, 스크립트 태그 한 번(R462·R1312~R1322c·R1320 뒤),
//     공개 검증 목록·매니페스트·입력 목록·CI 줄. 고친 기존 파일 2개(gunner-veil-r953·ego-dots-r1139b)도 원본 = 사본.
//  ② 3D 영웅 투명화(hero-fx-3d-r1336): 출처 끝 ':자르기:번호:hero:<영웅>' 표지로만 영웅 이름을 품은 이펙트와 보호막·EGO 문양은
//     3D 몸이 있는 프레임에 R1302 앞에서 빼서 R1302 가 진짜 몸 알파를 쓰게 한다(경계: 빈 값·주소·물음표·캔버스 이름·몸 없는 프레임).
//  ③ 기억사수 잔영 위장: 3D 영웅이 켜져 있으면 몸 알파를 낮추지 않는다(은신 판정·궁극기 단축 코드는 그대로).
//  ④ EGO 베기 궤적: R1048 반쪽 자르기 상자를 물려받지 않는다(trail 바꾸기 직후 clips 비움).
//  ⑤ 3D 몹 죽음: 가짜 창에서 죽음 효과를 그려 — 3D 로 보이던 몹이면 R462 몸 그림·Dots 죽음 시트 칸을 enemy 주인·alive:false 로 다시 단다(저장값이 꺼져도 실제로 3D 로 보이던 몹이면).
//     2D 몹·끈 상태·연기 시트는 그대로. 경계: sourceId 없음·look 없음·좌표 NaN·R462 가 아직 안 감쌈.
//  ⑥ 헌터 활 자세 표: 활 손이 앞으로, 활은 곧게, 시위는 사람 쪽, 당기는 손은 얼굴 옆, 가슴 틀기는 활 쪽 어깨를 앞으로. R1320 표는 건드리지 않음.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}};
const NEW=['hunter-draw-3d-r1336.js','hero-fx-3d-r1336.js','mob-3d-death-r1336.js'],CHANGED=['gunner-veil-r953.js','ego-dots-r1139b.js'];
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
for(const F of [...NEW,...CHANGED]){const s=rd('client-source/'+F);ok(!!s&&s===rd('runtime-text/'+F),'① 원본 = runtime-text 사본: '+F);}
for(const F of NEW){ok(at(F)>0&&html.split('"./'+F+'"').length===2,'① 스크립트 태그 한 번: '+F);
 ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'① 공개 검증 목록: '+F);
 ok((rd('runtime-manifest.json')||'').includes('"'+F+'"')&&(rd('runtime-inputs.json')||'').includes(F),'① 매니페스트·입력 목록: '+F);}
ok(['mob-3d-r1312.js','mob-3d-r1322c.js','hero-stance-3d-r1320.js','hwando-3d-r1302.js'].every(n=>at(n)>0&&at(n)<at('mob-3d-death-r1336.js')&&at(n)<at('hunter-draw-3d-r1336.js')&&at(n)<at('hero-fx-3d-r1336.js')),'① 태그 순서: 3D 몹·R1302·R1320 뒤');
ok(at('hunter-draw-3d-r1336.js')<at('combat-r118.js')&&at('mob-3d-death-r1336.js')<at('combat-r118.js'),'① combat-r118 보다 앞(맨 끝 규칙)');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1336/r1336-cpu-check.cjs'),'① CI 줄');
// ② R1336 hero-fx-3d (hwando-3d-r1302.js 는 해시 고정이라 손대지 않음 — R1310 검사)
{const s=rd('client-source/hero-fx-3d-r1336.js')||'';const win={localStorage:{getItem:()=>null,setItem(){}},setInterval(){},performance:{now:()=>0}};win.window=win;
 let err=null;try{vm.runInNewContext(s,Object.assign(win,{performance:win.performance,setInterval:win.setInterval,localStorage:win.localStorage}));}catch(e){err=e;}
 const A=win.__STORYWORLD_HERO_FX3D_R1336__;ok(!err&&!!A,'② 오버레이 실행·API'+(err?' '+err.message:''));
 if(A){const f=A.imagePath,c=v=>f({sourcePath:v});
  ok(c('https://h.io/m0/assets/r1027/barrier.webp:480,320,160,160:6:hero:gunner')==='https://h.io/m0/assets/r1027/barrier.webp','② 이펙트 출처의 :hero:<영웅> 표지는 떼어 그림 경로만');
  ok(c('assets/r710/gunner/idle-s.webp:0,0,192,256:11:hero:gunner').includes('gunner')&&c('assets/r130/hunter/idle-w.webp').includes('hunter'),'② 몸 시트 경로에는 영웅 이름이 남음');
  ok(c('assets/x/a.png?v=3:1,2,3,4:hero:michaela')==='assets/x/a.png'&&c('assets/x/a.jpeg#k')==='assets/x/a.jpeg','② 경계: 물음표·# 꼬리');
  ok(c('r409:outline:hero:2:abc:hero:gunner')==='r409:outline:hero:2:abc'&&f({})===''&&f(null)==='','② 경계: 캔버스 이름(확장자 없음)·빈 값');
  const H=(p,o={})=>({kind:'image',sourcePath:p,owner:{kind:'hero',bodyPath:'assets/r710/gunner/idle-s.webp',...(o.owner||{})},...o});
  const body=H('assets/r710/gunner/idle-s.webp:0,0,1,1:11:hero:gunner'),aura=H('assets/vfx/generated/v300/aura-ring.webp:0,0,1,1:3:hero:gunner',{style:{globalAlpha:.26}}),
   sig=H('https://x/m0/assets/r1027/barrier.webp:1,2,3,4:6:hero:hwando'),trail=H('assets/r1139/ego/trail-horizontal.webp:0,0,1,1'),mob={kind:'image',sourcePath:'assets/r275/mobs/a.webp:hero:gunner',owner:{kind:'enemy'}},
   ghost=H('assets/vfx/x.webp:hero:gunner',{owner:{r350:true}}),canvas=H('r409:outline:hero:gunner',{mutable:true});
  let cmd=[mob,aura,body,sig,trail,ghost,canvas];let n=A.filter(cmd,'gunner');
  ok(n===2&&!cmd.includes(aura)&&!cmd.includes(sig),'② 3D 몸이 있으면 영웅 이름을 출처 표지로만 품은 이펙트·보호막 문양을 뺌 → R1302 가 진짜 몸 알파를 씀');
  ok(cmd.includes(body)&&cmd.includes(trail)&&cmd.includes(mob)&&cmd.includes(ghost)&&cmd.includes(canvas),'② 회귀: 몸·베기 궤적(영웅 표지 없음)·몹·R350 유령·캔버스 몸은 그대로');
  cmd=[aura,sig];ok(A.filter(cmd,'gunner')===0&&cmd.length===2,'② 경계: 진짜 몸이 없는 프레임(3D 안 그림)은 아무것도 안 뺌');
  cmd=[body,aura];ok(A.filter(cmd,null)===0&&A.filter(null,'gunner')===0&&cmd.length===2,'② 경계: R1302 꺼짐(영웅 없음)·명령 없음');
  ok(A.filter([H('assets/r710/gunner/idle-s.webp:0,0,1,1'),H('assets/r710/gunner/attack-s.webp:0,0,1,1:hero:gunner')],'gunner')===0,'② 회귀: 같은 영웅의 다른 몸 시트는 빼지 않음');
  cmd=[H('assets/r710/gunner/idle-s.webp'),aura,sig];ok(A.filter(cmd,'gunner')===0&&cmd.length===3,'② 회귀: bodyPath 와 같은 몸(exact)이 있으면 R1302 도 이펙트를 2D 로 남기므로 그대로');
  cmd=[H('r1306:x.webp:hero:gunner',{spatialRole:'body'}),aura];ok(A.filter(cmd,'gunner')===0&&cmd.length===2,'② 회귀: 몸 표지(marked)가 있으면 그대로');}
 ok(/if\(!cur\.__r1304\)return;/.test(s)&&/w\.__r1304=true;w\.__r1336fx=true;scene\.render=w;done\.add\(scene\);/.test(s)&&/done\.has\(scene\)\)return;/.test(s),'② R1302 가 감싼 뒤 그 바깥에 서고, R1302·자신이 다시 감싸지 않게(장면마다 한 번)');}
// ③ R953
{const s=rd('client-source/gunner-veil-r953.js')||'';ok(/if\(!solid3d\(\)\)ctx\.globalAlpha\*=1-\(1-CFG\.cloak\.alpha\)\*k;/.test(s)&&/function solid3d\(\)\{try\{const R=window\.__STORYWORLD_HWANDO3D_R1302__;return !!\(R&&R\.on\(\)&&R\.heroes\(\)\.includes\(HERO\)\);\}catch\(_\)\{return false;\}\}/.test(s),'③ 3D 켜짐이면 몸 알파를 낮추지 않음(모듈 없거나 오류면 예전처럼 옅게)');
 ok(/s\.cloakUntil=T\(\)\+CFG\.cloak\.duration/.test(s)&&/ultScale:\.23/.test(s),'③ 회귀: 은신 지속·궁극기 단축 값 그대로');}
// ④ R1139b
{const s=rd('client-source/ego-dots-r1139b.js')||'';ok(/swap\(c,im,FX\.trail\.path,[^;]*\);\/\*[^*]*\*\/c\.clips=\[\];/.test(s),'④ 궤적으로 바꾼 직후 자르기 상자 비움');
 ok((s.match(/c\.clips=\[\]/g)||[]).length===1,'④ 회귀: 몸·방패 바꾸기는 자르기 그대로(궤적만)');}
// ⑤ 3D 몹 죽음 — 가짜 창
{const src=rd('client-source/mob-3d-death-r1336.js')||'';
 const make=({shown=true,on=null,r462=true}={})=>{const store={};if(on)store['storyworld.r1336.mob3dDeath']=on;
  const win={__STORYWORLD_MOB3D_R1312__:{on:()=>false/* 저장값 꺼짐이어도 R1326 이 7대죄 지역에서 강제로 켜 보이는 경우 */,inspect:()=>({instances:[{id:'dist00:a:1',visible:shown},{id:'dist00:a:2',visible:false}]})},__STORYWORLD_MOB_ATTACK_DOTS_R1065__:{deathFrame:()=>({path:'assets/r1065/dots-death.webp',frame:2})}};
  const sb={window:win,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},setTimeout:()=>0,Number,Math,Object,String,Array,JSON,RegExp,console,ctx:{commands:[]}};
  sb.drawBurnDeath3=function(fx){for(const p of ['https://h/m0/assets/r275/mobs/root-bound-ghoul.webp','assets/r1065/dots-death.webp','assets/r462/smoke.webp'])sb.ctx.commands.push({kind:'image',sourcePath:p+':0,0,64,64',owner:{kind:'scene',id:'scene'}});};
  if(r462)sb.drawBurnDeath3.__r462=true;sb.window.window=win;Object.assign(sb,{});vm.createContext(sb);
  // 전역 이름(window 의 키)도 보이게
  for(const k of Object.keys(win))sb[k]=win[k];
  try{vm.runInContext(src,sb,{filename:'mob-3d-death-r1336.js'});}catch(e){return {err:e};}return {sb,win};};
 const fx=(o={})=>({sourceId:'dist00:a:1',x:3,y:4,age:.2,r462:{look:{path:'assets/r275/mobs/root-bound-ghoul.webp',name:'침식 근위'}},...o});
 {const {sb,err}=make();ok(!err&&sb.drawBurnDeath3.__r1336&&sb.drawBurnDeath3.__r462,'⑤ R462 뒤 바깥에 감쌈'+(err?' '+err:''));
  sb.drawBurnDeath3(fx());const C=sb.ctx.commands,body=C.find(c=>/root-bound-ghoul/.test(c.sourcePath));
  ok(body&&body.owner.kind==='enemy'&&body.owner.id==='enemy:dist00:a:1'&&body.owner.alive===false&&body.owner.x===3&&body.owner.y===4,'⑤ 3D 로 보이던 몹: R462 몸 그림을 enemy 주인·alive:false 로(3D 오버레이가 빼고 죽음 동작)');
  {const d=C.find(c=>/dots-death/.test(c.sourcePath));ok(d&&d.owner.kind==='enemy'&&d.owner.id==='enemy:dist00:a:1'&&d.owner.alive===false,'⑤ Dots 죽음 시트 몸도 enemy 주인·alive:false 로(빼면 3D 가 받을 명령이 없어 죽음 동작 없이 사라짐 — 리뷰 P2)');}
  ok(body&&body.owner.alive===false,'⑤ 저장값 on()=false 여도 실제로 3D 로 보이던 몹이면 적용(R1326 7대죄 강제 3D — 리뷰 P2)');ok(C.some(c=>/smoke/.test(c.sourcePath)&&c.owner.kind==='scene'),'⑤ 15세 연기 시트는 그대로');
  const n=C.length;sb.drawBurnDeath3(fx({sourceId:'dist00:a:2'}));const D=sb.ctx.commands.slice(n);ok(D.length===3&&D.every(c=>c.owner.kind==='scene'),'⑤ 회귀: 3D 아닌(안 보이던) 몹은 그대로 2D');
  const m=sb.ctx.commands.length;sb.drawBurnDeath3({x:1,y:1});ok(sb.ctx.commands.slice(m).every(c=>c.owner.kind==='scene'),'⑤ 경계: sourceId 없음 → 그대로');
  const k=sb.ctx.commands.length;sb.drawBurnDeath3(fx({r462:null}));ok(sb.ctx.commands.slice(k).every(c=>c.owner.kind==='scene'),'⑤ 경계: R462 look 없음 → 그대로(오류 없음)');
  const j=sb.ctx.commands.length;sb.drawBurnDeath3(fx({x:NaN}));ok(sb.ctx.commands.slice(j).filter(c=>c.owner.kind==='enemy').every(c=>c.owner.x!==c.owner.x),'⑤ 경계: 좌표 NaN 이어도 던지지 않음(3D 쪽 place 가 거름)');
  const I=sb.window.__STORYWORLD_MOB3D_DEATH_R1336__.inspect();ok(I.stats.errors===0&&I.stats.deaths>=1&&I.stats.retagged>=2&&I.stats.dotsRetagged>=1,'⑤ 통계: 오류 0 '+JSON.stringify(I.stats));}
 {const {sb}=make({on:'off'});sb.drawBurnDeath3(fx());ok(sb.ctx.commands.every(c=>c.owner.kind==='scene'),'⑤ 끄기 키 off → 그대로 2D');}
 {const {sb}=make({r462:false});ok(!sb.drawBurnDeath3.__r1336,'⑤ 경계: R462 가 아직 안 감쌌으면 기다림(먼저 감싸지 않음)');}}
// ⑥ 헌터 활 자세
{const src=rd('client-source/hunter-draw-3d-r1336.js')||'';const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console};
 vm.createContext(sb);let e=null;try{vm.runInContext(src,sb);}catch(x){e=x;}const api=win.__STORYWORLD_HUNTER_DRAW_R1336__;ok(!e&&api&&api.on()===true,'⑥ 불러옴, 기본 켜짐'+(e?' '+e:''));
 if(api){const P=api.pose(),len=a=>Math.hypot(...a);ok(P.bow[2]>=.45&&Math.abs(P.bow[1])<=.1,'⑥ 활 손이 어깨에서 앞으로 '+P.bow);ok(P.bowDir[1]/len(P.bowDir)>=.98,'⑥ 활이 곧게 섬');
  ok(P.stringSide[2]<0&&Math.abs(P.stringSide[0])<.01,'⑥ 시위(+X)는 쏘는 사람 쪽(−Z)');ok(len(P.draw)<=.16&&P.draw[0]<0,'⑥ 당기는 손은 머리 오른쪽 가까이 '+P.draw);
  ok(P.twist<0&&P.twist>=-45&&P.head>0&&P.head<=-P.twist,'⑥ 가슴은 활 쪽 어깨를 앞으로 틀고 머리는 과녁 쪽으로 되돌림');ok(P.poleR[2]<0&&P.poleR[1]>=0,'⑥ 당기는 팔꿈치는 뒤·어깨 높이 쪽');}
 ok(!/STANCES|\.tune\(/.test(src.replace(/^\/\/.*$/gm,'')),'⑥ R1320 자세 표를 바꾸지 않음(pure 함수만 씀)');ok(/storyworld\.r1336\.hunterDraw/.test(src)&&/function restore\(/.test(src),'⑥ 끄기 키·그린 뒤 되돌림');}
console.log(fail?`\nR1336 CPU 실패 ${fail}`:'\nR1336 CPU 통과');process.exit(fail?1:0);
