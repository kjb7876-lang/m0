// R409 — 사용자 2026-11-08 "전투중에 이펙트 적모형 영웅모형 다 잘들어나게 aaa급게임참고해서 이펙트연출감독 검수로".
//  헤드리스 실측(중앙 코어 이주실 u206, 몹 6마리와 A·S·Q·W·E·R 스킬):
//   ① 회색 로브 몹이 회색 바닥에 묻힌다(외곽선 없음, 명도 차 작음).
//   ② 영웅 쪽 큰 이펙트(R106 육망성 sigil·룬 고리, sig-aura-blue 등)가 몹 몸을 통째로 덮어 누가 어디 있는지 안 보인다.
//   ③ 영웅은 R350 가 이미 가림 옅게·유령으로 살린다(여기서는 테두리만 더한다).
//  AAA 액션 RPG 의 읽기 규칙(디아블로 IV·패스 오브 엑자일·로스트아크 등의 공통 원리 — 자산·코드는 쓰지 않음):
//   - 적은 어두운 테두리 + 붉은 바깥 테(적대 신호), 영웅은 따뜻한 밝은 테 — 배경 명도와 상관없이 실루엣이 선다.
//   - 플레이어 쪽 큰 효과는 적 몸 위에서 옅어진다(작은 타격 불꽃은 그대로 — 타격감은 남긴다).
//   - 적의 예고·탄·위험지대는 절대 옅게 하지 않는다(게임 정보).
//  방법: Three 기록기 명령(frame.commands)을 render 직전에 고친다(R350 과 같은 자리, 바깥쪽에서 먼저 돈다).
//   1) 테두리(outline): 살아 있는 몹·영웅 몸 그림(바뀌지 않는 이미지 명령)을 같은 그림 + 테두리를 구운 캔버스로 바꾼다.
//      구운 캔버스는 원본 잘라낸 칸 둘레에 여백(pad)을 두고, 화면 네 귀퉁이도 그만큼 넓혀 크기·위치가 그대로다.
//      캐시(원본·칸·두께·색) → 같은 프레임 그림은 한 번만 굽는다(텍스처·메시 재생성 없음). 최대 96장, 1.6M 픽셀 넘는 그림은 건너뜀.
//   2) 몹 위 가림 옅게(enemyVeil): 영웅 쪽 이펙트·장면 그림 가운데 몹 몸보다 훨씬 큰 것(1.6배 이상)이 몹 몸을 덮으면
//      덮는 비율만큼 최대 42% 옅게 한다. 작은 타격 그림·적 쪽 그림·바닥 붙은 그림·글자·R350 피 튐은 건드리지 않는다.
//  판정·피해·AI·저장·자산 원본은 바꾸지 않는다(그림만). 끄기: localStorage['storyworld.r409.combatRead']='{"outline":false,"enemyVeil":false,"castBehind":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_COMBAT_READ_R409__)return;
const REV='R409-combat-read-2',KEY='storyworld.r409.combatRead';
let prefs={outline:true,enemyVeil:true,castBehind:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={frames:0,enemyBodies:0,heroBodies:0,outlined:0,baked:0,bakeSkipped:0,cacheEvicted:0,veiled:0,castBehind:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
// 적 쪽 그림(R350 과 같은 규칙) — 옅게 하지 않는다.
const ENEMY_ID=/^(r98|r241|r114:(windup|charge|thrown)|r160|r170:hex|r105|r169|r240|r328|r111:boss|r162|r167|r248|r286|r330|r341|story-vfx|enemy|boss|mob|hazard|final\d*-r)/i;
const ENEMY_WORD=/(^|[:_-])(enemy|mob|mobs|boss|hazard|hex|sigil)([:_-]|$)/i;
const HOSTILE_R88=new Set([99,111,213,214,215,251,259,260,261,262]);
function enemySide(o){if(!o)return false;const id=String(o.id||'');return o.pxfSide==='enemy'||o.storyVfx===true||o.enemy===true||o.r98===true||ENEMY_ID.test(id)||ENEMY_WORD.test(id)||(o.r88Final42===true&&HOSTILE_R88.has(Number(o.r88SourceIndex)));}
function bbox(c){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const add=p=>{if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1];};
 if(c.kind==='image'&&Array.isArray(c.points))for(const p of c.points)add(p);else if(Array.isArray(c.paths))for(const path of c.paths)for(const p of path.points||[])add(p);
 return x1>x0&&y1>y0?{x0,y0,x1,y1}:null;}
const areaOf=b=>b?(b.x1-b.x0)*(b.y1-b.y0):0;
const overlap=(a,b)=>Math.max(0,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0))*Math.max(0,Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0));

