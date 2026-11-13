// R1010 — 무한생존 미카엘라 결전과 엔딩(사용자 2026-11-13 06:58Z "무한생존 사몽역행 미카엘라 엔딩까지 구현",
//  08:23Z 결정 카드 "원문대로 매듭 4개 끊기"·"엔딩 뒤 결과 창", 08:24Z "음성없는곳은 향후 생성할 예정 보류",
//  08:25Z "영화모드,스토리모드,무한생존모드 기본적인건 모두 공유하는거야 플레이 방식만 상이한거고").
//  · 연결: 무한생존 사몽 M 단계(R1006)가 몹 물결을 다 잡은 자리에서 begin() 을 부른다. true 면 그 뒤 진행은 R1010 이 맡는다.
//  · 대면: 스토리 모드 sz115-M-1 과 같은 원문(cue·bossCue)을 생존 서사 자막(R600 narrate, 녹음 없으면 글만)으로 흘리며 바로 결전에 들어가고, 미카엘라(스토리와 같은 기증 배우 kair02 kair-great-03)를 세운다.
//    미카엘라는 처치하지 않는다 — 체력은 최대 70% 아래로 내려가지 않고(스토리 solve.floor), 0 으로 가는 길이 없다(killEnemy 도 막음).
//  · 매듭 4개: 스토리 M-1 진술 4개(R105 기록 표식 원문) 그대로, 차례대로 C(터치: 상호작용 단추)로 끊는다. 생존 규칙대로 몹 물결(R600 tickSpawn 그대로)과 정화 코어는 계속 돈다.
//    매듭을 끊는 동안 영웅이 쓰러지거나 코어가 부서지면 생존 모드의 기존 패배 결과 창으로 간다.
//  · 엔딩: 4개를 다 끊으면 스토리 sz115 M-2·M-3·M-4 원문(M2·M3·종장 전부) → R103 진료기록 창 → 에필로그(R103 record 그대로) → 결과 창(다시 도전 / 처음 화면).
//  · 음성: 서사 창은 스토리와 같은 playScenes·같은 장면 키라 녹음이 생기면 그대로 붙는다. 지금은 녹음이 없어 자막(글)만 — 브라우저 음성 합성 같은 대체 음성은 넣지 않는다.
//  · 그림: 매듭 표식은 기존 자산 assets/r105/drive/fx-thread.webp(붉은 실 매듭) 한 장. 새 그림·큰 그림 일괄 로딩 없음.
//  끄기: 없음(begin 이 불리지 않으면 아무것도 바꾸지 않는다).
(()=>{'use strict';
if(window.__STORYWORLD_SURVIVAL_FINALE_R1010__)return;
const REV='R1010-finale-1',ZONE='sz115-M-1',ENDING_ZONES=Object.freeze(['sz115-M-2','sz115-M-3','sz115-M-4']),DONOR=Object.freeze(['kair02','kair-great-03']),NAME='미카엘라';
const KNOT_ART='assets/r105/drive/fx-thread.webp',KNOT_R=5,REACH=1.9,FLOOR=.7,M_OFFSET=7,RECOVER_MS=700,WAVE_EVERY=.35;
const stats={begins:0,refused:0,knots:0,outOfOrder:0,waveSpawned:0,blockedKills:0,blockedHp:0,endings:0,records:0,results:0,again:0,title:0,recover:0,nanDraw:0,stops:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fin=(...a)=>a.every(Number.isFinite);
const SV=()=>window.__STORYWORLD_SURVIVAL_R600__,ZN=()=>window.__STORYWORLD_SAMONG_ZONES_R115__,SM=()=>window.__STORYWORLD_SAMONG_R103__,MP=()=>window.__STORYWORLD_SAMONG_MAPS_R105__;
const zoneDef=id=>G(()=>ZN().zone(id),null);
const keyName=()=>G(()=>KR291.i,'C')||'C';
const useName=()=>G(()=>document.body.classList.contains('mobile-live-r63'),false)?'상호작용':keyName();/* 모바일은 C 키 대신 상호작용 단추 */
const keyText=t=>String(t||'').replace(/(^|[^A-Za-z0-9])E(?![A-Za-z0-9])/g,'$1'+keyName());/* R115 keyText 와 같은 규칙 */

// ── 순수 함수(CPU 검사가 부른다) ──
// 매듭은 차례대로(스토리 M-1 '진술은 차례대로'), 전부 끊어야 끝난다.
function knotUse(cut,idx,total){const c=Math.max(0,Math.floor(+cut)||0),i=Math.floor(+idx),N=Math.max(0,Math.floor(+total)||0);
 if(!N||!Number.isFinite(i)||i<0||i>=N)return {ok:false,why:'none',cut:c};if(c>=N)return {ok:false,why:'done',cut:c};
 if(i<c)return {ok:false,why:'cut',cut:c};if(i>c)return {ok:false,why:'order',cut:c,want:c};const n=c+1;return {ok:true,cut:n,done:n>=N};}
// 매듭 자리: 미카엘라 둘레에 고르게(스토리는 2.094 간격이라 1·4번이 겹쳤다), 무대 안쪽으로.
function knotPoints(c,n,r,A){const out=[],k=Math.max(0,Math.floor(+n)||0);for(let i=0;i<k;i++){const a=-Math.PI/2+i*Math.PI*2/k;
 out.push({x:clamp(c.x+Math.cos(a)*r,A.x0+.8,A.x1-.8),y:clamp(c.y+Math.sin(a)*r,A.y0+.8,A.y1-.8)});}return out;}
// 미카엘라 체력: 매듭이 남은 동안은 최대 체력의 frac 아래로 못 내리고, 풀린 뒤에는 깎이지 않는다. NaN·Infinity 무시. 0 으로 가는 길이 없다.
function guardHp(e,frac,released){let v=Math.max(1,+e.hp||0);const floor=()=>Math.max(1,(+e.maxHp>0?+e.maxHp:v)*frac);
 Object.defineProperty(e,'hp',{configurable:true,enumerable:true,get(){return v;},set(n){n=+n;if(!Number.isFinite(n))return;if(n>=v){v=n;return;}
  if(released()){stats.blockedHp++;return;}const f=floor();if(n<f)stats.blockedHp++;v=Math.max(f,n);}});return e;}
// 원문 장면(스토리 sz115 구역 자료와 R115 scenesFor 그대로 — 글을 새로 쓰지 않는다).
const scenesOf=(z,list,tag)=>G(()=>ZN().scenesFor((list||[]).filter(Boolean),z,tag),[])||[];
function confrontScenes(){const z=zoneDef(ZONE);if(!z)return[];return[...scenesOf(z,z.cue,'cue'),...scenesOf(z,[z.bossCue],'boss')];}
function knotRecords(){const z=zoneDef(ZONE);return (z?.solve?.statements||[]).map(s=>({key:s.key,sub:s.sub,i:s.i,n:s.n||1,label:s.label}));}
function endingScenes(){const out=[];for(const id of ENDING_ZONES){const z=zoneDef(id);if(!z)continue;out.push(...scenesOf(z,z.cue,'cue'),...scenesOf(z,z.clues,'all'),...scenesOf(z,z.after,'after'));}return out;}

// ── 상태 ──
let F={active:false,phase:'idle',cut:0,released:false};const log=[];
const mark=ph=>{F.phase=ph;F.phaseWall=performance.now();log.push(ph);if(log.length>60)log.shift();};
const here=()=>!!F.active&&!!G(()=>SV().here(),false)&&G(()=>room,null)===F.room;
const mich=()=>G(()=>room.enemies.find(e=>e&&e.r1010Michaela),null);
const solve=()=>zoneDef(ZONE)?.solve||{};

function template(r){const R=r?.survivalR600?.roster;if(R?.finaleBoss?.profile)return R.finaleBoss;
 const t=G(()=>makeRoom(DONOR[0],'STORY'),null);return (t?.enemies||[]).find(e=>e&&e.nativeId===DONOR[1]&&e.profile)||null;}
function profilePaths(src){const out=new Set(),d=src?.profile;if(!d)return[];if(d.path)out.add(d.path);for(const g of [d.frames,d.actions,d.phaseSprites5])for(const f of Object.values(g||{}))if(f?.path)out.add(f.path);if(src.path)out.add(src.path);return[...out];}

function begin(ctx){try{
 if(F.active)return true;const Z=SV();if(!Z||!Z.here||!Z.here()){stats.refused++;return false;}const st=Z.state();if(!st||st.over){stats.refused++;return false;}
 const r=room,x=r.survivalR600;if(!x||!zoneDef(ZONE)){stats.refused++;return false;}const src=template(r);if(!src){stats.refused++;return false;}
 const A=x.arena,c=x.centre,mp={x:clamp(c.x,A.x0+2,A.x1-2),y:clamp(c.y-M_OFFSET,A.y0+KNOT_R+1.5,A.y1-2)},def=G(()=>regionById[r.id],null);
 // 미카엘라를 같은 틱에 세운다 — 살아 있는 적이 있으면 R600 이 빈 방으로 보고 다음 지역으로 넘기지 않는다(R1006 handoff 가 없어도 안전).
 let e=null;try{e=actor3(src.profile,'r1010:'+r.id+':michaela',mp.x,mp.y,true,'STORY',def,false);}catch(err){fail(err);}
 if(!e){stats.refused++;return false;}
 const atk=G(()=>Math.max(8,Number(attackPower())||40),40),B=G(()=>Z.pure.bossStats(st.i,st.loop,st.diff,atk,true,e.damage,atk),null);
 e.nativeId=src.nativeId;e.name=NAME;e.r1010Michaela=true;e.survivalR600=true;e.r600Boss=true;e.r61PreserveHealth=true;e.r61PreserveDamage=true;e.spawnState='active';e.homeX=mp.x;e.homeY=mp.y;e.explorationLeash=null;
 if(B&&fin(B.hp,B.dmg)){e.maxHp=B.hp;e.hp=B.hp;e.damage=B.dmg;}if(!(e.maxHp>0))e.maxHp=Math.max(1,+e.hp||1);
 e.phaseStage='active';e.phaseAge=0;e.rest=1.2;e.cd=1.5;e.graceUntil=G(()=>time,0)+1.2;if(e.combatProfile)e.combatProfile={...e.combatProfile,aggro:80};
 guardHp(e,FLOOR,()=>!!e.r1010Released);r.enemies.push(e);r.engaged=true;
 const recs=knotRecords(),pts=knotPoints(mp,recs.length,KNOT_R,A);
 const knots=recs.map((k,i)=>({id:'r1010:knot:'+i,x:pts[i].x,y:pts[i].y,solid:false,visible:true,autoTargetEligible6:false,label:k.label,r1010Knot:i,r105Record:{key:k.key,sub:k.sub,i:k.i,n:k.n,label:k.label}}));
 r.props.push(...knots);
 try{const p=[...profilePaths(src),KNOT_ART];if(typeof ensureImages==='function')Promise.resolve(ensureImages(p)).catch(()=>{});}catch(err){fail(err);}
 F={active:true,phase:'',room:r,stageId:String(ctx?.stageId||r.id),cut:0,released:false,knots,hero:st.hero||G(()=>player.hero,'hwando'),diff:st.diff||'normal',waveAt:0,hintAt:-9,beganAt:G(()=>time,0)};
 stats.begins++;mark('confront');try{toast(NAME+' · '+keyText(solve().unlock||'처치하지 않습니다'),3.6);sound?.('boss');}catch(_){}
 /* 대면 원문(M1 cue·bossCue)은 생존 서사처럼 자막으로 흘리고 전투는 바로 이어 간다 — 생존 모드의 서사 방식. 녹음이 생기면 R381 이 같은 문장으로 튼다. */
 F.narrated=G(()=>Z.narrate(confrontScenes(),{noTts:true}),0)||0;toFight();hud();return true;}catch(err){fail(err);return false;}}

// 서사 창: 스토리와 같은 길(R115 play → playScenes). 이미 서사가 흐르면 뒤에 붙인다.
function play(list,after){try{const P=ZN()?.play;if(P)return P(list,after);if(!list.length){after?.();return true;}playScenes(list,after);return true;}catch(e){fail(e);after?.();return false;}}
function toFight(){if(!F.active)return;mark('fight');hint(true);}
function hint(force){const t=G(()=>time,0);if(!force&&t-F.hintAt<8)return;F.hintAt=t;try{toast(keyText(solve().hint||'둘레의 매듭을 차례대로 끊으세요.'),4);}catch(_){}}

// 매듭 끊기
function nearKnot(){let best=null,bd=1e9;for(const k of F.knots){const d=Math.hypot(k.x-player.x,k.y-player.y);if(d<REACH&&d<bd){best=k;bd=d;}}return best;}
function useKnot(k){const r=knotUse(F.cut,k.r1010Knot,F.knots.length),word=solve().word||'매듭';
 if(!r.ok){if(r.why==='order'){stats.outOfOrder++;try{toast(word+'은 차례대로 끊습니다 · '+(F.knots[r.want]?.label||''),3);}catch(_){}}else if(r.why==='cut'){try{toast('이미 끊은 '+word+'입니다.',2);}catch(_){}}return true;}
 F.cut=r.cut;k.r1010Cut=true;stats.knots++;mark('cutting');try{sound?.('clear');}catch(_){}
 const after=()=>afterCut(r.done);let opened=false;
 try{opened=MP()?.use?.(k)===true;}catch(e){fail(e);}/* 스토리 M-1 진술과 같은 R105 기록 표식 창(원문) */
 if(opened&&G(()=>storyScene,null)&&!G(()=>storyQueue.length,0)){try{const prev=storyDone;storyDone=()=>{try{prev?.();}finally{after();}};}catch(e){fail(e);after();}}
 else after();return true;}
function afterCut(done){if(!F.active||F.phase!=='cutting')return;if(done){release();return;}mark('fight');try{toast((solve().word||'매듭')+' '+F.cut+' / '+F.knots.length,2.2);}catch(_){}}
function release(){const m=mich();F.released=true;mark('released');
 if(m){m.r1010Released=true;m.damage=0;m.cd=999;m.speed=0;m.attack=null;m.rangedWindup=0;}
 try{room.enemies=room.enemies.filter(e=>e&&e.r1010Michaela);room.engaged=false;if(Array.isArray(hazards))hazards.length=0;}catch(e){fail(e);}/* 결전 끝: 남은 잔영은 걷히고, 풀린 미카엘라는 더 맞지 않는다 */
 try{toast(solve().done||'',3.2);}catch(_){}
 stats.endings++;mark('ending');play(endingScenes(),toRecord);}
function toRecord(){if(!F.active)return;stats.records++;mark('record');try{const R=SM();if(R&&typeof R.record==='function'){R.record(toResult);return;}}catch(e){fail(e);}toResult();}
function toResult(){if(!F.active)return;stats.results++;mark('result');resultPanel();}
function resultPanel(){try{const st=G(()=>SV().state(),{})||{},secs=Math.max(0,Math.floor(+st.secs||0)),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const ep=G(()=>SM().episodes.find(e=>e.key==='M'),null),title=ep?.title||'',chap=ep?.chapter||'';
 openPanel('<div class="eyebrow">무한 생존 · 기록 · '+esc(chap)+'</div><h2>'+esc(title)+'</h2>'+
  '<p>'+((+st.loop||0)?((+st.loop)+1)+'회차 · ':'')+'끝까지 · 처치 '+(+st.kills||0)+' · 생존 레벨 '+(+st.lv||1)+' · '+Math.floor(secs/60)+'분 '+(secs%60)+'초 · '+esc(NAME)+' 처치하지 않음 · '+esc(solve().word||'매듭')+' '+F.cut+' / '+F.knots.length+'</p>'+
  '<div class="actions"><button id="r1010Again" class="primary">다시 도전</button><button id="r1010Title">처음 화면</button></div>');
 const again=document.getElementById('r1010Again'),ttl=document.getElementById('r1010Title'),hero=F.hero,diff=F.diff;
 if(again)again.onclick=()=>{stats.again++;stop();try{closePanel(true);}catch(_){}try{SV().start(hero,diff);}catch(e){fail(e);}};
 if(ttl)ttl.onclick=()=>{stats.title++;stop();try{closePanel(true);}catch(_){}try{showTitle();}catch(e){fail(e);}};}catch(e){fail(e);}}
function stop(){if(!F.active)return;try{document.body.classList.remove('r1010Use');}catch(_){}stats.stops++;try{const r=F.room;if(r&&Array.isArray(r.props))r.props=r.props.filter(p=>p?.r1010Knot==null);}catch(e){fail(e);}F.active=false;mark('stopped');hud();}

// 한 프레임: 결전 동안 몹 물결, 창을 Esc 로 닫았을 때 이어 가기, 패배는 생존 결과 창에 맡긴다.
function step(){if(!F.active)return;const Z=SV(),st=G(()=>Z.state(),null);
 if(!st||!G(()=>Z.active(),false)||st.over||G(()=>room,null)!==F.room){stop();return;}
 const open=G(()=>modal,false)||G(()=>loading,false)||!!G(()=>storyScene,null);
 if(!open&&performance.now()-(F.phaseWall||0)>RECOVER_MS){/* 서사·기록·결과 창이 Esc 등으로 닫혀 다음 단계가 불리지 않았을 때 */
  if(F.phase==='confront'){stats.recover++;toFight();}else if(F.phase==='cutting'){stats.recover++;afterCut(F.cut>=F.knots.length);}
  else if(F.phase==='released'||F.phase==='ending'){stats.recover++;toRecord();}else if(F.phase==='record'){stats.recover++;toRecord();}else if(F.phase==='result'){stats.recover++;F.phaseWall=performance.now();resultPanel();}}
 if(F.phase==='fight'&&!open&&G(()=>player.hp>0,false)){const t=G(()=>time,0);if(t>=F.waveAt){F.waveAt=t+WAVE_EVERY;const n=G(()=>Z.finaleWave(),0)||0;stats.waveSpawned+=n;}
  const m=mich();if(m&&m.hp<=m.maxHp*FLOOR+1e-6)hint(false);}
 touchUse();hud();}

// 모바일 상호작용 단추: 결전 중 지금 끊을 매듭 곁이면 켠다(엔진 R63 은 전투 중 끈다).
let useCss=false;
function touchUse(){try{let on=false;if(F.active&&F.phase==='fight'&&here()&&document.body.classList.contains('mobile-live-r63')&&!G(()=>modal,false)&&G(()=>player.hp>0,false)){const k=nearKnot();on=!!(k&&!k.r1010Cut&&k.r1010Knot===F.cut);}
 if(on&&!useCss){useCss=true;const st=document.createElement('style');st.id='r1010Style';st.textContent='body.mobile-live-r63.r1010Use #touchUse{display:block!important}';document.head.appendChild(st);}
 if(document.body.classList.contains('r1010Use')!==on)document.body.classList.toggle('r1010Use',on);}catch(e){fail(e);}}/* 엔진 R63 의 mobile-use-r63 는 건드리지 않고 따로 표시 — 둘이 번갈아 바꿔 단추가 깜빡이지 않게 */
// ── 그리기: 매듭 표식(기존 붉은 실 매듭 그림) ──
function drawKnot(p){if(!here())return;const im=G(()=>readyImage(KNOT_ART),null)?.image;const q=G(()=>project(p.x,p.y),null);if(!q||!fin(q.x,q.y)){stats.nanDraw++;return;}
 const z=G(()=>zoom,1),tl=G(()=>TILE,64),w=clamp(tl*z*1.5,24,220),h=w*600/640,t=G(()=>time,0),cur=!p.r1010Cut&&p.r1010Knot===F.cut&&F.phase!=='released';
 const a=p.r1010Cut?.16:cur?clamp(.72+.22*Math.sin(t*4),0,1):.42;if(!fin(w,h,a)){stats.nanDraw++;return;}
 ctx.save();try{const okIm=im&&(im.naturalWidth||im.width)>0;
  if(cur&&okIm){/* 지금 차례 매듭: 같은 실 그림을 크게 한 번 더(더하기 합성) 깔아 영웅이 위에 서도 둘레 빛이 보이게 — 새 그림·절차적 선 없음 */const g=clamp(1.75+.12*Math.sin(t*3),1.5,2),gw=w*g,gh=h*g;if(fin(gw,gh)){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(.30+.12*Math.sin(t*4),0,1);ctx.drawImage(im,q.x-gw/2,q.y-gh*.62,gw,gh);ctx.globalCompositeOperation='source-over';}}
  ctx.globalAlpha=a;if(okIm)ctx.drawImage(im,q.x-w/2,q.y-h*.82,w,h);
  if(cur&&Math.hypot(p.x-player.x,p.y-player.y)<3.2){ctx.globalAlpha=.92;ctx.fillStyle='#f3e3d0';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(useName()+' · '+(solve().word||'매듭')+' '+(p.r1010Knot+1),q.x,q.y+14);}}
 catch(e){fail(e);}finally{ctx.restore();}}

// ── 안내 줄 ──
let hudEl=null;
function hud(){try{if(!hudEl||!hudEl.isConnected){hudEl=document.createElement('div');hudEl.id='r1010Hud';hudEl.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(122px + env(safe-area-inset-top,0px));z-index:8979;pointer-events:none;font-size:12px;color:#f0d9cf;text-shadow:0 1px 2px #000;letter-spacing:.04em;display:none;text-align:center;max-width:calc(100vw - 32px)';document.body.appendChild(hudEl);}
 const on=F.active&&here()&&(F.phase==='fight'||F.phase==='cutting');hudEl.style.display=on?'block':'none';if(!on)return;
 {const h=document.getElementById('r600Hud'),r=h&&h.classList.contains('on')?h.getBoundingClientRect():null,top=r&&Number.isFinite(r.bottom)&&r.bottom>0?Math.round(r.bottom+6)+'px':'calc(122px + env(safe-area-inset-top,0px))';if(hudEl.style.top!==top)hudEl.style.top=top;}/* 생존 HUD(보스 막대가 있으면 아래로 내려감·좁은 화면 두 줄) 바로 아래 — 코어·경험치 막대와 겹치지 않게 */
 const tx=NAME+' · 처치하지 않습니다 · '+(solve().word||'매듭')+' '+F.cut+' / '+F.knots.length+' · 붉은 매듭에서 '+useName();if(hudEl.textContent!==tx)hudEl.textContent=tx;}catch(e){fail(e);}}

// ── 엔진 연결(모든 스크립트가 실린 뒤 — 생존·사몽 덧씌우기보다 바깥에 선다) ──
let installed=false;
function install(){if(installed)return;installed=true;
 try{if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(F.active&&F.phase==='fight'&&here()&&!G(()=>modal,false)&&!G(()=>loading,false)&&G(()=>player.hp>0,false)){const k=nearKnot();if(k&&useKnot(k))return;}}catch(e){fail(e);}return base.apply(this,a);};}}catch(e){fail(e);}
 try{if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){if(e&&e.r1010Michaela){stats.blockedKills++;return;}return base.apply(this,[e,...a]);};}}catch(e){fail(e);}
 try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p&&p.r1010Knot!=null){try{drawKnot(p);}catch(e){fail(e);}return;}return base.apply(this,[p,...a]);};}}catch(e){fail(e);}
 /* 모바일: 엔진 상호작용 단추(#touchUse)는 전투 중(room.engaged)에는 숨는다 — 결전 중 지금 끊을 매듭 곁에 서면 보인다(R63 sync 뒤에 덧붙임). */
 try{if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r=base.apply(this,a);touchUse();return r;};}}catch(e){fail(e);}
 try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{step();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else try{install();}catch(e){fail(e);}

window.__STORYWORLD_SURVIVAL_FINALE_R1010__=Object.freeze({revision:REV,begin,active:()=>!!F.active,
 state:()=>({active:!!F.active,phase:F.phase,cut:F.cut,knots:(F.knots||[]).length,released:!!F.released,stageId:F.stageId||null}),
 pure:Object.freeze({ZONE,ENDING_ZONES,DONOR,FLOOR,knotUse,knotPoints,guardHp,confrontScenes,knotRecords,endingScenes}),
 inspect:()=>({revision:REV,stats:{...stats},lastError,log:[...log],installed})});
})();
