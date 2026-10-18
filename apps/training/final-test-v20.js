/* SafetyTraining Final Test v20 — course-version-bound learner test UI. */
(() => {
  'use strict';

  const local = {
    tests: [],
    testsByCourseVersion: new Map(),
    current: null,
    booted: false,
    refreshTimer: null,
    sending:false,
    opening:false,
    availabilitySeq:0,
    openSeq:0,
    answerSeq:0,
    resultSeq:0
  };

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const cloud = () => window.SAFETY_CLOUD;

  function ensureUi() {
    if (!$('finalTestButton')) {
      const button = document.createElement('button');
      button.id = 'finalTestButton';
      button.className = 'final-test-button hidden';
      button.type = 'button';
      button.textContent = '✓ Verifica';
      button.addEventListener('click', openPicker);
      const account = $('cloudAccount');
      if (account) account.insertAdjacentElement('afterend', button);
      else document.querySelector('.topbar')?.appendChild(button);
    }
    if (!$('finalTestOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'finalTestOverlay';
      overlay.className = 'final-test-overlay hidden';
      overlay.innerHTML = `<section class="final-test-modal" role="dialog" aria-modal="true" aria-labelledby="finalTestTitle">
        <div class="final-test-head"><div><div class="final-test-kicker">VERIFICA SAFETYTRAINING</div><h2 id="finalTestTitle">Verifica</h2></div><button id="finalTestClose" class="final-test-close" type="button" aria-label="Chiudi">×</button></div>
        <div id="finalTestBody"></div><div id="finalTestMessage" class="final-test-message"></div>
      </section>`;
      overlay.addEventListener('click', (event) => { if (event.target === overlay) closeTest(); });
      document.body.appendChild(overlay);
      $('finalTestClose')?.addEventListener('click', closeTest);
    }
  }

  function setMessage(text, kind = '') {
    const el = $('finalTestMessage');
    if (!el) return;
    el.textContent = text || '';
    el.className = `final-test-message ${kind}`.trim();
  }

  function assignmentForVersion(courseVersionId) {
    return (cloud()?.state?.assignments || []).find((a) => a.courseVersionId === courseVersionId) || null;
  }

  async function refreshAvailability() {
    ensureUi();
    const request=++local.availabilitySeq;
    const st = cloud()?.state;
    const userId=st?.user?.id||null;
    const assignmentKey=(st?.assignments||[]).map(a=>a.id).join(',');
    if (!st?.client || !userId || !st.assignments?.length) {
      local.tests = [];
      local.testsByCourseVersion = new Map();
      $('finalTestButton')?.classList.add('hidden');
      return;
    }
    const ids = [...new Set(st.assignments.map((a) => a.courseVersionId).filter(Boolean))];
    if (!ids.length) return;
    const { data, error } = await st.client.from('tests')
      .select('id,course_version_id,title,passing_score_pct,max_attempts,test_key,metadata')
      .in('course_version_id', ids).eq('active', true)
      .order('created_at', { ascending:true });
    const current=cloud()?.state;
    if(request!==local.availabilitySeq || current?.user?.id!==userId || (current?.assignments||[]).map(a=>a.id).join(',')!==assignmentKey)return;
    if (error) {
      console.warn('[SafetyTraining Final Test] availability:', error.message);
      return;
    }
    local.tests = data || [];
    local.testsByCourseVersion = new Map();
    local.tests.forEach((test) => {
      const list = local.testsByCourseVersion.get(test.course_version_id) || [];
      list.push(test);
      local.testsByCourseVersion.set(test.course_version_id, list);
    });
    const button = $('finalTestButton');
    if (button) {
      button.classList.toggle('hidden', local.tests.length === 0);
      button.textContent = local.tests.length > 1 ? `✓ Verifiche (${local.tests.length})` : '✓ Verifica';
    }
  }

  function openPicker() {
    ensureUi();
    const overlay = $('finalTestOverlay');
    overlay?.classList.remove('hidden');
    window.SAFETY_MODAL_ACCESS?.opened(overlay,closeTest);
    setMessage('');
    const body = $('finalTestBody');
    if (!body) return;
    if (!local.tests.length) {
      body.innerHTML = '<div class="final-test-state">Nessuna verifica attiva per i percorsi assegnati.</div>';
      return;
    }
    body.innerHTML = `<div class="final-test-picker">${local.tests.map((test) => {
      const assignment = assignmentForVersion(test.course_version_id);
      const label = test.test_key?.startsWith('theory-') ? 'Verifica teorico-tecnica' : 'Verifica finale';
      return `<article class="final-test-card">
        <div><span>${esc(label)}</span><strong>${esc(assignment?.courseTitle || assignment?.editionTitle || test.title)}</strong></div>
        <small>Versione corso ${esc(assignment?.versionNumber || '')} · soglia ${Number(test.passing_score_pct || 70)}%</small>
        <button type="button" class="openbtn final-test-open" data-test-id="${esc(test.id)}">Apri verifica</button>
      </article>`;
    }).join('')}</div>`;
    body.querySelectorAll('.final-test-open').forEach((button) => button.addEventListener('click', () => openTest(button.dataset.testId)));
  }

  function closeTest() {
    local.openSeq += 1;
    local.answerSeq += 1;
    local.resultSeq += 1;
    local.opening=false;
    local.sending=false;
    window.SAFETY_MODAL_ACCESS?.closed($('finalTestOverlay'));
    $('finalTestOverlay')?.classList.add('hidden');
    local.current = null;
    setMessage('');
  }

  async function getAttempts(assignment, test) {
    const st = cloud().state;
    const { data, error } = await st.client.from('test_attempts')
      .select('id,attempt_no,started_at,completed_at,score_pct,passed,metadata')
      .eq('enrollment_id', assignment.id).eq('test_id', test.id)
      .order('attempt_no', { ascending:false });
    if (error) throw error;
    return data || [];
  }

  async function createAttempt(assignment, test) {
    const st = cloud().state;
    const { data, error } = await st.client.from('test_attempts')
      .insert({ enrollment_id:assignment.id, test_id:test.id, attempt_no:1, metadata:{ client:'SafetyTraining Final Test v20' } })
      .select('id,attempt_no,started_at,completed_at,score_pct,passed,metadata').single();
    if (error) throw error;
    return data;
  }

  async function loadQuestions(test) {
    const st = cloud().state;
    const { data: links, error: linkError } = await st.client.from('test_questions')
      .select('question_id,position,points').eq('test_id', test.id).order('position', { ascending:true });
    if (linkError) throw linkError;
    const ids = (links || []).map((x) => x.question_id).filter(Boolean);
    if (!ids.length) return [];
    const { data: questions, error: questionError } = await st.client.from('questions')
      .select('id,prompt,question_type,options,metadata').in('id', ids).eq('active', true);
    if (questionError) throw questionError;
    const map = new Map((questions || []).map((q) => [q.id, q]));
    return (links || []).map((link) => ({ ...link, question:map.get(link.question_id) })).filter((x) => x.question);
  }

  async function loadExistingAnswers(attemptId) {
    const st = cloud().state;
    const { data, error } = await st.client.from('test_answers').select('question_id,answer').eq('test_attempt_id', attemptId);
    if (error) throw error;
    return new Map((data || []).map((row) => [row.question_id, row.answer]));
  }

  async function openTest(testId) {
    if(local.opening)return;
    const test = local.tests.find((x) => x.id === testId);
    if (!test) return;
    const assignment = assignmentForVersion(test.course_version_id);
    const userId=cloud()?.state?.user?.id||null;
    if (!assignment || !userId) return;
    const request=++local.openSeq;
    const current=()=>request===local.openSeq && cloud()?.state?.user?.id===userId && assignmentForVersion(test.course_version_id)?.id===assignment.id && !$('finalTestOverlay')?.classList.contains('hidden');
    local.opening=true;
    $('finalTestBody')?.querySelectorAll('button').forEach(button=>button.disabled=true);
    setMessage('Caricamento verifica…');
    try {
      const attempts = await getAttempts(assignment, test);
      if(!current())return;
      const latest = attempts[0] || null;
      if (latest?.completed_at && latest.passed === true) {
        renderResult(test, assignment, latest, attempts);
        return;
      }
      if (latest?.completed_at && latest.passed === false && test.max_attempts && attempts.length >= test.max_attempts) {
        renderResult(test, assignment, latest, attempts);
        return;
      }
      const attempt = latest && !latest.completed_at ? latest : await createAttempt(assignment, test);
      if(!current())return;
      const questions = await loadQuestions(test);
      if(!current())return;
      const answers = await loadExistingAnswers(attempt.id);
      if(!current())return;
      local.current = { test, assignment, attempt, attempts, questions, answers, index:0, userId };
      const firstOpen = questions.findIndex((row) => !answers.has(row.question_id));
      local.current.index = firstOpen >= 0 ? firstOpen : Math.max(0, questions.length - 1);
      renderQuestion();
    } catch (error) {
      if(current()){
        console.warn('[SafetyTraining Final Test] open:', error?.message || error);
        setMessage(error?.message || 'Impossibile aprire la verifica.', 'error');
      }
    } finally {
      if(request===local.openSeq)local.opening=false;
    }
  }

  function renderQuestion() {
    const current = local.current;
    const body = $('finalTestBody');
    if (!current || !body) return;
    const row = current.questions[current.index];
    if (!row) {
      refreshAttemptResult();
      return;
    }
    const q = row.question;
    const answered = current.answers.has(q.id);
    const saved = current.answers.get(q.id)?.option_id;
    $('finalTestTitle').textContent = current.test.title || 'Verifica';
    body.innerHTML = `<div class="final-test-progress"><span style="width:${((current.index + 1) / current.questions.length) * 100}%"></span></div>
      <div class="final-test-counter">Domanda ${current.index + 1} di ${current.questions.length}</div>
      <section class="final-test-question"><h3>${esc(q.prompt)}</h3>
        <div class="final-test-options">${(Array.isArray(q.options) ? q.options : []).map((option) => `<button type="button" class="final-test-option ${String(saved) === String(option.id) ? 'selected' : ''}" data-option-id="${esc(option.id)}" ${answered ? 'disabled' : ''}>${esc(option.label)}</button>`).join('')}</div>
      </section>
      <div class="final-test-nav"><button type="button" class="ghost" id="finalTestPrev" ${current.index === 0 ? 'disabled' : ''}>Indietro</button><button type="button" class="openbtn" id="finalTestNext">${current.index === current.questions.length - 1 ? 'Verifica esito' : 'Avanti'}</button></div>`;
    body.querySelectorAll('.final-test-option').forEach((button) => button.addEventListener('click', () => submitCurrentAnswer(button.dataset.optionId)));
    $('finalTestPrev')?.addEventListener('click', () => { current.index = Math.max(0, current.index - 1); renderQuestion(); });
    $('finalTestNext')?.addEventListener('click', () => {
      if (current.index === current.questions.length - 1) refreshAttemptResult();
      else { current.index += 1; renderQuestion(); }
    });
    setMessage(answered ? 'Risposta registrata. Non può essere modificata durante questo tentativo.' : 'Seleziona una risposta. La correzione è eseguita dal server.');
  }

  async function submitCurrentAnswer(optionId) {
    const current = local.current;
    if (!current) return;
    const row = current.questions[current.index];
    if (!row || current.answers.has(row.question_id)||local.sending) return;
    const request=++local.answerSeq;
    const valid=()=>request===local.answerSeq && local.current===current && cloud()?.state?.user?.id===current.userId && !$('finalTestOverlay')?.classList.contains('hidden');
    local.sending=true;
    $('finalTestBody')?.querySelectorAll('.final-test-option').forEach(b=>b.disabled=true);
    setMessage('Registrazione risposta…');
    try {
      const { error } = await cloud().state.client.from('test_answers').insert({
        test_attempt_id:current.attempt.id,
        question_id:row.question_id,
        answer:{ option_id:String(optionId) }
      });
      if (error) throw error;
      if(!valid())return;
      current.answers.set(row.question_id, { option_id:String(optionId) });
      if (current.answers.size >= current.questions.length) await refreshAttemptResult();
      else {
        const next = current.questions.findIndex((item, idx) => idx > current.index && !current.answers.has(item.question_id));
        current.index = next >= 0 ? next : current.index;
        renderQuestion();
      }
    } catch (error) {
      if(valid()){
        console.warn('[SafetyTraining Final Test] answer:', error?.message || error);
        setMessage(error?.message || 'Risposta non registrata.', 'error');
      }
    }finally{
      if(request===local.answerSeq)local.sending=false;
      if(valid()&&!current.answers.has(row.question_id))$('finalTestBody')?.querySelectorAll('.final-test-option').forEach(b=>b.disabled=false);
    }
  }

  async function refreshAttemptResult() {
    const current = local.current;
    if (!current) return;
    const request=++local.resultSeq;
    const valid=()=>request===local.resultSeq && local.current===current && cloud()?.state?.user?.id===current.userId && !$('finalTestOverlay')?.classList.contains('hidden');
    const { data, error } = await cloud().state.client.from('test_attempts')
      .select('id,attempt_no,started_at,completed_at,score_pct,passed,metadata').eq('id', current.attempt.id).single();
    if(!valid())return;
    if (error) { setMessage(error.message, 'error'); return; }
    if (!data.completed_at) {
      const next = current.questions.findIndex((row) => !current.answers.has(row.question_id));
      if (next >= 0) { current.index = next; renderQuestion(); setMessage('Completa tutte le domande prima di verificare l’esito.', 'error'); }
      return;
    }
    const attempts = await getAttempts(current.assignment, current.test);
    if(valid())renderResult(current.test, current.assignment, data, attempts);
  }

  function renderResult(test, assignment, attempt, attempts) {
    const body = $('finalTestBody');
    if (!body) return;
    const passed = attempt.passed === true;
    const canRetry = !passed && (!test.max_attempts || attempts.length < test.max_attempts);
    $('finalTestTitle').textContent = test.title || 'Esito verifica';
    body.innerHTML = `<section class="final-test-result ${passed ? 'passed' : 'failed'}">
      <div class="final-test-result-mark">${passed ? '✓' : '×'}</div>
      <h3>${passed ? 'Verifica superata' : 'Verifica non superata'}</h3>
      <div class="final-test-score">${Number(attempt.score_pct || 0).toFixed(0)}%</div>
      <p>Soglia di superamento: ${Number(test.passing_score_pct || 70).toFixed(0)}% · tentativo ${attempt.attempt_no}</p>
      ${canRetry ? '<button type="button" class="openbtn" id="finalTestRetry">Nuovo tentativo</button>' : ''}
    </section>`;
    $('finalTestRetry')?.addEventListener('click', async () => {
      local.current = null;
      await openTest(test.id);
    });
    setMessage(passed ? 'Esito registrato dal sistema.' : (canRetry ? 'Puoi effettuare un nuovo tentativo.' : 'Numero massimo di tentativi raggiunto.'), passed ? 'ok' : 'error');
  }

  async function bootstrap() {
    ensureUi();
    if (local.booted) return;
    local.booted = true;
    await refreshAvailability();
    document.addEventListener('safety:cloud-state-changed',()=>refreshAvailability().catch(()=>{}));
    document.addEventListener('safety:auth-changed',()=>{closeTest();refreshAvailability().catch(()=>{});});
    window.addEventListener('hashchange', () => window.setTimeout(refreshAvailability, 0));
  }

  window.SAFETY_FINAL_TEST = { refreshAvailability, openPicker, closeTest, openTest, state:local };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
})();