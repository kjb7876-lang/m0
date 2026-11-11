// R615b 얼굴 없는 학생 걷기 8칸 CPU 검사: 파일·연결·칸 바꾸기 계산(원본 좌표 → 시트 칸)·필터 캔버스 원본·이름 아닌 몹은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}};
const F=path.join(R,'client-source','mob-student-walk-r615.js');ok(fs.existsSync(F),'overlay exists');const src=fs.readFileSync(F,'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text','mob-student-walk-r615.js'),'utf8')===src,'runtime-text copy synced');
const sheet=path.join(R,'runtime-text','assets','r615','mob-student-walk8.webp');ok(fs.existsSync(sheet)&&fs.statSync(sheet).size<200000,'sheet exists, small');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');const a=html.indexOf('./samong-wide-r355.js'),b=html.indexOf('./mob-student-walk-r615.js');ok(a>0&&b>a&&html.split('./mob-student-walk-r615.js').length===2,'loaded once, after R355 (outside its drawImage hook)');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('mob-student-walk-r615.js')&&man.includes('assets/r615/mob-student-walk8.webp'),'manifest lists overlay+sheet');
// 가짜 엔진에서 돌려 본다
const calls=[];const img={src:'https://x/m0/assets/r105/drive/mob-student.webp'},sh={src:'https://x/m0/assets/r615/mob-student-walk8.webp',naturalWidth:1032,naturalHeight:320};
const tint={width:169,height:420,naturalWidth:169,naturalHeight:420};Object.defineProperty(tint,'__storyworldStaticTint',{value:{path:'assets/r105/drive/mob-student.webp',filter:'saturate(.8)'}});
const made=[];const ctx={drawImage(im,...q){calls.push([im,q]);}};let body=img;
const g={time:0,ctx,localStorage:{getItem:()=>null,setItem(){}},readyImage:p=>p==='assets/r615/mob-student-walk8.webp'?{image:sh}:null,ensureImages:()=>Promise.resolve(),Date,Math,String,Object,Promise,JSON,WeakMap,Map,
 document:{createElement:()=>{const c={getContext:()=>({drawImage(im){c.from=im;},set filter(v){c.filter=v;}})};made.push(c);return c;}}};
g.drawEnemy=function(e){ctx.drawImage(body,9,9,151,402,-10,-50,20,50);};g.window=g;vm.createContext(g);vm.runInContext(src,g);
const S=g.__STORYWORLD_STUDENT_WALK_R615__;ok(S&&typeof g.drawEnemy==='function'&&g.drawEnemy.__r615s,'wraps drawEnemy');
const st={name:'얼굴 없는 학생 3',x:1,y:1,hp:5};g.drawEnemy(st);ok(calls.pop()[0]===img,'first frame (no movement yet) keeps original');
g.time=.05;st.x=1.2;g.drawEnemy(st);let c=calls.pop();ok(c[0]===sh,'walking → sheet');const cw=1032/8,k=cw/169;
const fr=Math.floor(.2/.105)%8;ok(Math.abs(c[1][0]-(fr*cw+9*k))<1e-6&&Math.abs(c[1][2]-151*k)<1e-6&&Math.abs(c[1][3]-402*320/420)<1e-6,'source rect remapped to frame '+fr);
ok(c[1][4]===-10&&c[1][7]===50,'destination unchanged');
body=tint;g.time=.1;st.x=1.3;g.drawEnemy(st);c=calls.pop();ok(made.length===1&&c[0]===made[0]&&made[0].from===sh&&made[0].filter==='saturate(.8)','tinted engine canvas → sheet tinted with the same filter');
g.time=.15;st.x=1.4;g.drawEnemy(st);ok(calls.pop()[0]===made[0]&&made.length===1,'tinted sheet cached');body=img;
g.time=.3;g.drawEnemy(st);ok(calls.pop()[0]===img,'stopped → original');
g.time=.35;st.x=1.5;st.attack={};g.drawEnemy(st);ok(calls.pop()[0]===img,'attacking → original');delete st.attack;
const other={name:'종이 형상',x:0,y:0,hp:5};g.time=.4;g.drawEnemy(other);other.x=.5;g.time=.42;g.drawEnemy(other);ok(calls.pop()[0]===img,'other mob untouched');
ok(S.inspect().stats.errors===0,'no errors '+S.inspect().lastError);
console.log(JSON.stringify({ok:bad===0,checks:n}));process.exit(bad?1:0);
