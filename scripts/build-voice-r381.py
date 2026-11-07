#!/usr/bin/env python3
"""R381: 녹음 서사 음성 목록(voice-r381-data.js) 만들기.
r96/runtime-text/assets/r381/voice/<id>.mp3 를 훑어 id 목록을 적는다. 녹음은 사용자 PC에서
Qwen3-TTS 1.7B CustomVoice(Sohee)로 만들었고, id = SHA-1(문장)[:16] (문장 = 영화 모드 sentences()).
사용: python3 scripts/build-voice-r381.py [새 mp3 폴더…]  (폴더를 주면 assets 로 복사한 뒤 목록을 다시 만든다)"""
import json,re,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96'
A=R/'runtime-text'/'assets'/'r381'/'voice';A.mkdir(parents=True,exist_ok=True)
for d in sys.argv[1:]:
 for p in sorted(Path(d).glob('*.mp3')):
  if re.fullmatch(r'[0-9a-f]{16}\.mp3',p.name):shutil.copyfile(p,A/p.name)
ids=sorted(p.stem for p in A.glob('*.mp3') if re.fullmatch(r'[0-9a-f]{16}',p.stem))
SAMPLE='기억이 거의 남아 있지 않았다.'
data={'model':'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice','speaker':'Sohee','license':'Apache-2.0','base':'assets/r381/voice/','sample':SAMPLE,'ids':ids}
js=('/* R381: 녹음 서사 음성 목록 — scripts/build-voice-r381.py 가 만든 파일입니다. */\n'
 'window.__STORYWORLD_VOICE_R381_DATA__=Object.freeze('+json.dumps(data,ensure_ascii=False,separators=(',',':'))+');\n')
(R/'client-source'/'voice-r381-data.js').write_text(js,encoding='utf-8')
print(json.dumps({'ids':len(ids),'bytes':sum((A/(i+'.mp3')).stat().st_size for i in ids)}))
