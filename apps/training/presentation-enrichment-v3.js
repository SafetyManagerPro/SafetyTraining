/* SafetyTraining — presentation enrichment v3.
   Adds didactic presentation scaffolding to DB-backed courses without changing Supabase data.
   Auto-generated checks are formative only and never replace formal verification/Test Builder. */
(() => {
  'use strict';
  const adapter = window.SAFETY_DB_SLIDES;
  if (!adapter?.ensureCourse) return;

  const originalEnsureCourse = adapter.ensureCourse.bind(adapter);
  const arr = v => Array.isArray(v) ? v : [];
  const text = v => typeof v === 'string' ? v.trim() : '';
  const unique = items => {
    const seen = new Set();
    return (items || []).filter(Boolean).filter(item => {
      const key = String(item).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const first = (...values) => values.map(text).find(Boolean) || '';

  function deterministicIndex(seed, n) {
    let h = 0;
    for (const ch of String(seed || '')) h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
    return Math.abs(h) % Math.max(1, n);
  }

  function teacherCues(topic) {
    if (arr(topic.teacher_expansion).length) return { items: topic.teacher_expansion, generated: false };
    const actions = unique([...(topic.procedure || []), ...(topic.prevention || []), ...(topic.good || [])]);
    const items = [
      first(topic.detail, topic.summary),
      topic.summary ? `Apri chiedendo all’aula dove questo principio compare nel lavoro reale: “${topic.summary}”` : '',
      actions.length ? `Fai trasformare il principio in una decisione operativa: ${actions.slice(0, 2).join(' · ')}` : '',
      'Collega sempre la spiegazione a DVR, procedure, ruoli e condizioni reali dell’organizzazione; chiarisci ciò che richiede escalation o decisione organizzativa.',
      'Chiudi chiedendo al gruppo quale segnale, cambiamento o anomalia dovrebbe far fermare, verificare o chiedere supporto.'
    ].filter(Boolean);
    return { items, generated: true };
  }

  function graphicCards(topic) {
    if (arr(topic.graphic_cards).length) return { items: topic.graphic_cards, generated: false };
    const images = arr(topic.idea_images);
    const riskPoints = unique([...(topic.risks || []), ...(topic.prevention || [])]).slice(0, 4);
    const actionPoints = unique([...(topic.procedure || []), ...(topic.prevention || []), ...(topic.good || [])]).slice(0, 4);
    const cards = [];
    if (images[0]) {
      cards.push({
        image: images[0].file,
        caption: images[0].caption || 'Schema visuale tematico.',
        kicker: 'MAPPA VISUALE',
        title: 'Dal principio al rischio',
        text: first(topic.summary, topic.detail),
        points: riskPoints,
        auto_generated: true
      });
    }
    if (images[1] && actionPoints.length) {
      cards.push({
        image: images[1].file,
        caption: images[1].caption || 'Schema operativo di rinforzo.',
        kicker: 'DALLA REGOLA ALL’AZIONE',
        title: 'Come si traduce in decisione',
        text: 'Usa lo schema per passare dal concetto alla scelta operativa e alla verifica.',
        points: actionPoints,
        auto_generated: true
      });
    }
    return { items: cards, generated: cards.length > 0 };
  }

  function formativeQuiz(topic) {
    if (topic.quiz) return { quiz: topic.quiz, generated: false };
    const candidates = unique([...(topic.procedure || []), ...(topic.prevention || []), ...(topic.good || [])]);
    const correctText = candidates[0];
    if (!correctText) return { quiz: null, generated: false };

    const distractors = [
      'Proseguire senza ulteriori verifiche perché la situazione è già conosciuta.',
      'Sostituire la procedura prevista con una soluzione improvvisata più rapida.',
      'Rimandare la segnalazione di anomalie o dubbi alla fine dell’attività.'
    ];
    const correct = deterministicIndex(topic.id || topic.title, 4);
    const answers = distractors.slice();
    answers.splice(correct, 0, correctText);
    return {
      generated: true,
      quiz: {
        q: 'Check formativo: quale comportamento è più coerente con quanto appena trattato?',
        answers,
        correct,
        explanation: first(topic.detail, topic.summary),
        case_solution: candidates.slice(0, 4),
        general_solution: unique([...(topic.prevention || []), ...(topic.procedure || [])]).slice(0, 4),
        formative_only: true,
        auto_generated: true
      }
    };
  }

  function enrichQuality(topic, modes) {
    const old = topic.presentation_quality || {};
    const authoredScore = Number.isFinite(Number(old.score)) ? Number(old.score) : 0;
    let effective = authoredScore;
    if (modes.graphic === 'auto') effective += 5;
    if (modes.teacher === 'auto') effective += 5;
    if (modes.quiz === 'auto-formative') effective += 6;
    effective = Math.min(100, effective);
    topic.presentation_quality = {
      ...old,
      authored_score: old.authored_score ?? authoredScore,
      score: effective,
      level: effective >= 85 ? 'rich' : (effective >= 65 ? 'ready' : 'base'),
      graphic_mode: modes.graphic,
      teacher_mode: modes.teacher,
      quiz_mode: modes.quiz,
      enrichment_version: 'presentation-enrichment-v3'
    };
  }

  function enrichTopic(topic) {
    if (!topic || topic.__presentationEnrichedV3) return topic;

    const teacher = teacherCues(topic);
    if (teacher.generated) topic.teacher_expansion = teacher.items;

    const graphics = graphicCards(topic);
    if (graphics.generated) topic.graphic_cards = graphics.items;

    const check = formativeQuiz(topic);
    if (check.generated) topic.quiz = check.quiz;

    enrichQuality(topic, {
      graphic: graphics.generated ? 'auto' : (arr(topic.graphic_cards).length ? 'authored' : 'none'),
      teacher: teacher.generated ? 'auto' : (arr(topic.teacher_expansion).length ? 'authored' : 'none'),
      quiz: check.generated ? 'auto-formative' : (topic.quiz ? 'authored' : 'none')
    });

    topic.__presentationEnrichedV3 = true;
    return topic;
  }

  function courseQuality(course) {
    const topics = arr(course?.topics);
    const values = topics.map(t => Number(t.presentation_quality?.score || 0));
    const score = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    const counts = {
      graphic_auto: topics.filter(t => t.presentation_quality?.graphic_mode === 'auto').length,
      teacher_auto: topics.filter(t => t.presentation_quality?.teacher_mode === 'auto').length,
      quiz_auto: topics.filter(t => t.presentation_quality?.quiz_mode === 'auto-formative').length,
      quiz_authored: topics.filter(t => t.presentation_quality?.quiz_mode === 'authored').length
    };
    return {
      ...(course.presentation_quality || {}),
      score,
      level: score >= 85 ? 'rich' : (score >= 65 ? 'ready' : 'base'),
      effective_score: score,
      enrichment_version: 'presentation-enrichment-v3',
      counts
    };
  }

  function enrichCourse(course) {
    if (!course || !course.presentation_generated_from_db) return course;
    arr(course.topics).forEach(enrichTopic);
    course.presentation_quality = courseQuality(course);
    course.presentation_enrichment = 'v3';
    return course;
  }

  adapter.ensureCourse = async (...args) => enrichCourse(await originalEnsureCourse(...args));
  window.addEventListener('safety:course-adapted', event => enrichCourse(event.detail?.course));
  window.SAFETY_PRESENTATION_ENRICHMENT = { enrichCourse, enrichTopic, version: 'v3' };
})();
