#!/usr/bin/env python3
"""Exact B3 source/runtime/evidence pin following preserved R77, B1 and B2 gates."""
import hashlib,importlib.util,json,os,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'out/hospital-b3/site'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def require(ok,message):
 if not ok:raise ValueError(message)
def main():
 spec=importlib.util.spec_from_file_location('b1gate',ROOT/'scripts/hospital-b1-release-gate.py');g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
 a=json.loads((ROOT/'scripts/hospital-b1-approved-runtime.json').read_text());b=a.get('hospitalB3',{})
 require(b.get('status')=='approved','B3 source/runtime independent review required')
 event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text()) if os.environ.get('GITHUB_EVENT_NAME')=='pull_request' else None
 source=g.validate_source(a,event=event);head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
 m=json.loads((SITE/'web-manifest-r62.json').read_text());c=m['hospitalB3'];actual={n:sha(SITE/n) for n in ['index.html','dist/phase1.js']}
 require(actual==b.get('expectedRuntime')==c.get('runtimeHashes'),'B3 runtime differs from exact review pin')
 require(c.get('storagePrefix')==b.get('storagePrefix')=='storyworld.hospital-b3.test.v1:','B3 namespace differs')
 require(c.get('rendererCacheKey')==b.get('rendererCacheKey'),'B3 renderer cache differs')
 require(c.get('buildSourceCommit')==head==os.environ.get('GITHUB_SHA',head) and c.get('sourceTreeDirty') is False,'B3 build source differs/dirty')
 require(all(c.get(k) is False for k in ['originalSaveImported','B1SaveImported','B2SaveImported','saveSchemaChanged']),'B3 save isolation contract differs')
 require(b.get('knownEGOFailure')=='B2/B3 synthetic EGO HP changes on first tick; unresolved','B3 known-failure contract differs')
 for s in ['releaseR75','releaseR76','releaseR77','releaseHospitalB1','releaseHospitalB2']:require(m.get(s,{}).get('status')=='approved','Upstream release approval missing: '+s)
 require(g.asset_digest(m)==a['baselineAssetRowsSHA256'],'B3 original asset table differs')
 require(m['fileCount']==len(m['files'])==1914 and len({r['path'] for r in m['files']})==1914,'B3 file set differs')
 for r in m['files']:
  p=(SITE/r['path']).resolve();require(p.is_relative_to(SITE.resolve()) and not (SITE/r['path']).is_symlink() and p.is_file() and p.stat().st_size==r['bytes'] and sha(p)==r['sha256'],'B3 file/asset bytes differ: '+r['path'])
 require(m['webHTMLSha256']==actual['index.html'] and m['totalBytes']==sum(r['bytes'] for r in m['files']) and m['largest']==sorted(m['files'],key=lambda r:r['bytes'],reverse=True)[:20],'B3 manifest differs')
 reviewed=json.loads((ROOT/source['evidenceFile']).read_text());require(reviewed.get('hospitalB3',{}).get('runtimeHashes')==actual,'B3 reviewed evidence missing')
 receipt=json.loads((ROOT/'docs/hospital-b3-evidence/STABILITY-RECEIPT.json').read_text())
 require(all(receipt['files']['site/'+n]==actual[n] for n in actual),'B3 differs from executed focused candidate')
 require(receipt.get('focusedResults')=={'doorAndRestoreAssertions':{'pass':10,'fail':0},'physicalLayoutDoorConfigurations':{'pass':8,'fail':0}},'B3 focused evidence differs')
 for n in ['doors.json','doors.log','doors.mjs','runtime.mjs','geometry-focus.json','geometry-focus.mjs']:
  require(sha(ROOT/'docs/hospital-b3-evidence'/n)==receipt['files']['evidence/'+n],'B3 executed evidence changed: '+n)
 m['releaseHospitalB3']={'status':'approved','reviewedSourceCommit':source['headSha'],'reviewedPullRequest':source['pullRequest'],'buildSourceCommit':head,'runtimeHashes':actual,'storagePrefix':c['storagePrefix'],'knownEGOFailure':b['knownEGOFailure'],'allTestsPassed':False,'userScreenReviewPending':True}
 m['hospitalB3']['status']='approved restricted test; user play pending';m.update(deploymentSHA=head,deploymentUTC=__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),remotePublished=False)
 target=SITE/'web-manifest-r62.json';target.write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n')
 outputs={'html_sha':actual['index.html'],'renderer_sha':actual['dist/phase1.js'],'manifest_sha':sha(target),'asset_hashes_json':json.dumps(m['releaseR75']['generatedAssets'],sort_keys=True)}
 if os.environ.get('GITHUB_OUTPUT'):
  with open(os.environ['GITHUB_OUTPUT'],'a') as f:
   for k,v in outputs.items():f.write(k+'='+v+'\n')
 print(json.dumps({'status':'B3_RESTRICTED_TEST_PIN_PASSED','commit':head,**outputs,'knownEGOFailure':True}))
if __name__=='__main__':
 try:main()
 except ValueError as e:raise SystemExit(str(e))
