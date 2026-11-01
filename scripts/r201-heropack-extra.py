#!/usr/bin/env python3
"""R201 영웅 기본팩(Drive *-scoped-static-default) — 게임에 아직 없는 추가 동작만 R143 형식 가로 스트립으로.

사용자 2026-11-01 "영웅 자산 검수 후 적용 … 확보한 동작/방향/실제 프레임 수 목록화 … rect_xywh 를 따라".
  · manifest 의 frames[](파일·rect_xywh 순서)를 그대로 따른다. 개별 PNG 여러 장(로렌 DASH-S)도 같은 방식.
    frames 가 없는 팩(미카엘라·서하)은 path 의 가로 스트립 192×256 칸을 frame_count 만큼.
  · 파일 sha256 을 manifest 와 대조하고, 칸 안 발(알파 하단)·머리(알파 상단)를 재서 index.json 에 남긴다(엔진 발 기준점).
  · 기본 5동작(대기·걷기·공격·피격·사망)은 이미 들어간 그림과 같은지 heropack_scan 으로 따로 확인한다 — 여기서는 만들지 않는다.
  · 원본 PNG 는 바꾸지 않는다. 조건부·제외 세트는 기본팩에 없으므로 다루지 않는다.
Usage: python3 -I scripts/r201-heropack-extra.py <hero dir with manifest.json> <hero id> r96/runtime-text/assets/r143 <action> [<action> …]
"""
import sys, json, hashlib, os
import numpy as np
from PIL import Image

src, hero, out, acts = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
sha = lambda b: hashlib.sha256(b).hexdigest()
m = json.load(open(os.path.join(src, 'manifest.json'), encoding='utf8'))
zipnote = m.get('title_ko') or m.get('title') or ''
for act in acts:
    rows = {}
    for a in m['assets']:
        if a['action'] != act: continue
        files = a.get('files') or [{'path': a['path'], 'sha256': a['sha256']}]
        for f in files:
            if sha(open(os.path.join(src, f['path']), 'rb').read()) != f['sha256']: raise SystemExit('sha mismatch ' + f['path'])
        if 'frames' in a:
            cells = []
            for f in a['frames']:
                x, y, w, h = f['rect_xywh']; cells.append(Image.open(os.path.join(src, f['file'])).convert('RGBA').crop((x, y, x + w, y + h)))
        else:
            im = Image.open(os.path.join(src, a['path'])).convert('RGBA'); cells = [im.crop((i * 192, 0, (i + 1) * 192, 256)) for i in range(a['frame_count'])]
        if len(cells) != a['frame_count'] or any(c.size != (192, 256) for c in cells): raise SystemExit('frame layout mismatch %s %s' % (act, a['direction']))
        strip = Image.new('RGBA', (192 * len(cells), 256), (0, 0, 0, 0))
        for i, c in enumerate(cells): strip.paste(c, (i * 192, 0))
        al = [np.asarray(c)[..., 3] for c in cells]
        feet = [int(np.nonzero(x > 40)[0].max()) for x in al]; tops = [int(np.nonzero(x > 40)[0].min()) for x in al]
        d = a['direction']; dst_dir = os.path.join(out, act, hero); os.makedirs(dst_dir, exist_ok=True)
        dst = os.path.join(dst_dir, '%s-%s.webp' % (act, d)); strip.save(dst, 'WEBP', quality=92, method=6); b = open(dst, 'rb').read()
        rows[d] = {'path': 'assets/r143/%s/%s/%s-%s.webp' % (act, hero, act, d), 'frames': len(cells), 'cell': [192, 256], 'footY': int(round(float(np.median(feet)))),
                   'feet': feet, 'tops': tops, 'sha256': sha(b), 'bytes': len(b), 'status': a.get('status'),
                   'source': {'files': [{'path': f['path'], 'sha256': f['sha256']} for f in files], 'manifest': zipnote}}
        print(hero, act, d, len(cells), 'foot', rows[d]['footY'], 'bytes', len(b))
    if rows:
        json.dump({'revision': 'R201', 'hero': hero, 'action': act, 'directions': rows,
                   'note': '기본팩(scoped static default) 추가 동작. 없는 방향은 기존 그림 유지, W/SW/NW 는 E/SE/NE 반전(기존 매핑). 최소 12칸 미충족(팩 README). 실게임 재생·VFX 연동은 팩 기준 미검증.'},
                  open(os.path.join(out, act, hero, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
