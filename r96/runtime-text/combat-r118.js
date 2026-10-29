/* R118 (2026-10-29 사용자 요청): 보스 스킬 순환·영웅 방향 안정·렉·길잡이 전투 진행·영웅 기본 광역·체력 곡선.
 * ① 백의 안정화 감독 배경: 병원 동작 시트(R53 보스·R51/R52 근위·R20 의료도구)에 알파 1~15의 희미한 픽셀이 27만 개 깔려
 *    밝기·그림자 처리를 거치면 몸 주변에 베이지 얼룩으로 보였다. 원본은 그대로 두고 알파<16만 지운 정리본
 *    assets/r118/clean/<원래 경로>로 이미지 주소만 돌린다(R99 정리본과 같은 방식, 캐시 키는 원래 경로).
 * ② 보스 스킬 복원: 보스·중간보스가 이미 가진 기술(R62 독병·투척 장판 = 지역 상태이상, R61 장판 투척·환영·소품 던지기)을
 *    4초 안팎 간격으로 돌려 쓴다. 백의 안정화 감독은 독병 투척(오염 장판)을 두 번에 한 번 쓴다. 새 기술·새 그림은 없다.
 * ③ 영웅 도리도리: 방향을 정하는 층이 넷(이동 방향, R98 정지 시 가까운 적, R111 대상, R113 그리기 직전, 공격 순간 가장 가까운 적)이라
 *    서로 다른 적을 고르면 한 프레임씩 번갈아 보였다. 마지막에 그림 방향을 묻는 한 곳에서 '붙잡은 적'과 각도 여유(15°)·0.3초 유지로 정한다.
 * ④ 렉: 느린 프레임 뒤 밀린 시간을 한 프레임에 6틱까지 몰아 계산하던 것을 3틱으로 묶어 렉이 눈덩이처럼 커지지 않게 한다.
 *    R78 문 검사 층이 충돌 검사마다 기록 목록을 훑던 것은 지역별 캐시로 바꿨다(world-combat-r78.js).
 * ⑤ 길잡이 '전투 위주 자동 진행': 켜면 서사 장면을 자동으로 넘기고(읽음 기록은 남김) 난이도 선택을 지금 값으로 확정하며 길잡이·자동 전투를 유지한다.
 * ⑥ 영웅 기본 광역: 모든 공격·스킬이 맞은 적 주변에 피해 일부를 나눈다. 반경·비율은 기술 단계(R102 7단계)·레벨·강화 수·영웅 특성으로 커진다.
 * ⑦ 체력 곡선: 첫 뿌리 보스(뿌리의 문지기 11,066)가 다음 지역 중간보스와 같던 것을 낮추고, 지역 순서대로 보스·몹 체력이 오르게 한다.
 * 협동(방장 판정) 중에는 ②④의 판정 부분과 ⑥⑦을 쓰지 않는다. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_COMBAT_R118__)return;
 const REV='R118-combat-1',KEY='storyworld.r118.prefs';
 const DEFAULTS={director:true,facing:true,perf:true,splash:true,balance:true,combatRun:false};
 const prefs={...DEFAULTS};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const stats={cleanRedirects:0,casts:{siege:0,field:0,echo:0,prop:0,weapon:0},weaponShots:0,castRefused:0,faced:0,faceSwitches:0,ticksDropped:0,maxTicksPerFrame:0,splashHits:0,splashDamage:0,statusGround:0,scaled:0,scenesSkipped:0,difficultyAuto:0,errors:0,lastError:null};
 const fail=e=>{stats.errors++;stats.lastError=String(e?.stack||e).slice(0,240);};
 const finite=v=>Number.isFinite(Number(v))?Number(v):0;
 const now=()=>typeof time==='number'?time:0;
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const playing=()=>typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading)&&!!player&&player.hp>0;
 const liveFoe=e=>!!e&&e.hp>0&&e.spawnState==='active'&&!e.deadRecorded&&e.visible!==false&&!e.disabled;
 const regionIndex=id=>{const r=typeof regionById!=='undefined'?regionById[id]:null;return Number.isFinite(r?.index)?r.index:null;};

 // ---- ① 병원 동작 시트 정리본 --------------------------------------------------------------------
 const CLEAN=new Set(['assets/visual-test/hospital-boss-motion-r53.png','assets/visual-test/hospital-orderly-motion-r51-v2.png','assets/visual-test/hospital-ranged-back-r53.png','assets/visual-test/hospital-ranged-motion-r52.png','assets/visual-test/hospital-medical-tools-r20.png']);
 if(typeof urlFor==='function'){const base=urlFor;urlFor=function(path,...a){const p=typeof cleanPath==='function'?cleanPath(path):path;if(CLEAN.has(p)){stats.cleanRedirects++;return base.call(this,'assets/r118/clean/'+p,...a);}return base.call(this,path,...a);};}

 // ---- ⑦ 체력 곡선 ---------------------------------------------------------------------------------
 // 지역 순서(regionById.index): 1 dist00(뿌리의 문지기) … 8 ep1a08(백의 안정화 감독) … 62 cult04.
 // 보스급 .42→1.0(1~8번), 이후 한 지역마다 +0.4%. 몹 .70→1.0, 이후 +0.3%. 8번 지역 뒤로는 원래 값보다 조금씩 더 단단해진다.
 function hpCurve(i,major){if(!Number.isFinite(i)||i<1)return 1;if(major)return i<=8?.42+(i-1)*(.58/7):1+(i-8)*.004;return i<=8?.70+(i-1)*(.30/7):1+(i-8)*.003;}
 // 원래 적 HP·피해 수치(기존 회귀 계약)는 그대로 두고, 받는 피해를 1/k배로 바꿔 체감 체력만 곡선에 맞춘다.
 function scaleEnemy(e,i){if(!e||e.r118Hp||e.persona||e.cosmic||e.trial||e.r61Summoned||e.r61Clone)return;const k=hpCurve(i,!!(e.boss||e.midboss));if(k===1)return;e.r118Hp=k;stats.scaled++;}
 if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(id,...a){const r=base.call(this,id,...a);try{if(r?.enemies){const i=regionIndex(id);for(const e of r.enemies)scaleEnemy(e,i);}}catch(err){fail(err);}return r;};}
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,...a){const k=e?.r118Hp;if(k>0&&k!==1&&prefs.balance&&solo()&&Number.isFinite(value)&&value>0)value=value/k;return base.call(this,e,value,...a);};}

 // ---- ② 보스 스킬 순환 ----------------------------------------------------------------------------
 const boss=new WeakMap();
 const isHospitalBoss=e=>e?.nativeId==='mb-ep1a08'&&room?.id==='ep1a08';
 const ORDER_HOSPITAL=['siege','field','siege','echo','prop'],ORDER=['siege','field','echo','prop','field'],ORDER_WEAPON=['weapon','siege','weapon','field','echo','weapon'];
 function directorGap(e){const rage=1-Math.max(0,Math.min(1,finite(e.hp)/Math.max(1,finite(e.maxHp)))),i=regionIndex(room?.id)??8;return Math.max(2.6,Math.min(4.4,4.4-rage*1.2-Math.min(.8,i*.012)));}
 function cast(e,kind){const F=window.__STORYWORLD_FIELDS_R61__,B=window.__STORYWORLD_BOSS_FIELDS_R62__;
  if(kind==='weapon')return throwWeapon(e);if(kind==='siege')return B?.prepare?B.prepare(e):null;return F?.prepare?F.prepare(e,kind):null;}
 function directorTick(){if(!prefs.director||!solo()||!playing()||(typeof modal!=='undefined'&&modal)||!room?.engaged)return;
  const F=window.__STORYWORLD_FIELDS_R61__,B=window.__STORYWORLD_BOSS_FIELDS_R62__;if(!F?.prepare)return;const t=now();
  for(const e of room.enemies||[]){if(!(e.boss||e.midboss)||e.persona||e.cosmic||e.trial||e.r61Summoned||!liveFoe(e)||t<finite(e.graceUntil))continue;
   let s=boss.get(e);if(!s||s.room!==room){s={room,next:t+2.2,step:0};boss.set(e,s);}if(t<s.next)continue;
   if(F.activeAction?.(e)||e.attack||e.rangedWindup>0){s.next=t+.35;continue;}
   const d=Math.hypot(player.x-e.x,player.y-e.y);if(d>13||(typeof clearLine==='function'&&!clearLine(e,player))){s.next=t+.6;continue;}
   const order=isHospitalBoss(e)?ORDER_HOSPITAL:weaponsOf(e)?ORDER_WEAPON:ORDER;let done=null;
   for(let k=0;k<order.length&&!done;k++){const kind=order[(s.step+k)%order.length];let a=null;try{a=cast(e,kind);}catch(err){fail(err);}if(a){done=kind;s.step+=k+1;}}
   if(!done){stats.castRefused++;s.step++;s.next=t+.8;continue;}
   stats.casts[done]++;const gap=directorGap(e);s.next=t+gap;
   // 원래 스케줄(R61 8.2초, R62 장판 종료 뒤)은 이 순환 뒤로 미뤄 같은 기술이 겹쳐 쏟아지지 않게 한다.
   try{const st=F.state?.(e);if(st)st.next=Math.max(finite(st.next),t+gap*1.6);const o=B?.ownerState?.(e);if(o)o.next=Math.max(finite(o.next),t+gap*1.6);}catch(err){fail(err);}
  }}

 // 독병·장판의 '바닥이 변하는 상태이상'(R61/R62 원래 오염·속박·빙결 등 바닥 그림)은 R105 보스색 장판이 대신 그리면서 사라졌다
 // (백의 안정화 감독은 이름의 '백' 때문에 흰 소용돌이로만 보였다). 원래 상태이상 바닥을 먼저 깔고 그 위에 R105 장판을 그린다.
 if(typeof drawHazard==='function'){const base=drawHazard;drawHazard=function(h,...a){
  if(prefs.director&&h&&h.type==='field'&&(h.r61Field||h.r62Field)&&(h.r61Tag||h.r62Tag)){try{const under=Object.assign(Object.create(Object.getPrototypeOf(h)),h,{type:'r118-status-ground'});base.call(this,under,...a);stats.statusGround++;}catch(err){fail(err);}}
  return base.call(this,h,...a);};}

 // ---- ⑧ Drive 2026-10-29 '보스 회전 무기'·'7대죄 헬모드' 그림: 해당 보스가 순환 기술 중 하나로 자기 무기를 회전시켜 던진다 -------
 // 보라검천사=보라 검, 늪의 뿔악마 군주=피 묻은 식칼, 초천사의 웃는 가면=붉은 깃털, 루시퍼=깨진 가면 조각, 베엘제붑·폐기주방 감독=프라이팬,
 // 사탄=불타는 늑대·곰·용 현현(돌진). 피해는 보스 피해의 70%(현현 90%), 기존 적 투사체 판정(벽·회피·무적) 그대로.
 const WEAPONS={"violet-sword":["mb-dist01","spin","d139ea05aac3f09b1f8189e794d77b691ffe5cbf0b05578484e29af3bccf66fa"],"horn-cleaver":["mb-dist02","spin","536a7d76fa78e2ac56eb337104e4b0f85f8780cb5d77b463a127c5c8ed30c846"],"mask-feather":["mb-ep1a11","flutter","eaefc817a88cae18bcd0c078d91ace9ec625ee5a13346ca0c51550a8e36fce64"],"lucifer-shard":["a11-boss","spin","e10b719600589115eff61e78366f2fc2dfd5210977fa8e13444fd9fc3f73dcc3"],"glutton-core":["b04-boss","spin","54a3e068f076f9ce96834afb6db0e7383a96d58d31314e64834fe107dad151c2"],"wrath-wolf-manifest":["b07-boss","charge","f09498c6f8db7dd273afa1f3cf8e08bf3aa0bdb72255144b9880747c6e5de3bb"],"wrath-bear-manifest":["b07-boss","charge","f764effe6494318e8de99a33fc0f578f1b1ae86831ab5fddd5e5cc28d02e85e3"],"wrath-dragon-manifest":["b07-boss","charge","1b1943a2273aada91f09d47dc9fd882b1d3bb12be3c645c40daddfa44e4b2439"]};
 const WEAPON_DIR='assets/r118/drive/',byOwner=new Map();
 for(const[id,[owner,mode,hash]]of Object.entries(WEAPONS)){const path=WEAPON_DIR+id+'.png';if(!byOwner.has(owner))byOwner.set(owner,[]);byOwner.get(owner).push({id,path,mode});
  try{if(typeof imageInventory!=='undefined')imageInventory.add(path);if(typeof register==='function')register(path,'image','R118 Drive boss weapon');if(typeof portable!=='undefined'){portable.runtimeAssetHashes&&(portable.runtimeAssetHashes[path]=hash);portable.assetExists&&(portable.assetExists[path]=true);if(portable.assetMap?.assets&&!portable.assetMap.assets.some(a=>a.path===path))portable.assetMap.assets.push({path,sha256:hash,source:'R118 Drive boss weapon'});}}catch(err){fail(err);}}
 byOwner.set('mb-ep1b04',byOwner.get('b04-boss'));// 폐기주방 감독도 같은 주방의 프라이팬
 const weaponsOf=e=>byOwner.get(e?.nativeId)||byOwner.get(e?.r61CloneSource)||null;
 function loadWeapons(list){for(const w of list){try{if(!(typeof readyImage==='function'&&readyImage(w.path)?.image)&&typeof addImage==='function')addImage(w.path).promise?.catch?.(err=>fail(err));}catch(err){fail(err);}}}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(id,...a){try{const r=typeof regionById!=='undefined'?regionById[id]:null;if(r){const ids=[...(r.bosses||[]).map(b=>b.id),r.midboss?.id].filter(Boolean),paths=ids.flatMap(i=>(byOwner.get(i)||[]).map(w=>w.path));for(const p of paths)if(Array.isArray(r.paths)&&!r.paths.includes(p))r.paths.push(p);}}catch(err){fail(err);}return base.call(this,id,...a);};}
 function throwWeapon(e){const list=weaponsOf(e),F=window.__STORYWORLD_FIELDS_R61__;if(!list||!F?.beginMotion||typeof makeShot!=='function')return null;const s=boss.get(e)||{};
  const w=list[(s.weaponStep=(s.weaponStep||0)+1)%list.length];if(!(typeof readyImage==='function'&&readyImage(w.path)?.image)){loadWeapons(list);return null;}
  const charge=w.mode==='charge',a=F.beginMotion(e,'prop',{windup:charge?1.05:.85,recovery:.5,cooldown:6});if(!a)return null;
  a.onRelease=()=>{if(!liveFoe(e)||a.room!==room)return;const speed=charge?3.4:w.mode==='flutter'?5.2:4.6,angle=Math.atan2(player.y-.15-e.y,player.x-e.x),n=w.mode==='flutter'?3:1;
   for(let i=0;i<n;i++){const ang=angle+(i-(n-1)/2)*.2;const p=makeShot(e.x,e.y,ang,speed,Math.max(1,finite(e.damage))*(charge?.9:.7)/n*(n>1?1.6:1),{owner:e.id,asset:w.path,radius:charge?.5:.3,life:Math.min(3.4,11/speed),scale:1});
    if(p){p.r118Weapon={path:w.path,mode:w.mode,angle:ang,spin:(i%2?-1:1)*(charge?0:w.mode==='flutter'?0:11),size:charge?1.05:w.mode==='flutter'?.75:.95,start:now()};stats.weaponShots++;}}
   if(typeof sound==='function')try{sound('swMetal');}catch(_){}};
  return a;}
 if(typeof drawProjectile==='function'){const base=drawProjectile;drawProjectile=function(p,...a){const m=p?.r118Weapon;if(!m||typeof drawImage!=='function'||!(typeof readyImage==='function'&&readyImage(m.path)?.image))return base.call(this,p,...a);
  const paint=()=>{const q=project(p.x,p.y),im=readyImage(m.path).image,iw=im.naturalWidth||1,ih=im.naturalHeight||1,t=now()-m.start;
   // 무기는 긴 변을 영웅 키의 size배로, 현현(돌진 짐승)은 높이를 영웅 키의 size배로.
   const k=m.mode==='charge'?actorHeight()*m.size/ih:actorHeight()*m.size/Math.max(iw,ih),w=iw*k,h=ih*k;
   const v=project(p.x+Math.cos(m.angle),p.y+Math.sin(m.angle)),screen=Math.atan2(v.y-q.y,v.x-q.x);
   const ang=m.mode==='charge'?0:m.mode==='flutter'?screen+Math.sin(t*14)*.25:screen+t*m.spin,flip=m.mode==='charge'&&v.x<q.x;
   if(typeof shadow==='function')try{shadow(q.x,q.y,Math.max(w,h)*.22,{alpha:.18});}catch(_){}
   drawImage(m.path,q.x,q.y-actorHeight()*(m.mode==='charge'?.42:.4),w,h,{angle:ang,flip,blend:'source-over',alpha:.98});};
  try{return typeof ctx?.scope==='function'?ctx.scope({id:'r118:weapon:'+p.id,kind:'projectile',x:p.x,y:p.y,alive:false,lightShadowApproved:true},paint):paint();}catch(err){fail(err);return base.call(this,p,...a);}};}

 // ---- ③ 영웅 방향: 마지막 한 곳에서 정하기 --------------------------------------------------------
 const SEC={e:0,se:Math.PI/4,s:Math.PI/2,sw:3*Math.PI/4,w:Math.PI,nw:-3*Math.PI/4,n:-Math.PI/2,ne:-Math.PI/4};
 const FOUR={e:'right',ne:'right',se:'right',w:'left',nw:'left',sw:'left',n:'back',s:'front'};
 const SWORDS=new Set(['hwando','slayer']);
 const isoAngle=(dx,dy)=>Math.atan2((dx+dy)*.5,dx-dy);
 const near=a=>{let best='s',bd=Infinity;for(const k in SEC){const d=Math.abs(Math.atan2(Math.sin(a-SEC[k]),Math.cos(a-SEC[k])));if(d<bd){bd=d;best=k;}}return best;};
 const face={foe:null,sector:null,pend:null,pendAt:0,switchAt:0,fightAt:-99,fighting:false,hero:null,room:null};
 function pickFoe(){const list=room?.enemies||[],dist=e=>Math.hypot(e.x-player.x,e.y-player.y),t=now();
  const aimed=typeof target!=='undefined'&&target!=null?list.find(e=>e.id===target&&liveFoe(e)&&dist(e)<11):null;
  let cur=face.foe&&liveFoe(face.foe)&&list.includes(face.foe)&&dist(face.foe)<11?face.foe:null;
  if(aimed&&aimed!==cur&&(finite(player.attackAnim)>0||finite(player.skillAnim)>0))cur=aimed;
  let best=null,bd=9;for(const e of list){if(!liveFoe(e))continue;const q=dist(e);if(q<bd){bd=q;best=e;}}
  if(!cur)cur=aimed||best;else if(best&&best!==cur&&bd<dist(cur)*.55){if(!face.switchAt)face.switchAt=t;if(t-face.switchAt>.6){cur=best;face.switchAt=0;}}else face.switchAt=0;
  if(cur!==face.foe)stats.faceSwitches++;face.foe=cur;return cur;}
 function stableSector(foe){const a=isoAngle(foe.x-player.x,foe.y-player.y),t=now();if(!face.sector){face.sector=near(a);return face.sector;}
  const off=Math.abs(Math.atan2(Math.sin(a-SEC[face.sector]),Math.cos(a-SEC[face.sector])));
  if(off<=Math.PI/8+.26){face.pend=null;return face.sector;}
  const want=near(a);if(off>1.9){face.sector=want;face.pend=null;return want;}
  if(face.pend!==want){face.pend=want;face.pendAt=t;}if(t-face.pendAt>=.3){face.sector=want;face.pend=null;}return face.sector;}
 function inFight(foe){const t=now(),d=Math.hypot(foe.x-player.x,foe.y-player.y),act=finite(player.attackAnim)>0||finite(player.skillAnim)>0||finite(player.ultimateAnim)>0;
  if(act)face.fightAt=t;const autoOn=typeof auto!=='undefined'&&auto;
  face.fighting=face.fighting?(d<7.5||t-face.fightAt<1.4||autoOn&&d<10):(d<6||act||autoOn&&d<8.5);return face.fighting;}
 const heroApi=window.__STORYWORLD_CURRENT_HERO__;
 if(heroApi?.direction){const baseDir=heroApi.direction;window.__STORYWORLD_CURRENT_HERO__=Object.freeze({...heroApi,direction(p,state,fallback){
  const base=()=>baseDir.call(this,p,state,fallback);
  try{if(!prefs.facing||p!==player||!solo()||!playing()||['dash','hit'].includes(state)||window.__STORYWORLD_EGO151__?.inspect?.().state?.active)return base();
   if(face.hero!==p.hero||face.room!==room){face.hero=p.hero;face.room=room;face.foe=null;face.sector=null;face.pend=null;face.fighting=false;}
   const foe=pickFoe();if(!foe||!inFight(foe)){face.sector=null;return base();}
   const sec=stableSector(foe);stats.faced++;
   if(['attack','skill','ultimate'].includes(state)&&!SWORDS.has(p.hero))return sec;return FOUR[sec];
  }catch(err){fail(err);return base();}}});}

 // ---- ④ 렉: 프레임당 틱 상한, 보스 순환·전투 진행 틱 ---------------------------------------------
 // 원래 고리는 느린 프레임 뒤에 밀린 시간을 한 프레임에 최대 6틱까지 몰아 계산한다. 느린 기기에서는 이 몰아치기가 다음 프레임을
 // 더 느리게 만들어 렉이 눈덩이처럼 커진다. 한 프레임에 3틱(초당 20프레임까지는 제 속도)만 계산하고 나머지는 버린다.
 // 화면 고리(frame) 밖에서 직접 부르는 tick(검사·도구)은 묶지 않는다.
 let ticksThisFrame=0;const TICK_CAP=3;
 let inFrame=false;
 if(typeof frame==='function'){const base=frame;frame=function(...a){inFrame=true;ticksThisFrame=0;try{return base.apply(this,a);}finally{inFrame=false;if(ticksThisFrame>stats.maxTicksPerFrame)stats.maxTicksPerFrame=ticksThisFrame;}};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){if(inFrame){if(prefs.perf&&ticksThisFrame>=TICK_CAP){stats.ticksDropped++;return;}ticksThisFrame++;}const r=base.apply(this,a);try{directorTick();combatRunTick();}catch(err){fail(err);}return r;};}
 const resetting=base=>async function(...a){face.foe=null;face.sector=null;return base.apply(this,a);};
 if(typeof enterRegion==='function')enterRegion=resetting(enterRegion);
 if(typeof restoreSave==='function')restoreSave=resetting(restoreSave);
 // ---- ⑥ 영웅 기본 광역 -----------------------------------------------------------------------------
 const TRAIT={hwando:[1.0,1.0],slayer:[1.1,1.05],lauren:[1.05,1.0],neon:[.95,.95],seoha:[.85,1.1],gunner:[.8,1.15],hunter:[.9,1.05],michaela:[1.15,.9]};
 let splashing=false;
 function heroHit(source){if(source==null)return(finite(player?.attackAnim)>0||finite(player?.skillAnim)>0||finite(player?.ultimateAnim)>0)?'basic':null;
  if(typeof source!=='object')return null;if(source.r118Splash||source.kind==='narrative-companion-r75'||source.kind==='awakening-shock'||/samong|사몽/i.test(String(source.kind||'')))return null;
  if(source.friendly===false||source.enemy)return null;
  if(source.attackKind9==='skill'||source.kind==='story-wer'||source.kind==='hero-thread-dance-r63'||finite(player?.skillAnim)>0||finite(player?.ultimateAnim)>0)return(source.friendly||source.kind)?'skill':null;
  if(source.friendly||source.attackKind9==='basic')return'basic';return null;}
 function splashShape(kind){const tier=Math.max(0,Math.min(6,finite(window.__STORYWORLD_HERO_FX_R102__?.tier?.())));const lvl=Math.max(1,finite(player.level)||1);
  const ups=Object.values(player.upgrades||{}).reduce((s,v)=>s+(Number.isFinite(+v)?+v:0),0);const [tr,tf]=TRAIT[player.hero]||[1,1];
  const r=kind==='skill'?1.05+.17*tier+Math.min(.6,lvl*.012)+Math.min(.5,ups*.025):.7+.11*tier+Math.min(.45,lvl*.009)+Math.min(.35,ups*.02);
  const f=kind==='skill'?.34+.04*tier+Math.min(.12,lvl*.002):.2+.03*tier+Math.min(.12,lvl*.002);
  return{radius:r*tr,fraction:Math.min(.7,f*tf)};}
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){const r=base.call(this,e,value,source,...a);
  if(!r||splashing||!prefs.splash||!solo()||!playing()||!e||!Number.isFinite(value)||value<=0)return r;
  try{const kind=heroHit(source);if(!kind)return r;const {radius,fraction}=splashShape(kind),t=now();let n=0;const cap=kind==='skill'?10:6;
   splashing=true;try{for(const o of (room?.enemies||[]).slice()){if(o===e||!liveFoe(o))continue;if(Math.hypot(o.x-e.x,o.y-e.y)>radius+finite(o.radius)*.5)continue;if(t-finite(o.r118SplashAt)<.12)continue;
     o.r118SplashAt=t;const dmg=value*fraction;if(base.call(this,o,dmg,{r118Splash:true,friendly:true,kind:'hero-splash-r118',x:e.x,y:e.y})){stats.splashHits++;stats.splashDamage+=dmg;}if(++n>=cap)break;}}finally{splashing=false;}
  }catch(err){splashing=false;fail(err);}return r;};}

 // ---- ⑤ 길잡이: 전투 위주 자동 진행 -----------------------------------------------------------------
 let runAt=0;
 function combatRunTick(){if(!prefs.combatRun||!solo())return;const t=performance.now();if(t-runAt<200)return;runAt=t;
  if(typeof storyScene!=='undefined'&&storyScene&&typeof advanceScene==='function'){let n=0;while(storyScene&&n++<80){advanceScene();stats.scenesSkipped++;}}
  const P=window.__STORYWORLD_PROGRESSION_R71__;try{if(P?.difficultyState?.().open){const cur=P.difficultyState().selected||'normal';P.selectDifficulty?.(cur);P.confirmDifficulty?.();stats.difficultyAuto++;}}catch(err){fail(err);}
  if(typeof started!=='undefined'&&started&&player?.hp>0&&!(typeof loading!=='undefined'&&loading)){try{if(typeof guide!=='undefined'&&!guide)guide=true;if(typeof auto!=='undefined'&&!auto)auto=true;}catch(err){fail(err);}}}
 // 장면이 열리는 순간에도 바로 넘긴다(틱이 멈춘 패널 상태 포함).
 setInterval(()=>{try{if(prefs.combatRun&&typeof storyScene!=='undefined'&&storyScene)combatRunTick();}catch(err){fail(err);}},250);

 // ---- 설정: 간이설정에 R118 항목 -------------------------------------------------------------------
 const LABELS=[['combatRun','길잡이: 전투 위주 자동 진행 (서사 자동 넘김)'],['director','보스 여러 기술 순환 (독병·장판·환영·던지기)'],['splash','영웅 공격·스킬 기본 광역'],['facing','영웅 방향 안정 (도리도리 방지)'],['perf','렉 줄이기 (느릴 때 밀린 계산 몰아치기 제한)'],['balance','지역 순서 체력 곡선 (새로 들어가는 지역부터)']];
 function addSettings(){const q=document.getElementById('quickSettingsR114')||document.querySelector('#panel .settings');if(!q||document.getElementById('settingsR118'))return;
  const box=document.createElement('div');box.id='settingsR118';box.innerHTML='<h4 style="margin:.6em 0 .2em">전투·길잡이 (R118)</h4>'+LABELS.map(([k,l])=>'<label style="display:flex;gap:.4em;align-items:center;margin:.2em 0"><input type="checkbox" data-r118="'+k+'" '+(prefs[k]?'checked':'')+'> '+l+'</label>').join('');
  q.appendChild(box);box.querySelectorAll('[data-r118]').forEach(el=>el.onchange=()=>{set({[el.dataset.r118]:el.checked});if(el.dataset.r118==='combatRun'&&el.checked)try{guide=true;auto=true;}catch(_){}});}
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{addSettings();}catch(err){fail(err);}return r;};}

 window.__STORYWORLD_COMBAT_R118__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,hpCurve,splashShape:k=>playing()?splashShape(k):null,clean:()=>[...CLEAN],
  inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats,casts:{...stats.casts}},face:{sector:face.sector,fighting:face.fighting,foe:face.foe?.id||null},browser:false,GPU:false})});
})();
