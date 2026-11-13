/* R912 투사체 프레임 시트(Dots CX-0084PJ, 사용자 2026-11-12 08:29Z "퀄리티 떨어지는건 … 닷츠로 자산생성부탁", 11-05 상시 규칙 "스킬 이펙트는 프레임 애니메이션 시트").
   - 영웅 기본탄 4종(서하·헌터·미카엘라·기억사수), 서하 시간 분신탄·Q 얼음 창, 헌터 연사 화살, 몹 공용 탄 3테마, 보스 탄을
     한 장짜리 그림 대신 Dots 가 그린 비행 8칸(12fps 루프)·적중 6칸(14fps 한 번) 시트로 그린다. 표·해시: r96/r912-sheets.json.
   - 바꾸는 것은 그림뿐이다. 판정 반지름·속도·피해·관통·수명은 건드리지 않는다. 다른 덧씌우기가 그리는 꼬리·빛은 그대로 둔다.
   - 방법: 탄의 원래 그리기(엔진과 그 위 덧씌우기 사슬)를 버리는 ctx 에 한 번 흘려 무엇을 그리는지 보고(그 탄의 원래 그림을 그릴 때만 대상),
     같은 자리(탄 자리, 18px×zoom 위)에 시트 한 칸을 그린다. 원래 그림의 잔상 복사본(알파 .22·.35)은 시트에 꼬리가 있어 그리지 않는다.
     다른 그림으로 따로 그리는 탄(불면귀 주민 탄·헌터 R535 화살·던지는 물건 등)은 대상이 아니다. 서하 분신탄은 코드 선이라 그대로 대체한다.
   - 크기는 몸통 긴 변 = 영웅 화면 키 × 표의 비율(모두 .5 이상 → R911 최소 크기 충족). 맘몬의 금고(ep1b06)·기계 테마 몹 탄은 그대로.
   - 끄기: localStorage storyworld.r912.sheets = off · 미카엘라 십자가판: storyworld.r912.michaela = cross */
