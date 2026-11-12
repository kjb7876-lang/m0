#!/usr/bin/env python3
"""R745: 다시 만든 시네마틱 영상·포스터의 크기·sha256 을 각 라운드 index.json 과 r96/qa/r745/assets.json(자산 적용표)에 적는다.
build-cinematics-r745.py · build-title-loop-r667.py 다음에 돌린다."""
import hashlib, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(ROOT, 'r96/runtime-text/assets')
MEASURE = os.path.join(ROOT, 'r96/qa/r745/measure.json')
UNMARK = '생성 도구 표시를 흐림(delogo)이 아니라 역합성(표시 투명도 지도로 배경 = (관측−a·흰색)/(1−a), 윤곽 띠 라플라스 채움)으로 지움'
SOUND = '소리: 30Hz 아래 자르기·약한 FFT 잡음 줄이기·EBU R128 2단계 −16 LUFS/트루 피크 −1.5 dBTP, 48 kHz 스테레오 AAC 128k'
ROWS = [
    # path, index.json, source, use, process
    ('assets/r309/intro/opening-hapil.mp4', 'r309/intro/index.json', '저장소 이전 파일(git c5aba56, R327 연결본 — 사용자 Gemini 영상 두 편; 원본 업로드는 이 세션에 없음)',
     '새 게임 오프닝(intro-video-r309.js)', f'R745: 오른쪽 아래 Gemini 별 표시 {UNMARK}. 압축 잡음 줄이기(hqdn3d 2, 선명화 없음), x264 veryslow tune film. {SOUND}'),
    ('assets/r309/intro/poster-hapil.jpg', 'r309/intro/index.json', 'R745 opening-hapil.mp4', '영상 첫 프레임이 뜨기 전 포스터', 'R745: 새 영상 0.4초 프레임'),
    ('assets/r372/opening-book.mp4', 'r372/index.json', 'R745 표시 지운 연결본', '새 게임 오프닝(intro-video-r309.js), 제목 6.6초~',
     f'R745: 연결본 0~9.458초, 끝 0.8초 소리 페이드. 별 표시 {UNMARK}. hqdn3d 2, x264 veryslow. {SOUND}'),
    ('assets/r372/root-gate.mp4', 'r372/index.json', 'R745 표시 지운 연결본', 'dist00 보스 문 상호작용 때 보스 입장 영상(root-gate-video-r372.js)',
     f'R745: 연결본 10.04초~끝, 0.35초 페이드 인. 별 표시 {UNMARK}. hqdn3d 2, x264 veryslow. {SOUND}'),
    ('assets/r372/root-gate-poster.jpg', 'r372/index.json', 'R745 root-gate.mp4', '영상 첫 프레임 전 포스터', 'R745: 새 영상 0.6초 프레임'),
    ('assets/r368/betrayal.mp4', 'r368/index.json', '사용자 업로드 원본 gemini_generated_video_ec6954db.mp4 (sha256 bc84d313…)', '결전의 날 초천사 배신 장면',
     f'R745: 원본에서 다시 만듦. crop=1280:548:0:12(아래 가짜 게임 UI·깨진 자막·별 표시 줄을 화면 밖으로, 예전과 같음), CAS 0.2, x264 veryslow. {SOUND}'),
    ('assets/r368/betrayal-poster.jpg', 'r368/index.json', 'R745 betrayal.mp4', '영상 포스터', 'R745: 새 영상 0.3초 프레임'),
    ('assets/r369/poison-city.mp4', 'r369/index.json', '사용자 업로드 원본 gemini_generated_video_f5fb3f35.mp4 (sha256 3232126a…)', '환자와 중독의 도시(ep1a10) 첫 입장 서사 영상',
     f'R745: 원본에서 다시 만듦. 별 표시 {UNMARK}(예전 delogo 흐림 자국 없음). 가짜 HUD \'위험: 환각성 약물 검출\' 글자·틀(x968 y92 280x120, 3.55~6.55초)은 예전처럼 delogo. CAS 0.2, x264 veryslow. {SOUND}'),
    ('assets/r369/poison-city-poster.jpg', 'r369/index.json', 'R745 poison-city.mp4', '영상 포스터', 'R745: 새 영상 0.3초 프레임'),
    ('assets/r617/knight.mp4', 'r617/index.json', '사용자 2026-11-10 첨부 영상 「타락천사 기사 강림」(세로 720×1280, 8초, 24fps)', 'last301 타락천사 기사가 깨어날 때(보스전 시작)',
     f'R745: 원본에서 1280×720 으로 다시 만듦(예전 960×540). 자르지 않음: 원본 전체를 405×720 으로 가운데, 양옆은 같은 영상 확대·흐림·어둡게. 오른쪽 아래 Veo 표시 {UNMARK}. 0.35초 페이드인·0.45초 페이드아웃, CAS 0.25, x264 veryslow. {SOUND}'),
    ('assets/r617/knight-poster.jpg', 'r617/index.json', 'R745 knight.mp4', '영상 불러오기 전 첫 화면(포스터)', 'R745: 처리한 영상 6.5초 프레임(자르지 않음, 표시 지움 반영)'),
    ('assets/r617/fall.mp4', 'r617/index.json', '사용자 2026-11-10 첨부 영상 「추락」(1112×834, 4.06초, 60fps)', 'last301 타락천사 기사가 쓰러진 뒤 — 성벽에서 검은 바다로 추락',
     f'R745: 원본에서 1280×720 으로 다시 만듦. 자르지 않음: 4:3 원본 전체를 960×720 가운데, 양옆 흐린 채움. 왼쪽 위 AI 배지·오른쪽 아래 Dreamina AI 표시 {UNMARK}. 0.8배 느리게(atempo 0.8), 60→24fps, eq gamma 1.22·contrast 1.04, 페이드 0.35/0.6초, x264 veryslow. {SOUND}'),
    ('assets/r617/fall-poster.jpg', 'r617/index.json', 'R745 fall.mp4', '영상 불러오기 전 첫 화면(포스터)', 'R745: 처리한 영상 1.0초 프레임(자르지 않음, 표시 지움 반영)'),
    ('assets/r617/beach.mp4', 'r617/index.json', '사용자 2026-11-10 첨부 영상 「해변」(세로 720×1280, 8초, 24fps)', 'last302 잠들지 못하는 마을 입장 — 젖은 모래 해안에서 깨어남',
     f'R745: 원본에서 1280×720 으로 다시 만듦. 자르지 않음: 원본 전체를 가운데, 양옆 흐린 채움. 오른쪽 아래 Veo 표시 {UNMARK}. 페이드 0.35/0.6초, x264 veryslow. {SOUND}'),
    ('assets/r617/beach-poster.jpg', 'r617/index.json', 'R745 beach.mp4', '영상 불러오기 전 첫 화면(포스터)', 'R745: 처리한 영상 1.0초 프레임(자르지 않음, 표시 지움 반영)'),
    ('assets/r667/title-video/loop.mp4', 'r667/index.json', 'r96/runtime-text/assets/r309/intro/opening-hapil.mp4 (R745 표시 지운 오프닝, 444번째 프레임 = 18.50초)',
     '타이틀(메인 메뉴) 배경 10초 이음매 없는 루프 영상 960×540 24fps — Cloudflare(R615)에서 받음, Pages 배포본에서는 뺌',
     'R745: scripts/build-title-loop-r667.py 를 표시 지운 원천으로 다시 돌림(정지 화면 delogo 흐림 자국 없음) → 주기 10초 움직임(숨쉬기 카메라·붉은 맥동·불꽃·불티 70개·안개·하늘 번쩍임 1회·비네트) → H.264 veryslow CRF23 yuv420p faststart, 소리 없음'),
    ('assets/r667/title-poster.jpg', 'r667/index.json', 'r96/runtime-text/assets/r309/intro/opening-hapil.mp4 (R745 표시 지운 오프닝, 444번째 프레임 = 18.50초)',
     '루프 첫 프레임 정지 이미지 — 영상 받기 전·실패·움직임 줄이기·데이터 절약일 때 (Pages)', 'R745: scripts/build-title-loop-r667.py 를 표시 지운 원천으로 다시 돌린 루프의 첫 프레임'),
]


