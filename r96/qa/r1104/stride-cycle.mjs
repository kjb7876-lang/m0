// R1104: 걸음 한 주기를 원본 크기 그림으로 펼쳐 본다(오버레이 계산 그대로 → 캔버스 아핀 그리기). 수묵 변환 전 원본 base-1 기준.
import {chromium} from '../r444/lib.mjs';import fs from 'fs';import vm from 'vm';
const SRC=fs.readFileSync('r96/client-source/persona-stride-r1104.js','utf8');
const persona={persona:true,hp:1,x:10,y:10};let seen=null;const proto={render(f){seen=f.commands;}};
const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,console,time:0,room:{enemies:[persona]},setInterval:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},localStorage:{getItem:()=>null,setItem(){}}};
C.window=C;vm.createContext(C);vm.runInContext(SRC,C);
const H=400,W=344,frames=[];
for(let i=0;i<120;i++){C.time+=1/60;persona.x+=2.4/60;persona.y-=0;proto.render.call({}, {commands:[{kind:'image',owner:{kind:'enemy'},sourcePath:'assets/rc133/art/base-1.png',sourceRect:[0,0,W,H],imageSize:[W,H],points:[[40,40],[40+W,40],[40+W,40+H],[40,40+H]],style:{}}]});
 if(i>=60&&i%5===0)frames.push(seen.map(c=>({sr:c.sourceRect,pts:c.points})));}
const img='data:image/png;base64,'+fs.readFileSync('r96/hospital-three-pc/site/assets/rc133/art/base-1.png').toString('base64');
const b=await chromium.launch();const p=await b.newPage({viewport:{width:430*6,height:500*2}});
await p.setContent(`<canvas id=c width=${430*6} height=${500*2} style="background:#2a2420"></canvas><img id=i src="${img}">`);
await p.waitForFunction(()=>document.getElementById('i').complete);
await p.evaluate(frames=>{const cv=document.getElementById('c'),x=cv.getContext('2d'),im=document.getElementById('i');x.fillStyle='#2a2420';x.fillRect(0,0,cv.width,cv.height);
 frames.slice(0,12).forEach((f,k)=>{const ox=(k%6)*430,oy=Math.floor(k/6)*500;x.strokeStyle='#555';x.beginPath();x.moveTo(ox,oy+440);x.lineTo(ox+430,oy+440);x.stroke();
  for(const c of f){const [a,b,,d]=c.pts,[sx,sy,sw,sh]=c.sr;x.save();x.setTransform((b[0]-a[0])/sw,(b[1]-a[1])/sw,(d[0]-a[0])/sh,(d[1]-a[1])/sh,ox+a[0],oy+a[1]);x.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);x.restore();}});},frames);
await p.locator('#c').screenshot({path:'r96/qa/r1104/stride-cycle.png'});await b.close();console.log('frames',frames.length);
