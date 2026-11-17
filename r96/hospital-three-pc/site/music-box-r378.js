// R378 — 미카엘라 쉼터(dreamRest)의 춤추는 발레리나 장난감 오르골 (CX-0015, 사용자 2026-11-04 요청 · 2026-11-06 "장난감오르골작업도 드라이브에서 찾아서 작업해줘").
//  · 자리: 정본 [12 · dreamRest] '기억하지 못하는 사람' 에서 미카엘라가 처음 나오는 쉼터. 미카엘라 곁(1.6~3.2칸) 빈 바닥 한 칸에 하나만 둔다.
//    벽·문·제단·목표·입구·다른 소품을 피하고, 카메라 쪽(+x,+y)이 열린 칸만 고른다(R117 spot 과 같은 기준). 충돌·피해·자동 조준 없음(표현 전용).
//  · 그림: Dots CX-0015 v3 층 분리본(고정 상자 1장 + 발레리나 회전 8칸, 2026-11-06 인계)을 인계 규격대로 겹쳐 8장으로 굳힌 assets/r378/orgel-0..7.webp.
//    상자 픽셀은 8장이 모두 같다(같은 원본을 같은 자리에 그대로 겹침) → 프레임을 바꿔도 상자는 깜박이지 않는다. 닫힘·뚜껑 여닫이 그림은 인계본에 없어서
//    닫혀 있을 때는 발레리나가 정면(0번)에서 멈춰 있고, 곡이 흐르는 동안만 칸당 160ms 로 돈다.
//  · 상호작용: C(논리 키 'e', R291) 또는 모바일 상호작용 단추 = 전역 interact. 오르골과 1.7칸 안이고 제단·목표가 2.4칸 밖일 때만 오르골 창을 연다/닫는다.
//  · 창(양피지·짙은 금테): 지금까지 지나온 맵의 클래식 곡만(R308 맵→곡 배정, 중복 없음, 지역 순서). 재생/정지 · 이전/다음 · 곡 고르기 · 닫기. 키보드 ←/→ 이전·다음, Enter 재생/정지, Esc 닫기.
//  · 소리: 오르골 곡은 이 파일의 Audio 하나로 낸다. 틀 때 맵 곡(R308·R195·엔진)을 0.8초 페이드로 줄인 뒤 멈추고(musicTick 동안만 settings.bgm 을 줄이고
//    다 줄면 settings.music 을 잠깐 끈 상태로 돌린다 — R308 quiet() 와 같은 방식, 저장값은 바꾸지 않는다), 끄거나 닫으면 오르골을 0.8초 페이드아웃한 뒤
//    맵 곡을 멈춘 자리부터 0.8초 페이드인. 음악 끔·BGM 0·R195 클래식 끔이면 소리를 내지 않는다. 맵을 떠나면 저절로 닫힌다. 탭이 숨으면 멈췄다가 돌아오면 잇는다.
//  · 연출: 오르골 둘레만 호박색·연분홍 작은 빛 2~3겹(lighter, 그라데이션·filter·setLineDash 없음), 열렸을 때 아주 느리게 숨쉰다. 화면 나머지 색·조명은 그대로.
//    글은 열 때 한 줄 '…익숙한 선율.' 뿐(정본에 없는 사건·대사 없음).
// 끄기: localStorage['storyworld.r378.orgel']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_MUSIC_BOX_R378__)return;
const REV='R378-music-box-1',KEY='storyworld.r378.orgel',ZONE='dreamRest',INDEX='assets/r308/bgm/index.json';
const RANGE=1.7,OBJ_GUARD=2.4,FADE=.8,FRAME=.16,HEIGHT=60,ORGEL_Y=.76/*상자 가운데 높이(그림 바닥에서 비율)*/;
// 세상 그림: 쉼터 탁자(R105 Drive prop-table) 위에 오르골을 올린 8장. 창 그림: 오르골만 크게 8장(작은 화면에서도 발레리나가 보이게).
const FRAMES=[0,1,2,3,4,5,6,7].map(i=>'assets/r378/table-orgel-'+i+'.webp');
const CLOSE=[0,1,2,3,4,5,6,7].map(i=>'assets/r378/orgel-'+i+'.webp');
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={frames:0,placed:0,opens:0,closes:0,plays:0,pauses:0,nexts:0,prevs:0,picks:0,autoClose:0,muted:0,interacts:0,passed:0,errors:0,blocked:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,240);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const now=()=>performance.now()/1000;
let idx=null;fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.tracks&&j.maps)idx=j;}).catch(fail);
const spots=new Map();// layer -> {x,y}

