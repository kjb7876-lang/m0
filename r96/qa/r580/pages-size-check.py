#!/usr/bin/env python3
"""R580 — GitHub Pages 배포본 크기(1GB 권장 한도) 검사.

사용: python3 r96/qa/r580/pages-size-check.py   (먼저 scripts/build-r96.py 로 site 를 만든다)
확인하는 것
 1. 정상 경로: scripts/pages-pack.py 가 site 를 배포본으로 묶으면 1,000,000,000 바이트 아래이고,
    빠진 파일은 pages-exclude.json 의 접두어에 든 것뿐이며, 나머지 파일은 모두 있다.
 2. 화질: 다시 압축한 PNG 는 RGBA 화소가 원본과 완전히 같고, 그 밖의 파일은 바이트가 원본과 같다.
 3. 근거 회귀: 옛 서사 음성 v1 을 뺄 수 있는 이유(내장 서사 목록이 비어 있음, 다른 런타임 js 가 경로를
    안 씀)가 깨지면 실패한다 — 누가 v1 음성을 다시 쓰기 시작하면 이 검사가 먼저 알려 준다.
 4. 경계: 보호 경로(R381 음성·검수 몹 R380·맘몬·칠죄 방·index.html)를 빼려는 목록은 묶기가 거부한다.
    PNG 압축을 끄면 남은 파일이 모두 원본과 바이트가 같다. 한도 바로 위 예산이면 실패를 낸다.
 5. 공개 검증: scripts/verify-r96-public.py 가 이 배포본을 올린 서버에서 통과한다(빠진 파일은 건너뛰고
    다시 압축한 PNG 는 pages-deploy.json 의 해시로 맞춘다).
"""
import hashlib, io, json, os, random, re, shutil, socket, subprocess, sys, tempfile, threading, functools, http.server
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SITE = ROOT / 'r96/hospital-three-pc/site'
PACK = ROOT / 'scripts/pages-pack.py'
EXC = ROOT / 'r96/pages-exclude.json'
sha = lambda b: hashlib.sha256(b).hexdigest()
results = []


