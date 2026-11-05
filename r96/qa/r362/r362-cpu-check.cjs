// R362: m030 Dots 손그림 후보 적용 + 게임 안 이름 '불길 속의 곰' → '개와 늑대의 시간'(사용자 2026-11-06 "쓰고 이름을바꿔 개와늑대의시간으로").
// 실제 overlay 파일(mob-unique-r248-data → mob-rename-r362 → mob-unique-r248 → mob-art-r290, R306 데이터+코드)을 vm 에 실행 순서대로 올려 본다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const rd=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return '';}};
const C=f=>rd(path.join(R,'client-source',f)),RT=f=>rd(path.join(R,'runtime-text',f));
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const OLD='불길 속의 곰',NEW='개와 늑대의 시간',ID='m030',NID='b07-f2';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const A=path.join(R,'runtime-text','assets','r290','mobs');let idx={mobs:{}};try{idx=JSON.parse(rd(path.join(A,'index.json')));}catch(_){}
const old=JSON.parse(rd(path.join(R,'runtime-text','assets','r248','mobs','index.json')));
const ren=C('mob-rename-r362.js'),dsrc=C('mob-unique-r248-data.js'),r248=C('mob-unique-r248.js'),r290=C('mob-art-r290.js');
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return{w:(v&0x3fff)+1,h:((v>>14)&0x3fff)+1,lossless:true};}if(t==='VP8X')return{w:b.readUIntLE(24,3)+1,h:b.readUIntLE(27,3)+1,lossless:b.includes(Buffer.from('VP8L'))};return{w:0,h:0,lossless:false};}
// ---- 1. 그림(시트·표) ----
const m=idx.mobs[ID]||{};
ok('index.json m030: R362 row, name = 개와 늑대의 시간 (nameBefore = 불길 속의 곰), conditional, Dots mean > 7.77, 12 frames with source hashes',m.revision==='R362'&&m.name===NEW&&m.nameBefore===OLD&&m.temporary===false&&m.conditional===true&&m.dots?.mean>7.77&&m.dots.actualPlayback===false&&m.frames?.length===12&&m.frames.every(f=>/^[0-9a-f]{64}$/.test(f.sha256||'')&&f.body>60)&&m.source?.sheetMatchesPreassembled===true,{name:m.name,rev:m.revision});
ok('ID link: candidate reference-r248.webp sha256 == R248 m030 temp sheet sha256 (not a name guess)',m.source?.referenceR248Sha256===old.mobs[ID].sha256&&m.replaces?.sha256===old.mobs[ID].sha256);
ok('public repo: Drive bundle *name* + sha256/bytes only, no Drive file id',(()=>{const d=m.drive;if(!d||('id' in d))return false;const j=JSON.stringify({...m,drive:{...d,bundle:''}}).replace(/[0-9a-f]{64}/g,'');return /^SW-m030-.+\.zip$/.test(d.bundle)&&/^[0-9a-f]{64}$/.test(d.sha256)&&d.bytes>100000&&!/drive\.google|\b(?=[\w-]*\d)(?=[\w-]*[a-z])(?=[\w-]*[A-Z])[\w-]{25,}\b/.test(j);})());
ok('sheet assets/r290/mobs/m030.webp: exists, sha256/bytes = index, lossless WebP 1024×960 (4×3 of 256×320); feet on the pivot band (walk foot 290..307)',(()=>{const p=path.join(A,'m030.webp');if(!fs.existsSync(p))return false;const b=fs.readFileSync(p),s=webpSize(b);return sha(b)===m.sha256&&b.length===m.bytes&&s&&s.w===1024&&s.h===960&&s.lossless&&m.frames.slice(0,8).every(f=>f.foot>=290&&f.foot<=307)&&m.frames.every(f=>f.bbox[3]<=319);})());
ok('R248 temp sheet kept (not overwritten)',sha(fs.readFileSync(path.join(R,'runtime-text','assets','r248','mobs','m030.webp')))===old.mobs[ID].sha256);
ok('R290 ART row m030 = {file m030.webp, body = index body, name 개와 늑대의 시간}',new RegExp("m030:Object\\.freeze\\(\\{file:'m030\\.webp',body:"+m.body+",name:'"+NEW+"'\\}\\)").test(r290));
// ---- 2. 실행(이름·그림) ----
const KS={quad:.8};
function mk(store={},extra={}){const drawn=[],scales=[];const ctx={save(){},restore(){},translate(){},scale(x,y){scales.push([x,y]);},drawImage(im,...a){drawn.push({src:im.src,a});},scope(meta,f){f();},filter:'',globalAlpha:1};
 const ls={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,localStorage:ls,window:{__STORYWORLD_FX_SPRITES_R106__:{on:()=>true,draw(){},along(){}}},
  time:10,layer:'STORY',ctx,project:(x,y)=>({x:(x-y)*10,y:(x+y)*5}),actorHeight:()=>60,effects:[],player:{x:10,y:10,hp:100},room:{enemies:[]},
  readyImage:p=>({image:{src:p}}),ensureImages:()=>Promise.resolve(),tick(){},drawEffect(){},drawEnemy(){return 'base';},
  actor3(d,id){return {id,nativeId:d.id,name:d.name,profile:d,hp:10,x:12,y:10};},...extra};
 vm.createContext(sb);vm.runInContext(dsrc,sb);vm.runInContext(ren,sb);vm.runInContext(r248,sb);vm.runInContext(r290,sb);return {sb,drawn,scales};}
