'use strict';
const fs=require('fs');
const spec=require('./effect-integration.json');
function patchHTML(html){
 for(const {before,after}of spec.substitutions){
  if(html.includes(after))continue;
  if(html.split(before).length!==2)throw Error('Expected unique R83 effect integration anchor: '+before);
  html=html.replace(before,after);
 }
 const tag=spec.scriptTag;
 if(html.split(tag).length>2)throw Error('Duplicate R83 effect script');
 if(!html.includes(tag))html=html.trimEnd()+'\n'+tag+'\n';
 return html;
}
module.exports={patchHTML};
if(require.main===module){const p=process.argv[2];if(!p)throw Error('Pass index.html path');fs.writeFileSync(p,patchHTML(fs.readFileSync(p,'utf8')));}
