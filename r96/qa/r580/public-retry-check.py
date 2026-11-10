#!/usr/bin/env python3
"""R580b — 공개 검증(scripts/verify-r96-public.py)이 일시적 네트워크 오류는 다시 시도하되 판정은 약해지지 않는지.

사용: python3 r96/qa/r580/public-retry-check.py <묶은 배포본 폴더>   (scripts/pages-pack.py --out 결과)
 1. 정상: 그대로 올리면 통과.
 2. 일시 오류: 파일 하나는 첫 요청에 응답을 늦춰 읽기 시간 초과, 하나는 첫 요청에 연결을 끊고,
    pages-deploy.json 은 첫 요청에 시간 초과 → 다시 시도해 통과해야 한다(2026-11-10 main 1288번 실행 실패 재현).
 3. 회귀: 바이트가 다른 파일은 시도를 다 써도 실패, 사라진 파일(404)도 실패, 끝까지 시간 초과인 파일도 실패.
"""
import functools, http.server, json, os, shutil, socket, subprocess, sys, tempfile, threading, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
results = []


def check(name, ok, detail=''):
    results.append({'name': name, 'passed': bool(ok), 'detail': str(detail)[-300:]})
    print(('PASS ' if ok else 'FAIL ') + name + ('  ' + str(detail)[-300:] if detail and not ok else ''), flush=True)


def serve(root, faults):
    seen = {}

    class H(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass

        def do_GET(self):
            path = self.path.split('?')[0].removeprefix('/m0/')
            n = seen[path] = seen.get(path, 0) + 1
            kind = faults.get(path)
            if kind == 'slow-once' and n == 1 or kind == 'slow-always':
                time.sleep(2.5)
            if kind == 'drop-once' and n == 1:
                self.connection.shutdown(socket.SHUT_RDWR); self.connection.close(); return
            return super().do_GET()

    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(H, directory=str(root)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def run(port, attempts='3'):
    env = dict(os.environ, STORYWORLD_URL=f'http://127.0.0.1:{port}/m0/', STORYWORLD_PUBLIC_ATTEMPTS=attempts,
               STORYWORLD_PUBLIC_TIMEOUT='1', STORYWORLD_PUBLIC_SLEEP='0.2')
    keep = (ROOT / 'r96/public-result.json').read_bytes() if (ROOT / 'r96/public-result.json').exists() else None
    r = subprocess.run([sys.executable, str(ROOT / 'scripts/verify-r96-public.py')], cwd=ROOT, env=env, capture_output=True, text=True, timeout=1800)
    if keep is None: (ROOT / 'r96/public-result.json').unlink(missing_ok=True)
    else: (ROOT / 'r96/public-result.json').write_bytes(keep)
    return r


def main():
    pages = Path(sys.argv[1]).resolve()
    tmp = Path(tempfile.mkdtemp(prefix='r580b-'))
    try:
        (tmp / 'm0').symlink_to(pages)
        a, b, c = 'assets/r104/bosses/a11-boss-p1.webp', 'index.html', 'assets/r104/bosses/' + sorted(p.name for p in (pages / 'assets/r104/bosses').iterdir() if p.is_file())[-1]
        srv = serve(tmp, {}); r = run(srv.server_address[1]); srv.shutdown()
        check('정상 배포본은 통과', r.returncode == 0, r.stderr)
        srv = serve(tmp, {a: 'slow-once', b: 'drop-once', 'pages-deploy.json': 'slow-once'}); r = run(srv.server_address[1]); srv.shutdown()
        check('첫 요청 읽기 시간 초과·연결 끊김은 다시 시도해 통과', r.returncode == 0, r.stderr)
        srv = serve(tmp, {c: 'slow-always'}); r = run(srv.server_address[1]); srv.shutdown()
        check('끝까지 시간 초과면 실패', r.returncode != 0 and 'Public hash verification failed' in r.stderr, r.stderr)
        # 바이트가 다른 파일 / 사라진 파일: 사본 폴더에서
        copy = tmp / 'copy'; shutil.copytree(pages, copy, copy_function=os.link)
        (tmp / 'm0').unlink(); (tmp / 'm0').symlink_to(copy)
        (copy / a).unlink(); (copy / a).write_bytes(b'not the asset')
        srv = serve(tmp, {}); r = run(srv.server_address[1]); srv.shutdown()
        check('바이트가 다르면 시도를 다 써도 실패', r.returncode != 0 and a in r.stderr, r.stderr)
        (copy / a).unlink()
        srv = serve(tmp, {}); r = run(srv.server_address[1]); srv.shutdown()
        check('사라진 파일(404)은 실패', r.returncode != 0 and a in r.stderr, r.stderr)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    ok = all(x['passed'] for x in results) and len(results) == 5
    (Path(__file__).parent / 'public-retry-results.json').write_text(json.dumps({'passed': ok, 'checks': results}, ensure_ascii=False, indent=1))
    print(('PASSED' if ok else 'FAILED') + f" {sum(x['passed'] for x in results)}/{len(results)}")
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
