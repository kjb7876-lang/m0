// R1126 — 777 개발자 시험 모드: 패시브 포인트 입력칸(사용자 2026-11-17 "777치트사용시 패시브포인트칸도만들어서
//  지정한만큼패시브포인트적용되게해줘").
//  ① 코드 창의 R970 레벨 칸 바로 아래에 '패시브 포인트(0~999999)' 칸이 나온다(레벨 칸과 같게 777 을 적거나 777 이 켜져 있을 때만).
//  ② 적용하면 적은 수가 그대로 남은 포인트(player.points — P 창 특수 패시브·스킬 강화에 쓰는 포인트)가 된다. 더하기가 아니라 지정.
//     빈칸·숫자 아님·Infinity 는 거절, 음수는 0, 소수는 내림, 999999 넘으면 999999. 레벨·기술 단계는 건드리지 않는다.
//  ③ 777 을 켜면서(코드 칸 적용) 이 칸을 고쳐 두었으면 켠 직후 그 값을 적용한다. 777 이 꺼져 있으면 아무것도 바꾸지 않는다.
//  포인트는 777 별도 슬롯 저장본에 그대로 들어가고(applyCaps 는 포인트를 건드리지 않음), 일반 진행 복귀 때 원래 포인트로 돌아간다.
//  새 키·자산·서사 변화 없음.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_CHEAT_POINTS_R1126__)return;
const REV='R1126-cheat-points-1',MIN=0,MAX=999999;
const C=()=>window.__STORYWORLD_CHEAT777__,on=()=>{try{return C()?.active?.()===true;}catch(_){return false;}};
const P=()=>typeof player==='object'&&player?player:null;
const stats={set:0,rejected:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
function parsePoints(v){if(v===null||v===undefined)return null;const s=typeof v==='number'?v:String(v).trim();if(s==='')return null;const x=Number(s);if(!Number.isFinite(x))return null;return Math.max(MIN,Math.min(MAX,Math.floor(x)));}
function setPoints(v){const p=P();if(!on()||!p){stats.rejected++;return{ok:false,message:'777 시험 모드가 켜져 있을 때만 패시브 포인트를 바꿀 수 있습니다.'};}
 const n=parsePoints(v);if(n==null){stats.rejected++;return{ok:false,message:'패시브 포인트는 '+MIN+'~'+MAX+' 사이 숫자로 적어 주세요.'};}
 p.points=n;stats.set++;
 try{saveGame(false);}catch(e){fail(e);}try{if(typeof updateHUD==='function')updateHUD();}catch(_){}
 return{ok:true,points:n};}
// ---- 코드 창 ------------------------------------------------------------------------------------------
const cur=()=>{const p=P();return p?Math.max(MIN,Math.min(MAX,Math.floor(Number(p.points)||0))):0;};
function augment(){const input=document.getElementById('story-code-input');if(!input||document.getElementById('r1126Points'))return;
 const anchor=document.getElementById('r970LevelRow')||document.getElementById('codeApply');if(!anchor)return;
 anchor.insertAdjacentHTML('afterend','<div id="r1126PointsRow" class="r1126-points"'+(on()?'':' hidden')+'><label for="r1126Points">패시브 포인트 ('+MIN+'~'+MAX+')</label><input id="r1126Points" type="number" inputmode="numeric" min="'+MIN+'" max="'+MAX+'" step="1" autocomplete="off" value="'+cur()+'" style="font-size:18px;width:110px;margin:8px"/>'+(on()?'<button id="r1126PointsApply">포인트 적용</button>':'')+'<p class="small">적은 수가 그대로 남은 패시브 포인트가 됩니다(더하기 아님). 레벨·배운 기술은 그대로입니다.</p></div>');
 const row=document.getElementById('r1126PointsRow'),box=document.getElementById('r1126Points'),msg=()=>document.getElementById('codeMessage');
 let dirty=false;box.addEventListener('input',()=>{dirty=true;});
 const live=()=>document.getElementById('r1126Points')||box;// 777 을 켜면 창이 다시 그려지므로 보여 주는 칸은 지금 칸
 const refresh=()=>{if(!dirty)live().value=String(cur());};
 const sync=()=>{if(row)row.hidden=!(on()||String(input.value).trim()==='777');};input.addEventListener('input',sync);sync();
 const say=t=>{const m=msg();if(m)m.textContent=t;};
 const run=()=>{try{const r=setPoints(box.value);if(r.ok){dirty=false;box.value=live().value=String(r.points);say('777 사용 중 · 남은 패시브 포인트 '+r.points+'점');}else say(r.message||'적용하지 못했습니다.');return r;}catch(e){fail(e);say('적용 실패: '+(e&&e.message||e));return{ok:false};}};
 box.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();run();}});box.addEventListener('keyup',e=>e.stopPropagation());
 // 코드 칸 적용(777 켜기)·레벨 적용 뒤: 이 칸을 고쳐 두었으면 그 값을 적용, 아니면 바뀐 포인트를 칸에 보여 준다.
 const after=async(old,el,e)=>{const r=old?await old.call(el,e):undefined;try{if(on()){if(dirty&&String(box.value).trim()!=='')run();else refresh();}}catch(err){fail(err);}return r;};
 const apply=document.getElementById('codeApply');if(apply){const old=apply.onclick;apply.onclick=e=>after(old,apply,e);}
 const la=document.getElementById('r970LevelApply');if(la){const old=la.onclick;la.onclick=e=>after(old,la,e);}
 const pa=document.getElementById('r1126PointsApply');if(pa)pa.onclick=()=>run();}
if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){const r=base.apply(this,a);try{if(typeof a[0]==='string'&&a[0].includes('story-code-input'))Promise.resolve().then(()=>Promise.resolve()).then(()=>{try{augment();}catch(e){fail(e);}});}catch(e){fail(e);}return r;};}
window.__STORYWORLD_CHEAT_POINTS_R1126__=Object.freeze({rev:REV,setPoints,parsePoints,range:[MIN,MAX],inspect:()=>({rev:REV,active:on(),points:cur(),stats:{...stats},lastError})});
})();
