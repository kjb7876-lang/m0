// R214·R215 CPU check: 큰 야외 맵 3곳 유기 지형 + 실내·현대·기계 맵 디테일 전용 모드(원래 지형·판정 유지, 바닥 장식만).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),src=fs.readFileSync(path.join(R,'client-source','cave-r204.js'),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('runtime copy matches',src===fs.readFileSync(path.join(R,'runtime-text','cave-r204.js'),'utf8'));
const block=src.slice(src.indexOf('const ZONES={'),src.indexOf('const R=4,M=8;'));
const zone=z=>{const i=block.indexOf('\n '+z+':{');if(i<0)return '';const j=block.indexOf('\n // ',i+1);return block.slice(i,j<0?undefined:j);};
for(const z of ['last301','hando01','hando02'])ok(z+' organic, widen:false, small bulge',/widen:false/.test(zone(z))&&+(/bulge:([\d.]+)/.exec(zone(z))||[])[1]<=.8,zone(z).slice(0,80));
// 디테일 전용
const decoIds=['ep1a08','ep1a09','ep1a10','ep1a11','ep1a09b','ep1b02','ep1b03','ep1b04','ep1b05','ep1b06','ep1b07','ep1b09','u201','u202','u203','u204','u205','u206','hando03','murder01','murder02','murder03','murder04','cult01','cult02','cult03','cult04','cult05','cult06'];
const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Int32Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,localStorage:{getItem:()=>null,setItem(){}},
 window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};vm.createContext(sb);
vm.runInContext(`var room=null,player={x:5.5,y:5.5};function blocked(){return false;}function makeRoom(id){return {id,layer:'STORY',props:[],enemies:[],exploration:{bounds:[0,0,10,10],floorCells:[],walls:[]}};}async function enterRegion(){return true;}`,sb);
vm.runInContext(src,sb);const API=sb.window.__STORYWORLD_CAVE_R204__;
ok('all interior/modern/machine regions registered as decor-only',decoIds.every(z=>API.zones.includes(z)),decoIds.filter(z=>!API.zones.includes(z)));
ok('decor-only zones keep native walls/floor (no veil, no hide, no floor-command filter)',/const deco=!!ZONES\[frame\.zone\]\?\.decorOnly;/.test(src)&&/const veil=\(\)=>\{if\(deco\)return;/.test(src)&&/if\(deco\)\{(heroUniform\(r,frame\);)?stats\.frames\+\+;return;\}/.test(src)/* R218: 실내 골격의 영웅 앞 투명 처리용 위치 갱신만 허용 */);
ok('decor-only zones never change collision or pathing',/if\(ZONES\[where\?\.id\]\?\.decorOnly\)return false;/.test(src));
{const b=src.slice(src.indexOf('function build(r,frame)'));const i=b.indexOf('if(cfg.decorOnly){const dm='),j=b.indexOf('bakeGround(');
 ok('decor-only build adds only the decal layer and returns before terrain textures/baking (Codex #136)',i>0&&j>i&&/mesh\.name='r215-decals'/.test(b)&&/want=cfg\.decorOnly\?\{crack:/.test(b),{i,j});}
ok('decor-only zones are not in the organic ZONES literal (modern maps keep right angles)',!decoIds.some(z=>new RegExp('\\n '+z+':\\{').test(block)));
const wf=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok('in the CI workflow',/qa\/r214\/r214-cpu-check\.cjs/.test(wf));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