/* ---------- 자리 ---------- */
const blockedAt=(L,x,y,s)=>{const a=window.StoryPhase1;return typeof a?.explorationBlocked==='function'?a.explorationBlocked(L,x,y,s):false;};
function anchorOf(r){const m=(r.props||[]).find(p=>p&&/michaela/i.test(String(p.id||''))&&Number.isFinite(p.x+p.y));if(m)return{x:m.x,y:m.y,who:'michaela'};
 const o=r.objective||r.altar;if(o&&Number.isFinite(o.x+o.y))return{x:o.x+2,y:o.y+1,who:'objective'};const e=r.exploration?.entry;return e?{x:e.x,y:e.y,who:'entry'}:null;}
// R169 은 입구→제단·출구 길 둘레의 장식 소품을 숨긴다 → 길 칸에서 1.6칸 넘게 떨어진 자리만(길도 막지 않게).
function pathOf(r){try{const s=window.__STORYWORLD_PLAY_R169__?.pathCells?.(r);return s?[...s].map(k=>k.split(',').map(Number)):[];}catch(_){return[];}}
function spot(r){const L=r?.exploration,cells=L?.floorCells,a=anchorOf(r);if(!L||!Array.isArray(cells)||!cells.length||!a)return null;const path=pathOf(r);
 const avoid=[L.entry&&{...L.entry,r:2.6},r.objective&&{...r.objective,r:4.2},r.altar&&{...r.altar,r:4.2},
  ...(r.props||[]).filter(p=>p&&!p.r378Orgel&&Number.isFinite(p.x+p.y)).map(p=>({x:p.x,y:p.y,r:/door/i.test(String(p.id||''))?3:/michaela/i.test(String(p.id||''))?1.5:1.7}))].filter(Boolean);
 let best=null,bk=1e9;
 for(const c of cells){const x=c[0]+.5,y=c[1]+.5,d=Math.hypot(x-a.x,y-a.y);if(d<1.6||d>3.2)continue;if(avoid.some(q=>Math.hypot(q.x-x,q.y-y)<q.r))continue;if(blockedAt(L,x,y,.5))continue;if(path.some(c=>Math.hypot(c[0]+.5-x,c[1]+.5-y)<1.6))continue;
  let open=0;for(const[dx,dy]of[[1.3,0],[-1.3,0],[0,1.3],[0,-1.3],[1.3,1.3],[2.2,2.2],[2.2,0],[0,2.2]])if(!blockedAt(L,x+dx,y+dy,.4))open++;if(open<8)continue;
  const k=Math.abs(d-2.2)+((x-a.x)+(y-a.y)<0?.6:0);// 미카엘라보다 카메라 쪽 앞자리를 조금 더
  if(k<bk){bk=k;best={x,y};}}
 return best;}
const layerOf=()=>G(()=>layer,'STORY');
function orgelOf(r=G(()=>room,null)){return r?.props?.find?.(p=>p?.r378Orgel)||null;}
function dress(r=G(()=>room,null)){try{if(!on||!r||r.id!==ZONE||!Array.isArray(r.props)||orgelOf(r))return;
  const l=layerOf();let s=spots.get(l);if(!s){s=spot(r);if(!s)return;spots.set(l,s);}
  r.props.push({id:'r378:orgel:'+ZONE,path:FRAMES[0],x:s.x,y:s.y,height:HEIGHT,radius:.3,solid:false,visible:true,enabled:true,autoTargetEligible6:false,r80PresentationOnly:true,kind:'orgel',r378Orgel:true});
  stats.placed++;if(typeof addImage==='function')for(const f of FRAMES)try{addImage(f);}catch(e){fail(e);}
  try{for(const f of CLOSE){const im=new Image();im.src=f;}}catch(_){}}catch(e){fail(e);}}

