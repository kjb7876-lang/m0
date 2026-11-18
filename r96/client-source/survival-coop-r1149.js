// R1149 — 무한 생존 멀티플레이(사용자 2026-11-18 07:35Z "멀티플레이 무한생존모드도 되게해주고 최대 7명까지 입장가능하게해줘
//  그리고 4명이하일때는 각자 1명의 영웅만 배치가능하고 5명부터는 영웅배치 없이 각자 플레이하는 영웅으로만 플레이하도록 해
//  멀티모드에서 정화구슬은 알아서 레벨업하고 스킬고르는건 각자영웅에 관련된것만 나오게",
//  07:39Z 결정 카드 "서버는 그대로, 4명까지만", 07:39Z "영화서사모드는 1인플레이만 가능하게 하고 스토리모드랑 무한생존모드만 멀티플레이 가능하게 …
//  멀티모드시 플레이어 숫자에 비례해서 적체력 배수").
//
//  · 입구: 동행(협동) 대기실의 방장 화면에 '무한 생존 함께 시작' 단추와 난이도. 모두 준비되면 누를 수 있다(기존 '함께 시작' = 스토리 모드는 그대로).
//  · 구조: 기존 협동(R62, 방장 권한)을 그대로 쓴다. 방장이 생존 단계(몹 생성·정화 코어·경험치)를 돌리고, 손님은 같은 직사각형 무대를 만들어 받아 그린다.
//    중계 서버는 바꾸지 않는다(사용자 결정). 그래서 서버가 이미 받는 칸만 쓴다:
//      ① 지역 전환의 지역 이름에 'sv1149-난이도-회차-단계--지역'을 실어 손님이 불러오기 전에 생존 무대를 준비하게 한다(서버 정규식 [A-Za-z0-9_-], 128자 안).
//      ② 방장 스냅샷의 room 칸에 생존 상태(sv1149: 코어·레벨·조각·빛줄기·판 끝·각자 강화 대기 수)를 실어 보낸다.
//      ③ 손님의 강화 고르기는 기존 '패시브 강화 명령'(passiveId) 칸에 'sv1149-u-강화이름'으로 보낸다. 방장이 대기 수와 최대 단계를 확인하고 그 손님 영웅에만 적용한다.
//  · 인원: 규칙 상한은 7명이지만 지금 서버는 방당 4석이라 실제 입장은 4명까지다(서버를 바꾸면 pure.SEATS 만 올리면 된다).
//  · 적 체력: 인원수만큼 몹을 복제하던 협동 규칙 대신, 생존에서는 몹·보스 체력에 인원수를 곱한다(혼자는 ×1 = 예전 그대로).
//  · 정화 구슬(코어): 멀티에서는 레벨 하나에 강화 하나씩 알아서 오른다(덜 오른 것부터 고르게). 강화 선택지에는 각자 자기 영웅 것만 나온다.
//  · 영웅 배치(R720) 규칙: 2~4명은 각자 1명, 5명부터 없음, 혼자는 예전 그대로(pure.deployLimit). 이번 단계에서는 멀티 중 배치 창을 닫아 둔다
//    (배치 영웅의 몸을 손님 화면에 맞추는 일은 다음 단계 — 한도 계산은 이미 들어 있다).
//  · 영화 서사 모드는 혼자만: 방에 들어가 있는 동안 '영화 모드로 시작'을 막고, 영화 기록을 연 채로는 방 만들기·참가를 막는다.
//  · 혼자일 때는 아무것도 바꾸지 않는다(전송 가로채기는 그대로 통과).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SURVIVAL_COOP_R1149__)return;
const REV='R1149-survival-coop-1',RULE_MAX=7,SEATS=4,DIFFS=['easy','normal','hard','nightmare'],DIFF_NAME={easy:'쉬움',normal:'보통',hard:'어려움',nightmare:'악몽'};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const stats={starts:0,transitions:0,snapshots:0,syncs:0,picks:0,picksSent:0,picksRefused:0,cinemaBlocked:0,deployBlocked:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
// ── 순수 규칙(QA 가 CPU 에서 부른다) ──
const whole=v=>{const n=Math.floor(Number(v));return Number.isFinite(n)?n:0;};
const players=v=>Math.max(1,Math.min(RULE_MAX,whole(v)||1));
const joinCap=()=>Math.min(RULE_MAX,SEATS);
// 영웅 배치 한도(한 사람이 배치할 수 있는 영웅 수): 혼자는 예전 규칙 그대로(null), 2~4명은 각자 1명, 5명부터는 배치 없음.
function deployLimit(n){const k=players(n);return k<=1?null:k<=4?1:0;}
const hpScale=n=>players(n);
function scaleHp(hp,n){const v=Number(hp);if(!Number.isFinite(v))return 1;return Math.max(1,Math.round(v*hpScale(n)));}
// 멀티 선택지: 정화 구슬(코어) 강화는 빼고 영웅 것만.
function heroCards(pool,multi){const list=Array.isArray(pool)?pool.filter(Boolean):[];return multi?list.filter(o=>o.kind!=='core'):list;}
// 정화 구슬 자동 강화: 최대 단계가 아닌 것 중 가장 덜 오른 것(같으면 목록 순서). 모두 최대면 null.
function autoCore(lv,ups){let best=null,low=Infinity;for(const u of Array.isArray(ups)?ups:[]){if(!u||typeof u.id!=='string')continue;const k=Math.max(0,whole(lv&&lv[u.id]));if(k>=u.max)continue;if(k<low){low=k;best=u.id;}}return best;}
const ID=/^[A-Za-z0-9_-]+$/;
function encodeRegion(id,info){if(typeof id!=='string'||!ID.test(id)||!info||!DIFFS.includes(info.diff))return null;const i=Number(info.i),loop=Number(info.loop);
 if(!Number.isInteger(i)||!Number.isInteger(loop)||i<0||loop<0||i>9999||loop>9999)return null;const s='sv1149-'+info.diff+'-'+loop+'-'+i+'--'+id;return s.length<=128?s:null;}
function decodeRegion(s){if(typeof s!=='string')return null;const m=/^sv1149-(easy|normal|hard|nightmare)-(\d{1,4})-(\d{1,4})--([A-Za-z0-9_-]+)$/.exec(s);return m?{id:m[4],i:+m[3],loop:+m[2],diff:m[1]}:null;}
function pickCommand(uid){return typeof uid==='string'&&/^[A-Za-z0-9]{1,40}$/.test(uid)?'sv1149-u-'+uid:null;}
function parseCommand(s){if(typeof s!=='string')return null;const m=/^sv1149-u-([A-Za-z0-9]{1,40})$/.exec(s);return m?m[1]:null;}
const multiAllowed=mode=>mode==='story'||mode==='survival';
const pure=Object.freeze({RULE_MAX,SEATS,DIFFS:Object.freeze([...DIFFS]),joinCap,deployLimit,hpScale,scaleHp,heroCards,autoCore,encodeRegion,decodeRegion,pickCommand,parseCommand,multiAllowed});

// ── 실행 상태 ──
const M={on:false,role:null,diff:'normal',pend:{},pendSelf:0,cmdSeq:0,busy:false,pickHold:0,choiceOpen:false};
let rawClient=null,rawSim=null;
const SV=()=>window.__STORYWORLD_SURVIVAL_R600__;
const say=(t,s=2.6)=>{try{if(typeof toast==='function')toast(t,s);}catch(_){}};
const cstate=()=>G(()=>rawClient.inspect(),null);
const inRoom=()=>!!G(()=>rawClient.active(),false);
const actors=()=>{const a=G(()=>rawSim.players(),[]);return Array.isArray(a)?a.filter(Boolean):[];};
const count=()=>players(actors().filter(p=>p.connectedR62!==false).length);
const alive=()=>{const a=G(()=>rawSim.livingPlayers(),[]);return Array.isArray(a)?a.filter(p=>p&&p.hp>0):[];};
function eachActor(fn){let n=0;for(const p of alive()){try{rawSim.withPlayer(p,fn);n++;}catch(e){fail(e);}}return n;}
function endSession(){if(!M.on)return;M.on=false;M.role=null;M.pend={};M.pendSelf=0;M.choiceOpen=false;try{SV()?.coop?.leave?.();}catch(e){fail(e);}badge();}
// 방장: 레벨이 오르면 손님마다 강화 고르기 한 번씩(방장 몫은 생존 본체의 강화 창 대기열이 센다).
function onLevel(ups){const k=Math.max(0,whole(ups));if(!k||!M.on||M.role!=='host')return;const host=G(()=>rawSim.inspect().selfId,'');
 for(const p of actors()){const id=p.coopIdR62;if(!id||id===host||p.connectedR62===false)continue;M.pend[id]=Math.min(99,(M.pend[id]||0)+k);}}
function hostPick(playerId,uid){const n=M.pend[playerId]|0,p=actors().find(a=>a.coopIdR62===playerId);if(!M.on||M.role!=='host'||n<=0||!p){stats.picksRefused++;return false;}
 let ok=false;try{rawSim.withPlayer(p,()=>{ok=SV().coop.pick(uid)===true;});}catch(e){fail(e);}if(!ok){stats.picksRefused++;return false;}M.pend[playerId]=n-1;stats.picks++;try{rawSim.sendSnapshot();}catch(_){}return true;}
function resetActors(){for(const p of actors()){try{rawSim.withPlayer(p,()=>{p.upgrades={};p.level=1;p.xp=0;p.ego=0;p.samong=0;p.hp=maxHP();});}catch(e){fail(e);}}}
async function startHost(diff){if(M.busy||!rawClient||!rawSim)return false;const st=cstate();if(!st||st.role!=='host'||!st.simReady||G(()=>loading,false))return false;
 if(!st.players.filter(p=>p.connected).every(p=>p.id===st.hostId||p.ready)){say('모든 동행자가 준비를 마쳐야 시작할 수 있습니다.');return false;}
 if(st.players.length>joinCap()){say('무한 생존 멀티는 지금 '+joinCap()+'명까지 됩니다.');return false;}
 M.busy=true;try{M.on=true;M.role='host';M.diff=DIFFS.includes(diff)?diff:'normal';M.pend={};M.pendSelf=0;stats.starts++;resetActors();
  const hero=G(()=>rawSim.localPlayer().hero,'hwando');let ok=false;try{ok=await SV().coop.startHost(hero,M.diff);}catch(e){fail(e);}
  if(!ok){endSession();say('무한 생존을 시작하지 못했습니다. 다시 눌러 주세요.');try{rawClient.showLobby();}catch(_){}return false;}badge();return true;}finally{M.busy=false;}}
function leave(){try{endSession();}catch(e){fail(e);}try{rawClient.disconnect();}catch(e){fail(e);}}

// ── 전송 가로채기(방장): 지역 이름에 생존 표시, 스냅샷에 생존 상태 ──
function outgoing(type,payload){
 if(type==='command'&&payload&&typeof payload==='object')return [type,{...payload,seq:++M.cmdSeq}];/* 패시브 명령과 강화 고르기 명령이 한 순번을 쓴다(서버는 순번이 늘어야 받는다) */
 if(!M.on||M.role!=='host'||!payload||typeof payload!=='object')return [type,payload];
 if(type==='transition'){const s=G(()=>SV().state(),null),enc=s?encodeRegion(payload.regionId,{i:s.i,loop:s.loop,diff:s.diff}):null;if(!enc)return [type,payload];stats.transitions++;
  if(cstate()?.phase==='lobby')return ['start',{regionId:enc,layer:payload.layer||'STORY'}];/* 대기실에서의 첫 진입은 서버의 '시작'으로 */
  return [type,{...payload,regionId:enc}];}
 if(type==='snapshot'&&payload.state&&typeof payload.state==='object'){const st=G(()=>SV().coop.publicState(),null);if(!st)return [type,payload];stats.snapshots++;
  const host=G(()=>rawSim.inspect().selfId,''),pend={...M.pend};if(host)pend[host]=st.hostPend|0;
  return [type,{...payload,state:{...payload.state,room:{...(payload.state.room||{}),sv1149:{...st,pend,n:count()}}}}];}
 return [type,payload];}
function wrapClient(){const C=window.__STORYWORLD_COOP_CLIENT_R62__;if(!C||C.r1149||typeof C.send!=='function')return false;rawClient=C;
 const send=(type,payload={})=>{let out=[type,payload];try{out=outgoing(type,payload);}catch(e){fail(e);}return C.send(out[0],out[1]);};
 try{window.__STORYWORLD_COOP_CLIENT_R62__=Object.freeze({...C,send,r1149:true});}catch(e){fail(e);return false;}
 try{C.on('snapshot',m=>{try{guestState(m?.state?.room?.sv1149);}catch(e){fail(e);}});C.on('status',()=>{try{if(!inRoom()&&M.on)endSession();}catch(e){fail(e);}});}catch(e){fail(e);}return true;}
// ── 받기 가로채기: 지역 이름 풀기(손님은 무대 준비), 강화 고르기 명령(방장), 처음 본 몹(손님) ──
function guestState(st){if(!M.on||M.role!=='guest'||!st||typeof st!=='object')return;stats.syncs++;SV().coop.guestSync(st);
 const me=G(()=>cstate().selfId,''),n=Math.max(0,whole(st.pend&&st.pend[me]));M.pend=st.pend&&typeof st.pend==='object'?{...st.pend}:{};
 if(performance.now()<M.pickHold)M.pendSelf=Math.min(M.pendSelf,n);else{const rose=n>M.pendSelf;M.pendSelf=n;if(rose&&!M.choiceOpen&&!G(()=>modal,false))openChoice();}
 if(st.over===true&&M.choiceOpen){M.choiceOpen=false;try{closePanel(true);}catch(_){}}badge();}
async function incoming(CO,message){
 if(message&&message.type==='transition'){const d=decodeRegion(message.regionId),mode=CO.mode();
  if(d){const plain={...message,regionId:d.id};
   if(mode==='guest'){M.on=true;M.role='guest';M.diff=d.diff;M.choiceOpen=false;let ready=false;try{ready=SV().coop.guestEnter(d)===true;}catch(e){fail(e);}
    let r=false;try{r=await CO.receive(plain);}finally{try{SV().coop.guestReady(ready&&r===true);}catch(e){fail(e);}badge();}return r;}
   return CO.receive(plain);}
  if(M.on&&mode==='guest')endSession();/* 방장이 스토리 지역으로 넘어감 */}
 else if(message&&message.type==='command'&&CO.mode()==='host'){const uid=parseCommand(message.command?.passiveId);if(uid){hostPick(String(message.playerId||''),uid);return true;}}
 else if(message&&message.type==='snapshot'&&M.on&&M.role==='guest'&&!G(()=>loading,false)&&message.state&&message.state.zone===G(()=>zone,null)){
  const rows=message.state.enemies;if(Array.isArray(rows)){const have=new Set(G(()=>room.enemies.map(e=>e.id),[]));for(const row of rows.slice(0,128))if(row&&!have.has(row.id))SV().coop.guestMob(row);}}
 return CO.receive(message);}
function wrapSim(){const CO=window.__STORYWORLD_COOP_SIM_R62__;if(!CO||CO.r1149||typeof CO.receive!=='function')return false;rawSim=CO;
 const receive=function(message){try{return incoming(CO,message);}catch(e){fail(e);return CO.receive(message);}};
 const stop=async function(...a){try{endSession();}catch(e){fail(e);}return CO.stop(...a);};
 try{window.__STORYWORLD_COOP_SIM_R62__=Object.freeze({...CO,receive,stop,r1149:true});}catch(e){fail(e);return false;}return true;}

// ── 강화 고르기 ──
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function localPool(){const out=[];try{for(const u of UPGRADES){if(!u||u.dream)continue;const k=typeof upgradeKey==='function'?upgradeKey(u):u.id;out.push({id:'u:'+u.id,uid:u.id,key:k,name:u.name,text:u.text,max:u.max,level:+(G(()=>player.upgrades[k],0)||0),kind:'hero'});}}catch(e){fail(e);}return out;}
function guestChoice(){if(!M.on||M.role!=='guest'||M.pendSelf<=0||G(()=>SV().state().over,false))return false;
 const opts=G(()=>SV().pure.pickThree(heroCards(localPool(),true)),[]).map(o=>o.kind==='mend'?{...o,uid:'mend',text:'영웅 체력을 40% 회복.'}:o);if(!opts.length)return false;
 try{closePanel(true);}catch(_){}M.choiceOpen=true;
 try{openPanel('<div class="eyebrow">무한 생존 함께 하기 · 남은 강화 '+M.pendSelf+'</div><h2>기억이 선명해집니다</h2><p class="small">내 영웅의 강화만 나옵니다. 정화 구슬은 알아서 강해집니다. 고르는 동안에도 전투는 이어집니다.</p><div class="r600Cards">'+
  opts.map(o=>'<button type="button" class="r600Card r1149Card" data-pick="'+esc(o.uid)+'" data-kind="'+esc(o.kind)+'"><b>'+esc(o.name)+'</b><span>'+esc(o.text)+'</span><em>'+(o.kind==='mend'?'즉시':'영웅 · 단계 '+o.level+' → '+(o.level+1)+(Number.isFinite(o.max)?' / '+o.max:''))+'</em></button>').join('')+'</div>');}catch(e){fail(e);M.choiceOpen=false;return false;}
 let used=false;for(const b of document.querySelectorAll('.r1149Card'))b.onclick=()=>{if(used)return;used=true;for(const x of document.querySelectorAll('.r1149Card'))x.disabled=true;
  const cmd=pickCommand(b.dataset.pick),sent=!!cmd&&G(()=>window.__STORYWORLD_COOP_CLIENT_R62__.send('command',{seq:0,epoch:rawSim.inspect().epoch,command:{kind:'upgrade',passiveId:cmd}}),false)===true;
  if(sent){stats.picksSent++;M.pendSelf=Math.max(0,M.pendSelf-1);M.pickHold=performance.now()+1800;}else say('강화를 보내지 못했습니다. 잠시 뒤 다시 골라 주세요.');
  M.choiceOpen=false;try{closePanel(true);}catch(_){}badge();if(sent&&M.pendSelf>0)setTimeout(()=>{try{if(!G(()=>modal,false))guestChoice();}catch(e){fail(e);}},350);};
 return true;}
function openChoice(){if(!M.on)return false;if(M.role==='host')return G(()=>SV().coop.forceChoice(),false)===true;return guestChoice();}
// 손님 화면의 '강화 N' 단추(창을 닫았을 때 다시 여는 길)
let badgeEl=null;
function badge(){try{const show=M.on&&M.role==='guest'&&M.pendSelf>0&&!M.choiceOpen;if(!badgeEl){if(!show||!document.body)return;badgeEl=document.createElement('button');badgeEl.id='r1149Pend';badgeEl.type='button';
   badgeEl.style.cssText='position:fixed;right:12px;bottom:96px;z-index:60;padding:8px 12px;border:1px solid #b3202a;border-radius:8px;background:rgba(14,10,12,.86);color:#f3e9e4;font:600 14px/1.2 system-ui,sans-serif;cursor:pointer';
   badgeEl.onclick=()=>{try{openChoice();}catch(e){fail(e);}};document.body.appendChild(badgeEl);}
  badgeEl.style.display=show?'':'none';if(show)badgeEl.textContent='강화 고르기 '+M.pendSelf;}catch(e){fail(e);}}

// ── 대기실: 방장의 '무한 생존 함께 시작' ──
function lobbyButton(){try{const base=document.getElementById('coopStart62');if(!base){return;}let b=document.getElementById('svCoop1149Start');
  if(!b){const sel=document.createElement('select');sel.id='svCoop1149Diff';sel.setAttribute('aria-label','무한 생존 난이도');sel.innerHTML=DIFFS.map(d=>'<option value="'+d+'"'+(d===M.diff?' selected':'')+'>'+DIFF_NAME[d]+'</option>').join('');sel.onchange=()=>{if(DIFFS.includes(sel.value))M.diff=sel.value;};
   b=document.createElement('button');b.id='svCoop1149Start';b.type='button';b.textContent='무한 생존 함께 시작';b.title='모두 같은 정화 구슬을 지킵니다. 지금은 '+joinCap()+'명까지 · 적 체력은 인원수만큼 늘어납니다';
   b.onclick=()=>{startHost(document.getElementById('svCoop1149Diff')?.value||M.diff).catch(fail);};base.parentNode.insertBefore(b,base.nextSibling);base.parentNode.insertBefore(sel,b.nextSibling);}
  const off=base.disabled===true||M.busy;if(b.disabled!==off)b.disabled=off;}catch(e){fail(e);}}
function watchPanel(){const panel=document.getElementById?.('panel');if(!panel||typeof MutationObserver!=='function')return false;let busy=false;
 new MutationObserver(()=>{if(busy)return;busy=true;try{lobbyButton();}finally{busy=false;}}).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});lobbyButton();return true;}

