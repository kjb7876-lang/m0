// R1208 CPU check: 사몽 디스토피아(S-06) 구역 배너가 'DYS-05' 같은 구간 번호 대신 서사 연도를 보여 주는지.
//  사용자 2026-11-19 07:22Z "dys05 화면에 뜨는거 적당한 년도 2037년 이런식으로 서사에 맞게 … 디스토피아쪽".
//  정본에는 연도가 없으므로 원문 문장(일주일 뒤·수개월·사흘 전 도약·스무 살의 원룸)에 맞춘 표를 쓴다. 원문 제목·문단은 바꾸지 않는다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text'),REPO=path.join(ROOT,'..');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,400)));};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
const store=new Map();
const sb={console,Math,JSON,Date,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,TypeError,Promise,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},
 localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))}};
sb.window=sb;vm.createContext(sb);
for(const f of ['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js','samong-r103.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
// 그리기 환경: 렌더러(phase1 DrawCommands)에 실제로 있는 함수만 둔다 — 없는 함수(strokeRect 등)를 부르면 실패한다.
const ALLOWED=['save','restore','setTransform','resetTransform','transform','translate','rotate','scale','getTransform','point','beginPath','moveTo','lineTo','closePath','rect','ellipse','arc','quadraticCurveTo','bezierCurveTo','roundRect','clip','fill','stroke','fillRect','clearRect','drawImage','fillText','measureText','createRadialGradient','createLinearGradient','scope'];
const cmds=[];const grad=()=>({addColorStop(){}});
const ctx={commands:cmds};for(const m of ALLOWED)ctx[m]=function(...a){if(['fill','stroke','fillRect','fillText','drawImage'].includes(m))cmds.push(m);if(m==='createRadialGradient'||m==='createLinearGradient')return grad();if(m==='measureText')return{width:10};if(m==='scope')return a[1]();if(m==='point')return[0,0];};
const ctxProxy=new Proxy(ctx,{get(t,k){if(k in t)return t[k];if(typeof k==='string'&&/^[a-z][A-Za-z]+$/.test(k)&&!['fillStyle','strokeStyle','lineWidth','lineCap','lineJoin','globalAlpha','font','textAlign','textBaseline','globalCompositeOperation','then'].includes(k))throw new TypeError('ctx.'+k+' is not a function (not in the renderer)');return undefined;},set(t,k,v){t[k]=v;return true;}});
Object.assign(sb,{ctx:ctxProxy,TILE:34,zoom:1,W:1280,H:800,time:10,started:true,layer:'DREAM',modal:false,storyScene:null,loading:false,settings:{lowFx:false},
 project:(x,y)=>({x:(x-y-sb.cam.x+sb.cam.y)*34+640,y:(x+y-sb.cam.x-sb.cam.y)*17+416}),cam:{x:0,y:0},player:{x:0,y:0},room:null,
 shadow(){cmds.push('shadow');}});
const baseProps=[];sb.drawProp=function(p){baseProps.push(p.id);};sb.drawExits=function(){};sb.showSettings=function(){};
vm.runInContext(fs.readFileSync(path.join(SRC,'samong-mood-r123.js'),'utf8'),sb,{filename:'samong-mood-r123.js'});
const M=sb.__STORYWORLD_MOOD_R123__,Z=sb.__STORYWORLD_SAMONG_ZONES_R115__,TX=sb.__STORYWORLD_SAMONG_TEXT_R103__.sections;
check('module loads',!!(M&&Z&&TX));
const ids=Object.values(Z.chapters).flatMap(l=>l.map(z=>z.id)).filter(id=>id.startsWith('sz115-S06-'));
const T=Object.fromEntries(ids.map(id=>[id,M.themeOf(id)]));
const bySec={};for(const id of ids){const t=T[id];if(t?.sec)(bySec[t.sec]=bySec[t.sec]||[]).push(t.ns);}
const want={'DYS-01':'2037','DYS-02':'2037','DYS-03':'2037','DYS-04':'2037','DYS-05':'2037','DYS-06':'2038','DYS-07':'2038','DYS-08':'2038','DYS-09':'2037','DYS-10':'2037','DYS-11':'2037','DYS-12':'2019','DYS-13':'????'};
check('23 S-06 zones cover DYS-01~13',ids.length===23&&Object.keys(want).every(k=>bySec[k]?.length),Object.keys(bySec).join(','));
// 정상 경로: 사용자가 본 DYS-05 배너
check('DYS-05 (몽세의 유리 감옥) banner shows 2037년, not the section number',T['sz115-S06-7'].ns?.year==='2037',JSON.stringify(T['sz115-S06-7'].ns));
check('DYS-05 label keeps the canon section title',T['sz115-S06-7'].ns?.label==='보호라는 이름의 지배',T['sz115-S06-7'].ns?.label);
// 전 구간: 모든 구역이 연도를 갖는다(배너가 DYS-xx 로 멈추지 않음)
const bad=Object.entries(bySec).filter(([k,l])=>l.some(ns=>ns?.year!==want[k]));
check('every DYS section shows its story year',bad.length===0,JSON.stringify(bad));
check('no banner falls back to the DYS-xx number',ids.every(id=>T[id].ns&&T[id].ns.year&&!/DYS/.test(T[id].ns.year)&&T[id].ns.noYear===false));
// 경계: 연도 흐름 — 침공~지배 같은 해, 반란 다음 해, 사흘 전 도약은 되돌아감(뒤로 감기 효과), 스무 살 원룸은 침공보다 18년 전, 마지막은 기록 밖
const seq=ids.map(id=>T[id].ns.year);
check('years never go forward past 2038 and the 2038 stretch is contiguous (DYS-06~08)',seq.filter(y=>y==='2038').length===6&&seq.indexOf('2038')===7&&seq.lastIndexOf('2038')===12,seq.join(' '));
check('time-jump back: DYS-09 earlier than DYS-08, DYS-12 earlier than DYS-11',+want['DYS-09']<+want['DYS-08']&&+want['DYS-12']<+want['DYS-11']);
check('DYS-13 (기록이 끝난 자리) shows an unreadable year ????',T['sz115-S06-23'].ns.year==='????'&&T['sz115-S06-23'].ns.label==='기록이 끝난 자리');
// 회귀: 원문 제목은 그대로(서사 불변), 네오 서울식 제목 연도 읽기는 그대로, 다른 장은 연도 없음
check('canon section titles unchanged',TX['DYS-05'].title==='[DYS-05] 보호라는 이름의 지배'&&TX['DYS-01'].title==='[DYS-01] 침공');
check('non-S06 zones carry no year banner',Object.values(Z.chapters).flatMap(l=>l.map(z=>z.id)).filter(id=>!id.startsWith('sz115-S06-')).every(id=>!M.themeOf(id)?.ns));
const src=fs.readFileSync(path.join(SRC,'samong-mood-r123.js'),'utf8');
check('banner fallback (DYS number / 연도 없음) kept for unknown sections',/target=b\.year\|\|\(b\.dys\?b\.dys:'연도 없음'\)/.test(src));
check('year table lives in nsInfo with an R1208 note',/R1208/.test(src)&&/DYS_YEAR/.test(src));
check('runtime-text copy matches client-source',fs.readFileSync(path.join(RT,'samong-mood-r123.js'),'utf8')===src);
const ci=fs.readFileSync(path.join(REPO,'.github','workflows','pages.yml'),'utf8');
check('CI runs this check',ci.includes('r96/qa/r1208/r1208-cpu-check.cjs'));
console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);
