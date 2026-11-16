// R1099 CPU 검사: 히든 영웅 EGO 수묵 그림(ego-ink-r1099.js) — 브라우저 없이 실제 모듈을 가짜 DOM 에서 돌린다.
//  ① 연결(태그·sync·공개 확인 목록·CI 줄)
//  ② 수묵 변환 계산(inkCell·inkSheet·sharpen·usedBox·levelsOf): 크기, 무채색=먹(채도 없음)·붉은 곳=언주·금빛=언주 밴 흰빛, 바깥 종이빛 여백·칸 끝 투명,
//     같은 입력 같은 결과, 시트 농담 기준 공유, 경계값(빈 그림·1×1·잘못된 인자·NaN 기준값·큰 배율), NaN 없음, 언샤프가 밝기 차이를 키움
//  ③ 고르기·바꿔 끼우기: EGO 몸 시트 명령만(이펙트·다른 영웅·몹·다른 혼합 그대로), 준비 전에는 원본 그대로·굽기 예약, 준비 뒤 칸·네 귀퉁이(원본·R409 여백·좌우 뒤집힘),
//     두 번 돌려도 한 번만, 피격 필터 유지·R1090 담묵 필터는 겹치지 않음, R409 테 다시 굽지 않음 표시, 칸 크기 안 맞으면 그대로
//  ④ 켜고 끄기(기본 켜짐·'0' 끔·저장소 오류·맵 수묵화풍 꺼짐/쉼) ⑤ 설정 창 줄 ⑥ 렌더러 감싸기 ⑦ 판정·입력·ctx.filter 변경 없음
//  실제 화면은 r1099-browser.mjs(헤드리스)가 잰다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return '';}};
const res=[];const ok=(n,c,d='')=>{res.push(!!c);console.log((c?'PASS ':'FAIL ')+n+(c||d===''?'':' :: '+(typeof d==='string'?d:JSON.stringify(d))));};
const done=()=>{const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'node vm + tiny fake DOM'}));process.exit(failed?1:0);};
const NAME='ego-ink-r1099.js',F=path.join(R,'client-source',NAME);const src=rd(F);
ok('client-source/'+NAME+' exists',src.length>0);
// ---- ① 연결 ----
const html=rd(path.join(R,'runtime-text','index.html'));
ok('runtime copy identical to client-source',src.length>0&&rd(path.join(R,'runtime-text',NAME))===src);
ok('index.html loads it exactly once, on its own line',(html.match(/\n<script src="\.\/ego-ink-r1099\.js"><\/script>\n/g)||[]).length===1);
{const t=n=>html.indexOf('<script src="./'+n+'">');
 ok('right after ego-paint-r1039 (EGO 묶음 안, ego-sovereign-r1046-data 앞), before boot-lean-r1038',t('ego-paint-r1039.js')>0&&/<script src="\.\/ego-paint-r1039\.js"><\/script>\n<script src="\.\/ego-ink-r1099\.js"><\/script>\n<script src="\.\/ego-sovereign-r1046-data\.js">/.test(html)&&t(NAME)<t('boot-lean-r1038.js'));
 ok('before combat-read-r409 (R409 가 먼저 테두리를 굽고 그 뒤에 이 모듈이 바꿔 끼운다)',t(NAME)>0&&t(NAME)<t('combat-read-r409.js'));}
