// R1299c CPU 검사 — 발록의 소환진(R251) 공격의 영웅 발밑 육망성을 코드 선 대신 프레임 시트로.
//  코디네이터 2026-11-21 15:47Z(사용자 상시 규칙 '도형 금지, 모든 적 스킬은 프레임 애니메이션'): "발록 소환진 발밑 육망성 코드 선도 시트 그림(기존 자산 우선…)으로".
//  실측(qa/r1299/audit.md #10): 예고 1.2초 동안 ctx.arc 원 채움·원 테두리·hexPath 육망성 선을 코드로 그림.
//  정상: 예고 중 육망성은 assets/r1299/hexagram-sheet.webp(Dots R299 핏빛 육망성 데칼에서 만든 8칸) 0~5칸이 차례로, 손이 솟는 동안 6~7칸. 원·선 그리기 0.
//  경계: 시트가 아직 안 받아졌으면 그 프레임은 건너뜀(도형으로 돌아가지 않음, 오류 0). 깨짐 연출·손 그림·진 그림은 그대로. 판정(위험지대) 그대로.
//  회귀: R251 CPU 검사, 자산 색인 sha, runtime 사본, pages.yml 줄.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok   ':'FAIL ')+m+(c||d===undefined?'':' '+JSON.stringify(d).slice(0,300)));};
const SRC=fs.readFileSync(path.join(R,'client-source/summoning-r251.js'),'utf8');
const SHEET='assets/r1299/hexagram-sheet.webp';
function mk({sheet=true}={}){const calls=[];
 const ctx={globalAlpha:1,filter:'none',globalCompositeOperation:'source-over',lineWidth:1,fillStyle:'',strokeStyle:'',font:'',textAlign:'',
  save(){},restore(){},translate(){},scale(){},rotate(){calls.push('rotate');},setTransform(){},
  beginPath(){calls.push('beginPath');},arc(){calls.push('arc');},ellipse(){calls.push('ellipse');},moveTo(){calls.push('moveTo');},lineTo(){calls.push('lineTo');},
  stroke(){calls.push('stroke');},fill(){calls.push('fill');},fillRect(){calls.push('fillRect');},fillText(){},
  drawImage(im,...a){calls.push({img:im.src,a});}};
 const imgs={'assets/r251/circle.webp':{src:'assets/r251/circle.webp',width:1536,height:256},'assets/r251/hands.webp':{src:'assets/r251/hands.webp',width:1024,height:640}};
 if(sheet)imgs[SHEET]={src:SHEET,width:1024,height:512};
 const sb={console,Math,JSON,Object,Array,Number,String,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},window:{},time:10,uid:1,layer:'STORY',zoom:1,ctx,calls,
  player:{x:20,y:20,hp:500},room:{id:'dist06',enemies:[{id:'balrog',name:'발록 · 지옥의 문지기',boss:true,x:24,y:20,hp:0,maxHp:10000,damage:50}]},
  hazards:[],effects:[],blocked:()=>false,toast(){},saveGame(){},tick(){},drawEnemy(){return 'base';},drawEffect(){return 'base';},drawHazard(){return 'base';},
  serializeSave:()=>({}),restoreSave:async()=>true,project:(x,y)=>({x:x*40,y:y*20}),actorHeight:()=>60,
  readyImage:p=>imgs[p]?{image:imgs[p]}:null,ensureImages:()=>Promise.resolve()};
 sb.window=sb;vm.createContext(sb);vm.runInContext(SRC,sb);return sb;}
const fxOf=sb=>sb.effects.find(e=>e.type==='r251-fx');
function drawAt(sb,t){sb.time=t;sb.calls.length=0;sb.drawEffect(fxOf(sb));return sb.calls.slice();}
const shapes=c=>c.filter(x=>typeof x==='string'&&/^(arc|ellipse|lineTo|moveTo|stroke|fill)$/.test(x)).length;
const sheetFrames=c=>c.filter(x=>x&&x.img===SHEET).map(x=>Math.round(x.a[0]/256)+4*Math.round(x.a[1]/256));
{const sb=mk();sb.tick();const c=sb.room.enemies.find(e=>e.r251Circle);ok(!!c,'소환진 생김');
 sb.time=12.6;sb.tick();ok(sb.hazards.some(h=>h.r251)&&!!fxOf(sb),'공격 시전(위험지대·그림 효과)');
 const warn=[12.7,12.95,13.2,13.45,13.7].map(t=>drawAt(sb,t));
 ok(warn.every(c=>shapes(c)===0),'예고 중 원·선 코드 그리기 0',warn.map(shapes));
 const fr=warn.map(c=>sheetFrames(c));ok(fr.every(f=>f.length===2&&f[0]===f[1]),'예고 중 매 프레임 육망성 시트 같은 칸 2겹',fr);
 const seq=fr.map(f=>f[0]);ok(seq.every((v,i)=>v>=0&&v<=5&&(!i||v>=seq[i-1]))&&seq.at(-1)>seq[0],'예고 중 0~5칸이 차례로 그어짐',seq);
 const hands=[13.9,14.3,14.6].map(t=>drawAt(sb,t));
 ok(hands.every(c=>shapes(c)===0),'손이 솟는 동안 원·선 코드 그리기 0',hands.map(shapes));
 ok(hands.every(c=>sheetFrames(c).every(v=>v===6||v===7)&&sheetFrames(c).length===2),'손이 솟는 동안 6~7칸',hands.map(sheetFrames));
 ok(hands.every(c=>c.some(x=>x&&x.img==='assets/r251/hands.webp')),'빨간 손 그림 그대로');
 ok([...warn,...hands].every(c=>!c.includes('rotate')),'시트를 돌리지 않음(기록기가 돌린 그림을 못 그림 — 헤드리스 실측)');
 ok(sb.window.__STORYWORLD_SUMMONING_R251__.inspect().stats.errors===0,'오류 0');}
// 경계: 시트가 아직 없음
{const sb=mk({sheet:false});sb.tick();sb.time=12.6;sb.tick();const c=drawAt(sb,13);
 ok(shapes(c)===0&&sheetFrames(c).length===0,'시트 없으면 건너뜀(도형으로 돌아가지 않음)',c);ok(sb.window.__STORYWORLD_SUMMONING_R251__.inspect().stats.errors===0,'시트 없어도 오류 0');}
// 경계: 판정 그대로
{const sb=mk();sb.tick();sb.time=12.6;sb.tick();const h=sb.hazards.find(h=>h.r251);ok(h&&h.radius===1.6&&h.warning===1.2&&h.damage===30,'위험지대 판정 그대로',h);}
// 자산
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1299/index.json'),'utf8')).items['hexagram-sheet'];
const buf=fs.readFileSync(path.join(R,'runtime-text',SHEET));
ok(idx&&idx.sha256===crypto.createHash('sha256').update(buf).digest('hex')&&idx.frames===8&&idx.cell===256,'시트 색인 sha·8칸');
ok(/r299\/hexagram\.webp/.test(idx.source)&&fs.existsSync(path.join(ROOT,'scripts/r1299-hexagram-sheet.py')),'출처(Dots R299 데칼)·만든 스크립트');
ok(fs.readFileSync(path.join(R,'runtime-text/summoning-r251.js'),'utf8')===SRC,'runtime 사본 같음');
ok(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('r1299/hexagram-sheet.webp')&&fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('r1299/hexagram-sheet.webp'),'runtime-inputs·manifest 에 시트(sync-r99)');
ok(/r96\/qa\/r1299\/r1299c-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8')),'pages.yml CPU 검사 줄');
console.log(`R1299c CPU: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
