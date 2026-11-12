// R905 보스 앞 집결 구간 나눠 깨우기 — 사용자 2026-11-12 "스토리모드 적들 몰리는 보스앞구간 한번에 다 생성하지말고 절반씩나눠서 두번생성해"
//  → "꼭 두번말고 2-6번 사이에서 너가 변칙도 주면서 적용해줘 스토리모드 모든맵 서사에 맞추면 더 좋고".
//  원인(main dcde9f1 헤드리스 전수, qa/r905/census.json): 스토리 지역 48곳은 보스 문 앞 중앙 전투실에 들어서면 R78 rally() 가
//   살아 있는 필드 적 전부(일반 몹 + 표식 중간보스, 지역마다 33~52마리)를 한 번에 집결 자리로 옮겨 깨운다.
//  → 집결 자리는 R78 이 정한 그대로 두고, 깨우는 것만 지역마다 정한 2~6묶음으로 나눈다(첫 묶음은 바로, 나머지는 숨김 → 차례로).
//   다음 묶음이 나오는 때(이른 쪽): ① 깨어 있는 적이 0 → 0.4초 뒤 ② 깨어 있는 적이 직전 묶음의 ratio(20~50%) 이하 → 1.2초 뒤
//   ③ 지역별 간격(gap 6~16초, 묶음마다 ±20% 어긋남)이 지났고 깨어 있는 적이 상한(전체의 절반, 최소 8) 이하.
//   그래서 아무도 안 잡고 버텨도 동시에 깨어 있는 적은 절반쯤을 넘지 않는다.
//  총 적 수·체력·피해·처치 목표(HUD 남은 수)·기억 글은 그대로다. 새 그림·이펙트 없음(엔진 웨이브처럼 유예 0.9초 뒤 움직임).
//  하지 않는 곳: 영화 모드(R461), 협동·특수 지역(R78 controlled 가 아님), 맘몬의 금고 ep1b06(사용자 승인 대상이라 손대지 않음).
//  끄기: localStorage['storyworld.r905.rallyWaves']='{"on":false}' 또는 __STORYWORLD_RALLY_WAVES_R905__.set(false)
(()=>{'use strict';
if(window.__STORYWORLD_RALLY_WAVES_R905__)return;
const REV='R905-rally-waves-1',KEY='storyworld.r905.rallyWaves',SKIP=new Set(['ep1b06']);
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
// 지역별 표: [묶음 수, 크기 모양, 나오는 차례, 표식 중간보스 자리, 간격(초), 다음 묶음 기준 비율] — 풀이는 docs/rally-waves-r905.md
//  모양: even 고르게 · cres 점점 많이 · decr 처음에 많이 · pulse 많고 적게 번갈아 · odd 들쭉날쭉(지역 이름으로 정해짐)
//  차례: near 영웅 곁부터 · far 먼 쪽부터 · sector 방을 한 바퀴 돌며 · route 다른 길에서 온 적부터 · kind 같은 종류끼리 · mix 섞어서
//  중간보스: last 마지막 묶음 · lead 첫 묶음 · spread 뒤 묶음부터 하나씩
const TABLE={
 dist00:[3,'cres','near','last',10,.34],dist01:[6,'even','sector','spread',7,.4],dist02:[4,'pulse','far','last',13,.3],dist03:[3,'decr','route','last',9,.34],
 dist04:[5,'cres','kind','spread',9,.4],dist05:[6,'odd','sector','last',8,.34],dist06:[2,'decr','mix','lead',8,.3],
 ep1a09:[3,'pulse','kind','last',9,.34],ep1a09b:[4,'even','route','lead',10,.3],ep1a10:[5,'odd','kind','spread',8,.4],ep1a11:[2,'cres','far','last',12,.25],
 ep1b01:[6,'cres','sector','last',7,.4],ep1b02:[2,'even','far','spread',16,.2],ep1b03:[3,'odd','near','lead',9,.4],ep1b04:[5,'cres','kind','last',8,.4],
 ep1b05:[4,'pulse','sector','spread',9,.34],ep1b06b:[2,'pulse','far','last',12,.3],ep1b07:[3,'decr','mix','lead',6,.5],ep1b08:[4,'cres','route','lead',10,.3],ep1b09:[5,'even','sector','spread',8,.34],
 u201:[6,'even','sector','lead',7,.4],u202:[3,'odd','near','last',10,.34],u204:[4,'pulse','mix','spread',9,.34],u205:[2,'cres','route','last',12,.25],u206:[6,'cres','kind','spread',7,.4],u203:[3,'even','sector','last',10,.34],
 last304:[2,'even','kind','last',11,.3],last305:[4,'pulse','kind','last',8,.4],last302:[5,'odd','far','spread',12,.3],last303:[6,'cres','near','last',9,.34],
 kair01:[6,'even','kind','last',8,.4],kair04:[4,'odd','sector','spread',9,.34],kair05:[3,'pulse','mix','lead',7,.5],kair06:[2,'decr','far','last',13,.25],
 kair07:[5,'cres','route','spread',8,.4],kair08:[4,'even','sector','lead',9,.34],kair09:[3,'odd','far','last',13,.3],kair10:[2,'decr','near','spread',7,.4],
 murder01:[3,'pulse','route','last',9,.34],murder02:[4,'cres','near','lead',7,.4],murder04:[3,'even','kind','last',10,.34],murder03:[6,'even','mix','spread',7,.4],
 cult01:[2,'even','mix','lead',11,.25],cult02:[5,'decr','route','lead',8,.4],cult05:[4,'odd','kind','spread',9,.34],cult06:[3,'cres','sector','last',10,.34],cult03:[6,'cres','far','last',8,.4]};
const SHAPES=['even','cres','decr','pulse','odd'],ORDERS=['near','far','sector','route','kind','mix'],CHAMPS=['last','lead','spread'];
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
function styleFor(zone){const t=TABLE[zone],h=hash(String(zone));if(t)return{n:t[0],shape:t[1],order:t[2],champ:t[3],gap:t[4],ratio:t[5],table:true,h};
 return{n:2+h%5,shape:SHAPES[(h>>>3)%5],order:ORDERS[(h>>>6)%6],champ:CHAMPS[(h>>>9)%3],gap:7+(h>>>12)%7,ratio:.3+((h>>>16)%3)*.05,table:false,h};}
const weight=(shape,i,n,h)=>shape==='cres'?i+1:shape==='decr'?n-i:shape==='pulse'?(i%2?1:2):shape==='odd'?1+((h>>>(i*3+2))&3):1;
// 크기: 묶음마다 최소 2, 나머지는 모양 비율로, 한 묶음은(같이 나오는 표식 중간보스까지 쳐서) 전체의 55% 를 넘지 않게
function sizes(total,n,shape,h,cap){const out=Array(n).fill(2),w=out.map((_,i)=>weight(shape,i,n,h)),sum=w.reduce((a,b)=>a+b,0);let rest=total-2*n;const add=w.map(v=>Math.floor(rest*v/sum));
 add.forEach((v,i)=>{out[i]+=v;});rest-=add.reduce((a,b)=>a+b,0);const by=w.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]);for(let k=0;rest>0;k++,rest--)out[by[k%n][1]]++;
 const max=Math.max(2,Math.ceil(total/n),cap||Math.ceil(total*.55));for(let guard=0;guard<64;guard++){const hi=out.indexOf(Math.max(...out));if(out[hi]<=max)break;const lo=out.indexOf(Math.min(...out));out[hi]--;out[lo]++;}
 return out;}
