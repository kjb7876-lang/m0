// R308 — 맵당 클래식 1곡(사용자 2026-11-04 "클래식 BGM 더 많이 적용하고, 적절하게 맵당 하나의 클래식만 재생되도록, 끊기지 않게").
//  · 곡 목록·배정은 assets/r308/bgm/index.json. 기존 R195 14곡(라이선스 증거 그대로)에 Musopen PD/CC0 녹음 10곡을 더했다.
//  · 정본 서사를 읽고 작은 이야기(에피소드) 단위로 지역을 묶었고, 에피소드마다 탐색 곡 / 긴장 곡 / 절정(보스방) 곡 2~3개를 둔다.
//    사몽은 R115 장 키(정본 사몽 소제목 S-01… 단위)를 에피소드로 보고, 대면(confront) 구역만 절정 곡.
//  · 한 맵(지역·사몽 구역) 안에서는 곡이 바뀌지 않는다: 맵에 들어갈 때 정한 곡을 맵을 떠날 때까지 고정한다.
//    전투·보스 페이즈·쪽지·메뉴·스킬 창은 음량만 바꾼다(보스 체력 절반 아래면 조금 키운다). 멈추거나 처음부터 다시 틀지 않는다.
//  · 곡 끝은 같은 곡 처음과 3초 교차 페이드로 이어 붙인다(끊김 없음). 맵 이동 때만 2.4초 교차 페이드로 다음 곡.
//    같은 곡을 쓰는 맵으로 옮기면 그대로 이어 튼다. 다른 곡으로 갔다가 10분 안에 돌아오면 멈췄던 자리부터.
//  · 음량은 settings.bgm, 켜고 끄기는 settings.music 과 R195 '클래식 BGM' 스위치를 따른다. 모바일은 첫 터치·키 입력 뒤 재생.
//  · R195·R265 는 고치지 않는다: musicTick 을 한 겹 더 감싸, 이 파일이 곡을 틀 때는 아래 사슬(R195·원래 엔진)을 음악 끈 상태로 돌려 조용히 둔다.
//    목록을 못 읽었거나 꺼져 있으면 아래 사슬이 예전처럼 돈다.
//  · R353: 맵 곡을 정할 때 window.__STORYWORLD_BGM_PICK_R353__.choose(sel) 를 한 번 거친다(설정의 고정 곡·다음 곡·자동 배정 손질). key() 가 바뀌면 같은 맵에서도 다시 고른다.
(()=>{'use strict';
if(window.__STORYWORLD_BGM_MAP_R308__)return;
const REV='R308-bgm-map-2',KEY='storyworld.r308.bgm',INDEX='assets/r308/bgm/index.json',XF=3,MAPF=2.4,RESUME_MS=600000;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={ticks:0,mapSwitches:0,continued:0,loops:0,restarts:0,resumes:0,blocked:0,errors:0,delegated:0,failed:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const log=[];const note=(kind,o)=>{log.push({kind,at:Math.round(performance.now()),...o});if(log.length>200)log.shift();};
let idx=null;const failed=new Set(),memory=new Map();
fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.tracks&&j.maps)idx=j;}).catch(fail);

/* ---- 맵 → 곡 (순수 함수: CPU 검사가 그대로 부른다) ---- */
function samongOf(z,chapters){if(!chapters)return null;for(const[key,list]of Object.entries(chapters)){const zz=(list||[]).find(x=>x&&x.id===z);if(zz)return{key,zone:zz};}return null;}
function resolve(z,ix,env={}){ix=ix||idx;if(!ix)return null;z=String(z||'');
 const m=ix.maps[z];if(m)return{zone:z,track:m.track,episode:m.episode,role:m.role};
 if(/^sz/.test(z)||env.samong){const s=samongOf(z,env.chapters),ep=s&&ix.samong.episodes[s.key];
  if(ep){const climax=(ix.samong.climaxKinds||[]).includes(s.zone.kind);return{zone:z,track:climax?ep.climax:ep.main,episode:'samong:'+s.key,role:climax?'climax':'main'};}
  return{zone:z,track:ix.samong.fallback.main,episode:'samong',role:'main'};}
 return{zone:z,track:ix.fallbackTrack,episode:'fallback',role:'main'};}

