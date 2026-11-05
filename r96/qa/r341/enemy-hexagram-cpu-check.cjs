// R341 CPU 검사: 적 쪽 십자가 표현 → 흑마법진·육망성, 아군 쪽 십자가는 그대로, 사몽 적 예고에 runecross 없음.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(R,'client-source','enemy-hexagram-r341.js'),'utf8');
let ok=0,bad=0;const t=(c,m)=>{if(c){ok++;console.log('ok  ',m);}else{bad++;console.log('FAIL',m);}};
const drawn=[];let baseHaz=0;
const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'complete',body:null},
 room:{enemies:[{name:'역십자가 시체경호체'},{name:'미카엘라의 십자가 수호자'}]},console};
ctx.window.__STORYWORLD_FX_SPRITES_R106__={on:()=>true,draw:(n,p,...r)=>drawn.push(n)};
const filled=[];ctx.CanvasRenderingContext2D=function(){};ctx.CanvasRenderingContext2D.prototype.fillText=function(s){filled.push(s);};ctx.drawHazard=function(){baseHaz++;};ctx.project=(x,y)=>({x:x*40,y:y*20});
vm.createContext(ctx);vm.runInContext(src,ctx);
const A=ctx.window.__STORYWORLD_ENEMY_HEXAGRAM_R341__;
t(A&&A.revision==='R341-enemy-hexagram-1','API 노출');
const S=A.swap;
const cases=[['거꾸로 된 십자가와 피로 그린 육망성','검은 마법진과 피로 그린 육망성'],['거꾸로 매달린 십자가','거꾸로 매달린 흑마법진'],
 ['황금빛 역십자가 형태의 탄막','황금빛 육망성 형태의 탄막'],['황금 역십자가의 탄막','황금 육망성의 탄막'],['거꾸로 된 십자가 창','육망성 창'],
 ['역십자가 시체경호체','흑마법진 시체경호체'],['창처럼 날아오는 역십자가','창처럼 날아오는 육망성'],['치료거부 성광십자','치료거부 성광 육망성'],
 ['벽에 거꾸로 된 십자가가 걸려 있다','벽에 흑마법진가 걸려 있다'.replace('흑마법진가','흑마법진이')]];
for(const[a,b]of cases.slice(0,8))t(S(a)===b,`바꿈: ${a} → ${b}`);
t(S('벽에 거꾸로 된 십자가가 걸려 있다')==='벽에 흑마법진이 걸려 있다','일반 문장 속 적 십자가 + 조사 맞춤(가→이)');
t(S('역십자를 그렸다')==='육망성을 그렸다'&&S('역십자로 찔렀다')==='육망성으로 찔렀다','조사 맞춤(를→을, 로→으로)');
t(S('역십자가의 탄막')==='육망성의 탄막','역십자가 + 의');
for(const s of['청진기 옆에는 십자가와 오래된 은제 인장','미카엘라가 십자가를 들어 올렸다','J 의 십자 인장이 빛났다'])t(S(s)===s,`아군 십자가 그대로: ${s}`);
const c2=new ctx.CanvasRenderingContext2D();c2.fillText(ctx.room.enemies[0].name,0,0);c2.fillText(ctx.room.enemies[1].name,0,0);
t(filled[0]==='흑마법진 시체경호체','캔버스에 그리는 적 보스 이름 바꿈');t(filled[1]==='미카엘라의 십자가 수호자','역십자 아닌 이름 그대로');
t(ctx.room.enemies[0].name==='역십자가 시체경호체','e.name(그림 찾기 열쇠)은 그대로 둠');
ctx.drawHazard({asset:'assets/x/cross-seal.png',x:1,y:1,radius:2,age:.2,warning:1,life:3});
t(baseHaz===0&&drawn.filter(n=>n==='rune').length===2,'cross-seal 위험지대 → 핏빛 육망성(원래 그림 안 그림)');
ctx.drawHazard({asset:'assets/x/fire.png',x:1,y:1,radius:2,age:.2,warning:1,life:3});t(baseHaz===1,'다른 위험지대는 원래대로');
t(!drawn.includes('cross')&&!drawn.includes('runecross'),'적 그림에 십자 스프라이트 안 씀');
for(const f of['samong-play-r162.js','samong-r161.js'])t(!/runecross/.test(fs.readFileSync(path.join(R,'client-source',f),'utf8')),`${f}: 적 예고에 runecross 없음`);
for(const d of['client-source','runtime-text'])t(fs.readFileSync(path.join(R,d,'enemy-hexagram-r341.js'),'utf8')===src,`${d} 사본 일치`);
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
t(html.includes('<script src="./terrain-readability-r323.js"></script><script src="./enemy-hexagram-r341.js"></script>'),'index.html 스크립트 태그');
console.log(`R341 ${ok}/${ok+bad}`);process.exit(bad?1:0);
