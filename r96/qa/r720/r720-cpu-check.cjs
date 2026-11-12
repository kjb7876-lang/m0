'use strict';
// R720 CPU 검사 — 무한 생존 '영웅 배치'(hero-defense-r720.js).
//  사용자 2026-11-11 08:43Z "생존모드에서 i 키누르면 영웅배치 창이 열리고 영웅을 어떠한 재화로 사면 영웅을 정화코어 사정거리 내에 배치하고 그영웅은 반자동모드로
//  사거리내에서 공격하는데 그영웅의 사거리와 이동반경등을 늘릴 수 있고 그 영웅도 키우면서 할 수 있는 시스템 … 지금시스템이랑 충돌안하게 뒤에 서사영웅일수록 비싸도록
//  그리고 영웅변경시 그영웅으로 변경하면 기존영웅이 그영웅자리에 들어가는 거임 … 디펜스요소도 조금 섞는느낌으로"
//  ① 빌드 연결 ② 순수 규칙(가격·구매·배치·강화·교대·보상·움직임/표적) ③ 가짜 엔진 위 동작(I 키·처치 보상·공격·교대·새 판 초기화·다른 모드 불간섭).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x));}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='hero-defense-r720.js',src=rd(path.join(R,'client-source',NAME)),html=rd(path.join(R,'runtime-text/index.html'));
const near=(a,b,e=1e-9)=>Math.abs(a-b)<=e;

