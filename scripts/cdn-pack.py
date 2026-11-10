#!/usr/bin/env python3
"""R615 — 무거운 에셋을 Cloudflare Pages 별도 프로젝트(무료, 결제수단 없음)에 올릴 묶음 만들기.

검사가 끝난 site 에서 r96/asset-cdn.json 의 접두어에 든 파일만 runtime-manifest 해시로 검증해 옮기고,
 · _headers : 모든 파일 CORS 허용(Access-Control-Allow-Origin: *)·하루 캐시, cdn-health.json 은 no-cache
 · cdn-health.json : 게임(asset-cdn-r615.js)이 외부 주소를 켜기 전에 확인하는 표(스키마·접두어·파일 수·총량·표본 해시)
를 만든다. Cloudflare Pages 무료 한도(사이트당 파일 20,000개·한 파일 25MiB)를 넘으면 실패한다.
올리기는 wrangler pages deploy(.github/workflows/pages.yml R615 단계)가 한다. 이 스크립트는 네트워크를 쓰지 않는다.
사용: python3 scripts/cdn-pack.py [--site DIR] [--manifest JSON] [--config JSON] [--out DIR] [--max-files N] [--max-file-bytes N]
"""
import argparse, hashlib, json, os, shutil, sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = 'storyworld-asset-cdn/v1'
HEADERS = """/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=86400
/cdn-health.json
  ! Cache-Control
  Cache-Control: no-cache
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--site', default=str(ROOT / 'r96/hospital-three-pc/site'))
    ap.add_argument('--manifest', default=str(ROOT / 'r96/runtime-manifest.json'))
    ap.add_argument('--config', default=str(ROOT / 'r96/asset-cdn.json'))
    ap.add_argument('--out', default=str(ROOT / 'r96/hospital-three-pc/cdn'))
    ap.add_argument('--max-files', type=int, default=None)
    ap.add_argument('--max-file-bytes', type=int, default=None)
    a = ap.parse_args()
    cfg = json.loads(Path(a.config).read_text())
    lim = cfg.get('limits', {})
    max_files = a.max_files or int(lim.get('maxFiles', 20000))
    max_bytes = a.max_file_bytes or int(lim.get('maxFileBytes', 25 * 1024 * 1024))
    prefixes = cfg.get('prefixes') or []
    if cfg.get('schema') != SCHEMA or not prefixes:
        sys.exit('bad config: schema/prefixes')
    for p in prefixes:
        if not isinstance(p, str) or not p or not p.endswith('/') or PurePosixPath(p).is_absolute() \
                or '..' in PurePosixPath(p).parts or 'mammon' in p.lower():
            sys.exit('bad prefix: ' + json.dumps(p))
    mb = Path(a.manifest).read_bytes()
    rows = [r for r in json.loads(mb)['files'] if r['path'].startswith(tuple(prefixes))]
    site, out = Path(a.site), Path(a.out)
    big = [r['path'] for r in rows if r['bytes'] > max_bytes]
    if big:
        sys.exit(f'file over the Cloudflare Pages 25MiB per-file limit (max-file-bytes {max_bytes}): ' + ', '.join(big[:5]))
    if len(rows) + 2 > max_files:
        sys.exit(f'{len(rows)} files + _headers + cdn-health.json over the Cloudflare Pages 20,000-file limit (max-files {max_files})')
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    total = 0
    for r in sorted(rows, key=lambda r: r['path']):
        s = site / r['path']
        b = s.read_bytes()
        if len(b) != r['bytes'] or hashlib.sha256(b).hexdigest() != r['sha256']:
            sys.exit('site file differs from manifest: ' + r['path'])
        d = out / r['path']
        d.parent.mkdir(parents=True, exist_ok=True)
        try:
            os.link(s, d)
        except OSError:
            shutil.copyfile(s, d)
        total += len(b)
    srt = sorted(rows, key=lambda r: r['path'])
    sample = [{'path': r['path'], 'bytes': r['bytes'], 'sha256': r['sha256']}
              for r in (srt[i * len(srt) // 8] for i in range(min(8, len(srt))))]
    health = {'schema': SCHEMA, 'round': 'R615', 'prefixes': prefixes, 'files': len(rows), 'bytes': total,
              'runtimeManifestSHA256': hashlib.sha256(mb).hexdigest(), 'sourceCommit': os.environ.get('GITHUB_SHA', ''),
              'sample': sample}
    (out / 'cdn-health.json').write_text(json.dumps(health, ensure_ascii=False, indent=1) + '\n')
    (out / '_headers').write_text(HEADERS)
    print(json.dumps({k: health[k] for k in ('prefixes', 'files', 'bytes', 'runtimeManifestSHA256')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
