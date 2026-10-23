#!/usr/bin/env python3
"""Package the exact frozen R88 handoff into two ordinary independent ZIPs."""
from pathlib import Path, PurePosixPath
import argparse,hashlib,json,re,stat,zipfile

ROOT=Path(__file__).resolve().parents[1]
PREFIX='hospital-refinement-v12'
EXCLUDED_DIRS={'.git','node_modules','__pycache__','out','.pytest_cache','.mypy_cache','.ruff_cache'}
PRIVATE_NAMES={'.env','.netrc','.npmrc','.pypirc','credentials.json','client_secret.json','download.py'}
SIGNED_URL=re.compile(r'https?://[^\s\"\'<>]*(?:X-Amz-Signature=|[?&]sig=|[?&]access_token=)',re.I)

def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def safe(name):
    p=PurePosixPath(name)
    if not name or p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name or '\n' in name or '\r' in name or p.as_posix()!=name:
        raise ValueError('Unsafe package path: '+repr(name))
    return name

def select_files(root=ROOT):
    root=Path(root);manifest=root/'hospital-three-pc/site/web-manifest-r62.json';forced=set()
    if manifest.is_file():
        forced={'hospital-three-pc/site/'+r['path'] for r in json.loads(manifest.read_text(encoding='utf-8'))['files']}
        forced.add('hospital-three-pc/site/web-manifest-r62.json')
    names=[];folded={}
    for p in root.rglob('*'):
        rel=p.relative_to(root);name=rel.as_posix()
        if any(part in EXCLUDED_DIRS for part in rel.parts):continue
        if p.is_symlink():raise ValueError('Symlinks are not delivered: '+name)
        if not p.is_file():continue
        if p.name in PRIVATE_NAMES or p.name.startswith(('.env.','library-helpers-')) or p.suffix.lower() in {'.pyc','.pyo','.pem','.key'}:continue
        if name not in forced and any(part.startswith('.') for part in rel.parts):continue
        safe(name)
        if name.casefold() in folded:raise ValueError('Case-colliding package paths: '+folded[name.casefold()]+' / '+name)
        folded[name.casefold()]=name;names.append(name)
    if not forced.issubset(names):raise ValueError('A frozen runtime file was excluded')
    return sorted(names)

def frozen_report(root=ROOT):
    root=Path(root);p=root/'qa/r88/final-suite.json'
    if not p.is_file():raise ValueError('The actual final R88 suite has not completed')
    d=json.loads(p.read_text(encoding='utf-8'))
    if d.get('schema')!='r88-final-frozen-suite/v1' or d.get('passed') is not True or d.get('sourceUnchangedDuringRun') is not True or d.get('changedFiles')!=[]:
        raise ValueError('The actual frozen R88 suite must pass without runtime drift')
    runs=d.get('runs',[])
    if not runs or len(runs)!=d.get('groups') or len({r.get('name') for r in runs})!=len(runs) or any(r.get('passed') is not True or r.get('checks')!=r.get('passedChecks') for r in runs):
        raise ValueError('Incomplete final suite groups')
    if sum(r['checks'] for r in runs)!=d.get('totalChecks') or d.get('passedChecks')!=d.get('totalChecks'):
        raise ValueError('Actual final check total disagrees')
    site=root/'hospital-three-pc/site';m=json.loads((site/'web-manifest-r62.json').read_text(encoding='utf-8'))
    paths={r['path'] for r in m['files']}|{'web-manifest-r62.json'}
    if set(d.get('sourceHashes',{}))!=paths:raise ValueError('Frozen suite does not bind the complete runtime')
    if any(sha(site/n)!=expected for n,expected in d['sourceHashes'].items()):raise ValueError('Runtime changed after the final suite')
    return d

def handoff_hashes(root=ROOT):
    root=Path(root);p=root/'handoff/FILE_SHA256.txt'
    if not p.is_file():raise ValueError('Run handoff/finalize-handoff-r88.py after the final frozen suite')
    hashes={}
    for line in p.read_text(encoding='utf-8').splitlines():
        if not line or line.startswith('#'):continue
        digest,name=line.split('  ',1);safe(name)
        if not re.fullmatch('[0-9a-f]{64}',digest) or not name.startswith(PREFIX+'/') or name in hashes:raise ValueError('Invalid or repeated handoff hash row')
        hashes[name]=digest
    names=select_files(root);wanted={PREFIX+'/'+n for n in names if n!='handoff/FILE_SHA256.txt'}
    if set(hashes)!=wanted:raise ValueError('Files were added or removed after final handoff hashing')
    if any(sha(root/name.removeprefix(PREFIX+'/'))!=digest for name,digest in hashes.items()):raise ValueError('A handoff file changed after finalization')
    return names,hashes

