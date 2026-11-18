// R1177b — Dots CX-0156SP(ROUGH r1 손질본) S-06 상대 초인(DYS-03) 걷기·공격·피격·사망, 지휘 개체/기체(DYS-06·10 공용) 걷기·공격·피격 연결
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto'),vm=require('vm');
const root=path.join(__dirname,'..','..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS '+m);};
const A='assets/r1177/',FILES={'s06-rival-dots-walk-right-8.webp':[1024,640],'s06-rival-dots-attack-8.webp':[1024,640],'s06-rival-dots-hit-4.webp':[1024,320],'s06-rival-dots-death-8.webp':[1024,640],
 's06-commander-dots-walk-right-8.webp':[1280,640],'s06-commander-dots-attack-8.webp':[1280,640],'s06-commander-dots-hit-4.webp':[1280,320]};
const spec=JSON.parse(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8')),man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8')));
let bytes=0;
for(const [f,[W,H]] of Object.entries(FILES)){const b=fs.readFileSync(path.join(root,'runtime-text',A+f));bytes+=b.length;
 ok(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'&&1+b.readUIntLE(24,3)===W&&1+b.readUIntLE(27,3)===H,f+' webp '+W+'x'+H);
 ok(spec.textPaths.includes(A+f)&&man.includes(crypto.createHash('sha256').update(b).digest('hex')),f+' runtime inputs·매니페스트 해시');}
ok(bytes<1500000,'새 시트 합계 '+bytes+' 바이트(Pages 예산)');
for(const f of ['s06-rival-walk-right-8.webp','s06-commander-walk-right-8.webp','s06-invader-walk-right-8.webp'])ok(fs.existsSync(path.join(root,'runtime-text',A+f)),'R1177 임시본 보존 '+f);
const src=fs.readFileSync(path.join(root,'client-source','samong-r161.js'),'utf8');ok(src===fs.readFileSync(path.join(root,'runtime-text','samong-r161.js'),'utf8'),'samong-r161 runtime 사본 같음');
// ---- 가짜 엔진에서 실제 그리기 호출을 본다 ----
const calls=[];let loaded=p=>true;
const ctx={save(){},restore(){},translate(){},rotate(){},scale(x,y){this.sc=[x,y];},drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh){calls.push({src:im.src,sx,sy,sw,sh,dx,dy,alpha:this.globalAlpha,sc:this.sc});},globalAlpha:1,filter:'none'};
const room={samongR103:{key:'S-06',zone:'sz115-S06-3'},enemies:[],props:[],exploration:{floorCells:[],entry:{x:0,y:0}}};
const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},room,time:10,ctx,readyImage:p=>loaded(p)?{image:{src:p}}:null,ensureImages:async()=>{},drawEnemy(){},drawProp(){},tick(){},
 project:(x,y)=>({x:x*10,y:y*10}),actorHeight:()=>60,Math,JSON,String,Object,Number,Date,Promise,Array,Set,Map};
