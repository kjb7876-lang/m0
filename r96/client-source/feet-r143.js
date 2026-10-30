// R143 — 영웅 발밑 표시(내 위치 타원)를 발 아래 바닥에 깐다.
//  · R63 의 내 위치 타원(#selfFootR63)은 화면 위에 얹힌 DOM 이라 늘 장화 위에 그려졌고, 윗변을 발밑점에 맞춰 타원 전체가 발보다 아래로
//    처져 있었다(영웅이 타원 위에 떠 보였다). 실측: 8명 모두 그림의 발은 발밑점과 1~2px 안에서 맞는다(3D 단독 렌더).
//  · 혼자 하기에서는 DOM 타원을 숨기고, 같은 크기·색의 타원을 영웅 그림 바로 앞(그림자와 같은 바닥 겹)에 발밑점을 가운데로 그린다.
//    장화가 타원 위에 서 보이고, 영웅을 가리지 않는다. 협동 모드(다른 시점)는 R63 그대로 둔다.
//  · 위치·판정·세이브는 그대로다. storyworld.r143.feet {ring:false} 로 끄면 예전 DOM 타원으로 돌아간다.
(()=>{'use strict';
if(window.__STORYWORLD_FEET_R143__)return;
const REV='R143-feet-1',KEY='storyworld.r143.feet';
let prefs={ring:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={rings:0,hidden:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const on=()=>prefs.ring&&solo()&&typeof started!=='undefined'&&started&&typeof player==='object'&&player&&player.hp>0&&!(typeof modal!=='undefined'&&modal);
const marker=()=>document.getElementById('selfFootR63');
// R63 과 같은 크기(18×8px, zoom 1 기준)·색(#c4e3db, .86)·굵기(1.25px).
function ring(){const q=project(player.x,player.y),z=typeof zoom==='number'?zoom:1;
 ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.86;ctx.strokeStyle='#c4e3db';ctx.lineWidth=Math.max(1,1.25*z);
  ctx.beginPath();ctx.ellipse(q.x,q.y,9*z,4*z,0,0,Math.PI*2);ctx.stroke();}finally{ctx.restore();}stats.rings++;}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){try{if(on())ring();}catch(e){fail(e);}return base.apply(this,a);};}
if(typeof draw==='function'){const base=draw;draw=function(...a){const r=base.apply(this,a);try{const m=marker();if(m&&prefs.ring&&solo()&&m.style.display!=='none'){m.style.display='none';stats.hidden++;}}catch(e){fail(e);}return r;};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_FEET_R143__=Object.freeze({revision:REV,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browser:false,GPU:false})});
})();
