> **과거 V4/R80 기록입니다.** 최신 V5 결과는 `r81/final-suite.json`과 패키지 최상위 `V5-R81-RESULTS.json`을 확인하세요. 아래 수치·절차는 V5 합산 결과가 아닙니다.

# R80 재현 안내

게임 실행은 ZIP의 START-HERE.txt를 보세요. 저장소에서는 pc-test-r80/README.md와 scripts/assemble-r80-review.py를 사용합니다.

현재 결과는 qa/CPU-RESULTS.md 및 r80/final-results.json입니다. Node VM의 DOM·이미지·오디오·타이머와 renderer readiness는 stub입니다. 보조 위치 설정·체력 조정·합성 키 입력이 포함됩니다. 실제 브라우저/GPU/자연 플레이와 Windows 런처는 미검증입니다.

조립된 작업 폴더에서 실행합니다.

```bash
node qa/run-final.cjs
node qa/world-r78-layout.cjs
node qa/world-r78-story-spawn.cjs
node qa/world-r78-combat-input.cjs
node qa/world-r78-visual.cjs
node qa/package-check.cjs
node qa/r80-integration.cjs
```

원본 자산 검사에는 Pillow와 제공된 ZIP 5개를 한 폴더에 압축 해제한 원본, 보존한 V3 site가 필요합니다.

```bash
python qa/r80/verify-assets.py --source PATH_TO_EXTRACTED_ASSETS --baseline-site PATH_TO_PRESERVED_V3_SITE
```

전체 GitHub 검토 폴더 조립은 저장소에 보존된 R62 runtime packs로 시작합니다. 조립기는 현재 후보 manifest 전체의 크기와 SHA256을 확인합니다. QA의 과거 V1·V2·V3 결과와 최초 실패 기록은 이력이며 현재 통과 수는 최종 보고서에 지정된 실제 결과 파일에서만 집계합니다.
