// R260 — (1) 거미동굴 첫 화면 검은 선 깜빡임: 엔진이 그리기 도중 다시 만든 옛 벽 테두리·모서리 선을 GL 그리기 직전마다 숨김(cave-r204).
//         헤드리스 측정: 입장 직후 원래 선 메시가 그려진 프레임 수정 전 2~3 → 수정 뒤 0(3회).
// (2) 몹 그림이 맵 입장 뒤 갑자기 커지던 문제: R208·R248 그림을 미리 읽고, 다 읽히기 전 1.2초는 다른 크기의 원래 몸을 그리지 않는다.
//  재현(헤드리스): dist02·03·05 입장 3~9초 뒤 116→200, 92→133, 84→147px 로 커짐(엔진 원래 그림 → 늦게 읽힌 새 그림).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('mob-preload-r260.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('mob-preload-r260.js')===src);
const idx=RT('index.html');ok('loads after mob-unique-r248 (outermost drawEnemy wrapper, so R248 fallback is covered too)',idx.indexOf('mob-preload-r260.js')>idx.indexOf('"./mob-unique-r248.js"')&&idx.indexOf('"./mob-unique-r248.js"')>0);
function make(){const loaded=new Set(),requested=[];const drawn=[];let t=0;
 const ctx={localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,String,Array,Set,WeakSet,Object,Number,Promise,performance:{now:()=>0}};ctx.window=ctx;
 const c2d={drawImage(im){drawn.push(im.src);}};
 Object.defineProperty(ctx,'time',{get:()=>t});Object.assign(ctx,{ctx:c2d,room:{enemies:[]},readyImage:p=>loaded.has(p)?{image:{naturalWidth:10}}:null,ensureImages:l=>{requested.push(...l);return Promise.resolve(l.length);},
  drawEnemy:e=>{c2d.drawImage({src:'http://x/m0/'+e.path});c2d.drawImage({src:'http://x/m0/assets/hpbar.png'});}});
 ctx.__STORYWORLD_STORY_MOBS_R208__={assign:e=>e.r208?{path:e.r208}:null};ctx.__STORYWORLD_MOB_UNIQUE_R248__={sheetFor:e=>e.r248?{path:e.r248}:null};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,loaded,requested,drawn,tick:v=>{t=v;}};}
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
ok('while waiting, any body art (engine, R92, R109 …) is skipped, only shadow/ring/hp bar/fx are kept',/const KEEP=\/shadow\|ring\|glow\|hp\|bar\|effects/.test(src)&&/if\(!KEEP\.test\(p\)/.test(src));
{const cv=C('cave-r204.js');ok('cave-r204 runtime copy matches',RT('cave-r204.js')===cv);
 ok('cave: hides re-created native lines right before every GL draw (renderer instance wrapped once, only new HIDE meshes are touched)',/function glGuard\(r\)\{const gl=r\?\.renderer;if\(!gl\|\|gl\.__r260\)return;/.test(cv)&&/gl\.render=function\(\.\.\.a\)\{try\{\{const st=r\.__r204/.test(cv)&&/hideNative\(r\);if\(stats\.hidden>n0\)/.test(cv));
 ok('cave: also on the first entry frame (scene built inside render) and while the new terrain is pending; never for detail-only zones or after a failed build',/st\.pending\|\|st\.group\?\.visible/.test(cv)&&/const first=!mine&&prefs\.on&&zid&&ZONES\[zid\]&&!ZONES\[zid\]\.decorOnly/.test(cv)&&/!\(st\?\.failed&&st\.zone===zid\)/.test(cv));
 ok('cave: the guard is installed from the C.render wrapper',/before\(this,frame\);try\{glGuard\(this\);\}/.test(cv));}
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R260 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
