// R1376 교만의 사이보그 교주(cult04 c104-boss, 2D 본보스) 그림 일관성.
//  사용자 2026-11-27 07:23Z "교만의사이보그 교주(교주의사몽최종보스몹)일관성 엄청낮은것도 개선해주고".
//  실측(헤드리스, qa/r1376/cult-consist-browser.mjs):
//   ① 체력 76%·50%·25% 아래로 몸이 전혀 다른 인물 그림(정장 노인 cult-v3123 · 날개 천사 superego · 갑옷 기사 final_pride ·
//      의식 보스 black_ritual · pride_hierophant 준비/평소/공격 스틸)으로 바뀌어, 같은 교주로 읽히지 않았다(평소 몸 높이 1.52배 차이).
//   ② 첫 형상 안에서도 R104 자세 4장(p1 준비·p2 타격·p3 이어짐·p4 평소)이 엔진 프레임 키를 따라 0.05초 만에 번갈아 깜빡였다.
//  고친 것(그리기만, 판정·체력·패턴·서사·단계 그대로):
//   · 몸 그림은 처음부터 끝까지 R104/R119 의 Drive v17 '교만의 사이보그 교주' 자세 4장만 쓴다. 예전 다른 인물 그림을 그리려 하면
//     그 자리에서 같은 발·가운데·키 기준으로 v17 자세로 바꿔 그린다. 체력 단계는 몸을 바꾸는 대신 색만 짙게(붉고 어둡게) 올린다.
//   · 자세는 교주 자신의 공격 시계(준비→타격→이어짐→평소)로만 고르고, 한 번 바뀐 자세는 최소 0.18초(게임 시간) 유지한다.
//     피격만으로는 자세를 바꾸지 않는다(흔들림·번쩍임은 엔진 그대로).
//   · 좌우는 그리기 상자의 부호를 그대로 둔다(R444 방향 사슬이 정한 값 — 공격 땐 영웅 쪽).
//  끄기: localStorage['storyworld.r1376.cultConsist']='0'.  점검: window.__STORYWORLD_CULT_CONSIST_R1376__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_CULT_CONSIST_R1376__)return;
const REV='R1376-cult-consist-1',KEY='storyworld.r1376.cultConsist',ID='c104-boss',HOLD=.18;
const POSES=Object.freeze([1,2,3,4].map(i=>'assets/r104/bosses/c104-boss-p'+i+'.webp'));
const PW=548,PH=504;// R104 c104 자세 그림 칸(4장 같은 칸·같은 발 자리)
// 예전 다른 인물 몸 그림: 그림 칸 안의 발 아래 끝(비율)과, v17 자세(p4) 키에 견준 그려진 상자 키 비율(실측)
const OLD=[// [경로, 그림 칸 안 발 아래 끝 비율, v17 자세 칸 키 / 옛 그림 상자 키(헤드리스 실측 calib, 저장 뒤 불러와 v17 기준이 아직 없을 때만 씀)]
 [/cult-v3123\/pride_cyborg_cult_leader\.webp/,414/418,1],
 [/actors-normalized\/[0-9a-f]+_superego_cyborg_cult_leader\.webp/,367/384,.781],
 [/actors-normalized\/[0-9a-f]+_final_pride_cyborg_lord\.webp/,359/384,.781],
 [/actors-normalized\/[0-9a-f]+_black_ritual_cyborg_boss\.webp/,360/384,.737],
 [/actors-normalized\/[0-9a-f]+_pride_hierophant_[a-z]+\.webp/,.94,.985],
];
const TINT=['','saturate(1.12) contrast(1.04)','brightness(.93) saturate(1.28) hue-rotate(-6deg) contrast(1.06)','brightness(.84) saturate(1.45) hue-rotate(-11deg) contrast(1.12)'];
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={calib:{},draws:0,swapped:0,replacedOld:0,held:0,poseChanges:0,tinted:0,noImage:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:performance.now()/1e3;
const pathOf=new WeakMap(),poseImg=new Map();// 그림 객체 → 경로(readyImage 로 받은 것) · v17 자세 그림 객체 → 번호
const kindOf=p=>{if(typeof p!=='string')return null;const s=p.replace(/^\.\//,'');const i=POSES.indexOf(s);if(i>=0)return {pose:i};for(let j=0;j<OLD.length;j++){const [re,foot,k]=OLD[j];if(re.test(s))return {old:j,foot,k};}return null;};
function img(path){try{const r=readyImage(path);const im=r&&r.image?r.image:null;if(im&&typeof im==='object'){const i=POSES.indexOf(path);if(i>=0)poseImg.set(im,i);}return im;}catch(_){return null;}}
// 교주 자신의 공격 시계로 고른 자세(R104 actionPose 와 같은 구간): 0 준비·1 타격·2 이어짐·3 평소
function want(e){const t=T(),a=e.attack;
 if(a&&Number.isFinite(a.elapsed)){const sh=a.shape154||e.combatProfile?.attackShape,w=a.castWindup150??sh?.windup??.4,ac=sh?.active??.16;return a.elapsed<w?0:a.elapsed<w+ac?1:a.elapsed<w+ac+.12?2:3;}
 const c=e.r61Action;if(c&&!c.cancelled&&t<c.endAt&&Number.isFinite(c.releaseAt))return t<c.releaseAt?0:t<c.releaseAt+.14?1:t<c.releaseAt+.29?2:3;
 if(e.storyAttackState5&&t<e.storyAttackUntil5)return t<e.storyAttackStart5?0:t<e.storyAttackUntil5-.12?1:2;
 if(e.rangedWindup>0)return 0;return 3;}
const hold=new WeakMap();
function poseFor(e){const t=T(),w=want(e);let s=hold.get(e);if(!s){s={pose:w,since:t};hold.set(e,s);return w;}
 if(w!==s.pose){if(t-s.since>=HOLD||t<s.since){s.pose=w;s.since=t;stats.poseChanges++;}else stats.held++;}return s.pose;}
function stage(e){if(!(e.maxHp>0)||!Number.isFinite(e.hp))return 0;const r=e.hp/e.maxHp;return r>.76?0:r>.5?1:r>.25?2:3;}
const isCult=e=>!!(e&&e.nativeId===ID&&e.hp>0);
let ref=new WeakMap();// 개체별 마지막 v17 자세 그리기 배율(화면 픽셀 / 그림 픽셀)
function install(){
 if(typeof readyImage!=='function'||typeof drawEnemy!=='function')return false;
 if(!readyImage.__r1376){const rb=readyImage;const w=function(p,...a){const row=rb.call(this,p,...a);try{if(row&&row.image&&typeof row.image==='object'&&!poseImg.has(row.image)&&kindOf(p)?.old!==undefined)pathOf.set(row.image,String(p).replace(/^\.\//,''));}catch(_){}return row;};w.__r1376=true;readyImage=w;}
 if(drawEnemy.__r1376)return true;
 const base=drawEnemy;
 const d=function(e,...a){
  if(!on||!isCult(e)||typeof ctx==='undefined'||!ctx||typeof ctx.drawImage!=='function')return base.call(this,e,...a);
  stats.draws++;let pose=3,st=0;try{pose=poseFor(e);st=stage(e);}catch(err){fail(err);}
  const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage'),od=c.drawImage;
  c.drawImage=function(im,...q){
   try{const pi=im&&typeof im==='object'?poseImg.get(im):undefined,p=pi===undefined&&im&&typeof im==='object'?pathOf.get(im):null,k=pi!==undefined?{pose:pi}:p?kindOf(p):null;
    if(k&&(q.length===4||q.length===8)){const to=img(POSES[pose]);
     if(!to){stats.noImage++;return od.call(this,im,...q);}
     let [dx,dy,dw,dh]=q.length===8?q.slice(4):q;
     if(!Number.isFinite(dx+dy+dw+dh)||dh===0)return od.call(this,im,...q);
     let sc;
     if(k.pose!==undefined){sc=Math.abs(dh)/(q.length===8?Math.max(1,q[3]):PH);ref.set(e,sc);}
     else{stats.replacedOld++;const foot=dy+dh*k.foot,cx=dx+dw/2,r0=ref.get(e);if(r0){const cal=stats.calib[k.old]||(stats.calib[k.old]={n:0,sum:0});cal.n++;cal.sum+=r0*PH/Math.abs(dh);}sc=r0||Math.abs(dh)/PH*(k.k||1);const nw=PW*sc*(dw<0?-1:1);dx=cx-nw/2;dw=nw;dh=PH*sc;dy=foot-dh;}
     if(k.pose!==undefined&&q.length===8){// 자세 그림끼리는 칸·발이 같으니 상자는 그대로, 그림만 바꾼다
      [dx,dy,dw,dh]=q.slice(4);}
     stats.swapped++;
     const tint=TINT[st]||'';
     if(tint){const f0=c.filter;try{c.filter=(f0&&f0!=='none'?f0+' ':'')+tint;stats.tinted++;return od.call(this,to,0,0,PW,PH,dx,dy,dw,dh);}finally{c.filter=f0;}}
     return od.call(this,to,0,0,PW,PH,dx,dy,dw,dh);}
   }catch(err){fail(err);}
   return od.call(this,im,...q);};
  try{for(const p of POSES)img(p);return base.call(this,e,...a);}
  finally{if(own)c.drawImage=od;else delete c.drawImage;}
 };
 d.__r1376=true;drawEnemy=d;return true;}
let installed=false;try{installed=install();}catch(e){fail(e);}
if(!installed)setTimeout(()=>{try{installed=install();}catch(e){fail(e);}},300);
function set(v){if(v&&typeof v==='object'&&typeof v.on==='boolean')on=v.on;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return {on};}
window.__STORYWORLD_CULT_CONSIST_R1376__=Object.freeze({revision:REV,POSES,set,forgetScale:()=>{ref=new WeakMap();return true;},// 검사용: 저장 뒤 불러온 것처럼 v17 기준 배율을 잊는다

 inspect:()=>({revision:REV,on,installed,stats:{...stats,calib:Object.fromEntries(Object.entries(stats.calib).map(([k,v])=>[k,+(v.sum/v.n).toFixed(3)]))},lastError,presentationOnly:true,gameplayChanged:false})});
})();
