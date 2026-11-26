// R1229 영상 속 모션·이펙트 버그 — 사용자 2026-11-19 화면 녹화 두 개(추락 dist06)와 추가 제보.
//  "1. 도형 투사체 날리는 문제 2. 발록 보스 크기가 들쭉날쭉 3. 초반에 헌터 이동 모션이 안 나옴 + 소환진 검은기둥이 고정되지 않음(위치 고정 타워형)"
//  "주사실 갈망의 약병핵 우두머리·환자와 중독된 도시 부정의 잔영도 도형 투사체", "결전의 날 발록도 도형 투사체, 그림이 켜졌다 사라짐, 렉".
//
//  ① 소환진 검은기둥(mb-dist06): 중간보스 설정(speed 1.77, ai hybrid)으로 맵을 걸어 다녔다 → 처음 나타난 자리에 붙들어 둔다.
//     표시 e.stationary=true·e.r1229Fixed=true, speed 0(R1064 돌진·R1230 고정 모션이 이 표시를 본다). 공격(원거리)은 그대로.
//  ② 발록(본편 dist06·결전의 날 ep1a09b, 분신 포함): 몸 그림이 R104·R1147 새 시트와 엔진 옛 그림(actors-normalized idle·attack·hit,
//     v31511 raised-body)을 오가며 보이는 키가 66~131px 로 두 배까지 달라졌고(dist06), 결전의 날에서는 옛 그림과 번갈아 깜빡였다.
//     → 렌더러로 넘어가는 명령에서(한 장면에 한 번) 옛 그림 몸을 그 발록이 마지막으로 그린 새 시트 칸으로 바꾸고(없으면 R1147 idle6 시트),
//       모든 몸을 새 시트의 보이는 키(배운 값, 없으면 기본값)에 맞춘다. 몸이 빠진 장면은 같은 칸으로 메운다.
//     + 사용자 12:06Z: 두 번 나오는 발록 모두 지금보다 66% 크게(모든 몸 그림·판정 반지름).
//  ③ 보스 운석(R241): 칠 스프라이트(연기·빛무리·불꽃)를 겹쳐 만든 덩어리가 작은 원판·불똥 줄처럼 보였다 →
//     24프레임 운석 시트(assets/r411/fx/boss-meteor.webp: 예고 고리 → 낙하 → 충돌 → 연기)를 위험지대 나이에 맞춰 넘긴다.
//     색은 보스 고유색(R114 팔레트 발광색) 쪽으로 hue-rotate(게임 ctx 에서 허용되는 필터만).
//  ④ 엔진 보조 도형 층(index.html story-vfx emitGeometry): 모든 적 위험지대·궤적·적 탄 위에 선·원·호(fill/stroke)를 덧그렸다 →
//     렌더 명령에서 적 몫(위험지대·궤적·적 탄)만 뺀다. 엔진 R74 원소 꼬리선(r74-projectile:*, 적 탄마다 이전 자리→지금 자리 굵은 선)도 뺀다
//     (사용자 '솔로몬의 봉인식 유리 망령 도형 투사체'). 영웅 몫·R1210 표지(r1210-fx) 효과·그림(image) 명령은 그대로.
//  ⑤ 투사체 시트(R912 몹 탄 저주 구슬 등)·운석 시트·헌터 걷기 시트가 지역을 옮길 때 엔진 releaseImageMemory 에서 빠져,
//     다시 받는 동안(2초 이상) 몹 탄이 원래의 회색 고리 구슬(projectile-core 물들인 그림 = '도형')로 보였다 → 그 그림들은 지우지 않고 남긴다.
//  ⑥ 피의 육망성 조형물(R170) 바닥 공격: 본편에서 코드로 그린 핏빛 원판·원호·육망성 선 → Dots 8칸 예고 고리 시트(R1213 bomb-warning8)를 핏빛으로.
//  헌터 걷기 시트 자체는 visual-r119.js RUN164 에 헌터 줄을 더해 바꾼다(scripts/r1229-hunter-walk.py, assets/r130/hunter/walk1229-*).
//  끄기: localStorage['storyworld.r1229']='{"pillar":false,"balrog":false,"balrogBig":false,"meteor":false,"geom":false,"pin":false,"hex":false,"trail":false}' (항목별)
(()=>{'use strict';
if(window.__STORYWORLD_MOTION_FX_R1229__)return;
const REV='R1229-motion-fx-1',KEY='storyworld.r1229';
const prefs={pillar:true,balrog:true,balrogBig:true,meteor:true,meteorV2:true,geom:true,pin:true,hex:true,trail:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={pinned:0,pillarFixed:0,balrogDraws:0,balrogSwapped:0,balrogScaled:0,balrogFilled:0,meteorFrames:0,meteorFallback:0,geomRemoved:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const AH=()=>{try{const h=typeof actorHeight==='function'?actorHeight():60;return Number.isFinite(h)&&h>0?h:60;}catch(_){return 60;}};
const METEOR='assets/r411/fx/boss-meteor.webp';
// R1287(사용자 2026-11-21): 보스 운석을 사용자가 고른 v2 시트로(투명 2304×1536, 칸 384, 6×4 행 우선, 착탄 피벗 (163,276)).
//  0–11 낙하(착탄 직전 0.5초), 12–23 착탄·폭발·잔불(기존 0.45초). 크기는 예전 보이는 운석의 2배. 지면 예고는 옛 시트 바닥 고리(판정 지름 — R241 반지름 2배로 같이 2배).
//  v2 를 못 받았으면 예전 24칸 그대로. 끄기: localStorage['storyworld.r1229']='{"meteorV2":false}'.
const METEOR2='assets/r1287/boss-meteor-v2.webp';
// ---------------- ⑤ 그림 기억에서 빠지지 않게 ----------------
const HEXW='assets/r1213/bomb-warning8.webp';
const PIN=new Set([METEOR,METEOR2,HEXW,'assets/r1147/bosses/dist06-idle6.webp',...['s','se','e','ne','n'].map(d=>'assets/r130/hunter/walk1229-'+d+'.webp'),
 ...['01','02','03','03x','04','05','06','09a','09b','09c','10'].flatMap(k=>['assets/r912/pj'+k+'-fly.webp','assets/r912/pj'+k+'-hit.webp']),'assets/r912/pj07-fly.webp']);
const cp=p=>{try{return typeof cleanPath==='function'?cleanPath(p):p;}catch(_){return p;}};
function installPin(){if(typeof releaseImageMemory!=='function'||releaseImageMemory.__r1229)return;const base=releaseImageMemory;
 const w=function(...a){if(!prefs.pin||typeof imageCache==='undefined')return base.apply(this,a);const saved=[];try{for(const p of PIN){const k=cp(p),r=imageCache.get(k);if(r&&r.ready)saved.push([k,r]);}}catch(e){fail(e);}
  const out=base.apply(this,a);try{for(const [k,r] of saved)if(!imageCache.has(k)){imageCache.set(k,r);stats.pinned++;}}catch(e){fail(e);}return out;};
 w.__r1229=true;releaseImageMemory=w;}
const asked=new Map();
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r?.image)return r.image;const t=Date.now();if(t-(asked.get(p)||0)>1500&&typeof ensureImages==='function'){asked.set(p,t);Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
// ---------------- ① 소환진 검은기둥 ----------------
const isPillar=e=>!!e&&!e.r251Circle&&(/(?:^|:)mb-dist06$/.test(String(e.id||''))||/소환진 검은기둥/.test(String(e.name||'')));
const anchor=new WeakMap();
function pin(){if(!prefs.pillar||typeof room!=='object'||!room?.enemies)return;for(const e of room.enemies){if(!isPillar(e))continue;
 e.stationary=true;e.r1229Fixed=true;e.speed=0;if(!(e.hp>0)||e.spawnState!=='active'||e.visible===false){anchor.delete(e);continue;}
 let a=anchor.get(e);if(!a){a={x:e.x,y:e.y};anchor.set(e,a);stats.pillarFixed++;}
 if(e.x!==a.x||e.y!==a.y){e.x=a.x;e.y=a.y;}if('vx' in e)e.vx=0;if('vy' in e)e.vy=0;}}
// ---------------- ② 발록 몸 통일 ----------------
const isBalrog=e=>!!e&&!e.r251Circle&&!isPillar(e)&&/발록/.test(String(e.name||''))&&!/소환진/.test(String(e.name||''));
const CANON=/\/bosses\/dist06-|\/float\/dist06-|\/r1147\/|\/r104\/[^/]*dist06/i,OLD=/actors-normalized\/[0-9a-f]+_balrog-|v31511\/balrog-raised-/i,SWORD=/v31511\/balrog-raised-sword/i;
const NATIVE_RAISED=/v31511\/balrog-raised-body/i;
const nativeWindup=(e,path)=>NATIVE_RAISED.test(path)&&(!!e.attack||e.rangedWindup>0||T()<e.storyAttackUntil5||e.r61Action&&!e.r61Action.cancelled&&T()<e.r61Action.endAt);
const fracMemo=new Map();
function frac(im,sr){// 칸 안 알파 테두리(위·아래·가운데) 비율 — 그림·칸마다 한 번만 잰다
 try{const r=window.__STORYWORLD_BOSS2D_R1337__?.frac?.(im?.src||'');if(r)return r;}catch(_){}/* R1337: 발록 손질 사본은 모든 칸이 기준 칸과 같은 몸통 배율·발 자리라 기준 칸 테두리로 잰다(칸마다 보이는 키로 맞추면 칼 든 칸이 작아짐) */
 const k=(im?.src||'')+'|'+sr.join(',');let f=fracMemo.get(k);if(f!==undefined)return f;f=null;
 try{const w=Math.max(1,Math.round(sr[2]/3)),h=Math.max(1,Math.round(sr[3]/3)),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sr[0],sr[1],sr[2],sr[3],0,0,w,h);
  const d=g.getImageData(0,0,w,h).data;let y0=h,y1=-1,x0=w,x1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){if(y<y0)y0=y;if(y>y1)y1=y;if(x<x0)x0=x;if(x>x1)x1=x;}
  if(y1>=y0)f={top:y0/h,bot:(y1+1)/h,cx:(x0+x1+1)/2/w};}catch(e){fail(e);}
 fracMemo.set(k,f);if(fracMemo.size>600)fracMemo.delete(fracMemo.keys().next().value);return f;}
const bstate=new WeakMap();
// 사용자 2026-11-19 12:06Z "발록보스 2번 나오는 거 2번 다 발록만 일관성 있게 지금보다 크기 66% 키워줘 모든 부분에서" → 새 시트 기준 보이는 키 × 1.66,
// 몸 판정 반지름도 같은 배율(한 번만). 끄기 {balrogBig:false}.
const BIG_K=1.66;let BIG=1;const bigOn=()=>prefs.balrogBig!==false;
function grow(e){if(!bigOn()||e.r1229Big)return;e.r1229Big=true;for(const k of ['radius','hitRadius','bodyRadius'])if(Number.isFinite(e[k])&&e[k]>0)e[k]*=BIG_K;}
const srcOf=c=>String(c.sourcePath||c.image?.src||'');
function geom(c){const P=c.points,xs=P.map(v=>v[0]),ys=P.map(v=>v[1]);return{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),flip:P[1][0]<P[0][0]};}
// 렌더러로 넘어가는 명령 단계에서 한 번만 맞춘다(drawEnemy 를 여러 겹 감싸면 이미 키운 점에서 다시 배워 크기가 흔들렸다).
const FB='assets/r1147/bosses/dist06-idle6.webp',FB_N=6,FB_W=508,FB_H=501,RATIO=2.04;/* 보이는 몸 키/영웅 키 — 추락 dist06 새 시트 실측(영웅 키 53.7px 에서 109px). 두 발록 모두 이 값 하나로(지역·시트마다 배우지 않음) */
function quad(left,top,Ww,Hh,fl){return fl?[[left+Ww,top],[left,top],[left,top+Hh],[left+Ww,top+Hh]]:[[left,top],[left+Ww,top],[left+Ww,top+Hh],[left,top+Hh]];}
function fbCell(){const im=img(FB);if(!im)return null;const n=Math.floor(T()*8)%FB_N;return {image:im,sourcePath:FB,sourceRect:[n*FB_W,0,FB_W,FB_H],imageSize:[FB_W*FB_N,FB_H]};}
function place(c,cell,footX,footY,want,fl){const f=frac(cell.image,cell.sourceRect);if(!f)return false;const Hh=want/(f.bot-f.top),Ww=Hh*cell.sourceRect[2]/cell.sourceRect[3];
 Object.assign(c,{kind:'image',image:cell.image,sourcePath:cell.sourcePath,immutableTint:null,sourceRect:cell.sourceRect.slice(),imageSize:Array.isArray(cell.imageSize)?cell.imageSize.slice():cell.imageSize});
 c.points=quad(footX-Ww*f.cx,footY-Hh*f.bot,Ww,Hh,fl);return true;}
// 엔진이 이 발록을 한 장면 통째로 안 그린 경우(결전의 날 깜빡임): 화면 안이고 1.5초 안에 그린 적이 있으면 그 명령을 본떠 메운다.
function fillGone(e,s,cs,want){const why=e.visible===false?'vis':(e.spawnState&&e.spawnState!=='active')?'spawn':!s.tpl?'tpl':T()-s.tplAt>1.5?'old':'';if(why){stats['gone_'+why]=(stats['gone_'+why]||0)+1;return;}const q=project(e.x,e.y),Wd=typeof W==='number'?W:960,Hd=typeof H==='number'?H:540;
 if(!(q.x>-80&&q.x<Wd+80&&q.y>-40&&q.y<Hd+want)){stats.gone_off=(stats.gone_off||0)+1;return;}const cell=s.last||fbCell();if(!cell){stats.gone_cell=(stats.gone_cell||0)+1;return;}const lift=Math.max(0,+e.visualLiftPx||0);
 const c={...s.tpl,key:'enemy:'+e.id+':r1229body',r1229:'fill',r1229Fit:true,clips:[]};if(!place(c,cell,q.x,q.y-lift,want,!!s.lastFlip)){stats.gone_place=(stats.gone_place||0)+1;return;}cs.push(c);stats.balrogFilled++;}
function fitOne(e,cs){
 BIG=bigOn()?BIG_K:1;grow(e);const own='enemy:'+e.id;let s=bstate.get(e);if(!s){s={ratio:null,last:null};bstate.set(e,s);}
 const idx=[];for(let i=0;i<cs.length;i++){const c=cs[i];if(c&&c.owner?.id===own)idx.push(i);}
 if(!idx.length){fillGone(e,s,cs,RATIO*AH()*BIG);return;}
 const mine=idx.map(i=>cs[i]).filter(c=>c.kind==='image'&&c.points&&c.sourceRect);
 const body=mine.filter(c=>{const path=srcOf(c);return !SWORD.test(path)&&(CANON.test(path)||OLD.test(path));}).sort((a,b)=>(geom(b).y1-geom(b).y0)-(geom(a).y1-geom(a).y0));
 const want=RATIO*AH()*BIG;let main=body[0];if(mine.some(c=>c.r1229Fit))return;/* 렌더 감싸기가 두 겹(three·renderer)이어도 한 번만 */
 if(!main){// 몸이 빠진 장면: 마지막 새 시트 칸(없으면 기본 시트)으로 메운다(깜빡임 방지)
  const tp=mine[0]||s.tpl;if(typeof project!=='function'||!tp)return;const cell=s.last||fbCell();if(!cell)return;const q=project(e.x,e.y),lift=Math.max(0,+e.visualLiftPx||0);
  const c={...tp,owner:cs[idx[0]].owner||tp.owner,key:own+':r1229body',r1229:'fill',clips:[]};if(!place(c,cell,q.x,q.y-lift,want,!!s.lastFlip))return;
  c.r1229Fit=true;cs.splice(idx[0],0,c);stats.balrogFilled++;return;}
 main.r1229Fit=true;s.tpl=main;s.tplAt=T();const g0=geom(main),src=srcOf(main),f=frac(main.image,main.sourceRect);if(!f)return;
 const visH=(g0.y1-g0.y0)*(f.bot-f.top),footY=g0.y0+(g0.y1-g0.y0)*f.bot,footX=g0.flip?g0.x1-(g0.x1-g0.x0)*f.cx:g0.x0+(g0.x1-g0.x0)*f.cx;
 const canon=CANON.test(src);
 // While the R104 strike sheets load, the native raised body and its separate
 // sword still show the windup. Scale the pair together at the body foot.
 if(canon||nativeWindup(e,src)){const r=visH/AH();if(Number.isFinite(r)&&r>0&&canon){
   stats.balrogRatio=+r.toFixed(3);
   s.last={image:main.image,sourcePath:main.sourcePath,sourceRect:main.sourceRect.slice(),imageSize:main.imageSize};s.lastFlip=g0.flip;}
  const k=want/visH;if(Number.isFinite(k)&&Math.abs(k-1)>=.02){const kk=Math.max(.4,Math.min(3.4,k));
   for(const c of mine){if(!(CANON.test(srcOf(c))||OLD.test(srcOf(c))||SWORD.test(srcOf(c))))continue;c.points=c.points.map(([x,y])=>[footX+(x-footX)*kk,footY+(y-footY)*kk]);}stats.balrogScaled++;}
  return;}
 // 옛 그림 → 마지막 새 시트 칸(없으면 기본 시트), 같은 발 자리·같은 키. 붙은 칼·다른 옛 몸은 지운다.
 const cell=s.last||fbCell();if(!cell||!place(main,cell,footX,footY,want,g0.flip))return;
 for(let j=idx.length-1;j>=0;j--){const c=cs[idx[j]];if(c!==main&&c.kind==='image'&&(OLD.test(srcOf(c))||SWORD.test(srcOf(c))))cs.splice(idx[j],1);}
 stats.balrogSwapped++;}
function fitBalrogs(cs){if(!prefs.balrog||!Array.isArray(cs)||typeof room!=='object'||!room?.enemies)return;for(const e of room.enemies)if(isBalrog(e)&&e.hp>0)try{fitOne(e,cs);}catch(err){fail(err);}}
// ---------------- ③ 보스 운석 프레임 시트 ----------------
function hueOf([r,g,b]){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;if(d<1e-6)return null;let h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;h*=60;return h<0?h+360:h;}
function meteorFrame(h){const life=Math.max(h.warning+.05,+h.life||h.warning+.45);if(h.age<h.warning)return Math.min(8,Math.floor(h.age/h.warning*9));return Math.min(23,9+Math.floor((h.age-h.warning)/(life-h.warning)*15));}
// R241 은 drawEffect 를 늦게·여러 번 감싸 'r241-fx' 를 직접 그린다 → 그리기 순서와 상관없게, 렌더러로 넘어가는 명령 단계에서
// R241·R1192(운석 밝히기) 조각 명령을 빼고 그 자리에 시트 칸 이미지 명령 하나씩을 넣는다(키·owner 는 운석마다 고정 → 메시 재사용).
function meteorCmd(h,im,tpl){if(typeof project!=='function')return null;const m=h.r241Meteor,q=project(h.x,h.y),R=(Number(h.radius)||1.25);
 const b=project(h.x+1,h.y-1),unit=Math.hypot(b.x-q.x,b.y-q.y)/Math.SQRT2,dia=Math.max(AH()*.9,2*R*unit),s=dia/104;/* 시트 예고 고리 지름 약 104px, 가운데 (141,190) */
 const fr=meteorFrame(h),sx=(fr%6)*256,sy=Math.floor(fr/6)*256,hue=hueOf(m?.pal?.main?.b||[255,140,60]),rot=hue==null?0:Math.round(((hue-28)%360+540)%360-180);
 const x0=q.x-141*s,y0=q.y-190*s,w=256*s;
 return {...tpl,kind:'image',key:'r1229:meteor:'+h.id,image:im,sourcePath:im.src||METEOR,immutableTint:null,mutable:false,sourceRect:[sx,sy,256,256],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
  points:[[x0,y0],[x0+w,y0],[x0+w,y0+w],[x0,y0+w]],clips:[],owner:{...(tpl.owner||{}),id:'r241:'+h.id,kind:'effect',x:h.x,y:h.y,r1229:true},
  style:{...(tpl.style||{}),globalAlpha:1,globalCompositeOperation:'source-over',filter:rot?'hue-rotate('+rot+'deg) saturate(1.15)':'none'},r1229Meteor:fr};}
// R1287 v2: 프레임·고유색·명령
const V2_CROP=[[283,45,75,65],[267,38,79,60],[251,51,75,60],[235,59,89,65],[219,61,70,77],[205,57,79,98],[191,91,92,83],[178,105,83,91],[167,107,79,110],[155,146,85,91],[145,158,80,101],[134,170,84,113],[113,224,102,84],[99,201,130,105],[85,183,156,121],[75,168,175,134],[70,165,189,137],[65,158,202,144],[58,151,215,152],[51,144,229,160],[45,138,241,167],[39,132,252,173],[34,128,262,178],[42,128,255,186]];/* 칸마다 보이는 범위(+2px) — 투명 여백을 그리지 않는다 */
const V2_FALL=.5,V2_K=112/* 칸 1px = 판정지름/112: R1287 에서 판정 반지름도 2배(2.5칸)라 바위·폭발 모두 예전 보이는 크기(옛 1.25칸 판정에서 바위 약 .38·폭발 약 1.63 판정지름)의 2배 */,V2_HUE=16;
function meteorV2Frame(h){const w=Math.max(0,+h.warning||0),life=Math.max(w+.05,+h.life||w+.45),a=+h.age||0;
 if(a<w){const st=Math.max(0,w-V2_FALL);if(a<st)return -1;return Math.max(0,Math.min(11,Math.floor((a-st)/Math.max(.01,w-st)*12)));}
 return Math.min(23,12+Math.floor((a-w)/(life-w)*12));}
function hsvOf([r,g,b]){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b);return {h:hueOf([r*255,g*255,b*255]),s:M?(M-m)/M:0,v:M};}
// 보스 고유색(R114 발광색) → 기록기 허용 필터만(hue-rotate·saturate·grayscale·brightness·contrast). 주황(시트 원색) 근처는 그대로.
function meteorTint(c){if(!Array.isArray(c)||c.length<3)return 'none';const {h,s,v}=hsvOf(c);
 if(h==null||s<.18)return 'grayscale(.9) brightness(1.12) contrast(1.12)';/* 무채색 이름색: 잿빛 불 */
 const rot=Math.round(((h-V2_HUE)%360+540)%360-180),dark=v<.85/* R114 glow: '검은' 이름색은 어두운 보라 빛 */;
 const f=[];if(Math.abs(rot)>=12)f.push('hue-rotate('+rot+'deg)','saturate('+(1+.25*s).toFixed(2)+')');if(dark)f.push('brightness(.78)','contrast(1.18)');
 return f.length?f.join(' '):'none';}
