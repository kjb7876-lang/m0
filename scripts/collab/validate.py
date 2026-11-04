#!/usr/bin/env python3
"""StoryWorld 협업 작업 계약·자산 manifest 검증기 (표준 라이브러리만 사용).

docs/agent-collaboration.md 의 규칙을 기계적으로 검사한다.
  python3 -I scripts/collab/validate.py task ops/tasks/SW-0001.json
  python3 -I scripts/collab/validate.py manifest M.json --root DIR
  python3 -I scripts/collab/validate.py dispatch LEDGER.json TASK.json
  python3 -I scripts/collab/validate.py result TASK.json RESULT.json
  python3 -I scripts/collab/validate.py zip BUNDLE.zip
  python3 -I scripts/collab/validate.py all          # ops/tasks/*.json, ops/manifests/*.json
종료 코드: 0 통과, 1 위반, 2 사용법 오류. 출력은 한 줄 JSON.
"""
import hashlib, json, os, re, struct, sys, zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CONFIG_PATH = os.path.join(ROOT, 'ops', 'collab.config.json')
HEX40 = re.compile(r'^[0-9a-f]{7,40}$')
HEX64 = re.compile(r'^[0-9a-f]{64}$')
REQUIRED = ['task_id', 'project', 'repository', 'issue_number', 'revision', 'goal',
            'acceptance_criteria', 'non_goals', 'allowed_paths', 'base_commit',
            'input_manifest_hash', 'executor', 'reviewer', 'dependencies', 'status',
            'dispatch_id', 'provider_task_id', 'attempt_count', 'artifact_manifest',
            'evidence', 'blocked_reason', 'approval_scope', 'completion']
EXTERNAL = {'dots', 'codex-cloud'}
ACTIVE = {'RUNNING', 'REVIEW', 'READY_FOR_APPROVAL', 'DONE'}
SCRIPT_EXT = {'.exe', '.sh', '.bat', '.cmd', '.ps1', '.py', '.js', '.mjs', '.cjs', '.html', '.htm', '.vbs', '.jar', '.dll', '.so', '.dylib', '.app'}


def load_config(path=CONFIG_PATH):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def dedup_key(task):
    return '|'.join(str(task.get(k)) for k in ('repository', 'task_id', 'revision', 'input_manifest_hash'))


def path_ok(p, cfg):
    if not isinstance(p, str) or not p:
        return False
    if any(re.search(pat, p) for pat in cfg['forbidden_path_patterns']):
        return False
    return any(p == r or p.startswith(r) for r in cfg['allowed_path_roots'])


def validate_task(task, cfg):
    errs = []
    for k in REQUIRED:
        if k not in task:
            errs.append('missing:' + k)
    if errs:
        return errs
    prefix = cfg['task_prefix']
    if not re.fullmatch(prefix + r'-\d{4}', str(task['task_id'])):
        errs.append('task_id: %s-NNNN 형식이 아님(다른 프로젝트 ID 혼용 금지)' % prefix)
    if task['repository'] != cfg['repository'] or task['project'] != cfg['project']:
        errs.append('repository/project 불일치: 이 저장소 작업이 아님')
    if not isinstance(task['revision'], int) or task['revision'] < 1:
        errs.append('revision: 1 이상의 정수')
    if task['issue_number'] is not None and not (isinstance(task['issue_number'], int) and task['issue_number'] > 0):
        errs.append('issue_number: 양의 정수 또는 null')
    if not isinstance(task['acceptance_criteria'], list) or not task['acceptance_criteria']:
        errs.append('acceptance_criteria: 비어 있지 않은 목록')
    if not isinstance(task['allowed_paths'], list) or not task['allowed_paths']:
        errs.append('allowed_paths: 비어 있지 않은 목록')
    else:
        for p in task['allowed_paths']:
            if not path_ok(p, cfg):
                errs.append('allowed_paths 범위 밖/금지 경로: ' + str(p))
    if not HEX40.match(str(task['base_commit'])):
        errs.append('base_commit: 7~40자리 소문자 16진수')
    h = task['input_manifest_hash']
    if h is not None and not HEX64.match(str(h)):
        errs.append('input_manifest_hash: sha256(64자리) 또는 입력 없음(null)')
    for role in ('executor', 'reviewer'):
        if task[role] not in cfg['executors']:
            errs.append('%s: 허용 목록 밖(%s)' % (role, task[role]))
    if task['executor'] == task['reviewer'] and task['executor'] != 'user':
        errs.append('reviewer 는 executor 와 달라야 함(독립 리뷰)')
    st = task['status']
    if st not in cfg['statuses']:
        errs.append('status: 허용 목록 밖')
    if st == 'BLOCKED' and not task['blocked_reason']:
        errs.append('BLOCKED 에는 blocked_reason 필요')
    if st == 'DONE' and not task['evidence']:
        errs.append('DONE 에는 evidence 필요')
    if st in ACTIVE and task['executor'] in EXTERNAL and not task['dispatch_id']:
        errs.append('외부 실행자 작업이 실행 상태인데 dispatch_id 없음')
    if not isinstance(task['attempt_count'], int) or task['attempt_count'] < 0:
        errs.append('attempt_count: 0 이상의 정수')
    elif task['attempt_count'] > cfg['retry']['fix_rounds_max'] and st not in ('BLOCKED', 'CANCELLED', 'DONE'):
        errs.append('수정 횟수 상한(%d) 초과 — 원인 보고 후 BLOCKED 로' % cfg['retry']['fix_rounds_max'])
    if task['completion'] not in ('pr-opened', 'merged', 'deployed', 'asset-delivered', 'report'):
        errs.append('completion: pr-opened|merged|deployed|asset-delivered|report 중 하나')
    return errs


