// R1017 CPU check — patch.gg(Poly Haven CC0) 디아블로풍 조형물: 최종 촛대 1점(R523 cult03 앞방·입구).
//  사용자가 고른 6점 중 돌 화덕(상시 규칙 '실내 화로 금지')·보물상자(시대 맞는 보관실 없음)는 첫 판에서 뺐고,
//  철문·너울 쓴 왕 석상·녹슨 쇠침대는 사용자 2026-11-14 02:03Z 지시("각도·테마·시대 안 맞으면 억지로 넣지 말고 제외")로 재심사해 뺐다
//  (기대값을 바꾼 세 번째 판 — 사용자 지시에 따른 동작 변경, 보고서에 적음). 그리기 전용(충돌·저장·문·서사 불변), 결정적.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const html=RT('index.html'),verify=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');
ok('CI runs this check',/node r96\/qa\/r1017\/r1017-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
// ---- 뺀 것: 덧씌우기 스크립트·철문·석상·녹슨 침대·화덕·보물상자 ----------------------------------------
const GONE=['gate','veiled-king','bed','chest','firepit'];
ok('R449 overlay removed (no props-diablo-r1017.js in client, runtime, index or public list)',!fs.existsSync(path.join(R,'client-source','props-diablo-r1017.js'))&&!fs.existsSync(path.join(R,'runtime-text','props-diablo-r1017.js'))&&!html.includes('props-diablo-r1017')&&!verify.includes('props-diablo-r1017'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));const rows=new Map(man.files.map(r=>[r.path,r]));
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
ok('removed art not shipped (files, manifest, inputs)',GONE.every(a=>{const p='assets/r1017/x1017-'+a+'.webp';return !fs.existsSync(path.join(R,'runtime-text',p))&&!rows.has(p)&&!inputs.textPaths.includes(p);}));
// ---- 남긴 것: 촛대 -------------------------------------------------------------------------------
{const p='assets/r1017/x1017-candles.webp',fp=path.join(R,'runtime-text',p);let b=null;try{b=fs.readFileSync(fp);}catch(_){}
 ok('candles art: file present, ≤64KB, webp',!!b&&b.length<=65536&&b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP');
 ok('candles art: in runtime manifest with matching sha256 and in runtime inputs',!!b&&rows.get(p)?.sha256===crypto.createHash('sha256').update(b).digest('hex')&&inputs.textPaths.includes(p));
 ok('candles art: listed for the public check',/'assets\/r1017\/'/.test(verify));}
let credits='';try{credits=fs.readFileSync(path.join(ROOT,'CREDITS.md'),'utf8');}catch(_){}
ok('CREDITS.md names Brass Candleholders with Poly Haven, CC0, patch.gg',credits.includes('Brass Candleholders')&&/Poly Haven/.test(credits)&&/CC0/.test(credits)&&/patch\.gg/.test(credits));
{const m=/const OUTDOOR=(\/.*\/);/.exec(C('props-fit-r303.js'));const OUT=m?eval(m[1]):null;
 ok('candles path is not read as an outdoor thing by R303',!!OUT&&!OUT.test('assets/r1017/x1017-candles.webp'));}
// ---- R523 방 묶음: 촛대 (실제 지도 고정본 + 실제 엔진 벽 판정) -----------------------------------
{const S523=C('rooms-r523.js');let rt523='';try{rt523=RT('rooms-r523.js');}catch(_){}
 ok('R523 runtime copy matches client source',S523.length>0&&rt523===S523);
 ok('R523 art table: candles points at the R1017 render, removed pieces gone (table written by qa/r523/tools/apply-art.py from art8.json)',/ candles:\{path:'assets\/r1017\/x1017-candles\.webp',[^\n]*ang:'pole'/.test(S523)&&!/veiledking|rustbed|x1017-(gate|veiled|bed)/.test(S523)&&fs.existsSync(path.join(R,'qa','r523','tools','art8.json')));
 const rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
 let E=null;try{const c={window:{},console,performance:{now:()=>0}};vm.createContext(c);vm.runInContext(rd('runtime-text/dist/phase1.js'),c);E=c.window.StoryPhase1.explorationBlocked;}catch(e){}
 ok('engine explorationBlocked loaded',typeof E==='function');
 const lay=fx=>{const cells=[];for(const[y,sp]of Object.entries(fx.floorSpans))for(let i=0;i<sp.length;i+=2)for(let x=sp[i];x<sp[i+1];x++)cells.push([x,+y]);
  return{bounds:[0,0,100,104],floorCells:cells,walls:fx.walls.map(w=>({...w})),r224Rooms:fx.r224Rooms.map(q=>({...q})),worldR74:{rooms:fx.rooms.map(q=>({...q})),doors:fx.doors.map(d=>({...d}))},worldWardR81:fx.worldWardR81?{...fx.worldWardR81}:{},entry:fx.entry,starts:fx.starts};};
 const W5=fx=>({id:fx.id,layer:'STORY',exploration:lay(fx),props:fx.props.map(p=>({...p,solid:false,visible:true})),enemies:[],objective:fx.objective||null});
 const boot5=stored=>{const ctx={localStorage:{getItem:()=>stored||null,setItem:()=>{}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,StoryPhase1:{explorationBlocked:E},
   regionById:{ep1a09:{paths:[]}},readyImage:()=>null,ensureImages:()=>Promise.resolve(),project:(x,y)=>({x:640+(x-y)*27,y:340+(x+y)*13.5}),W:1280,H:676,zoom:1,room:undefined,draw:function(){},drawProp:function(){}};
  ctx.window=ctx;vm.createContext(ctx);vm.runInContext(S523,ctx);return ctx.__STORYWORLD_ROOMS_R523__;};
 const FX={};for(const id of['ep1a09','cult03']){try{FX[id]=JSON.parse(rd('qa/r523/fixtures/'+id+'.json'));}catch(_){}}
 let A=null;try{A=boot5();}catch(e){console.log(String(e.stack).slice(0,300));}
 ok('R523 boots with the real fixtures',!!A&&!!FX.ep1a09&&!!FX.cult03);
 if(A&&E&&FX.ep1a09&&FX.cult03){const NEW=/^(veiledking|candles|rustbed)$/;
  const look=id=>{const w=W5(FX[id]),L=w.exploration,rows=A.list(w),nm=new Map(L.worldR74.rooms.map(q=>[q.id,q.name])),hit=(x,y)=>!!E(L,x,y,.02);return{w,L,rows,nm,hit,mine:rows.filter(p=>NEW.test(p.r523.art))};};
  const cu=look('cult03'),cl=look('ep1a09');
  ok('cult03 entrance rooms (앞방·입구) light a candelabra',cu.mine.some(p=>p.r523.art==='candles'&&cu.nm.get(p.r523.room)==='앞방')&&cu.mine.some(p=>p.r523.art==='candles'&&cu.nm.get(p.r523.room)==='입구'));
  ok('candles nowhere else in cult03 (core antechamber back to its original reliquary + lantern), one per room',cu.mine.every(p=>p.r523.use==='narthex')&&new Set(cu.mine.map(p=>p.r523.room)).size===cu.mine.length&&!cu.rows.some(p=>p.r523.use==='corehall'&&p.r523.art==='candles'));
  ok('ep1a09 observation rooms back to plain hospital furniture (no R1017 piece)',cl.mine.length===0&&cl.rows.some(p=>p.r523.use==='observe'&&p.r523.art==='bed'));
  const all5=[...cu.mine.map(p=>[p,cu]),...cl.mine.map(p=>[p,cl])];
  ok('new pieces: feet on floor, not sunk into a wall (≤1%), not hidden behind a front wall (≤20%)',all5.length>=2&&all5.every(([p,X])=>{const S=A.samplesOf(p.r523.art,!!p.r303Flip);return !X.hit(p.x,p.y)&&A.embedOf(S,p.x,p.y,X.hit)<=.01&&A.hiddenOf(S,p.x,p.y,X.hit)<=.2;}));
  ok('candles never mirrored (symmetric pole art)',all5.every(([p])=>!p.r303Flip));
  ok('presentation only: not solid, no targeting, rides the R521 draw path',all5.every(([p])=>p.solid===false&&p.presentationOnly===true&&p.autoTargetEligible6===false&&p.r521Ward===true));
  ok('deterministic: same plan twice',(()=>{const A2=boot5(),s=a=>a.list(W5(FX.cult03)).map(p=>p.id+p.r523.art+p.x.toFixed(3)+p.y.toFixed(3)).join();return s(A)===s(A2);})());
  ok('R523 switch off: no new pieces drawn by it',(()=>{const A3=boot5('{"on":false}');try{return !A3.enabled(W5(FX.cult03));}catch(_){return false;}})());}}
console.log(`\nR1017 cpu check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
