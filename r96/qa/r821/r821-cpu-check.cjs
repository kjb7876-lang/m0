// R821 밝은 무늬 바닥 위 영웅 가독성(어두운 테 + 짙은 발 그림자, rosehouse 방에서만) CPU 검사
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),SRC=fs.readFileSync(path.join(R,'client-source','hero-ground-r821.js'),'utf8'),R409=fs.readFileSync(path.join(R,'client-source','combat-read-r409.js'),'utf8');
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d));};
const ROSE={surface:{art:{r118Tiles:{id:'sz115-S01-1',file:'rosehouse'}}}};
function world(opt={}){const store={};if(opt.off)store['storyworld.r821.heroGround']='{"on":false}';const log=[];
 const g={console,Math,Number,Object,JSON,Map,WeakMap,Set,String,Array,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;}},listeners:{},addEventListener(n,f){g.listeners[n]=f;},
  player:{hero:'hwando',x:5,y:5},room:{id:'ep1b05',exploration:opt.exploration===undefined?ROSE:opt.exploration},log,store};
 g.window=g;
 g.shadow=function(x,y,radius,opt){log.push({op:'shadow',x,y,radius,opt:opt?{...opt}:opt});};
 g.drawHero=function(){g.baseCalls=(g.baseCalls||0)+1;g.shadow(50,60,20,{lift:0});log.push({op:'body'});g.shadow(70,80,9,{alpha:.5});};
 vm.createContext(g);vm.runInContext(SRC+'\n;globalThis.__dh=()=>drawHero();globalThis.__setDH=f=>{drawHero=f;};globalThis.__getDH=()=>drawHero;globalThis.__shadow=()=>shadow;',g);return g;}
const A=g=>g.__STORYWORLD_HERO_GROUND_R821__;
// 1) 그 방: 발 그림자 한 번 + 넓은 두 겹, 몸보다 먼저
{const g=world(),s0=g.__shadow();g.__dh();const L=g.log,sh=L.filter(r=>r.op==='shadow');
 ok('engine foot shadow kept as is (first call unchanged)',JSON.stringify(sh[0])===JSON.stringify({op:'shadow',x:50,y:60,radius:20,opt:{lift:0}}),sh[0]);
 ok('two wider layers at the same spot',sh[1].x===50&&sh[1].y===60&&sh[1].radius===20&&sh[2].x===50&&Math.abs(sh[1].opt.scale-1.45)<1e-9&&sh[1].opt.alpha===1&&sh[1].opt.lift===0,sh.slice(1,3));
 ok('extra layers are drawn before the body',L.findIndex(r=>r.op==='body')===3,L.map(r=>r.op));
 ok('later shadow calls inside drawHero (not the feet) left alone',sh.length===4&&JSON.stringify(sh[3].opt)==='{"alpha":0.5}',sh[3]);
 ok('global shadow restored after drawHero',g.__shadow()===s0);
 ok('look reported',A(g).inspect().look==='rosehouse'&&A(g).active()===true);
 ok('no errors',A(g).inspect().stats.errors===0);}
