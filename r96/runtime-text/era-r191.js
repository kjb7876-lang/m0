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
