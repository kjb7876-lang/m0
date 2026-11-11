#!/usr/bin/env python3
"""R615 — Cloudflare Pages 에셋 프로젝트 공개 확인.

기준 주소의 cdn-health.json 이 지금 묶음(--pack 의 cdn-health.json)과 같은 manifest 해시·파일 수인지,
CORS 머리말(Access-Control-Allow-Origin)이 붙는지, 표본 파일 바이트가 sha256 과 같은지 본다.
CDN 전파가 늦을 수 있어 몇 번 다시 묻는다. 맞지 않으면 실패(게임은 이때 GitHub Pages 로 되돌아간다).
사용: python3 scripts/cdn-verify.py [--base URL] [--pack DIR] [--tries N] [--wait S]
"""
import argparse, hashlib, json, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def get(url, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': 'storyworld-cdn-verify', 'Origin': 'https://example.invalid', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), {k.lower(): v for k, v in r.headers.items()}


def check(base, want):
    body, hd = get(base + 'cdn-health.json')
    h = json.loads(body)
    errs = []
    if hd.get('access-control-allow-origin') != '*':
        errs.append('CORS header missing on cdn-health.json')
    for k in ('schema', 'runtimeManifestSHA256', 'files', 'bytes', 'prefixes'):
        if h.get(k) != want.get(k):
            errs.append(f'health {k}: public {h.get(k)!r} != pack {want.get(k)!r}')
    for s in want.get('sample', []):
        b, shd = get(base + s['path'])
        if hashlib.sha256(b).hexdigest() != s['sha256'] or len(b) != s['bytes']:
            errs.append('sample differs: ' + s['path'])
        if shd.get('access-control-allow-origin') != '*':
            errs.append('CORS header missing: ' + s['path'])
    return errs


def main():
    ap = argparse.ArgumentParser()
    cfg = json.loads((ROOT / 'r96/asset-cdn.json').read_text())
    ap.add_argument('--base', default=cfg['base'])
    ap.add_argument('--pack', default=None)
    ap.add_argument('--tries', type=int, default=6)
    ap.add_argument('--wait', type=float, default=20)
    a = ap.parse_args()
    base = a.base if a.base.endswith('/') else a.base + '/'
    if not (base.startswith('https://') or base.startswith('http://127.0.0.1:')):
        sys.exit('base must be https')
    pack = Path(a.pack) if a.pack else None
    want = json.loads((pack / 'cdn-health.json').read_text()) if pack else None
    if want is None:
        sys.exit('--pack DIR (cdn-pack.py output) required')
    errs = ['not tried']
    for i in range(max(1, a.tries)):
        try:
            errs = check(base, want)
        except Exception as e:  # 전파 전 404·일시 연결 오류
            errs = [f'{type(e).__name__}: {e}']
        if not errs:
            print(json.dumps({'status': 'R615_CDN_PUBLIC_OK', 'base': base, 'files': want['files'], 'bytes': want['bytes'], 'samples': len(want['sample'])}))
            return
        print(f'try {i + 1}: ' + '; '.join(errs[:4]), file=sys.stderr)
        if i + 1 < a.tries:
            time.sleep(a.wait)
    sys.exit('R615 CDN public check failed: ' + '; '.join(errs[:6]))


if __name__ == '__main__':
    main()
