/* R99 cleaned actor images. Background-removal leftovers (white rims on the
 * Controller sketch monsters, white mattes inside the seven-sins attack
 * poses) were cleared by scripts/r99-defringe.py into copies under
 * assets/r99/clean/<same path>. The originals stay byte-identical; image
 * loads for these paths fetch the cleaned copy while the cache keeps the
 * original path, so every sprite lookup, save and data row is unchanged.
 * List mirrors r96/r99-defringe.json. Canonical source; see sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_ASSETS_CLEAN_R99__||typeof urlFor!=='function')return;
 const CLEAN=new Set(["assets/u2/generated-v350/u2_observer_spider.webp", "assets/u2/generated-v350/u2_blue_wraith.webp", "assets/u2/generated-v350/u2_memory_orb.webp", "assets/u2/generated-v350/u2_suppression_knight.webp", "assets/u2/generated-v350/u2_cyborg_hound.webp", "assets/u2/generated-v350/u2_reactor_collector.webp", "assets/u2/generated-v350/u2_void_wraith.webp", "assets/u2/generated-v350/u2_resonance_knight.webp", "assets/generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp", "assets/generated-v31224/actors-normalized/838c3c4440d1_u2_suppression_knight.webp", "assets/generated-v31224/actors-normalized/27ef01c10a8f_gluttony-human-attack.webp", "assets/generated-v31224/actors-normalized/53c9ce212489_lust-human-attack.webp", "assets/generated-v31224/actors-normalized/556c32928527_pride_cyborg-human-attack.webp", "assets/generated-v31224/actors-normalized/756dc911bd4f_sloth-human-attack.webp", "assets/generated-v31224/actors-normalized/907c3f3e5d5e_greed-human-attack.webp", "assets/generated-v31224/actors-normalized/9f845f4d58bf_envy-human-attack.webp", "assets/generated-v31224/actors-normalized/b00c6229c058_wrath-human-attack.webp", "assets/generated-v31224/actors-normalized/f121229f2277_pride-human-attack.webp", "assets/generated-v31224/actors-normalized/fbaaf49e0721_greed_child-human-attack.webp"]),stats={redirected:0};
 const base=urlFor;urlFor=function(path,...args){const p=typeof cleanPath==='function'?cleanPath(path):path;if(CLEAN.has(p)){stats.redirected++;return base.call(this,'assets/r99/clean/'+p,...args);}return base.call(this,path,...args);};
 window.__STORYWORLD_ASSETS_CLEAN_R99__=Object.freeze({paths:()=>[...CLEAN],inspect:()=>({revision:'R99-clean-actor-images',count:CLEAN.size,stats:{...stats},originalsChanged:false})});
})();
