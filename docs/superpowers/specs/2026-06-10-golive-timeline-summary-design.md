# Golive Timeline Summary Design

## Goal

Explain the timeline total by separating ports with commitment dates from ports categorized as `Tanpa Komitmen`.

## Summary Calculation

For the currently displayed timeline scope:

```text
uncommitted ports = sum of uncommittedPorts
committed ports = totalPorts - uncommitted ports
```

The scope is all displayed months in the monthly view and the selected month in the daily drilldown.

## Visual Design

Render two adjacent summary badges:

- Green badge: `{committed} total port komitmen`
- Hatched gray badge: `+ {uncommitted} port tanpa komitmen`

The gray badge reuses the same visual language as the `Tanpa Komitmen` legend. Both badges remain visible when a value is zero so the meaning of the total stays explicit.

## PDF

The PDF timeline heading uses the same breakdown in one compact line:

```text
{committed} port komitmen + {uncommitted} tanpa komitmen
```

## Non-Goals

- Do not change timeline grouping.
- Do not change category classification.
- Do not change chart totals or filter behavior.

## Testing

Add unit coverage for a summary helper that:

- Sums uncommitted ports across multiple entries.
- Derives committed ports from the supplied total.
- Supports a selected-month entry using the same calculation.

