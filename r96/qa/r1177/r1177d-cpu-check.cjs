// R1177d — R169 지역 몹 타격 pixelfx 칸(mob-*) 9종을 Dots CX-0156SP D 칠한 시트로(모든 모드), 물들이지 않고 Dots 색 그대로
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS '+m);};
for(const f of ['pixelfx-r163.js','samong-pixel-art-r1177.js'])ok(C(f)===fs.readFileSync(path.join(root,'runtime-text',f),'utf8'),f+' runtime 사본 같음');
const meta=JSON.parse(fs.readFileSync(path.join(root,'runtime-text/assets/r163/pixelfx/index.json'),'utf8'));
const drawn=[];const room={};
const canvas=()=>{const c={width:0,height:0,getContext:()=>({drawImage(im){c.src=im.src;},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(4)}),putImageData(){}})};return c;};
const ctx={save(){},restore(){},translate(){},scale(){},globalAlpha:1,drawImage(im){drawn.push(im.src);}};
const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},time:0,room,ctx,document:{createElement:canvas},
 fetch:async()=>({ok:true,json:async()=>meta}),readyImage:p=>({image:{src:p,width:256,height:256}}),addImage:()=>null,ensureImages:async()=>{},
 drawEffect(){},tick(){},project:(x,y)=>({x,y}),actorHeight:()=>60,effects:[],Math,JSON,String,Object,Number,Date,Promise,Array,Set,Map,WeakSet,Uint8ClampedArray};
vm.createContext(sb);vm.runInContext(C('pixelfx-r163.js'),sb);
(async()=>{await new Promise(r=>setTimeout(r,20));vm.runInContext(C('samong-pixel-art-r1177.js'),sb);
 const X=sb.window.__STORYWORLD_PIXELFX_R163__,A=sb.window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__;ok(X.ready(),'pixelfx 표 읽힘');
 const real=p=>A.resolve(p)||p;const tint={a:[40,10,30],b:[150,90,170]};
 const play=(name,o)=>{drawn.length=0;sb.time+=10;X.stop('t');const e=X.play(name,1,1,{...o,key:'t'});sb.drawEffect(sb.effects.find(x=>x.type==='r163-pixelfx'));return {e,src:drawn[drawn.length-1]||null};};
 const D=A.mobHit||{};const want={domestic:/house-double-claw|mob-domestic-dots/,forge:/mob-forge-dots/,neural:/mob-neural-dots/,clinical:/mob-clinical-dots/,garden:/mob-garden-dots/,stone:/mob-stone-dots/,snow:/mob-snow-dots/,coast:/mob-coast-dots/,regional:/mob-regional-dots/};
 ok(Object.keys(D).length===10,'몹 타격 Dots 칸 10종(R1177f 에서 기억 추가 — 사용자 지시 동작 변경)',Object.keys(D));
 // 본편(스토리·생존: 사몽 구역 아님)에서도 바뀜
 room.samongR103=null;sb.tick();
 for(const [f,re] of Object.entries(want)){const k='mob-'+f;ok(re.test(D[k]?.file||''),k+' → Dots 시트',D[k]);const r=play(k,{tint,k:1.3,rate:1.2});ok(re.test(real(r.src||'')),k+' 본편에서 실제로 Dots 시트를 그림',r.src);ok(!r.e||r.e.tint===null,k+' 물들이지 않음(Dots 색 그대로)',r.e&&r.e.tint);}
 // 기억(memory)도 R1177f 부터 Dots CX-0160MF(사용자 지시 동작 변경 — 원래는 '원래 도트 그대로')
 let r=play('mob-memory',{tint});ok(/mob-memory-dots-12\.webp$/.test(real(r.src||'')),'mob-memory Dots 칸',r.src);ok(!r.e||r.e.tint===null,'mob-memory 물들이지 않음');
 // 사몽 에피소드 안에서도 같음
 room.samongR103={key:'S-06',zone:'sz115-S06-3'};sb.tick();r=play('mob-forge',{tint});ok(/mob-forge-dots/.test(real(r.src||'')),'사몽 에피소드에서도 Dots 시트',r.src);
 // 끄면 원래 도트 칸·물들임으로
 A.set({mobHit:false});room.samongR103=null;sb.tick();r=play('mob-forge',{tint});ok(/assets\/r163\/pixelfx\/mob-forge\.webp$/.test(r.src||''),'끄면 원래 도트 칸',r.src);ok(r.e&&r.e.tint,'끄면 물들임 그대로');
 A.set({mobHit:true});sb.tick();
 // 시트 크기·칸 표·재생 길이(원래보다 길지 않게)·화면 크기 비율
 const rows=X.meta();for(const f of Object.keys(want)){const k='mob-'+f,row=rows[k],orig=meta.effects[k];ok(row&&row.r1177d,k+' 표에 들어감');
  const b=fs.readFileSync(path.join(root,'runtime-text',real('assets/r163/pixelfx/'+row.file)));ok(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP','webp');
  const vp8x=b.slice(12,16).toString()==='VP8X';const W=vp8x?1+b.readUIntLE(24,3):null,H=vp8x?1+b.readUIntLE(27,3):null;
  ok(W===row.frame[0]*row.columns&&H===row.frame[1]*Math.ceil(row.frames/row.columns),k+' 시트 크기와 칸 표가 맞음',{W,H,row:{frame:row.frame,columns:row.columns,frames:row.frames}});
  ok(row.frames/row.fps<=orig.frames/orig.fps+.01&&row.fps>=12&&row.fps<=18,k+' 재생 길이 원래 이하·12~18fps',{n:row.frames,fps:row.fps,orig:orig.frames/orig.fps});
  ok(row.loop===false,k+' 한 번 재생');ok(b.length<=80000,k+' 80KB 이하',b.length);}
 ok(A.inspect().stats.errors===0,'R1177 오류 0',A.inspect());
 console.log('R1177d '+n+'/'+n);})().catch(e=>{console.error(e);process.exit(1);});