ok('verify-r96-public.py expects it',/'ego-ink-r1099\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))));
ok('runtime-inputs/manifest list it',/ego-ink-r1099\.js/.test(rd(path.join(R,'runtime-inputs.json')))&&/ego-ink-r1099\.js/.test(rd(path.join(R,'runtime-manifest.json'))));
ok('pages.yml runs this check',/node r96\/qa\/r1099\/r1099-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))));
if(!src)done();
// ---- 가짜 세계 ----
const KEY='storyworld.r1099.egoInk',CELL=40;
function world(stored,opt={}){
 const store=new Map(stored===undefined?[]:[[KEY,stored]]);const images=[];
 const mk=tag=>{const e={tagName:String(tag).toUpperCase(),children:[],parentNode:null,id:'',textContent:'',checked:false,type:'',className:'',style:{},width:0,height:0,
  appendChild(c){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);c.parentNode=this;this.children.push(c);return c;},
  insertBefore(c,ref){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);c.parentNode=this;const i=this.children.indexOf(ref);if(i<0)this.children.push(c);else this.children.splice(i,0,c);return c;},
  get nextElementSibling(){const p=this.parentNode;if(!p)return null;return p.children[p.children.indexOf(this)+1]||null;},
  _all(){const o=[];const w=x=>x.children.forEach(c=>{o.push(c);w(c);});w(this);return o;}};
  if(e.tagName==='CANVAS'){e.getContext=()=>e._g||(e._g={imageSmoothingEnabled:true,imageSmoothingQuality:'low',
   drawImage(img,...a){let sx=0,sy=0,sw=img.width,sh=img.height,dx,dy,dw,dh;if(a.length>=8)[sx,sy,sw,sh,dx,dy,dw,dh]=a;else if(a.length>=4)[dx,dy,dw,dh]=a;else{dx=a[0]||0;dy=a[1]||0;dw=sw;dh=sh;}
    const W=e.width,H=e.height;if(!e._px||e._px.length!==W*H*4)e._px=new Uint8ClampedArray(W*H*4);if(opt.taint)e._taint=true;const sp=img._px||img.__px;if(!sp)return;
    for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const ix=Math.min(img.width-1,Math.floor(sx+x*sw/dw)),iy=Math.min(img.height-1,Math.floor(sy+y*sh/dh));
     const si=(iy*img.width+ix)*4,di=(Y*W+X)*4,a2=sp[si+3]/255;if(!(a2>0))continue;for(let k=0;k<3;k++)e._px[di+k]=sp[si+k]*a2+e._px[di+k]*(1-a2);e._px[di+3]=Math.min(255,sp[si+3]+e._px[di+3]*(1-a2));}},
   getImageData(x,y,w,h){if(e._taint){const er=Error('tainted');er.name='SecurityError';throw er;}const d=new Uint8ClampedArray(w*h*4);if(e._px)for(let j=0;j<h;j++)for(let i=0;i<w;i++)for(let k=0;k<4;k++)d[(j*w+i)*4+k]=e._px[((j+y)*e.width+i+x)*4+k];return {data:d,width:w,height:h};},
   createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4),width:w,height:h};},
   putImageData(im){e._px=new Uint8ClampedArray(im.data);}});}
  return e;};
 const docEl=mk('html'),body=mk('body'),panel=mk('section');panel.id='panel';docEl.appendChild(body);body.appendChild(panel);
 const document={documentElement:docEl,body,readyState:'complete',baseURI:'http://game.test/m0/',createElement:mk,getElementById:id=>docEl._all().find(e=>e.id===id)||null,addEventListener(){}};
 const localStorage={getItem:k=>{if(opt.throws)throw Error('denied');return store.has(k)?store.get(k):null;},setItem:(k,v)=>{if(opt.throws)throw Error('denied');store.set(k,String(v));},removeItem:k=>{if(opt.throws)throw Error('denied');store.delete(k);}};
 const ink={mode:opt.inkMode??'all',k:opt.inkK??1};
 const calls={base:0};function Renderer(){}Renderer.prototype.render=function(frame){calls.base++;calls.last=frame;if(opt.baseThrows)throw Error('base boom');return 'drawn';};
 const inst=new Renderer();if(opt.instOwn!==false)inst.render=Renderer.prototype.render;
 const timers=[],ivals=[];
 function Image(){this.width=0;this.height=0;this.onload=null;this.onerror=null;this._src='';images.push(this);}
 Object.defineProperty(Image.prototype,'src',{get(){return this._src;},set(v){this._src=String(v);const sheet=opt.sheets&&opt.sheets(this._src);timers.push(()=>{if(sheet){this.width=this.naturalWidth=sheet.w;this.height=this.naturalHeight=sheet.h;this.__px=sheet.px;this.onload&&this.onload();}else this.onerror&&this.onerror(Error('404'));});}});
 const w={document,localStorage,console,Image,URL,performance:{now:()=>0},setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){},setInterval:f=>{ivals.push(f);return ivals.length;},clearInterval(){},
  queueMicrotask:f=>timers.push(f),requestAnimationFrame:f=>timers.push(f),addEventListener(){},location:{href:'http://game.test/m0/index.html'},
  __STORYWORLD_EGO_MOTION_R1048_SHEETS__:{cell:CELL,base:'assets/r1048/ego/',ext:'webp',actions:{}},
  StoryPhase1:{ThreeRenderer:Renderer},__STORYWORLD_PHASE1__:{controller:{state:{three:inst}}},
  showSettings(){panel.children=[];const s=mk('section');s.id='combatScreenR1021';panel.appendChild(s);for(const id of ['inkRowR1055','inkCharsRowR1090','tailRow']){const r=mk('div');r.id=id;s.appendChild(r);}return 'base';}};
 if(opt.noInk!==true)w.__STORYWORLD_INK_WASH_R1055__={inspect:()=>({k:ink.k,prefs:{mode:ink.mode}})};
 if(opt.perfStep!==undefined)w.__STORYWORLD_PERF7_R1043__={step:()=>opt.perfStep};
 if(opt.mobile)w.__STORYWORLD_MOBILE_TIER_R1023__={pcGrade:()=>false};
 if(opt.filter)w.__STORYWORLD_INK_CHARS_R1090__={FILTER:'saturate(.5) contrast(1.08)'};
 w.window=w;w.globalThis=w;const ctx=vm.createContext(w);let err=null;try{vm.runInContext(src,ctx,{filename:NAME});}catch(e){err=e;}
 return {w,ctx,docEl,panel,store,err,ink,calls,inst,Renderer,images,api:w.__STORYWORLD_EGO_INK_R1099__,flush(){for(let i=0;i<4000&&timers.length;i++)timers.shift()();},tick(){ivals.forEach(f=>f());}};}
