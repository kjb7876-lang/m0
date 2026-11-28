// R1360 검사 영웅 '절도 있는 베기'·슬레이어 두 손·EGO 고유색 궤적 — 정적·순수 함수 검사(브라우저 없음).
//  사용자 11-27 06:22Z "환도영웅 동작이 절도 있고 확실하게 칼날로 적을 베는 느낌", 06:23Z "슬레이어 확실하게 두손으로 대검을 쥐고서 휘두르고 절도있게",
//  "ego각성영웅도 절도있게 칼날로 적을 화려하게 베는 느낌".
//  ① 연결: 새 오버레이(ego-arc-follow-3d-r1360.js) 원본 = runtime-text 사본, 태그 한 번(R1353 뒤), 공개 검증 목록·매니페스트·CI 줄. 바꾼 R1347·R1353·R1320 사본도 같음.
//  ② R1347 시간 접기 warp: 0→0·1→1, 줄지 않음(단조), 움츠림 끝(strike-CUT)에 windup 자세, strike 에 베기 끝 자세, strike~strike+HOLD 멈춤, 베기 구간 평균 속도가 나머지의 3배 이상.
//  ③ 슬레이어: 찌르기 둘도 두 손(sp.one 은 슬레이어 두 손 설정이 있으면 무시).
//  ④ R1320 칼날 화면 보정: 앞 결과를 원래 칼날이 이번 프레임에 돈 만큼 함께 돌린 뒤, 보정만 720°/s 로 묶음.
//  ⑤ EGO 궤적: Dots 시트 두 장(붓 궤적·섬광), 칼자국 표가 그림 범위 안, 반투명(알파 <1), 칸 번호 경계, 끄기 키.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}};
const F='ego-arc-follow-3d-r1360.js',src=rd('client-source/'+F)||'';
for(const f of [F,'hero-sword-combo-3d-r1347.js','hwando-arc-follow-3d-r1353.js','hero-stance-3d-r1320.js'])ok((rd('client-source/'+f)||'').length>0&&rd('client-source/'+f)===rd('runtime-text/'+f),'① 원본 = runtime-text 사본: '+f);
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
ok(at(F)>0&&at('hwando-arc-follow-3d-r1353.js')>0&&at('hwando-arc-follow-3d-r1353.js')<at(F)&&at('ego-motion-r1048.js')<at(F)&&at('ego-dots-r1139b.js')<at(F)&&html.split(F).length===2,'① 스크립트 태그 한 번, R1353·R1048·R1139b 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'① 공개 검증 목록');
ok((rd('runtime-manifest.json')||'').includes(F)&&(rd('runtime-inputs.json')||'').includes(F),'① 매니페스트·입력 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1360/r1360-cpu-check.cjs'),'① CI 줄');
// ② warp
const C=rd('client-source/hero-sword-combo-3d-r1347.js')||'';
const wsb={window:{},localStorage:{getItem:()=>null,setItem(){}},setInterval(){},setTimeout(){},performance:{now:()=>0},Number,Math,Object,String,Array,JSON,RegExp,console,isFinite,Map,WeakMap,Set,WeakSet};
vm.createContext(wsb);let e1=null;try{vm.runInContext(C,wsb,{filename:'r1347'});}catch(e){e1=e;}
const P=wsb.window.__STORYWORLD_SWORD_COMBO_R1347__?.pure;
ok(!e1&&P&&typeof P.warp==='function'&&P.CUT>0&&P.HOLD>0,'② R1347 warp·CUT·HOLD 내놓음'+(e1?' '+e1:''));
if(P){for(const mv of P.MOVES){const e=mv.keys[mv.keys.length-1].t,w=P.warp;let mono=true,prev=-1;for(let t=0;t<=1.0001;t+=.002){const v=w(mv,t);if(!(v>=prev-1e-9))mono=false;prev=v;}
  const A=Math.max(.05,mv.strike-P.CUT),near=(a,b)=>Math.abs(a-b)<1e-6;
  ok(near(w(mv,0),0)&&near(w(mv,1),1)&&mono,`② ${mv.id}: 0→0·1→1·단조`);
  ok(near(w(mv,A),mv.windup)&&near(w(mv,mv.strike),e)&&near(w(mv,mv.strike+P.HOLD*.5),e)&&near(w(mv,mv.strike+P.HOLD),e),`② ${mv.id}: 움츠림 끝=windup(${mv.windup}), strike=베기 끝(${e}), 그 뒤 ${P.HOLD} 동안 멈춤`);
  const cutSpd=(e-mv.windup)/(mv.strike-A),restSpd=(mv.windup+(1-e))/(1-(mv.strike-A)-P.HOLD);ok(cutSpd>=3*restSpd,`② ${mv.id}: 베기 구간 자세 속도가 나머지의 ${(cutSpd/restSpd).toFixed(1)}배(기준 3배)`);}}
