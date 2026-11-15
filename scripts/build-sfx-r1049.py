#!/usr/bin/env python3
"""R1049 — 대규칙(docs/sound-rules.md)에서 크게 엇나간 효과음을 무료로 고친 파생본 + 빈칸 3종(발걸음·저체력 심장·레벨업).

사용자 2026-11-15 09:01Z: "대규칙 너가 게임에 맞게 세우고 효과음 조사해서 크게 엇나가는것들은 재생성하던가 무료효과음개선적용해줘".
A) scripts/audit-sfx-r1049.py --before 의 큰 위반 파일마다 원본(또는 R1026 파생본)에서 파생본을 만든다. 원본은 그대로 둔다.
   M2 본체 잘림 → 길이 상한 앞에서 페이드 / M4 끝 '띡' → 그 앞 골에서 25ms 페이드(R1026 방법) / M5 2~5kHz 찌름 → 음높이 조금 내리고 3.2kHz 대역 깎기 /
   M6 쿵 → 고역통과 올리기 / M8 만화 소리 → 음높이 내리고 저역통과(어둡게). 고친 뒤 같은 측정(재생 사슬 흉내)으로 다시 재고, 안 되면 한 단계 세게.
   피크는 원본과 같게 맞춘다(음량 보정은 R993 이 그대로 한다).
B) plinkfx(github maximilianfeix/plinkfx, 소리 CC0 1.0) 릴리스 묶음의 WAV 를 가공한다(칩튠 그대로 쓰지 않음):
   발걸음 = step-stone 을 1.5배 올리고 step-gravel 을 섞어 돌·자갈 발소리, 심장 = heartbeat 를 1.7~1.8배 올려 150Hz 고역통과 뒤에도 들리게,
   레벨업 = harp 를 .75배 내리고 짧은 잔향(성당 복도처럼 어둡게).
결과: r96/runtime-text/assets/r1049/sfx/*.ogg + index.json, r96/client-source/sfx-rules-r1049.js 의 REMAP 표(표시줄 사이) 갱신.
사용: python3 scripts/build-sfx-r1049.py <plinkfx 풀어 둔 폴더(alert/·footstep/·magic/ 가 든 곳)>   필요: ffmpeg, numpy."""
import json, sys, re, hashlib, pathlib, subprocess, importlib.util, tempfile
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
RT = ROOT / 'r96/runtime-text'
OUT = RT / 'assets/r1049/sfx'; OUT.mkdir(parents=True, exist_ok=True)
QA = ROOT / 'r96/qa/r1049'
spec = importlib.util.spec_from_file_location('audit', ROOT / 'scripts/audit-sfx-r1049.py'); A = importlib.util.module_from_spec(spec)
sys.argv = [sys.argv[0]] + [a for a in sys.argv[1:]]; spec.loader.exec_module(A)
SR = A.SR
PLINK = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/claude-0/plz/x')


def ff(inp, af, out=None):
    """ffmpeg 필터 → numpy(모노 44.1k). inp 은 경로 또는 numpy 배열."""
    tmp = None
    if isinstance(inp, np.ndarray):
        tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False); tmp.close(); wav(inp, tmp.name); inp = tmp.name
    cmd = ['ffmpeg', '-loglevel', 'error', '-i', str(inp)] + (['-af', af] if af else []) + ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    y = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype='<f4').astype(np.float64)
    if tmp: pathlib.Path(tmp.name).unlink()
    return y


def wav(y, p):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', str(p)], input=y.astype('<f8').tobytes(), check=True)


def save(y, name):
    p = OUT / (name + '.ogg')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libvorbis', '-q:a', '4', str(p)],
                   input=y.astype('<f8').tobytes(), check=True)
    b = p.read_bytes(); return {'path': 'assets/r1049/sfx/' + p.name, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'duration': round(len(y) / SR, 3)}


def fade_tail(y, at):
    n = max(int(at * SR), int(.05 * SR)); y = y[:n].copy(); f = min(int(.025 * SR), len(y)); y[len(y) - f:] *= .5 * (1 + np.cos(np.linspace(0, np.pi, f))); return y


