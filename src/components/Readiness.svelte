<script lang="ts">
  import { tick } from 'svelte';
  import { CM_PER_INCH, KG_PER_POUND, bodyMassIndex } from '../lib/body';
  import { describeMargin, formatValue, statusLabel } from '../lib/readiness/format';
  import {
    parseAge,
    parseEventValue,
    parseLength,
    parseWeight,
    unitHint,
    type Parsed,
    type UnitSystem,
  } from '../lib/readiness/inputs';
  import {
    evaluateBodyComposition,
    evaluateStandard,
    type BodyCompositionResult,
    type Sex,
    type StandardResult,
  } from '../lib/standards/evaluate';
  import {
    evaluatePointsStandard,
    type PointsEventResult,
    type PointsGroupResult,
    type PointsStandardResult,
  } from '../lib/standards/points';
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
  interface ResultSet {
    org: Organization;
    system: UnitSystem;
    items: { standard: Standard; result: StandardResult }[];
    points: { standard: PointsStandard; result: PointsStandardResult }[];
    body: {
      rule: BodyCompositionStandard;
      result: BodyCompositionResult;
      waist: number;
      height: number;
    }[];
    bmi: number | undefined;
  }

  const GROUPS = [
    { kind: 'military', label: 'Military branches' },
    { kind: 'federal', label: 'Federal agencies' },
    { kind: 'state', label: 'State agencies' },
  ] as const;

  let { organizations, standards, pointStandards, bodyRules }: Props = $props();

  // Everything typed stays in memory in this component: no storage, no URL, no network.
  let system = $state<UnitSystem>('us');
  let sex = $state<Sex | ''>('');
  let chosenOrg = $state('');
  let useVariant = $state(false);
  let texts = $state<Record<string, string>>({ age: '', height: '', weight: '', waist: '' });
  let errors = $state<Record<string, string>>({});
  let formError = $state('');
  let results = $state<ResultSet | null>(null);
  let stale = $state(false);
  let summaryEl = $state<HTMLElement | undefined>(undefined);
  let resultsHeading = $state<HTMLElement | undefined>(undefined);
  const touched: Record<string, boolean> = {};

  const hasData = (id: string): boolean =>
    standards.some((s) => s.organization === id) ||
    pointStandards.some((s) => s.organization === id) ||
    bodyRules.some((b) => b.organization === id);
  const available = $derived(organizations.filter((o) => hasData(o.id)));
  const unavailable = $derived(organizations.filter((o) => !hasData(o.id)));
  const groups = $derived(
    GROUPS.map((group) => ({
      ...group,
      available: available.filter((o) => o.kind === group.kind),
      unavailable: unavailable.filter((o) => o.kind === group.kind),
    })).filter((group) => group.available.length > 0 || group.unavailable.length > 0),
  );
  const orgId = $derived(chosenOrg || available[0]?.id || '');
  const org = $derived(available.find((o) => o.id === orgId));
  const orgStandards = $derived(standards.filter((s) => s.organization === orgId));
  const orgPoints = $derived(pointStandards.filter((s) => s.organization === orgId));
  const orgBody = $derived(bodyRules.filter((b) => b.organization === orgId));
  const variant = $derived([...orgStandards, ...orgPoints].flatMap((s) => s.variants)[0]);

  const eventKey = (standardId: string, eventId: string): string => `${standardId}__${eventId}`;

  function eventFields(): { key: string; unit: Standard['events'][number]['unit'] }[] {
    return [...orgStandards, ...orgPoints].flatMap((s) =>
      s.events.map((e) => ({ key: eventKey(s.id, e.id), unit: e.unit })),
    );
  }

  function numberOf(parsed: Parsed): number | undefined {
    return parsed.ok ? parsed.value : undefined;
  }

  function fieldError(name: string): string | undefined {
    const text = texts[name] ?? '';
    if (name === 'age') {
      const parsed = parseAge(text);
      return parsed.ok ? undefined : parsed.message;
    }
    if (name === 'sex')
      return sex === '' ? 'Choose the set of minimums to compare with.' : undefined;
    if (name === 'weight') {
      const parsed = parseWeight(text, system);
      return parsed.ok ? undefined : parsed.message;
    }
    if (name === 'height' || name === 'waist') {
      const parsed = parseLength(text, system, name);
      if (!parsed.ok) return parsed.message;
      const other = name === 'height' ? (texts.waist ?? '') : (texts.height ?? '');
      if (orgBody.length > 0 && text.trim() === '' && other.trim() !== '') {
        return `Enter your ${name} too, to check the waist-to-height ratio.`;
      }
      return undefined;
    }
    const field = eventFields().find((f) => f.key === name);
    if (!field) return undefined;
    const parsed = parseEventValue(field.unit, text, system);
    return parsed.ok ? undefined : parsed.message;
  }

  function allFieldNames(): string[] {
    return ['age', 'sex', 'height', 'weight', 'waist', ...eventFields().map((f) => f.key)];
  }

  function onInput(name: string): void {
    touched[name] = true;
    stale = results !== null;
    if (errors[name]) delete errors[name];
    // The other waist/height field may have been waiting for this one.
    if ((name === 'height' || name === 'waist') && errors[name === 'height' ? 'waist' : 'height']) {
      delete errors[name === 'height' ? 'waist' : 'height'];
    }
  }

  function onBlur(name: string): void {
    if (!touched[name]) return;
    const message = fieldError(name);
    if (message) errors[name] = message;
    else delete errors[name];
  }

  function convert(text: string | undefined, factor: number): string {
    if (text === undefined || text.trim() === '') return text ?? '';
    const value = Number(text.trim().replace(',', '.'));
    if (!Number.isFinite(value)) return text;
    return String(Number((value * factor).toFixed(1)));
  }

  function changeSystem(next: UnitSystem): void {
    if (next === system) return;
    const length = next === 'metric' ? CM_PER_INCH : 1 / CM_PER_INCH;
    const weight = next === 'metric' ? KG_PER_POUND : 1 / KG_PER_POUND;
    texts.height = convert(texts.height, length);
    texts.waist = convert(texts.waist, length);
    texts.weight = convert(texts.weight, weight);
    for (const field of eventFields()) {
      if (field.unit === 'inches') texts[field.key] = convert(texts[field.key], length);
      if (field.unit === 'pounds') texts[field.key] = convert(texts[field.key], weight);
    }
    system = next;
    errors = {};
    formError = '';
    results = null;
    stale = false;
  }

  function chooseOrg(id: string): void {
    chosenOrg = id;
    useVariant = false;
    errors = {};
    formError = '';
    results = null;
    stale = false;
  }

  function compute(): ResultSet | null {
    if (!org || sex === '') return null;
    const age = numberOf(parseAge(texts.age ?? ''));
    if (age === undefined) return null;
    const items = orgStandards.map((standard) => {
      const entries: Record<string, number | undefined> = {};
      for (const event of standard.events) {
        entries[event.id] = numberOf(
          parseEventValue(event.unit, texts[eventKey(standard.id, event.id)] ?? '', system),
        );
      }
      const variantId =
        useVariant && variant && standard.variants.some((v) => v.id === variant.id)
          ? variant.id
          : undefined;
      return {
        standard,
        result: evaluateStandard(standard, { age, sex, variant: variantId }, entries),
      };
    });

    const height = numberOf(parseLength(texts.height ?? '', system, 'height'));
    const waist = numberOf(parseLength(texts.waist ?? '', system, 'waist'));
    const weight = numberOf(parseWeight(texts.weight ?? '', system));
    const body =
      height !== undefined && waist !== undefined
        ? orgBody.map((rule) => ({
            rule,
            result: evaluateBodyComposition(rule, waist, height, system === 'us' ? 'in' : 'cm'),
            waist,
            height,
          }))
        : [];
    const points = orgPoints.map((standard) => {
      const entries: Record<string, number | undefined> = {};
      for (const event of standard.events) {
        entries[event.id] = numberOf(
          parseEventValue(event.unit, texts[eventKey(standard.id, event.id)] ?? '', system),
        );
      }
      const variantId =
        useVariant && variant && standard.variants.some((v) => v.id === variant.id)
          ? variant.id
          : undefined;
      return {
        standard,
        result: evaluatePointsStandard(
          standard,
          { age, sex, variant: variantId },
          entries,
          body[0]?.result.points,
        ),
      };
    });

    let bmi: number | undefined;
    if (height !== undefined && weight !== undefined) {
      bmi = bodyMassIndex(
        system === 'us' ? weight * KG_PER_POUND : weight,
        system === 'us' ? height * CM_PER_INCH : height,
      );
    }
    return { org, system, items, points, body, bmi };
  }

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const next: Record<string, string> = {};
    for (const name of allFieldNames()) {
      const message = fieldError(name);
      if (message) next[name] = message;
    }
    errors = next;
    formError = '';
    if (Object.keys(next).length > 0) {
      results = null;
      stale = false;
      await tick();
      summaryEl?.focus();
      return;
    }
    const computed = compute();
    const enteredEvents =
      (computed?.items.reduce((sum, item) => sum + item.result.enteredCount, 0) ?? 0) +
      (computed?.points.reduce((sum, item) => sum + item.result.scoredCount, 0) ?? 0);
    if (!computed || (enteredEvents === 0 && computed.body.length === 0)) {
      formError =
        'Enter at least one test result, or both your height and waist, then compare again.';
      results = null;
      await tick();
      summaryEl?.focus();
      return;
    }
    results = computed;
    stale = false;
    await tick();
    resultsHeading?.focus();
  }

  function focusField(name: string, event: MouseEvent): void {
    event.preventDefault();
    const id = name === 'sex' ? 'f-sex-male' : `f-${name}`;
    document.getElementById(id)?.focus();
  }

  function pointsStatus(event: PointsEventResult): string {
    if (event.status === 'scored') {
      return event.meetsEventMinimum
        ? 'Meets the per-event minimum'
        : 'Below the per-event minimum';
    }
    return event.status === 'not-entered' ? 'No result entered' : 'No published scale for you';
  }

  function partClass(part: PointsGroupResult): string {
    if (part.status !== 'scored') return 'not-entered';
    return part.meetsMinimum === false ? 'below' : 'meets';
  }

  function partStatus(part: PointsGroupResult): string {
    if (part.status !== 'scored') {
      return part.fromBodyComposition ? 'Needs your height and waist' : 'No result entered';
    }
    return part.meetsMinimum === false ? 'Below the minimum (scores zero)' : 'Counted';
  }

  function pointsClass(event: PointsEventResult): string {
    if (event.status !== 'scored') return 'not-entered';
    return event.meetsEventMinimum ? 'meets' : 'below';
  }

  const plural = (count: number, word: string): string =>
    `${count} ${word}${count === 1 ? '' : 's'}`;

  const symbol = (status: string): string =>
    status === 'meets' ? '✓' : status === 'below' ? '✗' : '–';
