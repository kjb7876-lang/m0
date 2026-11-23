// R1304 3D 환도 마감 브라우저 검사.
// Playwright가 없는 로컬 Windows에서도 실행할 수 있게 Chromium DevTools Protocol만 쓴다.
// 실행 예:
//   msedge --headless=new --remote-debugging-port=9223 --use-angle=swiftshader --enable-unsafe-swiftshader about:blank
//   node --experimental-websocket r96/qa/r1304/r1304-browser.mjs --before
//   node --experimental-websocket r96/qa/r1304/r1304-browser.mjs
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';

if(typeof WebSocket!=='function')throw Error('Node WebSocket 필요: node --experimental-websocket 로 실행');
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(process.env.SW_SITE||path.resolve(HERE,'..','..','runtime-text'));
const BASE=path.resolve(HERE,'..','..','..','docs');
const EXTRA=process.env.SW_ASSETS?path.resolve(process.env.SW_ASSETS):null;
const BEFORE=process.argv.includes('--before');
const PORT=Number(process.env.SW_PORT||4410);
const GAME_URL=process.env.SW_URL||`http://127.0.0.1:${PORT}/`;
const CDP=process.env.SW_CDP||'http://127.0.0.1:9223';
const OUT=HERE;
// R1305 부터 그룹 이름이 영웅별(r1305-<id>-3d-shared). R1304 판에서 돌리면 옛 이름.
const GROUP_EXPR=`(window.__STORYWORLD_HWANDO3D_R1302__?.revision||'').startsWith('R1305')?'r1305-hwando-3d-shared':'r1304-hwando3d-shared'`;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.css':'text/css; charset=utf-8'};
const IMAGE_FALLBACK=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+Xup8WQAAAABJRU5ErkJggg==','base64');

function staticServer(){
 return http.createServer((req,res)=>{
  let u;try{u=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch(_){res.writeHead(400);res.end();return;}
  if(u==='/')u='/index.html';let file=path.resolve(ROOT,'.'+u);
  if(!(file===ROOT||file.startsWith(ROOT+path.sep))){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file)&&EXTRA){const extra=path.resolve(EXTRA,'.'+u);if(extra===EXTRA||extra.startsWith(EXTRA+path.sep))file=extra;}
  if(!fs.existsSync(file)){const inherited=path.resolve(BASE,'.'+u);if(inherited===BASE||inherited.startsWith(BASE+path.sep))file=inherited;}
  fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){if(/\.(?:avif|gif|jpe?g|png|webp)$/i.test(file)){res.writeHead(200,{'content-type':'image/png','cache-control':'no-store','x-storyworld-qa-fallback':'1'});res.end(IMAGE_FALLBACK);return;}res.writeHead(404);res.end();return;}
   res.writeHead(200,{'content-type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(res);
  });
 });
}

