// R287 — 영웅 근처 우선 그리기 · 맵 한 번 미리 그리기(보조 렌더링) · 먼 조형물/메시 약한 그리기·대기 CPU 검사.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const src=C('render-lod-r287.js'),idx=RT('index.html');
ok('runtime copy matches source',RT('render-lod-r287.js')===src);
ok('loaded once, last before combat-r118 (after stranded-r280, mob-motion-r286, perf-groups-r266 → outermost drawProp wrapper)',idx.split('"./render-lod-r287.js"').length===2&&/\.js"><\/script><script src="\.\/render-lod-r287\.js"><\/script>(<script src="\.\/skill-fx-r292\.js"><\/script>)?(<script src="\.\/hero-palette-r302\.js"><\/script>)?(<script src="\.\/terrain-readability-r323\.js"><\/script>(?:<script src="\.\/prop-shadow-r329\.js"><\/script>)?(?:<script src="\.\/disaster-r330\.js"><\/script>)?(?:<script src="\.\/mob-foot-r332\.js"><\/script>)?(?:<script src="\.\/hud-bossbar-r334\.js"><\/script>)?(?:<script src="\.\/hero-facing-r336\.js"><\/script>)?(?:<script src="\.\/samong-gate-r338\.js"><\/script>)?(?:<script src="\.\/hud-menu-r339\.js"><\/script>)?(?:<script src="\.\/enemy-hexagram-r341\.js"><\/script>)?(?:<script src="\.\/hwando-arc-r349\.js"><\/script>)?(?:<script src="\.\/wave-orphans-r352\.js"><\/script>)?(?:<script src="\.\/slayer-r351\.js"><\/script>)?(?:<script src="\.\/bgm-pick-r353\.js"><\/script>)?(?:<script src="\.\/hwando-w-cross-r348\.js"><\/script>)?(?:<script src="\.\/hero-visibility-r350\.js"><\/script>)?(?:<script src="\.\/samong-wide-r355\.js"><\/script>)?(?:<script src="\.\/kairo-homage-r356\.js"><\/script>)?(?:<script src="\.\/perf-r360\.js"><\/script>)?(?:<script src="\.\/mob-legacy-r363\.js"><\/script>)?(?:<script src="\.\/mob-legacy-r363\.js"><\/script>)?(?:<script src="\.\/guide-fragment-r365\.js"><\/script>)?(?:<script src="\.\/perf-r367\.js"><\/script>)?(?:<script src="\.\/slayer-r-tornado-r366\.js"><\/script>)?(?:<script src="\.\/betrayal-video-r368\.js"><\/script><script src="\.\/poison-city-video-r369\.js"><\/script>)?(?:<script src="\.\/cinema-mode-r370\.js"><\/script>)?(?:<script src="\.\/root-gate-video-r372\.js"><\/script>)?(?:<script src="\.\/mob-squads-r373\.js"><\/script>)?(?:<script src="\.\/mob-dots-r374\.js"><\/script>)?(?:<script src="\.\/mob-dots-r375\.js"><\/script>)?(?:<script src="\.\/real-mode-r376\.js"><\/script>)?(?:<script src="\.\/hud-cinema-r376\.js"><\/script>)?(?:<script src="\.\/music-box-r378\.js"><\/script>)?(?:<script src="\.\/approved-mobs-r380\.js"><\/script>)?(?:<script src="\.\/voice-r381-data\.js"><\/script><script src="\.\/voice-r381\.js"><\/script>)?(?:<script src="\.\/cinema-sync-r384\.js"><\/script>)?(?:<script src="\.\/mob-moves-r385\.js"><\/script>)?(?:<script src="\.\/aggro-chase-r390\.js"><\/script>)?(?:<script src="\.\/guide-clear-r426\.js"><\/script>)?)?<script src="\.\/mammon-bossroom\.js"><\/script><script src="\.\/seven-sins-bossrooms\.js"><\/script><script src="\.\/sin-room-art\.js"><\/script>(<script src="\.\/props-place-r406\.js"><\/script>)?(<script src="\.\/mob-art-r410\.js"><\/script>)?(<script src="\.\/skill-sheets-r411\.js"><\/script>)?(<script src="\.\/theme-fx-r430\.js"><\/script>)?(<script src="\.\/boss-arena-r431\.js"><\/script>)?(?:<script src="\.\/fx-more-r438\.js"><\/script>)?(<script src="\.\/props-tidy-r412\.js"><\/script>)?(<script src="\.\/doors-fit-r413\.js"><\/script>)?(<script src="\.\/drive-buildings-r414\.js"><\/script>)?(<script src="\.\/access-r420\.js"><\/script>(?:<script src="\.\/readability-r434\.js"><\/script>)?(?:<script src="\.\/surface-r435\.js"><\/script>)?(?:<script src="\.\/bossroom-tidy-r438\.js"><\/script>)?(?:<script src="\.\/props-space-r449\.js"><\/script>)?(?:<script src="\.\/enemy-face-r444\.js"><\/script>)?)?(<script src="\.\/combat-read-r409\.js"><\/script>)?(<script src="\.\/slayer-blood-r425\.js"><\/script><script src="\.\/combat-flow-r425\.js"><\/script>(?:<script src="\.\/perf-r441\.js"><\/script>)?(?:<script src="\.\/skill-attack-r440\.js"><\/script>)?(?:<script src="\.\/enemy-skill-pose-r442\.js"><\/script>)?(?:<script src="\.\/depth-overlap-r448\.js"><\/script>)?(?:<script src="\.\/cinema-run-r461\.js"><\/script>)?(?:<script src="\.\/weather-r450\.js"><\/script><script src="\.\/local-light-r451\.js"><\/script><script src="\.\/ground-fringe-r452\.js"><\/script><script src="\.\/actor-tone-r453\.js"><\/script>)?)?\s*<script src="\.\/combat-r118\.js">/.test(idx)&&idx.indexOf('"./stranded-r280.js"')<idx.indexOf('"./render-lod-r287.js"')&&idx.indexOf('"./mob-motion-r286.js"')<idx.indexOf('"./render-lod-r287.js"')&&idx.indexOf('"./perf-groups-r266.js"')<idx.indexOf('"./render-lod-r287.js"'));ok('in verify list and CI',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'render-lod-r287.js'")&&fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r287/r287-cpu-check.cjs'));
ok('in runtime manifest/inputs',fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('render-lod-r287.js')&&fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('render-lod-r287.js'));

