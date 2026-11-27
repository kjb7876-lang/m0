// R1363 EGO 3D 몸 깜빡임 — 순수 함수 검사(브라우저 없음). 실제 프레임 측정은 r1363-browser.mjs(헤드리스).
//  ① 원본 = runtime-text 사본, R1363 판. ② 시트 겹쳐 흐리기(앞 시트 0~.5 + 새 시트 1): 이름 후보들의 알파를 가장 큰 값으로 → R1302 가 어느 한 장을 골라도 1.
//  ③ 다 함께 흐릴 때(죽음 등)는 그 값 그대로, 후보가 하나면·exact 몸이 있으면 손대지 않음, 이펙트(이름 없음)·r350 은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const F='hero-fx-3d-r1336.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'① 오버레이 원본 = runtime-text 사본');
const win={};const sb={window:win,document:{baseURI:'http://x/m0/'},URL,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},performance:{now:()=>0},Number,Math,Object,String,Array,JSON,RegExp,Set,WeakSet,console,decodeURIComponent};
vm.createContext(sb);vm.runInContext(src,sb,{filename:F});const api=win.__STORYWORLD_HERO_FX3D_R1336__;
ok(/^r1363/.test(api.inspect().revision)&&typeof api.steady==='function','① R1363 판·steady');
const own={kind:'hero',id:'hero:2',bodyPath:'assets/hero-authored-v314rc5/hwando-walk-atlas.png'},img=(src,a,o={})=>({kind:'image',sourcePath:src,owner:{...own,...(o.owner||{})},style:{globalAlpha:a},...o});
{const old=img('assets/r1176/ego2d/walk-right.webp',0),nw=img('assets/r1176/ego2d/run-rear.webp',1),aura=img('assets/r100/sig-aura-red.webp:800,0,160,160:4:hero:hwando:b',.42),halo=img('assets/r1048/fx/ego_halo.webp',.5,{owner:{r350:true}});
 const st=old.style,n=api.steady([aura,old,nw,halo],'ego');ok(n===1&&old.style.globalAlpha===1&&nw.style.globalAlpha===1,'② 사라지는 앞 시트(0)·새 시트(1) → 둘 다 1');
 ok(st.globalAlpha===0,'② 원래 style 객체는 건드리지 않음(새 객체로 바꿔 끼움)');ok(aura.style.globalAlpha===.42&&halo.style.globalAlpha===.5,'③ 이펙트·r350 은 그대로');}
{const a=img('assets/r1176/ego2d/walk-right.webp',.3),b=img('assets/r1176/ego2d/run-right.webp',.2);api.steady([a,b],'ego');ok(a.style.globalAlpha===.3&&b.style.globalAlpha===.3,'③ 다 함께 흐릴 때는 가장 큰 값(.3) 그대로');}
{const a=img('assets/r1176/ego2d/walk-right.webp',.4);ok(api.steady([a],'ego')===0&&a.style.globalAlpha===.4,'③ 후보 하나면 그대로');}
{const ex=img('assets/hero-authored-v314rc5/hwando-walk-atlas.png',.5),b=img('assets/r1176/ego2d/run-right.webp',0);ok(api.steady([ex,b],'ego')===0&&b.style.globalAlpha===0,'③ exact 몸이 있으면 손대지 않음(R1302 가 그것만 고름)');}
ok(/stats\.lastSteady=steady\(commands,hero\)/.test(src),'④ R1302 가 읽기 바로 앞(같은 감싸기)에서 부름');
console.log(fail?`\nR1363 CPU FAIL ${fail}`:'\nR1363 CPU PASS');process.exit(fail?1:0);
