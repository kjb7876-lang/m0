'use strict';
const fs=require('fs');
const files=['vfx-selected-data-r83.js','vfx-selected-r83.js'];
function patchHTML(html){
 for(const name of files){const tag='<script src="./'+name+'"></script>';if(html.split(tag).length>2)throw Error('Duplicate '+name);html=html.replace(tag+'\n','').trimEnd();}
 return html+'\n'+files.map(name=>'<script src="./'+name+'"></script>').join('\n')+'\n';
}
module.exports={patchHTML};
if(require.main===module){const p=process.argv[2];if(!p)throw Error('Pass index path');fs.writeFileSync(p,patchHTML(fs.readFileSync(p,'utf8')));}