// 시험용 칸 그림(cell×cell): 어두운 옷(회색), 붉은 머리칼 띠, 금빛 장식, 흰 얼굴. 프레임마다 1화소씩 움직인다
function cellPx(c,f){const px=new Uint8ClampedArray(c*c*4);
 for(let y=8;y<34;y++)for(let x=12+f;x<26+f;x++){const i=(y*c+x)*4;let col=[44+((x*5+y*3)%9),42+((x+y)%7),46+(x%5)];
  if(y<12)col=[232,226,220];                        // 흰 얼굴
  if(y>=14&&y<18&&x<18+f)col=[200,30,36];          // 붉은 머리칼
  if(y>=24&&y<26)col=[206,168,64];                  // 금빛 띠
  px[i]=col[0];px[i+1]=col[1];px[i+2]=col[2];px[i+3]=255;}
 return px;}
function sheet(n=4,c=CELL){const W=c*n,px=new Uint8ClampedArray(W*c*4);for(let f=0;f<n;f++){const p=cellPx(c,f);for(let y=0;y<c;y++)for(let x=0;x<c;x++)for(let k=0;k<4;k++)px[(y*W+f*c+x)*4+k]=p[(y*c+x)*4+k];}return {w:W,h:c,px};}
const SH=sheet();
const A=world(undefined,{sheets:u=>/assets\/r1048\/ego\//.test(u)?SH:null});ok('module loads without throwing',!A.err,String(A.err&&A.err.stack));const api=A.api;
ok('api present',!!api&&/^R1099/.test(api.revision||'')&&['inkCell','inkSheet','levelsOf','usedBox','sharpen','match','process','active','enabled','set','inspect','refresh','settingsRow'].every(k=>typeof api[k]==='function')&&!!api.palette);if(!api)done();
// ---- ② 수묵 변환 ----
const at=(r,x,y)=>{const i=(y*r.width+x)*4;return [r.data[i],r.data[i+1],r.data[i+2],r.data[i+3]];};
const chroma=c=>Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2]),lum=c=>.299*c[0]+.587*c[1]+.114*c[2];
const P0=cellPx(CELL,0),r0=api.inkCell(P0,CELL,CELL,{seed:3});
ok('inkCell keeps size',!!r0&&r0.width===CELL&&r0.height===CELL&&r0.data.length===CELL*CELL*4&&r0.solid>0);
ok('no NaN in output (Uint8 values 0..255)',!!r0&&r0.data.every(v=>Number.isInteger(v)&&v>=0&&v<=255));
{const robe=at(r0,20,30);ok('gray robe → ink (no colour, darker than paper)',chroma(robe)<=18&&lum(robe)<200,robe);
 let red=0,n=0;for(let y=14;y<18;y++)for(let x=13;x<17;x++){const c=at(r0,x,y);n++;if(c[0]>c[1]+50&&c[0]>c[2]+40)red++;}ok('red hair → 언주 (red stays red)',red/n>.6,{red,n});
 const gold=at(r0,20,25);ok('gold trim → 언주 밴 흰빛 (light, warm, not yellow-green)',lum(gold)>150&&gold[0]>=gold[1]&&gold[1]>=gold[2]-4&&gold[0]-gold[2]<120,gold);
 const face=at(r0,18,10);ok('white face stays light paper',lum(face)>150,face);
 const halo=at(r0,8,20);ok('outside: paper halo within reach (alpha>0, light)',halo[3]>0&&lum(halo)>150,halo);
 let edge=0;for(let i=0;i<CELL;i++){edge=Math.max(edge,at(r0,i,0)[3],at(r0,i,CELL-1)[3],at(r0,0,i)[3],at(r0,CELL-1,i)[3]);}ok('cell border fully transparent (no square plate)',edge===0,edge);
 const far=at(r0,38,2);ok('far outside stays empty',far[3]===0,far);}
{const r1=api.inkCell(P0,CELL,CELL,{seed:3});ok('deterministic: same input same output',!!r1&&Buffer.compare(Buffer.from(r1.data),Buffer.from(r0.data))===0);
 const r2=api.inkCell(P0,CELL,CELL,{seed:3,halo:0});let any=false;for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){if(P0[(y*CELL+x)*4+3]===0&&at(r2,x,y)[3]>0)any=true;}ok('halo 0 → nothing painted outside the body',!any);}
