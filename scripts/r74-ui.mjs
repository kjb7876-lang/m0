/* Preserve every pinned R73 UI assertion. Wait for the native asynchronous
 * difficulty dialog (or completed entry) instead of guessing with 450ms. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
let source=await fs.readFile('scripts/r73-ui.mjs','utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'d83f1ef6a02b26741f0dfaabca137f5acadeea0d1117c9a22025a911acad38d7');
const old='await page.waitForTimeout(450);';
assert.equal(source.split(old).length-1,1);
source=source.replace(old,"await page.waitForFunction(()=>!!document.getElementById('r71DifficultyConfirm')||zone==='ep1b09'&&layer==='DREAM'&&!loading,null,{timeout:60000});");
source=source.replace("const out='out/r73'","const out='out/r74/ui'");
source=source.replaceAll('R73_UI_','R74_UI_');
await fs.mkdir('out/r74',{recursive:true});
const file='out/r74/ui-generated.mjs';await fs.writeFile(file,source);
if(!process.argv.includes('--prepare-only')){
 const run=spawnSync(process.execPath,[file],{stdio:'inherit',env:process.env});
 if(run.error)throw run.error;
 assert.equal(run.status,0,'R74 actual UI entry, new game, backup, cheat reset and movement regressions');
}
