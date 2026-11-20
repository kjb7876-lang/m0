// R1250 — 외부 제안 검토 ③(사용자 2026-11-19 23:56Z "/검토": "난이도는 사망 횟수와 교전 시간을 함께 보기. 스토리는 첫 중간보스까지 걸린 시간과
//  예고를 보고 회피한 비율을, 무한생존·777은 도달 구간과 코어 파괴를 기록하세요").
//  이 기기 안(localStorage storyworld.r1250.playlog)에만 남기는 가벼운 플레이 기록. 서버로 보내지 않는다. 최근 50판.
//   공통: 영웅, 플레이 시간(게임 시간), 교전 시간(살아 있는 적이 9칸 안에 있던 게임 시간), 사망·되살아남 횟수,
//         예고 회피 = 영웅이 경고 시간 동안 안에 서 있던 '피해 있는 예고'(hazards: warning>0·damage>0) 가운데 피해 없이 끝난 비율
//         (회피 무적으로 받아낸 것도 피한 것). 0.5초마다 보므로 0.5초보다 짧은 예고는 일부 빠질 수 있다.
//   스토리: 첫 중간보스(살아 있는 boss 표지 적이 12칸 안에 처음 온 순간)까지 걸린 게임 시간·지역·이름·층(STORY/DREAM).
//   무한생존: 난이도, 도달 구간(회차·단계 최고값), 처치 수, 레벨, 코어 파괴 여부. EGO·페르소나(777 해금) 영웅이면 secret777 표시.
//  보는 곳: 설정 창 맨 아래 '플레이 기록(난이도 측정)' 접기, 또는 콘솔 __STORYWORLD_PLAY_LOG_R1250__.summary().
//  판정·피해·AI·세이브 슬롯은 그대로(읽기만). 끄기: localStorage['storyworld.r1250.prefs']='{"on":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_PLAY_LOG_R1250__)return;
const REV='R1250-play-log-1',KEY='storyworld.r1250.playlog',PKEY='storyworld.r1250.prefs',MAX=50,NEAR=9,BOSS_NEAR=12;
let prefs={on:true};try{const p=JSON.parse(localStorage.getItem(PKEY)||'{}');if(p&&typeof p==='object')prefs={...prefs,...p};}catch(_){}
const stats={ticks:0,saves:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let runs=[];try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&Array.isArray(s.runs))runs=s.runs.filter(r=>r&&typeof r==='object').slice(-MAX).map(r=>r.ended?r:{...r,ended:true,endReason:'page'});}catch(_){runs=[];}
let cur=null,lastTime=null,pendingHero=null,ticksSinceSave=0;const recs=new Map();
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const r1=v=>Math.round(v*10)/10;
function save(){try{localStorage.setItem(KEY,JSON.stringify({v:1,runs:runs.concat(cur?[cur]:[]).slice(-MAX)}));stats.saves++;ticksSinceSave=0;}catch(e){fail(e);}}
function close(reason){if(!cur)return;cur.ended=true;cur.endReason=reason||'next';cur.endedAt=new Date().toISOString();runs.push(cur);if(runs.length>MAX)runs=runs.slice(-MAX);cur=null;recs.clear();save();}
const formOf=h=>G(()=>/^(ego|persona)$/i.test(String(h||''))||!!player?.egoSovereignR1046||!!player?.personaHeroR1113,false);
function base(mode,hero){return {id:Date.now(),mode,hero:String(hero||G(()=>player.hero,'')||''),secret777:formOf(hero),startedAt:new Date().toISOString(),
 playSecs:0,combatSecs:0,deaths:0,revives:0,telegraphs:0,dodged:0,dodgeRate:null,ended:false};}
function surv(){const S=G(()=>window.__STORYWORLD_SURVIVAL_R600__,null);if(!S||typeof S.active!=='function'||!S.active())return null;return G(()=>S.state(),null);}
// 예고 안에 서 있나(원형·빔)
function inside(h,p){const r=Number(h.radius);if(Number.isFinite(r)&&r>0)return Math.hypot(p.x-h.x,p.y-h.y)<r+.3;
 const L=Number(h.reach),a=Number(h.angle);if(Number.isFinite(L)&&L>0&&Number.isFinite(a)){const dx=Math.cos(a),dy=Math.sin(a),t=Math.max(0,Math.min(L,(p.x-h.x)*dx+(p.y-h.y)*dy));
  return Math.hypot(p.x-(h.x+dx*t),p.y-(h.y+dy*t))<(Number(h.width)||.38)+.6;}return false;}
