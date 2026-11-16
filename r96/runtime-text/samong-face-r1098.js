// R1098 사몽 얼굴 바로잡기 — 사용자 2026-11-16 03:54Z "사몽·사몽역행 몹과 보스들 스킬 및 이미지 전수조사 … 환도영웅 자꾸 나오는 문제".
//  실측(헤드리스, 163구역·199종): 사몽 전용 그림이 없는 44종(보스 6 — 미카엘라 포함)이 R161 꼭두각시 시트로 그려지는데,
//  그 시트가 두건·붉은 무늬 망토·칼을 든 모습이라 영웅 환도와 거의 같아 보였다. 사용자 선택(05:25Z) "꼭두각시도 다시 칠하기".
//  ① 미카엘라: 사몽 최종 보스(sz115-M) · 무한생존 미카엘라(R1010)는 미카엘라 본인 시트(R380 검수 시트 persona-michaela-w, 걷기 4·공격 4)로 그린다.
//     엔진 frameFor 사슬 바깥에서 R380 frameOf 로 칸을 고르고(좌우는 R444), R161 꼭두각시는 covers() 로 미카엘라를 덮지 않는다.
//  ② 꼭두각시: 시트를 한 번 구워 '먹·흰 실 인형'으로 — 칼날(몸 오른쪽의 가는 기둥)은 지우고, 몸은 무채색 먹, 머리 위 실은 흰 실, 바깥 한 줄은 종이빛 테.
//     R161 은 readyImage(꼭두각시 경로)로 그림을 받으므로 그 경로에만 구운 캔버스를 내준다. 칸 크기·발 자리·움직임·판정은 그대로.
//  그림만 바꾼다(판정·피해·저장 그대로). 끄기: localStorage['storyworld.r1098.samongFace']='{"michaela":false,"puppet":false}'.
//  점검: window.__STORYWORLD_SAMONG_FACE_R1098__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_FACE_R1098__)return;
const REV='R1098-samong-face-1',KEY='storyworld.r1098.samongFace';
const PUPPET='assets/r161/puppet/puppet-ego-walk-right-8.webp';
// R380 검수 시트 목록(assets/r380/mobs/index.json)의 persona-michaela-w 와 같은 값.
const MICH=Object.freeze({id:'r1098-michaela',kind:'strip',path:'assets/r380/mobs/persona-michaela-w.webp',cell:[160,128],cols:8,pivot:[84.5,113.5],visibleHeight:180,move:[0,1,2,3],attack:[4,5,6,7],idle:[0],facing:'left'});
let prefs={michaela:true,puppet:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(typeof s.michaela==='boolean')prefs.michaela=s.michaela;if(typeof s.puppet==='boolean')prefs.puppet=s.puppet;}}catch(_){}
const stats={michaelaFrames:0,michaelaWaits:0,puppetServed:0,bakes:0,installs:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const G=(f,d)=>{try{return f();}catch(_){return d;}};
const asked=new Set();function want(p){if(asked.has(p))return;asked.add(p);try{if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>asked.delete(p));}catch(_){asked.delete(p);}}

// ---- ① 미카엘라 ----
function covers(e){if(!prefs.michaela||!e||typeof e!=='object')return false;if(G(()=>e===player,false))return false;
 if(e.r1010Michaela===true)return true;
 return !!(e.boss&&e.samongR103&&/^미카엘라(\s|$)/.test(String(e.name||'')));}
let baseReady=null;// 감싸기 전의 readyImage(구운 캔버스가 아닌 원본)
function ready(p){try{const f=baseReady||(typeof readyImage==='function'?readyImage:null);const r=f?f(p):null;return !!(r&&r.image&&(r.image.naturalWidth||r.image.width)>0);}catch(_){return false;}}
function frame(e,base){if(!covers(e))return base;
 if(!ready(MICH.path)){want(MICH.path);stats.michaelaWaits++;return base;}
 const A=window.__STORYWORLD_APPROVED_MOBS_R380__;if(!A||typeof A.frameOf!=='function')return base;
 const f=A.frameOf(e,MICH,MICH.id);if(!f||!f.assetFrame||!f.assetFrame.pivot.every(Number.isFinite))return base;stats.michaelaFrames++;return f;}
let mine=null;
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(mine&&S.frameFor===mine)return true;if(S.__r1098&&stats.installs)return true;if(stats.installs>60)return false;
 const inner=S.frameFor;mine=function(e,f){const b=inner.call(this,e,f);try{return frame(e,b);}catch(err){fail(err);return b;}};
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r1098:true,frameFor:mine});stats.installs++;return true;}

