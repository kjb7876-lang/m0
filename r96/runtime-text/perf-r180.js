// R180 — 바닥 타일 그리기 횟수 줄이기(사용자 2026-10-31 "무한렉 개선 디버깅 및 시각적 연출 개선").
//  측정(헤드리스, 사몽 S-06 전투 구역): 한 화면에 GPU 그리기 약 1,190번 중 바닥 재질 타일이 240~320번.
//  바닥 재질(r74 materials/outdoor)은 세계 좌표 4.5칸 격자에 붙어 그려지는데(같은 칸은 같은 그림·같은 뒤집기),
//  사몽·탐험 지도의 바닥 사각형이 1칸 두께 띠로 잘게 나뉘어 있어 한 격자 칸이 띠마다 조각나 조각 수만큼 따로 그려졌다.
//  · 처음 바닥을 그릴 때 한 번만, 바닥 사각형의 합집합을 4.5칸 격자 경계로 다시 잘라(칸마다 한 사각형) 그 그리기 캐시를 만들게 하고
//    바로 원래 사각형으로 되돌린다 — 충돌·이동·몹 자리·지도는 원래 사각형을 그대로 쓴다. 덮는 넓이와 칸마다의 그림은 같다.
//  · 조각 수가 줄지 않으면(이미 칸 단위인 지도) 바꾸지 않는다. storyworld.r180.perf {floor:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R180__)return;
const REV='R180-perf-1',KEY='storyworld.r180.perf';
let prefs={floor:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={layouts:0,merged:0,skipped:0,tilesBefore:0,tilesAfter:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const seen=new WeakSet();
/* 사각형 합집합을 격자(T) 칸 경계로 나눈 사각형 목록. 좌표가 0.5 단위가 아니거나 너무 크면 null(바꾸지 않음). */
function gridMerge(rs,T){const Q=2;if(!Array.isArray(rs)||!rs.length||!(T>0))return null;let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
 for(const r of rs){for(const v of [r.x,r.y,r.width,r.depth])if(!Number.isFinite(v)||Math.abs(v*Q-Math.round(v*Q))>1e-6)return null;if(r.width<=0||r.depth<=0)return null;
  minx=Math.min(minx,r.x);miny=Math.min(miny,r.y);maxx=Math.max(maxx,r.x+r.width);maxy=Math.max(maxy,r.y+r.depth);}
 minx=Math.floor(minx/T)*T;miny=Math.floor(miny/T)*T;if(Math.abs(minx*Q-Math.round(minx*Q))>1e-6||Math.abs(miny*Q-Math.round(miny*Q))>1e-6)return null;
 const W=Math.round((maxx-minx)*Q),H=Math.round((maxy-miny)*Q),C=Math.round(T*Q);if(W*H>4e6||Math.abs(T*Q-C)>1e-6)return null;
 const g=new Uint8Array(W*H);for(const r of rs){const x0=Math.round((r.x-minx)*Q),y0=Math.round((r.y-miny)*Q),x1=x0+Math.round(r.width*Q),y1=y0+Math.round(r.depth*Q);for(let y=y0;y<y1;y++)g.fill(1,y*W+x0,y*W+x1);}
 const used=new Uint8Array(W*H),out=[];
 for(let cy=0;cy<H;cy+=C)for(let cx=0;cx<W;cx+=C){const ex=Math.min(W,cx+C),ey=Math.min(H,cy+C);
  for(let y=cy;y<ey;y++)for(let x=cx;x<ex;x++){if(!g[y*W+x]||used[y*W+x])continue;let x1=x;while(x1<ex&&g[y*W+x1]&&!used[y*W+x1])x1++;let y1=y+1;
   outer:for(;y1<ey;y1++){for(let k=x;k<x1;k++)if(!g[y1*W+k]||used[y1*W+k])break outer;}
   for(let yy=y;yy<y1;yy++)used.fill(1,yy*W+x,yy*W+x1);out.push({x:minx+x/Q,y:miny+y/Q,width:(x1-x)/Q,depth:(y1-y)/Q});}}
 return out;}
const area=a=>a.reduce((s,r)=>s+r.width*r.depth,0);
function plan1(rects,art){const api=window.StoryPhase1;if(!api?.terrainTiles||!art||!Array.isArray(rects)||!rects.length)return null;
 const before=api.terrainTiles(rects,art);const T=Number(art.tileWorld||art.tileSize)||(before[0]?Math.abs(before[0].drawPoints[1][0]-before[0].drawPoints[0][0]):0);
 const m=gridMerge(rects,T);if(!m)return null;
 /* 겹친 사각형이 있으면 합집합 넓이가 더 작다 — 넓이가 같을 때만(겹침 없음) 바꾼다 */
 if(Math.abs(area(m)-area(rects))>1e-6)return null;
 const after=api.terrainTiles(m,art);stats.tilesBefore+=before.length;if(after.length>=before.length){stats.tilesAfter+=before.length;return null;}
 stats.tilesAfter+=after.length;return m;}
/* 바닥(floorRects)과 바닥 밖 배경(backdropRects, R59) 둘 다 같은 4.5칸 격자 재질 타일이다 */
function plan(L){const out={};try{const art=L?.surface?.art;if(!art)return null;out.floorRects=plan1(L.floorRects,art);
  const ba=window.StoryPhase1?.sceneryBackdropArt59?.(art);if(ba)out.backdropRects=plan1(L.backdropRects,ba);}catch(e){fail(e);}
 return out.floorRects||out.backdropRects?out:null;}
try{
 if(typeof groundImage==='function'){const base=groundImage;groundImage=function(...a){const L=(typeof room!=='undefined'&&room)?room.exploration:null;
   if(!prefs.floor||!L||seen.has(L))return base.apply(this,a);
   seen.add(L);stats.layouts++;const m=plan(L);if(!m){stats.skipped++;return base.apply(this,a);}
   const orig={floorRects:L.floorRects,backdropRects:L.backdropRects};stats.merged++;for(const k in m)if(m[k])L[k]=m[k];try{return base.apply(this,a);}finally{L.floorRects=orig.floorRects;L.backdropRects=orig.backdropRects;}};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_PERF_R180__=Object.freeze({revision:REV,gridMerge,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
