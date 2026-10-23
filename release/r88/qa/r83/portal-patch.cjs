'use strict';
const fs=require('fs'),path=require('path');
const AUTO_BLOCK="for(const d of Object.keys(regionById[zone].exits))if(distance(player,exitPoint(d))<.85&&!window.__STORYWORLD_DANCES_R74__?.moving(player)){const guideR77=window.__STORYWORLD_GUIDE_R77__,intentR77=guide===true?guideR77?.armNextNormal({kind:'portal',direction:d,source:'native-proximity'},zone,layer):false,resultR77=travel(d);if(intentR77&&resultR77?.then)resultR77.then(ok=>{if(!ok)guideR77.cancelNextNormal(intentR77);},()=>guideR77.cancelNextNormal(intentR77));else if(intentR77&&resultR77===false)guideR77.cancelNextNormal(intentR77);break}",MARKER="/* R83: portal crossing is explicit; walking never dispatches travel. */",TAG="<script src=\"./portal-interaction-r83.js\"></script>";
function patchHTML(html){
 if(!html.includes(MARKER)){
  if(html.split(AUTO_BLOCK).length!==2)throw Error('Expected exactly one native proximity portal loop');
  html=html.replace(AUTO_BLOCK,MARKER);
 }else if(html.includes(AUTO_BLOCK))throw Error('Both old and explicit portal loops are present');
 html=html.replaceAll('출구로 걸어서 이동','포탈 앞에서 E · 이동').replaceAll("hint='E 또는 출구로 이동 · '","hint='포탈 앞에서 E · 이동 · '");
 return html.replaceAll(TAG,'').trimEnd()+'\n'+TAG+'\n';
}
module.exports={patchHTML,AUTO_BLOCK,MARKER};
if(require.main===module){const file=path.resolve(process.argv[2]||path.join(__dirname,'../../hospital-three-pc/site/index.html'));fs.writeFileSync(file,patchHTML(fs.readFileSync(file,'utf8')));fs.copyFileSync(path.join(__dirname,'../../client-source/portal-interaction-r83.js'),path.join(path.dirname(file),'portal-interaction-r83.js'));console.log('R83_EXPLICIT_PORTALS_APPLIED');}
