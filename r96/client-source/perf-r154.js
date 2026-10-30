// R154 — 렉 줄이기: 그림 테두리 재기(본편 imageCrop) 결과를 그림 주소별로 기억해, 지역을 옮길 때마다 같은 그림을 다시 재지 않는다.
//  측정(2026-10-30 헤드리스 dist00 길잡이 40초 프로파일): 게임 코드 시간 10.3초 중 imageCrop 0.74초 + 그 안의 getImageData 1.76초
//  (= 약 24%, getImageData 전체의 97%). 본편은 지역을 옮길 때마다 그림 기억(imageCache)을 비우고 다시 받아(addImage),
//  받을 때마다 그림을 최대 384px 캔버스에 그려 픽셀을 모두 읽어 투명 테두리를 다시 잰다 — 같은 주소·같은 크기의 그림이면 결과도 같다.
//  · 열쇠: 그림 주소(currentSrc/src) + 원래 크기. 결과 상자는 복사본을 돌려준다(호출한 쪽이 바꿔도 기억은 그대로).
//  · 기억은 이 창을 연 동안만(새로 고치면 처음부터 다시 잰다). 그림·판정·저장은 그대로. storyworld.r154.perf {cropMemo:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R154__||typeof imageCrop!=='function')return;
const KEY='storyworld.r154.perf',LIMIT=6000;let prefs={cropMemo:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={hit:0,miss:0,skipped:0};const memo=new Map(),base=imageCrop;
const copy=v=>v&&typeof v==='object'?{...v}:v;
imageCrop=function(im,...rest){
 if(!prefs.cropMemo||rest.length){stats.skipped++;return base.call(this,im,...rest);}
 const src=String(im?.currentSrc||im?.src||''),w=+im?.naturalWidth||0,h=+im?.naturalHeight||0;
 if(!src||!w||!h){stats.skipped++;return base.call(this,im);}
 const k=src+'|'+w+'x'+h;if(memo.has(k)){stats.hit++;return copy(memo.get(k));}
 const v=base.call(this,im);stats.miss++;if(memo.size>=LIMIT)memo.delete(memo.keys().next().value);memo.set(k,copy(v));return v;};
window.__STORYWORLD_PERF_R154__=Object.freeze({inspect:()=>({prefs:{...prefs},stats:{...stats},size:memo.size}),base});
})();
