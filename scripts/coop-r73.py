"""Host-owned, bounded seed metadata on the existing cooperative transition."""
def once(source, old, new, count=1):
    if source.count(old) != count:
        raise RuntimeError('R73 cooperative anchor drift: ' + old[:100])
    return source.replace(old, new)


def transform(html):
    start = html.index('<script id="coop-sim-r62">')
    end = html.index('</script>', start)
    source = html[start:end]
    for point in ['route', 'goldenAim']:
        for axis in ['x', 'y']:
            source = once(source, f'cap(v.{point}.{axis},-100,100)', f'cap(v.{point}.{axis},-128,128)')
    old = "send('transition',{epoch,regionId:zone,layer})"
    source = once(source, old, "send('transition',{epoch,regionId:zone,layer,mazeR73:window.__STORYWORLD_MAZE_R73__.packet(zone,layer)})", 2)
    old = "const wantedLayer=message.layer||pendingSnapshot?.layer||layer||'STORY';if(mode==='guest'&&(zone!==message.regionId||layer!==wantedLayer||!started))"
    new = "const wantedLayer=message.layer||pendingSnapshot?.layer||layer||'STORY',mazeChanged=message.mazeR73?window.__STORYWORLD_MAZE_R73__.adopt(message.regionId,wantedLayer,message.mazeR73):mode==='guest'?window.__STORYWORLD_MAZE_R73__.adopt(message.regionId,wantedLayer,{version:1,seed:0}):false;if(mode==='guest'&&(mazeChanged||zone!==message.regionId||layer!==wantedLayer||!started))"
    source = once(source, old, new)
    html = html[:start] + source + html[end:]
    start = html.index('<script id="coop-client-r62">')
    end = html.index('</script>', start)
    source = html[start:end]
    source = source.replace('R63R1', 'R73R1')
    source = once(source, "send('start',{regionId,layer:", "send('start',{regionId,mazeR73:window.__STORYWORLD_MAZE_R73__.packet(regionId,sim()?.inspect?.().layer||layer),layer:")
    return html[:start] + source + html[end:]
