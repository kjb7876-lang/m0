// R492 CPU check: 렉 개선 — R409 테두리 굽기를 drawImage 수십 번 불리기 대신 거리 변환(EDT) 한 번으로(모양·색·두께·여백 그대로, 더 빠름)
//  ① 거리 변환이 무차별 계산과 같다(무작위 가림판·빈 줄·가장자리)  ② 새 굽기 결과 = 예전 굽기 결과(같은 모의 캔버스, 알파 평균 차 작음)
//  ③ 테두리 규칙: 몸까지 거리 ≤ r → 바깥 테, ≤ ri → 안쪽 선 색, r+1 밖은 투명, 몸 픽셀은 원본 그대로, 크기 = 칸+여백×2
//  ④ R440 환도 칼날: 칼날 둘레는 바깥 색 테 없이 가는 안쪽 선만  ⑤ 속도: 256×320 r=8 한 장 굽기 예산  ⑥ 끄기(fastBake:false) = 예전 길
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),F='combat-read-r409.js';
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=fs.readFileSync(process.env.R492_SRC||path.join(R,'client-source',F),'utf8');
ok(F+' runtime copy matches',fs.readFileSync(path.join(RT,F),'utf8')===src);
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
ok(F+' runtime-manifest hash matches',M.get(F)===crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,F))).digest('hex'));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r492/r492-cpu-check.cjs'));
// ── 모의 2D 캔버스(정수 좌표 복사·source-over·source-in 채우기 — 예전 불리기 길도 돌 수 있을 만큼)
function parse(c){const m=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(String(c).replace(/\s/g,''));return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:[0,0,0,1];}
class Ctx{constructor(c){this.c=c;this.globalAlpha=1;this.globalCompositeOperation='source-over';this.fillStyle='#000';}
 getImageData(x,y,w,h){const d=new Uint8ClampedArray(w*h*4),P=this.c.px,W=this.c.width;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const s=((y+j)*W+x+i)*4,t=(j*w+i)*4;for(let k=0;k<4;k++)d[t+k]=P[s+k]||0;}return {data:d,width:w,height:h};}
 createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4),width:w,height:h};}
 putImageData(img,x,y){const P=this.c.px,W=this.c.width;for(let j=0;j<img.height;j++)for(let i=0;i<img.width;i++){const s=(j*img.width+i)*4,t=((y+j)*W+x+i)*4;for(let k=0;k<4;k++)P[t+k]=img.data[s+k];}}
 drawImage(im,...a){let sx=0,sy=0,sw=im.width,sh=im.height,dx,dy;if(a.length>=8){[sx,sy,sw,sh,dx,dy]=a;}else{[dx,dy]=a;}dx=Math.round(dx);dy=Math.round(dy);const S=im.px,SW=im.width,P=this.c.px,W=this.c.width,H=this.c.height;
  for(let j=0;j<sh;j++)for(let i=0;i<sw;i++){const X=dx+i,Y=dy+j;if(X<0||Y<0||X>=W||Y>=H)continue;const s=((sy+j)*SW+sx+i)*4,t=(Y*W+X)*4,a1=(S[s+3]/255)*this.globalAlpha;if(a1<=0)continue;const a0=P[t+3]/255,A=a1+a0*(1-a1);
   for(let k=0;k<3;k++)P[t+k]=Math.round((S[s+k]*a1+P[t+k]*a0*(1-a1))/A);P[t+3]=Math.round(A*255);}}
 fillRect(x,y,w,h){const [r,g,b,a]=parse(this.fillStyle),P=this.c.px;for(let i=0;i<P.length;i+=4){if(this.globalCompositeOperation==='source-in'){if(!P[i+3])continue;P[i]=r;P[i+1]=g;P[i+2]=b;P[i+3]=Math.round(P[i+3]*a);}else{P[i]=r;P[i+1]=g;P[i+2]=b;P[i+3]=Math.round(a*255);}}}}
class Canvas{constructor(){this._w=0;this._h=0;this.px=new Uint8ClampedArray(0);}set width(v){this._w=v;this.px=new Uint8ClampedArray(this._w*this._h*4);}get width(){return this._w;}set height(v){this._h=v;this.px=new Uint8ClampedArray(this._w*this._h*4);}get height(){return this._h;}getContext(){return this.ctx||(this.ctx=new Ctx(this));}}
function sprite(w,h,paint){const c=new Canvas();c.width=w;c.height=h;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=paint(x,y);if(v){const i=(y*w+x)*4;c.px[i]=v[0];c.px[i+1]=v[1];c.px[i+2]=v[2];c.px[i+3]=v[3];}}return c;}
function mk(store={},hero='slayer'){const ctx={console,performance,setInterval:()=>0,
  document:{createElement:()=>new Canvas()},player:{hero}};ctx.window=ctx;ctx.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}};
 ctx.window.__STORYWORLD_HERO_PALETTE_R302__={palette:{hwando:{main:[200,200,210],sub:[230,190,90]},slayer:{main:[190,30,40],sub:[226,232,242]}}};vm.createContext(ctx);vm.runInContext(src,ctx,{filename:F});return ctx;}
