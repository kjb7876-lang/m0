// R154 — 렉 줄이기: 그림 테두리 재기(본편 imageCrop) 결과를 그림 주소별로 기억해, 지역을 옮길 때마다 같은 그림을 다시 재지 않는다.
//  측정(2026-10-30 헤드리스 dist00 길잡이 40초 프로파일): 게임 코드 시간 10.3초 중 imageCrop 0.74초 + 그 안의 getImageData 1.76초
//  (= 약 24%, getImageData 전체의 97%). 본편은 지역을 옮길 때마다 그림 기억(imageCache)을 비우고 다시 받아(addImage),
//  받을 때마다 그림을 최대 384px 캔버스에 그려 픽셀을 모두 읽어 투명 테두리를 다시 잰다 — 같은 주소·같은 크기의 그림이면 결과도 같다.
//  · 열쇠: 그림 주소(currentSrc/src) + 원래 크기. 결과 상자는 복사본을 돌려준다(호출한 쪽이 바꿔도 기억은 그대로).
//  · 기억은 이 창을 연 동안만(새로 고치면 처음부터 다시 잰다). 그림·판정·저장은 그대로. storyworld.r154.perf {cropMemo:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R154__||typeof imageCrop!=='function')return;
const KEY='storyworld.r154.perf',LIMIT=6000;let prefs={cropMemo:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={hit:0,miss:0,skipped:0,failed:0,fast:0,checked:0,mismatch:0};const memo=new Map(),base=imageCrop;
const copy=v=>v&&typeof v==='object'?{...v}:v;
// R1137 — 스토리 지역에 들어갈 때 그림이 한꺼번에 들어오면서 imageCrop 이 한 장면에 수십 번 몰렸다(아이폰 13 미니 가로 재현,
//  dist02→dist01 전환 직후 imageCrop 합계 약 0.55초). 그중 픽셀 반복(최대 384×384 모든 점, 점마다 Math.min/max 4번)이 약 1/4.
//  같은 상자를 빠르게: 위→아래로 첫 보이는 줄, 아래→위로 마지막 줄을 찾고, 그 사이에서 왼쪽·오른쪽 끝 세로줄을 찾는다(상자 안쪽은 거의 읽지 않음).
//  그리기(drawImage)·읽기(getImageData)·문턱(알파 > 18)·상자 셈은 본편과 한 글자도 다르지 않다 → 결과가 같다.
//  처음 8번은 본편 결과와 대조해 다르면 빠른 길을 영영 끈다(본편이 바뀌었을 때를 대비). storyworld.r154.perf {fastScan:false} 로 끈다.
function scan(d,w,h){const row=w*4;let y0=-1,y1=-1;
 for(let y=0;y<h&&y0<0;y++){let i=y*row+3;for(let x=0;x<w;x++,i+=4)if(d[i]>18){y0=y;break;}}if(y0<0)return null;
 for(let y=h-1;y>=y0&&y1<0;y--){let i=y*row+3;for(let x=0;x<w;x++,i+=4)if(d[i]>18){y1=y;break;}}
 // 왼쪽·오른쪽 끝은 세로줄로 찾는다(위 줄부터 좁혀 가면 처음 몇 줄이 상자 안쪽을 많이 읽음) — 상자 밖과 끝 한 점씩만 읽는다.
 let x0=-1,x1=-1;for(let x=0;x<w&&x0<0;x++){let i=y0*row+x*4+3;for(let y=y0;y<=y1;y++,i+=row)if(d[i]>18){x0=x;break;}}
 for(let x=w-1;x>=x0&&x1<0;x--){let i=y0*row+x*4+3;for(let y=y0;y<=y1;y++,i+=row)if(d[i]>18){x1=x;break;}}
 return[x0,y0,x1,y1];}
function fast(im){try{const limit=384,k=Math.min(1,limit/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(im.naturalWidth*k));c.height=Math.max(1,Math.ceil(im.naturalHeight*k));const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data;
 const b=scan(d,c.width,c.height);if(!b)return null;const [x0,y0,x1,y1]=b;return{x:Math.max(0,(x0-1)/k),y:Math.max(0,(y0-1)/k),w:Math.min(im.naturalWidth,(x1-x0+3)/k),h:Math.min(im.naturalHeight,(y1-y0+3)/k)}}catch(_){return null}}
const CHECK=8;
function measure(self,im){if(prefs.fastScan===false||stats.mismatch)return base.call(self,im);const v=fast(im);stats.fast++;
 if(stats.checked<CHECK){stats.checked++;const b=base.call(self,im);if(JSON.stringify(b)!==JSON.stringify(v)){stats.mismatch++;return b;}}return v;}
imageCrop=function(im,...rest){
 if(!prefs.cropMemo||rest.length){stats.skipped++;return base.call(this,im,...rest);}
 const src=String(im?.currentSrc||im?.src||''),w=+im?.naturalWidth||0,h=+im?.naturalHeight||0;
 if(!src||!w||!h){stats.skipped++;return base.call(this,im);}
 const k=src+'|'+w+'x'+h;if(memo.has(k)){stats.hit++;return copy(memo.get(k));}
 const v=measure(this,im);stats.miss++;if(v==null){stats.failed=(stats.failed||0)+1;return v;}/* R159: 재기 실패(메모리 부족 등 null)는 기억하지 않고 다음에 다시 잰다 */if(memo.size>=LIMIT)memo.delete(memo.keys().next().value);memo.set(k,copy(v));return v;};
window.__STORYWORLD_PERF_R154__=Object.freeze({inspect:()=>({prefs:{...prefs},stats:{...stats},size:memo.size}),base,fast,scan});
})();
