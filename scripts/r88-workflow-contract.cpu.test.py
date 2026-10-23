#!/usr/bin/env python3
"""Check the real workflow, historical proof boundaries and exact R88 release path.

These are source-contract checks. They do not claim a GitHub Actions run or
browser execution. Historical gates execute their actual approved source;
new R88 checks execute the current SHA with the real event context.
"""
import ast
import hashlib
import json
from pathlib import Path
import re
import subprocess

HISTORICAL = 'f81d0d78af5bce04532b948a3cee36aa4fd4d5b8'
UNSET = 'unset GITHUB_SHA GITHUB_EVENT_NAME GITHUB_EVENT_PATH GITHUB_REF'
HISTORICAL_NOTE = '# Historical release proof: run the unchanged gates at their actual pinned checkout.'
CURRENT_CHECKOUT = '      - name: Checkout current R88 candidate independently of historical gates\n'
PUBLIC_ATLAS_HASHES = {'assets/final42-r88/effects/081/atlas.png': 'ed025216a01f487748cfe44ca5bac2fb9e5a9d467f651b38244f64aff3dcfa52', 'assets/final42-r88/effects/090/atlas.png': 'ff8c4d753eab30af940855037c9ae09c3befe1da587f777e62efe3446b2f83fb', 'assets/final42-r88/effects/091/atlas.png': 'bd69fd85fa386e6c4257614fe06e0feeb4bf8a659e758922cf6d83f463df6f70', 'assets/final42-r88/effects/092/atlas.png': '0bfbb7adb05e51a9121fe44825f908b5961b739ca868854ccf023a804f3bcfc0', 'assets/final42-r88/effects/093/atlas.png': 'eed87d6df5aa7508c53887b00403cece05384112d43ecc98d453d01dbf67bfac', 'assets/final42-r88/effects/094/atlas.png': '129fd0b5324f6b23cedd0c05e056fa3a5e2c317c7906d01fa584c39bbf8c10d2', 'assets/final42-r88/effects/095/atlas.png': '551ece3b64b1630369a8e1a2b561f852b05c1402323434edffa949ac8fb83f19', 'assets/final42-r88/effects/096/atlas.png': 'ea2db98e2aaf17d1056f5bfd9fe66ea5605d0b7737dc36faf686934858b96db3', 'assets/final42-r88/effects/097/atlas.png': '6c8c86944ea25edc9f6ca7b9c5ab753597c7a336879f9cd1638f92a5974b35f0', 'assets/final42-r88/effects/098/atlas.png': '59716e431536a9358701e3b4c352593cb906ad3cf448e01749fb73eac4167527', 'assets/final42-r88/effects/099/thorn_atlas.png': '19cfdb767b3c45b226a8b787a1dbb209d4c29d4aa4ea46a018a6003eae87e6c6', 'assets/final42-r88/effects/100/atlas.png': 'df93a927945b7940aacae685bf5219d661cdb50d19ca31ba3e67ef4adf28ca26', 'assets/final42-r88/effects/101/atlas.png': '029e2aab69def89cbaf05a765d476c565983db2b835e0e01e340db4b22c05ada', 'assets/final42-r88/effects/110/atlas.png': '96edb671ee0e9ee9e8771035bbb98303a3c5cbded86926c559ce0478fea46832', 'assets/final42-r88/effects/111/atlas.png': 'd9b98df621a1db35c23f8ce873f7b941629be13eb670a7b5bdccc651dfeca457', 'assets/final42-r88/effects/112/atlas.png': 'f540a81190e80b2d8cf88fc9a721456fe7616b0ae01ddbf514346b399dc7f1db', 'assets/final42-r88/effects/113/atlas.png': 'adcf3ed73ec7bf2278e2706a28f8d8bf555700368720874f422093de49aad595', 'assets/final42-r88/effects/114/atlas.png': '901cce6d81792d5d7dc17259b0311735d866ae409ca54a6ced67bbb1e159bb17', 'assets/final42-r88/effects/115/atlas.png': '809e4568c6ceb749ea6940a0ea3d12842a15fc9f145957d66d775c3e17f2c199', 'assets/final42-r88/effects/116/atlas.png': 'dccaa0cc2a5a87ed9b082da91cae3b2070f2b6faf05553361ea60b3a58597059', 'assets/final42-r88/effects/117/atlas.png': '4bc39656227686918cf85bfd3d0b8a4d9bd78a5cc0a27bfc5e5f9ab11767f9d3', 'assets/final42-r88/effects/130/atlas.png': '8e2d08b24b6f4ea96b8c6c7a7b4329ed6b343af14896bb604709598e39730ecb', 'assets/final42-r88/effects/131/atlas.png': '7f6a19acb32b36e6b56fdc09add28c26a09275730f7b1b5c0919ef7480533a04', 'assets/final42-r88/effects/132/atlas.png': '33c17637122e1440a605c6dddbf41e6400a59fbd0929c996e9b765324c79cc49', 'assets/final42-r88/effects/213/poison-impact-atlas-256.png': 'a9a7a8a30ce72200e25f59d5b62a28a74f897c916f3c6f3e517db60ed830d376', 'assets/final42-r88/effects/214/atlas.png': 'ce2cb748f32e0e2974e2b6df279a9367a6984067442ae2df14582ffd20d2e1d8', 'assets/final42-r88/effects/215/atlas.png': '346c7b644dc9da3d1ece6acca06c06b24e019da73b190c130ba43efd87a9b7f8', 'assets/final42-r88/effects/217/atlas.png': 'b0dc819aee60a482257d7e56489fb96e865dee0b6b22cc4d418de92e21610022', 'assets/final42-r88/effects/243/atlas.png': 'f418e1403049a347938175f6c3f2f9b83e1f7ae032c541d1d2d7030b07273d4c', 'assets/final42-r88/effects/244/atlas.png': 'a9adc1b391bebb676dbc62468c11060efb92d64316412a5fb5f297ade5acef68', 'assets/final42-r88/effects/245/atlas.png': '137dcc2e85f5da6caa7bc95b08775bf4415a091a9ac91c88c4f73fd95fa7d0bd', 'assets/final42-r88/effects/246/atlas.png': '1ef9838c862112d169815970d47593ddd39e40e392aa6d41207dea06f3aaaf96', 'assets/final42-r88/effects/247/atlas.png': '271d3ebf9cd9e35d937cd34900ef4693722967b150a5f03d2c8a254d8660cbb0', 'assets/final42-r88/effects/248/atlas.png': 'faf8eb894c39b6b9f44a2551315c5461f90cdc663cf303b6b80963d7368a356c', 'assets/final42-r88/effects/249/atlas.png': '9798bc08f062d5bcbda04c49cd067c94290d37bd6c05a92a81fd8a5f5ce5950f', 'assets/final42-r88/effects/250/atlas.png': '66ca90e9415f877ecf204b9b57062c5687445d45c343943b59c8aba1cd8c2410', 'assets/final42-r88/effects/251/atlas.png': 'f59667f333e93463a6b26c4d091005302d2923db08d0879b290c7f622ead72de', 'assets/final42-r88/effects/254/atlas.png': '30a6b51d13cdcecf64df2cd5d3ad99bd2c1ff7bee40489b170809f877600971f', 'assets/final42-r88/effects/259/atlas.png': 'e6ff32abedd6eabf3c94fee3fbe4f0dc2fc2c40910cff9931a33b936b0af1d98', 'assets/final42-r88/effects/260/atlas.png': '6b5a416feed31ff38d5e31c0c3b54f90e2803b925265ab13faef709ed065bfe5', 'assets/final42-r88/effects/261/atlas.png': '018e4e692d201a69730424b4d820e5d58f772b513cd09504b30519761900374a', 'assets/final42-r88/effects/262/atlas.png': '507c8c3dd2a0f3615b733e441dcf976c0d8cf88a3a96c572a4408db18a353e2d'}
MAIN_ONLY = "github.event_name != 'pull_request' && github.ref == 'refs/heads/main'"
ROOT = Path(__file__).resolve().parents[1]


