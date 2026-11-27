// R1379 CPU 검사: Dots SW-R1352 D11 슬레이어 W 발밑 노바 24칸 + D12 사몽 적중 문양 18칸.
//  시트 규격·연결(index.html·sync·verify·pages) + R108 PRE.nova 슬레이어 십자가 대체 + R572 슬레이어 문양 대체 + 그리기 크기·칸·알파·끄기.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL '+m+(d!==undefined?' '+JSON.stringify(d):''));}else console.log('ok   '+m);};
const rd=p=>fs.readFileSync(p,'utf8');
const N='slayer-dots-r1379.js',NOVA='assets/r1379/slayer-w-nova-24.webp',MARK='assets/r1379/slayer-samong-impact-18.webp';
const S=rd(path.join(R,'client-source',N));ok(fs.existsSync(path.join(R,'runtime-text',N))&&S===rd(path.join(R,'runtime-text',N)),'runtime-text 사본 같음');
function wsz(p){const buf=fs.readFileSync(path.join(R,'runtime-text',p));const t=buf.toString('ascii',12,16);
 const s=t==='VP8X'?[1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)]:t==='VP8L'?(b=>[(b&0x3fff)+1,((b>>14)&0x3fff)+1])(buf.readUInt32LE(21)):[buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
 return {riff:buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP',lossless:t==='VP8L'||buf.includes('VP8L'),s,len:buf.length};}
{const a=wsz(NOVA);ok(a.riff&&a.lossless&&a.s[0]===1536&&a.s[1]===1024&&a.len<400000,'D11 시트 무손실 webp 1536×1024(6×4칸 256)',a);}
{const a=wsz(MARK);ok(a.riff&&a.lossless&&a.s[0]===1536&&a.s[1]===768&&a.len<400000,'D12 시트 무손실 webp 1536×768(6×3칸 256)',a);}
// 연결
const html=rd(path.join(R,'runtime-text','index.html'));const iN=html.indexOf('src="./'+N+'"'),i108=html.indexOf('src="./fx-eden-r108.js"'),i572=html.indexOf('src="./samong-theme-r572.js"'),i118=html.indexOf('src="./combat-r118.js"');
ok(iN>0&&i118>iN&&/\n<script src="\.\/slayer-dots-r1379\.js"><\/script>\n/.test(html),'index.html: 자기 줄, combat-r118 앞',{iN,i108,i572,i118});
ok(rd(path.join(ROOT,'scripts','verify-r96-public.py')).includes(N),'공개 확인 기대 목록에 있음');
ok(rd(path.join(ROOT,'.github','workflows','pages.yml')).includes('r1379-cpu-check.cjs'),'pages.yml CPU 줄');
const man=rd(path.join(R,'runtime-manifest.json'));ok(man.includes(N)&&man.includes(NOVA)&&man.includes(MARK),'runtime-manifest 에 js·시트 두 장');
// R108 훅: 슬레이어일 때만 십자가 두 장 대신 R1379
const E=rd(path.join(R,'client-source','fx-eden-r108.js'));const pn=E.slice(E.indexOf('PRE.nova='),E.indexOf('return true;};',E.indexOf('PRE.nova=')));
ok(/e\.hero==='slayer'&&window\.__STORYWORLD_SLAYER_DOTS_R1379__\?\.nova\?\.\(/.test(pn),'R108 PRE.nova: 슬레이어면 R1379 nova 를 먼저 물음',pn.slice(0,200));
ok(/if\(!d11\)\{S\('cross',F,[^;]*;S\('cross',pb\(F\),[^;]*;\}/.test(pn),'R108: R1379 가 그렸으면 십자가 두 장만 건너뜀(적중 금빛·불꽃·볼트는 그대로)');
ok(/clip\('hit\.gold'/.test(pn)&&/S\('flare'/.test(pn),'R108: 적중 금빛·불꽃 남음');
ok(rd(path.join(R,'runtime-text','fx-eden-r108.js'))===E,'R108 runtime-text 사본 같음');
const T5=rd(path.join(R,'client-source','samong-theme-r572.js'));const cs=T5.slice(T5.indexOf("case'slayer':"),T5.indexOf("case'gunner':"));
ok(/case'slayer':if\(window\.__STORYWORLD_SLAYER_DOTS_R1379__\?\.mark\?\.\(x,y,h,age,m\.x,m\.y\)\)break;/.test(cs),'R572 슬레이어 문양: R1379 가 그렸으면 사선 대신',cs.slice(0,160));
ok(rd(path.join(R,'runtime-text','samong-theme-r572.js'))===T5,'R572 runtime-text 사본 같음');
// 그리기
function world(store,have){const calls=[];const C={save(){calls.push(['save'])},restore(){calls.push(['restore'])},drawImage(...a){calls.push(['img',a[0].src,a.slice(1),this.globalAlpha,this.globalCompositeOperation]);},globalAlpha:1,globalCompositeOperation:'source-over'};
 const sb={console,Date,Math,JSON,localStorage:{getItem:()=>store||null,setItem(){}},ctx:C,readyImage:p=>(have===false?null:{image:{src:p,naturalWidth:1536,naturalHeight:1024}}),ensureImages:()=>Promise.resolve()};sb.window=sb;
 vm.createContext(sb);vm.runInContext(S,sb);return {sb,calls};}
{const {sb,calls}=world(),A=sb.__STORYWORLD_SLAYER_DOTS_R1379__;ok(!!A&&typeof A.nova==='function'&&typeof A.mark==='function','API');
 ok(A.nova(100,200,.45,.9,60)===true,'nova 그림');const c=calls.find(c=>c[0]==='img');
 ok(c&&c[1]===NOVA,'nova 시트',c);if(c){const [sx,sy,sw,sh,dx,dy,dw,dh]=c[2];ok(sx===0&&sy===2*256&&sw===256&&sh===256,'T .45/.9 → 12번 칸(6열: 0,512)',c[2]);
  ok(Math.abs(dw-480)<1e-9&&dw===dh&&Math.abs(dx+dw/2-100)<1e-9&&Math.abs(dy+dh/2-200)<1e-9,'크기 h×k×8, 기준점 칸 가운데(돌리지·누르지 않음)',c[2]);
  ok(c[3]<=.5&&c[3]>=.4&&c[4]==='source-over','알파 ≤.5(R1369 기타), source-over',[c[3],c[4]]);}
 calls.length=0;ok(A.nova(100,200,.95,.9,60)===true&&!calls.some(c=>c[0]==='img'),'수명 끝: 그리지 않되 십자가도 안 돌아옴');
 calls.length=0;ok(A.mark(50,60,42,0)===true,'mark 그림');const m=calls.find(c=>c[0]==='img');
 ok(m&&m[1]===MARK&&m[2][0]===0&&m[2][1]===0,'문양 0번 칸',m);if(m){ok(Math.abs(m[2][6]-42*2.2)<1e-9&&Math.abs(m[2][4]+m[2][6]/2-50)<1e-9&&Math.abs(m[2][5]+m[2][7]/2-60)<1e-9,'문양 크기 h×2.2(보이는 폭 ≈ 몹 몸 폭), 가운데 기준',m[2]);ok(Math.abs(m[3]-.6)<1e-9,'첫 .1초 알파 .6(R1369)',m[3]);}
 calls.length=0;A.mark(50,60,42,.5);const m2=calls.find(c=>c[0]==='img');ok(m2&&m2[2][0]===3*256&&m2[2][1]===256&&Math.abs(m2[3]-.3)<1e-9,'age .5 → 9번 칸(3,1), 알파 .3(몸 위 겹침)',m2&&[m2[2],m2[3]]);
 ok(Math.abs(A.markAlpha(.13)-.45)<1e-9,'.1→.16초 사이 .6→.3 선형');
 ok(A.nova(NaN,1,.1,.9,60)===false&&A.mark(1,1,Infinity,.1)===false,'NaN·무한 입력은 false(예전 그림)');}
{const {sb,calls}=world(),A=sb.__STORYWORLD_SLAYER_DOTS_R1379__;const sc=[];sb.ctx.scope=(o,f)=>{sc.push(o);f();};
 A.nova(1,1,.1,.9,60,5,6);A.mark(1,1,40,.1,7,8);ok(sc.length===2&&sc[0].groundAligned===true&&sc[0].kind==='effect'&&sc[0].x===5&&sc[0].y===6&&/^r1379:nova:/.test(sc[0].id)&&sc[1].groundAligned===false&&/^r1379:mark:/.test(sc[1].id)&&calls.filter(c=>c[0]==='img').length===2,'기록기 owner: 노바는 바닥 붙음(R350 가림 옅게 제외·몸이 깊이로 가림), 문양은 몸 위 이펙트',sc);}
{const {sb,calls}=world(null,false),A=sb.__STORYWORLD_SLAYER_DOTS_R1379__;ok(A.nova(1,1,.1,.9,60)===false&&A.mark(1,1,40,.1)===false&&!calls.length,'시트 준비 전: false → 예전 십자가·사선');}
{const {sb}=world('{"on":false}'),A=sb.__STORYWORLD_SLAYER_DOTS_R1379__;ok(A.nova(1,1,.1,.9,60)===false&&A.mark(1,1,40,.1)===false,'끄기 설정: 예전 그림');}
console.log(`\n${n-bad}/${n} ok`);process.exit(bad?1:0);
