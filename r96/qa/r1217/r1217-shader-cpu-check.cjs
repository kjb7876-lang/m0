'use strict';
// R1217 ① — 사몽 흑백을 '몹·바닥마다 흑백 사본 캔버스 만들기 + GPU 올리기' 대신 셰이더 색 행렬 한 번으로(사용자 2026-11-19 "1-4 개선적용").
//  엔진 Three 기록기는 이미지 명령마다 CSS filter 를 색 행렬 uniform 으로 셰이더에서 적용한다(filterMatrix: grayscale·contrast·brightness).
//  → 사몽 중 세계 그림은 원본 그림 그대로 두고 그 그리기의 filter 앞에 흑백 필터(GRAY_FILTER)를 붙인다. 새 캔버스·새 텍스처 0.
//  R409 테두리: 테두리 색(핏빛)은 흑백이 되면 안 된다 → 흑백 필터가 붙은 몸 명령은 몸만 흑백으로 구운 칸(':g' 열쇠)을 쓰고 명령의 흑백 필터는 뗀다(예전 사본 방식과 같은 그림).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
const src=fs.readFileSync(path.join(SRC,'play-r111.js'),'utf8');
ok(fs.readFileSync(path.join(RT,'play-r111.js'),'utf8')===src,'runtime-text 사본 = client-source(play-r111)');
function mk(opt={}){let made=0;const uploads=[];
 class DrawCommands{constructor(){this.commands=[];this.owner={kind:'prop'};this.filter='none';this.got=[];}drawImage(image){this.got.push({image,filter:this.filter});}push(kind,data){this.commands.push({kind,style:{...(data||{})}});return true;}}
 const three={commands:{texture(img){uploads.push(img);return{img};},release(){}},renderer:{initTexture(){}}};
 const store={};if(opt.prefs)store['storyworld.hospital-three-pc.maze.v11:r111.play']=JSON.stringify(opt.prefs);
 const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,setTimeout,
  localStorage:{getItem:k=>store[k]??null,setItem(k,v){store[k]=v;}},NodeFilter:{SHOW_TEXT:4},performance:{now:()=>0},
  document:{getElementById:()=>null,querySelector:()=>null,createTreeWalker:()=>({nextNode:()=>null}),
   createElement:()=>{made++;let w=0;return{get width(){return w;},set width(v){w=v;},height:0,getContext:()=>({filter:'none',drawImage(){}})};}},
  time:10,started:true,modal:false,loading:false,settings:{lowFx:false},zoom:1,target:null,layer:'DREAM',
  player:{x:0,y:0,hp:50,hero:'hwando',direction:'front',resonance:0,attackAnim:0,skillAnim:0,moving:false,samong:0,samongCD:0},
  room:{id:'zoneA',enemies:[],props:[]},HEROES:{hwando:{range:1.5}},
  maxHP:()=>100,actorHeight:()=>60,project:(x,y)=>({x:(x-y)*34,y:(x+y)*17}),facing:()=>'left',
  tick(dt){sb.time+=dt;},drawHero(){},drawEffect(){},drawProjectile(){},hitEnemy(){return true;},hurt(){},fx(){},blink(){},guideStep(){},
  StoryPhase1:{DrawCommands},__STORYWORLD_PHASE1__:{controller:{state:{three}}}};
 sb.window=sb;let active=false;sb.__STORYWORLD_SAMONG_R75__={active:()=>active};sb.__STORYWORLD_WER__={defs:{hwando:{e:['E','x','dash']}}};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:'play-r111.js'});
 const dc=new DrawCommands();const P=sb.__STORYWORLD_PLAY_R111__;
 return{sb,P,uploads,made:()=>made,set:v=>{active=v;sb.player.samong=v?7:0;sb.player.samongCD=v?50:0;},tick:(dt=.016)=>sb.tick(dt),
  draw:(img,kind='prop',filter='none')=>{dc.owner={kind};dc.filter=filter;dc.got.length=0;dc.drawImage(img,0,0);const g=dc.got[0];return{...g,after:dc.filter};},st:()=>P.inspect().samong};}
