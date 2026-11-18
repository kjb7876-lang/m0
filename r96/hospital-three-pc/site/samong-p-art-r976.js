// R976 — 사몽 첫 지역 '주인 없는 자장가'(P, 구역 sz115-P-1~4·sz162-P-D·sz173-P-G)의 도트 그림을 칠한 자산으로
//  (사용자 2026-11-13 "사몽첫번째지역 도트로 된것들 다 자산으로 바꿔주고").
//  헤드리스 전수 측정(P 6구역, 그리기 명령·pixelfx 재생 기록)에서 도트로 남은 것:
//   ① R163 pixelfx 도트 시트(136~280px 칸을 크게 늘려 픽셀이 보임) — 정화의 코어 빛구슬(core-orb-teal, P-D·P-G), 열린 끝의 문(portal-teal),
//      보스·꼭두각시 촉수(tendrils-blood), 운석(meteor), 핏빛 어둠 폭발(dark-explosion-blood), 단서 줍기 반짝임(collect-burst)
//   ② 화면 위 층에 원(arc)으로 찍던 재(samong-mood-r123 'root' 테마 ash 16개)·불티(dark-r123 embers) 점
//   ③ 코드로 칠한 '검은 뿌리' 장식(samong-mood-r123 tendril, 매 프레임 베지어 도형 3개)
//  → P 구역에 있는 동안만 ① pixelfx 표(meta)의 해당 칸을 칠한 시트로 바꿔 끼우고(나가면 원래 칸으로 되돌림, 부르는 쪽 코드는 그대로),
//    ② 그 두 캔버스에서 '작은 원 하나 칠하기'를 칠한 재·불티 조각 그림(assets/r976/ash-flakes.webp)으로 그리고,
//    ③ tendril 장식 소품에 칠한 뿌리 그림 경로를 줘서 게임의 소품 그리기(그림자·가림 그대로)로 그린다.
//  자산: 정화 코어 = Dots CX-0065V(assets/r600/dots/sv-core-01.webp, 무한 생존 정화 코어와 같은 그림), 운석·폭발·반짝임 = 드라이브 core24(R411),
//   촉수·문·뿌리·재 = 저장소의 칠한 시트를 scripts/r976-samong-p-art.py 로 물들이거나 잘라 만든 것(assets/r976, 약 420KB).
//  바꾼 시트는 원래와 같은 재생 길이(장수/fps)·반복 여부를 지켜 판정·경고와 맞물린 타이밍이 그대로다. 판정·피해·저장·서사는 건드리지 않는다.
//  성능: 장식 3개의 베지어 경로(매 프레임 새 기하)가 그림 한 장(고정 텍스처)으로 바뀌고, 나머지는 그리는 수가 같다.
//  끄기 storyworld.r976.part {"on":false}. API window.__STORYWORLD_SAMONG_P_ART_R976__.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_P_ART_R976__)return;
const REV='R976-samong-p-art-1',KEY='storyworld.r976.part';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swaps:0,restores:0,tendrils:0,flakes:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// pixelfx 는 'assets/r163/pixelfx/'+file 로만 읽고, 엔진 자산 경로는 '..' 를 막는다 → 표에는 별칭(r976/<이름>.webp)을 적고
//  전역 readyImage·addImage 에서 그 별칭만 실제 경로로 바꿔 준다(다른 경로는 그대로 넘김).
const UP='assets/',ALIAS_DIR='assets/r163/pixelfx/r976/',ALIAS=new Map();
// 원래 칸: core-orb-teal 36장/15fps 반복, portal-teal 36/15 반복, tendrils-blood 44/15(2.93초), meteor 72/15(4.8초), dark-explosion-blood 55/15(3.67초), collect-burst 17/15(1.13초)
const SWAP=Object.freeze({
 // 정화의 코어: 받침 위 구슬(256x320, 24장). 구슬 가운데(y≈150)가 R173 J 인장(1.2h)에, 받침 발(y≈300)이 바닥 가까이 오도록 기준점 y=265.
 'core-orb-teal':{file:UP+'r600/dots/sv-core-01.webp',frame:[256,320],pivot:[128,265],columns:24,frames:24,fps:12,loop:true,src:'Dots CX-0065V'},
 // 열린 끝의 문: 칠한 소용돌이 7장(반복). 소용돌이 가운데가 문턱 위로 뜨게 기준점을 아래(215)로.
 'portal-teal':{file:UP+'r976/portal-teal.webp',frame:[256,256],pivot:[128,215],columns:7,frames:7,fps:10,loop:true,src:'R411 gravity-well → 청록'},
 'tendrils-blood':{file:UP+'r976/tendrils-blood.webp',frame:[256,256],pivot:[128,208],columns:6,frames:24,fps:24/(44/15),loop:false,src:'R411 tentacle-bind → 핏빛'},
 // 운석: 칠한 시트는 11~12번 칸에서 땅에 닿는다 — 원래 시트가 닿던 .67초 무렵과 맞춘 fps(24장 = 4.8초 대신 1.4초면 충돌 뒤 연기가 짧다) → 길이는 원래대로 두고 연기를 길게.
 'meteor':{file:UP+'r411/fx/boss-meteor.webp',frame:[256,256],pivot:[128,192],columns:6,frames:24,fps:24/(72/15),loop:false,src:'R411 boss-meteor'},
 'dark-explosion-blood':{file:UP+'r411/fx/boss-corpse-explosion.webp',frame:[256,256],pivot:[128,192],columns:6,frames:24,fps:24/(55/15),loop:false,src:'R411 corpse-explosion'},
 'collect-burst':{file:UP+'r411/fx/hit-teleport.webp',frame:[256,256],pivot:[128,170],columns:6,frames:24,fps:24/(17/15),loop:false,src:'R411 hit-teleport'}});
