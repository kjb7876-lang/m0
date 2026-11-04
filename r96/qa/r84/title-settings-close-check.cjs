'use strict';
// Exercise shipped settings handlers, including R63's coarse-pointer branch.
const assert = require('node:assert/strict');
const {createHarness} = require('./settings-harness.cjs');
(async () => {
  const h = createHarness({timeoutMs:90000});
  await h.boot();
  for (const coarse of [false, true]) {
    h.run(`matchMedia=()=>({matches:${coarse},addListener(){},removeListener(){}});showTitle();`);
    h.run("document.getElementById('titleSettingsR84').onclick()");
    assert.equal(h.run("!!document.getElementById('settingsClose')"), true);
    h.run("document.getElementById('settingsClose').onclick()");
    assert.equal(h.run("!started&&modal&&!!document.getElementById('campaignNew54')"), true,
      `Closing title Settings must restore start actions (coarse=${coarse})`);
    assert.equal(h.run("document.getElementById('hospitalDirectStart')===null"), true);
  }
  // Fixture-only lifecycle setup: gameplay settings must retain native resume.
  h.run("started=true;showSettings();document.getElementById('settingsClose').onclick()");
  assert.equal(h.run('started&&!modal'), true, 'Mobile in-game Settings still resumes');
  console.log('PASS title settings return (desktop/mobile) and mobile gameplay resume');
})().catch(e => { console.error(e); process.exitCode=1; });