/* ---------- 곡 목록: 지나온 맵의 클래식 곡 ---------- */
function visitedZones(){const out=[];const seen=new Set();for(const k of G(()=>[...visited],[])){const z=String(k).split(':').slice(1).join(':');if(z&&!seen.has(z)){seen.add(z);out.push(z);}}return out;}
function orderOf(z){const r=G(()=>regionById[z],null);return Number.isFinite(r?.order)?r.order:1e4;}
function trackFor(z){const R=window.__STORYWORLD_BGM_MAP_R308__;if(!R?.resolve||!idx)return null;const s=G(()=>R.resolve(z,idx,{chapters:window.__STORYWORLD_SAMONG_ZONES_R115__?.chapters,samong:/^sz/.test(z)}),null);return s&&idx.tracks[s.track]?s.track:null;}
function list(zones=visitedZones()){if(!idx)return[];const ids=[];const order=[...zones].sort((a,b)=>orderOf(a)-orderOf(b));
 for(const z of order){const t=trackFor(z);if(t&&!ids.includes(t))ids.push(t);}
 if(!ids.length){const t=trackFor(ZONE);if(t)ids.push(t);}return ids;}
function label(id){const t=idx?.tracks?.[id];if(!t)return id;let ko='';try{ko=window.__STORYWORLD_BGM_PICK_R353__?.label?.(id)||'';}catch(_){}
 return{composer:t.composer||'',title:ko||t.title||id,ko:!!ko};}

/* ---------- 소리 ---------- */
const el=new Audio();el.preload='none';el.loop=true;el.volume=0;
el.onerror=()=>{if(state.track)fail('orgel track '+state.track);};
const state={open:false,tracks:[],i:0,track:null,playing:false,want:false/*곡이 흘러야 함*/,v:0/*오르골 페이드 0..1*/,g:1/*맵 곡 배율 0..1*/,openedAt:0,clock:now(),line:false};
function soundAllowed(){const s=G(()=>settings,null);if(!s||!s.music||!(s.bgm>0))return false;let c=true;try{c=window.__STORYWORLD_BGM_CLASSICAL_R195__?.inspect?.().prefs?.on!==false;}catch(_){}return c;}
function targetGain(){return state.want?0:1;}
function startEl(){try{const p=el.play();p?.catch(e=>{if(e?.name==='AbortError')return;stats.blocked++;});}catch(e){fail(e);}}
function setTrack(i){if(!state.tracks.length)return;state.i=(i%state.tracks.length+state.tracks.length)%state.tracks.length;const id=state.tracks[state.i];if(id===state.track)return;
 state.track=id;const t=idx?.tracks?.[id];if(!t)return;el.pause();el.src=t.path;el.preload='auto';try{el.currentTime=0;}catch(_){}state.v=0;if(state.want&&state.g<=.001&&!document.hidden)startEl();render();}
function play(){if(!state.open)return false;if(!state.track)setTrack(state.i);if(!soundAllowed()){stats.muted++;state.want=false;render('배경음악이 꺼져 있어 소리가 나지 않습니다.');return false;}
 state.want=true;state.playing=true;stats.plays++;render();return true;}
function pause(){state.want=false;state.playing=false;stats.pauses++;render();return true;}
function toggle(){return state.want?pause():play();}
function next(){stats.nexts++;setTrack(state.i+1);if(state.want)state.v=0;render();return state.track;}
function prev(){stats.prevs++;setTrack(state.i-1);if(state.want)state.v=0;render();return state.track;}
function pick(i){stats.picks++;setTrack(i);if(!state.want)play();render();return state.track;}
// 맵 곡 페이드: musicTick 동안만 settings.bgm 을 줄이고, 다 줄면 settings.music 을 꺼 둔 채 돌린다(R308 은 덱을 pause 만 해서 자리를 기억한다).
function bgmGain(){return Math.max(0,Math.min(1,state.g));}
// 엔진 루프는 매 화면 musicTick() 을 부른다 → 페이드·자동 닫힘도 여기서 돈다(tick 감싸기는 보조).
try{if(typeof musicTick==='function'){const base=musicTick;musicTick=function(...a){try{frame();}catch(e){fail(e);}const g=bgmGain();if(g>=.999)return base.apply(this,a);
  const s=settings,m=s.music,v=s.bgm;try{if(g<=.001)s.music=false;else s.bgm=v*g;return base.apply(this,a);}finally{s.music=m;s.bgm=v;}};}}catch(e){fail(e);}
