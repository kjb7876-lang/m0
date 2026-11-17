// R177 — 사몽 화면 정리(사용자 2026-10-31 "사몽스킬 맨처음에 캐릭터이펙트 나온 걸 전투화면 왼쪽 위 구역에, 아래에 사몽스킬 현재 간략한 스펙,
//  왼쪽 아래 사몽 궁극기 이펙트는 삭제, 그 아래 보호막 표시 하늘색 원 표시도 삭제").
//  · 사몽 각성 그림(#cutin: 영웅 각성 그림 + 死夢覺醒)을 오른쪽 가운데에서 전투 화면 왼쪽 위로 옮기고, 사몽이 켜져 있는 동안 남겨 둔다.
//  · 사몽 스킬의 간략한 수치(남은 시간/지속·궁극기 파동·즉사 규칙·재사용)는 전투 화면이 아니라 아래 스킬 칸(EGO 진입 단추)에 둔다
//    (사용자 "세부스펙은 스킬 UI 안으로, 전투화면에서는 빼고"): 단추에 올리거나 길게 누르면 펼쳐지고, 사몽 동안 단추에 남은 시간이 보인다.
//  · 왼쪽 아래 사몽 아이콘(R160)과 체력 구슬 위 하늘색 보호막 원(R137)은 기본값을 끔(설정에서 다시 켤 수 있음).
//  · 사몽 구역 이름: 사몽 구역은 쉼터(hub) 지역을 빌려 쓰므로 기본 화면 갱신·입장 배너·메뉴가 '제1부 — …'·'잠들지 못하는 마을' 같은 스토리 이름으로 덮어쓰던 것을
//    사몽 장(예: 제9부 — 사몽 · 경성의 밤)과 구역 이름(예: 계급장의 거리)으로 맞춘다(사용자 "사몽구역 에피소드 네이밍, 스토리 쪽이랑 혼합되는 버그").
//  판정·지속·재사용·피해는 건드리지 않는다. storyworld.r177.samongHud {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_HUD_R177__)return;
const REV='R177-samong-hud-1',KEY='storyworld.r177.samongHud';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={shows:0,updates:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const R=id=>{try{return typeof rank==='function'?Number(rank(id))||0:0;}catch(_){return 0;}};
const duration=()=>7+R('samongTime'),cooldown=()=>77*Math.max(.6,1-.08*R('samongCooldown'));
function spec(){const U=window.__STORYWORLD_SAMONG_ULT_R139__,ult=!U||U.inspect?.()?.prefs?.ult!==false,left=Math.max(0,Number(player?.samong)||0);
 return '<span class="t">사몽(死夢覺醒) · '+(left>0?'남은 '+left.toFixed(1)+'초 / ':'지속 ')+duration()+'초</span>'
  +(ult?'<span>궁극기 파동 1.4초마다 · 9칸</span><span>일반 몹 즉사 · 보스급 공격력 ×2.4</span>':'<span>사몽 폭풍(선) 공격</span>')
  +'<span>재사용 '+Math.round(cooldown())+'초</span>';}
function css(){if(document.getElementById('r177SamongCss'))return;const s=document.createElement('style');s.id='r177SamongCss';
 s.textContent='html.r177-samong #cutin{left:14px!important;right:auto!important;top:12px!important;width:150px!important;height:auto!important;transform:translateX(-12px);z-index:6}'
  +'html.r177-samong #cutin.on{transform:translateX(0)}html.r177-samong #cutin img{height:150px!important}html.r177-samong #cutin>b{font-size:20px!important;letter-spacing:4px}'
  +'#r177SkillTip{position:fixed;z-index:45;width:230px;padding:8px 10px;border:1px solid #6b5a46;border-radius:4px;background:#120d10f0;font:12px/1.5 "Noto Sans KR",sans-serif;color:#e8d6bb;pointer-events:none;box-shadow:0 8px 20px #000a}#r177SkillTip[hidden]{display:none}'
  +'#r177SkillTip .t{display:block;font-weight:700;color:#f4e6c4;margin-bottom:2px}#r177SkillTip span{display:block}#egoBtn .r177left{position:absolute;left:-6px;right:-6px;top:-15px;text-align:center;font:700 11px/1 "Noto Sans KR",sans-serif;color:#f4e6c4;text-shadow:0 1px 3px #000;pointer-events:none}'
  +'body.mobile-live-r63 html.r177-samong #cutin{width:116px!important}';document.head.appendChild(s);}
function btn(){return document.getElementById('egoBtn');}
let tip=null,tipOn=false;
function box(){if(!tip){tip=document.createElement('div');tip.id='r177SkillTip';tip.hidden=true;document.body.appendChild(tip);}return tip;}
function place(){const b=btn(),d=box();if(!b||!d)return;const r=b.getBoundingClientRect();d.style.left=Math.max(8,Math.min(innerWidth-238,r.left+r.width/2-115))+'px';d.style.top=Math.max(8,r.top-d.offsetHeight-8)+'px';}
function openTip(){if(!prefs.on)return;const d=box();d.innerHTML=spec();d.hidden=false;tipOn=true;place();}
function closeTip(){tipOn=false;if(tip)tip.hidden=true;}
function hookBtn(){const b=btn();if(!b||b.__r177)return;b.__r177=true;b.style.position=b.style.position||'relative';b.addEventListener('pointerenter',openTip);b.addEventListener('pointerleave',closeTip);b.addEventListener('focus',openTip);b.addEventListener('blur',closeTip);
 let hold=0;b.addEventListener('touchstart',()=>{hold=setTimeout(openTip,420);},{passive:true});b.addEventListener('touchend',()=>{clearTimeout(hold);setTimeout(closeTip,1600);},{passive:true});}
function leftBadge(on){const b=btn();if(!b)return;let s=b.querySelector('.r177left');if(!on){if(s)s.remove();return;}if(!s){s=document.createElement('span');s.className='r177left';b.appendChild(s);}s.textContent='사몽 '+Math.max(0,player.samong).toFixed(1)+'s';}
function apply(){try{document.documentElement.classList.toggle('r177-samong',!!prefs.on);}catch(_){}}
// ---- 사몽 구역 이름 ----
const cache=new Map();
function samongNames(){try{if(typeof layer==='undefined'||layer!=='DREAM')return null;const id=room?.samongR103?.zone;if(!id)return null;if(cache.has(id))return cache.get(id);
 const ZN=window.__STORYWORLD_SAMONG_ZONES_R115__,SM=window.__STORYWORLD_SAMONG_R103__,z=ZN?.zone?.(id);if(!z)return null;let ep=null;
 for(const e of (SM?.episodes||[])){const zs=ZN.chapter?.(e.key);if(Array.isArray(zs)&&zs.some(q=>q.id===id)){ep=e;break;}}
 const out={zone:z.title||'',ep:ep?.title||'',chapter:ep?.chapter||''};cache.set(id,out);return out;}catch(e){fail(e);return null;}}
function fixHud(){const n=samongNames();if(!n)return;const set=(id,v)=>{const el=document.getElementById(id);if(el&&v&&el.textContent!==v)el.textContent=v;};
 set('regionName',n.zone);const sub=document.getElementById('regionSub');if(sub&&/^제\d+부/.test(sub.textContent)&&!sub.textContent.startsWith(n.chapter))sub.textContent=n.chapter+' · '+n.ep;}
try{
 if(typeof displayRegion==='function'){const base=displayRegion;displayRegion=function(id){try{const n=(id===undefined||id===zone)?samongNames():null;if(n&&n.zone)return '사몽 · '+n.ep+' · '+n.zone;}catch(e){fail(e);}return base.apply(this,arguments);};}
 if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r=base.apply(this,a);try{fixHud();}catch(e){fail(e);}return r;};}
 if(typeof banner==='function'){const base=banner;banner=function(...a){const r=base.apply(this,a);try{const n=samongNames(),b=document.getElementById('banner');if(n&&b){b.textContent=n.zone;const sm=document.createElement('small');sm.textContent=n.chapter+' · '+n.ep;b.appendChild(sm);stats.banners=(stats.banners||0)+1;}}catch(e){fail(e);}return r;};}
 // R160 사몽 아이콘·R137 보호막 원: 처음 한 번 끈다.
 if(prefs.on&&!prefs.iconsOff){for(const [api,k] of [['__STORYWORLD_COMBAT_R160__','samongIcon'],['__STORYWORLD_COMBAT_R137__','guardOrb']]){try{window[api]?.set?.({[k]:false});}catch(e){fail(e);}}set({iconsOff:true});}// 한 번만 끈다 — 설정에서 다시 켜면 그대로 둔다
 css();apply();
 if(typeof showAwakening==='function'){const base=showAwakening;showAwakening=function(...a){const r=base.apply(this,a);try{if(prefs.on)stats.shows++;}catch(e){fail(e);}return r;};}
 if(typeof tick==='function'){const base=tick;let at=0;tick=function(...a){const r=base.apply(this,a);
  try{if(prefs.on&&typeof player==='object'&&player&&player.samong>0){if(typeof cutinUntil!=='undefined'&&typeof time==='number')cutinUntil=Math.max(cutinUntil,time+.2);
   const now=performance.now();if(now-at>200){at=now;fixHud();hookBtn();leftBadge(true);if(tipOn){box().innerHTML=spec();place();}stats.updates++;}
   const c=document.getElementById('cutin');if(c&&!c.classList.contains('on'))c.classList.add('on');}
  else{const now=performance.now();if(now-at>500){at=now;fixHud();hookBtn();leftBadge(false);if(tipOn){box().innerHTML=spec();place();}}}}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply();}
window.__STORYWORLD_SAMONG_HUD_R177__=Object.freeze({revision:REV,set,spec,samongNames,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
