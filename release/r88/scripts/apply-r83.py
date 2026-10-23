#!/usr/bin/env python3
"""Build the local V7 candidate from the preserved V6 integration and R83 sources."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SHA = lambda b: hashlib.sha256(b).hexdigest()

def apply(site):
    spec = importlib.util.spec_from_file_location('r82_base', ROOT / 'scripts/apply-r82.py')
    base = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(base)
    base.apply(site)
    index = site / 'index.html'
    before = index.read_text()
    payload = re.search(r'<script type="application/json" id="portable-data">(.*?)</script>', before, re.S).group(1)
    # Patchers validate their original anchors and replace bounded fragments
    # on repeated builds. Unknown source versions fail rather than guessing.
    patches = [('render-compat-patch.cjs', site / 'dist/phase1.js'),
               ('hero-patch.cjs', index),
               ('portal-patch.cjs', index),
               ('effect-patch.cjs', index),
               ('door-patch.cjs', site),
               ('vfx-patch.cjs', index)]
    for name, target in patches:
        subprocess.run(['node', str(ROOT / 'qa/r83' / name), str(target)], check=True)
    html = index.read_text()
    html = html.replace('storyworld.hospital-three-pc.maze.v6:', 'storyworld.hospital-three-pc.maze.v7:')
    html = re.sub(r'src="\./dist/phase1\.js(?:\?[^\"]*)?"', 'src="./dist/phase1.js?r83=1"', html)
    hero_tag = '<script src="./hero-presentation-r83.js"></script>'
    renderer_tag = '<script src="./dist/phase1.js?r83=1"></script>'
    html = html.replace(hero_tag+'\n', '').replace(hero_tag, '')
    if html.count(renderer_tag) != 1:
        raise ValueError('Expected one pinned renderer script')
    html = html.replace(renderer_tag, hero_tag+'\n'+renderer_tag, 1)
    # Keep extension evaluation order stable across idempotent base rebuilds.
    late = ['world-environment-r81.js', 'world-presentation-r81.js',
            'portal-interaction-r83.js', 'effect-presentation-r83.js', 'world-doors-r83.js',
            'vfx-selected-data-r83.js', 'vfx-selected-r83.js']
    for name in late:
        tag = f'<script src="./{name}"></script>'
        if html.count(tag) != 1:
            raise ValueError('Missing or duplicate extension: '+name)
        html = html.replace(tag, '').rstrip()
    html += '\n'+'\n'.join(f'<script src="./{name}"></script>' for name in late)+'\n'
    if SHA(re.search(r'<script type="application/json" id="portable-data">(.*?)</script>', html, re.S).group(1).encode()) != SHA(payload.encode()):
        raise ValueError('Original embedded story changed')
    index.write_text(html)
    for name in ('hospital-pc-test.js', 'hospital-direct-test.js'):
        p = site / name
        text = p.read_text().replace('storyworld.hospital-three-pc.maze.v6:', 'storyworld.hospital-three-pc.maze.v7:')
        if name == 'hospital-direct-test.js':
            old = "if(room?.id!=='ep1a08'||!room.exploration?.hospitalDoorsB3)throw Error('A4 병원 구조를 확인하지 못했습니다.');"
            new = "const rendererFailureR83=window.__STORYWORLD_PHASE1__?.controller?.state;if(rendererFailureR83?.failed)throw Error('Three.js 화면 오류: '+rendererFailureR83.reason);if(room?.id!=='ep1a08'||!room.exploration?.hospitalDoorsB3)throw Error('병원 진입 상태를 확인하지 못했습니다.');"
            if new not in text:
                if text.count(old) != 1:
                    raise ValueError('Missing direct-start validation anchor')
                text = text.replace(old, new, 1)
        p.write_text(text)
    # Source fragments are included beside their actual native insertion.
    for p in (ROOT / 'client-source').glob('*r83*'):
        if p.is_file():
            shutil.copyfile(p, site / p.name)
    mp = site / 'web-manifest-r62.json'
    m = json.loads(mp.read_text())
    names = {r['path'] for r in m['files']}
    names.update(p.name for p in (ROOT / 'client-source').glob('*r83*') if p.is_file())
    names.update(p.relative_to(site).as_posix() for p in (site/'assets/vfx-r83').rglob('*') if p.is_file())
    catalog = json.loads((site/'assets/vfx-r83/review/selected-quality-64.json').read_text())
    if catalog['count'] != 64:
        raise ValueError('Expected complete 64 PNG source catalog')
    for row in catalog['selected']:
        if SHA((site/'assets/vfx-r83'/row['file']).read_bytes()) != row['sha256']:
            raise ValueError('Supplied PNG differs from canonical source: '+row['file'])
    rows = []
    for name in sorted(names):
        data = (site / name).read_bytes()
        rows.append({'path': name, 'bytes': len(data), 'sha256': SHA(data)})
    m.update(files=rows, fileCount=len(rows), totalBytes=sum(r['bytes'] for r in rows),
             webHTMLSha256=SHA(index.read_bytes()), largest=sorted(rows, key=lambda r:r['bytes'], reverse=True)[:20])
    m['r83'] = dict(revision='V7', baseline='Preserved R82/V6 candidate',
                    storyPayloadSha256=SHA(payload.encode()), testStoragePrefix='storyworld.hospital-three-pc.maze.v7:',
                    new64VFXApplied=True, new64VFXStatus='9 supplied parts downloaded and CRC/SHA256 verified; exact 64 static PNGs in 16 regional role sets',
                    newVFXImportedPNGs=64, newVFXUpgraded=48, newVFXRetainedOriginal=16,
                    browserVerified=False, GPUVerified=False, naturalPlayVerified=False,
                    publicDeploymentChanged=False)
    mp.write_text(json.dumps(m, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'status':'R83_APPLIED', **m['r83'], 'files':len(rows)}, ensure_ascii=False))

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--site', type=Path, default=ROOT/'hospital-three-pc/site')
    apply(p.parse_args().site)