function step(){const t=now(),dt=Math.min(.25,Math.max(0,t-state.clock));state.clock=t;const k=dt/FADE;
 if(!soundAllowed()&&state.want){state.want=false;state.playing=false;stats.muted++;render('배경음악이 꺼져 있어 소리가 나지 않습니다.');}
 if(state.want){// 맵 곡을 먼저 줄이고, 다 줄면 오르골을 올린다
  if(state.g>0)state.g=Math.max(0,state.g-k);
  else{if(el.paused&&state.track&&!document.hidden)startEl();if(!el.paused)state.v=Math.min(1,state.v+k);}}
 else{// 오르골을 먼저 내리고, 다 내리면 맵 곡을 올린다
  if(state.v>0)state.v=Math.max(0,state.v-k);
  else{if(!el.paused)el.pause();if(state.g<1)state.g=Math.min(1,state.g+k);}}
 if(document.hidden&&!el.paused)el.pause();
 if(panel){const img=panel.querySelector('.doll img'),src=state.want&&state.v>0?CLOSE[Math.floor((t-state.openedAt)/FRAME)%CLOSE.length]:CLOSE[0];if(img&&img.getAttribute('src')!==src)img.setAttribute('src',src);}
 const s=G(()=>settings,{bgm:0}),tr=idx?.tracks?.[state.track];el.volume=Math.max(0,Math.min(1,(s.bgm||0)*(tr?.gain??.6)*state.v));}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!el.paused)el.pause();});

/* ---------- 창 ---------- */
const keyLabel=()=>{let legacy=false;try{legacy=localStorage.getItem('storyworld.r291.keys')==='legacy';}catch(_){}return legacy?'E':'C';};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let panel=null;
function css(){if(document.getElementById('r378Css'))return;const st=document.createElement('style');st.id='r378Css';st.textContent=
 '#r378Orgel{position:fixed;z-index:60;top:84px;right:16px;width:300px;max-width:calc(100vw - 32px);box-sizing:border-box;padding:12px 14px 12px;'+
 'background:#d9c7a1;background:linear-gradient(#e2d2ae,#cdb78c);color:#2b1a10;border:2px solid #6b4a1c;outline:1px solid #c9a24a;outline-offset:-5px;border-radius:6px;'+
 'box-shadow:0 6px 20px rgba(0,0,0,.55);font:14px/1.45 "Noto Serif KR",serif;user-select:none;-webkit-user-select:none;touch-action:manipulation}'+
 '#r378Orgel .doll{float:right;width:74px;height:100px;margin:-2px -2px 4px 8px;display:flex;align-items:flex-end;justify-content:center}#r378Orgel .doll img{max-width:100%;max-height:100%;display:block}'+
 '#r378Orgel h4{margin:0 0 2px;font-size:15px;letter-spacing:.06em;color:#4a2a12}#r378Orgel .line{margin:0 0 8px;font-style:italic;color:#6b4a2c;font-size:12.5px;min-height:1em}'+
 '#r378Orgel .now{margin:0 0 8px;padding:6px 8px;background:rgba(80,50,20,.12);border-left:3px solid #8a5a1c;font-size:13px}#r378Orgel .now b{display:block;font-size:13.5px}'+
 '#r378Orgel ol{clear:both;list-style:none;margin:0 0 8px;padding:0;max-height:168px;overflow:auto;border-top:1px solid rgba(107,74,28,.4);border-bottom:1px solid rgba(107,74,28,.4)}'+
 '#r378Orgel li{padding:5px 6px;cursor:pointer;border-bottom:1px dotted rgba(107,74,28,.3);font-size:12.5px}#r378Orgel li.on{background:rgba(138,90,28,.22);font-weight:bold}'+
 '#r378Orgel li small{color:#6b4a2c}#r378Orgel .ctl{display:flex;gap:6px;justify-content:center}'+
 '#r378Orgel button{min-width:44px;min-height:36px;padding:4px 8px;background:#3a2414;color:#f0dfb4;border:1px solid #c9a24a;border-radius:4px;font:14px serif;cursor:pointer}'+
 '#r378Orgel button:active{background:#5a3a1c}#r378Orgel .msg{margin:6px 0 0;font-size:12px;color:#7a2a1a;min-height:0}'+
 '@media (max-width:600px){#r378Orgel{top:70px;right:auto;left:50%;transform:translateX(-50%);width:min(320px,calc(100vw - 32px))}}';
 document.head.appendChild(st);}
