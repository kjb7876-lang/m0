// R1177c — 사몽 에피소드 도트 이펙트 자리(C1~C4)를 Dots CX-0156SP 칠한 시트로, 그리고 pixelfx 물들인 시트 캐시가 칸을 바꿔 끼운 뒤에도 옛 도트 시트를 내던 문제
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS '+m);};
for(const f of ['pixelfx-r163.js','samong-pixel-art-r1177.js'])ok(C(f)===fs.readFileSync(path.join(root,'runtime-text',f),'utf8'),f+' runtime 사본 같음');
const meta=JSON.parse(fs.readFileSync(path.join(root,'runtime-text/assets/r163/pixelfx/index.json'),'utf8'));
// ---- 가짜 엔진: 물들이기 캔버스는 원본 그림 경로를 기억하고, 그리기는 마지막 그림 경로를 남긴다
const drawn=[];const room={};
const canvas=()=>{const c={width:0,height:0,getContext:()=>({drawImage(im){c.src=im.src;},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(4)}),putImageData(){}})};return c;};
const ctx={save(){},restore(){},translate(){},scale(){},globalAlpha:1,drawImage(im){drawn.push(im.src);}};
const sb={window:{},localStorage:{getItem(k){return k==='storyworld.r1177.samongPixel'?'{"everywhere":false}':null;},setItem(){}},/* R1193: 기본이 모든 모드가 됨 → 이 검사(본편↔사몽 캐시 열쇠)는 '사몽 에피소드만' 스위치로 본다 */time:0,room,ctx,document:{createElement:canvas},
 fetch:async()=>({ok:true,json:async()=>meta}),readyImage:p=>({image:{src:p,width:256,height:256}}),addImage:()=>null,ensureImages:async()=>{},
 drawEffect(){},tick(){},project:(x,y)=>({x,y}),actorHeight:()=>60,effects:[],Math,JSON,String,Object,Number,Date,Promise,Array,Set,Map,WeakSet,Uint8ClampedArray};
vm.createContext(sb);vm.runInContext(C('pixelfx-r163.js'),sb);
(async()=>{await new Promise(r=>setTimeout(r,20));vm.runInContext(C('samong-pixel-art-r1177.js'),sb);
 const X=sb.window.__STORYWORLD_PIXELFX_R163__,A=sb.window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__;ok(X.ready(),'pixelfx 표 읽힘');
 const frame=(name,o)=>{drawn.length=0;sb.time+=10;X.stop('t');X.play(name,1,1,{...o,key:'t'});sb.drawEffect(sb.effects.find(e=>e.type==='r163-pixelfx'));return drawn[drawn.length-1]||null;};
 const real=p=>A.resolve(p)||p;const purple={a:[40,10,30],b:[150,90,170]};
 // 본편에서 몹 예고(보라로 물들인 기억 조각 파괴 도트)가 먼저 캐시를 만든다
 let s=frame('pvfx-void-implosion',{tint:purple});ok(/assets\/r163\/pixelfx\/pvfx-void-implosion\.webp$/.test(s),'본편: 원래 도트 시트',s);
 room.samongR103={key:'S-06',zone:'sz115-S06-3'};sb.tick();
 s=frame('pvfx-void-implosion',{tint:purple});ok(/assets\/r1177\//.test(real(s)),'사몽: 같은 물들임이어도 바꾼 칠한 시트(캐시가 옛 도트를 내면 안 됨)',s);
 room.samongR103=null;sb.tick();s=frame('pvfx-void-implosion',{tint:purple});ok(/assets\/r163\/pixelfx\/pvfx-void-implosion\.webp$/.test(s),'본편으로 나오면 다시 원래 시트',s);
 // C1~C4: 네 자리 모두 Dots 시트(물들임 없이 Dots 색 그대로)
 room.samongR103={key:'S-06',zone:'sz115-S06-3'};sb.tick();const own=A.swap;
 const want={'pvfx-rift-portal':/crimson-fissure/,'pvfx-choir-moths':/ash-crimson-moths/,'hands-blood':/spectral-hands/};
 for(const [k,re] of Object.entries(want)){ok(re.test(own[k].file),k+' → Dots 시트',own[k].file);s=frame(k,{tint:{a:[100,6,16],b:[255,90,90]}});ok(re.test(real(s)),k+' 사몽에서 실제로 그 시트를 그림',s);}
 // 기억 조각 탑이 깨질 때만 C1 무너지는 탑 — 몹 예고 같은 다른 부름은 R1177 핏빛 소용돌이 그대로
 const tower={r170Tower:true,hp:9,x:4,y:5};room.enemies=[tower];sb.tick();tower.hp=0;room.enemies=[];/* 엔진은 깨진 탑을 적 목록에서 먼저 뺀 뒤 R178 이 부른다 */drawn.length=0;sb.time+=10;X.stop('t');X.play('pvfx-void-implosion',4,5,{k:1.1,z:24,tint:{a:[100,6,16],b:[255,90,90]},key:'t'});sb.drawEffect(sb.effects.find(e=>e.type==='r163-pixelfx'));
 ok(/memory-tower-implode/.test(real(drawn[drawn.length-1]||'')),'탑이 깨질 때 → C1 무너지는 탑',drawn);
 s=frame('pvfx-void-implosion',{tint:purple});ok(/void-implosion-blood/.test(real(s)),'몹 예고 → R1177 소용돌이 그대로',s);
 const rows=X.meta();for(const k of ['pvfx-void-implosion','hands-blood','pvfx-rift-portal','pvfx-choir-moths','r1177-memory-tower']){const r=rows[k];if(!r)continue;const fw=r.frame,b=fs.readFileSync(path.join(root,'runtime-text',real('assets/r163/pixelfx/'+r.file)));
  const W=1+b.readUIntLE(24,3),H=1+b.readUIntLE(27,3);ok(W===fw[0]*r.columns&&H===fw[1]*Math.ceil(r.frames/r.columns),k+' 시트 크기와 칸 표가 맞음',{W,H,frame:fw,columns:r.columns,frames:r.frames});}
 ok(A.inspect().stats.errors===0,'R1177 오류 0',A.inspect());
 console.log('R1177c '+n+'/'+n);})().catch(e=>{console.error(e);process.exit(1);});
