// R1320c 환도 영웅·EGO 칼 = Dots 조선 환도 07 — 정적·순수 함수 검사(브라우저 없음).
//  ① 연결: 원본 = runtime-text 사본, 스크립트 태그 한 번(R1313 뒤), 공개 검증 목록·매니페스트·CI 줄.
//  ② 자산: 07 파일 = 드라이브 ZIP 안 원본 바이트(크기·SHA-256), 기존 칼 파일은 그대로(R1313 때 해시), 07 은 새 이름.
//  ③ 07 GLB 구조: GripSocket 원점, BladeTip 이 +Y(칼끝), 술 자리(TasselPivot)는 손잡이 아래.
//  ④ 주소 바꾸기(route): 기존 환도 칼 주소만 07 로. 경계: 앞 경로·물음표·해시 꼬리 유지, 다른 무기·비슷한 이름·07 자신·빈 값·URL 아님·꺼짐은 그대로.
//  ⑤ 손대지 않은 것: hero-weapons-3d-r1313.js 표는 그대로(기존 칼 이름), 끄기 키.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}},rb=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='hwando-sword-07-3d-r1320.js',src=rd('client-source/'+F)||'';
ok(src.length>0&&src===rd('runtime-text/'+F),'① 오버레이 원본 = runtime-text 사본');
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
ok(at(F)>0&&at('hero-weapons-3d-r1313.js')>0&&at('hero-weapons-3d-r1313.js')<at(F)&&html.split(F).length===2,'① 스크립트 태그 한 번, R1313 뒤');
const vp=fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8');
ok(vp.includes("'"+F+"'")&&vp.includes("'assets/r1313/joseon-hwando-07.glb'"),'① 공개 검증 목록(js·자산)');
ok([F,'assets/r1313/joseon-hwando-07.glb'].every(n=>(rd('runtime-manifest.json')||'').includes(n)&&(rd('runtime-inputs.json')||'').includes(n)),'① 매니페스트·입력 목록(js·자산)');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1320/r1320-sword07-cpu-check.cjs'),'① CI 줄');
// ② 자산
const sha=b=>b?crypto.createHash('sha256').update(b).digest('hex'):'';
const g7=rb('runtime-text/assets/r1313/joseon-hwando-07.glb'),g0=rb('runtime-text/assets/r1313/joseon-hwando.glb');
ok(g7&&g7.length===1326232&&sha(g7)==='8a6de242cec2921a3b4f9eef1befd00d21c698a2c32642f839c95adbf87018fe','② 07 = 드라이브 ZIP 원본 바이트(1,326,232 · 8a6de242…)');
ok(g0&&g0.length===691232&&sha(g0)==='e40aff16e38922e9415357f9c827d66be3ffc694e8ebcf6750c46eeb767bb336','② 기존 칼 파일 그대로(691,232 · e40aff16…)');
// ③ 구조
{let j=null;try{const n=g7.readUInt32LE(12);j=JSON.parse(g7.slice(20,20+n).toString('utf8'));}catch(_){}
 const node=n=>j?.nodes?.find(x=>x.name===n),t=n=>node(n)?.translation||[0,0,0];
 ok(!!j&&g7.readUInt32LE(0)===0x46546C67,'③ GLB 헤더·JSON 읽힘');
 ok(!!node('GripSocket')&&t('GripSocket').every(v=>Math.abs(v)<1e-6),'③ GripSocket 원점');
 const tip=t('BladeTip');ok(!!node('BladeTip')&&tip[1]>.9&&tip[1]<1.2&&Math.abs(tip[0])<.2&&Math.abs(tip[2])<.01,'③ BladeTip +Y '+JSON.stringify(tip));
 ok(!!node('TasselPivot')&&t('TasselPivot')[1]<0,'③ 술 자리가 손잡이 아래');
 ok(!(j?.extensionsRequired||[]).length,'③ 필수 확장 없음(기본 로더로 읽힘)');}
