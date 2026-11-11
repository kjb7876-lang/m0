// R731 CPU check — 사몽 구역 방 꾸미기 첫 묶음(방 이름이 정본에서 온 '방' 구역 7곳).
//  rooms-r523.js 의 방 꾸미기 엔진을 사몽 구역(room.exploration.samongR115, 방 사각형 = worldR74.rooms)으로 넓힌다. 그리기 전용, 결정적.
//  지도는 헤드리스 게임에서 뽑은 실제 자료(fixtures/*.json), 벽 판정은 실제 엔진 함수(runtime-text/dist/phase1.js explorationBlocked).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='rooms-r523.js',src=rd('client-source/'+F);
ok('samong path lives in rooms-r523.js (no new script), runtime copy matches',/R731/.test(src)&&rd('runtime-text/'+F)===src);
ok('CI runs this check',/node r96\/qa\/r731\/r731-cpu-check\.cjs/.test(rd('../.github/workflows/pages.yml')));
let E=null;try{const c={window:{},console,performance:{now:()=>0}};vm.createContext(c);vm.runInContext(rd('runtime-text/dist/phase1.js'),c);E=c.window.StoryPhase1.explorationBlocked;}catch(e){}
ok('engine explorationBlocked loaded',typeof E==='function');
const ZONES=['sz115-S04-3','sz115-S04-4','sz115-S05-3','sz115-S06-2','sz115-S06-22','sz115-RA-5','sz115-M-4'];
let RA3=null;try{RA3=JSON.parse(rd('qa/r731/fixtures/sz115-RA-3.json'));}catch(_){}/* 미술관 회랑: 맞는 그림이 없어 이번 묶음에서 뺀 구역 */
const FX={};for(const z of ZONES)try{FX[z]=JSON.parse(rd('qa/r731/fixtures/'+z+'.json'));}catch(_){}
ok('fixtures present (7 real samong zones + the gallery zone left out)',!!RA3&&ZONES.every(z=>FX[z]&&Object.keys(FX[z].floorSpans).length>20&&FX[z].walls.length>10&&FX[z].zone===z));
function layoutOf(fx,zone){const cells=[];for(const[y,sp]of Object.entries(fx.floorSpans))for(let i=0;i<sp.length;i+=2)for(let x=sp[i];x<sp[i+1];x++)cells.push([x,+y]);
 return{bounds:fx.bounds,floorCells:cells,walls:fx.walls.map(w=>({...w})),worldR74:{rooms:fx.rooms.map(q=>({...q})),doors:fx.doors.map(d=>({...d}))},entry:fx.entry,starts:fx.starts,samongR115:{rev:'R115-samong-zones-1',zone:zone||fx.zone,kind:'explore'}};}
