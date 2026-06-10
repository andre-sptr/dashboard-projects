# Golive Actual-Date Timeline Design

## Goal

Make the "Tanggal Golive per Bulan (by Port)" chart reflect actual golive dates while preserving the existing commitment-status colors and visibly including actual golive records that have no commitment date.

## Timeline Date

Each project contributes to at most one timeline date:

1. Use `TANGGAL_GOLIVE` when it is a valid date.
2. Otherwise use `KOMITMEN_GOLIVE` when it is a valid date.
3. Exclude the project when neither value is a valid date.

This means completed projects appear in the month and day when they actually went live. Projects that have not gone live remain visible at their commitment date.

## Categories

The chart uses four mutually exclusive port categories:

| Condition | Category | Visual |
| --- | --- | --- |
| Actual and commitment exist; actual is on or before commitment | Sesuai komitmen | Green |
| No actual; commitment is today or later | Belum lewat | Solid gray |
| Actual and commitment exist; actual is after commitment | Melewati komitmen | Red |
| No actual; commitment is before today | Melewati komitmen | Red |
| Actual exists; commitment is missing or invalid | Tanpa Komitmen | Gray hatch |

`Tanpa Komitmen` uses the same gray family as `Belum lewat`. A hatch pattern and lower visual density distinguish it without introducing another semantic color.

## Chart Behavior

- Monthly bars use the resolved timeline date.
- Clicking a month opens daily bars using the same resolved date.
- Stacks are ordered green, solid gray, hatched gray, then red.
- The total label appears above the highest non-zero stack.
- Tooltips and the legend name all four categories explicitly.
- The summary badge says `total port timeline`, because the chart is no longer limited to records with commitment dates.
- Empty-state copy mentions both actual and commitment dates.

## PDF Export

The PDF chart uses the same four categories and totals. `Tanpa Komitmen` is rendered as a lighter gray segment because the PDF helper currently supports solid fills rather than SVG patterns.

## Testing

Regression coverage must prove:

- An actual January golive with no commitment appears in January as `Tanpa Komitmen`.
- A project with actual and commitment dates in different months is grouped by the actual month.
- A project without an actual date is grouped by its commitment month.
- Existing green, pending-gray, and red classification rules remain unchanged.
- Chart total labels move to the `Tanpa Komitmen` stack when it is the highest non-zero stack.

