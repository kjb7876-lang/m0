#!/usr/bin/env python3
"""Exact B2 test artifact gate; preserve upstream B1/source and R75/R76/R77 gates."""
import hashlib,importlib.util,json,os,subprocess
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'out/hospital-b2/site'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def fail(s):raise ValueError(s)
def upstream():
 spec=importlib.util.spec_from_file_location('b1gate',ROOT/'scripts/hospital-b1-release-gate.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def validate(site,approval):
 b=approval.get('hospitalB2',{})
 if b.get('status')!='approved':fail('B2 exact source/runtime has not been independently approved')
 if b.get('storagePrefix')!='storyworld.hospital-b2.test.v1:' or b.get('knownEGOFailure')!='B1/B2 synthetic EGO HP changes on first tick; unresolved':fail('B2 review contract differs')
 m=json.loads((site/'web-manifest-r62.json').read_text());c=m.get('hospitalB2',{});actual={n:sha(site/n) for n in ['index.html','dist/phase1.js']}
 if actual!=b.get('expectedRuntime') or c.get('runtimeHashes')!=actual or m.get('webHTMLSha256')!=actual['index.html']:fail('B2 exact runtime pin mismatch')
 if c.get('storagePrefix')!=b['storagePrefix'] or c.get('rendererCacheKey')!=b.get('rendererCacheKey') or any(c.get(k) is not False for k in ['B1SaveImported','originalSaveImported','saveSchemaChanged']):fail('B2 namespace/cache/import contract differs')
 if c.get('sourceTreeDirty') is not False:fail('Dirty B2 build source')
 for s in ['releaseR75','releaseR76','releaseR77','releaseHospitalB1']:
  if m.get(s,{}).get('status')!='approved':fail('Preserved upstream approval missing: '+s)
 if m['releaseHospitalB1']['runtimeHashes']!=approval['expectedRuntime']:fail('B1 artifact provenance differs')
 rows=m.get('files',[])
 if len(rows)!=1914 or len({r['path'] for r in rows})!=1914 or upstream().asset_digest(m)!=approval['baselineAssetRowsSHA256']:fail('B2 file set/original assets differ')
 for row in rows:
  rel=PurePosixPath(row['path'])
  if rel.is_absolute() or '..' in rel.parts or '\\' in row['path']:fail('Unsafe file path')
  p=site.joinpath(*rel.parts)
  if p.is_symlink() or any(q.is_symlink() for q in p.parents if q!=site.parent and q.is_relative_to(site)) or not p.is_file() or p.stat().st_size!=row['bytes'] or sha(p)!=row['sha256']:fail('B2 file bytes/symlink mismatch: '+row['path'])
 if m['fileCount']!=len(rows) or m['totalBytes']!=sum(r['bytes'] for r in rows) or m['largest']!=sorted(rows,key=lambda r:r['bytes'],reverse=True)[:20]:fail('B2 manifest totals differ')
 return m,c,actual
def main():
 a=json.loads((ROOT/'scripts/hospital-b1-approved-runtime.json').read_text());event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text()) if os.environ.get('GITHUB_EVENT_NAME')=='pull_request' else None
 source=upstream().validate_source(a,event=event);m,c,actual=validate(SITE,a)
 head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
 if c['buildSourceCommit']!=head or os.environ.get('GITHUB_SHA',head)!=head:fail('B2 build/CI source differs')
 pre=json.loads((SITE.parent/'cpu-preflight.json').read_text())
 if pre['sourceCommit']!=head or pre['runtimeHashes']!=actual or pre.get('structure')!={'passed':30,'failed':0} or pre.get('productionOrder')!={'passed':8,'failed':1,'scripts':105} or pre.get('knownFailure',{}).get('B1B2ControlMatched') is not True or pre.get('allTestsPassed') is not False:fail('B2 fresh scoped evidence differs')
 for n,v in pre['resultHashes'].items():
  p=(SITE.parent/n).resolve()
  if not p.is_relative_to(SITE.parent.resolve()) or sha(p)!=v:fail('B2 fresh result changed')
 reviewed=json.loads((ROOT/source['evidenceFile']).read_text())
 if reviewed.get('hospitalB2',{}).get('runtimeHashes')!=actual or reviewed.get('hospitalB2',{}).get('knownFailure',{}).get('B1B2ControlMatched') is not True:fail('Reviewed B2 evidence missing')
 m['hospitalB2']['status']='approved restricted test; user play pending';m['releaseHospitalB2']={'status':'approved','reviewedSourceCommit':source['headSha'],'reviewedPullRequest':source['pullRequest'],'buildSourceCommit':head,'runtimeHashes':actual,'storagePrefix':c['storagePrefix'],'knownEGOFailure':a['hospitalB2']['knownEGOFailure'],'originalSaveImported':False,'B1SaveImported':False,'allTestsPassed':False}
 target=SITE/'web-manifest-r62.json';target.write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n');manifest=sha(target)
 outputs={'html_sha':actual['index.html'],'renderer_sha':actual['dist/phase1.js'],'manifest_sha':manifest,'asset_hashes_json':json.dumps(m['releaseR75']['generatedAssets'],sort_keys=True)}
 if os.environ.get('GITHUB_OUTPUT'):
  with open(os.environ['GITHUB_OUTPUT'],'a') as f:
   for k,v in outputs.items():f.write(k+'='+v+'\n')
 print(json.dumps({'status':'B2_RESTRICTED_TEST_PIN_PASSED','commit':head,**outputs,'knownEGOFailure':True}))
if __name__=='__main__':
 try:main()
 except ValueError as e:raise SystemExit(str(e))
