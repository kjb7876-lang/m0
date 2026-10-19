"""Scoped world renderer/lifecycle transforms over the pinned R73 source."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


def once(text, old, new):
    if text.count(old) != 1:
        raise RuntimeError('R74 world anchor drift: ' + old[:110])
    return text.replace(old, new, 1)


def transform(html, renderer):
    descriptor = json.dumps(json.loads((ROOT / 'client-source/art-r74.json').read_text()), ensure_ascii=False, separators=(',', ':'))
    common = 'globalThis.StoryArtR74=Object.freeze(' + descriptor + ');\n'
    common += (ROOT / 'client-source/world-profiles-r74.js').read_text()
    common += (ROOT / 'client-source/art-core-r74.js').read_text()
    renderer = once(renderer, 'function explorationLayout(id,', common + '\n' + (ROOT / 'client-source/world-layout-r74.js').read_text() + '\nfunction explorationLayout(id,theme="cave",safe=false,meta={}){return worldLayoutR74(baseExplorationLayoutR74(id,theme,safe,meta),id,theme,safe,meta);}\nfunction baseExplorationLayoutR74(id,')
    # The backdrop uses its own isolated material patch, never all 16 panels.
    renderer = once(renderer, 'floorRect:[0,0,b.width,b.height],tileWorld:b.tileWorld', 'floorRect:b.sourceRect||[0,0,b.width,b.height],tileWorld:b.tileWorld')
    renderer = once(renderer, 'const texture=sceneryAsset59.texture.clone();texture.generateMipmaps=true;', 'const texture=scenery59.sourceRect?regionalTexture55(T,sceneryAsset59.image,scenery59.sourceRect,this.renderer,this.spatialResources):sceneryAsset59.texture.clone();texture.generateMipmaps=true;')
    # Avoid old decorative wall openings/trim on the newly authored walls.
    renderer = once(renderer, 'WORLD_COORD_LIMIT_R73:128,', 'worldLayoutR74,WORLD_COORD_LIMIT_R73:128,')
    html = once(html, "key=id+':'+seed;", "version=mode==='off'?(window.__STORYWORLD_WORLD_R74__?.version(id,l)||0):0,key=id+':'+seed+':'+version;")
    html = once(html, '{...d?.meta,seedR73:seed}', '{...d?.meta,seedR73:seed,worldR74:version}')
    html = once(html, "frame=(window.__STORYWORLD_STORY_COMBAT_R54__?.extended(room,e)?", "frame=(e.r74Monster?window.__STORYWORLD_PHASE1_ART__?.enemy(e)?.frame:null)||(window.__STORYWORLD_STORY_COMBAT_R54__?.extended(room,e)?")
    # Native AI retains the actual attacks, cast admission and collision. Only
    # the bounded alert predicate replaces its short-distance wander gate.
    html = once(html, 'if(d>e.combatProfile.aggro||e.explorationGroup&&(d>7.15||distance(player,{x:e.homeX,y:e.homeY})>e.explorationLeash))', 'if(!(window.__STORYWORLD_WORLD_R74__?.pursuing(e)??false)&&(d>e.combatProfile.aggro||e.explorationGroup&&(d>7.15||distance(player,{x:e.homeX,y:e.homeY})>e.explorationLeash)))')
    html += '\n<script id="art-r74">\n' + common + '\n</script>\n'
    return html, renderer
