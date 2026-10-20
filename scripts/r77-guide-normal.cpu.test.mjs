import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';

const html = fs.readFileSync('_pages/docs/index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('_pages/docs/web-manifest-r62.json', 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
function script(id) {
  const match = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</script>'));
  assert.ok(match, `compiled R77 HTML contains ${id}`);
  return match[1];
}
const guideRuntime = script('guide-r77');
const guideR75 = script('guide-r75');
const campaign = script('campaign-combat-r63r1');

function game() {
  const clock = {now: 0, nextId: 1, jobs: new Map()};
  const button = {isConnected: false};
  const document = {hidden: false, listeners: {}, addEventListener(name, fn) {this.listeners[name] = fn;}};
  const voiceElement = {paused: true, ended: true};
  const box = {
    console, document, Date: {now: () => clock.now}, voiceElement, __button: button,
    setTimeout(fn, delay) {const id = clock.nextId++; clock.jobs.set(id, {at: clock.now + delay, fn}); return id;},
    clearTimeout(id) {clock.jobs.delete(id);},
  };
  box.window = box;
  vm.createContext(box);
  vm.runInContext(`
    var guide=true,auto=true,started=true,modal=false,loading=false,layer='STORY',zone='current',time=0,transitionCD=0;
    var player={hp:100},storyScene=null,storyQueue=[],advanceCalls=0,voiceGeneration=0,nativeVoiceStarts=0;
    var narrationMode='none',finishNarration=null,openPanelCalls=0,stopped=0,role='off',cheat=false,egoVisit=false;
    var pendingId='next',regionById={current:{exits:{east:'next'}},next:{exits:{}}};
    var voiceElement=window.voiceElement;
    function $(id){return id==='storyNext'&&window.__button.isConnected?window.__button:null;}
    function firstPending(){return{id:pendingId};}
    function stopVoice(){voiceGeneration++;stopped++;voiceElement.paused=true;voiceElement.ended=true;}
    function playVoice(scene){stopVoice();const token=voiceGeneration;if(narrationMode==='playing')return new Promise(resolve=>{finishNarration=ok=>{if(ok&&token===voiceGeneration){voiceElement.paused=false;voiceElement.ended=false;nativeVoiceStarts++;}resolve(ok);};});if(narrationMode==='blocked')return Promise.resolve(false);return Promise.resolve();}
    function advanceScene(){advanceCalls++;stopVoice();storyScene=storyQueue.shift()||null;modal=!!storyScene;window.__button.isConnected=!!storyScene;if(storyScene&&narrationMode!=='none')playVoice(storyScene);}
    function openPanel(){openPanelCalls++;window.__button.isConnected=false;}
    function tick(){}
    async function enterRegion(){return true;}
    async function restoreSave(){return true;}
    async function newGame(){return true;}
    function showDeath(){}
    window.__STORYWORLD_COOP_SIM_R62__={mode:()=>role};
    window.__STORYWORLD_CHEAT777__={active:()=>cheat};
    window.__STORYWORLD_EGO151__={inspect:()=>({isVisit:egoVisit})};
    window.__STORYWORLD_ROUTES_R72__={status:direction=>({open:true,role:'next',destination:'next',direction})};
  `, box);
  vm.runInContext(guideRuntime, box);
  const advance = ms => {
    const end = clock.now + ms;
    while (true) {
      const ready = [...clock.jobs.entries()].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!ready) break;
      const [id, job] = ready;
      clock.jobs.delete(id);
      clock.now = job.at;
      job.fn();
    }
    clock.now = end;
  };
  const show = (part = 'pre', text = 'A short readable scene.', key = '01:' + part) => {
    box.storyQueue = [{id: 'current', part, text, key}];
    box.advanceScene();
  };
  const flush = async () => {await Promise.resolve(); await Promise.resolve();};
  return {box, clock, button, advance, show, flush};
}

