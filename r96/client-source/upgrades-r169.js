// R169 — 강화 체계 정리(사용자 2026-10-31 "오라들 무한강화하는 것도 스킬강화처럼 제곱수 형태로 늘어나도록 … zxc 스킬강화, 일반강화도 모두
//  오라 쪽으로 몰아서 한 번에 모든 스킬강화 볼 수 있도록 UI 체계화").
//  · 오라·무한강화(R62 반복 패시브, 실검무 제외): 다음 단계 비용 = (지금 단계 + 1)² 점. Z·X·C 확률 발동(R103, k단계 k²점)과 같은 규칙.
//    이미 산 단계는 그대로 두고, 앞으로 사는 단계부터 적용한다. 한 번만 사는 실검무 모티프(비용 1)는 그대로.
//  · P(패시브 강화) 창 하나에 Z·X·C 스킬강화와 일반강화(기존 영웅·공통 재능)를 카드로 덧붙인다. 각 카드는 원래 구매 규칙을 그대로 부른다
//    (Z·X·C = __STORYWORLD_GROWTH_R103__.buyProc, 일반강화 = 본편 재능 구매와 같은 순서). R115 '스킬 강화 모음'이 묶음별로 정리해 보여 준다.
//  play-r115.js 보다 먼저 실려야 모음이 덧붙인 카드까지 읽는다. storyworld.r169.upgrades {square:false} 로 비용 규칙을, {merge:false} 로 통합을 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_UPGRADES_R169__)return;
const REV='R169-upgrades-1',KEY='storyworld.r169.upgrades';
let prefs={square:true,merge:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={squared:0,renders:0,procBuys:0,talentBuys:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const P62=()=>window.__STORYWORLD_PROGRESSION_R62__,GR=()=>window.__STORYWORLD_GROWTH_R103__;
const me=()=>window.__STORYWORLD_COOP_SIM_R62__?.localPlayer?.()||(typeof player==='object'?player:null);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SQUARE=new Set();
// ---- 오라·무한강화 비용 = 다음 단계² -----------------------------------------------------------------
function squareCosts(){const A=P62();if(!A?.defs)return;for(const d of A.defs){if(d.maxRank!=null||d.id==='threadDanceR63'||SQUARE.has(d.id))continue;
  try{Object.defineProperty(d,'cost',{configurable:true,enumerable:true,get(){if(!prefs.square)return 1;const p=me();const n=p?Number(A.ranks(d.id,p))||0:0;return (n+1)*(n+1);}});SQUARE.add(d.id);stats.squared++;}catch(e){fail(e);}}}
const nextCost=id=>{const d=P62()?.defs?.find(x=>x.id===id);return d?Number(d.cost)||1:null;};
// ---- 한 창에 모으기 ------------------------------------------------------------------------------
const SLOT_KEY={w:'Z',e:'X',r:'C'};
function procCards(p){const G=GR(),defs=window.__STORYWORLD_WER__?.defs?.[p.hero]||{};if(!G)return'';let open=false,st=null;try{const i=G.inspect();open=!!i.routeOpen;st=i.state;}catch(e){fail(e);}
 const icon=typeof VFX!=='undefined'&&typeof urlFor==='function'?urlFor(VFX.slash||VFX.crown):'';
 return['w','e','r'].map(slot=>{const lv=Number(st?.procs?.[p.hero+':'+slot])||0,max=G.MAX_LEVEL||7,next=lv<max?G.procCost(lv+1):null,now=Math.round(G.procChance(lv)*100),after=next!=null?Math.round(G.procChance(lv+1)*100):now,
   off=!open||next==null||!(p.points>=next),name=defs[slot]?.[0]||slot.toUpperCase();
   return'<button class="card upgrade r169card" data-r169="r169proc:'+slot+'" '+(off?'disabled':'')+'>'+(icon?'<img src="'+esc(icon)+'" alt="">':'')+'<strong>'+SLOT_KEY[slot]+' · '+esc(name)+' '+lv+'단계 / '+max+'</strong><small>발동 '+now+'%'+(next!=null?' → '+after+'%':'')+' · 기본 공격 때 이 기술이 확률로 저절로 나갑니다.'+(open?'':' 사몽 루트를 시작하면 열립니다.')+' <br>'+(next!=null?'강화 비용 '+next+'점 (k단계 k²점)':'최대 단계')+'</small></button>';}).join('');}
function talentCards(p){if(typeof UPGRADES==='undefined'||typeof rank!=='function')return'';const H=typeof HEROES!=='undefined'?HEROES[p.hero]:null;
 return UPGRADES.filter(u=>!u.dream||layer==='DREAM').map(u=>{const n=rank(u.id),title=u.hero&&H?H.name+' · '+u.name:u.name,img=typeof VFX!=='undefined'&&typeof urlFor==='function'&&VFX[u.icon]?urlFor(VFX[u.icon]):'';
  return'<button class="card upgrade r169card" data-r169="r169up:'+esc(u.id)+'" '+(p.points<1||n>=u.max?'disabled':'')+'>'+(img?'<img src="'+esc(img)+'" alt="">':'')+'<strong>'+esc(title)+' '+n+' / '+u.max+'</strong><small>'+esc(u.text)+' <br>강화 비용 1점</small></button>';}).join('');}
function buyTalent(id){const p=player;const u=UPGRADES.find(x=>x.id===id);if(!p||!u||p.points<=0||rank(u.id)>=u.max||u.dream&&layer!=='DREAM')return false;
 p.points--;const k=upgradeKey(u);p.upgrades[k]=(p.upgrades[k]||0)+1;if(u.id==='vital')p.hp=Math.min(maxHP(),p.hp+(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal(35,p)??35));
 try{sound('upgrade',true);}catch(_){}try{saveGame(false);}catch(_){}stats.talentBuys++;return true;}
function css(){if(document.getElementById('r169UpCss'))return;const s=document.createElement('style');s.id='r169UpCss';
 s.textContent='#panel .r169sec{grid-column:1/-1;margin:10px 0 2px;padding:4px 2px;border-bottom:1px solid #6b5a46;color:#f0d9b0;font:700 14px/1.4 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.04em}#panel .r169sec small{font-weight:400;color:#bfa98a;margin-left:8px;font-size:12px}#panel p.r169rule{margin:4px 0 8px;color:#e8d6bb}';document.head.appendChild(s);}
function merge(){if(!prefs.merge)return;const panel=document.getElementById('panel'),cards=panel?.querySelector('.cards');if(!cards||!cards.querySelector('[data-r62-passive]')||cards.querySelector('.r169card'))return;const p=me();if(!p)return;css();
 const sec=(t,s)=>'<div class="r169sec">'+t+(s?'<small>'+s+'</small>':'')+'</div>';
 cards.insertAdjacentHTML('afterbegin',sec('오라 · 무한강화','다음 단계 비용 = 단계²'));
 cards.insertAdjacentHTML('beforeend',sec('Z · X · C 스킬강화','k단계 k²점 · 최대 7단계')+procCards(p)+sec('일반강화','기존 영웅·공통 재능 · 1점')+talentCards(p));
 const h2=panel.querySelector('h2');if(h2&&!panel.querySelector('.r169rule'))h2.insertAdjacentHTML('afterend','<p class="small r169rule">모든 강화를 이 창 한 곳에서: 오라·무한강화(비용 = 다음 단계의 제곱) · Z·X·C 스킬강화 · 일반강화</p>');
 cards.querySelectorAll('[data-r169]').forEach(b=>b.onclick=()=>{if(b.disabled||!b.isConnected)return;const [kind,id]=b.dataset.r169.split(':');let ok=false;
  try{if(kind==='r169proc'){ok=GR()?.buyProc(id)===true;if(ok)stats.procBuys++;}else ok=buyTalent(id);}catch(e){fail(e);}
  if(ok)try{showUpgrades();}catch(e){fail(e);}});
 stats.renders++;}
try{
 squareCosts();
 if(typeof showUpgrades==='function'){const base=showUpgrades;showUpgrades=function(...a){squareCosts();const r=base.apply(this,a);try{merge();}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_UPGRADES_R169__=Object.freeze({revision:REV,set,nextCost,squared:()=>[...SQUARE],inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},squared:[...SQUARE],lastError})});
})();
