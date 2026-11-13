// R991 기억사수 총구·시선 방향 맞추기 — CPU 검사(정적 + 순수 함수).
//  node r96/qa/r991/r991-cpu-check.cjs
//  사용자 2026-11-13 03:26Z "기억사수 총구방향이랑 바라보는 곳이랑 이미지가 달라서". 헤드리스 측정(qa/r991/review.md):
//   ① 기본 공격 몸 그림은 R143 공격 시트인데 R425 규칙(좌·우 그림이 ±60°)으로 45° 아래를 쏴도 총이 수평인 그림이 나왔다.
//   ② 탄은 엔진 총구표(옛 그림 hero_direction334 기준)에서 나가 R143 그림의 총구 끝과 어긋났다.
//  고침: 쏜 방향(화면 각)에 총 각도가 가장 가까운 시트(5방향 + 좌우 반전)를 고르고, 탄을 그 칸의 총구 끝에서 내보낸다.
//  판정·피해·사거리·연사 속도는 그대로(탄 속도 크기·피해·반경 불변, 탄은 같은 표적을 향함).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const F='gunner-aim-r991.js';
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const src=rd('client-source',F);
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
// ---- 정적 ----
ok(src.length>0&&src===rd('runtime-text',F),'R991 모듈이 있고 runtime-text 사본과 같음');
const html=rd('runtime-text','index.html');
ok(html.split('"./'+F+'"').length===2,'index.html 스크립트 태그 한 번');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r991\/r991-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/addEventListener\(\s*['"]key/.test(code)&&!/KeyboardEvent/.test(code),'새 키 입력 없음(스킬 키 늘리지 않음)');
ok(!/\.damage\s*=|\.radius\s*=|attackCD\s*=|\.interval\s*=/.test(code),'피해·반경·연사 간격을 쓰지 않음');
// ---- 순수 함수(가짜 창에서 올림) ----
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){}};sb.window=win;win.addEventListener=()=>{};
vm.createContext(sb);vm.runInContext(src,sb);const A=win.__STORYWORLD_GUNNER_AIM_R991__;
ok(A&&typeof A.pick==='function'&&typeof A.tip==='function'&&typeof A.gunAngle==='function','API pick·tip·gunAngle');
const D=Math.PI/180,angDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))/D;
// 8방향 화면 각(오른쪽 0°, 아래 +90°)마다 고른 그림의 총 각도 오차
const want={e:0,se:45,s:90,sw:135,w:180,nw:-135,n:-90,ne:-45},rows={};
for(const [k,deg] of Object.entries(want)){const p=A.pick(deg*D);rows[k]={sheet:p.sheet,mirror:p.mirror,err:+angDiff(deg*D,A.gunAngle(p.sheet,p.mirror)).toFixed(1)};}
console.log('PICK '+JSON.stringify(rows));
ok(['e','w','se','sw','ne','nw'].every(k=>rows[k].err<=13),'옆·대각 6방향: 총 각도 오차 13° 이하',rows);
ok(rows.n.err<=34&&rows.s.err<=41,'정 위·정 아래: 있는 그림 중 가장 가까운 것(위 ≤34°, 아래 ≤41° — 정면 조준 그림이 없어 Dots 요청)',rows);
ok(rows.w.mirror&&rows.sw.mirror&&rows.nw.mirror&&!rows.e.mirror&&!rows.se.mirror&&!rows.ne.mirror,'왼쪽은 오른쪽 그림 반전, 오른쪽은 반전 없음',rows);
ok(rows.se.sheet==='se'&&rows.sw.sheet==='se'&&rows.ne.sheet==='ne'&&rows.nw.sheet==='ne'&&rows.n.sheet==='n'&&rows.s.sheet==='s','대각선은 몸을 돌린 대각 그림, 정 위·아래는 뒷모습·앞모습',rows);
// 360° 전부: 총 각도 오차가 가장 가까운 후보보다 10° 넘게 나쁘지 않음(몸 방향 가중이 총 방향을 해치지 않게)
let worst=0,nonOpt=0;for(let d=-180;d<180;d+=1){const p=A.pick(d*D),e=angDiff(d*D,A.gunAngle(p.sheet,p.mirror));let best=1e9;for(const s of A.SHEETS)for(const m of [false,true])best=Math.min(best,angDiff(d*D,A.gunAngle(s,m)));if(e>best+10+1e-9)nonOpt++;worst=Math.max(worst,e);}
ok(nonOpt===0,'360° 모든 각에서 총 각도 오차 ≤ 최적+10°',{nonOpt});
// 연속성: 각을 1°씩 돌릴 때 고른 그림이 오락가락하지 않음(바뀌는 지점 10곳 이하)
{let ch=0,prev=null;for(let d=-180;d<=180;d++){const p=A.pick(d*D),k=p.sheet+p.mirror;if(prev&&k!==prev)ch++;prev=k;}ok(ch<=10,'1° 단위로 돌릴 때 그림 바뀜 10번 이하(깜빡임 없음)',{ch});}
ok(worst<=41,'최악 오차 41° 이하(정 아래)',{worst});
// 경계값: NaN·Infinity·큰 각도
const bad=[NaN,Infinity,-Infinity,1e12,-7*Math.PI];for(const v of bad){const p=A.pick(v);ok(p&&A.SHEETS.includes(p.sheet)&&typeof p.mirror==='boolean','pick('+v+') 은 유효한 그림을 돌려줌(멈추지 않음)',p);}
// 총구 끝 표: 칸 안(0..192 × 0..256), 프레임 경계 clamp
for(const s of A.SHEETS)for(const fr of [-3,0,2,5,9,NaN]){const t=A.tip(s,fr);ok(Array.isArray(t)&&t.every(Number.isFinite)&&t[0]>=0&&t[0]<=192&&t[1]>=0&&t[1]<=256,'tip('+s+','+fr+') 칸 안 유한값',t);}
// 총구 끝은 몸 중심(96)에서 총 방향으로 나가 있어야 함(코트 자락을 잡은 값이 아님)
for(const s of A.SHEETS){const t=A.tip(s,0),g=A.gunAngle(s,false),v=(t[0]-96)*Math.cos(g)+(t[1]-100)*Math.sin(g);ok(v>20,'시트 '+s+' 첫 칸 총구 끝이 총 방향으로 몸 밖',{t,g:g/D,v});}
// 화면 → 땅 역변환(엔진 project 와 같은 꼴)
const cam={x:3,y:5},TILE=64,zoom=1.3,W=960,H=540,project=(x,y)=>({x:(x-y-cam.x+cam.y)*TILE*zoom+W/2,y:(x+y-cam.x-cam.y)*TILE*.5*zoom+H*.52});
const g=A.screenToGround({x:10,y:12},12,-30,TILE,zoom),a=project(10,12),b=project(g.x,g.y);
ok(Math.abs(b.x-a.x-12)<1e-6&&Math.abs(b.y-a.y+30)<1e-6,'화면 오프셋 → 땅 좌표 역변환이 project 와 맞음',{a,b});
ok(Object.values(A.screenToGround({x:1,y:1},NaN,5,TILE,zoom)).every(Number.isFinite),'역변환 NaN 입력은 0 으로');
console.log(JSON.stringify({passed:n}));
