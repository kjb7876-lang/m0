// R1097 CPU 검사: 페르소나 보스 수묵 그림(persona-ink-r1097.js) — 브라우저 없이 실제 모듈을 가짜 DOM 에서 돌린다.
//  ① 연결(태그·sync·공개 확인 목록·CI 줄)
//  ② 수묵 변환 계산(inkify): 크기·여백, 먹(무채색)·언주색(붉은 곳만 붉게)·종이(밝은 곳), 위는 짙고 아래는 옅은 세로 농담, 바깥 종이빛 여백, 같은 입력 같은 결과,
//     경계값(빈 그림·1×1·꽉 찬 그림·잘못된 인자·여백 0·큰 여백·반 크기), NaN 없음
//  ③ 고르기·바꿔 끼우기: 페르소나 보스 몸 그림 명령만(다른 몹·영웅·이펙트·탄·더하기 혼합·죽은 그림 그대로), 준비 전에는 원본 그대로 두고 굽기만 예약,
//     네 귀퉁이 넓히기(R409 테두리 여백이 있든 없든·좌우 뒤집힘), 두 번 돌려도 한 번만, 피격 필터 유지·R1090 담묵 필터는 겹치지 않음
//  ④ 켜고 끄기: 기본 켜짐, '0' 끔, 저장소 오류, 맵 수묵화풍(R1055)이 꺼졌거나 쉬는 단계면 같이 쉼 ⑤ 설정 창 줄 ⑥ 렌더러 감싸기 ⑦ 판정·입력·ctx.filter 변경 없음.
//  실제 화면은 r1097-browser.mjs(헤드리스)가 잰다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return '';}};
const res=[];const ok=(n,c,d='')=>{res.push(!!c);console.log((c?'PASS ':'FAIL ')+n+(c||d===''?'':' :: '+(typeof d==='string'?d:JSON.stringify(d))));};
const done=()=>{const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'node vm + tiny fake DOM'}));process.exit(failed?1:0);};
const NAME='persona-ink-r1097.js',F=path.join(R,'client-source',NAME);const src=rd(F);
ok('client-source/'+NAME+' exists',src.length>0);
// ---- ① 연결 ----
const html=rd(path.join(R,'runtime-text','index.html'));
ok('runtime copy identical to client-source',src.length>0&&rd(path.join(R,'runtime-text',NAME))===src);
ok('index.html loads it exactly once, on its own line',(html.match(/\n<script src="\.\/persona-ink-r1097\.js"><\/script>\n/g)||[]).length===1);
{const t=n=>html.indexOf('<script src="./'+n+'">');
 ok('after ink-chars-r1090 and ego-motion-r1048, before boot-lean-r1038 (which stays right before story-reader-r122)',t(NAME)>t('ink-chars-r1090.js')&&t('ink-chars-r1090.js')>0&&t(NAME)>t('ego-motion-r1048.js')&&t(NAME)<t('boot-lean-r1038.js')&&/<script src="\.\/boot-lean-r1038\.js"><\/script>\n<script src="\.\/story-reader-r122\.js">/.test(html));
 ok('before combat-read-r409 (R409 가 먼저 테두리를 굽고 그 뒤에 이 모듈이 바꿔 끼운다)',t(NAME)<t('combat-read-r409.js'));}