function meteorCmds(h,tpl){const im=img(METEOR),im2=prefs.meteorV2?img(METEOR2):null;if(!im2){if(!im)return [];const c=meteorCmd(h,im,tpl);return c?[c]:[];}
 if(typeof project!=='function')return [];const m=h.r241Meteor,q=project(h.x,h.y),R=(Number(h.radius)||1.25);
 const b=project(h.x+1,h.y-1),unit=Math.hypot(b.x-q.x,b.y-q.y)/Math.SQRT2,dia=Math.max(AH()*.9,2*R*unit),filter=meteorTint(m?.pal?.main?.b),out=[];
 const base=(key,image,src,rect,size,pts,extra)=>({...tpl,kind:'image',key,image,sourcePath:image.src||src,immutableTint:null,mutable:false,sourceRect:rect,imageSize:size,points:pts,clips:[],
  owner:{...(tpl.owner||{}),id:'r241:'+h.id,kind:'effect',x:h.x,y:h.y,r1229:true},style:{...(tpl.style||{}),globalAlpha:1,globalCompositeOperation:'source-over',filter},...extra});
 // 지면 예고: 옛 시트 0–5칸 아래 띠(바닥 고리만, y 162–230) — 판정 지름 그대로(R1229 와 같은 자리·크기)
 if(h.age<h.warning&&im){const u=Math.max(0,Math.min(1,h.age/Math.max(.01,h.warning))),fr=Math.min(5,Math.floor(u*6)),s0=dia/104,Y0=162,BH=68,x0=q.x-141*s0,y0=q.y-190*s0+Y0*s0,w=256*s0;
  out.push(base('r1287:ring:'+h.id,im,METEOR,[fr*256,Y0,256,BH],[im.naturalWidth||im.width,im.naturalHeight||im.height],[[x0,y0],[x0+w,y0],[x0+w,y0+BH*s0],[x0,y0+BH*s0]],{r1287Ring:fr}));}
 const fr=meteorV2Frame(h);if(fr>=0){const s=dia/V2_K,[cx,cy,cw,ch]=V2_CROP[fr],sx=(fr%6)*384+cx,sy=Math.floor(fr/6)*384+cy,x0=q.x-(163-cx)*s,y0=q.y-(276-cy)*s;
  out.push(base('r1229:meteor:'+h.id,im2,METEOR2,[sx,sy,cw,ch],[im2.naturalWidth||im2.width,im2.naturalHeight||im2.height],[[x0,y0],[x0+cw*s,y0],[x0+cw*s,y0+ch*s],[x0,y0+ch*s]],{r1229Meteor:fr,r1287:true}));stats.meteorV2=(stats.meteorV2||0)+1;}
 return out;}
