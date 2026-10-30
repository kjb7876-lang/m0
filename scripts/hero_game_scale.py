"""R134: 게임이 영웅 정지 그림을 그릴 때 쓰는 기준 키(visibleHeight)와 자르기 상자(sourceRect)를 읽는다.
게임은 그림의 visibleHeight 픽셀을 영웅 몸 키(66*zoom)로 늘려 그린다. 대체본의 몸 키를 이 값에 맞춰야 동작마다 몸 크기가 같다.
(R128/R130 은 원래 그림의 테두리 키에 맞춰, 원래 그림 자체가 기준과 어긋난 뒷모습·위 대각선 그림이 최대 1.5배 크게 보였다.)"""
import json
from pathlib import Path
def load(site):
    site = Path(site); s = (site / 'index.html').read_text(encoding='utf-8')
    i = s.find('id="portable-data">') + len('id="portable-data">'); d = json.loads(s[i:s.find('</script>', i)])
    r83 = (site / 'hero-presentation-r83.js').read_text(encoding='utf-8'); j = r83.find('const DATA=') + len('const DATA=')
    prof = json.loads(r83[j:r83.find('};\n', j) + 1])['profiles']
    out = {}
    for v in d['heroNativePresentation5']['routes'].values():
        p, f = (v.get('path') or '').lstrip('./'), v.get('frame')
        if not p or not f or v.get('atlasSheet'): continue
        pr = prof.get(p); same = pr and all(abs(a - b) < .01 for a, b in zip(pr['sourceRect'], f['sourceRect']))
        sr, pv = (pr['sourceRect'], pr['pivot']) if same else (f['sourceRect'], f['pivot'])
        out[p] = {'visibleHeight': pr['visibleHeight'] if pr else f['visibleHeight'], 'sourceRect': f['sourceRect'], 'foot': [sr[0] + pv[0], sr[1] + pv[1]]}  # R134 foot: 게임이 이 그림의 발로 쓰는 점
    return out
