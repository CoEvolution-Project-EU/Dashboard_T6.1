/**
 * Defence Flow ID → human-readable description.
 *
 * Used by the Tools / Defences / Gadgets catalog pages: clicking a DF-xx chip
 * opens a popup that shows the matching description from this table. Add new
 * entries here as they become known.
 */
export const DEFENCE_FLOW_DESCRIPTIONS: Record<string, string> = {
  'DF-01':
    'Combines adversarial sample generation, robustness evaluation, ' +
    'robustification/purification, deployment-time monitoring or mitigation, ' +
    'and later updates against new perturbations.',
  'DF-04':
    'Combines robust distributed-learning design/training, monitoring of peers ' +
    'and updates, context-driven protocol adaptation, and post-deployment patching.'
};

/** Lookup with case-insensitive fallback (e.g. df-01 → DF-01). */
export function describeDefenceFlow(id: string): string {
  if (!id) return '';
  const direct = DEFENCE_FLOW_DESCRIPTIONS[id];
  if (direct) return direct;
  const upper = id.trim().toUpperCase();
  if (DEFENCE_FLOW_DESCRIPTIONS[upper]) return DEFENCE_FLOW_DESCRIPTIONS[upper];
  return `Description for ${id} is not available yet.`;
}