const METEOR_OWNER=/^r(?:241|1192):/;
function swapMeteors(cs){if(!prefs.meteor||!Array.isArray(cs)||typeof hazards==='undefined')return;const live=hazards.filter(h=>h&&h.r241Meteor);if(!live.length)return;
 if(!img(METEOR)&&!(prefs.meteorV2&&img(METEOR2))){stats.meteorFallback++;return;}let at=-1,tpl=null,w=0;
 for(let i=0;i<cs.length;i++){const c=cs[i];if(c&&METEOR_OWNER.test(String(c.owner?.id||''))&&!c.owner?.r1229){if(at<0)at=w;if(!tpl&&c.kind==='image')tpl=c;continue;}cs[w++]=c;}cs.length=w;
 if(!tpl)return;/* 이 장면에 R241 이 아무것도 안 그렸으면(화면 밖·예산 건너뛰기) 넣지 않는다 */
 const add=[];for(const h of live)add.push(...meteorCmds(h,tpl));cs.splice(at<0?cs.length:at,0,...add);stats.meteorFrames+=add.length;}
// ---------------- ③b 피의 육망성 조형물(R170) 바닥 공격 ----------------
// 본편(주사실 등)에서 R170 이 코드로 그린 핏빛 원판·원호·육망성 선(fill/stroke)을 Dots 8칸 예고 고리 시트(R1213 bomb-warning8, 칸 256)로 바꾼다.
// 예고 진행도에 맞춰 0→7칸, 터진 뒤는 마지막 칸이 사라진다. 색은 핏빛으로(hue-rotate·saturate·brightness 만). 끄기 {hex:false}.
const HEX_OWNER=/^r170:hex:(.+)$/;
function swapHex(cs){if(!prefs.hex||!Array.isArray(cs)||typeof hazards==='undefined')return;/* R1254: 사몽 방은 R170 이 먹 번짐(사몽 전용)으로 그린다 → 본편 핏빛 고리로 바꾸지 않는다 */try{if(window.__STORYWORLD_COMBAT_R170__?.inkMode?.())return;}catch(_){}let any=false;for(const c of cs)if(c&&c.kind!=='image'&&c.kind!=='text'&&HEX_OWNER.test(String(c.owner?.id||''))){any=true;break;}if(!any)return;
 const im=img(HEXW);let w=0,at=-1;const seen=new Map();
 for(let i=0;i<cs.length;i++){const c=cs[i],m=c&&c.kind!=='image'&&c.kind!=='text'&&HEX_OWNER.exec(String(c.owner?.id||''));
  if(m&&im){if(!seen.has(m[1]))seen.set(m[1],{at:w,owner:c.owner,order:c.order});continue;}cs[w++]=c;}cs.length=w;if(!im||!seen.size)return;
 const tpl=cs.find(c=>c&&c.kind==='image'&&c.points&&c.sourceRect);if(!tpl)return;const add=[];
 for(const [id,v] of seen){const h=hazards.find(x=>String(x.id)===id&&x.r170);if(!h||typeof project!=='function')continue;const q=project(h.x,h.y),half=h.radius*Math.SQRT2*Math.abs(project(h.x+1,h.y).x-q.x);
  const warn=h.age<h.warning,u=warn?h.age/Math.max(.01,h.warning):1,fr=Math.min(7,Math.floor(u*8)),alpha=warn?.8+.2*u:Math.max(0,Math.min(1,(h.life-h.age)*3));if(alpha<=.01)continue;
  const sc=2*half/216,Wd=256*sc,Hd=256*sc*.5;/* 시트 고리 지름 약 216px → 바닥 마름모 반폭에 맞추고 세로 반(바닥에 눕힘) */
  add.push({at:v.at,c:{...tpl,kind:'image',key:'r1229:hex:'+id,image:im,sourcePath:HEXW,immutableTint:null,mutable:false,sourceRect:[fr*256,0,256,256],imageSize:[2048,256],
   points:[[q.x-Wd/2,q.y-Hd/2],[q.x+Wd/2,q.y-Hd/2],[q.x+Wd/2,q.y+Hd/2],[q.x-Wd/2,q.y+Hd/2]],clips:[],order:v.order,owner:{...(v.owner||{}),r1229:true},
   style:{...(tpl.style||{}),globalAlpha:alpha,globalCompositeOperation:'source-over',filter:'hue-rotate(150deg) saturate(3.2) brightness(.85)'},r1229Hex:fr}});}
 for(let i=add.length-1;i>=0;i--)cs.splice(add[i].at,0,add[i].c);stats.hexFrames=(stats.hexFrames||0)+add.length;}
