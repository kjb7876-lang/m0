'use strict';
// R1355 CPU 검사 — Dots SW-R1352 D03(보스 메테오 v2 착탄 16칸 + 착탄 뒤 충격파 12칸)·D04(레비아탄 벽 유리 꽂힘 12칸 + 반짝 8칸) 게임 적용
//  (사용자 2026-11-27 'D 이펙트 시트는 게임에 적용'). 판정·예고·쿨타임은 그대로, 그림만 바뀐다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,500):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const IMP='assets/r1355/boss-meteor-d03-impact16.webp',AFT='assets/r1355/boss-meteor-d03-aftershock12.webp',V2='assets/r1287/boss-meteor-v2.webp',OLD='assets/r411/fx/boss-meteor.webp';
const STK='assets/r1343/dots-d04-strike12.webp',GLT='assets/r1343/dots-d04-glint8.webp';
// ── 자산·연결 ──
/* webp 캔버스 크기: VP8X(확장) 또는 VP8L(무손실 단독) 머리 */
function webpSize(b){const x=b.indexOf('VP8X');if(x>0)return [1+b.readUIntLE(x+12,3),1+b.readUIntLE(x+15,3)];const l=b.indexOf('VP8L');if(l>0&&b[l+8]===0x2f){const v=b.readUInt32LE(l+9);return [(v&0x3fff)+1,((v>>>14)&0x3fff)+1];}return null;}
const manifest=(()=>{try{return new Set(JSON.parse(rd(path.join(R,'runtime-manifest.json'))).files.map(f=>f.path));}catch(_){return new Set();}})();
const inputs=rd(path.join(R,'runtime-inputs.json'));
for(const [p,w,h,max] of [[IMP,4096,256,200000],[AFT,3072,256,200000],[STK,3072,256,120000],[GLT,2048,256,20000]]){const f=path.join(R,'runtime-text',p);const has=fs.existsSync(f);ok(has,'시트 파일 '+p);
 if(has){const b=fs.readFileSync(f);ok(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP','webp 형식 '+p);const dim=webpSize(b);
  ok(dim&&dim[0]===w&&dim[1]===h,p+' '+w+'×'+h+'(칸 256 한 줄, 모바일 4096 한도 안)',dim);ok(b.length<max,p+' 크기 '+b.length+' < '+max);}
 ok(manifest.has(p),'runtime-manifest 에 '+p);ok(inputs.includes(p),'runtime-inputs 에 '+p);}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1355/r1355-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(ROOT,'scripts','verify-r96-public.py')).includes("'assets/r1355/'"),'verify-r96-public 에 assets/r1355/');
ok(fs.existsSync(path.join(ROOT,'scripts','r1355-dots-d-sheets.py')),'납품 PNG → webp 옮기기 스크립트(원본 SHA 확인)');
// ── D03: R1229 운석 ──
const N1='motion-fx-r1229.js',S1=rd(path.join(R,'client-source',N1));ok(S1===rd(path.join(R,'runtime-text',N1)),'R1229 runtime-text 사본 같음');
const im=(p,w,h)=>({src:p,naturalWidth:w,naturalHeight:h,width:w,height:h});
function boot(ready,store){const sb={console,Math,JSON,Object,Array,Number,String,Boolean,Error,Set,Map,WeakMap,Promise,RegExp,Date,
 localStorage:{getItem:()=>store||null,setItem(){}},setTimeout:()=>1,time:0,room:{enemies:[]},hazards:[],projectiles:[],actorHeight:()=>60,project:(x,y)=>({x:x*30,y:y*30}),
 readyImage:p=>ready[p]?{image:ready[p]}:null,ensureImages:()=>Promise.resolve()};sb.window=sb;sb.tick=function(){};sb.releaseImageMemory=function(){};vm.createContext(sb);vm.runInContext(S1,sb,{filename:N1});return sb.__STORYWORLD_MOTION_FX_R1229__;}
