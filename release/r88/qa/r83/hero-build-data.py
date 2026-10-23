"""Read original alpha only; generate render metadata without rewriting any asset."""
import json,re,hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
rows=json.loads((ROOT/'qa/r83/hero-v6-alpha-audit.json').read_text())
profiles={}
for r in rows:
 path=r['path'];route=r['routes'][0].split(':');state=route[1]
 if '/heroes/normalized/' not in path:continue
 if not any(':move:' in k or ':hit:' in k or ':dash:' in k for k in r['routes']):continue
 # Legacy pose crops often used a full-canvas y=.96 foot inside a small crop.
 # All these selected source images have an isolated body. Their alpha crown and
 # sole were inspected on the five hero-source sheets; weapons/effects which
 # extend outside the body are handled by canonical guard routing, not this set.
 bb=r['alphaBounds24'];f=r['frame'];a=(ROOT/'hospital-three-pc/site'/path).read_bytes()
 profiles[path]={'sourceRect':f['sourceRect'],'pivot':[f['pivot'][0],bb[3]],'visibleHeight':bb[3]-bb[1],'crown':bb[1],'sole':bb[3],'alphaBounds24':bb,'sha256':hashlib.sha256(a).hexdigest()}
# Gunner run B art has a baked thick white outline absent in the A source.
# Select the existing original A pose for both gait phases; no synthetic pixels.
aliases={}
for d in ['front','back','left','right']:
 b=f'assets/heroes/normalized/gunner/run_{d}_b.webp';a=f'assets/heroes/normalized/gunner/run_{d}_a.webp'
 aliases[b]=a
payload={'schema':'storyworld-hero-render-metrics-r83','profiles':profiles,'aliases':aliases,'assetPixelsEdited':False,'method':'Original alpha >=24 source bounds plus manual neutral-background review; canonical idle guard bodies retain native barrier, curled gunner roll target44 vs standing66.'}
(ROOT/'qa/r83/hero-calibration-data.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
module='''/* R83: render-only hero crown/sole calibration. Physics, muzzle offsets,
 * authored source files, portraits, enemies and EGO remain native. */
(function(root){
 'use strict';
 const DATA=__DATA__;
 const coarse=root.matchMedia?.('(pointer: coarse)');
 const same=(a,b)=>a?.length===b?.length&&a.every((v,i)=>Math.abs(v-b[i])<.01);
 const counts={presentations:0,calibrated:0,guards:0,dashes:0,gaitAliases:0,rolls:0};let last=null;
 function present(input){
  if(coarse?.matches||(root.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')!=='off'||!input?.nativeHero5||!input.assetFrame)return null;
  const n=input.nativeHero5;
  if(!['hwando','slayer','seoha','neon','michaela','lauren','hunter','gunner'].includes(n.hero))return null;
  let frame=input,heightScale=1,guardBody=false,gaitAlias=false,calibrated=false;
  // A shield already has a native barrier. Avoid a second full-size spell
  // baked into a legacy guard bitmap, and use one anatomical idle silhouette.
  if(n.state==='guard'&&!['hwando','slayer'].includes(n.hero)){
   const idle=root.__STORYWORLD_PHASE1_ART__?.heroFrame(n.hero,'idle',n.direction,false);
   if(idle?.assetFrame&&idle?.nativeHero5){frame={...idle,nativeHero5:{...idle.nativeHero5,state:'guard',r83BodyFromState:'idle'}};guardBody=true;counts.guards++;}
  }
  // Legacy side dash sheets also contain a complete baked spell. The
  // original moving silhouette is a coherent body during the existing dash;
  // native movement, ghost trail, teleport and cooldown remain untouched.
  if(n.state==='dash'&&!['hwando','slayer','gunner'].includes(n.hero)){
   const moving=root.__STORYWORLD_PHASE1_ART__?.heroFrame(n.hero,'move',n.direction,false);
   if(moving?.assetFrame&&moving?.nativeHero5){frame={...moving,nativeHero5:{...moving.nativeHero5,state:'dash',r83BodyFromState:'move'}};counts.dashes++;}
  }
  const path=String(frame.path||'').replace(/^\\.\\//,''),alias=DATA.aliases[path];
  const profile=DATA.profiles[alias||path];
  // Metadata is tied to the exact source crop. It cannot leak to a new frame
  // with the same filename or to nonhero sprites through the generic renderer.
  if(profile&&(alias||same(frame.assetFrame.sourceRect,profile.sourceRect))){
   const assetFrame={...frame.assetFrame,pivot:[...profile.pivot],visibleHeight:profile.visibleHeight};
   if(alias){assetFrame.sourceRect=[...profile.sourceRect];gaitAlias=true;counts.gaitAliases++;}
   frame={...frame,path:alias||frame.path,assetFrame,nativeHero5:{...frame.nativeHero5,sourcePath:alias||frame.path,bodyHeightSourcePixels:profile.visibleHeight,r83RenderOnly:true}};
   calibrated=true;counts.calibrated++;
  }
  if(n.hero==='gunner'&&n.state==='dash'&&/\\/(player_roll|dash_left|dash_right)\\.webp$/.test(path)){heightScale=44/66;counts.rolls++;}
  if(frame===input&&!guardBody&&!gaitAlias&&!calibrated&&heightScale===1)return {frame:input,heightScale:1};
  counts.presentations++;
  last={hero:n.hero,state:n.state,direction:n.direction,path:frame.path,heightScale,guardBody,gaitAlias,calibrated,pivot:[...frame.assetFrame.pivot],visibleHeight:frame.assetFrame.visibleHeight};
  return {frame,heightScale};
 }
 root.StoryHeroPresentationR83=Object.freeze({present,inspect:()=>({revision:'hero-render-consistency-r83',renderOnly:true,bodyTarget:66,rollTarget:44,physicsChanged:false,sourcePixelsEdited:false,portraitsChanged:false,counts:{...counts},last:last?{...last}:null}),profiles:DATA.profiles,aliases:DATA.aliases});
})(typeof window!=='undefined'?window:globalThis);
'''.replace('__DATA__',json.dumps(payload,ensure_ascii=False,separators=(',',':')))
(ROOT/'client-source/hero-presentation-r83.js').write_text(module)
print(len(profiles),'metadata profiles;',len(aliases),'original pose aliases')
