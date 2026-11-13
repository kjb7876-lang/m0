// R950 — 최종보스 '교주의 사몽'(cult04, 스토리 층) 마무리(사용자 2026-11-12 "스토리모드 뒤쪽구간 실플레이및 개선작업 특히 최종보스").
//  헤드리스 실플레이로 찾은 것과 고친 것:
//  ① 체력: 사몽 각성 뒤 다시 서는 '되살아난 교주'(finalBoss 단계)는 원래 코드가 같은 교주의 체력 68% 에서 다시 시작하게 짜여 있다
//     (spawnCosmic3: e.hp=e.maxHp*.68). 그런데 1형태 교주는 이미 쓰러져 새 개체로 다시 만들어지고, 그 새 개체는 보스 소환 때의
//     체력 맞춤(R61·R63·R71)을 1형태와 다르게 받아 최대 체력 40,946(1형태 160,466 의 26%)에서 68% = 27,843 으로 시작했다.
//     그래서 마지막 결전이 1형태의 17% 체력 — 실플레이(헤드리스·Lv99)에서 7초 만에 끝났다. → 1형태가 실제로 받은 체력 값(최대 체력과
//     난이도·R71 표시 값)을 그대로 이어받고 원래 의도인 68% 에서 시작한다. 지배 연결(대수문장 6)·배양좌·1형태 체력은 그대로 둔다.
//  ② 정본 박자: 이 지역은 R450 박자 줄·R568 컷신 표에 없다. 1형태·지배 연결·최종 형태의 순간에 정본(story-canon-r106-data cult04)
//     문장 그대로 한 줄씩 띄운다(새 문장 없음, 낱말 조각으로 찾은 정본 문장 전체). R450 과 같은 자리·글꼴·막힘 조건.
//  ③ 연출(정본: 코어의 신경선이 교주를 꿰매 다시 세움 → 사몽 각성 → 지배 연결을 끊음 → 이번에는 신경선이 다시 꿰매지 못함):
//     · 지배 연결 단계: 제단(합일 코어)에서 남은 연결 수만큼 검붉은 신경선이 뻗어 맥동하고, 대수문장을 쓰러뜨릴 때마다 한 가닥이 끊긴다.
//     · 최종 형태 소환: 코어에서 교주에게 신경선이 뻗어 몸을 꿰매는 2.8초.
//     · 사몽 각성 뒤(player.finalAwakening) 영웅 발밑에 푸른 사몽 권한의 고리(정본 "푸른빛을 머금은 환도").
//     · 최종 처치: 신경선이 다시 뻗지만 닿지 못하고 부서져 떨어진다(2.6초). 마지막 서사 창은 엔진 그대로 곧바로 열린다(R81 계약).
//     신경선·고리는 R1002 부터 Dots 프레임 시트(CX-0088FB FB-01~06, finale-fx-r1002.js)로 그린다. 아래 코드 선 그림은 시트가 아직
//     안 읽혔거나 꺼져 있을 때만 쓰는 임시 대체다.
//  ④ 지배 연결 도중 남은 필드 잡몹이 죽으면 엔진이 단계를 'field' 로 덮어 다음 상호작용이 최종 결전을 건너뛰던 버그(공개 빌드 재현)를 막는다.
//  판정·AI·공격·서사 글·순서·보상은 바꾸지 않는다. DREAM 층·협동·맘몬은 손대지 않는다.
//  끄기: localStorage['storyworld.r950.finale']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_FINALE_R950__)return;
const REV='R950-finale-3',KEY='storyworld.r950.finale',REC_KEY='storyworld.r950.finale.rec',ZONE='cult04',LEADER='c104-boss',FINAL_FRAC=.68,LINKS=6;
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)prefs.on=false;}catch(_){}
const stats={hpFixed:0,hpNoRecord:0,recorded:0,beatsShown:0,beatsSkipped:0,beatsMissing:0,linkSnaps:0,stitch:0,unstitched:0,stageKept:0,draws:0,errors:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,240);};
const T=()=>typeof time==='number'?time:performance.now()/1e3;
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';}catch(_){return true;}};
const storyRoom=()=>{try{return typeof room!=='undefined'&&room&&room.id===ZONE&&!room.survivalR600/* R962: 무한 생존 cult04 무대는 같은 id·STORY 층이지만 스토리 방이 아니다 */&&(room.layer==='STORY'||room.layer==null)&&(typeof layer==='undefined'||layer==='STORY');}catch(_){return false;}};
const active=()=>prefs.on&&solo()&&storyRoom();
const live=e=>e&&e.hp>0&&!e.deadRecorded;
const leaderAlive=()=>(room.enemies||[]).find(e=>e&&e.nativeId===LEADER&&live(e))||null;
// ---- ① 체력: 1형태 값 기억 → 최종 형태에 이어받기 ----------------------------------------------------
const FIELDS=['maxHp','difficultyBaseHpR63','difficultyFactorR63','healthR71Adjusted','healthR71CanonicalBaseHp','healthR71CanonicalMaxHp','healthR71DifficultyFactor','healthR71VisibleMaxHp'];
const tierOf=()=>{try{return String(room.difficultyR63||'?');}catch(_){return'?';}};
function loadRecs(){try{const o=JSON.parse(localStorage.getItem(REC_KEY)||'null');return o&&typeof o==='object'?o:{};}catch(_){return{};}}
function remember(e){const snap={};for(const k of FIELDS)if(e[k]!==undefined)snap[k]=e[k];if(!(snap.maxHp>0))return;
 const prev=room.r950Rec;if(prev&&prev.maxHp===snap.maxHp)return;room.r950Rec=snap;stats.recorded++;
 try{const all=loadRecs();all[tierOf()]=snap;localStorage.setItem(REC_KEY,JSON.stringify(all));}catch(_){}}
