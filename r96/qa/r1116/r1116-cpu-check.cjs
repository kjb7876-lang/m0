// R1116 EGO 칼 곧게 — 미리 구운 수묵 시트에서 휜 칼날을 지우고 곧은 칼로 다시 그린 48장을 쓰는지 검사.
// 사용자 11-16 "검도 휘고" → "그방법으로해결개선"(칼날 지우고 곧은 칼 다시 그려 48장 재굽기).
const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'../..');
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('ok  '+m);}else{fail++;console.log('FAIL '+m);}};
const src=fs.readFileSync(path.join(R,'client-source/ego-ink-r1099.js'),'utf8');
const rt=fs.readFileSync(path.join(R,'runtime-text/ego-ink-r1099.js'),'utf8');
const s=src.indexOf('/*R1112-PRE*/'),e=src.indexOf('/*R1112-PRE-END*/');
const PRE=JSON.parse(src.slice(s+'/*R1112-PRE*/'.length,e));
// ① 미리 구운 표가 곧은 칼 판(r1116)을 가리킨다
ok(PRE.base==='assets/r1116/ego-ink/','① PRE.base = assets/r1116/ego-ink/ (지금 '+PRE.base+')');
// ② 판 번호: 기존 검사가 요구하는 R1099 접두어 유지 + R1116 표시
const rev=(src.match(/const REV='([^']+)'/)||[])[1]||'';
ok(/^R1099/.test(rev)&&/R1116/.test(rev),'② revision '+rev+' (R1099 접두어 + R1116)');
ok(src===rt,'③ client-source 와 runtime-text 사본이 같다');
// ④ 48장 모두 있고 크기가 표와 같다(webp 머리말에서 읽음)
function webpSize(b){
 if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;
 const t=b.toString('ascii',12,16);
 if(t==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
 if(t==='VP8L'){const v=b.readUInt32LE(21);return [1+(v&0x3fff),1+((v>>14)&0x3fff)];}
 if(t==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
 return null;}
const keys=Object.keys(PRE.sheets);
ok(keys.length===48,'④ 표에 48장 ('+keys.length+')');
let bad=[];
for(const k of keys){const [,,,,ow,oh,n]=PRE.sheets[k];const p=path.join(R,'runtime-text',PRE.base,k+'.webp');
 if(!fs.existsSync(p)){bad.push(k+':없음');continue;}const sz=webpSize(fs.readFileSync(p));
 if(!sz||sz[0]!==ow*n||sz[1]!==oh)bad.push(k+':'+(sz||'?'));}
ok(bad.length===0,'⑤ r1116 48장이 모두 있고 크기 = 칸너비×칸수 × 칸높이 '+bad.slice(0,5).join(' '));
// ⑥ 원본(r1112) 48장은 그대로 남는다(지우거나 덮어쓰지 않음)
ok(keys.every(k=>fs.existsSync(path.join(R,'runtime-text/assets/r1112/ego-ink',k+'.webp'))),'⑥ 원본 r1112 48장 보존');
// ⑦ runtime 목록에 들어 있다
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
ok(keys.every(k=>inputs.textPaths.includes('assets/r1116/ego-ink/'+k+'.webp')),'⑦ runtime-inputs textPaths 에 48장');
// ⑧ 곧게 편 결과표: 칼이 보인 칸마다 고친 뒤 중심선이 직선에서 벗어난 정도
const rp=path.join(R,'qa/r1116/straighten-report.json');
ok(fs.existsSync(rp),'⑧ 결과표 straighten-report.json');
if(fs.existsSync(rp)){
 const rep=JSON.parse(fs.readFileSync(rp,'utf8'));const rows=[].concat(...Object.values(rep)).filter(Boolean);
 const before=rows.map(r=>r.bend),after=rows.filter(r=>r.bendAfter!=null).map(r=>r.bendAfter);
 const mean=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
 ok(rows.length>=150,'⑨ 칼을 찾아 다시 그린 칸 '+rows.length+'개 (150 이상)');
 ok(mean(after)<mean(before)*0.8,'⑩ 휨 평균 '+mean(before).toFixed(2)+' → '+mean(after).toFixed(2)+'px (20% 이상 줄어듦)');
 const big=rows.filter(r=>r.bendAfter!=null&&r.bendAfter>4.5);
 ok(big.length<=rows.length*0.05,'⑪ 고친 뒤 4.5px 넘게 휜 칸 '+big.length+'개 (5% 이하)');
}
console.log(JSON.stringify({check:'R1116 ego blade straight',pass,fail}));
process.exit(fail?1:0);
