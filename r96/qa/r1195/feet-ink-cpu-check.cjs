// R1195 CPU 검사 — 몹 잘린 발·옆을 먹 연기로 덮기(mob-feet-ink-r1195.js)
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),SRC=path.join(R,'client-source/mob-feet-ink-r1195.js');
let pass=0;const ok=(c,m)=>{assert.ok(c,m);pass++;};
ok(fs.existsSync(SRC),'오버레이 파일 있음');
const code=fs.readFileSync(SRC,'utf8');
// ---- 정적 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok(/<script src="\.\/mob-feet-ink-r1195\.js"><\/script>/.test(html),'index.html 스크립트 태그');
ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes('mob-feet-ink-r1195.js'),'공개 확인 기대 목록');
ok(fs.existsSync(path.join(R,'runtime-text/mob-feet-ink-r1195.js')),'runtime-text 사본(sync)');
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');ok(inputs.includes('mob-feet-ink-r1195.js'),'runtime-inputs 등록');
ok(fs.existsSync(path.join(R,'runtime-text/assets/r430/mist-loop.webp')),'쓰는 프레임 시트(R430 안개 고리) 있음');
ok(!/\b(arc|ellipse|lineTo|fillRect|createRadialGradient|createLinearGradient)\s*\(/.test(code),'코드로 그린 원·선·사각형 없음(시트만)');
ok(!/ctx\.filter\s*=/.test(code),'매 프레임 ctx.filter 안 씀(구운 시트)');
// ---- 판정 ----
const sb={window:{},localStorage:{v:{},getItem(k){return this.v[k]??null;},setItem(k,v){this.v[k]=String(v);}},innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),performance:{now:()=>0},
 requestAnimationFrame:null,document:{createElement:()=>null},Math,Date,Map,Set,Array,Uint8Array,Int32Array,Number,String,Object,Promise,console};
sb.window=sb;vm.createContext(sb);vm.runInContext(code,sb);
const API=sb.__STORYWORLD_FEET_INK_R1195__;ok(API&&typeof API.classify==='function','전역 API');
const W=100,H=120;const mk=()=>new Uint8Array(W*H);const put=(a,x0,x1,y0,y1,v=255)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)a[y*W+x]=v;};
// 1) 자연스러운 발: 몸통 넓고 다리 둘이 가늘어지며 끝, 아랫줄은 반투명 가장자리
{const a=mk();put(a,30,70,10,70);put(a,36,46,70,104);put(a,54,64,70,104);put(a,37,45,104,106,150);put(a,55,63,104,106,150);put(a,38,44,106,107,80);put(a,56,62,106,107,80);
 const v=API.classify(a,W,H);ok(v&&!v.bottom&&!v.left&&!v.right,'자연스러운 발은 덮지 않음 '+JSON.stringify(v));}
// 2) 칸 바닥에 닿아 잘림(넓은 몸이 마지막 줄까지 꽉 참)
{const a=mk();put(a,20,80,20,H);const v=API.classify(a,W,H);ok(v&&v.bottom&&v.bottom.edge===true&&v.bottom.y===H&&v.bottom.x0===20&&v.bottom.x1===80,'칸 바닥 잘림 검출 '+JSON.stringify(v&&v.bottom));}
// 2b) 한 발만 칸 바닥에 닿고 다른 발은 조금 위에서 끝남 → 덮개는 두 발 모두 감쌈
{const a=mk();put(a,30,70,20,90);put(a,32,44,90,H);put(a,56,68,90,H-10);const v=API.classify(a,W,H);ok(v&&v.bottom&&v.bottom.x0<=32&&v.bottom.x1>=68,'두 발 모두 감싸는 폭 '+JSON.stringify(v&&v.bottom));}
// 3) 그림 자체 직선 잘림(아래 여백이 있지만 다리가 같은 폭으로 뚝 끊김)
{const a=mk();put(a,25,75,10,60);put(a,30,70,60,95);const v=API.classify(a,W,H);ok(v&&v.bottom&&v.bottom.edge===false&&v.bottom.y===95,'그림 속 직선 잘림 검출 '+JSON.stringify(v&&v.bottom));}
// 4) 아래로 가늘어지는 자락(마지막 줄이 좁음) → 덮지 않음
{const a=mk();for(let y=10;y<100;y++){const hw=Math.max(1,Math.round(30-(y-10)*.32));put(a,50-hw,50+hw,y,y+1);}const v=API.classify(a,W,H);ok(v&&!v.bottom,'가늘어지는 자락은 덮지 않음 '+JSON.stringify(v&&v.bottom));}
// 5) 경계값: 칸 바닥 단단한 픽셀 3개(기준 4 미만) → 바닥 잘림 아님, 4개 이상이면 잘림
{const a=mk();put(a,30,70,10,90);put(a,48,51,90,H,255);let v=API.classify(a,W,H);ok(!v.bottom||v.bottom.edge!==true,'바닥 닿은 픽셀 3개는 칸 잘림 아님');
 const b=mk();put(b,30,70,10,90);put(b,48,52,90,H,255);v=API.classify(b,W,H);ok(v.bottom&&v.bottom.edge===true,'바닥 닿은 픽셀 4개는 칸 잘림');}
