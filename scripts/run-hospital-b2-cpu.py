#!/usr/bin/env python3
"""Fresh B2 checks with a disclosed B1/B2 EGO control, never an all-pass claim."""
import datetime,hashlib,json,os,shutil,subprocess,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'out/hospital-b2';PROD=OUT/'production-order';DOC=ROOT/'docs/hospital-b2-evidence'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 if PROD.exists():raise ValueError('Fresh production-order output required; preserve existing logs')
 PROD.mkdir(parents=True)
 shutil.copyfile(DOC/'canonical-summons-b2.json',PROD/'canonical-summons-b2.json')
 began=time.time_ns();commands=[]
 def execute(name,cmd,env=None,expected=0):
  with (OUT/(name+'.log')).open('w') as log:rc=subprocess.run(cmd,cwd=ROOT,env={**os.environ,**(env or {})},stdout=log,stderr=subprocess.STDOUT).returncode
  commands.append({'name':name,'command':cmd,'exitCode':rc,'environmentOverride':env or {}})
  if rc!=expected:raise ValueError('Unexpected process exit: '+name+': '+str(rc))
 execute('structure',['node','docs/hospital-b2-evidence/structure.mjs'])
 execute('production-order',['node','docs/hospital-b2-evidence/checks.mjs'],expected=1)
 result=json.loads((PROD/'results.json').read_text());failures=[c for c in result['cases'] if not c['ok']]
 if result.get('fatal') or result['passed']!=8 or len(failures)!=1 or failures[0]['name']!='EGO visit routeRoom actual hydrate plus final wrappers and first tick' or 'one normal tick retains identities/state/HP' not in failures[0].get('error',''):raise ValueError('Unexpected production-order failure; inspect raw results')
 execute('ego-b1',['node','docs/hospital-b2-evidence/ego-control.mjs'],{'CPU_HTML':'out/hospital-b1/build-connected/site/index.html'})
 execute('ego-b2',['node','docs/hospital-b2-evidence/ego-control.mjs'])
 b1,b2=[json.loads((PROD/n).read_text()) for n in ['ego-b1.json','ego-b2.json']]
 def nonspatial(d):return [{k:[{x:v for x,v in a.items() if x not in ['x','y','blocked']} for a in s[k]['actors']] for k in ['restored','firstTick']} for s in d['snapshots']]
 if b1.get('error') or b2.get('error') or len(b1['snapshots'])!=2 or nonspatial(b1)!=nonspatial(b2):raise ValueError('EGO baseline/control differs; do not accept a new regression')
 if any(e['blocked'] for s in b2['snapshots'] for k in ['restored','firstTick'] for e in s[k]['actors']):raise ValueError('EGO actor collision failure')
 structure=json.loads((OUT/'results.json').read_text())
 if structure['passed']!=30 or structure['failed']!=0:raise ValueError('B2 structure gate failed')
 files=['results.json','production-order/results.json','production-order/audit.json','production-order/ego-b1.json','production-order/ego-b2.json']
 for n in files:
  if (OUT/n).stat().st_mtime_ns<began:raise ValueError('Stale evidence: '+n)
 record={'schema':'m0.hospital-b2.fresh-cpu/v1','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'executedCommands':commands,'resultHashes':{n:sha(OUT/n) for n in files},'runtimeHashes':{n:sha(OUT/'site'/n) for n in ['index.html','dist/phase1.js']},'structure':{'passed':30,'failed':0},'productionOrder':{'passed':8,'failed':1,'scripts':len(result['moduleOrder'])},'knownFailure':{'name':failures[0]['name'],'B1B2ControlMatched':True,'resolved':False,'originalUserFailureConfirmed':False},'acceptedForRestrictedTest':True,'allTestsPassed':False,'originalUserSavesUsed':False,'browser':False,'GPU':False,'finished':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 (OUT/'cpu-preflight.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
if __name__=='__main__':main()
