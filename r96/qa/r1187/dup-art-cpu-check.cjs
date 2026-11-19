// R1187 실패 먼저: Dots CX-0163DU 중복 몹 새 그림 7종(DU-05·07~12)을 R1183 의 '새로 그릴 쪽' 몹에 바꿔 끼운다.
// 사용자 2026-11-19 "중복나오는몹은 닷츠에게 요청하고 어려우면 코드로 색이라도 바꿔".
// 검사: ① 대상 몹이 겹치던 원래 시트를 그릴 때 새 시트(같은 칸 자리)로 바뀌고 색조는 안 얹힘 ② 짝 몹·다른 구역·다른 그림·이펙트는 그대로
//       ③ 새 시트가 아직 안 읽혔으면 색조로 구분(원래 동작) ④ 그림 아직 없는 DU-01~04·06 은 색조 그대로 ⑤ 새 시트 파일·크기·index·빌드 연결
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..');let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}};
const rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return '';}};
const SRC=rd('client-source/mob-dup-tint-r1183.js');
function world(zone,loaded=true){const store={},log=[];const proto={drawImage(img,...a){log.push({src:img.src,filter:this.filter,args:a});}};
 const ctx=Object.create(proto);ctx.filter='none';
 class Img{constructor(){this.complete=loaded;this.naturalWidth=loaded?1024:0;}}
 const C={Math,String,Number,Array,Object,JSON,RegExp,Map,console,Image:Img,setInterval:()=>1,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},ctx,room:/^sz/.test(zone)?{id:'ep1b05',samongR103:{zone}}:{id:zone}};
 C.drawEnemy=function(e){ctx.filter='none';ctx.drawImage({src:'https://x/'+e.path},0,0,256,320,-128,-300,256,320);ctx.drawImage({src:'https://x/assets/vfx/mark.webp'});};
 C.window=C;vm.createContext(C);if(SRC)vm.runInContext(SRC,C);return {C,log};}
const CASES=[ // 이름, 구역, 원래 그림, 바뀔 새 그림(없으면 그대로)
 ['기운 누더기 골렘','sz115-S01-2','assets/r380/mobs/r200-stitched-golem-v2.webp','du05-rag-golem'],['꿰맨 아기 인형','sz115-S01-2','assets/r380/mobs/r200-stitched-golem-v2.webp',null],
 ['제출되지 못한 문장','sz115-RF-1','assets/r290/mobs/m053.webp','du07-reverse-paper'],['제출되지 못한 문장','murder04','assets/r290/mobs/m053.webp',null],
 ['찢어진 사진의 망령','sz115-RC-3','assets/r290/mobs/m088.webp','du08-reverse-photo'],['찢어진 사진의 망령','ep1b03','assets/r290/mobs/m088.webp',null],
 ['백은 없는 그림자','sz115-S07-2','assets/r290/mobs/m082.webp','du09-vermilion-wraith'],['백은 없는 그림자','ep1b10','assets/r290/mobs/m082.webp',null],
 ['부정의 잔영','sz115-P-3','assets/r290/mobs/m066.webp','du10-ink-echo'],['부정의 잔영','ep1a05','assets/r290/mobs/m066.webp',null],
 ['거짓천국 근위천사','sz115-M-1','assets/r410/mobs/m099.webp','du11-faded-guard'],['거짓천국 근위천사','ep1a11','assets/r410/mobs/m099.webp',null],
 ['뿌리에서 쏟아진 잔영','sz115-S01-2','assets/r410/mobs/m063.webp','du12-root-rag'],['뿌리에서 쏟아진 잔영','sz115-P-2','assets/r410/mobs/m063.webp',null]];
for(const [name,zone,p,want] of CASES){const w=world(zone);w.C.drawEnemy({name,path:p});const body=w.log[0],fx=w.log[1];
 if(want){ok(body&&body.src==='assets/r1187/mobs/'+want+'.webp','① '+name+' @'+zone+' 새 시트 ('+(body&&body.src)+')');ok(body&&body.filter==='none','① '+name+' 색조 안 얹음 ('+(body&&body.filter)+')');ok(body&&body.args.join()==='0,0,256,320,-128,-300,256,320','① 칸 자리 그대로');}
 else ok(body&&body.src==='https://x/'+p,'② '+name+' @'+zone+' 원래 그림 그대로');
 ok(fx&&fx.src==='https://x/assets/vfx/mark.webp'&&fx.filter==='none','② 이펙트 그대로');}
{const w=world('sz115-RF-1');w.C.drawEnemy({name:'제출되지 못한 문장',path:'assets/r290/mobs/zz-other.webp'});ok(w.log[0].src==='https://x/assets/r290/mobs/zz-other.webp','② 다른 그림은 안 바꿈');}
{const w=world('sz115-RF-1',false);w.C.drawEnemy({name:'제출되지 못한 문장',path:'assets/r290/mobs/m053.webp'});ok(/hue-rotate/.test(w.log[0].filter)&&/m053/.test(w.log[0].src),'③ 새 시트 읽기 전엔 색조 구분 ('+w.log[0].filter+')');}
{const w=world('ep1b08');w.C.drawEnemy({name:'창처럼 날아오는 역십자가',path:'assets/r116/mobs/M032-idle.png'});ok(/hue-rotate/.test(w.log[0].filter),'④ DU-01 은 색조 그대로');}
let PIL=null;try{PIL=require('child_process').execFileSync('python3',['-c','import sys,json\nfrom PIL import Image\nprint(json.dumps({p:Image.open(p).size for p in sys.argv[1:]}))',
 ...['du05-rag-golem','du07-reverse-paper','du08-reverse-photo','du09-vermilion-wraith','du10-ink-echo','du11-faded-guard','du12-root-rag'].map(f=>path.join(ROOT,'runtime-text/assets/r1187/mobs/'+f+'.webp')),
 ...['r380/mobs/r200-stitched-golem-v2','r290/mobs/m053','r290/mobs/m088','r290/mobs/m082','r290/mobs/m066','r410/mobs/m099','r410/mobs/m063'].map(f=>path.join(ROOT,'runtime-text/assets/'+f+'.webp'))]).toString();}catch(_){}
{const S=PIL?Object.values(JSON.parse(PIL)):[];ok(S.length===14,'⑤ 새 시트 7장 있음');for(let i=0;i<7;i++)ok(S[i]&&S[i+7]&&S[i].join()===S[i+7].join(),'⑤ 새 시트 크기 = 원래 시트 '+i);}
{let ix=null;try{ix=JSON.parse(rd('runtime-text/assets/r1187/mobs/index.json'));}catch(_){}ok(ix&&ix.assets.length===7&&ix.assets.every(a=>a.finalArt===false&&a.sha256&&a.sourceSha256),'⑤ index.json(원본 해시·임시 표시)');}
ok(rd('runtime-text/mob-dup-tint-r1183.js')===SRC&&SRC.length>0,'⑤ runtime-text 사본');ok(rd('runtime-inputs.json').includes('assets/r1187/mobs/du05-rag-golem.webp')&&rd('runtime-manifest.json').includes('assets/r1187/mobs/du12-root-rag.webp'),'⑤ sync 등록');
ok(rd('../scripts/verify-r96-public.py').includes("'assets/r1187/'"),'⑤ verify 자산 접두');ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1187/dup-art-cpu-check.cjs'),'⑤ pages.yml');
console.log(fails?'FAILED '+fails+'/'+n:'ALL PASS '+n);process.exit(fails?1:0);