def job_block(workflow, name):
    match = re.search(r'^  ' + re.escape(name) + r':\n[\s\S]*?(?=^  [\w-]+:\n|\Z)', workflow, re.M)
    assert match, 'Required job missing: ' + name
    return match.group(0)


def run_bodies(block):
    lines = block.splitlines()
    bodies = []
    for i, line in enumerate(lines):
        match = re.fullmatch(r'        run: (.*)', line)
        if not match:
            continue
        value = match.group(1)
        if value == '|':
            body = []
            for child in lines[i + 1:]:
                if child and not child.startswith('          '):
                    break
                body.append(child[10:] if child.startswith('          ') else '')
            bodies.append('\n'.join(body).rstrip())
        else:
            bodies.append(value)
    return bodies


def checkout_blocks(block):
    return re.findall(r'^      (?:- |  )uses: actions/checkout@v6\n[\s\S]*?(?=^      -|\Z)', block, re.M)


def validate_workflow(current, original):
    cases = []

    def check(name, ok):
        assert ok, name
        cases.append({'name': name, 'passed': True})

    check('Original event triggers, top-level permissions and concurrency remain exact',
          current.split('jobs:', 1)[0] == original.split('jobs:', 1)[0])
    job_names = lambda value: re.findall(r'^  ([\w-]+):$', value.split('jobs:', 1)[1], re.M)
    check('All original jobs remain in the same dependency graph', job_names(current) == job_names(original))
    for name in job_names(original):
        before, after = job_block(original, name), job_block(current, name)
        permissions = lambda value: re.findall(r'^    permissions:\n(?:^      .*\n)*', value, re.M)
        check(name + ' job permissions remain unchanged', permissions(before) == permissions(after))
        needs = lambda value: re.findall(r'^    needs:.*$', value, re.M)
        check(name + ' original needs remain unchanged', needs(before) == needs(after))
    check('Exactly three original main-only configure/upload/deploy restrictions remain',
          current.count(MAIN_ONLY) == original.count(MAIN_ONLY) == 3)
    release, deploy = job_block(current, 'release'), job_block(current, 'deploy')
    check('Release and deploy retain main-only protected operations', MAIN_ONLY in release and MAIN_ONLY in deploy)
    check('R88 release has enough time for fresh CPU/browser evidence', '    timeout-minutes: 60\n' in release)

    for name in ['build', 'candidate', 'r74', 'r75', 'release']:
        after = job_block(current, name)
        historical = after.split(CURRENT_CHECKOUT, 1)[0] if name == 'release' else after
        checkouts = checkout_blocks(historical)
        check(name + ' historical checkout uses the exact real approved commit with full history',
              len(checkouts) == 1 and '          ref: ' + HISTORICAL + '\n' in checkouts[0]
              and '          persist-credentials: false\n' in checkouts[0]
              and '          fetch-depth: 0\n' in checkouts[0])
        before_bodies, after_bodies = run_bodies(job_block(original, name)), run_bodies(historical)
        check(name + ' has the same number of historical run steps', len(before_bodies) == len(after_bodies))
        cleaned = []
        for body in after_bodies:
            prefix = HISTORICAL_NOTE + '\n' + UNSET + '\n'
            assert body.startswith(prefix), name + ': historical env isolation must be explicit and first'
            cleaned.append(body[len(prefix):])
        check(name + ' preserves every historical command after step-local context removal', cleaned == before_bodies)

    check('Current R88 checkout is separate and uses actual github.sha', release.count(CURRENT_CHECKOUT) == 1)
    fresh = release.split(CURRENT_CHECKOUT, 1)[1]
    fresh_checkout = '      - name: Checkout current R88 candidate independently of historical gates\n' + fresh
    current_checkouts = checkout_blocks(fresh_checkout)
    check('Current source checkout preserves real event context, credentials and complete history',
          len(current_checkouts) == 1 and '          ref: ${{ github.sha }}\n' in current_checkouts[0]
          and '          path: r88-current\n' in current_checkouts[0]
          and '          persist-credentials: false\n' in current_checkouts[0]
          and '          fetch-depth: 0\n' in current_checkouts[0] and UNSET not in fresh)
    steps = re.split(r'(?=^      -)', fresh, flags=re.M)
    current_runs = [part for part in steps if re.search(r'^        run:', part, re.M)]
    check('Every R88 validation command runs from the actual current source checkout',
          len(current_runs) == 7 and all('        working-directory: r88-current\n' in step for step in current_runs))
    order = [
        'python3 scripts/build-hospital-r88.py',
        'python3 scripts/hospital-r88-release-gate.cpu.test.py',
        'python3 scripts/r88-workflow-contract.cpu.test.py',
        'python3 -m pip install Pillow==11.3.0',
        'python3 scripts/run-hospital-r88-cpu.py',
        'node verify-pages-r62.mjs out/hospital-r88-static',
        'npm install --no-save --ignore-scripts playwright@1.56.0',
        'npx playwright install --with-deps chromium',
        'node scripts/r88-guide-interaction.browser.mjs',
        'node scripts/r88-painted.browser.mjs',
        'python3 scripts/hospital-r88-release-gate.py',
        'uses: actions/upload-pages-artifact@v4',
    ]
    positions = [fresh.index(command) for command in order]
    check('R88 build, refusal tests, fresh CPU/subpath/browser evidence and gate precede upload', positions == sorted(positions))
    check('Fresh candidate guide interaction is checked before painted effects and final approval',
          fresh.index('node scripts/r88-guide-interaction.browser.mjs') < fresh.index('node scripts/r88-painted.browser.mjs')
          < fresh.index('python3 scripts/hospital-r88-release-gate.py'))
    check('Local R88 browser points at the exact built site and loopback-only server',
          'STORYWORLD_URL: http://127.0.0.1:4394/' in fresh and
          '--directory out/hospital-r88/site --bind 127.0.0.1' in fresh)
    check('Final R88 gate has its own output identity in the current source',
          '        id: hospitalr88\n        working-directory: r88-current\n' in fresh)
    for key in ['html_sha', 'renderer_sha', 'asset_hashes_json', 'manifest_sha']:
        check('Exact R88 ' + key + ' flows from the final gate to public verification',
              key + ': ${{ steps.hospitalr88.outputs.' + key + ' }}' in release
              and '${{ needs.release.outputs.' + key + ' }}' in deploy)
    check('Pages uploads only the artifact validated by R88',
          '          path: r88-current/out/hospital-r88/site\n' in release
          and '          path: out/hospital-b2/site\n' not in release)
    check('Original historical artifacts remain and actual R88 evidence is retained',
          all(path in release for path in ['out/hospital-b1/build-connected/*.json',
              'out/hospital-b2-static/PAGES_STATIC_VERIFICATION_R62.json',
              'r88-current/out/hospital-r88/', 'r88-current/out/r88/',
              'r88-current/out/hospital-r88-static/PAGES_STATIC_VERIFICATION_R62.json']))
    check('Public verification identifies the new R88 release rather than old B2 approval',
          'HOSPITAL_R88_PUBLIC_RELEASE_VERIFIED' in deploy and 'HOSPITAL_B2_PUBLIC_RELEASE_VERIFIED' not in deploy)
    public_map = re.search(r'^          painted=(\{[\s\S]*?\n          \})', deploy, re.M)
    check('Public verification refuses omission or alteration of all42 supplied painted atlases',
          public_map is not None and ast.literal_eval(public_map.group(1)) == PUBLIC_ATLAS_HASHES
          and 'if assets!=painted or len(assets)!=42:raise SystemExit' in deploy)
    check('Public verification retains immediate 403 refusal without alternate route',
          "if exc.code==403:raise SystemExit('Public verification access denied; no retry or alternate route: '+name)" in deploy)
    check('Public deployment checks exact source, HTML, renderer, manifest and asset digest outputs',
          all(key in deploy for key in ['SOURCE_COMMIT: ${{ github.sha }}',
              'HTML_SHA: ${{ needs.release.outputs.html_sha }}',
              'RENDERER_SHA: ${{ needs.release.outputs.renderer_sha }}',
              'MANIFEST_SHA: ${{ needs.release.outputs.manifest_sha }}',
              'ASSET_HASHES: ${{ needs.release.outputs.asset_hashes_json }}']))
    public_order = ['node scripts/r75-public-smoke.browser.mjs',
                    'node scripts/r88-guide-interaction.browser.mjs',
                    'node scripts/r88-painted.browser.mjs']
    check('Preserved R75 and current explicit-portal guide smoke precede the R88 painted public browser',
          [deploy.index(command) for command in public_order] == sorted(deploy.index(command) for command in public_order)
          and "R88_PUBLIC_SMOKE: '1'" in deploy
          and 'node scripts/r77-guide-normal.browser.mjs' not in deploy)
    check('Public R88 and original reports are retained',
          all(path in deploy for path in ['out/r75/public-smoke.json', 'out/r77/', 'out/r88/', 'out/hospital-r88/']))
    check('No sandbox override or synthetic current-source environment value was added',
          '--no-sandbox' not in current and 'chromiumSandbox: false' not in current
          and not re.search(r'GITHUB_(?:SHA|EVENT_NAME|EVENT_PATH|REF)\s*[:=]\s*' + HISTORICAL, current))
    return cases