const sid=e=>String(e.id);
function ordered(list,st,ctx,zone){const p=ctx.player||{x:0,y:0},a=ctx.anchor||p,d=e=>Math.hypot(e.x-p.x,e.y-p.y),tie=(x,y)=>sid(x)<sid(y)?-1:sid(x)>sid(y)?1:0,L=[...list];
 if(st.order==='near')return L.sort((x,y)=>d(x)-d(y)||tie(x,y));
 if(st.order==='far')return L.sort((x,y)=>d(y)-d(x)||tie(x,y));
 if(st.order==='sector'){const off=(st.h%360)*Math.PI/180,ang=e=>{let v=Math.atan2(e.y-a.y,e.x-a.x)-off;v%=Math.PI*2;if(v<0)v+=Math.PI*2;return v;};return L.sort((x,y)=>ang(x)-ang(y)||tie(x,y));}
 if(st.order==='route'){const r=ctx.route;return L.sort((x,y)=>((x.wardRouteR81===r)-(y.wardRouteR81===r))||d(x)-d(y)||tie(x,y));}
 if(st.order==='kind'){const c=new Map();for(const e of L)c.set(e.nativeId,(c.get(e.nativeId)||0)+1);const k=e=>String(e.nativeId);return L.sort((x,y)=>(c.get(y.nativeId)-c.get(x.nativeId))||(k(x)<k(y)?-1:k(x)>k(y)?1:0)||tie(x,y));}
 const m=e=>hash(zone+'|'+sid(e));return L.sort((x,y)=>m(x)-m(y)||tie(x,y));}