// ── ① 빌드 연결 ──
ok(src.length>0,'client-source/'+NAME+' 있음');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(html.split('"./'+NAME+'"').length===2,'index.html 스크립트 태그 한 번');
ok(html.indexOf(NAME)>0&&html.indexOf(NAME)<html.indexOf('"./combat-r118.js"'),'combat-r118 앞');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r720/r720-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(R,'runtime-manifest.json')).includes(NAME)&&rd(path.join(R,'runtime-inputs.json')).includes(NAME),'runtime-manifest·inputs 등록');
// 충돌 방지: 엔진 반자동·길잡이 값, 저장, 생존 모드 파일을 건드리지 않는다
{const s=src.replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
 ok(!/(^|[^.\w])(auto|guide)\s*=(?!=)/.test(s),'엔진 auto·guide 에 값을 넣지 않음');
 ok(!/saveGame\s*\(/.test(s)&&!/localStorage\.setItem/.test(s),'저장하지 않음(생존 모드는 저장 없음)');
 ok(!/__STORYWORLD_SURVIVAL_R600__\s*=/.test(s),'생존 모드 공개 객체를 바꿔 끼우지 않음');}

// ── 가짜 엔진 ──
const HEROES={hwando:{name:'환도',type:'blade',power:36,interval:.48,range:3.15},seoha:{name:'윤서하',type:'precision',power:30,interval:.51,range:8.1},
 neon:{name:'네온',type:'chain',melee:true,power:24,interval:.42,range:3.15},michaela:{name:'미카엘라',type:'light',power:27,interval:.49,range:7},
 lauren:{name:'라우렌',type:'spell',melee:true,power:27,interval:.54,range:3.15},hunter:{name:'헌터',type:'burst',power:23,interval:.39,range:8.3},
 slayer:{name:'슬레이어',type:'heavy',power:48,interval:.69,range:3.3},gunner:{name:'기억사수',type:'memory',power:30,interval:.50,range:8.2}};
function mk(o={}){
 const listeners={},els={};const el=id=>({id,style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},children:[],appendChild(c){this.children.push(c);if(c.id)els[c.id]=c;return c;},insertBefore(c){this.children.push(c);if(c.id)els[c.id]=c;return c;},querySelector(){return null;},querySelectorAll(){return[];},setAttribute(){},getAttribute(){return null;},remove(){},textContent:'',innerHTML:'',isConnected:true});
 const sv={hereV:o.here!==false,starts:1,phase:'pre',i:0,range:5.5};
 const sb={console,Math,Number,Object,Array,Set,Map,JSON,String,Date,Promise,setTimeout,clearTimeout,performance:{now:()=>0},
  localStorage:{getItem:()=>null,setItem(){throw Error('no storage writes');}},
  document:{getElementById:id=>els[id]||null,head:el('head'),body:el('body'),createElement:()=>el(''),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},
  addEventListener:(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);},
  HEROES,VFX:{slash:'s',bolt:'b',burst:'u',heal:'h'},TILE:64,zoom:1,W:960,H:540,
  started:true,modal:false,loading:false,storyScene:null,time:10,layer:'STORY',zone:'dist00',settings:{},
  player:{hero:o.hero||'hwando',x:50,y:52,hp:100,level:1,upgrades:{},combo:0,ego:0,samong:0,shield:0,direction:'front',attackCD:0,attackAnim:0,skillAnim:0,specialCD:0,progressionR62:{version:1,ranks:{}},poseStarted5:{}},
  heroArt:Object.fromEntries(Object.keys(HEROES).map(id=>[id,{idle:{front:id+'/i',left:id+'/il',right:id+'/ir',back:id+'/ib'},attack:{front:id+'/a',left:id+'/al',right:id+'/ar',back:id+'/ab'}}])),
  room:{id:'dist00',engaged:true,props:[{id:'r600:core',r600CoreProp:true,x:50,y:50}],enemies:[],survivalR600:{centre:{x:50,y:50},arena:{x0:1,y0:1,x1:99,y1:99}}},
  calls:{attack:[],late:[],heroDraw:[],open:[],close:0,hit:[],kill:[],fx:0,toast:[],ensure:[],drawBase:0,sprite:[],tickBase:0,icons:0},
 };
 sb.attackPower=()=>2*HEROES[sb.player.hero].power;
 sb.facing=(x,y)=>{const sx=x-y,sy=(x+y)*.5;return Math.abs(sx)>Math.abs(sy)*1.35?(sx>0?'right':'left'):sy>0?'front':'back';};
 sb.project=(x,y)=>({x:(x-y)*64+480,y:(x+y)*32});sb.actorHeight=()=>66;sb.shadow=()=>{};sb.readyImage=p=>({image:{naturalWidth:10,naturalHeight:20},path:p});
 sb.sprite=(p,x,y,h,opt)=>{sb.calls.sprite.push(p);return true;};sb.texture=()=>true;sb.urlFor=p=>p;
 sb.heroPaths=id=>[id+'/i',id+'/a'];sb.ensureImages=async paths=>{sb.calls.ensure.push(paths);return paths.length;};
 sb.fx=()=>{sb.calls.fx++;};sb.toast=t=>{sb.calls.toast.push(String(t));};sb.refreshIcons=()=>{sb.calls.icons++;};sb.clearControls=()=>{};
 sb.openPanel=h=>{sb.modal=true;sb.calls.open.push(String(h));};sb.closePanel=()=>{sb.modal=false;sb.calls.close++;};
 sb.killEnemy=function(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;e.deadAt=sb.time;sb.calls.kill.push(e.id);};
 sb.hitEnemy=function(e,v){if(!e||e.hp<=0||!(v>0)||(e.boss&&!sb.room.engaged))return false;sb.calls.hit.push({id:e.id,v});e.hp-=Math.min(e.hp,v);if(e.hp<=0)sb.killEnemy(e);return true;};
 // 엔진 흉내: 기본 공격·영웅 그리기·지연 작업·투사체는 '지금 player 자리에 있는 몸'을 읽는다(배치 영웅은 그 몸을 끼워서 부른다)
 sb.structuredClone=v=>JSON.parse(JSON.stringify(v));sb.delayed=[];sb.shots=[];sb.throwInAttack=false;
 sb.target='mine';sb.command='mine';sb.route=['r'];/* 엔진의 겨눔·이동 명령(조종 영웅 것) */
 sb.basicAttack=function(){const p=sb.player,h=HEROES[p.hero];if(sb.modal||sb.loading||!(p.hp>0)||p.attackCD>0)return;if(p.r720Ally){sb.target='foe';sb.command='foe';sb.route=[{x:1,y:1}];}/* 엔진 공격이 겨눔·추격 명령을 건다 */if(sb.throwInAttack)throw Error('boom');
  let e=null,d=h.range;for(const v of sb.room.enemies){if(!(v.hp>0)||v.deadRecorded)continue;const q=Math.hypot(v.x-p.x,v.y-p.y);if(q<=d){d=q;e=v;}}if(!e)return;
  p.combo++;p.attackCD=h.interval;p.attackAnim=.24;p.direction=sb.facing(e.x-p.x,e.y-p.y);sb.calls.attack.push({hero:p.hero,ally:p.r720Ally===true,x:p.x,y:p.y});sb.fx();sb.hitEnemy(e,sb.attackPower());
  if(p.combo%3===0)sb.delay(.1,()=>{sb.calls.late.push({hero:sb.player.hero,ally:sb.player.r720Ally===true});sb.hitEnemy(e,sb.attackPower()*.5);});};
 sb.delay=(sec,fn)=>{sb.delayed.push({at:sb.time+sec,fn});};
 sb.makeShot=(x,y,a,spd,dmg)=>{sb.shots.push({x,y,dmg});return {};};
 sb.drawHero=()=>{for(const q of sb.drawHeroReads)sb.readyImage(sb.player.hero+q);sb.calls.sprite.push(sb.heroArt[sb.player.hero].idle.front);sb.calls.heroDraw.push({hero:sb.player.hero,x:sb.player.x,y:sb.player.y});};
 sb.tick=function(dt){sb.calls.tickBase++;if(sb.modal||sb.loading)return;sb.time+=dt;const due=sb.delayed.filter(d=>d.at<=sb.time);sb.delayed=sb.delayed.filter(d=>d.at>sb.time);for(const d of due)d.fn();};
 sb.drawProp=function(p){sb.calls.drawBase++;};
 // 엔진 흉내: 그림 기억과 지역 이동 때 비우기(조종 영웅 그림·모든 영웅 대기 정면만 남김)
 sb.imageCache=new Map();sb.cleanPath=p=>p;const rdy=p=>{const r=sb.imageCache.get(p);return r&&r.ready?r:null;};
 sb.readyImage=p=>sb.imageCache.size?rdy(p):({image:{naturalWidth:10,naturalHeight:20},path:p});
 sb.releaseImageMemory=()=>{const keep=new Set([...sb.heroPaths(sb.player.hero),...Object.keys(HEROES).map(id=>sb.heroArt[id].idle.front)]);for(const [k,r] of sb.imageCache)if(!keep.has(k)&&r.ready)sb.imageCache.delete(k);};
 sb.drawHeroReads=[];const dh0=null;
 sb.ctx={save(){},restore(){},beginPath(){},ellipse(){},stroke(){},fill(){},fillRect(){},setLineDash(){},moveTo(){},lineTo(){},arc(){},drawImage(){},globalAlpha:1};
 sb.window=sb;sb.globalThis=sb;
 sb.__STORYWORLD_SURVIVAL_R600__=Object.freeze({here:()=>sv.hereV,active:()=>sv.hereV,
  state:()=>sv.hereV?{ready:true,phase:sv.phase,i:sv.i,loop:0,over:false,core:{hp:900,stats:{range:sv.range,max:900}}}:null,
  inspect:()=>({stats:{starts:sv.starts}})});
 vm.createContext(sb);if(src)vm.runInContext(src,sb,{filename:NAME});
 const key=(k,extra={})=>{const ev={key:k,code:'Key'+k.toUpperCase(),repeat:false,target:{tagName:'CANVAS'},preventDefault(){ev.prevented=true;},stopPropagation(){},stopImmediatePropagation(){},...extra};for(const f of listeners.keydown||[])f(ev);return ev;};
 return {sb,sv,key,api:sb.__STORYWORLD_HERO_DEFENSE_R720__,run:(secs,dt=.05)=>{for(let t=0;t<secs-1e-9;t+=dt)sb.tick(dt);}};
}

const base=mk();const A=base.api,P=A&&A.pure;
ok(!!A&&!!P,'모듈이 엔진 없이도 올라가고 공개 객체·순수 규칙을 낸다');
if(!P){console.log('\n'+(n-bad)+'/'+n+' — 모듈이 없어 나머지 검사를 건너뜀');process.exit(1);}