function finish(rec){if(!cur||rec.done)return;rec.done=true;if(!rec.threat)return;cur.telegraphs++;if(!rec.hit)cur.dodged++;cur.dodgeRate=cur.telegraphs?cur.dodged/cur.telegraphs:null;}
function telegraphs(){const list=G(()=>typeof hazards!=='undefined'&&Array.isArray(hazards)?hazards:[],[]),p=G(()=>player,null),seen=new Set();
 for(const h of list){if(!h||!(Number(h.warning)>0)||!(Number(h.damage)>0))continue;seen.add(h);let rec=recs.get(h);if(!rec){rec={threat:false,hit:false,done:false};recs.set(h,rec);}
  if(p&&!rec.threat&&Number(h.age)<Number(h.warning)&&inside(h,p))rec.threat=true;}
 for(const [h,rec]of recs)if(!seen.has(h)){finish(rec);recs.delete(h);}}
function tick(){try{if(!prefs.on)return;stats.ticks++;
 const t=Number(G(()=>time,NaN));let dt=0;if(Number.isFinite(t)){if(lastTime!=null){dt=t-lastTime;if(!(dt>0&&dt<=2))dt=0;}lastTime=t;}
 const st=surv();
 if(st){if(!cur||cur.mode!=='survival'){if(st.over)return;close('mode');cur={...base('survival',st.hero),diff:st.diff,maxStage:0,maxLoop:0,stageLabel:'',kills:0,lv:0,coreDestroyed:false};}
  const ids=Number(st.ids)||1,prog=(Number(st.loop)||0)*ids+(Number(st.i)||0);if(prog>=(cur.maxLoop*ids+cur.maxStage)){cur.maxStage=Number(st.i)||0;cur.maxLoop=Number(st.loop)||0;}
  cur.stageLabel=(cur.maxLoop?(cur.maxLoop+1)+'회차 ':'')+(cur.maxStage+1)+'/'+ids;cur.kills=Math.max(cur.kills,Number(st.kills)||0);cur.lv=Math.max(cur.lv,Number(st.lv)||0);
  if(st.over){cur.coreDestroyed=!(Number(st.core?.hp)>0);common(dt);close(cur.coreDestroyed?'core':'over');return;}}
 else{if(cur&&cur.mode==='survival')close('mode');
  if(!G(()=>started,false))return;
  if(!cur){cur=base('story',pendingHero);cur.resumed=pendingHero==null;cur.firstBoss=null;pendingHero=null;lastTime=Number.isFinite(t)?t:null;dt=0;}}
 common(dt);
 if(++ticksSinceSave>=60)save();}catch(e){fail(e);}}
function common(dt){const busy=G(()=>(typeof loading!=='undefined'&&loading)||(typeof storyScene!=='undefined'&&!!storyScene),false);if(busy)dt=0;
 cur.playSecs=r1(cur.playSecs+dt);const p=G(()=>player,null),es=G(()=>room.enemies,null);let near=false,boss=null;
 if(p&&Array.isArray(es))for(const e of es){if(!e||!(e.hp>0)||e.hero||e.ally)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<NEAR)near=true;if(e.boss&&d<BOSS_NEAR&&!boss)boss=e;}
 if(near)cur.combatSecs=r1(cur.combatSecs+dt);
 if(cur.mode==='story'&&!cur.firstBoss&&boss){cur.firstBoss={secs:cur.playSecs,zone:String(G(()=>room.id,'')||G(()=>zone,'')),name:String(boss.name||boss.title||''),layer:String(G(()=>layer,''))};save();}
 telegraphs();}
// 피해·사망: hurt 를 감싸 읽기만
let hurtWrapped=false;
function wrapHurt(){if(hurtWrapped||typeof hurt!=='function')return;const b=hurt;const w=function(d,source){const before=G(()=>player.hp,NaN);const r=b.apply(this,arguments);
 try{const after=G(()=>player.hp,NaN);if(cur){const rec=source&&typeof source==='object'?recs.get(source):null;if(rec&&after<before)rec.hit=true;
  if(before>0&&!(after>0)){cur.deaths++;save();}if(r==='revived')cur.revives++;}}catch(e){fail(e);}return r;};
 try{hurt=w;hurtWrapped=hurt===w;}catch(e){fail(e);}}
let ngWrapped=false;
function wrapNewGame(){if(ngWrapped||typeof newGame!=='function')return;const b=newGame;const w=function(hero){try{close('newGame');pendingHero=typeof hero==='string'?hero:null;lastTime=null;}catch(e){fail(e);}return b.apply(this,arguments);};
 try{newGame=w;ngWrapped=newGame===w;}catch(e){fail(e);}}