const ctx=mk(),A=ctx.__STORYWORLD_COMBAT_READ_R409__;
ok('api exposes distanceField and bakeRaw',typeof A.distanceField==='function'&&typeof A.bakeRaw==='function');
if(typeof A.distanceField==='function'&&typeof A.bakeRaw==='function'){
 // ① 거리 변환 = 무차별
 let worst=0,seed=7;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
 for(const [sw,sh,pad,p] of [[13,9,4,.08],[1,1,3,1],[20,3,6,.3],[7,17,0,.02],[16,16,5,0.004]]){const Mk=new Uint8Array(sw*sh);for(let i=0;i<Mk.length;i++)Mk[i]=rnd()<p?1:0;if(!Mk.some(v=>v))Mk[Math.floor(Mk.length/2)]=1;
  const W=sw+2*pad,H=sh+2*pad,D=A.distanceField(Mk,sw,sh,W,H,pad);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let b=Infinity;for(let j=0;j<sh;j++)for(let i=0;i<sw;i++)if(Mk[j*sw+i])b=Math.min(b,Math.hypot(x-pad-i,y-pad-j));worst=Math.max(worst,Math.abs(D[y*W+x]-b));}}
 ok('distanceField equals brute-force Euclidean distance (random masks, 1×1, thin strips, pad 0)',worst<1e-6,{worst});
 // ② 예전 굽기와 같은 모양 — 원·막대·고리 모양 적 그림, r 2·6·11
 const body=(x,y)=>{const d=Math.hypot(x-40,y-50);return d<22||(x>38&&x<44&&y>10&&y<95)||(Math.abs(d-32)<2&&y>50)?[150,120,90,255]:null;};
 const sp=sprite(90,100,body);const cmp=[];
 for(const r of [2,6,11]){const o=A.bakeRaw(sp,0,0,90,100,r,'enemy','old'),n=A.bakeRaw(sp,0,0,90,100,r,'enemy','fast');
  const a=o.canvas.px,b=n.canvas.px;let s=0,big=0;for(let i=3;i<a.length;i+=4){const d=Math.abs(a[i]-b[i]);s+=d;if(d>96)big++;}cmp.push({r,size:[n.canvas.width,n.canvas.height],sameSize:o.canvas.width===n.canvas.width&&o.canvas.height===n.canvas.height,mean:+(s/(a.length/4)).toFixed(2),bigPct:+(100*big/(a.length/4)).toFixed(2)});}
 ok('fast bake matches old bake (same size, mean |Δalpha| < 6/255, <3% pixels differ by >96)',cmp.every(c=>c.sameSize&&c.mean<6&&c.bigPct<3),cmp);
 // ③ 테두리 규칙(새 길)
 {const r=6,ri=Math.max(1,Math.round(r*.45)),n=A.bakeRaw(sp,0,0,90,100,r,'enemy','fast'),P=n.canvas.px,W=n.canvas.width,pad=n.pad;const Mk=new Uint8Array(90*100);for(let y=0;y<100;y++)for(let x=0;x<90;x++)Mk[y*90+x]=body(x,y)?1:0;
  const D=A.distanceField(Mk,90,100,W,n.canvas.height,pad);let bad={outer:0,inner:0,outside:0,bodyPx:0};const O=[170,22,26,.62],I=[14,4,6,.92];
  for(let j=0;j<D.length;j++){const d=D[j],i=j*4;if(d===0){const x=j%W-pad,y=Math.floor(j/W)-pad;if(P[i]!==150||P[i+1]!==120||P[i+3]!==255)bad.bodyPx++;}
   else if(d>r+.5){if(P[i+3]!==0)bad.outside++;}else if(d<=ri-.5){const ai=I[3],ao=O[3],Aa=ai+ao*(1-ai),cr=(I[0]*ai+O[0]*ao*(1-ai))/Aa;if(Math.abs(P[i]-cr)>2||Math.abs(P[i+3]-Math.round(Aa*255))>2)bad.inner++;}
   else if(d>ri+.5&&d<=r-.5){if(Math.abs(P[i]-O[0])>2||Math.abs(P[i+3]-Math.round(O[3]*255))>2)bad.outer++;}}
  ok('outline rule: body kept, inner line colour, outer rim colour/alpha, transparent beyond r',!bad.outer&&!bad.inner&&!bad.outside&&!bad.bodyPx,bad);
  ok('baked size = cell + 2×pad (pad = r+1)',W===90+2*(r+1)&&n.canvas.height===100+2*(r+1)&&n.pad===r+1);}
 ok('tiny shapes (≤12 px body) skipped as before',A.bakeRaw(sprite(20,20,(x,y)=>x<3&&y<3?[1,1,1,255]:null),0,0,20,20,4,'enemy','fast')===null);
 // ④ 환도 칼날: 가는 무채색 막대 → 바깥 색 테 없음
 {const h=mk({},'hwando'),B=h.__STORYWORLD_COMBAT_READ_R409__;const hs=sprite(80,120,(x,y)=>{if(Math.hypot(x-30,y-70)<22)return [190,160,120,255];if(x>=52&&x<=53&&y>=20&&y<=60)return [180,182,184,255];return null;});
  const n=B.bakeRaw(hs,0,0,80,120,6,'hero','fast'),P=n.canvas.px,W=n.canvas.width,pad=n.pad;const at=(x,y)=>{const i=((y+pad)*W+x+pad)*4;return [P[i],P[i+1],P[i+2],P[i+3]];};
  const side=at(55,40),body=at(30,70-22-3);
  ok('R440 blade: rim beside the blade is the thin dark line (no coloured outer rim), body still gets the hero rim',side[3]>0&&side[0]<40&&side[3]<=Math.round(.88*.75*255)+2&&body[3]>0&&body[0]>100,{side,body,blade:h.__STORYWORLD_COMBAT_READ_R409__.inspect().stats.bladeCut});}
 // ⑤ 속도: vm 영역은 전역 조회(Math 등)가 느려 브라우저와 다르다 → 이 프로세스 영역에서 한 벌 더 띄워 잰다
 {const G=globalThis,keep={};for(const k of ['window','document','localStorage','player'])keep[k]=G[k];
  G.window=G;G.document={createElement:()=>new Canvas()};G.localStorage={getItem:()=>null,setItem(){}};G.player={hero:'slayer'};delete G.__STORYWORLD_COMBAT_READ_R409__;
  const si=G.setInterval;G.setInterval=()=>0;try{vm.runInThisContext(src,{filename:F});}finally{G.setInterval=si;}const B=G.__STORYWORLD_COMBAT_READ_R409__;
  const big=sprite(256,320,(x,y)=>Math.hypot((x-128)/90,(y-170)/140)<1||(x>120&&x<136&&y>8&&y<60)?[90,90,90,255]:null);const Mk=new Uint8Array(256*320);for(let i=0;i<Mk.length;i++)Mk[i]=big.px[i*4+3]>115?1:0;
  B.distanceField(Mk,256,320,274,338,9);let df=1e9;for(let i=0;i<5;i++){const t=performance.now();B.distanceField(Mk,256,320,274,338,9);df=Math.min(df,performance.now()-t);}
  const tm=mode=>{let best=1e9;for(let i=0;i<3;i++){const t=performance.now();B.bakeRaw(big,0,0,256,320,8,'enemy',mode);best=Math.min(best,performance.now()-t);}return best;};const fo=tm('fast'),oo=tm('old');
  ok('distance transform 274×338 under 8 ms (node, same realm)',df<8,{ms:+df.toFixed(2)});ok('fast bake ≥3× faster than old dilation on the same canvas',oo/fo>=3,{fast:+fo.toFixed(1),old:+oo.toFixed(1)});
  delete G.__STORYWORLD_COMBAT_READ_R409__;for(const k in keep)if(keep[k]===undefined)delete G[k];else G[k]=keep[k];}
 // ⑥ 끄기
 {const store={};const c=mk(store);c.__STORYWORLD_COMBAT_READ_R409__.set({fastBake:false});ok('set({fastBake:false}) persists',JSON.parse(store['storyworld.r409.combatRead']).fastBake===false);
  const c2=mk({'storyworld.r409.combatRead':'{"fastBake":false}'}),B=c2.__STORYWORLD_COMBAT_READ_R409__;B.bake(sp,0,0,90,100,6,'enemy');ok('fastBake:false → old drawImage dilation path',!B.inspect().stats.fastBaked&&B.inspect().stats.baked===1);
  A.bake(sp,0,0,90,100,6,'enemy');ok('default bake() uses the fast path',A.inspect().stats.fastBaked>=1);}
 ok('no errors recorded',A.inspect().stats.errors===0,A.inspect().lastError);}
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.detail===undefined?'':' '+JSON.stringify(c.detail)));
console.log(JSON.stringify({check:'r492',total:checks.length,failed:fail.length}));if(fail.length)process.exit(1);
