// R1139b EGO 각성 영웅(0번째 히든) — Dots 최종 인계 그림 연결(사용자 2026-11-18 05:32Z "에고히든영웅 구글드라이브확인", 드라이브 'EGO-R1139_클로드_사용자선택_최종인계' A·B·C).
//  R1139 전수 조사에서 남긴 뿌리 문제(EGO 몸 공격 동작이 내려 베기 한 가지뿐)를 Dots 그림으로 푼다. 인계 지침(00_START_HERE)대로 그림만 바꾼다 — 판정·피해·시간·쿨다운·소리·키는 그대로.
//   ① 기본 공격 1~5타 몸 동작 = 가로 베기 3방향(앞·뒤·오른쪽, 왼쪽은 좌우 뒤집기). R1048 이 고른 공격 칸(16칸)을 같은 진행도의 가로 베기 칸(8칸)으로 바꿔 끼운다.
//      Q·W·R(스킬·궁극기 진행도)은 기존 동작 그대로. 걷기·대기·피격·관측 폐기도 그대로.
//   ② 찌르기(오른쪽 전용): 기존 오른쪽 찌르기·E 그림 길이 없어(E 는 R209 가 뺌) 연결하지 않는다 — 그림도 싣지 않음(THRUST 에 까닭 기록).
//   ③ 검 궤적: 기본 공격 가로 베기일 때만 R1048 궤적(ego_slash) 자리에 가로 붓 궤적. 먹선이 남게 가산 합성을 풀고, 옛 흰 심 겹은 끈다(흰 과다 방지).
//   ④ 적중: 기본 공격 휘두름 한 번에, 실제로 체력이 줄어든 가장 가까운 적 자리에 먹 튐 8칸을 한 번.
//   ⑤ 보호막: 협주 기술 '되비친 집착'(R1094)이 준 보호막이 남아 있는 동안만 R1027 보호막 자리에 고리 8칸(가운데 비움). 다른 보호막·분신 몫은 그대로.
//   ⑥ 아이콘: EGO 형상일 때 기존 칸 7개(기본 공격·회피·막기·Q·W·R·각성) 그림만. Q·W 는 어두운 바탕에서 묻혀 칸 바탕(종이색)을 깐다. 다른 영웅·다른 칸은 그대로.
//  새 그림을 아직 못 받았으면 기존 동작·궤적을 그대로 둔다(투명 영웅 없음). RC151 변신 중이면 쉰다.
//  끄기: localStorage storyworld.r1139b.egoDots = {"on":false}. 새 저장 필드·키 없음. tick 은 직접 감싸지 않고 __STORYWORLD_POST_HOOKS__.register 로.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_DOTS_R1139B__)return;
const REV='R1139b-ego-dots-1',KEY='storyworld.r1139b.egoDots',BASE='assets/r1139/ego/',CLS='ego-dots-r1139b';
const fin=Number.isFinite,clamp=(v,a,b)=>fin(v)?Math.min(b,Math.max(a,v)):a;
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const stats={frames:0,body:0,trail:0,shield:0,impacts:0,impactDraws:0,noImage:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{return f();}catch(_){return d;}};
const now=()=>G(()=>typeof time==='number'&&fin(time)?time:null,null);
function active(){if(!on)return false;return G(()=>{const S=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;return !!(S?.formActive?.()&&!S?.inspect?.().rc151);},false);}
// 그림 값(게임용: 원본 512칸 → 256칸, 적중·아이콘은 128칸). 몸은 R1048 시트(160칸·발 80,140.8·몸 96px)와 발·키를 맞춘다.
const FX=Object.freeze({
 old:Object.freeze({cell:160,foot:Object.freeze([80,140.8]),bodyPx:96}),
 body:Object.freeze({cell:256,frames:8,foot:Object.freeze([128,220]),bodyPx:150,size:1.1,lift:'brightness(1.32) contrast(1.22)'}),
 trail:Object.freeze({path:BASE+'trail-horizontal.webp',cell:256,frames:6,k:.55,alpha:.95}),
 impact:Object.freeze({path:BASE+'impact.webp',cell:128,frames:8,fps:24,size:1.5,lift:.45,range:3.2,alpha:.92}),
 shield:Object.freeze({path:BASE+'shield.webp',cell:256,frames:8,fps:8,k:2}),
 icons:Object.freeze({path:BASE+'icons.webp',cell:128,count:7})});