// 6) 옆 잘림(공격 때 무기가 오른쪽 끝에 닿음)
{const a=mk();put(a,30,60,10,100);put(a,60,W,40,52);const v=API.classify(a,W,H);ok(v&&v.right&&v.right.y0===40&&v.right.y1===52&&!v.left,'오른쪽 잘림 검출 '+JSON.stringify(v&&v.right));}
// 6b) 칸 끝 한 줄은 리샘플로 반투명(130), 바로 안쪽 줄은 단단 — 재 나방 날개처럼 칸에 잘림 → 검출
{const a=mk();put(a,30,60,10,100);put(a,60,W-1,30,70);put(a,W-1,W,30,70,130);const v=API.classify(a,W,H);ok(v&&v.right&&v.right.y0===30&&v.right.y1===70,'끝 줄이 반투명인 옆 잘림 검출 '+JSON.stringify(v&&v.right));}
{const a=mk();put(a,20,80,20,H-1);put(a,20,80,H-1,H,130);const v=API.classify(a,W,H);ok(v&&v.bottom&&v.bottom.edge===true,'끝 줄이 반투명인 바닥 잘림 검출');}
// 6c) 딱 맞게 오린 그림(위·아래·왼·오른쪽 모두 닿음)은 잘림이 아니라 테두리 상자 → 칸 끝 덮개 없음
{const a=mk();put(a,0,W,0,H);const v=API.classify(a,W,H);ok(v&&!v.left&&!v.right&&!(v.bottom&&v.bottom.edge),'딱 맞게 오린 그림은 칸 끝 덮개 없음 '+JSON.stringify(v));}
{const a=mk();put(a,30,70,0,40);put(a,0,W,40,80);put(a,40,60,80,H);const v=API.classify(a,W,H);ok(v&&!v.left&&!v.right&&!(v.bottom&&v.bottom.edge),'세 쪽 이상 닿은 오린 그림도 덮개 없음 '+JSON.stringify(v));}
// 7) 빈 칸·작은 칸
ok(API.classify(mk(),W,H)===null,'빈 칸 null');ok(API.classify(new Uint8Array(16),4,4)===null,'작은 칸 null');
// 8) 반투명 안개 자락(R1029 처럼 이미 안개가 덮인 아랫부분: 바닥에 닿아도 알파 낮음) → 덮지 않음
{const a=mk();put(a,25,75,10,80);put(a,15,85,80,H,120);const v=API.classify(a,W,H);ok(v&&!v.bottom,'이미 안개로 흐린 아래는 덮지 않음');}
// ---- 감싸기·그리기(가짜 기록기) ----
{const cmds=[];const draws=[];const rec={commands:cmds,dpr:1,owner:{id:'scene',kind:'scene'},filter:'none',globalAlpha:1,
  save(){},restore(){},setTransform(){},translate(x,y){this.lastT=[x,y];},rotate(){},scale(){},scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}},
  drawImage(im,...a){draws.push({im,owner:this.owner,filter:this.filter,t:this.lastT,a});}};
 const img={width:192*6,height:192*4};
 const cell=new Uint8Array(64*64);for(let y=10;y<64;y++)for(let x=12;x<52;x++)cell[y*64+x]=255; // 칸 바닥 잘림
 const {__STORYWORLD_FEET_INK_R1195__:_drop,...base}=sb;const sb2={...base,window:null,ctx:rec,time:3,readyImage:p=>p==='assets/r430/mist-loop.webp'?{image:img}:null,ensureImages:()=>Promise.resolve(),
  document:{createElement:()=>({width:0,height:0,getContext:()=>({clearRect(){},drawImage(){},putImageData(){},getImageData:(x,y,w,h)=>{const d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)d[i*4+3]=cell[i];return{data:d};}})})},
  requestAnimationFrame:f=>{sb2.__raf=f;},drawEnemy:function(e){cmds.push({kind:'image',spatialRole:'',sourcePath:'assets/x.webp',sourceRect:[0,0,64,64],image:{},points:[[100,100],[164,100],[164,164],[100,164]]});}};
 sb2.window=sb2;vm.createContext(sb2);vm.runInContext(code,sb2);
 const A2=sb2.__STORYWORLD_FEET_INK_R1195__;ok(A2.inspect().installed,'drawEnemy 감쌈');
 // 첫 프레임 예산: requestAnimationFrame 없음 → 예산 0 이면 읽지 않으므로 예산을 주는 pump 대신 직접 확인
 vm.runInContext('drawEnemy({id:1,hp:10,x:3,y:4})',sb2);
 ok(draws.length===0,'예산 0 프레임에는 픽셀을 읽지 않음(렉 방지)');
 ok(typeof A2.inspect().stats==='object','inspect stats');
 sb2.__raf();vm.runInContext('drawEnemy({id:1,hp:10,x:3,y:4})',sb2);
 ok(draws.length>=1,'잘린 몹에 먹 안개를 그림 '+draws.length);
 ok(draws.every(d=>d.owner&&d.owner.kind==='effect'&&/^r1195-/.test(d.owner.id)&&d.owner.x===3&&d.owner.y===4),'덮개 주인 = 그 몹 자리의 effect');
 ok(draws.every(d=>d.owner.enemy===true),'적 쪽 그림 표시(R350·R409 가림 옅게에서 빠짐 — 몹 곁 덮개가 1/3 로 옅어지던 것)');
 ok(draws.every(d=>d.im&&d.im.__storyworldStaticSource&&/^r1195:ink:/.test(d.im.__storyworldStaticSource.path)),'먹빛으로 구운 고유 경로 시트로 그림');
 ok(draws.every(d=>d.a.length===8&&(d.a[2]===96||d.a[2]===128)&&d.a[2]===d.a[3]),'구운 반 해상도 시트 한 칸씩 그림(안개 96·연기 128)');
 ok(draws[0].t&&Math.abs(draws[0].t[0]-132)<3&&draws[0].t[1]>150&&draws[0].t[1]<=164,'덮개 중심 = 잘린 아랫줄 가운데 '+JSON.stringify(draws[0].t));
 const n1=draws.length;vm.runInContext('drawEnemy({id:2,hp:0,x:3,y:4})',sb2);ok(draws.length===n1,'죽은 몹(사망 연출 중)은 덮지 않음');
 sb2.localStorage.setItem('storyworld.r1195.feetInk','0');vm.runInContext('drawEnemy({id:3,hp:5,x:3,y:4})',sb2);ok(draws.length===n1,'끄기 설정이면 안 그림');
 sb2.localStorage.setItem('storyworld.r1195.feetInk','1');
 ok(A2.inspect().stats.analysed===1,'같은 칸은 한 번만 읽음(캐시)');
}
// ---- 먹빛 톤 ----
{const d=new Uint8ClampedArray([255,255,255,255, 0,0,0,255, 120,200,90,0]);API.inkTone(d);ok(d[0]<=80&&d[0]>=50&&d[4]===12&&d[8]===120,'먹빛 톤: 흰색→옅은 먹, 검정→짙은 먹, 투명 픽셀은 그대로 '+[...d].join(','));}
// ---- 다른 오버레이와 번갈아 감싸기(핑퐁) 방지 + 이중 덮개 방지 ----
{const {__STORYWORLD_FEET_INK_R1195__:_d,...base}=sb;let calls=0;const sb3={...base,window:null,ctx:{commands:[]},requestAnimationFrame:f=>{sb3.__raf=f;},drawEnemy:function(){calls++;}};sb3.window=sb3;vm.createContext(sb3);
 // 다른 모듈: 자기 표시가 없으면 다시 감싼다(R462 식)
 vm.runInContext('function other(){if(drawEnemy.__rX9)return;const b=drawEnemy;const w=function(e){return b.call(this,e);};w.__r9=true;w.__rX9=true;drawEnemy=w;}other();',sb3);
 vm.runInContext(code,sb3);for(let i=0;i<20;i++){vm.runInContext('other()',sb3);sb3.__raf();}
 const I=sb3.__STORYWORLD_FEET_INK_R1195__.inspect();ok(I.stats.wraps<=2,'번갈아 다시 감싸지 않음 wraps='+I.stats.wraps);
 vm.runInContext('drawEnemy({id:1,hp:1})',sb3);ok(calls===1,'원래 그리기는 한 번만');}
