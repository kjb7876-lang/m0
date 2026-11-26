// R1320 3D 영웅 가독성·재질 보정 — 정적·순수 함수 검사(브라우저 없음).
//  ① 연결: 원본 = runtime-text 사본, 스크립트 태그가 R1302·R1313·R1314 뒤, 공개 검증 목록·매니페스트·CI 줄.
//  ② 셰이더 고쳐 쓰기: 맵 수묵(R1055)·국지 조명(R451) 호출을 지움, 덧빛은 표준 재질에만 한 번(두 번 불러도 한 번), 구운 몸은 텍스처 곱을 뺌,
//     먹 껍질은 깊이 밀기만. 경계: 자리가 없는 셰이더·글이 아닌 값은 그대로, 예외 없음.
//  ③ GLSL 예약어를 변수 이름으로 쓰지 않음(회귀: 'flat' 변수로 몸 셰이더가 깨져 몸이 안 그려졌던 일), 무기 껍질은 objectNormal 이 아니라 normal.
//  ④ 고유색 표 10명(0~1), 페르소나·EGO 언주, 환도 흰빛. 노출 맞춤 배율 경계(0·NaN·255·환도 145·슬레이어 49).
//  ⑤ 손대지 않은 것: hwando-3d-r1302.js(해시 고정 검사 대상)·수묵·국지 조명 파일은 이 작업에서 안 바뀜(스킵 열쇠 이름만 맞는지 확인).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}};
const F='hero-polish-3d-r1320.js',src=rd('client-source/'+F)||'';
ok(src.length>0&&src===rd('runtime-text/'+F),'① 오버레이 원본 = runtime-text 사본');
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
ok(at(F)>0&&at('hwando-3d-r1302.js')<at(F)&&at('hero-weapons-3d-r1313.js')<at(F)&&at('face-3d-r1314.js')<at(F)&&html.split(F).length===2,'① 스크립트 태그 한 번, R1302·R1313·R1314 뒤');
ok((fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8')).includes("'"+F+"'"),'① 공개 검증 목록');
ok((rd('runtime-manifest.json')||'').includes(F)&&(rd('runtime-inputs.json')||'').includes(F),'① 매니페스트·입력 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1320/r1320-cpu-check.cjs'),'① CI 줄');
// 순수 함수 꺼내기(가짜 창)
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame(){},Number,Math,Object,String,Array,WeakSet,WeakMap,Float32Array,Uint32Array,console};
vm.createContext(sb);vm.runInContext(src,sb,{filename:F});const A=win.__STORYWORLD_HERO_POLISH_R1320__;
ok(A&&typeof A.pure?.rewrite==='function'&&A.on()===true&&A.inspect().materials===0&&A.inspect().errors===0,'API·기본 켜짐·시작 때 대상 0');
if(A){const {rewrite,glsl,gainFor}=A.pure;
 const INK='gl_FragColor.rgb=r1055Ink(gl_FragColor.rgb);',LIGHT='gl_FragColor.rgb*=r451Light();',CS='#include <colorspace_fragment>';
 const std=()=>({uniforms:{},vertexShader:'void main(){\n#include <begin_vertex>\n#include <project_vertex>\n}',fragmentShader:'void main(){\n#include <map_fragment>\n'+CS+'\n'+LIGHT+'\n#define r1055Ink(c) r1055Wash(c)\n'+INK+'\n}'});
 let s=std();rewrite(s,'hwando',false,true,false,false);
 ok(!s.fragmentShader.includes(INK)&&!s.fragmentShader.includes(LIGHT),'② 맵 수묵·국지 조명 호출 지움');
 ok(s.fragmentShader.split('r1320Polish(r1320Raw').length===2&&s.fragmentShader.includes('vec3 r1320Raw=gl_FragColor.rgb;')&&s.uniforms.r1320K,'② 표준 재질에 덧빛 한 번 + 세기 유니폼');
 ok(s.fragmentShader.includes('#include <map_fragment>'),'② 굽지 않은 재질은 텍스처 곱 유지');
 ok(s.fragmentShader.lastIndexOf('r1320Polish(r1320Raw')<s.fragmentShader.lastIndexOf('}')&&s.fragmentShader.indexOf(CS)<s.fragmentShader.lastIndexOf('r1320Polish(r1320Raw'),'② 덧빛은 색공간 변환 뒤·main 끝');
 const once=s.fragmentShader;rewrite(s,'hwando',false,true,false,false);ok(s.fragmentShader===once,'② 두 번 불러도 한 번(같은 글)');
 s=std();rewrite(s,'gunner',false,true,true,false);ok(!s.fragmentShader.includes('#include <map_fragment>'),'② 구운 몸은 텍스처 곱을 뺌');
 s=std();rewrite(s,'slayer',true,false,false,false);ok(!s.fragmentShader.includes('r1320Polish')&&!s.fragmentShader.includes(INK),'② 기본 재질(껍질·빛 부품)은 덧빛 없이 호출만 지움');
 s=std();rewrite(s,'hwando',false,false,false,true);ok(s.vertexShader.includes('gl_Position.z+=r1320PushInk*gl_Position.w;')&&s.uniforms.r1320PushInk&&!s.fragmentShader.includes('r1320Polish'),'② 먹 껍질은 깊이 밀기만');
 const v1=s.vertexShader;rewrite(s,'hwando',false,false,false,true);ok(s.vertexShader===v1,'② 깊이 밀기도 한 번');
 s=std();rewrite(s,'hwando',false,true,false,false);ok(!s.vertexShader.includes('r1320PushInk'),'② 몸 재질은 깊이를 밀지 않음');
 // 경계
 s={uniforms:{},vertexShader:'',fragmentShader:'void main(){}'};let threw=false;try{rewrite(s,'hwando',false,true,false,true);}catch(_){threw=true;}ok(!threw&&s.fragmentShader==='void main(){}','② 경계: 자리가 없는 셰이더는 그대로');
 threw=false;try{rewrite({fragmentShader:null},'x',false,true,false,false);rewrite({fragmentShader:CS+'}',vertexShader:null},'없는영웅',true,true,true,true);}catch(_){threw=true;}ok(!threw,'② 경계: 글이 아닌 값·모르는 영웅도 예외 없음');
 // ③ 예약어
 const RES=/\b(?:vec[234]|float|int|bool|mat[234])\s+(flat|smooth|centroid|sample|input|output|filter|common|active|partition|half|fixed|superp|inline|noinline|patch|precise|sampler|texture|layout|in|out)\b/;
 let bad=[];for(const h of Object.keys(A.rim).concat('없는영웅'))for(const w of [false,true]){const g=glsl(h,w),m=RES.exec(g);if(m)bad.push(h+':'+m[1]);if(!/vec3 r1320Polish\(vec3 lit,vec3 albedo,vec3 n\)/.test(g)||/NaN|Infinity|undefined/.test(g))bad.push(h+':shape');}
 ok(bad.length===0,'③ GLSL 예약어를 변수로 쓰지 않음·숫자 정상 ('+bad.join()+')');
 ok(/transformed \+= normalize\( normal \) \* /.test(src)&&/USE_SKINNING \)\\ntransformed \+= normalize\( objectNormal \)/.test(src),'③ 무기 껍질 = normal, 스킨 껍질만 objectNormal');
 // ④
 const hue=c=>{const [r,g,b]=c,mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<.02)return null;const h=mx===r?(g-b)/(mx-mn):mx===g?2+(b-r)/(mx-mn):4+(r-g)/(mx-mn);return(h*60+360)%360;},sat=c=>(Math.max(...c)-Math.min(...c))/Math.max(...c);
 const ids=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner','persona','ego'];
 ok(ids.every(h=>Array.isArray(A.rim[h])&&A.rim[h].length===3&&A.rim[h].every(v=>v>=0&&v<=1))&&Object.keys(A.rim).length===10,'④ 고유색 표 10명, 0~1');
 const red=c=>{const h=hue(c);return h!==null&&(h<=28||h>=340)&&sat(c)>.35;};ok(red(A.rim.persona)&&red(A.rim.ego),'④ 페르소나·EGO 언주');ok(sat(A.rim.hwando)<.2&&Math.min(...A.rim.hwando)>.7,'④ 환도 흰빛');
 ok(Object.isFrozen(A.rim)&&Object.isFrozen(A.rim.persona)&&Object.isFrozen(A.tune),'④ 표는 바꿀 수 없음');
 const mx=A.expose.max;ok(gainFor(0)===mx&&gainFor(NaN)===1&&gainFor(255)===1&&gainFor(1e9)===1&&gainFor(-5)===mx,'④ 노출 배율 경계(0·음수 = 최대, NaN·255·큰 값 = 1)');
 ok(Math.abs(gainFor(145)-A.expose.target/145)<1e-9&&gainFor(145)>1.3&&gainFor(49)===mx&&mx<=1.6,'④ 환도(145) '+gainFor(145).toFixed(2)+'배, 슬레이어(49) 최대 '+mx+'배까지만(어두운 옷은 어두운 채)');
 ok(A.set(false)===false&&A.inspect().strength===0&&A.set(true)===true&&A.inspect().strength===1,'끄기·켜기 = 덧빛 세기 0·1');}
// ⑤
ok(/userData\?\.r1055Skip/.test(rd('client-source/ink-wash-r1055.js')||'')&&/userData\?\.r451/.test(rd('client-source/local-light-r451.js')||''),'⑤ 수묵·국지 조명의 제외 열쇠 이름 그대로(r1055Skip·r451)');
ok(/u\.r1055Skip=true;u\.r451=true;/.test(src),'⑤ 묶음의 메시에 두 열쇠를 건다');
ok(!/hwando-3d-r1302\.js['"]\s*\)|writeFile/.test(src),'⑤ 다른 오버레이 파일을 고치지 않음');
console.log(fail?'R1320 FAIL '+fail:'R1320 ALL OK');process.exit(fail?1:0);
