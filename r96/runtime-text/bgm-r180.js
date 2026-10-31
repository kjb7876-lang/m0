/* R180 final-chapter boss march. The user supplied "The Sovereign's Last March"
 * (2:54 march: quiet build, two full-orchestra climaxes, quiet outro). It is used
 * as the boss-fight track of 제8부 — 사이비 합일몽세 (zones cult01–cult06, which
 * ends with 교주의 사몽, the cult leader's own dream). Every other place keeps the
 * existing five tracks; awakening (사몽/EGO) still takes priority over it.
 * The native two-deck adapter asks window.__STORYWORLD_BGM_PICK__(group, room) after the
 * safe-room and awakening rules; this answers only while a living boss or midboss of a
 * cult zone is out (spawnState 'active'), and null keeps the old choice everywhere else.
 * Processed copy: -13.2 dB to -24.5 LUFS integrated like the rc133 tracks, cut at
 * 171.6 s before the source's silent tail, 0.8 s fade, 48 kHz 160 kb/s.
 * Presentation only: no gameplay, save or settings writes. Canonical source;
 * copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_BGM_R180__)return;
 const KEY='sovereignsLastMarch',GROUP='cult';
 const ROW=Object.freeze({path:'./assets/r180/audio/The_Sovereigns_Last_March-b61b82cc.mp3',gain:1,duration:171.624,loopStart:0,loopEnd:171.524,crossfade:2.5,
  sha256:'c874979f5d74731ca6e20720711f7dbc8743d48d482c8d0c419ada285934da21',sourceSha256:'b61b82cc348577d4b53bff181079d508d285a0f884e21ddd3b915ce57a805f9e',
  title:"The Sovereign's Last March",use:'제8부 보스전'});
 const GAIN=.45;// rc133 boss track (timeControl) sits at .396; this one has a wide dynamic range (LRA 17 LU)
 const stats={registered:false,asked:0,chosen:0,lastBoss:null,lastError:null};
 function register(){
  try{
   if(typeof audioCatalog==='undefined'||!audioCatalog)return false;
   if(!audioCatalog.music||typeof audioCatalog.music!=='object')return false;
   if(!audioCatalog.music[KEY]){
    if(Object.isFrozen(audioCatalog.music))audioCatalog.music={...audioCatalog.music};
    audioCatalog.music[KEY]=ROW;}
   if(typeof STORY_BGM_GAINS==='object'&&STORY_BGM_GAINS&&!(KEY in STORY_BGM_GAINS))STORY_BGM_GAINS[KEY]=GAIN;
   stats.registered=!!audioCatalog.music[KEY];return stats.registered;
  }catch(e){stats.lastError=String(e?.message||e);return false;}}
 function allowed(){try{return typeof audioAllowed!=='function'||audioAllowed(ROW.path);}catch(_){return false;}}
 const bossOut=r=>(r?.enemies||[]).find(e=>(e.boss||e.midboss||e.persona)&&e.hp>0&&e.spawnState==='active')||null;
 window.__STORYWORLD_BGM_PICK__=function(group,r){
  stats.asked++;if(group!==GROUP)return null;
  const e=bossOut(r);if(!e||!register()||!allowed())return null;
  if(stats.lastBoss!==e.id){stats.lastBoss=e.id;stats.chosen++;}return KEY;};
 // the catalog arrives after load (setupAudio); register on the music tick until it is in, before R108 fills its cache
 register();
 if(typeof musicTick==='function'){const tickBase=musicTick;musicTick=function(){if(typeof audioCatalog!=='undefined'&&audioCatalog&&!audioCatalog.music?.[KEY])register();return tickBase.apply(this,arguments);};}
 window.__STORYWORLD_BGM_R180__=Object.freeze({revision:'R180-boss-march',key:KEY,group:GROUP,row:ROW,gain:GAIN,
  inspect:()=>({...stats,inCatalog:!!(typeof audioCatalog!=='undefined'&&audioCatalog?.music?.[KEY]),gain:typeof STORY_BGM_GAINS==='object'?STORY_BGM_GAINS[KEY]??null:null,allowed:allowed(),gameplayWrites:false})});
})();