function recFor(){return room.r950Rec||loadRecs()[tierOf()]||null;}
function fixFinal(){const e=leaderAlive();if(!e||e.r950Fixed)return;const rec=recFor();
 if(!rec||!(rec.maxHp>e.maxHp*1.01)){if(!rec)stats.hpNoRecord++;e.r950Fixed=true;return;}
 for(const k of FIELDS)if(rec[k]!==undefined)e[k]=rec[k];e.hp=e.maxHp*FINAL_FRAC;e.r950Fixed=true;stats.hpFixed++;}
// ---- ② 정본 박자 ----------------------------------------------------------------------------------------
const BEATS=Object.freeze({
 'boss-engage':'바닥의 방향부터 통째로',
 'boss-enrage':'교주의 형상에서 시선을 떼지 않으려',
 'cosmic-engage':'수문장들의 힘들이 그의 의지 하나에',
 'final-engage':'당황한 기색으로 다시 사몽의 힘을',
 'final-half':'두 개의 거대한 사몽 권한이 허공에서',
 'final-enrage':'따뜻한 응답에 맞춰 검을 크게'});
const cache=new Map();
function sentence(needle){if(cache.has(needle))return cache.get(needle);let out=null;
 try{const z=window.__STORYWORLD_STORY_CANON_R106__?.zones?.[ZONE];if(z)for(const b of z.blocks||[])for(const p of b.paras||[]){const flat=String(p).replace(/\s*\n\s*/g,' ');if(!flat.includes(needle))continue;
  for(const s of flat.split(/(?<=[.?!…])\s+/))if(s.includes(needle)){out=s.trim();break;}if(out)break;}}catch(e){fail(e);}
 if(!out)stats.beatsMissing++;cache.set(needle,out);return out;}
let el=null;function box(){if(el&&el.isConnected)return el;el=document.createElement('div');el.id='r950Beat';el.setAttribute('aria-live','polite');
 el.style.cssText='position:fixed;left:50%;bottom:25vh;transform:translateX(-50%);max-width:min(62vw,760px);padding:6px 18px;pointer-events:none;z-index:40;'+
  'font:500 15px/1.55 "Noto Serif KR","Nanum Myeongjo",serif;color:rgba(232,226,214,.92);text-align:center;word-break:keep-all;text-wrap:balance;letter-spacing:.01em;'+
  'text-shadow:0 1px 2px rgba(0,0,0,.95),0 0 12px rgba(0,0,0,.85);background:radial-gradient(ellipse at center,rgba(6,4,6,.55) 0%,rgba(6,4,6,0) 72%);opacity:0;transition:opacity .45s ease';
 try{if(matchMedia('(max-width:720px)').matches){el.style.fontSize='13px';el.style.maxWidth='86vw';el.style.bottom='30vh';}}catch(_){}
 document.body.appendChild(el);return el;}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;
 if(window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on)return true;if(document.getElementById('r568c')?.isConnected)return true;}catch(_){}return false;}
