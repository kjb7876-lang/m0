#!/usr/bin/env python3
"""Compose the follow-up over exact published R71. Never rewrites pinned docs."""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_COMMIT = '9db96998e37aaed95c37e80fd4649b156837528a'
BASE_HTML = 'de6536bca2f3860c7195b39e4f7d1397ff8db7acb1558015f14a95c1b4e16646'
BASE_RENDERER = '54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c'
sha = lambda b: hashlib.sha256(b).hexdigest()


def once(s, old, new, count=1):
    if s.count(old) != count:
        raise RuntimeError('R72 source drift: ' + old[:160])
    return s.replace(old, new)


def fragment(name):
    source = (ROOT / 'client-source' / (name + '-r72.js')).read_text()
    if '</script' in source.lower():
        raise RuntimeError('Unsafe script terminator')
    return '<script id="' + name + '-r72">\n' + source + '\n</script>\n'


def transform(html):
    # Captured cooperative save/lifecycle functions must already include the new schema/routes.
    html = once(html, '<script id="coop-sim-r62">',
                ''.join(fragment(n) for n in ['golden-core', 'golden-save', 'routes']) + '<script id="coop-sim-r62">')
    # Never skip valid natural progression unless this exact, validated travel intent permits it.
    gate = "if(!options.restore&&!options.fastTravelR63&&id!==zone&&r.records?.length&&!r.safe){"
    html = once(html, gate, "const cheatTravelR72=options.travel777R72===true&&window.__STORYWORLD_CHEAT777__?.active()===true&&coopMode()!=='guest'&&canTravel()&&!storyScene;const previousR72=options.r72Portal==='previous'&&window.__STORYWORLD_ROUTES_R72__?.permit(id,'previous',l)===true;\n  if(cheatTravelR72&&id!==zone&&r.records?.length&&!r.safe&&!options.difficultyR63&&!options.fastTravelR63)return picker.call(this,id,from,options);\n  if(!cheatTravelR72&&!previousR72&&" + gate[3:])
    # Confirm through the complete wrapper chain; fastTravelR63 prevents opening the picker twice.
    html = once(html, 'const entered=r71EnterCampaignBase.call(context,id,from,', 'const entered=enterRegion.call(context,id,from,')
    html = once(html, "async function activate(code){if(String(code)", "async function activate(code){if(window.__STORYWORLD_COOP_SIM_R62__?.mode()==='guest')return{ok:false,message:'777 적용과 지도 이동은 방장만 확정합니다.'};if(String(code)")
    old = "const oldLayer=layer;closePanel(true);layer=nextLayer;try{await enterRegion(id,null);note({kind:'travel',id,layer});return zone===id;}catch(error){layer=oldLayer;throw error;}"
    new = "if(window.__STORYWORLD_COOP_SIM_R62__?.mode()==='guest'){toast('지도 이동은 방장만 확정합니다.',3);return false;}closePanel(true);try{const entered=await enterRegion(id,null,{layer:nextLayer,travel777R72:true});const pending=window.__STORYWORLD_PROGRESSION_R71__?.difficultyState?.().open===true;const ok=entered===true&&zone===id&&layer===nextLayer&&!loading;note({kind:ok?'travel':pending?'travel-pending':'travel-failed',id,layer:nextLayer});if(!ok&&!pending)toast('지역 이동을 완료하지 못했습니다. 목적지와 현재 봉인 상태를 확인하세요.',4);return ok;}catch(error){toast('지역 이동 실패: '+error.message,4);return false;}"
    html = once(html, old, new)
    html = once(html, "async function go(id,nextLayer=layer){if(!enabled||switching||loading||player.hp<=0||!Object.hasOwn(regionById,id)||!['STORY','DREAM'].includes(nextLayer))return false;", "async function go(id,nextLayer=layer){if(!enabled||switching||loading||player.hp<=0||!Object.hasOwn(regionById,id)||!['STORY','DREAM'].includes(nextLayer)){toast('이동할 수 없습니다. 777 활성화·목적지·세계·로딩·생존 상태를 확인하세요.',4);note({kind:'travel-invalid',id:String(id).slice(0,80)});return false;}")
    # Keep the 777 slot load after the later title-screen controller replaces loadLocal.
    html = once(html, 'active:()=>enabled,activate,leave,go,panel,applyCaps,inspect:', "active:()=>enabled,activate,leave,go,panel,applyCaps,load:async()=>{const text=localStorage.getItem(SLOT);if(!text)throw Error('777 별도 저장이 없습니다.');return restoreSave(JSON.parse(text));},inspect:")
    html = once(html, 'loadLocal=()=>continueRun();', 'loadLocal=()=>window.__STORYWORLD_CHEAT777__?.active()?window.__STORYWORLD_CHEAT777__.load():continueRun();')
    # The early 777 closure predates later progression/save schemas. Take and restore
    # its normal-return checkpoint through the complete current save chain.
    html = once(html, 'normalReturn=serializeBase();enabled=true;', 'normalReturn=serializeSave();enabled=true;')
    html = once(html, 'normalReturn=started&&player?serializeBase():raw.cheat777.normalReturn||null;', 'normalReturn=started&&player?serializeSave():raw.cheat777.normalReturn||null;')
    html = once(html, 'await restoreBase(copy(backup));normalReturn=null;', 'await restoreSave(copy(backup));normalReturn=null;')
    # Existing silver dance cannot interleave teleports with the golden scheduler.
    html = once(html, 'function cast(manual=false){const p=actorNow(),c=', 'function cast(manual=false){const p=actorNow();if(window.__STORYWORLD_GOLDEN_R72__?.isCasting(p))return false;const c=')
    # Update only the cooperative adapter script, leaving older source snapshots untouched.
    start = html.index('<script id="coop-sim-r62">')
    end = html.index('</script>', start)
    source = html[start:end]
    source = once(source, "'egoPoseR62'];", "'egoPoseR62','goldenR72','goldenReadyAtR72'];")
    source = once(source, "'passivePointRevisionR64'];", "'passivePointRevisionR64','r72Entry'];")
    source = once(source, "['level','xp','points','upgrades','progressionR62']", "['level','xp','points','upgrades','progressionR62','goldenR72','goldenReadyAtR72']")
    source = once(source, "'threadDance']", "'threadDance','goldenCast','goldenSecond']", 3)
    source = once(source, 'threadDance:pending.threadDance===true,', 'threadDance:pending.threadDance===true,goldenCast:pending.goldenCast===true,goldenSecond:pending.goldenSecond===true,')
    silver = "if(cmd.threadDance&&!safeRegion())window.__STORYWORLD_CAMPAIGN_R63R1__?.cast(true);"
    source = once(source, silver, silver + "if(cmd.goldenCast||cmd.goldenSecond)window.__STORYWORLD_GOLDEN_R72__?.cast(cmd.goldenSecond?1:0);", 2)
    source = once(source, "if(!cmd.threadDance)window.__STORYWORLD_CAMPAIGN_R63R1__?.autoCast();", "if(!cmd.goldenCast&&!cmd.goldenSecond)window.__STORYWORLD_GOLDEN_R72__?.autoCast();if(!cmd.threadDance)window.__STORYWORLD_CAMPAIGN_R63R1__?.autoCast();")
    source = once(source, "m.actor.connectedR62=connected;const l=lane(m.actor);", "m.actor.connectedR62=connected;m.actor.goldenR72=StoryGoldenCoreR72.sanitize(m.actor.goldenR72);m.actor.goldenReadyAtR72=time+Math.max(0,Math.min(24,(Number(m.actor.goldenReadyAtR72)||time)-time));const l=lane(m.actor);")
    # Commands retain the relay-provided actor identity, epoch and monotonic command sequence.
    source = once(source, "case'command':if(isHost()", "case'command':if(isHost()&&message.epoch===epoch&&message.command?.kind==='golden'){const p=members.get(message.playerId)?.actor,seen='command:'+message.playerId+':'+message.seq;if(p&&!seenEvents.has(seen)){seenEvents.add(seen);while(seenEvents.size>512)seenEvents.delete(seenEvents.values().next().value);withPlayer(p,()=>window.__STORYWORLD_GOLDEN_R72__?.applyCommand(p,message.command.action));saveGame(false);sendSnapshot();}break;}if(isHost()")
    source = once(source, 'function requestPassive(id){', "function requestGolden(action){if(isHost())return window.__STORYWORLD_GOLDEN_R72__?.applyCommand(local(),action).ok===true;return mode==='guest'&&send('command',{seq:++commandSequence,epoch,command:{kind:'golden',action}});}\n function requestPassive(id){")
    source = once(source, 'authoritativeRegionLoad,requestPassive,', 'authoritativeRegionLoad,requestPassive,requestGolden,')
    html = html[:start] + source + html[end:]
    html += '\n' + fragment('golden-thread')
    if len(re.findall(r'<script\b', html)) != len(re.findall(r'</script\s*>', html)):
        raise RuntimeError('Unbalanced script tags')
    return html


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, required=True)
    args = parser.parse_args()
    site = args.site.resolve()
    if site == ROOT / 'docs':
        raise RuntimeError('Do not modify pinned source docs')
    old = (site / 'index.html').read_bytes()
    renderer = (site / 'dist/phase1.js').read_bytes()
    if sha(old) != BASE_HTML or sha(renderer) != BASE_RENDERER:
        raise RuntimeError('Expected exact public R71; repeated application or baseline drift')
    manifest = json.loads((site / 'web-manifest-r62.json').read_text())
    if not manifest.get('r71') or manifest.get('r72') or manifest['webHTMLSha256'] != BASE_HTML:
        raise RuntimeError('Unexpected manifest lineage')
    new = transform(old.decode()).encode()
    row, = [r for r in manifest['files'] if r['path'] == 'index.html']
    if row['sha256'] != BASE_HTML or row['bytes'] != len(old):
        raise RuntimeError('Manifest disagrees with R71 HTML')
    row.update(sha256=sha(new), bytes=len(new))
    manifest['webHTMLSha256'] = sha(new)
    manifest['totalBytes'] = sum(r['bytes'] for r in manifest['files'])
    manifest['r72'] = {'baselineCommit': BASE_COMMIT, 'revision': 'R72-GOLDEN', 'mediaChanged': False, 'rendererChanged': False, 'changedFiles': ['index.html'], 'deploymentAuthorized': False}
    (site / 'index.html').write_bytes(new)
    (site / 'web-manifest-r62.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': 'R72_OVERLAY_APPLIED', 'htmlSHA256': sha(new), 'rendererSHA256': sha(renderer), 'files': len(manifest['files'])}))


if __name__ == '__main__':
    main()
