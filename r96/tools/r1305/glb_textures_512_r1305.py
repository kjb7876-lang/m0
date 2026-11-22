#!/usr/bin/env python3
"""R1305 — 3D 영웅 GLB 텍스처를 512px WebP 로 줄인다(Pages 1.1GB 예산).

사용: python3 r96/tools/r1305/glb_textures_512_r1305.py <in.glb> <out.glb> [--size 512] [--quality 90]
 - 이미지(EXT_texture_webp)만 Lanczos 로 줄여 다시 WebP 로 쓴다. 메시·스킨·애니메이션 바이트는 그대로 옮긴다.
 - 이미 size 이하인 이미지는 건드리지 않는다. 결과는 bufferView 를 다시 4바이트 정렬로 이어 붙인 GLB 다.
"""
import argparse, io, json, struct
from PIL import Image


def read_glb(path):
    b = open(path, 'rb').read()
    assert b[:4] == b'glTF' and struct.unpack('<I', b[4:8])[0] == 2
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    o = 20 + n
    bn, bt = struct.unpack('<II', b[o:o + 8])
    assert bt == 0x004E4942
    return j, b[o + 8:o + 8 + bn]


def write_glb(path, j, views):
    """views: bufferView 순서대로 바이트. 버퍼 0 하나로 다시 묶는다."""
    out = bytearray()
    for v, data in zip(j['bufferViews'], views):
        out += b'\0' * (-len(out) % 4)
        v['buffer'] = 0
        v['byteOffset'] = len(out)
        v['byteLength'] = len(data)
        out += data
    out += b'\0' * (-len(out) % 4)
    j['buffers'] = [{'byteLength': len(out)}]
    js = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode()
    js += b' ' * (-len(js) % 4)
    total = 12 + 8 + len(js) + 8 + len(out)
    with open(path, 'wb') as f:
        f.write(b'glTF' + struct.pack('<II', 2, total))
        f.write(struct.pack('<I', len(js)) + b'JSON' + js)
        f.write(struct.pack('<I', len(out)) + b'BIN\0' + bytes(out))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--size', type=int, default=512); ap.add_argument('--quality', type=int, default=90)
    a = ap.parse_args()
    j, bin_ = read_glb(a.src)
    assert len(j['buffers']) == 1
    views = [bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in j['bufferViews']]
    for im in j.get('images', []):
        assert im.get('mimeType') == 'image/webp', im
        i = im['bufferView']
        img = Image.open(io.BytesIO(views[i])); img.load()
        if max(img.size) <= a.size:
            continue
        w, h = img.size; s = a.size / max(w, h)
        small = img.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
        buf = io.BytesIO()
        small.save(buf, 'WEBP', quality=a.quality, method=6, exact=img.mode == 'RGBA')
        print(f'  image {i}: {img.size}->{small.size} {img.mode} {len(views[i]):,}->{buf.tell():,}')
        views[i] = buf.getvalue()
    write_glb(a.dst, j, views)


if __name__ == '__main__':
    main()