// ---- ② 먹·흰 실 인형 ----
// 화소(RGBA) → 새 화소. cfg: cw·ch 칸 크기, pivotX 칸 안 발 x(시트는 오른쪽을 봄 → 칼은 발 오른쪽).
function inkPuppet(src,W,H,cfg={}){
 if(!src||!(W>0)||!(H>0)||src.length<W*H*4)return src?new Uint8ClampedArray(src):null;
 const cw=Math.max(1,Math.min(W,Math.round(+cfg.cw||256))),ch=Math.max(1,Math.min(H,Math.round(+cfg.ch||320))),pvx=Number.isFinite(+cfg.pivotX)?+cfg.pivotX:cw*.4;
 const out=new Uint8ClampedArray(src);const A=16,cols=Math.floor(W/cw),rows=Math.floor(H/ch);
 const op=(x,y)=>out[(y*W+x)*4+3]>A;
 const wide=Math.max(3,Math.round(10*cw/256)),thin=Math.max(3,Math.round(ch*.05));
 for(let cy=0;cy<rows;cy++)for(let cx=0;cx<cols;cx++){const ox=cx*cw,oy=cy*ch;
  // 머리 꼭대기: 위에서부터 처음으로 불투명 화소가 wide 개 이상인 줄(그 위는 실)
  let top=ch;for(let y=0;y<ch;y++){let n=0;for(let x=0;x<cw;x++)if(op(ox+x,oy+y))n++;if(n>=wide){top=y;break;}}
  // 칼날: 발 오른쪽 기둥 중 머리 아래 불투명 화소가 thin 개 미만인 기둥을 비운다
  for(let x=Math.ceil(pvx);x<cw;x++){let n=0;for(let y=top;y<ch;y++)if(op(ox+x,oy+y))n++;if(n>0&&n<thin)for(let y=top;y<ch;y++)out[((oy+y)*W+ox+x)*4+3]=0;}
  // 칠: 실 → 흰 실, 몸 → 먹(바깥 한 줄은 종이빛 테)
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const X=ox+x,Y=oy+y,i=(Y*W+X)*4;if(out[i+3]<=A)continue;
   if(y<top){out[i]=232;out[i+1]=226;out[i+2]=212;continue;}
   const edge=x===0||y===ch-1||x===cw-1||!op(X-1,Y)||!op(X+1,Y)||!op(X,Y-1)||!op(X,Y+1);
   if(edge){out[i]=226;out[i+1]=220;out[i+2]=206;out[i+3]=Math.round(out[i+3]*.95);continue;}
   const l=src[i]*.3+src[i+1]*.59+src[i+2]*.11,v=14+l*.42;out[i]=Math.round(v);out[i+1]=Math.round(v*.98);out[i+2]=Math.round(v*.95);}}
 return out;}
let baked=null,baking=false;
// 구운 화소는 큰 캔버스 그대로 내주지 않고 이미지(data 경로)로 바꿔 내준다 — 3D 기록기가 1024×640 캔버스를 '배우 스냅샷 예산 초과'로 거절했다(R161 오류).
function bakeNow(im){if(baked||baking||!im)return;const W=im.naturalWidth||im.width,H=im.naturalHeight||im.height;if(!(W>0&&H>0))return;
 baking=true;try{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  const d=g.getImageData(0,0,W,H),o=inkPuppet(d.data,W,H,{cw:256,ch:320,pivotX:101.8});if(!o){baking=false;return;}d.data.set(o);g.putImageData(d,0,0);
  const url=c.toDataURL('image/png'),img=new Image();img.onload=()=>{baked=img;baking=false;stats.bakes++;};img.onerror=()=>{baking=false;fail('baked image load failed');};img.src=url;}
 catch(err){baking=false;fail(err);}}
function bake(){if(baked||baking||!prefs.puppet)return;try{const r=baseReady?baseReady(PUPPET):null,im=r&&r.image;if(!im||!(im.naturalWidth||im.width)){want(PUPPET);return;}bakeNow(im);}catch(err){fail(err);}}
// 굽기는 그리기 호출 밖에서(다음 차례) 한 번 — 그 사이 프레임은 원본 시트.
let queued=false;function later(){if(queued||baked)return;queued=true;try{setTimeout(()=>{queued=false;bake();},0);}catch(_){queued=false;}}
function wrapReady(){if(typeof readyImage!=='function'||readyImage.__r1098)return;const base=readyImage;baseReady=base;
 const w=function(p,...a){if(p===PUPPET&&prefs.puppet){if(!baked)later();if(baked){stats.puppetServed++;return {image:baked,ready:true};}}return base.call(this,p,...a);};
 w.__r1098=true;try{readyImage=w;}catch(_){}}
wrapReady();install();try{setInterval(install,700);}catch(_){}
function set(v){if(v&&typeof v==='object'){if(typeof v.michaela==='boolean')prefs.michaela=v.michaela;if(typeof v.puppet==='boolean')prefs.puppet=v.puppet;}try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_SAMONG_FACE_R1098__=Object.freeze({revision:REV,MICH,PUPPET,covers,frame,inkPuppet,install,set,
 _setBaked:c=>{baked=c||null;},_bakeNow:bakeNow,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},baked:!!baked,lastError,presentationOnly:true,gameplayChanged:false})});
})();
