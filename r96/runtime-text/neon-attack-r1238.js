// R1238 — 네온 좌우 기본 공격 몸 두께·얼굴 크기 일관성(사용자 2026-11-19 12:01Z "네온공격모션 조금더 일관성있게 특히 얼굴이랑 몸두께감").
//  R437 좌우 공격 시트는 3/4 로 돈 몸·큰 머리라, 옆모습으로 가늘게 그린 서기·걷기(R130) 사이에서 공격할 때만 몸이 두툼하고 얼굴이 커 보였다
//  (R1108 이 키는 맞췄지만 굵기·머리 비율은 그대로). scripts/r1238-neon-attack-slim.py 로 만든 파생본
//  assets/r1238/neon/attack-e.webp(뒷발 기준 가로 .88배, 머리 .88배 — 원본 R437 그림은 그대로 둠)을 같은 칸·발 기준으로 쓴다.
//  창끝 표(tips)도 같은 식으로 옮겨 R425 창끝 기운이 창끝에 붙는다. 새 그림이 아직 안 왔으면 R437 그림 그대로(옛 R143 그림으로 튀지 않게).
//  판정·피해·쿨다운·세이브는 바꾸지 않는다. 끄기: localStorage storyworld.r1238.neonAttack = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_NEON_ATTACK_R1238__)return;
const REV='R1238-neon-attack-1',KEY='storyworld.r1238.neonAttack',PATH='assets/r1238/neon/attack-e.webp';
const TIPS=Object.freeze([[182.5,102.0],[175.5,101.0],[193.1,100.0],[201.0,97.0],[192.2,101.0],[182.5,102.0]].map(Object.freeze));
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swapped:0,waiting:0,tips:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let asked=0;
function ready(){try{const r=typeof readyImage==='function'?readyImage(PATH):null;if(r?.image)return true;const t=Date.now();if(t-asked>1000){asked=t;if(typeof ensureImages==='function')Promise.resolve(ensureImages([PATH])).catch(()=>{});}}catch(e){fail(e);}return false;}
const memo=new WeakMap();
// R437(또는 R1108 이 감싼) attackSheet 가 돌려준 네온 줄에서 그림 경로·창끝만 바꾼다(칸·발·몸 키는 그대로 → R1108 몸 비율도 그대로 적용됨)
function swapRow(h,row){if(!prefs.on||h!=='neon'||!row||!/assets\/r437\/attack\/neon\/attack-e\.webp$/.test(String(row.path||'')))return row;
 if(!ready()){stats.waiting++;return row;}let m=memo.get(row);if(!m){m=Object.freeze({...row,path:PATH,tips:TIPS,r1238:true});memo.set(row,m);}stats.swapped++;return m;}
function tip(path,sr){if(!prefs.on||!path||!sr||!String(path).endsWith(PATH))return null;const i=Math.round(sr[0]/224),t=TIPS[i];if(!t)return null;stats.tips++;return [t[0]/224,t[1]/256];}
function hook(){const api=window.__STORYWORLD_NEON_LAUREN_R437__;if(!api||api.r1238||typeof api.attackSheet!=='function')return false;
 const base=api.attackSheet,baseTip=api.tipFor;
 window.__STORYWORLD_NEON_LAUREN_R437__=Object.freeze({...api,r1238:true,
  attackSheet:(h,sd)=>{const r=base(h,sd);try{return swapRow(h,r);}catch(e){fail(e);return r;}},
  tipFor:(path,sr)=>{try{const t=tip(path,sr);if(t)return t;}catch(e){fail(e);}return typeof baseTip==='function'?baseTip(path,sr):null;}});return true;}
// R1108 은 R437 API 를 2초마다 다시 감싼다(자기 표식이 없으면). 서로 펼쳐 복사하므로 표식(r1108·r1238)이 함께 남는다 — 둘 다 2초마다 확인.
function tick(){try{hook();if(prefs.on&&typeof player==='object'&&player?.hero==='neon')ready();}catch(e){fail(e);}}
if(typeof document==='object'&&document&&document.readyState==='complete')tick();else if(typeof window.addEventListener==='function')window.addEventListener('load',tick);
setInterval(tick,2000);
window.__STORYWORLD_NEON_ATTACK_R1238__=Object.freeze({revision:REV,path:PATH,tips:TIPS,
 setPrefs:v=>{prefs={...prefs,...(v||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 test:Object.freeze({swapRow,tip,hook}),
 inspect:()=>({revision:REV,prefs:{...prefs},hooked:!!window.__STORYWORLD_NEON_LAUREN_R437__?.r1238,...stats,lastError,presentationOnly:true,gameplayChanged:false})});
})();
