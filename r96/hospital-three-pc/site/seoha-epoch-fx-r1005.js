// R1005: 한서하 확률 패시브 '겹친 시간'(R949) 아르벨리아 둘째 박자(되감긴 시간로)가 맞는 순간을 Dots 시트로 그린다.
//  · CX-0091SE SE-05 r3 의 11~24장(터지는 눈금 조각 14장, 6×3, 칸 362×181). 고리 바깥이 판정 바깥 반지름에 맞게(가로 R1·세로 R1/2).
//  · 감기는 1~10장은 쓰지 않는다: 장마다 같은 그림(회전 없음)·구멍 47%(판정 40%)·불투명 보라 면. 예고는 R949 코드 고리 그대로다.
// 판정·피해·시간은 R949 그대로다. 시트가 덜 읽혔거나 꺼져 있거나 좌표가 깨졌으면 false 를 돌려 R949 의 보라 고리 번쩍임으로 돌아간다.
(()=>{
'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SEOHA_FX_R1005__)return;
const REV='R1005-seoha-rewind-burst-1',KEY='storyworld.r1005.seohaFx',DIR='assets/r1005/';
// w·h: 터지기 직전 고리의 바깥 폭·높이(시트 실측), cx·cy: 고리 중심. life: 14장을 0.52초에(두 번째 타격 0.58초 전에 끝남).
const BURST={path:DIR+'seoha-kiln-burst.webp',cw:362,ch:181,n:14,w:315,h:148,cx:182,cy:104.5,life:.52};
const stats={burstDraws:0,fallbacks:0,errors:0,lastError:null};
const asked={};let prefAt=-1e9,prefOn=true;
const num=v=>typeof v==='number'&&Number.isFinite(v);
function fail(err){stats.errors++;stats.lastError=String(err&&err.message||err);}
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const n=Date.now();if(n-prefAt>=1000||n<prefAt){prefAt=n;prefOn=readOn();}return prefOn;}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:!!v}));}catch(_){}prefAt=-1e9;return on();}
function img(p){try{const g=typeof readyImage==='function'?readyImage(p):null;if(g&&g.image)return g.image;const n=Date.now();if(n-(asked[p]||-1e9)>=1500){asked[p]=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(err){fail(err);}return null;}
function scope(sc,o,f){if(typeof sc==='function')sc(o,f);else f();}

// p: 화면 중심, R1: 판정 바깥 반지름(화면 가로), since: 맞은 뒤 초. 다 끝났으면 그리지 않고 true(R949 도 번쩍임을 안 그림).
function burst(p,R1,since,cid,c,sc){
  if(!p||!on())return false;
  if(!num(p.x)||!num(p.y)||!num(R1)||!(R1>0)||!num(since)){stats.fallbacks++;return false;}
  const im=img(BURST.path);if(!im){stats.fallbacks++;return false;}
  const fr=Math.floor(Math.max(0,since)/BURST.life*BURST.n);if(fr>=BURST.n)return true;
  const sx=2*R1/BURST.w,sy=R1/BURST.h;
  try{scope(sc,{id:'r1005:burst:'+String(cid||''),kind:'effect',pxfSide:'hero',x:c&&num(c.x)?c.x:0,y:c&&num(c.y)?c.y:0,groundAligned:true},()=>{
    ctx.save();try{ctx.globalCompositeOperation='source-over';
      ctx.drawImage(im,(fr%6)*BURST.cw,Math.floor(fr/6)*BURST.ch,BURST.cw,BURST.ch,p.x-BURST.cx*sx,p.y-BURST.cy*sy,BURST.cw*sx,BURST.ch*sy);}finally{ctx.restore();}});
    stats.burstDraws++;return true;}catch(err){fail(err);return false;}
}

window.__STORYWORLD_SEOHA_FX_R1005__=Object.freeze({revision:REV,on:()=>on(),set,burst,paths:[BURST.path],inspect:()=>({revision:REV,on:prefOn,...stats})});
try{img(BURST.path);}catch(_){}
})();
