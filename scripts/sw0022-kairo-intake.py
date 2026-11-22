#!/usr/bin/env python3
"""Verify the Drive index and convert compatible Kaironomicon movement sheets."""
import argparse
import csv
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path, PurePosixPath

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / 'r96/runtime-text'
CLIENT = ROOT / 'r96/client-source'
DEST = RUNTIME / 'assets/sw0022'
MOBS = {
    'time-collector': ('time-collector', 'time-collector.png'),
    'time-connector': ('time-connector', 'connector.png'),
    'time-resonance-slave': ('time-resonance-slave', 'resonance-slave.png'),
    'time-desire-tuner': ('time-desire-tuner', 'desire-tuner.png'),
}
ACAD = {'time-collector': (1, 4), 'time-connector': (2, 5), 'time-resonance-slave': (3, 6)}
VISUAL_HOLDS = {'kair-guardian-39', 'kair-guardian-46', 'kair-elite-58'}
# Exact current movement strips recorded in r96/qa/r1029/move-census.tsv.
ACTIVE_STRIPS = {
    'time-collector': 'r116/mobs/M054-idle.png', 'kair-guardian-03': 'r116/mobs/M057-idle.png',
    'kair-guardian-18': 'r92/mobs/M075-move.png', 'kair-elite-52': 'r92/mobs/M076-move.png',
    'kair-guardian-23': 'r92/mobs/M081-move.png', 'kair-guardian-27': 'r92/mobs/M087-move.png',
    'kair-guardian-28': 'r92/mobs/M088-move.png', 'kair-elite-55': 'r92/mobs/M091-move.png',
    'kair-guardian-36': 'r92/mobs/M097-move.png', 'kair-elite-59': 'r92/mobs/M113-move.png',
    'kair-elite-60': 'r92/mobs/M114-move.png',
}


def load_js(name, variable):
    content = (CLIENT / name).read_text().split(variable + '=', 1)[1]
    return json.JSONDecoder().raw_decode(content.lstrip())[0]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def measure(im):
    alpha = np.asarray(im.getchannel('A'))
    yy, xx = np.where(alpha > 16)
    solid = (alpha > 100).sum(axis=1)
    ys = np.where(solid >= max(1, solid.max() * .12))[0]
    if len(ys) < 8 or len(xx) < 300:
        raise ValueError('empty or nearly transparent frame')
    return [int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1)], int(ys[-1]-ys[0]+1)


def reference(site, actor, old, floats):
    if actor == 'kair-great-03':
        return [v for v in old[actor]['idle'] if v['path'] == 'assets/r410/mobs/m048.webp']
    if actor == 'kair-great-04':
        rects = [tuple(map(int, k.split('|')[1].split(','))) for k in floats if k.startswith('actors/v31345/guardians/great-04-atlas.webp|')]
        path = 'assets/actors/v31345/guardians/great-04-atlas.webp'
    else:
        path = ('assets/kair/enemies/' + MOBS[actor][1]) if actor in MOBS else f'assets/generated-v3125/kair-guardians/guardian_{actor[-2:]}.webp'
        rects = []
    sheet = Image.open(site / path).convert('RGBA')
    records = []
    for x, y, w, h in rects or [(0, 0, *sheet.size)]:
        bbox, body = measure(sheet.crop((x, y, x+w, y+h)))
        records.append(dict(path=path, rect=[x,y,w,h], size=list(sheet.size), bbox=bbox, body=body))
    if actor in ACTIVE_STRIPS:
        active = 'assets/'+ACTIVE_STRIPS[actor]
        strip = Image.open(site/active).convert('RGBA')
        assert strip.width % 4 == 0, active
        cw, ch = strip.width//4, strip.height
        for i in range(4):
            x = i*cw
            bbox, body = measure(strip.crop((x,0,x+cw,ch)))
            records.append(dict(path=active,rect=[x,0,cw,ch],size=list(strip.size),bbox=bbox,body=body))
    return records


def tone(strip, idle, site):
    x, y, w, h = idle['rect']
    source = Image.open(site/idle['path']).convert('RGBA').crop((x,y,x+w,y+h))
    a = np.asarray(source)
    old = np.median(a[a[...,3] > 150,:3], axis=0)
    b = np.array(strip)
    fresh = np.median(b[b[...,3] > 150,:3], axis=0)
    gain = np.clip(old/np.maximum(1, fresh), .90, 1.16)
    # Leave the brightest metallic and emissive colors in the source untouched.
    shade = np.clip((175-b[...,:3].max(axis=2).astype(float))/100, 0, 1)
    b[...,:3] = np.clip(b[...,:3]*(1+shade[...,None]*(gain-1)), 0, 255).round().astype(np.uint8)
    b[b[...,3] == 0] = 0
    return Image.fromarray(b)


