// R911 투사체 최소 크기(영웅 화면 키의 절반) CPU 검사.
//  실행: node r96/qa/r911/r911-cpu-check.cjs
//  모듈을 가짜 게임 전역(vm) 안에 올리고, 독립 기록 ctx 로 실제 그려진 몸통 상자를 재서 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..');const R96=path.join(ROOT,'r96');
const MOD=process.env.R911_MODULE||path.join(R96,'client-source/projectile-size-r911.js');
let fail=0,pass=0;const ok=(c,m,d)=>{if(c){pass++;console.log('  ✓ '+m);}else{fail++;console.log('  ✗ '+m+(d!==undefined?' — '+JSON.stringify(d):''));}};

// 독립 기록 ctx: 변환 행렬을 따라가며 drawImage/fillRect/arc 채우기의 화면 상자를 알파별로 남긴다.
function recCtx(){const st={m:[1,0,0,1,0,0],a:1},stack=[],ops=[];let path=[];
 const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
 const ap=(x,y)=>[st.m[0]*x+st.m[2]*y+st.m[4],st.m[1]*x+st.m[3]*y+st.m[5]];
 const box=pts=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return{x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};};
 const c={ops,get globalAlpha(){return st.a;},set globalAlpha(v){st.a=v;},save(){stack.push({m:st.m.slice(),a:st.a});},restore(){const s=stack.pop();if(s){st.m=s.m;st.a=s.a;}},
  translate(x,y){st.m=mul(st.m,[1,0,0,1,x,y]);},scale(x,y){st.m=mul(st.m,[x,0,0,y??x,0,0]);},rotate(r){const C=Math.cos(r),S=Math.sin(r);st.m=mul(st.m,[C,S,-S,C,0,0]);},
  setTransform(a,b,cc,d,e,f){st.m=[a,b,cc,d,e,f];},
  drawImage(img,dx,dy,dw,dh){ops.push({a:st.a,...box([ap(dx,dy),ap(dx+dw,dy),ap(dx,dy+dh),ap(dx+dw,dy+dh)])});},
  fillRect(x,y,w,h){ops.push({a:st.a,...box([ap(x,y),ap(x+w,y),ap(x,y+h),ap(x+w,y+h)])});},
  beginPath(){path=[];},arc(x,y,r){path.push(ap(x-r,y),ap(x+r,y),ap(x,y-r),ap(x,y+r));},fill(){ops.push({a:st.a,...box(path)});},
  fillStyle:'#000',canvas:{width:960,height:540}};
 c.body=()=>{const b=ops.filter(o=>o.a>=.45);if(!b.length)return null;const x0=Math.min(...b.map(o=>o.x0)),y0=Math.min(...b.map(o=>o.y0)),x1=Math.max(...b.map(o=>o.x1)),y1=Math.max(...b.map(o=>o.y1));return{w:x1-x0,h:y1-y0,cx:(x0+x1)/2,cy:(y0+y1)/2,size:Math.max(x1-x0,y1-y0)};};
 return c;}

function world(){
 const store={};const timers=[];
 const sandbox={console,Math,Number,String,Object,Array,Map,WeakMap,Set,JSON,Proxy,Infinity,NaN,isFinite,Uint8ClampedArray,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData(){throw new Error('no pixels in vm');}})})},
  setInterval:(f)=>{timers.push(f);return timers.length;},clearInterval(){},
 };
 sandbox.window=sandbox;vm.createContext(sandbox);
 vm.runInContext(`let ctx=null,zoom=1,dpr=1,time=0,W=960,H=540;function actorHeight(){return 66*zoom}function project(x,y){return{x:x*10,y:y*10}}
  let drawProjectile=function(b){const q=project(b.x,b.y);const s=b.size;
   if(b.trail){ctx.globalAlpha=.22;ctx.drawImage({},q.x-60,q.y-6,120,12);ctx.globalAlpha=1;}
   if(b.arc){ctx.beginPath();ctx.arc(q.x,q.y-8,s/2);ctx.fill();return;}
   ctx.save();ctx.globalAlpha=.96;ctx.drawImage({},q.x-s/2,q.y-18-s/2,s,s*.5);ctx.restore();};`,sandbox);
 return {sandbox,timers,run:code=>vm.runInContext(code,sandbox)};
}

