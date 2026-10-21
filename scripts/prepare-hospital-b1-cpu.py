#!/usr/bin/env python3
"""Prepare deterministic CPU fixtures from the current approved R77 input.

No previous out/ folder, result JSON, browser, user save or network is used.
The exact saved harness source is restored at its documented relative path.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out/hospital-b1/build-connected'
EXPECTED_PATCH = 'bf26e59ef362884e3130e10d132f79ac34d4fd67d08cd071eb4cb95ffb2f2801'
SOURCE = ['client-source/hospital-prototype-b1.js', 'client-source/hospital-visual-b1.js', 'client-source/hospital-sight-fix-b1.js', 'scripts/apply-hospital-prototype-b1.py', 'scripts/apply-hospital-visual-b1.py', 'scripts/apply-hospital-sight-fix-b1.py']
sha = lambda b: hashlib.sha256(b).hexdigest()


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / (name + '.py'))
    obj = importlib.util.module_from_spec(spec); spec.loader.exec_module(obj); return obj


def put(path, data):
    path = ROOT / path
    if path.exists() and path.read_bytes() != data:
        raise ValueError('Refuse overwriting different fixture: ' + str(path))
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists(): path.write_bytes(data)


def main():
    if not (OUT / 'site/web-manifest-r62.json').is_file():
        raise ValueError('Build the final hospital artifact before CPU preparation')
    base = ROOT / '_pages/docs'
    structure, visual = module('apply-hospital-prototype-b1'), module('apply-hospital-visual-b1')
    html, renderer = (base / 'index.html').read_bytes(), (base / 'dist/phase1.js').read_bytes()
    if sha(html) != structure.BASE_HTML or sha(renderer) != structure.BASE_RENDERER:
        raise ValueError('Exact approved R77 fixture input required')
    fixed_html = structure.transform_html(html.decode()).encode()
    fixed_renderer = structure.transform(renderer.decode()).encode()
    if sha(fixed_html) != visual.HTML or sha(fixed_renderer) != visual.RENDERER:
        raise ValueError('Reviewed mode-fix fixture drift')
    put('out/hospital-b1/mode-fix/site/index.html', fixed_html)
    put('out/hospital-b1/mode-fix/site/dist/phase1.js', fixed_renderer)
    put('out/hospital-b1/candidate-v3/site/index.html', html)
    # Prior mask-fix HTML equals the accepted mode-fix HTML; only used for undo wiring assertion.
    put('out/hospital-b1/visual-b1/mask-fix/refined/site/index.html', fixed_html)
    for name in ['assets/visual-test/hospital-floor-material-atlas.png', 'assets/visual-test/hospital-quiet-material-atlas-r42.png', 'assets/rc138/map-ep1a08.png']:
        put('out/hospital-b1/mode-fix/site/' + name, (base / name).read_bytes())
    for source, target in [('hospital-sim.mjs', 'hospital-sim.mjs'), ('audit.mjs', 'audit/audit.mjs')]:
        put(OUT.relative_to(ROOT) / target, (ROOT / 'docs/hospital-b1-evidence' / source).read_bytes())
    patch = subprocess.check_output(['git', 'diff', 'f415dfbf783c6290ab99125193d800429799c9f9', '--', *SOURCE], cwd=ROOT)
    if sha(patch) != EXPECTED_PATCH:
        raise ValueError('The reviewed six-file patch differs')
    put(OUT.relative_to(ROOT) / 'candidate-source.patch', patch)
    # A validator alias only: no symlink enters the uploaded static site.
    alias = ROOT / 'out/hospital-b1-static/docs'; target = OUT / 'site'
    alias.parent.mkdir(parents=True, exist_ok=True)
    if alias.exists() or alias.is_symlink():
        if not alias.is_symlink() or alias.resolve() != target.resolve():
            raise ValueError('Static validator alias already points elsewhere')
    else: alias.symlink_to(target.resolve(), target_is_directory=True)
    evidence = {'method': 'generated fixtures from exact R77; no old result JSON consumed', 'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'sixFilePatchSHA256': sha(patch), 'finalHTMLSHA256': sha((OUT / 'site/index.html').read_bytes()), 'rendererSHA256': sha((OUT / 'site/dist/phase1.js').read_bytes()), 'harnessSHA256': sha((OUT / 'hospital-sim.mjs').read_bytes()), 'auditSHA256': sha((OUT / 'audit/audit.mjs').read_bytes()), 'originalUserSavesUsed': False}
    (OUT / 'fixture-preparation.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence))


if __name__ == '__main__': main()
