// R200 — 사몽 일반 몹 잔영(사용자 2026-11-01 "적당히 서사에 맞게 이미지 보고 이름 부여해서 배치"; 앞서 "꼭두각시 자아는 사몽부터 가끔씩").
//  Drive 시트 01~06(사용자 업로드)에서 따낸 16종(assets/r200/shades, scripts/r200-samong-shades.py)을 사몽 구역 서사에 맞춰 나눈다:
//   S-01 꿰맨 장미의 집: 식탁의 마네킹 잔영·기운 누더기 골렘 / S-02 밤의 출석부: 검은 태양의 학교 순찰자·면도날 종이 아이
//   S-03 흑과 백: 흑백 잔상의 투사·관람석 거울의 잔영·검은 고리의 대련생 / S-04 감정의 탑: 화형식당 앞치마 식객·박수치는 객석의 잔영·불면병동 무안 환자·금박 박제 망자
//   S-05 경성의 밤: 호외 신문의 밀고자 잔영·물감 철로의 유령 승객 / S-06 디스토피아: 두족류 생체기계 침공병·폐선로 태엽 군단병·변이된 사냥개 괴수
//  · 사몽 구역의 일반 몹(보스·중간보스·페르소나·탑·꿰맨 인형 제외) 중 85%는 그 구역 잔영 그림·이름으로, 15%는 꼭두각시 자아로 남긴다(몹 id 해시로 고정).
//    S-06 의 상대 초인·지휘 개체(R184 전용 그림)와 S-07 페르소나 구역은 건드리지 않는다.
//  · 그림만 바꾼다: 엔진 그림 선택 사슬(__STORYWORLD_STORY_COMBAT_R54__.frameFor)에 칸을 내주면 엔진 drawEnemy 가 그린다(체력바·대상 표시·기록기 깊이 그대로).
//    1~5칸 이동(왕복), 6~11칸 공격(공격 진행도), 서 있을 때 1~2칸 느리게. 그림은 오른쪽을 본다 → 영웅 쪽으로 뒤집는다.
//  · 판정·체력·공격·보상·저장은 그대로. storyworld.r200.shades {on:false,puppetShare:.15} 로 조절.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_SHADES_R200__)return;
const REV='R200-shades-1',KEY='storyworld.r200.shades',INDEX='assets/r200/shades/index.json';
let prefs={on:true,puppetShare:.15};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={assigned:0,puppetKept:0,frames:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let idx=null,byZone={};
fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{if(!j?.mobs)return;idx=j;for(const m of j.mobs)(byZone[m.zone]=byZone[m.zone]||[]).push(m);}).catch(fail);
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const major=e=>!!(e&&(e.boss||e.midboss||e.miniBoss||e.persona||e.cosmic||e.trial||e.r170Tower||e.r193Doll||e.samongMidR162||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
function zoneKey(){try{const x=typeof room==='object'?room?.samongR103:null;if(!x)return null;const m=/^sz115-(S0\d)-/.exec(String(x.zone||''));return m?m[1].replace('S0','S-0'):(x.key||null);}catch(_){return null;}}
function assign(e){if(!prefs.on||!idx||!e||e.r200Checked||!e.samongR103||major(e))return e?.r200Shade?byId(e.r200Shade):null;
 const z=zoneKey(),list=byZone[z];e.r200Checked=true;if(!list)return null;
 if(z==='S-06'&&/상대 초인|지휘 (개체|기체)/.test(String(e.name||'')))return null;
 const u=hash(e.id);if(u<prefs.puppetShare){stats.puppetKept++;return null;}
 const m=list[Math.floor(hash(e.id+':shade')*list.length)%list.length];e.r200Shade=m.id;e.r200OrigName=e.name;e.name=m.name;if(e.profile)e.profile.name=m.name;stats.assigned++;return m;}
const byId=id=>idx?.mobs?.find(m=>m.id===id)||null;
const T=()=>typeof time==='number'?time:performance.now()/1000;
function cellFor(e,m){const n=m.move.length;
 if(e.attack&&Number.isFinite(e.attack.elapsed)){const sh=e.attack.shape154||e.combatProfile?.attackShape||{},tot=Math.max(.2,(e.attack.castWindup150??sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));const u=Math.min(.999,Math.max(0,e.attack.elapsed/tot));return m.attack[Math.floor(u*m.attack.length)];}
 if(e.rangedWindup>0)return m.attack[Math.floor(T()*6)%3];
 if(!(e.hp>0)||e.hitTimer>0)return m.move[0];
 if(e.moving){const seq=[0,1,2,3,4,3,2,1],k=Math.floor(T()*9+hash(e.id)*8)%seq.length;return m.move[Math.min(n-1,seq[k])];}
 return m.move[Math.floor(T()*1.6+hash(e.id)*2)%2];}
function frameOf(e,m){const [cw,ch]=m.cell,[px,py]=m.pivot,vh=m.visibleHeight||150,k=cellFor(e,m);
 return {path:m.path,assetFrame:{sourceRect:[k*cw,0,cw,ch],pivot:[px,py],visibleHeight:vh},sourceAlphaCore:[k*cw,0,cw,ch],metricThreshold:16,sourcePixelsEdited:false,
  normalizedFullRectangleExtents:[-px/vh,-py/vh,(cw-px)/vh,(ch-py)/vh],r200Shade:m.id,flip:!!(typeof player!=='undefined'&&player&&(player.x-player.y)<(e.x-e.y))};}
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r200)return true;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r200:true,frameFor(e,f){try{const m=prefs.on?assign(e):null;if(m){
   if(typeof readyImage==='function'&&!readyImage(m.path)&&typeof ensureImages==='function')Promise.resolve(ensureImages([m.path])).catch(()=>{});
   stats.frames++;return frameOf(e,m);}}catch(err){fail(err);}return S.frameFor(e,f);}});return true;}
let tries=0;(function arm(){let ok=false;try{ok=install();}catch(e){fail(e);}if(!ok&&++tries<80)setTimeout(arm,250);})();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SAMONG_SHADES_R200__=Object.freeze({revision:REV,set,assign,zoneKey,inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!idx,zones:Object.fromEntries(Object.entries(byZone).map(([k,v])=>[k,v.map(m=>m.name)])),stats:{...stats},lastError})});
})();
