"""Build R74 only over the exact released R73 runtime; retain source media."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = lambda b: hashlib.sha256(b).hexdigest()
BASE = {'index.html': '9b484eaecc4a4dc2d2e6e5140471c0403f933b1b003f3a46b65db8d2766a8d62',
        'dist/phase1.js': '913ac7a97a4166772cb8885a62d96687b44d5b5b9ff5da1387f096415e67e471'}


def once(text, old, new):
    if text.count(old) != 1:
        raise RuntimeError('R74 source anchor drift: ' + old[:100])
    return text.replace(old, new, 1)


def build(site):
    original = {name: (site / name).read_bytes() for name in BASE}
    if {name: SHA(data) for name, data in original.items()} != BASE:
        raise RuntimeError('R74 requires the exact released R73 baseline')
    html = original['index.html'].decode()
    old = "mobileDevice=/Android|iPhone|iPod|iPad/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1),desktopTouch="
    html = once(html, old, "mobileDevice=/Android|iPhone|iPod|iPad/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1)||(!/Windows/i.test(ua)&&navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches),desktopTouch=")
    # Cancel while the original solo room/actor are still current. Capturing
    # serializeSave first retained a temporary sword-dance position on return.
    html = once(html, "if(!booted)throw Error('게임 자료를 먼저 불러와 주세요.');savedSingle=",
                "if(!booted)throw Error('게임 자료를 먼저 불러와 주세요.');window.__STORYWORLD_GOLDEN_R72__?.cancelAll('coop-start');savedSingle=")
    html = once(html, 'if(guest())return result;for(const c of [...casts.values()])',
                "if(coopActive()){if(casts.size)cancelAll('coop-active');return result;}for(const c of [...casts.values()])")
    spec = importlib.util.spec_from_file_location('combat_r74', ROOT / 'scripts/combat-r74.py')
    combat = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(combat)
    html = combat.transform(html)
    for name in ['thread-dances', 'elements', 'interaction-core', 'mobile']:
        fragment = (ROOT / ('client-source/' + name + '-r74.js')).read_text()
        if '</script' in fragment.lower():
            raise RuntimeError('Unsafe R74 fragment')
        html += '\n<script id="' + name + '-r74">\n' + fragment + '\n</script>\n'
    result = {'index.html': html.encode(), 'dist/phase1.js': original['dist/phase1.js']}
    manifest_path = site / 'web-manifest-r62.json'
    manifest = json.loads(manifest_path.read_text())
    for name, data in result.items():
        row, = [r for r in manifest['files'] if r['path'] == name]
        if row['sha256'] != BASE[name]:
            raise RuntimeError('R74 manifest lineage drift')
        (site / name).write_bytes(data)
        row.update(sha256=SHA(data), bytes=len(data))
    manifest['webHTMLSha256'] = SHA(result['index.html'])
    manifest['totalBytes'] = sum(r['bytes'] for r in manifest['files'])
    manifest['r74'] = {'revision': 'R74-MOBILE-WORLD', 'baselineCommit': 'b9d48ed3d8a4b98965d7bf9d619dd7588a85b6fb', 'originalMediaChanged': False}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({name: SHA(data) for name, data in result.items()}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, required=True)
    build(parser.parse_args().site)
