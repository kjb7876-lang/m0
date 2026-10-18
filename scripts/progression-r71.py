#!/usr/bin/env python3
"""R71 progression patch for the exact generated runtime HTML surface.

The parent release builder composes this pure transform in memory and writes
the manifest once after all R71 transforms have completed.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_OPEN = '<script id="campaign-combat-r63r1">'
SCRIPT_CLOSE = '</script>'
FREEZE_MARKER = "  window.__STORYWORLD_CAMPAIGN_R63R1__=Object.freeze({revision:'R64-candidate'"


def transform_html(html: str) -> str:
    """Inject the R71 progression helper at its unique campaign lexical anchor."""
    if not isinstance(html, str):
        raise TypeError('R71 transform_html expects HTML text')
    if 'R71-DIFFICULTY-DROPS' in html or 'r71DifficultyOptions' in html:
        raise RuntimeError('R71 progression helper is already present')
    if html.count(SCRIPT_OPEN) != 1:
        raise RuntimeError('R71 campaign script anchor mismatch: expected one opening tag')
    start = html.index(SCRIPT_OPEN) + len(SCRIPT_OPEN)
    end = html.find(SCRIPT_CLOSE, start)
    if end < 0:
        raise RuntimeError('R71 campaign script anchor mismatch: missing closing tag')
    if html.count(FREEZE_MARKER) != 1:
        raise RuntimeError('R71 campaign freeze anchor mismatch: expected one exact marker')
    insertion = html.index(FREEZE_MARKER)
    if not start < insertion < end:
        raise RuntimeError('R71 campaign freeze marker is outside its script')
    helper = (ROOT / 'client-source/progression-r71.js').read_text(encoding='utf-8')
    if '</script' in helper.lower():
        raise RuntimeError('Unsafe script terminator in R71 helper')
    return html[:insertion] + helper + '\n' + html[insertion:]
