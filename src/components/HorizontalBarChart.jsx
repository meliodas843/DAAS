import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useEffect, useRef, useState } from "react";

import HoverScroll from "./HoverScroll";
import ChartCategoryTick from "./ChartCategoryTick";
import { formatCompact, formatTooltip } from "./chartFormat";
import { CHART_COLOR, CHART_BAR, CHART_GAP, CHART_FONT, CHART_ANIMATION, CHART_ROW } from "./chartTheme";

function ValueLabel({ x = 0, y = 0, width = 0, height = 0, value }) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number === 0) return null;

  const centerY = y + height / 2;
  const label = formatCompact(number);

  if (number > 0) {
    return (
      <text
        x={x + width + 8}
        y={centerY}
        dominantBaseline="middle"
        textAnchor="start"
        fill={CHART_COLOR.label}
        fontSize={CHART_FONT.label.fontSize}
        fontWeight={CHART_FONT.label.fontWeight}
      >
        {label}
      </text>
    );
  }

  return (
    <text
      x={x + width - 8}
      y={centerY}
      dominantBaseline="middle"
      textAnchor="end"
      fill={CHART_COLOR.negative}
      fontSize={CHART_FONT.label.fontSize}
      fontWeight={CHART_FONT.label.fontWeight}
    >
      {label}
    </text>
  );
}

// Fixed axis domain — deliberately NOT derived from data, so the 0-gridline
// (and every other tick) sits at the same screen position regardless of
// which dataset or view is loaded. Bars for values above AXIS_MAX still
// render correctly since allowDataOverflow is set below; they just extend
// past the last gridline instead of the whole scale rescaling.
const AXIS_MIN = -1_000_000_000;
const AXIS_MAX = 4_000_000_000;
const AXIS_STEP = 1_000_000_000;

function createFixedTicks(min, max, step) {
  const ticks = [];
  for (let value = min; value <= max; value += step) {
    ticks.push(value);
  }
  return ticks;
}

export default function HorizontalBarChart({
  data = [],
  color = CHART_COLOR.positive,
  yAxisWidth = 220,
  barSize = CHART_BAR.size,
  language = "mn",
  valueLabel
}) {
  const tooltipLabel = valueLabel || (language === "en" ? "Amount" : "Дүн");

  const safeData = Array.isArray(data)
    ? data.map((item) => ({ ...item, value: Number(item.value || 0) }))
    : [];

  const axisTicks = createFixedTicks(AXIS_MIN, AXIS_MAX, AXIS_STEP);

  const leftMargin = 0;
  const rightMargin = 70;
  const visibleHeight = 285;
  const bottomAxisHeight = 38; // matches .shared-bottom-axis's fixed height
  const chartHeight = Math.max(visibleHeight + 1, safeData.length * CHART_ROW.height + 12);

  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerHeight(entry.contentRect.height);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const availableChartHeight = Math.max(0, containerHeight - bottomAxisHeight);
  const renderedHeight = Math.max(chartHeight, availableChartHeight);

  return (
    <div className="fixed-axis-chart" ref={containerRef}>
      <HoverScroll direction="vertical" className="fixed-axis-chart-hover-scroll">
        <div className="fixed-axis-chart-main" style={{ height: `${renderedHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={safeData}
              layout="vertical"
              margin={{ top: 12, right: rightMargin, bottom: 8, left: leftMargin }}
              barCategoryGap={CHART_GAP.categoryPx}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_COLOR.grid} />

              <XAxis type="number" domain={[AXIS_MIN, AXIS_MAX]} hide allowDataOverflow />

              <YAxis
                type="category"
                dataKey="name"
                width={yAxisWidth}
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={<ChartCategoryTick offset={14} maxLength={24} />}
              />

              <Tooltip
                cursor={{ fill: CHART_COLOR.tooltipCursor }}
                formatter={(value) => [formatTooltip(value), tooltipLabel]}
              />

              <Bar
                dataKey="value"
                fill={color}
                barSize={barSize}
                radius={[0, CHART_BAR.radius, CHART_BAR.radius, 0]}
                {...CHART_ANIMATION}
              >
                <LabelList dataKey="value" content={<ValueLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HoverScroll>

      <div className="shared-bottom-axis">
        <div
          className="shared-bottom-axis-track"
          style={{
            marginLeft: `${yAxisWidth + leftMargin}px`,
            marginRight: `${rightMargin}px`
          }}
        >
          {axisTicks.map((tick) => {
            const position = ((tick - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100;

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