// R830·R831 CPU check — 조형물을 서사·시대에 맞는 지역에만(사용자 2026-11-12), 마름모 밑면 조형물의 발밑 그림자 자리.
//  규칙은 props-r272.js(fit·towerOk), 쓰는 곳은 props-r272(지역 조형물)·env-props-r299(바닥 육망성·붉은 천 고목)·combat-r170(피의 육망성 조형물).
//  fixtures/regions.json = 헤드리스 게임에서 뽑은 본편 64개 지역의 실제 조형물 목록(그림 이름·스킨·실내 여부).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const FILES=['props-r272.js','env-props-r299.js','combat-r170.js','prop-shadow-r329.js','props-r102.js'];
ok('runtime copies match client-source',FILES.every(f=>rd('client-source/'+f)&&rd('client-source/'+f)===rd('runtime-text/'+f)));
ok('CI runs this check',/node r96\/qa\/r830\/r830-cpu-check\.cjs/.test(rd('../.github/workflows/pages.yml')));
function boot(stored){const c={localStorage:{getItem:k=>stored&&stored[k]||null,setItem(){}},setInterval:()=>0,setTimeout:()=>0,console,getRoom:()=>null,zone:'x',regionById:{}};c.window=c;vm.createContext(c);vm.runInContext(rd('client-source/props-r272.js'),c);return c;}
const C=boot(),P=C.__STORYWORLD_PROPS_R272__;
ok('rule API exported, module loaded without error',!!P&&typeof P.fit==='function'&&typeof P.towerOk==='function'&&typeof P.fitPath==='function'&&!P.inspect().lastError);
if(!P||!P.fit){console.log('\nR830 '+(n-bad)+'/'+n+' passed (stopped early)');process.exit(1);}
const P1=['hub','dist00','dist01','dist02','dist03','dist04','dist05','dist06','ep1a08','ep1a09','ep1a09b','ep1a10','ep1a11'];
const OTHER=['ep1b01','ep1b05','ep1b06b','ep1b09','u201','u206','last301','last302','last303','last304','kair05','hando01','murder01','cult01','restLast3','dreamRest'];
const out=id=>({id,outdoor:true}),inn=id=>({id,outdoor:false});
// 1) 피분수·악마화 나무: 1부 본편 야외에만
for(const a of['corrupted_shrine','dead_tree','r299/tree']){
 ok(a+': stays on every Part 1 outdoor map',P1.every(id=>P.fit(a,out(id))===true));
 ok(a+': never indoors, even in Part 1',P1.every(id=>P.fit(a,inn(id))===false));
 ok(a+': never outside Part 1 (outdoor or indoor)',OTHER.every(id=>P.fit(a,out(id))===false&&P.fit(a,inn(id))===false));
 ok(a+': never in a samong zone that borrows a Part 1 region',P1.every(id=>P.fit(a,{id,outdoor:true,samong:true})===false));}
