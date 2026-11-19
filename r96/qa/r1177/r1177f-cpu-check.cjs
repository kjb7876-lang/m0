// R1177f — 기억 지역 몹 타격(R169 pixelfx mob-memory, 원래 흑백 도트 육망성)을 Dots CX-0160MF(육망성 없이 먹 번짐·깨지는 조각)로, 모든 모드
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS '+m);};
for(const f of ['samong-pixel-art-r1177.js'])ok(C(f)===fs.readFileSync(path.join(root,'runtime-text',f),'utf8'),f+' runtime 사본 같음');
const spec=JSON.parse(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8')),man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8')));
for(const f of ['assets/r1177/mob-memory-dots-12.webp']){const b=fs.readFileSync(path.join(root,'runtime-text',f));ok(spec.textPaths.includes(f)&&man.includes(crypto.createHash('sha256').update(b).digest('hex')),f+' runtime inputs·매니페스트 해시');}
// ---- ② mob-memory ----
(async()=>{const meta=JSON.parse(fs.readFileSync(path.join(root,'runtime-text/assets/r163/pixelfx/index.json'),'utf8'));
 const drawn=[];const room={};const canvas=()=>{const c={width:0,height:0,getContext:()=>({drawImage(im){c.src=im.src;},getImageData:()=>({data:new Uint8ClampedArray(4)}),putImageData(){}})};return c;};
 const ctx={save(){},restore(){},translate(){},scale(){},globalAlpha:1,drawImage(im){drawn.push(im.src);}};
 const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},time:0,room,ctx,document:{createElement:canvas},fetch:async()=>({ok:true,json:async()=>meta}),readyImage:p=>({image:{src:p,width:256,height:256}}),addImage:()=>null,ensureImages:async()=>{},
  drawEffect(){},tick(){},project:(x,y)=>({x,y}),actorHeight:()=>60,effects:[],Math,JSON,String,Object,Number,Date,Promise,Array,Set,Map,WeakSet,Uint8ClampedArray};
 vm.createContext(sb);vm.runInContext(C('pixelfx-r163.js'),sb);await new Promise(r=>setTimeout(r,20));vm.runInContext(C('samong-pixel-art-r1177.js'),sb);
 const X=sb.window.__STORYWORLD_PIXELFX_R163__,A=sb.window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__;sb.tick();
 drawn.length=0;sb.time+=10;const e=X.play('mob-memory',1,1,{tint:{a:[1,2,3],b:[200,100,50]},key:'t'});sb.drawEffect(sb.effects.find(x=>x.type==='r163-pixelfx'));const s=drawn[drawn.length-1]||'';
 ok(/assets\/r1177\/mob-memory-dots-12\.webp$/.test(A.resolve(s)||s),'본편: mob-memory → Dots CX-0160MF 시트',s);ok(e&&e.tint===null,'물들이지 않음');
 const row=X.meta()['mob-memory'],b=fs.readFileSync(path.join(root,'runtime-text','assets/r1177/mob-memory-dots-12.webp'));
 ok(1+b.readUIntLE(24,3)===row.frame[0]*row.columns&&1+b.readUIntLE(27,3)===row.frame[1]*Math.ceil(row.frames/row.columns),'시트 크기와 칸 표',row);
 ok(row.frames/row.fps<=57/15&&row.loop===false&&b.length<=80000,'재생 길이 원래 이하·한 번·80KB 이하',[row.frames,row.fps,b.length]);
 A.set({mobHit:false});sb.tick();ok(X.meta()['mob-memory'].file==='mob-memory.webp','끄면 원래 도트 칸');
 ok(A.inspect().stats.errors===0,'R1177 오류 0');console.log('R1177f '+n+'/'+n);})().catch(e=>{console.error(e);process.exit(1);});
