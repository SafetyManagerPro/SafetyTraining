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
  const uniqueBy = (arr, keyFn) => {
    const seen = new Set();
    return arr.filter(x => {
      const key = keyFn(x);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

  const VISUAL_RULES = [
    { rx:/incend|fuoco|estintor|evacua|combust|fiamma/i, files:['idea-fire-response.svg','idea-fire-triangle.svg','idea-fire-passive.svg'] },
    { rx:/primo.?soccorso|dae|rianim|emergenza sanitaria|infortun/i, files:['idea-emergency-steps.svg','emergency.svg','procedura-operativa-5-fasi.svg'] },
    { rx:/pontegg|quota|funi|cadut|anticaduta|imbracatur|ancoragg/i, files:['idea-working-height-safe.svg','idea-dpi-hierarchy.svg','idea-ladder-safe.svg'] },
    { rx:/carrell|gru|trattor|escav|terna|pala|ple|carroponte|pompa|attrezzatur|macchin/i, files:['idea-inspection-flow.svg','procedura-operativa-5-fasi.svg','piramide-pericoli.svg'] },
    { rx:/traffico|stradal|viabilit|investiment|retromarcia|segnaletica/i, files:['idea-road-safety.svg','road.svg','idea-police-road.svg'] },
    { rx:/chimic|sostanz|sds|etichett|agente pericoloso/i, files:['video-chemicals.svg','idea-risk-cycle.svg','piramide-pericoli.svg'] },
    { rx:/biologic|contamin|igiene|rifiut|puntura|tagliente/i, files:['idea-bio-chain.svg','bio.svg','idea-hygiene-clean-dirty.svg'] },
    { rx:/rumore|vibraz|acustic/i, files:['video-stop-noise.svg','idea-risk-cycle.svg','piramide-pericoli.svg'] },
    { rx:/vdt|ergonom|postazione|movimentazione manuale|mmc/i, files:['idea-vdt-ergonomia.svg','office.svg','video-safe-moves.svg'] },
    { rx:/stress|aggress|violenza|molest|conflitt|psicosocial/i, files:['idea-aggression-flow.svg','conflict.svg','video-violence.svg'] },
    { rx:/rls|consultaz|partecipaz|rappresentant/i, files:['idea-rls-cycle.svg','idea-rls-consult.svg','organigramma-sicurezza.svg'] },
    { rx:/rspp|aspp|datore|dirigent|prepost|organizz|responsabil|deleg/i, files:['organigramma-sicurezza.svg','idea-safety-system.svg','idea-inspection-flow.svg'] },
    { rx:/dvr|valutazione dei rischi|pericolo|rischio|prevenzion/i, files:['idea-risk-cycle.svg','modello-farfalla-rischio.svg','piramide-pericoli.svg'] },
    { rx:/emergenz|allarme|esodo|soccor/i, files:['idea-emergency-steps.svg','stop-segnala-ripristina.svg','procedura-operativa-5-fasi.svg'] },
    { rx:/ecologic|verde|giardin|motosega|calore|microclima/i, files:['idea-green-safearea.svg','green.svg','idea-chainsaw-safe.svg'] },
    { rx:/cantiere|scavo|coordinat|psc|pos|duvri|interfer/i, files:['idea-duvri.svg','idea-inspection-flow.svg','piramide-pericoli.svg'] }
  ];
  function inferredImages(haystack) {
    const rule = VISUAL_RULES.find(r => r.rx.test(haystack || ''));
    const files = rule?.files || ['idea-risk-cycle.svg','procedura-operativa-5-fasi.svg','piramide-pericoli.svg'];
    return files.map((file, i) => ({
      file,
      caption: i === 0 ? 'Schema visuale tematico a supporto della spiegazione.' :
        (i === 1 ? 'Supporto grafico per collegare il principio alle azioni operative.' : 'Schema di rinforzo per discussione e verifica in aula.'),
      auto_generated: true
    }));
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

  function inferOperational(title, summary, procedure, prevention, commonErrors) {
    if (!procedure.length && !prevention.length) return null;
    const steps = (procedure.length ? procedure : prevention).slice(0, 6);
    const before = prevention.slice(0, 3);
    const during = procedure.slice(0, 4);
    return {
      objective: `Applicare “${title}” trasformando il contenuto in controlli, azioni e verifica.`,
      before: before.length ? before : steps.slice(0, 3),
      during: during.length ? during : steps.slice(0, 4),
      after: [
        'Verifica che la condizione prevista sia stata effettivamente ripristinata o completata.',
        'Segnala e traccia eventuali anomalie rimaste aperte secondo le procedure dell’organizzazione.'
      ],
      step_by_step: steps,
      if_problem: [
        'Non improvvisare una soluzione diversa da quella prevista quando cambia una condizione rilevante.',
        'Metti in sicurezza ciò che rientra nel tuo ruolo e attiva il referente previsto.',
        'Riprendi solo quando la condizione è stata verificata o autorizzata secondo procedura.'
      ],
      stop_conditions: commonErrors.slice(0, 3).map(x => `Fermati e rivaluta se compare questa criticità: ${x}`),
      who_to_involve: [],
      remember: firstText(summary, 'Controlla, agisci, verifica e segnala.'),
      adaptation: 'Adattare sempre a DVR, procedure, attrezzature e organizzazione reali.',
      auto_generated: true
    };
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

  function normalizeImages(content, contextText) {
    const fromIdeas = asArray(content.idea_images).map(x => {
      if (typeof x === 'string') return { file: x, caption: '' };
      if (x && typeof x === 'object' && x.file) return { file: String(x.file), caption: firstText(x.caption) };
      return null;
    }).filter(Boolean);
    if (fromIdeas.length) return fromIdeas.slice(0, 3);

    const explicitVisuals = asArray(content.visuals).map(x => {
      if (typeof x === 'string') return { file: x, caption: '' };
      if (x && typeof x === 'object') {
        const file = firstText(x.file, x.image, x.src);
        return file ? { file, caption: firstText(x.caption, x.title) } : null;
      }
      return null;
    }).filter(Boolean);
    if (explicitVisuals.length) return explicitVisuals.slice(0, 3);

    return inferredImages(contextText).slice(0, 3);
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

  function presentationQuality(topic, explicitImageCount, hasExplicitOperational) {
    let score = 0;
    if (topic.summary) score += 10;
    if (topic.detail) score += 10;
    if (topic.procedure.length) score += 12;
    if (topic.prevention.length) score += 10;
    if (topic.risks.length) score += 8;
    if (topic.case && topic.question) score += 12;
    if (topic.quiz) score += 10;
    if (topic.teacher_expansion.length || topic.teacher) score += 10;
    if (topic.idea_images.length) score += 8;
    if (topic.operational) score += 10;
    score = Math.min(100, score);
    return {
      score,
      level: score >= 85 ? 'rich' : (score >= 65 ? 'ready' : 'base'),
      explicit_visuals: explicitImageCount > 0,
      visual_mode: explicitImageCount > 0 ? 'authored' : 'auto-themed',
      operational_mode: hasExplicitOperational ? 'authored' : (topic.operational ? 'auto-structured' : 'none')
    };
  }

  function normalizeTopic(unit, index, context = {}) {
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
    const contextText = [
      context.courseTitle, context.family, context.moduleTitle, unit?.stable_key, title, summary,
      ...textArray(content.focus), ...risks, ...procedure
    ].join(' ');
    const explicitImageCount = asArray(content.idea_images).length + asArray(content.visuals).length;
    const images = normalizeImages(content, contextText);
    const quiz = normalizeQuiz(content.quiz, content, procedure, prevention);
    const guided = normalizeGuided(content, summary, procedure);
    const explicitOperational = normalizeOperational(content.operational);
    const operational = explicitOperational || inferOperational(title, summary, procedure, prevention, commonErrors);
    const resources = normalizeResources(content);
    const sourceDigest = normalizeSourceDigest(content, images);
    const good = textArray(content.good).length ? textArray(content.good) : procedure.slice(0, 3);
    const bad = textArray(content.bad).length ? textArray(content.bad) : commonErrors.slice(0, 3);
    const caseText = firstText(content.case, content.example_story,
      `Applica “${title}” a una situazione reale del tuo lavoro: individua il pericolo, la misura prevista e la condizione che richiede di fermarsi o chiedere supporto.`);
    const question = firstText(content.question, content.discussion_question, content.quiz?.question, content.quiz?.q,
      'Qual è la decisione più sicura e quali controlli faresti prima di procedere?');
    const feedback = content.discussion_feedback && typeof content.discussion_feedback === 'object' ? content.discussion_feedback : {};

    const topic = {
      id: firstText(context.presentationId, unit?.stable_key, `db-unit-${index + 1}`),
      source_stable_key: firstText(unit?.stable_key),
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
    topic.presentation_quality = presentationQuality(topic, explicitImageCount, !!explicitOperational);
    return topic;
  }

  function adaptBundle(bundle) {
    const c = bundle?.course || {};
    const rawModules = Array.isArray(bundle?.modules) ? bundle.modules : [];
    let cursor = 0;
    const topics = [];
    const modules = rawModules.map((m, mi) => {
      const units = Array.isArray(m?.units) ? [...m.units].sort((a, b) => numberOr(a.position) - numberOr(b.position)) : [];
      const moduleKey = firstText(m?.module_key, `db-module-${mi + 1}`);
      const moduleTopics = units.map((u, ui) => normalizeTopic(u, topics.length + ui, {
        courseTitle: c.title,
        family: c.family,
        moduleTitle: m?.title,
        presentationId: `${moduleKey}::${firstText(u?.stable_key, `unit-${ui + 1}`)}::${ui + 1}`
      }));
      topics.push(...moduleTopics);
      const minutes = moduleTopics.reduce((sum, t) => sum + numberOr(t.minutes), 0) || numberOr(m?.nominal_minutes);
      const start = cursor;
      cursor += minutes;
      return {
        id: moduleKey,
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
    const qualityScore = topics.length ? Math.round(topics.reduce((s, t) => s + numberOr(t.presentation_quality?.score), 0) / topics.length) : 0;
    const authoredVisualTopics = topics.filter(t => t.presentation_quality?.visual_mode === 'authored').length;
    const autoVisualTopics = topics.filter(t => t.presentation_quality?.visual_mode === 'auto-themed').length;
    const course = {
      // Preserve freeze metadata for downstream presentation overlays and audits.
      metadata: (c.metadata && typeof c.metadata==='object' && !Array.isArray(c.metadata)) ? {...c.metadata} : {},
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
      resources: uniqueBy(topics.flatMap(t => t.resources || []), r => r.url),
      didactic_version: firstText(c.metadata?.didactic_version, version?.syllabus_snapshot?.didactic_version, 'db-adapted'),
      material_complete: c.metadata?.material_complete !== false && topics.length > 0,
      presentation_ready: topics.length > 0,
      presentation_generated_from_db: true,
      presentation_quality: {
        score: qualityScore,
        level: qualityScore >= 85 ? 'rich' : (qualityScore >= 65 ? 'ready' : 'base'),
        authored_visual_topics: authoredVisualTopics,
        auto_visual_topics: autoVisualTopics,
        total_topics: topics.length
      },
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

  function resetAdapted() {
    const courses=data();
    for(let i=courses.length-1;i>=0;i--)if(courses[i]?.presentation_generated_from_db)courses.splice(i,1);
    cache.clear();
  }
  window.SAFETY_DB_SLIDES = { adaptBundle, ensureCourse, localCourse, resetAdapted };
})();
