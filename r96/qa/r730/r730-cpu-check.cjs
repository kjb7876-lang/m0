// R730 CPU check — 불면귀 구역(last302 잠들지 못하는 마을 · last303 한약과 불면귀)을 마을답게.
//  길 뒤편 언덕에 기와집 줄, 길 가 석등·향로·서낭나무·기와 더미. 그리기 전용(충돌·몹·보스 자리·바닥 불변), 결정적.
//  지도는 헤드리스 게임에서 뽑은 실제 자료(fixtures/last302.json · last303.json).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='rooms-r523.js',src=rd('client-source/'+F);
ok('village module lives in rooms-r523.js (already wired: script tag, verify list, manifest)',/__STORYWORLD_VILLAGE_R730__/.test(src)&&rd('runtime-text/'+F)===src);
ok('CI runs this check',/node r96\/qa\/r730\/r730-cpu-check\.cjs/.test(rd('../.github/workflows/pages.yml')));
const at=src.indexOf('// ==== R730'),code=(at>=0?src.slice(at):'').replace(/\/\/.*$/mg,'').replace(/\/\*[\s\S]*?\*\//g,'');
ok('presentation only: no hp/save/collision/solid/enemy writes, no randomness, no clock',code.length>500&&!/\.hp\s*=[^=]|saveGame|\.walls\s*=[^=]|floorCells\s*=[^=]|\.solid\s*=[^=]|\.enemies\b|\.exploration\s*=[^=]|Math\.random|Date\.now|bossBounds\s*=|gatherBounds\s*=/.test(code));
ok('only the two Bulmyeongwi regions, STORY layer, off switch',/last302/.test(code)&&/last303/.test(code)&&!/ep1b06|last301|last304/.test(code)&&/layer==='STORY'/.test(code)&&/storyworld\.r730\.village/.test(code));
const FX={};for(const id of['last302','last303'])try{FX[id]=JSON.parse(rd('qa/r730/fixtures/'+id+'.json'));}catch(_){}
ok('fixtures present',!!FX.last302&&!!FX.last303&&FX.last302.floorCells.length>4000);
function boot(){const ctx={localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,setInterval:()=>0,clearInterval:()=>{}};ctx.window=ctx;vm.createContext(ctx);try{vm.runInContext(src,ctx);}catch(e){}return ctx.__STORYWORLD_VILLAGE_R730__;}
const api=boot();ok('api',!!api&&typeof api.plan==='function'&&typeof api.apply==='function');
if(!api||!FX.last302){console.log('\nR730 '+(n-bad)+'/'+n+' passed (stopped early)');process.exit(1);}
const PX=34,SUM=17;
// R204 지형장 — 둔덕 경계(보이는 바위 벽)를 그대로 계산하려고 진짜 모듈을 최소 스텁으로 올린다(수치는 cave-r204.js ZONES 의 last302·last303 줄과 같다)
const MIN_F=.9,CAVE_CFG={last302:{seed:0x5d3020,bulge:.8,topK:1.9,floorK:1.05,hiTop:1.4,loTop:.5},last303:{seed:0x5d3030,bulge:.85,topK:1.9,floorK:1.03,hiTop:1.4,loTop:.48}};
const cave=(()=>{const cs=rd('client-source/cave-r204.js'),z=s=>{const m=cs.match(new RegExp(s+':\\{seed:(0x[0-9a-f]+)[^\\n]*?bulge:([.0-9]+)'));return m&&[parseInt(m[1],16),parseFloat(m[2])];};
 for(const id of Object.keys(CAVE_CFG)){const m=z(id);ok(id+': test mirrors cave-r204 ZONES (seed, bulge)',!!m&&m[0]===CAVE_CFG[id].seed&&m[1]===CAVE_CFG[id].bulge);}
 const cx={console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,Float32Array,Uint8Array,Uint16Array,Int32Array,performance:{now:()=>Date.now()},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,setInterval:()=>0,clearInterval(){}};cx.window=cx;cx.StoryPhase1={ThreeRenderer:{prototype:{render(){}}}};vm.createContext(cx);
 try{vm.runInContext(cs,cx);}catch(e){}return cx.__STORYWORLD_CAVE_R204__||null;})();
ok('R204 field loads for the terrain check',!!cave&&typeof cave.field==='function'&&typeof cave.at==='function');
for(const id of['last302','last303']){const fx=FX[id],P=api.plan(fx),P2=api.plan(JSON.parse(JSON.stringify(fx)));
 const Fset=new Set(fx.floorCells.map(([x,y])=>x+','+y)),onFloor=p=>Fset.has(Math.floor(p.x)+','+Math.floor(p.y));
 // R810: 집 앞 언덕 소품(댓돌 신발·장독대)은 집처럼 언덕 위(바닥 밖)에 서고, 등롱대(post)는 석등과 같은 길 등불로 센다
 const HILL=new Set(['shoes','jang','yakfire','trays'])/* R811: 약방 집 앞 화로·소반도 집 언덕 위 */,houses=P.filter(p=>p.kind==='house'),hill=P.filter(p=>HILL.has(p.kind)),floor=P.filter(p=>p.kind!=='house'&&!HILL.has(p.kind)),lamps=P.filter(p=>p.kind==='lamp'||p.kind==='post');
 ok(id+': R810 hill props (shoes on the doorstone, jangdok) sit off the floor at a house lift',hill.length>=2&&hill.every(p=>!onFloor(p)&&p.lift>0&&houses.some(h=>h.lift===p.lift&&Math.hypot(h.x-p.x,h.y-p.y)<4)),hill.filter(p=>onFloor(p)).slice(0,3));
 ok(id+': deterministic',JSON.stringify(P)===JSON.stringify(P2));
 ok(id+': ids unique, r730 prefix, all art paths under assets/',new Set(P.map(p=>p.id)).size===P.length&&P.every(p=>/^r730:/.test(p.id)&&/^assets\//.test(p.path)&&p.height>20));
 ok(id+': enough houses to read as a village ('+houses.length+')',houses.length>=(id==='last302'?16:6)&&houses.length<=32);
 ok(id+': houses stand off the floor, on the hill behind a lane edge',houses.every(p=>!onFloor(p)&&p.lift>0));
 // 집 그림이 화면에서 덮는 범위(대각선 ±D, 깊이 발~지붕) 안에 바닥 칸이 없어야 영웅·몹이 가려지지 않는다
 const hides=h=>{const D=h.height*h.aspect/2/PX,c=h.x+h.y,s0=h.x-h.y,top=(h.height+h.lift)/SUM;return fx.floorCells.some(([x,y])=>Math.abs(x+.5-(y+.5)-s0)<D-.5&&x+y+1>c-top&&x+y<c+1);};
 ok(id+': no house covers playable floor on screen',houses.every(h=>!hides(h)));
 ok(id+': houses do not overlap each other on screen',houses.every((a,i)=>houses.every((b,j)=>i>=j||Math.abs((a.x-a.y)-(b.x-b.y))>=(a.height*a.aspect+b.height*b.aspect)/2/PX+.4||Math.abs(a.x+a.y-b.x-b.y)>=9)));
 ok(id+': house variety (at least two kinds of house art)',new Set(houses.map(p=>p.path)).size>=2);
 // 2차: 잠들지 못하는 집 — 기와집 몇 채는 창에 불이 켜진 그림(같은 크기·같은 자리, 배치는 1차와 같음)
 const LIT='assets/r730/tiled-house-lit.webp',lit=houses.filter(p=>p.path===LIT),hanok=houses.filter(p=>p.path===LIT||/r80-010/.test(p.path));
 ok(id+': some hanok windows are lit, most stay dark ('+lit.length+'/'+hanok.length+')',lit.length>=2&&lit.length<=hanok.length*.5&&lit.every(p=>p.aspect===512/367));
 // 실제 게임은 길잡이 길(route)을 넘겨 집 고르는 순서가 달라진다 — 그래도 불 켜진 집이 빠지지 않아야 한다(헤드리스에서 last303 이 0채였던 일)
 {const alt=api.plan({...fx,route:fx.floorCells.filter((_,i)=>i%97===0).map(([x,y])=>({x:x+.5,y:y+.5}))}).filter(p=>p.kind==='house');ok(id+': lit houses survive a different route order ('+alt.filter(p=>p.path===LIT).length+')',alt.filter(p=>p.path===LIT).length>=2);}
 ok(id+': lit houses are spread out (no two lit neighbours within 6 cells)',lit.every((a,i)=>lit.every((b,j)=>i>=j||Math.hypot(a.x-b.x,a.y-b.y)>=6)));
 ok(id+': lane props stand on the floor',floor.length>=10&&floor.every(onFloor));
 const W=fx.ward||{},inB=(B,p,m)=>Array.isArray(B)&&p.x>B[0]-m&&p.x<B[2]+m&&p.y>B[1]-m&&p.y<B[3]+m;
 ok(id+': boss room and gathering room are left alone',floor.every(p=>!inB(W.boss,p,1)&&!inB(W.gather,p,1)));
 ok(id+': doors, entry and existing props are kept clear',floor.every(p=>fx.doors.every(d=>Math.hypot(d.x-p.x,d.y-p.y)>=3)&&Math.hypot(fx.entry.x-p.x,fx.entry.y-p.y)>=3&&fx.props.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=2)));
 ok(id+': stone lanterns light the lanes without clutter ('+lamps.length+', at least 8 cells apart)',lamps.length>=8&&lamps.length<=26&&lamps.every((a,i)=>lamps.every((b,j)=>i>=j||Math.hypot(a.x-b.x,a.y-b.y)>=8)));
 // 배치 수정(2026-11-11 사용자 "조형물이 벽에 감기는 문제"): 길 뒤쪽 끝 칸에서 0.75칸 안쪽에 세우면 서낭나무·석등이 뒤 절벽(벽 덩어리)에 파묻혔다.
 //  R412 의 3D 벽 검사(그림 불투명 점의 3%까지)로 실측한 결과(헤드리스, last302·303 전수): 칸 시작에서 안쪽으로 나무 1.75칸·석등 1.0칸·향로 0.75칸·기와 더미 0.75칸 이상이어야 0~3%.
 //  그래서 뒤쪽 끝에서 안쪽으로 띄운 거리가 종류별 최소 이상이고, 그래도 길 한가운데로 나오지 않게 3칸 안에 있어야 한다.
 const insetOf=p=>{let a=Math.floor(p.y);while(Fset.has(Math.floor(p.x)+','+(a-1)))a--;let b=Math.floor(p.x);while(Fset.has((b-1)+','+Math.floor(p.y)))b--;return Math.min(p.y-a,p.x-b);};
 const MINI={tree:1.75,lamp:1.0,censer:.75,giwa:.75,post:1.0,rope:1.0,boat:1.75,rack:1.75,herbrack:1.0,tpost:1.0,seaweed:.5,deadpost:1.0};/* R814 꺼진 등롱대는 등롱대(post)와 같은 그림 크기 *//* R812 미역 무더기는 높이 22px 로 바닥에 깔려 절벽에 감길 일이 없다 *//* R810 새 길 가 소품: 등롱대는 석등과 같게, 금줄은 석등만큼, 배·건조대는 나무만큼 띄운다 */
 ok(id+': lane props stand back far enough from the cliff behind them (tree 1.75, lamp 1.0, censer/giwa .75 cells from the back edge)',floor.every(p=>insetOf(p)>=MINI[p.kind]-1e-9),floor.filter(p=>insetOf(p)<MINI[p.kind]-1e-9).map(p=>p.kind+'@'+p.x+','+p.y+':'+insetOf(p)).slice(0,4));
 ok(id+': lane props still hug the back lane edge (never mid-lane, within 3 cells)',floor.every(p=>insetOf(p)<=3));
 // 2026-11-12 사용자 "화로가 또 벽에 겹쳐져 있음"(화면 첨부): 위 거리는 R412 벽 상자 기준이라 통과했지만, 눈에 보이는 바위 둔덕은 R204 지형장(F.f, 0 등고선이 둔덕 경계)이다.
 //  실측(헤드리스, last302·303 전수): 향로·기와 더미가 F.f 0.44~0.5 에 서서 그림 뒤쪽 절반이 둔덕에 걸쳤다(석등 .83·부적 기둥 .74). R204 의 진짜 field() 를 같은 칸 자료로 돌려, 길 가 조형물 발 자리가 둔덕 경계에서 MIN_F 이상 떨어졌는지 잰다.
 {const hill=new Set(['house','jang','shoes','trays','yakfire']),lane=floor.filter(p=>!hill.has(p.kind));
  if(cave){const c=CAVE_CFG[id],prot=[[fx.entry.x,fx.entry.y,1.6],...fx.props.map(q=>[q.x,q.y,.9]),...fx.doors.map(d=>[d.x,d.y,2.4]),...P.map(q=>[q.x,q.y,.9])];
   const F=cave.field({bounds:fx.bounds,floorCells:fx.floorCells,walls:fx.walls||[]},c,prot),low=lane.map(p=>({p,f:cave.at(F,F.f,p.x,p.y)})).filter(r=>r.f<MIN_F);
   ok(id+': every lane prop stands at least '+MIN_F+' cells inside the visible rock-mound edge (R204 field)'+(low.length?' '+JSON.stringify(low.sort((a,b)=>a.f-b.f).slice(0,6).map(r=>r.p.kind+'@'+r.p.x+','+r.p.y+' f='+r.f.toFixed(2))):''),low.length===0,low.sort((a,b)=>a.f-b.f).slice(0,5).map(r=>r.p.kind+'@'+r.p.x+','+r.p.y+' f='+r.f.toFixed(2)));}}
 ok(id+': total stays modest ('+P.length+')',P.length<=80);}
// 방에 붙이기
{const fx=FX.last302,room={id:'last302',layer:'STORY',props:fx.props.map(p=>({...p})),exploration:{floorCells:fx.floorCells,worldR74:{rooms:fx.rooms,doors:fx.doors},worldWardR81:{bossBounds:fx.ward.boss,gatherBounds:fx.ward.gather},entry:fx.entry}};
 const before=room.props.length;api.apply(room);const added=room.props.filter(p=>p.r730);api.apply(room);
 const onHill=p=>p.r730==='house'||p.r730==='shoes'||p.r730==='jang';/* R810: 집 앞 언덕 소품도 집처럼 제외 */
 ok('lane props are left for R412 to measure against the walls (houses on the hill are exempt)',added.filter(p=>!onHill(p)).every(p=>!p.r412Wall)&&added.filter(onHill).every(p=>p.r412Wall===1));
 ok('apply adds once (idempotent), keeps existing props',added.length>20&&room.props.length===before+added.length&&room.props.slice(0,before).every((p,i)=>p.id===fx.props[i].id));
 ok('added props are decoration only',added.every(p=>p.solid!==true&&p.interactive===false&&p.autoTargetEligible6===false));
 ok('houses carry the lift and face the lane (flip on -x side)',added.filter(p=>p.r730==='house').every(p=>p.visualLiftPx>0)&&added.some(p=>p.r303Flip));
 const other={id:'last301',layer:'STORY',props:[],exploration:room.exploration};api.apply(other);ok('other regions untouched',other.props.length===0);
 const dream={id:'last302',layer:'DREAM',props:[],exploration:room.exploration};api.apply(dream);ok('non-STORY layer untouched',dream.props.length===0);}
{let ix=null;try{ix=JSON.parse(rd('runtime-text/assets/r730/index.json'));}catch(_){}
 const f=path.join(R,'runtime-text/assets/r730/tiled-house-lit.webp'),sz=fs.existsSync(f)?fs.statSync(f).size:0,row=ix&&ix.assets&&ix.assets.find(q=>q.path==='assets/r730/tiled-house-lit.webp');
 ok('lit house art exists, small, and its source is recorded (derived from existing game art, not final art)',sz>10000&&sz<120000&&!!row&&row.bytes===sz&&/r80-010/.test(row.source)&&/^[0-9a-f]{64}$/.test(row.sha256)&&row.final===false);}
console.log('\nR730 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