// 엔진 ChunkManager.update 의 덩어리 고르기(visibleBounds 부분) 그대로
function engineDesired(x,y,size,grid){const columns=grid.columns,rows=grid.rows,minX=grid.minX||0,minY=grid.minY||0,cx=Math.floor(x/size),cy=Math.floor(y/size),next=new Set();
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=cx+dx,b=cy+dy;if(a>=minX&&b>=minY&&a<columns&&b<rows)next.add(a+','+b);}
 const view=grid.visibleBounds;if(Array.isArray(view))for(let b=Math.max(minY,Math.floor(view[1]/size));b<=Math.min(rows-1,Math.floor(view[3]/size));b++)for(let a=Math.max(minX,Math.floor(view[0]/size));a<=Math.min(columns-1,Math.floor(view[2]/size));a++)next.add(a+','+b);return next;}

function world(o={}){
 const store={};if(o.prefs)store['storyworld.r287.lod']=JSON.stringify(o.prefs);
 const intervals=[];const log={glRender:[],updates:[],rt:[],drawn:[]};
 const mesh=(name,x0,z0,x1,z1,mask=4)=>({name,isMesh:true,frustumCulled:true,layers:{mask},matrixWorld:{elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]},geometry:{boundingBox:{min:{x:x0,y:0,z:z0},max:{x:x1,y:2,z:z1}}}});
 const near=mesh('near',4,4,6,6),far=mesh('far',60,60,62,62),edge=mesh('edge',13,4,14,5);/* 시야 [0,0,10,10] + 고리 4 → 14 까지는 그린다 */
 const kids=[near,far,edge];
 const textures=new Map();
 const sceneObjs=[...kids,{isMesh:true,frustumCulled:true,layers:{mask:2},name:'cmd'}];
 const T={SRGBColorSpace:'srgb',WebGLRenderTarget:function(w,h){this.w=w;this.h=h;this.texture={};}};
 const gl={rt:null,shadowMap:{needsUpdate:false},render(scene,camera){log.glRender.push({rt:this.rt,cam:camera.layers.mask,masks:kids.map(k=>k.layers.mask),culled:sceneObjs.map(k=>k.frustumCulled)});},
  getRenderTarget(){return this.rt;},setRenderTarget(t){this.rt=t;log.rt.push(t);if(t)log.warmRows=rows.size;},initTexture(t){t.uploaded=true;}};
 const rows=new Map();
 const chunks={size:10,rows,update(x,y,zone,grid){log.updates.push({zone,grid:JSON.parse(JSON.stringify(grid))});const d=engineDesired(x,y,10,grid);for(const k of [...rows.keys()])if(!d.has(k))rows.delete(k);for(const k of d)if(!rows.has(k))rows.set(k,{key:k,assets:['assets/'+k+'.webp']});if(o.defer){let res;const pr=new Promise(r=>{res=r;});log.pending=(log.pending||[]);log.pending.push(res);return pr;}return Promise.resolve([]);}};
 const leases=[];const assets={lease(p){const l={p,released:false,release(){this.released=true;}};leases.push(l);return l;}};
 const img=(n)=>{const i=new ctx.HTMLImageElement();i.naturalWidth=64;i.naturalHeight=64;i.n=n;return i;};
 const commands={texture(image){let r=textures.get(image);if(!r){r={refs:0,tex:{}};textures.set(image,r);}r.refs++;return r.tex;},release(image){const r=textures.get(image);if(r&&--r.refs===0)textures.delete(image);}};
 const r={T,renderer:gl,scene:{traverse(f){sceneObjs.forEach(f);}},camera:{layers:{mask:7,enableAll(){this.mask=0xffffffff;}}},spatialRoot:{children:kids},chunks,assets,commands,spatialBuilt:true,visibleTerrainBounds:[0,0,10,10],lastViewportWidth:1280,
  render(frame){this.camera.layers.mask=2;this.renderer.render(this.scene,this.camera);const key=(this.hx??5)+':'+frame.layer+':'+frame.zone;if(!o.keyed||key!==this.lastKey){this.lastKey=key;this.chunks.update(this.hx??5,5,frame.layer+':'+frame.zone,{columns:o.cols||6,rows:o.rows||6,minX:0,minY:0,visibleBounds:this.visibleTerrainBounds});}this.camera.layers.mask=4;this.renderer.render(this.scene,this.camera);}};
 const ctx={console,Math,JSON,Promise,Object,Array,Number,String,Set,Map,WeakMap,WeakSet,Infinity,isFinite,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:(f)=>{intervals.push(f);return 1;},performance:{now:()=>0},innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),
  W:1280,H:720,zoom:1,TILE:34,cam:{x:0,y:0},HTMLImageElement:function(){}};
 ctx.project=(x,y)=>({x:(x-y-ctx.cam.x+ctx.cam.y)*ctx.TILE*ctx.zoom+ctx.W/2,y:(x+y-ctx.cam.x-ctx.cam.y)*ctx.TILE*.5*ctx.zoom+ctx.H*.52});
 const props=[{id:'n',x:1,y:1,height:90},{id:'wall',x:2,y:0,width:6,depth:1,terrainWall:true,height:80},{id:'f1',x:200,y:-200,height:90},{id:'f2',x:-200,y:200,height:90},{id:'f3',x:300,y:300,height:90}];
 ctx.room={id:'z1',props,enemies:[{id:'e',x:3,y:3,hp:10}],exploration:{floorCells:[[0,0]],walls:[]}};
 ctx.findPath=()=>[];ctx.blocked=()=>false;
 ctx.drawProp=function(p){log.drawn.push(p.id);};
 ctx.draw=function(){for(const p of ctx.room.props)ctx.drawProp(p);};
 ctx.window=ctx;ctx.__STORYWORLD_PHASE1__={controller:{state:{three:r}}};
 vm.createContext(ctx);vm.runInContext(src,ctx);const api=ctx.__STORYWORLD_RENDER_LOD_R287__;
 const frame=(zone='STORY:z1',cmds=[])=>{log.drawn.length=0;ctx.draw();const [layer,z]=zone.split(':');r.render({layer,zone:z,commands:cmds});};
 const flush=()=>new Promise(res=>setImmediate(res));
 return {ctx,api,r,gl,log,kids,near,far,edge,frame,flush,props,leases,textures,img,commands,sceneObjs};}