test('R77 manifest pins the compiled guide overlay and leaves the approved renderer unchanged', () => {
  const row = manifest.r77;
  assert.ok(row, 'R77 overlay metadata is present');
  assert.equal(guideRuntime.trim(), fs.readFileSync('client-source/guide-r77.js', 'utf8').trim(), 'generated runtime exactly matches its approved R77 source');
  assert.equal(row.htmlSha256, hash(Buffer.from(html)));
  assert.equal(row.rendererCacheKey, 'r76=1');
  assert.equal(row.normalTravelScope, 'one-use guide-issued open next-story portal only; existing story admission/guest guards retained');
  assert.deepEqual(row.sceneAdvance.parts, ['pre', 'post', 'firstPost', 'awakenPre', 'prologue.pre', 'prologue.post']);
  assert.equal(row.sceneAdvance.minimumDelayMs, 6000);
  assert.equal(row.sceneAdvance.maximumDelayMs, 45000);
  assert.equal(row.sceneAdvance.waitForNarration, true);
  assert.equal(manifest.files.find(file => file.path === 'dist/phase1.js').sha256, row.rendererSha256);
  assert.equal(row.baselineR76RendererSha256, row.rendererSha256);
  assert.doesNotMatch(guideRuntime, /\bauto\s*=/, 'R77 does not change manual/semi/full-auto preferences');
  assert.match(html, /guide=!guide;auto=guide;guideTimer=0;window\.__STORYWORLD_GUIDE_R77__\?\.syncGuide\(\);/, 'existing guide toggle semantics remain intact');
});

test('exact emitted R77 runtime bounds readable Continue to current narrative and excludes deliberate checkpoints', () => {
  const x = game();
  const api = x.box.__STORYWORLD_GUIDE_R77__;
  x.show('pre', 'Brief text');
  assert.equal(api.inspect().scene.scheduled, true);
  assert.equal(x.clock.jobs.size, 1);
  x.advance(5999);
  assert.equal(x.box.advanceCalls, 1);
  x.advance(1);
  assert.equal(x.box.advanceCalls, 2);

  for (const part of ['body', 'innerReveal', 'hidden.persona', 'finale.core-preserved', 'journal:current']) {
    const y = game();
    y.show(part, 'This is not an automatic checkpoint.');
    assert.equal(y.box.__STORYWORLD_GUIDE_R77__.inspect().scene.scheduled, false, part);
    assert.equal(y.clock.jobs.size, 0, part);
  }
  const long = game();
  long.show('post', 'X'.repeat(1000));
  assert.equal(long.box.__STORYWORLD_GUIDE_R77__.inspect().events.at(-1).delayMs, 45000);
  assert.doesNotMatch(guideRuntime, /\bvoiceGeneration\b/, 'R77 narration state cannot overwrite the game voice-generation token');
});

test('R77 waits for native narration playback after playVoice resolves, then advances once audio ends', async () => {
  const x = game();
  x.box.narrationMode = 'playing';
  x.show('pre', 'Narration must finish before this scene continues.');
  await x.flush();
  assert.equal(x.box.__STORYWORLD_GUIDE_R77__.inspect().scene.voicePending, true);
  x.advance(6000);
  assert.equal(x.box.advanceCalls, 1);
  assert.equal(x.clock.jobs.size, 1, 'voice polling remains scheduled while the request is pending');
  x.box.finishNarration(true);
  await x.flush();
  assert.equal(x.box.voiceGeneration > 0, true, 'native playVoice generation remains intact');
  assert.equal(x.box.nativeVoiceStarts, 1);
  x.advance(1400);
  assert.equal(x.box.advanceCalls, 1, 'active media blocks Continue after playVoice start resolves');
  x.box.voiceElement.paused = true;
  x.box.voiceElement.ended = true;
  x.advance(350);
  assert.equal(x.box.advanceCalls, 2);
  assert.equal(x.box.__STORYWORLD_GUIDE_R77__.inspect().events.filter(event => event.kind === 'scene-auto-continue').length, 1);
});

test('missing or blocked narration does not strand an otherwise readable scene', async () => {
  for (const mode of ['none', 'blocked']) {
    const x = game();
    x.box.narrationMode = mode;
    x.show('prologue.pre', 'Text remains readable without playable audio.');
    await x.flush();
    x.advance(6000);
    assert.equal(x.box.advanceCalls, 2, mode);
  }
});