// ── ② 순수 규칙 ──
// 가격(사용자 2026-11-12 06:02Z): 미카엘라 가장 비쌈 > 네온·윤서하·라우렌 좀 비쌈 > 기억사수·환도 중간 > 슬레이어·헌터 쌈. 합계는 예전(1105)과 비슷하게.
{const ids=P.order(HEROES),pr=Object.fromEntries(ids.map(id=>[id,P.price(id,HEROES)])),v=Object.values(pr);
 ok(ids.join()==='hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner','영웅 순서 = 엔진 영웅 목록 순서',ids);
 ok(pr.michaela===Math.max(...v)&&v.filter(x=>x===pr.michaela).length===1,'미카엘라가 혼자 가장 비싸다',pr);
 const hi=Math.min(pr.neon,pr.seoha,pr.lauren),mid=[pr.gunner,pr.hwando],lo=Math.max(pr.slayer,pr.hunter);
 ok(hi>Math.max(...mid)&&pr.michaela>Math.max(pr.neon,pr.seoha,pr.lauren),'네온·윤서하·라우렌은 중간 가격보다 비싸고 미카엘라보다 싸다',pr);
 ok(Math.min(...mid)>lo,'기억사수·환도(중간)는 슬레이어·헌터(싼 쪽)보다 비싸다',pr);
 const sum=v.reduce((a,b)=>a+b,0);ok(Math.abs(sum-1105)<=60&&v.every(x=>x>=40&&x%5===0),'합계는 예전과 비슷(1105±60), 5 단위',{sum,pr});
 ok(P.price('nobody',HEROES)===Infinity,'모르는 영웅은 살 수 없음');
 const by=[...ids].sort((a,b)=>pr[a]-pr[b]),tr=by.map(id=>P.tier(id,HEROES));ok(tr[0]===1&&tr.every((x,i)=>i===0||x>tr[i-1]),'비싼 영웅일수록 기본 위력 배수도 높다',tr);}
// 구매
{const st=P.fresh('hwando');ok(st.crystals===0&&st.owned.hwando===true&&st.slots.length===0&&st.main==='hwando','새 판: 결정 0·조종 영웅 보유·빈 자리');
 let r=P.doBuy(st,'seoha',HEROES);ok(!r.ok&&r.why==='poor'&&!st.owned.seoha&&st.crystals===0,'결정이 모자라면 못 산다',r);
 st.crystals=149;r=P.doBuy(st,'seoha',HEROES);ok(!r.ok&&st.crystals===149,'1개 모자라도(149/150) 못 산다');
 st.crystals=150;r=P.doBuy(st,'seoha',HEROES);ok(r.ok&&st.owned.seoha===true&&st.crystals===0,'딱 맞는 값(150)이면 사고 0 이 남는다',r);
 st.crystals=999;r=P.doBuy(st,'seoha',HEROES);ok(!r.ok&&r.why==='owned'&&st.crystals===999,'이미 가진 영웅은 다시 사지 않는다');
 r=P.doBuy(st,'hwando',HEROES);ok(!r.ok&&r.why==='owned'&&st.crystals===999,'조종 중인 영웅은 이미 보유(사지 않음)');
 r=P.doBuy(st,'nobody',HEROES);ok(!r.ok&&st.crystals===999,'모르는 영웅은 거절');
 st.crystals=NaN;r=P.doBuy(st,'neon',HEROES);ok(!r.ok&&!st.owned.neon,'결정 값이 깨져 있으면 거절');}
// 배치: 코어 사거리 안에서만, 최대 4자리, 겹치지 않게
{const env={centre:{x:50,y:50},range:5.5},st=P.fresh('hwando');for(const id of['seoha','neon','michaela','lauren','hunter'])st.owned[id]=true;
 let r=P.doPlace(st,'seoha',{x:50,y:55.6},env);ok(!r.ok&&r.why==='far'&&st.slots.length===0,'코어 사거리 밖(5.6칸)은 배치 거절',r);
 r=P.doPlace(st,'seoha',{x:50,y:55.5},env);ok(r.ok&&st.slots.length===1&&st.slots[0].hero==='seoha'&&near(st.slots[0].ox,0)&&near(st.slots[0].oy,5.5),'사거리 경계(정확히 5.5칸)는 배치 가능, 코어 기준 위치로 기억',r);
 ok(st.slots[0].lv===1&&st.slots[0].rangeLv===0&&st.slots[0].radiusLv===0,'새 자리는 1레벨·강화 0');
 r=P.doPlace(st,'seoha',{x:52,y:50},env);ok(!r.ok&&r.why==='placed'&&st.slots.length===1,'같은 영웅을 두 번 배치하지 않는다');
 r=P.doPlace(st,'hwando',{x:52,y:50},env);ok(!r.ok&&r.why==='main','조종 중인 영웅은 배치하지 않는다');
 r=P.doPlace(st,'gunner',{x:52,y:50},env);ok(!r.ok&&r.why==='unowned','안 산 영웅은 배치하지 않는다');
 r=P.doPlace(st,'neon',{x:50.2,y:50.2},env);ok(!r.ok&&r.why==='core','코어 바로 위에는 놓지 않는다');
 r=P.doPlace(st,'neon',{x:50.3,y:55.2},env);ok(!r.ok&&r.why==='crowded','다른 자리와 겹치면 거절');
 ok(P.doPlace(st,'neon',{x:53,y:50},env).ok&&P.doPlace(st,'michaela',{x:47,y:50},env).ok&&P.doPlace(st,'lauren',{x:50,y:46},env).ok&&st.slots.length===4,'네 자리까지 배치');
 r=P.doPlace(st,'hunter',{x:52,y:52},env);ok(!r.ok&&r.why==='full'&&st.slots.length===4,'다섯 번째는 거절(최대 4)');
 r=P.doPlace(st,'hunter',{x:NaN,y:1},env);ok(!r.ok,'깨진 좌표 거절');
 // 자리 옮기기(무료)
 const c0=st.crystals;r=P.doMove(st,1,{x:50,y:53},env);ok(r.ok&&near(st.slots[1].ox,0)&&near(st.slots[1].oy,3)&&st.crystals===c0,'자리 옮기기는 무료, 코어 기준 위치가 바뀐다');
 r=P.doMove(st,1,{x:50,y:60},env);ok(!r.ok&&near(st.slots[1].oy,3),'옮길 곳이 사거리 밖이면 그대로');
 r=P.doMove(st,1,{x:50,y:55.4},env);ok(!r.ok&&r.why==='crowded','옮길 곳이 다른 자리와 겹치면 그대로');
 r=P.doMove(st,1,{x:50.1,y:53.1},env);ok(r.ok,'제자리 근처로 조금 옮기는 것은 자기 자신과 겹침으로 보지 않는다');
 r=P.doMove(st,9,{x:51,y:51},env);ok(!r.ok,'없는 자리 번호 거절');
 // 코어 사거리가 넓어지면(코어 강화) 놓을 수 있는 땅도 넓어진다
 const st2=P.fresh('hwando');st2.owned.seoha=true;ok(!P.doPlace(st2,'seoha',{x:50,y:56},env).ok&&P.doPlace(st2,'seoha',{x:50,y:56},{centre:env.centre,range:6.5}).ok,'코어 사거리 강화 → 배치 가능 땅이 넓어진다');}
