"""Apply the new canonical narrative to the exact R74 release, reproducibly."""
import argparse
import importlib.util
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('story_r75', ROOT / 'scripts/story-r75.py')
story = importlib.util.module_from_spec(spec)
spec.loader.exec_module(story)
BASE = {'index.html': 'f4e26c35c9ade6cc44b3935c5d6e461fb9f5fe1ac9a831d1f0ed085dd7e8cddb',
        'dist/phase1.js': 'e9faecbadc4991d2e4cfd8a5ec8555ad331d4a09e6ffc12b7ef9d1ed1e9a09bc'}


def once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('R75 source anchor drift: ' + old[:140])
    return text.replace(old, new, 1)


def script_json(text, name):
    match = re.search(r'(<script[^>]*id="' + re.escape(name) + r'"[^>]*>)(.*?)(</script>)', text, re.S)
    if not match:
        raise ValueError('Missing JSON script: ' + name)
    return match, json.loads(match[2])


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def transform(html, renderer):
    runtime, voice = story.contract()
    art = json.loads((ROOT / 'client-source/art-r75.json').read_text())
    match, portable = script_json(html, 'portable-data')
    old_text = portable['text']['data/story-rc51.js']
    old_raw = json.loads(old_text[old_text.index('{'):old_text.rindex('}') + 1])
    world_text = portable['text']['data/world-v31217.js']
    evaluated = subprocess.run(['node', '-e', "const vm=require('node:vm'),fs=require('node:fs'),box={};vm.runInNewContext(fs.readFileSync(0,'utf8'),{window:box,globalThis:box});process.stdout.write(JSON.stringify(box.__MONGSE_WORLD_V31217__));"],
                               input=world_text, capture_output=True, text=True, timeout=10, check=True)
    old_world = json.loads(evaluated.stdout)
    # Reproduce the old native compile order solely for balance indices. New
    # narrative ordinals must not silently increase existing actors' HP.
    native_order = ['hub']
    metas = {m['id']: m for m in old_world['zones']}
    for r in sorted(old_raw['records'], key=lambda r: float(r.get('index') or 0)):
        if r.get('zone') and (r.get('pre') or r.get('post') or r.get('paragraphs')) and r['zone'] not in native_order:
            native_order.append(r['zone'])
    for meta in sorted(old_world['zones'], key=lambda m: m.get('order', 0)):
        if meta['id'] in native_order or meta['id'] == 'village': continue
        at = next((i for i, id in enumerate(native_order) if metas.get(id, {}).get('order', float('inf')) > meta['order']), -1)
        if at < 1: at = len(native_order)
        native_order.insert(at, meta['id'])
    native_order.append('village')
    balances = {id: i for i, id in enumerate(native_order)}
    start = html.index('window.__STORYWORLD_CAMPAIGN_DATA_R54__=')
    end = html.index(';\n', start)
    baseline = json.loads(html[start:end].split('=', 1)[1])
    old_profiles = {p['id']: p for p in baseline['profiles']}
    profiles = []
    records = []
    chapters = list(dict.fromkeys(r['chapter'] for r in runtime['records']))
    for row in runtime['records']:
        parent = old_profiles[row['legacyZoneId'] or 'ep1a09']
        canonical = {'zone': row['zoneId'], 'sceneId': row['sceneId'], 'index': row['ordinal'],
                     'title': row['title'], 'chapter': row['chapter'], 'narrator': row['narratorLabel'],
                     'paragraphs': row['body'].split('\n\n'), 'rest': row['rest'], **row['parts']}
        canonical['voiceSource'] = {v['part']: v['text'] for v in voice['scenes'] if v['sceneId'] == row['sceneId']}
        records.append(canonical)
        profiles.append({**parent, 'id': row['zoneId'], 'sceneId': row['sceneId'], 'index': row['ordinal'],
                         'balanceIndexR75': balances[row['legacyZoneId'] or 'ep1a09'],
                         'title': row['title'], 'chapter': row['chapter'], 'chapterIndex': chapters.index(row['chapter']),
                         'previous': row['previousZone'], 'next': row['nextZone'], 'rest': row['rest'],
                         'sourceWorld': {**parent['sourceWorld'], 'id': row['zoneId'], 'order': row['ordinal'],
                                         'storySourceR75': story.SOURCE_SHA, 'objectiveR75': row['objective'],
                                         **({'environmentKey': 'past-palace-rescue', 'topology': 'palace-rescue-memory'} if row['sceneId'] == '09-2' else {})},
                         'canonicalRecord': canonical})
    baseline.update(recordCount=62, combatRecordCount=56, restRecordCount=6, campaignRegionCount=64,
                    portalOrder=runtime['portalOrder'], chapterOrder=chapters, profiles=profiles,
                    narrativeSource=runtime['source'])
    html = html[:start] + 'window.__STORYWORLD_CAMPAIGN_DATA_R54__=' + compact(baseline) + html[end:]
    new_raw = {'version': 'R75', 'sourceSha256': story.SOURCE_SHA, 'sourceFile': runtime['source']['file'],
               'records': records, 'specialTexts': runtime['specialTexts'],
               'openingVoice': {'opening': {'paragraphs': runtime['specialTexts']['prologue.pre'].split('\n\n')},
                                'root': {'paragraphs': runtime['specialTexts']['prologue.post'].split('\n\n')}}}
    portable['text']['data/story-rc51.js'] = 'window.__HAPIL_STORY_DATA_RC51__=' + compact(new_raw) + ';\n'
    # Old narration files remain archival media, but cannot be selected by R75.
    portable['text']['assets/story-narration/v1/manifest.json'] = compact({
        'schema': 'storyworld.narration-r75/v1', 'sourceSha256': story.SOURCE_SHA,
        'scenes': {}, 'originals': {}, 'coverage': {'mode': 'partial', 'reason': 'awaiting shared Qwen audio'}})
    portable['narrativeSourceR75'] = runtime['source']
    match, _ = script_json(html, 'portable-data')
    html = html[:match.start(2)] + compact(portable) + html[match.end(2):]
    for old, new in [
        ('data.recordCount!==61||data.portalOrder.length!==63', 'data.recordCount!==62||data.portalOrder.length!==64'),
        ('recordCount:61,combatRegions:55,restRecords:6,totalRegions:63', 'recordCount:62,combatRegions:56,restRecords:6,totalRegions:64'),
        ('recordCount:61,portalOrder:[...order]', 'recordCount:62,portalOrder:[...order]'),
        ('r.balanceIndexR54=r.balanceIndexR54??r.index', 'r.balanceIndexR54=data.profiles.find(p=>p.id===id)?.balanceIndexR75??r.balanceIndexR54??r.index'),
        ('8개 부 · 61개 기억 · 55개 전투 지역', '8개 부 · 62개 기억 · 56개 전투 지역'),
        ('병원에서 다듬은 전투와 함께 마지막 코어까지 이어지는 여정', '각자의 세계와 자유의지를 지키는 여정'),
        ('src="./dist/phase1.js?r74=1"', 'src="./dist/phase1.js?r75=1"'),
        ("String(r.index).padStart(2,'0')", "String(r.sceneId||r.index).padStart(2,'0')"),
        ('if (row.records.length && progressValue?.[layerValue]?.[row.id] !== true) break;',
         'if (row.records.length && progressValue?.[layerValue]?.[row.id] !== true && !window.__STORYWORLD_NARRATIVE_R75__?.legacyEligible(row.id,layerValue,progressValue)) break;'),
    ]:
        html = once(html, old, new)
    # R54 used to overwrite the selected speaker/body contract after alignment.
    html = once(html, "for(const r of canonicalRecords){r.voiceSource={};for(const part of ['pre','post','firstPost','awakenPre'])r.voiceSource[part]=r[part]||'';}",
                "for(const r of canonicalRecords)r.voiceSource={...r.voiceSource};")
    # Existing ending/hidden paths are replaced with exact source text.
    html = html.replace('외부의 악을 넘어, 내 욕망의 순수악의가 거울에서 깨어난다.\\n\\n제단의 거울과 마주해 마지막 기억을 잇는다.', runtime['specialTexts']['hidden.persona'])
    html = html.replace('사후의 나 · 히든 결전', '사몽 · 히든 결전')
    html = html.replace('다시 잠에 들 시간이에요...!', runtime['specialTexts']['return.sleep'])
    # Admission lives inside captured automatic/manual cast closures, before
    # any queue/cooldown mutation. Filtering also protects secondary strikes.
    html = once(html, "function validTargets(range=11){return window.__STORYWORLD_R66__.selectTargets(liveEnemies(),actorNow(),range,distance);}",
                "function validTargets(range=11){return window.__STORYWORLD_R66__.selectTargets(liveEnemies().filter(e=>window.__STORYWORLD_DANCE_POLICY_R75__?.target('native',e,actorNow())??true),actorNow(),range,distance);}")
    html = once(html, "const secondary=liveEnemies().filter(e=>e!==target&&e.hp>0&&!e.deadRecorded&&room.enemies.includes(e))",
                "const secondary=liveEnemies().filter(e=>e!==target&&e.hp>0&&!e.deadRecorded&&room.enemies.includes(e)&&(window.__STORYWORLD_DANCE_POLICY_R75__?.target('native',e,p)??true))")
    html = once(html, "function cast(k,index=0,aim=null,manual=true){const p=local();if(!p||!off())return false;",
                "function cast(k,index=0,aim=null,manual=true){const p=local();if(!p||!off()||!(window.__STORYWORLD_DANCE_POLICY_R75__?.can(k,p)??true))return false;")
    html = once(html, "if(!off()||!started||loading||modal||safeRegion()||interrupted(p))return false;const s=state(k,p)",
                "if(!off()||!started||loading||modal||safeRegion()||interrupted(p)||!(window.__STORYWORLD_DANCE_POLICY_R75__?.can(k,p)??true))return false;const s=state(k,p)")
    dance_match = re.search(r'(<script id="thread-dances-r74">)(.*?)(</script>)', html, re.S)
    dance_fragment = once(dance_match[2], "const selected=room.enemies.find(e=>e.id===target&&e.hp>0&&e.spawnState==='active'),near=liveEnemies().filter(e=>distance(p,e)<=12)",
                          "const allowed=e=>window.__STORYWORLD_DANCE_POLICY_R75__?.target(k,e,p)??true,selected=room.enemies.find(e=>e.id===target&&e.hp>0&&e.spawnState==='active'&&allowed(e)),near=liveEnemies().filter(e=>distance(p,e)<=12&&allowed(e))")
    html = html[:dance_match.start(2)] + dance_fragment + html[dance_match.end(2):]
    # Enemy delta clocks and absolute owner deadlines share one local factor.
    start = html.index('tickEnemies=function(dt){\n if(room.encounterStage')
    end = html.index('\n};\nconst v2Blocked3', start) + 3
    enemy_tick = html[start:end]
    enemy_tick = once(enemy_tick, 'tickEnemies=function(dt){', 'tickEnemies=function(frameDT){const dt=frameDT;')
    enemy_tick = once(enemy_tick, 'for(const e of room.enemies){e.flash=', "for(const e of room.enemies){const dt=frameDT*(window.__STORYWORLD_SAMONG_R75__?.factor(e)??1);e.flash=")
    enemy_tick = once(enemy_tick, 'moveAI3(e,wander,dt*.5)', 'moveAI3(e,wander,frameDT*.5)')
    enemy_tick = once(enemy_tick, 'moveAI3(e,goal,dt)', 'moveAI3(e,goal,frameDT)')
    html = html[:start] + enemy_tick + html[end:]
    clocks = {
        'hospital-charge-r52': "const s=states.get(e);if(s){shift(s,['nextCharge','nextSwing']);shift(s.action,['r52Start']);}",
        'hospital-boss-r53': "const p=plans.get(e);if(p){shift(p,['releaseAt','summonAt']);shift(roomState(),['nextAt']);}",
        'story-combat-r54': "const s=states.get(e);if(s){shift(s.prepared,['at','releaseAt']);shift(s.released,['at']);shift(s.recovery,['at']);}",
        'regional-combat-r58': "const s=states.get(e);if(s)shift(s.range,['preparedAt','releasedAt']);",
        'combat-fields-r61': "const s=states.get(e);if(s)shift(s,['next']);",
        'boss-fields-r62': "const s=owners.get(e);if(s)shift(s,['next']);for(const c of casts.values())if(c.owner===e){shift(c,['start']);for(const l of c.ledgers.values())shift(l,['next']);}",
    }
    for script_id, code in clocks.items():
        pattern = r'(<script id="' + script_id + r'">)(.*?)(</script>)'
        match = re.search(pattern, html, re.S)
        at = match[2].rindex('})();')
        fragment = match[2][:at] + '(window.__STORYWORLD_ENEMY_CLOCKS_R75__??=[]).push((e,shift)=>{' + code + '});\n' + match[2][at:]
        html = html[:match.start(2)] + fragment + html[match.end(2):]
    html = once(html, "if(c.room!==room||c.layer!==layer||interrupted(c.p)){cancel(c.kind,c.p,'lifecycle');return;}",
                "if(c.room!==room||c.layer!==layer||interrupted(c.p)||!(window.__STORYWORLD_DANCE_POLICY_R75__?.can(c.kind,c.p)??true)){cancel(c.kind,c.p,'lifecycle');return;}")
    dance_match = re.search(r'(<script id="thread-dances-r74">)(.*?)(</script>)', html, re.S)
    dance_fragment = once(dance_match[2], "const victims=liveEnemies().filter(e=>!e.deadRecorded&&C.distance(e,v.a,v.b)<=.65&&clearLine(v.b,e))",
                          "const victims=liveEnemies().filter(e=>!e.deadRecorded&&C.distance(e,v.a,v.b)<=.65&&clearLine(v.b,e)&&(window.__STORYWORLD_DANCE_POLICY_R75__?.target(c.kind,e,c.p)??true))")
    html = html[:dance_match.start(2)] + dance_fragment + html[dance_match.end(2):]
    # New map inherits palace materials without becoming a second current boss.
    profile_anchor = 'globalThis.StoryWorldProfilesR74=Object.freeze('
    at = renderer.index(profile_anchor) + len(profile_anchor)
    stop = renderer.index(');', at)
    world_profiles = json.loads(renderer[at:stop])
    world_profiles['profiles']['ep1a09b'] = {**world_profiles['profiles']['dist03'], 'style': 'past-palace-rescue', 'sourceEnvironment': 'past-palace-rescue', 'sourceTopology': 'palace-rescue-courtyard'}
    renderer = renderer[:at] + compact(world_profiles) + renderer[stop:]
    # The HTML also exports this shared profile table; keep it identical so
    # the later client export cannot overwrite the renderer's new map entry.
    at = html.index(profile_anchor) + len(profile_anchor)
    stop = html.index(');', at)
    html = html[:at] + compact(world_profiles) + html[stop:]
    terrain_anchor = 'const REGIONAL_TERRAIN_ART=Object.freeze('
    at = renderer.index(terrain_anchor) + len(terrain_anchor)
    stop = renderer.index(');', at)
    terrain = json.loads(renderer[at:stop])
    terrain['ep1a09b'] = {**terrain['dist03'], 'environment': 'past-palace-rescue'}
    renderer = renderer[:at] + compact(terrain) + renderer[stop:]
    plan = (ROOT / 'client-source/world-plan-r75.js').read_text()
    layout = (ROOT / 'client-source/world-layout-r74.js').read_text().replace('function worldLayoutR74(', 'function worldLayoutR75(')
    layout = once(layout, "if(meta.worldR74!==1||", "if(meta.worldR75!==1||")
    layout = once(layout, 'for(let y=0;y<3;y++)for(let x=0;x<4;x++)add(38+x*(indoor?shape[0]:21),12+y*(indoor?shape[1]:20),x+y);\n add(Math.min(113,nodes[11].x+10),Math.min(70,nodes[11].y+13),3);',
                  'const plan=worldPlanR75(profile,safe);for(let i=0;i<plan.points.length;i++){const[x,y]=plan.points[i];add(x,y,i);}')
    layout = once(layout, 'const link=(a,b)=>', 'const link=(a,b,w=plan.width)=>')
    layout = once(layout, 'edges.push([a,b,width])', 'edges.push([a,b,w])')
    layout = once(layout, 'for(let y=0;y<3;y++)for(let x=0;x<3;x++)link(y*4+x,y*4+x+1);\n for(const[a,b]of[[0,4],[3,7],[4,8],[7,11],[1,5],[5,9],[2,6],[6,10],[11,12]])link(a,b);',
                  'for(const[a,b,w]of plan.links)link(a,b,w);')
    layout = once(layout, 'a===0||a===11||b===12', 'a===0||a===nodes.length-2||b===nodes.length-1')
    layout = once(layout, 'const[a,b]=edges[i],p=nodes[a]', 'const[a,b,edgeWidth]=edges[i],p=nodes[a]')
    layout = once(layout, 'const flank=Math.max(.15,(Math.ceil(width)-gap)/2)', 'const flank=Math.max(.15,(Math.ceil(edgeWidth)+1-gap)/2)')
    layout = once(layout, "worldR74:{version:1,mode:profile.mode", "worldR75:{version:1,family:plan.family,sourceTopology:plan.sourceTopology},worldR74:{version:1,mode:profile.mode")
    renderer = once(renderer, 'function explorationLayout(id,theme="cave",safe=false,meta={}){return worldLayoutR74(baseExplorationLayoutR74(id,theme,safe,meta),id,theme,safe,meta);}',
                    plan + '\n' + layout + '\nfunction explorationLayout(id,theme="cave",safe=false,meta={}){const base=baseExplorationLayoutR74(id,theme,safe,meta);return meta.worldR75===1?worldLayoutR75(base,id,theme,safe,meta):worldLayoutR74(base,id,theme,safe,meta);}')
    html = once(html, "key=id+':'+seed+':'+version;", "r75version=mode==='off'?(window.__STORYWORLD_WORLD_R75__?.version(id,l)||0):0,key=id+':'+seed+':'+version+':r75:'+r75version;")
    html = once(html, '{...d?.meta,seedR73:seed,worldR74:version}', '{...d?.meta,seedR73:seed,worldR74:version,worldR75:r75version}')
    tone = (ROOT / 'client-source/tone-r75.js').read_text()
    renderer = once(renderer, 'class RenderBridge', tone + '\nclass RenderBridge')
    renderer = once(renderer, 'this.camera.layers.set(1);this.renderer.render(this.scene,this.camera);', 'samongTerrainToneR75(this);this.camera.layers.set(1);this.renderer.render(this.scene,this.camera);')
    html = once(html, 'canUse,use,pursuing,atlasFrame,clean,inspect:', 'canUse,use,isOpen,pursuing,atlasFrame,clean,inspect:')
    html += '\n<script id="story-data-r75">window.__STORYWORLD_STORY_DATA_R75__=' + compact(runtime) + ';window.__STORYWORLD_VOICE_CONTRACT_R75__=' + compact(voice) + ';window.__STORYWORLD_ART_R75__=' + compact(art) + ';</script>\n'
    for name in ['story', 'dance-policy', 'world', 'doors', 'guide', 'samong']:
        fragment = (ROOT / ('client-source/' + name + '-r75.js')).read_text()
        if '</script' in fragment.lower(): raise ValueError('Unsafe R75 script')
        html += '\n<script id="' + name + '-r75">\n' + fragment + '\n</script>\n'
    return html, renderer


