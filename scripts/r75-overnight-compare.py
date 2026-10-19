#!/usr/bin/env python3
"""Validate partial R75 browser matrices and preserve an auditable comparison."""
import json
import statistics
from pathlib import Path

BASE_SHA = "11975b5ded156750f8f63bdd7df33faaffd634d6"
BASE_HTML_SHA = "971ab5fa455203576e0ec3005557321bc36e56220072d5b0f3078d53cc6d8f57"
BASE_RENDERER_SHA = "22a04872281d2fe260d34c4c618f9b608c8afbefe1faf2c759f0ee00d9bf04bb"
ROOT = Path("out/r75/overnight")
SEEDS = (11, 29, 47)
TARGETS = {11: "dist02", 29: "last303", 47: "hando02"}
REPS = {11: (1, 2, 3), 29: (1,), 47: (1,)}
PERF_PHASES = ("field-idle", "field-native-input-and-attack", "field-samong-effects")
PERF_METRICS = ("p50ms", "p95ms", "maxms", "stallsOver250ms", "stallsOver500ms", "stallsOver1000ms")
EXPECTED_CHECKS = {
    "natural-new-game-native-keyboard-save",
    "seed-specific-native-map-and-interaction-probe",
    "browser-reload-native-continue-preserves-normal-progress",
    "saved-777-trial-resumes-after-normal-continue",
    "native-777-leave-restores-normal-journey",
    "normal-save-after-777-return-round-trip",
}

ROOT.mkdir(parents=True, exist_ok=True)
issues = []


def issue(message):
    issues.append(message)


def read(label, seed, rep):
    path = ROOT / label / f"seed-{seed}-rep-{rep}.json"
    try:
        row = json.loads(path.read_text(encoding="utf-8"))
    except Exception as error:
        issue(f"{path}: missing or unreadable result ({error})")
        return None
    if not isinstance(row, dict):
        issue(f"{path}: result is not an object")
        return None
    for field, expected in (("label", label), ("seed", seed), ("replicate", rep), ("target", TARGETS[seed])):
        if row.get(field) != expected:
            issue(f"{path}: {field}={row.get(field)!r}, expected {expected!r}")
    if row.get("result") != "passed":
        issue(f"{path}: browser result is {row.get('result')!r}: {row.get('error', 'no error detail')}")
    checks = row.get("checks") if isinstance(row.get("checks"), list) else []
    names = {item.get("name") for item in checks if isinstance(item, dict) and item.get("ok") is True}
    if len(checks) != len(EXPECTED_CHECKS) or names != EXPECTED_CHECKS:
        issue(f"{path}: expected all six named browser checks; found {sorted(str(x) for x in names)}")
    if row.get("pageErrors") != []:
        issue(f"{path}: page errors are present or the field is missing")
    isolation = row.get("saveIsolation") if isinstance(row.get("saveIsolation"), dict) else {}
    if isolation.get("complete") is not True:
        issue(f"{path}: save isolation did not complete")
    if isolation.get("passed") is not True:
        issue(f"{path}: save isolation checkpoints did not all pass")
    if not isolation.get("normalSlotKey") or not isolation.get("trialSlotKey") or isolation.get("normalSlotKey") == isolation.get("trialSlotKey"):
        issue(f"{path}: normal and 777 storage keys are not independently verified")
    if not isinstance(isolation.get("trial"), dict) or isolation["trial"].get("active") is not True or isolation["trial"].get("zone") != TARGETS[seed]:
        issue(f"{path}: saved 777 trial payload is not verified at its target")
    trial_after_travel = isolation.get("trialAfterTravel")
    if not isinstance(trial_after_travel, dict) or trial_after_travel.get("active") is not True or trial_after_travel.get("layer") != "STORY" or trial_after_travel.get("version") != 1:
        issue(f"{path}: isolated 777 payload was not verified after travel")
    comparisons = isolation.get("comparisons") if isinstance(isolation.get("comparisons"), list) else []
    if len(comparisons) != 3 or any(not isinstance(item, dict) or item.get("ok") is not True for item in comparisons):
        issue(f"{path}: expected three successful semantic restore comparisons")
    stored = isolation.get("storedComparisons") if isinstance(isolation.get("storedComparisons"), list) else []
    if len(stored) != 6 or any(not isinstance(item, dict) or item.get("ok") is not True or item.get("semanticEqual") is not True for item in stored):
        issue(f"{path}: expected four 777 isolation snapshots and two post-return progress checks")
    expected_restore_labels = {"normal-continue-after-browser-reload", "leave-777-restores-normal-journey", "normal-save-after-777-return-round-trip"}
    comparison_labels = {item.get("label") for item in comparisons if isinstance(item, dict)}
    if comparison_labels != expected_restore_labels or any(
        not isinstance(item, dict)
        or item.get("persistentEqual") is not True
        or item.get("dynamicsValid") is not True
        or item.get("spawnNoncesValid") is not True
        or item.get("pointEpochCounterValid") is not True
        or item.get("pointDropCountersValid") is not True
        or item.get("restoreCount") != 1
        or not isinstance(item.get("integrity"), dict)
        or any(item["integrity"].get(key) is not True for key in ("progressFlags", "worldAndDoors", "bossesAndRewards"))
        for item in comparisons
    ):
        issue(f"{path}: semantic comparison must strictly validate progress flags, doors, bosses/rewards, timers, resonance, and exact one-restore room counters")
    return row


