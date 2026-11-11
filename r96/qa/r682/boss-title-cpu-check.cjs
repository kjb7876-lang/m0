// R682 — 보스 구역 들어가기 전 '보스 이름' 연출 새 디자인(사용자 2026-11-11 00:26Z "보스 이름나오고 지그재그빨간선나오는거 너무 디자인구려서 … 닷츠컷신에 맞게 새디자인").
//  R255 의 2.4초 연출(붉은 먹 얼룩 + 사인 곡선 지그재그 붉은 금 + #ff6a6a 이름)을 R568 컷신 결(검은 띠·금빛 #c9a46a·상아색 세리프·검붉은 그늘·잿불)에 맞춘 이름 카드로 바꾼다.
//  이 검사는 그림 명령을 기록하는 가짜 2D 문맥으로 연출 전체(0~끝)를 돌려 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(R,'client-source','story-fragments-r255.js'),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
// ---- 기록하는 2D 문맥 ----
function ctx2d(owner,log){const st={fillStyle:'#000',strokeStyle:'#000',globalAlpha:1,font:'10px serif',lineWidth:1,shadowBlur:0,shadowColor:'',globalCompositeOperation:'source-over',textAlign:'left',textBaseline:'alphabetic',filter:'none',letterSpacing:'0px'};
 const stack=[];let path=[];let tf=[1,0,0,1,0,0];
 const rec=(op,extra={})=>log.push({op,owner,fill:st.fillStyle,stroke:st.strokeStyle,alpha:st.globalAlpha,font:st.font,comp:st.globalCompositeOperation,tf:[...tf],...extra});
 const grad=()=>({stops:[],addColorStop(o,c){this.stops.push([o,c]);}});
 const g={...st,canvas:owner,
  save(){stack.push({...g,tf:[...tf]});},restore(){const s=stack.pop();if(s){for(const k of Object.keys(st))g[k]=s[k];tf=s.tf;}},
  setTransform(a,b,c,d,e,f){tf=[a,b,c,d,e,f];},translate(x,y){tf[4]+=x*tf[0];tf[5]+=y*tf[3];},scale(x,y){tf[0]*=x;tf[3]*=y;},rotate(){},
  clearRect(){},fillRect(x,y,w,h){rec('fillRect',{x,y,w,h,fill:g.fillStyle,alpha:g.globalAlpha});},
  beginPath(){path=[];},moveTo(x,y){path.push(['M',x,y]);},lineTo(x,y){path.push(['L',x,y]);},closePath(){path.push(['Z']);},arc(x,y,r){path.push(['A',x,y,r]);},ellipse(x,y,rx,ry){path.push(['E',x,y,rx,ry]);},rect(x,y,w,h){path.push(['R',x,y,w,h]);},quadraticCurveTo(a,b,x,y){path.push(['Q',x,y]);},bezierCurveTo(a,b,c,d,x,y){path.push(['C',x,y]);},
  fill(){rec('fill',{path:[...path],fill:g.fillStyle,alpha:g.globalAlpha});},stroke(){rec('stroke',{path:[...path],stroke:g.strokeStyle,alpha:g.globalAlpha,lw:g.lineWidth});},clip(){},
  fillText(t,x,y){rec('fillText',{text:String(t),x,y,fill:g.fillStyle,font:g.font,alpha:g.globalAlpha});},strokeText(t){rec('strokeText',{text:String(t)});},
  measureText(t){const m=/(\d+(?:\.\d+)?)px/.exec(g.font);const px=m?+m[1]:10;return{width:String(t).length*px*.95};},
  drawImage(img,...a){let x,y,w,h;if(a.length>=8){[x,y,w,h]=a.slice(4);}else if(a.length===4){[x,y,w,h]=a;}else{[x,y]=a;w=img.width;h=img.height;}rec('drawImage',{img,x:x*tf[0]+tf[4],y:y*tf[3]+tf[5],w:w*tf[0],h:h*tf[3],alpha:g.globalAlpha,comp:g.globalCompositeOperation});},
  createLinearGradient(){return grad();},createRadialGradient(){return grad();},getImageData(){return null;}};
 return new Proxy(g,{set(o,k,v){o[k]=v;return true;}});}
