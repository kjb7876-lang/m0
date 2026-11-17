/* R83: preserve the original Canvas compositing operation in CommandScene.
 * Inject this fragment before CommandScene in the pinned renderer. Original
 * simulation, asset bytes, Canvas recording and painter order are unchanged.
 */
function applyOriginalBlendR83(T, material, operation) {
  if (operation === 'source-over') return material;
  if (operation === 'lighter') {
    // Canvas "lighter" sums premultiplied RGB AND alpha. The original image,
    // solid and gradient shaders output straight RGB, so apply source alpha
    // once to RGB, and use a separate One/One alpha equation. Three's plain
    // AdditiveBlending would apply source alpha to alpha a second time.
    material.blending = T.CustomBlending;
    material.premultipliedAlpha = false;
    material.blendEquation = T.AddEquation;
    material.blendSrc = T.SrcAlphaFactor;
    material.blendDst = T.OneFactor;
    material.blendEquationAlpha = T.AddEquation;
    material.blendSrcAlpha = T.OneFactor;
    material.blendDstAlpha = T.OneFactor;
    material.userData.originalBlendR83 = 'lighter';
    return material;
  }
  if (operation === 'screen') {
    material.blending = T.CustomBlending;
    material.premultipliedAlpha = true;
    material.blendSrc = T.OneFactor;
    material.blendDst = T.OneMinusSrcColorFactor;
    material.blendEquation = T.AddEquation;
    material.blendEquationAlpha = T.AddEquation;
    material.blendSrcAlpha = T.OneFactor;
    material.blendDstAlpha = T.OneMinusSrcAlphaFactor;
    // MeshBasicMaterial has this shader chunk already. The original custom
    // gradient shader does not: screen needs its RGB premultiplied as well.
    if (material.isShaderMaterial && !material.fragmentShader.includes('#include <premultiplied_alpha_fragment>')) {
      const end = material.fragmentShader.lastIndexOf('}');
      if (end < 0) throw Error('Invalid original screen gradient shader');
      material.fragmentShader = material.fragmentShader.slice(0, end) + '\n#include <premultiplied_alpha_fragment>\n' + material.fragmentShader.slice(end);
    }
    material.userData.originalBlendR83 = 'screen';
    return material;
  }
  // Masking used by offscreen actor/VFX canvases stays on those canvases.
  // Never silently substitute source-over for an unknown captured operation.
  throw Error('Unsupported original blend ' + operation);
}
