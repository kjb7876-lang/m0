#!/usr/bin/env python3
"""Verify the actual registered game package and its browser observations."""
import argparse
import hashlib
import json
import math
import struct
from html.parser import HTMLParser
from pathlib import Path

ACTIVE = {"F01", "W06", "P01", "P02", "D01", "O01", "O02"}
SCENES = ("entry", "branch", "records", "gather", "boss-door", "exit", "security", "vault")
OVERLAY = "mammon-miniature-pilot.js"
VIEWS = {"pc": ([1920, 1080], 1), "mobile": ([390, 844], 3)}


def require(value, message):
    if not value:
        raise ValueError(message)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ScriptSources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            values = dict(attrs)
            if "src" in values:
                self.scripts.append((values["src"].removeprefix("./"), values))


def package(repo, base, head_sha, base_sha):
    by_version = {}
    for version, checkout, expected in (("before", base, base_sha), ("after", repo, head_sha)):
        site = checkout / "r96/hospital-three-pc/site"
        data = read(checkout / "r96/build-result.json")
        require(data["sourceCommit"] == expected, f"{version} checkout SHA mismatch")
        manifest = site / "web-manifest-r62.json"
        require(data["runtimeManifestSHA256"] == digest(manifest), f"{version} manifest SHA mismatch")
        require(digest(manifest) == digest(checkout / "r96/runtime-manifest.json"), "Unexpected runtime manifest")
        rows = {entry["path"]: entry["sha256"] for entry in read(manifest)["files"]}
        parser = ScriptSources()
        parser.feed((site / "index.html").read_text(encoding="utf-8"))
        require(rows["index.html"] == digest(site / "index.html"), f"{version} HTML hash mismatch")
        require(not any(src.rsplit("/", 1)[-1].split("?", 1)[0] == "seven-sins-art.js" for src, _ in parser.scripts),
                "Broad seven-map art is installed together with Mammon")
        by_version[version] = (rows, parser.scripts)
    before, initial_scripts = by_version["before"]
    after, final_scripts = by_version["after"]
    base_tags = [attrs for src, attrs in initial_scripts if src == OVERLAY]
    require(not base_tags or len(base_tags) == 1 and "data-mammon-release" in base_tags[0],
            "Ambiguous registration in the comparison base")
    initial = not base_tags
    require(initial == (OVERLAY not in before), "Base script tag and package disagree")
    overlay_tags = [attrs for src, attrs in final_scripts if src == OVERLAY]
    require(len(overlay_tags) == 1 and "data-mammon-release" in overlay_tags[0],
            "Expected exactly one registered Mammon entry script")
    source = repo / "r96/client-source" / OVERLAY
    asset_root = repo / "r96/runtime-text/assets/mammon-v3"
    indexed = {a["id"]: a for a in read(asset_root / "index.json")["assets"]}
    require({key for key, asset in indexed.items() if asset["status"] == "registered"} == ACTIVE,
            "Art index differs from the approved seven active assets")
    expected_paths = {OVERLAY: digest(source)}
    for asset_id in sorted(ACTIVE):
        asset = indexed[asset_id]
        name = asset["file"]
        require(name == Path(name).name and max(asset["size"]) <= 768, "Invalid game derivative")
        expected_paths["assets/mammon-v3/" + name] = asset["sha256"]
    if initial:
        require([(src, attr) for src, attr in final_scripts if src != OVERLAY] == initial_scripts,
                "Existing script registration or order changed")
        require(set(after) - set(before) == set(expected_paths), "Unexpected additions to packaged game")
        require(not (set(before) - set(after)), "Game files removed")
        require({p for p in before if before[p] != after[p]} == {"index.html"},
                "Existing gameplay, audio, art or other mapped bytes changed")
    for path, wanted in expected_paths.items():
        built = repo / "r96/hospital-three-pc/site" / path
        require(built.is_file() and digest(built) == wanted == after[path], f"Wrong registered bytes: {path}")
    return {"base": base_sha, "head": head_sha, "initialRegistration": initial, "registered": expected_paths}


