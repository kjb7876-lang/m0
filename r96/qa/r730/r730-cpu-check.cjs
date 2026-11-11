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
for(const id of['last302','last303']){const fx=FX[id],P=api.plan(fx),P2=api.plan(JSON.parse(JSON.stringify(fx)));
 const Fset=new Set(fx.floorCells.map(([x,y])=>x+','+y)),onFloor=p=>Fset.has(Math.floor(p.x)+','+Math.floor(p.y));
 const houses=P.filter(p=>p.kind==='house'),floor=P.filter(p=>p.kind!=='house'),lamps=P.filter(p=>p.kind==='lamp');
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
 ok(id+': lane props hug the back edge (never mid-lane)',floor.every(p=>!Fset.has(Math.floor(p.x)+','+(Math.floor(p.y)-1))||!Fset.has((Math.floor(p.x)-1)+','+Math.floor(p.y))));
 ok(id+': total stays modest ('+P.length+')',P.length<=80);}
// 방에 붙이기
{const fx=FX.last302,room={id:'last302',layer:'STORY',props:fx.props.map(p=>({...p})),exploration:{floorCells:fx.floorCells,worldR74:{rooms:fx.rooms,doors:fx.doors},worldWardR81:{bossBounds:fx.ward.boss,gatherBounds:fx.ward.gather},entry:fx.entry}};
 const before=room.props.length;api.apply(room);const added=room.props.filter(p=>p.r730);api.apply(room);
 ok('apply adds once (idempotent), keeps existing props',added.length>20&&room.props.length===before+added.length&&room.props.slice(0,before).every((p,i)=>p.id===fx.props[i].id));
 ok('added props are decoration only',added.every(p=>p.solid!==true&&p.interactive===false&&p.autoTargetEligible6===false&&p.r412Wall===1));
 ok('houses carry the lift and face the lane (flip on -x side)',added.filter(p=>p.r730==='house').every(p=>p.visualLiftPx>0)&&added.some(p=>p.r303Flip));
 const other={id:'last301',layer:'STORY',props:[],exploration:room.exploration};api.apply(other);ok('other regions untouched',other.props.length===0);
 const dream={id:'last302',layer:'DREAM',props:[],exploration:room.exploration};api.apply(dream);ok('non-STORY layer untouched',dream.props.length===0);}
{let ix=null;try{ix=JSON.parse(rd('runtime-text/assets/r730/index.json'));}catch(_){}
 const f=path.join(R,'runtime-text/assets/r730/tiled-house-lit.webp'),sz=fs.existsSync(f)?fs.statSync(f).size:0,row=ix&&ix.assets&&ix.assets.find(q=>q.path==='assets/r730/tiled-house-lit.webp');
 ok('lit house art exists, small, and its source is recorded (derived from existing game art, not final art)',sz>10000&&sz<120000&&!!row&&row.bytes===sz&&/r80-010/.test(row.source)&&/^[0-9a-f]{64}$/.test(row.sha256)&&row.final===false);}
console.log('\nR730 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
