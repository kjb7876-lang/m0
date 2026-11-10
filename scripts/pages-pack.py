#!/usr/bin/env python3
"""R580 — GitHub Pages 배포본 묶기(사이트 1GB 권장 한도 안으로).

모든 CI 검사가 끝난 site 를 그대로 두고, 올릴 사본만 따로 만든다.
 · r96/pages-exclude.json 의 접두어에 든 파일은 빼고(보호 경로를 빼려 하면 거부),
 · PNG 는 pyoxipng 로 무손실 재압축한다 — 디코딩한 RGBA 화소가 원본과 다르거나 더 커지면 원본 바이트를 쓴다.
 · 결과표 pages-deploy.json(원본 manifest 해시·빠진 목록·다시 압축한 파일의 새/원본 해시·총량)을 함께 넣는다.
 · 총량이 budgetBytes 이상이면 실패한다.
사용: python3 scripts/pages-pack.py [--site DIR] [--out DIR] [--exclude JSON] [--no-png] [--jobs N]
"""
import argparse, hashlib, io, json, os, shutil, sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()


def optimize(args):
    src, level = args
    raw = Path(src).read_bytes()
    try:
        import oxipng
        from PIL import Image
        out = oxipng.optimize_from_memory(raw, level=level, strip=oxipng.StripChunks.safe())
        if len(out) >= len(raw):
            return None
        a, b = Image.open(io.BytesIO(raw)), Image.open(io.BytesIO(out))
        if a.size != b.size or a.mode != b.mode or a.info.get('transparency') != b.info.get('transparency') \
                or a.convert('RGBA').tobytes() != b.convert('RGBA').tobytes():
            return None
        return out
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--site', default=str(ROOT / 'r96/hospital-three-pc/site'))
    ap.add_argument('--out', default=str(ROOT / 'r96/hospital-three-pc/pages'))
    ap.add_argument('--exclude', default=str(ROOT / 'r96/pages-exclude.json'))
    ap.add_argument('--no-png', action='store_true')
    ap.add_argument('--jobs', type=int, default=os.cpu_count() or 2)
    a = ap.parse_args()
    site, out = Path(a.site), Path(a.out)
    mb = (ROOT / 'r96/runtime-manifest.json').read_bytes()
    rows = {r['path']: r for r in json.loads(mb)['files']}
    cfg = json.loads(Path(a.exclude).read_text())
    prefixes = [e['prefix'] for e in cfg['exclude']]
    protected = tuple(cfg['protected'])
    for e in cfg['exclude']:
        p = e['prefix']
        if not p or PurePosixPath(p).is_absolute() or '..' in p or not e.get('reason'):
            sys.exit('bad exclude entry: ' + json.dumps(e, ensure_ascii=False))
    hit = [p for p in rows if p.startswith(tuple(prefixes)) and p.startswith(protected)]
    if hit:
        sys.exit('refused: exclude list touches protected paths: ' + ', '.join(hit[:5]))
    if out.exists():
        shutil.rmtree(out)
    excluded, keep = [], []
    for p in sorted(rows):
        (excluded if p.startswith(tuple(prefixes)) else keep).append(p)
    for p in keep:
        s = site / p
        b = s.read_bytes()
        if len(b) != rows[p]['bytes'] or sha(b) != rows[p]['sha256']:
            sys.exit('site file differs from manifest: ' + p)
        d = out / p
        d.parent.mkdir(parents=True, exist_ok=True)
        try:
            os.link(s, d)
        except OSError:
            shutil.copyfile(s, d)
    if (site / 'web-manifest-r62.json').exists():
        shutil.copyfile(site / 'web-manifest-r62.json', out / 'web-manifest-r62.json')
    optimized = {}
    if not a.no_png:
        pngs = [p for p in keep if p.lower().endswith('.png')]
        level = int(cfg.get('losslessPng', {}).get('level', 2))
        with ProcessPoolExecutor(max(1, a.jobs)) as ex:
            for p, res in zip(pngs, ex.map(optimize, [(str(site / p), level) for p in pngs], chunksize=2)):
                if res is None:
                    continue
                d = out / p
                d.unlink()  # 하드링크를 끊고 새로 쓴다(site 원본은 그대로)
                d.write_bytes(res)
                optimized[p] = {'sha256': sha(res), 'bytes': len(res), 'sourceSha256': rows[p]['sha256'], 'sourceBytes': rows[p]['bytes']}
    files = [p for p in out.rglob('*') if p.is_file()]
    report = {'schema': 'storyworld-pages-deploy/v1', 'round': 'R580', 'sourceManifestSHA256': sha(mb),
              'excludePrefixes': prefixes, 'excluded': excluded, 'optimized': optimized, 'files': len(files) + 1}
    body = sum(p.stat().st_size for p in files)
    # 총량에 결과표 자신도 넣는다(자릿수가 바뀌어도 맞도록 두 번 계산)
    for _ in range(3):
        report['totalBytes'] = body + len(json.dumps(report, ensure_ascii=False, separators=(',', ':')).encode())
    data = json.dumps(report, ensure_ascii=False, separators=(',', ':')).encode()
    assert body + len(data) == report['totalBytes']
    (out / 'pages-deploy.json').write_bytes(data)
    budget = int(cfg['budgetBytes'])
    saved_png = sum(v['sourceBytes'] - v['bytes'] for v in optimized.values())
    saved_exc = sum(rows[p]['bytes'] for p in excluded)
    summary = {'totalBytes': report['totalBytes'], 'budgetBytes': budget, 'files': report['files'], 'excludedFiles': len(excluded),
               'excludedBytes': saved_exc, 'optimizedPng': len(optimized), 'optimizedSavedBytes': saved_png}
    print(json.dumps(summary))
    if report['totalBytes'] >= budget:
        sys.exit(f"over budget: {report['totalBytes']} >= {budget}")


if __name__ == '__main__':
    main()
