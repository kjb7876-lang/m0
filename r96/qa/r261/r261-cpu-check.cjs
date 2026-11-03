// R261 — 길잡이: 앞방 문(door-1) 헛걸음 막기 + 가는 길의 보물상자·상자·포인트 구슬 챙기기(근처 적이 있으면 먼저 싸움).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const src=C('guide-loot-r261.js'),pol=C('polish-r101.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('guide door step skips the side-room door-1 (앞방) unless the target is within 6 tiles',/\(d\.id==='door-1'\|\|\/앞방\/\.test\(String\(d\.name\|\|''\)\)\)&&Math\.hypot\(pt\.x-d\.x,pt\.y-d\.y\)>6/.test(pol));
ok('runtime copies match',RT('guide-loot-r261.js')===src&&RT('polish-r101.js')===pol);
ok('route length is measured in tiles (navPath returns smoothed points, not steps), at most 24 tiles',/len\(r\)<=MAXLEN/.test(src)&&/MAXLEN=24/.test(src));
const idx=RT('index.html');ok('loads after the other guideStep wrappers (guide-unstick-r222, guide-difficulty-r189)',idx.indexOf('guide-loot-r261.js')>idx.indexOf('guide-unstick-r222.js')&&idx.indexOf('guide-unstick-r222.js')>0&&idx.indexOf('guide-difficulty-r189.js')>0);
// VM 실행
function make(o={}){const store={};const opened=[];const claims={};let baseCalls=0,interacts=0;
 const ctx={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},console,Math,JSON,String,Array,Set,Object,Number};
 ctx.window=ctx;Object.assign(ctx,{time:0,guide:true,started:true,modal:null,loading:false,storyScene:null,route:[],command:null,
  player:{x:5,y:5,hp:100},room:{id:'z1',props:o.props||[],enemies:[]},
  nearestEnemy:r=>o.enemy&&r>=8?{id:'e'}:null,interact:()=>{interacts++;},guideStep:()=>{baseCalls++;}});
 ctx.__STORYWORLD_GROWTH_R103__={state:()=>({opened}),openChest:p=>{opened.push(p.chestR103);return true;}};
 ctx.__STORYWORLD_CRATES_R108__={eligible:p=>!!p.crate,idOf:p=>p.id};
 ctx.__STORYWORLD_PROGRESSION_R62__={state:()=>({pointDropClaimsR64:claims})};
 ctx.__STORYWORLD_POLISH_R100__={navPath:(a,b)=>{const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y))+1;return [...Array(n)].map((_,i)=>({x:a.x+(b.x-a.x)*i/(n-1||1),y:a.y+(b.y-a.y)*i/(n-1||1)}));}};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,opened,claims,get base(){return baseCalls},get interacts(){return interacts}};}
{const t=make({props:[{id:'c1',x:9,y:5,chestR103:'ch1'},{id:'far',x:40,y:5,chestR103:'ch2'}]});const {ctx}=t;
 ctx.guideStep(.1);const cand=ctx.__STORYWORLD_GUIDE_LOOT_R261__.inspect();
 ok('picks the near unopened chest (12 tiles) and sets a route; far chests are ignored',cand.cur&&cand.cur.x===9&&ctx.route.length>0&&t.base===0,cand);
 ctx.player.x=8;ctx.time=1;ctx.guideStep(.1);ok('opens the chest on arrival (R103 openChest)',t.opened.includes('ch1'),t.opened);
 ctx.time=2;ctx.guideStep(.1);ok('after looting, hands control back to the original guide',t.base>=1);}
{const t=make({enemy:true,props:[{id:'c1',x:9,y:5,chestR103:'ch1'}]});t.ctx.guideStep(.1);ok('an enemy within 8 tiles: the original guide (fight) runs first, no loot detour',t.base===1&&!t.ctx.__STORYWORLD_GUIDE_LOOT_R261__.inspect().cur);}
{const t=make({props:[{id:'k1',x:6,y:5,crate:true},{id:'o1',x:12,y:5,r108Orb:true}]});const {ctx}=t;ctx.guideStep(.1);
 ok('crate next to the hero is broken with interact (E)',t.interacts===1);ctx.time=1;ctx.guideStep(.1);ok('then walks to the point orb',ctx.__STORYWORLD_GUIDE_LOOT_R261__.inspect().cur?.x===12);}
{const t=make({props:[{id:'c1',x:9,y:5,chestR103:'ch1'}]});t.ctx.guide=false;t.ctx.guideStep(.1);ok('does nothing when the guide is off',t.base===1&&!t.ctx.route.length);}
{const t=make({props:[{id:'c1',x:9,y:5,chestR103:'ch1'}]});t.ctx.guideStep(.1);t.ctx.time=9;t.ctx.guideStep(.1);t.ctx.time=10;t.ctx.guideStep(.1);
 ok('gives up a target after 8 s and never re-picks it on that map',!t.ctx.__STORYWORLD_GUIDE_LOOT_R261__.inspect().cur&&t.base>=1);}
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R261 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