ok('verify-r96-public.py expects it',/'persona-ink-r1097\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))));
ok('runtime-inputs/manifest list it',/persona-ink-r1097\.js/.test(rd(path.join(R,'runtime-inputs.json'))+rd(path.join(R,'runtime-text','runtime-inputs.json')))&&/persona-ink-r1097\.js/.test(rd(path.join(R,'runtime-manifest.json'))+rd(path.join(R,'runtime-text','runtime-manifest.json'))));
ok('pages.yml runs this check',/node r96\/qa\/r1097\/r1097-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))));
if(!src)done();
// ---- 가짜 세계 ----
const KEY='storyworld.r1097.personaInk';
function world(stored,opt={}){
 const store=new Map(stored===undefined?[]:[[KEY,stored]]);
 const images=[],canvases=[];
 const mk=tag=>{const e={tagName:String(tag).toUpperCase(),children:[],parentNode:null,id:'',textContent:'',checked:false,type:'',className:'',style:{},width:0,height:0,
  appendChild(c){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);c.parentNode=this;this.children.push(c);return c;},
  insertBefore(c,ref){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);c.parentNode=this;const i=this.children.indexOf(ref);if(i<0)this.children.push(c);else this.children.splice(i,0,c);return c;},
  get nextElementSibling(){const p=this.parentNode;if(!p)return null;return p.children[p.children.indexOf(this)+1]||null;},
  _all(){const o=[];const w=x=>x.children.forEach(c=>{o.push(c);w(c);});w(this);return o;}};
  if(e.tagName==='CANVAS'){canvases.push(e);e.getContext=()=>e._g||(e._g={
   drawImage(img,...a){const [dx,dy,dw,dh]=a.length>=8?a.slice(4):a.length>=4?a:[a[0]||0,a[1]||0,img.width,img.height];const W=e.width,H=e.height;e._px=e._px&&e._px.length===W*H*4?e._px:new Uint8ClampedArray(W*H*4);
    if(opt.taint)e._taint=true;const sp=img._px||img.__px;if(!sp)return;
    for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=Math.min(img.width-1,Math.floor(x*img.width/dw)),sy=Math.min(img.height-1,Math.floor(y*img.height/dh)),X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;for(let k=0;k<4;k++)e._px[(Y*W+X)*4+k]=sp[(sy*img.width+sx)*4+k];}},
   getImageData(x,y,w,h){if(e._taint){const er=Error('tainted');er.name='SecurityError';throw er;}const d=new Uint8ClampedArray(w*h*4);if(e._px)for(let j=0;j<h;j++)for(let i=0;i<w;i++)for(let k=0;k<4;k++)d[(j*w+i)*4+k]=e._px[((j+y)*e.width+i+x)*4+k];return {data:d,width:w,height:h};},
   createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4),width:w,height:h};},
   putImageData(im){e._px=new Uint8ClampedArray(im.data);e._put=(e._put||0)+1;}});}
  return e;};
 const docEl=mk('html'),body=mk('body'),panel=mk('section');panel.id='panel';docEl.appendChild(body);body.appendChild(panel);
 const document={documentElement:docEl,body,readyState:'complete',baseURI:'http://game.test/m0/',createElement:mk,getElementById:id=>docEl._all().find(e=>e.id===id)||null,addEventListener(){}};
 const localStorage={getItem:k=>{if(opt.throws)throw Error('denied');return store.has(k)?store.get(k):null;},setItem:(k,v)=>{if(opt.throws)throw Error('denied');store.set(k,String(v));},removeItem:k=>{if(opt.throws)throw Error('denied');store.delete(k);}};
 const ink={mode:opt.inkMode??'all',k:opt.inkK??1};
 const calls={base:0};function Renderer(){}Renderer.prototype.render=function(frame){calls.base++;calls.last=frame;if(opt.baseThrows)throw Error('base boom');return 'drawn';};
 const inst=new Renderer();if(opt.instOwn!==false)inst.render=Renderer.prototype.render;
 const timers=[],ivals=[];
 function Image(){this.width=0;this.height=0;this.onload=null;this.onerror=null;this._src='';images.push(this);}
 Object.defineProperty(Image.prototype,'src',{get(){return this._src;},set(v){this._src=String(v);const sprite=opt.sprites&&opt.sprites(this._src);timers.push(()=>{if(sprite){this.width=this.naturalWidth=sprite.w;this.height=this.naturalHeight=sprite.h;this.__px=sprite.px;this.onload&&this.onload();}else this.onerror&&this.onerror(Error('404'));});}});
 const w={document,localStorage,console,Image,URL,setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){},setInterval:f=>{ivals.push(f);return ivals.length;},clearInterval(){},
  queueMicrotask:f=>timers.push(f),requestAnimationFrame:f=>timers.push(f),addEventListener(){},location:{href:'http://game.test/m0/index.html'},
  StoryPhase1:{ThreeRenderer:Renderer},__STORYWORLD_PHASE1__:{controller:{state:{three:opt.lateInst?null:inst}}},
  showSettings(){panel.children=[];const s=mk('section');s.id='combatScreenR1021';panel.appendChild(s);if(opt.inkRow!==false){const r=mk('div');r.id='inkRowR1055';s.appendChild(r);const c=mk('div');c.id='inkCharsRowR1090';s.appendChild(c);}return 'base';}};
 if(opt.noInk!==true)w.__STORYWORLD_INK_WASH_R1055__={inspect:()=>({k:ink.k,prefs:{mode:ink.mode}})};
 if(opt.perfStep!==undefined)w.__STORYWORLD_PERF7_R1043__={step:()=>opt.perfStep};
 if(opt.mobile)w.__STORYWORLD_MOBILE_TIER_R1023__={pcGrade:()=>false};
 w.window=w;w.globalThis=w;const ctx=vm.createContext(w);let err=null;try{vm.runInContext(src,ctx,{filename:NAME});}catch(e){err=e;}
 return {w,ctx,docEl,panel,store,err,ink,calls,inst,Renderer,images,canvases,api:w.__STORYWORLD_PERSONA_INK_R1097__,flush(){for(let i=0;i<400&&timers.length;i++)timers.shift()();},tick(){ivals.forEach(f=>f());}};}