console.log('R911 CPU check');
// 1) 배선: 모듈 파일, index.html 태그(맨 끝 쪽), sync 목록, verify 기대 목록, pages.yml 검사 줄
const modExists=fs.existsSync(MOD);ok(modExists,'모듈 파일이 있다',MOD);
const html=fs.readFileSync(path.join(R96,'runtime-text/index.html'),'utf8');
const tags=[...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m=>m[1]);const ti=tags.indexOf('projectile-size-r911.js');
ok(ti>=0,'index.html 에 스크립트 태그가 있다');
ok(tags.filter(t=>t==='projectile-size-r911.js').length===1&&ti>tags.indexOf('doors-theme-r832.js')&&ti<tags.indexOf('combat-r118.js'),'태그는 하나, doors-theme-r832 뒤·combat-r118 앞(맨 끝 고정 줄 combat-r118·world-tiles-r118·refuge-walls-r713 은 건드리지 않음 — 맨 바깥 감싸기는 실행 중 ensure 가 맡는다)',{ti});
ok(fs.existsSync(path.join(R96,'runtime-text/projectile-size-r911.js'))&&fs.readFileSync(path.join(R96,'runtime-text/projectile-size-r911.js'),'utf8')===fs.readFileSync(MOD,'utf8'),'runtime-text 사본이 같다');
const inputs=fs.readFileSync(path.join(R96,'runtime-inputs.json'),'utf8');ok(inputs.includes('projectile-size-r911.js'),'runtime-inputs.json 에 들어 있다');
const verify=fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8');ok(verify.includes('projectile-size-r911.js'),'verify-r96-public.py 기대 목록에 있다');
const pages=fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8');ok(pages.includes('qa/r911/r911-cpu-check.cjs'),'pages.yml 이 이 검사를 돈다');

if(!modExists){console.log(`\nR911 ${pass} 통과 / ${fail} 실패`);process.exit(1);}
const SRC=fs.readFileSync(MOD,'utf8');

function scenario(name,b,opt={}){const w=world();w.run(SRC);w.sandbox.__b=b;
 if(opt.zoom)w.run(`zoom=${opt.zoom}`);if(opt.off)w.run(`window.__STORYWORLD_PROJ_SIZE_R911__.setEnabled(false)`);
 if(opt.rewrap){w.run(`{const inner=drawProjectile;drawProjectile=function(b){return inner(b)}}`);w.timers.forEach(f=>f());}
 const draw=()=>{const c=recCtx();w.sandbox.__c=c;w.run('ctx=__c;drawProjectile(__b);');return c;};
 const c=draw();const c2=draw();return {w,c,c2,body:c2.body(),api:w.sandbox.__STORYWORLD_PROJ_SIZE_R911__};}

const near=(a,b,e=.6)=>Math.abs(a-b)<=e;
// 2) 작은 적 탄환(가로 10px) → 영웅 키 66 의 절반 33px 이상
{const s=scenario('small',{x:20,y:20,size:10,radius:.14});ok(s.body&&s.body.size>=33-1e-6,'작은 탄환(10px)이 영웅 키 절반(33px) 이상으로 커진다',s.body);
 ok(s.w.sandbox.__b.radius===.14,'판정 반지름(radius)은 그대로',s.w.sandbox.__b.radius);
 const raw=recCtx();s.w.sandbox.__c=raw;s.w.run('ctx=__c;drawProjectile.__r911base(__b);');const rb=raw.body();
 ok(near(s.body.cx,rb.cx,.01)&&near(s.body.cy,rb.cy,.01),'키운 뒤에도 몸통 중심 위치가 그대로',{after:[s.body.cx,s.body.cy],before:[rb.cx,rb.cy]});
 ok(near(s.body.w/s.body.h,rb.w/rb.h,.01),'가로세로 비율이 그대로(고르게 키움)');}
// 3) 이미 큰 탄환(50px) → 손대지 않음
{const s=scenario('large',{x:5,y:5,size:50});ok(s.body&&near(s.body.size,50,.01),'큰 탄환(50px)은 그대로',s.body);}
// 4) 경계값: 정확히 33 은 그대로, 32 는 33 으로
{const s=scenario('edge33',{x:5,y:5,size:33});ok(near(s.body.size,33,.01),'정확히 절반(33px)은 그대로',s.body);
 const t=scenario('edge32',{x:5,y:5,size:32});ok(near(t.body.size,33,.05),'32px 은 33px 으로',t.body);}
// 5) 꼬리(투명도 .22, 120px)는 몸통 크기에 넣지 않는다
{const s=scenario('trail',{x:5,y:5,size:10,trail:true});ok(s.body&&s.body.size>=33-1e-6,'옅은 꼬리가 길어도 몸통(10px) 기준으로 키운다',s.body);}
// 6) 원 경로(arc 채우기) 탄환도 잰다
{const s=scenario('arc',{x:5,y:5,size:8,arc:true});ok(s.body&&s.body.size>=33-1e-6,'코드로 그린 원 탄환(8px)도 33px 이상',s.body);}
// 7) 줌이 바뀌면 기준도 따라간다(zoom .5 → 영웅 33, 절반 16.5)
{const s=scenario('zoom',{x:5,y:5,size:10},{zoom:.5});ok(near(s.body.size,16.5,.05),'zoom .5 에서 10px → 16.5px',s.body);}
// 8) 너무 작은 점(1px)은 6배 상한
{const s=scenario('tiny',{x:5,y:5,size:1});ok(near(s.body.size,6,.01),'1px 점은 6배(6px)까지만',s.body);}
// 9) 끄기 설정이면 그대로
{const s=scenario('off',{x:5,y:5,size:10},{off:true});ok(near(s.body.size,10,.01),'끄면(storyworld.r911.projsize=off) 원래 크기',s.body);}
// 10) 다른 덧씌우기가 뒤에 다시 감싸도 두 번 키우지 않는다
{const s=scenario('rewrap',{x:5,y:5,size:10},{rewrap:true});ok(s.body&&near(s.body.size,33,.05),'나중 감싸기 뒤에도 한 번만 키운다(33px)',s.body);}
// 11) 숫자가 아닌 값·빈 그림
{const w=world();w.run(SRC);const api=w.sandbox.__STORYWORLD_PROJ_SIZE_R911__;ok(api.scaleFor(NaN)===1&&api.scaleFor(0)===1&&api.scaleFor(-3)===1,'잘못된 크기 값은 배율 1');
 w.sandbox.__c=recCtx();let threw=false;try{w.run('ctx=__c;drawProjectile(null);drawProjectile({x:NaN,y:NaN,size:10});');}catch(e){threw=String(e);}ok(!threw,'null·NaN 투사체에도 던지지 않는다',threw);}

