from pathlib import Path
import datetime,hashlib,json

root=Path(__file__).resolve().parents[2]
qa=root/'qa';site=root/'hospital-three-pc/site'
gate=json.loads((qa/'final-run-results.json').read_text())
other=json.loads((qa/'r80/other-runs.json').read_text())
files=['layout-results.json','roof-results.json','maze-results.json','cold-results.json','ego-regression-results.json','champion-results.json','migration-results.json','world-r78-layout-results.json','world-r78-story-spawn-results.json','world-r78-combat-input-results.json','world-r78-visual-results.json','package-results.json','r80/assets-results.json','r80/integration-results.json']
stages=[]
for name in files:
    p=qa/name;d=json.loads(p.read_text());checks=d.get('checks',[])
    if not checks:raise ValueError('Missing checks: '+name)
    stages.append({'report':name,'passed':sum(c.get('passed') is True for c in checks),'total':len(checks),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
unchanged=all(hashlib.sha256((site/name).read_bytes()).hexdigest()==sha for name,sha in gate['sourceHashes'].items())
passed=bool(gate['passed'] and gate['sourceUnchangedDuringRun'] and unchanged and len(other)==5 and all(x['exitCode']==0 for x in other) and all(x['passed']==x['total'] for x in stages))
catalog=json.loads((site/'assets/world-r80/catalog.json').read_text())
report={'revision':'R80 / V4','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Node CPU VM with assisted native checkpoints, actor positioning and scripted combat; native save/restore, Three r186 CPU geometry, byte hashes, local HTTP. No browser/GPU/natural play.','passed':passed,'checksPassed':sum(s['passed'] for s in stages),'checksTotal':sum(s['total'] for s in stages),'stages':stages,'nativeFrozenGate':gate,'otherRuns':other,'nativeGateSourceHashesStillMatch':unchanged,'assetSelection':catalog['selectedCounts'],'runtimeAssets':len(catalog['assets']),'mappedScenes':len(catalog['regions']),'combatMazeMaps':55,'sourcePNGsPreserved':254,'browserVerified':False,'GPUVerified':False,'naturalPlayVerified':False,'WindowsLauncherVerified':False,'remotePublication':'existing review branch only; main, PR, public deployment, gate/pin and security unchanged'}
payload=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
(root/'hospital-three-pc/V4-R80-RESULTS.json').write_text(payload)
(root/'hospital-three-pc/FINAL-TEST-RESULTS.json').write_text(payload)
lines=['# V4 / R80 단계별 CPU 검사 결과','',f"통과 {report['checksPassed']}/{report['checksTotal']} · 생성 {report['generatedAt']}",'','보조 위치 설정·합성 입력·체력 조정이 포함된 Node CPU 검사입니다. 브라우저/GPU/자연 플레이·Windows 런처 검증은 하지 않았습니다.','', '| 실제 결과 파일 | 통과 |','|---|---|']
lines += [f"| {s['report']} | {s['passed']}/{s['total']} |" for s in stages]
lines += ['', '동결한 게임 소스 해시는 native 회귀 실행 전후 및 이 보고서 생성 시점에 일치했습니다. 최초 실패는 테스트 저장 접두사/fixture 준비 오류를 실제 수정한 뒤 전체 또는 해당 검사를 재실행했습니다. 과거 결과를 현재 통과 수로 합산하지 않았습니다.','', '새 자산은 신규 141개와 기존 12개입니다. 원본 254개와 기존 자산·음원·서사 payload 바이트 보존을 확인했습니다.']
(qa/'CPU-RESULTS.md').write_text('\n'.join(lines)+'\n')
(qa/'r80/final-results.json').write_text(payload)
print(json.dumps({'passed':passed,'checks':report['checksPassed'],'total':report['checksTotal']}))
if not passed:raise SystemExit(1)