// ---------------- ④ 엔진 보조 도형 빼기 ----------------
function enemyShot(id){try{const m=/^story-vfx:projectile:(.+)$/.exec(id);if(!m||typeof projectiles==='undefined')return false;const pr=projectiles.find(p=>String(p.id)===m[1]);return !!pr&&!pr.friendly;}catch(_){return false;}}
function stripGeom(cs){if(!prefs.geom||!Array.isArray(cs))return;let w=0,n=0;for(let i=0;i<cs.length;i++){const c=cs[i],o=c?.owner;
 const drop=o&&o.storyVfx&&c.kind!=='image'&&c.kind!=='text'&&(o.ownerType==='hazard'||/^story-vfx:hazard-trail:/.test(String(o.id||''))||(o.ownerType==='projectile'&&enemyShot(String(o.id||''))))
  ||(o&&c.kind==='stroke'&&/^r74-projectile:/.test(String(o.id||'')));/* 엔진 R74 원소 꼬리: 모든 적 탄 뒤에 굵은 선을 그었다(유리 망령 등 '선 투사체'로 보임) — 탄 그림(R912 시트)은 그대로 */
 if(drop){n++;continue;}cs[w++]=c;}if(n){cs.length=w;stats.geomRemoved+=n;}}
// ④b R1254(외부 리뷰 11-20): 엔진 drawHostileTrail39(index.html) 가 적 탄마다 앞에 코드 직선 두 줄(어두운 줄+계열색 줄)을 긋는다.
//  이 선은 owner 가 story-vfx 가 아니라 일반 장면 명령이라 위 빼기와 R1229 집계에서 빠졌다(R912 시트가 안 붙는 탄·시트 받기 전).
//  → 적 탄 그리기 동안만 ctx.stroke 를 비워 선을 남기지 않는다(적 탄은 프레임 그림만 — 사용자 상시 규칙). 영웅 탄은 그대로. 끄기 {trail:false}.
let trailDone=false;
function installTrail(){if(trailDone||typeof drawProjectile!=='function')return;trailDone=true;const base=drawProjectile;
 const w=function(b,...a){const C=typeof ctx==='object'||typeof ctx==='function'?ctx:null;if(!prefs.trail||!b||b.friendly||!C)return base.apply(this,[b,...a]);
  let own=false,prev=null,set=false;try{own=Object.prototype.hasOwnProperty.call(C,'stroke');prev=C.stroke;C.stroke=function(){stats.trailCut=(stats.trailCut||0)+1;};set=true;}catch(_){}
  try{return base.apply(this,[b,...a]);}finally{if(set)try{if(own)C.stroke=prev;else delete C.stroke;}catch(e){fail(e);}}};
 for(const k of ['__r912','__r911'])if(base[k])w[k]=base[k];w.__r1254=true;drawProjectile=w;}
