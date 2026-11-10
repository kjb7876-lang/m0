'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=process.env.STORYWORLD_QA_ROOT||path.resolve(__dirname,'../..');
const {createHarness}=require(path.join(root,'qa/harness.cjs'));
const report={schema:'r95-save-integrity/v1',startedAt:new Date().toISOString(),method:'Shipped native restore and normalizer in Node VM with synthetic saves, DOM/image/audio/renderer stubs. No real user storage, browser or GPU.',checks:[]};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);};
(async()=>{
 const h=createHarness({timeoutMs:90000}),run=s=>h.run(s);const boot=await h.boot();check('Native runtime boots',boot.booted&&!boot.errors.length);
 const titleStoreBefore=JSON.stringify([...h.storage].filter(([k])=>k.includes('campaign-r63.maps.v1')));
 h.context.badSaveR95={version:6,scope:'hapil.storyworld.depth-full.20261008',hero:'invalid-hero',zone:'hub',layer:'STORY',campaignDifficultyR63:{version:1,maps:{'STORY:dist00':'hard'}}};
 try{await run('restoreSave(badSaveR95)');}catch{}
 check('Rejected title-screen import preserves absent difficulty storage',titleStoreBefore===JSON.stringify([...h.storage].filter(([k])=>k.includes('campaign-r63.maps.v1'))));
 await run("newGame('hwando')");run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);');
 const original=JSON.parse(run('JSON.stringify(serializeSave())'));
 const difficultyBefore=run('JSON.stringify(serializeSave().campaignDifficultyR63)');
 const storeBefore=JSON.stringify([...h.storage].filter(([k])=>k.includes('campaign-r63.maps.v1')));
 h.context.badSaveR95={...original,hero:'invalid-hero',campaignDifficultyR63:{version:1,maps:{'STORY:dist00':'hard'}}};
 let rejected=false;try{await run('restoreSave(badSaveR95)');}catch{rejected=true;}
 check('Malformed hero is rejected',rejected);
 const difficultyAfter=run('JSON.stringify(serializeSave().campaignDifficultyR63)');
 check('Rejected import preserves in-memory difficulty choices',difficultyBefore===difficultyAfter,{before:JSON.parse(difficultyBefore),after:JSON.parse(difficultyAfter)});
 check('Rejected import preserves stored difficulty choices',storeBefore===JSON.stringify([...h.storage].filter(([k])=>k.includes('campaign-r63.maps.v1'))));
 h.context.originalSaveR95=original;await run('restoreSave(originalSaveR95)');run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);');
 const snapshot=()=>run('JSON.stringify({hero:player.hero,hp:player.hp,zone,layer,progress,visited:[...visited],readScenes:[...readScenes],difficulty:serializeSave().campaignDifficultyR63})');
 for(const [name,change]of[
  ['readScenes object',raw=>{raw.readScenes={bad:true};}],
  ['room enemies object',raw=>{raw.rooms['STORY:hub'].enemies={bad:true};}],
  ['checkpoint items string',raw=>{raw.rooms['STORY:hub'].sceneCheckpoint={items:'bad'};}]
 ]){
  const raw=structuredClone(original);change(raw);raw.player.hp=11;raw.healthR71.hp=11;raw.progressionR62.hp=11;h.context.badSaveR95=raw;
  h.context.previousPlayerR95=run('player');
  const before=snapshot();let error=null;try{await run('restoreSave(badSaveR95)');}catch(e){error=e.message;}
  check('Malformed '+name+' is rejected',!!error,{error});
  check('Malformed '+name+' reports a collection error before native restore',!!error&&error.includes('형식이 손상되었습니다.'));
  check('Malformed '+name+' preserves the active journey',before===snapshot()&&run('player===previousPlayerR95'));
  // Restore the valid fixture to keep independent malformed cases isolated.
  await run('restoreSave(originalSaveR95)');run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);');
 }
 const valid=structuredClone(original);valid.campaignDifficultyR63={version:1,maps:{'STORY:hub':'normal','STORY:dist00':'hard'}};h.context.validSaveR95=valid;
 await run('restoreSave(validSaveR95)');
 check('Valid import still restores its difficulty choices',run("serializeSave().campaignDifficultyR63.maps['STORY:dist00']==='hard'"));
 const optional=structuredClone(original);delete optional.visited;delete optional.readScenes;delete optional.rooms['STORY:hub'].enemies;delete optional.rooms['STORY:hub'].sceneCheckpoint;h.context.optionalSaveR95=optional;
 await run('restoreSave(optionalSaveR95)');
 check('Earlier saves may omit optional collections',run("started&&!loading&&zone==='hub'&&player.hp>0"));
 check('Normal save namespace remains unchanged',run("__STORYWORLD_TEST_STORAGE_B1__.prefix==='storyworld.hospital-three-pc.maze.v11:'"));
 check('Native error ledger stays empty',run('errors.length===0'),run('[...errors]'));
})().catch(e=>{report.failure=e.stack;console.error(e.stack);}).finally(()=>{report.completedAt=new Date().toISOString();report.passed=report.checks.every(c=>c.passed)&&!report.failure;fs.writeFileSync(path.join(__dirname,process.env.STORYWORLD_QA_ROOT?'gameplay-save-integrity-before.json':'gameplay-save-integrity.json'),JSON.stringify(report,null,2)+'\n');if(!report.passed)process.exitCode=1;});