const queue=[];let cur=null;
function show(text){const b=box();b.textContent=text;b.style.opacity='1';const t=T();cur={start:t,until:t+4.2+Math.min(2.4,text.length*.03)};stats.beatsShown++;}
function pump(){const t=T();if(cur&&queue.length)cur.until=Math.min(cur.until,cur.start+2.2);/* 다음 박자가 기다리면 앞 줄을 일찍 접는다 */
 if(cur&&t>=cur.until){if(el)el.style.opacity='0';cur=null;return;}
 while(queue.length&&t-queue[0].at>6)queue.shift();if(!cur&&queue.length&&!blockedNow())show(queue.shift().text);}
function beat(name){const fired=room.r950Fired||(room.r950Fired=new Set());if(fired.has(name))return;fired.add(name);
 if(blockedNow()){stats.beatsSkipped++;return;}const text=sentence(BEATS[name]);if(text&&queue.length<2)queue.push({text,at:T()});}
function clearBeats(){queue.length=0;cur=null;if(el)el.style.opacity='0';}
function scanBeats(){const act=room.activeEncounter,e=leaderAlive();
 if(act==='boss'&&e&&e.spawnState==='active'&&room.engaged){beat('boss-engage');if(e.hp/e.maxHp<=.3)beat('boss-enrage');}
 if(act==='cosmic'&&room.engaged&&Number(room.cosmicIndex)===0&&(room.enemies||[]).some(x=>x.cosmic&&live(x)&&x.spawnState==='active'))beat('cosmic-engage');
 if(act==='finalBoss'&&e&&e.spawnState==='active'){beat('final-engage');const f=e.hp/e.maxHp;if(f<=.5)beat('final-half');if(f<=.25)beat('final-enrage');}}
// ---- ③ 연출 상태 -----------------------------------------------------------------------------------------
let fxs=[];// {kind:'snap'|'stitch'|'unstitch',t0,dur,x,y,i}
let seenCosmic=null,finalActor=null,finalDeadAt=null;
function core(){const o=room.objective;return o&&Number.isFinite(o.x)?{x:o.x,y:o.y}:{x:16,y:12};}
function linkEnd(i){const c=core(),a=-Math.PI/2+i*Math.PI*2/LINKS+.35;return{x:c.x+Math.cos(a)*3.4,y:c.y+Math.sin(a)*3.4};}
function linksShown(){if(!(room.finalStage>=2))return 0;const act=room.activeEncounter,st=room.encounterStage;
 if(act==='finalBoss'||st==='complete')return 0;return clamp(LINKS-Math.max(0,Number(room.cosmicIndex)||0),0,LINKS);}
function tickFx(){const t=V();fxs=fxs.filter(f=>f.room===room&&(t-f.t0<f.dur||(f.kind==='unstitch'&&frozen()&&(f.rep||0)<REPLAY)));
 const ci=Number(room.cosmicIndex)||0;if(seenCosmic===null||seenCosmic.room!==room)seenCosmic={room,v:ci};
 else if(ci>seenCosmic.v){for(let k=seenCosmic.v;k<ci&&k<LINKS;k++){const p=linkEnd(k);fxs.push({kind:'snap',t0:t,dur:1.1,x:p.x,y:p.y,i:k,room});stats.linkSnaps++;}seenCosmic.v=ci;}
 const e=room.activeEncounter==='finalBoss'?(room.enemies||[]).find(x=>x&&x.nativeId===LEADER&&(live(x)||x===finalActor)):null;
 if(e&&e!==finalActor&&live(e)){finalActor=e;finalDeadAt=null;fxs.push({kind:'stitch',t0:t,dur:2.8,x:e.x,y:e.y,actor:e,room});stats.stitch++;}
 if(finalActor&&finalDeadAt===null&&!live(finalActor)&&room.activeEncounter==='finalBoss'){finalDeadAt=t;fxs.push({kind:'unstitch',t0:t,dur:2.6,x:finalActor.x,y:finalActor.y,actor:finalActor,room});stats.unstitched++;}}
