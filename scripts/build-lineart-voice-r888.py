#!/usr/bin/env python3
"""R888 — 선화 컷씬 자막 음성 길이표를 만든다.
선화 컷씬(lineart-scenes-r88*.js)의 자막은 정본 문장 그대로라서 스토리 모드 녹음(R381, assets/r381/voice/<sha1(문장)[:16]>.mp3)을 그대로 쓴다.
재생기가 장면 속도를 음성 길이에 맞추려면 길이를 미리 알아야 하므로, 자막마다 녹음 길이(초)를 재서
r96/client-source/lineart-voice-r888-data.js 에 적는다. 새 음성은 만들지 않는다(파일 추가 0).
사용: python3 scripts/build-lineart-voice-r888.py  (ffprobe 필요) → 그 뒤 scripts/sync-r99.py
"""
import glob, hashlib, json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'r96', 'client-source')
VOICE = os.path.join(ROOT, 'r96', 'runtime-text', 'assets', 'r381', 'voice')
CAP = re.compile(r"""\[\s*[\d.]+\s*,\s*[\d.]+\s*,\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1\s*\]""")
dur, missing = {}, []
for path in sorted(glob.glob(os.path.join(SRC, 'lineart-scenes-r*.js'))):
    for m in CAP.finditer(open(path, encoding='utf-8').read()):
        text = re.sub(r"\\(['\"])", r'\1', m.group(2)).strip()
        if not re.search('[가-힣]', text):
            continue
        vid = hashlib.sha1(text.encode('utf-8')).hexdigest()[:16]
        mp3 = os.path.join(VOICE, vid + '.mp3')
        if not os.path.exists(mp3):
            missing.append((os.path.basename(path), text))
            continue
        if vid not in dur:
            out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3])
            dur[vid] = round(float(out.decode().strip()), 2)
if missing:
    for f, t in missing:
        print('녹음 없음:', f, t, file=sys.stderr)
    sys.exit(1)
body = json.dumps({'source': 'R381 녹음(Qwen3-TTS 1.7B CustomVoice Sohee, Apache-2.0) 길이(초)', 'dur': dict(sorted(dur.items()))}, ensure_ascii=False, separators=(',', ':'))
open(os.path.join(SRC, 'lineart-voice-r888-data.js'), 'w', encoding='utf-8').write(
    '/* R888: 선화 컷씬 자막 음성 길이표 — scripts/build-lineart-voice-r888.py 가 만든 파일입니다. */\nwindow.__STORYWORLD_LINEART_VOICE_R888__=Object.freeze(' + body + ');\n')
print(json.dumps({'captions': len(dur), 'seconds': round(sum(dur.values()), 1)}))