def check_transition(old, new, cfg):
    return new in cfg['transitions'].get(old, [])


def check_dispatch(ledger, task):
    """이미 같은 키로 실행 중·완료면 재실행 금지. 응답 불명 기록이 있으면 먼저 조회."""
    key = dedup_key(task)
    for rec in ledger:
        if rec.get('key') != key:
            continue
        if rec.get('state') in ('requested', 'unknown'):
            return 'CONFIRM_EXISTING', rec
        if rec.get('state') in ('accepted', 'running', 'done'):
            return 'DUPLICATE', rec
    return 'OK', None


def accept_result(task, result):
    """오래된 결과가 최신 revision 을 덮어쓰지 못하게 한다."""
    if result.get('task_id') != task['task_id']:
        return 'WRONG_TASK'
    if result.get('revision') != task['revision'] or result.get('input_manifest_hash') != task['input_manifest_hash']:
        return 'STALE'
    if task['status'] in ('PAUSED', 'CANCELLED'):
        return 'NOT_ACCEPTING'
    return 'OK'


def _png_has_trns(path):
    """팔레트·RGB PNG 의 tRNS 투명도 청크(IDAT 앞)를 찾는다."""
    with open(path, 'rb') as f:
        f.seek(8)
        while True:
            hdr = f.read(8)
            if len(hdr) < 8:
                return False
            size, ctype = struct.unpack('>I4s', hdr)
            if ctype == b'tRNS':
                return True
            if ctype in (b'IDAT', b'IEND'):
                return False
            f.seek(size + 4, 1)


