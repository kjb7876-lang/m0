// R105 — 2026-10-27 드라이브 신규 원화를 사몽 스테이지에 적용한다(그리기만, 판정·진행·세이브는 그대로).
//  · 보스 정적 교체: S-01 봉합부인, S-02·RA 순찰자(같은 정체성), RF 스토리텔러(책등 몸).
//  · 잡몹 정적 교체: S-02 종이가 채워진 학생, RF 종이 형상.
//  · 정적 조형물: S-01 인형 정원사(일반개체·비공격), RA 고흐 빈 의자, RB 마네 거울 정물, RC 피카소 종이면,
//    RF 고딕 의자·책등 벽. 모두 통행을 막지 않는 비충돌 장식이다.
//  · S-01 상승 맵의 주전자는 3키 상태(묶임 → 느슨 → 풀림)를 보스 상태(대기 → 체력 절반 → 격파)에 비춘다.
//    원문의 해결(주전자 안 근원 매듭)을 그림으로만 비추며 클리어 조건은 바꾸지 않는다.
// 클림트 v3은 전달자가 통합 보류로 표시해 쓰지 않는다. 열쇠 3셀은 fx-boss-r105.js 에서 RA 보스의 탄막에 쓴다.
(()=>{'use strict';
if(window.__STORYWORLD_DRIVE_ART_R105__)return;
const REV='R105-drive-art-1',DIR='assets/r105/drive/';
const stats={props:0,actorDraws:0,bossDraws:0,propDraws:0,teapot:0,failures:0};let lastError=null;
const fail=e=>{stats.failures++;lastError=String(e?.message||e).slice(0,160);};
// 에피소드 번호(R103 EP 순서) → 보스·잡몹 교체 그림.
const ACTORS={1:{boss:'boss-hostess.webp'},2:{boss:'boss-patroller.webp',mob:'mob-student.webp'},8:{boss:'boss-patroller.webp'},13:{boss:'boss-storyteller.webp',mob:'mob-paper-figure.webp'}};
// 정적 조형물 그림과 기준 높이(px, 영웅 ≈ 66px 기준의 실물 비례).
const ART={gardener:{path:'prop-gardener.webp',height:112},student:{path:'mob-student.webp',height:104},gogh:{path:'prop-gogh-chair.webp',height:140},manet:{path:'prop-manet-mirror.webp',height:140},picasso:{path:'prop-picasso-paper.webp',height:168},gchair:{path:'prop-gothic-chair.webp',height:118},gwall:{path:'prop-gothic-wall.webp',height:156},teapot:{path:'prop-teapot-1.webp',height:92}};
// 'ep:stage' → [[그림, 개수]] (서사 구간: S-01 정원사·주전자, S-02 학생, RA R-02 빈 의자, RB R-04 거울, RC R-05 종이면, RF R-11·12 고딕).
const PLAN={'1:survival':[['gardener',3]],'1:maze':[['gardener',2]],'1:ascent':[['teapot',1],['gardener',1]],
 '2:survival':[['student',4]],'2:maze':[['student',2]],
 '8:survival':[['gogh',1]],'8:maze':[['gogh',2]],'8:ascent':[['gogh',1]],
 '9:survival':[['manet',2]],'9:maze':[['manet',1]],'9:ascent':[['manet',1]],
 '10:survival':[['picasso',2]],'10:maze':[['picasso',2]],'10:ascent':[['picasso',1]],
 '13:survival':[['gchair',3]],'13:maze':[['gchair',2],['gwall',3]],'13:ascent':[['gwall',4],['gchair',1]]};
const TEAPOT=['prop-teapot-1.webp','prop-teapot-2.webp','prop-teapot-3.webp'];
// 지역 진입 때 releaseImageMemory()가 준비된 그림을 지울 수 있으므로 자체 중복 집합을 두지 않고 imageCache 기준으로 다시 요청한다.
const load=p=>{try{if(typeof addImage==='function'&&!(typeof imageCache!=='undefined'&&imageCache.has(p)))addImage(p);}catch(e){fail(e);}};
// samong-maps-r105.js dress() 가 남은 장식 자리(deco)와 보스 단(dais)을 넘긴다.
const open=(r,x,y)=>{try{return typeof blocked==='function'?!blocked(x,y,.3,r):true;}catch(e){return true;}};
function place(r,i,stage,ep,{deco=[],dais=null}={}){const plan=PLAN[i+':'+stage];if(!plan||!r?.props)return 0;let n=0,d=0;
 for(const[key,count]of plan){const art=ART[key];if(!art)continue;for(let k=0;k<count;k++){let at=null;
   if(key==='teapot'&&dais){let best=null,bd=1e9;for(const p of deco){const dd=Math.hypot(p.x-dais.x,p.y-dais.y);if(dd>3.5&&dd<bd){bd=dd;best=p;}}at=best;if(at)deco.splice(deco.indexOf(at),1);}
   else{let j=d;for(;j<deco.length;j++){const q=deco[j];if(open(r,q.x+1,q.y+1)&&open(r,q.x+1,q.y)&&open(r,q.x,q.y+1))break;}if(j<deco.length){at=deco[j];deco.splice(j,1);}else at=deco[d++];}// 카메라 쪽(+x,+y)이 트인 자리 우선: 키 큰 원화가 벽 윗면에 가리지 않게
   if(!at)break;
   const p={id:'r105:art:'+r.id+':'+key+':'+k,path:DIR+art.path,x:at.x,y:at.y,height:art.height*((key==='gwall'||key==='teapot')?1:.92+((i*7+k*13)%17)/100),solid:false,autoTargetEligible6:false,visible:true,r80PresentationOnly:true,r105Art:key};
   if(key==='teapot')p.r105Teapot=true;r.props.push(p);load(p.path);n++;}}
 stats.props+=n;return n;}
function teapotState(){const x=room?.samongR103;if(!x)return 0;const b=(room.enemies||[]).find(e=>e.boss&&e.samongR103);if(x.portal||(x.bossUp&&(!b||b.hp<=0||b.deadRecorded)))return 2;if(b&&x.bossUp&&b.hp<=b.maxHp*.5)return 1;return 0;}
function artFor(e){if(!e||!e.samongR103||!room?.samongR103)return null;const A=ACTORS[room.samongR103.ep];if(!A)return null;const f=e.boss?A.boss:A.mob;return f?DIR+f:null;}
function install(){
 // R3 전투 렌더러는 e.path가 아니라 e.profile.frames[state].assetFrame(시트 셀)을 그린다.
 // 그리는 동안만 모든 상태 프레임을 드라이브 원화 한 장(전체 영역·발밑 피벗)으로 바꾼 프로필 그림자를 씌운다.
 const frames=new Map();function frameFor(path){let f=frames.get(path);if(f)return f;const row=readyImage(path);if(!row?.image)return null;const w=row.image.naturalWidth,h=row.image.naturalHeight;if(!(w>0&&h>0))return null;
  f=Object.freeze({path,assetFrame:Object.freeze({sourceRect:Object.freeze([0,0,w,h]),pivot:Object.freeze([w/2,h]),visibleHeight:h})});frames.set(path,f);return f;}
 const STATES=['idle','move','attack','windup','hit','death','cast','recover'];
 // 주요 배우(보스)는 portable.majorNativePresentation150 포즈 표에서 프레임을 고르므로 프로필 그림자가 닿지 않는다.
 // 그 경우 그리는 동안 몸 그림 경로만 비워(readyImage→null) 몸을 빼고 그림자·체력바·이름은 원래대로 그린 뒤, 원화 한 장을 같은 자리·같은 크기로 그린다.
 let cur=null;const BODY=/actors-normalized|actors\/v3|assets\/r104\/bosses\//;
 const major=e=>{try{return !!(typeof portable==='object'&&portable?.majorNativePresentation150?.[e.nativeId]);}catch(err){return false;}};
 if(typeof readyImage==='function'){const rb=readyImage;readyImage=function(p,...a){if(cur&&typeof p==='string'&&!p.startsWith(DIR)&&(p===cur.path||BODY.test(p)))return null;return rb.call(this,p,...a);};}
 function drawStatic(e,path){const row=readyImage(path);if(!row?.image)return;const dead=e.spawnState==='dead'||e.hp<=0,age=time-(Number.isFinite(e.deadAt)?e.deadAt:time);if(dead&&age>.7)return;
  const q=project(e.x,e.y),cp=e.combatProfile,h=actorHeight()*(cp?.spriteRect?.height||(e.boss?2.05:1))*(e.defScale||1),lift=Math.max(0,Math.min(h*.65,Number(e.visualLiftPx)||0));
  const alpha=dead?Math.max(0,1-age/.7):(e.boss&&!room.engaged?.76:1),filter=e.flash>0?'brightness(1.7)':(typeof layer!=='undefined'&&layer==='DREAM')?'saturate(.8)':'none';
  sprite(path,q.x,q.y-lift,h,{alpha,flip:e.direction==='left',filter});stats.bossDraws++;}
 if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){let path=null;try{path=artFor(e);}catch(err){fail(err);}
  if(!path)return base.apply(this,[e,...a]);const f=frameFor(path);if(!f){load(path);return base.apply(this,[e,...a]);}
  if(major(e)){cur=e;stats.actorDraws++;let r;try{r=base.apply(this,[e,...a]);}finally{cur=null;}try{drawStatic(e,path);}catch(err){fail(err);}return r;}
  const old=e.path,prof=e.profile,hadR74=Object.prototype.hasOwnProperty.call(e,'r74Monster'),r74=e.r74Monster;let shadow=null;
  try{if(prof&&typeof prof==='object'){shadow=Object.create(prof);const fr={};for(const k of Object.keys(prof.frames||{}))fr[k]=f;for(const k of STATES)fr[k]=f;shadow.frames=fr;}}catch(err){fail(err);shadow=null;}
  e.path=path;if(shadow)e.profile=shadow;if(r74)e.r74Monster=false;stats.actorDraws++;
  try{return base.apply(this,[e,...a]);}finally{e.path=old;if(shadow)e.profile=prof;if(r74){if(hadR74)e.r74Monster=r74;else delete e.r74Monster;}}};}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p?.r105Art){if(!readyImage(p.path))load(p.path);else stats.propDraws++;}// 그릴 때 지연 로딩(주전자 상태1 포함)
  if(p?.r105Teapot){try{const s=teapotState(),path=DIR+TEAPOT[s];if(p.path!==path){load(path);if(readyImage(path)){p.path=path;stats.teapot++;}}}catch(err){fail(err);}}return base.apply(this,[p,...a]);};}
}
try{install();}catch(e){fail(e);}
window.__STORYWORLD_DRIVE_ART_R105__=Object.freeze({revision:REV,dir:DIR,actors:ACTORS,art:ART,plan:PLAN,teapot:TEAPOT,place,artFor,teapotState,inspect:()=>({revision:REV,stats:{...stats},lastError})});
})();