test('guide OFF, hidden-page return and replacement panels cancel or re-arm only the live scene timer', () => {
  const off = game();
  off.show('pre');
  off.box.guide = false;
  off.box.__STORYWORLD_GUIDE_R77__.syncGuide();
  assert.equal(off.clock.jobs.size, 0);
  off.advance(60000);
  assert.equal(off.box.advanceCalls, 1);
  off.box.guide = true;
  off.box.__STORYWORLD_GUIDE_R77__.syncGuide();
  assert.equal(off.clock.jobs.size, 1);

  const hidden = game();
  hidden.show('post');
  hidden.box.document.hidden = true;
  hidden.box.document.listeners.visibilitychange();
  assert.equal(hidden.clock.jobs.size, 0);
  hidden.advance(90000);
  assert.equal(hidden.box.advanceCalls, 1);
  hidden.box.document.hidden = false;
  hidden.box.document.listeners.visibilitychange();
  assert.equal(hidden.clock.jobs.size, 1, 'visible return re-arms the still-current story');
  hidden.advance(5999);
  assert.equal(hidden.box.advanceCalls, 1);
  hidden.advance(1);
  assert.equal(hidden.box.advanceCalls, 2);

  const replaced = game();
  replaced.show('pre');
  replaced.box.openPanel('menu', false);
  assert.equal(replaced.clock.jobs.size, 0, 'any panel replacement cancels the owned Continue timer');
  replaced.advance(60000);
  assert.equal(replaced.box.advanceCalls, 1);

  const tickOff = game();
  tickOff.show('pre');
  tickOff.box.guide = false;
  tickOff.box.tick();
  assert.equal(tickOff.clock.jobs.size, 0, 'runtime guide OFF observed by the main tick cancels the timer');
});

test('map, restore, new game and death invalidate scene timers and any unconsumed portal intent', async () => {
  for (const action of ['enterRegion', 'restoreSave', 'newGame', 'showDeath']) {
    const x = game();
    const token = x.box.__STORYWORLD_GUIDE_R77__.armNextNormal({kind: 'portal', direction: 'east'}, 'current', 'STORY');
    assert.ok(token, action);
    x.show('pre');
    if (action === 'showDeath') x.box.showDeath();
    else await x.box[action]('next', null, {r72Portal: 'previous'});
    assert.equal(x.clock.jobs.size, 0, action);
    assert.equal(x.box.__STORYWORLD_GUIDE_R77__.inspect().intent, null, action);
  }
});

test('one-use Normal intent is scoped to guide authority, next open portal, matching map/layer and current progression', () => {
  const x = game();
  const api = x.box.__STORYWORLD_GUIDE_R77__;
  const goal = {kind: 'portal', direction: 'east'};
  const token = api.armNextNormal(goal, 'current', 'STORY');
  assert.ok(token);
  assert.equal(api.takeNextNormal('next', 'STORY', 'current'), 'normal');
  assert.equal(api.takeNextNormal('next', 'STORY', 'current'), null, 'intent is single-use');
  assert.equal(api.armNextNormal({...goal, kind: 'enemy'}, 'current', 'STORY'), false);

  x.box.role = 'host';
  assert.ok(api.armNextNormal(goal, 'current', 'STORY'), 'existing host guide authority remains allowed');
  assert.equal(api.takeNextNormal('next', 'STORY', 'current'), 'normal', 'host intent is usable by canonical next-story admission');
  x.box.role = 'guest';
  assert.equal(api.armNextNormal(goal, 'current', 'STORY'), false);
  x.box.role = 'off';

  x.box.cheat = true;
  assert.equal(api.armNextNormal(goal, 'current', 'STORY'), false, '777 travel cannot inherit guide Normal');
  x.box.cheat = false;
  x.box.egoVisit = true;
  assert.equal(api.armNextNormal(goal, 'current', 'STORY'), false, 'EGO visit cannot inherit guide Normal');
  x.box.egoVisit = false;

  const stale = api.armNextNormal(goal, 'current', 'STORY');
  assert.ok(stale);
  x.box.__STORYWORLD_ROUTES_R72__.status = () => ({open: false, role: 'next', destination: 'next'});
  assert.equal(api.takeNextNormal('next', 'STORY', 'current'), null, 'a portal closed after arming is rejected');
  x.box.__STORYWORLD_ROUTES_R72__.status = () => ({open: true, role: 'next', destination: 'next'});

  const changedPending = api.armNextNormal(goal, 'current', 'STORY');
  assert.ok(changedPending);
  x.box.pendingId = 'later';
  assert.equal(api.takeNextNormal('next', 'STORY', 'current'), null, 'progression changes invalidate an armed intent');
  x.box.pendingId = 'next';

  const expired = api.armNextNormal(goal, 'current', 'STORY');
  assert.ok(expired);
  x.advance(3001);
  assert.equal(api.takeNextNormal('next', 'STORY', 'current'), null, 'expired intent cannot authorize later entry');
});

