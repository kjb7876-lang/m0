// R373 — 같은 종류 몹 분대 + 분대장(우두머리).
// 사용자 2026-11-06: "맵마다 간이 구역을 만들어서 같은 종류의 몹끼리 뭉쳐있게 분대장급 살짝 크기랑 스펙60프로정도 업해서 한마리씩있도록하고 네임+우두머리 이렇게 명명"
//  · 구역이 만들어질 때(makeRoom) 분대를 정하고, 그 구역에 처음 들어선 틱에 한 번 모은다: 처음부터 나와 있는(active) 일반 몹을 종류(이름에서 끝 번호를 뗀 것)별로 모아,
//    6마리씩 한 분대로 나눈다(종류별 수가 6의 배수가 아니면 모자란 만큼 같은 종류를 복제해 모든 분대를 6마리로). 분대마다 간이 구역 중심(그 종류 몹이 이미 서 있던 자리 중 서로 먼 곳)을 잡고, 분대원을 그 둘레(반지름 약 2.4칸)
//    빈 바닥에 모은다. 집 자리(homeX·homeY)·무리 이름(explorationGroup)도 분대 것으로 바꿔 흩어지지 않게 한다. 1마리뿐인 종류는 그대로.
//  · 분대마다 분대장 한 마리(구역 중심에 가장 가까운 몹): 체력·최대 체력·공격력 ×1.6, 그림 1.15배, 이름 '<종류 이름> 우두머리',
//    머리 위 금빛 이름표. 그림을 고르는 표(R248·R306)는 이름 끝 번호를 떼어 찾으므로, 그릴 때만 원래 이름을 잠깐 돌려준다.
//  · 보스·중간보스·R81 챔피언·페르소나·시련·소환물·숨은 몹(나중에 나오는 무리)·협동 모드는 건드리지 않는다. 진행·보상·저장 구조는 그대로.
//  · 끄기: localStorage storyworld.r373.squads {"on":false} 뒤 새로고침.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_SQUADS_R373__)return;
const REV='R373-mob-squads-1',KEY='storyworld.r373.squads',SQUAD=6,MIN=2,RING=2.4,MUL=1.6,SIZE=1.15,SUFFIX=' 우두머리';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={rooms:0,squads:0,leaders:0,moved:0,kept:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const solo=()=>{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';};
const species=n=>String(n||'').replace(/^(중간보스|준보스)\s*·\s*/,'').replace(/\s*·\s*짙은 형상$/,'').replace(/\s*(후속 증원|증원|추격대)$/,'').replace(/\s+\d+$/,'').trim();
const field=e=>!!e&&e.hp>0&&e.spawnState==='active'&&!e.boss&&!e.midboss&&!e.wardChampionR81&&!e.persona&&!e.trial&&!e.cosmic&&!e.r61Summoned&&!e.r61Clone&&!e.r170Tower
 &&!e.combatProfile?.major&&!/중간보스|준보스/.test(String(e.name||''))&&Number.isFinite(e.x+e.y)&&!e.squadR373;
const free=(r,x,y,rad)=>{try{return typeof blocked!=='function'||!blocked(x,y,rad,r);}catch(_){return false;}};
// 서로 먼 중심 k개(첫 중심은 무리의 무게중심에 가장 가까운 몹 자리 — 같은 입력이면 늘 같은 결과)
// 다른 종류 분대 중심(taken)과는 SEP 칸 넘게 떨어진 자리를 먼저 고른다(두 분대가 한데 엉키지 않게).
const SEP=6;
function anchors(rows,k,taken=[]){const cx=rows.reduce((s,e)=>s+e.x,0)/rows.length,cy=rows.reduce((s,e)=>s+e.y,0)/rows.length;
 const far=e=>taken.length?Math.min(...taken.map(a=>Math.hypot(e.x-a.x,e.y-a.y))):Infinity;
 const ok=rows.filter(e=>far(e)>SEP),pool=ok.length?ok:rows.slice().sort((a,b)=>far(b)-far(a)).slice(0,1);
 const out=[pool.slice().sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy))[0]];
 while(out.length<k){let best=null,bd=-1;for(const e of rows){if(out.includes(e))continue;const d=Math.min(...out.map(a=>Math.hypot(e.x-a.x,e.y-a.y)),far(e));if(d>bd){bd=d;best=e;}}if(!best)break;out.push(best);}
 return out.map(e=>({x:e.x,y:e.y,group:e.explorationGroup,route:e.wardRouteR81}));}
function spot(r,c,i,used,rad){for(let ring=0;ring<10;ring++){const R=ring===0?.95:.95+ring*.32;if(R>RING+1.6)break;for(let s=0;s<12;s++){const a=i*1.37+s*Math.PI/6,x=c.x+Math.cos(a)*R,y=c.y+Math.sin(a)*R;
 if(free(r,x,y,rad)&&used.every(q=>Math.hypot(q.x-x,q.y-y)>.82))return{x,y};}}return null;}
