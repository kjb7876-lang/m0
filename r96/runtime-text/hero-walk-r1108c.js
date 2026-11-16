// R1108c — 서하 좌우 걷기(E, 반전 W)만 Dots 새 시트(CX-0123SH r1)로 바꾼다(사용자 결정 2026-11-16 21:46 KST).
//  새 시트는 두 다리가 번갈아 보이는 8칸(192×256, 발 가운데 95.8, 몸 키 180 — 옛 시트와 같음). 남동·북동·위·아래·서기·공격은 그대로(대각은 HOLD).
//  R119 는 칸 전체가 아니라 그림 상자를 그린다 → 상자 → 칸 전체로 넓혀 같은 배율로 바꾸고, 새 발 가운데가 옛 발 가운데 자리에 오게 가로로 옮긴다.
//  새 시트 준비 전이면 옛 그림 그대로. R1108 이 대각을 walk-e 로 바꾼 명령(r1108Side)은 건드리지 않는다.
//  판정·피해·쿨다운·세이브는 바꾸지 않는다. 끄기: localStorage storyworld.r1108c.walk = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_HERO_WALK_R1108C__)return;
const REV='R1108c-seoha-walk-e-1',KEY='storyworld.r1108c.walk';
const OLD=/assets\/r130\/seoha\/walk-e\.webp(?:$|[?#])/,NEW='assets/r1108c/seoha/walk-e.webp',CELL=192,FOLD=102.2,FNEW=95.8;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swaps:0,waiting:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const fin=v=>Number.isFinite(v);
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}return null;}
function swap(c){if(c.r1108Side||!OLD.test(String(c.sourcePath||c.image?.src||'')))return false;const im=image(NEW);if(!im){stats.waiting++;return false;}
 const P=c.points;if(!Array.isArray(P)||P.length<4||!P.flat().every(fin))return false;
 const sr=Array.isArray(c.sourceRect)&&c.sourceRect.length===4&&c.sourceRect.every(fin)&&c.sourceRect[2]>0&&c.sourceRect[3]>0?c.sourceRect:[0,0,CELL,256];
 const k0=Math.max(0,Math.floor((sr[0]+.5)/CELL)),ux=[(P[1][0]-P[0][0])/sr[2],(P[1][1]-P[0][1])/sr[2]],uy=[(P[3][0]-P[0][0])/sr[3],(P[3][1]-P[0][1])/sr[3]];
 const lx=sr[0]-k0*CELL,ly=sr[1],d=FNEW-FOLD;
 const ox=P[0][0]-(lx+d)*ux[0]-ly*uy[0],oy=P[0][1]-(lx+d)*ux[1]-ly*uy[1],at=(x,y)=>[ox+x*ux[0]+y*uy[0],oy+x*ux[1]+y*uy[1]];
 const pts=[at(0,0),at(CELL,0),at(CELL,256),at(0,256)];if(!pts.flat().every(fin))return false;
 const W=im.naturalWidth||im.width,n=Math.max(1,Math.round(W/CELL)),k=Math.min(n-1,k0);
 Object.assign(c,{image:im,sourcePath:NEW,sourceRect:[k*CELL,0,CELL,256],imageSize:[W,im.naturalHeight||im.height],points:pts,r1108cWalk:true});stats.swaps++;return true;}
function after(rec,st){const p=typeof player==='object'?player:null;if(!p||p.hero!=='seoha'||!prefs.on||!rec||!Array.isArray(rec.commands))return;
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind==='image'&&c.owner?.kind==='hero')swap(c);}}
let wrapped=false;
function install(){try{if(!wrapped&&typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:0;const r=base.apply(this,a);try{after(rec,st);}catch(e){fail(e);}return r;};wrapped=true;}}catch(e){fail(e);}}
if(typeof document==='object'&&document&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);
window.__STORYWORLD_HERO_WALK_R1108C__=Object.freeze({revision:REV,path:NEW,
 setPrefs:v=>{prefs={...prefs,...(v||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 test:Object.freeze({swap}),
 inspect:()=>({revision:REV,prefs:{...prefs},wrapped,...stats,lastError,presentationOnly:true,gameplayChanged:false})});
})();
