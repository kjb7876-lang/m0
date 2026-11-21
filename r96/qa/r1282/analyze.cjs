// 뽑은 지도(layouts-*.json)에 deadEnds 를 돌려 맵마다 막다른 방 수·자리를 본다. node analyze.cjs layouts-story.json [ascii 맵id]
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','..','client-source','corner-chests-r1282.js'),'utf8');
const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,localStorage:{getItem:()=>null,setItem(){}}};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);
const A=sb.__STORYWORLD_CORNER_CHESTS_R1282__;const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const show=process.argv[3];
for(const [k,m] of Object.entries(data)){const cells=m.cells?m.cells.split(' ').map(s=>s.split(',').map(Number)):[];
 const avoid=[m.entry,m.objective,m.altar,...(m.doors||[])].filter(Boolean);const t=Date.now();const R=+(process.env.R||3);const nodes=(m.nodes||[]).map(n=>({id:n.id,x:n.x,y:n.y,width:n.w,depth:n.d,name:n.name,storyMapR171:n.k,bossCoreR78:n.boss,closetR179:n.closet}));const g=process.env.GRID?{}:{nodes,edges:m.edges};const d=A.deadEnds(cells,{avoid,entry:m.entry,radius:R,...g});const all=A.deadEnds(cells,{avoid:[],max:99,radius:R,...g});
 console.log(k.padEnd(10),String(cells.length).padStart(5),'막다른방',d.length,'(제외전',all.length+')',Date.now()-t+'ms',d.map(s=>`(${s.x},${s.y}) ${s.cells}칸 깊이${s.depth}`).join(' | '));
 if(show===k){const S=new Set(cells.map(c=>c+''));let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[x,y]of cells){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const ch=new Set(d.map(s=>Math.floor(s.x)+','+Math.floor(s.y))),av=new Set(avoid.map(p=>Math.floor(p.x)+','+Math.floor(p.y)));
  for(let y=y0;y<=y1;y++){let row='';for(let x=x0;x<=x1;x++){const kk=x+','+y;row+=ch.has(kk)?'C':av.has(kk)?'X':S.has(kk)?'.':' ';}console.log(row);}}}
