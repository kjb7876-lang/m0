#!/usr/bin/env python3
"""Extract both actual ZIPs; verify every file, restore baselines and run CPU/HTTP probes."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,importlib.util,json,stat,subprocess,sys,zipfile
ROOT=Path(__file__).resolve().parents[1]
PREFIX='hospital-refinement-v12'
def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,default=ROOT.parent/'outputs');p.add_argument('--destination',type=Path);a=p.parse_args()
    out=a.output.resolve();dest=a.destination.resolve() if a.destination else out/'v12-two-extracted-check'
    if dest.exists():raise ValueError('Extraction destination exists; no overwrite performed')
    verified=json.loads((out/'archive-verification-v12-two.json').read_text(encoding='utf-8'))
    archives=[out/f'StoryWorld-PC-R88-V12-PART{i:02d}-of-02.zip' for i in [1,2]]
    if len(verified.get('files',[]))!=2:raise ValueError('Expected exactly two archive records')
    for path,row in zip(archives,verified['files']):
        if path.stat().st_size!=row['bytes'] or sha(path)!=row['sha256']:raise ValueError('Archive changed after packaging')
    dest.mkdir(parents=True);seen=set()
    for path in archives:
        with zipfile.ZipFile(path) as z:
            if z.testzip():raise ValueError('Archive CRC failure')
            for info in z.infolist():
                n=info.filename;q=PurePosixPath(n)
                if q.is_absolute() or '..' in q.parts or '\\' in n or ':' in n or q.as_posix()!=n or not n.startswith(PREFIX+'/') or n in seen or info.is_dir() or stat.S_ISLNK(info.external_attr>>16):raise ValueError('Unsafe, linked, duplicate or unprefixed archive path: '+n)
                seen.add(n)
            z.extractall(dest)
    if len(seen)!=verified['archiveUnionFiles']:raise ValueError('Archive union count changed')
    project=dest/PREFIX
    spec=importlib.util.spec_from_file_location('delivered_r88_package',project/'scripts/package-r88.py');package=importlib.util.module_from_spec(spec);spec.loader.exec_module(package)
    final=package.frozen_report(project);names,_=package.handoff_hashes(project)
    if seen!={PREFIX+'/'+n for n in names}:raise ValueError('Extracted file union differs from frozen handoff inventory')
    checks=[];commands=[]
    def execute(name,cmd,report=None,minimum=None,timeout=300):
        result=subprocess.run(cmd,cwd=project,capture_output=True,text=True,timeout=timeout)
        (out/f'v12-two-{name}.log').write_text(result.stdout+result.stderr,encoding='utf-8')
        detail={'name':name,'command':cmd,'exitCode':result.returncode,'passed':result.returncode==0}
        if report:
            value=json.loads((project/report).read_text(encoding='utf-8'));rows=value.get('checks',[])
            detail.update(checks=len(rows),passedChecks=sum(r.get('passed') is True for r in rows))
            detail['passed']=detail['passed'] and rows and all(r.get('passed') is True for r in rows) and (minimum is None or len(rows)>=minimum)
        checks.append(detail);commands.append(cmd)
        if not detail['passed']:raise ValueError('Extracted check failed: '+name+'; see its log')
    try:
        execute('baseline-restore',[sys.executable,'scripts/prepare-handoff-baselines.py'])
        execute('http-package',['node','qa/package-check.cjs'],'qa/package-results.json',5,240)
        execute('legacy-scope',['node','qa/r81/legacy-scope-check.cjs'],'qa/r81/legacy-scope-results.json',3,300)
        execute('preservation',[sys.executable,'qa/r81/preservation.py'],'qa/r81/preservation-results.json',4,240)
        # Those probes write only result files. The delivered runtime must still
        # equal the entire frozen manifest afterwards.
        package.frozen_report(project)
        for variant in json.loads((project/'handoff/baseline-inputs.json').read_text(encoding='utf-8'))['variants']:
            for row in variant['files']:
                target=dest/variant['folder']/'hospital-three-pc/site'/row['path']
                if target.is_symlink() or sha(target)!=row['sha256']:raise ValueError('Restored historical fixture changed')
        report={'schema':'storyworld.r88-extracted-handoff-check/v1','passed':True,'extractedParts':2,'archiveUnionFiles':len(seen),'frozenRuntimeFilesVerified':len(final['sourceHashes']),'runtimeHashMismatches':[],'checks':checks,'executedCommands':commands,'browserVerified':False,'GPUVerified':False,'naturalPlayVerified':False,'WindowsLauncherExecuted':False,'historicalBaselinesRestoredFromDeliveredInputs':True}
    except Exception as e:
        report={'schema':'storyworld.r88-extracted-handoff-check/v1','passed':False,'error':str(e),'checks':checks,'executedCommands':commands,'browserVerified':False,'GPUVerified':False,'naturalPlayVerified':False}
        (out/'v12-two-extraction-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');raise
    (out/'v12-two-extraction-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':True,'httpChecks':next(x['checks'] for x in checks if x['name']=='http-package'),'probeGroups':len(checks),'runtimeFiles':len(final['sourceHashes']),'archiveFiles':len(seen)}))
if __name__=='__main__':main()