// 2) 피의 육망성 바닥 그림: 1부 본편에만(실내 포함)
ok('blood hexagram decal: Part 1 only, indoor or outdoor',P1.every(id=>P.fit('r299/hexagram',out(id))===true&&P.fit('r299/hexagram',inn(id))===true)&&OTHER.every(id=>P.fit('r299/hexagram',out(id))===false));
ok('blood hexagram decal: not in samong zones',P.fit('r299/hexagram',{id:'ep1a09',outdoor:false,samong:true})===false&&P.fit('r299/hexagram',{id:'last302',outdoor:true,samong:true})===false);
// 3) 하이테크: 기계 테마 지역에만
const TECH=['silver_seal_pillar','surveillance_console','chrono_engine','shattered_memory_core','rail_signal','industrial_barricade','ruined_portal','time_obelisk'];
const MACH=['u201','u202','u203','u204','u205','u206','ep1b09','cult01','cult02','cult03','cult04','cult05','cult06','kair01','kair05','kair10','restU2','restKairo','restEp1b'];
const NOMACH=['hub','dist00','dist05','ep1a10','ep1b01','ep1b08','last301','last302','last303','last304','last305','hando01','hando02','hando03','murder01','restLast3','restHando','village'];
ok('tech pieces stay in machine-themed regions (controller, bio-bootloader, cyborg cult, Kaironomicon), indoors and outdoors, samong donors too',TECH.every(a=>MACH.every(id=>P.fit(a,out(id))===true&&P.fit(a,inn(id))===true&&P.fit(a,{id,outdoor:true,samong:true})===true)));
ok('tech pieces elsewhere: a fallen stone pillar outdoors, nothing indoors',TECH.every(a=>NOMACH.every(id=>P.fit(a,out(id))==='collapsed_pillar'&&P.fit(a,inn(id))===false)));
ok('everything else is left alone',['moss_boulders','collapsed_pillar','blood_altar','bone_heap','broken_gate','village_well','r80-021','tree-dead-00','tree','hexagram','','chest-closed'].every(a=>[...P1,...OTHER].every(id=>P.fit(a,out(id))===true&&P.fit(a,inn(id))===true)));
ok('art names: r299 pieces keep their folder so other art called tree/hexagram is untouched',P.artName('assets/r299/tree.webp')==='r299/tree'&&P.artName('assets/r99/outdoor/tree.webp')==='tree'&&P.artName('assets/props/v290/dead_tree.webp')==='dead_tree'&&P.artName('assets/vfx/v31324/salvage-zones/last301/silver_seal_pillar.webp')==='silver_seal_pillar'&&P.artName(undefined)==='');
// 4) 실제 지역 자료에 적용
let FX=null;try{FX=JSON.parse(rd('qa/r830/fixtures/regions.json'));}catch(_){}
ok('fixture: 64 real story regions',!!FX&&FX.length===64&&FX.every(z=>z.id&&Array.isArray(z.props)));
if(FX){const V='assets/props/v290/';const mk=z=>({id:z.id,layer:'STORY',exploration:{worldR74:{mode:z.indoor?'indoor':'outdoor'}},props:z.props.map((q,i)=>q.skin?{id:z.id+':'+i,r74Prop:'pine',r81NativeSkin:{path:'assets/vfx/v31324/salvage-zones/'+z.id+'/'+q.a+'.webp',height:90}}:{id:z.id+':'+i,path:(q.a.startsWith('r299/')?'assets/':V)+q.a+'.webp',height:100,key:'k'})});
 const name=p=>P.artName(p.r81NativeSkin?.path||p.path),has=(r,set)=>r.props.filter(p=>set.includes(name(p))).length;
 const before={},after={};let dropped=0,swapped=0,total=0;
 for(const z of FX){const r=mk(z);total+=r.props.length;before[z.id]=r.props.map(name);P.apply(r);after[z.id]={r,z};dropped+=before[z.id].length-r.props.length;swapped+=r.props.filter(p=>p.r830From).length;}
 const BL=['corrupted_shrine','dead_tree','r299/tree'];
 ok('fixture reproduces the complaint: blood fountain / demon tree / tech pillar stood outside their story before (last301 had both)',before.last301.includes('corrupted_shrine')&&before.last301.includes('silver_seal_pillar')&&FX.filter(z=>!P1.includes(z.id)&&before[z.id].some(a=>BL.includes(a))).length>=10);
 ok('after: blood fountain and demon tree only on Part 1 outdoor maps',Object.values(after).every(({r,z})=>has(r,BL)===0||(P1.includes(z.id)&&!z.indoor)));
 ok('after: Part 1 outdoor maps keep theirs (dist00 garden of the demonized tree, dist02, dist04~06, hub)',['hub','dist00','dist02','dist04','dist05','dist06'].every(id=>has(after[id].r,BL)===before[id].filter(a=>BL.includes(a)).length&&has(after[id].r,BL)>0));
 ok('after: tech pieces only in machine-themed regions',Object.values(after).every(({r,z})=>has(r,TECH)===0||/^(u20[1-6]|cult0[1-6]|kair(0[1-9]|10)|ep1b09|restU2|restKairo|restEp1b)$/.test(z.id)));
 ok('after: machine regions keep every tech piece',MACH.filter(id=>after[id]).every(id=>has(after[id].r,TECH)===before[id].filter(a=>TECH.includes(a)).length));
 ok('swapped pieces point at an existing image and remember what they were',Object.values(after).every(({r})=>r.props.filter(p=>p.r830From).every(p=>{const f=p.r81NativeSkin?.path||p.path;return f===V+'collapsed_pillar.webp'&&fs.existsSync(path.join(R,'runtime-text',f))||fs.existsSync(path.join(R,'hospital-three-pc','site',f));})));
 ok('decoration only: nothing solid or interactive is touched, other props are the same objects in the same order',Object.values(after).every(({r,z})=>{const keep=before[z.id].filter(a=>P.fit(a,{id:z.id,outdoor:!z.indoor})===true);return r.props.filter(p=>!p.r830From).map(name).join()===keep.join();}));
 ok('a second pass changes nothing (stable)',Object.values(after).every(({r})=>{const s=JSON.stringify(r.props);P.apply(r);return JSON.stringify(r.props)===s;}));
 ok('scale of the change is modest: '+dropped+' removed, '+swapped+' swapped of '+total,dropped>0&&swapped>0&&dropped+swapped<total*.25);
 const off=boot({'storyworld.r272.props':'{"on":true,"canon":false}'}).__STORYWORLD_PROPS_R272__,r0=mk(FX.find(z=>z.id==='last301')),n0=r0.props.length;off.apply(r0);
 ok('off switch {"canon":false} leaves props as they were',r0.props.length===n0&&r0.props.every(p=>!p.r830From)&&off.towerOk({id:'u201'})===true);}
{const g={id:'goal',path:'assets/props/v290/shattered_memory_core.webp'},r={id:'last302',layer:'STORY',objective:g,exploration:{worldR74:{mode:'outdoor'}},props:[g,{id:'x:objective:1',path:'assets/props/v290/shattered_memory_core.webp'},{id:'s',solid:true,path:'assets/props/v290/silver_seal_pillar.webp'},{id:'i',interactive:true,path:'assets/props/v290/corrupted_shrine.webp'},{id:'d',path:'assets/props/v290/corrupted_shrine.webp'}]};P.apply(r);
 ok('the objective marker, solid pieces and interactive pieces are never removed or swapped',r.props.map(p=>p.id).join()==='goal,x:objective:1,s,i'&&r.props.every(p=>!p.r830From));}
