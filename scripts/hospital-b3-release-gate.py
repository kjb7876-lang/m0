#!/usr/bin/env python3
"""Exact hospital-only B3 runtime and fresh focused-test gate."""
import hashlib, importlib.util, json, os, subprocess
from pathlib import Path, PurePosixPath

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'out/hospital-b3/site'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def require(ok,message):
    if not ok: raise ValueError(message)

def main():
    spec=importlib.util.spec_from_file_location('b1gate',ROOT/'scripts/hospital-b1-release-gate.py')
    gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
    approval=json.loads((ROOT/'scripts/hospital-b1-approved-runtime.json').read_text())
    b=approval.get('hospitalB3',{})
    require(b.get('status')=='approved','B3 exact source/runtime still requires independent approval')
    event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text()) if os.environ.get('GITHUB_EVENT_NAME')=='pull_request' else None
    source=gate.validate_source(approval,event=event)
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    manifest=json.loads((SITE/'web-manifest-r62.json').read_text())
    candidate=manifest.get('hospitalB3',{})
    actual={name:sha(SITE/name) for name in ('index.html','dist/phase1.js')}
    require(actual==b.get('expectedRuntime')==candidate.get('runtimeHashes'),'B3 runtime differs from exact approved hashes')
    require(candidate.get('storagePrefix')==b.get('storagePrefix')=='storyworld.hospital-b2.test.v1:','Public B2 save namespace was not preserved')
    require(candidate.get('rendererCacheKey')==b.get('rendererCacheKey'),'B3 cache key differs from approved candidate')
    require(candidate.get('buildSourceCommit')==head==os.environ.get('GITHUB_SHA',head),'Build source/CI checkout mismatch')
    require(candidate.get('sourceTreeDirty') is False,'B3 build source tree is dirty')
    require(candidate.get('storageNamespacePreserved') is True and candidate.get('existingNamespacePreserved') is True and candidate.get('existingPublicSavesRemainInPlace') is True,'Existing public save namespace was not retained')
    require(candidate.get('saveSchemaChanged') is False and candidate.get('saveFormatVersion')==1,'Existing R74 save contract changed')
    require(all(candidate.get(k) is False for k in ('existingSavesImported','originalSaveImported','B1SaveImported','B2SaveImported')),'A save import or migration was added')
    require(candidate.get('doorStateStorage')=='existing worldR74 v1 entries/opened fields','Door state left the existing save contract')
    require(candidate.get('roomDressingItems')==11,'The existing 11-item furnishing set changed')
    require(candidate.get('roomDressingPlanSHA256')==sha(ROOT/'client-source/hospital-b3/room-dressing-plan.json'),'Furnishing plan differs from reviewed source')
    require(b.get('knownEGOFailure')==approval.get('hospitalB2',{}).get('knownEGOFailure')=='B1/B2 synthetic EGO HP changes on first tick; unresolved','Existing EGO HP issue contract changed')
    for name in ('releaseR75','releaseR76','releaseR77','releaseHospitalB1','releaseHospitalB2'):
        require(manifest.get(name,{}).get('status')=='approved','Preserved upstream approval missing: '+name)
    require(gate.asset_digest(manifest)==approval['baselineAssetRowsSHA256'],'Original asset table changed')
    rows=manifest.get('files',[])
    require(manifest.get('fileCount')==len(rows)==1914 and len({r['path'] for r in rows})==1914,'Complete public file set differs')
    for row in rows:
        rel=PurePosixPath(row['path'])
        require(not rel.is_absolute() and '..' not in rel.parts and '\\' not in row['path'],'Unsafe manifest path')
        path=SITE.joinpath(*rel.parts)
        require(not path.is_symlink() and path.is_file() and path.stat().st_size==row['bytes'] and sha(path)==row['sha256'],'File/asset bytes changed: '+row['path'])
    require(manifest.get('webHTMLSha256')==actual['index.html'] and manifest.get('totalBytes')==sum(r['bytes'] for r in rows) and manifest.get('largest')==sorted(rows,key=lambda r:r['bytes'],reverse=True)[:20],'B3 manifest totals differ')

    door_result=json.loads((ROOT/'out/hospital-b3-stability/evidence/doors.json').read_text())
    prop_result=json.loads((ROOT/'out/hospital-b3-stability/evidence/room-dressing.json').read_text())
    require(door_result.get('candidateHTML')==actual['index.html'] and door_result.get('passed')==10 and door_result.get('failed')==0,'Fresh door/save test did not pass on exact B3 HTML')
    require(door_result.get('harnessHash')==sha(ROOT/'docs/hospital-b3-evidence/doors.mjs'),'Door test source differs from executed test')
    require(prop_result.get('candidateHTMLSHA256')==actual['index.html'] and prop_result.get('rendererSHA256')==actual['dist/phase1.js'] and prop_result.get('status')=='passed' and prop_result.get('passCount')==7 and prop_result.get('failCount')==0,'Fresh furnishing test did not pass on exact B3 HTML')
    require(prop_result.get('planSHA256')==candidate.get('roomDressingPlanSHA256') and prop_result.get('testSourceSHA256')==sha(ROOT/'docs/hospital-b3-evidence/props.mjs') and prop_result.get('harnessSourceSHA256')==sha(ROOT/'docs/hospital-b3-evidence/runtime.mjs'),'Furnishing test/plan source differs from executed test')

    review=json.loads((ROOT/source['evidenceFile']).read_text())
    reviewed=review.get('hospitalB3',{})
    require(review.get('schema')=='m0.hospital-b3.source-evidence/v1' and reviewed.get('runtimeHashes')==actual,'Reviewed source evidence is for another runtime')
    require(reviewed.get('storagePrefix')==candidate['storagePrefix'] and reviewed.get('storageNamespacePreserved') is True and reviewed.get('saveSchemaChanged') is False,'Reviewed source evidence changes the existing save contract')
    require(reviewed.get('doorAndSaveAssertions')=={'passed':10,'failed':0,'resultHTMLSHA256':actual['index.html'],'method':door_result.get('method')},'Reviewed door/save evidence differs from the fresh exact-candidate result')
    require(reviewed.get('furnishingAssertions',{}).get('passed')==8 and reviewed.get('furnishingAssertions',{}).get('failed')==0 and reviewed.get('furnishingAssertions',{}).get('resultHTMLSHA256')==actual['index.html'] and reviewed.get('furnishingAssertions',{}).get('rendererSHA256')==actual['dist/phase1.js'],'Reviewed furnishing evidence differs from the fresh exact-candidate result')
    manifest['releaseHospitalB3']={'status':'source-approved; release gate passed; user play pending','reviewedSourceCommit':source['headSha'],'reviewedPullRequest':source['pullRequest'],'buildSourceCommit':head,'runtimeHashes':actual,'storagePrefix':candidate['storagePrefix'],'saveSchemaChanged':False,'knownEGOFailure':b['knownEGOFailure'],'doorAssertions':{'passed':10,'failed':0},'furnishingAssertions':{'passed':8,'failed':0},'allTestsPassed':False,'userScreenReviewPending':True}
    candidate['status']='source-approved test candidate; user play pending'
    target=SITE/'web-manifest-r62.json'
    target.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
    outputs={'html_sha':actual['index.html'],'renderer_sha':actual['dist/phase1.js'],'manifest_sha':sha(target),'asset_hashes_json':json.dumps(manifest['releaseR75']['generatedAssets'],sort_keys=True,separators=(',',':'))}
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'],'a') as stream:
            for key,value in outputs.items(): stream.write(key+'='+value+'\n')
    print(json.dumps({'status':'B3_HOSPITAL_ONLY_APPROVED_TEST_PIN_PASSED','commit':head,**outputs,'storagePrefixPreserved':True,'saveSchemaChanged':False,'knownEGOFailure':True}))

if __name__=='__main__':
    try: main()
    except ValueError as error: raise SystemExit(str(error))