ok('empty input → solid 0, all transparent',(()=>{const r=api.inkCell(new Uint8ClampedArray(16*16*4),16,16,{});return r&&r.solid===0&&r.data.every(v=>v===0);})());
ok('1×1 opaque pixel handled',(()=>{const r=api.inkCell(new Uint8ClampedArray([50,50,50,255]),1,1,{});return r&&r.width===1&&r.data.every(v=>Number.isFinite(v));})());
ok('bad args → null',api.inkCell(null,4,4)===null&&api.inkCell(new Uint8ClampedArray(4),4,4)===null&&api.inkCell(P0,NaN,4)===null&&api.inkCell(P0,0,4)===null&&api.inkCell(P0,-3,4)===null);
ok('NaN/Infinity options fall back (no NaN pixels)',(()=>{const r=api.inkCell(P0,CELL,CELL,{seed:NaN,unit:Infinity,halo:NaN,strength:-Infinity,levels:[NaN,1,2,3]});return r&&r.data.every(v=>Number.isInteger(v));})());
{const lv=api.levelsOf(SH.px,SH.w,SH.h);ok('levelsOf: 4 rising finite thresholds',Array.isArray(lv)&&lv.length===4&&lv.every(Number.isFinite)&&lv[0]<lv[1]&&lv[1]<lv[2]&&lv[2]<lv[3],lv);
 ok('levelsOf empty → defaults, finite',api.levelsOf(new Uint8ClampedArray(64),4,4).every(Number.isFinite));}
{const b=api.usedBox(SH.px,SH.w,SH.h,CELL,3);ok('usedBox = union of all frames + margin (clamped to cell)',Array.isArray(b)&&b[0]===9&&b[1]===5&&b[2]===Math.min(CELL,26+3+3)&&b[3]===37,b);
 ok('usedBox empty → null',api.usedBox(new Uint8ClampedArray(CELL*CELL*4),CELL,CELL,CELL,3)===null);
 const s=api.inkSheet(SH.px,SH.w,SH.h,CELL,{});ok('inkSheet: frames side by side at cropped width',!!s&&s.frames===4&&s.width===(s.box[2]-s.box[0])*4&&s.height===s.box[3]-s.box[1]&&s.data.every(v=>Number.isInteger(v)));
 ok('inkSheet frames differ (motion kept)',!!s&&(()=>{const bw=s.box[2]-s.box[0];let diff=0;for(let y=0;y<s.height;y++)for(let x=0;x<bw;x++){const a=(y*s.width+x)*4,b=(y*s.width+bw+x)*4;if(s.data[a+3]!==s.data[b+3])diff++;}return diff>10;})());}
{const same=api.sharpen(P0,CELL,CELL,0,1);ok('sharpen amount 0 → identical',same===P0);
 const sh=api.sharpen(P0,CELL,CELL,1,1),c=(p,x,y)=>lum([p[(y*CELL+x)*4],p[(y*CELL+x)*4+1],p[(y*CELL+x)*4+2]]);
 ok('sharpen widens light/dark step at an edge (face vs robe)',c(sh,18,11)-c(sh,18,12)>c(P0,18,11)-c(P0,18,12)+3,[c(sh,18,11),c(sh,18,12),c(P0,18,11),c(P0,18,12)]);
 ok('sharpen keeps alpha',(()=>{for(let i=3;i<P0.length;i+=4)if(sh[i]!==P0[i])return false;return true;})());}
