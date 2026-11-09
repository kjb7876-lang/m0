# 같은 자리 전후 스크린샷(scene4) 두 장을 몹 둘레로 잘라 2배로 키워 나란히 붙인다. 글자는 게임 안에서 그린 것만 쓴다(PIL 에 한글 글꼴 없음).
import json, re, sys, os
from PIL import Image
SP = os.path.dirname(os.path.abspath(__file__))
shots = os.path.join(SP, '..', 'shots')
def pos(log):
    for line in open(log, encoding='utf-8'):
        m = re.match(r'^\w+ shot (\{.*\})$', line.strip())
        if m:
            c = json.loads(m.group(1))
            cx = max(0, min(1280 - 480, c['x'] - 240)); cy = max(0, min(720 - 300, c['y'] - 215))
            return c['x'] - cx, c['y'] - cy, c
    raise SystemExit('no shot line in ' + log)
def crop(img, x, y, w=340, h=250, up=185):
    l = int(round(x - w / 2)); t = int(round(y - up))
    l = max(0, min(img.width - w, l)); t = max(0, min(img.height - h, t))
    return img.crop((l, t, l + w, t + h)).resize((w * 2, h * 2), Image.LANCZOS)
def pair(zone, scene, out):
    ims = []
    meta = {}
    for tag in ('before', 'after'):
        x, y, c = pos(os.path.join(SP, f's4-{zone}-{scene}-{tag}.log'))
        ims.append(crop(Image.open(os.path.join(shots, f's4-{zone}-{scene}-{tag}.png')).convert('RGB'), x, y))
        meta[tag] = {'flip': (c.get('body') or {}).get('flip'), 'src': (c.get('body') or {}).get('src'), 'face': c.get('face'), 'hero': c.get('hero')}
    W, H = ims[0].size
    o = Image.new('RGB', (W * 2 + 12, H), (16, 16, 16)); o.paste(ims[0], (0, 0)); o.paste(ims[1], (W + 12, 0))
    o.save(out, quality=86)
    return meta
def debugpair(scene_png, scene_log, play_png, at, out):
    """디버그 표시 두 장: 왼쪽 = scene4(NOLABEL) 장면, 오른쪽 = scdebug 실제 플레이 화면의 무리 둘레(at=(x,y), 1280×720 기준)."""
    x, y, _ = pos(scene_log)
    a = crop(Image.open(scene_png).convert('RGB'), x, y)
    b = crop(Image.open(play_png).convert('RGB'), at[0], at[1])
    W, H = a.size
    o = Image.new('RGB', (W * 2 + 12, H), (16, 16, 16)); o.paste(a, (0, 0)); o.paste(b, (W + 12, 0))
    o.save(out, quality=88)
if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'debug':  # compose4.py debug <scene.png> <scene.log> <play.png> <x,y> <out.jpg>
        debugpair(sys.argv[2], sys.argv[3], sys.argv[4], tuple(float(v) for v in sys.argv[5].split(',')), sys.argv[6]); raise SystemExit(0)
    res = {}
    for spec in sys.argv[2:]:
        zone, scene = spec.split(':')
        out = os.path.join(sys.argv[1], f'cmp-{zone}-{scene}.jpg')
        res[out] = pair(zone, scene, out)
    print(json.dumps(res, ensure_ascii=False, indent=1))
