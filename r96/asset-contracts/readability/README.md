# r6 compact readability optional candidates

**Authored derivatives, not restored originals. UNSELECTED pending independent review. No game code, browser, GPU, mobile, gameplay, main merge or deployment is included.**

## Scope

- Hunter bounded reload inspection: two complete 177-frame atlases (hero66 and hero132), retaining layout, canvas, pivot, scale, timeline, 12,590 ms duration and all seven shared phase boundary indices. 61 frames 116–176 differ per resolution. The remaining 116 frames are pixel-identical to r5. No firing or return cycle was invented.
- The primary fault was nearly black, near-transparent shaft pixels: frame128 hero66 shaft had alpha12/255. Only existing nonzero-alpha dark shaft samples beyond the bow/body, source x410..540/y195..202, receive a warm RGB value and minimum coverage. Five frames ease into the change. Alpha support is unchanged; alpha values ARE changed. There is no global bloom, halo, outline, new arrow, scale, pivot or grip movement.
- Five selected compact tracks, 28 frame references: Hunter W/SE/E (six each), Neon W/E (five each). Hand-authored, source-view-guided local masks lift RGB without changing alpha or geometry. Coat masks deliberately omit head/face. This is an optional dark-scene color grade, not universal visual improvement. Light and saturated-background contrast can decrease.
- Earlier Hunter thin-shaft weaknesses at60–84 and108–115 remain untouched because a stable stationary shaft region is not applicable there. Source-authored hand/grip anatomy limitations remain. Native master art is unchanged.

## Files and reproduction

Run `python build.py`, then `python package.py` with Pillow and NumPy. Frozen r5 input manifests and required atlas pages are under inputs; these reproduce the candidate pixels without network access. source-evidence/regrip-source-render.py records the original stationary-arrow geometry. It is evidence, not executed by this recipe.

hero66/integration.json and hero132/integration.json retain original atlas geometry with updated pixel hashes and an authoredReadability annotation. The seven `seams` are historical source-boundary evidence; the assembled candidate uses one shared frame at every boundary, not independently changed duplicate endpoints. Historical source frame hashes describe r5 input, not new derivative bytes.

selected-*/track.json preserves original source timing/pivot metadata and adds derivativeFile/hash. Source path/evidence fields refer to the original r5 package context; they are not asserted to be new local route links. selected-atlas.json maps all28 derivative files to a full-canvas optional atlas. It is not a game route replacement. Null timing stays null.

METRICS.json records382 comparisons (177×2+28). Measures are mean Euclidean RGB distance from each flat background over changed pixels, in sRGB code values, after floating-point alpha compositing. They are diagnostic measures, NOT perceptual readability scores. hero132 metrics describe stored132 pixels; hero132-cpu66 panels separately use premultiplied BILINEAR reduction to113×101 for a CPU half-scale approximation. Real GPU sample-grid/filter behavior remains untested.

Producer inspected all affected frames in15 full-coverage before/after sheets: Hunter2 variants×2 sheets×3 backgrounds and selected1×3. Panels include neighboring unchanged frames. All original/r5 files remain untouched. The producer validation is not a substitute for independent review.
