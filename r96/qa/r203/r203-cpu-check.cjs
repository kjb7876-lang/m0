// R203 CPU check: Drive 시트 07·08 6종 → 사몽역행 구역(RB·RE·RF·RG) 잔영. 이동 1~6칸·공격 7~11칸, 구역 키(sz115-R?-n) 인식, 다른 구역에 섞이지 않음.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ix=JSON.parse(RT('assets/r200/shades/index.json'));const r6=ix.mobs.filter(m=>/^R[A-G]$/.test(m.zone));
const want={'clockhand-warden':'RB','parade-mannequin':'RE','fishhook-manuscript':'RF','empty-sleeve-trumpet':'RG','furnace-taxidermist':'RG','wire-bound-dead':'RG'};
ok('six sheet 07/08 mobs placed in RB/RE/RF/RG as planned',r6.length===6&&Object.entries(want).every(([id,z])=>r6.find(m=>m.id===id)?.zone===z));
ok('names are the names printed on the sheets',['카이로 회랑의 시계침 수문장 잔영','승전식 제복 마네킹 잔영','낚싯바늘 원고지 망령','일곱 나팔의 빈 소매 잔영','검은 공방의 용광로 박제공 잔영','검은 제단의 전선 망자 잔영'].every(n=>r6.some(m=>m.name===n)));
ok('strip hash/size match, 11 cells, move 1-6 / attack 7-11',r6.every(m=>{const b=fs.readFileSync(path.join(R,'runtime-text',m.path));return b.length===m.bytes&&sha(b)===m.sha256&&m.frames===11&&m.move.join()==='0,1,2,3,4,5'&&m.attack.join()==='6,7,8,9,10';}));
ok('source sheets 07/08 recorded with sha256',['7','8'].every(k=>/^[0-9a-f]{64}$/.test(ix.sheets[k]?.sha256||''))&&r6.every(m=>/^0[78]\.png$/.test(m.source.sheet.file)));
ok('pivot inside the cell, foot near the bottom',r6.every(m=>m.pivot[0]>0&&m.pivot[0]<m.cell[0]&&m.pivot[1]>m.cell[1]*.7&&m.pivot[1]<=m.cell[1]));
ok('runtime copy matches · samong-shades-r200.js',RT('samong-shades-r200.js')===C('samong-shades-r200.js'));
ok('in the CI workflow',/qa\/r203\/r203-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
(async()=>{
 const sb={window:{__STORYWORLD_STORY_COMBAT_R54__:Object.freeze({frameFor:(e,f)=>({path:'base'})})},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,time:1,player:{x:0,y:0},
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(ix)}),room:{samongR103:{zone:'sz115-RG-4'}}};
 vm.createContext(sb);vm.runInContext(C('samong-shades-r200.js'),sb);await new Promise(r=>setImmediate(r));
 const S=()=>sb.window.__STORYWORLD_SAMONG_SHADES_R200__,F=()=>sb.window.__STORYWORLD_STORY_COMBAT_R54__;
 ok('zone key reads sz115-RG-4 as RG and sz115-S03-2 as S-03',S().zoneKey()==='RG'&&(sb.room={samongR103:{zone:'sz115-S03-2'}},S().zoneKey()==='S-03'));
 sb.room={samongR103:{zone:'sz115-RG-4'}};
 const mobs=[...Array(200)].map((_,i)=>({id:'sm103:sz115-RG-4:m:'+i,name:'꼭두각시',hp:10,samongR103:{},x:3,y:1}));
 const fr=mobs.map(e=>F().frameFor(e,null));const rg=new Set(r6.filter(m=>m.zone==='RG').map(m=>m.id));const used=new Set(fr.filter(f=>f.r200Shade).map(f=>f.r200Shade));
 ok('RG mobs: ~85% get one of the three RG shades, all three appear',fr.filter(f=>f.r200Shade).length>150&&[...used].every(id=>rg.has(id))&&used.size===3,[...used]);
 const one=mobs.find(e=>e.r200Shade),m=ix.mobs.find(x=>x.id===one.r200Shade);one.moving=true;
 const cells=new Set();for(let t=0;t<4;t+=.05){sb.time=t;cells.add(F().frameFor(one,null).assetFrame.sourceRect[0]/m.cell[0]);}
 ok('walking cycles through all six move cells and none of the attack cells',[0,1,2,3,4,5].every(k=>cells.has(k))&&![...cells].some(k=>k>5),[...cells]);
 one.moving=false;one.attack={elapsed:.9,shape154:{windup:.4,active:.2,recovery:.4}};const atk=F().frameFor(one,null).assetFrame.sourceRect[0]/m.cell[0];ok('attack uses cells 7-11 by progress',atk>=6&&atk<=10,atk);
 sb.room={samongR103:{zone:'sz115-RD-2'}};const rd=[...Array(40)].map((_,i)=>({id:'rd'+i,hp:10,samongR103:{}}));ok('RD (no matching sheet) keeps its existing art',rd.every(e=>F().frameFor(e,null).path==='base'));
 sb.room={samongR103:{zone:'sz115-S07-1'}};ok('S-07 persona zone still untouched',F().frameFor({id:'p1',hp:10,samongR103:{}},null).path==='base');
 sb.room={samongR103:{zone:'sz115-RE-1'}};ok('RE boss untouched',F().frameFor({id:'b1',hp:10,boss:true,samongR103:{}},null).path==='base');
 let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
 if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
})().catch(e=>{console.error(e);process.exit(1);});
