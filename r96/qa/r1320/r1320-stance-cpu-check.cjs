// R1320 3D 영웅 무기 쥔 자세 — 정적·순수 함수 검사(브라우저 없음).
//  ① 연결: 원본 = runtime-text 사본, 스크립트 태그가 R1302·R1313·R1314·R1320 보정 뒤 한 번, 공개 검증 목록·매니페스트·CI 줄.
//  ② 두 뼈 IK(elbow): 닿는 목표면 손이 목표에, 뼈 길이 유지, 팔꿈치가 pole 쪽. 경계: 닿지 않는 목표(뻗은 채 목표 쪽·NaN 없음),
//     어깨와 같은 자리, pole 이 팔 방향과 나란함, 길이 0·NaN.
//  ③ 무기 축(basis): 직교·오른손 좌표, +Y = dir. 경계: side 가 dir 과 나란해도 NaN 없음.
//  ④ 자세 섞기(mix)·가중치(weightOf): 공격 자세가 없는 영웅(환도·EGO)은 공격 동안 가중치 0(원래 베기 모션), 있는 영웅은 늘 1 이고 공격 비율만큼 섞음.
//     경계: 가중치 합 0·NaN·음수.
//  ⑤ 자세 표: 환도·EGO 는 검이 앞·위(올림각 25~70°)이고 공격 자세 없음, 기억사수 공격은 총열 수평·정면·개머리판 기준·왼손 받침, 미카엘라 봉은 거의 곧게.
//     슬레이어(사용자 11-26 "슬레이어가 아니라 환도영웅")와 나머지 영웅은 표에 없음.
//  ⑦ R1320b deflect: 카메라 축과 가까운 칼날을 기준 각만큼 벌림. 경계: 정확히 나란함·반대쪽·이미 벌어짐·길이 0·NaN·기준 0.
//  ⑥ 손대지 않은 것: 렌더 뒤 되돌림(onAfterRender)·끄기 키가 있고, hwando-3d-r1302.js·R1313 표를 고치지 않는다(이 파일 안에서 그 전역을 쓰기만 함).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}};
const F='hero-stance-3d-r1320.js',src=rd('client-source/'+F)||'';
ok(src.length>0&&src===rd('runtime-text/'+F),'① 오버레이 원본 = runtime-text 사본');
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
ok(at(F)>0&&['hwando-3d-r1302.js','slayer-blade-3d-r1309.js','hero-weapons-3d-r1313.js','face-3d-r1314.js','hero-polish-3d-r1320.js'].every(n=>at(n)>0&&at(n)<at(F))&&html.split(F).length===2,'① 스크립트 태그 한 번, R1302·R1309·R1313·R1314·R1320 보정 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'① 공개 검증 목록');
ok((rd('runtime-manifest.json')||'').includes(F)&&(rd('runtime-inputs.json')||'').includes(F),'① 매니페스트·입력 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1320/r1320-stance-cpu-check.cjs'),'① CI 줄');
// 순수 함수 꺼내기(가짜 창)
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console,isFinite};
vm.createContext(sb);let loadErr=null;try{vm.runInContext(src,sb,{filename:F});}catch(e){loadErr=e;}
const api=win.__STORYWORLD_HERO_STANCE_R1320__,P=api?.pure;
ok(!loadErr&&api&&P&&api.on()===true,'순수 함수 불러옴, 기본 켜짐'+(loadErr?' '+loadErr:''));
if(!P){console.log('\nR1320 자세 CPU FAIL');process.exit(1);}
const len=a=>Math.hypot(...a),sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),fin=a=>a.every(Number.isFinite),near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
// ② IK
{const a=[-.24,1.35,.01],t=[-.18,1.0,.30],r=P.elbow(a,t,.289,.27,[-.5,-.6,-.6]);
 ok(fin(r.elbow)&&near(len(sub(r.elbow,a)),.289,1e-6)&&near(len(sub(t,r.elbow)),.27,1e-6)&&len(sub(r.hand,t))<1e-6,'② 닿는 목표: 손이 목표에, 뼈 길이 유지');
 const mid=a.map((x,i)=>(x+t[i])/2);ok(dot(sub(r.elbow,mid),[-.5,-.6,-.6])>0,'② 팔꿈치가 pole 쪽으로 굽음');
 const far=P.elbow(a,[5,5,5],.289,.27,[0,-1,0]);ok(fin(far.elbow)&&fin(far.hand)&&near(len(sub(far.hand,a)),(.289+.27)*.999,1e-6)&&far.reach>1&&dot(sub(far.hand,a),[1,1,1])>0,'② 경계: 닿지 않는 목표 → 뻗은 채 목표 쪽, NaN 없음');
 const same=P.elbow(a,a,.289,.27,[0,-1,0]);ok(fin(same.elbow)&&fin(same.hand)&&near(len(sub(same.elbow,a)),.289,1e-6),'② 경계: 목표가 어깨와 같은 자리 → NaN 없음');
 const par=P.elbow([0,0,0],[0,0,.4],.3,.3,[0,0,1]);ok(fin(par.elbow)&&near(len(par.elbow),.3,1e-6)&&near(len(sub([0,0,.4],par.elbow)),.3,1e-6),'② 경계: pole 이 팔 방향과 나란함 → 다른 축으로 대신');
 const bad=P.elbow([0,0,0],[NaN,0,0],0,NaN,null);ok(fin(bad.elbow)&&fin(bad.hand),'② 경계: 길이 0·NaN 입력 → 유한한 값');}
