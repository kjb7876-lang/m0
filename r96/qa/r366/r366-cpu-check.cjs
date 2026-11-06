// R366 슬레이어 R '.)' 칼날 제거 + 피의 회오리(프레임 시트) + 제자리 회전 — CPU 검사(정적 + 가짜 엔진).
//  node r96/qa/r366/r366-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='slayer-r-tornado-r366.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
for(const f of [F,'fx-d2s-r106.js','skills-r209.js'])ok(fs.readFileSync(path.join(R,'client-source',f),'utf8')===fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),f+' runtime-text 사본 일치');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.split('"./'+F+'"').length===2&&html.indexOf('"./slayer-r351.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-r118.js"'),'index.html 태그 한 번(slayer-r351 뒤, combat-r118 앞)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r366\/r366-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
const IDX=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r366/index.json'),'utf8'));
ok([F,'assets/r366/index.json','assets/r366/tornado-back.webp','assets/r366/tornado-front.webp'].every(p=>man.includes(p)),'runtime-manifest 에 오버레이·시트·index');
for(const k of ['back','front']){const b=fs.readFileSync(path.join(R,'runtime-text/assets/r366',IDX.layers[k].file));ok(crypto.createHash('sha256').update(b).digest('hex')===IDX.layers[k].sha256&&b.slice(0,4).toString()==='RIFF','시트 '+k+' sha256 일치(webp)');}
ok(IDX.frames>=8&&IDX.frames<=12&&IDX.cell[0]*IDX.frames<=4096,'프레임 8~12칸 한 줄('+IDX.frames+')');
const d2s=strip(fs.readFileSync(path.join(R,'client-source','fx-d2s-r106.js'),'utf8')),r209=strip(fs.readFileSync(path.join(R,'client-source','skills-r209.js'),'utf8'));
ok(/function launch\(hero,slot,angle,target\)\{[^\n]*__STORYWORLD_SLAYER_R_TORNADO_R366__\?\.owns\?\.\(hero,slot\)\)return;/.test(d2s),"fx-d2s: 슬레이어 R 의 hammer('.)' blade+glow) 를 띄우지 않음");
ok(/if\(e\.stage!=='release'\)return;\s*if\(window\.__STORYWORLD_SLAYER_R_TORNADO_R366__\?\.owns\?\.\(e\.sourceHero,e\.sourceSlot\)\)return;/.test(r209),'skills-r209: 슬레이어 R 둘레 칼자국(slash) 층을 그리지 않음');
ok(/slayer:\{w:'nova',r:'hammer'\}/.test(fs.readFileSync(path.join(R,'client-source','hero-skills-r269.js'),'utf8')),'R269 슬롯 표는 그대로');
const code=strip(src);
ok(!/hexagram|육망성|star6|'rune'/.test(code)&&!/drop-shadow|blur\(|ctx\.filter/.test(code),'육망성·룬 없음, ctx.filter 안 씀');
ok(!/hitEnemy|damage|cooldown|\.hp\s*-=|attackPower/.test(code),'판정·피해·재사용 대기 손대지 않음(그림만)');
// ---- 가짜 엔진 ----
function engine(hero='slayer'){let clock=10;const draws=[];const room={id:'r1'};const W={};
 const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,Set,Map,Array,Object,String,Number,Date,Promise,
  get time(){return clock;},room,settings:{lowFx:false},player:{x:5,y:5,hp:100,hero},project:(x,y)=>({x:(x-y)*32+600,y:(x+y)*16+300}),actorHeight:()=>60,
  readyImage:p=>({image:{src:p,width:3072,height:320}}),fetch:()=>Promise.resolve({ok:true,json:()=>IDX}),
  fx:()=>{},
  drawHero(){g.ctx.commands.push({kind:'image',owner:{kind:'hero'},r351:'attack',image:{},sourcePath:'assets/r351/slayer/attack-w.webp',sourceRect:[0,0,100,100],points:[[580,500],[620,500],[620,560],[580,560]]});},
  ctx:{commands:[],save(){},restore(){},drawImage(im,sx){draws.push({src:im.src,sx});},globalAlpha:1,globalCompositeOperation:'source-over'}};
 W.__STORYWORLD_SLAYER_R351__={index:()=>({anims:{attack:{w:{file:'attack-w.webp',cell:[100,100],n:6,cols:6}}}})};
 const ctx=vm.createContext(g);vm.runInContext(src,ctx,{filename:F});
 return {g,ctx,draws,api:W.__STORYWORLD_SLAYER_R_TORNADO_R366__,adv(dt){clock+=dt;},frame(){g.ctx.commands=[];ctx.drawHero();return g.ctx.commands;}};}
