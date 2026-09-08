import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import HoverScroll from "./HoverScroll";
import ChartCategoryTick from "./ChartCategoryTick";
import { formatCompact, formatTooltip } from "./chartFormat";
import {
  CHART_COLOR,
  CHART_BAR,
  CHART_GAP,
  CHART_FONT,
  CHART_ANIMATION,
  CHART_ROW
} from "./chartTheme";

// Rounds only the corners on one side of the rect, leaving the other side
// square. Used so each bar rounds off only its "far" end (away from the
// zero baseline) — same convention as HorizontalBarChart's radius=[0,r,r,0].
function roundedRectPath(x, y, width, height, radius, roundLeft, roundRight) {
  const r = Math.max(0, Math.min(radius, height / 2, width));
  const left = x;
  const right = x + width;
  const top = y;
  const bottom = y + height;

  const tl = roundLeft ? r : 0;
  const bl = roundLeft ? r : 0;
  const tr = roundRight ? r : 0;
  const br = roundRight ? r : 0;

  return `
    M ${left + tl} ${top}
    L ${right - tr} ${top}
    Q ${right} ${top} ${right} ${top + tr}
    L ${right} ${bottom - br}
    Q ${right} ${bottom} ${right - br} ${bottom}
    L ${left + bl} ${bottom}
    Q ${left} ${bottom} ${left} ${bottom - bl}
    L ${left} ${top + tl}
    Q ${left} ${top} ${left + tl} ${top}
    Z
  `;
}

function CustomBarShape(props) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const value = Number(payload?.value || 0);

  if (!Number.isFinite(value) || value === 0) return null;

  const negative = value < 0;
  const barFill = negative ? CHART_COLOR.negative : CHART_COLOR.positive;
  const labelFill = negative ? CHART_COLOR.negative : CHART_COLOR.label;

  const actualWidth = Math.max(Math.abs(width), 2);
  const rectX = negative ? x + width : x;
  const centerY = y + height / 2;
  const labelX = negative ? rectX - 12 : rectX + actualWidth + 12;

  const path = roundedRectPath(rectX, y, actualWidth, height, CHART_BAR.radius, negative, !negative);

  return (
    <g>
      <path d={path} fill={barFill} />
      <text
        x={labelX}
        y={centerY}
        dominantBaseline="middle"
        textAnchor={negative ? "end" : "start"}
        fill={labelFill}
        fontSize={CHART_FONT.label.fontSize}
        fontWeight={CHART_FONT.label.fontWeight}
      >
        {formatCompact(value)}
      </text>
    </g>
  );
}

function calculateAxis(data) {
  const values = data.map((item) => Number(item.value || 0));
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const maxAbsolute = Math.max(Math.abs(minValue), Math.abs(maxValue), 1);

  let step = 500_000_000;
  if (maxAbsolute > 2_000_000_000) step = 1_000_000_000;

  const paddedMaximum = maxAbsolute * 1.18;
  const edge = Math.ceil(paddedMaximum / step) * step;

  return { min: -edge, max: edge, step };
}

function createTicks(min, max, step) {
  const ticks = [];
  for (let value = min; value <= max; value += step) {
    ticks.push(value);
  }
  return ticks;
}

export default function ChangeBarChart({ data = [], language = "mn", valueLabel, yAxisWidth = 90 }) {
  const tooltipLabel = valueLabel || (language === "en" ? "Change" : "Өөрчлөлт");

  const safeData = Array.isArray(data)
    ? data.map((item) => ({ ...item, value: Number(item.value || 0) }))
    : [];

  const { min: axisMin, max: axisMax, step: axisStep } = calculateAxis(safeData);
  const axisTicks = createTicks(axisMin, axisMax, axisStep);

  const chartLeftMargin = 0;
  const chartRightMargin = 65;
  const bottomAxisRightMargin = 45;
  const visibleHeight = 285;

  const chartHeight = Math.max(visibleHeight + 1, safeData.length * CHART_ROW.height + 12);

  return (
    <div className="change-bar-chart">
      <HoverScroll direction="vertical" className="change-bar-hover-scroll">
        <div className="change-bar-chart-main" style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={safeData}
              layout="vertical"
              margin={{ top: 5, right: chartRightMargin, bottom: 0, left: chartLeftMargin }}
              barCategoryGap={CHART_GAP.categoryPx}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_COLOR.grid} />

              <XAxis type="number" domain={[axisMin, axisMax]} hide allowDataOverflow={false} />

              <YAxis
                type="category"
                dataKey="name"
                width={yAxisWidth}
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={<ChartCategoryTick offset={14} maxLength={16} />}
              />

              <Tooltip
                cursor={{ fill: CHART_COLOR.tooltipCursor }}
                formatter={(value) => [formatTooltip(value), tooltipLabel]}
              />

              <Bar dataKey="value" barSize={CHART_BAR.size} shape={<CustomBarShape />} {...CHART_ANIMATION} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HoverScroll>

      <div className="shared-bottom-axis">
        <div
          className="shared-bottom-axis-track"
          style={{
            marginLeft: `${yAxisWidth + chartLeftMargin}px`,
            marginRight: `${bottomAxisRightMargin}px`
          }}
        >
          {axisTicks.map((tick) => {
            const position = ((tick - axisMin) / (axisMax - axisMin)) * 100;

            return (
              <span key={tick} className="shared-bottom-axis-tick" style={{ left: `${position}%` }}>
                {formatCompact(tick)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}