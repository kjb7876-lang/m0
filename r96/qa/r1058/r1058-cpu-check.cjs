// R1058 ep1a09 '갈망 약병장' 그림 바로잡기 — 정적·CPU 검사(화면 검증 아님).
//  ① rooms-r523.js 에 바꿔 그리기(cabOf)가 있고 원본·런타임 사본이 같다 ② 엔진 자료의 두 소품이 아직 폐허 시장 그림을 가리킨다(이 수정이 필요한 전제)
//  ③ cabOf 규칙: ep1a09-cabinet-* + ruined_market 만 바꾸고, 원본 객체는 건드리지 않으며, 자리·이름은 그대로다.
const fs=require('fs'),path=require('path'),R=path.join(__dirname,'..','..');let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok   ':'FAIL ')+m+(d!==undefined?': '+JSON.stringify(d).slice(0,200):''));};
const src=fs.readFileSync(path.join(R,'client-source','rooms-r523.js'),'utf8'),rt=fs.readFileSync(path.join(R,'runtime-text','rooms-r523.js'),'utf8');
ok(src===rt,'client-source 와 runtime-text 사본이 같음');
ok(/function cabOf\(p\)/.test(src)&&/r\.id==='ep1a09'\)\{try\{kept=kept\.map\(cabOf\)/.test(src),'그리기 감싸기 안에서 ep1a09 만 cabOf 를 거침');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
const ids=['ep1a09-cabinet-west-visual-correction','ep1a09-cabinet-east-visual-correction'];
for(const id of ids){const i=html.indexOf('"id":"'+id+'"');const seg=i<0?'':html.slice(i,i+500);ok(i>=0&&/"name":"갈망 약병장"/.test(seg)&&/"path":"assets\/props\/v290\/ruined_market\.webp"/.test(seg),'엔진 자료: '+id+' 는 갈망 약병장·폐허 시장 그림');}
const m=/const CAB_BAD=[^\n]*\nfunction cabOf\(p\)\{[^\n]*\}\n/.exec(src);ok(!!m,'cabOf 원문을 찾음');
if(m){const stats={},ART={medcab:{path:'assets/r521/medicine-cabinet.webp',h:86}};const cabOf=new Function('ART','stats',m[0]+'return cabOf;')(ART,stats);
 const p={id:ids[0],name:'갈망 약병장',x:20.5,y:67.5,path:'assets/props/v290/ruined_market.webp',height:88,solid:false};const snap=JSON.stringify(p),c=cabOf(p);
 ok(c!==p&&c.path===ART.medcab.path&&c.height===86,'약병장은 병원 약장 그림·키로 그려짐',[c.path,c.height]);
 ok(c.x===p.x&&c.y===p.y&&c.name===p.name&&c.solid===false&&c.id===p.id,'자리·이름·판정 그대로');
 ok(JSON.stringify(p)===snap,'원본 소품은 바뀌지 않음');ok(cabOf(p)===c,'같은 소품은 같은 사본을 다시 씀(프레임마다 새로 만들지 않음)');
 p.x=21;ok(cabOf(p)!==c&&cabOf(p).x===21,'자리가 바뀌면 사본도 따라감');
 const o1={id:'ep1a10-prop-3',path:'assets/props/v290/ruined_market.webp'},o2={id:ids[1],path:'assets/r521/medicine-cabinet.webp'};
 ok(cabOf(o1)===o1,'다른 지역 소품은 그대로');ok(cabOf(o2)===o2,'이미 다른 그림이면 그대로');ok(cabOf(null)===null,'빈 값 통과');}
ok(fs.existsSync(path.join(R,'runtime-text','assets','r521','medicine-cabinet.webp')),'약장 그림 파일 있음');
console.log('\nR1058 CPU: '+(n-bad)+'/'+n);process.exit(bad?1:0);
