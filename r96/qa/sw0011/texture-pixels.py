"""Verify every decoded RGBA pixel in the two mobile textures. Requires Pillow."""
from pathlib import Path

from PIL import Image


assets = Path(__file__).resolve().parents[2] / "runtime-text" / "assets"
with Image.open(assets / "r600/dots/sv-beam-01.webp") as original:
    source = original.convert("RGBA")
assert source.size == (12288, 48)
for page_index in range(2):
    with Image.open(assets / "sw0011" / f"beam-{page_index}.webp") as image:
        page = image.convert("RGBA")
    assert page.size == (2048, 144)
    for cell in range(12):
        frame = page_index * 12 + cell
        x, y = (cell % 4) * 512, (cell // 4) * 48
        actual = page.crop((x, y, x + 512, y + 48))
        expected = source.crop((frame * 512, 0, (frame + 1) * 512, 48))
        assert actual.tobytes() == expected.tobytes(), f"RGBA mismatch at frame {frame}"
print("PASS all 24 beam frames, 589824 decoded RGBA pixels identical")
