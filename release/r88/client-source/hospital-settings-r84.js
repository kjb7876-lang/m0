/* R84: the existing hospital test action belongs only to Settings. Its native
 * restore, admission, save isolation and diagnostics remain authoritative. */
(()=>{'use strict';
 if(window.__STORYWORLD_HOSPITAL_SETTINGS_R84__)return;
 const direct=window.__STORYWORLD_HOSPITAL_DIRECT_R84__;
 if(!direct)throw Error('Hospital settings integration is missing the native action');
 const parking=document.createElement('div'),launcher=direct.container,diagnostics=document.getElementById('hospitalPCTest');
 const stats={mounts:0,parks:0};
 launcher.style.cssText='position:static;margin-top:10px;padding:12px;border:1px solid #b6a16a;border-radius:8px;background:#17232b;color:#fff';
 launcher.hidden=false;direct.button.type='button';direct.button.setAttribute('aria-describedby','hospitalDirectStatus');direct.status.setAttribute('role','status');direct.status.setAttribute('aria-live','polite');
 if(diagnostics)diagnostics.style.cssText='position:static;margin-top:12px;padding:10px;border:1px solid #739796;border-radius:6px;background:#101e29;color:#eff8f4;font:12px sans-serif';
 function park(){parking.appendChild(launcher);if(diagnostics)parking.appendChild(diagnostics);stats.parks++;}
 park();
 const openBase=openPanel;openPanel=function(...args){park();return openBase.apply(this,args);};
 const closeBase=closePanel;closePanel=function(...args){const result=closeBase.apply(this,args);if(!modal)park();return result;};
 function titleSettings(){
  const panel=document.getElementById('panel');if(!panel||!(document.getElementById('campaignNew54')||document.getElementById('newBtn'))||document.getElementById('titleSettingsR84'))return;
  const button=document.createElement('button');button.id='titleSettingsR84';button.type='button';button.textContent='설정';button.onclick=()=>showSettings();
  (panel.querySelector('.hospitalStartButtons50')||panel.querySelector('.actions')||panel).appendChild(button);
 }
 const titleBase=showTitle;showTitle=function(...args){const result=titleBase.apply(this,args);titleSettings();return result;};
 const settingsBase=showSettings;showSettings=function(...args){
  const result=settingsBase.apply(this,args),panel=document.getElementById('panel');if(!panel?.querySelector('#settingsClose'))return result;
  const section=document.createElement('section');section.id='hospitalTestSettingsR84';section.className='hospital-test-settings-r84';
  const heading=document.createElement('h3');heading.textContent='병원 테스트';
  const note=document.createElement('p');note.className='small muted';note.textContent='기존 병원 직행 테스트를 별도 테스트 저장으로 시작합니다.';
  section.append(heading,note,launcher);if(diagnostics)section.appendChild(diagnostics);panel.appendChild(section);
  launcher.hidden=false;direct.sync();stats.mounts++;return result;
 };
 const hudBase=updateHUD;updateHUD=function(...args){const result=hudBase.apply(this,args);if(!modal&&(launcher.isConnected||diagnostics?.isConnected))park();return result;};
 titleSettings();
 window.__STORYWORLD_HOSPITAL_SETTINGS_R84__=Object.freeze({inspect:()=>({revision:'r84-settings-only',...stats,launcherParent:launcher.parentElement?.id||null,diagnosticsParent:diagnostics?.parentElement?.id||null,attachedToSettings:launcher.parentElement?.id==='hospitalTestSettingsR84',actionPreserved:true,testSaveSchemaChanged:false})});
})();