// 12) 잔선 걷은 사본으로 주소 돌리기(원본 경로·캐시 키는 그대로)
{const spec=JSON.parse(fs.readFileSync(path.join(R96,'r911-vfx-clean.json'),'utf8'));const crypto=require('crypto');
 ok(spec.rows.length>=10,'정리 목록이 10장 이상',spec.rows.length);
 const miss=spec.rows.filter(r=>{const f=path.join(R96,'runtime-text',r.clean);return !fs.existsSync(f)||crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')!==r.clean_sha256;});ok(!miss.length,'사본 파일이 있고 해시가 목록과 같다',miss.map(r=>r.path));
 ok(spec.rows.every(r=>inputs.includes(r.clean)),'사본이 runtime-inputs.json 에 들어 있다',spec.rows.filter(r=>!inputs.includes(r.clean)).map(r=>r.clean));
 const w=world();w.run(`function urlFor(p){return 'U:'+p}`);w.run(SRC);
 const first=spec.rows[0].path;ok(w.run(`urlFor(${JSON.stringify(first)})`)==='U:assets/r911/clean/'+first,'목록 그림은 사본 주소로',w.run(`urlFor(${JSON.stringify(first)})`));
 ok(w.run(`urlFor('./'+${JSON.stringify(first)})`)==='U:assets/r911/clean/'+first,'./ 붙은 경로도 알아본다');
 ok(w.run(`urlFor('assets/vfx/heroes/hunter-a.webp')`)==='U:assets/vfx/heroes/hunter-a.webp','목록 밖 그림은 그대로');
 ok(w.run(`urlFor(null)`)==='U:null','문자열이 아니면 그대로');
 const w2=world();w2.run(`function urlFor(p){return 'U:'+p}`);w2.sandbox.localStorage.setItem('storyworld.r911.vfxclean','off');w2.run(SRC);ok(w2.run(`urlFor(${JSON.stringify(first)})`)==='U:'+first,'끄면(storyworld.r911.vfxclean=off) 원본 주소');}

// 13) 맘몬 맵(ep1b06, Codex 작업 구역)은 손대지 않는다
{const w=world();w.run(SRC);w.run(`var zone='ep1b06'`);w.sandbox.__b={x:5,y:5,size:10};const c=recCtx();w.sandbox.__c=c;w.run('ctx=__c;drawProjectile(__b);drawProjectile(__b);');ok(near(c.body().size,10,.01),'맘몬의 금고(ep1b06)에서는 크기를 바꾸지 않는다',c.body());}

// 14) 품질 낮은 그림 대체: 기억사수 기본탄(평면 캡슐 그림) → 기존 칠한 기억사수 혜성 그림(gunner-a)을 진행 방향(+x)으로 돌린 사본
{const spec=JSON.parse(fs.readFileSync(path.join(R96,'r911-vfx-clean.json'),'utf8'));const d=(spec.derived||[]).find(r=>r.path==='assets/vfx/heroes/gunner-laser-bullet.webp');
 ok(!!d&&fs.existsSync(path.join(R96,'runtime-text',d.out)),'기억사수 기본탄 대체 사본이 있다',d);
 ok(!!d&&d.from==='assets/vfx/heroes/gunner-a.webp'&&inputs.includes(d.out),'원천은 기존 gunner-a, runtime-inputs 에 등록',d);
 const w=world();w.run(`function urlFor(p){return 'U:'+p}`);w.run(SRC);ok(w.run(`urlFor('assets/vfx/heroes/gunner-laser-bullet.webp')`)==='U:assets/r911/derived/gunner-laser-bullet.webp','기본탄 그림 주소가 대체 사본으로',w.run(`urlFor('assets/vfx/heroes/gunner-laser-bullet.webp')`));}

console.log(`\nR911 ${pass} 통과 / ${fail} 실패`);process.exit(fail?1:0);
