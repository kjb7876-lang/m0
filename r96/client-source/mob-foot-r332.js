// R332 — 사용자 2026-11-05 "악마화 나무 정원 첫 몹부터 위아래 떨림 문제, 모든 몹 이런 버그 없게".
//  원인(헤드리스 실측): 몹을 그리는 자리(발 기준점)는 프레임마다 같지만, 시트 안에서 프레임마다 발바닥 높이가 다르다
//  (예: r208 root-bound-ghoul 걷기 6프레임의 발 = 175·178·180·178·177·179px) → 프레임이 바뀔 때마다 몸이 위아래로 튄다.
//  수정: drawEnemy 동안 몹 시트 프레임(원본 사각형을 잘라 그리는 drawImage)을 그릴 때, 그 시트(같은 칸 크기의 모든 줄) 프레임들의 발바닥 높이를 한 번 재서
//  가장 낮은 발(기준선)에 맞춰 그 프레임을 아래로 내려 그린다. 원본 자산은 그대로(그릴 때만 보정), 몸 웅크림(머리 높이) 같은 의도된 움직임은 그대로.
//  · 발 = 불투명(α>40) 픽셀이 3개 이상인 가장 아래 줄. 시트마다·줄마다 한 번만 재고(getImageData) 기억한다.
//  · 이펙트 아틀라스·캔버스·작은 그림(높이<48)은 건드리지 않는다. 끄기: localStorage['storyworld.r332.mobFoot']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_FOOT_R332__)return;
const REV='R332-mob-foot-2',KEY='storyworld.r332.mobFoot',MAXFIX=24;
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={enemies:0,frames:0,fixed:0,maxShift:0,sheets:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const sheets=new WeakMap();// img -> Map(rowKey -> {base, feet:Map(sx->foot)})
const SKIP=/atlas|\/fx\/|pixelfx|r251\/|effects?\//i;
let probe=null;
function footOf(img,sx,sy,sw,sh){if(!probe){probe=document.createElement('canvas');}probe.width=sw;probe.height=sh;const g=probe.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,sw,sh);
 g.drawImage(img,sx,sy,sw,sh,0,0,sw,sh);const d=g.getImageData(0,0,sw,sh).data;
 for(let y=sh-1;y>=0;y--){let n=0;for(let x=0;x<sw;x++)if(d[(y*sw+x)*4+3]>40&&++n>=3)return y;}return -1;}
// 기준선은 시트 전체(같은 칸 크기의 모든 줄)에서 하나만 쓴다: 걷기 8프레임이 두 줄에 걸친 시트(R248·R306)에서
// 줄마다 따로 맞추면 줄이 바뀔 때 오히려 높이가 튄다(Codex 리뷰). 칸 격자에 맞지 않는 sy 는 그 줄만 따로 잰다.
function gridInfo(img,sw,sh){let m=sheets.get(img);if(!m){m=new Map();sheets.set(img,m);stats.sheets++;}const k=sw+':'+sh;let r=m.get(k);if(r)return r;
 r={base:-1,feet:new Map()};const W=img.naturalWidth||img.width||0,H=img.naturalHeight||img.height||0,nx=Math.max(1,Math.floor(W/sw)),ny=Math.max(1,Math.floor(H/sh));
 for(let j=0;j<ny&&j<12;j++)for(let i=0;i<nx&&i<64;i++){const f=footOf(img,i*sw,j*sh,sw,sh);r.feet.set(i*sw+':'+j*sh,f);if(f>r.base)r.base=f;}m.set(k,r);return r;}
function shiftFor(img,sx,sy,sw,sh){const r=gridInfo(img,sw,sh),key=sx+':'+sy;let f=r.feet.get(key);if(f==null){f=footOf(img,sx,sy,sw,sh);r.feet.set(key,f);if(f>r.base)r.base=f;}
 if(f<0||r.base<0)return 0;const s=r.base-f;return s>0&&s<=MAXFIX?s:0;}
const eligible=im=>{try{if(!im||typeof HTMLImageElement==='undefined'||!(im instanceof HTMLImageElement)||!im.complete||!(im.naturalWidth>0))return false;return !SKIP.test(im.currentSrc||im.src||'');}catch(_){return false;}};
let depth=0;
function patched(){const c=typeof ctx!=='undefined'?ctx:null;if(!c||c.__r332)return;const base=c.drawImage;
 c.drawImage=function(im,...a){if(on&&depth>0&&a.length>=8&&eligible(im)){const[sx,sy,sw,sh,dx,dy,dw,dh]=a;if(sh>=48&&sw>=16){stats.frames++;try{const s=shiftFor(im,Math.round(sx),Math.round(sy),Math.round(sw),Math.round(sh));
    if(s){stats.fixed++;if(s>stats.maxShift)stats.maxShift=s;return base.call(this,im,sx,sy,sw,sh,dx,dy+s*dh/sh,dw,dh);}}catch(e){fail(e);}}}return base.apply(this,[im,...a]);};
 c.__r332=true;}
if(typeof drawEnemy==='function'){const baseE=drawEnemy;drawEnemy=function(e,...a){try{patched();}catch(err){fail(err);}depth++;stats.enemies++;try{return baseE.apply(this,[e,...a]);}finally{depth--;}};}
window.__STORYWORLD_MOB_FOOT_R332__=Object.freeze({revision:REV,
 inspect:()=>({revision:REV,on,stats:{...stats},lastError}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;},
 measure:(img,sw,sh)=>{const r=gridInfo(img,sw,sh);return{base:r.base,feet:[...r.feet.entries()]};}});
})();
