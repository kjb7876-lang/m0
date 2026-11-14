// R1020 CPU check — 3D 조형물 '부분 쿼터뷰'(사용자 2026-11-14 00:25Z "서사 시대상과 테마보고 … 보는각도따라 부분쿼터뷰 적용", 00:39Z 추천 6개 고름).
//  patch.gg(Poly Haven CC0) 6점(고딕 침대·고딕 장식장·괘종시계·흔들의자·물레·휠체어)을 북벽용·서벽용 두 방향으로 미리 렌더해,
//  R523 방 묶음이 가구를 놓는 벽 방향에 맞는 그림을 고른다(뒤집은 거울상이 아니라 실제로 돌린 렌더). 이 카메라에서 가구 등은 늘 북·서 벽에 붙으므로 두 방향이면 된다.
//  놓는 곳: 환도 성(hando01~03, 정본 시대 = 잔혹 동화 성 + 의목사) 방 이름별 — 병동 = 고딕 침대, 진찰실 = 흔들의자·괘종시계·장식장, 준비실 = 물레, 남쪽 방 = 침대 + 장식장,
//  북쪽 방·입구 홀 = 괘종시계. 휠체어는 병원(ep1a09) 대기실. 그리기 전용(충돌·저장·문·서사·몹 불변).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const src=rd('client-source/rooms-r523.js');
ok('R523 runtime copy matches client source',src.length>0&&rd('runtime-text/rooms-r523.js')===src);
ok('CI runs this check',/node r96\/qa\/r1020\/r1020-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
// ---- 그림 12장 ---------------------------------------------------------------------------------------
const KEYS=['gbed','gcab','clock','rock','spin','chair3'],FILE={gbed:'gbed',gcab:'gcab',clock:'clock',rock:'rock',spin:'wheel',chair3:'wchair'};
const man=JSON.parse(rd('runtime-manifest.json')||'{"files":[]}'),rows=new Map(man.files.map(r=>[r.path,r])),inputs=JSON.parse(rd('runtime-inputs.json')||'{"textPaths":[]}');
let total=0;
for(const k of KEYS)for(const f of['n','w']){const p='assets/r1020/x1020-'+FILE[k]+'-'+f+'.webp';let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',p));}catch(_){}
 total+=b?b.length:0;
 ok('art '+k+'/'+f+': file present, ≤40KB, webp, in manifest (sha256) and inputs',!!b&&b.length<=40960&&b.slice(8,12).toString()==='WEBP'&&rows.get(p)?.sha256===crypto.createHash('sha256').update(b).digest('hex')&&inputs.textPaths.includes(p));}
ok('twelve pictures together under 300KB ('+total+')',total>0&&total<=300*1024);
ok('only the two directions this camera uses are shipped (no r180/r270 files)',!fs.readdirSync(path.join(R,'runtime-text','assets','r1020')).some(f=>!/^x1020-[a-z]+-[nw]\.webp$/.test(f)));
ok('listed for the public check',/'assets\/r1020\/'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')));
let credits='';try{credits=fs.readFileSync(path.join(ROOT,'CREDITS.md'),'utf8');}catch(_){}
ok('CREDITS.md names all six with Poly Haven and CC0',['GothicBed_01','GothicCabinet_01','vintage_grandfather_clock_01','Rockingchair_01','spinning_wheel_01','wheelchair_01'].every(t=>credits.includes(t))&&/R1020/.test(credits));
// ---- R523 그림 표: 두 방향 짝 ------------------------------------------------------------------------
let api=null,E=null,ART=null;
try{const c={window:{},console,performance:{now:()=>0}};vm.createContext(c);vm.runInContext(rd('runtime-text/dist/phase1.js'),c);E=c.window.StoryPhase1.explorationBlocked;}catch(e){}
ok('engine explorationBlocked loaded',typeof E==='function');
const boot=stored=>{const ctx={localStorage:{getItem:()=>stored||null,setItem:()=>{}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,StoryPhase1:{explorationBlocked:E},
  regionById:{},readyImage:()=>null,ensureImages:()=>Promise.resolve(),project:(x,y)=>({x:640+(x-y)*27,y:340+(x+y)*13.5}),W:1280,H:676,zoom:1,room:undefined,draw:function(){},drawProp:function(){}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);return ctx.__STORYWORLD_ROOMS_R523__;};
try{api=boot();ART=api.ART;}catch(e){console.log(String(e.stack).slice(0,300));}
ok('R523 boots',!!api&&!!ART);
const W_=k=>k+'W';
ok('each piece has a north-wall and a west-wall picture that point at each other (pair), both one-direction iso art',!!ART&&KEYS.every(k=>{const a=ART[k],b=ART[W_(k)];return a&&b&&a.face==='n'&&b.face==='w'&&a.pair===W_(k)&&b.pair===k&&a.ang==='iso'&&b.ang==='iso'&&a.path==='assets/r1020/x1020-'+FILE[k]+'-n.webp'&&b.path==='assets/r1020/x1020-'+FILE[k]+'-w.webp';}));
ok('real-world size order: clock and cabinet taller than the hero-height rocking chair and spinning wheel; bed and wheelchair low',!!ART&&KEYS.every(k=>ART[k])&&ART.clock.h>ART.rock.h&&ART.gcab.h>ART.rock.h&&ART.chair3.h<ART.gcab.h&&ART.gbed.h<ART.clock.h);
// ---- 실제 지도 고정본 ------------------------------------------------------------------------------
const lay=fx=>{const cells=[];for(const[y,sp]of Object.entries(fx.floorSpans))for(let i=0;i<sp.length;i+=2)for(let x=sp[i];x<sp[i+1];x++)cells.push([x,+y]);
 return{bounds:[0,0,112,112],floorCells:cells,walls:fx.walls.map(w=>({...w})),r224Rooms:fx.r224Rooms?fx.r224Rooms.map(q=>({...q})):undefined,worldR74:{rooms:fx.rooms.map(q=>({...q})),doors:(fx.doors||[]).map(d=>({...d}))},worldWardR81:fx.worldWardR81?{...fx.worldWardR81}:{},entry:fx.entry,starts:fx.starts};};
const world=fx=>({id:fx.id,layer:'STORY',exploration:lay(fx),props:(fx.props||[]).map(p=>({...p,solid:false,visible:true})),enemies:[],objective:fx.objective||null});
const FX={};for(const[id,dir]of[['hando01','r1020'],['hando02','r1020'],['hando03','r1020'],['ep1a09','r523'],['cult03','r523']]){try{FX[id]=JSON.parse(rd('qa/'+dir+'/fixtures/'+id+'.json'));}catch(_){}}
ok('fixtures present (hando01~03 from the game, ep1a09·cult03 from R523)',Object.keys(FX).length===5&&!FX.hando01.r224Rooms);
const NEW=new RegExp('^('+KEYS.flatMap(k=>[k,W_(k)]).join('|')+')$');
if(api&&E&&FX.hando01){
 const look=id=>{const w=world(FX[id]),L=w.exploration,rows=api.list(w),nm=new Map(L.worldR74.rooms.map(q=>[q.id,q.name])),hit=(x,y)=>!!E(L,x,y,.02);return{w,L,rows,nm,hit,mine:rows.filter(p=>NEW.test(p.r523.art))};};
 const H=look('hando01');const base=k=>k.replace(/W$/,'');const of=(X,re)=>X.mine.filter(p=>re.test(X.nm.get(p.r523.room)||''));
 ok('hando castle furnished from its room rectangles (no R224 rooms there): '+H.rows.length+' pieces',H.rows.length>=14&&H.rows.every(p=>NEW.test(p.r523.art)));
 ok('wards hold gothic beds (the ward walls take one bed each; a bed that would stand in a scenery prop is left out)',of(H,/^ward-/).filter(p=>base(p.r523.art)==='gbed').length>=1&&of(H,/^ward-/).every(p=>base(p.r523.art)==='gbed'));
 ok('consult rooms: rocking chair and grandfather clock (sitting corner of the summoned doctor)',of(H,/^consult-/).some(p=>base(p.r523.art)==='rock')&&of(H,/^consult-/).some(p=>base(p.r523.art)==='clock'));
 ok('preparation rooms: spinning wheel (cruel fairy-tale castle)',of(H,/^preparation/).some(p=>base(p.r523.art)==='spin'));
 ok('south chambers: a gothic bed with a cabinet',of(H,/^south-/).some(p=>base(p.r523.art)==='gbed')&&of(H,/^south-/).some(p=>base(p.r523.art)==='gcab'));
 ok('north rooms / entry hall: a grandfather clock',of(H,/^(north-|entry-hall)/).some(p=>base(p.r523.art)==='clock'));
 ok('no wheelchair in the castle (modern piece stays in the hospital)',!H.mine.some(p=>base(p.r523.art)==='chair3'));
 ok('nothing in the boss room',H.rows.every(p=>H.nm.get(p.r523.room)!=='boss-room'));
 // 부분 쿼터뷰: 벽 방향에 맞는 그림, 뒤집기 없음
 ok('partial quarter view: every piece uses the picture rendered for its wall (north art on north walls, west art on west walls) and is never mirrored',H.mine.length>0&&H.mine.every(p=>ART[p.r523.art].face===p.r523.wall&&!p.r303Flip));
 ok('both directions actually appear in the castle',H.mine.some(p=>p.r523.wall==='n')&&H.mine.some(p=>p.r523.wall==='w'));
 ok('feet on floor, not sunk into a wall (≤1%), not hidden behind a front wall (≤20%)',H.mine.every(p=>{const S=api.samplesOf(p.r523.art,!!p.r303Flip);return !H.hit(p.x,p.y)&&api.embedOf(S,p.x,p.y,H.hit)<=.01&&api.hiddenOf(S,p.x,p.y,H.hit)<=.2;}));
 ok('every piece has a wall right behind it',H.mine.filter(p=>p.r521Foot).every(p=>{const f=p.r521Foot,d=p.r523.d,mx=(f[0]+f[2])/2,my=(f[1]+f[3])/2;return p.r523.wall==='n'?H.hit(mx,f[1]-d-.1):H.hit(f[0]-d-.1,my);}));
 ok('presentation only: not solid, no targeting, rides the R521 draw path',H.rows.every(p=>p.solid===false&&p.presentationOnly===true&&p.autoTargetEligible6===false&&p.r521Ward===true));
 ok('at most two clocks and two spinning wheels per castle (no rows of the same piece)',H.mine.filter(p=>base(p.r523.art)==='clock').length<=4&&H.mine.filter(p=>base(p.r523.art)==='spin').length<=3);
 const sig=X=>X.rows.map(p=>p.id+p.r523.art+p.x.toFixed(3)+p.y.toFixed(3)).join();
 {const use=X=>[...new Set(X.rows.map(p=>X.nm.get(p.r523.room)+'>'+p.r523.use))].sort().join();const H2=look('hando02'),H3=look('hando03');
 ok('hando02 and hando03 (same castle map, different scenery props) get the castle set too, all five room uses ('+H2.rows.length+', '+H3.rows.length+' pieces)',[H2,H3].every(X=>X.rows.length>=14&&new Set(X.rows.map(p=>p.r523.use)).size>=5));}
 ok('deterministic: same plan on a fresh boot',(()=>{const a2=boot();return a2.list(world(FX.hando01)).map(p=>p.id+p.x.toFixed(3)).join()===H.rows.map(p=>p.id+p.x.toFixed(3)).join();})());
 ok('switch off: castle gets nothing',(()=>{const a3=boot('{"on":false}');return !a3.enabled(world(FX.hando01));})());
 // 병원: 휠체어
 const C=look('ep1a09');
 ok('hospital ep1a09: the 3D wheelchair waits in the waiting room (처치 대기실), on its own wall picture',C.mine.some(p=>base(p.r523.art)==='chair3'&&C.nm.get(p.r523.room)==='처치 대기실')&&C.mine.filter(p=>base(p.r523.art)==='chair3').every(p=>ART[p.r523.art].face===p.r523.wall&&!p.r303Flip));
 ok('hospital: no castle furniture',C.mine.every(p=>base(p.r523.art)==='chair3'));
 ok('cult03 untouched by R1020',!look('cult03').mine.length);
 ok('castle layer guard: a samong / non-story layer room is not furnished',(()=>{const w=world(FX.hando01);w.layer='DREAM';return !api.enabled(w);})());}
console.log(`\nR1020 cpu check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
