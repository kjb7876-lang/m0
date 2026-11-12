// R930 CPU check — 5부 카이로노미콘(kair01~10) 사이버펑크×마법공학 바닥·벽·조형물(사용자 2026-11-12 08:52Z).
//  kairo-tech-r930.js: R118 지역 타일 표에 카이로 룩을 넣고(그림만, 구조·충돌 그대로), 바닥 서사가 정해진 곳(검은 모래·묘지 흙길·시간의 숲)은 벽만 바꾸고,
//  기계 테마 방의 이끼 바위·나무 대문 장식을 기존 하이테크 조형물 그림으로 바꾼다. 타일은 코드로 그린 임시본(Dots CX-0081KC 결과가 오면 교체).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='kairo-tech-r930.js',src=rd('client-source/'+F);
// --- 연결 ---
ok('client-source exists and runtime copy matches',!!src&&src===rd('runtime-text/'+F));
const html=rd('runtime-text/index.html');
ok('script tag once, right after doors-theme-r832 (before world-tiles-r118, the R118 table it fills)',html.split('"./'+F+'"').length===2&&html.indexOf('<script src="./doors-theme-r832.js"></script>\n<script src="./'+F+'"></script>')>0&&html.indexOf('"./'+F+'"')<html.indexOf('"./world-tiles-r118.js"'));
ok('listed in verify-r96-public.py',/'kairo-tech-r930\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8'))&&/assets\/r930\//.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/node r96\/qa\/r930\/r930-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
const man=rd('runtime-manifest.json')+rd('runtime-inputs.json');
ok('runtime manifest lists the module and both tile images',['kairo-tech-r930.js','assets/r930/tiles/kc-deck.webp','assets/r930/tiles/kc-forge.webp'].every(f=>man.includes(f)));
// --- 그림 파일 ---
const webpSize=f=>{try{const b=fs.readFileSync(path.join(R,'runtime-text',f));if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];return null;}catch(_){return null;}};
for(const f of['kc-deck','kc-forge']){const s=webpSize('assets/r930/tiles/'+f+'.webp');ok(f+'.webp is a 2048x1024 webp (floor left, wall right — the R118 layout)',!!s&&s[0]===2048&&s[1]===1024);
 const sz=fs.existsSync(path.join(R,'runtime-text','assets/r930/tiles/'+f+'.webp'))?fs.statSync(path.join(R,'runtime-text','assets/r930/tiles/'+f+'.webp')).size:0;ok(f+'.webp stays light for the Pages budget (<400 KB): '+sz,sz>0&&sz<400000);}
let IDX=null;try{IDX=JSON.parse(rd('runtime-text/assets/r930/tiles/index.json'));}catch(_){}
ok('index.json marks the tiles temporary (code-made) and names the Dots request',!!IDX&&IDX.temporary===true&&IDX.dots==='CX-0081KC'&&!!IDX.looks?.['kc-deck']&&!!IDX.looks?.['kc-forge']);
// --- 동작 ---
function boot(opts={}){const timers=[];const store=opts.store||{};const regions={kair02:{file:'arbelia',floor:0xe4e4e8,wall:0xe2e2e6},kair03:{file:'sandblack',floor:0xffffff},kair07:{file:'workshop',floor:0xece4dc,wall:0xe4dcd4},
  kair09:{file:'gravepath',floor:0xe8e4e0,wall:0xe0e0e0},kair10:{file:'sandblack',floor:0xffffff},restKairo:{file:'sandgold',floor:0xd2c8bc},u206:{file:'corevault',floor:0xffffff,wall:0xeef0f4},dist00:{file:'garden',floor:0xeceae0}};
 const snapshot=JSON.stringify(regions);
 const c={console,localStorage:{getItem:k=>k in store?store[k]:null,setItem(k,v){store[k]=String(v);}},setInterval:(f)=>{timers.push(f);return timers.length;},clearInterval(){},setTimeout:(f)=>{timers.push(f);return 0;},requestAnimationFrame:()=>0,
  Image:function(){this.src='';},document:{createElement:()=>({getContext:()=>({drawImage(){}}),width:0,height:0})},loading:false};
 c.window=c;vm.createContext(c);
 if(!opts.lateR118)c.__STORYWORLD_TILES_R118__={regions,rowOf:k=>regions[k]||null};
 if(opts.r272)vm.runInContext(rd('client-source/props-r272.js'),c);
 vm.runInContext(src,c,{filename:F});
 if(opts.lateR118)c.__STORYWORLD_TILES_R118__={regions,rowOf:k=>regions[k]||null};
 const tick=()=>{for(const f of timers.slice())try{f();}catch(e){console.log('timer error',e.message);}};tick();tick();
 return{c,regions,snapshot,tick,api:c.__STORYWORLD_KAIRO_TECH_R930__};}