test('compiled guide portal dispatch and campaign admission use the one-use token; manual and guest travel retain picker/denial', async () => {
  assert.match(guideR75, /if\(goal\.kind==='portal'\)\{const guideR77=window\.__STORYWORLD_GUIDE_R77__,intentR77=guideR77\?\.armNextNormal\(goal,zone,layer\)/);
  const dispatch = guideR75.match(/if\(goal\.kind==='portal'\)\{const guideR77=[\s\S]*?\}else interact\(\);/)?.[0];
  assert.ok(dispatch, 'compiled R75 guide dispatch arms immediately at travel()');
  const begin = campaign.indexOf('if(nextStory(id,l)){');
  const end = campaign.indexOf('if(hasBeenVisited(id,l))', begin);
  assert.ok(begin >= 0 && end > begin, 'compiled R63 next-story admission branch exists');
  const admission = campaign.slice(begin, end);
  assert.ok(admission.indexOf("if(coopMode()==='guest')") < admission.indexOf('takeNextNormal'), 'guest rejection precedes token consumption');
  assert.match(admission, /if\(!guidedNormal\)return picker\.call\(this,id,from,options\)/);
  assert.match(admission, /difficultyR63:guidedNormal/);

  const x = game();
  const box = x.box;
  let picks = 0, guestToasts = 0, accepted = null;
  box.picker = function() {picks++; return false;};
  box.toast = function() {guestToasts++;};
  box.nextStory = () => true;
  box.coopMode = () => box.role;
  const wrapper = `function admissionRun(id,l,from,options){${admission}return options;}`;
  vm.runInContext(wrapper, box);
  box.travel = direction => {
    const result = box.admissionRun('next', 'STORY', 'current', {});
    accepted = result?.difficultyR63 || null;
    return Promise.resolve(accepted === 'normal');
  };
  vm.runInContext(`function dispatchPortal(goal){${dispatch}}`, box);
  box.dispatchPortal({kind: 'portal', direction: 'east'});
  assert.equal(accepted, 'normal', 'guide dispatch flows through compiled campaign admission with Normal');
  await x.flush();
  assert.equal(box.__STORYWORLD_GUIDE_R77__.inspect().intent, null);
  assert.equal(picks, 0);

  box.role = 'host';
  box.dispatchPortal({kind: 'portal', direction: 'east'});
  assert.equal(accepted, 'normal', 'an authorized host follows the same canonical Normal path');
  await x.flush();
  assert.match(campaign, /const chosen=options\.difficultyR63\|\|mapMode\(id,l\);setMapMode\(id,l,chosen\)/, 'host mode is handed to the existing saved/co-op setMapMode path');
  box.role = 'off';

  accepted = null;
  box.travel('east');
  assert.equal(accepted, null, 'manual portal entry receives no guide Normal token');
  assert.equal(picks, 1, 'manual next-story entry keeps the existing difficulty picker');

  box.role = 'guest';
  box.dispatchPortal({kind: 'portal', direction: 'east'});
  assert.equal(guestToasts, 1);
  assert.equal(picks, 1, 'guest entry is denied before picker/Normal override');
});

test('v3 save keeps guide/auto fields; legacy saves missing guide remain OFF and R77 adds no save fields', () => {
  const serializeAt = html.indexOf('serializeSave=function(){const data=v2Serialize3();data.schemaVersion=3;');
  const serializeEnd = html.indexOf('\nsaveGame=function', serializeAt);
  assert.ok(serializeAt > 0 && serializeEnd > serializeAt);
  const serializer = html.slice(serializeAt, serializeEnd);
  const c = {world: {}, guide: true, v2Serialize3: () => ({auto: false})};
  vm.createContext(c);
  vm.runInContext(serializer, c);
  const saved = c.serializeSave();
  assert.equal(saved.guide, true);
  assert.equal(saved.auto, false);
  assert.doesNotMatch(guideRuntime, /serializeSave\s*=|\.guide\s*=|raw\.guide/, 'R77 stores only transient timer/intent state');

  assert.match(html, /auto=raw\.auto!==false;guide=raw\.guide===true;/, 'final v3 restore preserves explicit guide and defaults missing legacy guide to OFF');
  for (const raw of [{auto: false, guide: true}, {auto: true, guide: false}, {auto: false}]) {
    const restore = {raw, auto: true, guide: true};
    vm.createContext(restore);
    vm.runInContext('auto=raw.auto!==false;guide=raw.guide===true;', restore);
    assert.equal(restore.auto, raw.auto !== false);
    assert.equal(restore.guide, raw.guide === true);
  }
});
