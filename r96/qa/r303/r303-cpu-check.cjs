// R303: 조형물 배치 맞춤 CPU 검사(합성 방 + 배선). 헤드리스·GPU 화면 검증이 아니다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..'),read=p=>fs.readFileSync(path.join(R,p),'utf8');
const src=read('client-source/props-fit-r303.js');let n=0;const ok=(name,fn)=>{fn();n++;console.log('PASS '+name);};
function world(){const store={},c={console,Math,JSON,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setTimeout:()=>0};
 c.window=c;c.room=null;c.draws=[];c.drawProp=function(p){c.draws.push(p);};c.readyImage=()=>true;c.__STORYWORLD_PROPS_R102__={lamps:()=>[{id:'lights_regional_01'}]};c.ctx={save(){},restore(){},translate(){},scale(x){c.lastScale=x;}};c.project=(x,y)=>({x:(x-y)*32,y:(x+y)*16});
 c.StoryPhase1={explorationBlocked:(L,x,y,s)=>{const cells=L.__set||(L.__set=new Set(L.floorCells.map(([a,b])=>a+':'+b)));for(const[dx,dy]of[[-s,-s],[s,-s],[-s,s],[s,s],[0,0]])if(!cells.has(Math.floor(x+dx)+':'+Math.floor(y+dy)))return true;return false;}};
 c.__STORYWORLD_MOOD_R123__={themeOf:z=>/^sz115-S02-/.test(z)?{key:'school'}:{key:'ink'}};
 vm.createContext(c);vm.runInContext(src,c,{filename:'props-fit-r303.js'});c.api=c.__STORYWORLD_PROPS_FIT_R303__;return c;}
const rect=(x0,y0,x1,y1)=>{const o=[];for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)o.push([x,y]);return o;};
function school(){const props=[];for(let i=0;i<6;i++)for(let j=0;j<5;j++)props.push({id:`r115:sz115-S02-7:g1:${i}:${j}`,x:14+i*3,y:14+j*2.6,solid:false,r74Prop:['cabinet','empty-bed','statue'][(i+j)%3],r191From:'workbench',r115Prop:'workbench'});
 props.push({id:'r115:sz115-S02-7:a1:w:105:150',x:10.7,y:15,solid:false,r74Prop:'cabinet',r115Prop:'cabinet'});
 props.push({id:'r115:sz115-S02-7:s:cabinet:0',x:20.5,y:24.5,solid:false,r74Prop:'cabinet',r115Prop:'cabinet'});
 props.push({id:'r103:save:1:1',x:12,y:27,solid:false,samongR103:'save',r74Prop:'statue',r191From:'brazier'});
 return{id:'ep1a09',props,exploration:{samongR115:{zone:'sz115-S02-7'},floorCells:rect(10,10,34,30),entry:{x:12.5,y:28.5},worldR74:{style:'clinic',mode:'indoor'}}};}
function hospital(){const lamp='assets/props/v290/broken_street_lamp.webp';return{id:'ep1a09',exploration:{worldR74:{style:'clinic',mode:'indoor',doors:[{x:20,y:10.5}]},floorCells:rect(4,4,40,30),entry:{x:6,y:28}},props:[
 {id:'r74:ep1a09:scenery:2',x:20.5,y:20.5,solid:false,r74Prop:'statue',r81NativeSkin:{path:lamp,height:80}},
 {id:'r74:ep1a09:scenery:3',x:30.5,y:15.5,solid:false,r74Prop:'statue'},
 {id:'r74:ep1a09:scenery:4',x:24.5,y:18.5,solid:false,r74Prop:'cabinet'},
 {id:'r74:ep1a09:scenery:5',x:20.2,y:11.5,solid:false,r74Prop:'empty-bed'},
 {id:'r74:ep1a09:scenery:6',x:33.5,y:24.5,solid:false,r74Prop:'empty-bed'},{id:'r74:ep1a09:scenery:7',x:33.8,y:24.7,solid:false,r74Prop:'empty-bed'},
 {id:'ep1a09-prop-3',x:12.5,y:22.5,key:'lamp',path:lamp,solid:false},{id:'ep1a09-prop-4',x:14.5,y:22.5,key:'ancientPillar',path:'assets/props/v290/collapsed_pillar.webp',solid:false},
 {id:'r81:scene:ep1a09:0',x:8.5,y:8.5,path:'assets/world-r80/r80-148.webp',r80Dressing:true,solid:false,height:70},{id:'r81:scene:ep1a09:1',x:8.5,y:26.5,path:'assets/world-r80/r80-149.webp',r80Dressing:true,solid:false,height:60},
 {id:'solid-statue',x:36.5,y:26.5,r74Prop:'statue',solid:true},{id:'r74:ep1a09:door-1',x:20,y:10.5,r74Door:{}}]};}