// R248 그림 표는 이름(끝 번호 뗀 것)으로 찾는다 — 그리기 밖(tickFx 접촉 효과 등)에서도 찾게 원래 종류 열쇠(r248Key)를 고정해 둔다(Codex P2).
function keepKey(e,kind){try{if(e.r248Key)return;const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;if(!D?.byName)return;
 const dream=!!(e.samongR103||(typeof layer!=='undefined'&&layer==='DREAM'));const k=dream&&D.byName['사몽:'+kind]?'사몽:'+kind:(D.byName[kind]?kind:null);if(k)e.r248Key=k;}catch(err){fail(err);}}
function lead(e,kind){if(e.squadLeaderR373)return;keepKey(e,kind);e.squadLeaderR373=true;e.r373Name=e.name;e.name=kind+SUFFIX;
 for(const k of ['hp','maxHp','damage'])if(Number.isFinite(e[k])&&e[k]>0)e[k]*=MUL;stats.leaders++;}
function clone(src,j){const c={...src};c.id=String(src.id)+':r373c'+j;c.r373Clone=true;c.name=src.name;c.hp=c.maxHp;c.nav=[];c.attack=null;c.aim=null;c.state='idle';c.stuck=0;c.deadRecorded=false;c.deadAt=null;
 c.flash=0;c.tell=0;c.rangedWindup=0;c.storyPreparedCast150=null;c.personaPreparedCast150=null;c.personaPendingShots150={};
 for(const k of Object.keys(c))if(/^rc1\d\d|^r208|^r363Seen|Cache/.test(k))delete c[k];return c;}
// 1단계(makeRoom, 싸다): 종류별 분대·분대장·수치·이름만 정한다. 엔진이 모든 지역을 미리 만드는 자기 검사·저장 복원에서도 같은 결과가 나오게 결정적으로.
function organize(r){if(!prefs.on||!r||!Array.isArray(r.enemies)||r.squadsR373||!solo())return r;r.squadsR373=true;
 try{const by=new Map();for(const e of r.enemies)if(field(e)){const k=species(e.name);if(!k)continue;if(!by.has(k))by.set(k,[]);by.get(k).push(e);}
  let any=false;const taken=[];
  for(const [kind,rows0] of [...by.entries()].sort((a,b)=>a[0]<b[0]?-1:1)){const rows=rows0.slice().sort((a,b)=>String(a.id)<String(b.id)?-1:1);if(rows.length<MIN)continue;
   // 사용자 2026-11-06 "분대는 최대 6마리, 주로 6마리씩, 적 숫자 6에 맞춰": 종류별 수를 6의 배수로 올려 모든 분대가 6마리가 되게 — 모자란 만큼 같은 종류 몹을 복제(결정적 id).
   const want=Math.ceil(rows.length/SQUAD)*SQUAD;for(let j=0;rows.length<want;j++){const src=rows[j%rows0.length],c=clone(src,j);r.enemies.push(c);rows.push(c);stats.cloned=(stats.cloned||0)+1;}
   const k=Math.ceil(rows.length/SQUAD),cs=anchors(rows,k,taken),squads=cs.map(()=>[]);
   // 가까운 중심으로 나누되 한 분대는 SQUAD 를 넘지 않게
   for(const e of rows.slice().sort((a,b)=>Math.min(...cs.map(c=>Math.hypot(a.x-c.x,a.y-c.y)))-Math.min(...cs.map(c=>Math.hypot(b.x-c.x,b.y-c.y))))){
    const order=cs.map((c,i)=>[Math.hypot(e.x-c.x,e.y-c.y),i]).sort((a,b)=>a[0]-b[0]);const pick=order.find(([,i])=>squads[i].length<SQUAD)||order[0];squads[pick[1]].push(e);}
   squads.forEach((sq,si)=>{if(sq.length<MIN)return;const c=cs[si],gid=r.id+':r373:'+kind+':'+si;any=true;stats.squads++;taken.push(c);
    sq.sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y));
    sq.forEach((e,i)=>{e.squadR373=gid;e.r373Slot=i;e.r373Anchor={x:c.x,y:c.y};e.r373From={x:e.x,y:e.y};
     if(c.group)e.explorationGroup=c.group+':r373:'+si;if(c.route!=null)e.wardRouteR81=c.route;e.explorationLeash=Math.max(8,Math.min(Number(e.explorationLeash)||12,14));});
    lead(sq[0],kind);});}
  if(any){stats.rooms++;r.r373MovePending=true;
   // R86 챔피언 공격력·R78 챔피언 체력은 nativeId 별 '처음 나오는 일반 몹'을 기준으로 삼는다 → 우두머리를 목록 뒤로 보내 기준이 분대원(원래 수치)이 되게(Codex P2).
   const L=r.enemies.filter(e=>e.squadLeaderR373);if(L.length){const rest=r.enemies.filter(e=>!e.squadLeaderR373);r.enemies.length=0;r.enemies.push(...rest,...L);}}}catch(e){fail(e);}
 return r;}