const all={[IMP]:im(IMP,4096,256),[AFT]:im(AFT,3072,256),[V2]:im(V2,2304,1536),[OLD]:im(OLD,1536,1024)};
const A=boot(all);
ok(!!A&&typeof A.meteorD03Frame==='function','API meteorD03Frame');
if(A&&typeof A.meteorD03Frame==='function'){
 const F=t=>A.meteorD03Frame({warning:1.5,life:1.95,age:t});
 ok(F(0).im===-1&&F(.99).im===-1&&F(.99).af===-1,'낙하 0.5초 전에는 운석·충격파 없음',[F(0),F(.99)]);
 ok(F(1.0).im===0&&F(1.499).im===6&&F(1.499).af===-1,'낙하 0→6 은 착탄 직전 0.5초, 충격파는 아직',[F(1.0),F(1.499)]);
 ok(F(1.5).im===7&&F(1.5).af===0,'착탄 순간 = 첫 착탄 칸 7 + 충격파 0',F(1.5));
 ok(F(1.95).im===14&&F(1.95).af===10&&F(1.9499).im<=14,'끝 = 착탄 14·충격파 10(빈 마지막 칸 15·11 은 쓰지 않음)',[F(1.9499),F(1.95)]);
 let pi=-2,pa=-2,mono=true;for(let t=0;t<=1.95;t+=.01){const f=F(t);if(f.im<pi||f.af<pa)mono=false;pi=f.im;pa=f.af;}ok(mono,'칸 단조 증가');
 const tpl={kind:'image',owner:{id:'r241:x'},style:{globalAlpha:.5},order:3};
 const mk=(age,b)=>({id:9,x:10,y:10,radius:2.5,warning:1.5,life:1.95,age,r241Meteor:{pal:{main:{a:[150,24,30],b:b||[150,200,255]}}}});
 const q={x:300,y:300},dia=Math.max(60*.9,2*2.5*30);
 let cs=A.meteorCmds(mk(1.3),tpl);const v=cs.find(c=>c.sourcePath===IMP),ring=cs.find(c=>c.sourcePath===OLD);
 ok(cs.length===2&&!!v&&!!ring&&cs.indexOf(ring)<cs.indexOf(v)&&!cs.some(c=>c.sourcePath===V2),'낙하 중: 지면 고리(아래) + D03 운석(위), v2 는 안 그림',cs.map(c=>c.sourcePath));
 if(v){const [sx,sy,sw,sh]=v.sourceRect,fr=A.meteorD03Frame(mk(1.3)).im,cx=fr*256;
  ok(sx>=cx&&sx+sw<=cx+256&&sy>=0&&sy+sh<=256&&sw>20&&sh>20,'D03 칸 256 한 줄 안에서만 자름',{r:v.sourceRect,fr});
  const s=(v.points[1][0]-v.points[0][0])/sw;ok(Math.abs(s-dia/54)<1e-9,'D03 크기 칸 1px = 판정지름/54(v2 와 같은 보이는 크기)',{s,want:dia/54});
  const px=v.points[0][0]+(cx+128-sx)*s,py=v.points[0][1]+(128-sy)*s;ok(Math.abs(px-q.x)<1e-6&&Math.abs(py-q.y)<1e-6,'피벗 (128,128) = 월드 착탄점',{px,py});
  ok(v.key==='r1229:meteor:9'&&v.owner.id==='r241:9'&&v.style.globalAlpha===1&&/hue-rotate/.test(v.style.filter),'키·owner·알파·보스 고유색 필터',v.style);}
 cs=A.meteorCmds(mk(1.7),tpl);const a=cs.find(c=>c.sourcePath===AFT),b=cs.find(c=>c.sourcePath===IMP);
 ok(cs.length===2&&!!a&&!!b&&cs.indexOf(a)<cs.indexOf(b),'착탄 뒤: 충격파(아래) + 착탄(위), 고리 없음',cs.map(c=>c.sourcePath));
 if(a){const [sx,sy,sw]=a.sourceRect,af=A.meteorD03Frame(mk(1.7)).af,s=(a.points[1][0]-a.points[0][0])/sw;
  ok(sx>=af*256&&sx+sw<=af*256+256,'충격파 칸 안에서만 자름',a.sourceRect);
  ok(Math.abs(s-dia/120)<1e-9,'충격파 크기 칸 1px = 판정지름/120(가장 큰 고리 ≈1.8 판정지름 — 피할 범위를 속이지 않게)',{s,want:dia/120});
  ok(a.style.filter==='none','충격파는 흙빛 그대로(색 돌리기 없음)',a.style.filter);
  const px=a.points[0][0]+(af*256+128-sx)*s,py=a.points[0][1]+(128-sy)*s;ok(Math.abs(px-q.x)<1e-6&&Math.abs(py-q.y)<1e-6,'충격파 피벗 = 착탄점',{px,py});}
 // D03 없으면 v2, 끄면 v2
 const A2=boot({[V2]:all[V2],[OLD]:all[OLD]});const c2=A2.meteorCmds(mk(1.3),tpl);ok(c2.some(c=>c.sourcePath===V2)&&!c2.some(c=>c.sourcePath===IMP),'D03 미로드: v2 그대로',c2.map(c=>c.sourcePath));
 const A3=boot(all,'{"meteorD03":false}');const c3=A3.meteorCmds(mk(1.3),tpl);ok(c3.some(c=>c.sourcePath===V2)&&!c3.some(c=>c.sourcePath===IMP),'끄기 {meteorD03:false}: v2 그대로',c3.map(c=>c.sourcePath));
 ok(A.inspect().stats.errors===0,'오류 0',A.inspect().lastError);}
