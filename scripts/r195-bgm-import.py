#!/usr/bin/env python3
"""R195 클래식 BGM 가져오기.

받은 원본(저장소 밖 스테이징, 신뢰하지 않는 파일)을 ffmpeg 로 변환만 한다. 원본은 실행하지 않고 저장소에 넣지 않는다.
  · 음량 맞추기(EBU R128 loudnorm, 목표 -18 LUFS, 피크 -1.5 dBTP)
  · 최대 길이 270초(넘으면 끝 4초 페이드아웃), 시작 0.6초 페이드인
  · mp3 96 kbps 스테레오(R202: 14곡 40MB 예산 안으로 112→96) 44.1 kHz(모든 브라우저·모바일에서 재생)
결과: r96/runtime-text/assets/audio/bgm/classical/<id>.mp3 + catalog.json(라이선스·출처·해시·바꾼 점) + 저장소 루트 MUSIC_CREDITS.md

쓰는 법: python3 -I scripts/r195-bgm-import.py <stage-dir> <plan.json>
  plan.json = {"tracks":[{"id","file"(stage 안 경로),"title","composer","performer","license","licenseUrl","source","licenseEvidence","gain"?, "start"?}],
               "slots":{"explore:default":"id", ...}}
"""
import hashlib, json, os, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'r96', 'runtime-text', 'assets', 'audio', 'bgm', 'classical')
MAX_SEC = 270
ALLOWED = ('Public domain', 'CC0', 'CC BY 3.0', 'CC BY 4.0')


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def duration(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', p], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def main(stage, plan_path):
    plan = json.load(open(plan_path, encoding='utf8'))
    os.makedirs(OUT, exist_ok=True)
    tracks = {}
    for t in plan['tracks']:
        if not t['license'].startswith(ALLOWED):
            raise SystemExit('license not allowed: %s %s' % (t['id'], t['license']))
        src = os.path.realpath(os.path.join(stage, t['file']))
        if not src.startswith(os.path.realpath(stage) + os.sep):
            raise SystemExit('path escapes stage: ' + t['file'])
        start = float(t.get('start', 0))
        full = duration(src)
        length = min(MAX_SEC, full - start)
        cut = full - start > MAX_SEC
        af = 'loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.6'
        if cut:
            af += ',afade=t=out:st=%.2f:d=4' % (length - 4)
        dst = os.path.join(OUT, t['id'] + '.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-t', '%.2f' % length, '-i', src, '-vn', '-map_metadata', '-1',
                        '-af', af, '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', dst], check=True)
        changes = '음량 맞춤(-18 LUFS), mp3 96kbps 변환' + (', %d초에서 자르고 끝 4초 페이드아웃' % round(length) if cut else '') + (', %.0f초부터 시작' % start if start else '')
        tracks[t['id']] = {k: t[k] for k in ('title', 'composer', 'performer', 'license', 'licenseUrl', 'source', 'licenseEvidence') if k in t}
        tracks[t['id']].update({'file': t['id'] + '.mp3', 'bytes': os.path.getsize(dst), 'sha256': sha(dst), 'durationSec': round(duration(dst), 2),
                                'gain': t.get('gain', 0.62), 'changes': changes, 'originalSha256': sha(src), 'originalBytes': os.path.getsize(src)})
        print(t['id'], tracks[t['id']]['bytes'], tracks[t['id']]['durationSec'])
    for s, i in plan['slots'].items():
        if i not in tracks:
            raise SystemExit('slot %s -> unknown %s' % (s, i))
    cat = {'revision': 'R195-classical-1', 'note': '퍼블릭 도메인·CC0·CC BY 녹음만. 파일별 라이선스 페이지를 확인했다(licenseEvidence).', 'tracks': tracks, 'slots': plan['slots']}
    json.dump(cat, open(os.path.join(OUT, 'catalog.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    lines = ['# 음악 크레딧 (MUSIC_CREDITS)', '',
             '『합일몽세·스토리월드』의 클래식 배경음악(R195)입니다. 퍼블릭 도메인·CC0 녹음을 먼저 쓰고, 없을 때만 CC BY 녹음을 썼습니다.',
             'NC(비상업)·SA(동일조건)·ND(변경금지)·라이선스가 불분명한 녹음은 쓰지 않았습니다. 게임 안 설정 → "음악 크레딧"에서도 볼 수 있습니다.', '',
             '| 곡 | 작곡 | 연주 | 라이선스 | 원본 | 바꾼 점 | 쓰는 곳 |', '|---|---|---|---|---|---|---|']
    use = {}
    for s, i in plan['slots'].items():
        use.setdefault(i, []).append(s)
    for i, t in tracks.items():
        lic = '[%s](%s)' % (t['license'], t['licenseUrl']) if t.get('licenseUrl') else t['license']
        lines.append('| %s | %s | %s | %s | [원본 페이지](%s) | %s | %s |' % (t['title'], t['composer'], t['performer'], lic, t['source'], t['changes'], ', '.join(use.get(i, []))))
    lines += ['', 'CC BY 곡은 위 표의 저작자·라이선스 표기로 출처를 밝힙니다(변경: 음량 맞춤·길이 자름·mp3 변환).', '',
              '파일 무결성(sha256)은 `r96/runtime-text/assets/audio/bgm/classical/catalog.json` 에 있습니다.', '']
    open(os.path.join(ROOT, 'MUSIC_CREDITS.md'), 'w', encoding='utf8').write('\n'.join(lines))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