// ── 영화 서사 모드는 혼자만 ──
const cinemaRun=()=>G(()=>window.__STORYWORLD_CINEMA_RUN_R461__.active()===true,false);
function guardClicks(ev){try{const id=ev?.target?.id;if(!id)return;
  if(id==='cinemaStartR461'&&inRoom()){stats.cinemaBlocked++;ev.preventDefault?.();ev.stopImmediatePropagation?.();say('영화 서사 모드는 혼자서만 할 수 있습니다. 함께 하기는 스토리 모드와 무한 생존에서 됩니다.',3.4);}
  else if((id==='coopCreate62'||id==='coopJoin62')&&cinemaRun()&&G(()=>started,false)){stats.cinemaBlocked++;ev.preventDefault?.();ev.stopImmediatePropagation?.();say('영화 서사 모드 기록에서는 함께 하기를 열 수 없습니다. 스토리 기록을 이어하거나 새로 시작한 뒤 열어 주세요.',3.8);}}catch(e){fail(e);}}
// 멀티 중 영웅 배치 창은 R720 이 스스로 닫는다(hero-defense-r720.js here()). 여기서는 I 키를 눌렀을 때 까닭만 알려 준다.
function deployNote(ev){try{if(!M.on||ev.repeat||!(ev.key==='i'||ev.key==='I'||ev.key==='ㅑ'))return;if(G(()=>modal,false)||G(()=>SV().here(),false)!==true)return;const t=ev.target;if(t&&(['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||t.isContentEditable))return;
  stats.deployBlocked++;say('함께 하기에서는 영웅 배치가 아직 닫혀 있습니다. 2~4명은 각자 1명 규칙으로 다음 판에 열립니다.',3.2);}catch(e){fail(e);}}

function inspect(){const me=G(()=>cstate().selfId,'');return{revision:REV,on:M.on,role:M.role,diff:M.diff,count:M.on?count():1,scale:api.hpScale(),deployLimit:api.deployLimit(),joinCap:joinCap(),pend:M.role==='host'?{...M.pend,[me]:G(()=>SV().coop.publicState().hostPend,0)|0}:{...M.pend},pendSelf:M.role==='host'?G(()=>SV().coop.publicState().hostPend,0)|0:M.pendSelf,
 cinemaBlocked:inRoom(),wrapped:{client:!!rawClient,sim:!!rawSim},stats:{...stats},errors:stats.errors,lastError};}
const api={revision:REV,pure,active:()=>M.on,role:()=>M.role,count:()=>M.on?count():1,hpScale:()=>M.on&&M.role==='host'?hpScale(count()):1,deployLimit:()=>M.on?deployLimit(count()):null,
 alive,eachActor,onLevel,startHost,leave,openChoice,inspect};
window.__STORYWORLD_SURVIVAL_COOP_R1149__=Object.freeze(api);
try{wrapClient();wrapSim();}catch(e){fail(e);}
try{if(typeof document!=='undefined'&&document.addEventListener){document.addEventListener('click',guardClicks,true);document.addEventListener('keydown',deployNote,true);if(!watchPanel())document.addEventListener('DOMContentLoaded',watchPanel,{once:true});}}catch(e){fail(e);}
try{const iv=setInterval(()=>{try{lobbyButton();if(M.on&&!inRoom())endSession();}catch(e){fail(e);}},500);iv?.unref?.();}catch(_){}
})();
