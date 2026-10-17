#!/usr/bin/env python3
"""Apply reviewed changes to verified generated output, preserving source/media.
Pinned source and exact anchors fail closed on drift or duplicate application.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE_SHA256 = '24ecfda258afcf5a03d698f3589577e2142ee060216fa25559329430bdf32bdc'
BASE_COMMIT = '170a60140f6ae10914550a7e254bb320764b0d30'
def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
def replace_exact(text: str, old: str, new: str, count: int = 1) -> str:
    found = text.count(old)
    if found != count:
        raise RuntimeError(f'R66 source anchor mismatch: expected {count}, found {found}: {old[:140]}')
    return text.replace(old, new)
def transform(html: str, optimized: bool = True) -> str:
    if digest(html.encode()) != BASE_SHA256:
        raise RuntimeError('R66 baseline changed or overlay already applied; review before deploying')
    html = replace_exact(html, 'function attackPower(){return HEROES[player.hero].power*', 'function attackPower(){return 2*HEROES[player.hero].power*')
    html = replace_exact(html, 'const base=attackPower()*(.22+Math.min(.08,skillRank*.006))', 'const base=attackPower()*2*(.22+Math.min(.08,skillRank*.006))')
    html = replace_exact(html, 'const DANCE_CD=20,targetCooldowns=new Map();', 'const DANCE_CD=20,cooldownR66=window.__STORYWORLD_R66__.createCooldownTracker({now:()=>time,isActive:p=>window.__STORYWORLD_R66__.isEgo(p),normal:DANCE_CD,active:4});')
    html = replace_exact(html, '(targetCooldowns.get(actorKey(p))||0)', 'cooldownR66.deadline(p)', 2)
    html = replace_exact(html, '(targetCooldowns.get(actorKey(actorNow()))||0)', 'cooldownR66.deadline(actorNow())')
    html = replace_exact(html, 'targetCooldowns.set(actorKey(p),time+DANCE_CD);', 'cooldownR66.start(p);')
    html = replace_exact(html, "setHudWidthR63R2('bossHP',clamp(boss.hp/boss.maxHp*100,0,100)+'%');", "setHudWidthR63R2('bossHP',clamp(boss.hp/boss.maxHp*100,0,100)+'%');window.__STORYWORLD_R66__?.updateBossHP(boss);")
    html = replace_exact(html, '타격당 위력은 기존 공식(22% + 단계당 0.6%, 최대 30%)을 따릅니다.', '타격당 위력은 강화된 공격력의 44% + 단계당 1.2%(최대 60%)입니다. 공통 쿨타임은 일반 20초, EGO 상태 4초이며 모든 모티프에 적용됩니다.')
    if optimized:
        html = replace_exact(html, 'function validTargets(range=11){return liveEnemies().filter(e=>e&&e.hp>0&&!e.deadRecorded&&distance(actorNow(),e)<=range).sort((a,b)=>distance(actorNow(),a)-distance(actorNow(),b));}', 'function validTargets(range=11){return window.__STORYWORLD_R66__.selectTargets(liveEnemies(),actorNow(),range,distance);}function hasTargetsR66(range){return window.__STORYWORLD_R66__.hasTargets(liveEnemies(),actorNow(),range,distance);}')
        html = replace_exact(html, 'if(validTargets(12).length){', 'if(hasTargetsR66(12)){')
        html = replace_exact(html, 'function autoCast(){const p=actorNow();if(!available(p)||!validTargets(11).length)return false;return cast(false);}', 'function autoCast(){const p=actorNow();if(!available(p))return false;return cast(false);}')
    helper = (ROOT / 'client-source/review-r66.js').read_text(encoding='utf-8')
    if '</script' in helper.lower():
        raise RuntimeError('Unsafe inline script terminator')
    html = replace_exact(html, '<script id="campaign-combat-r63r1">', '<script id="review-r66">\n' + helper + '\n</script>\n<script id="campaign-combat-r63r1">')
    if 'targetCooldowns' in html:
        raise RuntimeError('Unconverted cooldown reference')
    return html

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, required=True)
    parser.add_argument('--without-optimization', action='store_true')
    args = parser.parse_args()
    site = args.site.resolve()
    if site == (ROOT / 'docs').resolve():
        raise RuntimeError('Do not rewrite pinned input docs in place')
    index, manifest_path = site / 'index.html', site / 'web-manifest-r62.json'
    original = index.read_bytes()
    if digest(original) != BASE_SHA256:
        raise RuntimeError('Unexpected input HTML')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest['webHTMLSha256'] != BASE_SHA256:
        raise RuntimeError('Input manifest does not match reviewed baseline')
    modified = transform(original.decode('utf-8'), optimized=not args.without_optimization).encode('utf-8')
    edits = {'index.html': (original, modified)}
    if not args.without_optimization:
        module = site / 'dist/phase1.js'
        native = module.read_bytes()
        if native != (ROOT / 'docs/dist/phase1.js').read_bytes():
            raise RuntimeError('Generated renderer differs from reviewed renderer source')
        spec = importlib.util.spec_from_file_location('r66render', ROOT / 'scripts/render-r66.py')
        optimizer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(optimizer)
        edits['dist/phase1.js'] = (native, optimizer.transform(native.decode()).encode())
    for filename, (before, after) in edits.items():
        rows = [row for row in manifest['files'] if row['path'] == filename]
        if len(rows) != 1 or rows[0]['sha256'] != digest(before) or rows[0]['bytes'] != len(before):
            raise RuntimeError(f'Input manifest entry mismatch: {filename}')
        rows[0].update(bytes=len(after), sha256=digest(after))
    manifest['totalBytes'] = sum(row['bytes'] for row in manifest['files'])
    manifest['webHTMLSha256'] = digest(modified)
    manifest['sourceHTMLSha256'] = BASE_SHA256
    manifest['r66'] = {'revision':'R66-EGO-PERF','baselineCommit':BASE_COMMIT,'optimized':not args.without_optimization,'playerBaseDamage':2,'threadDamage':2,'cooldown':{'normal':20,'ego':4},'mediaChanged':False,'changedFiles':list(edits)}
    for filename, (_, after) in edits.items():
        (site / filename).write_bytes(after)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status':'R66_OVERLAY_APPLIED','htmlSHA256':digest(modified),'htmlBytes':len(modified),'optimized':not args.without_optimization,'fileCount':len(manifest['files']),'changedFiles':list(edits)}))
if __name__ == '__main__':
    main()
