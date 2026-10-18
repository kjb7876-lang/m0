"""Fail-closed R73 presentation fixes, over the pinned R71 renderer."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def once(source, old, new):
    if source.count(old) != 1:
        raise RuntimeError('R73 renderer anchor drift: ' + old[:130])
    return source.replace(old, new, 1)


def transform(source):
    start = source.index('function contextualWallOcclusion54(renderer,frame){')
    end = source.index('\nclass ThreeRenderer', start)
    source = source[:start] + (ROOT / 'client-source/wall-visibility-r73.js').read_text() + source[end:]
    # Material.clone copies userData but drops shader callbacks. A marker alone
    # must never suppress attaching the mask to an otherwise unhooked clone.
    source = once(source, 'if(!state||material.userData.sight24||!',
                  'if(!state||material.userData.sight24&&material.onBeforeCompile.__storySight24===state||!')
    source = once(source, "material.customProgramCacheKey=()=>key()+'|storyworld-sight24-'",
                  "material.onBeforeCompile.__storySight24=state;material.customProgramCacheKey=()=>key()+'|storyworld-sight24-'")
    source = once(source, 'const material=renderer.wallMaterial.clone(),trim=renderer.regionalTrimMaterial55.clone();',
                  'const material=cloneSpatialMaterialR73(renderer.wallMaterial),trim=cloneSpatialMaterialR73(renderer.regionalTrimMaterial55);')
    source = once(source, 'window.StoryPhase1=Object.freeze({mapPaletteR71,',
                  'window.StoryPhase1=Object.freeze({cloneSpatialMaterialR73,mapPaletteR71,')
    source = once(source, 'regional55:this.regionalStats55||null,',
                  'wallVisibilityR73:this.occlusionStats54||null,regional55:this.regionalStats55||null,')
    return source
