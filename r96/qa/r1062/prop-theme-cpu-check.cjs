// R1062 지역별 소품 그림 묶음 상시 검사(정적·CPU, 화면 검증 아님).
//  엔진 자료(index.html)의 지역 소품 512점을 지역별로 모아, 실제 게임과 같은 거르기(R220 interiorProps → R1062 themeProps)와 그리기 쪽 바꿔 그리기(R1061 약병장)를 거친 뒤
//  남는 그림이 theme-pools.json 의 그 지역 허용 묶음 안에 있는지 본다. 새 그림을 어느 지역에 넣으면 이 검사가 멈춘다 → 주제에 맞는지 보고 허용 묶음에 더한다.
//  실내 주제(clinic·home·machine)의 허용 묶음에는 바깥 전용 그림(outdoorOnly)을 넣을 수 없다 — 허용 묶음에 적어 넣어도 실패한다.
//  사용: node r96/qa/r1062/prop-theme-cpu-check.cjs [--print-pools]
const fs=require('fs'),path=require('path'),vm=require('vm'),R=path.join(__dirname,'..','..');let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;if(!c||process.env.VERBOSE)console.log((c?'ok   ':'FAIL ')+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8'),html=rd('runtime-text/index.html'),cave=rd('client-source/cave-r204.js'),rooms=rd('client-source/rooms-r523.js');
ok(cave===rd('runtime-text/cave-r204.js'),'cave-r204.js 원본·런타임 사본이 같음');
// ---- 엔진 자료의 지역 소품 ----
const objs=[];for(const m of html.matchAll(/\{"id":"([^"]+)"(?:,"sourceObjectId":"[^"]*")?(?:,"name":"([^"]*)")?[^{}]*?"path":"(assets\/[^"]+)"[^{}]*?\}/g)){const seg=m[0],kind=/"kind":"([^"]*)"/.exec(seg);if(!kind||!/regional-scene-prop|source-structure-scenery|corrected-regional-scenery/.test(kind[1]))continue;objs.push({id:m[1],name:m[2]||undefined,path:m[3],kind:kind[1]});}
ok(objs.length>=500,'엔진 자료에서 지역 소품을 읽음(500점 이상)',objs.length);
const zoneOf=id=>{const m=/^([A-Za-z0-9]+)-/.exec(id);return m?m[1]:null;},byZone={};for(const o of objs){const z=zoneOf(o.id);(byZone[z]=byZone[z]||[]).push(o);}
// ---- R204 거르기를 실제 코드로 ----
const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,setTimeout:()=>0,localStorage:{getItem:()=>null,setItem(){}},
 window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};
vm.createContext(sb);vm.runInContext('var room=null,player={x:0,y:0};function blocked(){return false;}function makeRoom(id){return {id,layer:"STORY",props:[],enemies:[]};}async function enterRegion(){return true;}',sb);vm.runInContext(cave,sb);
const API=sb.window.__STORYWORLD_CAVE_R204__;ok(typeof API.themeProps==='function'&&typeof API.zoneKind==='function'&&typeof API.themeDeny==='function','R204 가 themeProps·zoneKind·themeDeny 를 내놓음');
ok(/interiorProps\(roomOf\(frame\),cfg\);themeProps\(roomOf\(frame\),frame\.zone\);/.test(cave),'지형 만들 때 R220 거르기 바로 뒤에 주제 거르기를 부름');
// ---- 그리기 쪽 바꿔 그리기(R1061) ----
const cabRule=/const CAB_BAD=\/props\\\/v290\\\/ruined_market\\\.webp\$\//.test(rooms)&&/\^ep1a09-cabinet-/.test(rooms)&&/r\.id==='ep1a09'\)\{try\{kept=kept\.map\(cabOf\)/.test(rooms);
ok(cabRule,'R1061 약병장 바꿔 그리기가 rooms-r523.js 에 있음');
const drawn=o=>cabRule&&/^ep1a09-cabinet-/.test(o.id)&&/props\/v290\/ruined_market\.webp$/.test(o.path)?'assets/r521/medicine-cabinet.webp':o.path;
const base=p=>p.split('/').pop().replace(/\.(webp|png)$/,'');
const survive={};for(const [z,list] of Object.entries(byZone)){const rm={props:list.map(o=>({...o}))},kind=API.zoneKind(z);if(kind){API.interiorProps(rm,{kind});API.themeProps(rm,z);}survive[z]={kind:kind||'field',arts:[...new Set(rm.props.map(o=>base(drawn(o))))].sort(),named:rm.props.filter(o=>o.name).map(o=>[o.name,base(drawn(o))])};}
if(process.argv.includes('--print-pools')){const out={};for(const z of Object.keys(survive).sort())out[z]={theme:survive[z].kind,allow:survive[z].arts};console.log(JSON.stringify(out,null,1));process.exit(0);}
const P=JSON.parse(rd('qa/r1062/theme-pools.json')),INDOOR=new Set(P.indoorThemes),OUT=new Set(P.outdoorOnly);
let zonesOk=0,over=[];for(const z of Object.keys(survive).sort()){const s=survive[z],pool=P.zones[z];if(!pool){ok(false,'허용 묶음에 없는 지역 '+z,s.arts);continue;}
 ok(pool.theme===s.kind,z+': 주제 표기가 R204 지역 종류와 같음',[pool.theme,s.kind]);
 const extra=s.arts.filter(a=>!pool.allow.includes(a));ok(!extra.length,z+'('+s.kind+'): 허용 묶음에 없는 그림이 없음 — 주제에 맞는지 보고 theme-pools.json 에 더할 것',extra);
 if(INDOOR.has(pool.theme)){const leak=pool.allow.filter(a=>OUT.has(a)),seen=s.arts.filter(a=>OUT.has(a));ok(!leak.length&&!seen.length,z+': 실내 주제에 바깥 전용 그림 없음(허용 묶음·실제 모두)',[leak,seen]);}
 if(!extra.length)zonesOk++;over.push(...pool.allow.filter(a=>!s.arts.includes(a)).map(a=>z+':'+a));}