// ── D04: R1343 유리 ──
const N2='envy-glass-r1343.js',S2=rd(path.join(R,'client-source',N2));ok(S2===rd(path.join(R,'runtime-text',N2)),'R1343 runtime-text 사본 같음');
function world(store,have){const W=24,H=18;const isWall=(x,y)=>x<1||y<1||x>W-1||y>H-1||(x>15&&x<16&&y>4&&y<13);const calls={draw:[],shape:0};
 const ctx={save(){},restore(){},translate(){},rotate(){},scale(){},globalAlpha:1,drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh){calls.draw.push({src:img.src,sx,sw,dw,a:this.globalAlpha});},arc(){calls.shape++;},lineTo(){},fill(){},stroke(){},fillRect(){},strokeRect(){},ellipse(){},rect(){}};
 const sb={console,performance:{now:()=>0},localStorage:{getItem:()=>store||null,setItem(){}},started:true,loading:false,modal:null,storyScene:null,time:0,TILE:32,zoom:1,ctx,effects:[],calls};sb.window=sb;
 sb.room={id:'ep1b03',enemies:[{id:'ep1b03:b03-boss',nativeId:'b03-boss',name:'호텔 부매니저 · 레비아탄',boss:true,hp:100,spawnState:'active',x:8,y:9,damage:50}]};sb.player={x:10.5,y:9,hp:1e9};
 sb.blocked=(x,y,r)=>isWall(x-r,y)||isWall(x+r,y)||isWall(x,y-r)||isWall(x,y+r);sb.hurt=()=>'hit';sb.project=(x,y)=>({x:x*32,y:y*16});sb.actorHeight=()=>60;
 const dims={'assets/r1343/shard-fly8.webp':[1024,128],'assets/r1343/burst12.webp':[2304,768],'assets/r1343/embed8.webp':[1280,160],[STK]:[3072,256],[GLT]:[2048,256]};
 const imgs={};sb.addImage=p=>{if(have&&!have(p))return;const [w,h]=dims[p]||[256,256];imgs[p]={image:{src:p,naturalWidth:w,naturalHeight:h}};};sb.readyImage=p=>imgs[p]||null;
 sb.tick=function(){};sb.drawEffect=function(){};vm.createContext(sb);vm.runInContext(S2,sb);return sb;}
const run=(sb,sec,dt=1/60)=>{for(let t=0;t<sec;t+=dt){sb.time+=dt;sb.tick();for(const fx of sb.effects)sb.drawEffect(fx);}};
{const sb=world(),G=sb.window.__STORYWORLD_ENVY_GLASS_R1343__;ok(!!G&&G.sheets.strike===STK&&G.sheets.glint===GLT,'시트 표에 D04 꽂힘·반짝',G&&G.sheets);
 run(sb,4.5);const n0=sb.calls.draw.length;run(sb,.6);const d1=sb.calls.draw.slice(n0);
 const st=d1.filter(d=>d.src===STK),em=d1.filter(d=>d.src==='assets/r1343/embed8.webp');
 ok(st.length>0,'벽에 박히는 순간 Dots 꽂힘 시트를 그림 ('+st.length+')');
 const emOld=em.filter(d=>d.sx<7*160);ok(emOld.length===0,'예전 embed 1~7칸 박힘 애니메이션은 안 씀(마지막 칸만)',emOld.slice(0,3));
 if(st.length&&em.length){const r=st[0].dw/em[0].dw;ok(Math.abs(r-.834)<1e-6,'꽂힘 칸 폭 = embed 폭 × .834(유리 몸 길이 맞춤)',r);}
 ok(st.every(d=>d.sx%256===0&&d.sw===256&&d.sx<11*256),'꽂힘 칸 0~10(빈 11칸 안 씀)',st.slice(0,2));
 run(sb,8);const dr=G.inspect().drawn;ok(dr.glint>0,'박힌 뒤 7초마다 Dots 반짝 시트 ('+dr.glint+')');ok(dr.embed>0,'박힌 채 남는 몸은 R1343 embed 마지막 칸 ('+dr.embed+')');
 ok(sb.calls.shape===0&&G.inspect().otherDraw===0,'도형 그리기 0');ok(G.inspect().errors===0,'오류 0',G.inspect().lastError);}
{const sb=world('{"dots":false}'),G=sb.window.__STORYWORLD_ENVY_GLASS_R1343__;run(sb,13);const dr=G.inspect().drawn;ok(dr.strike===0&&dr.glint===0&&dr.embed>0,'끄기 {dots:false}: 예전 embed 그대로',dr);}
{const sb=world(null,p=>p!==STK),G=sb.window.__STORYWORLD_ENVY_GLASS_R1343__;run(sb,13);const dr=G.inspect().drawn;ok(dr.strike===0&&dr.embed>0,'꽂힘 시트를 못 받으면 예전 embed 그대로',dr);}
console.log(`R1355 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