// 2) R409 가 묻는 테
{const g=world(),r=A(g).rim();
 ok('rim: dark ink, thicker than the normal hero rim (k 1.05)',r&&/^rgba\(20,10,14,0\.8/.test(r.outer)&&/^rgba\(6,3,5,/.test(r.inner)&&r.k>1.05&&r.k<=2,r);
 ok('rim key names the look (separate bake cache)',r.key==='r821:rosehouse');
 const lum=s=>{const m=s.match(/rgba\((\d+),(\d+),(\d+)/);return .2126*m[1]+.7152*m[2]+.0722*m[3];};ok('rim is darker than the black tiles need (luma < 20)',lum(r.outer)<20&&lum(r.inner)<10);}
// 3) 다른 방·사몽 다른 바닥: 아무것도 하지 않는다
for(const [n,ex] of [['no R118 art',{surface:{art:{}}}],['sparring look',{surface:{art:{r118Tiles:{file:'sparring'}}}}],['no exploration',null]]){const g=world({exploration:ex});g.__dh();
 ok(n+': only the base draws',g.log.length===3,g.log.length);ok(n+': rim null',A(g).rim()===null);}
{const g=world({exploration:null});g.room.r118TileLook='rosehouse';ok('renderer-style r118TileLook also counts',A(g).active()===true);}
{const g=world({exploration:null});g.room.terrainArt={r118Tiles:{file:'rosehouse'}};ok('terrainArt file also counts',A(g).active()===true);}
for(const h of ['hwando','michaela']){const g=world();g.player.hero=h;ok('pale hero '+h+': dark rim',A(g).rim()!==null);}
for(const h of ['seoha','gunner','neon','lauren','hunter','slayer']){const g=world();g.player.hero=h;g.__dh();ok('hero '+h+' (own rim already reads): normal rim and shadow kept',A(g).rim()===null&&g.log.length===3);}
// 4) 끄기·켜기
{const g=world({off:true});g.__dh();ok('off switch: nothing added, rim null',g.log.length===3&&A(g).rim()===null);A(g).set(true);g.log.length=0;g.__dh();ok('set(true) turns it on',g.log.filter(r=>r.op==='shadow').length===4);ok('set stores the choice',g.store['storyworld.r821.heroGround']==='{"on":true}');}
// 5) 나중에 감싸여도 한 번만
{const g=world();const mine=g.__getDH();g.__setDH(function(){return mine();});g.listeners.load();g.__dh();ok('re-wrapped after load: still exactly two extra layers',g.log.filter(r=>r.op==='shadow').length===4&&g.baseCalls===1,g.log.length);}
// 6) drawHero 가 던져도 shadow 를 되돌린다
{const g=world(),s0=g.__shadow();g.__setDH(function(){throw new Error('x');});g.listeners.load();let threw=false;try{g.__dh();}catch(_){threw=true;}ok('base error propagates and shadow is restored',threw&&g.__shadow()===s0);}
// 7) 조율 값 상한
{const g=world();const t=A(g).tune({shadow:{times:99}});ok('tune clamps layers to 4',t.shadow.times===4);}
// 8) R409 연결: 어두운 테를 먼저 묻고, 없으면 평소 테
{const m=R409.match(/function heroLook\(\)\{[\s\S]*?\n[^\n]*\n[^\n]*\}catch\(_\)\{return null;\}\}/);ok('R409 heroLook found',!!m);
 const mk=(rim,pal)=>{const g={window:{},localStorage:{getItem:()=>null},player:{hero:'hwando'},JSON,String,Number};g.window.__STORYWORLD_HERO_GROUND_R821__=rim===undefined?undefined:{rim:()=>rim};g.window.__STORYWORLD_HERO_PALETTE_R302__={palette:{hwando:{main:[200,210,220],sub:[1,2,3]}}};vm.createContext(g);
  vm.runInContext('const RED_HERO=new Set(["michaela","slayer","hunter"]);function heroRimOn(){return true;}\n'+m[0]+'\n;globalThis.out=heroLook();',g);return g.out;};
 const d=mk({key:'r821:rosehouse',outer:'rgba(20,10,14,0.80)',inner:'rgba(6,3,5,0.96)',k:1.5});
 ok('R409 uses the dark rim in the room',d&&d.key==='hero:r821:rosehouse'&&d.outer==='rgba(20,10,14,0.80)'&&d.k===1.5,d);
 const n=mk(null);ok('R409 keeps the normal hero-colour rim elsewhere',n&&n.key==='hero:hwando'&&/200,210,220/.test(n.outer)&&n.k===1.05,n);
 const u=mk(undefined);ok('R409 works without R821 loaded',u&&u.key==='hero:hwando',u);}
// 9) 연결
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html tag after bulmyeongwi-r760, before combat-r118',/bulmyeongwi-r760\.js"><\/script>\s*<script src="\.\/hero-ground-r821\.js"><\/script>[\s\S]*combat-r118\.js/.test(idx));
ok('runtime-text copies match client-source',fs.readFileSync(path.join(R,'runtime-text','hero-ground-r821.js'),'utf8')===SRC&&fs.readFileSync(path.join(R,'runtime-text','combat-read-r409.js'),'utf8')===R409);
ok('verify-r96-public expects it',/hero-ground-r821\.js/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('runtime-inputs lists it',/hero-ground-r821\.js/.test(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')));
ok('pages.yml runs this check',/r96\/qa\/r821\/r821-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('floor art untouched: the overlay never writes to the room or tiles',!/room\.[a-zA-Z0-9_.]+\s*=[^=]|r118Tile[A-Za-z]*\s*=[^=]/.test(SRC));
console.log(`R821 CPU check: ${pass}/${total} passed`);process.exit(pass===total?0:1);
