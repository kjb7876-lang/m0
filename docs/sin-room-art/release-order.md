# Final registration order

Final manifest: `7c556b345b58e2b1f85f65c9f911b2cb34bc4b4b753968f33a5bf51e88b1ec12`.

The broader workflow preflight found one failure among 221 commands on the earlier `3bc723bd…` build: R118 required its combat script to remain immediately before the final world-tiles script. All its other 35 assertions passed. The R118 test was preserved unchanged. The three new room tags now load immediately before combat-r118, followed by the original combat→world-tiles pair. No overlay JS, generated image, native V16 code or game balance changed. The R176 exact-order expectation was updated to this complete chain.

R118 now passes 36/36 and R176 22/22. Source inspection finds no overlapping R118 function wrappers or API dependency in the three room overlays. The rebuilt site has 6,701 files / 1,058,039,905 bytes. All main tags retain their previous relative order. Original main source and asset preservation still applies.

The earlier build's full inherited suite completed 58/58 groups and 742/742 checks with source immutability confirmed. Its 221-command preflight and the original failure remain archived separately. A new full suite and all targeted native checks are running against this final manifest; earlier results are not relabeled as final-manifest evidence. Final CI and public Pages verification must succeed before deployment is reported complete.

The seven visual release addenda refer to the earlier registration and exact images from that build. This follow-up changes only script registration order; all three overlay JS and their art pixels are identical. Fresh final-manifest Mammon PC/mobile fixtures check the same native commands, V16 ownership, safe/cash and error state. Physical devices, natural combat and animation remain unverified.
