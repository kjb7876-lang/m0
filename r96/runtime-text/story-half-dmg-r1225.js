// R1225 — 스토리 모드 적 받는 피해 절반(사용자 2026-11-19 10:32Z "스토리모드 모든 몹과 보스들 현재 체력 난이도 상관없이 모든데미지 반감해서 받게해줘").
//  · 스토리 모드(스토리 사몽 세계 = DREAM 층 포함)에서 일반 몹·중간보스·보스·페르소나급이 hitEnemy 로 받는 모든 피해 ×0.5.
//    고정 피해·확률 패시브·최대 체력 비례 피해(예: 페르소나 쌍성 소멸 보스 7% → 3.5%)까지 모두. 체력·난이도와 상관없이 늘.
//  · 일반 몹 '즉사'(남은 체력 이상으로 지우는 효과 — R1144 쌍성 소멸 레이저, R114/R75 사몽선, R139 사몽 궁극기, R425 사몽 십자가)는
//    피해가 아니라 즉사라 그대로 둔다(일반 몹·남은 체력 이상일 때만; 보스급에 들어가는 같은 기술의 계수 피해는 절반).
//  · 사몽 에피소드(R103·R115 방)·무한생존(R600)·영화 모드(R370, R384 서사 맞춤 피해가 따로 있음)는 그대로.
//  · 맨 바깥에서 값만 곱하므로 협동 체력 배수·광폭화(÷1.66)·R179 등 다른 배율과는 곱으로 쌓인다.
//  · localStorage storyworld.r1225.half {on} 로 끈다. 점검 window.__STORYWORLD_STORY_HALF_DMG_R1225__.
// Canonical source; copied to runtime-text by scripts/sync-r99.py.
(()=>{'use strict';
if(window.__STORYWORLD_STORY_HALF_DMG_R1225__)return;
const REV='R1225-story-half-1',KEY='storyworld.r1225.half',FACTOR=.5;
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={halved:0,instakill:0,skipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const INSTAKILL=new Set(['r1144-laser','hero-samong-storm-r114','hero-samong-storm-r75','hero-samong-ultimate-r139','hero-samong-cross-r425']);
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.wardChampionR81));
const episodeRoom=r=>!!(r&&(r.samongR103||r.samongR115||r.exploration?.type==='r103-samong'||r.exploration?.samongR103));
function storyMode(e){
 const r=G(()=>room,null);
 if(!r)return false;
 if(G(()=>window.__STORYWORLD_SURVIVAL_R600__?.active?.()===true,false)||r.survivalR600||e?.survivalR600)return false;
 if(episodeRoom(r))return false;
 if(G(()=>window.__STORYWORLD_SAMONG_R103__?.here?.()===true,false))return false;
 if(G(()=>window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on===true,false))return false;
 return true;}
function scale(e,value,source){
 if(!prefs.on||!e||!(e.hp>0)||!Number.isFinite(value)||value<=0)return value;
 if(!storyMode(e)){stats.skipped++;return value;}
 const kind=source&&typeof source==='object'?String(source.kind||''):'';
 if(INSTAKILL.has(kind)&&!major(e)&&value>=e.hp){stats.instakill++;return value;}
 stats.halved++;return value*FACTOR;}
let wrapped=false;
if(typeof hitEnemy==='function'){const base=hitEnemy;
 const w=function(e,value,source,...a){try{value=scale(e,value,source);}catch(err){fail(err);}return base.call(this,e,value,source,...a);};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}
 w.__r1225=true;try{hitEnemy=w;wrapped=true;}catch(err){fail(err);}}
window.__STORYWORLD_STORY_HALF_DMG_R1225__=Object.freeze({revision:REV,FACTOR,INSTAKILL:[...INSTAKILL],
 set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 prefs:()=>({...prefs}),storyMode:e=>storyMode(e),
 inspect:()=>({revision:REV,wrapped,prefs:{...prefs},stats:{...stats},lastError})});
})();