const SHEET=Object.freeze({front:BASE+'slash-front.webp',rear:BASE+'slash-rear.webp',right:BASE+'slash-right.webp'});
const THRUST=Object.freeze({connected:false,why:'인계 지침: 오른쪽 전용 찌르기는 기존 오른쪽 찌르기·E 그림 길이 확인될 때만 연결. E 는 R209 가 뺐고 5타 강제 찌르기도 금지라 연결하지 않음(그림 미탑재).'});
// ---- 그림 받기(R1048 과 같은 길: readyImage 캐시 줄 → 한 번 받은 그림은 쥐고 있는다) ----
const held=new Map(),asked=new Map();
function img(p){try{if(typeof readyImage==='function'){const im=readyImage(p)?.image||null;if(im&&(im.naturalWidth||im.width)>0){held.set(p,im);return im;}}
  const h=held.get(p);if(h)return h;const t=Date.now?.()||0;if(typeof addImage==='function'&&!(t-(asked.get(p)||-1e9)<1500)){asked.set(p,t);addImage(p);}}catch(_){}return null;}
const ALL=Object.freeze([SHEET.front,SHEET.rear,SHEET.right,FX.trail.path,FX.impact.path,FX.shield.path]);
// ---- ① 순수 계산: 방향·칸·상자 ----
const DIRS=Object.freeze({s:['front',false],n:['rear',false],e:['right',false],se:['right',false],ne:['rear',false],w:['right',true],sw:['right',true],nw:['rear',true]});
function sheetFor(dir){const d=typeof dir==='string'&&Object.prototype.hasOwnProperty.call(DIRS,dir)?DIRS[dir]:null;return d?{sheet:d[0],flip:d[1],path:SHEET[d[0]]}:null;}
// R1048 공격 16칸(예비 0~4·타격 5~10·여운 11~15) → 가로 베기 8칸(0 준비·1 당김·2~3 휘두름·4 끝까지·5~6 여운·7 거둠)
const BODY_MAP=Object.freeze([0,0,1,1,2,3,3,4,4,4,5,5,6,6,7,7]);
function bodyFrame(f){f=Math.round(+f);if(!fin(f)||f<0)return 0;return BODY_MAP[Math.min(15,f)];}
const TRAIL_MAP=Object.freeze({3:0,4:0,5:1,6:1,7:2,8:2,9:3,10:4,11:5});
function trailFrame(f){f=Math.round(+f);const k=fin(f)?TRAIL_MAP[f]:undefined;return Number.isInteger(k)?k:-1;}
const okPts=p=>Array.isArray(p)&&p.length===4&&p.every(q=>Array.isArray(q)&&fin(q[0])&&fin(q[1]));
// 옛 몸 칸 네 점 → 새 몸 칸 네 점(발 자리·몸 키 그대로)
function bodyQuad(points,flip){if(!okPts(points))return null;const O=FX.old,B=FX.body,k=Math.abs(points[1][0]-points[0][0])/O.cell;if(!(k>0))return null;
 const fx=Math.min(points[0][0],points[1][0])+O.foot[0]*k,fy=points[0][1]+O.foot[1]*k,k2=k*O.bodyPx/B.bodyPx*B.size;
 const L=fx-B.foot[0]*k2,R=fx+(B.cell-B.foot[0])*k2,T=fy-B.foot[1]*k2,M=fy+(B.cell-B.foot[1])*k2;
 const q=flip?[[R,T],[L,T],[L,M],[R,M]]:[[L,T],[R,T],[R,M],[L,M]];return q.every(v=>fin(v[0])&&fin(v[1]))?q:null;}