// 2단계(그 지역이 실제 지금 방이 된 첫 틱, 한 지역만): 분대원을 간이 구역 둘레 빈 바닥으로 모은다.
//  저장에서 불러와 이미 다른 자리에 있는 몹(만들 때 자리와 다름)은 옮기지 않는다 → 불러오기·재입장에서 다시 흩거나 순간이동시키지 않음.
function gather(r){r.r373MovePending=false;const used=[];
 try{const rows=r.enemies.filter(e=>e.squadR373&&e.hp>0).sort((a,b)=>a.squadR373===b.squadR373?a.r373Slot-b.r373Slot:(a.squadR373<b.squadR373?-1:1));
  for(const e of rows){const f=e.r373From,c=e.r373Anchor;if(!f||!c)continue;if(Math.hypot(e.x-f.x,e.y-f.y)>.05||e.spawnState!=='active'){used.push({x:e.x,y:e.y});stats.kept++;continue;}
   const rad=Math.max(.3,(Number(e.combatProfile?.bodyBlock?.r)||Number(e.radius)||.3)+.06),i=e.r373Slot||0;
   const p=i===0&&free(r,c.x,c.y,rad)&&used.every(q=>Math.hypot(q.x-c.x,q.y-c.y)>.82)?{x:c.x,y:c.y}:spot(r,c,i,used,rad);
   if(p){e.x=e.homeX=p.x;e.y=e.homeY=p.y;e.nav=[];e.stuck=0;stats.moved++;}else stats.kept++;used.push({x:e.x,y:e.y});}
  stats.gathered=(stats.gathered||0)+1;}catch(e){fail(e);}}
if(typeof tick==='function'){const base=tick;tick=function(...a){try{const r=typeof room!=='undefined'?room:null;if(r&&r.r373MovePending&&prefs.on&&!(typeof loading!=='undefined'&&loading))gather(r);}catch(e){fail(e);}return base.apply(this,a);};}
if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(...a){return organize(base.apply(this,a));};}
// 그리기: 분대장은 1.15배, 그림 표가 찾을 수 있게 원래 이름으로 잠깐 바꿔 그린 뒤 머리 위 이름표.
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(!e||!e.squadLeaderR373||!prefs.on)return base.apply(this,arguments);
 const name=e.name,ds=e.defScale;e.name=e.r373Name||name;if(Number.isFinite(ds))e.defScale=ds*SIZE;let out;
 try{out=base.apply(this,arguments);}finally{e.name=name;if(Number.isFinite(ds))e.defScale=ds;}
 try{plate(e);}catch(err){fail(err);}return out;};}
function plate(e){if(e.hp<=0||e.deadRecorded||e.visible===false||e.disabled===true||typeof project!=='function'||typeof ctx!=='object'||!ctx||['hidden','inactive','disabled','despawned'].includes(e.spawnState))return;
 // 손전등 시야(R24) 밖이거나 벽 뒤면 그림처럼 이름표도 숨긴다(Codex P2).
 try{if(window.__STORYWORLD_SIGHT24__?.visibleEnemy?.(e)===false)return;if(typeof renderable3==='function'&&!renderable3(e))return;}catch(_){return;}
 const q=project(e.x,e.y),z=typeof zoom==='number'?zoom:1,body=(typeof actorHeight==='function'?actorHeight():66)*(Number(e.combatProfile?.spriteRect?.height)||1)*(Number(e.defScale)||1)*SIZE;
 if(typeof W==='number'&&typeof H==='number'&&(q.x<-80||q.x>W+80||q.y<-40||q.y-body>H+40))return;
 const y=q.y-body-(Number(e.visualLiftPx)||0)-Math.max(10,14*z);
 ctx.save();ctx.font='600 '+Math.round(Math.max(10,Math.min(14,11*z)))+'px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillStyle='#e9c46a';ctx.fillText(e.name,q.x,y);ctx.restore();}
window.__STORYWORLD_MOB_SQUADS_R373__=Object.freeze({revision:REV,KEY,SQUAD,MIN,MUL,SIZE,SUFFIX,species,organize,
 set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};},
 inspect:()=>{let rows=[];try{rows=(typeof room!=='undefined'&&room?.enemies||[]).filter(e=>e.squadR373).map(e=>({id:e.id,squad:e.squadR373,leader:!!e.squadLeaderR373,name:e.name,x:Math.round(e.x*10)/10,y:Math.round(e.y*10)/10,hp:Math.round(e.hp),maxHp:Math.round(e.maxHp),damage:Math.round((e.damage||0)*100)/100}));}catch(_){}
  return{revision:REV,prefs:{...prefs},stats:{...stats},lastError,room:rows};}});
})();
