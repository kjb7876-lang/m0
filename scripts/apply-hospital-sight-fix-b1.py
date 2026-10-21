#!/usr/bin/env python3
"""Separate local mask/diagnostic correction; no public build integration."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = '5aa7be827b3c1bf21b227c8caaa63b0e5fb81d22c0a0e4499911748946c00719'
RENDERER = '6c92f0e798b1f08030b47119799eb074a14ea9a17926da1077346e11b2a0d035'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def transform(source):
    definition = (ROOT / 'client-source/hospital-sight-fix-b1.js').read_text()
    edits = [
        ('function attachSight24(material,state,projected=false){', definition + '\nfunction attachSight24(material,state,projected=false){\n if(hospitalSightBindingsB1.has(material)||material.userData?.hospitalSightB1===true)return attachHospitalSightB1(material,state,projected);'),
        (' if(renderer.hospitalWallMaterial&&!state.root){', ' if(renderer.hospitalWallMaterial)attachHospitalSightB1(renderer.hospitalWallMaterial,renderer.sightState24);\n if(renderer.hospitalWallMaterial&&!state.root){'),
        ('attachSight24(material,renderer.sightState24);renderer.spatialResources.add(material);state.materials.push(material);', 'attachHospitalSightB1(material,renderer.sightState24);renderer.spatialResources.add(material);state.materials.push(material);'),
        ('attachSight24(inset,renderer.sightState24);renderer.spatialResources.add(inset);state.materials.push(inset);', 'attachHospitalSightB1(inset,renderer.sightState24);renderer.spatialResources.add(inset);state.materials.push(inset);'),
        ('clearScene(){this.wallCapMaterial61=null;', 'clearScene(){this.hospitalVisualB1Diagnostic=null;this.wallCapMaterial61=null;')
    ]
    for old, new in edits:
        if source.count(old) != 1:
            raise ValueError('Hospital sight fix anchor mismatch: ' + old[:100])
        source = source.replace(old, new, 1)
    return source


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', type=Path, default=ROOT / 'out/hospital-b1/visual-b1/review-candidate/site')
    parser.add_argument('--output', type=Path, default=ROOT / 'out/hospital-b1/visual-b1/mask-fix/site')
    args = parser.parse_args()
    baseline, output = args.baseline.resolve(), args.output.resolve()
    if output.exists() or not output.is_relative_to(ROOT / 'out') or baseline in output.parents:
        raise ValueError('Fresh separate candidate output under checkout/out required')
    html, renderer = (baseline / 'index.html').read_bytes(), (baseline / 'dist/phase1.js').read_bytes()
    if sha(html) != HTML or sha(renderer) != RENDERER:
        raise ValueError('Exact reviewed visual candidate required')
    candidate = transform(renderer.decode()).encode()
    shutil.copytree(baseline, output)
    (output / 'dist/phase1.js').write_bytes(candidate)
    path = output / 'web-manifest-r62.json'
    manifest = json.loads(path.read_text())
    prior = next(r['bytes'] for r in manifest['files'] if r['path'] == 'dist/phase1.js')
    for row in manifest['files'] + manifest['largest']:
        if row['path'] == 'dist/phase1.js':
            row.update(bytes=len(candidate), sha256=sha(candidate))
    manifest['totalBytes'] += len(candidate) - prior
    manifest['status'] = 'local B candidate mask/diagnostic fix; no GPU or deployment acceptance'
    manifest['remotePublished'] = False
    manifest['hospitalSightFixB1'] = {'localOnly': True, 'baselineRendererSHA256': RENDERER, 'rendererSHA256': sha(candidate), 'scope': 'opt-in hospital visual materials and diagnostic reset', 'GPUVerified': False}
    path.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n')
    evidence = {'baselineCommit': 'f415dfbf783c6290ab99125193d800429799c9f9', 'htmlSHA256': HTML, 'baselineRendererSHA256': RENDERER, 'rendererSHA256': sha(candidate), 'output': str(output), 'sourceFiles': {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in [ROOT / 'client-source/hospital-sight-fix-b1.js', Path(__file__).resolve()]}, 'scope': 'B local candidate only; other material paths, combat/story/save/assets unchanged'}
    (output.parent / 'build.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence))


if __name__ == '__main__':
    main()
