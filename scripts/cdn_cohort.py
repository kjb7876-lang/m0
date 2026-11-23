"""R615 additive exact-object cohort contracts. No deployment or credentials."""
import hashlib
import re
from pathlib import PurePosixPath
from urllib.parse import urlsplit

PATH = re.compile(r"^assets/[A-Za-z0-9_.\-/]+\.(?:mp3|ogg|wav|m4a|mp4|webm|glb)$")
SHA = re.compile(r"^[a-f0-9]{64}$")
MIME = {".mp3": {"audio/mpeg"}, ".ogg": {"audio/ogg","application/ogg"},
        ".wav": {"audio/wav","audio/x-wav"}, ".m4a": {"audio/mp4","audio/x-m4a"},
        ".mp4": {"video/mp4"}, ".webm": {"video/webm"},
        ".glb": {"model/gltf-binary","application/octet-stream"}}

def valid_path(p):
    return isinstance(p,str) and PATH.fullmatch(p) is not None and not any(
        x in ("", ".", "..") for x in p.split("/")) and "mammon" not in p.lower()

def canonical(rows):
    """Sorted exact path and bounded numeric/SHA columns encoded as ASCII TSV."""
    for r in rows:
        if not (valid_path(r.get("path")) and type(r.get("bytes")) is int and r["bytes"]>0
                and isinstance(r.get("sha256"),str) and SHA.fullmatch(r["sha256"])):
            raise ValueError(f"invalid additive cohort record: {r!r}")
    s=sorted((r["path"],r["bytes"],r["sha256"]) for r in rows)
    if len(s)!=len({r[0] for r in s}):
        raise ValueError("duplicate additive path")
    return s

def contract(rows):
    s=canonical(rows)
    encoded="".join(f"{path}\t{size}\t{sha}\n" for path,size,sha in s).encode("ascii")
    return {"policy":"additive-only","sha256":hashlib.sha256(encoded).hexdigest(),
            "files":len(s),"bytes":sum(r[1] for r in s)}

def validate_selection(exact, allrows, legacy):
    if not isinstance(exact,list) or any(not valid_path(p) for p in exact):
        raise ValueError("invalid additiveVerifyPaths: exact asset media files only")
    if len(set(exact))!=len(exact) or any(p.startswith(legacy) for p in exact):
        raise ValueError("additive paths duplicate each other or legacy prefixes")
    items={r["path"]:r for r in allrows}
    if len(items)!=len(allrows):
        raise ValueError("duplicate runtime-manifest path")
    missing=set(exact)-items.keys()
    if missing:
        raise ValueError("additive manifest files missing: "+", ".join(sorted(missing)))
    cohort=[items[p] for p in sorted(exact)]
    canonical(cohort)
    return cohort

def allowed_mime(path, value):
    return value.split(";",1)[0].strip().lower() in MIME[PurePosixPath(path).suffix]

def allowed_base(base):
    p=urlsplit(base)
    return not (p.username or p.password or p.query or p.fragment) and (
        (p.scheme=="https" and p.netloc=="storyworld-m0-assets.pages.dev" and p.path in ("","/"))
        or (p.scheme=="http" and p.hostname=="127.0.0.1" and p.port is not None))
