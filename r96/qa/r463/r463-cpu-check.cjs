// R463 7대죄 보스 그림 한 형태·한 크기 검사(CPU, 가짜 엔진): 단계 고정·옛 경로 바꿔 읽기·크기 잠금 값·분노 보스 무기 조각 끄기·맘몬 제외·배선.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
for(const f of ['sin-boss-art-r463.js','sin-boss-art-r463-data.js','combat-flow-r425.js','combat-r114.js']){assert.strictEqual(CS(f),RT(f),f);new vm.Script(CS(f));}ok('client-source and runtime copies agree, syntax ok');
const idx=RT('index.html'),at=k=>idx.indexOf('"./'+k+'"');
assert(idx.split('"./sin-boss-art-r463.js"').length===2&&idx.split('"./sin-boss-art-r463-data.js"').length===2);
assert(at('sin-boss-art-r463-data.js')<at('sin-boss-art-r463.js')&&at('combat-flow-r425.js')<at('sin-boss-art-r463.js')&&at('bosses-r104.js')<at('sin-boss-art-r463.js')&&at('combat-r114.js')<at('sin-boss-art-r463.js')&&at('approved-mobs-r380.js')<at('sin-boss-art-r463.js')&&at('sin-boss-art-r463.js')<at('combat-r118.js'));ok('loaded once, data first, outside R104/R114/R380/R425 drawEnemy wrappers, before combat-r118');
assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'sin-boss-art-r463.js'"));ok('public verify list');
assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r463/r463-cpu-check.cjs'));ok('Pages CPU step');
const inputs=JSON.parse(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8')).textPaths;assert(['sin-boss-art-r463.js','sin-boss-art-r463-data.js'].every(f=>inputs.some(p=>p.endsWith('/'+f)||p===f)));ok('runtime inputs list both');
// 데이터
const W={};vm.runInNewContext(CS('sin-boss-art-r463-data.js'),{window:W});const D=W.__STORYWORLD_SIN_BOSS_ART_R463_DATA__;
assert.deepStrictEqual(Object.keys(D).sort(),['b02-boss','b03-boss','b04-boss','b05-boss','b07-boss','b08-boss']);ok('six sin bosses, Mammon (b06/b06b) left out');
for(const [id,d] of Object.entries(D)){assert(/^ep1b0[2-8]$/.test(d.zone)&&d.idle&&d.attack&&d.vis[d.idle]>200&&d.vis[d.attack]>200,id);for(const [p,k] of Object.entries(d.remap)){assert(k==='idle'||k==='attack');assert(!/phase0/.test(p),id+' never remaps a phase-0 story image: '+p);}
 assert(Object.keys(d.remap).some(p=>/_demon\.webp$/.test(p)),id+' demon form remapped');for(const p of Object.keys(d.vis))assert(fs.existsSync(path.join(root,'runtime-text',p))||fs.existsSync(path.join(root,'hospital-three-pc','site',p))||/assets\/(r104|r380)\//.test(p),p);}
ok('each boss: phase-0 idle/attack kept, every other-phase/demon path remapped, visible heights measured');
assert(D['b07-boss'].vis['assets/r104/bosses/b07-boss-p4.webp']===400&&D['b02-boss'].vis['assets/r380/mobs/sloth-burden-man-v1.webp']>200);ok('R104 key poses (400) and R380 sheet heights carried');
// 가짜 엔진
function boot(stored,zone='ep1b07'){const ls=new Map(Object.entries(stored||{}));const reads=[],draws=[];
 const env={window:{},localStorage:{getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,String(v))},room:{id:zone},reads,draws,addImage(){}};
 env.window.__STORYWORLD_SIN_BOSS_ART_R463_DATA__=D;vm.createContext(env);
 vm.runInContext(`var readyImage=function(p){reads.push(p);return p==='missing.webp'?null:{image:{},path:p};};
  var drawEnemy=function(e){draws.push({phase:e.phase,path:e.path,img:readyImage(e.attack?'assets/generated-v31224/actors-normalized/993008dd765e_wrath-attack.webp':e.path).path});};`,env);
 vm.runInContext(CS('sin-boss-art-r463.js'),env);return env;}
{const env=boot();const d=D['b07-boss'],e={nativeId:'b07-boss',phase:2,path:'assets/generated-v31224/actors-normalized/148c5ac2bb7c_boss_wrath_demon.webp'};
 vm.runInContext('drawEnemy',env)(e);const r=env.draws[0];assert.strictEqual(r.phase,0);assert.strictEqual(r.path,d.idle);assert.strictEqual(r.img,d.idle);assert.strictEqual(e.phase,2);assert(e.path.endsWith('_demon.webp'));
 e.attack={};vm.runInContext('drawEnemy',env)(e);assert.strictEqual(env.draws[1].img,d.attack,'captured other-phase attack still reads the phase-0 attack image');
 ok('demon phase draws as the phase-0 story form (path, phase, captured attack frame); logic values restored after the draw');}
{const env=boot();const R=env.window.__STORYWORLD_SIN_BOSS_ART_R463__;
 const L=R.sizeLock({nativeId:'b07-boss'},{sourcePath:'http://x/m0/assets/r104/bosses/b07-boss-p2.webp#tint',sourceRect:[0,0,411,473]},1);assert(Math.abs(L.frac-400/473)<1e-9&&L.band[0]===2.1&&L.band[1]===2.1);
 const L2=R.sizeLock({nativeId:'b07-boss'},{sourcePath:'assets/r104/bosses/b07-boss-p1.webp',sourceRect:[0,0,411,473]},2);assert(L2.band[0]===4.2);
 assert(R.sizeLock({nativeId:'b07-boss'},{sourcePath:'assets/r425/clean/'+D['b07-boss'].attack,sourceRect:[0,0,672,384]},1),'R425 cleaned copy keeps its family height');
 assert.strictEqual(R.sizeLock({nativeId:'b07-boss'},{sourcePath:'assets/fx/ring.webp',sourceRect:[0,0,10,10]},1),null);
 assert.strictEqual(R.sizeLock({nativeId:'b06-boss'},{sourcePath:'assets/r104/bosses/b06-boss-p1.webp',sourceRect:[0,0,265,439]},1),null);
 ok('size lock: one visible-height ratio per art family, 2.1x hero (4.2x enraged), unknown art and Mammon untouched');
 assert.strictEqual(R.weaponOff({nativeId:'b07-boss'}),true);assert.strictEqual(R.weaponOff({nativeId:'b04-boss'}),false);ok('only the wrath boss drops the cut-out broom');}
{const env=boot({},'ep1b09');const e={nativeId:'b07-boss',phase:2,path:'x_demon.webp'};vm.runInContext('drawEnemy',env)(e);assert.strictEqual(env.draws[0].phase,2);
 assert.strictEqual(env.window.__STORYWORLD_SIN_BOSS_ART_R463__.weaponOff({nativeId:'b07-boss'}),false);ok('other rooms reusing the id are untouched');}
{const env=boot({'storyworld.r463.sinboss':'{"form":false,"size":false,"weapon":false}'});const e={nativeId:'b07-boss',phase:2,path:'x_demon.webp'};vm.runInContext('drawEnemy',env)(e);const R=env.window.__STORYWORLD_SIN_BOSS_ART_R463__;
 assert.strictEqual(env.draws[0].phase,2);assert.strictEqual(R.sizeLock({nativeId:'b07-boss'},{sourcePath:'assets/r104/bosses/b07-boss-p1.webp',sourceRect:[0,0,1,473]},1),null);assert.strictEqual(R.weaponOff({nativeId:'b07-boss'}),false);ok('localStorage switches turn each part off');}
{const env=boot();env.window.__STORYWORLD_BOSS_KEYPOSES_R104__={enabled:true,phases:{'b07-boss':[0]},framesFor:()=>[1,2,3,4].map(i=>({path:'assets/r104/bosses/b07-boss-p'+i+'.webp'}))};
 const got=[];vm.runInContext('var sprite=function(p){got.push(p);};',Object.assign(env,{got}));vm.runInContext(CS('sin-boss-art-r463.js').replace("if(window.__STORYWORLD_SIN_BOSS_ART_R463__)return;",""),env);
 const d=D['b07-boss'];vm.runInContext('drawEnemy=function(e){sprite(e.path);sprite("'+d.attack+'");sprite("assets/fx/x.webp");}',env);vm.runInContext(CS('sin-boss-art-r463.js').replace("if(window.__STORYWORLD_SIN_BOSS_ART_R463__)return;",""),env);
 vm.runInContext('drawEnemy',env)({nativeId:'b07-boss',phase:1,path:d.idle});vm.runInContext('sprite',env)(d.idle);
 assert.deepStrictEqual(got.slice(0,4),['assets/r104/bosses/b07-boss-p4.webp','assets/r104/bosses/b07-boss-p2.webp','assets/fx/x.webp',d.idle]);ok('R104 bosses: whole-image sprite() fallback (hit flash) gets the matching key pose, only while that boss is drawn');}
// 훅 배선(최소 변경)
assert(/lock463\(e,b\)/.test(CS('combat-flow-r425.js'))&&/L463\?L463\.band:band\(e\)/.test(CS('combat-flow-r425.js')));ok('R425 size fit asks the R463 lock first');
assert(/__STORYWORLD_SIN_BOSS_ART_R463__\?\.weaponOff\?\.\(e\)\?null:WEAP\[e\.nativeId\]/.test(CS('combat-r114.js')));ok('R114 weapon pick asks R463');
assert(!/\.hp\s*=[^=]|\.damage\s*=|saveGame|\.cd\s*=/.test(CS('sin-boss-art-r463.js')));ok('no gameplay writes');
assert(!/ctx\.filter|drop-shadow|blur\(/.test(CS('sin-boss-art-r463.js')));ok('no recorder-unsafe filters');
console.log(n+' checks passed');