// 강화
{const st=P.fresh('hwando');st.owned.seoha=true;P.doPlace(st,'seoha',{x:52,y:50},{centre:{x:50,y:50},range:5.5});
 for(const k of['range','radius','level']){const cs=[];for(let l=(k==='level'?1:0);l<P.MAX[k];l++)cs.push(P.cost(k,l));ok(cs.every((v,i)=>v>0&&Number.isInteger(v)&&(i===0||v>cs[i-1])),k+' 강화 값은 단계마다 오른다',cs);ok(P.cost(k,P.MAX[k])===Infinity,k+' 최대 단계 뒤 값은 없음');}
 let r=P.doUpgrade(st,0,'range');ok(!r.ok&&r.why==='poor'&&st.slots[0].rangeLv===0,'결정이 없으면 강화 거절');
 st.crystals=P.cost('range',0);r=P.doUpgrade(st,0,'range');ok(r.ok&&st.slots[0].rangeLv===1&&st.crystals===0,'사거리 강화: 값만큼 빠지고 1단계');
 st.crystals=1e6;for(let i=0;i<20;i++)P.doUpgrade(st,0,'range');for(let i=0;i<20;i++)P.doUpgrade(st,0,'radius');for(let i=0;i<20;i++)P.doUpgrade(st,0,'level');
 ok(st.slots[0].rangeLv===P.MAX.range&&st.slots[0].radiusLv===P.MAX.radius&&st.slots[0].lv===P.MAX.level,'최대 단계에서 멈춘다(사거리 5·반경 5·레벨 10)',st.slots[0]);
 const c=st.crystals;r=P.doUpgrade(st,0,'level');ok(!r.ok&&r.why==='max'&&st.crystals===c,'최대 단계에서는 결정이 빠지지 않는다');
 ok(!P.doUpgrade(st,0,'bogus').ok&&!P.doUpgrade(st,3,'level').ok,'모르는 강화·없는 자리 거절');
 ok(P.MAX.slots===4&&P.MAX.range===5&&P.MAX.radius===5&&P.MAX.level===10,'상한: 자리 4·사거리 5·반경 5·레벨 10');}
// 자리 능력치
{const s0={hero:'seoha',lv:1,rangeLv:0,radiusLv:0},a=P.slotStats(s0,HEROES);
 ok(near(a.range,8.1)&&a.radius>0&&a.targets===undefined&&a.pace>1&&near(a.interval,HEROES.seoha.interval*a.pace),'1레벨: 사거리=영웅 사거리, 공격 간격은 조종 영웅보다 느리다',a);
 const b=P.slotStats({...s0,rangeLv:5,radiusLv:5,lv:10},HEROES);
 ok(near(b.range,8.1+3)&&near(b.radius,a.radius+4),'사거리 +0.6칸×5, 이동 반경 +0.8칸×5',b);
 ok(b.dmgMul>a.dmgMul*2&&b.interval<a.interval&&b.pace<a.pace&&b.pace>=1,'10레벨: 위력 2배 이상·더 빠름(그래도 조종 영웅보다 빠르지는 않다)',b);
 // (사용자 2026-11-12: 스킬 구조는 원래 영웅 그대로 → '한 번에 N마리' 자체 규칙은 없앴다. 다중 타격은 영웅 본래 스킬이 한다)
 // 디펜스 균형: 1레벨 배치 영웅 화력은 조종 영웅 기본 공격의 1/4~1/2, 10레벨 단일 표적은 0.8~1.4배
 const dps=s=>{const x=P.slotStats(s,HEROES);return x.dmgMul/x.interval;},me=1/HEROES.seoha.interval;
 ok(dps(s0)/me>=.25&&dps(s0)/me<=.5,'1레벨 화력 ≈ 조종 영웅의 1/4~1/2',dps(s0)/me);ok(dps({...s0,lv:10})/me>=.8&&dps({...s0,lv:10})/me<=1.4,'10레벨 단일 표적 화력 ≈ 0.8~1.4배',dps({...s0,lv:10})/me);
 ok(P.slotStats({hero:'gunner',lv:1,rangeLv:0,radiusLv:0},HEROES).dmgMul>P.slotStats({hero:'hwando',lv:1,rangeLv:0,radiusLv:0},HEROES).dmgMul,'비싼 영웅의 위력 배수가 더 높다');
 ok(P.slotStats({hero:'nobody',lv:1,rangeLv:0,radiusLv:0},HEROES)===null,'모르는 영웅은 능력치 없음');}