function forest(){return{id:'dist00',exploration:{worldR74:{style:'demon-tree-palace-garden',mode:'outdoor'},floorCells:rect(0,0,30,30)},props:[{id:'dist00-prop-1',x:10.5,y:10.5,key:'lamp',path:'assets/props/v290/broken_street_lamp.webp',solid:false},{id:'r74:dist00:scenery:2',x:15.5,y:15.5,r74Prop:'statue',solid:false}]};}
const shown=r=>r.props.filter(p=>!p.r303Hide);
const art=p=>String(p.r81NativeSkin?.path||p.path||p.key||p.r74Prop||'');
const snap=r=>JSON.stringify({cells:r.exploration.floorCells,solid:r.props.filter(p=>p.solid===true).map(p=>[p.id,p.x,p.y]),count:r.props.length});

ok('runtime copy matches source; loaded once right before mobile-perf-r298; verify list, pages.yml, manifest',()=>{
 assert.equal(read('runtime-text/props-fit-r303.js'),src);const idx=read('runtime-text/index.html');
 assert.equal(idx.split('"./props-fit-r303.js"').length,2);assert.ok(idx.indexOf('"./props-fit-r303.js"')<idx.indexOf('"./combat-r118.js"'));
 assert.ok(idx.indexOf('"./era-r191.js"')<idx.indexOf('"./props-fit-r303.js"')&&idx.indexOf('"./world-environment-r81.js"')<idx.indexOf('"./props-fit-r303.js"'));
 assert.ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'props-fit-r303.js'"));
 assert.ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('r96/qa/r303/r303-cpu-check.cjs'));
 assert.ok(JSON.parse(read('runtime-inputs.json')).textPaths.includes('props-fit-r303.js'));});

ok('theme detection uses existing data only (사몽 S-02 = school indoor; clinic indoor = hospital; outdoor garden)',()=>{const c=world();
 const a=c.api.themeOf(school()),b=c.api.themeOf(hospital()),f=c.api.themeOf(forest());
 assert.equal(a.theme,'school');assert.equal(a.indoor,true);assert.equal(a.samong,true);assert.equal(b.theme,'hospital');assert.equal(b.indoor,true);assert.equal(f.indoor,false);});

ok('사몽 학교 구역: R191 이 기증 지역(병원) 양식으로 바꾼 책상·저장 등불을 되돌린다 → 조각상·실외 소품 0',()=>{const c=world(),r=school(),before=snap(r);c.api.apply(r);
 assert.equal(r.props.filter(p=>/:g1:/.test(p.id)&&p.r74Prop!=='workbench').length,0);
 assert.equal(r.props.find(p=>p.samongR103).r74Prop,'brazier');
 assert.equal(shown(r).filter(p=>c.api.OUTDOOR.test(art(p))&&!p.samongR103).length,0);assert.equal(snap(r),before);});

ok('병원 실내: 가로등·기둥·조각상 그림 0 (R81 입힌 그림 → 방의 실내 장면 소품, R74 조각상 → 병원 가구), 충돌 소품은 그대로',()=>{const c=world(),r=hospital(),before=snap(r);c.api.apply(r);
 const bad=shown(r).filter(p=>p.solid!==true&&c.api.OUTDOOR.test(art(p)));assert.equal(bad.length,0,bad.map(p=>p.id).join());
 assert.equal(r.props.find(p=>p.id==='r74:ep1a09:scenery:2').r81NativeSkin.path,'assets/world-r80/r80-149.webp'); /* 벽붙이 약장(148)은 대체 그림으로 쓰지 않는다 */
 assert.ok(['empty-bed','cabinet'].includes(r.props.find(p=>p.id==='r74:ep1a09:scenery:3').r74Prop));
 const s=r.props.find(p=>p.id==='solid-statue');assert.equal(s.r74Prop,'statue');assert.ok(!s.r303Hide);assert.equal(snap(r),before);});

ok('벽붙이 캐비닛: 보이는 것은 모두 뒷벽에 닿고(벽까지 0.6칸 이하) 방향이 벽과 맞다(-x 벽 = 뒤집기, -y 벽 = 원본)',()=>{
 for(const mk of [school,hospital]){const c=world(),r=mk();c.api.apply(r);const L=r.exploration,B=(x,y)=>c.StoryPhase1.explorationBlocked(L,x,y,.05);
  const cabs=shown(r).filter(p=>p.r74Prop==='cabinet'&&!p.r81NativeSkin&&!/:g\d+:/.test(p.id)&&!p.samongR103);assert.ok(cabs.length>0);
  for(const p of cabs){assert.ok(p.r303Wall==='n'||p.r303Wall==='w',p.id);
   if(p.r303Wall==='n'){assert.ok(B(p.x,p.y-.6)&&!B(p.x,p.y),p.id);assert.ok(!p.r303Flip);}else{assert.ok(B(p.x-.6,p.y)&&!B(p.x,p.y),p.id);assert.equal(p.r303Flip,true);}}}});

