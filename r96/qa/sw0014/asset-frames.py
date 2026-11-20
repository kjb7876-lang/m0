"""Check the packaged motion strips, their source identities and mobile texture limits."""
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / "runtime-text"
ART = RUNTIME / "assets/sw0014"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def strips(catalog):
    data = read(catalog)
    if "actors" in data:
        for row in data["actors"].values():
            yield row["path"], data["cell"], data["frames"], row["sha256"], [
                (row[key]["path"], row[key]["sha256"]) for key in ("stance", "contact")
            ]
    else:
        for row in data.get("assets", data.get("sheets", [])):
            cell = row["cell"] if "cell" in row else [row["cw"], row["ch"]]
            yield (row.get("path") or row["file"], cell, row.get("n") or row["frames"],
                   row["sha256"], [(row["source"], row["sourceSha256"])])


def main():
    manifest = {row["path"]: row for row in read(ROOT / "runtime-manifest.json")["files"]}
    covered = set()
    frames = 0
    largest = 0
    for catalog in sorted(ART.rglob("*.json")):
        for path, (width, height), count, digest, sources in strips(catalog):
            assert path not in covered, f"Duplicate entry {path}"
            covered.add(path)
            assert manifest[path]["sha256"] == digest, f"Packaged sheet {path}"
            assert hashlib.sha256((RUNTIME / path).read_bytes()).hexdigest() == digest, path
            for source, expected in sources:
                assert manifest[source]["sha256"] == expected, f"Source changed: {source}"
            with Image.open(RUNTIME / path) as sheet:
                assert sheet.size == (width * count, height), f"Wrong grid in {path}"
                assert count >= 4 and max(sheet.size) <= 2048, f"Mobile strip {path}: {sheet.size}"
                assert "A" in sheet.getbands(), f"Missing transparency in {path}"
                largest = max(largest, *sheet.size)
                keys = set()
                for i in range(count):
                    cell = sheet.crop((i * width, 0, (i + 1) * width, height))
                    alpha = cell.getchannel("A")
                    assert alpha.getextrema()[0] == 0 and alpha.getextrema()[1] >= 64, f"{path} frame {i}"
                    keys.add(hashlib.sha256(cell.tobytes()).digest())
                assert len(keys) == count, f"Repeated frames in {path}"
                frames += count
    actual = {p.relative_to(RUNTIME).as_posix() for p in ART.rglob("*.webp")}
    assert actual and covered == actual, sorted(covered ^ actual)
    print(f"{len(covered)} motion sheets, {frames} distinct cells. Largest texture axis {largest}px.")


if __name__ == "__main__":
    main()
