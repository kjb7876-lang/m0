// R1279 마우스 더블클릭 상호작용 — 사용자 2026-11-20 "마우스 더블클릭으로도 근처에 다가가면 상호작용가능하게".
//  전: 사람·문·상자·제단·출구는 가까이 가서 상호작용 키(E/C)를 눌러야만 열렸다. 마우스로는 한 번 클릭해 걸어가는 것까지만 됐다.
//  후: 상호작용 대상(커서가 '대화'·'사용'으로 읽는 것)을 더블클릭하면 영웅이 대상 앞까지 걸어가 닿는 거리에서 키와 같은 interact() 를 한 번 부른다. 이미 가까우면 바로.
//  · 기존 키·모바일 버튼·한 번 클릭(이동·공격)은 그대로. 적·바닥·줍기(구슬은 걸어가면 먹음)는 더블클릭해도 새 일을 하지 않는다.
//  · 취소: 새 클릭·이동 키·조이스틱·창·사망·구역 바뀜·15초 지남. 끄기: localStorage 'storyworld.r1279.dblclick' = 'off'.
(function(){'use strict';
const W0=window;if(W0.__STORYWORLD_DBLCLICK_USE_R1279__)return;
let off=false;try{off=W0.localStorage?.getItem('storyworld.r1279.dblclick')==='off';}catch(_){}
const REACH=1.9,TIMEOUT=15,MOVE_KEYS=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
const stats={armedCount:0,fired:0,cancelled:0,errors:0,lastError:null};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,160);};
let pend=null,tries=0;
// 대상별 닿는 거리(R1279b): 문 NPC 는 .85칸 안에서만 상호작용이 되므로 1.9칸에서 부르면 안 된다.
// 엔진 상호작용 목록(__STORYWORLD_WORLD_R74__.interactions)의 reach 를 우선, 없고 doorId 가 있으면 .85, 아니면 기본.
function reachOf(t){let r=NaN;try{const it=W0.__STORYWORLD_WORLD_R74__?.interactions?.().find(i=>i&&i.id===t.id);if(it&&Number.isFinite(it.reach)&&it.reach>0)r=it.reach;}catch(_){}
 if(!Number.isFinite(r)&&t.doorId)r=.85;
 return Number.isFinite(r)&&r>0?Math.min(REACH,Math.max(.3,r-.05)):REACH;}
const cur=()=>{try{return{zone,player,time:typeof time==='number'?time:0};}catch(_){return null;}};
const live=()=>{try{return started&&!modal&&!loading&&!(typeof storyScene!=='undefined'&&storyScene)&&player&&player.hp>0;}catch(_){return false;}};
// 시간 초과는 게임 시간 기준(느린 기기·헤드리스에서 실제 시간으로 재면 걷는 도중 취소된다, R1279b).
const now=()=>{try{if(typeof time==='number'&&Number.isFinite(time))return time;}catch(_){}return W0.performance&&W0.performance.now?W0.performance.now()/1000:Date.now()/1000;};
function cancel(){if(pend){pend=null;stats.cancelled++;}}
// 대상 둘레(대상 자리 → 반지름 1.1·1.6 여덟 방향) 중 영웅에게 가까우면서 길이 있는 곳으로 간다.
const ringRadii=reach=>reach>=1.6?[1.1,1.6]:[Math.max(.2,reach*.5),Math.max(.25,reach*.85)];
function approach(){try{const t=pend.target,p=player,cands=[{x:t.x,y:t.y}];
 for(const r of ringRadii(pend.reach))for(let i=0;i<8;i++){const a=i*Math.PI/4;cands.push({x:t.x+Math.cos(a)*r,y:t.y+Math.sin(a)*r});}
 const head=cands[0],ring=cands.slice(1).sort((a,b)=>distance(p,a)-distance(p,b));
 for(const c of [head,...ring]){const found=findPath(p,c);if(found&&found.length){route=found;target=null;command=null;return true;}}}catch(e){fail(e);}
 return false;}
function fire(){const t=pend;pend=null;route=[];target=null;command=null;stats.fired++;try{interact();}catch(e){fail(e);}return t;}
function tick(){if(!pend)return;try{
 const c=cur();if(!c||!live()||c.zone!==pend.zone||now()-pend.t0>TIMEOUT){cancel();return;}
 try{if(Math.hypot(joystickVector.x||0,joystickVector.y||0)>.2){cancel();return;}}catch(_){}
 if(distance(player,pend.target)<=pend.reach+1e-9){fire();return;}
 if(!(route&&route.length)){if(++tries>2||!approach())cancel();}}catch(e){fail(e);cancel();}}
function arm(h){const t=h&&h.target;if(!t||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!live())return false;
 pend={target:{id:t.id,x:t.x,y:t.y},reach:reachOf(t),zone:cur().zone,t0:now()};tries=0;stats.armedCount++;
 if(distance(player,pend.target)<=pend.reach+1e-9){fire();return true;}
 if(!approach()){cancel();return false;}return true;}
function onDbl(ev){if(off||!ev||ev.button===2)return;try{const GC=document.getElementById('game');if(!GC||!live())return;
 const r=GC.getBoundingClientRect(),x=ev.clientX-r.left,y=ev.clientY-r.top,API=W0.__STORYWORLD_CURSOR_R780__;if(!API||!API.classify)return;
 const h=API.classify(x,y,0);if(!h||(h.kind!=='talk'&&h.kind!=='use'))return;
 if(ev.preventDefault)ev.preventDefault();arm(h);}catch(e){fail(e);}}
function install(){const GC=document.getElementById('game');if(!GC)return false;
 GC.addEventListener('dblclick',onDbl);GC.addEventListener('pointerdown',()=>{cancel();},true);
 W0.addEventListener('keydown',e=>{const k=String(e&&e.key||'').toLowerCase();if(MOVE_KEYS.has(k))cancel();},true);
 setInterval(tick,100);return true;}
try{install();}catch(e){fail(e);}
W0.__STORYWORLD_DBLCLICK_USE_R1279__=Object.freeze({revision:'R1279-DBLCLICK-USE',reach:REACH,timeout:TIMEOUT,
 state:()=>({pending:pend?{...pend,target:{...pend.target}}:null,armedCount:stats.armedCount,fired:stats.fired,cancelled:stats.cancelled,errors:stats.errors,lastError:stats.lastError}),tick,arm,cancel});
})();
