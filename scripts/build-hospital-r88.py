#!/usr/bin/env python3
"""Materialize the frozen R88 bytes and independent historical QA fixtures.

Never rebuild from modified B2 outputs or stamp the tested manifest.
"""
from pathlib import Path, PurePosixPath
import hashlib, importlib.util, json, os, shutil, stat, subprocess, zipfile

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / 'release/r88'
OUT = ROOT / 'out/hospital-r88'
SHA = lambda b: hashlib.sha256(b).hexdigest()

def safe(value):
    p = PurePosixPath(value)
    if not value or p.is_absolute() or '..' in p.parts or '\\' in value or ':' in value or str(p) != value:
        raise ValueError('Unsafe frozen input path: ' + value)
    return value

def build():
    if OUT.exists() or (ROOT/'out/hospital-r88-static').exists():
        raise ValueError('Fresh output required; refusing overwrite')
    spec = json.loads((INPUT/'frozen-inputs.json').read_text())
    if spec['schema'] != 'storyworld.r88-frozen-inputs/v1': raise ValueError('Unknown inputs')
    if SHA((ROOT/'docs/web-manifest-r62.json').read_bytes()) != spec['baselineManifestSHA256']:
        raise ValueError('Preserved original baseline changed')
    OUT.mkdir(parents=True)
    loader = importlib.util.spec_from_file_location('original_r62', ROOT/'scripts/unpack-runtime-r62.py')
    module = importlib.util.module_from_spec(loader); loader.loader.exec_module(module)
    module.build(ROOT, OUT/'original-r62')
    members = {}
    for row in spec['packs']:
        p = INPUT/'runtime-packs'/safe(row['path'])
        if p.is_symlink() or SHA(p.read_bytes()) != row['sha256'] or p.stat().st_size != row['bytes']:
            raise ValueError('Frozen pack changed: ' + str(p))
        with zipfile.ZipFile(p) as z:
            if z.testzip(): raise ValueError('Pack CRC failure')
            for info in z.infolist():
                safe(info.filename)
                if stat.S_ISLNK(info.external_attr >> 16) or info.filename in members:
                    raise ValueError('Linked or repeated pack member')
                members[info.filename] = (row['path'], z.read(info))
    payloads = {}
    used = set()
    for digest, chunks in spec['payloads'].items():
        pieces = []
        for c in chunks:
            pack, b = members[c['member']]
            if pack != c['pack'] or len(b) != c['bytes'] or SHA(b) != c['sha256']:
                raise ValueError('Input chunk changed')
            used.add(c['member']); pieces.append(b)
        b = b''.join(pieces)
        if SHA(b) != digest: raise ValueError('Payload reconstruction mismatch')
        p = OUT/'payloads'/digest; p.parent.mkdir(exist_ok=True); p.write_bytes(b); payloads[digest] = p
    if used != set(members): raise ValueError('Unexpected pack member')
    seen = set()
    for row in spec['items']:
        rel = safe(row['path'])
        if rel in seen: raise ValueError('Repeated materialization path')
        seen.add(rel); target = OUT/rel
        source = OUT/'original-r62'/safe(row['baselinePath']) if 'baselinePath' in row else payloads[row['payloadSHA256']]
        if source.is_symlink() or len(source.read_bytes()) != row['bytes'] or SHA(source.read_bytes()) != row['sha256']:
            raise ValueError('Frozen item hash differs: ' + rel)
        target.parent.mkdir(parents=True, exist_ok=True); os.link(source, target)
    verification = OUT/'verification'
    # Large raw/source-patch assets may already be restored by frozen-inputs
    # items. Small tracked source overlays are optional, never prerequisites for
    # the existence of an INPUT/hospital-three-pc/source-patch directory.
    for name in ['qa', 'client-source', 'scripts', 'handoff', 'hospital-three-pc/source-patch']:
        source = INPUT/name
        if source.is_dir():
            shutil.copytree(source, verification/name, dirs_exist_ok=True)
    for source in INPUT.iterdir():
        if source.is_file() and source.name != 'frozen-inputs.json':
            shutil.copyfile(source, verification/source.name)
    hospital_input = INPUT/'hospital-three-pc'
    if hospital_input.is_dir():
        for source in hospital_input.iterdir():
            if source.is_file():
                target = verification/'hospital-three-pc'/source.name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
    for name in ['qa/r88/run-suite.cjs', 'scripts/prepare-handoff-baselines.py',
                 'handoff/baseline-inputs.json', 'input-sha256.json',
                 'hospital-three-pc/source-patch/asset-source-docs/final42-r88/FILE_SHA256.txt',
                 'hospital-three-pc/source-patch/asset-source-docs/final42-r88/AUTHORITATIVE_EFFECT_INDEX.json']:
        if not (verification/name).is_file():
            raise ValueError('Frozen inputs did not restore required portable QA material: ' + name)
    site = verification/'hospital-three-pc/site'
    manifest = site/'web-manifest-r62.json'
    if SHA(manifest.read_bytes()) != spec['currentManifestSHA256']: raise ValueError('R88 manifest changed')
    shutil.copytree(site, OUT/'site', copy_function=os.link)
    (ROOT/'out/hospital-r88-static').mkdir()
    shutil.copytree(site, ROOT/'out/hospital-r88-static/docs', copy_function=os.link)
    source = subprocess.check_output(['git','rev-parse','HEAD'], cwd=ROOT, text=True).strip()
    result = {'schema':'storyworld.r88-build/v1', 'sourceCommit':source, 'runtimeFiles':len(json.loads(manifest.read_text())['files']), 'manifestSHA256':SHA(manifest.read_bytes()), 'manifestRewritten':False, 'oldApprovalsInherited':False, 'publicDeploymentChanged':False}
    (OUT/'build.json').write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps(result))

if __name__ == '__main__': build()
