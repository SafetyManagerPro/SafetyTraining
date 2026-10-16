/* SafetyTraining — Supabase course bundle -> presentation course adapter.
   Converts database-backed Learning Units into the same Course/Topic model used by app.js.
   Delivery/practical constraints remain metadata and are never represented as completed practical training. */
(() => {
  'use strict';

  const cache = new Map();
  const data = () => window.SAFETY_DATA || (window.SAFETY_DATA = []);
  const localCourse = key => data().find(c => c.id === key);
  const cloud = () => window.SAFETY_CLOUD;
  const client = () => cloud()?.state?.client;

  const asArray = value => Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]);
  const textArray = value => asArray(value).flatMap(v => {
    if (typeof v === 'string' || typeof v === 'number') return [String(v)];
    if (v && typeof v === 'object') {
      return Object.values(v).flatMap(x => Array.isArray(x) ? x : (typeof x === 'string' ? [x] : [])).map(String);
    }
    return [];
  }).map(s => s.trim()).filter(Boolean);
  const firstText = (...values) => {
    for (const v of values) {
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return '';
  };
  const numberOr = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  const FAMILY_ICONS = [
    [/antincendio/i, '🔥'], [/primo.?soccorso/i, '🩹'], [/rls/i, '🤝'], [/rspp|aspp/i, '🧭'],
    [/attrezzature/i, '🏗️'], [/ponteggi|quota|funi/i, '🪢'], [/cantieri|csp|cse/i, '🏗️'],
    [/stradal|traffico/i, '🚧'], [/spazi.?confinati/i, '⚠️'], [/lavorator/i, '👷'],
    [/preposto/i, '👀'], [/dirigente/i, '🧑‍💼'], [/datore/i, '🏢']
  ];
  function iconFor(course) {
    const hay = `${course?.family || ''} ${course?.title || ''}`;
    return (FAMILY_ICONS.find(([rx]) => rx.test(hay)) || [null, '📘'])[1];
  }

  function normalizeQuiz(raw, content, procedure, prevention) {
    if (!raw || typeof raw !== 'object') return null;
    const answers = textArray(raw.answers || raw.options);
    const correct = Number.isInteger(raw.correct) ? raw.correct : Number(raw.correct_index);
    const q = firstText(raw.q, raw.question);
    if (!q || answers.length < 2 || !Number.isFinite(correct) || correct < 0 || correct >= answers.length) return null;
    return {
      q,
      answers,
      correct,
      explanation: firstText(raw.explanation, content.detail, content.summary),
      case_solution: textArray(raw.case_solution).length ? textArray(raw.case_solution) : procedure.slice(0, 4),
      general_solution: textArray(raw.general_solution).length ? textArray(raw.general_solution) : prevention.slice(0, 4)
    };
  }

  function normalizeOperational(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {
      objective: firstText(raw.objective),
      before: textArray(raw.before),
      during: textArray(raw.during),
      after: textArray(raw.after),
      step_by_step: textArray(raw.step_by_step),
      if_problem: textArray(raw.if_problem),
      stop_conditions: textArray(raw.stop_conditions),
      who_to_involve: textArray(raw.who_to_involve),
      remember: firstText(raw.remember),
      adaptation: firstText(raw.adaptation)
    };
    return out.before.length || out.during.length || out.step_by_step.length ? out : null;
  }

  function normalizeGuided(content, summary, procedure) {
    if (content.guided && typeof content.guided === 'object' && !Array.isArray(content.guided)) {
      return {
        observe: textArray(content.guided.observe),
        importance: textArray(content.guided.importance),
        apply: textArray(content.guided.apply)
      };
    }
    const focus = textArray(content.focus).slice(0, 3);
    if (!focus.length && !procedure.length) return null;
    return {
      observe: focus.length ? focus : procedure.slice(0, 3),
      importance: summary ? [summary] : [],
      apply: procedure.slice(0, 3)
    };
  }

  function normalizeImages(content) {
    const fromIdeas = asArray(content.idea_images).map(x => {
      if (typeof x === 'string') return { file: x, caption: '' };
      if (x && typeof x === 'object' && x.file) return { file: String(x.file), caption: firstText(x.caption) };
      return null;
    }).filter(Boolean);
    if (fromIdeas.length) return fromIdeas.slice(0, 3);
    return asArray(content.visuals).map(x => {
      if (typeof x === 'string') return { file: x, caption: '' };
      if (x && typeof x === 'object') {
        const file = firstText(x.file, x.image, x.src);
        return file ? { file, caption: firstText(x.caption, x.title) } : null;
      }
      return null;
    }).filter(Boolean).slice(0, 3);
  }

  function normalizeResources(content) {
    return asArray(content.evidence_sources).map(src => {
      if (!src || typeof src !== 'object') return null;
      const url = firstText(src.url);
      if (!url) return null;
      return {
        kind: firstText(src.authority, src.source, 'Fonte'),
        title: firstText(src.title, src.authority, 'Approfondimento'),
        url,
        note: firstText(src.use, src.note, content.source_integration_note)
      };
    }).filter(Boolean);
  }

  function normalizeSourceDigest(content, images) {
    const note = firstText(content.source_integration_note);
    const focus = textArray(content.focus).slice(0, 3);
    return asArray(content.evidence_sources).slice(0, 1).map(src => {
      if (!src || typeof src !== 'object') return null;
      return {
        source: firstText(src.authority, 'Fonte'),
        title: firstText(src.title, 'Approfondimento'),
        url: firstText(src.url),
        summary: note || firstText(content.summary, content.detail),
        keypoints: focus,
        image: images[0]?.file || '',
        image_caption: images[0]?.caption || ''
      };
    }).filter(Boolean);
  }

  function normalizeTopic(unit, index) {
    const content = unit?.content && typeof unit.content === 'object' ? unit.content : {};
    const title = firstText(content.title, unit?.title, `Unità ${index + 1}`);
    const summary = firstText(content.summary, unit?.summary, title);
    const detail = firstText(content.detail, content.teacher_expansion, summary);
    const procedure = textArray(content.procedure || content.steps || content.step_by_step);
    const prevention = textArray(content.prevention || content.preventive_measures || content.controls || content.barriers);
    const risks = textArray(content.risks || content.hazards || content.risk_factors);
    const commonErrors = textArray(content.common_errors || content.errors || content.bad);
    const teacherExpansion = textArray(content.teacher_expansion || content.teacher_notes || content.teacher);
    const teachingSteps = textArray(content.teaching_steps || content.guided_activity);
    const images = normalizeImages(content);
    const quiz = normalizeQuiz(content.quiz, content, procedure, prevention);
    const guided = normalizeGuided(content, summary, procedure);
    const operational = normalizeOperational(content.operational);
    const resources = normalizeResources(content);
    const sourceDigest = normalizeSourceDigest(content, images);
    const good = textArray(content.good).length ? textArray(content.good) : procedure.slice(0, 3);
    const bad = textArray(content.bad).length ? textArray(content.bad) : commonErrors.slice(0, 3);
    const caseText = firstText(content.case, content.example_story,
      `Applica “${title}” a una situazione reale del tuo lavoro: individua il pericolo, la misura prevista e la condizione che richiede di fermarsi o chiedere supporto.`);
    const question = firstText(content.question, content.discussion_question, content.quiz?.question, content.quiz?.q,
      'Qual è la decisione più sicura e quali controlli faresti prima di procedere?');
    const feedback = content.discussion_feedback && typeof content.discussion_feedback === 'object' ? content.discussion_feedback : {};

    return {
      id: firstText(unit?.stable_key, `db-unit-${index + 1}`),
      title,
      slide_title: firstText(content.slide_title, title),
      minutes: Math.max(1, numberOr(content.minutes, numberOr(unit?.default_minutes, 30))),
      icon: firstText(content.icon, '📘'),
      summary,
      detail,
      risks,
      prevention,
      dpi: textArray(content.dpi || content.ppe),
      procedure,
      good,
      bad,
      case: caseText,
      question,
      quiz,
      teacher: firstText(content.teacher, teacherExpansion[0]),
      norm: firstText(content.norm, content.regulatory_basis),
      visual: firstText(content.visual, 'general'),
      guided,
      deepdetail: textArray(content.deepdetail),
      idea_images: images,
      graphic_cards: asArray(content.graphic_cards).filter(x => x && typeof x === 'object'),
      teacher_expansion: teacherExpansion,
      common_errors: commonErrors,
      example_story: firstText(content.example_story),
      teaching_steps: teachingSteps,
      operational,
      discussion_feedback: {
        answer: textArray(feedback.answer).length ? textArray(feedback.answer) : good.slice(0, 3),
        explanation: firstText(feedback.explanation, detail),
        case_solution: textArray(feedback.case_solution).length ? textArray(feedback.case_solution) : procedure.slice(0, 4),
        general_solution: textArray(feedback.general_solution).length ? textArray(feedback.general_solution) : (prevention.length ? prevention : procedure).slice(0, 4)
      },
      resources,
      source_digest: sourceDigest,
      quality: content.quality && typeof content.quality === 'object' ? content.quality : (unit?.metadata || {}),
      didactic_version: firstText(content.didactic_version, unit?.metadata?.didactic_version, unit?.source_group),
      delivery_note: firstText(content.delivery_note),
      source_group: firstText(unit?.source_group),
      db_backed: true
    };
  }

  function adaptBundle(bundle) {
    const c = bundle?.course || {};
    const rawModules = Array.isArray(bundle?.modules) ? bundle.modules : [];
    let cursor = 0;
    const topics = [];
    const modules = rawModules.map((m, mi) => {
      const units = Array.isArray(m?.units) ? [...m.units].sort((a, b) => numberOr(a.position) - numberOr(b.position)) : [];
      const moduleTopics = units.map((u, ui) => normalizeTopic(u, topics.length + ui));
      topics.push(...moduleTopics);
      const minutes = moduleTopics.reduce((sum, t) => sum + numberOr(t.minutes), 0) || numberOr(m?.nominal_minutes);
      const start = cursor;
      cursor += minutes;
      return {
        id: firstText(m?.module_key, `db-module-${mi + 1}`),
        title: firstText(m?.title, `Modulo ${mi + 1}`),
        topic_ids: moduleTopics.map(t => t.id),
        minutes,
        nominal_minutes: numberOr(m?.nominal_minutes, minutes),
        start_minute: start,
        end_minute: cursor,
        db_backed: true
      };
    });

    const firstDeliveryNote = topics.map(t => t.delivery_note).find(Boolean) || '';
    const version = bundle?.version || {};
    const course = {
      id: firstText(c.stable_key),
      title: firstText(c.title, c.stable_key, 'Corso'),
      duration: `${Math.round(cursor / 60 * 10) / 10} h`,
      icon: iconFor(c),
      subtitle: firstText(c.description, `${c.family || 'Percorso'} · ${cursor} min`),
      disclaimer: [
        version?.status === 'draft' ? 'Versione didattica in bozza: usare previa revisione del docente/amministratore.' : '',
        firstDeliveryNote
      ].filter(Boolean).join(' '),
      family: firstText(c.family, 'Altro'),
      planned_minutes: cursor,
      target_minutes: numberOr(c.nominal_minutes, cursor),
      nominal_minutes: numberOr(c.nominal_minutes, cursor),
      modules,
      topics,
      resources: topics.flatMap(t => t.resources || []).filter((r, i, a) => r.url && a.findIndex(x => x.url === r.url) === i),
      didactic_version: firstText(c.metadata?.didactic_version, version?.syllabus_snapshot?.didactic_version, 'db-adapted'),
      material_complete: c.metadata?.material_complete !== false && topics.length > 0,
      presentation_ready: topics.length > 0,
      presentation_generated_from_db: true,
      db_version: version?.version_number || null,
      db_status: version?.status || null
    };
    return course;
  }

  async function ensureCourse(key, suppliedClient) {
    const existing = localCourse(key);
    if (existing) return existing;
    if (!key) return null;
    if (cache.has(key)) return cache.get(key);
    const p = (async () => {
      const db = suppliedClient || client();
      if (!db) throw new Error('Database SafetyTraining non disponibile.');
      const { data: bundle, error } = await db.rpc('training_course_bundle', { p_stable_key: key });
      if (error) throw error;
      if (!bundle?.course) throw new Error('Bundle corso non disponibile.');
      const adapted = adaptBundle(bundle);
      if (!adapted.id || !adapted.topics.length) throw new Error('Il corso non contiene Learning Unit presentabili.');
      const race = localCourse(key);
      if (race) return race;
      data().push(adapted);
      window.dispatchEvent(new CustomEvent('safety:course-adapted', { detail: { key, course: adapted } }));
      return adapted;
    })().catch(err => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, p);
    return p;
  }

  window.SAFETY_DB_SLIDES = { adaptBundle, ensureCourse, localCourse };
})();