/* ---- 재생 ---- */
const decks=[0,1].map(i=>{const el=new Audio();el.preload='none';el.loop=false;el.volume=0;const d={i,el,id:null,w:0};
 el.onerror=()=>{if(d.id){failed.add(d.id);stats.failed++;fail('track '+d.id);}};
 el.addEventListener('ended',()=>{/* 교차 페이드를 놓쳤을 때(탭 숨김 등)도 같은 곡을 바로 잇는다 */if(cur&&cur.deck===d&&!fade){stats.restarts++;loopNow();}});
 el.addEventListener('playing',()=>{if(fade&&fade.to===d&&fade.t0===null)fade.t0=performance.now();});
 el.addEventListener('loadedmetadata',()=>{if(d.needSeek){try{el.currentTime=d.seek||0;}catch(_){}d.needSeek=false;}});return d;});
let cur=null/* {deck,track,zone,episode,role} */,fade=null,blocked=false,duck=1,clock=0,visit=null/* {zone,sel} */;
const V={zone:()=>typeof zone!=='undefined'?String(zone||''):'',modal:()=>typeof modal!=='undefined'&&!!modal,started:()=>typeof started!=='undefined'&&!!started,
 voice:()=>typeof voiceElement!=='undefined'?voiceElement:null,samong:()=>{try{return typeof room!=='undefined'&&!!room?.samongR103;}catch(_){return false;}}};
const G=(n,f)=>{try{return V[n]();}catch(_){return f;}};
function remember(d){if(d?.id&&Number.isFinite(d.el.currentTime))memory.set(d.id,{time:d.el.currentTime,at:Date.now()});}
function play(d){if(blocked||!d.id)return;try{const p=d.el.play();p?.catch(e=>{if(e?.name==='AbortError')return;blocked=true;stats.blocked++;});}catch(e){fail(e);}}
function load(d,id,at){const t=idx.tracks[id];remember(d);d.el.pause();d.id=id;d.w=0;d.el.volume=0;d.el.preload='auto';d.el.src=t.path;d.seek=at;d.needSeek=at>0;if(d.el.readyState>=1&&at>0){try{d.el.currentTime=at;d.needSeek=false;}catch(_){}}play(d);}
function crossTo(id,at,dur){
 // Incoming deck still silent (buffering): keep the audible fade.from as the source and retarget/cancel the pending deck.
 if(fade&&fade.t0===null){const src=fade.from,pend=fade.to;fade=null;
  if(src.id===id){pend.el.pause();pend.w=0;pend.el.volume=0;src.w=1;return src;}
  load(pend,id,at);fade={from:src,to:pend,t0:pend.el.readyState>=3&&!pend.el.paused?performance.now():null,dur:dur*1000};return pend;}
 const to=decks.find(d=>d!==cur?.deck)||decks[0];
 if(fade){const out=fade.from;remember(out);out.el.pause();out.w=0;out.el.volume=0;fade=null;}
 load(to,id,at);if(cur?.deck&&cur.deck.id){fade={from:cur.deck,to,t0:to.el.readyState>=3&&!to.el.paused?performance.now():null,dur:dur*1000};}else to.w=1;return to;}
function loopNow(){if(!cur)return;stats.loops++;note('loop',{track:cur.track,zone:cur.zone});memory.delete(cur.track);const to=crossTo(cur.track,0,XF);cur={...cur,deck:to};}
function enterMap(sel){/* 맵에 들어올 때 한 번만 부른다 */
 if(cur&&cur.track===sel.track){stats.continued++;note('continue',{zone:sel.zone,track:sel.track,from:cur.zone,time:+cur.deck.el.currentTime.toFixed(2)});cur={...cur,zone:sel.zone,episode:sel.episode,role:sel.role};return;}
 // A→B→A can return while A is still fading out; capture its latest position before choosing the resume offset.
 if(fade&&fade.from.id===sel.track)remember(fade.from);
 const m=memory.get(sel.track),at=m&&Date.now()-m.at<RESUME_MS?m.time:0;if(at)stats.resumes++;
 const to=crossTo(sel.track,at,MAPF);stats.mapSwitches++;note('switch',{zone:sel.zone,track:sel.track,from:cur?.track||null,at:+at.toFixed?.(2)||0});
 cur={deck:to,track:sel.track,zone:sel.zone,episode:sel.episode,role:sel.role};announce(sel.track);}