// ── 테두리 색(색채심리: 적=핏빛 적흑 — 위협, 영웅=따뜻한 상아·금 — 주인공 시선 고정). 두 겹: 바깥 옅은 테 + 안쪽 진한 선.
const LOOK={
 enemy:{outer:'rgba(170,22,26,0.62)',inner:'rgba(14,4,6,0.92)',k:1},
 hero:{outer:'rgba(255,232,170,0.55)',inner:'rgba(40,24,8,0.70)',k:.8}};
// R434(사용자 2026-11-08 "보고한 바탕으로 개선" — 디아블로·이터널 리턴식 실루엣): 상아색 테는 옅은 영웅 그림과 갈색 바닥 위에서 거의 안 보였다.
//  → 영웅 테를 그 영웅 고유색(R302)의 차가운 빛으로(따뜻한 바닥과 보색 대비), 안쪽 선은 더 진하게·조금 두껍게.
//  붉은 계열 고유색(미카엘라·슬레이어·헌터)은 적 테(핏빛)와 섞이지 않게 은색(보조색). 끄기: localStorage storyworld.r434.readability {"heroRim":false}.
const RED_HERO=new Set(['michaela','slayer','hunter']);
function heroRimOn(){try{return JSON.parse(localStorage.getItem('storyworld.r434.readability')||'{}').heroRim!==false;}catch(_){return true;}}
function heroLook(){try{if(!heroRimOn())return null;const id=typeof player!=='undefined'&&player?String(player.hero||''):'';const P=window.__STORYWORLD_HERO_PALETTE_R302__?.palette?.[id];if(!P)return null;
 const c=RED_HERO.has(id)?(P.sub||[226,232,242]):P.main;return{key:'hero:'+id,outer:'rgba('+c.join(',')+',0.72)',inner:'rgba(6,8,12,0.88)',k:1.05};}catch(_){return null;}}
const BUCKETS=[1,2,3,4,6,8,11,15,20];
const bucket=v=>{for(const b of BUCKETS)if(v<=b)return b;return BUCKETS[BUCKETS.length-1];};
const SCREEN_R=2.4;/* 화면에서 바깥 테 두께(px) — 1280×720 기준. 안쪽 선은 그 절반쯤 */
const MAX_PX=1600000,CACHE_MAX=96;
const cache=new Map();/* key → canvas (삽입 순서 = 오래된 순) */
const ids=new WeakMap();let idSerial=0;const imgId=im=>{let v=ids.get(im);if(!v){v=++idSerial;ids.set(im,v);}return v;};
function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
// 알파 0.45 넘는 곳만 실루엣으로(그림 안 반투명 그림자·연기 띠에 테가 붙지 않게).
// R440(사용자 2026-11-09 "영웅 잘 보이게 하는 선이 좀 잘리는 느낌, 어색"): 영웅 테가 가는 칼날(무채색 금속)까지 굵은 관처럼 감싸고,
//  칼끝 옅은 픽셀(알파≤115)에서 뚝 끊겨 '잘린 막대'처럼 보였다 → 영웅 테 실루엣에서 '몸(굵은 부분) 밖의 가는 무채색 금속'을 뺀다.
//  (환도만 — 아래 BLADE_HEROES) 굵은 부분 = 실루엣을 반지름 R(칸 높이의 2.2%)로 깎았다 다시 불린 것(열기). 무채색 = RGB 폭 < 26. 칼날 둘레 1px 도 함께 뺀다.
//  망토 끝·손·장화(베이지·갈색)는 그대로 테를 받는다. 칼날은 바깥 색 테 없이 가는 어두운 선(안쪽 선의 2/3 두께)만 받아 은빛이 바닥 위에서도 읽힌다. 적 테는 바뀌지 않는다.
//  끄기: localStorage storyworld.r409.combatRead {"bladeRim":true} (예전처럼 칼날도 감쌈).
// 환도만: 망토가 베이지라 '가는 무채색' = 칼날로 가를 수 있다. 슬레이어·라우렌처럼 검은 옷의 가는 몸은 무채색이라 몸 테까지 빠져(헤드리스 확인) 넣지 않는다.
const BLADE_HEROES=new Set(['hwando']);
function bladeCut(){if(prefs.bladeRim===true)return false;try{return typeof player!=='undefined'&&BLADE_HEROES.has(String(player?.hero||''));}catch(_){return false;}}
function morph(A,W,H,R,grow){const T=new Uint8Array(A.length),O=new Uint8Array(A.length);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=grow?0:1;for(let k=-R;k<=R&&(grow?!v:v);k++){const xx=x+k;const q=xx<0||xx>=W?0:A[y*W+xx];v=grow?(v|q):(v&q);}T[y*W+x]=v;}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=grow?0:1;for(let k=-R;k<=R&&(grow?!v:v);k++){const yy=y+k;const q=yy<0||yy>=H?0:T[yy*W+x];v=grow?(v|q):(v&q);}O[y*W+x]=v;}
 return O;}
