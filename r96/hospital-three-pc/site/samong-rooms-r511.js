// R511 사몽·사몽역행의 '그냥 지나치는 방'에 이유를 — 사용자 2026-11-09 "플레이어가 도달할 수 있는 공간에는 이유가 있었으면 좋겠어 패시브포인트 보상상자라도
//  있던지 해서 특히 사몽,사몽역행맵의경우 그냥 지나치는 방이 있는거 같은데 그방에도몹 나오게해서 기억조각같은거 떨어뜨리게 분산해줘 공간".
//  조사(구역 정의 163개): 입구·출구·저장 등불·상자·단서 기록·단상·코어·착지점이 하나도 없는 방(방·홀·마당, 5×5 이상)이 42구역 108방이었다.
//  · 그런 방(구역마다 입구에서 먼 순서로 최대 CAP 곳, 600칸 넘는 큰 아레나·복도·계단·좁은 방 제외, F 구역의 탑이 선 방 제외)의 가운데에
//    봉인된 '기억 조각'을 하나 둔다(희미한 붉은 결정). 방에 들어서거나 조각 4칸 안에 오면 그 구역 몹 2~3마리(체력 .8·피해 .75)가 조각을 지키러 깨어난다.
//    다 쓰러뜨리면 조각이 풀려 밝게 빛나고, 밟으면 패시브 포인트(이지 1·노말 2·하드 3 — 사몽 보물상자 2·5·7보다 작게)를 얻는다.
//  · 한 번 주운 방은 저장(samongRoomsR511.done)되어 다시 나오지 않는다(재입장·불러오기로 농사 금지). 줍기 전에 떠나면 다음에 다시 기다린다.
//  · 지킴이는 생존(666) 몹·보스가 아니어서 구역 목표(처치 수·H 물결·보스)와 문 열림에 끼어들지 않는다. 몹 처치 기본 보상(6마리당 1점)은 그대로 받는다.
//  · 건드리지 않는 곳: 대면 구역, B(광장 666)·D(코어 방어)·G(코어 호위) 구역, 잠입(순찰자) 구역, 함께하기, 사몽 밖(본편·DREAM·맘몬).
//  끄기: localStorage['storyworld.r511.rooms']='{"on":false}' 뒤 새로고침.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_ROOMS_R511__)return;
const REV='R511-samong-rooms-1',KEY='storyworld.r511.rooms',CAP=4,AREA_MAX=600,MIN_SIDE=5,WAKE=4,PICK=1.1,SETTLE=1.2;
const SHARD=Object.freeze({easy:1,normal:2,hard:3});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={planned:0,woke:0,freed:0,picked:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const SM=()=>window.__STORYWORLD_SAMONG_R103__,ZN=()=>window.__STORYWORLD_SAMONG_ZONES_R115__;
const T=()=>typeof time==='number'?time:0;
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';}catch(_){return true;}};
const here=()=>{try{return !!SM()?.here?.()&&typeof room==='object'&&!!room?.samongR103;}catch(_){return false;}};
const living=e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
let done=new Set();

// ---- 어떤 구역·어떤 방 ------------------------------------------------------------------------
function zoneOk(z){if(!z||typeof z!=='object')return false;if(z.kind==='confront')return false;if(z.mode==='B'||z.mode==='D'||z.mode==='G')return false;if(z.stealth)return false;return z.kind==='explore'||z.kind==='maze'||z.kind==='combat';}
const inRect=(R,p,m=0)=>!!p&&Number.isFinite(p.x+p.y)&&p.x>=R.x-m&&p.x<=R.x+R.w+m&&p.y>=R.y-m&&p.y<=R.y+R.h+m;
// info = {rooms:[{x,y,w,h,kind,name}], marks:[{x,y}], entry, exit}
function pick(info){if(!info||!Array.isArray(info.rooms))return[];const e=info.entry||{x:0,y:0},marks=(info.marks||[]).filter(p=>p&&Number.isFinite(p.x+p.y));const out=[];
 info.rooms.forEach((R,i)=>{if(!R||!['room','hall','yard'].includes(R.kind))return;if(!(R.w>=MIN_SIDE&&R.h>=MIN_SIDE))return;if(R.w*R.h>AREA_MAX)return;
  if(marks.some(p=>inRect(R,p,.5)))return;const cx=R.x+R.w/2,cy=R.y+R.h/2;
  out.push({i,name:String(R.name||''),x:R.x,y:R.y,w:R.w,h:R.h,cx,cy,d:Math.hypot(cx-e.x,cy-e.y)});});
 out.sort((a,b)=>b.d-a.d||a.i-b.i);return out.slice(0,CAP);}
// 지금 구역(실제 지도·소품·적)에서 표식 모으기 — 장식 소품(r115Prop·R449 가구 등)은 방에 이유를 주지 않는다.
function infoOf(r){const L=r?.exploration,X=L?.samongR103;if(!X)return null;const marks=[L.entry,X.exit,X.save,X.dais,X.core,X.top,...(X.chests||[]),...(X.landings||[])];
 for(const p of r.props||[]){if(!p||p.r511Shard)continue;if(p.samongR103||p.r115Clue||p.r115Stmt!=null||p.r115Book||p.growthR103||p.chestR103||p.r74Door)marks.push(p);}
 for(const e of r.enemies||[])if(e&&(e.r170Tower||e.boss||e.samongBoss)&&e.hp>0)marks.push({x:e.homeX??e.x,y:e.homeY??e.y});
 return{rooms:X.rooms||[],marks,entry:L.entry,exit:X.exit};}
// 구역 정의만으로(경제 점검·보고용) — 실제 실행은 infoOf 를 쓴다.
function defInfo(z){const marks=[z.entry,z.exit,z.save,z.dais,z.core,...(z.chests||[]),...(z.landings||[])];
 if(!z.r162Frag)(z.clues||[]).forEach(c=>{const R=z.rooms?.[c.room];if(R&&c.at)marks.push({x:R.x+c.at[0],y:R.y+c.at[1]});});
 return{rooms:z.rooms||[],marks,entry:z.entry,exit:z.exit};}
function estimate(CH){const byChapter={};let nests=0,zones=0;for(const[k,list]of Object.entries(CH||{}))for(const z of list||[]){if(!zoneOk(z))continue;const p=pick(defInfo(z));if(!p.length)continue;zones++;nests+=p.length;byChapter[k]=(byChapter[k]||0)+p.length;}
 return{zones,nests,byChapter,points:{easy:nests*SHARD.easy,normal:nests*SHARD.normal,hard:nests*SHARD.hard}};}

// ---- 보상 ------------------------------------------------------------------------------------
function tier(){try{const t=window.__STORYWORLD_PROGRESSION_R71__?.inspect?.()?.difficultyTier;return SHARD[t]?t:'normal';}catch(_){return'normal';}}
const nestId=(zid,R)=>String(zid)+':'+R.i;

// ---- 실행 ------------------------------------------------------------------------------------
let cur=null;// {L, zid, since, nests:[{id,R,prop,mobs:[]}]}
function shardProp(id,R){return{id:'r511:shard:'+id,r511Shard:id,r511State:'sealed',x:R.cx,y:R.cy,solid:false,visible:true,autoTargetEligible6:false,label:'기억 조각',height:40};}
function floorSpot(R){// 가운데가 막혔으면(책상 격자 등) 가까운 바닥 칸으로
 const ok=(x,y)=>{try{return !blocked(x,y,.35,room);}catch(_){return false;}};if(ok(R.cx,R.cy))return{x:R.cx,y:R.cy};
 for(let d=1;d<=Math.max(R.w,R.h);d++)for(let k=0;k<8;k++){const a=k*Math.PI/4,x=R.cx+Math.cos(a)*d,y=R.cy+Math.sin(a)*d;if(inRect(R,{x,y},-.4)&&ok(x,y))return{x,y};}return null;}
function plan(){const zid=room.samongR103.zone,z=ZN()?.zone?.(zid);cur={L:room.exploration,zid,since:T(),nests:[],ready:false};if(!zoneOk(z))return;cur.z=z;}
function settle(){cur.ready=true;if(!cur.z)return;const list=pick(infoOf(room));for(const R of list){const id=nestId(cur.zid,R);if(done.has(id))continue;const at=floorSpot(R);if(!at)continue;
  const p=shardProp(id,{...R,cx:at.x,cy:at.y});room.props.push(p);cur.nests.push({id,R,prop:p,mobs:[]});}stats.planned+=cur.nests.length;}
function mobsFor(){const z=cur.z,eps=SM()?.episodes||[],ep=eps[room.samongR103.ep]||{};return{list:z?.mobs||ep.mobs||eps[1]?.mobs||[],name:z?.mobName||ep.mobName};}
function wake(n){n.prop.r511State='awake';stats.woke++;const{list,name}=mobsFor(),R=n.R,count=R.w*R.h>=150?3:2,spawnMob=SM()?.spawnMob;
 if(typeof spawnMob==='function'&&list.length)for(let k=0;k<count;k++){let at=null;for(let t=0;t<8&&!at;t++){const a=(k/count+t/8)*Math.PI*2+R.i,rr=2.2+(t%2)*.8,q={x:n.prop.x+Math.cos(a)*rr,y:n.prop.y+Math.sin(a)*rr};
   let free=false;try{free=!blocked(q.x,q.y,.4,room);}catch(_){}if(free&&Math.hypot(q.x-player.x,q.y-player.y)>=2)at=q;}
  if(!at)continue;let e=null;try{e=spawnMob(list[k%list.length],at,{name,hpScale:.8,tag:'n511',aggro:9});}catch(err){fail(err);}
  if(e){e.damage=(Number(e.damage)||8)*.75;e.r511Nest=n.id;n.mobs.push(e);}}
 if(!n.mobs.length)free(n);else try{if(typeof toast==='function')toast('기억 조각을 지키는 형상이 깨어났습니다',2.2);}catch(_){}}
function free(n){n.prop.r511State='free';n.prop.t0=T();stats.freed++;try{if(n.mobs.length&&typeof toast==='function')toast('기억 조각이 풀려났습니다 · 가까이 가면 주워집니다',2.4);}catch(_){}}
function pickUp(n){const pts=SHARD[tier()];player.points=(Number(player.points)||0)+pts;done.add(n.id);if(done.size>2000)done=new Set([...done].slice(-2000));stats.picked++;
 room.props=room.props.filter(q=>q!==n.prop);cur.nests=cur.nests.filter(q=>q!==n);
 try{window.__STORYWORLD_PIXELFX_R163__?.ready?.()&&window.__STORYWORLD_PIXELFX_R163__.play('collect-burst',n.prop.x,n.prop.y,{k:.55});}catch(_){}
 try{if(typeof sound==='function')sound('pickup');}catch(_){}
 try{if(typeof toast==='function')toast('기억 조각 · 패시브 포인트 +'+pts,2.8);}catch(_){}try{if(typeof updateHUD==='function')updateHUD();}catch(_){}try{if(typeof saveGame==='function')saveGame(false);}catch(_){}}
function step(){if(!prefs.on||!solo()||!here()){cur=null;return;}if(typeof loading!=='undefined'&&loading)return;
 if(!cur||cur.L!==room.exploration||cur.zid!==room.samongR103.zone)plan();
 if(!cur.ready){if(T()-cur.since>=SETTLE)settle();return;}// 탑(F)·단서 소품이 다 선 뒤에 고른다
 const px=player.x,py=player.y;
 for(const n of cur.nests.slice()){const p=n.prop;if(!room.props.includes(p)){cur.nests=cur.nests.filter(q=>q!==n);continue;}
  if(p.r511State==='sealed'){if(inRect(n.R,{x:px,y:py},-.6)||Math.hypot(p.x-px,p.y-py)<WAKE)wake(n);}
  else if(p.r511State==='awake'){if(!n.mobs.some(e=>living(e)&&(room.enemies||[]).includes(e)))free(n);}
  if(p.r511State==='free'&&Math.hypot(p.x-px,p.y-py)<PICK&&player.hp>0)pickUp(n);}}

// ---- 그리기: 붉은 결정(봉인=희미, 깨움=깜빡임, 풀림=맥박 빛) ------------------------------------
function draw(p){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;const q=project(p.x,p.y),h=typeof actorHeight==='function'?actorHeight():60,t=T(),st=p.r511State;
 const a=st==='free'?1:st==='awake'?.55+.25*Math.sin(t*14):.42,pulse=st==='free'?.85+.15*Math.sin(t*3.2+p.x):1,bob=st==='free'?Math.sin(t*2.6+p.y)*h*.04:0,s=h*(st==='free'?.42:.32)*pulse,y0=q.y-h*.34+bob,SP=window.__STORYWORLD_FX_SPRITES_R106__,spr=SP&&SP.on&&SP.on()?SP:null;
 ctx.save();try{ctx.globalAlpha=a;
  if(spr){try{spr.draw('glow',{a:[150,22,34],b:[255,130,140]},q.x,y0,s*(st==='free'?4.4:3),s*(st==='free'?4.4:3),{alpha:st==='free'?.8:.45});if(st==='free')spr.draw('ring',{a:[200,40,56],b:[255,210,214]},q.x,q.y,s*(2+.3*Math.sin(t*4)),s*.9,{alpha:.65});}catch(_){}}
  const g=!spr&&ctx.createRadialGradient?ctx.createRadialGradient(q.x,y0,0,q.x,y0,s*2.4):null;if(g){g.addColorStop(0,st==='free'?'rgba(255,120,130,.55)':'rgba(170,30,46,.35)');g.addColorStop(1,'rgba(60,4,12,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,y0,s*2.4,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='rgba(20,4,8,.45)';ctx.beginPath();ctx.ellipse(q.x,q.y,s*.7,s*.25,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=st==='free'?'#d8404e':'#7a1a26';ctx.strokeStyle=st==='free'?'#ffd0d4':'#c06070';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(q.x,y0-s);ctx.lineTo(q.x+s*.42,y0-s*.1);ctx.lineTo(q.x+s*.18,y0+s*.62);ctx.lineTo(q.x-s*.22,y0+s*.58);ctx.lineTo(q.x-s*.44,y0-s*.18);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,230,232,.7)';ctx.beginPath();ctx.moveTo(q.x-s*.06,y0-s*.72);ctx.lineTo(q.x+s*.14,y0-s*.12);ctx.lineTo(q.x-s*.12,y0-s*.2);ctx.closePath();ctx.fill();}finally{ctx.restore();}}

// ---- 설치 ------------------------------------------------------------------------------------
function clean(v){const s=new Set();if(v&&v.v===1&&Array.isArray(v.done))for(const x of v.done)if(typeof x==='string'&&x.length>0&&x.length<=120)s.add(x);return s;}
try{
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{step();}catch(e){fail(e);}return r;};}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p&&p.r511Shard){try{draw(p);}catch(e){fail(e);}return;}return base.apply(this,[p,...a]);};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){cur=null;return base.apply(this,a);};}
 if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const d=base.apply(this,a);try{if(d&&typeof d==='object')d.samongRoomsR511={v:1,done:[...done]};}catch(e){fail(e);}return d;};}
 if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const prior=done;done=clean(raw?.samongRoomsR511);cur=null;try{const r=await base.call(this,raw,...a);if(r===false)done=prior;return r;}catch(e){done=prior;throw e;}};}
 if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){done=new Set();cur=null;return base.apply(this,a);};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_SAMONG_ROOMS_R511__=Object.freeze({revision:REV,CAP,SHARD,zoneOk,pick,infoOf,defInfo,estimate,set,
 state:()=>({done:[...done],nests:cur?cur.nests.map(n=>({id:n.id,name:n.R.name,state:n.prop.r511State,x:n.prop.x,y:n.prop.y,mobs:n.mobs.length})):[]}),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,zone:cur?.zid||null,nests:cur?cur.nests.length:0,done:done.size})});
})();
