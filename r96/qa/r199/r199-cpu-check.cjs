// R199 CPU check: 형광 만화풍 슬라임 3종만 그리는 동안 몸 필터(기록기 허용 필터만), 다른 몹·보스 불변, drawImage 필터 이어 붙임.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const S=C('mob-style-r199.js'),idx=RT('index.html');
ok('loads after samong-doll-r193, before combat-r118',idx.indexOf('./mob-style-r199.js')>idx.indexOf('./samong-doll-r193.js')&&idx.indexOf('./mob-style-r199.js')<idx.indexOf('./combat-r118.js'));
ok('runtime copy matches',RT('mob-style-r199.js')===S);
ok('in the public verify list',/'mob-style-r199\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
const F=/const FILTER='([^']+)'/.exec(S)[1];ok('filter uses only recorder-safe CSS functions (no blur/drop-shadow)',F.split(/\s+/).every(t=>/^(saturate|brightness|contrast|hue-rotate|grayscale)\(/.test(t))&&!/blur|drop-shadow/.test(F),F);
const calls=[];let ctxFilter='none';
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},ctx:{get filter(){return ctxFilter},set filter(v){ctxFilter=v},save(){},restore(){ctxFilter='none';}},
 drawImage:(p,x,y,w,h,opt)=>{calls.push({p,f:opt&&opt.filter,ctx:ctxFilter});},drawEnemy:function(e){sb.drawImage('body',0,0,1,1,{filter:e.flash?'brightness(1.8)':'none'});}};
vm.createContext(sb);vm.runInContext(S,sb);
sb.drawEnemy({nativeId:'c101-e3',hp:5});ok('slime body gets the tone filter (on drawImage and ctx)',calls[0].f===F&&calls[0].ctx.includes('saturate(.42)'),calls[0]);
sb.drawEnemy({nativeId:'c101-e3',hp:5,flash:1});ok('existing filter (hit flash) is kept and the tone appended',calls[1].f==='brightness(1.8) '+F,calls[1]);
sb.drawEnemy({nativeId:'c101-e1',hp:5});ok('other mobs untouched',calls[2].f==='none'&&calls[2].ctx==='none',calls[2]);
sb.drawEnemy({nativeId:'l304-e1',hp:5,boss:true});ok('bosses untouched even with a listed id',calls[3].f==='none');
sb.drawImage('fx',0,0,1,1,{filter:'none'});ok('drawImage outside a slime draw is untouched (effects, props)',calls[4].f==='none');
sb.window.__STORYWORLD_MOB_STYLE_R199__.set({on:false});sb.drawEnemy({nativeId:'c101-e3',hp:5});ok('off switch restores original look',calls[5].f==='none');
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
