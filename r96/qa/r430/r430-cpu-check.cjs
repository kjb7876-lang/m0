// R430 CPU check: 테마 맵 생동감(최상 그래픽 전용) — 드라이브 core24 시트를 손질한 루프/가끔 터지는 효과를 정본 제목이 그 사건을 말하는 지역에만.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='theme-fx-r430.js',src=C(F);ok(F+' runtime copy matches',fs.readFileSync(path.join(RT,F),'utf8')===src);
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('loads once right after skill-sheets-r411, before combat-r118',/<script src="\.\/skill-sheets-r411\.js"><\/script><script src="\.\/theme-fx-r430\.js"><\/script>/.test(html)&&html.split(F).length===2&&html.indexOf(F)<html.indexOf('combat-r118.js')&&html.indexOf('cinema-r114.js')<html.indexOf(F));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r430/r430-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
const H=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
ok('runtime-manifest hash matches',M.get(F)===H(F));
const idx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r430/index.json'),'utf8'));
let bad=[];for(const [n,m] of Object.entries(idx.fx)){const p='assets/r430/'+m.file;if(!fs.existsSync(path.join(RT,p))||H(p)!==m.outSha256||M.get(p)!==m.outSha256)bad.push(n);}
ok('9 sheets exist, hash = index = manifest',Object.keys(idx.fx).length===9&&!bad.length,bad.join(','));
ok('no forbidden CSS filters (drop-shadow/blur)',!/drop-shadow|blur\(/.test(src));
ok('presentation only: no hazards/hitEnemy/damage/solid/floorCells writes',!/hazards\.push|hitEnemy|damage|\.hp\s*[-+]?=|solid\s*:\s*true|floorCells\s*=|walls\s*=/.test(src));
ok('Mammon vault (ep1b06) and samong layer excluded',!/\bep1b06:/.test(src)&&/layer!=='STORY'/.test(src));
// 가짜 게임
const effects=[],draws=[];let t=0;
const ctx={save(){},restore(){},translate(){},scale(){},beginPath(){},ellipse(){},fill(){},drawImage(im,sx,sy){draws.push({im:im.src,sx,sy});},scope(meta,run){draws.push({meta});run();},globalAlpha:1,globalCompositeOperation:'',filter:'none',fillStyle:''};
const floor=[];for(let y=0;y<30;y++)for(let x=0;x<30;x++)floor.push([x,y]);
const mkRoom=id=>({id,props:[],enemies:[],exploration:{floorCells:floor,worldR74:{doors:[{x:15,y:0,width:2}]},entry:{x:2,y:2}}});
let cinema={horror:'high'};const docCls=new Set();
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Date,Promise,innerWidth:1280,innerHeight:720,W:1280,H:720,
 document:{documentElement:{classList:{contains:c=>docCls.has(c)}}},effects,ctx,TILE:34,zoom:.667,settings:{lowFx:false},layer:'STORY',room:mkRoom('ep1b07'),player:{x:20,y:20},
 project:(x,y)=>({x:(x-y)*22+640,y:(x+y)*11}),readyImage:p=>({image:{src:p}}),ensureImages(){},drawEffect(){},tick(){}};
Object.defineProperty(sb,'time',{get:()=>t});
sb.window.__STORYWORLD_CINEMA_R114__={prefs:()=>({...cinema})};
vm.runInNewContext(src,sb);const A=sb.window.__STORYWORLD_THEME_FX_R430__;ok('api',A&&A.revision.startsWith('R430'));
// 지역 목록: 정본 제목이 사건을 말하는 곳만
const want={ep1b07:'fire',ep1a10:'mist',dist02:'swampMist',dist06:'fissure',ep1b06b:'frost',ep1a08:'blight',ep1b09:'arc',kair05:'rift',cult04:'brand'};
ok('zones map to their theme kinds',Object.entries(want).every(([z,k])=>A.ZONES[z]&&A.ZONES[z].some(s=>s[0]===k)));
ok('every kind uses an existing sheet',Object.values(A.KIND).every(k=>A.SHEET[k.sheet]&&idx.fx[k.sheet]));
ok('sheet frame counts match index',Object.entries(A.SHEET).every(([n,s])=>idx.fx[n].frames===s[0]&&idx.fx[n].cols===s[1]));
// 계획: 결정적·문/입구 피함·간격
const P1=A.plan(mkRoom('ep1b07')),P2=A.plan(mkRoom('ep1b07'));ok('plan deterministic',JSON.stringify(P1)===JSON.stringify(P2)&&P1.length>=12,P1.length);
ok('plan avoids door and entry',P1.every(s=>Math.hypot(s.x-15,s.y-0)>=3.5&&Math.hypot(s.x-2,s.y-2)>=3));
ok('fire spots spaced >= 3.2 tiles',P1.every((a,i)=>P1.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>=3.19)));
ok('half count on mobile',A.plan(mkRoom('ep1b07'),true).length===8);
ok('non-theme zone has no spots',A.plan(mkRoom('dist00')).length===0&&A.plan(mkRoom('ep1b06')).length===0);
// 최상 그래픽에서만
const run=()=>{sb.tick();for(const e of effects.slice())sb.drawEffect(e);};
ok('top quality = high preset',A.topQuality()===true);
run();const n1=draws.length;ok('draws in theme zone at top quality',n1>0&&effects.some(e=>e.type==='r430-theme-fx'),n1);
draws.length=0;sb.settings.lowFx=true;run();ok('lowFx → nothing drawn, sentinel removed',draws.length===0&&!effects.some(e=>e.type==='r430-theme-fx'));
sb.settings.lowFx=false;cinema={horror:'mid'};run();ok('mid preset → nothing',draws.length===0&&!A.topQuality());
cinema={horror:'high'};docCls.add('swLiteR150');run();ok('R150 lite → nothing',draws.length===0);docCls.clear();
sb.layer='DREAM';run();ok('DREAM layer → nothing',draws.length===0);sb.layer='STORY';
// 가끔 터지는 효과: 영웅 가까우면 미룸
sb.room=mkRoom('dist06');t=0;run();const sp=A.inspect().spots;ok('fissure spots planned',sp.length===4);
sb.player.x=sp[0].x+1;sb.player.y=sp[0].y;A.preview();draws.length=0;t=.01;run();
const near=draws.filter(d=>d.meta&&d.meta.id==='r430:fissure:'+sp[0].x+':'+sp[0].y).length;ok('burst postponed while hero within 3.5 tiles',near===0);
sb.player.x=0;sb.player.y=0;A.preview();t=.02;run();draws.length=0;t=.5;run();ok('burst plays when hero is far',draws.some(d=>d.meta&&String(d.meta.id).startsWith('r430:fissure')));
t=5;draws.length=0;run();ok('burst rests after 24 frames',!draws.some(d=>d.meta&&String(d.meta.id).startsWith('r430:fissure:'+sp[0].x)));
ok('meta is presentation-only effect scope',draws.filter(d=>d.meta).every(d=>d.meta.kind==='effect'&&d.meta.presentationOnly));
ok('off switch',(A.set({on:false}),run(),!effects.some(e=>e.type==='r430-theme-fx')));
ok('no runtime errors',A.inspect().stats.errors===0,A.inspect().lastError);
const failed=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'ok  ':'FAIL')+' '+c.name+(c.pass||c.detail===undefined?'':' '+c.detail));
console.log('R430 CPU '+(checks.length-failed.length)+'/'+checks.length);if(failed.length)process.exit(1);