def main():
    meas = {}
    try:
        meas = {r['path']: r for r in json.load(open(MEASURE, encoding='utf-8'))['files']}
    except Exception:
        pass
    table = []
    idx_cache = {}
    for path, ix, source, use, process in ROWS:
        b = open(os.path.join(ROOT, 'r96/runtime-text', path), 'rb').read()
        row = {'path': path, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'source': source, 'use': use, 'process': process, 'applied': True}
        m = meas.get(path)
        if m and m['sha256'] == row['sha256']:
            row['measured'] = {k: m.get(k) for k in ('size', 'seconds', 'audio', 'marks', 'x264')}
        table.append(row)
        if ix not in idx_cache:
            idx_cache[ix] = json.load(open(os.path.join(A, ix), encoding='utf-8'))
        d = idx_cache[ix]
        fl = d.get('files', [])
        for f in fl:
            fp = f['path'] if f['path'].startswith('assets/') else 'assets/' + os.path.dirname(ix) + '/' + f['path']
            if fp == path:
                f['bytes'] = row['bytes']; f['sha256'] = row['sha256']
                key = 'process' if 'process' in f or 'derive' not in f else 'derive'
                f[key] = process
                if path.startswith('assets/r617/') or path.startswith('assets/r667/'):
                    f['source'] = source
                if 'size' in f and m:
                    f['size'] = m['size']
                break
        else:
            raise SystemExit('index row missing: ' + path + ' in ' + ix)
    if 'source' in idx_cache['r372/index.json']:
        s = idx_cache['r372/index.json']['source']
        hb = open(os.path.join(A, 'r309/intro/opening-hapil.mp4'), 'rb').read()
        s['note_r745'] = 'R745: 두 영상 모두 표시 지운 연결본(아래 sha256)에서 다시 잘라 만듦'
        s['sha256'] = hashlib.sha256(hb).hexdigest(); s['bytes'] = len(hb)
    for ix, d in idx_cache.items():
        with open(os.path.join(A, ix), 'w', encoding='utf-8') as fh:
            json.dump(d, fh, ensure_ascii=False, indent=1 if ix.startswith('r617') else 1)
            fh.write('\n')
    out = {'schema': 'storyworld-r745-assets/v1', 'round': 'R745',
           'note': '사용자 2026-11-11 지시 "게임에 들어간 시네마틱 영상 중 워터마크 있는 것 워터마크 제거랑 화질·퀄리티 개선 및 음성 개선". 지운 표시는 모두 사용자가 만든 영상에 생성 도구(Gemini/Veo·Dreamina)가 자동으로 붙인 표시이며 다른 저작권자 표시는 없었다. 사용자 원본 영상은 저장소에 넣지 않음. 쓰지 않는 r140 영상(배포본 제외)은 손대지 않음.',
           'marks': 'scripts/r745/marks/marks.json', 'build': ['scripts/build-cinematics-r745.py', 'scripts/build-title-loop-r667.py', 'scripts/r745/write-tables.py'],
           'files': table}
    with open(os.path.join(ROOT, 'r96/qa/r745/assets.json'), 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    print('rows', len(table))


if __name__ == '__main__':
    main()
