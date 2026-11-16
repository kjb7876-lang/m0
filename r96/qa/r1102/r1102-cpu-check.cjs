// R1102 헌터 화살 크기·활 손잡이 발사·항상 공격 모션 — CPU 검사(정적 + 순수 함수).
//  node r96/qa/r1102/r1102-cpu-check.cjs
//  사용자 2026-11-16 06:12Z "헌터 기본화살이 너무크고 활에서 안나가는 문제 개선 및 헌터 공격및 스킬시전시 항상 공격모션나가도록".
//  헤드리스 측정(qa/r1102/review.md): ① 기본 화살 몸통 = 영웅 키 0.80배 ② 화살이 발밑(탄 자리 18px 위)에서 나가 활 손잡이와 영웅 키 0.40배 떨어짐
//   ③ 보호막(R1027 돔)이 있으면 R425 가 돔을 공격 그림으로 바꿔 헌터가 둘로 그려짐(공격 프레임의 23%) ④ 걸으며 쏠 때 공격 그림 8%.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const F='hunter-aim-r1102.js';
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
const src=rd('client-source',F);
// ---- 정적: 연결 ----
ok(src.length>0&&src===rd('runtime-text',F),'R1102 모듈이 있고 runtime-text 사본과 같음');
const html=rd('runtime-text','index.html'),tags=[...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m=>m[1]);
ok(tags.filter(t=>t===F).length===1&&tags.indexOf(F)===tags.indexOf('gunner-aim-r991.js')+1&&tags.indexOf(F)<tags.indexOf('combat-r118.js'),'태그 하나, gunner-aim-r991 바로 뒤·combat-r118 앞',{i:tags.indexOf(F)});
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r1102\/r1102-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/addEventListener\(\s*['"]key/.test(code)&&!/KeyboardEvent/.test(code),'새 키 입력 없음(스킬 키 늘리지 않음)');
ok(!/\.damage\s*=|\.radius\s*=|attackCD\s*=|\.interval\s*=|\.pierce\s*=/.test(code),'피해·반경·관통·연사 간격을 쓰지 않음');
// ---- ① 화살 크기: R912 PJ-02(헌터 기본 화살) 몸통 = 영웅 키 × size ----
const r912=rd('client-source','projectile-sheets-r912.js'),m=/pj02:\{src:\[HV\+'hunter-a\.webp'\],size:([.\d]+)/.exec(r912);
ok(m&&+m[1]>=.45&&+m[1]<=.56,'헌터 기본 화살 몸통 = 영웅 키 0.45~0.56배(이전 0.80)',m&&m[1]);
const m7=/pj07:\{src:\[HV\+'hunter-a\.webp'\],size:([.\d]+)/.exec(r912);ok(m7&&+m7[1]===.70,'헌터 연사(Q) 화살은 그대로 0.70',m7&&m7[1]);
// ---- 순수 함수 ----
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){}};win.addEventListener=()=>{};
vm.createContext(sb);vm.runInContext(src,sb);const A=win.__STORYWORLD_HUNTER_AIM_R1102__;
ok(A&&['grip','sideOf','screenToGround','launch'].every(k=>typeof A[k]==='function'),'API grip·sideOf·screenToGround·launch');
// 활 손잡이(R425 attack-r/l 놓기 칸에서 잰 픽셀, 발 기준점 대비 · 몸 201px 기준)
const gr=A.grip('r',1),gl=A.grip('l',1);
ok(Math.abs(gr.dx-53)<=3&&Math.abs(gr.dy+156)<=4&&Math.abs(gl.dx+53)<=3&&Math.abs(gl.dy+156)<=4,'R1102b 활시위(놓은 뒤 시위 줄 x=125, 왼쪽은 거울 67): 오른쪽 (+53,−156)·왼쪽 (−53,−156) px(몸 201 기준) — 손잡이 +73 보다 몸 쪽',{gr,gl});
const g2=A.grip('r',.5);ok(Math.abs(g2.dx-gr.dx*.5)<1e-9&&Math.abs(g2.dy-gr.dy*.5)<1e-9,'배율에 비례');
ok(['x',null,undefined,NaN].every(s=>{const g=A.grip(s,1);return Number.isFinite(g.dx)&&Number.isFinite(g.dy);})&&[NaN,Infinity,-1].every(k=>{const g=A.grip('r',k);return g.dx===0&&g.dy===0;}),'이상한 값 → 유한값(배율 이상하면 0)');
// 쏘는 쪽: 화면 가로 차이 > 2px 이면 그쪽, 아니면 보는 방향, 그것도 없으면 지난 쪽
ok(A.sideOf(-30,'right','r')==='l'&&A.sideOf(30,'left','l')==='r'&&A.sideOf(1,'left','r')==='l'&&A.sideOf(-1,'right','l')==='r'&&A.sideOf(0,'front','l')==='l'&&A.sideOf(NaN,'back','r')==='r'&&A.sideOf(0,'front',undefined)==='r','쏘는 쪽 규칙(경계: 가로 차 2px 이하는 보는 방향)');
// 화면 → 땅: 엔진 project((x−y)·T, (x+y)·T/2) 의 역
const TILE=64,proj=(x,y,z)=>({x:(x-y)*TILE*z,y:(x+y)*TILE*.5*z});
for(const [rx,ry,z] of [[73,-120,1],[-74,-60,1.5],[0,0,.7],[10,40,2]]){const o={x:3.2,y:-1.1},g=A.screenToGround(o,rx,ry,TILE,z),a=proj(o.x,o.y,z),b=proj(g.x,g.y,z);ok(Math.abs(b.x-a.x-rx)<1e-6&&Math.abs(b.y-a.y-ry)<1e-6,`화면 오프셋 (${rx},${ry}) zoom ${z} 역변환`);}
// 발사점: 발 화면점 + 손잡이 − 들림 + 탄 그리기 높이(18·zoom) → 땅 좌표. 탄은 그 자리에서 같은 표적을 향하고 속도 크기 그대로.
const L=A.launch({x:5,y:5},{side:'r',k:.25,lift:0,zoom:1,TILE},{x:5,y:5,vx:16,vy:0,life:.6},{x:12,y:5});
{const a=proj(5,5,1),b=proj(L.x,L.y,1),want={x:a.x+53*.25,y:a.y-156*.25+18};ok(Math.abs(b.x-want.x)<.5&&Math.abs(b.y-want.y)<.5,'발사점 = 활시위(탄 그리기 높이 보정)',{b,want});
 ok(Math.abs(Math.hypot(L.vx,L.vy)-16)<1e-9&&Math.abs(Math.atan2(L.vy,L.vx)-Math.atan2(5-L.y,12-L.x))<1e-9,'속도 크기 그대로·표적을 향함');
 ok(Math.abs(L.life-(.6+(Math.hypot(12-L.x,5-L.y)-7)/16))<1e-9,'수명은 늘어난/줄어든 거리만큼만 보정');}
{const L2=A.launch({x:5,y:5},{side:'r',k:.25,lift:0,zoom:1,TILE},{x:5,y:5,vx:16*Math.cos(.14),vy:16*Math.sin(.14),life:.6},{x:12,y:5});ok(Math.abs((Math.atan2(L2.vy,L2.vx)-Math.atan2(5-L2.y,12-L2.x))-.14)<1e-9,'분산 사격(±0.14) 각도 차이는 그대로');}
ok(A.launch({x:NaN,y:0},{side:'r',k:.25,zoom:1,TILE},{x:0,y:0,vx:1,vy:0,life:1},{x:1,y:0})===null&&A.launch({x:0,y:0},{side:'r',k:.25,zoom:1,TILE},{x:0,y:0,vx:0,vy:0,life:1},{x:1,y:0})===null,'유한하지 않거나 속도 0 이면 바꾸지 않음(null)');
// R1102b 화살 꼬리(오늬)가 시위에 닿게: 화살 몸통은 탄 자리가 가운데라 half(화면 px)만큼 겨눈 쪽으로 앞세운다(사용자 2026-11-16 11:07Z "왜 활시위에서 안나가고 윗쪽머리에서 나가냐")
for(const [tx,ty] of [[12,5],[5,-2],[5,12],[-3,5],[11,-4]]){const H=10,k=.25,s0={x:5,y:5,vx:16,vy:0,life:.6},Lh=A.launch({x:5,y:5},{side:'r',k,lift:0,zoom:1,TILE,half:H},s0,{x:tx,y:ty}),L0=A.launch({x:5,y:5},{side:'r',k,lift:0,zoom:1,TILE,half:0},s0,{x:tx,y:ty});
 const a=proj(L0.x,L0.y,1),b=proj(Lh.x,Lh.y,1),f=proj(5,5,1),T=proj(tx,ty,1),dx=T.x-f.x,dy=T.y-f.y,d=Math.hypot(dx,dy)||1;
 ok(Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-H)<.5&&((b.x-a.x)*dx+(b.y-a.y)*dy)/d>H-.5,`화살 꼬리 시위: 겨눈 쪽 화면 ${H}px 앞세움 (표적 ${tx},${ty})`,{a,b});}
{const g=A.launch({x:5,y:5},{side:'r',k:.25,lift:0,zoom:1,TILE},{x:5,y:5,vx:16,vy:0,life:.6},{x:12,y:5}),g0=A.launch({x:5,y:5},{side:'r',k:.25,lift:0,zoom:1,TILE,half:0},{x:5,y:5,vx:16,vy:0,life:.6},{x:12,y:5});ok(Math.abs(g.x-g0.x)<1e-9&&Math.abs(g.y-g0.y)<1e-9,'half 를 안 주면 앞세우지 않음');}
ok(/ARROW_HALF\s*=\s*\.2[0-9]*/.test(src)&&/half:/.test(src),'모듈이 화살 몸통 절반(영웅 키 0.25배)을 앞세움');
// ---- R425: 헌터 공격 그림 ----
const r425=rd('client-source','combat-flow-r425.js'),hu=r425.slice(r425.indexOf('// ---- ⑥ 헌터'),r425.indexOf('// ---- ⑧'));
ok(/HUNT_BODY/.test(hu)&&/barrier/.test(hu)&&/if\(!HUNT_BODY\.test\(s\)\|\|HUNT_NOT\.test\(s\)\)continue/.test(hu),'R425 헌터: 몸 그림만 바꾼다(보호막 돔 등 제외 → 헌터 둘 금지)');
ok(/huntSwing=perBody\(/.test(hu),'R425 헌터: 휘두르기 상태가 몸마다 따로(사냥 분대 헌터 분신·배치 헌터가 덮지 않음)');
ok(/__STORYWORLD_HUNTER_AIM_R1102__/.test(hu),'R425 헌터: 쏘는 쪽을 R1102(실제 쏜 쪽)에 먼저 묻는다');
ok(/always/.test(hu),'R425 헌터: 휘두르는 동안은 맞거나 걸어도 공격 그림(항상 공격 모션)');
// ---- R440: 헌터 스킬은 이동 입력이 있어도 공격 모션 ----
const r440=strip(rd('client-source','skill-attack-r440.js'));
ok(/p\.hero!=='hunter'&&window\.__STORYWORLD_HERO_MOTION_R895__\?\.moveCancel/.test(r440),'R440: 헌터 스킬은 걷기로 캔슬하지 않음');
console.log(`\nR1102 CPU 검사 ${n}개 통과`);
