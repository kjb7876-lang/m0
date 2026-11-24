#!/usr/bin/env python3
"""R615 — Cloudflare Pages 에셋 프로젝트 공개 확인.

기준 주소의 cdn-health.json 이 지금 묶음(--pack 의 cdn-health.json)과 같은 manifest 해시·파일 수인지,
CORS 머리말(Access-Control-Allow-Origin)이 붙는지, 표본 파일 바이트가 sha256 과 같은지 본다.
CDN 전파가 늦을 수 있어 몇 번 다시 묻는다. 맞지 않으면 실패(게임은 이때 GitHub Pages 로 되돌아간다).
사용: python3 scripts/cdn-verify.py [--base URL] [--pack DIR] [--tries N] [--wait S]
"""
import argparse, hashlib, json, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from cdn_cohort import allowed_base, allowed_mime, contract
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


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        return None

def get_checked(url, status, cap, *, extra=None, timeout=20):
    headers={'User-Agent':'storyworld-cdn-verify','Origin':'https://kjb7876-lang.github.io',
             'Cache-Control':'no-cache','Accept-Encoding':'identity',**(extra or {})}
    req=urllib.request.Request(url,headers=headers)
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=timeout) as r:
        if r.status!=status or r.geturl()!=url:
            raise ValueError(f'wrong HTTP status or redirect: {r.status}')
        hd={k.lower():v for k,v in r.headers.items()}
        if hd.get('access-control-allow-origin') != '*':
            raise ValueError('missing wildcard CORS')
        if hd.get('content-encoding','identity').lower()!='identity':
            raise ValueError('unexpected Content-Encoding')
        body=r.read(cap+1)
        if len(body)>cap:
            raise ValueError('response exceeds cap')
        return body,hd

def check_additive(base,want,cohort):
    if not allowed_base(base):
        raise ValueError('additive verification requires exact existing CDN origin or loopback test')
    rows=cohort['objects']
    if not rows or contract(rows)!=cohort['cohort'] or cohort['cohort']!=want.get('additiveVerification'):
        raise ValueError('local cohort/published-health expectation inconsistency')
    health,hh=get_checked(base+'cdn-health.json',200,1024*1024)
    if hh.get('content-type','').split(';',1)[0].lower().strip()!='application/json':
        raise ValueError('incorrect health MIME')
    if json.loads(health).get('additiveVerification')!=cohort['cohort']:
        raise ValueError('public additive digest/coverage differs')
    def verify_object(obj):
        path,n,sha=(obj[k] for k in ('path','bytes','sha256'))
        try:
            b,head=get_checked(base+path,200,n)
            if not allowed_mime(path,head.get('content-type','')):
                raise ValueError('wrong content type: '+head.get('content-type',''))
            if len(b)!=n or hashlib.sha256(b).hexdigest()!=sha:
                raise ValueError('full body size or SHA mismatch')
            # At least one genuine non-prefix request, where possible. Do not trust Accept-Ranges advertisement.
            start=min(n-1,37); end=min(n-1,start+63)
            part,ph=get_checked(base+path,206,end-start+1,extra={'Range':f'bytes={start}-{end}'})
            if not allowed_mime(path,ph.get('content-type','')):
                raise ValueError('wrong Range response MIME')
            if ph.get('content-range')!=f'bytes {start}-{end}/{n}' or part!=b[start:end+1]:
                raise ValueError('wrong Content-Range or Range payload')
        except Exception as e:
            return f'{path}: {type(e).__name__}: {e}'
        return None
    with ThreadPoolExecutor(max_workers=4) as pool:
        return [e for e in pool.map(verify_object,rows) if e]


def main():
    ap = argparse.ArgumentParser()
    cfg = json.loads((ROOT / 'r96/asset-cdn.json').read_text())
    ap.add_argument('--base', default=cfg['base'])
    ap.add_argument('--cohort-manifest', default=None, help='required exact additive coverage rows')
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
    cohort=json.loads(Path(a.cohort_manifest).read_text()) if a.cohort_manifest else None
    if bool(want.get('additiveVerification'))!=bool(cohort):
        sys.exit('additive verification requires both pack declaration and build-side cohort rows')
    errs = ['not tried']
    for i in range(max(1, a.tries)):
        try:
            errs = check(base, want)
            if not errs and cohort:
                errs = check_additive(base,want,cohort)
        except Exception as e:  # 전파 전 404·일시 연결 오류
            errs = [f'{type(e).__name__}: {e}']
        if not errs:
            print(json.dumps({'status': 'R615_CDN_PUBLIC_OK', 'base': base, 'files': want['files'], 'bytes': want['bytes'], 'samples': len(want['sample']), 'additiveVerified': len(cohort['objects']) if cohort else 0, 'additiveDigest': cohort['cohort']['sha256'] if cohort else None}))
            return
        print(f'try {i + 1}: ' + '; '.join(errs[:4]), file=sys.stderr)
        if i + 1 < a.tries:
            time.sleep(a.wait)
    sys.exit('R615 CDN public check failed: ' + '; '.join(errs[:6]))


if __name__ == '__main__':
    main()