// ③ 무기 축
{const b=P.basis([.22,.78,.60],[0,1,0]),cr=(a,c)=>[a[1]*c[2]-a[2]*c[1],a[2]*c[0]-a[0]*c[2],a[0]*c[1]-a[1]*c[0]];
 ok([b.X,b.Y,b.Z].every(v=>near(len(v),1,1e-9))&&near(dot(b.X,b.Y),0,1e-9)&&near(dot(b.Y,b.Z),0,1e-9)&&len(sub(cr(b.X,b.Y),b.Z))<1e-9,'③ 직교·오른손 좌표');
 ok(len(sub(b.Y,[.22,.78,.60].map(x=>x/len([.22,.78,.60]))))<1e-9&&b.X[1]>0,'③ +Y = dir, +X 는 side 쪽');
 const p=P.basis([0,1,0],[0,2,0]);ok(fin(p.X)&&fin(p.Z)&&near(len(p.X),1,1e-9),'③ 경계: side 가 dir 과 나란함 → NaN 없음');
 const z=P.basis([0,0,0],[0,0,0]);ok(fin(z.X)&&fin(z.Y)&&fin(z.Z),'③ 경계: 길이 0 → 유한한 값');}
// ④ 섞기·가중치
{const hw=api.stance('hwando'),gu=api.stance('gunner');
 ok(P.weightOf(hw,{idle:1,walk:0,attack:0}).w===1&&P.weightOf(hw,{idle:0,walk:1,attack:0}).w===1,'④ 환도: 대기·걷기 가중치 1');
 ok(P.weightOf(hw,{idle:0,walk:0,attack:1}).w===0&&near(P.weightOf(hw,{idle:.5,walk:0,attack:.5}).w,.5),'④ 환도: 공격 동안 0(원래 베기 모션), 넘어갈 때 부드럽게');
 ok(P.weightOf(gu,{idle:0,walk:0,attack:1}).w===1&&P.weightOf(gu,{idle:0,walk:0,attack:1}).atk===1&&near(P.weightOf(gu,{idle:.75,walk:0,attack:.25}).atk,.25),'④ 기억사수: 늘 1, 공격 비율만큼 조준 자세로');
 for(const w of [{idle:0,walk:0,attack:0},{},null,{idle:NaN,walk:-1,attack:'x'}]){const k=P.weightOf(hw,w),g=P.weightOf(gu,w);ok(Number.isFinite(k.w)&&k.w>=0&&k.w<=1&&Number.isFinite(g.atk)&&g.atk>=0&&g.atk<=1,'④ 경계: 가중치 '+JSON.stringify(w)+' → 0~1');}
 const m0=P.mix(gu.rest,gu.attack,0),m1=P.mix(gu.rest,gu.attack,1),mh=P.mix(gu.rest,gu.attack,.5);
 ok(len(sub(m0.at,gu.rest.at))<1e-9&&len(sub(m1.at,gu.attack.at))<1e-9&&near(m1.twist,gu.attack.twist)&&near(mh.twist,(gu.rest.twist+gu.attack.twist)/2),'④ 섞기: 0 = 대기, 1 = 공격, 가운데는 사이값');
 ok(near(len(mh.dir),1,1e-9)&&fin(mh.side)&&fin(mh.pole)&&mh.dir[1]<0&&mh.dir[1]>gu.rest.dir[1]/len(gu.rest.dir),'④ 섞기: 방향은 단위 벡터, 총구가 대기와 조준 사이');
 ok(P.mix(hw.rest,undefined,.7)===hw.rest||JSON.stringify(P.mix(hw.rest,undefined,.7))===JSON.stringify(hw.rest),'④ 섞기: 한쪽만 있으면 그대로');
 ok(P.mix(null,null,.5)===null&&fin(P.mix(gu.rest,gu.attack,NaN).dir)&&fin(P.mix(gu.rest,gu.attack,9).at),'④ 경계: 둘 다 없음 → null, k NaN·범위 밖 → 유한한 값');}
