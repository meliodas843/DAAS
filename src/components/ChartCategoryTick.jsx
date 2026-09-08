import { CHART_COLOR, CHART_FONT } from "./chartTheme";

function wrapLabel(text, maxLength) {
  if (!text) return [""];

  const words = String(text).split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxLength) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);

  return lines.slice(0, 3);
}

// Shared Y-axis category label for row-based bar charts (ChangeBarChart,
// HorizontalBarChart). Previously each file had its own copy: one wrapped
// text and used fontSize 12, the other didn't wrap and used fontSize 10.
// `offset` and `maxLength` stay per-chart props since yAxisWidth differs.
export default function ChartCategoryTick({ x, y, payload, offset = 14, maxLength = 24 }) {
  const lines = wrapLabel(payload?.value || "", maxLength);
  const lineHeight = 12;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  return (
    <text
      x={x - offset}
      y={startY}
      textAnchor="end"
      fill={CHART_COLOR.categoryTick}
      fontSize={CHART_FONT.categoryTick.fontSize}
      fontWeight={CHART_FONT.categoryTick.fontWeight}
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x - offset} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
