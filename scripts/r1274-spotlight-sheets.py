#!/usr/bin/env python3
"""R1274 서윤 '붉은 조명(스포트라이트)' 임시 프레임 시트.
원천: assets/r563/dots/michaela-grand-pillar.webp (Dots 빛기둥 24칸, 6x4, 256칸) — 읽기만 하고 덮어쓰지 않는다.
밝기(휘도)를 새 색 띠로 다시 칠해 두 장을 만든다(알파 그대로). 최종 아트 아님(Dots 요청 대상).
 - spot-self24.webp : 서윤 자신을 비추는 무대 조명 — 진홍→장미→따뜻한 흰 심지(정본 "붉은 조명이 켜지며 끝없는 무대")
 - spot-hero24.webp : 영웅을 비추는 노출 조명 — 차가운 흰 보라 심지, 가장자리 자홍(불편한 노출감)
"""
import json, hashlib, os, sys
from PIL import Image
import numpy  # noqa  (로컬 생성 전용; CI 검사는 PIL 만 쓴다)
R = os.path.join(os.path.dirname(__file__), '..', 'r96', 'runtime-text')
SRC = 'assets/r563/dots/michaela-grand-pillar.webp'
OUT = 'assets/r1274'
RAMPS = {
  'spot-self24': [(0, (70, 6, 22)), (.35, (176, 22, 52)), (.65, (238, 92, 112)), (.85, (255, 196, 186)), (1, (255, 244, 232))],
  'spot-hero24': [(0, (46, 10, 58)), (.35, (150, 40, 150)), (.65, (206, 150, 236)), (.85, (236, 222, 255)), (1, (250, 248, 255))],
}
def ramp(stops, t):
  t = numpy.clip(t, 0, 1); out = numpy.zeros(t.shape + (3,), numpy.float32)
  for (a, ca), (b, cb) in zip(stops, stops[1:]):
    m = (t >= a) & (t <= b); u = ((t - a) / (b - a))[..., None]
    out[m] = (numpy.array(ca) * (1 - u) + numpy.array(cb) * u)[m]
  return out
def main():
  src = Image.open(os.path.join(R, SRC)).convert('RGBA'); a = numpy.asarray(src).astype(numpy.float32) / 255
  lum = a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
  lum = numpy.clip((lum - .15) / .8, 0, 1) ** .85
  idx = {}
  for k, stops in RAMPS.items():
    rgb = ramp(stops, lum); img = numpy.dstack([rgb, a[..., 3] * 255]).astype(numpy.uint8)
    p = os.path.join(R, OUT, k + '.webp'); Image.fromarray(img, 'RGBA').save(p, 'WEBP', quality=88, method=6)
    b = open(p, 'rb').read()
    idx[k] = {'frames': 24, 'cols': 6, 'cell': [256, 256], 'pivot': 'bottom-center(빛 고리 중심 y≈0.80)', 'final': False,
              'source': SRC + ' (Dots 빛기둥) 휘도 재채색 — scripts/r1274-spotlight-sheets.py', 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b),
              'use': '서윤(b05-boss) 붉은 조명 스킬 ' + ('자기 버프' if 'self' in k else '영웅 디버프')}
  # 서윤 공격(꽃잎 뿌리기) 그림 좌우반전 사본 — 원본·R700 정리본은 그대로 두고 새 파일만 만든다.
  ms = 'assets/r700/clean/assets/generated-v31224/actors-normalized/53c9ce212489_lust-human-attack.webp'
  mp = os.path.join(R, OUT, 'lust-human-attack-mirror.webp')
  Image.open(os.path.join(R, ms)).convert('RGBA').transpose(Image.FLIP_LEFT_RIGHT).save(mp, 'WEBP', lossless=True, method=6)
  b = open(mp, 'rb').read()
  idx['lust-human-attack-mirror'] = {'frames': 1, 'cell': list(Image.open(mp).size), 'final': True, 'source': ms + ' 좌우반전(mirror, 무손실) — 사용자 11-20 08:14Z "좌우반전하면됨"',
    'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b), 'use': '서윤(b05-boss) 0단계 공격 그림 — 꽃잎을 뿌리는 쪽이 몸 방향(영웅 쪽)과 맞게'}
  idx['_reuse'] = {'assets/r100/sig-aura-red.webp': '버프 지속 중 서윤 발치 붉은 기운(12칸, 그대로 재사용)', 'assets/r843/aura-loop8.webp': '디버프 지속 중 영웅 발치 검붉은 연무(8칸, 그대로 재사용)'}
  json.dump(idx, open(os.path.join(R, OUT, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
  print(json.dumps({k: v.get('bytes') for k, v in idx.items() if k[0] != '_'}))
main()