// ---- ③ 고르기·바꿔 끼우기 ----
ok('match: EGO sheet paths only',!!api.match('assets/r1048/ego/idle-s.webp')&&api.match('http://x/m0/assets/r1048/ego/attack-nw.webp').clip==='attack'&&!api.match('assets/r1048/fx/ego_halo.webp')&&!api.match('assets/r283/hwando/idle-s.webp')&&!api.match('assets/rc133/art/base-0.png')&&!api.match(null));
const hero=(o={})=>({kind:'hero',x:1,y:1,...o});
const body=(frame=1,o={})=>({kind:'image',owner:hero(o.owner),image:{src:'x'},sourcePath:o.path||'assets/r1048/ego/idle-s.webp',sourceRect:[frame*CELL,0,CELL,CELL],imageSize:[CELL*4,CELL],
 points:o.points||[[100,100],[140,100],[140,140],[100,140]],style:{globalAlpha:1,...(o.style||{})},mutable:false,key:'k'});
A.tick();ok('active by default (R1055 on)',api.active()===true&&api.enabled()===true);
{const c=body(1);const n=api.process([c]);ok('not baked yet → command untouched, bake queued',n===0&&c.sourcePath==='assets/r1048/ego/idle-s.webp'&&api.inspect().cached>0);
 A.flush();const I=api.inspect();ok('after flush the sheet is baked',I.ready>=1&&I.baked>=1&&I.errors===0,I);}
{const c=body(2);const n=api.process([c]);const I=api.inspect(),row={};
 ok('swaps EGO body: image → baked canvas, path r1099, frame cell',n===1&&/^r1099:ink:idle-s/.test(c.sourcePath)&&c.image&&c.image.tagName==='CANVAS'&&c.sourceRect[0]===2*c.sourceRect[2]&&c.sourceRect[1]===0&&c.imageSize[0]===c.image.width,{sp:c.sourcePath,sr:c.sourceRect});
 // 원본 칸(40) 위 100..140 → 잘라 구운 영역(box) 귀퉁이: 1화소 = 1 화면 단위
 const b=api.usedBox(SH.px,SH.w,SH.h,CELL,11);ok('points map to cropped box (plain command)',Math.abs(c.points[0][0]-(100+b[0]))<1e-6&&Math.abs(c.points[0][1]-(100+b[1]))<1e-6&&Math.abs(c.points[2][0]-(100+b[2]))<1e-6&&Math.abs(c.points[2][1]-(100+b[3]))<1e-6,{p:c.points,b});
 ok('marks: r1099, r1090 skip, owner r409 (no second outline), owner copied not mutated',c.r1099===true&&c.r1090===true&&c.owner.r409===true);
 ok('second pass does nothing (idempotent)',api.process([c])===0);}
{const c=body(1,{points:[[140,100],[100,100],[100,140],[140,140]]});api.process([c]);const b=api.usedBox(SH.px,SH.w,SH.h,CELL,11);
 ok('mirrored (flipped) command stays mirrored',c.r1099&&Math.abs(c.points[0][0]-(140-b[0]))<1e-6&&c.points[1][0]<c.points[0][0],c.points);}
{// R409 테두리판: 칸 40 + 사방 6 → 52, 화면 104..156
 const c=body(0,{});c.sourcePath='r409:outline:hero:u:http://game.test/m0/assets/r1048/ego/idle-s.webp:80,0,40,40:3:cold:b';c.sourceRect=[0,0,52,52];c.points=[[104,104],[156,104],[156,156],[104,156]];
 const n=api.process([c]);const b=api.usedBox(SH.px,SH.w,SH.h,CELL,11);
 ok('R409 outlined command: frame from key, padding removed',n===1&&c.sourceRect[0]===2*c.sourceRect[2]&&Math.abs(c.points[0][0]-(110+b[0]))<1e-6&&Math.abs(c.points[2][1]-(110+b[3]))<1e-6,{sr:c.sourceRect,p:c.points});}
{const B=world(undefined,{sheets:()=>SH,filter:true});B.tick();B.api.process([body(0)]);B.flush();
 const c=body(0,{style:{filter:'brightness(1.6) saturate(.5) contrast(1.08)'}}),d=body(0,{style:{filter:'saturate(.5) contrast(1.08)'}});B.api.process([c,d]);
 const L='brightness(1.32) contrast(1.22)';
 ok('hit flash filter kept, R1090 ink filter removed, own lift added once',c.style.filter==='brightness(1.6) '+L&&d.style.filter===L,[c.style.filter,d.style.filter]);
 ok('lift uses only renderer-safe CSS filters (brightness·contrast; no blur/drop-shadow)',/^(?:(?:brightness|contrast)\([\d.]+\)\s*)+$/.test(L)&&!/blur|drop-shadow/.test(src));
 const e=body(0,{style:{filter:'none'}});B.api.process([e]);ok("'none' filter → just the lift",e.style.filter===L,e.style.filter);}
{const keep=[body(0,{owner:{kind:'enemy'}}),body(0,{owner:{r1048fx:true}}),body(0,{path:'assets/r1048/fx/ego_halo.webp'}),body(0,{path:'assets/r283/hwando/idle-s.webp'}),body(0,{style:{globalCompositeOperation:'multiply'}}),
  {...body(0),sourceRect:[0,0,30,30]},{...body(0),kind:'path'},{...body(0),points:[[NaN,1],[2,2],[3,3],[4,4]]},{...body(0),sourceRect:[5,0,CELL,CELL]}];
 const before=JSON.stringify(keep.map(c=>[c.sourcePath,c.sourceRect,c.points]));const n=api.process(keep);
 ok('leaves enemy·fx·other hero art·odd blend·wrong cell·non-image·NaN points untouched',n===0&&JSON.stringify(keep.map(c=>[c.sourcePath,c.sourceRect,c.points]))===before);
 const g=body(1,{style:{globalCompositeOperation:'lighter',globalAlpha:.3}});ok('R1048 afterimage (lighter) also inked, blend kept',api.process([g])===1&&g.style.globalCompositeOperation==='lighter'&&g.style.globalAlpha===.3);}
