// R1108 — 영웅 모션 일관성 두 가지(사용자 2026-11-16 06:59Z "네온 공격모션시 다른 모션에비해 두께가 더커지는 문제 일관성개선, 서하 대각선이동할때 너무 종이같은 느낌나는거 개선").
//  ① 네온·라우렌 좌우 기본 공격(R437 시트): 그림이 무릎을 굽혀 앞으로 찌르는 웅크린 자세인데, R143 은 '머리 꼭대기~발' 높이(body 180·205)를
//     서기 키에 맞췄다 → 웅크린 만큼 몸 전체가 커져 공격 때만 몸이 두꺼워 보였다(화면 실측: 부츠 밑창 길이 네온 1.21배·라우렌 1.24배, 머리 크기도 같은 비율).
//     굳은 부위(부츠 밑창)로 잰 실제 몸 비율만큼 body 값을 늘려 서기·걷기와 같은 몸 크기로 그린다 — 발 자리는 그대로, 웅크린 만큼 머리가 낮아진다.
//     시트 그림·칸·발 기준점·창끝 표는 바꾸지 않는다(R437 표를 읽는 R143 place·R425 tipFor 가 그대로 쓴다).
//  ② 서하 대각 걷기: 서하의 walk-se·walk-ne 시트는 몸이 거의 돌지 않은 정면·뒷면 그림이라, 대각선으로 갈 때 정면 그림이 비스듬히 미끄러져
//     종이 인형처럼 보였다(네온 등 다른 영웅의 대각 시트는 3/4 로 돈 그림). 서하만 대각 걷기를 걷는 쪽을 향한 옆 걷기(walk-e, 왼쪽은 반전)로 바꾼다.
//     칸 수(8)·몸 키(180)가 같아 같은 칸 번호·같은 크기로 바꾸고, 발 가운데(칸 안 실측)만 맞춘다. 서기·공격·피격·대시는 그대로.
//  판정·피해·쿨다운·세이브는 바꾸지 않는다(그림 크기·고르기만). 끄기: localStorage storyworld.r1108.consist = {"on":false} 또는 {"attack":false} / {"seoha":false}
(()=>{'use strict';
if(window.__STORYWORLD_HERO_CONSIST_R1108__)return;
const REV='R1108-hero-consist-1',KEY='storyworld.r1108.consist';
// 실제 몸 크기 비율(scripts 없이 qa/r1108 에서 잰 값): 서기 옆 그림 부츠 밑창/키 ÷ R437 공격 그림 부츠 밑창/body.
//  네온 idle-e 16/181=.0884, attack-e 19.4/180=.108 → .82 · 라우렌 idle-e 19/199=.0955, attack-e 23/205=.112 → .85
const POSE=Object.freeze({neon:.82,lauren:.85});
// 서하 걷기 시트 칸 안 발 가운데 x(발끝 8줄 불투명 가운데의 8칸 중앙값). 키는 셋 다 180.
const SEOHA=Object.freeze({path:'assets/r130/seoha/walk-e.webp',foot:Object.freeze({e:101.7,se:99.1,ne:84.7}),cell:192,re:/assets\/r130\/seoha\/walk-(se|ne)\.webp/});
let prefs={on:true,attack:true,seoha:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={attackSheets:0,seohaSwaps:0,seohaWaiting:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const fin=v=>Number.isFinite(v);
// ① R437 표를 읽는 쪽(R143 place)이 body 로 크기를 정하므로, 표 한 줄의 body 만 실제 몸 비율로 늘린 사본을 돌려준다.
const memo=new Map();
function scaled(h,row){if(!row||!prefs.on||!prefs.attack)return row;const s=POSE[h];if(!(s>0&&s<1)||!fin(+row.body))return row;
 let m=memo.get(row);if(!m){m=Object.freeze({...row,body:row.body/s,r1108Pose:s});memo.set(row,m);}stats.attackSheets++;return m;}
function hookR437(){const api=window.__STORYWORLD_NEON_LAUREN_R437__;if(!api||api.r1108||typeof api.attackSheet!=='function')return false;
 const base=api.attackSheet;window.__STORYWORLD_NEON_LAUREN_R437__=Object.freeze({...api,r1108:true,attackSheet:(h,sd)=>{const r=base(h,sd);try{return scaled(h,r);}catch(e){fail(e);return r;}}});return true;}
// ② 서하 대각 걷기 → 옆 걷기 같은 칸
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}return null;}
function swapSeoha(c){const m=SEOHA.re.exec(String(c.sourcePath||c.image?.src||''));if(!m)return false;const im=image(SEOHA.path);if(!im){stats.seohaWaiting++;return false;}
 const P=c.points;if(!Array.isArray(P)||P.length<4||!P.flat().every(fin))return false;
 // R119 은 칸 전체가 아니라 그 칸 그림 상자(예 [1009,47,87,184])를 그린다 → 상자 → 칸 전체 자리로 넓힌 뒤 바꾼다
 const C=SEOHA.cell,sr=Array.isArray(c.sourceRect)&&c.sourceRect.length===4&&c.sourceRect.every(fin)&&c.sourceRect[2]>0&&c.sourceRect[3]>0?c.sourceRect:[0,0,C,256];
 const k0=Math.max(0,Math.floor((sr[0]+.5)/C)),ux=[(P[1][0]-P[0][0])/sr[2],(P[1][1]-P[0][1])/sr[2]],uy=[(P[3][0]-P[0][0])/sr[3],(P[3][1]-P[0][1])/sr[3]];
 const lx=sr[0]-k0*C,ly=sr[1],d=SEOHA.foot.e-SEOHA.foot[m[1]];/* 새 그림 발 가운데가 옛 그림 발 가운데 자리에 오도록 칸 가로 방향(반전이면 반대)으로 옮긴다 */
 const ox=P[0][0]-(lx+d)*ux[0]-ly*uy[0],oy=P[0][1]-(lx+d)*ux[1]-ly*uy[1],at=(x,y)=>[ox+x*ux[0]+y*uy[0],oy+x*ux[1]+y*uy[1]];
 const pts=[at(0,0),at(C,0),at(C,256),at(0,256)];if(!pts.flat().every(fin))return false;
 const W=im.naturalWidth||im.width,H=im.naturalHeight||im.height,n=Math.max(1,Math.round(W/C)),k=Math.min(n-1,k0);
 Object.assign(c,{image:im,sourcePath:SEOHA.path,sourceRect:[k*C,0,C,256],imageSize:[W,H],points:pts,r1108Side:m[1]});stats.seohaSwaps++;return true;}
function afterHero(rec,st){const p=typeof player==='object'?player:null;if(!p||p.hero!=='seoha'||!prefs.on||!prefs.seoha||!rec||!Array.isArray(rec.commands))return;
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind==='image'&&c.owner?.kind==='hero')swapSeoha(c);}}
let wrapped=false;
function install(){try{hookR437();if(!wrapped&&typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:0;const r=base.apply(this,a);try{if(!window.__STORYWORLD_NEON_LAUREN_R437__?.r1108)hookR437();afterHero(rec,st);}catch(e){fail(e);}return r;};wrapped=true;}}catch(e){fail(e);}}
// 이 파일은 R437·R143·R895 보다 먼저 읽히므로(태그 순서 검사 r176·r440·r895), 모든 스크립트가 실행된 뒤(load) 맨 바깥에서 감싼다.
//  R437 API 는 감싼 drawHero 가 그릴 때마다·2초마다 다시 확인한다(다른 오버레이가 나중에 바꿔 끼워도 다시 건다).
if(typeof document==='object'&&document&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);
setInterval(()=>{try{hookR437();}catch(e){fail(e);}},2000);
window.__STORYWORLD_HERO_CONSIST_R1108__=Object.freeze({revision:REV,pose:POSE,seoha:SEOHA,
 setPrefs:v=>{prefs={...prefs,...(v||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 test:Object.freeze({scaled,swapSeoha}),
 inspect:()=>({revision:REV,prefs:{...prefs},wrapped,r437Hooked:!!window.__STORYWORLD_NEON_LAUREN_R437__?.r1108,...stats,lastError,presentationOnly:true,gameplayChanged:false})});
})();