def inspect_private_urls(root,names):
    for name in names:
        p=root/name
        if p.suffix.lower() not in {'.json','.txt','.md','.py','.js','.cjs','.mjs','.html','.css','.yml','.yaml','.ini'}:continue
        text=p.read_text(encoding='utf-8',errors='ignore')
        if SIGNED_URL.search(text) or re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text):
            raise ValueError('Private ephemeral URL/key found in candidate; excluded content must be reviewed: '+name)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,default=ROOT.parent/'outputs');p.add_argument('--plan',action='store_true');p.add_argument('--replace-existing',action='store_true',help='explicitly replace only this version\'s generated ZIPs')
    a=p.parse_args();names=select_files(ROOT)
    if a.plan:
        print(json.dumps({'files':len(names),'uncompressedBytes':sum((ROOT/n).stat().st_size for n in names),'projectPrefix':PREFIX,'runtimeEdited':False}));return
    final=frozen_report(ROOT);names,hashes=handoff_hashes(ROOT);inspect_private_urls(ROOT,names)
    original=json.loads((ROOT/'input-sha256.json').read_text(encoding='utf-8'))
    for name in ['START.cmd','LOCAL-SERVER.cjs','portable-node/node.exe']:
        n='hospital-three-pc/'+name
        if sha(ROOT/n)!=original[n]:raise ValueError('Original launcher changed: '+name)
    out=a.output.resolve();out.mkdir(parents=True,exist_ok=True)
    targets=[out/f'StoryWorld-PC-R88-V12-PART{i:02d}-of-02.zip' for i in [1,2]]
    if any(x.exists() for x in targets) and not a.replace_existing:raise ValueError('Final ZIP already exists; refusing silent overwrite')
    estimates={}
    for previous in (ROOT.parent/'outputs').glob('StoryWorld-PC-R87-V11-PART*-of-02.zip'):
        with zipfile.ZipFile(previous) as z:estimates.update({r.filename:r.compress_size for r in z.infolist()})
    bins=[[],[]];weights=[0,0]
    weight=lambda n:estimates.get(n,(ROOT/n).stat().st_size)
    for name in sorted(names,key=lambda n:(-weight(n),n)):
        i=min(range(2),key=lambda i:(weights[i],i));bins[i].append(name);weights[i]+=weight(name)
    reports=[]
    for target,group in zip(targets,bins):
        print('Packaging',target.name,len(group),'files',flush=True)
        with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
            for name in sorted(group):z.write(ROOT/name,PREFIX+'/'+name)
        with zipfile.ZipFile(target) as z:
            if z.testzip():raise ValueError('Archive CRC failure')
            if set(z.namelist())!={PREFIX+'/'+n for n in group}:raise ValueError('Archive members differ')
        reports.append({'path':str(target),'bytes':target.stat().st_size,'sha256':sha(target),'archiveFiles':len(group),'archiveCRCVerified':True})
    lookup={};archives=[zipfile.ZipFile(p) for p in targets]
    try:
        for z in archives:
            for name in z.namelist():
                if name in lookup:raise ValueError('A source file occurs in both ZIPs: '+name)
                lookup[name]=z
        expected={PREFIX+'/'+n for n in names}
        if set(lookup)!=expected:raise ValueError('The archive union is incomplete')
        all_hashes=dict(hashes);key=PREFIX+'/handoff/FILE_SHA256.txt';all_hashes[key]=sha(ROOT/'handoff/FILE_SHA256.txt')
        for name,digest in all_hashes.items():
            if hashlib.sha256(lookup[name].read(name)).hexdigest()!=digest:raise ValueError('Delivered file differs: '+name)
    finally:
        for z in archives:z.close()
    report={'schema':'storyworld.r88-two-part-archive/v1','files':reports,'archiveParts':2,'allPartsRequired':True,'projectPrefix':PREFIX,'archiveUnionFiles':len(names),'allDeliveredFileHashesVerified':True,'frozenRuntimeArchiveHashesVerified':True,'portableLauncherOriginalHashesVerified':True,'sourceHashListSHA256':sha(ROOT/'handoff/FILE_SHA256.txt'),'runtimeFilesIncludingManifest':len(final['sourceHashes']),'checks':{'passed':final['passedChecks'],'total':final['totalChecks'],'groups':final['groups']},'browserVerified':False,'GPUVerified':False,'naturalPlayVerified':False,'publicDeploymentChangedByPackaging':False}
    (out/'archive-verification-v12-two.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