// 교대: 배치된 영웅으로 바꾸면 조종하던 영웅이 그 자리에 들어간다(자리 강화는 그대로)
{const st=P.fresh('hwando');st.owned.seoha=st.owned.neon=true;const env={centre:{x:50,y:50},range:5.5};P.doPlace(st,'seoha',{x:52,y:50},env);P.doPlace(st,'neon',{x:48,y:50},env);
 st.slots[0].lv=4;st.slots[0].rangeLv=2;st.slots[0].radiusLv=3;const before=JSON.stringify({...st.slots[0],hero:0});
 let r=P.onHeroChange(st,'seoha');ok(r.swapped&&r.slot===0&&st.main==='seoha'&&st.slots[0].hero==='hwando','윤서하로 교대 → 환도가 윤서하 자리에',st.slots[0]);
 ok(JSON.stringify({...st.slots[0],hero:0})===before,'자리의 위치·레벨·강화는 그대로 이어받는다');
 ok(st.slots[1].hero==='neon'&&st.slots.length===2,'다른 자리는 그대로');
 r=P.onHeroChange(st,'seoha');ok(!r.swapped&&st.slots[0].hero==='hwando','같은 영웅이면 아무 일 없음');
 r=P.onHeroChange(st,'michaela');ok(!r.swapped&&st.main==='michaela'&&st.owned.michaela===true&&st.slots[0].hero==='hwando'&&st.slots[1].hero==='neon','배치 안 된 영웅으로 바꾸면 자리는 그대로, 새 조종 영웅은 보유로 기록');
 ok(st.owned.seoha===true,'교대로 물러난 영웅도 계속 보유');
 r=P.onHeroChange(st,'hwando');ok(r.swapped&&st.slots[0].hero==='michaela'&&st.main==='hwando','다시 환도로 → 미카엘라가 그 자리');
 ok(new Set([st.main,...st.slots.map(s=>s.hero)]).size===1+st.slots.length,'조종 영웅과 배치 영웅은 언제나 서로 다르다');
 ok(!P.onHeroChange(st,'nobody').swapped&&st.main==='hwando','모르는 영웅 이름은 무시');}
// 보상
{ok(P.reward({})===1&&P.reward({r600Elite:true})===3&&P.reward({r600Boss:true,boss:true})===25&&P.reward({r600Boss:true,boss:false})===12,'처치 보상: 1·짙은 형상 3·중간보스 12·보스 25');
 ok(P.reward(null)===0,'없는 적은 0');ok(P.clearBonus(0)>0&&P.clearBonus(10)>P.clearBonus(0)&&P.clearBonus(1e6)<=80,'지역 정화 보너스: 뒤 지역일수록 많고 상한 있음');}
// 자리 위치: 코어 기준 위치 → 지금 지역 좌표(지도 안으로 고정)
{const a=P.anchorOf({ox:3,oy:-2},{x:50,y:50},{x0:1,y0:1,x1:99,y1:99});ok(near(a.x,53)&&near(a.y,48),'자리 = 코어 + 기억한 위치');
 const b=P.anchorOf({ox:5,oy:5},{x:6,y:6},{x0:1,y0:1,x1:9,y1:9});ok(b.x<=8.2+1e-9&&b.y<=8.2+1e-9&&b.x>=1.8&&b.y>=1.8,'작은 지역에서는 지도 안쪽으로 고정',b);}
// 움직임·표적(반자동): 이동 반경을 벗어나지 않고, 사거리 안 적만 때린다
{const st={range:3,radius:2,interval:.7,dmgMul:.5,targets:1,melee:true},anchor={x:50,y:50};
 const a={x:50,y:50,cd:0},far={id:'f',x:60,y:50,hp:10};let r=P.think(a,[far],.1,st,anchor);ok(r.hits.length===0&&near(a.x,50)&&near(a.y,50),'반경+사거리 밖 적은 쫓지 않는다',a);
 const e1={id:'e1',x:54,y:50,hp:10};for(let i=0;i<40;i++)r=P.think(a,[e1],.05,st,anchor);ok(Math.hypot(a.x-50,a.y-50)<=2+1e-6&&a.x>51,'표적 쪽으로 다가가되 이동 반경(2칸) 안에 머문다',a);
 a.cd=0;r=P.think(a,[e1],.05,st,anchor);ok(r.hits.length===1&&r.hits[0]===e1&&near(a.cd,.7),'사거리(3칸) 안에 들어오면 공격하고 간격만큼 쉰다',{cd:a.cd,n:r.hits.length});
 r=P.think(a,[e1],.05,st,anchor);ok(r.hits.length===0,'쉬는 동안은 다시 치지 않는다');
 for(let i=0;i<80;i++)P.think(a,[],.05,st,anchor);ok(Math.hypot(a.x-50,a.y-50)<.05,'적이 없으면 자기 자리로 돌아온다',a);
 const dead={id:'d',x:51,y:50,hp:0},gone={id:'g',x:51,y:50,hp:5,deadRecorded:true},sleeping={id:'b',x:51,y:50,hp:5,boss:true};a.cd=0;
 r=P.think(a,[dead,gone,null],.05,st,anchor);ok(r.hits.length===0,'죽은 적·없는 적은 치지 않는다');
 r=P.think(a,[sleeping],.05,st,anchor,{engaged:false});ok(r.hits.length===0,'아직 깨어나지 않은 보스는 치지 않는다');
 r=P.think(a,[sleeping],.05,st,anchor,{engaged:true});ok(r.hits.length===1,'깨어난 보스는 친다');
 // 원거리: 사거리 안이면 자리를 지킨다
 const rs={range:8,radius:2,interval:.7,dmgMul:.5,targets:2,melee:false},b={x:50,y:50,cd:0},t1={id:'t1',x:56,y:50,hp:9},t2={id:'t2',x:50,y:57,hp:9},t3={id:'t3',x:44,y:50,hp:9};
 r=P.think(b,[t1,t2,t3],.05,rs,anchor);ok(r.hits.length===2&&r.hits[0]===t1&&r.hits.includes(t3)&&near(b.x,50)&&near(b.y,50),'원거리는 사거리 안 적이면 제자리에서, 가까운 순서로 2마리',r.hits.map(e=>e.id));
 // 무작위 600걸음: 어떤 경우에도 이동 반경 밖으로 나가지 않는다
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;let worst=0;const c={x:50,y:50,cd:0};
 for(let i=0;i<600;i++){const es=[0,1,2].map(k=>({id:'r'+k,x:50+(rnd()-.5)*16,y:50+(rnd()-.5)*16,hp:5}));P.think(c,es,.02+rnd()*.3,st,anchor);worst=Math.max(worst,Math.hypot(c.x-50,c.y-50));}
 ok(worst<=2+1e-6,'무작위 600걸음에서도 이동 반경(2칸)을 넘지 않는다',worst);
 const z={x:NaN,y:50,cd:0};P.think(z,[e1],.05,st,anchor);ok(Number.isFinite(z.x)&&Number.isFinite(z.y),'위치가 깨져도 자리로 되돌린다',z);
 r=P.think({x:50,y:50,cd:0},[e1],.05,null,anchor);ok(r.hits.length===0,'능력치가 없으면 아무것도 하지 않는다');}

