#!/usr/bin/env python3
"""R1056 — 동양 테마 지역 국악 BGM 만들기(사용자 2026-11-15 11:38Z·11:40Z).

원천: 한국저작권위원회 공유마당 '국악 BGM #1~#250'(저작자 주식회사 아이티앤, 2025-10-10, CC BY 4.0 — 상업 사용·변경 허용, 출처 표시 의무).
곡 하나가 60~84초라 한 맵에서 금방 되풀이된다 → 분위기가 맞는 2~3곡을 4초 교차 페이드로 이어 붙여 2~3분짜리 메들리 1개로 만든다.
가공(docs/sound-rules.md 0절 '어둡게, 귀에 편하게'): 곡마다 −18 LUFS 로 맞춘 뒤 6kHz 위 −3dB 셸빙(쨍함 줄이기), 이어 붙인 뒤 다시 −18 LUFS, ogg vorbis 80kbps.
원본은 받지 않고 공유마당에서 내려받아 해시만 남긴다. 결과: r96/runtime-text/assets/r1056/bgm/*.ogg, CREDITS.md, r308 index.json 의 tracks·maps·samong 갱신.
사용: python3 scripts/build-bgm-r1056.py [원본폴더]   (원본폴더 기본 /tmp/claude-0/gugak, 없으면 공유마당에서 받는다)
"""
import gzip, hashlib, json, pathlib, re, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
RT = ROOT / 'r96/runtime-text'
OUT = RT / 'assets/r1056/bgm'
INDEX = RT / 'assets/r308/bgm/index.json'
SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/gugak')
VIEW = 'https://gongu.copyright.or.kr/gongu/wrt/wrt/view.do?wrtSn={}&menuNo=200020'
DL = 'https://gongu.copyright.or.kr/gongu/wrt/cmmn/wrtFileDownload.do?wrtSn={}&fileSn=1'
LIC = 'https://creativecommons.org/licenses/by/4.0/'
AUTHOR = '주식회사 아이티앤'
# 공유마당 글 번호(wrtSn) = 13386740 + 곡 번호. 분위기 낱말은 공유마당 소개글 그대로.
P = lambda n, mood: {'n': n, 'wrtSn': str(13386740 + n), 'title': f'국악 BGM #{n}', 'mood': mood}
MEDLEYS = {
    'gugak-hwando': {'ko': '국악 메들리 · 환도의 의지', 'parts': [P(64, '비장한'), P(30, '고독한'), P(129, '고즈넉한')],
                     'why': '환도 자아의 탄생(restU2·last304·last305) 탐색 — 칼로 응축된 의지, 홀로 깨어나는 풀숲'},
    'gugak-hwando-climax': {'ko': '국악 메들리 · 성벽의 결전', 'parts': [P(60, '결전 직전의 상황'), P(244, '배틀하는')],
                            'why': '환도 절정(last301) — 고블린 두목·타락천사 기사, 성벽 밖으로 떨어짐'},
    'gugak-village': {'ko': '국악 메들리 · 잠들지 못하는 마을', 'parts': [P(25, '음침한 섬뜩한'), P(226, '숨어서 지켜보는'), P(233, '무서운')],
                      'why': '잠들지 못하는 마을(last302) 탐색 — 해안에서 깨어 들어선 소복 차림 주민의 마을'},
    'gugak-village-climax': {'ko': '국악 메들리 · 불면귀', 'parts': [P(220, '정신이 위태로운'), P(58, '세상의 끝의 혼란')],
                             'why': '불면귀 절정(last303) — 잠들지 못하는 정신, 주민과 불면귀를 가려 물리침'},
    'gugak-gyeongseong-climax': {'ko': '국악 메들리 · 경성의 밤 대면', 'parts': [P(154, '긴장감을 높이는'), P(97, '불길한 느낌')],
                                 'why': '사몽 S-05 경성의 밤 대면 구역(절정). 탐색은 녹턴 Op.48-1 그대로'},
}
ASSIGN = {'maps': {'restU2': 'gugak-hwando', 'last304': 'gugak-hwando', 'last305': 'gugak-hwando', 'last301': 'gugak-hwando-climax',
                   'last302': 'gugak-village', 'last303': 'gugak-village-climax'},
          'samong': {'S-05|climax': 'gugak-gyeongseong-climax'}}
XF = 4.0


def sh(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def fetch(part):
    f = SRC / f"b{part['n']:03d}.mp3"
    if not f.exists():
        SRC.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(DL.format(part['wrtSn']), headers={'User-Agent': 'Mozilla/5.0'})
        raw = urllib.request.urlopen(req, timeout=120).read()
        if raw[:2] == b'\x1f\x8b': raw = gzip.decompress(raw)
        f.write_bytes(raw)
    return f


def lufs(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1])


def dur(path):
    return float(sh(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)]).stdout)


