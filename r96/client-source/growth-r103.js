/* R103 growth: 보물상자, 확률 발동 패시브, 미카엘라의 처방(히든 강화 777종).
 * - 보물상자: 전투 지역과 사몽 미로·상승맵에 놓입니다. 상호작용 키(E·모바일 상호작용)로 열고,
 *   난이도에 따라 패시브 포인트 1~7을 받습니다. 연 상자는 저장되어 다시 받을 수 없습니다.
 * - 확률 발동 패시브: 사몽 루트를 시작한 뒤 DREAM에서, 기본 공격이 나갈 때 기술(W·E·R)이
 *   확률로 자동 발동합니다. k단계로 올리는 비용은 k² 포인트(최대 7단계).
 * - 미카엘라의 처방: 사몽 루트에서 패시브 포인트를 777점 모을 때마다 사몽 구간에 미카엘라가
 *   나타나 777종 가운데 셋을 제시합니다. 이 길로만 얻습니다. 효과는 DREAM에서 적용됩니다.
 * 저장 필드는 growthR103 하나이며 기존 저장·진행은 건드리지 않습니다. */
(()=>{'use strict';
 if(window.__STORYWORLD_GROWTH_R103__)return;
 const REV='R103-growth-1',VERSION=1,MAX_LEVEL=7,MICHAELA_EVERY=777;
 let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,400);};
 const live=()=>typeof started!=='undefined'&&started&&!!player&&!!room;
 const SM=()=>window.__STORYWORLD_SAMONG_R103__;
 const inSamong=()=>!!SM()?.here?.();
 const routeOpen=()=>SM()?.state?.()?.started===true;
 const dreamOn=()=>routeOpen()&&typeof layer!=='undefined'&&layer==='DREAM';
 const ASSET={closed:'assets/r103/chest-closed.svg',open:'assets/r103/chest-open.svg',michaela:'assets/hero_direction337/michaela/s.webp'};

 // ---- state ---------------------------------------------------------------------------------
 const fresh=()=>({version:VERSION,opened:[],procs:{},earned:0,lastPoints:null,visits:0,picks:[],offer:null,killAcc:0,procs7:0});
 let G=fresh();
 function clean(v){const g=fresh();if(!v||v.version!==VERSION)return g;
  g.opened=Array.isArray(v.opened)?v.opened.filter(x=>typeof x==='string').slice(-4000):[];
  if(v.procs&&typeof v.procs==='object')for(const[k,n]of Object.entries(v.procs))if(/^[a-z]+:[wer]$/.test(k)&&Number.isInteger(n))g.procs[k]=Math.max(0,Math.min(MAX_LEVEL,n));
  g.earned=Math.max(0,Math.floor(Number(v.earned)||0));g.visits=Math.max(0,Math.floor(Number(v.visits)||0));
  g.picks=Array.isArray(v.picks)?[...new Set(v.picks.filter(n=>Number.isInteger(n)&&n>=0&&n<777))].slice(0,777):[];
  g.offer=Array.isArray(v.offer)&&v.offer.length===3&&v.offer.every(n=>Number.isInteger(n)&&n>=0&&n<777)?v.offer.slice():null;
  g.killAcc=Math.max(0,Math.min(5,Math.floor(Number(v.killAcc)||0)));return g;}

 // ---- difficulty → chest points (1~7) ------------------------------------------------------
 // R71 난이도(이지·노말·하드)와 세계(STORY·DREAM·사몽 구간)를 함께 봅니다.
 const CHEST=Object.freeze({easy:[1,2,2],normal:[3,4,5],hard:[6,7,7]});
 function tier(){try{const t=window.__STORYWORLD_PROGRESSION_R71__?.inspect?.()?.difficultyTier;return CHEST[t]?t:'normal';}catch(e){return'normal';}}
 function chestPoints(){const row=CHEST[tier()];return inSamong()?row[2]:layer==='DREAM'?row[1]:row[0];}

 // ---- 777 처방: 7계열 × 111변형 -----------------------------------------------------------------
 const LINES=Object.freeze([
  {id:'edge',name:'결',stat:'power',base:2.4,unit:'%',text:v=>'공격 위력 +'+v+'%',cap:60},
  {id:'wall',name:'방벽',stat:'ward',base:1.6,unit:'%',text:v=>'받는 피해 −'+v+'%',cap:35},
  {id:'pulse',name:'맥박',stat:'heal',base:1.5,unit:'',text:v=>'처치할 때 체력 +'+v,cap:30},
  {id:'thread',name:'실',stat:'proc',base:1.1,unit:'%p',text:v=>'기술 확률 발동 +'+v+'%p',cap:25},
  {id:'lamp',name:'등불',stat:'light',base:3,unit:'%',text:v=>'미로 손전등 거리 +'+v+'%',cap:60},
  {id:'echo',name:'잔향',stat:'echo',base:9,unit:'%',text:v=>'확률 발동 때 주변에 공격력 '+v+'% 피해',cap:150},
  {id:'rampart',name:'성벽',stat:'last',base:2.5,unit:'%',text:v=>'체력 35% 이하일 때 받는 피해 추가 −'+v+'%',cap:40}
 ]);
 const ROMAN=['I','II','III'];
 const round1=v=>Math.round(v*10)/10;
 function rx(n){if(!Number.isInteger(n)||n<0||n>=777)return null;const L=Math.floor(n/111),v=n%111,grade=Math.floor(v/37),sub=v%37,line=LINES[L];
  const main={stat:line.stat,value:round1(line.base*(grade+1)*(1+(sub%7)/20))};
  const effects=[main];if(sub>=7){const s=LINES[(L+1+sub%6)%7];effects.push({stat:s.stat,value:round1(s.base*(grade+1)/3)});}
  return{id:n,no:String(n+1).padStart(3,'0'),line:line.id,name:'처방 No.'+String(n+1).padStart(3,'0')+' · '+line.name+' '+ROMAN[grade],grade:grade+1,effects,
   text:effects.map(e=>LINES.find(l=>l.stat===e.stat).text(e.value)).join(' · ')};}
 const ALL_RX=Object.freeze(Array.from({length:777},(_,n)=>n));
 let totalsCache=null;
 function totals(){if(totalsCache)return totalsCache;const t={};for(const l of LINES)t[l.stat]=0;for(const n of G.picks){const r=rx(n);if(r)for(const e of r.effects)t[e.stat]+=e.value;}for(const l of LINES)t[l.stat]=Math.min(l.cap,round1(t[l.stat]));return totalsCache=t;}
 const bonus=stat=>dreamOn()?totals()[stat]||0:0;

 // ---- 확률 발동 패시브 ----------------------------------------------------------------------------
 const SLOTS=['w','e','r'];
 const procKey=(slot,h=player?.hero)=>String(h)+':'+slot;
 const procLevel=(slot,h)=>G.procs[procKey(slot,h)]||0;
 const procCost=level=>level*level;
 const procChance=level=>level>0?Math.min(.6,.03+.04*level+bonus('proc')/100):0;
 let procReadyAt=0;
 function rollProc(){if(!dreamOn()||!window.__STORYWORLD_WER__?.cast||time<procReadyAt)return false;
  const order=SLOTS.filter(s=>procLevel(s)>0).sort(()=>Math.random()-.5);
  for(const slot of order){if(Math.random()>=procChance(procLevel(slot)))continue;let ok=false;try{ok=window.__STORYWORLD_WER__.cast(slot,true)===true;}catch(e){fail(e);}
   if(ok){procReadyAt=time+.8;G.procs7++;echo();try{fx('sigil',player.x,player.y,{asset:VFX.cross,size:1.4,life:.45,procR103:slot});}catch(e){}return true;}}
  return false;}
 function echo(){const pct=bonus('echo');if(pct<=0)return;const dmg=attackPower()*pct/100;for(const e of liveEnemies())if(Math.hypot(e.x-player.x,e.y-player.y)<3.6)try{hitEnemy(e,dmg);}catch(err){fail(err);}}
 function buyProc(slot){const lv=procLevel(slot);if(!routeOpen()){toast('사몽 루트를 시작하면 열립니다.',3);return false;}if(lv>=MAX_LEVEL){toast('이미 7단계입니다.',2);return false;}const cost=procCost(lv+1);if(!(player.points>=cost)){toast('패시브 포인트가 부족합니다. 필요 '+cost+'점',3);return false;}
  player.points-=cost;G.lastPoints=player.points;G.procs[procKey(slot)]=lv+1;try{sound('upgrade');}catch(e){}try{updateHUD();}catch(e){}saveGame(false);return true;}

 // ---- 보물상자 ---------------------------------------------------------------------------------
 function chestProp(id,at,extra={}){const open=G.opened.includes(id);return{id:'r103chest:'+id,chestR103:id,x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,path:open?ASSET.open:ASSET.closed,height:50,label:'보물상자',growthR103:'chest',...extra};}
 function openChest(p){const id=p?.chestR103||p?.chest;if(!id)return false;if(G.opened.includes(id)){toast('이미 연 보물상자입니다.',2);return false;}
  const pts=chestPoints();G.opened.push(id);if(G.opened.length>4000)G.opened.shift();player.points+=pts;
  p.chestR103=id;p.path=ASSET.open;p.r74Prop=undefined;p.height=50;p.growthR103='chest';
  try{fx('sigil',p.x,p.y,{asset:VFX.cross,size:2.2,life:.9});sound('clear');}catch(e){}
  toast('보물상자 · 패시브 포인트 +'+pts+' ('+({easy:'이지',normal:'노말',hard:'하드'}[tier()])+(inSamong()?' · 사몽':layer==='DREAM'?' · DREAM':'')+')',3.2);
  try{updateHUD();}catch(e){}saveGame(false);return true;}
 const chestSeen=id=>G.opened.includes(id);
 // One chest per combat region, placed on a floor node away from the entry; never solid.
 // The hospital (ep1a08) keeps its audited native prop set untouched.
 function placeChest(r){if(!r||r.samongR103||r.id==='ep1a08'||!r.exploration||!regionById[r.id]||regionById[r.id].safe)return;const id=(r.layer||layer)+':'+r.id;if(r.props.some(p=>p.chestR103===id))return;
  const L=r.exploration,entry=L.entry||L.entrance||{x:0,y:0},nodes=(L.nodes||[]).filter(n=>Number.isFinite(n.x+n.y)&&Math.hypot(n.x-entry.x,n.y-entry.y)>6);if(!nodes.length)return;
  let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
  for(let t=0;t<nodes.length;t++){const n=nodes[(h+t)%nodes.length];for(const[dx,dy]of[[1.4,1.4],[-1.4,1.4],[1.4,-1.4],[-1.4,-1.4],[0,0]]){const q={x:n.x+dx,y:n.y+dy};let ok=true;try{ok=!blocked(q.x,q.y,.5,r);}catch(e){ok=false;}if(ok&&!(r.objective&&Math.hypot(q.x-r.objective.x,q.y-r.objective.y)<3)){r.props.push(chestProp(id,q));return;}}}}

 // ---- 미카엘라 ---------------------------------------------------------------------------------
 const due=()=>routeOpen()&&Math.floor(G.earned/MICHAELA_EVERY)>G.visits;
 function ringPoint(c,min,max){for(let t=0;t<30;t++){const a=Math.random()*Math.PI*2,d=min+Math.random()*(max-min),q={x:c.x+Math.cos(a)*d,y:c.y+Math.sin(a)*d};try{if(!blocked(q.x,q.y,.5,room))return q;}catch(e){}}return null;}
 function summon(){if(!inSamong()||room.props.some(p=>p.growthR103==='michaela'))return;const q=ringPoint(player,2.4,4.2);if(!q)return;
  room.props.push({id:'r103michaela:'+G.visits,x:q.x,y:q.y,solid:false,autoTargetEligible6:false,visible:true,path:ASSET.michaela,height:64,label:'미카엘라',growthR103:'michaela',samongR103:'michaela'});
  try{fx('sigil',q.x,q.y,{asset:VFX.cross,size:2.6,life:1.4});}catch(e){}toast('미카엘라가 나타났습니다 · 가까이 가서 상호작용',4);}
 function offer(){if(G.offer)return G.offer;const left=ALL_RX.filter(n=>!G.picks.includes(n));const pick=[];let s=(G.visits*2654435761+G.earned)>>>0;const rnd=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
  // Three different lines when possible, so each visit is a real choice.
  const lines=new Set();for(let k=0;k<80&&pick.length<3&&left.length;k++){const n=left[Math.floor(rnd()*left.length)];const L=Math.floor(n/111);if(pick.includes(n)||(lines.has(L)&&k<60))continue;pick.push(n);lines.add(L);}
  return G.offer=pick;}
 function talkMichaela(p){if(!due()){toast('미카엘라는 잠시 눈을 감고 있습니다.',2);return false;}const list=offer().map(rx).filter(Boolean);
  const html='<button id="r103MiClose" class="close">닫기</button><div class="eyebrow">DREAM / 사몽 · 미카엘라</div><h2>미카엘라의 처방</h2><p class="small">셋 가운데 하나를 고릅니다. 이 처방은 사몽 루트에서 미카엘라에게서만 받을 수 있습니다. ('+(G.picks.length)+' / 777)</p><div class="actions r103-rx">'+
   list.map((r,i)=>'<button id="r103Rx'+i+'" class="primary" style="display:block;width:100%;text-align:left;margin:6px 0"><b>'+escapeHTML(r.name)+'</b><br><span class="small">'+escapeHTML(r.text)+'</span></button>').join('')+'</div>';
  openPanel(html);button('r103MiClose',()=>closePanel(true));list.forEach((r,i)=>button('r103Rx'+i,()=>{choose(r.id,p);closePanel(true);}));return true;}
 function choose(n,p){if(!G.offer?.includes(n)||G.picks.includes(n))return false;G.picks.push(n);G.offer=null;G.visits++;totalsCache=null;
  if(p&&room?.props){room.props=room.props.filter(q=>q!==p);}try{fx('sigil',player.x,player.y,{asset:VFX.cross,size:2,life:1});sound('upgrade');}catch(e){}toast(rx(n).name+' · '+rx(n).text,4);saveGame(false);return true;}

 // ---- 성장 패널 --------------------------------------------------------------------------------
 function showGrowth(){const h=HEROES?.[player.hero]?.name||player.hero,defs=window.__STORYWORLD_WER__?.defs?.[player.hero]||{},t=totals(),open=routeOpen();
  let html='<button id="r103GrClose" class="close">닫기</button><div class="eyebrow">DREAM / 사몽 · 성장</div><h2>확률 발동 패시브 · '+escapeHTML(h)+'</h2>'+
   '<p class="small">기본 공격이 나갈 때 기술이 확률로 자동 발동합니다. k단계 비용은 k² 포인트, 최대 7단계. '+(open?'DREAM에서 적용됩니다.':'사몽 루트를 시작하면 열립니다.')+' 보유 '+player.points+'점</p><div class="actions">';
  for(const slot of SLOTS){const d=defs[slot],lv=procLevel(slot),next=lv<MAX_LEVEL?procCost(lv+1):null;html+='<button id="r103Pr'+slot+'" '+(open&&next!==null&&player.points>=next?'':'disabled')+' style="display:block;width:100%;text-align:left;margin:4px 0">'+slot.toUpperCase()+' · '+escapeHTML(d?.[0]||slot)+' — '+lv+' / 7단계 · 발동 '+Math.round(procChance(lv)*100)+'%'+(next!==null?' · 다음 '+next+'점':' · 최대')+'</button>';}
  html+='</div><h3>미카엘라의 처방 '+G.picks.length+' / 777</h3><p class="small">사몽 루트에서 모은 포인트 '+G.earned+' · 다음 만남까지 '+(MICHAELA_EVERY-(G.earned%MICHAELA_EVERY))+'점'+(due()?' · 지금 사몽 구간에 나타납니다':'')+'</p>';
  const parts=LINES.filter(l=>t[l.stat]>0).map(l=>escapeHTML(l.text(t[l.stat])));html+='<p class="small">'+(parts.length?parts.join(' · '):'아직 받은 처방이 없습니다.')+'</p>';
  openPanel(html);button('r103GrClose',()=>closePanel(true));for(const slot of SLOTS)button('r103Pr'+slot,()=>{if(buyProc(slot))showGrowth();});}
 function growthButton(){const box=document.querySelector('#panel .actions');if(!box||!started||document.getElementById('r103Grow'))return;if(!document.getElementById('r103Menu')&&!document.getElementById('r103Enter'))return;const b=document.createElement('button');b.id='r103Grow';b.textContent='확률 발동 · 처방';box.appendChild(b);b.onclick=()=>{closePanel(true);showGrowth();};}

 // ---- hooks ---------------------------------------------------------------------------------
 let lastTrack=0;
 function track(){if(!live())return;const p=Number(player.points);if(!Number.isFinite(p))return;if(G.lastPoints===null){G.lastPoints=p;return;}if(p>G.lastPoints&&routeOpen())G.earned+=p-G.lastPoints;G.lastPoints=p;}
 function near(kind){let best=null,bd=1e9;for(const p of room?.props||[]){if(p.growthR103!==kind||p.visible===false)continue;const d=Math.hypot(p.x-player.x,p.y-player.y);if(d<1.9&&d<bd){best=p;bd=d;}}return best;}
 function preload(){for(const p of[ASSET.closed,ASSET.open,ASSET.michaela])try{if(!readyImage(p)&&typeof addImage==='function')addImage(p,'R103 성장');}catch(e){fail(e);}}
 function install(){
  preload();
  const tickBase=tick;tick=function(dt){const r=tickBase.apply(this,arguments);try{if(live()&&!loading){if(time-lastTrack>.25){lastTrack=time;track();}if(due()&&!modal&&player.hp>0)summon();}}catch(e){fail(e);}return r;};
  const atkBase=basicAttack;basicAttack=function(...a){const before=player?.attackCD,combo=player?.combo;const r=atkBase.apply(this,a);try{if(live()&&player.combo!==combo&&player.attackCD>0&&player.attackCD!==before)rollProc();}catch(e){fail(e);}return r;};
  const powBase=attackPower;attackPower=function(...a){const v=powBase.apply(this,a);try{const b=bonus('power');return b>0&&Number.isFinite(v)?v*(1+b/100):v;}catch(e){fail(e);return v;}};
  const hurtBase=hurt;hurt=function(damage,source,...a){try{if(Number.isFinite(damage)&&damage>0&&dreamOn()){let f=1-bonus('ward')/100;if(player.hp<maxHP()*.35)f*=1-bonus('last')/100;damage*=Math.max(.4,f);}}catch(e){fail(e);}return hurtBase.call(this,damage,source,...a);};
  const killBase=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded;const r=killBase.apply(this,[e,...a]);try{if(first&&e?.deadRecorded&&!e.samongR103Silent&&live()){const heal=bonus('heal');if(heal>0&&player.hp>0)player.hp=Math.min(maxHP(),player.hp+heal);
    // 사몽 처치 보상: 처치 여섯 번마다 1점, 사몽 보스 77점.
    if(e.samongR103&&inSamong()){if(e.samongBoss)player.points+=77;else if(++G.killAcc>=6){G.killAcc=0;player.points+=1;}}}}catch(err){fail(err);}return r;};
  const interactBase=interact;interact=function(...a){try{if(live()&&!modal&&!loading&&player.hp>0){const c=near('chest');if(c&&!chestSeen(c.chestR103||c.chest)){openChest(c);return;}const m=near('michaela');if(m){talkMichaela(m);return;}}}catch(e){fail(e);}return interactBase.apply(this,a);};
  const enterBase=enterRegion;enterRegion=async function(...a){const r=await enterBase.apply(this,a);try{preload();if(live()&&!room.samongR103)placeChest(room);}catch(e){fail(e);}return r;};
  const saveBase=serializeSave;serializeSave=function(...a){const d=saveBase.apply(this,a);try{d.growthR103=JSON.parse(JSON.stringify(G));}catch(e){fail(e);}return d;};
  const restoreBase=restoreSave;restoreSave=async function(raw,...a){const prior=G;G=clean(raw?.growthR103);G.lastPoints=null;totalsCache=null;try{const r=await restoreBase.call(this,raw,...a);if(r===false)G=prior;else{G.lastPoints=null;try{if(live()&&!room.samongR103)placeChest(room);}catch(e){fail(e);}}return r;}catch(e){G=prior;throw e;}};
  const newBase=newGame;newGame=async function(...a){const prior=G;G=fresh();totalsCache=null;try{return await newBase.apply(this,a);}catch(e){G=prior;throw e;}};
  const opBase=openPanel;openPanel=function(html,...a){const r=opBase.call(this,html,...a);try{setTimeout(growthButton,0);}catch(e){fail(e);}return r;};
  // A soft golden glow marks a closed chest (and Michaela) so it reads from a distance.
  const propBase=drawProp;drawProp=function(p,...a){try{if(p&&(p.growthR103==='michaela'||p.growthR103==='chest'&&!chestSeen(p.chestR103))&&typeof ctx!=='undefined'&&ctx){const q=project(p.x,p.y),z=typeof zoom==='number'?zoom:1,pulse=.75+.25*Math.sin(time*3+p.x),r=(p.growthR103==='michaela'?34:30)*z;
    ctx.save();try{ctx.globalCompositeOperation='lighter';for(const[k,al]of[[1,.10],[.62,.16],[.32,.22]]){ctx.fillStyle=p.growthR103==='michaela'?'rgba(255,170,200,'+(al*pulse).toFixed(3)+')':'rgba(255,205,90,'+(al*pulse).toFixed(3)+')';ctx.beginPath();ctx.ellipse(q.x,q.y-6*z,r*k,r*k*.5,0,0,Math.PI*2);ctx.fill();}}finally{ctx.restore();}}}catch(e){fail(e);}return propBase.apply(this,[p,...a]);};
 }
 try{install();}catch(e){fail(e);}
 function inspect(){return{revision:REV,state:JSON.parse(JSON.stringify(G)),tier:live()?tier():null,chestPoints:live()?chestPoints():null,totals:totals(),due:due(),routeOpen:routeOpen(),dreamOn:live()?dreamOn():false,failures,lastError,chests:live()?room.props.filter(p=>p.growthR103==='chest').map(p=>({id:p.chestR103,x:p.x,y:p.y,open:chestSeen(p.chestR103)})):[]};}
 const test={addEarned:n=>{G.earned+=n;},setProc:(slot,n)=>{G.procs[procKey(slot)]=n;},roll:()=>rollProc(),choose:n=>choose(n),offer:()=>offer(),near};
 window.__STORYWORLD_GROWTH_R103__=Object.freeze({revision:REV,MAX_LEVEL,MICHAELA_EVERY,LINES,rx,chestPoints,procCost,procChance,openChest,talkMichaela,chestProp,chestSeen,placeChest,showGrowth,buyProc,lightScale:()=>1+bonus('light')/100,totals,inspect,test,state:()=>G});
})();