// ── ③ 가짜 엔진 위 동작 ──
// I 키: 생존 모드에서만 창이 열리고 다시 누르면 닫힌다
{const m=mk();let ev=m.key('i');ok(m.sb.calls.open.length===1&&/영웅 배치/.test(m.sb.calls.open[0])&&ev.prevented,'생존 모드에서 I → 영웅 배치 창');
 ok(/정화 결정/.test(m.sb.calls.open[0])&&Object.values(HEROES).every(h=>m.sb.calls.open[0].includes(h.name)),'창에 재화와 영웅 여덟이 보인다');
 ok(/영입 150</.test(m.sb.calls.open[0])&&/영입 280</.test(m.sb.calls.open[0])&&!/영입 95</.test(m.sb.calls.open[0])&&/조종 중/.test(m.sb.calls.open[0]),'창에 가격이 보인다(조종 중인 환도는 값 대신 조종 중)');
 m.key('i');ok(m.sb.calls.close===1&&m.sb.modal===false,'열린 채 I → 닫힘');
 m.key('I');ok(m.sb.calls.open.length===2,'대문자 I(Caps Lock)도 열린다');m.key('i');
 m.key('i',{repeat:true});m.key('i',{ctrlKey:true});m.key('i',{target:{tagName:'INPUT'}});ok(m.sb.calls.open.length===2,'키 반복·Ctrl+I·입력칸 안에서는 열지 않는다');
 m.sb.modal=true;m.key('i');ok(m.sb.calls.open.length===2&&m.sb.calls.close===2,'다른 창(강화 카드 등)이 열려 있으면 그 창을 닫지도, 덮지도 않는다');m.sb.modal=false;
 m.sb.loading=true;m.key('i');ok(m.sb.calls.open.length===2,'불러오는 중에는 열지 않는다');m.sb.loading=false;
 m.sb.storyScene={};m.key('i');ok(m.sb.calls.open.length===2,'서사 장면 중에는 열지 않는다');m.sb.storyScene=null;
 m.sb.player.hp=0;m.key('i');ok(m.sb.calls.open.length===2,'쓰러진 뒤에는 열지 않는다');}
{const m=mk({here:false});const ev=m.key('i');ok(m.sb.calls.open.length===0&&!ev.prevented,'스토리 모드(생존 아님)에서는 I 가 아무 일도 하지 않는다');
 m.sb.room.enemies.push({id:'x',x:51,y:50,hp:5});m.sb.killEnemy(m.sb.room.enemies[0]);m.run(1);
 ok(m.api.state().crystals===0&&m.sb.room.props.length===1&&m.sb.calls.hit.length===0,'생존 밖에서는 보상·소품·공격이 생기지 않는다');
 ok(m.api.buy('seoha').ok===false&&m.api.qaGive(100)===false,'생존 밖에서는 구매·지급도 거절');}
// 처치 보상
{const m=mk(),E=m.sb.room.enemies;E.push({id:'a',x:70,y:70,hp:5},{id:'b',x:70,y:71,hp:5,r600Elite:true},{id:'c',x:70,y:72,hp:5,r600Boss:true,boss:true});
 m.sb.killEnemy(E[0]);ok(m.api.state().crystals===1,'처치 1 → 결정 1');m.sb.killEnemy(E[0]);ok(m.api.state().crystals===1,'같은 적을 두 번 처치해도 한 번만');
 m.sb.killEnemy(E[1]);m.sb.killEnemy(E[2]);ok(m.api.state().crystals===29,'짙은 형상 3 + 보스 25',m.api.state().crystals);
 ok(m.sb.calls.kill.join()==='a,b,c','엔진 처치 처리는 그대로 한 번씩 부른다');
 // 지역 정화 보너스: 단계가 clear 로 넘어갈 때 한 번
 m.sv.phase='clear';m.run(.5);const c1=m.api.state().crystals;ok(c1===29+P.clearBonus(0),'지역 정화 완료 보너스 한 번',c1);m.run(.5);ok(m.api.state().crystals===c1,'같은 지역에서 다시 주지 않는다');
 m.sv.phase='pre';m.sv.i=1;m.run(.2);m.sv.phase='clear';m.run(.2);ok(m.api.state().crystals===c1+P.clearBonus(1),'다음 지역 정화 때 다시 준다');}
