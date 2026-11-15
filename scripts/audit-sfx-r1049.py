#!/usr/bin/env python3
"""R1049 — 효과음 대규칙(docs/sound-rules.md, r96/qa/r1049/sound-rules.json) 전수 대조.

사용자 2026-11-15 09:01Z: "대규칙 너가 게임에 맞게 세우고 효과음 조사해서 크게 엇나가는것들은 재생성하던가 무료효과음개선적용해줘".
파일을 그대로 재지 않고 '플레이어가 듣는 소리'를 잰다: 게임 재생 사슬(R545 150Hz 고역통과 2단 → 쾌적 계층 45Hz 고역통과·역할 저역통과 2단·
역할 길이 상한, attack·enemyHit 는 늦은 본체 시작점 건너뜀)을 ffmpeg 필터로 흉내 낸 뒤 잰다.
종류·경로 목록은 R993 전수표(r96/qa/r993/inventory.csv, 브라우저에서 soundProfiles 를 모은 1,232줄)를 쓰고,
R993·R1026·R1049 파생본으로 바뀐 경로는 바뀐 파일을 잰다. 저장소에 없는 엔진 원본(audio/·delivery/)은 공개 Pages 에서 받는다.
결과: r96/qa/r1049/sfx-audit.json(줄마다 측정값·위반), sfx-audit-summary.md.
사용: python3 scripts/audit-sfx-r1049.py [--before]   (--before: R1049 파생본 없이 잰다)
필요: ffmpeg, numpy."""
import csv, json, os, re, sys, subprocess, pathlib, hashlib, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np

SR = 44100
ROOT = pathlib.Path(__file__).resolve().parents[1]
RT = ROOT / 'r96/runtime-text'
QA = ROOT / 'r96/qa/r1049'
RULES = json.loads((QA / 'sound-rules.json').read_text(encoding='utf-8'))
PUBLIC = 'https://kjb7876-lang.github.io/m0/'
CACHE = pathlib.Path(os.environ.get('SFX_CACHE', '/tmp/claude-0/sfx-cache'))
BEFORE = '--before' in sys.argv
# 쾌적 계층 역할(index.html __STORYWORLD_SFX_COMFORT__ roles): 저역통과 Hz, 길이 상한 초
ROLES = {'attack': (3400, .65), 'enemyHit': (3000, .45), 'hurt': (2600, .7), 'special': (3800, 1.2), 'blink': (3300, .5), 'dodge': (3300, .5),
         'parry': (4400, .65), 'ego': (3600, 1.1), 'awake': (4000, 1.5), 'clear': (3600, 1.1), 'upgrade': (3600, 1.0), 'boss': (2500, 1.7)}
M = RULES['major']


def remaps():
    m = {}
    f = RT / 'assets/r1026/sfx/index.json'
    if f.exists():
        d = json.loads(f.read_text(encoding='utf-8'))
        for k in ('trimmed', 'replaced'):
            for src, v in (d.get(k) or {}).items():
                if isinstance(v, dict) and v.get('path'): m[src] = v['path']
    f = RT / 'assets/r1049/sfx/index.json'
    if not BEFORE and f.exists():
        d = json.loads(f.read_text(encoding='utf-8'))
        for src, v in (d.get('remap') or {}).items(): m[src] = v['path']
    return m


def prompts():
    out = {}
    for f in RT.glob('assets/r*/sfx/index.json'):
        try: d = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        def walk(o):
            if isinstance(o, dict):
                if isinstance(o.get('path'), str) and isinstance(o.get('prompt'), str): out[o['path']] = o['prompt']
                for v in o.values(): walk(v)
            elif isinstance(o, list):
                for v in o: walk(v)
        walk(d)
    f = RT / 'assets/r1049/sfx/index.json'
    if not BEFORE and f.exists():  # R1049 파생본은 생성 문구 대신 가공 내용으로 톤을 판단한다(귀 미검증)
        for v in (json.loads(f.read_text(encoding='utf-8')).get('remap') or {}).values(): out[v['path']] = 'R1049 가공: ' + ' / '.join(v.get('how') or [])
    return out


def local(rel):
    p = RT / rel
    if p.exists(): return p
    c = CACHE / rel
    if not c.exists():
        c.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(PUBLIC + rel, timeout=60) as r: c.write_bytes(r.read())
    return c


def dec(p, af=None):
    cmd = ['ffmpeg', '-loglevel', 'error', '-i', str(p)] + (['-af', af] if af else []) + ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype='<f4').astype(np.float64)


W = int(.02 * SR)


def late_ping(x):
    """R1026 scripts/build-sfx-r1026.py late_ping 과 같은 검출기."""
    fr = np.fft.rfftfreq(W, 1 / SR); E = []; C = []
    for i in range(0, len(x) - W, W):
        s = x[i:i + W]; E.append(10 * np.log10((s * s).mean() + 1e-12)); sp = np.abs(np.fft.rfft(s * np.hanning(W))) ** 2
        C.append(float((fr * sp).sum() / max(sp.sum(), 1e-20)))
    E = np.array(E)
    if not len(E): return None
    mx = E.max(); first = int(np.argmax(E > mx - 20))
    for k in range(first + 6, len(E)):
        a = max(first, k - 4); lo = E[a:k].min()
        if E[k] - lo >= 9 and mx - 26 < E[k] <= mx - 8 and C[k] >= 1400 and k * W / SR >= .15:
            return {'pingAt': round(k * W / SR, 3), 'cut': round((a + int(np.argmin(E[a:k]))) * W / SR, 3)}
    return None


