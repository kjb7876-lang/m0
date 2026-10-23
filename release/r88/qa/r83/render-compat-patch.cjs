'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
function patchRenderer(source){
  const fragment=fs.readFileSync(path.join(root,'client-source/render-compat-r83.js'),'utf8');
  const begin='/* R83_RENDER_COMPAT_BEGIN */',end='/* R83_RENDER_COMPAT_END */';
  if(source.includes(begin)){
    const start=source.indexOf(begin),stop=source.indexOf(end,start);
    if(stop<0)throw Error('Unterminated R83 compatibility fragment');
    source=source.slice(0,start)+begin+'\n'+fragment+'\n'+end+source.slice(stop+end.length);
  }else{
    const anchor='class CommandScene {';
    if(source.split(anchor).length!==2)throw Error('Expected one CommandScene anchor');
    source=source.replace(anchor,begin+'\n'+fragment+'\n'+end+'\n'+anchor);
  }
  const before="if(s.globalCompositeOperation==='screen'){material.blending=T.CustomBlending;material.premultipliedAlpha=true;material.blendSrc=T.OneFactor;material.blendDst=T.OneMinusSrcColorFactor;material.blendEquation=T.AddEquation;material.blendSrcAlpha=T.OneFactor;material.blendDstAlpha=T.OneMinusSrcAlphaFactor;}else if(s.globalCompositeOperation!=='source-over')throw Error('Unsupported original blend '+s.globalCompositeOperation);return material;";
  const after='return applyOriginalBlendR83(T,material,s.globalCompositeOperation);';
  if(!source.includes(after)){
    if(source.split(before).length!==2)throw Error('Expected one original blend dispatch');
    source=source.replace(before,after);
  }
  source=source.replace("!['source-over','screen'].includes(b.globalCompositeOperation)","!['source-over','screen','lighter'].includes(b.globalCompositeOperation)");
  if(!source.includes("!['source-over','screen','lighter'].includes(b.globalCompositeOperation)"))throw Error('Missing paint-reuse blend gate');
  return source;
}
module.exports={patchRenderer};
if(require.main===module){
  const file=process.argv[2];
  if(!file)throw Error('Usage: node render-compat-patch.cjs PATH_TO_PHASE1_JS');
  fs.writeFileSync(file,patchRenderer(fs.readFileSync(file,'utf8')));
}