const D0=(()=>{const s={window:{}};vm.createContext(s);vm.runInContext(dsrc,s);return s.window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;})();
{const {sb}=mk();const D=sb.window.__STORYWORLD_MOB_UNIQUE_R248_DATA__,M=sb.window.__STORYWORLD_MOB_ART_R290__,X=sb.window.__STORYWORLD_MOB_RENAME_R362__;
 ok('R248 table after load: sheets.m030.name = 개와 늑대의 시간; byName has the new name (and keeps the old one for old saves); storyNames has the new name',!!X&&D.sheets.m030.name===NEW&&D.byName[NEW]===ID&&D.byName[OLD]===ID&&D.storyNames.includes(NEW));
 ok('other mobs untouched: every other R248 sheet name and byName entry is the same as the generated data; only new-name aliases added',Object.keys(D0.sheets).every(k=>k===ID||D.sheets[k].name===D0.sheets[k].name)&&Object.entries(D0.byName).every(([k,v])=>D.byName[k]===v)&&Object.keys(D.byName).filter(k=>!(k in D0.byName)).every(k=>k.includes(NEW)&&D.byName[k]===ID));
 ok('R290 applies m030 (name match after rename) with the new sheet and body',M&&M.inspect().applied.includes(ID)&&D.sheets.m030.path==='assets/r290/mobs/m030.webp'&&D.sheets.m030.body===m.body,M&&M.inspect());
 const U=sb.window.__STORYWORLD_MOB_UNIQUE_R248__;
 ok('R248 sheetFor: new name, new name + 추격대, and an old-save enemy still named 불길 속의 곰 all pick assets/r290/mobs/m030.webp',[NEW,NEW+' 추격대',OLD].every((n,i)=>U.sheetFor({id:'s'+i,name:n})?.path==='assets/r290/mobs/m030.webp'));
 // 엔진 actor3(몹 만들기) 감싸기: 만들자마자 새 이름
 const e1=sb.actor3({id:NID,name:OLD},'a1'),e2=sb.actor3({id:NID,name:OLD+' 추격대'},'a2'),e3=sb.actor3({id:'b07-f1',name:'불길 속의 늑대'},'a3'),e4=sb.actor3({id:'b07-s1',name:'불길 속의 용'},'a4');
 ok('spawn (actor3): 불길 속의 곰 → 개와 늑대의 시간, 불길 속의 곰 추격대 → 개와 늑대의 시간 추격대 (profile name too); 불길 속의 늑대·불길 속의 용 unchanged',e1.name===NEW&&e2.name===NEW+' 추격대'&&e1.profile.name===NEW&&e3.name==='불길 속의 늑대'&&e4.name==='불길 속의 용',[e1.name,e2.name,e3.name,e4.name]);
 // 저장에서 되살린 몹·지역 로스터(부팅 뒤)
 sb.room.enemies=[{id:'s1',nativeId:NID,name:OLD,hp:5},{id:'s2',nativeId:NID,name:'중간보스 · '+OLD,hp:5},{id:'s3',nativeId:'x',name:'진흙등 거미',hp:5}];
 sb.booted=true;sb.regions=[{id:'ep1b07',roster:[{id:NID,name:OLD},{id:'b07-f1',name:'불길 속의 늑대'}]}];sb.world={};sb.actorById=new Map([[NID,{id:NID,name:OLD}]]);X?.sweep?.();
 const names=sb.room.enemies.map(e=>e.name).concat(sb.regions[0].roster.map(r=>r.name),[...sb.actorById.values()].map(r=>r.name));
 ok('old-save enemies in the room, region roster and actorById are renamed; old name no longer present anywhere; others unchanged',JSON.stringify(names)===JSON.stringify([NEW,'중간보스 · '+NEW,'진흙등 거미',NEW,'불길 속의 늑대',NEW])&&!names.some(n=>n.includes(OLD)),names);
 // 그리기: 새 이름 몹은 새 시트, R248 크기 규칙
 const {sb:s2,drawn,scales}=mk();const e=s2.actor3({id:NID,name:OLD+' 추격대'},'d1');Object.assign(e,{x:12,y:10,hp:10});s2.drawEnemy(e);const d=drawn.find(x=>/assets\/r2\d\d\/mobs\//.test(x.src)),k=scales.at(-1)?.[1];
 ok('draw: spawned m030 (shown as 개와 늑대의 시간 추격대) uses assets/r290/mobs/m030.webp, cell 256×320 pivot 128,300, on-screen body = R248 size rule',e.name===NEW+' 추격대'&&d&&d.src==='assets/r290/mobs/m030.webp'&&d.a[2]===256&&d.a[3]===320&&d.a[4]===-128&&d.a[5]===-300&&Math.abs(k*m.body-60*KS.quad)<0.01,{d,k});
 e.attack={elapsed:.3,angle:0,shape154:{windup:.45,active:.15,recovery:.35}};s2.time=12;drawn.length=0;s2.drawEnemy(e);const a=drawn.find(x=>/r290/.test(x.src))?.a;
 ok('draw: attack plays the attack row (cells 8..11)',a&&a[1]===640,a);}
{const {sb}=mk({'storyworld.r362.rename':'{"on":false}'});const D=sb.window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;const e=sb.actor3({id:NID,name:OLD},'z');
 ok('toggle off (storyworld.r362.rename {"on":false}) → original name and data stay',e.name===OLD&&D.sheets.m030.name===OLD&&!(NEW in D.byName));}
// ---- 3. R306 픽셀 모드 ----
const r306d=C('mob-art-variants-r306-data.js'),r306=C('mob-art-variants-r306.js');
globalThis.__r362=(async()=>{const handlers=[];
 const c={console,layer:'STORY',time:1,player:{id:'hero'},room:{enemies:[]},localStorage:{getItem:()=>null,setItem(){}},
  document:{readyState:'loading',getElementById:()=>null,createElement:()=>({}),addEventListener(ev,f){if(ev==='DOMContentLoaded')handlers.push(f);}},
  ctx:{imageSmoothingEnabled:true,calls:[],drawImage(im,...a){this.calls.push(im.src);}},readyImage:p=>({image:{src:p,naturalWidth:1024,naturalHeight:960}}),ensureImages:()=>Promise.resolve(),
  serializeSave:()=>({}),restoreSave:async()=>{},drawEnemy(e){c.ctx.drawImage({src:e.sheetR248},256,0,256,320,-64,-150,64,80);}};
 c.window=c;vm.createContext(c);vm.runInContext(dsrc,c);vm.runInContext(ren,c);vm.runInContext(r306d,c);vm.runInContext(r306,c);for(const f of handlers)f();
 const D6=c.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__,D60=(()=>{const s={window:{}};s.window=s;vm.createContext(s);vm.runInContext(r306d,s);return s.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__;})();
 const keys=['STORY','DREAM'].map(l=>l+'|'+NID+'|'+NEW);
 ok('R306 actor keys: STORY|b07-f2|개와 늑대의 시간 and DREAM|… point to the same rows as the old-name keys (old keys kept); no other key changed',keys.every((k,i)=>D6.actors[k]&&D6.actors[k]===D60.actors[k.replace(NEW,OLD)])&&Object.entries(D60.actors).every(([k,v])=>D6.actors[k]===v)&&Object.keys(D6.actors).length===Object.keys(D60.actors).length+2);
 ok('R306 data: the m030 rows list assets/r290/mobs/m030.webp with 12 frames (256×320, pivot 128,300, visibleHeight = R290 body)',keys.every(k=>{const row=D6.rows[D6.actors[k]],p='assets/r290/mobs/m030.webp',fr=row.frames.filter(f=>f.path===p);return row.pixel.path==='assets/r248/mobs/m030.webp'&&row.paths.includes(p)&&fr.length===12&&fr.every(f=>f.visibleHeight===m.body&&f.pivot[0]===128&&f.pivot[1]===300);}));
 await c.restoreSave({mobArt:'pixel'});const bad=[];let tried=0;
 for(const k of keys.concat(keys.map(k=>k.replace(NEW,OLD)))){const [lay,nativeId,name]=k.split('|');c.layer=lay;c.ctx.calls.length=0;const before=c.__STORYWORLD_MOB_ART_VARIANTS_R306__.inspect().stats.unmatched;tried++;
  c.drawEnemy({nativeId,name:name+' 추격대',path:'assets/donor/original.webp',sheetR248:'assets/r290/mobs/m030.webp',hp:10,x:0,y:0});const st=c.__STORYWORLD_MOB_ART_VARIANTS_R306__.inspect().stats;
  if(c.ctx.calls.join()!=='assets/r248/mobs/m030.webp'||st.unmatched!==before)bad.push({k,calls:[...c.ctx.calls]});}
 ok(`pixel-mode run (R306): m030 drawing its new R290 sheet is replaced by the R248 pixel sheet under the new name (and an old-save name) in STORY and DREAM (${tried} draws)`,tried===4&&bad.length===0&&c.__STORYWORLD_MOB_ART_VARIANTS_R306__.inspect().mode==='pixel',bad);})();
// ---- 4. 연결(빌드 다섯 곳) ----
{const html=RT('index.html');const man=JSON.parse(rd(path.join(R,'runtime-manifest.json'))||'{"files":[]}'),inp=JSON.parse(rd(path.join(R,'runtime-inputs.json'))||'{"textPaths":[]}');
 const pos=f=>html.indexOf('<script src="./'+f+'"></script>');
 ok('index.html order: mob-unique-r248-data → mob-rename-r362 (adjacent) → mob-unique-r248 → … mob-art-r290 → mob-art-variants-r306-data',html.includes('<script src="./mob-unique-r248-data.js"></script><script src="./mob-rename-r362.js"></script><script src="./mob-unique-r248.js"></script>')&&pos('mob-rename-r362.js')<pos('mob-art-r290.js')&&pos('mob-art-r290.js')<pos('mob-art-variants-r306-data.js'));
 ok('runtime copies match client-source; manifest/inputs list the overlay, the new sheet and index.json with matching hashes',['mob-rename-r362.js','mob-art-r290.js','mob-art-variants-r306-data.js'].every(f=>RT(f)&&RT(f)===C(f))&&['mob-rename-r362.js','assets/r290/mobs/m030.webp','assets/r290/mobs/index.json','mob-art-variants-r306-data.js'].every(p=>{const row=man.files.find(r=>r.path===p);return inp.textPaths.includes(p)&&row&&row.sha256===sha(fs.readFileSync(path.join(R,'runtime-text',p)));}));
 ok('in CI and the public verify list',rd(path.join(R,'..','.github','workflows','pages.yml')).includes('r96/qa/r362/r362-cpu-check.cjs')&&rd(path.join(R,'..','scripts','verify-r96-public.py')).includes("'mob-rename-r362.js'"));
 ok('no R290 ART row keeps the old name; overlay maps exactly 불길 속의 곰 → 개와 늑대의 시간 (no new lore text added)',!r290.includes("name:'불길 속의 곰'")&&ren.includes("OLD='불길 속의 곰'")&&ren.includes("NEW='개와 늑대의 시간'"));}
globalThis.__r362.catch(e=>ok('async run',false,String(e))).then(()=>{
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,400)));
console.log(`R362 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);});
