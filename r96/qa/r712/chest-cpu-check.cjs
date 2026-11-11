// R712 — 보물상자 그림을 CC0 픽셀 3D 소품(codepawl/pixel-atlas-glb, treasure_chest)을 게임 등각 시점으로 미리 렌더한 그림으로 바꾼다
//  (사용자 2026-11-11 02:44Z "허깅페이스 codepawl/pixel-atlas-glb … 검토개선 적용").
//  원래 SVG(정면 그림, 등각 바닥과 시점이 안 맞음)는 지우지 않고 남겨 둔다. 이 검사는 정적·CPU 만 본다(그래픽은 따로 헤드리스 캡처).
const fs=require('fs'),path=require('path'),vm=require('vm'),zlib=require('zlib');const R=path.join(__dirname,'..','..');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const src=fs.readFileSync(path.join(R,'client-source','growth-r103.js'),'utf8');
const rt=fs.readFileSync(path.join(R,'runtime-text','growth-r103.js'),'utf8');
const NEW={closed:'assets/r712/chest-closed.png',open:'assets/r712/chest-open.png'},OLD={closed:'assets/r103/chest-closed.svg',open:'assets/r103/chest-open.svg'};
// ---- PNG 읽기(zlib 만으로, RGBA 8비트) ----
function png(file){const b=fs.readFileSync(file);if(b.readUInt32BE(0)!==0x89504e47)throw new Error('not png');let o=8,w,h,ct,bd,idat=[];
 while(o<b.length){const len=b.readUInt32BE(o),type=b.toString('ascii',o+4,o+8),d=b.slice(o+8,o+8+len);if(type==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);bd=d[8];ct=d[9];}if(type==='IDAT')idat.push(d);o+=12+len;}
 if(ct!==6||bd!==8)throw new Error('need RGBA8, got ct='+ct+' bd='+bd);const raw=zlib.inflateSync(Buffer.concat(idat)),bpp=4,stride=w*bpp,px=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++){const f=raw[y*(stride+1)],line=raw.slice(y*(stride+1)+1,(y+1)*(stride+1)),prev=y?px.slice((y-1)*stride,y*stride):Buffer.alloc(stride);
  for(let x=0;x<stride;x++){const a=x>=bpp?px[y*stride+x-bpp]:0,up=prev[x],c=x>=bpp?prev[x-bpp]:0;let v=line[x];
   if(f===1)v+=a;else if(f===2)v+=up;else if(f===3)v+=(a+up)>>1;else if(f===4){const p=a+up-c,pa=Math.abs(p-a),pb=Math.abs(p-up),pc=Math.abs(p-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?up:c;}px[y*stride+x]=v&255;}}
 return{w,h,px,bytes:b.length};}