// ③ 슬레이어 두 손
ok(/const one=sp\.one&&!s\.cfg\.two;/.test(C)&&!/sp\.one\?/.test(C),'③ 슬레이어(두 손 설정)는 찌르기도 두 손 — sp.one 은 한 손 영웅에게만');
// ④ R1320 한도
const S=rd('client-source/hero-stance-3d-r1320.js')||'';
ok(/s\.vA=arr\(V\(38\)\.fromArray\(s\.vA\)\.applyQuaternion\(Q\(20\)\.setFromUnitVectors\(V\(39\)\.fromArray\(raw0\),V\(40\)\.fromArray\(dB\)\)\)\);s\.vRaw=dB;/.test(S)&&/s\.vB=VIEW_RATE\*DEG\*Math\.min\(\.1,gap\);/.test(S),'④ R1320: 앞 결과를 원래 칼날이 돈 만큼 함께 돌린 뒤 보정만 720°/s 로 묶음');
ok(/if\(gap>1e-6\)\{if\(s\.vA&&raw0&&cutNow\(s\)\)/.test(S)&&/c\.cutting\(s\.id\)/.test(S),'④ R1320: 함께 돌리기는 R1347 빠른 베기 구간(cutting)에서만 — 첫 섞임·거두기는 예전 720°/s(칼 튐 방지)');
if(P){const api=wsb.window.__STORYWORLD_SWORD_COMBO_R1347__;ok(typeof api.cutting==='function'&&api.cutting('hwando')===false,'④ R1347 cutting(): 공격 없으면 false');}
// ⑤ EGO 궤적
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console,isFinite,Map};
vm.createContext(sb);let e2=null;try{vm.runInContext(src,sb,{filename:F});}catch(e){e2=e;}
const api=win.__STORYWORLD_EGO_ARC_FOLLOW_R1360__,Q=api?.pure;
ok(!e2&&api&&Q&&api.on()===true,'⑤ EGO 궤적 불러옴, 기본 켜짐'+(e2?' '+e2:''));
if(Q){const T=Q.SHEETS.trail,Fl=Q.SHEETS.flash;
 ok(T.path==='assets/r1139/ego/trail-horizontal.webp'&&Fl.path==='assets/r1048/fx/ego_slash.webp'&&fs.existsSync(path.join(R,'runtime-text',T.path))&&fs.existsSync(path.join(R,'runtime-text',Fl.path)),'⑤ Dots 시트 두 장(R1139b 붓 궤적·R1048 섬광), 새 그림 파일 없음');
 for(const [k,s] of Object.entries(Q.SHEETS)){const [cx,cy,cw,ch]=s.crop,inC=p=>p[0]>=cx&&p[0]<=cx+cw&&p[1]>=cy&&p[1]<=cy+ch;
  ok(inC(s.stroke.S)&&inC(s.stroke.E)&&inC(s.stroke.M)&&cx+cw<=s.cell&&cy+ch<=s.cell,`⑤ ${k}: 칼자국 시작·끝·가운데가 잘라 그릴 범위 안`);
  ok(s.alpha>0&&s.alpha<1,`⑤ ${k}: 반투명 (${s.alpha})`);}
 ok(Fl.blend==='lighter'&&T.blend==='source-over'&&Fl.show<T.show,'⑤ 섬광은 가산·짧게, 붓 궤적은 보통 합성·여운 길게(먹선이 남음)');
 const f=Q.frameAt;ok(f(-.01,.3,6)===-1&&f(0,.3,6)===0&&f(.29,.3,6)===5&&f(.31,.3,6)===-1&&f(NaN,.3,6)===-1,'⑤ 칸 번호 경계');}
ok(/storyworld\.r1360\.egoArc/.test(src)&&/:r1048s\\d\+\$/.test(src),'⑤ 끄기 키, 2D 고정 궤적(:r1048s*)은 바꿀 때만 끔');
console.log(fail?`\nR1360 CPU FAIL ${fail}`:'\nR1360 CPU PASS');process.exit(fail?1:0);
