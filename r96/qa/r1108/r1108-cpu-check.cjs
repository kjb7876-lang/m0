// R1108 네온·라우렌 좌우 공격 몸 크기 + 서하 대각 걷기(사용자 2026-11-16 06:59Z) — CPU 검사.  node r96/qa/r1108/r1108-cpu-check.cjs
//  ① R437 공격 표 body 를 실제 몸 비율(네온 .82·라우렌 .85)로 늘린 사본 — 시트·칸·발·창끝은 그대로, 다른 영웅·끈 상태는 원본 그대로.
//  ② 서하 walk-se·walk-ne 몸 그림 → walk-e 같은 칸·같은 크기·반전 유지·발 가운데 맞춤. 다른 그림·다른 영웅·그림 미준비·NaN 은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const F='hero-consist-r1108.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본과 같음');
ok(/node r96\/qa\/r1108\/r1108-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'공개 검증 목록');
{const h=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8'),i=h.indexOf('<script src="./'+F+'"></script>');
 ok(i>0&&h.split('"./'+F+'"').length===2&&h.includes('<script src="./persona-ink-r1097.js"></script>\n<script src="./'+F+'"></script>'),'스크립트 태그 한 번, persona-ink-r1097 바로 뒤(r176·r440·r895 순서 검사 사슬 밖)');
 ok(/addEventListener\('load',install\)/.test(src),'R437·R143·R895 보다 먼저 읽히므로 load 뒤 맨 바깥에서 감쌈');}
for(const k of ['runtime-inputs.json','runtime-manifest.json'])ok(fs.readFileSync(path.join(R,k),'utf8').includes(F),k+' 에 등록');
const ATK={neon:Object.freeze({path:'assets/r437/attack/neon/attack-e.webp',cell:[224,256],foot:[69,226],body:180,tips:[[1,2]]}),lauren:Object.freeze({path:'assets/r437/attack/lauren/attack-e.webp',cell:[232,256],foot:[84,226],body:205,tips:[[3,4]]})};
function load(pref,opt={}){const win={},imgs={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,Date,Promise,setInterval:()=>0,
  readyImage:q=>opt.noImage?null:({image:{naturalWidth:1536,naturalHeight:256,src:q,tag:'NEW'}}),addImage(){},player:{hero:opt.hero||'seoha'},ctx:{commands:[]},drawHero(){}};
 win.__STORYWORLD_NEON_LAUREN_R437__=Object.freeze({revision:'R437',attackSheet:(h,sd)=>sd==='e'?ATK[h]||null:null,tipFor:()=>null,attack:ATK});
 win.addEventListener=(t,f)=>{if(t==='load')win.__load=f;};vm.createContext(sb);vm.runInContext(src,sb);win.__load&&win.__load();return {api:win.__STORYWORLD_HERO_CONSIST_R1108__,win,sb};}
const near=(a,b,e=1e-6)=>Math.abs(a-b)<e;
// ① 공격 몸 크기
{const {api,win}=load(null);const r437=win.__STORYWORLD_NEON_LAUREN_R437__;ok(r437.r1108===true&&api.inspect().r437Hooked,'R437 API 에 걸림');
 const a=r437.attackSheet('neon','e');ok(near(a.body,180/.82)&&a.path===ATK.neon.path&&a.cell===ATK.neon.cell&&a.foot===ATK.neon.foot&&a.tips===ATK.neon.tips,'네온 body 180→219.5, 시트·칸·발·창끝 그대로',a);
 ok(r437.attackSheet('neon','e')===a,'같은 사본(매 프레임 새 객체 아님)');
 const l=r437.attackSheet('lauren','e');ok(near(l.body,205/.85),'라우렌 body 205→241.2',l.body);
 ok(r437.attackSheet('neon','s')===null&&r437.attackSheet('seoha','e')===null,'시트 없는 방향·영웅은 그대로 null');
 ok(ATK.neon.body===180,'원본 표는 바뀌지 않음');
 const k0=60/180,k1=60/a.body;ok(k1/k0>.8&&k1/k0<.84,'그리는 배율 0.82배(발 기준, 웅크린 만큼 머리 낮아짐)',k1/k0);}
{const {win}=load({attack:false});ok(win.__STORYWORLD_NEON_LAUREN_R437__.attackSheet('neon','e').body===180,'attack 끄면 예전 body');}
{const {win}=load({on:false});ok(win.__STORYWORLD_NEON_LAUREN_R437__.attackSheet('lauren','e').body===205,'on 끄면 예전 body');}
// ② 서하 대각 걷기
const cmd=(p,frame,mir,x0=400,y0=200,k=.25)=>{const w=192*k*(mir?-1:1);return {kind:'image',owner:{kind:'hero'},r121Walk:true,sourcePath:p,image:{tag:'OLD'},sourceRect:[frame*192,0,192,256],points:[[x0,y0],[x0+w,y0],[x0+w,y0+256*k],[x0,y0+256*k]]};};
const swap=(o,c)=>o.api.test.swapSeoha(c);
for(const [d,fx] of [['se',99.1],['ne',84.7]])for(const mir of [false,true])for(const fr of [0,7]){const o=load(null),c=cmd(`assets/r130/seoha/walk-${d}.webp`,fr,mir),k=.25,f=mir?-1:1,before=400+f*fx*k;
 ok(swap(o,c)===true&&c.sourcePath==='assets/r130/seoha/walk-e.webp'&&c.image.tag==='NEW','서하 walk-'+d+(mir?'(반전)':'')+' 칸'+fr+' → walk-e');
 ok(c.sourceRect[0]===fr*192&&c.sourceRect[2]===192&&c.sourceRect[3]===256,'같은 칸 번호',c.sourceRect);
 const P=c.points,after=P[0][0]+(P[1][0]-P[0][0])*101.7/192;ok(near(after,before,1e-6)&&near(P[3][1]-P[0][1],256*k)&&near(Math.abs(P[1][0]-P[0][0]),192*k),'발 가운데 그대로·크기 그대로',{before,after});
 ok((P[1][0]<P[0][0])===mir,'반전 유지');}
