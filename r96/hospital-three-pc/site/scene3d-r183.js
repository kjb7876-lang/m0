// R183 — 중요 에피소드 3D 체험 장면(사용자 2026-11-01 "video-to-game 적용해서 중간중간 중요 에피 3D 체험 혹은 비디오 씬").
//  video-to-game(MIT)의 방식 중 무료로 쓸 수 있는 부분만 따른다: 장면을 먼저 정하고(정본 문장 = 장면 설계서), Three.js 한 장면으로 짓고, 직접 돌려 찍어 확인.
//  영상 생성·이미지·3D·소리 AI(fal, 유료 키)는 쓰지 않는다 — 모양은 Three.js 기본 도형과 게임에 이미 있는 색만으로 만든 임시 3D 체험이다(최종 아트 아님).
//  · 처음 그 구역에 들어설 때 한 번, 15초 남짓. 누르기·Esc·Space 로 건너뜀. 자막은 samong-text 원문 문장을 그대로(고치거나 지어내지 않음).
//  · 장면: DYS-01 침공(원반 그림자 아래 무너지는 거리) · DYS-12 성인이 된 나(스무 살의 원룸).
//  환경 설정 '중요 장면 3D 체험'으로 끄고 켠다. storyworld.r183.scene3d {on:false}.
(()=>{'use strict';
if(window.__STORYWORLD_SCENE3D_R183__)return;
const REV='R183-scene3d-1',KEY='storyworld.r183.scene3d';
let prefs={on:true,seen:{}};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');prefs={...prefs,...s,seen:{...(s.seen||{})}};}catch(_){}
const stats={plays:0,skips:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
const TXT=()=>window.__STORYWORLD_SAMONG_TEXT_R103__?.sections||{};
const paras=k=>(TXT()[k]?.blocks||[]).flatMap(b=>b.paras);
// 원문 문단의 첫 문장(마침표까지) — 문장은 고치지 않는다
const firstSentence=t=>{const s=String(t||'');const m=s.match(/^.*?(다\.|\.|!|\?)(?=\s|$)/);return(m?m[0]:s).trim();};
const SCENES={
 dys01:{zone:'sz115-S06-1',sec:'DYS-01',lines:[0,1,7],title:'[DYS-01] 침공',build:buildInvasion},
 dys12:{zone:'sz115-S06-22',sec:'DYS-12',lines:[2,19,24,28,29],title:'[DYS-12] 성인이 된 나',build:buildRoom,full:[24,28,29]}};
let THREE=null;async function three(){if(THREE)return THREE;THREE=await import('./vendor/three/build/three.module.js');return THREE;}
let active=null;
function css(){if(document.getElementById('r183Css'))return;const s=document.createElement('style');s.id='r183Css';
 s.textContent='#r183{position:fixed;inset:0;z-index:60;background:#000;cursor:pointer}#r183 canvas{position:absolute;inset:0;width:100%;height:100%}'
 +'#r183 .cap{position:absolute;left:50%;bottom:9%;transform:translateX(-50%);width:min(860px,88vw);text-align:center;color:#f0e2c8;font:17px/1.8 "Gowun Batang","Noto Serif KR",serif;text-shadow:0 2px 8px #000,0 0 2px #000;opacity:0;transition:opacity .7s}'
 +'#r183 .cap.on{opacity:1}#r183 .ttl{position:absolute;left:24px;top:18px;color:#c8a878;font:700 12px/1.4 "Malgun Gothic",sans-serif;letter-spacing:.14em;opacity:.85}#r183 .skip{position:absolute;right:20px;top:16px;color:#bba;font:12px "Malgun Gothic",sans-serif;opacity:.7}'
 +'#r183 .fade{position:absolute;inset:0;background:#000;opacity:1;transition:opacity 1.2s;pointer-events:none}#r183 .fade.off{opacity:0}';document.head.appendChild(s);}
async function play(id,opt={}){const S=SCENES[id];if(!S||active)return false;if(!prefs.on&&!opt.force)return false;
 const lines=S.lines.map(i=>{const p=paras(S.sec)[i];return S.full?.includes(i)?String(p||'').trim():firstSentence(p);}).filter(Boolean);if(!lines.length)return false;
 let T;try{T=await three();}catch(e){fail(e);return false;}
 css();const root=document.createElement('div');root.id='r183';root.setAttribute('role','dialog');root.setAttribute('aria-label',S.title+' 3D 체험');
 root.innerHTML='<div class="ttl">'+S.title+' · 3D 체험</div><div class="skip">누르기 · Esc 건너뛰기</div><div class="cap"></div><div class="fade"></div>';document.body.appendChild(root);
 const W=()=>innerWidth,H=()=>innerHeight;let renderer;
 try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch(e){fail(e);root.remove();return false;}
 renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));renderer.setSize(W(),H());root.insertBefore(renderer.domElement,root.firstChild);
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(48,W()/H(),.1,400);const world=S.build(T,scene,cam);
 const cap=root.querySelector('.cap'),fade=root.querySelector('.fade');const per=3600,total=lines.length*per+1400;
 let done=false,t0=performance.now(),li=-1,raf=0;
 const finish=(skipped)=>{if(done)return;done=true;cancelAnimationFrame(raf);if(skipped)stats.skips++;fade.classList.remove('off');setTimeout(()=>{try{renderer.dispose();scene.traverse(o=>{o.geometry?.dispose?.();const m=o.material;(Array.isArray(m)?m:[m]).forEach(x=>x?.dispose?.());});}catch(e){fail(e);}root.remove();active=null;removeEventListener('keydown',key,true);removeEventListener('keyup',keyUp,true);removeEventListener('resize',rs);},450);};
 const key=e=>{/* R185: 체험 동안 게임 키(블링크·기술·EGO 등)는 모두 막는다 — 뒤에서 상태가 바뀌던 것(Codex 리뷰) */e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape'||e.key===' '||e.code==='Space'||e.key==='Enter')finish(true);};const keyUp=e=>{e.stopImmediatePropagation();};
 const rs=()=>{renderer.setSize(W(),H());cam.aspect=W()/H();cam.updateProjectionMatrix();};
 root.onclick=()=>finish(true);addEventListener('keydown',key,true);addEventListener('keyup',keyUp,true);addEventListener('resize',rs);try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}/* 누르고 있던 이동 키 풀기 */
 active={id,finish};stats.plays++;prefs.seen[id]=Date.now();save();
 requestAnimationFrame(()=>fade.classList.add('off'));
 const loop=now=>{const t=(now-t0)/1000,u=Math.min(1,(now-t0)/total);try{world.update(t,u);}catch(e){fail(e);}renderer.render(scene,cam);
  const k=Math.floor((now-t0)/per);if(k!==li&&k<lines.length){li=k;cap.classList.remove('on');setTimeout(()=>{cap.textContent=lines[k];cap.classList.add('on');},260);}
  if(now-t0>=total-900&&!fade.dataset.out){fade.dataset.out=1;fade.classList.remove('off');}
  if(now-t0>=total)return finish(false);raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);
 return true;}
// ---- 장면 짓기(기본 도형만) ----
function buildInvasion(T,scene,cam){scene.background=new T.Color(0x14110f);scene.fog=new T.Fog(0x1a1512,18,80);
 scene.add(new T.HemisphereLight(0x8a7a6a,0x120c0a,.55));const sun=new T.DirectionalLight(0xc8b49a,.7);sun.position.set(-20,40,10);scene.add(sun);
 const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshLambertMaterial({color:0x2a241f}));ground.rotation.x=-Math.PI/2;scene.add(ground);
 const blds=[];const bm=new T.MeshLambertMaterial({color:0x3b342e});for(let i=0;i<60;i++){const w=2+Math.random()*3,h=4+Math.random()*14,d=2+Math.random()*3;const m=new T.Mesh(new T.BoxGeometry(w,h,d),bm);const side=i%2?1:-1;m.position.set(side*(5+Math.random()*12),h/2,-i*2.2+20);m.userData={h,phase:Math.random()*6,fall:i>18&&Math.random()<.45};scene.add(m);blds.push(m);}
 // 하늘을 막은 원반: 납작한 원판 + 아랫면 빛
 const disc=new T.Group();const top=new T.Mesh(new T.CylinderGeometry(30,34,3,48),new T.MeshLambertMaterial({color:0x221d1a}));disc.add(top);const under=new T.Mesh(new T.CircleGeometry(26,48),new T.MeshBasicMaterial({color:0x6a1a14,transparent:true,opacity:.35}));under.rotation.x=Math.PI/2;under.position.y=-1.6;disc.add(under);disc.position.set(0,34,-30);scene.add(disc);
 // 음파 고리
 const rings=[];for(let i=0;i<3;i++){const r=new T.Mesh(new T.RingGeometry(1,1.25,48),new T.MeshBasicMaterial({color:0xb04030,transparent:true,opacity:0,side:T.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.y=.05;scene.add(r);rings.push(r);}
 // 재·분진
 const N=500,g=new T.BufferGeometry(),pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*60;pos[i*3+1]=Math.random()*20;pos[i*3+2]=(Math.random()-.5)*80;}g.setAttribute('position',new T.BufferAttribute(pos,3));const dust=new T.Points(g,new T.PointsMaterial({color:0x9a8a7a,size:.12,transparent:true,opacity:.6}));scene.add(dust);
 cam.position.set(0,2.2,26);
 return{update(t,u){cam.position.z=26-u*22;cam.position.y=2.2+Math.sin(t*.6)*.15;cam.lookAt(0,6+u*10,-20);disc.position.z=-30+u*12;disc.rotation.y=t*.05;
  for(const b of blds){const ud=b.userData;b.position.x+=Math.sin(t*28+ud.phase)*.004*(u>.25?1:0);if(ud.fall&&u>.3){const k=Math.min(1,(u-.3)*2.2);b.position.y=ud.h/2-k*ud.h*.95;b.rotation.z=k*.15*(ud.phase>3?1:-1);}}
  rings.forEach((r,i)=>{const p=((t*.6+i/3)%1);r.scale.setScalar(2+p*28);r.material.opacity=(1-p)*.45;});
  const a=dust.geometry.attributes.position;for(let i=0;i<N;i++){a.array[i*3+1]-=.01;if(a.array[i*3+1]<0)a.array[i*3+1]=20;}a.needsUpdate=true;}};}
function buildRoom(T,scene,cam){scene.background=new T.Color(0x0b0a0c);
 const amb=new T.AmbientLight(0x6a6560,.35);scene.add(amb);
 const tube=new T.PointLight(0xf2f0e6,1.2,14,1.6);tube.position.set(0,2.75,0);scene.add(tube);
 const tubeMesh=new T.Mesh(new T.BoxGeometry(1.2,.05,.08),new T.MeshBasicMaterial({color:0xf6f4ea}));tubeMesh.position.copy(tube.position);scene.add(tubeMesh);
 const wall=new T.MeshLambertMaterial({color:0x8a8072,side:T.BackSide});const room=new T.Mesh(new T.BoxGeometry(5,3,4.2),wall);room.position.y=1.5;scene.add(room);
 const floor=new T.Mesh(new T.PlaneGeometry(5,4.2),new T.MeshLambertMaterial({color:0xb8a060}));floor.rotation.x=-Math.PI/2;floor.position.y=.01;scene.add(floor);/* 노란 장판 */
 const wood=new T.MeshLambertMaterial({color:0x6a4a30});const desk=new T.Mesh(new T.BoxGeometry(1.4,.06,.7),wood);desk.position.set(0,.74,-.6);scene.add(desk);
 for(const [x,z] of [[-.65,-.9],[.65,-.9],[-.65,-.3],[.65,-.3]]){const l=new T.Mesh(new T.BoxGeometry(.05,.72,.05),wood);l.position.set(x,.36,z);scene.add(l);}
 const chairM=new T.MeshLambertMaterial({color:0x3a3a40});function chair(x,z,r){const g=new T.Group();const s=new T.Mesh(new T.BoxGeometry(.42,.05,.42),chairM);s.position.y=.45;g.add(s);const b=new T.Mesh(new T.BoxGeometry(.42,.45,.05),chairM);b.position.set(0,.7,-.2);g.add(b);g.position.set(x,0,z);g.rotation.y=r;scene.add(g);}
 chair(0,-1.25,0);chair(0,.05,Math.PI);
 const vial=new T.Mesh(new T.CylinderGeometry(.03,.03,.11,16),new T.MeshPhongMaterial({color:0xd8e8f0,transparent:true,opacity:.45,shininess:90}));vial.position.set(.15,.83,-.55);scene.add(vial);/* 이름 없는 작은 약병 */
 const win=new T.Mesh(new T.PlaneGeometry(1.2,.9),new T.MeshBasicMaterial({color:0x1a2230}));win.position.set(-2.49,1.6,-.4);win.rotation.y=Math.PI/2;scene.add(win);
 const sig=new T.PointLight(0x40ff80,0,6,2);sig.position.set(-3,1.6,-.4);scene.add(sig);/* 창밖 건널목 초록불 */
 cam.position.set(1.9,1.55,1.7);
 return{update(t,u){cam.position.x=1.9-u*1.2;cam.position.z=1.7-u*.9;cam.lookAt(0,.85,-.6);
  sig.intensity=u>.15&&u<.55?.8:0;win.material.color.setHex(u>.15&&u<.55?0x1d3a2a:0x1a2230);
  const flick=u>.72?(Math.random()<.18?.2:1):1;const fade=u>.78?Math.max(0,1-(u-.78)*4.5):1;tube.intensity=1.2*flick*fade;amb.intensity=.35*fade;tubeMesh.material.color.setScalar(.95*fade+.05);}};}
// ---- 들어설 때 ----
let lastZone=null;
try{if(typeof tick==='function'){const base=tick;tick=function(...a){if(active)return;/* 체험 동안 게임 시간 멈춤 */const r=base.apply(this,a);try{const z=typeof room!=='undefined'?room?.samongR103?.zone:null;if(z&&z!==lastZone){/* R185: 들어설 때 서사 창이 열려 있으면 구역을 기록하지 않고 창이 닫힐 때까지 다시 본다(예전에는 체험이 영영 안 나옴 — Codex 리뷰) */const busy=(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading);if(!busy){lastZone=z;if(prefs.on)for(const[id,S]of Object.entries(SCENES))if(S.zone===z&&!prefs.seen[id]){play(id);break;}}}else if(!z)lastZone=null;}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings');if(grid&&!document.getElementById('r183On')){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='r183On';c.checked=prefs.on!==false;c.onchange=()=>{prefs.on=c.checked;save();};l.appendChild(c);l.appendChild(document.createTextNode(' 중요 장면 3D 체험(처음 한 번)'));grid.appendChild(l);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){if(typeof p?.on==='boolean')prefs.on=p.on;if(p?.resetSeen)prefs.seen={};save();return{on:prefs.on};}
window.__STORYWORLD_SCENE3D_R183__=Object.freeze({revision:REV,SCENES:Object.fromEntries(Object.entries(SCENES).map(([k,v])=>[k,{zone:v.zone,sec:v.sec,lines:v.lines.slice(),title:v.title}])),play,set,firstSentence,inspect:()=>({revision:REV,prefs:{on:prefs.on,seen:{...prefs.seen}},stats:{...stats},active:active?.id||null,lastError})});
})();