function stats(im){let op=0,edgeOp=0,lum=0,sat=0,minY=im.h,maxY=-1;for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++){const i=(y*im.w+x)*4,a=im.px[i+3];if(x===0||y===0||x===im.w-1||y===im.h-1){if(a>8)edgeOp++;}
  if(a>128){op++;const r=im.px[i],g=im.px[i+1],b=im.px[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);lum+=.2126*r+.7152*g+.0722*b;sat+=mx?(mx-mn)/mx:0;minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
 return{cover:op/(im.w*im.h),edgeOp,lum:lum/Math.max(1,op),sat:sat/Math.max(1,op),bottomGap:im.h-1-maxY,topGap:minY};}
// ① 코드가 새 그림을 가리킨다(원본·런타임 사본 모두)
ok('client-source ASSET.closed = 새 그림',src.includes(`closed:'${NEW.closed}'`));
ok('client-source ASSET.open = 새 그림',src.includes(`open:'${NEW.open}'`));
ok('runtime-text 사본이 client-source 와 같다',rt===src);
ok('옛 SVG 경로를 더는 코드에서 쓰지 않는다',!src.includes(OLD.closed)&&!src.includes(OLD.open));
// ② 원본 보존: 옛 SVG 는 지우지 않는다
for(const k of['closed','open'])ok('옛 SVG 보존 '+k,fs.existsSync(path.join(R,'runtime-text',OLD[k])));
// ③ 새 그림: 존재·형식·크기·투명 배경·바닥에 붙음
const im={};for(const k of['closed','open']){const f=path.join(R,'runtime-text',NEW[k]);const ex=fs.existsSync(f);ok('새 그림 있음 '+k,ex,f);if(!ex)continue;
 let p;try{p=png(f);}catch(e){ok('PNG RGBA 읽힘 '+k,false,String(e));continue;}im[k]=p;const s=stats(p);p.s=s;
 ok('크기 96~512px '+k,p.w>=96&&p.w<=512&&p.h>=96&&p.h<=512,{w:p.w,h:p.h});
 ok('파일 60KB 이하(렉·Pages 예산) '+k,p.bytes<=60000,p.bytes);
 ok('가장자리 투명(배경 없음) '+k,s.edgeOp===0,s.edgeOp);
 ok('그림이 칸의 25~85% 를 채움 '+k,s.cover>=.25&&s.cover<=.85,s.cover);
 ok('바닥 여백 2px 이하(엔진이 아래 가운데를 바닥에 놓음) '+k,s.bottomGap<=2,s.bottomGap);
 ok('위 여백 2px 이하(높이 값이 그림 높이와 같게) '+k,s.topGap<=2,s.topGap);
 ok('어두운 고딕 톤: 평균 밝기 40~140 '+k,s.lum>=40&&s.lum<=140,s.lum);
 ok('채도 과하지 않음(평균 ≤ .80) '+k,s.sat<=.80,s.sat);}
if(im.closed&&im.open){ok('열린 상자와 닫힌 상자가 다른 그림',!im.closed.px.equals(im.open.px));
 const ar=im.closed.w/im.closed.h;ok('닫힌 상자 가로세로비 0.9~1.6',ar>=.9&&ar<=1.6,ar);
 ok('열린 그림 픽셀 높이가 닫힌 그림보다 큼(뚜껑이 섬)',im.open.h>im.closed.h*1.15,{c:im.closed.h,o:im.open.h});
 const m=/CHEST_H=\{closed:(\d+(?:\.\d+)?),open:(\d+(?:\.\d+)?)\}/.exec(src);ok('CHEST_H 높이 비가 그림 픽셀 높이 비와 3% 안(몸통 크기가 열고 닫을 때 같음)',m&&Math.abs((+m[2]/+m[1])/(im.open.h/im.closed.h)-1)<=.03,{code:m&&+m[2]/+m[1],px:im.open.h/im.closed.h});}
// ④ 출처·라이선스 기록
const lic=path.join(R,'runtime-text','assets','r712','SOURCE.md');const lt=fs.existsSync(lic)?fs.readFileSync(lic,'utf8'):'';
ok('출처 기록 파일',!!lt);ok('CC0 명시',/CC0/.test(lt));ok('원 데이터셋 URL',lt.includes('huggingface.co/datasets/codepawl/pixel-atlas-glb'));ok('원작자 Angais 표기',lt.includes('Angais'));
ok('AI 생성(Krea) 출처 고지',/Krea/.test(lt));
// ⑤ 매니페스트: 새 그림이 런타임 목록에 들어 있다
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));const inMan=p=>man.files.some(r=>r.path===p);
for(const k of['closed','open'])ok('매니페스트에 '+k,inMan(NEW[k]));
// ⑥ 실제 동작: 상자를 만들고 연다(closed → open, 다시 열기 거부)
(function(){const toasts=[];const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Date,
  localStorage:{getItem:()=>null,setItem(){}},toast:(t)=>toasts.push(t),layer:'STORY',player:{points:0,hero:'hwando',hp:10},room:{id:'ep1a02',props:[]},regionById:{},
  interact(){},drawProp(){},tick(){},updateHUD(){},saveGame(){},sound(){},project:()=>({x:0,y:0}),openPanel(){},closePanel(){},document:{getElementById:()=>null,addEventListener(){},createElement:()=>({style:{},appendChild(){}})},addEventListener(){}};
 sb.window=sb;vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){ok('growth-r103 실행',false,String(e).slice(0,200));return;}
 const G=sb.__STORYWORLD_GROWTH_R103__;if(!G){ok('growth-r103 API',false,'no api');return;}
 const c=G.chestProp('STORY:t1',{x:3,y:4});ok('새 상자는 닫힌 새 그림',c.path===NEW.closed,c.path);ok('상자 높이 값이 양수',c.height>0,c.height);
 let opened=false;try{opened=G.openChest(c);}catch(e){ok('openChest 실행',false,String(e).slice(0,200));}
 ok('연 상자는 열린 새 그림',c.path===NEW.open,c.path);ok('같은 상자 다시 열기 거부',!G.openChest(c));
 const c2=G.chestProp('STORY:t1',{x:3,y:4});ok('이미 연 상자를 다시 만들면 열린 그림(재입장·불러오기)',c2.path===NEW.open,c2.path);
 ok('열린 상자·닫힌 상자 높이 비율이 그림 비율을 따름(열린 쪽이 더 큼)',c2.height>=c.height-1e-9,{closed:G.chestProp('STORY:t9',{x:0,y:0}).height,open:c2.height});})();
const bad=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R712 chest: ${checks.length-bad.length}/${checks.length}`);process.exit(bad.length?1:0);
