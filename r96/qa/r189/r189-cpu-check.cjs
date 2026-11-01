// R189 CPU check: 장식 문·계단을 벽에 붙임(진행용 R81 문은 그대로), 'outdoor' 같은 낱말 오인 없음, 길잡이 다음 지역 난이도.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('doors-r189 then guide-difficulty-r189 load after edges-r188, before combat-r118',idx.indexOf('./doors-r189.js')>idx.indexOf('./edges-r188.js')&&idx.indexOf('./guide-difficulty-r189.js')>idx.indexOf('./doors-r189.js')&&idx.indexOf('./guide-difficulty-r189.js')<idx.indexOf('./combat-r118.js'));
for(const f of ['doors-r189.js','guide-difficulty-r189.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
const pub=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ok('both in the public verify list',/'doors-r189\.js'/.test(pub)&&/'guide-difficulty-r189\.js'/.test(pub));
// 문·계단
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,performance:{now:()=>0},blocked:()=>false};vm.createContext(sb);vm.runInContext(C('doors-r189.js'),sb);const D=sb.window.__STORYWORLD_DOORS_R189__;
ok('kinds: broken_gate→gate, collapsed_stairs/R123 stairs→stairs, r99 outdoor tree→none, R74/R81 progression doors→none',D.kindOf({key:'gate',path:'assets/props/v290/broken_gate.webp'})==='gate'&&D.kindOf({key:'stairs',path:'assets/props/v290/collapsed_stairs.webp'})==='stairs'&&D.kindOf({r123Deco:{kind:'stairs'}})==='stairs'&&D.kindOf({path:'assets/r99/outdoor/tree-a.webp'})===null&&D.kindOf({r74Door:{}})===null&&D.kindOf({r81WardDoor:true,key:'door'})===null);
const walls=[{x:10,y:5,width:12,depth:.24}];const q=D.snapPoint({x:12,y:8.5},walls,.35,null);
ok('snaps onto the floor-side face of the nearest wall, keeping its place along the wall',q&&Math.abs(q.y-(5+.12+.35))<1e-9&&Math.abs(q.x-12)<1e-9&&q.horiz===true,q);
ok('a prop more than 8 tiles from any wall is left alone',D.snapPoint({x:40,y:40},walls,.35,null)===null);
const room={exploration:{walls},props:[{key:'stairs',x:11,y:9,solid:false,visualOnly6:true},{key:'gate',x:12,y:9,solid:true},{path:'assets/r99/outdoor/tree.webp',x:9,y:9,solid:false,visualOnly6:true}]};D.arrange(room);
ok('only decorative non-solid door/stair props move; stairs flagged as level passage',room.props[0].r189Stairs===true&&Math.abs(room.props[0].y-(5+.12+.55))<1e-9&&room.props[1].y===9&&room.props[2].y===9);
// 길잡이 난이도
const g={window:{__STORYWORLD_GUIDE_R77__:Object.freeze({armNextNormal(){},takeNextNormal:(d)=>d==='ok'?'normal':null})},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,room:{difficultyR63:'hard'},toast(){}};vm.createContext(g);vm.runInContext(C('guide-difficulty-r189.js'),g);
const G=g.window.__STORYWORLD_GUIDE_R77__,T=g.window.__STORYWORLD_GUIDE_TIER_R189__;
ok("guide travel keeps the current map's tier by default (was forced to normal)",G.takeNextNormal('ok')==='hard');
ok('a refused guide hand-off stays refused (picker opens as before)',G.takeNextNormal('no')===null);
T.set('easy');ok('settings choice applies from the next guided map',G.takeNextNormal('ok')==='easy');
ok('other guide API members preserved',typeof G.armNextNormal==='function');
ok('settings select r189GuideTier with follow/easy/normal/hard',/s\.id='r189GuideTier'/.test(C('guide-difficulty-r189.js'))&&T.TIERS.join()==='follow,easy,normal,hard');
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
