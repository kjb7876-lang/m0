#!/usr/bin/env python3
"""Build V8: dynamic VFX and settings-only hospital test entry on preserved R83."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess

ROOT=Path(__file__).resolve().parents[1]
SHA=lambda b:hashlib.sha256(b).hexdigest()

def apply(site):
    subprocess.run(['node',str(ROOT/'qa/r84/dynamic-patch.cjs'),'--canonical'],check=True)
    spec=importlib.util.spec_from_file_location('r83_base', ROOT/'scripts/apply-r83.py')
    base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
    base.apply(site)
    subprocess.run(['node',str(ROOT/'qa/r84/settings-patch.cjs'),str(site)],check=True)
    subprocess.run(['node',str(ROOT/'qa/r84/dynamic-patch.cjs'),str(site/'index.html')],check=True)
    for p in (ROOT/'client-source').glob('*r84*'):
        if p.is_file():shutil.copyfile(p,site/p.name)
    index=site/'index.html';html=index.read_text()
    html=html.replace('storyworld.hospital-three-pc.maze.v7:','storyworld.hospital-three-pc.maze.v8:')
    html=re.sub(r'src="\./dist/phase1\.js(?:\?[^\"]*)?"','src="./dist/phase1.js?r84=1"',html)
    marker='<!-- R84 supplied deterministic VFX: no preview loop -->'
    late=['world-environment-r81.js','world-presentation-r81.js',
          'portal-interaction-r83.js','effect-presentation-r83.js','world-doors-r83.js',
          'vfx-selected-data-r83.js','vfx-selected-r83.js',
          'assets/dynamic-vfx-r84/catalog.js','assets/dynamic-vfx-r84/runtime.js',
          'dynamic-vfx-r84.js','hospital-settings-r84.js']
    html=html.replace(marker+'\n','').replace(marker,'')
    for name in late:
        tag=f'<script src="./{name}"></script>'
        if html.count(tag)!=1:raise ValueError('Missing or duplicate R84 extension: '+name)
        html=html.replace(tag+'\n','').replace(tag,'').rstrip()
    html+='\n'+marker+'\n'+'\n'.join(f'<script src="./{name}"></script>' for name in late)+'\n'
    index.write_text(html)
    for name in ('hospital-direct-test.js','hospital-pc-test.js'):
        p=site/name;p.write_text(p.read_text().replace('storyworld.hospital-three-pc.maze.v7:','storyworld.hospital-three-pc.maze.v8:'))
    manifest_path=site/'web-manifest-r62.json';m=json.loads(manifest_path.read_text())
    names={r['path'] for r in m['files']}
    names.update(p.name for p in (ROOT/'client-source').glob('*r84*') if p.is_file())
    names.update(p.relative_to(site).as_posix() for p in (site/'assets/dynamic-vfx-r84').rglob('*') if p.is_file())
    rows=[]
    for name in sorted(names):
        data=(site/name).read_bytes();rows.append(dict(path=name,bytes=len(data),sha256=SHA(data)))
    m.update(files=rows,fileCount=len(rows),totalBytes=sum(r['bytes'] for r in rows),webHTMLSha256=SHA(index.read_bytes()),largest=sorted(rows,key=lambda r:r['bytes'],reverse=True)[:20])
    m['r84']=dict(revision='V8',baseline='Preserved R83/V7 frozen candidate (389 checks)',
                  testStoragePrefix='storyworld.hospital-three-pc.maze.v8:',hospitalTestEntry='settings-only',
                  dynamicPackage='64 supplied PNG timelines + 16 procedural effects; SVG alternatives are the same 16 motifs',
                  originalPNGsReusedExactly=True,newFrameSheets=False,browserVerified=False,GPUVerified=False,
                  naturalPlayVerified=False,publicDeploymentChanged=False)
    manifest_path.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':'R84_APPLIED',**m['r84'],'files':len(rows)},ensure_ascii=False))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--site',type=Path,default=ROOT/'hospital-three-pc/site');apply(p.parse_args().site)
