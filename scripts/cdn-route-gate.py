#!/usr/bin/env python3
"""R1308 — main 배포 전 필수 확인: Cloudflare 자산 프로젝트가 이번 묶음의 R1308 옮긴 폴더를 실제로 내주는가.

옮긴 폴더(asset-route-r1308.js 의 ROUTED)는 GitHub Pages 배포본에서 빠지므로, CDN 이 이번 커밋의 묶음과
다르면(업로드 실패·지연) 공개 게임에서 그 자산이 사라진다. 그래서 이 확인이 실패하면 job 이 실패하고 Pages 배포를 하지 않는다.
 · 기준 주소의 cdn-health.json: runtimeManifestSHA256 = 지금 r96/runtime-manifest.json, prefixes 가 ROUTED 를 모두 포함
 · 폴더마다 표본 2개(정렬 첫·끝): 바이트 sha256·크기 = manifest, Access-Control-Allow-Origin: *
CDN 전파가 늦을 수 있어 몇 번 다시 묻는다. 네트워크 말고는 아무것도 바꾸지 않는다(표준 라이브러리만).
사용: python3 scripts/cdn-route-gate.py [--base URL] [--tries N] [--wait S]
"""
import argparse, hashlib, json, re, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def routed():
    src = (ROOT / 'r96/client-source/asset-route-r1308.js').read_text(encoding='utf-8')
    m = re.search(r"const ROUTED=(\[[^\]]*\])", src)
    return json.loads(m.group(1).replace("'", '"'))


def get(url, timeout=60):
    req = urllib.request.Request(url, headers={'User-Agent': 'storyworld-cdn-route-gate', 'Origin': 'https://example.invalid',
                                               'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), {k.lower(): v for k, v in r.headers.items()}


def check(base, prefixes, mb, rows):
    errs = []
    body, hd = get(base + 'cdn-health.json')
    h = json.loads(body)
    want = hashlib.sha256(mb).hexdigest()
    if h.get('runtimeManifestSHA256') != want:
        errs.append(f"health runtimeManifestSHA256 {h.get('runtimeManifestSHA256')!r} != {want!r} (CDN 이 이번 묶음이 아님)")
    miss = [p for p in prefixes if p not in (h.get('prefixes') or [])]
    if miss:
        errs.append('health prefixes 에 없음: ' + ', '.join(miss))
    if errs:
        return errs
    for p in prefixes:
        rs = sorted((r for r in rows if r['path'].startswith(p)), key=lambda r: r['path'])
        if not rs:
            errs.append('manifest 에 파일 없음: ' + p)
            continue
        for r in {rs[0]['path']: rs[0], rs[-1]['path']: rs[-1]}.values():
            b, shd = get(base + r['path'])
            if len(b) != r['bytes'] or hashlib.sha256(b).hexdigest() != r['sha256']:
                errs.append('표본 바이트 다름: ' + r['path'])
            if shd.get('access-control-allow-origin') != '*':
                errs.append('CORS 없음: ' + r['path'])
    return errs


def main():
    cfg = json.loads((ROOT / 'r96/asset-cdn.json').read_text())
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default=cfg['base'])
    ap.add_argument('--manifest', default=str(ROOT / 'r96/runtime-manifest.json'))
    ap.add_argument('--tries', type=int, default=6)
    ap.add_argument('--wait', type=float, default=20)
    a = ap.parse_args()
    base = a.base if a.base.endswith('/') else a.base + '/'
    prefixes = routed()
    bad = [p for p in prefixes if p not in cfg['prefixes']]
    if bad:
        sys.exit('ROUTED 가 asset-cdn.json prefixes 에 없음(업로드되지 않음): ' + ', '.join(bad))
    mb = Path(a.manifest).read_bytes()
    rows = json.loads(mb)['files']
    errs = ['not run']
    for i in range(max(1, a.tries)):
        try:
            errs = check(base, prefixes, mb, rows)
        except Exception as e:  # 네트워크 오류도 다시 묻는다
            errs = [f'{type(e).__name__}: {e}']
        if not errs:
            print(json.dumps({'status': 'R1308_CDN_ROUTE_OK', 'base': base, 'prefixes': prefixes}, ensure_ascii=False))
            return
        print(f'try {i + 1}/{a.tries}: ' + '; '.join(errs[:5]), file=sys.stderr, flush=True)
        if i + 1 < a.tries:
            time.sleep(a.wait)
    print('::error::R1308 CDN routed assets not ready; GitHub Pages deploy must not drop them: ' + '; '.join(errs[:5]))
    sys.exit(1)


if __name__ == '__main__':
    main()
