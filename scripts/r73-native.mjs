/* Preserve the pinned native assertions. Only acknowledge the new explicit
 * slot confirmation through its actual UI before the original startup wait. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/r71-native.browser.test.mjs','--prepare-only'],{stdio:'inherit'});
const input='out/r71/native/r71-native-generated.mjs',output='out/r73/native-generated.mjs';let source=await fs.readFile(input,'utf8');
const click="await page.locator('#campaignNew54').click({timeout:60000});";
assert.equal(source.split(click).length-1,1);
source=source.replace(click,click+"if(await page.locator('#slotConfirmR73').count())await page.locator('#slotConfirmR73').click();");
await fs.mkdir('out/r73',{recursive:true});await fs.writeFile(output,source);
const run=spawnSync(process.execPath,[output],{stdio:'inherit',env:process.env});if(run.error)throw run.error;assert.equal(run.status,0,'R73 native silver/EGO/HP/save regression');
