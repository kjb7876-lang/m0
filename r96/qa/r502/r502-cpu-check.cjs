// R502 CPU check: L 키 시야 바꾸기 — 기본 은은한 원형에서 L 을 누르면 바깥에서는 아무것도 안 바뀌는 '자동'으로 먼저 가서
//  "L 이 안 먹는다"로 보이던 문제. L 은 은은한 원형 → 전체 → 횃불 → 손전등 → 은은한 원형으로 돌고, '자동'은 설정 창에서만 고른다.
const fs=require('fs'),path=require('path'),vm=require('vm');const ROOT=path.resolve(__dirname,'../../');const C=f=>fs.readFileSync(path.join(ROOT,'client-source',f),'utf8');
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL '+m+(x!==undefined?' '+JSON.stringify(x):''));}else console.log('PASS '+m);};
function light(stored,roomObj){const store={};if(stored)store['storyworld.r182.light']=stored;const toasts=[];const sb={console,Math,JSON,Object,Array,Number,String,RegExp,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},window:{},document:{getElementById:()=>null,querySelector:()=>null},addEventListener(){},requestAnimationFrame(){},toast:t=>toasts.push(t),settings:{flashlight58:false},room:roomObj||{id:'hub'},started:true,player:{x:1,y:1}};vm.createContext(sb);vm.runInContext(C('light-r182.js'),sb);return {L:sb.window.__STORYWORLD_LIGHT_R182__,toasts,store};}
{const {L}=light(null);const seq=[];for(let i=0;i<4;i++){L.toggle();seq.push(L.choice());}ok('L from default glow: full → torch → flashlight → glow (no invisible auto step)',seq.join()==='full,torch,flashlight,glow',seq);}
{const {L}=light(JSON.stringify({mode:'auto',v:455}));L.toggle();ok('from auto (picked in the settings select), L goes to full',L.choice()==='full',L.choice());}
{const {L,toasts}=light(null);L.toggle();ok('each L press still shows the mode toast',/전체/.test(toasts[0]||''),toasts);}
{const {L}=light(null);L.set({mode:'auto'});ok('regression: auto can still be picked from the select and is kept',L.choice()==='auto');}
{const {L}=light(JSON.stringify({mode:'torch',v:455}));L.toggle();ok('regression: torch → flashlight',L.choice()==='flashlight');L.toggle();ok('…flashlight → glow (back to default)',L.choice()==='glow');}
{const {L}=light(null);ok('regression: MODES list (select options) still has all five',L.MODES.join()==='glow,auto,full,torch,flashlight',L.MODES);}
console.log((bad?'R502 CPU CHECK FAILED ':'R502 CPU CHECK PASSED ')+(n-bad)+'/'+n);process.exit(bad?1:0);