function mask(src,sx,sy,sw,sh,side){const m=makeCanvas(sw,sh),g=m.getContext('2d',{willReadFrequently:true});g.drawImage(src,sx,sy,sw,sh,0,0,sw,sh);
 const d=g.getImageData(0,0,sw,sh),a=d.data,N=sw*sh,S=new Uint8Array(N),B=new Uint8Array(N);for(let i=0,j=0;j<N;i+=4,j++)S[j]=a[i+3]>115?1:0;
 if(side==='hero'&&bladeCut()){try{const R=Math.max(2,Math.round(sh*.022)),thick=morph(morph(S,sw,sh,R,false),sw,sh,R,true),steel=new Uint8Array(N);let n=0;
  for(let i=0,j=0;j<N;i+=4,j++)if(S[j]&&!thick[j]&&Math.max(a[i],a[i+1],a[i+2])-Math.min(a[i],a[i+1],a[i+2])<26){steel[j]=1;n++;}
  if(n){const near=morph(steel,sw,sh,1,true);for(let j=0;j<N;j++)if(near[j]&&!thick[j]){S[j]=0;if(a[j*4+3]>40)B[j]=1;}stats.bladeCut=(stats.bladeCut||0)+1;}}catch(e){fail(e);}}
 let solid=0,nb=0,bd=null;for(let j=0;j<N;j++)if(B[j]){nb++;}
 if(nb){const bm=makeCanvas(sw,sh),bg=bm.getContext('2d'),bdat=bg.createImageData(sw,sh);for(let j=0;j<N;j++)if(B[j])bdat.data[j*4+3]=255;bg.putImageData(bdat,0,0);bd=bm;}
 for(let i=0,j=0;j<N;i+=4,j++){if(S[j]){a[i]=a[i+1]=a[i+2]=0;a[i+3]=255;solid++;}else a[i+3]=0;}
 g.putImageData(d,0,0);if(solid<=12)return null;m.r440Blade=bd;return m;}
function dilate(m,r,color,W,H,pad){const c=makeCanvas(W,H),g=c.getContext('2d');const n=r<=2?8:r<=6?12:16;
 for(let ring=r;ring>0;ring-=Math.max(1,r/2.5))for(let i=0;i<n;i++){const t=i/n*Math.PI*2;g.drawImage(m,pad+Math.cos(t)*ring,pad+Math.sin(t)*ring);}
 g.drawImage(m,pad,pad);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,W,H);return c;}