const world=(fx,opt={})=>({id:fx.id,layer:opt.layer||fx.layer,exploration:layoutOf(fx,opt.zone),props:fx.props.map(p=>({...p,solid:false,visible:true})),enemies:[]});
function boot(opt={}){const drawn=[];const ctx={localStorage:{getItem:k=>opt.stored&&opt.stored[k]||null,setItem:()=>{}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,StoryPhase1:{explorationBlocked:E},regionById:{},
  readyImage:()=>({image:{naturalWidth:300,naturalHeight:400}}),ensureImages:()=>Promise.resolve(),room:undefined,draw:function(){const r=ctx.room;ctx.seen=r.props.map(p=>p.id);for(const p of r.props)ctx.drawProp(p);},drawProp:function(p){drawn.push(p.id);}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);return{ctx,api:ctx.__STORYWORLD_ROOMS_R523__,vil:ctx.__STORYWORLD_VILLAGE_R730__,drawn};}
let B=null;try{B=boot();}catch(e){console.log(String(e.stack).slice(0,300));}const api=B&&B.api;
ok('api: samong table and zone list exported',!!api&&Array.isArray(api.SAMONG)&&Array.isArray(api.SAMONG_ZONES)&&typeof api.samongUse==='function');
if(!api||!E||!api.SAMONG||!ZONES.every(z=>FX[z])){console.log('\nR731 '+(n-bad)+'/'+n+' passed (stopped early)');process.exit(1);}
ok('first batch = exactly the seven named-room zones that have a room we can furnish; S-02 pilot (already furnished) and added combat zones are not in it',api.SAMONG_ZONES.slice().sort().join()===ZONES.slice().sort().join());
ok('samong table only uses known uses',api.SAMONG.every(([re,u])=>typeof re.test==='function'&&[].concat(u).every(v=>api.USE[v])));
// 방 이름 → 쓰임새(정본에서 온 이름만. 맞는 그림이 없는 방은 비운다 — 지어내지 않는다)
const WANT={'식당':'canteen','식당 안쪽':'canteen','주방':'ranges','배식구':'prep','경비실':'security','숙직실':'bedroom','창고':'depot','사무실':'study','서류 창고':'archive','대기실':'lobby7','의료 지원반':'inject','서버 냉각실':'plant','원룸 철문 앞':'foyer','좁은 원룸':'bedroom','병동':'observe','병실':'observe','상담실':'counsel','간호사실':'drug'};
ok('room names → uses',Object.entries(WANT).every(([nm,u])=>api.samongUse(nm)===u));
const EMPTY=['도겸의 방','이젤 앞','전시실','전시실 끝','학교 창가','정원 문','4층 복도','2층 복도','사무실 복도','지하 기지 복도','원룸 복도','미술관 회랑','이어진 복도','병동 복도',''];
ok('rooms without matching art and all corridors stay empty',EMPTY.every(nm=>api.samongUse(nm)===null));
ok('story regions keep their own table (samong names do not leak into REGION)',api.useOf('ep1a09','식당')===null&&api.useOf('ep1a09','주사실')==='inject');
let total=0;
for(const z of ZONES){const fx=FX[z],r=world(fx),rows=api.list(r),again=api.list(world(fx));total+=rows.length;
 const rect=q=>[q.x,q.y,q.x+q.w,q.y+q.h],rooms=fx.rooms.map((q,i)=>({i,name:q.name,kind:q.kind,b:rect(q),use:api.samongUse(q.name)}));
 ok(z+': enabled on the DREAM layer with donor region id '+fx.id,api.enabled(r)===true&&r.layer==='DREAM');
 ok(z+': deterministic',rows.length>0&&JSON.stringify(rows.map(p=>[p.id,p.x,p.y,p.path]))===JSON.stringify(again.map(p=>[p.id,p.x,p.y,p.path])));
 const inRoom=(p,q)=>p.x>q.b[0]-.2&&p.x<q.b[2]+.2&&p.y>q.b[1]-.2&&p.y<q.b[3]+.2;
 ok(z+': every piece stands inside a furnished room (never in a corridor or an unmapped room)',rows.every(p=>{const q=rooms[p.r523.room];return q&&q.use&&q.use===p.r523.use&&q.kind!=='corridor'&&inRoom(p,q);}));
 const cnt={};for(const p of rows)cnt[p.r523.room]=(cnt[p.r523.room]||0)+1;
 ok(z+': each furnished room reads as its use (3+ pieces): '+rooms.filter(q=>q.use).map(q=>q.name+' '+(cnt[q.i]||0)).join(' · '),rooms.filter(q=>q.use).every(q=>(cnt[q.i]||0)>=3));
 ok(z+': total stays modest ('+rows.length+')',rows.length<=70);
 ok(z+': room centres stay open (memory shard · fights): nothing within 3 cells of a room centre',rows.every(p=>rooms.every(q=>Math.hypot(p.x-(q.b[0]+q.b[2])/2,p.y-(q.b[1]+q.b[3])/2)>=3)));
 ok(z+': doors (3.6), entry (2.6) and existing props (1.1; clues·sculptures·shards 1.5) are kept clear',rows.every(p=>fx.doors.every(d=>Math.hypot(d.x-p.x,d.y-p.y)>=3.6)&&Math.hypot(fx.entry.x-p.x,fx.entry.y-p.y)>=2.6&&fx.props.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=((q.r115Clue||q.r161Sculpture||q.chestR103)?1.5:1.1))));
 ok(z+': feet are on open floor (engine wall test)',rows.every(p=>!E(r.exploration,p.x,p.y,.02)));
 ok(z+': decoration only',rows.every(p=>p.solid===false&&p.presentationOnly===true&&p.autoTargetEligible6===false&&p.r521Ward===true&&/^r523:/.test(p.id)));}
ok('whole batch adds a real amount of furniture ('+total+')',total>=120&&total<=420);
// 켜고 끄기·범위
{const fx=FX['sz115-S04-4'];
 ok('S-02 pilot zones are left alone',api.enabled(world(fx,{zone:'sz115-S02-3'}))===false&&api.list(world(fx,{zone:'sz115-S02-3'})).length===0);
 ok('zones outside this batch are left alone (later batches)',api.enabled(world(fx,{zone:'sz115-S04-6'}))===false&&api.enabled(world(fx,{zone:'sz162-S04-B'}))===false);
 const off=boot({stored:{'storyworld.r523.rooms':'{"on":true,"samong":false}'}});ok('off switch for samong only ({"samong":false})',off.api.enabled(world(fx))===false);
 const off2=boot({stored:{'storyworld.r523.rooms':'{"on":false}'}});ok('master off switch still turns everything off',off2.api.enabled(world(fx))===false);
 ok('the gallery zone RA-3 (도겸의 방·이젤 앞·전시실: no easel or frame art yet) is not handled',api.enabled(world(RA3))===false&&api.list(world(RA3)).length===0);
 const no=world(fx);delete no.exploration.samongR115;ok('same map without the samong mark is not handled (donor region has no table)',api.enabled(no)===false);}
// 그리기: draw 동안만 덧붙이고 되돌린다. 사몽에서는 기존 조형물을 쉬게 하지 않는다(단서·기억 조각·창문 장식 그대로)
{const b=boot(),fx=FX['sz115-M-4'],r=world(fx),before=r.props.slice();b.ctx.room=r;b.ctx.draw();
 const rows=b.api.list(r);ok('draw appends furniture for the frame and restores room.props',b.ctx.seen.length===before.length+rows.length&&r.props.length===before.length&&r.props.every((p,i)=>p===before[i]));
 ok('nothing already in the zone is hidden',before.every(p=>b.ctx.seen.includes(p.id)));}
// 불면귀 마을(R730)은 last302 를 기증 지역으로 쓰는 사몽 구역에 집을 세우지 않는다
{const b=boot(),fx=FX['sz115-S05-3'],r=world(fx);ok('fixture S05-3 borrows last302',fx.id==='last302');b.vil.apply({...r,layer:'STORY'});ok('R730 village stays out of samong zones',r.props.every(p=>!p.r730));}
console.log('\nR731 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
