// R200 CPU check: Drive 시트 16종 → 사몽 구역별 잔영 몹(85%)·꼭두각시 15%, 보스·중간보스·탑·인형·S-06 상대/지휘·S-07 불변, frameFor 로만 그림.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ix=JSON.parse(RT('assets/r200/shades/index.json'));const s16=ix.mobs.filter(m=>/^S-0[1-6]$/.test(m.zone));/* R203 이 사몽역행 6종(시트 07·08)을 덧붙였다 — R200 몫 16종만 본다(R203 검사가 나머지) */
ok('16 mobs across S-01..S-06, every zone has at least two',s16.length===16&&['S-01','S-02','S-03','S-04','S-05','S-06'].every(z=>ix.mobs.filter(m=>m.zone===z).length>=2));
ok('strip hash/size match, 11 cells, move 1-5 / attack 6-11',s16.every(m=>{const b=fs.readFileSync(path.join(R,'runtime-text',m.path));return b.length===m.bytes&&sha(b)===m.sha256&&m.frames===11&&m.move.join()==='0,1,2,3,4'&&m.attack.join()==='5,6,7,8,9,10';}));
ok('source sheets recorded with sha256; boss name (봉합부인) not used as a regular mob',['1','2','3','4','5','6'].every(k=>ix.sheets[k])&&s16.every(m=>m.source.sheet.file<'07')&&Object.values(ix.sheets).every(s=>/^[0-9a-f]{64}$/.test(s.sha256))&&!ix.mobs.some(m=>m.name==='봉합부인')&&ix.unused.some(u=>u.name==='봉합부인'));
const idx=RT('index.html');ok('samong-shades-r200 loads after mob-style-r199, before combat-r118',idx.indexOf('./samong-shades-r200.js')>idx.indexOf('./mob-style-r199.js')&&idx.indexOf('./samong-shades-r200.js')<idx.indexOf('./combat-r118.js'));
for(const f of ['samong-shades-r200.js','samong-r161.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
ok('R161 puppet skips mobs that got a shade',/!e\.r200Shade/.test(C('samong-r161.js')));
ok('in the public verify list',/'samong-shades-r200\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
(async()=>{
 const sb={window:{__STORYWORLD_STORY_COMBAT_R54__:Object.freeze({frameFor:(e,f)=>({path:'base'})})},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,time:1,player:{x:0,y:0},
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(ix)}),room:{samongR103:{zone:'sz115-S03-2'}}};
 vm.createContext(sb);vm.runInContext(C('samong-shades-r200.js'),sb);await new Promise(r=>setImmediate(r));
 const S=()=>sb.window.__STORYWORLD_SAMONG_SHADES_R200__,F=()=>sb.window.__STORYWORLD_STORY_COMBAT_R54__;
 const mobs=[...Array(200)].map((_,i)=>({id:'sm103:sz115-S03-2:m:'+i,name:'꼭두각시',hp:10,samongR103:{},x:3,y:1}));
 const fr=mobs.map(e=>F().frameFor(e,null));const shaded=fr.filter(f=>f.r200Shade).length;
 ok('about 85% of regular samong mobs get a shade, the rest stay puppets',shaded>150&&shaded<190,shaded);
 const s3=new Set(ix.mobs.filter(m=>m.zone==='S-03').map(m=>m.id));ok('S-03 mobs only use S-03 shades, and take the shade name',fr.filter(f=>f.r200Shade).every(f=>s3.has(f.r200Shade))&&mobs.filter(e=>e.r200Shade).every(e=>ix.mobs.find(m=>m.id===e.r200Shade).name===e.name));
 const one=mobs.find(e=>e.r200Shade),m=ix.mobs.find(x=>x.id===one.r200Shade);
 one.moving=false;const idle=F().frameFor(one,null).assetFrame.sourceRect[0]/m.cell[0];one.attack={elapsed:.5,shape154:{windup:.4,active:.2,recovery:.4}};const atk=F().frameFor(one,null).assetFrame.sourceRect[0]/m.cell[0];delete one.attack;
 ok('idle uses cells 1-2, attack uses cells 6-11 by progress',idle<=1&&atk>=5&&atk<=10,{idle,atk});
 const keep=[{boss:true},{midboss:true},{persona:true},{r170Tower:true},{r193Doll:true},{samongMidR162:true}].map((o,i)=>({id:'k'+i,hp:10,samongR103:{},...o}));
 ok('bosses, midbosses, persona, towers, dolls untouched',keep.every(e=>F().frameFor(e,null).path==='base'));
 ok('breakable objectives (세뇌당한 기억의 조각) are not mobs',F().frameFor({id:'o1',name:'세뇌당한 기억의 조각',hp:10,samongR103:{}},null).path==='base');
 const ids=[...Array(60)].map((_,i)=>({id:String(1000+i),hp:10,samongR103:{}}));const kept=ids.filter(e=>!F().frameFor(e,null).r200Shade).length;ok('short numeric ids still leave some puppets (well-mixed hash)',kept>=3&&kept<=20,kept);
 sb.room={samongR103:{zone:'sz115-S06-3'}};const riv={id:'r1',name:'상대 초인',hp:10,samongR103:{}};ok('S-06 rival/commander keep their R184 art',F().frameFor(riv,null).path==='base');
 sb.room={samongR103:{zone:'sz115-S07-1'}};ok('S-07 persona zone untouched',F().frameFor({id:'p1',hp:10,samongR103:{}},null).path==='base');
 sb.room={};ok('story (non-samong) mobs untouched',F().frameFor({id:'s1',hp:10},null).path==='base');
 let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
 if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
})().catch(e=>{console.error(e);process.exit(1);});