class Session{
 constructor(ws){this.ws=new WebSocket(ws);this.seq=0;this.sessionId='';this.pending=new Map();this.events=[];this.requests=[];this.errors=[];}
 async open(){await new Promise((resolve,reject)=>{this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true});});
  this.ws.addEventListener('message',async event=>{let data=event.data;if(typeof data!=='string')data=await data.text();const row=JSON.parse(data);if(row.id){const p=this.pending.get(row.id);if(!p)return;this.pending.delete(row.id);row.error?p.reject(Error(JSON.stringify(row.error))):p.resolve(row.result);return;}
   this.events.push(row);if(row.method==='Network.requestWillBeSent')this.requests.push(row.params.request.url);if(row.method==='Runtime.exceptionThrown')this.errors.push(row.params.exceptionDetails?.exception?.description||row.params.exceptionDetails?.text||'page exception');
  });return this;}
 send(method,params={},root=false){return new Promise((resolve,reject)=>{const id=++this.seq;this.pending.set(id,{resolve,reject});const row={id,method,params};if(this.sessionId&&!root)row.sessionId=this.sessionId;this.ws.send(JSON.stringify(row));});}
 async attach(){const made=await this.send('Target.createTarget',{url:'about:blank'},true);const attached=await this.send('Target.attachToTarget',{targetId:made.targetId,flatten:true},true);this.sessionId=attached.sessionId;return made.targetId;}
 async eval(expression){const row=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(row.exceptionDetails)throw Error(row.exceptionDetails.exception?.description||row.exceptionDetails.text);return row.result.value;}
 async wait(expression,timeout=180000){const end=Date.now()+timeout;let last;while(Date.now()<end){try{last=await this.eval(expression);if(last)return last;}catch(error){last=String(error);}await new Promise(r=>setTimeout(r,100));}throw Error(`timeout: ${expression}; last=${last}`);}
 async frames(n=2){return this.eval(`new Promise(resolve=>{let n=${n};const f=()=>--n?requestAnimationFrame(f):resolve(true);requestAnimationFrame(f);})`);}
 async viewport(width,height,dpr=1){await this.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:false});await this.frames(3);}
 async shot(file){const row=await this.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(path.join(OUT,file),Buffer.from(row.data,'base64'));}
 close(){this.ws.close();}
}

