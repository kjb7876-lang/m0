'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const TAG='<script src="./hospital-settings-r84.js"></script>';
function once(source,before,after,label){if(source.includes(after))return source;if(source.split(before).length!==2)throw Error('R84 settings anchor missing/duplicate: '+label);return source.replace(before,after);}
function patchDirect(source){
 source=once(source,'wrap.append(button,status);document.body.appendChild(wrap);let busy=false;','/* R84_SETTINGS_NATIVE_ACTION */\n wrap.append(button,status);let busy=false;','detached action');
 source=once(source,"  busy=true;button.disabled=true;status.textContent='병원 자료를 읽는 중';",`  const rendererR84=window.__STORYWORLD_PHASE1__?.controller;
  if(!rendererR84||!rendererR84.inspect().requiredThree||rendererR84.state.failed||!rendererR84.state.three){status.textContent=!rendererR84?'Three.js 런타임 누락':rendererR84.state.failed?'Three.js 실행 실패: '+rendererR84.state.reason:'Three.js 화면 준비 중 · 준비 후 다시 시작하세요';return false;}
  busy=true;button.disabled=true;status.textContent='병원 자료를 읽는 중';`,'renderer admission');
 source=once(source,' setInterval(sync,250);sync();',` window.__STORYWORLD_HOSPITAL_DIRECT_R84__=Object.freeze({container:wrap,button,status,start,sync});
 setInterval(sync,250);sync();`,'same native action API');
 return source;
}
function patchPC(source){
 return once(source,` const blockUnavailableInput=e=>{
  if(started&&!rendererReady()&&!ui.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();clearControls();}
 };`,` // R84: renderer failures stop combat input, while diagnostics remain reachable in Settings.
 const diagnosticControlR84=e=>e.key==='Escape'||$('menuBtn')?.contains(e.target)||$('panel')?.contains(e.target);
 const blockUnavailableInput=e=>{
  if(started&&!rendererReady()&&!ui.contains(e.target)&&!diagnosticControlR84(e)){e.preventDefault();e.stopImmediatePropagation();clearControls();}
 };`,'diagnostic input admission');
}
function patchHTML(source){if(source.split(TAG).length>2)throw Error('Duplicate R84 hospital settings runtime');return source.includes(TAG)?source:source.trimEnd()+'\n'+TAG+'\n';}
function apply(target){const site=target&&path.basename(target)==='index.html'?path.dirname(target):target||path.join(root,'hospital-three-pc/site'),index=path.join(site,'index.html'),direct=path.join(site,'hospital-direct-test.js'),pc=path.join(site,'hospital-pc-test.js');
 fs.writeFileSync(direct,patchDirect(fs.readFileSync(direct,'utf8')));fs.writeFileSync(pc,patchPC(fs.readFileSync(pc,'utf8')));fs.writeFileSync(index,patchHTML(fs.readFileSync(index,'utf8')));fs.copyFileSync(path.join(root,'client-source/hospital-settings-r84.js'),path.join(site,'hospital-settings-r84.js'));
 return{revision:'R84',settingsOnly:true,nativeActionPreserved:true};
}
module.exports={patchDirect,patchPC,patchHTML,apply};if(require.main===module)console.log(JSON.stringify(apply(process.argv[2])));