function squareAt(cx,cy,side,flip){const h=side/2,L=cx-h,R=cx+h,T=cy-h,M=cy+h;if(![L,R,T,M].every(fin)||!(side>0))return null;return flip?[[R,T],[L,T],[L,M],[R,M]]:[[L,T],[R,T],[R,M],[L,M]];}
const centre=p=>[(p[0][0]+p[2][0])/2,(p[0][1]+p[2][1])/2];
function shieldFrame(t){const F=FX.shield;if(!fin(t))return 0;return ((Math.floor(t*F.fps+1e-9)%F.frames)+F.frames)%F.frames;}
function impactFrame(t0,t){const F=FX.impact;if(!fin(t0)||!fin(t)||t<t0)return -1;const k=Math.floor((t-t0)*F.fps+1e-9);return k<F.frames?k:-1;}
// 이번 틱에 체력이 줄어든 적 가운데 범위 안에서 가장 가까운 하나
function pickHit(list,px,py){if(!Array.isArray(list)||!fin(px)||!fin(py))return null;let b=null,bd=FX.impact.range**2;
 for(const h of list){if(!h||!(h.drop>0)||!fin(h.x)||!fin(h.y))continue;const d=(h.x-px)**2+(h.y-py)**2;if(d<=bd){bd=d;b=h;}}return b;}
// ---- 상태 ----
const motion=()=>G(()=>window.__STORYWORLD_EGO_MOTION_R1048__?.inspect?.()||null,null);
const basicOf=m=>!!(m&&m.input?.basic&&m.state?.clip==='attack');
const cloneInk=f=>G(()=>!!window.__STORYWORLD_EGO_POLISH_R1139__?.isCloneInk?.(f),false)||(typeof f==='string'&&/grayscale\(1\)/.test(f));
let kitShield=false,impact=null,swingHit=false,wasBasic=false,lastAp=NaN,tickN=0;const hpSeen=new WeakMap();
const shieldName=()=>G(()=>window.__STORYWORLD_EGO_KIT_R1094__?.SKILL?.shield?.name,null)||'되비친 집착';
function tick(){try{const act=active();G(()=>document.body.classList.toggle(CLS,act));if(!act){impact=null;kitShield=false;wasBasic=false;return;}
  if((tickN++%40)===0)for(const p of ALL)img(p);
  const p=G(()=>typeof player==='object'?player:null,null);if(!p)return;
  if(!(+p.shield>0))kitShield=false;
  const m=motion(),basic=basicOf(m),ap=+m?.input?.attackP;
  if(basic&&(!wasBasic||(fin(ap)&&fin(lastAp)&&ap<lastAp-.15)))swingHit=false;wasBasic=basic;lastAp=basic?ap:NaN;
  const E=G(()=>typeof room==='object'&&room&&Array.isArray(room.enemies)?room.enemies:null,null),drops=[];
  if(E)for(const e of E){if(!e||typeof e!=='object')continue;const prev=hpSeen.get(e),cur=+e.hp;if(fin(prev)&&fin(cur)&&cur<prev)drops.push({x:+e.x,y:+e.y,drop:prev-cur});if(fin(cur))hpSeen.set(e,cur);}
  if(basic&&!swingHit){const h=pickHit(drops,+p.x,+p.y),t=now();if(h&&t!=null){swingHit=true;impact={x:h.x,y:h.y,t0:t};stats.impacts++;}}
 }catch(e){fail(e);}}