def main():
    git = lambda *args: subprocess.check_output(['git', *args], cwd=ROOT)
    original = git('show', HISTORICAL + ':.github/workflows/pages.yml').decode()
    current = (ROOT / '.github/workflows/pages.yml').read_text()
    cases = validate_workflow(current, original)
    preserved = [
        'scripts/r75-release-gate.py', 'scripts/r76-release-gate.py', 'scripts/r77-release-gate.py',
        'scripts/hospital-b1-release-gate.py', 'scripts/hospital-b2-release-gate.py',
        'scripts/hospital-b1-workflow.cpu.test.py', 'scripts/hospital-b1-approved-runtime.json',
        'scripts/r75-approved-runtime.json', 'scripts/r76-approved-runtime.json',
        'scripts/r77-approved-runtime.json',
        'scripts/r75-public-smoke.browser.mjs', 'scripts/r77-guide-normal.browser.mjs',
        'verify-pages-r62.mjs',
    ]
    for name in preserved:
        assert (ROOT / name).read_bytes() == git('show', HISTORICAL + ':' + name), 'Historical contract changed: ' + name
        cases.append({'name': 'Original historical contract unchanged: ' + name, 'passed': True})
    browser = (ROOT / 'scripts/r88-painted.browser.mjs').read_text()
    assert re.search(r'chromiumSandbox\s*:\s*true\b', browser), 'R88 browser must use the original Chromium sandbox'
    assert '--no-sandbox' not in browser and not re.search(r'chromiumSandbox\s*:\s*false\b', browser)
    assert '__STORYWORLD_FINAL42_R88__' in browser and 'r88SourceIndex' in browser, 'New browser must inspect the actual FINAL42 API and command owner'
    assert 'Object.values(data.effects)' in browser and 'all42' in browser, 'All42 supplied effects must be exercised'
    cases.append({'name': 'New FINAL42 browser preserves sandbox and actual42-effect API/owner checks', 'passed': True})
    guide_browser = (ROOT / 'scripts/r88-guide-interaction.browser.mjs').read_text()
    assert re.search(r'chromiumSandbox\s*:\s*true\b', guide_browser), 'Current guide browser must preserve the Chromium sandbox'
    assert '--no-sandbox' not in guide_browser and not re.search(r'chromiumSandbox\s*:\s*false\b', guide_browser)
    assert 'browser.newContext' in guide_browser and 'freshNativeGame(page)' in guide_browser
    assert 'softwareGPU: null' in guide_browser and 'GPU identity is not queried' in guide_browser
    cases.append({'name': 'Current guide browser uses a fresh native UI context and original Chromium sandbox', 'passed': True})
    assert 'stopped.policy.requiresInteraction, true' in guide_browser
    assert 'stopped.policy.guideWalks, true' in guide_browser and 'stopped.policy.guideCrossesPortals, false' in guide_browser
    cases.append({'name': 'Current guide smoke asserts requested automatic walking with explicit portal interaction', 'passed': True})
    assert 'const idleMs = 3000;' in guide_browser and 'await page.waitForTimeout(idleMs)' in guide_browser
    assert "idle.zone, 'hub'" in guide_browser and 'idle.policy.waitingForKey, true' in guide_browser
    cases.append({'name': 'Current guide smoke observes idle portal non-crossing before a real key event', 'passed': True})
    assert "await page.keyboard.press('KeyE')" in guide_browser
    assert "page.locator('#r71DifficultyNormal').click" in guide_browser and "page.locator('#r71DifficultyConfirm').click" in guide_browser
    assert "entered.campaign.tier, 'normal'" in guide_browser and "entered.campaign.roomTier, 'normal'" in guide_browser
    cases.append({'name': 'Current guide smoke enters through real E and native Normal difficulty controls', 'passed': True})
    assert "entered.ward.state.phase, 'route'" in guide_browser and 'entered.ward.controlled, true' in guide_browser
    assert 'entered.ward.state.doorStoryDone, false' in guide_browser and 'entered.bossDoor.open, false' in guide_browser
    assert 'entered.scene, null' in guide_browser and 'entered.guideSceneScheduled, false' in guide_browser
    assert 'narrativeAutoContinueVerified: false' in guide_browser and 'missingAutoContinue' not in guide_browser
    assert "() => !!storyScene && ['pre'" not in guide_browser, 'First ward entry must not require its deferred boss-door narrative'
    assert 'fieldProgress.engaged || fieldProgress.movementFromSceneEnd > 0.25' in guide_browser
    cases.append({'name': 'Current guide smoke preserves native ward route and boss-door narrative gates with resumed guide walking', 'passed': True})
    assert all(token not in guide_browser for token in ['completeRegion(', 'enterRegion(', 'progress.STORY[', 'player.x =', 'player.y =', 'player.hp =', 'armNextNormal('])
    cases.append({'name': 'Current guide smoke adds no progression, position, health or automatic-intent fixture', 'passed': True})
    report = {'schema': 'm0.r88-workflow-contract.cpu/v1', 'passed': True,
              'passedChecks': len(cases), 'checks': cases, 'historicalSource': HISTORICAL,
              'sourceCommit': git('rev-parse', 'HEAD').decode().strip(),
              'workflowSHA256': hashlib.sha256(current.encode()).hexdigest(),
              'GitHubActionsExecuted': False, 'browserExecuted': False,
              'permissionsChanged': False, 'realCheckoutInspected': True}
    target = ROOT / 'out/hospital-r88/workflow-contract.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