ok('process tolerates junk',api.process(null)===0&&api.process([null,1,'x',{}])===0);
{const T=world(undefined,{sheets:()=>SH,taint:true});T.tick();T.api.process([body(0)]);T.flush();const I=T.api.inspect();ok('tainted canvas → marked failed, original kept, no thrown error',I.failed>=1&&I.ready===0&&T.api.process([body(0)])===0,I);}
{const M=world(undefined,{sheets:()=>SH,mobile:true});M.tick();M.api.process([body(0)]);M.flush();const P=world(undefined,{sheets:()=>SH});P.tick();P.api.process([body(0)]);P.flush();
 ok('PC: 1.5× high-quality bake; mobile: 1×',M.api.inspect().scale===1&&P.api.inspect().scale===1.5,[M.api.inspect().scale,P.api.inspect().scale]);
 const c=body(0);P.api.process([c]);ok('1.5× bake: cell width = box × 1.5, smoothing quality high',c.r1099&&Math.abs(c.sourceRect[2]-Math.round((api.usedBox(SH.px,SH.w,SH.h,CELL,11)[2]-api.usedBox(SH.px,SH.w,SH.h,CELL,11)[0])*1.5))<=1,c.sourceRect);}
// ---- ④ 켜고 끄기 ----
{const O=world('0',{sheets:()=>SH});O.tick();ok("stored '0' → off, nothing swapped",O.api.enabled()===false&&O.api.active()===false&&O.api.process([body(0)])===0);
 const E=world(undefined,{throws:true,sheets:()=>SH});E.tick();ok('storage throwing → still loads, on',!E.err&&E.api.enabled()===true);
 const N=world(undefined,{inkMode:'off',sheets:()=>SH});N.tick();ok('map ink wash off → inactive',N.api.active()===false&&N.api.process([body(0)])===0);
 const K=world(undefined,{inkK:0,sheets:()=>SH});K.tick();ok('map ink wash resting (k=0) → inactive',K.api.active()===false);
 const X=world(undefined,{noInk:true,sheets:()=>SH});X.tick();ok('no R1055 module → inactive',X.api.active()===false);
 const S=world(undefined,{sheets:()=>SH});S.tick();S.api.set(false);ok("set(false) stores '0'",S.store.get(KEY)==='0'&&S.api.active()===false);S.api.set(true);ok('set(true) removes key',!S.store.has(KEY)&&S.api.active()===true);
 ok('set(non-boolean) ignored',S.api.set('no')===true);}