const B=boot(),A=B.api,RG=B.regions;
ok('API exported, loaded without error',!!A&&typeof A.apply==='function'&&typeof A.plan==='function'&&!A.inspect().lastError);
if(!A){console.log('\nR930 '+(n-bad)+'/'+n+' passed (stopped early)');process.exit(1);}
const DECKZ=['kair01','kair02','kair04','kair06','kair08'];
ok('kair01·02·04·06·08 get the cyber-magitech deck (floor + wall) from assets/r930/tiles/',DECKZ.every(k=>RG[k]&&RG[k].file==='kc-deck'&&RG[k].dir==='assets/r930/tiles/'&&RG[k].floor!=null&&RG[k].wall!=null));
ok('kair07 검은 공방 gets the forge look (amber circuits), floor + wall',RG.kair07&&RG.kair07.file==='kc-forge'&&RG.kair07.dir==='assets/r930/tiles/'&&RG.kair07.floor!=null&&RG.kair07.wall!=null);
ok('story floors kept: kair03·kair10 black sand and kair09 grave path keep their floor file',RG.kair03.file==='sandblack'&&RG.kair10.file==='sandblack'&&RG.kair09.file==='gravepath'&&RG.kair09.floor===0xe8e4e0);
ok('kair09 drops the old grave-path wall from its row so the R930 wall is the last word',RG.kair09.wall==null);
ok('wall-only plan for kair03·05·09·10 (the cyber wall over their story ground)',['kair03','kair05','kair09','kair10'].every(k=>{const p=A.plan(k);return p&&p.wall==='kc-deck'&&!p.floor;}));
ok('plan for deck/forge zones names floor and wall',DECKZ.every(k=>A.plan(k)?.floor==='kc-deck'&&A.plan(k)?.wall==='kc-deck')&&A.plan('kair07')?.floor==='kc-forge');
ok('nothing outside Kaironomicon changes (restKairo rest stop, u206, dist00, unknown ids)',JSON.stringify({restKairo:RG.restKairo,u206:RG.u206,dist00:RG.dist00})===JSON.stringify((({restKairo,u206,dist00})=>({restKairo,u206,dist00}))(JSON.parse(B.snapshot)))&&A.plan('restKairo')===null&&A.plan('u206')===null&&A.plan('kair11')===null&&A.plan('xkair01')===null);
{const L=boot({lateR118:true});ok('waits for the R118 table if it loads later (script order)',L.regions.kair01?.file==='kc-deck'&&L.regions.kair07?.file==='kc-forge');}
{const O=boot({store:{'storyworld.r930.kairo':'0'}});ok('off switch storyworld.r930.kairo=0 leaves the table as it was',JSON.stringify(O.regions)===O.snapshot);}
// 조형물
const V='assets/props/v290/';const TECH=['silver_seal_pillar','surveillance_console','chrono_engine','shattered_memory_core','rail_signal','industrial_barricade','ruined_portal','time_obelisk'];
const mk=(id,extra={})=>({id,layer:'STORY',exploration:{worldR74:{mode:'outdoor'}},props:[
 {id:id+':0',path:V+'moss_boulders.webp',height:1.1},{id:id+':1',path:V+'moss_boulders.webp',height:1.1},{id:id+':2',path:V+'moss_boulders.webp',height:1.1},
 {id:id+':3',r74Prop:'gate',r81NativeSkin:{path:V+'broken_gate.webp',scale:1}},{id:id+':4',path:V+'silver_seal_pillar.webp'},{id:id+':5',path:'assets/world-r80/r80-035.webp'},
 {id:id+':6',path:V+'moss_boulders.webp',solid:true},{id:id+':7',path:V+'moss_boulders.webp',interactive:true},{id:id+'-objective',path:V+'moss_boulders.webp'}],...extra});
