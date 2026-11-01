// R193 — 봉합부인 구역(S-01)의 꿰맨 인형을 원거리 몹으로(사용자 2026-11-01 "봉합부인 나오는 쪽 얼굴 애기 인형 같은 거 얘도 몹으로 사용해 봐 — 원거리 몹").
//  · S-01 사몽 구역에 바닥 장식으로만 놓이던 'doll'(R123) 자리마다 꿰맨 아기 인형 원거리 몹을 하나씩 세운다(구역당 최대 3).
//    그 방의 일반 몹 하나를 본떠(JSON 복제) 원거리 성질(type·ai·weapon=ranged, 선호 거리 5.2 — 엔진 원거리 몹과 같은 값)만 바꾸고,
//    체력은 본뜬 몹의 80%. 그림은 드라이브 원본 자산 assets/r105/drive/prop-doll.webp(삼베 인형, 기존 적용 자산 재사용)를 몸 키에 맞춰 세운다.
//  · 장식 인형은 그 자리에서 몹이 되므로 장식 목록에서 뺀다. 보스·코어·목표 수치·다른 몹은 그대로. storyworld.r193.doll {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_DOLL_R193__)return;
const REV='R193-doll-1',KEY='storyworld.r193.doll',ART='assets/r105/drive/prop-doll.webp',NAME='꿰맨 아기 인형',MAX=3;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={rooms:0,spawned:0,draws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const done=new WeakSet();
const isS01=r=>/^sz115-S01-/.test(String(r?.samongR103?.zone||''));
function make(r){if(!prefs.on||!r||done.has(r)||!isS01(r)||!Array.isArray(r.props)||!Array.isArray(r.enemies))return;
 const dolls=r.props.filter(p=>p?.r123Deco?.kind==='doll').slice(0,MAX);done.add(r);if(!dolls.length)return;
 const donor=r.enemies.find(e=>e&&e.hp>0&&!e.boss&&!e.miniBoss&&e.spawnState!=='dead'&&!e.r193Doll&&e.combatProfile);if(!donor)return;stats.rooms++;
 for(const [i,d] of dolls.entries()){let e;try{e=JSON.parse(JSON.stringify(donor));}catch(err){fail(err);continue;}
  const hp=Math.max(1,Math.round((donor.maxHp||donor.hp)*.8));
  Object.assign(e,{id:String(donor.id).split(':').slice(0,2).join(':')+':r193-doll:'+i,name:NAME,x:d.x,y:d.y,homeX:d.x,homeY:d.y,hp,maxHp:hp,type:'ranged',ai:'ranged',weapon:'ranged',roleSix:'ranged',
   r193Doll:true,deadRecorded:false,deadAt:undefined,spawnState:'active',attack:null,nav:[],flash:0});
  if(e.combatProfile)e.combatProfile.preferredRange=5.2;if(e.profile){e.profile.ai='ranged';e.profile.weapon='ranged';e.profile.name=NAME;if(e.profile.combatProfile)e.profile.combatProfile.preferredRange=5.2;}
  for(const k of Object.keys(e))if(/^rc146|^rc150|r109|r92Mob/.test(k))delete e[k];
  r.enemies.push(e);stats.spawned++;}
 for(const d of dolls){const k=r.props.indexOf(d);if(k>=0)r.props.splice(k,1);}}
(function poll(){try{if(typeof room!=='undefined'&&room&&room.samongR103)make(room);}catch(e){fail(e);}setTimeout(poll,600);})();
try{if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(!e?.r193Doll||!prefs.on)return base.apply(this,[e,...a]);
  try{const dead=e.hp<=0,age=dead?(typeof time==='number'?time:0)-(e.deadAt||0):0;if(dead&&age>.8)return;
   const q=project(e.x,e.y),h=(typeof actorHeight==='function'?actorHeight():60)*1.15,bob=Math.sin((typeof time==='number'?time:0)*2.1+e.x)*h*.02,alpha=dead?Math.max(0,1-age/.8):1;
   const filter=e.flash>0?'brightness(1.6)':(e.attack||e.rangedWindup>0)?'saturate(1.3) brightness(1.15)':'none';
   if(typeof readyImage==='function'&&!readyImage(ART)&&typeof ensureImages==='function')Promise.resolve(ensureImages([ART])).catch(()=>{});
   sprite(ART,q.x,q.y+bob,h,{alpha,flip:player&&player.x-player.y<e.x-e.y,filter});stats.draws++;}catch(err){fail(err);return base.apply(this,[e,...a]);}};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SAMONG_DOLL_R193__=Object.freeze({revision:REV,set,make,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
