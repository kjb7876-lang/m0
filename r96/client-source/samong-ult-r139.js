// R139 — 사몽(각성) 중 '선 이펙트(사몽 폭풍 R75 의 방 가로지르는 선)' 대신 영웅 궁극기 연출과 궁극기 피해.
//  · 사몽이 켜지는 순간과 켜져 있는 동안 1.4초마다 '궁극기 파동': 영웅 궁극기 그림(E568 ultimate)을 영웅 자리에,
//    영웅 R(궁극) 스킬 그림(storySourceSkill)을 맞는 적마다 띄운다.
//  · 피해: 9칸 안의 일반 몹은 즉사(남은 체력 이상), 보스·중간보스·페르소나 급은 궁극기 계수(공격력 × 2.4).
//  · 사몽 폭풍 선은 그리지 않고 그 선 피해도 막는다(같은 사몽에서 피해가 두 번 들어가지 않게).
// 판정 대상·쿨다운·사몽 지속 시간·세이브는 그대로다. 설정 키 storyworld.r139.samong {ult:false} 로 끄면 예전 선 폭풍으로 돌아간다.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_ULT_R139__)return;
const REV='R139-samong-ult-1',KEY='storyworld.r139.samong',RADIUS=9,PERIOD=1.4,BOSS_K=2.4;
let prefs={ult:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={pulses:0,kills:0,majorHits:0,stormHidden:0,stormBlocked:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0;
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.wardChampionR81||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
const safe=()=>{try{return typeof safeRegion==='function'&&safeRegion();}catch(_){return false;}};
const on=()=>prefs.ult&&solo()&&typeof player==='object'&&player&&player.hp>0&&player.samong>0&&!safe();
const liveFoe=e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&e.visible!==false&&room?.enemies?.includes(e);
function ultPath(){try{return typeof E568_HERO_VFX!=='undefined'?E568_HERO_VFX[String(player.hero||'')]?.ultimate:null;}catch(_){return null;}}
function rPath(){try{return window.StoryPhase1?.CURRENT_PUBLIC_HERO_DATA?.heroActions?.[player.hero]?.r||null;}catch(_){return null;}}
function pulse(){const up=ultPath(),rp=rPath(),hero=player.hero;stats.pulses++;
 try{if(up&&typeof fx==='function')fx('e568HeroUltimate',player.x,player.y,{asset:up,heroIdE568:hero,sourceActionE568:'ultimate',sizePxE568:154,life:.78,age:0});}catch(e){fail(e);}
 const foes=(room?.enemies||[]).filter(e=>liveFoe(e)&&Math.hypot(e.x-player.x,e.y-player.y)<=RADIUS).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)).slice(0,40);
 foes.forEach((e,i)=>{const go=()=>{try{if(!liveFoe(e)||!on())return;
   if(rp&&typeof fx==='function')fx('storySourceSkill',e.x,e.y,{asset:rp,life:.4,size:2.2,angle:0,storyWER:true,sourceSlot:'r',sourceHero:hero,stage:'release',r139SamongUlt:true});
   const big=major(e),value=big?(typeof attackPower==='function'?attackPower():1)*BOSS_K:e.hp+Math.max(1,Number(e.maxHp)||0);
   if(typeof hitEnemy==='function'&&hitEnemy(e,value,{kind:'hero-samong-ultimate-r139',friendly:true,ability:'samong',hero,eventId:'r139-ult:'+stats.pulses+':'+e.id})){if(big)stats.majorHits++;else if(!(e.hp>0))stats.kills++;}}catch(err){fail(err);}};
  if(i===0||typeof delay!=='function')go();else delay(Math.min(.5,i*.04),go,'r139-samong-ult');});}
let was=false,next=0;
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const now=on();if(now){if(!was)next=T();if(T()>=next){next=T()+PERIOD;pulse();}}was=now;}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(effect,...a){if(effect?.type==='samongStormR75'&&prefs.ult&&solo()){stats.stormHidden++;return;}return base.apply(this,[effect,...a]);};}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){if(source?.kind==='hero-samong-storm-r75'&&prefs.ult&&solo()){stats.stormBlocked++;return false;}return base.call(this,e,value,source,...a);};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SAMONG_ULT_R139__=Object.freeze({revision:REV,set,pulse:()=>on()&&pulse(),inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},active:on(),lastError,browser:false,GPU:false})});
})();