function mk({reduced=false,img=null,name='발록',W=1280,H=720}={}){const log=[],canv=[],keyL=[],raf=[];let now=0;
 const mkCanvas=()=>{const e={style:{},width:300,height:150,id:'',removed:false,remove(){this.removed=true;},onclick:null,_ctx:null,getContext(){return this._ctx||(this._ctx=ctx2d(this,log));}};canv.push(e);return e;};
 const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Proxy,
  localStorage:{getItem:()=>null,setItem(){}},window:{},
  addEventListener(t,f,o){keyL.push({t,f});},removeEventListener(t,f){const i=keyL.findIndex(k=>k.f===f);if(i>=0)keyL.splice(i,1);},
  matchMedia:q=>({matches:reduced&&/reduced-motion/.test(q)}),
  document:{getElementById:id=>id==='stage'?{}:null,createElement:t=>t==='canvas'?mkCanvas():{style:{},remove(){},className:'',textContent:''},head:{appendChild(){}},body:{appendChild(){}}},
  performance:{now:()=>now},requestAnimationFrame(f){raf.push(f);return raf.length;},devicePixelRatio:1,innerWidth:W,innerHeight:H,layer:'STORY',storyScene:null,
  readyImage:p=>p&&img?{image:img,crop:null}:null,ensureImages(){return null;},
  room:{enemies:[{boss:true,hp:5,name,path:'assets/x/boss.webp'}]},
  regionById:{dist06:{title:'지옥의 문',bosses:[{name:'발록'}]}},openPanel(){},closePanel(){},advanceScene(){}};
 sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);
 const step=ms=>{now+=ms;const q=raf.splice(0);for(const f of q)f(now);};
 return {sb,log,canv,keyL,step,raf,start(){sb.storyScene={id:'dist06',key:'STORY:dist06:pre:0',part:'pre',text:'x'};sb.advanceScene();}};}