const castR=(E,slot='r',hero='slayer',id='wer:1')=>E.ctx.fx('storySourceSkill',5,5,{storyWER:true,sourceHero:hero,sourceSlot:slot,stage:'warning',castId:id});
const flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
{const E=engine();await flush();const A=E.api;
 ok(A.owns('slayer','r')&&!A.owns('slayer','w')&&!A.owns('slayer','q')&&!A.owns('hwando','r')&&!A.owns('lauren','r'),'owns: 슬레이어 R 만');
 let c=E.frame();ok(E.draws.length===0&&c[0].points[0][0]===580,'시전 전: 회오리 없음, 몸 그대로');
 castR(E);castR(E);ok(A.inspect().stats.casts===1,'같은 castId 는 한 번');
 const frames=new Set(),ks=[];let pairs=0;for(let i=0;i<20;i++){E.adv(.05);E.draws.length=0;c=E.frame();const t=E.draws.filter(d=>/r366/.test(d.src));
  if(t.length===2&&/back/.test(t[0].src)&&/front/.test(t[1].src))pairs++;t.forEach(d=>frames.add(d.sx));ks.push(c[0].r366Spin);}
 ok(pairs>=18,'회오리 back(몸 앞)→front(몸 뒤) 두 장씩 그림('+pairs+'/20)');
 ok(frames.size>=6,'회오리 프레임이 넘어감('+frames.size+'가지 칸)');
 ok(ks.some(k=>k<0)&&ks.some(k=>k>0)&&ks.every(k=>Math.abs(k)>=.16&&Math.abs(k)<=1),'몸 회전: 가로 폭이 cos 로 줄었다 뒤집힘');
 ok(c[0].points.every(p=>p[1]===500||p[1]===560)&&Math.abs((c[0].points[0][0]+c[0].points[1][0])/2-600)<1e-6,'발 기준(세로·발 x) 그대로');
 E.adv(.6);E.draws.length=0;c=E.frame();ok(E.draws.length===0&&c[0].points[0][0]===580&&c[0].r366Spin==null,'1.45초 뒤: 회오리·회전 끝, 몸 원래대로');}
{const E=engine();await flush();castR(E,'w');castR(E,'r','hwando','x');E.adv(.1);const c=E.frame();ok(E.draws.length===0&&c[0].r366Spin==null,'슬레이어 W·다른 영웅 R: 영향 없음');}
{const E=engine('hwando');await flush();castR(E);E.adv(.1);const c=E.frame();ok(E.draws.length===0&&c[0].r366Spin==null,'지금 영웅이 슬레이어가 아니면 그리지 않음');}
{const E=engine();await flush();E.api.set(false);castR(E);E.adv(.1);E.frame();ok(E.draws.length===0&&!E.api.owns('slayer','r'),'끄면 예전 그대로(owns false → hammer·r209 층 복귀)');}
{const E=engine();await flush();castR(E);E.adv(.1);E.g.room={id:'r2'};E.ctx.room=E.g.room;E.frame();ok(E.draws.length===0,'방이 바뀌면 취소');}
console.log(JSON.stringify({ok:true,checks:n,method:'static+fake-engine'}));})().catch(e=>{console.error(e);process.exit(1);});