wrapHurt();wrapNewGame();
// 요약 글
const mm=s=>{s=Math.max(0,Math.round(Number(s)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const pct=v=>v==null?'-':Math.round(v*100)+'%';
function line(r){const d=String(r.startedAt||'').slice(5,16).replace('T',' ');const tail=` · 사망 ${r.deaths|0} · 교전 ${mm(r.combatSecs)}/${mm(r.playSecs)} · 예고 회피 ${r.dodged|0}/${r.telegraphs|0}(${pct(r.dodgeRate)})`;
 if(r.mode==='survival')return `[생존 ${r.diff||''}] ${d} ${r.hero}${r.secret777?'(777)':''} · 도달 구간 ${r.stageLabel||'-'} · 처치 ${r.kills|0} · 코어 ${r.coreDestroyed?'파괴':'유지'}${tail}`;
 return `[스토리] ${d} ${r.hero}${r.secret777?'(777)':''} · 첫 중간보스 ${r.firstBoss?mm(r.firstBoss.secs)+' '+r.firstBoss.zone:'아직'}${tail}`;}
function summary(){const all=runs.concat(cur?[cur]:[]);if(!all.length)return '아직 기록이 없습니다.';
 const S=all.filter(r=>r.mode==='story'),V=all.filter(r=>r.mode==='survival');const head=[];
 if(S.length){const fb=S.filter(r=>r.firstBoss).map(r=>r.firstBoss.secs).sort((a,b)=>a-b),tg=S.reduce((a,r)=>a+(r.telegraphs|0),0),dg=S.reduce((a,r)=>a+(r.dodged|0),0);
  head.push(`스토리 ${S.length}판 · 사망 ${S.reduce((a,r)=>a+(r.deaths|0),0)} · 교전 ${mm(S.reduce((a,r)=>a+(r.combatSecs||0),0))} · 첫 중간보스 중앙값 ${fb.length?mm(fb[fb.length>>1]):'-'} · 예고 회피 ${dg}/${tg}(${pct(tg?dg/tg:null)})`);}
 if(V.length)head.push(`무한생존 ${V.length}판 · 코어 파괴 ${V.filter(r=>r.coreDestroyed).length} · 사망 ${V.reduce((a,r)=>a+(r.deaths|0),0)} · 최고 도달 구간 ${V.map(r=>r.stageLabel).filter(Boolean).slice(-1)[0]||'-'}`);
 return head.concat(['— 최근 판 —'],all.slice(-12).reverse().map(line)).join('\n');}
// 설정 창: 맨 아래 접기 한 칸(글만)
function section(){const panel=document.getElementById('panel');if(!panel||!panel.querySelector('#settingsClose')||document.getElementById('playLogR1250'))return;
 const d=document.createElement('details');d.id='playLogR1250';const s=document.createElement('summary');s.textContent='플레이 기록(난이도 측정)';
 const pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';pre.style.fontSize='11px';pre.style.margin='.4em 0';pre.textContent=summary();
 const btn=document.createElement('button');btn.type='button';btn.textContent='기록 지우기';btn.onclick=()=>{clear();pre.textContent=summary();};
 const note=document.createElement('p');note.className='small muted';note.textContent='이 기기 안에만 저장됩니다. 사망·교전 시간·첫 중간보스 시간·예고 회피 비율·생존 도달 구간·코어 파괴를 함께 봅니다.';
 d.appendChild(s);d.appendChild(note);d.appendChild(pre);d.appendChild(btn);panel.appendChild(d);}
if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{section();}catch(e){fail(e);}return r;};}
try{addEventListener('pagehide',()=>{if(cur)save();});}catch(_){}
setInterval(()=>{wrapHurt();wrapNewGame();tick();},500);
function clear(){runs=[];cur=null;recs.clear();save();return true;}
function set(p){if(typeof p?.on==='boolean'){prefs.on=p.on;try{localStorage.setItem(PKEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)cur=null;}return {...prefs};}
window.__STORYWORLD_PLAY_LOG_R1250__=Object.freeze({revision:REV,tick,save,clear,set,summary,
 current:()=>cur?JSON.parse(JSON.stringify(cur)):null,runs:()=>JSON.parse(JSON.stringify(runs)),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},runs:runs.length,current:!!cur,tracking:recs.size,lastError,gameplayChanged:false,savesTouched:false,localOnly:true})});
})();
