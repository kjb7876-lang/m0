# r6 메타데이터 수정 후보

이 폴더는 독립 사용 가능한 r5 selected 파생 패키지입니다. 원본 r5를 덮어쓰지 마세요. 수정 MANIFEST.json과 이 폴더의 provenance/atlases/residuals를 함께 사용하세요. 기존 실행 코드나 공개 배포에는 적용하지 않았습니다.

134개 존재하지 않는 routeEvidence를 null, routeStatus=UNRESOLVED_ROUTE로 바꿨습니다. 각각의 inventoryEvidence.file 및 jsonPath는 실제 선택 목록을 가리키지만 route/pivot 인증은 아닙니다. 나머지 67개 routeEvidence는 기존 행을 유지합니다. 이 행도 런타임 등록을 인증하지 않습니다.

182개 duration 미확정 variant 중 5개는 정적 단일 프레임입니다. 동적 177개, null pivot 608개, Lauren 6개 기준 scale 미확정은 변경하지 않았습니다. runtime route, FPS, GPU, 브라우저, 실제 기기, 저장 및 전투는 미검증입니다.

CHANGELOG.json에 모든 수정 항목을 기록했습니다. r6-evidence/에는 변경 전 r5 manifest와 결함 목록을 보존했습니다. 이전 INTEGRATION.md, VALIDATION.json, build_selected.py는 r5 이력으로 byte-exact 보존되어 있으며 r6 승인 문서가 아닙니다. build_selected.py를 실행하면 r5 메타데이터를 재생성할 수 있으므로 이 후보 위에서 실행하지 마세요.

재생성: python repair_metadata.py --source <r5 selected> --defects <broken-route-references.json> --destination <새 폴더>
검사: python verify_metadata.py <새 폴더> --source <r5 selected>

원본 MANIFEST.json만 수정한 134개 항목 및 metadataRevision 외에는 데이터 변경이 없어야 합니다. 새로운 PACKAGE-MANIFEST.json은 이 파생 패키지 파일의 SHA-256을 기록합니다.