baseline = {seed: {rep: read("baseline", seed, rep) for rep in REPS[seed]} for seed in SEEDS}
candidate = {seed: {rep: read("candidate", seed, rep) for rep in REPS[seed]} for seed in SEEDS}


def present(rows):
    return [row for seed_rows in rows.values() for row in seed_rows.values() if isinstance(row, dict)]


base_rows = present(baseline)
candidate_rows = present(candidate)
for row in base_rows:
    if row and row.get("commit") != BASE_SHA:
        issue(f"baseline commit drifted: {row.get('commit')!r}")
    if row and (row.get("htmlSHA256") != BASE_HTML_SHA or row.get("rendererSHA256") != BASE_RENDERER_SHA):
        issue("baseline runtime hash does not match the pinned public build")
candidate_shas = sorted({row.get("commit") for row in candidate_rows if row.get("commit")})
if len(candidate_shas) != 1:
    issue(f"candidate matrix must contain one commit, found {candidate_shas}")
if BASE_SHA in candidate_shas:
    issue("candidate unexpectedly ran the public baseline commit")

for label, groups in (("baseline", baseline), ("candidate", candidate)):
    for seed in SEEDS:
        rows = [groups[seed][rep] for rep in REPS[seed] if groups[seed][rep]]
        html_hashes = {row.get("htmlSHA256") for row in rows}
        renderer_hashes = {row.get("rendererSHA256") for row in rows}
        if len(html_hashes) > 1 or len(renderer_hashes) > 1:
            issue(f"{label} seed {seed}: runtime build hashes changed between repetitions")

all_rows = base_rows + candidate_rows
for row in all_rows:
    if row.get("browserSandbox") is not True or row.get("softwareGPU") is not True:
        issue(f"{row.get('label')} seed {row.get('seed')}: sandbox/software-GPU environment was not confirmed")
    if row.get("physicalGPU") is not False or row.get("physicalDevice") is not False:
        issue(f"{row.get('label')} seed {row.get('seed')}: unsupported physical GPU/device claim")

runtime_equal = bool(base_rows and candidate_rows) and all(
    (row.get("htmlSHA256"), row.get("rendererSHA256")) == (base_rows[0].get("htmlSHA256"), base_rows[0].get("rendererSHA256"))
    for row in base_rows + candidate_rows
)
if base_rows and candidate_rows and not runtime_equal:
    issue("baseline and candidate runtime hashes differ; this test-only A/B is not build-equivalent")


