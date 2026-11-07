/* SafetyTraining v48 — minimum reading time per slide (pure helpers, no DOM, no network).
   The gate itself lives in app.js and applies only to registered learners with an active session.
   This client-side gate is not a server-side guarantee: see the PR notes for the verification plan. */
(() => {
  'use strict';

  const BASE_SECONDS = 3;
  const WORDS_PER_MINUTE = 200;
  const MAX_SECONDS = 180;
  // Keys whose text is not read on the slide: structure, media, hidden answers and references.
  const SKIP_KEY = /^(module|topic|visuals?|type|start|end|displayEnd|minutes|partIndex|partTotal|moduleIndex)$|src|image|img|uid|^id$|_id$|answer|reveal|solution/i;

  function readingWords(value, key = '') {
    if (SKIP_KEY.test(key)) return 0;
    if (typeof value === 'string') {
      const text = value.replace(/<[^>]*>/g, ' ').trim();
      if (!text || /^(assets\/|https?:\/\/|data:)/i.test(text)) return 0;
      return text.split(/\s+/).length;
    }
    if (Array.isArray(value)) return value.reduce((sum, item) => sum + readingWords(item, key), 0);
    if (value && typeof value === 'object') {
      return Object.keys(value).reduce((sum, k) => sum + readingWords(value[k], k), 0);
    }
    return 0;
  }

  function requiredSeconds(slide) {
    const words = readingWords(slide);
    const seconds = BASE_SECONDS + Math.ceil((words * 60) / WORDS_PER_MINUTE);
    return Math.min(MAX_SECONDS, seconds);
  }

  window.SAFETY_SLIDE_DWELL_V48 = { requiredSeconds, readingWords, BASE_SECONDS, MAX_SECONDS, WORDS_PER_MINUTE };
})();