// 순수 계획: 어느 적이 몇 번째 묶음인가(자리·체력은 건드리지 않는다)
function plan(zone,rows,ctx={},opt={}){const st=styleFor(zone),all=[...(rows||[])],total=all.length;
 if(SKIP.has(zone)||total<4)return{style:st,waves:[all],sizes:[total]};
 let champs=all.filter(e=>e.wardChampionR81),plain=all.filter(e=>!e.wardChampionR81);
 let n=Math.max(2,Math.min(opt.max||6,st.n,Math.floor(total/3)));
 if(plain.length<2*n){plain=all;champs=[];}
 const sz=sizes(plain.length,n,st.shape,st.h,Math.ceil(total*.55)-(st.champ==='spread'?Math.ceil(champs.length/n):champs.length)),L=ordered(plain,st,ctx,zone),waves=[];let at=0;for(const s of sz){waves.push(L.slice(at,at+s));at+=s;}
 champs.sort((x,y)=>sid(x)<sid(y)?-1:1).forEach((e,j)=>{const k=st.champ==='lead'?0:st.champ==='last'?n-1:n-1-(j%n);waves[k].push(e);});
 return{style:st,waves,sizes:waves.map(w=>w.length)};}

const plans=new WeakMap(),heldSet=new WeakSet(),stats={plans:0,resumed:0,held:0,releases:0,woken:0,moved:0,byClear:0,byRatio:0,byTime:0,flushed:0,errors:0};let lastError=null,pollAt=-9,stepAt=-9;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const alive=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
const fieldLike=e=>alive(e)&&!e.boss&&!(e.midboss&&!e.wardChampionR81)&&!e.persona&&!e.trial&&!e.cosmic&&!e.r61Summoned&&!e.r61Clone;
const W=()=>window.__STORYWORLD_WORLD_COMBAT_R78__;
const cinema=()=>{try{return window.__STORYWORLD_CINEMA_RUN_R461__?.active?.()===true;}catch(_){return false;}};
const applies=r=>{try{return on&&!!r&&!SKIP.has(r.id)&&!cinema()&&W()?.controlled?.(r)===true;}catch(_){return false;}};
const hero=()=>typeof player==='object'&&player?player:{x:0,y:0};
const isBlocked=(x,y,rad,r)=>{try{return typeof blocked==='function'&&blocked(x,y,rad,r)===true;}catch(_){return false;}};
const radius=e=>Math.max(.2,Number(e?.combatProfile?.bodyBlock?.r)||Number(e?.radius)||.3);
function hold(e,k){e.spawnState='hidden';e.r905Wave=k;heldSet.add(e);stats.held++;}
// 깨울 자리: 집결 자리 그대로. 영웅 발밑(1.6칸 안)이거나 막혔으면 가까운 빈 자리로
function spot(e,r){const p=hero(),rad=radius(e)+.12,okAt=(x,y)=>Math.hypot(x-p.x,y-p.y)>=1.6&&!isBlocked(x,y,rad,r);if(okAt(e.x,e.y))return null;
 for(let ring=1;ring<=12;ring++)for(let s=0;s<12;s++){const a=s*Math.PI/6+ring*.5,d=ring*.45,x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d;if(okAt(x,y))return{x,y};}return null;}
function wake(e,r,t){if(!heldSet.has(e))return false;heldSet.delete(e);if(!alive(e))return false;const q=spot(e,r);if(q){e.x=e.homeX=q.x;e.y=e.homeY=q.y;e.nav=[];stats.moved++;}
 e.spawnState='active';e.graceUntil=t+.9;e.cd=Math.max(.8,Number(e.cd)||0);e.state='idle';e.attack=null;stats.woken++;return true;}
function release(r,p,why){const k=p.next,w=p.waves[k]||[],t=T();let c=0;for(const e of w)if(wake(e,r,t))c++;p.next=k+1;p.lastAt=t;p.lastSize=Math.max(1,c);p.done=p.next>=p.waves.length;stats.releases++;stats[why]++;
 if(c){try{if(typeof toast==='function')toast('남은 적이 더 몰려옵니다 · '+(k+1)+'/'+p.waves.length,2.6);}catch(_){}}}
function flush(r,p){const t=T();for(const w of p.waves)for(const e of w)wake(e,r,t);p.done=true;p.next=p.waves.length;stats.flushed++;}
function begin(r,built,lead){const waves=lead?[lead,...built.waves]:built.waves,st=built.style,total=waves.reduce((a,w)=>a+w.length,0);
 const p={zone:r.id,style:st,waves,all:waves.flat(),next:1,lastAt:T(),lastSize:Math.max(1,waves[0].length),cap:Math.max(8,Math.ceil(total/2)),done:waves.length<2,checkAt:T()};
 for(let k=1;k<waves.length;k++)for(const e of waves[k])hold(e,k);waves[0].forEach(e=>{e.r905Wave=0;});plans.set(r,p);stats.plans++;return p;}
