// R802 — 사몽 S-02 광장(학생 몹 26마리)에서 게임이 소리 없이 멈추던 문제(헤드리스 실플레이 순회에서 4회 재현).
//  R615 얼굴 없는 학생 걷기 시트를 몹 필터로 미리 칠한 캔버스에 '정적' 표시(__storyworldStaticTint)가 없어,
//  Three.js 기록기가 그 캔버스(1032×320=33만 px)를 매 프레임 몹마다 '바뀌는 캔버스'로 복사 → 26마리면 프레임당 픽셀 예산(8,388,608)을 넘어
//  'Actor snapshot budget exceeded' → Three 실패·Legacy 전환 → hospital-pc-test 가 매 프레임 modal=true 로 게임을 멈춘다(창 없이 이동 잠금처럼 보임).
//  엔진 sprite 의 필터 캔버스와 같은 꼴 {path,filter} 로 표시하면 기록기는 복사하지 않고 텍스처를 한 번만 만든다.
// CPU 에서 가짜 엔진·가짜 기록기 규칙으로 본다. GPU·실기기는 미검증.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}else console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','mob-student-walk-r615.js'),'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text','mob-student-walk-r615.js'),'utf8')===src,'runtime-text copy synced');
const calls=[];const sh={src:'https://x/m0/assets/r615/mob-student-walk8.webp',naturalWidth:1032,naturalHeight:320};
const tintOf=f=>{const t={width:169,height:420,naturalWidth:169,naturalHeight:420};Object.defineProperty(t,'__storyworldStaticTint',{value:Object.freeze({path:'assets/r105/drive/mob-student.webp',filter:f})});return t;};
const made=[];const ctx={drawImage(im,...q){calls.push([im,q]);}};let body=tintOf('saturate(.8)');
const g={time:0,ctx,localStorage:{getItem:()=>null,setItem(){}},readyImage:p=>p==='assets/r615/mob-student-walk8.webp'?{image:sh}:null,ensureImages:()=>Promise.resolve(),Date,Math,String,Object,Promise,JSON,WeakMap,Map,
 document:{createElement:()=>{const c={getContext:()=>({drawImage(im){c.from=im;},set filter(v){c.filter=v;}})};made.push(c);return c;}}};
g.drawEnemy=function(e){ctx.drawImage(body,9,9,151,402,-10,-50,20,50);};g.window=g;vm.createContext(g);vm.runInContext(src,g);
// 기록기(dist/phase1.js DrawCommands.drawImage)의 판정을 그대로 옮김: 캔버스이고 표시가 없으면 매 프레임 픽셀 복사.
const phase1=fs.readFileSync(path.join(R,'runtime-text','dist','phase1.js'),'utf8');
ok(/tint=image\.__storyworldStaticTint\|\|image\.__storyworldStaticSource;let source=image,mutable=typeof image\.getContext==='function'&&!tint/.test(phase1),'recorder rule unchanged: unmarked canvas = per-frame snapshot');
const BUDGET=+(phase1.match(/maxSnapshotPixels\s*[:=]\s*(\d+)/)||[])[1]||8388608;
const mutable=im=>typeof im.getContext==='function'&&!(im.__storyworldStaticTint||im.__storyworldStaticSource);
let px=0;const studs=[];for(let i=0;i<26;i++)studs.push({name:'얼굴 없는 학생 '+i,x:i,y:1,hp:5});
for(const s of studs)g.drawEnemy(s);g.time=.05;calls.length=0;for(const s of studs){s.x+=.2;g.drawEnemy(s);}
const drawn=calls.map(c=>c[0]);ok(drawn.length===26&&drawn.every(im=>im===made[0]),'26 walking students all draw the one tinted sheet canvas',{drawn:drawn.length,made:made.length});
for(const im of drawn)if(mutable(im))px+=im.width*im.height;
ok(px<BUDGET,'one frame of 26 walking students stays under the recorder snapshot budget',{px,BUDGET});
const t=made[0]?.__storyworldStaticTint;
ok(t&&t.path==='assets/r615/mob-student-walk8.webp'&&t.filter==='saturate(.8)','tinted sheet canvas is marked static like engine sprite tints {path:SHEET,filter}',t);
ok(t&&Object.isFrozen(t),'mark is frozen');
// 필터가 다르면 캔버스·표시도 따로
body=tintOf('saturate(.5)');g.time=.1;calls.length=0;studs[0].x+=.2;g.drawEnemy(studs[0]);
ok(made.length===2&&made[1].__storyworldStaticTint?.filter==='saturate(.5)'&&calls[0][0]===made[1],'second filter → own canvas, own mark');
ok(g.__STORYWORLD_STUDENT_WALK_R615__.inspect().stats.errors===0,'no errors');
console.log(JSON.stringify({ok:bad===0,checks:n}));process.exit(bad?1:0);