function bake(src,sx,sy,sw,sh,r,side){
 sx=Math.round(sx);sy=Math.round(sy);sw=Math.round(sw);sh=Math.round(sh);if(sw<4||sh<4)return null;
 const key=imgId(src)+':'+sx+','+sy+','+sw+','+sh+':'+r+':'+(side==='hero'?(heroLook()?.key||side)+(bladeCut()?':b':''):side);let hit=cache.get(key);
 if(hit){cache.delete(key);cache.set(key,hit);return hit;}
 const pad=r+1,W=sw+pad*2,H=sh+pad*2;if(W*H>MAX_PX){stats.bakeSkipped++;return null;}
 const m=mask(src,sx,sy,sw,sh,side);if(!m){stats.bakeSkipped++;return null;}
 const L=(side==='hero'?heroLook():null)||LOOK[side],out=makeCanvas(W,H),g=out.getContext('2d');
 g.drawImage(dilate(m,r,L.outer,W,H,pad),0,0);g.drawImage(dilate(m,Math.max(1,Math.round(r*.45)),L.inner,W,H,pad),0,0);
 /* R440: 칼날은 굵은 테 대신 가는 어두운 선만(바닥 위에서 칼이 사라지지 않게) */if(m.r440Blade){g.globalAlpha=.75;g.drawImage(dilate(m.r440Blade,Math.max(1,Math.round(r*.3)),L.inner,W,H,pad),0,0);g.globalAlpha=1;m.r440Blade.width=m.r440Blade.height=0;}
 g.drawImage(src,sx,sy,sw,sh,pad,pad,sw,sh);m.width=m.height=0;
 const row={canvas:out,pad,sw,sh};out.__storyworldStaticSource={path:'r409:outline:'+side+':'+key};
 cache.set(key,row);stats.baked++;
 while(cache.size>CACHE_MAX){const k=cache.keys().next().value;cache.delete(k);stats.cacheEvicted++;}/* 쓰던 캔버스는 렌더러가 참조를 놓으면 GC */
 return row;}
// 화면 네 귀퉁이를 원본 칸 바깥으로 pad 만큼 넓힌다(u·v 방향 각각 비율로).
function grow(points,sw,sh,pad){const [a,b,,d]=points,u=[(b[0]-a[0])/sw,(b[1]-a[1])/sw],v=[(d[0]-a[0])/sh,(d[1]-a[1])/sh];
 const P=(s,t)=>[a[0]+u[0]*s+v[0]*t,a[1]+u[1]*s+v[1]*t];return [P(-pad,-pad),P(sw+pad,-pad),P(sw+pad,sh+pad),P(-pad,sh+pad)];}
function aliveEnemy(o){try{if(typeof room==='undefined'||!room?.enemies)return true;if(!Number.isFinite(o?.x))return true;
 let best=null,bd=.9;for(const e of room.enemies){const d=Math.hypot(e.x-o.x,e.y-o.y);if(d<bd){bd=d;best=e;}}return !best||best.hp>0;}catch(_){return true;}}
function bodyOf(c,side){if(!c||c.kind!=='image'||c.mutable||c.owner?.r350||c.owner?.r409||c.owner?.groundAligned===true)return false;
 if(!Array.isArray(c.points)||c.points.length!==4||!Array.isArray(c.sourceRect))return false;
 const q=bbox(c);if(!q)return false;const w=q.x1-q.x0,h=q.y1-q.y0;if(w<14||h<18)return false;/* 아주 작은 표지·아이콘은 몸이 아니다 */
 return side==='hero'?c.owner?.kind==='hero':c.owner?.kind==='enemy';}
function outline(c,side){const [sx,sy,sw,sh]=c.sourceRect,[a,b]=c.points,screenW=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!(screenW>0))return false;
 const r=bucket(Math.max(1,SCREEN_R*((side==='hero'?heroLook():null)||LOOK[side]).k*sw/screenW));const row=bake(c.image,sx,sy,sw,sh,r,side);if(!row)return false;
 c.image=row.canvas;c.mutable=false;c.sourcePath=row.canvas.__storyworldStaticSource.path;c.immutableTint=row.canvas.__storyworldStaticSource;
 c.sourceRect=[0,0,row.canvas.width,row.canvas.height];c.imageSize=[row.canvas.width,row.canvas.height];c.points=grow(c.points,sw,sh,row.pad);c.r409Outlined=side;stats.outlined++;return true;}
