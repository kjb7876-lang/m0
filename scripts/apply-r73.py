#!/usr/bin/env python3
"""Reproducible opt-in R73 build over exact preserved R72 candidate bytes."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = lambda b: hashlib.sha256(b).hexdigest()
BASE_HTML = '73e0be074333bd46bcee52bbb50f37187f6d19c4aa365deaf49096a0aeb5fc18'
BASE_RENDERER = '54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c'


def build(site):
    original = {'index.html': (site / 'index.html').read_bytes(), 'dist/phase1.js': (site / 'dist/phase1.js').read_bytes()}
    if SHA(original['index.html']) != BASE_HTML or SHA(original['dist/phase1.js']) != BASE_RENDERER:
        raise RuntimeError('R73 requires exact preserved R72 candidate')
    spec = importlib.util.spec_from_file_location('render_r73', ROOT / 'scripts/render-r73.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    renderer = module.transform(original['dist/phase1.js'].decode()).encode()
    html = original['index.html'].decode()
    # Route only the normal native save and its backup. The immutable legacy
    # key and independently captured 777 SLOT retain their original meanings.
    html = html.replace('localStorage.getItem(SAVE)', 'localStorage.getItem(normalSaveKeyR73())')
    html = html.replace('localStorage.setItem(SAVE,', 'localStorage.setItem(normalSaveKeyR73(),')
    html = html.replace('localStorage.removeItem(SAVE)', 'localStorage.removeItem(normalSaveKeyR73())')
    html = html.replace('localStorage.getItem(backupKey)', 'localStorage.getItem(normalSaveKeyR73("backup"))')
    html = html.replace('localStorage.setItem(backupKey,', 'localStorage.setItem(normalSaveKeyR73("backup"),')
    anchor = "const SAVE='hapil.storyworld.canonical-r54.20261016.save',"
    if html.count(anchor) != 1:
        raise RuntimeError('R73 normal save anchor drift')
    html = html.replace(anchor, "function normalSaveKeyR73(kind='save'){return window.__STORYWORLD_SAVE_SLOTS_R73__?.key(kind)||(kind==='backup'?SAVE+'.previous':SAVE);}\n" + anchor)
    # Keep the old target save until a complete new journey has actually saved.
    old = "localStorage.removeItem(normalSaveKeyR73());holdSave=true;stage='첫 기억"
    if html.count(old) != 1:
        raise RuntimeError('R73 new journey transaction anchor drift')
    html = html.replace(old, "holdSave=true;stage='첫 기억")
    # The current slot confirmation replaces the historical second prompt.
    # Keep its old save intact until the new journey commits atomically.
    old = 'if (hasV5Save() && !pendingOverwrite5)'
    if html.count(old) != 1:
        raise RuntimeError('R73 legacy overwrite prompt anchor drift')
    html = html.replace(old, 'if (hasV5Save() && !pendingOverwrite5 && !window.__STORYWORLD_SAVE_SLOTS_R73__?.confirmedNew())')
    old = 'if (pendingOverwrite5) { try { localStorage.removeItem(normalSaveKeyR73()); }'
    if html.count(old) != 1:
        raise RuntimeError('R73 legacy overwrite deletion anchor drift')
    html = html.replace(old, 'if (pendingOverwrite5 && !window.__STORYWORLD_SAVE_SLOTS_R73__?.confirmedNew()) { try { localStorage.removeItem(normalSaveKeyR73()); }')
    old = "stage='playing';if(!storyScene)closePanel(true);saveGame(false);note('new-campaign'"
    if html.count(old) != 1:
        raise RuntimeError('R73 new journey commit anchor drift')
    html = html.replace(old, "stage='playing';if(!storyScene)closePanel(true);if(!saveGame(false))throw Error('새 여정을 저장하지 못했습니다. 기존 진행은 보존합니다.');note('new-campaign'")
    old = 'const ready=booted&&!!player&&!!room,h=ready?heroArtForDraw():null;'
    if html.count(old) != 1:
        raise RuntimeError('R73 stable render snapshot anchor drift')
    html = html.replace(old, 'const ready=booted&&started&&!loading&&!!player&&room?.id===zone&&room?.layer===layer,h=ready?heroArtForDraw():null;')
    fragment = (ROOT / 'client-source/save-slots-r73.js').read_text()
    if '</script' in fragment.lower() or html.count('</body>') != 1:
        raise RuntimeError('Unsafe R73 script fragment')
    html = html.replace('</body>', '<script id="save-slots-r73">\n' + fragment + '\n</script>\n</body>')
    if html.count('dist/phase1.js?r71=1') != 1:
        raise RuntimeError('R73 renderer cache anchor drift')
    html = html.replace('dist/phase1.js?r71=1', 'dist/phase1.js?r73=1').encode()
    manifest = json.loads((site / 'web-manifest-r62.json').read_text())
    for name, value in {'index.html': html, 'dist/phase1.js': renderer}.items():
        row, = [r for r in manifest['files'] if r['path'] == name]
        if row['sha256'] != SHA(original[name]):
            raise RuntimeError('R73 manifest lineage mismatch')
        row['sha256'] = SHA(value)
        row['bytes'] = len(value)
        (site / name).write_bytes(value)
    manifest['webHTMLSha256'] = SHA(html)
    manifest['totalBytes'] = sum(r['bytes'] for r in manifest['files'])
    manifest['r73'] = {'revision': 'R73-BOOTLOADER', 'baselineCandidate': 'c011601795a8557e22bd144b7386e08b8c6169dc', 'mediaChanged': False}
    (site / 'web-manifest-r62.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'htmlSHA256': SHA(html), 'rendererSHA256': SHA(renderer)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, required=True)
    build(parser.parse_args().site)