// ---- ⑤ 설정 창 줄 ----
{const S=world(undefined,{sheets:()=>SH});S.w.showSettings();S.flush();const host=S.docEl._all().find(e=>e.id==='combatScreenR1021');const ids=host.children.map(c=>c.id);
 ok('settings row right after the ink rows (before other rows)',ids.indexOf('egoInkRowR1099')===ids.indexOf('inkCharsRowR1090')+1&&ids.indexOf('tailRow')>ids.indexOf('egoInkRowR1099'),ids);
 const box=S.docEl._all().find(e=>e.id==='egoInkOnR1099');ok('checkbox reflects state and toggles',box&&box.checked===true&&(box.checked=false,box.onchange(),S.api.enabled()===false&&S.store.get(KEY)==='0'));
 S.w.showSettings();S.flush();ok('re-open settings: one row, unchecked',S.docEl._all().filter(e=>e.id==='egoInkRowR1099').length===1&&S.docEl._all().find(e=>e.id==='egoInkOnR1099').checked===false);}
// ---- ⑥ 렌더러 감싸기 ----
{const W=world(undefined,{sheets:()=>SH});W.tick();const f={commands:[body(0)]};const r=W.inst.render(f);ok('instance render wrapped: base runs once, returns its value',r==='drawn'&&W.calls.base===1&&W.api.inspect().frames===1);
 const p=W.Renderer.prototype.render.call({},{commands:[]});ok('prototype render wrapped too',p==='drawn'&&W.calls.base===2);
 const T=world(undefined,{sheets:()=>SH,baseThrows:true});T.tick();let thrown=false;try{T.inst.render({commands:[]});}catch(e){thrown=/base boom/.test(e.message);}ok('base renderer error propagates (not swallowed)',thrown);}
// ---- ⑦ 바꾸지 않는 것 ----
ok('no ctx.filter, no game state writes, no new keys',!/ctx\.filter\s*=/.test(src)&&!/\bplayer\.[a-zA-Z]+\s*=[^=]/.test(src)&&!/\broom\.[a-zA-Z]+\s*=[^=]/.test(src)&&!/addEventListener\(\s*['"]key/.test(src));
done();
