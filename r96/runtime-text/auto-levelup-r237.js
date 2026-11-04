// R237 자동 스킬레벨업 — 사용자 2026-11-02 "스킬레벨업알아서하고".
// 레벨업·상자·미카엘라로 받은 패시브 포인트가 쌓여 있으면, P 창을 열지 않아도 알아서 강화를 산다.
// 구매 규칙·비용·효과는 그대로다(R169 일반강화 buyTalent · R103 Z·X·C buyProc · R62 오라 purchase 를 그대로 부른다). 고르는 순서만 정한다:
//  1) 지금 살 수 있는 것 중 비용이 가장 싼 것.
//  2) 비용이 같으면 일반강화(최대 단계가 있는 기존 재능) → Z·X·C 스킬강화(낮은 단계부터) → 오라·무한강화(낮은 단계부터).
//  · 오라는 전투 능력치 오라만 산다(위력·체력·공격 간격·재사용·피해감소·공명, DREAM 에서는 사몽 안개도). 합일 오라(해금 조건 따로)와 실검무 꾸밈 모티프는 사지 않는다.
//  · 혼자 플레이일 때만(함께하기는 방장·손님 구매 경로가 따로라 건드리지 않는다), 창·로딩·대화가 없을 때만, 1.2초에 한 번, 한 번에 최대 6개.
//  · 산 것은 화면 아래 짧은 알림으로 알려 주고 저장한다.
// 끄기: P 창 위쪽 '자동 스킬레벨업' 단추, 또는 localStorage['storyworld.r237.autolevel']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_AUTOLEVEL_R237__)return;
const REV='R237-autolevel-1',KEY='storyworld.r237.autolevel',EVERY=1200,BATCH=6;
const AURA=['endlessPower','endlessVital','endlessHaste','endlessCooldown','endlessWard','endlessResonance'],DREAM_AURA='dreamAura';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={ticks:0,buys:0,talent:0,proc:0,aura:0,errors:0,last:[]};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const P62=()=>window.__STORYWORLD_PROGRESSION_R62__,GR=()=>window.__STORYWORLD_GROWTH_R103__,U169=()=>window.__STORYWORLD_UPGRADES_R169__;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const G_={player:()=>typeof player==='object'?player:null,layer:()=>typeof layer!=='undefined'?layer:null,UPGRADES:()=>typeof UPGRADES!=='undefined'?UPGRADES:null,rank:()=>typeof rank==='function'?rank:null,
 started:()=>typeof started!=='undefined'?started:true,modal:()=>typeof modal!=='undefined'?modal:null,loading:()=>typeof loading!=='undefined'?loading:false,storyScene:()=>typeof storyScene!=='undefined'?storyScene:null};
const g=n=>{try{return G_[n]();}catch(_){return undefined;}};
const pts=p=>Number(p?.points)||0;
// 지금 살 수 있는 후보: {kind,id,cost,rank,name,order}
function candidates(p){const out=[],have=pts(p);if(have<=0)return out;const L=g('layer');
 // 1) 일반강화(R169 와 같은 목록·같은 조건)
 try{const UP=g('UPGRADES'),rank=g('rank');if(Array.isArray(UP)&&typeof rank==='function'&&U169()?.buyTalent)for(const u of UP){if(u.dream&&L!=='DREAM')continue;const n=Number(rank(u.id))||0;if(n>=u.max)continue;out.push({kind:'talent',id:u.id,cost:1,rank:n,name:u.name,order:0});}}catch(e){fail(e);}
 // 2) Z·X·C 확률 발동(사몽 루트가 열린 뒤)
 try{const G=GR();if(G){const i=G.inspect?.();if(i?.routeOpen){const st=i.state||G.state?.();for(const slot of ['w','e','r']){const lv=Number(st?.procs?.[p.hero+':'+slot])||0;if(lv>=(G.MAX_LEVEL||7))continue;out.push({kind:'proc',id:slot,cost:G.procCost(lv+1),rank:lv,name:(typeof KR291!=='undefined'&&KR291?KR291:{w:'W',e:'E',r:'R',werDot:'W·E·R',werSp:'W · E · R'})[slot]+' 스킬강화',order:1});}}}}catch(e){fail(e);}
 // 3) 오라·무한강화(R169 이후 비용 = 다음 단계²)
 try{const A=P62();if(A?.defs&&typeof A.ranks==='function'){const ids=L==='DREAM'?[...AURA,DREAM_AURA]:AURA;for(const id of ids){const d=A.defs.find(x=>x.id===id);if(!d)continue;const n=Number(A.ranks(id,p))||0;if(d.maxRank!=null&&n>=d.maxRank)continue;out.push({kind:'aura',id,cost:Number(d.cost)||1,rank:n,name:d.name,order:2});}}}catch(e){fail(e);}
 return out.filter(c=>Number.isFinite(c.cost)&&c.cost>0&&c.cost<=have).sort((a,b)=>a.cost-b.cost||a.order-b.order||a.rank-b.rank);}