// 시험용 그림: 투명 바탕 위 어두운 몸(40×80 가운데 20..59 × 10..89), 붉은 띠, 밝은 얼굴
function sprite(w=80,h=100){const px=new Uint8ClampedArray(w*h*4);
 for(let y=10;y<90;y++)for(let x=20;x<60;x++){const i=(y*w+x)*4;let c=[30+((x*7+y*3)%9),26+((x+y)%7),32+((x*3)%5)];
  if(y>=14&&y<24&&x>=32&&x<48)c=[236,228,220];            // 얼굴(밝음)
  if(y>=40&&y<52&&x>=24&&x<56)c=[214,36,44];              // 붉은 띠
  if(y>=70&&y<80&&x>=24&&x<40)c=[96,16,22];               // 어두운 붉은 자락
  if(y>=30&&y<36&&x>=26&&x<34)c=[40,70,200];              // 푸른 장식(언주색이 아닌 색)
  px[i]=c[0];px[i+1]=c[1];px[i+2]=c[2];px[i+3]=255;}
 return {w,h,px};}
const SP=sprite();
const A=world(undefined,{sprites:()=>SP});ok('module loads without throwing',!A.err,String(A.err&&A.err.stack));const api=A.api;
ok('api present (revision·inkify·match·process·active·enabled·set·inspect·palette)',!!api&&/^R1097/.test(api.revision||'')&&['inkify','match','process','active','enabled','set','inspect','refresh','settingsRow'].every(k=>typeof api[k]==='function')&&!!api.palette);if(!api)done();
// ---- ② 수묵 변환 ----
const at=(r,x,y)=>{const i=(y*r.width+x)*4;return [r.data[i],r.data[i+1],r.data[i+2],r.data[i+3]];};
const chroma=c=>Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2]),lum=c=>.299*c[0]+.587*c[1]+.114*c[2];
const mean=(r,x0,y0,x1,y1,f)=>{let s=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){s+=f(at(r,x,y));n++;}return s/n;};
{const P=api.palette;
 ok('palette: 언주색 계열(짙은 언주·언주·주홍·옅은 빛) + 먹 + 종이, R1095 공통 값과 같음',P.yeonji==='#841e16'&&P.juhong==='#cc3428'&&P.deep==='#460e0a'&&P.pale==='#ffb08c'&&P.ink==='#12161c'&&P.white==='#f3eee2',P);
 const r=api.inkify(SP.px,SP.w,SP.h,{pad:10,seed:3});const p=10;
 ok('inkify: 사방 여백만큼 큰 그림을 돌려준다',!!r&&r.width===SP.w+20&&r.height===SP.h+20&&r.pad===10&&r.data.length===r.width*r.height*4,r&&[r.width,r.height]);
 let nan=0;for(let i=0;i<r.data.length;i++)if(!Number.isFinite(r.data[i]))nan++;ok('inkify: NaN·Infinity 없음',nan===0);
 ok('먹: 어두운 몸은 무채색에 가까운 먹빛(평균 색차 ≤ 14)',mean(r,p+42,p+56,p+58,p+68,chroma)<=14,mean(r,p+42,p+56,p+58,p+68,chroma));
 const band=mean(r,p+28,p+43,p+52,p+49,c=>c[0]-Math.max(c[1],c[2])),bandG=mean(r,p+28,p+43,p+52,p+49,c=>c[1]);
 ok('언주색: 붉은 띠는 붉게 남는다(빨강이 초록·파랑보다 평균 70 이상 큼, 주홍·언주 사이)',band>=70&&bandG<90,{band,bandG});
 const dk=mean(r,p+27,p+72,p+37,p+78,c=>c[0]-Math.max(c[1],c[2])),dkL=mean(r,p+27,p+72,p+37,p+78,lum);
 ok('언주색 농담: 어두운 붉은 자락은 짙은 언주(붉되 띠보다 어둡다)',dk>=25&&dkL<mean(r,p+28,p+43,p+52,p+49,lum),{dk,dkL});
 ok('언주색 단독: 푸른 장식은 푸른빛을 잃는다(원본은 파랑이 빨강보다 160 큼 → 먹색 #12161c 자체의 차이 10 을 넘지 않는다)',mean(r,p+28,p+31,p+32,p+35,c=>c[2]-c[0])<=11,mean(r,p+28,p+31,p+32,p+35,c=>c[2]-c[0]));
 ok('여백(종이): 밝은 얼굴은 종이빛(밝기 ≥ 170, 색차 ≤ 40)',mean(r,p+35,p+16,p+45,p+22,lum)>=170&&mean(r,p+35,p+16,p+45,p+22,chroma)<=40,[mean(r,p+35,p+16,p+45,p+22,lum),mean(r,p+35,p+16,p+45,p+22,chroma)]);
 // 세로 농담: 같은 어두운 천이 위(두건 쪽)보다 아래(옷자락)에서 옅다 — 붉지 않은 가운데 줄만 비교
 const top=mean(r,p+44,p+26,p+56,p+34,lum),bot=mean(r,p+44,p+60,p+56,p+68,lum);
 ok('세로 농담: 위는 짙고 아래로 갈수록 먹이 빠진다(아래 밝기가 위보다 12 이상 높음)',bot-top>=12,{top,bot});
 // 바깥 여백: 몸 바로 바깥(원래 투명)에 종이빛 알파가 있고, 그림 끝에서는 0 으로 사라진다
 const near=at(r,p+16,p+50),far=at(r,1,p+50),corner=at(r,0,0);
 let haloSum=0,haloN=0;for(let y=p+12;y<p+60;y++){const c=at(r,p+17,y);haloSum+=c[3];haloN++;}
 ok('여백 테두리: 몸 바깥 3픽셀에 종이빛이 깔린다(평균 알파 ≥ 20, 밝기 ≥ 150)',haloSum/haloN>=20&&mean(r,p+17,p+12,p+18,p+60,c=>c[3]>8?lum(c):200)>=150,{a:haloSum/haloN,near});
 ok('여백은 그림 가장자리에서 사라진다(끝 줄 알파 ≤ 6) — 네모 판이 보이지 않게',far[3]<=6&&corner[3]<=6&&(()=>{let m=0;for(let x=0;x<r.width;x++){m=Math.max(m,at(r,x,0)[3],at(r,x,r.height-1)[3]);}for(let y=0;y<r.height;y++){m=Math.max(m,at(r,0,y)[3],at(r,r.width-1,y)[3]);}return m;})()<=6,{far,corner});
 ok('몸 안쪽은 불투명 그대로(가운데 알파 255)',at(r,p+40,p+60)[3]===255);
 const r2=api.inkify(SP.px,SP.w,SP.h,{pad:10,seed:3});let same=r2.data.length===r.data.length;for(let i=0;same&&i<r.data.length;i++)if(r.data[i]!==r2.data[i])same=false;
 ok('같은 입력·같은 씨앗이면 같은 결과(Math.random 안 씀)',same&&!/Math\.random/.test(src));
 const r3=api.inkify(SP.px,SP.w,SP.h,{pad:10,seed:9});let diff=0;for(let i=0;i<r.data.length;i++)if(r.data[i]!==r3.data[i])diff++;ok('씨앗이 다르면 붓 자국이 달라진다(방향마다 다른 결)',diff>200,diff);
 ok('원본 화소 배열은 바꾸지 않는다',SP.px[(50*SP.w+40)*4]===sprite().px[(50*SP.w+40)*4]&&SP.px[(45*SP.w+40)*4]===214);
 // 경계값
 const empty=api.inkify(new Uint8ClampedArray(16*16*4),16,16,{pad:4});ok('빈(투명) 그림 → 전부 투명',!!empty&&empty.width===24&&empty.data.every(v=>v===0));
 const one=api.inkify(new Uint8ClampedArray([200,30,30,255]),1,1,{pad:2});ok('1×1 그림도 오류 없이',!!one&&one.width===5&&one.height===5&&one.data.every(Number.isFinite));
 const full=new Uint8ClampedArray(12*12*4).fill(255);for(let i=0;i<full.length;i+=4){full[i]=20;full[i+1]=20;full[i+2]=24;}const fr=api.inkify(full,12,12,{pad:0});
 ok('여백 0·꽉 찬 그림: 크기 그대로, 전부 불투명',!!fr&&fr.width===12&&fr.height===12&&(()=>{for(let i=3;i<fr.data.length;i+=4)if(fr.data[i]!==255)return false;return true;})());
 ok('잘못된 인자 → null (던지지 않음)',api.inkify(null,10,10)===null&&api.inkify(SP.px,0,10)===null&&api.inkify(SP.px,-3,10)===null&&api.inkify(SP.px,NaN,NaN)===null&&api.inkify(new Uint8ClampedArray(8),10,10)===null);
 const big=api.inkify(SP.px,SP.w,SP.h,{pad:9999});ok('여백은 48 로 묶인다',!!big&&big.pad===48&&big.width===SP.w+96);
 const wild=api.inkify(SP.px,SP.w,SP.h,{pad:NaN,seed:Infinity,halo:NaN,fall:-Infinity,strength:NaN,unit:NaN});ok('이상한 옵션(NaN·Infinity)은 기본값으로',!!wild&&wild.data.every(Number.isFinite)&&wild.width>SP.w);
 const half=api.inkify(SP.px,SP.w,SP.h,{pad:6,unit:.5});ok('unit .5(반 크기용) 도 같은 규칙으로 동작',!!half&&half.width===SP.w+12&&mean(half,6+28,6+43,6+52,6+49,c=>c[0]-Math.max(c[1],c[2]))>=60);
}
// ---- ③ 고르기·바꿔 끼우기 ----
const STYLE=o=>({globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'#080e16',filter:'none',lineWidth:1,...o});
const quad=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const BASE='assets/rc133/art/base-1.png',URLB='http://game.test/m0/'+BASE;
function body(o={}){const padR=o.r409===false?0:12,cw=SP.w+2*padR,ch=SP.h+2*padR,img={width:cw,height:ch,tag:'orig'};
 return {kind:'image',key:'enemy:cult04:inner-evil-rc133:0',owner:{id:'enemy:cult04:inner-evil-rc133',kind:'enemy',x:5,y:5,bodyPath:o.bodyPath??BASE,alive:o.alive??true,groundAligned:false,...(o.owner||{})},order:700,image:img,mutable:false,
  sourcePath:o.path??(padR?'r409:outline:enemy:u:'+URLB.replace(BASE,o.bodyPath??BASE)+':0,0,'+SP.w+','+SP.h+':11:enemy':(o.bodyPath??BASE)),immutableTint:{path:'x'},sourceRect:[0,0,cw,ch],imageSize:[cw,ch],
  points:o.points??quad(100,200,cw,ch),clips:[],style:STYLE(o.style),spatialRole:o.role===undefined?'body':o.role};}
