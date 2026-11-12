// R272 조형물 규칙(사용자 2026-11-03 "기념비와 계단은 실제로 쓰이거나 의미 있는 곳에만 — 장식으로 겹친 것은 빼라. 충돌·진행은 그대로").
//  조사(포터블 데이터 488개 지역 조형물): 빈 기념비(blank_memorial, key 'memorial')가 13개 지역 23곳에 '지역 장면 소품' 대체물로 놓였다
//   (예: ep1a09 의 원래 소품은 labelled-vial-cabinet). 정본 서사 어느 지역에도 기념비·추모비 사건이 없다 → 모두 뺀다.
//  무너진 계단(collapsed_stairs, key 'stairs')은 8개 지역 16곳 — R189 가 벽에 붙였지만 대부분 지도 이동 지점과 상관없는 장식이다.
//   → 실제 이동 지점(서사 포탈 R72 next/previous·지역 출구 exitPoint) 3.5칸 안의 계단만 남기고 나머지는 뺀다.
//  둘 다 solid:false 라 충돌·길찾기·진행에 영향이 없다. 석상(archive)·시간 오벨리스크(kairo 시간 주제)는 그대로 둔다.
//  끄기: localStorage['storyworld.r272.props']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_R272__)return;
const REV='R272-props-2-r830',KEY='storyworld.r272.props',NEAR=3.5;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={rooms:0,memorials:0,stairsDropped:0,stairsKept:0,canonDropped:0,canonSwapped:0,detailHidden:0,detailSwapped:0,errors:0};let lastError=null,last=null,lastCanon=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const isMemorial=p=>/(^|\/)blank_memorial\.webp$/.test(String(p?.path||''))||p?.key==='memorial';
const isStairs=p=>/(^|\/)collapsed_stairs\.webp$/.test(String(p?.path||''))||p?.key==='stairs';
// 순수(QA): 남길지
function keep(p,points){if(isMemorial(p))return false;if(isStairs(p))return points.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<=NEAR);return true;}
function transitionPoints(r){const out=[];try{const P=window.__STORYWORLD_ROUTES_R72__?.points?.(r);for(const k of ['next','previous'])if(P?.[k]&&Number.isFinite(P[k].x+P[k].y))out.push(P[k]);}catch(_){}
 try{for(const d of Object.keys(regionById?.[r.id]?.exits||{})){const q=exitPoint(d);if(q&&q.x>0&&q.y>0)out.push(q);}}catch(_){}return out;}
// ---- R830(사용자 2026-11-12 "조형물들 서사 시대상에 맞게"): 그림마다 나올 수 있는 지역을 정한다 ----------------------------
//  · 피분수(corrupted_shrine)·악마화 나무(v290 dead_tree, r299 tree): 1부(에피소드 1a, 약물중독 이야기 — hub·dist00~06·ep1a08~11) 본편의 야외 지도에만.
//  · 피의 육망성 바닥 그림(r299 hexagram): 1부 본편에만(실내 포함). 피의 육망성 조형물(R170 탑)도 1부 본편에만 선다(combat-r170 이 towerOk 를 묻는다).
//  · 하이테크 조형물(은빛 봉인 기둥·감시 콘솔·시간 엔진·기억 코어·신호기·산업 바리케이드·푸른 포탈·시간 오벨리스크): 기계 테마 지역에만
//    (3부 통제자 u201~206·생체 부트로더 ep1b09·8부 사이보그 교주 cult01~06·5부 카이로노미콘 kair01~10·그 쉼터). 다른 지역 야외에서는 무너진 돌기둥으로 바꾸고 실내에서는 뺀다.
//  모두 solid:false 장식이라 충돌·길찾기·진행은 그대로다. 사몽 구역은 기증 지역 id 를 빌려 쓰지만 1부 본편이 아니므로 피 조형물은 서지 않는다.
//  끄기: localStorage['storyworld.r272.props']='{"on":true,"canon":false}'
const PART1=Object.freeze(new Set(['hub','dist00','dist01','dist02','dist03','dist04','dist05','dist06','ep1a08','ep1a09','ep1a09b','ep1a10','ep1a11']));
const MACHINE=/^(u20[1-6]|cult0[1-6]|kair(0[1-9]|10)|ep1b09|restU2|restKairo|restEp1b)$/;
const BLOOD=Object.freeze(new Set(['corrupted_shrine','dead_tree','r299/tree'])),SIGIL='r299/hexagram',STONE='collapsed_pillar';
const TECH=Object.freeze(new Set(['silver_seal_pillar','surveillance_console','chrono_engine','shattered_memory_core','rail_signal','industrial_barricade','ruined_portal','time_obelisk']));
let canon=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.canon===false)canon=false;}catch(_){}
const artName=path=>{const m=/(?:^|\/)(r299\/)?([^\/]+)\.(?:webp|png)$/.exec(String(path||''));return m?(m[1]||'')+m[2]:'';};
// 순수(QA): 그림 이름 + 지역 사정 → true(둔다) · false(뺀다) · 문자열(그 그림으로 바꾼다)
function fit(name,c){const p1=!!c&&PART1.has(c.id)&&!c.samong;
 if(BLOOD.has(name))return p1&&!!c.outdoor;if(name===SIGIL)return p1;
 if(TECH.has(name))return MACHINE.test(String(c?.id||''))?true:(c?.outdoor?STONE:false);return true;}
