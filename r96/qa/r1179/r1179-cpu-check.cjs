// R1179 CPU check: 무한생존 사몽 단계에 남아 있던 R248 임시 픽셀 몹 시트 → 드라이브 손그림 후보(R290·R410 규격) 적용.
//  헤드리스 전수(무한생존 72단계, 실제 그리기 명령)로 찾은 '아직 assets/r248/mobs/ 로 그려지는 몹'이 모두 바뀌었는지 본다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),rd=(...p)=>fs.readFileSync(path.join(R,...p),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const F='mob-art-r1179.js',DIR='assets/r1179/mobs/';
// 전수에서 찾은 대상(이름 → R248 시트 id). 이 목록은 무한생존 헤드리스 전수(qa/r1179/r1179-census.mjs) 결과다.
const TARGETS={m077:'외계 침공군',m081:'여섯 물건의 그림자'};
let src='';try{src=rd('client-source',F);}catch(_){}
ok('① 오버레이 '+F+' 가 있음',src.length>0);
let rt='';try{rt=rd('runtime-text',F);}catch(_){}
ok('① runtime-text 사본 = client-source',src.length>0&&rt===src);
const html=rd('runtime-text','index.html'),t=x=>html.indexOf('<script src="./'+x+'"></script>');
ok('② 스크립트 태그 한 번, combat-r118 앞(r176 끝 순서 정규식 그대로)',html.split('"./'+F+'"').length===2&&t(F)>0&&t(F)<t('combat-r118.js'));
const before=t(F)<t('mob-unique-r248-data.js');
let ver='';try{ver=rd('..','scripts','verify-r96-public.py');}catch(_){}
ok('② verify-r96-public.py 기대 목록에 있음',ver.includes("'"+F+"'"));
let inputs='';try{inputs=rd('runtime-inputs.json');}catch(_){}
ok('② runtime-inputs.json 에 js·시트가 있음',inputs.includes('"'+F+'"')&&Object.keys(TARGETS).every(id=>inputs.includes(DIR+id+'.webp')));
// 적용 결과(VM): R248 표 → R410 → R1179
const L={};const w={localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'loading',addEventListener:(k,f)=>{(L[k]=L[k]||[]).push(f);}},addEventListener:(k,f)=>{(L[k]=L[k]||[]).push(f);}};w.window=w;const ctx=vm.createContext(w);
// index.html 실제 순서(R1179 태그가 R248 표보다 앞이면 그 순서로) → 다 읽은 뒤 DOMContentLoaded
const order=before?[F,'mob-unique-r248-data.js','mob-art-r290.js','mob-art-r410.js']:['mob-unique-r248-data.js','mob-art-r290.js','mob-art-r410.js',F];
for(const f of order){try{vm.runInContext(rd('client-source',f),ctx,{filename:f});}catch(e){ok('③ '+f+' 실행 오류 없음',false,String(e).slice(0,160));}}
w.document.readyState='interactive';for(const f of (L.DOMContentLoaded||[]))f();
let idx=null;try{idx=JSON.parse(rd('runtime-text',DIR+'index.json'));}catch(_){}
const D=w.__STORYWORLD_MOB_UNIQUE_R248_DATA__,A=w.__STORYWORLD_MOB_ART_R1179__;
ok('③ API __STORYWORLD_MOB_ART_R1179__ 있음',!!A&&typeof A.inspect==='function');
ok('④ 시트 index.json 있음(출처·해시)',!!idx&&idx.mobs);
ok('④ m081 은 Dots CX-0157PX r2(HOLD r1 손·밑단 고친 판)',!!idx&&/CX-0157PX/.test(JSON.stringify(idx.mobs.m081?.source||{})));
for(const [id,name] of Object.entries(TARGETS)){
 const s=D&&D.sheets[id];ok('③ '+id+' '+name+' → '+DIR+id+'.webp',!!s&&s.name===name&&s.path===DIR+id+'.webp',s&&s.path);
 ok('③ '+id+' 몸 높이(body) 150~280',!!s&&s.body>=150&&s.body<=280,s&&s.body);
 ok('③ '+id+' 몸 높이 = 시트 index.json 의 body(시트를 바꾸면 같이 바뀌어야 화면 키가 맞음)',!!s&&!!idx&&!!idx.mobs[id]&&s.body===idx.mobs[id].body,[s&&s.body,idx&&idx.mobs[id]&&idx.mobs[id].body]);
 let buf=null;try{buf=fs.readFileSync(path.join(R,'runtime-text',DIR+id+'.webp'));}catch(_){}
 const m=idx&&idx.mobs[id];
 ok('④ '+id+' 시트 파일 있음, sha256 = index',!!buf&&!!m&&crypto.createHash('sha256').update(buf).digest('hex')===m.sha256);
 // WebP VP8L(무손실) 머리에서 크기 읽기
 let W=0,H=0;if(buf&&buf.toString('ascii',12,16)==='VP8L'){const b=buf.readUInt32LE(21);W=(b&0x3fff)+1;H=((b>>14)&0x3fff)+1;}
 ok('④ '+id+' 무손실 WebP 1024×960(칸 256×320, 4×3)',W===1024&&H===960,[W,H]);
 ok('④ '+id+' 원본 R248 임시 시트는 지우지 않음',fs.existsSync(path.join(R,'runtime-text','assets/r248/mobs/'+id+'.webp')));}
// 끄기 스위치
if(A&&typeof A.set==='function'){A.set(false);const s=D.sheets.m077;ok('⑤ 끄면 R248 원래 값으로',s.path===undefined);A.set(true);ok('⑤ 다시 켜면 적용',D.sheets.m077.path===DIR+'m077.webp');}else ok('⑤ set 있음',false);
// 다른 시트는 건드리지 않음
ok('⑥ R410 적용 시트(m075)는 그대로',D&&D.sheets.m075.path==='assets/r410/mobs/m075.webp');
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log(c.pass?'PASS':'FAIL',c.name,c.detail!==undefined?JSON.stringify(c.detail):'');
console.log(`R1179 CPU ${pass}/${checks.length}`);process.exit(pass===checks.length?0:1);