</script>

{#snippet field(
  name: string,
  label: string,
  hint: string,
  required: boolean,
  mode: 'numeric' | 'decimal' | 'text',
)}
  <div class="field">
    <label for={`f-${name}`}>
      {label}{#if required}<span class="req" aria-hidden="true">*</span>{/if}
    </label>
    <input
      id={`f-${name}`}
      {name}
      type="text"
      inputmode={mode}
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      {required}
      aria-invalid={errors[name] ? 'true' : undefined}
      aria-describedby={errors[name] ? `f-${name}-hint f-${name}-error` : `f-${name}-hint`}
      bind:value={texts[name]}
      oninput={() => onInput(name)}
      onblur={() => onBlur(name)}
    />
    <span class="hint" id={`f-${name}-hint`}>{hint}</span>
    {#if errors[name]}
      <span class="error" id={`f-${name}-error`}>
        <span class="sym" aria-hidden="true">⚠</span>{errors[name]}
      </span>
    {/if}
  </div>
{/snippet}

<div class="layout">
  <form class="tool" method="post" novalidate aria-labelledby="form-title" onsubmit={onSubmit}>
    <h2 id="form-title">Your details</h2>

    {#if Object.keys(errors).length > 0 || formError}
      <div class="summary error-summary" tabindex="-1" bind:this={summaryEl}>
        <p><strong>Please fix the following:</strong></p>
        <ul>
          {#if formError}
            <li>{formError}</li>
          {/if}
          {#each Object.entries(errors) as [name, message] (name)}
            <li><a href={`#f-${name}`} onclick={(e) => focusField(name, e)}>{message}</a></li>
          {/each}
        </ul>
      </div>
    {/if}

    <fieldset>
      <legend>Compare with</legend>
      {#each groups as group (group.kind)}
        {#if group.available.length > 0}
          <fieldset class="subgroup">
            <legend>{group.label}</legend>
            {#each group.available as option (option.id)}
              <label class="choice">
                <input
                  type="radio"
                  name="organization"
                  value={option.id}
                  checked={orgId === option.id}
                  onchange={() => chooseOrg(option.id)}
                />
                {option.name}
              </label>
            {/each}
          </fieldset>
        {/if}
      {/each}
      {#if unavailable.length > 0}
        <p class="hint">Not available yet, because the official numbers are still being checked:</p>
        <ul class="hint hint-list">
          {#each groups as group (group.kind)}
            {#if group.unavailable.length > 0}
              <li>
                <strong>{group.label}:</strong>
                {group.unavailable.map((o) => o.shortName).join(', ')}
              </li>
            {/if}
          {/each}
        </ul>
      {/if}
    </fieldset>

    <fieldset class="inline">
      <legend>Units</legend>
      <label class="choice">
        <input
          type="radio"
          name="units"
          value="us"
          checked={system === 'us'}
          onchange={() => changeSystem('us')}
        />
        US (inches, pounds)
      </label>
      <label class="choice">
        <input
          type="radio"
          name="units"
          value="metric"
          checked={system === 'metric'}
          onchange={() => changeSystem('metric')}
        />
        Metric (centimeters, kilograms)
      </label>
    </fieldset>

    <fieldset class="inline" aria-describedby="sex-hint">
      <legend>Minimums to compare with <span class="req" aria-hidden="true">*</span></legend>
      <p class="hint" id="sex-hint">
        Most official standards list separate minimums for men and women. Choose the set you want to
        compare with.
      </p>
      <label class="choice">
        <input
          id="f-sex-male"
          type="radio"
          name="sex"
          value="male"
          required
          bind:group={sex}
          oninput={() => onInput('sex')}
        />
        Male minimums
      </label>
      <label class="choice">
        <input
          type="radio"
          name="sex"
          value="female"
          required
          bind:group={sex}
          oninput={() => onInput('sex')}
        />
        Female minimums
      </label>
      {#if errors.sex}
        <span class="error" id="f-sex-error">
          <span class="sym" aria-hidden="true">⚠</span>{errors.sex}
        </span>
      {/if}
    </fieldset>

    {@render field('age', 'Age', 'Whole years, 17 or older.', true, 'numeric')}

    {#if variant}
      <label class="choice">
        <input
          type="checkbox"
          name="variant"
          bind:checked={useVariant}
          oninput={() => (stale = results !== null)}
        />
        {variant.label}
      </label>
    {/if}

    {#if orgBody.length > 0}
      <fieldset>
        <legend>Body measurements</legend>
        <p class="hint">
          Measure your waist at the navel. The waist-to-height ratio is checked against the rule of
          the organization you chose.
        </p>
        {@render field(
          'height',
          `Height (${system === 'us' ? 'inches' : 'centimeters'})`,
          system === 'us' ? 'For example 70 for 5 ft 10 in.' : 'For example 178.',
          false,
          'decimal',
        )}
        {@render field(
          'waist',
          `Waist (${system === 'us' ? 'inches' : 'centimeters'})`,
          system === 'us' ? 'For example 33.' : 'For example 84.',
          false,
          'decimal',
        )}
        {@render field(
          'weight',
          `Weight, optional (${system === 'us' ? 'pounds' : 'kilograms'})`,
          'Only used to show your BMI for information. It is never used to judge your results.',
          false,
          'decimal',
        )}
      </fieldset>
    {/if}

    {#each orgPoints as standard (standard.id)}
      <fieldset>
        <legend>{standard.name}</legend>
        <p class="hint">
          {#if standard.groups.length > 0}
            This test is scored in points. Fill in the events you have tested, one for each part; if
            you fill in more than one for a part, the best one counts. The waist-to-height ratio
            below adds its own points.
          {:else}
            This test is scored in points. Fill in the events you have tested; leave the others
            empty.
          {/if}
        </p>
        {#each standard.events as event (event.id)}
          {@render field(
            eventKey(standard.id, event.id),
            event.name,
            `Enter ${unitHint(event.unit, system)}.`,
            false,
            event.unit === 'seconds' ? 'text' : 'decimal',
          )}
        {/each}
      </fieldset>
    {/each}

    {#each orgStandards as standard (standard.id)}
      <fieldset>
        <legend>{standard.name}</legend>
        <p class="hint">Fill in the events you have tested. Leave the others empty.</p>
        {#each standard.events as event (event.id)}
          {@render field(
            eventKey(standard.id, event.id),
            event.name,
            `Enter ${unitHint(event.unit, system)}.`,
            false,
            event.unit === 'seconds' ? 'text' : 'decimal',
          )}
        {/each}
      </fieldset>
    {/each}

    <button type="submit">Compare with the official minimums</button>
  </form>

  <div class="side">
    {#if results}
      <section class="results" aria-labelledby="results-title">
        <h2 id="results-title" tabindex="-1" bind:this={resultsHeading}>
          Results for {results.org.name}
        </h2>
        {#if stale}
          <p class="notice">
            You changed something after this comparison. Press the button again to update it.
          </p>
        {/if}

        {#each results.points as item (item.standard.id)}
          <h3>{item.standard.name}</h3>
          {#if item.result.scoredCount > 0}
            <p class="count">
              {#if item.result.groups.length > 0}
                {item.result.scoredCount} of {item.result.totalCount} parts scored. Points counted so
                far:
                {item.result.totalPoints} of {item.result.groups.reduce(
                  (s, g) => s + g.maxPoints,
                  0,
                )}.
                {#if item.result.eventsBelowMinimum > 0}
                  {plural(item.result.eventsBelowMinimum, 'part')} below the minimum, which scores zero.
                {/if}
              {:else}
                {item.result.scoredCount} of {item.result.totalCount} events scored. Points counted so
                far:
                {item.result.totalPoints}.
                {#if item.result.eventsBelowMinimum > 0}
                  {plural(item.result.eventsBelowMinimum, 'event')} below the per-event minimum of
                  {plural(item.result.minPerEvent, 'point')}.
                {/if}
              {/if}
            </p>
          {/if}
          {#if item.result.groups.length > 0}
            <ul class="event-list">
              {#each item.result.groups as part (part.id)}
                <li class={`event ${partClass(part)}`}>
                  <span class="event-name">{part.label}</span>
                  <span class="status">
                    <span class="sym" aria-hidden="true">
                      {part.status !== 'scored' ? '–' : part.meetsMinimum === false ? '✗' : '✓'}
                    </span>{partStatus(part)}
                  </span>
                  {#if part.status === 'scored'}
                    <span class="detail">
                      {part.points} of {part.maxPoints} points{part.eventName
                        ? ' from ' + part.eventName
                        : ''}.
                    </span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
          <ul class="event-list">
            {#each item.result.events as ev (ev.eventId)}
              <li class={`event ${pointsClass(ev)}`}>
                <span class="event-name">{ev.eventName}</span>
                <span class="status">
                  <span class="sym" aria-hidden="true">
                    {ev.status === 'scored' ? (ev.meetsEventMinimum ? '✓' : '✗') : '–'}
                  </span>{pointsStatus(ev)}
                </span>
                {#if ev.status === 'scored' && ev.value !== undefined && ev.points !== undefined}
                  <span class="detail">
                    Your result: {formatValue(ev.unit, ev.value, results.system)}. It earns {plural(
                      ev.points,
                      'point',
                    )}{ev.level ? ` (${ev.level})` : ''}{ev.multiplier !== 1
                      ? ` (counted ${ev.multiplier === 2 ? 'twice' : ev.multiplier + ' times'} in the total: ${ev.countedPoints})`
                      : ''}. {#if item.result.groups.length === 0}At least {plural(
                        ev.minPoints,
                        'point',
                      )} needed in this event.{/if}
                  </span>
                {/if}
              </li>
            {/each}
          </ul>
          {#if item.result.totalStatus === 'incomplete'}
            <p class="notice">
              {#if item.result.groups.length > 0}
                Enter a result for every part to compare your total with the {item.result.minTotal} points
                required.
              {:else}
                Enter a result for every event to compare your total with the {item.result.minTotal} points
                required.
              {/if}
            </p>
          {:else}
            <p class="status-line">
              <span class={`status ${item.result.totalStatus === 'meets' ? 'meets' : 'below'}`}>
                <span class="sym" aria-hidden="true">
                  {item.result.totalStatus === 'meets' ? '✓' : '✗'}
                </span>{item.result.totalStatus === 'meets' ? 'Meets' : 'Below'} the total required: {item
                  .result.totalPoints} of {item.result.minTotal} points
              </span>
            </p>
            {#if item.result.totalStatus === 'below' && item.result.totalPoints >= item.result.minTotal}
              <p class="notice">
                The total is enough, but {item.result.eventsBelowMinimum === 1
                  ? 'one event is'
                  : `${item.result.eventsBelowMinimum} events are`} below its minimum, which fails the
                test.
              </p>
            {/if}
          {/if}
          {#if item.standard.rule.summary}
            <p class="caveat">{item.standard.rule.summary}</p>
          {/if}
          {#if item.result.caveat}
            <p class="caveat">{item.result.caveat}</p>
          {/if}
          <p class="source">
            Source: {item.standard.source.document}{item.standard.source.documentDate
              ? ` (${item.standard.source.documentDate})`
              : ''}. Checked against the official document on {item.standard.source.verifiedAt}.
            {#if item.standard.source.url}
              <a href={item.standard.source.url} target="_blank" rel="noopener noreferrer">
                Official source (opens in a new tab)
              </a>
            {/if}
          </p>
        {/each}

        {#each results.items as item (item.standard.id)}
          <h3>{item.standard.name}</h3>
          {#if item.result.enteredCount > 0}
            <p class="count">
              {item.result.metCount} of {item.result.enteredCount} entered
              {item.result.enteredCount === 1 ? 'event meets' : 'events meet'} the minimum.
              {#if item.result.enteredCount < item.result.totalCount}
                {item.result.totalCount - item.result.enteredCount} not entered.
              {/if}
            </p>
          {/if}
          <ul class="event-list">
            {#each item.result.events as ev (ev.eventId)}
              <li class={`event ${ev.status}`}>
                <span class="event-name">{ev.eventName}</span>
                <span class="status">
                  <span class="sym" aria-hidden="true">{symbol(ev.status)}</span>{statusLabel(
                    ev.status,
                  )}
                </span>
                {#if ev.value !== undefined && ev.minimum !== undefined}
                  <span class="detail">
                    Your result: {formatValue(ev.unit, ev.value, results.system)}. Minimum: {formatValue(
                      ev.unit,
                      ev.minimum,
                      results.system,
                    )}.
                    {describeMargin(ev, results.system)}
                  </span>
                {:else if ev.minimum !== undefined}
                  <span class="detail">
                    Minimum: {formatValue(ev.unit, ev.minimum, results.system)}.
                  </span>
                {/if}
              </li>
            {/each}
          </ul>
          {#if item.result.completeness === 'minimums-only' && item.result.caveat}
            <p class="caveat"><strong>Not the whole requirement.</strong> {item.result.caveat}</p>
          {/if}
          <p class="source">
            Source: {item.standard.source.document}{item.standard.source.documentDate
              ? ` (${item.standard.source.documentDate})`
              : ''}. Checked against the official document on {item.standard.source.verifiedAt}.
            {#if item.standard.source.url}
              <a href={item.standard.source.url} target="_blank" rel="noopener noreferrer">
                Official source (opens in a new tab)
              </a>
            {/if}
          </p>
        {/each}

        {#each results.body as entry (entry.rule.id)}
          <h3>{entry.rule.name}</h3>
          <p class="status-line">
            <span class={`status ${entry.result.status === 'within' ? 'meets' : 'below'}`}>
              <span class="sym" aria-hidden="true">
                {entry.result.status === 'within' ? '✓' : '✗'}
              </span>
              {entry.result.status === 'within' ? 'Within the limit' : 'Not within the limit'}
            </span>
          </p>
          <p class="detail">
            Your waist-to-height ratio is {entry.result.ratio.toFixed(4)} (waist divided by height). The
            limit is {entry.result.atLimit === 'within'
              ? `${entry.result.limit} or less`
              : `below ${entry.result.limit}`}.
            {#if entry.result.usedWaistInches !== undefined && entry.result.usedHeightInches !== undefined}
              The standard rounds measurements down, so it uses a height of {entry.result
                .usedHeightInches}
              in and a waist of {entry.result.usedWaistInches} in.
            {/if}
            {#if entry.result.comparedRatio !== entry.result.ratio}
              It is rounded down to {entry.result.comparedRatio} for the comparison.
            {/if}
          </p>
          {#if entry.result.status === 'over'}
            <p class="caveat">{entry.result.ifOver}</p>
          {/if}
          {#if entry.rule.notes.length > 0}
            <ul class="notes">
              {#each entry.rule.notes as note (note)}
                <li>{note}</li>
              {/each}
            </ul>
          {/if}
          <p class="source">
            Source: {entry.rule.source.document}. Checked against the official document on {entry
              .rule.source.verifiedAt}.
            {#if entry.rule.source.url}
              <a href={entry.rule.source.url} target="_blank" rel="noopener noreferrer">
                Official source (opens in a new tab)
              </a>
            {/if}
          </p>
        {/each}

        {#if results.bmi !== undefined}
          <h3>Body mass index (information only)</h3>
          <p class="detail">
            Your BMI is {results.bmi.toFixed(1)}. BMI does not measure fitness and is not used to
            judge any result above.
          </p>
        {/if}

        {#if results.org.pending.length > 0}
          <p class="caveat">
            <strong>Not included yet for {results.org.shortName}:</strong>
            {results.org.pending.join('; ')}.
          </p>
        {/if}

        <p class="disclaimer">
          This is a comparison of numbers you typed with published minimums. It is not medical
          advice and does not predict whether you will be selected. If you feel pain, dizziness or
          chest discomfort while testing, stop and talk to a health professional. Check the official
          source before you rely on any number.
        </p>
      </section>
    {:else}
      <aside class="placeholder" aria-labelledby="placeholder-title">
        <h2 id="placeholder-title">Your comparison</h2>
        <p>
          Choose an organization, enter your age and at least one result, then press the button. The
          comparison appears here, event by event, with the official source for each number.
        </p>
      </aside>
    {/if}
  </div>
</div>

<style>
  fieldset {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow);
    padding: 0.9rem 1.1rem 1.1rem;
    margin: 0;
    display: grid;
    gap: 0.6rem;
  }

  legend {
    font-weight: 700;
    padding-inline: 0.4rem;
    font-size: 1.02rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field label {
    font-weight: 600;
  }

  input[type='text'],
  select {
    font: inherit;
    padding: 0.65rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg);
    color: var(--fg);
    min-block-size: 2.75rem;
  }

  input[type='text']:hover,
  select:hover {
    border-color: var(--accent);
  }

  input[aria-invalid='true'] {
    border-color: var(--warn);
    border-width: 2px;
  }

  .choice {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-block-size: 2.75rem;
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg);
    cursor: pointer;
  }

  .choice:hover {
    border-color: var(--accent);
  }

  .choice:has(input:checked) {
    border-color: var(--accent);
    background: var(--accent-soft);
    font-weight: 600;
  }

  .choice input {
    inline-size: 1.15rem;
    block-size: 1.15rem;
    flex-shrink: 0;
    accent-color: var(--accent);
  }

  .sym {
    margin-inline-end: 0.4em;
  }

  .req {
    margin-inline-start: 0.25em;
  }

  .hint {
    color: var(--muted);
    font-size: 0.92rem;
    margin: 0;
  }

  .hint-list {
    margin: 0;
    padding-inline-start: 1.25rem;
  }

  .error {
    color: var(--warn);
    font-weight: 600;
    font-size: 0.95rem;
  }

  .layout {
    display: grid;
    gap: 1.5rem;
    align-items: start;
  }

  @media (min-width: 64rem) {
    .layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
      gap: 2rem;
    }

    .side .results {
      margin-block-start: 0;
    }
  }

  .placeholder {
    padding: 1.25rem;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    color: var(--muted);
  }

  .placeholder h2 {
    margin-block: 0 0.5rem;
    font-size: 1.15rem;
    color: var(--fg);
  }

  .placeholder p {
    margin: 0;
  }

  fieldset.inline {
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  }

  fieldset.inline > legend,
  fieldset.inline > .hint,
  fieldset.inline > .error {
    grid-column: 1 / -1;
  }

  .field input[type='text'] {
    max-inline-size: 16rem;
  }

  #f-age {
    max-inline-size: 8rem;
  }

  .tool,
  .results {
    display: grid;
    gap: 1.1rem;
  }

  .subgroup {
    border: 0;
    box-shadow: none;
    background: transparent;
    padding: 0;
    gap: 0.4rem;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  }

  .subgroup legend {
    grid-column: 1 / -1;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    padding-inline: 0;
    margin-block-end: 0.15rem;
  }

  .error-summary {
    border: 2px solid var(--warn);
    background: var(--warn-bg);
    border-radius: var(--radius);
    padding: 0.85rem 1.1rem;
  }

  .error-summary p,
  .error-summary ul {
    margin: 0;
  }

  .error-summary ul {
    padding-inline-start: 1.25rem;
  }

  .error-summary a {
    color: var(--warn);
  }

  button[type='submit'] {
    font: inherit;
    font-weight: 700;
    font-size: 1.05rem;
    padding: 0.85rem 1.6rem;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: var(--accent-fg);
    cursor: pointer;
    justify-self: start;
    box-shadow: var(--shadow);
  }

  button[type='submit']:hover {
    background: var(--accent-strong);
    color: var(--bg);
  }

  .results {
    margin-block-start: 2.25rem;
    padding: 1.25rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 1.25);
    box-shadow: var(--shadow);
  }

  .results h2 {
    margin-block: 0;
  }

  .results h3 {
    margin-block: 0.75rem 0;
    font-size: 1.1rem;
  }

  .event-list,
  .notes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.55rem;
  }

  .event {
    display: grid;
    gap: 0.15rem;
    padding: 0.7rem 0.9rem;
    border-radius: var(--radius-sm);
    border-inline-start: 6px solid var(--border);
    background: var(--neutral-bg);
  }

  .event.meets {
    border-inline-start-color: var(--good);
    background: var(--good-bg);
  }

  .event.below {
    border-inline-start-color: var(--warn);
    background: var(--warn-bg);
  }

  .event-name {
    font-weight: 700;
  }

  .status {
    font-weight: 600;
  }

  .status.meets {
    color: var(--good);
  }

  .status.below {
    color: var(--warn);
  }

  .detail,
  .source,
  .count,
  .notice,
  .caveat,
  .disclaimer {
    margin: 0;
  }

  .source,
  .disclaimer,
  .notes {
    color: var(--muted);
    font-size: 0.9rem;
  }

  .caveat,
  .notice {
    border: 1px solid var(--border);
    background: var(--surface-2);
    padding: 0.65rem 0.9rem;
    border-radius: var(--radius-sm);
  }

  .notes {
    list-style: disc;
    padding-inline-start: 1.25rem;
  }
</style>
