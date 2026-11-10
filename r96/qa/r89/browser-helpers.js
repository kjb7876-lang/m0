/* R89 QA helpers injected into a running page from the loopback capture sink.
 * Test tooling only; never shipped in the game build. Every helper that moves
 * the player, heals or skips narrative is an ASSIST and must be reported as such. */
(()=>{'use strict';
 const SINK='http://127.0.0.1:49330';
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const C=window.StoryPhase1?.ThreeRenderer?.prototype;
 if(C&&!C.__r89Probe){const base=C.render;C.render=function(f){window.__R89_RENDERER__=this;window.__R89_FRAME__=f;return base.call(this,f);};C.__r89Probe=true;}
 async function post(name,body){const r=await fetch(SINK+'/save?name='+encodeURIComponent(name),{method:'POST',body});return{status:r.status,text:await r.text()};}
 // Canvas capture: WebGL world + combat HUD canvas, drawn synchronously after one render.
 // crop: [x,y,w,h] in drawing-buffer pixels around the hero by default when crop===true.
 async function shot(name,{hud=true,crop=null,zoom=1}={}){const gl=document.getElementById('phase1-webgl'),h=document.getElementById('combat-hud-r51');
  window.__STORYWORLD_PHASE1__.controller.draw();const full=document.createElement('canvas');full.width=gl.width;full.height=gl.height;const x=full.getContext('2d');if(!(gl instanceof HTMLCanvasElement))return{status:0,error:'webgl canvas missing'};x.drawImage(gl,0,0);if(hud&&h instanceof HTMLCanvasElement)x.drawImage(h,0,0,full.width,full.height);
  let out=full;if(crop){const k=gl.width/Math.max(1,W);let r=crop;if(crop===true){const p=project(player.x,player.y);r=[p.x*k-260,p.y*k-230,520,320];}
   out=document.createElement('canvas');out.width=Math.round(r[2]*zoom);out.height=Math.round(r[3]*zoom);const o=out.getContext('2d');o.imageSmoothingEnabled=false;o.drawImage(full,r[0],r[1],r[2],r[3],0,0,out.width,out.height);}
  return{...await post(name,out.toDataURL('image/png')),w:out.width,h:out.height};}
 function key(k,ms=80){return new Promise(res=>{const code=k.length===1?'Key'+k.toUpperCase():k;window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code,bubbles:true}));setTimeout(()=>{window.dispatchEvent(new KeyboardEvent('keyup',{key:k,code,bubbles:true}));res();},ms);});}
 function perf(ms=8000,label=''){return new Promise(res=>{const d=[];let last=performance.now();const t0=last;
  function f(t){d.push(t-last);last=t;if(t-t0<ms)requestAnimationFrame(f);else{const s=[...d].sort((a,b)=>a-b),q=p=>+s[Math.min(s.length-1,Math.floor(s.length*p))].toFixed(2);const r=window.__R89_RENDERER__;let objects=0;r?.scene?.traverse(o=>{if(o.isMesh||o.isSprite||o.isPoints||o.isLine)objects++;});
   res({label,frames:d.length,p50:q(.5),p95:q(.95),p99:q(.99),max:+s[s.length-1].toFixed(1),long50:d.filter(x=>x>50).length,heapMB:performance.memory&&+(performance.memory.usedJSHeapSize/1048576).toFixed(1),sceneObjects:objects,commandRows:r?.commands?.rows?.size,geometries:r?.renderer?.info?.memory?.geometries,textures:r?.renderer?.info?.memory?.textures,zone:typeof zone!=='undefined'?zone:null,vw:innerWidth,vh:innerHeight,dpr:devicePixelRatio,hidden:document.hidden});}}
  requestAnimationFrame(f);});}
 async function startHospital(){for(let i=0;i<160&&!(typeof booted!=='undefined'&&booted&&!loading);i++)await sleep(250);
  await window.__STORYWORLD_HOSPITAL_DIRECT_R84__.start();let skipped=0;for(let i=0;i<20&&storyScene;i++){advanceScene();skipped++;await sleep(150);}return{zone,skippedScenes:skipped,player:{x:player.x,y:player.y}};}
 function load(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=SINK+src+(src.includes('?')?'&':'?')+'t='+Date.now();s.onload=()=>res(src);s.onerror=()=>rej(Error('load '+src));document.body.appendChild(s);});}
 function place(x,y){for(const[dx,dy]of[[0,0],[.6,0],[0,.6],[-.6,0],[0,-.6],[1.2,0],[0,1.2],[-1.2,0],[0,-1.2]]){if(!blocked(x+dx,y+dy,.3,room)){player.x=x+dx;player.y=y+dy;return{x:player.x,y:player.y,assist:'coordinate placement'};}}return null;}
 window.__R89QA__=Object.freeze({shot,key,sleep,perf,post,startHospital,load,place,assists:[]});
})();
