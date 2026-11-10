'use strict';
const fs=require('fs');
function patchHTML(source){
 const hook='    const row=readyImage(frame?.path),a=frame?.assetFrame,n=frame?.nativeHero5;';
 const marker='    /* R83 hero render calibration; native simulation frame is unchanged. */';
 if(!source.includes(marker)){
  if(source.split(hook).length!==2)throw Error('Expected one native hero draw hook');
  source=source.replace(hook,marker+'\n    const presentedR83=window.StoryHeroPresentationR83?.present(frame);if(presentedR83){frame=presentedR83.frame;height*=presentedR83.heightScale;}\n'+hook);
 }
 const nativeArt='return window.__STORYWORLD_PHASE1_ART__.hero();}';
 const artMarker='/* R83 presentation snapshot agrees with the recorded body path. */';
 if(!source.includes(artMarker)){
  if(source.split(nativeArt).length!==2)throw Error('Expected one renderer heroArtForDraw return');
  source=source.replace(nativeArt,artMarker+"const art=window.__STORYWORLD_PHASE1_ART__.hero(),presented=window.StoryHeroPresentationR83?.present(art?.frame);return presented?{...art,path:presented.frame.path,frame:presented.frame,r83HeightScale:presented.heightScale}:art;}");
 }
 return source;
}
module.exports={patchHTML};
if(require.main===module){const p=process.argv[2];if(!p)throw Error('Index path required');fs.writeFileSync(p,patchHTML(fs.readFileSync(p,'utf8')));}
