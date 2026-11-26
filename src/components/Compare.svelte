<script lang="ts">
  import { buildComparison } from '../lib/compare';
  import { parseAge } from '../lib/readiness/inputs';
  import type { Sex } from '../lib/standards/evaluate';
  import type {
    BodyCompositionStandard,
    Organization,
    PointsStandard,
    Standard,
  } from '../lib/standards/schema';

  interface Props {
    organizations: Organization[];
    standards: Standard[];
    pointStandards: PointsStandard[];
    bodyRules: BodyCompositionStandard[];
  }

  let { organizations, standards, pointStandards, bodyRules }: Props = $props();

  // The age and sex only choose which column of each official table is shown.
  // They stay in memory in this component: no storage, no URL, no network.
  let ageText = $state('25');
  let sex = $state<Sex>('male');
  let combat = $state(false);
  let validAge = $state(25);
  let touched = $state(false);

  const parsed = $derived(parseAge(ageText));
  const ageError = $derived(touched && !parsed.ok ? parsed.message : '');
  const hasCombat = $derived(standards.some((s) => s.variants.some((v) => v.id === 'combat')));
  const comparison = $derived(
    buildComparison(
      { organizations, standards, pointStandards, bodyRules },
      { age: validAge, sex, variant: combat ? 'combat' : undefined },
    ),
  );
  const hasOtherRules = $derived(comparison.otherRule.some((rule) => rule !== undefined));
  const hasBodyRules = $derived(comparison.bodyRule.some((rule) => rule !== undefined));

  $effect(() => {
    if (parsed.ok && parsed.value !== undefined) validAge = parsed.value;
  });
</script>