const FLAKES='assets/r976/ash-flakes.webp',ROOT_ART='assets/r976/root-tendril.webp',ROOT_H=120;
for(const [k,v] of Object.entries(SWAP))ALIAS.set(ALIAS_DIR+k+'.webp',v.file);
const real=p=>typeof p==='string'&&p.startsWith(ALIAS_DIR)?ALIAS.get(p)||null:null;
try{if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){const r=real(p);return base.call(this,r||p,...a);};}
 if(typeof addImage==='function'){const base=addImage;addImage=function(p,...a){const r=real(p);return base.call(this,r||p,...a);};}}catch(e){fail(e);}
const PX=()=>window.__STORYWORLD_PIXELFX_R163__;
const roomNow=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
// P 구역: 사몽(DREAM) 구역 id 가 sz<번호>-P-… 인 곳(본편 dist05 는 같은 지도라도 아님)
function inP(r=roomNow()){const z=r&&r.samongR103&&r.samongR103.zone;return !!(prefs.on&&typeof z==='string'&&/^sz\d+-P-/.test(z));}
let saved=null;// 바꿔 끼우기 전 원래 칸(깊은 사본)
function apply(on){const X=PX(),meta=X&&typeof X.meta==='function'?X.meta():null;if(!meta)return;
 if(on&&!saved){saved={};for(const [k,v] of Object.entries(SWAP)){if(!meta[k])continue;saved[k]=meta[k];const {src,file,...row}=v;meta[k]={...meta[k],...row,file:'r976/'+k+'.webp',pivot:row.pivot.slice(),frame:row.frame.slice(),r976:src,r976Path:file};}stats.swaps++;}
 else if(!on&&saved){for(const [k,v] of Object.entries(saved))meta[k]=v;saved=null;stats.restores++;}}
// ③ 검은 뿌리 장식
function roots(r){if(!r||!Array.isArray(r.props))return;for(const p of r.props){const d=p&&p.r123Deco;if(!d||d.kind!=='tendril'||p.path)continue;
 p.r976H=p.height;p.path=ROOT_ART;p.height=ROOT_H;p.r976Root=true;stats.tendrils++;try{if(typeof addImage==='function')addImage(ROOT_ART);}catch(e){fail(e);}}}
function unroots(r){if(!r||!Array.isArray(r.props))return;for(const p of r.props)if(p&&p.r976Root){delete p.path;p.height=p.r976H;delete p.r976Root;delete p.r976H;}}
// ② 화면 점: 그 캔버스의 '원 하나만 칠하기'를 그림 조각으로
let active=false;
const alphaOf=s=>{const m=/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(String(s));return m?{r:+m[1],g:+m[2],b:+m[3],a:m[4]===undefined?1:+m[4]}:null;};
function flakeImage(){try{const row=typeof readyImage==='function'?readyImage(FLAKES):null;if(row&&row.image)return row.image;if(typeof addImage==='function')addImage(FLAKES);}catch(e){fail(e);}return null;}
function patch(g){if(!g||g.__r976Flakes)return;const arc=g.arc,fill=g.fill,begin=g.beginPath;let one=null,cnt=0;
 g.beginPath=function(...a){one=null;cnt=0;return begin.apply(this,a);};
 g.arc=function(x,y,r,a0,a1,...a){cnt++;one=cnt===1&&Number.isFinite(x+y+r+a0+a1)&&r>0&&r<=4&&Math.abs(a1-a0)>=6.2?{x,y,r}:null;return arc.call(this,x,y,r,a0,a1,...a);};
 g.fill=function(...a){const o=one;if(active&&o&&cnt===1){const im=flakeImage(),c=im&&alphaOf(this.fillStyle);if(im&&c&&Number.isFinite(c.a)){
   const ember=c.r>200&&c.b<120,i=Math.floor(o.r*5.3)%8,s=o.r*4.6,prev=this.globalAlpha;
   try{this.globalAlpha=prev*Math.max(0,Math.min(1,c.a*(ember?1.15:1.35)));this.drawImage(im,i*32,ember?0:32,32,32,o.x-s/2,o.y-s/2,s,s);}finally{this.globalAlpha=prev;}stats.flakes++;one=null;return;}}
  return fill.apply(this,a);};
 Object.defineProperty(g,'__r976Flakes',{value:true});}
function hook(){if(typeof document==='undefined'||!document.getElementById)return;for(const id of ['moodR123','darkR123']){try{const h=document.getElementById(id),cv=h&&h.querySelector&&h.querySelector('canvas');const g=cv&&cv.getContext&&cv.getContext('2d');if(g)patch(g);}catch(e){fail(e);}}}
function step(){const r=roomNow(),on=inP(r);try{apply(on);}catch(e){fail(e);}active=on;if(on){try{roots(r);}catch(e){fail(e);}hook();}else if(!prefs.on){try{unroots(r);}catch(e){fail(e);}}}
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{step();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}try{step();}catch(e){fail(e);}}
window.__STORYWORLD_SAMONG_P_ART_R976__=Object.freeze({revision:REV,set,inP:()=>inP(),swap:SWAP,resolve:p=>real(p),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},swapped:!!saved,active,lastError})});
})();
