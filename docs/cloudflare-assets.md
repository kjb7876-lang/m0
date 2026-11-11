# 무거운 에셋 Cloudflare 무료 이전 (R615)

코드와 사이트는 GitHub Pages(https://kjb7876-lang.github.io/m0/)에 그대로 두고, 무거운 에셋만 Cloudflare Pages 별도 프로젝트에서 받는다.

## 왜 R2 가 아니라 Cloudflare Pages 인가
- R2 는 무료 사용량(10GB)이 있어도 처음 켤 때 결제수단(카드·PayPal) 등록을 요구한다. 사용자 규칙상 결제수단·유료 결제를 피하므로 쓰지 않는다.
- Cloudflare Pages 무료 등급은 결제수단 없이 쓸 수 있고, 대역폭 제한이 없으며, 한도는 프로젝트당 파일 20,000개·한 파일 25MiB 다. 서사 음성 mp3(3,297개, 가장 큰 파일 수백 KB)는 여유 있게 들어간다. 총용량 한도는 없다.
- CORS 는 `_headers` 파일로 붙인다.

## 동작
| 부분 | 파일 | 하는 일 |
|---|---|---|
| 설정 | `r96/asset-cdn.json` | 프로젝트 이름 `storyworld-m0-assets`, 기준 주소 `https://storyworld-m0-assets.pages.dev/`, 대상 폴더(지금은 `assets/r381/voice/`) |
| 게임 로더 | `r96/client-source/asset-cdn-r615.js` | 시작할 때 `cdn-health.json` 을 한 번 묻고(4초 안), 맞을 때만 대상 폴더를 외부 주소로 바꾼다. 아니면 GitHub Pages 그대로. `?cdn=off` 로 끄고 `?cdn=https://…` 로 다른 주소를 시험한다 |
| 음성 | `r96/client-source/voice-r381.js` | 외부에서 받다 실패·8초 멈춤이면 같은 파일을 GitHub Pages 에서 한 번 더 받는다. 외부 연속 실패 3번이면 이번 접속 동안 외부를 끈다 |
| 묶기 | `scripts/cdn-pack.py` | site 에서 대상 폴더만 manifest 해시로 검증해 옮기고 `_headers`·`cdn-health.json` 을 만든다. 무료 한도를 넘으면 실패 |
| 올리기 | `.github/workflows/pages.yml` R615 단계 | main 에서만, 저장소 시크릿이 있을 때만 `wrangler pages deploy`. 시크릿이 없거나 실패해도 GitHub Pages 배포는 그대로 진행된다 |
| 공개 확인 | `scripts/cdn-verify.py` | 공개 주소의 health(manifest 해시·파일 수)·CORS·표본 8개 바이트를 확인 |

## 사용자가 할 일 (한 번)
API 토큰·계정 ID 는 채팅에 붙여 넣지 말고 GitHub 시크릿에만 넣는다.
1. https://dash.cloudflare.com/sign-up 에서 무료 계정을 만든다(결제수단 입력 안 함).
2. 대시보드 왼쪽 **Workers & Pages** 를 열고 오른쪽의 **Account ID** 를 복사한다.
3. 오른쪽 위 사람 아이콘 → **My Profile → API Tokens → Create Token → Custom token**. 권한은 **Account · Cloudflare Pages · Edit** 하나, Account Resources 는 내 계정. 만든 토큰은 한 번만 보이니 바로 복사한다.
4. GitHub 저장소 **Settings → Secrets and variables → Actions → New repository secret** 에 두 개를 넣는다.
   - `CLOUDFLARE_API_TOKEN` = 3번 토큰
   - `CLOUDFLARE_ACCOUNT_ID` = 2번 계정 ID
5. 넣었다고 알려 주면 main 배포를 다시 돌려 첫 업로드와 공개 확인을 한다. 그 뒤로는 main 병합 때마다 바뀐 파일만 올라간다.

## 현재 상태 (2026-11-10)
- #404 병합 뒤 main 배포에서 첫 업로드(3,298파일)와 공개 확인(`R615_CDN_PUBLIC_OK`)을 마쳤다. 공개 게임에서 음성을 `storyworld-m0-assets.pages.dev` 에서 받는 것도 헤드리스로 확인했다.
- R615b(사용자 결정 '빼기'): `r96/pages-exclude.json` 에 `assets/r381/voice/` 를 넣어 GitHub Pages 배포본에서 뺐다(약 1,080MB → 896MB). 저장소·site 에는 그대로 있다. Cloudflare 가 멈추면 음성만 브라우저 음성으로 바뀐다. 되돌리려면 그 항목을 지우고 `protected` 에 `assets/r381/` 을 다시 넣는다.
- 사몽역행 같은 새 음성은 `assets/r381/voice/` 에 넣으면 main 배포 때 Cloudflare 로 올라간다(바뀐 파일만).
