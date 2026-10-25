/* R98 audio balance. The BGM adapter's per-track gains and the SFX role gains
 * live in the native core and are patched there by scripts/apply-r98.cjs; this
 * overlay only carries a stored music level left at the old R96 default (.25,
 * which was inaudible under the old gains) up to the new default once, and
 * reports the current mix. Audio bytes, narration and the sound switches are
 * unchanged. Canonical source; copied by scripts/apply-r98.cjs. */
(()=>{'use strict';
 if(window.__STORYWORLD_AUDIO_R98__||typeof settings==='undefined')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r98.audio';
 const OLD_DEFAULT=.25,NEW_DEFAULT=.5;let migrated=false,lastError=null;
 try{
  const done=localStorage.getItem(KEY)==='1';
  if(!done){
   if(Math.abs((settings.bgm??OLD_DEFAULT)-OLD_DEFAULT)<1e-6){settings.bgm=NEW_DEFAULT;window.__STORYWORLD_BGM__?.persistSettings?.();migrated=true;}
   localStorage.setItem(KEY,'1');
  }
 }catch(e){lastError=String(e);}
 window.__STORYWORLD_AUDIO_R98__=Object.freeze({inspect:()=>({revision:'R98-audio-balance',migratedStoredBgm:migrated,bgm:settings.bgm,volume:settings.volume,bgmGains:window.__STORYWORLD_BGM__?.inspect?.().gains||null,sfxRoles:window.__STORYWORLD_SFX_COMFORT__?.roles||null,footstepGain:window.__STORYWORLD_VISUAL_R93_UI__?.inspect?.().footstepGain??null,lastError,audioBytesChanged:false,narrationChanged:false})});
})();