function buy(c){if(c.kind==='talent')return U169().buyTalent(c.id)===true;if(c.kind==='proc')return GR().buyProc(c.id)===true;if(c.kind==='aura')return P62().purchase(c.id)===true;return false;}
function ready(){const p=g('player');if(!on||!p||!solo())return null;if(g('started')===false||g('modal')||g('loading')||g('storyScene'))return null;if(!(Number(p.hp)>0))return null;return p;}
function step(force){stats.ticks++;const p=force?g('player'):ready();if(!p)return [];const bought=[];
 for(let k=0;k<BATCH&&pts(p)>0;k++){const c=candidates(p)[0];if(!c)break;let ok=false;try{ok=buy(c);}catch(e){fail(e);}if(!ok)break;stats.buys++;stats[c.kind]++;bought.push(c.name+' '+(c.rank+1)+'단계');}
 if(bought.length){stats.last=bought.slice(-6);try{if(typeof saveGame==='function')saveGame(false);}catch(e){fail(e);}try{if(typeof updateHUD==='function')updateHUD();}catch(_){}
  try{if(typeof toast==='function')toast('자동 스킬레벨업 · '+bought.join(' · '),2.6);}catch(_){}}
 return bought;}
// P 창에 켜기/끄기 단추
function addToggle(){const panel=document.getElementById('panel');if(!panel||!panel.querySelector('[data-r62-passive],.r169card')||panel.querySelector('#r237Auto'))return;const h2=panel.querySelector('h2');if(!h2)return;
 /* 제목 줄에 단다 — R222 가 제목 아래 p.small 설명을 접기 안으로 옮기므로 */
 h2.insertAdjacentHTML('beforeend','<button id="r237Auto" class="r237auto" title="포인트가 생기면 싼 것부터 알아서 강화합니다" style="margin-left:10px;padding:2px 12px;border:1px solid #8a7354;border-radius:999px;font-size:13px;vertical-align:middle;background:#1d1610;color:#e8d6bb;cursor:pointer">자동 스킬레벨업: '+(on?'켜짐':'꺼짐')+'</button>');
 const b=panel.querySelector('#r237Auto');if(b)b.onclick=()=>{set(!on);b.textContent='자동 스킬레벨업: '+(on?'켜짐':'꺼짐');};}
try{if(typeof showUpgrades==='function'){const base=showUpgrades;showUpgrades=function(...a){const r=base.apply(this,a);try{addToggle();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
// R252(사용자 2026-11-03 "스킬레벨업창에서 스킬레벨업하면 자동으로윗쪽으로 휠이올라가는버그"): 강화를 사면 창을 통째로 다시 그려(openPanel) #panel 스크롤이 0 으로 돌아갔다.
//  같은 창(제목 첫 글이 같음)을 다시 그릴 때만 직전 스크롤 위치를 되돌린다(그린 직후·다음 프레임 두 번 — 뒤이어 붙는 R169·R115 덧붙이기가 높이를 바꾸므로). 다른 창을 열 때는 그대로 맨 위.
const headOf=pn=>{try{const h=pn&&typeof pn.querySelector==='function'?pn.querySelector('h2'):null;if(!h)return '';const kids=h.childNodes&&typeof h.childNodes.length==='number'?Array.prototype.slice.call(h.childNodes):[];const t=kids.filter(n=>n&&n.nodeType===3).map(n=>String(n.textContent||'')).join('').trim();return t||String(h.textContent||'').trim();}catch(_){return '';}};/* 가짜 DOM(검사 하네스)에서도 던지지 않게 */
try{if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){const pn=document.getElementById('panel'),wasOpen=typeof modal!=='undefined'&&!!modal,top=pn?pn.scrollTop:0,head=wasOpen?headOf(pn):'';const r=base.apply(this,a);
 try{if(wasOpen&&top>0&&head&&headOf(pn)===head){const back=()=>{if(headOf(pn)===head&&pn.scrollTop<top)pn.scrollTop=top;};back();if(typeof requestAnimationFrame==='function')requestAnimationFrame(back);setTimeout(back,0);stats.keptScroll=(stats.keptScroll||0)+1;}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
if(typeof setInterval==='function')setInterval(()=>{try{step(false);}catch(e){fail(e);}},EVERY);
window.__STORYWORLD_AUTOLEVEL_R237__=Object.freeze({revision:REV,set,step,candidates:()=>{const p=g('player');return p?candidates(p):[];},inspect:()=>({revision:REV,on,stats:{...stats,last:[...stats.last]},lastError})});
})();