// 구매 → 지금 선 자리에 배치 → 공격
{const m=mk();m.sb.player.x=52;m.sb.player.y=50;ok(m.api.qaGive(150)===true,'검사용 지급');
 let r=m.api.buy('seoha');ok(r.ok&&r.placed===true&&m.api.state().slots.length===1&&m.api.state().crystals===0,'사면 지금 선 자리(코어 사거리 안)에 바로 배치',r);
 ok(m.sb.calls.ensure.length===1&&m.sb.calls.ensure[0].includes('seoha/i'),'배치 영웅 그림을 불러온다');
 m.run(.2);const props=m.sb.room.props.filter(p=>p.r720AllyProp);ok(props.length===1&&near(props[0].x,52)&&near(props[0].y,50),'방 소품으로 한 번만 올라간다(깊이 정렬용)',props.length);
 m.run(1);ok(m.sb.room.props.filter(p=>p.r720AllyProp).length===1,'여러 틱 뒤에도 소품은 하나');
 m.sb.room.enemies.push({id:'in',x:58,y:50,hp:1e9},{id:'out',x:70,y:50,hp:1e9});m.run(3);
 const hits=m.sb.calls.hit;ok(hits.length>=2&&hits.every(h=>h.id==='in'),'사거리 안 적만 스스로 공격한다(밖의 적은 건드리지 않음)',hits.slice(0,3));
 const st=P.slotStats(m.api.state().slots[0],HEROES);ok(hits.length<=Math.ceil(3/st.interval)+1,'공격 간격을 지킨다(3초에 '+hits.length+'번)');
 ok(near(hits[0].v,2*HEROES.seoha.power*st.dmgMul,1e-6),'피해 = 그 영웅 기본 위력 × 자리 배수(조종 영웅이 누구든 같다)',hits[0]);
 // 원래 영웅 그대로: 엔진 기본 공격을 '배치 영웅의 몸'으로 부른다. 조종 영웅 객체·상태는 그대로다.
 {const at=m.sb.calls.attack,me=m.sb.player,bd=m.api.bodies()[0];
  ok(at.length>=2&&at.every(c=>c.hero==='seoha'&&c.ally&&near(c.x,52)&&near(c.y,50)),'엔진 basicAttack 을 윤서하 몸(자리 위치)으로 부른다',at.slice(0,2));
  // R720-4: 지역을 옮겨 엔진이 그림 기억을 비워도 배치 영웅 몸이 읽은 그림은 남는다(사용자 2026-11-12 14:05Z '맵 바뀌면 배치 영웅 이미지 사라짐')
  {const C=m.sb.imageCache,row=k=>({path:k,ready:true,image:{}});for(const k of ['seoha/i','seoha/a','seoha/sheet-walk','seoha/sheet-atk','hwando/i','hwando/a','hwando/il','junk/x'])C.set(k,row(k));
   m.sb.drawHeroReads=['/sheet-walk','/sheet-atk'];for(const p of m.sb.room.props.filter(q=>q.r720AllyProp))m.sb.drawProp(p);m.sb.drawHeroReads=[];
   m.sb.releaseImageMemory();ok(C.has('seoha/sheet-walk')&&C.has('seoha/sheet-atk')&&C.has('seoha/a'),'지역 이동 때 배치 영웅(윤서하)이 쓰던 그림은 지우지 않는다',[...C.keys()]);
   ok(!C.has('junk/x')&&!C.has('hwando/il'),'다른 그림은 엔진대로 지운다',[...C.keys()]);C.clear();}
  // R720-4: 영웅 전용 덧씌우기의 '다음 틱 기술'은 그 영웅 몸으로 돈다
  {const A=m.api,me=m.sb.player;const inS=A.asHero('seoha',()=>m.sb.player),inMain=A.asHero('hwando',()=>m.sb.player),none=A.asHero('neon',()=>m.sb.player);
   ok(inS&&inS!==me&&inS.r720Ally===true&&inS.hero==='seoha','배치된 영웅(윤서하)의 틱 작업은 그 몸을 player 로 돈다');ok(inMain===me&&none===me&&m.sb.player===me,'조종 영웅이나 없는 영웅이면 그대로(조종 영웅), 끝나면 player 는 조종 영웅');}
  ok(m.sb.target==='mine'&&m.sb.command==='mine'&&m.sb.route.length===1&&m.sb.route[0]==='r','배치 영웅의 공격이 조종 영웅의 겨눔·이동 명령(target·command·route)을 바꾸지 않는다(조종 영웅이 끌려가지 않음)',{target:m.sb.target,command:m.sb.command,route:m.sb.route});
  ok(bd&&bd!==me&&bd.r720Ally===true&&bd.hero==='seoha'&&me.hero==='hwando'&&me.r720Ally===undefined,'몸은 조종 영웅과 다른 객체, 끝나면 player 는 조종 영웅으로 돌아와 있다');
  ok(me.combo===0&&me.attackCD===0&&me.attackAnim===0&&me.x===52&&me.y===50&&me.direction==='front','조종 영웅의 콤보·쿨·자세·위치·방향은 안 바뀐다',{combo:me.combo,cd:me.attackCD});
  ok(bd.combo===at.length&&bd.progressionR62===me.progressionR62&&bd.upgrades===me.upgrades&&bd.poseStarted5!==me.poseStarted5,'콤보는 몸마다 따로, 스킬 단계·패시브는 조종 영웅 것을 함께 쓴다');
  ok(m.sb.calls.late.length>=1&&m.sb.calls.late.every(c=>c.hero==='seoha'&&c.ally),'지연 작업(연계 타격)도 같은 몸으로 돈다',m.sb.calls.late.slice(0,2));
  const lateHit=hits.find(h=>near(h.v,2*HEROES.seoha.power*.5*st.dmgMul,1e-6));ok(!!lateHit,'지연 타격에도 자리 위력 배수가 한 번만 곱해진다',hits.slice(0,4).map(h=>h.v));
  ok(JSON.stringify(m.api.allies()).length>0&&JSON.stringify(m.api.state()).length>0,'상태 출력은 JSON 으로 만들 수 있다(몸을 싣지 않는다)');
  // 엔진 공격이 오류를 내도 player 는 조종 영웅으로 돌아온다
  m.sb.throwInAttack=true;const e0=m.api.inspect().stats.errors;m.run(1.5);m.sb.throwInAttack=false;m.expErr=m.api.inspect().stats.errors;
  ok(m.sb.player===me&&m.api.inspect().stats.errors>e0,'엔진 공격이 오류를 내도 player 는 조종 영웅으로 되돌아온다(오류는 기록)');
  // 조종 영웅 자신의 공격에는 배수가 붙지 않는다
  const n0=hits.length;m.sb.player.x=57;m.sb.basicAttack();m.sb.player.x=52;ok(hits.length===n0+1&&near(hits[n0].v,2*HEROES.hwando.power,1e-6),'조종 영웅 자신의 공격 피해는 그대로(배수 없음)',hits[n0]);m.sb.player.attackCD=0;m.sb.player.attackAnim=0;m.sb.player.combo=0;m.sb.player.direction='front';
  // 그리기: 엔진 drawHero 를 그 몸으로
  m.sb.calls.heroDraw.length=0;m.sb.drawProp(m.sb.room.props.find(p=>p.r720AllyProp));const hd=m.sb.calls.heroDraw;ok(hd.length===1&&hd[0].hero==='seoha'&&near(hd[0].x,52)&&m.sb.player===me,'배치 영웅은 엔진 영웅 그리기(drawHero)로 그린다',hd);}
 // 창·불러오기 중에는 멈춘다
 const h0=m.sb.calls.hit.length;m.sb.modal=true;m.run(2);ok(m.sb.calls.hit.length===h0,'창이 열려 전투가 멈춘 동안은 공격하지 않는다');m.sb.modal=false;
 // 그리기: 내 소품만 내가 그리고 나머지는 엔진에 넘긴다
 const d0=m.sb.calls.drawBase;m.sb.drawProp(m.sb.room.props.find(p=>p.r720AllyProp));ok(m.sb.calls.drawBase===d0&&m.sb.calls.sprite.some(p=>/^seoha\//.test(p)),'배치 영웅은 그 영웅 그림으로 그린다');
 m.sb.drawProp(m.sb.room.props[0]);m.sb.drawProp({id:'tree'});ok(m.sb.calls.drawBase===d0+2,'다른 소품(정화 코어 포함)은 원래 그리기로 넘긴다');
 // 코어 사거리 밖에서 사면 보유만 하고, 안으로 들어와 배치한다
 m.api.qaGive(165);m.sb.player.x=50;m.sb.player.y=60;r=m.api.buy('neon');ok(r.ok&&r.placed===false&&m.api.state().owned.neon&&m.api.state().slots.length===1,'사거리 밖에서 사면 보유만(결정은 빠짐)',r);
 ok(m.api.placeHere('neon').ok===false,'사거리 밖에서는 배치 거절');m.sb.player.x=48;m.sb.player.y=50;ok(m.api.placeHere('neon').ok===true&&m.api.state().slots.length===2,'안으로 들어와 배치');
 // 강화·옮기기
 m.api.qaGive(P.cost('range',0));ok(m.api.upgrade(0,'range').ok&&m.api.state().slots[0].rangeLv===1,'자리 사거리 강화');
 m.sb.player.x=50;m.sb.player.y=53;ok(m.api.moveHere(0).ok&&near(m.api.state().slots[0].oy,3),'자리 옮기기');m.run(.2);
 const pr=m.sb.room.props.find(p=>p.r720AllyProp&&p.r720Slot===0);ok(near(pr.x,50,.6)&&near(pr.y,53,.6),'옮기면 영웅도 새 자리로 온다',{x:pr.x,y:pr.y});
 ok(m.api.inspect().stats.errors===m.expErr,'일부러 낸 오류 말고는 오류 없음',m.api.inspect().lastError);}
// 교대(엔진 영웅 변경으로 바뀌어도, 창의 교대 단추로 바꿔도)
{const m=mk();m.sb.player.x=52;m.sb.player.y=50;m.api.qaGive(150);m.api.buy('seoha');m.api.qaGive(P.cost('level',1));m.api.upgrade(0,'level');m.run(.2);
 m.sb.player.hero='seoha';m.run(.2);const s=m.api.state();ok(s.main==='seoha'&&s.slots[0].hero==='hwando'&&s.slots[0].lv===2,'엔진 영웅 변경으로 윤서하가 되면 환도가 그 자리에(레벨 2 유지)',s.slots[0]);
 m.sb.calls.sprite.length=0;m.sb.drawProp(m.sb.room.props.find(p=>p.r720AllyProp));ok(m.sb.calls.sprite.some(p=>/^hwando\//.test(p)),'그 자리에 환도 그림이 선다');
 m.sb.room.enemies.push({id:'in',x:53,y:50,hp:1e9});m.run(2);ok(m.sb.calls.hit.length>0&&near(m.sb.calls.hit[0].v,2*HEROES.hwando.power*P.slotStats(s.slots[0],HEROES).dmgMul,1e-6)&&m.sb.calls.attack.every(c=>c.hero==='hwando'&&c.ally),'들어간 환도는 환도 위력·환도 공격으로 싸운다',m.sb.calls.hit[0]);
 (async()=>{const r=await m.api.swapTo(0);const t=m.api.state();ok(r.ok&&m.sb.player.hero==='hwando'&&t.main==='hwando'&&t.slots[0].hero==='seoha','창의 교대 단추: 환도로 돌아오고 윤서하가 다시 그 자리',t.slots[0]);
  ok(m.sb.player.x===52&&m.sb.player.y===50,'교대해도 내 위치는 그대로');ok(m.sb.calls.icons>0,'교대 뒤 스킬 아이콘을 새로 그린다');
  ok((await m.api.swapTo(5)).ok===false,'없는 자리로는 교대하지 않는다');finish();})();}
// 새 판·다른 모드로 나가면 초기화
function finish(){
 {const m=mk();m.sb.player.x=52;m.api.qaGive(200);m.api.buy('seoha');m.run(.2);ok(m.api.state().slots.length===1,'(준비) 배치 1');
  m.sv.starts=2;m.sb.room={...m.sb.room,props:[{id:'r600:core',r600CoreProp:true,x:50,y:50}],enemies:[]};m.run(.2);
  const s=m.api.state();ok(s.crystals===0&&s.slots.length===0&&Object.keys(s.owned).join()==='hwando','새 판(다시 도전)에서는 결정·보유·자리가 초기화',s);
  ok(m.sb.room.props.every(p=>!p.r720AllyProp),'새 판 방에 예전 배치 소품이 남지 않는다');}
 {const m=mk();m.sb.player.x=52;m.sb.player.y=50;m.api.qaGive(150);m.api.buy('seoha');m.run(.2);
  // 다음 지역: 방이 새로 만들어져도(소품 목록 새로) 같은 코어 기준 자리에 다시 선다
  m.sb.room={id:'dist01',engaged:true,props:[{id:'r600:core',r600CoreProp:true,x:30,y:40}],enemies:[],survivalR600:{centre:{x:30,y:40},arena:{x0:1,y0:1,x1:59,y1:79}}};m.sv.i=1;m.run(.2);
  const pr=m.sb.room.props.filter(p=>p.r720AllyProp);ok(pr.length===1&&near(pr[0].x,32)&&near(pr[0].y,40),'다음 지역에서도 코어 기준 같은 자리에 선다',pr.map(p=>[p.x,p.y]));
  m.sv.hereV=false;m.run(.2);ok(m.sb.room.props.every(p=>!p.r720AllyProp),'생존을 벗어나면 소품을 거둔다');}
 {const m=mk();ok(m.sb.calls.tickBase===0,'(준비)');m.run(.5);ok(m.sb.calls.tickBase===10&&near(m.sb.time,10.5),'엔진 tick 은 그대로 한 번씩 돈다');}
 console.log('\n'+(n-bad)+'/'+n+(bad?' — FAIL '+bad:' — ALL PASS'));process.exit(bad?1:0);
}
