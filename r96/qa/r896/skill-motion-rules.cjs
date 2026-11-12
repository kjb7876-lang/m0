// R896 판정: 스킬마다 시전 뒤 1초 안 몸 그림 가운데 대기·걷기 그림이 아닌(공격·스킬·이동) 칸이 없거나, 처음 나타난 때가 0.25초보다 늦으면
// "스킬 쓰는데 몸이 가만히 있음"(S1)으로 센다. cast=false 는 바로 안 나가고 대기열(거너 연쇄)로 늦게 나간 경우다.
const fs=require('fs');const [,,file]=process.argv;const R=JSON.parse(fs.readFileSync(file,'utf8'));let fail=0;const rows=[];
for(const [hero,{rec,casts}] of Object.entries(R)){
 for(const [slot,ok] of casts){
  const idle=new Set(rec.filter(r=>r.ph==='idle-'+slot&&r.b).map(r=>r.b.s+'|'+r.b.sx+'|'+r.b.sy));
  const c=rec.filter(r=>r.ph==='cast-'+slot&&r.b);const novel=c.filter(r=>!idle.has(r.b.s+'|'+r.b.sx+'|'+r.b.sy)&&!/idle|walk|stand/i.test(r.b.s.split('/').pop()));
  const first=c.find(r=>novel.includes(r));const delay=first?+(first.t-c[0].t).toFixed(2):null;
  const paths=[...new Set(c.map(r=>r.b.s.split('/').slice(-2).join('/')))].join(' ');
  const verdict=novel.length===0||delay>.25?'FAIL':'ok';if(verdict==='FAIL')fail++;
  rows.push(`${verdict.padEnd(6)} ${hero.padEnd(9)} ${slot}  frames=${c.length} novel=${novel.length} delay=${delay} cast=${ok} body=${paths}`);
 }
}
console.log(rows.join('\n'));console.log('S1 스킬 시전에 몸 동작 없음:',fail);process.exitCode=fail?1:0;
