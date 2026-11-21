// R1292 EGO(F) 자동 발동 켜고 끄기 — 사용자 2026-11-21 "수동조작에서도 에고(f)자동발동 설정에서 키고끌수 있게 해주고 기본적으로 자동발동되게해줘".
//  · 켜짐(기본): PC·폰, 수동 조작(반자동 끔)·반자동 모두 — 공명 30 이상 + 8칸 안에 적 + EGO 재사용 끝 + EGO·사몽 각성 중 아님이면 엔진 ego() 를 그대로 부른다.
//    (R1021 폰 기술·EGO 자동과 같은 조건. 영웅별 EGO 연계·손플레이 EGO 겹 보너스는 엔진 ego() 를 거치므로 그대로 탄다.)
//  · 폰에서 R1021 '기술·EGO 자동 발동'이 켜져 있으면 F 는 R1021 이 이미 쏜다 → 이쪽은 쉰다(같은 일을 두 번 하지 않음).
//  · 끄면: 이쪽도 안 쏘고, R1021 의 F 자동도 멈춘다(R1021 이 enabled() 를 본다). 폰 F 단추는 다시 보인다.
//    엔진 안 자동(폰 '자동 스킬' R63·반자동 Space 의 공명 60 EGO)은 tick 안에서 ego() 를 부르므로, 꺼져 있을 때 tick 안에서 온 ego() 만 막는다.
//    F 키·EGO 단추(tick 밖 입력)는 언제나 그대로.
//  · 저장 localStorage['storyworld.r1292.egoAuto'] = '0'(끔) / 그 밖(기본 켜짐). 설정 '전투 화면' 묶음에 한 줄.
(()=>{'use strict';
if(window.__STORYWORLD_EGO_AUTO_R1292__)return;
const REV='R1292-ego-auto-1',KEY='storyworld.r1292.egoAuto',RANGE=8,BEAT=200;
const stats={ticks:0,fired:0,rested:0,rows:0,blocked:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const enabled=()=>G(()=>localStorage.getItem(KEY),null)!=='0';
const mobile=()=>G(()=>!!window.__STORYWORLD_MOBILE_R63__?.isMobile?.(),false);
/* started·loading·modal·storyScene·player 는 게임 스크립트의 최상위 let 이라 window 에 없다 — 이름으로 바로 읽는다 */
const playing=()=>G(()=>!!started&&!loading&&!modal&&!storyScene&&!!player&&player.hp>0,false);
const cinema=()=>G(()=>!!document.body?.classList?.contains('r370Cinema'),false);
// 폰에서 R1021 이 F 를 맡고 있는가
const r1021Handles=()=>G(()=>{const U=window.__STORYWORLD_UI_COMBAT_R1021__;return !!(U&&mobile()&&U.on()&&U.prefs().autoSkills);},false);
const CSS='body.r1021On.r1021Auto.r1292EgoOff #touchActionsR100 button[data-r1021="ego"]{display:inline-block!important}';
function style(){try{if(typeof document==='undefined'||!document.head||document.getElementById('r1292Style'))return;const st=document.createElement('style');st.id='r1292Style';st.textContent=CSS;document.head.appendChild(st);}catch(e){fail(e);}}
function flags(){try{document.body?.classList?.toggle('r1292EgoOff',!enabled());}catch(e){fail(e);}}
function autoTick(){try{stats.ticks++;if(!enabled()||cinema()||!playing())return 0;
 if(r1021Handles()){stats.rested++;return 0;}
 // 공명 30 미만에서 부르면 엔진이 '공명 30 필요' 쪽지를 띄우므로 미리 거른다
 if(!G(()=>player.egoCD<=0&&!(player.ego>0)&&!(player.samong>0)&&player.resonance>=30,false))return 0;
 if(!G(()=>nearestEnemy(RANGE),null)||typeof ego!=='function')return 0;
 ego();if(G(()=>player.ego>0||player.egoCD>0,false)){stats.fired++;return 1;}return 0;}catch(e){fail(e);return 0;}}
function set(v){try{localStorage.setItem(KEY,v?'1':'0');}catch(_){}flags();const b=typeof document!=='undefined'&&document.getElementById?.('egoAutoR1292Toggle');if(b&&b.checked!==enabled())b.checked=enabled();return enabled();}
// 설정 창 한 줄 — R1022·R1033 과 같은 꼴(div.r1021-row > label > checkbox + 설명), '전투 화면' 묶음 안
function row(){try{const d=typeof document!=='undefined'?document:null;if(!d||!d.getElementById)return false;
 const host=d.getElementById('combatScreenR1021')||d.getElementById('quickSettingsR114');if(!host)return false;
 let r=d.getElementById('egoAutoR1292');
 if(!r){r=d.createElement('div');r.id='egoAutoR1292';r.className='r1021-row';
  const lab=d.createElement('label'),box=d.createElement('input');box.type='checkbox';box.id='egoAutoR1292Toggle';box.onchange=()=>set(!!box.checked);
  lab.appendChild(box);lab.appendChild(d.createTextNode(' EGO(F) 자동 발동'));
  const p=d.createElement('p');p.className='small muted';p.textContent='수동 조작에서도 공명 30이 차고 가까이 적이 있으면 F 를 저절로 씁니다. 끄면 반자동·자동 스킬도 F 는 쓰지 않고 F 키(폰은 EGO 단추)로만. 기본은 켬.';
  r.appendChild(lab);r.appendChild(p);stats.rows++;}
 if(r.parentNode!==host)host.appendChild(r);
 const box=d.getElementById('egoAutoR1292Toggle');if(box&&box.checked!==enabled())box.checked=enabled();
 return true;}catch(e){fail(e);return false;}}
// 꺼짐일 때 엔진 안 자동 F 막기: 바깥 tick 이 도는 동안(깊이>0) 부른 ego() 는 자동으로 본다
let depth=0;
function wrapEngine(){try{
 if(typeof tick==='function'&&!tick.r1292){const base=tick;const w=function(...a){depth++;try{return base.apply(this,a);}finally{depth--;}};for(const k of Object.keys(base))if(/^_*r\d+/i.test(k))try{w[k]=base[k];}catch(_){}w.r1292=true;tick=w;}
 if(typeof ego==='function'&&!ego.r1292){const base=ego;const w=function(...a){if(depth>0&&!enabled()){stats.blocked++;return;}return base.apply(this,a);};for(const k of Object.keys(base))if(/^_*r\d+/i.test(k))try{w[k]=base[k];}catch(_){}w.r1292=true;ego=w;}
}catch(e){fail(e);}}
wrapEngine();
const later=(f,ms)=>{try{setTimeout(()=>{try{f();}catch(e){fail(e);}},ms);}catch(e){fail(e);}};
if(typeof document!=='undefined'&&document.head){style();flags();
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{row();later(row,0);later(row,120);later(row,450);}catch(e){fail(e);}return r;};}
 try{setInterval(autoTick,BEAT);}catch(e){fail(e);}}
window.__STORYWORLD_EGO_AUTO_R1292__=Object.freeze({revision:REV,KEY,RANGE,CSS,enabled,set,autoTick,row,
 inspect:()=>({revision:REV,on:enabled(),mobile:mobile(),r1021Handles:r1021Handles(),stats:{...stats},lastError})});
})();