vm.createContext(sb);vm.runInContext(src,sb);const S=sb.window.__STORYWORLD_SAMONG_R161__;
const draw=e=>{calls.length=0;ctx.globalAlpha=1;sb.drawEnemy(e);return calls[calls.length-1];};
const mk=(name,o={})=>({id:name+Math.random(),name,samongR103:'k',hp:10,x:3,y:3,damage:5,...o});
ok(S.sheetFor({name:'상대 초인'})===A+'s06-rival-dots-walk-right-8.webp'&&S.sheetFor({name:'지휘 개체 7'})===A+'s06-commander-dots-walk-right-8.webp'&&S.sheetFor({name:'지휘 기체'})===A+'s06-commander-dots-walk-right-8.webp','S-06 상대 초인·지휘 개체/기체 → Dots 걷기 시트');
let e=mk('상대 초인'),c=draw(e);ok(c&&c.src===A+'s06-rival-dots-walk-right-8.webp'&&c.sw===256&&c.sh===320&&Math.abs(c.dx+101.8)<1e-6,'상대 초인 서 있을 때 걷기 시트, R161 칸 규격',c);
e.attack={elapsed:.2,angle:0,shape154:{windup:.45,active:.15,recovery:.35}};c=draw(e);ok(c.src===A+'s06-rival-dots-attack-8.webp'&&c.sx===256&&c.sy===0,'공격 예고 중 → 공격 시트 앞 칸(0.2/0.95 → 1칸)',c);
e.attack.elapsed=.9;c=draw(e);ok(c.src===A+'s06-rival-dots-attack-8.webp'&&c.sx===3*256&&c.sy===320,'공격 회복 끝 → 공격 시트 마지막 칸(7)',c);
e.attack=null;e.flash=.2;sb.time=20;c=draw(e);ok(c.src===A+'s06-rival-dots-hit-4.webp'&&c.sx===0,'번쩍임 켜진 순간 → 피격 시트 0칸',c);
sb.time=20.17;c=draw(e);ok(c.src===A+'s06-rival-dots-hit-4.webp'&&c.sx===2*256,'0.17초 뒤 → 피격 2칸',c);
sb.time=20.4;c=draw(e);ok(c.src===A+'s06-rival-dots-walk-right-8.webp','0.32초 지나면 다시 걷기(번쩍임이 남아 있어도 새로 켜질 때만 피격)',c);
e.flash=0;draw(e);e.flash=.1;sb.time=21;c=draw(e);ok(c.src===A+'s06-rival-dots-hit-4.webp','번쩍임이 꺼졌다 다시 켜지면 피격 다시',c);
e.flash=0;e.hp=0;e.deadAt=30;sb.time=30.3;c=draw(e);ok(c.src===A+'s06-rival-dots-death-8.webp'&&c.sx===256*3&&c.sy===0&&c.alpha===1,'죽은 지 0.3초 → 사망 시트 3칸, 아직 불투명',c);
sb.time=30.75;c=draw(e);ok(c.src===A+'s06-rival-dots-death-8.webp'&&c.sx===256*3&&c.sy===320&&c.alpha<.4,'0.75초 → 마지막 잿빛 칸(7)과 짧은 페이드',c);
sb.time=30.85;c=draw(e);ok(!c,'0.8초 넘으면 그리지 않음(예전과 같은 길이)',c);
let m=mk('지휘 개체 3');sb.time=40;c=draw(m);ok(c.src===A+'s06-commander-dots-walk-right-8.webp'&&c.sw===320&&c.sh===320&&c.dx===-160&&c.dy===-300,'지휘 개체 걷기 시트, 칸 320 발 160,300',c);
const kR=draw(mk('상대 초인')).sc[1],kC=draw(m).sc[1];ok(Math.abs(kC/kR-1.15)<1e-6,'지휘 개체는 1.15배',[kR,kC]);
m.attack={elapsed:.5,angle:1,shape154:{windup:.45,active:.15,recovery:.35}};c=draw(m);ok(c.src===A+'s06-commander-dots-attack-8.webp'&&c.sx===320*0&&c.sy===320,'지휘 개체 공격 시트(0.5/0.95 → 4칸)',c);
m.attack=null;m.hp=0;m.deadAt=50;sb.time=50.3;c=draw(m);ok(c.src===A+'s06-commander-dots-walk-right-8.webp'&&c.alpha<1,'지휘 개체 사망 시트 없음 → 예전처럼 걷기 칸 흐려짐',c);
let v=mk('외계 침공군');c=draw(v);ok(c.src===A+'s06-invader-walk-right-8.webp'&&c.sw===256,'침공병은 그대로(R1177 시트)',c);
loaded=p=>!/attack|hit|death/.test(p);e=mk('상대 초인',{attack:{elapsed:.2,angle:0}});c=draw(e);ok(c.src===A+'s06-rival-dots-walk-right-8.webp'&&c.sx===256,'공격 시트가 아직 안 읽혔으면 예전 걷기 칸(찌르기 1칸)',c);
loaded=()=>true;room.samongR103={key:'S-04',zone:'sz115-S04-3'};c=draw(mk('상대 초인'));ok(c.src==='assets/r161/puppet/puppet-ego-walk-right-8.webp'&&c.sw===256,'S-06 밖은 꼭두각시 그대로',c);
ok(S.S06MOT&&Object.keys(S.S06MOT).length===2&&S.geoOf(A+'s06-commander-dots-hit-4.webp').cw===320&&S.geoOf(A+'s06-rival-dots-hit-4.webp').cw===256,'API: S06MOT·geoOf');
console.log('R1177b '+n+'/'+n);
