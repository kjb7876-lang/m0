# R1112 — bake_ego_ink.mjs 가 받은 PNG 48장을 assets/r1112/ego-ink/<동작>-<방향>.webp 로 바꾸고 ego-ink-r1099.js 의 PRE 표를 채운다.
#  실행: python3 r96/tools/r1112/bake_ego_ink.py <png 폴더>
import sys, json, os, re, hashlib
from PIL import Image
SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # r96
OUT = os.path.join(ROOT, 'runtime-text', 'assets', 'r1112', 'ego-ink')
JS = os.path.join(ROOT, 'client-source', 'ego-ink-r1099.js')
meta = json.load(open(os.path.join(SRC, 'meta.json')))
assert len(meta) == 48, len(meta)
os.makedirs(OUT, exist_ok=True)
cells = {m['cell'] for m in meta.values()}; assert len(cells) == 1, cells
sheets = {}; total = 0
for k in sorted(meta):
    m = meta[k]; im = Image.open(os.path.join(SRC, k + '.png')).convert('RGBA')
    assert im.size == (m['ow'] * m['frames'], m['oh']), (k, im.size)
    p = os.path.join(OUT, k + '.webp'); im.save(p, 'WEBP', quality=90, method=6, alpha_quality=100)
    total += os.path.getsize(p)
    sheets[k] = list(m['box']) + [m['ow'], m['oh'], m['frames']]
pre = {'base': 'assets/r1112/ego-ink/', 'cell': cells.pop(), 'sheets': sheets}
s = open(JS, encoding='utf-8').read()
s2 = re.sub(r'/\*R1112-PRE\*/.*?/\*R1112-PRE-END\*/', '/*R1112-PRE*/' + json.dumps(pre, separators=(',', ':')) + '/*R1112-PRE-END*/', s, flags=re.S)
assert s2 != s or json.dumps(pre, separators=(',', ':')) in s
open(JS, 'w', encoding='utf-8').write(s2)
print('webp', len(sheets), 'bytes', total)