// ---- 모션 사이 일관성(사용자 11-19 03:36Z "그 부분만 덮지 말고 그 부분에 맞게 계속 덮어서 일관성 유지 — 모션 간") ----
{const {__STORYWORLD_FEET_INK_R1195__:_d,...base}=sb;const draws=[];
 const rec={commands:[],dpr:1,owner:{id:'scene',kind:'scene'},globalAlpha:1,save(){},restore(){},setTransform(){},translate(x,y){this.lastT=[x,y];},rotate(){},scale(sx,sy){this.lastS=[sx,sy];},
  scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}},drawImage(im,...a){draws.push({owner:this.owner,t:this.lastT,s:this.lastS,a,ga:this.globalAlpha});}};
 const cut=new Uint8Array(64*64);for(let y=10;y<64;y++)for(let x=12;x<52;x++)cut[y*64+x]=255;            // 칸 바닥 잘림(걷기 칸)
 const whole=new Uint8Array(64*64);for(let y=6;y<56;y++)for(let x=14;x<50;x++)whole[y*64+x]=y>50?120:255; // 안 잘린 칸(공격 칸, 발이 칸 안)
 const side=new Uint8Array(64*64);for(let y=10;y<56;y++)for(let x=20;x<64;x++)side[y*64+x]=255;           // 오른쪽 옆 잘림(공격 칸)
 const arm=new Uint8Array(64*64);for(let y=10;y<56;y++){const hw=Math.max(1,Math.round(10-(y-10)*.2));for(let x=40-hw;x<40+hw;x++)arm[y*64+x]=255;}for(let y=20;y<30;y++)for(let x=40;x<64;x++)arm[y*64+x]=255; // 옆(팔)만 잘림
 const cells={'e.webp':arm,'a.webp':cut,'b.webp':whole,'c.webp':side,'d.webp':whole};let cur=null;
 const sb4={...base,window:null,ctx:rec,time:1,readyImage:p=>p==='assets/r430/mist-loop.webp'?{image:{width:1152,height:768}}:null,ensureImages:()=>Promise.resolve(),
  document:{createElement:()=>({width:0,height:0,getContext:()=>({clearRect(){},drawImage(im){cur=im;},putImageData(){},getImageData:(x,y,w,h)=>{const src=cells[cur&&cur.p]||new Uint8Array(w*h);const d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)d[i*4+3]=src[i]||0;return{data:d};}})})},
  requestAnimationFrame:f=>{sb4.__raf=f;},drawEnemy:function(e){rec.commands.push({kind:'image',spatialRole:'',sourcePath:'assets/'+e.__img,sourceRect:[0,0,64,64],image:{p:e.__img},points:[[100,100],[164,100],[164,164],[100,164]]});}};
 sb4.window=sb4;vm.createContext(sb4);vm.runInContext(code,sb4);
 const step=(img,id,nid)=>{sb4.__raf();sb4.time+=.05;const n=draws.length;const E=(sb4.__Es=sb4.__Es||{})[id]||(sb4.__Es[id]={id,hp:5,x:1,y:2,nativeId:nid});E.__img=img;sb4.__E=E;vm.runInContext('drawEnemy(__E)',sb4);return draws.slice(n).filter(d=>d.owner&&/^r1195-/.test(d.owner.id));};
 const d1=step('a.webp',7,'kn');ok(d1.length>=1,'잘린 칸: 덮음');
 const d2=step('b.webp',7,'kn');ok(d2.length>=1,'같은 몹의 안 잘린 다음 모션 칸에서도 계속 덮음');
 const w1=Math.abs(d1[0].s[0]),w2=Math.abs(d2[0].s[0]);ok(Math.abs(w2-w1)/w1<.15,'모션이 바뀌어도 안개 크기가 갑자기 바뀌지 않음 '+w1.toFixed(3)+'→'+w2.toFixed(3));
 ok(Math.abs(d2[0].t[0]-d1[0].t[0])<6&&Math.abs(d2[0].t[1]-d1[0].t[1])<8,'안개 위치도 모션 사이에 튀지 않음 '+JSON.stringify([d1[0].t,d2[0].t]));
 const d3=step('d.webp',8,'kn');ok(d3.length>=1,'같은 종류의 다른 몹(같은 nativeId)도 처음부터 덮음');
 const d4=step('b.webp',9,'other');ok(d4.length===0,'잘림이 한 번도 없던 몹은 덮지 않음');
 const o1=step('e.webp',20,'wingonly').length,o2=step('b.webp',20,'wingonly').length;ok(o1>=1&&o2>=1&&o2<=1,'옆 잘림만 있던 몹은 다음 칸에서 옆 안개만 옅어지며 남고 발밑 안개는 없음 '+o1+'/'+o2);
 const s1=step('c.webp',7,'kn').length,s2=step('b.webp',7,'kn').length;ok(s1>d2.length,'옆 잘림 칸: 옆 안개 추가');ok(s2>=d2.length,'옆 잘림이 끝난 다음 칸: 옆 안개가 바로 사라지지 않고 옅어짐');}
console.log(JSON.stringify({check:'r1195-feet-ink',pass}));