def build(site):
    data = {k: (site / k).read_bytes() for k in BASE}
    if {k: story.SHA(v) for k, v in data.items()} != BASE:
        raise ValueError('R75 requires the exact released R74 baseline')
    html, renderer = transform(data['index.html'].decode(), data['dist/phase1.js'].decode())
    result = {'index.html': html.encode(), 'dist/phase1.js': renderer.encode()}
    manifest_path = site / 'web-manifest-r62.json'
    manifest = json.loads(manifest_path.read_text())
    for path, value in result.items():
        row, = [r for r in manifest['files'] if r['path'] == path]
        if row['sha256'] != BASE[path]: raise ValueError('R75 manifest lineage drift')
        (site / path).write_bytes(value)
        row.update(bytes=len(value), sha256=story.SHA(value))
    manifest['webHTMLSha256'] = story.SHA(result['index.html'])
    art = json.loads((ROOT / 'client-source/art-r75.json').read_text())
    for descriptor in [art, art['npcs']]:
        media = (ROOT / 'client-assets/r75' / Path(descriptor['path']).name).read_bytes()
        if len(media) != descriptor['bytes'] or story.SHA(media) != descriptor['sha256']:
            raise ValueError('R75 original image mismatch')
        if any(r['path'] == descriptor['path'] for r in manifest['files']):
            raise ValueError('R75 asset would overwrite a prior file')
        target = site / descriptor['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(media)
        manifest['files'].append({k: descriptor[k] for k in ['path', 'bytes', 'sha256']})
    manifest['fileCount'] = len(manifest['files'])
    manifest['totalBytes'] = sum(r['bytes'] for r in manifest['files'])
    manifest['largest'] = sorted(manifest['files'], key=lambda r: r['bytes'], reverse=True)[:20]
    manifest['r75'] = {'baselineCommit': '3f5693f0dff5a69dd65dbd2a2f95a758321293c8',
                       'sourceSha256': story.SOURCE_SHA, 'scenes': 62, 'regions': 64,
                       'audioApplied': False, 'originalMediaChanged': False}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: story.SHA(v) for k, v in result.items()}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, required=True)
    build(parser.parse_args().site)