ok(Object.keys(P.zones).every(z=>survive[z]),'허용 묶음의 지역이 모두 엔진 자료에 있음',Object.keys(P.zones).filter(z=>!survive[z]));
ok(!over.length,'허용 묶음에 쓰이지 않는 그림이 남아 있지 않음(묶음이 헐거워지지 않게)',over.slice(0,12));
// ---- 그림이 바뀐 서사 소품(이름 있는 것): 폐허 시장 좌판이 서사 소품 그림으로 남지 않는다 ----
const namedMarket=Object.entries(survive).flatMap(([z,s])=>s.named.filter(([,a])=>a==='ruined_market').map(([nm])=>z+':'+nm));ok(!namedMarket.length,'이름 붙은 서사 소품이 폐허 시장 좌판 그림으로 그려지지 않음',namedMarket);
// ---- 맘몬(ep1b06)은 손대지 않는다 ----
ok(!Object.keys(API.themeDeny()).includes('ep1b06'),'맘몬 맵(ep1b06)은 주제 거르기 표에 없음');
// ---- themeProps 규칙 ----
{const mk=()=>({props:[{id:'x-prop-1',path:'assets/props/v290/collapsed_pillar.webp',kind:'regional-scene-prop'},{id:'x-prop-2',path:'assets/props/v290/hotel_luggage_cart.webp',kind:'regional-scene-prop'},{id:'x-a',name:'서사 소품',path:'assets/props/v290/collapsed_pillar.webp'},{id:'chest-1',path:'assets/props/v290/collapsed_pillar.webp',kind:'chest'},{id:'f',path:'assets/world-r80/r80-148.webp'},{id:'g',path:'assets/r999/collapsed_pillar.webp'}]});
 const a=mk();const k=API.themeProps(a,'ep1a08');ok(k===2&&a.props.length===4&&a.props.some(q=>q.name)&&a.props.some(q=>q.kind==='chest')&&a.props.some(q=>/r999/.test(q.path)),'병원: 이름 없는 엔진 돌기둥·짐수레만 빠지고 서사 소품·상자·다른 묶음 그림은 남음',a.props.map(q=>q.id));
 ok(API.themeProps(a,'ep1a08')===0&&a.r1062Props===true,'방마다 한 번만 거름');const b=mk();ok(API.themeProps(b,'dist00')===0&&b.props.length===6,'표에 없는 지역은 그대로');const c=mk();ok(API.themeProps(c,'ep1b06')===0&&c.props.length===6,'맘몬 맵은 그대로');}
console.log('\nR1062 지역 소품 주제 검사: '+(n-bad)+'/'+n+' (지역 '+zonesOk+'/'+Object.keys(survive).length+' 통과)');process.exit(bad?1:0);
