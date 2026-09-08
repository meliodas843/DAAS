import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import HoverScroll from "./HoverScroll";
import { formatCompact, formatTooltip, formatMonth } from "./chartFormat";
import { CHART_COLOR, CHART_BAR, CHART_GAP, CHART_FONT, CHART_ANIMATION } from "./chartTheme";

export default function MonthlyBarChart({
  data = [],
  color = CHART_COLOR.positive,
  language = "mn",
  valueLabel
}) {
  const tooltipLabel = valueLabel || (language === "en" ? "Amount" : "Дүн");

  const safeData = Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        month: formatMonth(item.month || item.name || ""),
        value: Number(item.value || 0)
      }))
    : [];

  const maxValue = Math.max(...safeData.map((item) => item.value), 0);
  const calculatedMax = maxValue > 0 ? maxValue * 1.22 : 1;
  const chartWidth = Math.max(620, safeData.length * 60);

  const averageValue =
    safeData.length > 0
      ? safeData.reduce((sum, item) => sum + item.value, 0) / safeData.length
      : 0;
  const averageLabel = language === "en" ? "Avg" : "Дундаж";

  return (
    <div className="monthly-bar-chart" style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 2,
          right: 4,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 6,
          pointerEvents: "none"
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 2,
            borderRadius: 1,
            background: CHART_COLOR.average
          }}
        />
        <span
          style={{
            color: CHART_COLOR.average,
            fontSize: CHART_FONT.axisTick.fontSize,
            fontWeight: 700
          }}
        >
          {averageLabel}: {formatCompact(averageValue)}
        </span>
      </div>

      <HoverScroll direction="horizontal" className="monthly-bar-hover-scroll">
        <div className="monthly-bar-chart-main" style={{ width: `${chartWidth}px`, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={safeData}
              margin={{ top: 34, right: 46, bottom: 4, left: 0 }}
              barCategoryGap={CHART_GAP.categoryPercent}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLOR.grid} />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                interval={0}
                height={28}
                tickMargin={7}
                tick={{ fill: CHART_COLOR.axisTick, ...CHART_FONT.axisTick }}
                tickFormatter={(value) => String(value).split("/")[1] || value}
              />

              <YAxis
                type="number"
                domain={[0, calculatedMax]}
                axisLine={false}
                tickLine={false}
                width={38}
                tick={{ fill: CHART_COLOR.axisTick, fontSize: CHART_FONT.axisTick.fontSize }}
                tickFormatter={formatCompact}
              />

              <Tooltip
                cursor={{ fill: CHART_COLOR.tooltipCursor }}
                formatter={(value) => [formatTooltip(value), tooltipLabel]}
                labelFormatter={formatMonth}
              />

              <Bar
                dataKey="value"
                fill={color}
                barSize={CHART_BAR.size}
                radius={[CHART_BAR.radius, CHART_BAR.radius, 0, 0]}
                {...CHART_ANIMATION}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={formatCompact}
                  style={{ fill: CHART_COLOR.label, ...CHART_FONT.label }}
                />
              </Bar>

              <ReferenceLine
                y={averageValue}
                stroke={CHART_COLOR.average}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HoverScroll>
    </div>
  );
}