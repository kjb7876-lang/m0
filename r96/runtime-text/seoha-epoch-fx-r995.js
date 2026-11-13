// R995: 한서하 확률 패시브 '겹친 시간'(R949) 아르벨리아 마지막 박자의 퍼지는 고리를 Dots 수정본으로 그린다(CX-0091SE 추가1).
//  · 열린 시간방 물결(SE-06 r2): 18장(6×3, 칸 768×384, 중심 384,192). 지금 반지름에 맞는 장을 골라
//    가로 R·세로 R/2 에 꼭 맞게 그린다 → 작은 문자판이 켜지고, 넓어지며 눈금이 성글어진다.
//    9장부터는 선이 가늘어 게임 크기(절반쯤으로 줄어듦)에서 묻히므로 같은 장을 한 번 더 밝게 겹친다.
//    R986 은 6번째 장 한 장을 늘려 썼다(임시). 이 파일이 준비되면 R949 가 이쪽을 먼저 묻는다.
//  되감긴 시간로(SE-05 r2)는 게임 화면 심사에서 다시 떨어져 넣지 않았다(감기는 10장이 같은 그림·구멍 비율이 판정과 다름·
//  터지는 조각은 석 장 뒤로 성글어 밝은 바닥에서 안 읽힘).
// 판정·피해·시간은 R949 그대로다. 시트가 덜 읽혔거나 꺼져 있거나 좌표가 깨졌으면 false 를 돌려 앞선 그림으로 돌아간다.
(()=>{
'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SEOHA_FX_R995__)return;
const REV='R995-seoha-dots-r2-1',KEY='storyworld.r995.seohaFx',DIR='assets/r995/';
// 장마다 잰 고리 바깥 폭·높이(알파 40 초과). 블록마다 타원 비율이 달라(1.45~2.35) 코드가 2:1 로 맞춘다.
const WAVE={path:DIR+'seoha-room-wave.webp',cw:768,ch:384,n:18,thin:8,
  w:[112,136,167,205,250,306,343,382,400,416,432,448,456,510,560,594,607,690],
  h:[77,87,103,120,144,160,176,174,214,204,203,197,249,249,268,264,290,293]};
const stats={waveDraws:0,fallbacks:0,errors:0,lastError:null};
const asked={};let prefAt=-1e9,prefOn=true;
const num=v=>typeof v==='number'&&Number.isFinite(v);
const c01=v=>num(v)?Math.max(0,Math.min(1,v)):0;
function fail(err){stats.errors++;stats.lastError=String(err&&err.message||err);}
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const n=Date.now();if(n-prefAt>=1000||n<prefAt){prefAt=n;prefOn=readOn();}return prefOn;}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:!!v}));}catch(_){}prefAt=-1e9;return on();}
function img(p){try{const g=typeof readyImage==='function'?readyImage(p):null;if(g&&g.image)return g.image;const n=Date.now();if(n-(asked[p]||-1e9)>=1500){asked[p]=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(err){fail(err);}return null;}
function scope(sc,o,f){if(typeof sc==='function')sc(o,f);else f();}
// 지금 반지름이 끝 반지름의 몇 할인지로 장을 고른다: 그 폭을 넘지 않는 가장 큰 장(작게 그려 넓히는 일을 줄임).
function waveFrame(u){const want=c01(u)*WAVE.w[WAVE.n-1];let i=0;while(i<WAVE.n-1&&WAVE.w[i+1]<=want)i++;return i;}

// 열린 시간방 물결: 화면 반지름 R(가로)·R/2(세로), 끝 반지름 Rmax, f(1→0). 앞 절반은 또렷하고 뒤 절반에 옅어진다.
function wave(p,R,Rmax,f,cid,c,sc){
  if(!p||!on())return false;
  if(!num(p.x)||!num(p.y)||!num(R)||!(R>0)||!num(Rmax)||!(Rmax>0)||!num(f)){stats.fallbacks++;return false;}
  const im=img(WAVE.path);if(!im){stats.fallbacks++;return false;}
  const a=c01(f*2);if(!(a>0))return true;
  const fr=waveFrame(R/Rmax),sx=2*R/WAVE.w[fr],sy=R/WAVE.h[fr],W=WAVE.cw*sx,H=WAVE.ch*sy;
  try{scope(sc,{id:'r995:wave:'+String(cid||''),kind:'effect',pxfSide:'hero',x:c&&num(c.x)?c.x:0,y:c&&num(c.y)?c.y:0,groundAligned:true},()=>{
    ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=a;
      const sxp=(fr%6)*WAVE.cw,syp=Math.floor(fr/6)*WAVE.ch;ctx.drawImage(im,sxp,syp,WAVE.cw,WAVE.ch,p.x-W/2,p.y-H/2,W,H);
      if(fr>=WAVE.thin){ctx.globalCompositeOperation='lighter';ctx.drawImage(im,sxp,syp,WAVE.cw,WAVE.ch,p.x-W/2,p.y-H/2,W,H);}}finally{ctx.restore();}});
    stats.waveDraws++;return true;}catch(err){fail(err);return false;}
}

window.__STORYWORLD_SEOHA_FX_R995__=Object.freeze({revision:REV,on:()=>on(),set,wave,waveFrame,paths:[WAVE.path],inspect:()=>({revision:REV,on:prefOn,...stats})});
try{img(WAVE.path);}catch(_){}
})();
