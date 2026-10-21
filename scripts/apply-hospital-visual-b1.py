#!/usr/bin/env python3
"""Create a separate local visual candidate from the accepted mode-fix bytes."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = '5aa7be827b3c1bf21b227c8caaa63b0e5fb81d22c0a0e4499911748946c00719'
RENDERER = '3dc27eb9c22c872f6a1a2c57cbefec8bbcf1d66dc952340eba7bce094baf9427'


def sha(value):
    return hashlib.sha256(value).hexdigest()


def transform(source):
    definition = (ROOT / 'client-source/hospital-visual-b1.js').read_text()
    anchors = [
        ('class ThreeRenderer {', definition + '\nclass ThreeRenderer {'),
        ('this.commands.render(frame.commands);this.ensureHospitalRooms(frame);',
         'this.commands.render(frame.commands);this.ensureHospitalRooms(frame);applyHospitalVisualB1(this,frame);'),
        ('inspectSpatial(){return{mazeR73:',
         'inspectSpatial(){return{hospitalVisualB1:this.hospitalVisualB1Diagnostic||null,mazeR73:'),
        ('window.StoryPhase1=Object.freeze({worldLayoutR74,',
         'window.StoryPhase1=Object.freeze({hospitalVisualPlanB1,applyHospitalVisualB1,worldLayoutR74,')
    ]
    for old, new in anchors:
        if source.count(old) != 1:
            raise ValueError('Visual B1 exact anchor mismatch: ' + old[:100])
        source = source.replace(old, new, 1)
    return source


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', type=Path, default=ROOT / 'out/hospital-b1/mode-fix/site')
    parser.add_argument('--output', type=Path, default=ROOT / 'out/hospital-b1/visual-b1/site')
    args = parser.parse_args()
    baseline, output = args.baseline.resolve(), args.output.resolve()
    if output.exists() or not output.is_relative_to(ROOT / 'out') or baseline in output.parents:
        raise ValueError('A fresh separate local output directory under checkout/out is required')
    html, renderer = (baseline / 'index.html').read_bytes(), (baseline / 'dist/phase1.js').read_bytes()
    if sha(html) != HTML or sha(renderer) != RENDERER:
        raise ValueError('Exact accepted mode-fix HTML/renderer required')
    candidate = transform(renderer.decode()).encode()
    shutil.copytree(baseline, output)
    (output / 'dist/phase1.js').write_bytes(candidate)
    path = output / 'web-manifest-r62.json'
    manifest = json.loads(path.read_text())
    old_size = next(r['bytes'] for r in manifest['files'] if r['path'] == 'dist/phase1.js')
    for row in manifest['files'] + manifest['largest']:
        if row['path'] == 'dist/phase1.js':
            row.update(bytes=len(candidate), sha256=sha(candidate))
    manifest['totalBytes'] += len(candidate) - old_size
    manifest['status'] = 'local visual material/placement candidate; no screen or GPU acceptance'
    manifest['remotePublished'] = False
    manifest['hospitalVisualB1'] = {'localOnly': True, 'sourceHTMLSHA256': HTML, 'sourceRendererSHA256': RENDERER, 'rendererSHA256': sha(candidate), 'newAssets': 0, 'GPUVerified': False}
    path.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n')
    evidence = {'baselineCommit': 'f415dfbf783c6290ab99125193d800429799c9f9', 'acceptedModeFixPatchSHA256': '31955d83e38a7309db20811a925420b64ee75345d04e737db5a6e615252d17d9', 'htmlSHA256': HTML, 'baselineRendererSHA256': RENDERER, 'rendererSHA256': sha(candidate), 'output': str(output), 'sourceFiles': {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in [ROOT / 'client-source/hospital-visual-b1.js', Path(__file__).resolve()]}, 'scope': 'local Three ep1a08 solo render-only candidate; no complete playable release, no visual/GPU acceptance'}
    (output.parent / 'build.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence))


if __name__ == '__main__':
    main()
