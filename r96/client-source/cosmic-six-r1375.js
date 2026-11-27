// R1375 교주의 사몽(cult04 STORY) 마지막 기억의 전투 — 교주의 '지배 연결' 대수문장 6마리 동시 소환.
//  사용자 2026-11-27 07:21Z "교주의사몽에서 마지막 기억의전투에서 교주가 사몽쓰는거 적보스 6마리가 한번에 나오게 하라니까 차례대로 하나씩나오는게 아니라".
//  왜 예전 요청이 안 먹혔나: R1114(cult-six-r1114)는 DREAM 층 사몽 시련(spawnTrial3, cult04:trial)만 한꺼번에로 바꿨다.
//   STORY 층 최종 결전의 지배 연결(spawnCosmic3, 대수문장 kair-great-01~06)은 엔진 그대로 제단마다 1마리씩 6번이었다.
//  지금: 지배 연결 제단 한 번에 남은 대수문장(보통 6마리)을 한꺼번에 소환한다. 체력(220+40n 식)·이름·그림·패턴은 예전 그 단계 그대로.
//   자리는 R950 신경선이 뻗는 방향(합일 코어 둘레 여섯 갈래) 끝에 하나씩 — 대수문장마다 자기 연결선 끝에 선다. 막히면 가까운 빈 자리.
//   하나 잡을 때마다 cosmicIndex(끊긴 연결 수)가 늘어 R950 신경선이 한 가닥씩 끊긴다. 6마리를 다 잡아야 최종 형태(되살아난 교주) 준비로 넘어간다.
//  저장 구조 그대로: 전투 중 저장 뒤 불러오면 cosmicIndex 부터 남은 수만큼 다시 한꺼번에 소환한다.
//  끄기: localStorage['storyworld.r1375.cosmicSix']='0'.  점검: window.__STORYWORLD_COSMIC_SIX_R1375__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_COSMIC_SIX_R1375__)return;
const REV='R1375-cosmic-six-1',KEY='storyworld.r1375.cosmicSix',N=6,RADIUS=5.6;
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={hpMatched:0,sixSummons:0,spawned:0,progress:0,finishes:0,nudged:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const live=()=>{try{return typeof room!=='undefined'&&!!room&&typeof zone!=='undefined'&&zone==='cult04'&&room.id==='cult04'&&!room.survivalR600&&typeof layer!=='undefined'&&layer==='STORY';}catch(_){return false;}};
const free=(x,y)=>{try{return !blocked(x,y,.8,room);}catch(_){return true;}};
function core(){const o=room.objective;return o&&Number.isFinite(o.x)&&Number.isFinite(o.y)?{x:o.x,y:o.y}:{x:16,y:12};}
// R950 linkEnd 와 같은 각도(-90° + i·60° + .35) — 신경선 끝 방향
function spot(i){const c=core(),a=-Math.PI/2+i*Math.PI*2/N+.35;return [c.x+Math.cos(a)*RADIUS,c.y+Math.sin(a)*RADIUS];}
function place(e,i){const [sx,sy]=spot(i);let x=sx,y=sy,moved=false;
 if(!free(x,y)){const c=core();outer:for(let r=.5;r<=6;r+=.5)for(let k=0;k<12;k++){const a=k*Math.PI/6,qx=sx+Math.cos(a)*r,qy=sy+Math.sin(a)*r;if(free(qx,qy)&&Math.hypot(qx-c.x,qy-c.y)>=3){x=qx;y=qy;moved=true;break outer;}}}
 if(moved)stats.nudged++;e.x=e.homeX=x;e.y=e.homeY=y;}
const idxOf=e=>{const m=/^cult04:cosmic:(\d)$/.exec(String(e?.id||''));return m?+m[1]:-1;};
const sixOf=R=>(R.enemies||[]).filter(e=>e&&e.cosmic&&idxOf(e)>=0);
function six(base,args,self){
 const R=room,start=Math.max(0,Math.min(N,R.cosmicIndex|0));
 const keep=R.enemies.filter(e=>!e.cosmic),got=[],orig=window.summon3;let ok=false,summoned=null,res;
 if(start>=N-1)return base.apply(self,args);
 try{
  window.summon3=function(list){for(const e of list||[])if(!got.includes(e))got.push(e);return true;};// 모으기만(소환은 끝에서 한 번에)
  // 한 마리씩 엔진 그대로 만들고 곧바로 방에서 잠시 뺀다(R63 난이도 배율이 예전처럼 새 개체 하나에만 붙게).
  for(let i=start;i<N-1;i++){R.cosmicIndex=i;base.apply(self,args);const e=R.enemies.find(a=>a.id==='cult04:cosmic:'+i);if(e){if(!got.includes(e))got.push(e);R.enemies=R.enemies.filter(a=>a!==e);}}
  // 마지막 한 마리는 진짜 소환과 함께: 모은 것을 방에 되돌리고, 엔진 안의 summon3 호출에 모두 실어 한 번에 소환한다.
  //  그래야 소환 뒤 R71 체력 맞춤(spawnCosmic3 감싸기의 normalizeBoss)이 예전처럼 대수문장마다 한 번씩 돌아 체력이 예전 그 값이 된다.
  R.enemies=[...keep,...got];got.forEach(e=>place(e,idxOf(e)));
  window.summon3=function(list,...rest){const all=[...new Set([...got,...(list||[])])];all.forEach(e=>{place(e,idxOf(e));e.cosmic=true;});summoned=all;return orig.call(this,all,...rest);};
  R.cosmicIndex=N-1;res=base.apply(self,args);
  ok=true;
 }finally{window.summon3=orig;R.cosmicIndex=start;}
 const uniq=(summoned||[]).filter(e=>e&&idxOf(e)>=0);
 if(!ok||!summoned){R.r1375Six=false;return res;}
 R.r1375Six=true;R.r1375Start=start;stats.sixSummons++;stats.spawned+=uniq.length;
 // 안쪽 구도 보정(RC150 등)이 보스를 영웅 곁으로 옮길 수 있어 소환 뒤에 다시 편다
 // 체력: 엔진은 소환 뒤 R63 난이도 배율(새 개체만)→R71 보스 체력 맞춤 순서로 대수문장 체력을 정한다(그래서 예전엔 단계마다 같은 값).
 //  한꺼번에 소환하면 앞 다섯은 '새 개체'가 아니어서 그 마지막 맞춤을 못 받는다 → 엔진 길을 그대로 탄 마지막 대수문장의 체력 값을 나머지에 똑같이 준다.
 const ref=uniq.find(e=>idxOf(e)===N-1);
 if(ref&&Number.isFinite(ref.maxHp)&&ref.maxHp>0)for(const e of uniq){if(e===ref)continue;
  for(const k of Object.keys(ref))if(/^(healthR71|difficulty)/.test(k)&&typeof ref[k]!=='object')e[k]=ref[k];
  e.maxHp=ref.maxHp;e.hp=ref.maxHp*(ref.hp/ref.maxHp);stats.hpMatched++;}
 if(res!==false)uniq.forEach(e=>{place(e,idxOf(e));e.nav=[];});
 return res;}
const fighting=()=>on&&live()&&room.r1375Six&&room.activeEncounter==='cosmic';
// 하나 잡을 때마다 끊긴 연결 수 = 처음 + 잡은 수(남은 게 있으면 최대 5). R950 신경선이 한 가닥씩 끊긴다.
function progress(){if(!fighting())return;const s=sixOf(room),alive=s.filter(e=>e.hp>0&&!e.deadRecorded).length;if(!alive)return;
 const v=Math.min(N-1,N-alive);if(v!==room.cosmicIndex){room.cosmicIndex=v;stats.progress++;}}
function install(){
 try{const base=window.spawnCosmic3;if(typeof base==='function'&&!base.__r1375){const w=function(...a){try{if(on&&live()&&(room.cosmicIndex|0)<N-1)return six(base,a,this);if(on&&live())room.r1375Six=false;}catch(e){fail(e);}return base.apply(this,a);};w.__r1375=true;window.spawnCosmic3=w;}}catch(e){fail(e);}
 try{if(typeof finishEncounter==='function'&&!finishEncounter.__r1375){const f=finishEncounter;const w=function(...a){try{if(fighting()&&!room.finalizing&&!(typeof liveEnemies==='function'&&liveEnemies().some(e=>e.boss||e.midboss||e.cosmic))){room.cosmicIndex=N-1;room.r1375Six=false;stats.finishes++;}}catch(e){fail(e);}return f.apply(this,a);};w.__r1375=true;finishEncounter=w;}}catch(e){fail(e);}
 try{if(typeof window.killEnemy==='function'&&!window.killEnemy.__r1375){const k=window.killEnemy;const w=function(...a){const r=k.apply(this,a);try{if(a[0]?.cosmic)progress();}catch(e){fail(e);}return r;};w.__r1375=true;window.killEnemy=w;}}catch(e){fail(e);}
 return !!(window.spawnCosmic3?.__r1375);}
install();try{if(!window.spawnCosmic3?.__r1375)setTimeout(install,300);}catch(_){}
function set(v){if(v&&typeof v==='object'&&typeof v.on==='boolean')on=v.on;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return {on};}
window.__STORYWORLD_COSMIC_SIX_R1375__=Object.freeze({revision:REV,spot,install,set,six:()=>!!room?.r1375Six,
 inspect:()=>({revision:REV,on,installed:!!window.spawnCosmic3?.__r1375,stats:{...stats},lastError,presentationOnly:false,gameplayChanged:true})});
})();
