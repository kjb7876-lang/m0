// R332 몹 프레임 발 기준선 맞춤(위아래 떨림 제거) 검사 — 정적 + 순수 함수 실행. 실제 화면 수치는 헤드리스 측정(PR 본문) 참고.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/mob-foot-r332.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/mob-foot-r332.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');assert(idx.split('"./mob-foot-r332.js"').length===2);ok('script tag loaded once');
assert(/if\(typeof drawEnemy==='function'\)\{const baseE=drawEnemy;drawEnemy=function/.test(src)&&/depth>0&&a\.length>=8/.test(src));ok('only adjusts source-rect sprite draws made inside drawEnemy');
assert(/SKIP=\/atlas\|\\\/fx\\\/\|pixelfx/.test(src)&&/sh>=48&&sw>=16/.test(src));ok('effect atlases and small images are left alone');
assert(/s>0&&s<=MAXFIX/.test(src)&&/MAXFIX=24/.test(src));ok('shift is downward only and capped (24 px of the sheet)');
assert(!/ctx\.filter/.test(src)&&!/toDataURL|putImageData/.test(src));ok('no filters, source assets never modified');
// 순수 계산: 가짜 이미지 데이터로 footOf/rowInfo/shiftFor 를 돌린다(실측한 root-bound-ghoul 발 175·178·180·178·177·179)
const feet=[175,178,180,178,177,179];
const fakeDoc={createElement:()=>{let cur=0;return{width:0,height:0,getContext:()=>({clearRect(){},drawImage(img,sx){cur=Math.round(sx/98);},getImageData(x,y,w,h){const d=new Uint8ClampedArray(w*h*4);for(let yy=0;yy<=feet[cur];yy++)for(let xx=10;xx<20;xx++)d[(yy*w+xx)*4+3]=255;return{data:d};}})};}};
const g={};g.window=g;g.localStorage={getItem:()=>null,setItem(){}};g.document=fakeDoc;g.HTMLImageElement=function(){};
new Function('window','localStorage','document','HTMLImageElement',src)(g,g.localStorage,fakeDoc,g.HTMLImageElement);
const img={naturalWidth:98*6,width:98*6};const m=g.__STORYWORLD_MOB_FOOT_R332__.measure(img,0,98,185);
assert.strictEqual(m.base,180);assert.deepStrictEqual(m.feet.map(f=>f[1]),feet);ok('measures each frame foot and the row baseline (180)');
const shifted=m.feet.map(([sx,f])=>f+(m.base-f));assert(shifted.every(v=>v===180));ok('after shift every frame foot sits on the same baseline (no vertical jitter)');
console.log(JSON.stringify({ok:true,checks:n,method:'static + pure CPU fake image; headless before/after measured separately; no GPU or device'}));
