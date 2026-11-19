// R1218b·c: 사몽 보스 교주의 인장(S05)·검은 명령선(S06)·코어 아래의 검은 뿌리(P-2) 가 범용 꼭두각시 대신 Dots CX-0175SB 시트를 쓴다.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..');const rt=path.join(R,'runtime-text');let ok=0,bad=0;
const t=(n,c)=>{if(c){ok++;console.log('ok  ',n);}else{bad++;console.log('FAIL',n);}};
const idx=JSON.parse(fs.readFileSync(path.join(rt,'assets/r380/mobs/index.json'),'utf8'));
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'),man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');
const want=[['samong-s05-cult-seal-v1','교주의 인장','S05-6','S06-23','CX-0175SB-02'],['samong-s06-command-wire-v1','검은 명령선','S06-23','S05-6','CX-0175SB-03'],['samong-p2-core-root-v1','코어 아래의 검은 뿌리','P-2',null,'CX-0175SB-04']];
for(const [id,name,zone,other,src] of want){const m=idx.mobs.find(x=>x.id===id);t(id+' 항목',!!m);if(!m)continue;
 const f=path.join(rt,m.path),b=fs.readFileSync(f);
 t(id+' 바이트·해시',b.length===m.bytes&&crypto.createHash('sha256').update(b).digest('hex')===m.sha256);
 t(id+' 9칸(move4·attack4·idle1)',m.cols===9&&m.move.join()==='0,1,2,3'&&m.attack.join()==='4,5,6,7'&&m.idle.join()==='8');
 t(id+' 보스·꿈 층',m.actor.layer==='DREAM'&&m.actor.boss===true&&new RegExp(m.actor.name).test(name));
 t(id+' 구역 한정',new RegExp(m.actor.samong).test(zone)&&(other===null||new RegExp(m.actor.samong).test('S-'+zone.slice(1,3)))&&(other===null||!new RegExp(m.actor.samong).test(other)));
 t(id+' 원본 Dots 표기',m.source.length===3&&m.source.every(s=>s.file.startsWith(src)&&/^[0-9a-f]{64}$/.test(s.sha256)));
 t(id+' runtime 목록',inputs.includes(m.path)&&man.includes(m.path));
 // 같은 이름을 먼저 가로채는 꿈 층 항목이 없어야 한다(r200 그림자 항목은 shade 조건이라 제외)
 const first=idx.mobs.find(x=>x.actor.layer==='DREAM'&&!x.actor.shade&&new RegExp(x.actor.name).test(name));t(id+' 첫 매치',first&&first.id===id);}
{const m=idx.mobs.find(x=>x.id==='samong-p2-core-root-v1');t('검은 뿌리 떨어진 붓자국 제거 기록',m&&/붓자국/.test(m.source[2].edit||''));}
console.log(`R1218b ${ok}/${ok+bad}`);process.exit(bad?1:0);