const IMG=(w,h,name)=>({width:w,height:h,naturalWidth:w,naturalHeight:h,src:'assets/'+name+'.png'});
let m=mk();const GF=m.P.grayFilter;
ok(typeof GF==='string'&&/grayscale\(1\)/.test(GF),'흑백 필터 문자열을 밖에 알림(grayFilter='+GF+')');
ok(m.P.prefs().samongShader===true,'기본: 셰이더 흑백 켬');
// 준비(대기 0) — 셰이더 방식이면 미리 만들 사본이 없다
const a=IMG(400,300,'floor'),b=IMG(300,200,'mob');m.tick();m.draw(a);m.draw(b,'enemy');m.tick();m.tick();
ok(m.st().prewarmMade===0&&m.made()===0&&m.uploads.length===0,'사몽 준비 중 흑백 사본 예열 안 함(사본 '+m.st().prewarmMade+'·캔버스 '+m.made()+'·올림 '+m.uploads.length+')');
m.set(true);m.tick();const da=m.draw(a),db=m.draw(b,'enemy'),dt=m.draw(IMG(64,64,'tinted'),'prop','brightness(0.8)');
ok(da.image===a&&db.image===b,'사몽 중에도 원본 그림 그대로 그림(새 사본 없음)');
ok(da.filter===GF&&db.filter===GF,'세계 그림 그리기에 흑백 필터가 붙음');
ok(dt.filter===GF+' brightness(0.8)','원래 필터가 있으면 흑백 다음에 이어 붙임(사본에 원래 필터를 그리던 순서와 같음): '+dt.filter);
ok(da.after==='none'&&dt.after==='brightness(0.8)','그린 뒤 필터를 원래대로 돌려놓음');
const dh=m.draw(IMG(64,64,'hero'),'hero'),de=m.draw(IMG(64,64,'fx'),'effect'),dp=m.draw(IMG(64,64,'shot'),'projectile');
ok(dh.filter==='none'&&de.filter==='none'&&dp.filter==='none','영웅·이펙트·투사체는 색 그대로(기존 규칙)');
ok(m.made()===0&&m.st().grayImages===0,'각성 첫 장면에 캔버스 0장·흑백 사본 0장');
m.set(false);m.tick();ok(m.draw(a).filter==='none','각성이 끝나면 필터 없음(컬러)');
// 끄면 예전 사본 방식
m=mk({prefs:{samongShader:false}});m.set(true);m.tick();const old=m.draw(a);
ok(old.image!==a&&old.image?.__storyworldStaticSource?.r111SamongGray&&old.filter==='none','samongShader:false 면 예전 흑백 사본 방식');
// ---- R409: 흑백 필터 붙은 적 몸 ----
const r409=fs.readFileSync(path.join(SRC,'combat-read-r409.js'),'utf8');
ok(fs.readFileSync(path.join(RT,'combat-read-r409.js'),'utf8')===r409,'runtime-text 사본 = client-source(R409)');
class Ctx{constructor(c){this.c=c;this.globalAlpha=1;this.globalCompositeOperation='source-over';this.fillStyle='#000';this.filter='none';}
 getImageData(x,y,w,h){const d=new Uint8ClampedArray(w*h*4),P=this.c.px,W=this.c.width;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const s=((y+j)*W+x+i)*4,t=(j*w+i)*4;for(let k=0;k<4;k++)d[t+k]=P[s+k]||0;}return{data:d,width:w,height:h};}
 createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4),width:w,height:h};}
 putImageData(img,x,y){const P=this.c.px,W=this.c.width;for(let j=0;j<img.height;j++)for(let i=0;i<img.width;i++){const s=(j*img.width+i)*4,t=((y+j)*W+x+i)*4;for(let k=0;k<4;k++)P[t+k]=img.data[s+k];}}
 drawImage(im,...a){let sx=0,sy=0,sw=im.width,sh=im.height,dx,dy;if(a.length>=8)[sx,sy,sw,sh,dx,dy]=a;else[dx,dy]=a;const S=im.px,SW=im.width,P=this.c.px,W=this.c.width,H=this.c.height,gray=/grayscale\(1\)/.test(this.filter);
  for(let j=0;j<sh;j++)for(let i=0;i<sw;i++){const X=dx+i,Y=dy+j;if(X<0||Y<0||X>=W||Y>=H)continue;const s=((sy+j)*SW+sx+i)*4,t=(Y*W+X)*4;if(!S[s+3])continue;
   let r=S[s],g=S[s+1],b=S[s+2];if(gray){const l=Math.round(.2126*r+.7152*g+.0722*b);r=g=b=l;}P[t]=r;P[t+1]=g;P[t+2]=b;P[t+3]=S[s+3];}}
 fillRect(){}}