(function(){
  'use strict';
  if(window.__STORYWORLD_PROJ_SHEETS_R912__)return;
  const KEY='storyworld.r912.sheets',MKEY='storyworld.r912.michaela',CELL=256,DIR='assets/r912/';
  let enabled=true,cross=false;try{enabled=localStorage.getItem(KEY)!=='off';cross=localStorage.getItem(MKEY)==='cross';}catch{}
  const stats={draws:0,swapped:0,direct:0,missed:0,hits:0,hitDraws:0,waiting:0,errors:0};const errs=[];
  function fail(e){stats.errors++;const m=String(e&&e.stack||e).slice(0,300);if(errs.length<8&&!errs.includes(m))errs.push(m);}
  const SHEETS={'pj01-fly':{frames:8,bodyLong:197,cx:127.2,cy:126.2},'pj01-hit':{frames:6,bodyLong:193,cx:126.8,cy:119.2},'pj02-fly':{frames:8,bodyLong:213,cx:121.2,cy:128.8},'pj02-hit':{frames:6,bodyLong:151,cx:124.8,cy:130.0},'pj03-fly':{frames:8,bodyLong:188,cx:122.5,cy:129.5},'pj03-hit':{frames:6,bodyLong:162,cx:127.2,cy:122.5},'pj03x-fly':{frames:8,bodyLong:193,cx:117.5,cy:128.0},'pj03x-hit':{frames:6,bodyLong:158,cx:125.0,cy:124.2},'pj04-fly':{frames:8,bodyLong:212,cx:128.5,cy:131.0},'pj04-hit':{frames:6,bodyLong:161,cx:125.5,cy:130.8},'pj05-fly':{frames:8,bodyLong:168,cx:99.2,cy:124.0},'pj05-hit':{frames:6,bodyLong:143,cx:123.5,cy:125.5},'pj06-fly':{frames:8,bodyLong:179,cx:109.5,cy:126.8},'pj06-hit':{frames:6,bodyLong:152,cx:122.0,cy:125.0},'pj07-fly':{frames:8,bodyLong:132,cx:123.0,cy:124.2},'pj09a-fly':{frames:8,bodyLong:209,cx:129.2,cy:121.5},'pj09a-hit':{frames:6,bodyLong:127,cx:123.2,cy:126.2},'pj09b-fly':{frames:8,bodyLong:164,cx:103.5,cy:129.0},'pj09b-hit':{frames:6,bodyLong:156,cx:127.5,cy:129.5},'pj09c-fly':{frames:8,bodyLong:212,cx:124.5,cy:129.5},'pj09c-hit':{frames:6,bodyLong:139,cx:128.8,cy:127.0},'pj10-fly':{frames:8,bodyLong:198,cx:124.2,cy:127.2},'pj10-hit':{frames:6,bodyLong:167,cx:122.5,cy:124.0}};
  const HV='assets/vfx/heroes/',CORE='assets/vfx/generated/v300/projectile-core.webp';
  // size: 몸통 긴 변 ÷ 영웅 화면 키. hit: 적중 칸 한 변 ÷ 영웅 화면 키. upright: 안의 무늬(하트·십자가·해골)가 눕지 않게 좌우 거울상+작은 기울기만.
  const KINDS={
    pj01:{src:[HV+'seoha-a.webp'],size:.62,hit:1.15},
    pj02:{src:[HV+'hunter-a.webp'],size:.80,hit:1.05},
    pj03:{src:[HV+'michaela-a.webp'],size:.60,hit:1.10,upright:true},
    pj03x:{src:[HV+'michaela-a.webp'],size:.60,hit:1.10,upright:true},
    pj04:{src:[HV+'gunner-laser-bullet.webp'],size:.66,hit:1.10},
    pj05:{src:[],size:.60,hit:1.05,direct:true},
    pj06:{src:[HV+'seoha-q.webp'],size:.80,hit:1.25},
    pj07:{src:[HV+'hunter-a.webp'],size:.70,hit:.8,hitAs:'pj02'},
    pj09a:{src:[CORE],size:.52,hit:.9,upright:true},
    pj09b:{src:[CORE],size:.54,hit:1.0},
    pj09c:{src:[CORE],size:.62,hit:.95},
    pj10:{src:[CORE],size:.80,hit:1.30,upright:true}
  };
  for(const [n,k] of Object.entries(KINDS)){k.name=n;k.fly=SHEETS[n+'-fly'];k.flyPath=DIR+n+'-fly.webp';const h=k.hitAs||n;k.hitSheet=SHEETS[h+'-hit'];k.hitPath=DIR+h+'-hit.webp';k.srcSet=new Set(k.src);}
  const PRE=/^(?:\.\/)?(?:assets\/r911\/clean\/|assets\/r425\/clean\/|assets\/r99\/clean\/)*/;
  function norm(p){if(typeof p!=='string')return '';let q=p.replace(PRE,'');if(q==='assets/r911/derived/gunner-laser-bullet.webp')q=HV+'gunner-laser-bullet.webp';return q;}
  const fin=Number.isFinite;

  // ---- 어떤 탄인가 ----
  // 맘몬의 금고는 Codex 작업 구역(사용자 상시 규칙). 카이로노미콘·기계 몹 지역은 맞는 시트가 없어 그대로 둔다(하이테크는 기계 테마만).
  const NO_ZONE=new Set(['ep1b06']);/* 불면귀 마을(last302·303)은 전용 그림 작업 구역이라 몹 탄을 그대로 둔다. */const MECH=/^(?:kair|u2)|^(?:ep1b07|ep1b09|cult03|cult04|last302|last303)$/;
  const ROT_Z=new Set(['ep1b02','ep1b04','dist02','last305']);
  const ROT_T=/수렁|늪|쓰레기|위장|하수|부패|오물|고블린/,HOSP_T=/병원|병동|수술|진료|응급|입원|영안/;
  function zoneNow(){try{return typeof zone==='string'?zone:'';}catch{return '';}}
  function themeFor(z){if(!z||NO_ZONE.has(z)||MECH.test(z))return null;let t='';try{t=String((typeof regionById!=='undefined'&&regionById[z]&&regionById[z].title)||'');}catch{}
    if(HOSP_T.test(t))return 'pj09c';if(ROT_Z.has(z)||ROT_T.test(t))return 'pj09b';return 'pj09a';}
  function ownerBoss(p){try{const list=(typeof room!=='undefined'&&room&&room.enemies)||[];for(const e of list)if(e&&e.id===p.owner)return !!e.boss;}catch{}return false;}
  const kindCache=new WeakMap();
  function classify(p){
    const z=zoneNow();if(NO_ZONE.has(z))return null;const a=norm(p.asset);
    if(p.friendly){
      if(p.r564Clone)return KINDS.pj05;
      if(a===HV+'seoha-a.webp')return p.r160Basic?KINDS.pj01:null;
      if(a===HV+'hunter-a.webp')return p.r535V?KINDS.pj07:(p.r160Basic&&!p.r535G?KINDS.pj02:null);
      if(a===HV+'michaela-a.webp')return p.r160Basic?(cross?KINDS.pj03x:KINDS.pj03):null;
      if(a===HV+'gunner-laser-bullet.webp')return KINDS.pj04;
      if(a===HV+'seoha-q.webp')return p.attackKind9?KINDS.pj06:null;
      return null;
    }
    /* 몹 탄은 R116 이 몹 색으로 물들인 주소(r116tint/<색>/projectile-core.webp)로 오기도 한다 → 파일 이름으로 본다. */
    if(String(a).split('/').pop()!=='projectile-core.webp')return null;const t=themeFor(z);if(!t)return null;
    return ownerBoss(p)?KINDS.pj10:KINDS[t];
  }
  function kindOf(p){if(!enabled||!p||typeof p!=='object')return null;let c=kindCache.get(p);const z=zoneNow();if(!c||c.z!==z||c.a!==p.asset){let k=null;try{k=classify(p);}catch(e){fail(e);}c={k,z,a:p.asset};try{kindCache.set(p,c);}catch{}}return c.k;}

  // ---- 시트 그림 ----
  // 지역을 옮기면 엔진이 그림 저장소를 비울 수 있다 → 안 온 시트는 2초에 한 번씩 다시 부른다(이미 있으면 addImage 는 그 줄을 돌려준다).
  const asked=new Map();
  function sheet(path){try{const row=typeof readyImage==='function'?readyImage(path):null;if(row&&row.image)return row;const t=Date.now(),last=asked.get(path);if(last===undefined||t-last>2000){asked.set(path,t);if(typeof addImage==='function')addImage(path);}}catch(e){fail(e);}stats.waiting++;return null;}
  function H(){try{const h=typeof actorHeight==='function'?actorHeight():66;return fin(h)&&h>0?h:66;}catch{return 66;}}
  function flightAngle(p){try{const q=project(p.x,p.y),r=project(p.x-p.vx*.06,p.y-p.vy*.06);const a=Math.atan2(q.y-r.y,q.x-r.x);return fin(a)?a:0;}catch{return 0;}}
  function orient(k,ang){const left=Math.cos(ang)<0;if(k.upright){if(left)ctx.scale(-1,1);const t=Math.max(-.42,Math.min(.42,Math.sin(ang)*.42));if(t)ctx.rotate(t);}else{ctx.rotate(ang);if(left)ctx.scale(1,-1);}}
  function blit(row,s,f,S){ctx.drawImage(row.image,f*CELL,0,CELL,CELL,-s.cx/CELL*S,-s.cy/CELL*S,S,S);}
  function drawFly(p,k,row,x,y,angle,alpha){
    const ang=fin(angle)?angle:flightAngle(p),S=H()*k.size*CELL/k.fly.bodyLong,a=fin(alpha)?Math.max(0,Math.min(1,alpha)):1;
    if(![x,y,ang,S].every(fin)||S<=0)return false;
    const t=fin(p.age)?Math.max(0,p.age):(typeof time==='number'&&fin(time)?time:0),f=(Math.floor(t*12)+((p.id|0)*3))%k.fly.frames;
    ctx.save();try{ctx.globalAlpha*=a;ctx.translate(x,y);orient(k,ang);blit(row,k.fly,f,S);}finally{ctx.restore();}
    return true;
  }

  // 원래 그리기를 버리는 ctx. 읽으면 무해한 값, 부르면 아무 일도 없다. drawImage 는 무슨 그림이었는지만 적는다.
  const sinkStore={};let sinkLog=null,realCanvas=null;const sinkFn=function(){return SINK;};
  function srcOf(img){try{if(!img)return '?';const s=img.src||img.currentSrc||img.name;if(typeof s==='string'&&s)return s;if(typeof img.getContext==='function'||img.tagName==='CANVAS')return 'CANVAS';}catch{}return '?';}
  const sinkDraw=function(img){if(sinkLog&&sinkLog.length<24)sinkLog.push(srcOf(img));};
  const SINK=new Proxy(sinkFn,{get(t,k){if(k==='drawImage')return sinkDraw;if(k in sinkStore)return sinkStore[k];if(k==='globalAlpha'||k==='lineWidth')return 1;if(k==='canvas')return realCanvas;if(k===Symbol.toPrimitive)return()=>0;return sinkFn;},set(t,k,v){sinkStore[k]=v;return true;},apply(){return SINK;}});
  const base_=p=>String(p).split(/[?#]/)[0].split('/').pop();
  // 이 탄이 정말 그 그림(또는 R102 가 물들인 사본 캔버스)을 그리는가 — 탄마다 한 번만 본다.
  const eligible=new WeakMap();
  function isEligible(p,k,log){if(k.direct)return true;if(!log.length)return false;const names=k.src.map(base_);let anon=0;
    for(const s of log){if(s==='CANVAS'||/^(?:blob|data):/.test(s)){anon++;continue;}let n=s;try{n=decodeURIComponent(s);}catch{}if(names.includes(base_(n)))return true;}
    return anon===log.length;/* 물들인 사본(캔버스·blob)만 그렸으면 그 그림이다. 다른 이름의 그림이 섞였으면 따로 그리는 탄. */}
  let nest=0;
  function installProjectile(){
    if(typeof drawProjectile!=='function'||drawProjectile.__r912||drawProjectile.__r911)return false;
    const base=drawProjectile;
    const w=function(p,...rest){
      if(!enabled||nest||!p||typeof p!=='object')return base.apply(this,[p,...rest]);
      if(!preloaded)preload();
      const k=kindOf(p);if(!k)return base.apply(this,[p,...rest]);
      const el=eligible.get(p);if(el===false)return base.apply(this,[p,...rest]);
      const row=sheet(k.flyPath);if(!row)return base.apply(this,[p,...rest]);
      if(k.hitSheet)sheet(k.hitPath);
      let q=null;try{q=project(p.x,p.y);}catch{}const z=typeof zoom==='number'&&fin(zoom)?zoom:1;
      if(!q||!fin(q.x)||!fin(q.y))return base.apply(this,[p,...rest]);
      stats.draws++;
      const saved=ctx,log=[];realCanvas=saved&&saved.canvas;sinkLog=log;nest++;ctx=SINK;let out;
      try{out=base.apply(this,[p,...rest]);}catch(e){fail(e);}finally{ctx=saved;nest--;sinkLog=null;}
      if(el===undefined){const yes=isEligible(p,k,log);try{eligible.set(p,yes);}catch{}if(!yes){stats.missed++;nest++;try{return base.apply(this,[p,...rest]);}finally{nest--;}}}
      try{if(drawFly(p,k,row,q.x,q.y-18*z,undefined,1)){if(k.direct)stats.direct++;else stats.swapped++;}}catch(e){fail(e);}
      return out;
    };
    w.__r912=true;drawProjectile=w;return true;
  }
  // ---- 적중 ----
  const HIT_MAX=12,HIT_GAP=.08;const lastHit=new WeakMap();
  function now(){try{return typeof time==='number'&&fin(time)?time:0;}catch{return 0;}}
  function spawnHit(b){
    if(!enabled||!b||typeof b!=='object'||typeof fx!=='function')return;
    const k=kindOf(b);if(!k||!k.hitSheet||!fin(b.x)||!fin(b.y))return;
    const t=now(),prev=lastHit.get(b);if(prev!==undefined&&t-prev<HIT_GAP&&t>=prev)return;
    let n=0;try{for(const e of effects)if(e&&e.type==='r912hit')n++;}catch{}if(n>=HIT_MAX)return;
    lastHit.set(b,t);sheet(k.hitPath);
    fx('r912hit',b.x,b.y,{life:k.hitSheet.frames/14,r912:k.name,angle:flightAngle(b),asset:undefined,size:1});stats.hits++;
  }
  function drawHit(e){
    const k=KINDS[e.r912];if(!k||!k.hitSheet)return;const row=sheet(k.hitPath);if(!row)return;
    const q=project(e.x,e.y),z=typeof zoom==='number'&&fin(zoom)?zoom:1,S=H()*k.hit,ang=fin(e.angle)?e.angle:0;
    if(![q.x,q.y,S].every(fin))return;
    const f=Math.max(0,Math.min(k.hitSheet.frames-1,Math.floor((fin(e.age)?e.age:0)*14)));
    ctx.save();try{ctx.translate(q.x,q.y-18*z);orient(k.upright?k:{upright:true},k.upright?ang:(Math.cos(ang)<0?Math.PI:0));blit(row,k.hitSheet,f,S);}finally{ctx.restore();}
    stats.hitDraws++;
  }
  function installEffect(){
    if(typeof drawEffect!=='function'||drawEffect.__r912)return false;
    const base=drawEffect;
    const w=function(e,...rest){if(e&&e.type==='r912hit'){try{drawHit(e);}catch(err){fail(err);}return;}return base.apply(this,[e,...rest]);};
    w.__r912=true;drawEffect=w;return true;
  }
  function installHits(){
    let n=0;
    if(typeof hitEnemy==='function'&&!hitEnemy.__r912){const base=hitEnemy;const w=function(e,v,b,...rest){const out=base.apply(this,arguments);try{if(out!==false&&b&&typeof b==='object'&&b.friendly)spawnHit(b);}catch(err){fail(err);}return out;};w.__r912=true;hitEnemy=w;n++;}
    if(typeof hurt==='function'&&!hurt.__r912){const base=hurt;const w=function(d,s,...rest){const out=base.apply(this,arguments);try{if(s&&typeof s==='object'&&s.friendly===false&&out!=='ignored')spawnHit(s);}catch(err){fail(err);}return out;};w.__r912=true;hurt=w;n++;}
    return n;
  }
  function ensure(){try{installEffect();installHits();installProjectile();}catch(e){fail(e);}}
  // 시트는 작다(23장 1.5MB). 게임이 시작된 뒤 처음 탄이 그려질 때 한꺼번에 불러 둔다(부팅 중에 부르면 주소가 아직 없어 실패로 남는다). 안 온 동안은 원래 그림.
  let preloaded=false;
  function preload(){preloaded=true;try{for(const k of Object.values(KINDS)){if(k.name===(cross?'pj03':'pj03x'))continue;sheet(k.flyPath);if(k.hitSheet)sheet(k.hitPath);}stats.waiting=0;}catch(e){fail(e);}}
  ensure();
  // 게임이 시작된 뒤, 그리고 지역이 바뀔 때마다(엔진이 그 지역에 안 쓰는 그림을 저장소에서 내린다) 다시 불러 둔다.
  let lastZone=null;
  try{setInterval(()=>{try{if(!enabled||typeof started==='undefined'||!started||typeof loading==='undefined'||loading)return;const z=zoneNow();if(z!==lastZone||!preloaded){lastZone=z;asked.clear();preload();}}catch{}},500);}catch{}

  window.__STORYWORLD_PROJ_SHEETS_R912__={
    revision:'R912-PROJECTILE-SHEETS-1',request:'CX-0084PJ',stats,errors:()=>errs.slice(),sheets:SHEETS,kinds:KINDS,
    get enabled(){return enabled;},setEnabled(v){enabled=!!v;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}return enabled;},
    get michaela(){return cross?'cross':'heart';},setMichaela(v){cross=v==='cross';try{localStorage.setItem(MKEY,cross?'cross':'heart');}catch{}return cross?'cross':'heart';},
    kindOf(p){const k=kindOf(p);return k?k.name:null;},applied(p){return !!(p&&typeof p==='object'&&kindOf(p)&&eligible.get(p)===true);},themeFor,ensure,spawnHit
  };
})();