def check(name, ok, detail=''):
    results.append({'name': name, 'passed': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ') + name + (('  ' + str(detail)) if detail else ''), flush=True)


def pack(out, *extra, exclude=EXC):
    return subprocess.run([sys.executable, str(PACK), '--site', str(SITE), '--out', str(out), '--exclude', str(exclude), *extra],
                          cwd=ROOT, capture_output=True, text=True)


def main():
    assert SITE.is_dir(), 'site 없음 — 먼저 python3 scripts/build-r96.py'
    manifest = json.loads((ROOT / 'r96/runtime-manifest.json').read_text())
    rows = {r['path']: r for r in manifest['files']}
    exc = json.loads(EXC.read_text())
    prefixes = [e['prefix'] for e in exc['exclude']]
    excluded = lambda p: any(p.startswith(x) for x in prefixes)

    # 3. 근거 회귀
    html = (SITE / 'index.html').read_text(encoding='utf-8')
    m = re.search(r'"assets/story-narration/v1/manifest\.json":"((?:[^"\\]|\\.)*)"', html)
    embedded = json.loads(json.loads('"' + m.group(1) + '"')) if m else None
    check('내장 서사 목록(v1)이 비어 있어 옛 음성을 고를 수 없음', embedded is not None and embedded.get('scenes') == {} and embedded.get('originals') == {},
          embedded and {k: embedded.get(k) for k in ('scenes', 'originals')})
    users = [p for p in rows if p.endswith('.js') and 'story-narration' in (SITE / p).read_text(encoding='utf-8', errors='ignore')]
    check('index.html 밖 런타임 js 가 story-narration 을 쓰지 않음', not users, users)
    hit = [p for p in rows if excluded(p) and p.startswith(tuple(exc['protected']))]
    check('보호 경로는 빼는 목록에 없음', not hit, hit[:5])

    tmp = Path(tempfile.mkdtemp(prefix='r580-'))
    try:
        # 1·2. 정상 경로
        out = tmp / 'pages'
        r = pack(out)
        check('pages-pack.py 성공', r.returncode == 0, (r.stdout + r.stderr)[-600:])
        if r.returncode != 0:
            return finish()
        deploy = json.loads((out / 'pages-deploy.json').read_text())
        files = [p for p in out.rglob('*') if p.is_file()]
        total = sum(p.stat().st_size for p in files)
        check('배포본 1,000,000,000 바이트 미만', total < 1_000_000_000, f'{total:,} bytes ({len(files)} files)')
        check('pages-deploy.json 총량이 실제와 같음', deploy.get('totalBytes') == total, deploy.get('totalBytes'))
        site_total = sum(r['bytes'] for r in rows.values())
        check('원본 사이트보다 90MB 넘게 줄었음', site_total - total > 90_000_000, f'{(site_total - total) / 1e6:.1f} MB')
        rel = {p.relative_to(out).as_posix() for p in files}
        missing = [p for p in rows if not excluded(p) and p not in rel]
        check('빼지 않은 manifest 파일은 모두 배포본에 있음', not missing, missing[:5])
        leaked = [p for p in rel if excluded(p)]
        check('빼는 파일은 배포본에 없음', not leaked, leaked[:5])
        extra = sorted(rel - set(rows) - {'pages-deploy.json', 'web-manifest-r62.json'})
        check('manifest 밖 파일이 새로 생기지 않음(pages-deploy.json 만 추가)', not extra, extra[:5])
        check('pages-deploy.json 의 빠진 목록 = 접두어에 든 manifest 파일', sorted(deploy['excluded']) == sorted(p for p in rows if excluded(p)), len(deploy['excluded']))
        check('원본 manifest 해시 기록', deploy.get('sourceManifestSHA256') == sha((ROOT / 'r96/runtime-manifest.json').read_bytes()))
        opt = deploy['optimized']
        check('PNG 무손실 압축이 실제로 일어남(30MB 이상)', sum(v['sourceBytes'] - v['bytes'] for v in opt.values()) > 30_000_000,
              f"{len(opt)} files, -{sum(v['sourceBytes'] - v['bytes'] for v in opt.values()) / 1e6:.1f} MB")
        bad_bytes = []
        for p in sorted(rel - {'pages-deploy.json'}):
            b = (out / p).read_bytes()
            if p in opt:
                if sha(b) != opt[p]['sha256'] or opt[p]['sourceSha256'] != rows[p]['sha256'] or not p.endswith('.png'):
                    bad_bytes.append(p)
            elif p != 'web-manifest-r62.json' and sha(b) != rows[p]['sha256']:
                bad_bytes.append(p)
        check('압축 안 한 파일은 바이트 동일, 압축한 파일은 기록 해시와 같음', not bad_bytes, bad_bytes[:5])
        from PIL import Image
        rnd = random.Random(580)
        keys = sorted(opt)
        sample = sorted(set(rnd.sample(keys, min(60, len(keys))) + sorted(keys, key=lambda k: -opt[k]['sourceBytes'])[:20]))
        diff = []
        for p in sample:
            a = Image.open(SITE / p); b = Image.open(out / p)
            if a.size != b.size or a.convert('RGBA').tobytes() != b.convert('RGBA').tobytes():
                diff.append(p)
        check(f'다시 압축한 PNG 화소가 원본과 같음(표본 {len(sample)}장, 큰 것 20장 포함)', not diff, diff[:5])

        # 4. 경계
        bad = tmp / 'bad-exclude.json'
        b2 = json.loads(EXC.read_text()); b2['exclude'].append({'prefix': 'assets/r381/voice/', 'reason': 'test', 'evidence': []})
        bad.write_text(json.dumps(b2, ensure_ascii=False))
        r = pack(tmp / 'bad', exclude=bad)
        check('보호 경로(R381 음성)를 빼려 하면 묶기 거부', r.returncode != 0 and 'protected' in (r.stdout + r.stderr), (r.stdout + r.stderr)[-200:])
        b3 = json.loads(EXC.read_text()); b3['exclude'].append({'prefix': 'index.html', 'reason': 'test', 'evidence': []})
        bad.write_text(json.dumps(b3, ensure_ascii=False))
        r = pack(tmp / 'bad2', exclude=bad)
        check('index.html 을 빼려 하면 묶기 거부', r.returncode != 0, (r.stdout + r.stderr)[-200:])
        b4 = json.loads(EXC.read_text()); b4['budgetBytes'] = total - 1
        bad.write_text(json.dumps(b4, ensure_ascii=False))
        r = pack(tmp / 'tight', '--no-png', exclude=bad)
        check('예산을 넘으면 묶기 실패(한도 바로 아래 예산)', r.returncode != 0 and 'budget' in (r.stdout + r.stderr), (r.stdout + r.stderr)[-200:])
        b5 = json.loads(EXC.read_text()); b5['budgetBytes'] = 2_000_000_000
        bad.write_text(json.dumps(b5, ensure_ascii=False))
        plain = tmp / 'plain'
        r = pack(plain, '--no-png', exclude=bad)
        same = r.returncode == 0 and all(sha((plain / p).read_bytes()) == rows[p]['sha256'] for p in rows if not excluded(p) and p != 'web-manifest-r62.json')
        check('PNG 압축을 끄면 남은 파일 바이트가 모두 원본과 같음', same, (r.stdout + r.stderr)[-200:])
        shutil.rmtree(plain, ignore_errors=True)

        # 5. 공개 검증 스크립트가 이 배포본에서 통과
        srv_root = tmp / 'srv'; srv_root.mkdir(); (srv_root / 'm0').symlink_to(out)
        s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        handler = functools.partial(Quiet, directory=str(srv_root))
        httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        env = dict(os.environ, STORYWORLD_URL=f'http://127.0.0.1:{port}/m0/', STORYWORLD_PUBLIC_ATTEMPTS='1')
        public_result = ROOT / 'r96/public-result.json'
        keep = public_result.read_bytes() if public_result.exists() else None
        r = subprocess.run([sys.executable, str(ROOT / 'scripts/verify-r96-public.py')], cwd=ROOT, env=env, capture_output=True, text=True, timeout=1800)
        check('verify-r96-public.py 가 배포본에서 통과', r.returncode == 0, (r.stdout[-200:] + r.stderr[-400:]))
        # 회귀: 빼지 않은 파일이 사라지면 공개 검증이 실패해야 한다
        victim = next(p for p in sorted(rows) if p.startswith('assets/r104/') and not excluded(p))
        moved = (out / victim).read_bytes(); (out / victim).unlink()
        r2 = subprocess.run([sys.executable, str(ROOT / 'scripts/verify-r96-public.py')], cwd=ROOT, env=env, capture_output=True, text=True, timeout=1800)
        (out / victim).write_bytes(moved)
        check('빼지 않은 파일이 없으면 공개 검증이 실패함', r2.returncode != 0, victim)
        httpd.shutdown()
        if keep is None: public_result.unlink(missing_ok=True)
        else: public_result.write_bytes(keep)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return finish()


def finish():
    ok = all(r['passed'] for r in results) and len(results) >= 18
    (Path(__file__).parent / 'pages-size-results.json').write_text(json.dumps({'passed': ok, 'checks': results}, ensure_ascii=False, indent=1))
    print(f"{'PASSED' if ok else 'FAILED'} {sum(r['passed'] for r in results)}/{len(results)}")
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