def image_info(path):
    """PNG/WebP 의 (폭, 높이, 알파 여부) — PIL 없이 헤더만 읽음."""
    with open(path, 'rb') as f:
        head = f.read(64)
    if head[:8] == b'\x89PNG\r\n\x1a\n':
        w, h, depth, ctype = struct.unpack('>IIBB', head[16:26])
        return 'image/png', w, h, ctype in (4, 6) or _png_has_trns(path)
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        chunk = head[12:16]
        if chunk == b'VP8X':
            flags = head[20]
            w = 1 + int.from_bytes(head[24:27], 'little')
            h = 1 + int.from_bytes(head[27:30], 'little')
            return 'image/webp', w, h, bool(flags & 0x10)
        if chunk == b'VP8L':
            b = int.from_bytes(head[21:25], 'little')
            return 'image/webp', (b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1, bool((b >> 28) & 1)
        if chunk == b'VP8 ':
            w = int.from_bytes(head[26:28], 'little') & 0x3FFF
            h = int.from_bytes(head[28:30], 'little') & 0x3FFF
            return 'image/webp', w, h, False
    return None, None, None, None


def validate_manifest(man, root=None):
    errs, verified = [], 0
    for k in ('task_id', 'revision', 'expected_count', 'assets'):
        if k not in man:
            errs.append('missing:' + k)
    if errs:
        return errs, False
    seen_ids, seen_files = set(), set()
    for a in man['assets']:
        tag = a.get('asset_id', '?')
        if tag in seen_ids or a.get('file') in seen_files:
            errs.append(tag + ' 중복 항목(같은 asset_id 또는 파일)')
            continue
        seen_ids.add(tag)
        seen_files.add(a.get('file'))
        for k in ('asset_id', 'file', 'mime', 'bytes', 'sha256', 'origin', 'license', 'target_path'):
            if k not in a:
                errs.append('%s missing:%s' % (tag, k))
        if not HEX64.match(str(a.get('sha256', ''))):
            errs.append(tag + ' sha256 형식')
        if root is None:
            continue
        fname = str(a.get('file', ''))
        if os.path.isabs(fname) or '..' in fname.replace('\\', '/').split('/'):
            errs.append(tag + ' 파일 경로가 전달 루트 밖(절대 경로·..)')
            continue
        real_root = os.path.realpath(root)
        p = os.path.realpath(os.path.join(real_root, fname))
        if os.path.commonpath([real_root, p]) != real_root:
            errs.append(tag + ' 파일이 전달 루트 밖을 가리킴(심볼릭 링크 등)')
            continue
        if not os.path.isfile(p):
            errs.append(tag + ' 파일 없음')
            continue
        if os.path.getsize(p) != a.get('bytes'):
            errs.append(tag + ' 크기 불일치')
            continue
        if sha256_file(p) != a.get('sha256'):
            errs.append(tag + ' sha256 불일치')
            continue
        mime, w, h, alpha = image_info(p)
        if a.get('mime', '').startswith('image/'):
            if mime != a['mime']:
                errs.append('%s 형식 불일치(%s)' % (tag, mime))
                continue
            fmt = a.get('format') or {}
            if fmt.get('width') and (w, h) != (fmt['width'], fmt['height']):
                errs.append('%s 크기 %sx%s ≠ %sx%s' % (tag, w, h, fmt['width'], fmt['height']))
                continue
            if fmt.get('alpha') and not alpha:
                errs.append(tag + ' 알파 채널 없음')
                continue
            sp = a.get('sprite')
            if sp:
                cw, ch = sp['cell']
                if w % cw or h % ch or (w // cw) * (h // ch) < sp['frames']:
                    errs.append(tag + ' 칸 규격과 프레임 수가 그림 크기와 맞지 않음')
                    continue
        verified += 1
    complete = (not errs) and root is not None and verified == man['expected_count'] == len(seen_ids)
    if root is not None and len(man['assets']) != man['expected_count']:
        errs.append('일부만 전달됨: %d/%d' % (len(man['assets']), man['expected_count']))
    return errs, complete


def check_zip(path, max_total=200 << 20, max_ratio=200):
    errs = []
    with zipfile.ZipFile(path) as z:
        total = 0
        for i in z.infolist():
            n = i.filename
            if n.startswith('/') or '..' in n.replace('\\', '/').split('/') or re.match(r'^[A-Za-z]:', n):
                errs.append('경로 이탈: ' + n)
            if (i.external_attr >> 16) & 0o170000 == 0o120000:
                errs.append('심볼릭 링크: ' + n)
            mode = (i.external_attr >> 16) & 0o7777
            if os.path.splitext(n)[1].lower() in SCRIPT_EXT:
                errs.append('예상하지 않은 실행·스크립트 파일: ' + n)
            elif not n.endswith('/') and mode & 0o111:
                errs.append('실행 권한이 있는 파일: ' + n)
            elif not n.endswith('/') and i.file_size:
                with z.open(i) as fh:  # 읽기만 함(실행 안 함): 확장자 없는 스크립트·실행 파일 서명
                    head = fh.read(4)
                if head[:2] == b'#!' or head == b'\x7fELF' or head[:2] == b'MZ' or head in (b'\xcf\xfa\xed\xfe', b'\xca\xfe\xba\xbe'):
                    errs.append('실행 파일·스크립트 내용: ' + n)
            total += i.file_size
            if i.compress_size and i.file_size / max(i.compress_size, 1) > max_ratio:
                errs.append('비정상 압축률: ' + n)
        if total > max_total:
            errs.append('해제 용량 과다: %d' % total)
    return errs


def _load(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    cfg = load_config()
    cmd = argv[1]
    out = {'cmd': cmd}
    if cmd == 'task' and len(argv) == 3:
        errs = validate_task(_load(argv[2]), cfg)
        out.update(ok=not errs, errors=errs)
    elif cmd == 'manifest' and len(argv) in (3, 5):
        root = argv[4] if len(argv) == 5 and argv[3] == '--root' else None
        errs, complete = validate_manifest(_load(argv[2]), root)
        out.update(ok=not errs, complete=complete, errors=errs)
    elif cmd == 'dispatch' and len(argv) == 4:
        verdict, rec = check_dispatch(_load(argv[2]), _load(argv[3]))
        out.update(ok=verdict == 'OK', verdict=verdict, existing=rec)
    elif cmd == 'result' and len(argv) == 4:
        verdict = accept_result(_load(argv[2]), _load(argv[3]))
        out.update(ok=verdict == 'OK', verdict=verdict)
    elif cmd == 'zip' and len(argv) == 3:
        errs = check_zip(argv[2])
        out.update(ok=not errs, errors=errs)
    elif cmd == 'all':
        res = {}
        for d, kind in (('tasks', 'task'), ('manifests', 'manifest')):
            dd = os.path.join(ROOT, 'ops', d)
            for n in sorted(os.listdir(dd)) if os.path.isdir(dd) else []:
                if n.endswith('.json'):
                    data = _load(os.path.join(dd, n))
                    res['%s/%s' % (d, n)] = validate_task(data, cfg) if kind == 'task' else validate_manifest(data)[0]
        out.update(ok=all(not v for v in res.values()), results=res)
    else:
        print(__doc__)
        return 2
    print(json.dumps(out, ensure_ascii=False))
    return 0 if out['ok'] else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))