ok('match: base-0..7·awake-0..7 만 페르소나 몸 그림',[0,3,7].every(i=>api.match('assets/rc133/art/base-'+i+'.png')?.dir===i&&api.match('http://x/m0/assets/rc133/art/awake-'+i+'.png?v=2')?.kind==='awake')&&
 [null,'','assets/rc133/art/base-8.png','assets/rc133/art/arena.webp','assets/rc133/art/eclipse.png','assets/rc134/persona-skills/eye.png','assets/rc133/art/chrono-3.png','assets/rc1330/art/base-1.png','xassets/rc133/art/base-1.pngx'].every(v=>api.match(v)===null));
{const c=body(),before=JSON.stringify(c.points),img=c.image;const n=api.process([c]);
 ok('준비 전: 원본 그대로 두고(그림·좌표 안 바뀜) 굽기만 예약',n===0&&c.image===img&&JSON.stringify(c.points)===before&&!c.r1097&&A.images.length>=1,{n,imgs:A.images.length});
 ok('원본 그림은 같은 주소에서 CORS 로 한 번만 받는다',A.images[0].src===URLB&&A.images[0].crossOrigin==='anonymous'&&(api.process([body()]),A.images.filter(i=>i.src===URLB).length===1),A.images.map(i=>i.src));
 A.flush();
 const st=api.inspect();ok('받은 뒤 구워서 캐시에 둔다(오류 0)',st.ready>=1&&st.errors===0,st);
 const c2=body({style:{filter:'brightness(1.6)'}});const st0=c2.style;const n2=api.process([c2]);
 ok('준비 뒤: 몸 그림을 수묵 캔버스로 바꾼다(image·sourcePath·sourceRect·imageSize·mutable=false)',n2===1&&c2.r1097===true&&c2.image!==img&&c2.image.tagName==='CANVAS'&&/^r1097:ink:/.test(c2.sourcePath)&&c2.immutableTint?.path===c2.sourcePath&&c2.sourceRect.join()===[0,0,c2.image.width,c2.image.height].join()&&c2.imageSize.join()===[c2.image.width,c2.image.height].join()&&c2.mutable===false,{n2,sp:c2.sourcePath});
 const pad=(c2.image.width-SP.w)/2;
 ok('수묵 캔버스는 원본 + 사방 같은 여백(여백 8~48), 화소가 실제로 들어 있다',pad>=8&&pad<=48&&(c2.image.height-SP.h)/2===pad&&c2.image._put===1&&c2.image._px.some(v=>v>0),{pad});
 // 좌표: R409 여백 12 로 넓혀진 네 귀퉁이 → 내 여백으로 다시. 원본 한 칸 = 화면 1픽셀인 시험 좌표라 계산이 쉽다
 const g=pad-12;ok('네 귀퉁이를 여백 차이만큼 넓힌다(R409 테두리 여백 12 고려)',JSON.stringify(c2.points)===JSON.stringify(quad(100-g,200-g,SP.w+2*pad,SP.h+2*pad)),c2.points);
 ok('피격 번쩍임 필터는 그대로, R1090 담묵은 겹치지 않게 표시',c2.style.filter==='brightness(1.6)'&&c2.r1090===true&&st0.filter==='brightness(1.6)');
 const snap=JSON.stringify(c2.points),im2=c2.image;api.process([c2]);ok('두 번 돌려도 한 번만(좌표가 또 넓어지지 않는다)',JSON.stringify(c2.points)===snap&&c2.image===im2);
 const c3=body({r409:false});api.process([c3]);ok('R409 테두리가 꺼져 있어도(원본 크기 명령) 여백만큼 넓힌다',c3.r1097===true&&JSON.stringify(c3.points)===JSON.stringify(quad(100-pad,200-pad,SP.w+2*pad,SP.h+2*pad)),c3.points);
 // 좌우 뒤집힘·기울어진 네모(R425 가 거울로 바로잡은 좌표)
 const cw=SP.w+24,ch=SP.h+24,flip=[[100+cw,200],[100,200],[100,200+ch],[100+cw,200+ch]];const c4=body({points:flip});api.process([c4]);
 ok('좌우로 뒤집힌 좌표도 같은 비율로 넓힌다',c4.r1097===true&&JSON.stringify(c4.points)===JSON.stringify([[100+cw+g,200-g],[100-g,200-g],[100-g,200+ch+g],[100+cw+g,200+ch+g]]),c4.points);
 const c5=body({points:quad(100,200,cw/4,ch/4)});api.process([c5]);const s=1/4;
 ok('화면에서 1/4 로 줄어든 크기면 넓히는 양도 1/4',c5.points.every((q,i)=>Math.abs(q[0]-quad(100-g*s,200-g*s,(SP.w+2*pad)*s,(SP.h+2*pad)*s)[i][0])<1e-9&&Math.abs(q[1]-quad(100-g*s,200-g*s,(SP.w+2*pad)*s,(SP.h+2*pad)*s)[i][1])<1e-9),c5.points);
 // R1090 이 먼저 돌아 담묵 필터가 이미 붙은 경우 → 떼어 낸다(수묵 그림을 또 탈색하지 않음)
 const c6=body({style:{filter:'brightness(1.2) saturate(.5) contrast(1.08)'}});c6.r1090=true;api.process([c6]);ok('R1090 담묵 필터가 이미 붙어 있으면 그 조각만 뗀다',c6.style.filter==='brightness(1.2)',c6.style.filter);
 const c7=body({style:{filter:'saturate(.5) contrast(1.08)'}});c7.r1090=true;api.process([c7]);ok('담묵 필터만 있었으면 none',c7.style.filter==='none',c7.style.filter);
 // 건드리지 않는 것
 const keep=(name,c)=>{const im=c.image,pt=JSON.stringify(c.points),sp=c.sourcePath;const n=api.process([c]);ok('그대로: '+name,n===0&&c.image===im&&JSON.stringify(c.points)===pt&&c.sourcePath===sp&&!c.r1097);};
 keep('다른 몹 몸 그림',body({bodyPath:'assets/r763/villagers/fisher-walk.webp'}));
 keep('영웅',body({owner:{kind:'hero'}}));
 keep('페르소나 이펙트·탄(rc134 persona-skills, owner effect)',{...body({bodyPath:null,path:'assets/rc134/persona-skills/eye.png'}),owner:{id:'fx',kind:'effect'}});
 keep('페르소나 경로라도 owner 가 이펙트면(잔상·표식)',{...body(),owner:{id:'r434:rank:cult04:inner-evil-rc133',kind:'effect',groundAligned:true}});
 keep('더하기 혼합(빛)',body({style:{globalCompositeOperation:'lighter'}}));
 keep('바닥에 붙는 그림',body({owner:{groundAligned:true}}));
 keep('결투장 배경(arena.webp)',{...body({bodyPath:null,path:'assets/rc133/art/arena.webp'}),owner:{id:'ground',kind:'ground'}});
 keep('글자·채움 명령',{...body(),kind:'fill'});
 keep('크기가 맞지 않는 그림(원본도 R409 여백판도 아님)',(()=>{const c=body();c.sourceRect=[0,0,300,300];c.imageSize=[300,300];return c;})());
 keep('잘라 쓴 그림(sourceRect 가 0,0 에서 시작하지 않음)',(()=>{const c=body();c.sourceRect=[4,0,SP.w+24,SP.h+24];return c;})());
 keep('좌표가 망가진 명령(NaN)',body({points:[[NaN,0],[1,0],[1,1],[0,1]]}));
 keep('좌표 없음',(()=>{const c=body();c.points=null;return c;})());
 ok('명령 목록이 배열이 아니거나 이상한 값이 섞여도 던지지 않는다',api.process(null)===0&&api.process('x')===0&&api.process([null,undefined,7,{},{kind:'image'},{kind:'image',owner:null}])===0);
 // 각성 그림은 따로 굽는다
 const aw=body({bodyPath:'assets/rc133/art/awake-4.png'});api.process([aw]);ok('각성(awake) 그림은 처음엔 원본, 따로 받아 굽는다',!aw.r1097&&A.images.some(i=>/awake-4\.png$/.test(i.src)));A.flush();
 const aw2=body({bodyPath:'assets/rc133/art/awake-4.png'});api.process([aw2]);ok('각성 그림도 구운 뒤 바뀐다(base 와 다른 캔버스)',aw2.r1097===true&&aw2.image!==c2.image&&/awake-4/.test(aw2.sourcePath));
 ok('한 번 페르소나를 보면 나머지 방향(base·awake 16장)도 미리 굽기 시작한다',new Set(A.images.map(i=>i.src)).size===16,new Set(A.images.map(i=>i.src)).size);
 ok('캐시는 16장을 넘지 않는다',api.inspect().cached<=16);
}
// 받기 실패·오염된 캔버스 → 원본 그대로, 다시 조르지 않음
{const B=world(undefined,{sprites:()=>null});const c=body();B.api.process([c]);B.flush();const im=c.image;const n=B.api.process([c]);B.api.process([body()]);
 ok('원본 그림을 못 받으면: 원본 그대로, 같은 주소를 다시 받지 않는다',n===0&&c.image===im&&B.images.filter(i=>i.src===URLB).length===1&&B.api.inspect().failed>=1,B.api.inspect());}
{const B=world(undefined,{sprites:()=>SP,taint:true});const c=body();B.api.process([c]);B.flush();const n=B.api.process([c]);
 ok('화소를 읽을 수 없는(보안 오류) 그림: 원본 그대로, 던지지 않는다',n===0&&!c.r1097&&B.api.inspect().failed>=1,B.api.inspect());}