def same_json(left, right):
    return json.dumps(left, sort_keys=True, separators=(",", ":"), ensure_ascii=False) == json.dumps(right, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


performance_pairs = []
environment_keys = ("zone", "layer", "seed", "family", "enemyRoster", "active", "actors", "cameraCell", "playerCell", "renderer", "fixture")
performance_environment_matches = True


def compare_environment_field(differences, field, baseline_value, candidate_value):
    if not same_json(baseline_value, candidate_value):
        differences.append({"field": field, "baseline": baseline_value, "candidate": candidate_value})


for rep in REPS[11]:
    before = baseline[11][rep]
    after = candidate[11][rep]
    if not before or not after:
        performance_environment_matches = False
        continue
    perf_a = before.get("performance")
    perf_b = after.get("performance")
    if not isinstance(perf_a, dict) or not isinstance(perf_b, dict):
        issue(f"seed 11 rep {rep}: missing performance sample")
        performance_environment_matches = False
        continue
    environment_differences = []
    for field, expected in (("seed", 11), ("replicate", rep), ("durationMs", 90000)):
        for label, perf in (("baseline", perf_a), ("candidate", perf_b)):
            if perf.get(field) != expected:
                environment_differences.append({"field": f"{label}.{field}", "expected": expected, "actual": perf.get(field)})
    compare_environment_field(environment_differences, "viewport", perf_a.get("viewport"), perf_b.get("viewport"))
    before_a = perf_a.get("before") if isinstance(perf_a.get("before"), dict) else {}
    before_b = perf_b.get("before") if isinstance(perf_b.get("before"), dict) else {}
    for key in environment_keys:
        compare_environment_field(environment_differences, f"before.{key}", before_a.get(key), before_b.get(key))
    sample_a = perf_a.get("sample") if isinstance(perf_a.get("sample"), dict) else {}
    sample_b = perf_b.get("sample") if isinstance(perf_b.get("sample"), dict) else {}
    phase_a = {phase.get("name"): phase for phase in (sample_a.get("phases") or []) if isinstance(phase, dict)}
    phase_b = {phase.get("name"): phase for phase in (sample_b.get("phases") or []) if isinstance(phase, dict)}
    if set(phase_a) != set(PERF_PHASES) or set(phase_b) != set(PERF_PHASES):
        issue(f"seed 11 rep {rep}: performance phases are incomplete")
        environment_differences.append({"field": "sample.phases", "expected": list(PERF_PHASES), "baseline": sorted(phase_a), "candidate": sorted(phase_b)})
    pair_ok = not environment_differences
    performance_environment_matches &= bool(pair_ok)
    if not pair_ok:
        field_names = [item["field"] for item in environment_differences]
        issue(f"seed 11 rep {rep}: baseline/candidate performance environments do not match at {field_names}")
    performance_pairs.append({"replicate": rep, "environmentMatches": bool(pair_ok), "environmentDifferences": environment_differences, "durationMs": perf_a.get("durationMs"), "viewport": perf_a.get("viewport"), "phases": []})
    for name in PERF_PHASES:
        if name not in phase_a or name not in phase_b:
            continue
        performance_pairs[-1]["phases"].append({
            "name": name,
            "baseline": {metric: phase_a[name].get(metric) for metric in PERF_METRICS},
            "candidate": {metric: phase_b[name].get(metric) for metric in PERF_METRICS},
        })


def distribution(values):
    numbers = [float(value) for value in values if isinstance(value, (int, float))]
    if not numbers:
        return {"median": None, "mad": None, "min": None, "max": None, "samples": 0}
    center = statistics.median(numbers)
    return {"median": center, "mad": statistics.median(abs(value - center) for value in numbers), "min": min(numbers), "max": max(numbers), "samples": len(numbers)}


performance_summary = []
for name in PERF_PHASES:
    phase_summary = {"phase": name, "metrics": {}}
    for metric in PERF_METRICS:
        base_values, candidate_values, paired_percent = [], [], []
        for pair in performance_pairs:
            phase = next((item for item in pair["phases"] if item["name"] == name), None)
            if not phase:
                continue
            a, b = phase["baseline"].get(metric), phase["candidate"].get(metric)
            if isinstance(a, (int, float)):
                base_values.append(a)
            if isinstance(b, (int, float)):
                candidate_values.append(b)
            if isinstance(a, (int, float)) and a != 0 and isinstance(b, (int, float)):
                paired_percent.append((b - a) * 100 / a)
        med_a = statistics.median(base_values) if base_values else None
        med_b = statistics.median(candidate_values) if candidate_values else None
        phase_summary["metrics"][metric] = {
            "baseline": distribution(base_values),
            "candidate": distribution(candidate_values),
            "medianRelativeChangePercent": round((med_b - med_a) * 100 / med_a, 2) if med_a not in (None, 0) and med_b is not None else None,
            "pairedRelativeChangePercent": distribution(paired_percent),
        }
    performance_summary.append(phase_summary)

seed_matrix = {}
for seed in SEEDS:
    base_first = baseline[seed][REPS[seed][0]]
    candidate_first = candidate[seed][REPS[seed][0]]
    seed_matrix[str(seed)] = {
        "target": TARGETS[seed],
        "baselineResult": base_first.get("result") if base_first else None,
        "candidateResult": candidate_first.get("result") if candidate_first else None,
        "expectedReplicates": len(REPS[seed]),
        "baselineCompletedReplicates": sum(bool(baseline[seed][rep]) for rep in REPS[seed]),
        "candidateCompletedReplicates": sum(bool(candidate[seed][rep]) for rep in REPS[seed]),
    }

result = {
    "result": "passed" if not issues else "failed",
    "issues": issues,
    "baselineSHA": BASE_SHA,
    "candidateSHAs": candidate_shas,
    "baselineRuntime": {"htmlSHA256": base_rows[0].get("htmlSHA256"), "rendererSHA256": base_rows[0].get("rendererSHA256")} if base_rows else None,
    "candidateRuntime": {"htmlSHA256": candidate_rows[0].get("htmlSHA256"), "rendererSHA256": candidate_rows[0].get("rendererSHA256")} if candidate_rows else None,
    "runtimeBuildsEqual": runtime_equal,
    "sameRunner": True,
    "browserSandbox": True,
    "softwareGPU": True,
    "physicalGPU": False,
    "physicalDevice": False,
    "seedMatrix": seed_matrix,
    "performanceEnvironmentMatches": bool(performance_environment_matches and len(performance_pairs) == 3),
    "performanceReplicates": performance_pairs,
    "performanceMedianSummary": performance_summary,
    "interpretation": "Repeated software-GPU frame-interval and stall observations include median, range, and median absolute deviation. They are descriptive and do not by themselves establish a performance improvement; compare any observed effect with run-to-run spread. No physical GPU or device result is implied.",
}
ROOT.mkdir(parents=True, exist_ok=True)
(ROOT / "comparison.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
environment_diagnostics = [
    {"replicate": pair["replicate"], "fields": pair["environmentDifferences"]}
    for pair in performance_pairs if pair["environmentDifferences"]
]
if environment_diagnostics:
    print("R75_PERFORMANCE_ENVIRONMENT_DIAGNOSTICS " + json.dumps(environment_diagnostics, ensure_ascii=False))
print(json.dumps({"result": result["result"], "issues": len(issues), "candidateSHAs": candidate_shas, "performanceEnvironmentMatches": result["performanceEnvironmentMatches"], "environmentMismatchPairs": len(environment_diagnostics)}, ensure_ascii=False))
if issues:
    raise SystemExit(1)
