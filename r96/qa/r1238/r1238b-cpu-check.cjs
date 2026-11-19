// R1238b 네온 좌우 공격 파생 시트(가로 .88·머리 .88) — CPU 검사.  node r96/qa/r1238/r1238b-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const F='neon-attack-r1238.js',P='assets/r1238/neon/attack-e.webp',OLD='assets/r437/attack/neon/attack-e.webp',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
{const h=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok(h.split('"./'+F+'"').length===2&&h.indexOf(F)>h.indexOf('hero-blocked-r1238.js')&&h.indexOf(F)<h.indexOf('persona-stride-r1104.js'),'스크립트 태그 한 번, hero-blocked-r1238 뒤');}
for(const k of ['runtime-inputs.json','runtime-manifest.json']){const t=fs.readFileSync(path.join(R,k),'utf8');ok(t.includes(F)&&t.includes(P),k+' 에 js·시트 등록');}
const buf=fs.readFileSync(path.join(R,'runtime-text',P));ok(buf.length>20000&&buf.length<400000,'파생 시트 있음·크기 적당',buf.length);
ok(fs.existsSync(path.join(R,'runtime-text',OLD)),'원본 R437 시트 그대로 남음');
const ROW=Object.freeze({path:OLD,cell:[224,256],foot:[69,226],body:180,tips:[[198,102],[190,101],[210,100],[219,97],[209,101],[198,102]]});
function load(pref,{ready=true}={}){const win={},asked=[];const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,String,console,Date,Promise,setInterval:()=>0,
 document:{readyState:'complete'},player:{hero:'neon'},readyImage:p=>ready?{image:{src:p}}:null,ensureImages:a=>{asked.push(...a);}};
 win.__STORYWORLD_NEON_LAUREN_R437__=Object.freeze({r1108:true,attackSheet:(h,sd)=>sd==='e'?(h==='neon'?ROW:{path:'assets/r437/attack/lauren/attack-e.webp',cell:[232,256],foot:[84,226],body:205,tips:[]}):null,tipFor:(p,sr)=>p===OLD?['old']:null});
 vm.createContext(sb);vm.runInContext(src,sb);return {api:win.__STORYWORLD_NEON_ATTACK_R1238__,win,asked};}
{const o=load(null),A=o.win.__STORYWORLD_NEON_LAUREN_R437__;ok(A.r1238===true&&A.r1108===true,'R437 API 감쌈(R1108 표식 유지)');
 const r=A.attackSheet('neon','e');ok(r.path===P&&r.body===180&&String(r.cell)==='224,256'&&String(r.foot)==='69,226','네온 e → 파생 시트, 칸·발·몸 키 그대로');
 ok(r.tips.every((t,i)=>Math.abs(t[0]-(69+(ROW.tips[i][0]-69)*.88))<.06&&t[1]===ROW.tips[i][1]),'창끝 표 = 뒷발 기준 가로 .88배');
 ok(A.attackSheet('neon','e')===r,'같은 줄은 같은 사본(매 장면 새 객체 안 만듦)');
 ok(A.attackSheet('neon','w')===null&&A.attackSheet('lauren','e').path.includes('lauren'),'w·라우렌은 그대로');
 const t=A.tipFor(P,[224*3,0,224,256]);ok(Math.abs(t[0]-201/224)<1e-3&&Math.abs(t[1]-97/256)<1e-3,'tipFor: 파생 시트 칸 3 창끝');
 ok(A.tipFor(OLD,[0,0,224,256])[0]==='old','tipFor: 다른 그림은 원래 함수');
 ok(A.tipFor('http://x/m0/'+P,[224*5,0,224,256])!==null,'tipFor: 주소 앞붙임도 인식');}
{const o=load(null,{ready:false}),r=o.win.__STORYWORLD_NEON_LAUREN_R437__.attackSheet('neon','e');ok(r===ROW&&o.asked.includes(P),'새 그림 준비 전이면 R437 그대로 + 받기 요청');}
{const o=load({on:false}),r=o.win.__STORYWORLD_NEON_LAUREN_R437__.attackSheet('neon','e');ok(r===ROW,'끄기 설정이면 그대로');}
{const o=load(null);o.api.test.hook();ok(o.win.__STORYWORLD_NEON_LAUREN_R437__.attackSheet('neon','e').path===P,'두 번 감싸지 않음');}
console.log(`\nR1238b CPU ${n} 통과`);