// 성능: 모바일·낮은 성능 단계는 반 크기로 굽는다
{const B=world(undefined,{sprites:()=>SP,mobile:true});B.api.process([body()]);B.flush();const c=body();B.api.process([c]);
 const C=world(undefined,{sprites:()=>SP});C.api.process([body()]);C.flush();const d=body();C.api.process([d]);
 ok('모바일(PC급 아님)은 반 크기로 구워 메모리·굽는 시간을 줄인다',c.r1097===true&&d.r1097===true&&c.image.width*c.image.height<d.image.width*d.image.height*.4,[c.image?.width,d.image?.width]);
 const bw=(q)=>Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1]);ok('반 크기여도 화면에 그리는 크기는 같다(오차 2% 안)',Math.abs(bw(c.points)-bw(d.points))<=bw(d.points)*.02,[bw(c.points),bw(d.points)]);
 const E=world(undefined,{sprites:()=>SP,perfStep:4});E.api.process([body()]);E.flush();const e=body();E.api.process([e]);ok('성능 4단계 이하도 반 크기',e.r1097===true&&e.image.width===c.image.width,[e.image?.width,c.image?.width]);}
// ---- ④ 켜고 끄기 ----
ok('기본 켜짐',api.enabled()===true&&api.active()===true&&A.store.get(KEY)===undefined);
{api.set(false);const c=body();const n=api.process([c]);ok("끄면 바꾸지 않고 '0' 저장",n===0&&!c.r1097&&A.store.get(KEY)==='0'&&api.enabled()===false);
 api.set(true);ok('다시 켜면 저장값 지움, 바로 다시 바뀜',A.store.get(KEY)===undefined&&api.process([body()])===1);
 ok('set 에 불리언이 아닌 값은 무시',api.set('no')===true&&api.set(0)===true&&api.set()===true&&api.enabled()===true);}
{const B=world('0',{sprites:()=>SP});B.api.process([body()]);B.flush();ok("저장값 '0' 이면 꺼진 채 시작(그림도 받지 않음)",B.api.enabled()===false&&B.api.process([body()])===0&&B.images.length===0);}
{const B=world('banana',{sprites:()=>SP});ok('이상한 저장값은 켜짐으로',B.api.enabled()===true);}
{const B=world(undefined,{sprites:()=>SP,throws:true});ok('저장소가 막혀도 던지지 않고 켜짐',!B.err&&B.api.enabled()===true&&B.api.set(false)===false&&B.api.inspect().errors===0);}
for(const [name,o] of [['맵 수묵화풍 off',{inkMode:'off'}],['쉬는 성능 단계(k=0)',{inkK:0}],['k 가 NaN',{inkK:NaN}],['R1055 모듈 없음',{noInk:true}]]){
 const B=world(undefined,{sprites:()=>SP,...o});B.api.process([body()]);B.flush();ok(name+' → 같이 쉰다(원본 그대로, 받지도 않음)',B.api.active()===false&&B.api.process([body()])===0&&B.images.length===0);}
{const B=world(undefined,{sprites:()=>SP});B.api.process([body()]);B.flush();B.ink.k=0;B.tick();const c=body();ok('켜져 있다가 맵 수묵이 쉬면 다음 확인(0.5초) 뒤 원본으로',B.api.process([c])===0&&!c.r1097);B.ink.k=1;B.tick();ok('다시 켜지면 돌아온다',B.api.process([body()])===1);}
// ---- ⑤ 설정 창 줄 ----
{const B=world(undefined,{sprites:()=>SP});const r=B.w.showSettings();B.flush();const row=B.w.document.getElementById('personaInkRowR1097'),box=B.w.document.getElementById('personaInkOnR1097'),host=B.w.document.getElementById('combatScreenR1021');
 ok('showSettings 원래 결과 유지 + 전투 화면 구역에 줄 하나',r==='base'&&!!row&&row.parentNode===host&&host.children.filter(c=>c.id==='personaInkRowR1097').length===1);
 ok("줄은 '캐릭터 담묵' 줄 뒤에 온다, 체크됨, 이름에 '페르소나'",!!row&&host.children.indexOf(row)>host.children.indexOf(B.w.document.getElementById('inkCharsRowR1090'))&&box?.checked===true&&/페르소나/.test(row._all().map(e=>e.textContent).join('')));
 if(box){box.checked=false;box.onchange();ok('체크를 풀면 꺼지고 저장',B.api.enabled()===false&&B.store.get(KEY)==='0');box.checked=true;box.onchange();ok('다시 체크하면 켜짐',B.api.enabled()===true&&!B.store.has(KEY));}
 B.w.showSettings();B.flush();B.w.showSettings();B.flush();ok('설정 창을 여러 번 열어도 줄은 하나',B.w.document.getElementById('combatScreenR1021').children.filter(c=>c.id==='personaInkRowR1097').length===1);
 const C=world(undefined,{inkRow:false});C.w.showSettings();C.flush();ok('수묵 줄이 없는 화면에서도 던지지 않고 구역 끝에 붙는다',!!C.w.document.getElementById('personaInkRowR1097')&&C.api.inspect().errors===0);}
