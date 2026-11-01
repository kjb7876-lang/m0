// R195 — 클래식 BGM(사용자 2026-11-01 "『합일몽세·스토리월드』 클래식 BGM 자동 선정 및 게임 통합").
//  자산: 퍼블릭 도메인/CC0(없으면 CC BY) 녹음만. 파일별 라이선스 페이지를 확인한 결과는 assets/audio/bgm/classical/catalog.json·MUSIC_CREDITS.md 에 있다.
//  · 지역(부)마다 탐색·전투·보스 곡을 따로 둔다. 찾는 순서는 `종류:지역id` → `종류:부` → `종류:default`, 그다음 boss2→boss→combat→explore 순으로 물러난다.
//  · 보스(boss·persona)가 살아 있고 전투 중이면 보스 곡을 튼다. 체력이 절반 아래로 내려가면 boss2 곡이 있을 때만 바꾼다.
//  · 곡을 바꿀 때는 2.4초 동안 교차 페이드한다(보스 진입은 1.2초). 최근 2분 안에 틀었던 곡으로 돌아가면 멈췄던 자리부터 이어서 튼다.
//    그래서 보스에게 지고 다시 붙어도 곡이 처음부터 겹쳐 다시 시작하지 않는다.
//  · 대화·쪽지 창이 열려 있으면 35%로 줄이고(더킹), 내레이션 음성이 나오면 20%로 줄인다. 설정·일시정지 창이 열리거나 탭을 숨기면 멈췄다가 이어서 튼다.
//  · 음량은 기존 BGM 음량(settings.bgm)을, 켜고 끄기는 기존 음악 스위치(settings.music)를 그대로 쓴다. 효과음 음량은 건드리지 않는다.
//    저장도 기존 오디오 설정 키를 쓰고, 이 파일은 'storyworld.r195.bgm' {on,nowPlaying} 만 따로 저장한다.
//  · 모바일 자동재생이 막히면 다음 터치나 키 입력 때 다시 튼다. 곡을 읽지 못했거나 목록이 없으면 원래 BGM(rc133) 엔진이 그대로 돈다.
//  · 설정 창에 '클래식 BGM' 켜기/끄기와 '음악 크레딧' 버튼을 넣는다.
(()=>{'use strict';
if(window.__STORYWORLD_BGM_CLASSICAL_R195__)return;
const REV='R195-classical-1',KEY='storyworld.r195.bgm',DIR='assets/audio/bgm/classical/',FADE=2.4,FADE_BOSS=1.2,RESUME_MS=120000;
let prefs={on:true,nowPlaying:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={ticks:0,switches:0,resumes:0,errors:0,blocked:0,failedTracks:0,nativeFallback:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let cat=null;const failed=new Set(),memory=new Map();/* trackId -> {time,at} */
fetch(DIR+'catalog.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.tracks&&j.slots)cat=j;}).catch(fail);
const decks=[0,1].map(i=>{const el=new Audio();el.preload='none';el.loop=true;el.volume=0;const d={i,el,id:null,w:0};el.onerror=()=>{if(d.id){failed.add(d.id);stats.failedTracks++;fail('track '+d.id);}};return d;});
let active=null,fade=null,blocked=false,duck=1,clock=0,lastSel=null;
const G=(n,f)=>{try{return typeof globalThis[n]!=='undefined'?globalThis[n]:f;}catch(_){return f;}};
function part(z){if(/^sz\d/.test(z))return 'samong';try{const ch=regionById?.[z]?.chapter||'';const m=/제\s*(\d+)\s*부/.exec(ch);if(m)return 'p'+m[1];}catch(_){}return 'default';}
function bossState(){try{if(!room?.engaged)return null;let best=null;for(const e of room.enemies||[])if((e.boss||e.persona)&&e.hp>0&&e.spawnState!=='dead'){const f=e.hp/Math.max(1,e.maxHp||e.hp);if(!best||f<best)best=f;}return best;}catch(_){return null;}}
function kind(){try{if(regionById?.[zone]?.safe)return 'safe';}catch(_){}const b=bossState();if(b!==null)return b<.5?'boss2':'boss';try{if(room?.engaged)return 'combat';}catch(_){}return 'explore';}
const FALL={boss2:['boss2','boss','combat','explore'],boss:['boss','combat','explore'],combat:['combat','explore'],explore:['explore'],safe:['safe','explore']};
function pick(){if(!cat)return null;const z=String(G('zone','')),p=part(z),k=kind();
 for(const kk of FALL[k]||[k])for(const s of [kk+':'+z,kk+':'+p,kk+':default']){const id=cat.slots[s];if(id&&cat.tracks[id]&&!failed.has(id))return {id,kind:k,slot:s};}
 return null;}
function want(){return !!(G('started',false)&&settings?.music&&settings.bgm>0&&!G('loading',false)&&!document.hidden);}
let settingsOpen=false;
function menuOpen(){/* 설정(일시정지) 창이 열려 있으면 멈추고, 대화·쪽지 같은 다른 창은 줄이기만 한다 */if(!G('modal',false))settingsOpen=false;return settingsOpen;}
function remember(d){if(d?.id&&Number.isFinite(d.el.currentTime))memory.set(d.id,{time:d.el.currentTime,at:Date.now()});}
function start(d,id){const t=cat.tracks[id];remember(d);d.el.pause();d.id=id;d.w=0;d.el.volume=0;d.el.loop=!(t.loopEnd>0);d.el.preload='auto';d.el.src=DIR+t.file;
 const m=memory.get(id);d.seek=m&&Date.now()-m.at<RESUME_MS?m.time:(t.loopStart||0);if(m&&Date.now()-m.at<RESUME_MS)stats.resumes++;d.needSeek=true;play(d);}
function play(d){if(blocked||!d.id)return;try{if(d.needSeek&&d.el.readyState>=1){try{d.el.currentTime=d.seek||0;}catch(_){}d.needSeek=false;}const p=d.el.play();p?.catch(e=>{if(e?.name==='AbortError')return;blocked=true;stats.blocked++;});}catch(e){fail(e);}}
for(const d of decks)d.el.addEventListener('loadedmetadata',()=>{if(d.needSeek){try{d.el.currentTime=d.seek||0;}catch(_){}d.needSeek=false;}});
function unblock(){if(!blocked)return;blocked=false;for(const d of decks)if(d.w>0)play(d);}
for(const ev of['pointerdown','keydown','touchstart'])window.addEventListener(ev,unblock,{capture:true,passive:true});
function pauseAll(){for(const d of decks){if(!d.el.paused)d.el.pause();}}
function stopAll(){for(const d of decks){remember(d);d.el.pause();d.w=0;d.el.volume=0;}active=null;fade=null;}
function announce(id){if(!prefs.nowPlaying)return;const t=cat.tracks[id];try{if(typeof toast==='function'&&t)toast('♪ '+t.title+' — '+t.composer,2.6);}catch(_){}}
function switchTo(sel){if(active?.id===sel.id)return;const to=decks.find(d=>d!==active)||decks[0];
 if(fade){/* 교차 페이드 중이면 나가던 덱을 바로 끄고 새 곡으로 */const out=fade.from;remember(out);out.el.pause();out.w=0;out.el.volume=0;}
 start(to,sel.id);fade=active?{from:active,to,t0:performance.now(),dur:(sel.kind.startsWith('boss')?FADE_BOSS:FADE)*1000}:null;if(!active)to.w=1;active=to;stats.switches++;announce(sel.id);}
function silenceNative(base,self,args){/* 원래 엔진의 덱을 멈춘다: 음악 스위치를 잠깐 끈 채로 한 번 돌리면 엔진이 자기 덱을 멈춘다 */const m=settings.music;try{settings.music=false;base.apply(self,args);}finally{settings.music=m;}}
function tick(){const now=performance.now(),dt=Math.min(.25,Math.max(0,(now-clock)/1000));clock=now;stats.ticks++;
 if(!want()||menuOpen()){pauseAll();return;}
 const sel=pick();if(!sel){return false;}lastSel=sel;if(!active||active.id!==sel.id)switchTo(sel);
 if(fade){const u=Math.min(1,(now-fade.t0)/fade.dur);fade.to.w=u;fade.from.w=1-u;if(u>=1){remember(fade.from);fade.from.el.pause();fade.from.w=0;fade=null;}}
 const t=active&&cat.tracks[active.id];if(t?.loopEnd>0&&active.el.currentTime>=t.loopEnd){try{active.el.currentTime=t.loopStart||0;}catch(_){}}
 const voice=G('voiceElement',null),talking=voice&&!voice.paused||globalThis.speechSynthesis?.speaking,target=talking?.2:G('modal',false)?.35:1;
 duck+=(target-duck)*(1-Math.exp(-dt/(target<duck?.12:.6)));
 for(const d of decks){const tr=d.id&&cat.tracks[d.id];const v=Math.max(0,Math.min(1,settings.bgm*(tr?.gain??.6)*duck*d.w));d.el.volume=v;if(d.w>0&&d.el.paused)play(d);else if(d.w<=0&&!d.el.paused)d.el.pause();}
 return true;}
try{if(typeof musicTick==='function'){const base=musicTick;musicTick=function(...a){
  if(!prefs.on||!cat){if(active)stopAll();return base.apply(this,a);}
  let ok=false;try{ok=tick()!==false;}catch(e){fail(e);ok=false;}
  if(!ok||failed.has(active?.id)){if(active&&(!ok||failed.has(active.id)))stopAll();stats.nativeFallback++;return base.apply(this,a);}
  try{silenceNative(base,this,a);}catch(e){fail(e);}};}}catch(e){fail(e);}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll();});
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function credits(){const box=document.createElement('div');box.id='r195Credits';box.style.cssText='position:fixed;inset:6% 8%;z-index:9999;overflow:auto;background:rgba(14,10,12,.96);color:#e8dcc8;border:1px solid #6b3a3a;border-radius:8px;padding:18px 20px;font:14px/1.6 serif';
 const rows=cat?Object.entries(cat.tracks).map(([id,t])=>'<li><b>'+esc(t.title)+'</b> — '+esc(t.composer)+'<br><span style="opacity:.8">연주: '+esc(t.performer||'미상')+' · '+esc(t.license)+(t.licenseUrl?' (<a style="color:#d7a" target="_blank" rel="noopener" href="'+esc(t.licenseUrl)+'">라이선스</a>)':'')+' · <a style="color:#d7a" target="_blank" rel="noopener" href="'+esc(t.source)+'">원본</a>'+(t.changes?' · 변경: '+esc(t.changes):'')+'</span></li>').join(''):'<li>음악 목록을 아직 읽지 못했습니다.</li>';
 box.innerHTML='<h3 style="margin:0 0 8px">음악 크레딧</h3><p class="small" style="opacity:.8;margin:0 0 10px">클래식 녹음은 퍼블릭 도메인·CC0 또는 표시된 라이선스로 씁니다. 전체 목록은 MUSIC_CREDITS.md 에 있습니다.</p><ol style="padding-left:20px">'+rows+'</ol><button id="r195CreditsClose">닫기</button>';
 document.body.appendChild(box);const close=()=>box.remove();box.querySelector('#r195CreditsClose').onclick=close;box.addEventListener('keydown',e=>{if(e.key==='Escape')close();});}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);settingsOpen=true;try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings')||document.getElementById('panel');if(grid&&!document.getElementById('r195On')){
   const l=document.createElement('label');const c=document.createElement('input');c.type='checkbox';c.id='r195On';c.checked=!!prefs.on;c.onchange=()=>set({on:c.checked});l.appendChild(c);l.appendChild(document.createTextNode(' 클래식 BGM (지역·보스별 곡)'));grid.appendChild(l);
   const b=document.createElement('button');b.id='r195CreditsBtn';b.textContent='음악 크레딧';b.onclick=credits;grid.appendChild(b);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)stopAll();}
window.__STORYWORLD_BGM_CLASSICAL_R195__=Object.freeze({revision:REV,set,credits,pick,inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!cat,tracks:cat?Object.keys(cat.tracks).length:0,selected:lastSel,active:active?{id:active.id,time:active.el.currentTime,paused:active.el.paused,volume:active.el.volume}:null,fading:!!fade,blocked,duck,failed:[...failed],stats:{...stats},lastError})});
})();