function render(msg){if(!state.open||!panel)return;try{const L=label(state.track);
 panel.querySelector('.now').innerHTML=state.track?'<b>'+esc(L.title)+'</b>'+(L.ko?'':esc(L.composer)+' · ')+(state.playing?'재생 중':'멈춤'):'곡을 불러오는 중…';
 panel.querySelector('ol').innerHTML=state.tracks.map((id,i)=>{const l=label(id);return'<li data-i="'+i+'"'+(i===state.i?' class="on"':'')+'>'+esc(l.title)+(l.ko?'':'<br><small>'+esc(l.composer)+'</small>')+'</li>';}).join('');
 panel.querySelector('[data-a=play]').textContent=state.playing?'❚❚':'▶';panel.querySelector('[data-a=play]').setAttribute('aria-label',state.playing?'정지':'재생');
 if(msg!==undefined)panel.querySelector('.msg').textContent=msg;}catch(e){fail(e);}}
function build(){css();panel?.remove();panel=document.createElement('div');panel.id='r378Orgel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','오르골');
 panel.innerHTML='<div class="doll"><img alt="" src="'+CLOSE[0]+'"></div><h4>오르골</h4><p class="line">…익숙한 선율.</p><div class="now"></div><ol></ol>'+
  '<div class="ctl"><button data-a="prev" aria-label="이전 곡">◀◀</button><button data-a="play" aria-label="재생">▶</button><button data-a="next" aria-label="다음 곡">▶▶</button><button data-a="close" aria-label="닫기">닫기</button></div><p class="msg"></p>';
 const stop=e=>{e.stopPropagation();};for(const ev of['pointerdown','mousedown','touchstart','click','wheel'])panel.addEventListener(ev,stop,{passive:true});
 panel.addEventListener('click',e=>{const b=e.target.closest('button'),li=e.target.closest('li');try{if(b){const a=b.dataset.a;if(a==='prev')prev();else if(a==='next')next();else if(a==='play')toggle();else if(a==='close')close();}else if(li)pick(+li.dataset.i);}catch(err){fail(err);}});
 document.body.appendChild(panel);}
function open(){if(state.open||!on)return false;const r=G(()=>room,null);if(!r||r.id!==ZONE)return false;
 state.tracks=list();const cur=state.track?state.tracks.indexOf(state.track):-1;state.i=cur>=0?cur:Math.max(0,state.tracks.indexOf(trackFor(ZONE)));
 state.open=true;state.openedAt=now();stats.opens++;build();if(state.track!==state.tracks[state.i]){state.track=null;setTrack(state.i);}play();render();
 try{if(typeof sound==='function')sound('upgrade');}catch(_){}return true;}
function close(){if(!state.open)return false;state.open=false;state.want=false;state.playing=false;stats.closes++;panel?.remove();panel=null;return true;}
// 키: 창이 열린 동안만 ←/→/Enter/Esc 를 가로챈다(R291 이 먼저 바꾼 논리 키를 본다).
window.addEventListener('keydown',ev=>{if(!state.open||ev.ctrlKey||ev.altKey||ev.metaKey)return;const t=ev.target;if(t&&(['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||t.isContentEditable))return;
 const k=ev.key;let done=true;if(k==='ArrowLeft')prev();else if(k==='ArrowRight')next();else if(k==='Enter')toggle();else if(k==='Escape')close();else done=false;
 if(done){ev.preventDefault();ev.stopImmediatePropagation();}},true);

/* ---------- 엔진 연결 ---------- */
const live=()=>G(()=>started&&!loading&&!modal&&player&&player.hp>0,false);
function nearOrgel(range=RANGE){const r=G(()=>room,null),p=G(()=>player,null),o=orgelOf(r);if(!o||!p)return null;const d=Math.hypot(o.x-p.x,o.y-p.y);return d<=range?{o,d}:null;}
function objectiveNear(){const r=G(()=>room,null),p=G(()=>player,null);const o=r?.objective;return !!(o&&p&&Math.hypot(o.x-p.x,o.y-p.y)<OBJ_GUARD);}
try{if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(on&&live()&&G(()=>room.id,'')===ZONE){dress();
   if(state.open){stats.interacts++;close();return;}
   if(nearOrgel()&&!objectiveNear()){stats.interacts++;open();return;}}}catch(e){fail(e);}stats.passed++;return base.apply(this,a);};}}catch(e){fail(e);}
