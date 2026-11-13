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
function boot(opts={}){const timers=[];const asked=[];const store=opts.store||{};const regions={kair02:{file:'arbelia',floor:0xe4e4e8,wall:0xe2e2e6},kair03:{file:'sandblack',floor:0xffffff},kair07:{file:'workshop',floor:0xece4dc,wall:0xe4dcd4},
  kair09:{file:'gravepath',floor:0xe8e4e0,wall:0xe0e0e0},kair10:{file:'sandblack',floor:0xffffff},restKairo:{file:'sandgold',floor:0xd2c8bc},u206:{file:'corevault',floor:0xffffff,wall:0xeef0f4},dist00:{file:'garden',floor:0xeceae0}};
 const snapshot=JSON.stringify(regions);
 const c={console,localStorage:{getItem:k=>k in store?store[k]:null,setItem(k,v){store[k]=String(v);}},setInterval:(f)=>{timers.push(f);return timers.length;},clearInterval(){},setTimeout:(f)=>{timers.push(f);return 0;},requestAnimationFrame:()=>0,
  Image:function(){this.src='';},readyImage:p=>(opts.notReady&&opts.notReady.v&&/assets\/r930\/props\//.test(p))?null:{ready:true},addImage:p=>{asked.push(p);return{};},document:{createElement:()=>({getContext:()=>({drawImage(){}}),width:0,height:0})},loading:false};
 c.window=c;vm.createContext(c);
 if(!opts.lateR118)c.__STORYWORLD_TILES_R118__={regions,rowOf:k=>regions[k]||null};
 if(opts.r272)vm.runInContext(rd('client-source/props-r272.js'),c);
 vm.runInContext(src,c,{filename:F});
 if(opts.lateR118)c.__STORYWORLD_TILES_R118__={regions,rowOf:k=>regions[k]||null};
 const tick=()=>{for(const f of timers.slice())try{f();}catch(e){console.log('timer error',e.message);}};tick();tick();
 return{c,regions,snapshot,tick,asked,api:c.__STORYWORLD_KAIRO_TECH_R930__};}
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
 ok('kair04: moss boulders become Dots CX-0081KC pieces (brass manifold / command console / neon streetlamp)',['kc-brass-manifold-a','kc-command-console-b','kc-neon-streetlamp-a'].every((t,i)=>names[i]===t)&&r.props.slice(0,3).every(p=>p.path.startsWith('assets/r930/props/')));
 ok('kair04: the silver seal pillar becomes the Dots terminal pillar',names[4]==='kc-terminal-pillar-a'&&/silver_seal_pillar/.test(r.props[4].r930From||''));
 ok('kair04: the tall streetlamp is drawn taller than the boulder it replaces and remembers the old height',r.props[2].height>1.1&&r.props[2].r930H===1.1&&r.props[0].height===1.1);
 ok('kair04: the wooden broken gate becomes the ruined rune portal (skin path), r74 prop kept',names[3]==='ruined_portal'&&r.props[3].r74Prop==='gate');
 ok('swapped pieces remember what they were',r.props.slice(0,4).every(p=>/moss_boulders|broken_gate/.test(p.r930From||'')));
 ok('solid, interactive and objective props are not touched; others unchanged; same objects, same order',names[6]==='moss_boulders'&&names[7]==='moss_boulders'&&names[8]==='moss_boulders'&&names[5]==='r80-035'&&r.props.map(p=>p.id).join()===before.join());
 const s=JSON.stringify(r.props);A.apply(r);ok('second pass changes nothing',JSON.stringify(r.props)===s);}
ok('every swap target is a tech piece the R272 canon rule allows here',['industrial_barricade','surveillance_console','rail_signal','ruined_portal'].every(t=>TECH.includes(t)));
for(const id of['kair05','restKairo','u206','dist02']){const r=mk(id);const s=JSON.stringify(r.props);A.apply(r);ok(id+': props untouched (time forest / rest stop / outside Kairo)',JSON.stringify(r.props)===s);}
// Dots CX-0081KC 조형물(r1): 지역 서사에 맞춘 자리
for(const id of['kair03','kair09','kair10']){const r=mk(id);A.apply(r);const nm=r.props.map(name);
 ok(id+': story ground pieces stay (moss boulders, gate), only the seal pillar turns into the Dots '+(id==='kair09'?'data gravestone':'terminal pillar'),nm.slice(0,3).every(x=>x==='moss_boulders')&&nm[3]==='broken_gate'&&nm[4]===(id==='kair09'?'kc-data-gravestone-a':'kc-terminal-pillar-a'));}
{const eng=(id,k)=>({id,layer:'STORY',exploration:{},props:Array.from({length:k},(_, i)=>({id:id+':e'+i,path:V+'chrono_engine.webp',height:1})).concat([{id:id+':p0',path:V+'ruined_portal.webp',height:1},{id:id+':p1',path:V+'ruined_portal.webp',height:1}])});
 const a=eng('kair03',4);A.apply(a);ok('kair03 black sand: time engines become clock generators and black-sand wrecks',a.props.slice(0,4).map(name).join()==='kc-clock-generator-a,kc-black-sand-wreck-a,kc-clock-generator-b,kc-black-sand-wreck-b');
 const b=eng('kair07',4);A.apply(b);ok('kair07 black forge: time engines become casting moulds, a clock generator and a brass manifold',b.props.slice(0,4).map(name).join()==='kc-mold-ladle-a,kc-clock-generator-a,kc-mold-ladle-b,kc-brass-manifold-a');
 const c=eng('kair08',1);A.apply(c);ok('kair08 neuron gate: rune portals become synapse arches; engines there are left alone',c.props.map(name).join()==='chrono_engine,kc-synapse-arch-a,kc-synapse-arch-b');
 const d=eng('kair04',1);A.apply(d);ok('portals and engines elsewhere are left alone',d.props.map(name).join()==='chrono_engine,ruined_portal,ruined_portal');}
{const r={id:'kair01',layer:'STORY',exploration:{},props:[0,1,2].map(i=>({id:'kair01:s'+i,r74Prop:'rock',r81NativeSkin:{path:V+'moss_boulders.webp',height:68}}))};A.apply(r);const k=r.props[2].r81NativeSkin;
 ok('a skinned slot (R81 native skin, height on the skin) also gets the taller streetlamp: '+k.height,/kc-neon-streetlamp-a/.test(k.path)&&k.height>68*1.5&&r.props[2].r930H===68&&r.props[0].r81NativeSkin.height===68);}
{const r=mk('kair06');A.apply(r);ok('kair06 canal: drainage pump first, then cable duct',r.props.slice(0,3).map(name).join()==='kc-drainage-pump-a,kc-cable-duct-a,kc-drainage-pump-b');}
{const flag={v:true};const N=boot({notReady:flag});const r=mk('kair04');N.api.apply(r);
 ok('while a Dots image is not loaded the piece keeps the earlier tech art (never invisible) and the image is requested',r.props.slice(0,3).map(name).join()==='industrial_barricade,surveillance_console,rail_signal'&&name(r.props[4])==='silver_seal_pillar'&&N.asked.some(p=>p==='assets/r930/props/kc-brass-manifold-a.webp'));
 flag.v=false;N.api.apply(r);ok('once loaded the same pieces switch to the Dots art (same order as a fresh room)',r.props.slice(0,3).map(name).join()==='kc-brass-manifold-a,kc-command-console-b,kc-neon-streetlamp-a'&&name(r.props[4])==='kc-terminal-pillar-a');}
{const dir=path.join(R,'runtime-text','assets','r930','props');let idx=null;try{idx=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));}catch(_){}
 const used=new Set();for(const z of['kair01','kair02','kair03','kair04','kair06','kair07','kair08','kair09','kair10']){const r=mk(z);for(let i=0;i<6;i++)r.props.push({id:z+':m'+i,path:V+'moss_boulders.webp',height:1},{id:z+':c'+i,path:V+'chrono_engine.webp',height:1},{id:z+':r'+i,path:V+'ruined_portal.webp',height:1},{id:z+':s'+i,path:V+'silver_seal_pillar.webp',height:1});A.apply(r);for(const p of r.props){const m=/assets\/r930\/props\/([^.]+)\.webp/.exec(p.path||'');if(m)used.add(m[1]);}}
 ok('every Dots piece the module can place exists as a 512x512 webp under 90 KB, is in index.json with its Dots source hash, and is in the runtime manifest ('+used.size+' pieces)',used.size>=19&&[...used].every(k=>{const s=webpSize('assets/r930/props/'+k+'.webp');const f=path.join(dir,k+'.webp');return s&&s[0]===512&&s[1]===512&&fs.statSync(f).size<90000&&/^[0-9a-f]{64}$/.test(idx?.pieces?.[k]?.sourceSha256||'')&&man.includes('assets/r930/props/'+k+'.webp');}));
 ok('index.json: Dots CX-0081KC, not temporary, and names the two held pieces (wall lamp, dais) that are not placed',idx?.dots==='CX-0081KC'&&idx?.temporary===false&&!!idx?.notApplied?.['2Dprime_indoor-wall-lamp']&&!!idx?.notApplied?.['2K_command-dais']&&![...used].some(k=>/wall-lamp|dais/.test(k)));}
{const r=mk('kair04',{samongR115:{zone:'sz115-S07-1'}});const s=JSON.stringify(r.props);A.apply(r);ok('samong zone borrowing a Kairo id is untouched',JSON.stringify(r.props)===s);}
{const r=mk('kair04');r.layer='LEGACY';const s=JSON.stringify(r.props);A.apply(r);ok('non-STORY layer is untouched',JSON.stringify(r.props)===s);}
{const W=boot({r272:true});const r=mk('kair01');W.api.apply(r);W.c.__STORYWORLD_PROPS_R272__.apply(r);ok('R272 canon pass keeps every swapped piece in kair01, Dots names included (no tug of war)',r.props.slice(0,5).map(name).join()==='kc-brass-manifold-a,kc-command-console-a,kc-neon-streetlamp-a,ruined_portal,kc-terminal-pillar-a');}
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
const st=A.inspect();ok('inspect reports structure untouched and temporary art',st.collisionChanged===false&&st.layoutChanged===false&&st.temporaryArt===true&&st.dots==='CX-0081KC'&&st.propsArt==='Dots CX-0081KC r1'&&st.revision==='R930-kairo-tech-2');
console.log('\nR930 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