// ④ route
const win={};let stored=null;const sb={window:win,localStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v;}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console};
win.fetch=function(){return 'orig';};
vm.createContext(sb);let loadErr=null;try{vm.runInContext(src,sb,{filename:F});}catch(e){loadErr=e;}
const api=win.__STORYWORLD_HWANDO_SWORD07_R1320__,route=api?.pure?.route;
ok(!loadErr&&api&&typeof route==='function'&&api.on()===true,'④ 불러옴, 기본 켜짐'+(loadErr?' '+loadErr:''));
if(!route){console.log('\nR1320c 환도 07 CPU FAIL');process.exit(1);}
const N='assets/r1313/joseon-hwando-07.glb';
ok(route('assets/r1313/joseon-hwando.glb',true)===N,'④ 기존 칼 → 07');
ok(route('./assets/r1313/joseon-hwando.glb',true)==='./'+N&&route('https://x.test/m0/assets/r1313/joseon-hwando.glb',true)==='https://x.test/m0/'+N,'④ 앞 경로 유지');
ok(route('assets/r1313/joseon-hwando.glb?v=3',true)===N+'?v=3'&&route('assets/r1313/joseon-hwando.glb#a',true)===N+'#a','④ 물음표·해시 꼬리 유지');
ok(route(N,true)===N,'④ 07 자신은 그대로(두 번 바꾸지 않음)');
for(const u of ['assets/r1313/michaela-heart-wand.glb','assets/r1313/memory-arc-rifle.glb','assets/r1309/slayer-greatsword.glb','assets/r1313/joseon-hwando.glbx','assets/r1313/xjoseon-hwando.glb','xassets/r1313/joseon-hwando.glb','assets/r1313/joseon-hwando-scabbard.glb',''])ok(route(u,true)===u,'④ 그대로: '+JSON.stringify(u));
{const o={url:'assets/r1313/joseon-hwando.glb'};ok(route(o,true)===o&&route(null,true)===null&&route(undefined,true)===undefined&&route(7,true)===7,'④ 문자열이 아니면 그대로');}
ok(route('assets/r1313/joseon-hwando.glb',false)==='assets/r1313/joseon-hwando.glb','④ 꺼짐이면 그대로');
// fetch 감싸기: 켜짐 → 07 주소, 끄기 키 → 원래 주소, 다른 주소는 손대지 않음, 인자 그대로 넘김
{const calls=[];const prev=win.fetch;ok(prev.__r1320Sword07===true,'④ fetch 감쌈');
 // 감싼 함수가 부르는 원래 fetch 를 볼 수 없으니 새 창에서 다시 불러 확인
 const w2={fetch:function(u,o){calls.push([u,o]);return 'r';}};let st=null;const sb2={window:w2,localStorage:{getItem:()=>st,setItem:(k,v)=>{st=v;}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console};
 vm.createContext(sb2);vm.runInContext(src,sb2,{filename:F});const opt={credentials:'same-origin'};
 const r=w2.fetch('assets/r1313/joseon-hwando.glb',opt);ok(r==='r'&&calls[0][0]===N&&calls[0][1]===opt,'④ fetch: 07 주소·인자·돌려준 값 그대로');
 w2.fetch('assets/r1313/hunter-oxblood-bow.glb');ok(calls[1][0]==='assets/r1313/hunter-oxblood-bow.glb','④ fetch: 다른 무기는 그대로');
 w2.__STORYWORLD_HWANDO_SWORD07_R1320__.set(false);w2.fetch('assets/r1313/joseon-hwando.glb');ok(calls[2][0]==='assets/r1313/joseon-hwando.glb'&&st==='off','④ fetch: 끄기 키면 기존 칼');
 ok(w2.__STORYWORLD_HWANDO_SWORD07_R1320__.inspect().routed===1&&w2.__STORYWORLD_HWANDO_SWORD07_R1320__.inspect().errors===0,'④ 바꾼 횟수 1, 오류 0');}
// ⑤
const w13=rd('client-source/hero-weapons-3d-r1313.js')||'';
ok(/hwando:\{glb:DIR\+'joseon-hwando\.glb'/.test(w13)&&/ego:\{glb:DIR\+'joseon-hwando\.glb'/.test(w13)&&!w13.includes('joseon-hwando-07'),'⑤ R1313 표는 그대로');
ok(src.includes("storyworld.r1320.sword07")&&!/scabbard|hopae/i.test(src.replace(/\/\/.*$/gm,'')),'⑤ 끄기 키 있음, 칼집·호패 안 붙임');
console.log(fail?'\nR1320c 환도 07 CPU FAIL '+fail:'\nR1320c 환도 07 CPU PASS');process.exit(fail?1:0);
