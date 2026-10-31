// R177 — 사몽 화면 정리(사용자 2026-10-31 "사몽스킬 맨처음에 캐릭터이펙트 나온 걸 전투화면 왼쪽 위 구역에, 아래에 사몽스킬 현재 간략한 스펙,
//  왼쪽 아래 사몽 궁극기 이펙트는 삭제, 그 아래 보호막 표시 하늘색 원 표시도 삭제").
//  · 사몽 각성 그림(#cutin: 영웅 각성 그림 + 死夢覺醒)을 오른쪽 가운데에서 전투 화면 왼쪽 위로 옮기고, 사몽이 켜져 있는 동안 남겨 둔다.
//  · 그 아래에 지금 사몽 스킬의 간략한 수치: 남은 시간 / 지속 · 재사용 · 궁극기 파동(주기·범위·일반 몹 즉사·보스급 배율).
//  · 왼쪽 아래 사몽 아이콘(R160)과 체력 구슬 위 하늘색 보호막 원(R137)은 기본값을 끔(설정에서 다시 켤 수 있음).
//  판정·지속·재사용·피해는 건드리지 않는다. storyworld.r177.samongHud {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_HUD_R177__)return;
const REV='R177-samong-hud-1',KEY='storyworld.r177.samongHud';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={shows:0,updates:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const R=id=>{try{return typeof rank==='function'?Number(rank(id))||0:0;}catch(_){return 0;}};
const duration=()=>7+R('samongTime'),cooldown=()=>77*Math.max(.6,1-.08*R('samongCooldown'));
function spec(){const U=window.__STORYWORLD_SAMONG_ULT_R139__,ult=!U||U.inspect?.()?.prefs?.ult!==false,left=Math.max(0,Number(player?.samong)||0);
 return '<span class="t">남은 '+left.toFixed(1)+'초 / '+duration()+'초</span>'
  +(ult?'<span>궁극기 파동 1.4초마다 · 9칸</span><span>일반 몹 즉사 · 보스급 공격력 ×2.4</span>':'<span>사몽 폭풍(선) 공격</span>')
  +'<span>재사용 '+Math.round(cooldown())+'초</span>';}
function css(){if(document.getElementById('r177SamongCss'))return;const s=document.createElement('style');s.id='r177SamongCss';
 s.textContent='html.r177-samong #cutin{left:14px!important;right:auto!important;top:12px!important;width:150px!important;height:auto!important;transform:translateX(-12px);z-index:6}'
  +'html.r177-samong #cutin.on{transform:translateX(0)}html.r177-samong #cutin img{height:150px!important}html.r177-samong #cutin>b{font-size:20px!important;letter-spacing:4px}'
  +'#r177Spec{margin-top:6px;padding:6px 8px;border:1px solid #6b5a46;border-radius:4px;background:#120d10d9;font:12px/1.45 "Noto Sans KR",sans-serif;color:#e8d6bb;text-align:left;letter-spacing:0}'
  +'#r177Spec .t{display:block;font:700 13px/1.4 "Noto Sans KR",sans-serif;letter-spacing:0;color:#f4e6c4;text-align:left;margin-bottom:2px}#r177Spec span{display:block}'
  +'body.mobile-live-r63 html.r177-samong #cutin{width:116px!important}';document.head.appendChild(s);}
function box(){const c=document.getElementById('cutin');if(!c)return null;let d=document.getElementById('r177Spec');if(!d){d=document.createElement('div');d.id='r177Spec';c.appendChild(d);}return d;}
function apply(){try{document.documentElement.classList.toggle('r177-samong',!!prefs.on);}catch(_){}}
try{
 // R160 사몽 아이콘·R137 보호막 원: 사용자가 따로 켜 둔 적이 없으면 끈다.
 for(const [api,k] of [['__STORYWORLD_COMBAT_R160__','samongIcon'],['__STORYWORLD_COMBAT_R137__','guardOrb']]){try{const A=window[api];if(A?.set&&prefs.on&&!prefs['kept_'+k])A.set({[k]:false});}catch(e){fail(e);}}
 css();apply();
 if(typeof showAwakening==='function'){const base=showAwakening;showAwakening=function(...a){const r=base.apply(this,a);try{if(prefs.on){const d=box();if(d)d.innerHTML=spec();stats.shows++;}}catch(e){fail(e);}return r;};}
 if(typeof tick==='function'){const base=tick;let at=0;tick=function(...a){const r=base.apply(this,a);
  try{if(prefs.on&&typeof player==='object'&&player&&player.samong>0){if(typeof cutinUntil!=='undefined'&&typeof time==='number')cutinUntil=Math.max(cutinUntil,time+.2);
   const now=performance.now();if(now-at>200){at=now;const d=box();if(d){d.innerHTML=spec();stats.updates++;}}
   const c=document.getElementById('cutin');if(c&&!c.classList.contains('on'))c.classList.add('on');}}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply();}
window.__STORYWORLD_SAMONG_HUD_R177__=Object.freeze({revision:REV,set,spec,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
