// R1029 CPU 검사: 이동 그림이 한 장뿐인 몹·보스의 '떠서 이동' 시트 — 사용자 2026-11-14 "이동모션 아직 없는애들 … 날개가 펄럭이며 이동 혹은 유령은 아래발을 유령답게 흩날리게 날면서 이동
//  그래도 어려운애들 남아있으면 다리쪽을 흑색짙은불꽃안개구름같은걸로 해서 그걸로 날아다니는 느낌으로 자연스럽게 연출".
//  ① 표(move-float-r1029-data.js)는 그림(경로+칸)으로 찾는다. ② 걷는 동안만, 방향 시트(R974)가 없을 때만 8칸 시트로 바꾸고 좌우 뒤집힘·기울기는 엔진 사각형 그대로 따른다.
//  ③ 서 있음·공격·피격·죽음·다른 그림은 그대로. ④ 방향 시트가 있는 방향은 그 시트가 먼저. ⑤ 맘몬·고정 기둥은 표에 없다. ⑥ 연결(태그·검증 목록·CI 줄·자산).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');const src=rd('client-source/move-dir-r974.js'),DS=['r974','r1001','r1018','r1019','r1024'].map(k=>rd('client-source/move-dir-'+k+'-data.js')),dF=rd('client-source/move-float-r1029-data.js');
ok(rd('runtime-text/move-float-r1029-data.js')===dF,'runtime-text copy identical');ok(rd('runtime-text/move-dir-r974.js')===src,'engine runtime-text copy identical');
function world({float=true,order='data-first',ls=null}={}){const timers=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,isFinite,RegExp,performance:{now:()=>0},setTimeout:f=>{timers.push(f);return timers.length;},localStorage:{getItem:k=>ls&&ls[k]||null,setItem(){}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:'x',enemies:[]},player={x:9,y:9},ctx={commands:[]};function addImage(){}function readyImage(p){return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:10,naturalHeight:10}};}
  function project(x,y){return {x:100+(x-3)*10,y:200+(y-3)*5};}
  function drawEnemy(e){const P=project(e.x,e.y),A=e.__art,h=e.__h||100,w=h*A.rect[2]/A.rect[3],top=P.y-h*.95,L=P.x-w/2,m=e.__mirror;
   ctx.commands.push({kind:'image',key:'enemy:'+e.nativeId,owner:{kind:'enemy'},image:{src:'http://x/m0/assets/'+A.path},imageSize:A.size,sourcePath:'assets/'+A.path,sourceRect:A.rect.slice(),style:{},points:m?[[L+w,top],[L,top],[L,top+h],[L+w,top+h]]:[[L,top],[L+w,top],[L+w,top+h],[L,top+h]]});}`,ctx);
 const run=()=>{for(const d of DS)vm.runInContext(d,ctx);if(float)vm.runInContext(dF,ctx);};if(order==='data-first'){run();vm.runInContext(src,ctx);}else{vm.runInContext(src,ctx);run();}while(timers.length)timers.shift()();return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
const w0=world({order:'module-first'}),F=w0.__STORYWORLD_MOVE_FLOAT_R1029_DATA__,ARTS=F.arts,KEYS=Object.keys(ARTS),DIR=w0.__STORYWORLD_MOVE_DIR_R974_DATA__.enemies;
ok(F.revision==='R1029'&&KEYS.length>=70,'float table has '+KEYS.length+' arts');
ok(!KEYS.some(k=>/mammon|ep1b06|dist03-pillar|mb-dist06/i.test(k)),'Mammon and fixed pillars are not in the table');
const KIND={wing:0,ghost:0,mist:0,hover:0};
for(const k of KEYS){const A=ARTS[k],[p,r]=k.split('|');ok(/^assets\/r1029\/float\/[a-z0-9-]+\.webp$/.test(A.path)&&fs.existsSync(path.join(R,'runtime-text',A.path)),'sheet exists '+A.path);
 ok(A.n===8&&A.fps===8&&A.cw>0&&A.ch>0&&A.ch<=384&&A.pad.length===4&&A.pad.every(v=>v>=0&&v<.6)&&r.split(',').length===4&&(A.kind in KIND),'entry shape '+k);KIND[A.kind]++;
 const b=fs.readFileSync(path.join(R,'runtime-text',A.path));ok(b.slice(0,4).toString()==='RIFF'&&b.length<400000,'webp under 400KB '+A.path);}
ok(KIND.wing>=5&&KIND.ghost>=10&&KIND.mist>=30,'all three treatments are used: '+JSON.stringify(KIND));
ok(new Set(KEYS.map(k=>ARTS[k].path)).size===KEYS.length,'one sheet per art');
// 사몽 구역의 한 장짜리 몹 2종(세뇌당한 기억의 조각 · 종이 형상)도 표에 있다
ok(ARTS['r161/sculpture/memory-fragment.webp|99,12,292,399']?.kind==='hover'&&ARTS['r105/drive/mob-paper-figure.webp|8,8,271,405']?.kind==='ghost','Samong fragment and paper figure are in the table');
const artOf=k=>{const [p,r]=k.split('|'),rc=r.split(',').map(Number);return {path:p,rect:rc,size:[rc[0]+rc[2],rc[1]+rc[3]]};};
const mk=(id,k,o)=>({id:id+'#1',nativeId:id,name:id,x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase',__art:artOf(k),...o});
function frames(c,e,secs,step){const out=[];for(let t=0;t<secs-1e-9;t+=1/30){run(c,'time+=1/30');if(step)step(e,t,out.length);run(c,'ctx.commands.length=0');c.drawEnemy(e);out.push(JSON.parse(JSON.stringify(run(c,'ctx.commands').find(k=>/enemy:/.test(k.key||'')))));}return out;}
const W=k=>k.points[1][0]-k.points[0][0],H=k=>k.points[3][1]-k.points[0][1];
// 표에 없는 nativeId 의 몹도 그림으로 찾아 바뀐다: 옆·위·아래 어느 쪽으로 가도
const K0=KEYS.find(k=>ARTS[k].kind==='mist'),A0=ARTS[K0],BW=100*artOf(K0).rect[2]/artOf(K0).rect[3];
for(const [nm,dx,dy] of [['side',.07,0],['up',0,-.07],['down',0,.07],['left',-.07,0]]){const c=world(),e=mk('zz-none',K0);const fr=frames(c,e,1.5,e=>{e.x+=dx;e.y+=dy;}),late=fr.slice(20);
 ok(late.every(k=>k.sourcePath===A0.path&&k.sourceRect[2]===A0.cw&&k.sourceRect[3]===A0.ch&&k.sourceRect[1]===0),'moving '+nm+' → float sheet');
 ok(new Set(late.map(k=>k.sourceRect[0])).size>=6&&late.every(k=>k.sourceRect[0]%A0.cw===0&&k.sourceRect[0]<A0.cw*8),'moving '+nm+' → cells cycle');
 ok(late.every(k=>Math.abs(W(k)-BW*(1+A0.pad[0]+A0.pad[2]))<.01&&Math.abs(H(k)-100*(1+A0.pad[1]+A0.pad[3]))<.01),'quad grows by the sheet padding only ('+nm+')');
 ok(late.every(k=>k.imageSize[0]===10&&k.r1029==='float'),'image swapped and marked ('+nm+')');}
{const c=world(),e=mk('zz-none',K0,{__mirror:true});const fr=frames(c,e,1.2,e=>{e.x-=.07;}).slice(20);ok(fr.every(k=>k.sourcePath===A0.path&&W(k)<0&&Math.abs(-W(k)-BW*(1+A0.pad[0]+A0.pad[2]))<.01),'a mirrored body stays mirrored');
 const k=fr[fr.length-1],cx=(k.points[0][0]+k.points[1][0])/2;ok(Math.abs(cx-(100+(e.x-3)*10)-BW*(A0.pad[0]-A0.pad[2])/2)<.01,'mirrored quad keeps its place');}
{const c=world(),e=mk('zz-none',K0);const fr=frames(c,e,1.2);ok(fr.every(k=>k.sourcePath==='assets/'+artOf(K0).path&&!k.r1029),'standing still → engine art');}
for(const [nm,o] of [['attack',{attack:{}}],['cast',{state:'cast'}],['hit',{hitTimer:.2}],['dead',{hp:0}],['persona',{persona:true}]]){const c=world(),e=mk('zz-none',K0,o);const fr=frames(c,e,1.2,e=>{e.x+=.07;});ok(fr.every(k=>!k.r1029&&k.sourcePath==='assets/'+artOf(K0).path),nm+' → engine art');}
{const c=world(),e=mk('zz-none',K0);e.__art={...e.__art,rect:[5,0,e.__art.rect[2],e.__art.rect[3]]};const fr=frames(c,e,1.2,e=>{e.x+=.07;});ok(fr.every(k=>!k.r1029),'another cell of the same image → untouched');
 const e2=mk('zz-none',K0);e2.__art={...e2.__art,path:'r380/mobs/other.webp'};ok(frames(c,e2,1.2,e=>{e.x+=.07;}).every(k=>!k.r1029),'another image → untouched');}
{const c=world(),e=mk('zz-none',K0);const fr=frames(c,e,1.2,(e,t)=>{e.x+=t<.6?.07:(t<.62?3:0);});ok(!fr[fr.length-1].r1029,'stops → back to engine art');}
{const c=world({ls:{'storyworld.r1029.moveFloat':'{"on":false}'}}),e=mk('zz-none',K0);ok(frames(c,e,1.2,e=>{e.x+=.07;}).every(k=>!k.r1029),'switch off');
 const c2=world({float:false}),e2=mk('zz-none',K0);ok(frames(c2,e2,1.2,e=>{e.x+=.07;}).every(k=>!k.r1029)&&c2.__STORYWORLD_MOVE_DIR_R974__.inspect().lastError===null,'without the float table: no-op, no throw');}
{const c=world({order:'module-first'}),e=mk('zz-none',K0);ok(frames(c,e,1.2,e=>{e.x+=.07;}).slice(20).every(k=>k.r1029==='float'),'works when the data tag loads after the engine');
 const I=c.__STORYWORLD_MOVE_DIR_R974__.inspect();ok(I.float&&I.float.arts===KEYS.length&&I.float.swapped>0&&I.lastError===null,'inspect reports float stats');}
// 방향 시트가 있는 방향은 그 시트가 먼저, 없는 방향만 떠서 이동(타락천사 기사: 위·아래 시트 + 옆은 표)
{const id='l301-boss',D=DIR[id],I=D.idle[0],key=I.path.replace(/^assets\//,'')+'|'+I.rect.join(',');ok(D&&!D.dirs.side&&ARTS[key],'l301-boss has up/down sheets and a float sheet for the side');
 const c=world(),e=mk(id,key);const dn=frames(c,e,1.2,e=>{e.y+=.07;}).slice(20);ok(dn.every(k=>k.r974==='down'&&!k.r1029&&/assets\/r974\/move\//.test(k.sourcePath)),'moving down → R974 sheet');
 const c2=world(),e2=mk(id,key);const sd=frames(c2,e2,1.2,e=>{e.x+=.07;}).slice(20);ok(sd.every(k=>k.r1029==='float'&&k.sourcePath===ARTS[key].path),'moving sideways → float sheet');}
// 기존 방향 이동(R974~R1024) 표는 그대로
{const c={window:{}};vm.createContext(c);for(const d of DS)vm.runInContext(d,c);ok(JSON.stringify(c.window.__STORYWORLD_MOVE_DIR_R974_DATA__.enemies)===JSON.stringify(DIR),'direction table untouched by the float data');}
// 연결
const html=rd('runtime-text/index.html');ok(/<script src="\.\/move-dir-r1024-data\.js"><\/script>\s*<script src="\.\/move-float-r1029-data\.js"><\/script>/.test(html),'tag right after move-dir-r1024-data.js');
ok(/'move-float-r1029-data\.js'/.test(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8')),'public verify list');
ok(/r96\/qa\/r1029\/move-float-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8')),'CI line');
{const m=rd('runtime-manifest.json');ok(/move-float-r1029-data\.js/.test(m)&&KEYS.every(k=>m.includes(ARTS[k].path)),'manifest lists the script and every sheet');}
console.log('R1029 move-float CPU check OK ('+n+' assertions)');
