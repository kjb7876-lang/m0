// R191 — 시대에 맞는 몹·조형물(사용자 2026-11-01 "서사에 맞게 기계로봇 구역은 거기에 맞는 자산, 학교는 학교에 맞게, 중세는 중세 그 시대상에 맞게 몹과 조형물이 배치되도록").
//  56개 이야기 지역 조사(R191): R74 가 지도마다 덧붙이는 순찰 몹·가구가 '실내냐 실외냐'로만 골라져서, 기계·전쟁관리자 구역(u2xx·cult·kair08)과
//  현대 도시·호텔 구역(murder·ep1b·ep1a10)에도 중세 숲의 '뿌리 추적자'·그루터기·고사리·잣나무가 섞였고, 지역 장식에서도 이끼 바위·죽은 나무·
//  쇠창살 성문이 기계 구역에 나왔다.
//  · 구역을 지도 양식(worldR74.style)으로 기계 / 현대 / 중세·판타지로 나눈다(지역 이름·서사는 그대로, 새 지역·보스를 만들지 않음).
//  · 기계: R74 순찰 몹 → '태엽 수집자'(clock), 가구 → 작업대·상자·오벨리스크. 현대: 순찰 몹 → '유리 망령'(glass), 가구 → 캐비닛·빈 침대·조각상(실외는 상자·캐비닛·조각상).
//  · 기계·현대 구역에서는 시대에 안 맞는 지역 장식(이끼 바위·죽은 나무·살아 있는 나무·쇠창살 성문)을 그리지 않는다(자료·위치·충돌은 그대로, 그림만 생략).
//  · 중세·판타지 구역과 병원(R81 제외 지도)은 건드리지 않는다. 몹 체력·공격·판정은 그대로(겉모습·이름만). storyworld.r191.era {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_ERA_R191__)return;
const REV='R191-era-1',KEY='storyworld.r191.era';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={rooms:0,patrols:0,furniture:0,hidden:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const TECH=/neural|machine|controller|memory-gate|memory-room|first-memory|cruel-salvation|organic|judgment|throne|harvest|snow-neural|neuron|forge/;
const MODERN=/clinic|hotel|house|mirror-house|kitchen|stage|vault|villa|rooftop|rain-crosswalk|patient-addiction-city|cathedral/;
function eraOf(r){const L=r?.exploration,s=String(L?.worldR74?.style||L?.backgroundTheme||'');if(!s||L?.r81Excluded)return null;if(TECH.test(s))return'tech';if(MODERN.test(s))return'modern';return null;}
const PATROL={tech:['clock','태엽 수집자'],modern:['glass','유리 망령']};
const FURN={tech:['workbench','crate','obelisk'],modern:['cabinet','empty-bed','statue'],modernOut:['crate','cabinet','statue']};
const NATURE=/moss_boulders|dead_tree|tree-dead|tree-living|ash-tree|pine|stump|ferns|broken_gate|dist0\d-waterweed/;
const done=new WeakSet();
function apply(r){if(!prefs.on||!r||done.has(r))return;const era=eraOf(r);done.add(r);if(!era)return;stats.rooms++;const outdoor=r.exploration?.worldR74?.mode==='outdoor';
 const [style,name]=PATROL[era];
 for(const e of r.enemies||[]){if(!e||!/:r74-patrol:/.test(String(e.id||''))||e.r74Monster===style)continue;e.r191From=e.r74Monster;e.r74Monster=style;e.name=name;stats.patrols++;}
 const list=era==='modern'&&outdoor?FURN.modernOut:FURN[era];let i=0;
 for(const p of r.props||[]){if(!p)continue;
  if(p.r74Prop&&/^(ash-tree|pine|stump|ferns|cabinet|empty-bed|statue|workbench|crate|obelisk)$/.test(p.r74Prop)&&!list.includes(p.r74Prop)){p.r191From=p.r74Prop;p.r74Prop=list[i++%list.length];stats.furniture++;continue;}
  const k=String(p.key||'')+' '+String(p.path||'');if(!p.r74Door&&!p.r81WardDoor&&p.solid!==true&&NATURE.test(k)){p.r191Hide=true;stats.hidden++;}}}
try{if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(...a){const r=base.apply(this,a);try{apply(r);}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
(function poll(){try{if(typeof room!=='undefined'&&room)apply(room);}catch(e){fail(e);}setTimeout(poll,700);})();
try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(prefs.on&&p?.r191Hide)return;return base.apply(this,[p,...a]);};}}catch(e){fail(e);}
function set(o){prefs={...prefs,...o};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_ERA_R191__=Object.freeze({revision:REV,set,eraOf,apply,TECH,MODERN,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},era:typeof room!=='undefined'?eraOf(room):null,lastError})});
})();
// R443 — R74 순찰 '재 나방'(ash, 지도 그림 4칸: 접은 날개·날개 든 준비·펼친 공격·접은 회복)이 걷거나 쫓을 때 날갯짓하며 움직이게
//  (사용자 2026-11-09 "몹 날개짓하는 모션있는데 이동시 날갯짓하면서 이동하도록").
//  · 원래는 공격하지 않을 때 늘 'idle'(날개 접은) 한 칸만 그려서, 날개를 퍼덕이는 그림은 공격 때만 보였다.
//  · 움직이는 동안(엔진 e.moving, 또는 0.2초 안에 자리가 바뀜)만 그 몹의 기존 칸 [접음 → 듦 → 접음(회복) → 듦] 을 초당 9칸으로 돈다.
//    공격 칸(펼쳐 할퀴기·가루)은 쓰지 않는다. 새 그림·칸 수 변경 없음. 공격·맞음·죽음·서 있음은 그대로. 판정·수치도 그대로(그림만).
//  · 날개 없는 순찰 양식(root·clock·glass)은 건드리지 않는다. 끄기: localStorage['storyworld.r443.flap']='{"on":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_FLAP_R443__)return;
const REV='R443-flap-1',KEY='storyworld.r443.flap',FPS=9,FLAP=Object.freeze({ash:Object.freeze(['idle','windup','recover','windup'])});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={flaps:0,installs:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0,seen=new WeakMap();
function moving(e){if(e.moving)return true;const t=T();let s=seen.get(e);if(!s){seen.set(e,{x:e.x,y:e.y,at:-9});return false;}
 if(Math.hypot(e.x-s.x,e.y-s.y)>.004){s.x=e.x;s.y=e.y;s.at=t;}return t-s.at<.2;}
function flapPhase(e){const seq=FLAP[e?.r74Monster];if(!prefs.on||!seq||!(e.hp>0)||e.spawnState==='dead'||e.attack||e.rangedWindup>0||e.hitTimer>0||!moving(e))return null;
 const seed=typeof e.id==='string'?e.id.length*.37:0;return seq[Math.floor(T()*FPS+seed)%seq.length];}
function install(){const A=window.__STORYWORLD_PHASE1_ART__,W=window.__STORYWORLD_WORLD_R74__;if(!A||typeof A.enemy!=='function'||typeof W?.atlasFrame!=='function')return false;if(A.__r443)return true;
 const base=A.enemy;window.__STORYWORLD_PHASE1_ART__=Object.freeze({...A,__r443:true,enemy(e){const r=base.call(this,e);try{if(r&&r.state==='idle'&&e?.r74Monster){const ph=flapPhase(e);
   if(ph&&ph!=='idle'){const f=W.atlasFrame('monsters',e.r74Monster+':'+ph);if(f){stats.flaps++;return {...r,path:f.path,frame:{...f,flip:r.flip,r74Monster:true,r443Flap:ph},r443Flap:ph};}}}}catch(err){fail(err);}return r;}});
 stats.installs++;return true;}
let tries=0;(function arm(){try{if(install())return;}catch(e){fail(e);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
function set(o){prefs={...prefs,...o};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_MOB_FLAP_R443__=Object.freeze({revision:REV,FLAP,FPS,flapPhase,install,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},installed:!!window.__STORYWORLD_PHASE1_ART__?.__r443,lastError})});
})();