def verify_png(root, row, size):
    name = row["file"]
    require(name == Path(name).name, "Unexpected screenshot path")
    png = root / name
    with png.open("rb") as f:
        header = f.read(24)
    require(header[:8] == b"\x89PNG\r\n\x1a\n" and tuple(size) == struct.unpack(">II", header[16:24]),
            f"Actual PNG size differs for {name}")
    require(row["size"] == size and digest(png) == row["pngSha256"], f"Screenshot bytes differ: {name}")


def physical_hit(root, row, key):
    sequence = row.get(key, {})
    require(sequence.get("status") == "CAPTURED" and sequence["inputReleased"] and not sequence["issues"],
            "Native combat sequence missing or incomplete")
    manifest = root / sequence["manifest"]
    data = read(manifest)
    require(data["status"] == "CAPTURED" and data["inputReleased"] and len(data["frames"]) == 8,
            "Eight real input-sequence frames were not obtained")
    wit = data["witness"]
    require(wit["sameTargetStartQualified"] and wit["targetHpDecreaseObserved"]
            and (wit["confirmedTargetDeathAfterInput"] or wit["targetSeenAfterInput"]),
            "No qualified actual target damage or traced death")
    for frame in data["frames"]:
        path = root / frame["file"]
        require(path.resolve().is_relative_to(root.resolve()) and digest(path) == frame["sha256"],
                "Combat frame hash mismatch")
    return {"actor": data["targetEnemyId"], "initialStage": data["initialStage"], "witness": wit}


def static_views(root, row, version, view):
    dims, scale = VIEWS[view]
    physical = [value * scale for value in dims]
    require(row["cssViewport"] == dims and row["deviceScaleFactor"] == scale
            and row["physicalScreenshotSize"] == physical, "Viewport/DPR differs")
    require(any(sample["delta"] > .03 and not sample["blockedAfter"] for sample in row["input"]),
            "Real movement not observed")
    require(row["frameIntervalSample"]["renderedGameFrameAdvance"] >= 2, "Game render frames did not advance")
    layout = row["layout"]
    require((layout["cells"], layout["walls"], len(layout["doors"])) == (7185, 192, 3),
            "Expanded native geometry changed")
    present = {}
    hashes = set()
    assembled = set()
    for scene in SCENES:
        matches = [m for m in row["markers"] if m["target"]["marker"] == scene]
        require(len(matches) == 1, f"Missing or duplicate {version} {scene}")
        marker = matches[0]
        verify_png(root, marker, physical)
        hashes.add(marker["pngSha256"])
        state, observed = marker["state"], marker["after"]
        require(state["started"] and state["active"] == "three" and state["glLost"] is False and not state["failed"]
                and not any(state[k] for k in ("loading", "modal", "story"))
                and state["player"]["hp"] > 0 and state["zone"] == "ep1b06" and state["layer"] == "STORY"
                and state["r224RoomBounds"] == 48, f"Not a native Mammon view: {version}/{scene}")
        require(observed["fixtureDisplacement"] < .1, f"Static position drift: {version}/{scene}")
        present[scene] = (observed["player"]["x"], observed["player"]["y"])
        if scene in ("exit", "boss-door"):
            door = observed["passage"]
            expected = "door-2" if scene == "exit" else "door-0"
            require(door["id"] == expected and door["center"]["canvasHit"] and len(door["ends"]) == 2
                    and all(p["inView"] for p in door["ends"]), f"Incomplete door aperture: {scene}")
        if version == "after":
            layer = state["overlay"]
            require(layer and layer["registered"] and layer["on"] and state["group"] and not layer["lastError"]
                    and layer["last"]["loaded"] and not layer["last"]["failedAssets"], f"Missing artwork: {scene}")
            assembled.update(layer["last"]["assembledAssets"])
            desired = {"records": "O01", "security": "O02", "vault": "O02"}.get(scene)
            if desired:
                require(any(item["asset"] == desired and item["imageReady"] and item["enabled"]
                            and item["likelyVisible"] for item in observed["desk"]["items"]),
                        f"Furniture missing in {scene}")
        else:
            require(not state["group"] and state["overlay"] is None, "Control has Mammon overlay")
    require(len(hashes) == len(SCENES), "Duplicate static image")
    if version == "after":
        require(assembled == ACTIVE, f"Active rendered assets differ: {sorted(assembled)}")
    return present


