#!/usr/bin/env python3
"""R292 영웅 버튼별 손그림 프레임 이펙트 띠 → 게임용 WebP + index.json (사용자 2026-11-04 승인: "dots 생성 → 사용자 승인").

원천: 드라이브에서 받은 dots 제작 띠(읽기 전용). 384×384 칸이 가로로 N(8~12)장, RGBA.
  dir    = 오른쪽을 향하고 기준점 (48,192) → 게임이 겨눈 방향으로 돌려 기준점을 영웅(또는 시작점)에 놓는다.
  radial = 칸 가운데 (192,192) 를 영웅(또는 표적)에 놓는다.
  fit    = 'path' 면 기준점→(기준점+fitPx) 를 실제 이동 거리(블링크·대시 시작→끝)에 맞춰 늘인다.
  lift   = 기준점을 몸 높이(기본 .3×키)가 아닌 발밑(0)에 — 기준점 y 가 192 가 아닌 바닥 그림(네온 W)에 자동으로 붙는다.
  scale  = 384 칸 한 변이 화면에서 몇 칸(TILE×zoom)인지. dur = 한 번 재생 시간(초).

이 스크립트는 원천 SHA-256 을 대조한 뒤(다르면 멈춤) 무손실 WebP(exact, 픽셀 동일 확인)로 옮기고
r96/runtime-text/assets/r292/fx/index.json 을 다시 쓴다. 새 띠는 ROWS 에 한 줄 더하고 다시 돌린 뒤
`python3 scripts/sync-r99.py assets/r292/fx/<영웅>/<동작>.webp assets/r292/fx/index.json` 을 돌린다.

사용: python3 -I scripts/r292-fx-strips.py <원천 상위 폴더(드라이브 띠 PNG 들을 아래 상대경로로 둔 곳)>
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'r96' / 'runtime-text' / 'assets' / 'r292' / 'fx'
CELL = 384
REASON = 'dots 생성 → 사용자 승인 2026-11-04'

# (영웅, 동작, 원천 상대경로, 원천 sha256, 칸 수, anchor, 기준점, 재생초, scale, blend, fit, 메모)
#  동작: basic = 기본공격(A), blink = 블링크(S), special = 고유기술(Q), w/e/r = 원천 스토리 기술 슬롯(73a source W/E/R).
ROWS = [
 ('gunner', 'w', 'drive-review-1104c/07_gunner_Z/07_gunner_Z_v1.png', '1819578ac88a53195eebcb045343e1de260338fae8c7ed92f8df4126ab2a55e8', 8, 'radial', [192, 192], .55, 6.0, 'screen', None, '상태 정화(purify) — 영웅 둘레 고리'),
 ('gunner', 'e', 'drive-review-1104c/07_gunner_E/07_gunner_E_v1.png', 'b2a66542a4e2bcffaf8bb5c249f397dae2a43038a559ef573ed7cb84168009e1', 8, 'dir', [48, 192], .45, 4.6, 'screen', 'path', '팬텀 블링크(dash) — 시작점→끝점'),
 ('gunner', 'blink', 'drive-review-1104c/07_gunner_S/07_gunner_S_v1.png', 'ed68ac3c900ea7e932852c33fb7976234ffbd11b3d8e95457bb14c4382c7cee7', 8, 'dir', [48, 192], .35, 4.6, 'screen', 'path', '블링크 — 출발점→도착점'),
 ('hwando', 'basic', 'drive-review-1104b/hwando_png/08_hwando_A_v1.png', '41cf523e553b5df5f9c33cd667a0f761510d53924e9701af121d24840ff86d29', 8, 'dir', [60, 192], .30, 3.6, 'screen', None, '기본 베기 — 칼자국이 x≈54~66 에서 시작해 기준점 60'),
 ('hwando', 'blink', 'drive-review-1104c/08_hwando_S/08_hwando_S_v1.png', 'b88f5db1b6029f2e10c93011dedb0c867c93c467f2852e4031a2cb2cbe06b636', 8, 'dir', [48, 192], .35, 4.6, 'screen', 'path', '블링크 — 출발점→도착점'),
 ('hwando', 'special', 'drive-review-1104c/08_hwando_Q/08_hwando_Q_v1.png', '3622ddc4ca46bfc0aa89a7758003f5a0dce146a9360a42a14010f059d89d1491', 10, 'radial', [192, 192], .60, 7.0, 'screen', None, '정화 연참 — 영웅 앞 X 베기'),
 ('hwando', 'w', 'drive-review-1104c/08_hwando_Z/08_hwando_Z_v1.png', '0faf4fe698422659f914e094ffdabaab73cb6a6a7be625b17366e9db59e77275', 10, 'radial', [192, 192], .60, 10.0, 'screen', None, '월섬 회천(circle, 반경 3.15) — 영웅 둘레 원 베기'),
 ('hwando', 'e', 'drive-review-1104c/08_hwando_E/08_hwando_E_v1.png', 'e5836736a8c4c7a7e30b5f79ab725c232b39ca811df76e1a8d475413efd187ed', 8, 'dir', [48, 192], .45, 4.6, 'screen', 'path', '백은 유영보(dash) — 시작점→끝점'),
 ('hwando', 'r', 'drive-review-1104c/08_hwando_R/08_hwando_R_v1.png', '0855196530d345aa65a04d8a3f39e9a22260195585525a69a5c3ac60fd5f9d31', 12, 'dir', [48, 192], 1.0, 6.0, 'screen', None, 'EGO 환수검(slashes, 7파 1초) — 겨눈 쪽으로 칸을 가로지르는 베기'),
 ('seoha', 'basic', 'drive-review-1104c/09_seoha_A/09_seoha_A_v1.png', '66842e9cccfd95a558cf49e57ad5f8d066908d63d619b052dc41189f714ae4a7', 8, 'dir', [48, 192], .30, 4.4, 'screen', None, '기본 사격 — 총구 섬광·탄도'),
 ('neon', 'basic', 'drive-review-1104c/10_neon_A/10_neon_A_v1.png', '1e06a4eb2de09ebcf661f4090f95e21f0fff0a7eef59942b807b1569822aa1e0', 8, 'dir', [48, 192], .30, 3.6, 'screen', None, '기본 전격 베기'),
 ('neon', 'special', 'drive-review-1104c/10_neon_Q/10_neon_Q_v1.png', '18181e23dd1ef363ee7e98d38a3f558503e2c4cc70b82c865032d754d4b3180a', 10, 'dir', [48, 192], .60, 7.0, 'screen', None, '회로 폭주 — 겨눈 쪽 연쇄 번개'),
 ('lauren', 'basic', 'drive-review-1104c/11_lauren_A/11_lauren_A_v1.png', 'cefc54f4541baa5cb516880d9148d87e005ab62797a8cb76473707b7419cb662', 8, 'dir', [48, 192], .30, 3.6, 'source-over', None, '기본 마력 베기(보라·어두운 색이라 일반 합성)'),
 ('lauren', 'blink', 'drive-review-1104c/11_lauren_S/11_lauren_S_v1.png', '1299298075348b4982b42063e69b5287a1ede97929924c076e43a2a78346ad8a', 8, 'dir', [48, 192], .35, 4.6, 'source-over', 'path', '블링크 — 출발점→도착점(어두운 보라라 일반 합성)'),
 ('gunner', 'r', 'drive-review-1104d/07_gunner_R_v2/07_gunner_R_v2.png', 'b96518e71909b53dd2a31a4f658fc2a4d2d4ce0ae9183262900a168c2ad7074f', 12, 'dir', [48, 192], 1.0, 6.0, 'screen', None, '시간 지연포(delay-burst, 0.7초 뒤 폭발) — 겨눈 쪽 탄 + 끝 폭발'),
 ('seoha', 'w', 'drive-review-1104d/09_seoha_W_v2/09_seoha_W_v2.png', 'a0e594862ef47423c15dccb5bcdf3877b616c5b797b00d98d0e6130fd87f265e', 10, 'radial', [192, 192], .60, 6.0, 'screen', None, '죽은 시간 개방(haste) — 영웅 둘레(5~8칸이 약 6px 높게 그려짐, 승인 시 허용)'),
 ('seoha', 'e', 'drive-review-1104d/09_seoha_E_v1/09_seoha_E_v1.png', '984765f6aed8191d8028a28c3a017b39ea8f2cd8936933b5d723a0908c151873', 8, 'dir', [48, 192], .45, 4.6, 'screen', 'path', '카이로스의 순간(dash) — 시작점→끝점'),
 ('neon', 'blink', 'drive-review-1104d/10_neon_S_v2_review/10_neon_S_v2_review.png', '3cab69fab75e296ff89c6647f097ec0d6baeef0a9d1e66e3466767dbf2685c7a', 8, 'dir', [48, 192], .35, 4.6, 'screen', 'path', '블링크 — 출발점→도착점'),
 ('neon', 'w', 'drive-review-1104d/10_neon_W_v1/10_neon_W_v1.png', '3c7741cee9251ce244535ee75505d2b8b460be4392218866acdf3288e4e32d8c', 10, 'radial', [192, 290], .60, 7.0, 'screen', None, '성역 수복(heal-zone, 반경 3) — 바닥 원 방벽, 그림 중심 (192,290)을 발밑에(lift 0)'),
]


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main(src_root):
    src_root = Path(src_root)
    effects = {}
    for hero, action, rel, want, frames, anchor, origin, dur, scale, blend, fit, note in ROWS:
        raw = (src_root / rel).read_bytes()
        if sha(raw) != want:
            raise SystemExit(f'sha256 mismatch: {rel}')
        im = Image.open(src_root / rel)
        im.load()
        if im.mode != 'RGBA':
            im = im.convert('RGBA')
        if im.size != (frames * CELL, CELL):
            raise SystemExit(f'size {im.size} != {frames}x{CELL}: {rel}')
        dst = OUT / hero / f'{action}.webp'
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, 'WEBP', lossless=True, quality=100, method=6, exact=True)
        back = Image.open(dst)
        back.load()
        if back.convert('RGBA').tobytes() != im.tobytes():
            raise SystemExit(f'lossless round trip differs: {dst}')
        out = dst.read_bytes()
        effects.setdefault(hero, {})[action] = {
            'file': f'{hero}/{action}.webp', 'driveName': Path(rel).name, 'sourceSha256': want, 'sourceBytes': len(raw),
            'sha256': sha(out), 'bytes': len(out), 'size': [frames * CELL, CELL], 'cell': CELL, 'frames': frames,
            'anchor': anchor, 'origin': origin, 'dur': dur, 'scale': scale, 'blend': blend, 'fit': fit,
            'note': note, 'reason': REASON}
        if origin[1] != 192:
            effects[hero][action]['lift'] = 0  # 바닥 기준 그림: 기준점을 발밑에
        print(hero, action, len(raw), '->', len(out))
    idx = {'revision': 'R292-fx-strips-1', 'cell': CELL, 'reason': REASON,
           'source': 'Google Drive dots 제작 띠(읽기 전용 원천, 원본은 덮어쓰지 않음)', 'effects': effects}
    (OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')


if __name__ == '__main__':
    main(sys.argv[1])