// 5) 피의 육망성 조형물(R170 탑): 1부 본편에만, 사몽의 기억 조각은 그대로
ok('blood hexagram tower: Part 1 story regions only',P1.every(id=>P.towerOk({id,exploration:{}})===true)&&OTHER.every(id=>P.towerOk({id,exploration:{}})===false));
ok('samong memory-fragment towers are not affected',P.towerOk({id:'last302',samongR103:{zone:'x'},exploration:{}})===true&&P.towerOk({id:'u201',exploration:{samongR115:{zone:'z'}}})===true);
{const s=rd('client-source/combat-r170.js');ok('combat-r170 asks the rule before placing a tower and before choosing its art',/if\(!canonTower\(\)\)return 0;/.test(s)&&/P\.towerOk\(room\)!==false/.test(s)&&/STATUE\.test\(String\(o\.path\|\|''\)\)&&canonArt\(o\.path\)/.test(s));}
// 6) R299 바닥 그림·큰 조형물
{const src=rd('client-source/env-props-r299.js');const c={localStorage:{getItem:()=>null,setItem(){}},console,setInterval:()=>0,setTimeout:()=>0,__STORYWORLD_PROPS_R272__:P};c.window=c;vm.createContext(c);let E=null;try{vm.runInContext(src,c);E=c.__STORYWORLD_ENV_PROPS_R299__;}catch(e){}
 ok('R299 loads and exposes plan',!!E&&typeof E.plan==='function');
 if(E&&E.plan){const cells=[];for(let y=0;y<40;y++)for(let x=0;x<40;x++)cells.push([x,y]);
  const room=(id,style,mode,extra={})=>({id,layer:extra.layer||'STORY',props:[],exploration:{floorCells:cells,worldR74:{style,mode,doors:[]},...(extra.L||{})}});
  const names=r=>E.plan(r).items.map(i=>i.name);
  const sm=['sz-a','sz-b','sz-c','sz-d','sz-e','sz-f'].map(z=>names(room('last302','x','outdoor',{layer:'DREAM',L:{samongR115:{zone:z}}})));
  ok('samong zones no longer get the blood hexagram decal (they still get their other pieces)',sm.every(l=>!l.includes('hexagram')&&l.length>=3));
  ok('forest maps outside Part 1 no longer get the red-rag tree',['last304','last305','kair05'].every(id=>!names(room(id,'x-forest','outdoor')).includes('tree')));
  ok('Part 1 forest maps still may',names(room('dist00','demon-tree-palace-garden','outdoor')).includes('tree'));
  const p1=['dist00','dist02'].map(id=>names(room(id,id==='dist00'?'demon-tree-palace-garden':'face-reed-black-swamp','outdoor'))),cl=names(room('ep1a09','clinic','indoor')),o=names(room('dreamRest','consultation','indoor'));
  ok('the blood hexagram decal is a candidate only on Part 1 maps (seen on at least one; never on a non-Part-1 clinic)',[...p1,cl].some(l=>l.includes('hexagram'))&&!o.includes('hexagram'));}}