let lastCheck=0;
function frame(){stats.frames++;const z=G(()=>room.id,'');if(z===ZONE&&!G(()=>loading,false)){dress();const o=orgelOf(),t=now();// 길(R169)은 방이 다 차려진 뒤에 정해진다 → 0.7초마다 지금 길과 1.6칸 안이면 다른 빈 칸으로 옮긴다(창이 닫혀 있을 때만).
  if(o&&!state.open&&t-lastCheck>.7){lastCheck=t;const r=G(()=>room,null),path=pathOf(r);if(path.some(c=>Math.hypot(c[0]+.5-o.x,c[1]+.5-o.y)<1.6)){const s=spot(r);if(s&&(s.x!==o.x||s.y!==o.y)){spots.set(layerOf(),s);o.x=s.x;o.y=s.y;stats.moved=(stats.moved||0)+1;}}}
  if(o&&o.visible===false){o.visible=true;stats.reshown=(stats.reshown||0)+1;}}
 if(state.open&&(z!==ZONE||!G(()=>started,false))){stats.autoClose++;close();}step();}
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const z=G(()=>room.id,'');if(z===ZONE)dress();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
try{if(typeof enterRegion==='function'){const b=enterRegion;enterRegion=async function(...a){if(state.open){stats.autoClose++;close();}const out=await b.apply(this,a);try{dress();}catch(e){fail(e);}return out;};}}catch(e){fail(e);}
try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...rest){if(!p?.r378Orgel)return base.call(this,p,...rest);
  try{const t=now(),spin=state.open&&state.want&&state.v>0;p.path=spin?FRAMES[Math.floor((t-state.openedAt)/FRAME)%FRAMES.length]:FRAMES[0];
   if(typeof readyImage==='function'&&!readyImage(p.path)&&typeof addImage==='function')addImage(p.path);
   const q=project(p.x,p.y),u=project(p.x+1,p.y),cell=Math.max(8,Math.hypot(u.x-q.x,u.y-q.y)),z=typeof zoom==='number'?zoom:1,lit=state.open?1:.42;
   const breathe=state.open?.82+.18*Math.sin(t*1.25):1;
   ctx.save();try{ctx.globalCompositeOperation='lighter';
    for(const[rr,col,al]of[[1.8,'255,176,96',.07],[1.45,'255,160,180',.07],[1.2,'255,206,140',.09]]){ctx.globalAlpha=al*lit*breathe;ctx.fillStyle='rgb('+col+')';ctx.beginPath();ctx.ellipse(q.x,q.y-HEIGHT*z*ORGEL_Y,cell*rr*.62,cell*rr*.36,0,0,Math.PI*2);ctx.fill();}
   }finally{ctx.restore();}
   const res=base.call(this,p,...rest);
   const near=!state.open&&nearOrgel();
   if(near&&live()){ctx.save();try{ctx.globalAlpha=.92;ctx.font='bold '+Math.max(11,12*z)+'px serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='rgba(20,12,8,.78)';
     const txt=(matchMedia?.('(pointer:coarse)').matches?'상호작용':keyLabel())+' · 오르골',w=ctx.measureText(txt).width+12,y=q.y-HEIGHT*z-6;ctx.fillRect(q.x-w/2,y-16*Math.max(1,z*.9),w,16*Math.max(1,z*.9)+2);
     ctx.fillStyle='#f0dfb4';ctx.fillText(txt,q.x,y);}finally{ctx.restore();}}
   return res;}catch(e){fail(e);return base.call(this,p,...rest);}};}}catch(e){fail(e);}

window.__STORYWORLD_MUSIC_BOX_R378__=Object.freeze({revision:REV,zone:ZONE,range:RANGE,frames:FRAMES,list,visitedZones,trackFor,spot,dress,open,close,play,pause,toggle,next,prev,pick,bgmGain,
 inspect:()=>{const o=orgelOf();return{revision:REV,on,loaded:!!idx,open:state.open,tracks:[...state.tracks],index:state.i,track:state.track,playing:state.playing,want:state.want,
  orgelVolume:+el.volume.toFixed(3),fade:+state.v.toFixed(3),bgmGain:+state.g.toFixed(3),elPaused:el.paused,elTime:+(el.currentTime||0).toFixed(2),
  orgel:o?{x:o.x,y:o.y,path:o.path,solid:o.solid,presentationOnly:!!o.r80PresentationOnly,height:o.height}:null,spots:Object.fromEntries(spots),stats:{...stats},lastError};}});
})();
