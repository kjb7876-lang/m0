// R1007 CPU 검사: 사몽 대면 구역의 진술·매듭 표식이 서로 겹치지 않는지(실제 모듈의 dress 로 배치).
//  버그: 표식 각도가 120° 고정이라 표식이 4개인 구역(S-04 14번째, M-1 미카엘라)은 0번과 3번이 같은 자리에 겹쳐
//  C 를 눌러도 3번(차례가 아님)이 잡혀 "진술은 차례대로" 만 나오고 진행이 막혔다(헤드리스 실제 입력 재현, qa/r1007/m1-input.mjs).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:()=>null,setItem(){}}};
sb.window=sb;vm.createContext(sb);
for(const f of ['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js','samong-r103.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
const Z=sb.__STORYWORLD_SAMONG_ZONES_R115__;
const zones=Object.values(Z.chapters).flat().filter(z=>z.solve&&(z.solve.statements||[]).length);
check('confront zones with statements found (>=10, incl. M-1 and a 4-statement zone)',zones.length>=10&&zones.some(z=>z.id==='sz115-M-1')&&zones.some(z=>z.solve.statements.length>=4),zones.map(z=>z.id+':'+z.solve.statements.length).join(','));
const MIN=2.4;// 상호작용 반경(2.7 안팎)보다 충분히 떨어져야 다른 표식이 잡히지 않는다
for(const z0 of zones){
 const dais={x:15,y:15};const r={id:'t',props:[],enemies:[],exploration:{samongR103:{dais},floorCells:[],entry:{x:15,y:27},exit:{x:15,y:3}}};
 const z={...z0,rooms:[],props:[],clues:[]};// 진술 표식만 본다(단서 배치는 방 정보가 필요)
 try{Z.dress(r,z,{});}catch(e){/* 배치 뒤 소품 흩기 단계가 빈 바닥에서 실패해도 진술 표식은 이미 놓였다 */}
 const st=r.props.filter(p=>p.r115Stmt!=null).sort((a,b)=>a.r115Stmt-b.r115Stmt);
 const N=z.solve.statements.length;let minD=Infinity,pair='';
 for(let i=0;i<st.length;i++)for(let j=i+1;j<st.length;j++){const d=Math.hypot(st[i].x-st[j].x,st[i].y-st[j].y);if(d<minD){minD=d;pair=i+'-'+j;}}
 const finite=st.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
 const ring=st.every(p=>Math.abs(Math.hypot(p.x-dais.x,p.y-dais.y)-5.6)<.05);
 check(z.id+' ('+N+' 표식) all placed, finite, on the dais ring',st.length===N&&finite&&ring,st.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)).join(' '));
 if(N>1)check(z.id+' 표식끼리 '+MIN+' 이상 떨어짐',minD>=MIN,'min '+minD.toFixed(3)+' ('+pair+')');
 check(z.id+' 0번 표식은 단상 위쪽(기존 자리 유지)',st[0]&&Math.abs(st[0].x-15)<.01&&Math.abs(st[0].y-(15-5.6))<.01);
}
const bad=results.filter(r=>!r.ok);console.log(JSON.stringify({total:results.length,failed:bad.length}));process.exit(bad.length?1:0);