function announce(id){let np=true;try{np=JSON.parse(localStorage.getItem('storyworld.r195.bgm')||'{}').nowPlaying!==false;}catch(_){}
 const t=idx.tracks[id];let ko='';try{ko=window.__STORYWORLD_BGM_PICK_R353__?.label?.(id)||'';}catch(_){}/* R353: 한국어 제목이 있으면 한국어로 */
 if(np&&t)try{if(typeof toast==='function')toast('♪ '+(ko||t.title+' — '+t.composer),2.6);}catch(_){}}
function unblock(){if(!blocked)return;blocked=false;for(const d of decks)if(d.w>0||fade&&d===fade.to)play(d);}
for(const ev of['pointerdown','keydown','touchstart'])window.addEventListener(ev,unblock,{capture:true,passive:true});
function pauseAll(){for(const d of decks)if(!d.el.paused)d.el.pause();}
function stopAll(){/* A completed loop leaves duplicate track ids; the active position must win. */
 for(const d of decks)if(d!==cur?.deck)remember(d);remember(cur?.deck);
 for(const d of decks){d.el.pause();d.w=0;d.el.volume=0;d.id=null;}cur=null;fade=null;visit=null;}
let r195On=true,r195At=0;
function enabled(){const now=performance.now();if(now-r195At>1000){r195At=now;try{r195On=window.__STORYWORLD_BGM_CLASSICAL_R195__?.inspect?.().prefs?.on!==false;}catch(_){}}
 return prefs.on&&r195On&&!!idx;}
function want(){return !!(G('started',false)&&settings?.music&&settings.bgm>0&&!document.hidden);}
function bossMul(){try{if(!room?.engaged)return 1;let f=null;for(const e of room.enemies||[])if((e.boss||e.persona)&&e.hp>0&&e.spawnState!=='dead'){const v=e.hp/Math.max(1,e.maxHp||e.hp);if(f===null||v<f)f=v;}return f===null?1:f<.5?1.22:1.1;}catch(_){return 1;}}
function tick(){const now=performance.now(),dt=Math.min(.25,Math.max(0,(now-clock)/1000));clock=now;stats.ticks++;
 if(!want()){pauseAll();return;}
 const z=G('zone','');if(!z)return;
 /* R353 훅: 설정의 '배경음악 고르기'(bgm-pick-r353)가 자동 배정 손질·고정 곡·다음 곡을 정한다. 없거나 곡이 없으면 원래 배정 그대로. */
 const pk=window.__STORYWORLD_BGM_PICK_R353__,pkey=pk?.key?.()||'';
 if(!visit||visit.zone!==z||visit.pkey!==pkey){let sel=resolve(z,idx,{chapters:window.__STORYWORLD_SAMONG_ZONES_R115__?.chapters,samong:G('samong',false)});
  if(sel&&pk?.choose){try{const o=pk.choose(sel,idx,cur?.track||null);if(o&&idx.tracks[o.track]&&!failed.has(o.track))sel=o;}catch(e){fail(e);}}
  if(!sel||!idx.tracks[sel.track]||failed.has(sel.track))return false;visit={zone:z,sel,pkey};enterMap(sel);}
 if(fade){/* Keep the outgoing deck audible while the incoming media buffers. */
  if(fade.t0===null&&fade.to.el.readyState>=3&&!fade.to.el.paused)fade.t0=now;
  const u=fade.t0===null?0:Math.min(1,(now-fade.t0)/fade.dur);fade.to.w=u;fade.from.w=1-u;if(u>=1){remember(fade.from);fade.from.el.pause();fade.from.w=0;fade=null;}}
 const a=cur?.deck;if(a&&!fade&&Number.isFinite(a.el.duration)&&a.el.duration>XF*2&&a.el.currentTime>=a.el.duration-XF)loopNow();
 const voice=G('voice',null),talking=voice&&!voice.paused||globalThis.speechSynthesis?.speaking,target=talking?.25:G('modal',false)?.5:1;
 duck+=(target-duck)*(1-Math.exp(-dt/(target<duck?.15:.6)));const boss=bossMul();
 for(const d of decks){const tr=d.id&&idx.tracks[d.id];const v=Math.max(0,Math.min(1,settings.bgm*(tr?.gain??.6)*duck*boss*d.w*(window.__STORYWORLD_MAPS_PALACE_SLUM_R317__?.bgmGain?.()??1)*(window.__STORYWORLD_BETRAYAL_VIDEO_R368__?.bgmGain?.()??1)*(window.__STORYWORLD_POISON_CITY_VIDEO_R369__?.bgmGain?.()??1)*(window.__STORYWORLD_ROOT_GATE_VIDEO_R372__?.bgmGain?.()??1)*(window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__?.bgmGain?.()??1)));d.el.volume=v;if((d.w>0||fade&&d===fade.to)&&d.el.paused)play(d);else if(d.w<=0&&!d.el.paused&&!(fade&&d===fade.to))d.el.pause();}
 return true;}