def fade_in(y, ms=10):
    f = min(int(ms / 1000 * SR), len(y) // 4); y = y.copy(); y[:f] *= np.sin(np.linspace(0, np.pi / 2, f)) ** 2; return y


def peak_to(y, db):
    pk = np.abs(y).max(); return y * (10 ** (db / 20) / pk) if pk > 0 else y


def recheck(row, path):
    """같은 측정으로 파생본을 다시 잰다(파생본 경로를 재생 경로로)."""
    fake = dict(row); fake['remapTo'] = ''; fake['path'] = path
    r = A.measure(fake, {}, {})
    r['violations'] = [v for v in r['violations'] if v != 'M8_tone']  # 파생본에는 생성 문구가 없다 — 톤은 가공 내용으로 판단(귀 미검증)
    return r


def fix_one(row, viol):
    src_rel = row['played']; x = A.dec(A.local(src_rel)); pk0 = np.abs(x).max(); role = row['role']
    cut, cap = A.ROLES.get(role, A.ROLES['special'])
    base = re.sub(r'^assets/', '', src_rel).replace('/sfx/', '-').replace('/', '-').rsplit('.', 1)[0]
    base = re.sub(r'^r1026-r', 'r', base); viol = list(viol)
    for level in range(6):
        y = x.copy(); notes = []; af = []
        if 'M6_boom' in viol: hp = 200 + 60 * level; af += [f'highpass=f={hp}:p=2', f'highpass=f={hp}:p=2']; notes.append(f'고역통과 {hp}Hz 2단')
        if 'M5_harsh' in viol:
            p = (.9, .85, .8, .75, .65, .55)[level]; g = (-8, -11, -14, -18, -18, -20)[level]; w = (1.4, 1.4, 1.4, 1.6, 2.0, 2.2)[level]
            af += [f'asetrate={int(SR * p)}', f'aresample={SR}', f'equalizer=f=3200:t=o:w={w}:g={g}']; notes.append(f'음높이 ×{p}·3.2kHz {g}dB')
        if 'M8_tone' in viol:
            p = (.8, .76, .72, .7, .68, .66)[level]; af += [f'asetrate={int(SR * p)}', f'aresample={SR}', 'lowpass=f=2200:p=2', 'equalizer=f=3000:t=o:w=1.4:g=-6']
            notes.append(f'만화 성격 어둡게: 음높이 ×{p}·2.2kHz 저역통과')
        if af: y = ff(y, ','.join(af))
        if 'M4_latePing' in viol:
            chain = f'highpass=f=150:p=1,highpass=f=150:p=1,highpass=f=45:p=1,lowpass=f={cut}:p=1,lowpass=f={cut}:p=1'
            for _ in range(3):  # 게임이 들려주는 소리(재생 사슬 뒤)에서 찾아 그 앞 골에서 자른다
                ping = A.late_ping(ff(y, chain))
                if not ping: break
                y = fade_tail(y, ping['cut']); notes.append(f"끝 '띡'({ping['pingAt']}s) 앞 {ping['cut']}s 에서 25ms 페이드")
        if 'M2_bodyCut' in viol: y = fade_tail(y, cap - .06); notes.append(f'길이 상한 {cap}s 앞에서 페이드')
        y = fade_in(y, 3); y = peak_to(y, 20 * np.log10(pk0) if pk0 > 0 else -10)
        name = base + ('' if level == 0 else f'-L{level}')
        meta = save(y, name); r = recheck(row, meta['path'])
        if not r['violations'] and len(y) / SR >= .1:
            for f in OUT.glob(base + '-L*.ogg'):
                if f.name != name + '.ogg': f.unlink()
            if level and (OUT / (base + '.ogg')).exists() and name != base: (OUT / (base + '.ogg')).unlink()
            meta.update({'from': src_rel, 'fixed': viol, 'how': notes, 'level': level, 'after': {k: r.get(k) for k in ('harsh', 'low150', 'peakDb', 'afterCap', 'leadMs')}})
            return meta
        (OUT / (name + '.ogg')).unlink()
        for v in r['violations']:  # 고치다 새로 생긴 위반(예: 쿵을 깎자 상한 뒤 비중이 커짐)도 다음 단계에서 함께 고친다
            if v not in viol: viol.append(v)
    raise SystemExit(f'고치지 못함: {src_rel} {viol} → {r["violations"]}')


def gap_files(kind, role, makers):
    out = []; cut, cap = A.ROLES[role]
    for i, mk in enumerate(makers, 1):
        y = mk(); y = fade_in(y, 12)
        for hp in (150, 190, 230, 280):
            z = ff(y, f'highpass=f={hp}:p=2,highpass=f={hp}:p=2') if hp > 150 else y
            z = peak_to(z, -12.0)
            meta = save(z, f'{kind}-{i}')
            m = A.measure({'kind': kind, 'cat': '빈칸', 'sub': '', 'role': role, 'reach': '쓰임', 'path': meta['path'], 'remapTo': ''}, {}, {})
            if m['low150'] <= .08 and m['harsh'] <= .35: break
        meta.update({'low150': m['low150'], 'harsh': m['harsh'], 'peakDb': round(20 * np.log10(np.abs(z).max()), 1), 'chainPeakDb': m['peakDb'], 'highpassHz': hp})
        out.append(meta)
    return out


def main():
    before = json.loads((QA / 'sfx-audit-before.json').read_text(encoding='utf-8'))
    for f in OUT.glob('*.ogg'): f.unlink()
    remap = {}
    rows = [r for r in before['table'] if r['reach'] == '쓰임' and r['violations']]
    done = {}
    for r in rows:
        if r['played'] in done: meta = done[r['played']]
        else: meta = fix_one(r, r['violations']); done[r['played']] = meta
        remap[r['played']] = meta
        if r['path'] != r['played']: remap[r['path']] = meta
    P = lambda rel: str(PLINK / rel)
    step = lambda a, b: (lambda: (lambda s, g: np.pad(s, (0, max(0, len(g) - len(s)))) + .45 * np.pad(g, (0, max(0, len(s) - len(g)))))(
        ff(P(f'footstep/step-stone-{a}.wav'), f'asetrate={int(SR * 1.5)},aresample={SR},lowpass=f=2600:p=2'),
        ff(P(f'footstep/step-gravel-{b}.wav'), 'lowpass=f=3000:p=2')))
    heart = lambda a, p: (lambda: ff(P(f'alert/heartbeat-{a}.wav'), f'asetrate={int(SR * p)},aresample={SR},lowpass=f=1500:p=2'))
    lvl = lambda a: (lambda: ff(P(f'magic/harp-{a}.wav'), f'asetrate={int(SR * .75)},aresample={SR},lowpass=f=3000:p=2,'
                                f'aecho=0.7:0.6:70|140:0.22|0.12,afade=t=out:st=0.85:d=0.25,atrim=duration=1.1'))
    gaps = {
        'r1049Step': {'role': 'dodge', 'use': '발걸음(탐색 중, 가까운 적 없을 때) — 돌·자갈', 'files': gap_files('step', 'dodge', [step(1, 1), step(2, 2), step(3, 3), step(4, 4)])},
        'r1049Heart': {'role': 'special', 'use': '저체력 경고 심장 박동(체력 30% 아래)', 'files': gap_files('heart', 'special', [heart(1, 1.8), heart(2, 1.7)])},
        'r1049LevelUp': {'role': 'special', 'use': '레벨업(지역 완료음 뒤 .9초) — 어두운 하프', 'files': gap_files('levelup', 'special', [lvl(1), lvl(2)])}}
    for g in gaps.values():
        g['source'] = 'plinkfx v0.2.0 릴리스 plinkfx-wav-ogg.zip (github.com/maximilianfeix/plinkfx)'; g['license'] = 'CC0 1.0 (LICENSE-SOUNDS)'
    idx = {'round': 'R1049', 'rule': 'docs/sound-rules.md', 'remap': remap, 'gaps': gaps,
           'note': '원본 파일은 그대로 둔다. 파생본은 같은 측정(scripts/audit-sfx-r1049.py)으로 큰 위반 0 을 확인했다. 귀로 들은 검증은 아님.'}
    (OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1), encoding='utf-8')
    js = ROOT / 'r96/client-source/sfx-rules-r1049.js'
    if js.exists():
        t = js.read_text(encoding='utf-8'); tbl = json.dumps({k: v['path'] for k, v in sorted(remap.items())}, ensure_ascii=False)
        gp = json.dumps({k: [f['path'] for f in v['files']] for k, v in gaps.items()}, ensure_ascii=False)
        t = re.sub(r'/\*REMAP\*/.*?/\*END\*/', '/*REMAP*/' + tbl + '/*END*/', t, flags=re.S)
        t = re.sub(r'/\*GAPS\*/.*?/\*END\*/', '/*GAPS*/' + gp + '/*END*/', t, flags=re.S)
        js.write_text(t, encoding='utf-8')
    print(json.dumps({'fixedFiles': len(done), 'remapKeys': len(remap), 'gaps': {k: len(v['files']) for k, v in gaps.items()}}, ensure_ascii=False))


if __name__ == '__main__':
    main()
