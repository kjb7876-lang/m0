/* R1049 효과음 대규칙·크게 엇나간 소리 고침·빈칸 3종 (사용자 2026-11-15 09:00Z "진행", 09:01Z "대규칙 너가 게임에 맞게 세우고 효과음 조사해서
 * 크게 엇나가는것들은 재생성하던가 무료효과음개선적용해줘").
 * 대규칙: docs/sound-rules.md (수치는 r96/qa/r1049/sound-rules.json). 전수 대조: scripts/audit-sfx-r1049.py — 게임 재생 사슬(R545 고역통과·쾌적 계층
 * 저역통과·길이 상한)을 흉내 낸 뒤 1,232줄을 재고, 쓰이는 1,187줄 중 큰 위반 55파일(끝 '띡' 22·2~5kHz 찌름 23·만화 소리 9·쿵 3·본체 잘림 1, 겹침 있음)을 찾았다.
 *  1) 그 55파일은 scripts/build-sfx-r1049.py 가 원본(또는 R1026 파생본)에서 무료로 고친 파생본(assets/r1049/sfx)으로 경로만 바꿔 끼운다. 원본 파일은 그대로.
 *  2) 빈칸 3종(plinkfx CC0 를 어둡게 가공): 발걸음(탐색 중·7칸 안에 적 없을 때·보폭 1.9마다), 저체력 심장(체력 30% 아래 1초, 15% 아래 .7초 간격),
 *     레벨업(레벨이 1~3 오를 때 지역 완료음 뒤 .9초). R993 범주표에 발걸음 low·경고 mid·레벨업 UI 로 들어가 붐빌 때는 발걸음부터 빠진다.
 * 끄기: localStorage storyworld.r1049.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_RULES_R1049__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r1049.sfx')!=='0';}catch(_){}
 const REV='R1049-sfx-rules-1';
 const TABLE=/*REMAP*/{"assets/r1026/sfx/r955-die-meadowslime-1.ogg": "assets/r1049/sfx/r955-die-meadowslime-1.ogg", "assets/r1026/sfx/r955-die-meadowslime-2.ogg": "assets/r1049/sfx/r955-die-meadowslime-2.ogg", "assets/r1026/sfx/r955-die-meadowslime-3.ogg": "assets/r1049/sfx/r955-die-meadowslime-3.ogg", "assets/r1026/sfx/r955-die-silverscout-3.ogg": "assets/r1049/sfx/r955-die-silverscout-3-L1.ogg", "assets/r541/sfx/death-1.ogg": "assets/r1049/sfx/r541-death-1.ogg", "assets/r541/sfx/death-2.ogg": "assets/r1049/sfx/r541-death-2.ogg", "assets/r542/sfx/crush-1.ogg": "assets/r1049/sfx/r542-crush-1.ogg", "assets/r761/sfx/bmg-sleep-1.ogg": "assets/r1049/sfx/r761-bmg-sleep-1.ogg", "assets/r785/sfx/hit-seoha-4.ogg": "assets/r1049/sfx/r785-hit-seoha-4.ogg", "assets/r788/sfx/die-root-1.ogg": "assets/r1049/sfx/r788-die-root-1.ogg", "assets/r788/sfx/hit-leviathan-2.ogg": "assets/r1049/sfx/r788-hit-leviathan-2.ogg", "assets/r789/sfx/atk-bootcore-2.ogg": "assets/r1049/sfx/r789-atk-bootcore-2.ogg", "assets/r789/sfx/atk-thornwarden-2.ogg": "assets/r1049/sfx/r789-atk-thornwarden-2.ogg", "assets/r789/sfx/die-bloodpursuer-2.ogg": "assets/r1049/sfx/r789-die-bloodpursuer-2.ogg", "assets/r789/sfx/die-bootcore-1.ogg": "assets/r1049/sfx/r789-die-bootcore-1.ogg", "assets/r789/sfx/die-crackmirror-1.ogg": "assets/r1049/sfx/r789-die-crackmirror-1.ogg", "assets/r789/sfx/die-crackmirror-2.ogg": "assets/r1049/sfx/r789-die-crackmirror-2.ogg", "assets/r789/sfx/die-gate72echo-2.ogg": "assets/r1049/sfx/r789-die-gate72echo-2.ogg", "assets/r789/sfx/die-smilemask-1.ogg": "assets/r1049/sfx/r789-die-smilemask-1.ogg", "assets/r955/sfx/atk-brainwave-1.ogg": "assets/r1049/sfx/r955-atk-brainwave-1.ogg", "assets/r955/sfx/atk-brainwave-3.ogg": "assets/r1049/sfx/r955-atk-brainwave-3.ogg", "assets/r955/sfx/atk-crystal-1.ogg": "assets/r1049/sfx/r955-atk-crystal-1-L4.ogg", "assets/r955/sfx/atk-crystal-2.ogg": "assets/r1049/sfx/r955-atk-crystal-2-L4.ogg", "assets/r955/sfx/atk-crystal-3.ogg": "assets/r1049/sfx/r955-atk-crystal-3-L3.ogg", "assets/r955/sfx/atk-foxcoin-1.ogg": "assets/r1049/sfx/r955-atk-foxcoin-1.ogg", "assets/r955/sfx/atk-foxcoin-2.ogg": "assets/r1049/sfx/r955-atk-foxcoin-2.ogg", "assets/r955/sfx/atk-glass-1.ogg": "assets/r1049/sfx/r955-atk-glass-1.ogg", "assets/r955/sfx/atk-glass-3.ogg": "assets/r1049/sfx/r955-atk-glass-3.ogg", "assets/r955/sfx/atk-meadowslime-1.ogg": "assets/r1049/sfx/r955-atk-meadowslime-1.ogg", "assets/r955/sfx/atk-meadowslime-2.ogg": "assets/r1049/sfx/r955-atk-meadowslime-2.ogg", "assets/r955/sfx/atk-meadowslime-3.ogg": "assets/r1049/sfx/r955-atk-meadowslime-3.ogg", "assets/r955/sfx/atk-orderly-2.ogg": "assets/r1049/sfx/r955-atk-orderly-2.ogg", "assets/r955/sfx/atk-serpent-2.ogg": "assets/r1049/sfx/r955-atk-serpent-2.ogg", "assets/r955/sfx/atk-stomach-3.ogg": "assets/r1049/sfx/r955-atk-stomach-3.ogg", "assets/r955/sfx/die-egovessel-2.ogg": "assets/r1049/sfx/r955-die-egovessel-2.ogg", "assets/r955/sfx/die-excision-1.ogg": "assets/r1049/sfx/r955-die-excision-1.ogg", "assets/r955/sfx/die-excision-3.ogg": "assets/r1049/sfx/r955-die-excision-3-L1.ogg", "assets/r955/sfx/die-glass-2.ogg": "assets/r1049/sfx/r955-die-glass-2.ogg", "assets/r955/sfx/die-glass-3.ogg": "assets/r1049/sfx/r955-die-glass-3.ogg", "assets/r955/sfx/die-meadowslime-1.ogg": "assets/r1049/sfx/r955-die-meadowslime-1.ogg", "assets/r955/sfx/die-meadowslime-2.ogg": "assets/r1049/sfx/r955-die-meadowslime-2.ogg", "assets/r955/sfx/die-meadowslime-3.ogg": "assets/r1049/sfx/r955-die-meadowslime-3.ogg", "assets/r955/sfx/die-phantomblade-2.ogg": "assets/r1049/sfx/r955-die-phantomblade-2.ogg", "assets/r955/sfx/die-silverscout-3.ogg": "assets/r1049/sfx/r955-die-silverscout-3-L1.ogg", "assets/r955/sfx/hit-crystal-2.ogg": "assets/r1049/sfx/r955-hit-crystal-2-L1.ogg", "assets/r955/sfx/hit-drone-2.ogg": "assets/r1049/sfx/r955-hit-drone-2.ogg", "assets/r955/sfx/hit-fallenangel-2.ogg": "assets/r1049/sfx/r955-hit-fallenangel-2.ogg", "assets/r955/sfx/hit-glass-1.ogg": "assets/r1049/sfx/r955-hit-glass-1.ogg", "assets/r955/sfx/hit-meadowslime-1.ogg": "assets/r1049/sfx/r955-hit-meadowslime-1.ogg", "assets/r955/sfx/hit-meadowslime-2.ogg": "assets/r1049/sfx/r955-hit-meadowslime-2.ogg", "assets/r955/sfx/hit-meadowslime-3.ogg": "assets/r1049/sfx/r955-hit-meadowslime-3.ogg", "assets/r955/sfx/hit-phantomblade-1.ogg": "assets/r1049/sfx/r955-hit-phantomblade-1-L1.ogg", "assets/r955/sfx/hit-phantomblade-2.ogg": "assets/r1049/sfx/r955-hit-phantomblade-2.ogg", "assets/r955/sfx/hit-phantomblade-3.ogg": "assets/r1049/sfx/r955-hit-phantomblade-3.ogg", "assets/r955/sfx/hit-polarleg-2.ogg": "assets/r1049/sfx/r955-hit-polarleg-2.ogg", "assets/r955/sfx/hit-sealresidual-1.ogg": "assets/r1049/sfx/r955-hit-sealresidual-1.ogg", "assets/r955/sfx/hit-sealresidual-3.ogg": "assets/r1049/sfx/r955-hit-sealresidual-3.ogg", "audio/rc133/processed/enemy-heavy/Dark_fantasy_demon_e__3-1790999939460_1-8510730a.ogg": "assets/r1049/sfx/audio-rc133-processed-enemy-heavy-Dark_fantasy_demon_e__3-1790999939460_1-8510730a-L1.ogg", "audio/rc133/processed/enemy-roar/demon_roar__4-1790999603479_1-fb23f2a4.ogg": "assets/r1049/sfx/audio-rc133-processed-enemy-roar-demon_roar__4-1790999603479_1-fb23f2a4.ogg"}/*END*/;
 const GAPS=/*GAPS*/{"r1049Step": ["assets/r1049/sfx/step-1.ogg", "assets/r1049/sfx/step-2.ogg", "assets/r1049/sfx/step-3.ogg", "assets/r1049/sfx/step-4.ogg"], "r1049Heart": ["assets/r1049/sfx/heart-1.ogg", "assets/r1049/sfx/heart-2.ogg"], "r1049LevelUp": ["assets/r1049/sfx/levelup-1.ogg", "assets/r1049/sfx/levelup-2.ogg"]}/*END*/;
 const REMAP=(typeof __R1049_TEST_REMAP__!=='undefined'&&__R1049_TEST_REMAP__)||TABLE;
 const GAIN={r1049Step:.35,r1049Heart:.5,r1049LevelUp:.6},ALIAS={r1049Step:'dodge',r1049Heart:'special',r1049LevelUp:'special'};
 const STRIDE=1.9,JUMP=3,NEAR=7,HP_LOW=.30,HP_VERY=.15,BEAT=1.0,BEAT_FAST=.7,LV_DELAY=.9,LV_MAX_JUMP=3;
 const fin=(v,d=0)=>Number.isFinite(v)?v:d;
 const stats={remapped:0,steps:0,beats:0,levelUps:0,skippedNear:0,skippedJump:0,errors:0};
 const g=name=>{try{switch(name){case'sp':return typeof soundProfiles!=='undefined'?soundProfiles:null;case'p':return typeof player!=='undefined'?player:null;
  case'quiet':return (typeof started!=='undefined'&&!started)||(typeof modal!=='undefined'&&!!modal)||(typeof loading!=='undefined'&&!!loading)||(typeof document!=='undefined'&&!!document.hidden);}}catch(_){}return null;};
 function reg(p){try{if(typeof register==='function')register(p,'audio','sfx r1049 '+p);}catch(_){}}
 let keyCount=-1;
 function apply(){const sp=g('sp');if(!on||!sp)return 0;let n=0;try{
   for(const rows of Object.values(sp)){if(!Array.isArray(rows))continue;for(let i=0;i<rows.length;i++){const r=rows[i],to=r&&REMAP[r.path];if(to&&to!==r.path){rows[i]={...r,path:to,key:(r.key||'')+'-r1049',r1049From:r.path};n++;reg(to);}}}
   const gp=(typeof __R1049_TEST_GAPS__!=='undefined'&&__R1049_TEST_GAPS__)||GAPS;
   for(const [kind,files] of Object.entries(gp)){if(!Array.isArray(files)||!files.length)continue;if(!(sp[kind]&&sp[kind].r1049)){const rows=files.map((path,i)=>({key:'r1049-'+kind+'-'+(i+1),path,gain:GAIN[kind]||.5,r541:true}));rows.r1049=true;sp[kind]=rows;for(const r of rows)reg(r.path);}}
   const al=window.__STORYWORLD_SFX_COMFORT__&&window.__STORYWORLD_SFX_COMFORT__.aliases;if(al)for(const [k,v] of Object.entries(ALIAS))if(!al[k])try{al[k]=v;}catch(_){}
   keyCount=Object.keys(sp).length;stats.remapped+=n;}catch(_){stats.errors++;}return n;}
 const play=k=>{try{if(typeof sound==='function'){const r=sound(k);if(r&&typeof r.catch==='function')r.catch(()=>{});}}catch(_){stats.errors++;}};
 // ---- 관찰(0.1초마다). 엔진·영웅 파일은 고치지 않는다.
 let last=null,lastP=null,lastLv=null,acc=0,nextBeat=0,lvAt=null;
 function observe(now){try{if(!on)return;now=fin(now,NaN);if(!Number.isFinite(now))return;
   const sp=g('sp');if(sp&&Object.keys(sp).length!==keyCount)apply();
   const p=g('p');if(!p||typeof p!=='object'){last=null;lastP=null;return;}
   const hp=fin(p.hp,NaN),mx=fin(typeof maxHP==='function'?maxHP():NaN,NaN),quiet=g('quiet');
   // 레벨업: 같은 player 에서 1~3 오를 때만
   const lv=fin(p.level,NaN);
   if(p!==lastP){lastP=p;lastLv=Number.isFinite(lv)?lv:null;lvAt=null;last=null;acc=0;}
   else if(Number.isFinite(lv)){if(lastLv!=null&&lv>lastLv){if(lv-lastLv<=LV_MAX_JUMP)lvAt=now+LV_DELAY;}lastLv=lv;}
   if(lvAt!=null&&now>=lvAt&&!quiet){lvAt=null;stats.levelUps++;play('r1049LevelUp');}
   if(quiet||!(hp>0)){last=null;return;}
   // 저체력 심장
   const ratio=mx>0?hp/mx:NaN;
   if(Number.isFinite(ratio)&&ratio<HP_LOW){if(now>=nextBeat){stats.beats++;play('r1049Heart');nextBeat=now+(ratio<HP_VERY?BEAT_FAST:BEAT);}}else nextBeat=0;
   // 발걸음: 걸은 거리로 센다(순간이동은 빼고), 가까운 적이 있으면 전투 소리에 자리를 양보
   const x=fin(p.x,NaN),y=fin(p.y,NaN);if(!Number.isFinite(x)||!Number.isFinite(y)){last=null;return;}
   if(last&&p.moving){const d=Math.hypot(x-last.x,y-last.y);
    if(d>JUMP){stats.skippedJump++;acc=0;}
    else{let near=false;try{const es=typeof liveEnemies==='function'?liveEnemies():[];if(Array.isArray(es))for(const e of es){if(e&&Math.hypot(fin(e.x,1e9)-x,fin(e.y,1e9)-y)<NEAR){near=true;break;}}}catch(_){}
     if(near){stats.skippedNear++;acc=0;}else{acc+=d;if(acc>=STRIDE){acc-=STRIDE;if(acc>STRIDE)acc=0;stats.steps++;play('r1049Step');}}}}
   else if(!p.moving)acc=Math.min(acc,STRIDE*.5);
   last={x,y};
  }catch(_){stats.errors++;}}
 if(on){
  try{apply();}catch(_){}
  try{if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}}catch(_){}
  try{if(document.readyState==='complete')apply();else window.addEventListener('load',()=>{apply();try{setTimeout(apply,1500);}catch(_){}},{once:true});}catch(_){}
  try{setInterval(()=>{try{observe((typeof performance!=='undefined'?performance.now():Date.now())/1000);}catch(_){}},100);}catch(_){}
 }
 window.__STORYWORLD_SFX_RULES_R1049__=Object.freeze({revision:REV,enabled:()=>on,apply,observe,remap:REMAP,gaps:GAPS,
  inspect:()=>({revision:REV,on,stats:{...stats},remapEntries:Object.keys(REMAP).length,stride:STRIDE,near:NEAR,hpLow:HP_LOW,levelDelay:LV_DELAY,directListeningVerified:false})});
})();