class Canvas{constructor(){this._w=0;this._h=0;this.px=new Uint8ClampedArray(0);}set width(v){this._w=v;this.px=new Uint8ClampedArray(this._w*this._h*4);}get width(){return this._w;}set height(v){this._h=v;this.px=new Uint8ClampedArray(this._w*this._h*4);}get height(){return this._h;}getContext(){return this.ctx||(this.ctx=new Ctx(this));}}
const sprite=()=>{const c=new Canvas();c.width=40;c.height=50;for(let y=5;y<45;y++)for(let x=8;x<32;x++){const i=(y*40+x)*4;c.px[i]=200;c.px[i+1]=40;c.px[i+2]=40;c.px[i+3]=255;}return c;};
const ctx={console,performance,setInterval:()=>0,document:{createElement:()=>new Canvas()},player:{hero:'slayer'},room:{enemies:[]}};ctx.window=ctx;ctx.localStorage={getItem:()=>null,setItem(){}};
ctx.__STORYWORLD_PLAY_R111__={grayFilter:GF};vm.createContext(ctx);vm.runInContext(r409,ctx,{filename:'combat-read-r409.js'});const A=ctx.__STORYWORLD_COMBAT_READ_R409__;
const cmd=(img,filter)=>({kind:'image',image:img,mutable:false,owner:{kind:'enemy',id:'enemy:1'},sourceRect:[0,0,40,50],points:[[0,0],[40,0],[40,50],[0,50]],order:1,style:{filter,globalAlpha:1}});
const sp=sprite(),cg=cmd(sp,GF),cc=cmd(sp,'none'),cb=cmd(sp,GF+' brightness(0.8)');A.process([cg]);A.process([cc]);A.process([cb]);/* 장면당 굽기 예산(R441) — 장면 하나에 한 장씩 */
const px=(c,x,y)=>{const W=c.image.width,i=((y)*W+x)*4;return[...c.image.px.slice(i,i+4)];};
ok(cg.r409Outlined&&cc.r409Outlined&&cg.image!==cc.image,'흑백 몸과 컬러 몸은 다른 칸으로 구움');
const pad=(cg.image.width-40)/2,bodyG=px(cg,pad+20,pad+25),bodyC=px(cc,pad+20,pad+25),rimG=px(cg,pad+7,pad+25);
ok(bodyG[0]===bodyG[1]&&bodyG[1]===bodyG[2]&&bodyG[3]===255,'흑백 칸의 몸은 회색('+bodyG+')');
ok(bodyC[0]===200&&bodyC[1]===40,'컬러 칸의 몸은 원색('+bodyC+')');
ok(rimG[3]>0&&rimG[0]>rimG[1]+40,'흑백 칸의 테는 핏빛 그대로('+rimG+')');
ok(cg.style.filter==='none'&&cb.style.filter==='brightness(0.8)','구운 몸 명령에서는 흑백 필터만 떼고 나머지 필터는 남김('+cg.style.filter+' / '+cb.style.filter+')');
ok(cb.image===cg.image,'흑백 몸 칸은 원래 필터와 상관없이 같은 칸을 씀');
const ce=cmd(sp,GF);ce.owner={kind:'prop',id:'prop:1'};A.process([ce]);ok(ce.style.filter===GF&&!ce.r409Outlined,'테두리 없는 그림(소품 등)은 흑백 필터가 그대로 셰이더로 감');
// R409 미리 굽기: 사몽 준비 중(R111 samongSoon)이면 컬러 몸을 구운 뒤 같은 장면 예산 안에서 흑백 몸 칸도 미리 굽는다(각성 첫 장면 굽기 몰림 줄이기)
/* 시계 고정: R409 장면 굽기 예산(BAKE_BUDGET_MS=6)이 실제 시간이라 느린 CI 러너에서 컬러 굽기가 6ms 를 넘으면 흑백 미리 굽기가 미뤄져 이 항목이 갈렸다(#876·#879 CI). 검사하는 것은 '준비 중이면 미리 굽는다'는 논리이므로 시계를 0 으로 고정 */
{const ctx2={console,performance:{now:()=>0},setInterval:()=>0,document:{createElement:()=>new Canvas()},player:{hero:'slayer'},room:{enemies:[]}};ctx2.window=ctx2;ctx2.localStorage={getItem:()=>null,setItem(){}};
 let soon=true;ctx2.__STORYWORLD_PLAY_R111__={grayFilter:GF,samongSoon:()=>soon};vm.createContext(ctx2);vm.runInContext(r409,ctx2,{filename:'combat-read-r409.js'});const B=ctx2.__STORYWORLD_COMBAT_READ_R409__;
 const s2=sprite();B.process([cmd(s2,'none')]);const st=B.inspect().stats;ok(st.baked===2&&st.grayPrebaked===1,'준비 중: 컬러 몸 굽고 흑백 몸도 미리 구움(구움 '+st.baked+'·미리 '+st.grayPrebaked+')');
 const g2=cmd(s2,GF);B.process([g2]);ok(B.inspect().stats.baked===2&&g2.r409Outlined,'각성 첫 장면: 흑백 몸은 미리 구운 칸을 그대로 씀(새로 굽기 0)');
 soon=false;const s3=sprite();B.process([cmd(s3,'none')]);ok(B.inspect().stats.baked===3,'준비가 아니면 흑백 미리 굽기 안 함');
 ok(fs.readFileSync(path.join(SRC,'play-r111.js'),'utf8').includes('samongSoon:'),'R111 이 samongSoon 을 알림');}
console.log(`\nR1217 shader CPU ${n-bad}/${n} ${bad?'FAIL':'PASS'}`);process.exit(bad?1:0);
