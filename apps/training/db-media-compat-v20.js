/* SafetyTraining DB Media Compat v20 — preserves authored video_plan/resources in DB-backed courses. */
(() => {
  'use strict';

  const api = window.SAFETY_DB_SLIDES;
  if (!api || typeof api.ensureCourse !== 'function' || typeof api.adaptBundle !== 'function') return;

  const originalEnsureCourse = api.ensureCourse.bind(api);
  const originalAdaptBundle = api.adaptBundle.bind(api);

  const safeUrl = (value) => {
    try {
      const u = new URL(String(value || '').trim(), location.href);
      return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : '';
    } catch (_) { return ''; }
  };
  const asArray = (value) => Array.isArray(value) ? value : [];
  const firstText = (...values) => values.find(v => typeof v === 'string' && v.trim())?.trim() || '';

  function normalizeVideoPlan(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const page = safeUrl(raw.url || raw.page);
    const media = safeUrl(raw.media_url || raw.mp4);
    if (!page && !media) return null;
    return {
      ...raw,
      url: page,
      media_url: media,
      title: firstText(raw.title, raw.film, 'Video di approfondimento'),
      provider: firstText(raw.provider, 'Fonte esterna'),
      before: asArray(raw.before).map(String).filter(Boolean),
      after: asArray(raw.after).map(String).filter(Boolean)
    };
  }

  function normalizeAuthoredResources(content) {
    return asArray(content?.resources).map(src => {
      if (!src || typeof src !== 'object') return null;
      const url = safeUrl(src.url);
      if (!url) return null;
      return {
        kind: firstText(src.kind, src.authority, src.source, 'Approfondimento'),
        title: firstText(src.title, src.authority, 'Approfondimento'),
        url,
        note: firstText(src.note, src.use)
      };
    }).filter(Boolean);
  }

  function mergeResources(...sets) {
    const out = [];
    const seen = new Set();
    sets.flat().filter(Boolean).forEach(item => {
      const url = safeUrl(item?.url);
      if (!url || seen.has(url)) return;
      seen.add(url);
      out.push({ ...item, url });
    });
    return out;
  }

  function enrichFromBundle(course, bundle) {
    if (!course || !bundle?.modules) return course;
    const rawByStableKey = new Map();
    bundle.modules.forEach(module => {
      asArray(module?.units).forEach(unit => {
        if (unit?.stable_key) rawByStableKey.set(unit.stable_key, unit);
      });
    });

    asArray(course.topics).forEach(topic => {
      const unit = rawByStableKey.get(topic?.source_stable_key);
      const content = unit?.content && typeof unit.content === 'object' ? unit.content : {};
      const video = normalizeVideoPlan(content.video_plan || content.video_moment || content.media);
      if (video) topic.video_plan = video;
      topic.resources = mergeResources(topic.resources || [], normalizeAuthoredResources(content));
    });

    course.resources = mergeResources(...asArray(course.topics).map(topic => topic.resources || []));
    course.authored_media_bridge = true;
    return course;
  }

  api.adaptBundle = (bundle) => enrichFromBundle(originalAdaptBundle(bundle), bundle);

  api.ensureCourse = async (key, suppliedClient) => {
    const course = await originalEnsureCourse(key, suppliedClient);
    if (!course || course.authored_media_bridge || !course.presentation_generated_from_db) return course;
    const db = suppliedClient || window.SAFETY_CLOUD?.state?.client;
    if (!db) return course;
    try {
      const { data: bundle, error } = await db.rpc('training_course_bundle', { p_stable_key: key });
      if (error) throw error;
      return enrichFromBundle(course, bundle);
    } catch (error) {
      console.warn('[SafetyTraining Media Compat] authored media enrichment:', error?.message || error);
      return course;
    }
  };

  // Safety net for any caller that still reaches the original adapter before this wrapper.
  window.addEventListener('safety:course-adapted', (event) => {
    const key = event?.detail?.key;
    if (!key) return;
    queueMicrotask(() => api.ensureCourse(key).catch(() => {}));
  });
})();