// R119 실제 경로: 칸 그림 상자만 그림(예 [1009,47,87,184] = 5번 칸) → 칸 전체로 넓혀 같은 배율·발 가운데 그대로
for(const mir of [false,true]){const o=load(null),k=.24,sr=[5*192+49,47,87,184],x0=300,y0=150,f=mir?-1:1,w=sr[2]*k*f,h=sr[3]*k;
 const c={kind:'image',owner:{kind:'hero'},sourcePath:'http://127.0.0.1:4410/m0/assets/r130/seoha/walk-se.webp',image:{},sourceRect:sr.slice(),points:[[x0,y0],[x0+w,y0],[x0+w,y0+h],[x0,y0+h]]};
 const X=v=>x0+f*(v-(sr[0]-5*192))*k,Y=v=>y0+(v-sr[1])*k,before=X(99.1);
 ok(swap(o,c)===true&&JSON.stringify(c.sourceRect)==='[960,0,192,256]','상자 그림(전체 주소)'+(mir?'(반전)':'')+' → 5번 칸 전체',c.sourceRect);
 const P=c.points,after=P[0][0]+(P[1][0]-P[0][0])*101.7/192;ok(near(after,before,1e-6)&&near(P[0][1],Y(0))&&near(P[3][1],Y(256))&&near(Math.abs(P[1][0]-P[0][0]),192*k),'상자 배율 그대로(키 같음)·발 가운데 그대로',{before,after,top:P[0][1],want:Y(0)});
 ok((P[1][0]<P[0][0])===mir,'상자 경로도 반전 유지');}
{const o=load(null);for(const p of ['assets/r130/seoha/walk-s.webp','assets/r130/seoha/walk-e.webp','assets/r130/seoha/walk-n.webp','assets/r130/seoha/idle-se.webp','assets/r130/neon/walk-se.webp','assets/r143/attack/seoha/attack-se.webp']){const c=cmd(p,2,false),j=JSON.stringify(c);ok(swap(o,c)===false&&JSON.stringify(c)===j,'그대로: '+p);}}
{const o=load(null,{noImage:true}),c=cmd('assets/r130/seoha/walk-se.webp',1,false),j=JSON.stringify(c);ok(swap(o,c)===false&&JSON.stringify(c)===j&&o.api.inspect().seohaWaiting===1,'walk-e 그림 준비 전이면 옛 그림 그대로(빈 화면 없음)');}
{const o=load(null),c=cmd('assets/r130/seoha/walk-se.webp',1,false);c.points[1][0]=NaN;const j=JSON.stringify(c);ok(swap(o,c)===false&&JSON.stringify(c)===j,'NaN 좌표는 손대지 않음');}
// drawHero 감싸기: 서하일 때만, 끄면 안 함
{// 감싸기 실제 동작: base 를 명령을 넣는 함수로 둔 채 불러오기
 const mk=(hero,pref)=>{const win={};const c=cmd('assets/r130/seoha/walk-se.webp',3,true);const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,Date,Promise,setInterval:()=>0,
   readyImage:q=>({image:{naturalWidth:1536,naturalHeight:256,src:q,tag:'NEW'}}),addImage(){},player:{hero},ctx:{commands:[{kind:'image',owner:{kind:'hero'},sourcePath:'assets/r130/seoha/walk-ne.webp',sourceRect:[0,0,192,256],points:[[0,0],[1,0],[1,1],[0,1]]}]}};
  sb.drawHero=function(){sb.ctx.commands.push(c);return 'R';};win.addEventListener=(t,f)=>{if(t==='load')win.__load=f;};vm.createContext(sb);vm.runInContext(src,sb);win.__load();const r=sb.drawHero();return {c,r,old:sb.ctx.commands[0]};};
 let x=mk('seoha',null);ok(x.r==='R'&&x.c.sourcePath==='assets/r130/seoha/walk-e.webp','감싼 drawHero: 서하 걷기 그림 바뀜, 돌려준 값 그대로');
 ok(x.old.sourcePath==='assets/r130/seoha/walk-ne.webp','감싸기 전에 있던 명령은 손대지 않음');
 for(const [h,p] of [['neon',null],['seoha',{seoha:false}],['seoha',{on:false}]]){x=mk(h,p);ok(x.c.sourcePath==='assets/r130/seoha/walk-se.webp','그대로: '+h+' '+JSON.stringify(p));}}
{const o=load(null);const s=JSON.stringify(o.api.inspect());ok(/presentationOnly":true/.test(s)&&/gameplayChanged":false/.test(s),'판정·세이브 안 바꿈 표시');}
console.log(JSON.stringify({passed:n}));