def share(y, lo, hi):
    if len(y) < 64: return 0.0
    sp = np.abs(np.fft.rfft(y)) ** 2; fr = np.fft.rfftfreq(len(y), 1 / SR); tot = sp[fr >= 20].sum()
    return float(sp[(fr >= lo) & (fr < hi)].sum() / tot) if tot > 0 else 0.0


def measure(row, rm, pr):
    kind, cat, role = row['kind'], row['cat'], row['role'].split('(')[0]
    cut, cap = ROLES.get(role, ROLES['special'])
    src = row['remapTo'] or row['path']
    path = rm.get(src) or rm.get(row['path']) or src
    r = {'kind': kind, 'cat': cat, 'sub': row['sub'], 'role': role, 'reach': row['reach'], 'path': row['path'], 'played': path, 'violations': []}
    try:
        p = local(path); x = dec(p)
    except Exception as e:
        r['error'] = str(e)[:120]; return r
    n = len(x); fs = SR
    r['dur'] = round(n / fs, 3); r['clip'] = int((np.abs(x) >= .999).sum())
    off = 0
    if role in ('attack', 'enemyHit') and n > cap * fs:
        full = np.abs(x).max(); early = np.abs(x[:int(cap * fs)]).max()
        if full > .02 and early < full * .1:
            on = int(np.argmax(np.abs(x) >= full * .05)); off = max(0, on - int(.012 * fs))
    tot = float((x[off:] ** 2).sum()) or 1e-20
    r['afterCap'] = round(float((x[off + int(cap * fs):] ** 2).sum()) / tot, 3)
    af = (f'atrim=start={off / fs:.4f}:duration={cap},highpass=f=150:p=1,highpass=f=150:p=1,highpass=f=45:p=1,'
          f'lowpass=f={cut}:p=1,lowpass=f={cut}:p=1')
    y = dec(p, af)
    pk = float(np.abs(y).max()) if len(y) else 0.0
    r['peakDb'] = round(20 * np.log10(pk), 1) if pk > 0 else -120.0
    r['leadMs'] = int(np.argmax(np.abs(y) >= pk * .1) / fs * 1000) if pk > 0 else 0
    i90 = int(np.argmax(np.abs(y) >= pk * .9)) if pk > 0 else 0; i10 = int(np.argmax(np.abs(y) >= pk * .1)) if pk > 0 else 0
    r['riseMs'] = round((i90 - i10) / fs * 1000, 1)
    r['low150'] = round(share(y, 20, 150), 3); r['harsh'] = round(share(y, 2000, 5000), 3)
    r['ping'] = late_ping(y)
    pt = pr.get(path) or pr.get(row['path']) or ''
    r['prompt'] = pt[:120]
    v = r['violations']
    if r['clip'] >= M['M1_clip']['clipSamplesMin']: v.append('M1_clip')
    if r['afterCap'] >= M['M2_bodyCut']['energyAfterCapMin']: v.append('M2_bodyCut')
    if r['leadMs'] >= M['M3_lateStart']['leadMsMin']: v.append('M3_lateStart')
    if r['ping'] and cat in M['M4_latePing']['categories']: v.append('M4_latePing')
    if cat in M['M5_harsh']['frequent'] and r['harsh'] > M['M5_harsh']['shareMax']: v.append('M5_harsh')
    if r['low150'] > M['M6_boom']['shareMax']: v.append('M6_boom')
    if r['peakDb'] < M['M7_silent']['peakDbMin']: v.append('M7_silent')
    if pt and re.search(M['M8_tone']['promptRe'].replace('(?i)', ''), pt, re.I): v.append('M8_tone')
    return r


def main():
    rows = list(csv.DictReader(open(ROOT / 'r96/qa/r993/inventory.csv', encoding='utf-8-sig')))
    rm, pr = remaps(), prompts()
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as ex:
        out = list(ex.map(lambda r: measure(r, rm, pr), rows))
    used = [r for r in out if r['reach'] == '쓰임']
    cnt = {}
    for r in used:
        for k in r['violations']: cnt[k] = cnt.get(k, 0) + 1
    major_files = sorted({r['played'] for r in used if r['violations']})
    res = {'revision': 'R1049', 'mode': 'before' if BEFORE else 'after', 'rows': len(out), 'used': len(used), 'errors': sum(1 for r in out if 'error' in r),
           'violationsByRule': cnt, 'majorRows': sum(1 for r in used if r['violations']), 'majorFiles': len(major_files), 'table': out}
    name = 'sfx-audit-before.json' if BEFORE else 'sfx-audit.json'
    (QA / name).write_text(json.dumps(res, ensure_ascii=False, indent=0), encoding='utf-8')
    print(json.dumps({k: v for k, v in res.items() if k != 'table'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