ok('뒤집기는 그리기에서만(좌우 scale -1), 숨긴 소품은 그리지 않는다',()=>{const c=world(),r=hospital();c.api.apply(r);c.room=r;
 const w=r.props.find(p=>p.r303Flip);if(w){c.lastScale=0;c.drawProp(w);assert.equal(c.lastScale,-1);}
 const h=r.props.find(p=>p.r303Hide);assert.ok(h);c.draws.length=0;c.drawProp(h);assert.equal(c.draws.length,0);});

ok('바닥 장식: 문·입구·제단 곁(1.4칸)과 서로 겹침(0.8칸) 0',()=>{const c=world(),r=hospital();r.altar={x:30.5,y:15.5};c.api.apply(r);
 const avoid=[{x:20,y:10.5},r.exploration.entry,r.altar];const vis=shown(r).filter(p=>c.api.isScenery(p)&&!p.r303Wall);
 for(const p of vis)for(const q of avoid)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=1.4,p.id);
 for(const p of vis)for(const q of vis)if(p!==q)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=.8,p.id+'~'+q.id);});

ok('실외 지역은 가로등·조각상을 그대로 둔다',()=>{const c=world(),r=forest();c.api.apply(r);assert.equal(shown(r).length,2);assert.equal(r.props[1].r74Prop,'statue');});

ok('결정적: 같은 방은 늘 같은 결과, 두 번 적용해도 그대로',()=>{const run=()=>{const c=world(),r=hospital();c.api.apply(r);c.api.apply(r);return JSON.stringify(r.props);};assert.equal(run(),run());
 const c=world(),r=school();c.api.apply(r);const a=JSON.stringify(r.props);r.props.push({id:'late',x:1,y:1});c.api.apply(r);r.props.pop();assert.equal(JSON.stringify(r.props),a);});


ok('맵 이동 표식(사몽 출구·뒷문)에 오벨리스크 그림 0 — 학교·병원·집 = 나무 문, 성당·성 = 청동 문, 야외·꿈 = 무너진 포탈·계단; 기능·위치는 그대로',()=>{const c=world(),A=c.api;
 const T=[['school',true],['hospital',true],['domestic',true],['chapel',true],['castle',true],['forest',false],['other',false],['dream:ink',false],['dream:rose',false]];
 for(const[theme,indoor]of T)for(const k of ['portal','back']){const m=A.markerArt({id:'x',samongR103:k,r74Prop:'obelisk'},{theme,indoor});assert.ok(m,theme+k);assert.ok(!/obelisk/.test(JSON.stringify(m)),theme+k);}
 assert.equal(A.markerArt({id:'x',samongR103:'portal'},{theme:'school',indoor:true}).r74Prop,'oak-open');
 assert.equal(A.markerArt({id:'x',samongR103:'back'},{theme:'chapel',indoor:true}).r74Prop,'bronze-closed');
 const r=school();c.api.apply(r);c.room=r;const back={id:'r103:back:1:1',x:12,y:12,samongR103:'back',r74Prop:'obelisk',solid:false};r.props.push(back);
 c.draws.length=0;c.drawProp(back);assert.equal(c.draws[0].r74Prop,'oak-closed');assert.equal(c.draws[0].x,12);assert.equal(back.r74Prop,'obelisk');});
ok('학교·병원 실내에 가로등·오벨리스크 그림 0(기능 소품 포함): 저장 등불 = 실내 조명, R92 광원 = 실내 조명 묶음',()=>{
 for(const mk of [school,hospital]){const c=world(),r=mk();c.api.apply(r);c.room=r;const save={id:'r103:save:5:5',x:15,y:15,samongR103:'save',r74Prop:'brazier'};r.props.push(save);
  c.draws.length=0;for(const p of r.props)c.drawProp(p);
  const arts=c.draws.map(p=>String(p.r81NativeSkin?.path||p.path||p.key||p.r74Prop||''));
  assert.equal(arts.filter(a=>/street_lamp|obelisk|lights_regional_01/.test(a)).length,0,arts.join());
  assert.ok(/assets\/r92\/lights\/lights_(hospital|domestic)_0\d\.png/.test(c.draws.find(p=>p.id===save.id).path));
  const L=c.__STORYWORLD_PROPS_R102__.lamps('z','regional',[{id:'lights_hospital_03',kind:'light'},{id:'lights_domestic_01',kind:'light'},{id:'lights_regional_01',kind:'light'}],[],'regional');
  assert.ok(L.length>0&&L.every(i=>i.id!=='lights_regional_01'));}
 const c=world(),f=forest();c.room=f;assert.equal(c.__STORYWORLD_PROPS_R102__.lamps('z','regional',[],[],'regional')[0].id,'lights_regional_01');});
ok('끄기 설정이면 아무것도 바꾸지 않는다',()=>{const c=world();c.api.set({on:false});const r=hospital(),b=JSON.stringify(r);c.api.apply(r);assert.equal(JSON.stringify(r),b);});
console.log(n+' checks passed');
