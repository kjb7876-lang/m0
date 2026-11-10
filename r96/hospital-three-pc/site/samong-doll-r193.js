// R193 — 봉합부인 구역(S-01)의 꿰맨 인형을 원거리 몹으로(사용자 2026-11-01 "봉합부인 나오는 쪽 얼굴 애기 인형 같은 거 얘도 몹으로 사용해 봐 — 원거리 몹").
//  · S-01 사몽 구역에 바닥 장식으로만 놓이던 'doll'(R123) 자리마다 꿰맨 아기 인형 원거리 몹을 하나씩 세운다(구역당 최대 3).
//    그 방의 일반 몹 하나를 본떠(JSON 복제) 원거리 성질(type·ai·weapon=ranged, 선호 거리 5.2 — 엔진 원거리 몹과 같은 값)만 바꾸고,
//    체력은 본뜬 몹의 80%. 그림은 드라이브 원본 자산 assets/r105/drive/prop-doll.webp(삼베 인형, 기존 적용 자산 재사용)를 엔진 frameFor 사슬로 내준다(R197).
//  · 장식 인형은 그 자리에서 몹이 되므로 장식 목록에서 뺀다. 보스·코어·목표 수치·다른 몹은 그대로. storyworld.r193.doll {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_DOLL_R193__)return;
const REV='R193-doll-2',KEY='storyworld.r193.doll',ART='assets/r105/drive/prop-doll.webp',NAME='꿰맨 아기 인형',MAX=3;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={rooms:0,spawned:0,draws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const done=new WeakSet();
const isS01=r=>/^sz115-S01-/.test(String(r?.samongR103?.zone||''));
function make(r){if(!prefs.on||!r||done.has(r)||!isS01(r)||!Array.isArray(r.props)||!Array.isArray(r.enemies))return;
 const dolls=r.props.filter(p=>p?.r123Deco?.kind==='doll').slice(0,MAX);
 /* R197: 몹이 아직 안 나왔으면(소개 창이 열린 동안 등) 다음 폴링 때 다시 본다 — 성공했거나 인형 장식이 아예 없는 방만 끝냄 */
 const donor=dolls.length&&r.enemies.find(e=>e&&e.hp>0&&!e.boss&&!e.miniBoss&&e.spawnState!=='dead'&&!e.r193Doll&&e.combatProfile);if(dolls.length&&!donor)return;done.add(r);if(!dolls.length)return;stats.rooms++;
 for(const [i,d] of dolls.entries()){let e;try{e=JSON.parse(JSON.stringify(donor));}catch(err){fail(err);continue;}
  const hp=Math.max(1,Math.round((donor.maxHp||donor.hp)*.8));
  Object.assign(e,{id:String(donor.id).split(':').slice(0,2).join(':')+':r193-doll:'+i,name:NAME,x:d.x,y:d.y,homeX:d.x,homeY:d.y,hp,maxHp:hp,type:'ranged',ai:'ranged',weapon:'ranged',roleSix:'ranged',
   r193Doll:true,deadRecorded:false,deadAt:undefined,spawnState:'active',attack:null,nav:[],flash:0});
  if(e.combatProfile)e.combatProfile.preferredRange=5.2;if(e.profile){e.profile.ai='ranged';e.profile.weapon='ranged';e.profile.name=NAME;if(e.profile.combatProfile)e.profile.combatProfile.preferredRange=5.2;}
  for(const k of Object.keys(e))if(/^rc146|^rc150|r109|r92Mob/.test(k))delete e[k];
  r.enemies.push(e);stats.spawned++;}
 for(const d of dolls){const k=r.props.indexOf(d);if(k>=0)r.props.splice(k,1);}}
(function poll(){try{if(typeof room!=='undefined'&&room&&room.samongR103)make(room);}catch(e){fail(e);}setTimeout(poll,600);})();
/* R197: 몸 그림만 바꾼다 — 엔진이 그림을 고르는 frameFor 사슬에 인형 그림을 내주면 엔진 drawEnemy 가 그대로 그린다
   (three 기록기 범위·깊이, 체력바, 대상 표시, 쓰러짐 처리 모두 엔진 것). 원래 drawEnemy 를 통째로 바꾸던 방식은 이 셋을 잃었다. */
const W=259,Hh=384,PX=129.5,PY=382,VH=380;
const FRAME=Object.freeze({path:ART,assetFrame:{sourceRect:[0,0,W,Hh],pivot:[PX,PY],visibleHeight:VH},sourceAlphaCore:[1,2,257,382],metricThreshold:16,sourcePixelsEdited:false,normalizedFullRectangleExtents:[-PX/VH,-PY/VH,(W-PX)/VH,(Hh-PY)/VH],r193Doll:true});
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r193)return true;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r193:true,frameFor(e,f){if(prefs.on&&e?.r193Doll){stats.draws++;
   try{if(typeof readyImage==='function'&&!readyImage(ART)&&typeof ensureImages==='function')Promise.resolve(ensureImages([ART])).catch(()=>{});}catch(_){}
   return {...FRAME,flip:(()=>{const r444=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);return typeof r444==='boolean'?r444:!!(typeof player!=='undefined'&&player&&player.x-player.y<e.x-e.y);})()};}return S.frameFor(e,f);}});return true;}
let tries=0;(function arm(){let ok=false;try{ok=install();}catch(e){fail(e);}if(!ok&&++tries<80)setTimeout(arm,250);})();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SAMONG_DOLL_R193__=Object.freeze({revision:REV,set,make,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
