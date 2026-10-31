// R169 — 강화 체계 정리(사용자 2026-10-31 "오라들 무한강화하는 것도 스킬강화처럼 제곱수 형태로 늘어나도록 … zxc 스킬강화, 일반강화도 모두
//  오라 쪽으로 몰아서 한 번에 모든 스킬강화 볼 수 있도록 UI 체계화").
//  · 오라·무한강화(R62 반복 패시브, 실검무 제외): 다음 단계 비용 = (지금 단계 + 1)² 점. Z·X·C 확률 발동(R103, k단계 k²점)과 같은 규칙.
//    이미 산 단계는 그대로 두고, 앞으로 사는 단계부터 적용한다. 한 번만 사는 실검무 모티프(비용 1)는 그대로.
//  · P(패시브 강화) 창 하나에 Z·X·C 스킬강화와 일반강화(기존 영웅·공통 재능)를 카드로 덧붙인다. 각 카드는 원래 구매 규칙을 그대로 부른다
//    (Z·X·C = __STORYWORLD_GROWTH_R103__.buyProc, 일반강화 = 본편 재능 구매와 같은 순서). R115 '스킬 강화 모음'이 묶음별로 정리해 보여 준다.
//  play-r115.js 보다 먼저 실려야 모음이 덧붙인 카드까지 읽는다. storyworld.r169.upgrades {square:false} 로 비용 규칙(과 효과 상향)을, {boost:false} 로 효과 상향만, {merge:false} 로 통합을 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_UPGRADES_R169__)return;
const REV='R169-upgrades-1',KEY='storyworld.r169.upgrades';
let prefs={square:true,merge:true,boost:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={squared:0,renders:0,procBuys:0,talentBuys:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const P62=()=>window.__STORYWORLD_PROGRESSION_R62__,GR=()=>window.__STORYWORLD_GROWTH_R103__;
const me=()=>window.__STORYWORLD_COOP_SIM_R62__?.localPlayer?.()||(typeof player==='object'?player:null);
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SQUARE=new Set();
// ---- 오라·무한강화 비용 = 다음 단계² -----------------------------------------------------------------
function squareCosts(){const A=P62();if(!A?.defs)return;for(const d of A.defs){if(d.maxRank!=null||d.id==='threadDanceR63'||SQUARE.has(d.id))continue;
  try{Object.defineProperty(d,'cost',{configurable:true,enumerable:true,get(){if(!prefs.square||!solo())return 1;/* 함께하기: 코어 purchase(id,p)는 산 사람 p 를 쓰는데 이 getter 는 p 를 모른다 → 방장·손님 값이 어긋나지 않게 원래 비용 */const p=me();const n=p?Number(A.ranks(d.id,p))||0:0;return (n+1)*(n+1);}});SQUARE.add(d.id);stats.squared++;}catch(e){fail(e);}}}
const nextCost=id=>{const d=P62()?.defs?.find(x=>x.id===id);return d?Number(d.cost)||1:null;};
// ---- 비용에 맞춘 효과 상향(사용자 "비례해서 강화 능력치도 밸런스 맞게 상향") ------------------------------------------
//  k단계 하나의 효과 = 원래 한 단계 효과 × k. n단계 누적은 원래 공식에 n 대신 T(n)=n(n+1)/2 를 넣은 값(예: 끝없는 의지 10단계 +2%×55 = +110%).
//  비용(k²)보다 느리게 늘어 한 점당 효율은 단계가 오를수록 조금씩 줄고, 같은 점수로 여러 오라를 고루 올리는 쪽도 손해가 크지 않다.
//  R62 가 이미 n 으로 적용한 값 위에 'T(n) 공식 ÷ n 공식' 비율만 덧곱한다(최대 체력 777 고정 R71 에서는 깊어지는 생명 = 받는 피해 감소).
const TRI=n=>n*(n+1)/2;
const rk=(id,p)=>{try{return Math.max(0,Number(P62()?.ranks(id,p))||0);}catch(_){return 0;}};
const F={power:(a,b)=>1+.02*a+.01*b,tempo:n=>.28+.72/(1+.04*n),cool:n=>.25+.75/(1+.035*n),ward:n=>1-.30*n/(n+40),res:n=>1+.01*n,dream:n=>8*n/(n+20)};
const boostOn=()=>prefs.square&&prefs.boost!==false&&solo();
function legacyBase(p){try{const u=typeof UPGRADES!=='undefined'?UPGRADES.find(x=>x.id==='vital'):null,k=u?.hero?String(p?.hero)+':vital':'vital';return 260+35*(Number(p?.upgrades?.[k])||0)+5*(Math.max(1,Number(p?.level)||1)-1);}catch(_){return 260;}}
function ratios(p){const n=id=>rk(id,p),pw=n('endlessPower'),eg=n('egoAura'),hs=n('endlessHaste'),cd=n('endlessCooldown'),wd=n('endlessWard'),rs=n('endlessResonance'),vt=n('endlessVital'),dr=n('dreamAura'),B=legacyBase(p);
 return{power:F.power(TRI(pw),TRI(eg))/F.power(pw,eg),tempo:F.tempo(TRI(hs))/F.tempo(hs),cool:F.cool(TRI(cd))/F.cool(cd),hurt:F.ward(TRI(wd))/F.ward(wd)*(B+18*vt)/(B+18*TRI(vt)),res:F.res(TRI(rs))/F.res(rs),dream:F.dream(TRI(dr))-F.dream(dr),
  show:{power:F.power(TRI(pw),TRI(eg)),tempo:Math.max(.14/.6,F.tempo(TRI(hs))),cool:F.cool(TRI(cd)),ward:F.ward(TRI(wd)),vital:18*TRI(vt),res:F.res(TRI(rs)),dream:F.dream(TRI(dr))}};}
const ONE=Object.freeze({power:1,tempo:1,cool:1,hurt:1,res:1,dream:0});
const R=()=>{const p=typeof player==='object'?player:null;return boostOn()&&p?ratios(p):ONE;};
function installBoost(){
 if(typeof attackPower==='function'){const b=attackPower;attackPower=function(...a){const v=b.apply(this,a);try{const r=R().power;return Number.isFinite(v)&&r!==1?Math.min(Number.MAX_SAFE_INTEGER,v*r):v;}catch(e){fail(e);return v;}};}
 if(typeof hurt==='function'){const b=hurt;hurt=function(d,...a){try{const r=R().hurt;if(Number.isFinite(d)&&r!==1)d*=r;}catch(e){fail(e);}return b.call(this,d,...a);};}
 if(typeof gainResonance==='function'){const b=gainResonance;gainResonance=function(v,...a){try{const r=R().res;if(Number.isFinite(v)&&r!==1)v*=r;}catch(e){fail(e);}return b.call(this,v,...a);};}
 if(typeof basicAttack==='function'){const b=basicAttack;basicAttack=function(...a){const p=player,before=Number(p?.attackCD)||0,res=b.apply(this,a);try{if(p===player&&before<=0&&p?.attackCD>0){const r=R().tempo;if(r!==1)p.attackCD=Math.max(.14,p.attackCD*r);}}catch(e){fail(e);}return res;};}
 const cool=(name,key)=>{if(typeof globalThis[name]!=='function')return;const b=globalThis[name];globalThis[name]=function(...a){const p=player,before=Number(p?.[key])||0,res=b.apply(this,a);try{if(p===player&&before<=0&&p?.[key]>0){const r=R().cool;if(r!==1)p[key]=Math.max(.22,p[key]*r);}}catch(e){fail(e);}return res;};};
 cool('special','specialCD');cool('blink','blinkCD');cool('ego','egoCD');
 if(typeof awaken==='function'){const b=awaken;awaken=function(...a){const p=player,before=Number(p?.samong)||0,res=b.apply(this,a);try{if(p===player&&before<=0&&p?.samong>0){const r=R();p.samong+=r.dream;if(r.cool!==1)p.samongCD=Math.max(.22,p.samongCD*r.cool);}}catch(e){fail(e);}return res;};}
 if(typeof fx==='function'){const b=fx;const seen={};fx=function(type,x,y,opt={},...a){try{if(type==='storySourceSkill'&&opt?.storyWER&&opt.stage==='warning'&&player&&opt.sourceHero===player.hero){const k=player.hero+':'+opt.sourceSlot,ready=player.storyWER?.ready,at=Number(ready?.[k]),r=R().cool;
   if(r!==1&&ready&&Number.isFinite(at)&&at>time&&seen[k]!==opt.castId){seen[k]=opt.castId;ready[k]=time+Math.max(.35,(at-time)*r);}}}catch(e){fail(e);}return b.call(this,type,x,y,opt,...a);};}
 stats.boost=true;}
const BOOST_NOTE=' 〔R169: k단계 하나의 효과 = 원래 한 단계 × k, n단계 누적 = n(n+1)/2단계 몫〕';
function noteText(){const A=P62();if(!A?.defs)return;for(const d of A.defs)if(SQUARE.has(d.id)&&typeof d.text==='string'&&!d.text.includes('〔R169'))d.text+=BOOST_NOTE;}
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
function merge(){if(!prefs.merge||!solo())return;/* 통합 카드는 player 를 직접 바꾼다 — 함께하기에서는 손님 요청 경로(R62 카드)만 쓴다 */const panel=document.getElementById('panel'),cards=panel?.querySelector('.cards');if(!cards||!cards.querySelector('[data-r62-passive]')||cards.querySelector('.r169card'))return;const p=me();if(!p)return;css();
 const sec=(t,s)=>'<div class="r169sec">'+t+(s?'<small>'+s+'</small>':'')+'</div>';
 cards.insertAdjacentHTML('afterbegin',sec('오라 · 무한강화','다음 단계 비용 = 단계²'));
 cards.insertAdjacentHTML('beforeend',sec('Z · X · C 스킬강화','k단계 k²점 · 최대 7단계')+procCards(p)+sec('일반강화','기존 영웅·공통 재능 · 1점')+talentCards(p));
 const h2=panel.querySelector('h2'),sh=boostOn()?ratios(p).show:null;if(h2&&!panel.querySelector('.r169rule'))h2.insertAdjacentHTML('afterend','<p class="small r169rule">모든 강화를 이 창 한 곳에서: 오라·무한강화(비용 = 다음 단계의 제곱, 효과도 단계마다 커짐) · Z·X·C 스킬강화 · 일반강화'+(sh?'<br>지금 오라 합계: 위력 ×'+sh.power.toFixed(2)+' · 공격 간격 '+Math.round(sh.tempo*100)+'% · 재사용 '+Math.round(sh.cool*100)+'% · 받는 피해 '+Math.round(sh.ward*100)+'% · 공명 획득 ×'+sh.res.toFixed(2)+' · 사몽 +'+sh.dream.toFixed(1)+'초':'')+'</p>');
 cards.querySelectorAll('[data-r169]').forEach(b=>b.onclick=()=>{if(b.disabled||!b.isConnected)return;const [kind,id]=b.dataset.r169.split(':');let ok=false;
  try{if(kind==='r169proc'){ok=GR()?.buyProc(id)===true;if(ok)stats.procBuys++;}else ok=buyTalent(id);}catch(e){fail(e);}
  if(ok)try{showUpgrades();}catch(e){fail(e);}});
 stats.renders++;}
try{
 squareCosts();noteText();installBoost();
 if(typeof showUpgrades==='function'){const base=showUpgrades;showUpgrades=function(...a){squareCosts();noteText();const r=base.apply(this,a);try{merge();}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_UPGRADES_R169__=Object.freeze({revision:REV,set,nextCost,squared:()=>[...SQUARE],ratios:()=>{const p=typeof player==='object'?player:null;return p?ratios(p):null;},TRI,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},squared:[...SQUARE],lastError})});
})();
