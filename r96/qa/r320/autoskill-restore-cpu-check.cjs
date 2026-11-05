'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const site=path.resolve(__dirname,'../../hospital-three-pc/site'),html=fs.readFileSync(path.join(site,'index.html'),'utf8');
const overlay=fs.readFileSync(process.env.R320_OVERLAY||path.join(site,'save-transition-r320.js'),'utf8');
const cut=(a,b)=>{const start=html.indexOf(a);if(start<0)throw Error('Missing shipped code '+a);const end=html.indexOf(b,start);if(end<0)throw Error('Missing shipped boundary '+b);return html.slice(start,end)};
const nativeRestore=cut('async function restoreSave(raw){','async function loadLocal(){');
const nativeSerialize=cut('function serializeSave(){','function saveGame(notice=true){');
const mobileRestore=cut(' const restoreBase=restoreSave;restoreSave=async function(raw,...args){clearTransitions();',' const hud=updateHUD;');
const bootDefault=cut(" if(typeof settings.autoSkill!=='boolean')settings.autoSkill=true;",' if(room)applyRoom(room,mapMode(room.id,room.layer));');
const out={method:'CPU: shipped native serialize/restore functions and mobile restore wrapper, isolated VM/DOM and synthetic legacy saves. Not browser or natural play.',checks:[]};
function check(name,passed,detail){out.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name)}
function make({value,current=true,mobile=false,pref,missingSettings=false,auto=false,invalid=false,reject=false}={}){
 let release;const wait=new Promise(r=>release=r);
 const p={hero:'hwando',x:15,y:19,hp:777,resonance:80,level:1,xp:0,points:1,upgrades:{},egoCount:0,pending:false,samongCD:0,revived:{},graze:0};
 const raw={version:6,hero:'hwando',zone:'hub',layer:'STORY',time:21,player:{...p},progress:{STORY:{},DREAM:{}},visited:[],rooms:{},auto,settings:missingSettings?undefined:{sound:false,...(value===undefined?{}:{autoSkill:value})},invalid};
 const c={console,document:{readyState:'complete'},settings:{sound:true,music:true,narration:true,lowFx:false,reducedMotion:false,volume:.5,bgm:.5,voice:.5},VERSION:6,COMBAT_HEALTH_R26:1,COMBAT_RHYTHM_R26:1,PIN:'synthetic-cpu',player:{...p},world:{},zone:'hub',layer:'STORY',time:0,progress:{STORY:{},DREAM:{}},visited:new Set(),readScenes:new Set(),ending:{},lastHub:'hub',regions:[{id:'hub',bosses:[]}],regionById:{hub:{safe:true}},portable:{offline:false},auto:true,guide:true,zoom:1,route:[],command:null,cam:{},newGame:()=>true,stopVoice(){},stopEffects(){},completed:()=>false,layerKey:(id,l)=>l+'|'+id,makeRoom:(id,l)=>({id,layer:l,enemies:[]}),blocked:()=>false,finite:(x,d=0)=>Number.isFinite(x)?x:d,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),majorActor3:()=>false,resize(){},refreshIcons(){},toast(){},enterRegion:async()=>{await wait;if(reject)throw Error('controlled restore rejection');return true},tick:()=>1,clearTransitions(){},mobile:()=>mobile,explicit:k=>k==='autoSkill'&&typeof pref==='boolean',prefs:{autoSkill:pref},sync(){}};
 if(current!=='missing')c.settings.autoSkill=current;
 c.validateSave=r=>{if(r.invalid)throw Error('controlled validation rejection');return{raw:r,player:{...r.player},progress:r.progress,visited:r.visited,time:r.time}};
 c.window=c;c.__STORYWORLD_MOBILE_R63__={isMobile:()=>mobile};
 vm.createContext(c);vm.runInContext(nativeSerialize+nativeRestore,c);vm.runInContext('(()=>{'+mobileRestore+'})();',c);vm.runInContext(bootDefault,c);const fresh=c.newGame;vm.runInContext(overlay,c);
 return {c,raw,release,fresh};
}
async function restored(name,options,expected){
 const {c,raw,release,fresh}=make(options);const before=c.settings.autoSkill,pending=c.restoreSave(raw);await Promise.resolve();await Promise.resolve();
 check(name+': async backend does not publish the option early',c.settings.autoSkill===before);
 release();await pending;check(name+': restored option',c.settings.autoSkill===expected,{expected,actual:c.settings.autoSkill});
 check(name+': saved boolean remains serializable',c.serializeSave().settings.autoSkill===expected);
 check(name+': auto basic and guide remain independent',c.auto===(options.auto===true)&&c.guide===false,{auto:c.auto,guide:c.guide});
 check(name+': normal new-game entry is untouched',c.newGame===fresh);
}
(async()=>{
 await restored('desktop OFF after fresh boot',{value:false,current:true},false);
 await restored('desktop ON after prior OFF',{value:true,current:false,auto:true},true);
 await restored('legacy missing field uses fresh default',{current:'missing'},true);
 await restored('legacy missing settings keeps current preference',{current:false,missingSettings:true},false);
 await restored('legacy string is not coerced',{value:'false',current:true},true);
 await restored('legacy numeric field is not coerced',{value:0,current:false},false);
 await restored('mobile explicit OFF keeps existing precedence',{value:true,current:true,mobile:true,pref:false},false);
 await restored('mobile explicit ON keeps existing precedence',{value:false,current:false,mobile:true,pref:true},true);
 for(const [name,options]of [['validation rejection',{value:false,current:true,invalid:true}],['late backend rejection',{value:false,current:true,reject:true}]]){
  const {c,raw,release}=make(options),before=c.settings.autoSkill;const p=c.restoreSave(raw);release();let rejected=false;try{await p}catch{rejected=true}
  check(name+': rejection is preserved',rejected);check(name+': rejected restore does not overwrite option',c.settings.autoSkill===before);
 }
 const {c}=make({value:false});const a=c.serializeSave(),keys=Object.keys(a).sort();check('save schema/version is unchanged',a.version===6&&!keys.includes('autoSkill')&&keys.includes('settings'));check('overlay installs once',c.__STORYWORLD_SAVE_TRANSITION_R320__.inspect().installed===true);const restore=c.restoreSave;vm.runInContext(overlay,c);check('reloading overlay does not duplicate restore wrappers',c.restoreSave===restore);
})().catch(e=>{out.error=e.stack;console.error(e.stack)}).finally(()=>{out.passed=!out.error&&out.checks.every(c=>c.passed);out.total=out.checks.length;fs.writeFileSync(process.env.R320_AUTOSKILL_REPORT||path.join(__dirname,'autoskill-restore-results.json'),JSON.stringify(out,null,2));if(!out.passed)process.exitCode=1});