// 7) R831 발밑 그림자: 마름모 밑면만 올린다
{const src=rd('client-source/prop-shadow-r329.js');const F=new Function('window','localStorage','src',`let drawProp=function(){},sprite=()=>{},drawAssetFrame3=()=>{},shadow=()=>{};const ctx={save(){},restore(){},translate(){},scale(){}},project=(x,y)=>({x,y});${src}\n;return window.__STORYWORLD_PROP_SHADOW_R329__;`)({}, {getItem:()=>null,setItem(){}},src);
 const S=F.footShift,N=100,rows=f=>Array.from({length:N},(_,i)=>f(i/N));
 const diamond=rows(t=>t<.24?.06+t/.24*.94:t<.7?1:.6),flat=rows(()=>.9),tree=rows(t=>t<.45?.18:.95),goblet=rows(t=>t<.1?.5:t<.3?.25:1),legs=rows(t=>t<.05?.1:t<.12?.6:t<.2?.3:1);
 ok('diamond-based box (altar lamp, chest): ellipse moves up to the side corners (~0.24 of the height)',Math.abs(S(diamond,1.2)-.24)<.03);
 ok('flat-based pieces are untouched',S(flat,1.2)===0);
 ok('trunks, goblets and legged pieces are untouched',S(tree,1.2)===0&&S(goblet,1.2)===0&&S(legs,1.2)===0);
 ok('tall narrow art is untouched even with a pointed foot',S(diamond,.6)===0);
 ok('never more than 0.3 of the height',S(rows(t=>t<.38?.05+t/.38*.95:1),1.2)<=.3&&S(rows(t=>t<.38?.05+t/.38*.95:1),1.2)>0);
 // 그리기 순서: 엔진 drawProp 이 shadow → sprite 순서로 부를 때 타원이 올라간 자리·넓힌 크기로 그림보다 먼저 그려진다(가짜 캔버스가 그림 모양을 돌려준다)
 const log=[];const W=new Function('window','localStorage','log','src',`let shadow=(x,y,r,o)=>log.push(['shadow',x,y,r,o&&o.scale||1]),sprite=(p,x,y,h,o)=>log.push(['sprite',p,y,o&&o.filter||'none']),drawAssetFrame3=()=>{};
  const FOOT={box:t=>t<.25?.05+t/.25*.95:1,post:t=>.9},readyImage=p=>({image:{naturalWidth:120,naturalHeight:100,tag:/box/.test(p)?'box':'post'}}),project=(x,y)=>({x:x*10,y:y*10}),ctx={save(){},restore(){},translate(){},scale(){}};
  class OffscreenCanvas{constructor(w,h){this.w=w;this.h=h;}getContext(){const w=this.w,h=this.h;let tag='post';return{drawImage(img){tag=img.tag;},getImageData(){const d=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++){const t=(h-1-y)/h,ww=FOOT[tag](t),l=Math.round((1-ww)/2*w),r=Math.round((1+ww)/2*w);for(let x=l;x<r;x++)d[(y*w+x)*4+3]=255;}return{data:d};}};}}
  let drawProp=function(p){shadow(p.x*10,p.y*10,20,{lift:0});sprite(p.path,p.x*10,p.y*10,80,{alpha:1});};
  ${src}\n;return{draw:p=>drawProp(p),api:window.__STORYWORLD_PROP_SHADOW_R329__};`)({}, {getItem:k=>null,setItem(){}},log,src);
 W.draw({id:'altar',path:'assets/x/box.webp',x:3,y:4});const a=log.slice();log.length=0;W.draw({id:'post',path:'assets/x/post.webp',x:3,y:4});const b=log.slice();log.length=0;
 const sh=a.find(c=>c[0]==='shadow'),own=a.findIndex(c=>c[0]==='sprite'&&c[3]==='none');
 ok('box: one ellipse, raised about a quarter of the drawn height (80px → ~20px) and widened, drawn before the art',a.filter(c=>c[0]==='shadow').length===1&&sh&&Math.abs((40-sh[2])-20)<3&&sh[4]>1.2&&a.indexOf(sh)<own);
 const sb=b.find(c=>c[0]==='shadow');ok('post: ellipse exactly where the engine put it, same size',b.filter(c=>c[0]==='shadow').length===1&&sb[2]===40&&sb[4]===1);
 W.api.setFoot(false);W.draw({id:'altar',path:'assets/x/box.webp',x:3,y:4});const o=log.find(c=>c[0]==='shadow');ok('off switch storyworld.r831.footShadow=0',o&&o[2]===40&&o[4]===1);}
// 8) 불면귀 마을의 제단 등불(붉은 천 돌 제단 + 금빛 등잔)은 마을에 어울리지 않아 석등·향로만 남긴다
{const s=rd('client-source/props-r102.js');ok('Eastern village keeps the stone lantern and the censer; the cloth-draped stone altar lamp is no longer chosen',/EAST_KEEP=Object\.freeze\(new Set\(\['lights_regional_02','lights_regional_03'\]\)\)/.test(s)&&/list\.filter\(i=>EAST_KEEP\.has\(i\.id\)\)/.test(s));}
console.log('\nR830 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
