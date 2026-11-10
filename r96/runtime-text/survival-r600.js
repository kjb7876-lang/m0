// R600 — 무한 생존 모드(사용자 2026-11-10 03:51Z "픽셀모드 삭제하고 그자리에 무한뱀서류모드 추가해서 넓은 직사각형공간(스토리모드 맵크기)안에
//  서사순서대로 맵과 몹들이나오고 스킬업그레이등은 로그라이크느낌으로 3개의제안지 떠서 선택해서 강화하는걸로 길잡이는 없고 반자동은 있음
//  기본적으로 음성서사나오고 그서사 나오는동안에 6-7초정도 추가해서 몹이계속생성되게 보스서사음성나오면 보스등장하고 맵중앙에서 뱀서류처럼 플레이
//  그리고 모든적섬멸되면 다음맵으로 자동으로 전환되고 다시 중앙에서 시작 무한반복 우선은 스토리모드까지구현",
//  03:53Z "무한생존모드 중앙에 정화코어 둬서 정화코어도 지켜야 되는걸로 정화코어는 간단한 정화공격을 하고 정화코어도 강화가능하게
//  그리고 적을 처치하면 정화코어 체력이 회복되게끔 기본적인 정화코어 채력재생등 기본스펙도 있고 정화코어는 중앙에 고정되어있음 다른건 유명 뱀서류 규칙 따라서").
//
//  · 입구: 처음 화면의 '픽셀 모드로 시작' 자리에 '무한 생존으로 시작'. 영웅을 고르면 바로 첫 전투 지역에서 시작한다.
//  · 무대: 스토리 모드 전투 지역(쉼터 제외, 서사 순서 = regions 의 index 순) 하나하나를 빌린다. 그 지역의 바닥·벽 그림(테마)과 몹·보스 그림을 쓰고,
//    지형은 그 지역 지도와 같은 크기(bounds)의 넓은 직사각형 하나로 바꾼다(벽은 테두리만). 영웅은 맵 중앙(정화 코어 바로 아래)에서 시작한다.
//  · 정화 코어: 맵 중앙에 고정. 체력·초당 재생·처치 회복(적을 잡으면 회복)·정화 공격(가까운 적을 일정 간격으로 맞힘)이 있고, 3택 강화로 키운다.
//    일부 적은 코어를 노리고 걸어가 붙어서 코어를 깎는다. 코어가 부서지거나 영웅이 쓰러지면 그 판이 끝난다(결과 창 → 다시 도전 / 처음 화면).
//  · 서사: 그 지역의 보스 전 서사('pre', 없으면 본문)를 녹음 음성(R381, 없으면 브라우저 음성, 그것도 없으면 글 길이만큼)과 자막으로 흘린다.
//    서사가 나오는 동안 + 6.5초 동안 몹이 계속 나온다. 그 몹을 다 잡으면 보스 서사('post')가 나오면서 보스(없으면 중간보스)가 등장하고,
//    보스 서사 동안 + 6.5초 동안 몹이 더 나온다. 모든 적을 섬멸하면 남은 경험치 조각을 모두 끌어오고 다음 지역으로 자동 전환, 다시 중앙에서 시작.
//    마지막 지역 다음은 처음 지역으로 돌아가 한 바퀴(회차)마다 적이 단단해지며 끝없이 이어진다. 이번 범위는 스토리 모드까지(사몽·사몽역행·DLC 제외).
//  · 뱀서류 일반 규칙: 화면 밖 고리에서 몰려오는 적, 시간이 갈수록 늘어나는 물량(상한 있음), 처치 → 경험치 조각 → 가까이 가면 끌려와 흡수,
//    레벨이 오르면 게임을 멈추고 강화 제안 3개 중 하나를 고른다(영웅 재능·고유 기술·고유 패시브 + 정화 코어 강화). 길잡이는 없고 반자동(자동 공격)은 켜진 채 시작한다.
//  · 이 모드는 저장하지 않는다(기존 저장 슬롯·스토리 진행을 건드리지 않음). 판정·그림·서사 글·영웅 스킬은 엔진 것을 그대로 부른다.
//  끄기: 없음(처음 화면에서 고르지 않으면 아무것도 바꾸지 않는다). localStorage storyworld.r600.survival {"voice":false} → 서사 음성 없이 자막만.
(()=>{'use strict';
if(window.__STORYWORLD_SURVIVAL_R600__)return;
const REV='R600-survival-1',KEY='storyworld.r600.survival';
const TAIL=6.5,CLEAR_WAIT=2.2,RING=[10,15],GEM_PULL=2.8,GEM_TAKE=.75,GEM_CAP=220,CPS=6.8,GAP=.55,NO_TEXT_SECS=35;
const ORB='assets/r163/pixelfx/core-orb-teal.webp',GEM='assets/r106/fx/shard.webp';
let prefs={voice:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&s.voice===false)prefs.voice=false;}catch(_){}
const stats={starts:0,stages:0,spawned:0,bosses:0,kills:0,gems:0,levels:0,choices:0,coreHits:0,coreShots:0,clears:0,loops:0,deaths:0,coreLost:0,saveBlocked:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ── 순수 함수(QA 가 CPU 에서 부른다) ──
// 스토리 모드 전투 지역을 서사 순서대로(쉼터·사몽 층 제외).
function stageIds(list){return (list||[]).filter(r=>r&&r.id&&!r.safe&&r.layer!=='DREAM').slice().sort((a,b)=>(+a.index||0)-(+b.index||0)).map(r=>r.id);}
// 지도 크기(bounds) 그대로의 직사각형 바닥. 테두리 한 칸은 벽 자리.
function arena(bounds){const b=Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isFinite)?bounds:[0,0,60,60];
 const x0=Math.floor(b[0])+1,y0=Math.floor(b[1])+1,x1=Math.max(x0+8,Math.ceil(b[2])-1),y1=Math.max(y0+8,Math.ceil(b[3])-1);
 return {x0,y0,x1,y1,w:x1-x0,h:y1-y0,cx:(x0+x1)/2,cy:(y0+y1)/2,bounds:[x0-1,y0-1,x1+1,y1+1]};}
// 몹이 나오는 때: 서사가 흐르는 동안 + 끝난 뒤 TAIL 초.
function spawning(st,now){if(!st)return false;if(st.narrating)return true;return Number.isFinite(st.narrEndAt)&&now<st.narrEndAt+TAIL;}
// 단계 넘기기: 'pre' → (보스 서사가 있거나 보스가 있으면) 'boss' → 'clear'.
function nextPhase(phase,hasBossPart){return phase==='pre'?(hasBossPart?'boss':'clear'):phase==='boss'?'clear':'clear';}
// 다음 지역(끝나면 처음으로, 회차 +1).
function advance(i,loop,n){if(!(n>0))return {i:0,loop};return i+1>=n?{i:0,loop:loop+1}:{i:i+1,loop};}
// 화면에 함께 있을 수 있는 몹 수: 처음 16 → 시간과 지역 순서로 늘고, 상한(PC 48·모바일/저사양 30).
function cap(sec,idx,low){const top=low?30:48;return Math.round(clamp(16+sec/6+idx*.6,10,top));}
// 몹 체력 배율: 지역 순서와 회차로 오른다.
function hpMul(idx,loop){return (1+idx*.045)*(1+.6*loop);}
// 생존 경험치: 이 게임은 처치로 레벨이 오르지 않는다(R62 '지도 완료마다 한 레벨' 규칙) → 생존 모드는 자기 경험치·레벨로 3택을 연다.
//  처치 경험치(엔진 값 12+장×3)를 조각으로 떨어뜨리고, 레벨 n → n+1 에 30+22n 이 든다(처음은 4~5마리, 10레벨쯤 20마리 남짓).
const xpNeed=lv=>30+22*Math.max(1,Math.floor(+lv||1));
function levelUps(xp,lv,add){let x=Math.max(0,+xp||0)+Math.max(0,+add||0),l=Math.max(1,Math.floor(+lv||1)),ups=0;while(x>=xpNeed(l)&&ups<50){x-=xpNeed(l);l++;ups++;}return {lv:l,xp:x,ups};}
// 정화 코어 기본값과 강화.
const CORE0=Object.freeze({max:900,regen:3,heal:4,dmg:1,rate:1.6,range:5.5,shots:1});
const CORE_UPS=Object.freeze([
 {id:'coreMax',name:'정화 코어 · 두꺼운 껍질',text:'코어 최대 체력 +30%, 늘어난 만큼 회복.',max:8},
 {id:'coreRegen',name:'정화 코어 · 맑은 숨',text:'코어 초당 재생 +2.',max:8},
 {id:'coreHeal',name:'정화 코어 · 되돌아오는 빛',text:'적 하나를 처치할 때 코어 회복 +3.',max:6},
 {id:'coreDmg',name:'정화 코어 · 짙은 정화',text:'코어 정화 공격 위력 +35%.',max:8},
 {id:'coreRate',name:'정화 코어 · 잦은 맥박',text:'코어 정화 공격 간격 12% 감소.',max:6},
 {id:'coreRange',name:'정화 코어 · 넓은 빛',text:'코어 정화 공격 사거리 +1칸.',max:5},
 {id:'coreShots',name:'정화 코어 · 갈래 빛',text:'코어가 한 번에 맞히는 적 +1.',max:4}]);
function coreStats(lv){const k=id=>Math.max(0,Math.floor(+(lv&&lv[id])||0));
 return {max:Math.round(CORE0.max*(1+.3*k('coreMax'))),regen:CORE0.regen+2*k('coreRegen'),heal:CORE0.heal+3*k('coreHeal'),dmg:CORE0.dmg*(1+.35*k('coreDmg')),
  rate:CORE0.rate*Math.pow(.88,k('coreRate')),range:CORE0.range+k('coreRange'),shots:CORE0.shots+k('coreShots')};}
// 3택 고르기: 최대 단계가 아닌 것 중에서 서로 다른 셋(rng 로 섞음). 고를 게 없으면 '회복'.
function pickThree(pool,rng=Math.random){const open=(pool||[]).filter(o=>o&&!(o.level>=o.max));for(let i=open.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[open[i],open[j]]=[open[j],open[i]];}
 const out=open.slice(0,3);if(!out.length)out.push({id:'mend',name:'정화의 쉼',text:'영웅과 코어 체력을 40% 회복.',max:Infinity,level:0,kind:'mend'});return out;}
// 문장 나누기(R370 과 같은 규칙 — 녹음 음성 id 가 이 문장 그대로의 해시라 같아야 한다).
function sentences(text){const P=G(()=>window.__STORYWORLD_CINEMA_MODE_R370__.pure,null);if(P&&typeof P.sentences==='function')return P.sentences(text).map(s=>s.text);
 const out=[];String(text||'').split(/\n\s*\n/).forEach(para=>{const p=para.replace(/\s+/g,' ').trim();if(!p)return;for(const raw of(p.match(/[^.?!…。]+(?:[.?!…。]+["”’」』)]*|$)/g)||[p])){const t=raw.trim();if(t)out.push(t);}});return out;}

// ── 상태 ──
let S=null,pending=false,stageRoom=null,entering=0,hudAt=0,inKill=false,beams=[],gems=[],choosing=false,choiceQ=0;
const fresh=hero=>({active:true,hero,i:0,loop:0,ids:stageIds(G(()=>regions,[])),phase:'pre',narrating:false,narrEndAt:NaN,stageAt:0,bossUp:false,clearAt:NaN,
 kills:0,stageKills:0,serial:0,xp:0,lv:1,core:{lv:{},hp:CORE0.max,cd:1,hitAt:-9},taken:{},over:false,best:0,startWall:Date.now()});
const live=()=>!!S&&S.active&&G(()=>started,false)&&!!G(()=>player,null);
const here=()=>live()&&!!stageRoom&&G(()=>room,null)===stageRoom;
const living=e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
const low=()=>G(()=>!!settings.lowFx,false)||G(()=>matchMedia('(pointer:coarse)').matches,false);
const CS=()=>coreStats(S?.core?.lv);

// ── 서사(자막 + 녹음 음성) ──
const N={q:[],cur:null,gen:0,timer:null};
function narrPlaying(){return !!N.cur||N.q.length>0;}
function narrStop(){N.gen++;N.q.length=0;N.cur=null;clearTimeout(N.timer);N.timer=null;try{window.__STORYWORLD_VOICE_R381__?.stop?.();}catch(_){}try{speechSynthesis.cancel();}catch(_){}subs(null);}
function narrPlay(scenes){const list=[];for(const s of scenes||[]){const narr=String(s?.narrator||'').replace(/[〈〉<>]/g,'').trim();for(const t of sentences(s?.text))list.push({text:t,narr});}
 N.q.push(...list);if(!N.cur&&!N.timer)narrNext();return list.length;}
function vol(){return clamp(G(()=>Number.isFinite(+settings.voice)?+settings.voice:.8,.8),0,1);}
function narrNext(){N.timer=null;const it=N.q.shift()||null;N.cur=it;if(!it){subs(null);if(S&&S.narrating){S.narrating=false;S.narrEndAt=G(()=>time,0);}return;}
 if(S){S.narrating=true;}const my=++N.gen,est=Math.max(1.2,it.text.length/CPS);subs(it);
 const done=()=>{if(my!==N.gen)return;N.gen++;N.cur=null;N.timer=setTimeout(narrNext,GAP*1000);};
 const silent=()=>setTimeout(()=>{if(my===N.gen)done();},est*1000);
 const R=window.__STORYWORLD_VOICE_R381__;let ok=false;
 if(prefs.voice&&vol()>0&&R&&typeof R.has==='function'){try{if(R.has(it.text)){const h=R.play(it.text,{rate:1,volume:vol(),onend:done,onerror:()=>{if(my===N.gen)silent();}});ok=!!h;if(h&&N.q[0])R.preload(N.q[0].text);if(h)setTimeout(()=>{if(my===N.gen){try{h.stop();}catch(_){}done();}},(est*2+4)*1000);}}catch(e){fail(e);}}
 if(!ok&&prefs.voice&&vol()>0&&typeof speechSynthesis!=='undefined'){try{const v=(speechSynthesis.getVoices()||[]).find(v=>/^ko/i.test(v.lang));if(v){const u=new SpeechSynthesisUtterance(it.text);u.lang=v.lang;u.voice=v;u.volume=vol();u.onend=done;u.onerror=done;speechSynthesis.speak(u);ok=true;setTimeout(()=>{if(my===N.gen){try{speechSynthesis.cancel();}catch(_){}done();}},(est*2+4)*1000);}}catch(e){fail(e);}}
 if(!ok)silent();}
let subsEl=null;
function subs(it){try{if(!subsEl||!subsEl.isConnected){if(!document.getElementById('r600Style')){const st=document.createElement('style');st.id='r600Style';st.textContent=CSS;document.head.appendChild(st);}
  subsEl=document.createElement('div');subsEl.id='r600Subs';subsEl.innerHTML='<div class="w"><span class="n"></span><span class="t"></span></div>';document.body.appendChild(subsEl);}
 if(!it){subsEl.classList.remove('on');return;}subsEl.querySelector('.n').textContent=it.narr||'';subsEl.querySelector('.t').textContent=it.text;subsEl.classList.add('on');}catch(e){fail(e);}}
const CSS='#r600Subs{position:fixed;left:50%;bottom:calc(136px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(820px,calc(100vw - 32px));z-index:8990;pointer-events:none;opacity:0;transition:opacity .4s ease;text-align:center}'+
 '#r600Subs.on{opacity:1}#r600Subs .w{display:inline-block;max-width:100%;padding:7px 16px 9px;border-radius:6px;background:linear-gradient(180deg,rgba(10,7,9,.48),rgba(10,7,9,.7));box-shadow:0 0 0 1px rgba(120,210,200,.16) inset}'+
 '#r600Subs .n{display:block;font-size:12px;letter-spacing:.08em;color:#8fd4c8;opacity:.85;margin-bottom:2px}#r600Subs .n:empty{display:none}'+
 '#r600Subs .t{display:block;font-size:16px;line-height:1.5;color:#efe6d6;text-shadow:0 1px 2px #000,0 0 8px rgba(0,0,0,.8);word-break:keep-all;overflow-wrap:anywhere}'+
 'body.r600On #quest,body.r600On #navCompassR100{display:none!important}#r600Hud{position:fixed;left:50%;top:calc(70px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:8980;pointer-events:none;font-size:12px;color:#e8e1d2;text-align:center;text-shadow:0 1px 2px #000;display:none;min-width:260px}'+
 '#r600Hud.low{top:calc(100px + env(safe-area-inset-top,0px))}body.r600Modal #r600Subs{opacity:0!important;transition:none!important}#r600Hud.on{display:block}#r600Hud .s{letter-spacing:.06em;color:#c9b88c}#r600Hud .c{margin:4px auto 0;width:220px;height:7px;border-radius:4px;background:rgba(0,0,0,.55);box-shadow:0 0 0 1px rgba(143,212,200,.35) inset;overflow:hidden}'+
 '#r600Hud .c i{display:block;height:100%;background:linear-gradient(90deg,#3fa59a,#a8f0e4);transition:width .25s linear}#r600Hud .x{margin:3px auto 0;width:220px;height:3px;background:rgba(0,0,0,.5);overflow:hidden}#r600Hud .x i{display:block;height:100%;background:#d8b86a}'+
 '.r600Cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}@media (max-width:640px){.r600Cards{grid-template-columns:1fr}}'+
 '.r600Card{display:flex;flex-direction:column;gap:6px;text-align:left;padding:12px 12px 14px;min-height:118px;border-radius:8px;border:1px solid rgba(201,184,140,.35);background:linear-gradient(180deg,rgba(32,26,30,.92),rgba(16,13,16,.95));color:#efe6d6;cursor:pointer}'+
 '.r600Card:hover,.r600Card:focus-visible{border-color:#c9b88c;outline:none;box-shadow:0 0 0 2px rgba(201,184,140,.35)}.r600Card.core{border-color:rgba(120,210,200,.45)}.r600Card b{font-size:14px}.r600Card span{font-size:12px;opacity:.85;line-height:1.45}.r600Card em{font-style:normal;font-size:11px;color:#c9b88c}.r600Card.core em{color:#8fd4c8}'+
 '.r600Heroes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}@media (max-width:640px){.r600Heroes{grid-template-columns:repeat(2,minmax(0,1fr))}}';

// ── 지형·방 ──
function layoutFor(id){const EX=window.__STORYWORLD_EXPLORATION__,host=G(()=>EX.layout(id),null),A=arena(host?.bounds),cells=[];
 for(let y=A.y0;y<A.y1;y++)for(let x=A.x0;x<A.x1;x++)cells.push([x,y]);
 const wall=(x,y,width,depth,n)=>({id:'r600-wall:'+id+':'+n,x,y,width,depth,height:2.7,annex:true,survivalR600:true});
 const walls=[wall((A.x0+A.x1)/2,A.y0,A.w,.24,0),wall((A.x0+A.x1)/2,A.y1,A.w,.24,1),wall(A.x0,(A.y0+A.y1)/2,.24,A.h,2),wall(A.x1,(A.y0+A.y1)/2,.24,A.h,3)];
 const [bx0,by0,bx1,by1]=A.bounds,entry={x:A.cx,y:A.cy+1.8};
 return {version:host?.version||'storyworld-exploration-r600',id,type:'r600-survival',rotation:0,mirrored:false,bounds:[bx0,by0,bx1,by1],chunkSize:10,chunkColumns:Math.ceil((bx1-bx0)/10),chunkRows:Math.ceil((by1-by0)/10),walls,centralArena:null,branches:[],
  surface:host?.surface?{...host.surface}:undefined,expanded:true,floorCells:cells,floorRects:[{x:A.x0,y:A.y0,width:A.w,depth:A.h}],nodes:[{id:0,x:A.cx,y:A.cy,radius:Math.min(A.w,A.h)/2,shape:'square',width:A.w,depth:A.h}],edges:[],
  coreFloorRects:[],coreReshaped:true,connectorFloorRects:[],backdropRects:[],fogRects:[],chunkMinX:bx0,chunkMinY:by0,entry,entrance:{...entry},
  renderEnvelope:{u0:bx0-by1-4,u1:bx1-by0+4,v0:bx0+by0-4,v1:bx1+by1+4},regional55:null,regional59:null,scenery59:null,mazeR73:null,voidCover:host?.voidCover||{tint:'#0b0a0d',opacity:1},
  worldR74:{...(host?.worldR74||{mode:'outdoor',style:'stone-garden'}),rooms:[],doors:[],nativeCorePreserved:true,wallCount:walls.length,floorCount:cells.length,survivalR600:true},
  worldR75:null,worldR78:null,worldWardR81:null,refugeR82:null,survivalR600:{centre:{x:A.cx,y:A.cy},arena:A}};}
let makeNative=null;
function roster(id){const t=G(()=>makeNative(id,'STORY'),null),out={normal:[],boss:null,mid:null,template:t};if(!t)return out;const seen=new Set();
 for(const e of t.enemies||[]){if(!e||!e.profile)continue;const mid=/^중간보스/.test(String(e.name||''))||/^mb-/.test(String(e.nativeId||''));
  if(e.boss){if(!out.boss)out.boss=e;continue;}if(mid){if(!out.mid)out.mid=e;continue;}
  const k=String(e.nativeId||e.name);if(seen.has(k))continue;seen.add(k);out.normal.push(e);}
 return out;}
function buildRoom(id){const R=roster(id),t=R.template||{},L=layoutFor(id),c=L.survivalR600.centre;
 const r={...t,id,layer:'STORY',props:[{id:'r600:core',r600CoreProp:true,x:c.x,y:c.y,solid:false,visible:true,autoTargetEligible6:false,label:'정화 코어',height:80}],enemies:[],kills:0,engaged:false,cleared:false,finalizing:false,encounterStage:'survivalR600',activeEncounter:null,fieldWaves6:[],fieldWaveIndex6:0,fieldWaveTotal6:0,fieldWaveCleared6:true,
  storyRosterIds6:[],defeatedActorIds:new Set(),exploration:L,explorationGroups:[],worldR74:1,r75Decorated:true,worldCombatR78:true,worldEnvironmentR81:true,r99Trees:true,r40RosterApplied:true,
  persona:{...(t.persona||{}),phase:'none'},objective:{x:-60,y:-60,path:t.objective?.path}/* 엔진 '기억의 표식'은 지도 밖으로(코어가 그 자리) */,survivalR600:{roster:R,centre:c,arena:L.survivalR600.arena}};
 return r;}
function rosterPaths(R){const out=new Set();for(const e of [...R.normal,R.boss,R.mid].filter(Boolean)){const d=e.profile;if(!d)continue;if(d.path)out.add(d.path);for(const f of Object.values(d.frames||{}))if(f?.path)out.add(f.path);for(const f of Object.values(d.actions||{}))if(f?.path)out.add(f.path);if(e.path)out.add(e.path);}return[...out];}

// ── 무대 들어가기 ──
async function go(i){if(!S||entering)return false;const id=S.ids[i];const def=G(()=>regionById[id],null);if(!def)return false;
 narrStop();gems=[];beams=[];S.ready=false;/* 들어가는 동안(엔진 tick 이 새 방으로 돌 수 있음) 단계 판정을 멈춘다 — 앞 지역 시각으로 '빈 방'을 보고 보스로 넘기던 문제 */S.i=i;S.phase='pre';S.narrating=false;S.narrEndAt=NaN;S.bossUp=false;S.clearAt=NaN;S.stageKills=0;S.core.hp=Math.max(S.core.hp,CS().max*.5);
 const prev=stageRoom;stageRoom=buildRoom(id);const c=stageRoom.survivalR600.centre,extra=[...rosterPaths(stageRoom.survivalR600.roster),ORB,GEM],old=def.paths;def.paths=[...new Set([...(old||[]),...extra])];
 // 스토리에서 아직 열리지 않은 지역도 생존 모드에서는 들어간다: 잠긴 지역 되돌림(R63 isUnlocked4 → 최근 쉼터)을 이 진입 동안만 통과시킨다
 //  (엔진의 협동 '권한 있는 지역 불러오기' 질문에 이 지역만 예라고 답함 — QA 가 잠긴 지역에 들어갈 때 쓰는 것과 같은 길). 진행·해금 기록은 바꾸지 않는다.
 const CO=window.__STORYWORLD_COOP_SIM_R62__,lift=!!CO;if(lift){try{window.__STORYWORLD_COOP_SIM_R62__={...CO,authoritativeRegionLoad:(rid,l)=>(rid===id&&l==='STORY')||!!CO.authoritativeRegionLoad?.(rid,l)};}catch(e){fail(e);}}
 entering++;let ok=false;try{ok=await enterRegion(id,null,{layer:'STORY',restore:true,noStory:true,position:{x:c.x,y:c.y+1.8}});}catch(e){fail(e);}finally{entering--;def.paths=old;if(lift)try{window.__STORYWORLD_COOP_SIM_R62__=CO;}catch(e){fail(e);}}
 if(!ok||G(()=>room,null)!==stageRoom){stageRoom=prev&&G(()=>room,null)===prev?prev:null;return false;}
 stats.stages++;S.stageAt=G(()=>time,0);S.startPos=G(()=>({x:player.x,y:player.y}),null);S.ready=true;try{auto=true;guide=false;}catch(_){}
 const pre=scenesOf(def,'pre');const n=narrPlay(pre.length?pre:scenesOf(def,'body'));if(!n){S.narrEndAt=G(()=>time,0)+NO_TEXT_SECS-TAIL;}
 try{toast('무한 생존 · '+(S.loop?(S.loop+1)+'회차 · ':'')+(i+1)+'/'+S.ids.length+' '+def.title,3.2);}catch(_){}hud(true);return true;}
function scenesOf(def,part){try{return (def.records||[]).map(r=>({text:part==='body'?(r.paragraphs||[]).join('\n\n'):String(r[part]||''),narrator:r.narrator})).filter(s=>s.text.trim());}catch(e){fail(e);return[];}}
function deactivate(){if(S)S.active=false;stageRoom=null;narrStop();gems=[];beams=[];choiceQ=0;choosing=false;hud(false);}

// ── 몹 ──
function baseAtk(){let v=40;try{v=Number(attackPower())||40;if(player.samong>0)v/=7+.4*(typeof rank==='function'?rank('samongPower'):0);else if(player.ego>0)v/=1.55;}catch(_){}return Math.max(8,v);}
function spawnAt(src,at,{major=false,mid=false}={}){const def=G(()=>regionById[room.id],null);if(!src?.profile||!def)return null;let e;
 try{e=actor3(src.profile,'r600:'+room.id+':'+(++S.serial),at.x,at.y,!!(major&&!mid),'STORY',def,!!mid);}catch(err){fail(err);return null;}if(!e)return null;
 if(!e.nativeId)e.nativeId=src.nativeId;e.name=String(src.name||e.name||'').replace(/\s*(후속 증원|증원|추격대)$/,'').replace(/\s+\d+$/,'');
 e.spawnState='active';e.homeX=at.x;e.homeY=at.y;e.explorationLeash=null;e.graceUntil=G(()=>time,0)+.6;e.cd=Math.max(.6,e.cd||1);e.survivalR600=true;
 if(e.combatProfile)e.combatProfile={...e.combatProfile,aggro:80};room.enemies.push(e);stats.spawned++;return e;}
function ringPoint(c,min,max,A){for(let t=0;t<20;t++){const a=Math.random()*Math.PI*2,d=min+Math.random()*(max-min),q={x:clamp(c.x+Math.cos(a)*d,A.x0+.8,A.x1-.8),y:clamp(c.y+Math.sin(a)*d,A.y0+.8,A.y1-.8)};
  if(Math.hypot(q.x-player.x,q.y-player.y)>=min*.75&&!G(()=>blocked(q.x,q.y,.45,room),false))return q;}return null;}
function swarm(e,elite){const atk=baseAtk(),m=hpMul(S.i,S.loop);e.ai='melee';e.type='melee';e.rangedWindup=0;e.samongSurvival=true;e.speed=(e.speed||1)*(elite?1.3:1.55);
 e.damage=(e.damage||8)*(elite?.85:.55)*(1+.25*S.loop);e.maxHp=e.hp=Math.max(1,Math.round(atk*(elite?6:1.25)*m));if(elite){e.r600Elite=true;e.defScale=(e.defScale||1)*1.22;e.name=e.name+' · 짙은 형상';}
 if(Math.random()<.32)e.r600Core=true;}
let spawnAt0=0;
function tickSpawn(){const x=room.survivalR600,R=x.roster,t=G(()=>time,0);if(!R.normal.length||!spawning(S,t))return;
 const alive=room.enemies.filter(living).length,c=cap(t-S.stageAt,S.i,low());if(t<spawnAt0||alive>=c)return;spawnAt0=t+.35;
 const n=Math.min(4,c-alive);for(let k=0;k<n;k++){const q=ringPoint(player,RING[0],RING[1],x.arena);if(!q)break;const src=R.normal[S.serial%R.normal.length],e=spawnAt(src,q);if(e)swarm(e,(S.serial%13)===12);}}
function bossIn(){const x=room.survivalR600,R=x.roster,src=R.boss||R.mid;if(!src)return null;const q=ringPoint(player,7,9,x.arena)||{x:x.centre.x,y:x.arena.y0+3};
 const e=spawnAt(src,q,{major:true,mid:!R.boss});if(!e)return null;const m=hpMul(S.i,S.loop),atk=baseAtk();
 e.maxHp=e.hp=Math.max(1,Math.round(Math.min(e.maxHp,atk*(R.boss?70:40))*m));e.r600Boss=true;if(R.boss){room.engaged=true;e.phaseStage='active';e.phaseAge=0;e.rest=1.2;e.cd=1.5;}
 stats.bosses++;S.bossUp=true;try{toast((R.boss?'보스 등장 · ':'중간보스 등장 · ')+e.name,3.4);sound?.('boss');}catch(_){}return e;}
function attackTokens(){let busy=0;const ready=[];for(const e of room.enemies){if(!living(e)||!e.survivalR600||e.r600Boss)continue;if((e.attack&&!e.attack.committed)||e.rangedWindup>0)busy++;else if((e.cd||0)<=.2)ready.push(e);}
 ready.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));for(const e of ready.slice(Math.max(0,7-busy)))e.cd=Math.max(e.cd||0,.12+Math.random()*.2);}

// ── 정화 코어 ──
function coreTick(dt){const st=CS(),c=room.survivalR600.centre,core=S.core,t=G(()=>time,0);core.hp=Math.min(st.max,core.hp+st.regen*dt);
 // 코어를 노리는 적: 영웅이 가까이(4칸) 없으면 엔진 걸음 대신 코어로 걷는다. 붙으면 1초마다 코어를 깎는다.
 for(const e of room.enemies){if(!living(e)||!e.r600Core||e.r600Boss)continue;const dp=Math.hypot(e.x-player.x,e.y-player.y),dc=Math.hypot(e.x-c.x,e.y-c.y);
  if(dc<1.35){if(t-(e.r600CoreAt||-9)>=1){e.r600CoreAt=t;const d=Math.max(1,(e.damage||8)*1.1);core.hp-=d;core.hitAt=t;stats.coreHits++;}}
  else if(dp>4&&e.r600Snap){const sp=1.25*(e.speed||1)*dt,k=sp/Math.max(.001,dc);e.x=e.r600Snap.x+(c.x-e.r600Snap.x)*k;e.y=e.r600Snap.y+(c.y-e.r600Snap.y)*k;e.moving=true;e.direction=typeof facing==='function'?G(()=>facing(c.x-e.x,c.y-e.y),e.direction):e.direction;}
  e.r600Snap=null;}
 // 정화 공격
 core.cd-=dt;if(core.cd<=0){core.cd=st.rate;const tg=room.enemies.filter(e=>living(e)&&(!e.boss||room.engaged)&&Math.hypot(e.x-c.x,e.y-c.y)<=st.range).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y)).slice(0,st.shots);
  for(const e of tg){beams.push({x:e.x,y:e.y,at:t});try{hitEnemy(e,baseAtk()*1.1*st.dmg);}catch(err){fail(err);}stats.coreShots++;}
  if(!tg.length)core.cd=.25;}
 beams=beams.filter(b=>t-b.at<.22);
 if(core.hp<=0&&!S.over){core.hp=0;stats.coreLost++;over('core');}}
function snapCoreWalkers(){if(!here())return;const c=room.survivalR600.centre;for(const e of room.enemies)if(living(e)&&e.r600Core&&Math.hypot(e.x-player.x,e.y-player.y)>4&&Math.hypot(e.x-c.x,e.y-c.y)>=1.35)e.r600Snap={x:e.x,y:e.y};}

// ── 경험치 조각 ──
function gemTick(dt,vacuum){const p=player;let got=0;for(const g of gems){const d=Math.hypot(g.x-p.x,g.y-p.y);if(vacuum||d<GEM_PULL||g.pull){g.pull=true;const sp=(vacuum?14:9)*dt,k=Math.min(1,sp/Math.max(.001,d));g.x+=(p.x-g.x)*k;g.y+=(p.y-g.y)*k;}
  if(Math.hypot(g.x-p.x,g.y-p.y)<GEM_TAKE){g.taken=true;got+=g.v;}}
 if(got){gems=gems.filter(g=>!g.taken);credit(got);}}
let rawGainXP=null;
// 조각을 먹으면 생존 경험치. 레벨이 오르면 3택을 하나씩 열고, 영웅 레벨(엔진 공격력·최대 체력 비례)도 같이 올린다. 패시브 포인트는 주지 않는다.
function credit(v){stats.gems++;const r=levelUps(S.xp,S.lv,v);S.xp=r.xp;S.lv=r.lv;if(r.ups>0){choiceQ+=r.ups;stats.levels+=r.ups;
  try{player.level=Math.min(99,Math.max(player.level,S.lv));player.hp=Math.min(maxHP(),player.hp+maxHP()*.08*r.ups);fx?.('sigil',player.x,player.y,{asset:VFX.heal,size:2,life:.8});}catch(e){fail(e);}}}

// ── 3택 강화 ──
function pool(){const out=[];try{for(const u of UPGRADES){if(u.dream)continue;const k=typeof upgradeKey==='function'?upgradeKey(u):u.id;out.push({id:'u:'+u.id,key:k,name:u.name,text:u.text,max:u.max,level:+(player.upgrades?.[k]||0),kind:'hero'});}}catch(e){fail(e);}
 for(const u of CORE_UPS)out.push({id:'c:'+u.id,key:u.id,name:u.name,text:u.text,max:u.max,level:+(S.core.lv[u.id]||0),kind:'core'});return out;}
function apply(o){try{if(o.kind==='mend'){player.hp=Math.min(maxHP(),player.hp+maxHP()*.4);S.core.hp=Math.min(CS().max,S.core.hp+CS().max*.4);return;}
 if(o.kind==='core'){const before=CS().max;S.core.lv[o.key]=(S.core.lv[o.key]||0)+1;const after=CS().max;if(after>before)S.core.hp+=after-before;return;}
 player.upgrades=player.upgrades||{};player.upgrades[o.key]=(+player.upgrades[o.key]||0)+1;if(/vital$/.test(o.key))player.hp=Math.min(maxHP(),player.hp+(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal?.(35,player)??35));
 try{refreshIcons?.();}catch(_){}}catch(e){fail(e);}finally{S.taken[o.id]=(S.taken[o.id]||0)+1;stats.choices++;}}
function showChoice(){if(choosing||!choiceQ||!here()||G(()=>modal,false)||G(()=>loading,false)||S.over)return;choosing=true;choiceQ--;try{document.body.classList.add('r600Modal');}catch(_){}
 const opts=pickThree(pool());const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 openPanel('<div class="eyebrow">생존 레벨 '+(S.lv-choiceQ)+' · 강화 하나 고르기</div><h2>기억이 선명해집니다</h2><p class="small">세 갈래 중 하나를 고르세요. 고르는 동안 전투는 멈춥니다.</p><div class="r600Cards">'+
  opts.map((o,n)=>'<button type="button" class="r600Card '+(o.kind==='core'?'core':'')+'" id="r600Pick'+n+'"><b>'+esc(o.name)+'</b><span>'+esc(o.text)+'</span><em>'+(o.kind==='mend'?'즉시':((o.kind==='core'?'정화 코어 · ':'영웅 · ')+'단계 '+o.level+' → '+(o.level+1)+(Number.isFinite(o.max)?' / '+o.max:'')))+'</em></button>').join('')+'</div>');
 let used=false;// 한 창에서 한 번만(두 번 눌러도, 닫힌 창의 단추가 남아 있어도 다시 적용하지 않음)
 opts.forEach((o,n)=>{const b=document.getElementById('r600Pick'+n);if(b)b.onclick=()=>{if(used)return;used=true;for(let k=0;k<opts.length;k++){const x=document.getElementById('r600Pick'+k);if(x){x.disabled=true;x.removeAttribute('id');}}apply(o);choosing=false;try{closePanel(true);}catch(_){}hud(true);};});
 setTimeout(()=>{try{document.getElementById('r600Pick0')?.focus?.();}catch(_){}},30);}

// ── 끝 ──
function over(why){if(!S||S.over)return;S.over=true;narrStop();try{clearControls?.();}catch(_){}
 const def=G(()=>regionById[S.ids[S.i]],null),secs=Math.round((Date.now()-S.startWall)/1000),hero=S.hero;
 openPanel('<div class="eyebrow">무한 생존 · 기록</div><h2>'+(why==='core'?'정화 코어가 부서졌습니다':'정화가 끊겼습니다')+'</h2>'+
  '<p>'+(S.loop?(S.loop+1)+'회차 · ':'')+(S.i+1)+' / '+S.ids.length+' 지역 「'+(def?.title||'')+'」까지 · 처치 '+S.kills+' · 생존 레벨 '+S.lv+' · '+Math.floor(secs/60)+'분 '+(secs%60)+'초</p>'+
  '<div class="actions"><button id="r600Again" class="primary">다시 도전</button><button id="r600Title">처음 화면</button></div>');
 const again=document.getElementById('r600Again'),ttl=document.getElementById('r600Title');
 if(again)again.onclick=()=>{try{closePanel(true);}catch(_){}start(hero);};if(ttl)ttl.onclick=()=>{deactivate();try{showTitle();}catch(e){fail(e);}};}

// ── 한 프레임 ──
function step(dt){const t=G(()=>time,0);if(S.over||!S.ready)return;
 tickSpawn();attackTokens();coreTick(dt);gemTick(dt,S.phase==='clear');if(S.over)return;
 const alive=room.enemies.some(living),sp=spawning(S,t);
 if(S.phase!=='clear'&&!alive&&!sp&&t-S.stageAt>3){const def=G(()=>regionById[room.id],null);
  if(S.phase==='pre'){const post=scenesOf(def,'post'),R=room.survivalR600.roster,has=post.length>0||!!(R.boss||R.mid);S.phase=nextPhase('pre',has);
   if(S.phase==='boss'){const n=narrPlay(post);if(!n)S.narrEndAt=t;bossIn();}}
  else S.phase='clear';
  if(S.phase==='clear'){S.clearAt=t+CLEAR_WAIT;stats.clears++;try{toast('정화 완료 · 남은 조각을 모읍니다',2.2);fx?.('sigil',room.survivalR600.centre.x,room.survivalR600.centre.y,{asset:VFX.cross,size:3,life:1.2});sound?.('clear');}catch(_){}}}
 room.enemies=room.enemies.filter(e=>living(e)||t-(e.deadAt||t)<1.5);
 if(S.phase==='clear'&&t>=S.clearAt&&!gems.length&&!entering&&!choiceQ&&!narrPlaying()){const n=advance(S.i,S.loop,S.ids.length);if(n.loop>S.loop)stats.loops++;S.loop=n.loop;go(n.i);}
 if(t-hudAt>.25)hud(true);}

// ── 그리기 ──
function drawCore(){if(!here())return;const c=room.survivalR600.centre,q=project(c.x,c.y),ui=G(()=>zoom,1),t=G(()=>time,0),st=CS();
 const row=G(()=>readyImage(ORB),null),im=row?.image;const ah=Math.max(64,typeof actorHeight==='function'?actorHeight():70);const D=ah*.78,k=D/44;
 const oy=q.y-ah*.86+Math.sin(t*2.2)*ah*.03;// 구슬 중심(받침 위에 떠 있음)
 ctx.save();try{
  // 바닥 고리(정화 사거리)
  ctx.globalAlpha=.26;ctx.strokeStyle='#8fe6d8';ctx.lineWidth=1.5;ctx.setLineDash?.([6,6]);ctx.beginPath();ctx.ellipse?.(q.x,q.y,st.range*TILE*ui,st.range*TILE*ui*.5,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash?.([]);
  // 바닥 빛 웅덩이
  ctx.globalAlpha=.20+.07*Math.sin(t*3);ctx.fillStyle='#7fe6d6';ctx.beginPath();ctx.ellipse?.(q.x,q.y,TILE*ui*1.5,TILE*ui*.75,0,0,Math.PI*2);ctx.fill();
  // 돌 받침(아래 넓고 위 좁은 사각뿔대, 빛은 왼쪽 위)
  const bw=ah*.42,tw=ah*.24,bh=ah*.46,by=q.y-ah*.04;ctx.globalAlpha=1;
  ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse?.(q.x,q.y,bw*1.15,bw*.42,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3a4448';ctx.beginPath();ctx.moveTo(q.x-bw,by);ctx.lineTo(q.x,by+bw*.32);ctx.lineTo(q.x,by-bh+tw*.32);ctx.lineTo(q.x-tw,by-bh);ctx.closePath();ctx.fill();
  ctx.fillStyle='#262d31';ctx.beginPath();ctx.moveTo(q.x+bw,by);ctx.lineTo(q.x,by+bw*.32);ctx.lineTo(q.x,by-bh+tw*.32);ctx.lineTo(q.x+tw,by-bh);ctx.closePath();ctx.fill();
  ctx.fillStyle='#55626a';ctx.beginPath();ctx.moveTo(q.x-tw,by-bh);ctx.lineTo(q.x,by-bh-tw*.32);ctx.lineTo(q.x+tw,by-bh);ctx.lineTo(q.x,by-bh+tw*.32);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.55+.3*Math.sin(t*4);ctx.strokeStyle='#9ff5e6';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(q.x-tw*.55,by-bh*.25);ctx.lineTo(q.x-tw*.55,by-bh*.8);ctx.moveTo(q.x-bw*.62,by-bh*.08);ctx.lineTo(q.x-tw*.9,by-bh*.6);ctx.stroke();
  // 빛기둥
  {const a0=.10+.04*Math.sin(t*5);ctx.fillStyle='#bff8ee';for(let i=0;i<4;i++){ctx.globalAlpha=a0*(1-i*.24);ctx.fillRect(q.x-D*(.16-.03*i),oy-D*.5-ah*(.35+.3*i),D*(.32-.06*i),ah*.35);}}
  ctx.globalAlpha=1;
  const sw=136,sh=112;// 칸 안 구슬 중심 ≈ (68,48), 지름 ≈ 44
  if(im&&(im.naturalWidth||im.width)>0){const fr=Math.floor(t*10)%36;ctx.drawImage(im,fr%6*sw,Math.floor(fr/6)*sh,sw,sh,q.x-68*k,oy-48*k,sw*k,sh*k);}
  else{ctx.fillStyle='#7fd6c8';ctx.beginPath();ctx.arc(q.x,oy,D*.5,0,Math.PI*2);ctx.fill();}
  if(t-S.core.hitAt<.18){ctx.globalAlpha=.45;ctx.fillStyle='#ff6a5a';ctx.beginPath();ctx.arc(q.x,oy,D*.55,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  const top=q.y+ah*.3;
  // 정화 빛줄기
  for(const b of beams){const p=project(b.x,b.y),a=1-(t-b.at)/.22;ctx.globalAlpha=clamp(a,0,1)*.9;ctx.strokeStyle='#c8fff4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q.x,oy);ctx.lineTo(p.x,p.y-18);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='#ffffff';ctx.stroke();}
  // 체력 막대
  ctx.globalAlpha=1;const w=Math.max(64,D*1.3),hp=clamp(S.core.hp/st.max,0,1);ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(q.x-w/2-1,top-7,w+2,7);ctx.fillStyle=hp>.35?'#7fe0d0':'#ff7a5a';ctx.fillRect(q.x-w/2,top-6,w*hp,5);
  // 경험치 조각
  const g0=G(()=>readyImage(GEM),null)?.image;for(const g of gems){const p=project(g.x,g.y);if(p.x<-20||p.y<-20||p.x>W+20||p.y>H+20)continue;
   if(g0&&(g0.naturalWidth||g0.width)>0)ctx.drawImage(g0,p.x-4,p.y-14,8,16);else{ctx.fillStyle='#d8b86a';ctx.fillRect(p.x-2,p.y-8,4,8);}}
 }catch(e){fail(e);}finally{ctx.restore();}}

// ── HUD ──
let hudEl=null;
function hud(on){try{if(!hudEl||!hudEl.isConnected){subs(null);hudEl=document.createElement('div');hudEl.id='r600Hud';hudEl.innerHTML='<div class="s"></div><div class="c"><i></i></div><div class="x"><i></i></div>';document.body.appendChild(hudEl);}
 try{document.body.classList.toggle('r600On',!!(on&&here()));const bb=document.getElementById('bossbar');const br=bb&&!bb.classList.contains('hidden')?bb.getBoundingClientRect():null,showB=!!(br&&br.height>0&&getComputedStyle(bb).display!=='none'&&getComputedStyle(bb).visibility!=='hidden');/* bossbar 는 position:fixed 라 offsetParent 가 늘 null — 크기로 본다 */hudEl.classList.toggle('low',showB);hudEl.style.top=showB?Math.round(br.bottom+6)+'px':'';}catch(_){}
 if(!on||!here()){hudEl.classList.remove('on');return;}hudAt=G(()=>time,0);const def=G(()=>regionById[room.id],null),st=CS();
 const ph=S.phase==='pre'?(spawning(S,hudAt)?'몰려오는 적':'남은 적 정리'):S.phase==='boss'?(S.bossUp?'보스전':'보스 서사'):'정화 완료';
 hudEl.querySelector('.s').textContent='무한 생존 '+(S.loop?(S.loop+1)+'회차 · ':'· ')+(S.i+1)+'/'+S.ids.length+' '+(def?.title||'')+' · '+ph+' · 처치 '+S.kills;
 hudEl.querySelector('.c i').style.width=(100*clamp(S.core.hp/st.max,0,1)).toFixed(1)+'%';
 hudEl.querySelector('.x i').style.width=(100*clamp(S.xp/xpNeed(S.lv),0,1)).toFixed(1)+'%';hudEl.classList.add('on');}catch(e){fail(e);}}

// ── 시작 ──
function heroPicker(){const H=G(()=>HEROES,{}),ids=Object.keys(H);const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 openPanel('<div class="eyebrow">무한 생존 · 영웅 고르기</div><h2>누구의 기억으로 버틸까요</h2><p class="small">맵 중앙의 정화 코어를 지키며 몰려오는 적을 버팁니다. 서사가 흐르는 동안 적이 계속 나오고, 보스 서사가 나오면 보스가 나타납니다. 모든 적을 정화하면 다음 기억으로 넘어갑니다. 이 모드는 저장하지 않습니다.</p>'+
  '<div class="r600Heroes">'+ids.map(id=>'<button type="button" data-r600hero="'+esc(id)+'">'+esc(H[id]?.name||id)+'</button>').join('')+'</div><div class="actions"><button id="r600Back">뒤로</button></div>');
 for(const b of document.querySelectorAll('[data-r600hero]'))b.onclick=()=>start(b.getAttribute('data-r600hero'));
 const back=document.getElementById('r600Back');if(back)back.onclick=()=>{pending=false;try{showTitle();}catch(e){fail(e);}};}
async function start(hero){try{pending=false;stats.starts++;deactivate();S=fresh(hero||'hwando');choiceQ=0;
 entering++;let ok;try{ok=await newGame(S.hero);}finally{entering--;}if(ok===false||!S?.active){deactivate();return false;}
 for(let i=0;i<100&&G(()=>loading,false);i++)await new Promise(r=>setTimeout(r,100));
 try{storyQueue=[];storyScene=null;storyDone=null;if(G(()=>modal,false))closePanel(true);}catch(_){}
 if(!S.ids.length){deactivate();return false;}return await go(0);}catch(e){fail(e);deactivate();return false;}}
function titleButton(){const panel=document.getElementById('panel'),normal=document.getElementById('campaignNew54')||document.getElementById('newBtn');if(!panel||!normal||document.getElementById('survivalStartR600'))return;
 const b=document.createElement('button');b.id='survivalStartR600';b.type='button';b.textContent='무한 생존으로 시작';b.title='맵 중앙의 정화 코어를 지키며 서사 순서대로 몰려오는 적을 버팁니다(저장하지 않음)';
 b.onclick=()=>{pending=true;heroPicker();};const cin=document.getElementById('cinemaStartR461');if(cin&&cin.parentNode)cin.parentNode.insertBefore(b,cin);else(normal.parentNode||panel).appendChild(b);stats.titleButtons=(stats.titleButtons||0)+1;}

// ── 엔진 연결 ──
function install(){makeNative=makeRoom;
 const EX=window.__STORYWORLD_EXPLORATION__;if(EX&&typeof EX.layout==='function'){const own={};for(const k of Object.keys(EX))own[k]=EX[k];own.layout=function(id,...a){if(stageRoom&&S?.active&&id===stageRoom.id&&G(()=>layer,'')==='STORY')return stageRoom.exploration;return EX.layout.call(EX,id,...a);};own.survivalR600=true;try{window.__STORYWORLD_EXPLORATION__=Object.freeze(own);}catch(e){fail(e);}}
 const getBase=getRoom;getRoom=function(id=zone,l=layer){if(stageRoom&&S?.active&&id===stageRoom.id&&l==='STORY')return stageRoom;return getBase.apply(this,arguments);};
 const enterBase=enterRegion;enterRegion=async function(...a){if(!entering&&S?.active)deactivate();return enterBase.apply(this,a);};
 const tickBase=tick;tick=function(dt){try{snapCoreWalkers();}catch(e){fail(e);}const r=tickBase.apply(this,arguments);try{if(here()&&!G(()=>modal,false)&&!G(()=>loading,false)&&player.hp>0){step(dt);showChoice();}}catch(e){fail(e);}return r;};
 rawGainXP=gainXP;gainXP=function(v,...a){if(here()&&inKill){if(Number.isFinite(+v)&&+v>0&&inKill.e){gems.push({x:inKill.e.x+(Math.random()-.5)*.4,y:inKill.e.y+(Math.random()-.5)*.4,v:+v});
   if(gems.length>GEM_CAP){const a0=gems.shift(),b0=gems[0];b0.v+=a0.v;}}return;}return rawGainXP.call(this,v,...a);};
 const killBase=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded;if(!here()||!first)return killBase.apply(this,[e,...a]);inKill={e};let r;try{r=killBase.apply(this,[e,...a]);}finally{inKill=false;}
  try{if(e.deadRecorded){S.kills++;S.stageKills++;stats.kills++;const st=CS();S.core.hp=Math.min(st.max,S.core.hp+st.heal*(e.r600Boss?15:1));}}catch(err){fail(err);}return r;};
 if(typeof finishEncounter==='function'){const base=finishEncounter;finishEncounter=function(...a){if(here())return;return base.apply(this,a);};}
 if(typeof saveGame==='function'){const base=saveGame;saveGame=function(...a){if(S?.active){stats.saveBlocked++;return false;}return base.apply(this,a);};}
 if(typeof guideStep==='function'){const base=guideStep;guideStep=function(...a){if(here()){try{guide=false;}catch(_){}return;}return base.apply(this,a);};}
 // 코어·빛줄기·조각은 엔진 그리기 순서 안(지형 위, 배우 그리기 전 — 출구 표식 자리)에서 그린다. draw 뒤에 그리면 프레임 명령이 이미 넘어가 화면에 닿지 않는다.
 if(typeof drawExits==='function'){const base=drawExits;drawExits=function(...a){if(here())return;return base.apply(this,a);};}
 if(typeof updateHUD==='function'){const base=updateHUD;let plain='';updateHUD=function(...a){const r=base.apply(this,a);try{const el=document.getElementById('hint');if(el){const tx=el.textContent||'';if(!/포탈|표식|제단|기록/.test(tx))plain=tx;else if(here()&&plain)el.textContent=plain;}}catch(e){fail(e);}return r;};}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p&&p.r600CoreProp){if(here()){try{drawCore();stats.coreDraws=(stats.coreDraws||0)+1;}catch(e){fail(e);}}return;}return base.apply(this,[p,...a]);};}
 if(typeof travel==='function'){const base=travel;travel=function(...a){if(here())return false;return base.apply(this,a);};}
 if(typeof interact==='function'){const base=interact;interact=function(...a){if(here())return false;return base.apply(this,a);};}
 if(typeof enterNarrative==='function'){const base=enterNarrative;enterNarrative=function(...a){if(S?.active)return;return base.apply(this,a);};}
 if(typeof showDeath==='function'){const base=showDeath;showDeath=function(...a){if(S?.active&&!S.over){stats.deaths++;over('hero');return;}if(S?.over)return;return base.apply(this,a);};}
 if(typeof showTitle==='function'){const base=showTitle;showTitle=function(...a){if(S?.active)deactivate();pending=false;const r=base.apply(this,a);try{titleButton();}catch(e){fail(e);}return r;};}
 if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(...a){if(S?.active)deactivate();return base.apply(this,a);};}
 if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){if(S?.active&&!S.over&&a[0]!==S.hero)deactivate();return base.apply(this,a);};}
 try{titleButton();}catch(e){fail(e);}}
try{install();}catch(e){fail(e);}
// 창(강화 고르기·결과·메뉴)이 열려 있으면 자막을 감춘다(카드를 가리지 않게).
try{const iv=setInterval(()=>{try{document.body.classList.toggle('r600Modal',!!(S?.active&&G(()=>modal,false)));}catch(_){}},200);iv?.unref?.();}catch(_){}
window.__STORYWORLD_SURVIVAL_R600__=Object.freeze({revision:REV,start,active:()=>!!S?.active,here,
 state:()=>S?{ready:!!S.ready,startPos:S.startPos||null,i:S.i,loop:S.loop,id:S.ids[S.i],phase:S.phase,narrating:S.narrating,narrEndAt:S.narrEndAt,bossUp:S.bossUp,kills:S.kills,core:{...S.core,stats:CS()},choiceQ,gems:gems.length,over:S.over,ids:S.ids.length}:null,
 narr:()=>({playing:narrPlaying(),queued:N.q.length,cur:N.cur?.text||null}),skipNarration:()=>{N.q.length=0;if(N.cur){N.gen++;N.cur=null;narrNext();}},
 pure:Object.freeze({xpNeed,levelUps,stageIds,arena,spawning,nextPhase,advance,cap,hpMul,coreStats,pickThree,sentences,TAIL,CORE0,CORE_UPS}),
 inspect:()=>({revision:REV,stats:{...stats},lastError,active:!!S?.active,here:here(),pending})});
})();