function wrapRender(obj){if(!obj||typeof obj.render!=='function'||obj.render.__r1229)return;const base=obj.render;const w=function(f,...a){try{if(f&&Array.isArray(f.commands)){stripGeom(f.commands);swapMeteors(f.commands);swapHex(f.commands);fitBalrogs(f.commands);}}catch(e){fail(e);}return base.call(this,f,...a);};w.__r1229=true;obj.render=w;}
function installGeom(){try{const three=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(three){wrapRender(three);/* perf-r97 처럼 인스턴스에 render 를 따로 둔 경우도 */if(three.renderer)wrapRender(three.renderer);}}catch(e){fail(e);}}
// ---------------- 설치 ----------------
// 맨 바깥에 서야 한다: R241 은 drawEffect 를 늦게 감싸 'r241-fx' 를 직접 그리고 아래로 넘기지 않으며, 다른 덧씌우기도 drawEnemy 를 나중에 감싼다.
// 다른 감싸기가 위에 올라오면 다시 감싸되(안쪽 옛 감싸기는 같은 일을 한 번 더 할 뿐 결과가 같다) 횟수를 제한해 사슬이 끝없이 길어지지 않게 한다.
const rewrap={balrog:0,geom:0};let geomFor=null,pinDone=false;
let pre=0;
function installAll(){if(!pinDone&&typeof releaseImageMemory==='function'){installPin();pinDone=true;}installTrail();
 if(pre<3&&typeof ensureImages==='function'){pre++;for(const q of [HEXW,METEOR,METEOR2,FB])img(q);}/* 첫 공격 전에 시트를 받아 둔다(받기 전 몇 장면은 예전 그림이 그대로 보였다) */
 const three=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(three&&three!==geomFor){rewrap.geom++;installGeom();geomFor=three;}/* 렌더 감싸기는 사슬 어디에 있어도 렌더러에 닿기 전 배열을 고친다 → 객체마다 한 번 */}
if(typeof tick==='function'&&!tick.__r1229){const base=tick;const w=function(...a){pin();const r=base.apply(this,a);try{pin();installAll();}catch(e){fail(e);}return r;};w.__r1229=true;tick=w;}
if(typeof setTimeout==='function')setTimeout(installAll,0);else installAll();
window.__STORYWORLD_MOTION_FX_R1229__=Object.freeze({rev:REV,isPillar,isBalrog,meteorFrame,meteorV2Frame,meteorTint,meteorCmds,
 inspect:()=>({rev:REV,prefs:{...prefs},stats:{...stats},rewrap:{...rewrap},lastError}),
 set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
