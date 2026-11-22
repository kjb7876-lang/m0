const round = value => Math.round(value * 100) / 100;

const rules = [
  ['image-decoding', /(?:decode|image.?decode|imagedecoder|createimagebitmap)/i],
  ['pathfinding', /(?:findpath|pathfind|pathsearch|astar|navquery|routeSearch)/i],
  ['collision', /(?:blocked|clearline|clearpath|collision|intersect|overlap|segmentdistance)/i],
  ['enemy-ai', /(?:tickenemies|enemyai|aiupdate|updateai|moveenemy|enemymove)/i],
  ['effects', /(?:draweffect|drawhazard|drawprojectile|samongstorm|threadslash|effect)/i],
  ['rendering', /(?:webglrenderer|threerenderer|drawassetframe|drawimage|draw|render|canvas|sprite|texture)/i],
  ['game-update', /^(?:tick|frame|update|step)$/i],
];

export const PROFILE_CATEGORIES = Object.freeze([
  'image-decoding',
  'pathfinding',
  'collision',
  'enemy-ai',
  'effects',
  'rendering',
  'game-update',
  'other',
]);

export function classifyProfileFrame(frame) {
  const functionName = frame?.functionName || '';
  if (/^(?:tick|frame|update|step)$/i.test(functionName)) return 'game-update';
  const value = [functionName, frame?.url].filter(Boolean).join(' ');
  return rules.find(([, pattern]) => pattern.test(value))?.[0] || null;
}

export function distribution(values) {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  const quantile = p => sorted.length
    ? round(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))])
    : null;
  return {
    count: sorted.length,
    minMs: sorted.length ? round(sorted[0]) : null,
    p50Ms: quantile(.50),
    p95Ms: quantile(.95),
    p99Ms: quantile(.99),
    maxMs: sorted.length ? round(sorted.at(-1)) : null,
    meanMs: sorted.length ? round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length) : null,
  };
}

export function estimateProfilerOverhead(controlBeforeP95Ms, profiledP95Ms, controlAfterP95Ms) {
  const controls = [controlBeforeP95Ms, controlAfterP95Ms].filter(Number.isFinite).sort((a, b) => a - b);
  if (!controls.length || !Number.isFinite(profiledP95Ms)) {
    return {controlMedianP95Ms: null, profiledP95Ms: null, estimatedAddedP95Ms: null, estimatedAddedPercent: null};
  }
  const controlMedianP95Ms = round(controls.length === 2
    ? (controls[0] + controls[1]) / 2
    : controls[0]);
  const estimatedAddedP95Ms = round(profiledP95Ms - controlMedianP95Ms);
  return {
    controlMedianP95Ms,
    profiledP95Ms: round(profiledP95Ms),
    estimatedAddedP95Ms,
    estimatedAddedPercent: controlMedianP95Ms > 0
      ? round(estimatedAddedP95Ms * 100 / controlMedianP95Ms)
      : null,
  };
}

export function summarizeCpuProfile(profile, samplingIntervalUs = 1000) {
  const nodes = new Map((profile?.nodes || []).map(node => [node.id, node]));
  const parentById = new Map();
  for (const node of nodes.values()) {
    for (const child of node.children || []) parentById.set(child, node.id);
  }

  const categories = Object.fromEntries(PROFILE_CATEGORIES.map(name => [name, {sampledMs: 0, samples: 0}]));
  const functions = new Map();
  let totalSampledMs = 0;
  const samples = profile?.samples || [];
  const deltas = profile?.timeDeltas || [];
  for (let index = 0; index < samples.length; index++) {
    const sampledId = samples[index];
    const rawDelta = deltas[index];
    const deltaMs = (Number.isFinite(rawDelta) && rawDelta > 0 ? rawDelta : samplingIntervalUs) / 1000;
    totalSampledMs += deltaMs;

    const stack = [];
    const seen = new Set();
    let id = sampledId;
    while (id !== undefined && !seen.has(id) && stack.length < 256) {
      seen.add(id);
      const node = nodes.get(id);
      if (!node) break;
      const frame = node.callFrame || {};
      const name = frame.functionName || '(anonymous)';
      const url = frame.url || '';
      const line = Number.isFinite(frame.lineNumber) ? frame.lineNumber + 1 : null;
      const key = name + '|' + url + ':' + (line ?? '');
      let row = functions.get(key);
      if (!row) {
        row = {functionName: name, url, line, selfMs: 0, inclusiveMs: 0, selfSamples: 0};
        functions.set(key, row);
      }
      row.inclusiveMs += deltaMs;
      stack.push({frame, row, id});
      id = parentById.get(id);
    }

    if (stack.length) {
      stack[0].row.selfMs += deltaMs;
      stack[0].row.selfSamples++;
    }
    const category = stack.map(item => classifyProfileFrame(item.frame)).find(Boolean) || 'other';
    categories[category].sampledMs += deltaMs;
    categories[category].samples++;
  }

  const categoryRows = Object.entries(categories).map(([name, value]) => ({
    name,
    sampledMs: round(value.sampledMs),
    sharePercent: totalSampledMs ? round(value.sampledMs * 100 / totalSampledMs) : null,
    samples: value.samples,
  }));
  const topFunctions = [...functions.values()]
    .map(row => ({
      ...row,
      selfMs: round(row.selfMs),
      inclusiveMs: round(row.inclusiveMs),
    }))
    .sort((a, b) => b.selfMs - a.selfMs)
    .slice(0, 30);
  return {
    sampleCount: samples.length,
    sampledMainThreadMs: round(totalSampledMs),
    samplingIntervalUs,
    categories: categoryRows,
    topFunctions,
  };
}

export function summarizeDecodeWaits(rows) {
  const result = {};
  for (const method of ['HTMLImageElement.decode', 'createImageBitmap']) {
    const selected = rows.filter(row => row.method === method);
    result[method] = {
      count: selected.length,
      failures: selected.filter(row => row.ok === false).length,
      aggregatePromiseWaitMs: round(selected.reduce((sum, row) => sum + (Number.isFinite(row.durationMs) ? row.durationMs : 0), 0)),
      p50WaitMs: distribution(selected.map(row => row.durationMs)).p50Ms,
      p95WaitMs: distribution(selected.map(row => row.durationMs)).p95Ms,
      maxWaitMs: distribution(selected.map(row => row.durationMs)).maxMs,
    };
  }
  return {
    byPhase: Object.fromEntries([...new Set(rows.map(row => row.phase || 'unknown'))].map(phase => [
      phase,
      Object.fromEntries(['HTMLImageElement.decode', 'createImageBitmap'].map(method => {
        const selected = rows.filter(row => (row.phase || 'unknown') === phase && row.method === method);
        const stats = distribution(selected.map(row => row.durationMs));
        return [method, {count: selected.length, failures: selected.filter(row => row.ok === false).length, waitMs: stats}];
      })),
    ])),
    allPhases: result,
    note: 'Promise wait time includes scheduling and may overlap across parallel decodes; it is latency, not summed CPU time.',
  };
}
