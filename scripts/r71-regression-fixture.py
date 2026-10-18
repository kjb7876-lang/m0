#!/usr/bin/env python3
"""Stabilize only the two dummy targets in the R65 native motif regression."""
from pathlib import Path
import argparse
import sys


R69_QUEUE_MARKER = "const queueR69=()=>delayed.filter(job=>job.owner==='qa-thread-motif-owner');"
OLD_TARGETS = (
    "targets=originalEnemies.slice(0,2).map((e,i)=>({...e,id:'qa-thread-target-'+i,"
    "x:origin.x+1+i,y:origin.y,hp:1e7,maxHp:1e7,deadRecorded:false,"
    "spawnState:'active',invulnerableUntil:0,graceUntil:0,attack:null,nav:[],tell:0,cd:100}));"
)
NEW_TARGETS = (
    "targets=originalEnemies.slice(0,2).map((e,i)=>({...e,id:'qa-thread-target-'+i,"
    "nativeId:'qa-thread-target-'+i,type:'ranged',ai:'ranged',boss:false,midboss:false,"
    "midBoss:false,majorBoss:false,isBoss:false,miniBoss:false,elite:false,cosmic:false,"
    "trial:false,persona:false,r61Clone:false,r61Summoned:false,r61FieldsOwned:false,"
    "r61PreserveHealth:true,r61PreserveDamage:true,"
    "x:origin.x+.35+.55*i,y:origin.y,hp:1e7,maxHp:1e7,deadRecorded:false,"
    "spawnState:'active',invulnerableUntil:0,graceUntil:0,attack:null,nav:[],tell:0,"
    "rest:1e6,cd:100}));"
)
ORIGINAL_ASSERTIONS = (
    "assert.equal(motifRuntime.subHits,18,",
    "assert.equal(motifRuntime.fractalHits,1,",
    "assert.equal(motifRuntime.groupCount,6);",
    "assert.ok(Math.abs(motifRuntime.ichidanRatio-1.35)<1e-8,",
)
NATIVE_PATH_MARKERS = (
    "const cast=c.cast(true);",
    "return base.apply(this,arguments);",
    "while(queueR69().length){",
)


def check_count(source: str, token: str, expected: int, label: str) -> None:
    actual = source.count(token)
    if actual != expected:
        raise RuntimeError(f"{label}: expected {expected} occurrence(s), found {actual}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "candidate",
        nargs="?",
        type=Path,
        default=Path("qa-r65/candidate-regression.mjs"),
        help="generated candidate regression source (default: %(default)s)",
    )
    args = parser.parse_args()
    path: Path = args.candidate
    if not path.is_file():
        raise RuntimeError(f"candidate regression source does not exist: {path}")

    source = path.read_text(encoding="utf-8")
    check_count(source, R69_QUEUE_MARKER, 1, "R69 owned-queue wait (run r69-regression-wait.py first)")
    check_count(source, OLD_TARGETS, 1, "original two-target dummy fixture")
    check_count(source, NEW_TARGETS, 0, "already patched dummy fixture")
    for marker in NATIVE_PATH_MARKERS:
        check_count(source, marker, 1, f"native motif path marker {marker!r}")
    for assertion in ORIGINAL_ASSERTIONS:
        check_count(source, assertion, 1, f"original motif assertion {assertion!r}")

    patched = source.replace(OLD_TARGETS, NEW_TARGETS, 1)
    check_count(patched, OLD_TARGETS, 0, "unpatched dummy fixture after replacement")
    check_count(patched, NEW_TARGETS, 1, "patched dummy fixture after replacement")
    for assertion in ORIGINAL_ASSERTIONS:
        check_count(patched, assertion, 1, f"preserved motif assertion {assertion!r}")
    path.write_text(patched, encoding="utf-8")
    print(
        "R71_REGRESSION_FIXTURE: patched only the two qa-thread-target dummies; "
        "native cast, delayed queue, hitEnemy base, and exact motif assertions preserved"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"R71_REGRESSION_FIXTURE: refused patch: {error}", file=sys.stderr)
        sys.exit(1)
