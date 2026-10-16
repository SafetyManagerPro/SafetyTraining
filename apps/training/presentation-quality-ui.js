/* SafetyTraining — presentation quality inspector.
   Visible only to authenticated admin/teacher contexts; never changes course status or learner progress. */
(() => {
  'use strict';

  const data = () => window.SAFETY_DATA || [];
  const cloud = () => window.SAFETY_CLOUD;
  const isLearner = () => !!cloud()?.state?.learner;
  const isAuthenticated = () => !!cloud()?.state?.user;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));

  function topicScore(t) {
    if (Number.isFinite(Number(t?.presentation_quality?.score))) return Number(t.presentation_quality.score);
    let score = 0;
    if (t?.summary) score += 10;
    if (t?.detail) score += 10;
    if ((t?.procedure || []).length) score += 12;
    if ((t?.prevention || []).length) score += 10;
    if ((t?.risks || []).length) score += 8;
    if (t?.case && t?.question) score += 12;
    if (t?.quiz) score += 10;
    if ((t?.teacher_expansion || []).length || t?.teacher) score += 10;
    if ((t?.idea_images || []).length) score += 8;
    if (t?.operational) score += 10;
    return Math.min(100, score);
  }

  function auditCourse(course) {
    const topics = course?.topics || [];
    const score = Number.isFinite(Number(course?.presentation_quality?.score))
      ? Number(course.presentation_quality.score)
      : (topics.length ? Math.round(topics.reduce((sum, t) => sum + topicScore(t), 0) / topics.length) : 0);

    const authoredVisuals = topics.filter(t =>
      t?.presentation_quality?.visual_mode === 'authored' ||
      ((t?.idea_images || []).length && !(t.idea_images || []).every(x => x?.auto_generated))
    ).length;
    const autoVisuals = topics.filter(t =>
      t?.presentation_quality?.visual_mode === 'auto-themed' ||
      (t?.idea_images || []).some(x => x?.auto_generated)
    ).length;
    const authoredOperational = topics.filter(t => t?.presentation_quality?.operational_mode === 'authored').length;
    const autoOperational = topics.filter(t =>
      t?.presentation_quality?.operational_mode === 'auto-structured' || t?.operational?.auto_generated
    ).length;
    const quiz = topics.filter(t => !!t?.quiz).length;
    const teacher = topics.filter(t => (t?.teacher_expansion || []).length || t?.teacher).length;

    return {
      score,
      level: score >= 85 ? 'rich' : (score >= 65 ? 'ready' : 'base'),
      topics: topics.length,
      authoredVisuals,
      autoVisuals,
      authoredOperational,
      autoOperational,
      quiz,
      teacher
    };
  }

  const label = level => level === 'rich' ? 'Ricca' : (level === 'ready' ? 'Pronta' : 'Base');

  function removePanel() {
    document.getElementById('presentationQualityPanel')?.remove();
  }

  function decorate() {
    removePanel();
    if (isLearner() || !isAuthenticated()) return;
    const parts = location.hash.replace(/^#/, '').split('/').filter(Boolean);
    if (parts[0] !== 'course' || !parts[1]) return;
    const course = data().find(c => c.id === parts[1]);
    if (!course) return;

    requestAnimationFrame(() => setTimeout(() => {
      const hero = document.querySelector('.agenda-hero');
      if (!hero || document.getElementById('presentationQualityPanel')) return;
      const q = auditCourse(course);
      const panel = document.createElement('section');
      panel.id = 'presentationQualityPanel';
      panel.className = `presentation-quality-panel pq-${q.level}`;
      panel.innerHTML = `
        <div class="pq-heading">
          <div><span class="pq-kicker">QUALITÀ PRESENTAZIONE · CONTROLLO INTERNO</span><strong>${q.score}/100 · ${label(q.level)}</strong></div>
          <small>Non modifica validità, pubblicazione o requisiti normativi del corso.</small>
        </div>
        <div class="pq-metrics">
          <div><b>${q.topics}</b><span>argomenti</span></div>
          <div><b>${q.authoredVisuals}</b><span>visuali autoriali</span></div>
          <div><b>${q.autoVisuals}</b><span>visuali tematici auto</span></div>
          <div><b>${q.authoredOperational}</b><span>guide operative autoriali</span></div>
          <div><b>${q.autoOperational}</b><span>guide auto-strutturate</span></div>
          <div><b>${q.quiz}</b><span>argomenti con quiz</span></div>
          <div><b>${q.teacher}</b><span>supporti docente</span></div>
        </div>`;
      hero.appendChild(panel);
    }, 20));
  }

  window.SAFETY_PRESENTATION_QUALITY = { auditCourse, decorate };
  window.addEventListener('hashchange', decorate);
  window.addEventListener('safety:course-adapted', () => setTimeout(decorate, 30));
  window.addEventListener('safety:catalog-ready', () => setTimeout(decorate, 30));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate);
  else decorate();
})();