function quiet(base,self,args){const m=settings.music;try{settings.music=false;base.apply(self,args);}finally{settings.music=m;}}
try{if(typeof musicTick==='function'){const base=musicTick;musicTick=function(...a){
  if(!enabled()){if(cur)stopAll();stats.delegated++;return base.apply(this,a);}
  let ok=false;try{ok=tick()!==false;}catch(e){fail(e);}
  if(!ok||failed.has(cur?.track)){stopAll();stats.delegated++;return base.apply(this,a);}
  try{quiet(base,this,a);}catch(e){fail(e);}};}}catch(e){fail(e);}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll();});

/* ---- 크레딧: R195 '음악 크레딧' 버튼이 R308 전체 목록을 보이게 ---- */
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function credits(){document.getElementById('r308Credits')?.remove();const box=document.createElement('div');box.id='r308Credits';box.style.cssText='position:fixed;inset:6% 8%;z-index:9999;overflow:auto;background:rgba(14,10,12,.96);color:#e8dcc8;border:1px solid #6b3a3a;border-radius:8px;padding:18px 20px;font:14px/1.6 serif';
 const where={};if(idx){for(const e of idx.episodes)for(const t of [e.main,...Object.values(e.tension||{}),...Object.values(e.climax||{})])(where[t]||(where[t]=new Set())).add(e.name);for(const s of Object.values(idx.samong.episodes))for(const t of[s.main,s.climax])(where[t]||(where[t]=new Set())).add('사몽');}
 const rows=idx?Object.entries(idx.tracks).map(([id,t])=>'<li><b>'+esc(t.title)+'</b> — '+esc(t.composer)+'<br><span style="opacity:.8">연주: '+esc(t.performer||'미상')+' · '+esc(t.license)+(t.licenseUrl?' (<a style="color:#d7a" target="_blank" rel="noopener" href="'+esc(t.licenseUrl)+'">라이선스</a>)':'')+' · <a style="color:#d7a" target="_blank" rel="noopener" href="'+esc(t.source)+'">원본</a>'+(t.changes?' · 변경: '+esc(t.changes):'')+(where[id]?' · 쓰는 곳: '+esc([...where[id]].join(', ')):'')+'</span></li>').join(''):'<li>음악 목록을 아직 읽지 못했습니다.</li>';
 box.innerHTML='<h3 style="margin:0 0 8px">음악 크레딧</h3><p style="opacity:.8;margin:0 0 10px">클래식 녹음은 퍼블릭 도메인·CC0 또는 표시된 라이선스로 씁니다. 맵마다 한 곡을 이어서 틉니다.</p><ol style="padding-left:20px">'+rows+'</ol><button id="r308CreditsClose">닫기</button>';
 document.body.appendChild(box);box.querySelector('#r308CreditsClose').onclick=()=>box.remove();}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const b=document.getElementById('r195CreditsBtn');if(b)b.onclick=credits;}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)stopAll();}
window.__STORYWORLD_BGM_MAP_R308__=Object.freeze({revision:REV,set,credits,resolve,samongOf,
 inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!idx,tracks:idx?Object.keys(idx.tracks).length:0,visit:visit?{...visit.sel}:null,
  active:cur?{track:cur.track,zone:cur.zone,episode:cur.episode,role:cur.role,time:cur.deck.el.currentTime,paused:cur.deck.el.paused,volume:cur.deck.el.volume}:null,decks:decks.map(d=>({id:d.id,paused:d.el.paused,volume:d.el.volume,readyState:d.el.readyState,muted:d.el.muted,ended:d.el.ended})),fading:!!fade,blocked,duck,failed:[...failed],stats:{...stats},log:log.slice(-40),lastError})});
})();