function ctxOf(r){const L=r?.exploration||{},mode=String(L.worldR74?.mode||'');let indoor=/indoor|cavern/.test(mode);
 if(!indoor)try{indoor=!!window.__STORYWORLD_PROPS_PLACE_R406__?.indoorOf?.(r);}catch(_){}
 return{id:r?.id,samong:!!(r?.samongR103||L.samongR115||L.samongR103||L.samongR105),outdoor:!indoor};}
const fitPath=(path,r)=>!canon?true:fit(artName(path),ctxOf(r));
const towerOk=r=>{if(!canon)return true;const c=ctxOf(r);return c.samong||PART1.has(c.id);};// 사몽의 '세뇌당한 기억의 조각'은 다른 조형물이라 그대로
const bad=(p,c)=>!!p&&typeof p==='object'&&!p.solid&&!p.interactive&&!p.interact&&!/objective/i.test(String(p.id||''))&&(fit(artName(p.path),c)!==true||fit(artName(p.r81NativeSkin?.path),c)!==true);
function canonPass(r){if(!canon)return;const c=ctxOf(r);if(!r.props.some(p=>p!==r.objective&&bad(p,c)))return;let drop=0,swap=0;/* 300ms 마다 다시 본다 — 뒤늦게 붙는 조형물·다시 입힌 스킨도 걸러진다 */
 const goal=r.objective;r.props=r.props.filter(p=>{if(p===goal||!bad(p,c))return true;const skin=p.r81NativeSkin,own=typeof p.path==='string'?p.path:'',sp=typeof skin?.path==='string'?skin.path:'';
  const f=[fit(artName(own),c),fit(artName(sp),c)].find(v=>v!==true);if(f===undefined)return true;if(f===false){drop++;return false;}
  const to=()=>'assets/props/v290/'+f+'.webp';/* 지역별 파생 폴더에는 그 그림이 없을 수 있어 원본 폴더 그림을 쓴다 */if(!p.r830From)p.r830From=sp||own;
  if(fit(artName(own),c)!==true){p.path=to(own);if(Number.isFinite(p.height))p.height=Math.round(p.height*.6);if(p.key)p.key='ancientPillar';}
  if(sp&&fit(artName(sp),c)!==true)p.r81NativeSkin={...skin,path:to(sp)};swap++;return true;});
 stats.canonDropped+=drop;stats.canonSwapped+=swap;if(drop||swap)lastCanon={zone:r.id,outdoor:c.outdoor,samong:c.samong,dropped:drop,swapped:swap};}
function apply(r){if(!on||!r||!Array.isArray(r.props))return;try{canonPass(r);}catch(e){fail(e);}if(r.__r272props)return;try{const pts=transitionPoints(r);const before=r.props.length;let mem=0,sd=0,sk=0;
 r.props=r.props.filter(p=>{const k=keep(p,pts);if(isMemorial(p))mem++;else if(isStairs(p)){if(k)sk++;else sd++;}return k;});
 r.__r272props=true;stats.rooms++;stats.memorials+=mem;stats.stairsDropped+=sd;stats.stairsKept+=sk;last={zone:r.id,before,after:r.props.length,memorials:mem,stairsDropped:sd,stairsKept:sk,points:pts.length};}catch(e){fail(e);}}
// R830: 엔진의 지역 세부 장식(regionalDecoration — room.props 밖 목록, 그릴 때만 붙는다)도 같은 규칙으로. 못 서는 그림은 그리지 않고, 바꿀 그림은 그 한 번만 경로를 바꿔 그린다.
let ctxMemo=null;const ctxNow=()=>{const r=typeof room!=='undefined'?room:null;if(!r)return null;if(!ctxMemo||ctxMemo.r!==r||ctxMemo.L!==r.exploration)ctxMemo={r,L:r.exploration,c:ctxOf(r)};return ctxMemo.c;};
try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){
  if(on&&canon&&p&&p.regionalDecoration&&typeof p.path==='string'){let f=true;try{const c=ctxNow();if(c)f=fit(artName(p.path),c);}catch(e){fail(e);}
   if(f===false){stats.detailHidden++;return;}
   if(f!==true){const to='assets/props/v290/'+f+'.webp';try{if(typeof readyImage==='function'&&!readyImage(to)){if(typeof addImage==='function')addImage(to,'R830 canon');return;}}catch(e){fail(e);}
    const o=p.path;p.path=to;stats.detailSwapped++;try{return base.apply(this,[p,...a]);}finally{p.path=o;}}}
  return base.apply(this,[p,...a]);};}}catch(e){fail(e);}
try{const base=getRoom;getRoom=function(...a){const r=base.apply(this,a);try{if(r&&r.id===zone)setTimeout(()=>apply(r),0);}catch(_){}return r;};}catch(e){fail(e);}
setInterval(()=>{try{if(typeof room!=='undefined'&&room&&!loading)apply(room);}catch(e){fail(e);}},300);
window.__STORYWORLD_PROPS_R272__=Object.freeze({revision:REV,keep,fit,fitPath,towerOk,artName,ctxOf,apply,PART1,TECH,BLOOD,MACHINE,inspect:()=>({revision:REV,on,canon,stats:{...stats},last,lastCanon,lastError,browserVerified:false,GPUVerified:false})});
})();
