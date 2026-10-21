# Hospital B1: clean replay for independent review

Historical bcc25e6/297e446 evidence. The later approval-independent test fix and
new canonical execution are documented in [hospital-b1-fixture-fix-review.md](hospital-b1-fixture-fix-review.md).

Execution source: `bcc25e6b7be87212afa6113be1a4d77a60f2309f`.
Tree: `ac7df847be0c39afafe4bbdbdf87d85a4019ecd6`.
The evidence-only successor commit adds these records; it does not change the
19 executable/workflow/harness inputs bound by `clean-checkout-results.json`.
No actual PR has been opened and no source approval pin has been renewed.

## Actual execution

The pinned f415 clean checkout rebuilt R75, R76 and R77 and passed their original
gates. That freshly generated R77 site and the three R74 runtime/manifest files
were explicitly supplied to an isolated candidate checkout in the same machine.
No historical result JSON or personal save supplied the new results.

The final candidate had clean tracked source and exact GitHub commit/tree bytes.
Preparation diagnostics are preserved in `clean-handoff.json`; they are not
counted as successful game checks. In particular, an initial missing sparse
harness failed before executing game functions and was corrected by restoring
the exact tracked bytes. No network protocol was enabled for Git reconstruction.

Fresh whole execution: 2026-10-21 03:41:12.691712–03:46:43.173308 UTC
(12:41:12–12:46:43 KST). All six commands exited zero:

| Suite | Passed | Failed |
| --- | ---: | ---: |
| Hospital runtime / collision / progression / mode transitions | 29 | 0 |
| Mask and resource ownership audit | 10 | 0 |
| Actual R75 → R76 → R77 → B composition | 7 | 0 |
| Isolated test storage | 6 | 0 |
| Separate B source/artifact gate helpers | 14 | 0 |
| Workflow wiring / retained gate contract | 6 | 0 |

Original logs are `clean-command-1.log` through `clean-command-6.log`.
Raw reports and extracted-function hashes are adjacent `clean-*.json` files.
The preflight records source/path hashes, command exit codes, fresh result file
checks, exact artifact hashes and timestamps. Deterministic build/storage JSON
can match old result hashes; the runner actually executed them and required
fresh file timestamps. This does not turn old records into a new run.

Static Node HTTP verification under `/m0/` separately passed 1,914 file hashes,
1,914 HEAD requests and 276 audio Range checks. It is not a browser render.
Production B gate separately refused `review-required` with exit 1, and the
on-disk manifest hash was unchanged. The unchanged R77 gate also actually refused
runtime-producing files added after its old PR21 pin. No gate was skipped.

## Artifact identity

* HTML: `d2b0ac231ffab8463feb9675c06f21b18f63f1372dc5f1723ef99e8a65643d4f`
* Renderer: `a09c0d264510286b397682d51df7d964543794b3d8b058b534a1cd8f5f7cee1d`
* Candidate manifest BEFORE approval stamp:
  `411ff6db94af2fb7ff2e05e1cfa3e6dfa44068595959f8db01bc0f3ea5d136dc`
* Exact CPU review evidence:
  `ed73a5ad50eb0cf799fb8618c85533a31ace0999d8a48ee9c4b4f4877cc85379`
* Cache: `hospital-b1=a09c0d264510286b`
* Save key prefix: `storyworld.hospital-b1.test.v1:`; no original save import.

The final deployment manifest will differ after the actual reviewed build HEAD
and approval stamp. Only the gate's final on-disk hash may be exported for Pages
and compared publicly. See `hospital-b1-pages-review.md` for the exact legitimate
A → B → C pin sequence. Preserve Git ancestry; a squash that discards reviewed
source commits would correctly fail the ancestor checks.

## Remaining release conditions and limits

Independent review of the new Pages/gate/preparation diff and these fresh records
is still required. Freeze a real PR N and full source/evidence commit A, then
approve only the exact B record referencing A/evidence, and finally renew only
the original R77 candidateSource to the resulting B commit. These records are
not yet changed. Main and the public site remain f415; no dispatch/deployment.

The original six spatial/presentation files and runtime bytes remain unchanged.
No new artwork, actors, combat, narrative, other region or save schema changes.
Medical staff versus hallucination semantics remain unresolved and unchanged.

This is CPU/VM assisted-state validation. DOM, input, time and rendering are
substituted; prior campaign progress is seeded and deaths are directly assisted.
The full production version6 outer save validator is still a fixture. Actual
natural campaign, original user saves, real co-op transport, browser frames,
GPU shader compilation, mobile/touch and flashlight appearance remain unverified.
`warmFrameNoAllocation` in the preserved harness means stable root/resource
counts, not zero JS allocation. Seven meshes and 84 triangles are geometry counts,
not measured draw calls or GPU performance. C awaits user play and feedback.
