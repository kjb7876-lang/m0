// R260 — (1) 거미동굴 첫 화면 검은 선 깜빡임: 엔진이 그리기 도중 다시 만든 옛 벽 테두리·모서리 선을 GL 그리기 직전마다 숨김(cave-r204).
//         헤드리스 측정: 입장 직후 원래 선 메시가 그려진 프레임 수정 전 2~3 → 수정 뒤 0(3회).
// (2) R208·R248 원래 그림과 전용 시트 전환: 가까운 활성 몹은 첫 그림부터 몸을 보여 준다.
//  재현(헤드리스): dist02·03·05 입장 3~9초 뒤 116→200, 92→133, 84→147px 로 커짐(엔진 원래 그림 → 늦게 읽힌 새 그림).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('mob-preload-r260.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('mob-preload-r260.js')===src);
const idx=RT('index.html');ok('loads after mob-unique-r248 (outermost drawEnemy wrapper, so R248 fallback is covered too)',idx.indexOf('mob-preload-r260.js')>idx.indexOf('"./mob-unique-r248.js"')&&idx.indexOf('"./mob-unique-r248.js"')>0);
function make(){const loaded=new Set(),requested=[];const drawn=[],rects=[];let t=0;
 const ctx={localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,String,Array,Set,WeakSet,Object,Number,Promise,performance:{now:()=>0}};ctx.window=ctx;
 const c2d={drawImage(im,...args){drawn.push(im.src);rects.push(args);}};
 Object.defineProperty(ctx,'time',{get:()=>t});Object.assign(ctx,{ctx:c2d,room:{enemies:[]},readyImage:p=>loaded.has(p)?{image:{naturalWidth:96,naturalHeight:64,src:"http://x/m0/"+p}}:null,ensureImages:l=>{requested.push(...l);return Promise.resolve(l.length);},
  drawEnemy:e=>{
   if(e.visible===false||e.spawnState==='hidden')return;
   if(e.pendingFrame)c2d.drawImage({src:'http://x/m0/'+e.pendingFrame},0,0,20,20,-10,-50,20,50);
   else c2d.drawImage({src:'http://x/m0/'+e.path});
   c2d.drawImage({src:'http://x/m0/assets/hpbar.png'});
   if(e.throwDrawError)throw Error('test draw error');
  }});
 ctx.__STORYWORLD_STORY_MOBS_R208__={assign:e=>e.r208?{path:e.r208}:null};ctx.__STORYWORLD_MOB_UNIQUE_R248__={sheetFor:e=>e.r248?{path:e.r248}:null};
 ctx.__STORYWORLD_APPROVED_MOBS_R380__={assign:e=>e.r380||null};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,loaded,requested,drawn,rects,tick:v=>{t=v;}};}
{const t=make();const a={id:'a',hp:10,path:'assets/dist/ghoul.png',r208:'assets/mobs/ember-hound.webp'},b={id:'b',hp:10,path:'assets/dist/skel.png',r248:'assets/r248/mobs/m010.webp'},c={id:'c',hp:10,path:'assets/x.png'};
 t.ctx.room.enemies.push(a,b,c);t.ctx.drawEnemy(c);
 ok('one batch requests every new-art path of the room (R208 + R248), before those mobs are drawn',t.requested.includes(a.r208)&&t.requested.includes(b.r248),t.requested);
 t.drawn.length=0;t.ctx.drawEnemy(a);ok('art not ready yet: the different-size original body is not painted, the rest (hp bar) is',!t.drawn.some(s=>s.endsWith(a.path))&&t.drawn.some(s=>/hpbar/.test(s)),t.drawn);
 t.loaded.add(a.r208);t.drawn.length=0;t.ctx.drawEnemy(a);ok('once loaded, the normal chain draws (no hold)',t.drawn.some(s=>s.endsWith(a.path)));
 t.tick(2);t.drawn.length=0;t.ctx.drawEnemy(b);t.tick(3.5);t.drawn.length=0;t.ctx.drawEnemy(b);ok('never hides a body for more than 1.2 s if the art fails to load',t.drawn.some(s=>s.endsWith(b.path)));
 t.drawn.length=0;t.ctx.drawEnemy(c);ok('mobs without new art are never held',t.drawn.some(s=>s.endsWith(c.path)));
 const n=t.requested.length;t.ctx.drawEnemy(a);t.ctx.drawEnemy(c);ok('each path is requested once',t.requested.length===n);}
{const t=make();t.ctx.player={x:0,y:0};const e={id:'f',hp:10,x:20,y:0,path:'assets/dist/skel.png',r248:'assets/r248/mobs/m011.webp'};t.ctx.room.enemies.push(e);
 t.ctx.drawEnemy=t.ctx.drawEnemy;const base=t.ctx.drawEnemy;t.tick(0);t.ctx.drawEnemy(e);t.tick(5);t.drawn.length=0;t.ctx.drawEnemy(e);
 ok('a far mob (beyond 9 tiles) keeps waiting for its own art, however long it takes',!t.drawn.some(s=>s.endsWith(e.path)));
 e.x=3;t.tick(5.1);t.ctx.drawEnemy(e);t.tick(6.5);t.drawn.length=0;t.ctx.drawEnemy(e);ok('once near, waits at most 1.2 s more',t.drawn.some(s=>s.endsWith(e.path)));}
{const t=make(),originalDraw=t.ctx.ctx.drawImage,own='assets/test/own-atlas.webp',shared='assets/rc137/mob-attacks-01.png';
 const a={hp:10,x:20,y:20,path:own,r248:'assets/r410/mobs/m011.webp',spawnState:'active',pendingFrame:shared,
  profile:{frames:{idle:{path:own,assetFrame:{sourceRect:[8,10,24,40]}}}}};
 t.ctx.player={x:0,y:0};t.ctx.project=()=>({x:400,y:200});t.ctx.W=812;t.ctx.H=375;
 t.ctx.room.enemies.push(a);t.loaded.add(own);
 t.ctx.drawEnemy(a);
 ok('an active on-screen mob draws its own ready idle cell from the first frame even beyond the preload radius',t.drawn[0]?.endsWith(own)&&!t.drawn.some(p=>p.endsWith(shared)),t.drawn);
 ok('same-actor atlas fallback preserves the idle cell and the previous sprite foot position',JSON.stringify(t.rects[0])===JSON.stringify([8,10,24,40,-15,-50,30,50]),t.rects[0]);
 t.loaded.add(a.r248);a.pendingFrame=a.r248;t.drawn.length=0;t.ctx.drawEnemy(a);
 ok('the original chain draws the selected dedicated sheet frame when ready',t.drawn[0]?.endsWith(a.r248));
 a.r208='assets/test/unready-alternative.webp';t.drawn.length=0;t.ctx.drawEnemy(a);
 ok('an unready alternate art source does not hide the selected ready sheet',t.drawn[0]?.endsWith(a.r248));
 t.loaded.delete(a.r248);a.pendingFrame=shared;a.visible=false;t.drawn.length=0;t.ctx.drawEnemy(a);
 ok('the first-frame fallback never paints a hidden actor',t.drawn.length===0,t.drawn);
 a.visible=true;a.throwDrawError=true;
 try{t.ctx.drawEnemy(a);}catch{}
 ok('restores the context draw method after a renderer exception',t.ctx.ctx.drawImage===originalDraw);
}
{const t=make(),selected='assets/test/approved-body.webp',attack='assets/test/approved-attack.webp';
 const a={hp:10,path:selected,spawnState:'active',r380:{path:selected,attackSheet:attack}};
 t.ctx.room.enemies.push(a);t.loaded.add(selected);t.ctx.drawEnemy(a);
 ok('requests the separate approved attack sheet without holding a ready ordinary body',t.requested.includes(attack)&&t.drawn[0]?.endsWith(selected),t.requested);
}
{const t=make(),enemy={hp:10,path:'assets/test/base.webp',r248:'assets/test/queued.webp'};let scans=0;
 const enemies=[enemy];
 enemies[Symbol.iterator]=function*(){scans++;yield* Array.prototype.values.call(this);};
 t.ctx.room.enemies=enemies;
 for(let i=0;i<12;i++)t.ctx.drawEnemy(enemy);
 ok('twelve draws in one frame scan the room only once',scans===1,scans);
 enemies.push({hp:10,path:enemy.path,r248:'assets/test/reinforcement.webp'});
 t.ctx.drawEnemy(enemy);
 ok('adding a reinforcement reloads the pending list immediately in the same frame',scans===2&&t.requested.includes(enemies[1].r248),t.requested);
 t.ctx.room={enemies:[{hp:10,path:enemy.path,r248:'assets/test/new-room.webp'}]};
 t.ctx.drawEnemy(enemy);
 ok('a new room scans immediately without a clock change',t.requested.includes(t.ctx.room.enemies[0].r248),t.requested);
}
{const t=make(),enemy={hp:10,path:'assets/test/base.webp',r248:'assets/test/retry.webp'};let now=0,attempts=0;
 t.ctx.Date={now:()=>now};t.ctx.room.enemies=[enemy];
 t.ctx.ensureImages=()=>{if(++attempts===1)throw Error('temporary test failure');return Promise.resolve(1);};
 t.ctx.drawEnemy(enemy);now=1499;t.ctx.drawEnemy(enemy);
 ok('a thrown preload request is given a bounded retry delay',attempts===1,attempts);
 now=1500;t.ctx.drawEnemy(enemy);
 ok('a retry becomes eligible even when the clock is paused',attempts===2,attempts);
}
ok('while waiting, any body art (engine, R92, R109 …) is skipped, only shadow/ring/hp bar/fx are kept',/const KEEP=\/shadow\|ring\|glow\|hp\|bar\|effects/.test(src)&&/if\(!KEEP\.test\(p\)/.test(src));
{const cv=C('cave-r204.js');ok('cave-r204 runtime copy matches',RT('cave-r204.js')===cv);
 ok('cave: hides re-created native lines right before every GL draw (renderer instance wrapped once, only new HIDE meshes are touched)',/function glGuard\(r\)\{const gl=r\?\.renderer;if\(!gl\|\|gl\.__r260\)return;/.test(cv)&&/gl\.render=function\(\.\.\.a\)\{try\{\{const st=r\.__r204/.test(cv)&&/hideNative\(r\);if\(stats\.hidden>n0\)/.test(cv));
 ok('cave: also on the first entry frame (scene built inside render) and while the new terrain is pending; never for detail-only zones or after a failed build',/st\.pending\|\|st\.group\?\.visible/.test(cv)&&/const first=!mine&&prefs\.on&&zid&&ZONES\[zid\]&&!ZONES\[zid\]\.decorOnly/.test(cv)&&/!\(st\?\.failed&&st\.zone===zid\)/.test(cv));
 ok('cave: the guard is installed from the C.render wrapper',/before\(this,frame\);try\{glGuard\(this\);\}/.test(cv));}
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R260 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
