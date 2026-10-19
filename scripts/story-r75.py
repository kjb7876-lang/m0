"""Deterministic source contract. Story IDs are strings; ordinals only sort.

The catalog's bodies must be literal source slices. Phase cuts arrange existing
paragraphs around encounters, never rewrite narrative. Archival input is kept.
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = '47a09cda7444df1bc2a09063da0748b367029f5c1fdeffb5660c477e6c60bd7a'
SHA = lambda s: hashlib.sha256(s.encode() if isinstance(s, str) else s).hexdigest()
# Number of paragraphs shown before the encounter. Remaining paragraphs are
# shown after its authored objective; this table is not a narrative rewrite.
CUTS = dict(zip('01 02 03 04 05 06 07 08 09-1 09-2 10 11 13 14 15 16 17 18 19 20 21 22 24 25 26 27 28 29 31 32 33 34 35 37 38 39 40 41 42 43 44 45 46 48 49 50 52 53 54 55 56 57 58 59 60'.split(),
                [2,2,2,2,1,1,1,2,2,1,3,5,3,3,3,3,3,2,2,3,3,3,4,4,4,2,4,1,2,2,1,2,2,7,2,3,2,2,2,2,2,2,5,2,2,2,4,5,5,2,3,2,3,2,4]))


def between(source, start, end):
    return source.split(start, 1)[1].split(end, 1)[0].strip()


def contract():
    raw = (ROOT / 'story-source/hapil-story-20261019.txt').read_bytes()
    if SHA(raw) != SOURCE_SHA or len(raw) != 91341:
        raise ValueError('R75 source bytes changed')
    source = raw.decode()
    cat = json.loads((ROOT / 'story-source/catalog-r75.json').read_text())
    ids = [f'{i:02}' for i in range(1, 9)] + ['09-1', '09-2'] + [f'{i:02}' for i in range(10, 62)]
    if cat['sceneIds'] != ids or len(cat['portalOrder']) != 64:
        raise ValueError('R75 explicit scene ID/order drift')
    specials = {
        'prologue.pre': between(source, '음성 1 — 기억의 독백', '음성 2 — 전투 후 기억'),
        'prologue.post': between(source, '음성 2 — 전투 후 기억', '━'),
        'finale.core-preserved': between(source, '최종장 — 남겨진 몽세', '━'),
        'ending.STORY': '오늘은 어떤 꿈을 꾸셨나요?',
        'hidden.persona': '외부의 악을 넘어, 내 욕망의 순수악의가 거울에서 깨어난다',
        'hidden.dual-awakening': '쌍각성 · 검백과 흑적, 서로를 향해 다시 선다',
        'hidden.desire-return': '惡夢覺醒 · 욕망이 순수악의로 되돌아온다',
        'hidden.self-confrontation': '쌍각성 · 사몽의 나와 마주 서다',
        'followup.EGO': between(source, '후속 서사 — 마지막 수호자 EGO', '━'),
        'death.collapse': 'EGO COLLAPSE · REBIRTH',
        'death.transition': '꿈속에서의 죽음은 곧 장면의 전환',
        'return.sleep': '다시 잠에들 시간이에요...!',
    }
    for text in specials.values():
        if text not in source:
            raise ValueError('Special trigger is not a verbatim source slice')
    records = []
    voices = []

    def voice(scene, part, text, narrator):
        # Structural headings are preserved on cards, excluded from speech.
        speaker = narrator
        groups = []
        for paragraph in text.split('\n\n'):
            if paragraph.strip() == '미카엘라  — 환자 기록':
                speaker = '미카엘라'; continue
            if paragraph.strip() == '한이경의 진술서':
                speaker = '한이경'; continue
            if re.fullmatch(r'제\d+단계 — .+', paragraph.strip()) or paragraph in ['시간 수확', '최적화된 운명', '자유의지의 시간']:
                continue
            if scene == '55' and paragraph.startswith('나는 진술서를 남긴 뒤'):
                speaker = '한이경'
            if paragraph.strip():
                groups.append({'narrator': speaker, 'text': paragraph, 'textSha256': SHA(paragraph)})
        speech = '\n\n'.join(g['text'] for g in groups)
        if speech:
            voices.append({'key': scene + ':' + part, 'sceneId': scene, 'part': part,
                           'displayTextSha256': SHA(text), 'text': speech, 'textSha256': SHA(speech),
                           'segments': [dict(g, segmentId=f'{scene}:{part}:{i:03}') for i, g in enumerate(groups)]})

    for r in cat['records']:
        body = r['body']; span = r['sourceSpan']
        if source[span['characterStart']:span['characterEnd']].strip() != body or SHA(body) != r['bodySHA256']:
            raise ValueError('Source span/hash mismatch: ' + r['sceneId'])
        paragraphs = body.split('\n\n')
        if r['rest']:
            parts = {'body': body, 'pre': '', 'post': ''}
        elif r['sceneId'] == '61':
            parts = {part: '\n\n'.join(paragraphs[a:b]) for part, a, b in
                     [('pre', 0, 1), ('firstPost', 1, 7), ('awakenPre', 7, 11), ('post', 11, None)]}
        else:
            cut = CUTS[r['sceneId']]
            if not 0 < cut <= len(paragraphs):
                raise ValueError('Invalid phase cut: ' + r['sceneId'])
            parts = {'pre': '\n\n'.join(paragraphs[:cut]), 'post': '\n\n'.join(paragraphs[cut:])}
        for part, text in parts.items():
            if text: voice(r['sceneId'], part, text, r['narratorLabel'])
        records.append(dict(r, parts=parts))
    for trigger, text in specials.items():
        voice(trigger, 'special', text, '기억의 기록')
    return dict(cat, records=records, specialTexts=specials), {
        'schema': 'storyworld.voice-contract-r75/v1', 'sourceSha256': SOURCE_SHA,
        'model': 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice', 'language': 'Korean', 'speaker': 'Sohee',
        'audioStatus': 'awaiting-shared-generated-audio', 'scenes': voices,
        'pronunciation': {'EGO': '에고', 'SUPER EGO': '슈퍼 에고', 'ID': '이드', 'DREAM': '드림',
                          '合一夢世': '합일몽세', '死夢覺醒': '사몽각성', '惡夢覺醒': '악몽각성'},
        'rule': 'Use exact speech text and hashes. Pronunciation hints do not modify display/source text. No voice cloning.'}


if __name__ == '__main__':
    data, voice = contract()
    for name, value in [('runtime-r75.json', data), ('voice-contract-r75.json', voice)]:
        (ROOT / 'story-source' / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'sourceSha256': SOURCE_SHA, 'scenes': len(data['records']), 'regions': len(data['portalOrder']),
                      'voiceScenes': len(voice['scenes']), 'audioGenerated': False}))
