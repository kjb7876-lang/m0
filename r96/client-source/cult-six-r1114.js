// R1114 교주 사몽(cult04 DREAM) 시련 보스 6마리 동시 소환 — 사용자 2026-11-16 11:26Z "교주사몽 지금 보스6마리 차례차례소환하잖아 이거 한번에 6마리 소환하게 해줘".
//  원래: 제단마다 시련 보스 1마리(u203·last303·kair03·hando03·ep1a11·cult04 기증 보스)를 6번 차례로 소환하고, 하나 잡으면 '사몽 시련 n / 6' 로 다음 제단 대기 → 6번째 뒤 페르소나 결전.
//  지금: 제단에서 한 번 소환하면 남은 시련 보스(보통 6마리)를 한꺼번에 소환한다. 각자 체력·이름·그림·패턴은 예전 그 시련 그대로(기증 보스·체력 300+90n 식 그대로),
//        자리만 겹치지 않게 보스방 위쪽 두 줄(3+3)에 펼친다. 6마리를 모두 잡아야 시련이 끝나고 페르소나 결전 준비(preparePersona3)로 넘어간다.
//  방법: 엔진의 spawnTrial3(R63 배율·R71 보스 정규화 감싸기가 이미 얹힌 것)을 시련 번호별로 불러 보스를 만들되, 그 안의 summon3 만 잠깐 가로채 모아서 한 번에 소환한다.
//        종료는 finishEncounter 를 감싸 마지막 시련 번호로 맞춰 준다. 판정·피해·저장 구조는 그대로(저장은 trialIndex 그대로라, 전투 중 저장 뒤 불러오면 남은 시련을 다시 한꺼번에 소환).
//  끄기: localStorage['storyworld.r1114.cultSix']='0'.  점검: window.__STORYWORLD_CULT_SIX_R1114__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_CULT_SIX_R1114__)return;
const REV='R1114-cult-six-1',KEY='storyworld.r1114.cultSix';
// 보스방(약 x 1~28, y 1~22)의 위쪽 두 줄. 영웅 시작 (15,19)에서 9칸 넘게 떨어지고 서로 4칸 이상.
const SPOTS=Object.freeze([[8,5.5],[15,5.5],[22,5.5],[9,10],[15,10],[21,10]]);
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={sixSummons:0,spawned:0,finishes:0,nudged:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const live=()=>{try{return typeof room!=='undefined'&&!!room&&typeof zone!=='undefined'&&zone==='cult04'&&typeof layer!=='undefined'&&layer==='DREAM';}catch(_){return false;}};
const free=(x,y)=>{try{return !blocked(x,y,.8,room);}catch(_){return true;}};
// 자리가 막혀 있으면 가까운 열린 자리로(반경을 넓혀 가며 8방향)
function place(e,[sx,sy]){let x=sx,y=sy,moved=false;
 if(!free(x,y)){outer:for(let r=1;r<=6;r++)for(let k=0;k<8;k++){const a=k*Math.PI/4,qx=sx+Math.cos(a)*r,qy=sy+Math.sin(a)*r;if(free(qx,qy)){x=qx;y=qy;moved=true;break outer;}}}
 if(moved)stats.nudged++;e.x=e.homeX=x;e.y=e.homeY=y;}
function six(base,args,self){
 const R=room,start=Math.max(0,Math.min(6,R.trialIndex|0));
 const keep=R.enemies.filter(e=>!e.boss||e.midboss),got=[],orig=window.summon3;
 let ok=false;
 try{
  window.summon3=function(list){for(const e of list||[])got.push(e);return true;};// 모으기만(소환은 끝에서 한 번에)
  for(let i=start;i<6;i++){R.trialIndex=i;base.apply(self,args);const e=R.enemies.find(a=>a.id==='cult04:trial:'+i);if(e)got.push(e);R.enemies=R.enemies.filter(a=>a!==e);}
  ok=true;
 }finally{window.summon3=orig;R.trialIndex=start;}
 const uniq=[...new Set(got)].filter(e=>e&&e.id&&String(e.id).startsWith('cult04:trial:'));
 if(!ok||uniq.length<=1){// 만들기 실패나 1마리뿐이면 예전 방식으로(이미 만든 것은 버리고 한 번 더 기본 호출)
  R.enemies=keep;R.trialIndex=start;return base.apply(self,args);}
 R.enemies=[...keep,...uniq];
 uniq.forEach((e,i)=>{place(e,SPOTS[i%SPOTS.length]);e.trial=true;});
 R.r1114Six=true;stats.sixSummons++;stats.spawned+=uniq.length;
 const r=orig.call(self,uniq,'trial');// 안쪽 구도 보정(RC150 등)이 보스를 영웅 곁으로 옮기므로 소환 뒤에 다시 펼친다
 if(r!==false)uniq.forEach((e,i)=>{place(e,SPOTS[i%SPOTS.length]);e.nav=[];});
 return r;}
function install(){
 try{const base=window.spawnTrial3;if(typeof base==='function'&&!base.__r1114){const w=function(...a){try{if(on&&live()&&room.trialIndex<6)return six(base,a,this);}catch(e){fail(e);}return base.apply(this,a);};w.__r1114=true;window.spawnTrial3=w;}}catch(e){fail(e);}
 try{if(typeof finishEncounter==='function'&&!finishEncounter.__r1114){const f=finishEncounter;const w=function(...a){try{if(on&&live()&&room.r1114Six&&room.activeEncounter==='trial'&&!room.finalizing&&!(typeof liveEnemies==='function'&&liveEnemies().some(e=>e.boss||e.midboss))){room.trialIndex=5;stats.finishes++;}}catch(e){fail(e);}return f.apply(this,a);};w.__r1114=true;finishEncounter=w;}}catch(e){fail(e);}
 return !!(window.spawnTrial3?.__r1114);}
install();try{if(!window.spawnTrial3?.__r1114)setTimeout(install,300);}catch(_){}
function set(v){if(v&&typeof v==='object'&&typeof v.on==='boolean')on=v.on;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return {on};}
window.__STORYWORLD_CULT_SIX_R1114__=Object.freeze({revision:REV,SPOTS,install,set,six:()=>!!room?.r1114Six,
 inspect:()=>({revision:REV,on,installed:!!window.spawnTrial3?.__r1114,stats:{...stats},lastError,presentationOnly:false,gameplayChanged:true})});
})();