def registration_and_capture(args):
    package_data = package(args.repo, args.base, args.head_sha, args.base_sha)
    summaries = read(args.evidence / "summary.json")
    require(summaries["status"] in {"CAPTURED", "INCOMPLETE"}
            and args.strict_exit == (0 if summaries["status"] == "CAPTURED" else 1),
            "Strict capture did not report a normal, auditable outcome")
    initial = package_data["initialRegistration"]
    pairs = summaries["comparisons"]
    if initial:
        require(len(pairs) == 1 and pairs[0]["view"] == args.view and pairs[0]["layoutMatches"],
                "Control and release maps are not identical")
    else:
        require(not pairs and summaries["status"] == "CAPTURED",
                "Expected a completed standalone registered-game capture")
    positions, actors = {}, {}
    versions = ("before", "after") if initial else ("after",)
    for version in versions:
        row = read(args.evidence / f"{version}-{args.view}.json")
        require(row["status"] == "CAPTURED" and not row["issues"],
                f"{version} browser session incomplete: {row['issues']}")
        positions[version] = static_views(args.evidence, row, version, args.view)
        require(row["testSave"]["status"] == "RESTORED_777_TEST_SLOT"
                and row["testSave"]["positionDelta"] <= 1, f"{version} 777 save did not restore")
        require(row["collision"]["result"] == "STOP_AT_CLOSED_FACE_OBSERVED",
                f"{version} closed door was not exercised with input")
        actors[version] = physical_hit(args.evidence, row, "combatSequence" if version == "after" else "baselineCombatSequence")
        shot = next((m for m in row["markers"] if m["target"]["marker"] == "combat"), None)
        require(shot is not None, f"Missing {version} actual combat PNG")
        verify_png(args.evidence, shot, [n * VIEWS[args.view][1] for n in VIEWS[args.view][0]])
        hit = shot["combatWitness"]
        require(hit["nativeActionObserved"] and hit["sameObjectTracked"] and hit["targetHpChanged"]
                and hit["nativeInputAnimation"] and hit["trustedAttackInputObserved"]
                and hit["control"] == {"pc": "keydown-1", "mobile": "touch-native-basic"}[args.view],
                f"{version} damage or input attribution absent")
    require(all(actor["initialStage"] for actor in actors.values()), "Unknown combat stage")
    report = {"accepted": True, "package": package_data, "view": args.view,
              "staticScenes": list(SCENES), "realInput": actors,
              "rawCaptureStatus": summaries["status"], "rawCaptureExit": args.strict_exit}
    if initial:
        comparison = pairs[0]
        require(all(math.dist(positions["before"][key], positions["after"][key]) < .1 for key in SCENES),
                "Static matched comparisons moved")
        require(all(comparison["actualPositionMatches"][key] and comparison["fixturePositionMatches"][key]
                    for key in SCENES), "Static screenshots do not show their requested positions")
        report["combatComparison"] = comparison["alignedCombatStart"]
        report["pairedCombatStatus"] = comparison["pairedCombatStatus"]
        report["actualCombatPositionMatches"] = comparison["actualPositionMatches"]["combat"]
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--base-sha", required=True)
    parser.add_argument("--head-sha", required=True)
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--strict-exit", type=int, required=True)
    parser.add_argument("--view", choices=VIEWS, required=True)
    args = parser.parse_args()
    try:
        report = registration_and_capture(args)
    except (ValueError, OSError, KeyError, TypeError, StopIteration, AssertionError) as e:
        report = {"accepted":False, "reason":str(e), "rawCaptureExit":args.strict_exit, "view":args.view}
    (args.evidence / "release-verification.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False))
    return 0 if report["accepted"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