(async()=>{
// ---- 순수 계산 ----
{const A=world().api;
 ok('expand: view bounds + ring on all sides',JSON.stringify(A.expand([0,0,10,10],4))==='[-4,-4,14,14]');
 const grid={columns:7,rows:5,minX:0,minY:0};const fb=A.fullBounds(grid,10);const d=engineDesired(3,3,10,{...grid,visibleBounds:fb});
 ok('fullBounds selects every chunk of the grid through the engine selection rule (7×5=35)',d.size===35&&A.chunkGrid(grid).count===35,{n:d.size,fb});
 const g2={columns:9,rows:4,minX:2,minY:1};ok('fullBounds honours minX/minY offsets',engineDesired(30,20,10,{...g2,visibleBounds:A.fullBounds(g2,10)}).size===7*3);
 ok('outside: box overlap test',A.outside([11,0,12,1],[0,0,10,10])&&!A.outside([9,9,12,12],[0,0,10,10])&&!A.outside([-5,-5,0,0],[0,0,10,10]));
 const m=A.propMargin(1280,720);ok('prop margin = 30% of the long side + 160px (1280 → 544px)',Math.abs(m-544)<1e-9);
 ok('screenOutside uses the margin ring (inside the ring still drawn)',!A.screenOutside([1300,10,1400,20],1280,720,m)&&A.screenOutside([1900,10,2000,20],1280,720,m)&&!A.screenOutside([-500,-500,-400,-400],1280,720,m));
 let fair=true;for(let id=0;id<40;id++){let n=0;for(let f=0;f<A.config.propEvery*3;f++)if(A.farTurn(id,f,A.config.propEvery))n++;if(n!==3)fair=false;}
 ok('farTurn: every far prop drawn exactly once per propEvery frames (staggered)',fair);}

// ---- 조형물: 가까운 것은 매 프레임, 먼 것은 돌아가며, 첫 프레임은 전부 ----
{const w=world();const counts={};for(let f=0;f<60;f++){w.frame();for(const id of w.log.drawn)counts[id]=(counts[id]||0)+1;if(f===0)ok('first frames of a zone draw every prop (warm-up)',w.log.drawn.length===5,w.log.drawn);}
 ok('near prop and long near wall drawn every frame',counts.n===60&&counts.wall===60,counts);
 const farN=['f1','f2','f3'].map(k=>counts[k]);ok('far props drawn rarely (warm frames + about 1 in propEvery)',farN.every(n=>n>=3&&n<=3+Math.ceil(57/w.api.config.propEvery)+1),counts);
 w.log.drawn.length=0;w.ctx.drawProp(w.props[2]);ok('direct drawProp calls outside the frame loop are never skipped',w.log.drawn[0]==='f1');
 w.ctx.cam.x=200;w.ctx.cam.y=-200;w.frame();ok('a far prop becomes near when the camera arrives → drawn the same frame',w.log.drawn.includes('f1'),w.log.drawn);}

// ---- 3D: 시야+고리 밖 메시는 그리는 동안만 대기, 끝나면 그대로 ----
{const w=world();w.frame();
 const g=w.log.glRender[0];ok('during the frame draw the far mesh is parked (layers.mask 0), near and ring-edge meshes untouched',g.masks[0]===4&&g.masks[1]===0&&g.masks[2]===4,g);
 ok('after the frame every mesh has its original layers.mask again',w.near.layers.mask===4&&w.far.layers.mask===4&&w.edge.layers.mask===4);
 w.r.visibleTerrainBounds=[55,55,65,65];w.log.glRender.length=0;w.frame();const g2=w.log.glRender[0];
 ok('mesh comes back into range → drawn with its original mask; the old near mesh is parked instead',g2.masks[1]===4&&g2.masks[0]===0,g2);
 w.far.layers.mask=8;w.r.visibleTerrainBounds=[0,0,10,10];w.log.glRender.length=0;w.frame();ok('engine-changed mask is kept (restored value = the mask the engine set this frame)',w.far.layers.mask===8&&w.log.glRender[0].masks[1]===0);
 w.far.layers.mask=0;w.frame();ok('a mesh the engine itself hid (mask 0) stays hidden',w.far.layers.mask===0);}

// ---- 대기 덩어리 메시: 엔진이 올려 두었을 덩어리만 그린다 ----
{const w=world();const A=w.api;const g={columns:6,rows:6,minX:0,minY:0};
 ok('engineKeeps: 3×3 around the hero and view chunks kept, far chunk not, outside grid not',A.engineKeeps('0,0',5,5,10,[0,0,10,10],g)&&A.engineKeeps('1,1',5,5,10,[0,0,10,10],g)&&!A.engineKeeps('5,5',5,5,10,[0,0,10,10],g)&&!A.engineKeeps('7,0',5,5,10,[0,0,10,10],g));
 const mk=(n)=>({name:n,isMesh:true,layers:{mask:4},matrixWorld:{elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]},geometry:{boundingBox:{min:{x:0,y:0,z:0},max:{x:100,y:1,z:100}}}});
 const fNear=mk('fNear'),fFar=mk('fFar'),wFar=mk('wFar'),wBoth=mk('wBoth');w.r.floorRows=new Map([['0,0',fNear],['5,5',fFar]]);w.r.wallRows=new Map([['a',{mesh:wFar,refs:new Set(['5,4'])}],['b',{mesh:wBoth,refs:new Set(['5,5','1,0'])}]]);
 w.kids.push(fNear,fFar,wFar,wBoth);const seen=[];const gr=w.gl.render;w.gl.render=function(s,c){seen.push([fNear,fFar,wFar,wBoth].map(m=>m.layers.mask));return gr.call(this,s,c);};
 w.frame();w.frame();const last=seen.at(-1);
 ok('resident far chunk meshes (floor, wall) parked even when their box overlaps the view; kept chunk meshes and shared walls drawn',last[0]===4&&last[1]===0&&last[2]===0&&last[3]===4,last);
 ok('row meshes restored after the frame',[fNear,fFar,wFar,wBoth].every(m=>m.layers.mask===4));}

// ---- 덩어리: 맵 전체 대기 / 큰 맵은 미리 올린 뒤 시야+고리 ----
{const w=world();w.frame();const u=w.log.updates[0];ok('zone entry: chunk update asks for the whole map once (all 36 chunks loaded for the warm-up)',w.r.chunks.rows.size===36&&u.grid.visibleBounds[2]>59,u);
 await w.flush();w.frame();
 ok('warm-up render: once, into an offscreen target, with every object un-culled, then target/layers/culling restored',w.api.inspect().stats.warms===1&&w.log.glRender.some(g=>g.rt&&g.rt.w===4&&g.cam===0xffffffff&&g.culled.every(c=>c===false))&&w.gl.rt===null&&w.sceneObjs.every(o=>o.frustumCulled===true),w.api.inspect());
 ok('chunk image leases are held for the zone',w.leases.length>=1&&w.leases.every(l=>!l.released));
 w.frame();w.frame();ok('warm-up not repeated in the same zone',w.api.inspect().stats.warms===1);
 const last=w.log.updates.at(-1);ok('default (resident off): after the warm-up the engine band itself (its own view bounds) is requested again',last.grid.visibleBounds[2]===10&&w.r.chunks.rows.size<36,{vb:last.grid.visibleBounds,n:w.r.chunks.rows.size});
 w.frame('STORY:z2');ok('zone change releases the held leases',w.leases.every(l=>l.released));}
{const w=world({cols:30,rows:20});w.frame();ok('over the cap: one full load for the warm-up',w.r.chunks.rows.size===600);await w.flush();w.frame();w.frame();
 const last=w.log.updates.at(-1);ok('after the warm-up only the engine band stays',w.r.chunks.rows.size<40&&last.grid.visibleBounds[2]===10,{n:w.r.chunks.rows.size,vb:last.grid.visibleBounds});}

{const w=world({prefs:{resident:true}});w.frame();await w.flush();w.frame();w.frame();w.frame();ok('{resident:true}: whole map stays loaded (standby) after the warm-up',w.r.chunks.rows.size===36);}
// Codex 리뷰 재현: 전체 로드가 끝난 첫 프레임에 영웅이 반 칸 경계를 넘어 엔진이 chunks.update 를 다시 부른다 → 미리 그리기 전에 먼 덩어리가 내려가면 안 된다
{const w=world();
 w.frame();await w.flush();w.r.hx=5.6;/* 반 칸 넘음 */w.frame();
 ok('warm-up runs with every chunk still loaded even if the hero moves on the first frame after the full load (36 at warm render)',w.api.inspect().stats.warms===1&&w.log.warmRows===36,{warmRows:w.log.warmRows,warms:w.api.inspect().stats.warms});
 ok('leases taken for every chunk image before the band shrinks (36 leases, none released)',w.leases.length===36&&w.leases.every(l=>!l.released),w.leases.length);
 w.r.hx=6.2;w.frame();ok('after the warm-up the band shrinks back to the engine rule',w.r.chunks.rows.size<36);}
// Codex 리뷰 2: 앞 지역의 전체 로드가 끝나기 전에 지역을 바꾸고(약속 둘 다 대기), 영웅은 가만히(엔진은 키가 바뀔 때만 update) → 새 지역도 미리 그리기까지 가야 한다
{const w=world({defer:true,keyed:true});w.frame('STORY:z1');w.frame('STORY:z2');for(const r of w.log.pending)r();await w.flush();await w.flush();w.frame('STORY:z2');w.frame('STORY:z2');
 ok('zone change during a pending full load: the new zone still reaches the warm-up (per-zone generation)',w.api.inspect().warmState==='done'&&w.api.inspect().zone==='STORY:z2'&&w.api.inspect().stats.warms===1,w.api.inspect());}
{const w=world({defer:true,keyed:true});w.frame();for(let i=0;i<w.api.config.warmTimeout+5;i++)w.frame();
 ok('warm-up timeout advances per frame even with no chunk updates (stationary hero, load never finishes)',w.api.inspect().warmState==='done',w.api.inspect().warmState);}
// Codex 리뷰 3: 미리 그리기/시간 초과 뒤 영웅이 가만히 있으면(엔진 update 없음) 맵 전체가 계속 상주하면 안 된다
{const w=world({keyed:true});w.frame();await w.flush();w.frame();w.frame();
 ok('stationary hero: after the warm-up the band shrinks back without a new engine update',w.api.inspect().stats.warms===1&&w.r.chunks.rows.size<36,w.r.chunks.rows.size);}
{const w=world({defer:true,keyed:true});w.frame();for(let i=0;i<w.api.config.warmTimeout+5;i++)w.frame();
 ok('stationary hero: after the warm-up timeout the band shrinks back too',w.api.inspect().warmState==='done'&&w.r.chunks.rows.size<36,w.r.chunks.rows.size);}
// ---- 대기 캐시 한도 ----
{const w=world();w.r.idleGeometryByteLimit=2*1024*1024;w.r.idleGeometryLimit=256;w.frame();
 w.r.idleGeometryByteLimit=2*1024*1024;w.r.idleGeometryLimit=256;/* 엔진이 매 프레임 다시 쓰는 값 */
 ok('idle geometry cache limit raised while on (engine writes 2MB/256 → reads 24MB/1024)',w.r.idleGeometryByteLimit===24*1024*1024&&w.r.idleGeometryLimit===1024,[w.r.idleGeometryByteLimit,w.r.idleGeometryLimit]);
 w.api.set({on:false});ok('off: the engine values are plain properties again (2MB/256)',w.r.idleGeometryByteLimit===2*1024*1024&&w.r.idleGeometryLimit===256&&Object.getOwnPropertyDescriptor(w.r,'idleGeometryByteLimit').writable===true);}
// ---- 2D 명령 텍스처 대기 ----
{const w=world();const a=w.img('a'),b=w.img('b');w.frame('STORY:z1',[{kind:'image',image:a},{kind:'image',image:b},{kind:'image',image:a},{kind:'image',image:{},mutable:true}]);
 ok('command image textures held once each and uploaded (initTexture)',w.textures.get(a)?.refs===1&&w.textures.get(b)?.refs===1&&w.textures.get(a).tex.uploaded===true);
 w.api.set({on:false});ok('off: held textures released',w.textures.size===0);}

// ---- 판정·충돌·AI 는 그대로 ----
{const w=world();const snap=JSON.stringify({p:w.ctx.room.props,e:w.ctx.room.enemies,x:w.ctx.room.exploration});const fp=w.ctx.findPath,bl=w.ctx.blocked;
 for(let i=0;i<30;i++)w.frame();await w.flush();w.frame();
 ok('room props / enemies / exploration unchanged, findPath and blocked not wrapped',JSON.stringify({p:w.ctx.room.props,e:w.ctx.room.enemies,x:w.ctx.room.exploration})===snap&&w.ctx.findPath===fp&&w.ctx.blocked===bl);
 ok('no gameplay globals touched by the source (no tick/update/findPath/blocked/room.props assignment)',!/\b(findPath|blocked|tick|updateEnemies|tickEnemies)\s*=/.test(src)&&!/room\.(props|enemies|exploration)\s*=/.test(src));}

// ---- 끄기 ----
{const w=world({prefs:{on:false}});const base=w.r.chunks.update;for(let f=0;f<10;f++){w.frame();if(w.log.drawn.length!==5)break;}
 ok('off from storage: every prop drawn every frame',w.log.drawn.length===5);
 ok('off: no mesh parked, chunk bounds untouched',w.log.glRender.every(g=>g.masks.every(m=>m===4))&&w.log.updates.length>0&&w.log.updates.every(u=>JSON.stringify(u.grid.visibleBounds)==='[0,0,10,10]'),w.log.updates[0]);
 await w.flush();ok('off: no warm-up render',w.api.inspect().stats.warms===0);}
{const w=world();const base=w.r.chunks.update.__r287base;w.frame();ok('wrapped while on',typeof base==='function'&&w.r.chunks.update!==base);w.api.set({on:false});
 ok('switch off at runtime restores the engine chunk update and releases leases',w.r.chunks.update===base&&w.leases.every(l=>l.released));
 w.log.glRender.length=0;w.frame();ok('switch off at runtime: nothing parked, all props drawn',w.log.glRender.every(g=>g.masks.every(m=>m===4))&&w.log.drawn.length===5);}
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R287 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
})();

require("node:assert").ok(fs.readFileSync(path.join(__dirname,"../../runtime-text/index.html"),"utf8").includes('<script src="./hud-bgm-hwando-w-r313.js"></script><script src="./maps-palace-slum-r317.js"></script><script src="./save-transition-r320.js"></script><script src="./bgm-map-r308.js"></script><script src="./mobile-perf-r298.js"></script>'),"R313 registered before R298; late hook waits for R292");