const red=c=>{const m=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(String(c||''));if(m){const[r,g,b]=[1,2,3].map(i=>parseInt(m[i],16));return r>150&&r>g*2&&r>b*2;}const n=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(String(c||''));return n?(+n[1]>150&&+n[1]>2*+n[2]&&+n[1]>2*+n[3]):false;};
// ① 끝까지 돌려 보기
const T=mk({img:{width:400,height:600,naturalWidth:400,naturalHeight:600}});T.start();
const main=T.canv.find(c=>c.id==='r255Cinema');ok('연출 캔버스가 한 번 뜬다',!!main,{ids:T.canv.map(c=>c.id)});
let frames=0,maxOps=0,prev=0;for(let i=0;i<400&&T.raf.length;i++){T.step(16);frames++;const n=T.log.length-prev;prev=T.log.length;if(n>maxOps)maxOps=n;}
const on=T.log.filter(l=>l.owner===main);
ok('끝나면 저절로 닫힌다(약 3~4초)',main?.removed&&frames*16>=2800&&frames*16<=4400,{ms:frames*16,removed:main?.removed});
// ② 지그재그 붉은 선 없음
const zig=on.filter(l=>l.op==='stroke'&&l.path.filter(p=>p[0]==='L').length>=4);
ok('지그재그(꺾인 선 4마디 이상) 선을 긋지 않는다',zig.length===0,{n:zig.length});
ok('붉은 선·붉은 글자가 없다(빨강은 그늘에만, 선·글자는 금빛/상아)',!on.some(l=>(l.op==='stroke'&&red(l.stroke))||(l.op==='fillText'&&red(l.fill)))&&!T.log.some(l=>l.op==='fillText'&&red(l.fill)),null);
// ③ 금빛 장식선·상아 이름
const texts=T.log.filter(l=>l.op==='fillText');
const nameT=texts.find(l=>l.text==='발록'),regT=texts.find(l=>l.text.replace(/\s/g,'')==='지옥의문');
ok('보스 이름은 게임 데이터 그대로, 상아색 세리프',nameT&&/^#(ef|f[0-9a-f])[d-f]/i.test(nameT.fill)&&/serif/i.test(nameT.font),nameT&&{fill:nameT.fill,font:nameT.font});
ok('지역 이름은 금빛(#c9a46a)',regT&&/^#c9a46a/i.test(regT.fill),regT&&regT.fill);
const lines=on.filter(l=>(l.op==='fillRect'||l.op==='fill')&&l.fill&&typeof l.fill==='object');
ok('금빛 가는 장식선(그라데이션, 양끝 사라짐)이 있다',on.some(l=>l.op==='fillRect'&&typeof l.fill==='object'&&l.fill.stops?.some(s=>/201,\s*164,\s*106|#c9a46a/i.test(s[1]))&&l.h<=3&&l.w>200),null);
const vertical=on.filter(l=>l.op==='fillRect'&&l.w<=3&&l.h>12);
ok('십자가 모양(세로 막대)을 그리지 않는다',vertical.length===0,{n:vertical.length});
// ④ 글자는 미리 한 번만 그려 둔다(렉)
ok('글자는 미리 그린 그림을 쓴다(fillText 합계 ≤ 6)',texts.length<=6&&texts.length>=2,{n:texts.length});
ok('한 프레임 그리기 명령이 적다(≤ 90)',maxOps<=90,{maxOps});
// ⑤ 보스 그림자: 통째로 화면 안
const bossDraws=on.filter(l=>l.op==='drawImage'&&l.img&&l.img.__bossArt);
const W=1280,H=720;const inside=bossDraws.every(d=>d.x>=0&&d.y>=0&&d.x+d.w<=W+.5&&d.y+d.h<=H+.5);
ok('보스 그림(실루엣·빛 테두리)이 화면 안에 통째로 들어간다',bossDraws.length>0&&inside,{n:bossDraws.length,first:bossDraws[0]&&{x:bossDraws[0].x,y:bossDraws[0].y,w:bossDraws[0].w,h:bossDraws[0].h}});
// ⑥ 긴 이름도 화면 안
{const L=mk({name:'백의 안정화 감독 · 병동의 마지막 회진을 도는 자',W:390,H:844});L.start();for(let i=0;i<400&&L.raf.length;i++)L.step(16);
 const nt=L.log.find(l=>l.op==='fillText'&&/백의/.test(l.text));const px=nt?+/(\d+(?:\.\d+)?)px/.exec(nt.font)[1]:0;const w=nt?nt.text.length*px*.95:1e9;
 ok('긴 이름은 글자 크기를 줄여 좁은 화면(390px) 폭 안에 든다',nt&&w<=390*.9,{w,px});}
// ⑦ 건너뛰기: 누르기·Esc/Enter/Space
{const K=mk();K.start();const c=K.canv.find(x=>x.id==='r255Cinema');K.step(16);const kd=K.keyL.find(k=>k.t==='keydown');let stopped=false;
 kd&&kd.f({key:'Escape',preventDefault(){},stopPropagation(){stopped=true;},stopImmediatePropagation(){stopped=true;}});
 ok('Esc 로 건너뛴다(밑의 서사 창으로 키가 새지 않음)',c?.removed&&stopped,{removed:c?.removed,stopped,hasKey:!!kd});
 ok('건너뛰면 키 듣기를 떼어 낸다',!K.keyL.some(k=>k.t==='keydown'),{n:K.keyL.length});
 const K2=mk();K2.start();const c2=K2.canv.find(x=>x.id==='r255Cinema');K2.step(16);c2?.onclick?.();ok('누르면 건너뛴다',c2?.removed);}
// ⑧ 움직임 줄이기 설정
{const M=mk({reduced:true});M.start();let n=0;for(let i=0;i<400&&M.raf.length;i++){M.step(16);n++;}ok('움직임 줄이기 설정이면 짧게(≤ 2.2초)',n*16<=2200,{ms:n*16});}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R682 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