// ---- 그리기(코드 임시 연출) -------------------------------------------------------------------------------
const SENT={type:'r950-finale',x:0,y:0,age:0,life:Infinity};
function arm(on){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(on&&i<0){SENT.age=0;effects.push(SENT);}else if(!on&&i>=0)effects.splice(i,1);}catch(_){}}
const unit=()=>(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1);
// 소유자 이름: 교주 쪽 그림(신경선·코어)은 'r950:boss:…' — R350 '영웅 가림 옅게'는 그림 상자가 영웅을 덮으면 영웅 쪽 이펙트를 최대 85% 지우는데,
// 비스듬한 가닥은 상자가 커서 영웅이 근처에 서기만 해도 통째로 사라졌다(R1002 헤드리스 실측). 이름에 boss 가 있으면 적 쪽 위협 신호로 보고 지우지 않는다.
const scope=(id,x,y,fn,extra)=>{if(typeof ctx.scope==='function')ctx.scope({id,kind:'effect',x,y,r950:true,...(extra||{})},fn);else fn();};
// R1002 연출 시계: 서사 창·쪽지 창이 열려 게임 시간이 멈춘 동안에는 실제 시간으로 흐른다. 최종 처치 직후 마지막 서사 창이 곧바로 열려(R81 계약)
// '꿰매기 실패'가 첫 장에서 멈춘 채 끝나던 것을 창 뒤에서 이어지게 한다. 박자·판정은 게임 시간(T) 그대로.
const frozen=()=>{try{return !!((typeof storyScene!=='undefined'&&storyScene)||(typeof modal!=='undefined'&&modal));}catch(_){return false;}};
let vc=0,vcGame=null,vcReal=0;
function V(){const g=T(),r=typeof performance!=='undefined'&&performance.now?performance.now()/1e3:0;if(vcGame===null){vcGame=g;vcReal=r;vc=g;return vc;}
 const dg=g-vcGame,dr=r-vcReal;vcGame=g;vcReal=r;if(dg>1e-9)vc+=dg;else if(dg===0&&frozen())vc+=clamp(dr,0,.1);return vc;}
const REPLAY=2,REPLAY_GAP=2.2;// 창이 열려 있는 동안 꿰매기 실패를 두 번 더(사이 2.2초) — 글을 읽다 눈을 돌려도 보이게
function hash(i){let s=(i*2654435761)>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let q=Math.imul(s^(s>>>15),s|1);q^=q+Math.imul(q^(q>>>7),q|61);return((q^(q>>>14))>>>0)/4294967296;};}
// 신경선 한 가닥: a→b 화면 좌표, 0..reach 만큼, 시간 흔들림, 세 겹(검은 겉·검붉은 살·뜨거운 심)
function nerve(a,b,reach,t,seed,alpha,u){const r=hash(seed),bend=(r()-.5)*1.6,ph=r()*6.28,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
 const N=14,pts=[];for(let k=0;k<=N;k++){const s=k/N*reach,w=Math.sin(s*Math.PI)*(bend*u*.9+Math.sin(t*3.1+ph+s*7)*u*.12);pts.push({x:a.x+dx*s+nx*w,y:a.y+dy*s+ny*w-Math.sin(s*Math.PI)*u*.55});}
 const line=(wd,col,al)=>{ctx.globalAlpha=al*alpha;ctx.strokeStyle=col;ctx.lineWidth=wd;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let k=1;k<pts.length;k++)ctx.lineTo(pts[k].x,pts[k].y);ctx.stroke();};
 line(Math.max(2.5,u*.2),'#0d0306',.85);line(Math.max(1.6,u*.11),'#6e0f1d',.95);line(Math.max(.8,u*.045),'#ff5468',.55+.35*Math.sin(t*6+ph));
 return pts;}
