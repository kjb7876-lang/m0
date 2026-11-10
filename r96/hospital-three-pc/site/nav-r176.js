// R176 — 뒤로가기·앞으로가기(사용자 2026-10-31 "UI 개선, 뒤로가기 앞으로가기 등 적용되게").
//  브라우저·휴대폰의 뒤로/앞으로(마우스 옆 단추, Alt+←/→ 포함)를 게임 창에 맞춘다.
//  · 창(메뉴·패시브 강화·기억·설정·도움말·영웅·지도·세계·지역 정보·쉼터)을 열 때마다 기록을 하나 쌓는다.
//    뒤로 = 바로 앞 창으로(메뉴 → 패시브 강화 → 뒤로 → 메뉴), 맨 앞이면 창 닫기. 앞으로 = 방금 뒤로 나온 창을 다시 연다.
//  · 창이 없을 때 뒤로 = 페이지를 떠나지 않고 메뉴를 연다(휴대폰에서 실수로 게임이 꺼지지 않게).
//  · 서사 장면이 떠 있는 동안 뒤로는 무시한다(장면 진행·읽음 기록은 장면 쪽 단추로).
//  · 창 위에 ◀ 뒤로 · 앞으로 ▶ 작은 단추를 붙인다(같은 동작).
//  저장·진행·판정은 건드리지 않는다. storyworld.r176.nav {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_NAV_R176__)return;
const REV='R176-nav-1',KEY='storyworld.r176.nav';
let prefs={on:true,buttons:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={pushed:0,back:0,forward:0,rootMenu:0,ignored:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const OPENERS=['showMenu','showUpgrades','showJournal','showSettings','showHelp','showHeroes','showAtlas','showWorld','showRegionInfo','showSanctuary'];
const LABEL={showMenu:'메뉴',showUpgrades:'패시브 강화',showJournal:'기억',showSettings:'설정',showHelp:'도움말',showHeroes:'영웅',showAtlas:'지도',showWorld:'세계',showRegionInfo:'지역 정보',showSanctuary:'쉼터'};
let stack=[],fwd=[],current=null,navigating=false,ignore=0,armed=false;
const H=()=>{try{return window.history;}catch(_){return null;}};
const ready=()=>prefs.on&&typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading);
const story=()=>typeof storyScene!=='undefined'&&!!storyScene;
function arm(){if(armed||!H())return;armed=true;try{H().replaceState({sw176:'base'},'');H().pushState({sw176:0},'');}catch(e){fail(e);}}
function open(name){const f=globalThis[name];if(typeof f!=='function')return false;navigating=true;try{f();}catch(e){fail(e);}finally{navigating=false;}return true;}
function bar(){if(!prefs.buttons)return;const p=document.getElementById('panel');if(!p||p.querySelector('#r176Nav'))return;
 if(!document.getElementById('r176Css')){const s=document.createElement('style');s.id='r176Css';s.textContent='#r176Nav{display:flex;gap:6px;margin:-4px 0 8px}#r176Nav button{padding:3px 10px;font-size:12px;border:1px solid #6b5a46;background:#1a1512cc;color:#e8d6bb;border-radius:4px;cursor:pointer}#r176Nav button:disabled{opacity:.35;cursor:default}#r176Nav span{font-size:12px;color:#bfa98a;align-self:center}';document.head.appendChild(s);}
 const d=document.createElement('div');d.id='r176Nav';const prev=stack.length>1?LABEL[stack[stack.length-2]]||'':'',next=fwd.length?LABEL[fwd[fwd.length-1]]||'':'';
 d.innerHTML='<button type="button" data-r176="back" title="뒤로 (Alt+←)">◀ '+(prev?prev:'닫기')+'</button><button type="button" data-r176="fwd" '+(fwd.length?'':'disabled')+' title="앞으로 (Alt+→)">'+(next||'앞으로')+' ▶</button>';
 d.querySelector('[data-r176="back"]').onclick=()=>{try{H().back();}catch(e){fail(e);}};d.querySelector('[data-r176="fwd"]').onclick=()=>{try{H().forward();}catch(e){fail(e);}};
 p.insertBefore(d,p.firstChild);}
try{
 for(const name of OPENERS){const base=globalThis[name];if(typeof base!=='function')continue;globalThis[name]=function(...a){const prev=current;current=name;try{return base.apply(this,a);}finally{current=prev;}};}
 if(typeof openPanel==='function'){const base=openPanel;openPanel=function(html,...a){const was=typeof modal!=='undefined'&&modal,r=base.call(this,html,...a);
   try{if(ready()&&!story()&&current&&H()){arm();if(!navigating){if(!(was&&stack[stack.length-1]===current)){stack.push(current);fwd=[];H().pushState({sw176:stack.length},'');stats.pushed++;}}bar();}}catch(e){fail(e);}return r;};}
 if(typeof closePanel==='function'){const base=closePanel;closePanel=function(...a){const r=base.apply(this,a);
   try{if(!navigating&&!(typeof modal!=='undefined'&&modal)&&stack.length&&H()){const n=stack.length;stack=[];fwd=[];ignore++;H().go(-n);}}catch(e){fail(e);}return r;};}
 addEventListener('popstate',ev=>{try{if(ignore>0){ignore--;stats.ignored++;return;}if(!ready())return;const st=ev.state&&ev.state.sw176;
   if(story()){H().pushState({sw176:stack.length},'');return;}// 서사 장면 중에는 제자리
   if(st==='base'){H().pushState({sw176:0},'');if(!(typeof modal!=='undefined'&&modal)&&open('showMenu')){stack=['showMenu'];fwd=[];H().pushState({sw176:1},'');stats.rootMenu++;bar();}return;}
   const d=Number(st)||0;
   if(d<stack.length){// 뒤로
    while(stack.length>d)fwd.push(stack.pop());stats.back++;
    if(stack.length&&open(stack[stack.length-1])){bar();}else{stack=[];navigating=true;try{closePanel(true);}finally{navigating=false;}}}
   else if(d>stack.length&&fwd.length){// 앞으로
    const name=fwd.pop();stack.push(name);stats.forward++;if(open(name))bar();}}catch(e){fail(e);}});
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_NAV_R176__=Object.freeze({revision:REV,set,OPENERS,stack:()=>[...stack],forward:()=>[...fwd],inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},stack:[...stack],fwd:[...fwd],lastError})});
})();
