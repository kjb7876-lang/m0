/* PC-only test shell. Native combat, slot transactions and narrative own play.
 * No automatic play/warps/cheats. Telemetry is bounded and reports raw samples. */
(() => {
 'use strict';
 const capacity=6000, samples=[], faults=[], assets=[], context={lost:0}, histogram=new Uint32Array(4001),meters=new WeakMap(),
       clock=()=>performance.now();
 let last=0,lastSample=0,startedAt=0,controllerWrapped=false,frameCount=0,stalls=0,previousPlaying=false;
 const ui=document.createElement('aside');ui.id='hospitalPCTest';
 ui.style.cssText='position:fixed;right:10px;top:64px;z-index:13000;max-width:340px;background:#101e29ed;color:#eff8f4;border:1px solid #739796;border-radius:6px;padding:8px;font:12px sans-serif';
 const state=document.createElement('div'),help=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p'),download=document.createElement('button');
 summary.textContent='PC 조작 / 검사 기록';
 text.textContent='방향키 이동·마우스 이동 / 좌클릭 표적·공격 / A·J·1 기본 공격 / S·2 회피 / D·3 방어 / Q·4 특수기 / F·5 EGO / E 상호작용 / Space 반자동 / Esc 메뉴·설정 / 저장 메뉴 3슬롯. 병원 앞 진행만 준비한 직행 테스트이며 원본 저장은 읽지 않습니다. 실제 화면 검증 전 후보입니다.';
 download.textContent='현재 검사 기록 저장';
 help.append(summary,text,download);ui.append(state,help);document.body.appendChild(ui);
 function recordFault(kind,message){if(faults.length<64)faults.push({at:clock(),kind,message:String(message).slice(0,600)});}
 window.addEventListener('error',e=>{
  if(e.target?.src){if(assets.length<64)assets.push(String(e.target.src).split('?')[0]);}
  else recordFault('error',e.message||'unknown script error');
 },true);
 window.addEventListener('unhandledrejection',e=>recordFault('rejection',e.reason?.message||e.reason));
 function percentile(p){if(!frameCount)return null;const goal=Math.floor((frameCount-1)*p)+1;let n=0;for(let i=0;i<histogram.length;i++){n+=histogram[i];if(n>=goal)return i/4;}return null;}
 function report(){
  const runtime=window.__STORYWORLD_PHASE1__?.inspect(),n=clock();
  return {schema:'hospital-pc-observed/v1',kind:'browser observations; acceptance requires review of actual play',
   elapsedSeconds:startedAt?(n-startedAt)/1000:0,sampleCount:samples.length,capacity,
   observedFrames:frameCount,frameP50ms:percentile(.5),frameP95ms:percentile(.95),stallsOver100ms:stalls,
   measurement:'All foreground unpaused draw intervals, histogram rounded to 0.25ms and capped at 1000ms; resource trend sampled every 250ms. NOT GPU elapsed time; continuous ten-minute combat must be separately confirmed',
   renderer:runtime||null,contextLosses:context.lost,faults:[...faults],missingAssetRequests:[...assets],samples:samples.slice(),
   naturalPlayConfirmed:false,tenMinuteContinuousCombatConfirmed:false,physicalGPUVerified:false,WindowsVerified:false,mobileExcluded:true,
   new84AssetsApplied:!!window.__STORYWORLD_HOSPITAL_MAZE_VISUALS__};
 }
 download.onclick=()=>{const b=new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='hospital-pc-observed.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 // Attach to the actual controller used by draw(). No second animation loop,
 // renderer, or synthetic performance samples are created.
 function attach(){
  const controller=window.__STORYWORLD_PHASE1__?.controller;
  if(!controller){state.textContent='Three.js 런타임 누락 · 병원 시작 불가';return;}
  if(controllerWrapped)return;
  controllerWrapped=true;const base=controller.draw;
  controller.draw=function(...args){const n=clock(),frameMs=last?n-last:null;last=n;
   const renderer=controller.state.three?.renderer;let meter=renderer&&meters.get(renderer);
   if(renderer&&!meter){meter={calls:0,triangles:0};meters.set(renderer,meter);const render=renderer.render;renderer.render=function(...args){const beforeCalls=this.info.render.calls,beforeTriangles=this.info.render.triangles,r=render.apply(this,args);meter.calls+=this.info.render.calls-(this.info.autoReset===false?beforeCalls:0);meter.triangles+=this.info.render.triangles-(this.info.autoReset===false?beforeTriangles:0);return r;};}
   if(meter){meter.calls=0;meter.triangles=0;}
   const r=base.apply(this,args),status=controller.state;
   if(started&&status.active==='three'&&!status.failed){
    if(!startedAt)startedAt=n;
    state.textContent='Three.js 실행 중 · 병원 미로 PC 테스트';
    const playing=!modal&&!loading&&!document.hidden;
    if(playing&&previousPlaying&&Number.isFinite(frameMs)){frameCount++;histogram[Math.min(4000,Math.max(0,Math.round(frameMs*4)))]++;if(frameMs>100)stalls++;}
    previousPlaying=playing;
    if(n-lastSample>=250){lastSample=n;const t=controller.state.three,
     memory=performance.memory?.usedJSHeapSize;
     if(samples.length===capacity)samples.shift();samples.push({atSeconds:(n-startedAt)/1000,frameMs,
      zone,layer,paused:!!(modal||loading||document.hidden),enemies:room?.enemies?.filter(e=>e.hp>0&&e.spawnState==='active').length||0,
      projectiles:projectiles.filter(p=>!p.dead).length,effects:effects.filter(e=>e.age<e.life).length,
      drawCalls:meter?.calls??null,triangles:meter?.triangles??null,textures:t?.renderer?.info?.memory?.textures??null,
      geometries:t?.renderer?.info?.memory?.geometries??null,jsHeapBytes:Number.isFinite(memory)?memory:null});
    }
   } else if(started){previousPlaying=false;
    state.textContent=status.failed?'Three.js 오류: 플레이 중단 · '+status.reason:'Three.js 화면 준비 중 · Canvas 플레이로 대체하지 않습니다.';
    // Fail visibly and stop simulation instead of silently playing a fallback.
    // Do not persist an error-induced pause into a save.
    if(status.failed){modal=true;clearControls();}
   } else {previousPlaying=false;state.textContent='Three.js 병원 미로 · 직행 시작 버튼을 누르세요';}
   const gl=document.getElementById('phase1-webgl');
   if(gl&&!gl.dataset.pcContextWatch){gl.dataset.pcContextWatch='1';gl.addEventListener('webglcontextlost',()=>context.lost++);}
   return r;
  };
 }
 // Prevent stuck held input when focus leaves the desktop game.
 window.addEventListener('blur',clearControls);
 document.addEventListener('visibilitychange',()=>{last=0;previousPlaying=false;clearControls();});
 // Enforce readiness for every native start/load/import path, not just the
 // convenience button. Installed after the preserved runtime wrappers.
 const nativeTick=tick;
 const rendererReady=()=>{const c=window.__STORYWORLD_PHASE1__?.controller;return !!(c?.state.three&&!c.state.failed);};
 tick=function(...args){const c=window.__STORYWORLD_PHASE1__?.controller;
  if(started&&(!c||c.state.failed||!c.state.three)){clearControls();return;}
  return nativeTick.apply(this,args);
 };
 if(!window.__STORYWORLD_PHASE1__?.controller){
  draw=function(){canvas.style.opacity='0';clearControls();state.textContent='Three.js 런타임 누락 · 플레이 중단';};
 }
 // Native actions can execute directly from a button without waiting for tick.
 // Protect their admission too; keep native calculations/timing unchanged.
 const requireRenderer=fn=>function(...args){if(!rendererReady())return false;return fn.apply(this,args);};
 basicAttack=requireRenderer(basicAttack);blink=requireRenderer(blink);
 guardStart=requireRenderer(guardStart);special=requireRenderer(special);
 ego=requireRenderer(ego);interact=requireRenderer(interact);
 commandMove=requireRenderer(commandMove);travel=requireRenderer(travel);
 const blockUnavailableInput=e=>{
  if(started&&!rendererReady()&&!ui.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();clearControls();}
 };
 for(const name of ['pointerdown','click','keydown'])window.addEventListener(name,blockUnavailableInput,true);
 function editing(e){return ['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable;}
 window.addEventListener('keydown',e=>{
  if(editing(e)||!started||modal||loading||storyScene)return;
  const key=e.key.toLowerCase();
  // The preserved game owns arrows for movement and A/1 for basic attack.
  // J is an extra PC alias. Do not map A to left movement here: that capture
  // used to swallow the native basic-attack binding.
  if(key==='j'){e.preventDefault();e.stopImmediatePropagation();keys.add('attack');if(!e.repeat)basicAttack(true);}
 },true);
 window.addEventListener('keyup',e=>{
  if(editing(e))return;
  const key=e.key.toLowerCase();
  if(key==='j'){e.preventDefault();e.stopImmediatePropagation();keys.delete('attack');}
 },true);
 canvas.addEventListener('pointerdown',e=>{
  if(e.button===0&&started&&!modal&&!loading&&!storyScene)basicAttack(true);
 });
 const start=document.getElementById('hospitalDirectStart'),startStatus=document.getElementById('hospitalDirectStatus');
 if(start){const nativeStart=start.onclick;start.onclick=(...args)=>{
  const c=window.__STORYWORLD_PHASE1__?.controller;
  if(!c||!c.inspect().requiredThree||c.state.failed||!c.state.three){
   const message=!c?'Three.js 런타임 누락':c.state.failed?'Three.js 실행 실패: '+c.state.reason:'Three.js 화면 준비 중 · 준비 후 다시 시작하세요';
   state.textContent=message;if(startStatus)startStatus.textContent=message;return false;
  }
  return nativeStart.apply(start,args);
 };}
 attach();
 window.__STORYWORLD_HOSPITAL_PC__=Object.freeze({inspect:report,attach,capacity});
})();
