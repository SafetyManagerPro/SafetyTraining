import { DEFAULT_TRACKING } from './constants.js';

/**
 * Client-side helper for INTERNAL LEARNING tracking.
 * The server remains authoritative: heartbeats/events must be persisted and
 * aggregated in the database. This helper deliberately stops counting time
 * while the page is hidden or the learner is idle.
 */
export function createActivityTracker({
  heartbeatSeconds = DEFAULT_TRACKING.heartbeatSeconds,
  idleTimeoutSeconds = DEFAULT_TRACKING.idleTimeoutSeconds,
  onHeartbeat = () => {},
  onStateChange = () => {}
} = {}) {
  let active = !document.hidden;
  let lastInteraction = Date.now();
  let lastTick = Date.now();
  let pendingActiveSeconds = 0;

  const markInteraction = () => {
    lastInteraction = Date.now();
    if (!document.hidden && !active) {
      active = true;
      lastTick = Date.now();
      onStateChange('active');
    }
  };

  const tick = () => {
    const now = Date.now();
    const idle = (now - lastInteraction) / 1000 >= idleTimeoutSeconds;
    const shouldBeActive = !document.hidden && !idle;

    if (shouldBeActive && active) {
      pendingActiveSeconds += Math.max(0, Math.round((now - lastTick) / 1000));
    }

    if (shouldBeActive !== active) {
      active = shouldBeActive;
      onStateChange(active ? 'active' : (document.hidden ? 'hidden' : 'idle'));
    }

    lastTick = now;
    if (pendingActiveSeconds > 0) {
      onHeartbeat({ activeSeconds: pendingActiveSeconds, at: new Date().toISOString() });
      pendingActiveSeconds = 0;
    }
  };

  const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(evt => window.addEventListener(evt, markInteraction, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    tick();
    if (!document.hidden) markInteraction();
  });

  const timer = window.setInterval(tick, heartbeatSeconds * 1000);
  return {
    markInteraction,
    flush: tick,
    destroy() {
      tick();
      window.clearInterval(timer);
      events.forEach(evt => window.removeEventListener(evt, markInteraction));
    }
  };
}
