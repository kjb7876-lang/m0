// R1059 옛 불면귀 그림 막기 — 사용자 2026-11-15 14:14Z "불면귀 아직도 예전 이미지 나오는경우있음".
//  R760·R764·R1036 은 그리는 자리마다(보스 몸·중간보스 몸·이름 카드) 새 그림으로 바꿨지만, 바꾸기는 '그 자리'에서만 걸렸다:
//   · last303 보스는 role() 이 room.id==='last303' 이고 hp>0 일 때만 바꾼다 → 다른 모드·다른 방에서 불면귀가 나오거나, 죽는 순간, 꺼짐 스위치면 엔진 그림 그대로.
//   · 새 시트가 아직 안 실렸으면(엔진이 지역을 옮길 때 그림 캐시를 비움 — R760 주석) 그 프레임은 엔진 원래 그림(옛 회백 해골)으로 비친다.
//   · 시트가 꺼져 있으면 R760 톤 자세(옛 R104 해골 자세를 칠한 것), 중간보스 시트가 안 실렸으면 R104 자세·rc140 아틀라스가 그대로.
//  → 그리는 자리를 하나씩 쫓지 않고, 옛 그림 파일을 부르는 길(urlFor) 자체에서 새 그림 사본으로 바꾼다. 사본은 같은 크기·같은 몸 자리(알파 테두리 바닥 줄·키·가운데)에
//    Dots CX-0070BM 시트 한 칸을 앉힌 것(scripts/r1059-bulmyeongwi-oldart.py → assets/r1059/<원래 경로>, 표 r96/r1059-bulmyeongwi-oldart.json).
//    파일 이름이 같아서 경로로 종류를 고르는 R760 kindOf·R981·R990 판별은 그대로 걸린다. 판정·크기·세이브는 그대로, 그림만.
//  · 이 파일보다 먼저 불러 둔 캐시 행이 있으면 새 그림으로 다시 읽어 그 행의 그림만 바꾼다.
//  끄기: localStorage['storyworld.r1059.oldart']='{"on":false}'. 점검: window.__STORYWORLD_BULMYEONGWI_OLDART_R1059__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BULMYEONGWI_OLDART_R1059__)return;
const REV='R1059-bulmyeongwi-oldart-1',KEY='storyworld.r1059.oldart';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={redirected:0,reloaded:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const OUT='assets/r1059/';
// 엔진 보스 그림 4장(옛 이름 그대로 다른 폴더에 적힌 것 포함 — 예: generated-v3125/boss-actions)은 한 벌의 사본으로 모은다.
const BOSS={idle:'692e4ae01c29',attack:'115b7fcea51e',rain:'35526bcfa1c2',transition:'de4c1414da0d'};
const ONE=new Set(['assets/episode1b/generated-v394/bulmyeongwi_b.webp','assets/rc140/story-cycle-motions/mb-last302-v31231.png',
 ...[1,2,3,4].map(i=>'assets/r104/bosses/mb-last302-v31231-p'+i+'.webp'),...['p1','p2','p3','p4','rain','transition'].map(k=>'assets/r760/boss/bulmyeongwi-'+k+'.webp')]);
const PRE=/^(?:\.\/)?(?:assets\/(?:r425|r700|r99)\/clean\/)?/;
// 순수: 옛 그림 경로면 새 사본 경로, 아니면 null
function target(p){if(typeof p!=='string')return null;const q=p.replace(/#.*$/,'').replace(PRE,'');if(q.startsWith(OUT))return null;
 const m=/(?:^|\/)(?:[0-9a-f]{12}_)?bulmyeongwi_(idle|attack|rain|transition)\.webp$/.exec(q);if(m)return OUT+'assets/generated-v31224/actors-normalized/'+BOSS[m[1]]+'_bulmyeongwi_'+m[1]+'.webp';
 return ONE.has(q)?OUT+q:null;}
if(typeof urlFor==='function'){const base=urlFor;urlFor=function(path,...a){try{if(prefs.on){const raw=typeof cleanPath==='function'&&typeof path==='string'?cleanPath(path):path,t=target(raw);if(t){stats.redirected++;return base.call(this,t,...a);}}}catch(e){fail(e);}return base.call(this,path,...a);};}
// 먼저 불러 둔 행: 같은 행(같은 열쇠)에 새 그림을 넣는다. 그동안은 옛 그림이 남지만 한두 프레임이고, 다 읽으면 바뀐다.
function reload(){try{if(!prefs.on||typeof imageCache==='undefined'||!imageCache||typeof imageCache.forEach!=='function'||typeof Image!=='function')return;
 imageCache.forEach((row,key)=>{try{const t=target(String(row?.path||key));if(!t||!row?.ready||!row.image)return;const want=urlFor(row.path||key);if(String(row.image.src||'')===want)return;
  const im=new Image();if(typeof location!=='undefined'&&location.protocol!=='file:')im.crossOrigin='anonymous';
  im.onload=()=>{try{im.onload=im.onerror=null;if(!im.naturalWidth)return;row.image=im;if(typeof imageCrop==='function')row.crop=imageCrop(im);stats.reloaded++;}catch(e){fail(e);}};
  im.onerror=()=>{im.onload=im.onerror=null;fail('reload '+t);};im.src=want;}catch(e){fail(e);}});}catch(e){fail(e);}}
reload();
window.__STORYWORLD_BULMYEONGWI_OLDART_R1059__=Object.freeze({rev:REV,target,reload,inspect:()=>({rev:REV,prefs:{...prefs},stats:{...stats},lastError}),
 set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