// R78 rally() 가 살아 있는 필드 적을 모두 집결 자리에 놓은 바로 뒤에 부른다
function onRally(r,rows,s){try{if(!applies(r)||plans.has(r)&&!plans.get(r).done)return false;const g=r.exploration?.worldWardR81;
  const built=plan(r.id,(rows||[]).filter(alive),{player:hero(),anchor:g?.gatherAnchor,route:s?.route});begin(r,built,null);return built.waves.length>1;}catch(e){fail(e);return false;}}
// 불러오기 뒤: R78 이 필드 적을 전부 active 로 되돌린다 → 다친 적·영웅 곁(9칸) 적은 그대로(절반까지), 나머지만 다시 나눈다
function resume(r){const rows=(r.enemies||[]).filter(e=>fieldLike(e)&&(e.spawnState==='active'||e.spawnState==='hidden')),p=hero(),d=e=>Math.hypot(e.x-p.x,e.y-p.y),cap=Math.max(8,Math.ceil(rows.length/2)),keep=rows.filter(e=>e.spawnState==='active'&&(d(e)<=9||e.hp<e.maxHp)).sort((x,y)=>((y.hp<y.maxHp)-(x.hp<x.maxHp))||d(x)-d(y)).slice(0,cap),rest=rows.filter(e=>!keep.includes(e));
 const g=r.exploration?.worldWardR81,st=styleFor(r.id);if(rest.length<4){plans.set(r,{done:true,waves:[rows],all:rows,next:1});return;}
 const built=plan(r.id,rest,{player:p,anchor:g?.gatherAnchor,route:null},{max:Math.max(2,st.n-1)});begin(r,built,keep);stats.resumed++;}
function phaseOf(r){try{return W()?.state?.(r)?.phase||null;}catch(_){return null;}}
function step(){if(typeof started!=='undefined'&&!started)return;if(typeof room!=='object'||!room||!Array.isArray(room.enemies))return;const r=room,t=T();let p=plans.get(r);
 if(!p){if(!applies(r))return;if(t<pollAt&&pollAt-t<=.5)return;pollAt=t+.5;if(phaseOf(r)==='rally')resume(r);return;}
 if(p.done)return;if(t<stepAt&&stepAt-t<=.2)return;stepAt=t+.2;
 if(t<p.lastAt)p.lastAt=t;if(t<p.checkAt)p.checkAt=t;
 if(t-p.checkAt>=1){p.checkAt=t;if(!applies(r)||phaseOf(r)!=='rally'){flush(r,p);return;}}
 const a=p.all.filter(e=>alive(e)&&!heldSet.has(e)).length,dt=t-p.lastAt,st=p.style,gap=st.gap*(.8+.4*((st.h>>>(p.next*5))&7)/7);
 if(a===0){if(dt>=.4)release(r,p,'byClear');}
 else if(a<=Math.max(1,Math.round(p.lastSize*st.ratio))){if(dt>=1.2)release(r,p,'byRatio');}
 else if(dt>=gap&&a+(p.waves[p.next]||[]).filter(alive).length<=p.cap)release(r,p,'byTime');}
if(typeof tick==='function'){const base=tick;tick=function(...a){const out=base.apply(this,a);try{step();}catch(e){fail(e);}return out;};}
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on){try{const r=typeof room==='object'?room:null,p=r&&plans.get(r);if(p&&!p.done)flush(r,p);}catch(e){fail(e);}}return on;}
window.__STORYWORLD_RALLY_WAVES_R905__=Object.freeze({revision:REV,plan,styleFor,onRally,held:e=>heldSet.has(e),set,on:()=>on,zones:()=>Object.keys(TABLE),
 inspect:()=>{const p=typeof room==='object'&&room?plans.get(room):null;return{revision:REV,on,cinema:cinema(),stats:{...stats},lastError,
  plan:p?{zone:p.zone,style:p.style&&{n:p.style.n,shape:p.style.shape,order:p.style.order,champ:p.style.champ,gap:p.style.gap,ratio:p.style.ratio},sizes:p.waves.map(w=>w.length),next:p.next,done:!!p.done,cap:p.cap,
   active:p.all.filter(e=>alive(e)&&!heldSet.has(e)).length,held:p.all.filter(e=>heldSet.has(e)&&alive(e)).length}:null};}});
})();
