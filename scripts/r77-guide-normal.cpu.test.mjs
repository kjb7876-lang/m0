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
const nativePortalLoopStart = html.indexOf('for(const d of Object.keys(regionById[zone].exits))if(distance(player,exitPoint(d))<.85');
const nativePortalLoopEnd = html.indexOf('if(time-lastSave>18)', nativePortalLoopStart);
assert.ok(nativePortalLoopStart >= 0 && nativePortalLoopEnd > nativePortalLoopStart,
  'compiled core tick contains the native portal proximity dispatch');
const nativePortalLoop = html.slice(nativePortalLoopStart, nativePortalLoopEnd);

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
    var pendingId='next',currentComplete=false,storyAvailable=true,readScenes=new Set(),regionById={current:{safe:false,records:[{}],exits:{east:'next'}},next:{safe:false,records:[{}],exits:{}}};
    var voiceElement=window.voiceElement;
    function $(id){return id==='storyNext'&&window.__button.isConnected?window.__button:null;}
    function firstPending(){return{id:pendingId};}
    function completed(id){return id===zone&&currentComplete;}
    function storyReady(def){return def===regionById[zone]&&storyAvailable&&!currentComplete;}
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
  const show = (part = 'pre', text = 'A short readable scene.', key = '01:' + part, id = 'current') => {
    box.storyQueue = [{id, part, text, key}];
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
  assert.deepEqual(row.sceneAdvance.parts, ['pre', 'post', 'firstPost', 'awakenPre', 'prologue.pre', 'prologue.post', 'body']);
  assert.equal(row.sceneAdvance.safeBodyScope, 'current unread safe-region narrative only; canonical key; journal/completed replay excluded');
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

test('safe-region body Continue is limited to the current unread canonical story scene', () => {
  const key = 'STORY:current:body:r75';
  const safe = game();
  safe.box.regionById.current.safe = true;
  safe.show('body', 'An unread safe-map record.', key);
  assert.equal(safe.box.__STORYWORLD_GUIDE_R77__.inspect().scene.scheduled, true);
  safe.advance(6000);
  assert.equal(safe.box.advanceCalls, 2);

  const blocked = [
    {name: 'journal replay', prepare: x => {x.box.regionById.current.safe = true;}, key: 'journal:current:r75', id: 'current'},
    {name: 'already-read body', prepare: x => {x.box.regionById.current.safe = true; x.box.readScenes.add(key);}, key, id: 'current'},
    {name: 'completed safe map', prepare: x => {x.box.regionById.current.safe = true; x.box.currentComplete = true;}, key, id: 'current'},
    {name: 'not current story-ready map', prepare: x => {x.box.regionById.current.safe = true; x.box.storyAvailable = false;}, key, id: 'current'},
    {name: 'ordinary unsafe-region body', prepare: () => {}, key, id: 'current'},
    {name: 'wrong-region scene object', prepare: x => {x.box.regionById.current.safe = true;}, key, id: 'other'},
    {name: 'wrong-region canonical key', prepare: x => {x.box.regionById.current.safe = true;}, key: 'STORY:other:body:r75', id: 'current'},
    {name: 'noncanonical body key', prepare: x => {x.box.regionById.current.safe = true;}, key: 'STORY:current:body', id: 'current'},
  ];
  for (const row of blocked) {
    const x = game();
    row.prepare(x);
    x.show('body', 'This body must remain manual.', row.key, row.id);
    assert.equal(x.box.__STORYWORLD_GUIDE_R77__.inspect().scene.scheduled, false, row.name);
    assert.equal(x.clock.jobs.size, 0, row.name);
  }
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

  x.box.regionById.next.safe = true;
  assert.equal(api.armNextNormal(goal, 'current', 'STORY'), false, 'safe narrative records do not receive Normal picker overrides');
  x.box.regionById.next.safe = false;

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
  const end = campaign.indexOf('if(options.fastTravelR63&&coopMode()', begin);
  assert.ok(begin >= 0 && end > begin, 'compiled R63 next-story admission and retry-frontier guards exist');
  const admission = campaign.slice(begin, end);
  assert.ok(admission.indexOf("if(coopMode()==='guest')") < admission.indexOf('takeNextNormal'), 'guest rejection precedes token consumption');
  assert.match(admission, /if\(!guidedNormal\)return picker\.call\(this,id,from,options\)/);
  assert.match(admission, /setMapMode\(id,l,guidedNormal\);return enterBase\.call\(this,id,from,\{\.\.\.options,layer:l,difficultyR63:guidedNormal\}\)/);
  assert.match(admission, /if\(hasBeenVisited\(id,l\)\)/, 'only the Normal guide bypasses the legacy visited-frontier guard');
  const setMapMode = campaign.match(/function setMapMode\(id,l,tier\)\{[^\n]+\}/)?.[0];
  assert.ok(setMapMode, 'actual R63 setMapMode implementation is present');

  const x = game();
  const box = x.box;
  let picks = 0, guestToasts = 0, blocked = 0;
  box.coopSession = () => box.role === 'host' ? {} : null;
  box.inCoop = () => !!box.coopSession();
  box.validTier = value => value;
  box.roomKey = (id, layer) => layer + ':' + id;
  box.COOP_KEY = 'difficulty';
  box.coopPrefs = new Map();
  box.prefs = new Map();
  box.world = {};
  box.savePrefs = () => {box.preferenceSaves++;};
  box.preferenceSaves = 0;
  box.baseOptions = null;
  box.baseCalls = 0;
  box.enterBase = function(id, from, options) {box.baseCalls++; box.baseOptions = options; return true;};
  box.picker = function() {picks++; return false;};
  box.toast = function() {guestToasts++;};
  box.showBlocked = function() {blocked++;};
  box.nextStory = () => true;
  box.hasBeenVisited = () => true;
  box.coopMode = () => box.role;
  const wrapper = `${setMapMode}\nfunction admissionRun(id,l,from,options){const r=regionById[id];if(!options.restore&&!options.fastTravelR63&&id!==zone&&r.records?.length&&!r.safe){${admission}return false;}`;
  vm.runInContext(wrapper, box);
  box.travel = direction => {
    box.baseOptions = null;
    const result = box.admissionRun('next', 'STORY', 'current', {});
    return Promise.resolve(result === true);
  };
  vm.runInContext(`function dispatchPortal(goal){${dispatch}}`, box);
  box.dispatchPortal({kind: 'portal', direction: 'east'});
  assert.equal(box.baseOptions?.difficultyR63, 'normal', 'guide dispatch flows through compiled campaign admission with Normal');
  assert.equal(box.baseOptions?.layer, 'STORY');
  assert.equal(box.baseCalls, 1, 'guided Normal goes through the canonical entry base despite a previously visited frontier');
  assert.equal(blocked, 0);
  assert.equal(box.prefs.get('STORY:next'), 'normal', 'solo guide choice uses the existing saved map preference');
  assert.equal(box.preferenceSaves, 1);
  await x.flush();
  assert.equal(box.__STORYWORLD_GUIDE_R77__.inspect().intent, null);
  assert.equal(picks, 0);

  box.role = 'host';
  box.dispatchPortal({kind: 'portal', direction: 'east'});
  assert.equal(box.baseOptions?.difficultyR63, 'normal', 'an authorized host follows the same canonical Normal path');
  assert.equal(box.baseCalls, 2);
  assert.equal(box.coopPrefs.get('STORY:next'), 'normal', 'host choice follows existing co-op preference storage');
  assert.equal(box.preferenceSaves, 1, 'co-op host preferences do not write solo prefs');
  await x.flush();
  box.role = 'off';

  box.baseOptions = null;
  box.travel('east');
  assert.equal(box.baseOptions, null, 'manual portal entry receives no guide Normal token');
  assert.equal(picks, 1, 'manual next-story entry keeps the existing difficulty picker');
  assert.equal(box.baseCalls, 2, 'manual entry does not skip the existing picker');

  box.role = 'guest';
  box.dispatchPortal({kind: 'portal', direction: 'east'});
  assert.equal(guestToasts, 1);
  assert.equal(picks, 1, 'guest entry is denied before picker/Normal override');
  assert.equal(box.baseCalls, 2, 'guest cannot bypass canonical host admission');
});

test('native tick proximity dispatch arms Normal only for live guide travel and cancels rejected travel', async () => {
  assert.match(nativePortalLoop, /distance\(player,exitPoint\(d\)\)<\.85&&!window\.__STORYWORLD_DANCES_R74__\?\.moving\(player\)/,
    'the existing native distance and movement guards remain intact');
  assert.match(nativePortalLoop, /guide===true\?guideR77\?\.armNextNormal\(\{kind:'portal',direction:d,source:'native-proximity'\},zone,layer\):false/,
    'the exact native travel dispatch arms only while guide is on');
  assert.match(nativePortalLoop, /resultR77=travel\(d\)/, 'native dispatch still calls canonical travel');

  const run = async ({guide = true, role = 'off', cheat = false, routeRole = 'next', outcome = 'success'} = {}) => {
    const x = game();
    const box = x.box;
    box.guide = guide;
    box.role = role;
    box.cheat = cheat;
    box.player.x = .2;
    box.player.y = 0;
    box.__STORYWORLD_ROUTES_R72__.status = direction => ({
      open: true, role: routeRole, destination: 'next', direction
    });
    box.nativeTravelResult = outcome;
    vm.runInContext(`
      window.nativeTrips=[];window.nativeTier=null;
      function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
      function exitPoint(){return{x:1,y:0};}
      window.__STORYWORLD_DANCES_R74__={moving:()=>false};
      function travel(d){
        window.nativeTrips.push(d);
        if(window.nativeTravelResult==='reject')return Promise.reject(Error('route rejected before admission'));
        if(window.nativeTravelResult==='false')return Promise.resolve(false);
        window.nativeTier=window.__STORYWORLD_GUIDE_R77__?.takeNextNormal('next','STORY','current')||null;
        return Promise.resolve(true);
      }
    `, box);
    assert.ok(Math.hypot(box.player.x - 1, box.player.y) > .75 &&
      Math.hypot(box.player.x - 1, box.player.y) < .85,
    'fixture is inside native .85 proximity but outside R75 guide .75 goal reach');
    vm.runInContext(nativePortalLoop, box);
    await x.flush();
    return {x, box, state: box.__STORYWORLD_GUIDE_R77__.inspect()};
  };

  const guided = await run();
  assert.deepEqual(Array.from(guided.box.nativeTrips), ['east']);
  assert.equal(guided.box.nativeTier, 'normal', 'the native proximity path reaches canonical admission with Normal');
  assert.ok(guided.state.events.some(event => event.kind === 'normal-intent-armed'));
  assert.ok(guided.state.events.some(event => event.kind === 'normal-intent-armed' && event.dispatch === 'native-proximity'),
    'the intent audit identifies the native proximity dispatch');
  assert.ok(guided.state.events.some(event => event.kind === 'normal-intent-consumed'));
  assert.equal(guided.state.intent, null);

  for (const row of [
    {name: 'guide OFF/manual travel', options: {guide: false}},
    {name: 'guest', options: {role: 'guest', outcome: 'false'}},
    {name: '777', options: {cheat: true, outcome: 'false'}},
    {name: 'previous portal', options: {routeRole: 'previous', outcome: 'false'}},
  ]) {
    const result = await run(row.options);
    assert.deepEqual(Array.from(result.box.nativeTrips), ['east'], row.name);
    assert.equal(result.box.nativeTier, null, row.name);
    assert.equal(result.state.intent, null, row.name);
    assert.equal(result.state.events.some(event => event.kind === 'normal-intent-armed'), false, row.name);
  }

  for (const outcome of ['false', 'reject']) {
    const result = await run({outcome});
    assert.ok(result.state.events.some(event => event.kind === 'normal-intent-armed'), outcome);
    assert.equal(result.state.intent, null, `failed ${outcome} travel cancels its unconsumed intent`);
  }
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