const lastVeiled=[];
// 타격 그림(맞음·베기·피·불꽃)은 타격감이라 옅게 하지 않는다. 화면 전체 칠(경로 fill — 어둠·조명 막)도 건드리지 않는다(이미지 명령만).
const KEEP_PATH=/(hit|slash|impact|spark|blood|crit)/i;
// 3) 시전 예고 뒤로(castBehind): 몹 시전 예고 육망성(play-r169 'r328:sigil:')은 몹 몸 위에 크게 그려져(overHero) 몸을 덮었다.
//    AAA 관례대로 시전자 '뒤'에 깔리게, 같은 몹 몸 명령보다 칠하는 순서만 앞으로 당긴다(크기·밝기·시간·판정은 그대로 — 예고 정보는 그대로 보인다).
const CAST_ID=/^r328:sigil:/;
function castBehind(commands,bodies){if(!bodies.length)return;for(const c of commands){if(!c||!CAST_ID.test(String(c.owner?.id||'')))continue;const o=c.owner;let best=null,bd=.08;
 for(const b of bodies){const d=Math.hypot((b.owner.x??1e9)-o.x,(b.owner.y??1e9)-o.y);if(d<bd){bd=d;best=b;}}
 if(best&&c.order>best.order){c.order=best.order-.5+Math.min(.4,(c.order-best.order)*1e-3);c.r409Behind=true;stats.castBehind++;}}}
function process(commands){
 if(!Array.isArray(commands)||!commands.length)return;stats.frames++;
 const enemyBoxes=[],bodies=[];
 for(const c of commands){
  if(bodyOf(c,'enemy')&&aliveEnemy(c.owner)){stats.enemyBodies++;bodies.push(c);const q=bbox(c);if(prefs.outline){try{outline(c,'enemy');}catch(e){fail(e);}}
   if(q){const w=q.x1-q.x0,h=q.y1-q.y0;/* 몸 중심부(여백 빼고) */const box={x0:q.x0+w*.2,x1:q.x1-w*.2,y0:q.y0+h*.12,y1:q.y1-h*.04};box.area=areaOf(box);if(box.area>16)enemyBoxes.push(box);}}
  else if(bodyOf(c,'hero')){stats.heroBodies++;if(prefs.outline){try{outline(c,'hero');}catch(e){fail(e);}}}}
 if(prefs.castBehind){try{castBehind(commands,bodies);}catch(e){fail(e);}}
 if(!prefs.enemyVeil||!enemyBoxes.length)return;
 lastVeiled.length=0;
 for(const c of commands){if(!c||c.kind!=='image'||c.mutable||c.spatialRole==='body'||c.r409Outlined||KEEP_PATH.test(String(c.sourcePath||'')))continue;const o=c.owner;if(!o||o.r350||o.r409||o.groundAligned===true)continue;
  if(o.kind!=='effect'&&o.kind!=='scene')continue;if(enemySide(o))continue;
  const q=bbox(c);if(!q)continue;const A=areaOf(q);let cover=0,biggest=0;
  for(const e of enemyBoxes){const ov=overlap(q,e);if(ov<=0)continue;if(A<e.area*1.6)continue;/* 몹보다 작거나 비슷한 타격 그림은 그대로 */cover=Math.max(cover,ov/e.area);biggest=Math.max(biggest,e.area);}
  if(cover<.25)continue;const k=1-.42*clamp((cover-.25)/.6);
  if(c.style){c.style={...c.style,globalAlpha:(c.style.globalAlpha??1)*k};stats.veiled++;if(lastVeiled.length<24)lastVeiled.push([String(o.id||'').slice(0,40),String(c.sourcePath||'').split('/').slice(-1)[0].slice(0,40),+k.toFixed(2)]);}}
}
// render 감싸기 — R350 과 같은 방식(프로토타입 + 인스턴스, 깊이로 안쪽 감싸기 건너뜀). 이 파일은 R350 뒤에 실려 바깥쪽 → 먼저 돈다.
let depth=0;const wrapped=new WeakSet();
const wrapFn=fn=>{if(fn.__r409)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r409=true;
 for(const k of Object.keys(fn))try{w[k]=fn[k];}catch(_){}return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!r.render.__r409&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
setInterval(wrapInst,500);wrapInst();
function set(p){for(const k of ['outline','enemyVeil','castBehind','bladeRim'])if(typeof p?.[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_COMBAT_READ_R409__=Object.freeze({revision:REV,set,process,bake,wrapRender:wrapFn,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},cached:cache.size,lastVeiled:lastVeiled.slice(),lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false}),
 resetStats:()=>{for(const k in stats)stats[k]=0;lastVeiled.length=0;}});
})();