const name=p=>String(p.r81NativeSkin?.path||p.path||'').replace(/^.*\//,'').replace(/\.webp$/,'');
{const r=mk('kair04');r.objective=r.props[8];const before=r.props.map(p=>p.id);A.apply(r);const names=r.props.map(name);
 ok('kair04: moss boulders become existing tech pieces (barricade / console / signal rotation)',['industrial_barricade','surveillance_console','rail_signal'].every((t,i)=>names[i]===t));
 ok('kair04: the wooden broken gate becomes the ruined rune portal (skin path), r74 prop kept',names[3]==='ruined_portal'&&r.props[3].r74Prop==='gate');
 ok('swapped pieces remember what they were',r.props.slice(0,4).every(p=>/moss_boulders|broken_gate/.test(p.r930From||'')));
 ok('solid, interactive and objective props are not touched; others unchanged; same objects, same order',names[6]==='moss_boulders'&&names[7]==='moss_boulders'&&names[8]==='moss_boulders'&&names[4]==='silver_seal_pillar'&&names[5]==='r80-035'&&r.props.map(p=>p.id).join()===before.join());
 const s=JSON.stringify(r.props);A.apply(r);ok('second pass changes nothing',JSON.stringify(r.props)===s);}
ok('every swap target is a tech piece the R272 canon rule allows here',['industrial_barricade','surveillance_console','rail_signal','ruined_portal'].every(t=>TECH.includes(t)));
for(const id of['kair05','kair09','kair03','kair10','restKairo','u206','dist02']){const r=mk(id);const s=JSON.stringify(r.props);A.apply(r);ok(id+': props untouched (forest / cemetery / black sand / outside Kairo)',JSON.stringify(r.props)===s);}
{const r=mk('kair04',{samongR115:{zone:'sz115-S07-1'}});const s=JSON.stringify(r.props);A.apply(r);ok('samong zone borrowing a Kairo id is untouched',JSON.stringify(r.props)===s);}
{const r=mk('kair04');r.layer='LEGACY';const s=JSON.stringify(r.props);A.apply(r);ok('non-STORY layer is untouched',JSON.stringify(r.props)===s);}
{const W=boot({r272:true});const r=mk('kair01');W.api.apply(r);W.c.__STORYWORLD_PROPS_R272__.apply(r);ok('R272 canon pass keeps every swapped piece in kair01 (no tug of war)',r.props.slice(0,4).map(name).join()==='industrial_barricade,surveillance_console,rail_signal,ruined_portal');}
{const O=boot({store:{'storyworld.r930.kairo':'0'}});const r=mk('kair04');const s=JSON.stringify(r.props);O.api.apply(r);ok('off switch leaves props alone',JSON.stringify(r.props)===s);}
// 벽 칠하기(벽만 바꾸는 지역)
{const W=boot();const tex=[];const T={CanvasTexture:function(cv){this.cv=cv;tex.push(this);},SRGBColorSpace:'srgb',LinearMipmapLinearFilter:1,LinearFilter:2,RepeatWrapping:3};
 const wall={map:null,color:{setHex(h){this.h=h;}},needsUpdate:false};const rend={T,wallMaterial:wall,stoneMaterial:{map:'sand'},spatialResources:{add(){}},renderer:null,disposed:false};
 const img={width:2048,height:1024};const done=W.api.paintWall(rend,'kair03',img);
 ok('paintWall: kair03 wall gets the R930 texture, floor left alone',done===true&&wall.map instanceof T.CanvasTexture&&wall.needsUpdate===true&&rend.stoneMaterial.map==='sand'&&rend.r930Wall==='kc-deck');
 const w2={map:'old',color:{setHex(){}}};ok('paintWall: deck zones (R118 paints them) and other zones are skipped',W.api.paintWall({T,wallMaterial:w2},'kair01',img)===false&&W.api.paintWall({T,wallMaterial:w2},'u206',img)===false&&w2.map==='old');}
// R204 실외 유기 지형(kair01·kair04 의 바닥 대부분은 R204 바닥판이 그린다): 텍스처 덮어쓰기 훅
{const cave=rd('client-source/cave-r204.js');ok('cave-r204 asks window.__STORYWORLD_R204_TEX__(zone) when it picks textures (one-line hook, runtime copy same)',/const TX=\{\.\.\.TEX,\.\.\.\(cfg\.tex\|\|\{\}\),\.\.\.\(\(\(\)=>\{try\{return window\.__STORYWORLD_R204_TEX__\?\.\(frame\.zone\)\|\|\{\};\}catch\(_\)\{return\{\};\}\}\)\(\)\)\}/.test(cave)&&cave===rd('runtime-text/cave-r204.js'));
 const t1=B.c.__STORYWORLD_R204_TEX__?.('kair01'),t4=B.c.__STORYWORLD_R204_TEX__?.('kair04');
 ok('R204 override: kair01·kair04 cliff faces use the R930 deck wall (half 1); floors stay stone (R204 warps floor UVs into swirls — straight circuits only read on walls; outdoor ground waits for Dots 1E)',!!t1&&!!t4&&[t1,t4].every(t=>!('floorA' in t)&&!('floorB' in t)&&t.face?.[0]==='assets/r930/tiles/kc-deck.webp'&&t.face[1]===1));
 ok('R204 override: forest kair05, other regions and samong get nothing',typeof B.c.__STORYWORLD_R204_TEX__==='function'&&B.c.__STORYWORLD_R204_TEX__('kair05')===null&&B.c.__STORYWORLD_R204_TEX__('dist01')===null&&B.c.__STORYWORLD_R204_TEX__('last302')===null&&B.c.__STORYWORLD_R204_TEX__('kair11')===null);
 {const O=boot({store:{'storyworld.r930.kairo':'0'}});ok('R204 override off with the switch',O.c.__STORYWORLD_R204_TEX__?.('kair01')==null);}}
const st=A.inspect();ok('inspect reports structure untouched and temporary art',st.collisionChanged===false&&st.layoutChanged===false&&st.temporaryArt===true&&st.dots==='CX-0081KC');
console.log('\nR930 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
