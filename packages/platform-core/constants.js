export const PLATFORM_ROLES = Object.freeze([
  'super_admin',
  'organization_admin',
  'training_manager',
  'teacher',
  'tutor',
  'company_admin',
  'learner'
]);

export const LEARNING_STATUS = Object.freeze([
  'not_started', 'in_progress', 'completed', 'passed', 'failed'
]);

export const CERTIFICATION_STATUS = Object.freeze([
  'not_applicable', 'not_certified', 'certifiable', 'certified'
]);

export const AVAILABILITY_MODES = Object.freeze([
  'immediate', 'start_only', 'window', 'manual'
]);

export const LEARNING_EVENT_TYPES = Object.freeze([
  'session_started', 'session_ended', 'unit_opened', 'unit_closed',
  'heartbeat', 'interaction', 'visibility_paused', 'visibility_resumed',
  'content_viewed', 'question_answered', 'unit_completed', 'test_started',
  'test_answered', 'test_completed'
]);

export const DEFAULT_TRACKING = Object.freeze({
  heartbeatSeconds: 30,
  idleTimeoutSeconds: 300,
  minimumActiveRatio: 0.60,
  requireAllMandatoryContent: true,
  requireComprehensionCheck: true
});