// ---- 프레임 명령 손질 ----
const BODY_SRC=/assets\/r1048\/ego\/attack-([a-z]{1,2})\.webp/,SLASH_SRC=/r1048\/fx\/ego_slash\.webp/,BARRIER_SRC=/\/r1027\/barrier\.webp/;
const srcOf=c=>G(()=>String(c.sourcePath||''),'');
const sizeOf=im=>[im.naturalWidth||im.width,im.naturalHeight||im.height];
function swap(c,im,path,frame,cell,pts){c.image=im;c.sourcePath=path;c.sourceRect=[frame*cell,0,cell,cell];c.imageSize=sizeOf(im);c.points=pts;c.immutableTint=null;c.mutable=false;c.egoDotsR1139b=true;}
function process(cmds){if(!active()||!Array.isArray(cmds))return 0;stats.frames++;let n=0,tpl=null,top=-Infinity;
 const m=motion(),basic=basicOf(m),t=now();
 for(const c of cmds){if(!c||typeof c!=='object')continue;if(fin(c.order)&&c.order>top)top=c.order;
  if(c.kind!=='image'||c.owner?.kind!=='hero'||c.egoDotsR1139b)continue;const s=srcOf(c);
  if(c.r1048==='attack'){const d=BODY_SRC.exec(s);if(!tpl&&d&&!cloneInk(c.style?.filter))tpl=c;if(!basic||!d)continue;
   const sh=sheetFor(d[1]),im=sh&&img(sh.path),q=sh&&bodyQuad(c.points,sh.flip),w=+c.sourceRect?.[2];if(!sh||!q||!(w>0))continue;if(!im){stats.noImage++;continue;}
   swap(c,im,sh.path,bodyFrame(c.sourceRect[0]/w),FX.body.cell,q);c.owner={...c.owner,r409:true};{const f0=typeof c.style?.filter==='string'&&c.style.filter!=='none'?c.style.filter.trim():'';if(!f0.includes(FX.body.lift))c.style={...c.style,filter:(f0?f0+' ':'')+FX.body.lift};}/* 밤 맵에서 대기 몸(R1099 수묵, 같은 밝기 올림)과 밝기가 어긋나지 않게 */c.r1090=true;/* 이미 수묵풍으로 그린 그림 — R1090 담묵(채도 절반)을 또 걸면 언주색이 죽는다 */stats.body++;n++;continue;}
  if(c.r1048==='fx'&&SLASH_SRC.test(s)){if(!basic||!okPts(c.points))continue;const im=img(FX.trail.path);if(!im){stats.noImage++;continue;}
   if(/r1048s1$/.test(String(c.key||''))){c.style={...c.style,globalAlpha:0};c.egoDotsR1139b=true;n++;continue;}
   const tf=trailFrame(m?.state?.frame),[cx,cy]=centre(c.points),side=Math.abs(c.points[1][0]-c.points[0][0])*FX.trail.k,q=squareAt(cx,cy,side,!(c.points[0][0]>c.points[1][0]));if(!q)continue;
   swap(c,im,FX.trail.path,Math.max(0,tf),FX.trail.cell,q);/* R1336: R1048 베기 띠는 두 쪽(s0·s1)마다 반쪽 자르기 상자를 건다 — s1 을 끄고 s0 을 궤적 한 장으로 바꿀 때 그 상자를 물려받으면 초승달 앞쪽이 잘린다(사용자 영상 'EGO 공격 이펙트 잘림') */c.clips=[];c.style={...c.style,globalAlpha:tf<0?0:clamp(+(c.style?.globalAlpha??1),0,1)*FX.trail.alpha,globalCompositeOperation:'source-over'};stats.trail++;n++;continue;}
  if(kitShield&&BARRIER_SRC.test(s)&&okPts(c.points)&&!cloneInk(c.style?.filter)){const im=img(FX.shield.path);if(!im){stats.noImage++;continue;}
   const [cx,cy]=centre(c.points),q=squareAt(cx,cy,Math.abs(c.points[1][0]-c.points[0][0])*FX.shield.k,false);if(!q)continue;
   swap(c,im,FX.shield.path,shieldFrame(t),FX.shield.cell,q);c.owner={...c.owner,r409:true,r350:true,r448:true};c.style={...c.style,globalAlpha:clamp(+(c.style?.globalAlpha??1)*2.2,.55,.95)};stats.shield++;n++;}}
 // ④ 적중 먹 튐: 영웅 몫 명령 하나를 틀로 삼아 맨 위에 한 장
 if(impact){const f=impactFrame(impact.t0,t);if(f<0)impact=null;else{const im=img(FX.impact.path),base=tpl||cmds.find(c=>c&&c.kind==='image'&&c.owner?.kind==='hero'&&okPts(c.points));
   const pr=G(()=>project(impact.x,impact.y),null),ah=G(()=>{const h=actorHeight();return fin(h)&&h>0?h:60;},60);
   const q=pr&&squareAt(+pr.x,+pr.y-ah*FX.impact.lift,ah*FX.impact.size,false);
   if(im&&base&&q){cmds.push({...base,image:im,sourcePath:FX.impact.path,sourceRect:[f*FX.impact.cell,0,FX.impact.cell,FX.impact.cell],imageSize:sizeOf(im),points:q,immutableTint:null,mutable:false,r1048:undefined,
     key:String(base.key||'hero')+':r1139bi',order:(fin(top)?top:cmds.length)+1,owner:{...base.owner,r409:true,r350:true,r448:true,r1048fx:true},style:{globalAlpha:FX.impact.alpha,globalCompositeOperation:'source-over'},egoDotsR1139b:true});stats.impactDraws++;}}}
 return n;}