let server=null;
try{
 if(!process.env.SW_URL){server=staticServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(PORT,'127.0.0.1',resolve);});}console.log('stage server');
 const version=await (await fetch(`${CDP}/json/version`)).json();const p=await new Session(version.webSocketDebuggerUrl).open();
 const targetId=await p.attach();console.log('stage target '+targetId);console.log('stage websocket');
 await p.send('Page.enable');await p.send('Runtime.enable');await p.send('Network.enable');await p.viewport(1280,720,1);console.log('stage domains');
 await p.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.clear();sessionStorage.clear();localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));let __r1304Seed=0x1304;Math.random=()=>{__r1304Seed|=0;__r1304Seed=__r1304Seed+0x6d2b79f5|0;let t=Math.imul(__r1304Seed^__r1304Seed>>>15,1|__r1304Seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};`});
 await p.send('Page.navigate',{url:GAME_URL});await p.wait(`document.readyState==='complete'`);console.log('stage loaded');
 await p.wait(`!!document.querySelector('#campaignNew54')`);await p.eval(`document.querySelector('#campaignNew54').click();true`);console.log('stage new');
 await p.wait(`!!document.querySelector('#slotConfirmR73')`);await p.eval(`document.querySelector('#slotConfirmR73').click();true`);console.log('stage slot');
 await p.wait(`typeof started!=='undefined'&&started&&typeof loading!=='undefined'&&!loading`,240000);console.log('stage started');
 const skip=`(()=>{for(let i=0;i<160&&typeof storyScene!=='undefined'&&storyScene;i++)advanceScene();if(typeof modal!=='undefined'&&modal)closePanel(true);return true;})()`;
 await p.eval(skip);await p.eval(`window.__STORYWORLD_CHEAT777__.activate('777')`);await p.wait(`typeof loading!=='undefined'&&!loading`,90000);await p.eval(skip);
 await p.eval(`(()=>{if(room?.id!=='dist00')enterRegion('dist00',null,{layer:'STORY',restore:true});return true;})()`);await p.wait(`!loading&&room?.id==='dist00'`,150000);await p.eval(skip);
 await p.eval(`(async()=>{await ensureImages(heroPaths('hwando'));await ensureImages(heroPaths('neon'));player.hero='hwando';player.visible=true;player.disabled=false;player.hp=player.maxHp=99999;const pose=heroPose();await ensureImages([typeof pose==='string'?pose:pose?.path].filter(Boolean));for(const e of room.enemies){e.speed=0;e.damage=0;}return true;})()`);
 const glbReq=()=>p.requests.filter(u=>/\/assets\/r1302\/hwando-3d\.glb(?:$|[?#])/.test(u));
 const loaderReq=()=>p.requests.filter(u=>/\/vendor\/three\/examples\/jsm\/loaders\/GLTFLoader\.js(?:$|[?#])/.test(u));
 const placeAtWall=`(()=>{const ref={x:88,y:60.5},ws=(room.exploration?.walls||[]).filter(w=>w.height>.8&&(w.width>1||w.depth>1)).sort((a,b)=>Math.hypot(a.x-ref.x,a.y-ref.y)-Math.hypot(b.x-ref.x,b.y-ref.y)),w=ws[0];if(!w)return null;const horizontal=w.width>=w.depth,x=w.x-(horizontal?0:w.width/2+.18),y=w.y-(horizontal?w.depth/2+.18:0),hold=()=>{player.x=x;player.y=y;player.moving=false;player.moveVX150=player.moveVY150=0;if(Array.isArray(player.path))player.path.length=0;if(typeof cam==='object'&&cam){cam.x=x;cam.y=y;}};clearInterval(window.__r1304QaHold);hold();window.__r1304QaHold=setInterval(hold,8);for(const e of room.enemies){e.speed=0;e.damage=0;}return{x,y,wall:{x:w.x,y:w.y,width:w.width,depth:w.depth,height:w.height}};})()`;
 let fail=0;const ok=(condition,message)=>{console.log((condition?'ok  ':'FAIL')+' '+message);if(!condition)fail++;};
 ok(glbReq().length===0&&loaderReq().length===0,'기본 꺼짐: GLB/GLTFLoader 요청 0 ('+glbReq().length+'/'+loaderReq().length+')');
 const stack0=await p.eval(`({r350:window.__STORYWORLD_HERO_VISIBILITY_R350__?.inspect?.().stats?.heroFound||0,r448:window.__STORYWORLD_DEPTH_OVERLAP_R448__?.inspect?.().stats?.heroFound||0})`);
 await p.eval(`window.__STORYWORLD_HWANDO3D_R1302__.set(true)`);await p.wait(`window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.().ready===true`,180000);await p.frames(20);await p.wait(`window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.().shown===true`,30000);await p.frames(8);
 const inspect=await p.eval(`window.__STORYWORLD_HWANDO3D_R1302__.inspect()`);
 if(BEFORE){
  const placed=await p.eval(placeAtWall);await p.frames(90);console.log('BEFORE '+JSON.stringify({...inspect,placed}));await p.shot('before-pc.png');await p.viewport(844,390,1);await p.frames(12);await p.shot('before-mobile.png');await p.eval(`clearInterval(window.__r1304QaHold);true`);
 }else{
  ok(/^R130[45]/.test(inspect.revision),'R1304(또는 후속 R1305) 판 ('+inspect.revision+')');ok(inspect.sharedScene===true,'기존 Three 장면 공유');ok(inspect.overlayCanvas===false,'별도 WebGL 캔버스 없음');
  ok(inspect.hostLayer===2,'몸/벽과 같은 깊이 층 2');ok(inspect.errors===0,'로더 오류 0 ('+inspect.errors+')');ok(glbReq().length===1&&loaderReq().length===1,'첫 켬 GLB/GLTFLoader 요청 각 1 ('+glbReq().length+'/'+loaderReq().length+')');
  const manifest=JSON.parse(fs.readFileSync(path.resolve(HERE,'..','..','runtime-manifest.json'),'utf8'));
  const expectedBytes=manifest.files.find(file=>file.path==='assets/r1302/hwando-3d.glb')?.bytes;
  ok(Number.isSafeInteger(expectedBytes)&&expectedBytes>0&&inspect.bytes===expectedBytes,'읽은 GLB 바이트 기록 ('+inspect.bytes+' / '+expectedBytes+')');
  ok(Number.isFinite(inspect.fetchMs)&&Number.isFinite(inspect.parseMs)&&Number.isFinite(inspect.loadMs),'fetch/parse/load 시간 기록');
  const graph=await p.eval(`(()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,g=r?.scene?.getObjectByName(${GROUP_EXPR});const ms=[];g?.traverse(o=>{if(o.isMesh){const a=Array.isArray(o.material)?o.material:[o.material];ms.push({mask:o.layers.mask,depthTest:a.every(m=>m?.depthTest),depthWrite:a.every(m=>m?.depthWrite)});}});const hero=[...(r?.commands?.rows?.values?.()||[])].filter(x=>x.mesh?.userData?.owner?.kind==='hero'&&x.geometryState?.kind==='image');return{group:!!g,parent:g?.parent===r?.scene,meshes:ms,canvas:!!document.getElementById('hwando3dR1302'),bodyRows:hero.filter(x=>x.mesh.userData.spatialRole==='body').length,fxRows:hero.filter(x=>x.mesh.userData.spatialRole!=='body').length};})()`);
  ok(graph.group&&graph.parent,'GLTF 그룹이 활성 장면에 붙음');ok(graph.meshes.length>0&&graph.meshes.every(x=>(x.mask&4)!==0&&x.depthTest===true),'모든 메시가 깊이 층 2 + depthTest');ok(!graph.canvas,'옛 오버레이 canvas DOM 없음');ok(graph.bodyRows===0,'3D 켬: 2D 영웅 몸 행만 제거 ('+graph.bodyRows+')');
  const stack1=await p.eval(`({r350:window.__STORYWORLD_HERO_VISIBILITY_R350__?.inspect?.().stats?.heroFound||0,r448:window.__STORYWORLD_DEPTH_OVERLAP_R448__?.inspect?.().stats?.heroFound||0})`);ok(stack1.r350>stack0.r350&&stack1.r448>stack0.r448,'R350/R448가 몸을 먼저 처리한 뒤 3D 치환 '+JSON.stringify({before:stack0,after:stack1}));
  await p.wait(`(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();if(i.bodyFrames>0&&Number.isFinite(i.lastBodyAlpha)){window.__r1304BodyDiag=i;return true;}return false;})()`,5000);const bodyDiag=await p.eval(`window.__r1304BodyDiag`);ok(Math.abs(bodyDiag.opacity-bodyDiag.lastBodyAlpha)<.001&&bodyDiag.depthWrite===(bodyDiag.opacity>=.98),'선택한 몸 alpha/depthWrite 일치 '+JSON.stringify({bodyFrames:bodyDiag.bodyFrames,alpha:bodyDiag.lastBodyAlpha,opacity:bodyDiag.opacity,depthWrite:bodyDiag.depthWrite}));
  await p.eval(`player.samong=10;player.shield=9999;true`);await p.wait(`window.__STORYWORLD_HWANDO3D_R1302__.inspect().lastHeroFx>0`,5000);const fxProbe=await p.eval(`(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,i=window.__STORYWORLD_HWANDO3D_R1302__.inspect(),fx=[...r.commands.rows.values()].filter(x=>x.mesh?.userData?.owner?.kind==='hero'&&x.geometryState?.kind==='image'&&x.mesh.userData.spatialRole!=='body').length;player.samong=0;player.shield=0;return{images:i.lastHeroImages,bodies:i.lastBodies,heroFx:i.lastHeroFx,renderedFx:fx};})()`);ok(fxProbe.heroFx>0&&fxProbe.images===fxProbe.bodies+fxProbe.heroFx&&fxProbe.renderedFx>0,'같은 hero scope 방어막·오라·사몽 십자 보존 '+JSON.stringify(fxProbe));await p.wait(`window.__STORYWORLD_HWANDO3D_R1302__.inspect().shown`,5000);
  const spawned=await p.eval(`window.__STORYWORLD_CLONE_R767__?.spawn?.(player.x+1.2,player.y,{life:1.5,alpha:.7,dir:player.direction})===true`);await p.frames(8);const cloneProbe=await p.eval(`(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,rows=[...r.commands.rows.values()].filter(x=>x.mesh?.userData?.owner?.kind==='hero'&&x.geometryState?.kind==='image'),at=x=>Math.hypot((x.mesh.userData.owner.x??0)-player.x,(x.mesh.userData.owner.y??0)-player.y);return{near:rows.filter(x=>at(x)<.05).length,far:rows.filter(x=>at(x)>.8).length,total:rows.length};})()`);ok(spawned&&cloneProbe.near===0&&cloneProbe.far>0,'R113 재귀 분신은 2D 보존, 본체만 3D '+JSON.stringify(cloneProbe));
  const m=await p.eval(`window.__STORYWORLD_HWANDO3D_R1302__.measure()`),q=await p.eval(`project(player.x,player.y)`),h=await p.eval(`actorHeight()`);
  ok(m&&Math.abs(m.bottom-q.y)<=6,'발 기준점 오차 '+(m?m.bottom-q.y:'null')+'px');ok(m&&m.bottom-m.top>h*.75&&m.bottom-m.top<h*1.5,'화면 몸키 '+(m?m.bottom-m.top:'null')+'px (기준 '+h+')');
  await p.eval(`window.__STORYWORLD_HWANDO3D_R1302__.set(true)`);await p.frames(10);ok(glbReq().length===1&&loaderReq().length===1,'재활성화 추가 GLB/GLTFLoader 요청 없음 ('+glbReq().length+'/'+loaderReq().length+')');
  await p.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39,nativeVirtualKeyCode:39});await p.wait(`window.__STORYWORLD_HWANDO3D_R1302__.inspect().action==='walk'`,5000);let action=await p.eval(`window.__STORYWORLD_HWANDO3D_R1302__.inspect().action`);ok(action==='walk','실제 방향키 걷기 자세 ('+action+')');await p.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39,nativeVirtualKeyCode:39});
  await p.eval(`clearInterval(window.__r1304QaAction);window.__r1304QaAction=setInterval(()=>{player.moving=false;player.moveVX150=player.moveVY150=0;player.attackAnim=.2;},8);true`);await p.wait(`window.__STORYWORLD_HWANDO3D_R1302__.inspect().action==='attack'`,5000);action=await p.eval(`window.__STORYWORLD_HWANDO3D_R1302__.inspect().action`);ok(action==='attack','공격 자세 ('+action+')');await p.eval(`clearInterval(window.__r1304QaAction);player.moving=false;player.attackAnim=0;true`);
  await p.eval(`player.hero='neon';true`);await p.frames(12);const neon=await p.eval(`(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,g=r.scene.getObjectByName(${GROUP_EXPR});return{visible:g?.visible,heroRows:[...r.commands.rows.values()].filter(x=>x.mesh?.userData?.owner?.kind==='hero'&&x.geometryState?.kind==='image').length};})()`);ok(neon.visible===false&&(neon.heroRows>0||/^R1305/.test(inspect.revision)),'다른 영웅: 환도 3D 숨김 + 2D 유지(R1305 는 네온도 3D 라 2D 행 0 허용, qa/r1305 에서 검사) '+JSON.stringify(neon));
  await p.eval(`player.hero='hwando';window.__STORYWORLD_HWANDO3D_R1302__.set(true);true`);await p.frames(20);
  // 실제 벽보다 카메라 뒤쪽에 세워 같은 카메라의 벽 겹침을 캡처한다. 벽 투명화가 켜져도 같은 depth pass에서 벽색이 영웅 위에 섞여야 한다.
  const placed=await p.eval(placeAtWall);ok(!!placed,'벽 겹침 캡처 위치 '+JSON.stringify(placed));await p.frames(90);
  await p.shot('after-pc.png');await p.viewport(844,390,1);await p.frames(12);await p.shot('after-mobile.png');await p.eval(`clearInterval(window.__r1304QaHold);true`);
 }
 ok(p.errors.length===0,'페이지 예외 0 ('+p.errors.length+')');
 p.close();console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');if(fail)process.exitCode=1;
}finally{if(server)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections?.();});}
