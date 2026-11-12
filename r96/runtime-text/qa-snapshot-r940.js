// R940 상태 스냅샷(읽기 전용) — 사용자 2026-11-12 "확실하게 사용하면 좋을것만 개선해서 충돌없이 버그없이 적용"
//  (외부 프로토타입 '불씨의 서약' 검토에서 고른 것: 공개판에도 상태를 한 번에 읽는 함수를 두어, 만든 쪽이 아닌 점검자가 숫자로 재게 한다).
//  하는 일: 0.25초마다 엔진 값(room·player·time)을 읽기만 해서 사건을 적는다.
//   · enter 지역 입장 · reload 같은 지역 불러오기 · heroHit 영웅 피격(피해량, 입장 뒤 몇 초) · heroDown 쓰러짐 · kill 처치 · bossDown 보스 처치(걸린 게임 시간) · rewind 불러오기
//   · snapshot(): 지금 지역·시간·영웅 체력·적 수(깨어 있음/숨음/보스)·누계·입장 뒤 첫 피격 시간·보스 처치 기록
//  하지 않는 일: 게임 값 쓰기, 엔진 함수 감싸기, 그리기, 소리, 저장. 화면·밸런스·조작 변화 없음.
//  쓰는 법(검사 스크립트·콘솔): __STORYWORLD_SNAPSHOT_R940__.snapshot() / .events() / .reset() / .stop() / .start()
(()=>{'use strict';
if(window.__STORYWORLD_SNAPSHOT_R940__)return;
const REV='R940-snapshot-1',CAP=120,EVERY=250;
const num=v=>typeof v==='number'&&Number.isFinite(v)?v:null,r2=v=>v===null?null:Math.round(v*100)/100;
let events=[],counters,entry,fights,prev,seen=new WeakSet(),dead=new WeakSet(),open=new WeakMap(),watch=[],errors=0,lastError=null,timer=null;
const clear=()=>{events=[];counters={kills:0,heroHits:0,heroDamage:0,heroDowns:0,bossKills:0};entry={zone:null,t:null,firstHitAfter:null};fights=[];prev=null;seen=new WeakSet();dead=new WeakSet();open=new WeakMap();watch=[];};
clear();
const push=e=>{events.push(e);if(events.length>CAP)events.splice(0,events.length-CAP);};
// 엔진 이름은 제목 화면 전에는 없을 수 있다 → 하나씩 typeof 로 묻는다
const read=()=>{
 const R=typeof room!=='undefined'?room:null,P=typeof player!=='undefined'?player:null,T=num(typeof time!=='undefined'?time:null);
 const list=R&&Array.isArray(R.enemies)?R.enemies:[];
 return{R,P,T,list,zone:R&&typeof R.id==='string'?R.id:null,hp:P?num(P.hp):null,
  isStarted:typeof started!=='undefined'?!!started:null,isLoading:typeof loading!=='undefined'?!!loading:null};
};
const alive=e=>!!e&&num(e.hp)!==null&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
// 최대 체력은 엔진 maxHP() 가 준다(player.maxHp 는 없다). 읽기 전용 계산이라 불러도 상태가 바뀌지 않는다
const maxOf=P=>{try{if(typeof maxHP==='function'){const v=num(maxHP());if(v!==null)return v;}}catch(_){return null;}return num(P.maxHp);};
const nameOf=e=>{const v=e.name||e.label||e.title||e.type||e.kind;return typeof v==='string'?v:null;};
function look(e,s,next){
 if(!e||typeof e!=='object')return;const hp=num(e.hp);if(hp===null)return;
 if(alive(e)){seen.add(e);if(next)next.push(e);
  if(e.boss&&!open.has(e)&&num(e.maxHp)!==null&&hp<e.maxHp){const f={zone:s.zone,name:nameOf(e),start:s.T,end:null,ttk:null,maxHp:e.maxHp};open.set(e,f);fights.push(f);if(fights.length>40)fights.shift();}
 }else if(hp<=0&&seen.has(e)&&!dead.has(e)){dead.add(e);counters.kills++;push({type:'kill',t:s.T,zone:s.zone,boss:!!e.boss,name:nameOf(e)});
  if(e.boss){counters.bossKills++;let f=open.get(e);if(!f){f={zone:s.zone,name:nameOf(e),start:s.T,end:null,ttk:null,maxHp:num(e.maxHp)};fights.push(f);}f.end=s.T;f.ttk=s.T-f.start;push({type:'bossDown',t:s.T,zone:s.zone,name:f.name,ttk:f.ttk});}
 }
}
function step(){
 const s=read();if(!s.R||!s.P||s.T===null||s.zone===null)return;
 const rewind=!!prev&&s.T<prev.T,moved=!prev||prev.zone!==s.zone;
 // 같은 지역에서 시간이 같거나 뒤인 저장을 불러오면 시간은 안 줄지만 지역·영웅 객체가 새로 만들어진다 → 객체가 바뀌었는지도 본다
 const reload=!!prev&&!moved&&!rewind&&prev.R!==s.R,swapped=!!prev&&prev.P!==s.P;
 if(reload)push({type:'reload',t:s.T,zone:s.zone});
 if(rewind)push({type:'rewind',t:s.T,from:prev.T,zone:s.zone});
 if(rewind||reload){seen=new WeakSet();dead=new WeakSet();open=new WeakMap();for(const f of fights)if(f.end===null)f.end=undefined;fights=fights.filter(f=>f.end!==undefined);}
 if(moved||rewind||reload){entry={zone:s.zone,t:s.T,firstHitAfter:null};if(moved)push({type:'enter',t:s.T,zone:s.zone});}
 else if(!swapped&&s.hp!==null&&prev.hp!==null){
  if(s.hp<prev.hp){const dmg=prev.hp-s.hp,since=s.T-entry.t;counters.heroHits++;counters.heroDamage+=dmg;if(entry.firstHitAfter===null)entry.firstHitAfter=since;push({type:'heroHit',t:s.T,zone:s.zone,dmg,hp:s.hp,sinceEntry:since});}
  if(prev.hp>0&&s.hp<=0){counters.heroDowns++;push({type:'heroDown',t:s.T,zone:s.zone});}
 }
 if(moved||rewind||reload)watch=[];
 // 엔진 killEnemy 는 죽은 적을 같은 프레임에 room.enemies 에서 뺀다 → 지난번에 살아 있던 적(watch)도 함께 본다
 const now=new Set(s.list),next=[];
 for(const e of s.list)look(e,s,next);
 for(const e of watch)if(!now.has(e))look(e,s,null);
 watch=next;
 prev={T:s.T,zone:s.zone,hp:s.hp,R:s.R,P:s.P};
}
function tick(){try{step();}catch(err){errors++;lastError=String(err&&err.message||err).slice(0,160);}}
function snapshot(){
 const out={rev:REV,ready:false,errors,lastError,started:null,loading:null,zone:null,time:null,hero:null,enemies:{total:0,alive:0,active:0,hidden:0,bosses:[]},phase:null,
  counters:{...counters},entry:{...entry},bossFights:fights.map(f=>({...f})),eventCount:events.length};
 try{const s=read();Object.assign(out,{started:s.isStarted,loading:s.isLoading,zone:s.zone,time:s.T});
  if(s.P)out.hero={id:typeof s.P.hero==='string'?s.P.hero:(s.P.hero&&typeof s.P.hero.id==='string'?s.P.hero.id:null),hp:s.hp,maxHp:maxOf(s.P),x:r2(num(s.P.x)),y:r2(num(s.P.y))};
  out.enemies.total=s.list.length;
  for(const e of s.list){if(!alive(e))continue;out.enemies.alive++;if(e.spawnState==='hidden')out.enemies.hidden++;else if(e.spawnState==='active'||e.spawnState===undefined)out.enemies.active++;
   if(e.boss)out.enemies.bosses.push({name:nameOf(e),hp:e.hp,maxHp:num(e.maxHp),x:r2(num(e.x)),y:r2(num(e.y))});}
  const W=window.__STORYWORLD_WORLD_COMBAT_R78__;if(W&&typeof W.state==='function'&&s.R){const st=W.state(s.R);out.phase=st&&typeof st.phase==='string'?st.phase:null;}
  out.ready=!!(s.R&&s.P&&s.T!==null&&s.zone!==null);
 }catch(err){errors++;lastError=String(err&&err.message||err).slice(0,160);out.errors=errors;out.lastError=lastError;}
 return out;
}
const start=()=>{if(timer===null)timer=setInterval(tick,EVERY);return true;},stop=()=>{if(timer!==null){clearInterval(timer);timer=null;}return true;};
window.__STORYWORLD_SNAPSHOT_R940__=Object.freeze({rev:REV,snapshot,tick,events:()=>events.map(e=>({...e})),reset:()=>{clear();return true;},start,stop});
start();
})();