// R1002: Dots 시트 그리기(없거나 꺼졌으면 null → 아래 코드 그림). 몸 화면 키는 엔진 drawEnemy 와 같은 식.
const fx=()=>{try{const f=window.__STORYWORLD_FINALE_FX_R1002__;return f&&f.on()?f:null;}catch(_){return null;}};
function bodyH(e,u){let h=u*3.4;try{const r=e?.combatProfile?.spriteRect?.height;if(typeof actorHeight==='function'&&r>0)h=actorHeight()*r*(e.defScale||1);}catch(_){}return clamp(h,u*2.2,u*5);}
const ringOn=()=>!!(player&&player.finalAwakening&&player.hp>0&&room.encounterStage!=='complete');
function drawAll(){const t=V(),u=unit(),c=core(),cq=project(c.x,c.y),FX=fx(),TH=u*.62,coreOn=!!(FX&&room.finalStage>=2&&FX.ready('core')),cs={x:cq.x,y:cq.y-u*(coreOn?3.35:.9)};stats.draws++;
 ctx.save();
 // 지배 연결(남은 가닥)
 const n=linksShown(),ci=Number(room.cosmicIndex)||0;
 if(n>0)scope('r950:boss:links',c.x,c.y,()=>{for(let k=ci;k<LINKS;k++){const p=linkEnd(k),q=project(p.x,p.y),end={x:q.x,y:q.y-u*1.4};
  if(FX&&FX.link(cs,end,t,k,TH,.96))continue;
  const pts=nerve(cs,end,1,t,101+k,.78,u);const e=pts[pts.length-1];
  ctx.globalAlpha=.9;ctx.fillStyle='#14040a';ctx.beginPath();ctx.arc(e.x,e.y,u*.16,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.55+.3*Math.sin(t*4+k);ctx.strokeStyle='#c22a3c';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(e.x,e.y,u*.16,0,Math.PI*2);ctx.stroke();}
  // 코어 맥동
  if(!coreOn){ctx.globalAlpha=.35+.2*Math.sin(t*3.2);ctx.fillStyle='#7a1022';ctx.beginPath();ctx.ellipse(cs.x,cs.y,u*.42,u*.3,0,0,Math.PI*2);ctx.fill();}});
 for(const f of fxs){let el=t-f.t0;
  if(el>=f.dur){if(f.kind==='unstitch'&&frozen()&&(f.rep||0)<REPLAY&&el>=f.dur+REPLAY_GAP){f.rep=(f.rep||0)+1;f.t0=t;el=0;}else continue;}
  const k=el/f.dur;
  if(f.kind==='snap')scope('r950:boss:snap:'+f.i,f.x,f.y,()=>{const q=project(f.x,f.y),end={x:q.x,y:q.y-u*1.4},mid={x:(cs.x+end.x)/2,y:(cs.y+end.y)/2-u*.5},a=1-k;
   if(FX&&FX.snap(cs,end,el,TH,1))return;
   // 끊긴 두 토막이 양쪽으로 말려 들어감 + 끊긴 자리 불티
   nerve(cs,mid,clamp(1-el*1.6),t,101+f.i,a*.9,u);nerve(end,mid,clamp(1-el*1.6),t,301+f.i,a*.9,u);
   const r=hash(900+f.i);ctx.lineCap='round';for(let s=0;s<9;s++){const ang=r()*6.28,sp=(.6+r()*1.4)*u*1.3,d=sp*Math.min(1,el*2.4);ctx.globalAlpha=a*.9;ctx.strokeStyle=s%3?'#ffb09a':'#ff4a5e';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(mid.x+Math.cos(ang)*d*.55,mid.y+Math.sin(ang)*d*.55+el*el*u*1.2);ctx.lineTo(mid.x+Math.cos(ang)*d,mid.y+Math.sin(ang)*d+el*el*u*1.6);ctx.stroke();}
   ctx.globalAlpha=a*.6;ctx.fillStyle='#ffd2c0';ctx.beginPath();ctx.arc(mid.x,mid.y,u*.12*(1-k),0,Math.PI*2);ctx.fill();});
  if(f.kind==='stitch')scope('r950:boss:stitch',f.x,f.y,()=>{const e=f.actor,q=project(e.x,e.y),body={x:q.x,y:q.y-u*1.5},reach=clamp(el/.8),a=k<.75?1:1-(k-.75)/.25;
   if(FX&&FX.ready('stitch')&&FX.ready('link')){const fa=k<.82?1:clamp(1-(k-.82)/.18);/* 코어에서 발밑까지 한 가닥(0.6초) → 발밑에서 몸 높이까지 꿰맴(16장, 초당 10장) → 사그라듦 */
    scope('r950:boss:stitch-root',c.x,c.y,()=>{FX.link(cs,{x:q.x,y:q.y-u*.25},t,0,TH,fa,clamp(el/.6));});
    if(el>=.6)FX.stitch(q.x,q.y,el-.6,bodyH(e,u),fa);return;}
   for(let s=0;s<5;s++){const tgt={x:body.x+(s-2)*u*.22,y:body.y+(s%2?-1:1)*u*.25};nerve(cs,tgt,reach,t,500+s,a,u);}
   if(reach>=1){const st=clamp((el-.8)/1.2);ctx.strokeStyle='#ff5468';ctx.lineWidth=1.4;ctx.lineCap='round';
    for(let s=0;s<6;s++){if(s/6>st)break;const y=body.y-u*.9+s*u*.34,x=body.x+Math.sin(s*1.7)*u*.12;ctx.globalAlpha=a*.85;ctx.beginPath();ctx.moveTo(x-u*.16,y-u*.08);ctx.lineTo(x+u*.16,y+u*.08);ctx.moveTo(x-u*.16,y+u*.08);ctx.lineTo(x+u*.16,y-u*.08);ctx.stroke();}}});
  if(f.kind==='unstitch')scope('r950:boss:unstitch',f.x,f.y,()=>{const q=project(f.x,f.y),body={x:q.x,y:q.y-u*.9};
   // 뻗다가 65% 에서 멈칫(떨림) → 토막 나 떨어지며 사그라듦
   const grow=clamp(el/.7)*.65,brk=el>1.05,a=brk?clamp(1-(el-1.05)/1.5):1;
   if(FX&&FX.ready('unstitch')&&FX.ready('link')&&FX.ready('snap')){const tgt={x:q.x,y:q.y-u*.25};/* 코어 쪽 가닥은 65% 에서 멈칫 떨다 끊어지고, 쓰러진 자리의 다섯 가닥은 뻗다 부서져 내린다 */
    scope('r950:boss:unstitch-root',c.x,c.y,()=>{if(!brk){const tr=el>.7?Math.sin(t*40)*u*.05:0;FX.link({x:cs.x+tr,y:cs.y},tgt,t,0,TH,1,grow);}
     else FX.snap(cs,{x:cs.x+(tgt.x-cs.x)*.65,y:cs.y+(tgt.y-cs.y)*.65},el-1.05,TH,1);});
    if(el>=.3)FX.unstitch(q.x,q.y,el-.3,bodyH(f.actor,u),1);return;}
   for(let s=0;s<5;s++){const tgt={x:body.x+(s-2)*u*.26,y:body.y};
    if(!brk){const tr=el>.7?Math.sin(t*40+s)*u*.05:0;nerve({x:cs.x+tr,y:cs.y},tgt,grow,t,700+s,1,u);}
    else{const pts=nerve(cs,tgt,.65,t,700+s,0,u),fall=(el-1.05);ctx.lineCap='round';
     for(let g=0;g<pts.length-1;g+=2){const r=hash(800+s*20+g),dy=fall*fall*u*(2.2+r()*2),dx=(r()-.5)*fall*u*1.2,p0=pts[g],p1=pts[g+1];
      ctx.globalAlpha=a*.85;ctx.strokeStyle='#3a0a12';ctx.lineWidth=Math.max(1.6,u*.1);ctx.beginPath();ctx.moveTo(p0.x+dx,p0.y+dy);ctx.lineTo(p1.x+dx,p1.y+dy);ctx.stroke();
      ctx.globalAlpha=a*.5;ctx.strokeStyle='#ff5468';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p0.x+dx,p0.y+dy);ctx.lineTo(p1.x+dx,p1.y+dy);ctx.stroke();}}}});}
 // 사몽 권한의 푸른 고리(각성 뒤, 지역이 끝나기 전까지)
 // 합일 코어(R1002 시트): 사몽 각성 뒤 제단 위에 떠서 뛴다. 가닥들의 뿌리를 덮도록 가닥 뒤에 그린다.
 if(coreOn)scope('r950:boss:core',c.x,c.y,()=>{FX.core(cq.x,cq.y-u*2.2,t,u*2.3,.97);});
 // 사몽 고리(R1002 시트): 바닥에 붙은 그림(groundAligned)이라 영웅 발밑에 깔리고 R350 이 지우지 않는다
 if(ringOn()&&FX&&FX.ready('ring'))scope('r950:aura',player.x,player.y,()=>{const q=project(player.x,player.y);FX.ring(q.x,q.y,t,u*1.6,.95);},{groundAligned:true});
 else if(ringOn())scope('r950:aura',player.x,player.y,()=>{const q=project(player.x,player.y),pul=.5+.5*Math.sin(t*2.4);
  ctx.globalAlpha=.26+.1*pul;ctx.fillStyle='#4f8fff';ctx.beginPath();ctx.ellipse(q.x,q.y,u*1.7,u*.85,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.3;ctx.strokeStyle='#2c63d8';ctx.lineWidth=Math.max(2.5,u*.12);ctx.beginPath();ctx.ellipse(q.x,q.y,u*(1.45+.08*pul),u*(.72+.04*pul),0,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=.75+.2*pul;ctx.strokeStyle='#d7ebff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q.x,q.y,u*(1.45+.08*pul),u*(.72+.04*pul),0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#eaf4ff';for(let s=0;s<6;s++){const a2=t*.9+s*Math.PI/3;ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(q.x+Math.cos(a2)*u*1.45,q.y+Math.sin(a2)*u*.72,Math.max(2,u*.07),0,Math.PI*2);ctx.fill();}});
 ctx.restore();ctx.globalAlpha=1;}
// ---- 마지막 서사: 엔진 계약(R81 finale-contracts — 최종 처치 직후 post·finale.core-preserved 가 곧바로 줄에 선다)을 지키려고 미루지 않는다.
//      무너짐(꿰매기 실패) 연출은 처치 순간부터 서사 창 뒤에서 이어진다.
// ---- 설치 --------------------------------------------------------------------------------------------------
if(typeof window.spawnCosmic3==='function'){const base=window.spawnCosmic3;window.spawnCosmic3=function(...a){const r=base.apply(this,a);try{if(active()&&room.activeEncounter==='finalBoss')fixFinal();}catch(e){fail(e);}return r;};}
// ④ 단계 지키기(공개 빌드 헤드리스 재현): 엔진 advanceFieldWave6 은 필드 잡몹 웨이브의 마지막 한 마리가 죽을 때마다 단계를 'field'/'fieldReady' 로 덮는다.
//    지배 연결(cosmic) 도중 남은 잡몹이 죽으면 단계가 'field' 가 되고, 다음 제단 상호작용이 남은 연결·최종 결전을 건너뛰고 마지막 서사로 지역을 끝냈다.
//    교주의 사몽(스토리 층)에서 보스 단계가 진행 중(activeEncounter 가 있음)일 때만 그 덮어쓰기를 되돌린다. 웨이브 번호·잡몹 처치 기록은 그대로 둔다.
const HOLD=new Set(['bossReady','midbossReady','trialReady','cosmicReady','personaReady','summoning','active','complete']);
if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(enemy,...a){let keep=null;try{if(active()&&room.activeEncounter&&HOLD.has(room.encounterStage))keep={room,stage:room.encounterStage};}catch(e){fail(e);}
 const r=base.call(this,enemy,...a);
 try{if(keep&&room===keep.room&&(room.encounterStage==='field'||room.encounterStage==='fieldReady')&&room.encounterStage!==keep.stage){room.encounterStage=keep.stage;stats.stageKept++;}}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT||e?.type==='r950-finale'){try{if(active())drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
let lastRoom=null;
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof room!=='undefined'&&room!==lastRoom){lastRoom=room;clearBeats();fxs=[];seenCosmic=null;finalActor=null;finalDeadAt=null;}
  if(active()){const e=leaderAlive();if(room.activeEncounter==='boss'&&e&&e.spawnState==='active')remember(e);
   if(room.activeEncounter==='finalBoss')fixFinal();/* 저장에서 되살린 최종 형태도 */
   scanBeats();tickFx();fx()?.warm();arm(linksShown()>0||fxs.length>0||!!player?.finalAwakening);}else arm(false);
  pump();}catch(e){fail(e);}return r;};}
function set(o){if(o&&typeof o.on==='boolean'){prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify({on:o.on}));}catch(_){}if(!o.on){clearBeats();arm(false);}}return{...prefs};}
window.__STORYWORLD_FINALE_R950__=Object.freeze({revision:REV,BEATS,set,sentence,
 beatTexts:()=>Object.fromEntries(Object.entries(BEATS).map(([k,v])=>[k,sentence(v)])),
 inspect:()=>({revision:REV,on:prefs.on,active:active(),stats:{...stats},fx:fxs.map(f=>f.kind),links:typeof room!=='undefined'&&room?linksShown():0,rec:typeof room!=='undefined'&&room?recFor():null,lastError,browserVerified:false,GPUVerified:false})});
})();
