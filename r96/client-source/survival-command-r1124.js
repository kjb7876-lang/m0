// R1124 무한생존: H로 정화구슬 본진 지휘 ↔ 본영웅 조작.
// 카메라만 고정한다. player를 코어로 바꾸거나 순간이동시키지 않는다.
// 이미 내린 이동/공격 명령을 먼저 수행하고, 명령이 끝나면 주변 적을 찾아 싸운다.
(()=>{'use strict';
if(window.__STORYWORLD_SURVIVAL_COMMAND_R1124__)return;
const REV='R1124-survival-command-3';
const G=(f,d=null)=>{try{return f();}catch(_){return d;}};
const SV=()=>window.__STORYWORLD_SURVIVAL_R600__;
const DEF=()=>window.__STORYWORLD_HERO_DEFENSE_R720__;
const P=()=>G(()=>player),R=()=>G(()=>room),T=()=>G(()=>time,0);
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:p.x,y:p.y}:null;
const here=()=>G(()=>SV().here()===true,false);
const live=()=>here()&&G(()=>started&&!loading&&player.hp>0,false)&&!G(()=>SV().state().over,false);
let baseView=false,savedAuto=null,owner=null,run=null,roomRef=null,selected=null,nextThink=0;
const stats={toggles:0,orders:0,selections:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,180);};
const editing=t=>!!t&&(['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||t.isContentEditable||!!t.closest?.('[contenteditable]:not([contenteditable="false"])'));
const runId=()=>G(()=>SV().inspect().stats.starts,null);
function clearHeld(){try{if(typeof clearControls==='function')clearControls();}catch(_){}try{window.__STORYWORLD_MOBILE_R63__?.clearGesture?.();}catch(_){}try{keys.clear();}catch(_){}try{joystickVector={x:0,y:0};}catch(_){}try{guardEnd();}catch(_){}const stick=G(()=>document.getElementById('stick'));if(stick)stick.style.transform='translate(0,0)';}
function pin(){const c=point(R()?.survivalR600?.centre);if(!baseView||!c)return;try{cam.x=c.x;cam.y=c.y;}catch(e){fail(e);}}
function reset(){if(baseView&&savedAuto!==null&&P()===owner)try{auto=savedAuto;}catch(_){}baseView=false;savedAuto=null;owner=null;selected=null;roomRef=null;run=null;nextThink=0;G(()=>window.__STORYWORLD_LIGHT_R182__?.apply?.());updateUI();}
function setBase(value){
 if(!value){if(!baseView)return false;reset();clearHeld();try{if(P()){cam.x=player.x;cam.y=player.y;}}catch(_){}stats.toggles++;return true;}
 if(baseView)return true;if(!live()||G(()=>modal||storyScene,false))return false;
 owner=P();run=runId();roomRef=R();savedAuto=G(()=>auto,false);selected=null;nextThink=0;baseView=true;
 // 명령/경로/대상은 그대로 둔다. 키를 떼기 전에 H를 눌러도 입력이 고착되지 않는다.
 clearHeld();try{auto=true;guide=false;}catch(_){}pin();G(()=>window.__STORYWORLD_LIGHT_R182__?.apply?.());stats.toggles++;updateUI();return true;
}
const toggle=()=>setBase(!baseView);
function maintain(){
 if(!baseView)return;
 if(G(()=>loading,false))return;
 if(!live()||P()!==owner||runId()!==run){reset();return;}
 if(R()!==roomRef){roomRef=R();selected=null;nextThink=0;}
}
function think(){
 if(!baseView||!live()||G(()=>modal||storyScene,false))return;
 // 조작 중 내려 둔 명령은 엔진이 완료할 때까지 우선한다.
 if(G(()=>command!=null,false)||G(()=>route.length>0,false)||T()<nextThink)return;
 nextThink=T()+.5;
 const p=P(),enemies=G(()=>liveEnemies(),[]).filter(e=>e&&e.hp>0&&!e.deadRecorded&&e.visible!==false&&point(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=14);
 enemies.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 for(const e of enemies){
  const near=Math.hypot(e.x-p.x,e.y-p.y)<=G(()=>HEROES[p.hero].range,3)*.82;
  const path=near?[]:G(()=>findPath(p,e),[]);if(!near&&!path.length)continue;
  try{target=e.id;command=e.id;route=path;stats.orders++;}catch(err){fail(err);}break;
 }
}
function placementPoint(){maintain();return baseView&&selected?{...selected}:null;}
function selectPoint(p){if(!baseView||!live())return false;const q=point(p),c=R()?.survivalR600?.centre,range=G(()=>SV().state().core.stats.range,5.5);
 if(!q||!c||Math.hypot(q.x-c.x,q.y-c.y)>range||G(()=>blocked(q.x,q.y,.35),false)){
  try{toast('정화구슬의 배치 범위 안 빈 땅을 선택하세요.',2);}catch(_){}return false;}
 selected=q;stats.selections++;updateUI();return true;}
function updateUI(){try{
 const doc=typeof document!=='undefined'?document:null;if(!doc)return;
 let style=doc.getElementById('r1124Style');if(!style){style=doc.createElement('style');style.id='r1124Style';style.textContent='#r1124CommandBar{position:absolute;left:50%;bottom:150px;transform:translateX(-50%);z-index:24;box-sizing:border-box;max-width:94%;padding:8px 12px;border:1px solid #9ba994;border-radius:5px;background:rgba(13,23,25,.94);color:#ece3cd;text-align:center;font:12px/1.5 "Malgun Gothic",sans-serif;box-shadow:0 2px 12px #0008}#r1124CommandBar[hidden]{display:none}#r1124CommandBar small{display:block;color:#bed7cd}#r1124CommandBar button{padding:5px 9px;margin:4px 3px 0;font-size:12px;min-height:32px}#r1124HomeBtn[aria-pressed="true"]{border-color:#b7d5bb;color:#d9f4db}@media(max-width:640px){#r1124CommandBar{padding:6px 8px;font-size:11px}#r1124CommandBar small{font-size:10px}#r1124HomeBtn{padding:5px;font-size:11px}}#r1124TouchHomeBtn{display:none}#r1124TouchHomeBtn[hidden]{display:none!important}@media(pointer:coarse){#r1124TouchHomeBtn{display:block;position:absolute;right:calc(8px + env(safe-area-inset-right,0px));bottom:calc(208px + env(safe-area-inset-bottom,0px));z-index:24;min-width:70px;min-height:44px;padding:6px 10px;font-size:12px;touch-action:manipulation}#r1124CommandBar{left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(114px + env(safe-area-inset-bottom,0px));transform:none;width:calc(100% - 108px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px));max-width:440px}#r1124CommandBar button{min-height:44px;touch-action:manipulation}}';doc.head.appendChild(style);}
 const nav=doc.querySelector('nav.topnav');let b=doc.getElementById('r1124HomeBtn');if(!b&&nav){b=doc.createElement('button');b.id='r1124HomeBtn';b.type='button';b.onclick=()=>toggle();nav.insertBefore(b,nav.firstChild);}
 if(b){b.style.display=here()?'':'none';b.disabled=!live()||!!G(()=>modal||storyScene,false);b.textContent=baseView?'H 영웅 복귀':'H 본진';b.title='정화구슬 본진 지휘 / 본영웅 조작 전환 (H)';b.setAttribute('aria-pressed',String(baseView));}
 // coarse 모바일은 header 전체를 숨기므로, 본진 최초 진입은 stage에도 둔다.
 // 본진에서는 지휘 바의 복귀 버튼을 사용해 두 조작면이 겹치지 않게 한다.
 const stage=doc.getElementById('stage');let touch=doc.getElementById('r1124TouchHomeBtn');
 if(!touch&&stage){touch=doc.createElement('button');touch.id='r1124TouchHomeBtn';touch.type='button';touch.textContent='H 본진';touch.title='정화구슬 본진 지휘로 전환';touch.onclick=()=>setBase(true);stage.appendChild(touch);}
 if(touch){touch.hidden=!here()||baseView;touch.disabled=!live()||!!G(()=>modal||storyScene,false);touch.setAttribute('aria-pressed',String(baseView));}
 let bar=doc.getElementById('r1124CommandBar');if(!bar&&stage){bar=doc.createElement('div');bar.id='r1124CommandBar';bar.innerHTML='<b>정화구슬 · 본진 지휘</b><small id="r1124Status"></small><button type="button" id="r1124Deploy">영웅 배치 · B</button><button type="button" id="r1124Return">영웅 복귀 · H</button>';stage.appendChild(bar);doc.getElementById('r1124Deploy').onclick=()=>DEF()?.open();doc.getElementById('r1124Return').onclick=()=>setBase(false);}
 if(bar){bar.hidden=!baseView;const s=doc.getElementById('r1124Status');s.textContent=selected?'배치 위치 선택됨 · 본영웅은 기존 명령 수행 후 자동 전투':'땅 클릭 → 배치 위치 선택 · 본영웅은 기존 명령 수행 후 자동 전투';}
 }catch(e){fail(e);}}
function keydown(ev){try{
 if(ev.ctrlKey||ev.metaKey||ev.altKey||editing(ev.target))return;
 if(ev.code==='KeyH'||String(ev.key||'').toLowerCase()==='h'){
  if(!here())return;if(ev.repeat){ev.preventDefault();return;}
  // 배치 창만 H로 닫고 복귀한다. 다른 선택/서사 창은 건드리지 않는다.
  if(G(()=>modal,false)){if(baseView&&G(()=>document.getElementById('r720Panel'),false))DEF()?.close();else return;}
  ev.preventDefault();ev.stopImmediatePropagation();toggle();return;
 }
 if(baseView&&/^Arrow/.test(ev.key)&&!G(()=>modal,false)){ev.preventDefault();ev.stopImmediatePropagation();}
 }catch(e){fail(e);}}
function pointerdown(ev){try{
 if(!baseView||!live()||G(()=>modal,false))return;
 const cv=G(()=>canvas)||G(()=>document.getElementById('game'));
 if(ev.target===cv){ev.preventDefault();ev.stopImmediatePropagation();const box=cv.getBoundingClientRect();
  const q=unproject((ev.clientX-box.left)*(G(()=>W,box.width)/box.width),(ev.clientY-box.top)*(G(()=>H,box.height)/box.height));
  if(selectPoint(q))DEF()?.open();return;}
 if(ev.target?.closest?.('#joystick')){ev.preventDefault();ev.stopImmediatePropagation();}
 }catch(e){fail(e);}}
if(typeof cameraTick==='function'){const base=cameraTick;cameraTick=function(...a){const r=base.apply(this,a);maintain();pin();return r;};}
if(typeof tick==='function'){const base=tick;tick=function(...a){maintain();
 const protecting=baseView&&live()&&!G(()=>modal||storyScene,false);
 const prior=protecting?{command:G(()=>command),target:G(()=>target),route:G(()=>route,[]),room:R(),owner:P()}:null;
 if(protecting)try{auto=true;}catch(_){}think();const r=base.apply(this,a);maintain();
 if(baseView&&live()){
  try{auto=true;}catch(_){}
  if(prior&&prior.owner===P()&&prior.room===R())try{
   // 자동 돌진이 명령을 지우더라도 먼저 내린 명령은 완료까지 이어 간다.
   // 엔진이 기존 배열에서 shift한 경유지는 다시 넣지 않는다.
   const enemy=prior.command!=null?G(()=>liveEnemies().find(e=>e.id===prior.command&&e.hp>0)):null;
   if(enemy&&command==null){command=prior.command;target=prior.target;}
   const end=prior.route.at(-1);
   if((prior.command==null||enemy)&&route!==prior.route&&!route.length&&end&&Math.hypot(player.x-end.x,player.y-end.y)>.4)route=prior.route;
  }catch(e){fail(e);}
 }
 pin();return r;};}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){selected=null;return base.apply(this,a);};}
if(typeof showTitle==='function'){const base=showTitle;showTitle=function(...a){reset();return base.apply(this,a);};}
window.addEventListener('keydown',keydown,true);window.addEventListener('pointerdown',pointerdown,true);
window.addEventListener('pointermove',ev=>{if(baseView&&!G(()=>modal,false)&&(ev.target===G(()=>canvas)||ev.target?.closest?.('#joystick'))){ev.preventDefault();ev.stopImmediatePropagation();}},true);
if(typeof setInterval==='function'){const timer=setInterval(()=>{maintain();updateUI();},300);timer?.unref?.();}
window.__STORYWORLD_SURVIVAL_COMMAND_R1124__=Object.freeze({revision:REV,toggle,setBase,placementPoint,selectPoint,focus:()=>baseView?point(R()?.survivalR600?.centre):null,
 state:()=>({baseView,selected:placementPoint(),stats:{...stats},lastError}),pure:{point},qaThink:think});
})();
