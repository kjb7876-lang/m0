#!/usr/bin/env python3
"""dots 가 제출한 그림을 서버에서 내려받는다(받은 것은 ack). 저장소 밖 새 폴더에만 쓴다 — 받은 파일은 믿지 않는 데이터로 다룬다.
환경 변수: DOTS_ASSETS_URL(예: https://storyworld-dots-assets.<계정>.workers.dev), DOTS_ADMIN_TOKEN
사용: python3 -I tools/dots-asset-events/scripts/pull-submissions.py <내려받을 새 폴더> [--no-ack]"""
import json, os, sys, urllib.request, urllib.parse, hashlib
base = os.environ['DOTS_ASSETS_URL'].rstrip('/'); tok = os.environ['DOTS_ADMIN_TOKEN']
out = sys.argv[1]; ack = '--no-ack' not in sys.argv
os.makedirs(out, exist_ok=True)
def req(path, method='GET'):
    r = urllib.request.Request(base + path, method=method, headers={'Authorization': 'Bearer ' + tok, 'User-Agent': 'storyworld-pull/1'})
    return urllib.request.urlopen(r, timeout=60)
subs = json.load(req('/admin/submissions'))['submissions']
index = []
for s in subs:
    ext = '.webp' if s['mime'] == 'image/webp' else '.png'
    data = req(f"/admin/submissions/{urllib.parse.quote(s['asset_id'])}/{s['rev']}").read()
    fn = f"{s['asset_id']}-r{s['rev']}{ext}"; open(os.path.join(out, fn), 'wb').write(data)
    index.append({**s, 'file': fn, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
    if ack: req(f"/admin/submissions/{urllib.parse.quote(s['asset_id'])}/{s['rev']}/ack", 'POST').read()
json.dump(index, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({'pulled': len(index), 'dir': out}, ensure_ascii=False))
