#!/usr/bin/env python3
"""Compare deterministic R75 browser/performance repetitions from one runner."""
import json
import statistics
from pathlib import Path

BASE_SHA = "11975b5ded156750f8f63bdd7df33faaffd634d6"
ROOT = Path("out/r75/overnight")
SEEDS = (11, 29, 47)
TARGETS = {11: "dist02", 29: "last303", 47: "hando02"}
PERF_PHASES = ("field-idle", "field-native-input-and-attack", "field-samong-effects")


def read(label, seed, rep):
    path = ROOT / label / f"seed-{seed}-rep-{rep}.json"
    value = json.loads(path.read_text(encoding="utf-8"))
    assert value["result"] == "passed", f"{path} did not pass"
    assert value["label"] == label and value["seed"] == seed and value["replicate"] == rep
    assert value["target"] == TARGETS[seed]
    assert len(value["checks"]) == 5, f"unexpected case count in {path}"
    return value


baseline = {seed: [read("baseline", seed, rep) for rep in ((1, 2, 3) if seed == 11 else (1,))] for seed in SEEDS}
candidate = {seed: [read("candidate", seed, rep) for rep in ((1, 2, 3) if seed == 11 else (1,))] for seed in SEEDS}
for row in baseline[11]:
    assert row["commit"] == BASE_SHA, f"baseline commit drifted: {row['commit']}"
assert baseline[11][0]["htmlSHA256"] == "971ab5fa455203576e0ec3005557321bc36e56220072d5b0f3078d53cc6d8f57"
assert baseline[11][0]["rendererSHA256"] == "22a04872281d2fe260d34c4c618f9b608c8afbefe1faf2c759f0ee00d9bf04bb"
candidate_shas = {row["commit"] for rows in candidate.values() for row in rows}
assert len(candidate_shas) == 1, f"candidate matrix contains multiple commits: {candidate_shas}"
assert BASE_SHA not in candidate_shas, "candidate run unexpectedly executed on the baseline commit"
for seed in SEEDS:
    assert {x["htmlSHA256"] for x in baseline[seed]} == {baseline[seed][0]["htmlSHA256"]}
    assert {x["rendererSHA256"] for x in baseline[seed]} == {baseline[seed][0]["rendererSHA256"]}
    assert {x["htmlSHA256"] for x in candidate[seed]} == {candidate[seed][0]["htmlSHA256"]}
    assert {x["rendererSHA256"] for x in candidate[seed]} == {candidate[seed][0]["rendererSHA256"]}


def median(rows):
    return statistics.median(rows) if rows else None


perf_rows = []
comparable = True
for rep, (before, after) in enumerate(zip(baseline[11], candidate[11]), start=1):
    assert before["performance"] and after["performance"], f"missing performance data in repetition {rep}"
    a, b = before["performance"], after["performance"]
    environment_keys = ("zone", "layer", "seed", "family", "enemyRoster", "active", "camera", "player", "renderer", "actors")
    environment_match = all(a["before"].get(k) == b["before"].get(k) for k in environment_keys)
    comparable &= environment_match
    phase_a = {p["name"]: p for p in a["sample"]["phases"]}
    phase_b = {p["name"]: p for p in b["sample"]["phases"]}
    for name in PERF_PHASES:
        x, y = phase_a[name], phase_b[name]
        perf_rows.append({
            "replicate": rep,
            "phase": name,
            "baseline": {k: x.get(k) for k in ("frames", "p50ms", "p95ms", "maxms", "stallsOver250ms", "stallsOver500ms", "stallsOver1000ms")},
            "candidate": {k: y.get(k) for k in ("frames", "p50ms", "p95ms", "maxms", "stallsOver250ms", "stallsOver500ms", "stallsOver1000ms")},
            "sameStartActorsAndPlayer": environment_match,
        })

summary = []
for name in PERF_PHASES:
    left, right = [], []
    for rep in range(3):
        left.append(next(r["baseline"] for r in perf_rows if r["phase"] == name and r["replicate"] == rep + 1))
        right.append(next(r["candidate"] for r in perf_rows if r["phase"] == name and r["replicate"] == rep + 1))
    row = {"phase": name, "baselineMedian": {}, "candidateMedian": {}, "relativeChangePercent": {}}
    for metric in ("p50ms", "p95ms", "maxms", "stallsOver250ms", "stallsOver500ms", "stallsOver1000ms"):
        av = median([x[metric] for x in left if x.get(metric) is not None])
        bv = median([x[metric] for x in right if x.get(metric) is not None])
        row["baselineMedian"][metric] = av
        row["candidateMedian"][metric] = bv
        row["relativeChangePercent"][metric] = round((bv - av) * 100 / av, 2) if av not in (None, 0) and bv is not None else None
    summary.append(row)

result = {
    "baselineSHA": BASE_SHA,
    "candidateSHA": next(iter(candidate_shas)),
    "baselineRuntime": {"htmlSHA256": baseline[11][0]["htmlSHA256"], "rendererSHA256": baseline[11][0]["rendererSHA256"]},
    "candidateRuntime": {"htmlSHA256": candidate[11][0]["htmlSHA256"], "rendererSHA256": candidate[11][0]["rendererSHA256"]},
    "sameRunner": True,
    "browserSandbox": True,
    "softwareGPU": True,
    "physicalGPU": False,
    "physicalDevice": False,
    "seedMatrix": {str(s): {"target": TARGETS[s], "baselineResult": baseline[s][0]["result"], "candidateResult": candidate[s][0]["result"], "checksPerRun": len(candidate[s][0]["checks"])} for s in SEEDS},
    "performanceEnvironmentMatches": comparable,
    "performanceReplicates": perf_rows,
    "performanceMedianSummary": summary,
    "interpretation": "Frame intervals and stall counts are browser software-GPU observations. A phase is comparable only when its deterministic seed, target, viewport, initial actors/player/camera and renderer match. No physical-device or GPU-time claim.",
}
ROOT.mkdir(parents=True, exist_ok=True)
(ROOT / "comparison.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"ok": True, "candidateSHA": result["candidateSHA"], "performanceEnvironmentMatches": comparable, "summary": summary}, ensure_ascii=False))
