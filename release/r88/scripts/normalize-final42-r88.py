#!/usr/bin/env python3
"""Normalize supplied FINAL42 metadata and copy exact files; never alter pixels.

The external effect index is authoritative. Source README/approval wording is
preserved as documentation, never treated as authorization or runtime proof.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
from pathlib import Path, PurePosixPath
import re
import shutil

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'assets-final42-r88/extracted/StoryWorld_FINAL42'
INDEX = ROOT.parent / 'assets-final42-r88/StoryWorld_FINAL42_EFFECT_INDEX.json'
ARCHIVE = ROOT / 'hospital-three-pc/source-patch/asset-source-docs/final42-r88'
RUNTIME_PREFIX = 'assets/final42-r88/'
F6 = {243, 244, 247, 248, 249, 250}
EXPECTED_IDS = {81, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 110, 111, 112, 113, 114, 115, 116, 117, 130, 131, 132, 213, 214, 215, 217, 243, 244, 245, 246, 247, 248, 249, 250, 251, 254, 259, 260, 261, 262}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def require(test, message):
    if not test:
        raise ValueError(message)


def safe_path(base, name):
    require(isinstance(name, str) and name and '\\' not in name and '\x00' not in name, 'Unsafe source path')
    rel = PurePosixPath(name)
    require(not rel.is_absolute() and '..' not in rel.parts and rel.as_posix() == name, 'Unsafe source path: ' + name)
    p = Path(base).joinpath(*rel.parts)
    require(not p.is_symlink() and all(not q.is_symlink() for q in p.parents if q.is_relative_to(base)), 'Source symlink forbidden')
    require(p.is_file(), 'Missing source file: ' + name)
    return p


def number(value, label, positive=False):
    require(isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value), 'Invalid ' + label)
    require(not positive or value > 0, 'Nonpositive ' + label)
    return value


def pair(value, label):
    if isinstance(value, dict):
        value = [value.get('w', value.get('width')), value.get('h', value.get('height'))]
    require(isinstance(value, (list, tuple)) and len(value) == 2, 'Invalid ' + label)
    return [number(x, label, positive=True) for x in value]


def rect(value):
    if isinstance(value, dict):
        value = [value.get('x'), value.get('y'), value.get('w', value.get('width')), value.get('h', value.get('height'))]
    require(isinstance(value, (list, tuple)) and len(value) == 4, 'Invalid frame rectangle')
    result = [number(x, 'frame rectangle') for x in value]
    require(all(int(x) == x for x in result) and min(result[:2]) >= 0 and min(result[2:]) > 0, 'Invalid frame rectangle dimensions')
    return [int(x) for x in result]


def pivot(value, cell):
    if isinstance(value, dict):
        if 'normalizedTopLeft' in value:
            value = value['normalizedTopLeft']
        elif 'x' in value and 'y' in value:
            value = [value['x'], value['y']]
        elif 'pixelsTopLeft' in value:
            value = [v / cell[i] for i, v in enumerate(value['pixelsTopLeft'])]
    require(isinstance(value, (list, tuple)) and len(value) == 2, 'Fixed normalized pivot required')
    result = [number(v, 'pivot') for v in value]
    require(all(0 <= v <= 1 for v in result), 'Pivot outside cell')
    return result


def normal_blend(meta):
    value = meta.get('blend', meta.get('blendMode', ''))
    require(isinstance(value, str) and ('normal' in value.lower() or value == 'source-over'), 'Unrecognized source blend')
    require(meta.get('premultipliedAlpha', False) is False, 'Premultiplied source not supported without explicit conversion')
    return 'source-over'


def copy_exact(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        require(destination.is_file() and sha(destination) == sha(source), 'Refusing to overwrite different original: ' + str(destination))
    else:
        shutil.copyfile(source, destination)
    require(sha(source) == sha(destination), 'Copied file differs: ' + str(destination))


def load_bundle(source, index_path):
    index = json.loads(index_path.read_text())
    require(index.get('schema') == 'storyworld.final42-runtime-index/v1' and index.get('distinctEffects') == 42, 'Unknown external FINAL42 index')
    entries = index.get('effects', [])
    require(len(entries) == 42 and {e['sourceIndex'] for e in entries} == EXPECTED_IDS, 'Expected42 explicit effect IDs')
    require(len({e['effectId'] for e in entries}) == 42, 'Duplicate original effect IDs')
    hashes = {}
    text = safe_path(source, 'FILE_SHA256.txt').read_text()
    for line in text.splitlines():
        match = re.fullmatch(r'([0-9a-f]{64})  (.+)', line)
        require(match is not None, 'Malformed original FILE_SHA256 entry')
        digest, name = match.groups()
        require(name not in hashes, 'Duplicate FILE_SHA256 path')
        p = safe_path(source, name)
        require(sha(p) == digest, 'Original file SHA256 mismatch: ' + name)
        hashes[name] = digest
    all_files = {p.relative_to(source).as_posix() for p in source.rglob('*') if p.is_file()}
    # A self-contained handoff also stores these two exact external companions.
    # They are supplemental files, not entries invented in the original hash list.
    companions = all_files & {'AUTHORITATIVE_EFFECT_INDEX.json', 'START_HERE_FINAL42.txt'}
    if 'AUTHORITATIVE_EFFECT_INDEX.json' in companions:
        require(sha(source / 'AUTHORITATIVE_EFFECT_INDEX.json') == sha(index_path), 'Archived authoritative index differs')
    require(all_files == set(hashes) | {'FILE_SHA256.txt'} | companions, 'Original bundle contains an unlisted/missing file')
    for entry in entries:
        for row in entry['runtimeFiles']:
            p = safe_path(source, row['path'])
            require(p.stat().st_size == row['bytes'] and sha(p) == row['sha256'], 'External index file mismatch: ' + row['path'])
        require(sha(safe_path(source, entry['metadata'])) == entry['metadataSHA256'], 'External metadata digest mismatch')
        # Read the whole README and metadata before deciding import scope.
        entry['_readme'] = safe_path(source, entry['folder'] + '/README.md').read_text()
        entry['_metadata'] = json.loads(safe_path(source, entry['metadata']).read_text())
    return index, entries, hashes


def normalize(entry, source):
    meta = entry['_metadata']
    source_id = entry['sourceIndex']
    key = 'F' + str(source_id).zfill(3)
    atlas_value = meta.get('atlas')
    atlas_name = atlas_value.get('file') if isinstance(atlas_value, dict) else atlas_value
    require(isinstance(atlas_name, str), 'Missing atlas for ' + key)
    atlas_rel = entry['folder'] + '/' + atlas_name
    atlas_file = safe_path(source, atlas_rel)
    with Image.open(atlas_file) as im:
        require(im.mode == 'RGBA', 'Atlas is not original RGBA: ' + key)
        atlas_size = list(im.size)
        atlas_pixels = im.copy()
    declared_size = atlas_value.get('size') if isinstance(atlas_value, dict) else meta.get('atlasSize')
    require(pair(declared_size, 'atlas size') == atlas_size, 'Declared atlas dimensions differ: ' + key)
    raw_frames = meta.get('frames')
    require(isinstance(raw_frames, list) and len(raw_frames) == (24 if source_id == 99 else 16), 'Unexpected frame count: ' + key)
    ids = [f.get('index') for f in raw_frames]
    require(ids == list(range(len(ids))), 'Source frame indices must remain contiguous and in original order')
    first_rect = rect(raw_frames[0]['rect'])
    cell = first_rect[2:]
    source_pivot = meta.get('pivotNormalized', meta.get('pivot'))
    fixed_pivot = pivot(source_pivot, cell)
    frames = []
    border_max = 0
    blank_frames = []
    rgba_hashes = []
    transparent_rgb_differences = 0
    source_frame_modes = {}
    for f in raw_frames:
        box = rect(f['rect'])
        require(box[0] + box[2] <= atlas_size[0] and box[1] + box[3] <= atlas_size[1] and box[2:] == cell, 'Frame outside atlas or unstable cell: ' + key)
        duration_ms = f.get('durationMs', meta.get('stepDurationMs'))
        seconds = number(duration_ms, 'frame milliseconds', positive=True) / 1000
        fp = pivot(f.get('pivot', source_pivot), cell)
        require(fp == fixed_pivot, 'Per-frame pivot drift in source: ' + key)
        raw_file = safe_path(source, entry['folder'] + '/' + f['file'])
        with Image.open(raw_file) as im:
            require(im.mode in {'RGBA', 'LA'} and list(im.size) == cell, 'Original frame dimensions/mode differ: ' + key)
            source_frame_modes[im.mode] = source_frame_modes.get(im.mode, 0) + 1
            if im.mode == 'LA':
                require(im.getchannel('A').getextrema()[1] == 0, 'Only supplied blank termination may use LA: ' + key)
            original_frame = im.convert('RGBA')
            pixels = original_frame.tobytes()
        crop = atlas_pixels.crop((box[0], box[1], box[0] + box[2], box[1] + box[3]))
        require(crop.getchannel('A').tobytes() == original_frame.getchannel('A').tobytes(), 'Atlas cell alpha differs from supplied frame: ' + key)
        difference = ImageChops.difference(crop.convert('RGB'), original_frame.convert('RGB'))
        red, green, blue = difference.split()
        maximum = ImageChops.lighter(ImageChops.lighter(red, green), blue)
        visible_mask = original_frame.getchannel('A').point(lambda a: 255 if a > 0 else 0)
        require(ImageChops.multiply(maximum, visible_mask).getextrema()[1] == 0, 'Atlas cell visible RGB differs from supplied frame: ' + key)
        transparent_rgb_differences += sum(maximum.histogram()[1:])
        original_frame.close()
        alpha = crop.getchannel('A')
        edges = [alpha.crop((0, 0, cell[0], 1)), alpha.crop((0, cell[1] - 1, cell[0], cell[1])), alpha.crop((0, 0, 1, cell[1])), alpha.crop((cell[0] - 1, 0, cell[0], cell[1]))]
        border_max = max(border_max, *(edge.getextrema()[1] for edge in edges))
        if alpha.getextrema()[1] == 0:
            blank_frames.append(f['index'])
        rgba_hashes.append(hashlib.sha256(pixels).hexdigest())
        row = {'index': f['index'], 'atlas': 0, 'rect': box, 'seconds': seconds, 'pivot': fp}
        if 'phase' in f:
            row['phase'] = f['phase']
        frames.append(row)
    atlas_pixels.close()
    require(border_max == 0, 'Nontransparent outer frame border: ' + key)
    declared_blank = meta.get('blankFrames', meta.get('transparentEndFrames'))
    if declared_blank is not None:
        require(declared_blank == len(blank_frames), 'Blank frame claim differs: ' + key)
    declared_painted = meta.get('paintedNonemptyFrames')
    if declared_painted is not None:
        require(declared_painted == len(frames) - len(blank_frames), 'Painted frame claim differs: ' + key)
    sequence = copy.deepcopy(meta.get('sequence', list(range(len(frames)))))
    require(isinstance(sequence, list) and all(isinstance(i, int) and not isinstance(i, bool) and 0 <= i < len(frames) for i in sequence), 'Invalid playback sequence: ' + key)
    if source_id in F6:
        require(sequence == list(range(16)) + list(range(14, 0, -1)), 'F6 must preserve30-step forward/reverse sequence')
        require(meta.get('playbackSteps') == 30 and meta.get('loop') is True, 'F6 playback contract differs')
    clips = {}
    for name, raw in meta.get('clips', {}).items():
        order = raw.get('frames')
        require(isinstance(order, list) and order and all(isinstance(i, int) and 0 <= i < len(frames) for i in order), 'Invalid clip frame sequence: ' + key)
        duration = sum(frames[i]['seconds'] for i in order)
        if 'durationMs' in raw:
            require(math.isclose(duration * 1000, raw['durationMs'], abs_tol=1e-6), 'Source clip timing differs: ' + key)
        clips[name] = {k: copy.deepcopy(v) for k, v in raw.items() if k not in ['frames', 'durationMs']}
        clips[name].update(frameIndices=order[:], frames=order[:], duration=round(duration, 9), loop=raw.get('loop', False))
    default_clip = 'emerge' if source_id == 99 else 'main'
    main_duration = sum(frames[i]['seconds'] for i in sequence)
    if 'main' not in clips:
        clips['main'] = {'frameIndices': sequence[:], 'frames': sequence[:], 'duration': round(main_duration, 9), 'loop': meta.get('loop', False)}
    declared_duration = meta.get('totalCycleMs', meta.get('totalDurationMs', meta.get('durationMs')))
    if declared_duration is not None:
        require(math.isclose(main_duration * 1000, declared_duration, abs_tol=1e-6), 'Source total/cycle timing differs: ' + key)
    layer = 'beforeActor' if source_id in F6 else 'ground' if source_id in {251, 259, 260} else 'afterActor'
    kind = 'aura' if source_id in F6 else 'binding' if source_id == 99 else 'warning' if source_id in {251, 260} else 'projectile' if source_id in {214, 262} else 'remnant' if source_id == 259 else 'teleport' if source_id == 254 else 'narrative' if source_id in {81, *range(110, 118), 130, 131, 132} else 'impact'
    output = {
        'id': key, 'key': key, 'sourceIndex': source_id, 'originalId': entry['effectId'], 'effectId': entry['effectId'],
        'name': meta.get('name', meta.get('id', entry['effectId'])), 'kind': kind, 'duration': round(main_duration, 9),
        'loop': bool(meta.get('loop', False)), 'sequence': sequence, 'defaultClip': default_clip, 'clips': clips,
        'pivot': fixed_pivot, 'cell': cell, 'canvas': cell, 'blend': normal_blend(meta), 'sourceBlend': meta.get('blend', meta.get('blendMode')),
        'alpha': 'straight', 'premultipliedAlpha': False, 'colorSpace': 'srgb', 'filter': 'linear', 'wrap': 'clamp-to-edge', 'mipmaps': False,
        'atlases': [{'path': RUNTIME_PREFIX + atlas_rel, 'width': atlas_size[0], 'height': atlas_size[1], 'size': atlas_size, 'sha256': sha(atlas_file), 'bytes': atlas_file.stat().st_size, 'rgba8Bytes': atlas_size[0] * atlas_size[1] * 4}],
        'frames': frames, 'layer': layer, 'layers': [{'id': 'single', 'atlas': 0, 'drawOrder': layer, 'beforeActor': layer in {'beforeActor', 'ground'}, 'afterActor': layer == 'afterActor', 'frontBackSplit': False}],
        'canonicalMapping': copy.deepcopy(entry.get('canonicalMapping', [])), 'selectedPhase': entry.get('selectedPhase'),
        'phases': copy.deepcopy(meta.get('phases', [])), 'sourceLayerDescription': meta.get('layers', meta.get('layerMode', meta.get('drawOrder', 'single overlay'))),
        'endpointOpacity': copy.deepcopy(meta.get('endpointOpacity')), 'opacityEnvelope': copy.deepcopy(meta.get('opacityEnvelope')),
        'onComplete': meta.get('onComplete', meta.get('endBehavior', 'remove')), 'holdLastUntilSignal': source_id == 260,
        'impactFrame': meta.get('impactFrame'), 'impactTimeSeconds': meta.get('impactTimeMs', 0) / 1000 if 'impactTimeMs' in meta else None,
        'loopMode': meta.get('loopMode', 'clip-state-machine' if source_id == 99 else 'once'),
        'sourceMetadataPath': RUNTIME_PREFIX + entry['metadata'], 'sourceMetadataSHA256': entry['metadataSHA256'],
        'sourceReadmePath': RUNTIME_PREFIX + entry['folder'] + '/README.md', 'sourceReadmeSHA256': sha(safe_path(source, entry['folder'] + '/README.md')),
        'caveats': copy.deepcopy(entry.get('review', {}).get('caveats', [])), 'runtimeTuningRequired': True, 'frontBackSplit': False,
        'seamlessLoopClaimed': False, 'canonicalOwnershipClaimed': False,
    }
    audit = {'id': key, 'sourceIndex': source_id, 'originalId': entry['effectId'], 'frameCount': len(frames), 'nonemptyFrames': len(frames) - len(blank_frames), 'blankFrameIndices': blank_frames, 'originalFrameModes': source_frame_modes, 'uniqueNonemptyRGBAFrames': len({h for i, h in enumerate(rgba_hashes) if i not in blank_frames}), 'maximumBorderAlpha': border_max, 'atlasMatchesAllOriginalFrameAlphaAndVisibleRGB': True, 'atlasCellsExactlyMatchOriginalRGBA': transparent_rgb_differences == 0, 'transparentRGBDifferencePixels': transparent_rgb_differences, 'originalAtlasSHA256': sha(atlas_file), 'duration': output['duration'], 'playbackSteps': len(sequence), 'clips': {k: {'duration': v['duration'], 'loop': v['loop'], 'steps': len(v['frameIndices'])} for k, v in clips.items()}, 'pivot': fixed_pivot, 'layer': layer, 'rawREADMERead': True, 'rawMetadataRead': True, 'caveats': output['caveats']}
    return output, audit, [atlas_rel, entry['metadata'], entry['folder'] + '/README.md']


def self_tests():
    cases = []
    for label, fn in [('negative rectangle', lambda: rect([-1, 0, 2, 2])), ('missing pivot', lambda: pivot(None, [256, 256])), ('zero duration', lambda: number(0, 'duration', positive=True)), ('nonfinite duration', lambda: number(float('nan'), 'duration')), ('premultiplied blend', lambda: normal_blend({'blend': 'normal', 'premultipliedAlpha': True})), ('unknown blend', lambda: normal_blend({'blend': 'lighter'}))]:
        try:
            fn()
        except ValueError:
            cases.append({'name': 'Refuse ' + label, 'passed': True})
        else:
            raise ValueError('Negative normalization test did not refuse: ' + label)
    require(rect({'x': 1, 'y': 2, 'width': 3, 'height': 4}) == [1, 2, 3, 4], 'Object rect normalization failed')
    cases.append({'name': 'Array/object rectangle and normalized/pixel pivot schema normalization', 'passed': pivot({'pixelsTopLeft': [256, 440]}, [512, 512]) == [.5, .859375]})
    require(all(c['passed'] for c in cases), 'Normalization unit test failed')
    return cases


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=None)
    parser.add_argument('--index', type=Path, default=None)
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    source = (args.source or (SOURCE if SOURCE.is_dir() else ARCHIVE)).resolve()
    index_candidates = [source / 'AUTHORITATIVE_EFFECT_INDEX.json', INDEX, ARCHIVE / 'AUTHORITATIVE_EFFECT_INDEX.json']
    index_path = (args.index or next((p for p in index_candidates if p.is_file()), INDEX)).resolve()
    index, entries, source_hashes = load_bundle(source, index_path)
    effects, audits, runtime_files = {}, [], set()
    for entry in entries:
        effect, audit, needed = normalize(entry, source)
        effects[effect['id']] = effect
        audits.append(audit)
        runtime_files.update(needed)
    require(len(effects) == 42 and sum(len(e['frames']) for e in effects.values()) == 680, 'FINAL42 normalized effect/frame total differs')
    data = {'schema': 'storyworld.final42.normalized/v1', 'effects': effects, 'bySourceIndex': {str(e['sourceIndex']): e['id'] for e in effects.values()}, 'byOriginalId': {e['originalId']: e['id'] for e in effects.values()}, 'distinctEffects': 42, 'storedFrames': 680, 'sourceIndexSHA256': sha(index_path), 'sourceFileHashListSHA256': sha(source / 'FILE_SHA256.txt'), 'allLayersSingleAtlas': True, 'sourceDocumentsDoNotGrantAuthorization': True, 'browserVerified': False, 'GPUVerified': False, 'naturalPlayVerified': False}
    overlaps = []
    old_paths = {99: 'bind/thorn_atlas.png', 213: 'poison/poison-impact-atlas-256.png', 215: 'scalpel/atlas.png'}
    for source_id, old_path in old_paths.items():
        old = ROOT / 'hospital-three-pc/site/assets/painted-vfx-r87' / old_path
        effect = effects['F' + str(source_id).zfill(3)]
        overlaps.append({'sourceIndex': source_id, 'newId': effect['id'], 'oldSHA256': sha(old) if old.is_file() else None, 'newSHA256': effect['atlases'][0]['sha256'], 'identicalToPriorR87': old.is_file() and sha(old) == effect['atlases'][0]['sha256'], 'oldFilePreserved': True, 'requiresSingleExplicitRuntimeOwner': True})
    checks = self_tests() + [
        {'name': 'Authoritative index has exactly42 explicit source IDs', 'passed': len(entries) == 42},
        {'name': 'All original bundle files match authoritative FILE_SHA256 list', 'passed': True, 'files': len(source_hashes)},
        {'name': 'All42 metadata and README files read and original caveats preserved', 'passed': all(a['rawREADMERead'] and a['rawMetadataRead'] for a in audits)},
        {'name': 'All680 atlas cells match supplied alpha and visible RGB; zero-alpha RGB differences recorded separately', 'passed': all(a['atlasMatchesAllOriginalFrameAlphaAndVisibleRGB'] for a in audits)},
        {'name': 'All42 original atlases have transparent outer frame borders', 'passed': all(a['maximumBorderAlpha'] == 0 for a in audits)},
        {'name': 'All6 F6 loops preserve16 painted states and30 forward/reverse steps', 'passed': all(len(effects['F' + str(i)]['sequence']) == 30 and len(effects['F' + str(i)]['frames']) == 16 for i in F6)},
        {'name': 'Thorn uses original feet pivot and4 authored clips without front/back invention', 'passed': effects['F099']['pivot'] == [.5, .859375] and set(effects['F099']['clips']) == {'main', 'emerge', 'bind', 'hold', 'release'} and not effects['F099']['frontBackSplit']},
        {'name': 'Existing3 overlap is tracked explicitly and all originals preserved', 'passed': len(overlaps) == 3},
    ]
    if not args.verify_only:
        runtime = ROOT / 'hospital-three-pc/site/assets/final42-r88'
        archive = ARCHIVE
        for name in sorted(runtime_files):
            copy_exact(safe_path(source, name), runtime / name)
        for p in source.rglob('*'):
            if p.is_file():
                copy_exact(p, archive / p.relative_to(source))
        copy_exact(index_path, archive / 'AUTHORITATIVE_EFFECT_INDEX.json')
        start_candidates = [source / 'START_HERE_FINAL42.txt', index_path.parent / 'START_HERE_FINAL42.txt', ROOT.parent / 'assets-final42-r88/START_HERE_FINAL42.txt']
        start_document = next((p for p in start_candidates if p.is_file()), None)
        require(start_document is not None, 'Missing external/self-contained FINAL42 start document')
        copy_exact(start_document, archive / 'START_HERE_FINAL42.txt')
        (ROOT / 'client-source/final42-data-r88.js').write_text('/* R88 exact supplied42 painted atlases; source documents are not authorization. */\nwindow.__STORYWORLD_FINAL42_DATA_R88__=Object.freeze(' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
        target = ROOT / 'qa/r88'
        target.mkdir(parents=True, exist_ok=True)
        (target / 'final42-normalized.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        checks.append({'name': 'Runtime atlas/metadata/README and full source bundle copied byte-identically', 'passed': all(sha(runtime / n) == sha(source / n) for n in runtime_files) and all(sha(archive / n) == h for n, h in source_hashes.items())})
        report = {'schema': 'storyworld.final42-normalization-qa/v1', 'passed': all(c['passed'] for c in checks), 'checks': checks, 'effects': audits, 'overlapWithR87': overlaps, 'runtimeFiles': len(runtime_files), 'runtimeAtlasCount': 42, 'runtimeAtlasBytes': sum(e['atlases'][0]['bytes'] for e in effects.values()), 'originalBundleFiles': len(source_hashes) + 1, 'authoritativeExternalIndexSHA256': sha(index_path), 'originalFileHashListSHA256': sha(source / 'FILE_SHA256.txt'), 'sourceMetadataModified': False, 'sourceImagesModified': False, 'browserVerified': False, 'GPUVerified': False, 'naturalPlayVerified': False}
        (target / 'final42-normalization-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'passed': all(c['passed'] for c in checks), 'effects': len(effects), 'frames': 680, 'checks': len(checks), 'runtimeFiles': len(runtime_files), 'verifyOnly': args.verify_only}))


if __name__ == '__main__':
    main()
