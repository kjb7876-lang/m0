// R615b 얼굴 없는 학생 걷기 8칸 — 사용자 2026-11-10 "이동모션이없는 몹들도 전수조사해서 dots… 생성개선적용"(전수 22번, 마지막 한 종).
//  사몽 S-02 학교의 얼굴 없는 학생은 R380 시트가 아니라 R105 드라이브 원화 한 장(assets/r105/drive/mob-student.webp, 169×420)을
//  R355·R105 가 sprite() 로 그린다 → R380 행을 붙여도 그 그림 길을 타지 않는다.
//  그래서 이 몹을 그리는 동안만 ctx.drawImage 를 보아, 원본 한 장이 칠해지는 순간 걷는 중이면 Dots CX-0067MV 걷기 칸(assets/r615/mob-student-walk8.webp,
//  원본과 같은 캔버스를 높이 320 으로 줄인 8칸, 색은 원본에 맞춤 — scripts/r615-student-walk.py)으로 바꿔 칠한다.
//  · 엔진 sprite 는 원본 대신 필터를 미리 칠한 캔버스(__storyworldStaticTint.path)를 그리므로 그 경로로 알아보고, 시트도 같은 필터로 칠해 쓴다.
//  · 원본 좌표(sprite 의 crop 사각형 포함)를 칸 비율로 옮기므로 그리는 자리·키·좌우 뒤집기·투명도·필터는 원본과 같다.
//  · 칸은 지나간 거리로 고른다(0.105칸마다 한 칸 → 8칸 = 두 걸음 0.84칸, R613 임시 걸음 STRIDE .42 와 같은 보폭) → 발이 미끄러지지 않는다.
//  · 서 있기·공격·조준·맞음·죽음은 원본 한 장 그대로. 걷기 칸이 그려지면 R613 판정이 'frames' 가 되어 임시 걸음은 저절로 꺼진다.
//  · R355 drawImage 훅보다 바깥이어야 R355 가 원본을 칠하는 호출(prev)이 이 훅을 지난다 → R355 뒤에 불러 drawEnemy 를 한 번 감싼다.
//  끄기: localStorage['storyworld.r615.student']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_STUDENT_WALK_R615__)return;
const REV='R615-student-walk-2',KEY='storyworld.r615.student';
const ORIG='assets/r105/drive/mob-student.webp',SHEET='assets/r615/mob-student-walk8.webp',OW=169,OH=420,N=8,STEP=.105,HOLD=.08;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={walkDraws:0,origDraws:0,waits:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const NAME=/얼굴 없는 학생/;
const busy=e=>!!(e.attack||e.rangedWindup>0||e.r268Dash||e.r286?.mode||e.hitTimer>0||e.flash>0);
const srcPath=im=>{try{const s=String(im?.__path||im?.currentSrc||im?.src||'');const i=s.indexOf('assets/');return i>=0?s.slice(i).split(/[?#]/)[0]:'';}catch(_){return '';}};
const W=new WeakMap();
function step(e){const now=T();let s=W.get(e);if(!s){W.set(e,s={lx:e.x,ly:e.y,dist:0,movedAt:-1});return s;}
 const d=Math.hypot((e.x||0)-s.lx,(e.y||0)-s.ly);if(d>1e-4&&d<2){s.dist+=d;s.movedAt=now;}s.lx=e.x;s.ly=e.y;return s;}
const walking=(e,s)=>e.moving!==false&&s.movedAt>=0&&T()-s.movedAt<=HOLD&&!busy(e)&&e.hp>0&&e.spawnState!=='dead';
let asked=0;function sheet(){try{const row=typeof readyImage==='function'?readyImage(SHEET):null;if(row?.image)return row.image;const t=Date.now();if(t-asked>1500){asked=t;if(typeof ensureImages==='function')Promise.resolve(ensureImages([SHEET])).catch(()=>{});}}catch(err){fail(err);}stats.waits++;return null;}
// 엔진 sprite 는 몹 필터(saturate 등)를 ctx.filter 대신 미리 칠한 캔버스(__storyworldStaticTint {path,filter})로 그린다 → 걷기 시트도 같은 필터로 한 번 칠해 둔다.
const tints=new Map();function tinted(im,filter){let c=tints.get(filter);if(c)return c;c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.naturalWidth=c.width;c.naturalHeight=c.height;
 const g=c.getContext('2d');g.filter=filter;g.drawImage(im,0,0);
 // R802: 엔진 sprite 필터 캔버스처럼 정적 표시 — 없으면 Three 기록기가 몹마다 매 프레임 복사해 26마리에서 픽셀 예산을 넘고 게임이 멈춘다(사몽 S-02 광장).
 try{Object.defineProperty(c,'__storyworldStaticTint',{value:Object.freeze({path:SHEET,filter})});}catch(_){}
 tints.set(filter,c);if(tints.size>8)tints.delete(tints.keys().next().value);return c;}
function remap(q,frame,im){const cw=(im.naturalWidth||im.width)/N,ch=im.naturalHeight||im.height,kx=cw/OW,ky=ch/OH,x0=frame*cw;
 if(q.length>=8)return [x0+q[0]*kx,q[1]*ky,q[2]*kx,q[3]*ky,q[4],q[5],q[6],q[7]];
 if(q.length>=4)return [x0,0,cw,ch,q[0],q[1],q[2],q[3]];
 return [x0,0,cw,ch,q[0]||0,q[1]||0,OW,OH];}
function install(){if(typeof drawEnemy!=='function'||drawEnemy.__r615s)return !!drawEnemy?.__r615s;const base=drawEnemy;
 const w=function(e,...a){if(!prefs.on||!e||!NAME.test(String(e.name||''))||typeof ctx==='undefined'||typeof ctx?.drawImage!=='function')return base.call(this,e,...a);
  let s=null;try{s=step(e);}catch(err){fail(err);}const go=s&&walking(e,s),im=go?sheet():null;if(!im)return base.call(this,e,...a);
  const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage'),prev=c.drawImage,frame=Math.floor(s.dist/STEP)%N;
  c.drawImage=function(src,...q){try{const tint=src?.__storyworldStaticTint,p=tint?.path?String(tint.path).replace(/^\.\//,''):srcPath(src);
    if(p===ORIG){const use=tint?.filter?tinted(im,tint.filter):im;stats.walkDraws++;return prev.call(this,use,...remap(q,frame,use));}}catch(err){fail(err);}return prev.call(this,src,...q);};
  try{return base.call(this,e,...a);}finally{if(own)c.drawImage=prev;else delete c.drawImage;}};
 w.__r615s=true;try{drawEnemy=w;}catch(_){}try{window.drawEnemy=w;}catch(_){}return true;}
install();
window.__STORYWORLD_STUDENT_WALK_R615__=Object.freeze({revision:REV,ORIG,SHEET,install,remap,
 set(on){prefs.on=!!on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
