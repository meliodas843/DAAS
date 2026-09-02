// Shared visual constants for every Recharts bar chart in the dashboard.
// Import from here instead of hardcoding colors/sizes per component —
// this is the single place to tweak the "house style" for all charts at once.

export const CHART_COLOR = {
  positive: "#2966e8",
  negative: "#dc2626", // one red for both negative bars and negative labels
  grid: "#edf1f7",
  label: "#101827",
  axisTick: "#8292aa", // numeric axis ticks (Monthly's Y axis)
  categoryTick: "#536177", // Y-axis category names (Change, Horizontal)
  average: "#f59e0b", // reference/average line — kept distinct from bar colors
  tooltipCursor: "rgba(15, 23, 42, 0.025)"
};

export const CHART_BAR = {
  size: 24, // same physical bar thickness on every chart
  radius: 5 // same corner-rounding radius everywhere
};

export const CHART_GAP = {
  categoryPercent: "10%", // column charts (Monthly) — gap between x-axis categories
  categoryPx: 16 // row charts (Change, Horizontal) — gap between rows
};

export const CHART_FONT = {
  label: { fontSize: 10.5, fontWeight: 800 },
  axisTick: { fontSize: 10, fontWeight: 500 },
  categoryTick: { fontSize: 11, fontWeight: 500 }
};

export const CHART_ANIMATION = {
  isAnimationActive: true,
  animationBegin: 100,
  animationDuration: 1000,
  animationEasing: "ease-out"
};

export const CHART_ROW = {
  height: 56 // px per row, used to size scrollable row-based charts
};