// ---- ⑥ 렌더러 감싸기 ----
{const B=world(undefined,{sprites:()=>SP});B.api.process([body()]);B.flush();B.tick();
 const f={commands:[body(),body({bodyPath:'assets/r763/villagers/fisher-walk.webp'})]};const out=B.inst.render(f);
 ok('인스턴스 render: 원래 결과 유지, 한 번만 그림, 페르소나만 바뀜',out==='drawn'&&B.calls.base===1&&f.commands[0].r1097===true&&!f.commands[1].r1097);
 const f2={commands:[body()]};B.Renderer.prototype.render.call(new B.Renderer(),f2);ok('프로토타입 render 도 감싼다',f2.commands[0].r1097===true);
 ok('명령이 없는 프레임·이상한 프레임도 그대로 넘긴다',B.inst.render(null)==='drawn'&&B.inst.render({})==='drawn'&&B.inst.render({commands:'x'})==='drawn');
 B.tick();B.tick();const f3={commands:[body()]};B.inst.render(f3);ok('여러 번 확인해도 한 겹만 감싼다(한 프레임에 한 번 처리)',B.api.inspect().frames===B.api.inspect().frames&&f3.commands[0].r1097===true&&B.calls.base===6,B.calls.base);
 const C=world(undefined,{sprites:()=>SP,baseThrows:true});let threw=false;try{C.inst.render({commands:[]});}catch(e){threw=/base boom/.test(e.message);}ok('원래 render 가 던지면 그대로 전달(삼키지 않음)',threw);
 const D=world(undefined,{sprites:()=>SP,lateInst:true});D.w.__STORYWORLD_PHASE1__.controller.state.three=D.inst;D.tick();D.api.process([body()]);D.flush();const f4={commands:[body()]};D.inst.render(f4);ok('렌더러가 늦게 생겨도 감싼다',f4.commands[0].r1097===true);}
// ---- ⑦ 건드리지 않는 것 ----
ok('ctx.filter·drop-shadow·blur( 를 쓰지 않는다(Three 기록기 Legacy 방지)',!/\.filter\s*=\s*['"`]/.test(src.replace(/style=\{[^}]*\}/g,''))&&!/drop-shadow|blur\(/.test(src));
ok('키 입력·판정·피해·저장 게임에 손대지 않는다',!/addEventListener\(\s*['"]key|\.hp\s*[-+*]?=|saveGame|\.damage\s*=|room\.enemies\s*=/.test(src));
ok('새 그림 파일을 싣지 않는다(코드만 — 원본 rc133 그림을 실행 중에 변환)',!/\.(png|webp|jpg)['"]/.test(src.replace(/rc133[^'"]*/g,'')));
done();
