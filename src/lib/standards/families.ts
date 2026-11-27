/**
 * Events that measure the same kind of effort, so different organizations can be compared
 * side by side. The order here is the row order of the comparison table.
 */
export const EVENT_FAMILIES = [
  { id: 'push-ups', label: 'Push-ups' },
  { id: 'pull-ups', label: 'Pull-ups' },
  { id: 'sit-ups', label: 'Sit-ups' },
  { id: 'reverse-crunch', label: 'Cross-leg reverse crunch' },
  { id: 'plank', label: 'Plank' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'sprint', label: 'Sprint' },
  { id: 'sprint-drag-carry', label: 'Sprint-drag-carry' },
  { id: 'agility-run', label: 'Agility run' },
  { id: 'run-1-5-mile', label: '1.5-mile run' },
  { id: 'run-2-mile', label: 'Two-mile run' },
  { id: 'run-3-mile', label: 'Three-mile run' },
  { id: 'hamr', label: '20-meter HAMR (shuttle run)' },
  { id: 'sit-and-reach', label: 'Sit and reach' },
  { id: 'walk-2km', label: '2-kilometer walk (medical alternative)' },
] as const;

export type EventFamilyId = (typeof EVENT_FAMILIES)[number]['id'];

export const FAMILY_IDS = EVENT_FAMILIES.map((family) => family.id) as [
  EventFamilyId,
  ...EventFamilyId[],
];