def add_base_aliases(idles, actor, gait):
    ids = {actor, *(f'kair-academy-wave-{n}' for n in ACAD.get(actor, ()))}
    for name, base, rect, cell, pad, targets, tint in gait:
        if tint or not any(t.startswith('STORY:kair') and t.split(':')[-1] in ids for t in targets):
            continue
        original = next((r for r in idles if r['path'] == base and r['rect'] == rect), None)
        if original:
            width, height = cell
            idles += [{**original, 'path': f'assets/sw0014/ordinary-walk/{name}.webp',
                       'rect': [width*i, 0, width, height], 'baseRect': rect, 'pad': pad} for i in range(4)]


def signalled_direction(name):
    name = PurePosixPath(name).stem
    if name == 'claw-down':
        return 'attack'
    return next((d for rx, d in [(r'(^|-)down(8|$)', 'down'), (r'(^|-)up(8|$)', 'up'),
                                (r'(^|-)right$|(^|-)side8', 'right')] if re.search(rx, name)), None)


def read_zip(path, row):
    content = path.read_bytes()
    if len(content) != int(row['바이트']) or digest(content) != row['SHA-256']:
        raise ValueError(f'archive hash or size mismatch: {path.name}')
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        names = set()
        for info in archive.infolist():
            name = PurePosixPath(info.filename)
            if name.is_absolute() or '..' in name.parts or '\\' in info.filename or info.filename in names:
                raise ValueError(f'unsafe or duplicate entry: {path.name}')
            if info.flag_bits & 1 or (info.external_attr >> 16) & 0o170000 == 0o120000 or info.file_size > 8*1024*1024:
                raise ValueError(f'encrypted, symlink or oversized entry: {path.name}')
            if name.suffix.lower() not in {'.png', '.gif', '.json', '.md', '.txt', '.csv'}:
                raise ValueError(f'unexpected archive entry: {path.name}/{name.name}')
            names.add(info.filename)
        if sum(i.file_size for i in archive.infolist()) > 32*1024*1024:
            raise ValueError(f'oversized extracted archive: {path.name}')
        for name in sorted(names):
            direction = signalled_direction(name)
            if not name.endswith('.png') or direction is None:
                continue
            preview = next((a for a in names if PurePosixPath(a).stem == PurePosixPath(name).stem.removesuffix('_4x2') and a.endswith('.gif')), None)
            images = archive.read(name)
            durations = []
            if preview:
                with Image.open(io.BytesIO(archive.read(preview))) as gif:
                    for i in range(gif.n_frames):
                        gif.seek(i)
                        durations.append(gif.info.get('duration', 0))
            yield name, direction, images, durations