// ⑤ 자세 표
{const el=d=>Math.asin(d[1]/len(d))*180/Math.PI,heroes=api.heroes();
 ok(JSON.stringify(heroes.slice().sort())===JSON.stringify(['ego','gunner','hwando','michaela']),'⑤ 대상 = 환도·EGO·기억사수·미카엘라 (슬레이어·다른 영웅 없음): '+heroes);
 for(const h of ['hwando','ego']){const s=api.stance(h);ok(s.rest&&!s.attack&&el(s.rest.dir)>=25&&el(s.rest.dir)<=70&&s.rest.dir[2]>.25&&s.rest.at[2]>.15&&s.rest.anchor==='grip','⑤ '+h+': 검이 앞·위(올림각 '+el(s.rest.dir).toFixed(1)+'°), 손은 몸 앞, 공격 자세 없음');}
 ok(JSON.stringify(api.stance('hwando').rest)===JSON.stringify(api.stance('ego').rest),'⑤ EGO 는 환도와 같은 자세(환도 틀)');
 const g=api.stance('gunner');ok(g.attack.anchor==='butt'&&g.rest.anchor==='butt'&&Math.abs(el(g.attack.dir))<=5&&g.attack.dir[2]/len(g.attack.dir)>=.97&&g.left==='Weapon_Socket_L'&&len(g.attack.at)<=.14&&g.attack.at[2]>=0&&g.attack.side[1]<0,'⑤ 기억사수 공격: 개머리판이 어깨 앞('+len(g.attack.at).toFixed(2)+'), 총열 수평·정면, 총 위쪽이 위, 왼손 받침');
 ok(el(g.rest.dir)<=-15&&el(g.rest.dir)>=-50,'⑤ 기억사수 대기: 총구를 내림('+el(g.rest.dir).toFixed(1)+'°)');
 const m=api.stance('michaela');ok(90-el(m.rest.dir)<=20&&m.rest.at[2]>=.12&&m.rest.anchor==='grip'&&m.attack&&el(m.attack.dir)>=30,'⑤ 미카엘라: 봉이 거의 곧게(기울기 '+(90-el(m.rest.dir)).toFixed(1)+'°), 손은 몸 앞, 공격은 봉을 앞으로 내밈');
 const copy=api.stance('hwando');copy.rest.dir[0]=99;ok(api.stance('hwando').rest.dir[0]!==99,'⑤ stance() 는 사본(밖에서 표를 못 바꿈)');
 ok(api.tune('slayer','rest',{at:[0,0,0]})===false&&api.tune('hwando','nope',{})===false&&api.stance('nobody')===null,'⑤ 경계: 없는 영웅·자세 조정은 거절');}
// ⑦ R1320b 칼날을 카메라 축에서 벌리기(deflect)
{const ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,Math.abs(dot(a,b)/(len(a)*len(b))))))*180/Math.PI,c=[-.5,-.6,-.62],M=34*Math.PI/180;
 const near1=P.deflect([-.45,-.62,-.64],c,M);ok(fin(near1)&&near(len(near1),1,1e-9)&&near(ang(near1,c),34,1e-6),'⑦ 축과 가까운 칼날(약 3°) → 34° 로 벌림, 단위 벡터');
 const opp=P.deflect([.45,.62,.64],c,M);ok(near(ang(opp,c),34,1e-6)&&dot(opp,c)<0,'⑦ 카메라를 향한 칼날도 같은 쪽(카메라 쪽)에 둔 채 벌림');
 const far=[1,0,0],kept=P.deflect(far,c,M);ok(len(sub(kept,far))<1e-12,'⑦ 이미 벌어진 칼날은 그대로');
 const par=P.deflect(c,c,M);ok(fin(par)&&near(ang(par,c),34,1e-6),'⑦ 경계: 축과 정확히 나란함 → NaN 없이 벌림');
 const z=P.deflect([0,0,0],[0,0,0],NaN);ok(fin(z)&&near(len(z),1,1e-9),'⑦ 경계: 길이 0·NaN → 유한한 단위 벡터');
 const small=P.deflect([-.5,-.6,-.61],c,0);ok(near(ang(small,c),ang([-.5,-.6,-.61],c),1e-9),'⑦ 경계: 기준 0 → 그대로');
 ok(api.stance('hwando').view>=30&&api.stance('ego').view>=30&&!api.stance('gunner').view&&!api.stance('michaela').view,'⑦ 환도·EGO 만 칼날 벌리기(30° 이상), 총·봉은 해당 없음');}
// ⑥
ok(/scene\.onAfterRender=function/.test(src)&&/function restore\(s\)/.test(src)&&/storyworld\.r1320\.stance/.test(src),'⑥ 렌더 뒤 되돌림·끄기 키');
ok(!/__STORYWORLD_HERO_WEAPONS_R1313__/.test(src)&&!/\.tune\(/.test(src.replace(/tune:\(id,which,patch\)/,''))&&!/WEAPONS\[/.test(src),'⑥ R1313 표를 고치지 않음');
console.log(fail?`\nR1320 자세 CPU FAIL ${fail}`:'\nR1320 자세 CPU PASS');process.exit(fail?1:0);