def build(tid, spec, tmp):
    parts = []
    for i, p in enumerate(spec['parts']):
        f = fetch(p)
        p['originalSha256'] = hashlib.sha256(f.read_bytes()).hexdigest(); p['originalBytes'] = f.stat().st_size
        g = -18 - lufs(f)
        w = tmp / f'{tid}-{i}.wav'
        sh(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(f), '-af', f'volume={g:.2f}dB,highshelf=f=6000:g=-3,aresample=44100', '-ac', '2', str(w)])
        parts.append(w)
    inputs = sum([['-i', str(w)] for w in parts], [])
    if len(parts) == 2:
        fc = f'[0][1]acrossfade=d={XF}:c1=tri:c2=tri[m]'
    else:
        fc = f'[0][1]acrossfade=d={XF}:c1=tri:c2=tri[a];[a][2]acrossfade=d={XF}:c1=tri:c2=tri[m]'
    mix = tmp / f'{tid}-mix.wav'
    sh(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', fc, '-map', '[m]', str(mix)])
    d = dur(mix); g = -18 - lufs(mix)
    out = OUT / f'{tid}.ogg'
    sh(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(mix), '-af', f'volume={g:.2f}dB,afade=t=in:d=0.3,afade=t=out:st={d - 2.5:.2f}:d=2.5,alimiter=limit=0.89',
        '-c:a', 'libvorbis', '-b:a', '80k', '-ar', '44100', '-ac', '2', '-map_metadata', '-1', str(out)])
    b = out.read_bytes()
    orig = hashlib.sha256(''.join(p['originalSha256'] for p in spec['parts']).encode()).hexdigest()
    names = ' + '.join(f"{p['title']}({p['mood']})" for p in spec['parts'])
    return {
        'title': spec['ko'] + ' — ' + names, 'composer': AUTHOR, 'performer': AUTHOR,
        'license': 'CC BY 4.0', 'licenseUrl': LIC, 'source': VIEW.format(spec['parts'][0]['wrtSn']),
        'licenseEvidence': f'공유마당 글마다 "{AUTHOR} 의 "국악 BGM #N" 은 CC BY 라이선스로 제공됩니다"(창작 2025-10-10, 이용허락 CC BY 4.0, 상업 사용·변경 허용, 출처 표시). '
                           + ', '.join(f"#{p['n']}=wrtSn {p['wrtSn']}" for p in spec['parts']),
        'parts': [{k: p[k] for k in ('title', 'wrtSn', 'mood', 'originalSha256', 'originalBytes')} | {'source': VIEW.format(p['wrtSn'])} for p in spec['parts']],
        'file': out.name, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'durationSec': round(dur(out), 2),
        'lufs': round(lufs(out), 1), 'gain': 0.6,
        'changes': f'곡마다 음량 맞춤(-18 LUFS)·6kHz 위 -3dB 셸빙(어둡게), {len(parts)}곡을 {XF:.0f}초 교차 페이드로 이어 붙임, 전체 -18 LUFS·끝 2.5초 페이드, ogg vorbis 80kbps',
        'originalSha256': orig, 'originalBytes': sum(p['originalBytes'] for p in spec['parts']),
        'path': f'assets/r1056/bgm/{out.name}', 'origin': 'R1056', 'why': spec['why'], 'koTitle': spec['ko']}


def main():
    import tempfile
    OUT.mkdir(parents=True, exist_ok=True)
    ix = json.loads(INDEX.read_text(encoding='utf-8'))
    with tempfile.TemporaryDirectory() as td:
        tracks = {tid: build(tid, spec, pathlib.Path(td)) for tid, spec in MEDLEYS.items()}
    was = (ix.get('r1056') or {}).get('was') or {'maps': {z: ix['maps'][z]['track'] for z in ASSIGN['maps']},
                                                   'samong': {k: ix['samong']['episodes'][k.split('|')[0]][k.split('|')[1]] for k in ASSIGN['samong']}}
    ix['tracks'].update(tracks)
    for z, t in ASSIGN['maps'].items(): ix['maps'][z]['track'] = t
    for k, t in ASSIGN['samong'].items():
        ep, role = k.split('|'); ix['samong']['episodes'][ep][role] = t
    for e in ix['episodes']:
        if e['id'] in ('m6', 'm7'):
            ms = [z for z in e['maps'] if ix['maps'][z]['role'] == 'main']
            e['main'] = ix['maps'][ms[0]]['track']
            e['climax'] = {z: ix['maps'][z]['track'] for z in e['climax']}
    ix['r1056'] = {'rule': '동양 테마 지역(환도 자아의 탄생·잠들지 못하는 마을·사몽 경성의 밤 대면)만 국악. 나머지 맵은 그대로.', 'was': was}
    INDEX.write_text(json.dumps(ix, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    lines = ['# R1056 국악 BGM 크레딧', '', '출처: 한국저작권위원회 공유마당(https://gongu.copyright.or.kr) — 저작자 **주식회사 아이티앤**, 「국악 BGM」 연작(2025-10-10),',
             f'이용허락 **CC BY 4.0**({LIC}). 상업 사용·변경 허용, 출처 표시 의무.', '',
             '변경: 곡마다 음량 맞춤(-18 LUFS)·6kHz 위 −3dB 셸빙, 2~3곡을 4초 교차 페이드로 이어 붙임, 끝 페이드, ogg 변환. 원곡 소리를 새로 만들지 않았다.', '',
             '| 게임 파일 | 쓰는 곳 | 원곡(공유마당 글 번호) |', '|---|---|---|']
    for tid, t in tracks.items():
        lines.append(f"| {t['file']} | {t['why']} | " + '<br>'.join(f"[{p['title']}]({p['source']}) {p['mood']} (wrtSn {p['wrtSn']})" for p in t['parts']) + ' |')
    (OUT / 'CREDITS.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    for tid, t in tracks.items(): print(tid, t['durationSec'], t['lufs'], t['bytes'])


if __name__ == '__main__':
    main()