// ---- ⑥ 아이콘(CSS 만: 그림 주소를 바꾸지 않아 다른 영웅으로 돌아가면 저절로 원래 그림) ----
const ICON_SLOTS=Object.freeze([['#attackIcon',0,false],['#blinkIcon',1,false],['#guardIcon',2,false],['#specialIcon',3,true],['#story-wer-w img',4,true],['#story-wer-r img',5,false],['#egoIcon',6,false]]);
function iconCss(){const n=FX.icons.count-1;return ICON_SLOTS.map(([sel,i,back])=>'body.'+CLS+' '+sel+'{content:url("./'+FX.icons.path+'");object-fit:cover;object-position:'+(i/n*100).toFixed(3)+'% 50%;filter:none;'+(back?'background:#d9d2c2;border-radius:22%;':'')+'}').join('\n');}
// ---- 설치 ----
const done={};
function wrapText(){if(done.text||typeof floatText!=='function')return;done.text=true;const base=floatText;
 floatText=function(text){try{if(typeof text==='string'&&text===shieldName()&&active())kitShield=true;}catch(e){fail(e);}return base.apply(this,arguments);};}
function addStyle(){if(done.style||typeof document==='undefined'||!document.head)return;done.style=true;const el=document.createElement('style');el.id='egoDotsR1139bStyle';el.textContent=iconCss();document.head.appendChild(el);}
let depth=0;
const wrapFn=fn=>{if(fn.__r1139b)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1139b=true;return w;};
const wrapped=typeof WeakSet==='function'?new WeakSet():null;
function wrapRender(){try{if(!done.proto){const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function'){C.render=wrapFn(C.render);done.proto=true;}}
  const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(wrapped&&r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
function install(){try{wrapText();addStyle();wrapRender();}catch(e){fail(e);}}
try{window.__STORYWORLD_POST_HOOKS__.register('__r1139b',{tick},fail);}catch(e){fail(e);}
install();try{setInterval(install,500);}catch(_){}
window.__STORYWORLD_EGO_DOTS_R1139B__=Object.freeze({revision:REV,FX,SHEET,THRUST,BODY_MAP,sheetFor,bodyFrame,trailFrame,bodyQuad,shieldFrame,impactFrame,pickHit,process,iconCss,active,
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,active:active(),installed:{...done},kitShield,impact:impact?{...impact}:null,stats:{...stats},lastError})});
})();
