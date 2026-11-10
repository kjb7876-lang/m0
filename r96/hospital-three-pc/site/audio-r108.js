/* R108 BGM continuity. The native two-deck adapter streams a track from the network
 * every time it begins a deck (loop overlap, region/combat/awakening change), keeps a
 * sticky `blocked` flag after any non-abort play() rejection until the next key or
 * pointer gesture, and gives a deck up after one media error; a dropped connection, a
 * slow loop re-download or an AudioContext the browser suspended then leaves the game
 * silent for as long as the player does not press anything (auto-battle, reading).
 * This overlay (a) keeps the approved tracks in memory as object URLs once music is
 * wanted, so loops and transitions start at once and never stall, and (b) watches the
 * deck the adapter exposes (musicElement + __STORYWORLD_BGM__.inspect) and re-arms it
 * through unlockAudio() with backoff while music is wanted but nothing is playing.
 * Presentation only: catalog, gains, narration, settings and gameplay are never
 * written. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_AUDIO_R108__||typeof musicTick!=='function'||typeof urlFor!=='function'||typeof unlockAudio!=='function')return;
 const CAP_BYTES=24*1024*1024,RETRY_MIN_MS=3000,RETRY_MAX_MS=20000,STALL_MS=2500,NUDGE_MIN_MS=1200;
 const cache=new Map();// cleanPath -> {key,url,bytes}
 const stats={cached:0,bytes:0,skipped:[],fetchErrors:0,rearms:0,resumed:0,nudges:0,stalls:0,lastReason:null};
 const audit=[];const log=(kind,extra)=>{audit.push({kind,at:typeof time==='number'?time:0,...(extra||{})});if(audit.length>64)audit.shift();};
 let fetching=false,filled=false,wanted=false,retryAt=0,retryGap=RETRY_MIN_MS,nudgeAt=0,lastTime=-1,lastAdvance=0,silentSince=0;
 const now=()=>performance.now();
 const lowMemory=()=>{try{return navigator.connection?.saveData===true||(Number.isFinite(navigator.deviceMemory)&&navigator.deviceMemory<2);}catch(_){return false;}};
 const activation=()=>{try{return navigator.userActivation?navigator.userActivation.hasBeenActive:true;}catch(_){return true;}};
 const want=()=>!!(started&&settings?.music&&settings.bgm>0&&!document.hidden&&!modal&&!loading);
 const inspectBgm=()=>{try{return window.__STORYWORLD_BGM__?.inspect?.()||null;}catch(_){return null;}};

 // ---- (a) in-memory tracks: exact music paths only, everything else untouched ----
 const baseUrl=urlFor;
 urlFor=function(path){const c=typeof path==='string'?cache.get(cleanPath(path)):null;return c?c.url:baseUrl.apply(this,arguments);};
 function rows(){const sel=inspectBgm()?.selected;return Object.entries(audioCatalog?.music||{}).filter(([,r])=>r?.path&&audioAllowed(r.path)).sort((a,b)=>(a[0]===sel?-1:0)-(b[0]===sel?-1:0));}
 async function fill(){if(fetching||filled)return;fetching=true;try{
   if(lowMemory()){stats.skipped.push('all:low-memory');return;}
   for(const[key,row]of rows()){const p=cleanPath(row.path);if(cache.has(p))continue;if(mediaPack[p]){stats.skipped.push(key+':packed');continue;}
    try{const res=await fetch(baseUrl(p),{cache:'force-cache'});if(!res.ok)throw new Error('http '+res.status);const blob=await res.blob();
     if(stats.bytes+blob.size>CAP_BYTES){stats.skipped.push(key+':cap');continue;}
     cache.set(p,{key,url:URL.createObjectURL(blob),bytes:blob.size});stats.cached++;stats.bytes+=blob.size;log('cached',{key,bytes:blob.size});}
    catch(e){stats.fetchErrors++;log('fetch-error',{key,error:String(e?.message||e)});}}
  }finally{fetching=false;filled=true;}}

 // ---- (b) watchdog: wanted but silent -> re-arm (unlockAudio clears the adapter's blocked flag and resumes the context) ----
 function rearm(reason){retryAt=now()+retryGap;retryGap=Math.min(RETRY_MAX_MS,Math.round(retryGap*1.7));stats.rearms++;stats.lastReason=reason;log('rearm',{reason});
  try{Promise.resolve(unlockAudio()).then(ok=>{if(ok)stats.resumed++;}).catch(()=>{});}catch(_){}}
 function nudge(el,reason){if(now()<nudgeAt)return;nudgeAt=now()+NUDGE_MIN_MS;stats.nudges++;log('nudge',{reason});try{const p=el.play();if(p&&p.catch)p.catch(()=>{});}catch(_){}}
 function watch(){const t=now();
  if(!want()){wanted=false;lastTime=-1;silentSince=0;return;}
  if(!wanted){wanted=true;retryGap=RETRY_MIN_MS;retryAt=0;lastAdvance=t;silentSince=0;if(!filled)fill();}
  const el=musicElement||null,insp=inspectBgm(),decks=insp?.decks||[];
  const playing=decks.some(d=>d.weight>0&&!d.paused&&!d.failed)||!!(el&&!el.paused&&!el.ended);
  if(!playing){if(!silentSince)silentSince=t;
   const reason=!audioUnlocked?'context':insp?.blocked?'blocked':!el?'no-deck':el.ended?'ended':'paused';
   if(t>=retryAt&&activation()&&t-silentSince>400)rearm(reason);
   // the adapter restarts the weighted deck itself on its next tick once blocked is clear and the
   // context runs; if that did not happen (rejection without blocked), restart the active deck here
   if(el&&el.paused&&!el.ended&&audioUnlocked&&!insp?.blocked&&t-silentSince>900)nudge(el,reason);
   return;}
  silentSince=0;retryGap=RETRY_MIN_MS;
  if(el&&!el.paused){const ct=el.currentTime;if(ct!==lastTime){lastTime=ct;lastAdvance=t;}
   else if(t-lastAdvance>STALL_MS&&el.readyState>=3){lastAdvance=t;stats.stalls++;nudge(el,'stall');}}}
 const tickBase=musicTick;musicTick=function(){const r=tickBase.apply(this,arguments);try{watch();}catch(_){}return r;};
 const wake=()=>{retryAt=0;retryGap=RETRY_MIN_MS;};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
 for(const ev of['pointerdown','keydown','touchstart'])window.addEventListener(ev,wake,{capture:true,passive:true});

 window.__STORYWORLD_AUDIO_R108__=Object.freeze({revision:'R108-bgm-continuity',
  inspect:()=>({cache:[...cache.values()].map(c=>({key:c.key,bytes:c.bytes})),bytes:stats.bytes,capBytes:CAP_BYTES,filled,fetching,wanted,
   stats:{...stats,skipped:[...stats.skipped]},audit:[...audit],retry:{minMs:RETRY_MIN_MS,maxMs:RETRY_MAX_MS,nextInMs:Math.max(0,Math.round(retryAt-now()))},
   catalogChanged:false,gainsChanged:false,gameplayWrites:false})});
})();