<section class="controls" aria-labelledby="controls-title">
  <h2 id="controls-title">Whose minimums?</h2>
  <div class="field">
    <label for="c-age">Age <span class="req" aria-hidden="true">*</span></label>
    <input
      id="c-age"
      name="age"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      spellcheck="false"
      required
      bind:value={ageText}
      onblur={() => (touched = true)}
      aria-invalid={ageError ? 'true' : undefined}
      aria-describedby={ageError ? 'c-age-hint c-age-error' : 'c-age-hint'}
    />
    <span class="hint" id="c-age-hint">Whole years, 17 or older.</span>
    {#if ageError}
      <span class="error" id="c-age-error">
        <span class="sym" aria-hidden="true">⚠</span>{ageError} Showing age {validAge}.
      </span>
    {/if}
  </div>

  <fieldset>
    <legend>Minimums to show</legend>
    <label class="choice">
      <input type="radio" name="sex" value="male" bind:group={sex} />
      Male minimums
    </label>
    <label class="choice">
      <input type="radio" name="sex" value="female" bind:group={sex} />
      Female minimums
    </label>
  </fieldset>

  {#if hasCombat}
    <label class="choice">
      <input type="checkbox" name="combat" bind:checked={combat} />
      Army: show the combat MOS standard (the same for everyone)
    </label>
  {/if}
</section>

<p class="status" aria-live="polite">
  Showing the {sex} minimums for age {validAge}{combat
    ? ', with the Army combat MOS standard'
    : ''}.
</p>

<div class="table-wrap" role="region" aria-labelledby="table-title" tabindex="0">
  <table>
    <caption id="table-title">
      Official minimums side by side. Read the small text under each number: the same kind of event
      can have a different time limit or technique. For tests scored in points (DEA, FBI, Secret
      Service) the number shown is the level worth one point; the total those tests also require is
      in the last row.
    </caption>
    <thead>
      <tr>
        <th scope="col" rowspan="2">Event</th>
        {#each comparison.groups as group (group.kind)}
          <th scope="colgroup" colspan={group.span} class="group">{group.label}</th>
        {/each}
      </tr>
      <tr>
        {#each comparison.columns as org (org.id)}
          <th scope="col">{org.shortName}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each comparison.rows as row (row.familyId)}
        <tr>
          <th scope="row">{row.label}</th>
          {#each row.cells as events, index (comparison.columns[index]?.id ?? index)}
            <td>
              {#if events.length === 0}
                <span aria-hidden="true">–</span>
                <span class="sr-only">Not part of this test</span>
              {:else}
                {#each events as event (event.name)}
                  <span class="cell-event">
                    {#if event.minimum}
                      <span class="minimum">{event.minimum}</span>
                    {:else}
                      <span class="minimum muted">No published minimum for this age</span>
                    {/if}
                    <span class="event-name">{event.name}</span>
                    {#if event.note}
                      <span class="event-name">{event.note}</span>
                    {/if}
                  </span>
                {/each}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
      {#if hasBodyRules}
        <tr>
          <th scope="row">Body composition</th>
          {#each comparison.bodyRule as rule, index (comparison.columns[index]?.id ?? index)}
            <td>
              {#if rule}
                <span class="minimum">{rule}</span>
              {:else}
                <span aria-hidden="true">–</span>
                <span class="sr-only">No published rule yet</span>
              {/if}
            </td>
          {/each}
        </tr>
      {/if}
      {#if hasOtherRules}
        <tr>
          <th scope="row">Also applies</th>
          {#each comparison.otherRule as rule, index (comparison.columns[index]?.id ?? index)}
            <td>
              {#if rule}
                <span class="event-name">{rule}</span>
              {:else}
                <span aria-hidden="true">–</span>
                <span class="sr-only">Nothing beyond the listed minimums</span>
              {/if}
            </td>
          {/each}
        </tr>
      {/if}
    </tbody>
  </table>
</div>

{#if comparison.partial.length > 0}
  <p class="hint">Shown only in part, because some official numbers are still being checked:</p>
  <ul class="hint hint-list">
    {#each comparison.partial as entry (entry.name)}
      <li><strong>{entry.name}:</strong> {entry.items.join('; ')}</li>
    {/each}
  </ul>
{/if}

{#if comparison.missing.length > 0}
  <p class="hint">Not shown yet, because the official numbers are still being checked:</p>
  <ul class="hint hint-list">
    {#each comparison.missing as group (group.kind)}
      <li><strong>{group.label}:</strong> {group.names.join(', ')}</li>
    {/each}
  </ul>
{/if}

<section aria-labelledby="sources-title">
  <h2 id="sources-title">Sources</h2>
  <ul class="sources">
    {#each comparison.sources as source (source.org.id)}
      <li>
        <strong>{source.org.name}</strong>
        <ul>
          {#each [...source.standards, ...source.pointStandards, ...source.bodyRules] as item (item.id)}
            <li>
              {item.source.document}{item.source.documentDate
                ? ` (${item.source.documentDate})`
                : ''}. Checked against the official document on {item.source.verifiedAt}.
              {#if item.source.url}
                <a href={item.source.url} target="_blank" rel="noopener noreferrer">
                  Official source (opens in a new tab)
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
</section>

<style>
  .controls {
    display: grid;
    gap: 1rem;
  }

  .controls h2 {
    margin-block: 0;
  }

  fieldset {
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.5rem 1rem 0.75rem;
    margin: 0;
    display: grid;
    gap: 0.25rem;
  }

  legend {
    font-weight: 600;
    padding-inline: 0.25rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field label {
    font-weight: 600;
  }

  input[type='text'] {
    font: inherit;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--fg);
    max-width: 8rem;
  }

  input[aria-invalid='true'] {
    border-color: var(--warn);
    border-width: 2px;
  }

  .choice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-block-size: 2.25rem;
  }

  .choice input {
    inline-size: 1.15rem;
    block-size: 1.15rem;
    flex-shrink: 0;
  }

  .hint {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0;
  }

  .hint-list {
    margin: 0 0 1rem;
    padding-inline-start: 1.25rem;
  }

  .error {
    color: var(--warn);
    font-weight: 600;
    font-size: 0.95rem;
  }

  .sym {
    margin-inline-end: 0.4em;
  }

  .req {
    margin-inline-start: 0.25em;
  }

  .status {
    margin-block: 1rem 0.5rem;
    font-weight: 600;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }

  table {
    border-collapse: collapse;
    inline-size: 100%;
    min-inline-size: 48rem;
  }

  thead th[scope='col']:not(:first-child),
  tbody td {
    min-inline-size: 8.5rem;
  }

  caption {
    text-align: start;
    padding: 0.6rem 0.8rem;
    color: var(--muted);
    font-size: 0.9rem;
  }

  th,
  td {
    padding: 0.55rem 0.7rem;
    border-block-start: 1px solid var(--border);
    border-inline-start: 1px solid var(--border);
    text-align: start;
    vertical-align: top;
  }

  th:first-child,
  td:first-child {
    border-inline-start: 0;
  }

  thead th {
    background: var(--surface);
  }

  th.group {
    text-align: center;
    color: var(--muted);
    font-size: 0.9rem;
  }

  tbody th[scope='row'] {
    background: var(--surface);
    white-space: nowrap;
    position: sticky;
    inset-inline-start: 0;
  }

  .cell-event {
    display: grid;
    margin-block-end: 0.5rem;
  }

  .cell-event:last-child {
    margin-block-end: 0;
  }

  .minimum {
    font-weight: 700;
  }

  .minimum.muted {
    font-weight: 400;
    color: var(--muted);
  }

  .event-name {
    color: var(--muted);
    font-size: 0.85rem;
  }

  .sources {
    display: grid;
    gap: 0.75rem;
    padding-inline-start: 1.25rem;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .sources ul {
    margin: 0.25rem 0 0;
    padding-inline-start: 1.25rem;
  }
</style>