def make_strip(data, count, limit):
    with Image.open(io.BytesIO(data)) as source:
        if source.mode != 'RGBA' or source.width > 4096 or source.height > 1024:
            raise ValueError('unexpected sheet mode or size')
        edge = source.width // 4
        if source.size != (edge*4, edge*(count//4)):
            raise ValueError('unexpected sheet grid')
        frames = [source.crop(((i%4)*edge,(i//4)*edge,(i%4+1)*edge,(i//4+1)*edge)) for i in range(count)]
    if len({digest(frame.tobytes()) for frame in frames}) < count:
        raise ValueError('repeated frames')
    size = min(edge, limit)
    strip = Image.new('RGBA', (size*count, size))
    bounds, bodies = [], []
    for i, frame in enumerate(frames):
        if frame.size != (size,size):
            frame = frame.resize((size,size), Image.Resampling.LANCZOS)
        bbox, body = measure(frame)
        if bbox[0] == 0 or bbox[1] == 0 or bbox[2] == size or bbox[3] == size:
            raise ValueError('opaque contour touches cell edge')
        bounds.append(bbox)
        bodies.append(body)
        strip.paste(frame, (i*size,0))
    if max(bodies) > min(bodies)*1.35:
        raise ValueError('body height varies by more than 35 percent within a cycle')
    if max(b[3] for b in bounds)-min(b[3] for b in bounds) > size*.12:
        raise ValueError('foot baseline varies by more than 12 percent of the cell')
    return strip, size, bounds, bodies


def actor_of(row, name):
    if row['구분'] == '일반 몹':
        return next(k for k in MOBS if k in name)
    prefix = {'대수문장':'great','시간수문장':'guardian','상위시간수문장':'elite'}[row['구분']]
    return f'kair-{prefix}-{row["배우"]}'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('intake', type=Path)
    parser.add_argument('baseline_site', type=Path)
    args = parser.parse_args()
    index = list(csv.DictReader((args.intake/'index.csv').open(encoding='utf-8-sig', newline='')))
    old = load_js('move-dir-r974-data.js', '__STORYWORLD_MOVE_DIR_R974_DATA__')['enemies']
    floats = load_js('move-float-r1029-data.js', '__STORYWORLD_MOVE_FLOAT_R1029_DATA__')['arts']
    gait = json.JSONDecoder().raw_decode((CLIENT/'mob-gait-r613.js').read_text().split('/*SW0014_WALK_ROWS_START*/', 1)[1].lstrip())[0]
    assets, held, entries = [], [], {}
    DEST.mkdir(parents=True, exist_ok=True)
    for row in index:
        name = row['파일명']
        actor = actor_of(row, name)
        status = row['검수 상태']
        entries_from_archive = list(read_zip(args.intake/name, row))
        if not entries_from_archive:
            raise ValueError(f'no recognized art: {name}')
        if '대안' in status or 'R2 후면·우측 우선' in status:
            held.append({'asset':name,'reason':'conflicts with existing or superseding motion'})
            continue
        if actor in VISUAL_HOLDS:
            held.append({'asset':name,'reason':'visible armor or silhouette discontinuity across existing poses'})
            continue
        if actor not in entries:
            records = reference(args.baseline_site, actor, old, floats)
            if not records:
                raise ValueError(f'no verified base art for {actor}')
            add_base_aliases(records, actor, gait)
            entries[actor] = {'idle':records,'dirs':{}}
        for member, direction, data, durations in entries_from_archive:
            if direction == 'attack':
                held.append({'asset':name,'direction':direction,'reason':'no verified attack-phase mapping'})
                continue
            count = int(row['기본 방향별 프레임'])
            try:
                strip, cell, bounds, bodies = make_strip(data, count, 320 if 'kair-great-' in actor else 256)
            except ValueError as e:
                held.append({'asset':name,'direction':direction,'reason':str(e)})
                continue
            d = entries[actor]['dirs']
            if direction in d:
                raise ValueError(f'duplicate {actor} {direction}')
            identifier = f'{actor}-{direction}.webp'
            target = DEST / identifier
            strip = tone(strip, entries[actor]['idle'][0], args.baseline_site)
            strip.save(target, 'WEBP', quality=88, method=4, exact=False)
            path = 'assets/sw0022/'+identifier
            dat = {'path':path,'cell':cell,'n':count,'fps':8,'vis':round(float(np.median(bodies)),1),
                   'px':round(float(np.median([(b[0]+b[2])/2 for b in bounds])),1),
                   'py':round(float(np.median([b[3] for b in bounds])),1)}
            if len(durations) == count and all(40 <= t <= 300 for t in durations):
                dat['ends'] = [int(t) for t in np.cumsum(durations)]
            d[direction] = dat
            assets.append({'assetId':identifier,'actor':actor,'direction':direction,'sourceArchive':name,
                           'archiveSha256':row['SHA-256'],'sourceMember':PurePosixPath(member).name,
                           'sourceSha256':digest(data),'path':path,'size':list(strip.size),'frames':count,
                           'pivot':[dat['px'],dat['py']],'alphaBounds':bounds,'sha256':digest(target.read_bytes()),
                           'bytes':target.stat().st_size})
    entries = {k:v for k,v in entries.items() if v['dirs']}
    data_js = CLIENT/'kairo-motion-sw0022-data.js'
    mobs = {k: entries[k] for k in MOBS if k in entries}
    actors = {k:v for k,v in entries.items() if k not in MOBS}
    for name, waves in ACAD.items():
        for i in waves:
            if name in mobs:
                actors[f'kair-academy-wave-{i}'] = name
    data_js.write_text('// SW-0022 generated by scripts/sw0022-kairo-intake.py.\nwindow.__STORYWORLD_KAIRO_SW0022__='+json.dumps({'actors':actors,'mobs':mobs},separators=(',',':'))+';\n')
    report = {'source':'Dots Kaironomicon overnight motion candidates','archives':len(index),'actors':len(entries),
              'assets':assets,'held':held}
    (DEST/'index.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(f'{len(index)} verified archives, {len(entries)} model sets, {len(assets)} sheets, {len(held)} held')
    for row in held:
        print(row)


if __name__ == '__main__':
    main()
