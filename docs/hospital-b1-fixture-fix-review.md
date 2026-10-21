# Hospital B1 approval-independent negative fixture

This supersedes the CPU evidence attached to bcc25e6/297e446. That historical
evidence remains available unchanged at commit
`297e446ec3613324993a3557fe0d9a712185c0ed`, digest
`ed73a5ad50eb0cf799fb8618c85533a31ace0999d8a48ee9c4b4f4877cc85379`.
Its full local output is also preserved under `out/hospital-b1-before-fixture-fix`.

## Minimal source correction

Exactly one executable file changes: `scripts/hospital-b1-release-gate.cpu.test.py`
(9 added lines, 1 removed). The old negative test assumed the production approval
was always unapproved. It would fail after a legitimate approval. The test now
uses an explicit deep-copy fixture with status `review-required`.

```python
pending = copy.deepcopy(approval); pending['status'] = 'review-required'
check('explicit review-required fixture refuses release regardless of production status',
      lambda: refuses(lambda: gate.validate_source(pending), 'not approved'))
```

A new case starts with the existing valid approved Git fixture:

```python
def approved_fixture_negative():
    before = copy.deepcopy(record)
    negative = copy.deepcopy(record); negative['status'] = 'review-required'
    refuses(lambda: gate.validate_source(negative, repo, {'number': 999}), 'not approved')
    assert record == before and record['status'] == 'approved'
    gate.validate_source(record, repo, {'number': 999})
check('negative fixture copied from approved input refuses without changing approved source',
      approved_fixture_negative)
```

PR999 exists only as data inside the disposable Git fixture. It is not a real
approval or proposed production pin. The production approval file, gate code,
R77 approval, workflow, runtime and assets are unchanged. Production B status
remains `review-required`. No gate or failure is suppressed.

## Fresh final-source execution

Execution source: `e5b97cefd0162d78ad49cbed3f0785ded6b474c3`.
Tree: `e4fe60efa0136be8829243d0f469f9e5e18be17d`.
The evidence-only successor adds these records without changing the executable
source. The preflight binds all 19 source paths; exactly the test path above
has changed since the previous run.

* Test SHA256: `26632de3886e49ab5cf0a5f1279f13c9cb4271d804c1d4437b2234121365158a`
* Production approval SHA256, unchanged:
  `64680d68b0715e15a83176eee2b1a63c150a26ddddb80670fd2bae7bc89edb68`
* New canonical evidence SHA256:
  `0bb8a56f427cbc5d64d0958298225f8edd2dd421b7a1725217c0aa00fa741c14`

Actual whole execution: 2026-10-21 03:55:22.513789–04:00:57.928935 UTC
(12:55:22–13:00:57 KST), with clean tracked source. Every command exited zero:

| Suite | Passed | Failed |
| --- | ---: | ---: |
| Runtime / collision / progression / mode transitions | 29 | 0 |
| Mask / resource audit | 10 | 0 |
| R75 → R76 → R77 → B composition | 7 | 0 |
| Isolated test storage | 6 | 0 |
| Final B gate helpers, including approved-input negative fixture | 15 | 0 |
| Workflow / retained source gate | 6 | 0 |

Canonical evidence: `hospital-b1-evidence/clean-checkout-results.json`.
Adjacent `clean-command-1.log` through `clean-command-6.log` and the six raw
result JSON files are from this new execution. Fresh fixtures were generated
from the previously freshly rebuilt exact f415/R77 baseline. The baseline,
static HTTP and production-gate CLI checks were not needlessly repeated; their
earlier records are retained and are not claimed as new executions.

HTML remains `d2b0ac231ffab8463feb9675c06f21b18f63f1372dc5f1723ef99e8a65643d4f`.
Renderer remains `a09c0d264510286b397682d51df7d964543794b3d8b058b534a1cd8f5f7cee1d`.
The candidate manifest before approval stamp is now
`9791b74df240de961cce51d6ecb66cdee9ee09a835d3a23cd25282830a942a6b`,
because its full build-source SHA changed. It is not the future release manifest.

The actual PR number and full evidence/source commit must be independently
reviewed before the exact B and R77 pin sequence in `hospital-b1-pages-review.md`.
No approval file, main branch, public deployment, backup upload or C-stage work
was changed by this correction. CPU fixture and real-screen limitations remain.
