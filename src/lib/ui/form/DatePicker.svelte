<!--
	@component
	Date or date-and-time field on Bits UI: typed segments in the page locale
	plus a calendar in a popover (weeks from Monday, 24-hour clock). `value` is
	the stored string (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`), never shifted by
	time zones. `label` names the field group; the required marker stays outside
	the accessible name.
-->
<script lang="ts">
	import { DatePicker } from 'bits-ui';
	import type { DateValue } from '@internationalized/date';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import Icon from '../Icon.svelte';
	import { fromDateValue, toDateValue, type Granularity } from './dates.js';

	let {
		value = $bindable(''),
		label,
		granularity,
		describedBy,
		invalid = false,
		required = false
	}: {
		value?: string;
		label: string;
		granularity: Granularity;
		describedBy?: string;
		invalid?: boolean;
		required?: boolean;
	} = $props();

	const locale = getLocale() === 'de' ? 'de-DE' : 'en-GB';
</script>

<DatePicker.Root
	bind:value={
		() => toDateValue(value, granularity),
		(next: DateValue | undefined) => (value = fromDateValue(next, granularity))
	}
	{locale}
	{granularity}
	{required}
	hourCycle={24}
	weekStartsOn={1}
	fixedWeeks
	closeOnDateSelect={granularity === 'day'}
>
	<span class="daily-label-row"
		><DatePicker.Label class="daily-field-label">{label}</DatePicker.Label>{#if required}<span
				class="daily-req"
				aria-hidden="true">*</span
			>{/if}</span
	>
	<DatePicker.Input
		class="daily-control daily-date-input"
		aria-describedby={describedBy}
		aria-invalid={invalid || undefined}
	>
		{#snippet children({ segments })}
			<span class="daily-segments">
				{#each segments as { part, value: text }, i (i)}
					<DatePicker.Segment {part} class="daily-segment">{text}</DatePicker.Segment>
				{/each}
			</span>
			<DatePicker.Trigger class="daily-icon-button" aria-label={m.date_open_calendar()}>
				<Icon name="calendar" size={16} />
			</DatePicker.Trigger>
		{/snippet}
	</DatePicker.Input>
	<DatePicker.Content class="daily-popover daily-calendar-popover" sideOffset={6}>
		<DatePicker.Calendar class="daily-calendar">
			{#snippet children({ months, weekdays })}
				<DatePicker.Header class="daily-calendar-header">
					<DatePicker.PrevButton class="daily-icon-button" aria-label={m.date_previous_month()}
						>‹</DatePicker.PrevButton
					>
					<DatePicker.Heading class="daily-calendar-heading" />
					<DatePicker.NextButton class="daily-icon-button" aria-label={m.date_next_month()}
						>›</DatePicker.NextButton
					>
				</DatePicker.Header>
				{#each months as month (month.value.toString())}
					<DatePicker.Grid class="daily-calendar-grid">
						<DatePicker.GridHead>
							<DatePicker.GridRow class="daily-calendar-row">
								{#each weekdays as day, i (i)}
									<DatePicker.HeadCell class="daily-calendar-weekday">{day}</DatePicker.HeadCell>
								{/each}
							</DatePicker.GridRow>
						</DatePicker.GridHead>
						<DatePicker.GridBody>
							{#each month.weeks as week (week[0].toString())}
								<DatePicker.GridRow class="daily-calendar-row">
									{#each week as date (date.toString())}
										<DatePicker.Cell {date} month={month.value} class="daily-calendar-cell">
											<DatePicker.Day class="daily-calendar-day" />
										</DatePicker.Cell>
									{/each}
								</DatePicker.GridRow>
							{/each}
						</DatePicker.GridBody>
					</DatePicker.Grid>
				{/each}
			{/snippet}
		</DatePicker.Calendar>
	</DatePicker.Content>
</DatePicker.Root>
